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
