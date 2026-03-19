import { query } from "./_generated/server";
import { v } from "convex/values";

// PROBLEM: Date.now() in query defeats Convex query cache
export const listActive = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const allChannels = await ctx.db.query("channels").collect();
    return allChannels.filter((ch) => ch.lastActivityAt > oneHourAgo);
  },
});
