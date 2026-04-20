# TRANSFORMR — AI Enhancement Verification & Implementation Prompt

**Paste this entire file into a fresh Claude Code session.**
**This file is self-contained and fully operational. No additional context is required.**

---

## SECTION 1: IRON-CLAD RULES

```
NEVER run taskkill, Stop-Process, kill, or any process-killing command.
NEVER remove features, screens, components, navigation, or functionality.
NEVER downgrade, stub, minimize, or workaround anything.
NEVER hardcode values. NEVER guess. NEVER use placeholders.
NEVER trigger EAS builds — that is Tyson's decision only.
NEVER push to main — working branch is dev.
NEVER install new packages without explicit approval — package.json is locked.
ADD and FIX ONLY. Every change must be production-grade and complete.
AI is THE product — every AI call must be personalized with full user context.
Generic advice is unacceptable. No loading without user data in the prompt.
All AI calls MUST use claude-sonnet-4-20250514 via Edge Functions, NOT client-side.
Branch: dev | Root: C:\dev\transformr | Mobile: apps\mobile
Package manager: npm | TypeScript: npx tsc --noEmit --pretty
```

---

## SECTION 2: MANDATORY STARTUP

Before writing a single line of code, read ALL of the following files in order:

1. `C:\dev\transformr\CLAUDE.md` — Preservation directives, never-touch list, safe edit protocol
2. `C:\dev\transformr\SOUL.md` — If missing, create it: a one-page product philosophy document stating that TRANSFORMR is the world's first AI-powered total life transformation platform, AI is the product (not a feature), every user interaction that benefits from personalization must have it, and generic advice is a product failure
3. `C:\dev\transformr\CONFIGURATION_LOCK.md` — If missing, create it: a one-page lock file listing all configuration files that must never be modified (app.json, app.config.ts, eas.json, babel.config.js, metro.config.js, tsconfig.json, package.json scripts, .env, .env.example, all Supabase migration files, all Edge Function index.ts files except for the model string update described in Section 9)
4. `C:\dev\transformr\GUNNAR_GUARDRAILS.md` — Read if it exists; skip if not present

After reading, confirm in your response: "Startup files read. Proceeding with AI audit."

---

## SECTION 3: AI PRODUCT PHILOSOPHY

```
TRANSFORMR is marketed as the world's first AI-powered total life transformation platform.
AI is not a feature — it IS the product. Every user interaction that benefits from AI must have it.
AI cannot be hidden behind menus — it must be the first option users see.

Every Claude API call MUST include the user's full context via buildUserAIContext():
  - Goals, weight, height, countdown date
  - Last 7 days of workout/nutrition/sleep/mood data
  - Active streaks and challenges
  - Subscription tier and coaching tone preference

Generic advice is a product failure. All AI output must be personalized.
AI badges (gradient purple pill) must appear on all AI-generated content.
All AI calls must use claude-sonnet-4-20250514 — verify model string in every edge function.

Key invariants:
- ANTHROPIC_API_KEY lives in root .env and is consumed ONLY by Edge Functions server-side
- EXPO_PUBLIC_ANTHROPIC_API_KEY must NOT be used in any client-side code
- All AI invocations go through supabase.functions.invoke() — never fetch() to Anthropic directly
- The coaching tone (drill_sergeant | motivational | balanced | calm) from gamificationStore
  must be passed in every AI call that generates coaching language
```

---

## SECTION 4: AI FEATURE AUDIT PROTOCOL

For every AI feature in Sections 5 through 8, follow this exact sequence:

1. Read the service file: `apps/mobile/services/ai/<file>.ts`
2. Read the corresponding edge function: `supabase/functions/<function-name>/index.ts`
3. Read the screen file that surfaces the feature
4. Classify the feature:
   - **WORKING** — service calls edge function, edge function calls Claude, UI surfaces result
   - **SCAFFOLDED** — service file exists but does not call an edge function (stub/template)
   - **MISSING** — no service, no edge function, or feature advertised in UI but wired to nothing
5. If SCAFFOLDED or MISSING: implement fully per the fix protocol in each section below
6. Run `cd apps/mobile && npx tsc --noEmit --pretty` — zero new errors
7. Commit with a descriptive message: `feat(ai): implement <feature-name> — full edge function call with user context`
8. Move to next feature

Do NOT batch multiple features into a single commit. One commit per feature.

---

## SECTION 5: AI VISION FEATURES — COMPLETE AUDIT AND IMPLEMENTATION

### 5.1 FORM CHECK (Exercise Form Analysis)

- **Service:** `apps/mobile/services/ai/formCheck.ts`
- **Edge function:** `supabase/functions/ai-form-check/index.ts`
- **Screen:** `apps/mobile/app/(tabs)/fitness/form-check.tsx`
- **Classification target:** WORKING

**Verification steps:**
```
1. adb shell am start -n com.automateai.transformr/.MainActivity
2. Navigate: Fitness tab → Form Check
3. Record a 10-second video of any exercise
4. Tap "Analyze Form"
5. Wait for response (may take 5-15 seconds)
```

**Expected logcat output:**
```bash
adb logcat -d ReactNativeJS:V *:S 2>&1 | grep -i "form-check\|form_score\|corrections"
```
Look for: invocation of `ai-form-check`, JSON response containing `form_score` (0-100 integer) and `corrections` (array of strings).

**Expected UI output:**
- Circular score display showing form_score (e.g., "87/100")
- Ordered list of correction cues (e.g., "Keep your chest up", "Drive knees out")
- Accept / Dismiss buttons
- AI badge (gradient purple pill) visible on result card

**Fix protocol if broken:**
1. Read `formCheck.ts` — confirm `supabase.functions.invoke('ai-form-check', { body: { videoBase64, userId, userContext } })` is present
2. Read `ai-form-check/index.ts` — confirm Anthropic SDK call with model `claude-sonnet-4-20250514`
3. If service is not passing `userContext`: import `buildUserAIContext` from `../ai/context`, call it, pass result in body
4. If edge function returns raw text instead of JSON: wrap response in `{ form_score, corrections, tips }`
5. TypeScript check, commit

---

### 5.2 MEAL CAMERA (Food Photo Analysis)

- **Service:** `apps/mobile/services/ai/mealCamera.ts` → `analyzeMealPhoto()`
- **Edge function:** `supabase/functions/ai-meal-analysis/index.ts`
- **Screen:** `apps/mobile/app/(tabs)/nutrition/meal-camera.tsx`
- **Classification target:** WORKING

**Verification steps:**
```
1. Navigate: Nutrition tab → Meal Camera
2. Tap camera icon or photo picker
3. Select any food photo
4. Tap "Analyze"
```

