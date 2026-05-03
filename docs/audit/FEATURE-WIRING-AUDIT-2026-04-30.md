# TRANSFORMR — Feature wiring audit

Generated: f7d17bd34fff5cb6fbbb6b65d1583ec8aef6f3e5 committed Thu Apr 30 04:54:47 2026 -0700
Audit type: Read-only, no fixes applied
Scope: All 35 features
Branch: dev

---

## Executive summary

| Classification | Count |
|----------------|-------|
| Working        | 16 / 35 |
| Scaffolded     | 18 / 35 |
| Stubbed        |  1 / 35 |
| Missing        |  0 / 35 |

Industry-first status: 2 / 6 fully Working (4 are Scaffolded with field-name mismatches or dead wiring)
P0 gaps: 0
P1 gaps: 6
P2 gaps: 13
P3 gaps: 4

### Top 10 most-broken features (ranked by user impact x severity)

1. **AI meal camera [IF]** — Scaffolded (P1) — Field name mismatch: service sends `image` but Edge Function reads `image_base64` → guaranteed 400 error. Also: Edge Function ignores `userContext` so AI responses would be generic even if the call succeeded.
2. **AI form check via video** — Scaffolded (P1) — No video-to-frames extraction exists. Service sends raw video base64 but Edge Function expects `frames_base64[]` array of JPEG images. Feature is non-functional.
3. **Spotify workout integration** ��� Scaffolded (P2) — All 5+ Spotify Edge Functions referenced by client services DO NOT EXIST in supabase/functions. Every call returns 404.
4. **AI adaptive programming** — Scaffolded (P2) — Service + Edge Function fully built but NEVER called from any UI screen. The programs screen has no adaptive functionality.
5. **Body-business correlation [IF]** — Scaffolded (P2) — `analyzeCorrelations()` service is dead code (never imported). Health ROI screen shows health metrics only — no business data cross-referenced. Two Edge Functions (`ai-correlation`, `ai-health-roi`) built but not wired to UI.
6. **AI life trajectory simulator [IF]** — Scaffolded (P2) — AI Edge Function response is discarded. Chart is client-side math. Action items are hardcoded. Revenue domain uses hardcoded `current: 5000, target: 25000`.
7. **Context-aware motivation engine** — Scaffolded (P2) — Full service + Edge Function built. Zero consumers anywhere in the app. Neither `getMotivation()` nor `getDailyQuote()` are called from any screen.
8. **AI sleep optimizer** — Scaffolded (P2) — `getSleepRecommendations()` service function exists but is NEVER called from any UI or store. The `ai_sleep_recommendation` DB column is never populated.
9. **Auto-generated social content** — Scaffolded (P3) — Service + Edge Function fully built. No UI anywhere calls these functions. No share button, share modal, or social content preview screen exists.
10. **Dashboard builder** — Scaffolded (P2) — No drag-and-drop gesture. Layout saves to DB but the main dashboard screen DOES NOT consume the saved layout to render dynamic widgets.

### Critical cross-cutting pattern: Service-to-Edge-Function field name mismatches

Features 1, 3, 5, 6, 8, and 16 share the same bug pattern: the mobile service sends one set of field names but the Edge Function destructures different names. This causes 400 errors or undefined data at runtime. The services and Edge Functions appear to have been built independently without integration testing.

---

## Codebase metrics (from Phase 0)

| Metric | Count |
|--------|-------|
| Screen files (.tsx in app/) | 103 |
| Component files (.ts/.tsx in components/) | 132 |
| Store files | 21 |
| Service files | 56 |
| Migrations (.sql) | 52 |
| Edge Functions (directories, excl. _shared) | 52 |
| Tables with RLS enabled | 63 |
| RLS policies defined | 67 |
| TypeScript errors | 0 |
| AI services using buildUserAIContext | 21 / 22 |
| Edge Functions with COMPLIANCE_PREAMBLE | 37 |
| Edge Functions invoked from client | 38 |
| Edge Functions NOT invoked from client | 20 |
| Edge Functions cron-scheduled | 3 |

---

## Feature-by-feature audit

---

### Feature 1 — AI meal camera [IF]

Classification: **Scaffolded**
User impact if broken: P1

Chain trace:
- UI: `app/(tabs)/nutrition/meal-camera.tsx:57` — full camera capture UI with CameraView, results display, quantity adjustment, confirm/log flow
- Handler: `handleCapture` at `meal-camera.tsx:81` — calls `cameraRef.current.takePictureAsync`, then `analyzeMealPhoto`
- Service: `services/ai/mealCamera.ts:7` — `analyzeMealPhoto()` converts to base64, builds `userContext` via `buildUserAIContext`, invokes `ai-meal-analysis` Edge Function
- Edge Function: `supabase/functions/ai-meal-analysis/index.ts` (exists: yes)
- System prompt user context: **NO** — the Edge Function prompt is generic ("You are a nutrition analysis AI"). The service sends `userContext` in the body but the Edge Function destructures `{ image_base64, meal_type, dietary_context }` — **the `userContext` field is never read by the Edge Function**.
- User data passed: `userId`, `image` (base64), `mimeType`, `userContext` (from service). Edge Function only uses `image_base64`, `meal_type`, `dietary_context`.
- Persistence: `handleConfirmAll` at line 148 calls `logFood()` from `nutritionStore` for each selected item
- UI feedback: ActionToast "Meal logged" then `router.back()`

Gaps:
1. **CRITICAL field name mismatch**: Service sends `{ image: base64 }` (mealCamera.ts:21) but Edge Function reads `image_base64` (index.ts:40). The photo will be `undefined` on the server side, causing a 400 error ("image_base64 is required").
2. Service sends `userContext` but Edge Function never destructures or uses it. AI responses would be generic, not personalized.
3. Service does not send `meal_type` — Edge Function defaults to "unknown".

Stub-detection: No TODO/FIXME. The field name mismatch is likely an integration bug, not intentional stubbing.

---

### Feature 2 — Ghost mode training [IF]

Classification: **Working**
User impact if broken: P2

Chain trace:
- UI: `app/(tabs)/fitness/workout-player.tsx:1262-1278` — toggle button showing/hiding "previous session" ghost data
- Handler: `setShowGhostOverlay` toggle at line 1264; ghost data fetched via `getGhostData` at line 98
- Store: `stores/workoutStore.ts:225` — `getGhostData(exerciseId)` queries `workout_sets` joined with `workout_sessions` for the most recent completed session's sets
- Component: `components/workout/GhostOverlay.tsx`, `components/cards/GhostCard.tsx`
- DB: `workout_sessions` + `workout_sets` tables (migration 00004)
- Persistence: Read-only (queries historical sets)
- UI feedback: PREV column in set logging view (line 1075-1134) shows ghost weight/reps, up-arrow indicator when beating ghost

