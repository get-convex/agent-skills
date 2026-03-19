import { query } from "./_generated/server";
import { v } from "convex/values";

// BUG: .filter() does NOT push to storage in Convex -- it scans all docs
// and filters in the runtime, same cost as JS .filter(). This looks like
// SQL WHERE but performs like a full table scan.
export const listActive = query({
  args: { ownerId: v.id("users") },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("projects")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .filter((q) => q.neq(q.field("isArchived"), true))
      .collect();
  },
});

// BUG: isArchived index with .eq("isArchived", false) misses older docs
// where isArchived is undefined (field didn't exist when they were created).
// In Convex, undefined !== false in index entries.
export const listNonArchived = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    return await ctx.db
      .query("projects")
      .withIndex("by_archived", (q) => q.eq("isArchived", false))
      .collect();
  },
});
