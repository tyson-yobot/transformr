-- Seed all 11 built-in challenge definitions with full auto-verification rules
-- Each challenge has detailed task definitions with verification configs

INSERT INTO challenge_definitions (name, slug, description, duration_days, category, rules, restart_on_failure, is_system, icon, color, difficulty, estimated_daily_time_minutes) VALUES

-- =============================================================================
-- 1. 75 HARD
-- =============================================================================
(
  '75 Hard',
  '75-hard',
  'The ultimate mental toughness program. Follow a diet, complete two 45-minute workouts (one outdoor), drink a gallon of water, read 10 pages of nonfiction, and take a daily progress photo — every single day for 75 days. Miss one task and you restart from Day 1.',
  75,
  'mental_toughness',
  '{
    "tasks": [
      {
        "id": "diet",
        "label": "Follow your diet (no cheats, no alcohol)",
        "type": "nutrition",
        "auto_verify": true,
        "config": {
          "requires_diet_selection": true,
          "no_alcohol": true,
          "verify_all_meals_logged": true,
          "ai_compliance_check": true
        }
      },
      {
        "id": "workout_1",
        "label": "First 45-minute workout",
        "type": "workout",
        "auto_verify": true,
        "config": {
          "min_duration_minutes": 45,
          "min_count": 1,
          "session_index": 0
        }
      },
      {
        "id": "workout_2_outdoor",
        "label": "Second 45-minute workout (outdoor)",
        "type": "workout",
        "auto_verify": true,
        "config": {
          "min_duration_minutes": 45,
          "min_count": 1,
          "session_index": 1,
          "require_outdoor": true,
          "gps_verify": true,
          "min_gap_hours": 3
        }
      },
      {
        "id": "water",
        "label": "Drink 1 gallon of water (128 oz)",
        "type": "water",
        "auto_verify": true,
        "config": {
          "target_oz": 128
        }
      },
      {
        "id": "reading",
        "label": "Read 10 pages of nonfiction",
        "type": "reading",
        "auto_verify": false,
        "config": {
          "target_pages": 10,
          "nonfiction_only": true,
          "no_audiobooks": true
        }
      },
      {
        "id": "photo",
        "label": "Take a daily progress photo",
        "type": "photo",
        "auto_verify": true,
        "config": {
          "alignment_guide": true,
          "storage_bucket": "progress-photos"
        }
      }
    ],
    "restart_on_failure": true,
    "notification_escalation": {
      "noon": "gentle",
      "18:00": "firm",
      "21:00": "urgent"
    }
  }'::jsonb,
  true,
  true,
  '🔥',
  '#FF4500',
  'extreme',
  120
),

-- =============================================================================
-- 2. 75 SOFT
-- =============================================================================
(
  '75 Soft',
  '75-soft',
  'A sustainable alternative to 75 Hard. Eat well, workout 45 minutes daily (one rest day per week allowed), drink 3 liters of water, and read 10 pages. No restart on failure — your consistency percentage is tracked instead.',
  75,
  'mental_toughness',
  '{
    "tasks": [
      {
        "id": "eat_well",
        "label": "Eat well (focus on whole foods)",
        "type": "nutrition",
        "auto_verify": true,
        "config": {
          "quality_check": true,
          "max_processed_percent": 50,
          "ai_quality_flag": true
        }
      },
      {
        "id": "workout",
        "label": "45-minute workout",
        "type": "workout",
        "auto_verify": true,
        "config": {
          "min_duration_minutes": 45,
          "min_count": 1
        }
      },
      {
        "id": "water",
        "label": "Drink 3 liters of water (~101 oz)",
        "type": "water",
        "auto_verify": true,
        "config": {
          "target_oz": 101
        }
      },
      {
        "id": "reading",
        "label": "Read 10 pages (any genre, audiobooks OK)",
        "type": "reading",
        "auto_verify": false,
        "config": {
          "target_pages": 10,
          "nonfiction_only": false,
          "no_audiobooks": false
        }
      },
      {
        "id": "active_recovery",
        "label": "Active recovery on rest day",
        "type": "workout",
        "auto_verify": true,
        "config": {
          "only_on_rest_day": true,
          "accepted_types": ["walking", "stretching", "yoga"],
          "min_duration_minutes": 15
        }
      }
    ],
    "restart_on_failure": false,
    "rest_days_per_week": 1,
    "scoring": "consistency_percentage",
    "champion_threshold": 90
  }'::jsonb,
  false,
  true,
  '💪',
  '#4CAF50',
  'intermediate',
  90
),

