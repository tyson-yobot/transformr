# TRANSFORMR — Screen-by-Screen Verification Protocol
# Self-Contained Agent Runbook — Zero External Context Required

---

## APP IDENTITY

- **App Name:** TRANSFORMR
- **Bundle ID:** com.automateai.transformr
- **Main Activity:** .MainActivity
- **URL Scheme:** com.automateai.transformr
- **Expo SDK:** 53.0.23 (LOCKED — never change)
- **Navigation:** Expo Router v5
- **Package Manager:** npm (never pnpm, never yarn)
- **Working Branch:** dev
- **Root:** C:\dev\transformr
- **Mobile Project:** C:\dev\transformr\apps\mobile
- **TypeScript Baseline:** 0 errors

---

## SECTION 1: IRON-CLAD RULES

```
NEVER run taskkill, Stop-Process, kill, or any process-killing command.
NEVER remove features, screens, components, navigation, or functionality.
NEVER downgrade, stub, minimize, or workaround anything.
NEVER hardcode values. NEVER guess. NEVER use placeholders.
NEVER trigger EAS builds — that is Tyson's decision only.
NEVER push to main — working branch is dev.
NEVER change the Expo SDK version without explicit approval.
NEVER install new packages without explicit approval — package.json is locked.
ADD and FIX ONLY. Every change must be production-grade and complete.
If something is broken: fix it fully and correctly. Never remove it.
If something is missing: implement it fully. No stubs. No half-measures.
Branch: dev
Root: C:\dev\transformr
Mobile project: apps\mobile
Package manager: npm (never pnpm, never yarn)
TypeScript check: npx tsc --noEmit --pretty (from apps\mobile directory)
Read every file completely before modifying it.
Commit after every phase. Never batch multiple phases into one commit.
Stop and report before any command that could be destructive.
```

---

## SECTION 2: MANDATORY STARTUP SEQUENCE

Execute these steps IN ORDER before touching any screen.

### Step 2.1 — Read Governance Files

Read each file completely. Do not skim. Do not skip.

**File 1:**
```
C:\dev\transformr\CLAUDE.md
```

**File 2 — SOUL.md:**
Check if `C:\dev\transformr\SOUL.md` exists.

- If it EXISTS: read it completely.
- If it is MISSING: create it now with the following content verbatim:

```markdown
# TRANSFORMR — Soul Document

## Product Identity
TRANSFORMR is an AI-powered total life transformation platform. It is not a fitness
app. It is not a nutrition tracker. It is a complete operating system for human
potential — the first platform to unify all seven pillars of elite performance in
a single, AI-orchestrated experience.

## The Seven Pillars
1. **Body** — Physical fitness, workout programming, movement quality
2. **Fitness** — Performance tracking, PRs, progressive overload, recovery
3. **Nutrition** — Fueling strategy, macro precision, metabolic optimization
4. **Business** — Revenue, milestones, customers, financial freedom
5. **Habits** — Daily disciplines, streak momentum, behavioral architecture
6. **Mindset** — Journaling, affirmations, mood, mental resilience
7. **Relationships** — Partner accountability, community, social momentum

## Brand Colors
- Primary purple: #A855F7
- Background: #0C0A15
- Card glass: rgba(22,18,42,0.88)
- Purple glow: rgba(168,85,247,0.25)
- Secondary purple: #7E22CE
- Light accent: #C084FC
- FORBIDDEN as primary: #0243D5, #3B82F6, #1A56DB (Construktr blue — never use)

## Subscription Tiers
- **Free:** Core tracking, limited AI calls
- **Pro:** Full AI coaching, all screens, unlimited tracking
- **Elite:** Everything + partner features, labs, advanced analytics

## AI-First Design Philosophy
Every feature should feel like it has intelligence behind it. The app does not
passively record data — it actively coaches, predicts, and guides. AI is not a
feature; it is the foundation. Every screen that can surface an insight should.
Every input that can be automated should be. The user should feel like they have
a world-class coach in their pocket at all times.

## Voice and Tone
- Confident, not arrogant
- Scientific, not sterile
- Motivating, not preachy
- Premium, not pretentious
- Direct. No filler. No fluff.

## Target User
High-performers who refuse to accept average. Entrepreneurs, athletes, executives,
and anyone who treats their body, mind, and bank account as interconnected systems
that must all be optimized simultaneously.
```

**File 3 — CONFIGURATION_LOCK.md:**
Check if `C:\dev\transformr\CONFIGURATION_LOCK.md` exists.

- If it EXISTS: read it completely.
- If it is MISSING: create it now with the following content verbatim:

```markdown
# TRANSFORMR — Configuration Lock

## LOCKED VALUES — NEVER CHANGE WITHOUT EXPLICIT WRITTEN APPROVAL FROM TYSON

### Expo SDK
- Version: **53.0.23** — LOCKED
- Do not run `expo upgrade`, `npx expo install expo@latest`, or any command that
  changes this version.

### Bundle Identifier
- iOS: **com.automateai.transformr** — LOCKED
- Android: **com.automateai.transformr** — LOCKED
- Never change app.json slug, bundleIdentifier, or packageName.

### App Identity
- App name: TRANSFORMR (all caps) — LOCKED
- Slug: transformr — LOCKED
- Scheme: com.automateai.transformr — LOCKED

### Locked Config Files — DO NOT MODIFY
- metro.config.js — LOCKED (Metro serializer patch is intentional)
- babel.config.js — LOCKED
- app.config.ts / app.json — LOCKED
- tsconfig.json — LOCKED
- eas.json — LOCKED
- .env / .env.example — LOCKED (change values in .env only, never the structure)

### Locked Build Profiles (eas.json)
- development, preview, production profiles — LOCKED
- Do not add, remove, or rename build profiles.

### Package Manager
- npm — LOCKED (never pnpm, never yarn)
- New packages require explicit approval before installation.

### TypeScript
- Strict mode — LOCKED
- Target baseline: 0 errors. Never introduce new errors.

### Navigation
- Expo Router v5 — LOCKED
- Route structure under app/ — LOCKED (never rename routes)
- Tab order — LOCKED: Dashboard, Fitness, Nutrition, Goals, Profile

### Supabase
- Project URL and anon key are set in .env — do not hardcode them anywhere.
- Never modify migrations or Edge Functions without explicit approval.
```

**File 4 — GUNNAR_GUARDRAILS.md (if present):**
```
C:\dev\GUNNAR_GUARDRAILS.md
```
If this file exists, read it completely and follow its rules in addition to all rules here.

---

## SECTION 3: CRITICAL KNOWN ISSUES — FIX BEFORE ANY SCREEN TESTING

These issues must be resolved FIRST. Do not begin the screen-by-screen loop until all are addressed.

### Issue 3.1 — Stripe Graceful Fallback

**File:** `C:\dev\transformr\apps\mobile\services\stripe.ts`

Read the file completely first. The Stripe keys are placeholders (`pk_live_xxxxx`, `sk_live_xxxxx`, `whsec_xxxxx`).

Fix requirement: When Stripe is not configured (keys contain `xxxxx` or are empty), all Stripe-dependent functions must return a graceful failure state instead of crashing. Payment screens must show "Payment system coming soon" or a branded placeholder. No crashes. No unhandled promise rejections.

