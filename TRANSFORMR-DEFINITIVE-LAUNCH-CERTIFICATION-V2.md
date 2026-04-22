# TRANSFORMR — Definitive Launch Certification v2.0

## Comprehensive QA & Launch Readiness Verification Prompt

**Version:** 2.0  
**Date:** April 2026  
**Target:** Android Emulator via ADB  
**App Package:** com.automateai.transformr  
**URL Scheme:** com.automateai.transformr://  

---

## CODEBASE STATS (verified from disk)

| Category | Count |
|----------|-------|
| Screen files (.tsx in app/) | 103 |
| Components | 111 |
| Zustand stores | 21 |
| Custom hooks | 28 |
| Service files | 56 |
| Supabase Edge Functions | 52 |
| Database migrations | 51 |
| Tab bar tabs | 5 (dashboard, fitness, nutrition, goals, profile) |
| Onboarding screens | 9 |
| Subscription tiers | 4 (free, pro, elite, partners) |

---

## THREE-PASS STRUCTURE

```
PASS 1: Static Code Audit (TypeScript, ESLint, code quality)
PASS 2: Functional Logic Audit (calculations, data flow, gates)
PASS 3: Emulator Testing (ADB-driven, screenshot every screen, fix crashes)
```

Each pass must COMPLETE before the next begins. No skipping. No shortcuts.

---

# SECTION 1: ABSOLUTE RULES

These rules are NON-NEGOTIABLE. Violating any rule invalidates the entire certification.

## 1.1 — Never Skip a Test

Every test in this document MUST be executed. Log EVERY result — pass or fail.
If a test cannot be executed (screen missing, feature not built), log it as
"NOT TESTABLE — [reason]" and move on.

## 1.2 — Never Guess Coordinates

NEVER hardcode ADB tap coordinates without first discovering them via screenshot.
The coordinate discovery methodology in Section 4.0 MUST be executed before ANY
tap-based testing begins.

## 1.3 — Never Fix UI/Styling Issues

If you find visual issues (wrong colors, misaligned elements, font sizes, spacing),
LOG them in the certification report under "Visual Issues (for UI agent)."
DO NOT modify any UI code to fix them.

You MAY fix:
- Logic bugs (incorrect calculations, wrong data flow)
- Crash-causing errors (missing imports, null references)
- TypeScript type errors that prevent compilation
- Missing data connections (store not wired to component)

You MAY NOT fix:
- Colors, spacing, padding, margins, font sizes
- Component layout or ordering
- Animation timing or easing
- Dark/light mode visual inconsistencies
- Any StyleSheet value

## 1.4 — Never Modify Protected Files

