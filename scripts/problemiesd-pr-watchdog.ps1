param(
  [string]$Repo = "visanchan/mochipos",
  [string]$Author = "Problemiesd",
  [string]$WorkDir = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,
  [string]$StateDir = (Join-Path (Resolve-Path (Join-Path $PSScriptRoot "..")).Path ".watchdog"),
  [int]$MaxFixAttemptsPerHead = 1
)

$ErrorActionPreference = "Stop"
Set-Location -LiteralPath $WorkDir

New-Item -ItemType Directory -Force -Path $StateDir | Out-Null
$LogPath = Join-Path $StateDir "problemiesd-pr-watchdog.log"
$StatePath = Join-Path $StateDir "problemiesd-pr-watchdog-state.json"
$LockPath = Join-Path $StateDir "problemiesd-pr-watchdog.lock"

function Write-Log {
  param([string]$Message)
  $stamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  Add-Content -Path $LogPath -Value "[$stamp] $Message"
}

function Load-State {
  if (!(Test-Path $StatePath)) {
    return @{ attempts = @{} }
  }
  try {
    $raw = Get-Content -Raw -Path $StatePath
    if ([string]::IsNullOrWhiteSpace($raw)) {
      return @{ attempts = @{} }
    }
    $state = $raw | ConvertFrom-Json -AsHashtable
    if (!$state.ContainsKey("attempts")) {
      $state.attempts = @{}
    }
    return $state
  } catch {
    Write-Log "State file unreadable; starting fresh. Error: $($_.Exception.Message)"
    return @{ attempts = @{} }
  }
}

function Save-State {
  param($State)
  $State | ConvertTo-Json -Depth 8 | Set-Content -Path $StatePath
}

function Invoke-GhJson {
  param([string[]]$GhArgs)
  $output = & gh @GhArgs 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "gh $($GhArgs -join ' ') failed: $output"
  }
  $text = ($output | Out-String).Trim()
  if ([string]::IsNullOrWhiteSpace($text)) {
    return $null
  }
  $jsonStartCandidates = @(
    $text.IndexOf("["),
    $text.IndexOf("{")
  ) | Where-Object { $_ -ge 0 } | Sort-Object
  if ($jsonStartCandidates.Count -eq 0) {
    throw "gh $($GhArgs -join ' ') did not return JSON: $text"
  }
  $json = $text.Substring($jsonStartCandidates[0])
  return $json | ConvertFrom-Json
}

function Test-GhReady {
  $output = & gh auth status 2>&1
  if ($LASTEXITCODE -ne 0) {
    Write-Log "GitHub CLI is not authenticated. Run: gh auth login -h github.com"
    Write-Log ($output -join "`n")
    return $false
  }
  return $true
}

function Get-CheckSummary {
  param([int]$Number)

  $checksOutput = & gh pr checks $Number --repo $Repo --json name,state,conclusion 2>&1
  if ($LASTEXITCODE -ne 0) {
    return @{
      ok = $false
      pending = $false
      failed = $true
      message = "Could not read checks: $checksOutput"
    }
  }

  $checks = @()
  if (![string]::IsNullOrWhiteSpace($checksOutput)) {
    $checks = @($checksOutput | ConvertFrom-Json)
  }

  if ($checks.Count -eq 0) {
    return @{ ok = $true; pending = $false; failed = $false; message = "No checks" }
  }

  $pending = @($checks | Where-Object {
    $_.state -in @("PENDING", "QUEUED", "IN_PROGRESS", "WAITING", "REQUESTED")
  })
  $failed = @($checks | Where-Object {
    $_.conclusion -in @("FAILURE", "TIMED_OUT", "CANCELLED", "ACTION_REQUIRED")
  })

  return @{
    ok = ($pending.Count -eq 0 -and $failed.Count -eq 0)
    pending = ($pending.Count -gt 0)
    failed = ($failed.Count -gt 0)
    message = "checks=$($checks.Count) pending=$($pending.Count) failed=$($failed.Count)"
  }
}

function Try-MergePr {
  param($Pr)

  $number = [int]$Pr.number
  if ($Pr.isDraft) {
    Write-Log "PR #$number skipped: draft."
    return $false
  }

  $checks = Get-CheckSummary -Number $number
  if (-not $checks.ok) {
    Write-Log "PR #$number not merge-ready: $($checks.message)"
    return $false
  }

  $headSha = [string]$Pr.headRefOid
  $mergeOutput = & gh pr merge $number --repo $Repo --merge --delete-branch --match-head-commit $headSha 2>&1
  if ($LASTEXITCODE -eq 0) {
    Write-Log "PR #$number merged. $mergeOutput"
    return $true
  }

  Write-Log "PR #$number merge failed: $mergeOutput"
  return $false
}

