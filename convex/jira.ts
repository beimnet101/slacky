import { action, mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { auth } from "./auth";
import { api } from "./_generated/api";

function jiraAuthHeader(email: string, apiToken: string) {
    return "Basic " + btoa(`${email}:${apiToken}`);
}

function cleanDomain(domain: string) {
    return domain.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

// ==================== Queries ====================

export const getMyLink = query({
    args: { workspaceId: v.id("workspaces") },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) return null;
        const member = await ctx.db
            .query("members")
            .withIndex("by_workspace_id_user_id", (q) =>
                q.eq("workspaceId", args.workspaceId).eq("userId", userId)
            )
            .unique();
        if (!member) return null;
        return await ctx.db
            .query("jiraMemberLinks")
            .withIndex("by_workspace_member", (q) =>
                q.eq("workspaceId", args.workspaceId).eq("memberId", member._id)
            )
            .unique();
    },
});

export const getWorkspaceLinks = query({
    args: { workspaceId: v.id("workspaces") },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) return [];
        const links = await ctx.db
            .query("jiraMemberLinks")
            .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
            .collect();
        return links.map((l) => ({
            memberId: l.memberId,
            jiraAccountId: l.jiraAccountId,
            jiraDisplayName: l.jiraDisplayName,
            jiraAvatarUrl: l.jiraAvatarUrl,
            jiraEmail: l.jiraEmail,
        }));
    },
});

export const getConnection = query({
    args: { workspaceId: v.id("workspaces") },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) return null;
        const connection = await ctx.db
            .query("jiraConnections")
            .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
            .unique();
        if (!connection) return null;
        return {
            ...connection,
            apiToken: "****" + connection.apiToken.slice(-4),
        };
    },
});

// ==================== Mutations ====================

export const linkMemberAccount = mutation({
    args: {
        workspaceId: v.id("workspaces"),
        jiraAccountId: v.string(),
        jiraEmail: v.string(),
        jiraDisplayName: v.string(),
        jiraAvatarUrl: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Unauthorized");
        const member = await ctx.db
            .query("members")
            .withIndex("by_workspace_id_user_id", (q) =>
                q.eq("workspaceId", args.workspaceId).eq("userId", userId)
            )
            .unique();
        if (!member) throw new Error("Unauthorized");
        const existing = await ctx.db
            .query("jiraMemberLinks")
            .withIndex("by_workspace_member", (q) =>
                q.eq("workspaceId", args.workspaceId).eq("memberId", member._id)
            )
            .unique();
        if (existing) {
            await ctx.db.patch(existing._id, {
                jiraAccountId: args.jiraAccountId,
                jiraEmail: args.jiraEmail,
                jiraDisplayName: args.jiraDisplayName,
                jiraAvatarUrl: args.jiraAvatarUrl,
            });
            return existing._id;
        } else {
            return await ctx.db.insert("jiraMemberLinks", {
                workspaceId: args.workspaceId,
                memberId: member._id,
                jiraAccountId: args.jiraAccountId,
                jiraEmail: args.jiraEmail,
                jiraDisplayName: args.jiraDisplayName,
                jiraAvatarUrl: args.jiraAvatarUrl,
            });
        }
    },
});

export const unlinkMemberAccount = mutation({
    args: { workspaceId: v.id("workspaces") },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Unauthorized");
        const member = await ctx.db
            .query("members")
            .withIndex("by_workspace_id_user_id", (q) =>
                q.eq("workspaceId", args.workspaceId).eq("userId", userId)
            )
            .unique();
        if (!member) throw new Error("Unauthorized");
        const existing = await ctx.db
            .query("jiraMemberLinks")
            .withIndex("by_workspace_member", (q) =>
                q.eq("workspaceId", args.workspaceId).eq("memberId", member._id)
            )
            .unique();
        if (existing) {
            await ctx.db.delete(existing._id);
        }
    },
});