Gaps:
- This is a comparison overlay showing previous session data alongside current sets — not a literal animated "ghost" avatar or real-time race visualization.
- Query at line 231-244 fetches up to 20 sets but does not filter by a single session — could mix sets from multiple sessions.

Stub-detection: Clean. Fully wired to real Supabase data.

---

### Feature 3 — AI life trajectory simulator [IF]

Classification: **Scaffolded**
User impact if broken: P2

Chain trace:
- UI: `app/trajectory.tsx:77` — full screen with domain selector (weight/revenue/fitness), two-futures chart, action items, "Re-Simulate with AI" button
- Handler: `handleSimulate` at line 158 — calls `generateTrajectory()` from service
- Service: `services/ai/trajectory.ts:22` — `generateTrajectory()` builds `userContext` via `buildUserAIContext`, invokes `ai-trajectory` Edge Function
- Edge Function: `supabase/functions/ai-trajectory/index.ts` (exists: yes, fully implemented two-future projection)
- System prompt user context: **Partial** — the service sends `userContext` in the body, but the Edge Function destructures `{ current_stats, goals, history, projection_weeks }` and never reads `userContext`.
- Persistence: None — results are not stored
- UI feedback: Chart is client-side generated from `generateProjection()` (line 53-75) — **hardcoded math, not AI output**

Gaps:
1. **AI response is discarded**: `handleSimulate` calls `generateTrajectory()` but does nothing with the returned data. The chart shown to users is entirely client-side calculated using simple eased linear projection.
2. Action items (lines 131-156) are **fully hardcoded** per domain — not AI-generated.
3. Revenue domain uses hardcoded values: `current: 5000, target: 25000` (line 104).
4. Field name mismatch: Service sends `{ ...context, userContext }` but Edge Function reads `{ current_stats, goals, history, projection_weeks }`.

Stub-detection: Hardcoded action items, hardcoded revenue values, AI response discarded.

---

### Feature 4 — Couples live sync workout [IF]

Classification: **Working**
User impact if broken: P2

Chain trace:
- UI: `app/partner/live-workout.tsx:40` — split-view showing user's sets and partner's sets side-by-side, reaction buttons
- Handler: Real-time subscription at line 99-113 via Supabase channel `postgres_changes` on `live_workout_sync` table
- Store: `stores/partnerStore.ts` — partnership data, partner profile
- DB: `live_workout_sync` table (migration 00004), `partnerships` table (migration 00002)
- RLS: `live_workout_sync` has own-data + partner-read policies (migration 00023:149-150)
- Persistence: Sets come from `live_workout_sync` table; reactions stored in `partner_nudges` table (line 128)
- UI feedback: Live updating set list for both users, emoji reactions with haptic feedback

Gaps:
- "Start Live Workout" button (line 206) only sets local state `isActive = true` — does not create a DB session or notify the partner.
- No mechanism to write current user's sets to `live_workout_sync` from this screen — it only reads. Workout player would need to write to this table.
- Realtime subscription at line 101-113 listens for ALL inserts without filtering by session.

Stub-detection: Clean.

---

### Feature 5 — AI form check via video

Classification: **Scaffolded**
User impact if broken: P1

Chain trace:
- UI: `app/(tabs)/fitness/form-check.tsx:48` — full multi-phase flow: setup, countdown, recording, review, analyzing, results
- Handler: `handleSubmitForAnalysis` at line 139 — calls `analyzeExerciseForm()` from service
- Service: `services/ai/formCheck.ts:7` — `analyzeExerciseForm()` converts video to base64, builds `userContext`, invokes `ai-form-check`
- Edge Function: `supabase/functions/ai-form-check/index.ts` (exists: yes)
- System prompt user context: **NO** — `userContext` sent but never read by Edge Function (destructures `{ frames_base64, exercise_name, user_experience }`)

Gaps:
1. **CRITICAL format mismatch**: Service sends `{ video: base64string }` (single base64 of entire video) but Edge Function expects `{ frames_base64: string[] }` (array of JPEG frame images). The Edge Function returns 400 ("frames_base64 array is required with at least one frame").
2. **No frame extraction logic exists** — the service sends raw video file as base64, but Claude's vision API expects images, not video files. A frame extraction step is completely missing.
3. `userContext` sent but ignored by Edge Function.
4. Results not persisted to any database table.

Stub-detection: No TODO/FIXME, but format mismatch makes this feature non-functional end-to-end.

---

### Feature 6 — AI progress photo analysis

Classification: **Scaffolded**
User impact if broken: P2

Chain trace:
- UI: `app/(tabs)/fitness/progress-photos.tsx:60` — gallery with angle selector, capture, timeline, "Analyze Progress" button
- Handler: `handleAnalyze` at line 144 — calls `analyzeProgressPhotos()` from service
- Service: `services/ai/progressPhoto.ts:7` — converts photos to base64, builds `userContext`, invokes `ai-progress-photo`
- Edge Function: `supabase/functions/ai-progress-photo/index.ts` (exists: yes)
- System prompt user context: Partial — includes `previous_analysis`, `current_weight`, `height` but ignores `userContext`
- Photos uploaded to Supabase Storage `progress-photos` bucket

Gaps:
1. **Field name mismatch**: Service sends `{ photos: { front, side, back } }` but Edge Function reads `front_image_base64`, `side_image_base64`, `back_image_base64`. All image fields will be `undefined`, causing 400 error.
2. Service does not send `current_weight` or `height` which Edge Function expects.
3. `handleAnalyze` passes remote Supabase Storage URLs to `analyzeProgressPhotos`, but service calls `FileSystem.readAsStringAsync(uri)` on remote URLs — may fail since expo-file-system reads local files.

Stub-detection: Clean code but field mismatch and URL-vs-local-path issue make this non-functional.

---

### Feature 7 — Daily readiness score

Classification: **Working**
User impact if broken: P0

Chain trace:
- UI: `app/(tabs)/dashboard.tsx:302-306` — readiness score displayed as percentage with color coding (green >=75, amber >=50, red <50)
- Handler: Dashboard `loadDashboardData` at line 297 invokes `readiness-score` Edge Function
- Service: `services/calculations/readiness.ts:27` — `calculateReadinessScore()` local calculation also available
- Edge Function: `supabase/functions/readiness-score/index.ts` (exists: yes) — queries `sleep_logs`, `mood_logs`, `workout_sessions`, `daily_checkins`, upserts to `readiness_scores` table
- DB: `readiness_scores` table (migration 00007), RLS policy at migration 00023:188
- Persistence: Edge Function upserts result to `readiness_scores` table (line 189-201)

