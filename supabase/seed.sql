-- ============================================================================
-- TRANSFORMR SEED DATA
-- Comprehensive seed data for exercises, foods, achievements, and templates.
-- Run after all migrations have been applied.
-- ============================================================================

-- ============================================================================
-- 1. EXERCISES (120 exercises across all categories and equipment types)
-- ============================================================================

INSERT INTO exercises (name, category, muscle_groups, equipment, difficulty, instructions, tips, common_mistakes, is_compound, is_custom) VALUES

-- CHEST EXERCISES
('Barbell Bench Press', 'chest', ARRAY['chest','triceps','front_delts'], 'barbell', 'intermediate',
 'Lie on a flat bench with feet flat on the floor. Grip the bar slightly wider than shoulder width. Unrack and lower the bar to mid-chest with control. Press the bar back up to full lockout.',
 'Keep shoulder blades retracted and squeezed together throughout. Drive feet into the floor. Maintain a slight arch in the lower back. Breathe in on the descent, exhale on the press.',
 'Bouncing the bar off the chest. Flaring elbows to 90 degrees. Lifting hips off the bench. Incomplete range of motion. Uneven grip width.', true, false),

('Incline Dumbbell Press', 'chest', ARRAY['upper_chest','triceps','front_delts'], 'dumbbell', 'intermediate',
 'Set bench to 30-45 degree incline. Sit back with a dumbbell in each hand at shoulder level. Press the dumbbells up and slightly inward until arms are extended. Lower with control.',
 'A 30-degree angle targets upper chest best without excessive front delt involvement. Squeeze dumbbells together at the top for peak contraction. Control the negative for 2-3 seconds.',
 'Setting the incline too high turning it into a shoulder press. Letting dumbbells drift too far forward. Losing scapular retraction at the top.', true, false),

('Dumbbell Flyes', 'chest', ARRAY['chest','front_delts'], 'dumbbell', 'intermediate',
 'Lie flat on a bench holding dumbbells above your chest with a slight bend in the elbows. Open your arms wide in an arc motion until you feel a stretch in the chest. Reverse the motion squeezing the chest.',
 'Maintain the same elbow bend throughout the entire movement. Think of hugging a large tree. Go lighter than you think to protect the shoulder joint.',
 'Turning the movement into a press by bending the elbows excessively. Going too heavy and losing control at the bottom. Clanking the dumbbells at the top.', false, false),

('Cable Crossover', 'chest', ARRAY['chest','front_delts'], 'cable', 'intermediate',
 'Set pulleys to the highest position. Stand in the center with a handle in each hand. Step forward slightly with a staggered stance. Bring hands together in a downward arc in front of your hips. Slowly return to the start.',
 'Lean forward slightly from the hips. Cross hands at the bottom for extra contraction. Experiment with pulley heights to target different parts of the chest.',
 'Using too much weight and relying on momentum. Standing too upright. Not getting a full stretch at the top of the movement.', false, false),

('Push-Up', 'chest', ARRAY['chest','triceps','front_delts','core'], 'bodyweight', 'beginner',
 'Start in a high plank position with hands slightly wider than shoulder width. Lower your body until your chest nearly touches the floor. Push back up to the starting position.',
 'Keep your body in a straight line from head to heels. Engage your core throughout. For added difficulty, elevate your feet or add a weighted vest.',
 'Sagging hips or piking the hips up. Flaring elbows straight out to the sides. Not reaching full depth. Looking up instead of keeping a neutral neck.', true, false),

('Decline Barbell Bench Press', 'chest', ARRAY['lower_chest','triceps','front_delts'], 'barbell', 'intermediate',
 'Secure your legs at the end of a decline bench. Grip the bar slightly wider than shoulder width. Unrack and lower the bar to your lower chest. Press back up to lockout.',
 'Use a spotter for safety since you cannot easily bail. The decline angle should be about 15-30 degrees. Focus on squeezing the lower chest.',
 'Using too steep a decline. Not having a spotter. Lowering the bar to the wrong part of the chest.', true, false),

('Machine Chest Press', 'chest', ARRAY['chest','triceps','front_delts'], 'machine', 'beginner',
 'Adjust the seat so the handles are at mid-chest height. Grip the handles and press forward until arms are extended. Return slowly to the starting position.',
 'Great for beginners or as a finisher after free weight work. Focus on squeezing the chest at full extension. Adjust seat height to ensure proper alignment.',
 'Setting the seat too high or low. Using excessive weight with partial range of motion. Letting the weight stack slam between reps.', true, false),

('Dips (Chest Focused)', 'chest', ARRAY['chest','triceps','front_delts'], 'bodyweight', 'intermediate',
 'Grip parallel bars and lift yourself up. Lean forward about 30 degrees. Lower your body until your upper arms are parallel to the floor. Press back up without fully locking out.',
 'The forward lean is what shifts emphasis to the chest. Use a wider grip if available. Add weight with a dip belt once bodyweight becomes easy.',
 'Staying too upright which shifts to triceps. Going too deep and stressing the shoulders. Swinging or using momentum.', true, false),

-- BACK EXERCISES
('Barbell Deadlift', 'back', ARRAY['lower_back','glutes','hamstrings','traps','forearms'], 'barbell', 'advanced',
 'Stand with feet hip-width apart, bar over mid-foot. Hinge at the hips and grip the bar just outside your knees. Brace your core, flatten your back, and drive through the floor to stand up. Reverse the motion to lower.',
 'Think of pushing the floor away rather than pulling the bar up. Keep the bar close to your body throughout. Set your lats by trying to bend the bar around your legs.',
 'Rounding the lower back. Starting with hips too high or too low. Jerking the bar off the floor. Looking up and hyperextending the neck. Hitching the bar up the thighs.', true, false),

('Pull-Up', 'back', ARRAY['lats','biceps','rear_delts','forearms'], 'bodyweight', 'intermediate',
 'Hang from a pull-up bar with an overhand grip slightly wider than shoulder width. Pull yourself up until your chin clears the bar. Lower yourself with control to a full dead hang.',
 'Initiate the movement by depressing and retracting your shoulder blades. Think about driving your elbows down and back. Use a band for assistance if needed.',
 'Kipping or swinging. Not reaching full dead hang at the bottom. Using only arms instead of engaging the back. Craning the neck to get chin over the bar.', true, false),

('Barbell Bent-Over Row', 'back', ARRAY['lats','rhomboids','rear_delts','biceps','lower_back'], 'barbell', 'intermediate',
 'Stand with feet shoulder-width apart. Hinge at the hips until your torso is roughly 45 degrees to the floor. Pull the bar to your lower chest or upper abdomen. Lower with control.',
 'Keep your core braced and back flat throughout. Pull the bar to different heights to shift emphasis: lower for lats, higher for rhomboids and traps. Use straps if grip limits you.',
 'Using too much body English and swinging the weight. Rounding the back. Standing too upright turning it into a shrug. Not pulling to full contraction.', true, false),

('Seated Cable Row', 'back', ARRAY['lats','rhomboids','rear_delts','biceps'], 'cable', 'beginner',
 'Sit at a cable row station with feet on the platform and knees slightly bent. Grab the handle with both hands. Pull the handle to your abdomen while squeezing your shoulder blades together. Return slowly.',
 'Sit tall and avoid rounding forward. Think about pulling your elbows behind you. Pause at full contraction for one second. Try different attachments: V-bar, wide bar, single handles.',
 'Leaning too far back and using momentum. Rounding the shoulders forward on the return. Not achieving full scapular retraction. Pulling with the biceps instead of the back.', true, false),

('Lat Pulldown', 'back', ARRAY['lats','biceps','rear_delts'], 'cable', 'beginner',
 'Sit at a lat pulldown machine and secure your thighs under the pads. Grip the bar wider than shoulder width with an overhand grip. Pull the bar down to your upper chest. Return slowly to full stretch.',
 'Lean back slightly and drive your chest up to meet the bar. Focus on pulling with your elbows, not your hands. Squeeze your lats at the bottom for a one-second hold.',
 'Pulling the bar behind the neck. Leaning too far back. Using momentum by swinging the torso. Gripping too narrow for lat development.', false, false),

('Single-Arm Dumbbell Row', 'back', ARRAY['lats','rhomboids','rear_delts','biceps'], 'dumbbell', 'beginner',
 'Place one knee and hand on a bench for support. With the other hand grab a dumbbell from the floor. Row the dumbbell to your hip while keeping your elbow close to your body. Lower with control.',
 'Drive your elbow toward the ceiling. Rotate your torso slightly at the top for extra range of motion. Keep your supporting arm locked and core braced.',
 'Rotating the torso excessively. Shrugging the shoulder up instead of pulling the elbow back. Using momentum to swing the weight up. Rounding the back.', false, false),

('T-Bar Row', 'back', ARRAY['lats','rhomboids','rear_delts','biceps','lower_back'], 'barbell', 'intermediate',
 'Straddle a landmine barbell with a V-handle placed under the bar. Hinge at the hips and grab the handle. Row the bar to your chest keeping your back flat. Lower under control.',
 'The chest-supported version removes lower back stress if needed. Keep a proud chest throughout. Experiment with different handle widths.',
 'Jerking the weight with momentum. Standing too upright. Rounding the upper back. Not achieving full contraction at the top.', true, false),

('Face Pull', 'back', ARRAY['rear_delts','rhomboids','traps','rotator_cuff'], 'cable', 'beginner',
 'Set a cable pulley to upper chest height with a rope attachment. Grab the rope with both hands palms down. Pull toward your face while separating the rope ends. Externally rotate at the end so your hands are beside your ears.',
 'This is a health exercise as much as a muscle exercise. Go light and focus on the squeeze. Pull to your forehead, not your chest. Hold the end position for 2 seconds.',
 'Going too heavy. Pulling to the chest instead of the face. Not externally rotating. Using body lean to move the weight.', false, false),

('Chin-Up', 'back', ARRAY['lats','biceps','forearms'], 'bodyweight', 'intermediate',
 'Hang from a bar with an underhand (supinated) grip at shoulder width. Pull yourself up until your chin clears the bar. Lower to a dead hang with control.',
 'The underhand grip places more emphasis on the biceps compared to pull-ups. Great as a bicep compound movement. Add weight once you can do 12+ clean reps.',
 'Same as pull-ups: kipping, partial reps, neck craning. Additionally, relying too much on biceps and not engaging lats.', true, false),

-- SHOULDER EXERCISES
('Overhead Press', 'shoulders', ARRAY['front_delts','side_delts','triceps','upper_chest'], 'barbell', 'intermediate',
 'Stand with feet shoulder-width apart. Hold the bar at collarbone height with hands just outside shoulder width. Press the bar overhead until arms are fully locked out. Lower back to the collarbone.',
 'Brace your core and squeeze your glutes to stabilize. Move your head back slightly as the bar passes your face, then push it forward once it clears. The bar should end directly over your mid-foot.',
 'Excessive lean back turning it into an incline press. Pressing the bar forward instead of straight up. Not locking out at the top. Flared elbows.', true, false),

('Lateral Raise', 'shoulders', ARRAY['side_delts'], 'dumbbell', 'beginner',
 'Stand with a dumbbell in each hand at your sides. Raise your arms out to the sides until they are parallel to the floor. Lower slowly under control.',
 'Lead with the elbows, not the hands. A slight forward lean targets the side delt better. Think of pouring water out of a pitcher at the top. Pause at the top for one second.',
 'Shrugging the traps and lifting with the upper traps instead of delts. Swinging the weight. Going too heavy. Raising above parallel and involving the traps.', false, false),

('Rear Delt Fly', 'shoulders', ARRAY['rear_delts','rhomboids'], 'dumbbell', 'beginner',
 'Hinge at the hips with a dumbbell in each hand hanging below your chest. Raise the dumbbells out to the sides in an arc, squeezing your shoulder blades together at the top. Lower with control.',
 'Keep a slight bend in the elbows throughout. Focus on squeezing the rear delts, not the traps. Can also be performed lying face down on an incline bench.',
 'Using momentum by swinging the torso. Rounding the back. Going too heavy. Pulling the dumbbells too far back instead of out to the sides.', false, false),

('Arnold Press', 'shoulders', ARRAY['front_delts','side_delts','triceps'], 'dumbbell', 'intermediate',
 'Sit on a bench with back support. Start with dumbbells at shoulder height, palms facing you. As you press up, rotate your palms to face forward at the top. Reverse the rotation as you lower.',
 'The rotation provides a fuller range of motion for all three deltoid heads. Keep the movement smooth and controlled. Do not rush the rotation.',
 'Rotating too early or too late. Excessive lower back arch. Not completing the full rotation. Pressing the dumbbells too far forward.', true, false),

