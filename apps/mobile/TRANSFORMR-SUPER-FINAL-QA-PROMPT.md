# TRANSFORMR — FINAL COMPLETE QA + ENHANCEMENT SUPER PROMPT
## Automate AI LLC | Branch: dev | April 2026
## The most thorough app verification ever run on this codebase.
## DO NOT STOP UNTIL EVERY SCREEN PASSES AND THE APP IS THE BEST ON THE MARKET.

---

## WHO YOU ARE

You are simultaneously:
- A **principal React Native engineer** who ships zero-defect production apps
- A **senior UX architect** who has shipped top-10 App Store health apps
- An **autonomous QA engineer** who finds bugs users haven't discovered yet
- An **AI product designer** who makes every surface smarter with Claude AI
- A **layout/visual engineer** who makes every pixel perfect

You have full control of the Android emulator via ADB. You run the app, tap every button,
navigate every screen, read every logcat error, fix every issue, and do not stop until
the app is flawless. You work autonomously without asking permission.

---

## ABSOLUTE RULES — ZERO EXCEPTIONS

```
NEVER kill any process. NEVER run taskkill, Stop-Process, kill, or Stop-Process.
NEVER remove features. NEVER downgrade functionality. ONLY ADD, FIX, IMPROVE.
NEVER use console.log — only console.warn and console.error.
NEVER use 'any' types. NEVER use @ts-ignore. Fix the actual type.
NEVER create stubs, placeholders, or TODO comments.
NEVER hardcode hex colors — use theme tokens exclusively.
NEVER skip a screen because it seems fine — TAP EVERY BUTTON on EVERY SCREEN.
ALL paddings/margins must use SafeAreaInsets — NO content under status bar or tab bar.
ALL cards must have correct horizontal padding — NO content cut off at screen edges.
ALL AI calls must include COMPLIANCE_PREAMBLE + full user context.
COMMIT after each major screen group. PUSH after all phases complete.
METRO must stay on port 8081 (Claude Code's session) — start a monitoring process only.
```

---

## PHASE 0 — STARTUP AND BASELINE

### 0.1 — Read the complete codebase structure

```powershell
cd C:\dev\transformr\apps\mobile

Write-Host "=== COMPLETE SCREEN INVENTORY ===" -ForegroundColor Cyan
Get-ChildItem app -Recurse -Filter "*.tsx" | Where-Object { $_.Name -ne "_layout.tsx" } |
  Sort-Object FullName |
  ForEach-Object {
    $lines = (Get-Content $_.FullName).Count
    "$lines  $($_.FullName.Replace('C:\dev\transformr\apps\mobile\app\',''))"
  }

Write-Host "`n=== TOTAL COUNTS ===" -ForegroundColor Cyan
Write-Host "Screens: $((Get-ChildItem app -Recurse -Filter '*.tsx' | Where-Object { $_.Name -ne '_layout.tsx' }).Count)"
Write-Host "Components: $((Get-ChildItem components -Recurse -Filter '*.tsx').Count)"
Write-Host "Stores: $((Get-ChildItem stores -Filter '*.ts').Count)"
```

### 0.2 — TypeScript and ESLint baseline (must be 0 before proceeding)

```powershell
cd C:\dev\transformr\apps\mobile
npx tsc --noEmit 2>&1 | Tee-Object C:\dev\logs\ts-start.txt
$tsErrors = (Get-Content C:\dev\logs\ts-start.txt | Select-String "error TS").Count
Write-Host "TypeScript errors at start: $tsErrors"

npx eslint . --ext .ts,.tsx --max-warnings 0 2>&1 | Tee-Object C:\dev\logs\lint-start.txt
$lintErrors = (Get-Content C:\dev\logs\lint-start.txt | Select-String " error ").Count
Write-Host "ESLint errors at start: $lintErrors"
```

Fix ALL errors before proceeding. Zero tolerance.

### 0.3 — Start Metro monitor (non-blocking)

```powershell
# Verify Metro is already running on 8081 from Claude Code's session
try {
  $r = Invoke-WebRequest -Uri "http://localhost:8081/status" -TimeoutSec 3 -ErrorAction Stop
  Write-Host "✅ Metro running on 8081" -ForegroundColor Green
} catch {
  Write-Host "⚠️ Metro not responding on 8081 — check Claude Code's Metro terminal" -ForegroundColor Yellow
  Write-Host "   Start it with: cd C:\dev\transformr\apps\mobile && npx expo start --port 8081 --clear"
}

# Forward port
adb reverse tcp:8081 tcp:8081
Write-Host "✅ ADB port forwarded"
```

### 0.4 — Start logcat monitoring to file

```powershell
New-Item -ItemType Directory -Path "C:\dev\logs" -Force | Out-Null
New-Item -ItemType Directory -Path "C:\dev\transformr\apps\mobile\screenshots" -Force | Out-Null

# Clear logcat
adb logcat -c
Write-Host "✅ Logcat cleared — monitoring begins"
```

### 0.5 — Verify emulator and app

```powershell
# Check emulator
$devices = adb devices
Write-Host "Connected devices: $devices"

# Verify TRANSFORMR is installed
$installed = adb shell pm list packages | Select-String "com.automateai.transformr"
if (-not $installed) {
  Write-Host "❌ TRANSFORMR not installed. Rebuild required:" -ForegroundColor Red
  Write-Host "   npx expo run:android --port 8081"
} else {
  Write-Host "✅ TRANSFORMR installed" -ForegroundColor Green
}

