import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  posts: defineTable({
    title: v.string(),
    body: v.string(),
    authorName: v.string(),
    publishedAt: v.number(),
    // No category field yet -- 500 existing posts don't have it
  }).index("by_published", ["publishedAt"]),
});
