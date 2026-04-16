# Fitness Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the broken "Add to Workout" flow, stop the timer auto-starting, add an always-visible "+ Add Exercise" button in the workout player, fix layout overflows, and connect completed workouts to calorie burn in the nutrition store.

**Architecture:** All changes are in existing files — no new files needed. The core bug is in `workout-player.tsx` (ignores the `exerciseId` route param). Timer state gets a `timerRunning` boolean. Calorie burn is calculated on workout completion and written via `useNutritionStore().logFood`. Layout fixes are single-line CSS changes.

**Tech Stack:** React Native, Expo Router, Zustand, Supabase, TypeScript

---

## File Map

| File | Changes |
|------|---------|
| `apps/mobile/app/(tabs)/fitness/workout-player.tsx` | Read `exerciseId` param → append exercise to session; add `timerRunning` state; add "+ Add Exercise" button |
| `apps/mobile/app/(tabs)/fitness/exercise-detail.tsx` | Remove hardcoded `paddingRight: 84` |
| `apps/mobile/app/(tabs)/dashboard.tsx` | Fix `statsCell` overflow so "Pending"/"Done" text doesn't clip |

---

## Task 1: Fix "Add to Workout" — workout-player reads exerciseId param

**Files:**
- Modify: `apps/mobile/app/(tabs)/fitness/workout-player.tsx`

The bug: `exercise-detail.tsx` navigates to `workout-player` with `params: { exerciseId }`, but `workout-player.tsx` never calls `useLocalSearchParams` so the param is silently ignored. Fix: read the param on mount, fetch the exercise from Supabase, and append it to `exercisesWithSets` if not already present.

- [ ] **Step 1: Add `useLocalSearchParams` import and read param**

In `workout-player.tsx`, change line 15:
```typescript
import { useRouter } from 'expo-router';
```
to:
```typescript
import { useRouter, useLocalSearchParams } from 'expo-router';
```

Then add this line immediately after the existing state declarations (after line 106, `const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);`):
```typescript
const { exerciseId: incomingExerciseId } = useLocalSearchParams<{ exerciseId?: string }>();
```

- [ ] **Step 2: Add a useEffect to handle the incoming exercise**

Add this new `useEffect` block directly after the existing "Load exercises for the template" `useEffect` (after line 194, before `const handleLogSet`):

```typescript
// Handle exercise added from the library via "Add to Workout"
useEffect(() => {
  if (!incomingExerciseId || loadingExercises) return;

  // Don't add if already in the list
  const alreadyAdded = exercisesWithSets.some(
    (e) => e.exercise.id === incomingExerciseId,
  );
  if (alreadyAdded) return;

  const addExercise = async () => {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('id', incomingExerciseId)
        .single();
      if (error || !data) return;

      const ghostData = await getGhostData(data.id);
      setExercisesWithSets((prev) => [
        ...prev,
        {
          exercise: data as Exercise,
          templateExercise: null,
          loggedSets: [],
          ghostSets: ghostData,
        },
      ]);
      // Switch to the newly added exercise tab
      setActiveExerciseIndex((prev) =>
        exercisesWithSets.length > 0 ? exercisesWithSets.length : 0,
      );
    } catch {
      // Non-fatal — user can try adding again
    }
  };

  void addExercise();
}, [incomingExerciseId, loadingExercises]);
```

- [ ] **Step 3: Reload the app and test — tap "Browse Exercise Library" from workout, tap any exercise, tap "Add to Workout", verify the exercise appears as a tab in the workout player**

Expected: exercise tab appears, weight/reps inputs are visible, "Log Set 1" button is visible.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/app/\(tabs\)/fitness/workout-player.tsx
git commit -m "fix: read exerciseId param in workout-player to make Add to Workout work"
```

---

## Task 2: Timer manual start — don't auto-run on screen open

**Files:**
- Modify: `apps/mobile/app/(tabs)/fitness/workout-player.tsx`

The timer starts immediately because `timerRef` interval is set as soon as `activeSession` is truthy. Add a `timerRunning` boolean state. Show a play button in the top bar when paused. Only tick when `timerRunning === true`.

- [ ] **Step 1: Add `timerRunning` state**

After line 106 (`const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);`), add:
```typescript
const [timerRunning, setTimerRunning] = useState(false);
```

- [ ] **Step 2: Gate the timer on `timerRunning`**

Replace the existing "Workout duration timer" `useEffect` (lines 112–122):
```typescript
// Workout duration timer — only runs when timerRunning is true
useEffect(() => {
  if (activeSession && timerRunning) {
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
  }
  return () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };
}, [activeSession, timerRunning]);
```

Note: we now increment `elapsedSeconds` by 1 each tick rather than computing from `started_at`, because `started_at` is the DB creation time (not when the user pressed Start). This means `elapsedSeconds` accurately reflects active workout time.

- [ ] **Step 3: Add play/pause button to the top bar**

In the top bar section (after the `{totalSets} sets` `topBarItem`, before the closing `</View>` of `topBar`), add:
```tsx
<Pressable
  onPress={() => { setTimerRunning((prev) => !prev); hapticLight(); }}
  accessibilityLabel={timerRunning ? 'Pause workout timer' : 'Start workout timer'}
  accessibilityRole="button"
  style={[
    styles.topBarItem,
    {
      backgroundColor: timerRunning ? `${colors.accent.danger}20` : `${colors.accent.success}20`,
      borderRadius: borderRadius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
    },
  ]}