function Invoke-CodexFixer {
  param($Pr, $State)

  $number = [int]$Pr.number
  $headSha = [string]$Pr.headRefOid
  $attemptKey = "$number/$headSha"
  $existingAttempts = 0
  if ($State.attempts.ContainsKey($attemptKey)) {
    $existingAttempts = [int]$State.attempts[$attemptKey]
  }
  if ($existingAttempts -ge $MaxFixAttemptsPerHead) {
    Write-Log "PR #$number skipped fixer: already attempted $existingAttempts time(s) for head $headSha."
    return
  }

  $State.attempts[$attemptKey] = $existingAttempts + 1
  Save-State -State $State

  $prompt = @"
You are a Codex watchdog worker for repository $Repo.

Task:
1. Inspect PR #$number by $Author.
2. If the PR is merge-ready, merge it.
3. If it is not mergeable because of failing checks, review the failing checks, make the smallest safe fix, run the relevant tests, commit, push to the PR branch, then merge when GitHub allows it.
4. If the PR has conflicts, unsafe changes, ambiguous product decisions, missing secrets, or failures you cannot confidently fix, stop and leave a clear final summary. Do not guess.

Rules:
- Work in a separate git worktree under .watchdog/worktrees/pr-$number when editing.
- Do not revert unrelated user changes.
- Do not modify unrelated files.
- Do not use destructive git commands such as reset --hard.
- Only merge PRs authored by $Author in $Repo.
- Use professional concise commit messages.
"@

  $outPath = Join-Path $StateDir "codex-pr-$number-last-message.txt"
  Write-Log "Launching Codex fixer for PR #$number attempt $($existingAttempts + 1)."
  & codex exec --ask-for-approval never --sandbox workspace-write -C $WorkDir -o $outPath $prompt 2>&1 |
    ForEach-Object { Write-Log "[codex #$number] $_" }
  Write-Log "Codex fixer finished for PR #$number with exit code $LASTEXITCODE."
}

if (Test-Path $LockPath) {
  $ageMinutes = ((Get-Date) - (Get-Item $LockPath).LastWriteTime).TotalMinutes
  if ($ageMinutes -lt 30) {
    Write-Log "Another watchdog run is active; exiting."
    exit 0
  }
  Write-Log "Stale lock found; replacing."
}

Set-Content -Path $LockPath -Value ([System.Diagnostics.Process]::GetCurrentProcess().Id)

try {
  Write-Log "Watchdog run started for repo=$Repo author=$Author."
  if (!(Test-GhReady)) {
    exit 0
  }

  $state = Load-State
  $prs = Invoke-GhJson -GhArgs @(
    "pr", "list",
    "--repo", $Repo,
    "--author", $Author,
    "--state", "open",
    "--json", "number,title,url,isDraft,headRefName,headRefOid,mergeStateStatus,author"
  )

  if (!$prs -or $prs.Count -eq 0) {
    Write-Log "No open PRs found for $Author."
    exit 0
  }

  foreach ($pr in @($prs)) {
    $number = [int]$pr.number
    Write-Log "Inspecting PR #${number}: $($pr.title)"
    $merged = Try-MergePr -Pr $pr
    if ($merged) {
      continue
    }

    $checks = Get-CheckSummary -Number $number
    if ($checks.failed) {
      Invoke-CodexFixer -Pr $pr -State $state
      $fresh = Invoke-GhJson -GhArgs @(
        "pr", "view", "$number",
        "--repo", $Repo,
        "--json", "number,title,url,isDraft,headRefName,headRefOid,mergeStateStatus,author"
      )
      [void](Try-MergePr -Pr $fresh)
    } elseif ($checks.pending) {
      Write-Log "PR #$number checks still pending; will revisit next run."
    } else {
      Write-Log "PR #$number not fixed automatically; merge status may be blocked by reviews/conflicts/settings."
    }
  }
} catch {
  Write-Log "Watchdog error: $($_.Exception.Message)"
} finally {
  Remove-Item -Path $LockPath -ErrorAction SilentlyContinue
  Write-Log "Watchdog run finished."
}
