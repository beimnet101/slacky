import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { auth } from "./auth";

export const start = mutation({
  args: {
    channelId: v.id("channels"),
    workspaceId: v.id("workspaces"),
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
    if (!member) throw new Error("Not a member");
    const user = await ctx.db.get(userId);

    // Remove any stale conference for this channel first
    const existing = await ctx.db
      .query("activeConferences")
      .withIndex("by_channel_id", (q) => q.eq("channelId", args.channelId))
      .first();
    if (existing) await ctx.db.delete(existing._id);

    return ctx.db.insert("activeConferences", {
      channelId: args.channelId,
      workspaceId: args.workspaceId,
      startedByMemberId: member._id,
      startedByName: user?.name ?? "Someone",
    });
  },
});

export const end = mutation({
  args: { channelId: v.id("channels") },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("activeConferences")
      .withIndex("by_channel_id", (q) => q.eq("channelId", args.channelId))
      .first();
    if (existing) await ctx.db.delete(existing._id);
  },
});

export const getActive = query({
  args: { channelId: v.id("channels") },
  handler: async (ctx, args) => {
    return ctx.db
      .query("activeConferences")
      .withIndex("by_channel_id", (q) => q.eq("channelId", args.channelId))
      .first();
  },
});
