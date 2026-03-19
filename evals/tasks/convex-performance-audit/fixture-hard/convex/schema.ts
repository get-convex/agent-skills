import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    avatarUrl: v.optional(v.string()),
    // Presence: updated every 5 seconds per user
    lastSeen: v.number(),
    isOnline: v.boolean(),
  }).index("by_email", ["email"]),

  channels: defineTable({
    name: v.string(),
    description: v.string(),
    createdBy: v.id("users"),
    lastActivityAt: v.number(),
  }),

  messages: defineTable({
    channelId: v.id("channels"),
    authorId: v.id("users"),
    body: v.string(),
    createdAt: v.number(),
    readBy: v.array(v.id("users")),
  }).index("by_channel", ["channelId"]),

  searchResults: defineTable({
    userId: v.id("users"),
    query: v.string(),
    resultIds: v.array(v.id("messages")),
    createdAt: v.number(),
  }),

  analytics: defineTable({
    key: v.string(),
    count: v.number(),
  }).index("by_key", ["key"]),
});
