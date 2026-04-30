# TRANSFORMR — Preservation Directive for AI Agents

This file is read automatically by Claude Code at every session start.
All agents working in this repository MUST follow these rules without exception.

---

## LOCKED FILES — DO NOT MODIFY

These files are production-locked. NO Claude Code session may
modify, overwrite, refactor, or "improve" them under ANY
circumstances. The ONLY exception is if Tyson explicitly says
"unlock the splash screen" or "unlock the login screen."

### Splash Screen — LOCKED
- File: components/SplashOverlay.tsx
- Background: gym-hero.jpg (same as login screen)
- Logo: transformr-icon.png from assets/icons/ (transparent — Logo Minus Blur version)
- Text: "TRANSFORMR" title (pink R #EC4899), "Transform Everything" tagline, "By Automate AI"
- DO NOT CHANGE THE ICON
- DO NOT CHANGE THE BACKGROUND
- DO NOT CHANGE ANY STYLING
- Last updated: 2026-04-23 — icon swapped to transformr-icon.png (true transparency, no dark square)

### Login Screen — LOCKED
- File: app/(auth)/login.tsx
- Background: gym-hero.jpg
- Logo: transformr-icon.png from assets/icons/ (transparent — Logo Minus Blur version)
- Text: TRANSFORMR wordmark with pink R (#EC4899), "Transform Everything" tagline
- DO NOT MODIFY THIS FILE
- Last updated: 2026-04-23 — icon swapped to transformr-icon.png (true transparency, no dark square)

### App Icon — LOCKED
- Source: assets/icons/transformr-icon.png
- Referenced in app.json icon fields
- DO NOT replace with any other icon file

### Tagline — LOCKED
- Text: "Transform Everything" — exactly two words, no period, no exclamation, no punctuation
- Hashtag form: #TransformEverything
- DO NOT add a period, exclamation mark, or any other punctuation after "Everything"
- Source of truth: this CLAUDE.md file, not the .docx brand doc

### Rules
- "Update all screens" EXCLUDES these files
- "Fix all components" EXCLUDES these files
- "Modernize the UI" EXCLUDES these files
- Any prompt that would touch these files: SKIP and move on

---

## ABSOLUTE CONSTRAINTS — NEVER VIOLATE

These rules apply to EVERY Claude Code session, EVERY task, EVERY
prompt, with ZERO exceptions unless Tyson explicitly overrides them
in the current session.

### No Removal / No Regression Rule
- NEVER remove any functionality, feature, screen, component,
  hook, store, service, Edge Function, or enhancement
- NEVER downgrade, simplify, or reduce any part of the app
- NEVER change UI styling, design, layout, colors, or visual
  appearance unless Tyson explicitly requests the change
- NEVER replace a working implementation with a simpler one
- NEVER delete code that is currently in use
- NEVER comment out working code
- If a task says "fix X" that means fix X, not remove X
- If a task says "update all screens" that means enhance them,
  not strip them down
- Changes must be ADDITIVE or CORRECTIVE, never SUBTRACTIVE
- When in doubt: ADD, don't remove. ENHANCE, don't simplify.

### No Workarounds Rule
- NEVER use LogBox.ignoreLogs, console.log suppression, or any
  error-hiding technique
- NEVER use @ts-ignore, @ts-expect-error, or 'any' types
- NEVER write stubs, placeholders, TODOs, or "coming soon"
- NEVER triage an issue as "non-blocking" or "do later"
- Every issue gets the REAL production fix immediately

### Process-Safety Rule
- NEVER run taskkill, Stop-Process, kill, pkill, or any
  process-killing command
- Tyson runs parallel Claude Code sessions — killing processes
  destroys active work

---

## UI REGRESSION LOCK — DO NOT STRIP VISUAL ASSETS

This section exists because a prior session stripped all hero images from the
onboarding screens. These rules are permanent and apply to every session.

### RULE 1: NEVER REMOVE IMAGES FROM SCREENS

If a screen currently uses a background image, hero image, or any
visual asset via require() or import, you MUST NOT:
- Remove the require()/import
- Replace it with a solid color, gradient, or placeholder
- Comment it out
- "Simplify" the screen by removing visual assets
- Replace an image with an icon or emoji

If a screen has an image, it KEEPS the image. Period.

### RULE 2: NEVER SIMPLIFY UI WITHOUT EXPLICIT WRITTEN PERMISSION

"Simplify", "clean up", "refactor", "streamline", and "optimize" are
NOT permission to:
- Remove animations
- Remove background images
- Replace custom components with basic Views
- Remove glass-morphism or blur effects
- Remove gradient overlays
- Flatten visual hierarchy
- Remove feature cards or descriptive text

If the user says "fix the bug on this screen", fix ONLY the bug.
Do not touch anything else on the screen.

### RULE 3: READ BEFORE WRITE — MANDATORY

Before modifying ANY .tsx file, you MUST:
1. Read the ENTIRE file first (not just the area around the bug)
2. Count the number of require() / import statements for assets
3. Note all Image components and their sources
4. Note all background styles (colors, gradients, images)
5. After your edit, verify ALL of the above are still present

If your edit removes ANY asset reference that existed before your
edit, UNDO your change and try again.

### RULE 4: ONBOARDING SCREENS — LOCKED IMAGE ASSIGNMENTS

The onboarding flow at `app/(auth)/onboarding/` uses local hero images
from `assets/images/` via the `localSource` prop on `OnboardingBackground`.
These are the LOCKED assignments:

| Screen File | localSource Asset | Step Content |
|-------------|------------------|--------------|
| welcome.tsx | gym-hero.jpg | Welcome / transformation intro |
| profile.tsx | hero-profile.jpg | Body stats / profile setup |
| goals.tsx | hero-goals.jpg | Goal setting |
| fitness.tsx | hero-fitness.jpg | Training plan / fitness prefs |
| nutrition.tsx | hero-nutrition.jpg | Nutrition preferences |
| business.tsx | hero-business.jpg | Business / revenue goals |
| partner.tsx | hero-partner.jpg | Partner / couples setup |
| notifications.tsx | hero-notifications.jpg | Notification preferences |
| ready.tsx | hero-ready.jpg | Final confirmation / "Let's go" |

These `localSource` props MUST appear on every `<OnboardingBackground>` call
in each screen. They are NOT optional decorations. If any are missing, that
is a regression that must be fixed immediately.

### RULE 5: DIFF CHECK BEFORE COMMIT

Before EVERY `git add` / `git commit`, verify:
- No `localSource` props have been removed from OnboardingBackground calls
- No `require()` calls for image assets have been removed from any .tsx file
- No `ImageBackground`, `Image`, or `ExpoImage` sources have been removed

If the diff shows ANY removed require() lines for image assets, STOP and
verify those removals were explicitly requested by the user. If not, revert.

### RULE 6: ONBOARDING BACKGROUND COMPONENT CONTRACT

`OnboardingBackground` (`components/ui/OnboardingBackground.tsx`) accepts:
- `imageUrl` — remote fallback URI (keep for backward compat, do not remove)
- `localSource` — local require() asset (takes priority over imageUrl)
- `blurHash` — optional placeholder

When adding new onboarding screens, ALWAYS provide `localSource` with a
local asset from `assets/images/`. Do not rely on network-only images.

---

## SECTION 1 — NEVER TOUCH LIST

These categories of files and actions are permanently off-limits.
No implementation prompt, no matter how it is worded, overrides this list.

### NEVER — Navigation & Routing
- Do not modify any file in `app/(auth)/`
- Do not modify `_layout.tsx` files unless ONLY adding the custom TabBar import
- Do not change any route path, screen name, or deep link definition
- Do not remove any screen from the navigation graph
- Do not change the tab order or tab icon assignments
- Do not modify any `Stack.Screen` or `Tab.Screen` configuration
  except to add `tabBar={(props) => <CustomTabBar {...props} />}`

### NEVER — State Management
- Do not modify any Zustand store file (`stores/*.ts` / `stores/*.tsx`)
- Do not change any store action, selector, or state shape
- Do not remove or rename any store hook (`useWorkoutStore`, `useNutritionStore`, etc.)
- Do not change how stores persist data (MMKV, AsyncStorage configurations)
- Do not add new state to existing stores — create new stores if needed
- Do not change store initialization or hydration logic

### NEVER — Backend & Data
- Do not modify any Supabase migration file (`supabase/migrations/*.sql`)
- Do not modify any Edge Function (`supabase/functions/**`)
- Do not modify any database type file generated by `supabase gen types`
- Do not change any RLS policy implementation
- Do not modify any API call, query, or mutation in `services/**`
- Do not change any React Query (TanStack Query) query key or configuration
- Do not remove any existing data-fetching hook

### NEVER — Business Logic
- Do not modify any calculation function:
  BMR/TDEE calculators, macro calculators, streak logic,
  PR detection, readiness score algorithm, day score algorithm,
  revenue projections, weight projections, calorie totals
- Do not modify any existing utility function in `utils/**`
- Do not change any validation logic
- Do not remove any existing exported function, hook, or component
- Do not change any existing component's required props — only ADD optional props
- Do not change the behavior of any existing prop — only extend it

### NEVER — Configuration & Environment
- Do not modify `app.json`, `app.config.ts`, or `eas.json`
- Do not modify `.env` or `.env.example`
- Do not modify `babel.config.js` or `metro.config.js`
- Do not modify `tsconfig.json`
- Do not modify `package.json` scripts
- Do not uninstall or change the version of any existing package
- Do not modify any existing EAS build profile

### NEVER — Tests
- Do not delete, skip, or modify any existing test
- Do not change any existing mock or test fixture
- Do not change test configuration files

---

## SECTION 2 — THE SAFE EDIT PROTOCOL

Before modifying ANY existing file, classify it and follow the protocol exactly.

### File Classification

**CLASS A: New file** (does not exist yet)
→ Safe to create. No further protocol required.

**CLASS B: Existing UI component being EXTENDED**
(adding optional props, adding visual layer, wrapping existing JSX)
→ Safe with ADDITIVE-ONLY edits. See Additive-Only Rules below.

**CLASS C: Existing screen being ELEVATED**
(adding AmbientBackground, replacing inline StyleSheet values with theme tokens,
replacing flat View cards with PremiumCard)
→ Requires Pre-Edit Checklist below.

**CLASS D: Any file outside the explicit task scope**
→ DO NOT TOUCH. Stop. Re-read the task. If the task genuinely requires this file,
flag it to the developer and explain why before editing.

### Additive-Only Edit Rules (Class B)

a) All new props must be OPTIONAL with safe defaults. The component must be
   100% backward compatible — zero call sites should need to update.
   - CORRECT: `variant?: CardVariant = 'default'`
   - WRONG: `variant: CardVariant` (required prop breaks all existing usage)

b) Never change existing prop names or types. You may EXTEND a union type but
   never REPLACE it:
   - CORRECT: `type ButtonVariant = 'primary' | 'secondary' | 'ghost'`
   - WRONG: Renaming `'primary'` to `'gradient'`