('Dumbbell Shoulder Press', 'shoulders', ARRAY['front_delts','side_delts','triceps'], 'dumbbell', 'beginner',
 'Sit on a bench with back support holding dumbbells at shoulder height. Press the dumbbells overhead until arms are fully extended. Lower back to shoulder height.',
 'Dumbbells allow a more natural pressing path than barbells. Keep your core tight and back against the pad. Press in a slight arc so the dumbbells nearly touch at the top.',
 'Arching the back excessively. Using leg drive to push the weight up. Not achieving full range of motion. Uneven pressing.', true, false),

('Cable Lateral Raise', 'shoulders', ARRAY['side_delts'], 'cable', 'beginner',
 'Stand sideways to a low cable pulley. Grab the handle with your far hand across your body. Raise your arm out to the side until parallel to the floor. Lower with control.',
 'Cables provide constant tension unlike dumbbells. The cross-body start position adds extra range. Stand far enough from the machine for a full stretch at the bottom.',
 'Leaning away from the cable to use momentum. Lifting above parallel. Shrugging the trap. Using too much weight.', false, false),

('Upright Row', 'shoulders', ARRAY['side_delts','traps','front_delts','biceps'], 'barbell', 'intermediate',
 'Stand holding a barbell with an overhand grip at hip width. Pull the bar up along your body until your elbows reach shoulder height. Lower with control.',
 'Use a wider grip to reduce impingement risk and shift focus to side delts. Cable or dumbbell versions may be safer for those with shoulder issues. Keep the bar close to your body.',
 'Using too narrow a grip causing shoulder impingement. Shrugging the weight instead of pulling with the delts. Letting the bar drift away from the body.', true, false),

('Front Raise', 'shoulders', ARRAY['front_delts'], 'dumbbell', 'beginner',
 'Stand with a dumbbell in each hand in front of your thighs. Raise one or both dumbbells forward to shoulder height with a slight bend in the elbows. Lower with control.',
 'Alternate arms to reduce fatigue and maintain form. Can be done with a plate or cable for variety. Keep your core tight to prevent swaying.',
 'Swinging the weight using momentum. Arching the back. Raising above shoulder height. Using too much weight.', false, false),

-- BICEPS EXERCISES
('Barbell Curl', 'biceps', ARRAY['biceps','forearms'], 'barbell', 'beginner',
 'Stand with feet shoulder-width apart holding a barbell with an underhand grip at arm''s length. Curl the bar up toward your shoulders by bending at the elbows. Squeeze at the top, then lower slowly.',
 'Keep your elbows pinned to your sides throughout. Use a shoulder-width grip for balanced development. Use an EZ-bar if a straight bar causes wrist pain.',
 'Swinging the body to lift the weight. Letting the elbows drift forward. Not controlling the negative. Using momentum from the hips.', false, false),

('Dumbbell Hammer Curl', 'biceps', ARRAY['biceps','brachialis','forearms'], 'dumbbell', 'beginner',
 'Stand with a dumbbell in each hand, palms facing your body (neutral grip). Curl the dumbbells up keeping the neutral grip throughout. Squeeze at the top and lower slowly.',
 'Hammer curls target the brachialis and brachioradialis, adding arm thickness. Alternate arms or curl both simultaneously. Keep elbows stationary.',
 'Swinging the weight. Rotating the wrist during the curl. Moving the elbows forward. Rushing the negative.', false, false),

('Incline Dumbbell Curl', 'biceps', ARRAY['biceps'], 'dumbbell', 'intermediate',
 'Set an incline bench to 45 degrees. Sit back with a dumbbell in each hand hanging at full arm extension. Curl the dumbbells up while keeping your upper arms stationary. Lower with control.',
 'The incline stretches the long head of the biceps for better activation. Keep your back flat against the bench. Go lighter than standing curls.',
 'Lifting the shoulders off the bench. Swinging the dumbbells. Not getting full stretch at the bottom. Going too heavy.', false, false),

('Cable Curl', 'biceps', ARRAY['biceps','forearms'], 'cable', 'beginner',
 'Stand facing a low cable pulley with a straight bar or EZ-bar attachment. Curl the bar up toward your shoulders. Squeeze at the top and lower with control.',
 'Cables provide constant tension throughout the range of motion. Step back from the machine for a slight forward pull at the bottom. Try single-arm variations for balance.',
 'Leaning back to move the weight. Allowing elbows to drift forward. Using body momentum. Not achieving full contraction or full stretch.', false, false),

('Preacher Curl', 'biceps', ARRAY['biceps'], 'barbell', 'intermediate',
 'Sit at a preacher bench with your upper arms resting on the pad. Grip an EZ-bar with an underhand grip. Curl the bar up toward your shoulders. Lower slowly to near full extension.',
 'The preacher bench eliminates momentum and isolates the biceps. Do not fully lock out at the bottom to protect the elbow joint. Focus on the squeeze at the top.',
 'Hyperextending the elbows at the bottom. Using body weight to rock the bar up. Setting the pad height incorrectly. Cutting the range of motion short.', false, false),

('Concentration Curl', 'biceps', ARRAY['biceps'], 'dumbbell', 'beginner',
 'Sit on a bench with legs spread. Rest your working arm''s elbow against your inner thigh. Curl the dumbbell up toward your shoulder. Squeeze at the top and lower slowly.',
 'This exercise eliminates all cheating since you are braced against your leg. Supinate (rotate palm up) during the curl for maximum bicep activation. Keep your torso still.',
 'Moving the torso to assist the curl. Placing the elbow too low or too high on the thigh. Rushing through reps. Using the opposite arm to assist.', false, false),

-- TRICEPS EXERCISES
('Close-Grip Bench Press', 'triceps', ARRAY['triceps','chest','front_delts'], 'barbell', 'intermediate',
 'Lie on a flat bench and grip the bar with hands about shoulder-width apart. Unrack and lower the bar to your lower chest keeping elbows close to your body. Press back up to lockout.',
 'Keep elbows tucked at about 30 degrees from your body. This is one of the best tricep mass builders. You can handle more weight than isolation exercises.',
 'Gripping too narrow causing wrist strain. Flaring the elbows wide. Lowering the bar too high on the chest. Not locking out at the top.', true, false),

('Tricep Pushdown', 'triceps', ARRAY['triceps'], 'cable', 'beginner',
 'Stand at a cable machine with a straight bar or rope attachment at the top pulley. Grip the attachment with elbows at your sides and bent at 90 degrees. Push down until arms are fully extended. Return slowly.',
 'Keep your elbows pinned to your sides throughout. Lean slightly forward for better engagement. With the rope, split your hands apart at the bottom for extra contraction.',
 'Flaring elbows out. Using the shoulders to push the weight. Leaning too far over the weight. Not achieving full extension.', false, false),

('Overhead Tricep Extension', 'triceps', ARRAY['triceps'], 'dumbbell', 'intermediate',
 'Hold a single dumbbell overhead with both hands cupping one end. Lower the dumbbell behind your head by bending at the elbows. Extend back to the starting position.',
 'Keep your elbows pointed forward and close to your head throughout. This exercise emphasizes the long head of the triceps. Can be done seated for more stability.',
 'Flaring elbows out wide. Arching the lower back. Not going deep enough behind the head. Using too much weight and losing control.', false, false),

('Skull Crushers', 'triceps', ARRAY['triceps'], 'barbell', 'intermediate',
 'Lie on a flat bench holding an EZ-bar above your chest with arms extended. Lower the bar toward your forehead by bending only at the elbows. Extend back to the start.',
 'Lower the bar slightly behind the head rather than to the forehead for better long head activation and less elbow stress. Use an EZ-bar to reduce wrist strain.',
 'Lowering the bar directly to the forehead putting stress on the elbows. Flaring elbows. Moving the upper arms during the movement. Going too heavy.', false, false),

('Diamond Push-Up', 'triceps', ARRAY['triceps','chest','front_delts'], 'bodyweight', 'intermediate',
 'Get into a push-up position with your hands close together forming a diamond shape with your index fingers and thumbs. Lower your chest to your hands. Push back up.',
 'Keep elbows close to your body as you descend. If the diamond position is uncomfortable, just place hands closer than shoulder width. Engage your core throughout.',
 'Flaring elbows out wide. Sagging hips. Not achieving full depth. Spreading hands too far apart defeating the purpose.', true, false),

('Tricep Dip (Bench)', 'triceps', ARRAY['triceps','front_delts','chest'], 'bodyweight', 'beginner',
 'Place your hands on a bench behind you with fingers forward. Extend legs out in front. Lower your body by bending your elbows to about 90 degrees. Press back up.',
 'Keep your back close to the bench. Bend your knees to make it easier. Place feet on another bench to increase difficulty. Add a weight plate on your lap for more resistance.',
 'Going too deep and stressing the shoulders. Flaring elbows out. Locking elbows aggressively at the top. Shrugging shoulders up toward ears.', false, false),

-- LEG EXERCISES
('Barbell Back Squat', 'legs', ARRAY['quads','glutes','hamstrings','lower_back','core'], 'barbell', 'intermediate',
 'Position the bar on your upper traps. Unrack and step back. Set feet shoulder-width apart with toes slightly out. Squat down by pushing hips back and bending knees until thighs are at least parallel to the floor. Drive up through your heels.',
 'Keep your chest up and core braced throughout. Push your knees out over your toes. Take a big breath and brace before each rep. Going slightly below parallel is ideal for muscle development.',
 'Knees caving inward. Rounding the lower back at the bottom. Rising on toes. Not hitting proper depth. Excessive forward lean. Looking up or down instead of forward.', true, false),

('Romanian Deadlift', 'legs', ARRAY['hamstrings','glutes','lower_back'], 'barbell', 'intermediate',
 'Stand holding a barbell at hip height with an overhand grip. Push your hips back while maintaining a slight knee bend. Lower the bar along your legs until you feel a deep hamstring stretch. Drive hips forward to return.',
 'Think of this as a hip hinge, not a bending movement. The bar should stay in contact with your legs throughout. Stop when you feel maximum hamstring stretch, not when the bar reaches the floor.',
 'Rounding the lower back. Bending the knees too much turning it into a squat. Letting the bar drift away from the legs. Looking up and hyperextending the neck.', true, false),

('Leg Press', 'legs', ARRAY['quads','glutes','hamstrings'], 'machine', 'beginner',
 'Sit in the leg press machine with feet shoulder-width apart on the platform. Lower the weight by bending your knees toward your chest until they reach about 90 degrees. Press back up without locking your knees.',
 'Foot placement changes emphasis: higher hits hamstrings and glutes, lower hits quads, wider hits inner thighs. Keep your lower back pressed against the pad throughout.',
 'Locking knees at the top. Letting the lower back round off the pad at the bottom. Placing feet too low causing knee stress. Using too much weight with partial range of motion.', true, false),

('Leg Extension', 'legs', ARRAY['quads'], 'machine', 'beginner',
 'Sit in the machine with the pad resting on your lower shins. Extend your legs until they are straight. Squeeze the quads at the top. Lower with control.',
 'Pause at the top for a one-second squeeze. Perform partial reps at the end of a set for extra burn. Adjust the back pad so your knees align with the machine pivot.',
 'Using momentum to swing the weight up. Not achieving full extension. Lifting your butt off the seat. Going too heavy and compromising form.', false, false),

('Leg Curl', 'legs', ARRAY['hamstrings'], 'machine', 'beginner',
 'Lie face down on a leg curl machine with the pad resting on your lower calves. Curl your legs up toward your glutes. Squeeze at the top and lower slowly.',
 'Point your toes away from your shins (plantar flexion) to better isolate the hamstrings. Avoid lifting your hips off the pad. Control the negative for maximum growth stimulus.',
 'Lifting hips off the pad to help move the weight. Using momentum. Not achieving full contraction. Letting the weight drop on the negative.', false, false),

('Walking Lunges', 'legs', ARRAY['quads','glutes','hamstrings','core'], 'dumbbell', 'intermediate',
 'Hold a dumbbell in each hand at your sides. Step forward into a lunge position with your front thigh parallel to the floor. Drive through your front heel to step forward into the next lunge.',
 'Keep your torso upright throughout. Take long strides to emphasize glutes and shorter strides for quads. Push off the back foot to step forward, do not pull with the front leg.',
 'Front knee going past the toes excessively. Leaning forward. Taking too short of steps. Wobbling side to side due to poor balance.', true, false),

('Bulgarian Split Squat', 'legs', ARRAY['quads','glutes','hamstrings'], 'dumbbell', 'intermediate',
 'Stand about two feet in front of a bench. Place the top of one foot on the bench behind you. Hold dumbbells at your sides. Squat down on the front leg until your thigh is parallel to the floor. Drive back up.',
 'Keep most of your weight on the front foot. Lean slightly forward to engage more glutes. A small forward lean is fine. This is excellent for addressing leg imbalances.',
 'Placing the front foot too close to the bench. Relying on the back leg for push. Letting the front knee collapse inward. Not going deep enough.', true, false),