-- =============================================================================
-- 3. 75 MEDIUM
-- =============================================================================
(
  '75 Medium',
  '75-medium',
  'The middle ground between 75 Hard and 75 Soft. Follow a diet 90% of the time (1 cheat meal/week), workout 45 minutes, drink water based on body weight, read or listen 10 minutes, meditate 5 minutes, and take progress photos on Day 1 and Day 75.',
  75,
  'mental_toughness',
  '{
    "tasks": [
      {
        "id": "diet_90",
        "label": "Follow diet (90% compliance, 1 cheat meal/week)",
        "type": "nutrition",
        "auto_verify": true,
        "config": {
          "weekly_compliance_target": 90,
          "cheat_meals_per_week": 1,
          "ai_weekly_analysis": true
        }
      },
      {
        "id": "workout",
        "label": "45-minute workout",
        "type": "workout",
        "auto_verify": true,
        "config": {
          "min_duration_minutes": 45,
          "min_count": 1
        }
      },
      {
        "id": "water",
        "label": "Drink half body weight (lbs) in oz",
        "type": "water",
        "auto_verify": true,
        "config": {
          "target_oz": "dynamic",
          "formula": "profile.current_weight / 2",
          "auto_adjust_on_weight_change": true
        }
      },
      {
        "id": "reading",
        "label": "10 min reading or listening (self-development)",
        "type": "reading",
        "auto_verify": false,
        "config": {
          "target_minutes": 10,
          "audiobooks_allowed": true,
          "podcasts_allowed": true
        }
      },
      {
        "id": "meditation",
        "label": "5 min meditation or prayer",
        "type": "meditation",
        "auto_verify": true,
        "config": {
          "min_duration_minutes": 5,
          "focus_category": "meditation"
        }
      },
      {
        "id": "photo",
        "label": "Progress photo (Day 1 and Day 75)",
        "type": "photo",
        "auto_verify": true,
        "config": {
          "required_days": [1, 75],
          "storage_bucket": "progress-photos"
        }
      }
    ],
    "restart_on_failure": false
  }'::jsonb,
  false,
  true,
  '⚖️',
  '#2196F3',
  'intermediate',
  90
),

-- =============================================================================
-- 4. THE MURPH CHALLENGE
-- =============================================================================
(
  'The Murph Challenge',
  'murph',
  'Honor Lt. Michael P. Murphy with the legendary CrossFit Hero WOD: 1-mile run, 100 pull-ups, 200 push-ups, 300 air squats, 1-mile run. Choose a 30-day prep program or attempt the full Murph on a single day.',
  30,
  'fitness',
  '{
    "tasks": [
      {
        "id": "daily_workout",
        "label": "Complete today''s Murph Prep workout",
        "type": "workout",
        "auto_verify": true,
        "config": {
          "template_based": true,
          "track_reps": true,
          "exercises": ["pull_up", "push_up", "air_squat", "running"]
        }
      }
    ],
    "restart_on_failure": false,
    "modes": {
      "prep": {
        "duration_days": 30,
        "weekly_progression": {
          "week_1": {"pull_ups": 25, "push_ups": 50, "squats": 75, "label": "Quarter Murph"},
          "week_2": {"pull_ups": 34, "push_ups": 67, "squats": 100, "label": "Third Murph"},
          "week_3": {"pull_ups": 50, "push_ups": 100, "squats": 150, "label": "Half Murph"},
          "week_4": {"pull_ups": 100, "push_ups": 200, "squats": 300, "label": "Full Murph"}
        }
      },
      "single_event": {
        "duration_days": 1,
        "workout": {
          "run_1": {"distance_miles": 1},
          "pull_ups": 100,
          "push_ups": 200,
          "air_squats": 300,
          "run_2": {"distance_miles": 1}
        },
        "partition_options": {
          "unpartitioned": true,
          "cindy": {"rounds": 20, "pull_ups": 5, "push_ups": 10, "squats": 15}
        },
        "weighted_vest": {"men_lbs": 20, "women_lbs": 14}
      }
    },
    "leaderboard": true,
    "year_over_year_tracking": true
  }'::jsonb,
  false,
  true,
  '🎖️',
  '#8B0000',
  'advanced',
  60
),

