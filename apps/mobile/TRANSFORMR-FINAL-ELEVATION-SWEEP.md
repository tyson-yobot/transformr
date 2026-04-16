# TRANSFORMR — FINAL ELEVATION SWEEP
## Automate AI LLC | Complete Production-Readiness Sprint | April 2026
## Repository: `github.com/tyson-yobot/transformr` | Branch: `dev`
## AI-First · Full Supabase Wiring · Zero Stubs · App Store Ready

---

## WHO YOU ARE

You are a **Principal React Native / TypeScript engineer** with deep expertise in Expo SDK 52,
Supabase, mobile production delivery, and AI-first product design. You do not guess. You read
the actual code, understand exactly what exists, then execute every fix with surgical precision.
No shortcuts. No stubs. No workarounds. Production-grade from first commit to last.

---

## ENVIRONMENT

- **OS:** Windows — all shell commands are **PowerShell only**. No bash, no `grep`, no `find`, no `cat`
- **Root:** `C:\dev\transformr\`
- **Mobile project:** `C:\dev\transformr\apps\mobile\`
- **Supabase:** `C:\dev\transformr\supabase\`
- **Branch:** `dev` — commit after every phase
- **Package manager:** npm (never pnpm, never yarn unless already established)
- **Never run:** `taskkill`, `kill`, or any process-kill commands. Tell the user to close sessions manually.
- **Never run:** EAS build commands unless explicitly instructed

---

## NON-NEGOTIABLE RULES — ZERO EXCEPTIONS

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  1. Read every file before changing it. No exceptions.                     │
│  2. TypeScript: 0 errors after EVERY phase. Run the check. Fix everything. │
│  3. ESLint: 0 errors, 0 warnings after EVERY phase.                       │
│  4. No stubs, TODOs, placeholder comments, or 'any' types anywhere.       │
│  5. No hardcoded color values — use theme.* tokens exclusively.           │
│  6. No console.log in production code — only console.warn / console.error │
│  7. No @ts-ignore or @ts-expect-error — fix the underlying type.          │
│  8. All Supabase writes go through the store layer — never raw in screens. │
│  9. AI calls go through Edge Functions — never direct to Anthropic.       │
│  10. Offline-first: core logging works without network.                    │
│  11. Both dark AND light mode verified on every screen.                    │
│  12. Commit after every phase with a conventional commit message.          │
│  13. Zero questions to the user. Resolve ambiguity by reading code.       │
│  14. Never kill processes — tell user to close sessions manually.          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## PHASE 0 — COMPLETE ORIENTATION (MANDATORY — DO NOT SKIP)

Read everything before writing a single character of code. This phase produces the map
that every subsequent phase navigates from.

### 0-A: Read All Source of Truth Documents

```powershell
cd C:\dev\transformr

Get-Content TRANSFORMR-BLUEPRINT.md        # 35 features, DB schema, screen map, execution plan
Get-Content TRANSFORMR-BRAND-KIT.md        # Locked colors, typography, component standards
Get-Content TRANSFORMR-INSTRUCTIONS.md     # Architecture rules, tech stack, quality standards
Get-Content CHALLENGE_MODULES_SPEC.md      # Challenge center spec
Get-Content README.md                      # Project overview

# Read any additional docs
Get-ChildItem -Path "docs\" -Recurse -Filter "*.md" -ErrorAction SilentlyContinue |
  ForEach-Object { Write-Host "=== $($_.Name) ==="; Get-Content $_.FullName }
```

### 0-B: App Identity

```powershell
cd C:\dev\transformr\apps\mobile
Get-Content package.json
Get-Content app.config.ts -ErrorAction SilentlyContinue
Get-Content app.json -ErrorAction SilentlyContinue
Get-Content eas.json -ErrorAction SilentlyContinue
Get-Content tsconfig.json
Get-Content .env -ErrorAction SilentlyContinue
Get-Content .env.local -ErrorAction SilentlyContinue
```

Record and confirm:
- App name, bundle ID (iOS), package name (Android)
- Expo SDK version — **LOCKED, never change**
- React Native version
- EAS project ID
- All declared permissions
- All Expo plugins

### 0-C: Full Screen Inventory

```powershell
cd C:\dev\transformr\apps\mobile

Write-Host "=== SCREEN COUNT ==="
(Get-ChildItem -Recurse -Path "app\" -Filter "*.tsx").Count

Write-Host "=== ALL SCREENS ==="
Get-ChildItem -Recurse -Path "app\" -Filter "*.tsx" | Select-Object FullName | Sort-Object FullName

Write-Host "=== COMPONENTS ==="
Get-ChildItem -Recurse -Path "components\" -Filter "*.tsx" | Select-Object FullName

Write-Host "=== STORES ==="
Get-ChildItem -Recurse -Path "stores\" -Filter "*.ts" | Select-Object FullName

Write-Host "=== SERVICES ==="
Get-ChildItem -Recurse -Path "services\" -Filter "*.ts" | Select-Object FullName

Write-Host "=== HOOKS ==="
Get-ChildItem -Recurse -Path "hooks\" -Filter "*.ts","*.tsx" -ErrorAction SilentlyContinue | Select-Object FullName

Write-Host "=== CONSTANTS ==="
Get-ChildItem -Recurse -Path "constants\" -Filter "*.ts" -ErrorAction SilentlyContinue | Select-Object FullName

Write-Host "=== EDGE FUNCTIONS ==="
Get-ChildItem -Recurse -Path "..\..\supabase\functions\" -ErrorAction SilentlyContinue | Select-Object FullName

Write-Host "=== MIGRATIONS ==="
Get-ChildItem -Path "..\..\supabase\migrations\" -Filter "*.sql" -ErrorAction SilentlyContinue |
  Sort-Object Name | Select-Object Name
```

**Read the content of every file listed.** Not skimming — reading completely.

### 0-D: Static Analysis Baseline

```powershell
cd C:\dev\transformr\apps\mobile

Write-Host "=== TypeScript ==="
npx tsc --noEmit 2>&1 | Tee-Object -FilePath "..\..\baseline-ts.txt"
$tsErrors = (Get-Content "..\..\baseline-ts.txt" | Select-String "error TS").Count
Write-Host "TypeScript errors at baseline: $tsErrors"

Write-Host "=== ESLint ==="
npx eslint . --ext .ts,.tsx --max-warnings 0 2>&1 | Tee-Object -FilePath "..\..\baseline-eslint.txt"

Write-Host "=== console.log occurrences ==="
(Select-String -Recurse -Path "app\","components\","services\","stores\" `
  -Pattern "console\.log" -Include "*.ts","*.tsx").Count

Write-Host "=== Hardcoded dark colors (brand violations) ==="
Select-String -Recurse -Path "app\","components\" `
  -Pattern "#0F172A|#1E293B|#334155|#6366F1|#4F46E5" `
  -Include "*.ts","*.tsx" | Select-Object Filename, LineNumber

Write-Host "=== Hardcoded hex colors NOT using theme tokens ==="
Select-String -Recurse -Path "app\","components\" `
  -Pattern "backgroundColor:\s*'#|color:\s*'#" `
  -Include "*.ts","*.tsx" |
  Where-Object { $_ -notmatch "theme\.|palette\.|BRAND_|// brand" } |
  Select-Object Filename, LineNumber, Line

Write-Host "=== any types ==="
(Select-String -Recurse -Path "app\","services\","stores\" `
  -Pattern ": any\b|as any\b|<any>" -Include "*.ts","*.tsx").Count

