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

# Prompt 06: Help Bubbles for Gated Features

**ADD/FIX ONLY. NEVER REMOVE. NEVER DOWNGRADE. NEVER CHANGE UI STYLING WITHOUT EXPLICIT INSTRUCTION.**

## File-Locking Note
This prompt modifies 6 screen files by adding a single `HelpBubble` component to each. Each file is independent.

## Governance Files
Read before starting: `CLAUDE.md`, `SOUL.md`, `ASSET-MANIFEST.md`, `LESSONS-LEARNED.md`, `ARCHITECTURE-DECISIONS.md`.

## Objective
Add HelpBubble components to 6 feature-gated screens, placed BEFORE the FeatureLockOverlay, to explain the feature's value before the user encounters the paywall.

## Screens to Modify

### 1. Meal Camera (`app/(tabs)/nutrition/meal-camera.tsx`)
Add before the FeatureLockOverlay check:
```tsx
<HelpBubble
  id="gate_meal_camera"
  message="Point your camera at any meal and AI estimates calories and macros in seconds. Upgrade to unlock."
  position="above"
/>
```

### 2. Trajectory (`app/trajectory.tsx`)
```tsx
<HelpBubble
  id="gate_trajectory"
  message="See your projected weight, revenue, and fitness trajectory based on your current habits. AI-powered simulations show where you'll be in 30, 60, and 90 days."
  position="above"
/>
```

### 3. Stake Goals (`app/(tabs)/goals/stake-goals.tsx`)
```tsx
<HelpBubble
  id="gate_stake_goals"
  message="Put real money on your goals. Hit them and your money comes back. Miss them and it goes to charity. Real accountability drives real results."
  position="above"
/>
```

### 4. Form Check (`app/(tabs)/fitness/form-check.tsx`)
```tsx
<HelpBubble
  id="gate_form_check"
  message="Record a set and your AI coach analyzes your technique, identifying form breakdowns and injury risks before they become problems."
  position="above"
/>
```

### 5. Labs Interpretation (`app/labs/index.tsx`)
```tsx
<HelpBubble
  id="gate_labs"
  message="Upload your blood work and get AI-powered biomarker interpretation. Track trends over time and get personalized supplement and lifestyle recommendations."
  position="above"
/>
```

### 6. Readiness Score (on Dashboard QuickStatsRow)
This is different from the others. On the Dashboard, add a HelpBubble near the readiness stat:
```tsx
<HelpBubble
  id="gate_readiness"
  message="Your readiness score tells you how hard to push today, calculated from sleep, mood, training load, and soreness. Keep logging to unlock it."
  position="below"
/>
```

## Implementation Notes
- `HelpBubble` is an existing component at `components/ui/HelpBubble.tsx`
- It accepts `id` (string, used for MMKV "seen" persistence), `message`, and `position`
- Import if not already imported: `import { HelpBubble } from '@components/ui/HelpBubble';`
- Place the HelpBubble BEFORE any FeatureLockOverlay conditional return so it renders even for free-tier users

## Verification Gates
- [ ] All 6 HelpBubbles render on first visit
- [ ] HelpBubbles dismiss and don't reappear
- [ ] FeatureLockOverlay still renders correctly after HelpBubble
- [ ] No existing component layout or styling changed
- [ ] `npx tsc --noEmit` passes with 0 errors
- [ ] No removed imports

## Stores Touched
NONE.
