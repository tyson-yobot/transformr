# TRANSFORMR Dashboard v2 — Build Specification

**Version:** 1.0
**Date:** April 2026
**Author:** Tyson + Claude (collaborative spec)
**Status:** Awaiting Tyson's review and sign-off
**Build approach:** Parallel build behind feature flag, no edits to existing dashboard

---

## SECTION 0 — SOURCE OF TRUTH

This document is a derived artifact. It does not invent values. Every color, font, dimension, and rule referenced here originates from one of these files in the repo:

| Source | Authority over |
|---|---|
| `TRANSFORMR-Brand-Identity-Kit.docx` | Brand colors, typography, voice, photography, animations, prohibitions |
| `apps/mobile/theme/colors.ts` | Theme tokens used in code (`colors.dark.*`, `colors.light.*`) |
| `CLAUDE.md` | Governance rules for agents — must match brand kit |
| `transformrfavicon.png` | The prismatic mark — visual embodiment of the three-color system |

If any of those files change, **this spec is stale**. Update the files of record first, then update this document. Never the other way around.

The brand kit `.docx` and `colors.ts` currently disagree on the light mode app surface (kit doesn't specify it, code says `#F3F1F8`). Section 4 of this spec resolves that gap by adding a "Light Mode App Surfaces" subsection to the brand kit. That brand kit update is **Prompt 1**, before any dashboard code is written.

---

## SECTION 0.5 — SCALE TARGET

This dashboard ships to 100,000+ users. Every decision in this spec is hardened for that scale. Specifically:

- **Performance budgets are non-negotiable** — see Section 12.5. Mid-range Android (Galaxy A-series, Pixel 6a) is the floor, not the ceiling.
- **Accessibility is a build requirement, not a polish phase** — see Section 19. WCAG 2.2 AA compliance is verified on every component before commit.
- **Localization scaffolding ships from Prompt 1** — see Section 20. No hardcoded user-facing strings.
- **Telemetry instruments every meaningful interaction** — see Section 21. We do not ship code we cannot measure.
- **Staged rollout is mandatory** — see Section 22. v2 reaches 100% of users only after measurable success at 5%, 25%, and 50%.
- **Offline-first is enforced at the dashboard level** — see Section 23. The dashboard renders meaningfully without network connectivity.
- **Data privacy is verified, not assumed** — see Section 24. Financial data, partner data, and AI inputs are protected at rest and in transit.

A senior engineer reviewing this spec should be able to predict, before writing code, exactly how the dashboard will behave at the 99th percentile load, the 1st percentile device, and the 50th percentile user with accessibility needs.

---

## SECTION 1 — PRINCIPLES

These are the design north stars for every decision in dashboard v2. If a build prompt produces code that violates one of these, reject the result and redo the prompt.

**Transparency over hiding.** Every goal, stat, and metric the user has should be visible from the dashboard, not buried behind taps. Empty states for unstarted features, not hidden cards. The user sees their whole life on one screen.

**The day is held for them.** The hero adapts to time of day — morning shows what's coming, midday shows progress, evening shows reflection. The user opens the app and the app already knows what part of their day they're in. They never have to "find the right screen."

**Hand-holding through the AI Coach.** Every dashboard view contains one Claude-generated coaching message in the format "winning at / focus on / try this." It tells the user what's working, what needs attention, and one specific next action. Never generic advice.

**Brand language is ambient.** Purple (structure), pink (celebration), cyan (AI) appear in every glow, every accent, every gradient. The user feels the brand without needing to read logos. Color carries meaning.

**Speed of action wins.** Every primary task is one tap away — log a workout, log a meal, log weight, send a partner cheer, start a deep work block. The dashboard is not a feed to read; it is a control room to act from.

**No regressions.** v2 builds alongside v1. The existing dashboard stays working until v2 is verified. Users opt in via a settings toggle until ship is approved.

---

## SECTION 2 — SCOPE OF THIS SPEC

**In scope:**
- The Today (dashboard home) tab — full visual + behavioral spec
- The bottom tab bar — Today / Body / Wealth / Mind
- The cyan AI FAB button in the tab bar center
- Brand kit and CLAUDE.md updates required to align documentation with the new visual direction
- File structure and build order for the parallel v2 implementation
- Notification system tier definitions (Quiet / Standard / Coach)

**Out of scope (deferred to future specs):**
- The Body, Wealth, Mind tab dashboards (v2 of those tabs will follow this spec's patterns but be specified separately)
- The Profile/Settings screens
- Onboarding flow changes
- The drag-and-drop dashboard customization affordance (v2 ships with smart defaults; full builder is a separate feature)
- Image asset selection from Pexels API (the integration is specified; the actual photo curation is a separate task)

---

## SECTION 3 — THREE-COLOR SEMANTIC SYSTEM

### Brand color rules

The TRANSFORMR brand uses three colors with strict semantic meaning. These rules come from the brand kit `.docx` v2.0 update and apply to every screen in the app, not just the dashboard.

**Purple `#A855F7` (dark) / `#7C3AED` (light) — Structure**
- Navigation active states
- Primary CTAs
- Section headers
- Card borders and default glows
- Progress bar backgrounds and fills (paired with pink in gradients)
- The "begin day" / "log now" / "tomorrow's plan" buttons

**Pink `#EC4899` (dark) / `#DB2777` (light) — Celebration & Partner**
- The R in TRANSFORMR wordmark
- Partner avatars, couples strip, "cheer" buttons
- PR achievements, milestone unlocks, streak flame
- Stake goal "$ at risk" indicators
- Gradient end-stops (purple → pink for primary CTAs)

**Cyan `#06B6D4` (dark) / `#0891B2` (light) — AI Intelligence**
- The AI Coach insight strip — left bar gradient + label color
- The cyan FAB button at the bottom tab center
- Body↔Wealth correlation cards (when surfaced)
- AI badges on AI-generated content
- The "wind down" button in evening hero (cyan → purple, AI is recommending the action)

### Brand gradients

Two canonical gradients, both in `colors.ts`:

| Token | Hex | Use |
|---|---|---|
| `gradient.purplePink` | `#A855F7 → #EC4899` | Primary CTAs, hero buttons, completion ring fills, score ring strokes |
| `gradient.cyanPurple` | `#06B6D4 → #A855F7` | AI feature buttons, FAB, AI Coach left bar, "wind down" button |

Direction: always left-to-right or top-to-bottom. **Never reverse** (per brand kit prohibition: "Never use the brand gradient in reverse").

### Functional colors

For success/warning/danger states only. These never carry brand semantic weight.

| Color | Dark | Light | Use |
|---|---|---|---|
| Success Green | `#22C55E` | `#059669` | Positive deltas, "+11" gains, "day complete" |
| Warning Amber | `#F59E0B` | `#D97706` | Approaching limits |
| Danger Red | `#EF4444` | `#DC2626` | Below target, missed, broken streak |
| Fire Orange | `#F97316` | `#EA580C` | Streak flame icon (paired with pink in streak displays) |
| Gold | `#EAB308` | `#CA8A04` | PR badges, achievement tiers |

---

## SECTION 4 — THEME SURFACES

### Dark mode (canonical from brand kit)

```
background.primary        #0C0A15    Deep Space — main app background
background.secondary      #16122A    Surface — page tertiary
background.tertiary       #1E1838    Surface Light — input fields
background.elevated       #2D2450    Highest surface (modals)
cardBg                    #13111C    Card surfaces (slightly different from `secondary`)
cardElevated              #1A1726    Modals, elevated cards

text.primary              #F0F0FC
text.secondary            #9B8FC0
text.muted                #6B5E8A
text.inverse              #0C0A15

separator                 rgba(168, 85, 247, 0.18)   Hairline dividers
border.default            #2A2248
border.focus              #A855F7
```

### Light mode (NEW — locked in this spec, not yet in brand kit)

```
background.primary        #F3EDE8    Lavender-cream — main app background
background.secondary      #FFFFFF    White cards
background.tertiary       #F8F4F0    Slightly elevated surface
background.elevated       #FFFFFF    Modals (same as cards)
cardBg                    #FFFFFF    Card surfaces

text.primary              #1A1530    Deep purple-black, warmer than pure black
text.secondary            #4A3F6B    Medium purple-gray
text.muted                #7B6FA0    Slightly darker for readability
text.inverse              #F0F0FC

separator                 rgba(124, 58, 237, 0.14)   Hairline dividers
border.default            #CBC4E0
border.focus              #7C3AED
```

**Light mode color shifts (already in `colors.ts`, kept as-is):**

The brand colors darken in light mode for WCAG AA contrast on the cream background:
- Purple: `#7C3AED` (instead of `#A855F7`)
- Pink: `#DB2777` (instead of `#EC4899`)
- Cyan: `#0891B2` (instead of `#06B6D4`)
- Success: `#059669` (instead of `#22C55E`)
- Danger: `#DC2626` (instead of `#EF4444`)

These are **not new colors** — they're contrast-corrected versions of the brand colors for the light surface. The semantic meaning is identical.

---

## SECTION 5 — GLOW SYSTEM (NEW — locked in this spec)

The glow system gives every card on the dashboard a colored halo that encodes its semantic domain. This is the visual mechanic that makes the brand "ambient."

### Glow assignment rules

The glow color is determined by the card's domain, not its position:

| Card | Domain | Glow color |
|---|---|---|
| Hero card (4 score rings + adaptive content) | Structure (whole-life overview) | Purple |
| AI Coach insight strip | AI intelligence | Cyan |
| Couples / Bond strip | Partner / celebration | Pink |
| Stake Goal | Achievement / wins | Pink |
| Today's Habits (6-circle row) | Structure (consistency framework) | Purple |
| Weight | Structure (body domain) | Purple |
| Revenue MTD | Structure (wealth domain) | Purple |
| Sleep last night | Structure (mind/recovery domain) | Purple |
| Deep Work | Structure (focus discipline) | Purple |
| Body↔Wealth correlation card (conditional) | AI intelligence | Cyan |

**Most cards glow purple by default.** Pink and cyan are scarce — pink for celebrations and partner moments only, cyan for AI-generated content only. That scarcity makes them meaningful when they appear.

### Glow specs

**Light mode glows:**

| Domain | Box-shadow value |
|---|---|
| Purple | `0 6px 22px rgba(124, 58, 237, 0.20), 0 2px 6px rgba(45, 27, 105, 0.08)` |
| Pink | `0 6px 22px rgba(219, 39, 119, 0.22), 0 2px 6px rgba(45, 27, 105, 0.08)` |
| Cyan | `0 6px 22px rgba(8, 145, 178, 0.24), 0 2px 6px rgba(45, 27, 105, 0.08)` |

Cyan gets a touch more intensity (0.24 vs 0.20) because cyan is naturally less saturated to the eye than purple/pink — it needs the boost to feel equally present.

**Dark mode glows:**

| Domain | Box-shadow value |
|---|---|
| Purple | `0 0 0 0.5px rgba(168, 85, 247, 0.30), 0 6px 24px rgba(168, 85, 247, 0.20), 0 2px 8px rgba(0,0,0,0.4)` |
| Pink | `0 0 0 0.5px rgba(236, 72, 153, 0.30), 0 6px 24px rgba(236, 72, 153, 0.22), 0 2px 8px rgba(0,0,0,0.4)` |
| Cyan | `0 0 0 0.5px rgba(6, 182, 212, 0.30), 0 6px 24px rgba(6, 182, 212, 0.24), 0 2px 8px rgba(0,0,0,0.4)` |

The first `0 0 0 0.5px` line in dark mode is a faint hairline border — gives cards a defined edge against Deep Space `#0C0A15`.

### New theme tokens to add to `colors.ts`

```typescript
// In colors.ts under both dark and light:

shadow: {
  // ... existing shadow.card, cardStrong, cardSubtle remain ...
  glowPurpleCard: { /* the box-shadow above for purple */ },
  glowPinkCard:   { /* the box-shadow above for pink */ },
  glowCyanCard:   { /* the box-shadow above for cyan */ },
}
```

These tokens make the glow system available throughout the app, not just the dashboard.

---

## SECTION 6 — DASHBOARD ANATOMY

This section defines the dashboard layout top-to-bottom. Pixel measurements are starting points; final values may shift in implementation but the proportions and ordering are locked.

### 6.1 Status bar (~50px)

Fixed at top of scroll. Always visible.

**Left:**
- Date in caps small format: `{DAY-OF-WEEK-ABBREV} · {MONTH-ABBREV} {DAY-OF-MONTH}` — e.g., "WED · APR 29" (11px, 500 weight, letter-spacing 0.6px, color: text.secondary). Format string lives in `lib/dateFormat.ts` and respects user locale.
- Greeting on next line — pulled from `utils/greetings.ts` library, never hardcoded. (14px, 500 weight, color: text.primary)

**Right:**
- Streak pill: rounded 999px pill, background `streakBg`, color `streakColor`, contains "▲ 14" (the flame icon and streak count). Padding 5px × 11px. Font 11px / 500 weight.
- Avatar circle, 34px diameter, gradient `purple → pink`, contains user's first initial in white.

**Greeting source:** `utils/greetings.ts` — pulls a time-slot-appropriate greeting from the existing greeting library. The greeting library stays untouched. Examples:
- Late night (12am-6am): "Sleep is not weakness. It is how you come back stronger, [name]."
- Early morning (6am-9am): "Hustle harder than yesterday, [name]."
- Mid-morning (9am-11am): "Your morning, your move, [name]."
- Midday (11am-2pm): "Halfway there, [name]."
- Afternoon (2pm-6pm): "Strong second half, [name]."
- Evening (6pm-9pm): "Good evening, [name]."
- Night (9pm-12am): "Wind down strong, [name]."

The greeting and the time-of-day mode (Section 7) are independent — the greeting changes more granularly than the hero mode.

### 6.2 Adaptive Hero (~360-440px)

The hero is the centerpiece. It mutates by time of day. All three modes share the same top section (the four score rings) and differ only in the section below.

**Shared top: 4 score rings (~120px)**
- 4-column grid, 8px gap
- Each ring: 66px diameter, 3px stroke, gradient stroke based on score
- Score number centered (17px / 500 weight, color: text.primary)
- Label below ring (10px, uppercase, letter-spacing 0.5px, color: text.secondary)
- Labels in order: BODY · WEALTH · MIND · BOND
- Track color: `ringTrack` (purple at low opacity)
- Stroke gradient: purple → pink for Body, Wealth, Mind, Bond (in light mode use light variants)

**Score calculation (composite definitions — locked in this spec):**

All inputs are normalized to 0-100 before applying weights. Weights sum to 1.0 per score. Final value rounded to integer.

- **Body** = `(sleepScore × 0.30) + (workoutStreakPct × 0.25) + (mobilityMinutesPct × 0.15) + (weightTrendPct × 0.15) + (moodScore × 0.15)`
- **Wealth** = `(revenuePct × 0.40) + (deepWorkPct × 0.30) + (customerAcqPct × 0.20) + (financeHealthPct × 0.10)`
  - where `revenuePct = min(100, (revenue_mtd / monthly_target) × 100)` — capped at 100 so over-target months don't unbalance the composite
  - where `deepWorkPct = min(100, (deep_work_hours_today / target_hours) × 100)`
- **Mind** = `(sleepQuality × 0.25) + (moodScore × 0.25) + (focusSessionPct × 0.20) + (journalStreakPct × 0.15) + (mobilityRecoveryPct × 0.15)`
- **Bond** = `(partnerStreakPct × 0.40) + (couplesWorkoutPct × 0.30) + (nudgeEngagementPct × 0.15) + (jointMilestonesPct × 0.15)` — defaults to N/A if no partner connected, NOT 0

**Important:** Bond defaults to N/A (greyed ring with "+" icon to invite partner), never 0. A score of 0 implies failure; N/A correctly signals "feature not engaged."

These formulas are **starting points** and live in a single `lib/scores.ts` file. Tunable. Not hardcoded inline.

#### 6.2.A Morning mode (06:00-10:59 user local time)

Below the score rings:
- 0.5px separator, color: `separator`
- Section header: "Today's plan" (13px, 500 weight) + count badge "5 events" (10px, color: text.secondary)
- 5 plan rows, vertically stacked. Each row is ~28px tall:
  - Time on left: "07:00" (10px, monospace, color: text.secondary, width 38px)
  - Color bar: 4px wide, 20px tall, color matches event domain (purple for workout, pink for meal, cyan for deep work, purple for sleep)
  - Label: "Push workout · 45m" (12px, color: text.primary, flex: 1)
  - Checkbox circle on right: 18px diameter, 1.5px border (text.muted), unchecked initial state
- "Begin day →" CTA button (full-width, 13px / 500, gradient `purple → pink`, 11px radius, drop-shadow with brand color)

**Plan row interaction:** tap any row to start that activity. Tap the checkbox to mark complete (fills with gradient, becomes pink solid pill on completion).

#### 6.2.B Midday mode (11:00-17:59 user local time)

Below the score rings:
- 0.5px separator
- Section header: "Live progress · [current time]" (13px, 500 weight) + completion badge "3 of 5 done" (10px, color: pink, 500 weight)
- 4 progress bars stacked vertically, each ~24px tall:
  - Calories: "1,240 / 2,400 kcal" with progress bar fill
  - Protein: "88 / 170g"
  - Water: "56 / 100 oz"
  - Steps: "6,820 / 10,000"
- Bar fill: 6px tall, gradient `purple → pink`, 3px radius
- Bar track: `progressBg` (low-opacity purple)
- Numbers right-aligned (11px, monospace, current value in text.primary, target in text.secondary)
- "Log now" CTA button (full-width, gradient, drop-shadow)

#### 6.2.C Evening mode (18:00-23:59 user local time)

Below the score rings:
- 0.5px separator
- Section header: "Day reflection" (13px, 500 weight) + completion pill "Day complete" if all rings closed (10px, color: success green, on 18% opacity success bg)
- AI-narrated reflection paragraph (12px, line-height 1.6, color: text.primary)
  - 2-3 sentences, Claude-generated
  - References specific data: "Body up +11" with success green color
  - Format: acknowledge → identify weak link → preview tomorrow's leverage
- Two CTA buttons side-by-side, each flex: 1, 8px gap:
  - "Tomorrow's plan" (outline button, transparent bg, 0.5px border, color: text.primary)
  - "Wind down" (gradient `cyan → purple`, drop-shadow with cyan color)

#### 6.2.D Quiet mode (00:00-05:59 user local time)

Hero displays in **evening reflection style** but the AI Coach below is silent (no new insight generated). Users opening the app between midnight and 6 AM see yesterday's reflection. No "begin day" prompt at 3 AM.

Notifications **do not fire** during quiet hours regardless of tier setting. This is non-overridable.

#### 6.2.E First-time user mode (Day 0 — locked override)

When a user has zero workout, meal, weight, sleep, OR habit data points (their first app open after onboarding), the hero ignores the time-of-day mode and renders a **welcome hero** instead:

- Score rings show "—" in center, gray track, no animation
- Below rings: "Welcome to your transformation, [name]"
- Body text: "Your dashboard fills in as you log. The more you tell it, the smarter it gets. Start with one thing — your weight, a meal, or how you slept last night."
- Three CTAs side-by-side, each Pink filled button:
  - "Log weight"
  - "Log a meal"
  - "Log sleep"
- Tap any → opens that logging flow. After first log, dashboard switches to time-appropriate mode on next render.

This mode persists until the user has logged ANY data point. It is independent of time of day. Day 0 users at 3 AM still see the welcome hero, not Quiet mode.

#### 6.2.F Sparse data mode (Days 1-6 — soft override)

When the user has logged some data but fewer than 3 data points in the last 7 days, the hero adopts **encouragement copy** in the AI Coach strip:

- "You're winning at:" → references the one thing they did log ("starting — you logged your first meal yesterday")
- "Focus on:" → "consistency. Log one more thing today."
- "Try this:" → specific minimum-effort action ("snap a photo of your next meal — takes 5 seconds")

This mode auto-resolves once the user hits 3+ data points in a rolling 7-day window. The hero modes (morning/midday/evening) still apply; only the AI Coach copy adjusts.

### 6.3 AI Coach insight strip (~110px)

Always visible directly below the hero. Cyan domain.

**Visual:**
- Background: `cardBg` (white in light, `#13111C` in dark)
- Glow: cyan
- Padding: 14px, with extra 4px on left for the cyan gradient bar
- Rounded 14px corners
- Left edge: 4px wide vertical bar, gradient `cyan → purple`, full height
- Top row: 18px prism icon (cyan stroke) + "AI COACH" label (11px, uppercase, letter-spacing 0.6px, color: cyan)
- Body: 12px, line-height 1.55, color: text.primary

**Content format (locked):** Three parts in this exact order, each on its own line.

1. **"You're winning at:"** [observation about strength] — colored with cyan label
2. **"Focus on:"** [the weak link with actual data] — colored with pink label
3. **"Try this:"** [one specific action] — bold label, body in primary text

Example morning content:
> **You're winning at:** nutrition (5/5 days on target).
> **Focus on:** sleep — 5h 17m last night.
> **Try this:** lights out by 10:30 tonight, no screens after 10. Readiness back to green by Friday.

The AI Coach text comes from the `ai-coach` Supabase Edge Function, which receives the user's recent data (last 7 days) and returns the three-part response. Format is enforced server-side via system prompt, not parsed from free text.

**Refresh cadence:** every 90 minutes during active hours, OR on user pull-to-refresh. Not on every app open (would burn API credits).

**AI hallucination prevention (CRITICAL — hard requirement):**

Claude can fabricate numbers ("your protein is 280g" when it's actually 88g). Three layers of protection:

1. **Server-side data injection** — the `ai-coach` Edge Function builds a system prompt with the user's actual data. It does NOT pass natural language for Claude to interpret. Numbers come from queries, not chat history.
2. **Server-side validation** — before returning the AI response, the Edge Function regex-extracts any numbers from the response text and validates each against the source data (within 10% tolerance for derived metrics, exact match for raw values). If validation fails, the response is rejected and a deterministic template is used instead.
3. **User-visible disclaimer (subtle)** — long-press on the AI Coach strip shows "Numbers come from your logs. Tap to view sources." Tapping opens a sheet listing which user data points fed the insight.

**Tone variation by time of day:**

The Edge Function uses a different system prompt segment per mode:

- **Morning mode prompt suffix:** "Frame guidance as preparation. Future-tense verbs. Action words: prepare, set up, prime, ready."
- **Midday mode prompt suffix:** "Frame guidance as adjustment. Present-tense verbs. Action words: adjust, refuel, recover, recalibrate."
- **Evening mode prompt suffix:** "Frame guidance as reflection and tomorrow's leverage. Past + future tense. Action words: closed, finished, won; tomorrow, next, when you wake."

This makes the AI Coach feel like the same coach speaking with different rhythms throughout the day, not three separate voices.

**Thin-data fallback (fewer than 3 logged data points in last 7 days):**

The AI Coach degrades gracefully:

- "You're winning at:" → acknowledges the small wins ("you opened the app today")
- "Focus on:" → consistency ("logging is the bottleneck — once data flows, your coach gets sharp")
- "Try this:" → minimum-effort ("snap a photo of your next meal")

Server-side check: if the user has < 3 data points in last 7 days, the Edge Function uses the thin-data system prompt template, NOT the standard one. This is determined server-side from data counts, not from the client.

**Permanent fallback (Edge Function unavailable):**

If the Edge Function returns 500 or times out (>3 seconds), the strip shows a deterministic message based on local data:

- "You're winning at: [most-improved metric in last 7 days from local cache]"
- "Focus on: [least-logged domain in last 7 days from local cache]"
- "Try this: [contextual action from a 30-prompt local table indexed by mode and weak domain]"

This means the dashboard never shows a broken AI Coach state. The user gets value even when AI is down.

### 6.4 Couples / Bond strip (~70px)

Always visible. Pink domain. Hidden cleanly if no partner is connected (replaced by an invite CTA — see Section 9).

**Visual:**
- Background: `cardBg`
- Glow: pink
- 4px wide vertical bar on left, color: pink
- Two stacked avatar circles (30px diameter), -8px overlap
- Both avatars wear gradient `purple → pink` for user, `pink → purple` for partner (subtle visual distinction)
- Partner avatar has 2px border in `avatarBorder` (page background color) for separation
- Center text:
  - Line 1: "Danyell · streak 14d" (12px, 500 weight, color: text.primary)
  - Line 2: status text (11px, color: text.secondary), e.g., "Active in Push Day · 22 min" / "Just woke up · planning her day" / "Wound down · streak preserved"
- Right: "Cheer" button — pill (7px × 14px padding), gradient `purple → pink`, white text 11px / 500

**Tap behavior:**
- Tap the strip → opens partner dashboard
- Tap "Cheer" → fires a partner_nudge with cheer payload, shows micro-animation, button disabled for 30 seconds

### 6.5 Widget Grid (variable height, ~440px for default 6 widgets)

2-column grid, 10px gap. Smart-default ordering. All widgets visible by default (transparency principle).

**Default widget order (top to bottom):**

1. **Stake Goal** (full-width, span 2) — Pink glow domain
2. **Today's Habits** (full-width, span 2) — Purple glow domain
3. **Weight** (1 column) + **Revenue MTD** (1 column) — both Purple glow
4. **Sleep last night** (1 column) + **Deep work** (1 column) — both Purple glow

**Widget specs are in Section 8.**

**"+ customize" row** appears at the bottom of the widget grid (~35px tall). Tappable. Opens the customization sheet (deferred feature — not built in v2 first ship; hardcoded order for now).

### 6.6 Bottom tab bar (~80px including FAB)

Fixed at bottom of screen. Always visible.

**Visual:**
- Background: `tabBarBg` — white in light mode, `#16122A` in dark
- Border-top: 0.5px hairline in `separator` color
- Drop-shadow above for elevation: `0 -4px 16px rgba(124, 58, 247, 0.08)` light / `0 -2px 12px rgba(0,0,0,0.4)` dark

**5 zones, evenly spaced:**

| Position | Tab | Icon | Label | Color when active |
|---|---|---|---|---|
| Far left | Today | Filled square | "Today" | Pink |
| Left-center | Body | Outline square | "Body" | Pink |
| Center | FAB (not a tab) | "+" | — | Cyan-purple |
| Right-center | Wealth | Outline square | "Wealth" | Pink |
| Far right | Mind | Outline square | "Mind" | Pink |

**FAB button:**
- 50px diameter circle
- Background: gradient `cyan → purple` (135deg)
- White "+" symbol, 24px / 300 weight
- Box-shadow with cyan glow: `0 0 24px rgba(8, 145, 178, 0.45)` light / `0 0 20px rgba(6, 182, 212, 0.55)` dark
- Margin-top: -18px (overlaps the tab bar visually)
- Tap action: opens the AI quick-actions sheet (camera / mic / barcode / search / +)

**Active tab visual:** filled icon (replaces the outline square with a solid one), label color shifts from `tabInactive` to pink. Underline indicator deferred (subtle is better here than busy).

---

## SECTION 7 — TIME-OF-DAY ADAPTATION

### Mode cutoffs (locked)

| Time range (user local) | Mode | Hero content |
|---|---|---|
| 06:00 - 10:59 | Morning Plan | Today's plan with 5 events |
| 11:00 - 17:59 | Midday Progress | 4 progress bars + Log Now |
| 18:00 - 23:59 | Evening Reflection | AI-narrated day review + tomorrow/wind-down CTAs |
| 00:00 - 05:59 | Quiet (Evening visual) | Yesterday's reflection, AI silent, no notifications |

### Mode determination rule

The mode is determined by **app open time**, not constantly recalculated. If the user opens the app at 10:55 AM in morning mode, the dashboard stays in morning mode until they:

- Background the app for >10 minutes and re-foreground (recheck mode)
- Pull-to-refresh the dashboard (recheck mode)
- Manually navigate away and back (recheck mode)

Avoids the user thinking the app is broken when content changes mid-scroll at 11:00:01.

### Mode transition animation

When the mode changes (typically only on app re-open), the hero crossfades over 600ms:

1. Old hero content fades out: opacity 1 → 0 over 200ms
2. Old content removed from layout
3. New content rendered with opacity 0
4. New hero fades in: opacity 0 → 1 over 400ms with subtle slide-up (translateY 8px → 0)

Score rings (top section of hero) **do not crossfade** — they're shared across all modes and persist. Only the section below them transitions.

### User opt-out (Settings)

Settings > Dashboard > "Adaptive hero" toggle. When OFF, the dashboard always uses Morning Plan layout regardless of time of day. Default ON.

---

## SECTION 8 — WIDGET CATALOG

Each widget has a default state (with data) and an empty state (no data yet). Empty states are critical to the transparency principle — they tell the user the feature exists.

### 8.1 Stake Goal widget

**Domain:** Pink glow

**With data:**
- Header: "STAKE GOAL · 180 lbs by Oct 27" (10px uppercase, color: text.secondary)
- Pill on right: "$500 at risk" (11px, white text, gradient `purple → pink` background)
- Progress bar: 8px tall, gradient fill, 4px radius, current at 33%
- Bottom row: "147 lbs" (left, primary text, bold) · "33 lbs to go · 181 days" (center, text.secondary) · "180 lbs" (right, text.secondary)

**Empty state (no stake goal set):**
- Header: "STAKE GOAL"
- Body: "Put real money on your transformation. Set a stake, hit your goal, get it back. Miss it, it's gone."
- CTA: "Set up stake goal →" (purple button)

### 8.2 Today's Habits widget

**Domain:** Purple glow

**With data:**
- Header: "TODAY'S HABITS" + count "3 of 6" (text.primary)
- Row of 6 habit circles, 38px diameter, 8px gaps, evenly distributed
- Each circle:
  - Done state: gradient `purple → pink` fill, white check icon, pink box-shadow glow
  - Undone state: 1.5px border in `separator` color, transparent bg, no icon
- Label below each circle (9px, color: text.secondary), e.g., "Sleep · Cal · Pro · H₂O · Gym · Read"

**Empty state (fewer than 1 habit defined):**
- Header: "TODAY'S HABITS"
- Body: "Track 6 daily habits to see your consistency over time."
- CTA: "Add your first habit →"

### 8.3 Weight widget

**Domain:** Purple glow

**With data:**
- Header: "WEIGHT"
- Big number: "147.2" (20px / 500 weight, monospace)
- Subtitle: "↓ 0.4 vs last week" (11px, color: success green)

**Empty state:**
- Header: "WEIGHT"
- Body: "Log your weight to see trends and stake-goal progress."
- CTA: "Log first weight →"

### 8.4 Revenue MTD widget

**Domain:** Purple glow

**With data:**
- Header: "REVENUE MTD"
- Big number: "$24.8k" (20px / 500 weight, monospace)
- Subtitle: "↑ 18% vs last month" (11px, color: success green)

**Empty state:**
- Header: "REVENUE MTD"
- Body: "Connect Stripe or log revenue manually to track business momentum."
- CTA: "Add revenue source →"

### 8.5 Sleep widget

**Domain:** Purple glow

**With data:**
- Header: "SLEEP LAST NIGHT"
- Big number: "5h 17m" (20px / 500 weight, monospace)
- Subtitle: "↓ below target" (11px, color: danger)

**Empty state:**
- Header: "SLEEP LAST NIGHT"
- Body: "Log sleep manually or connect Apple Health / Google Fit."
- CTA: "Set up sleep tracking →"

### 8.6 Deep Work widget

**Domain:** Purple glow

**With data:**
- Header: "DEEP WORK"
- Big number: "2h 14m" (20px / 500 weight, monospace)
- Subtitle: "Today" (11px, color: cyan when active deep-work session, otherwise text.secondary)

**Empty state:**
- Header: "DEEP WORK"
- Body: "Track focused work sessions to see when you do your best work."
- CTA: "Start first session →"

### 8.7 Body↔Wealth Correlation card (CONDITIONAL)

**Domain:** Cyan glow

This card appears **only when the correlation engine has detected a meaningful pattern in the last 14 days**. Otherwise hidden entirely (not shown as empty state).

**Position:** Between AI Coach strip and Couples strip (when present).

**With pattern detected:**
- Header: "BODY ↔ WEALTH CORRELATION" (11px, 500 weight, color: text.primary)
- Body: "Last 14 days: sleep above 7.5h correlates with **+18% deal-close rate**." (11px, color: text.secondary, with the +18% in pink)
- Confidence label: appended to body, on its own line. Format: "**[Strength label]** ([percentage]% confidence)" — e.g., "**Strong pattern** (74% confidence)" or "**Emerging pattern** (52% confidence)"
- Strength labels mapped to Pearson r values:
  - r ≥ 0.7 → "Very strong pattern" (~85-95% confidence)
  - r ≥ 0.55 → "Strong pattern" (~70-85% confidence)
  - r ≥ 0.4 → "Emerging pattern" (~55-70% confidence)
  - r < 0.4 → card not surfaced
- Cyan glow

**Why confidence labels:** correlations can reverse over time as user behavior changes. If the AI says "+18% deal-close rate" with no caveat and the pattern weakens next month, the user thinks the AI was wrong. With a "Strong pattern (74% confidence)" framing, the user understands this is observed signal, not absolute prediction. This protects long-term trust in AI insights.

**Trigger conditions for surfacing:**
- ≥14 days of data in BOTH a body metric and a wealth metric
- Pearson correlation coefficient ≥0.4 (positive or negative)
- Statistical significance threshold (p < 0.05)
- Minimum effect size (e.g., +10% or more on the wealth metric)

The detection logic lives in the `ai-correlation` Edge Function, runs daily, and updates a `user_correlations` table. The widget reads that table; the AI doesn't generate this on every app open.

---

## SECTION 9 — STATES (EVERY COMPONENT)

For every visual component on the dashboard, there are states that must be designed before code is written.

### Score rings (Body / Wealth / Mind / Bond)

| State | Visual |
|---|---|
| With data | Score number, gradient stroke filled to pct |
| Loading | Skeleton: gray pulsing track only, no number |
| No data | "—" in center, gray track, label visible |
| Bond — no partner | Greyed-out ring, "+" icon center (tap → invite flow) |

### AI Coach strip

| State | Visual |
|---|---|
| Generated | Three-part insight |
| Loading | Skeleton: 3 lines of pulsing gray bars |
| Error | "AI Coach is taking a moment. Pull to refresh." (text.secondary) |
| Quiet hours (00:00-05:59) | Hidden — strip removed from layout |
| No data yet (new user) | "Log a workout, meal, or sleep — your AI coach starts working from your first entry." |

### Couples strip

| State | Visual |
|---|---|
| Partner connected, active | Avatars, status, "Cheer" |
| Partner connected, idle | Avatars, "Last logged 2h ago" |
| No partner | Replaced with invite card: "Invite Danyell to TRANSFORMR" + Pink CTA "Send invite" |
| Partner pending invite | "Waiting on Danyell to accept" + "Resend invite" link |

### Widget tiles

Each widget has its own with-data and empty-state per Section 8. Additionally:

| State | Visual |
|---|---|
| Loading | Skeleton: gray pulsing bars for each text element |
| Error (single widget) | Card content replaced with: "Couldn't load. Tap to retry." |
| Stale data (>24h old) | Subtle "Last updated yesterday" caption appended below subtitle |
| Network offline (all widgets) | Show last-cached data with a single page-level banner: "Offline — showing your last sync." Banner appears below status bar, dismissable. Per-widget error states do NOT show during offline state. |
| Server error 5xx (all widgets) | Show last-cached data with banner: "TRANSFORMR servers are having a moment. Your data is safe." |

**Critical rule:** Never show 6 error cards simultaneously. If more than 2 widgets fail at the same time, switch to the page-level banner pattern instead. The dashboard must remain useful in degraded states.

---

## SECTION 10 — NOTIFICATIONS

Three tiers, user-configurable in Settings. Default = Standard.

### Tier definitions

**Quiet (minimal — for users who want no nagging):**
- Streak at risk (within 4 hours of midnight if no log today)
- Partner nudge received from Danyell
- Stake goal critical (final 7 days, off-pace)
- That's it. ~1-2 notifications/day max.

**Standard (default — balanced):**
- All Quiet notifications
- Morning briefing (7:30 AM, customizable): "Good morning. Today is Push Day. Macros: 2,400 cal / 170g protein."
- Meal reminders (3x/day at user's mealtime windows)
- Evening check-in (10:00 PM): "Time for your nightly check-in. 3 minutes."
- Weekly review (Sunday 10:00 AM)
- Achievement unlocks
- ~4-6 notifications/day

**Coach (full hand-holding — 12-15/day):**
- All Standard notifications
- Hourly water reminders (during active hours only)
- Mid-meal protein nudges if behind target
- Pre-workout reminder (30 min before scheduled gym time)
- Post-workout log reminder (15 min after)
- Mid-day macro check
- Late-afternoon energy check ("How's your readiness?")
- Pre-bedtime wind-down ("60 min until your sleep window. Wind down.")
- Partner activity nudges ("Danyell just started Push Day")
- Streak protection alerts
- Approaching-PR alerts
- Body↔Wealth correlation insights (1-2/week)

### Notification quiet hours

**00:00-06:00 user local time** — no notifications fire regardless of tier. Non-overridable. Brand voice rule: TRANSFORMR doesn't wake people up.

### Tier change UX

Settings > Notifications > Tier picker (radio: Quiet / Standard / Coach). Change takes effect immediately. Show a one-line description of what's included in the chosen tier as a confirmation.

---

## SECTION 11 — IMAGE-BACKED CARDS (Pexels integration)

Per the locked decision: image-backed cards pull from Pexels API.

### Implementation pattern

A new Edge Function `image-fetch` proxies Pexels API requests. The mobile client never holds the Pexels API key — it's stored in Supabase secrets and the Edge Function authenticates server-side.

**Function signature:**
```
GET image-fetch?query=<term>&orientation=portrait&size=medium
→ { url, photographer, photographer_url, alt_text }
```

**Caching:** the Edge Function caches results in a `pexels_cache` table for 30 days. Same query in 30 days returns the cached URL without hitting the Pexels API. This keeps API usage under Pexels' free tier (200 req/hr, 20K req/month).

**Rate limit + cold-start protection (CRITICAL for 100K users):**

At 7 AM Eastern, ~30K users may open the app simultaneously. Naive implementation would burst the Pexels API instantly.

- **Pre-warmed cache:** the most common 50 queries (5 widget categories × 10 photo variants each) are pre-warmed in the `pexels_cache` table on Edge Function deploy. Cold-start cache misses for the standard queries are functionally zero.
- **Per-user rotation:** instead of every user getting the same photo, the cache stores 10 variants per query. Each user is assigned variants by `user_id % 10`, distributing load and providing per-user variety.
- **Circuit breaker:** if Pexels API returns 429 (rate limit) 3 times in a row, the Edge Function trips a circuit and serves only cached results for 15 minutes. New cold queries return null; widgets fall back to brand-color cardBg.
- **Daily budget cap:** the function tracks daily API usage in a `pexels_quota` row. At 90% of daily budget, only critical queries (new widget categories) hit the API; rest serve from cache or fall back.
- **Graceful degradation:** if image fetch fails for any reason, the widget renders without an image. Empty state UI is identical to "data exists, image unavailable" — never blocks the data display.

**Pexels API key:** stored in Supabase secrets as `PEXELS_API_KEY`. Never appears in client code, app bundle, or git history. Rotation procedure: update secret, restart Edge Function, no app deploy needed.

**Card image categories:**

| Card | Pexels query | Notes |
|---|---|---|
| Stake Goal | "fitness transformation gym" | Filtered to dark/moody per brand kit photography rule |
| Weight | "scale measuring tape" | Macro shot, dark background |
| Revenue MTD | "laptop business analytics" | Dark theme, dim lighting |
| Sleep | "moon night sky bedroom" | Atmospheric, dark |
| Deep Work | "focused workspace dim lighting" | Cyan or purple light tones |

### Image overlay treatment

Every Pexels image gets a brand-color overlay on top to maintain visual coherence. The overlay must let the photo contribute meaningfully — not obscure it.

**Two-layer overlay system:**

1. **Top layer — color wash (low opacity, full coverage):** maintains brand atmosphere
   - Dark theme: `linear-gradient(135deg, rgba(45, 27, 105, 0.35), rgba(12, 10, 21, 0.45))`
   - Light theme: `linear-gradient(135deg, rgba(45, 27, 105, 0.30), rgba(74, 63, 122, 0.35))`

2. **Bottom layer — text-readability gradient (only behind text):** ensures text is always readable
   - `linear-gradient(180deg, transparent 0%, transparent 50%, rgba(12, 10, 21, 0.75) 100%)`
   - Text sits in the bottom 40% of the card; the gradient only darkens that zone
   - Photo remains visible in the top 60% of the card

This gives the photo 50-65% visibility (was 8-15%) while keeping text legible. The photo actually contributes to the card's identity now.

**Photography style enforcement:** queries include "dark moody atmospheric" tags. The brand kit photography rule applies — never bright/clinical/white-walled. If a returned photo doesn't match (manual review during dev), swap the query or use the secondary `photographer-curated` query alternative.

**Image loading state:** while the Pexels image is loading, the card displays the brand-color cardBg with a 1-second animated shimmer (subtle gradient sweep), not a blank surface. Image fades in over 200ms when ready.

### Attribution

Pexels requires photographer credit. Each image card has a long-press affordance that shows: "Photo by [photographer] on Pexels" with a tap to open the photographer's profile. Not visible by default — surfaced only when user investigates.

### Empty state for image-backed widgets

When a card is in empty state (no data yet), the image background **does not** load. Empty states use the standard cardBg color only. Image backgrounds are an enhancement to data-rich states, not a substitute for missing data.

---

## SECTION 12 — ANIMATIONS

All animations follow brand kit Section 12 rules. **No confetti, sparkles, or cartoon effects** (per brand kit prohibition).

### Spring physics on every interaction

`react-native-reanimated` springs, never linear easing. Default config:

```typescript
const springConfig = {
  damping: 18,
  stiffness: 200,
  mass: 1,
};
```

### Standard timings

| Type | Duration | Use |
|---|---|---|
| Button press | 100ms | Scale 1.0 → 0.96, haptic light |
| Button release | 200ms | Scale 0.96 → 1.0, spring |
| Tab switch | 250ms | Spring underline indicator |
| Hero mode crossfade | 600ms | 200ms fade out + 400ms fade in with translateY |
| Widget load | 350ms | Spring scale 0.95 → 1.0 with opacity 0 → 1 |
| Pull-to-refresh | 400ms | Spring rotation, then content reload |
| Modal open | 350ms | Slide-up with spring damping 16 |

### Celebration sequence (per brand kit)

When the user completes a habit, hits a PR, closes a ring, or unlocks an achievement:

1. **Haptic impact (medium)** — instant
2. **Element scales to 1.15× over 200ms** — spring
3. **Brand-color glow radiates outward** — opacity 0 → 0.4 over 200ms, then 0.4 → 0 over 200ms (400ms total)
4. **Element scales back to 1.0× over 300ms** — spring with slight overshoot
5. **Settles with gentle bounce** — final 100ms

Total duration: ~600-1000ms. Color of glow matches the celebration's domain (pink for partner/PR, purple for habit completion, cyan for AI-detected milestone).

**Explicitly forbidden:** confetti, sparkle particles, cartoon stars, bouncy text, rainbow effects.

### 12.5 Performance budgets (HARD requirements)

These are non-negotiable. Performance regressions are commit blockers.

**Frame rate targets:**

| Scenario | Device floor | Target FPS |
|---|---|---|
| Dashboard scroll | iPhone 12 / Pixel 7 | 60 |
| Dashboard scroll | iPhone SE / Pixel 6a | 50+ |
| Dashboard scroll | Galaxy A52 (mid Android) | 45+ |
| Mode crossfade transition | All targets | 60 |
| Hero animation on mount | All targets | 60 (drop to 30 acceptable on first paint only) |

**Memory budget:**

- Initial dashboard load: under 80MB total app memory
- After 10 minutes of normal use: under 120MB (no leaks)
- Image cache cap: 30 image bytes total (~3MB at 100KB each); LRU eviction beyond that

**Time-to-interactive:**

- Cold start to dashboard interactive: < 2.5 seconds (iPhone 12 / Pixel 7)
- Cold start to dashboard interactive: < 4 seconds (Galaxy A52)
- Subsequent app opens (warm): < 800ms

**Glow shadow optimization (the biggest perf risk):**

`box-shadow` with blur on every card is expensive. With 9+ cards on the dashboard, naive implementation drops frames on mid-range Android.

Mitigations:

1. **Use `react-native-shadow-2`** for cross-platform consistent shadows that perform better than native shadow props on Android
2. **`shouldRasterizeIOS={true}`** + **`renderToHardwareTextureAndroid={true}`** on every cardShell wrapper — caches the shadow as a bitmap after first render
3. **Detect device performance class** at boot (via `expo-device`'s performance class API):
   - `high` (iPhone 12+, Pixel 7+, Galaxy S22+): full glow with 22px blur radius
   - `medium` (iPhone XR, Pixel 6a, Galaxy A52): reduced glow with 14px blur radius
   - `low` (iPhone SE 2020-, Pixel 5a, Galaxy A32-): solid border instead of blur, no glow
4. **Reduce-motion accessibility setting**: when ON, glow simplifies to a 1px solid border (same color, no blur). This affects the visual intentionally — a11y users get a faster, simpler dashboard.

The `usePerformanceClass()` hook centralizes this detection. Cards consume it via `useGlow(domain)` which returns the appropriate shadow style for the device.

**Animation queue management:**

- Maximum 3 concurrent celebration sequences. If a 4th fires, it queues behind the third with 100ms stagger.
- Score ring fill animations stagger 50ms apart (Body → Wealth → Mind → Bond) to spread GPU load.
- Glow pulse on hero card pauses while user is actively scrolling (resumes 200ms after scroll stops).

**Bundle size budget:**

- v2 dashboard total bundle contribution: under 150KB (gzipped)
- No new dependencies > 50KB without explicit approval
- Shared components (CardShell, EmptyState, SkeletonLoader) must be tree-shakable

**Verification:**

Every prompt that adds rendering work runs the React DevTools profiler on a Galaxy A52 emulator (slowest target device) and reports:
- Time-to-render of the affected screen
- Number of components re-rendering on a typical state change
- Whether any component takes > 16ms to render (frame budget)

If any number exceeds budget, the prompt is rejected.

### Cyan AI core pulse (FAB button)

Per brand kit Section 8 — the cyan core breathes:

- Opacity oscillates between 0.7 and 1.0
- Scale oscillates between 1.00× and 1.02×
- Cycle duration: 3-4 seconds
- Easing: ease-in-out
- Respects user's "reduce motion" accessibility setting (when reduce-motion is ON, pulse stops)

### Score ring fill animation

When score rings render (on app open or pull-to-refresh):
- Stroke dasharray animates from 0 to target percentage over 800ms
- Easing: cubic-bezier(0.4, 0, 0.2, 1) (Material standard)
- Score number counts up from 0 to target value over 600ms (parallel with stroke)

### Glow pulse on hero card (subtle)

The hero card's purple glow oscillates very subtly:
- Box-shadow opacity: cycles between 0.18 and 0.22 over 6 seconds
- Easing: ease-in-out
- Respects reduce-motion accessibility setting

This is the "ambient brand presence" mechanism. Barely perceptible. The user feels it, doesn't notice it (per brand kit rule).

---

## SECTION 13 — FILE STRUCTURE

Parallel build pattern — new files in `v2/` folders, old files untouched.

```
apps/mobile/
├── app/
│   └── (tabs)/
│       ├── dashboard.tsx              ← UNTOUCHED (existing v1)
│       └── dashboard-v2.tsx           ← NEW (v2 entry point)
│
├── components/
│   └── dashboard/
│       └── v2/                        ← ALL NEW v2 components live here
│           ├── HeroAdaptive.tsx       ← orchestrates morning/midday/evening
│           ├── ScoreRing.tsx          ← single ring primitive
│           ├── CompactScoreRow.tsx    ← row of 4 rings
│           ├── PlanTimeline.tsx       ← morning's plan rows
│           ├── ProgressBars.tsx       ← midday's progress bars
│           ├── ReflectionCard.tsx     ← evening's AI reflection
│           ├── AICoachStrip.tsx       ← cyan AI insight panel
│           ├── CouplesStrip.tsx       ← pink partner row
│           ├── CorrelationCard.tsx    ← conditional cyan correlation
│           ├── WidgetGrid.tsx         ← layout container
│           ├── widgets/
│           │   ├── StakeGoalWidget.tsx
│           │   ├── HabitsWidget.tsx
│           │   ├── WeightWidget.tsx
│           │   ├── RevenueWidget.tsx
│           │   ├── SleepWidget.tsx
│           │   └── DeepWorkWidget.tsx
│           ├── ImageBackedCard.tsx    ← shared base for Pexels-backed cards
│           └── shared/
│               ├── CardShell.tsx      ← glow + radius wrapper
│               ├── EmptyState.tsx     ← shared empty-state component
│               └── SkeletonLoader.tsx ← shared loading skeleton
│
├── hooks/
│   └── dashboard/
│       └── v2/
│           ├── useScores.ts           ← composite Body/Wealth/Mind/Bond
│           ├── useTimeOfDay.ts        ← mode determination
│           ├── useAICoach.ts          ← Edge Function caller
│           ├── usePexelsImage.ts      ← image-fetch caller with cache
│           └── useFeatureFlag.ts      ← v2 toggle reader
│
├── lib/
│   └── scores.ts                      ← score calculation formulas
│
├── theme/
│   └── colors.ts                      ← UPDATED with light mode + glow tokens
│
└── supabase/
    └── functions/
        ├── ai-coach/                  ← winning at / focus on / try this
        ├── ai-correlation/            ← daily Body↔Wealth detector
        └── image-fetch/               ← Pexels proxy with cache
```

### Feature flag reader

`useFeatureFlag('dashboard-v2')` reads from a `user_settings` table or local MMKV. Default: false (off). User flips it on in Settings > Developer > "Use new dashboard."

When false: `(tabs)/index.tsx` renders the existing `dashboard.tsx`.
When true: `(tabs)/index.tsx` renders the new `dashboard-v2.tsx`.

The router/tab structure does not change. Only the leaf component swaps.

---

## SECTION 14 — BUILD ORDER (24 prompts)

This is the order of Claude Code prompts. Each is tightly scoped, sub-100 lines of diff, with the scope-lock template at the top. Each is verifiable in 30 seconds. Each rolls back cleanly.

### Phase A — Brand kit synchronization (4 prompts, no app code touched)

**Prompt 1: Update brand kit `.docx`**
- Add Section 5.1 "Light Mode App Surfaces" with the locked values (`#F3EDE8`, `#FFFFFF`, glow specs)
- Add Section 12.1 "Glow System" with the domain assignment rules
- Add Section 4.1 "AI Coach Format" with the winning at / focus on / try this format
- Add Section 4.2 "Notification Tiers" with Quiet / Standard / Coach definitions
- Add Section 11.1 "Light Mode AI Cyan" specifying `#0E7490` for label use (a11y contrast fix)
- Single file edit. Verifiable by reading the resulting docx.

**Prompt 2: Update `TRANSFORMR-BRAND-KIT.md`**
- Sync to match the docx exactly OR convert to a deprecation pointer
- Fix cyan hex from `#22D3EE` to `#06B6D4` (drift correction)
- Fix pink semantics from "exclusively partner" to "celebration + partner" (drift correction)
- Single file edit.

**Prompt 3: Update `CLAUDE.md`**
- Verify color section matches docx
- Add light mode app surfaces subsection
- Add glow system rules subsection
- Add reference to the dashboard v2 spec doc location
- Add accessibility verification rule for new components
- Single file edit.

**Prompt 4: Update `apps/mobile/theme/colors.ts`**
- Update `light.background.primary` from `#F3F1F8` to `#F3EDE8`
- Add new tokens: `glowPurpleCard`, `glowPinkCard`, `glowCyanCard` for both dark and light
- Add `light.accent.cyanText` = `#0E7490` for accessibility-compliant cyan label
- Single file edit. Highest blast radius of the brand kit phase. **Visual regression review on all 50+ screens before proceeding.**

### Phase B — Foundation infrastructure (4 prompts)

**Prompt 5: Create i18n scaffolding**
- Install `i18n-js` (or use existing if present)
- Create `apps/mobile/locales/en.json` with all dashboard strings
- Create `apps/mobile/lib/i18n.ts` with translation hook `useTranslation()`
- Create `apps/mobile/hooks/useGreeting.ts` that reads from `utils/greetings.ts` AND wraps in i18n
- ~80 lines.

**Prompt 6: Create telemetry hook scaffolding**
- Create `apps/mobile/hooks/useDashboardTelemetry.ts`
- Wraps existing analytics service (find it first — could be Mixpanel, Amplitude, or Supabase)
- Defines all event types from Section 21
- Single hook with typed event functions
- ~80 lines.

**Prompt 7: Create performance class detection**
- Create `apps/mobile/hooks/usePerformanceClass.ts`
- Reads device performance class via `expo-device`
- Returns `'high' | 'medium' | 'low'`
- Create `apps/mobile/hooks/useGlow.ts` that consumes performance class + domain → returns shadow style
- ~70 lines.

**Prompt 8: Create v2 folder structure + `CardShell.tsx`**
- Create the folder hierarchy from Section 13
- Build `CardShell.tsx` — the glow + radius wrapper that every v2 card uses
- Props: `domain: 'purple' | 'pink' | 'cyan'`, `children`, `style?`, `accessibilityLabel?`, `onPress?`
- Picks glow shadow via `useGlow(domain)`
- Two states: default and pressed (slight scale 0.98)
- Includes `shouldRasterizeIOS` and `renderToHardwareTextureAndroid` for perf
- ~80 lines.

### Phase C — Foundation primitives (3 prompts)

**Prompt 9: Build `ScoreRing.tsx` and `CompactScoreRow.tsx`**
- ScoreRing: 66px diameter, gradient stroke, score number + label
- Props: `score: number`, `label: 'Body' | 'Wealth' | 'Mind' | 'Bond'`, `size?: number`, `previousScore?: number`
- Animated stroke fill on mount (800ms cubic-bezier, staggered 50ms each ring)
- Accessibility: `accessibilityRole="progressbar"`, `accessibilityValue={{ now, min: 0, max: 100 }}`, `accessibilityLabel` includes domain + delta
- Respects reduce-motion
- CompactScoreRow: 4-column grid, 8px gap, renders all 4 rings with stagger
- ~120 lines.

**Prompt 10: Build `EmptyState.tsx` and `SkeletonLoader.tsx`**
- Shared components for empty/loading states across all widgets
- EmptyState props: `title`, `body`, `ctaText?`, `onCtaPress?`, `iconName?`
- SkeletonLoader: pulsing gray bars at configurable widths/heights, respects reduce-motion (static when on)
- All strings translated via i18n
- ~80 lines combined.

**Prompt 11: Build connectivity indicator**
- New component `ConnectivityBar.tsx` per Section 23
- Reads online state via `@react-native-community/netinfo`
- 3px tall bar at top of dashboard, just below status bar
- States: hidden / syncing / offline / synced
- Tap to expand → sync queue status modal
- ~100 lines.

### Phase D — Hero modes (5 prompts)

**Prompt 12: Build `WelcomeHero.tsx` (Day 0 + first-time user)**
- The override hero for users with zero data
- 3 CTAs: "Log weight", "Log a meal", "Log sleep"
- Hidden once any data exists
- Strings via i18n
- ~80 lines.

**Prompt 13: Build `PlanTimeline.tsx`**
- Morning mode's plan rows
- Props: `events: PlanEvent[]`, `onEventTap`, `onEventToggle`
- 5 rows max, each with time / color bar / label / 18px checkbox with hitSlop for 44pt target
- Accessibility: each row is a `button` role with full description in label
- Mock data only at this stage
- ~120 lines.

**Prompt 14: Build `ProgressBars.tsx`**
- Midday mode's 4 progress bars
- Props: `metrics: ProgressMetric[]` (label, current, target, unit)
- Each bar: label/value row + 6px gradient fill bar
- Animated fill on mount (600ms ease-out, respects reduce-motion)
- Accessibility: each bar is a `progressbar` role with `accessibilityValue`
- Mock data only
- ~100 lines.

**Prompt 15: Build `ReflectionCard.tsx`**
- Evening mode's AI reflection
- Props: `narrative: string`, `dayComplete: boolean`, `onTomorrowPlan`, `onWindDown`
- Renders the paragraph with inline color spans for "+11" etc.
- Two CTAs side-by-side
- Mock narrative string for now (AI integration in Phase F)
- ~100 lines.

**Prompt 16: Build `HeroAdaptive.tsx` (orchestrator)**
- Reads time of day via `useTimeOfDay` hook
- Reads first-time-user state via `useUserDataStatus` hook
- Renders `<CompactScoreRow />` (always, except WelcomeHero state)
- Below it, conditionally renders `<WelcomeHero />`, `<PlanTimeline />`, `<ProgressBars />`, or `<ReflectionCard />` based on state and mode
- Animates between modes on focus change (reduce-motion aware)
- Fires telemetry on mode change
- ~120 lines.

### Phase E — Strips and widgets (4 prompts)

**Prompt 17: Build `AICoachStrip.tsx`**
- Cyan domain card
- Props: `winningAt: string`, `focusOn: string`, `tryThis: string`, `loading?: boolean`, `error?: boolean`, `mode: 'morning' | 'midday' | 'evening'`, `lastUpdated?: Date`
- Three-line format with cyan/pink labels
- Long-press shows source attribution sheet
- Loading state: 3 skeleton bars
- Error state: deterministic fallback per Section 6.3
- Quiet hours: hidden entirely (renders null)
- Mock content for now
- Strings via i18n
- ~120 lines.

**Prompt 18: Build `CouplesStrip.tsx`**
- Pink domain card
- Props: `partner: { name, streak, status, avatar } | null`, `onCheer`, `onInvite`
- With-partner state: avatars / status / cheer button
- No-partner state: invite CTA with brand-voice copy
- Pending-invite state: "Waiting on [name] to accept"
- Strings via i18n
- ~120 lines.

**Prompt 19: Build all 6 widgets**
- StakeGoalWidget, HabitsWidget, WeightWidget, RevenueWidget, SleepWidget, DeepWorkWidget
- Each follows Section 8 spec
- Empty states for each
- Image-backed cards: placeholder gradient (Pexels integration in Prompt 22)
- StakeGoalWidget and RevenueWidget include biometric mask logic per Section 24 (mocked toggle for now)
- ~250 lines (larger than other prompts but contained, all-or-nothing — splits cleanly into 6 sub-files)

**Prompt 20: Build `WidgetGrid.tsx`**
- 2-column grid layout
- Renders 6 widgets in default order
- "+ customize" row at bottom (UI only — no functionality yet)
- Accessibility: scroll order matches reading order from Section 19
- ~70 lines.

### Phase F — Assembly and feature flag (1 prompt)

**Prompt 21: Build `dashboard-v2.tsx` + add feature flag toggle to Settings**
- Assemble all components in order from Section 6
- Status bar / ConnectivityBar / Hero / AICoachStrip / CouplesStrip / WidgetGrid / customize row
- Wire to mock data sources
- Add feature flag toggle in Settings > Beta features > "Use new dashboard"
- Modify `app/(tabs)/index.tsx` (or current dashboard route file) to read flag and conditionally render v1 or v2
- Wire telemetry: `dashboard_v2_opened` event fires on mount
- ~150 lines.
- **At end of this prompt, you can flip the flag and see the new dashboard.**

### Phase G — Real data (3 prompts)

**Prompt 22: Schema audit + score wiring**
- Run the schema audit from Section 26
- Add migrations for any missing fields
- Create `lib/scores.ts` with the composite formulas
- Wire score rings, plan timeline, progress bars, reflection card to real data via existing Zustand stores
- ~200 lines (touches multiple files but all read-only data wiring).
- **If schema audit reveals missing fields, this becomes Prompts 22a (migration) + 22b (wiring) — split before submitting.**

**Prompt 23: Build the `image-fetch` Edge Function + integrate Pexels into widgets**
- Create the function with Pexels API proxy + 30-day cache table + rate limit + circuit breaker per Section 11
- Pre-warm the cache with 50 standard queries on deploy
- Update widgets to call `usePexelsImage(query)` and render images with brand-color overlay per Section 11
- Empty states still use cardBg only (no image)
- Add Pexels API key to Supabase secrets (note: Tyson must register at pexels.com first if no key exists)
- ~180 lines.

**Prompt 24: Build the `ai-coach` Edge Function + wire AICoachStrip to it**
- Create the function with the system prompt enforcing winning at / focus on / try this format
- Server-side validation per Section 6.3 (number extraction + tolerance check)
- Tone variation by time of day
- Thin-data fallback template
- Update AICoachStrip to call `useAICoach()` hook
- Loading and error states handled
- Telemetry events fire (`ai_coach_loaded`, `ai_coach_validation_failed`)
- ~180 lines.

### Phase H — Cleanup (deferred, post-launch)

**After ship and 90+ days of v2 stability at 100% rollout:**
- Delete `dashboard.tsx` (v1)
- Move `dashboard-v2.tsx` → `dashboard.tsx`
- Remove the feature flag toggle
- Remove `v2/` from folder names

This phase is not Phase H of the initial build. It's a follow-up cleanup task once v2 is proven in production.

---

## SECTION 15 — VERIFICATION CHECKLIST

After the build sequence completes, the following must be true before considering the dashboard "ready":

**Visual:**
- [ ] Dashboard renders correctly in dark mode on a real Android device
- [ ] Dashboard renders correctly in light mode on a real Android device
- [ ] Dashboard renders correctly on iOS simulator (iPhone 12+ size)
- [ ] Dashboard renders correctly on iPhone SE (smallest screen, 4-inch)
- [ ] Dashboard renders correctly on iPad (largest screen, tablet layout)
- [ ] All glow colors visible and matching domain rules
- [ ] All gradient directions correct (left-to-right or top-to-bottom, never reversed)
- [ ] Pink R is pink in TRANSFORMR wordmark wherever it appears
- [ ] Image-backed cards show photo at 50-65% visibility (not obscured)
- [ ] Safe area insets respected on all device sizes (notch, Dynamic Island, gesture bar)

**Functional:**
- [ ] Time-of-day mode changes correctly when re-opening app at boundaries (test at 06:00, 11:00, 18:00, 00:00)
- [ ] Quiet mode (00:00-06:00) suppresses notifications and shows evening visual
- [ ] First-time user mode shows welcome hero with 3 CTAs
- [ ] Sparse data mode (1-2 logs in 7 days) shows encouragement copy
- [ ] AI Coach strip refreshes on pull-to-refresh
- [ ] AI Coach strip shows loading skeleton during fetch
- [ ] AI Coach strip shows deterministic fallback on Edge Function failure
- [ ] AI Coach validates server-side numbers within 10% tolerance
- [ ] AI Coach long-press shows source attribution
- [ ] Couples strip hides correctly when no partner connected (replaced with invite)
- [ ] Empty states show on all 6 widgets when no data exists
- [ ] Pexels images load with correct brand-color overlay
- [ ] Pexels images fall back gracefully if API fails (cardBg only)
- [ ] Pexels rate limit + circuit breaker tested (mock 429 responses)
- [ ] Long-press on Pexels image shows attribution
- [ ] Connectivity bar shows offline state correctly
- [ ] Logging actions work fully offline
- [ ] Sync queue flushes on reconnect

**Brand:**
- [ ] No confetti, sparkles, or cartoon effects anywhere
- [ ] Celebration sequence plays correctly on habit completion
- [ ] Cyan FAB pulses at 3-4s cycle (respects reduce-motion)
- [ ] Subtle hero glow pulses correctly (respects reduce-motion)
- [ ] No exclamation marks after "Transform Everything" anywhere
- [ ] Greetings pull from `utils/greetings.ts` (not hardcoded)

**Accessibility (must all pass):**
- [ ] Every interactive element has accessibilityLabel + accessibilityHint
- [ ] Screen reader reading order matches Section 19 specification
- [ ] All text contrast ratios pass WCAG 2.2 AA (verified with contrast checker)
- [ ] Touch targets are minimum 44pt on every interactive element
- [ ] Dynamic Type tested at xxxLarge — no layout breaks
- [ ] Reduce-motion fully disables all animations
- [ ] VoiceOver tested on iOS — entire dashboard navigable
- [ ] TalkBack tested on Android — entire dashboard navigable
- [ ] Keyboard navigation tested (where applicable)

**Internationalization:**
- [ ] Every user-facing string in `en.json`
- [ ] No hardcoded English in component files (regex check passes)
- [ ] Plural rules tested for streaks, events, days
- [ ] Numbers formatted via `Intl.NumberFormat`
- [ ] Dates formatted via `Intl.DateTimeFormat`
- [ ] RTL layout tested (force RTL via dev menu)

**Telemetry:**
- [ ] All events from Section 21 fire correctly
- [ ] No PII in event payloads
- [ ] Performance events sampled at 5%
- [ ] Telemetry can be disabled via Settings toggle

**Performance:**
- [ ] Cold start to interactive < 2.5s on iPhone 12 / Pixel 7
- [ ] Cold start to interactive < 4s on Galaxy A52
- [ ] Dashboard scroll holds 60fps on iPhone 12, 50+fps on iPhone SE, 45+fps on Galaxy A52
- [ ] Mode crossfade smooth at 60fps on all devices
- [ ] Memory under 80MB initial, under 120MB after 10 minutes
- [ ] No memory leaks on repeated tab switching (verified with profiler)
- [ ] Image cache LRU evicts at 30 images / ~3MB
- [ ] Bundle size contribution under 150KB gzipped

**Privacy & Security:**
- [ ] Stake goal $ amount masked when biometric lock enabled
- [ ] Revenue MTD masked when biometric lock enabled
- [ ] Edge Function logs scrub PII (verified by log review)
- [ ] AI Coach prompt does NOT include partner/financial data
- [ ] Partner data isolation verified (Body data ≠ visible to partner unless toggled)
- [ ] PrivacyInfo.xcprivacy includes all new data flows

**App Store Compliance:**
- [ ] Notification permission uses two-step soft-prompt pattern
- [ ] Coach mode requires explicit Settings opt-in
- [ ] All notifications have working deep links
- [ ] App tested with Do Not Disturb / Focus modes active

**Safety:**
- [ ] Old dashboard (v1) still works when feature flag is OFF
- [ ] Switching the feature flag back to OFF restores v1 cleanly
- [ ] No regressions in any other screen (Login, Profile, Workout, Nutrition)
- [ ] All TypeScript compiles with `npx tsc --noEmit`
- [ ] All ESLint passes with zero errors
- [ ] Visual regression review on all 50+ screens after `colors.ts` change (Prompt 4)

---

## SECTION 16 — ROLLBACK PLAN

### If something breaks during the build sequence

After any prompt, if TypeScript fails or the app won't launch:
- `git reset --hard HEAD~1` to revert that commit
- Re-prompt with refined scope
- Pre-commit hook should have caught most violations before push

### If something breaks after merging to dev

- `git revert <commit-hash>` for the bad commit
- Push the revert
- Continue with the next prompt against the reverted state

### If something breaks after shipping v2 to production

- Flip the feature flag default OFF for affected user (if isolated)
- For widespread issue: ship a config update setting flag default OFF for everyone
- v1 dashboard is still in the codebase and will render
- Investigate v2 issue without time pressure
- No App Store re-submission needed for the rollback

### If v2 feels wrong after living with it for a few days

- Keep the feature flag and let users self-select v1 or v2 indefinitely
- Add "Use classic dashboard" option in Settings (not just developer settings)
- Gradually migrate users via in-app prompts when they're ready
- Don't force v2 on anyone

---

## SECTION 17 — PHASE H: POST-LAUNCH FEATURE BACKLOG

**Critical framing:** Everything in this section is **deferred until v2 dashboard is shipped, stable in production for 30+ days, and has measurable user engagement**. Building these features into v2 itself is explicitly out of scope. They are documented here so they are not forgotten, not so they are built early.

The reason for deferring: features without users are worthless. We need users on a working dashboard first, then we observe what they do, then we build the features they actually need. Building all of these into v2 would delay launch by 3-6 months and produce a worse product because we'd be guessing at user behavior instead of measuring it.

### Phase H1 — Notification system implementation (post-launch month 1)

The notification tier definitions are already specified in Section 10 (Quiet / Standard / Coach). The actual implementation of those notifications — scheduling, delivery, content generation, engagement tracking — is Phase H1 work.

**Scope:**
- expo-notifications integration with proper iOS/Android permission flows
- Server-side notification scheduling via Supabase cron Edge Functions
- Per-tier notification content templates with brand voice (per brand kit Section 4)
- User-controllable per-event toggles within each tier
- A/B testing framework for notification copy
- Engagement tracking: open rate, action rate, dismissal rate, opt-out rate per notification type
- Quiet hours enforcement (00:00-06:00 user local, non-overridable)

**Specific notifications to implement (Coach tier example):**
- Morning briefing: "Good morning. Today is Push Day. Macros: 2,400 cal / 170g protein."
- Mid-morning protein check: "You're at 24g protein. Lunch is in 90 min — aim for 50g."
- Pre-workout reminder (30 min before scheduled gym time)
- Post-workout log nudge (15 min after expected end)
- Mid-day macro check
- Late-afternoon readiness check
- Pre-bedtime wind-down (90 min before sleep window)
- Streak protection alerts (within 4h of midnight if no log today)
- Approaching-PR alerts
- Partner activity nudges ("Danyell just started Push Day")
- Weekly review (Sunday 10:00 AM)

**Voice rules (per brand kit Section 4):**
- Direct, never passive ("You're 40g short on protein. Grab a shake." not "Don't forget protein!")
- Data-driven, always cite the user's own numbers
- Confident but not arrogant
- Warm — partner not drill sergeant
- Never use exclamation marks except in the most genuinely celebratory contexts (PR, milestone unlock)

**Critical constraint:** Coach mode (12-15/day) is **opt-in only**. Default tier is Standard (4-6/day). Aggressive defaults destroy retention. Apple has rejected apps for spammy notification permissions. This is regulated.

### Phase H2 — Home screen widgets (post-launch month 2)

**iOS widgets (WidgetKit via react-native-widget-extension):**
- Small (2×2): Today's Body score ring + streak count
- Medium (4×2): All 4 score rings + AI Coach insight one-liner
- Large (4×4): All 4 rings + plan/progress (time-of-day adaptive) + couples strip

**Android widgets:**
- Same three sizes, different layout per Material guidelines
- Glance API for modern Android (12+)

**Lock screen widgets (iOS 16+):**
- Circular complication: streak count
- Rectangular complication: AI Coach one-liner
- Inline complication: "Body 78 · Wealth 62"

**Refresh strategy:**
- WidgetKit timeline updates every 30 minutes during active hours
- Pushed updates on log events via background task
- Cache last data so widgets render instantly even when offline

### Phase H3 — Growth & motivational mechanics (post-launch month 3+)

These are explicitly **deferred and user-research-validated** before building. We do not build motivational mechanics on guesses; we build them after observing what makes our actual users return.

**Candidate features (require user research before building):**
- Streak shields (earn 1 per 30-day streak, allows 1 miss without breaking)
- Visual transformation timeline (auto-generated from progress photos + scores over time)
- Goal cinema (cinematic full-screen goal visualization at countdown milestones)
- AI-generated weekly recap shareable as story (Instagram, TikTok)
- Stake-goal social proof (anonymized: "1,247 users with stake goals 2x more likely to hit them")
- Public leaderboards for community challenges (opt-in)
- Partner anniversary milestones (90-day couple streak unlocks special card)
- Voice-of-Whoop-style audio recaps (text-to-speech of evening reflection in user's chosen voice)
- Apple Watch / WearOS companion app
- Voice command everything (Siri Shortcuts, Google Assistant)

**Validation gate before building any of these:**
- Identify the specific user behavior the feature drives (retention, daily activation, partner referral, etc.)
- Define the success metric (e.g., "20% increase in 7-day retention for users who see this")
- Run a 2-week behavioral observation period to confirm the underlying behavior pattern exists
- Build only after the data validates the hypothesis

### Phase H4 — Drag-and-drop dashboard customization (post-launch month 4+)

The widget grid in v2 ships with hardcoded order. The full drag-and-drop builder is deferred:
- react-native-reanimated drag/drop with spring physics
- Tile-level reordering with persistence to user_settings
- "Add widget" sheet with full catalog (Body Comp, Mobility, Mood Trend, Net Worth, Custom Habits, etc.)
- Per-tile customization (compact / expanded sizes)
- Multiple dashboard "layouts" (Morning Layout / Workout Layout / etc.)

**Critical insight from competitive research:** MacroFactor explicitly noted that customization is table stakes, not differentiation. Smart defaults are what wins. We ship smart defaults first, then add customization only after measuring what users actually want to change.

### Phase H5 — Body↔Wealth correlation engine (deeper version)

V2 ships with a basic correlation card (Section 8.7). Phase H5 makes it real:
- Multi-variable correlation across all 7 brand pillars
- Weekly correlation report card delivered via notification + journal entry
- "Show me what's working" interactive correlation explorer
- Predictive modeling: "If you sleep 7.5h tonight, your readiness tomorrow is projected at 87"
- Shareable correlation insights ("My sleep predicts my revenue" social card)

This is the moat feature. No competitor has it. But it requires substantial data per user — minimum 60 days of dense logging across body and wealth domains. Premature shipping produces empty insights and damages trust.

### Phase H ordering principle

**The order of Phase H features is determined by data, not by enthusiasm.** After 30 days of v2 in production:

1. Look at retention curves — what's the biggest drop-off point?
2. Look at feature usage — what do users actually use?
3. Look at user feedback — what are they actually asking for?
4. Pick the Phase H feature most likely to address #1 — build that one first.

A senior engineer ships v2, observes for 30 days, and lets the data prioritize Phase H. We do not pick the next feature by what we wish users wanted. We pick by what they show us they need.

---

## SECTION 18 — PHASE INDEX (cross-reference)

A reader's quick-reference that connects all build phases across the spec.

| Phase | What | Where in spec | Timing |
|---|---|---|---|
| Prompt 0 | Commit spec to repo | Section 27 | Before any code prompt runs |
| Phase A | Brand kit synchronization (4 prompts) | Section 14 | Day 1 |
| Phase B | Foundation primitives (3 prompts) | Section 14 | Days 2-3 |
| Phase C | Hero modes (4 prompts) | Section 14 | Days 4-6 |
| Phase D | Strips and widgets (4 prompts) | Section 14 | Days 7-9 |
| Phase E | Assembly + feature flag (1 prompt) | Section 14 | Day 10 |
| Phase F | Real data wiring (3 prompts) | Section 14 | Days 11-13 |
| Phase G | Accessibility, i18n, telemetry, offline (5 prompts) | Section 14 | Days 14-18 |
| Phase H | Post-launch feature backlog | **Section 17** | After 30+ days of v2 in production |
| Cleanup | Remove v1, drop v2 prefix | Section 14 (Phase G description) | After 60+ days of v2 stability |

**Hard rule:** Phase H does not begin until Phase G is shipped, v2 is at 100% rollout, and 30 days of production data is reviewed. No exceptions, no early starts.

---

## SECTION 19 — ACCESSIBILITY (WCAG 2.2 AA)

100K users includes 5K-15K with vision, motor, hearing, or cognitive differences. Accessibility is a build requirement, not a polish phase. Every component must pass these checks before merge.

### Screen reader support

**Every interactive element has:**

- `accessibilityLabel` — what the element IS (e.g., "Body score, 78 out of 100")
- `accessibilityHint` — what tapping does (e.g., "Tap to open Body domain dashboard")
- `accessibilityRole` — appropriate role (`button`, `link`, `header`, `summary`, etc.)
- `accessibilityValue` — for progress bars, sliders, score rings (e.g., `{ now: 78, min: 0, max: 100 }`)

**Reading order on the dashboard (locked):**

1. Greeting + date (announced as one phrase)
2. Streak count
3. Score rings, in order: Body → Wealth → Mind → Bond (each ring announces score + delta)
4. Hero adaptive content (varies by mode)
5. AI Coach — full insight read as one paragraph
6. Couples strip
7. Each widget in grid order (top-left, top-right, then row by row)
8. Bottom tab bar last

**Score ring screen-reader announcement format:**
> "Body score, 78 out of 100, up 11 from yesterday. Tap to open Body dashboard."

**AI Coach screen-reader announcement format:**
> "AI Coach insight, updated 14 minutes ago. You're winning at nutrition: 5 of 5 days on target. Focus on sleep: 5 hours 17 minutes last night. Try this: lights out by 10:30 tonight, no screens after 10. Long-press for sources."

### Color contrast verification

**Every text-on-surface combination must meet WCAG 2.2 AA:**

- Normal text (under 18pt): contrast ratio ≥ 4.5:1
- Large text (18pt+): contrast ratio ≥ 3:1
- Non-text UI (borders, icons): contrast ratio ≥ 3:1

**Verification table for the spec's color choices:**

| Combination | Ratio | Passes |
|---|---|---|
| `#1A1530` text on `#F3EDE8` bg | 14.8:1 | AA Large + Normal ✓ |
| `#1A1530` text on `#FFFFFF` card | 16.5:1 | AA Large + Normal ✓ |
| `#4A3F6B` secondary on `#F3EDE8` bg | 7.2:1 | AA Normal ✓ |
| `#4A3F6B` secondary on `#FFFFFF` card | 8.0:1 | AA Normal ✓ |
| `#7B6FA0` muted on `#F3EDE8` bg | 3.9:1 | AA Large only — must use 18pt+ |
| `#F0F0FC` text on `#0C0A15` bg | 17.8:1 | AA Large + Normal ✓ |
| `#9B8FC0` secondary on `#13111C` card | 7.2:1 | AA Normal ✓ |
| `#7C3AED` purple on `#FFFFFF` button | 5.4:1 | AA Normal ✓ |
| `#0891B2` cyan on `#FFFFFF` | 4.0:1 | AA Large only — cyan label is 11px, FAILS — see fix |

**Required fix:** the AI Coach "AI COACH" label at 11px in `#0891B2` does NOT pass AA in light mode. Two options:

1. Change cyan label to `#0E7490` (darker cyan) → passes 5.7:1 ✓
2. Bold the label to 600 weight (some accessibility tools count bold as "large text")

**Choose option 1.** Update light-mode AI cyan to `#0E7490` for label use specifically. The existing `#0891B2` remains for non-text cyan (icons, glows, gradients).

### Dynamic Type support

**Every text element scales with the user's Dynamic Type setting:**

- Use `react-native-size-matters` or React Native's built-in `allowFontScaling={true}` (default true)
- Set `maxFontSizeMultiplier={1.5}` on body text to prevent layout breakage at xxxLarge
- Set `maxFontSizeMultiplier={1.3}` on stat numbers (more conservative — large numbers break layouts faster)
- Score rings use `numberOfLines={1}` to prevent text wrapping that breaks the ring layout

### Touch targets

**Every interactive element is minimum 44pt × 44pt** (Apple HIG, also Material Design A11y guidance).

Components that look smaller (habit circles at 38px, plan row checkboxes at 18px) must have an invisible expanded hit area:

```typescript
hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
```

This brings effective tap targets to 44pt+ without changing visible size.

### Motion accessibility

**Reduce-motion setting (iOS Settings > Accessibility > Motion, Android Settings > Accessibility > Remove animations):**

When ON, the dashboard:
- Skips the mode crossfade — content swaps instantly
- Skips score ring fill animation — rings render at final state
- Skips celebration sequence — completion is a static state change with haptic only
- Pauses cyan FAB pulse
- Pauses subtle glow pulse on hero
- Skips skeleton shimmer animation — uses static gray bars

This is read via `useReduceMotion()` hook (provided by `expo-application` or custom).

### Focus management

**Mode transitions** must announce the new state to screen readers:
- After morning → midday transition: "Dashboard updated. Live progress for [date]. 3 of 5 daily targets completed."

**Modal/sheet opens** capture focus and trap it inside the modal until dismissed.

### Verification

Every component prompt includes accessibility verification:

```
- [ ] Component tested with VoiceOver on iOS
- [ ] Component tested with TalkBack on Android
- [ ] Touch targets verified ≥ 44pt
- [ ] Color contrast verified in both themes
- [ ] Dynamic Type tested at xxxLarge
- [ ] Reduce-motion behavior verified
```

---

## SECTION 20 — INTERNATIONALIZATION

Even if launch is English-only, the dashboard ships with i18n scaffolding from Prompt 1. Retrofitting i18n later is 10x harder than building it in.

### String externalization

**Every user-facing string lives in `apps/mobile/locales/en.json`:**

```json
{
  "dashboard": {
    "greeting": {
      "morning": "Good morning, {{name}}",
      "midday": "Halfway there, {{name}}",
      "evening": "Good evening, {{name}}",
      "lateNight": "Sleep is not weakness. It is how you come back stronger, {{name}}."
    },
    "hero": {
      "morning": {
        "todaysPlan": "Today's plan",
        "events": "{{count}} events",
        "beginDay": "Begin day"
      }
    },
    "aiCoach": {
      "label": "AI Coach",
      "winningAt": "You're winning at",
      "focusOn": "Focus on",
      "tryThis": "Try this"
    }
  }
}
```

**No string is concatenated.** "Day {{n}} streak" not `"Day " + n + " streak"`. Concatenation breaks RTL languages and pluralization.

### Pluralization

`i18n-js` or `react-i18next` supports ICU plural rules. Examples:

- `"{{count}} event_one|events_other"` → "1 event" / "2 events"
- `"{{days}} day_one|days_other streak"` → "1 day streak" / "14 days streak"

### Number/date formatting

- Use `Intl.NumberFormat` for all numbers (`24,800` in en-US, `24 800` in fr, `24.800` in de)
- Use `Intl.DateTimeFormat` for all dates ("WED · APR 29" in en becomes locale-appropriate)
- Currency uses user's locale + their stake goal currency (configurable)

### RTL support

- Use `I18nManager.isRTL` to flip horizontal layouts
- Use logical properties: `marginStart` / `marginEnd` instead of `marginLeft` / `marginRight`
- Score rings, plan rows, progress bars — all need RTL-aware layouts even if launch is English

### Build implication

Prompt 1 includes creating the i18n folder structure and `en.json`. Every subsequent prompt that adds user-facing strings adds them to `en.json`, never inline. Pre-commit hook checks for hardcoded strings in component files (regex: any double-quoted English text > 3 words inside JSX).

---

## SECTION 21 — TELEMETRY

**Service:** PostHog (locked decision — April 2026)

PostHog handles three concerns in one SDK: analytics, feature flags, and session replay. Selected over Mixpanel, Amplitude, and Firebase Analytics for these reasons:
- Free tier covers 1M events/month (sufficient through 100K users at expected event volume)
- Open-source, self-hostable when scale or privacy demands it
- Built-in feature flags with percentage-based rollout (eliminates need for a separate flag service — see Section 22)
- Built-in PII property allowlist (eliminates need for custom scrubbing layer)
- React Native SDK with offline event queueing (works with offline-first architecture, Section 23)
- Strong session replay for debugging production issues at scale

You cannot improve what you cannot measure. With 100K users, telemetry is the only way to know if the dashboard is working.

### Event taxonomy (locked)

**Dashboard lifecycle events:**

```
dashboard_v2_opened             { mode, has_partner, days_since_signup }
dashboard_v2_mode_changed       { from_mode, to_mode, trigger: 'time' | 'manual_refresh' }
dashboard_v2_pull_to_refresh    { mode }
```

**Hero interaction events:**

```
hero_score_ring_tapped          { domain: 'body' | 'wealth' | 'mind' | 'bond', score }
hero_plan_row_tapped            { event_type, time_until_event_min }
hero_plan_row_completed         { event_type, on_time: boolean }
hero_cta_tapped                 { mode, cta: 'begin_day' | 'log_now' | 'wind_down' | 'tomorrow_plan' }
```

**AI Coach events:**

```
ai_coach_loaded                 { mode, source: 'fresh' | 'cache' | 'fallback', latency_ms }
ai_coach_long_pressed           { mode }                              // user investigating sources
ai_coach_validation_failed      { mode, fallback_used: 'template' }   // hallucination caught
ai_coach_error                  { mode, error_type: '500' | 'timeout' | 'network' }
```

**Widget events:**

```
widget_tapped                   { widget_id, has_data, days_since_first_log }
widget_empty_state_cta_tapped   { widget_id }
widget_image_loaded             { widget_id, latency_ms, source: 'cache' | 'pexels' | 'fallback' }
widget_image_failed             { widget_id, error_type }
```

**Couples events:**

```
couples_cheer_sent              { partner_active: boolean, time_since_partner_active_min }
couples_strip_tapped            
couples_invite_cta_tapped       
```

**Performance events (sampled at 5%):**

```
dashboard_render_perf           { device_class, fps_p50, fps_p95, jank_count }
edge_function_perf              { fn_name, latency_ms, status_code }
```

### What we measure (the questions telemetry answers)

- **Engagement:** which time-of-day mode has the most opens? Most CTA taps? Most pull-to-refreshes?
- **AI quality:** what % of AI Coach loads use fallback? What % long-press for sources (signal of distrust)?
- **Performance:** where does jank concentrate? Which device class struggles?
- **Conversion:** does the empty state CTA on widgets work? What % of empty states get tapped?
- **Couples:** what fraction of users connect a partner? Of those, what fraction actively cheer?

### Implementation

Use existing telemetry infrastructure (Mixpanel, Amplitude, or Supabase analytics — depends on what's already wired in the app). Prompt 16 (dashboard assembly) wires events to a single `useDashboardTelemetry()` hook that calls into the existing analytics service.

**No PII in events.** User IDs are hashed. Names, emails, financial data, partner IDs never appear in event payloads. Validation in code review.

### Privacy disclosure

Settings > Privacy > "Help improve TRANSFORMR" toggle. Default ON for new users. When OFF, no telemetry events fire. Existing v1 users keep their current setting.

---

## SECTION 22 — STAGED ROLLOUT

**Service:** PostHog feature flags (same SDK as telemetry — Section 21)

PostHog feature flags support percentage-based rollout natively:
- Boolean flag: `dashboard-v2-enabled` — true/false per user
- Percentage rollout: configure to enable for X% of users, deterministic per user-id (same user always gets same value)
- User cohort targeting: enable for specific user properties (e.g., "users in beta cohort")
- Override per user: force-enable for internal testing without affecting percentage

The `useFeatureFlag('dashboard-v2-enabled')` hook reads from PostHog's local cache, falls back to the last-known value when offline, refreshes on app foreground.

A change this big does not ship at 100% on day one. Even if v2 is perfect, edge cases at scale require staged rollout.

### Rollout schedule

| Stage | % users | Duration | Success criteria to advance |
|---|---|---|---|
| Internal | 100% of internal team (you, Danyell) | 3 days | No critical bugs |
| Closed beta | 1% of users (random) | 4 days | Crash rate < v1 baseline; AI Coach error rate < 5% |
| Soft launch | 5% of users | 1 week | DAU retention ≥ v1; widget engagement ≥ v1; user opt-out rate < 10% |
| Half release | 25% of users | 1 week | Same as above + perf metrics within budget on all device classes |
| Majority | 50% of users | 1 week | Same as above + user-reported issues triaged |
| Full release | 100% of users | — | All gates passed |

### Implementation

The feature flag isn't a binary toggle. It's a percentage-based rollout system:

```typescript
useFeatureFlag('dashboard-v2', { rolloutStage: '5%' })
```

The flag service consistent-hashes user IDs to determine inclusion. User_id `abc123` either always sees v2 or never sees v2 within a stage — no flicker.

### Kill switch

If any rollout stage trips a critical metric (crash rate spike, error rate spike, 1-star reviews surge), the rollout pauses or reverses. Specifically:

- Crash rate +20% over baseline → pause rollout, hold at current %
- Crash rate +50% over baseline → reverse rollout, drop to 0%
- AI Coach error rate > 25% → reverse, drop to 0%
- App Store rating drops 0.3+ stars in 24h → pause, investigate

The kill switch is a single Supabase config row update — no app deploy needed.

### User-side opt-out

Even at 100% rollout, users can flip back to v1 in Settings > Appearance > "Use classic dashboard" for 90 days post-launch. After 90 days, v1 is removed.

### Communication

**At 5% stage:** in-app banner to enrolled users: "You have early access to the new dashboard. Tap to learn what's different."

**At 100% stage:** all users see a one-time onboarding tour of the new dashboard on first open. 4 steps, dismissible.

---

## SECTION 23 — OFFLINE-FIRST STRATEGY

The brand kit mandates offline-first. The dashboard must render meaningfully without network connectivity.

### What works offline

**Score rings** — calculated from local cached data (last sync), shown with a "Synced [time]" indicator if data is > 15 minutes old.

**Hero adaptive content** — morning plan, midday progress, evening reflection — all render from local data. The plan list works offline. Progress bars work offline. Reflection uses local cached AI response or deterministic fallback.

**Widget tiles** — all 6 widgets render from local Zustand stores backed by MMKV cache. Stake goal, habits, weight, revenue, sleep, deep work all work offline.

**Couples strip** — partner data is cached. Cheer button queues the cheer locally; fires when connectivity returns.

**Logging actions** — workout sets, meals, weight, water, habits, sleep — all log to local MMKV first, sync queue handles eventual consistency.

### What requires connectivity

**Pexels images** — fall back to brand-color cardBg if no network or no cache.
**AI Coach fresh insights** — fall back to deterministic template (Section 6.3 fallback rules).
**Real-time partner sync** — fall back to last-known partner state.
**Stripe revenue updates** — show last-synced state with "Last updated [time]" caption.

### Connectivity indicator

Top of dashboard, just below status bar: a thin (3px) bar that:

- Hidden when online and synced within 5 minutes
- Shows in `text.muted` color with "Syncing..." when syncing
- Shows in warning amber with "Offline — your changes will sync when reconnected" when offline
- Shows in success green for 2 seconds with "Synced" when sync completes after offline period

Tap the bar to see sync queue status (pending writes, last successful sync time).

### Sync conflict resolution

Last-write-wins for all dashboard data. Server timestamps (not client) determine winner. Client requests are timestamped server-side on receipt.

**Exception: stake goals.** Changes to active stake goals are conflict-locked — only one device can modify at a time. UI shows "Locked by [other device]" if a conflict is detected.

### Cache freshness

Dashboard data caches expire as follows:

| Data | Cache TTL | Behavior on stale |
|---|---|---|
| Score rings | 15 min | Recalc from logged data, instant |
| Plan/progress | 5 min | Re-fetch from logs, show stale-state indicator |
| AI Coach | 90 min | Show last with "Last updated [time]" caption |
| Pexels images | 30 days | Fetch new variants if cache empty |
| Partner data | 1 min when active, 5 min idle | Re-fetch in background |
| Correlation card | 24 hours | Re-fetch on first dashboard open of new day |

### Offline-mode coverage in build prompts

Every component prompt (Phases B, C, D) includes verifying the offline state:
- Component renders without throwing when given empty/null data
- Component renders without throwing when offline (network mock returns error)
- Loading skeleton doesn't get stuck in loading state forever — has 5-second timeout to error state

---

## SECTION 24 — DATA PRIVACY & SECURITY

Financial data, partner data, AI inputs, and biometric tokens are protected at rest and in transit.

### What's sensitive

| Data | Sensitivity | Protection |
|---|---|---|
| Stake goal $ amount | High | Masked on screen lock, biometric unlock to view |
| Revenue MTD | High | Same as stake goal $ |
| Net worth | High | Same |
| Partner activity | Medium | Visible to user only, not to anyone else |
| AI coach inputs (user data) | Medium | Never logged in plaintext server-side |
| Weight, sleep, mood | Medium | Standard encryption at rest |
| Workout data | Low | Standard encryption at rest |

### Stake goal display

The "$500 at risk" pill on the dashboard shows actual currency by default. **If the user has biometric lock enabled** (Face ID, Touch ID, fingerprint), the pill displays as "$•••" with a small lock icon. Tap → biometric prompt → reveals amount for 30 seconds, then re-masks.

This is configurable: Settings > Privacy > "Mask financial data on dashboard" toggle. Default ON for new users with biometric capability detected.

Same treatment applies to Revenue MTD widget when biometric mask is enabled.

### Edge Function logs

All Edge Functions (`ai-coach`, `ai-correlation`, `image-fetch`) scrub PII before logging:

- User IDs are SHA-256 hashed (with daily rotating salt)
- No names, emails, or partner names in logs
- Numeric values (weight, calories) are bucketed (e.g., weight in 5lb increments) before logging
- Free-text inputs (journal entries, custom goals) are never logged at all

### AI request privacy

The `ai-coach` Edge Function sends user data to Anthropic's Claude API. Per Anthropic's privacy policy, customer API requests are not used to train models. The Edge Function:

- Sends the minimum data needed (last 7 days of relevant metrics)
- Never sends names, emails, or other identifiers in the prompt
- Never sends financial data or partner data (those are local-only signals)
- Logs the request hash but not the request body

### Partner data isolation

When partners are linked, each partner sees only what's been explicitly shared. Default sharing scope:

- ✓ Workout activity (current state, joint streaks, joint goals)
- ✓ Habit completion status (booleans only, not specific habits)
- ✗ Financial data (always private)
- ✗ Body measurements (private unless toggled on)
- ✗ Mood / journal entries (always private)
- ✗ Sleep details (private unless toggled on)

### Account deletion

When a user deletes their account, their dashboard data is purged within 30 days. Partner-linked data is anonymized (the partner sees "(deleted user)" for joint streaks). Stake goal funds are returned per the stake goal contract terms (separate flow, not dashboard).

### Verification

Prompt 19 (AI Coach Edge Function) and Prompt 18 (image-fetch Edge Function) both include privacy verification steps in the verification checklist.

---

## SECTION 25 — APP STORE COMPLIANCE

### Notification permission UX

iOS requires explicit prompt for push notifications. Apple has rejected apps for spammy permission requests. The right pattern:

**On first dashboard open, do NOT request notification permission immediately.** Show the dashboard. Let the user explore.

**On the user's third dashboard open (or after they've logged something — whichever comes first), show a contextual pre-prompt:**

> "Want a daily nudge from your AI Coach?
> 
> TRANSFORMR can send you up to 3 reminders per day in Quiet mode, or up to 15 in Coach mode if you want full hand-holding. You can change this anytime."
> 
> [Maybe later] [Yes, set up reminders]

If user taps "Yes, set up reminders," THEN the iOS native permission prompt fires. Two-step flow doubles acceptance rates and avoids App Store Review concerns about aggressive permission requests.

### Notification fatigue (Apple guidelines)

Apple has rejected apps for sending excessive notifications. Coach mode at 12-15/day approaches their flagged threshold. Mitigations:

- Coach tier requires **explicit opt-in via Settings** (not default). User must navigate to Settings > Notifications > Tier and tap Coach.
- Coach tier shows a "this is a lot of notifications" disclaimer in the picker:
  > "Coach mode sends up to 15 notifications per day. Most users prefer Standard. You can change anytime."
- The first time a user enables Coach mode, they get a confirmation dialog: "Coach mode is for users who want maximum accountability. Confirm enable?"
- Coach mode notifications respect aggregated quiet zones (Do Not Disturb, Sleep mode, Focus modes) — not just app-defined quiet hours.

### Deep links

Every notification has a deep link target. Tap a notification, land on the right screen, never on the dashboard.

| Notification type | Deep link target |
|---|---|
| Morning briefing | `transformr://dashboard?mode=morning` |
| Meal reminder | `transformr://nutrition/log` |
| Pre-workout reminder | `transformr://fitness/today` |
| Post-workout log | `transformr://fitness/log-recent` |
| Streak at risk | `transformr://habits/today` |
| Partner nudge | `transformr://couples/dashboard` |
| Approaching PR | `transformr://fitness/exercise/{exercise_id}` |
| Weekly review | `transformr://reviews/weekly` |
| Body↔Wealth correlation insight | `transformr://insights/correlation/{insight_id}` |
| AI coach insight | `transformr://dashboard?mode=current&focus=ai` |

Implemented via Expo Linking. Deep link handler is in `app/_layout.tsx` (already exists).

### App Tracking Transparency (iOS 14.5+)

If telemetry events are sent to a third-party analytics provider (Mixpanel, Amplitude), the app must show iOS's ATT prompt before sending those events. If telemetry is via Supabase analytics (first-party), no ATT prompt needed but Privacy Manifest must declare data collection.

### Privacy Manifest

iOS 17+ requires `PrivacyInfo.xcprivacy` declaring all data collection. The dashboard's data flows must be declared:

- Health data (weight, sleep, mood) — Required Reasons API for HealthKit
- User content (journal, custom goals) — declared
- Identifiers (user ID for analytics) — declared
- Crash data — declared
- Performance data — declared
- Other diagnostic data — declared

### Submission checklist additions for v2

Beyond the existing TRANSFORMR-INSTRUCTIONS.md app store checklist:

- [ ] Notification permission prompt verified non-aggressive
- [ ] Coach mode opt-in flow verified
- [ ] All deep links verified working from cold-start app state
- [ ] PrivacyInfo.xcprivacy includes new dashboard data flows
- [ ] App Store screenshots updated to show v2 dashboard (both themes)
- [ ] Preview video updated if it shows the dashboard
- [ ] App Store description mentions "AI Coach" feature

---

## SECTION 26 — SCHEMA VERIFICATION (PRE-PROMPT 17)

The score formulas in Section 6.2 reference data that may not all exist in the current schema. Before Prompt 17 (real data wiring), verify each input field exists.

### Required schema audit (run before Prompt 17)

```sql
-- Verify these tables and columns exist:
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'workout_sessions';
-- Expected: workout_streak data must be calculable

SELECT column_name FROM information_schema.columns 
WHERE table_name = 'sleep_logs';
-- Expected: sleep_score, hours, quality

SELECT column_name FROM information_schema.columns 
WHERE table_name = 'mobility_sessions';
-- Expected: minutes, type

SELECT column_name FROM information_schema.columns 
WHERE table_name = 'mood_logs';
-- Expected: mood_score (1-10)

SELECT column_name FROM information_schema.columns 
WHERE table_name = 'revenue_logs';
-- Expected: amount, date, recurring

SELECT column_name FROM information_schema.columns 
WHERE table_name = 'focus_sessions';
-- Expected: duration_minutes, completed

SELECT column_name FROM information_schema.columns 
WHERE table_name = 'customers';
-- Expected: created_at (for acquisition rate)

SELECT column_name FROM information_schema.columns 
WHERE table_name = 'partnerships';
-- Expected: status, joint_streak

SELECT column_name FROM information_schema.columns 
WHERE table_name = 'habit_completions';
-- Expected: completed_at, habit_id
```

If any required field is missing, **Prompt 17 must be split** to:

1. First a migration prompt to add the missing field(s)
2. Then the data wiring prompt

This prevents Prompt 17 from generating code that references nonexistent fields, then failing TypeScript or runtime.

### Score formula tunability

The formulas in Section 6.2 are first-pass weights. They live in `lib/scores.ts` as pure functions:

```typescript
export const calculateBodyScore = (inputs: BodyScoreInputs): number => {
  const { sleepScore, workoutStreakPct, mobilityPct, weightTrendPct, mood } = inputs;
  return Math.round(
    sleepScore * 0.30 +
    workoutStreakPct * 0.25 +
    mobilityPct * 0.15 +
    weightTrendPct * 0.15 +
    mood * 0.15
  );
};
```

Weights are constants at the top of `scores.ts`. Tuning the weights is a single-line change reviewable in isolation. No component needs to change.

After 30 days of v2 in production, run analysis: do the scores correlate with actual user outcomes? Tune weights based on real data.

---

## SECTION 27 — SCOPE-LOCK TEMPLATE FOR EACH PROMPT

Every Claude Code prompt for this build starts with this template at the top, customized per prompt. The spec must be committed to the repo BEFORE Prompt 1 runs (this is now Prompt 0).

### Prompt 0 — Commit the spec to the repo (run before any other prompt)

Before any Claude Code prompt runs, Tyson commits this spec to the repo manually:

```powershell
cd C:\dev\transformr
mkdir -Force docs
Copy-Item "TRANSFORMR-DASHBOARD-V2-SPEC.md" "docs\TRANSFORMR-DASHBOARD-V2-SPEC.md"
git add docs/TRANSFORMR-DASHBOARD-V2-SPEC.md
git commit -m "docs: commit dashboard v2 spec — locked source of truth for v2 build"
git push origin dev
```

After this commit, every subsequent Claude Code prompt can reference `docs/TRANSFORMR-DASHBOARD-V2-SPEC.md` as the read-only source of truth.

### Standard prompt template

```
ABSOLUTE RULES — DO NOT VIOLATE

- ADD AND FIX ONLY. Never use taskkill, Stop-Process, kill, pkill.
- ONLY create or modify files in: [SPECIFIC PATHS FOR THIS PROMPT]
- DO NOT touch: package.json, app.json, eas.json, android/, any
  existing screen, any existing component outside the v2/ folder,
  any store, service, migration, or Edge Function not specified above.
- DO NOT npm install or expo install — all dependencies needed are
  already in the project.
- ONE component per prompt unless specified otherwise.
- ONE commit at the end. Conventional commit format.
- Sub-[N] lines of diff total.
- TypeScript MUST compile with `npx tsc --noEmit` before commit.
- If the work needs anything outside scope, STOP and report. Do not
  improvise.
- The dashboard spec at docs/TRANSFORMR-DASHBOARD-V2-SPEC.md is the
  source of truth for layout, colors, dimensions, and behavior. Read
  the relevant section before writing code. If the spec is missing from
  that path, STOP and report — do not proceed without it.

WHAT THIS PROMPT BUILDS:
[PROMPT-SPECIFIC INSTRUCTIONS]

VERIFICATION:
[PROMPT-SPECIFIC VERIFICATION STEPS]

COMMIT:
[PROMPT-SPECIFIC COMMIT MESSAGE TEMPLATE]
```

---

## SECTION 28 — DECISIONS LOG (resolved April 2026)

These decisions were made before Prompt 1 was sent. They are locked.

| Question | Decision |
|---|---|
| Spec committed to repo? | Yes, at `docs/TRANSFORMR-DASHBOARD-V2-SPEC.md` (Prompt 0) |
| Feature flag toggle location? | Profile > Settings > Beta features > "Use new dashboard" |
| Score formula tuning? | Ship with current weights, tune after 30 days of v2 production data |
| Pexels API key? | Tyson has key — provide to Supabase secrets during Prompt 23 |
| Body↔Wealth correlation thresholds? | r ≥ 0.4, p < 0.05, 14+ days, 10%+ effect size, with confidence labels |
| Telemetry service? | **PostHog** (free tier, open-source, includes flags + PII scrubbing) |
| Feature flag service? | **PostHog** (same SDK — percentage rollout, user cohorts, deterministic per user-id) |
| PII scrubbing? | PostHog property allowlist — explicit field allowlist enforced at SDK level |
| Currency for stake goals? | USD only at v1.0 launch — multi-currency post-launch |
| Pre-existing analytics in repo? | None. Clean slate — no migration needed. |

---

*End of spec document. Total: 28 sections, ~16,000 words. All open questions resolved. Ready for build.*
