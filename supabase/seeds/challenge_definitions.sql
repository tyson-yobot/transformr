-- ============================================================================
-- CHALLENGE DEFINITIONS SEED DATA
-- 12 pre-loaded challenge modules for the TRANSFORMR Challenge Center.
-- Run after all migrations (especially 00024_create_challenge_tables.sql)
-- and the main seed.sql have been applied.
-- ============================================================================

INSERT INTO challenge_definitions (
  name, slug, description, duration_days, category, rules,
  restart_on_failure, is_system, icon, color, difficulty,
  estimated_daily_time_minutes
) VALUES

-- ---------------------------------------------------------------------------
-- 1. 75 Hard
-- ---------------------------------------------------------------------------
(
  '75 Hard',
  '75-hard',
  'The ultimate mental toughness program created by Andy Frisella. Two workouts a day, strict diet, water, reading, and a daily progress photo for 75 consecutive days. One slip and you restart from Day 1.',
  75,
  'mental_toughness',
  '{
    "tasks": [
      {
        "id": "workout_1",
        "label": "45-min workout (outdoor)",
        "type": "workout",
        "auto_verify": true,
        "config": { "min_duration_minutes": 45, "location": "outdoor" }
      },
      {
        "id": "workout_2",
        "label": "45-min workout (any)",
        "type": "workout",
        "auto_verify": true,
        "config": { "min_duration_minutes": 45 }
      },
      {
        "id": "diet",
        "label": "Follow diet (no cheats, no alcohol)",
        "type": "checkbox",
        "auto_verify": false,
        "config": { "no_alcohol": true, "no_cheat_meals": true }
      },
      {
        "id": "water",
        "label": "Drink 128 oz water",
        "type": "water",
        "auto_verify": true,
        "config": { "min_oz": 128 }
      },
      {
        "id": "reading",
        "label": "Read 10 pages of nonfiction",
        "type": "checkbox",
        "auto_verify": false,
        "config": { "min_pages": 10, "genre": "nonfiction" }
      },
      {
        "id": "progress_photo",
        "label": "Take a progress photo",
        "type": "photo",
        "auto_verify": true,
        "config": {}
      }
    ]
  }',
  true,
  true,
  'flame',
  '#FF4500',
  'extreme',
  150
),

-- ---------------------------------------------------------------------------
-- 2. 75 Soft
-- ---------------------------------------------------------------------------
(
  '75 Soft',
  '75-soft',
  'A more accessible version of 75 Hard. One daily workout with a weekly rest day, mindful eating, hydration, and daily reading. Missing a day does not reset the counter.',
  75,
  'mental_toughness',
  '{
    "tasks": [
      {
        "id": "workout_1",
        "label": "45-min workout",
        "type": "workout",
        "auto_verify": true,
        "config": { "min_duration_minutes": 45, "rest_days_per_week": 1, "rest_day_activity": "active_recovery" }
      },
      {
        "id": "diet",
        "label": "Eat well and mindfully",
        "type": "checkbox",
        "auto_verify": false,
        "config": {}
      },
      {
        "id": "water",
        "label": "Drink 101 oz water",
        "type": "water",
        "auto_verify": true,
        "config": { "min_oz": 101 }
      },
      {
        "id": "reading",
        "label": "Read 10 pages of any book",
        "type": "checkbox",
        "auto_verify": false,
        "config": { "min_pages": 10 }
      }
    ]
  }',
  false,
  true,
  'leaf',
  '#4CAF50',
  'beginner',
  75
),

