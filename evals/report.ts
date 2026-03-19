import { generateReport } from "./framework/report.js";

const args = process.argv.slice(2);

function getArg(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`);
  return idx >= 0 ? args[idx + 1] : undefined;
}

const runId = getArg("run-id");

if (!runId) {
  console.error("Usage: tsx report.ts --run-id <run-id>");
  process.exit(1);
}

generateReport(runId)
  .then((report) => console.log(report))
  .catch((err) => {
    console.error("Report generation failed:", err);
    process.exit(1);
  });
