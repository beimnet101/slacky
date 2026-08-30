"use node";
import { action } from "./_generated/server";
import { v } from "convex/values";
import { auth } from "./auth";
import { AccessToken } from "livekit-server-sdk";

export const getToken = action({
  args: {
    roomName: v.string(),
    participantName: v.string(),
  },
  handler: async (ctx, args): Promise<string> => {
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    if (!apiKey || !apiSecret) throw new Error("LiveKit credentials not configured");

    const at = new AccessToken(apiKey, apiSecret, {
      identity: args.participantName,
      ttl: "4h",
    });
    at.addGrant({
      room: args.roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });
    return await at.toJwt();
  },
});
