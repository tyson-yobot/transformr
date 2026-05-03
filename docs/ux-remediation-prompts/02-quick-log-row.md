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

# Prompt 02: Quick-Log Row (6 Targets)

**ADD/FIX ONLY. NEVER REMOVE. NEVER DOWNGRADE. NEVER CHANGE UI STYLING WITHOUT EXPLICIT INSTRUCTION.**

## File-Locking Note
This prompt modifies `apps/mobile/app/(tabs)/dashboard.tsx` (Quick Actions section only) and creates ONE new component. If Prompt 01 is running on dashboard.tsx, wait for it to complete first, or coordinate line references.

## Governance Files
Read before starting: `CLAUDE.md`, `SOUL.md`, `ASSET-MANIFEST.md`, `LESSONS-LEARNED.md`, `ARCHITECTURE-DECISIONS.md`.

## Objective
Replace the existing 3-tile Quick Actions row (Log Workout, Log Meal, Log Weight) with a 6-target Quick Log row that enables 1-tap logging for the top daily actions: Workout, Meal, Water, Weight, Mood, Habit.

## Current State
Dashboard line ~551-595 renders 3 `QuickActionTile` components wrapped in `LogSuccessRipple`. Each tile navigates to a screen on press.

## Required Changes

### 1. Expand to 6 Quick Action Tiles
Replace the 3 existing tiles with 6 smaller tiles in a 2-row or single-row layout. Each tile is 44pt minimum touch target.

Layout option (single row, 6 tiles):
```tsx
<View style={{ flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.lg, justifyContent: 'space-between' }}>
  {/* Existing 3: Workout, Meal, Weight (keep existing onPress) */}
  {/* New 3: Water, Mood, Habit */}
</View>
```

### 2. Water Quick-Log (1-tap)
```tsx
<QuickActionTile
  icon="water"
  iconNode={<Icon3D name="water" size={24} />}
  label="Water"
  accentColor={colors.accent.cyan}
  dimColor={colors.dim.cyan}
  onPress={async () => {
    await hapticLight();
    const logWater = useNutritionStore.getState().logWater;
    if (logWater) {
      await logWater(8); // 8oz default
      // Show ActionToast confirmation
    }
  }}
/>
```

Note: Verify that `useNutritionStore` has a `logWater` action. If it does not, create a quick-log helper that inserts into the `water_logs` table via Supabase directly. DO NOT modify the store file. Instead, create a utility function.

### 3. Mood Quick-Log (1-tap opens 5-emoji selector)
On press, show a small bottom sheet or inline selector with 5 mood options (1-5 mapped to emojis). Selecting one logs immediately via `useMoodStore`.

```tsx
const QUICK_MOODS = [
  { value: 2, emoji: '😫' },
  { value: 4, emoji: '😕' },
  { value: 5, emoji: '😐' },
  { value: 7, emoji: '🙂' },
  { value: 9, emoji: '😄' },
];
```

### 4. Habit Quick-Log (1-tap opens habit checklist)
On press, show a bottom sheet listing the top 5 incomplete habits for today. Each has a checkbox. Tapping completes via existing `useHabitStore.toggleHabit`.

### 5. Add LogSuccessRipple to new tiles
Wrap each new tile in `LogSuccessRipple` with a ref, same pattern as existing tiles.

### 6. Import new store hooks
Add to existing imports:
```tsx
import { useMoodStore } from '@stores/moodStore';
```
Note: `useNutritionStore` and `useHabitStore` are already imported.

### 7. Add targeted selectors for new stores
```tsx
const logMood = useMoodStore((s) => s.logMood);
// Use existing: const habits, todayCompletions from useHabitStore
```

## Verification Gates
- [ ] All 3 original quick actions (Workout, Meal, Weight) still work identically
- [ ] 3 new quick actions (Water, Mood, Habit) function correctly
- [ ] All 6 tiles are >= 44pt touch targets
- [ ] Haptic feedback fires on each action
- [ ] ActionToast confirmation shown after Water quick-log
- [ ] Offline queue handles Water log when offline
- [ ] No store files modified
- [ ] `npx tsc --noEmit` passes with 0 errors
- [ ] No removed imports or require() statements

## Stores Touched
NONE modified. New READ-ONLY selectors added for moodStore.
