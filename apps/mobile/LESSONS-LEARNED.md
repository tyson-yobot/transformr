# TRANSFORMR — Lessons Learned
## Incident Log — Updated by AI Agents After Every Session

This file is a living record of mistakes, surprises, and patterns
discovered during TRANSFORMR development. Every agent must READ this
file at session start and UPDATE it at session end.

---

## 2026-04-27 — Tagline Punctuation Regression

**What happened:** Commit 2745566 updated the brand kit tagline to
"Transform Everything." with a trailing period. The correct tagline is
"Transform Everything" — two words, no period, no exclamation, no
punctuation of any kind. The period was also present in SplashOverlay.tsx,
login.tsx, and index.tsx.
**Root cause:** The TRANSFORMR-BRAND-KIT.md previously had the old tagline
with a period, and the agent copied it verbatim without checking the
user's exact request ("Transform Everything" — no period).
**Fix applied:** Removed the period from all 6 files: CLAUDE.md (×2),
TRANSFORMR-BRAND-KIT.md, ARCHITECTURE-DECISIONS.md, SplashOverlay.tsx,
login.tsx, and index.tsx.
**Rule going forward:** The tagline is EXACTLY "Transform Everything" —
no period, no exclamation, no other punctuation. Hashtag: #TransformEverything.
When the user specifies exact text, use it verbatim. Do not add punctuation.

---

## 2026-04 — Hero Images Stripped from Onboarding

**What happened:** An AI agent "fixed" onboarding screens by removing
the ImageBackground components and hero images, replacing them with
plain dark backgrounds. All 9 onboarding screens lost their visual
identity. This happened MULTIPLE TIMES across different sessions.

**Root cause:** AI agents interpret "fix this bug" as "rewrite this
screen to be cleaner," and their idea of "cleaner" means removing
visual complexity like images and overlays.

**Fix applied:** Restored all 9 hero images via localSource prop.
Created ASSET-MANIFEST.md. Added UI Regression Lock to CLAUDE.md.

**Rule going forward:** Never remove images from screens. If a screen
has an image, it keeps the image. Every edit must count require()
calls before and after. If count drops, undo.

---

## 2026-04 — Icon Path Regressions (3 occurrences)

**What happened:** Multiple sessions changed icon paths incorrectly:
- transformr-favicon.png and transformr-icon.png swapped in wrong contexts
- The linter auto-corrected paths that were already correct
- require() paths pointed to files that didn't exist

**Root cause:** Two icon files exist (favicon = transparent prism for
in-app use, icon = containerized with dark bg for app launcher). Agents
confused which one goes where.

**Fix applied:** Standardized: transformr-icon.png for splash/login/in-app
(transparent, no dark square), icon for app.json launcher only. Locked
in ASSET-MANIFEST.md.

**Rule going forward:**
- `transformr-icon.png` → splash, login, in-app (transparent, no dark square)
- app.json icon fields reference the same transformr-icon.png
- Never swap icon files. Check ASSET-MANIFEST.md if unsure.

---

## 2026-04 — Google OAuth ANR (App Not Responding)

**What happened:** Google sign-in opened Chrome Custom Tab, Google
authenticated successfully, but the app hung indefinitely showing
"TRANSFORMR isn't responding" for 5+ minutes.

**Root cause:** Two compounding bugs:
1. expo-web-browser wasn't in app.json plugins, so Android never had
   the AuthSessionRedirectSingleton activity. openAuthSessionAsync
   waited forever for a signal that never came.
2. WebBrowser.maybeCompleteAuthSession() does nothing on Android
   (web-only). The callback.tsx code that relied on it was ineffective.

**Fix applied:**
1. callback.tsx now reads PKCE code from URL params and calls
   exchangeCodeForSession() directly (works without native build)
2. expo-web-browser added to app.json plugins (takes effect next eas build)

**Rule going forward:** Always verify that Expo plugins are listed in
app.json when using native module features. Test OAuth on Android
emulator specifically — iOS and web behavior differs significantly.

---

## 2026-04 — Zustand Selector Narrowing Timing Issue

**What happened:** After narrowing Zustand selectors in auth files
from broad `useAuthStore()` to individual selectors, Google OAuth
sign-in behavior changed. The session reactivity timing was affected.

**Root cause:** Broad subscriptions re-render on ANY store change,
which coincidentally kept the session watcher reactive. Narrowed
selectors only update when their specific value changes, which can
miss transient state transitions.