-- =============================================================================
-- 5. COUCH TO 5K (C25K)
-- =============================================================================
(
  'Couch to 5K',
  'c25k',
  'The world''s most popular beginner running program. Go from zero running to completing a full 5K in 8 weeks with guided run/walk intervals, audio coaching, GPS tracking, and automatic progression.',
  56,
  'running',
  '{
    "tasks": [
      {
        "id": "run",
        "label": "Complete today''s run",
        "type": "workout",
        "auto_verify": true,
        "config": {
          "workout_type": "running",
          "gps_tracking": true,
          "audio_cues": true,
          "haptic_transitions": true
        }
      }
    ],
    "restart_on_failure": false,
    "runs_per_week": 3,
    "daily_schedule": {
      "1": {"intervals": [{"type": "jog", "seconds": 60}, {"type": "walk", "seconds": 90}], "total_minutes": 20, "week": 1},
      "3": {"intervals": [{"type": "jog", "seconds": 60}, {"type": "walk", "seconds": 90}], "total_minutes": 20, "week": 1},
      "5": {"intervals": [{"type": "jog", "seconds": 60}, {"type": "walk", "seconds": 90}], "total_minutes": 20, "week": 1},
      "8": {"intervals": [{"type": "jog", "seconds": 90}, {"type": "walk", "seconds": 120}], "total_minutes": 20, "week": 2},
      "10": {"intervals": [{"type": "jog", "seconds": 90}, {"type": "walk", "seconds": 120}], "total_minutes": 20, "week": 2},
      "12": {"intervals": [{"type": "jog", "seconds": 90}, {"type": "walk", "seconds": 120}], "total_minutes": 20, "week": 2},
      "15": {"intervals": [{"type": "jog", "seconds": 90}, {"type": "walk", "seconds": 90}, {"type": "jog", "seconds": 180}, {"type": "walk", "seconds": 180}], "reps": 2, "total_minutes": 20, "week": 3},
      "17": {"intervals": [{"type": "jog", "seconds": 90}, {"type": "walk", "seconds": 90}, {"type": "jog", "seconds": 180}, {"type": "walk", "seconds": 180}], "reps": 2, "total_minutes": 20, "week": 3},
      "19": {"intervals": [{"type": "jog", "seconds": 90}, {"type": "walk", "seconds": 90}, {"type": "jog", "seconds": 180}, {"type": "walk", "seconds": 180}], "reps": 2, "total_minutes": 20, "week": 3},
      "22": {"intervals": [{"type": "jog", "seconds": 180}, {"type": "walk", "seconds": 90}, {"type": "jog", "seconds": 300}, {"type": "walk", "seconds": 150}, {"type": "jog", "seconds": 180}, {"type": "walk", "seconds": 90}, {"type": "jog", "seconds": 300}], "total_minutes": 22, "week": 4},
      "24": {"intervals": [{"type": "jog", "seconds": 180}, {"type": "walk", "seconds": 90}, {"type": "jog", "seconds": 300}, {"type": "walk", "seconds": 150}, {"type": "jog", "seconds": 180}, {"type": "walk", "seconds": 90}, {"type": "jog", "seconds": 300}], "total_minutes": 22, "week": 4},
      "26": {"intervals": [{"type": "jog", "seconds": 180}, {"type": "walk", "seconds": 90}, {"type": "jog", "seconds": 300}, {"type": "walk", "seconds": 150}, {"type": "jog", "seconds": 180}, {"type": "walk", "seconds": 90}, {"type": "jog", "seconds": 300}], "total_minutes": 22, "week": 4},
      "29": {"intervals": [{"type": "jog", "seconds": 300}, {"type": "walk", "seconds": 180}, {"type": "jog", "seconds": 300}], "total_minutes": 20, "week": 5},
      "31": {"intervals": [{"type": "jog", "seconds": 480}, {"type": "walk", "seconds": 300}, {"type": "jog", "seconds": 480}], "total_minutes": 22, "week": 5},
      "33": {"intervals": [{"type": "jog", "seconds": 1200}], "total_minutes": 20, "week": 5},
      "36": {"intervals": [{"type": "jog", "seconds": 300}, {"type": "walk", "seconds": 180}, {"type": "jog", "seconds": 480}, {"type": "walk", "seconds": 180}, {"type": "jog", "seconds": 300}], "total_minutes": 25, "week": 6},
      "38": {"intervals": [{"type": "jog", "seconds": 600}, {"type": "walk", "seconds": 180}, {"type": "jog", "seconds": 600}], "total_minutes": 25, "week": 6},
      "40": {"intervals": [{"type": "jog", "seconds": 1500}], "total_minutes": 25, "week": 6},
      "43": {"intervals": [{"type": "jog", "seconds": 1500}], "total_minutes": 25, "week": 7},
      "45": {"intervals": [{"type": "jog", "seconds": 1500}], "total_minutes": 25, "week": 7},
      "47": {"intervals": [{"type": "jog", "seconds": 1500}], "total_minutes": 25, "week": 7},
      "50": {"intervals": [{"type": "jog", "seconds": 1680}], "total_minutes": 28, "week": 8},
      "52": {"intervals": [{"type": "jog", "seconds": 1680}], "total_minutes": 28, "week": 8},
      "54": {"intervals": [{"type": "jog", "seconds": 1800}], "total_minutes": 30, "week": 8, "label": "5K Day!"}
    },
    "weather_aware": true,
    "spotify_integration": true
  }'::jsonb,
  false,
  true,
  '🏃',
  '#FF9800',
  'beginner',
  30
),

