import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Currently inline in the app -- needs to be extracted to a component

export const send = mutation({
  args: {
    userId: v.id("users"),
    message: v.string(),
    channel: v.string(),
  },
  returns: v.id("notifications"),
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("notifications", {
      userId: args.userId,
      message: args.message,
      channel: args.channel,
      read: false,
      createdAt: Date.now(),
    });

    // TODO: should trigger external delivery (email, push) via callback
    // Currently does nothing for delivery

    return id;
  },
});

export const listUnread = query({
  args: { userId: v.id("users") },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notifications")
      .withIndex("by_user_unread", (q) =>
        q.eq("userId", args.userId).eq("read", false)
      )
      .collect();
  },
});

export const markRead = mutation({
  args: { notificationId: v.id("notifications") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.notificationId, { read: true });
    return null;
  },
});
