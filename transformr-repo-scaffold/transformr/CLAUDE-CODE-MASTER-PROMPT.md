# TRANSFORMR — Master Build Prompt for Claude Code
## SENIOR ENGINEER DIRECTIVE: Build, Wire, Ship.

---

## CONTEXT: READ BEFORE TOUCHING ANY CODE

You are building **TRANSFORMR**, a React Native / Expo mobile app for iOS and Android.
The full product specification lives in `TRANSFORMR-BLUEPRINT.md` in this repo — **read it in its entirety before writing a single line of code.** It contains the complete database schema, all 35 features, every screen specification, the design system, Edge Function specs, seed data requirements, and the 135-step execution plan.

### Current State of the Repo
The repo at `C:\dev\transformr` contains:
- ✅ Full directory structure (70+ directories created)
- ✅ Config files: `package.json` (root + mobile), `tsconfig.json`, `app.json`, `eas.json`, `.eslintrc.js`, `.prettierrc`, `.gitignore`, `.nvmrc`, `.env.example`, `supabase/config.toml`, CI workflow
- ❌ **ZERO source code files** — no .tsx, no .ts, no .sql migrations, no Edge Functions, no seed data
- ❌ No dependencies installed yet
- ❌ No Supabase project linked yet
- ❌ Nothing runs, nothing compiles, nothing renders

**Your job is to take this from an empty scaffold to a 100% complete, fully functional, App Store / Google Play ready application.**

---

## HARD RULES — VIOLATING ANY OF THESE IS UNACCEPTABLE

1. **Node 20.19.4** — Enforced in `.nvmrc`. Do not deviate. Run `nvm use` before any commands.
2. **TypeScript strict mode** — Zero `any` types. Zero `@ts-ignore`. Zero `as any` casts. Full type safety everywhere. Generate Supabase types from the schema.
3. **No stubs, no placeholders, no "coming soon"** — Every screen must be fully functional. Every button must do something. Every route must resolve. If a screen exists in the file structure, it must render real UI with real data bindings.
4. **No workarounds** — Do not hack around problems. Fix root causes. Write production code.
5. **Offline-first** — Workout logging, meal logging, habit tracking, and water tracking MUST work without internet. Use MMKV for local cache. Queue writes and sync when connection returns.
6. **Dark mode is the default theme** — Light mode is a toggle. The dark color palette from the blueprint is the primary experience.
7. **Every screen must have proper navigation** — Back buttons on every pushed screen. No dead ends. No screens the user can't leave. Tab navigation for main sections. Stack navigation within each tab.
8. **All commands must start with `cd C:\dev\transformr`** or the appropriate subdirectory. Never assume the working directory.

---

## EXECUTION ORDER — FOLLOW THIS EXACTLY

### STEP 0: Environment Verification
```
cd C:\dev\transformr
node --version          # Must be 20.19.4
nvm use                 # If not already
npm --version
```

### STEP 1: Install All Dependencies
```
cd C:\dev\transformr
npm install

cd C:\dev\transformr\apps\mobile
npm install
```
If any dependency fails to install, resolve it immediately. Do not skip.

