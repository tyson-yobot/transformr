# TRANSFORMR UI/UX Overhaul Design Spec

## Context

TRANSFORMR is an AI-powered life transformation app (React Native + Expo SDK 52+, TypeScript) with 81 screens, 41 components, 14 Zustand stores, and 28 Edge Functions. The codebase is functionally complete but the visual layer doesn't match the brand kit — wrong hex values throughout, no monospace font enforcement, no Daily Briefing screen, and inconsistent skeleton/animation/accessibility patterns across screens.

This spec defines the overhaul to bring every screen to premium, App Store-featured quality.

---

## Sub-project Decomposition

This overhaul decomposes into 4 sequential sub-projects:

1. **Theme Foundation** — Fix color tokens, add font families, load fonts
2. **Component Library Polish** — Update Card/Button variants, create MonoText, add skeleton layouts
3. **Daily Briefing Screen** — New morning entry point
4. **Screen-Level Polish** — Apply monospace, skeletons, animations, haptics, accessibility across all 81 screens

Each sub-project gets its own PR. Dependencies flow downward (3 depends on 1+2, 4 depends on 1+2).

---

## Sub-project 1: Theme Foundation

### 1A. Color System (`apps/mobile/theme/colors.ts`)

**Strategy: Additive extension.** Keep existing interface keys (`background.secondary`, `background.tertiary`), change their hex values, and add new keys. This avoids breaking 102+ consumer files.

#### Dark Theme Color Changes

| Key | Current | New | Semantic |
|-----|---------|-----|----------|
| `background.primary` | `#0F172A` | `#0C0A15` | Deep Space canvas |
| `background.secondary` | `#1E293B` | `#16122A` | Surface (cards, containers) |
| `background.tertiary` | `#334155` | `#1E1838` | Surface Elevated (modals, sheets) |
| `background.input` | `#1E293B` | `#16122A` | Input backgrounds |
| `text.primary` | `#F8FAFC` | `#F0F0FC` | Headlines, body, values |
| `text.secondary` | `#94A3B8` | `#9B8FC0` | Labels, descriptions |
| `text.muted` | `#64748B` | `#6B5E8A` | Hints, placeholders, disabled |
| `text.inverse` | `#0F172A` | `#0C0A15` | Text on light backgrounds |
| `accent.primary` | `#6366F1` | `#A855F7` | CTAs, active states, progress |
| `accent.secondary` | `#8B5CF6` | `#7E22CE` | Pressed states, heading accents |
| `accent.success` | `#22C55E` | `#10B981` | Completed, positive trends |
| `border.default` | `#334155` | `#2A2344` | Card borders |
| `border.subtle` | `#1E293B` | `#1E1838` | Subtle dividers |
| `border.focus` | `#6366F1` | `#A855F7` | Focus rings |

#### New Keys Added to Dark Theme

**Backgrounds:**
| Key | Value | Purpose |
|-----|-------|---------|
| `background.surface` | `#16122A` | Explicit alias for surface |
| `background.surfaceElevated` | `#1E1838` | Explicit alias for elevated |
| `background.surfaceHover` | `#261F45` | Press/hover states |
| `background.alt` | `#110E20` | Alternating row backgrounds |

**Accents:**
| Key | Value | Purpose |
|-----|-------|---------|
| `accent.cyan` | `#22D3EE` | AI features exclusively |
| `accent.primaryDim` | `rgba(168,85,247,0.12)` | Purple tint backgrounds |
| `accent.cyanDim` | `rgba(34,211,238,0.12)` | AI tint backgrounds |
| `accent.successDim` | `rgba(16,185,129,0.12)` | Success tint backgrounds |
| `accent.warningDim` | `rgba(245,158,11,0.12)` | Warning tint backgrounds |
| `accent.dangerDim` | `rgba(239,68,68,0.12)` | Danger tint backgrounds |
| `accent.fireDim` | `rgba(249,115,22,0.12)` | Streak tint backgrounds |
| `accent.goldDim` | `rgba(234,179,8,0.12)` | Achievement tint backgrounds |
| `accent.pinkDim` | `rgba(236,72,153,0.12)` | Partner tint backgrounds |
| `accent.purpleGlow` | `rgba(168,85,247,0.25)` | Purple glow shadows |

**Borders:**
| Key | Value | Purpose |
|-----|-------|---------|
| `border.glow` | `rgba(168,85,247,0.25)` | Featured card glow border |

