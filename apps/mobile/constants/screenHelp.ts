// =============================================================================
// TRANSFORMR — Screen-Level Help Content
// Content for every screen's header ? button.
// =============================================================================

import type { HelpContent } from './helpContent';

export const SCREEN_HELP = {

  dashboard: {
    title: 'Dashboard',
    body: 'Your mission control. Every metric that matters to your transformation is here. The countdown keeps you honest. The readiness score guides your effort level. The AI coach tells you what to do next.',
    learnMoreItems: [
      { label: 'Readiness ring', value: 'How hard to push today' },
      { label: 'Macro rings', value: 'Calorie and protein progress' },
      { label: 'AI Insight card', value: 'Your personalized coaching card' },
      { label: 'Streak counter', value: 'Consecutive days with habit completions' },
    ],
    proTip: 'Check your dashboard every morning before you check anything else. It sets your intention for the day.',
  },

  fitnessHome: {
    title: 'Fitness',
    body: 'Where your physical transformation is tracked, planned, and measured. Start a workout from here, review your progress, check your exercise form, or browse programs.',
    learnMoreItems: [
      { label: 'Start Workout', value: 'Begin a tracked session with ghost mode and PR detection' },
      { label: 'Programs', value: 'Structured multi-week training plans' },
      { label: 'Progress', value: 'Weight, measurements, and strength trends over time' },
      { label: 'Form Check', value: 'AI video analysis of your exercise technique' },
    ],
    proTip: 'Use a program instead of random workouts. Progressive structure produces 3x better results.',
  },

  workoutPlayer: {
    title: 'Active Workout',
    body: 'Log every set as you do it. Your ghost data shows previous performance. PRs are detected automatically. The rest timer keeps your recovery intervals precise.',
    learnMoreItems: [
      { label: 'Ghost data', value: 'Greyed numbers = what you lifted last session' },
      { label: 'RPE', value: 'Rate of Perceived Exertion — how hard the set felt (1–10)' },
      { label: 'Rest timer', value: 'Auto-starts after each set, haptic alert on complete' },
      { label: 'End Workout', value: 'Always visible — tap to finish and see your summary' },
    ],
    proTip: 'Log every set even if you miss the target. Accurate data beats flattering data.',
  },

  workoutSummary: {
    title: 'Workout Summary',
    body: 'Your complete session breakdown — total volume, sets per exercise, PRs broken, estimated calories burned, and your AI coach\'s feedback on the session.',
    proTip: 'Review your summary before closing. Your AI coach uses this data to plan your next session.',
  },

  nutritionHome: {
    title: 'Nutrition',
    body: 'Track everything you eat and drink. The macro rings show your daily progress. Log with the camera, a barcode scan, or a search. Hit protein first — everything else follows.',
    learnMoreItems: [
      { label: 'Macro rings', value: 'Calories, protein, carbs, fat vs daily targets' },
      { label: 'Meal timeline', value: 'Everything logged today, organized by meal' },
      { label: 'Water tracker', value: 'Daily hydration vs target' },
      { label: 'AI Meal Camera', value: 'Photo-to-macros in under 5 seconds' },
    ],
    proTip: 'Log meals within 15 minutes of eating. Memory degrades fast and portion estimates get worse.',
  },

  addFood: {
    title: 'Add Food',
    body: 'Search our database of 3 million+ foods and enter the portion size you actually ate. Select the meal it belongs to and confirm.',
    proTip: 'Search by brand name for packaged foods. The barcode scanner is faster for anything with a barcode.',
  },

  mealCamera: {
    title: 'AI Meal Camera',
    body: 'Take a photo of any food and your AI will estimate the calories and macros within seconds. Review and edit the estimates before confirming.',
    proTip: 'Good lighting and a clear view of all food items dramatically improves accuracy. Include a hand for scale.',
  },

  supplements: {
    title: 'Supplements',
    body: 'Track which supplements you\'ve taken today. Log new supplements to your stack, and let the AI advisor review whether your current stack is optimal for your goals.',
    proTip: 'Log supplements at the same time each day to build accurate timing data for the AI advisor.',
  },

  habitsScreen: {
    title: 'Daily Habits',
    body: 'The foundation of your transformation. Each habit you complete today builds your streak. Complete them all to maximize your Day Score.',
    learnMoreItems: [
      { label: 'Toggle to complete', value: 'Tap the circle on the right to mark done' },
      { label: 'Streak count', value: 'Consecutive days you completed this habit' },
      { label: 'Add habit', value: 'Tap + to create a new daily habit' },
    ],
    proTip: 'Start with your most important habit and do it first. Decision fatigue makes evening habits harder to keep.',
  },

  sleepScreen: {
    title: 'Sleep Tracker',
    body: 'Sleep is when your body grows and your mind consolidates. Logging sleep quality drives your readiness score and lets your AI coach identify patterns that affect your performance.',
    learnMoreItems: [
      { label: 'Log Sleep', value: 'Record bedtime, wake time, and quality rating' },
      { label: 'Duration', value: 'Automatically calculated from your times' },
      { label: 'Quality', value: '1–5 star rating of how restored you felt' },
    ],
    proTip: 'Log sleep within 30 minutes of waking up while the quality rating is still accurate.',
  },

  moodScreen: {
    title: 'Mood & Energy Check-in',
    body: 'Log your mood and energy levels daily. This data feeds your readiness score and helps your AI coach detect patterns between your mental state and physical performance.',
    proTip: 'Even 10 seconds on this screen daily builds weeks of pattern data. Consistency matters more than detail.',
  },

  journalScreen: {
    title: 'Journal',
    body: 'Your AI coach generates a personalized opening prompt based on today\'s data, then steps back. This is your space to reflect, plan, and think clearly.',
    learnMoreItems: [
      { label: 'AI prompt', value: 'Personalized to your current data and goals' },
      { label: 'Mood rating', value: 'Emoji selector before writing' },
      { label: 'Private by default', value: 'Toggle to share with your partner if linked' },
    ],
    proTip: 'Write for at least 5 minutes. The first 2 minutes are warmup. The insight comes in minute 3.',
  },

  focusModeScreen: {
    title: 'Deep Work Focus Mode',
    body: 'A Pomodoro timer that blocks distractions during deep work sessions. Each session logs to your productivity history and feeds the body-business correlation.',
    proTip: 'Stack focus sessions right after workouts — that\'s when your cognitive output is highest.',
  },

  visionBoardScreen: {
    title: 'Vision Board',
    body: 'Add images that represent your goals — the body you\'re building, the business you\'re growing, the lifestyle you\'re earning. Review it daily to stay connected to your why.',
    proTip: 'Review your vision board every morning. Visual goal priming improves daily action alignment.',
  },

  goalsHome: {
    title: 'Goals',
    body: 'Every domain of your transformation lives here — body, business, habits, sleep, and focus. Set goals with deadlines and track them all in one place.',
    learnMoreItems: [
      { label: 'Active goals', value: 'Goals with a deadline you\'re currently working toward' },
      { label: 'Category filter', value: 'Filter by fitness, business, personal, and more' },
      { label: 'Progress ring', value: 'Visual indicator of completion toward target value' },
    ],
    proTip: 'Goals with a specific target date and value are 3x more likely to be achieved than vague goals.',
  },

  businessDashboard: {
    title: 'Business Dashboard',
    body: 'Track every dollar you generate and watch your path to the revenue milestone. Your health and wealth are connected — this dashboard proves it.',
    learnMoreItems: [
      { label: 'Monthly Revenue', value: 'Sum of all logged revenue this month' },
      { label: 'MRR', value: 'Recurring monthly revenue (subscriptions + retainers)' },
      { label: 'Correlation', value: 'Statistical link between your health habits and revenue' },
    ],
    proTip: 'Log revenue immediately when it lands. Delayed logging leads to missed entries.',
  },

  financeHome: {
    title: 'Personal Finance',
    body: 'Track accounts, log transactions, set budgets, and monitor your net worth. Financial clarity reduces stress — and lower stress improves performance.',
    learnMoreItems: [
      { label: 'Net Worth', value: 'Total assets minus total liabilities' },
      { label: 'Budget vs Actual', value: 'Spending by category this month' },
      { label: 'Transactions', value: 'Manual entry — log every income and expense' },
    ],
    proTip: 'Check net worth monthly, not daily. Daily fluctuations cause anxiety. Monthly trends reveal reality.',
  },

  profileHome: {
    title: 'Profile & Settings',
    body: 'Customize your experience, connect your partner, configure notifications, and manage your account.',
    learnMoreItems: [
      { label: 'Appearance', value: 'Dark, light, or system theme' },
      { label: 'Coaching Tone', value: 'How your AI coach communicates with you' },
      { label: 'Partner', value: 'Link accounts for couples features' },
      { label: 'Achievements', value: 'All earned badges and milestones' },
    ],
    proTip: 'Set your coaching tone first. It affects every AI interaction in the app.',
  },

  achievementsScreen: {
    title: 'Achievements',
    body: 'Every badge you\'ve earned across fitness, nutrition, habits, business, and consistency milestones. Your permanent record of what you\'ve built.',
    proTip: 'Share achievements with your partner — celebration accelerates motivation for both of you.',
  },

  dashboardBuilderScreen: {
    title: 'Dashboard Builder',
    body: 'Drag and drop widgets to customize exactly what you see on your Dashboard. Add the metrics that matter most to you, remove the ones you don\'t need, and reorder everything to match your daily routine.',
    proTip: 'Put your single most important metric at the very top. For most users, that\'s either weight or revenue.',
  },

  dataExportScreen: {
    title: 'Export Your Data',
    body: 'Export all of your TRANSFORMR data — workouts, nutrition, sleep, habits, business metrics, and journal entries — as a CSV or JSON file. Your data belongs to you.',
    proTip: 'Export monthly and save to cloud storage. A year of transformation data is something worth keeping forever.',
  },

  // ─── FITNESS SCREENS ───────────────────────────────────────────────────────

  exercisesLibrary: {
    title: 'Exercise Library',
    body: 'Browse and search over 500 exercises with instructions, muscle group targets, and difficulty ratings. Tap any exercise to see form cues and add it to your workout.',
    learnMoreItems: [
      { label: 'Filter by muscle', value: 'Target specific muscle groups' },
      { label: 'Filter by equipment', value: 'Bodyweight, barbell, dumbbell, machine' },
      { label: 'Add to workout', value: 'Tap + to add directly to your active session' },
    ],
    proTip: 'Save your favorites by tapping the bookmark icon. They\'ll appear at the top of search results.',
  },

  exerciseDetail: {
    title: 'Exercise Detail',
    body: 'Full instructions, target muscles, difficulty rating, and your personal history for this exercise — including your all-time PRs and recent performance trend.',
    learnMoreItems: [
      { label: 'PR history', value: 'Your best weight, reps, and estimated 1RM ever logged' },
      { label: 'Muscle diagram', value: 'Primary and secondary muscles worked' },
      { label: 'Form cues', value: 'Key technique points to watch during the set' },
    ],
    proTip: 'Review your history before attempting a PR. Knowing your trend helps you set a realistic target.',
  },

  progressScreen: {
    title: 'Progress Tracking',
    body: 'Your full transformation history — body measurements, strength trends, and visual progress over time. Charts update automatically as you log.',
    learnMoreItems: [
      { label: 'Weight chart', value: 'Bodyweight over time vs your goal weight' },
      { label: 'Strength curves', value: 'Best lifts per exercise over time' },
      { label: 'Measurements', value: 'Chest, waist, arms, and more' },
    ],
    proTip: 'Track measurements every 4 weeks. Daily weight fluctuates too much to be meaningful.',
  },

  programsScreen: {
    title: 'Training Programs',
    body: 'Structured multi-week training plans with progressive overload built in. Follow a program instead of random workouts — it produces 3x better results.',
    learnMoreItems: [
      { label: 'Beginner programs', value: '3-day full body — builds foundation' },
      { label: 'Intermediate', value: '4-day upper/lower splits' },
      { label: 'Advanced', value: '5-6 day PPL and specialization programs' },
    ],
    proTip: 'Run a full 8–12 week program before switching. Results compound in the last 4 weeks.',
  },

  formCheckScreen: {
    title: 'AI Form Check',
    body: 'Record a set and your AI coach analyzes your technique — identifying form breakdowns, compensations, and injury risks before they become problems.',
    proTip: 'Film from the side for deadlifts and squats. Front angle works best for pressing movements.',
  },

  painTrackerScreen: {
    title: 'Pain & Soreness Tracker',
    body: 'Log any pain or soreness so your AI coach can adjust your training load and flag patterns that predict injury. Tap the body map to mark the location.',
    learnMoreItems: [
      { label: 'Pain 1–3', value: 'Normal training soreness — adjust volume' },
      { label: 'Pain 4–6', value: 'Monitor closely — reduce load on affected area' },
      { label: 'Pain 7–10', value: 'Rest and consult a professional' },
    ],
    proTip: 'Log pain the day after hard sessions. DOMS peaks 24–48 hours after training.',
  },

  mobilityScreen: {
    title: 'Mobility & Flexibility',
    body: 'Guided mobility routines targeting your tightest areas. Mobility work improves performance, reduces injury risk, and accelerates recovery between sessions.',
    proTip: 'Even 10 minutes of mobility work after every session compounds into significant gains over a year.',
  },

  // ─── GOALS SCREENS ─────────────────────────────────────────────────────────

  challengesScreen: {
    title: 'Challenges',
    body: 'Time-bound fitness and habit challenges to push you beyond your comfort zone. Complete challenges to earn bonus XP, badges, and streak shields.',
    learnMoreItems: [
      { label: 'Solo challenges', value: 'Personal bests and streak targets' },
      { label: 'Partner challenges', value: 'Head-to-head with your linked partner' },
      { label: 'Community challenges', value: 'Compete with the TRANSFORMR community' },
    ],
    proTip: 'Stack a challenge on top of your current program — don\'t replace the program with it.',
  },

  challengeDetailScreen: {
    title: 'Challenge Details',
    body: 'The full rules, scoring, and leaderboard for this challenge. Check your progress daily and make sure you\'re logging the required activities.',
    proTip: 'Log the challenge activity at the same time every day. Consistency in timing builds the habit faster.',
  },

  challengeActiveScreen: {
    title: 'Active Challenge',
    body: 'You\'re in the middle of a challenge. Log today\'s required activity to keep your streak alive and climb the leaderboard.',
    proTip: 'Never skip a challenge day — partial completion still counts toward your streak and leaderboard position.',
  },

  skillsScreen: {
    title: 'Skills Development',
    body: 'Track non-physical skills you\'re developing — languages, instruments, coding, business skills. Skills log to your transformation record and feed the AI\'s holistic coaching.',
    proTip: 'Pair skill practice with a physical habit — same time, same location. Habit stacking locks them in faster.',
  },

  stakeGoalsScreen: {
    title: 'Stake Goals',
    body: 'Put real money on the line for your goals. Set a target, a deadline, and a stake amount. If you hit the goal, your money is returned. If you miss it, the funds go to charity.',
    learnMoreItems: [
      { label: 'Minimum stake', value: '$5 — enough to feel it' },
      { label: 'Verification', value: 'Photo proof or logged data confirms completion' },
      { label: 'Charity selection', value: 'Choose any verified charity on the platform' },
    ],
    proTip: 'Start small — a $20 stake creates the psychological weight without financial risk.',
  },

  goalDetailScreen: {
    title: 'Goal Detail',
    body: 'Full view of this goal — progress toward target, activity log, milestone history, and AI coaching recommendations specific to this goal.',
    proTip: 'Review goal progress weekly, not daily. Daily variance is noise — weekly trends are signal.',
  },

  insightsScreen: {
    title: 'AI Insights',
    body: 'Deep analysis of your performance patterns across all domains. Your AI coach identifies what\'s working, what\'s not, and where your biggest leverage is.',
    proTip: 'Read your weekly insight report every Sunday night. It sets your intention for the week ahead.',
  },

  communityScreen: {
    title: 'Community',
    body: 'Connect with other TRANSFORMR members on the same journey. Share wins, accountability check-ins, and transformation milestones.',
    proTip: 'Posting a public commitment to your goal dramatically increases follow-through. Share it.',
  },

  // ─── NUTRITION SCREENS ─────────────────────────────────────────────────────

  analyticsScreen: {
    title: 'Nutrition Analytics',
    body: 'Deep-dive into your eating patterns — macro trends over time, meal timing, most-logged foods, and adherence to your calorie target.',
    learnMoreItems: [
      { label: 'Macro trend', value: 'Weekly average protein, carbs, fat vs targets' },
      { label: 'Calorie adherence', value: 'Days you hit your calorie target this month' },
      { label: 'Meal timing', value: 'Distribution of calories across the day' },
    ],
    proTip: 'Aim for calorie adherence above 80%. 80% of days on-target produces 95% of the results.',
  },

  barcodeScannerScreen: {
    title: 'Barcode Scanner',
    body: 'Scan any food barcode to instantly pull up the nutrition facts from our database of 3M+ products. Select your serving size and add to your meal log.',
    proTip: 'Scan before you eat, not after. Pre-logging prevents over-eating and takes 5 seconds.',
  },

  groceryListScreen: {
    title: 'Grocery List',
    body: 'A smart shopping list that generates automatically from your meal plan. Check off items as you shop and add extras for the week.',
    proTip: 'Shop from your grocery list weekly. Having the right food at home eliminates 90% of bad eating decisions.',
  },

  mealPlansScreen: {
    title: 'Meal Plans',
    body: 'AI-generated weekly meal plans calibrated to your macro targets. Each plan is built around foods you\'ve logged before, so it fits your actual preferences.',
    proTip: 'Run the same meal plan for 2 weeks before switching — repetition makes logging faster and eating automatic.',
  },

  mealPrepScreen: {
    title: 'Meal Prep',
    body: 'Your weekly prep checklist and schedule. Batch cooking on Sunday reduces decision fatigue and ensures you hit your macro targets Monday–Friday.',
    proTip: 'Prep protein first — it\'s the hardest macro to hit on the fly. Having cooked chicken or beef ready fixes most days.',
  },

  menuScannerScreen: {
    title: 'Menu Scanner',
    body: 'Point at any restaurant menu and your AI will estimate the calories and macros for the dishes. Great for tracking when eating out.',
    proTip: 'For restaurant meals, estimate slightly high on calories. Hidden oils and butter add 20–30% to what you\'d expect.',
  },

  savedMealsScreen: {
    title: 'Saved Meals',
    body: 'Your most-logged meal combinations saved as one-tap entries. Add any meal here to avoid re-logging the same foods every day.',
    proTip: 'Save your top 5 go-to meals. Consistent meal rotation makes hitting your macros automatic.',
  },

  // ─── PROFILE SCREENS ───────────────────────────────────────────────────────

  editProfileScreen: {
    title: 'Edit Profile',
    body: 'Update your name, photo, body stats, and fitness goals. Keeping your profile current improves the accuracy of your macro targets and AI coaching.',
    proTip: 'Update your weight every 4 weeks. Macro and calorie targets recalculate automatically when you do.',
  },

  partnerScreen: {
    title: 'Partner Link',
    body: 'Link your TRANSFORMR account with your partner\'s to enable joint streaks, shared accountability, and couples-specific insights.',
    learnMoreItems: [
      { label: 'Joint streak', value: 'Consecutive days you both completed a habit' },
      { label: 'Partner dashboard', value: 'See their key metrics (with permission)' },
      { label: 'Partner challenges', value: 'Head-to-head accountability bets' },
    ],
    proTip: 'Share your countdown date with your partner. Shared deadlines create shared accountability.',
  },

  integrationsScreen: {
    title: 'Integrations',
    body: 'Connect TRANSFORMR to your wearables, health apps, and calendar. The more data that flows in automatically, the smarter your AI coaching becomes.',
    learnMoreItems: [
      { label: 'Apple Health', value: 'Auto-import steps, sleep, and heart rate' },
      { label: 'Google Fit', value: 'Sync workouts and activity data' },
      { label: 'Garmin / Oura', value: 'Import HRV and recovery scores' },
    ],
    proTip: 'Connect your wearable first — it dramatically improves your readiness score accuracy.',
  },

  notificationsSettingsScreen: {
    title: 'Notification Settings',
    body: 'Control exactly what TRANSFORMR notifies you about and when. Keep the alerts that drive action and mute the ones that just add noise.',
    proTip: 'Enable the daily 8am coaching card notification. It sets the right mindset before the day gets away from you.',
  },

  nfcSetupScreen: {
    title: 'NFC Quick Log',
    body: 'Program NFC tags to trigger instant logging actions — tap your gym bag to start a workout, tap the kitchen counter to open the meal logger.',
    proTip: 'Place an NFC tag on your bathroom scale. One tap → weight log screen. 10 seconds to track every morning.',
  },

  aboutScreen: {
    title: 'About TRANSFORMR',
    body: 'App version, legal information, support links, and the TRANSFORMR mission — building the most comprehensive personal transformation system for entrepreneurs.',
    proTip: 'Follow us on social media for transformation stories, feature announcements, and weekly challenges.',
  },

} satisfies Record<string, HelpContent>;
