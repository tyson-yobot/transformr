# TRANSFORMR — Lessons Learned
## Incident Log — Updated by AI Agents After Every Session

This file is a living record of mistakes, surprises, and patterns
discovered during TRANSFORMR development. Every agent must READ this
file at session start and UPDATE it at session end.

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

## TEMPLATE FOR NEW ENTRIES

Copy this template when adding new incidents:

```
## [DATE] — [SHORT TITLE]

**What happened:** [1-2 sentences]
**Root cause:** [Why it happened]
**Fix applied:** [What was done]
**Rule going forward:** [What future sessions must do/avoid]
```