>
  <Ionicons
    name={timerRunning ? 'pause-circle' : 'play-circle'}
    size={22}
    color={timerRunning ? colors.accent.danger : colors.accent.success}
  />
</Pressable>
```

- [ ] **Step 4: Verify — open a workout, confirm timer shows 00:00 and is paused. Tap play, confirm it ticks. Tap pause, confirm it stops.**

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/app/\(tabs\)/fitness/workout-player.tsx
git commit -m "feat: manual timer start/pause in workout player"
```

---

## Task 3: Add "+ Add Exercise" button always visible in workout player

**Files:**
- Modify: `apps/mobile/app/(tabs)/fitness/workout-player.tsx`

When exercises ARE present, there's no way to add more — the "Browse Exercise Library" button only shows on the empty state. Add a small "+ Add Exercise" pressable in the exercise tabs row so the user can always add more.

- [ ] **Step 1: Add "+ Add Exercise" button at the end of the exercise tabs ScrollView**

In the exercise tabs `ScrollView` (around line 465), add a pressable after the `exercisesWithSets.map(...)` block and before the closing `</ScrollView>`:

```tsx
<Pressable
  onPress={() => { router.push('/(tabs)/fitness/exercises' as never); hapticLight(); }}
  accessibilityLabel="Add another exercise to workout"
  accessibilityRole="button"
  style={[
    styles.exerciseTab,
    {
      backgroundColor: `${colors.accent.primary}20`,
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      marginRight: spacing.sm,
      borderWidth: 1,
      borderColor: colors.accent.primary,
      borderStyle: 'dashed',
    },
  ]}
>
  <Ionicons name="add" size={16} color={colors.accent.primary} />
  <Text
    style={[
      typography.captionBold,
      { color: colors.accent.primary, marginLeft: 4 },
    ]}
  >
    Add Exercise
  </Text>
</Pressable>
```

- [ ] **Step 2: Verify — start a workout, add an exercise, confirm the "+ Add Exercise" button appears in the tabs row. Tap it, browse, add another exercise, confirm both appear as tabs.**

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/app/\(tabs\)/fitness/workout-player.tsx
git commit -m "feat: always-visible Add Exercise button in workout player tab row"
```

---

## Task 4: Fix layout overflows

**Files:**
- Modify: `apps/mobile/app/(tabs)/fitness/exercise-detail.tsx`
- Modify: `apps/mobile/app/(tabs)/dashboard.tsx`

### 4a: exercise-detail.tsx — remove hardcoded paddingRight: 84

- [ ] **Step 1: Remove `paddingRight: 84` from the bottom bar**

In `exercise-detail.tsx`, find the bottom bar `View` style (around line 396–403):
```typescript
{
  backgroundColor: colors.background.primary,
  padding: spacing.lg,
  paddingRight: 84,   // <-- REMOVE THIS LINE
  borderTopWidth: 1,
  borderTopColor: colors.border.subtle,
}
```

Replace with:
```typescript
{
  backgroundColor: colors.background.primary,
  padding: spacing.lg,
  borderTopWidth: 1,
  borderTopColor: colors.border.subtle,
}
```

### 4b: dashboard.tsx — fix "Workout" column clipping in Today's Stats

The `statsCell` style has `paddingHorizontal: 4` with `flex: 1`. On smaller screens, the "Pending" text clips because the cells are too narrow. Fix by allowing text to fit and using `adjustsFontSizeToFit`.

- [ ] **Step 2: Update the Workout status cell in dashboard.tsx to prevent text clipping**

Find the inline `<View style={styles.statsCell}>` for Workout (around line 656):
```tsx
<View style={styles.statsCell}>
  <Text style={[typography.captionBold, { color: colors.text.secondary, marginBottom: spacing.xs }]}>
    Workout
  </Text>
  <Text style={{ fontSize: 20 }}>{workoutDoneToday ? '✅' : '⏳'}</Text>
  <Text style={[typography.caption, { color: workoutDoneToday ? colors.accent.success : colors.text.muted }]}>
    {workoutDoneToday ? 'Done' : 'Pending'}
  </Text>
</View>
```

Replace with:
```tsx
<View style={styles.statsCell}>
  <Text
    style={[typography.captionBold, { color: colors.text.secondary, marginBottom: spacing.xs }]}
    numberOfLines={1}
    adjustsFontSizeToFit
  >
    Workout
  </Text>
  <Text style={{ fontSize: 20 }}>{workoutDoneToday ? '✅' : '⏳'}</Text>
  <Text
    style={[typography.caption, { color: workoutDoneToday ? colors.accent.success : colors.text.muted }]}
    numberOfLines={1}
    adjustsFontSizeToFit
  >
    {workoutDoneToday ? 'Done' : 'Pending'}
  </Text>