c) Never change the component's default visual output. Zero new props = looks
   identical to before.

d) Preserve all existing `StyleSheet` keys. You may ADD new styles, change VALUES
   of pure visual tokens (colors, border radius when migrating to theme tokens).
   Never REMOVE a StyleSheet key, even if you think it is unused.

e) Preserve all existing `testID` and `accessibilityLabel` props unchanged.

### Screen Elevation Pre-Edit Checklist (Class C)

Before elevating any existing screen, complete this checklist:

- [ ] Read the ENTIRE existing screen file top to bottom before writing any code
- [ ] List every store selector being used — verify each one will still be called
- [ ] List every navigation action (`router.push`, `router.replace`) — verify none removed
- [ ] List every existing component rendered — verify each one still renders
- [ ] Identify the root View's existing `backgroundColor` — it will be replaced with
  `theme.background.primary` but the View itself must remain
- [ ] Verify the existing ScrollView/FlatList refresh logic is preserved
- [ ] Verify all existing `onPress` handlers are preserved — never silently remove them
- [ ] Verify keyboard avoidance behavior is preserved if screen has inputs

Only after this checklist is complete: make edits as surgical additions.
Never rewrite a screen from scratch. Enhance the existing screen in place.

---

## SECTION 3 — STORE DATA INTEGRATION CONTRACT