#### TypeScript Interface Updates

Extend `BackgroundColors`, `AccentColors`, and `BorderColors` interfaces with the new readonly fields. Existing consumers continue working unchanged — they just get corrected hex values through the same keys.

#### Light Theme

Mirror the dark theme structure with lighter counterparts. Light backgrounds use whites/light grays, accents stay the same, text colors invert. **Deferred to a follow-up PR** — dark mode is the primary experience and all development/testing focuses on dark mode first. Light theme values should maintain the same interface shape but are not blocking for launch.

### 1B. Typography (`apps/mobile/theme/typography.ts`)

**Add font families to all existing variants:**

| Variant Group | Font Family |
|--------------|-------------|
| `hero`, `h1`, `h2`, `h3` | `'Inter-Bold'` / `'Inter-SemiBold'` |
| `body`, `bodyBold`, `caption`, `captionBold`, `tiny` | `'Inter-Regular'` / `'Inter-SemiBold'` |
| `stat`, `statSmall` | `'JetBrainsMono-Bold'` / `'JetBrainsMono-SemiBold'` |

**Add new variants:**

| Variant | Size | Weight | Font | Line Height |
|---------|------|--------|------|-------------|
| `countdown` | 36 | 800 | JetBrainsMono-Bold | 40 |
| `monoBody` | 15 | 400 | JetBrainsMono-Regular | 22 |
| `monoCaption` | 13 | 400 | JetBrainsMono-Regular | 18 |

### 1C. Font Loading (`apps/mobile/app/_layout.tsx`)

**New font assets** in `apps/mobile/assets/fonts/`:
- `Inter-Regular.ttf`
- `Inter-SemiBold.ttf`
- `Inter-Bold.ttf`
- `JetBrainsMono-Regular.ttf`
- `JetBrainsMono-SemiBold.ttf`
- `JetBrainsMono-Bold.ttf`

**Loading:** Use `useFonts` from `expo-font`. Hold splash screen until `fontsLoaded && !authLoading`. Replace the existing `setTimeout(500)` splash hide.

### 1D. Color Utilities (`apps/mobile/utils/colors.ts`)

Update threshold colors in `getReadinessColor`, `getProgressColor`, `getMoodColor` to use brand-correct values. Add `getDimColor(hex: string, opacity?: number)` helper that returns `rgba(r,g,b,0.12)`.

---

## Sub-project 2: Component Library Polish

### 2A. Card Variants (`apps/mobile/components/ui/Card.tsx`)

Extend `CardVariant` from `'default' | 'elevated' | 'outlined'` to include:

**`'featured'` variant** (countdown, active challenge):
- `borderWidth: 1.5`
- `borderColor: colors.border.glow` (`rgba(168,85,247,0.25)`)
- `shadowColor: colors.accent.purpleGlow`
- `shadowOffset: { width: 0, height: 0 }`
- `shadowOpacity: 0.6`
- `shadowRadius: 16`
- `elevation: 8`
- Background: `colors.background.secondary`

**`'ai'` variant** (AI insights, readiness):
- Background: `colors.background.secondary` (solid `#16122A` — avoid `LinearGradient` dependency; use a subtle `borderLeftWidth: 3, borderLeftColor: colors.accent.cyan` accent strip instead for visual distinction)
- `borderWidth: 1`
- `borderColor: rgba(168,85,247,0.15)`
- Absolute-positioned cyan "AI" `Badge` in top-right corner (uses existing `Badge` component with custom color)

### 2B. Button Glow (`apps/mobile/components/ui/Button.tsx`)

Add to `'primary'` variant styles:
```
shadowColor: '#A855F7'
shadowOffset: { width: 0, height: 4 }
shadowOpacity: 0.4
shadowRadius: 12
elevation: 8
```

Fix `'sm'` size `minHeight` from `36` to `44` for touch target compliance.

### 2C. MonoText Component (NEW: `apps/mobile/components/ui/MonoText.tsx`)

Thin wrapper around `Text` that enforces monospace font:
- Props: `children`, `style`, `variant` (defaults to `'monoBody'`), `color`, plus all `TextProps`
- Applies `typography[variant]` with `fontFamily` override
- Used for: weights, calories, streak counts, countdowns, percentages, rep counts, dollars, water ounces

Export from `apps/mobile/components/ui/index.ts`.