Gaps:
- Minor field name issue: Dashboard sends `{ userId }` but Edge Function reads `body.user_id`. Falls through to cron path (processes all users) — inefficient but still works.
- Two separate calculation implementations (client-side and server-side) with different formulas.
- `ReadinessCard` component exists but is not used on dashboard — shows simple stat cell only.

Stub-detection: Clean. Both implementations are real calculations with real data.

---

### Feature 8 — AI adaptive programming

Classification: **Scaffolded**
User impact if broken: P2

Chain trace:
- UI: `app/(tabs)/fitness/index.tsx:83` — "Programs" card links to programs screen
- Handler: **None** — no call to `getAdaptiveProgram` found in any screen
- Service: `services/ai/adaptive.ts:36` — `getAdaptiveProgram()` builds `userContext`, invokes `ai-adaptive-program` Edge Function
- Edge Function: `supabase/functions/ai-adaptive-program/index.ts` (exists: yes, fully implemented)

Gaps:
1. **Service is NEVER invoked from any screen.** The programs screen does not import or call `getAdaptiveProgram`.
2. Field name mismatch: Service sends `{ ...context, userContext }` but Edge Function reads `{ current_program, recent_sessions, readiness_score, pain_reports, goals, weeks_on_program }`.
3. No UI exists to display adaptive program results.
4. The "AI-adaptive training blocks" label on the programs card is a description claim without backing implementation.

Stub-detection: Service and Edge Function are complete code, but zero UI integration.

---

### Feature 9 — Apple Watch companion app

Classification: **Scaffolded**
User impact if broken: P3

Chain trace:
- UI: `app/(tabs)/profile/wearables.tsx`, `app/(tabs)/profile/integrations.tsx` — settings screens
- Service: `services/watch.ts` — full Watch Connectivity bridge (workout data, macros, rest timer, streaks, readiness; receive set logs, water logs, workout completion)
- Service: `services/health/appleHealth.ts` — full HealthKit bridge (steps, HR, sleep, weight, calories)
- Hook: `hooks/useHealthSync.ts` — syncs daily health summary to Supabase

Gaps:
- **No watchOS companion app exists.** No Swift/watchOS project, no WKInterfaceController, no Watch app target. The `services/watch.ts` file is a React Native bridge but there is nothing on the watch side.
- `react-native-watch-connectivity` is not in `package.json` — watch.ts uses try/catch fallback to noop stubs.
- HealthKit integration (`appleHealth.ts`) works on iOS but is phone-side, not Watch.

Stub-detection: `watch.ts:4` — "no-op stubs"; `watch.ts:29` — "Module not installed — keep noop stubs"

---

### Feature 10 �� Injury prevention + pain tracker

Classification: **Working**
User impact if broken: P1

Chain trace:
- UI: `app/(tabs)/fitness/pain-tracker.tsx:65` — BodyMap component, pain logging bottom sheet, pain history per body part, trend bars
- Handler: `handleLogPain` at line 122 — inserts to Supabase; `loadPainLogs` at line 89 fetches history
- DB: `pain_logs` table (migration 00004), RLS policy at migration 00023:153
- User data: `body_part`, `pain_level` (1-10), `pain_type` (6 types), `notes`, `logged_at`
- UI feedback: BodyMap heatmap colors per body part (last 7 days), mini trend bar chart, history with timestamps

Gaps:
- **No AI tips component.** The "AI tips" part of the feature spec is absent — this is a data tracker only.
- Pain data could feed into adaptive programming (which accepts `painAreas`) but that feature is also unwired (Feature 8).

Stub-detection: Clean. CRUD operations fully wired.

---

### Feature 11 — Guided mobility + recovery sessions

Classification: **Working** (with hardcoded routines)
User impact if broken: P2

Chain trace:
- UI: `app/(tabs)/fitness/mobility.tsx:78` — routine selection, active routine player with timer, progress bar, exercise list
- Handler: `handleStartRoutine` at line 286, `handleStretchComplete` at line 223
- DB: `mobility_sessions` table (migration 00004), RLS at migration 00023:156
- Persistence: Completed sessions saved at line 250-255

Gaps:
- **Routines are entirely hardcoded** (lines 66-76 stretch library, lines 132-172 three static routines). Two routines are marked `isAiGenerated: true` (lines 145, 161) but they are hardcoded arrays — **misleading label**.
- Comment at line 132: "AI-driven in production" — confirms this is a known placeholder.
- No AI service integration. Not personalized to user's pain data or recent training.

Stub-detection: `isAiGenerated: true` on hardcoded routines is deceptive labeling.

---

### Feature 12 — Body-business correlation engine [IF]

Classification: **Scaffolded**
User impact if broken: P2

Chain trace:
- UI (Health ROI): `app/(tabs)/goals/health-roi.tsx` — full screen with 30/60/90 day window, metric bars, AI narrative
- Handler: `loadReport()` at line 82 calls `computeHealthROIReport()`
- Service (Health ROI): `services/ai/healthRoi.ts:29-153` — fetches REAL data from 5 tables, computes real metrics locally, then calls `ai-chat-coach` Edge Function for narrative (NOT `ai-health-roi`)
- Service (Correlation): `services/ai/correlation.ts:34-45` — `analyzeCorrelations()` exists, invokes `ai-correlation` Edge Function
- Edge Functions: `ai-correlation` (exists, fully built), `ai-health-roi` (exists, fully built)
- Cron: `ai-correlation` runs monthly at 06:00 UTC (migration 00048)

Gaps:
1. **`analyzeCorrelations()` is dead code** — never imported or called from any screen.
2. **`ai-health-roi` Edge Function is orphaned** — exists but mobile client never invokes it. The `healthRoi.ts` service uses `ai-chat-coach` instead.
3. **Health ROI screen shows health metrics only** — despite the feature name "body-business correlation," the screen computes workout/nutrition/sleep/habit metrics but does NOT fetch or display any business metrics. There is no actual cross-domain correlation.
4. Insights screen (`goals/insights.tsx`) shows AI predictions but has no specific body-business correlation logic.

Stub-detection: Clean code — the gap is entirely a wiring problem. Backend fully built, frontend never connected.

---

### Feature 13 — Stake goals [IF]

Classification: **Working**
User impact if broken: P1

Chain trace:
- UI: `app/(tabs)/goals/stake-goals.tsx` — full CRUD with create modal, active stakes, evaluation history dots, pass/fail rates, saved/lost totals
- Handler: `handleCreateStake` at line 133 — inserts to `stake_goals` table, calls `createStakePayment()` if user has `stripe_payment_method_id`
- Service: `services/stripe.ts:18-48` — `createStakePayment()` invokes `stripe-webhook` Edge Function with `create_stake_payment` action
- Edge Function (payment): `supabase/functions/stripe-webhook/index.ts:235-319` — creates PaymentIntent with `capture_method: manual`, real Stripe API calls using `STRIPE_SECRET_KEY`
- Edge Function (evaluator): `supabase/functions/stake-evaluator/index.ts` — cron-triggered daily at 02:00 UTC, evaluates goals, captures or cancels Stripe holds
- DB: `stake_goals`, `stake_evaluations` tables (migration 00018)

