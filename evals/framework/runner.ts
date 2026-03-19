import { mkdir, cp, readFile, writeFile, rm } from "node:fs/promises";
import { join, resolve, dirname } from "node:path";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { parse as parseYaml } from "yaml";
import { EvalTask, EvalRun, AgentModel, AgentResult, Condition } from "./types.js";
import { ClaudeCodeRunner } from "./agents/claude-code.js";
import { CodexRunner } from "./agents/codex.js";
import { AgentRunner } from "./agents/base.js";

const REPO_ROOT = resolve(dirname(new URL(import.meta.url).pathname), "../..");
const EVALS_ROOT = resolve(dirname(new URL(import.meta.url).pathname), "..");
const RESULTS_DIR = join(EVALS_ROOT, "results");

const runners: AgentRunner[] = [new ClaudeCodeRunner(), new CodexRunner()];

function getRunner(model: AgentModel): AgentRunner {
  const runner = runners.find((r) => r.supports(model));
  if (!runner) throw new Error(`No runner for model: ${model}`);
  return runner;
}

export async function loadTask(taskPath: string): Promise<EvalTask> {
  const raw = await readFile(taskPath, "utf-8");
  return parseYaml(raw) as EvalTask;
}

export async function findTaskFile(taskName: string): Promise<string> {
  const { readdir } = await import("node:fs/promises");
  const tasksDir = join(EVALS_ROOT, "tasks");
  const skillDirs = await readdir(tasksDir, { withFileTypes: true });

  for (const skillDir of skillDirs) {
    if (!skillDir.isDirectory()) continue;
    const skillPath = join(tasksDir, skillDir.name);
    const files = await readdir(skillPath);
    for (const file of files) {
      if (!file.endsWith(".yaml")) continue;
      const taskPath = join(skillPath, file);
      const task = await loadTask(taskPath);
      if (task.name === taskName) return taskPath;
    }
  }
  throw new Error(`Task not found: ${taskName}. Check evals/tasks/ directory.`);
}

async function setupWorkDir(taskPath: string, condition: Condition, skillName: string, fixtureDirName?: string): Promise<string> {
  const workDir = join(tmpdir(), `eval-${randomUUID()}`);
  await mkdir(workDir, { recursive: true });

  // Copy fixture files if they exist
  const fixtureDir = join(dirname(taskPath), fixtureDirName ?? "fixture");
  try {
    await cp(fixtureDir, workDir, { recursive: true });
  } catch {
    // No fixture, start with empty dir
  }

  // Inject skill if this is a "with-skill" run
  if (condition === "with-skill") {
    const skillDir = join(REPO_ROOT, "skills", skillName);
    const targetSkillDir = join(workDir, ".skills", skillName);
    await mkdir(targetSkillDir, { recursive: true });
    await cp(skillDir, targetSkillDir, { recursive: true });

    // Also create a CLAUDE.md that points to the skill so claude code discovers it
    const claudeMd = `Read and follow the skill guide at .skills/${skillName}/SKILL.md before starting work.\n`;
    await writeFile(join(workDir, "CLAUDE.md"), claudeMd);
  }

  return workDir;
}

export interface RunOptions {
  taskName: string;
  models: AgentModel[];
  runs: number;
  conditions?: Condition[];
}

export async function runEval(options: RunOptions): Promise<EvalRun> {
  const { taskName, models, runs, conditions = ["baseline", "with-skill"] } = options;

  const taskPath = await findTaskFile(taskName);
  const task = await loadTask(taskPath);

  const runId = `${taskName}-${Date.now()}`;
  const allResults: AgentResult[] = [];

  for (let i = 0; i < runs; i++) {
    console.log(`\n--- Run ${i + 1}/${runs} ---`);

    for (const model of models) {
      for (const condition of conditions) {
        console.log(`  ${model} / ${condition}...`);

        const workDir = await setupWorkDir(taskPath, condition, task.skill, task.fixture_dir);
        const runner = getRunner(model);

        try {
          const result = await runner.run({
            model,
            condition,
            prompt: task.prompt,
            workDir,
            timeoutMs: task.timeout_seconds * 1000,
            maxTurns: task.max_turns,
          });
          allResults.push(result);
          console.log(`    done (${(result.durationMs / 1000).toFixed(1)}s, exit=${result.exitCode}, ${Object.keys(result.files).length} files)`);
        } catch (err) {
          console.error(`    FAILED: ${err}`);
          allResults.push({
            model,
            condition,
            exitCode: 1,
            stdout: "",
            stderr: String(err),
            durationMs: 0,
            files: {},
          });
        }

        // Clean up work dir
        await rm(workDir, { recursive: true, force: true });
      }
    }
  }

  const evalRun: EvalRun = {
    id: runId,
    taskName,
    timestamp: new Date().toISOString(),
    results: allResults,
  };

  // Save results
  await mkdir(RESULTS_DIR, { recursive: true });
  const outPath = join(RESULTS_DIR, `${runId}.json`);
  await writeFile(outPath, JSON.stringify(evalRun, null, 2));
  console.log(`\nResults saved to ${outPath}`);

  return evalRun;
}
