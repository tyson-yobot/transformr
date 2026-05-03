# TRANSFORMR Master Execution Plan v2.1

**Version:** 2.1 (supersedes v2.0 — adds notification scope and autonomous execution mode)
**Date:** May 2026
**Repo:** `C:\dev\transformr`
**Branch:** `dev`
**Status:** Draft — awaiting Tyson's approval to commit and begin execution

**Source-of-truth specs (read before any execution):**
- `C:\dev\transformr\docs\TRANSFORMR-DASHBOARD-V2-SPEC.md` (visual/structural)
- `C:\dev\transformr\docs\specs\TRANSFORMR-MASTER-PRINCIPLES.md` (behavioral)
- `C:\dev\transformr\TRANSFORMR-BRAND-KIT.md` (brand)
- `C:\dev\transformr\CLAUDE.md` (governance)
- `C:\dev\transformr\ASSET-MANIFEST.md` (asset locks)

---

## SECTION 0 — PURPOSE

This is the canonical execution sequence for shipping TRANSFORMR at production grade for 100,000+ users. v2.1 adds:
1. Explicit notification scope (Section 4.3 expanded with 9 notification categories)
2. Autonomous execution mode for safe-to-run-unattended prompts (Section 10)

This document is amended in place as work progresses.

---

## SECTION 1 — VERIFICATION RITUAL

Run before every prompt, after every prompt, between every phase.

### 1.1 Pre-prompt verification

```powershell
cd C:\dev\transformr
git status --short
git log -1 --format="%H %s"
```

Expected: clean working tree (only `~$ANSFORMR-DASHBOARD-V2-SPEC.md` Word lock file allowed). Capture commit hash.

If working tree is dirty (anything other than the Word lock file untracked), STOP. Investigate before running any prompt.

### 1.2 Post-prompt verification

The agent's report must include:
- Starting commit hash
- Final commit hash
- All verification gates passed
- TypeScript: `npx tsc --noEmit` clean
- ESLint: zero new warnings
- Tests: passing if applicable
- Spec sync: shows `git diff --stat` includes any required spec updates
- Asset checksums match if onboarding-adjacent

If ANY gate failed, STOP.

### 1.3 Visual verification (every UI prompt)

After agent commits and pushes, Tyson:
1. Cold-boot emulator if state is corrupted
2. Open the app
3. Navigate to the screen the prompt changed
4. Verify the change visually matches the prompt's intent
5. Capture screenshot to `docs/visual-verification/{prompt-id}-{date}.png`
6. Confirm "visual matches" before authorizing next prompt

For autonomous runs, visual verification is deferred to Tyson's return. Agent declares "code complete, visual verification pending."

### 1.4 Inter-phase verification

After every phase completes:

```powershell
cd C:\dev\transformr\apps\mobile
npx tsc --noEmit
npx eslint .
npx jest --coverage
```

```powershell
cd C:\dev\transformr
git log --oneline -20
git status
```

### 1.5 Performance budget gate

Every 5 prompts AND end of every phase. Run on Galaxy A52 emulator.

### 1.6 Accessibility gate

Every prompt that adds UI components.

### 1.7 Spec drift audit

Every 5 prompts.

### 1.8 Rollback drill

Every 10 prompts AND end of every phase.

---

## SECTION 2 — DEPENDENCY ISOLATION RULES

### 2.1 What "true parallelization" requires

For two Claude Code sessions to run in parallel safely:
- Disjoint files (no overlap)
- Disjoint imports
- Neither modifies `package.json` or any dependency file
- Neither runs `npm install` or `expo install`
- Neither modifies a Zustand store
- Commit at end, deterministic ordering

### 2.2 Rules for parallel sessions

- Maximum 3 parallel sessions
- Each in its own `git worktree`:

```powershell
cd C:\dev\transformr
git worktree add ../transformr-session-1 dev
git worktree add ../transformr-session-2 dev
git worktree add ../transformr-session-3 dev
```

### 2.3 Dependency installation rule

Only ONE prompt per phase may modify dependencies.

### 2.4 Store modification rule

Only ONE prompt at a time may touch a given Zustand store.

---

## SECTION 3 — RECONCILIATION OF 12 UX PROMPTS

### 3.1 Prompt 01 — Dashboard Above-Fold Restructure

