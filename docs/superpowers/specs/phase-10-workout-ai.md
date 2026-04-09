# Phase 10 -- AI Workout Enhancements

## Overview

Five AI-powered features that augment the workout experience: Intensity Auto-Adjustment, Exercise Substitution, Body Composition Estimator, Social Caption Generator, and Music Matching. These features share a unified hook (`useWorkoutAI`) and integrate into the existing workout player with minimal surface-area changes.

---

## Feature 1: Intensity Auto-Adjustment

### Pre-Workout Zone Assessment

Before the workout begins, the system evaluates the user's readiness and assigns a zone:

| Zone | Color | Readiness Score | Behavior |
|------|-------|----------------|----------|
| Fully Ready | Green | >= 70 | No adjustments. Full programmed volume. |
| Moderate Fatigue | Yellow | 40 - 69 | Reduce volume. Suggest lighter alternatives. |
| High Fatigue / Recovery | Red | < 40 | Significant volume reduction. Swap compounds for machines. |

### Volume Reduction Table

| Zone | Working Sets | Weight | Rest Period |
|------|-------------|--------|-------------|
| Green | 100% | 100% | As programmed |
| Yellow | 85% (round down) | 90% | +30 seconds |
| Red | 70% (round down) | 75% | +60 seconds |

### Compound-to-Machine Swap Map (Red Zone / Poor Sleep)

| Compound Exercise | Machine Substitute |
|-------------------|-------------------|
| Barbell Back Squat | Leg Press |
| Barbell Bench Press | Chest Press Machine |
| Barbell Deadlift | Machine Back Extension + Leg Curl |
| Barbell Overhead Press | Shoulder Press Machine |
| Barbell Row | Seated Cable Row |
| Barbell Front Squat | Hack Squat Machine |

These swaps are suggested (not forced) when the user is in the Red zone and sleep quality was below 60%.

### Mid-Workout RPE Rule Engine

During the workout, after each set the user logs their RPE (Rate of Perceived Exertion, 1-10 scale). The rule engine fires synchronously on the client side:

```
RPE_DELTA = logged_RPE - expected_RPE

If RPE_DELTA >= 2:
  -> Trigger weight adjustment suggestion
  -> Suggested new weight = current_weight * (1 - (RPE_DELTA * 0.05))
  -> Display AIAdjustmentBanner: "That felt harder than expected. Drop to {newWeight} lbs?"

If RPE_DELTA <= -2:
  -> Suggest weight increase
  -> Suggested new weight = current_weight * (1 + (abs(RPE_DELTA) * 0.05))
  -> Display AIAdjustmentBanner: "Feeling strong! Bump up to {newWeight} lbs?"
```

The expected RPE is derived from the exercise's programmed intensity percentage and historical RPE logs for that exercise.

---

## Feature 2: Exercise Substitution

### Muscle Group Match Scoring

When the user requests a substitute (due to pain, equipment unavailability, or preference), candidates are scored:

```ts
function scoreSubstitute(original: Exercise, candidate: Exercise): number {
  let score = 0;

  // Primary muscle group match: +50
  if (candidate.primaryMuscle === original.primaryMuscle) score += 50;

  // Secondary muscle overlap: +10 per shared secondary
  const sharedSecondary = intersection(candidate.secondaryMuscles, original.secondaryMuscles);
  score += sharedSecondary.length * 10;

  // Movement pattern match (push/pull/hinge/squat/carry): +20
  if (candidate.movementPattern === original.movementPattern) score += 20;

  // Equipment availability: +15 if candidate uses available equipment
  if (isEquipmentAvailable(candidate.equipment, userEquipmentProfile)) score += 15;

  // Not in pain exclusion list: +5
  if (!isPainExcluded(candidate, userPainAreas)) score += 5;

  return score;
}
```

### `PAIN_TO_MUSCLE_EXCLUSIONS` Map

When the user reports pain in a body area, specific muscle groups and movements are excluded from substitution candidates:

```ts
const PAIN_TO_MUSCLE_EXCLUSIONS: Record<string, string[]> = {
  'lower_back':   ['erector_spinae', 'glutes_heavy_hinge'],
  'shoulder':     ['anterior_deltoid', 'overhead_press_pattern'],
  'knee':         ['quadriceps_heavy_extension', 'deep_squat_pattern'],
  'elbow':        ['triceps_isolation', 'heavy_curl_pattern'],
  'wrist':        ['wrist_flexors', 'barbell_grip_exercises'],
  'hip':          ['hip_flexors', 'deep_lunge_pattern'],
  'neck':         ['upper_trapezius', 'overhead_load_pattern'],
};
```

