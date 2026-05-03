# TRANSFORMR Execution Plan — UX Remediation Reconciliation Against Specs

**Version:** 1.0
**Date:** May 2026
**Branch:** dev
**Author:** Claude (collaborative reconciliation with Tyson)
**Status:** Draft — awaiting Tyson's review before execution

---

## SECTION 0 — PURPOSE

This document reconciles the 12 UX remediation prompts (committed at `63636a7` with spec-compliance wrappers) against the canonical spec system:

- `docs/TRANSFORMR-DASHBOARD-V2-SPEC.md` (visual/structural source of truth, locked at `6e67e0f`)
- `docs/specs/TRANSFORMR-MASTER-PRINCIPLES.md` (behavioral source of truth, committed at `fd0e764`)

For each prompt, this document determines whether to execute as-is, amend before execution, or supersede with a different approach. The output is an ordered execution sequence that doesn't produce work-we-undo.

---

## SECTION 1 — RECONCILIATION RESULTS PER PROMPT

### Prompt 01 — Dashboard Above-Fold Restructure

**Status:** ⛔ **DO NOT EXECUTE AS-IS — SUPERSEDE WITH V2 BUILD**

**Conflicts with spec:**

The dashboard v2 spec (Sections 6.1-6.6) defines a complete dashboard architecture: status bar → adaptive hero with 4 score rings (Body/Wealth/Mind/Bond) → AI Coach insight strip → Couples/Bond strip → widget grid → bottom tab bar with cyan FAB. This prompt's restructure conflicts in 6 places:

1. **dayScore formula:** Prompt 01 uses `(habitCompletionRate × 40) + (nutritionAdherenceRate × 30) + (readinessNormalized × 30)`. V2 spec Section 6.2 specifies composite scores per pillar with weighted formulas. These are different mental models.

2. **Score rings missing:** V2 spec 6.2 requires 4 score rings as the hero anchor (66px, gradient stroke, animated). Prompt 01 doesn't add them.

3. **Couples/Bond strip missing:** V2 spec 6.4 requires a pink-glow couples strip after AI Coach. Prompt 01 doesn't include it.

4. **Glow system missing:** V2 spec 5 requires every card to have domain-specific glow (purple/pink/cyan). Prompt 01 keeps existing card styling without glow.

5. **Hero modes missing:** V2 spec 6.2.A-E defines morning/midday/evening/quiet/welcome adaptive modes. Prompt 01 has no time-of-day adaptation.

6. **Widget grid missing:** V2 spec 6.5 specifies a 2-column widget grid with stake goal, habits, weight, revenue, sleep, deep work. Prompt 01 reorders existing components without converting to the v2 widget pattern.

**Recommendation:** Replace with v2 dashboard build sequence (24 prompts in v2 spec Section 14). Specifically Prompts 1-21 from v2 spec which build: brand kit sync (Phase A done at `27145cc`+), foundation primitives, hero modes, strips, widgets, assembly behind feature flag.

V2 dashboard ships behind a feature flag. Old dashboard stays untouched. User flips the flag to switch. No "patch v1 then redo" cycle.

**Action:** Delete Prompt 01 from execution queue. Add v2 spec Prompts 1-21 to execution queue.

---

### Prompt 02 — Quick-Log Row (6 Targets)

**Status:** ⚠️ **AMEND BEFORE EXECUTING**

**Aligns with spec:**

- Quick-log mechanism is explicitly called for in master principles Section 1 (operational engine — one-tap actions).
- 6 targets (workout, meal, water, weight, mood, habit) match the audit's intent inventory.

**Conflicts/gaps with spec:**

1. **Component placement assumes v1 dashboard.** Prompt 02 modifies `dashboard.tsx` line ~551-595 in the existing layout. V2 dashboard has a Quick Log surface as part of the FAB quick-actions sheet (v2 spec 6.6) AND in the persistent today header zone (master principles Section 6). Need to know which one we're building.

2. **Missing override-with-friction.** Master principles Section 4 requires every AI-generated proposal to be overridable with consequence shown. Quick-log Water at 8oz default — if user has already exceeded daily water target, should the consequence show? Prompt doesn't address.

3. **Missing operational defaults.** Master principles Section 1 says no blank slates. Quick-log mood opens a 5-emoji selector — that's a blank slate. Should be: "Last logged mood was 7. Today's energy reading from your data suggests 6. Tap to confirm or adjust." Operational default with override.

