import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { randomUUID } from "node:crypto";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { EvalRun, EvalTask, ScoredRun, SubmissionScore, CriterionScore, ScoringCriterion } from "./types.js";
import { findTaskFile, loadTask } from "./runner.js";

const EVALS_ROOT = dirname(new URL(import.meta.url).pathname).replace("/framework", "");

export type JudgeModel = "opus" | "codex";

function buildScoringPrompt(
  task: EvalTask,
  submissionId: string,
  files: Record<string, string>,
  criteria: ScoringCriterion[],
): string {
  const fileContents = Object.entries(files)
    .map(([path, content]) => `### ${path}\n\`\`\`\n${content}\n\`\`\``)
    .join("\n\n");

  const criteriaText = criteria
    .map((c) => `- **${c.name}** (weight: ${c.weight}): ${c.description}`)
    .join("\n");

  return `You are a senior engineer evaluating code produced by an AI coding agent for a Convex development task.
Your evaluation must be thorough and actionable. For each criterion, explain specifically what went wrong or right so that the skill author can improve the guidance.

## Task Given to the Agent
${task.prompt}

## Code Produced (Submission ${submissionId})
${fileContents || "(No files produced)"}

## Scoring Criteria
${criteriaText}

## Instructions
Score each criterion from 1 to 5:
1 = Fundamentally wrong or missing entirely
2 = Attempted but has major issues that would prevent it from working
3 = Functional but has notable gaps or deviations from best practices
4 = Good with only minor issues
5 = Excellent, production-quality

For each criterion, provide:
- The numeric score
- Specific reasoning citing code from the submission
- If score < 5, what specifically would need to change to improve (be concrete: name the file, line, and fix)

Also provide a "failure_summary" field: a 1-3 sentence summary of the most impactful failures across all criteria. If everything scored 4+, write "No significant failures."

Return ONLY valid JSON in this exact format:
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

  const task = await loadTask(await findTaskFile(evalRun.taskName));
  const criteria = task.scoring.criteria;

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

      const prompt = buildScoringPrompt(task, sub.blindId, sub.files, criteria);

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