### Equipment Profile Per Location

Users can define equipment profiles for their gym, home, and travel setups:

```ts
interface UserEquipmentProfile {
  location: 'gym' | 'home' | 'travel' | 'outdoor';
  equipment: string[];   // e.g. ['barbell', 'dumbbells', 'cable_machine', 'pull_up_bar']
}
```

The substitution engine filters candidates to only those usable with the currently active equipment profile.

---

## Feature 3: Body Composition Estimator

### 4-Signal Weighted Algorithm

The body composition estimate blends four independent signals:

| Signal | Weight | Source |
|--------|--------|--------|
| Navy Body Fat Formula | 0.40 | Manual measurements (neck, waist, hip circumference + height) |
| Weight Trend | 0.25 | Exponentially weighted moving average of daily weigh-ins |
| Progress Photos | 0.25 | AI-analyzed progress photos (visual body fat estimation) |
| Strength-to-Weight Ratio | 0.10 | Key lift maxes relative to body weight |

### Navy Formula Implementation

**Male:**
```
body_fat_% = 86.010 * log10(waist - neck) - 70.041 * log10(height) + 36.76
```

**Female:**
```
body_fat_% = 163.205 * log10(waist + hip - neck) - 97.684 * log10(height) - 78.387
```

### Composite Calculation

```ts
function estimateBodyComposition(signals: BodyCompSignals): BodyCompEstimate {
  const weights = { navy: 0.40, weightTrend: 0.25, photos: 0.25, strengthRatio: 0.10 };
  let totalWeight = 0;
  let weightedSum = 0;

  if (signals.navy !== null) {
    weightedSum += signals.navy * weights.navy;
    totalWeight += weights.navy;
  }
  if (signals.weightTrend !== null) {
    weightedSum += signals.weightTrend * weights.weightTrend;
    totalWeight += weights.weightTrend;
  }
  if (signals.photos !== null) {
    weightedSum += signals.photos * weights.photos;
    totalWeight += weights.photos;
  }
  if (signals.strengthRatio !== null) {
    weightedSum += signals.strengthRatio * weights.strengthRatio;
    totalWeight += weights.strengthRatio;
  }

  // Re-normalize weights based on available signals
  const estimatedBf = totalWeight > 0 ? weightedSum / totalWeight : null;

  return {
    estimatedBodyFatPercent: estimatedBf,
    leanMassLbs: signals.currentWeight * (1 - estimatedBf / 100),
    fatMassLbs: signals.currentWeight * (estimatedBf / 100),
    signalsUsed: Object.keys(signals).filter(k => signals[k] !== null),
    confidence: totalWeight,  // 0.0 to 1.0
  };
}
```

---

## Feature 4: Social Caption Generator

### Platform-Specific Prompts

Each social platform has a tailored system prompt:

**Instagram:**
```
Write an Instagram caption for a fitness post. Include relevant hashtags (5-10).
Keep it under 2200 characters. Use line breaks for readability.
```

**Twitter/X:**
```
Write a tweet about a workout achievement. Max 280 characters.
No hashtags unless they fit naturally. Punchy and concise.
```

**TikTok:**
```
Write a TikTok video caption. Max 150 characters. Trending and casual tone.
Include 2-3 relevant hashtags.
```

### 5 Tone Options

| Tone | Description |
|------|-------------|
| `motivational` | Inspiring, push-others-to-action energy |
| `humble` | Understated, grateful, process-focused |
| `funny` | Witty, self-deprecating humor about the grind |
| `technical` | Data-driven, focused on numbers and programming |
| `storytelling` | Narrative arc about the journey, before/after framing |

### Context Passed to LLM

```ts
interface CaptionContext {
  workoutType: string;
  exercises: { name: string; sets: number; reps: number; weight: number }[];
  duration: number;
  prsAchieved: { exercise: string; weight: number; reps: number }[];
  streakDays: number;
  platform: 'instagram' | 'twitter' | 'tiktok';
  tone: 'motivational' | 'humble' | 'funny' | 'technical' | 'storytelling';
}
```

---

## Feature 5: Music Matching

### `PHASE_MUSIC_MAP`

Each workout phase maps to target audio characteristics:

```ts
const PHASE_MUSIC_MAP: Record<string, MusicProfile> = {
  warmup: {
    bpmRange: [100, 120],
    energy: 0.4,
    valence: 0.6,        // moderate positivity
    genres: ['chill', 'lo-fi', 'ambient electronic'],
  },
  working_sets: {
    bpmRange: [130, 160],
    energy: 0.85,
    valence: 0.5,
    genres: ['hip-hop', 'electronic', 'metal', 'hard rock'],
  },
  rest_periods: {
    bpmRange: [90, 110],
    energy: 0.3,
    valence: 0.5,
    genres: ['chill', 'ambient'],
  },
  peak_effort: {
    bpmRange: [150, 180],
    energy: 0.95,
    valence: 0.4,        // intensity > happiness
    genres: ['metal', 'drum-and-bass', 'hardstyle'],
  },
  cooldown: {
    bpmRange: [80, 100],
    energy: 0.2,
    valence: 0.7,
    genres: ['acoustic', 'ambient', 'classical'],
  },
};
```

### Phase Transitions

Phase transitions are triggered by workout events in the workout player:

| Event | Phase Transition |
|-------|-----------------|
| Workout starts | -> `warmup` |
| First working set begins | -> `working_sets` |
| Set completed, rest timer starts | -> `rest_periods` |
| Rest timer ends, next set begins | -> `working_sets` |
| Final set of heaviest compound | -> `peak_effort` |
| Last exercise completed | -> `cooldown` |

The music matching engine sends the current phase's `MusicProfile` to the user's connected music service (Spotify/Apple Music) as a recommendation seed or queue filter.

---

## Database

### `user_equipment_profiles`

```sql
CREATE TABLE user_equipment_profiles (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  location        text NOT NULL CHECK (location IN ('gym', 'home', 'travel', 'outdoor')),
  equipment       text[] NOT NULL DEFAULT '{}',
  is_default      boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, location)
);
```

### `ai_body_comp_snapshots`

```sql
CREATE TABLE ai_body_comp_snapshots (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  estimated_body_fat_pct    numeric,
  lean_mass_lbs             numeric,
  fat_mass_lbs              numeric,
  navy_signal               numeric,
  weight_trend_signal       numeric,
  photo_signal              numeric,
  strength_ratio_signal     numeric,
  confidence                numeric,
  signals_used              text[],
  measured_at               timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_body_comp_user_date ON ai_body_comp_snapshots (user_id, measured_at);
```

### `ALTER workout_sessions`

```sql
ALTER TABLE workout_sessions
  ADD COLUMN ai_zone              text CHECK (ai_zone IN ('green', 'yellow', 'red')),
  ADD COLUMN ai_adjustments_json  jsonb,          -- log of all AI suggestions + user accept/reject
  ADD COLUMN social_caption       text;
```

---

## Edge Functions

| Function | Purpose |
|----------|---------|
| `ai-workout-intensity` | Pre-workout zone assessment. Accepts readiness data, returns zone + volume adjustments + compound swap suggestions. |
| `ai-exercise-substitution` | Accepts original exercise ID, pain areas, equipment profile. Returns ranked substitute list with scores. |
| `ai-body-comp-estimator` | Accepts measurements, photo URL, weight history, lift maxes. Runs 4-signal algorithm. Optionally calls vision model for photo analysis. |
| `ai-social-caption` | Accepts workout summary, platform, tone. Returns AI-generated caption. |

Music matching runs client-side only (no Edge Function needed).

---

## Components

### `AIAdjustmentBanner`

Appears inline in the workout player when the RPE rule engine fires. Shows the suggestion and Accept / Dismiss buttons.

```
┌──────────────────────────────────────────────┐
│  ⚡ Feeling strong! Bump up to 185 lbs?      │
│  [Accept]                     [Keep Current] │
└──────────────────────────────────────────────┘
```

### `PreWorkoutBriefingModal`

Displayed before workout start. Shows:
- Zone badge (green/yellow/red) with explanation.
- Volume adjustments summary (if yellow/red).
- Compound swap suggestions (if red + poor sleep).
- Weather context (outdoor workout warnings).
- "Start Workout" button that accepts or overrides adjustments.

### `ExerciseSubstitutionSheet`

Bottom sheet triggered by long-pressing an exercise in the workout player or tapping a "Swap" icon. Shows:
- Reason selector: Pain / Equipment / Preference.
- If Pain: body area picker -> exclusion filter applied.
- Ranked list of substitutes with match score bars.
- One-tap swap that replaces the exercise in the current session.

