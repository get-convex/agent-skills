import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const DEFAULT_PUBLISH_URL =
  "https://version.convex.dev/v1/agent_skills/publish";

type SkillManifestEntry = {
  skillName: string;
  directoryName: string;
  skillHash: string;
};

type SkillsManifest = {
  repoSha: string;
  skills: SkillManifestEntry[];
};

type WriteSkillFile = [relativePath: string, content: string];

export function extractSkillName({
  content,
  directoryName,
}: {
  content: string;
  directoryName: string;
}) {
  const match = content.match(/^---[\s\S]*?^name:\s*(.+?)\s*$/m);
  if (!match) {
    throw new Error(
      `Skill '${directoryName}' is missing a frontmatter name in SKILL.md`,
    );
  }
  return match[1].trim();
}

export async function listSkillDirectories({
  skillsRoot,
}: {
  skillsRoot: string;
}) {
  const dirents = await fs.readdir(skillsRoot, { withFileTypes: true });
  return dirents
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name)
    .sort((a, b) => a.localeCompare(b));
}

export async function listFilesRecursively({
  rootDir,
  currentDir = rootDir,
}: {
  rootDir: string;
  currentDir?: string;
}): Promise<string[]> {
  const dirents = await fs.readdir(currentDir, { withFileTypes: true });
  const files: string[] = [];

  for (const dirent of dirents.sort((a, b) => a.name.localeCompare(b.name))) {
    const absolutePath = path.join(currentDir, dirent.name);
    if (dirent.isDirectory()) {
      const nestedFiles = await listFilesRecursively({
        rootDir,
        currentDir: absolutePath,
      });
      files.push(...nestedFiles);
      continue;
    }

    if (dirent.isFile()) {
      files.push(path.relative(rootDir, absolutePath).replaceAll("\\", "/"));
    }
  }

  return files;
}

export async function hashSkillDirectory({ skillDir }: { skillDir: string }) {
  const files = await listFilesRecursively({ rootDir: skillDir });
  const hash = crypto.createHash("sha256");

  for (const relativePath of files) {
    hash.update(relativePath);
    hash.update("\0");
    hash.update(await fs.readFile(path.join(skillDir, relativePath)));
    hash.update("\0");
  }

  return hash.digest("hex");
}

export async function buildSkillsManifest({
  repoRoot,
  repoSha,
}: {
  repoRoot: string;
  repoSha: string;
}): Promise<SkillsManifest> {
  const skillsRoot = path.join(repoRoot, "skills");
  const directoryNames = await listSkillDirectories({ skillsRoot });
  const skills: SkillManifestEntry[] = [];

  for (const directoryName of directoryNames) {
    const skillDir = path.join(skillsRoot, directoryName);
    const content = await fs.readFile(path.join(skillDir, "SKILL.md"), "utf8");
    const skillName = extractSkillName({ content, directoryName });

    if (skillName !== directoryName) {
      throw new Error(
        `Skill directory '${directoryName}' does not match frontmatter name '${skillName}'`,
      );
    }

    skills.push({
      skillName,
      directoryName,
      skillHash: await hashSkillDirectory({ skillDir }),
    });
  }

  return { repoSha, skills };
}

export function readRepoSha({ repoRoot }: { repoRoot: string }) {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA;
  return execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: repoRoot,
    encoding: "utf8",
  }).trim();
}

export async function publishSkillsManifest({
  endpoint,
  token,
  manifest,
}: {
  endpoint: string;
  token: string;
  manifest: SkillsManifest;
}) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(manifest),
  });

  if (response.ok) return await response.json();

  const errorText = await response.text();
  throw new Error(
    `Failed to publish skills manifest: ${response.status} ${errorText}`,
  );
}

async function main() {
  const repoRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
  );
  const repoSha = readRepoSha({ repoRoot });
  const manifest = await buildSkillsManifest({ repoRoot, repoSha });
  const shouldPublish = process.argv.includes("--publish");

  if (!shouldPublish) {
    process.stdout.write(JSON.stringify(manifest, null, 2) + "\n");
    return;
  }

  const token = process.env.VERSION_CONVEX_DEV_AGENT_SKILLS_SYNC_TOKEN;
  if (!token) {
    throw new Error("Missing VERSION_CONVEX_DEV_AGENT_SKILLS_SYNC_TOKEN");
  }

  const endpoint = process.env.VERSION_CONVEX_DEV_URL ?? DEFAULT_PUBLISH_URL;
  const result = await publishSkillsManifest({
    endpoint,
    token,
    manifest,
  });
  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
}

const isMainModule =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}

export type { SkillManifestEntry, SkillsManifest, WriteSkillFile };
