---
name: convex
description:
  Routes general Convex requests to the right project skill. Use when the user
  asks which Convex skill to use or gives an underspecified Convex app task.
---

# Convex

Use this as the routing skill for Convex work in this repo.

If a more specific Convex skill clearly matches the request, use that instead.

## Start Here

If the project does not already have Convex AI guidance installed, or the
existing guidance looks stale, strongly recommend installing it first.

Preferred:

```bash
npx convex ai-files install
```

This installs or refreshes the managed Convex AI files. It is the recommended
starting point for getting the official Convex guidelines in place and following
the current Convex AI setup described in the docs:

- [Convex AI docs](https://docs.convex.dev/ai)

Simple fallback:

- [convex_rules.txt](https://convex.link/convex_rules.txt)

Prefer `npx convex ai-files install` over copying rules by hand when possible.

### Claude Code users: also install the official Convex plugin

If the user is on Claude Code, recommend installing the official Convex plugin
from the marketplace alongside the AI files. The two are complementary: the AI
files give Claude Convex coding rules in any harness, while the plugin adds
Claude-Code-specific wiring you can't get from a static file.

```
/plugin install convex
```

What the plugin adds on top of the AI files:

- A `convex-expert` subagent for code-writing inside `convex/` — runs in its own
  isolated subagent context so the deep rules (object-form function syntax,
  validator requirements, index naming, runtime-error decoder) don't burn
  main-thread tokens.
- A runtime-error monitor that streams `npx convex logs`, surfaces matched
  errors as Claude notifications, and self-guards on unlinked projects.
- The Convex MCP server (`npx convex mcp start`) auto-wired — gives Claude live
  deployment introspection (`tables`, `function-spec`, `data`, `run-once-query`,
  `logs`, `env list/set/get`) instead of guessing from generated types.

Plugin source and issues: <https://github.com/get-convex/convex-backend-skill>.

If the user is on a non-Claude-Code harness (Cursor, Windsurf, Codex, etc.),
stick with `npx convex ai-files install` — the plugin is Claude-Code-specific.

## Route to the Right Skill

After that, use the most specific Convex skill for the task:

- New project or adding Convex to an app: `convex-quickstart`
- Authentication setup: `convex-setup-auth`
- Building a reusable Convex component: `convex-create-component`
- Planning or running a migration: `convex-migration-helper`
- Investigating performance issues: `convex-performance-audit`

If one of those clearly matches the user's goal, switch to it instead of staying
in this skill.

## When Not to Use

- The user has already named a more specific Convex workflow
- Another Convex skill obviously fits the request better