### 2D. Skeleton Layouts (NEW: `apps/mobile/components/ui/ScreenSkeleton.tsx`)

Composable skeleton layout templates using the existing `Skeleton` component:

- `DashboardSkeleton`: greeting text + countdown card + stats row + 3 cards
- `ListSkeleton`: header + N rows (for exercises, meals, transactions)
- `DetailSkeleton`: header + chart area + info rows
- `FormSkeleton`: header + input fields (auth, add-food)
- `CardSkeleton`: single card-shaped skeleton

Each accepts optional `style` prop. Used as early-return when `isLoading` is true.

### 2E. Shared Component Updates

| Component | Changes |
|-----------|---------|
| `QuickStatsRow` | Apply `typography.stat`/`monoBody` to numeric values; add `accessibilityLabel` per stat cell |
| `CountdownCard` | Apply monospace to number blocks; add accessibility labels |
| `ProgressBar` | Add `accessibilityRole="progressbar"`, `accessibilityValue` with min/max/now |
| `ProgressRing` | Same accessibility treatment as ProgressBar |
| `Badge` | Ensure minimum 44pt touch target when interactive |
| `Chip` | Ensure minimum 44pt touch target |

---

## Sub-project 3: Daily Briefing Screen

### 3A. Architecture

**New files:**
- `apps/mobile/app/daily-briefing.tsx` — top-level route (outside `(tabs)` = no tab bar)
- `apps/mobile/hooks/useDailyBriefing.ts` — data aggregation hook

**Settings additions** to `apps/mobile/stores/settingsStore.ts`:
- `briefingEnabled: boolean` (default: `true`)
- `lastBriefingDate: string | null` (default: `null`)

### 3B. Navigation Interception (`apps/mobile/app/index.tsx`)

After auth check, before routing to dashboard:
1. Check if `settingsStore.lastBriefingDate !== today`
2. Check if `settingsStore.briefingEnabled !== false`
3. If both true → `router.replace('/daily-briefing')`
4. Otherwise → `router.replace('/(tabs)/dashboard')`

Briefing shows once per day on first app open. User can disable in settings.

### 3C. Screen Layout (5 Sections)

Full-screen `ScrollView` with staggered `FadeInDown` animations (150ms delay between sections).

**Section 1 — Greeting + Countdown**
- Time-aware greeting: "Good morning." / "Good afternoon." / "Good evening."
- Primary countdown in large monospace (`countdown` typography variant, 36px)
- Thin purple progress bar showing percentage elapsed
- Today's date, clean format

Data: `profileStore.profile.display_name`, `goalStore` primary goal, `useCountdown` hook

**Section 2 — Today's Game Plan (horizontal scroll)**
- 3-4 cards in a horizontal `FlatList`:
  - Card 1: Today's workout — name + muscle group icons + duration
  - Card 2: Nutrition target — cal/protein with mini macro ring
  - Card 3: Habits remaining — "6 of 9" with check icons
  - Card 4: Focus goal — "4h deep work" with timer icon
- Each card uses `Card` variant `'default'` with press animation

Data: `workoutStore`, `nutritionStore`, `habitStore`, `goalStore`

**Section 3 — Readiness Score**
- Large `ProgressRing` (size 140) showing readiness score (0-100)
- Color-coded: green (70+), yellow (40-69), red (0-39)
- One-line AI recommendation below

Data: `useReadiness` hook, sleep/mood stores

**Section 4 — AI Motivation**
- `Card` variant `'ai'` with cyan badge
- Data-driven message from user's actual data (not generic quotes):
  - Streak context: "You've hit the gym 4 days straight."
  - PR proximity: "Your bench press is 5 lbs from a PR."
  - Progress tracking: "You've gained 3.2 lbs this month — right on track."
- Loading state: `Skeleton` card while motivation generates
- Fallback: static contextual message if AI call fails

Data: `services/ai/motivation.ts` with store context

**Section 5 — CTA**
- Primary `Button`: "Start your day" with purple glow
- On press: set `lastBriefingDate` to today, `router.replace('/(tabs)/dashboard')`
- Swipe-up gesture also dismisses (FlingGestureHandler with UP direction)
- Ghost button below: "Skip" for quick dismiss

### 3D. Data Hook (`hooks/useDailyBriefing.ts`)

