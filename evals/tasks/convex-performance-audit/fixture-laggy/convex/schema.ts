import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    currentProjectId: v.optional(v.id("projects")),
    // Heartbeat data on the same doc as profile data
    lastSeen: v.number(),
    isOnline: v.boolean(),
  }),

  projects: defineTable({
    name: v.string(),
    description: v.string(),
  }),

  preferences: defineTable({
    userId: v.id("users"),
    theme: v.string(),
    sidebarCollapsed: v.boolean(),
    fontSize: v.number(),
  }).index("by_user", ["userId"]),

  // Global counter -- single document updated by every action
  counters: defineTable({
    key: v.string(),
    value: v.number(),
    lastReset: v.number(),
  }).index("by_key", ["key"]),
});