# Launch the app
adb shell am start -n "com.automateai.transformr/.MainActivity"
Start-Sleep -Seconds 5
```

---

## PHASE 1 — GLOBAL LAYOUT FIXES (fix these FIRST before testing anything)

These issues affect every screen and must be fixed globally before individual screen testing.

### 1.1 — Fix SafeAreaView on ALL screens

The #1 issue: content bleeding under the status bar (top) and tab bar (bottom).

Read `apps/mobile/app/(tabs)/_layout.tsx` and verify `SafeAreaProvider` wraps everything.

Then scan every screen for improper safe area handling:

```powershell
cd C:\dev\transformr\apps\mobile

# Find screens NOT using safe area
$screens = Get-ChildItem app -Recurse -Filter "*.tsx" | Where-Object { $_.Name -ne "_layout.tsx" }
$noSafeArea = @()
foreach ($s in $screens) {
  $content = Get-Content $s.FullName -Raw
  $hasSafeArea = $content -match "useSafeAreaInsets|SafeAreaView|edges="
  if (-not $hasSafeArea) {
    $noSafeArea += $s.Name
  }
}
Write-Host "Screens without safe area handling ($($noSafeArea.Count)):"
$noSafeArea | ForEach-Object { Write-Host "  - $_" }
```

For EVERY screen not using safe area insets, add:

```typescript
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// In component:
const insets = useSafeAreaInsets();

// Top container must have paddingTop: insets.top
// Bottom ScrollView must have contentContainerStyle={{ paddingBottom: insets.bottom + 90 }}
// The +90 accounts for the tab bar height (49) + safe area buffer
```

### 1.2 — Fix horizontal padding on ALL screens

Content cut off at screen edges is a critical visual bug.

Correct horizontal padding spec:
- Screen-level horizontal padding: `16px` minimum
- Cards inside a screen: `marginHorizontal: 16`
- Full-width elements (buttons, dividers): `0` margin, `16` padding inside
- List items: `paddingHorizontal: 16`

```powershell
# Find screens with zero horizontal padding
$screens | ForEach-Object {
  $content = Get-Content $_.FullName -Raw
  if ($content -match "paddingHorizontal:\s*0|marginHorizontal:\s*0" -and
      $content -notmatch "paddingHorizontal:\s*1[0-9]|marginHorizontal:\s*1[0-9]") {
    Write-Host "⚠️  Check padding: $($_.Name)"
  }
}
```

### 1.3 — Fix status bar color on ALL screens

```typescript
// Every screen must have the correct status bar
import { StatusBar } from 'expo-status-bar';

// In JSX:
<StatusBar style="light" backgroundColor="#0C0A15" />
```

Scan and fix:
```powershell
$screens | ForEach-Object {
  $content = Get-Content $_.FullName -Raw
  if (-not ($content -match "StatusBar")) {
    Write-Host "Missing StatusBar: $($_.Name)"
  }
}
```

### 1.4 — Fix card border radius and shadows

Every card must use the design system values:
- `borderRadius: 16` (from `theme.borderRadius.lg`)
- `backgroundColor: colors.background.secondary` (`#16122A`)
- `borderWidth: 1`
- `borderColor: rgba(168, 85, 247, 0.15)` (subtle purple border)

Commit:
```powershell
cd C:\dev\transformr
git add -A
git commit -m "fix: global layout — SafeAreaInsets on all screens, horizontal padding, status bar, card borders"
```

---

## PHASE 2 — EMULATOR CONTROL: SIGN IN AND NAVIGATE

### 2.1 — Sign in

```powershell
# Take initial screenshot
adb shell screencap -p /sdcard/s0_launch.png && adb pull /sdcard/s0_launch.png "C:\dev\transformr\apps\mobile\screenshots\s0_launch.png"

# Check current screen
$top = adb shell dumpsys activity top | Select-String "transformr|Activity"
Write-Host "Current: $top"

# If on login screen, sign in
# VERIFIED: Pixel 7 1080x2400 @ 420dpi coordinates:
adb shell input tap 540 600    # Email field
Start-Sleep -Seconds 1
adb shell input text "test@transformr.app"
adb shell input tap 540 730    # Password field
Start-Sleep -Seconds 1
adb shell input text "Test1234!"
adb shell input keyevent 111   # Hide keyboard
Start-Sleep -Seconds 1
adb shell input tap 540 870    # Sign In button
Start-Sleep -Seconds 5

# Screenshot after login
adb shell screencap -p /sdcard/s1_post_login.png && adb pull /sdcard/s1_post_login.png "C:\dev\transformr\apps\mobile\screenshots\s1_post_login.png"
```

### 2.2 — Define helper functions