('Calf Raise (Standing)', 'legs', ARRAY['calves'], 'machine', 'beginner',
 'Stand on a calf raise machine with the balls of your feet on the platform and your shoulders under the pads. Rise up on your toes as high as possible. Lower slowly below the platform for a full stretch.',
 'Pause for two seconds at the top of each rep. Use a full range of motion going all the way up and all the way down. Calves respond well to higher rep ranges of 15-20.',
 'Bouncing at the bottom. Using partial range of motion. Going too heavy with no stretch. Bending the knees to involve quads.', false, false),

('Hack Squat', 'legs', ARRAY['quads','glutes'], 'machine', 'intermediate',
 'Stand on the hack squat machine platform with shoulders under the pads. Feet shoulder-width apart. Squat down until thighs are parallel to the platform. Drive back up.',
 'Lower foot placement targets quads more, higher placement targets glutes. Keep your back flat against the pad. Great for heavy quad work without lower back stress.',
 'Knees caving inward. Not going to parallel depth. Pressing through toes instead of whole foot. Locking knees at the top.', true, false),

-- GLUTE EXERCISES
('Hip Thrust', 'glutes', ARRAY['glutes','hamstrings'], 'barbell', 'intermediate',
 'Sit on the floor with your upper back against a bench. Roll a loaded barbell over your hips. Plant your feet flat about hip-width apart. Drive your hips up until your body forms a straight line from knees to shoulders. Squeeze glutes at the top.',
 'Use a barbell pad for comfort. Tuck your chin slightly to avoid neck strain. Push through your heels. At the top, your shins should be vertical. Posterior pelvic tilt at the top for maximum glute squeeze.',
 'Hyperextending the lower back at the top instead of posteriorly tilting. Feet placed too far from or too close to the glutes. Pushing through the toes. Not squeezing at the top.', false, false),

('Glute Bridge', 'glutes', ARRAY['glutes','hamstrings'], 'bodyweight', 'beginner',
 'Lie on your back with knees bent and feet flat on the floor hip-width apart. Drive your hips toward the ceiling squeezing your glutes at the top. Lower slowly back to the floor.',
 'Hold the top position for 2-3 seconds each rep. Place a band above your knees for extra glute activation. Can be loaded with a dumbbell or plate on your hips.',
 'Not squeezing the glutes at the top. Pushing through toes. Hyperextending the back. Rushing through reps.', false, false),

('Cable Pull-Through', 'glutes', ARRAY['glutes','hamstrings','lower_back'], 'cable', 'beginner',
 'Stand facing away from a low cable pulley with a rope attachment between your legs. Hinge at the hips pushing your butt back. Once you feel a hamstring stretch, squeeze your glutes to stand tall.',
 'Keep a slight knee bend throughout. The rope should pass between your legs, not in front. This is a great movement to learn the hip hinge pattern. Keep arms relaxed.',
 'Squatting instead of hinging. Rounding the back. Using too much weight. Pulling with the arms.', false, false),

('Sumo Deadlift', 'glutes', ARRAY['glutes','inner_thighs','hamstrings','quads','lower_back'], 'barbell', 'intermediate',
 'Stand with a wide stance and toes pointed out. Grip the bar with hands inside your knees. Push your knees out, brace your core, and drive through the floor to stand. Lower with control.',
 'The wider stance recruits more glutes and inner thighs. Keep your chest up and hips close to the bar. Your torso will be more upright than a conventional deadlift.',
 'Letting knees cave in. Hips shooting up too fast. Not pushing knees out over toes. Grip too wide.', true, false),

('Kickback (Cable)', 'glutes', ARRAY['glutes'], 'cable', 'beginner',
 'Attach an ankle strap to a low cable pulley. Face the machine and kick the working leg back and up, squeezing the glute at the top. Return slowly.',
 'Keep your core tight and avoid arching your back. A slight forward lean at the hips is fine. Focus on the squeeze at full extension. Keep the movement controlled.',
 'Arching the lower back. Using momentum. Bending the working knee excessively. Not achieving full hip extension.', false, false),

-- ABS EXERCISES
('Hanging Leg Raise', 'abs', ARRAY['lower_abs','hip_flexors','core'], 'bodyweight', 'intermediate',
 'Hang from a pull-up bar with an overhand grip. Raise your legs until they are parallel to the floor or higher. Lower slowly without swinging.',
 'Bend your knees to make it easier. Bring your knees to your elbows for full rectus abdominis engagement. Use ab straps if grip is a limiting factor. Posterior tilt your pelvis at the top.',
 'Swinging and using momentum. Not controlling the negative. Only lifting the knees to waist height. Using hip flexors exclusively.', false, false),

('Cable Woodchop', 'abs', ARRAY['obliques','core','shoulders'], 'cable', 'intermediate',
 'Set a cable to the highest position. Stand sideways to the machine. Grab the handle with both hands. Pull the cable diagonally across your body from high to low, rotating your torso. Control the return.',
 'The rotation should come from your core, not your arms. Pivot on your back foot to allow natural rotation. Can also be done low-to-high for variety.',
 'Rotating with the arms instead of the torso. Bending at the waist instead of rotating. Using too much weight. Not bracing the core.', false, false),

('Ab Rollout', 'abs', ARRAY['core','abs','lats','shoulders'], 'bodyweight', 'advanced',
 'Kneel on the floor holding an ab wheel or barbell with round plates. Roll forward extending your body as far as you can while keeping your core tight. Pull yourself back to the start using your abs.',
 'Start with a small range of motion and increase as you get stronger. Keep your arms straight. Squeeze your glutes to protect the lower back. Breathe out as you roll back.',
 'Sagging the hips and hyperextending the lower back. Bending the arms. Going further than you can control. Not engaging the glutes.', false, false),

('Plank', 'abs', ARRAY['core','abs','shoulders','lower_back'], 'bodyweight', 'beginner',
 'Start in a forearm plank position with elbows directly below shoulders. Engage your core and maintain a straight line from head to heels. Hold the position.',
 'Squeeze your glutes and brace your core as if about to be punched. Look at the floor to keep your neck neutral. Breathe normally. Add time progressively.',
 'Sagging the hips. Piking the hips up. Holding breath. Looking up. Letting the shoulders sag forward.', false, false),

('Russian Twist', 'abs', ARRAY['obliques','core'], 'bodyweight', 'beginner',
 'Sit on the floor with knees bent and lean back slightly. Hold your hands together or hold a weight. Rotate your torso to touch the floor beside your hip on each side.',
 'Keep your feet off the floor for added difficulty. The rotation should come from the core, not just the arms. Use a medicine ball or plate for added resistance.',
 'Swinging the arms without rotating the torso. Rounding the back. Using momentum instead of controlled rotation. Not breathing.', false, false),

('Dead Bug', 'abs', ARRAY['core','abs','hip_flexors'], 'bodyweight', 'beginner',
 'Lie on your back with arms extended toward the ceiling and knees bent at 90 degrees. Simultaneously extend one arm behind your head and the opposite leg forward. Return and switch sides.',
 'Press your lower back into the floor throughout the entire movement. Exhale as you extend. Move slowly and deliberately. This is a top-tier core stability exercise.',
 'Letting the lower back arch off the floor. Moving too quickly. Not coordinating opposite arm and leg. Holding breath.', false, false),

-- CARDIO EXERCISES
('Treadmill Running', 'cardio', ARRAY['quads','hamstrings','calves','core'], 'machine', 'beginner',
 'Set the treadmill to your desired speed and incline. Maintain an upright posture with a slight forward lean. Land with your foot below your center of gravity. Swing arms naturally.',
 'Start with a 5-minute warm-up walk. Increase incline to 1-2% to simulate outdoor running resistance. Use intervals for better fat loss results. Monitor heart rate if possible.',
 'Holding onto the handrails which reduces calorie burn. Overstriding and landing on heels. Looking down at the console. Setting speed too fast too soon.', false, false),

('Rowing Machine', 'cardio', ARRAY['lats','quads','hamstrings','biceps','core'], 'machine', 'beginner',
 'Sit on the rower and strap your feet in. Grab the handle. Push with your legs first, then lean back slightly, then pull the handle to your lower chest. Return in reverse order: arms, lean, legs.',
 'The drive should be about 60% legs, 20% back, 20% arms. Keep a tall chest throughout. Aim for a consistent stroke rate of 24-28 strokes per minute for steady state.',
 'Pulling with the arms before the legs extend. Rounding the back. Rushing the recovery phase. Gripping the handle too tightly.', true, false),

('Jump Rope', 'cardio', ARRAY['calves','shoulders','forearms','core'], 'bodyweight', 'beginner',
 'Hold the rope handles at hip height with elbows close to your body. Use your wrists to turn the rope, not your arms. Jump just high enough to clear the rope. Land softly on the balls of your feet.',
 'Start with 30-second intervals if new. Size your rope by standing on the center and pulling handles to your armpits. Keep a slight bend in the knees. Look forward not down.',
 'Jumping too high. Using the arms instead of wrists. Looking down at feet. Landing with straight legs.', false, false),

('Battle Ropes', 'cardio', ARRAY['shoulders','arms','core','back'], 'other', 'intermediate',
 'Hold one end of the rope in each hand. Stand with feet shoulder-width apart and knees slightly bent. Create alternating waves by rapidly raising and lowering each arm.',
 'Keep your core braced throughout. Try different patterns: alternating waves, slams, circles, snakes. Work in 20-30 second intervals. Stand in a slight squat for more lower body engagement.',
 'Standing too upright. Using only the arms instead of the whole body. Not maintaining wave amplitude. Holding breath.', false, false),

('Stairmaster', 'cardio', ARRAY['quads','glutes','calves','hamstrings'], 'machine', 'beginner',
 'Stand on the machine and select your speed. Step naturally keeping an upright posture. Push through your whole foot on each step. Maintain a steady rhythm.',
 'Avoid leaning on the rails as this significantly reduces the workout intensity. Go slower with no hands rather than faster while leaning. Great for glute development.',
 'Leaning heavily on the handrails. Hunching forward. Setting the speed too high and losing form. Taking shallow steps.', false, false),

-- COMPOUND EXERCISES
('Power Clean', 'compound', ARRAY['hamstrings','glutes','traps','quads','shoulders','lower_back'], 'barbell', 'advanced',
 'Stand with feet hip-width apart, bar over mid-foot. Grip the bar just outside knees. Deadlift the bar to mid-thigh. Explosively extend hips and shrug, pulling yourself under the bar to catch it on your front delts in a quarter squat. Stand up.',
 'This is an explosive movement. Focus on the hip extension, not pulling with the arms. The arms guide the bar, they do not lift it. Practice with an empty bar first.',
 'Pulling with the arms too early. Not achieving full hip extension. Catching the bar with a rounded back. Curling the bar instead of pulling under it.', true, false),

('Thruster', 'compound', ARRAY['quads','glutes','shoulders','triceps','core'], 'barbell', 'intermediate',
 'Hold a barbell in the front rack position. Squat down to parallel or below. As you drive out of the squat, use the momentum to press the bar overhead in one fluid motion. Lower and repeat.',
 'Use the leg drive to help the press. Keep your core braced throughout. The movement should be fluid with no pause between the squat and press. Great for metabolic conditioning.',
 'Pausing too long between the squat and press. Not reaching full depth on the squat. Pressing the bar forward instead of straight up. Losing the front rack position.', true, false),

('Farmer''s Walk', 'compound', ARRAY['traps','forearms','core','legs','shoulders'], 'dumbbell', 'beginner',
 'Pick up a heavy dumbbell or kettlebell in each hand. Stand tall with shoulders back and core braced. Walk forward with controlled steps. Set the weights down after the desired distance or time.',
 'Go heavy. Aim for at least half your bodyweight in each hand. Keep your shoulders pulled back and down. Take short quick steps. Great for grip strength and overall conditioning.',
 'Leaning to one side. Looking down. Taking too long of strides. Letting the shoulders round forward.', true, false),

('Clean and Jerk', 'olympic', ARRAY['quads','glutes','hamstrings','shoulders','traps','triceps','core'], 'barbell', 'advanced',
 'Perform a clean bringing the bar to your front rack position. Dip slightly by bending knees, then explosively drive the bar overhead while splitting your feet. Recover to a standing position with the bar overhead.',
 'Master the clean and the jerk separately before combining. The split jerk is most common but push jerk works too. Always use bumper plates. This is highly technical and benefits from coaching.',
 'Not achieving full hip extension in the clean. Poor timing on the jerk dip. Not getting under the bar fast enough. Pressing out the jerk instead of locking out immediately.', true, false),

