import { mutation, query } from "./_generated/server";
import { auth } from "./auth";
import { v } from "convex/values";
export const current = query({
    args: {},
    handler: async (ctx) => {
        const userId = await auth.getUserId(ctx);
        if (userId === null) {
            return null;
        }
        return await ctx.db.get(userId);
    },

});

export const updateProfile = mutation({
    args: {
        id: v.id("users"),         // User ID to update
        name: v.string(),          // New name to update
        imageId: v.id("_storage")     // Image storage ID
    },
    handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);

        if (!userId) {
            throw new Error("Unauthorized");
        }

        if (userId !== args.id) {
            throw new Error("You can only update your own profile.");
        }

        const imageUrl = await ctx.storage.getUrl(args.imageId)
        if (!imageUrl) return;

        // Update the user's profile with the new name and image URL
        await ctx.db.patch(args.id, {
            name: args.name,
            image: imageUrl,   // Store the image URL in the 'image' field
            // Store the image ID in the 'image' field
        });


    },
});
