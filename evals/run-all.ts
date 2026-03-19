import { runEval } from "./framework/runner.js";
import { scoreRun, JudgeModel } from "./framework/scorer.js";
import { generateReport } from "./framework/report.js";
import { AgentModel } from "./framework/types.js";

const args = process.argv.slice(2);

function getArg(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`);
  return idx >= 0 ? args[idx + 1] : undefined;
}

const modelsRaw = getArg("models") ?? "sonnet";
const judgesRaw = getArg("judges") ?? "opus";
const runsRaw = getArg("runs") ?? "1";

const models = modelsRaw.split(",") as AgentModel[];
const judges = judgesRaw.split(",") as JudgeModel[];
const runs = parseInt(runsRaw, 10);

// Construction tasks -- the ones that show real skill impact
const CONSTRUCTION_TASKS = [
  "build-from-spec",           // perf audit
  "build-auth-from-spec",      // auth
  "build-migration-from-spec", // migration
];

// Cascading diagnosis tasks -- show skill impact on multi-cause debugging
const DIAGNOSIS_TASKS = [
  "app-is-laggy",              // perf audit (cascading)
];

// Implicit architecture tasks -- feature requests requiring non-obvious data shapes
const ARCHITECTURE_TASKS = [
  "add-unread-badges",         // perf audit (implicit architecture)
];

// Repair tasks that show component skill impact
const REPAIR_TASKS = [
  "extract-component",         // component (repair shows delta)
];

const ALL_TASKS = [...CONSTRUCTION_TASKS, ...DIAGNOSIS_TASKS, ...ARCHITECTURE_TASKS, ...REPAIR_TASKS];

async function main() {
  const summaryRows: Array<{
    task: string;
    model: AgentModel;
    baseline: number;
    withSkill: number;
    delta: number;
  }> = [];

  for (const taskName of ALL_TASKS) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`  TASK: ${taskName}`);
    console.log(`${"=".repeat(60)}`);

    const evalRun = await runEval({ taskName, models, runs });

    console.log("\n--- Scoring ---\n");
    const scoredRun = await scoreRun({ runId: evalRun.id, judges });

    console.log("\n--- Report ---\n");
    const report = await generateReport(evalRun.id);
    console.log(report);

    // Extract scores for summary
    for (const model of models) {
      const baselineScores = scoredRun.scores.filter(
        (s) => s.model === model && s.condition === "baseline"
      );
      const skillScores = scoredRun.scores.filter(
        (s) => s.model === model && s.condition === "with-skill"
      );

      const baselineAvg = baselineScores.length > 0
        ? baselineScores.reduce((sum, s) => sum + s.weightedTotal, 0) / baselineScores.length
        : 0;
      const skillAvg = skillScores.length > 0
        ? skillScores.reduce((sum, s) => sum + s.weightedTotal, 0) / skillScores.length
        : 0;

      summaryRows.push({
        task: taskName,
        model,
        baseline: baselineAvg,
        withSkill: skillAvg,
        delta: skillAvg - baselineAvg,
      });
    }
  }

  // Print summary table
  console.log(`\n${"=".repeat(60)}`);
  console.log("  SUMMARY: Skill Impact Across All Tasks");
  console.log(`${"=".repeat(60)}\n`);

  console.log("| Task | Model | Baseline | +Skill | Delta |");
  console.log("|------|-------|----------|--------|-------|");

  for (const row of summaryRows) {
    const delta = row.delta >= 0 ? `+${row.delta.toFixed(2)}` : row.delta.toFixed(2);
    console.log(
      `| ${row.task} | ${row.model} | ${row.baseline.toFixed(2)} | ${row.withSkill.toFixed(2)} | ${delta} |`
    );
  }

  const avgDelta = summaryRows.reduce((sum, r) => sum + r.delta, 0) / summaryRows.length;
  console.log(`\nAverage delta: ${avgDelta >= 0 ? "+" : ""}${avgDelta.toFixed(2)}`);
}

main().catch((err) => {
  console.error("Run-all failed:", err);
  process.exit(1);
});