```powershell
function Tap { param([int]$x, [int]$y, [int]$wait = 1)
  adb shell input tap $x $y
  Start-Sleep -Seconds $wait
}

function Screenshot { param([string]$name)
  adb shell screencap -p /sdcard/ss.png
  adb pull /sdcard/ss.png "C:\dev\transformr\apps\mobile\screenshots\$name.png" 2>&1 | Out-Null
  Write-Host "📸 $name"
}

function CheckLogcat {
  $errors = adb logcat -d | Select-String "ERROR|FATAL|Exception|Cannot read|undefined is not|null is not" |
    Where-Object { $_ -match "ReactNativeJS|JS ERROR" } |
    Where-Object { $_ -notmatch "WebSocket|Metro|HMR|Fast Refresh|Reanimated" }
  if ($errors.Count -gt 0) {
    Write-Host "❌ LOGCAT ERRORS:" -ForegroundColor Red
    $errors | Select-Object -Last 10 | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
    return $true
  }
  Write-Host "✅ Logcat clean" -ForegroundColor Green
  return $false
}

function NavTab { param([int]$tab)
  # VERIFIED: Pixel 7 — 1080x2400 @ 420dpi
  # Tab bar Y: 2300
  # Tab X positions: Dashboard=108, Fitness=324, Nutrition=540, Goals=756, Profile=972
  $tabX = @(108, 324, 540, 756, 972)
  adb shell input tap $tabX[$tab] 2300
  Start-Sleep -Seconds 3
  adb logcat -c
}

function GoBack {
  adb shell input keyevent KEYCODE_BACK
  Start-Sleep -Seconds 2
}
```

---

## PHASE 3 — COMPREHENSIVE SCREEN-BY-SCREEN TESTING

For EVERY screen: navigate to it, tap every interactive element, check logcat, fix errors.
This is not a sampling — it is 100% coverage of every screen and every button.

### TAB 1: DASHBOARD

```powershell
NavTab -tab 0
Screenshot "dashboard_main"
CheckLogcat

# Test every element on dashboard:
# Tap countdown widget
Tap 540 300 2; Screenshot "dash_countdown"; CheckLogcat

# Tap stats cards (calories, protein, water, workout)
Tap 180 500 2; Screenshot "dash_stats_cal"; CheckLogcat
Tap 420 500 2; Screenshot "dash_stats_protein"; CheckLogcat
Tap 660 500 2; Screenshot "dash_stats_water"; CheckLogcat
Tap 900 500 2; Screenshot "dash_stats_workout"; CheckLogcat

# Tap quick action buttons
Tap 200 800 2; Screenshot "dash_qa_workout"; CheckLogcat
GoBack; Start-Sleep -Seconds 2
Tap 540 800 2; Screenshot "dash_qa_meal"; CheckLogcat
GoBack; Start-Sleep -Seconds 2
Tap 880 800 2; Screenshot "dash_qa_weight"; CheckLogcat
GoBack; Start-Sleep -Seconds 2

# Tap streak row
Tap 540 1000 2; Screenshot "dash_streaks"; CheckLogcat
GoBack; Start-Sleep -Seconds 2

# Tap AI insight card
Tap 540 1200 2; Screenshot "dash_ai_insight"; CheckLogcat
GoBack; Start-Sleep -Seconds 2

# Tap AI Chat FAB (purple button bottom right — above tab bar)
Tap 980 2150 2; Screenshot "dash_chat_fab"; CheckLogcat
GoBack; Start-Sleep -Seconds 2

# Tap proactive message if visible
Tap 540 400 2; Screenshot "dash_proactive"; CheckLogcat
GoBack; Start-Sleep -Seconds 2

Write-Host "✅ Dashboard testing complete"
```

### TAB 2: FITNESS

```powershell
NavTab -tab 1
Screenshot "fitness_main"
CheckLogcat

# ---- FITNESS INDEX ----
# Today's workout card
Tap 540 400 3; Screenshot "fitness_today_workout"; CheckLogcat
GoBack

# Start Workout button
Tap 540 600 3; Screenshot "fitness_start_workout_modal"; CheckLogcat

# ---- WORKOUT PLAYER ----
# (If workout player opens)
Screenshot "workout_player_open"
# Add first exercise
Tap 540 1500 2; Screenshot "workout_add_exercise"; CheckLogcat
# Search for exercise
Tap 540 400 2
adb shell input text "bench"
Start-Sleep -Seconds 2; Screenshot "workout_exercise_search"; CheckLogcat
# Select first result
Tap 540 600 2; Screenshot "workout_exercise_selected"; CheckLogcat
# Log a set - rep field
Tap 300 1200 1; adb shell input text "10"
# Weight field
Tap 700 1200 1; adb shell input text "135"
# Log set button
Tap 540 1400 3; Screenshot "workout_set_logged"; CheckLogcat
# RPE slider
Tap 540 1600 2; Screenshot "workout_rpe"; CheckLogcat
# Rest timer
Screenshot "workout_rest_timer"; CheckLogcat
Start-Sleep -Seconds 5
# End workout
Tap 540 300 2; Screenshot "workout_end_confirm"; CheckLogcat
Tap 540 1400 3; Screenshot "workout_summary"; CheckLogcat
GoBack

# ---- EXERCISE LIBRARY ----
Tap 540 1800 2; Screenshot "fitness_exercises"; CheckLogcat
# Search
Tap 540 200 1; adb shell input text "squat"
Start-Sleep -Seconds 2; Screenshot "exercises_search"; CheckLogcat
# Tap first result
Tap 540 500 2; Screenshot "exercise_detail"; CheckLogcat
# Tap muscle group on body map
Tap 300 500 2; Screenshot "exercise_bodymap"; CheckLogcat
GoBack; GoBack

# Clear search and test filters
Tap 540 200 1; adb shell input keyevent KEYCODE_CTRL_A; adb shell input keyevent KEYCODE_DEL
# Tap muscle group filter tiles
Tap 108 400 2; Screenshot "exercises_filter_chest"; CheckLogcat
Tap 324 400 2; Screenshot "exercises_filter_back"; CheckLogcat
GoBack

# ---- PROGRESS SCREEN ----
Tap 200 1900 2; Screenshot "fitness_progress"; CheckLogcat
# Weight chart
Tap 540 400 2; Screenshot "progress_weight_chart"; CheckLogcat
# Measurements tab
Tap 324 300 2; Screenshot "progress_measurements"; CheckLogcat
# PRs tab
Tap 540 300 2; Screenshot "progress_prs"; CheckLogcat
# Photos tab
Tap 756 300 2; Screenshot "progress_photos"; CheckLogcat
GoBack

# ---- FORM CHECK ----
Tap 400 1900 2; Screenshot "fitness_formcheck"; CheckLogcat
GoBack

# ---- PAIN TRACKER ----
Tap 600 1900 2; Screenshot "fitness_pain_tracker"; CheckLogcat
# Tap body map areas (front)
Tap 200 400 2; Screenshot "pain_front_shoulder"; CheckLogcat
Tap 400 600 2; Screenshot "pain_front_chest"; CheckLogcat
Tap 300 800 2; Screenshot "pain_front_core"; CheckLogcat
# Toggle to back view
Tap 540 1200 2; Screenshot "pain_back_view"; CheckLogcat
Tap 300 400 2; Screenshot "pain_back_shoulder"; CheckLogcat
GoBack

# ---- MOBILITY ----
Tap 800 1900 2; Screenshot "fitness_mobility"; CheckLogcat
GoBack

# ---- PROGRAMS ----
Tap 540 1700 2; Screenshot "fitness_programs"; CheckLogcat
Tap 540 500 2; Screenshot "program_detail"; CheckLogcat
GoBack; GoBack

Write-Host "✅ Fitness tab testing complete"
```

