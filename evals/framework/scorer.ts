import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { randomUUID } from "node:crypto";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { EvalRun, EvalTask, ScoredRun, SubmissionScore, CriterionScore, ScoringCriterion } from "./types.js";
import { findTaskFile, loadTask } from "./runner.js";
import { collectFiles } from "./agents/base.js";

const EVALS_ROOT = dirname(new URL(import.meta.url).pathname).replace("/framework", "");

export type JudgeModel = "opus" | "codex";

function formatFiles(files: Record<string, string>): string {
  return Object.entries(files)
    .map(([path, content]) => `### ${path}\n\`\`\`\n${content}\n\`\`\``)
    .join("\n\n");
}

function buildScoringPrompt(
  task: EvalTask,
  submissionId: string,
  files: Record<string, string>,
  fixtureFiles: Record<string, string>,
  criteria: ScoringCriterion[],
): string {
  // Separate agent-produced files from fixture files
  const agentFiles: Record<string, string> = {};
  const modifiedFixtureFiles: Record<string, string> = {};
  const unchangedFixtureFiles: string[] = [];

  for (const [path, content] of Object.entries(files)) {
    if (path.startsWith(".skills/") || path === "CLAUDE.md") continue; // skip injected skill files
    if (path in fixtureFiles) {
      if (fixtureFiles[path] === content) {
        unchangedFixtureFiles.push(path);
      } else {
        modifiedFixtureFiles[path] = content;
      }
    } else {
      agentFiles[path] = content;
    }
  }

  const criteriaText = criteria
    .map((c) => `- **${c.name}** (weight: ${c.weight}): ${c.description}`)
    .join("\n");

  const fixtureSection = Object.keys(fixtureFiles).length > 0
    ? `## Starting Code (Fixture -- provided to the agent, NOT written by the agent)
These files were given to the agent as a starting point. Bugs or issues in these
files are NOT the agent's fault. Only evaluate what the agent changed or added.

${formatFiles(fixtureFiles)}`
    : "";

  const unchangedSection = unchangedFixtureFiles.length > 0
    ? `\n## Unchanged Fixture Files
The agent did not modify these files: ${unchangedFixtureFiles.join(", ")}\n`
    : "";

  const modifiedSection = Object.keys(modifiedFixtureFiles).length > 0
    ? `\n## Modified Fixture Files (agent changed these)
${formatFiles(modifiedFixtureFiles)}\n`
    : "";

  const newFilesSection = Object.keys(agentFiles).length > 0
    ? `\n## New Files Created by Agent
${formatFiles(agentFiles)}\n`
    : "\n## New Files Created by Agent\n(None)\n";

  return `You are evaluating an AI coding agent's output for a Convex development task.

Your goal is to evaluate how well the agent handled the **skill-specific challenges**
of this task, not generic code quality. We are testing whether a particular skill
(a guidance document) helps agents produce better code in a specific domain.

## Skill Domain Being Tested
${task.skill_focus}

## Task Given to the Agent
${task.prompt}
${fixtureSection}
## Agent Output (Submission ${submissionId})
${unchangedSection}${modifiedSection}${newFilesSection}
## Scoring Criteria
${criteriaText}

## Critical Judging Rules

1. **Do NOT penalize the agent for bugs in the fixture code.** If a type mismatch,
   missing import, or other issue existed in the starting files and the agent did not
   introduce it, do not count it against any criterion. Only evaluate what the agent
   changed or created.

2. **Focus on the skill domain.** The criteria above target specific capabilities
   (e.g., indexing, contention reduction, component boundaries). Score based on how
   well the agent addressed these domain-specific challenges, not on peripheral
   code quality issues like formatting, naming, or unrelated type annotations.

3. **Evaluate the agent's approach, not just the final code.** If the agent used
   the right technique (e.g., sharded counters for contention) but had a minor
   implementation detail wrong, that's a 4, not a 2.

4. **"would_run" means the agent's contributions would work.** Pre-existing fixture
   bugs that the agent didn't touch should not affect this score. Only evaluate
   whether the code the agent wrote or modified would function correctly.

## Scoring Scale
1 = Agent completely missed the domain challenge or made it worse
2 = Agent attempted it but the approach is fundamentally wrong
3 = Agent used a reasonable approach but with significant gaps in the domain area
4 = Agent handled the domain challenge well with only minor issues
5 = Agent nailed it -- correct technique, proper implementation, production-ready

For each criterion, provide:
- The numeric score
- Specific reasoning about the agent's domain-relevant decisions (not fixture issues)
- If score < 5, what the agent should have done differently (actionable for skill improvement)

Also provide a "failure_summary": 1-3 sentences on the most impactful domain-specific
failures. Focus on what a skill author could fix by improving their skill's guidance.
If everything scored 4+, write "No significant failures."

Return ONLY valid JSON:
{
  "scores": {
    "criterion_name": {
      "score": <1-5>,
      "reasoning": "..."
    }
  },
  "failure_summary": "..."
}`;
}