Aggregates data from 7 stores into a single return object:
```typescript
interface DailyBriefingData {
  greeting: string;
  userName: string;
  countdown: { daysRemaining: number; percentElapsed: number; goalTitle: string } | null;
  gamePlan: GamePlanCard[];
  readiness: { score: number; recommendation: string };
  motivation: { message: string; isLoading: boolean };
  todayDate: string;
}
```

---

## Sub-project 4: Screen-Level Polish

### 4A. Batch Strategy

Most polish is pushed to shared layers (theme + components). Per-screen work is the irreducible minimum:
- Add screen-specific `accessibilityLabel` strings to custom Pressables
- Wrap remaining numeric `<Text>` in `MonoText` or mono typography variants
- Replace `ActivityIndicator` with `ScreenSkeleton` (23 screens)
- Add `FadeInDown` stagger animations (26 screens missing them)
- Add `hapticLight()` to `onPress` handlers (25 screens missing)
- Remove hardcoded motivation quotes (5 screens)

### 4B. Priority Order

1. **Tab home screens** (5): Dashboard, Fitness, Nutrition, Goals, Profile
2. **High-interaction screens** (8): Workout Player, Exercise Detail, Add Food, Meal Camera, Barcode Scanner, Challenges, Habit checklist, Sleep
3. **Goals sub-screens** (17): Finance group, Business group, Habits/Journal/Mood/Sleep, Challenge group
4. **Auth + Onboarding** (13): Login, Register, Forgot Password, 9 onboarding screens
5. **Profile sub-screens** (7): Achievements, Dashboard Builder, etc.
6. **Modal/Standalone** (6): Goal Cinema, Trajectory, Weekly Review, Partner screens

### 4C. Per-Screen Typical Diff

After theme + component updates cascade: ~15-40 lines changed per screen, ~15-20 minutes each.

### 4D. Dashboard-Specific Changes (`apps/mobile/app/(tabs)/dashboard.tsx`)

- Remove `MOTIVATION_QUOTES` array and `getDailyQuote()` function
- Replace motivation card with AI insight card using `Card` variant `'ai'` + data from `services/ai/motivation.ts`
- Wrap all numeric values (`currentStreak`, `workoutsThisWeek`, `caloriesToday`, `readinessScore`, revenue amounts) in `MonoText`
- Add `CountdownCard` variant `'featured'` for the primary countdown
- Add skeleton loading state for initial data fetch

### 4E. Accessibility Checklist (per screen)

- Every `Pressable` / `TouchableOpacity` has `accessibilityLabel`
- Every `Pressable` has `accessibilityRole="button"`
- Every `Toggle` has `accessibilityRole="switch"` with state
- Every screen title has `accessibilityRole="header"`
- Every `ProgressBar` / `ProgressRing` has `accessibilityRole="progressbar"` with min/max/now
- All images have `accessibilityLabel` descriptions
- Touch targets >= 44pt on all interactive elements

---

## Design Principles Applied

| Principle | Implementation |
|-----------|---------------|
| Dark mode first | `#0C0A15` canvas everywhere, light mode secondary |
| Monospace on every number | `MonoText` component + mono typography variants |
| Progressive disclosure | Cards show key metric first, expand on tap |
| Motion with purpose | Spring physics on interactive elements, FadeInDown stagger on load, scale(0.97) on press |
| Skeleton everything | `ScreenSkeleton` templates, no ActivityIndicator, no blank screens |
| Accessibility non-negotiable | 44pt targets, VoiceOver labels, Dynamic Type support, 4.5:1 contrast |

## Anti-Patterns Prevented

- No white/light backgrounds as default
- No proportional fonts on numbers
- No blank loading screens
- No hidden back buttons
- No >3 taps to log workout/food/water
- No generic quotes (data-driven only)
- No errors without recovery actions
- No sharp corners (0px radius)
- No >2 accent colors per card

---

## Verification

### Automated
- Grep for `ActivityIndicator` in `app/` = 0 hits
- Grep for `MOTIVATION_QUOTES` = 0 hits
- Every screen imports `react-native-reanimated`

### Manual (per screen)
- Skeleton loading visible on slow network
- VoiceOver swipe-through announces every interactive element
- All numeric text renders in monospace
- Haptic feedback on every interaction
- Touch targets >= 44pt
- FadeInDown animation on entry

### Quality Gate
"If I showed this to someone who uses WHOOP, Strava, and Calm daily, would they say this feels like a premium app they'd pay for?"