**Expected logcat output:**
```bash
adb logcat -d ReactNativeJS:V *:S 2>&1 | grep -i "meal-analysis\|calories\|macros\|foods"
```
Look for: invocation of `ai-meal-analysis`, JSON response with array of identified food items each containing `name`, `calories`, `protein_g`, `carbs_g`, `fat_g`.

**Expected UI output:**
- List of identified foods with calories and macros per item
- Total meal macro summary (calories, protein, carbs, fat)
- "Add to Log" button that writes to nutritionStore / nutrition_logs table
- AI badge visible on result card

**Fix protocol if broken:**
1. Confirm `analyzeMealPhoto()` sends `{ imageBase64, userId, userContext }` to `ai-meal-analysis`
2. Confirm `buildUserAIContext()` is called and passed so the model knows the user's daily calorie target
3. Confirm "Add to Log" calls the correct nutritionStore action — do NOT change store shape
4. TypeScript check, commit

---

### 5.3 LABS ANALYSIS (Blood Work Photo)

- **Service:** `apps/mobile/services/ai/labs.ts`
- **Edge function:** `supabase/functions/ai-lab-interpret/index.ts`
- **Storage bucket:** `lab-uploads`
- **Screen:** `apps/mobile/app/labs/upload.tsx`
- **Classification target:** WORKING

**Verification steps:**
```
1. Navigate: Labs (from dashboard or nav)
2. Tap "Upload Lab Report"
3. Select a lab report image (PDF screenshot or photo)
4. Tap "Analyze"
```

**Expected logcat output:**
```bash
adb logcat -d ReactNativeJS:V *:S 2>&1 | grep -i "lab-interpret\|biomarker\|lab_uploads"
```
Look for: upload to `lab-uploads` bucket, invocation of `ai-lab-interpret` with file URL, JSON response with `biomarkers` array.

**Expected UI output:**
- List of extracted biomarkers (e.g., "HbA1c: 5.4% — Normal range 4.0-5.6%")
- In-range / out-of-range color indicators (green / red)
- AI-generated plain-language explanation of each out-of-range value
- AI badge on result panel
- Results persisted to `lab_interpretations` and `lab_biomarkers` tables

**Fix protocol if broken:**
1. Confirm file is uploaded to `lab-uploads` bucket and public URL is retrieved before calling edge function
2. Confirm edge function receives the URL and passes it to Claude vision API
3. Confirm structured JSON is returned and written to `lab_interpretations`
4. TypeScript check, commit

---

### 5.4 SUPPLEMENT SCANNER (Label Scan)

- **Service:** `apps/mobile/services/ai/supplement.ts` → `analyzeSupplement()`
- **Edge function:** `supabase/functions/ai-supplement-scanner/index.ts`
- **Screen:** `apps/mobile/app/(tabs)/fitness/supplement-scanner.tsx`
- **Classification target:** WORKING

**Verification steps:**
```
1. Navigate: Fitness tab → Supplement Scanner
2. Point camera at supplement label or select photo
3. Tap "Analyze"
```

**Expected logcat output:**
```bash
adb logcat -d ReactNativeJS:V *:S 2>&1 | grep -i "supplement-scanner\|ingredient\|dosage"
```
Look for: invocation of `ai-supplement-scanner`, JSON response with `ingredients` array, `dosage_assessment`, and optional `interaction_warnings`.

**Expected UI output:**
- Extracted ingredient list with amounts
- Dosage assessment (e.g., "Caffeine: 200mg — within recommended range")
- Interaction warnings if any (e.g., "Do not combine with MAO inhibitors")
- AI badge on result card
- AI badge must also appear on the `ai-supplement` edge function path if supplement.ts routes to that function instead

**Fix protocol if broken:**
1. Confirm which edge function `supplement.ts` actually calls (`ai-supplement` vs `ai-supplement-scanner`) — use whichever is wired
2. Confirm imageBase64 + userContext are passed
3. Confirm structured JSON return
4. TypeScript check, commit

---

### 5.5 PROGRESS PHOTOS (Body Composition Analysis)

- **Service:** `apps/mobile/services/ai/progressPhoto.ts` → `analyzeProgressPhoto()`
- **Edge function:** `supabase/functions/ai-progress-photo/index.ts`
- **Storage bucket:** `progress-photos`
- **Screen:** `apps/mobile/app/(tabs)/fitness/progress-photos.tsx`
- **Classification target:** WORKING

**Verification steps:**
```
1. Navigate: Fitness tab → Progress Photos
2. Upload one or two body photos (front/back)
3. Tap "Analyze"
```

**Expected logcat output:**
```bash
adb logcat -d ReactNativeJS:V *:S 2>&1 | grep -i "progress-photo\|body_composition\|trend"
```
Look for: invocation of `ai-progress-photo`, JSON response with `body_composition_estimate`, `trend_analysis`, `recommendations`.

**Expected UI output:**
- Body composition estimate (visible muscle definition, estimated body fat range)
- Trend analysis compared to previous photos if available
- Personalized recommendations
- AI badge on result panel

**Fix protocol if broken:**
1. Confirm photos are uploaded to `progress-photos` bucket before edge function call
2. Confirm edge function receives photo URLs and userId
3. Confirm userContext (weight goal, previous weight) is included in prompt
4. TypeScript check, commit

---

### 5.6 MENU SCANNER (Restaurant Menu)

- **Service:** `apps/mobile/services/ai/mealCamera.ts` → `analyzeMenuPhoto()`
- **Edge function:** `supabase/functions/ai-menu-scan/index.ts`
- **Screen:** `apps/mobile/app/(tabs)/nutrition/menu-scanner.tsx`
- **Classification target:** WORKING

**Verification steps:**
```
1. Navigate: Nutrition tab → Menu Scanner
2. Photograph or select a restaurant menu image
3. Tap "Analyze"
```

**Expected logcat output:**
```bash
adb logcat -d ReactNativeJS:V *:S 2>&1 | grep -i "menu-scan\|menu_items\|recommended"
```
Look for: invocation of `ai-menu-scan`, JSON response with `menu_items` array and `recommended_choices` based on user goals.

**Expected UI output:**
- Scanned menu items with estimated macros per item
- "Best for your goals" section highlighting recommended choices
- Reasoning for recommendations (e.g., "High protein, fits your 2,400 calorie target")
- AI badge on result card

**Fix protocol if broken:**
1. Confirm `analyzeMenuPhoto()` sends image to `ai-menu-scan` (not `ai-meal-analysis`)
2. Confirm userContext includes daily macro targets so recommendations are goal-specific
3. TypeScript check, commit

---

### 5.7 MEAL PREP PLANNER

