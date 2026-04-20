# TRANSFORMR — Functional Verification Protocol
**Bundle ID:** com.automateai.transformr  
**Main Activity:** .MainActivity  
**Branch:** dev  
**Root:** C:\dev\transformr  
**Mobile:** C:\dev\transformr\apps\mobile  
**Package Manager:** npm  

---

## SECTION 1 — IRON-CLAD RULES

```
NEVER run taskkill, Stop-Process, kill, or any process-killing command.
NEVER remove features, screens, components, navigation, or functionality.
NEVER downgrade, stub, minimize, or workaround anything.
NEVER hardcode values. NEVER guess. NEVER use placeholders.
NEVER trigger EAS builds — that is Tyson's decision only.
NEVER push to main — working branch is dev.
NEVER install new packages without explicit approval — package.json is locked.
ADD and FIX ONLY. Every change must be production-grade and complete.
If something is broken: fix it fully and correctly. Never remove it.
Branch: dev | Root: C:\dev\transformr | Mobile: apps\mobile
Package manager: npm | TypeScript: npx tsc --noEmit --pretty
Read every file before modifying it. Commit after every logical group of fixes.
```

---

## SECTION 2 — MANDATORY STARTUP

Before any testing begins, complete all of the following:

1. Read `C:\dev\transformr\CLAUDE.md` — preservation directives and safe-edit protocol
2. Read `C:\dev\transformr\SOUL.md` — if missing, create with placeholder noting it was not found
3. Read `C:\dev\transformr\CONFIGURATION_LOCK.md` — if missing, create with placeholder noting it was not found
4. Read `C:\dev\transformr\GUNNAR_GUARDRAILS.md` — if missing, flag to developer, do not invent content
5. Confirm current branch is `dev`:
   ```bash
   cd C:\dev\transformr && git branch --show-current
   ```
6. Confirm emulator is running and responsive:
   ```bash
   adb devices
   adb shell am start -n com.automateai.transformr/.MainActivity
   ```
7. Confirm Metro bundler is running. If not, start it:
   ```bash
   cd C:\dev\transformr\apps\mobile && npx expo start --port 8081
   ```
8. Run TypeScript baseline check — record error count before any changes:
   ```bash
   cd C:\dev\transformr\apps\mobile && npx tsc --noEmit --pretty 2>&1 | tail -5
   ```
9. Confirm git status is clean on `dev`:
   ```bash
   cd C:\dev\transformr && git status
   ```

Do NOT proceed to testing until all 9 steps complete without blocking errors.

---

## SECTION 3 — CRITICAL KNOWN ISSUES

The following integrations use placeholder or missing credentials and require graceful fallback verification. Do NOT attempt to complete real payments or real API calls for these. Verify that the app handles unavailability gracefully (no crash, user-friendly message).

### 3.1 Stripe (Payments)
- **Status:** Placeholder keys — `pk_live_xxxxx`, `sk_live_xxxxx`
- **Service:** `apps/mobile/services/stripe.ts`
- **Functions affected:** `createStakePayment`, `captureStake`, `cancelStakeHold`, `setupStripeCustomer`, `createSubscription`
- **Expected behavior:** Stake goals screen loads without crash. Payment form renders. On submit attempt, shows a user-readable error message (not a raw exception). Upgrade subscription screen loads correctly and shows tier options.
- **Blocked action:** Real payment completion requires real Stripe keys — Tyson's decision only.

### 3.2 Spotify Integration
- **Status:** May not be configured
- **Expected behavior:** If Spotify is unavailable, app shows graceful fallback (no crash, optional feature disabled state). Workout player continues to function without Spotify.

### 3.3 OpenWeather Integration
- **Status:** Key may be missing or placeholder
- **Expected behavior:** Dashboard or readiness screen that uses weather data shows graceful fallback (no crash). Other dashboard widgets unaffected.

### 3.4 Apple Sign-In
- **Status:** Not testable on Android emulator
- **Expected behavior:** Apple sign-in button is hidden on Android or shows a platform-appropriate message. No crash.

---

## SECTION 4 — TEST DATA

Use these exact values when filling forms during verification. Field labels are as they appear in the UI.

### 4.1 Workout Session
| UI Field Label | Test Value |
|---|---|
| Session Name / Workout Name | Push Day — Chest & Shoulders |
| Duration | 52 min |
| Notes | Felt strong today. Increased bench by 5 lbs from last week. |

**Exercise 1 — Bench Press**
| Field | Value |
|---|---|
| Exercise | Bench Press |
| Set 1 | 8 reps @ 185 lbs |
| Set 2 | 8 reps @ 185 lbs |
| Set 3 | 8 reps @ 185 lbs |
| Set 4 | 8 reps @ 185 lbs |

**Exercise 2 — Incline DB Press**
| Field | Value |
|---|---|
| Exercise | Incline DB Press |
| Set 1 | 10 reps @ 65 lbs |
| Set 2 | 10 reps @ 65 lbs |
| Set 3 | 10 reps @ 60 lbs |

**Exercise 3 — Lateral Raises**
| Field | Value |
|---|---|
| Exercise | Lateral Raises |
| Set 1 | 15 reps @ 25 lbs |
| Set 2 | 15 reps @ 25 lbs |
| Set 3 | 15 reps @ 20 lbs |

### 4.2 Nutrition / Meal Log
| UI Field Label | Test Value |
|---|---|
| Meal Type | Post-WO |

**Food Entry 1 — Grilled Chicken Breast**
| UI Field Label | Test Value |
|---|---|
| Search foods... / e.g. Grilled chicken breast | Grilled Chicken Breast |
| Serving Size | 6 oz |
| Calories | 281 |
| Protein g | 52 |
| Carbs g | 0 |
| Fat g | 6 |

**Food Entry 2 — Brown Rice**
| UI Field Label | Test Value |
|---|---|
| Search foods... / e.g. Grilled chicken breast | Brown Rice |
| Serving Size | 1 cup cooked |
| Calories | 216 |
| Protein g | 5 |
| Carbs g | 45 |
| Fat g | 2 |

**Food Entry 3 — Broccoli**
| UI Field Label | Test Value |
|---|---|
| Search foods... / e.g. Grilled chicken breast | Broccoli |
| Serving Size | 1 cup |
| Calories | 55 |
| Protein g | 4 |
| Carbs g | 11 |
| Fat g | 0 |

**Expected Meal Totals:** 552 cal / 61g protein / 56g carbs / 8g fat

### 4.3 Goal
| UI Field Label | Test Value |
|---|---|
| Goal title | Gain 40 lbs of lean mass |
| What does success look like? | Be 180 lbs at 15% body fat by October 2027 |
| MM/DD/YYYY (Target Date) | 10/01/2027 |
| Target Value | 180 lbs |

### 4.4 Habit
| UI Field Label | Test Value |
|---|---|
| Habit Name | Drink 1 gallon of water daily |
| Frequency | Daily |

### 4.5 Sleep Log
| UI Field Label | Test Value |
|---|---|
| Bedtime | 11:15 PM |
| Wake Time | 7:00 AM |
| Expected Duration | 7h 45m |