DO NOT modify:
- Any store file (stores/*.ts)
- Any navigation layout (_layout.tsx)
- Any edge function (supabase/functions/**)
- Any migration (supabase/migrations/*)
- Any service file (services/*)
- app.json, app.config.ts, eas.json
- package.json (no version changes, no removals)
- Any test file

## 1.5 — Never Kill or Restart the Emulator

A dedicated agent owns emulator lifecycle. If the emulator is unresponsive:
1. Wait 10 seconds
2. Run `adb devices` to check connection
3. If still unresponsive, FLAG to the developer — do not attempt recovery

## 1.6 — Never Use Workarounds

If a test fails, fix the ROOT CAUSE. Never:
- Skip a test because "it will probably pass"
- Comment out code to make a test pass
- Add `try/catch` wrappers to suppress errors
- Disable linting rules
- Add `@ts-ignore` or `@ts-expect-error`

## 1.7 — One Fix Per Error

When fixing a crash or error:
1. Fix ONLY the specific issue
2. Verify the fix resolves the error
3. Verify no new errors were introduced
4. Move on

Do NOT refactor surrounding code, add comments, or "improve" things.

## 1.8 — Screenshot EVERY Screen

Even if a screen looks fine, take a screenshot. The screenshots serve as the
visual baseline for future regressions.

## 1.9 — Log Directory

All logs, screenshots, and outputs go to:
```
C:\dev\logs\transformr-certification\
```

Create this directory at the start of testing if it doesn't exist:
```powershell
mkdir -p C:\dev\logs\transformr-certification\
```

## 1.10 — Logcat Filtering

When checking logcat output, ONLY flag errors matching these tags:
- `ReactNativeJS`
- `JS ERROR`
- `transformr`

IGNORE all of these (they are normal development noise):
- WebSocket
- Metro
- HMR
- Packager
- debugger
- hot.update
- socket

Filter command:
```bash
adb logcat -d -s ReactNativeJS:* *:E | grep -v "WebSocket\|Metro\|HMR\|Packager\|debugger\|hot.update\|socket"
```

## 1.11 — If a Screen Crashes

1. Log the crash error from logcat
2. Take a screenshot of the crash state
3. Move on to the next screen
4. Come back to fix the crash AFTER all other screens have been tested
5. Re-test the fixed screen

## 1.12 — Checkpointing

After completing each major section (e.g., all fitness screens), write a checkpoint
note to the log directory:
```bash
echo "CHECKPOINT: Fitness tab complete. 12/12 screens tested. 0 crashes." > C:\dev\logs\transformr-certification\checkpoint-fitness.txt
```

If the session crashes or times out, resume from the last checkpoint.

---

# SECTION 2: PASS 1 — STATIC CODE AUDIT

## 2.1 — TypeScript Compilation

```bash
cd apps/mobile && npx tsc --noEmit 2>&1 | tee /c/dev/logs/transformr-certification/tsc-output.txt
echo "TSC ERRORS: $(grep -c 'error TS' /c/dev/logs/transformr-certification/tsc-output.txt)"
```

**PASS criterion:** Zero new errors introduced. If errors exist from before this
certification, document them but do not count them as failures.

## 2.2 — ESLint

```bash
cd apps/mobile && npx eslint . --ext .ts,.tsx 2>&1 | tee /c/dev/logs/transformr-certification/eslint-output.txt
echo "ESLINT ERRORS: $(grep -c 'error' /c/dev/logs/transformr-certification/eslint-output.txt)"
```

**PASS criterion:** Zero errors. Warnings are acceptable but should be documented.

## 2.3 — Console.log Check

```bash
cd apps/mobile && grep -rn "console\.log" --include="*.ts" --include="*.tsx" app/ components/ stores/ hooks/ services/ 2>/dev/null | grep -v "node_modules" | tee /c/dev/logs/transformr-certification/console-log-findings.txt
echo "CONSOLE.LOG COUNT: $(wc -l < /c/dev/logs/transformr-certification/console-log-findings.txt)"
```

**PASS criterion:** Zero console.log statements. `console.warn` and `console.error`
are acceptable for error handling only.

## 2.4 — Hardcoded Color Check

```bash
cd apps/mobile && grep -rn "#[0-9A-Fa-f]\{6\}" --include="*.ts" --include="*.tsx" app/ components/ | grep -v "node_modules\|// \|/\*\|theme\|colors\." | tee /c/dev/logs/transformr-certification/hardcoded-colors.txt
echo "HARDCODED COLORS: $(wc -l < /c/dev/logs/transformr-certification/hardcoded-colors.txt)"
```

**PASS criterion:** Zero hardcoded hex colors outside of theme definition files.

## 2.5 — `any` Type Check

```bash
cd apps/mobile && grep -rn ": any\|as any\|<any>" --include="*.ts" --include="*.tsx" app/ components/ stores/ hooks/ | grep -v "node_modules" | tee /c/dev/logs/transformr-certification/any-types.txt
echo "ANY TYPES: $(wc -l < /c/dev/logs/transformr-certification/any-types.txt)"
```

**PASS criterion:** Zero `any` types.

## 2.6 — Store Export Verification

Verify each store exports correctly by checking imports don't error:
```bash
cd apps/mobile && for store in authStore businessStore challengeStore chatStore dashboardStore financeStore gamificationStore goalStore habitStore insightStore labsStore moodStore nutritionStore offlineSyncStore partnerStore profileStore settingsStore sleepStore subscriptionStore supplementsStore workoutStore; do
  if grep -q "export const use" stores/${store}.ts 2>/dev/null; then
    echo "OK: $store"
  else
    echo "FAIL: $store — missing export"
  fi
done
```

## 2.7 — Import Resolution Check

```bash
cd apps/mobile && npx tsc --noEmit --listFiles 2>&1 | grep "Cannot find module" | tee /c/dev/logs/transformr-certification/missing-imports.txt
```

## 2.8 — Pass 1 Summary

After completing all static checks, write the summary:
```
PASS 1 COMPLETE
- TypeScript errors: [N]
- ESLint errors: [N]
- Console.logs found: [N]
- Hardcoded colors: [N]
- Any types: [N]
- Store export issues: [N]
- Missing imports: [N]
VERDICT: [PASS / FAIL — must fix before proceeding]
```

If CRITICAL errors exist (TypeScript errors that prevent build), fix them before
proceeding to Pass 2.

---

# SECTION 3: PASS 2 — FUNCTIONAL LOGIC AUDIT

## 3.1 — Calculation Functions

Read and verify each calculation function. For each, document:
- The formula used
- Whether it matches the expected algorithm
- Test with sample inputs

### 3.1.1 — BMR (Basal Metabolic Rate)

Expected algorithm: **Mifflin-St Jeor**
- Male: BMR = (10 × weight_kg) + (6.25 × height_cm) - (5 × age) + 5
- Female: BMR = (10 × weight_kg) + (6.25 × height_cm) - (5 × age) - 161

Find and read the BMR function:
```bash
cd apps/mobile && grep -rn "BMR\|bmr\|basalMetabolic" --include="*.ts" --include="*.tsx" utils/ services/ stores/ | head -20
```

Verify with test case: Male, 80kg, 180cm, 30 years → BMR = 800 + 1125 - 150 + 5 = 1780

### 3.1.2 — TDEE (Total Daily Energy Expenditure)

Expected: BMR × activity multiplier
- Sedentary: ×1.2
- Light: ×1.375
- Moderate: ×1.55
- Active: ×1.725
- Very Active: ×1.9

### 3.1.3 — Macro Calculations

Expected:
- Protein calories = protein_g × 4
- Carb calories = carb_g × 4
- Fat calories = fat_g × 9
- Total calories = protein_cal + carb_cal + fat_cal
- Percentage = (macro_cal / total_cal) × 100

### 3.1.4 — Streak Logic

Expected:
- Increment streak for each consecutive day a habit is completed
- Reset to 0 if a day is missed (no completion recorded)
- Longest streak tracked separately from current streak

Find:
```bash
cd apps/mobile && grep -rn "streak" --include="*.ts" stores/habitStore.ts utils/
```

### 3.1.5 — PR Detection

Expected:
- New PR when: weight > previous max weight for that exercise, OR reps > previous max reps at same weight
- Edge function: pr-detection

### 3.1.6 — Readiness Score

Expected: Composite score from sleep quality + recovery metrics + stress level
Edge function: readiness-score

### 3.1.7 — Day Score

Expected: Composite daily score from multiple inputs (workout completion, nutrition adherence, sleep, mood)

## 3.2 — Subscription Gate Logic

Read `apps/mobile/stores/subscriptionStore.ts` and verify:

1. `tier` defaults to `'free'`
2. Usage tracking fields: `aiMealCameraScans`, `aiChatMessages`
3. Monthly reset logic: `resetUsageIfNewMonth()` compares current month to `lastResetDate`
4. Gates are enforced in components that use AI features

Find gate enforcement:
```bash
cd apps/mobile && grep -rn "subscriptionStore\|useSubscription\|tier.*free\|usage\." --include="*.ts" --include="*.tsx" app/ components/ | grep -v "node_modules"
```

Document which features have caps and what the cap values are.

## 3.3 — Edge Function Invocation Signatures

Verify that screen files call edge functions with correct names:
```bash
cd apps/mobile && grep -rn "supabase.functions.invoke\|functions.invoke" --include="*.ts" --include="*.tsx" app/ components/ services/ | sort
```

Cross-reference each invocation against the 52 real edge function names listed in Section 5.

## 3.4 — Navigation Graph Completeness

Verify all screens registered in layouts match files on disk:
- (tabs)/_layout.tsx → 5 tabs (dashboard, fitness, nutrition, goals, profile)
- fitness/_layout.tsx → 10 screens registered
- nutrition/_layout.tsx → 11 screens registered
- goals/_layout.tsx → 24 screens registered (including business/* and finance/*)
- profile/_layout.tsx → 10 screens registered
- labs/_layout.tsx → 3 screens
- partner/_layout.tsx → 4 screens

Screens on disk but NOT in layouts (still navigable via router.push):
- fitness: marketplace, posture-check, progress-photos, supplement-scanner
- goals: affirmations, retrospective, health-roi
- profile: wearables

## 3.5 — Pass 2 Summary

```
PASS 2 COMPLETE
- BMR calculation: [correct / incorrect]
- TDEE calculation: [correct / incorrect]
- Macro calculation: [correct / incorrect]
- Streak logic: [correct / incorrect]
- PR detection: [correct / incorrect]
- Readiness score: [correct / incorrect]
- Day score: [correct / incorrect]
- Subscription gates: [enforced / not enforced — detail]
- Edge function signatures: [all match / N mismatches — list]
- Navigation graph: [complete / N missing routes]
VERDICT: [PASS / FAIL]
```

---

# SECTION 4: PASS 3 — EMULATOR TESTING

## 4.0 — Setup & Coordinate Discovery

### 4.0.1 — Prerequisites

```bash
# Create log directory
mkdir -p /c/dev/logs/transformr-certification/

# Verify emulator is running
adb devices
# Expected: at least one device listed as "emulator-XXXX device"

# Verify app is installed
adb shell pm list packages | grep transformr
# Expected: package:com.automateai.transformr

# Launch the app
adb shell am start -n com.automateai.transformr/.MainActivity

# Wait for splash screen to dismiss
sleep 5

# Take initial screenshot
adb shell screencap -p /sdcard/initial.png
adb pull /sdcard/initial.png /c/dev/logs/transformr-certification/00-initial.png
```

### 4.0.2 — Tab Bar Coordinate Discovery

The tab bar is at the BOTTOM of the screen. You must identify the exact Y coordinate
and the X coordinate for each of the 5 tabs.

```bash
# Screenshot the current screen (should be dashboard after login)
adb shell screencap -p /sdcard/tabbar.png
adb pull /sdcard/tabbar.png /c/dev/logs/transformr-certification/00-tabbar-discovery.png
```

**Study the screenshot.** The tab bar has 5 evenly-spaced icons. On a standard
1080×2400 (or 1080×1920) emulator:

- Screen width: 1080px
- Tab spacing: 1080 / 5 = 216px per tab
- Tab center X positions (approximate): 108, 324, 540, 756, 972
- Tab bar Y position: typically between 2340-2380 (on 2400 screen) or 1870-1910 (on 1920 screen)

**You MUST verify these by examining the screenshot.** If the tab bar is at a
different Y position, adjust ALL subsequent tap commands accordingly.

Store the discovered coordinates:
```
TAB_Y = [discovered Y coordinate]
TAB_DASHBOARD_X = 108
TAB_FITNESS_X = 324
TAB_NUTRITION_X = 540
TAB_GOALS_X = 756
TAB_PROFILE_X = 972
```

### 4.0.3 — Navigation Helpers

Use these patterns throughout testing:

```bash
# Navigate to Dashboard tab
adb shell input tap $TAB_DASHBOARD_X $TAB_Y

# Navigate to Fitness tab
adb shell input tap $TAB_FITNESS_X $TAB_Y

# Navigate to Nutrition tab
adb shell input tap $TAB_NUTRITION_X $TAB_Y

# Navigate to Goals tab
adb shell input tap $TAB_GOALS_X $TAB_Y

# Navigate to Profile tab
adb shell input tap $TAB_PROFILE_X $TAB_Y

# Go back
adb shell input keyevent 4

# Scroll down
adb shell input swipe 540 1200 540 400 300

# Scroll up
adb shell input swipe 540 400 540 1200 300

# Pull to refresh
adb shell input swipe 540 400 540 1000 200

# Long press (for drag, context menus)
adb shell input swipe X Y X Y 1000

# Swipe to delete (left swipe on list item)
adb shell input swipe 900 $ITEM_Y 200 $ITEM_Y 200

# Type text (NOTE: spaces must be encoded as %s)
adb shell input text "hello%sworld"

# Press Enter
adb shell input keyevent 66

# Press Backspace
adb shell input keyevent 67

# Dismiss keyboard
adb shell input keyevent 111
```

### 4.0.4 — Master Testing Loop

For EVERY screen tested, follow this exact loop:

```bash
# 1. Clear logcat
adb logcat -c

# 2. Navigate to screen (via tap/back/tab commands)
adb shell input tap X Y
sleep 2

# 3. Screenshot
adb shell screencap -p /sdcard/screen_NAME.png
adb pull /sdcard/screen_NAME.png /c/dev/logs/transformr-certification/SECTION-screen_NAME.png

# 4. Check logcat for errors
adb logcat -d -s ReactNativeJS:* *:E | grep -v "WebSocket\|Metro\|HMR\|Packager\|debugger\|hot.update\|socket" > /c/dev/logs/transformr-certification/logcat_NAME.txt

# 5. Check if errors exist
if [ -s /c/dev/logs/transformr-certification/logcat_NAME.txt ]; then
  echo "ERROR on screen NAME — see logcat_NAME.txt"
fi

# 6. Interact with screen (inputs, buttons, scrolls)
# 7. Screenshot after interaction
# 8. Check logcat again
```

---

## 4.1 — Auth Flow Testing

### 4.1.0 — Login Screen Coordinate Discovery

Before testing auth, discover the exact positions of all interactive elements:

```bash
# Ensure we're on the login screen (logout first if needed, or fresh install)
adb shell screencap -p /sdcard/login_discovery.png
adb pull /sdcard/login_discovery.png /c/dev/logs/transformr-certification/01-login-discovery.png
```

**Study the screenshot carefully.** Identify and record the Y coordinates for:
- Email input field → LOGIN_EMAIL_Y
- Password input field → LOGIN_PASSWORD_Y
- Sign In button → LOGIN_SUBMIT_Y
- Google OAuth button → LOGIN_GOOGLE_Y
- "Forgot Password?" link → LOGIN_FORGOT_Y
- "Sign Up" / "Create Account" link → LOGIN_REGISTER_Y

All elements are typically centered horizontally at X=540 (half of 1080).

### 4.1.1 — Valid Login

```bash
adb logcat -c

# Tap email field
adb shell input tap 540 $LOGIN_EMAIL_Y
sleep 1
adb shell input text "test@transformr.app"
sleep 0.5

# Tap password field
adb shell input tap 540 $LOGIN_PASSWORD_Y
sleep 1
adb shell input text "TestPassword123!"
sleep 0.5

# Dismiss keyboard
adb shell input keyevent 111
sleep 0.5

# Tap Sign In button
adb shell input tap 540 $LOGIN_SUBMIT_Y
sleep 3

# Screenshot — should be on dashboard now
adb shell screencap -p /sdcard/auth_login_success.png
adb pull /sdcard/auth_login_success.png /c/dev/logs/transformr-certification/01-login-success.png

# Check logcat
adb logcat -d -s ReactNativeJS:* *:E | grep -v "WebSocket\|Metro\|HMR\|Packager\|debugger\|hot.update\|socket"
```

**PASS criterion:** App navigates away from login screen. Dashboard or onboarding appears.

### 4.1.2 — Invalid Login

```bash
# Navigate back to login (logout first)
# Tap email field
adb shell input tap 540 $LOGIN_EMAIL_Y
sleep 1
adb shell input text "wrong@email.com"

# Tap password field
adb shell input tap 540 $LOGIN_PASSWORD_Y
sleep 1
adb shell input text "wrongpassword"

# Tap Sign In
adb shell input tap 540 $LOGIN_SUBMIT_Y
sleep 3

# Screenshot — should show error message
adb shell screencap -p /sdcard/auth_login_fail.png
adb pull /sdcard/auth_login_fail.png /c/dev/logs/transformr-certification/01-login-fail.png
```

**PASS criterion:** Error message appears. App does NOT crash. User remains on login screen.

### 4.1.3 — Forgot Password Flow

```bash
adb shell input tap 540 $LOGIN_FORGOT_Y
sleep 2

adb shell screencap -p /sdcard/auth_forgot.png
adb pull /sdcard/auth_forgot.png /c/dev/logs/transformr-certification/01-forgot-password.png

# Enter email
adb shell input tap 540 400  # Adjust to email field on forgot screen
sleep 1
adb shell input text "test@transformr.app"
sleep 0.5

# Submit
adb shell input tap 540 600  # Adjust to submit button
sleep 3

adb shell screencap -p /sdcard/auth_forgot_sent.png
adb pull /sdcard/auth_forgot_sent.png /c/dev/logs/transformr-certification/01-forgot-sent.png
```

**PASS criterion:** Confirmation message appears (email sent). No crash.

### 4.1.4 — Register Flow

```bash
# Navigate to register screen
adb shell input keyevent 4  # Back to login
sleep 1
adb shell input tap 540 $LOGIN_REGISTER_Y
sleep 2

adb shell screencap -p /sdcard/auth_register.png
adb pull /sdcard/auth_register.png /c/dev/logs/transformr-certification/01-register.png

# Discover register form coordinates from screenshot
# Fill in registration fields (name, email, password, confirm password)
# Test validation: submit with empty fields → error messages
# Test validation: mismatched passwords → error message
# Test valid submission
```

**PASS criterion:** Registration form renders. Validation errors show correctly.
Valid submission either creates account or shows server response.

### 4.1.5 — Google OAuth Button

```bash
# Verify the Google button exists and is tappable
adb shell input tap 540 $LOGIN_GOOGLE_Y
sleep 2

adb shell screencap -p /sdcard/auth_google.png
adb pull /sdcard/auth_google.png /c/dev/logs/transformr-certification/01-google-oauth.png
```

**PASS criterion:** Tapping Google button either opens a browser/webview for OAuth
or shows a system account picker. It must NOT crash.

### 4.1.6 — Logout

```bash
# Navigate to Profile tab
adb shell input tap $TAB_PROFILE_X $TAB_Y
sleep 2

# Find and tap logout button (scroll down if needed)
adb shell input swipe 540 1200 540 400 300
sleep 1
# Tap logout (discover Y coordinate from profile screenshot)
adb shell input tap 540 $LOGOUT_Y
sleep 1

# Confirm logout if confirmation dialog appears
adb shell input tap 540 $CONFIRM_Y
sleep 2

adb shell screencap -p /sdcard/auth_logout.png
adb pull /sdcard/auth_logout.png /c/dev/logs/transformr-certification/01-logout.png
```

**PASS criterion:** Returns to login screen. No crash.

---

## 4.2 — Onboarding Flow (9 Screens)

If the test account has already completed onboarding, you may need a fresh account
or a way to reset onboarding state. If onboarding cannot be triggered, log as
"NOT TESTABLE — account already onboarded" and move on.

### 4.2.1 — Screen 1: Welcome (welcome.tsx)

```bash
adb logcat -c
adb shell screencap -p /sdcard/onboard_01_welcome.png
adb pull /sdcard/onboard_01_welcome.png /c/dev/logs/transformr-certification/02-onboard-welcome.png
```

**Verify:**
- [ ] App branding/logo visible
- [ ] Welcome text renders
- [ ] "Get Started" or "Continue" button visible and tappable

```bash
# Tap "Get Started" button (discover Y from screenshot)
adb shell input tap 540 $WELCOME_CTA_Y
sleep 2
```

### 4.2.2 — Screen 2: Profile (profile.tsx)

```bash
adb shell screencap -p /sdcard/onboard_02_profile.png
adb pull /sdcard/onboard_02_profile.png /c/dev/logs/transformr-certification/02-onboard-profile.png
```

**Verify:**
- [ ] Name input field
- [ ] Weight input (number pad)
- [ ] Height input (number pad)
- [ ] Age input (number pad)
- [ ] Gender selection
- [ ] All inputs accept valid data
- [ ] Continue button enabled after filling required fields

```bash
# Fill in profile data
adb shell input tap 540 $NAME_FIELD_Y
sleep 1
adb shell input text "Test%sUser"
adb shell input keyevent 111
sleep 0.5

adb shell input tap 540 $WEIGHT_FIELD_Y
sleep 1
adb shell input text "175"
adb shell input keyevent 111
sleep 0.5

adb shell input tap 540 $HEIGHT_FIELD_Y
sleep 1
adb shell input text "72"
adb shell input keyevent 111
sleep 0.5

adb shell input tap 540 $AGE_FIELD_Y
sleep 1
adb shell input text "30"
adb shell input keyevent 111
sleep 0.5

# Tap continue
adb shell input tap 540 $CONTINUE_Y
sleep 2
```

### 4.2.3 — Screen 3: Fitness (fitness.tsx)

```bash
adb shell screencap -p /sdcard/onboard_03_fitness.png
adb pull /sdcard/onboard_03_fitness.png /c/dev/logs/transformr-certification/02-onboard-fitness.png
```

**Verify:**
- [ ] Fitness level options visible (Beginner / Intermediate / Advanced)
- [ ] Tapping one option selects it (visual feedback)
- [ ] Can change selection
- [ ] Continue button works after selection

### 4.2.4 — Screen 4: Goals (goals.tsx)

```bash
adb shell screencap -p /sdcard/onboard_04_goals.png
adb pull /sdcard/onboard_04_goals.png /c/dev/logs/transformr-certification/02-onboard-goals.png
```

**Verify:**
- [ ] Goal options visible (Lose Weight / Build Muscle / Maintain / Body Recomp)
- [ ] Can select one or more goals
- [ ] Continue button works

### 4.2.5 — Screen 5: Nutrition (nutrition.tsx)

```bash
adb shell screencap -p /sdcard/onboard_05_nutrition.png
adb pull /sdcard/onboard_05_nutrition.png /c/dev/logs/transformr-certification/02-onboard-nutrition.png
```

**Verify:**
- [ ] Dietary preferences shown (vegan, vegetarian, keto, etc.)
- [ ] Allergies/restrictions selectable
- [ ] Calorie target displayed (auto-calculated from profile data + goals)
- [ ] Continue button works

### 4.2.6 — Screen 6: Business (business.tsx)

```bash
adb shell screencap -p /sdcard/onboard_06_business.png
adb pull /sdcard/onboard_06_business.png /c/dev/logs/transformr-certification/02-onboard-business.png
```

**Verify:**
- [ ] Business info fields present OR "I'm not a business owner" / Skip option
- [ ] SKIP BUTTON WORKS — must be able to bypass this screen entirely
- [ ] Tapping skip advances to next screen without error

### 4.2.7 — Screen 7: Partner (partner.tsx)

```bash
adb shell screencap -p /sdcard/onboard_07_partner.png
adb pull /sdcard/onboard_07_partner.png /c/dev/logs/transformr-certification/02-onboard-partner.png
```

**Verify:**
- [ ] Partner invite option visible
- [ ] SKIP BUTTON WORKS — must be able to bypass
- [ ] Tapping skip advances without error

### 4.2.8 — Screen 8: Notifications (notifications.tsx)

```bash
adb shell screencap -p /sdcard/onboard_08_notifications.png
adb pull /sdcard/onboard_08_notifications.png /c/dev/logs/transformr-certification/02-onboard-notifications.png
```

**Verify:**
- [ ] Notification permission explanation shown
- [ ] "Enable" and "Skip" / "Not Now" options available
- [ ] Both options advance to next screen without crash
- [ ] If "Enable" tapped: Android permission dialog appears

### 4.2.9 — Screen 9: Ready (ready.tsx)

```bash
adb shell screencap -p /sdcard/onboard_09_ready.png
adb pull /sdcard/onboard_09_ready.png /c/dev/logs/transformr-certification/02-onboard-ready.png
```

**Verify:**
- [ ] Celebration/confetti animation (or completion visual)
- [ ] Summary of selections shown
- [ ] "Let's Go" / "Start" button visible
- [ ] Tapping CTA navigates to DASHBOARD (not back to login, not to another onboarding screen)

```bash
# Tap CTA
adb shell input tap 540 $READY_CTA_Y
sleep 3

adb shell screencap -p /sdcard/onboard_complete.png
adb pull /sdcard/onboard_complete.png /c/dev/logs/transformr-certification/02-onboard-complete.png
# Verify this screenshot shows the dashboard
```

---

## 4.3 — Dashboard Testing (dashboard.tsx — 1272 lines)

```bash
adb logcat -c

# Navigate to dashboard tab
adb shell input tap $TAB_DASHBOARD_X $TAB_Y
sleep 2

adb shell screencap -p /sdcard/dashboard_top.png
adb pull /sdcard/dashboard_top.png /c/dev/logs/transformr-certification/03-dashboard-top.png
```

### 4.3.1 — Widget Verification

**Verify these sections exist (scroll down to find all):**
- [ ] Greeting (time-of-day aware: "Good morning/afternoon/evening")
- [ ] Day score (if implemented)
- [ ] Macro/calorie summary widget
- [ ] Workout summary widget (today's activity)
- [ ] Streak display
- [ ] Quick-action buttons (log meal, start workout, etc.)
- [ ] AI insights section (if present — cyan badge cards)
- [ ] Prediction alerts (if present — severity-colored)
- [ ] Countdown timer (if a countdown goal is set)
- [ ] Water intake widget (if implemented)

```bash
# Scroll down to see more widgets
adb shell input swipe 540 1200 540 400 300
sleep 1
adb shell screencap -p /sdcard/dashboard_mid.png
adb pull /sdcard/dashboard_mid.png /c/dev/logs/transformr-certification/03-dashboard-mid.png

adb shell input swipe 540 1200 540 400 300
sleep 1
adb shell screencap -p /sdcard/dashboard_bottom.png
adb pull /sdcard/dashboard_bottom.png /c/dev/logs/transformr-certification/03-dashboard-bottom.png
```

### 4.3.2 — Pull-to-Refresh

```bash
adb logcat -c

# Scroll to top first
adb shell input swipe 540 400 540 1200 300
sleep 1

# Pull to refresh
adb shell input swipe 540 300 540 900 200
sleep 3

adb logcat -d -s ReactNativeJS:* *:E | grep -v "WebSocket\|Metro\|HMR\|Packager\|debugger\|hot.update\|socket"
```

**PASS criterion:** No crash. Data refreshes (or at least the gesture is recognized).

### 4.3.3 — Quick Action Navigation

For each quick-action button on the dashboard:
1. Screenshot to identify its position
2. Tap it
3. Verify it navigates to the correct screen
4. Press Back to return to dashboard
5. Verify dashboard is still intact

### 4.3.4 — Theme Toggle (if accessible from dashboard)

If there is a theme toggle on the dashboard (sun/moon icon):
```bash
adb shell input tap $THEME_TOGGLE_X $THEME_TOGGLE_Y
sleep 2
adb shell screencap -p /sdcard/dashboard_theme_toggled.png
adb pull /sdcard/dashboard_theme_toggled.png /c/dev/logs/transformr-certification/03-dashboard-theme.png
```

**PASS criterion:** No crash. Visual changes observed.

---

## 4.4 — Fitness Tab Testing (14 screens)

### 4.4.0 — Navigate to Fitness Tab

```bash
adb logcat -c
adb shell input tap $TAB_FITNESS_X $TAB_Y
sleep 2
adb shell screencap -p /sdcard/fitness_index.png
adb pull /sdcard/fitness_index.png /c/dev/logs/transformr-certification/04-fitness-index.png
adb logcat -d -s ReactNativeJS:* *:E | grep -v "WebSocket\|Metro\|HMR\|Packager\|debugger\|hot.update\|socket"
```

### 4.4.1 — Fitness Index (index.tsx — 847 lines)

**Verify:**
- [ ] Workout list renders (recent workouts or empty state)
- [ ] "Start Workout" button visible
- [ ] Navigation to sub-screens works (exercises, programs, progress)

### 4.4.2 — Exercises (exercises.tsx)

```bash
adb logcat -c
# Navigate to exercises (discover button position from fitness_index screenshot)
adb shell input tap $EXERCISES_BUTTON_X $EXERCISES_BUTTON_Y
sleep 2
adb shell screencap -p /sdcard/fitness_exercises.png
adb pull /sdcard/fitness_exercises.png /c/dev/logs/transformr-certification/04-fitness-exercises.png
```

**Verify:**
- [ ] Exercise library loads (list of exercises)
- [ ] Search input visible at top

**Search test:**
```bash
# Tap search field
adb shell input tap 540 $SEARCH_Y
sleep 1
adb shell input text "bench%spress"
sleep 2
adb shell screencap -p /sdcard/fitness_exercises_search.png
adb pull /sdcard/fitness_exercises_search.png /c/dev/logs/transformr-certification/04-fitness-exercises-search.png
```

**PASS criterion:** Search returns results containing "bench press". List filters correctly.

**Muscle group filter test:**
```bash
# Look for filter buttons/chips (e.g., "Chest", "Back", "Legs")
# Tap a muscle group filter
adb shell input tap $FILTER_CHEST_X $FILTER_CHEST_Y
sleep 1
adb shell screencap -p /sdcard/fitness_exercises_filter.png
adb pull /sdcard/fitness_exercises_filter.png /c/dev/logs/transformr-certification/04-fitness-exercises-filter.png
```

**PASS criterion:** Only exercises for the selected muscle group are shown.

### 4.4.3 — Exercise Detail (exercise-detail.tsx)

```bash
# Tap first exercise in the list
adb shell input tap 540 $FIRST_EXERCISE_Y
sleep 2
adb shell screencap -p /sdcard/fitness_exercise_detail.png
adb pull /sdcard/fitness_exercise_detail.png /c/dev/logs/transformr-certification/04-fitness-exercise-detail.png
```

**Verify:**
- [ ] Exercise name and description shown
- [ ] Sets/reps history (if any)
- [ ] PR badge (if applicable)
- [ ] Muscle groups targeted
- [ ] Back navigation works

### 4.4.4 — Workout Player (workout-player.tsx)

```bash
adb shell input keyevent 4  # Back to fitness index
sleep 1

# Tap "Start Workout"
adb shell input tap $START_WORKOUT_X $START_WORKOUT_Y
sleep 2
adb shell screencap -p /sdcard/fitness_workout_player.png
adb pull /sdcard/fitness_workout_player.png /c/dev/logs/transformr-certification/04-fitness-workout-player.png
```

**Verify:**
- [ ] Workout player screen renders
- [ ] Timer visible (or ready to start)
- [ ] Exercise list for the workout shown
- [ ] "Add Set" button works
- [ ] Can log weight and reps for a set
- [ ] Rest timer appears between sets (if configured)

**Log a set:**
```bash
# Tap weight input
adb shell input tap $WEIGHT_INPUT_X $WEIGHT_INPUT_Y
sleep 1
adb shell input text "135"
adb shell input keyevent 111

# Tap reps input
adb shell input tap $REPS_INPUT_X $REPS_INPUT_Y
sleep 1
adb shell input text "10"
adb shell input keyevent 111

# Tap "Log Set" / "Done" button
adb shell input tap $LOG_SET_X $LOG_SET_Y
sleep 1

adb shell screencap -p /sdcard/fitness_set_logged.png
adb pull /sdcard/fitness_set_logged.png /c/dev/logs/transformr-certification/04-fitness-set-logged.png
```

### 4.4.5 — Workout Summary (workout-summary.tsx)

```bash
# Complete or end the workout
adb shell input tap $END_WORKOUT_X $END_WORKOUT_Y
sleep 3
adb shell screencap -p /sdcard/fitness_workout_summary.png
adb pull /sdcard/fitness_workout_summary.png /c/dev/logs/transformr-certification/04-fitness-workout-summary.png
```

**Verify:**
- [ ] Summary shows exercises performed
- [ ] Total volume calculated correctly (weight × reps for each set, summed)
- [ ] Duration shown
- [ ] PR indicators (if new PR achieved)
- [ ] Save/confirm button works
- [ ] Edge function triggered: ai-post-workout (check logcat for network call)

### 4.4.6 — Progress (progress.tsx)

```bash
adb shell input keyevent 4
sleep 1
# Navigate to progress screen
adb shell input tap $PROGRESS_BUTTON_X $PROGRESS_BUTTON_Y
sleep 2
adb shell screencap -p /sdcard/fitness_progress.png
adb pull /sdcard/fitness_progress.png /c/dev/logs/transformr-certification/04-fitness-progress.png
```

**Verify:**
- [ ] Charts render (body weight, measurements)
- [ ] Weight entries can be added
- [ ] Trend line visible (if enough data points)

### 4.4.7 — Programs (programs.tsx)

```bash
adb shell input keyevent 4
sleep 1
adb shell input tap $PROGRAMS_BUTTON_X $PROGRAMS_BUTTON_Y
sleep 2
adb shell screencap -p /sdcard/fitness_programs.png
adb pull /sdcard/fitness_programs.png /c/dev/logs/transformr-certification/04-fitness-programs.png
```

**Verify:**
- [ ] Program list renders (or empty state)
- [ ] Program detail is tappable
- [ ] Edge function: ai-adaptive-program (if "generate program" feature exists)

### 4.4.8 — Form Check (form-check.tsx)

```bash
adb shell input keyevent 4
sleep 1
adb shell input tap $FORM_CHECK_X $FORM_CHECK_Y
sleep 2
adb shell screencap -p /sdcard/fitness_form_check.png
adb pull /sdcard/fitness_form_check.png /c/dev/logs/transformr-certification/04-fitness-form-check.png
```

**Verify:**
- [ ] Camera permission requested (or already granted)
- [ ] Camera view renders (or placeholder if no permission)
- [ ] AI analysis button visible → invokes ai-form-check

### 4.4.9 — Pain Tracker (pain-tracker.tsx)

```bash
adb shell input keyevent 4
sleep 1
adb shell input tap $PAIN_TRACKER_X $PAIN_TRACKER_Y
sleep 2
adb shell screencap -p /sdcard/fitness_pain_tracker.png
adb pull /sdcard/fitness_pain_tracker.png /c/dev/logs/transformr-certification/04-fitness-pain-tracker.png
```

**Verify:**
- [ ] Body map or pain input visible
- [ ] Can log pain location and severity
- [ ] History of past entries shown

### 4.4.10 — Mobility (mobility.tsx)

```bash
adb shell input keyevent 4
sleep 1
adb shell input tap $MOBILITY_X $MOBILITY_Y
sleep 2
adb shell screencap -p /sdcard/fitness_mobility.png
adb pull /sdcard/fitness_mobility.png /c/dev/logs/transformr-certification/04-fitness-mobility.png
```

**Verify:**
- [ ] Mobility routines listed
- [ ] Can start a routine (or view detail)

### 4.4.11 — Posture Check (posture-check.tsx) [NOT IN LAYOUT]

This screen is on disk but NOT in the fitness layout. It must be navigable
via router.push or a button somewhere in the fitness tab.

```bash
# Look for a "Posture Check" button on the fitness index or in a menu
# If found, tap it. If not, try navigating directly:
# (The Expo Router file-based routing may auto-register it)
adb shell input keyevent 4
sleep 1
# Search for the navigation trigger in fitness/index.tsx
# Navigate to it and test
adb shell screencap -p /sdcard/fitness_posture_check.png
adb pull /sdcard/fitness_posture_check.png /c/dev/logs/transformr-certification/04-fitness-posture-check.png
```

**Verify:**
- [ ] Screen is navigable (reachable from fitness tab)
- [ ] Camera permission requested
- [ ] AI analysis trigger → invokes ai-posture-analysis
- [ ] Results display (or loading state)

### 4.4.12 — Progress Photos (progress-photos.tsx) [NOT IN LAYOUT]

```bash
adb shell screencap -p /sdcard/fitness_progress_photos.png
adb pull /sdcard/fitness_progress_photos.png /c/dev/logs/transformr-certification/04-fitness-progress-photos.png
```

**Verify:**
- [ ] Photo gallery renders (or empty state for new user)
- [ ] Camera capture button exists
- [ ] Guided pose overlay (if implemented)
- [ ] AI analysis → invokes ai-progress-photo
- [ ] Photo comparison view (before/after)

### 4.4.13 — Supplement Scanner (supplement-scanner.tsx) [NOT IN LAYOUT]

```bash
adb shell screencap -p /sdcard/fitness_supplement_scanner.png
adb pull /sdcard/fitness_supplement_scanner.png /c/dev/logs/transformr-certification/04-fitness-supplement-scanner.png
```

**Verify:**
- [ ] Camera view renders
- [ ] Scan trigger button exists
- [ ] AI analysis → invokes ai-supplement-scanner
- [ ] Results display supplement info

### 4.4.14 — Marketplace (marketplace.tsx) [NOT IN LAYOUT]

```bash
adb shell screencap -p /sdcard/fitness_marketplace.png
adb pull /sdcard/fitness_marketplace.png /c/dev/logs/transformr-certification/04-fitness-marketplace.png
```

**Verify:**
- [ ] Marketplace/community programs list renders
- [ ] Programs are browsable

### Fitness Tab Checkpoint

```bash
echo "CHECKPOINT: Fitness tab complete. 14 screens tested." > /c/dev/logs/transformr-certification/checkpoint-fitness.txt
```

---

## 4.5 — Nutrition Tab Testing (11 screens)

### 4.5.0 — Navigate to Nutrition Tab

```bash
adb logcat -c
adb shell input tap $TAB_NUTRITION_X $TAB_Y
sleep 2
adb shell screencap -p /sdcard/nutrition_index.png
adb pull /sdcard/nutrition_index.png /c/dev/logs/transformr-certification/05-nutrition-index.png
adb logcat -d -s ReactNativeJS:* *:E | grep -v "WebSocket\|Metro\|HMR\|Packager\|debugger\|hot.update\|socket"
```

### 4.5.1 — Nutrition Index (index.tsx — 975 lines)

**Verify:**
- [ ] Daily food log renders (meals list or empty state)
- [ ] Macro summary visible (protein/carbs/fat bars or rings)
- [ ] Calorie progress bar (consumed vs target)
- [ ] "Add Food" button visible
- [ ] Water intake display (if on this screen)
- [ ] Meal sections: Breakfast, Lunch, Dinner, Snacks

### 4.5.2 — Add Food (add-food.tsx)

```bash
adb shell input tap $ADD_FOOD_X $ADD_FOOD_Y
sleep 2
adb shell screencap -p /sdcard/nutrition_add_food.png
adb pull /sdcard/nutrition_add_food.png /c/dev/logs/transformr-certification/05-nutrition-add-food.png
```

**Verify:**
- [ ] Search input visible
- [ ] Can search for food ("chicken")
- [ ] Results appear with calorie/macro info
- [ ] Can select a food item
- [ ] Portion size adjustable
- [ ] "Log" / "Add" button saves the food

**Food search test:**
```bash
adb shell input tap 540 $FOOD_SEARCH_Y
sleep 1
adb shell input text "chicken%sbreast"
sleep 2
adb shell screencap -p /sdcard/nutrition_food_search.png
adb pull /sdcard/nutrition_food_search.png /c/dev/logs/transformr-certification/05-nutrition-food-search.png
```

**PASS criterion:** Results appear. At least one result shows calories.

**Log a food item:**
```bash
# Tap first result
adb shell input tap 540 $FIRST_RESULT_Y
sleep 1
# Tap Log/Add button
adb shell input tap 540 $LOG_BUTTON_Y
sleep 2
# Verify: back on nutrition index with the food in today's log
adb shell screencap -p /sdcard/nutrition_food_logged.png
adb pull /sdcard/nutrition_food_logged.png /c/dev/logs/transformr-certification/05-nutrition-food-logged.png
```

### 4.5.3 — Meal Camera (meal-camera.tsx) [fullScreenModal]

```bash
# Find and tap the camera/AI scan button on nutrition index
adb shell input tap $MEAL_CAMERA_X $MEAL_CAMERA_Y
sleep 2
adb shell screencap -p /sdcard/nutrition_meal_camera.png
adb pull /sdcard/nutrition_meal_camera.png /c/dev/logs/transformr-certification/05-nutrition-meal-camera.png
```

**Verify:**
- [ ] Camera permission requested/granted
- [ ] Camera viewfinder renders
- [ ] Capture button visible
- [ ] After capture: AI analysis loading state → invokes ai-meal-analysis
- [ ] Results show detected foods with estimated macros
- [ ] Can confirm/edit detected items
- [ ] Can save to food log

### 4.5.4 — Barcode Scanner (barcode-scanner.tsx) [fullScreenModal]

```bash
adb shell input keyevent 4  # Back
sleep 1
adb shell input tap $BARCODE_SCANNER_X $BARCODE_SCANNER_Y
sleep 2
adb shell screencap -p /sdcard/nutrition_barcode.png
adb pull /sdcard/nutrition_barcode.png /c/dev/logs/transformr-certification/05-nutrition-barcode.png
```

**Verify:**
- [ ] Camera renders for barcode scanning
- [ ] Scanning UI overlay visible (frame/target area)
- [ ] No crash on render

### 4.5.5 — Menu Scanner (menu-scanner.tsx) [fullScreenModal]

```bash
adb shell input keyevent 4
sleep 1
adb shell input tap $MENU_SCANNER_X $MENU_SCANNER_Y
sleep 2
adb shell screencap -p /sdcard/nutrition_menu_scanner.png
adb pull /sdcard/nutrition_menu_scanner.png /c/dev/logs/transformr-certification/05-nutrition-menu-scanner.png
```

**Verify:**
- [ ] Camera renders for menu photo capture
- [ ] AI analysis trigger → invokes ai-menu-scan
- [ ] Results display menu items with nutritional estimates

### 4.5.6 — Saved Meals (saved-meals.tsx)

```bash
adb shell input keyevent 4
sleep 1
adb shell input tap $SAVED_MEALS_X $SAVED_MEALS_Y
sleep 2
adb shell screencap -p /sdcard/nutrition_saved_meals.png
adb pull /sdcard/nutrition_saved_meals.png /c/dev/logs/transformr-certification/05-nutrition-saved-meals.png
```

**Verify:**
- [ ] List of saved/favorited meals (or empty state)
- [ ] Quick-add button for each saved meal
- [ ] Creating a new saved meal (if UI exists)

### 4.5.7 — Meal Plans (meal-plans.tsx)

```bash
adb shell input keyevent 4
sleep 1
adb shell input tap $MEAL_PLANS_X $MEAL_PLANS_Y
sleep 2
adb shell screencap -p /sdcard/nutrition_meal_plans.png
adb pull /sdcard/nutrition_meal_plans.png /c/dev/logs/transformr-certification/05-nutrition-meal-plans.png
```

**Verify:**
- [ ] Meal plan list or generator visible
- [ ] AI generation trigger → invokes ai-meal-prep

### 4.5.8 — Meal Prep (meal-prep.tsx)

```bash
adb shell input keyevent 4
sleep 1
adb shell input tap $MEAL_PREP_X $MEAL_PREP_Y
sleep 2
adb shell screencap -p /sdcard/nutrition_meal_prep.png
adb pull /sdcard/nutrition_meal_prep.png /c/dev/logs/transformr-certification/05-nutrition-meal-prep.png
```

**Verify:**
- [ ] Meal prep suggestions render
- [ ] Batch cooking instructions (or empty state)

### 4.5.9 — Grocery List (grocery-list.tsx)

```bash
adb shell input keyevent 4
sleep 1
adb shell input tap $GROCERY_LIST_X $GROCERY_LIST_Y
sleep 2
adb shell screencap -p /sdcard/nutrition_grocery_list.png
adb pull /sdcard/nutrition_grocery_list.png /c/dev/logs/transformr-certification/05-nutrition-grocery-list.png
```

**Verify:**
- [ ] Grocery list renders (items or empty state)
- [ ] AI generation trigger → invokes ai-grocery-list
- [ ] Items can be checked off
- [ ] Items can be added manually

### 4.5.10 — Supplements (supplements.tsx)

```bash
adb shell input keyevent 4
sleep 1
adb shell input tap $SUPPLEMENTS_X $SUPPLEMENTS_Y
sleep 2
adb shell screencap -p /sdcard/nutrition_supplements.png
adb pull /sdcard/nutrition_supplements.png /c/dev/logs/transformr-certification/05-nutrition-supplements.png
```

**Verify:**
- [ ] Supplement list renders
- [ ] Can add a supplement
- [ ] AI recommendations → invokes ai-supplement
- [ ] Reorder prediction → invokes reorder-predictor (if applicable)

### 4.5.11 — Analytics (analytics.tsx)

```bash
adb shell input keyevent 4
sleep 1
adb shell input tap $ANALYTICS_X $ANALYTICS_Y
sleep 2
adb shell screencap -p /sdcard/nutrition_analytics.png
adb pull /sdcard/nutrition_analytics.png /c/dev/logs/transformr-certification/05-nutrition-analytics.png
```

**Verify:**
- [ ] Nutrition analytics charts render
- [ ] Trends visible (weight, calories over time)
- [ ] Macro breakdown charts

### Nutrition Tab Checkpoint

```bash
echo "CHECKPOINT: Nutrition tab complete. 11 screens tested." > /c/dev/logs/transformr-certification/checkpoint-nutrition.txt
```

---

## 4.6 — Goals Tab Testing (27 screens)

### 4.6.0 — Navigate to Goals Tab

```bash
adb logcat -c
adb shell input tap $TAB_GOALS_X $TAB_Y
sleep 2
adb shell screencap -p /sdcard/goals_index.png
adb pull /sdcard/goals_index.png /c/dev/logs/transformr-certification/06-goals-index.png
adb logcat -d -s ReactNativeJS:* *:E | grep -v "WebSocket\|Metro\|HMR\|Packager\|debugger\|hot.update\|socket"
```

### 4.6.1 — Goals Index (index.tsx — 696 lines)

**Verify:**
- [ ] Goal overview renders (active goals with progress rings/bars)
- [ ] Navigation to sub-screens works
- [ ] Can create a new goal
- [ ] Empty state renders correctly for new user

### 4.6.2 — Habits (habits.tsx)

```bash
adb shell input tap $HABITS_X $HABITS_Y
sleep 2
adb shell screencap -p /sdcard/goals_habits.png
adb pull /sdcard/goals_habits.png /c/dev/logs/transformr-certification/06-goals-habits.png
```

**Verify:**
- [ ] Habit list renders (or empty state)
- [ ] Streak display per habit
- [ ] Completion toggle (tap to mark complete today)
- [ ] CREATE: can add new habit (name, frequency)
- [ ] DELETE: can delete a habit (swipe or button → confirm → removed)

**Create habit test:**
```bash
# Tap "Add Habit" button
adb shell input tap $ADD_HABIT_X $ADD_HABIT_Y
sleep 1
adb shell input tap 540 $HABIT_NAME_Y
sleep 1
adb shell input text "Drink%s8%sglasses%swater"
adb shell input keyevent 111
sleep 0.5
# Save
adb shell input tap $SAVE_HABIT_X $SAVE_HABIT_Y
sleep 2
adb shell screencap -p /sdcard/goals_habit_created.png
adb pull /sdcard/goals_habit_created.png /c/dev/logs/transformr-certification/06-goals-habit-created.png
```

**Complete habit test:**
```bash
# Tap the completion toggle on the newly created habit
adb shell input tap $HABIT_TOGGLE_X $HABIT_TOGGLE_Y
sleep 1
adb shell screencap -p /sdcard/goals_habit_completed.png
adb pull /sdcard/goals_habit_completed.png /c/dev/logs/transformr-certification/06-goals-habit-completed.png
```

**PASS criterion:** Toggle shows completed state. Streak increments (or starts at 1).
Edge function: streak-calculator should be triggered.

### 4.6.3 — Sleep (sleep.tsx)

```bash
adb shell input keyevent 4
sleep 1
adb shell input tap $SLEEP_X $SLEEP_Y
sleep 2
adb shell screencap -p /sdcard/goals_sleep.png
adb pull /sdcard/goals_sleep.png /c/dev/logs/transformr-certification/06-goals-sleep.png
```

**Verify:**
- [ ] Sleep log renders
- [ ] Bedtime picker (time input)
- [ ] Wake time picker (time input)
- [ ] Sleep score/quality display
- [ ] AI optimization → invokes ai-sleep-optimizer
- [ ] History of past entries

**Date/time picker test:**
```bash
# Tap bedtime picker
adb shell input tap $BEDTIME_PICKER_X $BEDTIME_PICKER_Y
sleep 1
adb shell screencap -p /sdcard/goals_sleep_picker.png
adb pull /sdcard/goals_sleep_picker.png /c/dev/logs/transformr-certification/06-goals-sleep-picker.png
# Verify picker renders without crash
# Select a time and confirm
```

### 4.6.4 — Mood (mood.tsx)

```bash
adb shell input keyevent 4
sleep 1
adb shell input tap $MOOD_X $MOOD_Y
sleep 2
adb shell screencap -p /sdcard/goals_mood.png
adb pull /sdcard/goals_mood.png /c/dev/logs/transformr-certification/06-goals-mood.png
```

**Verify:**
- [ ] Mood entry UI (emoji scale or slider)
- [ ] Can log today's mood
- [ ] Mood history/calendar view
- [ ] Patterns/trends shown (if enough data)

### 4.6.5 — Journal (journal.tsx)

```bash
adb shell input keyevent 4
sleep 1
adb shell input tap $JOURNAL_X $JOURNAL_Y
sleep 2
adb shell screencap -p /sdcard/goals_journal.png
adb pull /sdcard/goals_journal.png /c/dev/logs/transformr-certification/06-goals-journal.png
```

**Verify:**
- [ ] Journal entries list (or empty state)
- [ ] CREATE: can write new entry
- [ ] DELETE: can delete an entry (confirm → removed)
- [ ] AI prompt button → invokes ai-journal-prompt
- [ ] Text input handles multiline

**Create journal entry:**
```bash
# Tap new entry button
adb shell input tap $NEW_JOURNAL_X $NEW_JOURNAL_Y
sleep 1
adb shell input tap 540 $JOURNAL_TEXT_Y
sleep 1
adb shell input text "Today%sI%sfeel%sgreat%sand%sworked%sout%shard."
adb shell input keyevent 111
sleep 0.5
# Save
adb shell input tap $SAVE_JOURNAL_X $SAVE_JOURNAL_Y
sleep 2
adb shell screencap -p /sdcard/goals_journal_created.png
adb pull /sdcard/goals_journal_created.png /c/dev/logs/transformr-certification/06-goals-journal-created.png
```

### 4.6.6 — Focus Mode (focus-mode.tsx)

```bash
adb shell input keyevent 4
sleep 1
adb shell input tap $FOCUS_MODE_X $FOCUS_MODE_Y
sleep 2
adb shell screencap -p /sdcard/goals_focus_mode.png
adb pull /sdcard/goals_focus_mode.png /c/dev/logs/transformr-certification/06-goals-focus-mode.png
```

**Verify:**
- [ ] Focus timer renders
- [ ] Can start/stop timer
- [ ] Duration selection works

### 4.6.7 — Vision Board (vision-board.tsx)

```bash
adb shell input keyevent 4
sleep 1
adb shell input tap $VISION_BOARD_X $VISION_BOARD_Y
sleep 2
adb shell screencap -p /sdcard/goals_vision_board.png
adb pull /sdcard/goals_vision_board.png /c/dev/logs/transformr-certification/06-goals-vision-board.png
```

**Verify:**
- [ ] Image grid renders (or empty state with "Add" prompt)
- [ ] Add image button works (opens image picker)
- [ ] Existing images display correctly

### 4.6.8 — Skills (skills.tsx)

```bash
adb shell input keyevent 4
sleep 1
adb shell input tap $SKILLS_X $SKILLS_Y
sleep 2
adb shell screencap -p /sdcard/goals_skills.png
adb pull /sdcard/goals_skills.png /c/dev/logs/transformr-certification/06-goals-skills.png
```

**Verify:**
- [ ] Skills list renders
- [ ] Progress tracking per skill

### 4.6.9 — Challenges (challenges.tsx)

```bash
adb shell input keyevent 4
sleep 1
adb shell input tap $CHALLENGES_X $CHALLENGES_Y
sleep 2
adb shell screencap -p /sdcard/goals_challenges.png
adb pull /sdcard/goals_challenges.png /c/dev/logs/transformr-certification/06-goals-challenges.png
```

**Verify:**
- [ ] Challenge list renders
- [ ] Can browse available challenges
- [ ] Can join a challenge
- [ ] Edge function: challenge-evaluator

### 4.6.10 — Challenge Detail (challenge-detail.tsx)

```bash
# Tap first challenge
adb shell input tap 540 $FIRST_CHALLENGE_Y
sleep 2
adb shell screencap -p /sdcard/goals_challenge_detail.png
adb pull /sdcard/goals_challenge_detail.png /c/dev/logs/transformr-certification/06-goals-challenge-detail.png
```

**Verify:**
- [ ] Challenge info renders (description, duration, participants)
- [ ] Join/leave button works
- [ ] Progress display

### 4.6.11 — Challenge Active (challenge-active.tsx)

**Verify:**
- [ ] Active challenge view renders
- [ ] Daily check-in button
- [ ] Edge functions: challenge-coach, challenge-compliance

### 4.6.12 — Challenge Builder (challenge-builder.tsx)

```bash
adb shell input keyevent 4
sleep 1
# Navigate to challenge builder
adb shell screencap -p /sdcard/goals_challenge_builder.png
adb pull /sdcard/goals_challenge_builder.png /c/dev/logs/transformr-certification/06-goals-challenge-builder.png
```

**Verify:**
- [ ] Can create a custom challenge
- [ ] Name, duration, rules inputs
- [ ] Save button works

### 4.6.13 — Stake Goals (stake-goals.tsx)

```bash
adb shell input keyevent 4
sleep 1
adb shell input tap $STAKE_GOALS_X $STAKE_GOALS_Y
sleep 2
adb shell screencap -p /sdcard/goals_stake.png
adb pull /sdcard/goals_stake.png /c/dev/logs/transformr-certification/06-goals-stake.png
```

**Verify:**
- [ ] Stake goal creation UI
- [ ] Financial commitment input
- [ ] Deadline selection
- [ ] Edge function: stake-evaluator

### 4.6.14 — Community (community.tsx) [NOT IN LAYOUT initially, now registered]

```bash
adb shell input keyevent 4
sleep 1
adb shell input tap $COMMUNITY_X $COMMUNITY_Y
sleep 2
adb shell screencap -p /sdcard/goals_community.png
adb pull /sdcard/goals_community.png /c/dev/logs/transformr-certification/06-goals-community.png
```

**Verify:**
- [ ] Leaderboard renders
- [ ] User rankings visible
- [ ] Social features accessible

### 4.6.15 — Insights (insights.tsx)

```bash
adb shell input keyevent 4
sleep 1
adb shell input tap $INSIGHTS_X $INSIGHTS_Y
sleep 2
adb shell screencap -p /sdcard/goals_insights.png
adb pull /sdcard/goals_insights.png /c/dev/logs/transformr-certification/06-goals-insights.png
```

**Verify:**
- [ ] AI-generated insights display
- [ ] Prediction alerts (severity-colored)
- [ ] Edge functions: ai-screen-insight, ai-pattern-detector, ai-correlation
- [ ] Cards are tappable for detail

### 4.6.16 — Affirmations (affirmations.tsx) [NOT IN LAYOUT]

```bash
# Navigate via button in goals index or direct router push
adb shell screencap -p /sdcard/goals_affirmations.png
adb pull /sdcard/goals_affirmations.png /c/dev/logs/transformr-certification/06-goals-affirmations.png
```

**Verify:**
- [ ] Screen is navigable
- [ ] Daily affirmation displays
- [ ] AI generation → invokes ai-daily-affirmation
- [ ] Can create user-defined affirmation (if supported)

### 4.6.17 — Retrospective (retrospective.tsx) [NOT IN LAYOUT]

```bash
adb shell screencap -p /sdcard/goals_retrospective.png
adb pull /sdcard/goals_retrospective.png /c/dev/logs/transformr-certification/06-goals-retrospective.png
```

**Verify:**
- [ ] Screen is navigable
- [ ] Monthly retrospective letter displays (or "Generate" button)
- [ ] AI generation → invokes ai-monthly-retrospective
- [ ] Past retrospectives accessible

### 4.6.18 — Health ROI (health-roi.tsx) [NOT IN LAYOUT]

```bash
adb shell screencap -p /sdcard/goals_health_roi.png
adb pull /sdcard/goals_health_roi.png /c/dev/logs/transformr-certification/06-goals-health-roi.png
```

**Verify:**
- [ ] Health ROI calculator renders
- [ ] Edge function: ai-health-roi
- [ ] Input fields and calculation output

### 4.6.19 — Goal Detail ([id].tsx)

```bash
# Navigate to a specific goal
adb shell input keyevent 4
sleep 1
# Tap a goal from the goals index
adb shell input tap 540 $FIRST_GOAL_Y
sleep 2
adb shell screencap -p /sdcard/goals_detail.png
adb pull /sdcard/goals_detail.png /c/dev/logs/transformr-certification/06-goals-detail.png
```

**Verify:**
- [ ] Goal details render (title, target, progress)
- [ ] Can edit goal
- [ ] Can delete goal (confirm → removed)
- [ ] Progress tracking works

### 4.6.20-4.6.23 — Business Sub-Screens

```bash
# Business Index
adb shell screencap -p /sdcard/goals_business_index.png
adb pull /sdcard/goals_business_index.png /c/dev/logs/transformr-certification/06-goals-business-index.png

# Revenue
adb shell screencap -p /sdcard/goals_business_revenue.png
adb pull /sdcard/goals_business_revenue.png /c/dev/logs/transformr-certification/06-goals-business-revenue.png

# Customers
adb shell screencap -p /sdcard/goals_business_customers.png
adb pull /sdcard/goals_business_customers.png /c/dev/logs/transformr-certification/06-goals-business-customers.png

# Milestones
adb shell screencap -p /sdcard/goals_business_milestones.png
adb pull /sdcard/goals_business_milestones.png /c/dev/logs/transformr-certification/06-goals-business-milestones.png
```

**Verify each:**
- [ ] Renders without crash
- [ ] Data displays (or empty state)
- [ ] CREATE/EDIT operations work (if applicable)

### 4.6.24-4.6.27 — Finance Sub-Screens

```bash
# Finance Index
adb shell screencap -p /sdcard/goals_finance_index.png
adb pull /sdcard/goals_finance_index.png /c/dev/logs/transformr-certification/06-goals-finance-index.png

# Transactions
adb shell screencap -p /sdcard/goals_finance_transactions.png
adb pull /sdcard/goals_finance_transactions.png /c/dev/logs/transformr-certification/06-goals-finance-transactions.png

# Budgets
adb shell screencap -p /sdcard/goals_finance_budgets.png
adb pull /sdcard/goals_finance_budgets.png /c/dev/logs/transformr-certification/06-goals-finance-budgets.png

# Net Worth
adb shell screencap -p /sdcard/goals_finance_net_worth.png
adb pull /sdcard/goals_finance_net_worth.png /c/dev/logs/transformr-certification/06-goals-finance-net-worth.png
```

**Transactions — special testing:**
- [ ] CREATE: add a new transaction (amount, category, date)
- [ ] DELETE: remove a transaction (confirm → removed from list)
- [ ] Verify totals update after create/delete

### Goals Tab Checkpoint

```bash
echo "CHECKPOINT: Goals tab complete. 27 screens tested." > /c/dev/logs/transformr-certification/checkpoint-goals.txt
```

---

## 4.7 — Profile Tab Testing (11 screens)

### 4.7.0 — Navigate to Profile Tab

```bash
adb logcat -c
adb shell input tap $TAB_PROFILE_X $TAB_Y
sleep 2
adb shell screencap -p /sdcard/profile_index.png
adb pull /sdcard/profile_index.png /c/dev/logs/transformr-certification/07-profile-index.png
```

### 4.7.1 — Profile Index (index.tsx — 832 lines)

**Verify:**
- [ ] User info displays (name, photo, stats)
- [ ] Subscription tier badge shown
- [ ] Settings menu items visible
- [ ] Navigation links to all sub-screens work
- [ ] Logout button exists

### 4.7.2 — Edit Profile (edit-profile.tsx)

```bash
adb shell input tap $EDIT_PROFILE_X $EDIT_PROFILE_Y
sleep 2
adb shell screencap -p /sdcard/profile_edit.png
adb pull /sdcard/profile_edit.png /c/dev/logs/transformr-certification/07-profile-edit.png
```

**Verify:**
- [ ] All profile fields editable (name, email, weight, height, etc.)
- [ ] Save button works
- [ ] Changes persist after save

### 4.7.3 — Partner (partner.tsx)

```bash
adb shell input keyevent 4
sleep 1
adb shell input tap $PARTNER_X $PARTNER_Y
sleep 2
adb shell screencap -p /sdcard/profile_partner.png
adb pull /sdcard/profile_partner.png /c/dev/logs/transformr-certification/07-profile-partner.png
```

**Verify:**
- [ ] Partner management UI renders
- [ ] Can invite a partner (or shows current partner)
- [ ] Partner features accessible

### 4.7.4 — Achievements (achievements.tsx)

```bash
adb shell input keyevent 4
sleep 1
adb shell input tap $ACHIEVEMENTS_X $ACHIEVEMENTS_Y
sleep 2
adb shell screencap -p /sdcard/profile_achievements.png
adb pull /sdcard/profile_achievements.png /c/dev/logs/transformr-certification/07-profile-achievements.png
```

**Verify:**
- [ ] Achievement list renders
- [ ] Locked and unlocked badges distinguished visually
- [ ] Achievement detail tappable
- [ ] Filter/category options (if available)
- [ ] Edge function: achievement-evaluator (triggers on achievement check)

### 4.7.5 — Dashboard Builder (dashboard-builder.tsx)

```bash
adb shell input keyevent 4
sleep 1
adb shell input tap $DASHBOARD_BUILDER_X $DASHBOARD_BUILDER_Y
sleep 2
adb shell screencap -p /sdcard/profile_dashboard_builder.png
adb pull /sdcard/profile_dashboard_builder.png /c/dev/logs/transformr-certification/07-profile-dashboard-builder.png
```

**Verify:**
- [ ] Widget grid renders
- [ ] Widgets are draggable (long press + move via ADB swipe)
- [ ] Layout saves on exit
- [ ] Dashboard reflects new layout after save

**Drag test:**
```bash
# Long press a widget, then drag it
adb shell input swipe $WIDGET_X $WIDGET_Y $TARGET_X $TARGET_Y 1000
sleep 1
adb shell screencap -p /sdcard/profile_dashboard_builder_dragged.png
adb pull /sdcard/profile_dashboard_builder_dragged.png /c/dev/logs/transformr-certification/07-dashboard-builder-drag.png
```

### 4.7.6 — Notifications Settings (notifications-settings.tsx)

```bash
adb shell input keyevent 4
sleep 1
adb shell input tap $NOTIF_SETTINGS_X $NOTIF_SETTINGS_Y
sleep 2
adb shell screencap -p /sdcard/profile_notifications.png
adb pull /sdcard/profile_notifications.png /c/dev/logs/transformr-certification/07-profile-notifications.png
```

**Verify:**
- [ ] Notification toggles render
- [ ] Can toggle individual notification types
- [ ] Changes persist

### 4.7.7 — NFC Setup (nfc-setup.tsx)

```bash
adb shell input keyevent 4
sleep 1
adb shell input tap $NFC_X $NFC_Y
sleep 2
adb shell screencap -p /sdcard/profile_nfc.png
adb pull /sdcard/profile_nfc.png /c/dev/logs/transformr-certification/07-profile-nfc.png
```

**Verify:**
- [ ] NFC setup screen renders
- [ ] Instructions visible
- [ ] No crash (NFC may not be available on emulator — verify graceful handling)

### 4.7.8 — Integrations (integrations.tsx)

```bash
adb shell input keyevent 4
sleep 1
adb shell input tap $INTEGRATIONS_X $INTEGRATIONS_Y
sleep 2
adb shell screencap -p /sdcard/profile_integrations.png
adb pull /sdcard/profile_integrations.png /c/dev/logs/transformr-certification/07-profile-integrations.png
```

**Verify:**
- [ ] Integration list renders (Strava, Spotify, Health Connect, etc.)
- [ ] Connect/disconnect buttons for each
- [ ] No crash when tapping connect (may fail on emulator — verify graceful error)

### 4.7.9 — Wearables (wearables.tsx) [NOT IN LAYOUT]

```bash
# Navigate via button in integrations or profile settings
adb shell screencap -p /sdcard/profile_wearables.png
adb pull /sdcard/profile_wearables.png /c/dev/logs/transformr-certification/07-profile-wearables.png
```

**Verify:**
- [ ] Wearables settings screen renders
- [ ] Device list (Apple Watch, Fitbit, etc.)
- [ ] Sync options visible

### 4.7.10 — Data Export (data-export.tsx)

```bash
adb shell input keyevent 4
sleep 1
adb shell input tap $DATA_EXPORT_X $DATA_EXPORT_Y
sleep 2
adb shell screencap -p /sdcard/profile_data_export.png
adb pull /sdcard/profile_data_export.png /c/dev/logs/transformr-certification/07-profile-data-export.png
```

**Verify:**
- [ ] Export options render (CSV, JSON, PDF)
- [ ] Date range selector works
- [ ] Export button triggers file generation
- [ ] Test each format:
  - CSV export: tap → verify download/generation starts
  - JSON export: tap → verify download/generation starts
  - PDF export: tap → verify download/generation starts

### 4.7.11 — About (about.tsx)

```bash
adb shell input keyevent 4
sleep 1
adb shell input tap $ABOUT_X $ABOUT_Y
sleep 2
adb shell screencap -p /sdcard/profile_about.png
adb pull /sdcard/profile_about.png /c/dev/logs/transformr-certification/07-profile-about.png
```

**Verify:**
- [ ] App version displayed
- [ ] Credits/acknowledgments
- [ ] Links (privacy policy, terms of service) — tappable without crash

### Profile Tab Checkpoint

```bash
echo "CHECKPOINT: Profile tab complete. 11 screens tested." > /c/dev/logs/transformr-certification/checkpoint-profile.txt
```

---

## 4.8 — Standalone Screen Testing (7 screens)

### 4.8.1 — Chat (chat.tsx — 749 lines)

```bash
adb logcat -c
# Navigate to chat (usually via FAB button or navigation item)
adb shell input tap $CHAT_X $CHAT_Y
sleep 2
adb shell screencap -p /sdcard/standalone_chat.png
adb pull /sdcard/standalone_chat.png /c/dev/logs/transformr-certification/08-chat.png
```

**Verify:**
- [ ] Chat interface renders
- [ ] Message input visible at bottom
- [ ] Tone selector (Drill Sergeant, Gentle, etc.) accessible
- [ ] Can type and send a message
- [ ] AI responds (loading state → response appears)
- [ ] Edge function: ai-chat-coach triggered

**Send message test:**
```bash
# Tap message input
adb shell input tap 540 $CHAT_INPUT_Y
sleep 1
adb shell input text "What%sshould%sI%seat%stoday?"
sleep 0.5
# Send
adb shell input tap $SEND_BUTTON_X $SEND_BUTTON_Y
sleep 5  # Wait for AI response

adb shell screencap -p /sdcard/standalone_chat_response.png
adb pull /sdcard/standalone_chat_response.png /c/dev/logs/transformr-certification/08-chat-response.png
```

**Coaching tone test:**
```bash
# Switch tone to verify it affects responses
# Find and tap tone selector
adb shell input tap $TONE_SELECTOR_X $TONE_SELECTOR_Y
sleep 1
# Select "Drill Sergeant" (or whatever aggressive option exists)
adb shell input tap $DRILL_SERGEANT_X $DRILL_SERGEANT_Y
sleep 1
# Send another message
adb shell input tap 540 $CHAT_INPUT_Y
sleep 1
adb shell input text "Motivate%sme"
adb shell input tap $SEND_BUTTON_X $SEND_BUTTON_Y
sleep 5

adb shell screencap -p /sdcard/standalone_chat_tone.png
adb pull /sdcard/standalone_chat_tone.png /c/dev/logs/transformr-certification/08-chat-tone.png
# Verify: response tone is different from default tone
```

### 4.8.2 — Chat History (chat-history.tsx)

```bash
adb shell input keyevent 4
sleep 1
# Navigate to chat history
adb shell input tap $CHAT_HISTORY_X $CHAT_HISTORY_Y
sleep 2
adb shell screencap -p /sdcard/standalone_chat_history.png
adb pull /sdcard/standalone_chat_history.png /c/dev/logs/transformr-certification/08-chat-history.png
```

**Verify:**
- [ ] Past chat sessions listed
- [ ] Can tap to view a past session
- [ ] Search functionality (if available)

**Chat history search test:**
```bash
# If search field exists:
adb shell input tap 540 $CHAT_SEARCH_Y
sleep 1
adb shell input text "eat"
sleep 2
adb shell screencap -p /sdcard/standalone_chat_history_search.png
adb pull /sdcard/standalone_chat_history_search.png /c/dev/logs/transformr-certification/08-chat-history-search.png
```

### 4.8.3 — Daily Briefing (daily-briefing.tsx — 347 lines)

```bash
# Navigate to daily briefing
adb shell input tap $DAILY_BRIEFING_X $DAILY_BRIEFING_Y
sleep 3
adb shell screencap -p /sdcard/standalone_daily_briefing.png
adb pull /sdcard/standalone_daily_briefing.png /c/dev/logs/transformr-certification/08-daily-briefing.png
```

**Verify:**
- [ ] Morning briefing content renders
- [ ] Personalized summary (workouts, nutrition, goals for today)
- [ ] Edge function: daily-reminder triggered
- [ ] Dismissible / navigable

### 4.8.4 — Goal Cinema (goal-cinema.tsx)

```bash
adb shell input keyevent 4
sleep 1
adb shell input tap $GOAL_CINEMA_X $GOAL_CINEMA_Y
sleep 3
adb shell screencap -p /sdcard/standalone_goal_cinema.png
adb pull /sdcard/standalone_goal_cinema.png /c/dev/logs/transformr-certification/08-goal-cinema.png
```

**Verify:**
- [ ] Goal visualization renders
- [ ] Animation/video plays (or placeholder)
- [ ] Edge function: goal-cinema triggered
- [ ] Back navigation works

### 4.8.5 — Trajectory (trajectory.tsx)

```bash
adb shell input keyevent 4
sleep 1
adb shell input tap $TRAJECTORY_X $TRAJECTORY_Y
sleep 3
adb shell screencap -p /sdcard/standalone_trajectory.png
adb pull /sdcard/standalone_trajectory.png /c/dev/logs/transformr-certification/08-trajectory.png
```

**Verify:**
- [ ] Trajectory prediction renders
- [ ] Chart/projection visible
- [ ] Edge function: ai-trajectory triggered
- [ ] Data inputs reflected in projection

### 4.8.6 — Upgrade (upgrade.tsx — 552 lines)

```bash
adb shell input keyevent 4
sleep 1
adb shell input tap $UPGRADE_X $UPGRADE_Y
sleep 2
adb shell screencap -p /sdcard/standalone_upgrade.png
adb pull /sdcard/standalone_upgrade.png /c/dev/logs/transformr-certification/08-upgrade.png
```

**Verify:**
- [ ] Subscription tier cards render (Free, Pro, Elite, Partners)
- [ ] Pricing displayed for each tier
- [ ] Feature comparison list visible
- [ ] Purchase/subscribe button for each paid tier
- [ ] Current tier highlighted

### 4.8.7 — Weekly Review (weekly-review.tsx)

```bash
adb shell input keyevent 4
sleep 1
adb shell input tap $WEEKLY_REVIEW_X $WEEKLY_REVIEW_Y
sleep 3
adb shell screencap -p /sdcard/standalone_weekly_review.png
adb pull /sdcard/standalone_weekly_review.png /c/dev/logs/transformr-certification/08-weekly-review.png
```

**Verify:**
- [ ] Weekly summary renders
- [ ] Stats from the past week shown (workouts, nutrition, habits)
- [ ] Edge function: ai-weekly-report triggered
- [ ] Highlights/achievements for the week

---

## 4.9 — Labs Testing (3 screens)

### 4.9.1 — Labs Index (labs/index.tsx)

```bash
adb logcat -c
# Navigate to labs (find the entry point — likely in profile or a menu)
adb shell screencap -p /sdcard/labs_index.png
adb pull /sdcard/labs_index.png /c/dev/logs/transformr-certification/09-labs-index.png
```

**Verify:**
- [ ] Lab results list renders (or empty state)
- [ ] Upload button visible
- [ ] Past results tappable

### 4.9.2 — Labs Upload (labs/upload.tsx)

```bash
adb shell input tap $LABS_UPLOAD_X $LABS_UPLOAD_Y
sleep 2
adb shell screencap -p /sdcard/labs_upload.png
adb pull /sdcard/labs_upload.png /c/dev/logs/transformr-certification/09-labs-upload.png
```

**Verify:**
- [ ] Upload options (camera capture / file picker / PDF)
- [ ] File selection works (or camera opens)
- [ ] Upload progress indicator

### 4.9.3 — Labs Detail (labs/detail.tsx)

```bash
adb shell input keyevent 4
sleep 1
# Tap a lab result (if any exist)
adb shell screencap -p /sdcard/labs_detail.png
adb pull /sdcard/labs_detail.png /c/dev/logs/transformr-certification/09-labs-detail.png
```

**Verify:**
- [ ] Lab result detail renders
- [ ] AI interpretation → invokes ai-lab-interpret
- [ ] Values displayed with reference ranges
- [ ] Actionable recommendations shown

---

## 4.10 — Partner Testing (4 screens)

### 4.10.1 — Partner Dashboard (partner/dashboard.tsx)

```bash
adb logcat -c
# Navigate to partner section
adb shell screencap -p /sdcard/partner_dashboard.png
adb pull /sdcard/partner_dashboard.png /c/dev/logs/transformr-certification/10-partner-dashboard.png
```

**Verify:**
- [ ] Partner overview renders
- [ ] Partner's stats visible (if connected)
- [ ] Navigation to sub-screens works

### 4.10.2 — Live Workout (partner/live-workout.tsx)

```bash
adb shell input tap $PARTNER_LIVE_X $PARTNER_LIVE_Y
sleep 2
adb shell screencap -p /sdcard/partner_live_workout.png
adb pull /sdcard/partner_live_workout.png /c/dev/logs/transformr-certification/10-partner-live-workout.png
```

**Verify:**
- [ ] Live workout sharing UI renders
- [ ] Status indicator (waiting/active)

### 4.10.3 — Partner Challenges (partner/challenges.tsx)

```bash
adb shell input keyevent 4
sleep 1
adb shell input tap $PARTNER_CHALLENGES_X $PARTNER_CHALLENGES_Y
sleep 2
adb shell screencap -p /sdcard/partner_challenges.png
adb pull /sdcard/partner_challenges.png /c/dev/logs/transformr-certification/10-partner-challenges.png
```

**Verify:**
- [ ] Partner challenges list renders
- [ ] Can create/join a partner challenge

### 4.10.4 — Partner Nudge (partner/nudge.tsx)

```bash
adb shell input keyevent 4
sleep 1
adb shell input tap $PARTNER_NUDGE_X $PARTNER_NUDGE_Y
sleep 2
adb shell screencap -p /sdcard/partner_nudge.png
adb pull /sdcard/partner_nudge.png /c/dev/logs/transformr-certification/10-partner-nudge.png
```

**Verify:**
- [ ] Nudge sending UI renders
- [ ] Can compose and send a nudge
- [ ] Edge function: partner-nudge triggered

---

## 4.11 — DELETE Operations Testing

For each entity type, test the complete delete flow:

### 4.11.1 — Delete Workout

```bash
# Navigate to fitness → workout history
# Find a workout entry
# Attempt to delete (swipe left or tap options → delete)
adb shell input swipe 900 $WORKOUT_ITEM_Y 200 $WORKOUT_ITEM_Y 200
sleep 1
adb shell screencap -p /sdcard/delete_workout_confirm.png
adb pull /sdcard/delete_workout_confirm.png /c/dev/logs/transformr-certification/11-delete-workout-confirm.png

# Verify confirmation modal appears
# Tap confirm
adb shell input tap $CONFIRM_DELETE_X $CONFIRM_DELETE_Y
sleep 2
adb shell screencap -p /sdcard/delete_workout_done.png
adb pull /sdcard/delete_workout_done.png /c/dev/logs/transformr-certification/11-delete-workout-done.png
```

**PASS criterion:** Item removed from list. Does not reappear on refresh.

### 4.11.2 — Delete Meal

```bash
# Navigate to nutrition → daily log
# Find a logged meal
# Swipe to delete or tap delete button
adb shell input swipe 900 $MEAL_ITEM_Y 200 $MEAL_ITEM_Y 200
sleep 1
# Confirm deletion
adb shell input tap $CONFIRM_DELETE_X $CONFIRM_DELETE_Y
sleep 2
```

**PASS criterion:** Meal removed. Daily calorie total updates (decreases by meal's calories).

### 4.11.3 — Delete Habit

```bash
# Navigate to goals → habits
# Find the test habit created earlier
# Delete it
adb shell input swipe 900 $HABIT_ITEM_Y 200 $HABIT_ITEM_Y 200
sleep 1
adb shell input tap $CONFIRM_DELETE_X $CONFIRM_DELETE_Y
sleep 2
```

**PASS criterion:** Habit removed from list. Streak data gone.

### 4.11.4 — Delete Journal Entry

```bash
# Navigate to goals → journal
# Find the test entry created earlier
# Delete it
adb shell input swipe 900 $JOURNAL_ITEM_Y 200 $JOURNAL_ITEM_Y 200
sleep 1
adb shell input tap $CONFIRM_DELETE_X $CONFIRM_DELETE_Y
sleep 2
```

**PASS criterion:** Entry removed from list.

### 4.11.5 — Delete Transaction

```bash
# Navigate to goals → finance → transactions
# Find a transaction
# Delete it
adb shell input swipe 900 $TRANSACTION_ITEM_Y 200 $TRANSACTION_ITEM_Y 200
sleep 1
adb shell input tap $CONFIRM_DELETE_X $CONFIRM_DELETE_Y
sleep 2
```

**PASS criterion:** Transaction removed. Balance/total updates correctly.

### 4.11.6 — Delete Goal

```bash
# Navigate to goals → tap a goal → detail view
# Find delete option (button or menu)
adb shell input tap $DELETE_GOAL_X $DELETE_GOAL_Y
sleep 1
# Confirm
adb shell input tap $CONFIRM_DELETE_X $CONFIRM_DELETE_Y
sleep 2
```

**PASS criterion:** Goal removed from goal list. Progress ring disappears.

---

## 4.12 — Cross-Entity Workflow Test

This tests the complete chain: **Goal → Habit → Streak → Achievement**

### Step 1: Create a Goal

```bash
# Navigate to Goals tab
adb shell input tap $TAB_GOALS_X $TAB_Y
sleep 2

# Create a new goal
adb shell input tap $NEW_GOAL_X $NEW_GOAL_Y
sleep 1
adb shell input tap 540 $GOAL_TITLE_Y
sleep 1
adb shell input text "Drink%swater%sdaily"
adb shell input keyevent 111
sleep 0.5
# Save goal
adb shell input tap $SAVE_GOAL_X $SAVE_GOAL_Y
sleep 2
```

### Step 2: Create a Habit Linked to Goal

```bash
# Navigate to habits
adb shell input tap $HABITS_X $HABITS_Y
sleep 2

# Create habit
adb shell input tap $ADD_HABIT_X $ADD_HABIT_Y
sleep 1
adb shell input tap 540 $HABIT_NAME_Y
sleep 1
adb shell input text "8%sglasses%sof%swater"
adb shell input keyevent 111
sleep 0.5
# Save
adb shell input tap $SAVE_HABIT_X $SAVE_HABIT_Y
sleep 2
```

### Step 3: Complete Habit (verify streak increments)

```bash
# Mark habit as complete for today
adb shell input tap $HABIT_TOGGLE_X $HABIT_TOGGLE_Y
sleep 2

# Verify streak = 1
adb shell screencap -p /sdcard/workflow_streak_1.png
adb pull /sdcard/workflow_streak_1.png /c/dev/logs/transformr-certification/12-workflow-streak-1.png
```

### Step 4: Verify Achievement System

```bash
# Navigate to Profile → Achievements
adb shell input tap $TAB_PROFILE_X $TAB_Y
sleep 2
adb shell input tap $ACHIEVEMENTS_X $ACHIEVEMENTS_Y
sleep 2

adb shell screencap -p /sdcard/workflow_achievements.png
adb pull /sdcard/workflow_achievements.png /c/dev/logs/transformr-certification/12-workflow-achievements.png
```

**NOTE:** Achieving a multi-day streak requires multiple days. Document:
- What CAN be verified in a single session (goal creation, habit creation, single completion, streak=1)
- What REQUIRES time passage (7-day streak → achievement unlock)
- Whether the achievement-evaluator edge function fires on habit completion

---

## 4.13 — Feature Gating / Subscription Tier Verification

### 4.13.1 — Verify Free Tier State

```bash
# Check current tier (should be 'free' for test account)
# Navigate to Profile → check tier badge
adb shell input tap $TAB_PROFILE_X $TAB_Y
sleep 2
adb shell screencap -p /sdcard/gate_tier_check.png
adb pull /sdcard/gate_tier_check.png /c/dev/logs/transformr-certification/13-gate-tier.png
```

### 4.13.2 — AI Chat Message Cap

```bash
# Navigate to chat
adb shell input tap $CHAT_X $CHAT_Y
sleep 2

# Send messages until cap is hit (subscriptionStore tracks aiChatMessages)
# Send message 1
adb shell input tap 540 $CHAT_INPUT_Y
sleep 1
adb shell input text "Message%s1"
adb shell input tap $SEND_BUTTON_X $SEND_BUTTON_Y
sleep 5

# Send message 2
adb shell input tap 540 $CHAT_INPUT_Y
sleep 1
adb shell input text "Message%s2"
adb shell input tap $SEND_BUTTON_X $SEND_BUTTON_Y
sleep 5

# Send message 3
adb shell input tap 540 $CHAT_INPUT_Y
sleep 1
adb shell input text "Message%s3"
adb shell input tap $SEND_BUTTON_X $SEND_BUTTON_Y
sleep 5

# Try message 4 — should trigger UpgradeModal or cap message
adb shell input tap 540 $CHAT_INPUT_Y
sleep 1
adb shell input text "Message%s4"
adb shell input tap $SEND_BUTTON_X $SEND_BUTTON_Y
sleep 3

adb shell screencap -p /sdcard/gate_chat_cap.png
adb pull /sdcard/gate_chat_cap.png /c/dev/logs/transformr-certification/13-gate-chat-cap.png
```

**PASS criterion:** After reaching the free tier cap, either:
- UpgradeModal appears, OR
- A cap message is shown (e.g., "Upgrade to Pro for unlimited messages")
- The modal/message is DISMISSIBLE

### 4.13.3 — Meal Camera Scan Cap

```bash
# Navigate to nutrition → meal camera
# Take multiple scans (if possible on emulator)
# Verify cap enforcement for aiMealCameraScans
```

### 4.13.4 — UpgradeModal Dismissibility

```bash
# When UpgradeModal appears:
# Try tapping outside the modal (top or bottom of screen)
adb shell input tap 540 100
sleep 1

# If still showing, try the X button or "Not Now" / "Later" option
adb shell input tap $MODAL_CLOSE_X $MODAL_CLOSE_Y
sleep 1

# Verify: app returns to normal navigation (not stuck)
adb shell screencap -p /sdcard/gate_modal_dismissed.png
adb pull /sdcard/gate_modal_dismissed.png /c/dev/logs/transformr-certification/13-gate-modal-dismissed.png
```

**PASS criterion:** User can dismiss the modal and continue using the app.
They are NOT locked out or forced to subscribe.

### 4.13.5 — Upgrade Screen Verification

```bash
# Navigate to upgrade screen
adb shell input tap $UPGRADE_NAV_X $UPGRADE_NAV_Y
sleep 2
adb shell screencap -p /sdcard/gate_upgrade_screen.png
adb pull /sdcard/gate_upgrade_screen.png /c/dev/logs/transformr-certification/13-gate-upgrade.png
```

**Verify:**
- [ ] Four tiers displayed: Free, Pro, Elite, Partners
- [ ] Pricing is correct and visible
- [ ] Feature list for each tier
- [ ] Current tier highlighted/selected
- [ ] Subscribe buttons for paid tiers

---

## 4.14 — Dark/Light Theme Toggle Test

### 4.14.1 — Find Theme Toggle

```bash
# Navigate to Profile or Settings where theme toggle exists
adb shell input tap $TAB_PROFILE_X $TAB_Y
sleep 2
# Look for theme toggle (sun/moon icon or "Appearance" setting)
# If in a settings sub-screen, navigate there
```

### 4.14.2 — Switch to Light Mode

```bash
adb shell input tap $THEME_TOGGLE_X $THEME_TOGGLE_Y
sleep 2
adb shell screencap -p /sdcard/theme_light_profile.png
adb pull /sdcard/theme_light_profile.png /c/dev/logs/transformr-certification/14-theme-light-profile.png
```

### 4.14.3 — Screenshot 5 Key Screens in Light Mode

```bash
# Dashboard
adb shell input tap $TAB_DASHBOARD_X $TAB_Y
sleep 2
adb shell screencap -p /sdcard/theme_light_dashboard.png
adb pull /sdcard/theme_light_dashboard.png /c/dev/logs/transformr-certification/14-theme-light-dashboard.png

# Fitness
adb shell input tap $TAB_FITNESS_X $TAB_Y
sleep 2
adb shell screencap -p /sdcard/theme_light_fitness.png
adb pull /sdcard/theme_light_fitness.png /c/dev/logs/transformr-certification/14-theme-light-fitness.png

# Nutrition
adb shell input tap $TAB_NUTRITION_X $TAB_Y
sleep 2
adb shell screencap -p /sdcard/theme_light_nutrition.png
adb pull /sdcard/theme_light_nutrition.png /c/dev/logs/transformr-certification/14-theme-light-nutrition.png

# Goals
adb shell input tap $TAB_GOALS_X $TAB_Y
sleep 2
adb shell screencap -p /sdcard/theme_light_goals.png
adb pull /sdcard/theme_light_goals.png /c/dev/logs/transformr-certification/14-theme-light-goals.png

# Profile
adb shell input tap $TAB_PROFILE_X $TAB_Y
sleep 2
adb shell screencap -p /sdcard/theme_light_profile2.png
adb pull /sdcard/theme_light_profile2.png /c/dev/logs/transformr-certification/14-theme-light-profile2.png
```

### 4.14.4 — Switch Back to Dark Mode

```bash
# Navigate to theme toggle and switch back
adb shell input tap $THEME_TOGGLE_X $THEME_TOGGLE_Y
sleep 2

# Repeat screenshots for dark mode verification
adb shell input tap $TAB_DASHBOARD_X $TAB_Y
sleep 2
adb shell screencap -p /sdcard/theme_dark_dashboard.png
adb pull /sdcard/theme_dark_dashboard.png /c/dev/logs/transformr-certification/14-theme-dark-dashboard.png
```

**PASS criterion:** No crashes during either toggle. All text readable in both modes.
No invisible/white-on-white or black-on-black elements.

---

## 4.15 — Keyboard Avoidance Systematic Test

For EVERY screen with text inputs, perform this test:

```bash
# Pattern for each screen:
# 1. Navigate to screen
# 2. Tap the input field
# 3. Verify keyboard appears (screenshot shows keyboard)
# 4. Verify input is visible ABOVE the keyboard
# 5. Type text and verify it appears
# 6. Dismiss keyboard (keyevent 111)
```

### Screens to test (in order):

| Screen | Input Fields |
|--------|-------------|
| login.tsx | email, password |
| register.tsx | name, email, password, confirm password |
| onboarding/profile.tsx | name, weight, height, age |
| add-food.tsx | food search |
| journal.tsx | journal text area |
| chat.tsx | message input |
| finance/transactions.tsx | amount, description |
| habits.tsx (create) | habit name |
| goals/[id].tsx (create) | goal title, description |
| business/revenue.tsx | revenue amount |
| edit-profile.tsx | all profile fields |

### Test Pattern (repeat for each):

```bash
adb logcat -c

# Navigate to screen
# [navigation commands specific to each screen]
sleep 2

# Tap input field
adb shell input tap 540 $INPUT_Y
sleep 1

# Screenshot with keyboard open
adb shell screencap -p /sdcard/keyboard_SCREEN_NAME.png
adb pull /sdcard/keyboard_SCREEN_NAME.png /c/dev/logs/transformr-certification/15-keyboard-SCREEN_NAME.png

# Verify: input field is visible (not hidden behind keyboard)
# Type text
adb shell input text "test%sinput"
sleep 0.5

# Screenshot after typing
adb shell screencap -p /sdcard/keyboard_SCREEN_NAME_typed.png
adb pull /sdcard/keyboard_SCREEN_NAME_typed.png /c/dev/logs/transformr-certification/15-keyboard-SCREEN_NAME-typed.png

# Dismiss keyboard
adb shell input keyevent 111
sleep 1

# Check logcat
adb logcat -d -s ReactNativeJS:* *:E | grep -v "WebSocket\|Metro\|HMR\|Packager\|debugger\|hot.update\|socket"
```

**PASS criterion per screen:** Input remains visible when keyboard is open. Text
appears in the field. No crash. No hidden content.

---

## 4.16 — Edge Cases

### 4.16.1 — Negative Number Input

```bash
# Navigate to a numeric input (e.g., weight entry in fitness/progress)
adb shell input tap $TAB_FITNESS_X $TAB_Y
sleep 2
# Navigate to weight input
adb shell input tap $WEIGHT_ENTRY_X $WEIGHT_ENTRY_Y
sleep 1
adb shell input text "-100"
sleep 1
adb shell screencap -p /sdcard/edge_negative.png
adb pull /sdcard/edge_negative.png /c/dev/logs/transformr-certification/16-edge-negative.png
# Attempt to save
adb shell input tap $SAVE_X $SAVE_Y
sleep 1
adb shell screencap -p /sdcard/edge_negative_result.png
adb pull /sdcard/edge_negative_result.png /c/dev/logs/transformr-certification/16-edge-negative-result.png
```

**PASS criterion:** App rejects negative value (validation error) OR ignores the minus sign.
App does NOT crash. Negative weight does NOT persist.

### 4.16.2 — Future Date for Past Event

```bash
# Navigate to workout logging or food logging
# Attempt to set a future date for the entry
# (If date picker exists, select tomorrow)
```

**PASS criterion:** App either rejects future date OR accepts it without crash.
Document which behavior occurs.

### 4.16.3 — Special Characters / XSS

```bash
# Navigate to a text input (journal entry)
adb shell input tap $TAB_GOALS_X $TAB_Y
sleep 2
adb shell input tap $JOURNAL_X $JOURNAL_Y
sleep 2
adb shell input tap $NEW_JOURNAL_X $NEW_JOURNAL_Y
sleep 1
adb shell input tap 540 $JOURNAL_TEXT_Y
sleep 1

# Type XSS attempt (note: ADB input text handles special chars differently)
adb shell input text "<script>alert(1)</script>"
sleep 0.5
adb shell input tap $SAVE_JOURNAL_X $SAVE_JOURNAL_Y
sleep 2

adb shell screencap -p /sdcard/edge_xss.png
adb pull /sdcard/edge_xss.png /c/dev/logs/transformr-certification/16-edge-xss.png
```

**PASS criterion:** Text is saved as literal characters. No script execution.
App does NOT crash. Text displays safely when viewed.

### 4.16.4 — Extremely Long Text

```bash
# In journal entry, paste extremely long text
# Generate 5000 character string
adb shell input tap 540 $JOURNAL_TEXT_Y
sleep 1
# Type a long repeating string (ADB has limits, test what's feasible)
adb shell input text "$(python3 -c "print('A' * 2000)")"
sleep 2

adb shell screencap -p /sdcard/edge_longtext.png
adb pull /sdcard/edge_longtext.png /c/dev/logs/transformr-certification/16-edge-longtext.png
```

**PASS criterion:** App handles gracefully. Either truncates, scrolls, or accepts.
No crash. No freeze. No OOM.

### 4.16.5 — Double-Tap Tab Icon (Same Tab)

```bash
# Already on dashboard tab
adb shell input tap $TAB_DASHBOARD_X $TAB_Y
sleep 0.5

# Scroll down first
adb shell input swipe 540 1200 540 400 300
sleep 1

# Tap dashboard tab again (already active)
adb shell input tap $TAB_DASHBOARD_X $TAB_Y
sleep 1

adb shell screencap -p /sdcard/edge_doubletap_tab.png
adb pull /sdcard/edge_doubletap_tab.png /c/dev/logs/transformr-certification/16-edge-doubletap-tab.png
```

**PASS criterion:** Scrolls to top of the screen. Does NOT reload data. Does NOT crash.
Does NOT navigate away.

### 4.16.6 — Rapid Save Button Tap (Duplicate Prevention)

```bash
# Navigate to a create form (e.g., add food)
adb shell input tap $TAB_NUTRITION_X $TAB_Y
sleep 2
adb shell input tap $ADD_FOOD_X $ADD_FOOD_Y
sleep 2

# Search and select a food item
adb shell input tap 540 $FOOD_SEARCH_Y
sleep 1
adb shell input text "chicken"
sleep 2
adb shell input tap 540 $FIRST_RESULT_Y
sleep 1

# Rapidly tap the Log/Save button 5 times
adb shell input tap $LOG_BUTTON_X $LOG_BUTTON_Y
adb shell input tap $LOG_BUTTON_X $LOG_BUTTON_Y
adb shell input tap $LOG_BUTTON_X $LOG_BUTTON_Y
adb shell input tap $LOG_BUTTON_X $LOG_BUTTON_Y
adb shell input tap $LOG_BUTTON_X $LOG_BUTTON_Y
sleep 3

# Check nutrition log — should have only 1 entry, not 5
adb shell screencap -p /sdcard/edge_rapid_tap.png
adb pull /sdcard/edge_rapid_tap.png /c/dev/logs/transformr-certification/16-edge-rapid-tap.png
```

**PASS criterion:** Only ONE entry created, not 5 duplicates.

### 4.16.7 — Chat Draft Preservation

```bash
# Navigate to chat
adb shell input tap $CHAT_X $CHAT_Y
sleep 2

# Type a message but DON'T send
adb shell input tap 540 $CHAT_INPUT_Y
sleep 1
adb shell input text "This%sis%sa%sdraft%smessage"
sleep 0.5

# Switch to another tab
adb shell input tap $TAB_DASHBOARD_X $TAB_Y
sleep 2

# Come back to chat
adb shell input tap $CHAT_X $CHAT_Y
sleep 2

adb shell screencap -p /sdcard/edge_draft.png
adb pull /sdcard/edge_draft.png /c/dev/logs/transformr-certification/16-edge-draft.png
```

**PASS criterion:** Either the draft message is preserved (ideal) OR it's clearly gone
(acceptable — but document). No crash.

### 4.16.8 — Empty State Verification

```bash
# For a new user with no data, verify these screens don't crash:
# - Dashboard (no widgets have data)
# - Fitness (no workouts logged)
# - Nutrition (no meals logged)
# - Goals (no goals created)
# - Habits (no habits)
# - Journal (no entries)
# - Chat history (no past chats)
# - Achievements (all locked)
```

**PASS criterion:** Every screen shows a meaningful empty state (placeholder text,
illustration, CTA to add first item). None crash with null/undefined data.

---

## 4.17 — Calculation Verification

### 4.17.1 — Water Progress Percentage

```bash
# Navigate to nutrition or dashboard where water is tracked
# If user logged 64 oz and target is 100 oz:
# Verify display shows 64/100 or 64%
```

**Formula:** `(logged / target) × 100`
**Test case:** logged=64, target=100 → display should show 64%

### 4.17.2 — Macro Percentages

```bash
# Navigate to nutrition index
# Check the macro breakdown display
```

**Formula:** 
- Protein %: `(protein_g × 4 / total_cal) × 100`
- Carb %: `(carb_g × 4 / total_cal) × 100`  
- Fat %: `(fat_g × 9 / total_cal) × 100`

**Test case:** If protein=180g, carbs=250g, fat=70g:
- Protein cal = 720, Carb cal = 1000, Fat cal = 630
- Total = 2350
- Protein % = 30.6%, Carb % = 42.6%, Fat % = 26.8%
- Verify displayed percentages match (within ±1% rounding)

### 4.17.3 — Body Weight Trend

```bash
# Navigate to fitness → progress
# If weight entries exist, verify trend direction
```

**Formula:** Compare most recent 7 entries. If last > first, trend is UP.
If last < first, trend is DOWN. Weekly delta = last - first.

**Test case:** Weights [140, 140.5, 141, 140.5, 141, 141.5, 142]
- Trend: UP
- Weekly delta: +2 lbs
- Verify displayed trend matches

### 4.17.4 — Countdown Days Remaining

```bash
# If a countdown goal is set on the dashboard
# Verify the days remaining is mathematically correct
```

**Formula:** `ceil((goal_date - today) / (24 × 60 × 60 × 1000))`

**Test case:** If goal date = 2027-10-01 and today = 2026-04-20:
- Days remaining = 529
- Verify displayed number matches (or is within ±1 of calculated)

### 4.17.5 — Streak Count

```bash
# Navigate to Goals → Habits
# For a habit with known completion history
# Verify streak count matches consecutive days
```

**Formula:** Count backwards from today. Each consecutive day with a completion = +1.
First missed day = streak ends.

### 4.17.6 — BMR Display Verification

```bash
# Navigate to where BMR is displayed (nutrition settings, profile, or TDEE screen)
# With known user data: male, 80kg, 180cm, 30yo
```

**Expected BMR (Mifflin-St Jeor):**
- Male: (10 × 80) + (6.25 × 180) - (5 × 30) + 5 = 800 + 1125 - 150 + 5 = **1780 cal**
- Verify displayed value matches (±5 cal for rounding)

---

## 4.18 — Deep Link Testing

### 4.18.1 — Test URL Scheme Navigation

```bash
# Kill app first to test cold start deep link
adb shell am force-stop com.automateai.transformr
sleep 2

# Test deep link to dashboard
adb shell am start -a android.intent.action.VIEW -d "com.automateai.transformr://dashboard"
sleep 4
adb shell screencap -p /sdcard/deeplink_dashboard.png
adb pull /sdcard/deeplink_dashboard.png /c/dev/logs/transformr-certification/18-deeplink-dashboard.png

# Test deep link to fitness
adb shell am force-stop com.automateai.transformr
sleep 2
adb shell am start -a android.intent.action.VIEW -d "com.automateai.transformr://fitness"
sleep 4
adb shell screencap -p /sdcard/deeplink_fitness.png
adb pull /sdcard/deeplink_fitness.png /c/dev/logs/transformr-certification/18-deeplink-fitness.png

# Test deep link to nutrition
adb shell am force-stop com.automateai.transformr
sleep 2
adb shell am start -a android.intent.action.VIEW -d "com.automateai.transformr://nutrition"
sleep 4
adb shell screencap -p /sdcard/deeplink_nutrition.png
adb pull /sdcard/deeplink_nutrition.png /c/dev/logs/transformr-certification/18-deeplink-nutrition.png
```

**PASS criterion per link:** App opens and navigates to the correct screen.
No crash. Auth check still fires if user is not logged in.

**Document:** Which deep links work and which don't. If deep links are not yet
configured in the Expo Router setup, log as "NOT IMPLEMENTED" — don't fail.

---

## 4.19 — Data Persistence Test

### 4.19.1 — Log Data, Kill App, Verify Persistence

```bash
# Step 1: Log a breakfast meal
adb shell input tap $TAB_NUTRITION_X $TAB_Y
sleep 2
# [Add food: "eggs and toast" ~400 cal via the add-food flow]
# ... (use add-food flow from 4.5.2)
sleep 2

# Step 2: Log a workout
adb shell input tap $TAB_FITNESS_X $TAB_Y
sleep 2
# [Start and complete a short workout via workout-player flow from 4.4.4]
sleep 2

# Step 3: Kill the app
adb shell am force-stop com.automateai.transformr
sleep 3

# Step 4: Reopen
adb shell am start -n com.automateai.transformr/.MainActivity
sleep 5

# Step 5: Verify meal persisted
adb shell input tap $TAB_NUTRITION_X $TAB_Y
sleep 2
adb shell screencap -p /sdcard/persist_nutrition.png
adb pull /sdcard/persist_nutrition.png /c/dev/logs/transformr-certification/19-persist-nutrition.png
# Verify: meal from step 1 still shows in daily log

# Step 6: Verify workout persisted
adb shell input tap $TAB_FITNESS_X $TAB_Y
sleep 2
adb shell screencap -p /sdcard/persist_fitness.png
adb pull /sdcard/persist_fitness.png /c/dev/logs/transformr-certification/19-persist-fitness.png
# Verify: workout from step 2 still shows in history
```

### 4.19.2 — Multi-Entry Accumulation

```bash
# Step 7: Log a second meal (lunch ~550 cal)
adb shell input tap $TAB_NUTRITION_X $TAB_Y
sleep 2
# [Add food: "chicken and rice" ~550 cal]
sleep 2

# Step 8: Verify daily total = ~950 cal (400 + 550)
adb shell screencap -p /sdcard/persist_accumulation.png
adb pull /sdcard/persist_accumulation.png /c/dev/logs/transformr-certification/19-persist-accumulation.png
```

**PASS criterion:** Daily calorie total reflects BOTH meals summed correctly.
Data survives app kill/restart.

---

## 4.20 — Search Functionality

### 4.20.1 — Exercise Search

```bash
adb shell input tap $TAB_FITNESS_X $TAB_Y
sleep 2
# Navigate to exercises
adb shell input tap $EXERCISES_X $EXERCISES_Y
sleep 2

# Search
adb shell input tap 540 $SEARCH_Y
sleep 1
adb shell input text "squat"
sleep 2
adb shell screencap -p /sdcard/search_exercise.png
adb pull /sdcard/search_exercise.png /c/dev/logs/transformr-certification/20-search-exercise.png
```

**PASS criterion:** Results contain "squat" variations. List updates in real-time.

### 4.20.2 — Food Search

```bash
adb shell input tap $TAB_NUTRITION_X $TAB_Y
sleep 2
adb shell input tap $ADD_FOOD_X $ADD_FOOD_Y
sleep 2

adb shell input tap 540 $FOOD_SEARCH_Y
sleep 1
adb shell input text "banana"
sleep 2
adb shell screencap -p /sdcard/search_food.png
adb pull /sdcard/search_food.png /c/dev/logs/transformr-certification/20-search-food.png
```

**PASS criterion:** Results contain banana. Calorie info shown per result.

### 4.20.3 — Chat History Search

```bash
# Navigate to chat history
adb shell input tap $CHAT_HISTORY_X $CHAT_HISTORY_Y
sleep 2

# If search field exists
adb shell input tap 540 $CHAT_SEARCH_Y
sleep 1
adb shell input text "eat"
sleep 2
adb shell screencap -p /sdcard/search_chat.png
adb pull /sdcard/search_chat.png /c/dev/logs/transformr-certification/20-search-chat.png
```

**PASS criterion:** If search exists: results show sessions containing "eat".
If search doesn't exist: log as "NOT IMPLEMENTED."

### 4.20.4 — Exercise Muscle Group Filter

```bash
adb shell input tap $TAB_FITNESS_X $TAB_Y
sleep 2
adb shell input tap $EXERCISES_X $EXERCISES_Y
sleep 2

# Tap muscle group filter (e.g., "Chest" chip)
adb shell input tap $FILTER_CHEST_X $FILTER_CHEST_Y
sleep 1
adb shell screencap -p /sdcard/search_muscle_filter.png
adb pull /sdcard/search_muscle_filter.png /c/dev/logs/transformr-certification/20-search-muscle-filter.png
```

**PASS criterion:** Only chest exercises shown after filter applied.

### 4.20.5 — Achievement Filter

```bash
adb shell input tap $TAB_PROFILE_X $TAB_Y
sleep 2
adb shell input tap $ACHIEVEMENTS_X $ACHIEVEMENTS_Y
sleep 2

# Look for filter/category buttons
adb shell screencap -p /sdcard/search_achievements.png
adb pull /sdcard/search_achievements.png /c/dev/logs/transformr-certification/20-search-achievements.png
```

**PASS criterion:** If filter exists: categories filter correctly.
If no filter: log as "NOT IMPLEMENTED."

---

# SECTION 5: AI FEATURE TESTING

## 5.1 — AI Feature Verification Protocol

For EACH AI feature, verify this sequence:

1. **Trigger exists** — button/action that initiates the AI call is visible and tappable
2. **Loading state** — after tapping, a loading indicator appears
3. **Network call** — logcat shows `supabase.functions.invoke('function-name')` or similar
4. **Response displays** — AI-generated content appears on screen
5. **Dismissible** — results can be closed/navigated away without crash

If the edge function fails (network error, timeout), that's acceptable for this test —
verify the ERROR STATE is handled gracefully (error message shown, not a crash).

## 5.2 — Complete Edge Function → Screen Mapping

| # | Edge Function | Triggered From | How to Test |
|---|--------------|----------------|-------------|
| 1 | ai-chat-coach | chat.tsx | Send a message in AI chat |
| 2 | ai-coach | chat.tsx (legacy) | May be deprecated — check if referenced |
| 3 | ai-meal-analysis | nutrition/meal-camera.tsx | Capture photo of food |
| 4 | ai-form-check | fitness/form-check.tsx | Use form check camera |
| 5 | ai-posture-analysis | fitness/posture-check.tsx | Use posture check camera |
| 6 | ai-supplement-scanner | fitness/supplement-scanner.tsx | Scan supplement bottle |
| 7 | ai-progress-photo | fitness/progress-photos.tsx | Take progress photo |
| 8 | ai-workout-narrator | fitness/workout-player.tsx | During active workout |
| 9 | ai-workout-coach | fitness/workout-player.tsx | During active workout |
| 10 | ai-workout-advisor | fitness/index.tsx | AI recommendations on fitness home |
| 11 | ai-post-workout | fitness/workout-summary.tsx | After completing workout |
| 12 | ai-adaptive-program | fitness/programs.tsx | Generate/adjust program |
| 13 | ai-menu-scan | nutrition/menu-scanner.tsx | Scan restaurant menu |
| 14 | ai-meal-prep | nutrition/meal-prep.tsx, meal-plans.tsx | Generate meal prep plan |
| 15 | ai-grocery-list | nutrition/grocery-list.tsx | Generate grocery list |
| 16 | ai-supplement | nutrition/supplements.tsx | Supplement recommendations |
| 17 | ai-sleep-optimizer | goals/sleep.tsx | Sleep optimization tips |
| 18 | ai-journal-prompt | goals/journal.tsx | Generate journal prompt |
| 19 | ai-daily-affirmation | goals/affirmations.tsx | Generate daily affirmation |
| 20 | ai-monthly-retrospective | goals/retrospective.tsx | Generate monthly letter |
| 21 | ai-health-roi | goals/health-roi.tsx | Calculate health ROI |
| 22 | ai-screen-insight | goals/insights.tsx | Generate insights |
| 23 | ai-pattern-detector | goals/insights.tsx | Detect behavior patterns |
| 24 | ai-correlation | goals/insights.tsx | Find data correlations |
| 25 | ai-motivation | Dashboard/notifications | Motivational messages |
| 26 | ai-trajectory | trajectory.tsx | Predict trajectory |
| 27 | ai-voice-command | Voice input feature | Voice command processing |
| 28 | ai-weekly-report | weekly-review.tsx | Weekly summary generation |
| 29 | ai-lab-interpret | labs/detail.tsx | Interpret lab results |
| 30 | daily-reminder | daily-briefing.tsx | Morning briefing |
| 31 | daily-accountability | Notifications (background) | Accountability messages |
| 32 | goal-cinema | goal-cinema.tsx | Goal visualization |
| 33 | proactive-wellness | Dashboard/notifications | Wellness check-ins |
| 34 | readiness-score | dashboard.tsx | Daily readiness calculation |
| 35 | streak-calculator | goals/habits.tsx | Streak computation |
| 36 | pr-detection | fitness/workout-summary.tsx | PR identification |
| 37 | achievement-evaluator | profile/achievements.tsx | Achievement checking |
| 38 | challenge-coach | goals/challenge-active.tsx | Challenge coaching |
| 39 | challenge-compliance | goals/challenge-active.tsx | Challenge compliance check |
| 40 | challenge-evaluator | goals/challenges.tsx | Challenge evaluation |
| 41 | partner-nudge | partner/nudge.tsx | Send partner nudge |
| 42 | stake-evaluator | goals/stake-goals.tsx | Evaluate stake goal |
| 43 | smart-notification-engine | Background service | Smart notification timing |
| 44 | social-content-gen | Share features | Social media content |
| 45 | weather-fetch | Dashboard weather widget | Weather data |
| 46 | widget-update | Home screen widget | Widget data refresh |
| 47 | workout-narrator | fitness/workout-player.tsx | Between-set narration |
| 48 | reorder-predictor | nutrition/supplements.tsx | Supplement reorder timing |
| 49 | hubspot-sync | Background | CRM sync |
| 50 | stripe-webhook | Background | Payment processing |
| 51 | subscription-sync | Background | Subscription state sync |
| 52 | transcribe-audio | Voice features | Audio transcription |

## 5.3 — Testing Priorities

**Must test (user-facing, triggerable):** #1-21, 26, 28-30, 32, 35-42

**Cannot test directly (background/notification-triggered):** #25, 31, 33, 34, 43-46, 49-52

**Difficult to test on emulator (require hardware):** #27, 47, 48, 52

For background functions, verify:
- The function exists in `supabase/functions/`
- It's referenced somewhere in the codebase
- No immediate crash when the triggering event should occur

---

# SECTION 6: CERTIFICATION REPORT TEMPLATE

After ALL testing is complete, generate this report. Save it as:
`C:\dev\logs\transformr-certification\CERTIFICATION-REPORT.md`

```
═══════════════════════════════════════════════════════════════════════════════════
 TRANSFORMR — DEFINITIVE LAUNCH CERTIFICATION REPORT v2.0
═══════════════════════════════════════════════════════════════════════════════════
 Date:            [YYYY-MM-DD]
 Tester:          AI Certification Agent
 Build:           [BUILD_NUMBER from app.json or latest commit hash]
 Device:          [EMULATOR_NAME — e.g., Pixel_7_API_34]
 App Package:     com.automateai.transformr
 Codebase Stats:  103 screens | 111 components | 21 stores | 52 edge functions
═══════════════════════════════════════════════════════════════════════════════════

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  PASS 1: STATIC CODE AUDIT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    TypeScript errors:           [count]
    ESLint errors:               [count]
    ESLint warnings:             [count]
    console.log statements:      [count — list files if > 0]
    Hardcoded colors:            [count — list files if > 0]
    `any` types:                 [count — list files if > 0]
    Store export issues:         [count — list stores if > 0]
    Missing imports:             [count]
    PASS 1 VERDICT:              [PASS / FAIL]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  PASS 2: FUNCTIONAL LOGIC AUDIT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    BMR calculation:             [correct / incorrect — detail]
    TDEE calculation:            [correct / incorrect — detail]
    Macro split:                 [correct / incorrect — detail]
    Streak logic:                [correct / incorrect — detail]
    PR detection:                [correct / incorrect — detail]
    Readiness score:             [correct / incorrect — detail]
    Day score:                   [correct / incorrect — detail]
    Subscription gate logic:     [correct / incorrect — detail]
    Edge function signatures:    [all match / N mismatches — list]
    Navigation graph:            [complete / N issues — list]
    PASS 2 VERDICT:              [PASS / FAIL]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  PASS 3: EMULATOR TESTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  AUTH FLOW
    Login (valid credentials):       [pass / fail — detail]
    Login (invalid credentials):     [pass / fail — error shown: yes/no]
    Forgot password:                 [pass / fail — detail]
    Register:                        [pass / fail — detail]
    Google OAuth button:             [present and tappable / missing / crashes]
    Logout:                          [pass / fail — returns to login: yes/no]

  ONBOARDING (9 screens)
    1. welcome.tsx:                   [pass / fail]
    2. profile.tsx:                   [pass / fail — inputs work: yes/no]
    3. fitness.tsx:                   [pass / fail — selection works: yes/no]
    4. goals.tsx:                     [pass / fail — selection works: yes/no]
    5. nutrition.tsx:                 [pass / fail — preferences work: yes/no]
    6. business.tsx:                  [pass / fail — SKIP works: yes/no]
    7. partner.tsx:                   [pass / fail — SKIP works: yes/no]
    8. notifications.tsx:             [pass / fail — permission dialog: yes/no]
    9. ready.tsx:                     [pass / fail — navigates to dashboard: yes/no]

  DASHBOARD (1 screen)
    Renders without crash:           [yes / no]
    Greeting correct:                [yes / no — time-of-day: correct/incorrect]
    Widgets populated:               [list which render]
    Pull-to-refresh:                 [works / broken]
    Quick actions navigate:          [all work / list broken ones]
    Day score displays:              [yes / no / not implemented]
    AI insights section:             [renders / not present / crashes]
    Countdown timer:                 [correct / not set / incorrect]

  FITNESS TAB (14 screens)
    fitness/index.tsx:               [renders / crashes — detail]
    fitness/exercises.tsx:            [renders / crashes — detail]
    fitness/exercise-detail.tsx:      [renders / crashes — detail]
    fitness/workout-player.tsx:       [renders / crashes — detail]
    fitness/workout-summary.tsx:      [renders / crashes — detail]
    fitness/progress.tsx:             [renders / crashes — detail]
    fitness/programs.tsx:             [renders / crashes — detail]
    fitness/form-check.tsx:           [renders / crashes — detail]
    fitness/pain-tracker.tsx:         [renders / crashes — detail]
    fitness/mobility.tsx:             [renders / crashes — detail]
    fitness/posture-check.tsx:        [navigable: yes/no — renders / crashes]
    fitness/progress-photos.tsx:      [navigable: yes/no — renders / crashes]
    fitness/supplement-scanner.tsx:   [navigable: yes/no — renders / crashes]
    fitness/marketplace.tsx:          [navigable: yes/no — renders / crashes]

  NUTRITION TAB (11 screens)
    nutrition/index.tsx:              [renders / crashes — detail]
    nutrition/add-food.tsx:           [renders / crashes — detail]
    nutrition/meal-camera.tsx:        [renders / crashes — detail]
    nutrition/barcode-scanner.tsx:    [renders / crashes — detail]
    nutrition/menu-scanner.tsx:       [renders / crashes — detail]
    nutrition/saved-meals.tsx:        [renders / crashes — detail]
    nutrition/meal-plans.tsx:         [renders / crashes — detail]
    nutrition/meal-prep.tsx:          [renders / crashes — detail]
    nutrition/grocery-list.tsx:       [renders / crashes — detail]
    nutrition/supplements.tsx:        [renders / crashes — detail]
    nutrition/analytics.tsx:          [renders / crashes — detail]

  GOALS TAB (27 screens)
    goals/index.tsx:                  [renders / crashes]
    goals/habits.tsx:                 [renders / crashes]
    goals/sleep.tsx:                  [renders / crashes]
    goals/mood.tsx:                   [renders / crashes]
    goals/journal.tsx:                [renders / crashes]
    goals/focus-mode.tsx:             [renders / crashes]
    goals/vision-board.tsx:           [renders / crashes]
    goals/skills.tsx:                 [renders / crashes]
    goals/challenges.tsx:             [renders / crashes]
    goals/challenge-detail.tsx:       [renders / crashes]
    goals/challenge-active.tsx:       [renders / crashes]
    goals/challenge-builder.tsx:      [renders / crashes]
    goals/stake-goals.tsx:            [renders / crashes]
    goals/community.tsx:              [renders / crashes]
    goals/insights.tsx:               [renders / crashes]
    goals/affirmations.tsx:           [navigable: yes/no — renders / crashes]
    goals/retrospective.tsx:          [navigable: yes/no — renders / crashes]
    goals/health-roi.tsx:             [navigable: yes/no — renders / crashes]
    goals/[id].tsx:                   [renders / crashes]
    goals/business/index.tsx:         [renders / crashes]
    goals/business/revenue.tsx:       [renders / crashes]
    goals/business/customers.tsx:     [renders / crashes]
    goals/business/milestones.tsx:    [renders / crashes]
    goals/finance/index.tsx:          [renders / crashes]
    goals/finance/transactions.tsx:   [renders / crashes]
    goals/finance/budgets.tsx:        [renders / crashes]
    goals/finance/net-worth.tsx:      [renders / crashes]

  PROFILE TAB (11 screens)
    profile/index.tsx:                [renders / crashes]
    profile/edit-profile.tsx:         [renders / crashes]
    profile/partner.tsx:              [renders / crashes]
    profile/achievements.tsx:         [renders / crashes]
    profile/dashboard-builder.tsx:    [renders / crashes]
    profile/notifications-settings.tsx: [renders / crashes]
    profile/nfc-setup.tsx:            [renders / crashes]
    profile/integrations.tsx:         [renders / crashes]
    profile/wearables.tsx:            [navigable: yes/no — renders / crashes]
    profile/data-export.tsx:          [renders / crashes]
    profile/about.tsx:                [renders / crashes]

  STANDALONE SCREENS (7)
    chat.tsx:                         [renders / crashes]
    chat-history.tsx:                 [renders / crashes]
    daily-briefing.tsx:               [renders / crashes]
    goal-cinema.tsx:                  [renders / crashes]
    trajectory.tsx:                   [renders / crashes]
    upgrade.tsx:                      [renders / crashes]
    weekly-review.tsx:                [renders / crashes]

  LABS (3 screens)
    labs/index.tsx:                   [renders / crashes]
    labs/upload.tsx:                  [renders / crashes]
    labs/detail.tsx:                  [renders / crashes]

  PARTNER (4 screens)
    partner/dashboard.tsx:            [renders / crashes]
    partner/live-workout.tsx:         [renders / crashes]
    partner/challenges.tsx:           [renders / crashes]
    partner/nudge.tsx:                [renders / crashes]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  DELETE OPERATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    Delete workout:                  [works with confirmation / no confirmation / broken / not implemented]
    Delete meal:                     [works with confirmation / no confirmation / broken / not implemented]
    Delete habit:                    [works with confirmation / no confirmation / broken / not implemented]
    Delete journal entry:            [works with confirmation / no confirmation / broken / not implemented]
    Delete transaction:              [works with confirmation / no confirmation / broken / not implemented]
    Delete goal:                     [works with confirmation / no confirmation / broken / not implemented]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  CROSS-ENTITY WORKFLOW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    Create Goal:                     [pass / fail]
    Create Habit (linked):           [pass / fail]
    Complete Habit (streak=1):       [pass / fail]
    Streak increments:               [yes / no]
    Achievement evaluator fires:     [yes / no / not verifiable]
    Full chain verified:             [yes / partial — breaks at: X]
    NOTE:                            [Multi-day testing required for full chain]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  FEATURE GATING (Subscription Tiers)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    Current test tier:               [free / pro / elite / partners]
    AI chat cap enforced:            [yes — cap at N / no — unlimited / not testable]
    Meal camera cap enforced:        [yes — cap at N / no — unlimited / not testable]
    UpgradeModal appears:            [yes / no]
    UpgradeModal dismissible:        [yes / no — method: tap outside / X button / "Not Now"]
    User can navigate after dismiss: [yes / no — stuck on modal]
    Upgrade screen renders:          [yes / no]
    Tier pricing displayed:          [yes / no]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  THEME SWITCHING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    Theme toggle location:           [profile / settings / not found]
    Dark → Light:                    [no crash / crashes on: X]
    Light → Dark:                    [no crash / crashes on: X]
    All text readable both modes:    [yes / no — issues on: X]
    No invisible elements:           [yes / no — issues on: X]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  DEEP LINKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    com.automateai.transformr://dashboard:   [opens correctly / fails / not configured]
    com.automateai.transformr://fitness:     [opens correctly / fails / not configured]
    com.automateai.transformr://nutrition:   [opens correctly / fails / not configured]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  KEYBOARD AVOIDANCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    Total screens tested:            [count]
    All inputs visible with keyboard:[yes / no]
    Screens with hidden inputs:      [list any problematic screens]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  SEARCH FUNCTIONALITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    Exercise search:                 [works / broken / not implemented]
    Food search:                     [works / broken / not implemented]
    Chat history search:             [works / broken / not implemented]
    Exercise muscle group filter:    [works / broken / not implemented]
    Achievement filter:              [works / broken / not implemented]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  DATA PERSISTENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    Survives app kill + restart:     [yes / no — detail]
    Multi-entry accumulation:        [correct totals / incorrect — detail]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  CALCULATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    Water progress percentage:       [correct / incorrect / not testable]
    Macro percentages:               [correct / incorrect / not testable]
    Body weight trend:               [correct / incorrect / not testable]
    Countdown days remaining:        [correct / incorrect / not set]
    Streak count:                    [correct / incorrect]
    BMR formula (Mifflin-St Jeor):   [correct / incorrect — expected: X, got: Y]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  AI FEATURES (52 edge functions)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    User-facing AI features tested:  [count / total triggerable]
    Working correctly:               [count — list]
    Failing (error handled):         [count — list with error]
    Failing (crashes app):           [count — list with error — CRITICAL]
    Not triggerable from UI:         [count — list]
    Background-only (not testable):  [count — list]

    Individual results:
    [For each tested function:]
    ai-chat-coach:                   [works / error handled / crashes / not triggerable]
    ai-meal-analysis:                [works / error handled / crashes / not triggerable]
    ai-form-check:                   [works / error handled / crashes / not triggerable]
    [... continue for all 52 ...]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  EDGE CASES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    Negative number rejection:       [rejects / accepts / crashes]
    Future date handling:            [rejects / accepts / crashes]
    XSS/special char sanitization:   [sanitized / stored raw / crashes]
    Long text (5000 chars):          [graceful / truncated / crashes / OOM]
    Double-tap same tab:             [scrolls to top / reloads / crashes]
    Rapid save tap (5x):             [single entry / N duplicates / crashes]
    Chat draft preservation:         [preserved / lost / crashes]
    Empty states (all screens):      [all render / list broken screens]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  DATA EXPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    CSV export:                      [generates / fails / not implemented]
    JSON export:                     [generates / fails / not implemented]
    PDF export:                      [generates / fails / not implemented]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  PHOTO/CAMERA FLOWS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    Progress photo capture:          [camera opens / fails — detail]
    Progress photo AI analysis:      [works / fails — detail]
    Meal camera capture:             [camera opens / fails — detail]
    Meal camera AI analysis:         [works / fails — detail]
    Vision board image picker:       [opens / fails — detail]
    Supplement scanner camera:       [opens / fails — detail]
    Form check camera:               [opens / fails — detail]
    Posture check camera:            [opens / fails — detail]
    Barcode scanner camera:          [opens / fails — detail]
    Menu scanner camera:             [opens / fails — detail]
    Lab upload (photo/file):         [works / fails — detail]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ENHANCEMENT SCREENS (on disk, not in layout — navigated via router.push)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    fitness/posture-check.tsx:       [navigable / not navigable — renders / crashes]
    fitness/progress-photos.tsx:     [navigable / not navigable — renders / crashes]
    fitness/supplement-scanner.tsx:  [navigable / not navigable — renders / crashes]
    fitness/marketplace.tsx:         [navigable / not navigable — renders / crashes]
    goals/affirmations.tsx:          [navigable / not navigable — renders / crashes]
    goals/retrospective.tsx:         [navigable / not navigable — renders / crashes]
    goals/health-roi.tsx:            [navigable / not navigable — renders / crashes]
    profile/wearables.tsx:           [navigable / not navigable — renders / crashes]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  NOT BUILT — Excluded from Testing
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    calendar.tsx:                    NOT BUILT — no file exists on disk
    time-lapse.tsx:                  NOT BUILT — no file exists on disk

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  SCREENSHOTS CAPTURED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    Total screenshots:               [count]
    Directory:                       C:\dev\logs\transformr-certification\
    All screenshots named:           [Section]-[screen-name].png

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  VISUAL ISSUES (for UI Agent — DO NOT FIX)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    [List each visual issue found:]
    1. [screen] — [description of visual issue]
    2. [screen] — [description of visual issue]
    ...

═══════════════════════════════════════════════════════════════════════════════════
  OVERALL VERDICT
═══════════════════════════════════════════════════════════════════════════════════

  CRITICAL BLOCKERS (must fix before launch):
    [count] — [list each with screen and error]

  HIGH-PRIORITY BUGS (should fix before launch):
    [count] — [list each with screen and behavior]

  MEDIUM-PRIORITY ISSUES (fix soon after launch):
    [count] — [list each]

  LOW-PRIORITY / COSMETIC (backlog):
    [count] — [list each]

  VISUAL ISSUES (for UI agent):
    [count] — [logged above, not blocking launch]

  ─────────────────────────────────────────────────────────────────────────────
  LAUNCH READY:                      [YES / NO]
  ─────────────────────────────────────────────────────────────────────────────
  REASON:                            [If NO: list the critical blockers that must
                                      be resolved. If YES: confirm all critical
                                      paths work — auth, core data logging,
                                      persistence, no crashes on primary flows.]
  ─────────────────────────────────────────────────────────────────────────────

═══════════════════════════════════════════════════════════════════════════════════
  END OF CERTIFICATION REPORT
═══════════════════════════════════════════════════════════════════════════════════
```

---

# SECTION 7: FIXES PERMITTED DURING CERTIFICATION

## 7.1 — What You MAY Fix

During Pass 3 testing, if you encounter crashes or errors, you may fix them
following these strict rules:

### Allowed Fixes:
1. **Missing imports** that prevent a screen from rendering
2. **Null/undefined crashes** where a store value isn't checked before use
3. **TypeScript errors** that prevent compilation
4. **Broken navigation** where a screen can't be reached (missing Stack.Screen)
5. **Data connection** where a store hook isn't wired to a component

### Fix Protocol:
```
1. Identify the error (from logcat or screenshot)
2. Read the relevant file(s)
3. Make the MINIMAL fix (one line if possible)
4. Verify the fix resolves the error
5. Verify no new errors introduced
6. Continue testing
7. Document the fix in the report
```

## 7.2 — What You MAY NOT Fix

- Any StyleSheet value (colors, spacing, fonts, sizes)
- Any animation or transition
- Component layout or ordering
- Any store logic (even if you think it's wrong — log it instead)
- Any edge function
- Any navigation structure (except adding missing Stack.Screen for existing file)
- Any business logic formula (log suspected errors for developer review)

## 7.3 — Fix Documentation

For every fix applied during testing, append to the report:

```
  FIXES APPLIED DURING CERTIFICATION
    Fix 1:
      File:     [path]
      Error:    [what was failing]
      Change:   [what you changed — be specific]
      Verified: [screen now renders / error gone]
    Fix 2:
      ...
```

---

# SECTION 8: RESUMPTION PROTOCOL

If the certification is interrupted (timeout, crash, network loss):

## 8.1 — Check Last Checkpoint

```bash
ls /c/dev/logs/transformr-certification/checkpoint-*.txt
cat /c/dev/logs/transformr-certification/checkpoint-*.txt
```

## 8.2 — Resume From Checkpoint

Skip all sections before the last checkpoint. Begin testing from the next
section after the checkpoint.

## 8.3 — Partial Report

If the certification cannot be completed in one session, generate a PARTIAL
report with all completed sections filled in and remaining sections marked as
"NOT YET TESTED."

---

# APPENDIX A: ADB QUICK REFERENCE

```bash
# Device
adb devices                                              # List connected devices
adb shell getprop ro.product.model                       # Get device model
adb shell wm size                                        # Get screen resolution

# App Lifecycle
adb shell am start -n com.automateai.transformr/.MainActivity  # Launch app
adb shell am force-stop com.automateai.transformr              # Kill app
adb shell pm clear com.automateai.transformr                   # Clear app data

# Input
adb shell input tap X Y                                  # Tap at coordinates
adb shell input text "string"                            # Type text (spaces = %s)
adb shell input keyevent 4                               # Back button
adb shell input keyevent 3                               # Home button
adb shell input keyevent 66                              # Enter
adb shell input keyevent 67                              # Backspace
adb shell input keyevent 111                             # Escape (dismiss keyboard)
adb shell input swipe X1 Y1 X2 Y2 DURATION_MS           # Swipe/scroll
adb shell input swipe X Y X Y 1000                       # Long press (same start/end)

# Screenshots
adb shell screencap -p /sdcard/name.png                  # Take screenshot
adb pull /sdcard/name.png local/path/name.png            # Pull to PC

# Logcat
adb logcat -c                                            # Clear log buffer
adb logcat -d                                            # Dump current log
adb logcat -d -s ReactNativeJS:* *:E                     # Filter JS + errors
adb logcat -d | grep -i "crash\|fatal\|exception"       # Find crashes

# Deep Links
adb shell am start -a android.intent.action.VIEW -d "com.automateai.transformr://path"

# Files
adb push local/file /sdcard/file                         # Push file to device
adb pull /sdcard/file local/file                         # Pull file from device

# Misc
adb shell settings get system screen_brightness          # Check brightness
adb shell input swipe 540 0 540 200 300                  # Pull down notification shade
```

---

# APPENDIX B: COORDINATE CHEAT SHEET

These are APPROXIMATE values for a 1080×2400 display. **You MUST verify via
screenshot before using.** Different emulator configurations will have different
coordinates.

```
Tab Bar Y:          ~2340-2380 (bottom of screen)
Tab 1 (Dashboard):  X=108
Tab 2 (Fitness):    X=324
Tab 3 (Nutrition):  X=540
Tab 4 (Goals):      X=756
Tab 5 (Profile):    X=972

Status bar height:  ~60-80px (top)
Header/title area:  ~80-160px from top
Content start:      ~200px from top
Screen center X:    540
Screen center Y:    1200

Scroll amounts:
  Short scroll:     swipe 540 1200 540 900 300
  Full page scroll: swipe 540 1800 540 400 300
  Pull to refresh:  swipe 540 400 540 1000 200
```

For a 1080×1920 display, reduce all Y values proportionally:
- Tab Bar Y: ~1870-1910
- Center Y: ~960

---

# APPENDIX C: TESTING ORDER SUMMARY

Execute in this exact order:

1. Setup & Coordinate Discovery (4.0)
2. Auth Flow (4.1)
3. Onboarding (4.2) — skip if account already onboarded
4. Dashboard (4.3)
5. Fitness Tab — all 14 screens (4.4)
6. Nutrition Tab — all 11 screens (4.5)
7. Goals Tab — all 27 screens (4.6)
8. Profile Tab — all 11 screens (4.7)
9. Standalone Screens — all 7 (4.8)
10. Labs — all 3 screens (4.9)
11. Partner — all 4 screens (4.10)
12. DELETE operations (4.11)
13. Cross-entity workflow (4.12)
14. Feature gating (4.13)
15. Theme toggle (4.14)
16. Keyboard avoidance (4.15)
17. Edge cases (4.16)
18. Calculations (4.17)
19. Deep links (4.18)
20. Data persistence (4.19)
21. Search functionality (4.20)
22. AI features (Section 5)
23. Generate report (Section 6)

**Total screens to test:** 103 (all that exist on disk)
**Total edge functions to verify:** 52
**Total test categories:** 23

---

# APPENDIX D: ERROR SEVERITY CLASSIFICATION

When logging issues, classify them by severity:

**CRITICAL (blocks launch):**
- App crashes (unhandled exception, white screen of death)
- Data loss (entries disappear, persist incorrectly)
- Auth bypass (unauthorized access possible)
- Core flow broken (can't log workout, can't log food, can't create habit)

**HIGH (should fix before launch):**
- Feature doesn't work but doesn't crash (button does nothing)
- Incorrect calculations displayed to user
- Subscription gate not enforced (free user gets premium features)
- Broken navigation (can't reach a screen)

**MEDIUM (fix soon after launch):**
- Minor data display issues (wrong formatting, truncated text)
- Non-critical feature broken (export, NFC, weather widget)
- Slow performance (> 3s load time on a screen)
- Missing empty states (screen looks blank/broken with no data)

**LOW (backlog):**
- Visual inconsistencies between screens
- Minor UX friction (extra tap needed, confusing button label)
- Non-essential feature enhancement
- Accessibility gaps (missing labels, low contrast)

---

END OF CERTIFICATION PROMPT — v2.0
Total test coverage: 103 screens, 52 edge functions, 21 stores
Estimated execution time: 4-6 hours with an AI agent on emulator
