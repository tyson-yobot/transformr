# Phase 4 — AI Predictive Engine

> Design Specification for TRANSFORMR Superpowers Module
> Generated: 2026-04-07 | Status: Design Complete

---

# AI Predictive Engine — Complete Architecture Blueprint

## Patterns and Conventions Found

**Edge Function Pattern** (`supabase/functions/ai-adaptive-program/index.ts:1-173`)
- Deno + `https://deno.land/std@0.168.0/http/server.ts`
- Model constant: `AI_MODEL = "claude-sonnet-4-20250514"` — use this exact string
- `callClaude(systemPrompt, userMessage)` helper, always at top of file
- JSON-only Claude responses with a `try/catch` fallback object on parse failure
- Two auth modes: user-scoped (`SUPABASE_ANON_KEY` + `Authorization` header) and service-role cron (`SUPABASE_SERVICE_ROLE_KEY`)
- `readiness-score/index.ts:102-111` establishes the dual-mode pattern: accepts optional `user_id` body, falls back to all users for cron
- CORS headers object defined once, spread into every response

**Zustand Store Pattern** (`stores/workoutStore.ts:64-259`)
- `create<Store>()((set, get) => ({...}))` — always with the generic wrapper
- Separate `State` and `Actions` interfaces merged into a `Store` type
- All async actions: `set({ isLoading: true, error: null })` → try/catch → `set({ isLoading: false })` on success or `set({ error: message, isLoading: false })` on failure
- Supabase calls use `supabase.auth.getUser()` inline (not from store state)
- `clearError()` and `reset()` always present

**Hook Pattern** (`hooks/useReadiness.ts`, `hooks/useStreaks.ts`)
- Thin wrappers over pure calculation functions using `useMemo`
- Input-driven, no side effects, no fetching — stores handle fetching
- Return spread of calculation result plus derived values

**Component Pattern** (`components/cards/ReadinessCard.tsx`)
- `useTheme()` for all colors/typography/spacing — never hardcoded
- `Animated` from `react-native-reanimated` for entrance animations
- Props interface defined above component, no inline types
- `StyleSheet.create({})` at bottom, only structural styles (no colors)
- Severity communicated via color from `colors.accent.success/warning/danger`

**Notification Pattern** (`services/notifications.ts`)
- `expo-notifications` for local scheduling
- Android channels: `default`, `workout`, `nutrition`, `partner` — add `ai_predictions`
- Push tokens stored on `profiles.expo_push_token`
- `notification_log` table (`supabase/migrations/00020`) for server-side records: `type`, `title`, `body`, `data JSONB`, `is_read`, `sent_at`

**Migration Pattern** (`supabase/migrations/`)
- Sequential numbered files: next is `00029_create_ai_predictions.sql`
- RLS enabled in a separate `00023_create_rls_policies.sql` — add prediction RLS there or inline in `00029`
- Indexes in `00022_create_indexes.sql` — add prediction indexes or inline in `00029`

---

## Architecture Decision

**Chosen Approach: Deterministic Rule Engine + Claude Narrative Layer**

The deterministic layer runs in the edge function itself (pure TypeScript, no AI call needed for scoring). Claude is called only to generate the human-readable narrative/title for each triggered prediction. This means:

- Rules fire reliably regardless of Claude API availability
- AI token cost is bounded: one Claude call per analysis run, not per prediction
- Scores are reproducible and auditable
- Predictions are stored server-side and synced to client — the client never re-runs analysis

Trade-off accepted: Richer pattern detection (e.g., day-of-week correlation) runs in the edge function with a dedicated data fetch. More sophisticated ML stays out of scope and can be layered on later via the `evidence` JSONB column.

---

## 1. Database Schema

**File:** `/C:/dev/transformr/supabase/migrations/00029_create_ai_predictions.sql`

```sql
-- =============================================================================
-- AI PREDICTIONS TABLE
-- Stores all generated predictions with their scoring, status, and outcomes
-- =============================================================================

CREATE TYPE prediction_type AS ENUM (
  'streak_risk',
  'calorie_deficit',
  'sleep_decline',
  'missed_logging',
  'strength_plateau',
  'motivation_dip',
  'injury_risk_volume_spike',
  'injury_risk_repetitive_strain',
  'injury_risk_sleep_mismatch',
  'injury_risk_pain_correlation',
  'deload_recommended'
);

CREATE TYPE prediction_severity AS ENUM ('info', 'warning', 'critical');

CREATE TYPE prediction_status AS ENUM (
  'active',       -- Shown to user, not yet acted on
  'dismissed',    -- User explicitly dismissed
  'acted_on',     -- User tapped the CTA
  'expired',      -- TTL passed without action
  'resolved'      -- Condition that triggered it no longer exists
);

CREATE TABLE ai_predictions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Classification
  prediction_type     prediction_type NOT NULL,
  severity            prediction_severity NOT NULL DEFAULT 'info',
  status              prediction_status NOT NULL DEFAULT 'active',

  -- Content (AI-generated narrative)
  title               TEXT NOT NULL,
  body                TEXT NOT NULL,
  cta_label           TEXT,                    -- e.g. "Log today's workout"
  cta_action          TEXT,                    -- deep-link route, e.g. "/(tabs)/workout"

  -- Scoring (deterministic engine output)
  confidence_score    NUMERIC(4,2) NOT NULL    -- 0.00–1.00
    CHECK (confidence_score BETWEEN 0 AND 1),
  rule_scores         JSONB NOT NULL DEFAULT '{}',  -- per-rule breakdown
  evidence            JSONB NOT NULL DEFAULT '{}',  -- raw data that triggered it

  -- Lifecycle
  generated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at          TIMESTAMPTZ NOT NULL,         -- auto-expire TTL
  dismissed_at        TIMESTAMPTZ,
  acted_on_at         TIMESTAMPTZ,
  resolved_at         TIMESTAMPTZ,

  -- Outcome tracking (accuracy loop)
  outcome_tracked     BOOLEAN DEFAULT false,
  outcome_was_correct BOOLEAN,                 -- Did prediction come true?
  outcome_notes       TEXT,
  outcome_checked_at  TIMESTAMPTZ,

  -- Notification linkage
  notification_sent   BOOLEAN DEFAULT false,
  notification_sent_at TIMESTAMPTZ,

  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

-- Prevent duplicate active predictions of same type per user
CREATE UNIQUE INDEX uq_ai_predictions_active_type
  ON ai_predictions (user_id, prediction_type)
  WHERE status = 'active';

-- Primary query pattern: fetch active predictions for a user
CREATE INDEX idx_ai_predictions_user_status
  ON ai_predictions (user_id, status, generated_at DESC);

-- Cron outcome resolution query
CREATE INDEX idx_ai_predictions_expires
  ON ai_predictions (expires_at)
  WHERE status = 'active';

-- Historical accuracy queries
CREATE INDEX idx_ai_predictions_outcome
  ON ai_predictions (user_id, prediction_type, outcome_was_correct)
  WHERE outcome_tracked = true;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_ai_predictions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ai_predictions_updated_at
  BEFORE UPDATE ON ai_predictions
  FOR EACH ROW EXECUTE FUNCTION update_ai_predictions_updated_at();

-- =============================================================================
-- RLS
-- =============================================================================

ALTER TABLE ai_predictions ENABLE ROW LEVEL SECURITY;

-- Users read only their own predictions
CREATE POLICY "ai_predictions_select_own"
  ON ai_predictions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update status/dismissal on their own predictions
CREATE POLICY "ai_predictions_update_own"
  ON ai_predictions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Only service role inserts (edge function uses service role key)
-- No INSERT policy needed for anon/authenticated — service role bypasses RLS
```

