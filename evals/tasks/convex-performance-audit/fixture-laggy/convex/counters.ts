import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getToday = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    return await ctx.db
      .query("counters")
      .withIndex("by_key", (q) => q.eq("key", "actions_today"))
      .first();
  },
});

// BUG: every user action increments the same document
// causes OCC contention AND subscription invalidation
export const increment = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const counter = await ctx.db
      .query("counters")
      .withIndex("by_key", (q) => q.eq("key", "actions_today"))
      .first();

    if (counter) {
      await ctx.db.patch(counter._id, { value: counter.value + 1 });
    } else {
      await ctx.db.insert("counters", {
        key: "actions_today",
        value: 1,
        lastReset: Date.now(),
      });
    }
    return null;
  },
});
