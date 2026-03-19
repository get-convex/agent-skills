import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listByChannel = query({
  args: { channelId: v.id("channels") },
  returns: v.any(),
  handler: async (ctx, args) => {
    // Returns messages but NOT author info -- frontend fetches each author separately
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
      .order("desc")
      .take(20);
    return messages;
  },
});

// PROBLEM: full table scan to count unread messages
export const getUnreadCount = query({
  args: { userId: v.id("users"), channelId: v.id("channels") },
  returns: v.number(),
  handler: async (ctx, args) => {
    const allMessages = await ctx.db
      .query("messages")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
      .collect();
    const unread = allMessages.filter(
      (m) => !m.readBy.includes(args.userId)
    );
    return unread.length;
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
    const messageId = await ctx.db.insert("messages", {
      channelId: args.channelId,
      authorId: args.authorId,
      body: args.body,
      createdAt: Date.now(),
      readBy: [args.authorId],
    });

    await ctx.db.patch(args.channelId, {
      lastActivityAt: Date.now(),
    });

    return messageId;
  },
});

// PROBLEM: search writes results AND updates global analytics counter
// in the same transaction
export const search = mutation({
  args: { userId: v.id("users"), queryText: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    // Simple text search (placeholder logic)
    const allMessages = await ctx.db.query("messages").collect();
    const matches = allMessages.filter((m) =>
      m.body.toLowerCase().includes(args.queryText.toLowerCase())
    );
    const resultIds = matches.map((m) => m._id);

    await ctx.db.insert("searchResults", {
      userId: args.userId,
      query: args.queryText,
      resultIds,
      createdAt: Date.now(),
    });

    // Update analytics counter in same transaction
    const counter = await ctx.db
      .query("analytics")
      .withIndex("by_key", (q) => q.eq("key", "search_count"))
      .first();
    if (counter) {
      await ctx.db.patch(counter._id, { count: counter.count + 1 });
    } else {
      await ctx.db.insert("analytics", { key: "search_count", count: 1 });
    }

    return matches.slice(0, 20);
  },
});