### STEP 2: Supabase Setup
```
cd C:\dev\transformr
supabase login
supabase projects create transformr-prod --org-id <ORG_ID> --db-password <GENERATE_SECURE> --region us-west-1
supabase link --project-ref <PROJECT_REF>
```
- After linking, create all Storage buckets: `progress-photos`, `form-check-videos`, `meal-photos`, `avatars`, `vision-board`, `social-content`
- Enable Realtime on: `workout_sessions`, `workout_sets`, `live_workout_sync`, `partner_nudges`
- Enable Auth providers: Email/Password, Apple Sign-In, Google Sign-In
- Set Edge Function secrets: `ANTHROPIC_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

### STEP 3: Database Migrations
Write and run ALL 23 migration files as specified in the blueprint Section 4. Every table, every column, every constraint, every index, every RLS policy. The schema in the blueprint is the source of truth.

After migrations, run:
```
cd C:\dev\transformr
supabase gen types typescript --project-id <PROJECT_REF> > apps/mobile/types/database.ts
```
This generates TypeScript types from the live schema. These types are used EVERYWHERE — never manually define a type that should come from the database.

### STEP 4: Seed Data
Write `supabase/seed.sql` containing:
- **100+ exercises** with full metadata (name, category, muscle_groups[], equipment, difficulty, instructions, tips, common_mistakes, is_compound). Cover: chest (12+), back (12+), shoulders (10+), biceps (8+), triceps (8+), legs (15+), glutes (6+), abs (10+), cardio (8+), compound (10+), stretching/mobility (10+).
- **100+ foods** with full nutrition data (name, brand, serving_size, serving_unit, calories, protein, carbs, fat, fiber, sugar, sodium). Include bulk-friendly staples, common proteins, carb sources, fats, and 10+ pre-built shakes.
- **10+ saved meal templates** (Morning Bulk Shake, Post-Workout Bowl, Easy Gainer Snack, etc.) with items linked to the foods table.
- **4 workout program templates** with full exercise assignments: Push/Pull/Legs (6-day), Upper/Lower (4-day), Full Body (3-day), Couples Workout (1-day).
- **75+ achievement definitions** across all categories (fitness, nutrition, body, business, finance, consistency, partner, community, mindset, learning) with tier assignments (bronze, silver, gold, diamond).
- **Pre-seeded business milestones** for Construktr: First Paying Customer, $1K MRR, $5K MRR, $10K MRR, 10 Customers, 50 Customers, 100 Customers, $25K MRR, $50K MRR, $83.3K MRR ($1M ARR), $1M Cumulative Revenue.
- **Default habits** for User A: Sleep 6+ hours, Eat 2800+ calories, Hit 155g+ protein, Drink 100oz water, Go to the gym, 4hr focused Construktr work, Take creatine, Nightly check-in, No 24+ hour work sessions.

Run: `cd C:\dev\transformr && supabase db seed`

### STEP 5: Design System + Theme
Build the complete design system in `apps/mobile/theme/`:
- `colors.ts` — Full dark and light palette as specified in the blueprint Section 5. Export a `useColors()` hook that respects the theme toggle.
- `typography.ts` — All text styles (hero, h1, h2, h3, body, bodyBold, caption, captionBold, stat, statSmall, tiny).
- `spacing.ts` — Spacing scale (xs through xxxl) and borderRadius scale.
- `index.ts` — ThemeProvider wrapping the entire app with context for dark/light mode toggle.

### STEP 6: UI Primitives
Build every component in `apps/mobile/components/ui/`. Each must:
- Accept typed props (no `any`)
- Support dark and light themes via the theme context
- Include proper accessibility labels (`accessibilityLabel`, `accessibilityRole`, `accessibilityHint`)
- Have minimum 44pt touch targets on all interactive elements
- Use `react-native-reanimated` for any animations

**Required components:**
`Button.tsx`, `Card.tsx`, `Input.tsx`, `Badge.tsx`, `ProgressRing.tsx`, `ProgressBar.tsx`, `Slider.tsx`, `Toggle.tsx`, `Modal.tsx`, `BottomSheet.tsx`, `Skeleton.tsx`, `Toast.tsx`, `Avatar.tsx`, `Chip.tsx`, `Countdown.tsx`, `Timer.tsx`, `BodyMap.tsx`, `DraggableGrid.tsx`

### STEP 7: Supabase Client + Auth
- `apps/mobile/services/supabase.ts` — Initialize Supabase client with AsyncStorage for session persistence. Must handle token refresh, offline detection, and reconnection.
- `apps/mobile/hooks/useAuth.ts` — Full auth hook: signIn, signUp, signOut, resetPassword, signInWithApple, signInWithGoogle, session state, loading state, error state.
- `apps/mobile/stores/authStore.ts` — Zustand store for auth state.

### STEP 8: Navigation Architecture
This is CRITICAL. The navigation must be flawless.

**Root Layout** (`apps/mobile/app/_layout.tsx`):
- Wraps everything in: ThemeProvider → QueryClientProvider → AuthGate
- If not authenticated → show `(auth)` routes
- If authenticated but not onboarded → show `(auth)/onboarding` routes
- If authenticated and onboarded → show `(tabs)` routes

**Auth Stack** (`apps/mobile/app/(auth)/_layout.tsx`):
- Stack navigator with screens: `login`, `register`, `forgot-password`
- Stack into `onboarding/` flow (9 screens, sequential, with progress indicator)
- Back buttons on every screen except login (first screen) and onboarding welcome (first onboarding screen)

**Tab Navigator** (`apps/mobile/app/(tabs)/_layout.tsx`):
- 5 tabs: Dashboard, Fitness, Nutrition, Goals, Profile
- Icons + labels on each tab
- Badge indicators where relevant (unread nudges on Profile, etc.)
- Tab bar styled to match the dark theme

**Within each tab — Stack navigators:**
Every tab must have its own stack for pushing detail screens. Users must ALWAYS be able to go back. Never trap a user on a screen without a back button or swipe-back gesture.

```
Dashboard Tab:
  dashboard.tsx (home)
  → pushes to: trajectory.tsx, weekly-review.tsx, goal-cinema.tsx

