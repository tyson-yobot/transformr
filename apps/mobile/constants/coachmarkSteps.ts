// =============================================================================
// TRANSFORMR — Coachmark Step Content
// Text content for the 5 priority screen first-run tours.
// Coordinates are filled at runtime via ref.measure() in each screen.
// =============================================================================

export const COACHMARK_KEYS = {
  dashboard:     'dashboard_v1',
  workoutPlayer: 'workout_player_v1',
  nutrition:     'nutrition_daily_v1',
  goals:         'goals_v1',
  business:      'business_dashboard_v1',
} as const;

export interface CoachmarkContent {
  title: string;
  body: string;
  position: 'above' | 'below';
}

export const COACHMARK_CONTENT: Record<keyof typeof COACHMARK_KEYS, CoachmarkContent[]> = {
  dashboard: [
    {
      title: 'Your Transformation Hub',
      body: 'Everything starts here. Your countdown, readiness score, macros, and AI coaching card give you today\'s full picture at a glance.',
      position: 'below',
    },
    {
      title: 'Daily Readiness Score',
      body: 'This tells you how hard to push today. Green = go hard. Yellow = moderate. Red = recovery day. Tap the ⓘ to learn how it\'s calculated.',
      position: 'below',
    },
    {
      title: 'Your AI Coach',
      body: 'This card reads your actual data and gives you one specific action for today. The more you log, the smarter it gets.',
      position: 'above',
    },
    {
      title: 'Quick Actions',
      body: 'One tap to start your workout, log a meal, or check in. The fastest path to the most common actions.',
      position: 'above',
    },
  ],
  workoutPlayer: [
    {
      title: 'Ghost Mode',
      body: 'The greyed numbers in the input fields are what you lifted last time. Beat them every set to guarantee progress.',
      position: 'below',
    },
    {
      title: 'Log Your Set',
      body: 'Enter weight and reps, then tap Log. Each set saves instantly — even without internet.',
      position: 'below',
    },
    {
      title: 'Rest Timer',
      body: 'Starts automatically after each set. You\'ll feel a haptic tap when it\'s time to go again.',
      position: 'above',
    },
  ],
  nutrition: [
    {
      title: 'Your Macro Rings',
      body: 'These four rings show how close you are to your daily targets. Protein is the most important — hit it first.',
      position: 'below',
    },
    {
      title: 'Log a Meal Fast',
      body: 'Camera, barcode, or search — three ways to log in under 10 seconds. Tap any icon to get started.',
      position: 'above',
    },
    {
      title: 'Water Tracker',
      body: 'Tap +8oz every time you drink a glass. Hitting your water target improves readiness score and recovery.',
      position: 'above',
    },
  ],
  goals: [
    {
      title: 'Your Transformation Goals',
      body: 'Every domain of your life lives here — habits, sleep, focus, business, and finance. Log consistently to unlock AI insights.',
      position: 'below',
    },
    {
      title: 'Daily Habits',
      body: 'Toggle each habit complete as you do it. Your streak grows with every day you complete at least one.',
      position: 'below',
    },
  ],
  business: [
    {
      title: 'Revenue Dashboard',
      body: 'Track every dollar and watch your MRR grow toward your goal. Log revenue the day it comes in.',
      position: 'below',
    },
    {
      title: 'Body-Business Correlation',
      body: 'This shows the statistical link between your health habits and your revenue. The more you track both, the clearer the pattern.',
      position: 'above',
    },
  ],
};