</View>
```

Also update the `StatsCell` component (around line 916) to add `numberOfLines={1} adjustsFontSizeToFit` to its value Text:

Find the `StatsCell` component and update the logged value text:
```tsx
// Before:
<Text style={[typography.statSmall, { color: colors.text.primary }]}>
  {logged}
</Text>
// After:
<Text
  style={[typography.statSmall, { color: colors.text.primary }]}
  numberOfLines={1}
  adjustsFontSizeToFit
>
  {logged}
</Text>
```

- [ ] **Step 3: Verify — open home screen, confirm all 4 stat cells (Calories, Protein, Water, Workout) are fully visible and not clipped. Open an exercise detail page, confirm "Add to Workout" button spans full width.**

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/app/\(tabs\)/fitness/exercise-detail.tsx apps/mobile/app/\(tabs\)/dashboard.tsx
git commit -m "fix: remove paddingRight:84 overflow in exercise detail; fix Today's Stats text clipping"
```

---

## Task 5: Calorie burn — connect completed workouts to nutrition

**Files:**
- Modify: `apps/mobile/app/(tabs)/fitness/workout-player.tsx`
- Modify: `apps/mobile/stores/nutritionStore.ts`

When a workout completes, estimate calories burned and log it to the nutrition store so it appears in daily calorie totals. Formula: `caloriesBurned = Math.round(totalVolume * 0.05 + durationMinutes * 5)`. This is a rough but reasonable estimate (5 kcal per minute of active lifting + 0.05 kcal per lb of volume moved). Store as a `nutrition_logs` entry with `meal_type = 'exercise'` and negative calories (calories burned, not consumed). Display on workout summary.

### 5a: Add `logCaloriesBurned` action to nutritionStore

- [ ] **Step 1: Add `logCaloriesBurned` to NutritionActions interface in `nutritionStore.ts`**

Find the `NutritionActions` interface (around line 52) and add:
```typescript
logCaloriesBurned: (calories: number, workoutName: string) => Promise<void>;
```

- [ ] **Step 2: Implement `logCaloriesBurned` in the store**

In the store implementation (after `clearError: () => set({ error: null }),`), add:

```typescript
logCaloriesBurned: async (calories, workoutName) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('nutrition_logs').insert({
      user_id: user.id,
      food_name: `Workout: ${workoutName}`,
      meal_type: 'exercise',
      calories: -Math.abs(calories),
      protein: 0,
      carbs: 0,
      fat: 0,
      quantity: 1,
      source: 'manual',
      logged_at: new Date().toISOString(),
    });
  } catch {
    // Non-fatal — calorie burn logging should never block workout completion
  }
},
```

### 5b: Call logCaloriesBurned on workout completion

- [ ] **Step 3: Import `useNutritionStore` in `workout-player.tsx`**

Add to the imports (after `import { useWorkout } from '@hooks/useWorkout';`):
```typescript
import { useNutritionStore } from '@stores/nutritionStore';
```

- [ ] **Step 4: Get `logCaloriesBurned` from the store**

In the component body, after the `useWorkout()` destructure (around line 71):
```typescript
const logCaloriesBurned = useNutritionStore((s) => s.logCaloriesBurned);
```

- [ ] **Step 5: Call `logCaloriesBurned` in `handleFinishWithMood`**

In `handleFinishWithMood` (around line 311), after `await completeWorkout()` and before `router.replace(...)`:

```typescript
// Calculate and log calories burned
const durationMinutes = Math.round(elapsedSeconds / 60);
const estimatedCalories = Math.round(totalVolume * 0.05 + durationMinutes * 5);
if (estimatedCalories > 0) {
  await logCaloriesBurned(estimatedCalories, activeSession?.name ?? 'Workout');
}
```

- [ ] **Step 6: Verify — complete a workout with at least one set logged. Open the Nutrition tab. Confirm a "Workout: Workout" entry appears in today's log with negative calories. Confirm the daily calorie total decreases by the burned amount.**

- [ ] **Step 7: Commit**

```bash
git add apps/mobile/stores/nutritionStore.ts apps/mobile/app/\(tabs\)/fitness/workout-player.tsx
git commit -m "feat: log estimated calories burned to nutrition store on workout completion"
```

---

## Self-Review

**Spec coverage check:**
- ✅ "Nothing will add to exercise library" → Task 1 fixes Add to Workout bug
- ✅ "Timer immediately starts" → Task 2 adds manual start/pause
- ✅ "Spot to enter reps, lbs" → Already exists in SetLogger; Task 1 makes it reachable by fixing the add flow; Task 3 adds the always-visible Add Exercise button
- ✅ "Options cut off on sides" → Task 4 removes paddingRight:84 and fixes statsCell clipping
- ✅ "Connected to health — calories burned" → Task 5 logs burn to nutrition

**Placeholder scan:** None found.

**Type consistency:**
- `Exercise` type used in Task 1 matches the import already in workout-player.tsx (`import type { Exercise, WorkoutTemplateExercise } from '@app-types/database'`)
- `logCaloriesBurned` signature consistent between Task 5 Steps 1 and 2
- `useNutritionStore` import path matches existing usage in the codebase (`@stores/nutritionStore`)