('Snatch', 'olympic', ARRAY['hamstrings','glutes','traps','shoulders','quads','core'], 'barbell', 'advanced',
 'Stand with feet hip-width apart and grip the bar with a wide snatch grip. Pull the bar from the floor, extending explosively at the hips. Pull yourself under the bar catching it overhead in a full squat. Stand up.',
 'The snatch requires excellent mobility and technique. Start with a PVC pipe or empty bar. The wide grip reduces the distance the bar needs to travel. Overhead squat mobility is essential.',
 'Pulling with the arms early. Not keeping the bar close. Catching with bent arms (press out). Insufficient overhead mobility causing the bar to drift forward.', true, false),

('Turkish Get-Up', 'compound', ARRAY['shoulders','core','glutes','quads','hamstrings'], 'kettlebell', 'advanced',
 'Lie on your back holding a kettlebell at arm''s length above your shoulder. Roll to your elbow, then your hand. Bridge your hips up. Sweep your leg through to a kneeling position. Stand up. Reverse the steps.',
 'Master each position before adding weight. Keep your eyes on the kettlebell throughout. Move slowly and deliberately. This is one of the best full-body exercises for stability.',
 'Rushing through the positions. Losing eye contact with the weight. Bending the arm holding the kettlebell. Not engaging the core throughout.', true, false),

-- KETTLEBELL EXERCISES
('Kettlebell Swing', 'compound', ARRAY['glutes','hamstrings','core','shoulders','lower_back'], 'kettlebell', 'intermediate',
 'Stand with feet wider than shoulder width. Hold a kettlebell with both hands. Hinge at the hips to swing the bell between your legs. Snap your hips forward to drive the bell to chest height. Let it fall and repeat.',
 'This is a hip hinge, not a squat. The arms do not lift the bell, the hips drive it. Squeeze your glutes hard at the top. Breathe out sharply at the top. Keep the bell close during the backswing.',
 'Squatting instead of hinging. Using the arms to lift. Rounding the back. Hyperextending at the top. Not bracing the core at the top.', true, false),

('Kettlebell Goblet Squat', 'legs', ARRAY['quads','glutes','core'], 'kettlebell', 'beginner',
 'Hold a kettlebell by the horns at chest level. Stand with feet slightly wider than shoulder width. Squat down keeping the kettlebell close to your chest. Drive back up through your heels.',
 'The goblet position naturally promotes an upright torso. Push your knees out with your elbows at the bottom. This is the best squat variation for beginners. Pause at the bottom for extra difficulty.',
 'Leaning forward. Letting the kettlebell drift away from the chest. Not going deep enough. Knees caving inward.', true, false),

-- BAND EXERCISES
('Banded Pull-Apart', 'shoulders', ARRAY['rear_delts','rhomboids','traps'], 'bands', 'beginner',
 'Hold a resistance band in front of you at shoulder height with arms extended. Pull the band apart by squeezing your shoulder blades together until the band touches your chest. Return slowly.',
 'Do these daily as prehab. Start with a light band and high reps of 20-30. Keep arms straight throughout. Great as a warm-up before pressing movements.',
 'Bending the elbows. Shrugging the shoulders. Using a band that is too heavy. Not achieving full retraction.', false, false),

('Banded Hip Thrust', 'glutes', ARRAY['glutes','hamstrings'], 'bands', 'beginner',
 'Sit on the floor with your back against a bench. Place a band around your knees. Plant feet flat and drive hips up, pushing knees out against the band. Squeeze glutes at the top.',
 'The band adds abduction resistance making the glutes work harder. This is a great warm-up before squats or deadlifts. Hold the top position for 3 seconds.',
 'Not pushing knees out against the band. Hyperextending the back. Not squeezing at the top. Rushing through reps.', false, false),

-- SMITH MACHINE EXERCISES
('Smith Machine Squat', 'legs', ARRAY['quads','glutes'], 'smith_machine', 'beginner',
 'Position yourself under the Smith machine bar with the bar on your upper traps. Feet slightly in front of the bar. Squat down until thighs are parallel. Drive back up.',
 'The fixed path allows you to place feet slightly forward to target quads differently. Good for beginners learning squat patterns. Use as a supplement, not a replacement for free squats.',
 'Placing feet directly under the bar instead of slightly forward. Going too heavy with poor form. Relying solely on the Smith machine and never free squatting.', true, false),

-- TRX EXERCISES
('TRX Row', 'back', ARRAY['lats','rhomboids','biceps','rear_delts'], 'trx', 'beginner',
 'Hold the TRX handles with an overhand grip. Lean back with arms extended and body in a straight line. Pull your chest to the handles by squeezing your shoulder blades together. Lower with control.',
 'Walk your feet forward to increase difficulty. Keep your body rigid like a plank throughout. Pause at the top and squeeze. Great for home and travel workouts.',
 'Sagging the hips. Pulling with the arms instead of the back. Shrugging shoulders. Not maintaining body alignment.', true, false),

('TRX Chest Press', 'chest', ARRAY['chest','triceps','front_delts','core'], 'trx', 'beginner',
 'Face away from the TRX anchor point holding the handles with arms extended. Lean forward and lower your chest between the handles by bending your elbows. Press back up.',
 'Walk feet closer to the anchor point to increase difficulty. Keep your core tight to prevent sagging. This is essentially an unstable push-up variation.',
 'Sagging the hips. Flaring elbows. Not controlling the descent. Placing feet too far from the anchor making it too easy.', true, false),

('TRX Pike', 'abs', ARRAY['core','abs','shoulders','hip_flexors'], 'trx', 'advanced',
 'Place your feet in the TRX loops in a push-up position. Keeping legs straight, pike your hips up toward the ceiling pulling your feet toward your hands. Lower back to the start with control.',
 'Start with TRX knee tucks before progressing to pikes. Keep your arms straight and shoulders over your hands. Exhale as you pike up.',
 'Bending the knees instead of keeping legs straight. Rounding the shoulders forward. Not engaging the core. Moving too quickly.', false, false),

-- STRETCHING AND MOBILITY
('Pigeon Stretch', 'stretching', ARRAY['glutes','hip_flexors'], 'bodyweight', 'beginner',
 'From a tabletop position, bring one knee forward and place it behind your wrist with your shin angled across. Extend the other leg straight back. Lower your hips toward the floor. Hold for 30-60 seconds per side.',
 'Place a yoga block or folded towel under your hip if you cannot reach the floor. Keep your hips square. Breathe deeply into the stretch. This is essential for anyone who sits a lot.',
 'Letting the hips rotate open. Forcing depth before you are ready. Not keeping the back leg straight. Rounding the spine excessively.', false, false),

('World''s Greatest Stretch', 'mobility', ARRAY['hip_flexors','hamstrings','thoracic_spine','glutes'], 'bodyweight', 'beginner',
 'Step into a deep lunge. Place both hands on the floor inside the front foot. Rotate the inside arm up toward the ceiling opening your chest. Return hand to the floor. Repeat on the other side.',
 'This combines a hip flexor stretch, hamstring stretch, and thoracic rotation. Perfect as a warm-up before any workout. Spend 5 reps per side. Move fluidly between positions.',
 'Not getting deep enough into the lunge. Rushing through the rotation. Not opening the chest fully. Letting the back knee collapse.', false, false),

('Cat-Cow Stretch', 'mobility', ARRAY['spine','core','lower_back'], 'bodyweight', 'beginner',
 'Start on all fours with hands under shoulders and knees under hips. Arch your back dropping your belly toward the floor and lifting your head (cow). Then round your back pushing it toward the ceiling and tucking your chin (cat). Alternate.',
 'Move slowly and breathe deeply. Inhale into cow, exhale into cat. Perform 10-15 repetitions. This is excellent for spinal mobility and relieving back tension.',
 'Moving too quickly. Not coordinating with breath. Not achieving full range of motion in either position. Placing hands or knees incorrectly.', false, false),

('Hip 90/90 Stretch', 'mobility', ARRAY['hip_flexors','glutes','hip_rotators'], 'bodyweight', 'beginner',
 'Sit on the floor with one leg in front bent at 90 degrees and the other leg to the side bent at 90 degrees. Keep your torso tall. Lean forward over the front leg to deepen the stretch. Hold, then switch sides.',
 'Both knees should be at 90-degree angles. Sit on a cushion if your hips are tight. This targets internal and external hip rotation which most people neglect.',
 'Compensating by rounding the spine instead of hinging at the hips. Not achieving the full 90/90 position. Leaning to one side.', false, false),

('Thoracic Spine Rotation', 'mobility', ARRAY['thoracic_spine','obliques'], 'bodyweight', 'beginner',
 'Lie on your side with knees bent at 90 degrees stacked on top of each other. Extend both arms in front of you stacked. Open the top arm rotating your upper back until it reaches or approaches the floor on the other side. Return.',
 'Keep your knees together and pressed into the floor. Follow your hand with your eyes. Exhale as you rotate. Hold the open position for 2-3 breaths.',
 'Letting the knees separate. Forcing the rotation. Not breathing into the stretch. Rotating from the lower back instead of the thoracic spine.', false, false),

('Couch Stretch', 'stretching', ARRAY['hip_flexors','quads'], 'bodyweight', 'beginner',
 'Kneel in front of a wall or couch. Place one foot against the wall behind you with your knee on the floor. Step the other foot forward into a lunge. Keep your torso upright and squeeze the glute of the back leg.',
 'This is one of the most effective hip flexor stretches. Start with your torso leaning forward and gradually work upright over time. Hold for 60-90 seconds per side.',
 'Arching the lower back instead of engaging the glute. Not spending enough time in the position. Leaning too far forward.', false, false),

('Band Shoulder Dislocate', 'mobility', ARRAY['shoulders','rotator_cuff','chest'], 'bands', 'beginner',
 'Hold a band or PVC pipe with a wide grip. Keeping arms straight, raise it overhead and continue the arc behind your back as far as comfortable. Reverse the movement.',
 'Use the widest grip possible and narrow over time as mobility improves. Go slowly and never force the movement. Perform 10-15 reps as part of your warm-up.',
 'Gripping too narrow before having the mobility. Bending the elbows. Forcing through pain. Moving too quickly.', false, false),

('Foam Roll - IT Band', 'mobility', ARRAY['it_band','quads','glutes'], 'bodyweight', 'beginner',
 'Lie on your side with a foam roller under your outer thigh. Support yourself with your hands and top leg. Roll slowly from hip to just above the knee.',
 'Stop and hold on tender spots for 20-30 seconds. This will be uncomfortable but should not be painful. Roll the surrounding muscles too: quads and glutes.',
 'Rolling directly on the knee or hip bone. Rolling too fast. Tensing up instead of relaxing into it. Only rolling the IT band and ignoring surrounding muscles.', false, false),

-- ADDITIONAL EXERCISES TO REACH 120+
('Dumbbell Pullover', 'chest', ARRAY['chest','lats','triceps'], 'dumbbell', 'intermediate',
 'Lie across a bench with only your upper back supported. Hold a dumbbell above your chest with arms slightly bent. Lower the dumbbell in an arc behind your head. Pull it back over your chest.',
 'Keep a consistent bend in the elbows throughout. Feel the stretch in the chest and lats at the bottom. Go lighter than you think until you master the form.',
 'Bending the elbows excessively turning it into a tricep extension. Dropping the hips. Using too much weight. Not getting a full stretch.', false, false),

('Meadows Row', 'back', ARRAY['lats','rear_delts','biceps','rhomboids'], 'barbell', 'intermediate',
 'Set up a barbell in a landmine. Stand perpendicular to the bar with the working side nearest. Stagger your stance and hinge forward. Grip the end of the bar and row it toward your hip.',
 'Named after the late John Meadows. The angled pull creates a unique contraction. Pull toward your hip, not your chest. Use a towel if the bar end is too thick to grip.',
 'Standing too upright. Rotating the torso. Pulling too high toward the chest. Not hinging forward enough.', false, false),

('Pendlay Row', 'back', ARRAY['lats','rhomboids','rear_delts','biceps','lower_back'], 'barbell', 'advanced',
 'Set up as for a bent-over row but with torso parallel to the floor. The bar starts and returns to the floor each rep. Explosively row the bar to your lower chest. Lower and let it come to a dead stop.',
 'Each rep starts from a dead stop eliminating the stretch reflex. Keep your torso parallel to the floor. This builds explosive pulling strength.',
 'Not getting the torso parallel. Using momentum between reps. Rounding the back. Cutting range of motion.', true, false),

('Dumbbell Shrug', 'back', ARRAY['traps'], 'dumbbell', 'beginner',
 'Stand holding heavy dumbbells at your sides. Shrug your shoulders straight up toward your ears. Hold at the top for one second. Lower slowly.',
 'Do not roll your shoulders. Straight up and down. Go heavy and use straps if needed. Hold the top contraction for a full second.',
 'Rolling the shoulders in circles. Not holding the contraction. Using too light of weight. Bending the elbows.', false, false),