Fitness Tab:
  fitness/index.tsx (fitness home)
  → fitness/workout-player.tsx (active workout — full screen, hide tabs)
  → fitness/workout-summary.tsx (post-workout — back to fitness home)
  → fitness/exercises.tsx → fitness/exercise-detail.tsx
  → fitness/progress.tsx
  → fitness/programs.tsx
  → fitness/form-check.tsx
  → fitness/pain-tracker.tsx
  → fitness/mobility.tsx

Nutrition Tab:
  nutrition/index.tsx (daily view)
  → nutrition/add-food.tsx (search + manual add)
  → nutrition/meal-camera.tsx (AI camera)
  → nutrition/barcode-scanner.tsx
  → nutrition/menu-scanner.tsx
  → nutrition/saved-meals.tsx
  → nutrition/meal-plans.tsx
  → nutrition/meal-prep.tsx
  → nutrition/grocery-list.tsx
  → nutrition/supplements.tsx
  → nutrition/analytics.tsx

Goals Tab:
  goals/index.tsx (goals dashboard)
  → goals/habits.tsx (habit tracker + streak calendar)
  → goals/sleep.tsx
  → goals/mood.tsx
  → goals/journal.tsx
  → goals/focus-mode.tsx (Pomodoro timer)
  → goals/vision-board.tsx
  → goals/skills.tsx (books, courses)
  → goals/challenges.tsx (community)
  → goals/stake-goals.tsx
  → goals/business/index.tsx (business dashboard)
  → goals/business/revenue.tsx
  → goals/business/customers.tsx
  → goals/business/milestones.tsx
  → goals/finance/index.tsx (personal finance)
  → goals/finance/transactions.tsx
  → goals/finance/budgets.tsx
  → goals/finance/net-worth.tsx

Profile Tab:
  profile/index.tsx (settings hub)
  → profile/partner.tsx (partner management + linking)
  → profile/achievements.tsx (badge showcase)
  → profile/dashboard-builder.tsx (drag-and-drop)
  → profile/notifications-settings.tsx
  → profile/nfc-setup.tsx
  → profile/integrations.tsx (Spotify, Stripe, Watch)
  → profile/data-export.tsx
  → profile/about.tsx

Partner Screens (modal stack, accessible from dashboard or profile):
  partner/dashboard.tsx (side-by-side stats)
  partner/live-workout.tsx (real-time sync)
  partner/challenges.tsx
  partner/nudge.tsx
```

**NAVIGATION RULES:**
- Every pushed screen MUST have a back button (left arrow or "< Back") in the header
- The workout player hides the tab bar (full-screen immersive experience) and shows a prominent "End Workout" button
- Modals use `presentation: 'modal'` and have an "X" close button or swipe-to-dismiss
- Deep links must resolve: `transformr://workout/start`, `transformr://nutrition/add`, etc.
- Back gestures (swipe from left edge on iOS) must work on every stack screen

### STEP 9: Build Every Screen — IN ORDER

Follow the 13-phase execution plan from the blueprint (Section 12, Steps 15–135). Build each screen with:

1. **Real data bindings** — Every screen fetches from Supabase via React Query hooks. No hardcoded mock data in production screens. Use skeleton loading states while data loads.
2. **Full CRUD** — If a screen shows data, it also lets users create, update, and delete that data. Swipe-to-delete on list items. Edit buttons on detail views. Confirmation modals before destructive actions.
3. **Form validation** — Every input has validation. Show inline errors. Disable submit buttons until forms are valid. Handle edge cases (negative numbers, future dates for past events, empty strings, etc.).
4. **Error handling** — Every API call wrapped in try/catch. Show toast notifications for errors. Never crash. Never show a blank screen. If offline, show cached data with an "Offline" indicator.
5. **Loading states** — Skeleton components while data loads. Pull-to-refresh on all list/scroll views. Infinite scroll pagination on long lists (exercise library, food search, transaction history).
6. **Empty states** — When a list has no data, show a friendly empty state with an icon, message, and a CTA button ("Log your first workout", "Add your first meal", etc.). Never show a blank white/dark screen.
7. **Haptic feedback** — `expo-haptics` on: button presses (light), PR achievements (heavy), streak milestones (medium), toggle switches (selection), pull-to-refresh (light), errors (warning).
8. **Animations** — `react-native-reanimated` for: screen transitions (shared element where possible), card press effects (scale 0.98), progress ring fills (animated on mount), achievement unlock (Lottie explosion), PR celebration (confetti), streak fire (pulse animation), list item add/remove (layout animation).

