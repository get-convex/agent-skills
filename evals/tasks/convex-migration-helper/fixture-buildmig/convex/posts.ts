import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listPosts = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    return await ctx.db
      .query("posts")
      .withIndex("by_created")
      .order("desc")
      .take(50);
  },
});

export const getPost = query({
  args: { postId: v.id("posts") },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.postId);
  },
});

export const createPost = mutation({
  args: { title: v.string(), body: v.string() },
  returns: v.id("posts"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("posts", {
      title: args.title,
      body: args.body,
      createdAt: Date.now(),
    });
  },
});