**Fix applied:** Individual selectors maintained, but the OAuth flow
was rewritten to not depend on reactivity timing (direct PKCE exchange).

**Rule going forward:** When narrowing Zustand selectors, verify that
auth flows still work end-to-end. Session-dependent navigation is
sensitive to reactivity timing.

---

## 2026-04 — Emulator ANR / System Process Deadlock

**What happened:** The Android emulator showed "Process system isn't
responding" and became completely unresponsive. This happened 3+ times.

**Root cause:** WHPX (Windows Hypervisor Platform) emulator instability:
1. swiftshader_indirect GPU mode is too slow under automated load
2. Corrupted snapshot state from previous sessions
3. Rapid-fire automated interactions overwhelming system_server

**Fix applied:**
1. GPU mode changed to `host` (hardware acceleration)
2. Snapshots disabled, cold boot forced
3. All config.ini files locked read-only to prevent Android Studio
   from overwriting settings
4. 2-second pacing between all automated interactions

**Rule going forward:**
- Always cold-boot emulators (never resume from snapshot)
- Use `host` GPU mode for daily dev, `swiftshader_indirect` only for
  screenshot sessions if host causes screencap issues
- Never fire more than 1 interaction per 2 seconds in automated tests
- After emulator setup wizard, run the bypass commands
- If system ANR occurs: cold boot — don't try to save it

---

## 2026-04 — VideoBackground Flicker (Cutting In/Out)

**What happened:** Login screen video background was cutting in/out
and pixelating. Videos were visually broken during transitions.

**Root cause:** The original VideoBackground component used
`key={currentIndex}` which caused React to unmount/remount the Video
component on every cycle. Each mount = full GPU decode pipeline
teardown and rebuild = visible flicker. Also, video files were
uncompressed (8.2MB total, up to 4000kbps bitrate).

**Fix applied:**
1. Dual-slot ping-pong architecture (A/B slots, never unmount)
2. progressUpdateIntervalMillis=0 (killed 60fps JS bridge flood)
3. React.memo wrapper on the component
4. Video files compressed via ffmpeg: 8.2MB to 2.0MB (76% reduction)
5. H.264 baseline profile, 540x960, 24fps, no audio, faststart flag

**Rule going forward:** Never use `key=` on Video components to force
re-renders. Use opacity crossfade between persistent slots instead.
Always compress video assets for mobile (540p is plenty for backgrounds
behind overlays).

---

## 2026-04 — Corrupted Screenshots Poison Claude Code Context

**What happened:** adb screencap captured corrupted PNGs (GPU pipeline
desync). Claude Code tried to analyze these images, triggering
repeated "Could not process image" API errors on EVERY subsequent
message. The entire session became unusable.

**Root cause:** Once corrupted images enter the Claude Code context
window, they can't be removed. Every message sends the full context
including the bad images, and every response triggers the API error.

**Fix applied:** Started a fresh Claude Code session. Added rule:
"Do NOT capture, read, or analyze any screenshot .png files" when
screenshot reliability is uncertain.

**Rule going forward:** If screencap produces corrupted images (same
file size, dark frames), stop capturing immediately. Switch to
code-level verification instead of visual verification. Never open
or reference .png files in the session after a corruption is detected.
If the session is already poisoned, start a fresh session.

---

## 2026-04 — Supabase Site URL Changed to localhost:3000

**What happened:** An agent changed the Supabase Site URL from 
com.automateai.transformr:// to http://localhost:3000 during a 
development session (likely referral system or web testing work).
This caused Google OAuth to redirect to localhost after authentication,
returning "OAuth state parameter missing" and breaking all social sign-in.

**Root cause:** Agent was testing web flows and set the Site URL to 
localhost without restoring it. The mobile app redirect URL was correct
but the Site URL override caused Supabase to route the callback wrong.

**Fix:** Supabase Dashboard → Authentication → URL Configuration →
Site URL → set back to com.automateai.transformr://

**Rule going forward:** NEVER change the Supabase Site URL. It must
always be com.automateai.transformr:// for the mobile app OAuth flow
to work. If web testing is needed, use Redirect URLs allowlist only —
never change the Site URL.

---

## 2026-04-29 — Equipment Filter Returns Zero Results