**Recommendation:** Amend Prompt 02 to:
- Build Quick Log as a reusable component that mounts in BOTH the v1 dashboard (immediate) AND the v2 dashboard FAB sheet (when v2 builds).
- Add operational defaults to mood and water (suggest values based on user's recent data).
- Add transparency drilldown: tap-and-hold any quick-log button to see "why this default?"

**Order:** Run AFTER v2 dashboard ships (so we can test in both contexts), OR run NOW as v1-only with explicit note that v2 will rebuild.

**Action:** Amend prompt to specify reusable component + operational defaults + transparency. Decision pending: ship in v1 now or wait for v2.

---

### Prompt 03 — AICoachFAB Creation

**Status:** ✅ **EXECUTE AS-IS WITH MINOR AMENDMENT**

**Aligns with spec:**

- Master principles Section 1 (AI accessible everywhere) requires this.
- V2 spec Section 6.6 specifies a cyan FAB with cyan-purple gradient, breathing pulse animation, AI quick-actions on tap.
- Prompt 03 implementation matches v2 spec design exactly: 56pt diameter, cyan-purple gradient, cyan glow, pulse animation, tap → chat, long-press → menu.

**Minor gap:**

- V2 spec 6.6 specifies the FAB is positioned **center of bottom tab bar** with `-18px margin-top` to overlap. Prompt 03 specifies bottom-right corner. **CONFLICT.**

**Recommendation:** Amend Prompt 03 to position FAB per v2 spec Section 6.6 (center of tab bar, overlapping). This is a one-line change in the prompt (position from bottom-right to bottom-center, integrated with tab bar).

Master principles also requires: long-press menu must include "Daily Briefing" and "Weekly Review" — Prompt 03 already specifies these. Good.

**Action:** Amend position spec, then execute. ~5 min amendment.

---

### Prompt 04 — Sleep Time Picker

**Status:** ✅ **EXECUTE AS-IS**

**Aligns with spec:**

- Master principles Section 1 (operational engine, no blank slates) requires smart defaults — Prompt 04 includes 22:30 / 06:30 / 14:00 / 21:00 defaults.
- Master principles Section 5 (hand-holding) requires every flow to be guided — time pickers are the right pattern.
- V2 spec doesn't address sleep logging UI directly (it's a Goals tab concern, not Dashboard) — no conflict.
- Reduces 27-31 taps to 5-8 taps, the highest-impact tap reduction in the audit.

**No amendments needed.**

**Action:** Execute as-is. Standalone. Can run in parallel with anything except itself.

---

### Prompt 05 — Coachmark Expansion (7 Screens)

**Status:** ✅ **EXECUTE AS-IS**

**Aligns with spec:**

- Master principles Section 5 (hand-holding) explicitly calls for coach marks for first-time interactions.
- V2 spec doesn't address coachmarks for non-Dashboard screens — no conflict.
- 7 new screens × 2-3 coach marks each = standardized first-run guidance.

**No amendments needed.**

**Action:** Execute as-is. Standalone, low-risk additive change. Each screen modification is independent — true parallelization possible.

---

### Prompt 06 — Help Bubbles for Gated Features

**Status:** ✅ **EXECUTE AS-IS**

**Aligns with spec:**

- Master principles Section 5 (hand-holding) — explain features before paywall friction.
- Master principles Section 16 requires no placeholder/coming-soon text — Prompt 06 adds explanatory copy that's brand-voice consistent.
- Reduces paywall abandon rate.

**No amendments needed.**

**Action:** Execute as-is. Standalone, low-risk additive. 6 file modifications, all independent.

---

### Prompt 07 — Goals Navigation Simplification

**Status:** ⚠️ **AMEND BEFORE EXECUTING**

**Aligns with spec:**

- Master principles Section 5 (hand-holding) — eliminating horizontal scroll improves discovery.
- Reduces hidden navigation targets.

**Gap with spec:**

- V2 spec scope is Today tab only (Section 2 explicitly lists Body/Wealth/Mind/Bond tabs as out of scope). Goals tab will be respec'd in `TRANSFORMR-GOALS-SPEC.md` (not yet written).
- Restructuring Goals tab nav now means we may have to redo it when Goals spec is written.
- However, the change is purely additive UI restructure — no behavior change, no data flow change. Risk of redo is low.

**Recommendation:** Execute as-is BUT with a note in commit message: "This is interim Goals nav restructure. Final Goals tab structure will be locked in TRANSFORMR-GOALS-SPEC.md. This restructure does not commit us to this navigation pattern long-term."

**Action:** Execute as-is. Add the interim caveat to commit message.

---

### Prompt 08 — Profile Home State Completeness

**Status:** ✅ **EXECUTE AS-IS**

**Aligns with spec:**

- Master principles Section 16 (no corner cutting) — every screen has loading skeleton, error state, refresh control.
- Profile screen is identified as lowest state-completeness in the audit.
- Pure preservation work — adds missing states without removing anything.

**No amendments needed.**

**Action:** Execute as-is. Lowest risk in the entire pack.

---

### Prompt 09 — Daily Briefing Wayfinding

**Status:** ✅ **EXECUTE AS-IS**