### 4.6 Body Metrics / Weight Log
| UI Field Label | Test Value |
|---|---|
| Weight lbs | 142 |

### 4.7 Journal Entry
| UI Field Label | Test Value |
|---|---|
| What went well today? | Hit all my gym sessions. Sleep was solid at 8 hours. |
| What was challenging? | Missed protein target on Tuesday by 20g. |
| What are you grateful for? | Grateful for the discipline to show up. |
| Write your thoughts... | Strong week overall. Staying consistent with morning workouts. |

### 4.8 Supplement
| UI Field Label | Test Value |
|---|---|
| e.g. Vitamin D3 (Name) | Creatine Monohydrate |
| e.g. 5000 IU (Dosage) | 5g |
| 0 (Cost USD) | 0.50 |
| e.g. 100 (Daily Cost) | 0.50 |

### 4.9 Mood Log
| UI Field Label | Test Value |
|---|---|
| What's on your mind? | Good energy today after 8 hours sleep |
| Mood Level | 8 (or highest positive option available) |

### 4.10 Lab Upload
| UI Field Label | Test Value |
|---|---|
| e.g., Q2 Annual Physical (Test Name) | Q2 Annual Physical |
| Quest, LabCorp, etc. (Lab Provider) | Quest Diagnostics |
| 2026-04-01 (Test Date) | 04/01/2026 |
| Anything to flag for the AI coach (Notes) | Checking testosterone and vitamin D levels. |

### 4.11 Business Revenue
| UI Field Label | Test Value |
|---|---|
| My Awesome Company (Business Name) | Automate AI LLC |
| Annual Revenue range | 0 – 10000 |

### 4.12 Partner Invite Code
| UI Field Label | Test Value |
|---|---|
| e.g. TRFM-ABC123 (Invite Code) | TRFM-TEST01 |

### 4.13 Registration
| UI Field Label | Test Value |
|---|---|
| What should we call you? | TestUser QA |
| you@example.com (Email) | qa+testuser@automateai.com |
| Create a strong password | TestPass2026! |
| Re-enter your password | TestPass2026! |

### 4.14 Onboarding Profile
| UI Field Label | Test Value |
|---|---|
| MM/DD/YYYY (Date of Birth) | 01/15/1995 |
| Feet | 5 |
| Inches | 10 |
| 175 (Weight lbs) | 142 |
| 165 (Goal Weight lbs) | 180 |

### 4.15 Edit Profile
| UI Field Label | Test Value |
|---|---|
| Your name | TestUser QA |
| MM/DD/YYYY (Date of Birth) | 01/15/1995 |
| 70 (Height cm) | 177 |
| 175 (Weight lbs) | 142 |
| 165 (Goal Weight lbs) | 180 |
| 2200 (Daily Calorie Target) | 2400 |
| 180 (Daily Protein Target) | 180 |

---

## SECTION 5 — AUTH VERIFICATION

For each test case, verify: correct brand colors on auth screens (purple `#A855F7`, background `#0C0A15`), error messages are user-friendly (no raw exceptions), and no crashes occur.

### Test 5.1 — Valid Sign In
1. Launch app to login screen
2. Enter email: `qa+testuser@automateai.com`
3. Enter password: `TestPass2026!`
4. Tap sign in
5. **Verify:** Dashboard loads, `authStore.user` is populated, `authStore.session` is not null

### Test 5.2 — Wrong Password
1. Enter email: `qa+testuser@automateai.com`
2. Enter password: `wrongpassword`
3. Tap sign in
4. **Verify:** Error message shown on screen (e.g., "Invalid login credentials"), user remains on login screen, no crash, no console exception visible to user

### Test 5.3 — Non-Existent Account
1. Enter email: `doesnotexist999@fake.com`
2. Enter password: `anypassword`
3. Tap sign in
4. **Verify:** Error message shown indicating account not found or invalid credentials, no crash

### Test 5.4 — Google Sign In (Android OAuth)
1. Tap "Sign in with Google" button
2. **Verify:** System OAuth sheet appears (Google account picker)
3. Complete OAuth flow with a real Google account
4. **Verify:** Dashboard loads, `authStore.user` populated with Google profile data
5. If OAuth unavailable: **Verify** graceful error shown, no crash

### Test 5.5 — Forgot Password
1. Tap "Forgot password?" or similar link on login screen
2. Enter email: `qa+testuser@automateai.com`
3. Tap submit
4. **Verify:** Confirmation message shown ("Check your email for reset instructions" or similar)
5. **Verify:** No crash, user-friendly copy, no raw Supabase error exposed

### Test 5.6 — New Registration
1. Navigate to registration screen
2. Fill all fields with Section 4.13 test data
3. Tap submit / create account
4. **Verify:** Email verification prompt shown OR direct login occurs
5. **Verify:** Onboarding flow begins if first login
6. **Verify:** `profiles` table has new record for this user

### Test 5.7 — Session Persistence
1. Sign in successfully
2. Force close app: `adb shell am force-stop com.automateai.transformr`
3. Relaunch: `adb shell am start -n com.automateai.transformr/.MainActivity`
4. **Verify:** App opens directly to dashboard (not login screen)
5. **Verify:** `authStore.user` is still populated without re-authenticating

### Test 5.8 — Token Refresh
1. Sign in successfully
2. Navigate normally for several minutes
3. Perform a data-fetching action (open workout list, open nutrition log)
4. **Verify:** Action succeeds (token refresh handled transparently)
5. **Verify:** No "unauthorized" error shown to user during normal use

### Test 5.9 — Sign Out
1. Navigate to Profile tab
2. Tap Sign Out
3. **Verify:** Returns to login screen
4. **Verify:** `authStore.user` is null
5. **Verify:** Attempting to navigate to protected screen redirects to login
6. **Verify:** MMKV persisted data cleared or not leaked to next session

### Test 5.10 — Rate Limiting
1. Attempt sign in with wrong password 5 times rapidly
2. **Verify:** Rate limit error shown if `authStore.rateLimitSeconds` is non-zero
3. **Verify:** No crash, user-friendly countdown message or explanation

---

## SECTION 6 — CRUD FOR EVERY ENTITY

For each entity: CREATE → READ → UPDATE → DELETE → VALIDATION. Check Supabase table after each write.

---

### 6.1 Workouts — `workout_sessions` + `workout_sets`

**CREATE**
1. Navigate to Fitness tab → Start Workout or + button
2. Set workout name: "Push Day — Chest & Shoulders"
3. Add Exercise 1: Bench Press — log 4 sets × 8 reps × 185 lbs
4. Add Exercise 2: Incline DB Press — log sets per Section 4.1
5. Add Exercise 3: Lateral Raises — log sets per Section 4.1
6. Set duration: 52 min
7. Add notes: "Felt strong today. Increased bench by 5 lbs from last week."
8. Tap Complete Workout
9. **Verify:** Summary screen shows workout name, total volume, exercise count
10. **Verify:** `workout_sessions` has new record; `workout_sets` has 11 records for this session

