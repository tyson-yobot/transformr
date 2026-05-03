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
