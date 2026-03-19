# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a collection of Convex agent skills following the [Agent Skills open standard](https://github.com/anthropics/skills). Each skill is a standalone SKILL.md file providing educational guides and code examples for common Convex backend workflows. This is a pure documentation/skills repository with no build system, package.json, or compiled code.

Skills are installed by end users via `npx skills add convex/agent-skills --skill <skill-name>` and invoked as slash commands (e.g., `/convex-quickstart`).

## Repository Structure

All skills live under `skills/`, each in a directory containing a single `SKILL.md` file with YAML frontmatter (`name` and `description` fields). The seven skills cover: quickstart, schema design, function creation, auth setup, migrations, components, and convex-helpers utilities.

Directory naming uses underscores (`convex_quickstart`), while skill names in frontmatter and slash commands use hyphens (`convex-quickstart`).

## Style Rules (from AGENTS.md)

- **No emojis** in markdown or code comments
- Use `Yes/No` in tables, not checkmarks or emoji
- Code examples use `// Bad:` and `// Good:` comment patterns
- Each skill must have: clear heading, "When to Use" section, bad/good code examples, complete runnable examples, and a checklist at the end

## Skill Content Patterns

Skills teach Convex-specific patterns including:
- Document-relational schema design with `v.*` validators and proper indexing
- Three function types (queries, mutations, actions) all requiring `args` validators and `returns` types
- Centralized auth helpers (`getCurrentUser`) with identity resolution via `ctx.auth.getUserIdentity()`
- Additive migration strategy for zero-downtime schema changes
- Component-based feature encapsulation via `convex.config.ts`