('Reverse Pec Deck', 'shoulders', ARRAY['rear_delts','rhomboids'], 'machine', 'beginner',
 'Sit facing the pec deck machine. Grip the handles with arms extended at shoulder height. Pull the handles back by squeezing your shoulder blades. Return slowly.',
 'Keep a slight bend in the elbows. Squeeze hard at the end of the movement. Go lighter and focus on the contraction. This is great for shoulder health.',
 'Using too much weight. Pulling with the arms instead of the rear delts. Leaning back. Not controlling the negative.', false, false),

('Spider Curl', 'biceps', ARRAY['biceps'], 'dumbbell', 'intermediate',
 'Lie face down on an incline bench set to about 45 degrees. Let your arms hang straight down holding dumbbells. Curl the dumbbells up. Squeeze at the top and lower slowly.',
 'The angle eliminates all momentum making this a strict isolation exercise. Go lighter than standard curls. The peak contraction is intense.',
 'Using momentum by swinging. Not lying fully on the bench. Cutting range of motion at the bottom. Going too heavy.', false, false),

('Cable Overhead Tricep Extension', 'triceps', ARRAY['triceps'], 'cable', 'beginner',
 'Face away from a high cable with a rope attachment. Hold the rope behind your head with elbows bent. Extend your arms forward and up. Return with control.',
 'Keep elbows close to your head. Step forward from the machine for a better stretch. This effectively targets the long head of the triceps.',
 'Flaring elbows. Arching the back. Using too much weight. Moving the upper arms instead of only extending at the elbow.', false, false),

('Front Squat', 'legs', ARRAY['quads','glutes','core','upper_back'], 'barbell', 'advanced',
 'Hold the bar in a front rack position with elbows high. Stand with feet shoulder-width apart. Squat down keeping your torso as upright as possible. Drive back up.',
 'The front rack position requires wrist and thoracic mobility. Cross-arm grip works as an alternative. Front squats naturally keep you more upright and target quads more.',
 'Elbows dropping causing the bar to roll forward. Rounding the upper back. Not hitting parallel depth. Losing the rack position.', true, false),

('Step-Up', 'legs', ARRAY['quads','glutes','hamstrings'], 'dumbbell', 'beginner',
 'Hold dumbbells at your sides. Place one foot fully on a box or bench. Drive through the elevated foot to step up. Step back down with control. Complete all reps on one side then switch.',
 'The box should be high enough that your thigh is parallel when your foot is on it. Drive through the heel of the working leg. Do not push off with the back foot.',
 'Pushing off the back foot for assistance. Using a box that is too low. Leaning forward excessively. Not controlling the descent.', true, false),

('Sissy Squat', 'legs', ARRAY['quads'], 'bodyweight', 'advanced',
 'Stand with feet hip-width apart. Rise on your toes and lean back while bending your knees, lowering your body backward. Your knees go well forward of your toes. Push back up to standing.',
 'Hold onto something for balance until you build strength. This is one of the most effective quad isolation exercises. The name comes from the Greek myth of Sisyphus.',
 'Not keeping the hips extended. Bending at the waist. Not going deep enough. Rushing the movement.', false, false),

('Deficit Deadlift', 'compound', ARRAY['hamstrings','glutes','lower_back','quads','traps'], 'barbell', 'advanced',
 'Stand on a 2-4 inch platform or plate. Set up as for a conventional deadlift. The added range of motion increases difficulty off the floor. Pull to lockout. Lower with control.',
 'Start with a 2-inch deficit and increase as strength improves. This builds strength off the floor. Keep the same form cues as conventional deadlift.',
 'Rounding the back due to the increased range of motion. Using too large a deficit. Not adjusting weight down from regular deadlifts.', true, false),

('Paused Squat', 'legs', ARRAY['quads','glutes','core'], 'barbell', 'advanced',
 'Perform a barbell squat but pause for 2-3 seconds at the bottom position. After the pause, drive explosively out of the hole. The pause eliminates the stretch reflex.',
 'Stay tight during the pause. Do not relax at the bottom. Use about 70-80% of your regular squat weight. Breathe at the top, not during the pause.',
 'Relaxing at the bottom and losing tightness. Shifting weight to toes during the pause. Using too much weight. Not pausing long enough.', true, false),

('Zercher Squat', 'compound', ARRAY['quads','glutes','core','biceps','upper_back'], 'barbell', 'advanced',
 'Hold the barbell in the crook of your elbows with arms bent. Stand with feet shoulder-width apart. Squat down keeping your torso upright. Drive back up.',
 'Use a barbell pad or towel in the elbow crease for comfort. This forces an incredibly upright torso. Great for core strength. Start light.',
 'Rounding the upper back. Letting the bar slip down the arms. Going too heavy before mastering the position. Not wrapping arms securely.', true, false),

('Landmine Press', 'shoulders', ARRAY['front_delts','upper_chest','triceps','core'], 'barbell', 'intermediate',
 'Hold the end of a barbell set in a landmine at shoulder height with one hand. Press the bar up and forward at an angle until your arm is extended. Lower with control.',
 'The arc of the landmine makes this shoulder-friendly. Great alternative for those who cannot overhead press pain-free. Can be done standing or in a half-kneeling position.',
 'Leaning back too much. Not bracing the core. Pressing too far forward. Using the legs to cheat.', true, false),

('Dumbbell Reverse Lunge', 'legs', ARRAY['quads','glutes','hamstrings'], 'dumbbell', 'beginner',
 'Hold dumbbells at your sides. Step one foot backward, lowering your back knee toward the floor. Your front thigh should reach parallel. Push through the front heel to return to standing.',
 'Reverse lunges are easier on the knees than forward lunges. Take a longer step for more glute emphasis, shorter for quads. Keep your torso upright.',
 'Front knee traveling too far forward. Leaning forward. Not stepping back far enough. Pushing off the back foot instead of driving through the front.', true, false),

('Cable Face Pull with External Rotation', 'shoulders', ARRAY['rear_delts','rotator_cuff','traps','rhomboids'], 'cable', 'beginner',
 'Set cable to face height with rope attachment. Pull the rope toward your face then externally rotate your hands until they are beside your ears with thumbs pointing back. Slowly return.',
 'This is the gold standard shoulder health exercise. Do these at least 3x per week. Light weight, high reps. Focus on the external rotation component.',
 'Skipping the external rotation. Using too much weight. Pulling to the chest instead of the face. Not squeezing at the end position.', false, false),

('Kettlebell Clean and Press', 'compound', ARRAY['shoulders','glutes','core','triceps','forearms'], 'kettlebell', 'intermediate',
 'Clean a kettlebell to the rack position on your shoulder. Press it overhead to lockout. Lower back to the rack position. Clean it back down. Repeat. Switch arms after your set.',
 'The clean and the press are two distinct movements. Keep the kettlebell close to your body during the clean. Use your hips to help drive the press.',
 'Banging the wrist with the kettlebell on the clean. Using all arm to press. Not controlling the lower. Leaning to the side under the weight.', true, false);


-- ============================================================================
-- 2. FOODS (120 common foods with realistic macros)
-- ============================================================================

INSERT INTO foods (name, brand, serving_size, serving_unit, calories, protein, carbs, fat, fiber, sugar, sodium, is_custom, is_verified) VALUES

-- PROTEINS
('Chicken Breast (grilled)', NULL, 6, 'oz', 281, 53, 0, 6, 0, 0, 104, false, true),
('Chicken Thigh (skin-on, roasted)', NULL, 4, 'oz', 250, 28, 0, 15, 0, 0, 90, false, true),
('Ground Beef 90/10', NULL, 4, 'oz', 200, 23, 0, 11, 0, 0, 75, false, true),
('Ground Beef 80/20', NULL, 4, 'oz', 287, 19, 0, 23, 0, 0, 76, false, true),
('Ground Turkey 93/7', NULL, 4, 'oz', 170, 21, 0, 9, 0, 0, 80, false, true),
('Salmon Fillet (baked)', NULL, 6, 'oz', 350, 38, 0, 21, 0, 0, 86, false, true),
('Tilapia (baked)', NULL, 6, 'oz', 218, 45, 0, 4, 0, 0, 90, false, true),
('Shrimp (cooked)', NULL, 4, 'oz', 120, 23, 1, 2, 0, 0, 240, false, true),
('Tuna (canned in water)', NULL, 5, 'oz', 130, 29, 0, 1, 0, 0, 300, false, true),
('Sirloin Steak (grilled)', NULL, 6, 'oz', 310, 46, 0, 13, 0, 0, 95, false, true),
('Pork Chop (grilled)', NULL, 6, 'oz', 275, 42, 0, 11, 0, 0, 85, false, true),
('Tofu (firm)', NULL, 4, 'oz', 88, 10, 2, 5, 1, 0, 10, false, true),
('Tempeh', NULL, 4, 'oz', 222, 21, 8, 13, 0, 0, 15, false, true),
('Bison (ground)', NULL, 4, 'oz', 190, 24, 0, 10, 0, 0, 70, false, true),
('Turkey Breast (sliced deli)', NULL, 3, 'oz', 88, 18, 1, 1, 0, 1, 580, false, true),

-- EGGS AND DAIRY
('Whole Egg (large)', NULL, 1, 'large', 72, 6, 0.4, 5, 0, 0.2, 71, false, true),
('Egg Whites', NULL, 3, 'large', 51, 11, 0.5, 0, 0, 0.4, 165, false, true),
('Greek Yogurt (plain, nonfat)', 'Fage', 1, 'cup', 130, 23, 8, 0, 0, 7, 80, false, true),
('Greek Yogurt (plain, 2%)', 'Fage', 1, 'cup', 170, 23, 8, 5, 0, 7, 80, false, true),
('Cottage Cheese (low-fat)', NULL, 1, 'cup', 183, 28, 6, 5, 0, 5, 746, false, true),
('Whole Milk', NULL, 1, 'cup', 149, 8, 12, 8, 0, 12, 105, false, true),
('Skim Milk', NULL, 1, 'cup', 83, 8, 12, 0, 0, 12, 103, false, true),
('Cheddar Cheese', NULL, 1, 'oz', 113, 7, 0.4, 9, 0, 0.1, 176, false, true),
('Mozzarella Cheese (part-skim)', NULL, 1, 'oz', 72, 7, 1, 5, 0, 0.3, 175, false, true),
('Parmesan Cheese (grated)', NULL, 2, 'tbsp', 42, 4, 0.2, 3, 0, 0, 160, false, true),
('Cream Cheese', NULL, 2, 'tbsp', 99, 2, 2, 10, 0, 1, 86, false, true),

-- GRAINS AND STARCHES
('White Rice (cooked)', NULL, 1, 'cup', 206, 4, 45, 0.4, 0.6, 0, 2, false, true),
('Brown Rice (cooked)', NULL, 1, 'cup', 216, 5, 45, 1.8, 3.5, 0, 10, false, true),
('Jasmine Rice (cooked)', NULL, 1, 'cup', 210, 4, 46, 0.4, 0.6, 0, 2, false, true),
('Oatmeal (dry)', NULL, 0.5, 'cup', 150, 5, 27, 3, 4, 0.5, 0, false, true),
('Quinoa (cooked)', NULL, 1, 'cup', 222, 8, 39, 4, 5, 2, 13, false, true),
('Whole Wheat Bread', NULL, 1, 'slice', 81, 4, 14, 1, 2, 1.5, 146, false, true),
('White Bread', NULL, 1, 'slice', 75, 2, 14, 1, 0.6, 1.5, 147, false, true),
('Pasta (cooked)', NULL, 1, 'cup', 220, 8, 43, 1.3, 2.5, 0.8, 1, false, true),
('Whole Wheat Pasta (cooked)', NULL, 1, 'cup', 174, 7, 37, 0.8, 6, 0.8, 4, false, true),
('Sweet Potato (baked)', NULL, 1, 'medium', 103, 2, 24, 0, 3.8, 7, 41, false, true),
('Russet Potato (baked)', NULL, 1, 'medium', 161, 4, 37, 0.2, 3.8, 2, 17, false, true),
('Flour Tortilla (large)', NULL, 1, 'tortilla', 210, 5, 36, 5, 2, 1, 430, false, true),
('Corn Tortilla', NULL, 1, 'tortilla', 52, 1, 11, 0.7, 1.5, 0.2, 11, false, true),
('Bagel (plain)', NULL, 1, 'bagel', 270, 10, 53, 2, 2, 6, 430, false, true),
('Cream of Rice (dry)', NULL, 0.25, 'cup', 150, 3, 33, 0, 0, 0, 0, false, true),

