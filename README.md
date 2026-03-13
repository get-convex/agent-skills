# Convex Agent Skills

Agent skills for common Convex workflows.

## Skill Philosophy

Skills in this repo should be laser-focused on a specific task or workflow.

A good skill helps an agent take action, for example:

- set up authentication
- design a schema
- create a function
- plan a migration

A skill should not exist just to provide generic background information. If content is mostly reference material, it should usually live in documentation, not as a standalone skill.

Reference material is still useful inside a skill, but only when it helps the agent complete a concrete task.

## Skills

The list below should match the current contents of `skills/`. Keep this section up to date whenever skills are added, removed, or renamed.

### `convex-quickstart` (`skills/convex_quickstart`)

Initialize a new Convex backend from scratch with schema, auth, and basic CRUD operations. Use when starting a new project or adding Convex to an existing app.

```bash
npx skills add convex/agent-skills --skill convex-quickstart
```

### `schema-builder` (`skills/convex_schema_builder`)

Design and generate Convex database schemas with proper validation, indexes, and relationships. Use when creating `schema.ts` or modifying table definitions.

```bash
npx skills add convex/agent-skills --skill schema-builder
```

### `function-creator` (`skills/convex_function_creator`)

Create Convex queries, mutations, and actions with proper validation, authentication, and error handling. Use when implementing new API endpoints.

```bash
npx skills add convex/agent-skills --skill function-creator
```

### `auth-setup` (`skills/convex_auth_setup`)

Set up Convex authentication with proper user management, identity mapping, and access control patterns. Use when implementing auth flows.

```bash
npx skills add convex/agent-skills --skill auth-setup
```

### `migration-helper` (`skills/convex_migration_helper`)

Plan and execute Convex schema migrations safely, including adding fields, creating tables, and data transformations. Use when schema changes affect existing data.

```bash
npx skills add convex/agent-skills --skill migration-helper
```

### `components-guide` (`skills/convex_components_guide`)

Guide to using Convex components for feature encapsulation. Learn about sibling components, creating your own, and when to use components vs monolithic code.

```bash
npx skills add convex/agent-skills --skill components-guide
```

### `convex-helpers-guide` (`skills/convex_helpers_guide`)

Discover and use `convex-helpers` utilities for relationships, filtering, sessions, custom functions, and more. Use when you need pre-built Convex patterns.

```bash
npx skills add convex/agent-skills --skill convex-helpers-guide
```

## Installation

```bash
# Install a specific skill
npx skills add convex/agent-skills --skill convex-quickstart

# Or install everything
npx skills add convex/agent-skills
```

## Usage

Invoke skills via slash commands:

```
/convex-quickstart
/schema-builder
/function-creator
/auth-setup
/migration-helper
/components-guide
/convex-helpers-guide
```

## Contributing

Each skill follows the [Agent Skills open standard](https://github.com/anthropics/skills):

1. Create a directory under `skills/` with the skill name
2. Add a `SKILL.md` file with YAML frontmatter:
   ```yaml
   ---
   name: skill-name
   description: Brief description
   ---
   ```
3. Include comprehensive examples with bad/good patterns
4. Add a checklist at the end of each skill
5. Update this root `README.md` whenever skills are added, removed, renamed, or substantially repositioned