Gaps:
1. Stripe env var dependency — if `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` not set, `createStakePayment` returns `{ success: false }`. Stake created without payment hold (graceful degradation).
2. No payment method setup UI in this screen — depends on `stripe_payment_method_id` being pre-set on profile.
3. Possible `amount` variable scope issue in stripe-webhook at line 246.

Stub-detection: Clean. All CRUD is real Supabase operations. Stripe integration uses real API endpoints.

---

### Feature 14 — Personal finance tracker

Classification: **Working**
User impact if broken: P1

Chain trace:
- UI: `app/(tabs)/goals/finance/index.tsx`, `transactions.tsx`, `budgets.tsx`, `net-worth.tsx` — full 4-screen finance section
- Store: `stores/financeStore.ts` — `fetchAccounts` (parallel fetch from 3 tables), `logTransaction` (insert + RPC balance update), `fetchBudgets`
- DB: `finance_accounts`, `finance_transactions`, `budgets`, `net_worth_snapshots` (migration 00009), all with RLS

Gaps:
1. No account creation UI — empty state says "Connect your accounts" but no action button.
2. No transaction deletion/editing — add only.
3. `current_spent` on budgets relies on server-side aggregation, not client.
4. `update_account_balance` RPC — if missing, silently falls back to re-fetch.

Stub-detection: Clean. All data flows through real Supabase queries.

---

### Feature 15 — Business revenue tracker

Classification: **Scaffolded**
User impact if broken: P2

Chain trace:
- UI: `app/(tabs)/goals/business/index.tsx`, `revenue.tsx`, `customers.tsx`, `milestones.tsx` — full 4-screen section
- Store: `stores/businessStore.ts` — `fetchBusinesses`, `createBusiness`, `logRevenue`, `getMonthlyMetrics`
- DB: `businesses`, `revenue_logs`, `expense_logs`, `customers`, `business_milestones` (migration 00008)

Gaps:
1. **No Stripe integration for revenue tracking** — despite the feature description, revenue is entirely manual data entry. `services/stripe.ts` handles subscriptions and stake payments only. No Stripe Connect, no automatic revenue import.
2. No business creation UI on any screen — `createBusiness()` in store but no UI calls it.
3. `customer_count` is a static column, not a live count.
4. Expense logging has no UI despite store fetching `expense_logs`.

Stub-detection: Clean code, but "Stripe integration" aspect is completely absent.

---

### Feature 16 — Restaurant menu scanner

Classification: **Scaffolded**
User impact if broken: P2

Chain trace:
- UI: `app/(tabs)/nutrition/menu-scanner.tsx:57` — camera, results, logging
- Handler: `handleCapture` at line 81 — calls `analyzeMenuPhoto(photo.uri, user.id, restaurantName)`
- Service: `services/ai/mealCamera.ts:31-54` — `analyzeMenuPhoto()` builds UserAIContext, invokes `ai-menu-scan` Edge Function
- Edge Function: `supabase/functions/ai-menu-scan/index.ts` (exists: yes)

Gaps:
1. **CRITICAL field name mismatch**: Client sends `{ image }` (mealCamera.ts:45) but Edge Function expects `{ image_base64 }` (ai-menu-scan/index.ts:40). Base64 data will be `undefined`, triggering 400 error.
2. Response field name mismatch: Edge Function returns `estimated_protein_g`, `estimated_carbs_g`, etc. but client maps from `f.estimated_protein`, `f.estimated_carbs`. Produces all-zero macros.
3. `handleSaveFavorite` (line 167-174) is a stub — shows "Saved!" alert but saves nothing.
4. Edge Function ignores `restaurantName` and `userContext` sent by client.

Stub-detection: `handleSaveFavorite` is a UI stub. Field mismatches make the feature non-functional.

---

### Feature 17 — Barcode food scanner

Classification: **Working**
User impact if broken: P1

Chain trace:
- UI: `app/(tabs)/nutrition/barcode-scanner.tsx:58` ��� camera with barcode overlay, results, quantity adjuster
- Handler: `handleBarcodeScanned` at line 141 triggers `lookupBarcode` at line 83
- API: Open Food Facts at `OPEN_FOOD_FACTS_API/product/{barcode}.json` (line 88-89)
- Persistence: Logged via `logFood()` from `nutritionStore` with `source: 'barcode'`
- UI feedback: Camera → spinner → full nutrition facts with ProgressRings, "not found" state with manual entry fallback

Gaps:
1. `services/barcode.ts` exists with typed `lookupBarcode()` but is NOT used — screen duplicates fetch inline. Code duplication, not functional gap.
2. No USDA fallback — Open Food Facts only.

Stub-detection: Clean. All handlers wired to real actions.

---

### Feature 18 — AI smart grocery lists

Classification: **Scaffolded**
User impact if broken: P2

Chain trace:
- UI: `app/(tabs)/nutrition/grocery-list.tsx:57` — generate button, aisle sections, budget bar, swap suggestions
- Handler: `handleGenerate` at line 116 calls `generateBudgetGroceryList()` with `{ meal_plan: { meals: [] }, budget_override }`
- Service: `services/ai/groceryList.ts:25-38` — invokes `ai-grocery-list` Edge Function
- Edge Function: `supabase/functions/ai-grocery-list/index.ts` (exists: yes, 193 lines)

Gaps:
1. **Meal plan is always empty**: At line 124, `handleGenerate` passes `meal_plan: { meals: [] }`. The `mealsToGroceryInput()` helper in the service exists but is NEVER called. The AI generates a generic grocery list, NOT one derived from the user's meal plan.
2. No persistence — if user leaves, list is gone.
3. Budget loaded from profile but no UI to set it on this screen.

Stub-detection: Empty `meal_plan: { meals: [] }` makes this a generic generator rather than meal-plan-aware.

---

### Feature 19 — Batch cook meal prep planner

Classification: **Working**
User impact if broken: P2

Chain trace:
- UI: `app/(tabs)/nutrition/meal-prep.tsx:58` — tier selector (Good/Better/Best), recipes, budget bar, progress
- Handler: `handleGenerate` at line 125 calls `generateBudgetMealPrepPlan()`
- Service: `services/ai/mealPrep.ts:27-41` — invokes `ai-meal-prep` Edge Function
- Edge Function: `supabase/functions/ai-meal-prep/index.ts` (exists: yes, 252 lines) — `gatherUserContext()` fetches profile, goals, meals (14d), workouts (14d), budget. All injected into system prompt.
- System prompt user context: **Yes** — extensive server-side context gathering
- Persistence: Budget saved to `profiles.weekly_grocery_budget_usd`; generated plan in React state only

