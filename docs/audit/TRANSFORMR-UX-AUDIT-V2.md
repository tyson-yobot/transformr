# TRANSFORMR UX Architecture Audit & Cognitive Load Remediation
## Audit Date: 2026-05-03 | Auditor: Claude Code (Opus 4.6) | Branch: `dev`

---

## DELIVERABLE 1: STATE VERIFICATION DELTA TABLE (Step 1)

| Metric | Part 0 Expected | Live Actual | Delta | Notes |
|--------|----------------|-------------|-------|-------|
| Screens (.tsx excl. _layout) | ~95+ | **93** | -2 | Within range, no drift concern |
| Zustand stores | 14-21 | **21** | 0 | Upper bound confirmed |
| Edge Functions | 28 | **52** | **+24** | Significant drift: Part 0 severely undercounted |
| SQL Migrations | 51 | **53** | +2 | 2 new migrations since intel gathered |
| AI Service modules | 14-15 | **23** | **+8** | Part 0 undercounted; 23 service files in services/ai/ |
| AICoachFAB | Expected at components/ui/AICoachFAB.tsx | **NOT FOUND** | **MISSING** | Component does not exist anywhere in tree |
| HelpIcon | Expected | **EXISTS** | 0 | components/ui/HelpIcon.tsx (245 lines) |
| Coachmark | Expected | **EXISTS** | 0 | components/ui/Coachmark.tsx (240 lines) |
| ScreenHelpButton | Expected | **EXISTS** | 0 | components/ui/ScreenHelpButton.tsx (23 lines) |
| ActionToast | Expected | **EXISTS** | 0 | components/ui/ActionToast.tsx (181 lines) |
| helpContent.ts | Expected | **EXISTS** | 0 | constants/helpContent.ts (271 lines) |
| screenHelp.ts | Expected | **EXISTS** | 0 | constants/screenHelp.ts (423 lines) |
| Brand: Vivid Purple | #A855F7 | **#A855F7** | 0 | Confirmed in theme/colors.ts line 30 |
| Brand: Deep Space | #0C0A15 | **#0C0A15** | 0 | Confirmed in theme/colors.ts line 9 |
| Brand: Pink R | #EC4899 | **#EC4899** | 0 | Confirmed in theme/colors.ts line 40 |
| TypeScript errors | Baseline | **0** | 0 | Clean build |
| ESLint errors | Baseline | **25 errors, 7 warnings** | 0 | Pre-existing; no new errors introduced |
| ai_feedback table | Not expected | **ABSENT** | 0 | Will need migration if transparency layer proceeds |

### Critical Drift Items

1. **AICoachFAB is missing.** Part 0 states it exists at `components/ui/AICoachFAB.tsx` and is "persistent across all tab screens." It does not exist. The dashboard currently has no floating AI coach button. This is either a removed component or intel from a planned-but-unbuilt feature. **Impact:** The AI Chat is reachable only via the "Talk to Coach" button inside the accountability card (conditional on having an accountability message) or via direct route push. There is no persistent, always-visible entry point to AI Chat from the dashboard.

2. **Edge Function count is 52, not 28.** Part 0 was gathered before a significant expansion. The actual edge functions include: achievement-evaluator, ai-adaptive-program, ai-chat-coach, ai-coach, ai-correlation, ai-daily-affirmation, ai-form-check, ai-grocery-list, ai-health-roi, ai-journal-prompt, ai-lab-interpret, ai-meal-analysis, ai-meal-prep, ai-menu-scan, ai-monthly-retrospective, ai-motivation, ai-pattern-detector, ai-posture-analysis, ai-post-workout, ai-progress-photo, ai-screen-insight, ai-sleep-optimizer, ai-supplement, ai-supplement-scanner, ai-trajectory, ai-voice-command, ai-weekly-report, ai-workout-advisor, ai-workout-coach, ai-workout-narrator, challenge-coach, challenge-compliance, challenge-evaluator, daily-accountability, daily-reminder, goal-cinema, hubspot-sync, partner-nudge, pr-detection, proactive-wellness, readiness-score, reorder-predictor, smart-notification-engine, social-content-gen, stake-evaluator, streak-calculator, stripe-webhook, subscription-sync, transcribe-audio, weather-fetch, widget-update, workout-narrator.

3. **AI service count is 23, not 14-15.** Services discovered: adaptive, challengeCoach, chat, coach, compliance, context, correlation, formCheck, groceryList, healthRoi, journaling, labs, mealCamera, mealPrep, motivation, narrator, progressPhoto, sleepOptimizer, supplement, trajectory, workoutAdvisor, workoutCoach, workoutNarrator.

---

## DELIVERABLE 2: INTENT INVENTORY TABLE (Step 2)

### Top 15 User Intents by Expected Daily Frequency

| # | Intent | Entry Path | Taps (cold open) | Screens Traversed | Friction | Key Files |
|---|--------|-----------|-------------------|-------------------|----------|-----------|
| 1 | **Log workout set** | Dashboard → Fitness tab → Start Workout → Workout Player → Log Set | **4** | dashboard → fitness/index → workout-player | No quick-start from dashboard; requires tab switch + workout selection before first set | `app/(tabs)/fitness/index.tsx`, `app/(tabs)/fitness/workout-player.tsx` |
| 2 | **Log food via search** | Dashboard → Quick Action "Log Meal" → Add Food → Search → Select → Log | **4** | dashboard → nutrition/add-food | Quick Action goes to add-food; search + select + adjust qty + log = 4 interactions minimum | `app/(tabs)/dashboard.tsx:574`, `app/(tabs)/nutrition/add-food.tsx` |
| 3 | **Log food via meal camera** | Dashboard → Nutrition tab → FAB → Camera → Capture → Log | **5** | dashboard → nutrition/index → meal-camera | No camera shortcut from dashboard; must go to nutrition tab first, then FAB, then camera option | `app/(tabs)/nutrition/index.tsx`, `app/(tabs)/nutrition/meal-camera.tsx` |
| 4 | **Log water** | Dashboard → Nutrition tab → Scroll to Water → Tap +8oz | **3** | dashboard → nutrition/index | Water logging is inline on nutrition screen but requires scroll; no dashboard quick action for water | `app/(tabs)/nutrition/index.tsx` |
| 5 | **Complete habit** | Dashboard → Goals tab → Habits nav item → Tap habit | **3** | dashboard → goals/index → goals/habits | Habits are 2 taps deep from goals tab; no dashboard surface for habit completion | `app/(tabs)/goals/index.tsx`, `app/(tabs)/goals/habits.tsx` |
| 6 | **View today's plan** | Dashboard → Scroll to "Today's Plan" card | **1 + scroll** | dashboard | Today's Plan card is below the fold (after greeting, quick actions, accountability card, weather, AI insight, prediction, countdown, challenge, quick stats row); requires significant scroll | `app/(tabs)/dashboard.tsx:904-946` |
| 7 | **View weight trend** | Dashboard → Scroll to "Weight Trend" card | **1 + scroll** | dashboard | Weight chart is far below fold, after Today's Plan, partner card | `app/(tabs)/dashboard.tsx:990-1007` |
| 8 | **View partner status** | Dashboard → Scroll to Partner card → Tap "View" | **2 + scroll** | dashboard → partner/dashboard | Partner card is below fold; conditional (only shows if partner linked) | `app/(tabs)/dashboard.tsx:949-987`, `partner/dashboard.tsx` |
| 9 | **View goal progress** | Dashboard → Goals tab → View goal cards | **2** | dashboard → goals/index | Goal progress visible on goals index with progress bars; good hierarchy | `app/(tabs)/goals/index.tsx` |
| 10 | **View streak** | Dashboard → Quick Stats Row (visible after scroll past quick actions) | **1 + scroll** | dashboard | Streak is in QuickStatsRow at line 802; below quick actions, accountability, weather, AI insight sections | `app/(tabs)/dashboard.tsx:802` |
| 11 | **View readiness score** | Dashboard → Quick Stats Row | **1 + scroll** | dashboard | Same location as streak; readiness score is 4th item in QuickStatsRow | `app/(tabs)/dashboard.tsx:802` |
| 12 | **Start workout** | Dashboard → Quick Action "Log Workout" → Fitness screen → Start | **3** | dashboard → fitness/index → workout-player | Quick Action goes to fitness tab, not directly to workout player | `app/(tabs)/dashboard.tsx:561`, `app/(tabs)/fitness/index.tsx` |
| 13 | **Log mood** | Dashboard → Goals tab → Mood nav item → Adjust sliders → Log | **4** | dashboard → goals/index → goals/mood | Mood is nested under goals; 4 sliders + context + log button = high interaction cost | `app/(tabs)/goals/mood.tsx` |
| 14 | **Send partner nudge** | Dashboard → Partner card → Partner dashboard → Nudge button | **3 + scroll** | dashboard → partner/dashboard → partner/nudge | Partner card conditional; nudge requires partner dashboard navigation | `partner/dashboard.tsx`, `partner/nudge.tsx` |
| 15 | **View stake goal status** | Dashboard → Goals tab → Stake Goals nav item → View | **3** | dashboard → goals/index → goals/stake-goals | Feature-gated; buried in goals navigation grid | `app/(tabs)/goals/stake-goals.tsx` |

