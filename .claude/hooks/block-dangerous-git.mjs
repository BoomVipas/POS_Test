#!/usr/bin/env node
// Git guardrail — Claude Code PreToolUse(Bash) hook.
//
// Blocks DESTRUCTIVE git shapes from Claude's Bash tool; routine work
// (commits, `git push -u origin <feature>`, branch cleanup) passes through.
// Scope: Claude sessions in this repo only — it does NOT touch a human's
// manual git in their own terminal. Opt out locally via .claude/settings.local.json.
//
// No external deps (no jq) so it runs anywhere Node does, including Windows.
// Reads the tool call as JSON on stdin; exit 2 = block, exit 0 = allow.

let raw = "";
process.stdin.on("data", (c) => (raw += c));
process.stdin.on("end", () => {
  let cmd = "";
  try {
    cmd = JSON.parse(raw)?.tool_input?.command ?? "";
  } catch {
    process.exit(0); // unparseable input → fail open (never break normal calls)
  }

  // [regex, human reason]. Tuned so normal feature-branch pushes/commits pass.
  const RULES = [
    [/\bgit\s+push\b[^\n]*--force/, "force-push (--force / --force-with-lease)"],
    [/\bgit\s+push\b[^\n]*\s-f(\s|$)/, "force-push (-f)"],
    [/\bgit\s+push\b[^\n]*(\s|:)main(\s|$)/, "push to the protected branch 'main'"],
    [/\bgit\s+reset\s+--hard/, "reset --hard (discards commits / working changes)"],
    [/\bgit\s+clean\s+-[A-Za-z]*f/, "clean -f (deletes untracked files irreversibly)"],
    [/\bgit\s+checkout\s+\.(\s|$)/, "checkout . (discards all working changes)"],
    [/\bgit\s+restore\s+\.(\s|$)/, "restore . (discards all working changes)"],
  ];

  for (const [re, why] of RULES) {
    if (re.test(cmd)) {
      console.error(
        `BLOCKED: ${cmd}\n` +
          `Reason: ${why}.\n` +
          `This repo's guardrail prevents Claude from running it. If it's truly ` +
          `needed, ask the user to run it manually, or bypass via .claude/settings.local.json.`
      );
      process.exit(2); // 2 = block the tool call and tell Claude why
    }
  }
  process.exit(0);
});
