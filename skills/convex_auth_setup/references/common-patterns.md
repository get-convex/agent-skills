# Common Convex Auth Patterns

Use this file after choosing an auth provider and wiring the client and backend auth config.

Convex authentication has two main parts:

1. Client authentication through the chosen provider
2. Backend identity mapping from `ctx.auth.getUserIdentity()` into your app's data model

## Schema Setup

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    name: v.string(),
    email: v.string(),
    pictureUrl: v.optional(v.string()),
    role: v.union(v.literal("user"), v.literal("admin")),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_token", ["tokenIdentifier"])
    .index("by_email", ["email"]),
});
```

## Core Helper Functions

```typescript
// convex/lib/auth.ts
import { QueryCtx, MutationCtx } from "./_generated/server";
import { Doc } from "./_generated/dataModel";

export async function getCurrentUser(
  ctx: QueryCtx | MutationCtx
): Promise<Doc<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier)
    )
    .unique();

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

export async function getCurrentUserOrNull(
  ctx: QueryCtx | MutationCtx
): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }

  return await ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier)
    )
    .unique();
}

export async function requireAdmin(
  ctx: QueryCtx | MutationCtx
): Promise<Doc<"users">> {
  const user = await getCurrentUser(ctx);

  if (user.role !== "admin") {
    throw new Error("Admin access required");
  }

  return user;
}
```

## Store or Upsert the User

Only add a `users` table and `storeUser` mutation if the app needs user records in Convex. If the app only needs auth gates, `ctx.auth.getUserIdentity()` may be enough.

```typescript
// convex/users.ts
import { mutation } from "./_generated/server";

export const storeUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (existingUser) {
      await ctx.db.patch(existingUser._id, {
        updatedAt: Date.now(),
      });
      return existingUser._id;
    }

    return await ctx.db.insert("users", {
      tokenIdentifier: identity.tokenIdentifier,
      name: identity.name ?? "Anonymous",
      email: identity.email ?? "",
      pictureUrl: identity.pictureUrl,
      role: "user",
      createdAt: Date.now(),
    });
  },
});
```

## Authorization Patterns

### Owner-only updates

```typescript
import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./lib/auth";

export const updateProfile = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    await ctx.db.patch(user._id, {
      name: args.name,
      updatedAt: Date.now(),
    });
  },
});
```

### Resource ownership checks

```typescript
import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./lib/auth";

export const deleteTask = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const task = await ctx.db.get(args.taskId);

    if (!task) {
      throw new Error("Task not found");
    }

    if (task.userId !== user._id) {
      throw new Error("You can only delete your own tasks");
    }

    await ctx.db.delete(args.taskId);
  },
});
```

### Team membership checks

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Schema includes membership table
export default defineSchema({
  teams: defineTable({
    name: v.string(),
    ownerId: v.id("users"),
  }),

  teamMembers: defineTable({
    teamId: v.id("teams"),
    userId: v.id("users"),
    role: v.union(v.literal("owner"), v.literal("member")),
  })
    .index("by_team", ["teamId"])
    .index("by_user", ["userId"])
    .index("by_team_and_user", ["teamId", "userId"]),
});
```

```typescript
import { Id } from "./_generated/dataModel";
import { MutationCtx } from "./_generated/server";
import { Doc } from "./_generated/dataModel";
import { getCurrentUser } from "./lib/auth";

async function requireTeamAccess(
  ctx: MutationCtx,
  teamId: Id<"teams">
): Promise<{ user: Doc<"users">; membership: Doc<"teamMembers"> }> {
  const user = await getCurrentUser(ctx);

  const membership = await ctx.db
    .query("teamMembers")
    .withIndex("by_team_and_user", (q) =>
      q.eq("teamId", teamId).eq("userId", user._id)
    )
    .unique();

  if (!membership) {
    throw new Error("You don't have access to this team");
  }

  return { user, membership };
}
```

## Query Visibility Patterns

### Public query

```typescript
import { query } from "./_generated/server";

export const listPublicPosts = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("posts")
      .withIndex("by_published", (q) => q.eq("published", true))
      .collect();
  },
});
```

### Private query

```typescript
import { query } from "./_generated/server";
import { getCurrentUser } from "./lib/auth";

export const getMyPosts = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);

    return await ctx.db
      .query("posts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});
```

### Hybrid query

```typescript
import { query } from "./_generated/server";
import { getCurrentUserOrNull } from "./lib/auth";

export const getPosts = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserOrNull(ctx);

    if (user) {
      return await ctx.db
        .query("posts")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect();
    }

    return await ctx.db
      .query("posts")
      .withIndex("by_published", (q) => q.eq("published", true))
      .collect();
  },
});
```

## Notes

- Prefer `ctx.auth.getUserIdentity()` for backend auth checks
- Use your provider's client helpers for login UI, but use Convex auth state for Convex-gated rendering where the docs recommend it
- Keep error messages direct and consistent