### Intent Gap Analysis

**Intents currently achievable in <= 3 taps: 4/15** (water, habit, goal progress, start workout)
**Intents requiring > 3 taps: 11/15**
**Target: All 15 in <= 3 taps**

Critical gaps:
- **No water quick action on dashboard** (3 taps via nutrition tab)
- **No habit completion on dashboard** (3 taps via goals)
- **No mood quick-log on dashboard** (4 taps via goals → mood)
- **Today's Plan, streak, readiness all below the fold** despite being highest-value information
- **Meal camera requires 5 taps** from cold open
- **AICoachFAB missing** means AI chat is only reachable via conditional accountability card

---

## DELIVERABLE 3: CURRENT ABOVE-FOLD ASCII MAP (Step 3)

### iPhone 12 Viewport: 390 x 844pt (usable: 390 x 796pt after safe areas)

The dashboard scroll order (from `dashboard.tsx`):

```
┌─────────────────────────────────────────┐ 0pt (safe area top ~48pt)
│  ScreenBackground + AmbientBackground  │
│  PurpleRadialBackground + NoiseOverlay │
│  TabHeroBackground (240pt, 12% opacity)│
├─────────────────────────────────────────┤ ~72pt (insets.top + spacing.md)
│                                         │
│  "Good morning, Tyson."          [?]   │  ~40pt (h1 + gradient bar)
│  ══════════ (gradient bar 3pt)         │
│  MORNING SESSION                        │  ~18pt (caption)
│  Saturday, May 3                        │  ~18pt (caption)
│                                         │  ~spacing.xl (~24pt)
├─────────────────────────────────────────┤ ~172pt
│                                         │
│  ┌──────┐  ┌──────┐  ┌──────┐          │
│  │ 🏋️   │  │ 🍴   │  │ ⚖️   │          │  ~72pt (QuickActionTile)
│  │ Log   │  │ Log  │  │ Log  │          │
│  │Workout│  │ Meal │  │Weight│          │
│  └──────┘  └──────┘  └──────┘          │
│                                         │  ~spacing.lg (~16pt)
├─────────────────────────────────────────┤ ~260pt
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ ● AI COACH              2h ago  │   │
│  │                                  │   │
│  │  Accountability Title            │   │  ~140pt (accountability card)
│  │  Body text of AI coaching...     │   │  (CONDITIONAL: only shows if
│  │                                  │   │   accountabilityMessage exists)
│  │  [Talk to Coach]    Dismiss      │   │
│  └─────────────────────────────────┘   │
│                                         │  ~spacing.md (~12pt)
├─────────────────────────────────────────┤ ~412pt
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  ☁️ Weather Card                 │   │  ~80pt (WeatherCard)
│  │  72°F Partly Cloudy             │   │
│  └─────────────────────────────────┘   │
│                                         │  ~spacing.md
├─────────────────────────────────────────┤ ~504pt
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  AI Insight Card                 │   │  ~100pt (AIInsightCard)
│  │  (screen-context recommendation) │   │
│  └─────────────────────────────────┘   │
│                                         │
├─────────────────────────────────────────┤ ~616pt
│  PredictionAlert (conditional)         │  ~80pt
├─────────────────────────────────────────┤ ~696pt
│  CountdownCard or "Set Countdown" CTA  │  ~80pt
├─────────────────────────────────────────┤ ~776pt ← FOLD LINE (iPhone 12)
│                                         │
│  ActiveChallengeCard (conditional)     │
│  QuickStatsRow [Streak|Workouts|Cal|   │  ← BELOW FOLD
│                  Readiness]            │
│  Today's Stats card (cal/protein/      │
│    water/workout grid)                 │
│  Top Streaks card                      │
│  Today's Plan card                     │
│  Partner card (conditional)            │
│  Weight Trend card                     │
│  Revenue card (conditional)            │
│  Recent Achievements card              │
│                                         │
└─────────────────────────────────────────┘
```

### What's ABOVE the Fold (390 x 796pt viewport)

| Information | Above Fold? | Location |
|------------|-------------|----------|
| Greeting + date | YES | Top |
| Quick Actions (Workout, Meal, Weight) | YES | ~172pt |
| AI Coach accountability message | YES (conditional) | ~260pt |
| Weather | YES (conditional) | ~412pt |
| AI Insight recommendation | BORDERLINE | ~504pt |
| Today's Plan | **NO** | ~904pt |
| Today's macros (cal/protein/water) | **NO** | ~807pt |
| Habits remaining | **NO** | ~940pt |
| Current streak | **NO** | ~802pt |
| Weight vs goal | **NO** | ~990pt |
| Partner status | **NO** | ~949pt |
| Readiness score | **NO** | ~802pt |
| Day score | **NOT SHOWN** | Not rendered anywhere |
| Business KPI | **NO** | ~1009pt |
| Active challenge | **NO** | ~789pt |

### Key Finding
**Of the 12 target metrics specified in the objective, only 1 (greeting/date) is reliably above the fold. The AI accountability card is conditional. Weather takes prime real estate but is low-value for the user's transformation goals. The most important metrics (streak, readiness, macros, today's plan) are all buried below the fold.**

---

## DELIVERABLE 4: AI PROACTIVITY MATRIX (Step 4)

### Current AI Service Proactivity Classification