-- ---------------------------------------------------------------------------
-- 3. 75 Medium
-- ---------------------------------------------------------------------------
(
  '75 Medium',
  '75-medium',
  'A balanced middle ground between 75 Hard and 75 Soft. One workout, flexible diet at 90% adherence, scaled water intake, reading or listening, and daily meditation. Photos on Day 1 and Day 75 only.',
  75,
  'mental_toughness',
  '{
    "tasks": [
      {
        "id": "workout_1",
        "label": "45-min workout",
        "type": "workout",
        "auto_verify": true,
        "config": { "min_duration_minutes": 45 }
      },
      {
        "id": "diet",
        "label": "Follow diet (90% adherence)",
        "type": "checkbox",
        "auto_verify": false,
        "config": { "adherence_percent": 90 }
      },
      {
        "id": "water",
        "label": "Drink half your bodyweight in oz",
        "type": "water",
        "auto_verify": true,
        "config": { "formula": "bodyweight_lbs_div_2_oz" }
      },
      {
        "id": "reading",
        "label": "10 min reading or listening",
        "type": "checkbox",
        "auto_verify": false,
        "config": { "min_minutes": 10, "allows_audio": true }
      },
      {
        "id": "meditation",
        "label": "5-min meditation",
        "type": "checkbox",
        "auto_verify": false,
        "config": { "min_minutes": 5 }
      },
      {
        "id": "progress_photo",
        "label": "Progress photo (Day 1 and Day 75)",
        "type": "photo",
        "auto_verify": true,
        "config": { "required_days": [1, 75] }
      }
    ]
  }',
  false,
  true,
  'trending-up',
  '#FF9800',
  'intermediate',
  90
),

-- ---------------------------------------------------------------------------
-- 4. The Murph
-- ---------------------------------------------------------------------------
(
  'The Murph',
  'the-murph',
  'Honor Lt. Michael Murphy with this legendary CrossFit Hero WOD. Includes a 30-day prep program building toward the full Murph: 1-mile run, 100 pull-ups, 200 push-ups, 300 air squats, 1-mile run. Optional 20 lb weighted vest.',
  30,
  'fitness',
  '{
    "modes": {
      "prep_program": {
        "duration_days": 30,
        "description": "Progressive 30-day training plan to build toward the full Murph."
      },
      "single_event": {
        "duration_days": 1,
        "description": "Complete the full Murph workout in a single session."
      }
    },
    "tasks": [
      {
        "id": "run_1",
        "label": "1-mile run",
        "type": "workout",
        "auto_verify": true,
        "config": { "distance_miles": 1, "sequence": 1 }
      },
      {
        "id": "pull_ups",
        "label": "100 pull-ups",
        "type": "workout",
        "auto_verify": true,
        "config": { "exercise": "pull_up", "reps": 100, "sequence": 2 }
      },
      {
        "id": "push_ups",
        "label": "200 push-ups",
        "type": "workout",
        "auto_verify": true,
        "config": { "exercise": "push_up", "reps": 200, "sequence": 3 }
      },
      {
        "id": "air_squats",
        "label": "300 air squats",
        "type": "workout",
        "auto_verify": true,
        "config": { "exercise": "air_squat", "reps": 300, "sequence": 4 }
      },
      {
        "id": "run_2",
        "label": "1-mile run",
        "type": "workout",
        "auto_verify": true,
        "config": { "distance_miles": 1, "sequence": 5 }
      }
    ],
    "options": {
      "weighted_vest": { "enabled": false, "weight_lbs": 20 },
      "partition_allowed": true,
      "partition_note": "Pull-ups, push-ups, and squats can be partitioned in any order (e.g., 20 rounds of 5-10-15)."
    }
  }',
  false,
  true,
  'shield',
  '#1E3A5F',
  'advanced',
  60
),

-- ---------------------------------------------------------------------------
-- 5. Couch to 5K
-- ---------------------------------------------------------------------------
(
  'Couch to 5K',
  'couch-to-5k',
  'A 9-week progressive running program that takes you from the couch to running a continuous 5K (3.1 miles). Three runs per week with walk/jog intervals that gradually shift to continuous running.',
  63,
  'running',
  '{
    "schedule": {
      "runs_per_week": 3,
      "total_weeks": 9
    },
    "tasks": [
      {
        "id": "run",
        "label": "Complete scheduled run",
        "type": "workout",
        "auto_verify": true,
        "config": { "activity": "run" }
      }
    ],
    "weekly_plan": [
      { "week": 1, "description": "Alternate 60-sec jog / 90-sec walk for 20 min" },
      { "week": 2, "description": "Alternate 90-sec jog / 2-min walk for 20 min" },
      { "week": 3, "description": "Two reps of: jog 90 sec, walk 90 sec, jog 3 min, walk 3 min" },
      { "week": 4, "description": "Jog 3 min, walk 90 sec, jog 5 min, walk 2.5 min, jog 3 min, walk 90 sec, jog 5 min" },
      { "week": 5, "description": "Run 1: 5-3-5-3-5 jog/walk. Run 2: 8 min jog, 5 walk, 8 jog. Run 3: 20-min continuous jog" },
      { "week": 6, "description": "Run 1: 5-3-8-3-5. Run 2: 10 jog, 3 walk, 10 jog. Run 3: 25-min continuous jog" },
      { "week": 7, "description": "25-min continuous jog each session" },
      { "week": 8, "description": "28-min continuous jog each session" },
      { "week": 9, "description": "30-min continuous run (approx. 5K)" }
    ]
  }',
  false,
  true,
  'footprints',
  '#2196F3',
  'beginner',
  30
),

