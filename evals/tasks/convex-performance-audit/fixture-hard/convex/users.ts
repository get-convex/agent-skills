import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Called every 5 seconds per connected user
export const heartbeat = mutation({
  args: { userId: v.id("users") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      lastSeen: Date.now(),
      isOnline: true,
    });
    return null;
  },
});

export const getProfile = query({
  args: { userId: v.id("users") },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

export const listOnline = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const allUsers = await ctx.db.query("users").collect();
    return allUsers.filter((u) => u.isOnline);
  },
});
