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

} satisfies Record<string, HelpContent>;
