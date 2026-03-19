import { execFile } from "node:child_process";
import { AgentRunner, AgentRunOptions, collectFiles } from "./base.js";
import { AgentModel, AgentResult } from "../types.js";

export class CodexRunner implements AgentRunner {
  readonly name = "codex";

  supports(model: AgentModel): boolean {
    return model === "codex";
  }

  async run(options: AgentRunOptions): Promise<AgentResult> {
    const { model, condition, prompt, workDir, timeoutMs } = options;

    // codex CLI: run in quiet/non-interactive mode with full-auto approval
    const args = [
      "-q", prompt,
      "--approval-mode", "full-auto",
    ];

    const start = Date.now();

    const result = await new Promise<{ stdout: string; stderr: string; exitCode: number }>((resolve) => {
      execFile("codex", args, {
        cwd: workDir,
        timeout: timeoutMs,
        maxBuffer: 10 * 1024 * 1024,
        env: { ...process.env },
      }, (error, stdout, stderr) => {
        resolve({
          stdout: stdout ?? "",
          stderr: stderr ?? "",
          exitCode: error ? (error as any).code ?? 1 : 0,
        });
      });
    });

    const durationMs = Date.now() - start;
    const files = await collectFiles(workDir);

    return {
      model,
      condition,
      exitCode: result.exitCode,
      stdout: result.stdout,
      stderr: result.stderr,
      durationMs,
      files,
    };
  }
}