---

## 2. TypeScript Type Definitions

**File:** `/C:/dev/transformr/apps/mobile/types/aiPredictions.ts`

```typescript
// =============================================================================
// TRANSFORMR — AI Predictions Types
// =============================================================================

export type PredictionType =
  | 'streak_risk'
  | 'calorie_deficit'
  | 'sleep_decline'
  | 'missed_logging'
  | 'strength_plateau'
  | 'motivation_dip'
  | 'injury_risk_volume_spike'
  | 'injury_risk_repetitive_strain'
  | 'injury_risk_sleep_mismatch'
  | 'injury_risk_pain_correlation'
  | 'deload_recommended';

export type PredictionSeverity = 'info' | 'warning' | 'critical';

export type PredictionStatus =
  | 'active'
  | 'dismissed'
  | 'acted_on'
  | 'expired'
  | 'resolved';

// Stored in evidence JSONB — type-specific raw data
export interface StreakRiskEvidence {
  streak_type: string;
  current_streak: number;
  consecutive_misses: number;
  historical_break_threshold: number;
  last_activity_date: string;
}

export interface CalorieDeficitEvidence {
  days_below_target: number;
  target_calories: number;
  avg_calories_consumed: number;
  deficit_per_day: number;
  goal_direction: string;
}

export interface SleepDeclineEvidence {
  nights_declining: number;
  sleep_hours_trend: number[];      // last N nights
  avg_decline_per_night_hours: number;
  baseline_hours: number;
}

export interface StrengthPlateauEvidence {
  exercise_name: string;
  exercise_id: string;
  weeks_without_progress: number;
  last_pr_date: string;
  last_weight: number;
  last_rpe: number | null;
  rpe_trend: number[];
}

export interface InjuryRiskEvidence {
  risk_type: 'volume_spike' | 'repetitive_strain' | 'sleep_mismatch' | 'pain_correlation';
  current_weekly_volume?: number;
  previous_weekly_volume?: number;
  volume_increase_pct?: number;
  affected_muscle_groups?: string[];
  consecutive_days_trained?: number;
  readiness_score?: number;
  sleep_hours?: number;
  pain_log_count?: number;
  pain_locations?: string[];
}

export interface DeloadEvidence {
  plateaued_exercises: string[];
  plateau_weeks: number;
  avg_rpe_increase: number;
  mood_trend_score: number;          // 1-10, lower = worse
  weeks_since_last_deload: number;
}

export interface MissedLoggingEvidence {
  log_type: 'food' | 'workout' | 'sleep' | 'mood';
  hours_since_last_log: number;
  expected_log_time: string;
  current_time: string;
}

export interface MotivationDipEvidence {
  day_of_week: number;               // 0=Sun
  avg_motivation_on_day: number;
  overall_avg_motivation: number;
  mood_logs_analyzed: number;
  pattern_confidence: number;
}

export type PredictionEvidence =
  | StreakRiskEvidence
  | CalorieDeficitEvidence
  | SleepDeclineEvidence
  | StrengthPlateauEvidence
  | InjuryRiskEvidence
  | DeloadEvidence
  | MissedLoggingEvidence
  | MotivationDipEvidence;

// Rule score breakdown stored in rule_scores JSONB
export interface RuleScores {
  [ruleName: string]: {
    fired: boolean;
    score: number;       // contribution 0-1
    threshold: number;
    actual: number;
    weight: number;
  };
}

export interface AIPrediction {
  id: string;
  user_id: string;
  prediction_type: PredictionType;
  severity: PredictionSeverity;
  status: PredictionStatus;
  title: string;
  body: string;
  cta_label: string | null;
  cta_action: string | null;
  confidence_score: number;
  rule_scores: RuleScores;
  evidence: PredictionEvidence;
  generated_at: string;
  expires_at: string;
  dismissed_at: string | null;
  acted_on_at: string | null;
  resolved_at: string | null;
  outcome_tracked: boolean;
  outcome_was_correct: boolean | null;
  notification_sent: boolean;
  created_at: string;
  updated_at: string;
}

// What the edge function returns per user
export interface PredictionAnalysisResult {
  user_id: string;
  predictions_generated: number;
  predictions_resolved: number;
  prediction_ids: string[];
  error?: string;
}

// Edge function request body (for on-demand single-user call)
export interface PredictionRequest {
  user_id?: string;         // omit for cron (all users)
  force_refresh?: boolean;  // skip dedup check
}

// Edge function response
export interface PredictionResponse {
  success: boolean;
  processed: number;
  results: PredictionAnalysisResult[];
  timestamp: string;
}

// Store-level summary
export interface PredictionSummary {
  total: number;
  critical: number;
  warning: number;
  info: number;
  by_type: Partial<Record<PredictionType, number>>;
}

// For the outcome tracking feedback loop
export interface OutcomeFeedback {
  prediction_id: string;
  was_correct: boolean;
  notes?: string;
}
```

---

## 3. Edge Function: `ai-predictive-alerts`

**File:** `/C:/dev/transformr/supabase/functions/ai-predictive-alerts/index.ts`

### Architecture of this function

The function is structured in three layers: a data-gathering layer, a deterministic scoring layer, and a Claude narrative layer. The serve handler orchestrates them.

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const AI_MODEL = "claude-sonnet-4-20250514";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ─── Claude helper (identical to all other functions) ────────────────────────
async function callClaude(systemPrompt: string, userMessage: string): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: AI_MODEL,
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });
  const data = await response.json();
  return data.content[0].text;
}

// ─── Data Fetching ────────────────────────────────────────────────────────────
// (see full implementation spec below)

// ─── Deterministic Scoring Engine ────────────────────────────────────────────
// (see full implementation spec below)

