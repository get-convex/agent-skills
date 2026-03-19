import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// PERF ISSUE: Full table scan + JS filter instead of index
export const listOrdersByUser = query({
  args: { userId: v.string() },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const allOrders = await ctx.db.query("orders").collect();
    return allOrders.filter((order) => order.userId === args.userId);
  },
});

// PERF ISSUE: Reads entire table to compute stats
export const getOrderStats = query({
  args: {},
  returns: v.object({ count: v.number(), revenue: v.number() }),
  handler: async (ctx) => {
    const allOrders = await ctx.db.query("orders").collect();
    return {
      count: allOrders.length,
      revenue: allOrders.reduce((sum, o) => sum + o.total, 0),
    };
  },
});

// PERF ISSUE: Writes to orders, updates global stats counter, and updates
// product stock all in one mutation - causes OCC conflicts under load
export const processOrder = mutation({
  args: {
    userId: v.string(),
    items: v.array(v.object({
      productId: v.id("products"),
      quantity: v.number(),
      price: v.number(),
    })),
  },
  returns: v.id("orders"),
  handler: async (ctx, args) => {
    const total = args.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const orderId = await ctx.db.insert("orders", {
      userId: args.userId,
      status: "pending",
      total,
      items: args.items,
      createdAt: Date.now(),
    });

    // Update global stats - hot write, every order touches this row
    const stats = await ctx.db.query("orderStats").first();
    if (stats) {
      await ctx.db.patch(stats._id, {
        totalOrders: stats.totalOrders + 1,
        totalRevenue: stats.totalRevenue + total,
      });
    } else {
      await ctx.db.insert("orderStats", { totalOrders: 1, totalRevenue: total });
    }

    // Update product stock - could conflict with other orders for same product
    for (const item of args.items) {
      const product = await ctx.db.get(item.productId);
      if (product) {
        await ctx.db.patch(item.productId, {
          stock: product.stock - item.quantity,
        });
      }
    }

    return orderId;
  },
});
