# TRANSFORMR — Challenge Modules Plan
## Popular Program Monitoring & Tracking System

---

## OVERVIEW

TRANSFORMR will include a **Challenge Center** — a dedicated section where users can activate, track, and complete popular fitness and life transformation challenges with full automated monitoring. Unlike other apps that simply provide checklists, TRANSFORMR's challenge modules are deeply integrated into the existing tracking infrastructure: workouts auto-count, nutrition auto-verifies, water auto-tracks, reading auto-logs, and photos auto-capture. The app does the monitoring — the user just lives the challenge.

This is a massive differentiator. Currently, people doing 75 Hard track their tasks on paper, notes apps, or basic checklist apps that have zero integration with actual fitness or nutrition data. TRANSFORMR eliminates that entirely.

---

## CHALLENGE CENTER UI

### Location in App
- New section accessible from the **Goals Tab** → "Challenges" screen
- Also promoted on the **Dashboard** when an active challenge is running
- Challenge progress widget available in the **Dashboard Builder**

### Challenge Center Home Screen
- **Active Challenge** card at top (if enrolled) with day counter, task checklist, streak status
- **Browse Challenges** grid below — categorized cards for each available program
- **Completed Challenges** archive with badges earned
- **Custom Challenge** builder (create your own rules)
- **Partner Challenges** — invite Danyell to do the same challenge side by side

### Active Challenge Dashboard (When Enrolled)
- Large day counter: "Day 23 of 75"
- Daily task checklist with auto-verified items (green check when data confirms completion)
- Progress ring showing % complete
- Streak indicator (consecutive days completed)
- "Fail" warning if a task is at risk of being missed (e.g., 10 PM and no second workout logged)
- Calendar heatmap of completed vs missed days
- Partner's progress (if both enrolled)
- AI coaching specific to the challenge: "You're on Day 23 of 75 Hard. Don't skip that outdoor workout — it's 72°F in Phoenix right now, perfect for a walk."

---

## CHALLENGE MODULES (12 Programs)

### 1. 75 HARD

**Source:** Andy Frisella (2019). 1B+ TikTok views. The most viral fitness challenge ever created.

**Duration:** 75 days (restart from Day 1 on any failure)

**Daily Requirements:**
| Task | Auto-Verification Method |
|------|------------------------|
| Follow a diet (no cheats, no alcohol) | User selects diet plan during enrollment. App verifies all logged meals comply. Flags unlogged meals. AI reviews meal photos for compliance. |
| Two 45-minute workouts (one outdoor) | Auto-detected from workout_sessions. Duration must be >= 45 min each. GPS/location confirms outdoor for one session. Must be 3+ hours apart. |
| Drink 1 gallon of water (128 oz) | Auto-tracked from water_logs. Running total displayed prominently. Reminders intensify as day progresses if behind. |
| Read 10 pages of nonfiction | User logs pages read via reading tracker in Skills module. Can scan book barcode to auto-identify. Audiobooks do NOT count (per official rules). |
| Take a daily progress photo | App prompts at configurable time. Photo saved to progress-photos storage bucket. Alignment guide overlay for consistency. |

**Restart Rule:** If ANY task is missed on any day, challenge resets to Day 1. App tracks restart count. Confirmation dialog before resetting.

**TRANSFORMR Enhancements:**
- AI diet compliance checker — analyzes logged meals against chosen diet rules
- Location-verified outdoor workout — GPS confirms user was outside
- Smart notifications that escalate urgency as day progresses: gentle at noon, firm at 6 PM, urgent at 9 PM
- "Close Call" badge for days where all tasks completed in final hour
- Progress photo time-lapse generator at completion
- Couples mode — both partners do 75 Hard, app tracks joint completion
- Restart counter with AI reflection: "This is restart #2. Last time you failed on Day 18 because of the water goal. Here's a hydration strategy..."

---

### 2. 75 SOFT

**Source:** Community alternative to 75 Hard. Designed for sustainability over rigidity.

**Duration:** 75 days (no restart on failure — track consistency percentage instead)

