# TRANSFORMR Master Principles

**Version:** 1.0
**Date:** May 2026
**Author:** Tyson + Claude (collaborative spec)
**Status:** Draft — awaiting Tyson's review and sign-off
**Scope:** Cross-cutting principles that apply to every screen, every feature, every interaction in TRANSFORMR.

---

## SECTION 0 — WHAT THIS DOCUMENT IS

This is the **single source of truth** for how TRANSFORMR behaves as an app. Every individual feature spec (Dashboard, Fitness, Nutrition, Goals, Profile) inherits from this document. If a tab spec contradicts this document, this document wins, and the tab spec gets corrected.

This document does not specify visual design (that lives in the brand kit). It does not specify individual feature behavior (that lives in the per-tab specs). It specifies the **principles** that govern every feature: how the app makes decisions, how the user makes decisions, how AI is used, how data flows, how notifications work, how transparency is delivered, how the app feels.

If a future agent or engineer asks "should we do X or Y?" and the answer is in this document, the answer is locked. If the answer is not in this document and X and Y both seem reasonable, the answer is the one most consistent with the principles below.

**Hard rule:** No code change in TRANSFORMR may violate any principle in this document. If a feature requires violation, the principle gets amended first (with explicit decision logged), then the feature is implemented. Never the other way around.

---

## SECTION 1 — THE OPERATIONAL ENGINE PRINCIPLE

TRANSFORMR is not a tracker. It is an operational engine that runs the user's day, and the user follows it.

A tracker says: "log your meal, log your workout, log your weight." The user does the work, the app stores the data.

An operational engine says: "your breakfast should be 600 calories with 40g protein because your goal is 180lb by Oct 27 and you're at 147 today; here are 3 options from your saved meals; tap to log." The app does the thinking, the user confirms or edits.

**Every feature in TRANSFORMR must answer this question: what work is the app doing for the user that they would otherwise do themselves?**

If the answer is "none — we just store what the user enters," the feature is incomplete. It must be redesigned with an operational layer.

### What the app does for the user

The app does these things for the user, by default, every day, without being asked:

- **Generates today's plan** — workouts, meals, deep work blocks, sleep window, all assigned to specific time slots based on goals and schedule.
- **Generates tomorrow's plan** — runs overnight so the user wakes up to a fully-prepared day.
- **Decides today's targets** — calorie target, protein target, water target, workout intensity, deep work hours, all calculated from goals and current state.
- **Decides today's workout** — which program day, which exercises, which weights (auto-progressed from last performance), with substitutions if equipment unavailable.
- **Suggests next meal** — given current macro state and time of day, suggests what to eat next from saved meals or pantry.
- **Suggests grocery additions** — given the week's meal plan and pantry inventory, builds tomorrow's grocery delta.
- **Schedules reminders** — when to eat, when to drink water, when to start workout, when to wind down for sleep, all based on the day's plan.
- **Detects overdue tasks** — escalates visual treatment and fires notifications when scheduled tasks pass without completion.
- **Adapts to deviations** — if user skips breakfast, recalculates remaining day's macros. If user sleeps poorly, reduces today's workout intensity. If user logs an unplanned snack, adjusts dinner suggestion.
- **Surfaces cross-pillar insights** — correlations between sleep and revenue, workouts and mood, nutrition and focus, all calculated daily and surfaced when meaningful.
- **Updates the user's view** — every screen reflects current state without manual refresh.

### What the user does

The user does only these things:

- **Confirms** AI proposals (yes button) or edits them (edit affordance with friction — see Section 4).
- **Logs** the few things that can't be inferred (mood, soreness, what they actually ate vs. what was suggested).
- **Reviews** their progress at evening reflection.
- **Sets goals** at onboarding and adjusts them over time.

The user should not be required to:
- Build a workout program from scratch (AI generates one, user edits).
- Calculate macros (AI calculates from goal weight and timeline).
- Decide what to eat (AI suggests).
- Plan their grocery list (AI builds it).
- Remember to log things (AI nudges).
- Figure out which exercises to substitute (AI substitutes).
- Decide if they should train hard today (AI decides from readiness score).
- Calculate trends (AI calculates and shows them).

If a current feature requires the user to do any of the above, that feature is incomplete and must be redesigned.

### The "blank slate" violation

A "blank slate" feature is one that opens to an empty form and asks the user to fill it in. Examples of blank slates that violate this principle:

- A meal logger that opens to "What did you eat?" with no suggestions.
- A workout builder that opens to "Add exercises" with no program.
- A goal setter that opens to "Enter target weight" with no projection.
- A grocery list that opens to "Add items" with no auto-population.

**Every blank slate in TRANSFORMR must be replaced with a smart-default flow:**

- Meal logger opens to "Today's lunch should be ~600 cal, 50g protein. Here are 3 options [list]. Or [search] for something else."
- Workout builder opens to "Today is Push Day per your program. Bench press 145lb x 5 (last week 140lb x 5, +5lb auto-progression). [Start] or [edit]."
- Goal setter opens to "At your current rate, you'll hit 180lb on April 15. To hit Oct 27 instead, increase calories by 200/day. [Adjust target] or [adjust pace]."
- Grocery list opens to "This week's plan needs: chicken (12oz), eggs (1 dozen), oats (2 cups). Already in your pantry: greek yogurt, berries, peanut butter. [Confirm list] or [edit]."

The smart default exists for every feature. The user can override (Section 4). But the default IS something, never nothing.

---

## SECTION 2 — THE TRANSPARENCY PRINCIPLE

The app makes many decisions for the user. The user must be able to see the reasoning behind every decision, on demand, with one tap.

If the app says "today's calorie target is 2,400," the user can tap that number and see:

> Calorie target: 2,400 kcal
>
> Calculation:
> - Current weight: 147 lb
> - Goal weight: 180 lb (target Oct 27, 2026)
> - Days to goal: 181
> - Required gain: 33 lb (≈ 0.18 lb/day)
> - Estimated TDEE: 2,650 kcal (from your last 14 days of logged data + activity)
> - Surplus needed: 250 kcal/day
> - **Target: 2,400 kcal**
>
> Adjusts based on your weight trend every Sunday. Over- or under-shooting your target adjusts next week's number.

The reasoning is **always available, never required**. Most users will never tap it. But the option is there for any user who wants to verify, learn, or challenge the AI's logic.