Write-Host "=== TODOs and stubs ==="
Select-String -Recurse -Path "app\","components\","services\" `
  -Pattern "TODO|FIXME|HACK|stub|placeholder|coming soon|not implemented" `
  -Include "*.ts","*.tsx" -CaseSensitive:$false | Select-Object Filename, LineNumber, Line

Write-Host "=== @ts-ignore suppressions ==="
Select-String -Recurse -Path "app\","components\","services\" `
  -Pattern "@ts-ignore|@ts-expect-error" -Include "*.ts","*.tsx" | Select-Object Filename, LineNumber
```

### 0-E: Runtime State

```powershell
adb logcat -c
adb shell am start -n com.automatai.transformr/.MainActivity
Start-Sleep -Seconds 10
adb shell screencap -p /sdcard/screen.png
adb pull /sdcard/screen.png C:\dev\transformr\apps\mobile\screenshots\phase0_launch.png

# Real errors only — filter all dev noise
adb logcat -d | Select-String "ERROR|Exception" |
  Where-Object { $_ -match "ReactNativeJS|JS ERROR|transformr" } |
  Where-Object { $_ -notmatch "WebSocket|Metro|HMR|Fast Refresh|OkHttp|monitor contention|RealConnection|Choreographer" } |
  Select-Object -Last 30
```

### 0-F: Supabase State

```powershell
cd C:\dev\transformr

# Confirm all Edge Functions exist
Get-ChildItem supabase\functions\ | Select-Object Name

# Confirm migration count
(Get-ChildItem supabase\migrations\ -Filter "*.sql").Count

# Confirm seed file
Get-ChildItem supabase\ -Filter "seed*"
```

### 0-Z: Produce Inventory Report

Write this complete inventory before proceeding to Phase 1:

```
TRANSFORMR — BASELINE INVENTORY
=================================
Date: [date]

APP IDENTITY:
  Name: [value]
  iOS Bundle ID: [value]
  Android Package: [value]
  Expo SDK: [value] ← LOCKED — NEVER CHANGE
  React Native: [value]
  EAS Project ID: [value]
  Routing: Expo Router v4 (file-based)
  State: Zustand [N stores]
  Backend: Supabase (Edge Functions + PostgreSQL + Realtime + Storage)
  AI: Anthropic Claude (claude-sonnet-4-20250514)

CODEBASE SIZE:
  Screens: [N]
  Components: [N]
  Stores: [N]
  Services: [N]
  Edge Functions: [N]
  SQL Migrations: [N]

STATIC ANALYSIS BASELINE:
  TypeScript errors: [N]
  ESLint errors: [N]
  ESLint warnings: [N]
  console.log calls: [N]
  Hardcoded old colors: [N]
  any types: [N]
  TODOs/stubs: [N]
  @ts-ignore: [N]

RUNTIME STATE:
  App launches: [YES/NO]
  Crash on launch: [describe or NONE]
  Known active crash: [describe or NONE]

SCREENS STATUS:
  ✅ COMPLETE (real data, loading/error states, both themes):
    [list]
  ⚠️  PARTIAL (exists but has gaps):
    [list — describe each gap]
  🔴 STUB (shell only):
    [list]
  🔴 MISSING (in blueprint but no file):
    [list]

EDGE FUNCTIONS STATUS:
  ✅ Deployed and responding: [list]
  ⚠️  Exists but not verified: [list]
  🔴 Missing: [list]

SUPABASE STATUS:
  Tables: [N — matches blueprint 45+ target?]
  RLS: [enabled on all / missing on some — list]
  Seed data: [exercises: N, foods: N, achievements: N]

USER EDUCATION SYSTEM:
  HelpIcon component: [EXISTS / MISSING]
  Coachmark component: [EXISTS / MISSING]
  ScreenHelpButton: [EXISTS / MISSING]
  ActionToast: [EXISTS / MISSING]
  helpContent.ts: [EXISTS / MISSING]
  screenHelp.ts: [EXISTS / MISSING]

KNOWN BLOCKERS (P0 — fix first):
  [list in priority order]
```

---

## PHASE 1 — CRASH AND BLOCKER ELIMINATION

Fix everything that prevents the app from running before touching any feature work.
Crashes are P0. Zero tolerance.

### 1-A: Fix the Active Compile Crash

The current known crash is a **duplicate `Card` declaration** in
`app/(tabs)/profile/index.tsx`. The file has body-level imports (lines ~78–94)
that ESLint already flagged. This causes a Metro bundler crash before any screen renders.

```powershell
cd C:\dev\transformr\apps\mobile
Get-Content "app/(tabs)/profile/index.tsx" | Select-Object -First 120
```

Read the output. Identify every duplicated declaration. The fix:
1. Move ALL import statements (lines 78–94) to the top of the file, before any other code
2. Remove any local declaration that shadows an import (e.g., `const Card = ...` that
   conflicts with `import { Card } from '@components/ui/Card'`)
3. Keep only one declaration per name — the import wins

After fixing:
```powershell
npx tsc --noEmit
npx eslint . --ext .ts,.tsx --max-warnings 0
# Both must be clean before continuing
```

Reload and confirm the crash is gone:
```powershell
adb shell input keyevent 82
Start-Sleep -Milliseconds 800
adb shell input tap 540 650
Start-Sleep -Seconds 6
adb shell screencap -p /sdcard/screen.png
adb pull /sdcard/screen.png screenshots\p1_crash_fixed.png
adb logcat -c
Start-Sleep -Seconds 8
adb logcat -d | Select-String "ERROR|Exception" |
  Where-Object { $_ -match "ReactNativeJS|JS ERROR" } |
  Where-Object { $_ -notmatch "WebSocket|Metro|OkHttp|contention" }