-- =============================================================================
-- 6. 30-DAY SQUAT CHALLENGE
-- =============================================================================
(
  '30-Day Squat Challenge',
  '30-day-squat',
  'Build lower body strength with progressive daily squat targets starting at 50 and building to 250. Quick-log your squats in sets throughout the day.',
  30,
  'strength',
  '{
    "tasks": [
      {
        "id": "squats",
        "label": "Complete daily squat target",
        "type": "workout",
        "auto_verify": true,
        "config": {
          "exercise": "air_squat",
          "track_reps": true,
          "allow_sets": true,
          "quick_log": true,
          "ai_form_check": true
        }
      }
    ],
    "restart_on_failure": false,
    "daily_schedule": {
      "1": {"target_reps": 50},
      "2": {"target_reps": 55},
      "3": {"target_reps": 60},
      "4": {"rest": true},
      "5": {"target_reps": 70},
      "6": {"target_reps": 75},
      "7": {"target_reps": 80},
      "8": {"rest": true},
      "9": {"target_reps": 100},
      "10": {"target_reps": 110},
      "11": {"target_reps": 130},
      "12": {"target_reps": 135},
      "13": {"target_reps": 140},
      "14": {"rest": true},
      "15": {"target_reps": 160},
      "16": {"target_reps": 165},
      "17": {"target_reps": 170},
      "18": {"rest": true},
      "19": {"target_reps": 180},
      "20": {"target_reps": 190},
      "21": {"target_reps": 200},
      "22": {"rest": true},
      "23": {"target_reps": 220},
      "24": {"target_reps": 225},
      "25": {"target_reps": 230},
      "26": {"rest": true},
      "27": {"target_reps": 240},
      "28": {"target_reps": 245},
      "29": {"target_reps": 250},
      "30": {"target_reps": 250}
    },
    "measurement_comparison": {
      "day_1": "thigh_circumference",
      "day_30": "thigh_circumference"
    }
  }'::jsonb,
  false,
  true,
  '🦵',
  '#9C27B0',
  'beginner',
  15
),