**READ**
1. Navigate to Fitness → Workout History
2. **Verify:** "Push Day — Chest & Shoulders" appears at top
3. Tap to open detail
4. **Verify:** All 3 exercises visible with correct sets/reps/weight

**UPDATE**
1. Open the workout detail
2. Edit notes to: "Updated: Great session, will repeat next week."
3. Save
4. **Verify:** Notes updated in list and Supabase

**DELETE**
1. Swipe to delete or use delete option on workout session
2. **Verify:** Removed from history list
3. **Verify:** `workout_sessions` record deleted or soft-deleted

**VALIDATION**
1. Attempt to complete workout with no exercises → expect validation error or warning
2. Enter negative weight (-10 lbs) → expect validation error
3. Enter 9999 reps → expect validation error or reasonable cap

---

### 6.2 Exercises — `exercises`

**CREATE (if custom exercise creation is supported)**
1. Navigate Fitness → Exercise Library → Add Custom Exercise
2. Enter exercise name: "Cable Fly"
3. Select muscle group: Chest
4. Save
5. **Verify:** Appears in exercise library search results
6. **Verify:** `exercises` table has new record

**READ**
1. Navigate Fitness → Exercise Library
2. Search: "Bench Press"
3. **Verify:** Bench Press appears in results with muscle group info
4. **Verify:** Tap to view exercise detail (description, instructions if present)

**UPDATE**
1. Open custom exercise "Cable Fly"
2. Edit or update a field if editing is supported
3. **Verify:** Change persists

**DELETE**
1. Delete "Cable Fly" custom exercise
2. **Verify:** No longer appears in library

**VALIDATION**
1. Attempt to save exercise with empty name → validation error

---

### 6.3 Meals / Nutrition — `nutrition_logs` + `foods`

**CREATE**
1. Navigate to Nutrition tab → Add Food or + button
2. Select Meal Type: Post-WO
3. Add Food 1: Search "Grilled Chicken Breast" or enter manually with values from Section 4.2
4. Add Food 2: Brown Rice (values from Section 4.2)
5. Add Food 3: Broccoli (values from Section 4.2)
6. Tap Log / Save
7. **Verify:** Meal appears in today's nutrition log
8. **Verify:** Daily totals show 552 cal / 61P / 56C / 8F for this meal
9. **Verify:** `nutrition_logs` has new record(s); `foods` has records if new foods created

**READ**
1. Navigate Nutrition tab
2. **Verify:** Today's log shows Post-WO meal with all 3 foods
3. **Verify:** Macros match expected totals (552 cal / 61P / 56C / 8F)

**UPDATE**
1. Open the Post-WO meal log
2. Update Grilled Chicken Breast serving to 8 oz (calories should update to ~375)
3. Save
4. **Verify:** Updated totals reflect new serving size

**DELETE**
1. Delete the Broccoli entry from the meal
2. **Verify:** Totals update (552 - 55 = 497 cal)
3. **Verify:** `nutrition_logs` record deleted

**VALIDATION**
1. Attempt to log food with 0 calories → should save (valid zero-calorie food)
2. Attempt to log food with negative calories (-50) → validation error
3. Attempt to log food with empty name → validation error

---

### 6.4 Water Logs — `water_logs`

**CREATE**
1. Navigate to Nutrition tab or Dashboard → find water tracker
2. Tap to add water intake (e.g., +8 oz or +250 ml)
3. **Verify:** Water tracker updates immediately
4. **Verify:** `water_logs` has new record for today

**READ**
1. **Verify:** Today's total water shows on Nutrition or Dashboard screen

**UPDATE**
1. If editing water intake is supported, update a log entry amount
2. **Verify:** Total updates

**DELETE**
1. If deleting water logs is supported, delete an entry
2. **Verify:** Total decreases

**VALIDATION**
1. Attempt to log 0 oz → should either prevent or handle gracefully
2. Attempt to log 999999 oz → validation or reasonable cap

---

### 6.5 Goals — `goals` + `goal_milestones`

**CREATE**
1. Navigate to Goals tab → + or Add Goal
2. Fill: Goal title → "Gain 40 lbs of lean mass"
3. Fill: What does success look like? → "Be 180 lbs at 15% body fat by October 2027"
4. Fill: MM/DD/YYYY (Target Date) → 10/01/2027
5. Fill: Target Value → 180 lbs
6. Save goal
7. **Verify:** Goal appears in goals list
8. **Verify:** `goals` table has new record
9. Add a milestone: navigate into goal detail → Add Milestone
10. Milestone name: "Reach 150 lbs", target date: 07/01/2026
11. **Verify:** `goal_milestones` has new record

**Log Progress**
1. Open goal detail → Log Progress
2. Fill: e.g., Ran 3 miles, studied for 2 hours... → "Weighed in at 142 lbs today. On track."
3. Submit
4. **Verify:** `goal_progress_logs` has new record
5. **Verify:** Progress bar on goal reflects current vs target (142/180 = ~5% toward 40 lb gain)

**READ**
1. Navigate Goals list
2. **Verify:** "Gain 40 lbs of lean mass" appears with target date Oct 2027
3. Open detail → **Verify:** Milestone visible, progress log visible

**UPDATE**
1. Open goal → edit description to add more detail
2. Save
3. **Verify:** Updated in Supabase

**DELETE**
1. Delete the goal
2. **Verify:** Removed from goals list
3. **Verify:** `goals` record deleted

**VALIDATION**
1. Create goal with empty title → validation error
2. Set target date in the past → validation warning or error
3. Set target value as negative number → validation error

---

### 6.6 Habits — `habits` + `habit_completions`

**CREATE**
1. Navigate Goals tab → Habits → + Add Habit
2. Enter name: "Drink 1 gallon of water daily"
3. Set frequency: Daily
4. Save
5. **Verify:** Habit appears in habits list
6. **Verify:** `habits` table has new record

**Complete Habit**
1. Find "Drink 1 gallon of water daily" in habits list
2. Tap checkmark to complete for today
3. **Verify:** Habit marked as done (visual indicator changes)
4. **Verify:** `habit_completions` has new record for today's date
5. **Verify:** Streak increments by 1

**READ**
1. Navigate Habits
2. **Verify:** Habit visible with current streak count

**UPDATE**
1. Open habit → edit name to "Drink 1 gallon of water (non-negotiable)"
2. Save
3. **Verify:** Name updated in list and Supabase

**DELETE**
1. Delete the habit
2. **Verify:** Removed from habits list
3. **Verify:** `habits` record deleted

**VALIDATION**
1. Create habit with empty name → validation error
2. Create duplicate habit name → handle gracefully (allow or warn)

---

### 6.7 Sleep — `sleep_logs`

**CREATE**
1. Navigate Goals tab → Sleep or dedicated sleep screen
2. Enter Bedtime: 11:15 PM
3. Enter Wake Time: 7:00 AM
4. Tap Save / Log
5. **Verify:** Sleep log appears showing 7h 45m duration (not 3h 45m — midnight crossing must be handled)
6. **Verify:** `sleep_logs` table has new record

**READ**
1. Navigate to sleep history or dashboard sleep widget
2. **Verify:** Last night's sleep shows 7h 45m

