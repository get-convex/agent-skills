import { scoreRun, JudgeModel } from "./framework/scorer.js";

const args = process.argv.slice(2);

function getArg(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`);
  return idx >= 0 ? args[idx + 1] : undefined;
}

const runId = getArg("run-id");
const judgesRaw = getArg("judges") ?? "opus";

if (!runId) {
  console.error("Usage: tsx score.ts --run-id <run-id> [--judges opus,codex]");
  process.exit(1);
}

const judges = judgesRaw.split(",") as JudgeModel[];

for (const j of judges) {
  if (!["opus", "codex"].includes(j)) {
    console.error(`Unknown judge: ${j}. Must be opus or codex.`);
    process.exit(1);
  }
}

console.log(`Scoring run: ${runId}, judges=${judges.join(",")}`);

scoreRun({ runId, judges }).catch((err) => {
  console.error("Scoring failed:", err);
  process.exit(1);
});
