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

# Prompt 04: Sleep Time Picker

**ADD/FIX ONLY. NEVER REMOVE. NEVER DOWNGRADE. NEVER CHANGE UI STYLING WITHOUT EXPLICIT INSTRUCTION.**

## File-Locking Note
This prompt modifies ONLY `apps/mobile/app/(tabs)/goals/sleep.tsx`. No other file should be touched.

## Governance Files
Read before starting: `CLAUDE.md`, `SOUL.md`, `ASSET-MANIFEST.md`, `LESSONS-LEARNED.md`, `ARCHITECTURE-DECISIONS.md`.

## Objective
Replace the manual text input fields for bedtime and wake time in the sleep logging modal with native time picker wheels. This reduces sleep logging from 27-31 taps to 5-8 taps.

## Current State
The sleep logging modal in `goals/sleep.tsx` uses TextInput fields where users must type times in HH:MM format manually. There are also TextInput fields for caffeine cutoff and screen cutoff times.

## Required Changes

### 1. Install DateTimePicker (if not already present)
Check `package.json` for `@react-native-community/datetimepicker`. If not present:
```bash
npx expo install @react-native-community/datetimepicker
```

### 2. Replace TextInput with DateTimePicker for Time Fields
For bedtime, wake time, caffeine cutoff, and screen cutoff:
```tsx
import DateTimePicker from '@react-native-community/datetimepicker';

// Convert stored HH:MM string to Date object for picker
const timeStringToDate = (timeStr: string): Date => {
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date();
  d.setHours(h ?? 22, m ?? 0, 0, 0);
  return d;
};

// Convert Date back to HH:MM string for storage
const dateToTimeString = (d: Date): string => {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

<DateTimePicker
  value={timeStringToDate(bedtime)}
  mode="time"
  display="spinner"
  onChange={(event, date) => {
    if (date) setBedtime(dateToTimeString(date));
  }}
  minuteInterval={5}
  themeVariant={isDark ? 'dark' : 'light'}
/>
```

### 3. Add Smart Defaults
Pre-fill the modal with sensible defaults when no previous sleep log exists:
- Bedtime: 22:30 (10:30 PM)
- Wake time: 06:30 (6:30 AM)
- Caffeine cutoff: 14:00 (2:00 PM)
- Screen cutoff: 21:00 (9:00 PM)

When a previous log exists, pre-fill from the most recent log.

### 4. Preserve All Existing Modal Content
The modal also contains:
- Quality stars (1-5)
- Notes field (TextInput)
- Save button

ALL of these must remain exactly as they are. Only the time input fields change.

## Verification Gates
- [ ] Time picker renders on both iOS and Android
- [ ] All 4 time fields use picker instead of TextInput
- [ ] Smart defaults populate when no previous log exists
- [ ] Previous log values populate when a log exists
- [ ] Quality stars still work
- [ ] Notes field still works
- [ ] Save button still logs correctly to Supabase
- [ ] Sleep duration still calculates correctly from bedtime/wake time
- [ ] AI sleep recommendation card still renders (not in modal, on main screen)
- [ ] `npx tsc --noEmit` passes with 0 errors
- [ ] No store files modified
- [ ] No imports or require() statements removed
- [ ] Dark mode picker renders correctly

## Stores Touched
NONE. sleepStore is read-only from this file's perspective.
