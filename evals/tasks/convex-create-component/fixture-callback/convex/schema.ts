import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    tokenIdentifier: v.string(),
  }).index("by_token", ["tokenIdentifier"]),

  // Notifications are currently handled inline in the app.
  // The agent needs to extract them into a component.
  // This table should be REMOVED from the app schema and moved to the component.
  notifications: defineTable({
    userId: v.id("users"),
    message: v.string(),
    channel: v.string(),
    read: v.boolean(),
    createdAt: v.number(),
  }).index("by_user_unread", ["userId", "read"]),
});
