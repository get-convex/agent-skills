import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// BUG 1: looks up by email instead of tokenIdentifier
// BUG 2: no user creation for first-time login
export async function getCurrentUser(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }

  // BUG: should look up by tokenIdentifier, not email
  // identity.email might not even be present depending on Clerk config
  const user = await ctx.db
    .query("users")
    .filter((q: any) => q.eq(q.field("email"), identity.email))
    .first();

  if (!user) {
    // BUG: throws instead of creating the user
    throw new Error("User not found");
  }

  return user;
}

export const me = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    return await getCurrentUser(ctx);
  },
});
