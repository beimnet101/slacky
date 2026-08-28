import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";
const schema = defineSchema({
  ...authTables,


  workspaces: defineTable(
    {
      name: v.string(),
      userId: v.id("users"),
      joinCode: v.string(),


    }
  ),


  lastVisits: defineTable(
    {
      memberId: v.optional(v.id("members")),      // Reference to the member
      workspaceId: v.optional(v.id("workspaces")), // Reference to the workspace
      lastVisited: v.optional(v.number()),        // Timestamp of the last visit in milliseconds
    }).index("by_member_id_workspace_id", ["memberId", "workspaceId"]),


  members: defineTable({
    userId: v.id("users"),
    workspaceId: v.id("workspaces"),
    role: v.union(v.literal("admin"), v.literal("member"))
  })
    .index("by_user_id", ["userId"])
    .index("by_workspace_id", ["workspaceId"])
    .index("by_workspace_id_user_id", ["workspaceId", "userId"]),


  channels: defineTable({
    name: v.string(),
    workspaceId: v.id("workspaces"),

  })
    .index("by_workspace_id", ["workspaceId"]),

  conversations: defineTable({
    workspaceId: v.id("workspaces"),
    memberOneId: v.id("members"),
    memberTwoId: v.id("members"),
  })
    .index("by_workspace_id", ["workspaceId"]),

  messages: defineTable({
    body: v.string(),
    image: v.optional(v.id("_storage")),
    video: v.optional(v.id("_storage")),
    canvasId: v.optional(v.id("canvases")),
    memberId: v.id("members"),
    workspaceId: v.id("workspaces"),
    channelId: v.optional(v.id("channels")),
    parentMessageId: v.optional(v.id("messages")),
    conversationId: v.optional(v.id("conversations")),
    updatedAt: v.optional(v.number()),


  })
    .index("by_workspace_id", ["workspaceId"])
    .index("by_member_id", ["memberId"])
    .index("by_channel_id", ["channelId"])
    .index("by_conversation_id", ["conversationId"])
    .index("by_parent_message_id", ["parentMessageId"])
    .index("by_channel_id_parent_message_id_conversation_id",
      ["channelId",
        "parentMessageId",
        "conversationId",
      ]),
  reactions: defineTable({
    workspaceId: v.id("workspaces"),
    messageId: v.id("messages"),
    memberId: v.id("members"),
    value: v.string(),
  })
    .index("by_workspace_id", ["workspaceId"])
    .index("by_message_id", ["messageId"])
    .index("by_member_id", ["memberId"]),

  canvases: defineTable({
    workspaceId: v.id("workspaces"),
    memberId: v.id("members"),
    title: v.string(),
    content: v.string(),
    templateId: v.optional(v.string()),
    isStarred: v.optional(v.boolean()),
  })
    .index("by_workspace_id", ["workspaceId"])
    .index("by_member_id", ["memberId"]),

  mentions: defineTable({
    workspaceId: v.id("workspaces"),
    messageId: v.id("messages"),
    mentionedMemberId: v.id("members"),
    mentionerMemberId: v.id("members"),
    channelId: v.optional(v.id("channels")),
    conversationId: v.optional(v.id("conversations")),
    isRead: v.boolean(),
  })
    .index("by_mentioned_member", ["mentionedMemberId"])
    .index("by_workspace_id_mentioned", ["workspaceId", "mentionedMemberId"]),

  calls: defineTable({
    workspaceId: v.id("workspaces"),
    callerId: v.id("members"),
    receiverId: v.id("members"),
    status: v.union(v.literal("ringing"), v.literal("active"), v.literal("ended"), v.literal("declined")),
    offer: v.optional(v.string()),
    answer: v.optional(v.string()),
    callerCandidates: v.optional(v.array(v.string())),
    receiverCandidates: v.optional(v.array(v.string())),
  })
    .index("by_receiver", ["receiverId"])
    .index("by_caller", ["callerId"])
    .index("by_workspace_id", ["workspaceId"]),
});









export default schema;