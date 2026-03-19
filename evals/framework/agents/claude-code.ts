import { execFile } from "node:child_process";
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
    ];

    const start = Date.now();

    const result = await new Promise<{ stdout: string; stderr: string; exitCode: number }>((resolve) => {
      const proc = execFile("claude", args, {
        cwd: workDir,
        timeout: timeoutMs,
        maxBuffer: 10 * 1024 * 1024, // 10MB
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
