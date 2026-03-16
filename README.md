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

Invoke skills via slash commands:

```
/convex-quickstart
/convex-setup-auth
/convex-migration-helper
/convex-create-component
/convex-performance-audit
```

## Skill Philosophy

Skills in this repo should be laser-focused on a specific task or workflow.

A good skill helps an agent take action, for example:

- set up authentication
- design a schema
- create a function
- plan a migration

A skill should not exist just to provide generic background information. If content is mostly reference material, it should usually live in documentation, not as a standalone skill.

Reference material is still useful inside a skill, but only when it helps the agent complete a concrete task.

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
