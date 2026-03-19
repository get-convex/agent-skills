import { runEval } from "./framework/runner.js";
import { AgentModel } from "./framework/types.js";

const args = process.argv.slice(2);

function getArg(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`);
  return idx >= 0 ? args[idx + 1] : undefined;
}

const taskName = getArg("task");
const modelsRaw = getArg("models") ?? "sonnet";
const runsRaw = getArg("runs") ?? "1";

if (!taskName) {
  console.error("Usage: tsx run.ts --task <task-name> [--models sonnet,opus,codex] [--runs N]");
  console.error("\nAvailable tasks can be found in evals/tasks/*/");
  process.exit(1);
}

const models = modelsRaw.split(",") as AgentModel[];
const runs = parseInt(runsRaw, 10);

for (const m of models) {
  if (!["sonnet", "opus", "codex"].includes(m)) {
    console.error(`Unknown model: ${m}. Must be sonnet, opus, or codex.`);
    process.exit(1);
  }
}

console.log(`Running eval: task=${taskName}, models=${models.join(",")}, runs=${runs}`);

runEval({ taskName, models, runs }).catch((err) => {
  console.error("Eval failed:", err);
  process.exit(1);
});
