const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const DEFAULT_PUBLISH_URL =
  "https://version.convex.dev/v1/agent_skills/publish";

function extractSkillName({ content, directoryName }) {
  const match = content.match(/^---[\s\S]*?^name:\s*(.+?)\s*$/m);
  if (!match) {
    throw new Error(
      `Skill '${directoryName}' is missing a frontmatter name in SKILL.md`,
    );
  }
  return match[1].trim();
}

async function listSkillDirectories({ skillsRoot }) {
  const dirents = await fs.readdir(skillsRoot, { withFileTypes: true });
  return dirents
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name)
    .sort((a, b) => a.localeCompare(b));
}

async function listFilesRecursively({ rootDir, currentDir = rootDir }) {
  const dirents = await fs.readdir(currentDir, { withFileTypes: true });
  const files = [];

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

async function hashSkillDirectory({ skillDir }) {
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

async function buildSkillsManifest({ repoRoot, repoSha }) {
  const skillsRoot = path.join(repoRoot, "skills");
  const directoryNames = await listSkillDirectories({ skillsRoot });
  const skills = [];

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

function readRepoSha({ repoRoot }) {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA;
  return execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: repoRoot,
    encoding: "utf8",
  }).trim();
}

async function publishSkillsManifest({ endpoint, token, manifest }) {
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
  const repoRoot = path.resolve(__dirname, "..");
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

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = {
  buildSkillsManifest,
  extractSkillName,
  hashSkillDirectory,
  listFilesRecursively,
  listSkillDirectories,
  publishSkillsManifest,
  readRepoSha,
};
