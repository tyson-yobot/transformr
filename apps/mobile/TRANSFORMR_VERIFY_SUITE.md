# TRANSFORMR — PRE-LAUNCH VERIFICATION & ELEVATION PROMPT SUITE
## Senior QA Architect + Principal Engineer Directive
## 95+ screens · 21 stores · 50+ services · 35+ Supabase tables · 12 Edge Functions

---

## IRON-CLAD RULES — NO EXCEPTIONS

```
NEVER run taskkill, Stop-Process, kill, or any process-killing command.
NEVER remove features, screens, components, navigation, or functionality.
NEVER downgrade, stub, minimize, or workaround anything.
NEVER hardcode values. NEVER guess. NEVER use placeholders.
ADD and FIX ONLY. Every change must be production-grade.
If broken: fix it fully. If missing: implement it fully. If partial: complete it.
Branch: dev
Root: C:\dev\transformr
Package manager: pnpm (or npm — read package.json to confirm)
TypeScript check: npx tsc --noEmit --pretty
All PowerShell blocks MUST start with: cd C:\dev\transformr
```

---

## MANDATORY STARTUP

Read these files before any command runs:

```powershell
cd C:\dev\transformr
Get-Content CLAUDE.md -ErrorAction SilentlyContinue
Get-Content README.md -ErrorAction SilentlyContinue | Select-Object -First 80
Get-Content TRANSFORMR_DISCOVERY_REPORT.md
```

---

## CRITICAL KNOWN ISSUES — FIX THESE FIRST

From the discovery report, these are confirmed broken before testing starts:

**ISSUE 1 — SOUL.md and CONFIGURATION_LOCK.md missing**
Create both files before any other work:

```powershell
cd C:\dev\transformr
```

Read `CLAUDE.md` and `TRANSFORMR_DISCOVERY_REPORT.md` to understand the app fully.
Then create `SOUL.md` with:
- What TRANSFORMR is and who it serves
- Product vision and brand values
- Every feature and which subscription tier gates it
- AI features and what they do
- Brand colors (purple `#A855F7` system, dark `#0C0A15` background)

Create `CONFIGURATION_LOCK.md` with:
- Every locked config file (metro.config, babel.config, package.json key sections)
- Current Expo SDK version — LOCKED, never change
- Bundle ID: `com.automateai.transformr` — LOCKED
- The rule: read before write on all protected files

**ISSUE 2 — env file split (apps/mobile/.env has placeholders, root .env has live keys)**
```powershell
cd C:\dev\transformr
Get-Content .env | Select-String "STRIPE|SPOTIFY|EAS|EXPO_PUBLIC"
Get-Content apps/mobile/.env | Select-String "STRIPE|SPOTIFY|EAS|EXPO_PUBLIC"
```
For every key that is a placeholder in `apps/mobile/.env` but set in root `.env`:
Copy the live value from root `.env` to `apps/mobile/.env`.
Never expose values in code. Environment variables only.

**ISSUE 3 — OpenWeatherMap API key empty**
```powershell
cd C:\dev\transformr
Get-Content .env | Select-String "WEATHER|OPENWEATHER"
Get-Content apps/mobile/.env | Select-String "WEATHER|OPENWEATHER"
```
If key is empty and weather-based coaching is a feature:
Document in `C:\dev\transformr\MISSING_KEYS.md` with exact key name needed.
Add graceful fallback in WeatherService so app doesn't crash without the key.
Never hardcode a weather API key.

**ISSUE 4 — ~15 AI vision features scaffolded but not integrated**
These need full implementation, not stubs:
- Form check (exercise form analysis via camera)
- Meal camera (food recognition → nutrition)
- Labs analysis (blood work photo → insights)
- Supplement AI (label scan → recommendations)
Plus ~10 UI-only shells with no backend wiring.
Each gets its own fix phase below.

---

## PHASE 0 — COMPLETE DISCOVERY (before generating any output)