New UI components that need live data MUST source it from EXISTING store hooks.

MUST NOT:
- Create new hardcoded values to satisfy a component's data requirements
- Create duplicate state that mirrors existing store state
- Fetch data directly in a UI component if a store already holds it
- Replace a working store selector with a new one that returns the same thing

MUST:
- Import and use the existing store hook
- Pass real data to the new component's props
- Handle loading and empty states explicitly (`0`, `null`, `undefined` from the store)
- If a store value is unavailable, render the safe zero/empty state of the component
  — never skip rendering the component entirely due to missing data

If the store hook you need does not exist yet, you may CREATE a new store.
Never modify an existing store to add data for a visual enhancement — that is
a business logic change dressed as a UI change.

---

## SECTION 4 — DEPENDENCY MANAGEMENT

### Installing New Packages
- You MAY install new additive packages
- Always use: `npx expo install [package]` — never `npm install` or `yarn add` alone
  for Expo-managed packages
- Never upgrade an existing package's version
- Never remove a package from `package.json`
- Never replace one package with another

### Verifying Before Installing
Check if the package is already in `package.json` before installing:
```bash
grep "package-name" apps/mobile/package.json
```
If it exists, use it. Do not install a duplicate or alternative.

---

## SECTION 5 — VERIFICATION GATES

