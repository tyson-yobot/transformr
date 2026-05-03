# TRANSFORMR — Autonomous Phase 1 Launcher (v2 — corrected paths)

**Why v2:** v1 had three governance file paths wrong. They live at `apps/mobile/`, not repo root. The agent correctly stopped at pre-flight on first launch. v2 fixes the paths.

**Use this prompt:** Paste into Claude Code as a single message. Same behavior as v1 — strict STOP-on-anything-unexpected discipline, no improvisation, no "best effort" workarounds.

**Estimated runtime:** 5-8 hours unattended.

---

## PRE-LAUNCH CLEANUP

Before launching v2, delete the v1 BLOCKED.md from the previous run so it doesn't confuse anyone or get mistaken for a current blocker. The v1 stop is in git history if we ever need to reference it.

```powershell
cd C:\dev\transformr
git rm BLOCKED.md
git commit -m "chore: remove BLOCKED.md from autonomous v1 pre-flight stop

Resolved by autonomous v2 with corrected governance file paths
(apps/mobile/ instead of repo root). Original BLOCKED.md preserved
in git history.

[v2-build-exception]"
git push origin dev
```

Verify clean state:

```powershell
cd C:\dev\transformr
git status --short
```

Expected: only `?? docs/~$ANSFORMR-DASHBOARD-V2-SPEC.md`. If anything else, fix before launching.

---

## PASTE BELOW THIS LINE TO CLAUDE CODE

