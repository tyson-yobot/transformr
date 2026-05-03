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
