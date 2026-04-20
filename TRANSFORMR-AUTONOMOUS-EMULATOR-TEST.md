TRANSFORMR — AUTONOMOUS EMULATOR TEST & REMEDIATION
═══════════════════════════════════════════════════
Paste this into a fresh Claude Code session. Execute all 23 phases sequentially.
Fix every issue found. Commit after each phase. Print Launch Certification at end.

IDENTITY:
  Bundle ID: com.automateai.transformr | Activity: .MainActivity
  Branch: dev | Root: C:\dev\transformr | Mobile: apps\mobile
  Package manager: npm | TypeScript: npx tsc --noEmit --pretty
  Expo SDK: 53.0.23 (LOCKED) | AI Model: claude-sonnet-4-20250514

IRON-CLAD RULES:
  NEVER taskkill, Stop-Process, kill any process.
  NEVER remove features, screens, components, navigation, or functionality.
  NEVER downgrade, stub, minimize, or workaround anything.
  NEVER hardcode values. NEVER guess. NEVER use placeholders.
  NEVER trigger EAS builds — Tyson's decision only.
  NEVER push to main — branch is dev.
  NEVER install new packages — package.json is locked.
  ADD and FIX ONLY. Production-grade and complete. No stubs.
  Read every file completely before modifying it.
  TypeScript must stay at 0 errors throughout.
  Commit after every phase.

ADB COMMAND REFERENCE:
  Verify installed:    adb shell pm list packages | grep transformr
  Clear logcat:        adb logcat -c
  Force stop:          adb shell am force-stop com.automateai.transformr
  Launch:              adb shell am start -n com.automateai.transformr/.MainActivity
  Port forward:        adb reverse tcp:8081 tcp:8081
  Screenshot:          adb shell screencap -p /sdcard/s.png && adb pull /sdcard/s.png screen.png
  Logcat dump:         adb logcat -d ReactNativeJS:V JS:E *:S 2>&1 | tail -30
  Airplane ON:         adb shell settings put global airplane_mode_on 1 && adb shell am broadcast -a android.intent.action.AIRPLANE_MODE
  Airplane OFF:        adb shell settings put global airplane_mode_on 0 && adb shell am broadcast -a android.intent.action.AIRPLANE_MODE
  Tap:                 adb shell input tap X Y
  Swipe up:            adb shell input swipe 540 1400 540 600 300
  Grant permission:    adb shell pm grant com.automateai.transformr android.permission.POST_NOTIFICATIONS
  Deep link test:      adb shell am start -W -a android.intent.action.VIEW -d "com.automateai.transformr://partner/join?code=TRFM-TEST01" com.automateai.transformr

═══════════════════════════════════════════════════════════════════
PHASE 0 — GOVERNANCE SETUP
═══════════════════════════════════════════════════════════════════
Goal: Read governance files; create SOUL.md and CONFIGURATION_LOCK.md if missing.