- **Service:** `apps/mobile/services/ai/mealPrep.ts` → `generateMealPlan()`
- **Edge function:** `supabase/functions/ai-meal-prep/index.ts`
- **Screen:** `apps/mobile/app/(tabs)/nutrition/meal-prep.tsx`
- **Classification target:** WORKING

**Verification steps:**
```
1. Navigate: Nutrition tab → Meal Prep
2. Tap "Generate Weekly Plan"
3. Wait for AI response
```

**Expected logcat output:**
```bash
adb logcat -d ReactNativeJS:V *:S 2>&1 | grep -i "meal-prep\|meal_plan\|weekly"
```
Look for: invocation of `ai-meal-prep`, JSON response with 7-day structured meal plan.

**Expected UI output:**
- 7-day meal plan grid with breakfast/lunch/dinner/snacks per day
- Daily macro totals per day
- Macros must align with user's actual targets from profile/nutritionStore
- AI badge on plan header
- "Save Plan" button that persists to local store or database

**Fix protocol if broken:**
1. Confirm `generateMealPlan()` passes `userContext` including macro targets and dietary preferences
2. Confirm edge function returns structured 7-day JSON (not a text blob)
3. TypeScript check, commit

---

### 5.8 GROCERY LIST GENERATOR

- **Service:** `apps/mobile/services/ai/groceryList.ts` → `generateGroceryList()`
- **Edge function:** `supabase/functions/ai-grocery-list/index.ts`
- **Screen:** `apps/mobile/app/(tabs)/nutrition/grocery-list.tsx`
- **Classification target:** WORKING

**Verification steps:**
```
1. Navigate: Nutrition tab → Grocery List
2. Tap "Generate from Meal Plan" or "Generate New List"
3. Wait for AI response
```

**Expected logcat output:**
```bash
adb logcat -d ReactNativeJS:V *:S 2>&1 | grep -i "grocery-list\|groceries\|produce"
```
Look for: invocation of `ai-grocery-list`, JSON response with categorized grocery items.

**Expected UI output:**
- Grocery list organized by category: Produce, Proteins, Dairy, Grains, Pantry, Supplements
- Quantities per item (e.g., "Chicken breast — 3 lbs")
- Items derived from the current meal plan if one exists
- Checkable list items (tap to mark as purchased)
- AI badge on list header

**Fix protocol if broken:**
1. Confirm `generateGroceryList()` passes current meal plan data + userContext
2. Confirm categorized JSON return structure
3. TypeScript check, commit

---

### 5.9 SLEEP OPTIMIZER

- **Service:** `apps/mobile/services/ai/sleepOptimizer.ts` → `optimizeSleep()`
- **Edge function:** `supabase/functions/ai-sleep-optimizer/index.ts`
- **Screen:** `apps/mobile/app/(tabs)/goals/` (verify actual screen filename) or insights screen
- **Classification target:** WORKING

**Verification steps:**
```
1. Navigate to Sleep section (check goals tab or dedicated sleep screen)
2. After logging sleep data, tap "Get Sleep Insights"
```

**Expected logcat output:**
```bash
adb logcat -d ReactNativeJS:V *:S 2>&1 | grep -i "sleep-optimizer\|sleep_quality\|sleep_tips"
```
Look for: invocation of `ai-sleep-optimizer`, JSON with `sleep_quality_analysis` and `optimization_tips`.

**Expected UI output:**
- Sleep quality score for the period
- Pattern observations (e.g., "You average 6.2 hours on weeknights")
- Personalized optimization tips referencing actual sleep log data
- Tips must reference real numbers from the user's sleep_logs — not generic advice
- AI badge on tips card

**Fix protocol if broken:**
1. Confirm `optimizeSleep()` passes last 7 days of `sleep_logs` data inside `userContext`
2. Confirm edge function prompt explicitly instructs Claude to reference the actual data
3. TypeScript check, commit

---

### 5.10 TRAJECTORY SIMULATOR

- **Service:** `apps/mobile/services/ai/trajectory.ts` → `simulateTrajectory()`
- **Edge function:** `supabase/functions/ai-trajectory/index.ts`
- **Screen:** `apps/mobile/app/trajectory.tsx`
- **Classification target:** WORKING

**Verification steps:**
```
1. Navigate to Trajectory screen (from dashboard or goals tab)
2. Select a goal (e.g., "Lose 20 lbs by July 1")
3. Tap "Simulate Trajectory"
```

**Expected logcat output:**
```bash
adb logcat -d ReactNativeJS:V *:S 2>&1 | grep -i "ai-trajectory\|trajectory\|projection"
```
Look for: invocation of `ai-trajectory`, JSON with `best_case`, `expected_case`, `worst_case` projections and `weeks_to_goal`.

**Expected UI output:**
- Line graph with three projection curves (best/expected/worst)
- Timeline showing estimated goal completion date under each scenario
- Key milestones along the trajectory
- Personalized adjustments (e.g., "Adding 2 cardio sessions per week moves goal date from July 1 to June 14")
- AI badge on projection card

**Fix protocol if broken:**
1. Confirm `simulateTrajectory()` passes goal details, current weight, workout frequency, calorie data from `userContext`
2. Confirm edge function returns structured projection JSON (not text)
3. TypeScript check, commit

---

### 5.11 HEALTH ROI CALCULATOR

- **Service:** `apps/mobile/services/ai/healthRoi.ts` → `calculateHealthROI()`
- **Edge function:** `supabase/functions/ai-health-roi/index.ts`
- **Screen:** `apps/mobile/app/(tabs)/goals/health-roi.tsx`
- **Classification target:** WORKING

**Verification steps:**
```
1. Navigate: Goals tab → Health ROI
2. Verify calculations populate from real user data
```

**Expected logcat output:**
```bash
adb logcat -d ReactNativeJS:V *:S 2>&1 | grep -i "health-roi\|roi\|productivity"
```
Look for: invocation of `ai-health-roi`, JSON with `dollar_value`, `productivity_gains`, `healthcare_cost_savings`.

**Expected UI output:**
- Dollar value estimate of health improvements (e.g., "$12,400 annual value")
- Productivity gain breakdown (e.g., "3.2 more productive hours per week from better sleep")
- Healthcare cost savings estimate
- Calculations must reference actual workout frequency, sleep quality, and habit completion from user data
- AI badge on ROI summary card

**Fix protocol if broken:**
1. Confirm `calculateHealthROI()` passes full `userContext` including workout count, sleep averages, habit completion rate
2. Confirm edge function prompt instructs Claude to derive dollar values from actual data patterns
3. TypeScript check, commit

---

### 5.12 WORKOUT NARRATOR

