import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    tokenIdentifier: v.string(),
  }).index("by_token", ["tokenIdentifier"]),

  organizations: defineTable({
    name: v.string(),
    slug: v.string(),
  }).index("by_slug", ["slug"]),

  // No memberships table yet -- agent needs to add it

  projects: defineTable({
    orgId: v.id("organizations"),
    name: v.string(),
    description: v.string(),
    createdAt: v.number(),
  }).index("by_org", ["orgId"]),

  tasks: defineTable({
    projectId: v.id("projects"),
    title: v.string(),
    status: v.string(),
    assigneeId: v.optional(v.id("users")),
    createdBy: v.id("users"),
    createdAt: v.number(),
  }).index("by_project", ["projectId"]),
});