-- =============================================================================
-- 7. 30-DAY PLANK CHALLENGE
-- =============================================================================
(
  '30-Day Plank Challenge',
  '30-day-plank',
  'Build core strength with progressive plank holds from 20 seconds to 5 minutes. Built-in timer with haptic pulses and voice encouragement.',
  30,
  'strength',
  '{
    "tasks": [
      {
        "id": "plank",
        "label": "Hold plank for target duration",
        "type": "workout",
        "auto_verify": true,
        "config": {
          "exercise": "plank",
          "timer_based": true,
          "haptic_pulse_interval_seconds": 15,
          "voice_encouragement": true,
          "track_personal_record": true
        }
      }
    ],
    "restart_on_failure": false,
    "daily_schedule": {
      "1": {"target_seconds": 20},
      "2": {"target_seconds": 25},
      "3": {"target_seconds": 30},
      "4": {"rest": true},
      "5": {"target_seconds": 35},
      "6": {"target_seconds": 40},
      "7": {"target_seconds": 45},
      "8": {"rest": true},
      "9": {"target_seconds": 50},
      "10": {"target_seconds": 60},
      "11": {"target_seconds": 65},
      "12": {"rest": true},
      "13": {"target_seconds": 75},
      "14": {"target_seconds": 80},
      "15": {"target_seconds": 90},
      "16": {"rest": true},
      "17": {"target_seconds": 100},
      "18": {"target_seconds": 110},
      "19": {"target_seconds": 120},
      "20": {"rest": true},
      "21": {"target_seconds": 150},
      "22": {"target_seconds": 160},
      "23": {"target_seconds": 170},
      "24": {"rest": true},
      "25": {"target_seconds": 200},
      "26": {"target_seconds": 220},
      "27": {"target_seconds": 240},
      "28": {"rest": true},
      "29": {"target_seconds": 270},
      "30": {"target_seconds": 300}
    }
  }'::jsonb,
  false,
  true,
  '🧱',
  '#795548',
  'beginner',
  10
),

-- =============================================================================
-- 8. DRY JANUARY / SOBER OCTOBER
-- =============================================================================
(
  'Sober Month',
  'sober-month',
  'Go alcohol-free for a full month. Track your streak, see your savings add up, and watch your sleep, weight, mood, and workout performance improve. Can be activated for any month.',
  30,
  'lifestyle',
  '{
    "tasks": [
      {
        "id": "no_alcohol",
        "label": "No alcohol today",
        "type": "alcohol_free",
        "auto_verify": false,
        "config": {
          "daily_checkin": true,
          "checkin_prompt": "Did you drink alcohol today?"
        }
      }
    ],
    "restart_on_failure": false,
    "scoring": "consistency_percentage",
    "tracking": {
      "savings_calculator": true,
      "savings_config_key": "weekly_alcohol_spend",
      "health_trends": ["sleep_quality", "weight", "mood", "workout_performance"],
      "ai_insights": true
    },
    "partner_mode": true,
    "flexible_start": true
  }'::jsonb,
  false,
  true,
  '🚫🍺',
  '#00BCD4',
  'beginner',
  5
),

