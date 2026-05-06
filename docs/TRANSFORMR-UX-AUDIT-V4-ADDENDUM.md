# TRANSFORMR — V4 Audit Addendum (paste alongside V4)
## Corrections, Conflict Resolutions, and Missing Items Surfaced on Re-Audit

**Read this AFTER `TRANSFORMR-UX-AUDIT-PROMPT-V4.md`.** This document supersedes V4 wherever they conflict. Do **not** discard V4 — this is patch-on-top, not replace.

---

## SECTION A — CRITICAL CONFLICTS FOUND IN V4

### A.1 — Notification tier names and volumes (V4 was WRONG)

V4 locked the tier system as **Off / Light / Standard / Active** with volumes **0 / 3–4 / 6–8 / 10–15**.

This **conflicts with the locked Dashboard v2 spec** at `docs/TRANSFORMR-DASHBOARD-V2-SPEC.md` Section 19, which is the committed source of truth. The Dashboard v2 spec defines:

| Tier | Volume | Includes |
|---|---|---|
| **Quiet** | ~1–2 per day | Streak at risk, partner nudges received, stake-goal critical only |
| **Standard** (default) | ~4–6 per day | All Quiet plus morning briefing, meal reminders, evening check-in, weekly review, achievements |
| **Coach** | ~12–15 per day | All Standard plus hourly water, mid-meal protein nudges, pre/post-workout reminders, energy checks, wind-down prompts, partner activity nudges, approaching-PR alerts |

**Correction:** V4 Section 9.1 is replaced with the table above. Use **Quiet / Standard / Coach** (3 tiers, no Off, no Light, no Active). Default is **Standard**. Coach is opt-in only.

**Why the spec system is right:**
- 3 tiers are easier for users to choose between than 4
- "Quiet" is psychologically more inviting than "Off" — users keep some notifications on instead of muting everything
- Names carry intent ("Coach" = I want help) rather than volume ("Active" = vague)
- Aligns with already-committed brand kit docx update at commit `27145cc`+

If a user wants zero notifications, they get there by setting Quiet tier and toggling each per-category override off. There is no all-the-way-off switch — that's intentional, because the spec philosophy is "the app stays a coach, even at minimum."

### A.2 — Quiet hours timing (V4 was WRONG)

V4 Section 9.3 specified **10 PM – 7 AM (user-adjustable)**. The Dashboard v2 spec Section 19 specifies **00:00 – 06:00 user local time, non-overridable**.

**Correction:** Quiet hours are **00:00 – 06:00** local, **non-overridable**. Users can only narrow them (e.g., 01:00–05:00), never expand or eliminate them. This is an App Store rejection prevention measure.

### A.3 — Notification permission timing (V4 was MISSING)

V4 did not specify when to ask for notification permission. The spec mandates:

> Notification permission is requested **contextually after the user has engaged with the app, never on first launch**.

**Add to V4 Section 9 as new sub-section 9.11:**

The system requests notification permission **only** after one of these triggers:
- User completes their first habit, workout, meal log, or water log (proves engagement)
- User taps "Send me a test notification" in the Notifications Settings screen
- User taps an empty AI Insight card on the dashboard

Never request notification permission on splash, login, onboarding, or first dashboard render. Apple has rejected apps for that pattern.

### A.4 — Phase ordering reconciliation

V4 treated notifications as concurrent scope with the Dashboard v2 build. The Dashboard v2 spec Section 17 (Phase H1) says **notifications get rebuilt post-launch month 1, after v2 dashboard ships**. There is a phase-ordering conflict.

**Correction:** V4 retains the notification spec work (Step 9), **but execution sequencing is:**

1. **Phase A complete** — bug fixes landed at commit `06a26f5`. Re-verify per V4 Step 3.
2. **Phase B (spec)** — produce the spec deliverable per V4 Step 9 with this addendum's corrections applied.
3. **Phase C (build) is conditional on dashboard v2 build status:**
   - If v2 dashboard is **shipped behind feature flag**: build notifications next.
   - If v2 dashboard is **not yet shipped**: build only the **re-engagement notification subset** (24h/48h/72h/7d inactivity recovery + streak protection) immediately, defer the per-category override UI and tier selector to post-v2-dashboard.