```
TRANSFORMR — AUTONOMOUS PHASE 1 EXECUTION (v2)
==============================================

ROLE & MANDATE

You are operating in AUTONOMOUS MODE. Tyson is away from the computer
and cannot answer questions, approve interpretations, or visually verify
your work. You will execute 6 sequential prompts from the UX
remediation prompt pack with strict guardrails.

You will NOT improvise. You will NOT amend specs. You will NOT make
"best effort" decisions. If anything is unexpected, you STOP, write a
BLOCKED.md file explaining why, and exit cleanly.

A successful run produces 6 commits on `dev`, each tagged
`[autonomous]` in the commit message body, and a final run report at
`C:\dev\transformr\docs\autonomous-runs\autonomous-run-{timestamp}.md`.

A blocked run produces fewer than 6 commits and a `BLOCKED.md` file at
the repo root explaining exactly why you stopped and what Tyson should
do on return. THIS IS A SUCCESSFUL OUTCOME — stopping is correct
behavior. Improvising is not.

ENVIRONMENT

OS: Windows. PowerShell only.
Repo root: C:\dev\transformr
Branch: dev (do not change, do not create new branches)
Working dir for execution: C:\dev\transformr\apps\mobile

GOVERNANCE FILE LOCATIONS (READ CAREFULLY)

Some governance files live at repo root, others live at apps/mobile/.
Use these EXACT paths — do not assume, do not guess:

Repo-root governance files:
  C:\dev\transformr\CLAUDE.md
  C:\dev\transformr\SOUL.md
  C:\dev\transformr\TRANSFORMR-BRAND-KIT.md
  C:\dev\transformr\docs\TRANSFORMR-DASHBOARD-V2-SPEC.md
  C:\dev\transformr\docs\specs\TRANSFORMR-MASTER-PRINCIPLES.md

Mobile-app-rooted governance files:
  C:\dev\transformr\apps\mobile\ASSET-MANIFEST.md
  C:\dev\transformr\apps\mobile\LESSONS-LEARNED.md
  C:\dev\transformr\apps\mobile\ARCHITECTURE-DECISIONS.md

If any of these 8 files are missing, STOP at pre-flight. Do not
attempt to create them. Do not search elsewhere for them. Do not
substitute alternatives.

ABSOLUTE RULES — FORBIDDEN ACTIONS

You MAY NOT:
- Run taskkill, Stop-Process, kill, pkill, or any process-killing command
- Run npm install, npm uninstall, expo install, expo prebuild, eas build
- Modify package.json, app.json, eas.json, tsconfig.json, .eslintrc, .npmrc
- Modify any Zustand store file in apps/mobile/stores/
- Modify any existing Edge Function in supabase/functions/
- Modify any existing migration in supabase/migrations/ (creating new ones is OK)
- Touch any file in apps/mobile/assets/images/
- Touch any file in apps/mobile/assets/fonts/
- Modify the cc PowerShell function or any shell tooling
- Modify any file outside the scope listed in the prompt being executed
- Disable a failing test to make it pass
- Lower a verification threshold to make it pass
- Skip the spec-compliance wrapper at the top of each prompt
- Amend any spec file (even if you think the spec is wrong)
- Improvise spec interpretations
- Continue past a STOP condition for any reason
- Use forward slashes for Windows file paths
- Use bash, grep, find, cat, ls, sed, awk (PowerShell only)
- Chain PowerShell commands with && or ;
- Place cd and another command on the same line
- Move, copy, or rename governance files to "fix" path mismatches

You MUST:
- Read all governance files at their EXACT paths listed above
- Run all verification gates after each prompt
- STOP on ANY STOP condition without exception
- Tag every commit with [autonomous] marker in the message body
- Push every commit to origin immediately after commit
- Maintain a clean working tree between prompts
- Create the final run report at end (success) or BLOCKED.md (stop)

PHASE 0 — PRE-FLIGHT CHECKS

Run these and capture output. If any check fails, STOP immediately
and create BLOCKED.md.

Step 0.1 — Verify branch and clean state:
  cd C:\dev\transformr
  git branch --show-current
  Expected: dev. If anything else, STOP.

  cd C:\dev\transformr
  git status --short
  Expected: empty OR only docs/~$ANSFORMR-DASHBOARD-V2-SPEC.md (Word lock).
  If anything else, STOP — uncommitted work means previous run didn't
  complete cleanly.

  cd C:\dev\transformr
  git log -1 --format="%H %s"
  Capture this hash as STARTING_COMMIT for the run report.

Step 0.2 — Verify all 6 prompt files exist:
  cd C:\dev\transformr\docs\ux-remediation-prompts
  Get-ChildItem -Filter "*.md" | Where-Object { $_.Name -match "^(04|05|06|08|09|10)-" } | Measure-Object
  Expected: 6 files. If fewer, STOP.

Step 0.3 — Verify all 8 governance files exist at their EXACT paths:

  Repo-root files (5):
    Test-Path C:\dev\transformr\CLAUDE.md
    Test-Path C:\dev\transformr\SOUL.md
    Test-Path C:\dev\transformr\TRANSFORMR-BRAND-KIT.md
    Test-Path C:\dev\transformr\docs\TRANSFORMR-DASHBOARD-V2-SPEC.md
    Test-Path C:\dev\transformr\docs\specs\TRANSFORMR-MASTER-PRINCIPLES.md

  Mobile-app-rooted files (3):
    Test-Path C:\dev\transformr\apps\mobile\ASSET-MANIFEST.md
    Test-Path C:\dev\transformr\apps\mobile\LESSONS-LEARNED.md
    Test-Path C:\dev\transformr\apps\mobile\ARCHITECTURE-DECISIONS.md

  Expected: all 8 return True. If ANY return False, STOP.

Step 0.4 — Verify TypeScript baseline is clean:
  cd C:\dev\transformr\apps\mobile
  npx tsc --noEmit 2>&1 | Out-String
  Capture the output. Note any pre-existing errors as TS_BASELINE.
  Per the audit, baseline is 0 TypeScript errors. If baseline shows
  errors, STOP — environment is in unexpected state.

Step 0.5 — Capture asset checksum baseline:
  cd C:\dev\transformr
  Get-FileHash apps/mobile/assets/images/* -Algorithm SHA256 |
    Select-Object Path, Hash | Out-String
  Save this as ASSET_BASELINE for comparison at end.

Step 0.6 — Create run tracking directory:
  cd C:\dev\transformr
  if (-not (Test-Path docs/autonomous-runs)) {
    New-Item -ItemType Directory -Path docs/autonomous-runs -Force
  }

If all 6 pre-flight checks pass, proceed to Phase 1.

PHASE 1 — EXECUTE 6 PROMPTS SEQUENTIALLY

Execution order is fixed. Do not reorder. Do not parallelize. Run one
at a time, verify, commit, push, then next.

Prompts to execute IN THIS ORDER:
  1. C:\dev\transformr\docs\ux-remediation-prompts\04-sleep-time-picker.md
  2. C:\dev\transformr\docs\ux-remediation-prompts\05-coachmark-expansion.md
  3. C:\dev\transformr\docs\ux-remediation-prompts\06-help-bubbles-gated.md
  4. C:\dev\transformr\docs\ux-remediation-prompts\08-profile-state-fix.md
  5. C:\dev\transformr\docs\ux-remediation-prompts\09-daily-briefing-wayfinding.md
  6. C:\dev\transformr\docs\ux-remediation-prompts\10-transparency-migration.md

For EACH prompt, run this exact sub-sequence:

  STEP A — Read the prompt file in full:
    cd C:\dev\transformr\docs\ux-remediation-prompts
    Get-Content {prompt-file}.md -Raw
    Read the spec compliance wrapper at the top. Read the prompt body.
    Identify the file scope explicitly — which files this prompt is
    allowed to modify.

  STEP B — Read all governance files (per wrapper requirement):
    Repo-root files:
      Get-Content C:\dev\transformr\CLAUDE.md -Raw
      Get-Content C:\dev\transformr\SOUL.md -Raw
      Get-Content C:\dev\transformr\TRANSFORMR-BRAND-KIT.md -Raw
      Get-Content C:\dev\transformr\docs\TRANSFORMR-DASHBOARD-V2-SPEC.md -Raw
      Get-Content C:\dev\transformr\docs\specs\TRANSFORMR-MASTER-PRINCIPLES.md -Raw

    Mobile-app-rooted files:
      Get-Content C:\dev\transformr\apps\mobile\ASSET-MANIFEST.md -Raw
      Get-Content C:\dev\transformr\apps\mobile\LESSONS-LEARNED.md -Raw
      Get-Content C:\dev\transformr\apps\mobile\ARCHITECTURE-DECISIONS.md -Raw

  STEP C — Conflict check:
    Cross-reference the prompt's instructions against the specs.
    If you detect ANY conflict between prompt and spec — even subtle —
    STOP and create BLOCKED.md.

  STEP D — Verify pre-execution clean state:
    cd C:\dev\transformr
    git status --short
    Expected: clean (only Word lock file). If not clean, STOP.

  STEP E — Capture starting commit:
    cd C:\dev\transformr
    git log -1 --format="%H"
    Save as PROMPT_START_HASH.

  STEP F — Implement the changes:
    Make ONLY the changes specified in the prompt body.
    Touch ONLY files listed in the prompt's scope.
    Do NOT modify any other file.
    Do NOT add features not in the prompt.
    Do NOT change behavior beyond what's specified.

  STEP G — Verify file scope wasn't violated:
    cd C:\dev\transformr
    git status --short
    For each modified file, confirm it's in the prompt's allowed scope.
    If ANY file outside scope was modified, STOP.
    Discard any uncommitted changes to out-of-scope files via:
      cd C:\dev\transformr
      git checkout -- {file}
    If discarding still leaves out-of-scope changes, STOP entirely.

  STEP H — Run verification gates:
    cd C:\dev\transformr\apps\mobile
    npx tsc --noEmit
    If exits with errors, STOP.

    cd C:\dev\transformr\apps\mobile
    npx eslint . 2>&1 | Out-String
    Compare to TS_BASELINE captured in pre-flight. If new errors
    introduced, STOP. (Pre-existing errors don't block.)

  STEP I — Run prompt-specific verification gates:
    Read the prompt's "Verification Gates" section. Run each gate.
    If any gate fails, STOP.

  STEP J — Verify asset preservation:
    cd C:\dev\transformr
    Get-FileHash apps/mobile/assets/images/* -Algorithm SHA256 |
      Select-Object Path, Hash | Out-String
    Compare to ASSET_BASELINE. If ANY asset hash changed, STOP.

  STEP K — Run spec sync verification:
    cd C:\dev\transformr
    git status --short
    If the changes in this prompt amend any specced behavior, the
    relevant spec file MUST be in the modified files list. If not,
    STOP — spec was not updated. If the prompt was purely additive
    and spec is silent, this gate passes.

  STEP L — Stage and commit:
    cd C:\dev\transformr
    git add {only the files specified in the prompt's scope}
    cd C:\dev\transformr
    git status --short
    Verify only the expected files are staged.

    cd C:\dev\transformr
    git commit -m "feat({scope}): {one-line summary from prompt}

    Implements UX remediation prompt {NN} per
    docs/ux-remediation-prompts/{NN}-{name}.md.

    {Brief description of what the prompt accomplishes.}

    Verification gates passed:
    - TypeScript: 0 errors
    - ESLint: 0 new errors
    - File scope: only {N} files modified, all in prompt scope
    - Asset checksums: unchanged
    - Spec sync: {state explicitly per master principles Section 23}

    Visual verification pending Tyson's return.

    [autonomous]
    [v2-build-exception]"

  STEP M — Push:
    cd C:\dev\transformr
    git push origin dev
    If push fails (network error, conflict, etc.), STOP.

  STEP N — Capture final commit hash:
    cd C:\dev\transformr
    git log -1 --format="%H"
    Save as PROMPT_END_HASH.

  STEP O — Verify clean state for next prompt:
    cd C:\dev\transformr
    git status --short
    Expected: clean (only Word lock file). If not clean, STOP.

  STEP P — Append to run log:
    Track in memory:
      - Prompt number
      - Prompt file name
      - PROMPT_START_HASH
      - PROMPT_END_HASH
      - Files modified (list)
      - Verification gates passed (list)

  Proceed to next prompt's sub-sequence.

PHASE 2 — FINAL REPORT (only if all 6 prompts completed)

Step 2.1 — Capture ending state:
  cd C:\dev\transformr
  git log -1 --format="%H %s"
  Save as ENDING_COMMIT.

  cd C:\dev\transformr
  git log STARTING_COMMIT..HEAD --oneline
  Save as COMMIT_LIST.

  cd C:\dev\transformr
  git diff STARTING_COMMIT..HEAD --stat
  Save as DIFF_STAT.

Step 2.2 — Final verification:
  cd C:\dev\transformr\apps\mobile
  npx tsc --noEmit

  cd C:\dev\transformr\apps\mobile
  npx eslint . 2>&1 | Out-String

  cd C:\dev\transformr
  git status --short
  Expected: clean.

  Compare current asset hashes to ASSET_BASELINE. Expected: identical.

Step 2.3 — Generate timestamp:
  $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

Step 2.4 — Write run report at:
  C:\dev\transformr\docs\autonomous-runs\autonomous-run-{timestamp}.md

  Content:

  # Autonomous Phase 1 Run Report

  **Date:** {ISO date and time}
  **Duration:** {hours and minutes from start to end}
  **Status:** SUCCESS — all 6 prompts completed

  ## Starting state
  - Commit: {STARTING_COMMIT}
  - Branch: dev

  ## Ending state
  - Commit: {ENDING_COMMIT}
  - Branch: dev
  - Working tree: clean

  ## Prompts completed
  | # | Prompt | Start hash | End hash | Files modified |
  |---|---|---|---|---|
  | 1 | 04-sleep-time-picker | {hash} | {hash} | {list} |
  | 2 | 05-coachmark-expansion | {hash} | {hash} | {list} |
  | 3 | 06-help-bubbles-gated | {hash} | {hash} | {list} |
  | 4 | 08-profile-state-fix | {hash} | {hash} | {list} |
  | 5 | 09-daily-briefing-wayfinding | {hash} | {hash} | {list} |
  | 6 | 10-transparency-migration | {hash} | {hash} | {list} |

  ## Verification gates (all passed)
  - TypeScript: 0 errors after each prompt
  - ESLint: 0 new errors introduced
  - File scope: respected on every prompt
  - Asset checksums: unchanged across entire run
  - Spec sync: appropriately handled per prompt
  - Push: every commit pushed to origin/dev

  ## Diff summary
  {DIFF_STAT}

  ## What's pending Tyson's return
  - Visual verification of each change on emulator
  - Confirm app boots cleanly
  - Confirm each modified screen renders correctly
  - Authorize proceeding to Phase 2 (amended Prompts 03 and 11)

  ## Recommended next steps
  1. Cold-boot emulator
  2. Open app, navigate to each modified screen, verify visually
  3. If all visual checks pass, mark Phase 1 complete
  4. Proceed to Phase 2 — amend Prompts 03 and 11 then execute

  ## If anything looks wrong
  Each prompt is one commit. Revert the bad one with:
    git revert {commit-hash}
  Then re-prompt manually with corrections.

Step 2.5 — Commit and push the run report:
  cd C:\dev\transformr
  git add docs/autonomous-runs/autonomous-run-{timestamp}.md

  cd C:\dev\transformr
  git commit -m "docs(autonomous): Phase 1 run report — all 6 prompts completed

  See file body for details. Visual verification pending Tyson's return.

  [autonomous]
  [v2-build-exception]"

  cd C:\dev\transformr
  git push origin dev

Step 2.6 — Final state check:
  cd C:\dev\transformr
  git status --short
  Expected: clean.

  Print to console:
    "AUTONOMOUS PHASE 1 COMPLETE."
    "Run report at: C:\dev\transformr\docs\autonomous-runs\autonomous-run-{timestamp}.md"
    "Total commits: 7 (6 prompts + 1 run report)"
    "Tyson can resume work on return. Visual verification pending."

  EXIT CLEANLY.

STOP HANDLING — IF ANY STOP CONDITION FIRES

Step S.1 — Discard uncommitted changes:
  cd C:\dev\transformr
  git status --short
  For each modified-but-uncommitted file:
    cd C:\dev\transformr
    git checkout -- {file}
  For each untracked file (excluding the Word lock):
    Do NOT delete. Leave for Tyson to inspect.
  Verify clean state:
    cd C:\dev\transformr
    git status --short
  Expected: clean (only Word lock).

Step S.2 — Capture state at time of STOP:
  cd C:\dev\transformr
  git log -1 --format="%H %s"
  Save as STOP_HASH.

  cd C:\dev\transformr
  git log STARTING_COMMIT..HEAD --oneline
  Save as COMPLETED_COMMITS.

Step S.3 — Generate timestamp:
  $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

Step S.4 — Write BLOCKED.md at repo root:
  Create file at C:\dev\transformr\BLOCKED.md

  Content:

  # AUTONOMOUS RUN BLOCKED

  **Date:** {ISO date and time}
  **Stopped after prompt:** {prompt number that triggered STOP, OR "pre-flight" if Phase 0 failed}
  **Reason:** {specific STOP condition that fired}

  ## What completed successfully

  Starting commit: {STARTING_COMMIT}

  Prompts completed before STOP:
  {list of prompts with their end hashes, OR "none — stopped during pre-flight"}

  Last commit: {STOP_HASH}

  ## What stopped the run

  {Verbatim description of what was unexpected}

  Specifics:
  {Output of the failing command or the exact text of the conflict}

  ## What was NOT attempted

  Prompts not yet run:
  {list of remaining prompts}

  ## Repository state at STOP

  - Branch: dev
  - Working tree: clean (any uncommitted changes were discarded)
  - Last successful commit: {STOP_HASH}

  ## Recommended next step for Tyson

  1. Read this file in full
  2. Inspect the failing condition by running the relevant commands manually
  3. Decide:
     - If the spec needs updating: amend spec, commit, then continue manually
     - If the prompt needs amending: amend prompt, commit, then continue manually
     - If a deeper investigation is needed: dig in
  4. Once the blocker is resolved, either:
     - Re-launch autonomous mode for remaining prompts, OR
     - Continue manually one prompt at a time

  ## Why I stopped instead of improvising

  Per autonomous mode rules, any unexpected condition triggers STOP.
  Improvising would risk drift from spec, broken commits, or work
  that needs redoing. Stopping is correct behavior. The successful
  prompts above are real progress and ready for visual verification.

Step S.5 — Commit and push BLOCKED.md (so Tyson can see it on GitHub):
  cd C:\dev\transformr
  git add BLOCKED.md

  cd C:\dev\transformr
  git commit -m "blocked: autonomous Phase 1 stopped at prompt {N}

  See BLOCKED.md for full details and recommended next steps.

  [autonomous]
  [v2-build-exception]"

  cd C:\dev\transformr
  git push origin dev

Step S.6 — Print summary and exit:
  Print to console:
    "AUTONOMOUS PHASE 1 STOPPED."
    "Reason: {STOP condition}"
    "Successful prompts: {N} of 6"
    "BLOCKED.md at: C:\dev\transformr\BLOCKED.md (also pushed to GitHub)"
    "Tyson can resume on return. Successful work is preserved."

  EXIT CLEANLY. Do NOT attempt to recover. Do NOT continue.

FINAL NOTES

You have everything you need. The 6 prompts already have spec
compliance wrappers at the top. The specs are committed. The
governance file paths above are now correct. Stay disciplined. Trust
the STOP conditions. A blocked run is a successful run if it stopped
for the right reason.

If you ever feel like you should make a judgment call about something
unexpected, the answer is STOP. Tyson will handle it on return.

BEGIN PHASE 0 PRE-FLIGHT NOW.
```

## END OF PROMPT

---

## What changed from v1 to v2

Two corrections, nothing else:

1. **Pre-flight Step 0.3** now lists 8 governance files split into "repo-root files" (5) and "mobile-app-rooted files" (3), with the correct paths for each
2. **Per-prompt Step B** (read governance files before each prompt) now uses the correct paths

The prompt body remains 95% identical to v1. The discipline, STOP conditions, forbidden actions, and reporting structure are unchanged.

---

## Launch sequence

1. Run the pre-launch cleanup commands above (delete BLOCKED.md, push)
2. Verify `git status --short` shows only the Word lock file
3. Open Claude Code (`cd C:\dev\transformr && cc`)
4. Copy everything between `## PASTE BELOW THIS LINE TO CLAUDE CODE` and `## END OF PROMPT`
5. Paste as a single message
6. Walk away

Same scenario expectations as before — either run report at `docs/autonomous-runs/` or fresh `BLOCKED.md` at repo root.
