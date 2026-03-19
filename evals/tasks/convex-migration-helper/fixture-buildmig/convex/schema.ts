import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  posts: defineTable({
    title: v.string(),
    body: v.string(),
    createdAt: v.number(),
  }).index("by_created", ["createdAt"]),
});
