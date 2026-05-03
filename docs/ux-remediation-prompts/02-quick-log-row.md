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