**Daily Requirements:**
| Task | Auto-Verification |
|------|-------------------|
| Eat well (focus on whole foods, no strict diet) | Nutrition logs checked for general quality — AI flags days with >50% processed food |
| 45-minute workout (one rest day/week allowed) | workout_sessions duration check. Rest day allowance tracked (max 1 per 7-day window) |
| Drink 3 liters of water (~101 oz) | water_logs total |
| Read 10 pages of any book | Reading log entry (any genre allowed, audiobooks accepted) |
| Active recovery on rest day | Light activity logged (walking, stretching, yoga) on the designated rest day |

**Scoring:** No restart rule. Instead, app calculates a consistency percentage and grades the user weekly. Completing 90%+ of tasks over 75 days earns the "75 Soft Champion" badge.

**TRANSFORMR Enhancements:**
- More forgiving — ideal for User B (Danyell) or beginners
- Social drinking allowed on social occasions (user self-reports)
- Weekly check-in prompts comparing Soft vs Hard progress

---

### 3. 75 MEDIUM

**Source:** Community middle-ground between Hard and Soft.

**Duration:** 75 days

**Daily Requirements:**
| Task | Auto-Verification |
|------|-------------------|
| Follow a diet 90% of the time | AI analyzes weekly nutrition compliance. 1 cheat meal per week allowed. |
| 45-minute workout daily | workout_sessions check |
| Drink half body weight (lbs) in oz of water | Calculated from profile.current_weight. E.g., 160 lbs = 80 oz target. Auto-adjusted as weight changes. |
| 10 min reading or listening (self-development) | Reading log or podcast log (audiobooks allowed) |
| 5 min meditation or prayer daily | Focus mode session logged with "meditation" category, >= 5 min |
| Progress photo Day 1 and Day 75 | Two photos minimum — prompted on enrollment and completion |

---

### 4. THE MURPH CHALLENGE

**Source:** CrossFit Hero WOD honoring Lt. Michael P. Murphy, Navy SEAL KIA June 28, 2005. Performed globally every Memorial Day.

