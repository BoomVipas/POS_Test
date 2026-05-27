param(
  [string]$Repo = "visanchan/mochipos",
  [string]$WorkDir = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,
  [string]$StateDir = (Join-Path (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path "mochipos-loop-agent"),
  [int]$MaxRunMinutes = 55
)

$ErrorActionPreference = "Stop"
Set-Location -LiteralPath $WorkDir

New-Item -ItemType Directory -Force -Path $StateDir | Out-Null
$LogPath = Join-Path $StateDir "batch-loop-agent.log"
$LockPath = Join-Path $StateDir "batch-loop-agent.lock"
$OutPath = Join-Path $StateDir "batch-loop-agent-last-message.txt"

function Write-Log {
  param([string]$Message)
  $stamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  Add-Content -Path $LogPath -Value "[$stamp] $Message"
}

function Test-CommandReady {
  param([string]$Name)
  if (!(Get-Command $Name -ErrorAction SilentlyContinue)) {
    Write-Log "$Name is not available on PATH."
    return $false
  }
  return $true
}

function Resolve-ToolPath {
  param(
    [string]$Name,
    [string[]]$FallbackPaths
  )

  $cmd = Get-Command $Name -ErrorAction SilentlyContinue
  if ($cmd) {
    return $cmd.Source
  }

  foreach ($path in $FallbackPaths) {
    if (Test-Path -LiteralPath $path) {
      return $path
    }
  }

  Write-Log "$Name is not available on PATH or known fallback paths."
  return $null
}

if (Test-Path $LockPath) {
  $ageMinutes = ((Get-Date) - (Get-Item $LockPath).LastWriteTime).TotalMinutes
  if ($ageMinutes -lt $MaxRunMinutes) {
    Write-Log "Another batch-loop run is active; exiting."
    exit 0
  }
  Write-Log "Stale lock found; replacing."
}

Set-Content -Path $LockPath -Value ([System.Diagnostics.Process]::GetCurrentProcess().Id)

try {
  Write-Log "Batch-loop run started for repo=$Repo."

  $codexExe = Resolve-ToolPath "codex" @(
    (Join-Path $env:USERPROFILE ".vscode\extensions\openai.chatgpt-26.519.32039-win32-x64\bin\windows-x86_64\codex.exe"),
    (Join-Path $env:USERPROFILE ".codex\.sandbox-bin\codex.exe")
  )
  $ghExe = Resolve-ToolPath "gh" @("C:\Program Files\GitHub CLI\gh.exe")
  $gitExe = Resolve-ToolPath "git" @("C:\Program Files\Git\cmd\git.exe")

  if (!$codexExe -or !$ghExe -or !$gitExe) {
    exit 0
  }

  $ghStatus = & $ghExe auth status 2>&1
  if ($LASTEXITCODE -ne 0) {
    Write-Log "GitHub CLI is not authenticated. Run: gh auth login -h github.com"
    Write-Log ($ghStatus -join "`n")
    exit 0
  }

  $controllerDir = Join-Path $StateDir "controller"
  if (!(Test-Path -LiteralPath $controllerDir)) {
    Write-Log "Creating controller worktree at $controllerDir."
    $previousErrorActionPreference = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    & $gitExe worktree add --detach $controllerDir origin/main 2>&1 |
      ForEach-Object { Write-Log "[git controller] $_" }
    $gitExitCode = $LASTEXITCODE
    $ErrorActionPreference = $previousErrorActionPreference
    if ($gitExitCode -ne 0) {
      Write-Log "Could not create controller worktree."
      exit 0
    }
  } else {
    $controllerStatus = & $gitExe -C $controllerDir status --porcelain 2>&1
    if ($LASTEXITCODE -ne 0) {
      Write-Log "Controller worktree is unreadable: $controllerStatus"
      exit 0
    }
    if (![string]::IsNullOrWhiteSpace(($controllerStatus | Out-String))) {
      Write-Log "Controller worktree has local changes; leaving it for inspection."
      exit 0
    }
    $previousErrorActionPreference = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    & $gitExe -C $controllerDir fetch origin main --prune 2>&1 |
      ForEach-Object { Write-Log "[git controller] $_" }
    & $gitExe -C $controllerDir checkout --detach origin/main 2>&1 |
      ForEach-Object { Write-Log "[git controller] $_" }
    $ErrorActionPreference = $previousErrorActionPreference
  }

  $prompt = @"
You are the MochiPOS loop task agent for $Repo.

Goal:
- Advance the batch-work pipeline by one small, safe, independently reviewable unit.
- Prefer the next unblocked GitHub issue, BOARD.md item, or documented batch that is ready for implementation.
- Work as if this loop runs every 10 minutes, so keep each run narrow.

Required workflow:
1. Inspect the current repo status, GitHub issues/PRs, BOARD.md, docs/TEAM_WORKFLOW.md, docs/STATUS.md, TASKS.md, and the latest main branch as needed.
2. If there is already an open PR from this loop or another active in-progress item that should finish first, help that PR/check instead of starting a conflicting branch.
3. You are running in a dedicated controller worktree. Do all implementation edits in a separate git worktree under $StateDir\worktrees\<short-task-slug>, branched from latest origin/main.
4. Never edit the user's visible checkout at $WorkDir. The only allowed direct writes outside your implementation worktree are loop logs/state under $StateDir.
5. Do not revert unrelated changes. Assume other agents and humans may be active.
6. Do not touch real pilot data, do not run Supabase DDL, and do not apply migrations to production. If SQL/schema work is needed, prepare repo files and leave exact human apply steps.
7. Keep money in satang, keep every Supabase query/write workspace-scoped, and flag risky auth/RLS/money/inventory/refund/migration changes in the PR.
8. Run the relevant verification. For normal app work prefer npm run typecheck, npm run lint, npm test, and npm run build when reasonable.
9. Commit with a clear message, push the branch, and open a PR. Do not merge PRs.
10. If no safe unblocked batch exists, write a concise final summary explaining what is blocked and stop.

Output:
- Final answer must list the task chosen, branch, PR URL if opened, verification run, and any human follow-up needed.
"@

  Write-Log "Launching Codex batch-loop worker."
  $previousErrorActionPreference = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  & $codexExe -a never exec --sandbox danger-full-access -C $controllerDir -o $OutPath $prompt 2>&1 |
    ForEach-Object { Write-Log "[codex] $_" }
  $codexExitCode = $LASTEXITCODE
  $ErrorActionPreference = $previousErrorActionPreference
  Write-Log "Codex batch-loop worker finished with exit code $codexExitCode."
} catch {
  Write-Log "Batch-loop error: $($_.Exception.Message)"
} finally {
  Remove-Item -Path $LockPath -ErrorAction SilentlyContinue
  Write-Log "Batch-loop run finished."
}