**Status:** SUPERSEDE WITH V2 DASHBOARD BUILD

6 conflicts with v2 spec. Replace with v2 spec Prompts 1-21.

### 3.2 Prompt 02 — Quick-Log Row

**Status:** DEFER TO V2 BUILD (Phase 4)

Build once correctly in v2 dashboard FAB sheet AND persistent today header.

### 3.3 Prompt 03 — AICoachFAB

**Status:** AMEND THEN EXECUTE

Amendment: Position fix per v2 spec 6.6.

### 3.4 Prompt 04 — Sleep Time Picker

**Status:** EXECUTE AS-IS — AUTONOMOUS-SAFE

### 3.5 Prompt 05 — Coachmark Expansion

**Status:** EXECUTE AS-IS — AUTONOMOUS-SAFE

### 3.6 Prompt 06 — Help Bubbles for Gated Features

**Status:** EXECUTE AS-IS — AUTONOMOUS-SAFE

### 3.7 Prompt 07 — Goals Navigation Simplification

**Status:** DEFER UNTIL GOALS SPEC IS WRITTEN

### 3.8 Prompt 08 — Profile Home State Completeness

**Status:** EXECUTE AS-IS — AUTONOMOUS-SAFE

### 3.9 Prompt 09 — Daily Briefing Wayfinding

**Status:** EXECUTE AS-IS — AUTONOMOUS-SAFE

### 3.10 Prompt 10 — AI Feedback Migration

**Status:** EXECUTE AS-IS — AUTONOMOUS-SAFE

### 3.11 Prompt 11 — Why This Sheet

**Status:** AMEND THEN EXECUTE

Amendment: Add calculation chain display.

### 3.12 Prompt 12 — AI Proactive Hooks

**Status:** DEFER UNTIL COACH STYLE SPEC + PHASE A.5 LANDS

---

## SECTION 4 — MISSING WORK NOW SCHEDULED

### 4.1 Phase A.5 — Notification bug fixes

From `docs/audit/NOTIFICATIONS-AUDIT-2026-04-30.md`:
1. proactive_messages CHECK constraint mismatch
2. daily-reminder pref field name issues
3. global toggle no-op
4. daily-accountability ignoring prefs

### 4.2 AI Vision Camera shell

Field-name mismatch (`image` vs `image_base64`) affects 6+ vision features. Need unified Camera shell.

Used by: meal camera, menu scanner, supplement bottle scanner, blood work scanner, posture analysis, progress photo, form check.

### 4.3 Coach Style spec + Notification system (EXPANDED)

**Coach Style tier system:**
- Off / Calm / Coach / Drill Sergeant
- User-controlled in Settings
- Default: Coach for new users

**Notification categories that MUST ship:**

| Category | Description | Tiers active | AI-generated content |
|---|---|---|---|
| Task reminders | "Time for breakfast", "Time for water", "Pre-workout in 30 min", "Wind down for sleep" | Calm + Coach + Drill Sergeant | Yes — references user's actual data and time of day |
| Streak protection | "Your 14-day streak is at risk — log something today" — fires within 4 hours of midnight | All except Off | Yes — references current streak length and what's missing |
| Motivational pings | Daily nudges with brand voice | Coach + Drill Sergeant | Yes — references user's last action, current state, today's goal |
| Milestone celebrations | "PR alert! Just hit 145lb bench, up 5 from last week" | All except Off | Yes — references the specific milestone reached |
| Re-engagement | After 1/3/7 days of absence, escalating re-engagement | All except Off | Yes — references how long absent and what's pending |
| AI insights | "Your sleep dropped, readiness at 62, today is a recovery day" | Coach + Drill Sergeant | Yes — full cross-pillar context |
| Partner activity | "Danyell just started Push Day", "Danyell sent you a cheer" | All if partner linked | Real-time, not AI-generated |
| Cross-pillar nudges | "You haven't logged sleep, water, or workout — your all-pillar streak is at risk" | Coach + Drill Sergeant | Yes — multi-pillar status check |
| Weekly review prompt | Sunday 10am | Calm + Coach + Drill Sergeant | Yes — full week context |
| Monthly letter | 1st of each month | Calm + Coach + Drill Sergeant | Yes — full month retrospective |

**Frequency targets per tier (approximate, configurable):**
- Off: 0/day
- Calm: 3-4/day
- Coach: 6-8/day (default)
- Drill Sergeant: 10-15/day

