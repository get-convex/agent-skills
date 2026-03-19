import { execFile, spawn } from "node:child_process";
import { createReadStream } from "node:fs";
import { AgentRunner, AgentRunOptions, collectFiles } from "./base.js";
import { AgentModel, AgentResult } from "../types.js";

const MODEL_MAP: Record<string, string> = {
  sonnet: "sonnet",
  opus: "opus",
};

export class ClaudeCodeRunner implements AgentRunner {
  readonly name = "claude-code";

  supports(model: AgentModel): boolean {
    return model === "sonnet" || model === "opus";
  }

  async run(options: AgentRunOptions): Promise<AgentResult> {
    const { model, condition, prompt, workDir, timeoutMs, maxTurns } = options;

    const args = [
      "-p", prompt,
      "--model", MODEL_MAP[model],
      "--max-turns", String(maxTurns),
      "--output-format", "text",
      "--permission-mode", "bypassPermissions",
    ];

    const start = Date.now();

    const result = await new Promise<{ stdout: string; stderr: string; exitCode: number }>((resolve) => {
      const proc = spawn("claude", args, {
        cwd: workDir,
        timeout: timeoutMs,
        env: { ...process.env },
        stdio: ["pipe", "pipe", "pipe"],
      });

      // Close stdin immediately to avoid "no stdin data" warning
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