Implementation approach (read the actual file first, then adapt):
- Add a `isStripeConfigured()` guard function that checks if keys are real
- Wrap all Stripe calls in this guard
- Return `{ success: false, error: 'Payment system not yet configured' }` when not configured
- In the upgrade/paywall screen: show a branded "Coming Soon" state when Stripe is not configured

After editing, run:
```bash
cd C:\dev\transformr\apps\mobile && npx tsc --noEmit --pretty
```

Commit: `fix(stripe): graceful fallback when payment keys not configured`

---

### Issue 3.2 — Spotify Graceful Fallback

**File:** `C:\dev\transformr\apps\mobile\services\integrations\spotify.ts` (verify exact path first)

Read the file. The Spotify client ID is a placeholder.

Fix requirement: When Spotify client ID is a placeholder, all Spotify integration calls must degrade gracefully. Show "Spotify integration coming soon" instead of crashing. Authentication flow must not crash if client ID is invalid.

After editing, run TypeScript check. Commit: `fix(spotify): graceful fallback when client ID not configured`

---

### Issue 3.3 — OpenWeatherMap Graceful Fallback

**File:** Search for weather service file: `C:\dev\transformr\apps\mobile\services\weather.ts` or similar path

Read the file. The API key is empty or placeholder.

Fix requirement: When weather API key is missing, all weather-dependent UI must show "Weather unavailable" instead of crashing or showing a blank card. This must be a real UI state, not a removed feature.

After editing, run TypeScript check. Commit: `fix(weather): graceful fallback when API key not configured`

---

### Issue 3.4 — Goal Cinema Animations

**File:** `C:\dev\transformr\apps\mobile\app/goal-cinema.tsx`

Read the file completely. If animations are stubbed, implement real Animated API or Reanimated animations. The screen must feel premium — this is a high-value feature used for goal visualization.

Minimum requirements:
- Fade-in entrance animation for each goal card
- Scale pulse on the primary CTA
- Smooth transitions between goal slides (if multi-goal)
- No placeholder text visible to users

After editing, run TypeScript check. Commit: `fix(goal-cinema): implement real entrance and transition animations`

---

### Issue 3.5 — Labs Section Interactions

**File:** `C:\dev\transformr\apps\mobile\app/labs/index.tsx`

Read the file. All buttons must navigate to real screens or trigger real actions. No dead buttons. No console.log stubs.

After editing, run TypeScript check. Commit: `fix(labs): wire all buttons to real navigation and actions`

---

### Issue 3.6 — Voice Degradation

Search for voice-related files:
```bash
grep -r "voice\|Voice\|speech\|Speech" C:\dev\transformr\apps\mobile\services --include="*.ts" -l
```

Read each file found. Ensure voice features degrade gracefully when TTS/STT APIs are unavailable. Never crash. Show a muted icon state or "Voice unavailable" message.

After editing, run TypeScript check. Commit: `fix(voice): graceful degradation when voice APIs unavailable`

---

After ALL known issues are fixed:
```bash
cd C:\dev\transformr\apps\mobile && npx tsc --noEmit --pretty
```
Must show 0 errors before proceeding.

---

## SECTION 4: EMULATOR SETUP AND VERIFICATION

### Step 4.1 — Verify Emulator State

```bash
# Confirm emulator is running and responsive
adb devices

# Verify app is installed
adb shell pm list packages | grep transformr
# Expected output: package:com.automateai.transformr

# Set up Metro port forwarding
adb reverse tcp:8081 tcp:8081

# Clear logcat buffer
adb logcat -c
```

If the app is NOT installed, do NOT install it yourself. Stop and report to Tyson.

### Step 4.2 — Launch App

```bash
# Force stop any stale instance
adb shell am force-stop com.automateai.transformr

# Clear logcat fresh
adb logcat -c

# Launch
adb shell am start -n com.automateai.transformr/.MainActivity

# Wait 3 seconds for app to fully initialize, then capture logcat
adb logcat -d ReactNativeJS:V JS:E *:S 2>&1 | tail -50
```

Inspect logcat. If there are JS errors on launch: READ the relevant source files and fix them before proceeding.

### Step 4.3 — Screenshot Reference

```bash
adb shell screencap -p /sdcard/screen.png && adb pull /sdcard/screen.png launch_state.png
```

Note whether app is showing:
- Auth screens (login/register) — if not logged in
- Dashboard — if logged in with existing session

### Step 4.4 — Network Verification

```bash
# Confirm airplane mode is OFF (network must be available for Supabase calls)
adb shell settings get global airplane_mode_on
# Expected: 0

# If airplane mode is on, turn it off:
adb shell settings put global airplane_mode_on 0 && adb shell am broadcast -a android.intent.action.AIRPLANE_MODE
```

### ADB Reference Commands (use throughout all testing)

```bash
# Take screenshot
adb shell screencap -p /sdcard/screen.png && adb pull /sdcard/screen.png [name].png

# Dump filtered logcat (ReactNativeJS and JS errors only)
adb logcat -d ReactNativeJS:V JS:E *:S 2>&1 | tail -50

# Clear logcat
adb logcat -c

# Tap at coordinates (replace X Y with measured values)
adb shell input tap X Y

# Swipe scroll down (scroll up the page)
adb shell input swipe 540 1400 540 600 300

# Swipe scroll up (scroll down the page)
adb shell input swipe 540 600 540 1400 300

# Pull to refresh (swipe down from top of content area)
adb shell input swipe 540 400 540 900 300

# Type text into focused input
adb shell input text "test_input"

# Press back button
adb shell input keyevent 4

# Press Enter/Done
adb shell input keyevent 66

# Force stop
adb shell am force-stop com.automateai.transformr

# Launch
adb shell am start -n com.automateai.transformr/.MainActivity

# Enable airplane mode (for offline testing)
adb shell settings put global airplane_mode_on 1 && adb shell am broadcast -a android.intent.action.AIRPLANE_MODE

# Disable airplane mode
adb shell settings put global airplane_mode_on 0 && adb shell am broadcast -a android.intent.action.AIRPLANE_MODE
```

---

## SECTION 5: TAB BAR COORDINATE DISCOVERY

Execute this BEFORE any screen testing. Tab coordinates are required throughout the entire verification.

### Step 5.1 — Navigate to Main Tabs

If app is on auth screen: log in with a test account. If app is on dashboard: proceed.

### Step 5.2 — Capture Tab Bar

```bash
adb logcat -c
# Ensure app is on the main dashboard tab
adb shell screencap -p /sdcard/screen.png && adb pull /sdcard/screen.png tab_bar_reference.png
```

### Step 5.3 — Measure Coordinates

Open `tab_bar_reference.png` and measure the pixel coordinates of each tab icon center.

The tab bar is at the bottom of the screen. There are 5 tabs in this order (left to right):
1. Dashboard
2. Fitness
3. Nutrition
4. Goals
5. Profile

Document these coordinates before proceeding:

```
TAB COORDINATES (fill in after measurement):
Dashboard tab:  X=___  Y=___
Fitness tab:    X=___  Y=___
Nutrition tab:  X=___  Y=___
Goals tab:      X=___  Y=___
Profile tab:    X=___  Y=___
```

Use these coordinates for ALL subsequent tab navigation. Do not guess. Do not use approximate values from similar devices.

### Step 5.4 — Verify Tab Navigation

Tap each tab, take a screenshot, confirm the correct screen loads. Fix any tab navigation failures before proceeding.