**Always-on safety rules (all tiers):**
- Quiet hours 10pm-7am user local time, non-overridable
- No firing during active workout sessions
- 3-skip downgrade: dismissed 3x in a row → that category drops one tier of frequency
- Tone is firm, never cruel, even at Drill Sergeant

**Per-category override:**
Settings > Notifications > Advanced lets users toggle individual categories on/off within their chosen tier.

**AI-generated message text (mandatory, not template):**
Every notification message goes through Claude Edge Function call with full user context. Static templates produce app-feels-robotic. AI-generated messages reference user's specific state and feel like a coach paying attention.

Spec lives at `docs/specs/TRANSFORMR-COACH-STYLE-SPEC.md`. Build follows spec.

### 4.4 Tab specs

- `TRANSFORMR-FITNESS-SPEC.md`
- `TRANSFORMR-NUTRITION-SPEC.md`
- `TRANSFORMR-GOALS-SPEC.md`
- `TRANSFORMR-PROFILE-SPEC.md`

### 4.5 V2 dashboard 24-prompt sequence

Phase A is partially done. Verification needed before continuing.

### 4.6 Phase A status verification

Before running v2 build:

```powershell
cd C:\dev\transformr
git log --oneline | Select-String "brand|kit|color|gradient" | Select-Object -First 20
```

---

## SECTION 5 — EXECUTION SEQUENCE

### Phase 1 — No-amendment, low-risk additive prompts

| # | Prompt | File scope | Autonomous-safe |
|---|---|---|---|
| 1.1 | 04 — Sleep time picker | `goals/sleep.tsx` | YES |
| 1.2 | 05 — Coachmark expansion | 7 screen files | YES |
| 1.3 | 06 — Help bubbles for gated | 6 screen files | YES |
| 1.4 | 08 — Profile state completeness | `profile/index.tsx` | YES |
| 1.5 | 09 — Daily briefing wayfinding | `daily-briefing.tsx` | YES |
| 1.6 | 10 — AI feedback migration | new SQL migration | YES |

All 6 are autonomous-safe. See Section 10 for autonomous execution mode.

**Estimated calendar time:** 1-2 days manual, 5-8 hours autonomous.

### Phase 2 — Amend prompts then execute (NOT AUTONOMOUS)

| # | Action | Time |
|---|---|---|
| 2.1 | Amend Prompt 03 (FAB position fix), commit amended prompt | ~15min me |
| 2.2 | Execute amended Prompt 03 | ~3h agent |
| 2.3 | Amend Prompt 11 (calculation chain) | ~15min me |
| 2.4 | Execute amended Prompt 11 (depends on 1.6) | ~4h agent |

### Phase 3 — Phase A.5 notification bug fixes (NOT AUTONOMOUS)

| # | Action | Time |
|---|---|---|
| 3.1 | Fix proactive_messages CHECK constraint | ~1.5h |
| 3.2 | Fix daily-reminder pref field names | ~1h |
| 3.3 | Fix global toggle no-op | ~1h |
| 3.4 | Fix daily-accountability prefs | ~1.5h |

Sequential. Real device push notification test required.

### Phase 4 — V2 dashboard build (NOT AUTONOMOUS)

24 prompts per v2 spec. 13-18 days.

### Phase 5 — Quick-Log + AICoachFAB consolidation

After v2 ships. 1-2 days.

### Phase 6 — Coach Style spec + Notification system build (NOT AUTONOMOUS)

| # | Action | Time |
|---|---|---|
| 6.1 | Write `docs/specs/TRANSFORMR-COACH-STYLE-SPEC.md` covering all 10 notification categories | ~2h me + 30min review |
| 6.2 | Build Coach Style settings UI | ~3h agent |
| 6.3 | Build preference store + Supabase sync | ~2h agent |
| 6.4 | Build per-category override UI | ~2h agent |
| 6.5 | Build notification scheduler with cooldowns + quiet hours | ~3h agent |
| 6.6 | Build AI message generation Edge Function with full context | ~3h agent |
| 6.7 | Build re-engagement notification system (1/3/7 day absence) | ~2h agent |
| 6.8 | Build streak protection notification logic | ~2h agent |
| 6.9 | Build milestone celebration notification logic | ~2h agent |
| 6.10 | Build cross-pillar nudge notification logic | ~2h agent |
| 6.11 | Wire weekly review and monthly letter notifications | ~2h agent |
| 6.12 | Test all 4 tiers on emulator + real device | ~3h |