-- FRUITS
('Banana', NULL, 1, 'medium', 105, 1, 27, 0.4, 3, 14, 1, false, true),
('Apple', NULL, 1, 'medium', 95, 0.5, 25, 0.3, 4, 19, 2, false, true),
('Blueberries', NULL, 1, 'cup', 84, 1, 21, 0.5, 4, 15, 1, false, true),
('Strawberries', NULL, 1, 'cup', 49, 1, 12, 0.5, 3, 7, 2, false, true),
('Orange', NULL, 1, 'medium', 62, 1, 15, 0.2, 3, 12, 0, false, true),
('Avocado', NULL, 0.5, 'medium', 161, 2, 9, 15, 7, 0.5, 7, false, true),
('Grapes', NULL, 1, 'cup', 104, 1, 27, 0.2, 1, 23, 3, false, true),
('Mango', NULL, 1, 'cup', 99, 1, 25, 0.6, 3, 23, 2, false, true),
('Watermelon', NULL, 1, 'cup', 46, 1, 12, 0.2, 0.6, 9, 2, false, true),
('Pineapple', NULL, 1, 'cup', 82, 1, 22, 0.2, 2, 16, 2, false, true),

-- VEGETABLES
('Broccoli (steamed)', NULL, 1, 'cup', 55, 4, 11, 0.6, 5, 2, 64, false, true),
('Spinach (raw)', NULL, 2, 'cups', 14, 2, 2, 0.2, 1.3, 0.3, 48, false, true),
('Kale (raw)', NULL, 2, 'cups', 14, 1, 2, 0.3, 0.8, 0, 11, false, true),
('Asparagus', NULL, 6, 'spears', 20, 2, 4, 0.2, 2, 1, 12, false, true),
('Green Beans', NULL, 1, 'cup', 31, 2, 7, 0.1, 3, 3, 6, false, true),
('Bell Pepper (red)', NULL, 1, 'medium', 37, 1, 7, 0.4, 2.5, 5, 5, false, true),
('Zucchini', NULL, 1, 'medium', 33, 2, 6, 0.6, 2, 5, 16, false, true),
('Mixed Salad Greens', NULL, 3, 'cups', 20, 2, 3, 0.2, 1.5, 1, 30, false, true),
('Tomato', NULL, 1, 'medium', 22, 1, 5, 0.2, 1.5, 3, 6, false, true),
('Cucumber', NULL, 0.5, 'medium', 8, 0.3, 2, 0.1, 0.3, 1, 1, false, true),

-- NUTS, SEEDS, AND HEALTHY FATS
('Almonds', NULL, 1, 'oz', 164, 6, 6, 14, 4, 1, 0, false, true),
('Peanut Butter (natural)', NULL, 2, 'tbsp', 190, 8, 7, 16, 2, 1, 0, false, true),
('Almond Butter', NULL, 2, 'tbsp', 196, 7, 6, 18, 3, 1, 0, false, true),
('Walnuts', NULL, 1, 'oz', 185, 4, 4, 18, 2, 1, 1, false, true),
('Cashews', NULL, 1, 'oz', 157, 5, 9, 12, 1, 2, 3, false, true),
('Chia Seeds', NULL, 2, 'tbsp', 138, 5, 12, 9, 10, 0, 5, false, true),
('Flax Seeds (ground)', NULL, 2, 'tbsp', 74, 3, 4, 6, 4, 0, 4, false, true),
('Olive Oil', NULL, 1, 'tbsp', 119, 0, 0, 14, 0, 0, 0, false, true),
('Coconut Oil', NULL, 1, 'tbsp', 121, 0, 0, 13, 0, 0, 0, false, true),
('Butter', NULL, 1, 'tbsp', 102, 0.1, 0, 12, 0, 0, 2, false, true),

-- SUPPLEMENTS AND SHAKES
('Whey Protein Isolate', 'Optimum Nutrition', 1, 'scoop', 120, 24, 2, 1, 0, 1, 130, false, true),
('Casein Protein', 'Optimum Nutrition', 1, 'scoop', 120, 24, 3, 1, 0, 1, 160, false, true),
('Plant Protein Blend', 'Orgain', 1, 'scoop', 150, 21, 15, 4, 2, 0, 290, false, true),
('Mass Gainer', 'Optimum Nutrition', 2, 'scoops', 650, 32, 114, 6, 3, 16, 260, false, true),
('Creatine Monohydrate', NULL, 1, 'tsp', 0, 0, 0, 0, 0, 0, 0, false, true),
('BCAA Powder', NULL, 1, 'scoop', 10, 2.5, 0, 0, 0, 0, 10, false, true),
('Pre-Workout Powder', 'C4', 1, 'scoop', 5, 0, 1, 0, 0, 0, 150, false, true),

-- SNACKS AND CONVENIENCE
('Protein Bar', 'Quest', 1, 'bar', 200, 21, 22, 8, 14, 1, 280, false, true),
('RX Bar', 'RXBar', 1, 'bar', 210, 12, 24, 9, 5, 13, 140, false, true),
('Rice Cakes (plain)', NULL, 2, 'cakes', 70, 2, 15, 0.5, 0, 0, 58, false, true),
('Beef Jerky', 'Jack Links', 1, 'oz', 82, 14, 3, 1, 0, 3, 443, false, true),
('Trail Mix', NULL, 0.25, 'cup', 173, 5, 17, 11, 2, 11, 45, false, true),
('Dark Chocolate (85%)', NULL, 1, 'oz', 170, 2, 13, 15, 3, 5, 6, false, true),
('Popcorn (air-popped)', NULL, 3, 'cups', 93, 3, 19, 1, 4, 0, 2, false, true),
('Hummus', NULL, 2, 'tbsp', 70, 2, 4, 5, 1, 0, 130, false, true),
('Edamame (shelled)', NULL, 0.5, 'cup', 95, 9, 7, 4, 4, 1, 5, false, true),
('String Cheese', NULL, 1, 'stick', 80, 7, 1, 6, 0, 0, 200, false, true),
('Peanuts (roasted)', NULL, 1, 'oz', 166, 7, 6, 14, 2, 1, 89, false, true),
('Granola', NULL, 0.5, 'cup', 300, 7, 32, 16, 3, 12, 15, false, true),

-- COMMON RESTAURANT AND FAST FOOD
('Chipotle Chicken Burrito Bowl', 'Chipotle', 1, 'bowl', 665, 46, 60, 24, 11, 4, 1650, false, true),
('Chick-fil-A Grilled Nuggets (12ct)', 'Chick-fil-A', 12, 'nuggets', 200, 38, 2, 4, 0, 1, 860, false, true),
('Subway 6" Turkey Breast', 'Subway', 1, 'sandwich', 280, 18, 46, 3, 5, 7, 810, false, true),
('McDonalds Quarter Pounder', 'McDonalds', 1, 'sandwich', 520, 30, 42, 26, 2, 10, 1110, false, true),
('Starbucks Grande Latte', 'Starbucks', 16, 'oz', 190, 13, 19, 7, 0, 17, 170, false, true),
('Starbucks Grande Black Coffee', 'Starbucks', 16, 'oz', 5, 0, 0, 0, 0, 0, 10, false, true),
('Panera Bread Broccoli Cheddar Soup', 'Panera', 1, 'bowl', 360, 16, 29, 21, 5, 6, 1330, false, true),

-- BEANS AND LEGUMES
('Black Beans (canned, drained)', NULL, 0.5, 'cup', 114, 8, 20, 0.5, 8, 0, 230, false, true),
('Chickpeas (canned, drained)', NULL, 0.5, 'cup', 134, 7, 22, 2, 6, 4, 293, false, true),
('Lentils (cooked)', NULL, 0.5, 'cup', 115, 9, 20, 0.4, 8, 2, 2, false, true),
('Kidney Beans (canned, drained)', NULL, 0.5, 'cup', 110, 8, 20, 0.4, 6, 2, 379, false, true),
('Pinto Beans (cooked)', NULL, 0.5, 'cup', 122, 8, 22, 0.6, 8, 0, 1, false, true),

-- CONDIMENTS AND COOKING STAPLES
('Soy Sauce', NULL, 1, 'tbsp', 9, 1, 1, 0, 0, 0, 879, false, true),
('Hot Sauce', NULL, 1, 'tsp', 0, 0, 0, 0, 0, 0, 124, false, true),
('Ketchup', NULL, 1, 'tbsp', 20, 0, 5, 0, 0, 4, 160, false, true),
('BBQ Sauce', NULL, 2, 'tbsp', 60, 0, 15, 0, 0, 12, 310, false, true),
('Ranch Dressing', NULL, 2, 'tbsp', 129, 0, 2, 13, 0, 1, 245, false, true),
('Balsamic Vinaigrette', NULL, 2, 'tbsp', 90, 0, 5, 8, 0, 4, 280, false, true),
('Honey', NULL, 1, 'tbsp', 64, 0, 17, 0, 0, 17, 1, false, true),
('Maple Syrup', NULL, 1, 'tbsp', 52, 0, 13, 0, 0, 12, 2, false, true),
('Salsa', NULL, 2, 'tbsp', 10, 0, 2, 0, 0, 1, 190, false, true),
('Guacamole', NULL, 2, 'tbsp', 50, 1, 3, 5, 2, 0, 115, false, true),
('Mayonnaise', NULL, 1, 'tbsp', 94, 0, 0, 10, 0, 0, 88, false, true),
('Sriracha', NULL, 1, 'tsp', 5, 0, 1, 0, 0, 1, 80, false, true),

-- BEVERAGES AND MISC
('Orange Juice', NULL, 8, 'oz', 112, 2, 26, 0.5, 0.5, 21, 2, false, true),
('Almond Milk (unsweetened)', NULL, 1, 'cup', 30, 1, 1, 2.5, 0, 0, 170, false, true),
('Oat Milk', 'Oatly', 1, 'cup', 120, 3, 16, 5, 2, 7, 100, false, true),
('Coconut Water', NULL, 8, 'oz', 46, 2, 9, 0.5, 0, 6, 252, false, true),
('Gatorade', 'Gatorade', 12, 'oz', 80, 0, 21, 0, 0, 21, 160, false, true);


-- ============================================================================
-- 3. ACHIEVEMENTS (80 achievements across all categories and tiers)
-- ============================================================================

-- First create the achievements table if it does not exist yet
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  category TEXT CHECK (category IN ('fitness','nutrition','body','business','finance','consistency','partner','community','mindset','learning')),
  tier TEXT CHECK (tier IN ('bronze','silver','gold','diamond')),
  requirement_type TEXT,
  requirement_value NUMERIC,
  secret BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id),
  earned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

INSERT INTO achievements (key, title, description, icon, category, tier, requirement_type, requirement_value, secret) VALUES

-- FITNESS - WORKOUT COUNT
('first_workout', 'Iron Initiate', 'Complete your first workout', '🏋️', 'fitness', 'bronze', 'workouts_completed', 1, false),
('workouts_10', 'Getting Serious', 'Complete 10 workouts', '💪', 'fitness', 'bronze', 'workouts_completed', 10, false),
('workouts_50', 'Gym Regular', 'Complete 50 workouts', '🔨', 'fitness', 'silver', 'workouts_completed', 50, false),
('workouts_100', 'Century Club', 'Complete 100 workouts', '💯', 'fitness', 'silver', 'workouts_completed', 100, false),
('workouts_250', 'Iron Veteran', 'Complete 250 workouts', '🏅', 'fitness', 'gold', 'workouts_completed', 250, false),
('workouts_500', 'Half Thousand', 'Complete 500 workouts', '🏆', 'fitness', 'gold', 'workouts_completed', 500, false),
('workouts_1000', 'Legendary Lifter', 'Complete 1000 workouts', '👑', 'fitness', 'diamond', 'workouts_completed', 1000, false),

-- FITNESS - PERSONAL RECORDS
('first_pr', 'New Personal Best', 'Set your first personal record', '🎯', 'fitness', 'bronze', 'prs_set', 1, false),
('pr_10', 'Record Breaker', 'Set 10 personal records', '📈', 'fitness', 'silver', 'prs_set', 10, false),
('pr_50', 'Limit Pusher', 'Set 50 personal records', '🚀', 'fitness', 'gold', 'prs_set', 50, false),
('pr_100', 'Unbreakable', 'Set 100 personal records', '⚡', 'fitness', 'diamond', 'prs_set', 100, false),

-- FITNESS - VOLUME
('volume_10k', 'Ten Ton Club', 'Lift 10,000 lbs total volume in a single workout', '🏗️', 'fitness', 'bronze', 'single_workout_volume_lbs', 10000, false),
('volume_25k', 'Volume Dealer', 'Lift 25,000 lbs total volume in a single workout', '🏗️', 'fitness', 'silver', 'single_workout_volume_lbs', 25000, false),
('volume_50k', 'Volume King', 'Lift 50,000 lbs total volume in a single workout', '🏗️', 'fitness', 'gold', 'single_workout_volume_lbs', 50000, false),
('total_volume_1m', 'Million Pound Club', 'Lift 1,000,000 lbs total lifetime volume', '🗻', 'fitness', 'diamond', 'total_lifetime_volume_lbs', 1000000, false),

