-- =============================================================================
-- SEED: Exercise Library + Workout Programs
-- Adds system-shared exercises and workout templates for Strength & Cardio.
-- All templates have is_shared=true so they appear for every user.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. EXERCISES LIBRARY
-- ---------------------------------------------------------------------------

INSERT INTO exercises (id, name, category, muscle_groups, equipment, difficulty, is_compound, instructions, tips)
VALUES
  -- CHEST
  ('e0000001-0000-0000-0000-000000000001', 'Barbell Bench Press',    'chest',     ARRAY['chest','triceps','front_delt'],          'barbell',   'intermediate', true,  'Lie flat, grip shoulder-width, lower to mid-chest, press to lockout.', 'Keep shoulder blades retracted and feet flat.'),
  ('e0000001-0000-0000-0000-000000000002', 'Incline Dumbbell Press', 'chest',     ARRAY['upper_chest','triceps'],                 'dumbbell',  'intermediate', true,  'Set bench 30-45°, press dumbbells from chest level up and in.', 'Control the descent over 2-3 seconds.'),
  ('e0000001-0000-0000-0000-000000000003', 'Cable Flye',             'chest',     ARRAY['chest'],                                 'cable',     'beginner',     false, 'Set cables at chest height, bring handles together in an arc.', 'Slight bend in elbows throughout.'),
  ('e0000001-0000-0000-0000-000000000004', 'Push-Up',                'chest',     ARRAY['chest','triceps','core'],                'bodyweight','beginner',     true,  'Hands shoulder-width, lower chest to floor, press up.', 'Keep body rigid; avoid hip sag.'),
  ('e0000001-0000-0000-0000-000000000005', 'Dips (Chest)',           'chest',     ARRAY['chest','triceps'],                       'bodyweight','intermediate', true,  'Lean forward slightly, descend until upper arms parallel, push up.', 'Lean torso forward to target chest over triceps.'),

  -- BACK
  ('e0000001-0000-0000-0000-000000000006', 'Barbell Row',            'back',      ARRAY['lats','rhomboids','rear_delt','biceps'], 'barbell',   'intermediate', true,  'Hinge at hips ~45°, pull bar to lower ribcage, lower with control.', 'Keep lower back neutral; avoid jerking.'),
  ('e0000001-0000-0000-0000-000000000007', 'Pull-Up',                'back',      ARRAY['lats','biceps','rear_delt'],             'bodyweight','intermediate', true,  'Hang from bar, pull until chin over bar, lower slowly.', 'Initiate with lats, not arms.'),
  ('e0000001-0000-0000-0000-000000000008', 'Lat Pulldown',           'back',      ARRAY['lats','biceps'],                         'cable',     'beginner',     false, 'Pull bar to upper chest with controlled motion.', 'Lean back slightly; squeeze lats at bottom.'),
  ('e0000001-0000-0000-0000-000000000009', 'Seated Cable Row',       'back',      ARRAY['rhomboids','lats','biceps'],             'cable',     'beginner',     false, 'Pull handle to lower sternum, elbows close to sides.', 'Avoid rounding forward; initiate with back.'),
  ('e0000001-0000-0000-0000-000000000010', 'Deadlift',               'back',      ARRAY['hamstrings','glutes','erectors','traps'],'barbell',   'advanced',     true,  'Hip-hinge, grip outside knees, drive hips forward, lock out standing.', 'Brace core throughout; bar stays close to legs.'),

  -- SHOULDERS
  ('e0000001-0000-0000-0000-000000000011', 'Overhead Press',         'shoulders', ARRAY['front_delt','medial_delt','triceps'],    'barbell',   'intermediate', true,  'Press bar from collarbone overhead; lock out arms.', 'Squeeze glutes for spinal stability.'),
  ('e0000001-0000-0000-0000-000000000012', 'Dumbbell Lateral Raise', 'shoulders', ARRAY['medial_delt'],                           'dumbbell',  'beginner',     false, 'Raise dumbbells to side until arms parallel, lower controlled.', 'Slight forward lean and bend in elbows.'),
  ('e0000001-0000-0000-0000-000000000013', 'Face Pull',              'shoulders', ARRAY['rear_delt','external_rotators'],         'cable',     'beginner',     false, 'Pull rope to face, elbows high, hands to ears.', 'Great for shoulder health; do in most sessions.'),
  ('e0000001-0000-0000-0000-000000000014', 'Arnold Press',           'shoulders', ARRAY['front_delt','medial_delt','triceps'],    'dumbbell',  'intermediate', false, 'Start with palms facing you, rotate out as you press up.', 'Full shoulder rotation for complete development.'),

  -- BICEPS
  ('e0000001-0000-0000-0000-000000000015', 'Barbell Curl',           'biceps',    ARRAY['biceps','brachialis'],                   'barbell',   'beginner',     false, 'Stand with arms extended, curl bar to shoulder height.', 'Keep elbows pinned to sides.'),
  ('e0000001-0000-0000-0000-000000000016', 'Hammer Curl',            'biceps',    ARRAY['biceps','brachialis','brachioradialis'], 'dumbbell',  'beginner',     false, 'Neutral grip, curl up keeping thumbs on top.', 'Builds arm thickness and forearms.'),
  ('e0000001-0000-0000-0000-000000000017', 'Incline Dumbbell Curl',  'biceps',    ARRAY['biceps','long_head'],                    'dumbbell',  'intermediate', false, 'Seated on incline bench, arms hang; curl without swinging.', 'Full stretch at bottom for long head activation.'),

  -- TRICEPS
  ('e0000001-0000-0000-0000-000000000018', 'Tricep Pushdown',        'triceps',   ARRAY['triceps'],                               'cable',     'beginner',     false, 'Push rope or bar down to full extension, control back up.', 'Keep elbows fixed at sides.'),
  ('e0000001-0000-0000-0000-000000000019', 'Skull Crusher',          'triceps',   ARRAY['triceps'],                               'barbell',   'intermediate', false, 'Lower bar to forehead on flat bench, extend arms.', 'Keep upper arms vertical throughout.'),
  ('e0000001-0000-0000-0000-000000000020', 'Close-Grip Bench Press', 'triceps',   ARRAY['triceps','chest'],                       'barbell',   'intermediate', true,  'Grip shoulder-width or closer, press focusing on tricep extension.', 'Elbows slightly tucked.'),

  -- LEGS
  ('e0000001-0000-0000-0000-000000000021', 'Barbell Back Squat',     'legs',      ARRAY['quads','glutes','hamstrings','core'],    'barbell',   'intermediate', true,  'Bar on upper back, squat to parallel or below, drive through heels.', 'Knees track over toes; chest stays tall.'),
  ('e0000001-0000-0000-0000-000000000022', 'Romanian Deadlift',      'legs',      ARRAY['hamstrings','glutes','erectors'],        'barbell',   'intermediate', true,  'Hip hinge with soft knees, lower bar to mid-shin, drive hips forward.', 'Feel the stretch in hamstrings; keep bar close.'),
  ('e0000001-0000-0000-0000-000000000023', 'Leg Press',              'legs',      ARRAY['quads','glutes','hamstrings'],           'machine',   'beginner',     true,  'Feet shoulder-width on platform, lower to 90°, press back.', 'Don''t lock knees fully at top.'),
  ('e0000001-0000-0000-0000-000000000024', 'Leg Extension',          'legs',      ARRAY['quads'],                                 'machine',   'beginner',     false, 'Sit in machine, extend legs fully, lower controlled.', 'Pause at top for quad contraction.'),
  ('e0000001-0000-0000-0000-000000000025', 'Leg Curl',               'legs',      ARRAY['hamstrings'],                            'machine',   'beginner',     false, 'Lie face down, curl heels toward glutes, lower slowly.', 'Avoid hip extension; isolate hamstrings.'),
  ('e0000001-0000-0000-0000-000000000026', 'Calf Raise',             'legs',      ARRAY['calves'],                                'machine',   'beginner',     false, 'Stand on edge, rise on toes, lower below platform level.', 'Full range for maximum stretch and contraction.'),
  ('e0000001-0000-0000-0000-000000000027', 'Bulgarian Split Squat',  'legs',      ARRAY['quads','glutes','hip_flexors'],          'dumbbell',  'intermediate', false, 'Rear foot elevated, front foot forward, lower until knee near floor.', 'Keep torso upright; front heel flat.'),
  ('e0000001-0000-0000-0000-000000000028', 'Hip Thrust',             'glutes',    ARRAY['glutes','hamstrings'],                   'barbell',   'intermediate', false, 'Upper back on bench, bar over hips, drive hips to ceiling, squeeze.', 'Full hip extension at top; chin tucked.'),

  -- GLUTES
  ('e0000001-0000-0000-0000-000000000029', 'Cable Kickback',         'glutes',    ARRAY['glutes'],                                'cable',     'beginner',     false, 'Attach cable to ankle, kick leg back to hip extension.', 'Keep pelvis neutral; avoid arching back.'),
  ('e0000001-0000-0000-0000-000000000030', 'Sumo Deadlift',          'glutes',    ARRAY['glutes','inner_thighs','hamstrings'],    'barbell',   'intermediate', true,  'Wide stance, toes out, grip between legs, pull bar up while spreading floor.', 'Push knees out hard throughout.'),

  -- ABS / CORE
  ('e0000001-0000-0000-0000-000000000031', 'Plank',                  'abs',       ARRAY['core','shoulders'],                      'bodyweight','beginner',     false, 'Forearms on floor, body rigid from head to heels, hold.', 'Don''t let hips sag or pike.'),
  ('e0000001-0000-0000-0000-000000000032', 'Hanging Leg Raise',      'abs',       ARRAY['lower_abs','hip_flexors'],               'bodyweight','intermediate', false, 'Hang from bar, raise legs to horizontal or above.', 'Control descent; avoid swinging.'),
  ('e0000001-0000-0000-0000-000000000033', 'Cable Crunch',           'abs',       ARRAY['upper_abs'],                             'cable',     'beginner',     false, 'Kneel at cable, pull rope down crunching abs.', 'Exhale and squeeze abs at bottom.'),
  ('e0000001-0000-0000-0000-000000000034', 'Ab Wheel Rollout',       'abs',       ARRAY['core','lats'],                           'other',     'intermediate', false, 'Roll wheel out from knees until arms extended, pull back.', 'Keep hips low; never let lower back drop.'),

  -- CARDIO EXERCISES
  ('e0000001-0000-0000-0000-000000000035', 'Treadmill Run',          'cardio',    ARRAY['cardiovascular','legs'],                 'machine',   'beginner',     false, 'Set pace for target heart rate zone; maintain steady effort.', 'Stay in Zone 2 (conversational pace) for aerobic base.'),
  ('e0000001-0000-0000-0000-000000000036', 'Treadmill Intervals',    'cardio',    ARRAY['cardiovascular','legs'],                 'machine',   'intermediate', false, 'Alternate 1 min sprint / 2 min walk for prescribed rounds.', 'Push near max effort on sprint intervals.'),
  ('e0000001-0000-0000-0000-000000000037', 'Stationary Bike',        'cardio',    ARRAY['cardiovascular','legs'],                 'machine',   'beginner',     false, 'Pedal at target RPM and resistance for prescribed duration.', 'Low impact; great for active recovery.'),
  ('e0000001-0000-0000-0000-000000000038', 'Rowing Machine',         'cardio',    ARRAY['cardiovascular','back','legs'],          'machine',   'intermediate', true,  'Legs drive, hips hinge back, then arms pull; reverse order to return.', 'Power comes from legs (60%), not arms.'),
  ('e0000001-0000-0000-0000-000000000039', 'Jump Rope',              'cardio',    ARRAY['cardiovascular','calves','shoulders'],   'other',     'beginner',     false, 'Small jumps, wrists rotate rope; land softly on balls of feet.', 'Consistent rhythm over speed for endurance.'),
  ('e0000001-0000-0000-0000-000000000040', 'Box Jump',               'cardio',    ARRAY['cardiovascular','quads','glutes'],       'other',     'intermediate', true,  'Quarter squat, swing arms, explode onto box, land softly, step down.', 'Prioritize landing softly over height.'),
  ('e0000001-0000-0000-0000-000000000041', 'Burpee',                 'cardio',    ARRAY['cardiovascular','chest','core','legs'],  'bodyweight','intermediate', true,  'Drop to push-up, press up, jump feet in, jump up with arm raise.', 'Scale by stepping feet in/out.'),
  ('e0000001-0000-0000-0000-000000000042', 'Mountain Climber',       'cardio',    ARRAY['cardiovascular','core','hip_flexors'],   'bodyweight','beginner',     false, 'Plank position, drive alternating knees toward chest rapidly.', 'Keep hips level; don''t bounce.'),
  ('e0000001-0000-0000-0000-000000000043', 'Kettlebell Swing',       'cardio',    ARRAY['cardiovascular','glutes','hamstrings'],  'kettlebell','intermediate', true,  'Hip hinge, swing KB back between legs, drive hips forward to swing it to shoulder height.', 'Power from hips, not arms.'),
  ('e0000001-0000-0000-0000-000000000044', 'Battle Ropes',           'cardio',    ARRAY['cardiovascular','shoulders','core'],     'other',     'intermediate', false, 'Alternate or simultaneous arm waves for prescribed duration.', 'Stay low; squat position for lower body involvement.'),
  ('e0000001-0000-0000-0000-000000000045', 'Assault Bike',           'cardio',    ARRAY['cardiovascular','full_body'],            'machine',   'advanced',     true,  'Drive with arms and legs simultaneously; push the pace.', 'Brutal but effective — all-out efforts are short.'),
  ('e0000001-0000-0000-0000-000000000046', 'Stair Climber',          'cardio',    ARRAY['cardiovascular','glutes','legs'],        'machine',   'beginner',     false, 'Set moderate pace, step fully onto each stair.', 'Hold rails lightly for balance only, not to support weight.'),
  ('e0000001-0000-0000-0000-000000000047', 'Outdoor Run',            'cardio',    ARRAY['cardiovascular','legs'],                 'other',     'beginner',     false, 'Run at conversational pace outdoors; track distance via phone.', 'Build weekly mileage no more than 10% per week.'),
  ('e0000001-0000-0000-0000-000000000048', 'Sprint (400m)',          'cardio',    ARRAY['cardiovascular','legs'],                 'other',     'advanced',     false, 'Full effort sprint for 400 meters; rest 2-3 min between reps.', 'Drive knees high; lean forward at start.'),

  -- OLYMPIC / COMPOUND
  ('e0000001-0000-0000-0000-000000000049', 'Power Clean',            'olympic',   ARRAY['full_body','traps','glutes'],            'barbell',   'advanced',     true,  'Explosive pull from floor, triple extension, catch in front rack.', 'Learn from power position first.'),
  ('e0000001-0000-0000-0000-000000000050', 'Thruster',               'compound',  ARRAY['full_body','shoulders','quads'],         'barbell',   'intermediate', true,  'Front squat then push press in one fluid movement.', 'Use leg drive to initiate press.'),

  -- MOBILITY / STRETCHING
  ('e0000001-0000-0000-0000-000000000051', 'Hip Flexor Stretch',     'stretching',ARRAY['hip_flexors'],                           'bodyweight','beginner',     false, 'Kneeling lunge position, push hips forward, hold 30-60s each side.', 'Brace core to prevent back arch.'),
  ('e0000001-0000-0000-0000-000000000052', 'Thoracic Rotation',      'mobility',  ARRAY['thoracic_spine','lats'],                 'bodyweight','beginner',     false, 'Kneeling, place hand behind head, rotate elbow toward ceiling.', 'Exhale as you rotate to increase range.'),
  ('e0000001-0000-0000-0000-000000000053', 'World's Greatest Stretch','mobility', ARRAY['hip_flexors','thoracic_spine','hamstrings'],'bodyweight','beginner',  false, 'Lunge forward, place hand inside foot, rotate arm up.', 'Move slowly through each position.'),
  ('e0000001-0000-0000-0000-000000000054', 'Foam Roll Quads',        'mobility',  ARRAY['quads'],                                 'other',     'beginner',     false, 'Lie face down with foam roller under quads, roll slowly.', 'Pause on tight spots for 30 seconds.')
ON CONFLICT (id) DO NOTHING;


-- ---------------------------------------------------------------------------
-- 2. WORKOUT TEMPLATES (PROGRAMS)
-- is_shared=true means all users see them; user_id=null = system programs
-- ---------------------------------------------------------------------------

INSERT INTO workout_templates (id, user_id, name, description, category, day_of_week, estimated_duration_minutes, is_shared, is_ai_generated, sort_order)
VALUES
  -- PUSH / PULL / LEGS (6-day)
  ('p0000001-0000-0000-0000-000000000001', NULL, 'PPL — Push Day',         'Chest, shoulders, and triceps volume session.',          'strength', 1, 60, true, false, 10),
  ('p0000001-0000-0000-0000-000000000002', NULL, 'PPL — Pull Day',         'Back and biceps focus with heavy rowing.',                'strength', 2, 60, true, false, 11),
  ('p0000001-0000-0000-0000-000000000003', NULL, 'PPL — Leg Day',          'Quads, hamstrings, and glutes compound work.',            'strength', 3, 65, true, false, 12),
  ('p0000001-0000-0000-0000-000000000004', NULL, 'PPL — Push Day 2',       'Second push session with more dumbbell volume.',          'strength', 4, 60, true, false, 13),
  ('p0000001-0000-0000-0000-000000000005', NULL, 'PPL — Pull Day 2',       'Second pull session with cable and isolation work.',      'strength', 5, 55, true, false, 14),
  ('p0000001-0000-0000-0000-000000000006', NULL, 'PPL — Leg Day 2',        'Second leg session focusing on posterior chain.',         'strength', 6, 60, true, false, 15),

  -- UPPER / LOWER (4-day)
  ('p0000001-0000-0000-0000-000000000007', NULL, 'Upper Lower — Upper A',  'Strength-focused upper body with bench and row.',         'strength', 1, 55, true, false, 20),
  ('p0000001-0000-0000-0000-000000000008', NULL, 'Upper Lower — Lower A',  'Squat-dominant lower body session.',                     'strength', 2, 60, true, false, 21),
  ('p0000001-0000-0000-0000-000000000009', NULL, 'Upper Lower — Upper B',  'Hypertrophy-focused upper body with OHP and cables.',     'strength', 4, 55, true, false, 22),
  ('p0000001-0000-0000-0000-000000000010', NULL, 'Upper Lower — Lower B',  'Deadlift-dominant lower body session.',                  'strength', 5, 60, true, false, 23),

  -- FULL BODY (3-day)
  ('p0000001-0000-0000-0000-000000000011', NULL, 'Full Body A',            'Compound movement session — squat, press, row.',         'strength', 1, 50, true, false, 30),
  ('p0000001-0000-0000-0000-000000000012', NULL, 'Full Body B',            'Compound movement session — deadlift, OHP, pull-up.',    'strength', 3, 50, true, false, 31),
  ('p0000001-0000-0000-0000-000000000013', NULL, 'Full Body C',            'Compound + isolation session — squat, press, accessories.','strength', 5, 55, true, false, 32),

  -- CARDIO PROGRAMS
  ('p0000001-0000-0000-0000-000000000020', NULL, 'HIIT — Tabata Intervals',    '8 rounds of 20s work / 10s rest per exercise. Maximum effort.',        'cardio', NULL, 25, true, false, 50),
  ('p0000001-0000-0000-0000-000000000021', NULL, 'HIIT — Circuit Training',    '5 exercises back-to-back for 4 rounds. Minimal rest between exercises.','cardio', NULL, 35, true, false, 51),
  ('p0000001-0000-0000-0000-000000000022', NULL, 'Zone 2 Cardio — 40 Min',    'Low-intensity steady-state cardio at conversational pace.',             'cardio', NULL, 42, true, false, 52),
  ('p0000001-0000-0000-0000-000000000023', NULL, 'Zone 2 Cardio — 60 Min',    'Extended aerobic base building session. Heart rate 120-140 BPM.',      'cardio', NULL, 62, true, false, 53),
  ('p0000001-0000-0000-0000-000000000024', NULL, 'Rowing HIIT',               '500m hard / 500m easy for 5 rounds on the rower.',                     'cardio', NULL, 30, true, false, 54),
  ('p0000001-0000-0000-0000-000000000025', NULL, 'Track Sprints — 400m',      '6 × 400m sprints with 90s rest between. Build speed and VO2 max.',     'cardio', NULL, 45, true, false, 55),
  ('p0000001-0000-0000-0000-000000000026', NULL, 'Assault Bike Conditioning', '10 × 10 sec all-out / 50 sec recovery. Metabolic conditioning.',       'cardio', NULL, 20, true, false, 56),
  ('p0000001-0000-0000-0000-000000000027', NULL, 'Jump Rope & Core',          'Jump rope intervals paired with core work for total conditioning.',     'cardio', NULL, 30, true, false, 57),
  ('p0000001-0000-0000-0000-000000000028', NULL, 'Stairmaster Steady-State',  '45 minutes on the stair climber. Aerobic endurance builder.',          'cardio', NULL, 47, true, false, 58),

  -- STRENGTH SPECIALIZATIONS
  ('p0000001-0000-0000-0000-000000000030', NULL, 'Glute Focus Day',           'Dedicated glute training — hip thrusts, split squats, cable work.',     'strength', NULL, 50, true, false, 70),
  ('p0000001-0000-0000-0000-000000000031', NULL, 'Arm Day',                   'Biceps and triceps specialization for hypertrophy.',                    'strength', NULL, 45, true, false, 71),
  ('p0000001-0000-0000-0000-000000000032', NULL, 'Shoulder & Traps Day',      'Overhead pressing + lateral raises + face pulls.',                      'strength', NULL, 50, true, false, 72),
  ('p0000001-0000-0000-0000-000000000033', NULL, 'Deadlift Power Session',    'Heavy deadlift + accessory pulling work.',                              'strength', NULL, 60, true, false, 73),

  -- BEGINNER PROGRAMS
  ('p0000001-0000-0000-0000-000000000040', NULL, 'Beginner Full Body — Day 1','Intro to compound lifts. Light weight, perfect form.',                  'strength', 1, 45, true, false, 80),
  ('p0000001-0000-0000-0000-000000000041', NULL, 'Beginner Full Body — Day 2','Second full body session with different movement patterns.',             'strength', 3, 45, true, false, 81),
  ('p0000001-0000-0000-0000-000000000042', NULL, 'Beginner Full Body — Day 3','Third session completing the beginner week.',                            'strength', 5, 45, true, false, 82),
  ('p0000001-0000-0000-0000-000000000043', NULL, 'Couch to 5K — Week 1',      'Run 1 min / walk 2 min × 8 rounds. 3x per week.',                      'cardio',   NULL, 30, true, false, 90),
  ('p0000001-0000-0000-0000-000000000044', NULL, 'Couch to 5K — Week 3',      'Run 3 min / walk 1.5 min × 5 rounds.',                                 'cardio',   NULL, 28, true, false, 91),
  ('p0000001-0000-0000-0000-000000000045', NULL, 'Couch to 5K — Week 5',      'Run 5 min / walk 3 min × 3 rounds.',                                   'cardio',   NULL, 30, true, false, 92),
  ('p0000001-0000-0000-0000-000000000046', NULL, 'Couch to 5K — Week 8',      'Continuous 30-min run — you''ve made it!',                             'cardio',   NULL, 32, true, false, 93),

  -- HYBRID
  ('p0000001-0000-0000-0000-000000000050', NULL, 'Strength + Cardio Finisher', 'Strength work followed by a 15-min HIIT finisher.',                   'hybrid',   NULL, 65, true, false, 100),
  ('p0000001-0000-0000-0000-000000000051', NULL, 'Active Recovery',            'Low intensity — bike, band work, foam rolling, mobility.',             'recovery', NULL, 35, true, false, 101)

ON CONFLICT (id) DO NOTHING;


-- ---------------------------------------------------------------------------
-- 3. WORKOUT TEMPLATE EXERCISES
-- ---------------------------------------------------------------------------

-- PPL Push Day 1
INSERT INTO workout_template_exercises (template_id, exercise_id, sort_order, target_sets, target_reps, rest_seconds)
VALUES
  ('p0000001-0000-0000-0000-000000000001','e0000001-0000-0000-0000-000000000001', 1, 4, '6-8',  180),
  ('p0000001-0000-0000-0000-000000000001','e0000001-0000-0000-0000-000000000002', 2, 3, '10-12', 90),
  ('p0000001-0000-0000-0000-000000000001','e0000001-0000-0000-0000-000000000011', 3, 4, '6-8',  180),
  ('p0000001-0000-0000-0000-000000000001','e0000001-0000-0000-0000-000000000012', 4, 3, '12-15', 60),
  ('p0000001-0000-0000-0000-000000000001','e0000001-0000-0000-0000-000000000013', 5, 3, '15-20', 60),
  ('p0000001-0000-0000-0000-000000000001','e0000001-0000-0000-0000-000000000018', 6, 3, '12-15', 60),
  ('p0000001-0000-0000-0000-000000000001','e0000001-0000-0000-0000-000000000003', 7, 3, '12-15', 60)
ON CONFLICT DO NOTHING;

-- PPL Pull Day 1
INSERT INTO workout_template_exercises (template_id, exercise_id, sort_order, target_sets, target_reps, rest_seconds)
VALUES
  ('p0000001-0000-0000-0000-000000000002','e0000001-0000-0000-0000-000000000006', 1, 4, '6-8',  180),
  ('p0000001-0000-0000-0000-000000000002','e0000001-0000-0000-0000-000000000007', 2, 3, '8-10',  90),
  ('p0000001-0000-0000-0000-000000000002','e0000001-0000-0000-0000-000000000009', 3, 3, '10-12', 90),
  ('p0000001-0000-0000-0000-000000000002','e0000001-0000-0000-0000-000000000008', 4, 3, '10-12', 90),
  ('p0000001-0000-0000-0000-000000000002','e0000001-0000-0000-0000-000000000015', 5, 3, '10-12', 60),
  ('p0000001-0000-0000-0000-000000000002','e0000001-0000-0000-0000-000000000016', 6, 3, '12-15', 60),
  ('p0000001-0000-0000-0000-000000000002','e0000001-0000-0000-0000-000000000013', 7, 3, '15-20', 60)
ON CONFLICT DO NOTHING;

-- PPL Leg Day 1
INSERT INTO workout_template_exercises (template_id, exercise_id, sort_order, target_sets, target_reps, rest_seconds)
VALUES
  ('p0000001-0000-0000-0000-000000000003','e0000001-0000-0000-0000-000000000021', 1, 4, '6-8',  240),
  ('p0000001-0000-0000-0000-000000000003','e0000001-0000-0000-0000-000000000022', 2, 3, '8-10',  90),
  ('p0000001-0000-0000-0000-000000000003','e0000001-0000-0000-0000-000000000023', 3, 3, '10-12', 90),
  ('p0000001-0000-0000-0000-000000000003','e0000001-0000-0000-0000-000000000027', 4, 3, '12',    90),
  ('p0000001-0000-0000-0000-000000000003','e0000001-0000-0000-0000-000000000024', 5, 3, '15',    60),
  ('p0000001-0000-0000-0000-000000000003','e0000001-0000-0000-0000-000000000025', 6, 3, '12-15', 60),
  ('p0000001-0000-0000-0000-000000000003','e0000001-0000-0000-0000-000000000026', 7, 4, '15-20', 60)
ON CONFLICT DO NOTHING;

-- PPL Push Day 2
INSERT INTO workout_template_exercises (template_id, exercise_id, sort_order, target_sets, target_reps, rest_seconds)
VALUES
  ('p0000001-0000-0000-0000-000000000004','e0000001-0000-0000-0000-000000000002', 1, 4, '8-10', 120),
  ('p0000001-0000-0000-0000-000000000004','e0000001-0000-0000-0000-000000000005', 2, 3, '10-12', 90),
  ('p0000001-0000-0000-0000-000000000004','e0000001-0000-0000-0000-000000000014', 3, 3, '10-12', 90),
  ('p0000001-0000-0000-0000-000000000004','e0000001-0000-0000-0000-000000000012', 4, 4, '15-20', 60),
  ('p0000001-0000-0000-0000-000000000004','e0000001-0000-0000-0000-000000000003', 5, 3, '12-15', 60),
  ('p0000001-0000-0000-0000-000000000004','e0000001-0000-0000-0000-000000000020', 6, 3, '10-12', 90),
  ('p0000001-0000-0000-0000-000000000004','e0000001-0000-0000-0000-000000000019', 7, 3, '10-12', 90)
ON CONFLICT DO NOTHING;

-- PPL Pull Day 2
INSERT INTO workout_template_exercises (template_id, exercise_id, sort_order, target_sets, target_reps, rest_seconds)
VALUES
  ('p0000001-0000-0000-0000-000000000005','e0000001-0000-0000-0000-000000000008', 1, 4, '10-12', 90),
  ('p0000001-0000-0000-0000-000000000005','e0000001-0000-0000-0000-000000000009', 2, 3, '10-12', 90),
  ('p0000001-0000-0000-0000-000000000005','e0000001-0000-0000-0000-000000000006', 3, 3, '8-10',  120),
  ('p0000001-0000-0000-0000-000000000005','e0000001-0000-0000-0000-000000000017', 4, 3, '12',    60),
  ('p0000001-0000-0000-0000-000000000005','e0000001-0000-0000-0000-000000000016', 5, 3, '12-15', 60),
  ('p0000001-0000-0000-0000-000000000005','e0000001-0000-0000-0000-000000000013', 6, 3, '15-20', 60)
ON CONFLICT DO NOTHING;

-- PPL Leg Day 2
INSERT INTO workout_template_exercises (template_id, exercise_id, sort_order, target_sets, target_reps, rest_seconds)
VALUES
  ('p0000001-0000-0000-0000-000000000006','e0000001-0000-0000-0000-000000000010', 1, 4, '4-5',  300),
  ('p0000001-0000-0000-0000-000000000006','e0000001-0000-0000-0000-000000000022', 2, 4, '8-10',  90),
  ('p0000001-0000-0000-0000-000000000006','e0000001-0000-0000-0000-000000000028', 3, 4, '10-12', 90),
  ('p0000001-0000-0000-0000-000000000006','e0000001-0000-0000-0000-000000000029', 4, 3, '15',    60),
  ('p0000001-0000-0000-0000-000000000006','e0000001-0000-0000-0000-000000000025', 5, 3, '12-15', 60),
  ('p0000001-0000-0000-0000-000000000006','e0000001-0000-0000-0000-000000000026', 6, 3, '20',    60)
ON CONFLICT DO NOTHING;

-- Upper Lower — Upper A
INSERT INTO workout_template_exercises (template_id, exercise_id, sort_order, target_sets, target_reps, rest_seconds)
VALUES
  ('p0000001-0000-0000-0000-000000000007','e0000001-0000-0000-0000-000000000001', 1, 4, '5',   180),
  ('p0000001-0000-0000-0000-000000000007','e0000001-0000-0000-0000-000000000006', 2, 4, '5',   180),
  ('p0000001-0000-0000-0000-000000000007','e0000001-0000-0000-0000-000000000011', 3, 3, '8',   120),
  ('p0000001-0000-0000-0000-000000000007','e0000001-0000-0000-0000-000000000007', 4, 3, '8',   120),
  ('p0000001-0000-0000-0000-000000000007','e0000001-0000-0000-0000-000000000012', 5, 3, '12',   60),
  ('p0000001-0000-0000-0000-000000000007','e0000001-0000-0000-0000-000000000018', 6, 3, '12',   60)
ON CONFLICT DO NOTHING;

-- Upper Lower — Lower A
INSERT INTO workout_template_exercises (template_id, exercise_id, sort_order, target_sets, target_reps, rest_seconds)
VALUES
  ('p0000001-0000-0000-0000-000000000008','e0000001-0000-0000-0000-000000000021', 1, 4, '5',   300),
  ('p0000001-0000-0000-0000-000000000008','e0000001-0000-0000-0000-000000000022', 2, 3, '8',   120),
  ('p0000001-0000-0000-0000-000000000008','e0000001-0000-0000-0000-000000000023', 3, 3, '10',  120),
  ('p0000001-0000-0000-0000-000000000008','e0000001-0000-0000-0000-000000000027', 4, 3, '10',   90),
  ('p0000001-0000-0000-0000-000000000008','e0000001-0000-0000-0000-000000000026', 5, 4, '15',   60)
ON CONFLICT DO NOTHING;

-- Upper Lower — Upper B
INSERT INTO workout_template_exercises (template_id, exercise_id, sort_order, target_sets, target_reps, rest_seconds)
VALUES
  ('p0000001-0000-0000-0000-000000000009','e0000001-0000-0000-0000-000000000002', 1, 4, '10-12', 90),
  ('p0000001-0000-0000-0000-000000000009','e0000001-0000-0000-0000-000000000009', 2, 4, '10-12', 90),
  ('p0000001-0000-0000-0000-000000000009','e0000001-0000-0000-0000-000000000014', 3, 3, '10-12', 90),
  ('p0000001-0000-0000-0000-000000000009','e0000001-0000-0000-0000-000000000008', 4, 3, '10-12', 90),
  ('p0000001-0000-0000-0000-000000000009','e0000001-0000-0000-0000-000000000003', 5, 3, '12-15', 60),
  ('p0000001-0000-0000-0000-000000000009','e0000001-0000-0000-0000-000000000015', 6, 3, '12',    60),
  ('p0000001-0000-0000-0000-000000000009','e0000001-0000-0000-0000-000000000019', 7, 3, '12',    60)
ON CONFLICT DO NOTHING;

-- Upper Lower — Lower B
INSERT INTO workout_template_exercises (template_id, exercise_id, sort_order, target_sets, target_reps, rest_seconds)
VALUES
  ('p0000001-0000-0000-0000-000000000010','e0000001-0000-0000-0000-000000000010', 1, 4, '4-5',   300),
  ('p0000001-0000-0000-0000-000000000010','e0000001-0000-0000-0000-000000000028', 2, 3, '10-12',  90),
  ('p0000001-0000-0000-0000-000000000010','e0000001-0000-0000-0000-000000000030', 3, 3, '8',      120),
  ('p0000001-0000-0000-0000-000000000010','e0000001-0000-0000-0000-000000000025', 4, 3, '12-15',  60),
  ('p0000001-0000-0000-0000-000000000010','e0000001-0000-0000-0000-000000000024', 5, 3, '15',     60),
  ('p0000001-0000-0000-0000-000000000010','e0000001-0000-0000-0000-000000000026', 6, 4, '15-20',  60)
ON CONFLICT DO NOTHING;

-- Full Body A
INSERT INTO workout_template_exercises (template_id, exercise_id, sort_order, target_sets, target_reps, rest_seconds)
VALUES
  ('p0000001-0000-0000-0000-000000000011','e0000001-0000-0000-0000-000000000021', 1, 3, '5',    180),
  ('p0000001-0000-0000-0000-000000000011','e0000001-0000-0000-0000-000000000001', 2, 3, '5',    180),
  ('p0000001-0000-0000-0000-000000000011','e0000001-0000-0000-0000-000000000006', 3, 3, '5',    180),
  ('p0000001-0000-0000-0000-000000000011','e0000001-0000-0000-0000-000000000031', 4, 3, '60s',   60),
  ('p0000001-0000-0000-0000-000000000011','e0000001-0000-0000-0000-000000000026', 5, 3, '15',    60)
ON CONFLICT DO NOTHING;

-- Full Body B
INSERT INTO workout_template_exercises (template_id, exercise_id, sort_order, target_sets, target_reps, rest_seconds)
VALUES
  ('p0000001-0000-0000-0000-000000000012','e0000001-0000-0000-0000-000000000010', 1, 3, '5',    300),
  ('p0000001-0000-0000-0000-000000000012','e0000001-0000-0000-0000-000000000011', 2, 3, '5',    180),
  ('p0000001-0000-0000-0000-000000000012','e0000001-0000-0000-0000-000000000007', 3, 3, 'AMRAP', 180),
  ('p0000001-0000-0000-0000-000000000012','e0000001-0000-0000-0000-000000000033', 4, 3, '12',    60),
  ('p0000001-0000-0000-0000-000000000012','e0000001-0000-0000-0000-000000000013', 5, 3, '15',    60)
ON CONFLICT DO NOTHING;

-- Full Body C
INSERT INTO workout_template_exercises (template_id, exercise_id, sort_order, target_sets, target_reps, rest_seconds)
VALUES
  ('p0000001-0000-0000-0000-000000000013','e0000001-0000-0000-0000-000000000021', 1, 3, '8-10',  90),
  ('p0000001-0000-0000-0000-000000000013','e0000001-0000-0000-0000-000000000002', 2, 3, '10-12', 90),
  ('p0000001-0000-0000-0000-000000000013','e0000001-0000-0000-0000-000000000009', 3, 3, '10-12', 90),
  ('p0000001-0000-0000-0000-000000000013','e0000001-0000-0000-0000-000000000012', 4, 3, '12-15', 60),
  ('p0000001-0000-0000-0000-000000000013','e0000001-0000-0000-0000-000000000016', 5, 3, '12',    60),
  ('p0000001-0000-0000-0000-000000000013','e0000001-0000-0000-0000-000000000018', 6, 3, '12-15', 60)
ON CONFLICT DO NOTHING;

-- HIIT Tabata
INSERT INTO workout_template_exercises (template_id, exercise_id, sort_order, target_sets, target_reps, rest_seconds)
VALUES
  ('p0000001-0000-0000-0000-000000000020','e0000001-0000-0000-0000-000000000041', 1, 8, '20s on / 10s off', 10),
  ('p0000001-0000-0000-0000-000000000020','e0000001-0000-0000-0000-000000000042', 2, 8, '20s on / 10s off', 10),
  ('p0000001-0000-0000-0000-000000000020','e0000001-0000-0000-0000-000000000040', 3, 8, '20s on / 10s off', 10),
  ('p0000001-0000-0000-0000-000000000020','e0000001-0000-0000-0000-000000000039', 4, 8, '20s on / 10s off', 10)
ON CONFLICT DO NOTHING;

-- HIIT Circuit Training
INSERT INTO workout_template_exercises (template_id, exercise_id, sort_order, target_sets, target_reps, rest_seconds)
VALUES
  ('p0000001-0000-0000-0000-000000000021','e0000001-0000-0000-0000-000000000041', 1, 4, '45s',  15),
  ('p0000001-0000-0000-0000-000000000021','e0000001-0000-0000-0000-000000000043', 2, 4, '45s',  15),
  ('p0000001-0000-0000-0000-000000000021','e0000001-0000-0000-0000-000000000040', 3, 4, '45s',  15),
  ('p0000001-0000-0000-0000-000000000021','e0000001-0000-0000-0000-000000000042', 4, 4, '45s',  15),
  ('p0000001-0000-0000-0000-000000000021','e0000001-0000-0000-0000-000000000044', 5, 4, '45s', 120)
ON CONFLICT DO NOTHING;

-- Zone 2 Cardio 40 min
INSERT INTO workout_template_exercises (template_id, exercise_id, sort_order, target_sets, target_reps, rest_seconds)
VALUES
  ('p0000001-0000-0000-0000-000000000022','e0000001-0000-0000-0000-000000000035', 1, 1, '40 min',  0)
ON CONFLICT DO NOTHING;

-- Zone 2 Cardio 60 min
INSERT INTO workout_template_exercises (template_id, exercise_id, sort_order, target_sets, target_reps, rest_seconds)
VALUES
  ('p0000001-0000-0000-0000-000000000023','e0000001-0000-0000-0000-000000000047', 1, 1, '60 min',  0)
ON CONFLICT DO NOTHING;

-- Rowing HIIT
INSERT INTO workout_template_exercises (template_id, exercise_id, sort_order, target_sets, target_reps, rest_seconds)
VALUES
  ('p0000001-0000-0000-0000-000000000024','e0000001-0000-0000-0000-000000000038', 1, 5, '500m hard', 90),
  ('p0000001-0000-0000-0000-000000000024','e0000001-0000-0000-0000-000000000038', 2, 5, '500m easy', 30)
ON CONFLICT DO NOTHING;

-- Track Sprints
INSERT INTO workout_template_exercises (template_id, exercise_id, sort_order, target_sets, target_reps, rest_seconds)
VALUES
  ('p0000001-0000-0000-0000-000000000025','e0000001-0000-0000-0000-000000000048', 1, 6, '400m',  90)
ON CONFLICT DO NOTHING;

-- Assault Bike
INSERT INTO workout_template_exercises (template_id, exercise_id, sort_order, target_sets, target_reps, rest_seconds)
VALUES
  ('p0000001-0000-0000-0000-000000000026','e0000001-0000-0000-0000-000000000045', 1, 10, '10s ALL OUT', 50)
ON CONFLICT DO NOTHING;

-- Jump Rope & Core
INSERT INTO workout_template_exercises (template_id, exercise_id, sort_order, target_sets, target_reps, rest_seconds)
VALUES
  ('p0000001-0000-0000-0000-000000000027','e0000001-0000-0000-0000-000000000039', 1, 6, '1 min',  30),
  ('p0000001-0000-0000-0000-000000000027','e0000001-0000-0000-0000-000000000031', 2, 3, '60s',     0),
  ('p0000001-0000-0000-0000-000000000027','e0000001-0000-0000-0000-000000000032', 3, 3, '15',      0),
  ('p0000001-0000-0000-0000-000000000027','e0000001-0000-0000-0000-000000000034', 4, 3, '10',      0)
ON CONFLICT DO NOTHING;

-- Stairmaster
INSERT INTO workout_template_exercises (template_id, exercise_id, sort_order, target_sets, target_reps, rest_seconds)
VALUES
  ('p0000001-0000-0000-0000-000000000028','e0000001-0000-0000-0000-000000000046', 1, 1, '45 min',  0)
ON CONFLICT DO NOTHING;

-- Glute Day
INSERT INTO workout_template_exercises (template_id, exercise_id, sort_order, target_sets, target_reps, rest_seconds)
VALUES
  ('p0000001-0000-0000-0000-000000000030','e0000001-0000-0000-0000-000000000028', 1, 4, '10-12',  90),
  ('p0000001-0000-0000-0000-000000000030','e0000001-0000-0000-0000-000000000027', 2, 3, '12',      90),
  ('p0000001-0000-0000-0000-000000000030','e0000001-0000-0000-0000-000000000030', 3, 3, '8-10',   120),
  ('p0000001-0000-0000-0000-000000000030','e0000001-0000-0000-0000-000000000029', 4, 3, '15',      60),
  ('p0000001-0000-0000-0000-000000000030','e0000001-0000-0000-0000-000000000026', 5, 3, '20',      60)
ON CONFLICT DO NOTHING;

-- Arm Day
INSERT INTO workout_template_exercises (template_id, exercise_id, sort_order, target_sets, target_reps, rest_seconds)
VALUES
  ('p0000001-0000-0000-0000-000000000031','e0000001-0000-0000-0000-000000000015', 1, 4, '8-10',  90),
  ('p0000001-0000-0000-0000-000000000031','e0000001-0000-0000-0000-000000000019', 2, 4, '8-10',  90),
  ('p0000001-0000-0000-0000-000000000031','e0000001-0000-0000-0000-000000000017', 3, 3, '10-12', 60),
  ('p0000001-0000-0000-0000-000000000031','e0000001-0000-0000-0000-000000000018', 4, 3, '12-15', 60),
  ('p0000001-0000-0000-0000-000000000031','e0000001-0000-0000-0000-000000000016', 5, 3, '12',    60),
  ('p0000001-0000-0000-0000-000000000031','e0000001-0000-0000-0000-000000000020', 6, 3, '10-12', 60)
ON CONFLICT DO NOTHING;

-- Shoulder & Traps
INSERT INTO workout_template_exercises (template_id, exercise_id, sort_order, target_sets, target_reps, rest_seconds)
VALUES
  ('p0000001-0000-0000-0000-000000000032','e0000001-0000-0000-0000-000000000011', 1, 4, '6-8',   180),
  ('p0000001-0000-0000-0000-000000000032','e0000001-0000-0000-0000-000000000014', 2, 3, '10-12',  90),
  ('p0000001-0000-0000-0000-000000000032','e0000001-0000-0000-0000-000000000012', 3, 4, '12-15',  60),
  ('p0000001-0000-0000-0000-000000000032','e0000001-0000-0000-0000-000000000013', 4, 3, '15-20',  60)
ON CONFLICT DO NOTHING;

-- Deadlift Power Session
INSERT INTO workout_template_exercises (template_id, exercise_id, sort_order, target_sets, target_reps, rest_seconds)
VALUES
  ('p0000001-0000-0000-0000-000000000033','e0000001-0000-0000-0000-000000000010', 1, 5, '3-5',   300),
  ('p0000001-0000-0000-0000-000000000033','e0000001-0000-0000-0000-000000000006', 2, 3, '8',     180),
  ('p0000001-0000-0000-0000-000000000033','e0000001-0000-0000-0000-000000000009', 3, 3, '10',     90),
  ('p0000001-0000-0000-0000-000000000033','e0000001-0000-0000-0000-000000000008', 4, 3, '10',     90),
  ('p0000001-0000-0000-0000-000000000033','e0000001-0000-0000-0000-000000000034', 5, 3, '10',     60)
ON CONFLICT DO NOTHING;

-- Beginner Day 1
INSERT INTO workout_template_exercises (template_id, exercise_id, sort_order, target_sets, target_reps, rest_seconds)
VALUES
  ('p0000001-0000-0000-0000-000000000040','e0000001-0000-0000-0000-000000000004', 1, 3, '10',   120),
  ('p0000001-0000-0000-0000-000000000040','e0000001-0000-0000-0000-000000000021', 2, 3, '8',    120),
  ('p0000001-0000-0000-0000-000000000040','e0000001-0000-0000-0000-000000000009', 3, 3, '10',   120),
  ('p0000001-0000-0000-0000-000000000040','e0000001-0000-0000-0000-000000000031', 4, 3, '30s',   60)
ON CONFLICT DO NOTHING;

-- Beginner Day 2
INSERT INTO workout_template_exercises (template_id, exercise_id, sort_order, target_sets, target_reps, rest_seconds)
VALUES
  ('p0000001-0000-0000-0000-000000000041','e0000001-0000-0000-0000-000000000011', 1, 3, '8',    120),
  ('p0000001-0000-0000-0000-000000000041','e0000001-0000-0000-0000-000000000007', 2, 3, '5',    120),
  ('p0000001-0000-0000-0000-000000000041','e0000001-0000-0000-0000-000000000022', 3, 3, '8',    120),
  ('p0000001-0000-0000-0000-000000000041','e0000001-0000-0000-0000-000000000032', 4, 3, '10',    60)
ON CONFLICT DO NOTHING;

-- Beginner Day 3
INSERT INTO workout_template_exercises (template_id, exercise_id, sort_order, target_sets, target_reps, rest_seconds)
VALUES
  ('p0000001-0000-0000-0000-000000000042','e0000001-0000-0000-0000-000000000004', 1, 3, '12',   120),
  ('p0000001-0000-0000-0000-000000000042','e0000001-0000-0000-0000-000000000010', 2, 3, '5',    180),
  ('p0000001-0000-0000-0000-000000000042','e0000001-0000-0000-0000-000000000008', 3, 3, '10',   120),
  ('p0000001-0000-0000-0000-000000000042','e0000001-0000-0000-0000-000000000031', 4, 3, '45s',   60)
ON CONFLICT DO NOTHING;

-- Couch to 5K Week 1
INSERT INTO workout_template_exercises (template_id, exercise_id, sort_order, target_sets, target_reps, rest_seconds)
VALUES
  ('p0000001-0000-0000-0000-000000000043','e0000001-0000-0000-0000-000000000035', 1, 8, '1 min run / 2 min walk', 0)
ON CONFLICT DO NOTHING;

-- Couch to 5K Week 3
INSERT INTO workout_template_exercises (template_id, exercise_id, sort_order, target_sets, target_reps, rest_seconds)
VALUES
  ('p0000001-0000-0000-0000-000000000044','e0000001-0000-0000-0000-000000000047', 1, 5, '3 min run / 1.5 min walk', 0)
ON CONFLICT DO NOTHING;

-- Couch to 5K Week 5
INSERT INTO workout_template_exercises (template_id, exercise_id, sort_order, target_sets, target_reps, rest_seconds)
VALUES
  ('p0000001-0000-0000-0000-000000000045','e0000001-0000-0000-0000-000000000047', 1, 3, '5 min run / 3 min walk', 0)
ON CONFLICT DO NOTHING;

-- Couch to 5K Week 8
INSERT INTO workout_template_exercises (template_id, exercise_id, sort_order, target_sets, target_reps, rest_seconds)
VALUES
  ('p0000001-0000-0000-0000-000000000046','e0000001-0000-0000-0000-000000000047', 1, 1, '30 min continuous run', 0)
ON CONFLICT DO NOTHING;

-- Strength + Cardio Finisher
INSERT INTO workout_template_exercises (template_id, exercise_id, sort_order, target_sets, target_reps, rest_seconds)
VALUES
  ('p0000001-0000-0000-0000-000000000050','e0000001-0000-0000-0000-000000000001', 1, 4, '6-8',   180),
  ('p0000001-0000-0000-0000-000000000050','e0000001-0000-0000-0000-000000000006', 2, 4, '6-8',   180),
  ('p0000001-0000-0000-0000-000000000050','e0000001-0000-0000-0000-000000000041', 3, 4, '45s',    15),
  ('p0000001-0000-0000-0000-000000000050','e0000001-0000-0000-0000-000000000043', 4, 4, '45s',    15),
  ('p0000001-0000-0000-0000-000000000050','e0000001-0000-0000-0000-000000000042', 5, 4, '45s',    60)
ON CONFLICT DO NOTHING;

-- Active Recovery
INSERT INTO workout_template_exercises (template_id, exercise_id, sort_order, target_sets, target_reps, rest_seconds)
VALUES
  ('p0000001-0000-0000-0000-000000000051','e0000001-0000-0000-0000-000000000037', 1, 1, '20 min easy', 0),
  ('p0000001-0000-0000-0000-000000000051','e0000001-0000-0000-0000-000000000054', 2, 1, '5 min',        0),
  ('p0000001-0000-0000-0000-000000000051','e0000001-0000-0000-0000-000000000053', 3, 3, '5 reps/side',  0),
  ('p0000001-0000-0000-0000-000000000051','e0000001-0000-0000-0000-000000000052', 4, 3, '8/side',       0),
  ('p0000001-0000-0000-0000-000000000051','e0000001-0000-0000-0000-000000000051', 5, 2, '60s/side',     0)
ON CONFLICT DO NOTHING;
