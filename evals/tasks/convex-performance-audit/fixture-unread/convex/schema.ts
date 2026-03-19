import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    tokenIdentifier: v.string(),
  }).index("by_token", ["tokenIdentifier"]),

  channels: defineTable({
    name: v.string(),
    description: v.string(),
    createdAt: v.number(),
  }),

  messages: defineTable({
    channelId: v.id("channels"),
    authorId: v.id("users"),
    body: v.string(),
    createdAt: v.number(),
  })
    .index("by_channel", ["channelId"])
    .index("by_channel_and_time", ["channelId", "createdAt"]),

  // No read tracking yet -- agent needs to add it
});
