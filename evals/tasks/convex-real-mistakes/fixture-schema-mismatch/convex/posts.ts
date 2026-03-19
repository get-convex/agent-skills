import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    return await ctx.db
      .query("posts")
      .withIndex("by_published")
      .order("desc")
      .take(20);
  },
});

export const get = query({
  args: { postId: v.id("posts") },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.postId);
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    body: v.string(),
    authorName: v.string(),
  },
  returns: v.id("posts"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("posts", {
      ...args,
      publishedAt: Date.now(),
    });
  },
});