| # | AI Service File | Edge Function(s) | Current Trigger | Proactive? | Proposed Proactive Trigger | Target Surface |
|---|----------------|-------------------|-----------------|------------|---------------------------|----------------|
| 1 | coach.ts | ai-coach | Manual (getMorningBriefing/getEveningReflection exist but user-initiated) | NO | **Cron: 6am daily** via smart-notification-engine; render morning briefing card on dashboard | Dashboard Today Card (new) |
| 2 | mealCamera.ts | ai-meal-analysis | Manual (tap camera) | NO | **After photo notification**: when user takes any food photo via system camera, offer "Log this meal?" notification | Notification → meal-camera screen |
| 3 | formCheck.ts | ai-form-check | Manual (upload video) | NO | **Post-set if RPE >= 9**: offer "Want a form check?" prompt in workout player | Workout player inline prompt |
| 4 | trajectory.ts | ai-trajectory | Manual (tap re-simulate) | NO | **Weekly auto-render**: Sunday evening, generate trajectory diff vs last week | Dashboard insight card / weekly-review |
| 5 | correlation.ts | ai-correlation | Manual (view insights) | NO | **7-day window trigger**: when 7 consecutive days of multi-domain data exist, auto-fire and surface card | Dashboard insight card |
| 6 | motivation.ts | ai-motivation | Manual (getDailyQuote user-initiated) | PARTIAL | **Readiness-dip trigger**: when readiness < 50, auto-fire motivational message via notification + card | Dashboard + notification |
| 7 | journaling.ts | ai-journal-prompt | Manual (open journal) | NO | **Nightly check-in**: 9pm prompt "How was today?" via notification → journal screen | Notification → journal |
| 8 | supplement.ts | ai-supplement | Manual (view recs) | NO | **Low-stock + readiness**: when supplement dose count approaches 0 and readiness is low, surface reorder prompt | Nutrition tab inline card |
| 9 | groceryList.ts | ai-grocery-list | Manual (generate list) | NO | **Weekly auto-generate**: Sunday morning, auto-generate from meal plan if meal plan exists | Notification → grocery-list |
| 10 | mealPrep.ts | ai-meal-prep | Manual (generate plan) | NO | **Sunday auto-suggest**: if user has logged meals for 5+ days, suggest weekly prep plan | Nutrition tab card |
| 11 | sleepOptimizer.ts | ai-sleep-optimizer | Manual (view analysis) | NO | **Low-readiness trigger**: when readiness < 50 and sleep quality < 3, auto-fire sleep optimization | Dashboard insight card |
| 12 | adaptive.ts | ai-adaptive-program | Manual (during workout) | NO | **Plateau detection**: when 3 consecutive workouts show no progression on key lifts, auto-rewrite program suggestions | Fitness tab inline card |
| 13 | progressPhoto.ts | ai-progress-photo | Manual (upload photos) | NO | **Biweekly reminder**: every 14 days, send notification "Time for progress photos" | Notification → progress-photos |
| 14 | workoutCoach.ts | ai-workout-coach, ai-post-workout | SEMI (post-workout auto-fires) | PARTIAL | Already semi-proactive; add **pre-workout suggestion** based on readiness + last session | Workout player pre-start card |
| 15 | workoutAdvisor.ts | ai-workout-advisor | SEMI (fires after set) | PARTIAL | Already semi-proactive during workout; extend to **next-day preview** after post-workout analysis | Dashboard Today Card |
| 16 | narrator.ts / workoutNarrator.ts | workout-narrator | SEMI (event-driven during workout) | YES | Already proactive during workouts | Workout player audio/text |
| 17 | compliance.ts | challenge-compliance | SEMI (on every log) | YES | Already proactive on logging events | Challenge screens inline |
| 18 | challengeCoach.ts | challenge-coach | SEMI (event-triggered) | PARTIAL | Add **morning challenge briefing** as part of daily briefing | Dashboard Today Card |
| 19 | chat.ts | ai-chat-coach | Manual (open chat) | NO | No change needed; chat is inherently reactive | AI Chat screen |
| 20 | context.ts | N/A (helper) | N/A | N/A | N/A | N/A |
| 21 | healthRoi.ts | ai-chat-coach (narrative) | Manual (generate report) | NO | **Monthly auto-generate**: 1st of month, auto-render health ROI summary | Profile inbox / notification |
| 22 | labs.ts | ai-lab-interpret | Manual (upload labs) | NO | No proactive trigger applicable (requires lab data input) | Labs screen |
| 23 | mealCamera.ts (menu-scan) | ai-menu-scan | Manual (scan menu) | NO | **Location-based**: when at known restaurant (geofence), offer "Scan this menu?" | Notification prompt |

### Proactivity Gap Summary

- **Currently proactive (auto-triggered):** 3 services (narrator, workoutNarrator, compliance)
- **Semi-proactive (event-driven):** 3 services (workoutCoach, workoutAdvisor, challengeCoach)
- **Purely reactive (user-initiated):** 17 services
- **Target:** Every service has at least 1 proactive trigger

### Critical Missing Infrastructure

1. **No AICoachFAB exists.** The persistent floating action button for AI Chat referenced in Part 0 was never built or was removed. This means there is no always-visible AI entry point.
2. **No background scheduling layer.** Edge functions `daily-reminder`, `daily-accountability`, `proactive-wellness`, `smart-notification-engine` exist but there is no client-side listener or cron trigger visible in the mobile app code. Proactive delivery depends on push notifications from server-side crons.
3. **No morning briefing surface.** `coach.ts` has `getMorningBriefing()` and `getEveningReflection()` but neither is called automatically. The dashboard's accountability card comes from `insightStore.proactiveMessages`, which requires a server-side cron to populate.

---

## DELIVERABLE 5: COGNITIVE LOAD SCORECARD (Step 5)

### Scoring Scale: 1 (poor) to 5 (excellent)