- **Service:** `apps/mobile/services/ai/workoutNarrator.ts` → `narrateWorkout()`
- **Edge function:** `supabase/functions/ai-workout-narrator/index.ts`
- **Screen:** `apps/mobile/app/(tabs)/fitness/workout-player.tsx`
- **Classification target:** WORKING

**Verification steps:**
```
1. Navigate: Fitness tab → start any workout
2. Enable narration toggle if present
3. Complete a set
4. Verify narration plays or appears as text coaching
```

**Expected logcat output:**
```bash
adb logcat -d ReactNativeJS:V *:S 2>&1 | grep -i "workout-narrator\|narrat\|coaching_cue"
```
Look for: invocation of `ai-workout-narrator` after each set completion, JSON with `coaching_cue` text.

**Expected UI output:**
- After completing a set: coaching cue appears (e.g., "Good rep speed. For the next set, focus on a 2-second eccentric.")
- Cues are exercise-specific and reference the user's performance data (weight used, reps completed)
- Coaching tone reflects user's preference (drill_sergeant vs calm, etc.)
- Audio playback if TTS is wired; text overlay if not

**Fix protocol if broken:**
1. Confirm `narrateWorkout()` receives `{ exerciseName, setsCompleted, weight, reps, userId, userContext }`
2. Confirm `coachingTone` from `gamificationStore` is included in the body passed to edge function
3. TypeScript check, commit

---

### 5.13 POSTURE ANALYSIS

- **Service:** `apps/mobile/services/ai/` (locate posture service file — may be inline in screen or missing)
- **Edge function:** `supabase/functions/ai-posture-analysis/index.ts`
- **Screen:** `apps/mobile/app/(tabs)/fitness/posture-check.tsx`
- **Classification target:** VERIFY (may be limited)

**Verification steps:**
```
1. Navigate: Fitness tab → Posture Check
2. Stand upright and capture a full-body standing photo
3. Tap "Analyze Posture"
```

**Expected logcat output:**
```bash
adb logcat -d ReactNativeJS:V *:S 2>&1 | grep -i "posture-analysis\|posture_score\|alignment"
```
Look for: invocation of `ai-posture-analysis`, JSON with `posture_score`, `alignment_issues`, `corrective_exercises`.

**Expected UI output:**
- Posture score (0-100)
- Alignment issues highlighted (e.g., "Forward head posture detected", "Left shoulder elevation")
- List of corrective exercises with sets/reps
- AI badge on result card

**Fix protocol if broken or limited:**
1. Read `ai-posture-analysis/index.ts` — if stubbed or returning mock data, implement full Claude vision call
2. Create a service file `apps/mobile/services/ai/postureAnalysis.ts` if one does not exist, mirroring the pattern of `progressPhoto.ts`
3. Wire service into `posture-check.tsx` screen
4. TypeScript check, commit

---

### 5.14 AI CORRELATION INSIGHTS

- **Service:** `apps/mobile/services/ai/correlation.ts` → `findCorrelations()`
- **Edge function:** `supabase/functions/ai-correlation/index.ts`
- **Screen:** `apps/mobile/app/(tabs)/goals/insights.tsx`
- **Classification target:** WORKING

**Verification steps:**
```
1. Navigate: Goals tab → Insights
2. Tap "Find Correlations" or verify auto-loading
```

**Expected logcat output:**
```bash
adb logcat -d ReactNativeJS:V *:S 2>&1 | grep -i "ai-correlation\|correlation\|pattern"
```
Look for: invocation of `ai-correlation`, JSON with `correlations` array of objects with `variable_a`, `variable_b`, `direction`, `magnitude`, `description`.

**Expected UI output:**
- List of discovered correlations with plain-language descriptions
  e.g., "You perform 23% better on days with 8+ hours sleep"
  e.g., "Your protein intake correlates strongly with next-day workout strength"
- Each correlation must reference actual numbers from the user's data
- AI badge on insights panel
- Zero generic filler insights

**Fix protocol if broken:**
1. Confirm `findCorrelations()` passes multi-dimensional `userContext` (workouts, nutrition, sleep, mood, habits)
2. Confirm edge function prompt explicitly asks Claude to identify real patterns across data dimensions
3. Confirm return is structured JSON array (not a paragraph of text)
4. TypeScript check, commit

---

### 5.15 ADAPTIVE PROGRAM

- **Service:** `apps/mobile/services/ai/adaptive.ts` → `recommendAdaptations()`
- **Edge function:** `supabase/functions/ai-adaptive-program/index.ts`
- **Screen:** `apps/mobile/app/(tabs)/fitness/` (programs.tsx or workout-player.tsx — verify actual location)
- **Classification target:** WORKING

**Verification steps:**
```
1. After completing several workouts, navigate to the program or workout screen
2. Look for "Adapt Program" button or automatic adaptation suggestions
3. Tap to trigger
```

**Expected logcat output:**
```bash
adb logcat -d ReactNativeJS:V *:S 2>&1 | grep -i "adaptive-program\|adapt\|progression"
```
Look for: invocation of `ai-adaptive-program`, JSON with `adaptations` array containing exercise-level recommendations.

**Expected UI output:**
- Per-exercise recommendations (e.g., "Increase bench press by 5 lbs — you've hit 3x8 for 2 consecutive sessions")
- Rest period adjustments (e.g., "Reduce rest to 60 seconds on isolation exercises")
- Volume adjustments (e.g., "Add a 4th set to squats this week")
- Recommendations must be derived from actual logged workout data (not generic periodization rules)
- AI badge on adaptations card

**Fix protocol if broken:**
1. Confirm `recommendAdaptations()` passes recent workout history (exercise names, weights, reps, sets) in `userContext`
2. TypeScript check, commit

---

### 5.16 CHALLENGE COACH (SCAFFOLDED — MUST IMPLEMENT)

- **Service:** `apps/mobile/services/ai/challengeCoach.ts` → `getChallengeTips()`
- **Edge function:** `supabase/functions/challenge-coach/index.ts`
- **Screen:** `apps/mobile/app/(tabs)/goals/challenge-active.tsx`
- **Current state:** SCAFFOLDED — `getChallengeTips()` returns static template, no real edge function call

**Implementation steps:**

**Step 1 — Read all relevant files:**
```
apps/mobile/services/ai/challengeCoach.ts
supabase/functions/challenge-coach/index.ts
apps/mobile/app/(tabs)/goals/challenge-active.tsx
apps/mobile/services/ai/context.ts
```

