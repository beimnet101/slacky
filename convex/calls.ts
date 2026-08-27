import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

const getMember = async (ctx: any, workspaceId: any, userId: any) => {
  return ctx.db.query("members")
    .withIndex("by_workspace_id_user_id", (q: any) => q.eq("workspaceId", workspaceId).eq("userId", userId))
    .unique();
};

export const initiate = mutation({
  args: { workspaceId: v.id("workspaces"), receiverId: v.id("members"), offer: v.string() },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    const caller = await getMember(ctx, args.workspaceId, userId);
    if (!caller) throw new Error("Not a member");
    return ctx.db.insert("calls", {
      workspaceId: args.workspaceId,
      callerId: caller._id,
      receiverId: args.receiverId,
      status: "ringing",
      offer: args.offer,
    });
  },
});

export const answer = mutation({
  args: { callId: v.id("calls"), answer: v.string() },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    await ctx.db.patch(args.callId, { answer: args.answer, status: "active" });
  },
});

export const decline = mutation({
  args: { callId: v.id("calls") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.callId, { status: "declined" });
  },
});

export const end = mutation({
  args: { callId: v.id("calls") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.callId, { status: "ended" });
  },
});

export const addIceCandidate = mutation({
  args: { callId: v.id("calls"), candidate: v.string(), role: v.union(v.literal("caller"), v.literal("receiver")) },
  handler: async (ctx, args) => {
    const call = await ctx.db.get(args.callId);
    if (!call) return;
    if (args.role === "caller") {
      const existing = call.callerCandidates ?? [];
      await ctx.db.patch(args.callId, { callerCandidates: [...existing, args.candidate] });
    } else {
      const existing = call.receiverCandidates ?? [];
      await ctx.db.patch(args.callId, { receiverCandidates: [...existing, args.candidate] });
    }
  },
});

export const getActiveCall = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;
    const member = await getMember(ctx, args.workspaceId, userId);
    if (!member) return null;
    const asReceiver = await ctx.db.query("calls")
      .withIndex("by_receiver", (q) => q.eq("receiverId", member._id))
      .filter((q) => q.or(q.eq(q.field("status"), "ringing"), q.eq(q.field("status"), "active")))
      .first();
    if (asReceiver) {
      const caller = await ctx.db.get(asReceiver.callerId);
      const callerUser = caller ? await ctx.db.get(caller.userId) : null;
      return { ...asReceiver, role: "receiver" as const, otherParty: { name: callerUser?.name, image: callerUser?.image, memberId: asReceiver.callerId } };
    }
    const asCaller = await ctx.db.query("calls")
      .withIndex("by_caller", (q) => q.eq("callerId", member._id))
      .filter((q) => q.or(q.eq(q.field("status"), "ringing"), q.eq(q.field("status"), "active")))
      .first();
    if (asCaller) {
      const receiver = await ctx.db.get(asCaller.receiverId);
      const receiverUser = receiver ? await ctx.db.get(receiver.userId) : null;
      return { ...asCaller, role: "caller" as const, otherParty: { name: receiverUser?.name, image: receiverUser?.image, memberId: asCaller.receiverId } };
    }
    return null;
  },
});

export const getCallById = query({
  args: { callId: v.id("calls") },
  handler: async (ctx, args) => ctx.db.get(args.callId),
});