```powershell
cd C:\dev\transformr

# Confirm bundle ID
Get-Content apps/mobile/app.config.ts -ErrorAction SilentlyContinue |
  Select-String "bundleIdentifier|package|com\.automateai"

# Confirm package manager
Get-Content package.json | Select-String '"packageManager"'

# Full screen inventory
Get-ChildItem -Recurse apps/mobile/src, apps/mobile/app -Filter "*.tsx" |
  Where-Object { $_.FullName -notmatch "node_modules" } |
  ForEach-Object { $_.FullName.Replace("C:\dev\transformr\", "") }

# Navigation structure
Get-ChildItem -Recurse apps/mobile -Filter "_layout.tsx" |
  Where-Object { $_.FullName -notmatch "node_modules" } |
  ForEach-Object {
    Write-Host "=== $($_.FullName.Replace('C:\dev\transformr\', '')) ==="
    Get-Content $_.FullName | Select-Object -First 60
  }

# All Zustand stores (21 confirmed)
Get-ChildItem -Recurse apps/mobile/src -Filter "*.ts","*.tsx" |
  Where-Object { $_.FullName -notmatch "node_modules" -and
    $_.FullName -match "store|Store" } |
  ForEach-Object {
    Write-Host "=== $($_.Name) ==="
    Get-Content $_.FullName | Select-Object -First 20
  }

# All services (50+ confirmed)
Get-ChildItem -Recurse apps/mobile/src -Filter "*.ts" |
  Where-Object { $_.FullName -notmatch "node_modules" -and
    $_.FullName -match "service|Service" } |
  ForEach-Object {
    Write-Host "=== $($_.Name) ==="
    Get-Content $_.FullName |
      Select-String "export|async |function |class " |
      Select-Object -First 20
  }

# Supabase tables (35+ confirmed)
Get-ChildItem -Recurse -Filter "*.sql","schema*","migrations*" |
  Where-Object { $_.FullName -notmatch "node_modules" } |
  ForEach-Object {
    Write-Host "=== $($_.Name) ==="
    Get-Content $_.FullName | Select-Object -First 40
  }

# Edge Functions (12 confirmed)
Get-ChildItem -Recurse -Filter "*.ts" |
  Where-Object { $_.FullName -match "supabase.functions|edge.function" -and
    $_.FullName -notmatch "node_modules" } |
  ForEach-Object {
    Write-Host "=== $($_.FullName.Replace('C:\dev\transformr\', '')) ==="
    Get-Content $_.FullName | Select-Object -First 30
  }

# AI features — find all Claude API calls
Get-ChildItem -Recurse apps/mobile/src -Filter "*.ts","*.tsx" |
  Where-Object { $_.FullName -notmatch "node_modules" } |
  Select-String "anthropic|claude|/ai/|AI\." |
  ForEach-Object { "$($_.Filename):$($_.LineNumber): $($_.Line.Trim())" }

# Features that are UI-only shells (no backend)
Get-ChildItem -Recurse apps/mobile/src -Filter "*.ts","*.tsx" |
  Where-Object { $_.FullName -notmatch "node_modules" } |
  Select-String "TODO|FIXME|stub|not implemented|coming soon|placeholder" |
  Where-Object { $_ -notmatch "//" } |
  ForEach-Object { "$($_.Filename):$($_.LineNumber): $($_.Line.Trim())" }

# Env status (keys only, no values)
Get-Content apps/mobile/.env -ErrorAction SilentlyContinue |
  ForEach-Object {
    if ($_ -match "^([^#][^=]+)=(.*)$") {
      $key = $matches[1].Trim()
      $val = $matches[2].Trim()
      $status = if ($val.Length -gt 5 -and $val -notmatch "your-|placeholder|xxx|000") {
        "SET"
      } else { "EMPTY/PLACEHOLDER" }
      Write-Host "$key = $status"
    }
  }

# TypeScript baseline
npx tsc --noEmit --pretty 2>&1 | Select-Object -Last 10
```

Produce this discovery report before writing any prompt file:

```
TRANSFORMR COMPLETE DISCOVERY
══════════════════════════════
Bundle ID:        com.automateai.transformr
Branch:           dev
Package manager:  [pnpm/npm — from package.json]
Expo SDK:         [version — LOCKED]
React Native:     [version]

SCREENS ([N] total):
  Auth screens:        [list]
  Onboarding screens:  [list]
  Tab screens:         [list — with tab labels]
  Stack screens:       [list — organized by feature]
  Modal screens:       [list]

ZUSTAND STORES (21):
  [list each store name and what it manages]

SERVICES (50+):
  Working (real API calls): [list]
  Scaffolded (no backend):  [list]
  Broken (errors):          [list]

SUPABASE TABLES (35+):
  [list each table name and purpose]

EDGE FUNCTIONS (12):
  [list each function name and what it does]

AI FEATURES:
  Fully working:      [list]
  Scaffolded only:    [list — the 15 from discovery]
  Not started:        [list]

UI-ONLY SHELLS (no backend — ~10):
  [list each feature and what's missing]

ENV STATUS:
  Live keys set:      [list]
  Missing/placeholder:[list]

TYPESCRIPT BASELINE: [N errors]
```

