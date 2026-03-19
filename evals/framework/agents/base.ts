import { AgentModel, AgentResult, Condition } from "../types.js";

export interface AgentRunOptions {
  model: AgentModel;
  condition: Condition;
  prompt: string;
  workDir: string;
  timeoutMs: number;
  maxTurns: number;
}

export interface AgentRunner {
  readonly name: string;
  supports(model: AgentModel): boolean;
  run(options: AgentRunOptions): Promise<AgentResult>;
}

export async function collectFiles(dir: string): Promise<Record<string, string>> {
  const { readdir, readFile, stat } = await import("node:fs/promises");
  const { join, relative } = await import("node:path");

  const files: Record<string, string> = {};

  async function walk(current: string) {
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(current, entry.name);
      if (entry.name === "node_modules" || entry.name === ".git" || entry.name === ".claude") continue;

      if (entry.isDirectory()) {
        await walk(fullPath);
      } else {
        try {
          const info = await stat(fullPath);
          // skip files over 100KB
          if (info.size > 100_000) continue;
          const content = await readFile(fullPath, "utf-8");
          files[relative(dir, fullPath)] = content;
        } catch {
          // skip unreadable files
        }
      }
    }
  }

  await walk(dir);
  return files;
}
