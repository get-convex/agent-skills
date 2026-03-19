import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    return await ctx.db
      .query("events")
      .withIndex("by_date")
      .order("desc")
      .take(50);
  },
});

export const get = query({
  args: { eventId: v.id("events") },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.eventId);
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    date: v.number(),
    venueName: v.string(),
    venueAddress: v.string(),
    venueCapacity: v.number(),
    ticketTypes: v.array(v.object({
      name: v.string(),
      price: v.number(),
      available: v.number(),
    })),
  },
  returns: v.id("events"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("events", {
      ...args,
      createdAt: Date.now(),
    });
  },
});