Gaps:
1. Plan not persisted to DB — navigating away loses it.
2. Most optional params (`dietary_restrictions`, `meals_per_day`, etc.) never set by UI.

Stub-detection: Clean. Claude API call fully wired.

---

### Feature 20 — AI supplement advisor

Classification: **Working**
User impact if broken: P1

Chain trace:
- UI (main): `app/(tabs)/nutrition/supplements.tsx:113` — supplement management with recommendations
- UI (scanner): `app/(tabs)/fitness/supplement-scanner.tsx:134` — camera-based label scanner
- Service: `services/ai/supplement.ts:32-47` — full CRUD + AI recommendations via `ai-supplement` Edge Function
- Store: `stores/supplementsStore.ts` — manages supplements, today's logs, budget, AI recommendations, interaction warnings
- Edge Functions: `ai-supplement` (348 lines, fetches profile + goals + workouts + meals + sleep + mood + current stack + lab biomarkers), `ai-supplement-scanner` (232 lines)
- System prompt: Explicitly instructs Claude to "Reference the user's REAL data when explaining why a supplement is recommended"

Gaps:
1. Scanner calls Edge Function twice when adding to stack (analysis + save).
2. No auto-trigger of recommendations — user must manually tap Refresh.
3. Scanner writes to `supplements`/`supplement_logs` tables (different from `user_supplements` used by main screen store).

Stub-detection: Clean. Both Edge Functions make real Claude calls with extensive user data.

---

### Feature 21 — AI sleep optimizer

Classification: **Scaffolded**
User impact if broken: P2

Chain trace:
- UI: `app/(tabs)/goals/sleep.tsx` — sleep score, chart, history, AI recommendation card, log modal
- Handler: `handleLogSleep` calls `logSleep` from store; `fetchSleepHistory` loads data
- Service: `services/ai/sleepOptimizer.ts:21` — `getSleepRecommendations()` invokes `ai-sleep-optimizer` Edge Function
- Edge Function: `supabase/functions/ai-sleep-optimizer/index.ts` (exists: yes, full Claude call)
- Store: `stores/sleepStore.ts`
- DB: `sleep_logs` table, RLS policy

Gaps:
1. **`getSleepRecommendations()` is NEVER called** from any UI component or store. Grep confirms it is only defined, never imported elsewhere.
2. Sleep screen reads `ai_sleep_recommendation` from DB column (sleep.tsx:171) but nothing in the app writes to that column or triggers the Edge Function.
3. Field name mismatch: Service sends `SleepContext` fields (`recentSleepLogs`, `workoutTimes`) but Edge Function expects different names (`sleep_logs`, `wake_time_goal`).
4. Sleep logging is manual only — no wearable auto-detection.

Stub-detection: The AI pipeline to populate `ai_sleep_recommendation` is disconnected.

---

### Feature 22 — Mood-performance correlation

Classification: **Scaffolded**
User impact if broken: P2

Chain trace:
- UI: `app/(tabs)/goals/mood.tsx` — mood logger with sliders (mood/energy/stress/motivation), context chips, chart, insights
- Handler: `handleLog` at line 104 calls `logMood` from moodStore
- Service: `services/ai/correlation.ts:34` — `analyzeCorrelations()` invokes `ai-correlation` Edge Function
- Edge Function: `supabase/functions/ai-correlation/index.ts` (exists: yes, fetches 6 tables for cross-domain analysis)
- Store: `stores/moodStore.ts`
- DB: `mood_logs` table, RLS

Gaps:
1. **`analyzeCorrelations()` is NEVER called** from any UI or store. Defined only in `services/ai/correlation.ts`.
2. The "Insights" section on mood screen (lines 130-165) uses **client-side heuristic correlation only** — simple averages comparing high-mood vs low-mood entries. NOT AI.
3. The AI badge on the insights section (line 369) is misleading since these are hardcoded pattern templates, not AI insights.
4. No dedicated correlation visualization screen.

Stub-detection: Client `correlationInsights` are hardcoded pattern templates with threshold logic, falsely badged as AI.

---

### Feature 23 — AI journaling + reflection

Classification: **Working**
User impact if broken: P1

Chain trace:
- UI: `app/(tabs)/goals/journal.tsx` — AI prompt card, main entry, wins/struggles/gratitude/tomorrow fields, tags, past entries
- Handler: `handleSubmit` at line 117 calls `getJournalResponse()` then inserts to `journal_entries`
- Service: `services/ai/journaling.ts:46` — `getJournalResponse()` invokes `ai-journal-prompt` Edge Function
- Edge Function: `supabase/functions/ai-journal-prompt/index.ts` (exists: yes, supports 3 actions: generate_prompt, analyze_entry, coaching_response)
- System prompt: Uses `buildUserAIContext` — full personalization
- DB: `journal_entries`, `monthly_letters` tables (migration 00013)
- UI feedback: AI reflection in purple-bordered card; voice dictation via `VoiceMicButton`

Gaps:
1. **Rotating prompts are static**: `AI_PROMPTS` array (journal.tsx:42-49) has 7 hardcoded prompts selected randomly. The Edge Function has `generate_prompt` action for context-aware prompts but it's never called. The "AI Prompt" badge is misleading for the prompt itself.
2. The post-submit AI reflection (`getJournalResponse`) IS called and works — that part is real AI.
3. Edge Function's `analyze_entry` and `coaching_response` actions never invoked from mobile.

Stub-detection: Static prompt array at journal.tsx:42-49.

---

### Feature 24 — AI vision board + Goal Cinema

Classification: **Scaffolded**
User impact if broken: P3

Chain trace:
- Vision Board: `app/(tabs)/goals/vision-board.tsx` — grid of images, category filter, inspiration slideshow, add modal
  - CRUD: `vision_board_items` table (read + insert)
  - `handlePickFromLibrary` (line 134) opens URL modal — does NOT use expo-image-picker despite it being installed

- Goal Cinema: `app/goal-cinema.tsx` — cinematic slideshow with quotes, stats, countdowns
  - Slides built **client-side** from store data (lines 111-183) — profile weight, goals, weight log photos, hardcoded quotes
  - Edge Function: `supabase/functions/goal-cinema/index.ts` (exists: yes, fully built Claude call) — **NEVER invoked from client**

Gaps:
1. Vision board: No AI content generation. Images from user URLs only.
2. Goal Cinema: `goal-cinema` Edge Function exists and works but is NEVER invoked. Slides are entirely local data + hardcoded quotes.
3. `handlePickFromLibrary` comment: "In production this would use expo-image-picker" — explicit placeholder.