### TAB 3: NUTRITION

```powershell
NavTab -tab 2
Screenshot "nutrition_main"
CheckLogcat

# ---- NUTRITION DAILY VIEW ----
# Tap macro rings
Tap 540 400 2; Screenshot "nutrition_macros"; CheckLogcat
# Tap each meal section
Tap 540 700 2; Screenshot "nutrition_breakfast"; CheckLogcat
Tap 540 900 2; Screenshot "nutrition_lunch"; CheckLogcat
Tap 540 1100 2; Screenshot "nutrition_dinner"; CheckLogcat
Tap 540 1300 2; Screenshot "nutrition_snacks"; CheckLogcat
# Water tracker taps
Tap 200 1700 2; Screenshot "nutrition_water_log"; CheckLogcat
Tap 400 1700 2; Screenshot "nutrition_water_log2"; CheckLogcat

# ---- ADD FOOD ----
Tap 150 2050 3; Screenshot "nutrition_add_food"; CheckLogcat
# Search for food
Tap 540 300 1; adb shell input text "chicken breast"
Start-Sleep -Seconds 3; Screenshot "food_search_results"; CheckLogcat
# Tap first result
Tap 540 600 2; Screenshot "food_detail"; CheckLogcat
# Adjust serving size
Tap 700 800 1; adb shell input text "2"
# Log it
Tap 540 1500 2; Screenshot "food_logged"; CheckLogcat
GoBack

# ---- MEAL CAMERA ----
# (Checks feature gate first)
Tap 350 2050 2; Screenshot "nutrition_camera_gate"; CheckLogcat
GoBack

# ---- BARCODE SCANNER ----
Tap 550 2050 2; Screenshot "nutrition_barcode_gate"; CheckLogcat
GoBack

# ---- SAVED MEALS ----
Tap 200 1600 2; Screenshot "nutrition_saved_meals"; CheckLogcat
Tap 540 500 2; Screenshot "saved_meal_detail"; CheckLogcat
GoBack; GoBack

# ---- SUPPLEMENTS ----
Tap 400 1600 2; Screenshot "nutrition_supplements"; CheckLogcat
# Tap supplement check-off
Tap 100 500 2; Screenshot "supplement_checked"; CheckLogcat
# Tap supplement detail
Tap 540 500 2; Screenshot "supplement_detail"; CheckLogcat
# I restocked button
Tap 540 1800 2; Screenshot "supplement_restock"; CheckLogcat
GoBack; GoBack

# ---- MEAL PREP ----
Tap 600 1600 2; Screenshot "nutrition_meal_prep"; CheckLogcat
# Tier tabs
Tap 200 400 2; Screenshot "meal_prep_good"; CheckLogcat
Tap 540 400 2; Screenshot "meal_prep_better"; CheckLogcat
Tap 880 400 2; Screenshot "meal_prep_best"; CheckLogcat
GoBack

# ---- GROCERY LIST ----
Tap 800 1600 2; Screenshot "nutrition_grocery"; CheckLogcat
# Check "already have" toggle
Tap 100 500 2; Screenshot "grocery_toggle"; CheckLogcat
# Share list
Tap 950 200 2; Screenshot "grocery_share"; CheckLogcat
GoBack

# ---- NUTRITION ANALYTICS ----
Tap 540 1900 2; Screenshot "nutrition_analytics"; CheckLogcat
GoBack

# ---- MENU SCANNER ----
Tap 750 2050 2; Screenshot "nutrition_menu_scanner"; CheckLogcat
GoBack

Write-Host "✅ Nutrition tab testing complete"
```

