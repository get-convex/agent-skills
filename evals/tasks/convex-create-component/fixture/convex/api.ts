import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const RATE_LIMIT = 100;
const RATE_WINDOW_MS = 60_000; // 1 minute

// Rate limiting is inline - should be extracted to a component
async function checkRateLimit(ctx: any, key: string): Promise<boolean> {
  const now = Date.now();
  const entry = await ctx.db
    .query("rateLimits")
    .withIndex("by_key", (q: any) => q.eq("key", key))
    .first();

  if (!entry) {
    await ctx.db.insert("rateLimits", { key, count: 1, windowStart: now });
    return true;
  }

  if (now - entry.windowStart > RATE_WINDOW_MS) {
    await ctx.db.patch(entry._id, { count: 1, windowStart: now });
    return true;
  }

  if (entry.count >= RATE_LIMIT) {
    return false;
  }

  await ctx.db.patch(entry._id, { count: entry.count + 1 });
  return true;
}

export const handleRequest = mutation({
  args: { apiKey: v.string(), payload: v.string() },
  returns: v.object({ success: v.boolean(), message: v.string() }),
  handler: async (ctx, args) => {
    // Validate API key
    const keyRecord = await ctx.db
      .query("apiKeys")
      .withIndex("by_key", (q) => q.eq("key", args.apiKey))
      .first();

    if (!keyRecord) {
      return { success: false, message: "Invalid API key" };
    }

    // Check rate limit (inline, should be in component)
    const allowed = await checkRateLimit(ctx, args.apiKey);
    if (!allowed) {
      return { success: false, message: "Rate limit exceeded" };
    }

    // Process request...
    return { success: true, message: "OK" };
  },
});
