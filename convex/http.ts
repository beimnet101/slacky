import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { auth } from "./auth";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

const http = httpRouter();

auth.addHttpRoutes(http);

http.route({
    path: "/api/jira-webhook",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
        try {
            const url = new URL(request.url);
            const workspaceId = url.searchParams.get("workspaceId") as Id<"workspaces"> | null;
            if (!workspaceId) {
                return new Response("Missing workspaceId", { status: 400 });
            }

            const payload = await request.json();
            const webhookEvent: string = payload.webhookEvent ?? "";
            const issue = payload.issue;
            const issueKey: string = issue?.key ?? "UNKNOWN";
            const issueSummary: string = issue?.fields?.summary ?? "No summary";

            // Find the jira connection
            const connection = await ctx.runQuery(internal.jiraHelpers.getConnectionInternalByWorkspace, {
                workspaceId,
            });

            if (!connection || !connection.notificationChannelId) {
                return new Response("No notification channel configured", { status: 200 });
            }

            let notificationText = "";
            if (webhookEvent === "jira:issue_created") {
                notificationText = `🆕 Issue created: [${issueKey}] ${issueSummary}`;
            } else if (webhookEvent === "jira:issue_updated") {
                const changeLog = payload.changelog;
                let whatChanged = "";
                if (changeLog?.items?.length) {
                    whatChanged = changeLog.items
                        .map((item: any) => `${item.field}: ${item.fromString ?? "—"} → ${item.toString ?? "—"}`)
                        .join(", ");
                }
                notificationText = `✏️ Issue updated: [${issueKey}] ${issueSummary}${whatChanged ? ` — ${whatChanged}` : ""}`;
            } else if (webhookEvent === "comment_created") {
                const commentBody = payload.comment?.body ?? "";
                const commentText = typeof commentBody === "string"
                    ? commentBody.slice(0, 100)
                    : (commentBody?.content?.[0]?.content?.[0]?.text ?? "").slice(0, 100);
                notificationText = `💬 Comment on [${issueKey}]: ${commentText}`;
            } else {
                // Unknown event, still notify
                notificationText = `📋 Jira event: ${webhookEvent} on [${issueKey}] ${issueSummary}`;
            }

            const messageBody = JSON.stringify({
                ops: [{ insert: notificationText + "\n" }],
            });

            await ctx.runMutation(internal.jira.createSystemMessage, {
                workspaceId,
                channelId: connection.notificationChannelId,
                memberId: connection.connectedBy,
                body: messageBody,
            });

            return new Response("OK", { status: 200 });
        } catch (err: any) {
            console.error("Jira webhook error:", err);
            return new Response("Internal error", { status: 500 });
        }
    }),
});

export default http;