**Aligns with spec:**

- Master principles Section 5 (hand-holding) — every screen must have an escape, no dead ends.
- Adds HelpIcon and contextual action buttons.

**Note:** Master principles Section 21-22 specifies Weekly Review and Monthly Letter as part of the operational engine. Daily Briefing is part of that family. The wayfinding fix is consistent with making these surfaces more accessible.

**No amendments needed.**

**Action:** Execute as-is.

---

### Prompt 10 — AI Feedback Table Migration

**Status:** ✅ **EXECUTE AS-IS**

**Aligns with spec:**

- Master principles Section 2 (transparency) requires feedback mechanism on AI recommendations.
- Master principles Section 14 (telemetry) requires we measure recommendation quality.
- Migration creates `ai_feedback` table with proper RLS, indices, FK constraint.
- Sequential dependency: Prompt 11 (Why This sheet) requires this table.

**No amendments needed.**

**Action:** Execute as-is. Must run BEFORE Prompt 11.

---

### Prompt 11 — Transparency "Why This?" Sheet

**Status:** ✅ **EXECUTE AS-IS WITH AMENDMENT**

**Aligns with spec:**

- Master principles Section 2 (transparency) explicitly requires this. Every AI number tappable to see calculation chain — Why This sheet is the implementation.
- Master principles Section 24 includes this in the Decisions Log.

**Gap with spec:**

- Master principles Section 2 says transparency drilldown should show **calculation chain** (specific data points → math → result). Prompt 11 shows data points and confidence but doesn't show the math.
- E.g., "Sleep quality averaged 2.8/5" is a data point. Master principles wants: "Sleep quality 2.8/5 → contributes 30% weight to body score → reduces body score by 21 points."

**Recommendation:** Amend Prompt 11 to include calculation chain when applicable. For AI-generated insights without explicit math (e.g., "you're winning at nutrition"), data points alone is fine. For numeric outputs (scores, targets), show the math.

**Action:** Amend prompt to include math-display pattern. ~10 min amendment. Then execute.

---

### Prompt 12 — AI Proactive Trigger Specifications

**Status:** ⚠️ **AMEND BEFORE EXECUTING**

**Aligns with spec:**

- Master principles Section 7 (notification heartbeat) — operational engine requires AI triggers throughout the day.
- 17 of 23 AI services are reactive per the audit. This prompt makes them proactive.

**Gaps with spec:**

1. **Coach Style integration missing.** Master principles Section 7 locks **Off / Calm / Coach / Drill Sergeant** as the user-controlled tier system. This prompt fires triggers at fixed times without considering Coach Style preferences. **CONFLICT** — would fire morning briefing for Off-tier users who don't want them.

2. **Quiet hours missing.** Master principles Section 7.always-on-safety-rules specifies 10pm-7am quiet hours. Prompt 12 fires evening reflection 8pm-11pm — extends past quiet hours start.

3. **AI-generated content vs static.** Master principles Section 7 says notification content must be Claude-generated with full user context. Prompt 12 calls existing edge functions which is correct, but doesn't specify the context block.

4. **Cooldown using AsyncStorage instead of MMKV.** Master principles Section 11 (performance) and project memory: TRANSFORMR uses MMKV for hot-path data. AsyncStorage is fine for cold storage. Cooldown checks happen on every app open — that's hot-path. Should use MMKV.

**Recommendation:** Amend Prompt 12 to:
- Read Coach Style from user preferences before firing
- Off tier → never fire
- Calm tier → fire only morning briefing + critical alerts
- Coach tier → fire all 4 specified triggers
- Drill Sergeant tier → fire all 4 PLUS additional triggers per Coach Style spec
- Respect quiet hours (no firing 10pm-7am, even if condition met)
- Use MMKV instead of AsyncStorage for cooldowns
- Add explicit `buildUserAIContext` helper call (master principles Section 3)

**Action:** Amend before executing. ~20 min amendment. Depends on Coach Style preference being readable from store.

---

## SECTION 2 — EXECUTION ORDER

Based on reconciliation, here's the ordered execution sequence:

### Phase 1 — Low-risk, no-amendment prompts (run in parallel)

| Order | Prompt | File scope | Parallelizable with |
|---|---|---|---|
| 1.1 | 04 — Sleep time picker | `goals/sleep.tsx` | All others in Phase 1 |
| 1.2 | 05 — Coachmark expansion | 7 screen files | All others in Phase 1 |
| 1.3 | 06 — Help bubbles for gated | 6 screen files | All others in Phase 1 |
| 1.4 | 08 — Profile state completeness | `profile/index.tsx` | All others in Phase 1 |
| 1.5 | 09 — Daily briefing wayfinding | `daily-briefing.tsx` | All others in Phase 1 |
| 1.6 | 10 — AI feedback migration | New SQL migration | All others in Phase 1 |
| 1.7 | 07 — Goals nav simplify (with caveat) | `goals/index.tsx` | All others in Phase 1 |