Stub-detection: Hardcoded quotes in goal-cinema.tsx. Image picker is a URL-modal placeholder.

---

### Feature 25 — Deep work focus mode

Classification: **Working**
User impact if broken: P1

Chain trace:
- UI: `app/(tabs)/goals/focus-mode.tsx` — Pomodoro timer with progress ring, task input, category chips, distraction counter, session history, productivity rating modal
- Handler: start/pause/reset at lines 180-198; `handleSaveRating` at line 205 persists to Supabase
- DB: `focus_sessions` table (migration 00012), RLS at migration 00023:220
- Integration: Focus session data included in UserAIContext (context.ts:101-105)

Gaps:
- **DND is visual only**: "Do Not Disturb Active" banner (line 283-299) is just a UI label. No actual notification blocking/suppression code.
- Timer locked to 25-minute Pomodoro — no customization.

Stub-detection: DND banner is cosmetic — no notification suppression.

---

### Feature 26 — Skill + knowledge tracker

Classification: **Working**
User impact if broken: P1

Chain trace:
- UI: `app/(tabs)/goals/skills.tsx` — tabbed interface (skills/books/courses), CRUD modals, progress bars
- DB: `skills`, `books`, `courses` tables (migration 00014), RLS policies
- Persistence: All three tables via Supabase insert

Gaps:
1. **No Update/Delete operations** — Create and Read only. Cannot edit proficiency, update book status/progress, or delete items.
2. **No certifications** despite feature description mentioning them.
3. AI recommendation is NOT real AI — client-side category-to-description mapping (skills.tsx:78-103). The "AI" badge is misleading.

Stub-detection: `categoryMap` at skills.tsx:78-88 is hardcoded, not AI. Badge label "AI" is misleading.

---

### Feature 27 — Context-aware motivation engine

Classification: **Scaffolded**
User impact if broken: P2

Chain trace:
- Service: `services/ai/motivation.ts:21` — `getMotivation()` accepts rich context (mood, streak, workout status, calories, PRs, time of day, habits), invokes `ai-motivation` Edge Function. Also `getDailyQuote()` at line 34.
- Edge Function: `supabase/functions/ai-motivation/index.ts` (exists: yes, 4 motivation types, daily quote mode)
- System prompt: Uses `buildUserAIContext` — personalized

Gaps:
1. **Neither function is called anywhere in the app.** Grep confirms they are only defined in `services/ai/motivation.ts` and referenced in one test file.
2. No screen, notification handler, or dashboard widget invokes them.
3. Field name mismatch between service interface and Edge Function expected body.

Stub-detection: Fully implemented backend with zero frontend consumers.

---

### Feature 28 — Voice command everything

Classification: **Working**
User impact if broken: P1

Chain trace:
- UI: `components/ui/VoiceMicButton.tsx` — floating mic button with pulse animation, tap-to-record/stop
- UI deployed on: `app/(tabs)/fitness/workout-player.tsx`, `nutrition/index.tsx`, `goals/journal.tsx`, `goals/habits.tsx`, `goals/mood.tsx` — **5 screens confirmed**
- Hook: `hooks/useVoice.ts` — wraps recording/transcription/parsing
- Service: `services/voice.ts:168-209` — expo-audio recording, transcription via `transcribe-audio` Edge Function
- Service: `services/voice.ts:64-138` — 24+ command types, local regex fast path
- Service: `services/voice.ts:141-164` — Claude NLU fallback via `ai-voice-command` Edge Function (confidence < 0.85)
- Edge Functions: `transcribe-audio` (OpenAI Whisper-1), `ai-voice-command` (Claude Sonnet NLU)
- System prompt: Context-aware — includes active screen, workout context, nutrition context

Gaps: None critical. Wide command coverage (34 types), dual parsing, real TTS.

Stub-detection: Clean. Full chain is production-wired.

---

### Feature 29 — AI workout narrator

Classification: **Working**
User impact if broken: P2

Chain trace:
- UI: `components/workout/NarratorCard.tsx` — animated card with narration text + rest timer, cyan accent
- Rendered in: `workout-player.tsx:1014-1018`
- Handler: 5 narrator events: workout_start (line 266), midpoint (line 283), set_completed (line 479), pr_detected (line 479), workout_complete (line 585)
- Service: `services/ai/narrator.ts:115-162` — `generateNarration()` calls `workout-narrator` Edge Function
- TTS: `services/ai/narrator.ts:179-187` — wraps `expo-speech Speech.speak()`; workout-player.tsx line 522-527 calls `Speech.speak(narResult.text, { rate: narResult.speechRate })`
- Edge Functions: `workout-narrator/index.ts` (457 lines, fetches readiness + coaching tone), `ai-workout-narrator/index.ts` (5 event types)

Gaps: None. Graceful fallbacks on failure. Readiness-adaptive speech rate (0.85-1.05x).

Stub-detection: Clean.

---

### Feature 30 — Live home screen widgets

Classification: **Scaffolded**
User impact if broken: P3

Chain trace:
- Service: `services/widgets.ts` — 5 widget data types (countdown, macros, streak, readiness, nextWorkout), saves to MMKV
- Edge Function: `supabase/functions/widget-update/index.ts` (exists: yes, 180 lines, upserts to `widget_data` table)

Gaps:
1. Line 39-40: `"// In production, this would also call native widget update APIs via react-native-widget-extension"` — explicit stub acknowledgment
2. `react-native-widget-extension` NOT installed
3. No iOS WidgetKit or Android AppWidget code exists
4. Client-side widget functions are NEVER called from any screen
5. Edge Function is functional but nothing reads `widget_data` table on client or native side

Stub-detection: widgets.ts:39 — explicit "In production" comment.

---

### Feature 31 — NFC + geofence triggers

Classification: **Scaffolded**
User impact if broken: P2

Chain trace (NFC):
- UI: `app/(tabs)/profile/nfc-setup.tsx` — 507-line screen with scan, trigger list, add/delete, test
- Service: `services/nfc.ts` — init/read/write/cleanup, `executeNfcAction()` maps to routes, `fetchUserNfcTriggers()` reads DB
- DB: `nfc_triggers` table (migration 00015), RLS policy

Chain trace (Geofence):
- Hook: `hooks/useGeofence.ts` — fetches geofences, starts monitoring, cleanup
- Service: `services/geofence.ts` — expo-location + TaskManager, background task registered
- DB: `geofence_triggers` table (migration 00015), RLS policy

Gaps:
1. `handleGeofenceEnter`/`handleGeofenceExit` (geofence.ts:87-94) only `console.warn` — no action triggered.
2. `useGeofence` hook exists but is NEVER imported by any screen — never mounted.
3. NFC "Test" button shows Alert only, does not navigate.
4. NFC `react-native-nfc-manager` requires native module that may not be linked.