**UPDATE**
1. Open the sleep log and change wake time to 7:30 AM
2. Save
3. **Verify:** Duration updates to 8h 15m

**DELETE**
1. Delete sleep log
2. **Verify:** Removed

**VALIDATION**
1. Enter bedtime same as wake time → duration = 0 or validation error
2. Enter wake time before bedtime (same day, e.g., bed 8 PM wake 6 PM) → validation or 22h result
3. Leave bedtime blank → validation error

---

### 6.8 Mood — `mood_logs`

**CREATE**
1. Navigate Goals tab → Mood or mood logging screen
2. Enter mood note: "Good energy today after 8 hours sleep"
3. Select mood level / emoji (highest positive option)
4. Tap Log Mood / Save
5. **Verify:** Mood log appears in history
6. **Verify:** `mood_logs` has new record

**READ**
1. Navigate mood history
2. **Verify:** Today's mood visible with note

**UPDATE**
1. Edit mood note to: "Really great energy today, PR on bench."
2. Save
3. **Verify:** Updated in Supabase

**DELETE**
1. Delete mood log
2. **Verify:** Removed

**VALIDATION**
1. Log mood with empty note → should be allowed (note is optional) or show validation
2. Log mood with no level selected → validation if level is required

---

### 6.9 Body Metrics / Weight — `weight_logs` + `measurements`

**CREATE**
1. Navigate to Progress, Body, or Dashboard weight tracker
2. Enter weight: 142 lbs
3. Tap Log / Save
4. **Verify:** Weight appears in history/chart
5. **Verify:** `weight_logs` has new record for today

**READ**
1. Navigate weight history or progress chart
2. **Verify:** 142 lbs entry visible for today

**UPDATE**
1. Edit today's entry to 143 lbs
2. Save
3. **Verify:** Chart updates

**DELETE**
1. Delete the weight log entry
2. **Verify:** Removed from chart and Supabase

**VALIDATION**
1. Enter 0 lbs → validation error or warning
2. Enter negative weight → validation error
3. Enter 2000 lbs → validation error or cap

---

### 6.10 Progress Photos — `progress-photos` storage bucket

**CREATE**
1. Navigate Fitness → Progress Photos → Add Photo
2. Select from gallery or capture with camera
3. Tap upload / save
4. **Verify:** Upload completes (no timeout, no crash)
5. **Verify:** Photo appears in progress photo grid
6. **Verify:** File exists in Supabase `progress-photos` storage bucket

**READ**
1. Navigate Progress Photos
2. **Verify:** Uploaded photo visible in grid with date

**DELETE**
1. Delete the uploaded photo
2. **Verify:** Removed from grid
3. **Verify:** File deleted from Supabase storage bucket

**VALIDATION**
1. Attempt upload with no photo selected → validation error
2. Attempt upload of very large file (>20MB) → handle gracefully (compress or error)

---

### 6.11 Journal Entries — `journal_entries`

**CREATE**
1. Navigate Goals tab → Journal → + New Entry
2. Fill: Write your thoughts... → "Strong week overall. Staying consistent with morning workouts."
3. Fill: What went well today? → "Hit all my gym sessions. Sleep was solid at 8 hours."
4. Fill: What was challenging? → "Missed protein target on Tuesday by 20g."
5. Fill: What are you grateful for? → "Grateful for the discipline to show up."
6. Save entry
7. **Verify:** Entry appears in journal list with today's date
8. **Verify:** `journal_entries` has new record

**READ**
1. Navigate journal list
2. **Verify:** Entry visible with date and preview text

**UPDATE**
1. Open entry → edit gratitude field to add: "Also grateful for my health."
2. Save
3. **Verify:** Updated in Supabase

**DELETE**
1. Delete journal entry
2. **Verify:** Removed from list

**VALIDATION**
1. Submit entry with all fields empty → validation error or allow blank save
2. Enter 500+ character entry → verify saves without truncation or shows warning

---

### 6.12 Supplements — `supplements` + `supplement_logs`

**CREATE**
1. Navigate Goals or Profile → Supplements → + Add Supplement
2. Fill: e.g. Vitamin D3 → Creatine Monohydrate
3. Fill: e.g. 5000 IU → 5g
4. Fill: 0 (Cost USD) → 0.50
5. Fill: e.g. 100 (Daily Cost) → 0.50
6. Save
7. **Verify:** Supplement appears in list
8. **Verify:** `supplements` and/or `user_supplements` has new record

**Log Intake**
1. Find Creatine Monohydrate in list
2. Tap "Log" or checkmark for today
3. **Verify:** Marked as taken for today
4. **Verify:** `supplement_logs` has new record

**READ**
1. Navigate Supplements
2. **Verify:** Creatine Monohydrate visible with dosage and cost

**UPDATE**
1. Edit dosage to 10g
2. Save
3. **Verify:** Updated in list and Supabase

**DELETE**
1. Delete supplement
2. **Verify:** Removed from list

**VALIDATION**
1. Submit supplement with empty name → validation error
2. Enter negative cost → validation error

---

### 6.13 Business Revenue — `revenue_logs` + `businesses`

**CREATE**
1. Navigate Goals or Finance → Business → Add Revenue Entry
2. Set business name: Automate AI LLC (if business not already created, create it first)
3. Log revenue entry (amount, date, category)
4. Save
5. **Verify:** Entry appears in revenue list
6. **Verify:** `revenue_logs` and `businesses` tables have new records
7. **Verify:** Business milestone check triggered if threshold crossed

**READ**
1. Navigate Business dashboard
2. **Verify:** Revenue entry visible, total updates

**UPDATE**
1. Edit revenue entry amount
2. **Verify:** Total recalculates

**DELETE**
1. Delete revenue entry
2. **Verify:** Removed and total recalculates

**VALIDATION**
1. Submit revenue with empty amount → validation error
2. Submit negative revenue → validation error or treat as expense (document behavior)

---

### 6.14 Finance — `finance_transactions` + `budgets`

**CREATE**
1. Navigate Finance tab → Add Transaction
2. Enter amount, category, description
3. Save
4. **Verify:** Transaction appears in finance list
5. **Verify:** `finance_transactions` has new record

**Budget**
1. Navigate Finance → Budgets → Add Budget
2. Set category and monthly limit
3. **Verify:** `budgets` has new record

**READ**
1. Navigate Finance dashboard
2. **Verify:** Transaction visible, budget progress shown

**UPDATE**
1. Edit transaction amount
2. **Verify:** Budget progress updates

**DELETE**
1. Delete transaction
2. **Verify:** Removed, budget progress recalculates

---

### 6.15 Challenges — `challenge_enrollments` + `challenge_daily_logs`

**CREATE (Join Challenge)**
1. Navigate Goals → Challenges
2. Browse available challenges from `challenge_definitions`
3. Join any active challenge
4. **Verify:** Challenge appears in "Active Challenges"
5. **Verify:** `challenge_enrollments` has new record

