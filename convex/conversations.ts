import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

export const list = query({
    args: {
        workspaceId: v.id("workspaces"),
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) {
            throw new Error("Unauthorized");
        }

        const currentMember = await ctx.db
            .query("members")
            .withIndex("by_workspace_id_user_id", (q) =>
                q.eq("workspaceId", args.workspaceId).eq("userId", userId)
            )
            .unique();

        if (!currentMember) {
            throw new Error("Member not found");
        }

        const conversations = await ctx.db
            .query("conversations")
            .withIndex("by_workspace_id", (q) => q.eq("workspaceId", args.workspaceId))
            .collect();

        const filtered = conversations.filter(
            (c) => c.memberOneId === currentMember._id || c.memberTwoId === currentMember._id
        );

        const results = await Promise.all(
            filtered.map(async (conversation) => {
                const otherMemberId =
                    conversation.memberOneId === currentMember._id
                        ? conversation.memberTwoId
                        : conversation.memberOneId;

                const otherMember = await ctx.db.get(otherMemberId);
                if (!otherMember) return null;

                const otherUser = await ctx.db.get(otherMember.userId);
                if (!otherUser) return null;

                const lastMessageArr = await ctx.db
                    .query("messages")
                    .withIndex("by_conversation_id", (q) =>
                        q.eq("conversationId", conversation._id)
                    )
                    .order("desc")
                    .take(1);

                const lastMessage = lastMessageArr[0] ?? null;

                return {
                    conversationId: conversation._id,
                    otherMember: {
                        _id: otherMember._id,
                        userId: otherMember.userId,
                        name: otherUser.name ?? "Unknown",
                        image: otherUser.image,
                    },
                    lastMessage: lastMessage
                        ? {
                              body: lastMessage.body,
                              createdAt: lastMessage._creationTime,
                              memberId: lastMessage.memberId,
                          }
                        : null,
                };
            })
        );

        return results.filter((r): r is NonNullable<typeof r> => r !== null);
    },
});

export const createorGet = mutation(
    {
        args: {
            workspaceId: v.id("workspaces"),
            memberId: v.id("members"),

        },
        handler: async (ctx, args) => {
            const userId = await auth.getUserId(ctx);
            if (!userId) {
                throw new Error("Unauthorized");
            }

            const currentMember = await ctx.db.query("members")
                .withIndex("by_workspace_id_user_id", (q) =>
                    q.eq("workspaceId", args.workspaceId).eq("userId", userId)
                )
                .unique();

            const otherMember = await ctx.db.get(args.memberId);
            if (!currentMember || !otherMember) {

                throw new Error("member not found");
            }
            const existingConversation = await ctx.db
                .query("conversations")
                .filter((q) => q.eq(q.field("workspaceId"), args.workspaceId))
                .filter((q) =>
                    q.or(
                        q.and(
                            q.eq(q.field("memberOneId"), currentMember._id),
                            q.eq(q.field("memberTwoId"), otherMember._id),

                        ),
                        q.and(
                            q.eq(q.field("memberOneId"), otherMember._id),
                            q.eq(q.field("memberTwoId"), currentMember._id),
                        ),
                    ))
                .unique();

            if (existingConversation) {
                return existingConversation._id;
            }
            const conversationId = await ctx.db.insert("conversations",
                {
                    workspaceId: args.workspaceId,
                    memberOneId: currentMember._id,
                    memberTwoId: otherMember._id,
                }


            );

            return conversationId;
        },
    });


