import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// BUG: unbounded .collect() -- if a project has thousands of tasks,
// this hits the 32,000 document scan limit
export const getProjectTasks = query({
  args: { projectId: v.id("projects") },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_project_and_status", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

// BUG: ctx.runQuery inside a mutation has overhead vs a plain helper function.
// Both run in the same transaction but runQuery has per-call cost.
export const createTask = mutation({
  args: {
    projectId: v.id("projects"),
    title: v.string(),
    priority: v.number(),
  },
  returns: v.id("tasks"),
  handler: async (ctx, args) => {
    // Verify project exists using ctx.runQuery (overhead!)
    const project = await ctx.runQuery(api.projects.listActive, {
      ownerId: "" as any, // placeholder
    });

    return await ctx.db.insert("tasks", {
      projectId: args.projectId,
      title: args.title,
      status: "open",
      priority: args.priority,
      createdAt: Date.now(),
    });
  },
});
