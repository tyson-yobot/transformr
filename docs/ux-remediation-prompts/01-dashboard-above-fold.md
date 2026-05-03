# Prompt 01: Dashboard Above-Fold Restructure

**ADD/FIX ONLY. NEVER REMOVE. NEVER DOWNGRADE. NEVER CHANGE UI STYLING WITHOUT EXPLICIT INSTRUCTION.**

## File-Locking Note
This prompt modifies ONLY `apps/mobile/app/(tabs)/dashboard.tsx`. No other file should be touched. If another Claude Code session is editing this file, STOP and wait.

## Governance Files
Read before starting: `CLAUDE.md`, `SOUL.md`, `ASSET-MANIFEST.md`, `LESSONS-LEARNED.md`, `ARCHITECTURE-DECISIONS.md`.

## Objective
Restructure the dashboard scroll order so that the 8 most important metrics are visible above the fold on a 390x844pt viewport (iPhone 12) without any scroll.

## Current State
The dashboard at `apps/mobile/app/(tabs)/dashboard.tsx` renders components in this order:
1. Greeting (~40pt)
2. Quick Actions (3 tiles, ~72pt)
3. Accountability Card (conditional, ~140pt)
4. WeatherCard (~80pt)
5. AIInsightCard (~100pt)
6. PredictionAlert (conditional, ~80pt)
7. CountdownCard (~80pt)
8. ActiveChallengeCard (conditional)
9. QuickStatsRow (streak, workouts, calories, readiness) (~60pt)
10. Today's Stats card (cal/protein/water/workout grid)
11. Top Streaks
12. Today's Plan
13. Partner card
14. Weight Trend
15. Revenue
16. Recent Achievements

Key metrics (streak, readiness, today's plan, macros, habits remaining) are all below the fold.

## Required Changes

### 1. Add Day Score + Day Count to Greeting Header
After the greeting text and before the gradient bar, add a subtitle line:
```
{dayOfWeek}, {month} {day}  ·  Day {dayCount}  ·  Score {dayScore}
```
- `dayCount`: days since profile.created_at (or since first goal start_date)
- `dayScore`: compute as `Math.round((habitCompletionRate * 40) + (nutritionAdherenceRate * 30) + (readinessNormalized * 30))` where:
  - `habitCompletionRate` = todayCompletions.length / max(habits.filter(active).length, 1)
  - `nutritionAdherenceRate` = min(caloriesToday / (profile?.daily_calorie_target ?? 2000), 1)
  - `readinessNormalized` = (readinessScore ?? 50) / 100

### 2. Move QuickStatsRow UP to position 2 (right after greeting)
Move the QuickStatsRow render block (currently at line ~802) to immediately after the greeting Animated.View block (after line 548). This places streak, workouts, calories, and readiness immediately visible without scroll.

### 3. Add Weight Delta to QuickStatsRow
Add a 5th stat to the quickStats array: Weight Delta vs Goal.
```typescript
{
  icon: <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: colors.dim.cyan, alignItems: 'center', justifyContent: 'center' }}>
    <Icon3D name="scale" size={22} />
  </View>,
  label: 'Weight',
  valueNode: <MonoText variant="monoCaption" color={weightDeltaColor}>{weightDeltaText}</MonoText>,
  value: weightDeltaText,
  glowColor: weightDeltaColor,
  accentColor: weightDeltaColor,
}
```
Where:
- `weightDelta = (profile?.current_weight ?? 0) - (profile?.goal_weight ?? 0)`
- `weightDeltaText = weightDelta > 0 ? `+${weightDelta.toFixed(1)}` : weightDelta.toFixed(1)` + ' lbs'
- `weightDeltaColor = Math.abs(weightDelta) < 1 ? colors.accent.success : colors.text.secondary`

### 4. Move Today's Plan card UP to position 3 (after QuickStatsRow)
Move the Today's Plan card render block (currently at line ~904-946) to after the QuickStatsRow.

### 5. Add Water Progress and Habits Remaining to Today's Plan
Add two more PlanRow entries to the Today's Plan card:
```tsx
<PlanRow
  icon="water"
  iconColor={colors.accent.cyan}
  iconNode={<Icon3D name="water" size={24} />}
  label="Water"
  detail={`${Math.round(waterOzToday)} / ${profile?.daily_water_target_oz ?? 64} oz`}
  done={waterOzToday >= (profile?.daily_water_target_oz ?? 64)}
  mono
/>
```

### 6. Inline ActiveChallengeCard inside Today's Plan (conditional)
If activeEnrollment exists, render a compact challenge row at the bottom of Today's Plan card instead of a separate full card below.

### 7. Move WeatherCard BELOW the fold
Move WeatherCard from position 4 to after the Today's Stats card. Weather is informational but not action-driving.

### 8. Move AIInsightCard to position 4 (after Today's Plan)
The AI coach card should be the 4th major element, right after Today's Plan.

## Verification Gates
- [ ] All existing components still render (none removed)
- [ ] All store selectors still called (none removed)
- [ ] All navigation actions (router.push) preserved
- [ ] All onPress handlers preserved
- [ ] QuickStatsRow, Today's Plan, and AI card visible above fold on 390x844
- [ ] `npx tsc --noEmit` passes with 0 errors
- [ ] Pull-to-refresh still works
- [ ] DashboardSkeleton still renders during initial load
- [ ] All HelpIcon and Coachmark references preserved
- [ ] No require() or import statements for assets removed

## Stores Touched
NONE. All stores are READ ONLY. No store files are modified.

## Navigation Touched
NONE. No routes changed.