export const saveConnection = mutation({
    args: {
        workspaceId: v.id("workspaces"),
        domain: v.string(),
        email: v.string(),
        apiToken: v.string(),
        notificationChannelId: v.optional(v.id("channels")),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("unauthorized");

        const member = await ctx.db
            .query("members")
            .withIndex("by_workspace_id_user_id", (q) =>
                q.eq("workspaceId", args.workspaceId).eq("userId", userId)
            )
            .unique();
        if (!member || member.role !== "admin") throw new Error("unauthorized");

        const cleanedDomain = args.domain.replace(/^https?:\/\//, "").replace(/\/$/, "");

        const existing = await ctx.db
            .query("jiraConnections")
            .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
            .unique();

        if (existing) {
            await ctx.db.patch(existing._id, {
                domain: cleanedDomain,
                email: args.email,
                apiToken: args.apiToken,
                notificationChannelId: args.notificationChannelId,
                connectedBy: member._id,
            });
            return existing._id;
        } else {
            return await ctx.db.insert("jiraConnections", {
                workspaceId: args.workspaceId,
                domain: cleanedDomain,
                email: args.email,
                apiToken: args.apiToken,
                notificationChannelId: args.notificationChannelId,
                connectedBy: member._id,
            });
        }
    },
});

export const removeConnection = mutation({
    args: { workspaceId: v.id("workspaces") },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("unauthorized");

        const member = await ctx.db
            .query("members")
            .withIndex("by_workspace_id_user_id", (q) =>
                q.eq("workspaceId", args.workspaceId).eq("userId", userId)
            )
            .unique();
        if (!member || member.role !== "admin") throw new Error("unauthorized");

        const existing = await ctx.db
            .query("jiraConnections")
            .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
            .unique();
        if (existing) {
            await ctx.db.delete(existing._id);
        }
    },
});

// Internal mutation used by HTTP webhook
export const createSystemMessage = internalMutation({
    args: {
        workspaceId: v.id("workspaces"),
        channelId: v.id("channels"),
        memberId: v.id("members"),
        body: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("messages", {
            body: args.body,
            memberId: args.memberId,
            workspaceId: args.workspaceId,
            channelId: args.channelId,
        });
    },
});

// ==================== Actions ====================

export const testConnection = action({
    args: {
        domain: v.string(),
        email: v.string(),
        apiToken: v.string(),
    },
    handler: async (_ctx, args): Promise<{ name: string; avatarUrl: string }> => {
        const domain = cleanDomain(args.domain);
        const resp = await fetch(`https://${domain}/rest/api/3/myself`, {
            headers: {
                Authorization: jiraAuthHeader(args.email, args.apiToken),
                Accept: "application/json",
            },
        });
        if (!resp.ok) {
            const text = await resp.text();
            throw new Error(`Jira auth failed: ${resp.status} ${text}`);
        }
        const data = await resp.json();
        return {
            name: data.displayName as string,
            avatarUrl: (data.avatarUrls?.["48x48"] ?? data.avatarUrls?.["32x32"] ?? "") as string,
        };
    },
});

export const getProjects = action({
    args: { workspaceId: v.id("workspaces") },
    handler: async (ctx, args): Promise<{ id: string; key: string; name: string }[]> => {
        const conn = await ctx.runQuery(api.jiraHelpers.getConnectionInternal, { workspaceId: args.workspaceId });
        if (!conn) throw new Error("Jira not connected");
        const resp = await fetch(`https://${conn.domain}/rest/api/3/project`, {
            headers: {
                Authorization: jiraAuthHeader(conn.email, conn.apiToken),
                Accept: "application/json",
            },
        });
        if (!resp.ok) throw new Error(`Failed to fetch projects: ${resp.status}`);
        const data = await resp.json();
        return (data as any[]).map((p) => ({ id: p.id as string, key: p.key as string, name: p.name as string }));
    },
});

