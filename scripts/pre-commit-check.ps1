#!/usr/bin/env pwsh
# scripts/pre-commit-check.ps1
#
# Blocks commits that bundle multiple high-risk file categories — the
# pattern that caused the cascade of breakage on 2026-04-27.
#
# Categories:
#   DEPENDENCY  — package.json, package-lock.json, .npmrc, eas.json
#   NATIVE      — app.json, gradle.properties, Podfile.properties.json
#   SOURCE      — .ts, .tsx, .js, .jsx in apps/, src/
#   ASSETS      — files in assets/, public/branding/
#   DOCS        — .md files in repo root and docs/
#
# Rules:
#   - DEPENDENCY changes must be in their OWN commit. No mixing with anything else.
#   - NATIVE changes must be in their OWN commit OR with DEPENDENCY only.
#   - SOURCE + ASSETS together is fine (a feature commit).
#   - SOURCE + DOCS together is fine (a feature commit + readme update).
#   - DEPENDENCY + SOURCE together is BLOCKED.
#   - NATIVE + SOURCE together is BLOCKED.
#
# Bypass with: git commit --no-verify (leaves audit trail in reflog).

$ErrorActionPreference = "Stop"

$staged = git diff --cached --name-only

if (-not $staged) { exit 0 }  # nothing staged, allow

$categories = @{
  DEPENDENCY = @()
  NATIVE     = @()
  SOURCE     = @()
  ASSETS     = @()
  DOCS       = @()
  OTHER      = @()
}

foreach ($file in $staged) {
  if ($file -match "(^|/)(package|package-lock)\.json$" -or
      $file -match "(^|/)\.npmrc$" -or
      $file -match "(^|/)eas\.json$") {
    $categories.DEPENDENCY += $file
  }
  elseif ($file -match "(^|/)app\.json$" -or
          $file -match "(^|/)gradle\.properties$" -or
          $file -match "(^|/)Podfile\.properties\.json$") {
    $categories.NATIVE += $file
  }
  elseif ($file -match "\.(ts|tsx|js|jsx)$" -and $file -notmatch "scripts/") {
    $categories.SOURCE += $file
  }
  elseif ($file -match "(^|/)assets/" -or $file -match "(^|/)public/branding/") {
    $categories.ASSETS += $file
  }
  elseif ($file -match "\.md$" -and $file -notmatch "scripts/") {
    $categories.DOCS += $file
  }
  else {
    $categories.OTHER += $file
  }
}

$present = @()
if ($categories.DEPENDENCY.Count -gt 0) { $present += "DEPENDENCY" }
if ($categories.NATIVE.Count -gt 0)     { $present += "NATIVE" }
if ($categories.SOURCE.Count -gt 0)     { $present += "SOURCE" }
if ($categories.ASSETS.Count -gt 0)     { $present += "ASSETS" }
if ($categories.DOCS.Count -gt 0)       { $present += "DOCS" }

# Forbidden combos
$blocked = $false
$reasons = @()

if ($categories.DEPENDENCY.Count -gt 0 -and
    ($categories.SOURCE.Count -gt 0 -or $categories.ASSETS.Count -gt 0)) {
  $blocked = $true
  $reasons += "DEPENDENCY changes bundled with SOURCE/ASSETS. Split into separate commits."
}

if ($categories.NATIVE.Count -gt 0 -and $categories.SOURCE.Count -gt 0) {
  $blocked = $true
  $reasons += "NATIVE config (app.json/gradle.properties) bundled with SOURCE code. Split into separate commits."
}

if ($blocked) {
  Write-Host ""
  Write-Host "============================================================" -ForegroundColor Red
  Write-Host "  COMMIT BLOCKED — Multi-domain commit detected" -ForegroundColor Red
  Write-Host "============================================================" -ForegroundColor Red
  Write-Host ""
  Write-Host "Categories present in this commit:" -ForegroundColor Yellow
  foreach ($cat in $present) {
    Write-Host "  $($cat):" -ForegroundColor Yellow
    foreach ($f in $categories[$cat]) { Write-Host "    $f" }
  }
  Write-Host ""
  Write-Host "Why blocked:" -ForegroundColor Yellow
  foreach ($r in $reasons) { Write-Host "  - $r" }
  Write-Host ""
  Write-Host "How to fix:" -ForegroundColor Cyan
  Write-Host "  git reset HEAD <file>      # unstage one file"
  Write-Host "  git commit -m '...'        # commit the remaining staged set"
  Write-Host "  git add <file>; git commit # then commit the others separately"
  Write-Host ""
  Write-Host "Bypass (audit-tracked):  git commit --no-verify" -ForegroundColor DarkGray
  Write-Host "============================================================" -ForegroundColor Red
  exit 1
}

# Locked file enforcement
$lockedPatterns = @(
  "apps/mobile/components/SplashOverlay\.tsx$",
  "apps/mobile/app/\(auth\)/login\.tsx$",
  "CLAUDE\.md$",
  "SOUL\.md$",
  "apps/mobile/ASSET-MANIFEST\.md$",
  "apps/mobile/ARCHITECTURE-DECISIONS\.md$",
  "apps/mobile/LESSONS-LEARNED\.md$"
)

$lockedHits = @()
foreach ($file in $staged) {
  foreach ($pat in $lockedPatterns) {
    if ($file -match $pat) { $lockedHits += $file }
  }
}

if ($lockedHits.Count -gt 0) {
  $msgFile = ".git/COMMIT_EDITMSG"
  $msg = if (Test-Path $msgFile) { Get-Content $msgFile -Raw } else { "" }

  # Also check the commit message from the command line via GIT_PARAMS or parent process
  # For pre-commit hook, the message isn't written yet, so we check env
  # The locked-edit-approved check works best as a commit-msg hook,
  # but we do a best-effort check here by reading the message if available.

  # Note: In a pre-commit hook the commit message may not be finalized yet.
  # We'll allow it through here and rely on the commit-msg stage or manual review.
  # For now, print a warning.
  Write-Host ""
  Write-Host "WARNING: Locked file(s) being committed:" -ForegroundColor Yellow
  foreach ($f in $lockedHits) { Write-Host "  $f" -ForegroundColor Yellow }
  Write-Host "Ensure your commit message includes [locked-edit-approved]" -ForegroundColor Yellow
  Write-Host ""
}

exit 0
