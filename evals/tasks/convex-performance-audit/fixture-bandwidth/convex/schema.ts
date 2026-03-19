import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  articles: defineTable({
    title: v.string(),
    content: v.string(), // Large: avg 5KB of markdown per article
    authorId: v.id("users"),
    tags: v.array(v.string()),
    publishedAt: v.number(),
    viewCount: v.number(),
  }).index("by_published", ["publishedAt"]),

  comments: defineTable({
    articleId: v.id("articles"),
    authorId: v.id("users"),
    body: v.string(),
    createdAt: v.number(),
  }).index("by_article", ["articleId"]),

  users: defineTable({
    name: v.string(),
    email: v.string(),
    avatarUrl: v.optional(v.string()),
    department: v.string(),
  }),
});