**Log Daily Completion**
1. Navigate to active challenge
2. Log today's completion (challenge-specific action)
3. **Verify:** Progress updates on challenge screen
4. **Verify:** `challenge_daily_logs` has new record

**READ**
1. Navigate Challenges → Active
2. **Verify:** Challenge visible with progress and days remaining

**DELETE (Leave Challenge)**
1. Leave the challenge if option available
2. **Verify:** Removed from active list

---

### 6.16 Lab Upload — `lab_uploads`

**CREATE**
1. Navigate Labs or Health → Upload Lab Report
2. Fill: e.g., Q2 Annual Physical → Q2 Annual Physical
3. Fill: Quest, LabCorp, etc. → Quest Diagnostics
4. Fill: 2026-04-01 → 04/01/2026
5. Fill: Anything to flag for the AI coach → "Checking testosterone and vitamin D levels."
6. Select lab report image from gallery (any image file)
7. Tap Upload
8. **Verify:** Upload completes without crash
9. **Verify:** Lab entry appears in labs list
10. **Verify:** File exists in Supabase `lab-uploads` storage bucket
11. **Verify:** `lab_uploads` has new record; AI analysis triggered (`lab_interpretations` may populate asynchronously)

**READ**
1. Navigate Labs
2. **Verify:** Q2 Annual Physical entry visible with date and provider

**DELETE**
1. Delete lab upload
2. **Verify:** Removed from list and Supabase storage

**VALIDATION**
1. Submit without selecting a file → validation error
2. Submit with empty test name → validation error

---

## SECTION 7 — CALCULATION VERIFICATION

### 7.1 Macro Math
After logging the Post-WO meal (Section 4.2), navigate to Nutrition tab for today.

**Expected results:**
- Calories: **552**
- Protein: **61g**
- Carbs: **56g**
- Fat: **8g**

**Verify:** The UI shows exactly 552, 61, 56, 8 — not rounded or truncated values. Check daily totals ring/bar chart matches. Check individual food entries add up correctly if displayed separately.

**Manual verification:**
- 281 + 216 + 55 = 552 ✓
- 52 + 5 + 4 = 61 ✓
- 0 + 45 + 11 = 56 ✓
- 6 + 2 + 0 = 8 ✓

**File to inspect if mismatch:** `apps/mobile/services/calculations/macros.ts`

---

### 7.2 Workout Volume
After logging the Push Day workout (Section 4.1), view workout summary.

**Expected volume:**
- Bench Press: 4 × 8 × 185 = **5,920 lbs**
- Incline DB Press: (2 × 10 × 65) + (1 × 10 × 60) = 1,300 + 600 = **1,900 lbs**
- Lateral Raises: (2 × 15 × 25) + (1 × 15 × 20) = 750 + 300 = **1,050 lbs**
- **Total: 8,870 lbs**

**Verify:** Workout summary screen shows total volume = 8,870 lbs (or 8870 without comma formatting — document formatting used).

**File to inspect if mismatch:** Check volume calculation logic in workout completion flow.

---

### 7.3 Sleep Duration — Midnight Crossing
After logging sleep (Section 4.5): Bedtime 11:15 PM, Wake 7:00 AM.

**Expected:** 7 hours 45 minutes

**Verify:** Sleep log and dashboard sleep widget shows **7h 45m**, NOT 3h 45m (which would indicate a midnight-crossing bug).

**Test the midnight crossing logic:**
- From 11:15 PM to midnight = 45 minutes
- From midnight to 7:00 AM = 7 hours
- Total = 7 hours 45 minutes

**File to inspect if mismatch:** `apps/mobile/services/calculations/streaks.ts` or sleep log service.

---

### 7.4 Streak Counting
After completing habit "Drink 1 gallon of water daily" (Section 6.6):

1. **Verify:** Streak shows 1 (assuming first completion)
2. **Verify:** Streak does not reset at 11:59 PM — it should only reset when the NEXT day passes without completion
3. If possible, verify streak logic by inspecting: `apps/mobile/services/calculations/streaks.ts`
4. Check `user_streaks` table has correct `current_streak` and `longest_streak` values

**Edge case:** Confirm streak increments based on calendar date (UTC or local time — document which), not 24-hour rolling window.

---

### 7.5 Goal Progress
After setting goal (weight target 180 lbs from start 140 lbs assumed) and logging current weight 142 lbs:

**Expected progress:** (142 - 140) / (180 - 140) = 2 / 40 = **5%**

**Verify:** Goal detail screen shows progress bar at approximately 5%.

**Note:** If the app uses a different start weight (e.g., first logged weight), document the actual baseline used. The key verification is that the math is correct for whatever baseline the app uses.

**File to inspect if mismatch:** `apps/mobile/services/calculations/projections.ts`

---

### 7.6 Day Score
After completing the morning routine (workout logged, nutrition tracked, habits checked):

1. Navigate to Dashboard
2. **Verify:** Day score widget shows a higher value than before any items were logged
3. **Verify:** Each of the following contributes to day score:
   - Workout logged ✓
   - Nutrition tracked ✓
   - Habits checked ✓
4. **Verify:** Score is in a sensible range (e.g., 0–100 or 0–10 — document the scale used)

**File to inspect if mismatch:** `apps/mobile/services/calculations/dayScore.ts`

---

### 7.7 Readiness Score
After logging sleep (7h 45m), mood (positive/8), and no extreme soreness logged:

1. Navigate to Dashboard
2. **Verify:** Readiness score appears (not null, not 0 unless calculated as 0)
3. **Verify:** Score is in range 70–90 given the positive inputs above
4. **Verify:** `readiness_scores` table has a record for today

**File to inspect if mismatch:** `apps/mobile/services/calculations/readiness.ts`

---

## SECTION 8 — CROSS-ENTITY WORKFLOWS

### 8.1 Morning Routine Workflow
**Full flow — complete all steps in order:**

1. Open app → **Verify:** Dashboard loads with readiness score widget visible
2. Tap AI Chat FAB (floating action button) → **Verify:** Chat screen opens
3. Type and send: "What should I train today?" → **Verify:** AI response received (not crash, not blank)
4. Navigate to Fitness tab → **Verify:** Tab is accessible
5. Start new workout session
6. Log Exercise 1: Bench Press — 4 sets × 8 reps × 185 lbs
7. Log Exercise 2: Incline DB Press — sets per Section 4.1
8. Log Exercise 3: Lateral Raises — sets per Section 4.1
9. Complete workout → **Verify:** Summary screen appears with total volume and exercise count
10. Navigate to Nutrition tab
11. Add Post-WO meal with 3 foods per Section 4.2
12. **Verify:** Macro totals show 552 cal / 61P / 56C / 8F
13. Log water intake (at least 1 entry)
14. Navigate to Goals tab
15. Check off habit "Drink 1 gallon of water daily"
16. Check off a second habit if available
17. Navigate back to Dashboard
18. **Verify:** Day score widget shows higher value than session start
19. **Verify:** No tab shows error state or blank content

---

### 8.2 Evening Routine Workflow
**Full flow — complete all steps in order:**

