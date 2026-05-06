# TRANSFORMR — Architecture Decisions
## Permanent Technical Decisions — Do Not Revisit Without User Approval

These decisions were made deliberately and should not be changed by
AI agents during routine work. If a decision needs to change, the
user must explicitly approve it.

---

## AD-001: Supabase for Backend

**Decision:** Use Supabase for auth, database (PostgreSQL), Edge
Functions, storage, and realtime subscriptions.
**Rationale:** Managed infrastructure, generous free tier, excellent
React Native SDK, built-in RLS for data security.
**Consequence:** All server-side logic goes in Edge Functions (Deno),
not a custom Node.js backend.

---

## AD-002: Zustand for State Management

**Decision:** Use Zustand (not Redux, not MobX, not Context API) for
all client-side state management.
**Rationale:** Minimal boilerplate, excellent TypeScript support,
built-in selectors, no provider wrapper needed.
**Consequence:** All stores in /stores directory. Always use narrowed
selectors (never broad `useStore()`).

---

## AD-003: Expo Router for Navigation

**Decision:** File-based routing via Expo Router v4+.
**Rationale:** Convention over configuration, automatic deep linking,
typed routes, layouts as files.
**Consequence:** All routes defined by file structure in /app directory.
Never use React Navigation directly.

---

## AD-004: Claude AI Exclusively

**Decision:** All AI features use Anthropic Claude API exclusively.
Never OpenAI, never Gemini, never local models.
**Model:** claude-sonnet-4-20250514 for all API calls.
**Rationale:** Founder's company relationship with Anthropic, Claude's
vision capabilities for meal camera / form check / menu scanner.
**Consequence:** Every AI Edge Function calls Claude API. API key
stored in environment variables.

---

## AD-005: Offline-First for Core Logging

**Decision:** Workout sets, meals, water, habits, supplements, weight,
sleep, and mood can all be logged without internet.
**Implementation:** MMKV for fast cache, offline queue for failed
writes, sync on reconnection.
**Rationale:** Users log at the gym, in the kitchen, in bed — all
places with unreliable connectivity.

---

## AD-006: Dark Mode First

**Decision:** Dark mode is the default and primary theme.
**Background:** #0C0A15 (Deep Space), not #0F172A (Slate).
**Rationale:** Fitness apps are used in dim environments (early
morning, evening, gym). Dark mode is easier on the eyes and looks
more premium.

---

## AD-007: TRANSFORMR Brand Kit — Locked

**Decision:** Brand colors, fonts, and visual identity are locked.
- Primary: Vivid Purple #A855F7
- Background: Deep Space #0C0A15
- Pink R accent: #EC4899 on final letter only
- Wordmark on light bg: Deep Violet #2D1B69
- Tagline: "Transform Everything" (no period, no exclamation, no punctuation)
- Fonts: Inter (marketing), System (app)

**Consequence:** Never change these values. They are in the brand kit
and must be consistent across all surfaces.

---

## AD-008: Monetization Tiers

**Decision:** Four subscription tiers:
- Free: basic tracking
- Pro: $9.99/mo — AI features, advanced analytics
- Elite: $14.99/mo — everything in Pro + unlimited AI
- Partners: $19.99/mo — couples features, dual accounts

**Consequence:** FeatureLockOverlay gates Pro+ features. Upgrade page
shows all 4 tiers. Stripe handles payments.

---

## AD-009: Dual Video Slot Architecture

**Decision:** VideoBackground uses a ping-pong dual-slot architecture
with two persistent Video components that crossfade.
**Rationale:** Single-Video-with-key-swap causes GPU decode pipeline
teardown/rebuild = visible flicker. Dual slots eliminate this.
**Consequence:** Never use key={} on Video components to force
remounts. Always crossfade between persistent slots.

---

## AD-010: Windows PowerShell Development Environment

**Decision:** All development happens on Windows with PowerShell.
**Consequence:**
- Use PowerShell syntax where applicable
- Never chain with && in PowerShell (use separate lines)
- The Android emulator runs via WHPX (Windows Hypervisor Platform)
- Use `npx expo install` for Expo-managed packages

---

## AD-011: Three-Color Brand Language (Purple/Pink/Cyan)

**Decision:** TRANSFORMR uses a three-color semantic brand system:
- Purple #A855F7 = Structure, navigation, primary actions
- Pink #EC4899 = Achievements, celebrations, milestones (expanded beyond couples-only)
- Cyan #06B6D4 = AI intelligence, Claude-powered features, data insights
**Rationale:** The cyan color comes from the glowing core of the TRANSFORMR
prismatic mark. It creates a visual signal that "the AI is working for you"
wherever Claude-powered features appear. Pink was expanded from couples-only
to all achievement moments for better brand consistency.
**Consequence:** All AI features (meal camera, form check, readiness score,
AI coach, coaching responses) must use cyan accents. Achievement/PR moments
use pink/gold. Theme tokens: `colors.gradient.purplePink` and
`colors.gradient.cyanPurple`. Old cyan hex `#22D3EE` replaced with `#06B6D4`.

---

