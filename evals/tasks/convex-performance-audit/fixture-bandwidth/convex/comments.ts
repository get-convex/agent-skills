import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// BUG: returns comments without author info -- frontend fetches each
// author separately, creating N+1 queries per article view
export const listByArticle = query({
  args: { articleId: v.id("articles") },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("comments")
      .withIndex("by_article", (q) => q.eq("articleId", args.articleId))
      .collect();
  },
});

export const add = mutation({
  args: {
    articleId: v.id("articles"),
    authorId: v.id("users"),
    body: v.string(),
  },
  returns: v.id("comments"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("comments", {
      articleId: args.articleId,
      authorId: args.authorId,
      body: args.body,
      createdAt: Date.now(),
    });
  },
});
