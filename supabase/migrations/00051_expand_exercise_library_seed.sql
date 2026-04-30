-- =============================================================================
-- SEED EXPANSION: Fill coverage gaps in exercise library
-- Adds exercises so every major muscle group has 3+ exercises per common
-- equipment type (barbell, dumbbell, cable, machine, bodyweight, kettlebell, bands).
-- INSERT only — no DELETE or UPDATE of existing exercises.
-- =============================================================================

INSERT INTO exercises (id, name, category, muscle_groups, equipment, difficulty, is_compound, instructions, tips)
VALUES
  -- CHEST — fill gaps: machine, kettlebell, bands, smith_machine
  ('e0000002-0000-0000-0000-000000000001', 'Machine Chest Press',      'chest',     ARRAY['chest','triceps'],                       'machine',      'beginner',     true,  'Sit in machine, press handles forward to full extension, return slowly.', 'Great for beginners — fixed path reduces stabilizer demand.'),
  ('e0000002-0000-0000-0000-000000000002', 'Chest Press (Bands)',      'chest',     ARRAY['chest','triceps'],                       'bands',        'beginner',     true,  'Anchor band behind you at chest height, press forward to full extension.', 'Step forward to increase tension.'),
  ('e0000002-0000-0000-0000-000000000003', 'Kettlebell Floor Press',   'chest',     ARRAY['chest','triceps'],                       'kettlebell',   'intermediate', true,  'Lie on floor, press kettlebells from chest to lockout.', 'Floor limits range to protect shoulders.'),
  ('e0000002-0000-0000-0000-000000000004', 'Smith Machine Bench Press','chest',     ARRAY['chest','triceps','front_delt'],          'smith_machine','beginner',     true,  'Lie on bench under Smith bar, unrack and press to lockout.', 'Good for training to failure safely.'),
  ('e0000002-0000-0000-0000-000000000005', 'Decline Barbell Press',    'chest',     ARRAY['chest','triceps'],                       'barbell',      'intermediate', true,  'Set bench to decline, lower bar to lower chest, press up.', 'Targets lower chest fibers.'),
  ('e0000002-0000-0000-0000-000000000006', 'TRX Push-Up',             'chest',     ARRAY['chest','triceps','core'],                'trx',          'intermediate', true,  'Grip TRX handles, body angled, perform push-up with unstable surface.', 'Core must stay rigid; harder than regular push-up.'),

  -- BACK — fill gaps: dumbbell, machine, kettlebell, bands, smith_machine
  ('e0000002-0000-0000-0000-000000000007', 'Dumbbell Row',             'back',      ARRAY['lats','rhomboids','biceps'],             'dumbbell',     'beginner',     true,  'One knee on bench, row dumbbell to hip, lower controlled.', 'Keep elbow close to body; squeeze at top.'),
  ('e0000002-0000-0000-0000-000000000008', 'Machine Row',              'back',      ARRAY['lats','rhomboids','biceps'],             'machine',      'beginner',     true,  'Sit in machine, pull handles to torso, return slowly.', 'Fixed path lets you focus on mind-muscle connection.'),
  ('e0000002-0000-0000-0000-000000000009', 'Kettlebell Row',           'back',      ARRAY['lats','rhomboids','biceps'],             'kettlebell',   'beginner',     true,  'Same as dumbbell row but with kettlebell — pull to hip from hinged position.', 'The offset center of mass adds grip challenge.'),
  ('e0000002-0000-0000-0000-000000000010', 'Band Pull-Apart',         'back',      ARRAY['rear_delt','rhomboids'],                 'bands',        'beginner',     false, 'Hold band at arm length, pull hands apart squeezing shoulder blades.', 'Great warm-up; use light band for high reps.'),
  ('e0000002-0000-0000-0000-000000000011', 'Smith Machine Row',        'back',      ARRAY['lats','rhomboids','biceps'],             'smith_machine','beginner',     true,  'Hinge at hips under Smith bar, pull bar to lower chest.', 'Fixed path lets you load heavy safely.'),
  ('e0000002-0000-0000-0000-000000000012', 'TRX Row',                 'back',      ARRAY['lats','rhomboids','biceps','core'],      'trx',          'beginner',     true,  'Lean back holding TRX handles, pull chest to hands.', 'Walk feet forward to increase difficulty.'),

  -- SHOULDERS — fill gaps: machine, bodyweight, kettlebell, bands, smith_machine
  ('e0000002-0000-0000-0000-000000000013', 'Machine Shoulder Press',   'shoulders', ARRAY['front_delt','medial_delt','triceps'],    'machine',      'beginner',     true,  'Sit in machine, press handles overhead to lockout.', 'Good starting point before free weights.'),
  ('e0000002-0000-0000-0000-000000000014', 'Pike Push-Up',             'shoulders', ARRAY['front_delt','medial_delt','triceps'],    'bodyweight',   'intermediate', true,  'Hands on floor, hips piked high, lower head toward ground, press up.', 'Progression toward handstand push-up.'),
  ('e0000002-0000-0000-0000-000000000015', 'Kettlebell Press',         'shoulders', ARRAY['front_delt','medial_delt','triceps'],    'kettlebell',   'intermediate', true,  'Clean kettlebell to rack position, press overhead to lockout.', 'Offset load builds core stability.'),
  ('e0000002-0000-0000-0000-000000000016', 'Band Lateral Raise',       'shoulders', ARRAY['medial_delt'],                           'bands',        'beginner',     false, 'Stand on band, raise arms to sides until parallel.', 'Constant tension throughout range.'),
  ('e0000002-0000-0000-0000-000000000017', 'Smith Machine OHP',        'shoulders', ARRAY['front_delt','medial_delt','triceps'],    'smith_machine','beginner',     true,  'Seated under Smith bar, press overhead in fixed path.', 'Allows heavier loads with less stabilizer demand.'),

  -- BICEPS — fill gaps: cable, machine, bodyweight, kettlebell, bands
  ('e0000002-0000-0000-0000-000000000018', 'Cable Curl',               'biceps',    ARRAY['biceps','brachialis'],                   'cable',        'beginner',     false, 'Stand at low pulley, curl handle to shoulder height.', 'Constant tension through full range.'),
  ('e0000002-0000-0000-0000-000000000019', 'Machine Preacher Curl',    'biceps',    ARRAY['biceps'],                                'machine',      'beginner',     false, 'Sit at preacher machine, curl handles to full contraction.', 'Eliminates momentum; pure isolation.'),
  ('e0000002-0000-0000-0000-000000000020', 'Chin-Up',                  'biceps',    ARRAY['biceps','lats'],                         'bodyweight',   'intermediate', true,  'Hang with palms facing you, pull chin over bar.', 'Supinated grip targets biceps more than pull-ups.'),
  ('e0000002-0000-0000-0000-000000000021', 'Kettlebell Curl',          'biceps',    ARRAY['biceps','brachialis'],                   'kettlebell',   'beginner',     false, 'Hold kettlebell by horns or handle, curl to shoulder height.', 'Thicker grip challenges forearms too.'),
  ('e0000002-0000-0000-0000-000000000022', 'Band Curl',                'biceps',    ARRAY['biceps'],                                'bands',        'beginner',     false, 'Stand on band, curl handles to shoulders.', 'Increasing tension at top where biceps are strongest.'),

  -- TRICEPS — fill gaps: dumbbell, machine, bodyweight, kettlebell, bands
  ('e0000002-0000-0000-0000-000000000023', 'Dumbbell Overhead Extension','triceps', ARRAY['triceps'],                               'dumbbell',     'beginner',     false, 'Hold one dumbbell overhead with both hands, lower behind head, extend.', 'Keep elbows pointing forward.'),
  ('e0000002-0000-0000-0000-000000000024', 'Machine Tricep Extension', 'triceps',   ARRAY['triceps'],                               'machine',      'beginner',     false, 'Sit in machine, press handles down to full extension.', 'Fixed path isolates triceps safely.'),
  ('e0000002-0000-0000-0000-000000000025', 'Diamond Push-Up',          'triceps',   ARRAY['triceps','chest'],                       'bodyweight',   'intermediate', true,  'Hands together under chest forming diamond, perform push-up.', 'Harder than standard push-up; great tricep builder.'),
  ('e0000002-0000-0000-0000-000000000026', 'Kettlebell Tricep Extension','triceps', ARRAY['triceps'],                               'kettlebell',   'intermediate', false, 'Hold kettlebell by horns overhead, lower behind head, extend.', 'Offset weight builds stabilizer strength.'),
  ('e0000002-0000-0000-0000-000000000027', 'Band Tricep Pushdown',     'triceps',   ARRAY['triceps'],                               'bands',        'beginner',     false, 'Anchor band overhead, push down to full arm extension.', 'Portable alternative to cable pushdown.'),

  -- LEGS — fill gaps: cable, kettlebell, bands, smith_machine
  ('e0000002-0000-0000-0000-000000000028', 'Cable Pull-Through',       'legs',      ARRAY['glutes','hamstrings'],                   'cable',        'beginner',     true,  'Face away from low pulley, hinge at hips, drive hips forward.', 'Great hip hinge pattern teacher.'),
  ('e0000002-0000-0000-0000-000000000029', 'Goblet Squat',             'legs',      ARRAY['quads','glutes','core'],                 'kettlebell',   'beginner',     true,  'Hold kettlebell at chest, squat deep, drive through heels.', 'Excellent for learning squat form.'),
  ('e0000002-0000-0000-0000-000000000030', 'Banded Squat',             'legs',      ARRAY['quads','glutes'],                        'bands',        'beginner',     true,  'Stand on band, hold at shoulders, squat to parallel.', 'Band adds resistance at top where barbell is easiest.'),
  ('e0000002-0000-0000-0000-000000000031', 'Smith Machine Squat',      'legs',      ARRAY['quads','glutes','hamstrings'],           'smith_machine','beginner',     true,  'Bar on upper back in Smith machine, squat to parallel or below.', 'Fixed path allows heavier loads safely.'),
  ('e0000002-0000-0000-0000-000000000032', 'Walking Lunge',            'legs',      ARRAY['quads','glutes','hamstrings'],           'dumbbell',     'intermediate', true,  'Step forward into lunge, drive through front heel, alternate legs.', 'Great for single-leg strength and balance.'),
  ('e0000002-0000-0000-0000-000000000033', 'TRX Pistol Squat',         'legs',      ARRAY['quads','glutes','core'],                 'trx',          'advanced',     true,  'Hold TRX handles, extend one leg forward, squat on standing leg.', 'TRX provides balance assist for single-leg work.'),

  -- GLUTES — fill gaps: dumbbell, machine, bodyweight, kettlebell, bands
  ('e0000002-0000-0000-0000-000000000034', 'Dumbbell Hip Thrust',      'glutes',    ARRAY['glutes','hamstrings'],                   'dumbbell',     'beginner',     false, 'Upper back on bench, dumbbell on hips, drive hips to ceiling.', 'Squeeze glutes hard at lockout.'),
  ('e0000002-0000-0000-0000-000000000035', 'Hip Abduction Machine',    'glutes',    ARRAY['glutes','hip_abductors'],                'machine',      'beginner',     false, 'Sit in machine, push pads outward against resistance.', 'Control the return; don''t let weights slam.'),
  ('e0000002-0000-0000-0000-000000000036', 'Glute Bridge',             'glutes',    ARRAY['glutes','hamstrings'],                   'bodyweight',   'beginner',     false, 'Lie on back, feet flat, drive hips up squeezing glutes.', 'Hold top position 2-3 seconds.'),
  ('e0000002-0000-0000-0000-000000000037', 'Kettlebell Sumo Deadlift', 'glutes',    ARRAY['glutes','inner_thighs','hamstrings'],    'kettlebell',   'beginner',     true,  'Wide stance, hold kettlebell between legs, stand by driving hips.', 'Push knees out over toes.'),
  ('e0000002-0000-0000-0000-000000000038', 'Banded Hip Thrust',        'glutes',    ARRAY['glutes','hamstrings'],                   'bands',        'beginner',     false, 'Band around knees, back on bench, thrust hips up against band.', 'Band forces you to push knees outward throughout.'),

  -- ABS — fill gaps: dumbbell, machine, kettlebell, bands
  ('e0000002-0000-0000-0000-000000000039', 'Dumbbell Russian Twist',   'abs',       ARRAY['obliques','core'],                       'dumbbell',     'beginner',     false, 'Sit with feet elevated, rotate dumbbell side to side.', 'Keep chest tall; rotate through torso not arms.'),
  ('e0000002-0000-0000-0000-000000000040', 'Ab Crunch Machine',        'abs',       ARRAY['upper_abs','core'],                      'machine',      'beginner',     false, 'Sit in machine, crunch forward against resistance.', 'Exhale and squeeze abs at bottom of crunch.'),
  ('e0000002-0000-0000-0000-000000000041', 'Kettlebell Turkish Get-Up','abs',       ARRAY['core','shoulders','glutes'],             'kettlebell',   'advanced',     true,  'Lie down with kettlebell pressed overhead, stand up while keeping it overhead.', 'Learn each phase slowly before adding weight.'),
  ('e0000002-0000-0000-0000-000000000042', 'Band Pallof Press',        'abs',       ARRAY['core','obliques'],                       'bands',        'beginner',     false, 'Anchor band at chest height, press hands forward resisting rotation.', 'Anti-rotation builds functional core strength.'),
  ('e0000002-0000-0000-0000-000000000043', 'Bicycle Crunch',           'abs',       ARRAY['obliques','upper_abs','lower_abs'],      'bodyweight',   'beginner',     false, 'Lie on back, alternate elbow to opposite knee in pedaling motion.', 'Slow and controlled beats fast and sloppy.'),

  -- CARDIO — fill gaps: kettlebell, bands, bodyweight variety
  ('e0000002-0000-0000-0000-000000000044', 'Sled Push',                'cardio',    ARRAY['cardiovascular','quads','glutes'],        'machine',      'intermediate', true,  'Load sled, push with low body position for prescribed distance.', 'Keep arms locked and drive through legs.'),
  ('e0000002-0000-0000-0000-000000000045', 'Band Sprints',             'cardio',    ARRAY['cardiovascular','quads','glutes'],        'bands',        'intermediate', false, 'Anchor band to waist, sprint against resistance.', 'Builds explosive acceleration.'),
  ('e0000002-0000-0000-0000-000000000046', 'High Knees',               'cardio',    ARRAY['cardiovascular','hip_flexors','core'],    'bodyweight',   'beginner',     false, 'Run in place bringing knees to waist height rapidly.', 'Pump arms; land on balls of feet.'),
  ('e0000002-0000-0000-0000-000000000047', 'Jumping Jack',             'cardio',    ARRAY['cardiovascular','full_body'],             'bodyweight',   'beginner',     false, 'Jump feet out wide while raising arms overhead, return.', 'Classic warm-up; sustained effort builds endurance.')

ON CONFLICT (id) DO NOTHING;