| Screen | File | Density | Hierarchy | Modal Discipline | Wayfinding | State Completeness | Avg | Remediate? |
|--------|------|---------|-----------|-----------------|------------|-------------------|-----|------------|
| Dashboard | dashboard.tsx | 2 | 2 | 5 | 4 | 4 | **3.4** | YES |
| Fitness Home | fitness/index.tsx | 4 | 4 | 5 | 5 | 4 | **4.4** | NO |
| Workout Player | fitness/workout-player.tsx | 4 | 4 | 4 | 4 | 5 | **4.2** | NO |
| Workout Summary | fitness/workout-summary.tsx | 4 | 5 | 5 | 4 | 5 | **4.6** | NO |
| Exercise Detail | fitness/exercise-detail.tsx | 4 | 4 | 5 | 4 | 4 | **4.2** | NO |
| Form Check | fitness/form-check.tsx | 3 | 4 | 4 | 4 | 4 | **3.8** | NO |
| Programs | fitness/programs.tsx | 4 | 4 | 5 | 4 | 5 | **4.4** | NO |
| Progress | fitness/progress.tsx | 4 | 4 | 5 | 4 | 5 | **4.4** | NO |
| Pain Tracker | fitness/pain-tracker.tsx | 3 | 3 | 5 | 4 | 3 | **3.6** | YES |
| Mobility | fitness/mobility.tsx | 3 | 3 | 5 | 4 | 3 | **3.6** | YES |
| Posture Check | fitness/posture-check.tsx | 3 | 3 | 5 | 4 | 3 | **3.6** | YES |
| Supplement Scanner | fitness/supplement-scanner.tsx | 3 | 3 | 5 | 4 | 3 | **3.6** | YES |
| Progress Photos | fitness/progress-photos.tsx | 3 | 4 | 5 | 4 | 3 | **3.8** | NO |
| Nutrition Home | nutrition/index.tsx | 3 | 3 | 4 | 4 | 3 | **3.4** | YES |
| Add Food | nutrition/add-food.tsx | 3 | 3 | 4 | 4 | 4 | **3.6** | YES |
| Meal Camera | nutrition/meal-camera.tsx | 4 | 4 | 5 | 3 | 3 | **3.8** | YES |
| Barcode Scanner | nutrition/barcode-scanner.tsx | 4 | 5 | 5 | 3 | 4 | **4.2** | NO |
| Menu Scanner | nutrition/menu-scanner.tsx | 3 | 3 | 5 | 3 | 3 | **3.4** | YES |
| Grocery List | nutrition/grocery-list.tsx | 4 | 4 | 5 | 4 | 4 | **4.2** | NO |
| Meal Plans | nutrition/meal-plans.tsx | 3 | 3 | 5 | 4 | 3 | **3.6** | YES |
| Meal Prep | nutrition/meal-prep.tsx | 3 | 3 | 5 | 4 | 3 | **3.6** | YES |
| Saved Meals | nutrition/saved-meals.tsx | 4 | 4 | 5 | 4 | 4 | **4.2** | NO |
| Supplements | nutrition/supplements.tsx | 4 | 4 | 5 | 4 | 4 | **4.2** | NO |
| Analytics | nutrition/analytics.tsx | 4 | 3 | 5 | 4 | 4 | **4.0** | NO |
| Goals Home | goals/index.tsx | 3 | 3 | 4 | 3 | 4 | **3.4** | YES |
| Habits | goals/habits.tsx | 4 | 4 | 5 | 4 | 3 | **4.0** | NO |
| Sleep | goals/sleep.tsx | 3 | 3 | 3 | 4 | 4 | **3.4** | YES |
| Mood | goals/mood.tsx | 3 | 3 | 5 | 4 | 3 | **3.6** | YES |
| Journal | goals/journal.tsx | 4 | 4 | 5 | 4 | 4 | **4.2** | NO |
| Challenges | goals/challenges.tsx | 4 | 4 | 5 | 4 | 4 | **4.2** | NO |
| Challenge Detail | goals/challenge-detail.tsx | 4 | 4 | 5 | 4 | 4 | **4.2** | NO |
| Challenge Active | goals/challenge-active.tsx | 4 | 4 | 5 | 4 | 4 | **4.2** | NO |
| Challenge Builder | goals/challenge-builder.tsx | 3 | 3 | 5 | 4 | 3 | **3.6** | YES |
| Skills | goals/skills.tsx | 3 | 3 | 5 | 4 | 3 | **3.6** | YES |
| Focus Mode | goals/focus-mode.tsx | 4 | 5 | 5 | 4 | 4 | **4.4** | NO |
| Stake Goals | goals/stake-goals.tsx | 3 | 3 | 4 | 4 | 4 | **3.6** | YES |
| Vision Board | goals/vision-board.tsx | 3 | 3 | 5 | 4 | 4 | **3.8** | NO |
| Insights | goals/insights.tsx | 3 | 3 | 5 | 4 | 4 | **3.8** | NO |
| Affirmations | goals/affirmations.tsx | 4 | 4 | 5 | 4 | 3 | **4.0** | NO |
| Health ROI | goals/health-roi.tsx | 3 | 3 | 5 | 4 | 3 | **3.6** | YES |
| Retrospective | goals/retrospective.tsx | 3 | 3 | 5 | 4 | 3 | **3.6** | YES |
| Community | goals/community.tsx | 3 | 3 | 5 | 4 | 3 | **3.6** | YES |
| Business Home | goals/business/index.tsx | 3 | 3 | 5 | 4 | 3 | **3.6** | YES |
| Business Revenue | goals/business/revenue.tsx | 4 | 4 | 5 | 4 | 4 | **4.2** | NO |
| Business Customers | goals/business/customers.tsx | 3 | 3 | 5 | 4 | 3 | **3.6** | YES |
| Business Milestones | goals/business/milestones.tsx | 4 | 4 | 5 | 4 | 3 | **4.0** | NO |
| Finance Home | goals/finance/index.tsx | 3 | 3 | 5 | 4 | 4 | **3.8** | NO |
| Finance Budgets | goals/finance/budgets.tsx | 3 | 3 | 5 | 4 | 3 | **3.6** | YES |
| Finance Net Worth | goals/finance/net-worth.tsx | 4 | 4 | 5 | 4 | 3 | **4.0** | NO |
| Finance Transactions | goals/finance/transactions.tsx | 4 | 4 | 5 | 4 | 4 | **4.2** | NO |
| Profile Home | profile/index.tsx | 2 | 2 | 5 | 4 | 2 | **3.0** | YES |
| Edit Profile | profile/edit-profile.tsx | 3 | 4 | 5 | 4 | 3 | **3.8** | NO |
| Achievements | profile/achievements.tsx | 4 | 4 | 5 | 4 | 5 | **4.4** | NO |
| Dashboard Builder | profile/dashboard-builder.tsx | 3 | 3 | 5 | 4 | 2 | **3.4** | YES |
| Partner Profile | profile/partner.tsx | 3 | 3 | 5 | 4 | 3 | **3.6** | YES |
| Integrations | profile/integrations.tsx | 3 | 3 | 5 | 4 | 3 | **3.6** | YES |
| Notification Settings | profile/notifications-settings.tsx | 3 | 3 | 5 | 4 | 3 | **3.6** | YES |
| NFC Setup | profile/nfc-setup.tsx | 3 | 3 | 5 | 4 | 3 | **3.6** | YES |
| Wearables | profile/wearables.tsx | 3 | 3 | 5 | 4 | 3 | **3.6** | YES |
| Data Export | profile/data-export.tsx | 4 | 4 | 5 | 4 | 4 | **4.2** | NO |
| About | profile/about.tsx | 4 | 5 | 5 | 4 | 4 | **4.4** | NO |
| Partner Dashboard | partner/dashboard.tsx | 3 | 3 | 5 | 4 | 4 | **3.8** | NO |
| Partner Nudge | partner/nudge.tsx | 4 | 4 | 5 | 4 | 3 | **4.0** | NO |
| Partner Challenges | partner/challenges.tsx | 3 | 3 | 5 | 4 | 3 | **3.6** | YES |
| Partner Live Workout | partner/live-workout.tsx | 3 | 3 | 5 | 4 | 3 | **3.6** | YES |
| Daily Briefing | daily-briefing.tsx | 3 | 3 | 5 | 2 | 2 | **3.0** | YES |
| Weekly Review | weekly-review.tsx | 3 | 3 | 5 | 4 | 4 | **3.8** | NO |
| Trajectory | trajectory.tsx | 3 | 3 | 5 | 2 | 2 | **3.0** | YES |
| Chat | chat.tsx | 4 | 5 | 5 | 4 | 4 | **4.4** | NO |
| Chat History | chat-history.tsx | 4 | 4 | 5 | 4 | 4 | **4.2** | NO |
| Upgrade | upgrade.tsx | 4 | 5 | 5 | 4 | 4 | **4.4** | NO |
| Goal Cinema | goal-cinema.tsx | 4 | 5 | 5 | 3 | 3 | **4.0** | NO |
| Labs Index | labs/index.tsx | 3 | 3 | 5 | 4 | 3 | **3.6** | YES |
| Labs Detail | labs/detail.tsx | 4 | 4 | 5 | 4 | 4 | **4.2** | NO |
| Labs Upload | labs/upload.tsx | 3 | 3 | 5 | 4 | 3 | **3.6** | YES |

### Summary

- **Screens scoring avg <= 3.0 (critical):** 3 (Profile Home, Daily Briefing, Trajectory)
- **Screens scoring avg <= 3.4 (high priority):** 8 (Dashboard, Nutrition Home, Goals Home, Sleep, Menu Scanner, Dashboard Builder, + above 3)
- **Screens scoring avg <= 3.6 (remediation candidates):** 32 total
- **Screens scoring avg >= 4.0 (healthy):** 35 screens

### Top Issues by Axis

**Density (too much or too little):**
- Dashboard: 13+ cards in a single scroll, no information hierarchy
- Profile Home: Settings list without context or status indicators

**Hierarchy (primary action not obvious):**
- Dashboard: Quick Actions compete with AI card, weather, and prediction for attention
- Goals Home: 9 navigation items in horizontal scroll, primary action unclear
- Nutrition Home: FAB, meal sections, water tracker all compete

**Wayfinding:**
- Daily Briefing: No navigation except back button
- Trajectory: Feature gate can strand user
- Meal Camera: No graceful degradation when feature is locked

**State Completeness:**
- Profile Home: No loading skeleton, no error state, no empty state
- Dashboard Builder: No skeleton, no refresh control
- Daily Briefing: No skeleton, no error state

---

## DELIVERABLE 6: HELP COVERAGE GAP TABLE (Step 6)

### Screens with Hierarchy or Wayfinding Score <= 3

