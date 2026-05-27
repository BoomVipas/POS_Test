# Problemiesd PR Watchdog

This repo includes a local Windows watchdog script:

```powershell
.\scripts\problemiesd-pr-watchdog.ps1
```

What it does:

- Every run lists open PRs in `visanchan/mochipos` authored by `Problemiesd`.
- If checks are green and GitHub allows the merge, it merges the PR with `gh pr merge`.
- If checks failed, it launches `codex exec` once per PR head SHA to attempt a small fix, push it, and merge.
- If checks are pending, the PR is left for the next scheduled run.
- Logs and attempt state are written under `.watchdog/`.

Required local setup:

```powershell
gh auth login -h github.com
```

The GitHub account used by `gh` must have permission to read, push to, and merge PRs in the repository.

Safety limits:

- Draft PRs are skipped.
- Only PRs authored by `Problemiesd` are considered.
- The fixer gets only one automatic attempt per PR head SHA by default.
- The fixer is instructed to use `.watchdog/worktrees/pr-<number>` and avoid unrelated changes.
- The script does not store GitHub credentials; it uses the existing GitHub CLI login.
