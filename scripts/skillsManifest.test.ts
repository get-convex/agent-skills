import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  buildSkillsManifest,
  hashSkillDirectory,
  type WriteSkillFile,
} from "./skillsManifest.ts";

async function withTempDir(callback: (tempDir: string) => Promise<void>) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "skills-manifest-"));
  try {
    await callback(tempDir);
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

async function writeSkill({
  repoRoot,
  directoryName,
  skillName = directoryName,
  extraFiles = [],
}: {
  repoRoot: string;
  directoryName: string;
  skillName?: string;
  extraFiles?: WriteSkillFile[];
}) {
  const skillDir = path.join(repoRoot, "skills", directoryName);
  await fs.mkdir(skillDir, { recursive: true });
  await fs.writeFile(
    path.join(skillDir, "SKILL.md"),
    `---\nname: ${skillName}\ndescription: test\n---\n`,
    "utf8",
  );

  for (const [relativePath, content] of extraFiles) {
    const absolutePath = path.join(skillDir, relativePath);
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, content);
  }

  return skillDir;
}

test("hashSkillDirectory is stable across file creation order", async () => {
  await withTempDir(async (tempDir) => {
    const firstSkillDir = path.join(tempDir, "first-skill");
    const secondSkillDir = path.join(tempDir, "second-skill");

    await fs.mkdir(firstSkillDir, { recursive: true });
    await fs.mkdir(secondSkillDir, { recursive: true });

    await fs.writeFile(path.join(firstSkillDir, "b.txt"), "second", "utf8");
    await fs.mkdir(path.join(firstSkillDir, "nested"), { recursive: true });
    await fs.writeFile(
      path.join(firstSkillDir, "nested", "a.txt"),
      "first",
      "utf8",
    );

    await fs.mkdir(path.join(secondSkillDir, "nested"), { recursive: true });
    await fs.writeFile(
      path.join(secondSkillDir, "nested", "a.txt"),
      "first",
      "utf8",
    );
    await fs.writeFile(path.join(secondSkillDir, "b.txt"), "second", "utf8");

    const [firstHash, secondHash] = await Promise.all([
      hashSkillDirectory({ skillDir: firstSkillDir }),
      hashSkillDirectory({ skillDir: secondSkillDir }),
    ]);

    assert.equal(firstHash, secondHash);
  });
});

test("buildSkillsManifest sorts skills and includes the passed repo SHA", async () => {
  await withTempDir(async (repoRoot) => {
    await writeSkill({
      repoRoot,
      directoryName: "convex-zeta",
      extraFiles: [["references/example.md", "zeta"]],
    });
    await writeSkill({
      repoRoot,
      directoryName: "convex-alpha",
      extraFiles: [["references/example.md", "alpha"]],
    });

    const manifest = await buildSkillsManifest({
      repoRoot,
      repoSha: "repo-sha-123",
    });

    assert.equal(manifest.repoSha, "repo-sha-123");
    assert.deepEqual(
      manifest.skills.map((skill) => skill.skillName),
      ["convex-alpha", "convex-zeta"],
    );
    assert.equal(manifest.skills[0].directoryName, "convex-alpha");
    assert.match(manifest.skills[0].skillHash, /^[a-f0-9]{64}$/);
  });
});

test("buildSkillsManifest rejects directory and frontmatter name drift", async () => {
  await withTempDir(async (repoRoot) => {
    await writeSkill({
      repoRoot,
      directoryName: "convex-alpha",
      skillName: "convex-beta",
    });

    await assert.rejects(
      buildSkillsManifest({
        repoRoot,
        repoSha: "repo-sha-123",
      }),
      /does not match frontmatter name/,
    );
  });
});