-- FITNESS - SPECIFIC LIFTS
('bench_135', 'Plate Club (Bench)', 'Bench press 135 lbs', '🔵', 'fitness', 'bronze', 'bench_press_max', 135, false),
('bench_225', 'Two Plate Club (Bench)', 'Bench press 225 lbs', '🔵', 'fitness', 'silver', 'bench_press_max', 225, false),
('bench_315', 'Three Plate Club (Bench)', 'Bench press 315 lbs', '🔵', 'fitness', 'gold', 'bench_press_max', 315, false),
('squat_225', 'Two Plate Squat', 'Squat 225 lbs', '🟡', 'fitness', 'bronze', 'squat_max', 225, false),
('squat_315', 'Three Plate Squat', 'Squat 315 lbs', '🟡', 'fitness', 'silver', 'squat_max', 315, false),
('squat_405', 'Four Plate Squat', 'Squat 405 lbs', '🟡', 'fitness', 'gold', 'squat_max', 405, false),
('deadlift_315', 'Three Plate Deadlift', 'Deadlift 315 lbs', '🔴', 'fitness', 'bronze', 'deadlift_max', 315, false),
('deadlift_405', 'Four Plate Deadlift', 'Deadlift 405 lbs', '🔴', 'fitness', 'silver', 'deadlift_max', 405, false),
('deadlift_500', 'Five Hundred Club', 'Deadlift 500 lbs', '🔴', 'fitness', 'gold', 'deadlift_max', 500, false),
('thousand_pound_club', 'Thousand Pound Club', 'Total 1000 lbs across squat, bench, and deadlift', '🏛️', 'fitness', 'diamond', 'powerlifting_total', 1000, false),

-- CONSISTENCY
('streak_3', 'Three-peat', 'Maintain a 3-day workout streak', '🔥', 'consistency', 'bronze', 'workout_streak', 3, false),
('streak_7', 'Week Warrior', 'Maintain a 7-day workout streak', '🔥', 'consistency', 'bronze', 'workout_streak', 7, false),
('streak_14', 'Fortnight Fighter', 'Maintain a 14-day streak', '🔥', 'consistency', 'silver', 'workout_streak', 14, false),
('streak_30', 'Monthly Machine', 'Maintain a 30-day streak', '🔥', 'consistency', 'silver', 'workout_streak', 30, false),
('streak_60', 'Two Month Titan', 'Maintain a 60-day streak', '🔥', 'consistency', 'gold', 'workout_streak', 60, false),
('streak_100', 'Hundred Day Hero', 'Maintain a 100-day streak', '🔥', 'consistency', 'gold', 'workout_streak', 100, false),
('streak_365', 'Year of Iron', 'Maintain a 365-day streak', '🔥', 'consistency', 'diamond', 'workout_streak', 365, false),
('habit_streak_30', 'Habit Formed', 'Complete any habit for 30 consecutive days', '✅', 'consistency', 'silver', 'habit_streak', 30, false),
('habit_streak_100', 'Unshakeable', 'Complete any habit for 100 consecutive days', '✅', 'consistency', 'gold', 'habit_streak', 100, false),
('early_bird_10', 'Early Bird', 'Complete 10 workouts before 7 AM', '🌅', 'consistency', 'bronze', 'early_workouts', 10, false),
('night_owl_10', 'Night Owl', 'Complete 10 workouts after 9 PM', '🌙', 'consistency', 'bronze', 'late_workouts', 10, false),

-- NUTRITION
('first_log', 'Calorie Counter', 'Log your first meal', '🍽️', 'nutrition', 'bronze', 'meals_logged', 1, false),
('meals_100', 'Tracking Pro', 'Log 100 meals', '📝', 'nutrition', 'bronze', 'meals_logged', 100, false),
('meals_500', 'Nutrition Nerd', 'Log 500 meals', '🧪', 'nutrition', 'silver', 'meals_logged', 500, false),
('meals_1000', 'Macro Master', 'Log 1000 meals', '🔬', 'nutrition', 'gold', 'meals_logged', 1000, false),
('protein_goal_7', 'Protein Week', 'Hit your daily protein goal 7 days in a row', '🥩', 'nutrition', 'bronze', 'protein_goal_streak', 7, false),
('protein_goal_30', 'Protein Month', 'Hit your daily protein goal 30 days in a row', '🥩', 'nutrition', 'silver', 'protein_goal_streak', 30, false),
('water_goal_7', 'Hydration Station', 'Hit your water goal 7 days in a row', '💧', 'nutrition', 'bronze', 'water_goal_streak', 7, false),
('water_goal_30', 'Aqua Master', 'Hit your water goal 30 days in a row', '🌊', 'nutrition', 'silver', 'water_goal_streak', 30, false),
('meal_prep_first', 'Prep Like a Pro', 'Create your first meal prep plan', '🧑‍🍳', 'nutrition', 'bronze', 'meal_preps_created', 1, false),

-- BODY
('first_weigh_in', 'Scale Step', 'Log your first weigh-in', '⚖️', 'body', 'bronze', 'weigh_ins_logged', 1, false),
('weigh_ins_30', 'Consistent Tracker', 'Log 30 weigh-ins', '📊', 'body', 'silver', 'weigh_ins_logged', 30, false),
('weigh_ins_100', 'Data Driven', 'Log 100 weigh-ins', '📊', 'body', 'gold', 'weigh_ins_logged', 100, false),
('first_measurement', 'Tape Measure', 'Log your first body measurements', '📏', 'body', 'bronze', 'measurements_logged', 1, false),
('lost_5_lbs', 'Five Down', 'Lose 5 lbs from your starting weight', '🎯', 'body', 'bronze', 'weight_lost_lbs', 5, false),
('lost_20_lbs', 'Transformation', 'Lose 20 lbs from your starting weight', '🦋', 'body', 'silver', 'weight_lost_lbs', 20, false),
('lost_50_lbs', 'Complete Metamorphosis', 'Lose 50 lbs from your starting weight', '🦋', 'body', 'gold', 'weight_lost_lbs', 50, false),
('gained_10_lbs', 'Bulking Season', 'Gain 10 lbs from your starting weight', '💪', 'body', 'silver', 'weight_gained_lbs', 10, false),

-- BUSINESS
('first_revenue', 'First Dollar', 'Log your first revenue entry', '💵', 'business', 'bronze', 'revenue_entries', 1, false),
('revenue_1k', 'Four Figures', 'Reach $1,000 monthly revenue', '💰', 'business', 'bronze', 'monthly_revenue', 1000, false),
('revenue_5k', 'Five K Month', 'Reach $5,000 monthly revenue', '💰', 'business', 'silver', 'monthly_revenue', 5000, false),
('revenue_10k', 'Five Figure Month', 'Reach $10,000 monthly revenue', '💰', 'business', 'gold', 'monthly_revenue', 10000, false),
('revenue_100k', 'Six Figure Run Rate', 'Reach $100,000 in annual revenue', '🏦', 'business', 'diamond', 'annual_revenue', 100000, false),
('first_customer', 'Customer One', 'Add your first customer', '🤝', 'business', 'bronze', 'customers_added', 1, false),
('customers_100', 'Hundred Customers', 'Reach 100 customers', '📈', 'business', 'gold', 'customers_total', 100, false),

-- FINANCE
('first_net_worth_log', 'Wealth Watcher', 'Log your net worth for the first time', '📊', 'finance', 'bronze', 'net_worth_entries', 1, false),
('savings_1k', 'First Thousand', 'Save $1,000', '🏧', 'finance', 'bronze', 'savings_total', 1000, false),
('savings_10k', 'Emergency Fund', 'Save $10,000', '🛡️', 'finance', 'silver', 'savings_total', 10000, false),
('savings_100k', 'Six Figure Saver', 'Save $100,000', '🏰', 'finance', 'gold', 'savings_total', 100000, false),

-- PARTNER
('first_partner_workout', 'Stronger Together', 'Complete your first workout with a partner', '👫', 'partner', 'bronze', 'partner_workouts', 1, false),
('partner_workouts_25', 'Dynamic Duo', 'Complete 25 workouts with a partner', '🤜🤛', 'partner', 'silver', 'partner_workouts', 25, false),
('partner_workouts_100', 'Power Couple', 'Complete 100 workouts with a partner', '❤️‍🔥', 'partner', 'gold', 'partner_workouts', 100, false),
('partner_sync_first', 'In Sync', 'Complete your first live sync workout', '🔄', 'partner', 'bronze', 'live_sync_workouts', 1, false),
('partner_challenge_won', 'Challenge Accepted', 'Win a partner challenge', '🏁', 'partner', 'silver', 'partner_challenges_won', 1, false),

-- COMMUNITY
('first_shared_workout', 'Open Book', 'Share a workout template with the community', '📤', 'community', 'bronze', 'templates_shared', 1, false),
('first_shared_meal', 'Recipe Sharer', 'Share a meal with the community', '🍲', 'community', 'bronze', 'meals_shared', 1, false),

-- MINDSET
('first_mood_log', 'Self Aware', 'Log your mood for the first time', '🧠', 'mindset', 'bronze', 'mood_entries', 1, false),
('mood_logs_30', 'Emotionally Intelligent', 'Log your mood 30 times', '🎭', 'mindset', 'silver', 'mood_entries', 30, false),
('first_sleep_log', 'Sleep Scientist', 'Log your sleep for the first time', '😴', 'mindset', 'bronze', 'sleep_entries', 1, false),
('sleep_logs_30', 'Dream Analyst', 'Log your sleep 30 times', '🌙', 'mindset', 'silver', 'sleep_entries', 30, false),
('readiness_perfect', 'Peak Readiness', 'Achieve a readiness score of 95 or higher', '⚡', 'mindset', 'gold', 'readiness_score', 95, false),

-- LEARNING
('first_goal', 'Goal Setter', 'Create your first goal', '🎯', 'learning', 'bronze', 'goals_created', 1, false),
('goals_completed_5', 'Goal Crusher', 'Complete 5 goals', '🏁', 'learning', 'silver', 'goals_completed', 5, false),
('goals_completed_25', 'Achiever', 'Complete 25 goals', '🎓', 'learning', 'gold', 'goals_completed', 25, false),

-- SECRET ACHIEVEMENTS
('midnight_workout', 'Night Shift', 'Complete a workout between midnight and 4 AM', '🦇', 'fitness', 'silver', 'midnight_workout', 1, true),
('new_years_workout', 'Resolution Keeper', 'Complete a workout on January 1st', '🎆', 'consistency', 'silver', 'new_years_workout', 1, true),
('birthday_workout', 'Birthday Gains', 'Complete a workout on your birthday', '🎂', 'fitness', 'silver', 'birthday_workout', 1, true),
('all_exercises', 'Exercise Encyclopedia', 'Use every exercise in the library at least once', '📚', 'fitness', 'diamond', 'unique_exercises_used', 100, true),
('perfect_week', 'Perfect Week', 'Hit all nutrition, workout, and sleep goals for 7 straight days', '⭐', 'consistency', 'gold', 'perfect_week', 1, true),
('pr_on_monday', 'Monday Motivation', 'Set a PR on a Monday', '📅', 'fitness', 'bronze', 'monday_pr', 1, true),
('five_am_club', '5 AM Club', 'Complete 30 workouts starting before 5:30 AM', '🌄', 'consistency', 'gold', 'five_am_workouts', 30, true),
('ghost_slayer', 'Ghost Slayer', 'Beat your ghost set 50 times', '👻', 'fitness', 'gold', 'ghost_sets_beaten', 50, true);


-- ============================================================================
-- 4. WORKOUT TEMPLATES (PPL, Upper/Lower, Full Body)
-- ============================================================================

-- We need exercise IDs for the templates. Use a DO block to look up exercises by name.
DO $$
DECLARE
  -- Template IDs
  t_push UUID;
  t_pull UUID;
  t_legs UUID;
  t_upper UUID;
  t_lower UUID;
  t_full_body UUID;
  -- Exercise IDs
  e_bench UUID;
  e_incline_db UUID;
  e_cable_cross UUID;
  e_ohp UUID;
  e_lat_raise UUID;
  e_pushdown UUID;
  e_overhead_ext UUID;
  e_deadlift UUID;
  e_pullup UUID;
  e_bb_row UUID;
  e_cable_row UUID;
  e_face_pull UUID;
  e_bb_curl UUID;
  e_hammer_curl UUID;
  e_squat UUID;
  e_rdl UUID;
  e_leg_press UUID;
  e_leg_ext UUID;
  e_leg_curl UUID;
  e_calf_raise UUID;
  e_hip_thrust UUID;
  e_db_shoulder_press UUID;
  e_close_grip_bench UUID;
  e_lat_pulldown UUID;
  e_db_row UUID;
  e_db_fly UUID;
  e_pushup UUID;
  e_bulgarian UUID;
  e_walking_lunge UUID;
  e_plank UUID;
  e_hanging_leg_raise UUID;
  e_goblet_squat UUID;
  e_db_reverse_lunge UUID;