**Step 2 — Implement `getChallengeTips()` in `challengeCoach.ts`:**
The function must:
- Accept parameters: `{ userId: string, challengeId: string, challengeType: string, dayNumber: number, completionRate: number }`
- Call `buildUserAIContext(userId)` to get full user context
- Invoke `supabase.functions.invoke('challenge-coach', { body: { userId, challengeType, dayNumber, completionRate, userContext } })`
- Return typed response: `{ tip: string, motivation: string, todayTask: string }`
- Handle errors with a meaningful fallback message (do NOT return null silently)

**Step 3 — Verify edge function `challenge-coach/index.ts`:**
- Must use `ANTHROPIC_API_KEY` environment variable
- Must use model `claude-sonnet-4-20250514`
- Must accept `{ userId, challengeType, dayNumber, completionRate, userContext }` in request body
- Must return `{ tip: string, motivation: string, todayTask: string }`
- Must have try/catch with structured error response
- If edge function is a stub: implement fully using same pattern as `ai-chat-coach/index.ts`

**Step 4 — Wire to `challenge-active.tsx`:**
- Import `getChallengeTips` from `../../../services/ai/challengeCoach`
- Call on screen mount and when challenge day changes
- Display `tip`, `motivation`, and `todayTask` in the existing challenge UI
- Add AI badge (gradient purple pill) to the tips card
- Do NOT change any existing navigation, store calls, or screen layout — only ADD the tips section

**Step 5 — TypeScript check and commit:**
```bash
cd apps/mobile && npx tsc --noEmit --pretty
```
Zero errors. Commit: `feat(ai): implement challenge-coach — full edge function call with user context`

---

### 5.17 COMPLIANCE ADVISOR (SCAFFOLDED — MUST IMPLEMENT)

- **Service:** `apps/mobile/services/ai/compliance.ts`
- **Current state:** SCAFFOLDED — contains compliance message template, no real Claude call
- **Edge function:** Determine which edge function to use (read the file first)

**Implementation steps:**

**Step 1 — Read and analyze `compliance.ts`:**
- Determine what the compliance feature is designed to do (e.g., business compliance advice, supplement compliance, challenge rule compliance)
- Identify what parameters the function accepts
- Identify what screen or component calls it

**Step 2 — Determine the appropriate edge function:**
- If an `ai-compliance` edge function exists in `supabase/functions/`: use it
- If no compliance edge function exists: check if `ai-chat-coach` can serve this purpose, or create `supabase/functions/ai-compliance/index.ts` following the exact pattern of an existing AI edge function

**Step 3 — Implement the real Claude call in `compliance.ts`:**
- Call `buildUserAIContext(userId)` for personalization
- Invoke the edge function with full context
- Return structured typed response
- Handle errors explicitly — no silent catches, no empty returns

**Step 4 — Wire to the correct screen:**
- Find any screen that imports from `compliance.ts` and verify it displays the AI output
- Add AI badge to any AI-generated compliance content
- Do NOT modify screen layout — only add the data display

**Step 5 — TypeScript check and commit:**
```bash
cd apps/mobile && npx tsc --noEmit --pretty
```
Zero errors. Commit: `feat(ai): implement compliance-advisor — full edge function call with user context`

---

## SECTION 6: AI COACHING SYSTEM

### 6.1 Daily Briefing

**Screen:** `apps/mobile/app/daily-briefing.tsx`
**Edge function(s):** `ai-coach` or `ai-daily-affirmation`

**Verification checklist:**
- [ ] `buildUserAIContext(userId)` is called before the edge function invocation
- [ ] AI greeting addresses the user by their actual name from profile (not "User" or "Friend")
- [ ] Yesterday's summary references real numbers (e.g., "You burned 2,140 calories yesterday" not "You had a great day")
- [ ] Today's recommendations are specific to actual schedule and goals
- [ ] AI badge visible on briefing card
- [ ] Logcat shows edge function invocation with userId

**Logcat check:**
```bash
adb logcat -d ReactNativeJS:V *:S 2>&1 | grep -i "ai-coach\|daily-affirmation\|briefing"
```

**Fix protocol if briefing is generic:**
1. Read `daily-briefing.tsx` — find where the AI call is made
2. Read the service function that powers it
3. Confirm `userContext` is built and passed
4. If context is not being passed: add `buildUserAIContext(userId)` call before the edge function invocation
5. Confirm the edge function prompt explicitly instructs Claude to use the provided data
6. TypeScript check, commit

---

### 6.2 Workout Recommendations

**Service:** `apps/mobile/services/ai/coach.ts` → `getWorkoutAdvice()`
**Edge function:** `ai-workout-advisor`

**Verification checklist:**
- [ ] Last 7 workout sessions (exercise names, dates, volumes) are passed in userContext
- [ ] Recommendation explains the "why" based on actual training history
  e.g., "Rest your chest — you trained it yesterday with 4 sets of bench" NOT "Rest when tired"
- [ ] Recovery data (sleep, readiness score) influences recommendation
- [ ] Recommendations reference specific exercises by name

**Fix protocol:** Confirm `getWorkoutAdvice()` passes `{ userId, userContext }` where `userContext.workoutSessions` contains the last 7 sessions. If missing, add the data pull from the relevant store or Supabase query before the edge function call.

---

### 6.3 Nutrition Advice

**Verification checklist:**
- [ ] User's daily macro targets (calories, protein, carbs, fat) from profile/nutritionStore are in `userContext`
- [ ] Today's logged nutrition so far is included
- [ ] AI advice is specific (e.g., "You're 43g short on protein — add a chicken breast or protein shake")
- [ ] Not generic (e.g., "Eat more protein" with no numbers = FAIL)

**Fix protocol:** Confirm `buildUserAIContext()` queries `nutrition_logs` for today's entries and includes the running totals alongside targets.

---

### 6.4 Recovery Recommendations

**Verification checklist:**
- [ ] Sleep data from `sleep_logs` for last 7 days is in `userContext`
- [ ] Mood data from `mood_logs` for last 7 days is in `userContext`
- [ ] Readiness score is included if available
- [ ] Recovery recommendation is specific (e.g., "Your average sleep was 5.9 hours this week — prioritize 8 hours tonight before your heavy leg day tomorrow")

---

### 6.5 Weekly Review

**Screen:** `apps/mobile/app/weekly-review.tsx`
**Edge function:** `ai-weekly-report`

**Verification checklist:**
- [ ] Full week of workout data (7 days of sessions) passed to edge function
- [ ] Full week of nutrition data passed (daily calorie/macro totals)
- [ ] Habit completion rates for the week passed
- [ ] Sleep averages for the week passed
- [ ] Mood trend for the week passed
- [ ] Review output contains real numbers matching the data passed
- [ ] AI badge visible on review card

**Logcat check:**
```bash
adb logcat -d ReactNativeJS:V *:S 2>&1 | grep -i "weekly-report\|weekly_review"
```

