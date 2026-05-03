## SPEC COMPLIANCE REQUIREMENTS — MANDATORY (read before any edit)

This prompt operates within the canonical TRANSFORMR spec system.
Spec files are the single source of truth. Code follows spec, never
the other way around.

### Required reading before any code edit

You MUST read these files before making any change to dashboard,
screen layout, component structure, AI behavior, notifications, or
any specced behavior:

  C:\dev\transformr\docs\TRANSFORMR-DASHBOARD-V2-SPEC.md
  C:\dev\transformr\docs\specs\TRANSFORMR-MASTER-PRINCIPLES.md
  C:\dev\transformr\TRANSFORMR-BRAND-KIT.md
  C:\dev\transformr\CLAUDE.md
  C:\dev\transformr\ASSET-MANIFEST.md
  C:\dev\transformr\LESSONS-LEARNED.md
  C:\dev\transformr\ARCHITECTURE-DECISIONS.md
  C:\dev\transformr\SOUL.md

### Conflict resolution

If any instruction in this prompt conflicts with the spec files:
  - The spec files win.
  - STOP immediately and report the conflict to the user.
  - Do NOT proceed with the conflicting instruction.
  - Do NOT improvise a compromise.

### Spec sync requirement (Master Principles Section 23)

If your code changes amend any specced behavior, you MUST update the
relevant spec file in the SAME commit as the code change. Both files
must appear in `git status` before the commit. If only the code
changes, that is a defect.

If the spec is silent on the behavior you are changing, add a section
to the relevant spec file documenting the new behavior. The spec must
always reflect reality.

### Windows paths only

This is a Windows machine running PowerShell.
  - Use C:\dev\transformr\... for all paths.
  - NEVER use /mnt/user-data/ for any output.
  - NEVER use Linux-style paths (forward slashes for system paths).
  - NEVER write files outside C:\dev\transformr\.
  - PowerShell only. Never bash, grep, find, cat, ls, sed, awk.
  - cd on its own line, command on the next line. Never chain
    with && or ;.

### Required pre-edit checks

Before making any change, run:

  cd C:\dev\transformr
  git log -1 --format="%H %s"

Capture the starting commit hash. Include it in your final report.

Read the spec sections relevant to your work. Confirm your planned
changes do not conflict with the specs above. If conflict exists,
STOP and report to the user before any edit.

### Process killing prohibition (zero tolerance)

NEVER suggest or use:
  - taskkill
  - Stop-Process
  - kill
  - pkill
  - any process-killing command in any context

Zombie process remediation is "manually close the window" or
"restart the computer." No exceptions ever.

### Asset preservation

If the prompt is onboarding-adjacent, run an asset checksum check
before and after edits. Hero images in apps/mobile/assets/images/
are locked per ASSET-MANIFEST.md. Any change to that folder is
a defect unless explicitly instructed.

### Spec sync verification gate

Before committing, verify:
  cd C:\dev\transformr
  git status

Expected: at least one spec file in the modified files list IF this
prompt amended specced behavior. If only code changed AND spec was
amended, STOP — the spec file was not updated. Add the spec update
to the same commit.

If this prompt did not amend any specced behavior (purely additive
work that the spec already accommodates), state explicitly in your
final report: "No spec amendment required because [reason]."

---

# Prompt 07: Goals Navigation Simplification

**ADD/FIX ONLY. NEVER REMOVE. NEVER DOWNGRADE. NEVER CHANGE UI STYLING WITHOUT EXPLICIT INSTRUCTION.**

## File-Locking Note
This prompt modifies ONLY `apps/mobile/app/(tabs)/goals/index.tsx`. No other file should be touched.

## Governance Files
Read before starting: `CLAUDE.md`, `SOUL.md`, `ASSET-MANIFEST.md`, `LESSONS-LEARNED.md`, `ARCHITECTURE-DECISIONS.md`.

## Objective
Restructure the 9-item horizontal navigation scroll on the Goals home screen into 3 grouped sections, making all navigation targets visible without horizontal scrolling.

## Current State
Goals home has a horizontal ScrollView with 9 navigation items (Habits, Sleep, Mood, Journal, Skills, Focus, Vision Board, Challenges, and more). Only 3-4 are visible at once, requiring horizontal scroll to find targets.

## Required Changes

### 1. Replace Horizontal Scroll with Grouped Grid
Replace the horizontal nav scroll with 3 labeled sections, each containing a row of navigation cards:

**Section 1: "Daily Tracking"**
- Habits → `/(tabs)/goals/habits`
- Sleep → `/(tabs)/goals/sleep`
- Mood → `/(tabs)/goals/mood`
- Journal → `/(tabs)/goals/journal`

**Section 2: "Growth"**
- Challenges → `/(tabs)/goals/challenges`
- Skills → `/(tabs)/goals/skills`
- Focus → `/(tabs)/goals/focus-mode`
- Vision Board → `/(tabs)/goals/vision-board`

**Section 3: "Financial"**
- Business → `/(tabs)/goals/business`
- Finance → `/(tabs)/goals/finance`
- Stake Goals → `/(tabs)/goals/stake-goals`

### 2. Layout
Each section has:
- Section label: `typography.captionBold`, `colors.text.secondary`, marginBottom: spacing.xs
- Row of cards: flexDirection 'row', gap spacing.sm, flexWrap 'wrap'
- Each card: flex: 1, minWidth: 80, height: 64, rounded corners, icon + label centered

### 3. Preserve All Navigation Destinations
EVERY single navigation target that exists today must still be reachable. Count them before and after. The number must be identical.

### 4. Preserve Existing Goal List
The main goal list (progress bars, goal cards, category filters) below the navigation section must remain completely unchanged.

## Verification Gates
- [ ] All 9+ navigation targets still reachable (count before and after)
- [ ] No horizontal scrolling required to see all nav items
- [ ] Goal list below navigation unchanged
- [ ] Category filter still works
- [ ] Inline deadline editing still works
- [ ] Coachmark refs still attached (goals coachmark tour)
- [ ] All onPress handlers preserved
- [ ] `npx tsc --noEmit` passes with 0 errors
- [ ] No removed imports or require() statements
- [ ] No store files modified

## Stores Touched
NONE.