async function scoreWithAnthropic(prompt: string, model: string): Promise<string> {
  const client = new Anthropic();
  const response = await client.messages.create({
    model,
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });
  const block = response.content[0];
  if (block.type !== "text") throw new Error("Unexpected response type");
  return block.text;
}

async function scoreWithOpenAI(prompt: string, model: string): Promise<string> {
  const client = new OpenAI();
  const response = await client.chat.completions.create({
    model,
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });
  return response.choices[0]?.message?.content ?? "";
}

async function callJudge(judge: JudgeModel, prompt: string): Promise<string> {
  if (judge === "opus") {
    return scoreWithAnthropic(prompt, "claude-opus-4-6");
  } else if (judge === "codex") {
    // Use o3 as the judge model via OpenAI
    return scoreWithOpenAI(prompt, "o3");
  }
  throw new Error(`Unknown judge: ${judge}`);
}

function parseScoreResponse(raw: string, criteria: ScoringCriterion[]): {
  scores: Record<string, CriterionScore>;
  failureSummary: string;
} {
  // Extract JSON from response (may be wrapped in markdown code block)
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`Could not parse JSON from judge response:\n${raw}`);

  const parsed = JSON.parse(jsonMatch[0]);
  const scores: Record<string, CriterionScore> = {};

  for (const criterion of criteria) {
    const entry = parsed.scores?.[criterion.name];
    if (!entry) {
      scores[criterion.name] = { score: 1, reasoning: "Not evaluated by judge" };
    } else {
      scores[criterion.name] = {
        score: Math.min(5, Math.max(1, Number(entry.score))),
        reasoning: String(entry.reasoning ?? ""),
      };
    }
  }

  return {
    scores,
    failureSummary: parsed.failure_summary ?? "No failure summary provided.",
  };
}

function computeWeightedTotal(scores: Record<string, CriterionScore>, criteria: ScoringCriterion[]): number {
  let totalWeight = 0;
  let weightedSum = 0;
  for (const c of criteria) {
    const score = scores[c.name]?.score ?? 0;
    weightedSum += score * c.weight;
    totalWeight += c.weight;
  }
  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

export interface ScoreOptions {
  runId: string;
  judges: JudgeModel[];
}

export async function scoreRun(options: ScoreOptions): Promise<ScoredRun> {
  const { runId, judges } = options;

  const resultsDir = join(EVALS_ROOT, "results");
  const runPath = join(resultsDir, `${runId}.json`);
  const evalRun: EvalRun = JSON.parse(await readFile(runPath, "utf-8"));

  const taskPath = await findTaskFile(evalRun.taskName);
  const task = await loadTask(taskPath);
  const criteria = task.scoring.criteria;

  // Load fixture files so the judge can distinguish pre-existing code from agent output
  const fixtureDir = join(dirname(taskPath), "fixture");
  let fixtureFiles: Record<string, string> = {};
  try {
    fixtureFiles = await collectFiles(fixtureDir);
  } catch {
    // No fixture directory
  }

  // Shuffle results and assign blind IDs
  const submissions = evalRun.results.map((r) => ({
    ...r,
    blindId: randomUUID().slice(0, 8),
  }));

  const allScores: SubmissionScore[] = [];
  const failureSummaries: Array<{ model: string; condition: string; judge: string; summary: string }> = [];

  for (const sub of submissions) {
    for (const judge of judges) {
      console.log(`  Scoring ${sub.blindId} (${sub.model}/${sub.condition}) with ${judge}...`);

      const prompt = buildScoringPrompt(task, sub.blindId, sub.files, fixtureFiles, criteria);

      try {
        const raw = await callJudge(judge, prompt);
        const { scores, failureSummary } = parseScoreResponse(raw, criteria);
        const weightedTotal = computeWeightedTotal(scores, criteria);

        allScores.push({
          submissionId: sub.blindId,
          model: sub.model,
          condition: sub.condition,
          judge,
          criteria: scores,
          weightedTotal,
        });

        failureSummaries.push({
          model: sub.model,
          condition: sub.condition,
          judge,
          summary: failureSummary,
        });

        console.log(`    total: ${weightedTotal.toFixed(2)}`);
      } catch (err) {
        console.error(`    SCORING FAILED: ${err}`);
      }
    }
  }

  const scoredRun: ScoredRun = {
    runId,
    taskName: evalRun.taskName,
    scores: allScores,
  };

  // Save scored results alongside failure analysis
  const outPath = join(resultsDir, `${runId}-scored.json`);
  await writeFile(outPath, JSON.stringify({ ...scoredRun, failureSummaries }, null, 2));
  console.log(`\nScored results saved to ${outPath}`);

  return scoredRun;
}
