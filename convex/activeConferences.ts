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
    const name = user?.name ?? "Someone";
    const image = user?.image ?? undefined;

    const existing = await ctx.db
      .query("activeConferences")
      .withIndex("by_channel_id", (q) => q.eq("channelId", args.channelId))
      .first();
    if (existing) await ctx.db.delete(existing._id);

    return ctx.db.insert("activeConferences", {
      channelId: args.channelId,
      workspaceId: args.workspaceId,
      startedByMemberId: member._id,
      startedByName: name,
      participants: [{ memberId: member._id, name, image }],
    });
  },
});

export const join = mutation({
  args: {
    channelId: v.id("channels"),
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return;
    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("userId", userId)
      )
      .unique();
    if (!member) return;
    const user = await ctx.db.get(userId);
    const name = user?.name ?? "Someone";
    const image = user?.image ?? undefined;

    const conference = await ctx.db
      .query("activeConferences")
      .withIndex("by_channel_id", (q) => q.eq("channelId", args.channelId))
      .first();
    if (!conference) return;

    const existing = (conference.participants ?? []).find(p => p.memberId === member._id);
    if (existing) return;

    await ctx.db.patch(conference._id, {
      participants: [...(conference.participants ?? []), { memberId: member._id, name, image }],
    });
  },
});

export const leave = mutation({
  args: { channelId: v.id("channels") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return;
    const conference = await ctx.db
      .query("activeConferences")
      .withIndex("by_channel_id", (q) => q.eq("channelId", args.channelId))
      .first();
    if (!conference) return;

    // Find member across all workspaces — use userId match via participants
    const updatedParticipants = (conference.participants ?? []).filter(p => {
      // We'll match by userId via member lookup below
      return true;
    });

    // Get the member to find their memberId
    const members = await ctx.db.query("members")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .collect();
    const memberIds = members.map(m => m._id);

    const filtered = (conference.participants ?? []).filter(
      p => !memberIds.includes(p.memberId)
    );

    if (filtered.length === 0) {
      // Last person left — delete the conference
      await ctx.db.delete(conference._id);
    } else {
      await ctx.db.patch(conference._id, { participants: filtered });
    }
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

export const getActiveForWorkspace = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    return ctx.db
      .query("activeConferences")
      .withIndex("by_workspace_id", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();
  },
});