**All 7 prompts can run in parallel** — they touch different files, no shared state, no dependencies. Estimated time with parallel execution: 2-4 hours total agent time.

### Phase 2 — Amendments needed before execution

| Order | Prompt | Amendment scope |
|---|---|---|
| 2.1 | 03 — AICoachFAB | Position fix per v2 spec 6.6 (center of tab bar, not bottom-right) |
| 2.2 | 11 — Why This sheet | Add calculation chain display for numeric outputs |
| 2.3 | 12 — AI proactive hooks | Coach Style integration, quiet hours, MMKV, buildUserAIContext |

**Sequential after amendments:**
- 2.1 (FAB) can run in parallel with anything in Phase 1
- 2.2 (Why This) depends on Phase 1.6 (migration)
- 2.3 (Proactive hooks) depends on 2.1 (FAB exists)

Amendment time: ~35 min me. Execution time: 2-4 hours per prompt.

### Phase 3 — Decision pending

| Order | Prompt | Decision |
|---|---|---|
| 3.1 | 02 — Quick-log row | Decide: ship v1 now (interim) or wait for v2 dashboard |
| 3.2 | 01 — Dashboard above-fold | SUPERSEDED — replace with v2 spec Prompts 1-21 |

### Phase 4 — V2 Dashboard Build

This replaces Prompt 01 entirely. The 24-prompt v2 spec build sequence (Section 14 of dashboard v2 spec) executes here:

- Phase A (Prompts 1-4): Brand kit synchronization — partially done at commits `27145cc`, `7dd1b9b`, etc. Verify what's done and complete the rest.
- Phase B (Prompts 5-7): Foundation infrastructure (i18n, telemetry, performance class).
- Phase C (Prompts 8-11): Foundation primitives (CardShell, ScoreRing, EmptyState, etc.).
- Phase D (Prompts 12-16): Hero modes (welcome, plan timeline, progress bars, reflection, adaptive orchestrator).
- Phase E (Prompts 17-20): Strips and widgets (AI Coach, Couples, 6 widgets, grid).
- Phase F (Prompt 21): Assembly + feature flag toggle.
- Phase G (Prompts 22-24): Real data wiring.

Per v2 spec, this is roughly 13-18 days of agent work at 1-2 prompts per day with verification.

### Phase 5 — Notification system completion

After v2 dashboard ships:
- Phase A.5 — Fix the 4 outstanding notification bugs identified in audit
- Coach Style spec (write the spec first)
- Coach Style implementation (Off / Calm / Coach / Drill Sergeant tiers)

### Phase 6 — Other tab specs and builds

After v2 dashboard ships and notification system is complete:
- Write `TRANSFORMR-FITNESS-SPEC.md`, build Fitness tab v2
- Write `TRANSFORMR-NUTRITION-SPEC.md`, build Nutrition tab v2 (includes AI Vision Camera)
- Write `TRANSFORMR-GOALS-SPEC.md`, build Goals tab v2
- Write `TRANSFORMR-PROFILE-SPEC.md`, build Profile tab v2

---

## SECTION 3 — IMMEDIATE NEXT MOVE

**Right now:**

1. Tyson reviews this reconciliation report.
2. If approved, commit this doc to repo as `docs/EXECUTION-PLAN.md`.
3. Tyson decides on Phase 3.1 (Quick-Log v1 interim or wait).
4. Begin executing Phase 1 prompts in parallel via separate Claude Code sessions.
5. While Phase 1 runs, I amend Prompts 03, 11, 12.

**Phase 1 is 7 prompts that can all run in parallel — true parallelization across multiple Claude Code windows.**

**Estimated calendar time to ship Phase 1 + Phase 2:** 1-2 days
**Estimated calendar time to ship Phase 4 (v2 dashboard):** 13-18 days
**Estimated calendar time to full app at production grade:** 6-10 weeks

---

## SECTION 4 — DECISIONS PENDING

| Decision | Options | Recommendation |
|---|---|---|
| Quick-Log v1 interim or wait for v2? | Ship v1 now / Wait for v2 | Wait for v2 — we'll build it once correctly in v2 dashboard FAB sheet (v2 spec 6.6) and persistent today header (master principles Section 6). Saves 2-4 hours of redo work. |
| Goals nav restructure (Prompt 07) | Execute now / wait for Goals spec | Execute now with caveat — purely additive UI restructure, low risk of redo, immediate UX win. |
| When to commit this execution plan | Immediately / after Phase 1 / after every phase | Immediately — this becomes the source of truth for execution. |

---

*End of reconciliation. Awaiting Tyson's approval to proceed.*
