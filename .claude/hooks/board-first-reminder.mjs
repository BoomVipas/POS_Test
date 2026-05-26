#!/usr/bin/env node
// Board-first reminder (PreToolUse, non-blocking).
//
// The GitHub Project board (projects/1) is the team's deconfliction surface:
// a card must exist BEFORE implementation so nobody double-picks work. This hook
// warns — at most once per git branch — that implementation is happening, so a
// card should exist. It NEVER blocks (exit 0 always; emergency/quick fixes are
// unaffected) and skips the default branch. Wired for Edit|Write|MultiEdit and
// for `gh pr create` (see .claude/settings.json).
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

function git(args) {
  return execSync(`git ${args}`, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
}

try {
  const branch = git("rev-parse --abbrev-ref HEAD");
  // Detached HEAD or the default branch → nothing to remind about.
  if (!branch || branch === "HEAD" || branch === "main" || branch === "master") {
    process.exit(0);
  }

  const root = git("rev-parse --show-toplevel");
  const dir = path.join(root, ".claude", ".board-first");
  const marker = path.join(dir, branch.replace(/[^a-zA-Z0-9._-]/g, "_"));
  if (existsSync(marker)) process.exit(0); // already reminded on this branch

  mkdirSync(dir, { recursive: true });
  writeFileSync(marker, new Date().toISOString() + "\n");

  const msg =
    `Board-first reminder: you're implementing on branch "${branch}". ` +
    `Make sure projects/1 has a card for this work (Status: In Progress) so the ` +
    `team can deconflict before you continue. Fires once per branch; not a block.`;
  process.stdout.write(
    JSON.stringify({
      systemMessage: msg,
      hookSpecificOutput: { hookEventName: "PreToolUse", additionalContext: msg },
    }),
  );
} catch {
  // Fail open — the reminder must never interfere with real work.
}
process.exit(0);