---

## SECTION 6: PER-SCREEN TESTING LOOP

For EVERY screen in Section 7's checklist, execute this complete loop. Do not abbreviate. Do not skip steps.

### Step A — Navigate to Screen

Document the exact navigation path:
- Which tab to tap
- Which button/menu item leads to this screen
- Which ADB commands to execute

Navigate there now.

### Step B — ADB Capture Sequence

```bash
# 1. Clear logcat
adb logcat -c

# 2. [Navigate to the screen using ADB tap commands]

# 3. Wait 2.5 seconds for screen to fully render

# 4. Take screenshot
adb shell screencap -p /sdcard/screen.png && adb pull /sdcard/screen.png [screen-name].png

# 5. Capture logcat
adb logcat -d ReactNativeJS:V JS:E *:S 2>&1 | tail -30
```

### Step C — 17 Structural Checks

Run EACH check. Record PASS or FAIL with specific detail.

**Check 1 — Crash-Free Render**
Logcat shows no JS errors. Screenshot shows a rendered screen (not blank/white). The app has not restarted.

**Check 2 — Header / Title Correct**
The screen header or title text matches what is expected for this screen. No generic "Screen" or placeholder title.

**Check 3 — Loading Skeleton (not blank)**
If data is async: while loading, the screen shows skeleton placeholders with the app's dark theme (background #0C0A15), not a blank white or black screen.

**Check 4 — Real Supabase Data**
Logcat shows network activity. Data displayed reflects real database content, not hardcoded mock arrays. (If no data exists for this user yet: check 5 covers empty state.)