**The Workout (Rx'd):**
- 1-mile run
- 100 pull-ups
- 200 push-ups
- 300 air squats
- 1-mile run
- Optional: 20 lb weighted vest (men) / 14 lb vest (women)

**TRANSFORMR Module — Two Modes:**

**Mode A: Murph Prep Program (30 days)**
A progressive training program building toward completing a full Murph. Auto-generated workout templates that ramp volume weekly:
- Week 1: Quarter Murph (25 pull-ups, 50 push-ups, 75 squats)
- Week 2: Third Murph
- Week 3: Half Murph
- Week 4: Full Murph attempt

Daily workouts focus on pull-up capacity, push-up endurance, squat volume, and running intervals. All tracked through the existing workout player with ghost mode showing previous attempts.

**Mode B: Murph Day (Single Event)**
- Full Murph workout pre-loaded as a template
- Partitioned option (Cindy-style: 20 rounds of 5/10/15) or unpartitioned
- Timer tracks total completion time
- Auto-logs all 600+ reps through the workout player
- Weighted vest toggle
- Leaderboard comparing times year-over-year
- Community leaderboard for all TRANSFORMR users
- Historical tracking: compare your Murph time Memorial Day 2026 vs 2027

---

### 5. COUCH TO 5K (C25K)

**Source:** Josh Clark (1996). The most popular beginner running program in history. Millions of completions worldwide.

**Duration:** 8-9 weeks (3 runs per week)

**Program Structure:**
| Week | Workout Pattern |
|------|----------------|
| 1 | Alternate 60s jog / 90s walk for 20 min |
| 2 | Alternate 90s jog / 2 min walk for 20 min |
| 3 | Two reps of: jog 90s, walk 90s, jog 3 min, walk 3 min |
| 4 | Jog 3 min, walk 90s, jog 5 min, walk 2.5 min, jog 3 min, walk 90s, jog 5 min |
| 5 | Progressive: jog 5 min, walk 3 min, jog 5 min -> by end: jog 20 min nonstop |
| 6 | Jog 5 min, walk 3 min, jog 8 min, walk 3 min, jog 5 min -> by end: jog 25 min |
| 7 | Jog 25 minutes nonstop |
| 8 | Jog 28 minutes -> Jog 30 minutes (5K distance) |

**TRANSFORMR Implementation:**
- Each run is a pre-built workout template with timed intervals
- Audio cues via the AI workout narrator: "Start jogging now... Walk for the next 90 seconds..."
- GPS tracking for distance and pace
- Haptic buzz for interval transitions
- Automatic progression — next week's workouts unlock when current week is complete
- Weather-aware: "It's 105F in Phoenix today. Consider running early morning or using a treadmill."
- Progress chart showing pace improvement and distance growth over 8 weeks
- Celebration on completing first continuous 5K run
- Spotify integration for run playlists

---

### 6. 30-DAY SQUAT CHALLENGE

**Duration:** 30 days

**Program:**
Progressive daily squat targets starting at 50 and building to 250:
| Day | Squats | | Day | Squats | | Day | Squats |
|-----|--------|---|-----|--------|---|-----|--------|
| 1 | 50 | | 11 | 130 | | 21 | 200 |
| 2 | 55 | | 12 | 135 | | 22 | Rest |
| 3 | 60 | | 13 | 140 | | 23 | 220 |
| 4 | Rest | | 14 | Rest | | 24 | 225 |
| 5 | 70 | | 15 | 160 | | 25 | 230 |
| 6 | 75 | | 16 | 165 | | 26 | Rest |
| 7 | 80 | | 17 | 170 | | 27 | 240 |
| 8 | Rest | | 18 | Rest | | 28 | 245 |
| 9 | 100 | | 19 | 180 | | 29 | 250 |
| 10 | 110 | | 20 | 190 | | 30 | 250 |

**TRANSFORMR Implementation:**
- Daily target shown on dashboard
- Quick-log button: tap to record completed squats
- Can log throughout the day in sets (e.g., 5 sets of 50)
- Progress bar showing cumulative squats over 30 days
- AI form check available for squat form via video
- Thigh measurement comparison Day 1 vs Day 30

---

### 7. 30-DAY PLANK CHALLENGE

**Duration:** 30 days

**Program:** Progressive plank holds from 20 seconds to 5 minutes:
- Day 1: 20s -> Day 10: 60s -> Day 20: 150s -> Day 30: 300s (5 min)
- Rest days every 4th day

**TRANSFORMR Implementation:**
- Built-in plank timer with haptic pulse every 15 seconds
- Voice encouragement from AI narrator: "30 seconds down. Stay tight. You've got this."
- Auto-logs hold time to workout_sets
- Tracks longest hold as a personal record

---

### 8. DRY JANUARY / SOBER OCTOBER

**Duration:** 30-31 days (calendar month)

**Rule:** Zero alcohol consumption for the entire month.

**TRANSFORMR Implementation:**
- Daily check-in: "Did you drink alcohol today?" Yes/No
- Streak counter for consecutive sober days
- Savings calculator: "You've saved $187 this month by not drinking" (based on user-configured average weekly spending on alcohol)
- Health impact tracker: sleep quality trend during the challenge, weight trend, mood trend, workout performance trend
- AI insights: "Your average sleep quality improved 1.3 points since starting Dry January"
- Partner mode: do it together with shared streak
- Can be activated for any month, not just January/October

---

### 9. WHOLE30

**Duration:** 30 days

**Rules:** Eliminate sugar, alcohol, grains, legumes, soy, and dairy for 30 days. No recreating baked goods or treats with compliant ingredients. No stepping on the scale during the challenge.

**TRANSFORMR Implementation:**
- AI meal compliance checker: scans all logged foods against Whole30 elimination list
- Meal camera flags non-compliant items: "That looks like it contains cheese — not Whole30 compliant"
- Scale lockout: weight logging disabled during the 30 days (unlocks on Day 31 for reveal)
- Compliant food database filter: search shows only Whole30-approved foods
- Meal prep planner generates Whole30-compliant weekly plans
- Grocery list auto-filtered for compliant items only
- Day 31 "Reintroduction" guide with AI coaching on systematic food reintroduction

---

### 10. 10,000 STEPS DAILY CHALLENGE

**Duration:** 30 days

**Rule:** Walk 10,000+ steps every day for 30 consecutive days.

**TRANSFORMR Implementation:**
- Apple Health / Google Fit integration for automatic step count import
- Live step counter on dashboard widget
- Daily progress bar toward 10,000
- GPS-tracked walks logged as cardio workout sessions
- Streak tracking with missed-day accountability
- Distance and calorie burn calculations
- "Walk & Talk" mode: automatically starts logging when geofence detects user leaving home
- Couples leaderboard: compare daily steps with Danyell
- Monthly total: aiming for 300,000+ steps in 30 days

---

### 11. INTERMITTENT FASTING CHALLENGE

**Duration:** 30 days

**Protocols (User Selects):**
- **16:8** — 16 hours fasting, 8-hour eating window
- **18:6** — 18 hours fasting, 6-hour eating window
- **20:4 (Warrior)** — 20 hours fasting, 4-hour eating window
- **5:2** — Normal eating 5 days, 500-600 calories on 2 days

**TRANSFORMR Implementation:**
- Fasting timer: visual countdown showing current fasting state (fasting/eating window)
- Eating window notifications: "Your eating window opens in 30 minutes" / "Your eating window closes in 1 hour — eat now"
- Nutrition logs validated against selected protocol (meals outside eating window flagged)
- Fasting streak counter
- AI insights correlating fasting days with energy, mood, and workout performance
- Autophagy timer (hours in fasted state, with science-based milestones at 12h, 16h, 18h, 24h)
- Not recommended to combine with 75 Hard (app warns if user tries to stack)

---

### 12. CUSTOM CHALLENGE BUILDER

**Let users create their own challenge with custom rules.**

**Configuration Options:**
- Duration: 7 / 14 / 21 / 30 / 60 / 75 / 90 / 100 / 365 days
- Daily tasks (select from available trackable metrics):
  - Workout (min duration, min count, indoor/outdoor requirement)
  - Calories (min/max target)
  - Protein (min target in grams)
  - Water (min oz)
  - Steps (min count)
  - Sleep (min hours)
  - Reading (min pages)
  - Meditation/focus (min minutes)
  - No alcohol
  - No sugar
  - Progress photo
  - Journal entry
  - Custom task (text-based, manual check-off)
- Restart rule: On/Off (75 Hard style reset vs consistency percentage)
- Stake: optional financial stake via Stripe
- Partner invite: challenge a specific partner
- Public/Private: share to community leaderboard or keep private

**This feature is an industry first.** No fitness app lets users build fully auto-tracked custom challenges with financial stakes and partner competition.

---

## DATABASE TABLES

```sql
-- Challenge definitions (pre-loaded + custom)
CREATE TABLE challenge_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  duration_days INTEGER NOT NULL,
  category TEXT CHECK (category IN ('mental_toughness', 'fitness', 'nutrition', 'running', 'strength', 'lifestyle', 'custom')),
  rules JSONB NOT NULL,
  restart_on_failure BOOLEAN DEFAULT false,
  is_system BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  icon TEXT,
  color TEXT,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'extreme')),
  estimated_daily_time_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User challenge enrollments
CREATE TABLE challenge_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  challenge_id UUID REFERENCES challenge_definitions(id),
  partnership_id UUID REFERENCES partnerships(id),
  started_at DATE NOT NULL DEFAULT CURRENT_DATE,
  target_end_date DATE NOT NULL,
  actual_end_date DATE,
  status TEXT CHECK (status IN ('active', 'completed', 'failed', 'abandoned')) DEFAULT 'active',
  current_day INTEGER DEFAULT 1,
  restart_count INTEGER DEFAULT 0,
  configuration JSONB,
  stake_goal_id UUID REFERENCES stake_goals(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Daily challenge completion logs
CREATE TABLE challenge_daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID REFERENCES challenge_enrollments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  tasks_completed JSONB NOT NULL,
  all_tasks_completed BOOLEAN DEFAULT false,
  auto_verified JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(enrollment_id, date)
);
```

---

## EDGE FUNCTIONS

### challenge-evaluator (Nightly Cron)
- Runs at midnight user timezone
- For each active enrollment:
  - Checks if all daily tasks were completed based on logged data
  - Auto-fills challenge_daily_logs from existing data (workout_sessions, nutrition_logs, water_logs, etc.)
  - If restart_on_failure is true and a task was missed -> reset current_day to 1, increment restart_count
  - If all 75/30/etc. days completed -> set status to 'completed', trigger achievement
  - Send push notification summary: "Day 23 of 75 Hard: All tasks completed!" or "You missed your second workout today. 75 Hard resets to Day 1."

### challenge-coach (AI)
- Triggered daily for active challenge enrollments
- Generates challenge-specific coaching based on progress, failures, and patterns
- "You've restarted 75 Hard twice because of the water goal. Today I'm sending you hourly hydration reminders."

---

## ACHIEVEMENTS (Challenge-Specific)

| Achievement | Trigger | Tier |
|-------------|---------|------|
| Day One | Start any challenge | Bronze |
| Halfway There | Reach 50% of any challenge | Bronze |
| 75 Hard Survivor | Complete 75 Hard | Diamond |
| 75 Soft Champion | Complete 75 Soft with 90%+ compliance | Gold |
| Murph Finisher | Complete a full Murph | Gold |
| Sub-40 Murph | Complete Murph in under 40 minutes | Diamond |
| Couch to Runner | Complete C25K | Silver |
| Squat Machine | Complete 30-Day Squat Challenge | Silver |
| Iron Plank | Hold a 5-minute plank | Gold |
| Sober Streak | Complete 30 days alcohol-free | Silver |
| Whole30 Clean | Complete Whole30 with zero violations | Gold |
| Step Master | 10,000 steps for 30 consecutive days | Silver |
| Challenge Stacker | Complete 3+ challenges in a year | Gold |
| Never Give Up | Restart a challenge after failure and complete it | Gold |
| Power Couple | Complete any challenge alongside partner | Gold |
| Challenge Creator | Create and complete a custom challenge | Silver |

---

## IMPLEMENTATION PRIORITY

| Priority | Module | Reason |
|----------|--------|--------|
| 1 | 75 Hard | Most viral, most searched, highest engagement potential |
| 2 | 75 Soft / 75 Medium | Accessible alternatives, broadens audience |
| 3 | Custom Challenge Builder | Unique differentiator, infinite replayability |
| 4 | Couch to 5K | Massive beginner audience, great onboarding funnel |
| 5 | 30-Day Squat Challenge | Simple, high completion rate, bodyweight friendly |
| 6 | The Murph Challenge | CrossFit community, Memorial Day viral moment |
| 7 | Dry January / Sober October | Lifestyle crossover, nutrition module integration |
| 8 | Whole30 | Nutrition-focused, strong meal camera integration |
| 9 | 30-Day Plank Challenge | Simple, timer-based, high engagement |
| 10 | 10,000 Steps | Broad appeal, Apple Health/Google Fit integration |
| 11 | Intermittent Fasting | Growing trend, unique fasting timer UI |

---

## COMPETITIVE ADVANTAGE

No app on the market offers auto-verified challenge tracking. Every 75 Hard app today is a manual checklist — the user checks boxes and hopes they're honest. TRANSFORMR verifies tasks automatically against real data:

- Workout logged in the app? Verified.
- Water intake reached 128 oz? Verified.
- Meal photo analyzed and diet-compliant? Verified.
- GPS confirms outdoor workout? Verified.
- Progress photo taken today? Verified.

This turns TRANSFORMR into the only app where completing a challenge actually means something — because the app proves it with data.
