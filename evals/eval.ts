import { runEval } from "./framework/runner.js";
import { scoreRun, JudgeModel } from "./framework/scorer.js";
import { generateReport } from "./framework/report.js";
import { AgentModel } from "./framework/types.js";

const args = process.argv.slice(2);

function getArg(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`);
  return idx >= 0 ? args[idx + 1] : undefined;
}

const taskName = getArg("task");
const modelsRaw = getArg("models") ?? "sonnet";
const runsRaw = getArg("runs") ?? "1";
const judgesRaw = getArg("judges") ?? "opus";

if (!taskName) {
  console.error("Usage: tsx eval.ts --task <task-name> [--models sonnet,opus,codex] [--runs N] [--judges opus,codex]");
  process.exit(1);
}

const models = modelsRaw.split(",") as AgentModel[];
const runs = parseInt(runsRaw, 10);
const judges = judgesRaw.split(",") as JudgeModel[];

async function main() {
  const evalRun = await runEval({ taskName: taskName!, models, runs });
  console.log("\n=== Scoring ===\n");
  await scoreRun({ runId: evalRun.id, judges });
  console.log("\n=== Report ===\n");
  const report = await generateReport(evalRun.id);
  console.log(report);
}

main().catch((err) => {
  console.error("Eval failed:", err);
  process.exit(1);
});
