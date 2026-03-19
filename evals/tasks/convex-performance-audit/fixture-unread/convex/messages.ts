import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listByChannel = query({
  args: { channelId: v.id("channels") },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
      .order("desc")
      .take(50);
  },
});

export const send = mutation({
  args: {
    channelId: v.id("channels"),
    authorId: v.id("users"),
    body: v.string(),
  },
  returns: v.id("messages"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("messages", {
      channelId: args.channelId,
      authorId: args.authorId,
      body: args.body,
      createdAt: Date.now(),
    });
  },
});
