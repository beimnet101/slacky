import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

export const list = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];
    const member = await ctx.db.query("members")
      .withIndex("by_workspace_id_user_id", (q) => q.eq("workspaceId", args.workspaceId).eq("userId", userId))
      .unique();
    if (!member) return [];
    const mentions = await ctx.db.query("mentions")
      .withIndex("by_workspace_id_mentioned", (q) => q.eq("workspaceId", args.workspaceId).eq("mentionedMemberId", member._id))
      .collect();
    return Promise.all(mentions.map(async (m) => {
      const message = await ctx.db.get(m.messageId);
      const mentioner = await ctx.db.get(m.mentionerMemberId);
      const mentionerUser = mentioner ? await ctx.db.get(mentioner.userId) : null;
      return { ...m, message, mentioner: { name: mentionerUser?.name, image: mentionerUser?.image } };
    }));
  },
});

export const markRead = mutation({
  args: { mentionId: v.id("mentions") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    await ctx.db.patch(args.mentionId, { isRead: true });
  },
});

export const markAllRead = mutation({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    const member = await ctx.db.query("members")
      .withIndex("by_workspace_id_user_id", (q) => q.eq("workspaceId", args.workspaceId).eq("userId", userId))
      .unique();
    if (!member) return;
    const mentions = await ctx.db.query("mentions")
      .withIndex("by_workspace_id_mentioned", (q) => q.eq("workspaceId", args.workspaceId).eq("mentionedMemberId", member._id))
      .filter((q) => q.eq(q.field("isRead"), false))
      .collect();
    await Promise.all(mentions.map((m) => ctx.db.patch(m._id, { isRead: true })));
  },
});

export const getUnreadCount = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return 0;
    const member = await ctx.db.query("members")
      .withIndex("by_workspace_id_user_id", (q) => q.eq("workspaceId", args.workspaceId).eq("userId", userId))
      .unique();
    if (!member) return 0;
    const mentions = await ctx.db.query("mentions")
      .withIndex("by_workspace_id_mentioned", (q) => q.eq("workspaceId", args.workspaceId).eq("mentionedMemberId", member._id))
      .filter((q) => q.eq(q.field("isRead"), false))
      .collect();
    return mentions.length;
  },
});
