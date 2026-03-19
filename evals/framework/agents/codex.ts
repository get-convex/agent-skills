import { spawn } from "node:child_process";
import { AgentRunner, AgentRunOptions, collectFiles } from "./base.js";
import { AgentModel, AgentResult } from "../types.js";

export class CodexRunner implements AgentRunner {
  readonly name = "codex";

  supports(model: AgentModel): boolean {
    return model === "codex";
  }

  async run(options: AgentRunOptions): Promise<AgentResult> {
    const { model, condition, prompt, workDir, timeoutMs } = options;

    const args = [
      "exec",
      "--sandbox", "workspace-write",
      "-C", workDir,
      prompt,
    ];

    const start = Date.now();

    const result = await new Promise<{ stdout: string; stderr: string; exitCode: number }>((resolve) => {
      const proc = spawn("codex", args, {
        cwd: workDir,
        timeout: timeoutMs,
        env: { ...process.env },
        stdio: ["pipe", "pipe", "pipe"],
      });

      proc.stdin.end();

      let stdout = "";
      let stderr = "";
      proc.stdout.on("data", (chunk: Buffer) => { stdout += chunk.toString(); });
      proc.stderr.on("data", (chunk: Buffer) => { stderr += chunk.toString(); });

      proc.on("close", (code) => {
        resolve({ stdout, stderr, exitCode: code ?? 1 });
      });
      proc.on("error", (err) => {
        resolve({ stdout, stderr: stderr + String(err), exitCode: 1 });
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