Pass ALL gates before considering any task complete.

**Gate 1 — Functional Regression Check**
After EVERY file edit: "If I deleted everything I just added and left only what
was there before, does the app still work identically?" If NO — fix it before proceeding.

**Gate 2 — Type Safety**
```bash
cd apps/mobile && npx tsc --noEmit
```
Zero errors. Not "the errors were already there." Zero new errors from your changes.

**Gate 3 — Store Integrity**
Verify every existing store hook is importable and returns the same shape.
No store file was modified. All existing call sites of any modified component still compile.

**Gate 4 — Navigation Integrity**
Every route that existed before your changes still exists after.
The tab navigator renders with the same 5 tabs in the same order.

**Gate 5 — Visual Regression Baseline**
Unchanged screens must look identical to before your changes.

**Gate 6 — Lint**
```bash
cd apps/mobile && npx eslint . --ext .ts,.tsx --max-warnings 0
```
Zero new errors introduced by your changes.

---

## SECTION 6 — THE SURGEON RULE

A surgeon operating on a patient's knee does not clean up a birthmark on the
patient's shoulder. The scope is the knee. The shoulder is healthy. Operating
on it introduces risk with zero benefit.

Your operating scope is defined by the task at hand. Everything outside that
scope is a healthy shoulder. Leave it alone.

When you notice something outside scope that could be improved:
→ Write it under **"Out of Scope Observations (for future sessions)"** at the
  end of your response, then leave it completely alone.

---

## SECTION 7 — DELIVERY REPORT FORMAT

At the completion of every implementation task, output this exact report:

```
## Delivery Report

### New Files Created
- [filepath] — [one-line description]

### Existing Files Modified
- [filepath] — [exactly what was added, in one line]

### Existing Files Read But Not Modified
- [filepath] — [why it was read]

### Zero-Touch Files (confirmed unmodified)
- All store files: ✓ unmodified
- All migration files: ✓ unmodified
- All Edge Functions: ✓ unmodified
- All navigation layout files: ✓ unmodified (or: modified ONLY to add TabBar)
- All test files: ✓ unmodified

### Packages Installed
- [package@version] — [reason]

### Verification Gates
- Gate 1 (Functional Regression): ✓ PASS / ✗ FAIL — [detail]
- Gate 2 (Type Safety): ✓ PASS / ✗ FAIL — [detail]
- Gate 3 (Store Integrity): ✓ PASS / ✗ FAIL — [detail]
- Gate 4 (Navigation Integrity): ✓ PASS / ✗ FAIL — [detail]
- Gate 5 (Visual Regression Baseline): ✓ PASS / ✗ FAIL — [detail]
- Gate 6 (Lint): ✓ PASS / ✗ FAIL — [detail]

### Out of Scope Observations (for future sessions)
- [anything noticed but deliberately left alone]
```

This report is not optional. It is the proof of work.

---

## COLOR SYSTEM (Updated 2026-04-27 — Three-Color Brand Language)

### Primary: Purple #A855F7
Use for: CTAs, navigation active states, section headers, primary actions,
default icon containers, card borders, progress bar gradients.

### Secondary: Pink #EC4899
Use for: The R in TRANSFORMR wordmark, partner/couples features, PR
achievements, streak milestones, goal completions, celebration moments,
active/selected states. EXPANDED beyond couples features — used for all
achievement and celebration moments across the app.

### Tertiary: Cyan #06B6D4 (AI Core)
Use for: All AI-powered features — meal camera, form check, coaching
responses, readiness score, AI coach FAB button, AI-generated badges,
correlation insights, water tracking, any feature powered by Claude AI.
Cyan = Claude AI working for the user.

### Functional Colors
- Gold #EAB308 — PRs, records, achievements, revenue displays
- Fire #F97316 — Streaks, momentum, flame icons
- Green #22C55E — Success, completion, logged items
- Amber #F59E0B — Warning, approaching limits
- Red #EF4444 — Missed, broken, errors, danger actions

### Semantic Rules
- Purple = structure and navigation
- Pink = your wins and celebrations
- Cyan = the AI brain working for you

### Brand Gradients
- Primary: #A855F7 → #EC4899 (purple to pink) — main CTAs, hero elements, progress bars
- AI: #06B6D4 → #A855F7 (cyan to purple) — AI features and insights
- Theme tokens: `colors.gradient.purplePink` and `colors.gradient.cyanPurple`

### MANDATORY: Update brand docs on every brand change
Whenever any brand color, typography, or design pattern changes:
1. Update TRANSFORMR-Brand-Identity-Kit.docx in repo root
2. Update this CLAUDE.md color section
3. Update SOUL.md if personality/tone affected
4. Update ARCHITECTURE-DECISIONS.md if it's a permanent decision
An agent reading these files must always get current accurate information.

---

## ADDITIONAL AGENT NOTES

- **Logcat filtering**: Only flag `ReactNativeJS`, `JS ERROR`, `transformr` tags.
  Ignore `WebSocket`, `Metro`, `HMR`, `Packager`, `debugger`, `hot.update`, `socket` noise.
- **Emulator lifecycle**: Never call `adb reboot`. A dedicated agent owns emulator lifecycle.
- **Commits**: One commit per logical phase. Push only when explicitly asked.
- **No console.log**: Never add `console.log` statements to any file.
- **No hardcoded hex colors**: Use theme tokens (`colors.accent.primary`, etc.).
  Exception: comments explaining a value are fine.
- **No `any` type**: Use proper TypeScript types at all times.
- **No emoji as functional icons**: Use Ionicons from `@expo/vector-icons`.

### Task List — ALWAYS VISIBLE
At the bottom of EVERY response, ALL sessions MUST display the current task list in this format:

```
---
TASKS
✅ #N  Task description
🔄 #N  Task description   ← currently working on
⬜ #N  Task description
```