### STEP 10: AI Integration
Build ALL AI service files in `apps/mobile/services/ai/`. Each service:
- Calls Anthropic Claude API (model: `claude-sonnet-4-20250514`)
- Includes full user context in the system prompt: user's goals, current weight, goal weight, countdown date, last 7 days of workout/nutrition/sleep/mood data, current streaks, business revenue data
- Handles API errors gracefully (rate limits, timeouts, network failures)
- Caches responses where appropriate (daily briefing cached for the day, weekly report cached for the week)
- Returns typed responses (define response types in `types/ai.ts`)

**AI services to build:**
- `coach.ts` — Daily morning briefing + evening reflection
- `mealCamera.ts` — Send photo to Claude Vision, receive food identification + macro estimates
- `formCheck.ts` — Send exercise video frames to Claude Vision, receive form feedback
- `menuScanner.ts` — Send menu photo to Claude Vision, receive macro-optimized recommendations
- `progressPhoto.ts` — Send progress photos to Claude Vision, receive body composition analysis
- `narrator.ts` — Generate workout narration text, feed to `expo-speech` TTS
- `trajectory.ts` — Calculate two-future projections based on current trends vs targets
- `journaling.ts` — Generate personalized journal prompts based on today's data
- `motivation.ts` — Generate context-aware motivational messages using real user data
- `supplement.ts` — Analyze user data and recommend supplements with evidence-based reasoning
- `correlation.ts` — Cross-analyze fitness + business data, surface correlations
- `adaptive.ts` — Analyze workout history, detect plateaus, generate program adjustments
- `groceryList.ts` — Generate weekly grocery list from meal plan + macro gaps + budget
- `mealPrep.ts` — Generate batch cook plan with container portioning for couples
- `sleepOptimizer.ts` — Analyze sleep patterns, generate bedtime recommendations

### STEP 11: Supabase Edge Functions
Build ALL 26 Edge Functions in `supabase/functions/`. Each function:
- Written in TypeScript (Deno runtime)
- Has proper error handling and logging
- Uses the Supabase service role key for database access
- Returns structured JSON responses

**Critical Edge Functions:**
- `daily-reminder/index.ts` — Cron-triggered, sends push notifications based on user's notification preferences and what they've logged today
- `streak-calculator/index.ts` — Nightly cron, calculates streaks for all users, awards streak shields, checks for broken streaks
- `achievement-evaluator/index.ts` — Triggered after workout/nutrition/habit inserts, checks all unearned achievements
- `pr-detection/index.ts` — Triggered after workout_sets insert, compares to personal_records, creates new PR if beaten
- `readiness-score/index.ts` — Called each morning, aggregates sleep + soreness + stress + training load → score
- `ai-weekly-report/index.ts` — Sunday cron, aggregates week's data, calls Claude for narrative summary, stores in weekly_reviews
- `stake-evaluator/index.ts` — Evaluates stake goal criteria at the configured frequency, charges Stripe if failed
- `stripe-webhook/index.ts` — Receives Stripe webhook events, auto-creates revenue_logs entries

### STEP 12: Push Notifications
- Register for push notifications during onboarding (Step 8 of onboarding flow)
- Store `expo_push_token` in profiles table
- Implement notification handler in root layout (handle foreground, background, and killed-state notifications)
- Deep link from notification tap to the relevant screen
- All notification types from the blueprint's notification table (Section 4.9)

### STEP 13: Offline Support
- Use MMKV for fast local key-value storage
- Cache on first load: user profile, today's workout template, today's nutrition logs, habit list, active goals, exercise library (first 50), food favorites (last 20)
- When offline: allow full workout logging, meal logging, water tracking, habit completion — store in MMKV offline queue
- On reconnection: flush offline queue to Supabase in order, handle conflicts (last-write-wins), show sync indicator