### `BodyCompChart`

Line chart showing body fat percentage over time with:
- Confidence band (shaded area based on confidence score).
- Individual signal contributions as toggleable overlay lines.
- Lean mass vs fat mass stacked area chart option.

### `SocialShareSheet`

Post-workout share sheet:
- Platform selector (Instagram / Twitter / TikTok).
- Tone selector (5 options as chips).
- Generated caption preview with copy and edit capabilities.
- Direct share button (opens platform's share intent with pre-filled text).

---

## Hook: `useWorkoutAI`

Unified hook for all 5 features:

```ts
function useWorkoutAI(workoutSessionId: string) {
  return {
    // Intensity
    zone: 'green' | 'yellow' | 'red';
    volumeAdjustments: VolumeAdjustment[];
    compoundSwaps: CompoundSwap[];
    evaluateRPE: (exerciseId: string, setNumber: number, loggedRPE: number) => RPESuggestion | null;

    // Substitution
    getSubstitutes: (exerciseId: string, reason: SubReason, painAreas?: string[]) => Promise<ScoredSubstitute[]>;
    applySubstitution: (originalId: string, substituteId: string) => void;

    // Body Comp
    latestEstimate: BodyCompEstimate | null;
    requestNewEstimate: (measurements?: NavyMeasurements) => Promise<BodyCompEstimate>;

    // Social
    generateCaption: (platform: Platform, tone: Tone) => Promise<string>;

    // Music
    currentPhase: MusicPhase;
    musicProfile: MusicProfile;
    transitionPhase: (phase: MusicPhase) => void;

    // State
    isLoading: boolean;
  };
}
```

---

## `workout-player.tsx` Integration

Three targeted changes to the existing workout player screen:

### Change 1: Pre-Workout Briefing

```tsx
// Before workout starts, show briefing modal
useEffect(() => {
  if (session.status === 'not_started') {
    setShowBriefing(true);
  }
}, [session.status]);

// Render
{showBriefing && <PreWorkoutBriefingModal zone={zone} adjustments={volumeAdjustments} swaps={compoundSwaps} />}
```

### Change 2: Post-Set RPE Check

```tsx
// After each set is logged
const handleSetComplete = (exerciseId: string, setNumber: number, loggedRPE: number) => {
  const suggestion = evaluateRPE(exerciseId, setNumber, loggedRPE);
  if (suggestion) {
    setActiveSuggestion(suggestion);   // triggers AIAdjustmentBanner
  }
};

// Render
{activeSuggestion && <AIAdjustmentBanner suggestion={activeSuggestion} onAccept={...} onDismiss={...} />}
```

### Change 3: Music Phase Sync

```tsx
// Transition music phase on workout events
useEffect(() => {
  if (currentExercise && currentSet === 1 && exerciseIndex === 0) {
    transitionPhase('working_sets');
  }
}, [currentExercise, currentSet]);

useEffect(() => {
  if (isResting) transitionPhase('rest_periods');
}, [isResting]);
```

---

## Build Sequence

| Phase | Days | Description |
|-------|------|-------------|
| 1 | 1-2 | Database migrations: `user_equipment_profiles`, `ai_body_comp_snapshots`, ALTER `workout_sessions`. |
| 2 | 2-4 | Intensity Auto-Adjustment: zone assessment, volume reduction, compound swap map, `ai-workout-intensity` Edge Function, `PreWorkoutBriefingModal`. |
| 3 | 4-6 | Mid-Workout RPE Engine: client-side rule engine, `AIAdjustmentBanner`, `workout-player.tsx` Change 2. |
| 4 | 6-8 | Exercise Substitution: scoring algorithm, pain exclusions, equipment profiles, `ai-exercise-substitution` Edge Function, `ExerciseSubstitutionSheet`. |
| 5 | 8-9 | Body Composition Estimator: 4-signal algorithm, Navy formula, `ai-body-comp-estimator` Edge Function, `BodyCompChart`. |
| 6 | 9-10 | Social Caption Generator: platform prompts, tone options, `ai-social-caption` Edge Function, `SocialShareSheet`. |
| 7 | 10-12 | Music Matching: `PHASE_MUSIC_MAP`, phase transition logic, `workout-player.tsx` Change 3, `useWorkoutAI` unified hook finalization. |