```

### 1-B: Fix All Remaining ESLint Warnings

The prior session left these specific warnings unresolved:

**1. `workout-player.tsx` line 392 — `useCallback` missing dependencies**

Read line 392 and surrounding context:
```powershell
Get-Content "app/(tabs)/fitness/workout-player.tsx" | Select-Object -Index (380..410)
```

If `elapsedSeconds` is a timer value that changes every second and should NOT trigger
callback re-creation: use the ref pattern:
```typescript
const elapsedSecondsRef = useRef(elapsedSeconds);
useEffect(() => { elapsedSecondsRef.current = elapsedSeconds; }, [elapsedSeconds]);
// Use elapsedSecondsRef.current inside the callback
// Remove elapsedSeconds from dep array
```

If `logCaloriesBurned` is a stable function: add it to the dependency array.
Read the code, pick the correct option, fix it.

**2. `settingsStore.ts` line 16 — Import in body of module**

```powershell
Get-Content stores\settingsStore.ts | Select-Object -First 30
```

Move the import at line 16 to the top of the file above all other code.

After all fixes:
```powershell
npx tsc --noEmit
npx eslint . --ext .ts,.tsx --max-warnings 0
```

Zero errors. Zero warnings. Both checks must pass clean.

### 1-C: Fix All TypeScript Errors

If the baseline showed any TypeScript errors (other than what the prior sessions already
resolved), fix every one now:

```powershell
npx tsc --noEmit 2>&1 | Select-String "error TS"
```

For each error:
1. Read the full file containing the error
2. Understand the type contract
3. Fix with the correct type — never suppress with `@ts-ignore`
4. Rerun `tsc --noEmit` after each fix to confirm it's resolved without creating new errors

### 1-D: Remove All console.log

```powershell
Select-String -Recurse -Path "app\","components\","services\","stores\" `
  -Pattern "console\.log" -Include "*.ts","*.tsx" | Select-Object Filename, LineNumber, Line
```

For each result: remove the log entirely, or replace with `console.warn` if it is a
genuine warning worth keeping, or `console.error` if it signals an error condition.
Never leave a bare `console.log` in production paths.

### 1-E: Remove All @ts-ignore Suppressions

```powershell
Select-String -Recurse -Path "app\","components\","services\" `
  -Pattern "@ts-ignore|@ts-expect-error" -Include "*.ts","*.tsx" | Select-Object Filename, LineNumber
```

For each: read the surrounding code, understand why the suppression exists,
fix the underlying type issue, remove the suppression.

Commit:
```
fix(p1): resolve all blockers — duplicate Card crash, ESLint warnings, TS errors, console.logs
```

---

## PHASE 2 — THEME SYSTEM VERIFICATION

Every screen must work correctly in both dark and light mode using only theme tokens.
Hardcoded colors are a launch blocker on the themed screens.

### 2-A: Find Every Theme Token Violation

```powershell
cd C:\dev\transformr\apps\mobile

# Find hardcoded background colors not using theme tokens
Select-String -Recurse -Path "app\","components\" `
  -Pattern "backgroundColor:\s*'#" -Include "*.tsx" |
  Where-Object { $_ -notmatch "// brand-ok|// static" } |
  Select-Object Filename, LineNumber, Line

# Find hardcoded text colors not using theme tokens
Select-String -Recurse -Path "app\","components\" `
  -Pattern "\bcolor:\s*'#" -Include "*.tsx" |
  Where-Object { $_ -notmatch "// brand-ok|// static" } |
  Select-Object Filename, LineNumber, Line

# Find old brand violations (Slate/Indigo — should have been replaced in Sprint 1)
Select-String -Recurse -Path "app\","components\" `
  -Pattern "#0F172A|#1E293B|#334155|#6366F1|#4F46E5|#818CF8" `
  -Include "*.ts","*.tsx" | Select-Object Filename, LineNumber, Line
```