Stub-detection: geofence.ts:90 — `console.warn(...)` is the entire action handler.

---

### Feature 32 — Auto-generated social content

Classification: **Scaffolded**
User impact if broken: P3

Chain trace:
- Service: `services/socialContent.ts` — `generateSocialContent()` invokes `social-content-gen` Edge Function; `shareContent()` via expo-sharing; caption generators for PR, transformation, weekly
- Edge Function: `supabase/functions/social-content-gen/index.ts` (155 lines, 5 content types)

Gaps:
1. **No UI anywhere calls these functions.** All 5 exported functions are never imported by any screen.
2. No share button, modal, or preview screen in the app.
3. Edge Function generates text only — no image generation despite `imageUrl` in the interface.

Stub-detection: Complete backend, zero UI integration.

---

### Feature 33 — Spotify workout integration

Classification: **Scaffolded**
User impact if broken: P2

Chain trace:
- UI: `app/(tabs)/profile/integrations.tsx` — Spotify connect button with OAuth via expo-web-browser
- Service (primary): `services/spotify.ts` — OAuth + playback (162 lines): connect, disconnect, get tracks, play, pause, skip
- Service (secondary): `services/integrations/spotify.ts` — playlists, BPM generation, status check

Gaps:
1. **ALL Spotify Edge Functions DO NOT EXIST.** No `spotify-oauth`, `spotify-playback`, `spotify-playlists`, `spotify-playlist-tracks`, or `spotify-generate-playlist` in supabase/functions. Every call returns 404.
2. OAuth flow captures auth code via WebBrowser but never passes it to a backend token exchange.
3. No playback UI in workout player.
4. Two separate service files reference different non-existent Edge Functions.

Stub-detection: Services are typed and structured but every backend call targets non-existent Edge Functions.

---

### Feature 34 — Siri + Google Assistant shortcuts

Classification: **Stubbed**
User impact if broken: P3

Chain trace:
- Configuration: `app.json` contains `"com.apple.developer.siri": true`
- Feature gate: `siri_google_shortcuts` → Pro tier
- Implementation: **None** — no Siri shortcut SDK, no Google Assistant intent configs, no shortcut registration code, no setup UI

Gaps: Only entitlement + feature gate + upgrade paywall copy exist. Zero implementation.

Stub-detection: Feature gate with paywall copy exists but zero implementation behind it.

---

### Feature 35 — Drag-and-drop dashboard builder

Classification: **Scaffolded**
User impact if broken: P2

Chain trace:
- UI: `app/(tabs)/profile/dashboard-builder.tsx` — 494 lines, widget list, move up/down arrows, size cycling (S/M/L), visibility toggle, save/reset
- Store: `stores/dashboardStore.ts` — 10 default widgets, fetchLayout/saveLayout/resetToDefault backed by `dashboard_layouts` table
- DB: `dashboard_layouts` table (migration 00016), RLS

Gaps:
1. **No drag-and-drop gesture** — uses up/down arrow buttons, not drag gestures. No `PanGestureHandler`, no `react-native-draggable-flatlist`.
2. **Dashboard screen does NOT consume the layout** — no evidence the home dashboard reads `useDashboardStore` to dynamically render widgets.
3. Widget "types" map to icons but no actual widget renderer components display real data.

Stub-detection: "Drag and drop" appears only as description text at line 185.

---

## Cross-cutting findings

### AI personalization

- AI services using `buildUserAIContext`: **21 / 22** (all except `compliance.ts`)
- `buildUserAIContext` pulls from **14 Supabase tables** in parallel
- Context includes: profile, 7 days of activity across all domains, streaks, PRs, supplement stack, lab markers, business metrics, partner status
- **HOWEVER**: Many Edge Functions **ignore the userContext** sent by services. They destructure only their expected fields and the `userContext` object goes unused. This means the personalization infrastructure exists but many features produce generic output.

### Service-to-Edge-Function field name mismatches

This is the single most impactful cross-cutting bug. 6+ features share it:

| Feature | Service sends | Edge Function expects | Result |
|---------|--------------|----------------------|--------|
| AI meal camera | `image` | `image_base64` | 400 error |
| Menu scanner | `image` | `image_base64` | 400 error |
| AI form check | `video` (single string) | `frames_base64` (array) | 400 error |
| Progress photos | `photos: { front, side, back }` | `front_image_base64`, etc. | 400 error |
| AI trajectory | `{ ...context, userContext }` | `current_stats, goals, history` | Undefined data |
| AI adaptive | `{ ...context, userContext }` | `current_program, recent_sessions` | Undefined data |
| AI sleep | `SleepContext` shape | Different field names | Undefined data |

### Dead service code (fully built but never called from UI)

| Service function | File | Edge Function exists | Called from UI |
|-----------------|------|---------------------|----------------|
| `analyzeCorrelations()` | services/ai/correlation.ts | ai-correlation (yes) | **No** |
| `getSleepRecommendations()` | services/ai/sleepOptimizer.ts | ai-sleep-optimizer (yes) | **No** |
| `getMotivation()` | services/ai/motivation.ts | ai-motivation (yes) | **No** |
| `getDailyQuote()` | services/ai/motivation.ts | ai-motivation (yes) | **No** |
| `getAdaptiveProgram()` | services/ai/adaptive.ts | ai-adaptive-program (yes) | **No** |
| `generateSocialContent()` | services/socialContent.ts | social-content-gen (yes) | **No** |
| `getJournalPrompt()` | services/ai/journaling.ts | ai-journal-prompt (yes) | **No** |

These represent 7 complete AI pipelines (service + Edge Function + Claude integration) that are built, deployed, and billing-ready but have zero UI consumers. Wiring them would require only 1-5 lines of code each.

### Edge Function deployment

| Category | Count |
|----------|-------|
| Functions in repo (excl. _shared) | 52 |
| Functions invoked from client code | 38 |
| Functions NOT invoked from client | 20 |
| Functions cron-scheduled via pg_cron | 3 |
| **Spotify Edge Functions referenced but MISSING** | **5** |

Functions referenced by client but NOT in repo:
- `spotify-oauth` — called from services/spotify.ts
- `spotify-playback` — called from services/spotify.ts
- `spotify-playlists` — called from services/integrations/spotify.ts
- `spotify-playlist-tracks` — called from services/integrations/spotify.ts
- `spotify-generate-playlist` — called from services/integrations/spotify.ts

### Misleading AI badges

Several features display "AI" badges or labels on content that is NOT AI-generated:

| Screen | Element | Actual source |
|--------|---------|---------------|
| mood.tsx | Insights section | Client-side threshold heuristics |
| skills.tsx | Recommendation card | Hardcoded `categoryMap` object |
| mobility.tsx | `isAiGenerated: true` on routines | Hardcoded arrays of stretches |
| journal.tsx | "AI Prompt" badge | Static local array of 7 prompts |

