// =============================================================================
// TRANSFORMR — Coachmark Step Content
// Text content for the 12 screen first-run tours.
// Coordinates are filled at runtime via ref.measure() in each screen.
// =============================================================================

export const COACHMARK_KEYS = {
  dashboard:     'dashboard_v1',
  workoutPlayer: 'workout_player_v1',
  nutrition:     'nutrition_daily_v1',
  goals:         'goals_v1',
  business:      'business_dashboard_v1',
  sleep:           'sleep_v1',
  mood:            'mood_v1',
  addFood:         'add_food_v1',
  mealCamera:      'meal_camera_v1',
  painTracker:     'pain_tracker_v1',
  dashboardBuilder:'dashboard_builder_v1',
  stakeGoals:      'stake_goals_v1',
} as const;

export interface CoachmarkContent {
  title: string;
  body: string;
  position: 'above' | 'below';
}

export const COACHMARK_CONTENT: Record<keyof typeof COACHMARK_KEYS, CoachmarkContent[]> = {
  dashboard: [
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
  sleep: [
    {
      title: 'Log Your Sleep',
      body: 'Tap the button to record last night\'s bedtime, wake time, and quality. Use the time picker wheels to set times quickly.',
      position: 'below',
    },
    {
      title: 'Sleep Quality Stars',
      body: 'Rate how restored you feel. This directly affects your readiness score and today\'s AI coaching.',
      position: 'below',
    },
    {
      title: 'AI Sleep Recommendations',
      body: 'After 5+ sleep logs, your AI coach identifies patterns and suggests optimizations specific to your data.',
      position: 'above',
    },
  ],
  mood: [
    {
      title: 'Drag the Sliders',
      body: 'Set your mood, energy, stress, and motivation levels by dragging each slider. This takes 10 seconds and feeds your readiness score.',
      position: 'below',
    },
    {
      title: 'Context Matters',
      body: 'Select when you\'re logging (morning, midday, evening, post-workout). Context helps your AI coach detect time-of-day patterns.',
      position: 'above',
    },
  ],
  addFood: [
    {
      title: 'Search or Scan',
      body: 'Type a food name to search 3M+ items. Or use the camera/barcode icons in the header for faster logging.',
      position: 'below',
    },
    {
      title: 'Batch Logging',
      body: 'Tap "Add & Continue" to queue multiple items, then "Log All" to save them in one batch. Saves time for full meals.',
      position: 'above',
    },
  ],
  mealCamera: [
    {
      title: 'Frame Your Food',
      body: 'Center all food items in the frame. Good lighting and a clear view of everything dramatically improves accuracy.',
      position: 'below',
    },
    {
      title: 'Review Estimates',
      body: 'Toggle items on or off, adjust quantities, and check the confidence badge before logging. You can always edit after.',
      position: 'above',
    },
  ],
  painTracker: [
    {
      title: 'Tap the Body Map',
      body: 'Tap the area where you feel pain or soreness. Your AI coach uses this to adjust workout recommendations and flag injury risk.',
      position: 'below',
    },
    {
      title: 'Pain Scale',
      body: '1-3 is normal training soreness. 4-6 means reduce load. 7-10 means rest and consult a professional.',
      position: 'above',
    },
  ],
  dashboardBuilder: [
    {
      title: 'Drag to Reorder',
      body: 'Press and hold any widget, then drag it to change its position on your Dashboard. Put the metrics you check most at the top.',
      position: 'below',
    },
    {
      title: 'Toggle Visibility',
      body: 'Tap the eye icon to show or hide a widget. Hidden widgets still track data, they just won\'t appear on your Dashboard.',
      position: 'above',
    },
  ],
  stakeGoals: [
    {
      title: 'Put Money on It',
      body: 'Set a goal, a deadline, and a dollar amount. Hit the goal and your money is returned. Miss it and it goes to charity.',
      position: 'below',
    },
    {
      title: 'Evaluation Dots',
      body: 'Each dot represents one evaluation period. Green = passed, red = missed. Your pass rate determines your stake return.',
      position: 'above',
    },
  ],
};