export const getIssueTypes = action({
    args: { workspaceId: v.id("workspaces") },
    handler: async (ctx, args): Promise<any[]> => {
        const conn = await ctx.runQuery(api.jiraHelpers.getConnectionInternal, { workspaceId: args.workspaceId });
        if (!conn) throw new Error("Jira not connected");
        const resp = await fetch(`https://${conn.domain}/rest/api/3/issuetype`, {
            headers: {
                Authorization: jiraAuthHeader(conn.email, conn.apiToken),
                Accept: "application/json",
            },
        });
        if (!resp.ok) throw new Error(`Failed to fetch issue types: ${resp.status}`);
        return await resp.json();
    },
});

export const getPriorities = action({
    args: { workspaceId: v.id("workspaces") },
    handler: async (ctx, args): Promise<any[]> => {
        const conn = await ctx.runQuery(api.jiraHelpers.getConnectionInternal, { workspaceId: args.workspaceId });
        if (!conn) throw new Error("Jira not connected");
        const resp = await fetch(`https://${conn.domain}/rest/api/3/priority`, {
            headers: {
                Authorization: jiraAuthHeader(conn.email, conn.apiToken),
                Accept: "application/json",
            },
        });
        if (!resp.ok) throw new Error(`Failed to fetch priorities: ${resp.status}`);
        return await resp.json();
    },
});

export const getAssignableUsers = action({
    args: { workspaceId: v.id("workspaces"), projectKey: v.string() },
    handler: async (ctx, args): Promise<any[]> => {
        const conn = await ctx.runQuery(api.jiraHelpers.getConnectionInternal, { workspaceId: args.workspaceId });
        if (!conn) throw new Error("Jira not connected");
        const resp = await fetch(
            `https://${conn.domain}/rest/api/3/user/assignable/search?project=${encodeURIComponent(args.projectKey)}`,
            {
                headers: {
                    Authorization: jiraAuthHeader(conn.email, conn.apiToken),
                    Accept: "application/json",
                },
            }
        );
        if (!resp.ok) throw new Error(`Failed to fetch assignable users: ${resp.status}`);
        return await resp.json();
    },
});

export const createIssue = action({
    args: {
        workspaceId: v.id("workspaces"),
        fields: v.any(),
    },
    handler: async (ctx, args): Promise<{ key: string; id: string; url: string }> => {
        const conn = await ctx.runQuery(api.jiraHelpers.getConnectionInternal, { workspaceId: args.workspaceId });
        if (!conn) throw new Error("Jira not connected");
        const resp = await fetch(`https://${conn.domain}/rest/api/3/issue`, {
            method: "POST",
            headers: {
                Authorization: jiraAuthHeader(conn.email, conn.apiToken),
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ fields: args.fields }),
        });
        if (!resp.ok) {
            const text = await resp.text();
            throw new Error(`Failed to create issue: ${resp.status} ${text}`);
        }
        const data = await resp.json();
        return {
            key: data.key as string,
            id: data.id as string,
            url: `https://${conn.domain}/browse/${data.key}`,
        };
    },
});

export const getIssue = action({
    args: { workspaceId: v.id("workspaces"), issueKey: v.string() },
    handler: async (ctx, args): Promise<{
        key: string; id: string; summary: string; status: string; statusCategory: string;
        assignee: { name: string; avatarUrl: string } | null;
        priority: string; priorityIconUrl: string; issueType: string; project: string; domain: string;
    }> => {
        const conn = await ctx.runQuery(api.jiraHelpers.getConnectionInternal, { workspaceId: args.workspaceId });
        if (!conn) throw new Error("Jira not connected");
        const resp = await fetch(
            `https://${conn.domain}/rest/api/3/issue/${encodeURIComponent(args.issueKey)}?fields=summary,status,assignee,priority,description,issuetype,project`,
            {
                headers: {
                    Authorization: jiraAuthHeader(conn.email, conn.apiToken),
                    Accept: "application/json",
                },
            }
        );
        if (!resp.ok) throw new Error(`Failed to fetch issue: ${resp.status}`);
        const data = await resp.json();
        return {
            key: data.key as string,
            id: data.id as string,
            summary: data.fields?.summary as string,
            status: data.fields?.status?.name as string,
            statusCategory: data.fields?.status?.statusCategory?.colorName as string,
            assignee: data.fields?.assignee
                ? {
                    name: data.fields.assignee.displayName as string,
                    avatarUrl: (data.fields.assignee.avatarUrls?.["32x32"] ?? "") as string,
                }
                : null,
            priority: data.fields?.priority?.name as string,
            priorityIconUrl: (data.fields?.priority?.iconUrl ?? "") as string,
            issueType: data.fields?.issuetype?.name as string,
            project: data.fields?.project?.name as string,
            domain: conn.domain as string,
        };
    },
});

