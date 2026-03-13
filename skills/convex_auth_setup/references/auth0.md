# Auth0

Official docs: https://docs.convex.dev/auth/auth0

Use this when the app already uses Auth0 or the user wants Auth0 specifically.

## Workflow

1. Confirm the user wants Auth0
2. Determine the app framework and whether Auth0 is already partly set up
3. Ask whether the user wants local-only setup or production-ready setup now
4. Complete the relevant Auth0 frontend quickstart if the app does not already have Auth0 wired up
5. Read the official Convex and Auth0 guide
6. Configure `convex/auth.config.ts` with the Auth0 domain and client ID
7. Set environment variables for local and production environments
8. Wrap the app with `Auth0Provider` and `ConvexProviderWithAuth0`
9. Gate Convex-backed UI with Convex auth state
10. Verify Convex reports the user as authenticated after Auth0 login
11. If the user wants production-ready setup, make sure the production Auth0 tenant and env vars are also covered

## What To Do

- Read the official Convex and Auth0 guide before writing setup code
- Make sure the app has already completed the relevant Auth0 quickstart for its frontend
- Use the official examples for `Auth0Provider` and `ConvexProviderWithAuth0`

## Key Setup Areas

- install the Auth0 SDK for the app's framework
- configure `convex/auth.config.ts` with the Auth0 domain and client ID
- set environment variables for local and production environments
- wrap the app with `Auth0Provider` and `ConvexProviderWithAuth0`
- use Convex auth state when gating Convex-backed UI

## Files and Env Vars To Expect

- `convex/auth.config.ts`
- frontend app entry or provider wrapper
- Auth0 environment variables commonly include:
  - `AUTH0_DOMAIN`
  - `AUTH0_CLIENT_ID`
  - `VITE_AUTH0_DOMAIN`
  - `VITE_AUTH0_CLIENT_ID`

## Concrete Steps

1. Complete the relevant Auth0 frontend quickstart if needed
2. Install the Auth0 SDK for the app's framework
3. Create or update `convex/auth.config.ts` with the Auth0 domain and client ID
4. Set frontend and backend environment variables
5. Wrap the app in `Auth0Provider`
6. Replace plain `ConvexProvider` wiring with `ConvexProviderWithAuth0`
7. Run the normal Convex dev or deploy flow after backend config changes
8. Verify the user can sign in through Auth0
9. Verify Convex recognizes the authenticated session
10. If the user wants production-ready setup, configure the production Auth0 tenant values and production environment variables too

## Gotchas

- The Convex docs assume the Auth0 side is already set up, so do not skip the Auth0 quickstart if the app is starting from scratch
- If login succeeds but Convex still reports unauthenticated, double-check `convex/auth.config.ts` and whether the backend config was synced
- Keep dev and prod tenants separate if the project uses different Auth0 environments
- Do not confuse "Auth0 login works" with "Convex can validate the Auth0 token". Both need to work.
- If the repo already uses Auth0, preserve existing redirect and tenant configuration unless the user asked to change it.
- Do not assume the local Auth0 tenant settings match production. Verify the production domain, client ID, and callback URLs separately.

## Production

- Ask whether the user wants dev-only setup or production-ready setup
- If the answer is production-ready, make sure the production Auth0 tenant values, callback URLs, and Convex deployment config are all covered
- Verify production environment variables and redirect settings before calling the task complete
- Do not silently write a notes file into the repo by default. If the user wants rollout or handoff docs, create one explicitly.

## Validation

- Verify the user can complete the Auth0 login flow
- Verify Convex-authenticated UI renders only after Convex auth state is ready
- Verify protected Convex queries succeed after login
- Verify `ctx.auth.getUserIdentity()` is non-null in protected backend functions
- If production-ready setup was requested, verify the production Auth0 configuration is also covered

## Checklist

- [ ] Confirm the user wants Auth0
- [ ] Ask whether the user wants local-only setup or production-ready setup
- [ ] Complete the relevant Auth0 frontend setup
- [ ] Configure `convex/auth.config.ts`
- [ ] Set environment variables
- [ ] Verify Convex authenticated state after login
- [ ] If requested, configure the production deployment too