---

## WHAT YOU MUST PRODUCE

Generate these 4 files. Save each to `C:\dev\transformr\`

---

## FILE 1: TRANSFORMR-SCREEN-BY-SCREEN-VERIFY.md

**Every screen. Every button. Every interaction. Fix everything.**

### Required content:

**SETUP:**
```powershell
cd C:\dev\transformr

# Verify correct build installed
adb shell pm list packages | Select-String "automateai|transformr"
# Must show: com.automateai.transformr

# Port forwarding
adb reverse tcp:8081 tcp:8081
adb reverse tcp:8082 tcp:8082

# Launch app
adb shell am start -n com.automateai.transformr/.MainActivity

# Clear logcat
adb logcat -c
```

**ADB CHEAT SHEET (with TRANSFORMR package name):**
```
adb shell input tap X Y
adb shell input text "string"
adb shell input swipe X1 Y1 X2 Y2 500
adb shell input keyevent 4          # Back
adb shell input keyevent 66         # Enter
adb shell input keyevent 3          # Home
adb shell screencap /sdcard/s.png && adb pull /sdcard/s.png ./screenshots/[name].png
adb logcat -c
adb logcat -d | Select-String "ReactNativeJS|AndroidRuntime|FATAL|Error"
adb shell am force-stop com.automateai.transformr
adb shell am start -n com.automateai.transformr/.MainActivity
adb shell settings put global airplane_mode_on 1
adb shell settings put global airplane_mode_on 0
```

**TAB BAR DISCOVERY:**
Screenshot home screen after login. Record exact tap coordinates for all tabs.
Do not hardcode — measure from actual screenshot.

**PER-SCREEN TESTING LOOP:**

For every screen discovered in Phase 0:
```
SCREEN: [file path]
Navigation: [exact path to reach it]

STEP 1: adb logcat -c
STEP 2: Navigate (provide ADB tap sequence)
STEP 3: adb shell sleep 2.5
STEP 4: Screenshot
STEP 5: adb logcat -d | Select-String "Error|FATAL|Exception"