**Estimated calendar time:** 5-7 days.

### Phase 7 — Execute amended Prompt 12 (proactive hooks)

After Coach Style ships, amend Prompt 12 to integrate. Execute.

### Phase 8 — AI Vision Camera shell

3-4 days.

### Phase 9 — Tab specs

2-3 days.

### Phase 10 — Execute deferred Prompt 07 (Goals nav)

After Goals spec written.

### Phase 11 — Tab v2 builds

3-4 weeks.

### Phase 12 — End-to-end verification

1 week.

### Phase 13 — Submission and launch

1-2 weeks.

---

## SECTION 6 — TOTAL CALENDAR TIME

| Phase | Calendar time |
|---|---|
| Phase 1 | 1-2 days manual / 5-8 hours autonomous |
| Phase 2 | 1-2 days |
| Phase 3 | 1 day |
| Phase 4 | 13-18 days |
| Phase 5 | 1-2 days |
| Phase 6 (notifications) | 5-7 days |
| Phase 7 | 1 day |
| Phase 8 | 3-4 days |
| Phase 9 | 2-3 days |
| Phase 10 | 1 day |
| Phase 11 | 15-28 days |
| Phase 12 | 5-7 days |
| Phase 13 | 5-14 days |
| **TOTAL** | **55-92 days = 8-13 weeks** |

---

## SECTION 7 — SUCCESS METRICS

A phase is "done" when:

| Metric | Threshold |
|---|---|
| TypeScript errors | 0 |
| ESLint new errors | 0 |
| Test coverage statements | 80%+ |
| Test coverage branches | 75%+ |
| Test coverage functions | 80%+ |
| Test coverage lines | 80%+ |
| Cold start iPhone 12 | < 2.5s |
| Cold start Galaxy A52 | < 4s |
| Dashboard scroll fps iPhone 12 | 60 |
| Dashboard scroll fps A52 | 45+ |
| Memory at launch | < 80MB |
| Memory after 10min | < 120MB |
| Touch targets | >= 44pt |
| WCAG 2.2 AA contrast | Pass on all text |
| VoiceOver navigability | Full app |
| TalkBack navigability | Full app |
| Dynamic Type at xxxLarge | No layout breaks |
| Reduce-motion | All decorative anims disabled |
| Offline logging | All log types work |
| Asset checksums | Match manifest |
| Spec sync | All specs reflect code |

---

## SECTION 8 — RISK MITIGATION

### 8.1 Per-prompt rollback

`git revert`. Drill every 10 prompts.

### 8.2 Per-phase rollback

Revert all phase commits. Restart phase with corrected spec.

### 8.3 V2 dashboard rollback

Feature flag default OFF.

### 8.4 Production rollback

Crash rate spike → kill switch via Supabase config row.

### 8.5 Spec interpretation escalation

STOP execution. Report to Tyson. Spec amended. Resume.

---

## SECTION 9 — IMMEDIATE NEXT MOVE

1. Tyson reviews this plan v2.1
2. If approved, commit `docs/EXECUTION-PLAN.md` to repo
3. Run autonomous Phase 1 launcher (Section 10)
4. Tyson returns, reviews autonomous run report
5. Begin Phase 2 manually

---

## SECTION 10 — AUTONOMOUS EXECUTION MODE

### 10.1 Purpose

Allow Phase 1 prompts to run unattended while Tyson is away. Hardened with strict STOP-on-anything-unexpected discipline. No improvisation, no spec amendments without approval, no "best effort" workarounds.

### 10.2 Autonomous-safe prompt criteria

A prompt qualifies for autonomous execution ONLY if it meets ALL of:
1. Single file OR multiple independent files (no shared state)
2. Pure additive change (no removals, no behavior changes to existing flows)
3. No new dependencies required
4. No store file modifications
5. No spec amendments required
6. No visual judgment needed (changes are mechanical)
7. Clear verification gates the agent can run unattended
8. Easily revertible with single `git revert`

Phase 1 prompts (04, 05, 06, 08, 09, 10) all meet these criteria.

### 10.3 STOP conditions (hard rules)

