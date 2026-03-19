# Convex Agent Skills

Agent skills for common Convex workflows.

## Install

```bash
# Choose which skills you want
npx skills add get-convex/agent-skills

# OR Install all skills
npx skills add get-convex/agent-skills --all
```

## Usage

Skills are applied automatically when the agent determines they're relevant. How
you manually invoke them depends on your tool:

| Tool                     | Manual invocation |
| ------------------------ | ----------------- |
| Cursor                   | `/skill-name`     |
| VS Code (GitHub Copilot) | `/skill-name`     |
| Claude Code              | `/skill-name`     |
| Windsurf                 | `@skill-name`     |
| Codex (OpenAI)           | `$skill-name`     |

For example, to kick off auth setup in Cursor or Claude Code:

```
/convex-setup-auth
```

In Windsurf:

```
@convex-setup-auth
```

## Skill Philosophy

Skills in this repo should be laser-focused on a specific task or workflow.

A good skill helps an agent take action, for example:

- set up authentication
- create a component
- perform a migration
- diagnose performance issues

A skill should not exist just to provide generic background information. If content is mostly reference material, it should usually live in documentation, not as a standalone skill.

Reference material is still useful inside a skill, but only when it helps the agent complete a concrete task.

## Evals

The `evals/` directory contains a framework for measuring whether skills actually help agents produce better code. It runs agents with and without each skill, then blind-scores the results.

### Quick start

```bash
cd evals
npm install

# Run an eval (uses your existing claude/codex CLI auth)
npx tsx run.ts --task optimize-query --models sonnet --runs 1

# Score results (needs ANTHROPIC_API_KEY for opus judge, OPENAI_API_KEY for codex judge)
npx tsx score.ts --run-id <run-id> --judges opus

# Generate comparison report with failure analysis
npx tsx report.ts --run-id <run-id>
```

### Available tasks

**Construction tasks** (recommended -- test whether skills prevent anti-patterns during building):

| Task | Skill | What it tests |
|------|-------|---------------|
| `build-from-spec` | convex-performance-audit | Build a chat app, score perf anti-patterns introduced |
| `build-auth-from-spec` | convex-setup-auth | Build a doc editor with auth, score auth patterns |
| `build-migration-from-spec` | convex-migration-helper | Evolve a schema, score migration safety |

**Repair tasks** (test bug-fixing ability -- less useful for measuring skill impact):

| Task | Skill | What it tests |
|------|-------|---------------|
| `subtle-perf-bugs` | convex-performance-audit | Find 7 subtle Convex-specific perf bugs |
| `subscription-overload` | convex-performance-audit | Fix subscription invalidation and N+1 patterns |
| `extract-component` | convex-create-component | Extract reusable component from app code |
| `component-with-callbacks` | convex-create-component | Build component with callbacks and auth boundary |
| `scaffold-react-app` | convex-quickstart | Build a Convex + React app from scratch |
| `optimize-query` | convex-performance-audit | Fix basic perf issues in existing code |
| `add-clerk-auth` | convex-setup-auth | Add auth to an existing app |
| `add-field-migration` | convex-migration-helper | Safely migrate schema + backfill data |

### One-command eval

```bash
# Run + score + report in one command
npx tsx eval.ts --task build-from-spec --models sonnet --judges opus

# Multi-model comparison
npx tsx eval.ts --task build-from-spec --models sonnet,opus --judges opus
```

### Key finding

Construction tasks show dramatically larger skill impact than repair tasks. Models already know how to fix bugs when told about them, but they introduce Convex-specific anti-patterns when building from scratch. The skill prevents those mistakes.

Example deltas on `build-from-spec` (performance audit):
- Opus: baseline 3.29 -> with skill 5.00 (+1.71)
- Sonnet: baseline 3.14 -> with skill 4.50 (+1.36)

## Contributing

Before contributing, review the core Agent Skills docs:

- [Overview](https://agentskills.io/home)
- [What are skills?](https://agentskills.io/what-are-skills)
- [Specification](https://agentskills.io/specification)
- [Optimizing skill descriptions](https://agentskills.io/skill-creation/optimizing-descriptions)
- [Evaluating skill output quality](https://agentskills.io/skill-creation/evaluating-skills)

If your skill bundles scripts, also read [Using scripts in skills](https://agentskills.io/skill-creation/using-scripts).

Validate skills by trying to use them in a realistic temp project, not just by reading them.

- Push the skill as far as possible with an agent in a throwaway directory
- If a human must intervene, ask explicitly for the exact action needed and then continue
- Record what worked, where the agent got stuck, and what confused the flow
- Feed those learnings back into the skill so the next run is better
- For UI-facing skills such as auth setup, validate the actual browser flow during skill development, not just code generation or a successful build

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
