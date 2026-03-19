import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./auth";

export const list = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    return await ctx.db
      .query("documents")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .collect();
  },
});

export const create = mutation({
  args: { title: v.string(), content: v.string() },
  returns: v.id("documents"),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    return await ctx.db.insert("documents", {
      title: args.title,
      content: args.content,
      ownerId: user._id,
      createdAt: Date.now(),
    });
  },
});