The autonomous agent MUST STOP and exit cleanly if ANY of these occur:

1. **Spec conflict detected** — any conflict between prompt and spec files
2. **Test failure** — any test goes from passing to failing
3. **Pre-existing TypeScript error** — agent must not "fix" errors that existed before this run
4. **New TypeScript error** — agent's changes introduced a type error
5. **ESLint regression** — new lint errors introduced
6. **File outside scope modified** — agent touched a file not listed in the prompt's scope
7. **Asset checksum mismatch** — any change to `apps/mobile/assets/images/`
8. **Process killing attempt** — agent tried `taskkill`, `Stop-Process`, `kill`, `pkill`
9. **Dependency change** — agent ran `npm install` or `expo install`
10. **Store file modification** — agent modified a Zustand store
11. **Migration file modification** — agent modified an existing migration (only new ones allowed)
12. **Edge function modification** — agent modified an existing Edge Function
13. **Performance regression** — measurable perf drop on existing screens
14. **Build failure** — `npx tsc --noEmit` fails
15. **Working tree dirty between prompts** — uncommitted changes carrying over
16. **Git operation failure** — commit or push fails
17. **Network failure** — Supabase or GitHub unreachable
18. **Spec ambiguity** — prompt could be interpreted multiple ways

### 10.4 STOP behavior

When a STOP condition is hit, the agent:
1. Does NOT improvise or attempt to recover
2. Does NOT commit any partial work
3. Does NOT roll back successfully completed prior prompts
4. Discards uncommitted changes for the prompt that triggered STOP
5. Creates `C:\dev\transformr\BLOCKED.md` with:
   - Which prompt was running when STOP triggered
   - Which STOP condition fired
   - Exact error or finding
   - What's been completed successfully so far (with commit hashes)
   - What hasn't been attempted yet
   - Recommended next step for Tyson
6. Exits cleanly without further action

### 10.5 Successful completion behavior

When all 6 prompts complete successfully:
1. Agent creates `C:\dev\transformr\docs\autonomous-runs\autonomous-run-{YYYYMMDD-HHMMSS}.md` with:
   - Start time, end time, total duration
   - All 6 prompts and their commit hashes
   - All verification gates that passed
   - Visual verification deferred note
   - "All Phase 1 autonomous prompts complete. Visual verification pending Tyson's return. Recommended next step: Phase 2 manual amendments."
2. All commits tagged with `[autonomous]` in commit message body
3. All commits pushed to `dev`
4. Final `git status` shows clean tree

### 10.6 Forbidden actions in autonomous mode

The agent MAY NOT:
- Amend any spec file (even if it thinks the spec is wrong)
- Run `npm install` or `expo install`
- Modify any Zustand store
- Modify any Edge Function
- Modify any existing migration
- Touch any file in `apps/mobile/assets/images/`
- Touch `package.json`, `app.json`, `eas.json`, `tsconfig.json`
- Modify the `cc` PowerShell function or any shell tooling
- Use any process-killing command
- Disable a failing test to make it pass
- Lower a verification threshold to make it pass
- "Best effort" anything
- Make commits without all gates passing

### 10.7 Required actions in autonomous mode

The agent MUST:
- Read all spec files (per the wrapper) before executing each prompt
- Run all verification gates after each prompt
- Stop on ANY STOP condition without exception
- Tag every commit with `[autonomous]` marker
- Push every commit to origin immediately after commit (not batched)
- Maintain clean working tree between prompts
- Create the run report at end (success) or BLOCKED.md (stop)

### 10.8 What Tyson does on return

1. Read `BLOCKED.md` first if it exists. Address blocker.
2. Read `docs/autonomous-runs/autonomous-run-*.md`. Verify what completed.
3. Cold-boot emulator.
4. Visually verify each completed prompt.
5. Run `git log --oneline -10` and verify commits look right.
6. If all visual verifications pass, mark Phase 1 complete and proceed to Phase 2.
7. If any visual verification fails, `git revert` the specific commit and re-prompt manually.

### 10.9 Resumption rules

If Phase 1 partially completed (some prompts done, then STOP), Tyson:
1. Address the blocker that caused STOP
2. Determine if remaining prompts are still autonomous-safe given new state
3. Either re-launch autonomous mode for remaining prompts OR run them manually

---

*End of Master Execution Plan v2.1.*