| Screen | HelpIcon in Header? | Coachmark Registered? | ScreenHelpButton? | Recommended Addition |
|--------|---------------------|----------------------|-------------------|---------------------|
| Dashboard | YES | YES (3 steps) | N/A (tab screen) | Add coachmark step for QuickStatsRow; add coachmark for Today's Plan |
| Nutrition Home | YES (via AIInsightCard) | YES (3 steps) | N/A (tab screen) | Add coachmark for water tracker; add coachmark for FAB menu options |
| Goals Home | YES (implicit) | YES (2 steps) | N/A (tab screen) | Add coachmark for navigation grid explaining each domain; add HelpBubble on deadline editing |
| Sleep | YES (via screenHelp) | NO | NO | **ADD** Coachmark sequence: time input, quality stars, AI recommendation; register in coachmarkSteps.ts |
| Mood | YES (via screenHelp) | NO | NO | **ADD** Coachmark for slider usage, context selector, and correlation insights section |
| Profile Home | YES (via screenHelp) | NO | NO | **ADD** Coachmark for coaching tone selector, partner link, and notification settings |
| Daily Briefing | NO | NO | NO | **ADD** HelpIcon in header; ADD ScreenHelpButton explaining briefing content |
| Trajectory | NO | NO | NO | **ADD** HelpIcon; ADD coachmark explaining trajectory simulation controls |
| Add Food | YES (via screenHelp) | NO | NO | **ADD** Coachmark for search vs camera vs barcode decision; explain batch queueing |
| Meal Camera | YES (via screenHelp) | NO | NO | **ADD** Coachmark: explain confidence scores, how to improve photo quality |
| Menu Scanner | YES (via screenHelp) | NO | NO | **ADD** Coachmark for scan technique tips |
| Dashboard Builder | YES (via screenHelp) | NO | NO | **ADD** Coachmark for drag-and-drop widget arrangement |
| Pain Tracker | YES (via screenHelp) | NO | NO | **ADD** Coachmark for body map interaction and pain scale |
| Stake Goals | YES (via screenHelp) | NO | NO | **ADD** Coachmark explaining stake mechanics and evaluation schedule |
| Business Home | YES (via screenHelp) | YES (2 steps) | NO | Existing coachmarks adequate |

### Gated Feature Help Coverage

| Gated Feature | ScreenHelpButton Before Lock? | HelpBubble Explaining Gate? | Recommended |
|--------------|-------------------------------|---------------------------|-------------|
| Readiness Score | NO | NO | Add HelpBubble at QuickStatsRow readiness cell explaining what it is + why it's gated |
| Meal Camera | NO | NO | Add HelpBubble before FeatureLockOverlay explaining value of camera logging |
| Trajectory | NO | NO | Add HelpBubble on trajectory entry point explaining the simulation |
| Stake Goals | NO | NO | Add HelpBubble explaining financial accountability concept |
| AI Form Check | NO | NO | Add HelpBubble explaining AI video analysis benefit |
| Labs Interpretation | NO | NO | Add HelpBubble on labs entry explaining biomarker intelligence |

### Summary
- **Screens with full help coverage (HelpIcon + Coachmark):** 5 (Dashboard, Nutrition, Goals, Workout Player, Business)
- **Screens with HelpIcon only (no coachmark):** ~60
- **Screens with no help assets at all:** 2 (Daily Briefing, Trajectory)
- **Gated features with pre-gate help:** 0/6

---

## DELIVERABLE 7: REMEDIATION PLAN, ORDERED BY IMPACT / RISK (Step 7)

### Priority 1: Dashboard Above-Fold Restructure (HIGHEST IMPACT)

**Problem:** 11 of 12 target metrics are below the fold. Weather card takes premium space. No day score rendered.
**File:** `app/(tabs)/dashboard.tsx`
**Change:**
1. Move QuickStatsRow (streak, workouts, calories, readiness) to immediately below greeting, before quick actions
2. Add compact "Today's Vitals" strip: weight delta vs goal, habits remaining count, partner last-active
3. Move Weather card below the fold (or collapse to single-line strip)
4. Add Day Score display (computed from habits completed / total + readiness + nutrition adherence)
5. Restructure Today's Plan to compact format above quick actions
**Tap-count delta:** View readiness: scroll+0 → 0 taps. View streak: scroll+0 → 0 taps. View today's plan: scroll+0 → 0 taps.
**Above-fold delta:** +8 metrics visible without scroll
**Risk:** LOW. Additive restructure within existing file. No store changes. No navigation changes.
**Test plan:** Visual regression on iPhone 12 + Pixel 7 viewports. Verify all stores still queried. Verify all cards still render (just reordered).

### Priority 2: Quick-Log Row Addition (HIGH IMPACT)

**Problem:** Only 3 quick actions (Workout, Meal, Weight). Missing: Water, Mood, Habit.
**File:** `app/(tabs)/dashboard.tsx`
**Change:** Replace 3-tile quick actions with 6-target Quick Log row (44pt targets): Workout, Meal, Water, Weight, Mood, Habit. Tap = 1-step quick log. Long-press = detail entry.
**Tap-count delta:** Log water: 3 → 1. Complete habit: 3 → 1. Log mood: 4 → 1.
**Above-fold delta:** +3 quick actions visible
**Risk:** LOW. Existing QuickActionTile component can be reused with smaller size. New quick-log actions need to invoke existing store actions directly.
**Test plan:** Verify haptic feedback. Verify offline queue for each action. Verify ActionToast confirmation.

### Priority 3: AICoachFAB Creation (HIGH IMPACT)

**Problem:** No persistent AI chat entry point. Part 0 assumed it existed but it was never built.
**File:** NEW `components/ui/AICoachFAB.tsx` + mount in tab layout
**Change:** Create floating action button with cyan glow, persistent across all tab screens, positioned bottom-right above tab bar. Tap opens `/chat`. Long-press opens quick-action menu (voice command, daily briefing, weekly review).
**Tap-count delta:** Access AI chat: conditional 2+ taps → 1 tap from any screen
**Risk:** LOW. New file, no existing file modification except tab layout to mount FAB.
**Test plan:** Verify FAB visible on all 5 tabs. Verify navigation to chat. Verify long-press menu. Verify FAB does not overlap tab bar or content.

### Priority 4: Sleep Time Picker (HIGH IMPACT, LOW EFFORT)

**Problem:** Sleep logging requires typing HH:MM manually = 27-31 taps per log.
**File:** `app/(tabs)/goals/sleep.tsx`
**Change:** Replace text inputs for bedtime/wake time with time picker wheels (using `@react-native-community/datetimepicker` or equivalent). Add smart defaults (10:30pm bedtime, 6:30am wake).
**Tap-count delta:** Log sleep: 27-31 → 5-8 taps
**Risk:** LOW. UI-only change within sleep modal. No store changes.
**Test plan:** Verify picker renders on iOS and Android. Verify time stored correctly. Verify smart defaults calculate duration accurately.

### Priority 5: Dashboard Meal Camera Shortcut (MEDIUM IMPACT)

**Problem:** Meal camera requires 5 taps from cold open (Dashboard → Nutrition tab → FAB → Camera option → Capture).
**File:** `app/(tabs)/dashboard.tsx` (Quick Log row modification)
**Change:** Add camera icon to Quick Log row. Long-press on "Meal" quick action shows camera/barcode/search options.
**Tap-count delta:** Meal camera: 5 → 2 taps
**Risk:** LOW. Navigation change only.
**Test plan:** Verify camera permission still requested. Verify feature gate still respected.

### Priority 6: Coachmark Expansion (MEDIUM IMPACT, LOW EFFORT)

**Problem:** Only 5 screens have coachmark tours. 10+ high-traffic screens have no onboarding.
**Files:** `constants/coachmarkSteps.ts` + individual screens
**Change:** Add coachmark registrations for: Sleep, Mood, Add Food, Meal Camera, Pain Tracker, Dashboard Builder, Stake Goals (7 new tours)
**Tap-count delta:** No direct tap reduction, but reduces confusion-driven dead ends
**Risk:** VERY LOW. Additive content in constants file + ref attachments in screens.
**Test plan:** Verify each coachmark appears on first visit. Verify "seen" flag persists via MMKV.

### Priority 7: Help Bubble for Gated Features (MEDIUM IMPACT, LOW EFFORT)

**Problem:** 6 gated features have no help explaining what the feature is or why it's locked before the lock overlay appears.
**Files:** Individual screen files for gated features
**Change:** Add HelpBubble component before FeatureLockOverlay on each gated screen explaining the feature value.
**Tap-count delta:** Reduces abandon rate at lock overlay
**Risk:** VERY LOW. Additive HelpBubble insertion.
**Test plan:** Verify HelpBubble renders before lock. Verify dismissal persists.

### Priority 8: Goals Navigation Simplification (MEDIUM IMPACT)