**Check 5 — Branded Empty State**
If no data exists: the empty state shows a branded illustration or icon, an explanatory message, and a purple CTA button (#A855F7). It does NOT show a blank screen, a generic "No data" text, or a React Native default empty state.

**Check 6 — Error State: Toast + Retry**
Trigger an error by briefly enabling airplane mode, navigating to the screen, then disabling airplane mode. The screen must show a toast or inline error message AND a retry button. It must not crash or show a blank screen.
```bash
# Enable airplane mode
adb shell settings put global airplane_mode_on 1 && adb shell am broadcast -a android.intent.action.AIRPLANE_MODE
# Navigate to screen
# Wait 2 seconds
# Take screenshot — confirm error state
adb shell screencap -p /sdcard/screen.png && adb pull /sdcard/screen.png [screen-name]-error.png
# Restore network
adb shell settings put global airplane_mode_on 0 && adb shell am broadcast -a android.intent.action.AIRPLANE_MODE
```

**Check 7 — Button Visibility and Touch Targets**
All interactive elements are fully visible (not clipped, not off-screen). All touch targets are at minimum 44×44 points. No button is hidden behind the tab bar or keyboard.

**Check 8 — Press Feedback**
Tap a button. It shows ripple effect (Android default) or opacity change (0.7 or lower). No button feels dead or unresponsive.

**Check 9 — All Actions Work**
Test every visible button, toggle, and interactive element. Each one either:
- Navigates to the correct screen
- Performs its labeled action (save, delete, start, stop, etc.)
- Shows a loading state while processing
- Completes with a success confirmation

No button may do nothing. No button may navigate to a wrong screen.

**Check 10 — Back Navigation**
Press the device back button (`adb shell input keyevent 4`). App navigates to the correct previous screen. Does not crash. Does not navigate to an unexpected screen.

**Check 11 — Pull to Refresh**
For screens with data lists: swipe down from the content area top:
```bash
adb shell input swipe 540 400 540 900 300
```
Screen shows a refresh indicator and reloads data. Does not crash.

**Check 12 — Dark Mode Rendering**
Background is #0C0A15 (very dark purple-black). Text is readable (white or light gray). No white backgrounds visible on content cards unless intentional for a specific UI element. No unreadable contrast combinations.

**Check 13 — Brand Colors Correct**
Primary accent color is #A855F7 (purple). CTAs, highlights, active states, and progress indicators use purple variants.
FAIL if: primary actions use #0243D5, #3B82F6, or #1A56DB (these are Construktr blue — wrong app).

**Check 14 — No Placeholder Text Visible**
Screen contains no text such as: "TODO", "Coming Soon", "Placeholder", "Lorem ipsum", "STUB", "Mock", "Test data", "Sample", "Replace me", "Fix me", "Hardcoded".

**Check 15 — No Hardcoded Mock Data**
Data on screen reflects actual user account data. Lists are not populated with hardcoded fake names, numbers, or entries that would never change regardless of user.

**Check 16 — Network Calls in Logcat**
Logcat shows at least one fetch/network call on screen load (for data-driven screens). Screens that are purely local (settings, about, static content) are exempt.

**Check 17 — AI Features Wired (where applicable)**
For screens with AI features: logcat shows a call to a Supabase Edge Function (search for `functions/` in logcat). AI loading states are visible during processing. Results display as actionable content, not raw JSON.

---

### Step D — Deep Interaction Checks

Apply the relevant sub-checks based on screen type:

#### D1 — Form Screens (login, register, onboarding steps, add-food, edit-profile, challenge-builder, etc.)

```bash
# Test 1: Empty form submission
# Tap the submit/continue button without filling any fields
adb shell input tap [submit_button_X] [submit_button_Y]
# Take screenshot — must show validation errors, not crash
adb shell screencap -p /sdcard/screen.png && adb pull /sdcard/screen.png [screen]-empty-validation.png
adb logcat -d ReactNativeJS:V JS:E *:S 2>&1 | tail -20
```

- Validation errors appear inline below each invalid field (not just a crash or alert)
- Error messages are human-readable, not technical (e.g., "Email is required", not "value.length > 0 failed")

```bash
# Test 2: Keyboard avoidance
# Tap an input field
adb shell input tap [input_X] [input_Y]
# Take screenshot — the input must not be hidden behind the keyboard
adb shell screencap -p /sdcard/screen.png && adb pull /sdcard/screen.png [screen]-keyboard.png
```

- Input field is visible above the keyboard
- Submit button is accessible while keyboard is open (scrollable or repositioned)

```bash
# Test 3: Keyboard dismiss
# With keyboard open, tap outside the input or tap the "Done" keyboard button
adb shell input keyevent 111  # ESC / dismiss
# OR tap outside the input area
adb shell input tap 540 200
# Verify keyboard is dismissed
adb shell screencap -p /sdcard/screen.png && adb pull /sdcard/screen.png [screen]-keyboard-dismissed.png
```

#### D2 — List Screens (exercises, saved-meals, habits, transactions, etc.)

```bash
# Test 1: Scroll performance
adb shell input swipe 540 1400 540 600 300
adb shell input swipe 540 1400 540 600 300
adb shell input swipe 540 1400 540 600 300
# Take screenshot at scroll position
adb shell screencap -p /sdcard/screen.png && adb pull /sdcard/screen.png [screen]-scrolled.png
```

- No visual artifacts, no item duplication, no layout breaks while scrolling

```bash
# Test 2: Search (if search bar present)
# Tap search input
adb shell input tap [search_X] [search_Y]
# Type a search term
adb shell input text "test"
# Wait 1 second
# Take screenshot
adb shell screencap -p /sdcard/screen.png && adb pull /sdcard/screen.png [screen]-search.png
```

- Results filter correctly
- Empty search results show a branded "No results" state (not blank)

```bash
# Test 3: Empty filter state
# Type a search term that will return no results
adb shell input text "zzzzzznotfound"
adb shell screencap -p /sdcard/screen.png && adb pull /sdcard/screen.png [screen]-no-results.png
```

#### D3 — AI Vision Screens (meal-camera, form-check, posture-check, supplement-scanner, menu-scanner, labs/upload)

```bash
# Test 1: Camera permission and open
# Tap the camera button
adb shell input tap [camera_button_X] [camera_button_Y]
# Take screenshot
adb shell screencap -p /sdcard/screen.png && adb pull /sdcard/screen.png [screen]-camera.png
```

- Camera viewfinder opens OR permission dialog appears
- No crash on camera open

```bash
# Test 2: Loading state (use a pre-captured image if camera is mocked)
# After triggering analysis:
adb logcat -d ReactNativeJS:V JS:E *:S 2>&1 | tail -20
```

- Loading message visible ("Analyzing...", "Processing...", or similar)
- Supabase Edge Function call visible in logcat

```bash
# Test 3: Result display
adb shell screencap -p /sdcard/screen.png && adb pull /sdcard/screen.png [screen]-result.png
```

- Results display as actionable cards, not raw JSON or error text
- Accept/save/dismiss actions are present and functional

#### D4 — Modal/Sheet Screens (chat, upgrade, goal-cinema, daily-briefing, weekly-review)

```bash
# Test 1: Dismiss by swipe
adb shell input swipe 540 900 540 1600 200
adb shell screencap -p /sdcard/screen.png && adb pull /sdcard/screen.png [screen]-dismissed.png
```

- Modal dismisses correctly and returns to the correct underlying screen

```bash
# Test 2: Dismiss by X button (if present)
# Navigate back to modal
# Tap X button
adb shell input tap [close_button_X] [close_button_Y]
adb shell screencap -p /sdcard/screen.png && adb pull /sdcard/screen.png [screen]-x-dismissed.png
```

```bash
# Test 3: Content scroll (for long modals)
adb shell input swipe 540 1200 540 600 300
adb shell screencap -p /sdcard/screen.png && adb pull /sdcard/screen.png [screen]-modal-scrolled.png
```

- Content scrollable if longer than viewport
- No content clipped at bottom

---

### Step E — Fix Protocol

If ANY check fails:

1. **Read the relevant file completely** — do not edit without reading the entire file first
2. **Identify the minimal surgical fix** — change only what is broken, nothing more
3. **Apply the fix** — additive only where possible
4. **Run TypeScript check:**
   ```bash
   cd C:\dev\transformr\apps\mobile && npx tsc --noEmit --pretty
   ```
   Zero new errors permitted.
5. **Verify on emulator:**
   ```bash
   adb logcat -c
   # Navigate to screen
   adb shell screencap -p /sdcard/screen.png && adb pull /sdcard/screen.png [screen]-fixed.png
   adb logcat -d ReactNativeJS:V JS:E *:S 2>&1 | tail -20
   ```
6. **Commit:**
   ```bash
   git add [changed files]
   git commit -m "fix([screen-name]): [specific description of what was fixed]"
   ```
   Use conventional commits. Be specific. "fix(nutrition/add-food): empty state not showing branded CTA" is good. "fix: various fixes" is not acceptable.

### Step F — Record Result

After completing the full loop for a screen, record one of these three outcomes:

- **PASS** — All 17 structural checks green, all applicable deep interaction checks green.
- **FAIL → FIXED** — One or more checks failed; fix was applied; all checks now green. Document what was broken and what was changed.
- **FAIL → BLOCKED** — Check failed; fix requires something outside agent scope (App Store credentials, real payment keys, physical device hardware, Tyson's decision). Document exactly what is blocked and why.

---

## SECTION 7: COMPLETE SCREEN CHECKLIST

Execute Section 6's full loop for every screen below. Check off each screen as it is completed.

---

### AUTH GROUP (13 screens)

**1. login.tsx**
- Path: `apps/mobile/app/(auth)/login.tsx`
- Navigate: App launches here if user is not authenticated
- Key checks: Email/password inputs, Google OAuth button, "Forgot password" link, "Register" link, form validation, Supabase auth call in logcat

**2. register.tsx**
- Path: `apps/mobile/app/(auth)/register.tsx`
- Navigate: Tap "Register" or "Sign Up" on login screen
- Key checks: Email/password/confirm inputs, terms acceptance, Google OAuth, Supabase auth call in logcat, success navigates to onboarding

**3. forgot-password.tsx**
- Path: `apps/mobile/app/(auth)/forgot-password.tsx`
- Navigate: Tap "Forgot password" on login screen
- Key checks: Email input, submit sends Supabase password reset email, success confirmation message, back navigation

**4. callback.tsx**
- Path: `apps/mobile/app/(auth)/callback.tsx`
- Navigate: Deep link target for OAuth (test by observing URL scheme handling)
- Key checks: No crash on load, handles auth token from URL params, navigates correctly after processing

**5. onboarding/welcome.tsx**
- Path: `apps/mobile/app/(auth)/onboarding/welcome.tsx`
- Navigate: After successful registration → redirected here
- Key checks: Brand logo/name visible, compelling hero copy, "Get Started" CTA button, animated entrance preferred

**6. onboarding/profile.tsx**
- Path: `apps/mobile/app/(auth)/onboarding/profile.tsx`
- Navigate: "Get Started" from welcome step
- Key checks: Name, age, gender inputs; profile photo option; progress indicator; validation before advancing

**7. onboarding/goals.tsx**
- Path: `apps/mobile/app/(auth)/onboarding/goals.tsx`
- Navigate: Continue from profile step
- Key checks: Goal selection (multi-select), at least 7 goal categories matching TRANSFORMR pillars, visual selection state (purple highlight), continue requires selection

**8. onboarding/fitness.tsx**
- Path: `apps/mobile/app/(auth)/onboarding/fitness.tsx`
- Navigate: Continue from goals step
- Key checks: Fitness level selection, workout frequency, equipment access; selections save correctly

**9. onboarding/notifications.tsx**
- Path: `apps/mobile/app/(auth)/onboarding/notifications.tsx`
- Navigate: Continue from fitness step
- Key checks: Notification permission request fires, enable/skip options, selection persists

**10. onboarding/nutrition.tsx**
- Path: `apps/mobile/app/(auth)/onboarding/nutrition.tsx`
- Navigate: Continue from notifications step
- Key checks: Dietary preferences, caloric goals, macro split; inputs save; calculations appear correct

**11. onboarding/business.tsx**
- Path: `apps/mobile/app/(auth)/onboarding/business.tsx`
- Navigate: Continue from nutrition step
- Key checks: Business/income goals optional step, skip option visible, revenue targets save

**12. onboarding/partner.tsx**
- Path: `apps/mobile/app/(auth)/onboarding/partner.tsx`
- Navigate: Continue from business step
- Key checks: Partner invite option, skip option, invite link generation or email input

**13. onboarding/ready.tsx**
- Path: `apps/mobile/app/(auth)/onboarding/ready.tsx`
- Navigate: Final onboarding step
- Key checks: Summary of selected goals, "Launch TRANSFORMR" CTA, navigates to dashboard on confirm, onboarding data persisted to Supabase (logcat)

---

### TOP-LEVEL MODALS AND UTILITY SCREENS (9 screens)

**14. index.tsx**
- Path: `apps/mobile/app/index.tsx`
- Navigate: App entry point — handles routing logic
- Key checks: Correctly routes authenticated users to dashboard, unauthenticated users to login; no flash of wrong screen; no crash

**15. chat.tsx**
- Path: `apps/mobile/app/chat.tsx`
- Navigate: FAB button (floating action button) visible on all main tabs; tap it
- Key checks: Modal opens smoothly, message input works, send button fires Edge Function call (logcat), AI response appears in chat bubble, history persists, dismiss works

**16. chat-history.tsx**
- Path: `apps/mobile/app/chat-history.tsx`
- Navigate: From chat modal → history icon/button
- Key checks: Past conversations list, tap to resume conversation, empty state branded

**17. daily-briefing.tsx**
- Path: `apps/mobile/app/daily-briefing.tsx`
- Navigate: From dashboard → daily briefing card or notification
- Key checks: AI-generated briefing content, today's priorities, workout recommendation, nutrition summary, loads from Edge Function (logcat), dismiss returns to dashboard

**18. weekly-review.tsx**
- Path: `apps/mobile/app/weekly-review.tsx`
- Navigate: From dashboard or profile → weekly review
- Key checks: 7-day summary data, wins/losses, streak data, AI insights (Edge Function call in logcat), scroll through sections, action items

**19. upgrade.tsx**
- Path: `apps/mobile/app/upgrade.tsx`
- Navigate: From paywall triggers (locked features) or profile → upgrade
- Key checks: Subscription tiers displayed (Free/Pro/Elite), feature comparison, CTA buttons visible; if Stripe not configured → shows graceful "Payment coming soon" state (from Issue 3.1 fix); no crash

**20. trajectory.tsx**
- Path: `apps/mobile/app/trajectory.tsx`
- Navigate: From dashboard → trajectory card or goals → trajectory
- Key checks: Weight/goal projection chart, animated data visualization, AI-powered projection line (Edge Function call in logcat), timeframe selector works

**21. goal-cinema.tsx**
- Path: `apps/mobile/app/goal-cinema.tsx`
- Navigate: From goals tab or dashboard
- Key checks: Full-screen immersive goal visualization, real animations (from Issue 3.4 fix), goal images/text display, navigation between goals, motivational copy

**22. error.tsx**
- Path: `apps/mobile/app/error.tsx`
- Navigate: Triggered by unhandled navigation error or direct test
- Key checks: Branded error screen (not default React Native red box), helpful message, retry/home button, no raw stack trace visible to user

---

### DASHBOARD TAB (1 screen)

**23. dashboard.tsx**
- Path: `apps/mobile/app/(tabs)/dashboard.tsx`
- Navigate: Dashboard tab (leftmost tab)
- Key checks: Readiness score ring, daily briefing card, today's workout card, nutrition summary ring, streak counter, habit completion list, all widgets pull live data (logcat), pull-to-refresh works, FAB visible, scroll through all widgets

---

### FITNESS TAB (14 screens)

**24. fitness/index.tsx**
- Path: `apps/mobile/app/(tabs)/fitness/index.tsx`
- Navigate: Fitness tab
- Key checks: Today's workout card, weekly schedule, quick-start options, recent PRs, all cards navigate to correct sub-screens

**25. fitness/exercises.tsx**
- Path: `apps/mobile/app/(tabs)/fitness/exercises.tsx`
- Navigate: Fitness tab → Exercises library
- Key checks: Exercise list loads from Supabase, search works, filter by muscle group, each exercise navigates to detail, infinite scroll or pagination

**26. fitness/exercise-detail.tsx**
- Path: `apps/mobile/app/(tabs)/fitness/exercise-detail.tsx`
- Navigate: Fitness → Exercises → tap any exercise
- Key checks: Exercise name, muscle diagram or image, instructions, video link (if present), "Add to workout" button works, PR history displayed

**27. fitness/workout-player.tsx**
- Path: `apps/mobile/app/(tabs)/fitness/workout-player.tsx`
- Navigate: Fitness → Start workout
- Key checks: Exercise queue, set/rep counters, rest timer (animated countdown), "Log set" button works, progress bar, "Finish workout" navigates to summary; screen stays on during workout (no auto-dim timeout handling required but note if it dims)

**28. fitness/workout-summary.tsx**
- Path: `apps/mobile/app/(tabs)/fitness/workout-summary.tsx`
- Navigate: After completing workout in player
- Key checks: Volume summary (sets × reps × weight), duration, calories burned estimate, PR badges (if any), "Save" persists to Supabase (logcat), share option

**29. fitness/progress.tsx**
- Path: `apps/mobile/app/(tabs)/fitness/progress.tsx`
- Navigate: Fitness tab → Progress
- Key checks: Weight/strength charts, timeframe filter (1W/1M/3M/1Y), all chart data loads, PR records listed, body measurements section

**30. fitness/progress-photos.tsx**
- Path: `apps/mobile/app/(tabs)/fitness/progress-photos.tsx`
- Navigate: Fitness → Progress → Photos tab or dedicated link
- Key checks: Photo grid, add photo triggers camera/gallery, before/after comparison view, photos load from Supabase storage, empty state branded

**31. fitness/programs.tsx**
- Path: `apps/mobile/app/(tabs)/fitness/programs.tsx`
- Navigate: Fitness tab → Programs
- Key checks: Program list loads, active program highlighted, tap to view details, start/switch program works, AI-recommended program badge (if applicable)

**32. fitness/marketplace.tsx**
- Path: `apps/mobile/app/(tabs)/fitness/marketplace.tsx`
- Navigate: Fitness tab → Marketplace
- Key checks: Program/plan listings, filter by category, detail view on tap, purchase flow → if Stripe not configured shows graceful state

**33. fitness/form-check.tsx**
- Path: `apps/mobile/app/(tabs)/fitness/form-check.tsx`
- Navigate: Fitness tab → Form Check (AI)
- Key checks: Camera opens, analysis triggers Edge Function (logcat), results show form corrections as actionable bullets, save/dismiss works, loading state visible during AI call

**34. fitness/posture-check.tsx**
- Path: `apps/mobile/app/(tabs)/fitness/posture-check.tsx`
- Navigate: Fitness tab → Posture Check (AI)
- Key checks: Camera/photo upload, posture analysis via Edge Function (logcat), results show posture score + corrections, animated overlay on photo (if implemented)

**35. fitness/supplement-scanner.tsx**
- Path: `apps/mobile/app/(tabs)/fitness/supplement-scanner.tsx`
- Navigate: Fitness tab → Supplement Scanner (AI)
- Key checks: Camera targets supplement label, OCR + AI analysis via Edge Function (logcat), ingredient breakdown shows, safety/efficacy ratings display, save to profile works

**36. fitness/pain-tracker.tsx**
- Path: `apps/mobile/app/(tabs)/fitness/pain-tracker.tsx`
- Navigate: Fitness tab → Pain Tracker
- Key checks: Body map for pain location, severity slider, pain type selector, log entry saves to Supabase, history view, trend chart

**37. fitness/mobility.tsx**
- Path: `apps/mobile/app/(tabs)/fitness/mobility.tsx`
- Navigate: Fitness tab → Mobility
- Key checks: Mobility routine list, exercise cards with instructions, start routine launches player or guided flow, progress tracked

---

### NUTRITION TAB (11 screens)

**38. nutrition/index.tsx**
- Path: `apps/mobile/app/(tabs)/nutrition/index.tsx`
- Navigate: Nutrition tab
- Key checks: Macro rings (protein/carbs/fat/calories) show real today's data, meal log list for today, add meal FAB or button, streak, water tracking, all data from Supabase (logcat)

**39. nutrition/add-food.tsx**
- Path: `apps/mobile/app/(tabs)/nutrition/add-food.tsx`
- Navigate: Nutrition → Add Food (+ button)
- Key checks: Food search works (Supabase or food API in logcat), results list, tap to add opens macro entry, serving size selector, meal slot selector (breakfast/lunch/dinner/snack), save persists and updates macro rings

**40. nutrition/meal-camera.tsx**
- Path: `apps/mobile/app/(tabs)/nutrition/meal-camera.tsx`
- Navigate: Nutrition → Camera icon or "Scan Meal"
- Key checks: Camera opens, photo triggers AI analysis (Edge Function in logcat), recognized foods list with confidence, macros estimated, user can edit before saving, save persists to food log

**41. nutrition/barcode-scanner.tsx**
- Path: `apps/mobile/app/(tabs)/nutrition/barcode-scanner.tsx`
- Navigate: Nutrition → Add Food → Barcode icon
- Key checks: Camera viewfinder with barcode overlay, scan triggers food database lookup (logcat), product info displays, add to log works, manual entry fallback if scan fails

**42. nutrition/menu-scanner.tsx**
- Path: `apps/mobile/app/(tabs)/nutrition/menu-scanner.tsx`
- Navigate: Nutrition → Scan Menu (AI)
- Key checks: Camera or photo upload, menu text OCR + AI macro estimation (Edge Function in logcat), item list with macros, select multiple items, add to log works

**43. nutrition/saved-meals.tsx**
- Path: `apps/mobile/app/(tabs)/nutrition/saved-meals.tsx`
- Navigate: Nutrition → Saved Meals
- Key checks: List of user's saved meals, macro totals per meal, quick-add button logs entire meal, edit meal works, delete works, empty state branded

**44. nutrition/meal-prep.tsx**
- Path: `apps/mobile/app/(tabs)/nutrition/meal-prep.tsx`
- Navigate: Nutrition → Meal Prep (AI)
- Key checks: Weekly meal prep plan, AI generation via Edge Function (logcat), ingredient list per meal, grocery list export, macros per meal calculated, save plan works

**45. nutrition/meal-plans.tsx**
- Path: `apps/mobile/app/(tabs)/nutrition/meal-plans.tsx`
- Navigate: Nutrition → Meal Plans
- Key checks: Pre-built and AI plans listed, filter by goal (cut/bulk/maintain), tap to preview, activate plan populates meal log, macros match user targets

**46. nutrition/supplements.tsx**
- Path: `apps/mobile/app/(tabs)/nutrition/supplements.tsx`
- Navigate: Nutrition → Supplements
- Key checks: User's supplement stack list, add supplement works, timing reminders shown, scan supplement (links to supplement-scanner), delete works

**47. nutrition/grocery-list.tsx**
- Path: `apps/mobile/app/(tabs)/nutrition/grocery-list.tsx`
- Navigate: Nutrition → Grocery List (AI)
- Key checks: AI-generated list from meal plan (Edge Function in logcat), items categorized by store section, check off items, add custom item, clear completed, share/export list

**48. nutrition/analytics.tsx**
- Path: `apps/mobile/app/(tabs)/nutrition/analytics.tsx`
- Navigate: Nutrition → Analytics
- Key checks: Macro trend charts (weekly/monthly), calorie vs. target line, protein/carb/fat breakdown pie, weight correlation chart, all data from Supabase (logcat)

---

### GOALS TAB (28 screens)

**49. goals/index.tsx**
- Path: `apps/mobile/app/(tabs)/goals/index.tsx`
- Navigate: Goals tab
- Key checks: Active goals list with progress bars, habit streak summary, mood check-in prompt, sleep summary, quick links to sub-sections, all data live from Supabase

**50. goals/[id].tsx**
- Path: `apps/mobile/app/(tabs)/goals/[id].tsx`
- Navigate: Goals → tap any goal card
- Key checks: Goal title, description, progress visualization, milestone list, habit connections, AI insight (Edge Function), edit goal works, delete with confirmation, check-in button

**51. goals/habits.tsx**
- Path: `apps/mobile/app/(tabs)/goals/habits.tsx`
- Navigate: Goals tab → Habits
- Key checks: Today's habit list, check-off works and updates streak, habit detail on tap, add habit works, streak visualization, calendar heat map

**52. goals/mood.tsx**
- Path: `apps/mobile/app/(tabs)/goals/mood.tsx`
- Navigate: Goals tab → Mood
- Key checks: Mood selector (emoji or scale), note input, submit logs to Supabase, mood history chart, AI pattern insight (if applicable)

**53. goals/journal.tsx**
- Path: `apps/mobile/app/(tabs)/goals/journal.tsx`
- Navigate: Goals tab → Journal
- Key checks: New entry button, rich text or multi-line input, AI reflection prompt visible, save works, entry history list, tap entry to read/edit

**54. goals/sleep.tsx**
- Path: `apps/mobile/app/(tabs)/goals/sleep.tsx`
- Navigate: Goals tab → Sleep
- Key checks: Sleep log entry (bedtime/wake time), quality rating, duration calculated, chart of sleep history, wearable data shown if connected, average sleep stats

**55. goals/skills.tsx**
- Path: `apps/mobile/app/(tabs)/goals/skills.tsx`
- Navigate: Goals tab → Skills
- Key checks: Skill categories list, progress levels, add new skill works, practice log, resources linked, milestone completion

**56. goals/affirmations.tsx**
- Path: `apps/mobile/app/(tabs)/goals/affirmations.tsx`
- Navigate: Goals tab → Affirmations (AI)
- Key checks: AI-generated affirmations (Edge Function in logcat), personalized to user goals, favorite/save works, daily affirmation card, voice playback (or graceful fallback if voice unavailable)

**57. goals/vision-board.tsx**
- Path: `apps/mobile/app/(tabs)/goals/vision-board.tsx`
- Navigate: Goals tab → Vision Board
- Key checks: Grid of vision board items, add image from gallery works, add text overlay works, full-screen view, items persist to Supabase storage, inspirational layout

**58. goals/health-roi.tsx**
- Path: `apps/mobile/app/(tabs)/goals/health-roi.tsx`
- Navigate: Goals tab → Health ROI (AI)
- Key checks: Financial value of health improvements calculated (Edge Function in logcat), charts showing ROI over time, inputs for current health stats, "worth" of habits quantified

**59. goals/insights.tsx**
- Path: `apps/mobile/app/(tabs)/goals/insights.tsx`
- Navigate: Goals tab → Insights (AI)
- Key checks: AI-generated insights from cross-pillar data (Edge Function in logcat), insight cards with actionable recommendations, dismiss/save insight, refresh generates new insights

**60. goals/focus-mode.tsx**
- Path: `apps/mobile/app/(tabs)/goals/focus-mode.tsx`
- Navigate: Goals tab → Focus Mode
- Key checks: Timer (Pomodoro or custom), start/pause/reset works, session counter, task input, ambient background, session history, end session saves to Supabase

**61. goals/challenges.tsx**
- Path: `apps/mobile/app/(tabs)/goals/challenges.tsx`
- Navigate: Goals tab → Challenges
- Key checks: Active challenges list, available challenges browse, join challenge works, progress bars, leaderboard (if social), create challenge button

**62. goals/challenge-active.tsx**
- Path: `apps/mobile/app/(tabs)/goals/challenge-active.tsx`
- Navigate: Goals → Challenges → tap an active challenge
- Key checks: Challenge details, daily check-in works, progress visualization, participant list (if social), prize/stake display, abandon with confirmation

**63. goals/challenge-builder.tsx**
- Path: `apps/mobile/app/(tabs)/goals/challenge-builder.tsx`
- Navigate: Goals → Challenges → Create Challenge
- Key checks: All form fields (name, duration, goal type, metrics, stake), validation, preview, publish saves to Supabase, back without save prompts confirmation

**64. goals/challenge-detail.tsx**
- Path: `apps/mobile/app/(tabs)/goals/challenge-detail.tsx`
- Navigate: Goals → Challenges → browse → tap a challenge
- Key checks: Full challenge details, participant count, rules, join button works, creator info, metrics explained

**65. goals/community.tsx**
- Path: `apps/mobile/app/(tabs)/goals/community.tsx`
- Navigate: Goals tab → Community
- Key checks: Feed of community activity, like/react works (logcat shows Supabase call), post button, filter by pillar, profile taps navigate to profile view

**66. goals/stake-goals.tsx**
- Path: `apps/mobile/app/(tabs)/goals/stake-goals.tsx`
- Navigate: Goals tab → Stake Goals
- Key checks: Goal + financial stake pairing, stake amount input, accountability partner assignment, completion terms, if Stripe not configured → graceful state (from Issue 3.1 fix)

**67. goals/retrospective.tsx**
- Path: `apps/mobile/app/(tabs)/goals/retrospective.tsx`
- Navigate: Goals tab → Retrospective (AI)
- Key checks: AI-generated weekly/monthly retrospective (Edge Function in logcat), wins/losses/lessons, next period planning, save retrospective, history of past retrospectives

**68. goals/business/index.tsx**
- Path: `apps/mobile/app/(tabs)/goals/business/index.tsx`
- Navigate: Goals tab → Business section
- Key checks: Business overview, revenue chart, milestone progress, customer count, quick links to sub-screens, all data live

**69. goals/business/revenue.tsx**
- Path: `apps/mobile/app/(tabs)/goals/business/revenue.tsx`
- Navigate: Goals → Business → Revenue
- Key checks: Revenue chart (monthly/annual), target vs. actual line, log new revenue works, revenue projections (calculation correct), breakdown by source

**70. goals/business/milestones.tsx**
- Path: `apps/mobile/app/(tabs)/goals/business/milestones.tsx`
- Navigate: Goals → Business → Milestones
- Key checks: Milestone list with completion status, add milestone works, mark complete celebrates (animation), archive works, progress toward next milestone

**71. goals/business/customers.tsx**
- Path: `apps/mobile/app/(tabs)/goals/business/customers.tsx`
- Navigate: Goals → Business → Customers
- Key checks: Customer count tracker, log new customer works, total ARR/MRR calculated, customer acquisition trend chart, churn rate (if tracked)

**72. goals/finance/index.tsx**
- Path: `apps/mobile/app/(tabs)/goals/finance/index.tsx`
- Navigate: Goals tab → Finance section
- Key checks: Net worth summary, income vs. expenses chart, savings rate, budget overview, quick links to sub-screens

**73. goals/finance/transactions.tsx**
- Path: `apps/mobile/app/(tabs)/goals/finance/transactions.tsx`
- Navigate: Goals → Finance → Transactions
- Key checks: Transaction list loads, filter by category/date, add transaction works, categorization, search, running balance

**74. goals/finance/budgets.tsx**
- Path: `apps/mobile/app/(tabs)/goals/finance/budgets.tsx`
- Navigate: Goals → Finance → Budgets
- Key checks: Budget categories list, spending vs. budget bars, over-budget warning state (red indicator), add/edit budget works, monthly reset logic

**75. goals/finance/net-worth.tsx**
- Path: `apps/mobile/app/(tabs)/goals/finance/net-worth.tsx`
- Navigate: Goals → Finance → Net Worth
- Key checks: Assets and liabilities lists, total net worth calculation, add asset/liability works, net worth trend chart, milestone markers on chart

---

### PROFILE TAB (11 screens)

**76. profile/index.tsx**
- Path: `apps/mobile/app/(tabs)/profile/index.tsx`
- Navigate: Profile tab (rightmost tab)
- Key checks: User avatar, name, membership tier, stats summary (streak, workouts, goals), settings links, upgrade CTA (if free tier), all data live from Supabase

**77. profile/about.tsx**
- Path: `apps/mobile/app/(tabs)/profile/about.tsx`
- Navigate: Profile → About
- Key checks: App version, legal links (privacy policy, terms), team info, no placeholder links (all links navigate or open browser), licenses section

**78. profile/edit-profile.tsx**
- Path: `apps/mobile/app/(tabs)/profile/edit-profile.tsx`
- Navigate: Profile → Edit Profile
- Key checks: All profile fields editable, photo change works (camera/gallery), save updates Supabase (logcat), validation on required fields, cancel returns without saving changes

**79. profile/achievements.tsx**
- Path: `apps/mobile/app/(tabs)/profile/achievements.tsx`
- Navigate: Profile → Achievements
- Key checks: Achievement badges grid, earned vs. locked states, tap for detail/criteria, progress toward next achievement, share achievement works

**80. profile/integrations.tsx**
- Path: `apps/mobile/app/(tabs)/profile/integrations.tsx`
- Navigate: Profile → Integrations
- Key checks: Integration list (Apple Health, Google Fit, Spotify, Strava, etc.), connect/disconnect per integration, Spotify graceful fallback (from Issue 3.2 fix), status indicator (connected/disconnected)

**81. profile/wearables.tsx**
- Path: `apps/mobile/app/(tabs)/profile/wearables.tsx`
- Navigate: Profile → Wearables
- Key checks: Supported wearables list, pair device flow, connected device shows data, sync button triggers data pull (logcat), disconnect works

**82. profile/nfc-setup.tsx**
- Path: `apps/mobile/app/(tabs)/profile/nfc-setup.tsx`
- Navigate: Profile → NFC Setup
- Key checks: NFC availability check, setup instructions, write NFC tag flow, test NFC tag works, graceful state if device doesn't support NFC

**83. profile/notifications-settings.tsx**
- Path: `apps/mobile/app/(tabs)/profile/notifications-settings.tsx`
- Navigate: Profile → Notification Settings
- Key checks: Notification categories list (workout reminders, meal reminders, habit nudges, etc.), toggle per category, time-of-day pickers for each, save persists to Supabase (logcat)

**84. profile/dashboard-builder.tsx**
- Path: `apps/mobile/app/(tabs)/profile/dashboard-builder.tsx`
- Navigate: Profile → Dashboard Builder
- Key checks: Widget library, drag-and-drop or reorder widgets, toggle widget visibility, save layout persists (logcat), preview mode, reset to default works

**85. profile/data-export.tsx**
- Path: `apps/mobile/app/(tabs)/profile/data-export.tsx`
- Navigate: Profile → Data Export
- Key checks: Export format options (CSV, JSON), data category selection, export triggers file generation, share sheet opens, download confirmation, GDPR compliance language

**86. profile/partner.tsx**
- Path: `apps/mobile/app/(tabs)/profile/partner.tsx`
- Navigate: Profile → Partner
- Key checks: Partner status (linked/unlinked), invite partner flow, partner's stats summary (if linked), linked partner actions, unlink with confirmation

---

### LABS STACK (3 screens)

**87. labs/index.tsx**
- Path: `apps/mobile/app/labs/index.tsx`
- Navigate: From profile or dashboard → Labs section
- Key checks: Labs overview, past lab results list, upload new labs button, all buttons navigate correctly (from Issue 3.5 fix), empty state branded

**88. labs/upload.tsx**
- Path: `apps/mobile/app/labs/upload.tsx`
- Navigate: Labs → Upload (AI vision)
- Key checks: Camera or document picker opens, file upload triggers AI analysis (Edge Function in logcat), progress indicator during processing, success navigates to detail, error state with retry

**89. labs/detail.tsx**
- Path: `apps/mobile/app/labs/detail.tsx`
- Navigate: Labs → tap a past result
- Key checks: Lab panel results display, reference range indicators (normal/abnormal), AI interpretation (Edge Function in logcat), trend over time (if multiple results), share/export works, recommendations shown

---

### PARTNER STACK (4 screens)

**90. partner/dashboard.tsx**
- Path: `apps/mobile/app/partner/dashboard.tsx`
- Navigate: From profile/partner or partner tab (if present)
- Key checks: Partner's stats overview, shared goals, activity feed, message button, all data live from Supabase

**91. partner/challenges.tsx**
- Path: `apps/mobile/app/partner/challenges.tsx`
- Navigate: Partner → Challenges
- Key checks: Shared challenges list, head-to-head progress, create new shared challenge, join partner's challenge, leaderboard between the two

**92. partner/live-workout.tsx**
- Path: `apps/mobile/app/partner/live-workout.tsx`
- Navigate: Partner → Live Workout
- Key checks: Start/join live session, real-time sync indicators, shared exercise log, motivational prompts, end session works, summary shows both users' stats

**93. partner/nudge.tsx**
- Path: `apps/mobile/app/partner/nudge.tsx`
- Navigate: Partner → Send Nudge
- Key checks: Nudge type selector (motivational, check-in, challenge), custom message option, send triggers push notification to partner (logcat shows Supabase call), delivery confirmation

---

## SECTION 8: QUALITY GATE

Run this after ALL screens have been tested and all fixes applied.

```bash
cd C:\dev\transformr\apps\mobile
npx tsc --noEmit --pretty
```

**Required output: 0 errors.**

If any errors remain:
1. Read each erroring file completely
2. Fix each error individually
3. Do not suppress errors with `// @ts-ignore` or `any` casts
4. Re-run until zero errors
5. Commit: `fix(types): resolve remaining TypeScript errors post-screen-verification`

---

## SECTION 9: FINAL COMMIT AND REPORT

### Final Commit

After all screens pass and TypeScript is clean:

```bash
cd C:\dev\transformr
git status
git add -p  # Review each change before staging
git commit -m "qa: screen-by-screen verification complete — all 93 screens verified and fixed"
```

Do NOT push to remote unless Tyson explicitly asks.

### Summary Report Template

Output this report exactly at completion:

```
SCREEN-BY-SCREEN VERIFICATION REPORT
=====================================
Date: [timestamp]
Branch: dev
Commit: [git rev-parse --short HEAD]
Total screens tested: [N]/93

RESULTS:
  PASS:           [N]
  FAIL → FIXED:   [N]
  FAIL → BLOCKED: [N]

PASS LIST:
  [list each passing screen by number and name]

FIXED LIST:
  [screen number] [screen name]: [what was broken] → [what was changed] → [commit hash]

BLOCKED LIST:
  [screen number] [screen name]: [exact reason it cannot be fixed without Tyson]

KNOWN ISSUES RESOLVED:
  [ ] 3.1 Stripe graceful fallback
  [ ] 3.2 Spotify graceful fallback
  [ ] 3.3 OpenWeatherMap graceful fallback
  [ ] 3.4 Goal Cinema animations
  [ ] 3.5 Labs section interactions
  [ ] 3.6 Voice degradation

GOVERNANCE FILES:
  [ ] SOUL.md — created / already existed
  [ ] CONFIGURATION_LOCK.md — created / already existed

TYPESCRIPT: [N errors] (must be 0)

COMMITS MADE: [N]
  [list each commit hash and message]

MANUAL ACTIONS REQUIRED FOR TYSON:
  - [anything requiring App Store Connect credentials]
  - [anything requiring real payment keys for Stripe]
  - [anything requiring a physical iOS device for camera/NFC/biometrics testing]
  - [anything requiring external service API keys not in .env]
  - [any design decision requiring product owner input]
  - [any EAS build or deployment action]
```

---

## APPENDIX A: BRAND COLOR REFERENCE

```
Primary purple:     #A855F7   — CTAs, highlights, active tab, progress fills
Secondary purple:   #7E22CE   — Gradients, borders, secondary actions
Light accent:       #C084FC   — Text accents, icon fills, subtle highlights
Background:         #0C0A15   — All screen backgrounds
Card glass:         rgba(22,18,42,0.88) — Card backgrounds
Purple glow:        rgba(168,85,247,0.25) — Shadow/glow effects

FORBIDDEN AS PRIMARY COLOR (wrong app palette):
  #0243D5 — Construktr blue
  #3B82F6 — Tailwind blue-500
  #1A56DB — Construktr dark blue
```

## APPENDIX B: SUPABASE EDGE FUNCTION VERIFICATION

When checking AI features, look for these patterns in logcat:
```
ReactNativeJS: fetch https://[project-ref].supabase.co/functions/v1/[function-name]
ReactNativeJS: POST /functions/v1/
```

If an AI screen makes no Edge Function call, the AI feature is either stubbed or broken. Fix it.

## APPENDIX C: COMMON FIX PATTERNS

**Blank loading screen (skeleton missing):**
Read the screen file. Find the loading state condition. Add a `<ScreenSkeleton />` or inline skeleton using the app's existing skeleton component. Search for existing skeleton usage:
```bash
grep -r "Skeleton\|skeleton" C:\dev\transformr\apps\mobile\components --include="*.tsx" -l
```

**Empty state not branded:**
Find the empty state condition in the screen. Replace `<Text>No data</Text>` or `null` with a proper empty state that includes:
- An icon (Ionicons, purple tinted)
- A descriptive message
- A purple CTA button (`#A855F7`)

**Button does nothing:**
Find the `onPress` handler. If it's `() => {}`, `console.log(...)`, or missing: implement the correct navigation or action. Read the screen file to understand intent.

**Wrong colors:**
Search the file for the forbidden hex values and replace with correct theme tokens or `#A855F7` variants.

**TypeScript error — implicit any:**
Add explicit types. Never use `any`. Check the related type files in `types/` directory.

**Crash on navigation:**
Check that the target route exists. Search for the route file. If it exists, check that all required params are passed. If it's missing, the screen needs to be created.