Use TaskCreate at the start of any multi-step job. Use TaskUpdate to mark in_progress/completed as you go.
This is non-negotiable — the user must always be able to see what is being worked on and what remains.

---

## ANTI-REGRESSION GUARDRAILS — PERMANENT RULES FOR ALL SESSIONS

These rules exist because AI agents have repeatedly caused regressions
by removing working functionality during "fixes", "cleanups", and
"optimizations." These regressions have cost the founder over a week
of lost work. Every rule below was written in response to a real incident.

### GOLDEN RULE: ADD AND FIX ONLY. NEVER REMOVE. NEVER DOWNGRADE.

Every session must leave the app with MORE functionality than it started
with, or exactly the same. Never less. There is no exception to this rule.

---

### RULE: NEVER REMOVE FUNCTIONALITY

You MUST NOT, under any circumstance:
- Remove a screen, route, component, or feature
- Remove a button, link, card, or interactive element
- Remove a form field, input, or validation
- Remove a navigation path or menu item
- Remove an import, require(), or asset reference
- Disable, hide, or comment out working code
- Replace a feature with a simpler version
- "Simplify" or "streamline" by deleting capabilities
- Remove error handling, loading states, or empty states

The words "simplify", "clean up", "streamline", "optimize", and
"refactor" are NEVER permission to delete functionality. They mean
"make the existing thing work better while keeping everything it does."

---

### RULE: NEVER REMOVE VISUAL ASSETS

You MUST NOT:
- Remove any require() or import for images, videos, or icons
- Replace an image/video background with a solid color or gradient
- Remove ImageBackground, VideoBackground, or Image components
- Remove animations, transitions, or visual effects
- Remove blur effects, glass-morphism, or overlays
- Downgrade a rich visual element to a plain element
- Remove or change the TRANSFORMR prism icon on any screen
- Remove hero images from onboarding screens
- Remove video files from assets/videos/
- Remove Pexels attribution from login screen

If a screen has a visual asset, it KEEPS that visual asset.

---

### RULE: NEVER DOWNGRADE UI

You MUST NOT:
- Replace a custom component with a basic View/Text
- Remove styling (shadows, gradients, rounded corners, etc.)
- Reduce animation quality or remove micro-interactions
- Remove haptic feedback triggers
- Remove skeleton loading states and replace with blank screens
- Remove empty states and replace with blank lists
- Change dark mode colors to be less polished
- Remove the pillar indicator dots from the login screen
- Remove feature cards or descriptive text from any screen

---

### RULE: NEVER CHANGE WHAT'S NOT BROKEN

If the task is "fix bug X on screen Y":
- Fix ONLY bug X
- Touch ONLY the code related to bug X
- Do NOT "while I'm here" refactor other parts of screen Y
- Do NOT change the layout, styling, or content of screen Y
- Do NOT move, rename, or reorganize files unless that IS the task

---

### RULE: MANDATORY PRE/POST VERIFICATION

Before modifying ANY .tsx file:
1. Read the ENTIRE file
2. Count all require() and import statements for assets
3. Count all Image, ImageBackground, VideoBackground components
4. Record all background colors/gradients/images

After modifying the file:
1. Re-count all of the above
2. If ANY count is LOWER than before your edit, UNDO your change
3. Run TypeScript check to ensure no compilation errors

---

### RULE: MANDATORY DIFF REVIEW BEFORE COMMIT

Before every git add / git commit, check for removed asset references:
```bash
git diff --name-only | xargs grep -l "require\|ImageBackground\|VideoBackground" 2>/dev/null
```

If the diff shows ANY removed asset references, image components,
or video components that were NOT explicitly requested by the user:
- STOP
- Revert those specific changes
- Re-apply your fix without removing the assets

---

### RULE: LOCKED VISUAL ASSETS

These files and their visual assets are PERMANENTLY LOCKED.
See ASSET-MANIFEST.md for the complete mapping.

**Index / Loading Screen (`app/index.tsx`):**
- transformr-icon.png logo
- gym-hero.jpg background