For each violation: replace the hardcoded hex with the correct `theme.*` token.
Reference the locked palette from `TRANSFORMR-BRAND-KIT.md`:
- Dark bg primary: `theme.background.primary` (#0C0A15)
- Dark bg secondary: `theme.background.secondary` (#13102A)
- Dark bg tertiary: `theme.background.tertiary` (#1C1838)
- Accent primary: `theme.accent.primary` (#A855F7 dark / #7C3AED light)
- Text primary: `theme.text.primary`
- Text secondary: `theme.text.secondary`

### 2-B: Verify Light Mode Renders Correctly on All Screens

Switch to light mode via Profile → Appearance → Light, then navigate through every tab:

```powershell
# Switch to light mode via ADB
adb shell input tap 972 2150    # Profile tab
Start-Sleep -Seconds 3
adb shell input swipe 540 1400 540 600 400
Start-Sleep -Milliseconds 500
adb shell input tap 700 1200    # Light option
Start-Sleep -Seconds 2

# Capture every tab in light mode
@("dashboard","fitness","nutrition","goals","profile") | ForEach-Object {
  $tabs = @{dashboard=108; fitness=324; nutrition=540; goals=756; profile=972}
  adb shell input tap $tabs[$_] 2150
  Start-Sleep -Seconds 3
  adb shell screencap -p /sdcard/screen.png
  adb pull /sdcard/screen.png "screenshots\p2_light_${_}.png"
}
```

Read each screenshot. Any screen showing dark (#0C0A15) backgrounds in light mode has
a hardcoded color violation. Fix each one, then switch back to dark:

```powershell
adb shell input tap 972 2150
Start-Sleep -Seconds 2
adb shell input swipe 540 1400 540 600 400
adb shell input tap 290 1200    # Dark option
Start-Sleep -Seconds 2
```

Commit:
```
fix(p2): theme token audit — replace all hardcoded colors with theme.* tokens, verify light mode
```

---

## PHASE 3 — AUTHENTICATION AND ONBOARDING VERIFICATION

### 3-A: Authentication Flow

Force-stop the app to reach the auth screen:
```powershell
adb shell am force-stop com.automatai.transformr
Start-Sleep -Seconds 2
adb shell am start -n com.automatai.transformr/.MainActivity
Start-Sleep -Seconds 8
adb shell screencap -p /sdcard/screen.png
adb pull /sdcard/screen.png screenshots\p3_auth_start.png
```

**Verify error states (critical — these are the most common first-launch churn points):**

Wrong password test:
```powershell
adb shell input tap 540 680
Start-Sleep -Milliseconds 400
adb shell input text "test@test.com"
adb shell input tap 540 840
adb shell input text "wrongpassword"
adb shell input tap 540 1020
Start-Sleep -Seconds 4
adb shell screencap -p /sdcard/screen.png
adb pull /sdcard/screen.png screenshots\p3_wrong_pw.png
```

Expected: descriptive error message visible. NOT silent failure, NOT crash.
If no error visible: open `app/(auth)/login.tsx`, find the `signInWithPassword` catch block,
ensure error state is set AND rendered in a visible `<Text>` element.

Successful login:
```powershell
adb shell input tap 540 680
# Clear field first
adb shell input keyevent 123  # Move to end
adb shell input keyevent 67 -t 30  # Backspace 30 times
adb shell input text "testuser@transformr.app"
adb shell input tap 540 840
adb shell input text "TestPass123!"
adb shell input tap 540 1020
Start-Sleep -Seconds 8
adb shell screencap -p /sdcard/screen.png
adb pull /sdcard/screen.png screenshots\p3_login_success.png
```

Expected: Dashboard visible. No crash. No redirect loop.

### 3-B: Onboarding Field Formatting

Use a new test account. On Step 2 (Profile), verify auto-formatting:

```powershell
# DOB field — type digits, slashes must auto-insert
adb shell input tap 540 700
Start-Sleep -Milliseconds 300
adb shell input text "01151990"
Start-Sleep -Milliseconds 500
adb shell screencap -p /sdcard/screen.png
adb pull /sdcard/screen.png screenshots\p3_dob_format.png
```

Expected: displays `01/15/1990`. If raw `01151990`: `formatDateInput` is not wired.
Fix in `app/(auth)/onboarding/profile.tsx`:
```typescript
<TextInput
  keyboardType="number-pad"
  value={dob}
  onChangeText={(val) => setDob(formatDateInput(val))}
  maxLength={10}
/>
```

```powershell
# Height field — type digits, foot/inch separators must auto-insert
adb shell input tap 540 860
Start-Sleep -Milliseconds 300
adb shell input text "511"
Start-Sleep -Milliseconds 500
adb shell screencap -p /sdcard/screen.png
adb pull /sdcard/screen.png screenshots\p3_height_format.png
```

Expected: displays `5'11"`. If not: fix `formatHeightInput` wiring.

### 3-C: Onboarding Completion and No Back-Loop

Navigate through all 9 onboarding steps and tap "Start My Transformation":
```powershell
Start-Sleep -Seconds 8
adb shell screencap -p /sdcard/screen.png
adb pull /sdcard/screen.png screenshots\p3_onboard_complete.png
# Press back — must NOT return to onboarding
adb shell input keyevent 4
Start-Sleep -Seconds 2
adb shell screencap -p /sdcard/screen.png
adb pull /sdcard/screen.png screenshots\p3_onboard_back.png
```

Expected both screenshots: Dashboard. If back returns to onboarding:
fix the navigation guard in `app/(auth)/onboarding/ready.tsx` and `app/index.tsx`.
The `hasCompletedOnboarding` flag in `settingsStore` must be checked at root
index and redirect to `(tabs)/dashboard` before the onboarding routes can render.

Commit:
```
fix(p3): auth error states, onboarding auto-format, no back-loop after completion
```

---

## PHASE 4 — CORE FEATURE VERIFICATION (ALL TABS)

Work through every tab systematically. For each screen: navigate, capture screenshot,
verify data is real (not hardcoded), verify write operations work, fix anything broken.

### 4-A: Dashboard

```powershell
adb shell input tap 108 2150
Start-Sleep -Seconds 5
adb shell screencap -p /sdcard/screen.png
adb pull /sdcard/screen.png screenshots\p4_dashboard.png
```

Verify every element against these criteria:

| Element | Pass | Fail → Fix |
|---|---|---|
| Countdown | Real number, not 0 or NaN | Fix countdown store query |
| Weight display | Real number or `—` | Fix weight store query |
| Readiness | Real number or `—`, never hardcoded 72 | Fix readiness calculation |
| Streak | Real number or `—`, never hardcoded 0 | Fix habitStore.overallStreak |
| Macro rings | Show today's real totals | Fix nutritionStore.todayTotals |
| AI insight | Personalized text, no raw JSON, no ` ```json ` | Fix ai-coach Edge Function + cache |
| No static coach card | Only one AI card visible | Delete any hardcoded fallback card |

Check logcat for errors:
```powershell
adb logcat -c
Start-Sleep -Seconds 8
adb logcat -d | Select-String "ERROR|Exception" |
  Where-Object { $_ -match "ReactNativeJS|JS ERROR|transformr" } |
  Where-Object { $_ -notmatch "WebSocket|Metro|OkHttp|contention" }
```

### 4-B: Fitness Tab

```powershell
adb shell input tap 324 2150
Start-Sleep -Seconds 4
adb shell screencap -p /sdcard/screen.png
adb pull /sdcard/screen.png screenshots\p4_fitness.png
```

**Start a workout and log a set:**
```powershell
adb shell input tap 540 900
Start-Sleep -Seconds 4
adb shell screencap -p /sdcard/screen.png
adb pull /sdcard/screen.png screenshots\p4_workout_player.png

adb shell input tap 400 1200
adb shell input text "135"
adb shell input tap 660 1200
adb shell input text "8"
adb shell input tap 540 1420
Start-Sleep -Seconds 2
adb shell screencap -p /sdcard/screen.png
adb pull /sdcard/screen.png screenshots\p4_set_logged.png
```

Expected: set appears in logged list. Fix `workoutStore.logSet()` if it doesn't.

**Offline set logging:**
```powershell
adb shell svc wifi disable
Start-Sleep -Seconds 2
adb shell input tap 400 1200
adb shell input text "140"
adb shell input tap 660 1200
adb shell input text "6"
adb shell input tap 540 1420
Start-Sleep -Seconds 2
adb shell screencap -p /sdcard/screen.png
adb pull /sdcard/screen.png screenshots\p4_offline_set.png
adb shell svc wifi enable
Start-Sleep -Seconds 6
adb shell screencap -p /sdcard/screen.png
adb pull /sdcard/screen.png screenshots\p4_synced.png
```

**End workout → summary → back to fitness home:**
```powershell
adb shell input tap 540 180
Start-Sleep -Milliseconds 500
adb shell input tap 540 1200
Start-Sleep -Seconds 4
adb shell screencap -p /sdcard/screen.png
adb pull /sdcard/screen.png screenshots\p4_workout_summary.png
```

**Exercise library populated:**
```powershell
adb shell input keyevent 4
adb shell input tap 540 1100
Start-Sleep -Seconds 3
adb shell screencap -p /sdcard/screen.png
adb pull /sdcard/screen.png screenshots\p4_exercises.png
```

Expected: populated list (100+ exercises from seed data). If empty:
```powershell
cd C:\dev\transformr
supabase db seed
```

### 4-C: Nutrition Tab

```powershell
adb shell input tap 540 2150
Start-Sleep -Seconds 3
adb shell screencap -p /sdcard/screen.png
adb pull /sdcard/screen.png screenshots\p4_nutrition.png
```

Tab must appear INSTANTLY — no blank flash. If there is any animation delay on the root
container: find and remove `FadeInDown` or any entering animation from the root
`ScrollView` in `app/(tabs)/nutrition/index.tsx`.

**Log a meal and verify macro rings update:**
```powershell
adb shell input tap 540 700
Start-Sleep -Seconds 2
adb shell input tap 540 600
adb shell input text "chicken"
Start-Sleep -Seconds 3
adb shell input tap 540 900
Start-Sleep -Seconds 2
adb shell input tap 540 1650
Start-Sleep -Seconds 3
adb shell input keyevent 4
Start-Sleep -Seconds 2
adb shell screencap -p /sdcard/screen.png
adb pull /sdcard/screen.png screenshots\p4_meal_logged.png
```

**Log water and verify no promise rejection in logcat:**
```powershell
adb logcat -c
adb shell input tap 380 1520
Start-Sleep -Seconds 2
adb shell screencap -p /sdcard/screen.png
adb pull /sdcard/screen.png screenshots\p4_water.png
adb logcat -d | Select-String "unhandled|rejection|promise" |
  Where-Object { $_ -match "transformr" }
```

**Camera renders (not black screen):**
```powershell
adb shell pm grant com.automatai.transformr android.permission.CAMERA
adb shell input tap 280 700
Start-Sleep -Seconds 4
adb shell screencap -p /sdcard/screen.png
adb pull /sdcard/screen.png screenshots\p4_camera.png
adb shell input keyevent 4
```

### 4-D: Goals Tab

```powershell
adb shell input tap 756 2150
Start-Sleep -Seconds 3
adb shell screencap -p /sdcard/screen.png
adb pull /sdcard/screen.png screenshots\p4_goals.png
```

**Complete a habit — verify streak updates:**
```powershell
adb shell input tap 540 700
Start-Sleep -Seconds 2
adb shell input tap 960 760
Start-Sleep -Seconds 2
adb shell screencap -p /sdcard/screen.png
adb pull /sdcard/screen.png screenshots\p4_habit_done.png
```

**Log sleep — verify entry appears immediately (no refresh required):**
```powershell
adb shell input keyevent 4
adb shell input tap 540 900
Start-Sleep -Seconds 2
adb shell input tap 540 1820
Start-Sleep -Seconds 2
adb shell input tap 740 1200
adb shell input tap 540 1720
Start-Sleep -Seconds 3
adb shell screencap -p /sdcard/screen.png
adb pull /sdcard/screen.png screenshots\p4_sleep_logged.png
```

Expected: new entry in history list immediately. The `sleepStore` known bug (entries not
appearing until manual refresh) must have been fixed. If not fixed:
In `stores/sleepStore.ts`, find the `logSleep()` action and ensure it prepends to
`sleepHistory` array in local state immediately on successful Supabase insert,
before any refetch.

**Journal AI prompt is personalized:**
```powershell
adb shell input keyevent 4
adb shell input tap 540 1100
Start-Sleep -Seconds 2
adb shell input tap 540 1820
Start-Sleep -Seconds 6
adb shell screencap -p /sdcard/screen.png
adb pull /sdcard/screen.png screenshots\p4_journal_prompt.png
```

Expected: prompt text references the user's specific numbers (name, weight, streak, goal,
or a recent logged event). Generic text ("How are you feeling?") means the
`ai-journal-prompt` Edge Function system prompt is missing user context.
Fix by adding full user context to the system prompt — reference the AI context standard
in `TRANSFORMR-INSTRUCTIONS.md`.

**Log revenue — verify total updates:**
```powershell
adb shell input keyevent 4
adb shell input tap 540 1420
Start-Sleep -Seconds 3
adb shell input tap 900 1820
Start-Sleep -Seconds 2
adb shell input tap 540 700
adb shell input text "1500"
adb shell input tap 540 900
adb shell input text "Consulting"
adb shell input tap 540 1640
Start-Sleep -Seconds 3
adb shell screencap -p /sdcard/screen.png
adb pull /sdcard/screen.png screenshots\p4_revenue.png
```

### 4-E: Profile Tab

```powershell
adb shell input tap 972 2150
Start-Sleep -Seconds 3
adb shell screencap -p /sdcard/screen.png
adb pull /sdcard/screen.png screenshots\p4_profile.png
```

Verify theme toggle works in real time (already verified in Phase 2).
Verify notifications settings screen navigates correctly.
Verify achievements screen shows earned badges.

Commit:
```
fix(p4): all tab flows verified — workout logging, nutrition, habits, sleep, journal, revenue
```

---

## PHASE 5 — DATA PERSISTENCE

The most critical real-world test. Data that disappears on force-close is a launch blocker.

Log data in three domains, then force-close and verify everything survived:

```powershell
# (Use data logged in Phase 4 — don't re-log, just test persistence)

adb shell am force-stop com.automatai.transformr
Start-Sleep -Seconds 4

adb shell am start -n com.automatai.transformr/.MainActivity
Start-Sleep -Seconds 12

# Fitness persistence
adb shell input tap 324 2150
Start-Sleep -Seconds 4
adb shell screencap -p /sdcard/screen.png
adb pull /sdcard/screen.png screenshots\p5_persist_fitness.png

# Nutrition persistence
adb shell input tap 540 2150
Start-Sleep -Seconds 4
adb shell screencap -p /sdcard/screen.png
adb pull /sdcard/screen.png screenshots\p5_persist_nutrition.png

# Goals persistence
adb shell input tap 756 2150
Start-Sleep -Seconds 4
adb shell screencap -p /sdcard/screen.png
adb pull /sdcard/screen.png screenshots\p5_persist_goals.png
```

Read all three screenshots. Expected: all previously logged data still present.

If any domain shows data loss:
1. The Supabase write is not completing before the app terminates
2. Find the write in the affected store
3. Ensure it is `await`ed before the function returns
4. Ensure it is NOT only updating local Zustand state — it must write to Supabase
5. Verify the offline queue pattern: writes that fail go to MMKV queue and sync on reconnect

Commit:
```
fix(p5): data persistence verified — all domains survive force-close
```

---

## PHASE 6 — NAVIGATION DEAD-END AUDIT

Navigate to every screen and verify:
1. Back button visible in header
2. Tapping back returns to correct parent screen
3. No screen traps the user

Back button coordinate: approximately `(100, 100)` in the header area.
If different on your emulator, calibrate from a screenshot first.

```powershell
# For each screen below:
# 1. Navigate to it (use appropriate tap commands)
# 2. Screenshot and read — verify back button visible
# 3. Tap back: adb shell input tap 100 100
# 4. Screenshot and read — verify parent screen returned

# Screens to audit:
$screens = @(
  "fitness/exercises",
  "fitness/exercise-detail",
  "fitness/progress",
  "fitness/programs",
  "fitness/form-check",
  "fitness/pain-tracker",
  "fitness/mobility",
  "fitness/workout-summary",
  "nutrition/add-food",
  "nutrition/meal-camera",
  "nutrition/barcode-scanner",
  "nutrition/saved-meals",
  "nutrition/meal-prep",
  "nutrition/grocery-list",
  "nutrition/supplements",
  "nutrition/analytics",
  "goals/habits",
  "goals/sleep",
  "goals/mood",
  "goals/journal",
  "goals/focus-mode",
  "goals/vision-board",
  "goals/skills",
  "goals/challenges",
  "goals/stake-goals",
  "goals/business",
  "goals/finance",
  "profile/partner",
  "profile/achievements",
  "profile/dashboard-builder",
  "profile/notifications-settings",
  "profile/nfc-setup",
  "profile/integrations",
  "profile/data-export",
  "profile/about",
  "trajectory",
  "weekly-review",
  "goal-cinema",
  "ai-chat"
)
```

For any screen missing a back button: add it in the screen's `Stack.Screen options`:
```typescript
options={{
  headerLeft: () => (
    <TouchableOpacity
      onPress={() => router.back()}
      style={{ paddingLeft: 16 }}
      accessibilityLabel="Go back"
      accessibilityRole="button"
    >
      <Ionicons name="chevron-back" size={24} color={theme.text.primary} />
    </TouchableOpacity>
  ),
}}
```

For any modal missing a close button: add an `×` button to the header right.

Commit:
```
fix(p6): navigation audit — back buttons on all screens, zero dead ends
```

---

## PHASE 7 — EMPTY STATE AUDIT

Navigate to each screen with a fresh account (no logged data) and verify the empty state
is warm, branded, and functional. Read the actual screen content from a screenshot.

| Screen | Required heading | CTA button | CTA action |
|---|---|---|---|
| Fitness (no workouts) | "Your journey starts here" OR "Ready to start?" | "Start Your First Workout" | Opens workout player |
| Nutrition (no meals) | "Fuel your transformation" | "Log a Meal" | Opens add-food |
| Habits (no habits) | "Build habits that stick" | "Create Your First Habit" | Opens add habit modal |
| Sleep (no logs) | "Sleep is where you grow" | "Log Last Night's Sleep" | Opens log sleep |
| Business (no revenue) | "Track every dollar" | "Add Revenue Entry" | Opens add revenue |
| Journal (no entries) | "Start writing your story" | "Write Your First Entry" | Opens new entry |
| Achievements (none) | "Your legacy starts today" | "View Today's Goals" | Goals tab |
| Challenges (none active) | "Challenge yourself" | "Browse Challenges" | Challenge list |
| Vision board (empty) | "Visualize your future" | "Add Your First Image" | Image picker |
| Finance (no transactions) | "Money clarity starts here" | "Add a Transaction" | Add transaction |

For any screen showing "No data found", a blank list, a generic system message, or a
broken CTA button: fix the empty state component in that screen.

Commit:
```
feat(p7): empty states — warm branded copy and working CTAs on all screens
```

---

## PHASE 8 — USER EDUCATION SYSTEM

Build the complete user education system. Read
`TRANSFORMR-USER-EDUCATION-SYSTEM.md` completely before writing any code.

Check if any components already exist from prior sessions:
```powershell
cd C:\dev\transformr\apps\mobile
Get-ChildItem -Recurse -Path "components\ui\" -Filter "Help*","Coach*","Toast*","Action*" |
  Select-Object Name
Get-ChildItem -Recurse -Path "constants\" -ErrorAction SilentlyContinue |
  Select-Object Name
```

For any component that already exists: read it completely before deciding to modify or
replace. Do not duplicate work. Build only what is missing.

**Required components (build each if missing):**

1. `components/ui/HelpIcon.tsx` — Inline `ⓘ` that opens a bottom sheet explanation
2. `constants/helpContent.ts` — Complete help content for every metric and feature (30+ entries)
3. `components/ui/Coachmark.tsx` — First-run spotlight with step indicator
4. `constants/coachmarkSteps.ts` — Step definitions for 5 priority screens
5. `components/ui/ScreenHelpButton.tsx` — `?` button for every screen header
6. `constants/screenHelp.ts` — Screen-level help for every screen (15+ entries)
7. `components/ui/ActionToast.tsx` + `useActionToast` hook — Confirmation on every write

**Required integrations:**

Wire `HelpIcon` to every metric label that needs explanation:
```
Dashboard: readiness score, streak, countdown, AI insight header
Fitness: RPE label, ghost mode label, PR badge
Nutrition: each macro ring label, water target
Goals: habit streak, sleep quality stars, stake goals header
Business: MRR label, correlation score
Profile: coaching tone label
```

Wire `ScreenHelpButton` to the header of every screen (minimum 20 screens).

Wire `Coachmark` to 5 priority screens:
- `dashboard.tsx` — 4 steps
- `fitness/workout-player.tsx` — 3 steps
- `nutrition/index.tsx` — 3 steps
- `goals/index.tsx` — 2 steps
- `goals/business/index.tsx` — 2 steps

Wire `ActionToast` to every write operation:

| Write action | Toast message | Subtext |
|---|---|---|
| Log workout set | "Set logged" | "{weight} lbs × {reps} reps" |
| PR broken | "New Personal Record! 🏆" | "{exercise}: {weight} lbs" |
| Log meal | "Meal logged" | "+{cal} cal · {protein}g protein" |
| Log water | "Hydration logged" | "{total}oz today" |
| Complete habit | "Habit complete ✓" | "{streak} day streak" |
| Log sleep | "Sleep logged" | "{hours}h · {quality} stars" |
| Log weight | "Weight logged" | "{weight} lbs" |
| Log revenue | "Revenue logged" | "+${amount}" |
| Save journal | "Entry saved" | "{wordCount} words" |

**Personalized first-load AI card:**

In `dashboard.tsx`, add a `buildWelcomeInsight(profile)` function that generates
a personalized text card from onboarding data — displayed instantly on first Dashboard
visit while the real AI fetch happens in the background. After first render, mark
`settingsStore.hasSeenDashboard = true` and transition to the live AI card.

After building all components:
```powershell
npx tsc --noEmit
npx eslint . --ext .ts,.tsx --max-warnings 0
```

Zero errors. Zero warnings. Fix any before committing.

Commit:
```
feat(p8): user education system — HelpIcons, Coachmarks, ScreenHelp, ActionToasts, first-load card
```

---

## PHASE 9 — SUPABASE COMPLETENESS AUDIT

### 9-A: Verify All Required Tables Exist

```powershell
cd C:\dev\transformr

# Count migration files
(Get-ChildItem supabase\migrations\ -Filter "*.sql").Count
# Expected: 27+

# Read migrations to confirm key tables exist
Select-String -Path "supabase\migrations\*.sql" -Pattern "CREATE TABLE" |
  Select-Object Line | Sort-Object Line
```

Cross-reference against the required table list in `TRANSFORMR-BLUEPRINT.md`.
Any missing table: write a new numbered migration file and apply it:
```powershell
supabase db push
```

### 9-B: Verify Seed Data Counts

Connect to Supabase and verify minimum counts. If you cannot query directly, check the
seed file:
```powershell
Get-Content supabase\seed.sql -ErrorAction SilentlyContinue |
  Select-String "INSERT INTO" | Select-Object Line
```

Required minimums:
- `exercises`: 100+
- `foods`: 100+
- `achievements`: 75+
- `workout_templates`: 4+
- `saved_meals`: 10+
- `community_challenges`: 5+
- `business_milestones`: 11

If any count is below minimum, add the missing records to the seed file and re-run:
```powershell
supabase db reset  # WARNING: only if safe — this drops and recreates
```

### 9-C: Verify Edge Functions Are Deployed

```powershell
supabase functions list
```

All 28 Edge Functions must be listed. Any missing:
```powershell
supabase functions deploy [function-name]
```

Required functions:
```
ai-coach, ai-meal-analysis, ai-form-check, ai-menu-scan, ai-progress-photo,
ai-trajectory, ai-weekly-report, ai-motivation, ai-journal-prompt, ai-supplement,
ai-grocery-list, ai-meal-prep, ai-sleep-optimizer, ai-adaptive-program, ai-correlation,
daily-reminder, streak-calculator, achievement-evaluator, pr-detection, readiness-score,
widget-update, stripe-webhook, partner-nudge, stake-evaluator, social-content-gen,
goal-cinema
```

### 9-D: Verify AI Model in Edge Functions

Every Edge Function that calls Claude must use:
```
model: 'claude-sonnet-4-20250514'
```

Scan for any that don't:
```powershell
Select-String -Recurse -Path "supabase\functions\" `
  -Pattern "model:" -Include "*.ts" |
  Where-Object { $_ -notmatch "claude-sonnet-4-20250514" } |
  Select-Object Filename, Line
```

Fix every incorrect model reference.

### 9-E: Verify All Edge Functions Have Full User Context

Every AI Edge Function system prompt must include:
- User's current weight and goal weight
- Countdown days remaining
- Last 7 days of workout/nutrition/sleep/mood data
- Current streaks
- Business MRR
- Active injuries and supplements
- Coaching tone preference

Scan for any that use generic or missing context:
```powershell
Get-ChildItem supabase\functions\ -Recurse -Filter "index.ts" |
  Where-Object { (Get-Content $_.FullName | Select-String "systemPrompt|system_prompt").Count -gt 0 } |
  ForEach-Object {
    Write-Host "=== $($_.DirectoryName) ==="
    Get-Content $_.FullName | Select-String "systemPrompt|system_prompt|goal_weight|current_weight" | Select-Object Line
  }
```

Any function missing user context in its system prompt: fix by adding the full user
context object. Reference the AI context standard in `TRANSFORMR-INSTRUCTIONS.md`.

Commit:
```
fix(p9): Supabase audit — tables complete, seed data verified, Edge Functions deployed, AI model correct
```

---

## PHASE 10 — FINAL VERIFICATION SWEEP

Run every check. All must pass before this session is complete.

```powershell
cd C:\dev\transformr\apps\mobile

Write-Host "`n════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  TRANSFORMR FINAL VERIFICATION SWEEP" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════`n" -ForegroundColor Cyan

# CHECK 1 — TypeScript
Write-Host "CHECK 1: TypeScript" -ForegroundColor Yellow
npx tsc --noEmit
if ($LASTEXITCODE -eq 0) {
  Write-Host "  PASS — 0 errors" -ForegroundColor Green
} else {
  Write-Host "  FAIL — fix all errors above before continuing" -ForegroundColor Red
}

# CHECK 2 — ESLint
Write-Host "`nCHECK 2: ESLint" -ForegroundColor Yellow
npx eslint . --ext .ts,.tsx --max-warnings 0
if ($LASTEXITCODE -eq 0) {
  Write-Host "  PASS — 0 errors, 0 warnings" -ForegroundColor Green
} else {
  Write-Host "  FAIL — fix all errors and warnings above" -ForegroundColor Red
}

# CHECK 3 — No console.log
Write-Host "`nCHECK 3: console.log" -ForegroundColor Yellow
$n = (Select-String -Recurse -Path "app\","components\","services\","stores\" `
  -Pattern "console\.log" -Include "*.ts","*.tsx").Count
if ($n -eq 0) { Write-Host "  PASS — 0 found" -ForegroundColor Green }
else { Write-Host "  FAIL — $n found, remove all" -ForegroundColor Red }

# CHECK 4 — No hardcoded old colors
Write-Host "`nCHECK 4: Hardcoded old brand colors" -ForegroundColor Yellow
$n = (Select-String -Recurse -Path "app\","components\" `
  -Pattern "#0F172A|#1E293B|#6366F1|#4F46E5" -Include "*.ts","*.tsx").Count
if ($n -eq 0) { Write-Host "  PASS — 0 found" -ForegroundColor Green }
else { Write-Host "  FAIL — $n found, replace with theme.* tokens" -ForegroundColor Red }

# CHECK 5 — No any types
Write-Host "`nCHECK 5: any types" -ForegroundColor Yellow
$n = (Select-String -Recurse -Path "app\","services\","stores\" `
  -Pattern ": any\b|as any\b" -Include "*.ts","*.tsx").Count
if ($n -eq 0) { Write-Host "  PASS — 0 found" -ForegroundColor Green }
else { Write-Host "  FAIL — $n found, fix all" -ForegroundColor Red }

# CHECK 6 — No TODOs
Write-Host "`nCHECK 6: TODOs and stubs" -ForegroundColor Yellow
$n = (Select-String -Recurse -Path "app\","components\","services\" `
  -Pattern "TODO|FIXME|stub|placeholder|coming soon" `
  -Include "*.ts","*.tsx" -CaseSensitive:$false).Count
if ($n -eq 0) { Write-Host "  PASS — 0 found" -ForegroundColor Green }
else { Write-Host "  FAIL — $n found, resolve all" -ForegroundColor Red }

# CHECK 7 — No @ts-ignore
Write-Host "`nCHECK 7: @ts-ignore suppressions" -ForegroundColor Yellow
$n = (Select-String -Recurse -Path "app\","components\","services\" `
  -Pattern "@ts-ignore|@ts-expect-error" -Include "*.ts","*.tsx").Count
if ($n -eq 0) { Write-Host "  PASS — 0 found" -ForegroundColor Green }
else { Write-Host "  FAIL — $n found, fix underlying type issues" -ForegroundColor Red }

# CHECK 8 — Runtime errors
Write-Host "`nCHECK 8: Runtime JS errors" -ForegroundColor Yellow
adb logcat -c
Start-Sleep -Seconds 15
$errors = (adb logcat -d | Select-String "ERROR|Exception" |
  Where-Object { $_ -match "ReactNativeJS|JS ERROR|transformr" } |
  Where-Object { $_ -notmatch "WebSocket|Metro|HMR|Fast Refresh|OkHttp|contention|RealConnection" }).Count
if ($errors -eq 0) { Write-Host "  PASS — 0 runtime errors" -ForegroundColor Green }
else { Write-Host "  FAIL — $errors runtime errors, fix all" -ForegroundColor Red }

# CHECK 9 — App renders both themes cleanly
Write-Host "`nCHECK 9: Theme rendering" -ForegroundColor Yellow
Write-Host "  Capture dark mode dashboard..."
adb shell input tap 108 2150
Start-Sleep -Seconds 3
adb shell screencap -p /sdcard/screen.png
adb pull /sdcard/screen.png screenshots\final_dark_dashboard.png
Write-Host "  Switch to light mode and capture..."
adb shell input tap 972 2150
Start-Sleep -Seconds 2
adb shell input swipe 540 1400 540 600 400
adb shell input tap 700 1200
Start-Sleep -Seconds 2
adb shell input tap 108 2150
Start-Sleep -Seconds 3
adb shell screencap -p /sdcard/screen.png
adb pull /sdcard/screen.png screenshots\final_light_dashboard.png
Write-Host "  Read both screenshots. Both must be fully branded and legible." -ForegroundColor White
# Switch back to dark
adb shell input tap 972 2150
Start-Sleep -Seconds 2
adb shell input swipe 540 1400 540 600 400
adb shell input tap 290 1200
Start-Sleep -Seconds 2

Write-Host "`n════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  All checks must show PASS." -ForegroundColor Cyan
Write-Host "  Fix every FAIL before committing." -ForegroundColor Cyan
Write-Host "════════════════════════════════════════`n" -ForegroundColor Cyan
```

All 9 checks must show PASS. Fix every failure before the final commit.

---

## PHASE 11 — FINAL COMMIT AND PUSH

```powershell
cd C:\dev\transformr
git add -A
git commit -m "feat: TRANSFORMR complete elevation — zero blockers, full feature verification, user education system, App Store ready"
git push origin dev
```

---

## PHASE 12 — SESSION REPORT

Write this complete report when all phases are done:

```
TRANSFORMR ELEVATION — COMPLETE
=================================
Date: [date]
Session duration: [hours]

APP SUMMARY:
  [2-3 sentence description of what TRANSFORMR is and what was accomplished]

BASELINE → FINAL:
  TypeScript errors: [N] → 0
  ESLint warnings: [N] → 0
  console.log: [N] → 0
  Hardcoded colors: [N] → 0
  any types: [N] → 0
  TODOs: [N] → 0

PHASES COMPLETED:
  Phase 0 — Orientation:        [inventory produced]
  Phase 1 — Crash + Blockers:   [list fixes made]
  Phase 2 — Theme system:       [N violations fixed]
  Phase 3 — Auth + Onboarding:  [list fixes made]
  Phase 4 — Core tab flows:     [list fixes made]
  Phase 5 — Data persistence:   [VERIFIED / fixes made]
  Phase 6 — Navigation audit:   [N dead ends fixed]
  Phase 7 — Empty states:       [N screens fixed]
  Phase 8 — User education:     [components built]
  Phase 9 — Supabase audit:     [N tables, N edge functions, seed data status]
  Phase 10 — Final verification: [all 9 checks PASS]

ALL FINAL CHECKS:
  TypeScript 0 errors:        ✅
  ESLint 0 warnings:          ✅
  console.log 0:              ✅
  No hardcoded old colors:    ✅
  No any types:               ✅
  No TODOs:                   ✅
  No @ts-ignore:              ✅
  Runtime errors 0:           ✅
  Both themes verified:       ✅

FILES MODIFIED: [complete list with brief reason for each]

DEFERRED ITEMS: [anything that could not be completed with specific reason]
  OR: None

READY FOR TESTFLIGHT: YES / NO
If NO: [exact remaining blockers]
```

---

## INTERRUPTION POLICY

Zero questions. Zero stops between phases.

**Resolve every decision by:**
1. Reading the relevant file
2. Running a diagnostic command
3. Checking `TRANSFORMR-BLUEPRINT.md` or `TRANSFORMR-INSTRUCTIONS.md`

**The ONLY valid stop condition:**
A hard blocker that cannot be resolved from within the repo — for example, a Supabase
migration conflict, a native module requiring a config change outside the codebase,
or a required environment variable that is not present in `.env`.

Document every decision in commit messages.

Ignore: WebSocket drops, Metro reconnections, OkHttp contention, Choreographer frame
skips, HMR updates. These are development environment noise.

**Go.**

---

*Automate AI LLC — TRANSFORMR Division*
*"Every rep. Every meal. Every dollar. Every day."*
