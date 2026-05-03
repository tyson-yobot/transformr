# Prompt 05: Coachmark Expansion (7 New Screen Tours)

**ADD/FIX ONLY. NEVER REMOVE. NEVER DOWNGRADE. NEVER CHANGE UI STYLING WITHOUT EXPLICIT INSTRUCTION.**

## File-Locking Note
This prompt modifies `apps/mobile/constants/coachmarkSteps.ts` and adds `ref` props + `Coachmark` renders to 7 screen files. Each screen modification is independent.

## Governance Files
Read before starting: `CLAUDE.md`, `SOUL.md`, `ASSET-MANIFEST.md`, `LESSONS-LEARNED.md`, `ARCHITECTURE-DECISIONS.md`.

## Objective
Add first-run coachmark tours to 7 high-traffic screens that currently have no guided onboarding.

## Current State
`constants/coachmarkSteps.ts` defines tours for 5 screens: dashboard, workoutPlayer, nutrition, goals, business. These use the `Coachmark` component (`components/ui/Coachmark.tsx`) which stores "seen" state via MMKV.

## Required Changes

### 1. Add New Keys and Content to coachmarkSteps.ts

Add to `COACHMARK_KEYS`:
```typescript
sleep:           'sleep_v1',
mood:            'mood_v1',
addFood:         'add_food_v1',
mealCamera:      'meal_camera_v1',
painTracker:     'pain_tracker_v1',
dashboardBuilder:'dashboard_builder_v1',
stakeGoals:      'stake_goals_v1',
```

Add to `COACHMARK_CONTENT`:

```typescript
sleep: [
  {
    title: 'Log Your Sleep',
    body: 'Tap the button to record last night\'s bedtime, wake time, and quality. Use the time picker wheels to set times quickly.',
    position: 'below',
  },
  {
    title: 'Sleep Quality Stars',
    body: 'Rate how restored you feel. This directly affects your readiness score and today\'s AI coaching.',
    position: 'below',
  },
  {
    title: 'AI Sleep Recommendations',
    body: 'After 5+ sleep logs, your AI coach identifies patterns and suggests optimizations specific to your data.',
    position: 'above',
  },
],
mood: [
  {
    title: 'Drag the Sliders',
    body: 'Set your mood, energy, stress, and motivation levels by dragging each slider. This takes 10 seconds and feeds your readiness score.',
    position: 'below',
  },
  {
    title: 'Context Matters',
    body: 'Select when you\'re logging (morning, midday, evening, post-workout). Context helps your AI coach detect time-of-day patterns.',
    position: 'above',
  },
],
addFood: [
  {
    title: 'Search or Scan',
    body: 'Type a food name to search 3M+ items. Or use the camera/barcode icons in the header for faster logging.',
    position: 'below',
  },
  {
    title: 'Batch Logging',
    body: 'Tap "Add & Continue" to queue multiple items, then "Log All" to save them in one batch. Saves time for full meals.',
    position: 'above',
  },
],
mealCamera: [
  {
    title: 'Frame Your Food',
    body: 'Center all food items in the frame. Good lighting and a clear view of everything dramatically improves accuracy.',
    position: 'below',
  },
  {
    title: 'Review Estimates',
    body: 'Toggle items on or off, adjust quantities, and check the confidence badge before logging. You can always edit after.',
    position: 'above',
  },
],
painTracker: [
  {
    title: 'Tap the Body Map',
    body: 'Tap the area where you feel pain or soreness. Your AI coach uses this to adjust workout recommendations and flag injury risk.',
    position: 'below',
  },
  {
    title: 'Pain Scale',
    body: '1-3 is normal training soreness. 4-6 means reduce load. 7-10 means rest and consult a professional.',
    position: 'above',
  },
],
dashboardBuilder: [
  {
    title: 'Drag to Reorder',
    body: 'Press and hold any widget, then drag it to change its position on your Dashboard. Put the metrics you check most at the top.',
    position: 'below',
  },
  {
    title: 'Toggle Visibility',
    body: 'Tap the eye icon to show or hide a widget. Hidden widgets still track data, they just won\'t appear on your Dashboard.',
    position: 'above',
  },
],
stakeGoals: [
  {
    title: 'Put Money on It',
    body: 'Set a goal, a deadline, and a dollar amount. Hit the goal and your money is returned. Miss it and it goes to charity.',
    position: 'below',
  },
  {
    title: 'Evaluation Dots',
    body: 'Each dot represents one evaluation period. Green = passed, red = missed. Your pass rate determines your stake return.',
    position: 'above',
  },
],
```

### 2. Add Coachmark Integration to Each Screen

For each of the 7 screens, apply the same pattern used in dashboard.tsx:

1. Import `Coachmark`, `CoachmarkStep`, `COACHMARK_KEYS`, `COACHMARK_CONTENT`
2. Add `useRef<View>(null)` for each step target
3. Add `useState<CoachmarkStep[]>([])` for steps
4. Add `measureCoachmarks` callback using `ref.current?.measure()`
5. Attach refs to target components via `ref={...}` and `onLayout={measureCoachmarks}`
6. Render `<Coachmark screenKey={COACHMARK_KEYS.xxx} steps={coachmarkSteps} />` at the end of the ScrollView

### Screen Files to Modify
- `app/(tabs)/goals/sleep.tsx`
- `app/(tabs)/goals/mood.tsx`
- `app/(tabs)/nutrition/add-food.tsx`
- `app/(tabs)/nutrition/meal-camera.tsx`
- `app/(tabs)/fitness/pain-tracker.tsx`
- `app/(tabs)/profile/dashboard-builder.tsx`
- `app/(tabs)/goals/stake-goals.tsx`

## Verification Gates
- [ ] All 7 new coachmark tours appear on first visit to each screen
- [ ] Coachmarks dismiss correctly and don't reappear on revisit
- [ ] Existing 5 coachmark tours (dashboard, workoutPlayer, nutrition, goals, business) unchanged
- [ ] No existing component layout or styling changed
- [ ] Each ref target element still renders correctly
- [ ] `npx tsc --noEmit` passes with 0 errors
- [ ] No removed imports or require() statements

## Stores Touched
NONE.
