import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Team list query -- reads ALL user fields including lastSeen
// Every heartbeat write invalidates this query for ALL viewers
export const listTeam = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    // BUG: Date.now() in query defeats caching
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    return users.map((u) => ({
      ...u,
      isOnline: u.lastSeen > fiveMinutesAgo,
    }));
  },
});

// Called every 5 seconds per connected user
// BUG: writes to the same document that listTeam reads,
// causing listTeam to re-run for ALL viewers on EVERY heartbeat
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