### TAB 4: GOALS

```powershell
NavTab -tab 3
Screenshot "goals_main"
CheckLogcat

# ---- GOALS INDEX ----
# Tap each section card
Tap 540 400 2; Screenshot "goals_habits"; CheckLogcat

# ---- HABITS ----
# Complete a habit
Tap 100 500 2; Screenshot "habit_completed"; CheckLogcat
# Check streak badge
Tap 540 600 2; Screenshot "habit_streak"; CheckLogcat
# Add habit button
Tap 950 200 2; Screenshot "habit_add"; CheckLogcat
# Fill out new habit
Tap 540 400 1; adb shell input text "Morning run"
Tap 540 1600 2; Screenshot "habit_saved"; CheckLogcat
GoBack

# ---- SLEEP ----
GoBack
Tap 540 600 2; Screenshot "goals_sleep"; CheckLogcat
# Bed time input
Tap 300 500 1; adb shell input text "10:30"
# Wake time input
Tap 700 500 1; adb shell input text "6:30"
# Quality rating
Tap 540 700 2; Screenshot "sleep_quality"; CheckLogcat
# Save
Tap 540 1700 2; Screenshot "sleep_saved"; CheckLogcat
GoBack

# ---- MOOD ----
GoBack
Tap 540 700 2; Screenshot "goals_mood"; CheckLogcat
# Tap mood emoji
Tap 200 500 2; Screenshot "mood_selected"; CheckLogcat
# Notes
Tap 540 800 1; adb shell input text "Feeling great today"
Tap 540 1700 2; Screenshot "mood_saved"; CheckLogcat
GoBack

# ---- JOURNAL ----
GoBack
Tap 540 800 2; Screenshot "goals_journal"; CheckLogcat
Tap 950 200 2; Screenshot "journal_new"; CheckLogcat
Tap 540 600 1; adb shell input text "Today was a great training day. Hit a new PR on bench press."
# AI prompt button
Tap 200 1800 2; Screenshot "journal_ai_prompt"; CheckLogcat
# Save
Tap 950 200 2; Screenshot "journal_saved"; CheckLogcat
GoBack; GoBack

# ---- FOCUS MODE ----
GoBack
Tap 540 900 2; Screenshot "goals_focus"; CheckLogcat
# Start timer
Tap 540 800 2; Screenshot "focus_started"; CheckLogcat
# Stop timer
Tap 540 1200 2; Screenshot "focus_stopped"; CheckLogcat
GoBack

# ---- VISION BOARD ----
GoBack
Tap 540 1000 2; Screenshot "goals_vision_board"; CheckLogcat
GoBack

# ---- CHALLENGES ----
GoBack
Tap 540 1100 2; Screenshot "goals_challenges"; CheckLogcat
Tap 540 500 2; Screenshot "challenge_detail"; CheckLogcat
GoBack; GoBack

# ---- STAKE GOALS ----
GoBack
Tap 540 1200 2; Screenshot "goals_stake"; CheckLogcat
GoBack

# ---- SKILLS ----
GoBack
Tap 540 1300 2; Screenshot "goals_skills"; CheckLogcat
Tap 950 200 2; Screenshot "skill_add"; CheckLogcat
GoBack; GoBack

# ---- BUSINESS ----
GoBack
Tap 540 1500 2; Screenshot "goals_business"; CheckLogcat
# Revenue
Tap 540 400 2; Screenshot "business_revenue"; CheckLogcat
# Log revenue button
Tap 950 200 2; Screenshot "business_log_revenue"; CheckLogcat
Tap 540 400 1; adb shell input text "1500"
Tap 540 1700 2; Screenshot "revenue_logged"; CheckLogcat
GoBack
# Customers
Tap 200 300 2; Screenshot "business_customers"; CheckLogcat
GoBack
# Milestones
Tap 400 300 2; Screenshot "business_milestones"; CheckLogcat
GoBack; GoBack

# ---- FINANCE ----
GoBack
Tap 540 1700 2; Screenshot "goals_finance"; CheckLogcat
# Transactions
Tap 200 300 2; Screenshot "finance_transactions"; CheckLogcat
GoBack
# Budgets
Tap 400 300 2; Screenshot "finance_budgets"; CheckLogcat
GoBack
# Net Worth
Tap 600 300 2; Screenshot "finance_networth"; CheckLogcat
GoBack; GoBack

Write-Host "✅ Goals tab testing complete"
```

### TAB 5: PROFILE