-- ---------------------------------------------------------------------------
-- 6. 30-Day Squat Challenge
-- ---------------------------------------------------------------------------
(
  '30-Day Squat Challenge',
  '30-day-squat',
  'Build lower body strength and endurance with progressive daily squats. Start at 50 squats and work your way up to 250 by Day 30. Every 4th day is a rest day.',
  30,
  'strength',
  '{
    "tasks": [
      {
        "id": "squats",
        "label": "Complete daily squats",
        "type": "workout",
        "auto_verify": true,
        "config": { "exercise": "air_squat" }
      }
    ],
    "daily_targets": {
      "1": 50, "2": 55, "3": 60, "4": "rest",
      "5": 70, "6": 75, "7": 80, "8": "rest",
      "9": 100, "10": 105, "11": 110, "12": "rest",
      "13": 130, "14": 135, "15": 140, "16": "rest",
      "17": 150, "18": 155, "19": 160, "20": "rest",
      "21": 180, "22": 185, "23": 190, "24": "rest",
      "25": 220, "26": 225, "27": 230, "28": "rest",
      "29": 240, "30": 250
    },
    "rest_pattern": "every_4th_day"
  }',
  false,
  true,
  'arrow-down-circle',
  '#9C27B0',
  'beginner',
  15
),

-- ---------------------------------------------------------------------------
-- 7. 30-Day Plank Challenge
-- ---------------------------------------------------------------------------
(
  '30-Day Plank Challenge',
  '30-day-plank',
  'Strengthen your core with progressive daily plank holds. Start at 20 seconds and build to a 5-minute hold by Day 30. Every 4th day is a rest day.',
  30,
  'strength',
  '{
    "tasks": [
      {
        "id": "plank",
        "label": "Complete daily plank hold",
        "type": "workout",
        "auto_verify": true,
        "config": { "exercise": "plank" }
      }
    ],
    "daily_targets": {
      "1": "20s", "2": "20s", "3": "30s", "4": "rest",
      "5": "30s", "6": "45s", "7": "45s", "8": "rest",
      "9": "60s", "10": "60s", "11": "75s", "12": "rest",
      "13": "90s", "14": "90s", "15": "120s", "16": "rest",
      "17": "120s", "18": "150s", "19": "150s", "20": "rest",
      "21": "150s", "22": "180s", "23": "180s", "24": "rest",
      "25": "210s", "26": "210s", "27": "240s", "28": "rest",
      "29": "270s", "30": "300s"
    },
    "rest_pattern": "every_4th_day"
  }',
  false,
  true,
  'timer',
  '#00BCD4',
  'beginner',
  10
),

-- ---------------------------------------------------------------------------
-- 8. Dry January / Sober October
-- ---------------------------------------------------------------------------
(
  'Dry January / Sober October',
  'dry-month',
  'Commit to 30 days of zero alcohol. Whether it is January, October, or any month you choose, give your body and mind a reset. Track each alcohol-free day.',
  30,
  'lifestyle',
  '{
    "tasks": [
      {
        "id": "no_alcohol",
        "label": "No alcohol today",
        "type": "checkbox",
        "auto_verify": false,
        "config": { "substance": "alcohol", "target": "zero" }
      }
    ]
  }',
  false,
  true,
  'wine-off',
  '#E91E63',
  'beginner',
  0
),