## AD-012: Client-Side Exercise Filtering with Predictive Count Badges

**Decision:** Exercise library filtering is done entirely client-side using `useMemo` rather than server-side Supabase queries. All exercises are fetched once on mount with no filters. Filter chips display predictive count badges computed in a single memoized pass.
**Rationale:** The exercise library is small enough to fit in memory (~100 exercises). Client-side filtering provides instant feedback, eliminates network round-trips per filter change, and enables predictive count badges that show how many results each filter option would yield before the user taps. Server-side filtering provided no count preview and caused perceived "zero results" bugs due to sparse data.
**Consequence:** New exercises added via seed migrations appear in filters immediately without code changes. The `fetchExercises` function in workoutStore still supports server-side filtering for other callers but the exercise library screen no longer uses it. Muscle group matching uses OR logic: an exercise matches if its `category` equals the group OR the `muscle_groups` array includes it.

---

## AD-013: Speed Dial FAB Pattern for Workout Player

**Decision:** The workout player uses a Speed Dial FAB (one primary FAB that expands to reveal secondary actions) instead of multiple separate floating buttons. Voice logging, form check, and exercise swap are secondary actions.
**Rationale:** Multiple separate FABs caused collision issues at the bottom of the screen. The speed dial pattern consolidates actions into a single touch point that expands on demand, avoiding overlap with the rest timer panel and bottom action bar.
**Consequence:** Any new workout player actions should be added as speed dial items rather than standalone floating buttons. The VoiceMicButton component is still available for other screens but is not rendered directly on the workout player.

---

## AD-014: Rest Timer as Bottom Panel, Not Fullscreen Overlay

**Decision:** The workout rest timer renders as a 200pt animated slide-up panel positioned above the bottom action bar, rather than a fullscreen overlay.
**Rationale:** The previous fullscreen overlay blocked all interaction during rest periods. Users couldn't review their logged sets, check the exercise queue, or interact with any UI element while resting. The panel approach shows the timer prominently while keeping the exercise card visible and scrollable.
**Consequence:** The rest timer panel uses `react-native-reanimated` spring animations for slide-in/out. It sits at `zIndex: 50` between the content and the bottom bar. The bottom bar's `paddingBottom` uses `insets.bottom + 12` for safe area compliance.

---

## AD-015: Material Library Pinned to 1.11.0

**Decision:** Pin `com.google.android.material:material` to version 1.11.0 via Gradle `resolutionStrategy.force` in `android/app/build.gradle`.
**Rationale:** Material 1.12.0 contains an invalid `<color>` resource at `values.xml:293` that AAPT2 in AGP 8.8.2 cannot compile, causing `mergeDebugResources` to fail. This is a known issue (expo/expo#34566). Pinning to 1.11.0 avoids the incompatible resource.
**Consequence:** The pin lives in the gitignored `android/` directory, so it must be re-applied after every `expo prebuild --clean`. Future Expo SDK upgrades may resolve the upstream incompatibility, at which point this pin can be removed.

---

## AD-016: Notification Service — No Module-Level Side Effects

**Decision:** `services/notifications.ts` must not call any native Expo API at module import time. All initialization (e.g., `setNotificationHandler`) is deferred to first use via a lazy guard function.
**Rationale:** Module-level side effects trigger native module initialization during the JS bundle load phase, before React has mounted. On slow emulator starts or when the notification native module isn't ready, this causes timeouts and log noise. The `_layout.tsx` caller already defers with `InteractionManager.runAfterInteractions`, but the service must also be safe to import without side effects.
**Consequence:** Any new notification service functions that need `setNotificationHandler` configured must call `ensureNotificationHandler()` first. Push token acquisition is wrapped in try/catch and returns null on failure.

---

## AD-017: Detox e2e adoption (Session 2A.1, 2026-05-06)

**Decision:** Detox is the autonomous functional verification tool
for TRANSFORMR React Native bugs going forward. Tests live at
`apps/mobile/e2e/` and run via `npm run detox:test:android` from
`apps/mobile/`.
**Rationale:** Alternatives considered:
- Maestro: simpler setup but treats RN as generic mobile; doesn't
  know about native bridge or React internals.
- Manual ADB-driven verification: not reliable, prone to false
  PASS claims when taps miss intended targets.
- Code-only (tsc + eslint): does not catch runtime worklet errors
  or other RN-specific issues; insufficient for production-grade
  verification.

Detox chosen because it provides deepest RN integration, knows
about native modules, and synchronizes with React render cycles.
**Consequence:** First-time Detox build on Windows is slow (2h 17m
in Session 2A.1 due to native CMake across 4 ABIs); subsequent
builds reuse caches. Detox-instrumented APK is a separate build
profile from the normal dev build, so the operator's
`expo run:android` workflow is unchanged. `@config-plugins/detox`
applies the necessary Android patches during `expo prebuild`.

---

## TEMPLATE FOR NEW DECISIONS

```
## AD-[NUMBER]: [TITLE]

**Decision:** [What was decided]
**Rationale:** [Why]
**Consequence:** [What this means for future work]
```