**Register Screen (`app/(auth)/register.tsx`):**
- gym-hero.jpg background
- transformr-icon.png logo

**Login Screen (`app/(auth)/login.tsx`):**
- VideoBackground with 5 pillar videos (fitness, nutrition, sleep, business, mindset)
- Pillar indicator dots
- Pexels attribution text
- transformr-icon.png logo

**Splash Screen (`components/SplashOverlay.tsx`):**
- gym-hero.jpg background
- transformr-icon.png logo

**VideoBackground component (`components/ui/VideoBackground.tsx`):**
- gym-hero.jpg fallback image

**Onboarding (9 screens):**
- gym-hero.jpg → Welcome
- hero-profile.jpg → Profile
- hero-goals.jpg → Goals
- hero-fitness.jpg → Fitness
- hero-nutrition.jpg → Nutrition
- hero-business.jpg → Business (×2 renders)
- hero-partner.jpg → Partner (×2 renders)
- hero-notifications.jpg → Notifications
- hero-ready.jpg → Ready

Modifying these files for bug fixes is permitted. Removing their
visual assets is NEVER permitted.

---

### RULE: SESSION START INVENTORY

Every Claude Code session SHOULD verify file counts at start and end.
If ANY count is LOWER at end than at start, a regression was introduced.

```bash
echo "Routes: $(find apps/mobile/app -name '*.tsx' | wc -l)"
echo "Components: $(find apps/mobile/components -name '*.tsx' | wc -l)"
echo "Services: $(find apps/mobile/services -name '*.ts' | wc -l)"
echo "Stores: $(find apps/mobile/stores -name '*.ts' | wc -l)"
echo "Videos: $(find apps/mobile/assets/videos -name '*.mp4' 2>/dev/null | wc -l)"
echo "Images: $(find apps/mobile/assets/images 2>/dev/null | wc -l)"
```

---

## CONTINUOUS IMPROVEMENT — MANDATORY FOR ALL SESSIONS

### Every Agent Must Read Before Working

At the START of every Claude Code session, before writing any code,
the agent MUST read these files in order:

1. `CLAUDE.md` — Rules, constraints, and guardrails
2. `SOUL.md` — Agent personality, values, and behavioral patterns
3. `apps/mobile/ASSET-MANIFEST.md` — Locked visual assets and screen mappings
4. `apps/mobile/LESSONS-LEARNED.md` — Past mistakes, root causes, and patterns to avoid
5. `apps/mobile/ARCHITECTURE-DECISIONS.md` — Permanent technical decisions

If any of these files don't exist, note it but continue working.

### Every Agent Must Write Before Finishing

At the END of every Claude Code session, before the final commit,
the agent MUST update the relevant governance files with anything
new it learned during the session:

**Update LESSONS-LEARNED.md if:**
- A bug was found that was caused by a previous AI session
- A new failure pattern was discovered
- A workaround was needed for a tool, library, or environment issue
- An assumption was made that turned out to be wrong

**Update ARCHITECTURE-DECISIONS.md if:**
- A technical decision was made that future sessions should respect
- A library was chosen over another for specific reasons
- A pattern was established that should be followed going forward
- A configuration was set that should not be changed

**Update SOUL.md if:**
- A new behavioral rule was established
- A communication pattern was found to be ineffective
- A new constraint on agent behavior was discovered

**Update CLAUDE.md if:**
- A new guardrail or permanent rule was established
- A new locked file or asset was identified
- A constraint was relaxed or tightened by the user

**Update ASSET-MANIFEST.md if:**
- New visual assets were added to any screen
- Asset-to-screen mappings changed
- New screens were created that use visual assets

### How to Write Updates

All updates must follow this format:

```
## [DATE] — [SESSION TYPE] — [BRIEF DESCRIPTION]

**What happened:** [1-2 sentence description]
**Root cause:** [Why it happened]
**Fix applied:** [What was done]
**Rule going forward:** [What future sessions must do/avoid]
```

