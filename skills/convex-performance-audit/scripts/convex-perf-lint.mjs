#!/usr/bin/env node

// Convex Performance Linter -- schema and subscription pattern checks
//
// This catches patterns that the @convex-dev/eslint-plugin does NOT cover:
// schema-level issues, subscription invalidation patterns, and cross-function
// anti-patterns. For basic query/mutation lint rules (.collect, .filter),
// use the eslint plugin: https://docs.convex.dev/eslint
//
// Run: node convex-perf-lint.mjs [convex-dir]
// Default: scans ./convex/

import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative } from "node:path";

const convexDir = process.argv[2] || "./convex";

const findings = [];

function addFinding(file, line, severity, rule, message) {
  findings.push({ file, line, severity, rule, message });
}

const detectors = [
  {
    rule: "no-readby-array",
    severity: "error",
    description: "Per-user tracking arrays on shared documents cause O(users^2) invalidation",
    detect(lines, file) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.match(/\b(readBy|seenBy|likedBy|acknowledgedBy|viewedBy)\b.*v\.array/)) {
          addFinding(file, i + 1, "error", "no-readby-array",
            "Per-user tracking array on a shared document. Every update writes to the document, invalidating all subscriptions for other readers. Use a separate tracking table instead.");
        }
      }
    },
  },
  {
    rule: "no-date-now-in-query",
    severity: "error",
    description: "Date.now() in a query handler defeats Convex query caching",
    detect(lines, file) {
      let inQuery = false;
      let braceDepth = 0;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.match(/=\s*query\s*\(/)) {
          inQuery = true;
          braceDepth = 0;
        }
        if (inQuery) {
          braceDepth += (line.match(/{/g) || []).length;
          braceDepth -= (line.match(/}/g) || []).length;
          if (braceDepth <= 0 && i > 0) inQuery = false;
          if (line.includes("Date.now()")) {
            addFinding(file, i + 1, "error", "no-date-now-in-query",
              "Date.now() inside a query defeats Convex's deterministic query cache. Use a boolean flag updated by a cron, or pass a rounded timestamp from the client.");
          }
        }
      }
    },
  },
  {
    rule: "no-heartbeat-on-profile",
    severity: "warning",
    description: "Frequently-updated presence field on a widely-read user document",
    detect(lines, file) {
      if (!file.includes("schema")) return;
      let inUsersTable = false;
      let hasProfileFields = false;
      let hasPresenceField = false;
      let presenceLine = 0;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.match(/users\s*:\s*defineTable/) || line.match(/\busers\b.*defineTable/)) {
          inUsersTable = true;
          hasProfileFields = false;
          hasPresenceField = false;
        }
        if (inUsersTable) {
          if (line.match(/\b(name|email|avatarUrl|displayName)\b/)) hasProfileFields = true;
          if (line.match(/\b(lastSeen|lastHeartbeat|lastActive|isOnline)\b/)) {
            hasPresenceField = true;
            presenceLine = i + 1;
          }
          if (line.match(/^\)/) || (line.match(/defineTable/) && !line.match(/users/))) {
            if (hasProfileFields && hasPresenceField && presenceLine > 0) {
              addFinding(file, presenceLine, "warning", "no-heartbeat-on-profile",
                "Presence/heartbeat field on the users table. Frequent writes will invalidate every query that reads user profile data (name, email). Move to a separate presence table.");
            }
            inUsersTable = false;
          }
        }
      }
    },
  },
  {
    rule: "no-redundant-indexes",
    severity: "info",
    description: "Index that is a prefix of another index on the same table",
    detect(lines, file) {
      if (!file.includes("schema")) return;
      const tableIndexes = new Map();
      let currentTable = null;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const tableMatch = line.match(/(\w+)\s*:\s*defineTable/);
        if (tableMatch) currentTable = tableMatch[1];
        if (currentTable) {
          const indexMatch = line.match(/\.index\(\s*"(\w+)"\s*,\s*\[([^\]]+)\]/);
          if (indexMatch) {
            const indexName = indexMatch[1];
            const fields = indexMatch[2].replace(/"/g, "").split(",").map((f) => f.trim());
            if (!tableIndexes.has(currentTable)) tableIndexes.set(currentTable, []);
            tableIndexes.get(currentTable).push({ name: indexName, fields, line: i + 1 });
          }
        }
      }
      for (const [table, indexes] of tableIndexes) {
        for (const idx of indexes) {
          for (const other of indexes) {
            if (idx.name === other.name) continue;
            if (idx.fields.length < other.fields.length) {
              const isPrefix = idx.fields.every((f, j) => other.fields[j] === f);
              if (isPrefix) {
                addFinding(file, idx.line, "info", "no-redundant-indexes",
                  `Index "${idx.name}" [${idx.fields.join(", ")}] is a prefix of "${other.name}" [${other.fields.join(", ")}] on table "${table}". The compound index serves both query patterns.`);
              }
            }
          }
        }
      }
    },
  },
  {
    rule: "collect-then-count",
    severity: "error",
    description: "Collecting documents just to count them",
    detect(lines, file) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.match(/\.collect\(\)/)) {
          const nextFew = lines.slice(i, Math.min(i + 3, lines.length)).join(" ");
          if (nextFew.includes(".length")) {
            addFinding(file, i + 1, "error", "collect-then-count",
              "Collecting documents to count them. Use a maintained counter table or the @convex-dev/aggregate component instead of scanning.");
          }
        }
      }
    },
  },
  {
    rule: "no-runquery-in-mutation",
    severity: "warning",
    description: "ctx.runQuery inside a mutation has overhead vs a plain helper",
    detect(lines, file) {
      let inMutation = false;
      let braceDepth = 0;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.match(/=\s*(internal)?[Mm]utation\s*\(/)) {
          inMutation = true;
          braceDepth = 0;
        }
        if (inMutation) {
          braceDepth += (line.match(/{/g) || []).length;
          braceDepth -= (line.match(/}/g) || []).length;
          if (braceDepth <= 0 && i > 0) inMutation = false;
          if (line.includes("ctx.runQuery(")) {
            addFinding(file, i + 1, "warning", "no-runquery-in-mutation",
              "ctx.runQuery inside a mutation has per-call overhead. Use a plain helper function instead -- both run in the same transaction.");
          }
        }
      }
    },
  },
];