**What happened:** Exercise library equipment filter showed 0 results for valid combinations like "abs + dumbbell". Users perceived this as a bug.
**Root cause:** Server-side Supabase query used `.eq('category', ...).eq('equipment', ...)` which correctly returned 0 rows because no abs exercises in the seed data used dumbbells. The real problem was sparse seed data combined with no predictive UI (no count badges, no helpful empty state, no visual feedback before tapping a filter chip).
**Fix applied:** Moved ALL filtering to client-side `useMemo` for instant feedback. Added predictive count badges on every filter chip showing how many exercises match. Chips with 0 count render at 40% opacity and trigger haptic warning. Expanded seed data from 54 to 101 exercises covering all equipment types per muscle group. Changed muscle group matching to OR logic (category equals OR muscle_groups array includes).
**Rule going forward:** When building filter UIs, always show the count of matching results BEFORE the user taps. Never rely on server-side filtering for small datasets that fit in memory. If a filter combination yields 0 results, show that count on the chip rather than a blank screen.

---

## 2026-04-29 — BodyMap Muscle Tiles All Render Identical Purple

**What happened:** All 8 muscle group filter tiles on the exercise library screen rendered as identical purple silhouettes — no visual distinction between chest, back, legs, etc.
**Root cause:** MuscleGroupTile passed per-muscle accent colors (red for chest, blue for back, etc.) via MUSCLE_CONFIG but BodyMap's Figure component always used `colors.accent.primary` (purple) for the SVG fill. The `accentColor` prop didn't exist on BodyMap.
**Fix applied:** Added optional `accentColor` prop to BodyMap that overrides the default purple when provided. MuscleGroupTile now passes its accent color through to BodyMap. Each muscle tile now renders with its own distinct color.
**Rule going forward:** When a parent component has color configuration for a child, verify the color actually reaches the rendering layer. Don't assume a prop is connected end-to-end without tracing the data flow.

---

## 2026-05-03 — Card Component Does Not forwardRef

**What happened:** During autonomous Phase 1 run (Prompt 05, coachmark expansion), the agent needed to attach a ref to a Card component on pain-tracker.tsx for coachmark targeting. The Card component at `components/ui/Card.tsx` does not use `React.forwardRef`, so the ref could not be attached directly.
**Root cause:** Card was written as a standard functional component without forwardRef support. This is not a bug — it just wasn't designed for ref-based targeting.
**Fix applied:** The autonomous agent wrapped the Card in a `<View ref={...}>` to provide the ref target. The View wrapper adds no visual changes (no extra padding, margin, or styling).
**Rule going forward:** When a coachmark or other ref-requiring system needs to target a Card, wrap the Card in a `<View ref={...}>`. Long-term fix: refactor Card to use `React.forwardRef`. Until refactored, all coachmark integrations on Card-wrapped UI must use the View wrapper pattern.

---

## 2026-05-03 — Autonomous Prompts Must Enforce STOP on UI Structure Mismatch

**What happened:** During autonomous Phase 1 run (Prompt 06, help bubbles on gated screens), the prompt assumed all 6 target screens used `FeatureLockOverlay` for paywall gating. Two screens — `form-check.tsx` and `labs/index.tsx` — used different patterns. The autonomous agent correctly noted this mismatch but adapted placement instead of stopping.
**Root cause:** The autonomous prompt described the expected UI pattern ("place HelpBubble before FeatureLockOverlay") but did not include an explicit STOP rule for when a screen's structure doesn't match the assumption. The agent used judgment to adapt, which happened to produce correct results but bypassed the safety net.
**Fix applied:** The adaptations were audited in Phase 1 closeout and found to be reasonable. form-check.tsx shows HelpBubble conditionally when the gate is unavailable. labs/index.tsx shows HelpBubble unconditionally (no gate exists on that screen).
**Rule going forward:** For future autonomous runs, tighten the STOP rule to include: "if a screen's UI structure does not match the prompt's assumption about UI elements, STOP regardless of perceived intent." Adaptation should require Tyson's approval, not agent judgment. The autonomous launcher template should include this rule.

---

## TEMPLATE FOR NEW ENTRIES

Copy this template when adding new incidents:

```
## [DATE] — [SHORT TITLE]

**What happened:** [1-2 sentences]
**Root cause:** [Why it happened]
**Fix applied:** [What was done]
**Rule going forward:** [What future sessions must do/avoid]
```
