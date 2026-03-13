# Agent Instructions

Rules for contributing to this repository.

## Skill Philosophy

Skills in this repository should be narrowly focused on a specific task or workflow.

A good skill helps an agent take a concrete action, for example:
- set up authentication
- design a schema
- create a Convex function
- plan a migration

Do not create skills that mainly provide generic background information or broad documentation. If content is mostly reference material, it should usually live in docs, not as a standalone skill.

Reference material is fine inside a skill when it directly helps complete the task the skill is for.

## Style Guidelines

- **No emojis** in any markdown files or code comments
- Use `Yes/No` in tables instead of checkmarks or emoji
- Keep examples concise and focused
- Use `// Bad:` and `// Good:` comments in code examples
- Follow existing file patterns in `skills/`

## File Structure

Each skill should have:
- Clear heading with brief description
- "When to Use" section
- Code examples showing bad vs good patterns
- Complete, runnable examples
- Checklist at the end

## Maintenance

- If skills are added, removed, renamed, or substantially repositioned, update the root `README.md`
- Keep the skill list in the root `README.md` in sync with the current contents of `skills/`

## Code Examples

```ts
// Bad: description of the problem
 

// Good: description of the solution
 
```
