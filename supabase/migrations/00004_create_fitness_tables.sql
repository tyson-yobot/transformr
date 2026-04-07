CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT CHECK (category IN ('chest','back','shoulders','biceps','triceps','legs','glutes','abs','cardio','compound','olympic','stretching','mobility')),
  muscle_groups TEXT[] NOT NULL,
  equipment TEXT CHECK (equipment IN ('barbell','dumbbell','cable','machine','bodyweight','kettlebell','bands','smith_machine','trx','other')),
  difficulty TEXT CHECK (difficulty IN ('beginner','intermediate','advanced')),
  instructions TEXT,
  tips TEXT,
  common_mistakes TEXT,
  video_url TEXT,
  image_url TEXT,
  is_compound BOOLEAN DEFAULT false,
  is_custom BOOLEAN DEFAULT false,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE weight_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  weight NUMERIC NOT NULL,
  body_fat_percentage NUMERIC,
  photo_front_url TEXT,
  photo_side_url TEXT,
  photo_back_url TEXT,
  ai_body_analysis JSONB,
  notes TEXT,
  logged_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  chest NUMERIC, waist NUMERIC, hips NUMERIC,
  bicep_left NUMERIC, bicep_right NUMERIC,
  thigh_left NUMERIC, thigh_right NUMERIC,
  calf_left NUMERIC, calf_right NUMERIC,
  neck NUMERIC, shoulders NUMERIC,
  forearm_left NUMERIC, forearm_right NUMERIC,
  measured_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE workout_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  day_of_week INTEGER,
  estimated_duration_minutes INTEGER,
  is_shared BOOLEAN DEFAULT false,
  is_ai_generated BOOLEAN DEFAULT false,
  ai_last_adjusted_at TIMESTAMPTZ,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE workout_template_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES workout_templates(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id),
  sort_order INTEGER NOT NULL,
  target_sets INTEGER,
  target_reps TEXT,
  target_weight NUMERIC,
  target_rpe NUMERIC,
  rest_seconds INTEGER DEFAULT 90,
  superset_group TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  template_id UUID REFERENCES workout_templates(id),
  name TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  total_volume NUMERIC,
  total_sets INTEGER,
  notes TEXT,
  mood_before INTEGER CHECK (mood_before BETWEEN 1 AND 5),
  mood_after INTEGER CHECK (mood_after BETWEEN 1 AND 5),
  energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 5),
  readiness_score INTEGER,
  is_with_partner BOOLEAN DEFAULT false,
  is_live_sync BOOLEAN DEFAULT false,
  partner_session_id UUID,
  spotify_playlist_id TEXT,
  form_check_video_url TEXT,
  ai_form_feedback JSONB,
  mobility_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE workout_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id),
  set_number INTEGER NOT NULL,
  reps INTEGER,
  weight NUMERIC,
  duration_seconds INTEGER,
  distance NUMERIC,
  is_warmup BOOLEAN DEFAULT false,
  is_dropset BOOLEAN DEFAULT false,
  is_failure BOOLEAN DEFAULT false,
  is_personal_record BOOLEAN DEFAULT false,
  rpe NUMERIC,
  ghost_weight NUMERIC,
  ghost_reps INTEGER,
  ghost_beaten BOOLEAN,
  notes TEXT,
  logged_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE personal_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id),
  record_type TEXT CHECK (record_type IN ('max_weight','max_reps','max_volume','max_duration','max_1rm')),
  value NUMERIC NOT NULL,
  previous_record NUMERIC,
  workout_session_id UUID REFERENCES workout_sessions(id),
  achieved_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE live_workout_sync (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES workout_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES profiles(id),
  exercise_name TEXT,
  set_number INTEGER,
  reps INTEGER,
  weight NUMERIC,
  status TEXT CHECK (status IN ('resting','active','completed')),
  synced_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE pain_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  body_part TEXT NOT NULL,
  pain_level INTEGER CHECK (pain_level BETWEEN 1 AND 10),
  pain_type TEXT CHECK (pain_type IN ('sharp','dull','aching','burning','tingling','stiffness')),
  notes TEXT,
  logged_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE mobility_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  target_muscles TEXT[] NOT NULL,
  duration_minutes INTEGER,
  exercises_completed JSONB,
  post_workout_session_id UUID REFERENCES workout_sessions(id),
  completed_at TIMESTAMPTZ DEFAULT now()
);