**Problem:** Goals home has 9 nav items in horizontal scroll, only 3-4 visible at once.
**File:** `app/(tabs)/goals/index.tsx`
**Change:** Group nav items into 3 sections: "Daily" (Habits, Sleep, Mood, Journal), "Growth" (Skills, Focus, Vision Board, Challenges), "Financial" (Business, Finance, Stake Goals). Show as 3 expandable rows instead of 9 horizontal chips.
**Tap-count delta:** Finding target nav item: 1-3 scrolls → 1 tap to expand section
**Risk:** MEDIUM. Layout restructure that must preserve all navigation targets.
**Test plan:** Verify all 9 nav destinations still reachable. Verify category filter still works.

### Priority 9: Profile Home State Completeness (LOW IMPACT, LOW EFFORT)

**Problem:** Profile home has no skeleton, no error state, no empty state. Lowest state completeness score.
**File:** `app/(tabs)/profile/index.tsx`
**Change:** Add loading skeleton while profile data loads. Add error banner with retry. Add empty state for sections with no data.
**Tap-count delta:** No tap change, but reduces user confusion
**Risk:** VERY LOW. Additive state handlers.
**Test plan:** Simulate slow network. Verify skeleton appears. Verify error retry works.

### Priority 10: Daily Briefing Wayfinding Fix (LOW IMPACT, LOW EFFORT)

**Problem:** Daily Briefing screen has no navigation except back button. Dead-end risk.
**File:** `app/daily-briefing.tsx`
**Change:** Add "Go to Dashboard" CTA at bottom. Add HelpIcon in header. Add relevant action buttons (Start Workout, Log Meal) based on briefing content.
**Tap-count delta:** No direct reduction, but eliminates dead end
**Risk:** VERY LOW. Additive navigation links.
**Test plan:** Verify links navigate correctly. Verify back button still works.

### Priority 11: Transparency "Why This?" Layer (MEDIUM IMPACT, MEDIUM EFFORT)

**Problem:** AI recommendations have no transparency disclosure. Users cannot see what data informed the recommendation.
**Files:** `components/cards/AIInsightCard.tsx`, `components/cards/PredictionAlert.tsx`, new `components/ui/WhyThisSheet.tsx`
**Change:** Add "Why this?" link on every AI-surfaced card. Tapping opens bottom sheet showing: data points used, model name, confidence level, "Regenerate" and "This isn't right" actions. Requires new `ai_feedback` migration.
**Tap-count delta:** No direct reduction, but increases trust and engagement
**Risk:** MEDIUM. Requires new migration for ai_feedback table. New component. Modification of 2 existing card components (additive props only).
**Test plan:** Verify sheet renders with correct data. Verify feedback logs to Supabase. Verify regenerate calls edge function.

---

## DELIVERABLE 8: DASHBOARD REDESIGN SPEC (Step 8)

### Target: Single-Screen Dashboard, Above Fold on 390 x 844pt

```
┌─────────────────────────────────────────┐ 0pt
│          (safe area: ~48pt)             │
├─────────────────────────────────────────┤ 48pt
│                                         │
│  Good morning, Tyson.            [?]   │ } 40pt: Greeting
│  Sat, May 3  ·  Day 47  ·  Score 82   │ } 20pt: Date + Day Count + Day Score
│  ═══════════ (gradient bar)            │ } 3pt
│                                         │
├─────────────────────────────────────────┤ 111pt
│                                         │
│  ┌─Streak─┐ ┌Readiness┐ ┌─Weight──┐   │
│  │ 🔥 14d │ │  ❤️ 78% │ │ ↓2.3lbs │   │ } 60pt: Compact Header Strip
│  └────────┘ └─────────┘ └─────────┘   │
│                                         │
├─────────────────────────────────────────┤ 179pt
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  TODAY'S PLAN               ▸   │   │
│  │  🏋️ Push Day (Chest/Tri)  Sched │   │ } 140pt: Today Card
│  │  🍴 3 meals logged / 4 target   │   │
│  │  ✅ 2 habits remaining          │   │
│  │  💧 24 / 64 oz                  │   │
│  │  🏆 75-Day Fasting Challenge    │   │  (ActiveChallenge inline if present)
│  └─────────────────────────────────┘   │
│                                         │
├─────────────────────────────────────────┤ 327pt
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  ● AI COACH              2h ago │   │
│  │  "Your sleep quality dropped    │   │ } 120pt: AI Coach Proactive Card
│  │  to 2 stars last night. Today   │   │
│  │  is a recovery day..."          │   │
│  │  [Start Recovery]  [Why this?]  │   │
│  └─────────────────────────────────┘   │
│                                         │
├─────────────────────────────────────────┤ 455pt
│                                         │
│  ┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐ │
│  │ 🏋️ ││ 🍴 ││ 💧 ││ ⚖️ ││ 😊 ││ ✅ │ │ } 88pt: Quick Log Row (6 x 44pt)
│  │Work││Meal││Watr││Wght││Mood││Hbit│ │
│  └────┘└────┘└────┘└────┘└────┘└────┘ │
│                                         │
├─────────────────────────────────────────┤ 551pt
│                                         │
│  ┌──Cal────┐┌──Pro────┐┌──H2O───┐┌Wrk┐│
│  │ 1240    ││ 89g     ││ 24oz   ││ ✓ ││ } 80pt: Today's Stats (compact)
│  │ /2200   ││ /150g   ││ /64oz  ││Done││
│  │ ▓▓▓░░░░ ││ ▓▓▓▓░░░ ││ ▓▓░░░░ ││   ││
│  └─────────┘└─────────┘└────────┘└───┘│
│                                         │
├─────────────────────────────────────────┤ 639pt
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  👫 Partner: Sarah              │   │ } 44pt: Vitals Strip (Partner)
│  │  Joint streak: 12d  ·  Active 2h│   │
│  └─────────────────────────────────┘   │
│                                         │
├─────────────────────────────────────────┤ 691pt
│          ┌─ TAB BAR ─┐                 │
│  (remaining: ~105pt to bottom)         │ ← ~105pt remaining before tab bar
│                                         │  This means 691pt of content fits
│                                         │  above the tab bar on 390x844
└─────────────────────────────────────────┘ 796pt (usable)
```

### What's Now Above the Fold

