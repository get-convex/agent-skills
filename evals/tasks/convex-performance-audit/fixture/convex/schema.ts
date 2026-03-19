import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  orders: defineTable({
    userId: v.string(),
    status: v.string(),
    total: v.number(),
    items: v.array(v.object({
      productId: v.string(),
      quantity: v.number(),
      price: v.number(),
    })),
    createdAt: v.number(),
  }),
  orderStats: defineTable({
    totalOrders: v.number(),
    totalRevenue: v.number(),
  }),
  products: defineTable({
    name: v.string(),
    price: v.number(),
    stock: v.number(),
  }),
});