### STEP 14: Testing
- Unit tests for ALL calculation functions: BMR calculator, TDEE calculator, macro calculator, streak logic, PR detection, readiness score algorithm, day score algorithm, revenue projections, weight projections
- Integration tests for: auth flow (register → onboarding → dashboard), workout flow (start → log sets → finish → summary), nutrition flow (add food → log meal → check macros)
- All tests must pass before any build

### STEP 15: App Store Readiness
- Generate app icons using Expo's icon generation (1024x1024 source icon required)
- Generate splash screen (centered logo on #0F172A background)
- Write `privacy-policy.html` and `terms-of-service.html` in `docs/`
- Ensure all permission strings in `app.json` are descriptive and App Store compliant
- Set `expo.ios.config.usesNonExemptEncryption: false` (already done)
- Verify all Expo plugins are properly configured
- Run: `cd C:\dev\transformr\apps\mobile && eas build --platform all --profile production`
- Run: `cd C:\dev\transformr\apps\mobile && eas submit --platform ios && eas submit --platform android`

---

## SCREEN-BY-SCREEN COMPLETION CHECKLIST

Every screen below must be fully implemented. Check each one as you complete it.

### Auth Screens
- [ ] `login.tsx` — Email/password login, Apple Sign-In button, Google Sign-In button, "Forgot Password" link, "Create Account" link. Validates email format and non-empty password. Shows loading spinner during auth. Handles wrong password, account not found, network errors gracefully.
- [ ] `register.tsx` — Email, password, confirm password. Password strength indicator. Terms of service checkbox with link. Back button to login. Validates password match, minimum 8 chars, email format.
- [ ] `forgot-password.tsx` — Email input, "Send Reset Link" button. Success confirmation message. Back button to login.

### Onboarding Screens (Sequential flow with progress bar)
- [ ] `onboarding/welcome.tsx` — App logo, tagline, "Get Started" button, "I have an invite code" link for partner linking
- [ ] `onboarding/profile.tsx` — Name, email (pre-filled), avatar photo picker, date of birth, gender selector, height (ft/in picker), timezone auto-detected
- [ ] `onboarding/goals.tsx` — Goal direction toggle (Gain/Lose/Maintain), target weight slider, primary countdown setup (title, date, emoji), multi-select: Body, Business, Habits
- [ ] `onboarding/fitness.tsx` — Activity level selector, gym access question, training experience (Beginner/Intermediate/Advanced), preferred training days picker, auto-generates workout program
- [ ] `onboarding/nutrition.tsx` — Auto-calculated daily targets displayed (BMR × activity + surplus/deficit), editable fields for calories/protein/carbs/fat, dietary restrictions multi-select
- [ ] `onboarding/business.tsx` — Optional business goal toggle, business name, type, current stage, revenue goal + deadline, current MRR. Skippable.
- [ ] `onboarding/partner.tsx` — "Want an accountability partner?" Generate invite code / Enter invite code. Set sharing preferences. Skip option.
- [ ] `onboarding/notifications.tsx` — Pre-configured notification schedule with toggles for each type. Request notification permissions.
- [ ] `onboarding/ready.tsx` — Summary card of all goals. Countdown preview. "Let's Go" button → navigate to dashboard.

### Main Tab Screens
- [ ] `dashboard.tsx` — Countdown hero card (glow border), readiness score card, quick stats row (weight, streak, sleep, cals %), today's nutrition macro rings with AI macro gap alert, today's plan card (workout + habits checklist), partner card with nudge/reaction buttons, weight trend sparkline. Pull-to-refresh. All data from Supabase with skeleton loading.
- [ ] `fitness/index.tsx` — Weight progress bar (current → goal), this week's workout schedule grid, recent PRs list, AI trajectory simulator preview (two futures side-by-side), "Log Weight" floating button
- [ ] `fitness/workout-player.tsx` — FULL SCREEN (hide tabs). Exercise name + targets at top. Current set indicator. Weight + reps input fields. Previous performance "ghost" overlay. Rest timer with countdown + progress bar + haptic on zero. Add/skip/swap exercise buttons. Running duration. PR auto-detection with celebration animation + haptic. Superset grouping. Quick notes per set. "Finish Workout" button → summary. **Back button / "End Workout" always visible.**
- [ ] `fitness/workout-summary.tsx` — Total duration, total volume, exercises completed, new PRs (with trophy animation), mood before vs after, comparison to last similar workout, "Share with Partner" button. Navigate back to fitness home.
- [ ] `fitness/exercises.tsx` — Searchable exercise library. Filter by muscle group, equipment, difficulty. Tap → exercise-detail. "Add Custom Exercise" button.
- [ ] `fitness/exercise-detail.tsx` — Exercise name, instructions, tips, common mistakes, muscle groups, equipment, video link. Performance history chart (weight over time). PR history. Back button.
- [ ] `fitness/progress.tsx` — Weight graph (1W/1M/3M/6M/1Y/ALL timeframes). Body measurements comparison. Progress photos grid with side-by-side comparison tool. Strength progress per exercise.
- [ ] `fitness/programs.tsx` — Pre-built programs list. Tap to preview. "Activate Program" button. AI program adjustment suggestions.
- [ ] `fitness/form-check.tsx` — Camera view for recording a set. "Analyze Form" button. AI feedback display with frame-by-frame notes.
- [ ] `fitness/pain-tracker.tsx` — Interactive body map (tap body parts). Pain level slider (1-10). Pain type selector. History log. AI pattern detection.
- [ ] `fitness/mobility.tsx` — AI-generated mobility routine based on last workout. Timed holds with haptic cues. Exercise list with instructions.
- [ ] `nutrition/index.tsx` — Calorie + macro progress rings. Quick-action buttons (Camera, Search, Barcode, Voice). Water tracker with quick-add. Supplement checklist. Meal timeline (breakfast through shake) with logged items or "Add" buttons.
- [ ] `nutrition/add-food.tsx` — Search bar with results from food database. Recent foods. Frequent foods. Manual entry form. Serving size multiplier. Meal type selector. Back button.
- [ ] `nutrition/meal-camera.tsx` — Camera view with shutter button. AI analysis overlay showing identified foods + estimated macros. "Confirm + Log" or "Edit" buttons. Confidence score display.
- [ ] `nutrition/barcode-scanner.tsx` — Camera view with barcode overlay guide. Auto-scan. Results from OpenFoodFacts API. Edit before logging. Back button.
- [ ] `nutrition/menu-scanner.tsx` — Camera view. Capture menu photo. AI overlay highlighting best choices for current macro targets. Tap item to log.
- [ ] `nutrition/saved-meals.tsx` — List of saved meals. Tap to quick-log (one tap = log entire meal). Create/edit saved meals. Share with partner toggle. Back button.
- [ ] `nutrition/meal-plans.tsx` — Pre-built meal plan templates (3000 Cal Clean Bulk, Easy Gainer, Meal Prep Sunday, Couple's Plan). Tap to preview. Activate for the week.
- [ ] `nutrition/meal-prep.tsx` — AI-generated weekly prep plan. Batch cooking instructions with timers. Container portioning guide. Couples mode (different portions per person). Linked grocery list.
- [ ] `nutrition/grocery-list.tsx` — AI-generated weekly grocery list. Organized by aisle. Checkable items. Estimated total cost. "Regenerate" button.
- [ ] `nutrition/supplements.tsx` — Active supplements list with dosage + timing. Today's supplement checklist. AI recommendations. Add/edit/remove. Back button.
- [ ] `nutrition/analytics.tsx` — Weekly/monthly macro averages. Calorie trend graph. Protein consistency chart. Correlation insights.
- [ ] `goals/index.tsx` — Active goals as cards with progress bars. Shared goals section. Completed goals archive. "Add Goal" FAB.
- [ ] `goals/habits.tsx` — Today's habits as checkable cards. Streak count per habit. GitHub-style calendar heatmap. Weekly/monthly rates. "Don't break the chain" visual.
- [ ] `goals/sleep.tsx` — Log bedtime + wake time (time wheel picker). Sleep quality rating. Sleep trend graph. Average this week. AI sleep recommendation.
- [ ] `goals/mood.tsx` — Quick mood check-in (1-tap slider). Mood trend chart over time. Correlation insights with sleep/exercise/food.
- [ ] `goals/journal.tsx` — Today's AI-generated prompt. Text entry area. Wins/struggles/gratitude arrays. AI response. Past entries searchable. Monthly letter.
- [ ] `goals/focus-mode.tsx` — Pomodoro timer with configurable duration. Task description. Distraction counter. Session history. Daily/weekly totals. Progress toward 4hr daily target.
- [ ] `goals/vision-board.tsx` — Image grid upload. Category tags. Linked goals. "Goal Cinema" button (30-sec auto-generated recap video).
- [ ] `goals/skills.tsx` — Books: title, author, status (reading/completed), pages, rating, key takeaways. Courses: title, platform, progress %, certificate. AI book recommendations.
- [ ] `goals/challenges.tsx` — Active community challenges. Leaderboard. Join challenge. Create custom challenge. Partner challenges section.
- [ ] `goals/stake-goals.tsx` — Stake a goal with real money (Stripe). Choose amount, frequency, charity/partner. Active stakes. Evaluation history.
- [ ] `goals/business/index.tsx` — MRR display + trend chart. Cumulative revenue → $1M progress bar. Customer count. Churn rate. ARR projection. "At current pace, you'll hit $1M by [date]".
- [ ] `goals/business/revenue.tsx` — Add revenue entry. Revenue timeline list. Filter by month/type. Stripe auto-import status.
- [ ] `goals/business/customers.tsx` — Customer list with status, MRR, plan tier. Add/edit customer. Lifecycle tracking.
- [ ] `goals/business/milestones.tsx` — Visual milestone roadmap. Pre-seeded + custom milestones. ETA based on growth rate. Celebration animations.
- [ ] `goals/finance/index.tsx` — Accounts overview. Total assets/liabilities. Net worth with trend chart. Monthly income vs expenses.
- [ ] `goals/finance/transactions.tsx` — Transaction list. Add income/expense. Category filter. Recurring transactions.
- [ ] `goals/finance/budgets.tsx` — Budget categories with monthly limits. Spending bars. Over/under indicators.
- [ ] `goals/finance/net-worth.tsx` — Net worth trend chart. Snapshot history. Business equity included.
- [ ] `profile/index.tsx` — Avatar, name, member since date. Settings menu list: Settings, Achievements, Dashboard Builder, NFC Tags, Integrations, Data Export, Partner Settings, About. Each item navigates to its screen. Logout button at bottom.
- [ ] `profile/partner.tsx` — Partner info + status. Invite code display/entry. Sharing preferences toggles. Unlink option with confirmation.
- [ ] `profile/achievements.tsx` — Earned badges grid. Unearned badges (dimmed). Tap for detail. Progress toward next achievement.
- [ ] `profile/dashboard-builder.tsx` — Drag-and-drop widget grid. Available widgets panel. Save/load layouts. Reset to default.
- [ ] `profile/notifications-settings.tsx` — Toggle for each notification type. Time pickers for scheduled notifications.
- [ ] `profile/nfc-setup.tsx` — Paired NFC tags list. "Pair New Tag" (NFC scan). Assign action to tag. Test tag.
- [ ] `profile/integrations.tsx` — Spotify connect/disconnect. Stripe connect. Apple Watch pair status. Apple Health sync toggle.
- [ ] `profile/data-export.tsx` — Export options: CSV, JSON, PDF report. Date range picker. Download/share.
- [ ] `profile/about.tsx` — App version, Automate AI LLC branding, privacy policy link, terms of service link, support email.

### Partner Screens (Modal presentation)
- [ ] `partner/dashboard.tsx` — Side-by-side comparison: weight, streaks, workouts this week, macros today. Activity feed. Joint streak.
- [ ] `partner/live-workout.tsx` — Real-time Supabase Realtime subscription. Both users' sets appear live. Race indicators. Shared celebration on PRs.
- [ ] `partner/challenges.tsx` — Active partner challenges. Create new challenge. History.
- [ ] `partner/nudge.tsx` — Pre-built nudge messages. Custom message input. Emoji reactions. Send confirmation.

### Standalone Screens
- [ ] `trajectory.tsx` — Full-screen AI trajectory simulator. Two diverging path charts (on-track vs off-track). Weight projection, revenue projection, habit projection. Updates with real data.
- [ ] `weekly-review.tsx` — AI-generated weekly report. Grades for each category (A-F). Week-over-week comparisons. Top wins, areas to improve, next week goals.
- [ ] `goal-cinema.tsx` — Auto-generated 30-second video from the week's data: PRs hit, weight change, streak count, meals logged, revenue earned. Shareable.

---

## UX FLOW VERIFICATION

After building, verify these complete user journeys work end-to-end:

### Journey 1: First-Time User
Open app → Login screen → Register → Onboarding (9 screens) → Dashboard loads with countdown, empty states for nutrition/workouts, default habits → User can immediately start logging.

### Journey 2: Morning Routine
Open app → Dashboard shows readiness score → See today's plan → Tap "Start Workout" → Workout player opens (tabs hidden) → Log sets with ghost mode → PR detected → Celebration animation → Finish workout → Summary screen → Back button → Dashboard updated with workout stats.

### Journey 3: Meal Logging
Dashboard → Tap Nutrition tab → See today's macros → Tap camera icon → Take photo of food → AI identifies items → Confirm + adjust → Logged → Macro rings update → "953 calories remaining" warning updates → Back to nutrition home.

### Journey 4: Partner Interaction
Dashboard → See partner card → Tap reaction emoji → Danyell gets push notification → Dashboard → Tap partner card → Partner dashboard (modal) → Side-by-side stats → Close modal → Back to dashboard.

### Journey 5: Evening Check-In
Receive push notification "Time for your nightly check-in" → Tap → Journal screen opens → AI prompt displayed → Write entry → See AI response → Rate mood → Check habits completed → Sleep log → Close app.

### Journey 6: Weekly Review
Sunday push notification → Tap → Weekly review screen → See grades, stats, AI narrative → Read recommendations → Set next week goals → Share with partner → Close.

---

## PERFORMANCE REQUIREMENTS

- **App launch to interactive dashboard**: < 2 seconds on iPhone 12+
- **Screen transitions**: < 300ms with fluid animations
- **Logging a workout set**: < 3 taps, < 2 seconds
- **Logging a food item** (from search): < 4 taps, < 3 seconds
- **AI meal camera analysis**: < 5 seconds from photo to result
- **Pull-to-refresh**: Data updates within 1 second
- **Offline mode**: Zero-latency for cached operations
- **List scrolling**: 60fps, no frame drops, use FlatList with `getItemLayout` for fixed-height items and `windowSize` optimization

---

## FINAL VERIFICATION BEFORE SUBMISSION

Run through this checklist before building for production:

- [ ] `cd C:\dev\transformr\apps\mobile && npx tsc --noEmit` — Zero TypeScript errors
- [ ] `cd C:\dev\transformr\apps\mobile && npx eslint .` — Zero lint errors
- [ ] `cd C:\dev\transformr\apps\mobile && npx jest` — All tests pass
- [ ] Every screen renders without crashing
- [ ] Every screen has a back button or close button (except dashboard/root tabs)
- [ ] Every form validates inputs and shows errors
- [ ] Every empty state shows a helpful message + CTA
- [ ] Every loading state shows a skeleton, not a blank screen
- [ ] Every API error shows a toast, never crashes
- [ ] Dark mode works on every screen
- [ ] Light mode works on every screen
- [ ] Pull-to-refresh works on every scrollable screen
- [ ] Tab navigation works with no lag
- [ ] Keyboard dismisses properly on all input screens
- [ ] Keyboard avoidance works (inputs don't hide behind keyboard)
- [ ] No text truncation — all text visible or properly ellipsized
- [ ] All images have loading placeholders
- [ ] App works fully offline for core features (workout, meals, habits, water)
- [ ] Push notifications received and deep-linked correctly
- [ ] Haptic feedback fires on all specified interactions
- [ ] Animations are smooth (60fps, no jank)
- [ ] Memory usage stable (no leaks on repeated navigation)
- [ ] App icon and splash screen render correctly
- [ ] Privacy policy and terms of service accessible from profile/about
- [ ] All Supabase RLS policies active and tested
- [ ] All Edge Functions deployed and responding
- [ ] Supabase Storage buckets created with correct policies
- [ ] EAS build succeeds for both iOS and Android
- [ ] App runs correctly on iOS simulator AND Android emulator
- [ ] No console.log statements in production code (only console.warn/error)

---

## COMMIT STRATEGY

Commit after completing each phase. Use conventional commit messages:
```
feat: implement auth flow with Apple/Google sign-in
feat: build complete workout player with ghost mode and PR detection
feat: implement AI meal camera with Claude Vision
fix: resolve keyboard avoidance on nutrition add-food screen
perf: optimize exercise library list with virtualization
test: add unit tests for BMR and macro calculations
chore: configure EAS production build profiles
```

Push to `dev` branch. Create PR to `main` only for production releases.

---

**START NOW. Begin with Step 0 (environment verification), then Step 1 (install dependencies), and work through every step in order. Do not skip ahead. Do not leave any screen unfinished. Build TRANSFORMR.**