```powershell
NavTab -tab 4
Screenshot "profile_main"
CheckLogcat

# ---- PROFILE INDEX ----
# XP bar tap
Tap 540 400 2; Screenshot "profile_xp"; CheckLogcat
# Tier badge tap → upgrade modal
Tap 900 300 2; Screenshot "profile_upgrade_modal"; CheckLogcat
GoBack

# ---- ACHIEVEMENTS ----
Tap 540 700 2; Screenshot "profile_achievements"; CheckLogcat
# Tap a locked achievement
Tap 200 600 2; Screenshot "achievement_locked"; CheckLogcat
# Tap an unlocked achievement
Tap 400 600 2; Screenshot "achievement_unlocked"; CheckLogcat
GoBack

# ---- PARTNER ----
Tap 540 900 2; Screenshot "profile_partner"; CheckLogcat
# Partner dashboard
Tap 540 500 2; Screenshot "partner_dashboard"; CheckLogcat
# Live workout
Tap 540 700 2; Screenshot "partner_live"; CheckLogcat
GoBack
# Send nudge
Tap 540 900 2; Screenshot "partner_nudge"; CheckLogcat
GoBack; GoBack

# ---- DASHBOARD BUILDER ----
Tap 540 1100 2; Screenshot "profile_dashboard_builder"; CheckLogcat
# Toggle a widget
Tap 100 500 2; Screenshot "dashboard_widget_toggled"; CheckLogcat
GoBack

# ---- NOTIFICATIONS SETTINGS ----
Tap 540 1300 2; Screenshot "profile_notifications"; CheckLogcat
# Toggle each slot
Tap 900 400 1; Screenshot "notif_toggle1"; CheckLogcat
Tap 900 500 1; Screenshot "notif_toggle2"; CheckLogcat
Tap 900 600 1; Screenshot "notif_toggle3"; CheckLogcat
# Test notification button
Tap 540 1800 2; Screenshot "notif_test"; CheckLogcat
GoBack

# ---- INTEGRATIONS ----
Tap 540 1500 2; Screenshot "profile_integrations"; CheckLogcat
# Apple Health toggle
Tap 900 300 2; Screenshot "integration_health"; CheckLogcat
# Spotify connect
Tap 900 500 2; Screenshot "integration_spotify"; CheckLogcat
# Strava connect
Tap 900 700 2; Screenshot "integration_strava"; CheckLogcat
GoBack

# ---- NFC SETUP ----
Tap 540 1700 2; Screenshot "profile_nfc"; CheckLogcat
GoBack

# ---- DATA EXPORT ----
Tap 540 1900 2; Screenshot "profile_data_export"; CheckLogcat
# Tap CSV export
Tap 540 400 2; Screenshot "export_csv"; CheckLogcat
GoBack

# ---- ABOUT ----
Tap 540 2100 2; Screenshot "profile_about"; CheckLogcat
# Privacy policy link
Tap 540 700 2; Screenshot "about_privacy"; CheckLogcat
GoBack
# Terms link
Tap 540 900 2; Screenshot "about_terms"; CheckLogcat
GoBack
# Support link
Tap 540 1100 2; Screenshot "about_support"; CheckLogcat
GoBack; GoBack

Write-Host "✅ Profile tab testing complete"
```

### STANDALONE SCREENS

```powershell
# ---- AI CHAT ----
Tap 980 2150 3; Screenshot "chat_open"; CheckLogcat
# Send a message
Tap 540 2200 1; adb shell input text "What should I eat today to hit my protein goal?"
Tap 900 2200 1
Start-Sleep -Seconds 6; Screenshot "chat_response"; CheckLogcat
# New chat button
Tap 200 200 2; Screenshot "chat_new"; CheckLogcat
# Chat history
Tap 800 200 2; Screenshot "chat_history"; CheckLogcat
GoBack; GoBack

# ---- LABS ----
NavTab -tab 3
Tap 540 1400 2  # Find labs button
Screenshot "labs_screen"; CheckLogcat
# Upload button
Tap 540 800 2; Screenshot "labs_upload"; CheckLogcat
GoBack; GoBack

# ---- TRAJECTORY ----
NavTab -tab 0
Tap 200 1500 2; Screenshot "trajectory_screen"; CheckLogcat
GoBack

# ---- WEEKLY REVIEW ----
Tap 400 1500 2; Screenshot "weekly_review"; CheckLogcat
GoBack

# ---- GOAL CINEMA ----
Tap 600 1500 2; Screenshot "goal_cinema"; CheckLogcat
GoBack

# ---- DAILY BRIEFING ----
Tap 800 1500 2; Screenshot "daily_briefing"; CheckLogcat
GoBack

# ---- UPGRADE MODAL ----
NavTab -tab 2
Tap 350 2050 2; Screenshot "upgrade_modal_camera"; CheckLogcat
# Annual toggle
Tap 900 400 2; Screenshot "upgrade_annual"; CheckLogcat
# Tap Pro CTA
Tap 540 1200 2; Screenshot "upgrade_pro_cta"; CheckLogcat
GoBack

Write-Host "✅ Standalone screens testing complete"
```

---

## PHASE 4 — FIX ALL ERRORS FOUND

After completing Phase 3, read ALL screenshots and logcat errors and fix every issue:

```powershell
# Capture final logcat state
adb logcat -d 2>&1 | Tee-Object C:\dev\logs\logcat-phase3.txt
$errors = Get-Content C:\dev\logs\logcat-phase3.txt |
  Select-String "ERROR|FATAL|Exception|Cannot read|undefined is not|null is not" |
  Where-Object { $_ -match "ReactNativeJS" -and $_ -notmatch "WebSocket|Metro|HMR" }

Write-Host "Total JS errors found: $($errors.Count)"
$errors | ForEach-Object { Write-Host $_ -ForegroundColor Red }
```

Fix every error by category:

**Null/undefined errors:**
- Add optional chaining: `data?.field ?? defaultValue`
- Add null guards before renders

**Network errors:**
- Verify Supabase credentials in .env
- Add proper error states to the screen

