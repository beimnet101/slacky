import { internalQuery, query } from "./_generated/server";
import { v } from "convex/values";

// Public query — used by actions in jira.ts via ctx.runQuery(api.jiraHelpers.getConnectionInternal)
export const getConnectionInternal = query({
    args: { workspaceId: v.id("workspaces") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("jiraConnections")
            .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
            .unique();
    },
});

// Internal query used by HTTP webhook handler
export const getConnectionInternalByWorkspace = internalQuery({
    args: { workspaceId: v.id("workspaces") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("jiraConnections")
            .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
            .unique();
    },
});
