import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// NO AUTH CHECKS -- agent needs to add them

export const list = query({
  args: { orgId: v.id("organizations") },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("projects")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();
  },
});

export const create = mutation({
  args: {
    orgId: v.id("organizations"),
    name: v.string(),
    description: v.string(),
  },
  returns: v.id("projects"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("projects", {
      orgId: args.orgId,
      name: args.name,
      description: args.description,
      createdAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { projectId: v.id("projects") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.projectId);
    return null;
  },
});
