import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: { userId: v.id("users") },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("settings")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
  },
});

// BUG: patches even when nothing changed. No-op writes in Convex still
// trigger subscription invalidation, replication, and downstream sync.
// If a user opens settings and clicks save without changing anything,
// every subscription reading their settings re-runs for no reason.
export const updateSettings = mutation({
  args: {
    userId: v.id("users"),
    theme: v.string(),
    notificationsEnabled: v.boolean(),
    locale: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("settings")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        theme: args.theme,
        notificationsEnabled: args.notificationsEnabled,
        locale: args.locale,
      });
    } else {
      await ctx.db.insert("settings", {
        userId: args.userId,
        theme: args.theme,
        notificationsEnabled: args.notificationsEnabled,
        locale: args.locale,
      });
    }
    return null;
  },
});
