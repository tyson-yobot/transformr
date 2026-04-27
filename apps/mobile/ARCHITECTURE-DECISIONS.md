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
- Tagline: "Transform Everything." (period, never exclamation)
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

## TEMPLATE FOR NEW DECISIONS

```
## AD-[NUMBER]: [TITLE]

**Decision:** [What was decided]
**Rationale:** [Why]
**Consequence:** [What this means for future work]
```