1. Read C:\dev\transformr\CLAUDE.md completely.
2. If SOUL.md missing at C:\dev\transformr\, create with:
   - TRANSFORMR is the world's first AI-powered total life transformation platform
   - Owner: Automate AI LLC (Tyson Lerfald)
   - 7 Pillars: Body, Fitness, Nutrition, Business, Habits, Mindset, Relationships
   - Brand: Deep Space dark theme (#0C0A15), Vivid Purple (#A855F7), glass cards rgba(22,18,42,0.88)
   - AI First: Claude claude-sonnet-4-20250514 via Supabase Edge Functions
   - Tiers: Free / Pro ($9.99) / Elite ($14.99) / Partners ($19.99)
   - Standard: Must stand alongside WHOOP, Strava, Calm as premium category leader
3. If CONFIGURATION_LOCK.md missing at C:\dev\transformr\, create with:
   - Expo SDK 53.0.23: LOCKED
   - Bundle ID com.automateai.transformr: LOCKED
   - babel.config.js, metro.config.js, app.config.ts, package.json: LOCKED
4. Read C:\dev\GUNNAR_GUARDRAILS.md if it exists.
5. Run: cd C:\dev\transformr\apps\mobile && npx tsc --noEmit --pretty
   Record error count (expected: 0). Fix any errors before proceeding.
6. Verify git branch: git branch --show-current (expected: dev or test/full-coverage)
7. Commit if any files created: git commit -m "chore: create SOUL.md and CONFIGURATION_LOCK.md"

═══════════════════════════════════════════════════════════════════
PHASE 1 — CRITICAL KNOWN ISSUES
═══════════════════════════════════════════════════════════════════
Goal: Fix all known pre-flight issues before any testing.

FIX 1 — Stripe graceful fallback:
  Read: apps/mobile/services/stripe.ts
  Problem: EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_live_xxxxx" (placeholder)
  Fix: Add at initialization — if key contains 'xxxxx', return {error:'Payment system coming soon'} from all payment functions.
  Commit: "fix(stripe): graceful fallback when Stripe keys are placeholder"

FIX 2 — OpenWeatherMap graceful fallback:
  Find and read the weather service file.
  Problem: EXPO_PUBLIC_OPENWEATHER_API_KEY is empty.
  Fix: If key is empty/undefined, return null weather data. UI shows "Weather unavailable".
  Commit: "fix(weather): graceful fallback when OpenWeatherMap key not configured"

FIX 3 — Spotify graceful fallback:
  Read: apps/mobile/services/integrations/spotify.ts
  Problem: EXPO_PUBLIC_SPOTIFY_CLIENT_ID = "xxxxx" (placeholder)
  Fix: If client ID is placeholder, return {error:'Spotify integration coming soon'}.
  Commit: "fix(spotify): graceful fallback when Spotify not configured"

FIX 4 — TypeScript baseline:
  Run: cd apps/mobile && npx tsc --noEmit --pretty
  Fix all errors found. Commit if any fixed: "fix(ts): resolve TypeScript errors"

═══════════════════════════════════════════════════════════════════
PHASE 2 — DATABASE & AI VERIFICATION
═══════════════════════════════════════════════════════════════════
Goal: Verify Supabase configuration and edge function model strings.

1. Read Supabase client init: find and read apps/mobile/lib/supabase.ts or services/supabase.ts
2. Verify EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are referenced.
3. Verify 30 AI edge functions use claude-sonnet-4-20250514:
   Search: grep -r "claude-sonnet\|claude-3\|gpt-" C:\dev\transformr\supabase\functions --include="*.ts"
   If wrong model found: update to claude-sonnet-4-20250514, commit: "fix(ai): update all edge functions to claude-sonnet-4-20250514"
4. Verify ANTHROPIC_API_KEY used in edge functions (not EXPO_PUBLIC_ANTHROPIC_API_KEY):
   Search: grep -r "EXPO_PUBLIC_ANTHROPIC" C:\dev\transformr\supabase\functions --include="*.ts"
   If found: fix to use server-side ANTHROPIC_API_KEY only.
5. Verify 4 storage buckets referenced in services: lab-uploads, form-check-videos, progress-photos, goal-images
6. Commit: "chore(db): database and edge function verification complete"

═══════════════════════════════════════════════════════════════════
PHASE 3 — APP LAUNCH
═══════════════════════════════════════════════════════════════════
Goal: Verify app launches cleanly with TRANSFORMR brand.

1. adb reverse tcp:8081 tcp:8081
2. adb shell pm list packages | grep transformr (verify installed)
3. adb logcat -c
4. adb shell am force-stop com.automateai.transformr
5. adb shell am start -n com.automateai.transformr/.MainActivity
6. Wait 3 seconds
7. adb shell screencap -p /sdcard/launch.png && adb pull /sdcard/launch.png launch.png
8. adb logcat -d ReactNativeJS:V JS:E *:S 2>&1 | tail -30
9. VERIFY: Zero JS errors | Splash shows TRANSFORMR purple (#A855F7) | Navigates to auth or main
10. Fix any launch errors found. Commit.

═══════════════════════════════════════════════════════════════════
PHASE 4 — AUTH FLOWS
═══════════════════════════════════════════════════════════════════
Goal: Verify all auth methods, session persistence, brand colors.

Test sequence:
1. Email + password: valid credentials → sign in successfully
2. Wrong password → error toast, no crash
3. No account → "account not found" message
4. Forgot password → enter email → confirmation message shown
5. Registration: fill fields:
   "What should we call you?" → TestUser
   "you@example.com" → test@transformr.ai
   "Create a strong password" → TestPass123!
   "Re-enter your password" → TestPass123!
   Submit → email verification prompt
6. Google Sign-In → OAuth flow opens
7. Session persistence: force-close app → relaunch → verify still authenticated
8. Sign out from Profile → returns to login screen

Brand check: Verify auth screens use #A855F7 purple, NOT #0243D5 or #1A56DB.
Fix any auth issues. Commit: "fix(auth): auth flows verified and fixed"

═══════════════════════════════════════════════════════════════════
PHASE 5 — TAB BAR COORDINATE DISCOVERY
═══════════════════════════════════════════════════════════════════
Goal: Measure real tab coordinates before any navigation testing.

1. Launch app and navigate to main tab screen (after login)
2. adb shell screencap -p /sdcard/tabs.png && adb pull /sdcard/tabs.png tabs.png
3. Examine screenshot — identify bottom tab bar with 5 tabs
4. Measure and record exact pixel coordinates:
   Dashboard tab: (____, ____)
   Fitness tab:   (____, ____)
   Nutrition tab: (____, ____)
   Goals tab:     (____, ____)
   Profile tab:   (____, ____)
5. USE THESE COORDINATES for all tab navigation in Phases 6-22.
   Never hardcode guessed coordinates — always use measured values.

═══════════════════════════════════════════════════════════════════
PHASE 6 — SCREEN-BY-SCREEN VERIFICATION (ALL 93 SCREENS)
═══════════════════════════════════════════════════════════════════
Goal: Every screen renders, shows real data, uses brand colors, has no crashes.

17-CHECK TESTING LOOP (apply to EVERY screen):
  1.  Renders without crash
  2.  Header/title correct
  3.  Skeleton loading visible during fetch
  4.  Real Supabase data shown (not placeholder)
  5.  Branded empty state when no data
  6.  Error toast + retry on network failure
  7.  All touch targets >= 44pt
  8.  Press feedback on all buttons
  9.  Actions (submit, create, delete) work end-to-end
  10. Back navigation returns to correct parent
  11. Pull-to-refresh triggers re-fetch
  12. Background is #0C0A15 (Deep Space)
  13. Primary actions use #A855F7 (Vivid Purple)
  14. No placeholder text visible ("Lorem ipsum", "Coming soon", etc.)
  15. No mock/hardcoded data visible
  16. Network calls appear in logcat during data load
  17. AI features (if any) are wired and return real results

For each screen: adb logcat -c → navigate → wait 2.5s → screenshot → dump errors → apply 17 checks → fix any failure → npx tsc --noEmit --pretty.

GROUP A — Auth (13 screens):
  (auth)/login
  (auth)/register
  (auth)/forgot-password
  (auth)/callback
  (auth)/onboarding/welcome
  (auth)/onboarding/profile
  (auth)/onboarding/goals
  (auth)/onboarding/fitness
  (auth)/onboarding/notifications
  (auth)/onboarding/nutrition
  (auth)/onboarding/business
  (auth)/onboarding/partner
  (auth)/onboarding/ready
  Commit: "test(screens-groupA): auth screens verified"

GROUP B — Dashboard (1 screen):
  (tabs)/dashboard
  Verify: readiness score, day score, streaks, recent workouts, macro rings — all live data.
  Commit: "test(screens-groupB): dashboard verified"

GROUP C — Fitness (14 screens):
  (tabs)/fitness/index
  (tabs)/fitness/exercises
  (tabs)/fitness/exercise-detail
  (tabs)/fitness/workout-player
  (tabs)/fitness/workout-summary
  (tabs)/fitness/progress
  (tabs)/fitness/progress-photos
  (tabs)/fitness/programs
  (tabs)/fitness/marketplace
  (tabs)/fitness/form-check
  (tabs)/fitness/posture-check
  (tabs)/fitness/supplement-scanner
  (tabs)/fitness/pain-tracker
  (tabs)/fitness/mobility
  Commit: "test(screens-groupC): fitness screens verified"

GROUP D — Nutrition (11 screens):
  (tabs)/nutrition/index
  (tabs)/nutrition/add-food
  (tabs)/nutrition/meal-camera
  (tabs)/nutrition/barcode-scanner
  (tabs)/nutrition/menu-scanner
  (tabs)/nutrition/saved-meals
  (tabs)/nutrition/meal-prep
  (tabs)/nutrition/meal-plans
  (tabs)/nutrition/supplements
  (tabs)/nutrition/grocery-list
  (tabs)/nutrition/analytics
  Commit: "test(screens-groupD): nutrition screens verified"

GROUP E — Goals (28 screens):
  (tabs)/goals/index
  (tabs)/goals/[id]
  (tabs)/goals/habits
  (tabs)/goals/mood
  (tabs)/goals/journal
  (tabs)/goals/sleep
  (tabs)/goals/skills
  (tabs)/goals/affirmations
  (tabs)/goals/vision-board
  (tabs)/goals/health-roi
  (tabs)/goals/insights
  (tabs)/goals/focus-mode
  (tabs)/goals/challenges
  (tabs)/goals/challenge-active
  (tabs)/goals/challenge-builder
  (tabs)/goals/challenge-detail
  (tabs)/goals/community
  (tabs)/goals/stake-goals
  (tabs)/goals/retrospective
  (tabs)/goals/business/index
  (tabs)/goals/business/revenue
  (tabs)/goals/business/milestones
  (tabs)/goals/business/customers
  (tabs)/goals/finance/index
  (tabs)/goals/finance/transactions
  (tabs)/goals/finance/budgets
  (tabs)/goals/finance/net-worth
  Commit: "test(screens-groupE): goals screens verified"

GROUP F — Profile (11 screens):
  (tabs)/profile/index
  (tabs)/profile/about
  (tabs)/profile/edit-profile
  (tabs)/profile/achievements
  (tabs)/profile/integrations
  (tabs)/profile/wearables
  (tabs)/profile/nfc-setup
  (tabs)/profile/notifications-settings
  (tabs)/profile/dashboard-builder
  (tabs)/profile/data-export
  (tabs)/profile/partner
  Commit: "test(screens-groupF): profile screens verified"

GROUP G — Labs (3 screens):
  labs/index
  labs/upload
  labs/detail
  Commit: "test(screens-groupG): labs screens verified"

GROUP H — Partner (4 screens):
  partner/dashboard
  partner/challenges
  partner/live-workout
  partner/nudge
  Commit: "test(screens-groupH): partner screens verified"

GROUP I — Top-level (9 screens):
  index
  chat
  chat-history
  daily-briefing
  weekly-review
  upgrade
  trajectory
  goal-cinema
  error
  Commit: "test(screens-groupI): top-level screens verified"

═══════════════════════════════════════════════════════════════════
PHASE 7 — AI FEATURES (17 FEATURES)
═══════════════════════════════════════════════════════════════════
Goal: Every AI feature reads real user data, calls the correct edge function, displays results.

For each feature: read service file → read edge function → test on emulator → fix if broken → TypeScript check → commit.

1.  formCheck.ts → ai-form-check → fitness/form-check.tsx
2.  mealCamera.ts (analyzeMealPhoto) → ai-meal-analysis → nutrition/meal-camera.tsx
3.  labs.ts → ai-lab-interpret (+ lab-uploads bucket) → labs/upload.tsx
4.  supplement.ts → ai-supplement-scanner → fitness/supplement-scanner.tsx
5.  progressPhoto.ts → ai-progress-photo → fitness/progress-photos.tsx
6.  mealCamera.ts (analyzeMenuPhoto) → ai-menu-scan → nutrition/menu-scanner.tsx
7.  mealPrep.ts → ai-meal-prep → nutrition/meal-prep.tsx
8.  groceryList.ts → ai-grocery-list → nutrition/grocery-list.tsx
9.  sleepOptimizer.ts → ai-sleep-optimizer → goals/sleep.tsx
10. trajectory.ts → ai-trajectory → app/trajectory.tsx
11. healthRoi.ts → ai-health-roi → goals/health-roi.tsx
12. workoutNarrator.ts → ai-workout-narrator → fitness/workout-player.tsx
13. [posture check service] → ai-posture-analysis → fitness/posture-check.tsx
14. correlation.ts → ai-correlation → goals/insights.tsx
15. adaptive.ts → ai-adaptive-program → fitness/programs.tsx

SCAFFOLDED — MUST FULLY IMPLEMENT:
16. challengeCoach.ts:
    Read file → implement supabase.functions.invoke('challenge-coach')
    Pass: {userId, challengeType, dayNumber, completionRate}
    Display tip on challenge-active.tsx
    TypeScript check → commit: "feat(ai): implement challenge coach"

17. compliance.ts:
    Read file → identify compliance feature → implement real Claude call
    Wire to correct screen → TypeScript check
    Commit: "feat(ai): implement compliance advisor"

AI CHAT COACH:
- Verify FAB visible on all 5 tabs → tap → chat.tsx opens
- Send: "What should I eat for my next meal based on my macros today?"
- Verify response is personalized (mentions real logged macros, not generic advice)
- Verify ai_chat_messages record created in Supabase

CONTEXT BUILDER (CRITICAL):
- Read: apps/mobile/services/ai/context.ts → buildUserAIContext(userId)
- Verify aggregates: profile, last 7 days workouts, nutrition, sleep, mood, habits, challenges, streaks, subscription tier, coaching tone
- Add any missing data types
- Verify passed to ALL AI edge function calls

MODEL VERIFICATION:
- grep -r "model:" C:\dev\transformr\supabase\functions --include="*.ts"
- Expected: claude-sonnet-4-20250514 in every AI function
- Fix any wrong model, commit: "fix(ai): all edge functions use claude-sonnet-4-20250514"

═══════════════════════════════════════════════════════════════════
PHASE 8 — STUB ELIMINATION
═══════════════════════════════════════════════════════════════════
Goal: Zero stubs, TODOs, or unimplemented features in production code.

1. Run:
   grep -rn "TODO\|FIXME\|stub\|coming soon\|not implemented" apps/mobile/src apps/mobile/app --include="*.tsx" --include="*.ts" | grep -v node_modules
2. For each result: read the full file → implement real functionality → TypeScript check
3. Commit after each group: "fix(stubs): implement [feature name]"

═══════════════════════════════════════════════════════════════════
PHASE 9 — BUTTON & INTERACTION AUDIT
═══════════════════════════════════════════════════════════════════
Goal: Every interactive element performs a real action.

- Every onPress must navigate, submit, or perform a real action
- Test all FABs, navigation arrows, list items, form submissions, pull-to-refresh
- Find empty handlers:
  grep -rn "onPress={()}" apps/mobile --include="*.tsx" | grep -v node_modules
  grep -rn "onPress={() => {}}" apps/mobile --include="*.tsx" | grep -v node_modules
- Fix any empty or broken handlers
- Commit: "fix(interactions): all buttons and press handlers wired"

═══════════════════════════════════════════════════════════════════
PHASE 10 — CRUD ALL 14 ENTITIES
═══════════════════════════════════════════════════════════════════
Goal: Create, read, update, delete for all core data types using real test data.

WORKOUT:
  Start workout → add exercises:
    Bench Press: 4 sets × 8 reps @ 185 lbs
    Incline DB Press: 3 sets × 10 reps @ 65 lbs
    Lateral Raises: 3 sets × 15 reps @ 25 lbs
  Complete → verify workout_sessions + workout_sets in Supabase
  Expected volume: 8,870 lbs — verify shown in summary screen
  Name: "Push Day — Chest & Shoulders"

NUTRITION:
  Add Food → Meal type: Post-WO
    Chicken Breast 6oz: 281 cal / 52g P / 0g C / 6g F
    Brown Rice 1 cup: 216 cal / 5g P / 45g C / 2g F
    Broccoli 1 cup: 55 cal / 4g P / 11g C / 0g F
  Verify totals: 552 cal / 61g protein / 56g carbs / 8g fat
  Verify nutrition_logs record in Supabase

GOALS:
  Create new goal:
    "Goal title" = "Gain 40 lbs of lean mass"
    "What does success look like?" = "Be 180lbs at 15% body fat by October 2027"
    "MM/DD/YYYY" = 10/01/2027
  Verify goals record in Supabase

HABITS:
  Create: "Drink 1 gallon of water daily", Daily frequency
  Check off for today → verify habit_completions record

SLEEP:
  Log: Bedtime 11:15 PM, Wake 7:00 AM
  Verify shows 7h 45m (midnight crossing must be handled correctly — NOT 3h 45m)
  Verify sleep_logs record

MOOD:
  Log: "Good energy today after 8 hours sleep"
  Verify mood_logs record

WEIGHT:
  Log: 142 lbs
  Verify weight_logs record

JOURNAL:
  "What went well today?" = "Hit all my gym sessions"
  "What was challenging?" = "Missed protein target by 20g"
  "What are you grateful for?" = "Grateful for the consistency"
  Verify journal_entries record

SUPPLEMENTS:
  Add: Creatine Monohydrate, 5g
  Log intake → verify supplement_logs record

LABS:
  "e.g., Q2 Annual Physical" = Q2 Annual Physical
  "Quest, LabCorp, etc." = Quest Diagnostics
  Date: 04/01/2026
  Verify lab_reports record

BUSINESS:
  Log revenue entry for Automate AI LLC
  Verify business_revenue record

FINANCE:
  Add transaction → verify finance_transactions record

CHALLENGES:
  Join a challenge → log daily completion → verify challenge_daily_logs record

WATER:
  Log water intake from nutrition screen → verify water_logs record

Commit: "test(crud): all 14 entities CRUD verified with real test data"

═══════════════════════════════════════════════════════════════════
PHASE 11 — CROSS-ENTITY WORKFLOWS
═══════════════════════════════════════════════════════════════════
Goal: Full-day workflows produce correct cross-entity results.

MORNING ROUTINE:
  1. Dashboard → note readiness score (record value)
  2. AI Chat FAB → "What should I train today?" → verify personalized response (not generic)
  3. Fitness → Start workout → log 3 exercises → complete
     Verify summary shows volume = 8,870 lbs
  4. Nutrition → log Post-WO meal → verify 552 cal / 61g P / 56g C / 8g F
  5. Goals → check 2 habits → verify day score updates on dashboard

EVENING ROUTINE:
  1. Goals → Mood → log mood note
  2. Goals → Journal → fill all 3 reflection fields
  3. Goals → Sleep → log 11:15 PM → 7:00 AM
  4. Verify daily_checkins record created

WEEKLY REVIEW:
  Navigate to weekly-review screen
  Verify AI generates summary covering actual logged data (not placeholder text)
  Commit: "test(workflows): cross-entity workflows verified"

═══════════════════════════════════════════════════════════════════
PHASE 12 — CALCULATION VERIFICATION
═══════════════════════════════════════════════════════════════════
Goal: All math is correct. No off-by-one errors. No rounding bugs.

MACRO MATH:
  Log: 281+216+55 = 552 cal, 52+5+4 = 61g P, 0+45+11 = 56g C, 6+2+0 = 8g F
  Verify UI shows exactly: 552 cal, 61g protein, 56g carbs, 8g fat

WORKOUT VOLUME:
  Bench:   4 × 8 × 185 = 5,920 lbs
  Incline: 3 × 10 × 65 = 1,950 lbs (verify formula — some logs use 2×10×65+1×10×60)
  Lateral: 3 × 15 × 25 = 1,125 lbs (verify formula)
  Expected total shown in summary: 8,870 lbs
  If sum differs: check sets data in Supabase and trace rounding

SLEEP DURATION:
  11:15 PM → 7:00 AM = 7h 45m (crosses midnight)
  Verify sleep screen shows 7h 45m, NOT 3h 45m or 15h 45m

STREAKS:
  Complete habit today → streak increments by exactly 1
  Verify no off-by-one (streak 0 → 1, not 0 → 2)

READINESS SCORE:
  After logging 7h 45m sleep and positive mood → expect score in 70-90 range
  Verify dashboard shows score (not 0, not null)
  Read: apps/mobile/services/calculations/ — verify readiness algorithm

BMR/TDEE:
  Read: apps/mobile/services/calculations/bmr.ts
  Verify Mifflin-St Jeor or Harris-Benedict formula is physiologically correct
  Check result is in reasonable range (1200-3500 kcal/day)

Commit: "test(calculations): all calculation outputs verified correct"

═══════════════════════════════════════════════════════════════════
PHASE 13 — GAMIFICATION
═══════════════════════════════════════════════════════════════════
Goal: All gamification systems increment correctly and display in real-time.

STREAKS:
  Complete a habit → verify user_streaks table incremented
  Verify streak-calculator edge function invoked (check logcat)
  Verify dashboard streak count updates without full reload

ACHIEVEMENTS:
  Complete a workout → verify achievement-evaluator edge function fires
  Navigate Profile → Achievements → verify new achievement unlocked
  Verify celebration animation plays on unlock
  Verify achievements record in Supabase

DAY SCORE:
  Log workout + meal + habit check → verify dashboard day score updates in real-time
  Score should increase with each logged item

CHALLENGES:
  Join a challenge → log daily completion → verify progress bar updates
  Verify challenge_daily_logs record created
  Verify completion percentage matches (days_done / total_days)

LEADERBOARDS:
  Goals → Community → verify leaderboard visible (Pro gate if applicable)
  Verify current user appears after logging activities
  Commit: "test(gamification): streaks, achievements, day score, challenges, leaderboards verified"

═══════════════════════════════════════════════════════════════════
PHASE 14 — PARTNER / COUPLES
═══════════════════════════════════════════════════════════════════
Goal: All partner features work end-to-end.

1. Profile → Partner → enter invite code field "e.g. TRFM-ABC123" → test invitation flow
2. Partner Dashboard → verify partner data is visible (not empty)
3. Send nudge → verify partner_nudges record created in Supabase
4. Partner Live Workout → verify live_workout_sync Realtime channel connects (check logcat)
5. Deep link test:
   adb shell am start -W -a android.intent.action.VIEW -d "com.automateai.transformr://partner/join?code=TRFM-TEST01" com.automateai.transformr
   Verify partner linking screen opens with code TRFM-TEST01 pre-filled in the field
6. Fix any broken partner flows. Commit: "test(partner): partner and couples features verified"

═══════════════════════════════════════════════════════════════════
PHASE 15 — SUBSCRIPTION TIER GATING
═══════════════════════════════════════════════════════════════════
Goal: Feature gates enforce Free/Pro/Elite/Partners tiers correctly.

1. Read: apps/mobile/hooks/useFeatureGate.ts
2. As free user:
   - Access ai_meal_camera: first 5 uses/month → works
   - Access ai_meal_camera: >5 uses/month → upgrade prompt shows ($9.99 Pro)
   - Access stake_goals → upgrade prompt for Pro tier
   - Access vision_board → upgrade prompt for Pro tier
   - Access goal_cinema → upgrade prompt for Pro tier
   - Access wearables → upgrade prompt for Pro tier
   - ai_chat_coach: at message 10 in a day → "Daily limit reached" shown (not crash)
3. upgrade.tsx → verify screen loads with 3 tier options:
   Pro: $9.99/month
   Elite: $14.99/month
   Partners: $19.99/month
4. Verify pricing text matches subscription tiers exactly
5. "Maybe Later" dismisses upgrade modal without crash
6. Verify subscriptionStore.tier reflects actual Supabase user record
7. Commit: "test(gating): subscription tier gating verified"

═══════════════════════════════════════════════════════════════════
PHASE 16 — NOTIFICATIONS
═══════════════════════════════════════════════════════════════════
Goal: Push notifications deliver and deep-link correctly.

1. Grant permission:
   adb shell pm grant com.automateai.transformr android.permission.POST_NOTIFICATIONS
2. Navigate: Profile → Notifications Settings
3. Schedule a workout reminder for +2 minutes from now
4. Wait for notification to appear → verify it arrives
5. Tap notification → verify navigates to correct screen (fitness tab or workout screen)
6. Verify notification channels exist:
   - default
   - workout
   - nutrition
   - partner
7. Fix any notification issues. Commit: "test(notifications): push notification system verified"

═══════════════════════════════════════════════════════════════════
PHASE 17 — FILE UPLOADS (4 BUCKETS)
═══════════════════════════════════════════════════════════════════
Goal: All 4 Supabase storage buckets accept uploads and trigger AI analysis.

1. progress-photos bucket:
   Fitness → Progress Photos → Add → select image from device
   Verify: upload completes → photo appears in grid → Supabase storage record exists
   Verify: AI progress analysis triggered (check logcat for edge function call)

2. form-check-videos bucket:
   Fitness → Form Check → Record video (or upload)
   Verify: upload completes → Supabase storage record exists
   Verify: AI form analysis triggered and result displayed

3. lab-uploads bucket:
   Labs → Upload → select lab report image
   Verify: upload completes → Supabase storage record exists
   Verify: AI lab interpretation triggered and result displayed

4. goal-images bucket:
   Goals → Vision Board → Add image
   Verify: upload completes → image displayed in vision board grid
   Verify: Supabase storage record exists

Commit: "test(storage): all 4 storage buckets verified — uploads and AI triggers working"

═══════════════════════════════════════════════════════════════════
PHASE 18 — EDGE CASES
═══════════════════════════════════════════════════════════════════
Goal: All edge cases handled gracefully — no crashes.

1.  Empty workout submit → validation error shown (not crash)
2.  0-calorie meal entry → UI shows "0 cal" (not crash, not blank)
3.  Workout with 0 sets → validation error or empty state (not crash)
4.  Negative weight input (e.g. -5 lbs) → validation error shown
5.  500-character journal entry → saves successfully, no truncation
6.  Rapid double-tap Log Workout button → NO duplicate entries in Supabase
7.  Force close during active workout → relaunch → workout sets still present
8.  Switch tabs during AI processing → result available on return to original screen
9.  Scroll through 50+ exercise list → smooth performance, no dropped frames
10. Empty filter on habit list → "No habits match" message shown (not blank screen)

Commit: "test(edge-cases): all 10 edge cases handled gracefully"

═══════════════════════════════════════════════════════════════════
PHASE 19 — DATA PERSISTENCE
═══════════════════════════════════════════════════════════════════
Goal: Data survives force-close and sign-out/sign-in cycles.

FORCE-CLOSE PERSISTENCE:
1. Log: workout session + Post-WO meal + 2 habit checks + journal entry
2. Force stop: adb shell am force-stop com.automateai.transformr
3. Relaunch: adb shell am start -n com.automateai.transformr/.MainActivity
4. Navigate to each section → verify all logged data still present

SIGN-OUT/SIGN-IN PERSISTENCE:
5. Sign out from Profile → returns to login screen
6. Sign back in with same account credentials
7. Navigate to Fitness, Nutrition, Goals, Journal → verify all data present
8. Verify data loads from Supabase (not just local cache)

Commit: "test(persistence): data persistence verified across force-close and sign-out/sign-in"

═══════════════════════════════════════════════════════════════════
PHASE 20 — OFFLINE, DARK MODE, ACCESSIBILITY, PERFORMANCE, NETWORK ERRORS
═══════════════════════════════════════════════════════════════════
Goal: App is robust across network conditions, accessible, and performant.

OFFLINE MODE:
1. Enable airplane mode:
   adb shell settings put global airplane_mode_on 1 && adb shell am broadcast -a android.intent.action.AIRPLANE_MODE
2. Verify offline indicator shown (offlineSyncStore.isOnline = false)
3. Log a workout set → verify pendingCount > 0 in store
4. Re-enable network:
   adb shell settings put global airplane_mode_on 0 && adb shell am broadcast -a android.intent.action.AIRPLANE_MODE
5. Verify sync fires automatically → pendingCount returns to 0
6. Verify synced items appear in Supabase

DARK MODE:
- Verify ALL screens: background is #0C0A15, text is readable (high contrast)
- No white or light backgrounds on any screen
- Verify #A855F7 used for all primary actions, active tabs, and highlights

ACCESSIBILITY:
- Verify major interactive elements have accessibilityLabel set
- Verify all touch targets are >= 44×44 points
- Run checks on Dashboard, Fitness index, Nutrition index, Goals index, Profile
- Fix any violations: commit "fix(a11y): accessibility improvements"

PERFORMANCE:
- Scroll through 50+ exercise list → smooth, no visible jank
- Navigate all 5 tabs rapidly (tap each in sequence 3 times) → no lag or freeze
- Send AI chat message → response arrives within 10 seconds

NETWORK ERRORS:
- Simulate 500 error → verify toast "Server error, please try again" + retry button shown
- Simulate 401 error → verify automatic redirect to login screen
- Simulate timeout → verify "Unable to connect" message shown (not crash)

Commit: "test(nfr): offline sync, dark mode, accessibility, performance, network error handling verified"

═══════════════════════════════════════════════════════════════════
PHASE 21 — BRAND ELEVATION SWEEP
═══════════════════════════════════════════════════════════════════
Goal: 100% brand consistency — every pixel is TRANSFORMR, not generic.

1. Every primary action button uses #A855F7 (not blue, not grey, not white)
2. Tab bar active tab indicator is #A855F7
3. Loading skeletons visible on all data screens during fetch (not blank/white)
4. Glass morphism card backgrounds: rgba(22,18,42,0.88) throughout
5. Splash screen: #0C0A15 background with #A855F7 elements
6. Check for forbidden colors used as primary brand color:
   grep -rn "#0243D5\|#1A56DB" apps/mobile --include="*.tsx" --include="*.ts" | grep -v node_modules
   Fix any instance used as primary/brand color (note: these colors ARE allowed as semantic info/grade indicators only)
7. Verify AI badge (gradient purple pill) visible on all AI-generated content cards
8. Verify no generic grey buttons remain on any of the 93 screens
9. Commit: "fix(brand): brand elevation sweep — all screens 100% TRANSFORMR purple"

═══════════════════════════════════════════════════════════════════
PHASE 22 — CODE QUALITY SWEEP
═══════════════════════════════════════════════════════════════════
Goal: Zero code quality violations. Production-grade codebase.

Run full quality gate — fix ALL issues found, then re-run to confirm zero:

TYPESCRIPT (must be 0 errors):
  cd apps/mobile && npx tsc --noEmit --pretty

EMPTY ONPRESS (must be 0):
  grep -rn "onPress={()}" apps/mobile --include="*.tsx" | grep -v node_modules
  grep -rn "onPress={() => {}}" apps/mobile --include="*.tsx" | grep -v node_modules

FORBIDDEN BRAND COLORS AS PRIMARY (must be 0):
  grep -rn "#0243D5\|#1A56DB" apps/mobile --include="*.tsx" --include="*.ts" | grep -v node_modules

CONSOLE.LOG (must be 0 outside __DEV__ guard):
  grep -rn "console\.log" apps/mobile/src apps/mobile/app --include="*.tsx" --include="*.ts" | grep -v "__DEV__\|node_modules\|__tests__"

TODO/FIXME/STUB (must be 0 in production code):
  grep -rn "TODO\|FIXME\|HACK\|stub\|coming soon" apps/mobile/src apps/mobile/app --include="*.tsx" --include="*.ts" | grep -v node_modules

ANY TYPES (must be 0):
  grep -rn ": any[^A-Za-z]" apps/mobile/src apps/mobile/app --include="*.ts" --include="*.tsx" | grep -v node_modules

TS-IGNORE / TS-EXPECT-ERROR (must be 0):
  grep -rn "@ts-ignore\|@ts-expect-error" apps/mobile/src apps/mobile/app --include="*.ts" --include="*.tsx" | grep -v node_modules

Fix every issue found. Re-run each grep to confirm zero.
Commit: "fix(quality): code quality sweep — all metrics at zero"

═══════════════════════════════════════════════════════════════════
PHASE 23 — FINAL LOGCAT SWEEP + LAUNCH CERTIFICATION
═══════════════════════════════════════════════════════════════════
Goal: Zero JS errors in final end-to-end navigation. Generate certification report.

FINAL LOGCAT TEST:
1. adb logcat -c
2. Navigate through all 5 tabs (Dashboard → Fitness → Nutrition → Goals → Profile)
3. Open AI chat FAB → send message → wait for response
4. Navigate back to Dashboard
5. adb logcat -d ReactNativeJS:V JS:E *:S 2>&1
6. Expected: ZERO JS errors, ZERO unhandled promise rejections, ZERO crashes
7. If any errors found: fix immediately, re-run logcat test

FINAL COMMIT AND PUSH:
git add -A
git commit -m "test(transformr): launch verification complete — 23 phases, all 93 screens verified, all AI features wired, 14 entities CRUD-tested"
git push origin dev

═══════════════════════════════════════════════════════════════════
TRANSFORMR — LAUNCH CERTIFICATION REPORT
═══════════════════════════════════════════════════════════════════
Date:               [timestamp]
Branch:             dev
Bundle ID:          com.automateai.transformr

GOVERNANCE:
  SOUL.md:               [ CREATED / EXISTED ] ✓
  CONFIGURATION_LOCK.md: [ CREATED / EXISTED ] ✓

PHASE RESULTS:
  Phase 0  — Governance:               [ PASS / FAIL ]
  Phase 1  — Known Issues Fixed:       [ PASS / FAIL ] — [N] fixes applied
  Phase 2  — Database/AI:              [ PASS / FAIL ]
  Phase 3  — App Launch:               [ PASS / FAIL ]
  Phase 4  — Auth:                     [ PASS / FAIL ]
  Phase 5  — Tab Discovery:            [ PASS / FAIL ]
  Phase 6  — Screens (93):             [ PASS / FAIL ] — [N] fixed, [N] blocked
  Phase 7  — AI Features (17):         [ PASS / FAIL ] — [N] working, [N] implemented
  Phase 8  — Stub Elimination:         [ PASS / FAIL ] — [N] stubs eliminated
  Phase 9  — Interactions:             [ PASS / FAIL ]
  Phase 10 — CRUD (14 entities):       [ PASS / FAIL ]
  Phase 11 — Workflows:                [ PASS / FAIL ]
  Phase 12 — Calculations:             [ PASS / FAIL ]
  Phase 13 — Gamification:             [ PASS / FAIL ]
  Phase 14 — Partner/Couples:          [ PASS / FAIL ]
  Phase 15 — Subscription Gates:       [ PASS / FAIL ]
  Phase 16 — Notifications:            [ PASS / FAIL ]
  Phase 17 — File Uploads (4 buckets): [ PASS / FAIL ]
  Phase 18 — Edge Cases:               [ PASS / FAIL ]
  Phase 19 — Data Persistence:         [ PASS / FAIL ]
  Phase 20 — Offline/Dark/Perf/Net:    [ PASS / FAIL ]
  Phase 21 — Brand Elevation:          [ PASS / FAIL ]
  Phase 22 — Code Quality:             [ PASS / FAIL ]
  Phase 23 — Final Logcat:             [ PASS / FAIL ]

CODE QUALITY:
  TypeScript errors:     [N]   (target: 0)
  Empty onPress:         [N]   (target: 0)
  Wrong brand colors:    [N]   (target: 0)
  console.log:           [N]   (target: 0)
  TODO/FIXME/stub:       [N]   (target: 0)
  any types:             [N]   (target: 0)
  @ts-ignore:            [N]   (target: 0)

COVERAGE:
  Screens verified:       [N]/93
  AI features working:    [N]/17
  Entities CRUD-tested:   [N]/14
  Storage buckets:        [N]/4
  Edge functions healthy: [N]/49

FINAL LOGCAT: [ CLEAN — 0 errors / N errors found ]

TOTAL COMMITS: [N]
TOTAL PHASES:  23/23

MANUAL ACTIONS REQUIRED FOR TYSON:
  Stripe live keys — stake goals + subscription payments need real keys from Stripe Dashboard
  EAS project ID — needed for production OTA updates and push notifications
  Spotify client ID — needed for Spotify music integration
  Apple Sign-In — test on real iOS device (not testable on Android emulator)
  NFC features — require physical NFC hardware
  Apple Watch companion — requires paired Apple Watch
  Wearable OAuth (Garmin/Fitbit) — requires developer credentials from those platforms

REMAINING BLOCKERS:
  [ List any items that CANNOT be fixed without Tyson's credentials or external setup ]
  [ If none: "None — app is ready for production deployment" ]

═══════════════════════════════════════════════════════════════════
OVERALL VERDICT: [ READY FOR APP STORE / NOT READY — [N] blockers remaining ]

READY means:
  All 93 screens render without crashes
  All 17 AI features return personalized results (using real user data in context)
  All 14 entities create/read/update/delete correctly in Supabase
  All calculations produce mathematically correct results
  0 TypeScript errors
  0 JS errors in final logcat sweep
  Brand is 100% TRANSFORMR purple (#A855F7) throughout
  Feature gates correctly enforce Free/Pro/Elite/Partners tiers
  Offline queue syncs on reconnect
  All 4 storage buckets functional

THIS IS TYSON'S PRODUCT. EVERY FEATURE MATTERS.
93 SCREENS. 17 AI FEATURES. 14 ENTITIES. 49 EDGE FUNCTIONS.
7 LIFE PILLARS. 86 TABLES. 1 STANDARD: CATEGORY LEADER.

DO NOT STOP UNTIL ALL 23 PHASES COMPLETE AND CERTIFICATION READS READY.
═══════════════════════════════════════════════════════════════════
