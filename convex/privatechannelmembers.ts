import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { auth } from "./auth";
import { Id } from "./_generated/dataModel";

// Function to retrieve authorized members for a specific private channel
export const getMembersByChannelId = query({
  args: {
    channelId: v.id("privateChannels"), // The ID of the private channel
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return []; // Return an empty array if the user is not authenticated
    }

    // Retrieve authorized members for the private channel
    const authorizedMembers = await ctx.db
      .query("privateChannelMembers")
      .withIndex("by_channel_id", (q) => q.eq("channelId", args.channelId))
      .collect();

    return authorizedMembers; // Return the list of authorized members
  },
});

export const addMemberToChannel = mutation({
  args: {
    channelId: v.id("privateChannels"),
    memberId: v.id("members"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Insert the new member into the privateChannelMembers table
    await ctx.db.insert("privateChannelMembers", {
      channelId: args.channelId,
      memberId: args.memberId,
      userId: args.userId,
    });

    return { success: true };
  },
});

// Mutation to remove a member from a private channel
export const removeMemberFromChannel = mutation({
  args: {
    channelId: v.id("privateChannels"), // The ID of the private channel
    memberId: v.id("members"), // The ID of the member to be removed
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized"); // Check for authentication
    }

    // Verify if the user is authorized to remove members (e.g., is an admin)
    const currentMember = await ctx.db
      .query("privateChannelMembers")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();

    if (!currentMember) {
      throw new Error("Unauthorized to remove members"); // Check authorization
    }

    // Remove the member from the privateChannelMembers table
    await ctx.db.delete(args.memberId); // Deleting the member record

    return { success: true }; // Indicate success
  },
});
export const api = {
  addMemberToChannel,
  // other exports...
};