**Navigation errors:**
- Check route is registered in correct `_layout.tsx`
- Verify all `router.push()` paths exist as files

**Layout overflow (content under status bar):**
```typescript
// Fix pattern for every affected screen:
const insets = useSafeAreaInsets();
<View style={{ paddingTop: insets.top, paddingHorizontal: 16 }}>
```

**Content cut off at edges:**
```typescript
// Fix: ensure 16px minimum padding on all sides
<ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 90 }}>
```

---

## PHASE 5 — UI/UX ENHANCEMENTS

After all bugs are fixed, apply these enhancements to every screen:

### 5.1 — Ensure every AI-capable screen has AI

Check these screens have AI insight cards or AI-powered features:

```powershell
$aiScreens = @(
  "dashboard.tsx", "fitness/index.tsx", "nutrition/index.tsx",
  "goals/habits.tsx", "goals/sleep.tsx", "goals/index.tsx",
  "goals/business/index.tsx", "goals/finance/index.tsx"
)
foreach ($screen in $aiScreens) {
  $content = Get-Content "app/(tabs)/$screen" -Raw -ErrorAction SilentlyContinue
  $hasAI = $content -match "AIInsightCard|ai-insights|invoke.*ai|useInsights"
  Write-Host "$(if ($hasAI) { '✅' } else { '❌ Missing AI' })  $screen"
}
```

### 5.2 — Verify haptic feedback on key interactions

Every important action must have haptics:
- PR celebration: `Haptics.notificationAsync(NotificationFeedbackType.Success)`
- Button press: `Haptics.impactAsync(ImpactFeedbackStyle.Medium)`
- Error: `Haptics.notificationAsync(NotificationFeedbackType.Error)`
- Toggle: `Haptics.impactAsync(ImpactFeedbackStyle.Light)`

### 5.3 — Verify all numeric displays use monospace font

```powershell
cd C:\dev\transformr\apps\mobile
# Find stat numbers not using monospace
Get-ChildItem app -Recurse -Filter "*.tsx" | ForEach-Object {
  $content = Get-Content $_.FullName -Raw
  if ($content -match "typography\.stat|fontFamily.*Mono" -or
      $content -match "\blbs\b|\bcal\b|\bg\b.*protein") {
    # Check these screens have monospace on their stat displays
    $hasMono = $content -match "fontFamily.*Mono|SpaceMono|typography\.stat"
    if (-not $hasMono) {
      Write-Host "⚠️  Missing monospace stats: $($_.Name)"
    }
  }
}
```

### 5.4 — Verify pull-to-refresh on all data screens

Every screen with a list or data must have pull-to-refresh:
```typescript
const [refreshing, setRefreshing] = useState(false);
const onRefresh = useCallback(async () => {
  setRefreshing(true);
  await fetchData();
  setRefreshing(false);
}, []);

<FlatList
  refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent.primary} />}
/>
```

### 5.5 — Verify all bottom sheets have drag handle

Every bottom sheet must have a visible drag handle:
```typescript
// At top of bottom sheet content:
<View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 8 }}>
  <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(168,85,247,0.4)' }} />
</View>
```

### 5.6 — Verify all loading states use skeleton not spinner

Replace any `ActivityIndicator` loading states with `SkeletonCard` or `SkeletonList`:

```powershell
cd C:\dev\transformr\apps\mobile
$spinners = Get-ChildItem app -Recurse -Filter "*.tsx" |
  Select-String "ActivityIndicator" |
  Where-Object { $_.Line -notmatch "refreshing|isLoading.*button|submit" }

Write-Host "Screens using ActivityIndicator for loading states:"
$spinners | ForEach-Object { Write-Host "  $($_.Filename): $($_.Line.Trim())" }
```

Replace with skeleton components for full-screen loading.

---

## PHASE 6 — APPLE/GOOGLE COMPLIANCE CHECK

### 6.1 — Privacy strings in app.json

```powershell
node -e "
const app = require('./app.json');
const required = [
  'NSCameraUsageDescription',
  'NSPhotoLibraryUsageDescription',
  'NSMicrophoneUsageDescription',
  'NSLocationWhenInUseUsageDescription',
  'NSFaceIDUsageDescription',
];
required.forEach(k => {
  const val = app.expo.ios?.infoPlist?.[k];
  console.log((val ? '✅' : '❌') + ' ' + k + ': ' + (val || 'MISSING'));
});
" 2>&1
```

### 6.2 — No Apple-rejected patterns

Check for these rejection triggers:
```powershell
cd C:\dev\transformr\apps\mobile

# External payment references (use Apple IAP language only)
$paymentRefs = Get-ChildItem app -Recurse -Filter "*.tsx" |
  Select-String "subscribe.*cheaper|pay.*outside|avoid.*fee" |
  Where-Object { $_ -notmatch "//" }
if ($paymentRefs) { Write-Host "❌ Payment steering language found:" ; $paymentRefs }

# Medical advice language without disclaimer
$medicalClaims = Get-ChildItem app -Recurse -Filter "*.tsx" |
  Select-String "cure|treat|diagnose|medical advice" |
  Where-Object { $_ -notmatch "disclaimer|not medical|//" }
if ($medicalClaims) { Write-Host "⚠️  Medical language without disclaimer:" ; $medicalClaims }

Write-Host "✅ Compliance check complete"
```