1. Navigate to Goals tab → Mood logging screen
2. Log mood: "Good energy today after 8 hours sleep" with level 8
3. **Verify:** Mood saved, history updates
4. Navigate to Goals tab → Journal
5. Create journal entry with all 4 fields per Section 4.7
6. **Verify:** Entry saved in list
7. Navigate to Goals tab → Sleep
8. Log sleep: Bedtime 11:15 PM, Wake 7:00 AM
9. **Verify:** Duration shows 7h 45m
10. Navigate to Goals → Habits
11. **Verify:** Remaining habits for the day visible
12. **Verify:** `daily_checkins` record created in Supabase for today (check after all evening items logged)

---

### 8.3 Challenge Workflow
**Full flow:**

1. Navigate Goals → Challenges
2. **Verify:** Available challenges list loads (from `challenge_definitions` table)
3. Join one active challenge (tap Join)
4. **Verify:** Enrollment confirmation shown
5. **Verify:** `challenge_enrollments` has new record
6. Navigate to Active Challenges or challenge detail
7. Log today's daily challenge completion
8. **Verify:** Progress bar updates on challenge-active screen
9. **Verify:** `challenge_daily_logs` has new record with today's date

---

### 8.4 Partner Workflow
**Note:** This requires a second test account or partner account. If no partner is available, test the linking UI only.

1. Navigate Profile tab → Partner section
2. Tap "Link Partner" or enter invite code
3. Enter invite code: TRFM-TEST01
4. **Verify:** If partner exists: partnership created, Partner Dashboard accessible
5. **Verify:** If partner does not exist: user-friendly error shown, no crash
6. If partnership created:
   - Navigate to Partner Dashboard → **Verify:** partner activity visible
   - Send a nudge to partner
   - **Verify:** `partner_nudges` has new record with correct type and message
7. Live workout sync test (requires both users):
   - Both users start workout session simultaneously
   - **Verify:** `live_workout_sync` table receives updates
   - **Verify:** Partner's progress visible in real time (Supabase Realtime channel)

---

### 8.5 Weekly Review Workflow
**Full flow:**

1. Navigate to weekly-review screen (check navigation from dashboard, Goals tab, or profile)
2. **Verify:** Weekly review screen loads without crash
3. **Verify:** AI-generated review text appears (may require a moment to generate)
4. **Verify:** Review content references at least some of: workouts, nutrition, habits, sleep, mood from the current week
5. **Verify:** `weekly_reviews` table receives a new record after save/confirm
6. Tap save or confirm
7. **Verify:** Review saved successfully, user-friendly confirmation shown

---

## SECTION 9 — SUBSCRIPTION TIER GATING

Verify that feature gates are enforced correctly. Find and read `apps/mobile/hooks/useFeatureGate.ts` before testing.

### 9.1 Free User Hitting Pro Feature — AI Meal Camera
1. Ensure test account is on free tier (check `subscriptionStore.tier`)
2. Navigate Nutrition → Meal Camera (AI photo feature)
3. **Verify:** Upgrade prompt appears — shows price $9.99/mo
4. **Verify:** upgrade.tsx paywall screen loads correctly with tier comparison
5. Tap "Maybe Later" or dismiss
6. **Verify:** Graceful dismiss, returns to Nutrition tab, no crash

### 9.2 Pro User Hitting Elite Feature — Business Tracking
1. If a Pro tier test account is available, sign in
2. Navigate Goals → Business section
3. **Verify:** Upgrade prompt appears for Elite at $14.99/mo
4. **Verify:** UI explains what Elite adds over Pro

### 9.3 Partners Tier Gate
1. Navigate Profile → Partner section
2. If not on Partners tier ($19.99/mo):
   - **Verify:** Upgrade prompt shown with Partners tier price
3. If on Partners tier:
   - **Verify:** Partner linking UI is accessible and functional

### 9.4 Metered Feature — AI Chat Coach (10 messages/day free limit)
1. As free tier user, open AI Chat
2. Send 10 messages (can be rapid short messages)
3. Attempt to send the 11th message
4. **Verify:** "Daily limit reached" message shown — NOT a crash or blank response
5. **Verify:** Upgrade prompt appears offering Pro tier (unlimited chat)
6. **Verify:** After seeing limit message, previous chat history still visible

### 9.5 Feature Gate Implementation Integrity
1. Read `apps/mobile/hooks/useFeatureGate.ts`
2. **Verify:** Hook returns correct boolean for current tier
3. **Verify:** `subscriptionStore.tier` reflects actual Supabase subscription record (not hardcoded)
4. Check `subscriptionStore` state matches database record for the signed-in user

---

## SECTION 10 — PUSH NOTIFICATIONS

**Service file:** `apps/mobile/services/notifications.ts`

### 10.1 Permission Request
1. Fresh install or clear app data
2. Launch app and complete onboarding
3. **Verify:** Push notification permission dialog appears at appropriate point
4. Grant permission
5. **Verify:** `registerForPushNotifications()` completes, token stored

### 10.2 Workout Reminder
1. Navigate Settings → Notifications → Workout Reminder
2. Schedule reminder for 2 minutes from now (test value)
3. **Verify:** Notification appears within 2 minutes
4. **Verify:** Notification uses correct type: `workout`

### 10.3 Nutrition Reminder
1. Navigate Settings → Notifications → Nutrition Reminder
2. Set reminder for a meal log (e.g., "log lunch by noon if not logged")
3. **Verify:** Notification appears as scheduled
4. **Verify:** Notification type: `nutrition`

### 10.4 Tap-to-Navigate
1. With app backgrounded (not killed), trigger a scheduled notification
2. Tap the notification
3. **Verify:** App opens to the correct screen (workout screen for workout notification, nutrition for nutrition notification)
4. **Verify:** No crash on navigation from notification tap

