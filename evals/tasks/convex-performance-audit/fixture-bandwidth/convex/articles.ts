import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// List page: shows title, author name, date, tags
// BUG: returns full documents including the large 'content' field
export const list = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    return await ctx.db
      .query("articles")
      .withIndex("by_published")
      .order("desc")
      .take(20);
  },
});

export const get = query({
  args: { articleId: v.id("articles") },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.articleId);
  },
});

// BUG: full table scan + JS filter for search
export const search = query({
  args: { query: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const allArticles = await ctx.db.query("articles").collect();
    return allArticles.filter(
      (a) =>
        a.title.toLowerCase().includes(args.query.toLowerCase()) ||
        a.content.toLowerCase().includes(args.query.toLowerCase())
    );
  },
});

export const incrementView = mutation({
  args: { articleId: v.id("articles") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const article = await ctx.db.get(args.articleId);
    if (article) {
      await ctx.db.patch(args.articleId, {
        viewCount: article.viewCount + 1,
      });
    }
    return null;
  },
});