| Information | Previously | Now |
|------------|-----------|-----|
| Day score | NOT SHOWN | **Above fold** (header strip) |
| Readiness score | Below fold (~802pt) | **Above fold** (header strip) |
| Current streak | Below fold (~802pt) | **Above fold** (header strip) |
| Weight delta | Below fold (~990pt) | **Above fold** (header strip) |
| Today's plan | Below fold (~904pt) | **Above fold** (Today Card) |
| Macros remaining | Below fold (~807pt) | **Above fold** (Today's Stats) |
| Habits remaining | Below fold (~940pt) | **Above fold** (Today Card) |
| Partner status | Below fold (~949pt) | **Above fold** (Vitals Strip) |
| Active challenge | Below fold (~789pt) | **Above fold** (Today Card inline) |
| AI recommendation | Borderline (~504pt) | **Above fold** (AI Coach Card) |
| Quick log targets | 3 targets | **6 targets** above fold |
| Weather | Above fold (~412pt) | **Below fold** (moved down) |

**Result: 11/12 target metrics now above the fold** (business KPI intentionally below fold as it's a secondary domain).

### Component Composition Tree

```
DashboardScreen (existing)
├── ScreenBackground (existing, unchanged)
├── AmbientBackground (existing, unchanged)
├── PurpleRadialBackground (existing, unchanged)
├── NoiseOverlay (existing, unchanged)
├── TabHeroBackground (existing, reduce height to 180)
├── ScrollView (existing)
│   ├── GreetingHeader (existing, ADD day count + day score)
│   │   ├── HelpIcon (existing)
│   │   └── DayScoreBadge (NEW: computed from habits + readiness + nutrition)
│   ├── CompactVitalsStrip (NEW)
│   │   ├── StreakBadge (reuse from QuickStatsRow item)
│   │   ├── ReadinessBadge (reuse from QuickStatsRow item)
│   │   └── WeightDeltaBadge (NEW: weight delta vs goal)
│   ├── TodayCard (NEW: consolidates Today's Plan + ActiveChallengeCard)
│   │   ├── PlanRow (existing sub-component, unchanged)
│   │   ├── ActiveChallengeCard (existing, rendered inline if active)
│   │   └── WaterProgress (NEW: inline water bar from nutrition store)
│   ├── AICoachCard (restructured from existing accountability card)
│   │   ├── Existing pulsing dot + title + body
│   │   ├── CTA button (existing "Talk to Coach")
│   │   └── WhyThisLink (NEW: opens transparency sheet)
│   ├── QuickLogRow (NEW: replaces existing 3-tile QuickActionTile section)
│   │   └── 6x QuickActionTile (existing component, reduced size)
│   ├── TodayStatsCard (existing, moved up from line 807)
│   │   └── StatsCell x4 (existing sub-component)
│   ├── PartnerVitalsStrip (NEW: compact partner status)
│   │   └── Existing partner data, condensed to single row
│   │
│   │── BELOW FOLD ────────────────────────
│   │
│   ├── WeatherCard (existing, moved down)
│   ├── AIInsightCard (existing, moved down)
│   ├── PredictionAlert (existing, moved down)
│   ├── CountdownCard (existing, moved down)
│   ├── Top3Streaks (existing, unchanged)
│   ├── GoalProgressRings (NEW: 7 mini progress rings for each domain)
│   ├── WeightChart (existing, unchanged)
│   ├── RevenueCard (existing, unchanged)
│   ├── RecentAchievements (existing, unchanged)
│   └── Coachmark (existing, updated steps)
└── AICoachFAB (NEW: mounted in tab layout, not in dashboard)
```

### Zustand Selector List Per Card

| Card | Store | Selector | Slice-based? |
|------|-------|----------|-------------|
| GreetingHeader | useProfileStore | `(s) => s.profile` | YES |
| DayScoreBadge | useHabitStore | `(s) => ({ habits: s.habits, todayCompletions: s.todayCompletions })` | YES |
| CompactVitalsStrip (streak) | useHabitStore | `(s) => s.overallStreak` | YES |
| CompactVitalsStrip (readiness) | Local state | `readinessScore` (from edge function) | N/A |
| CompactVitalsStrip (weight) | useProfileStore | `(s) => ({ current_weight: s.profile?.current_weight, goal_weight: s.profile?.goal_weight })` | YES |
| TodayCard (workout) | useWorkoutStore | `(s) => s.activeSession` | YES |
| TodayCard (meals) | useNutritionStore | `(s) => s.todayLogs` | YES |
| TodayCard (habits) | useHabitStore | `(s) => ({ habits: s.habits, todayCompletions: s.todayCompletions })` | YES |
| TodayCard (water) | useNutritionStore | `(s) => s.waterLogs` | YES |
| TodayCard (challenge) | useChallengeStore | `(s) => ({ activeEnrollment: s.activeEnrollment, challengeDefinitions: s.challengeDefinitions, todayLog: s.todayLog })` | YES |
| AICoachCard | useInsightStore | `(s) => s.proactiveMessages` | YES |
| QuickLogRow | N/A | No store read; actions dispatch to stores | N/A |
| TodayStatsCard | useNutritionStore | `(s) => ({ todayLogs: s.todayLogs, waterLogs: s.waterLogs })` | YES |
| TodayStatsCard | useProfileStore | `(s) => s.profile` (for targets) | YES |
| PartnerVitalsStrip | usePartnerStore | `(s) => ({ partnerProfile: s.partnerProfile, partnership: s.partnership })` | YES |

### React Query Key List Per Card

| Card | Query Key | Source |
|------|-----------|--------|
| CompactVitalsStrip (readiness) | `['readiness-score', userId]` | `supabase.functions.invoke('readiness-score')` |
| CompactVitalsStrip (weight) | `['weight-logs', userId]` | `supabase.from('weight_logs')` |
| TodayStatsCard (workouts this week) | `['workout-sessions-week', userId]` | `supabase.from('workout_sessions')` |
| RecentAchievements | `['user-achievements', userId]` | `supabase.from('user_achievements')` |

Note: Most data comes from Zustand stores hydrated on refresh, not direct React Query. The Supabase queries on dashboard are in a useEffect, not TanStack Query. This is a potential optimization target (migrate to TanStack Query for caching and deduplication) but is OUT OF SCOPE for this audit.

---

## DELIVERABLE 9: QUICK-LOG LAYER SPEC (Step 9)

### Entry Points

| Entry Point | Gesture | Implementation |
|------------|---------|----------------|
| Dashboard Quick Log Row | Tap (1-step log) / Long-press (detail) | Inline on dashboard, 6 targets |
| Tab bar long-press | Long-press active tab icon → haptic → bottom sheet | Tab bar event handler in `_layout.tsx` |
| AICoachFAB long-press | Long-press FAB → quick-log menu | AICoachFAB component (to be created) |
| Voice command | "Log water" / "Log mood 8" | Existing voice-command service (`ai-voice-command` edge function) |
| NFC tag tap | NFC → intent → quick-log action | Existing NFC setup (`profile/nfc-setup.tsx`) |

### Quick-Log Sheet Contents

```
┌─────────────────────────────────────────┐
│  Quick Log                         ✕    │
├─────────────────────────────────────────┤
│                                         │
│  ┌────┐  ┌────┐  ┌────┐               │
│  │ 🏋️ │  │ 🍴 │  │ 💧 │               │
│  │Work │  │Meal│  │+8oz│               │  Row 1: Physical
│  └────┘  └────┘  └────┘               │
│                                         │
│  ┌────┐  ┌────┐  ┌────┐               │
│  │ ⚖️ │  │ 😊 │  │ ✅ │               │
│  │Wght │  │Mood│  │Hbit│               │  Row 2: Tracking
│  └────┘  └────┘  └────┘               │
│                                         │
└─────────────────────────────────────────┘
```

### Quick-Log Actions (Tap = 1-step)

| Target | Tap Action | Store Action | Offline? | Confirmation |
|--------|-----------|-------------|----------|-------------|
| Workout | `router.push('/(tabs)/fitness')` | N/A (navigates) | N/A | N/A |
| Meal | `router.push('/(tabs)/nutrition/add-food')` | N/A (navigates) | N/A | N/A |
| Water (+8oz) | `useNutritionStore.getState().logWater(8)` | `logWater(amount_oz)` | YES (offline queue) | Haptic + ActionToast "8oz logged" |
| Weight | Opens weight input bottom sheet | `logWeight(weight_lbs)` via Supabase | YES (offline queue) | Haptic + ActionToast "Weight logged" |
| Mood | Opens mood quick-select (5 emoji buttons: 😫😕😐🙂😄) | `useMoodStore.getState().logMood({mood, energy})` | YES (offline queue) | Haptic + ActionToast "Mood logged" |
| Habit | Opens habit checklist (top 5 incomplete habits) | `useHabitStore.getState().toggleHabit(habitId)` | YES (offline queue) | Haptic + ActionToast "{habit} complete" |

### Long-Press Actions (Detail Entry)

| Target | Long-Press Action |
|--------|------------------|
| Workout | Opens workout type selector (program day, empty, recent template) |
| Meal | Opens meal method selector (Camera, Barcode, Search, Saved Meal) |
| Water | Opens water amount selector (4oz, 8oz, 12oz, 16oz, custom) |
| Weight | Same as tap (weight input sheet) |
| Mood | Opens full mood screen (`/(tabs)/goals/mood`) |
| Habit | Opens full habits screen (`/(tabs)/goals/habits`) |

### Implementation Notes

- Quick-log actions commit offline-first via existing `offlineSyncStore` queue
- Sync indicator (existing) shows pending items
- Confirmation uses existing `ActionToast` component
- Haptic feedback uses existing `hapticLight()` utility
- Bottom sheet uses existing pattern from nutrition FAB

---

## DELIVERABLE 10: TRANSPARENCY LAYER SPEC (Step 10)

### "Why This?" Affordance Design

Every AI-surfaced recommendation card receives a "Why this?" link. Tapping opens a bottom sheet with:

```
┌─────────────────────────────────────────┐
│  Why this recommendation?          ✕    │
├─────────────────────────────────────────┤
│                                         │
│  Based on your last 7 days:             │
│                                         │
│  • Sleep quality averaged 2.8/5 stars   │
│  • 4 of 7 workouts completed            │
│  • Protein target hit 3/7 days          │
│  • Mood trend: declining since Tue      │
│  • Readiness: 52% (below your avg 71%)  │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  Model: Claude Sonnet 4                 │
│  Confidence: Medium (5 of 7 days        │
│    have complete data)                  │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  ┌──────────────┐  ┌───────────────┐   │
│  │  Regenerate   │  │ Not helpful   │   │
│  └──────────────┘  └───────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

### Components

| Component | File | Type |
|-----------|------|------|
| WhyThisSheet | `components/ui/WhyThisSheet.tsx` | NEW |
| WhyThisLink | Inline in AIInsightCard, PredictionAlert, accountability card | ADDITIVE PROP |

### Data Flow

1. AI edge functions already receive full `UserAIContext` via `context.ts` (14 DB queries)
2. Edge functions should return a `reasoning` field alongside the recommendation (requires edge function update)
3. `WhyThisSheet` renders the reasoning bullets, model info, confidence level
4. "Regenerate" calls the same edge function with `force_refresh: true`
5. "Not helpful" logs to `ai_feedback` table

### ai_feedback Table Migration

```sql
-- 00053_ai_feedback.sql
CREATE TABLE IF NOT EXISTS ai_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  ai_service TEXT NOT NULL,           -- e.g. 'ai-coach', 'ai-correlation'
  recommendation_id TEXT,             -- optional: ID of the specific recommendation
  feedback_type TEXT NOT NULL,        -- 'not_helpful', 'regenerate', 'helpful'
  context_snapshot JSONB,             -- snapshot of data points used
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ai_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own feedback" ON ai_feedback
  FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_ai_feedback_user ON ai_feedback(user_id);
CREATE INDEX idx_ai_feedback_service ON ai_feedback(ai_service);
```

### Confidence Framing

| Data Completeness | Label | Color |
|-------------------|-------|-------|
| 7/7 days complete data | High | `colors.accent.success` (#22C55E) |
| 4-6/7 days complete | Medium | `colors.accent.warning` (#F59E0B) |
| 1-3/7 days complete | Low | `colors.accent.danger` (#EF4444) |

### Surfaces That Need "Why This?"

| Surface | File | AI Service | Priority |
|---------|------|-----------|----------|
| AI Coach accountability card | dashboard.tsx:598-707 | ai-coach | P1 |
| AIInsightCard | components/cards/AIInsightCard.tsx | ai-screen-insight | P1 |
| PredictionAlert | components/cards/PredictionAlert.tsx | ai-pattern-detector | P1 |
| Workout narrator tips | fitness/workout-player.tsx | workout-narrator | P2 |
| Sleep AI recommendation | goals/sleep.tsx | ai-sleep-optimizer | P2 |
| Supplement recommendations | nutrition/supplements.tsx | ai-supplement | P2 |
| Challenge coaching cards | goals/challenge-active.tsx | challenge-coach | P3 |
| Meal camera confidence scores | nutrition/meal-camera.tsx | ai-meal-analysis | P3 |
| Trajectory projections | trajectory.tsx | ai-trajectory | P3 |

---

## DELIVERABLE 11: VERIFICATION MATRIX (Step 11)

### Change-to-Artifact Mapping

| Change | Routes Affected | Stores Affected | Selectors | RQ Keys | Edge Functions | RLS | Tests | Asset Check |
|--------|----------------|----------------|-----------|---------|---------------|-----|-------|-------------|
| Dashboard above-fold restructure | `/(tabs)/dashboard` | profileStore, workoutStore, nutritionStore, habitStore, goalStore, partnerStore, insightStore, challengeStore, businessStore | All existing selectors preserved (reorder only) | None changed | readiness-score (unchanged) | None | Visual regression | N/A |
| Quick-Log Row | `/(tabs)/dashboard` | nutritionStore (logWater), moodStore (logMood), habitStore (toggleHabit) | New: `useNutritionStore(s => s.logWater)`, `useMoodStore(s => s.logMood)`, `useHabitStore(s => s.toggleHabit)` | None | None | None | New: quick-log integration | N/A |
| AICoachFAB creation | All tab routes (mounted in layout) | None | None | None | None | None | New: FAB visibility, navigation | N/A |
| Sleep time picker | `/(tabs)/goals/sleep` | sleepStore | Unchanged | None | None | None | Update: sleep log flow | N/A |
| Coachmark expansion | 7 screens | None | None | None | None | None | New: coachmark render tests | N/A |
| Help bubbles for gates | 6 screens | None | None | None | None | None | New: HelpBubble render | N/A |
| Goals nav simplification | `/(tabs)/goals` | goalStore | Unchanged | None | None | None | Update: nav target tests | N/A |
| Profile state completeness | `/(tabs)/profile` | profileStore | Unchanged | None | None | None | New: loading/error states | N/A |
| Daily briefing wayfinding | `/daily-briefing` | None | None | None | None | None | New: navigation test | N/A |
| Transparency layer | dashboard, AIInsightCard, PredictionAlert | insightStore (additive) | New: feedback selectors | None | All AI functions (additive `reasoning` field) | NEW: ai_feedback RLS | New: WhyThis rendering, feedback logging | N/A |
| ai_feedback migration | N/A | N/A | N/A | N/A | N/A | NEW policy | N/A | N/A |

### Pre/Post Count Verification

| Metric | Pre-Change Count | Post-Change Count | Delta |
|--------|-----------------|-------------------|-------|
| Screens | 93 | 93 | 0 (no screens added or removed) |
| Stores | 21 | 21 | 0 (no stores modified) |
| Edge Functions | 52 | 52 | 0 (existing functions get additive `reasoning` field) |
| Migrations | 53 | 54 | +1 (ai_feedback table only) |
| New Components | 0 | 4 | +4 (AICoachFAB, WhyThisSheet, CompactVitalsStrip, QuickLogRow) |
| Modified Components | 0 | ~8 | +8 (dashboard.tsx, AIInsightCard, PredictionAlert, sleep.tsx, coachmarkSteps.ts, 3 gated screens) |

---

## DELIVERABLE 12: SEQUENCED CLAUDE CODE PROMPT PACK

Prompts have been written to `/mnt/user-data/outputs/UX-REMEDIATION-PROMPTS/`. See individual files for paste-ready prompts.

### Prompt Sequence (safe for parallel execution where noted)

| # | File | Description | Parallel Group | Dependencies |
|---|------|-------------|---------------|--------------|
| 01 | `01-dashboard-above-fold.md` | Restructure dashboard layout for above-fold metrics | A | None |
| 02 | `02-quick-log-row.md` | Add 6-target Quick Log Row to dashboard | A | None (can run with 01 if careful about line refs) |
| 03 | `03-ai-coach-fab.md` | Create AICoachFAB component + mount in tab layout | B | None |
| 04 | `04-sleep-time-picker.md` | Replace text inputs with time picker in sleep logger | B | None |
| 05 | `05-coachmark-expansion.md` | Add coachmark tours to 7 screens | C | None |
| 06 | `06-help-bubbles-gated.md` | Add HelpBubble to 6 gated feature screens | C | None |
| 07 | `07-goals-nav-simplify.md` | Restructure goals navigation grid | D | None |
| 08 | `08-profile-state-fix.md` | Add skeleton/error/empty states to profile home | D | None |
| 09 | `09-daily-briefing-wayfinding.md` | Add navigation links to daily briefing | D | None |
| 10 | `10-transparency-migration.md` | Create ai_feedback migration | E | None |
| 11 | `11-transparency-why-this.md` | Build WhyThisSheet + integrate into AI cards | E | 10 |
| 12 | `12-ai-proactive-hooks.md` | Add proactive trigger specifications for AI services | F | 03 |

**Parallel groups A-D can all run simultaneously.** Group E depends on its internal ordering. Group F depends on AICoachFAB existing.

---

*End of audit document. Prompt pack files follow in separate deliverable.*