BEGIN
  -- Look up exercise IDs
  SELECT id INTO e_bench FROM exercises WHERE name = 'Barbell Bench Press' LIMIT 1;
  SELECT id INTO e_incline_db FROM exercises WHERE name = 'Incline Dumbbell Press' LIMIT 1;
  SELECT id INTO e_cable_cross FROM exercises WHERE name = 'Cable Crossover' LIMIT 1;
  SELECT id INTO e_ohp FROM exercises WHERE name = 'Overhead Press' LIMIT 1;
  SELECT id INTO e_lat_raise FROM exercises WHERE name = 'Lateral Raise' LIMIT 1;
  SELECT id INTO e_pushdown FROM exercises WHERE name = 'Tricep Pushdown' LIMIT 1;
  SELECT id INTO e_overhead_ext FROM exercises WHERE name = 'Overhead Tricep Extension' LIMIT 1;
  SELECT id INTO e_deadlift FROM exercises WHERE name = 'Barbell Deadlift' LIMIT 1;
  SELECT id INTO e_pullup FROM exercises WHERE name = 'Pull-Up' LIMIT 1;
  SELECT id INTO e_bb_row FROM exercises WHERE name = 'Barbell Bent-Over Row' LIMIT 1;
  SELECT id INTO e_cable_row FROM exercises WHERE name = 'Seated Cable Row' LIMIT 1;
  SELECT id INTO e_face_pull FROM exercises WHERE name = 'Face Pull' LIMIT 1;
  SELECT id INTO e_bb_curl FROM exercises WHERE name = 'Barbell Curl' LIMIT 1;
  SELECT id INTO e_hammer_curl FROM exercises WHERE name = 'Dumbbell Hammer Curl' LIMIT 1;
  SELECT id INTO e_squat FROM exercises WHERE name = 'Barbell Back Squat' LIMIT 1;
  SELECT id INTO e_rdl FROM exercises WHERE name = 'Romanian Deadlift' LIMIT 1;
  SELECT id INTO e_leg_press FROM exercises WHERE name = 'Leg Press' LIMIT 1;
  SELECT id INTO e_leg_ext FROM exercises WHERE name = 'Leg Extension' LIMIT 1;
  SELECT id INTO e_leg_curl FROM exercises WHERE name = 'Leg Curl' LIMIT 1;
  SELECT id INTO e_calf_raise FROM exercises WHERE name = 'Calf Raise (Standing)' LIMIT 1;
  SELECT id INTO e_hip_thrust FROM exercises WHERE name = 'Hip Thrust' LIMIT 1;
  SELECT id INTO e_db_shoulder_press FROM exercises WHERE name = 'Dumbbell Shoulder Press' LIMIT 1;
  SELECT id INTO e_close_grip_bench FROM exercises WHERE name = 'Close-Grip Bench Press' LIMIT 1;
  SELECT id INTO e_lat_pulldown FROM exercises WHERE name = 'Lat Pulldown' LIMIT 1;
  SELECT id INTO e_db_row FROM exercises WHERE name = 'Single-Arm Dumbbell Row' LIMIT 1;
  SELECT id INTO e_db_fly FROM exercises WHERE name = 'Dumbbell Flyes' LIMIT 1;
  SELECT id INTO e_pushup FROM exercises WHERE name = 'Push-Up' LIMIT 1;
  SELECT id INTO e_bulgarian FROM exercises WHERE name = 'Bulgarian Split Squat' LIMIT 1;
  SELECT id INTO e_walking_lunge FROM exercises WHERE name = 'Walking Lunges' LIMIT 1;
  SELECT id INTO e_plank FROM exercises WHERE name = 'Plank' LIMIT 1;
  SELECT id INTO e_hanging_leg_raise FROM exercises WHERE name = 'Hanging Leg Raise' LIMIT 1;
  SELECT id INTO e_goblet_squat FROM exercises WHERE name = 'Kettlebell Goblet Squat' LIMIT 1;
  SELECT id INTO e_db_reverse_lunge FROM exercises WHERE name = 'Dumbbell Reverse Lunge' LIMIT 1;

  -- ========================================
  -- PUSH / PULL / LEGS (PPL)
  -- ========================================

  -- Push Day
  INSERT INTO workout_templates (id, name, description, category, day_of_week, estimated_duration_minutes, is_shared)
  VALUES (gen_random_uuid(), 'PPL - Push Day', 'Push day focusing on chest, shoulders, and triceps. Part of the Push/Pull/Legs split.', 'chest', 1, 60, true)
  RETURNING id INTO t_push;

  INSERT INTO workout_template_exercises (template_id, exercise_id, sort_order, target_sets, target_reps, target_rpe, rest_seconds, notes) VALUES
  (t_push, e_bench, 1, 4, '6-8', 8, 180, 'Main compound. Warm up with 2-3 sets first.'),
  (t_push, e_incline_db, 2, 3, '8-10', 8, 120, 'Focus on upper chest contraction.'),
  (t_push, e_cable_cross, 3, 3, '12-15', 7, 90, 'Squeeze at the bottom of each rep.'),
  (t_push, e_ohp, 4, 3, '8-10', 8, 120, 'Strict form, no leg drive.'),
  (t_push, e_lat_raise, 5, 4, '12-15', 8, 60, 'Light weight, controlled reps.'),
  (t_push, e_pushdown, 6, 3, '10-12', 8, 60, 'Squeeze triceps at full extension.'),
  (t_push, e_overhead_ext, 7, 3, '10-12', 8, 60, 'Feel the stretch at the bottom.');

  -- Pull Day
  INSERT INTO workout_templates (id, name, description, category, day_of_week, estimated_duration_minutes, is_shared)
  VALUES (gen_random_uuid(), 'PPL - Pull Day', 'Pull day focusing on back and biceps. Part of the Push/Pull/Legs split.', 'back', 2, 60, true)
  RETURNING id INTO t_pull;

  INSERT INTO workout_template_exercises (template_id, exercise_id, sort_order, target_sets, target_reps, target_rpe, rest_seconds, notes) VALUES
  (t_pull, e_deadlift, 1, 3, '5', 8, 180, 'Main compound. Warm up thoroughly.'),
  (t_pull, e_pullup, 2, 4, '6-10', 8, 120, 'Use a band for assistance if needed.'),
  (t_pull, e_bb_row, 3, 3, '8-10', 8, 120, 'Keep torso at roughly 45 degrees.'),
  (t_pull, e_cable_row, 4, 3, '10-12', 7, 90, 'Squeeze shoulder blades at contraction.'),
  (t_pull, e_face_pull, 5, 4, '15-20', 7, 60, 'Shoulder health exercise. Do not skip.'),
  (t_pull, e_bb_curl, 6, 3, '8-10', 8, 60, 'Strict form, no swinging.'),
  (t_pull, e_hammer_curl, 7, 3, '10-12', 8, 60, 'Builds arm thickness.');

  -- Legs Day
  INSERT INTO workout_templates (id, name, description, category, day_of_week, estimated_duration_minutes, is_shared)
  VALUES (gen_random_uuid(), 'PPL - Leg Day', 'Leg day targeting quads, hamstrings, glutes, and calves. Part of the Push/Pull/Legs split.', 'legs', 3, 70, true)
  RETURNING id INTO t_legs;

  INSERT INTO workout_template_exercises (template_id, exercise_id, sort_order, target_sets, target_reps, target_rpe, rest_seconds, notes) VALUES
  (t_legs, e_squat, 1, 4, '6-8', 8, 180, 'Main compound. Work up to working weight.'),
  (t_legs, e_rdl, 2, 3, '8-10', 8, 120, 'Hinge at hips. Feel the hamstring stretch.'),
  (t_legs, e_leg_press, 3, 3, '10-12', 8, 120, 'Full range of motion.'),
  (t_legs, e_leg_ext, 4, 3, '12-15', 8, 60, 'Squeeze quads at the top.'),
  (t_legs, e_leg_curl, 5, 3, '10-12', 8, 60, 'Control the negative.'),
  (t_legs, e_hip_thrust, 6, 3, '10-12', 8, 90, 'Squeeze glutes hard at the top.'),
  (t_legs, e_calf_raise, 7, 4, '15-20', 8, 60, 'Full stretch at the bottom, pause at the top.');

  -- ========================================
  -- UPPER / LOWER SPLIT
  -- ========================================

  -- Upper Day
  INSERT INTO workout_templates (id, name, description, category, day_of_week, estimated_duration_minutes, is_shared)
  VALUES (gen_random_uuid(), 'Upper/Lower - Upper Day', 'Upper body day hitting chest, back, shoulders, and arms. Run this 2x/week.', 'compound', 1, 65, true)
  RETURNING id INTO t_upper;

  INSERT INTO workout_template_exercises (template_id, exercise_id, sort_order, target_sets, target_reps, target_rpe, rest_seconds, notes) VALUES
  (t_upper, e_bench, 1, 4, '6-8', 8, 180, 'Primary pressing movement.'),
  (t_upper, e_bb_row, 2, 4, '6-8', 8, 120, 'Primary pulling movement.'),
  (t_upper, e_db_shoulder_press, 3, 3, '8-10', 8, 120, 'Strict press, back against the pad.'),
  (t_upper, e_lat_pulldown, 4, 3, '10-12', 7, 90, 'Wide grip for lat width.'),
  (t_upper, e_db_fly, 5, 3, '12-15', 7, 60, 'Chest isolation finisher.'),
  (t_upper, e_face_pull, 6, 3, '15-20', 7, 60, 'Rear delt and rotator cuff health.'),
  (t_upper, e_bb_curl, 7, 2, '10-12', 8, 60, NULL),
  (t_upper, e_pushdown, 8, 2, '10-12', 8, 60, NULL);

  -- Lower Day
  INSERT INTO workout_templates (id, name, description, category, day_of_week, estimated_duration_minutes, is_shared)
  VALUES (gen_random_uuid(), 'Upper/Lower - Lower Day', 'Lower body day with squat and hinge patterns plus accessories. Run this 2x/week.', 'legs', 2, 60, true)
  RETURNING id INTO t_lower;

  INSERT INTO workout_template_exercises (template_id, exercise_id, sort_order, target_sets, target_reps, target_rpe, rest_seconds, notes) VALUES
  (t_lower, e_squat, 1, 4, '6-8', 8, 180, 'Primary quad dominant movement.'),
  (t_lower, e_rdl, 2, 3, '8-10', 8, 120, 'Primary hip hinge movement.'),
  (t_lower, e_bulgarian, 3, 3, '10-12', 8, 90, 'Single leg work for balance and hypertrophy.'),
  (t_lower, e_leg_curl, 4, 3, '10-12', 8, 60, 'Hamstring isolation.'),
  (t_lower, e_hip_thrust, 5, 3, '10-12', 8, 90, 'Glute focus.'),
  (t_lower, e_calf_raise, 6, 4, '15-20', 8, 60, 'Calves need volume and stretch.'),
  (t_lower, e_hanging_leg_raise, 7, 3, '10-15', 7, 60, 'Core work to finish.');

  -- ========================================
  -- FULL BODY BEGINNER (3x/week)
  -- ========================================

  INSERT INTO workout_templates (id, name, description, category, day_of_week, estimated_duration_minutes, is_shared)
  VALUES (gen_random_uuid(), 'Full Body Beginner (3x/week)', 'A balanced full body routine for beginners. Perform 3 times per week with rest days between sessions. Focuses on compound movements with simple progressions.', 'compound', NULL, 50, true)
  RETURNING id INTO t_full_body;

  INSERT INTO workout_template_exercises (template_id, exercise_id, sort_order, target_sets, target_reps, target_rpe, rest_seconds, notes) VALUES
  (t_full_body, e_goblet_squat, 1, 3, '10-12', 7, 120, 'Learn the squat pattern before moving to barbell.'),
  (t_full_body, e_pushup, 2, 3, '8-12', 7, 90, 'Use knees or incline if needed. Progress to full push-ups.'),
  (t_full_body, e_lat_pulldown, 3, 3, '10-12', 7, 90, 'Build pulling strength before attempting pull-ups.'),
  (t_full_body, e_db_reverse_lunge, 4, 3, '10 each', 7, 90, 'Start with bodyweight if dumbbells are too heavy.'),
  (t_full_body, e_db_shoulder_press, 5, 3, '10-12', 7, 90, 'Seated with back support.'),
  (t_full_body, e_db_row, 6, 3, '10-12', 7, 60, 'One arm at a time braced on a bench.'),
  (t_full_body, e_plank, 7, 3, '30-60 sec', 7, 60, 'Build up time gradually. Keep hips level.');

END $$;
