import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

// Get member helper (same pattern as messages.ts)
const getMember = async (ctx: any, workspaceId: any, userId: any) => {
  return ctx.db.query("members")
    .withIndex("by_workspace_id_user_id", (q: any) => q.eq("workspaceId", workspaceId).eq("userId", userId))
    .unique();
};

export const list = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];
    const member = await getMember(ctx, args.workspaceId, userId);
    if (!member) return [];

    const canvases = await ctx.db.query("canvases")
      .withIndex("by_workspace_id", (q: any) => q.eq("workspaceId", args.workspaceId))
      .collect();

    // Populate creator info
    return Promise.all(canvases.map(async (canvas: any) => {
      const creator = await ctx.db.get(canvas.memberId);
      const user = creator ? await ctx.db.get(creator.userId) : null;
      return { ...canvas, creator: { name: user?.name, image: user?.image, memberId: canvas.memberId } };
    }));
  },
});

export const create = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    title: v.string(),
    content: v.string(),
    templateId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    const member = await getMember(ctx, args.workspaceId, userId);
    if (!member) throw new Error("Not a member");

    return ctx.db.insert("canvases", {
      workspaceId: args.workspaceId,
      memberId: member._id,
      title: args.title,
      content: args.content,
      templateId: args.templateId,
      isStarred: false,
    });
  },
});

export const update = mutation({
  args: { id: v.id("canvases"), title: v.optional(v.string()), content: v.optional(v.string()), isStarred: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    const canvas = await ctx.db.get(args.id);
    if (!canvas) throw new Error("Not found");
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("canvases") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    await ctx.db.delete(args.id);
  },
});

export const getById = query({
  args: { id: v.id("canvases") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;
    return ctx.db.get(args.id);
  },
});
