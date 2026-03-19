import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  events: defineTable({
    title: v.string(),
    description: v.string(),
    date: v.number(),
    // Denormalized venue data -- needs to be extracted to a venues table
    venueName: v.string(),
    venueAddress: v.string(),
    venueCapacity: v.number(),
    // Denormalized ticket data -- needs to be extracted to a ticket_types table
    ticketTypes: v.array(v.object({
      name: v.string(),
      price: v.number(),
      available: v.number(),
    })),
    createdAt: v.number(),
  }).index("by_date", ["date"]),
});
