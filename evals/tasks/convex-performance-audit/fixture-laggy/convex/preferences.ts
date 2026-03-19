import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: { userId: v.id("users") },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("preferences")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
  },
});

// BUG: patches even when nothing changed -- triggers subscription
// invalidation for all queries reading this user's preferences
export const updatePreferences = mutation({
  args: {
    userId: v.id("users"),
    theme: v.string(),
    sidebarCollapsed: v.boolean(),
    fontSize: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("preferences")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        theme: args.theme,
        sidebarCollapsed: args.sidebarCollapsed,
        fontSize: args.fontSize,
      });
    } else {
      await ctx.db.insert("preferences", {
        userId: args.userId,
        theme: args.theme,
        sidebarCollapsed: args.sidebarCollapsed,
        fontSize: args.fontSize,
      });
    }
    return null;
  },
});
