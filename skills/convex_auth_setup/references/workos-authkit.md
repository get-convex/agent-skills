# WorkOS AuthKit

Official docs: https://docs.convex.dev/auth/authkit/

Use this when the app already uses WorkOS or the user wants AuthKit specifically.

## Workflow

1. Confirm the user wants WorkOS AuthKit
2. Determine whether they want:
   - a Convex-managed WorkOS team
   - an existing WorkOS team
3. Ask whether the user wants local-only setup or production-ready setup now
4. Read the official Convex and WorkOS AuthKit guide
5. Follow the correct branch of the setup flow based on that choice
6. Configure the required WorkOS environment variables
7. Configure `convex/auth.config.ts` for WorkOS-issued JWTs
8. Wire the client provider and callback flow
9. Verify authenticated requests reach Convex
10. If the user wants production-ready setup, make sure the production WorkOS configuration is covered too
11. Only add `storeUser` or a `users` table if the app needs first-class user rows inside Convex

## What To Do

- Read the official Convex and WorkOS AuthKit guide before writing setup code
- Determine whether the user wants a Convex-managed WorkOS team or an existing WorkOS team
- Follow the current setup flow from the docs instead of relying on older examples

## Key Setup Areas

- package installation for the app's framework
- environment variables such as `WORKOS_CLIENT_ID`, `WORKOS_API_KEY`, and redirect configuration
- `convex/auth.config.ts` wiring for WorkOS-issued JWTs
- client provider setup and token flow into Convex
- login callback and redirect configuration

## Files and Env Vars To Expect

- `convex/auth.config.ts`
- frontend auth provider wiring
- callback or redirect route setup where the framework requires it
- WorkOS environment variables commonly include:
  - `WORKOS_CLIENT_ID`
  - `WORKOS_API_KEY`
  - `WORKOS_COOKIE_PASSWORD`
  - `NEXT_PUBLIC_WORKOS_REDIRECT_URI`

## Concrete Steps

1. Choose Convex-managed or existing WorkOS team
2. Get the correct WorkOS client ID and API key for that path
3. Set the required WorkOS environment variables
4. Create or update `convex/auth.config.ts` for WorkOS JWT validation
5. Run the normal Convex dev or deploy flow so backend config is synced
6. Wire the WorkOS client provider in the app
7. Configure callback and redirect handling
8. Verify the user can sign in and return to the app
9. Verify Convex sees the authenticated user after login
10. If the user wants production-ready setup, configure the production client ID, API key, redirect URI, and deployment settings too

## Gotchas

- The docs split setup between Convex-managed and existing WorkOS teams, so ask which path the user wants if it is not obvious
- Keep dev and prod WorkOS configuration separate where the docs call for different client IDs or API keys
- Only add `storeUser` or a `users` table if the app needs first-class user rows inside Convex
- Do not mix dev and prod WorkOS credentials or redirect URIs
- If the repo already contains WorkOS setup, preserve the current tenant model unless the user wants to change it

## Production

- Ask whether the user wants dev-only setup or production-ready setup
- If the answer is production-ready, make sure the production WorkOS client ID, API key, redirect URI, and Convex deployment config are all covered
- Verify the production redirect and callback settings before calling the task complete
- Do not silently write a notes file into the repo by default. If the user wants rollout or handoff docs, create one explicitly.

## Validation

- Verify the user can complete the login flow and return to the app
- Verify Convex receives authenticated requests after login
- Verify `convex/auth.config.ts` matches the chosen WorkOS setup path
- Verify environment variables differ correctly between local and production where needed
- If production-ready setup was requested, verify the production WorkOS configuration is also covered

## Checklist

- [ ] Confirm the user wants WorkOS AuthKit
- [ ] Ask whether the user wants local-only setup or production-ready setup
- [ ] Choose Convex-managed or existing WorkOS team
- [ ] Configure WorkOS environment variables
- [ ] Configure `convex/auth.config.ts`
- [ ] Verify authenticated requests reach Convex after login
- [ ] If requested, configure the production deployment too