// ─── Serve handler ───────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Dual mode: single user (on-demand) or all users (cron)
    let userIds: string[] = [];
    try {
      const body = await req.json();
      if (body.user_id) userIds = [body.user_id];
    } catch { /* cron: no body */ }

    if (userIds.length === 0) {
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("id");
      userIds = (profiles ?? []).map((p: any) => p.id);
    }

    const results: any[] = [];

    for (const userId of userIds) {
      try {
        const result = await analyzeUserPredictions(supabaseAdmin, userId);
        results.push(result);
      } catch (err: any) {
        results.push({ user_id: userId, error: err.message });
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: results.length, results, timestamp: new Date().toISOString() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

### `analyzeUserPredictions` — Main Orchestrator

```typescript
async function analyzeUserPredictions(supabase: any, userId: string) {
  // 1. Fetch all data needed for analysis
  const data = await gatherUserData(supabase, userId);

  // 2. Run deterministic scoring for all prediction types
  const firedPredictions = runScoringEngine(data);

  // 3. Resolve predictions whose condition no longer exists
  await resolveStalePredictions(supabase, userId, firedPredictions);

  // 4. Deduplicate: skip types that already have an active prediction
  const { data: existingActive } = await supabase
    .from("ai_predictions")
    .select("prediction_type")
    .eq("user_id", userId)
    .eq("status", "active");

  const existingTypes = new Set((existingActive ?? []).map((r: any) => r.prediction_type));
  const newPredictions = firedPredictions.filter(p => !existingTypes.has(p.type));

  if (newPredictions.length === 0) {
    return { user_id: userId, predictions_generated: 0, predictions_resolved: 0, prediction_ids: [] };
  }

  // 5. Batch Claude call for narratives on all new predictions
  const narratives = await generateNarratives(newPredictions, data.profile);

  // 6. Insert new predictions
  const inserts = newPredictions.map((p, i) => ({
    user_id: userId,
    prediction_type: p.type,
    severity: p.severity,
    status: "active",
    title: narratives[i]?.title ?? p.fallbackTitle,
    body: narratives[i]?.body ?? p.fallbackBody,
    cta_label: p.ctaLabel,
    cta_action: p.ctaAction,
    confidence_score: p.confidence,
    rule_scores: p.ruleScores,
    evidence: p.evidence,
    generated_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + p.ttlHours * 60 * 60 * 1000).toISOString(),
  }));

  const { data: inserted } = await supabase
    .from("ai_predictions")
    .insert(inserts)
    .select("id");

  // 7. Queue notifications for critical/warning predictions
  const notificationInserts = inserts
    .filter((_, i) => ["warning", "critical"].includes(inserts[i].severity))
    .map((pred) => ({
      user_id: userId,
      type: `ai_prediction_${pred.prediction_type}`,
      title: pred.title,
      body: pred.body,
      data: { prediction_type: pred.prediction_type, cta_action: pred.cta_action },
      priority: pred.severity === "critical" ? "high" : "normal",
      scheduled_for: new Date().toISOString(),
    }));

  if (notificationInserts.length > 0) {
    await supabase.from("notification_log").insert(notificationInserts);
  }

  return {
    user_id: userId,
    predictions_generated: inserts.length,
    prediction_ids: (inserted ?? []).map((r: any) => r.id),
  };
}
```

### `gatherUserData` — Data Layer

```typescript
async function gatherUserData(supabase: any, userId: string) {
  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
  const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000).toISOString();
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  const [
    profileResult,
    streakResult,
    nutritionResult,
    sleepResult,
    workoutResult,
    moodResult,
    painResult,
    personalRecordsResult,
    workoutSetsResult,
  ] = await Promise.all([
    supabase.from("profiles").select("daily_calorie_target, goal_direction, timezone").eq("id", userId).single(),
    supabase.from("streaks").select("*").eq("user_id", userId),
    supabase.from("nutrition_logs").select("date, calories, protein, carbs, fat").eq("user_id", userId).gte("date", thirtyDaysAgo).order("date", { ascending: false }),
    supabase.from("sleep_logs").select("date, hours, quality_score").eq("user_id", userId).order("date", { ascending: false }).limit(14),
    supabase.from("workout_sessions").select("started_at, completed_at, duration_minutes").eq("user_id", userId).gte("started_at", thirtyDaysAgo).order("started_at", { ascending: false }),
    supabase.from("mood_logs").select("logged_at, mood, motivation, energy, stress").eq("user_id", userId).gte("logged_at", thirtyDaysAgo).order("logged_at", { ascending: false }),
    supabase.from("pain_logs").select("logged_at, location, intensity, exercise_id").eq("user_id", userId).gte("logged_at", fourteenDaysAgo),
    supabase.from("personal_records").select("exercise_id, record_type, value, achieved_at").eq("user_id", userId).order("achieved_at", { ascending: false }),
    // Volume data: sets with weight/reps for past 4 weeks
    supabase.from("workout_sets").select(`
      exercise_id, weight, reps, rpe, logged_at,
      workout_sessions!inner(user_id, started_at)
    `).eq("workout_sessions.user_id", userId).gte("workout_sessions.started_at", thirtyDaysAgo),
  ]);

  return {
    profile: profileResult.data,
    streaks: streakResult.data ?? [],
    nutritionLogs: nutritionResult.data ?? [],
    sleepLogs: sleepResult.data ?? [],
    workoutSessions: workoutResult.data ?? [],
    moodLogs: moodResult.data ?? [],
    painLogs: painResult.data ?? [],
    personalRecords: personalRecordsResult.data ?? [],
    workoutSets: workoutSetsResult.data ?? [],
    today,
  };
}
```

---

## 4. Scoring Algorithms

### Scoring Engine Contract

Each scorer returns `null` (condition not met) or a `FiredPrediction` object:

```typescript
interface FiredPrediction {
  type: PredictionType;
  severity: PredictionSeverity;
  confidence: number;           // 0.00–1.00
  ruleScores: RuleScores;
  evidence: PredictionEvidence;
  ttlHours: number;             // how long prediction stays active
  ctaLabel: string | null;
  ctaAction: string | null;
  fallbackTitle: string;        // used if Claude fails
  fallbackBody: string;
}
```

### Rule Implementations

**Streak Risk Scorer**
```
Inputs: streaks[], today
Rules:
  R1 (weight 0.6): consecutive_misses >= 2 AND current_streak > 3
                   → score = min(1, consecutive_misses / 3)
  R2 (weight 0.4): last_activity_date is yesterday (streak intact but at risk today)
                   → score = 0.5
Confidence = weighted_sum(R1.score * 0.6, R2.score * 0.4)
Fire when: confidence >= 0.4
Severity: warning if consecutive_misses == 2, critical if >= 3
TTL: 20 hours (expires end of day)
CTA: "Log today's checkin" → "/(tabs)/checkin"
```

**Calorie Deficit Scorer**
```
Inputs: nutritionLogs (last 7 days), profile.daily_calorie_target, profile.goal_direction
Only fires when goal_direction == 'gain' (deficit hurts gainers) or 'maintain'
Rules:
  R1 (weight 0.5): days_below_threshold >= 3 (threshold = target * 0.85)
                   → score = min(1, days_below / 5)
  R2 (weight 0.3): avg_deficit_pct > 15% below target
                   → score = min(1, deficit_pct / 30)
  R3 (weight 0.2): trend is declining (each day lower than previous)
                   → score = 1 if trending down, 0 otherwise
Confidence = sum of weighted rule scores
Fire when: confidence >= 0.5
Severity: warning if 3-4 days, critical if 5+ days
TTL: 24 hours
CTA: "Log your meals" → "/(tabs)/nutrition"
```

**Sleep Decline Scorer**
```
Inputs: sleepLogs (last 7 nights)
Rules:
  R1 (weight 0.5): 3+ consecutive nights where each night < previous night
                   → score = min(1, consecutive_declining / 5)
  R2 (weight 0.3): latest sleep hours < 6.0
                   → score = min(1, (6 - latest_hours) / 2)
  R3 (weight 0.2): average last 3 nights is >1 hour below 14-day average
                   → score = min(1, hour_drop / 2)
Fire when: confidence >= 0.45
Severity: info if 3 nights, warning if 4+ nights or <5.5 hours
TTL: 24 hours
CTA: "Optimize sleep" → "/(tabs)/sleep"
```

**Missed Logging Scorer**
```
Inputs: nutritionLogs, moodLogs, today, current hour
Rules (each independent, only one fires per type):
  Food: current time >= 14:00 AND no nutrition log for today
        → confidence = 0.9, severity = info
  Mood: current time >= 20:00 AND no mood log for today
        → confidence = 0.85, severity = info
TTL: until midnight (calculate dynamically)
CTA food: "Log food now" → "/(tabs)/nutrition"
CTA mood: "Log mood" → "/(tabs)/checkin"
```

**Strength Plateau Scorer**
```
Inputs: workoutSets, personalRecords (last 30 days)
Algorithm:
  1. Group sets by exercise_id
  2. For each exercise with >=4 sessions in 30 days:
     a. Extract max_1rm per session (Epley: weight * (1 + reps/30))
     b. Check if max_1rm has not increased over last 3 weeks
     c. Check if RPE is available and trending up at same weights
  3. Collect all plateaued exercises
Rules:
  R1 (weight 0.6): 1+ exercises with no 1RM increase for 21+ days
                   → score = min(1, plateau_days / 28)
  R2 (weight 0.4): RPE trending up >= 0.5 points/session across last 3 sessions
                   → score = min(1, rpe_increase / 2)
Fire when: confidence >= 0.5 AND at least 1 exercise plateaued
Severity: info if 3 weeks, warning if 4+ weeks
TTL: 48 hours
CTA: "View program" → "/(tabs)/workout"
```

**Motivation Dip Scorer**
```
Inputs: moodLogs (last 28 days), today.dayOfWeek
Algorithm:
  1. Group mood logs by day_of_week (0-6)
  2. Calculate avg_motivation per day_of_week (use motivation field, fallback to mood)
  3. Calculate overall_avg across all days
  4. today_avg = avg for current day_of_week
  5. Log count per day must be >= 3 for pattern confidence
Rules:
  R1 (weight 0.7): today_avg < overall_avg * 0.75 AND log_count >= 3
                   → score = min(1, (overall_avg - today_avg) / overall_avg)
  R2 (weight 0.3): log_count >= 4 on this day (pattern more reliable)
                   → score = min(1, log_count / 8)
Fire when: confidence >= 0.55 AND today IS the dip day
Severity: info
TTL: 20 hours (day-specific)
CTA: "Log mood" → "/(tabs)/checkin"
```

**Injury Risk — Volume Spike Scorer**
```
Inputs: workoutSets grouped by week
Algorithm:
  1. Calculate total_volume_this_week = sum(weight * reps) for last 7 days
  2. Calculate total_volume_prev_week = sum(weight * reps) for days 8-14
  3. volume_increase_pct = (this - prev) / prev * 100
Rules:
  R1 (weight 1.0): volume_increase_pct > 30%
                   → score = min(1, (increase_pct - 30) / 50)
Fire when: confidence >= 0.3 (low threshold — safety-first)
Severity: warning if 30-50% increase, critical if >50%
TTL: 48 hours
CTA: "Review your plan" → "/(tabs)/workout"
```

**Injury Risk — Repetitive Strain Scorer**
```
Inputs: workoutSessions (last 14 days), workoutSets
Algorithm:
  1. Find muscle groups trained on consecutive days (no rest)
  2. consecutive_days_same_group = max streak of same muscle group
  3. Check if any muscle group appears in 4+ of last 5 sessions
Rules:
  R1 (weight 0.6): same_group_consecutive >= 3
  R2 (weight 0.4): same_group_sessions_ratio >= 0.8 (4 of 5)
Fire when: confidence >= 0.4
Severity: warning
TTL: 48 hours
CTA: "Check recovery" → "/(tabs)/readiness"
```

**Injury Risk — Sleep-Training Mismatch Scorer**
```
Inputs: sleepLogs (last 3 nights), workoutSessions (last 3 days)
Rules:
  R1 (weight 0.5): avg_sleep_last_3_nights < 6 AND trained_last_2_days
  R2 (weight 0.5): any_single_night < 5 AND trained_next_day
Fire when: confidence >= 0.4
Severity: warning
TTL: 24 hours
CTA: "Check readiness" → "/(tabs)/readiness"
```

**Injury Risk — Pain Correlation Scorer**
```
Inputs: painLogs (last 14 days), workoutSets
Rules:
  R1 (weight 0.5): pain_log_count >= 2 AND same_location_count >= 2
  R2 (weight 0.5): pain_after_same_exercise_count >= 2
Fire when: confidence >= 0.5
Severity: warning if repeated, critical if 3+ same location
TTL: 72 hours
CTA: "Log pain / see form check" → "/(tabs)/workout/form-check"
```

**Deload Detector**
```
Inputs: workoutSets (last 28 days), moodLogs, personalRecords
Algorithm:
  1. Find exercises with >= 3 sessions in 28 days
  2. plateau_exercises = exercises where max_1rm unchanged for 14+ days
  3. rpe_increase = avg RPE trend across last 3 sessions per exercise
  4. mood_trend = avg(mood_last_7_days) vs avg(mood_days_8-14)
  5. weeks_since_deload: check last session with duration < 30 min or
     volume < 50% of typical (proxy for deload — can be improved with a
     dedicated deload_weeks table later)
Rules:
  R1 (weight 0.35): plateau_exercises.length >= 2
  R2 (weight 0.25): avg rpe_increase >= 0.5 points/session across plateaued lifts
  R3 (weight 0.25): mood_trend shows decline >= 10% week-over-week
  R4 (weight 0.15): weeks_since_last_deload >= 6 (estimated)
Fire when: confidence >= 0.55
Severity: warning if >= 0.55, critical if >= 0.80
TTL: 72 hours
CTA: "See deload plan" → "/(tabs)/workout/deload"
```

---

## 5. Claude Narrative Generation

All new predictions are batched into a single Claude call per user per cron run.

**System prompt:**
```
You are TRANSFORMR's AI coach. Generate concise, motivating alert titles and bodies
for fitness predictions. Be specific, reference actual numbers, and sound like a
knowledgeable friend not a robot. Each alert must be actionable and avoid alarmism.

ALWAYS respond with valid JSON array matching the exact count of predictions input:
[
  {
    "title": "Max 8 words, punchy, specific",
    "body": "Max 2 sentences. Reference actual numbers from evidence. End with why it matters."
  }
]
```

**User message format:**
```
Generate alert copy for these ${count} predictions for user with these goals: ${goals_summary}.

${predictions.map((p, i) => `
[${i}] type: ${p.type}
evidence: ${JSON.stringify(p.evidence)}
severity: ${p.severity}
`).join('\n')}
```

**Fallback titles/bodies** are defined in the scorer functions so the system degrades gracefully if Claude is unavailable.

Example fallback pairs:
- `streak_risk`: title = "Streak at Risk", body = "You've missed ${consecutive_misses} days in a row. Historically, 3 misses breaks your streak."
- `deload_recommended`: title = "Time to Deload", body = "${plateaued_exercises.length} lifts haven't progressed in ${plateau_weeks} weeks. A deload week resets your CNS and unlocks new gains."

---

## 6. Cron Scheduling Strategy

**Configuration location:** Add to `/C:/dev/transformr/supabase/config.toml`

```toml
[functions.ai-predictive-alerts]
verify_jwt = false

[[cron]]
name = "ai-predictive-alerts-daily"
schedule = "0 6 * * *"
function = "ai-predictive-alerts"

[[cron]]
name = "ai-predictive-alerts-midday"
schedule = "0 14 * * *"
function = "ai-predictive-alerts"

[[cron]]
name = "ai-predictive-alerts-expire"
schedule = "0 0 * * *"
function = "ai-predictive-alerts-expire"
```

**Rationale for two daily runs:**
- 6:00 AM: catches streak risk, sleep decline, missed-logging (food). Users see it when they open the app in the morning.
- 14:00 PM: catches missed food logging by 2 PM specifically, and motivation dip on current day.

**Expire function** is a separate lightweight edge function (`ai-predictive-alerts-expire/index.ts`) that runs at midnight:
```typescript
// Marks active predictions past expires_at as 'expired'
// Checks outcome_tracked = false predictions older than 7 days → auto-set outcome
await supabase.from("ai_predictions")
  .update({ status: "expired" })
  .eq("status", "active")
  .lt("expires_at", new Date().toISOString());
```

**On-demand trigger:** The mobile client calls the edge function directly with `user_id` after completing a workout or logging food, to refresh predictions immediately.

---

## 7. Notification Integration

**New Android channel.** Add to `/C:/dev/transformr/apps/mobile/services/notifications.ts` inside `registerForPushNotifications`:

```typescript
Notifications.setNotificationChannelAsync('ai_predictions', {
  name: 'AI Predictions',
  importance: Notifications.AndroidImportance.HIGH,
  vibrationPattern: [0, 250, 250, 250],
  lightColor: '#6366F1',
});
```

**New exported function** in `notifications.ts`:

```typescript
export async function scheduleAIPredictionNotification(
  prediction: AIPrediction,
): Promise<string> {
  const channelId = prediction.severity === 'critical' ? 'default' : 'ai_predictions';
  return Notifications.scheduleNotificationAsync({
    content: {
      title: prediction.title,
      body: prediction.body,
      data: {
        type: 'ai_prediction',
        prediction_type: prediction.prediction_type,
        prediction_id: prediction.id,
        cta_action: prediction.cta_action,
      },
      ...(Platform.OS === 'android' && { channelId }),
    },
    trigger: null, // immediate
  });
}
```

**Notification tap routing.** In the app's root notification response listener (wherever `addNotificationResponseListener` is currently wired up), handle the `ai_prediction` type:

```typescript
if (response.notification.request.content.data?.type === 'ai_prediction') {
  const ctaAction = response.notification.request.content.data?.cta_action;
  if (ctaAction) router.push(ctaAction);
}
```

---

## 8. `predictionStore` Zustand Store

**File:** `/C:/dev/transformr/apps/mobile/stores/predictionStore.ts`

```typescript
// =============================================================================
// TRANSFORMR — Prediction Store
// =============================================================================

import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { scheduleAIPredictionNotification } from '../services/notifications';
import type { AIPrediction, PredictionSummary, OutcomeFeedback } from '../types/aiPredictions';

interface PredictionState {
  predictions: AIPrediction[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  lastFetchedAt: string | null;
}

interface PredictionActions {
  fetchPredictions: () => Promise<void>;
  refreshPredictions: () => Promise<void>;
  dismissPrediction: (id: string) => Promise<void>;
  markActedOn: (id: string) => Promise<void>;
  submitOutcomeFeedback: (feedback: OutcomeFeedback) => Promise<void>;
  triggerAnalysis: () => Promise<void>;
  getSummary: () => PredictionSummary;
  getActivePredictions: () => AIPrediction[];
  clearError: () => void;
  reset: () => void;
}

type PredictionStore = PredictionState & PredictionActions;

export const usePredictionStore = create<PredictionStore>()((set, get) => ({
  // --- State ---
  predictions: [],
  isLoading: false,
  isRefreshing: false,
  error: null,
  lastFetchedAt: null,

  // --- Actions ---
  fetchPredictions: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('ai_predictions')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['active'])
        .order('generated_at', { ascending: false });
      if (error) throw error;

      set({
        predictions: (data ?? []) as AIPrediction[],
        isLoading: false,
        lastFetchedAt: new Date().toISOString(),
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch predictions';
      set({ error: message, isLoading: false });
    }
  },

  refreshPredictions: async () => {
    // Soft refresh — doesn't show full loading state
    set({ isRefreshing: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('ai_predictions')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['active'])
        .order('generated_at', { ascending: false });

      set({ predictions: (data ?? []) as AIPrediction[], isRefreshing: false });
    } catch {
      set({ isRefreshing: false });
    }
  },

  dismissPrediction: async (id: string) => {
    // Optimistic update
    set((state) => ({
      predictions: state.predictions.filter((p) => p.id !== id),
    }));
    try {
      const { error } = await supabase
        .from('ai_predictions')
        .update({ status: 'dismissed', dismissed_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    } catch (err: unknown) {
      // Revert on failure — re-fetch
      await get().fetchPredictions();
    }
  },

  markActedOn: async (id: string) => {
    set((state) => ({
      predictions: state.predictions.filter((p) => p.id !== id),
    }));
    try {
      await supabase
        .from('ai_predictions')
        .update({ status: 'acted_on', acted_on_at: new Date().toISOString() })
        .eq('id', id);
    } catch {
      await get().fetchPredictions();
    }
  },

  submitOutcomeFeedback: async (feedback: OutcomeFeedback) => {
    const { error } = await supabase
      .from('ai_predictions')
      .update({
        outcome_tracked: true,
        outcome_was_correct: feedback.was_correct,
        outcome_notes: feedback.notes ?? null,
        outcome_checked_at: new Date().toISOString(),
      })
      .eq('id', feedback.prediction_id);
    if (error) throw error;
  },

  triggerAnalysis: async () => {
    // Called after workout completion, food log, etc. — on-demand refresh
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: session } = await supabase.auth.getSession();
    try {
      await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/ai-predictive-alerts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.session?.access_token}`,
          },
          body: JSON.stringify({ user_id: user.id }),
        }
      );
      // Refresh store after analysis
      setTimeout(() => get().refreshPredictions(), 2000);
    } catch {
      // Silent fail — cron will catch it
    }
  },

  getSummary: (): PredictionSummary => {
    const active = get().predictions.filter((p) => p.status === 'active');
    const summary: PredictionSummary = {
      total: active.length,
      critical: active.filter((p) => p.severity === 'critical').length,
      warning: active.filter((p) => p.severity === 'warning').length,
      info: active.filter((p) => p.severity === 'info').length,
      by_type: {},
    };
    for (const p of active) {
      summary.by_type[p.prediction_type] = (summary.by_type[p.prediction_type] ?? 0) + 1;
    }
    return summary;
  },

  getActivePredictions: () => get().predictions.filter((p) => p.status === 'active'),

  clearError: () => set({ error: null }),

  reset: () => set({
    predictions: [],
    isLoading: false,
    isRefreshing: false,
    error: null,
    lastFetchedAt: null,
  }),
}));
```

---

## 9. `useAIPredictions` Hook

**File:** `/C:/dev/transformr/apps/mobile/hooks/useAIPredictions.ts`

```typescript
import { useEffect, useMemo } from 'react';
import { usePredictionStore } from '@stores/predictionStore';
import type { PredictionType, PredictionSeverity } from '@/types/aiPredictions';