### Database wiring

| Metric | Count |
|--------|-------|
| Tables with RLS enabled | 63 |
| Explicit CREATE POLICY statements | 67 |
| Stores with `.from()` calls | 16 / 21 |
| Total `.from()` calls across stores | 83 |
| Tables referenced but missing | 0 |

### Industry-first features status

| # | Feature | Classification | Key issue |
|---|---------|---------------|-----------|
| 1 | AI meal camera | **Scaffolded** | Field name mismatch breaks the API call |
| 2 | Ghost mode training | **Working** | Comparison view, not race visualization |
| 3 | AI life trajectory simulator | **Scaffolded** | AI response discarded, chart is client-side math |
| 4 | Couples live sync workout | **Working** | Works but start notification + write path unclear |
| 5 | Body-business correlation | **Scaffolded** | Two Edge Functions built, zero UI consumers |
| 6 | Stake goals | **Working** | Real Stripe integration with payment holds |

**2/6 industry-firsts are fully Working.** All 6 have substantial code. The other 4 have complete backends but broken or missing frontend wiring.

---

## Recommendations (read-only — do not act)

### Immediate fixes (< 30 min each, unblock 6+ features)

1. **Fix field name mismatches across 6 AI services** — align service body keys with Edge Function destructuring. Each fix is a 1-3 line change. This unblocks features 1, 5, 6, 8, 16, and partially 3.
2. **Wire 7 dead AI services to their UI screens** — each requires importing the service and adding an `await service()` call on the appropriate handler. Most are 3-5 lines. This activates features 8, 12, 21, 22, 27, 32, and improves 24.
3. **Fix AI trajectory to use AI response** — `handleSimulate` in trajectory.tsx needs to store and render the Edge Function's returned data instead of discarding it.

### Quick wins (< 1 hour each)

4. **Goal Cinema AI wiring** — invoke `goal-cinema` Edge Function instead of building slides client-side.
5. **Geofence action execution** — replace `console.warn` stubs with route navigation or notification dispatch.
6. **Grocery list meal plan wiring** — call `mealsToGroceryInput()` instead of passing empty `{ meals: [] }`.
7. **Remove misleading AI badges** — change labels on mood insights, skill recommendations, mobility routines, and journal prompts to be honest about their source.

### Medium effort (1-4 hours each)

8. **Create 5 Spotify Edge Functions** — `spotify-oauth`, `spotify-playback`, `spotify-playlists`, `spotify-playlist-tracks`, `spotify-generate-playlist`. Service layer is complete.
9. **Dashboard builder drag-and-drop** — replace arrow buttons with `react-native-draggable-flatlist`.
10. **Dashboard layout consumption** — make the main dashboard screen read from `useDashboardStore` to render dynamic widgets.
11. **AI form check frame extraction** — add a video-to-JPEG-frames conversion step before sending to Edge Function.
12. **Skills tracker Update/Delete** — add edit and delete capabilities to complete the CRUD.

### Large effort (> 4 hours)

13. **Apple Watch companion app** — build watchOS app bundle. React Native bridge is ready.
14. **Native home screen widgets** — iOS WidgetKit + Android App Widget implementation.
15. **Siri + Google Assistant shortcuts** — implement SiriKit + App Actions.
16. **Stripe Connect for business revenue** — automatic revenue import instead of manual entry.

### Defer to post-launch

17. Ghost mode "race" visualization (comparison view is functional)
18. Focus mode real DND (cosmetic banner is sufficient for MVP)
19. Certifications tracking for skills
20. Bank/finance API integration (Plaid)

---

## Appendix: Complete classification matrix

| # | Feature | Domain | IF | Classification | Priority | Tier |
|---|---------|--------|----|---------------|----------|------|
| 1 | AI meal camera | Fitness | IF | Scaffolded | P1 | Free |
| 2 | Ghost mode training | Fitness | IF | Working | P2 | Elite |
| 3 | AI trajectory simulator | Fitness | IF | Scaffolded | P2 | Elite |
| 4 | Couples live sync workout | Fitness | IF | Working | P2 | Partners |
| 5 | AI form check video | Fitness | | Scaffolded | P1 | Elite |
| 6 | AI progress photo | Fitness | | Scaffolded | P2 | Elite |
| 7 | Daily readiness score | Fitness | | Working | P0 | Free |
| 8 | AI adaptive programming | Fitness | | Scaffolded | P2 | Pro |
| 9 | Apple Watch companion | Fitness | | Scaffolded | P3 | Elite |
| 10 | Pain tracker | Fitness | | Working | P1 | Pro |
| 11 | Guided mobility | Fitness | | Working | P2 | Pro |
| 12 | Body-business correlation | Business | IF | Scaffolded | P2 | Pro/Elite |
| 13 | Stake goals | Business | IF | Working | P1 | Elite |
| 14 | Personal finance tracker | Business | | Working | P1 | Pro |
| 15 | Business revenue tracker | Business | | Scaffolded | P2 | Pro |
| 16 | Restaurant menu scanner | Nutrition | | Scaffolded | P2 | Pro |
| 17 | Barcode food scanner | Nutrition | | Working | P1 | Free |
| 18 | AI smart grocery lists | Nutrition | | Scaffolded | P2 | Pro |
| 19 | Batch cook meal prep | Nutrition | | Working | P2 | Pro |
| 20 | AI supplement advisor | Nutrition | | Working | P1 | Elite |
| 21 | AI sleep optimizer | Habits | | Scaffolded | P2 | Elite |
| 22 | Mood-performance correlation | Habits | | Scaffolded | P2 | Pro/Elite |
| 23 | AI journaling + reflection | Habits | | Working | P1 | Pro |
| 24 | AI vision board + Goal Cinema | Habits | | Scaffolded | P3 | Elite/Pro |
| 25 | Deep work focus mode | Habits | | Working | P1 | Pro |
| 26 | Skill + knowledge tracker | Habits | | Working | P1 | Pro |
| 27 | Context-aware motivation | Habits | | Scaffolded | P2 | Pro |
| 28 | Voice command everything | System | | Working | P1 | Pro |
| 29 | AI workout narrator | System | | Working | P2 | Pro |
| 30 | Home screen widgets | System | | Scaffolded | P3 | Pro |
| 31 | NFC + geofence triggers | System | | Scaffolded | P2 | Elite |
| 32 | Social content generation | System | | Scaffolded | P3 | Elite |
| 33 | Spotify integration | System | | Scaffolded | P2 | Pro |
| 34 | Siri + Google shortcuts | System | | Stubbed | P3 | Pro |
| 35 | Dashboard builder | System | | Scaffolded | P2 | Elite |
