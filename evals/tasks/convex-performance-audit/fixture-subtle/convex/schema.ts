import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  projects: defineTable({
    name: v.string(),
    ownerId: v.id("users"),
    // isArchived was added later -- older documents don't have this field
    isArchived: v.optional(v.boolean()),
    description: v.string(),
    createdAt: v.number(),
  })
    // BUG: redundant indexes -- by_owner is a prefix of by_owner_and_created
    .index("by_owner", ["ownerId"])
    .index("by_owner_and_created", ["ownerId", "createdAt"])
    .index("by_archived", ["isArchived"]),

  tasks: defineTable({
    projectId: v.id("projects"),
    title: v.string(),
    status: v.string(), // "open", "in_progress", "done"
    assigneeId: v.optional(v.id("users")),
    priority: v.number(),
    createdAt: v.number(),
  })
    // BUG: redundant -- by_project is a prefix of by_project_and_status
    .index("by_project", ["projectId"])
    .index("by_project_and_status", ["projectId", "status"]),

  comments: defineTable({
    taskId: v.id("tasks"),
    authorId: v.id("users"),
    body: v.string(),
    createdAt: v.number(),
    // BUG: readBy array means every mark-as-read writes to the comment doc,
    // invalidating all subscriptions reading this comment
    readBy: v.array(v.id("users")),
  }).index("by_task", ["taskId"]),

  users: defineTable({
    name: v.string(),
    email: v.string(),
    tokenIdentifier: v.string(),
  }).index("by_token", ["tokenIdentifier"]),

  settings: defineTable({
    userId: v.id("users"),
    theme: v.string(),
    notificationsEnabled: v.boolean(),
    locale: v.string(),
  }).index("by_user", ["userId"]),
});
