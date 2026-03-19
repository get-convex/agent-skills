import { readFile, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { AgentModel, Condition, ReportRow, ScoringCriterion, SubmissionScore } from "./types.js";
import { findTaskFile, loadTask } from "./runner.js";

const EVALS_ROOT = dirname(new URL(import.meta.url).pathname).replace("/framework", "");

interface ScoredRunWithFailures {
  runId: string;
  taskName: string;
  scores: SubmissionScore[];
  failureSummaries: Array<{ model: string; condition: string; judge: string; summary: string }>;
}

export async function generateReport(runId: string): Promise<string> {
  const resultsDir = join(EVALS_ROOT, "results");
  const scoredPath = join(resultsDir, `${runId}-scored.json`);
  const data: ScoredRunWithFailures = JSON.parse(await readFile(scoredPath, "utf-8"));

  const task = await loadTask(await findTaskFile(data.taskName));
  const criteria = task.scoring.criteria;

  // Group scores by model+condition, average across judges and runs
  const groups = new Map<string, SubmissionScore[]>();
  for (const score of data.scores) {
    const key = `${score.model}|${score.condition}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(score);
  }

  const rows: ReportRow[] = [];
  const baselineTotals = new Map<AgentModel, number>();

  for (const [key, scores] of groups) {
    const [model, condition] = key.split("|") as [AgentModel, Condition];

    const criteriaScores: Record<string, number> = {};
    for (const c of criteria) {
      const vals = scores.map((s) => s.criteria[c.name]?.score ?? 0).filter((v) => v > 0);
      criteriaScores[c.name] = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    }

    const total = scores.reduce((sum, s) => sum + s.weightedTotal, 0) / scores.length;

    if (condition === "baseline") {
      baselineTotals.set(model, total);
    }

    rows.push({ model, condition, criteriaScores, total });
  }

  // Add deltas
  for (const row of rows) {
    if (row.condition === "with-skill") {
      const baseline = baselineTotals.get(row.model);
      if (baseline !== undefined) {
        row.delta = row.total - baseline;
      }
    }
  }

  // Sort: group by model, baseline first
  rows.sort((a, b) => {
    if (a.model !== b.model) return a.model.localeCompare(b.model);
    return a.condition === "baseline" ? -1 : 1;
  });

  // Build markdown report
  const lines: string[] = [];
  lines.push(`# Eval Report: ${data.taskName}`);
  lines.push(`Run ID: \`${data.runId}\`\n`);

  // Scores table
  const criteriaNames = criteria.map((c) => c.name);
  const header = `| Model | Condition | ${criteriaNames.join(" | ")} | Total | Delta |`;
  const sep = `|-------|-----------|${criteriaNames.map(() => "------").join("|")}|-------|-------|`;

  lines.push(header);
  lines.push(sep);

  for (const row of rows) {
    const scores = criteriaNames.map((name) => (row.criteriaScores[name] ?? 0).toFixed(1));
    const delta = row.delta !== undefined ? (row.delta >= 0 ? `+${row.delta.toFixed(2)}` : row.delta.toFixed(2)) : "-";
    lines.push(`| ${row.model} | ${row.condition} | ${scores.join(" | ")} | ${row.total.toFixed(2)} | ${delta} |`);
  }

  // Failure analysis section
  if (data.failureSummaries?.length) {
    lines.push("");
    lines.push("## Failure Analysis");
    lines.push("");
    lines.push("Key failures identified by judges (use these to iterate on skills without overfitting to specific eval tasks):");
    lines.push("");

    // Group by model+condition
    const failGroups = new Map<string, string[]>();
    for (const f of data.failureSummaries) {
      const key = `${f.model} / ${f.condition}`;
      if (!failGroups.has(key)) failGroups.set(key, []);
      failGroups.get(key)!.push(`[${f.judge}] ${f.summary}`);
    }

    for (const [key, summaries] of failGroups) {
      lines.push(`### ${key}`);
      for (const s of summaries) {
        lines.push(`- ${s}`);
      }
      lines.push("");
    }
  }

  // Per-criterion detailed reasoning
  lines.push("## Detailed Scoring Reasoning");
  lines.push("");
  lines.push("Expand per-submission reasoning from the scored JSON for detailed iteration guidance.");
  lines.push(`See: \`results/${data.runId}-scored.json\``);

  const report = lines.join("\n");

  // Save report
  const reportPath = join(resultsDir, `${data.runId}-report.md`);
  await writeFile(reportPath, report);
  console.log(`Report saved to ${reportPath}`);

  return report;
}