interface UseAIPredictionsOptions {
  autoFetch?: boolean;          // default true
  filterSeverity?: PredictionSeverity[];
  filterTypes?: PredictionType[];
}

export function useAIPredictions(options: UseAIPredictionsOptions = {}) {
  const {
    autoFetch = true,
    filterSeverity,
    filterTypes,
  } = options;

  const {
    predictions,
    isLoading,
    isRefreshing,
    error,
    lastFetchedAt,
    fetchPredictions,
    dismissPrediction,
    markActedOn,
    submitOutcomeFeedback,
    triggerAnalysis,
    getSummary,
  } = usePredictionStore();

  useEffect(() => {
    if (autoFetch && predictions.length === 0 && !isLoading) {
      fetchPredictions();
    }
  }, [autoFetch]);

  const filteredPredictions = useMemo(() => {
    let result = predictions.filter((p) => p.status === 'active');
    if (filterSeverity?.length) {
      result = result.filter((p) => filterSeverity.includes(p.severity));
    }
    if (filterTypes?.length) {
      result = result.filter((p) => filterTypes.includes(p.prediction_type));
    }
    // Sort: critical first, then warning, then info; then by generated_at desc
    return result.sort((a, b) => {
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      const diff = severityOrder[a.severity] - severityOrder[b.severity];
      if (diff !== 0) return diff;
      return new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime();
    });
  }, [predictions, filterSeverity, filterTypes]);

  const summary = useMemo(() => getSummary(), [predictions]);

  const hasCritical = summary.critical > 0;
  const hasWarnings = summary.warning > 0;

  return {
    predictions: filteredPredictions,
    isLoading,
    isRefreshing,
    error,
    lastFetchedAt,
    summary,
    hasCritical,
    hasWarnings,
    fetchPredictions,
    dismissPrediction,
    markActedOn,
    submitOutcomeFeedback,
    triggerAnalysis,
    refetch: fetchPredictions,
  };
}
```

---

## 10. In-App Alert UI Components

### `PredictionCard` Component

**File:** `/C:/dev/transformr/apps/mobile/components/cards/PredictionCard.tsx`

```typescript
import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  FadeIn,
  SlideOutRight,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useTheme } from '@theme/index';
