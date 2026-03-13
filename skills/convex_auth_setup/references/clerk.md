# Clerk

Official docs: https://docs.convex.dev/auth/clerk

Use this when the app already uses Clerk or the user wants Clerk's hosted auth features.

## Workflow

1. Confirm the user wants Clerk
2. Determine the app framework:
   - React
   - Next.js
   - TanStack Start
3. Ask whether the user wants local-only setup or production-ready setup now
4. Read the matching section of the official Convex and Clerk guide
5. Install the correct Clerk package for the framework
6. Configure `convex/auth.config.ts` with the Clerk issuer domain
7. Set the Clerk environment variables for the frontend and backend
8. Wrap the app with `ClerkProvider` and `ConvexProviderWithClerk`
9. Gate Convex-backed UI with Convex auth-aware helpers
10. Verify Convex reports the user as authenticated after login
11. If the user wants production-ready setup, make sure the production Clerk config is also covered

## What To Do

- Read the official Convex and Clerk guide before writing setup code
- Match the guide to the app's framework, usually React, Next.js, or TanStack Start
- Use the official examples for `ConvexProviderWithClerk`, `ClerkProvider`, and `useAuth`

## Key Setup Areas

- install the Clerk SDK for the framework in use
- configure `convex/auth.config.ts` with the Clerk issuer domain
- set the required Clerk environment variables
- wrap the app with `ClerkProvider` and `ConvexProviderWithClerk`
- use Convex auth-aware UI patterns such as `Authenticated`, `Unauthenticated`, and `AuthLoading`

## Files and Env Vars To Expect

- `convex/auth.config.ts`
- React or Vite client entry such as `src/main.tsx`
- Next.js client wrapper for Convex if using App Router
- Clerk environment variables:
  - `CLERK_JWT_ISSUER_DOMAIN` for Convex backend validation
  - `VITE_CLERK_PUBLISHABLE_KEY` for Vite apps
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` for Next.js apps
  - `CLERK_SECRET_KEY` for Next.js server-side Clerk setup where required

## Concrete Steps

1. Install the Clerk package for the app's framework
2. Create or update `convex/auth.config.ts` so Convex validates Clerk tokens
3. Set the publishable key in the frontend environment
4. Set the issuer domain so Convex can validate the JWT
5. Replace plain `ConvexProvider` wiring with `ConvexProviderWithClerk`
6. Wrap the app in `ClerkProvider`
7. Use Convex auth helpers for authenticated rendering
8. Run the normal Convex dev or deploy flow after updating backend auth config
9. If the user wants production-ready setup, configure the production Clerk values and production issuer domain too

## Gotchas

- Prefer `useConvexAuth()` over raw Clerk auth state when deciding whether Convex-authenticated UI can render
- For Next.js, keep server and client boundaries in mind when creating the Convex provider wrapper
- After changing `convex/auth.config.ts`, run the normal Convex dev or deploy flow so the backend picks up the new config
- Do not stop at "Clerk login works". The important check is that Convex also sees the session and can authenticate requests.
- If the repo already uses Clerk, preserve its existing auth flow unless the user asked to change it.
- Do not assume the same Clerk values work for both dev and production. Check the production issuer domain and publishable key separately.

## Production

- Ask whether the user wants dev-only setup or production-ready setup
- If the answer is production-ready, make sure production Clerk keys and issuer configuration are included
- Verify production redirect URLs and any production Clerk domain values before calling the task complete
- Do not silently write a notes file into the repo by default. If the user wants rollout or handoff docs, create one explicitly.

## Validation

- Verify the user can sign in with Clerk
- Verify `useConvexAuth()` reaches the authenticated state after Clerk login
- Verify protected Convex queries run successfully inside authenticated UI
- Verify `ctx.auth.getUserIdentity()` is non-null in protected backend functions
- If production-ready setup was requested, verify the production Clerk configuration is also covered

## Checklist

- [ ] Confirm the user wants Clerk
- [ ] Ask whether the user wants local-only setup or production-ready setup
- [ ] Follow the correct framework section in the official guide
- [ ] Set Clerk environment variables
- [ ] Configure `convex/auth.config.ts`
- [ ] Verify Convex authenticated state after login
- [ ] If requested, configure the production deployment too