### What requires transparency

Every AI-generated number, plan, or decision visible in the app must have a transparency drilldown:

- Calorie target → calculation chain.
- Macro split → calculation chain.
- Workout weights → progression history + readiness adjustment.
- Sleep target → goal-derivation + circadian context.
- Plan timing → schedule conflicts considered + user preferences applied.
- Cross-pillar insight → which data points fed the correlation + statistical strength.
- Meal suggestion → why this meal vs. others (macro fit, time-of-day, user history).
- Workout substitution → why this exercise replaces the original (muscle group, equipment, injury accommodation).
- Notification firing → why now (time + context + tier).

### What does not require transparency

User-entered data does not need transparency drilldowns. If the user logged "I ate eggs," tapping eggs doesn't show a calculation chain. It shows the food entry.

### Transparency UI pattern

**Default:** number/decision is shown plainly. No icon, no badge, no "tap for info" prompt — these would clutter the interface.

**Affordance:** any AI-generated number is tappable. Tap opens a bottom sheet with the calculation chain.

**Long-press:** opens the same sheet (alternative for users who don't realize numbers are tappable).

**Cross-link:** the calculation chain links to the source data. "Estimated TDEE: 2,650 kcal (from your last 14 days)" — tapping "last 14 days" opens the user's logged data history filtered to those days.

**Editable inputs:** if any input to the calculation can be adjusted by the user (e.g., goal weight, target date, target macro split), the calculation chain shows it as a tappable link to the relevant Settings screen.

### Why transparency matters at scale

10,000+ users will include some who distrust AI. Some who want to learn. Some whose AI suggestion didn't fit their reality (allergies, religious restrictions, training goals AI didn't account for). Transparency is the safety valve. It lets users verify, learn, and adjust without losing trust in the app.

It also protects the company. If a user blames the app for a bad outcome ("the app told me to eat 2,400 calories and I gained too much"), the transparency log shows: here's exactly what data we used, here's why we recommended this, here's how to adjust if your reality differs.

---

## SECTION 3 — THE AI-FIRST PRINCIPLE

Every feature uses AI as its primary intelligence layer. Heuristics are fallbacks for when AI is unavailable.

This is not "use AI where convenient." It is **"AI is the default; deterministic logic is the fallback."**

### What AI-first looks like in practice

**Wrong (heuristic-first):**
> Today's meal suggestion: "Grilled chicken with brown rice and broccoli." (Static suggestion based on time of day.)

**Right (AI-first):**
> Today's meal suggestion: "Grilled chicken with brown rice and broccoli — 580 cal, 52g protein. Picked because you're at 1,420/2,400 cal and 88g/170g protein, you have 6oz chicken in your pantry, and your last 3 dinners were chicken-based so you have a routine working. If you want variety: salmon teriyaki bowl (610 cal, 45g protein) or turkey chili (550 cal, 48g protein)." (Generated by Claude given full user context.)

The AI version is personalized, transparent, and adapts to the user's actual state. The heuristic version is a static lookup. Both produce a meal suggestion. Only one is built for 10,000 users.

### Where AI is the default

These features must use AI as their primary engine:

- All meal suggestions and meal-camera analysis.
- All workout generation, progression, and substitution.
- All cross-pillar insights and correlations.
- All daily plan generation and tomorrow-plan generation.
- All journal prompts (personalized to the day's data).
- All weekly review narratives.
- All "what should I do?" decisions.
- All natural language input (voice command, chat coach).
- Form check video analysis.
- Menu scanner item analysis.
- Progress photo body composition estimation.
- Posture analysis.
- Supplement bottle analysis.
- Blood work scanner.
- Trajectory simulator.
- Adaptive program rewrites.
- Sleep optimizer.
- Motivation engine.
- Smart grocery list generation.
- Meal prep planner.
- Body-business correlation engine.
- Goal cinema narrative.
- Social content generator.

### Where heuristics are acceptable

Heuristics are acceptable as **fallbacks** when AI is unavailable (network down, Edge Function timeout, rate limit hit). They must produce something useful — not "feature unavailable" — but they're the backup, not the primary.

Examples of acceptable heuristic fallbacks:

- AI Coach offline → deterministic template based on user's recent data ("Your sleep dropped this week. Try lights out by 10:30.")
- Meal suggestion offline → cycle through user's saved meals matching macro fit.
- Workout AI offline → use the program-as-written without intensity adjustment.
- Cross-pillar insight offline → show last-known correlation, not generate new ones.

Heuristics are **never** the user-facing default. They're behind the AI's failure mode. The user sees AI output 99% of the time.

### What AI-first does NOT mean

- It does not mean every screen has a chat interface.
- It does not mean the AI is constantly talking to the user.
- It does not mean AI is visible — most AI work happens server-side and the user just sees a personalized number, plan, or suggestion.
- It does not mean the AI is making decisions the user can't override (Section 4).

### AI context requirements (CRITICAL)

Every Claude API call MUST include the user's full context. Generic AI output is unacceptable.

**Minimum context that every AI call includes:**

- User's name, age, height, weight, goal weight, target date.
- Days to target, current trajectory.
- Last 7 days of logged workouts (sets, reps, weights).
- Last 7 days of logged meals (calories, macros, food types).
- Last 7 days of sleep (duration, quality).
- Last 7 days of mood logs.
- Last 7 days of habit completions.
- Current streaks.
- Active goals (fitness, business, finance, mindset).
- Business metrics (revenue MTD, customer count) if connected.
- Partner status if linked.
- Coach Style preference (Off / Calm / Coach / Drill Sergeant — see Section 7).
- Dietary restrictions, allergies, equipment available.
- Time of day, day of week, weather (if relevant to the call).

**Context delivery:** built server-side in Edge Functions via a `buildUserAIContext(userId)` helper that queries all relevant tables and assembles the context block. Never built client-side. Never passed in chat history. Always fresh.

**Context size optimization:** for long-running conversations or repeated AI calls, the context block is compressed to a summary every 10 turns. Raw history is kept server-side; only the summary travels with each new call.

**Anti-hallucination:** every AI response containing numbers is server-side validated against the source data within 10% tolerance. If validation fails, the response is rejected and a deterministic fallback is used. Section 6 of the dashboard v2 spec covers this in depth and applies app-wide.

---

## SECTION 4 — THE OVERRIDE-WITH-FRICTION PRINCIPLE

The app proposes. The user disposes. Always overridable. Never silent.

When the AI generates a plan, target, or suggestion, the user can:

- **Accept** with one tap (the default expected action).
- **Edit** with explicit affordance — but the edit shows the consequence of overriding.
- **Skip/dismiss** explicitly — never silent.

The user is never locked into an AI decision. But the user is never allowed to override without seeing what they're giving up.

### The override flow

**Example 1: Override sleep target.**

App proposes:
> Tonight's sleep target: 10:45pm – 6:30am (7h 45m).

User taps to edit. Override sheet opens:
> If you go to bed at 12:30am instead of 10:45pm:
> - Tomorrow's readiness drops from 87 to 62 (red zone).
> - Your scheduled 7am Push Day workout will be auto-deferred to 9am.
> - Estimated impact on this week's body score: −4.
>
> [Override anyway] [Keep AI suggestion]

If the user picks "Override anyway," the new bedtime saves and the consequences cascade automatically.

**Example 2: Override calorie target.**

App proposes:
> Today's target: 2,400 cal, 170g protein.

User taps to edit. Override sheet opens:
> If you change today's target to 2,000 cal:
> - You'll be in deficit instead of surplus.
> - At this rate, your 180lb goal slips from Oct 27 to Jan 14, 2027 (78 days later).
> - Are you cutting on purpose, or do you just want a lower number today?
>
> [Cut today only — keep goal] [Switch to deficit phase — recalculate goals] [Keep AI suggestion]

The override isn't binary. It's nuanced: maybe the user wants to cut for one day, maybe they're rethinking their whole goal. The flow surfaces both.

**Example 3: Skip a workout.**

App proposes:
> Today is Push Day. Start at 7am.

User taps "skip" or doesn't start it. Notification fires at 7:30am ("you missed your workout"). User dismisses or taps "reschedule." If dismiss:
> Skipping Push Day:
> - This is your 2nd missed workout this week.
> - Your weekly volume drops by 31%.
> - Your AI program will adapt — next week's Push Day adds back the missed sets.
>
> [Skip — reschedule for tomorrow] [Skip — drop entirely] [Actually start now]

### Edit affordance pattern

Editable AI proposals show a subtle pencil icon or "Edit" link near the proposal. Tapping opens the override sheet.

**Visual treatment:** the edit affordance is subtle (does not compete with the primary "accept" action) but always visible. Common pattern:

- Primary action (Accept): full-width pink/purple gradient button.
- Edit affordance: 12px text link below or beside, in `text.secondary` color, with pencil icon.
- Skip/dismiss: 12px text link, also `text.secondary`.

### What's NOT overridable

A few things are locked for safety reasons:

- **App Store compliance items** — notification permission flow, biometric mask thresholds for financial data.
- **Crash safety** — the app cannot be configured to skip safety checks (e.g., don't allow "remove all confirmation dialogs for stake goal money transfers").
- **Privacy boundaries** — partner sharing scope cannot be overridden to share data the user hasn't explicitly opted into.

These are exceptions. The default is everything is overridable.

### No silent skipping

If the user fails to act on an AI proposal (e.g., doesn't start the workout, doesn't log breakfast), the app does not silently move on. It either:

- Fires a reminder notification (per Coach Style — Section 7).
- Updates the visual state (overdue task in amber, then danger red).
- Asks the user explicitly at evening reflection ("you missed Push Day today — reschedule or skip?").

Skipping is allowed. Silent skipping is not.

---

## SECTION 5 — THE HAND-HOLDING PRINCIPLE

The app guides the user through every flow with the next action always visible.

There is no screen in TRANSFORMR where the user lands and thinks "what do I do here?" Every screen has:

- A clear primary action.
- Context for why this is the next thing.
- A way to skip or escape.

### What hand-holding looks like

**Wrong (user has to figure it out):**
> [Empty workout screen]
> [Floating + button in corner]
> [Tab bar]

User has no idea what to do. They tap +, get a blank workout form, and have to build something from scratch.

**Right (hand-holding):**
> Today is Push Day.
>
> Bench press 145lb × 5 reps (last week 140 × 5, +5lb)
> Overhead press 95lb × 6
> Tricep dip bodyweight × 12
> Lateral raise 17.5lb × 12
>
> Estimated time: 52 min.
>
> [Start workout] [Swap exercise] [Skip today]

User has full context, sees what's expected, can act in one tap.

### Empty states

Every empty state in TRANSFORMR is informative, not blank.

**Wrong:**
> No data yet.

**Right (Sleep widget empty state):**
> Sleep last night: not logged
>
> Tap to log when you woke up. We'll figure out your sleep window from that.
>
> Or connect Apple Health / Google Fit to auto-import.
>
> [Log wake time] [Connect health app]

The empty state explains: what's missing, why it matters, how to fix it, and offers two paths (manual + auto).

### First-time user mode

A user opening the app for the first time must be guided through onboarding to the point where the dashboard is meaningful within their first session. Onboarding asks for the minimum needed to generate a useful dashboard, then transitions into the app with a "your first day plan" state.

Onboarding gathers (minimum):
- Name, current weight, goal weight, target date.
- Activity level (3 buttons, no slider).
- Workout experience (3 buttons).
- Equipment access (gym / home / minimal — 3 buttons).
- Dietary restrictions (multi-select with common defaults pre-checked).
- Coach Style preference (Off / Calm / Coach / Drill Sergeant — see Section 7).

Onboarding does not gather:
- Specific food preferences (AI infers from logged meals over time).
- Detailed schedule (AI infers from logged activity times).
- Workout splits (AI generates Push/Pull/Legs by default; user can change).

Onboarding takes < 5 minutes. After onboarding, the user lands on a dashboard with a generated first-day plan.

### Coach marks for first-time interactions

The first time a user encounters a non-obvious affordance, a one-time coach mark explains it.

Examples:
- First time seeing the score rings → coach mark: "These four scores summarize your day in Body, Wealth, Mind, Bond. Tap any ring to see the calculation."
- First time the AI suggests a workout substitution → coach mark: "Your AI swaps exercises if equipment isn't available or you're sore. Tap to see why."
- First time a notification fires → coach mark on tap: "Your AI Coach can be set to Off, Calm, Coach, or Drill Sergeant in Settings."

Coach marks dismiss after one display per device. They never repeat.

### Always-visible escape

Every flow has an explicit escape:
- Modals have a top-right X.
- Bottom sheets have swipe-to-dismiss + a "Cancel" link.
- Multi-step flows have a back button on every step.
- Workout player has "End Workout" always visible (per dashboard spec Section 6.6).

The user is never trapped.

---

## SECTION 6 — THE TRANSPARENCY-OF-PROGRESS PRINCIPLE

Every relevant number is visible at the right level of the app, without scrolling, without hunting.

The dashboard shows the day-level summary. Each tab shows the domain-level detail. Each drill-down shows the item-level detail. The user never has to navigate through 4 screens to find something they care about.

### Information hierarchy

| Level | Surface | Examples |
|---|---|---|
| Critical (always visible) | Dashboard hero, persistent header | Day score, today's targets remaining, next task time, streak |
| Important (above the fold on dashboard) | Dashboard widgets | Stake goal progress, today's habits, weight, revenue MTD, sleep last night, deep work |
| Detailed (one tap from dashboard) | Tab home screens | Full nutrition log, workout history, goal progress, journal entries |
| Granular (two taps) | Drill-downs | Single workout details, single meal breakdown, journal entry full text |

**Critical rule:** if a number appears on the dashboard, the same number appears identically on the relevant tab. No discrepancies. No "the dashboard says 1,400 cal but Nutrition says 1,420." Always one source of truth.

### Persistent today header (NEW — applies to every screen)

Every screen in TRANSFORMR shows a persistent today header at the top, always visible, never scrolls away:

```
[Streak: 14d]    [Tasks left: 3]    [Cal left: 980]    [Time to bed: 4h 12m]
```

These four numbers are always visible. They reflect the user's current state across the day. Tapping any number opens the relevant deep view.

The header is part of the navigation chrome, not a per-screen component. It lives in the root layout below the status bar.

This header is what makes the app "always have data IN FRONT of the user" — even when the user is deep in a workout player or journaling, the day's state is one glance away.

### Pull-to-refresh on every list

Every scrollable list in TRANSFORMR supports pull-to-refresh. The action triggers:
- Refetch from server.
- Recalculation of any AI-derived numbers (scores, suggestions).
- Updated timestamp on stale data.

### Last-updated timestamps

Any AI-generated content (insights, suggestions, plans) shows when it was last refreshed:

> AI Coach insight · updated 14 min ago

If the data is stale (>30 min for high-frequency content like AI coach, >24 hours for low-frequency like correlation insights), the timestamp is shown more prominently:

> AI Coach insight · updated yesterday — pull to refresh

---

## SECTION 7 — THE NOTIFICATION HEARTBEAT PRINCIPLE

Notifications are the operational heartbeat of the app. Without them, the app is a passive dashboard. With them, the app is a coach.

This means notifications are **Phase A**, not Phase H1. They ship with v2 from day one. The app does not function as designed without them.

### Coach Style — the single notification setting

The user picks one of four Coach Style settings during onboarding (default: Coach):

| Style | Frequency | Tone | Description |
|---|---|---|---|
| Off | 0/day | n/a | No notifications, no AI coaching messages. App is passive. |
| Calm | 3-4/day | Soft, supportive | Essentials only — daily wake briefing, evening check-in, PR celebrations, streak-at-risk warnings. |
| Coach | 6-8/day | Balanced, data-driven | Default. Calm set + meal reminders, mid-day water nudge, partner activity, AI insights. |
| Drill Sergeant | 10-15/day | Intense, no-excuses | Coach set + gym reminder, hourly water during work hours, post-workout logging, post-meal follow-ups, focus block reminders. |

Coach Style is one decision, one setting. Tone and frequency are merged because users picking Drill Sergeant want both the loud frequency and the tough tone, and users picking Calm want both fewer pings and softer language.

### Per-category overrides (advanced)

Settings > Notifications > Advanced lets users toggle individual categories on/off:
- Workout reminders
- Meal reminders
- Water reminders
- Habit/streak reminders
- Partner activity
- AI insights
- Achievements/PRs
- Post-meal follow-ups
- Wind-down reminders
- Focus block reminders

These overrides apply within the chosen Coach Style. A user on Coach mode who turns off water reminders gets the Coach set minus water.

### Always-on safety rules

Across all Coach Styles, these rules are always enforced:

1. **Quiet hours:** 10pm – 7am user local time. Notifications do not fire during quiet hours regardless of Coach Style. User can adjust quiet hours window in Settings.
2. **No workout interruption:** while a workout is logged as in-progress (Workout Player active), no notifications fire.
3. **3-skip downgrade:** if user dismisses a specific notification type 3 times in a row without engaging, that type's frequency drops one tier for that user (e.g., "water reminders" frequency drops from Coach-level to Calm-level for that user).
4. **Tone is always kind, never punitive:** even Drill Sergeant tone is firm but never cruel. ("You said you'd hit the gym at 7. It's 7:15. Lace up." — never "You're a failure for being late.")
5. **Tappable to action, never dead-end:** every notification has a deep link to the relevant action. Tap "log breakfast" notification → opens Add Food screen pre-filled with breakfast time.

### Notification content is AI-generated, not template

Every Coach Style notification message text is generated by Claude with full user context, NOT pulled from a static template.

**Wrong (template):**
> "Time to drink water!"

**Right (AI-generated):**
> "You're at 32oz, behind your usual pace by this time. 30oz before lunch keeps you on track."

Static templates produce app-feels-robotic. AI-generated messages reference the user's specific state and feel like a coach actually paying attention.

### Smart-notification-engine

The smart-notification-engine Edge Function (already exists per the audit, needs the Coach Style integration) decides:
- WHEN to fire (based on schedule + user's logged activity)
- WHETHER to fire (skip if user already completed the relevant action, skip if quiet hours, skip if Coach Style is Off)
- WHAT to say (calls Claude with user context to generate the message)
- WHERE to deep-link (per the deep link map in the dashboard spec Section 25)

The engine runs every 15 minutes via Supabase cron and produces notifications across all users in priority order.

### Notification permission UX

iOS / Android permission flow uses the two-step soft-prompt pattern (per dashboard spec Section 25):
- App does NOT request permission immediately on first launch.
- After user has used the app 3+ times OR completed first log, contextual pre-prompt appears explaining notifications.
- Native OS prompt fires only after user accepts the pre-prompt.

This pattern doubles permission acceptance rates and avoids App Store rejection.

---

## SECTION 8 — THE CROSS-PILLAR INTELLIGENCE PRINCIPLE

The app is the only one that connects every dimension of the user's life. AI surfaces correlations across pillars daily. Insights are personalized, not generic.

### What cross-pillar means

Every feature considers data from other pillars when generating output:

- **Today's workout intensity** considers last night's sleep and yesterday's stress.
- **Today's meal target** considers today's training load.
- **Tomorrow's deep work plan** considers tonight's expected sleep window.
- **AI Coach insights** can reference business metrics in nutrition contexts ("your protein dropped this week and your customer demos start Tuesday — pre-cook 4 chicken breasts Sunday").
- **Streak risk warnings** combine multiple pillars ("you haven't logged sleep, water, or workout today — your 14-day all-pillar streak is at risk").
- **Mood logs** are cross-referenced with workout times, meal types, sleep duration, and revenue events to find what drives the user's best days.

### The correlation engine

A daily Edge Function (`ai-correlation`) runs after midnight and:
- Pulls every user's last 30 days of data across all pillars.
- Runs Pearson correlations on every relevant pair (sleep × revenue, workout × mood, meals × focus, etc.).
- Filters to correlations with r ≥ 0.4, p < 0.05, effect size ≥ 10%.
- Saves significant correlations to `user_correlations` table.
- Surfaces in dashboard correlation card (per dashboard spec Section 8.7) and as monthly Health ROI report.

This is the moat feature. No competitor has it.

### AI Coach uses cross-pillar context

Every AI Coach call includes ALL pillars in the user's context block. The AI is free to surface a wealth-pillar insight in a body-pillar context if it sees a meaningful pattern.

> "You're winning at: nutrition (5/5 days on target).
> Focus on: sleep — 5h 17m last night. Your last 3 weeks show your deal-close rate drops 22% on mornings after <6h sleep. You have a Customer A demo at 10am tomorrow.
> Try this: lights out by 10:30 tonight, no screens after 10."

This insight crosses Body (sleep) and Wealth (deal-close rate) — the user couldn't have written this rule themselves because they don't have the data correlated. The AI does.

---

## SECTION 9 — THE BRAND CONSISTENCY PRINCIPLE

Every screen looks like TRANSFORMR. Brand language is ambient. Color carries meaning.

This section references and inherits from:
- `TRANSFORMR-Brand-Identity-Kit.docx` — canonical brand source
- `TRANSFORMR-BRAND-KIT.md` — synced markdown version
- `apps/mobile/theme/colors.ts` — code-level tokens
- `docs/TRANSFORMR-DASHBOARD-V2-SPEC.md` Section 3 — three-color semantic system

**Hard rules from the brand kit, applied app-wide:**

1. **Three colors with semantic meaning:**
   - Purple (`#A855F7` dark / `#7C3AED` light) — Structure, navigation, primary CTAs.
   - Pink (`#EC4899` dark / `#DB2777` light) — Celebration, partner, achievement.
   - Cyan (`#06B6D4` dark / `#0891B2` light) — AI intelligence.

2. **Two canonical gradients, never reversed:**
   - `purple → pink` for primary CTAs, hero buttons, completion rings.
   - `cyan → purple` for AI feature buttons, FAB, AI Coach left bar.

3. **Glow system (per dashboard spec Section 5):** every card has a domain-specific glow (purple for structure, pink for celebration/partner, cyan for AI). Scarcity makes pink and cyan meaningful.

4. **Dark mode first.** Default theme is dark (`#0C0A15` Deep Space background). Light mode is `#F3EDE8` Lavender-cream. Both fully supported.

5. **Typography:** Inter (system) for UI text. SF Mono / JetBrains Mono for numeric data displays.

6. **No em dashes** in user-facing copy. Use commas or rewrite. (Em dashes appear in spec docs and code comments — fine.)

7. **Tagline:** "Transform Everything" — no period, no exclamation. Used in marketing only, not in-app chrome.

8. **The R in TRANSFORMR is pink** wherever the wordmark appears. (In-app navigation chrome doesn't include the wordmark; this rule applies to splash, login, marketing surfaces.)

9. **No confetti, sparkles, cartoon stars, rainbow effects.** Celebrations use brand-color glows + haptics + spring physics scale animations.

10. **Photography style (when used):** dark, moody, atmospheric. Never bright/clinical/white-walled. Pexels integration follows this rule.

### Cross-tab consistency

The dashboard, fitness, nutrition, goals, profile tabs all share:
- Same color tokens (no tab-specific colors).
- Same typography scale.
- Same spacing scale (4 / 8 / 12 / 16 / 20 / 24 / 32).
- Same border radius scale (8 / 12 / 16 / 20 / 9999).
- Same card glow system (CardShell component used throughout).
- Same persistent today header (Section 6).
- Same notification handling.
- Same accessibility floor.
- Same animation timings.

A user dropping into any tab feels they're in the same app. There is no "the nutrition tab feels different from the dashboard" effect.

---

## SECTION 10 — THE OFFLINE-FIRST PRINCIPLE

Core logging features work without internet. AI features fall back gracefully.

### What works offline

These actions must complete in <100ms on local storage, with sync queued for later:

- Logging a workout set.
- Logging a meal (manual or saved meal).
- Logging water intake.
- Logging weight.
- Logging sleep duration.
- Logging mood.
- Logging supplement check-off.
- Marking a habit complete.
- Editing existing logs.
- Viewing all historical data (cached).

### What requires connectivity

These features require network and gracefully degrade when offline:

- AI meal camera analysis — degrades to "we'll analyze when back online."
- AI coach insights — degrades to deterministic template from cached data.
- Partner real-time sync — degrades to last-known partner state.
- Pexels images — degrades to brand-color cardBg.
- Stripe revenue updates — degrades to last-synced state.
- Spotify playback control — requires connectivity.
- Community leaderboards — degrades to "available when back online."

### Offline indicator

A persistent connectivity bar (per dashboard spec Section 23) at the top of every screen shows:
- Hidden when online and synced within 5 min.
- Amber "Offline — your changes will sync when reconnected" when offline.
- Cyan "Syncing..." while sync is in progress.
- Brief green "Synced" for 2s when sync completes after offline period.

### Sync conflict resolution

Last-write-wins for all data. Server timestamps determine winner.

**Exception:** stake goals and financial transactions are conflict-locked — only one device can modify at a time.

---

## SECTION 11 — THE PERFORMANCE PRINCIPLE

The app is fast at scale. Performance budgets are non-negotiable.

This section inherits from dashboard v2 spec Section 12.5. Applied app-wide:

| Scenario | Device floor | Target |
|---|---|---|
| App cold start to interactive dashboard | iPhone 12 / Pixel 7 | < 2.5s |
| App cold start to interactive dashboard | iPhone SE / Pixel 6a | < 4s |
| Screen transitions | All targets | < 300ms |
| List scroll | iPhone 12 / Pixel 7 | 60 fps |
| List scroll | mid-range Android | 45+ fps |
| Logging action (workout set, meal, etc.) | All targets | < 100ms (local) |
| AI meal camera analysis | All targets | < 5s (network dependent) |
| Pull-to-refresh data update | All targets | < 1s |

**Memory budget:**
- Initial app launch: under 80MB.
- After 10 min normal use: under 120MB (no leaks).
- Image cache: 30MB hard cap, LRU eviction.

**Bundle size budget:**
- Each tab adds < 200KB gzipped.
- New dependencies > 50KB require explicit approval.

### Performance class detection

`usePerformanceClass()` hook detects device performance tier:
- `high` (iPhone 12+, Pixel 7+, Galaxy S22+) — full glow effects, full animations, full image quality.
- `medium` (iPhone XR, Pixel 6a, Galaxy A52) — reduced glow blur, simpler animations, medium image quality.
- `low` (older devices) — solid borders instead of blur, no idle animations, low image quality.

Components consume `useGlow(domain)` and `useAnimationConfig()` which return appropriate values for the device.

### Performance verification

Every prompt that adds rendering work runs the React DevTools profiler on a Galaxy A52 emulator (slowest target). If any component exceeds frame budget, the prompt is rejected.

---

## SECTION 12 — THE ACCESSIBILITY PRINCIPLE

WCAG 2.2 AA compliance is a build requirement, not a polish phase.

This section inherits from dashboard v2 spec Section 19. Applied app-wide:

- Every interactive element has `accessibilityLabel`, `accessibilityHint`, `accessibilityRole`, `accessibilityValue` (where applicable).
- Touch targets minimum 44pt × 44pt (use `hitSlop` for visually smaller controls).
- Color contrast ratios: 4.5:1 for body text, 3:1 for large text, 3:1 for non-text UI.
- Dynamic Type tested at xxxLarge — no layout breaks. `maxFontSizeMultiplier` set per element.
- Reduce-motion setting fully disables decorative animations.
- VoiceOver and TalkBack tested on every interactive component.
- Focus management on modals — focus traps inside modal until dismissed.

### Reading order rules

Screen reader reading order matches visual reading order: top-to-bottom, left-to-right (RTL-aware in RTL languages).

Persistent today header is read first on every screen.

### Verification

Every component prompt includes accessibility verification gates:
- VoiceOver tested on iOS.
- TalkBack tested on Android.
- Touch targets verified ≥ 44pt.
- Color contrast verified.
- Dynamic Type at xxxLarge tested.
- Reduce-motion behavior verified.

---

## SECTION 13 — THE INTERNATIONALIZATION PRINCIPLE

i18n scaffolding ships from day one. No hardcoded user-facing strings.

This section inherits from dashboard v2 spec Section 20. Applied app-wide:

- Every user-facing string lives in `apps/mobile/locales/en.json`.
- Translation hook `useTranslation()` is used in every component.
- ICU plural rules for counts ("1 event" / "2 events").
- `Intl.NumberFormat` for all numbers.
- `Intl.DateTimeFormat` for all dates.
- RTL layout support via `marginStart`/`marginEnd` (not `marginLeft`/`marginRight`).
- Pre-commit hook regex-checks for hardcoded English in JSX.

Launch is English-only. Spanish is the first localization target post-launch (Phoenix, AZ user base has high Spanish demand).

---

## SECTION 14 — THE TELEMETRY PRINCIPLE

Every meaningful interaction is measured. We do not ship code we cannot measure.

This section inherits from dashboard v2 spec Section 21. Applied app-wide.

**Service:** PostHog (handles analytics + feature flags + session replay in one SDK).

### Event taxonomy (cross-tab)

Every tab has its own event taxonomy following the dashboard's pattern:

- Lifecycle events: tab_opened, tab_left.
- Interaction events: button_tapped, form_submitted, search_performed.
- Outcome events: workout_completed, meal_logged, goal_hit.
- Performance events (sampled at 5%): render_perf, edge_function_perf.
- Error events: error_caught, fallback_used.

### What we never log

- PII (names, emails, partner names).
- Financial amounts (only bucketed ranges).
- Free-text content (journal entries, custom goals).
- Photo content (only metadata: was image processed, latency).

### Privacy disclosure

Settings > Privacy > "Help improve TRANSFORMR" toggle. Default ON for new users. When OFF, no telemetry events fire.

---

## SECTION 15 — THE PRIVACY & SECURITY PRINCIPLE

User data is protected at rest and in transit. Sensitive data is biometric-locked.

This section inherits from dashboard v2 spec Section 24. Applied app-wide:

| Data | Sensitivity | Protection |
|---|---|---|
| Stake goal $ amount | High | Biometric mask on dashboard |
| Revenue MTD | High | Biometric mask on dashboard |
| Net worth | High | Biometric mask on Finance screens |
| Partner activity | Medium | Visible to user only |
| AI inputs | Medium | Never logged in plaintext |
| Body composition data | Medium | Standard encryption at rest |
| Workout data | Low | Standard encryption at rest |

### Biometric mask

User in Settings > Privacy > "Mask financial data" toggle (default ON if biometric capability detected). When ON, financial numbers display as `$•••` until biometric unlock. Unlock window: 30 seconds, then re-mask.

### Edge Function logs

All Edge Functions scrub PII before logging. User IDs are SHA-256 hashed with daily rotating salt.

### Partner data isolation

Partners see only what's been explicitly shared. Default: workout activity and habit completion booleans only. Financial, body measurements, mood, journal, sleep details: private unless toggled.

### Account deletion

Full data purge within 30 days. Partner-linked data anonymized.

---

## SECTION 16 — THE NO-CORNER-CUTTING PRINCIPLE

Every feature ships at production grade. No minimals, no stubs, no patches, no workarounds.

This is the standard for every prompt, every commit, every feature.

### Hard rules

1. **No `any` types** in TypeScript. Comprehensive typing required.
2. **No `@ts-ignore` or `@ts-expect-error`.** Fix the types properly.
3. **No `console.log`** in production. Only `console.warn` and `console.error`.
4. **No hardcoded values.** All configuration externalized via environment variables or theme tokens.
5. **No "TODO" or "FIXME" comments** in shipped code.
6. **No placeholders or "coming soon" text** in shipped UI.
7. **No mock data** in production code paths. Mock data lives in test files only.
8. **No half-built features.** A feature ships complete or it doesn't ship.
9. **No `setTimeout(..., 0)` hacks** to "fix" race conditions. Fix the actual ordering.
10. **No silent error swallowing.** Every caught error is logged with context.

### Test coverage

- Statements: 80%+
- Branches: 75%+
- Functions: 80%+
- Lines: 80%+

Test categories:
- Unit tests for all calculation functions (BMR, macros, scores, streaks, PR detection).
- Integration tests for all critical flows (auth, workout, nutrition, partner).
- E2E tests for critical user journeys (onboarding, daily routine, weekly review).

### Pre-commit gates

Every commit must pass:
- `npx tsc --noEmit` — zero errors.
- `npx eslint .` — zero new warnings.
- `npx jest` — all tests pass.
- Bundle size check — within budget.
- Accessibility check on changed components.

### Spec sync requirement

Every commit that changes specced behavior MUST update the relevant spec file in the same commit. The spec is the source of truth.

If implementation reveals the spec is wrong, STOP, propose the spec change, get approval, then update spec + code in the same commit.

### Rollback safety

Every commit must be revertable cleanly. No commits that depend on uncommitted state. No multi-commit features without feature flags.

---

## SECTION 17 — THE FEATURE GUIDE FLOOR

The product feature guide (TRANSFORMR_FEATURE_GUIDE.pdf, April 2026) defines the minimum feature set. The app must implement all 35 features at or above the level described in the guide.

### The 35 features (from feature guide + audit cross-reference)

**Body & Fitness (11):**
1. AI meal camera (industry first)
2. Ghost mode training (industry first)
3. AI life trajectory simulator (industry first)
4. Couples live sync workout (industry first)
5. AI form check via video
6. AI progress photo analysis
7. Daily readiness score
8. AI adaptive programming
9. Apple Watch companion app
10. Injury prevention + pain tracker
11. Guided mobility + recovery sessions

**Business & Finance (4):**
12. Body-business correlation engine (industry first)
13. Stake goals (industry first)
14. Personal finance tracker
15. Business revenue tracker

**Nutrition (5):**
16. Restaurant menu scanner
17. Barcode food scanner
18. AI smart grocery lists
19. Batch cook meal prep planner
20. AI supplement advisor

**Habits, Mindset & Routine (7):**
21. AI sleep optimizer
22. Mood-performance correlation
23. AI journaling + reflection
24. AI vision board + Goal Cinema
25. Deep work focus mode
26. Skill + knowledge tracker
27. Context-aware motivation engine

**System & Platform (8):**
28. Voice command everything
29. AI workout narrator
30. Live home screen widgets
31. NFC + geofence triggers
32. Auto-generated social content
33. Spotify workout integration
34. Siri + Google Assistant shortcuts
35. Drag-and-drop dashboard builder

### Enhancement principle

**The feature guide is the floor, not the ceiling.** Every feature can be enhanced beyond what the guide describes, as long as:
- The enhancement is consistent with the principles in this document.
- The enhancement doesn't add complexity for the user (must be self-explanatory or hidden).
- The enhancement uses AI-first (Section 3) and override-with-friction (Section 4).
- The enhancement is documented in the relevant tab spec.

**No feature drops below the feature guide.** If implementation reveals a feature can't meet the guide's bar, STOP and discuss before scoping down.

---

## SECTION 18 — THE NEW USER EXPERIENCE PRINCIPLE

A new user reaches a useful, personalized dashboard within their first session.

### First open flow

1. Launch screen (3 seconds).
2. Login or create account (Apple / Google / email).
3. Onboarding (5 minutes max — see Section 5).
4. Generate first-day plan (overnight if signed up at night, immediately if signed up during day).
5. Dashboard with welcome hero (Day 0 mode).

### Day 0 experience

User opens the dashboard for the first time. They see:

- Persistent today header with empty placeholders ("Streak: 0d", "Tasks left: ?", "Cal left: ?", "Time to bed: set goal").
- Welcome hero (per dashboard spec Section 6.2.E): "Welcome to your transformation, [name]. Your dashboard fills in as you log. Start with one thing — your weight, a meal, or how you slept last night."
- Three CTAs: "Log weight", "Log a meal", "Log sleep".
- Below the welcome hero, the rest of the dashboard widgets show empty states with informative copy and CTAs.

After the user logs ANY data point, the dashboard transitions to the appropriate time-of-day mode and starts showing real data.

### Day 1-7 experience (sparse data)

While the user has < 3 data points in the last 7 days, the AI Coach uses encouragement copy:
- "You're winning at: starting — you logged your first meal yesterday."
- "Focus on: consistency. Log one more thing today."
- "Try this: snap a photo of your next meal — takes 5 seconds."

This auto-resolves once user hits 3+ data points in a rolling 7-day window.

### Day 8+ experience (full dashboard)

User now has enough data for cross-pillar correlations to start surfacing. AI Coach becomes more specific. Daily plans become more accurate. Trajectory simulator has enough data to project futures.

---

## SECTION 19 — THE TWO-USER PRINCIPLE

The app is built for one user but designed for two. Couples features are first-class, not bolted on.

Every feature considers: does the partner see this? Should they?

- Workout activity → partner sees current state.
- Habit completion → partner sees booleans, not specifics.
- Sleep, mood, financials, journal → private by default.
- Goals → user can opt to share goals with partner.

Couples features:
- Live sync workout (real-time both phones connected).
- Joint streaks.
- Partner nudges and cheers.
- Couples-versus-couples challenges.
- Anniversary milestones.

The app launches with full couples support, not as a future feature.

---

## SECTION 20 — THE EVENING REFLECTION PRINCIPLE

Every day ends with a structured 3-minute reflection. The reflection is the anchor of the daily routine.

At 10pm (configurable in Settings), the app prompts the user with the evening check-in. The check-in:

1. **Reviews the day's data** (auto-pulled, no entry required).
2. **Asks 3 minimum-friction questions** (mood emoji, energy emoji, "anything bothering you?" optional text).
3. **Generates an AI reflection** that ties the day together.
4. **Previews tomorrow's plan** (auto-generated, ready for review or edit).
5. **Sets the wind-down trigger** (lights out time + screens-off time).

Total time: 3 minutes if user goes fast, 10 minutes if they journal.

The reflection persists in the journal. Over time, the user has a daily log of every day with AI-generated context.

---

## SECTION 21 — THE WEEKLY REVIEW PRINCIPLE

Every Sunday at 10am (configurable), the app generates a weekly review. The review is the anchor of the weekly routine.

The review:
1. **Grades the week** A-F across all 7 pillars (Body, Fitness, Nutrition, Business, Finance, Habits, Mindset, Relationships).
2. **Surfaces the week's wins** (PRs, streak milestones, hit targets).
3. **Surfaces the week's misses** (skipped workouts, off-target macros, slept poorly).
4. **Generates next week's priorities** (3 specific actions based on the misses).
5. **Updates goal projections** (are you on track for 180lb by Oct 27? On track for $1M revenue by [date]? Adjust if not.).

The weekly review is sent as a notification + in-app card + optional shareable summary.

---

## SECTION 22 — THE MONTHLY LETTER PRINCIPLE

Every 1st of the month, the AI generates a retrospective letter to the user.

The letter:
- Reviews the previous month's transformation.
- Highlights the biggest wins.
- Identifies the biggest patterns.
- Offers a forward-looking framing for the next month.

This is the long-term motivational anchor. It's the kind of thing only an AI with full data access can write — personal, specific, accurate.

The letter persists in the journal. Over a year, the user has 12 retrospective letters that document their transformation in their AI's voice.

---

## SECTION 23 — THE ENFORCEMENT PRINCIPLE

This document is enforced via:

1. **Pre-commit hooks** that check for principle violations:
   - Hardcoded strings in JSX (i18n principle).
   - `console.log` in non-test files (no-corner-cutting principle).
   - `any` types (no-corner-cutting principle).
   - Component files without accessibility labels (accessibility principle).
   - Edge Functions without `buildUserAIContext` calls (AI-first principle).

2. **Code review checklist** that explicitly checks principles:
   - Does this feature violate the operational engine principle? (Is there a blank slate anywhere?)
   - Does every AI number have a transparency drilldown?
   - Are there any decisions the user can't override?
   - Is the empty state informative?
   - Does the persistent today header still work on this screen?

3. **Spec sync verification** in every PR:
   - Does the relevant tab spec reflect this change?
   - If not, why not? (Answer must be valid.)

4. **Telemetry checks** in every release:
   - Are the principles producing the expected behavior in production?
   - If users are bouncing off a screen, does it violate hand-holding?
   - If users are turning off notifications, does it violate notification heartbeat?

---

## SECTION 24 — DECISIONS LOG

These decisions are locked.

| Question | Decision |
|---|---|
| Notification tier system | Off / Calm / Coach / Drill Sergeant — single combined Coach Style setting (tone + frequency merged) |
| Override default | Allowed everywhere except safety/privacy/compliance items, with friction (consequence shown) |
| AI engine | Anthropic Claude exclusively (model: `claude-sonnet-4-20250514` via Edge Functions) |
| AI context | Server-side `buildUserAIContext` helper, full pillars on every call |
| AI hallucination prevention | Server-side number validation within 10% tolerance, fallback templates on validation failure |
| Telemetry service | PostHog (analytics + feature flags + replay in one SDK) |
| First localization target post-launch | Spanish |
| Day 0 experience | Welcome hero with 3 quick-log CTAs |
| Sparse data definition | <3 data points in last 7 days |
| Quiet hours default | 10pm – 7am user local time |
| Coach Style default for new users | Coach (6-8 notifications/day) |
| Persistent today header | Always-visible, 4 metrics, lives in root layout |
| Spec sync requirement | Every code change updates relevant spec in same commit |
| Feature guide as floor | All 35 features at or above guide bar; enhancements allowed |

---

## SECTION 25 — RELATIONSHIP TO OTHER SPECS

This document is parent to:

| Spec | Scope | Status |
|---|---|---|
| TRANSFORMR-DASHBOARD-V2-SPEC.md | Today tab visual + behavior | Existing (needs amendment to reference this doc) |
| TRANSFORMR-FITNESS-SPEC.md | Fitness tab + workout player | TBD (write next after this lands) |
| TRANSFORMR-NUTRITION-SPEC.md | Nutrition tab + AI vision camera + meal flows | TBD |
| TRANSFORMR-GOALS-SPEC.md | Goals tab (habits, sleep, mood, journal, focus, business, finance) | TBD |
| TRANSFORMR-PROFILE-SPEC.md | Profile tab + settings + integrations | TBD |
| BUILD-SEQUENCE.md | Ordered list of Claude Code prompts | TBD |

This document is parent to the brand kit only in the sense that the brand kit defines visual rules and this document defines behavioral rules. They are siblings, not parent/child.

---

## SECTION 26 — REVISION POLICY

This document is amended (not replaced) when principles need to change.

Amendment process:
1. Propose the change with rationale.
2. Identify which existing principle is affected.
3. Identify which downstream specs need updating.
4. Identify which code currently violates the new principle.
5. Get approval (Tyson + senior engineer review).
6. Amend this doc.
7. Update downstream specs in the same commit.
8. Schedule the code remediation.

Never replace this document silently. Every change is traceable.

---

*End of Master Principles. ~7,000 words. Cross-cutting source of truth for every feature in TRANSFORMR. All other specs inherit from this document.*