-- ---------------------------------------------------------------------------
-- 9. Whole30
-- ---------------------------------------------------------------------------
(
  'Whole30',
  'whole30',
  'Reset your nutrition with 30 days of whole, unprocessed foods. Eliminate sugar, alcohol, grains, legumes, soy, and dairy. No stepping on the scale during the challenge. Focus on how you feel, not the number.',
  30,
  'nutrition',
  '{
    "tasks": [
      {
        "id": "no_sugar",
        "label": "No added sugar or sweeteners",
        "type": "checkbox",
        "auto_verify": false,
        "config": { "eliminated": "sugar" }
      },
      {
        "id": "no_alcohol",
        "label": "No alcohol",
        "type": "checkbox",
        "auto_verify": false,
        "config": { "eliminated": "alcohol" }
      },
      {
        "id": "no_grains",
        "label": "No grains",
        "type": "checkbox",
        "auto_verify": false,
        "config": { "eliminated": "grains" }
      },
      {
        "id": "no_legumes",
        "label": "No legumes",
        "type": "checkbox",
        "auto_verify": false,
        "config": { "eliminated": "legumes" }
      },
      {
        "id": "no_soy",
        "label": "No soy",
        "type": "checkbox",
        "auto_verify": false,
        "config": { "eliminated": "soy" }
      },
      {
        "id": "no_dairy",
        "label": "No dairy",
        "type": "checkbox",
        "auto_verify": false,
        "config": { "eliminated": "dairy" }
      },
      {
        "id": "no_scale",
        "label": "Stay off the scale",
        "type": "checkbox",
        "auto_verify": false,
        "config": { "eliminated": "scale" }
      }
    ]
  }',
  false,
  true,
  'salad',
  '#8BC34A',
  'intermediate',
  30
),

-- ---------------------------------------------------------------------------
-- 10. 10,000 Steps Daily
-- ---------------------------------------------------------------------------
(
  '10,000 Steps Daily',
  '10k-steps',
  'Build a daily walking habit by hitting 10,000 steps every day for 30 days. Simple, effective, and accessible to everyone. Syncs automatically with your phone or fitness tracker.',
  30,
  'fitness',
  '{
    "tasks": [
      {
        "id": "steps",
        "label": "Walk 10,000+ steps",
        "type": "steps",
        "auto_verify": true,
        "config": { "min_steps": 10000 }
      }
    ]
  }',
  false,
  true,
  'footprints',
  '#4CAF50',
  'beginner',
  60
),

-- ---------------------------------------------------------------------------
-- 11. Intermittent Fasting
-- ---------------------------------------------------------------------------
(
  'Intermittent Fasting',
  'intermittent-fasting',
  'Practice time-restricted eating for 30 days. Choose your protocol: 16:8 (16 hours fasting, 8-hour eating window), 18:6, 20:4, or 5:2 (eat normally 5 days, restrict calories 2 days). Build metabolic flexibility.',
  30,
  'nutrition',
  '{
    "tasks": [
      {
        "id": "fasting_window",
        "label": "Complete fasting window",
        "type": "checkbox",
        "auto_verify": false,
        "config": {}
      }
    ],
    "protocols": [
      { "id": "16_8", "label": "16:8", "fasting_hours": 16, "eating_hours": 8, "description": "16 hours fasting, 8-hour eating window. Most popular starting protocol." },
      { "id": "18_6", "label": "18:6", "fasting_hours": 18, "eating_hours": 6, "description": "18 hours fasting, 6-hour eating window." },
      { "id": "20_4", "label": "20:4", "fasting_hours": 20, "eating_hours": 4, "description": "20 hours fasting, 4-hour eating window. Also known as the Warrior Diet." },
      { "id": "5_2", "label": "5:2", "normal_days": 5, "restricted_days": 2, "description": "Eat normally 5 days, restrict to 500-600 calories on 2 non-consecutive days." }
    ],
    "user_selects_protocol": true
  }',
  false,
  true,
  'clock',
  '#FF5722',
  'intermediate',
  0
),

-- ---------------------------------------------------------------------------
-- 12. Custom Challenge (Template)
-- ---------------------------------------------------------------------------
(
  'Custom Challenge',
  'custom',
  'Create your own challenge with custom rules, duration, and daily tasks. Define what success looks like and track your progress your way.',
  30,
  'custom',
  '{
    "tasks": [],
    "is_template": true,
    "user_defined": true,
    "customizable_fields": [
      "name",
      "description",
      "duration_days",
      "category",
      "tasks",
      "restart_on_failure",
      "difficulty"
    ]
  }',
  false,
  true,
  'pencil',
  '#607D8B',
  'beginner',
  0
);