import type { AIPrediction, PredictionSeverity } from '@/types/aiPredictions';

interface PredictionCardProps {
  prediction: AIPrediction;
  onDismiss: (id: string) => void;
  onActOn: (id: string, ctaAction: string | null) => void;
  style?: ViewStyle;
}

const SEVERITY_CONFIG: Record<PredictionSeverity, {
  borderColor: (colors: any) => string;
  badgeColor: (colors: any) => string;
  badgeText: string;
  iconText: string;
}> = {
  critical: {
    borderColor: (c) => c.accent.danger,
    badgeColor: (c) => c.accent.danger,
    badgeText: 'CRITICAL',
    iconText: 'X',
  },
  warning: {
    borderColor: (c) => c.accent.warning,
    badgeColor: (c) => c.accent.warning,
    badgeText: 'WARNING',
    iconText: '!',
  },
  info: {
    borderColor: (c) => c.accent.primary,
    badgeColor: (c) => c.accent.primary,
    badgeText: 'INFO',
    iconText: 'i',
  },
};

export function PredictionCard({ prediction, onDismiss, onActOn, style }: PredictionCardProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const router = useRouter();
  const config = SEVERITY_CONFIG[prediction.severity];
  const borderColor = config.borderColor(colors);
  const badgeColor = config.badgeColor(colors);

  const handleCta = () => {
    onActOn(prediction.id, prediction.cta_action);
    if (prediction.cta_action) {
      router.push(prediction.cta_action as any);
    }
  };

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={SlideOutRight.duration(250)}
      style={[
        styles.card,
        {
          backgroundColor: colors.background.secondary,
          borderRadius: borderRadius.lg,
          borderLeftWidth: 4,
          borderLeftColor: borderColor,
          padding: spacing.lg,
          marginBottom: spacing.md,
        },
        style,
      ]}
    >
      {/* Header row */}
      <View style={styles.headerRow}>
        <View style={[styles.badge, { backgroundColor: `${badgeColor}20`, borderRadius: borderRadius.sm }]}>
          <Text style={[typography.tiny, { color: badgeColor, fontWeight: '700', paddingHorizontal: spacing.sm, paddingVertical: 2 }]}>
            {config.badgeText}
          </Text>
        </View>
        <TouchableOpacity onPress={() => onDismiss(prediction.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={[typography.body, { color: colors.text.muted }]}>x</Text>
        </TouchableOpacity>
      </View>

      {/* Title */}
      <Text style={[typography.h4, { color: colors.text.primary, marginTop: spacing.sm, marginBottom: spacing.xs }]}>
        {prediction.title}
      </Text>

      {/* Body */}
      <Text style={[typography.body, { color: colors.text.secondary, marginBottom: spacing.md }]}>
        {prediction.body}
      </Text>

      {/* CTA */}
      {prediction.cta_label && (
        <TouchableOpacity
          onPress={handleCta}
          style={[
            styles.ctaButton,
            {
              backgroundColor: `${badgeColor}15`,
              borderRadius: borderRadius.md,
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.md,
              borderWidth: 1,
              borderColor: `${badgeColor}40`,
            },
          ]}
        >
          <Text style={[typography.bodyMedium, { color: badgeColor }]}>
            {prediction.cta_label}
          </Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {},
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {},
  ctaButton: {
    alignSelf: 'flex-start',
    alignItems: 'center',
  },
});
```

### `PredictionAlertBanner` Component

**File:** `/C:/dev/transformr/apps/mobile/components/cards/PredictionAlertBanner.tsx`

This is a compact summary banner for the top of the dashboard when predictions exist.

```typescript
// Props: count, hasCritical, onPress
// Renders: "3 AI Alerts — 1 Critical" with colored left border
// Taps navigate to a dedicated predictions screen or expand inline
```

### `PredictionFeedCard` Component

**File:** `/C:/dev/transformr/apps/mobile/components/cards/PredictionFeedCard.tsx`

This wraps the list of `PredictionCard` instances with a header, used as a dashboard widget.

```typescript
// Props: predictions[], onDismiss, onActOn
// Renders: Section header "AI Predictions", count badge, scrollable list
// Empty state: "No alerts — you're on track!" with green checkmark
```

---

## 11. Dashboard Integration

**File to modify:** `/C:/dev/transformr/apps/mobile/stores/dashboardStore.ts`

The dashboard already has a draggable grid system (`DraggableGrid`). Add `ai_predictions` as a widget type.

In the dashboard store's widget type enum/list, add:
```typescript
'ai_predictions'
```

**File to modify:** wherever the dashboard maps widget type to component (look for the widget renderer). Add:
```typescript
case 'ai_predictions':
  return <PredictionFeedCard key={widget.id} />;
```

**Default layout position:** slot 2 (below readiness card, above quick stats). Critical predictions should interrupt this order — if `hasCritical` is true, the `PredictionAlertBanner` pins to the top of the dashboard scroll view regardless of widget order.

---

## 12. Historical Tracking / Accuracy Loop

The `outcome_tracked`, `outcome_was_correct`, and `outcome_checked_at` columns on `ai_predictions` form the accuracy feedback loop.

**Automated outcome resolution** (in the expire edge function):
- For `streak_risk` predictions that are now `dismissed` or `expired`: query the streaks table. If the streak was indeed broken within 3 days, set `outcome_was_correct = true`.
- For `strength_plateau`: if a new PR appears for that exercise after the prediction, set `outcome_was_correct = true`.
- For `deload_recommended`: if the next workout session's volume drops >30% vs prior average within 14 days, set `outcome_was_correct = true`.

**Manual feedback UI** (optional Phase 4):
After a prediction expires, show a small inline prompt: "Did this happen? Yes / No". Calls `submitOutcomeFeedback` in the store. This data can later be used to tune confidence thresholds per user.

**Accuracy query (admin/analytics):**
```sql
SELECT
  prediction_type,
  COUNT(*) AS total,
  SUM(CASE WHEN outcome_was_correct THEN 1 ELSE 0 END) AS correct,
  ROUND(AVG(CASE WHEN outcome_was_correct THEN 1.0 ELSE 0.0 END) * 100, 1) AS accuracy_pct
FROM ai_predictions
WHERE outcome_tracked = true
GROUP BY prediction_type
ORDER BY accuracy_pct DESC;
```

---

## 13. Complete Implementation Map

### Files to CREATE

| File | Purpose |
|------|---------|
| `/C:/dev/transformr/supabase/migrations/00029_create_ai_predictions.sql` | Database schema, indexes, RLS |
| `/C:/dev/transformr/supabase/functions/ai-predictive-alerts/index.ts` | Main edge function (analysis + generation) |
| `/C:/dev/transformr/supabase/functions/ai-predictive-alerts-expire/index.ts` | Nightly expiry + outcome resolution |
| `/C:/dev/transformr/apps/mobile/types/aiPredictions.ts` | All TypeScript types |
| `/C:/dev/transformr/apps/mobile/stores/predictionStore.ts` | Zustand store |
| `/C:/dev/transformr/apps/mobile/hooks/useAIPredictions.ts` | React hook |
| `/C:/dev/transformr/apps/mobile/components/cards/PredictionCard.tsx` | Individual alert card |
| `/C:/dev/transformr/apps/mobile/components/cards/PredictionAlertBanner.tsx` | Dashboard summary banner |
| `/C:/dev/transformr/apps/mobile/components/cards/PredictionFeedCard.tsx` | Dashboard widget wrapper |

### Files to MODIFY

| File | Change |
|------|--------|
| `/C:/dev/transformr/supabase/config.toml` | Add two cron schedules for `ai-predictive-alerts` and one for `ai-predictive-alerts-expire` |
| `/C:/dev/transformr/apps/mobile/services/notifications.ts` | Add `ai_predictions` Android channel in `registerForPushNotifications`; add `scheduleAIPredictionNotification` export |
| `/C:/dev/transformr/apps/mobile/stores/dashboardStore.ts` | Add `ai_predictions` to widget type list and default layout |
| `/C:/dev/transformr/apps/mobile/types/database.ts` | Add `AIPrediction` export that mirrors the DB table shape (or re-export from `aiPredictions.ts`) |
| Root notification response listener (wherever `addNotificationResponseListener` is used) | Handle `type === 'ai_prediction'` to route to `cta_action` |

---

## 14. Data Flow

```
CRON (6am + 2pm)
     |
     v
ai-predictive-alerts/index.ts (service role)
     |
     |-- gatherUserData() ──> parallel queries: streaks, nutrition_logs,
     |                         sleep_logs, workout_sets, mood_logs,
     |                         pain_logs, personal_records, profiles
     |
     |-- runScoringEngine() ──> 10 deterministic scorers
     |                          Each returns null | FiredPrediction
     |
     |-- resolveStalePredictions() ──> UPDATE ai_predictions SET status='resolved'
     |                                  WHERE type not in firedPredictions
     |
     |-- dedup against existing 'active' predictions
     |
     |-- callClaude() ──> batch narrative for all new predictions
     |
     |-- INSERT ai_predictions (new rows)
     |
     |-- INSERT notification_log (for warning/critical)
          |
          v
     Supabase Realtime subscription in predictionStore
     (or next app open triggers fetchPredictions())
          |
          v
     usePredictionStore.predictions updated
          |
          v
     useAIPredictions hook re-renders
          |
          v
     PredictionFeedCard on dashboard renders PredictionCard list
     PredictionAlertBanner shows if hasCritical
          |
          v
     User: dismiss → UPDATE status='dismissed'
     User: tap CTA → UPDATE status='acted_on' + router.push(cta_action)
          |
          v
     ai-predictive-alerts-expire (midnight cron)
     → Expire past-TTL predictions
     → Auto-resolve outcome tracking
```

---

## 15. Build Sequence Checklist

### Phase 1 — Database + Types (Day 1)
- [ ] Write and run `/supabase/migrations/00029_create_ai_predictions.sql`
- [ ] Create `/apps/mobile/types/aiPredictions.ts` with all types
- [ ] Verify migration applies cleanly with `supabase db reset`
- [ ] Confirm RLS: authenticated user can SELECT/UPDATE own rows, cannot INSERT

### Phase 2 — Edge Function Core (Days 2-3)
- [ ] Create `/supabase/functions/ai-predictive-alerts/index.ts`
- [ ] Implement `gatherUserData()` with all 9 parallel queries
- [ ] Implement all 10 scorer functions with their rule definitions
- [ ] Implement `runScoringEngine()` that calls all scorers and collects non-null results
- [ ] Implement `resolveStalePredictions()`
- [ ] Implement `generateNarratives()` with Claude batch call and fallbacks
- [ ] Implement `analyzeUserPredictions()` orchestrator
- [ ] Test locally: `supabase functions serve ai-predictive-alerts`
- [ ] Test with a real user's data, verify predictions insert correctly
- [ ] Create `/supabase/functions/ai-predictive-alerts-expire/index.ts`

### Phase 3 — Store + Hook (Day 4)
- [ ] Create `/apps/mobile/stores/predictionStore.ts`
- [ ] Create `/apps/mobile/hooks/useAIPredictions.ts`
- [ ] Test: call `triggerAnalysis()`, verify store populates
- [ ] Test: `dismissPrediction()` optimistic update and Supabase write
- [ ] Test: `markActedOn()` flow

### Phase 4 — Notification Integration (Day 5)
- [ ] Add `ai_predictions` Android channel to `notifications.ts`
- [ ] Add `scheduleAIPredictionNotification()` to `notifications.ts`
- [ ] Wire notification tap handler for `type === 'ai_prediction'`
- [ ] Test: trigger a critical prediction, confirm push notification fires

### Phase 5 — UI Components (Days 5-6)
- [ ] Build `PredictionCard.tsx` with severity-colored left border, dismiss button, CTA
- [ ] Build `PredictionAlertBanner.tsx` for dashboard top
- [ ] Build `PredictionFeedCard.tsx` widget wrapper
- [ ] Test empty state, single prediction, multiple predictions
- [ ] Test dismiss animation (`SlideOutRight`)
- [ ] Test CTA tap → `markActedOn` + `router.push`

### Phase 6 — Dashboard Integration (Day 7)
- [ ] Add `ai_predictions` widget type to `dashboardStore.ts`
- [ ] Wire `PredictionFeedCard` into dashboard widget renderer
- [ ] Wire `PredictionAlertBanner` to pin when `hasCritical = true`
- [ ] Confirm `triggerAnalysis()` is called after workout completion (`workoutStore.completeWorkout`) and after food logging (`nutritionStore` log action)

### Phase 7 — Cron + Config (Day 7)
- [ ] Add both cron entries to `supabase/config.toml`
- [ ] Deploy edge functions: `supabase functions deploy ai-predictive-alerts`
- [ ] Deploy expire function: `supabase functions deploy ai-predictive-alerts-expire`
- [ ] Set cron in Supabase dashboard (pg_cron SQL or via CLI)
- [ ] Confirm cron fires and inserts predictions for all users

### Phase 8 — Outcome Tracking (Day 8)
- [ ] Implement automated outcome resolution in the expire function for `streak_risk`, `strength_plateau`, `deload_recommended`
- [ ] Verify `outcome_tracked` and `outcome_was_correct` are being set
- [ ] Run accuracy query against test data

---

## Critical Details

**Deduplication is enforced at two levels.** The `uq_ai_predictions_active_type` partial unique index on `(user_id, prediction_type) WHERE status = 'active'` prevents duplicate DB inserts at the database layer. The scoring engine also checks existing active types before calling Claude, which avoids wasted API calls.

**Claude token budget.** One batch call per user per cron run. Max 2048 tokens. With 10 possible predictions, each narrative averages ~200 tokens. In practice, 2-4 predictions fire per user per day, keeping cost minimal.

**Scorer independence.** Each scorer function receives the same `data` object but is completely pure — no shared state, no mutation. This allows individual scorers to be unit-tested in isolation.

**RLS on INSERT is intentionally absent.** The edge function uses `SUPABASE_SERVICE_ROLE_KEY` which bypasses RLS entirely. The mobile client has no INSERT policy on `ai_predictions` — users cannot inject false predictions.

**TTL design.** Short TTLs (20-24 hours for day-specific alerts, 48-72 hours for training alerts) prevent stale predictions from cluttering the UI. The `expires_at` column allows the DB to own expiry without requiring the client to compute it.

**Optimistic dismiss.** The store removes the prediction from local state immediately on dismiss before the Supabase write confirms. If the write fails, `fetchPredictions()` reverts. This keeps the UI snappy on slow connections.

**`triggerAnalysis()` is fire-and-forget** from the client. It calls the edge function then polls with a 2-second delay. The edge function is idempotent due to the dedup index — calling it multiple times is safe.

**Thread safety on the unique index.** If two cron instances race (unlikely but possible), the partial unique index will cause one INSERT to fail with a unique violation. Wrap the INSERT in the edge function with a try/catch that treats unique violation errors as a no-op success.