### 10.5 Partner Notification
1. If partner is linked, trigger a partner nudge (from partner's side or via `partner-nudge` Edge Function)
2. **Verify:** Notification received on device
3. **Verify:** Notification type: `partner`
4. **Verify:** Tap → opens Partner Dashboard

---

## SECTION 11 — FILE UPLOADS

### 11.1 Progress Photos — `progress-photos` bucket
1. Navigate Fitness → Progress Photos
2. Tap Add Photo
3. Select image from gallery (any photo)
4. Tap upload / save
5. **Verify:** Upload progress indicator (not blank screen during upload)
6. **Verify:** Photo appears in progress photo grid after upload
7. **Verify:** File visible in Supabase `progress-photos` storage bucket
8. **Verify:** No crash on upload

### 11.2 Form Check Videos — `form-check-videos` bucket
1. Navigate Fitness → Form Check
2. Record a short exercise video (or select from gallery if supported)
3. Submit for analysis
4. **Verify:** Upload completes without crash
5. **Verify:** File visible in Supabase `form-check-videos` storage bucket
6. **Verify:** AI analysis triggered (Edge Function called — may not return immediately)
7. **Verify:** Loading state shown while analysis in progress

### 11.3 Lab Uploads — `lab-uploads` bucket
1. Navigate Labs → Upload Lab Report
2. Fill form per Section 4.10
3. Select any image from gallery as the lab report
4. Tap Upload
5. **Verify:** Upload completes without crash
6. **Verify:** Lab entry appears in `lab_uploads` with status
7. **Verify:** File visible in Supabase `lab-uploads` bucket
8. **Verify:** AI analysis triggered (`lab_interpretations` table may populate asynchronously)

### 11.4 Goal Images — `goal-images` bucket
1. Navigate Goals → Vision Board
2. Tap Add Image / + button
3. Select image from gallery
4. **Verify:** Upload completes without crash
5. **Verify:** Image appears on vision board
6. **Verify:** File visible in Supabase `goal-images` storage bucket
7. **Verify:** `vision_board_items` has new record

---

## SECTION 12 — DEEP LINKS

Test each deep link via ADB shell commands. Verify that the correct screen opens.

### 12.1 Partner Join Deep Link
```bash
adb shell am start -W -a android.intent.action.VIEW -d "com.automateai.transformr://partner/join?code=TRFM-TEST01" com.automateai.transformr
```
**Verify:** Partner linking screen opens with invite code "TRFM-TEST01" pre-filled in the "e.g. TRFM-ABC123" field.

### 12.2 Workout Start Deep Link
```bash
adb shell am start -W -a android.intent.action.VIEW -d "com.automateai.transformr://workout/start" com.automateai.transformr
```
**Verify:** Workout player / new workout session screen opens directly.

### 12.3 Nutrition Add Deep Link
```bash
adb shell am start -W -a android.intent.action.VIEW -d "com.automateai.transformr://nutrition/add" com.automateai.transformr
```
**Verify:** Add food screen opens directly.

### 12.4 Deep Link from Killed State
1. Force stop the app: `adb shell am force-stop com.automateai.transformr`
2. Fire any of the above deep links
3. **Verify:** App launches, authenticates (if session persists), and navigates to correct screen
4. **Verify:** No crash on cold-start deep link navigation

---

## SECTION 13 — OFFLINE MODE

### 13.1 Enable Airplane Mode
```bash
adb shell settings put global airplane_mode_on 1 && adb shell am broadcast -a android.intent.action.AIRPLANE_MODE --ez state true
```

### 13.2 Offline Indicator
After enabling airplane mode:
1. **Verify:** Offline indicator appears in app UI (banner, icon, or status change)
2. **Verify:** `offlineSyncStore.isOnline` = false (can confirm via React Native Debugger or log)

### 13.3 Queue Data While Offline
1. Log a workout set → **Verify:** Queued (`offlineSyncStore.pendingCount` > 0)
2. Log a meal → **Verify:** Queued
3. Check off a habit → **Verify:** Queued
4. **Verify:** UI shows the logged items immediately (optimistic updates)
5. **Verify:** No crash or error toast during offline logging

### 13.4 Re-enable Network and Sync
```bash
adb shell settings put global airplane_mode_on 0 && adb shell am broadcast -a android.intent.action.AIRPLANE_MODE --ez state false
```

After re-enabling:
1. **Verify:** Sync fires automatically within a few seconds
2. **Verify:** `offlineSyncStore.pendingCount` returns to 0
3. **Verify:** `offlineSyncStore.lastSyncAt` timestamp updates
4. **Verify:** Workout set, meal, and habit completion all appear in Supabase tables
5. **Verify:** No duplicate entries created

---

## SECTION 14 — STRIPE / PAYMENTS

**Current status:** Stripe keys are placeholder (`pk_live_xxxxx`, `sk_live_xxxxx`). Do NOT attempt real payment completion.

### 14.1 Stake Goals Screen
1. Navigate to Goals → Stake Goals (Pro feature)
2. **Verify:** Screen loads without crash
3. **Verify:** If Stripe unavailable: user-friendly message shown (not raw exception)
4. **Verify:** `createStakePayment` function handles unavailable keys gracefully

### 14.2 Subscription Upgrade Page
1. Navigate to upgrade/subscription page (via feature gate paywall)
2. **Verify:** Tier comparison loads: Free / Pro ($9.99) / Elite ($14.99) / Partners ($19.99)
3. **Verify:** Upgrade form renders: price visible, CTA button present
4. **Verify:** Tapping upgrade CTA → Stripe payment form loads (or graceful error if keys unavailable)
5. **Verify:** Keyboard appears on payment form fields
6. Tap away or dismiss without paying → **Verify:** graceful dismiss, no crash

### 14.3 Service File Integrity
1. Read `apps/mobile/services/stripe.ts`
2. **Verify:** `createStakePayment`, `captureStake`, `cancelStakeHold`, `setupStripeCustomer`, `createSubscription` all exist and have proper TypeScript types
3. **Verify:** No `any` types, no placeholder console.log statements

**BLOCKED — action required by Tyson:**
- Real Stripe keys needed for actual payment flow testing
- Stripe `pk_live_xxxxx` → replace with real publishable key
- Stripe `sk_live_xxxxx` → replace with real secret key (never commit to repo)

---

## SECTION 15 — EDGE CASES

### 15.1 Empty Form Submissions
- Submit empty workout form (no exercises) → **Verify:** validation error, no crash
- Submit empty nutrition log (no foods) → **Verify:** validation error or warning
- Submit empty goal form (no title) → **Verify:** validation error
- Submit empty journal entry (all blank fields) → **Verify:** either allowed blank or validation

### 15.2 Boundary Values
- Log 0-calorie food → **Verify:** displays as 0, macros unaffected, no crash
- Log workout with 0 reps → **Verify:** validation error or graceful empty state
- Enter negative weight (−5 lbs) → **Verify:** validation error shown
- Enter 500+ character journal entry → **Verify:** saves completely OR shows truncation warning (document limit)
- Enter 0 for supplement cost → **Verify:** saves as 0.00, no crash

### 15.3 Rapid Double-Tap
- Double-tap "Log Workout" button quickly → **Verify:** only 1 workout session created, no duplicate
- Double-tap "Save Goal" quickly → **Verify:** only 1 goal created
- Double-tap "Complete Habit" quickly → **Verify:** only 1 completion logged for today

### 15.4 Tab Switching During Async Operations
1. Start an AI chat message (send query, wait for response)
2. Immediately switch to Fitness tab
3. Switch back to AI chat
4. **Verify:** AI response available when returning, no crash, no lost message

### 15.5 Pull-to-Refresh on Empty Lists
- Navigate to Workout History with no workouts logged → pull to refresh → **Verify:** no crash, empty state shown
- Navigate to Journal with no entries → pull to refresh → **Verify:** no crash, empty state shown
- Navigate to Challenges with no active challenges → pull to refresh → **Verify:** no crash, empty state shown

### 15.6 Large Data Inputs
- Enter 999 as reps in a workout set → **Verify:** validation caps or errors
- Enter weight of 9999 lbs → **Verify:** validation error
- Enter calorie count of 99999 for a single food → **Verify:** validation or reasonable cap

---

## SECTION 16 — DATA PERSISTENCE

### 16.1 Crash Persistence (MMKV / Local)
1. Log a workout, a meal, and check off a habit
2. Force close: `adb shell am force-stop com.automateai.transformr`
3. Relaunch: `adb shell am start -n com.automateai.transformr/.MainActivity`
4. **Verify:** All 3 logged items still visible without re-fetching from server
5. **Verify:** No data loss from force close

### 16.2 Server-Side Persistence (Supabase)
1. Sign out of the app
2. Sign back in with same credentials
3. **Verify:** All data from today's session still visible (from Supabase, not local cache)
4. **Verify:** Workout history, nutrition logs, habits, goals, journal entries all intact

### 16.3 Cross-Session Data Integrity
1. Log data, sign out, sign back in
2. **Verify:** `workout_sessions`, `nutrition_logs`, `habits`, `habit_completions`, `goals`, `journal_entries` all have correct records for the test user
3. **Verify:** No orphaned records (e.g., `workout_sets` without parent `workout_sessions`)

---

## SECTION 17 — DARK MODE

### 17.1 Toggle Dark Mode
1. Navigate to Settings → Appearance → Dark Mode
2. Toggle dark mode on
3. **Verify:** All screens transition to dark theme

### 17.2 Background Color Verification
On each major screen, verify background is `#0C0A15` (deep dark purple-black):
- Dashboard
- Fitness tab (workout list, active workout)
- Nutrition tab (food log)
- Goals tab (habits, sleep, mood, journal)
- Profile tab
- Settings
- Auth screens (login, registration)

**Verify:** No screen retains white (`#FFFFFF`) or light gray background in dark mode.

### 17.3 Text Readability
- **Verify:** No white text on white background
- **Verify:** No black text on black/dark background
- **Verify:** All body text has sufficient contrast ratio

### 17.4 Brand Color Consistency
- **Verify:** Accent color is `#A855F7` (purple) — NOT a blue inherited from any template or previous branding
- **Verify:** CTAs, active tab indicators, progress bars, highlights all use `#A855F7`
- **Verify:** Auth screens use `#A855F7` (check registration and login screen button colors)

---

## SECTION 18 — GAMIFICATION

### 18.1 Streaks
1. Complete habit "Drink 1 gallon of water daily" for today
2. **Verify:** Streak shows N+1 on habits screen
3. **Verify:** `user_streaks` table shows updated `current_streak` value
4. **Verify:** Streak does NOT reset at 11:59 PM of the same day
5. **Simulate streak reset (caution — only if safe to test):** If date can be changed in emulator settings, advance to next day without completing habit → **Verify:** streak resets to 0

### 18.2 Achievements
1. Complete the Push Day workout (creates a workout completion event)
2. Wait or trigger the `achievement-evaluator` Edge Function manually if needed:
   ```bash
   # If achievable via Supabase dashboard or direct function invocation
   ```
3. Navigate Profile → Achievements
4. **Verify:** Newly unlocked achievement appears in achievements list
5. **Verify:** `user_achievements` table has new record
6. **Verify:** Celebration animation plays (confetti, modal, or badge animation)

### 18.3 Challenge Completion Flow
1. Complete all required daily logs for an active challenge over the required period
2. (Simulate by logging challenge_daily_logs via direct database entry if the challenge period is too long to wait for naturally)
3. After completion criteria met:
   - **Verify:** Challenge shows as Completed on challenge-active screen
   - **Verify:** Completion achievement unlocked if applicable
   - **Verify:** `challenge_enrollments` record status updated

### 18.4 Leaderboards
1. Navigate Goals → Community
2. **Verify:** Leaderboard screen loads (Pro feature — if free tier, verify upgrade gate)
3. If Pro tier: **Verify:** Leaderboard shows data from `community_leaderboards` table
4. **Verify:** Current user appears in leaderboard after completing logged activities
5. **Verify:** No crash on leaderboard load or refresh

---

## SECTION 19 — NETWORK ERROR RECOVERY

For each test: cut network at the specified moment and verify graceful handling.

### 19.1 Server 500 Error (Supabase)
1. Simulate by making an action while Supabase connection is briefly interrupted
2. **Verify:** Toast or error message: "Server error, please try again" (or equivalent user-friendly copy)
3. **Verify:** Retry button or pull-to-refresh available
4. **Verify:** No crash, no raw error stack shown to user

### 19.2 401 Unauthorized — Token Expired
1. Manipulate session expiry or wait for token expiry (if testable)
2. Attempt to perform a data-fetching action
3. **Verify:** App redirects to login screen
4. **Verify:** User-friendly message: "Your session has expired. Please sign in again."
5. **Verify:** After re-signing-in, previous screen state preserved if possible

### 19.3 Network Timeout (No Response)
1. Enable airplane mode mid-request
2. **Verify:** App enters offline mode gracefully (shows offline indicator)
3. **Verify:** Action queued in `offlineSyncStore` pending queue
4. **Verify:** No crash, no spinner that never resolves

### 19.4 General Crash Prevention
- **Verify:** Under no network error condition does the app white-screen or show an unhandled exception
- **Verify:** All errors caught at React boundary or service layer

---

## SECTION 20 — SUMMARY REPORT TEMPLATE

At the end of every verification session, output this exact report:

```
FUNCTIONAL VERIFICATION REPORT
================================
Date: [YYYY-MM-DD HH:mm]
Branch: dev
Tester: Claude Code (autonomous QA)

AUTH TESTS:          [N/10 PASS] — Failed: [list test IDs]
CRUD ENTITIES:       [N/16 PASS] — Failed: [list entity names]
CALCULATIONS:        [N/7 PASS] — Failed: [list calc names]
WORKFLOWS:           [N/5 PASS] — Failed: [list workflow names]
SUBSCRIPTION GATING: [N/5 PASS] — Failed: [list test IDs]
NOTIFICATIONS:       [N/5 PASS] — Failed: [list test IDs]
FILE UPLOADS:        [N/4 PASS] — Failed: [list buckets]
DEEP LINKS:          [N/4 PASS] — Failed: [list links]
OFFLINE SYNC:        [PASS/FAIL] — Detail: [notes]
STRIPE/PAYMENTS:     [PASS/FAIL] — Note: BLOCKED on real keys
EDGE CASES:          [N/16 PASS] — Failed: [list]
DATA PERSISTENCE:    [N/3 PASS] — Failed: [list]
DARK MODE:           [PASS/FAIL] — Detail: [notes]
GAMIFICATION:        [N/4 PASS] — Failed: [list]
NETWORK RECOVERY:    [N/4 PASS] — Failed: [list]

TYPESCRIPT ERRORS (new): 0
BUGS FOUND AND FIXED: [list with file paths]
BUGS FOUND, NOT YET FIXED: [list with description]
COMMITS MADE: [N] — [list commit hashes and messages]

BLOCKED FOR TYSON:
  - Stripe real keys needed for payment completion testing
  - Apple sign-in not testable on Android emulator
  - Real partner account needed for full partner sync testing
  - [any additional blockers discovered]

OVERALL STATUS: [PASS / PASS WITH ISSUES / FAIL]
```

---

*End of TRANSFORMR Functional Verification Protocol*
*Generated for branch: dev | com.automateai.transformr | April 2026*