export const searchIssues = action({
    args: {
        workspaceId: v.id("workspaces"),
        jql: v.string(),
        maxResults: v.optional(v.number()),
    },
    handler: async (ctx, args): Promise<{
        issues: Array<{
            key: string; id: string; summary: string; status: string; statusCategory: string;
            assignee: { name: string; avatarUrl: string } | null;
            priority: string; priorityIconUrl: string; issueType: string; updated: string; domain: string;
        }>;
        total: number;
    }> => {
        const conn = await ctx.runQuery(api.jiraHelpers.getConnectionInternal, { workspaceId: args.workspaceId });
        if (!conn) throw new Error("Jira not connected");
        const resp = await fetch(`https://${conn.domain}/rest/api/3/search/jql`, {
            method: "POST",
            headers: {
                Authorization: jiraAuthHeader(conn.email, conn.apiToken),
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                jql: args.jql,
                maxResults: args.maxResults ?? 50,
                fields: ["summary", "status", "assignee", "priority", "updated", "issuetype", "project"],
            }),
        });
        if (!resp.ok) throw new Error(`Failed to search issues: ${resp.status}`);
        const data = await resp.json();
        return {
            issues: (data.issues as any[]).map((issue) => ({
                key: issue.key as string,
                id: issue.id as string,
                summary: issue.fields?.summary as string,
                status: issue.fields?.status?.name as string,
                statusCategory: issue.fields?.status?.statusCategory?.colorName as string,
                assignee: issue.fields?.assignee
                    ? {
                        name: issue.fields.assignee.displayName as string,
                        avatarUrl: (issue.fields.assignee.avatarUrls?.["32x32"] ?? "") as string,
                    }
                    : null,
                priority: issue.fields?.priority?.name as string,
                priorityIconUrl: (issue.fields?.priority?.iconUrl ?? "") as string,
                issueType: issue.fields?.issuetype?.name as string,
                updated: issue.fields?.updated as string,
                domain: conn.domain as string,
            })),
            total: data.total as number,
        };
    },
});

export const addComment = action({
    args: {
        workspaceId: v.id("workspaces"),
        issueKey: v.string(),
        text: v.string(),
    },
    handler: async (ctx, args): Promise<any> => {
        const conn = await ctx.runQuery(api.jiraHelpers.getConnectionInternal, { workspaceId: args.workspaceId });
        if (!conn) throw new Error("Jira not connected");
        const resp = await fetch(
            `https://${conn.domain}/rest/api/3/issue/${encodeURIComponent(args.issueKey)}/comment`,
            {
                method: "POST",
                headers: {
                    Authorization: jiraAuthHeader(conn.email, conn.apiToken),
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    body: {
                        type: "doc",
                        version: 1,
                        content: [
                            {
                                type: "paragraph",
                                content: [{ type: "text", text: args.text }],
                            },
                        ],
                    },
                }),
            }
        );
        if (!resp.ok) throw new Error(`Failed to add comment: ${resp.status}`);
        return await resp.json();
    },
});