VERIFY:
[ ] Renders — not blank, not frozen spinner
[ ] Header correct
[ ] Loading state: skeleton or branded spinner
[ ] Data loads: real Supabase or API data (not mock)
[ ] Empty state: branded with CTA (not blank)
[ ] Error state: toast or message with retry (not crash)
[ ] Every button visible and tappable (44×44 minimum)
[ ] Every button has press feedback
[ ] Every button performs correct action — tap each one
[ ] Back navigation works
[ ] Pull-to-refresh on list screens
[ ] Dark mode: no invisible text, no missing elements
[ ] AI features on this screen: ARE THEY WIRED?
[ ] Network calls visible in logcat (Supabase or API)
[ ] No TODO/placeholder/stub text visible to user
[ ] Purple brand colors (#A855F7) correct throughout

IF FAIL: fix with str_replace → tsc → re-verify → commit
RESULT: [PASS] / [FAIL → FIXED] / [FAIL → BLOCKED: reason]
```

**DEEP INTERACTIONS — for every screen also test:**

```
MODALS AND SHEETS:
[ ] Every "+" / "Add" / "Create" button opens correct modal
[ ] Every modal has all fields
[ ] Every modal validates required fields
[ ] Every modal submits to Supabase (verify in logcat)
[ ] Success: modal closes, list updates, haptic feedback
[ ] Error: toast appears, modal stays open, data not lost

FORMS:
[ ] All inputs visible above keyboard
[ ] Keyboard dismiss on tap outside
[ ] Next/Done keyboard actions work
[ ] Character limits enforced where applicable

LISTS:
[ ] Infinite scroll or pagination works
[ ] Pull-to-refresh works
[ ] Search/filter works
[ ] Sort options work
[ ] Empty state correct

AI SCREENS (extra checks):
[ ] Camera opens correctly
[ ] Photo processing shows loading with specific message
[ ] AI result displays as actionable cards
[ ] Accept/save/dismiss per item works
[ ] Error if no camera permission: graceful message
[ ] Error if AI fails: retry option, not crash
```

**QUALITY GATE:**
```powershell
cd C:\dev\transformr
npx tsc --noEmit --pretty 2>&1 | Select-Object -Last 5
```

---

## FILE 2: TRANSFORMR-FUNCTIONAL-VERIFY.md

**Every entity. Every workflow. Real data. Real Supabase calls.**

### Use this realistic test data throughout:

```
User profile: Tyson Lerfald (real account — use actual credentials)
Fitness goal: "Build muscle, lose 15 lbs, run a 5K in under 25 minutes"
Age: [read from profile]
Weight: [read from profile]
Height: [read from profile]

Workout data:
  Workout: "Push Day - Chest & Shoulders"
  Exercise 1: Bench Press, 4 sets: 185×8, 185×8, 175×8, 165×8
  Exercise 2: Incline DB Press, 3 sets: 65×10, 65×10, 60×10
  Exercise 3: Lateral Raises, 3 sets: 25×15, 25×15, 20×15
  Duration: 52 minutes
  Notes: "Felt strong on bench. Left shoulder tight on inclines."

Nutrition data:
  Meal: "Post-Workout Lunch"
  Food 1: Grilled Chicken Breast, 6oz, 281 cal, 52g protein
  Food 2: Brown Rice, 1 cup cooked, 216 cal, 5g protein
  Food 3: Broccoli, 1 cup, 55 cal, 4g protein
  Total: 552 cal, 61g protein, 42g carbs, 6g fat

Habit: "Drink 1 gallon of water daily"
Goal: "Lose 15 lbs by July 4, 2026"
```

**AUTH VERIFICATION:**
```
[ ] Login with Tyson's real credentials
[ ] Profile loads with real data (not placeholder)
[ ] Sign out → sign back in → still on same screen
[ ] Session persists: force stop → reopen → no re-login
[ ] Google sign-in (if available)
[ ] Apple sign-in (document: N/A on Android)
```

**FITNESS/WORKOUT CRUD:**
```
CREATE WORKOUT:
[ ] Navigate to Workouts → "+"
[ ] Name: "Push Day - Chest & Shoulders"
[ ] Add exercises with sets/reps/weight from test data
[ ] Notes added
[ ] Save → Supabase insert → verify in logcat (supabase.co call)
[ ] Workout appears in history

LOG WORKOUT SESSION:
[ ] Start workout from template
[ ] Log each set with actual weights
[ ] Rest timer works
[ ] Complete workout → POST to Supabase
[ ] Calories burned calculated
[ ] Personal records detected and celebrated

AI FORM CHECK (one of the 15 scaffolded features — IMPLEMENT if not working):
[ ] Camera opens during exercise
[ ] Video/photo captured
[ ] Sent to Claude API for form analysis
[ ] Loading: "Analyzing your form..."
[ ] Feedback returned as actionable tips
[ ] Save feedback to workout log
[ ] If not implemented: build fully — no stubs

WORKOUT HISTORY:
[ ] List loads from Supabase (workouts table)
[ ] Calendar view shows workout days
[ ] Filter by muscle group
[ ] Progress charts show real data
[ ] Streak tracking correct
```

**NUTRITION CRUD:**
```
LOG MEAL:
[ ] Navigate to Nutrition → "+"
[ ] Search food database
[ ] Select "Grilled Chicken Breast"
[ ] Set serving: 6oz
[ ] Verify macros: 281 cal, 52g protein
[ ] Add to meal "Post-Workout Lunch"
[ ] Save → Supabase insert
[ ] Meal appears in today's log

MEAL CAMERA AI (scaffolded — IMPLEMENT if not working):
[ ] Camera opens
[ ] Photo taken of food
[ ] Sent to Claude API for food recognition
[ ] Loading: "Identifying your meal..."
[ ] Returns: food items with portion estimates
[ ] Macros auto-populated
[ ] User can edit before saving
[ ] If not implemented: build fully

MACRO CALCULATIONS:
[ ] Daily totals: sum of all logged foods
[ ] Protein: [N]g of [target]g goal
[ ] Carbs: [N]g of [target]g goal
[ ] Fats: [N]g of [target]g goal
[ ] Calories: [N] of [target] goal
[ ] Progress rings/bars update in real time
[ ] Weekly averages correct

NUTRITION HISTORY:
[ ] Weekly view shows all logged meals
[ ] Macro breakdown chart shows real data
[ ] Most logged foods visible
```

**GOALS CRUD:**
```
CREATE GOAL:
[ ] Navigate to Goals → "+"
[ ] Title: "Lose 15 lbs by July 4, 2026"
[ ] Category: Weight Loss
[ ] Target: 185 lbs (or current - 15)
[ ] Deadline: July 4, 2026
[ ] Save → Supabase insert

AI GOAL COACHING:
[ ] Goal detail shows AI-generated action plan
[ ] Weekly check-ins prompt AI feedback
[ ] Progress toward goal calculated correctly
[ ] Milestone celebrations when % hit

GOAL TRACKING:
[ ] Progress bar correct (current vs target)
[ ] Days remaining calculated
[ ] On-track / at-risk / behind indicator
```

**HABITS CRUD:**
```
CREATE HABIT:
[ ] Navigate to Habits → "+"
[ ] Name: "Drink 1 gallon of water daily"
[ ] Category: Hydration
[ ] Frequency: Daily
[ ] Reminder: 8:00 AM
[ ] Save → Supabase insert

HABIT TRACKING:
[ ] Mark today's habit complete → Supabase update
[ ] Streak count increments
[ ] Calendar shows completion history
[ ] Missing a day breaks streak correctly
[ ] Habit analytics show real completion rate

AI HABIT COACHING:
[ ] AI suggests optimal habit timing
[ ] AI feedback on habit patterns
[ ] Connected to overall goals
```

**AI FEATURES — ALL 15 SCAFFOLDED MUST BE IMPLEMENTED:**

For each of these features that is scaffolded but not integrated:
Read the scaffolded component fully → implement the full Claude API call →
wire the result to the UI → verify end-to-end → commit.

```
1. FORM CHECK:
   [ ] Camera opens during workout
   [ ] Sends to Claude API: POST to AI endpoint with base64 image
   [ ] System prompt: "You are a certified personal trainer analyzing exercise form..."
   [ ] Returns: form score, specific corrections, safety warnings
   [ ] Displayed as actionable cards with accept/dismiss

2. MEAL CAMERA:
   [ ] Camera opens on nutrition log
   [ ] Sends to Claude API with food image
   [ ] Returns: identified foods, estimated portions, macros
   [ ] Auto-populates nutrition log
   [ ] User edits before saving

3. LABS ANALYSIS:
   [ ] Camera or upload for blood work photo
   [ ] Sends to Claude API
   [ ] Returns: values in range/out of range, plain-language explanations
   [ ] Actionable recommendations
   [ ] Saved to health profile

4. SUPPLEMENT AI:
   [ ] Camera scans supplement label
   [ ] Sends to Claude API
   [ ] Returns: ingredient analysis, interactions with current stack,
       dosage recommendations, timing advice
   [ ] Saved to supplement log

5-15. [For each remaining scaffolded feature: read the scaffold,
      implement fully using same pattern, verify end-to-end]
```

**UI-ONLY SHELLS — ALL ~10 MUST BE WIRED:**

For each UI-only feature with no backend:
Read the component → identify what Supabase tables/functions it needs →
implement the full data layer → verify → commit.

```
SOCIAL FEATURES:
[ ] User feed loads real posts from Supabase
[ ] Post creation saves to Supabase
[ ] Likes/comments work with real-time updates
[ ] Follow/unfollow updates Supabase
[ ] Notifications for social interactions

MARKETPLACE:
[ ] Products load from real data source
[ ] Purchase flow functional (or clearly in-development with proper message)
[ ] Cart state persists

WIDGETS:
[ ] Home screen widgets show real data
[ ] Update frequency correct
[ ] Tap opens correct screen

NFC:
[ ] NFC tag scan handled gracefully
[ ] If no NFC on emulator: graceful fallback message

VOICE:
[ ] Voice commands processed
[ ] Response speaks back correctly
[ ] If not fully implemented: document scope clearly
```

**SUPABASE VERIFICATION (35+ tables):**
```
For EACH table discovered, verify:
[ ] Data inserts correctly from the relevant screen
[ ] Data reads correctly and displays in UI
[ ] Data updates reflect immediately in UI
[ ] Row-level security enforced (user can't see other users' data)
[ ] Real-time subscriptions work where implemented

EDGE FUNCTIONS (12):
For each edge function:
[ ] Function exists and is deployed
[ ] Called from the correct screen/service
[ ] Returns expected response
[ ] Error handled gracefully in UI

CRITICAL SUPABASE CHECKS:
[ ] Auth JWT valid and refreshes automatically
[ ] Storage: photo uploads succeed (avatars, workout photos, meal photos)
[ ] Storage URLs load in UI (not broken/expired)
[ ] Real-time: live updates work in social feed or notifications
```

**CALCULATION VERIFICATION:**
```
MACROS:
  Chicken 6oz: 281 cal, 52g protein, 0g carbs, 6g fat
  Rice 1 cup: 216 cal, 5g protein, 45g carbs, 2g fat
  Broccoli 1 cup: 55 cal, 4g protein, 11g carbs, 0g fat
  TOTAL: 552 cal, 61g protein, 56g carbs, 8g fat
  [ ] App shows same totals

WORKOUT VOLUME:
  Bench Press: (185×8) + (185×8) + (175×8) + (165×8) = 5,680 lbs total volume
  [ ] App calculates same volume

GOAL PROGRESS:
  Start weight: [current weight]
  Target weight: [current - 15]
  Days elapsed: [calculate]
  Expected progress: [linear interpolation]
  [ ] App shows reasonable progress tracking

STREAK TRACKING:
  Logged 7 days straight → streak = 7
  Miss day 8 → streak resets to 0
  [ ] App resets correctly
```

**EDGE CASES:**
```
[ ] Log 0-calorie meal → handled gracefully
[ ] Workout with 0 sets → blocked or warned
[ ] Goal deadline in the past → handled
[ ] Body weight logged as negative → rejected
[ ] 500+ character notes → accepted and displays correctly
[ ] Rapid double-tap "Log Workout" → only ONE record created
[ ] Log same meal twice rapidly → confirmation or deduplicate
[ ] Network drops mid-workout → data saved locally, syncs on reconnect
[ ] Tab switch during AI processing → AI completes, result available on return
```

---

## FILE 3: TRANSFORMR-AI-ENHANCEMENT-VERIFY.md

**AI features must be real, visible, and working. No stubs. No scaffolds.**

```
TRANSFORMR is marketed as an AI-powered fitness super-app.
Every user interaction that benefits from AI must have it.
AI cannot be hidden — it must be the first option, not the last.

FOR EVERY AI FEATURE:
1. Read current implementation fully
2. Verify Claude API is called (not OpenAI — Anthropic only)
3. Verify loading state is specific ("Analyzing your form...", not "Loading...")
4. Verify results are actionable cards (not raw text dump)
5. Verify error handling is graceful
6. If scaffolded: implement fully now
7. If missing entirely: implement fully now
8. Commit after each: git commit -m "feat(ai): [feature] fully implemented"

AI COACHING SYSTEM:
[ ] Daily briefing: personalized based on yesterday's data
[ ] Workout recommendations: based on muscle recovery + goals
[ ] Nutrition advice: based on macro gaps + goals
[ ] Recovery recommendations: sleep + stress + HRV data
[ ] Weekly review: progress analysis + next week plan

AI VISION FEATURES (implement all 15):
[ ] Form check: camera → Claude → form feedback
[ ] Meal camera: photo → Claude → macro estimation
[ ] Labs analysis: blood work → Claude → health insights
[ ] Supplement AI: label scan → Claude → stack analysis
[ ] Progress photos: before/after → Claude → body composition estimate
[ ] Recipe camera: dish photo → Claude → recipe reconstruction + macros
[ ] Injury assessment: describe pain → Claude → possible cause + next steps
[ ] Sleep analysis: data → Claude → sleep quality insights
[ ] Stress analysis: HRV + inputs → Claude → stress management advice
[ ] Hydration AI: inputs → Claude → personalized hydration targets
[ ] Workout generator: goals + equipment → Claude → custom program
[ ] Meal planner: goals + preferences → Claude → weekly meal plan
[ ] Supplement stack builder: goals + budget → Claude → recommendations
[ ] Cardio optimizer: fitness data → Claude → zone training advice
[ ] Competition prep: goal date + current stats → Claude → periodization plan

AI CONVERSATION (AI Coach chat):
[ ] Natural language questions answered
[ ] Context from user's data (workouts, nutrition, goals) included in prompt
[ ] Responses are personalized, not generic
[ ] Conversation history maintained per session
[ ] Save useful responses to notes
```

---

## FILE 4: TRANSFORMR-AUTONOMOUS-EMULATOR-TEST.md

**The walk-away prompt. All phases. Launch certification at the end.**

```
PREAMBLE:
NEVER remove functionality. ADD/FIX ONLY.
Branch: dev | Root: C:\dev\transformr | Bundle: com.automateai.transformr

Read before starting:
  CLAUDE.md, README.md, TRANSFORMR_DISCOVERY_REPORT.md

DO NOT STOP UNTIL LAUNCH CERTIFICATION READS "YES."
WORK AUTONOMOUSLY. FIX EVERYTHING. NO SHORTCUTS.
```

**PHASE 0 — Known issues (fix before testing):**
- Create SOUL.md and CONFIGURATION_LOCK.md
- Fix env file split (copy live keys from root .env to apps/mobile/.env)
- Add graceful fallback for missing OpenWeatherMap key
- Run TypeScript baseline: npx tsc --noEmit --pretty

**PHASE 1 — App launch:**
- Verify build installed: `adb shell pm list packages | Select-String "automateai"`
- Port forwarding: `adb reverse tcp:8081 tcp:8081`
- Launch: `adb shell am start -n com.automateai.transformr/.MainActivity`
- Screenshot splash, verify auth screen, logcat clean

**PHASE 2 — Auth:**
- Login with Tyson's credentials
- Verify real profile data loads
- Session persistence test
- Social auth if available

**PHASE 3 — Tab discovery:**
- Screenshot tab bar
- Record all tab coordinates from actual UI
- Map all navigation paths

**PHASE 4 — Screen-by-screen (all 95+ screens):**
- Execute testing loop for every screen
- Fix every failure before continuing
- Commit after each screen group

**PHASE 5 — AI features (all 15 scaffolded + wired features):**
- Implement each fully if not working
- Verify Claude API calls (Anthropic, not OpenAI)
- Verify UI result display
- Commit after each

**PHASE 6 — UI shells (all ~10):**
- Social feed: wire to Supabase
- Marketplace: wire to data source
- Widgets, NFC, Voice: implement or document scope
- Commit after each

**PHASE 7 — CRUD for all entities:**
- Workouts, Nutrition, Goals, Habits, Progress
- Real data, real Supabase calls
- All 35+ tables verified

**PHASE 8 — Edge Functions (all 12):**
- Verify each is deployed and called correctly
- Fix any that are broken or not wired

**PHASE 9 — Calculation verification:**
- Macro math, workout volume, goal progress, streaks
- All verified with calculator

**PHASE 10 — Edge cases:**
- Invalid inputs, duplicates, offline, deep nav

**PHASE 11 — Data persistence:**
- Force close → reopen → all data present
- Sign out → sign in → all data present
- Real-time updates work

**PHASE 12 — Code quality:**
```powershell
cd C:\dev\transformr
$ts   = (npx tsc --noEmit --pretty 2>&1 | Select-String "error TS").Count
$stub = (Get-ChildItem apps/mobile/src -Recurse -Filter "*.tsx","*.ts" |
  Select-String "TODO|FIXME|stub|placeholder|coming soon" |
  Where-Object { $_ -notmatch "//" }).Count
$logs = (Get-ChildItem apps/mobile/src -Recurse -Filter "*.tsx","*.ts" |
  Select-String "console\.log" |
  Where-Object { $_ -notmatch "__DEV__|//" }).Count
Write-Host "TS: $ts | Stubs: $stub | Logs: $logs — all must be 0"
```

**PHASE 13 — Final commit:**
```powershell
cd C:\dev\transformr
git add -A
git commit -m "fix: pre-launch verification — 95 screens verified, all AI working, all Supabase tables wired, launch ready"
git push origin dev
```

**PHASE 14 — LAUNCH CERTIFICATION:**
```
TRANSFORMR — LAUNCH CERTIFICATION
═══════════════════════════════════════
Date:                [timestamp]
Bundle ID:           com.automateai.transformr
Branch:              dev
Last commit:         [SHA]

APP LAUNCH:          [PASS/FAIL]
AUTH:                [PASS/FAIL]
SESSION:             [PASS/FAIL]

SCREENS (95+):
  Passed:            [N]
  Fixed:             [N]
  Blocked:           [N — list each]

AI FEATURES:
  Form check:        [WORKING/FIXED/BLOCKED]
  Meal camera:       [WORKING/FIXED/BLOCKED]
  Labs analysis:     [WORKING/FIXED/BLOCKED]
  Supplement AI:     [WORKING/FIXED/BLOCKED]
  [list all 15]

UI SHELLS WIRED:
  Social:            [WORKING/FIXED/BLOCKED]
  Marketplace:       [WORKING/FIXED/BLOCKED]
  Widgets:           [WORKING/FIXED/BLOCKED]
  NFC:               [WORKING/FIXED/BLOCKED]
  Voice:             [WORKING/FIXED/BLOCKED]

SUPABASE (35+ tables):
  All tables wired:  [YES/NO — list gaps]
  Edge functions:    [12/12 working or N working]
  RLS enforced:      [YES/NO]
  Real-time:         [WORKING/BROKEN]

CRUD:
  Workouts:  C:[✓/✗] R:[✓/✗] U:[✓/✗] D:[✓/✗]
  Nutrition: C:[✓/✗] R:[✓/✗] U:[✓/✗] D:[✓/✗]
  Goals:     C:[✓/✗] R:[✓/✗] U:[✓/✗] D:[✓/✗]
  Habits:    C:[✓/✗] R:[✓/✗] U:[✓/✗] D:[✓/✗]
  Progress:  C:[✓/✗] R:[✓/✗] U:[✓/✗] D:[✓/✗]

CALCULATIONS:        [ALL CORRECT / list failures]
OFFLINE:             [PASS/FAIL]
PERSISTENCE:         [PASS/FAIL]

CODE QUALITY:
  TypeScript errors: [0 or N]
  Stubs remaining:   [0 or N]
  console.log:       [0 or N]

ENV STATUS:
  All keys set:      [YES/NO — list missing]

═══════════════════════════════════════
LAUNCH READY: [YES / NO]
═══════════════════════════════════════

If NO — every blocker:
1. [item]
...

DO NOT STOP UNTIL THIS READS YES.
```

---

## SAVE ALL 4 FILES TO C:\dev\transformr\

After generating all 4 files, commit them:
```powershell
cd C:\dev\transformr
git add TRANSFORMR-SCREEN-BY-SCREEN-VERIFY.md
git add TRANSFORMR-FUNCTIONAL-VERIFY.md
git add TRANSFORMR-AI-ENHANCEMENT-VERIFY.md
git add TRANSFORMR-AUTONOMOUS-EMULATOR-TEST.md
git add SOUL.md
git add CONFIGURATION_LOCK.md
git commit -m "chore: add pre-launch verification suite — 95 screens, 4 prompts, SOUL.md, CONFIGURATION_LOCK.md"
git push origin dev
```

Then print:
```
TRANSFORMR PROMPT GENERATION COMPLETE
══════════════════════════════════════
1. TRANSFORMR-SCREEN-BY-SCREEN-VERIFY.md  — [N] screens, 8 checks each
2. TRANSFORMR-FUNCTIONAL-VERIFY.md        — [N] entities, all Supabase tables
3. TRANSFORMR-AI-ENHANCEMENT-VERIFY.md   — 15 AI vision features + coaching
4. TRANSFORMR-AUTONOMOUS-EMULATOR-TEST.md — 14 phases, YES/NO certification

Files saved to C:\dev\transformr\
Ready to paste into Claude Code sessions.
```

## DO NOT STOP UNTIL ALL 4 FILES ARE WRITTEN AND COMMITTED.
## USE REAL PATHS FROM THE DISCOVERY REPORT. NO PLACEHOLDERS.
## THE APP SHIPS AFTER THESE PASS. BUILD TO THAT STANDARD.
