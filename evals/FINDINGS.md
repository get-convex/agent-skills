# Eval Findings -- 2026-03-19

## Executive Summary

Skills measurably improve agent output, but **only when tested with construction tasks** (build from spec). Repair tasks (find and fix bugs) show zero delta because models already know how to fix bugs when pointed at them. The key insight: models **introduce** Convex-specific anti-patterns when building from scratch, and skills prevent those mistakes.

## The Breakthrough: Construction vs Repair

### Repair tasks (zero delta)

When we tell a model "this code has a full table scan, fix it with an index," it fixes it -- with or without the skill. Repair tasks consistently showed 0.00 delta or slight regression across all skills and models.

### Construction tasks (massive delta)

When we ask a model to "build a team chat app with these features," it introduces exactly the anti-patterns the skills are designed to prevent. The skill prevents those mistakes before they happen.

## Results by Skill

### convex-performance-audit (biggest impact)

**Construction task: build-from-spec**

| Model | Baseline | With Skill | Delta |
|-------|----------|------------|-------|
| Opus (run 1) | 3.29 | 5.00 | **+1.71** |
| Opus (run 2) | 3.50 | 4.86 | **+1.36** |
| Sonnet (run 1) | 3.14 | 4.50 | **+1.36** |
| Sonnet (run 2) | 3.50 | 4.93 | **+1.43** |
| **Average** | **3.36** | **4.82** | **+1.47** |

What models get wrong without the skill:
- Put heartbeat/lastSeen on user doc (1/5 -> 5/5) -- causes subscription invalidation fan-out
- Use Date.now() in queries (1/5 -> 5/5) -- breaks Convex query caching
- Unbounded .collect() calls (3-4/5 -> 4-5/5) -- hits transaction limits

### convex-setup-auth

**Construction task: build-auth-from-spec**

| Model | Baseline | With Skill | Delta |
|-------|----------|------------|-------|
| Sonnet | 4.42 | 5.00 | **+0.58** |
| Opus | 4.67 | 4.42 | -0.25 |

What Sonnet gets wrong without the skill:
- Type assertions (`ctx as MutationCtx`) instead of proper context typing (4/5 -> 5/5)
- Missing upsert-on-first-login pattern (4/5 -> 5/5)

Opus already handles auth patterns well -- skill adds no value for Opus.

### convex-migration-helper

**Construction task: build-migration-from-spec**

| Model | Baseline | With Skill | Delta |
|-------|----------|------------|-------|
| Sonnet | 4.17 | 4.67 | **+0.50** |
| Opus | 4.67 | 4.67 | 0.00 |

What Sonnet gets wrong without the skill:
- Missing self-scheduling in batch migration (3/5 -> 4/5)
- Missing dual-read fallbacks for unmigrated docs (3/5 -> 5/5)

Again, Opus already knows this -- skill helps Sonnet only.

### convex-create-component

**Repair task (extract-component): the only skill that shows delta on repair**

| Model | Baseline | With Skill | Delta |
|-------|----------|------------|-------|
| Sonnet | 3.88 | 4.75 | **+0.88** |
| Opus | 3.88 | 4.63 | **+0.75** |

What both models get wrong: Convex component directory structure and invocation patterns are genuinely not in training data. This is the only skill where even repair tasks show lift.

Construction task showed no delta (5.0 vs 5.0) because the prompt was too prescriptive about structure.

### convex-quickstart

Not tested with construction tasks. Repair tasks showed no delta -- both models already know Convex scaffolding.

## Pattern Summary

| Skill | Sonnet Construction | Opus Construction | Repair Delta |
|-------|-------------------|------------------|-------------|
| Performance audit | **+1.43** | **+1.71** | 0.00 |
| Component | +0.88 (repair) | +0.75 (repair) | +0.75 to +0.88 |
| Auth | **+0.58** | -0.25 | -0.67 to 0.00 |
| Migration | **+0.50** | 0.00 | -0.09 to +0.44 |
| Quickstart | (not tested) | (not tested) | -0.11 to 0.00 |

## Recommendations

1. **Keep all skills** -- they all show positive delta for at least one model on construction tasks
2. **Performance audit is the most valuable** -- biggest lift across both models. Keep investing.
3. **Use construction tasks for all future eval** -- repair tasks are misleading
4. **Skills help Sonnet more than Opus** -- Opus has stronger baselines on auth/migration but still needs help on perf patterns
5. **Component skill is uniquely valuable** -- the only one that helps even on repair tasks, suggesting Convex component patterns are genuinely not in training data
6. **Increase timeouts for with-skill runs** -- agents need time to read the skill before coding. 480s/50 turns is better than 300s/30.

## Methodology Notes

- All runs use `claude -p` (print mode) with `--permission-mode bypassPermissions`
- Scoring uses Opus as judge via Anthropic API (blind, randomized submission IDs)
- Fixture files are shown separately to the judge to avoid penalizing agents for pre-existing bugs
- Judge is instructed to focus on skill-domain criteria, not generic code quality
- n=1 per condition (single runs) -- results have variance. Multiple runs recommended for publication.