Updates must be:
- Factual, not vague ("removed image from login.tsx" not "UI issue")
- Actionable (state what to DO or NOT DO, not just what happened)
- Permanent (once written, the rule stays unless the user explicitly removes it)

---

## GUARDRAIL INFRASTRUCTURE (Installed 2026-04-27)

### Pre-Commit Hook
- Script: `scripts/pre-commit-check.ps1`
- Installed at: `.git/hooks/pre-commit`
- Blocks: DEPENDENCY+SOURCE in same commit, NATIVE+SOURCE in same commit
- Blocks: locked file edits without `[locked-edit-approved]` in commit message
- Bypass: `git commit --no-verify` (leaves audit trail in reflog)

### Daily Audit
- Script: `scripts/daily-audit.ps1`
- Usage: `pwsh scripts/daily-audit.ps1` (default: last 24h)
- Checks: multi-domain commits, locked file edits, removed asset references

### Scope Lock Template
- File: `scripts/scope-lock-prompt.md`
- Usage: paste the boilerplate at the top of every Claude Code prompt
- Prevents: agents from modifying files outside declared scope

### Insurance Tag
- Tag: `working-build-2026-04-27`
- Pushed to origin. Restoring: `git checkout working-build-2026-04-27`

---

## SECTION 8 — BRAND SYSTEM REFERENCES

### Canonical brand kit

The canonical brand kit is `apps/mobile/TRANSFORMR-Brand-Identity-Kit.docx`.
All color values, glow specs, AI Coach format rules, notification tiers,
and accessibility requirements live there. Sections 16-19 of the docx
were added in the dashboard v2 build and contain the most recent
additions:

- Section 16 — Light Mode App Surfaces
- Section 17 — Glow System
- Section 18 — AI Coach Format
- Section 19 — Notification Tiers

The repo-root `TRANSFORMR-BRAND-KIT.md` is a deprecation pointer and
should NOT be used as a reference. Read the docx instead.

### Dashboard v2 spec

The dashboard v2 build is governed by `docs/TRANSFORMR-DASHBOARD-V2-SPEC.md`.
This document is the source of truth for layout, dimensions, animation
timing, score formulas, AI integration contracts, and the build prompt
sequence. Any agent working on dashboard v2 components must read the
relevant section of the spec before writing code.

### Light Mode App Surfaces

The locked light mode background color is `#F3EDE8` (warm cream). The
secondary surface for elevated cards is `#FFFFFF`. Do not use the
previous lavender-gray value anywhere in code. The `apps/mobile/theme/colors.ts`
token `light.background.primary` should be `#F3EDE8`.

### Glow System

Cards in the v2 dashboard use one of three domain glows:

- Purple glow (`#A855F7`) — primary actions, scores, default cards
- Pink glow (`#EC4899`) — celebration moments and partner features
- Cyan glow (`#06B6D4`) — AI features and AI-generated content

Pink is no longer "exclusively partner" — it is "celebration plus
partner." Cyan was previously documented with an incorrect hex; the canonical
value is `#06B6D4`. Apply glow sparingly: a maximum of two glow domains
visible on screen at once.

### Accessibility Requirements

All v2 dashboard components must meet:

- Touch targets: minimum 44pt on every interactive element
- Color contrast: WCAG AA (4.5:1 body text, 3:1 large text and UI
  components) against the surface they sit on, in both dark and light
  modes
- Dynamic Type: text scales correctly when the user changes system
  font size
- VoiceOver / TalkBack labels: every interactive element has an
  accessibility label that describes the action, not the visual
- Haptic feedback: present on PR achievements, streak milestones,
  toggle switches, timer completions, and errors — but not on
  passive scroll or navigation
- Reduce Motion: when the OS-level Reduce Motion setting is on,
  spring physics animations collapse to opacity fades only

When in doubt, the spec doc at `docs/TRANSFORMR-DASHBOARD-V2-SPEC.md`
is authoritative.