**Fix protocol if review is generic:** Find where `ai-weekly-report` is invoked. Confirm all 5 data dimensions (workouts, nutrition, habits, sleep, mood) are in the body. If any are missing, add the corresponding store query before the invocation.

---

### 6.6 Journal Prompts

**Service:** `apps/mobile/services/ai/journaling.ts` → `getJournalPrompt()`
**Screen:** `apps/mobile/app/(tabs)/goals/journal.tsx`
**Edge function:** `ai-journal-prompt`

**Verification checklist:**
- [ ] Previous journal entries (at minimum last 3) are passed in `userContext`
- [ ] Prompt is unique each day (confirm edge function prompt includes current date and previous entry topics)
- [ ] Prompt is relevant to user's current goals and recent activity
- [ ] NOT: "How did your day go?" (generic = FAIL)
- [ ] YES: "You crushed your protein goal 5 out of 7 days this week. What made those days different?" (specific = PASS)

**Fix protocol if prompts are generic:**
1. Confirm `getJournalPrompt()` queries and passes recent `journal_entries` to the edge function
2. Confirm edge function prompt includes an instruction to avoid repeating previous prompt themes
3. TypeScript check, commit

---

## SECTION 7: AI COACH CHAT

**Screen:** `apps/mobile/app/chat.tsx`
**Service:** `apps/mobile/services/ai/chat.ts`
**Edge function:** `supabase/functions/ai-chat-coach/index.ts`
**Database tables:** `ai_chat_conversations`, `ai_chat_messages`

### 7.1 FAB Visibility Verification

```
1. Open app and land on Dashboard tab
2. Verify chat FAB (floating action button) is visible in bottom-right corner
3. Switch to Fitness tab — FAB must still be visible
4. Switch to Nutrition tab — FAB must still be visible
5. Switch to Goals tab — FAB must still be visible
6. Switch to Profile tab — FAB must still be visible
```

If FAB is missing on any tab: find where it is rendered (likely in the root layout or tab navigator), verify it is not conditionally hidden, and confirm it is not covered by other UI elements.

### 7.2 Chat Functionality

```
1. Tap FAB → chat.tsx must open as modal overlay
2. Send message: "What should I eat before my workout today?"
3. Wait for response
```

**Expected logcat output:**
```bash
adb logcat -d ReactNativeJS:V *:S 2>&1 | grep -i "chat-coach\|ai_chat\|conversation"
```
Look for: invocation of `ai-chat-coach` with `{ userId, message, conversationId, userContext }`, response with personalized coaching content.

**Response quality test — MUST PASS:**
- Response mentions user's actual workout schedule (day of week, exercise type)
- Response references user's actual daily calorie or macro targets
- Response is NOT: "Before a workout, try eating carbohydrates and protein 1-2 hours prior." (generic = FAIL)
- Response IS: "Given your 5pm strength session today and your 2,400 calorie target, try 40g carbs + 25g protein around 3pm — something like rice and chicken or oats with a scoop of protein." (specific = PASS)

### 7.3 Context Injection Test (Critical)

Send this exact message in the chat: **"Summarize my last 7 days"**

**PASS criteria:**
- Response mentions actual workout dates or count (e.g., "You completed 4 workouts this week, including back on Monday and legs on Wednesday")
- Response includes real calorie numbers (e.g., "You averaged 2,180 calories per day")
- Response includes actual habit completion rate (e.g., "You hit your hydration goal 6 out of 7 days")

**FAIL criteria:**
- Response says "I don't have access to your data"
- Response says "I can only provide general advice"
- Response gives completely generic fitness summary
- Response says anything that contradicts the user's actual logged data

**Fix protocol if context is broken:**
1. Read `chat.ts` — confirm `buildUserAIContext(userId)` is called before `supabase.functions.invoke('ai-chat-coach', ...)`
2. Confirm `userContext` is passed in the request body
3. Read `ai-chat-coach/index.ts` — confirm the user context is injected into the Claude system prompt (not ignored)
4. The system prompt must include ALL context fields explicitly — verify the prompt template passes the data
5. TypeScript check, commit

### 7.4 Coaching Tone Switching

```
1. Navigate to Profile or Settings → Coaching Style/Tone
2. Switch to "drill_sergeant"
3. Return to chat, send: "I skipped my workout today"
4. Verify response is firm and demanding
5. Switch to "calm"
6. Send: "I skipped my workout today"
7. Verify response is gentle and understanding
```

**Expected drill_sergeant response pattern:** Direct, no excuses, accountability-focused, uses strong language within appropriate limits.
**Expected calm response pattern:** Compassionate, understanding, gentle redirection, no judgment.

**Verification:** `gamificationStore.tone` value must flow into the edge function body and be referenced in the Claude system prompt to modify response style.

### 7.5 Conversation Persistence

```
1. Send 3 messages in chat
2. Close chat modal
3. Reopen chat modal
4. Verify previous messages are visible in the thread
5. Verify messages exist in ai_chat_messages table (check Supabase dashboard or query)
```

If messages are not persisting: find where `ai_chat_messages` insert is called in `chat.ts` and confirm it is executing without error.

---

## SECTION 8: AI BADGE SYSTEM

Every piece of AI-generated content must display a gradient purple "AI" pill badge.

**Badge specification:**
- Shape: pill (border-radius: 999)
- Background: linear gradient from `#7E22CE` to `#A855F7` (left to right)
- Text: "AI" (white, bold, small — fontSize 11-12)
- Size: approximately 32x18px
- Position: top-right corner of the AI-generated card or panel
- Do NOT use emoji as a functional element — the text "AI" is sufficient

**Badge component location:** Verify if a reusable `AIBadge` component exists in `apps/mobile/components/`. If it does, import and use it. If it does not exist, create `apps/mobile/components/AIBadge.tsx` as a Class A (new file) creation.

**Verification checklist — confirm AI badge is present on:**
- [ ] Daily briefing screen — visible on briefing card
- [ ] Chat screen — visible on each AI response bubble (not on user messages)
- [ ] Meal camera results — visible on each analyzed food item card
- [ ] Form check results — visible on score/corrections card
- [ ] Insights/correlations screen — visible on each correlation card
- [ ] Workout recommendations card
- [ ] Progress photo analysis results
- [ ] Lab interpretation results
- [ ] Supplement scan results
- [ ] Meal prep plan header
- [ ] Grocery list header
- [ ] Trajectory projection card
- [ ] Health ROI summary card
- [ ] Sleep optimizer tips card
- [ ] Challenge tips card (after implementing 5.16)
- [ ] Journal prompt display