async function scanFile(filePath) {
  const content = await readFile(filePath, "utf-8");
  const lines = content.split("\n");
  const rel = relative(process.cwd(), filePath);
  for (const detector of detectors) {
    detector.detect(lines, rel);
  }
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.name === "node_modules" || entry.name === "_generated") continue;
    if (entry.isDirectory()) await walk(full);
    else if (entry.name.match(/\.(ts|tsx|js|mjs)$/)) await scanFile(full);
  }
}

async function main() {
  try { await stat(convexDir); } catch {
    console.error(`Directory not found: ${convexDir}`);
    process.exit(1);
  }
  await walk(convexDir);
  if (findings.length === 0) {
    console.log("No performance issues found.");
    process.exit(0);
  }
  const severityOrder = { error: 0, warning: 1, info: 2 };
  findings.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  const counts = { error: 0, warning: 0, info: 0 };
  for (const f of findings) {
    counts[f.severity]++;
    const icon = f.severity === "error" ? "ERROR" : f.severity === "warning" ? "WARN" : "INFO";
    console.log(`${icon}  ${f.file}:${f.line}  [${f.rule}]`);
    console.log(`      ${f.message}`);
    console.log();
  }
  console.log(`---`);
  console.log(`${findings.length} issues: ${counts.error} errors, ${counts.warning} warnings, ${counts.info} info`);
  process.exit(counts.error > 0 ? 1 : 0);
}

main().catch((err) => { console.error(err); process.exit(1); });