The re-engagement subset is the lifeline against churn (the user's stated #1 concern). It must ship even if everything else slips.

### A.5 — Default tier policy clarification (V4 was AMBIGUOUS)

V4 said Standard is default for new users. The spec adds: **"Aggressive defaults destroy retention. Apple has rejected apps for spammy notification patterns."**

**Add to V4:** New users enter at **Standard tier** with **all per-category overrides ON**. The first notification a new user receives must be a low-pressure morning briefing or evening check-in, never an aggressive nudge. The notification copy on Day 1 is intentionally gentler than tier average.

---

## SECTION B — MISSING ITEMS V4 DID NOT COVER

### B.1 — Notification telemetry

V4 did not include telemetry. Master Principles spec mandates telemetry on every behavior surface.

**Add to V4 Step 9 as new sub-section 9.12:**

The notifications system emits the following telemetry events to the existing analytics layer:

| Event | Fields |
|---|---|
| `notification_scheduled` | category, tier, scheduled_at, deep_link |
| `notification_delivered` | category, tier, delivered_at, latency_ms |
| `notification_tapped` | category, tier, time_to_tap_ms, deep_link |
| `notification_dismissed` | category, tier, dismissed_via (swipe/clear/timeout) |
| `notification_skipped` | category, consecutive_skips, downgrade_triggered |
| `notification_settings_changed` | from_tier, to_tier, categories_toggled |
| `notification_permission_granted` | granted_at, trigger_context |
| `notification_permission_denied` | denied_at, trigger_context |
| `inactivity_recovery_fired` | days_inactive, tier, tapped (boolean) |
| `streak_protection_fired` | habit_id, streak_length, completed_after (boolean) |

This data feeds:
- The auto-downgrade logic for category cooldowns
- A future user-facing "Notification Health" insights card showing the user their own delivery and tap-through rates (transparency principle from Master Principles)
- Internal retention analytics

### B.2 — User-facing notification analytics card

The Master Principles transparency principle says users should always see what the system is doing. The current spec hides notification system state from the user.

**Add to V4 Step 9 as new sub-section 9.13:**

Add an "Insights" view inside Profile → Notifications Settings that shows the user:

- How many notifications they received this week (by category)
- How many they tapped vs dismissed
- The tier the system has auto-downgraded any category to (and a one-tap revert button)
- Their average response time per category
- A simple narrative AI summary ("You usually respond to water reminders within 5 minutes — those are working for you")

This is read-only, calm, and non-judgmental. It is not a dashboard for the user to fix; it is a window into the system, consistent with the transparency principle.

### B.3 — "Today's Plan" widget emphasis

The user's headline UX request was: **"days planned, so they can easily see the big picture and easily start workouts, log meals, etc."**

V4 mentions today's plan as one of several above-the-fold elements but does not give it the prominence the user described.

**Add to V4 Step 5 (above-the-fold) and Step 8 (dashboard redesign spec):**

The **Today's Plan card** is the second-largest element above the fold (after the score rings hero per Dashboard v2 spec). It contains, in order, with each line tappable to start the action:

1. Next workout (workout name, primary muscle group, ETA, [Start] button)
2. Next meal slot (window time, calories remaining, [Log Meal] button or [Open Camera] icon)
3. Habits remaining today (count + first 3 names, [Complete] tap)
4. Water remaining (oz, [+ Log] tap)
5. Stake goal status if active (today's task summary, [Mark Done] tap)

Tapping any line **deep-links into the action**, not into the screen that contains the action. "Start Workout" launches the workout player on the right program, not the fitness tab.

The card respects the time-of-day adaptive hero modes from Dashboard v2 spec Section 6.2.A-E: morning emphasizes "what you'll do today," midday emphasizes "what's left," evening emphasizes "what to close out + tomorrow's leverage."

### B.4 — Cross-pillar intelligence visibility

The Master Principles spec covers cross-pillar intelligence (body × wealth × mind × bond correlations). V4 mentions `ai-correlation` Edge Function but does not surface it.

**Add to V4 Step 8 dashboard spec (below-the-fold):**

Add a **Cross-Pillar Insight card** below the goal progress rings. The card surfaces one Claude-generated correlation per week (e.g., "Your bench press goes up 8% on weeks you sleep 7+ hours" or "Your revenue MTD has a 0.7 correlation with your 7-day mood average"). The card has a "Why this?" disclosure showing the data window and confidence level.

### B.5 — Pexels-backed hero imagery

The Dashboard v2 spec specifies Pexels integration for hero imagery on the adaptive hero card. V4 did not reference this.

**Add to V4 Step 8 dashboard spec:**

The adaptive hero card uses Pexels-sourced imagery per Dashboard v2 spec Section 6.2. Image rotation respects:
- Time of day (morning = sunrise, midday = active, evening = wind-down, quiet = soft)
- Coaching tone (drill_sergeant = high-contrast gym, calm = soft natural, balanced = neutral, motivational = victorious)
- Brand color overlay on every image (Vivid Purple `#A855F7` at 25% opacity gradient, never raw photography)

Image cache lives in MMKV. Offline fallback is a brand-tinted gradient.

### B.6 — Accessibility-specific verification

V4 mentioned accessibility but did not include a verification step.

**Add to V4 Step 11 visual sweep:**

In addition to dark + light screenshots, run an accessibility verification per screen:

- VoiceOver / TalkBack narrates every interactive element with a meaningful label
- Dynamic Type at maximum size does not break layout
- Color contrast meets WCAG AA on every text-on-background pair
- All 44pt minimum touch targets verified with overlay grid
- Reduce Motion preference disables all spring animations and replaces with fades

Capture verification in a `screenshots/accessibility/{screen}_a11y_dark_*.png` and `*_light_*.png` pair per screen.

### B.7 — i18n readiness check

The Dashboard v2 spec includes i18n. V4 did not address this.

**Add to V4 Step 11:**

For every new copy string introduced by a remediation:
- Wrap in the existing `t()` translation function
- Verify the string key exists in `apps/mobile/locales/en.json`
- Add a TODO entry in `apps/mobile/locales/_pending-translations.json` (this is allowed; it's the translation pipeline's input, not production code)

### B.8 — Privacy and consent for notifications

The Master Principles spec covers privacy. Notifications carry user data and need explicit privacy rules.

**Add to V4 Step 9 as new sub-section 9.14:**

Notification copy must never expose:
- Partner's full name (use first name only, or "Your partner")
- Specific weight numbers if user is in disordered-eating mode (use trend language)
- Financial figures above a privacy threshold (use trend language: "revenue up this week")
- Lab biomarker specifics (use general language: "your recent labs suggest a check-in")
- Mood scores (use feeling language, not numerics)

Notification payloads sent to FCM/APNS contain only the visible string + a deep link. No user data, no IDs in cleartext beyond the user's own auth token.

### B.9 — Notification "test fire" and "send me an example" flows

V4 mentioned a test button but did not spec the user-facing example flow.

**Add to V4 Step 9 as new sub-section 9.15:**

The Notifications Settings screen includes:
- **"Send me a test notification now"** button — fires one notification of the user's current tier and tone, with a "this is what your notifications will look like" framing
- **"Show me a typical day"** button — opens a preview modal that shows the user a stub of every notification they would receive at their current tier on a representative day (timestamps + previews, scrollable list)

This makes notifications **transparent before they arrive**, addressing the user's transparency requirement.

### B.10 — Re-engagement copy guardrails

V4 specified re-engagement notifications fire at 24h/48h/72h/7d. It did not specify copy guardrails.

**Add to V4 Section 9.5:**

Re-engagement copy at every threshold must:
- Reference the user's actual context (last action taken, current streak, nearest goal)
- Never use guilt or scarcity ("You're losing your streak!") — uses curiosity or invitation instead ("Your 14-day streak is waiting")
- Never reference the partner unless the partner has explicitly engaged in the past 24h
- At the 7-day threshold, include a one-tap "Disable re-engagement" link in the notification's action buttons (not a regular tap — a long-press menu item) so users who don't want it can permanently mute that one category without going into settings

### B.11 — Locked screens explicit re-confirmation

V4 mentioned login/splash/onboarding are locked. The user has restated this multiple times. Make it triple-redundant.

**Add to V4 Section 8 (Out of Scope) and Section 9 (Escalation Rules):**

The following screens are **absolutely locked**. Editing any of them is a P0 escalation that requires explicit user confirmation before any change:

- `apps/mobile/app/(auth)/login.tsx`
- `apps/mobile/app/(auth)/register.tsx`
- `apps/mobile/app/(auth)/forgot-password.tsx`
- `apps/mobile/app/index.tsx` (splash routing)
- All 9 onboarding screens under `apps/mobile/app/(auth)/onboarding/`
- The 9 hero images bound to onboarding per `ASSET-MANIFEST.md`

If a remediation appears to require touching one of these, **stop and escalate** with the proposed change and reasoning. Do not edit without explicit greenlight.

### B.12 — Brand kit docx already updated

V4 did not acknowledge that the brand kit docx update (Phase A1 of v2 build) already landed at commits `27145cc`, `6546ddd`, `7dd1b9b`, `2705b0c`, `f7d17bd`. These updates added Sections 16 (Light Mode), 17 (Glow System), 18 (AI Coach Format), 19 (Notification Tiers) to `apps/mobile/TRANSFORMR-Brand-Identity-Kit.docx`.

**Correction:** V4 Step 1 list of source-of-truth documents must include `apps/mobile/TRANSFORMR-Brand-Identity-Kit.docx` Sections 16–19 alongside the markdown brand kit at `TRANSFORMR-BRAND-KIT.md`.

### B.13 — Dashboard v2 build prompt count

V4 said "Prompts 1–24 unfinished." The latest spec intel says **Prompts 1–21**, not 1–24. Phases beyond 21 are post-launch (Phase H+).

**Correction:** V4 Step 13 prompt pack list — the orchestrator prompt is named `21-dashboard-v2-prompts-1-thru-21-execution.md` (not `1-thru-24`).

### B.14 — Notification heartbeat principle

The Master Principles spec includes "notification heartbeat" — a low-volume always-on signal that the app is alive and watching. V4 did not surface this.

**Add to V4 Section 9 as new sub-section 9.16:**

Even at Quiet tier with all per-category overrides off, the system fires **one** "heartbeat" notification per week: a Sunday afternoon weekly review notification. This is the floor. It cannot be disabled except via the OS notification settings (system-level mute), and that disablement is logged for the auto-downgrade telemetry. The heartbeat ensures the app does not go silent and stays mentally present in the user's notification tray once a week.

This is the operational equivalent of an open-heart EKG line. It says: "the app is here, watching, ready."

---

## SECTION C — MERGE INSTRUCTIONS

When the agent runs the audit:

1. Read V4 first.
2. Read this addendum second.
3. Where they conflict, **this addendum wins.**
4. Where this addendum adds new sections (B.1 through B.14), they slot into V4 at the indicated location.
5. Final deliverable saves to `/mnt/user-data/outputs/TRANSFORMR-UX-AUDIT-V4.md` and includes both V4 and this addendum's content merged.
6. Save this addendum verbatim to `/mnt/user-data/outputs/TRANSFORMR-UX-AUDIT-V4-ADDENDUM.md` for traceability.

The agent confirms in Step 1 of the Spec Coverage Map that it has read this addendum. If it has not, escalate.

---

## SECTION D — REPLAY CHECKLIST FOR USER

Before pasting V4 + addendum into Claude Code, confirm the following are committed to the repo:

- [ ] `docs/specs/TRANSFORMR-MASTER-PRINCIPLES.md` (commit `fd0e764`)
- [ ] `docs/TRANSFORMR-DASHBOARD-V2-SPEC.md` (commit `6e67e0f`)
- [ ] `docs/audit/NOTIFICATIONS-AUDIT-2026-04-30.md`
- [ ] `docs/audit/FEATURE-WIRING-AUDIT-2026-04-30.md`
- [ ] `docs/audit/TRANSFORMR-UX-AUDIT-V2.md`
- [ ] All 12 prompts under `docs/ux-remediation-prompts/`
- [ ] `apps/mobile/TRANSFORMR-Brand-Identity-Kit.docx` Sections 16–19 (commits `27145cc` through `f7d17bd`)
- [ ] Phase A notification bug fixes (commit `06a26f5`)

Run:
```powershell
cd C:\dev\transformr
```
```powershell
git log --oneline -20
```

If any of the above shorthashes are not in the log, escalate before running the audit.

---

*End of addendum. Append to V4 in the next Claude Code session.*