-- =============================================================================
-- 9. WHOLE30
-- =============================================================================
(
  'Whole30',
  'whole30',
  'Eliminate sugar, alcohol, grains, legumes, soy, and dairy for 30 days. AI-powered meal compliance checking, scale lockout during the challenge, and a guided Day 31 reintroduction protocol.',
  30,
  'nutrition',
  '{
    "tasks": [
      {
        "id": "compliant_meals",
        "label": "All meals Whole30 compliant",
        "type": "nutrition",
        "auto_verify": true,
        "config": {
          "ai_compliance_check": true,
          "meal_camera_flag": true,
          "compliant_food_filter": true
        }
      },
      {
        "id": "no_alcohol",
        "label": "No alcohol",
        "type": "alcohol_free",
        "auto_verify": false,
        "config": {
          "daily_checkin": true
        }
      }
    ],
    "restart_on_failure": false,
    "elimination_list": ["sugar", "alcohol", "grains", "legumes", "soy", "dairy"],
    "scale_lockout": true,
    "scale_lockout_days": 30,
    "no_recreated_treats": true,
    "reintroduction_guide": {
      "day_31": "Start systematic reintroduction",
      "protocol": "one_group_at_a_time",
      "groups": ["legumes", "non_gluten_grains", "dairy", "gluten_grains"]
    },
    "grocery_list_filter": true,
    "meal_prep_planner": true
  }'::jsonb,
  false,
  true,
  '🥗',
  '#4CAF50',
  'intermediate',
  30
),

-- =============================================================================
-- 10. 10,000 STEPS DAILY CHALLENGE
-- =============================================================================
(
  '10,000 Steps Challenge',
  '10k-steps',
  'Walk 10,000+ steps every day for 30 consecutive days. Automatic step tracking via Apple Health / Google Fit, live dashboard counter, GPS-tracked walks, and couples leaderboard.',
  30,
  'fitness',
  '{
    "tasks": [
      {
        "id": "steps",
        "label": "Walk 10,000+ steps",
        "type": "steps",
        "auto_verify": true,
        "config": {
          "target_steps": 10000,
          "health_kit_sync": true,
          "google_fit_sync": true,
          "live_counter": true,
          "gps_walk_logging": true,
          "auto_log_cardio": true
        }
      }
    ],
    "restart_on_failure": false,
    "scoring": "consistency_percentage",
    "tracking": {
      "distance_calculation": true,
      "calorie_burn": true,
      "monthly_total_target": 300000
    },
    "couples_leaderboard": true,
    "geofence_auto_start": true
  }'::jsonb,
  false,
  true,
  '👟',
  '#607D8B',
  'beginner',
  60
),

-- =============================================================================
-- 11. INTERMITTENT FASTING CHALLENGE
-- =============================================================================
(
  'Intermittent Fasting',
  'intermittent-fasting',
  'Commit to 30 days of structured intermittent fasting. Choose your protocol (16:8, 18:6, 20:4, or 5:2), track your fasting windows with a live timer, and get AI insights on how fasting impacts your energy, mood, and performance.',
  30,
  'nutrition',
  '{
    "tasks": [
      {
        "id": "fasting",
        "label": "Complete today''s fasting window",
        "type": "fasting",
        "auto_verify": true,
        "config": {
          "requires_protocol_selection": true,
          "fasting_timer": true,
          "eating_window_notifications": true,
          "meal_time_validation": true
        }
      }
    ],
    "restart_on_failure": false,
    "fasting_protocols": {
      "16:8": {"fast_hours": 16, "eat_hours": 8},
      "18:6": {"fast_hours": 18, "eat_hours": 6},
      "20:4": {"fast_hours": 20, "eat_hours": 4},
      "5:2": {"normal_days": 5, "restricted_days": 2, "restricted_calories": 500}
    },
    "autophagy_milestones": {
      "12": "Fat burning accelerates",
      "16": "Autophagy begins",
      "18": "Growth hormone increases",
      "24": "Deep autophagy"
    },
    "ai_insights": {
      "correlate_with": ["energy", "mood", "workout_performance"]
    },
    "stack_warning": ["75-hard"],
    "scoring": "consistency_percentage"
  }'::jsonb,
  false,
  true,
  '⏱️',
  '#FF5722',
  'intermediate',
  5
);
