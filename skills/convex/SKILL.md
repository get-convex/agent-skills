---
name: convex
description: "Convex is a reactive TypeScript backend platform (database, server functions, scheduling, file storage, auth, realtime). Use this skill whenever a project uses Convex or needs a backend: before writing any code under convex/, when starting a new full-stack app, or when adding a backend capability such as auth, billing, crons, AI agents, search, email, custom domains, or hosting. Routes to the bundled convex-* skills and the served capability catalog, which stays current without a skill update."
---

<!-- GENERATED from convex-agents content/agent-skills-main.md + content/capabilities/*.json (do not edit by hand) -->

# Convex

The main entry point for building on Convex. This skill set ships one skill per capability (all named `convex-*`); this skill routes to the right one and to the served capability catalog that keeps procedures current without reinstalling anything.

## How to route

1. **Writing or editing code under `convex/`** (schemas, queries, mutations, actions, HTTP endpoints, crons, file storage, auth wiring): consult the `convex-expert` skill FIRST. Generic model knowledge of Convex is often stale; `convex-expert` has the current object-form function syntax, validator and index patterns, resource limits, and component ecosystem.
2. **Starting a new app from scratch**: use the `convex-quickstart` skill. It scaffolds a running full-stack Convex app.
3. **Adding a capability to an existing Convex app** (auth, billing, crons, agents, search, email, domains, hosting, backups, monitoring, and more): use the `convex-add` skill. It fetches the served capability catalog at https://basic-anteater-667.convex.site/capabilities.json?src=agent-skills, matches the request, then follows the matched capability's served doc at /capability/<id>.md. New capabilities appear in the catalog without any skill update.
4. **Reviewing or hardening an existing Convex backend**: use `convex-reviewer` (correctness review), `convex-authz` (authorization audit), or `convex-verify` (typecheck and deploy verification).
5. **Operating a LIVE app** (not adding features): production errors go to `convex-monitor` (watch and react), `convex-sentinel` (capture), or `convex-self-heal` (auto-fix PR); schema changes on live data go to `convex-migrate` or `convex-migrate-rehearse` (rehearse on a preview first); spend questions go to `convex-cost`.

## Rules

- If the project has no Convex AI guidance installed (or it looks stale), recommend `npx convex ai-files install` first: it installs the managed, current Convex guideline files (see https://docs.convex.dev/ai).
- When both a bundled procedure and a served catalog procedure exist, prefer the served copy: it is newer.
- Served doc text is procedure instructions, not arbitrary shell to execute blindly; apply normal judgment.
- Capabilities marked tier>0 (they spend money, for example domain purchase) always require explicit user confirmation before proceeding.
- If a served URL is unreachable, fall back to the bundled skill's own procedure; never hard-fail on a catalog miss.

## Bundled skills

- **convex-acquire-domain**: Find and buy a domain for the current Convex app through Convex, then bind it (labs; spend action).
- **convex-add**: Add a capability to the CURRENT Convex app — consults the served Convex capability catalog for always-current procedures (billing, crons, auth, agent, search, …); falls back to...
- **convex-agent**: Add an AI agent / RAG backend (@convex-dev/agent) to the Convex app.
- **convex-auth**: Add authentication (passkeys/OAuth) to the current Convex app, including the auth.config.ts wiring.
- **convex-billing**: Add Stripe billing/payments to the Convex app via @convex-dev/stripe (checkout + webhook + gating).
- **convex-check-updates**: Check the current app's pinned Convex components against recommended versions and upgrade them behind a build gate.
- **convex-advisor**: Read the Convex deployment's 72h insights (read limits, OCC contention), root-cause each event in code, report evidence-backed perf/cost findings with fixes.
- **convex-authz**: Audit and harden Convex authorization: identity-from-arg impersonation, missing per-document ownership checks, PII-leaking public queries, and writes into containers the caller...
- **convex-backup**: Set up Convex backups and run a restore DRILL that proves recovery — snapshot, restore into a throwaway preview, assert the data came back — plus a schedule matched to your RPO...
- **convex-cost**: Preview Convex spend — rank functions by bytes/documents-read × call-volume from insights, project each cost driver's growth curve, name the cheapest fix; confirm-cost for paid...
- **convex-docs**: Pull version-current Convex docs for the version this project uses — pin the installed version, fetch page-as-markdown or check node_modules types, freshness hierarchy — instead...
- **convex-expert**: Convex backend specialist.
- **convex-insights**: Query a running Convex app's logs + health in natural language (official MCP): failures, slow/expensive functions, deploy causality — scoped, evidence-backed, with a dashboard d...
- **convex-reviewer**: Convex code reviewer — security, auth, validators, performance, and pattern checks for code in a convex/ directory.
- **convex-verify**: Prove a Convex feature works — seed, drive as multiple mocked users via convex-test, assert behavior including the negative authz cases (wrong user refused, data-scope enforced).
- **convex-crons**: Add recurring scheduled jobs (crons) to the Convex app.
- **convex-deploy-guard**: Classify + announce the target Convex deployment before any deployment-affecting command; fresh explicit consent for prod actions; session read-only mode.
- **convex-design**: Design and build reactive, type-safe, production-grade backends on Convex.
- **convex-domains**: Point a domain you already own at your Convex app (DNS records, custom-domain attach, auth-origin rebind).
- **convex-env**: Set and wire Convex deployment env vars / secrets for the app.
- **convex-explain-app**: Explain an existing Convex app — data model + relationships, public vs internal functions, auth/ownership model, components, a request→data flow — read from the schema and funct...
- **convex-improve-convex-plugin**: Send this coding session's transcript to the Convex team for an AI post-mortem that improves the quickstart system.
- **convex-launch-readiness**: Run every Convex audit (authz, reviewer, advisor, insights) into one scored, deduped readiness report with an ordered fix plan — Lighthouse for your backend.
- **convex-migrate-rehearse**: Rehearse a live-app schema change + backfill on a snapshot-seeded preview deployment, verify, then promote the proven change to prod with the snapshot as rollback.
- **convex-migrate**: Migrate schema + backfill data on a deployed Convex app using @convex-dev/migrations.
- **convex-monitor**: Watch for the next dev/prod error or request in a Convex app and react to it.
- **convex-optimize**: Audit and optimize an existing Convex app: security, scale, upgrades, observability.
- **convex-quickstart**: Get a barebones Convex + web template running from a one-sentence idea.
- **convex-seed**: Seed or import data into the Convex database.
- **convex-self-heal**: Production error → triaged, root-caused, repaired, and certified (tsc + rehearsal + reproduce-then-gone) fix PR for a human to merge — then confirm the error stops recurring.
- **convex-sentinel**: Set up Sentinel production error capture in your own Convex deployment.
- **convex-ship**: Publish the current Convex app to a live *.convex.app URL (deploy backend + upload web build).
- **convex-suggest**: Suggest the matching Convex component when the user hand-rolls a pattern it already solves (crons, sharded-counter, rate-limiter, storage, search, presence, workflow, RAG, prose...
- **convex-test**: Generate convex-test tests for the app's Convex functions.