If badge is missing from any location: add it as an additive-only change. Do NOT restructure the component — only add the badge as an overlay or append it to the card header.

---

## SECTION 9: MODEL VERIFICATION

CRITICAL: Every edge function MUST use `claude-sonnet-4-20250514`, NOT any older Claude version and NOT any OpenAI model.

### 9.1 Bulk Model Audit

Run this command to find all model references across edge functions:
```bash
grep -r "model\|claude\|gpt\|openai" supabase/functions/ --include="*.ts" -n
```

**PASS pattern:** `model: "claude-sonnet-4-20250514"`
**FAIL patterns (any of these require immediate fix):**
- `claude-3-opus-*`
- `claude-3-sonnet-*`
- `claude-3-haiku-*`
- `claude-3-5-sonnet-*`
- `gpt-4*`
- `gpt-3.5*`
- Any OpenAI model string

### 9.2 API Key Verification

Run this command to find any client-side Anthropic key usage:
```bash
grep -r "EXPO_PUBLIC_ANTHROPIC_API_KEY" apps/mobile/ --include="*.ts" --include="*.tsx" -n
```

If any results appear: that is a critical security violation. The public key must NEVER be used in any service, hook, screen, or component file. All AI calls must go through Supabase Edge Functions.

Edge functions must use:
```typescript
const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
```
Never:
```typescript
const apiKey = Deno.env.get('EXPO_PUBLIC_ANTHROPIC_API_KEY');
```

### 9.3 Fix Protocol for Wrong Model

For each edge function using a non-current model:
1. Read the edge function file
2. Locate the model string
3. Replace ONLY the model string value with `claude-sonnet-4-20250514`
4. Do not change any other logic
5. TypeScript check (Deno check if applicable)
6. Commit: `fix(ai): update <function-name> to claude-sonnet-4-20250514`

The list of all 30 AI edge functions to check:
```
ai-adaptive-program, ai-chat-coach, ai-coach, ai-correlation, ai-daily-affirmation,
ai-form-check, ai-grocery-list, ai-health-roi, ai-journal-prompt, ai-lab-interpret,
ai-meal-analysis, ai-meal-prep, ai-menu-scan, ai-monthly-retrospective, ai-motivation,
ai-pattern-detector, ai-posture-analysis, ai-post-workout, ai-progress-photo,
ai-screen-insight, ai-sleep-optimizer, ai-supplement, ai-supplement-scanner,
ai-trajectory, ai-voice-command, ai-weekly-report, ai-workout-advisor,
ai-workout-coach, ai-workout-narrator, challenge-coach
```

---

## SECTION 10: EDGE FUNCTION HEALTH CHECK

For each of the 30 AI edge functions listed in Section 9.3, verify the following 6 points:

### Health Check Criteria

**1. ANTHROPIC_API_KEY usage (not client-exposed):**
```typescript
// CORRECT
const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
// WRONG — would expose key in logs or to clients
const apiKey = 'sk-ant-hardcoded...'
```

**2. userId parameter handling:**
Every AI edge function must accept `userId` in the request body and use it to personalize the response. If userId is not in the request, the function should return a 400 error, not proceed with generic output.

**3. Structured JSON return (not raw text):**
```typescript
// CORRECT
return new Response(JSON.stringify({ result: ..., metadata: ... }), { headers: { 'Content-Type': 'application/json' } });
// WRONG
return new Response(claudeResponseText, { headers: { 'Content-Type': 'text/plain' } });
```

**4. Error handling:**
```typescript
// CORRECT
try {
  // ... Claude call
} catch (error) {
  return new Response(JSON.stringify({ error: 'AI processing failed', details: error.message }), { status: 500 });
}
// WRONG — silent catch or no try/catch
```

**5. Model string:**
`model: "claude-sonnet-4-20250514"` in the Anthropic API call.

**6. CORS headers:**
All edge functions must include proper CORS headers to allow calls from the mobile app.

### Health Check Command

To audit a specific edge function quickly:
```bash
adb logcat -d ReactNativeJS:V *:S 2>&1 | grep -i "functions\|edge\|invoke\|anthropic\|claude"
```

Document findings for each function as: HEALTHY | NEEDS MODEL UPDATE | NEEDS ERROR HANDLING | NEEDS JSON RETURN | BROKEN.

---

## SECTION 11: CONTEXT BUILDER VERIFICATION

**File:** `apps/mobile/services/ai/context.ts`
**Function:** `buildUserAIContext(userId: string)`

This function is the backbone of TRANSFORMR's personalization. It must aggregate ALL of the following before ANY AI call is made.

### Verification Checklist

Read the file. Confirm each field is present in the returned context object:

- [ ] **User profile** — `name`, `weight`, `height`, `age`, `goals` (weight goal, fitness goal), `dietary_preferences`
- [ ] **Countdown date** — if the user has set a goal deadline (e.g., "Beach trip July 1"), it must be in context
- [ ] **Last 7 days workout_sessions** — array with `date`, `exercises` (name, sets, reps, weight per set)
- [ ] **Last 7 days nutrition_logs** — array with `date`, `calories`, `protein_g`, `carbs_g`, `fat_g`
- [ ] **User's daily macro targets** — `calorie_target`, `protein_target`, `carbs_target`, `fat_target`
- [ ] **Last 7 days sleep_logs** — array with `date`, `duration_hours`, `quality_score`
- [ ] **Last 7 days mood_logs** — array with `date`, `mood_level` (1-5), `notes`
- [ ] **Active habits** — array with `habit_name`, `completion_rate_7d`
- [ ] **Active challenges** — array with `challenge_name`, `challenge_type`, `day_number`, `completion_rate`
- [ ] **Current streaks** — array with `streak_name`, `current_count`, `best_count`
- [ ] **Subscription tier** — `'free' | 'pro' | 'elite'`
- [ ] **Coaching tone** — value from `gamificationStore` (`'drill_sergeant' | 'motivational' | 'balanced' | 'calm'`)

### Fix Protocol for Missing Context Fields

If any field is missing from `buildUserAIContext()`:

1. Identify the correct Supabase table or store that holds the data
2. Add the query inside `buildUserAIContext()` alongside the existing queries
3. Add the field to the returned object
4. Add the TypeScript type for the field to the context type definition
5. Do NOT modify any store — query Supabase directly within the context builder if needed
6. TypeScript check
7. Commit: `feat(ai): add <field-name> to buildUserAIContext for full personalization`

**Important:** Do not change the function signature or return type name. Only ADD new fields to the existing return object.

---

## SECTION 12: SUMMARY REPORT TEMPLATE

At the completion of all sections, output this exact report:

```
AI ENHANCEMENT VERIFICATION REPORT
====================================
Date: [timestamp]
Branch: dev
Agent: Claude Code

AI VISION FEATURES (17 total):
  WORKING (confirmed end-to-end):  [N]/17
  FIXED this session:              [N] — [list feature names]
  BLOCKED (requires Tyson input):  [N] — [list with reason]

AI COACHING SYSTEM:
  Daily briefing personalized:     [YES/NO — detail if NO]
  Chat context injection working:  [YES/NO — detail if NO]
  "Last 7 days" test PASSED:       [YES/NO]
  Weekly review personalized:      [YES/NO — detail if NO]
  Journal prompts unique:          [YES/NO — detail if NO]
  Coaching tone switching works:   [YES/NO — detail if NO]

MODEL VERIFICATION:
  All 30 functions on claude-sonnet-4-20250514: [YES/NO]
  Functions updated this session:  [list function names or "none"]
  Any functions using OpenAI:      [YES/NO — list if YES]
  EXPO_PUBLIC key found client-side: [YES/NO — list files if YES]

EDGE FUNCTION HEALTH (30 AI functions):
  All verified HEALTHY:            [YES/NO]
  Functions needing fix:           [list with issue type]
  Functions with missing error handling: [list]

AI BADGES:
  Present on all AI content:       [YES/NO]
  Screens missing badge:           [list or "none"]

CONTEXT BUILDER:
  All 12 context fields present:   [YES/NO]
  Fields added this session:       [list or "none"]

SCAFFOLDED FEATURES IMPLEMENTED:
  challenge-coach (5.16):          [DONE/BLOCKED — detail]
  compliance-advisor (5.17):       [DONE/BLOCKED — detail]

TYPESCRIPT: 0 new errors
COMMITS THIS SESSION: [N]
  [commit hash] — [message]
  [commit hash] — [message]

BLOCKED FOR TYSON (requires decision or device access):
  - [Item 1: reason it is blocked]
  - [Item 2: reason it is blocked]

OUT OF SCOPE OBSERVATIONS (for future sessions):
  - [Anything noticed but deliberately left alone per Surgeon Rule]
```

---

## APPENDIX A: KEY FILE PATHS REFERENCE

```
Root:                    C:\dev\transformr
Mobile app:              C:\dev\transformr\apps\mobile
AI services:             C:\dev\transformr\apps\mobile\services\ai\
Edge functions:          C:\dev\transformr\supabase\functions\
Stores:                  C:\dev\transformr\apps\mobile\stores\
Screens (tabs):          C:\dev\transformr\apps\mobile\app\(tabs)\
Screens (root):          C:\dev\transformr\apps\mobile\app\
Components:              C:\dev\transformr\apps\mobile\components\
```

## APPENDIX B: ALL AI SERVICE FILES

```
apps/mobile/services/ai/formCheck.ts
apps/mobile/services/ai/mealCamera.ts
apps/mobile/services/ai/supplement.ts
apps/mobile/services/ai/labs.ts
apps/mobile/services/ai/chat.ts
apps/mobile/services/ai/coach.ts
apps/mobile/services/ai/workoutCoach.ts
apps/mobile/services/ai/workoutNarrator.ts
apps/mobile/services/ai/progressPhoto.ts
apps/mobile/services/ai/trajectory.ts
apps/mobile/services/ai/healthRoi.ts
apps/mobile/services/ai/sleepOptimizer.ts
apps/mobile/services/ai/mealPrep.ts
apps/mobile/services/ai/groceryList.ts
apps/mobile/services/ai/motivation.ts
apps/mobile/services/ai/journaling.ts
apps/mobile/services/ai/adaptive.ts
apps/mobile/services/ai/correlation.ts
apps/mobile/services/ai/compliance.ts       ← SCAFFOLDED
apps/mobile/services/ai/context.ts          ← CONTEXT BUILDER
apps/mobile/services/ai/challengeCoach.ts   ← SCAFFOLDED
```

## APPENDIX C: ALL 49 EDGE FUNCTIONS

**AI Functions (30):**
```
ai-adaptive-program    ai-chat-coach         ai-coach
ai-correlation         ai-daily-affirmation  ai-form-check
ai-grocery-list        ai-health-roi         ai-journal-prompt
ai-lab-interpret       ai-meal-analysis      ai-meal-prep
ai-menu-scan           ai-monthly-retrospective ai-motivation
ai-pattern-detector    ai-posture-analysis   ai-post-workout
ai-progress-photo      ai-screen-insight     ai-sleep-optimizer
ai-supplement          ai-supplement-scanner ai-trajectory
ai-voice-command       ai-weekly-report      ai-workout-advisor
ai-workout-coach       ai-workout-narrator   challenge-coach
```

**Calculation/Logic Functions (11):**
```
achievement-evaluator  challenge-evaluator   pr-detection
readiness-score        streak-calculator     stake-evaluator
reorder-predictor      smart-notification-engine subscription-sync
daily-reminder         daily-accountability
```

**Integration Functions (8):**
```
partner-nudge          social-content-gen    stripe-webhook
transcribe-audio       weather-fetch         widget-update
goal-cinema            proactive-wellness
```

## APPENDIX D: FEATURE GATE REFERENCE

```
FREE tier AI features:
  ai_meal_camera          — 5 uses/month
  ai_chat_coach           — 10 messages/day

PRO tier AI features:
  ai_form_check           ai_trajectory_simulator    ai_weekly_report
  ai_sleep_optimizer      ai_grocery_list            ai_meal_prep
  ai_supplement_advisor   ai_workout_narrator        ai_correlation
  lab_scanner             ai_insights                ai_adaptive_program
  ai_journal_prompt       ai_progress_analysis

ELITE tier AI features:
  ai_progress_photo_analysis   ai_form_check_video
  readiness_score_detailed     body_business_correlation_full
  ai_vision_board              ai_supplement_advisor_v2
  ai_weekly_report_v2
```

Hook: `useFeatureGate.ts` in `apps/mobile/`
Every AI feature must check its gate before invoking the edge function. Do not bypass gates.

## APPENDIX E: SUPABASE TABLES FOR AI

```
ai_chat_conversations   — chat session metadata
ai_chat_messages        — individual messages (userId, role, content, timestamp)
ai_predictions          — AI trajectory and prediction results
proactive_messages      — AI-initiated messages from smart-notification-engine
lab_uploads             — uploaded lab report files
lab_interpretations     — AI analysis results per lab upload
lab_biomarkers          — individual biomarker values extracted from lab reports
```

---

*End of TRANSFORMR-AI-ENHANCEMENT-VERIFY.md*
*Version: 1.0 | Created: 2026-04-19 | Branch: dev*
