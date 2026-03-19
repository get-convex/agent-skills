import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listByTask = query({
  args: { taskId: v.id("tasks") },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("comments")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();
  },
});

// BUG: writing readBy array on the comment document means EVERY mark-as-read
// triggers a write to the comment, which invalidates ALL subscriptions reading
// that comment. In a team of 20, marking a comment as read causes 19 other
// users' UIs to re-render for no visible change. This is the most insidious
// pattern because it looks perfectly normal but causes O(users^2) invalidation.
export const markAsRead = mutation({
  args: {
    commentId: v.id("comments"),
    userId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const comment = await ctx.db.get(args.commentId);
    if (!comment) return null;

    if (!comment.readBy.includes(args.userId)) {
      await ctx.db.patch(args.commentId, {
        readBy: [...comment.readBy, args.userId],
      });
    }
    return null;
  },
});

export const addComment = mutation({
  args: {
    taskId: v.id("tasks"),
    authorId: v.id("users"),
    body: v.string(),
  },
  returns: v.id("comments"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("comments", {
      taskId: args.taskId,
      authorId: args.authorId,
      body: args.body,
      createdAt: Date.now(),
      readBy: [args.authorId],
    });
  },
});
