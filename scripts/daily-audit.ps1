#!/usr/bin/env pwsh
# scripts/daily-audit.ps1
#
# Run daily. Checks the last 24h of commits on dev for:
#   1. Multi-domain commits (same detection as pre-commit-check.ps1)
#   2. Changes to locked files without approval marker
#   3. Removed asset references (require(), ImageBackground, etc.)
#
# Usage:
#   pwsh scripts/daily-audit.ps1 [-Since "2 days ago"] [-Verbose]
#
# Output: one-page report to stdout.

param(
  [string]$Since = "24 hours ago",
  [switch]$VerboseReport
)

$ErrorActionPreference = "Stop"

$commits = git log --since="$Since" --format="%H %s" dev --

if (-not $commits) {
  Write-Host "No commits in the last $Since. Nothing to audit."
  exit 0
}

Write-Host "================================================="
Write-Host "  DAILY AUDIT - Commits since: $Since"
Write-Host "================================================="
Write-Host ""

$issues = @()

foreach ($line in $commits) {
  $hash = $line.Substring(0, 40)
  $msg = $line.Substring(41)

  $files = git diff-tree --no-commit-id --name-only -r $hash

  $hasDep    = $false
  $hasNative = $false
  $hasSource = $false

  foreach ($f in $files) {
    if ($f -match "(^|/)(package|package-lock)\.json$|\.npmrc$|eas\.json$") { $hasDep = $true }
    if ($f -match "(^|/)app\.json$|gradle\.properties$") { $hasNative = $true }
    if ($f -match "\.(ts|tsx|js|jsx)$" -and $f -notmatch "scripts/") { $hasSource = $true }
  }

  $shortHash = $hash.Substring(0, 7)

  # Multi-domain check
  if (($hasDep -and $hasSource) -or ($hasNative -and $hasSource)) {
    $issues += "[MULTI-DOMAIN] $shortHash $msg"
  }

  # Locked file check
  $lockedPatterns = @(
    "components/SplashOverlay\.tsx$",
    "app/\(auth\)/login\.tsx$"
  )
  foreach ($f in $files) {
    foreach ($pat in $lockedPatterns) {
      if ($f -match $pat -and $msg -notmatch "\[locked-edit-approved\]") {
        $issues += "[LOCKED-FILE] $shortHash modified $f without approval marker"
      }
    }
  }

  # Removed asset references
  $diff = git diff $hash~1 $hash -- "*.tsx" "*.ts" 2>$null
  if ($diff) {
    $removedAssets = $diff | Select-String "^-.*require\(.*(\.jpg|\.png|\.mp4)" | Measure-Object
    if ($removedAssets.Count -gt 0) {
      $issues += "[ASSET-REMOVED] $shortHash removed $($removedAssets.Count) asset reference(s)"
    }
  }

  if ($VerboseReport) {
    Write-Host "  $shortHash  $msg"
    Write-Host "    Files: $($files.Count)"
  }
}

Write-Host ""
Write-Host "Commits audited: $(($commits | Measure-Object).Count)"
Write-Host ""

if ($issues.Count -eq 0) {
  Write-Host "No issues found." -ForegroundColor Green
} else {
  Write-Host "$($issues.Count) issue(s) found:" -ForegroundColor Yellow
  Write-Host ""
  foreach ($i in $issues) {
    Write-Host "  $i" -ForegroundColor Red
  }
}

Write-Host ""
Write-Host "================================================="