export const getTransitions = action({
    args: { workspaceId: v.id("workspaces"), issueKey: v.string() },
    handler: async (ctx, args): Promise<{ id: string; name: string }[]> => {
        const conn = await ctx.runQuery(api.jiraHelpers.getConnectionInternal, { workspaceId: args.workspaceId });
        if (!conn) throw new Error("Jira not connected");
        const resp = await fetch(
            `https://${conn.domain}/rest/api/3/issue/${encodeURIComponent(args.issueKey)}/transitions`,
            {
                headers: {
                    Authorization: jiraAuthHeader(conn.email, conn.apiToken),
                    Accept: "application/json",
                },
            }
        );
        if (!resp.ok) throw new Error(`Failed to fetch transitions: ${resp.status}`);
        const data = await resp.json();
        return (data.transitions as any[]).map((t) => ({
            id: t.id as string,
            name: t.name as string,
        }));
    },
});

export const applyTransition = action({
    args: {
        workspaceId: v.id("workspaces"),
        issueKey: v.string(),
        transitionId: v.string(),
    },
    handler: async (ctx, args): Promise<{ success: boolean }> => {
        const conn = await ctx.runQuery(api.jiraHelpers.getConnectionInternal, { workspaceId: args.workspaceId });
        if (!conn) throw new Error("Jira not connected");
        const resp = await fetch(
            `https://${conn.domain}/rest/api/3/issue/${encodeURIComponent(args.issueKey)}/transitions`,
            {
                method: "POST",
                headers: {
                    Authorization: jiraAuthHeader(conn.email, conn.apiToken),
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ transition: { id: args.transitionId } }),
            }
        );
        if (!resp.ok) throw new Error(`Failed to apply transition: ${resp.status}`);
        return { success: true };
    },
});

export const assignIssue = action({
    args: {
        workspaceId: v.id("workspaces"),
        issueKey: v.string(),
        jiraAccountId: v.string(),
    },
    handler: async (ctx, args): Promise<{ success: boolean }> => {
        const conn = await ctx.runQuery(api.jiraHelpers.getConnectionInternal, { workspaceId: args.workspaceId });
        if (!conn) throw new Error("Jira not connected");
        const resp = await fetch(
            `https://${conn.domain}/rest/api/3/issue/${encodeURIComponent(args.issueKey)}`,
            {
                method: "PUT",
                headers: {
                    Authorization: jiraAuthHeader(conn.email, conn.apiToken),
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ fields: { assignee: { accountId: args.jiraAccountId } } }),
            }
        );
        if (!resp.ok) {
            const text = await resp.text();
            throw new Error(`Failed to assign issue: ${resp.status} ${text}`);
        }
        return { success: true };
    },
});

export const searchJiraUsers = action({
    args: {
        workspaceId: v.id("workspaces"),
        query: v.string(),
    },
    handler: async (ctx, args): Promise<Array<{
        accountId: string;
        displayName: string;
        emailAddress: string;
        avatarUrl: string;
    }>> => {
        const conn = await ctx.runQuery(api.jiraHelpers.getConnectionInternal, { workspaceId: args.workspaceId });
        if (!conn) throw new Error("Jira not connected");
        const url = new URL(`https://${conn.domain}/rest/api/3/user/search`);
        url.searchParams.set("query", args.query);
        const resp = await fetch(url.toString(), {
            headers: {
                Authorization: jiraAuthHeader(conn.email, conn.apiToken),
                Accept: "application/json",
            },
        });
        if (!resp.ok) throw new Error(`Failed to search users: ${resp.status}`);
        const data = await resp.json();
        return (data as any[]).map((u) => ({
            accountId: u.accountId as string,
            displayName: u.displayName as string,
            emailAddress: (u.emailAddress ?? "") as string,
            avatarUrl: (u.avatarUrls?.["48x48"] ?? u.avatarUrls?.["32x32"] ?? "") as string,
        }));
    },
});