### 6.3 — Verify all permissions are requested at point of use

Camera, location, notifications — must be requested contextually with explanation, not on launch.

---

## PHASE 7 — FINAL QUALITY GATE

```powershell
cd C:\dev\transformr\apps\mobile

Write-Host "=== FINAL QUALITY GATE ===" -ForegroundColor Cyan

# TypeScript
$ts = (npx tsc --noEmit 2>&1 | Select-String "error TS").Count
Write-Host "TypeScript: $ts $(if ($ts -eq 0) { '✅' } else { '❌ MUST FIX' })"

# ESLint
$lint = (npx eslint . --ext .ts,.tsx 2>&1 | Select-String " error ").Count
Write-Host "ESLint: $lint $(if ($lint -eq 0) { '✅' } else { '❌ MUST FIX' })"

# Banned patterns
$logs = (Get-ChildItem -Recurse -Filter "*.ts","*.tsx" | Select-String "console\.log\(" | Where-Object { $_.Line -notmatch "//" }).Count
Write-Host "console.log: $logs $(if ($logs -eq 0) { '✅' } else { '❌' })"

$any = (Get-ChildItem -Recurse -Filter "*.ts","*.tsx" | Select-String ":\s*any[\s;,]" | Where-Object { $_.Line -notmatch "//" -and $_.Filename -notmatch "\.d\.ts" }).Count
Write-Host "any types: $any $(if ($any -eq 0) { '✅' } else { '❌' })"

$todos = (Get-ChildItem -Recurse -Filter "*.ts","*.tsx" | Select-String "TODO|FIXME|STUB|coming soon|placeholder" | Where-Object { $_.Line -notmatch "//" }).Count
Write-Host "TODOs: $todos $(if ($todos -eq 0) { '✅' } else { '❌' })"

$anthropic = (Get-ChildItem -Recurse -Filter "*.ts","*.tsx",".env" | Select-String "sk-ant-").Count
Write-Host "Anthropic key in client: $anthropic $(if ($anthropic -eq 0) { '✅' } else { '🚨 CRITICAL' })"

# Screenshot count
$shots = (Get-ChildItem "C:\dev\transformr\apps\mobile\screenshots" -Filter "*.png").Count
Write-Host "Screenshots captured: $shots"

Write-Host "`nFINAL COUNTS:"
Write-Host "Screens: $((Get-ChildItem app -Recurse -Filter '*.tsx' | Where-Object { $_.Name -ne '_layout.tsx' }).Count)"
Write-Host "Components: $((Get-ChildItem components -Recurse -Filter '*.tsx').Count)"
Write-Host "Stores: $((Get-ChildItem stores -Filter '*.ts').Count)"
```

---

## PHASE 8 — FINAL COMMIT AND PUSH

```powershell
cd C:\dev\transformr
git add -A
git commit -m "feat: complete QA sweep — every screen tested, all errors fixed, UI/UX enhanced, layout overflow resolved, AI on all surfaces, App Store compliant"
git push origin dev

Write-Host "`n🚀 TRANSFORMR is verified and ready." -ForegroundColor Cyan
Write-Host "Next: eas build --platform all --profile production" -ForegroundColor Green
```

---

## LAUNCH CERTIFICATION REPORT

Print this at the end with real values:

```
════════════════════════════════════════════════════════
TRANSFORMR — FINAL QA CERTIFICATION
════════════════════════════════════════════════════════

CODE QUALITY
  TypeScript errors:    [0 or count]  ← must be 0
  ESLint errors:        [0 or count]  ← must be 0
  console.log:          [0 or count]  ← must be 0
  any types:            [0 or count]  ← must be 0
  TODOs/stubs:          [0 or count]  ← must be 0
  Anthropic key leak:   [0 or count]  ← must be 0

EMULATOR TESTING
  Screens tested:       [count] / [total]
  Buttons tapped:       [count]
  Logcat errors found:  [count]
  Logcat errors fixed:  [count]
  Screenshots taken:    [count]

LAYOUT
  Status bar overflow:  [0 or count fixed]
  Edge clipping fixed:  [0 or count fixed]
  SafeAreaInsets added: [count screens]
  Pull-to-refresh:      [count screens]

AI COVERAGE
  Screens with AI:      [count]
  Edge Functions live:  [count]
  Compliance preamble:  [count functions]

COMPLIANCE
  Privacy strings set:  [yes/no]
  Medical disclaimers:  [yes/no]
  Payment steering:     [0 violations]

FINAL STATUS: [READY FOR EAS BUILD / BLOCKERS REMAINING]
BLOCKERS (if any): [list]
════════════════════════════════════════════════════════
```

---

## THE STANDARD

```
TRANSFORMR will be the #1 health, fitness, and transformation app on the market.

Every screen must load in under 2 seconds.
Every button must do exactly what it says.
Every error must be caught and shown gracefully.
Every AI response must feel personal, not generic.
Every number must be monospace font.
Every card must have breathing room.
Every screen must respect the safe area.
Every gesture must have haptic feedback.

When a user opens TRANSFORMR, they should feel:
"This was built specifically for me."

DO NOT STOP UNTIL EVERY SCREEN PASSES.
DO NOT REMOVE A SINGLE FEATURE.
ONLY ADD. ONLY FIX. ONLY IMPROVE.
```
