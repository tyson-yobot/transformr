// =============================================================================
// TRANSFORMR — Help Content
// Single source of truth for all inline metric/feature help across the app.
// =============================================================================

export interface HelpContent {
  title: string;
  body: string;
  proTip?: string;
  learnMoreItems?: { label: string; value: string }[];
}

export const HELP = {

  // ─── DASHBOARD ─────────────────────────────────────────────────────────────

  readinessScore: {
    title: 'Daily Readiness Score',
    body:
      'Your readiness score (0–100) tells you how prepared your body is to perform today. ' +
      'It is calculated from your sleep quality, mood and energy levels, recent training ' +
      'load, and any active injuries or soreness.',
    learnMoreItems: [
      { label: 'Green (75–100)', value: 'Push hard — your body is ready' },
      { label: 'Yellow (50–74)', value: 'Moderate intensity — listen to your body' },
      { label: 'Red (0–49)', value: 'Active recovery — rest is training too' },
    ],
    proTip:
      'Log sleep and mood every day to get an accurate score. The more data you give it, ' +
      'the smarter it gets.',
  },

  streakCounter: {
    title: 'Your Streak',
    body:
      'Your streak counts consecutive days where you completed at least one habit. ' +
      'Missing a day resets it to zero — unless you have a Streak Shield.',
    learnMoreItems: [
      { label: 'Streak Shield', value: 'Earn 1 shield every 30 days — absorbs 1 missed day' },
      { label: 'Milestones', value: '7, 14, 30, 60, 90, 180, 365 days' },
    ],
    proTip:
      'Even completing one small habit on a hard day keeps your streak alive. ' +
      'Consistency beats perfection.',
  },

  countdown: {
    title: 'Your Countdown',
    body:
      'This is the number of days until your primary deadline — the date you set as the ' +
      'target for your transformation. Every feature in the app is oriented around this date.',
    proTip:
      'You can change your countdown date anytime in Profile → Goals. Set a date that ' +
      'excites and challenges you.',
  },

  aiInsightCard: {
    title: 'Your AI Coach',
    body:
      'This card is generated fresh every 6 hours by your personal AI coach. It reads ' +
      'your actual data — sleep, workouts, nutrition, mood, business metrics — and gives ' +
      'you one specific, actionable recommendation for today.',
    proTip:
      'The more data you log, the smarter and more specific your coaching becomes. ' +
      'Generic advice means you need to log more.',
  },

  bodyBusinessCorrelation: {
    title: 'Body-Business Correlation',
    body:
      'TRANSFORMR tracks the statistical relationship between your physical health and ' +
      'your business performance. Research consistently shows that workout days produce ' +
      'higher cognitive output, better decisions, and more revenue.',
    learnMoreItems: [
      { label: 'Strong positive (0.7+)', value: 'Your health directly drives revenue' },
      { label: 'Moderate (0.4–0.7)', value: 'Clear link, build more data to confirm' },
      { label: 'Weak (0–0.4)', value: 'More data needed — keep logging both' },
    ],
    proTip: 'Log revenue on the same day as workouts to build the correlation dataset faster.',
  },

  // ─── FITNESS ───────────────────────────────────────────────────────────────

  ghostMode: {
    title: 'Ghost Mode',
    body:
      'Ghost mode shows you the exact weight and reps you lifted the last time you did ' +
      'this workout. The ghost data appears as greyed-out placeholders in your set inputs. ' +
      'Beat your ghost on every set to guarantee progressive overload.',
    proTip: 'Even beating the ghost by 1 rep or 2.5 lbs every week adds up to massive gains over a year.',
  },

  rpeRating: {
    title: 'RPE — Rate of Perceived Exertion',
    body:
      'RPE is a 1–10 scale of how hard a set felt. 1 is barely moving. 10 is the absolute ' +
      'maximum you can do. Logging RPE helps your AI coach understand your actual training ' +
      'intensity, not just the numbers on the bar.',
    learnMoreItems: [
      { label: 'RPE 6', value: 'Could do 4 more reps easily' },
      { label: 'RPE 8', value: 'Could do 2 more reps' },
      { label: 'RPE 9', value: 'Could do 1 more rep' },
      { label: 'RPE 10', value: 'Absolute maximum — no more reps possible' },
    ],
    proTip: 'Most working sets should be RPE 7–8. RPE 10 every set leads to burnout and injury.',
  },

  personalRecord: {
    title: 'Personal Record (PR)',
    body:
      'A PR is logged automatically when you surpass your best-ever performance for an ' +
      'exercise — whether that is max weight, max reps at a given weight, or max total volume ' +
      'in a single session.',
    proTip: 'TRANSFORMR tracks 4 types of PRs: 1-rep max, reps at weight, volume per session, and estimated 1RM.',
  },

  restTimer: {
    title: 'Rest Timer',
    body:
      'The rest timer starts automatically after each logged set. It counts down from your ' +
      'target rest period and alerts you with a haptic when it\'s time to go again.',
    learnMoreItems: [
      { label: 'Strength (heavy, 1–5 rep)', value: '3–5 minutes' },
      { label: 'Hypertrophy (6–12 rep)', value: '60–120 seconds' },
      { label: 'Endurance (15+ rep)', value: '30–60 seconds' },
    ],
    proTip: 'You can adjust the default rest time in Profile → Fitness Settings.',
  },

  // ─── NUTRITION ─────────────────────────────────────────────────────────────

  macroRings: {
    title: 'Your Macro Rings',
    body:
      'The four rings show your daily progress toward your calorie, protein, carbohydrate, ' +
      'and fat targets. The targets were set based on your goals during onboarding and can ' +
      'be adjusted anytime in Profile → Nutrition Settings.',
    learnMoreItems: [
      { label: 'Calories', value: 'Total daily energy target' },
      { label: 'Protein', value: 'Muscle building and repair (most important)' },
      { label: 'Carbs', value: 'Primary energy source for training' },
      { label: 'Fat', value: 'Hormones, joints, brain function' },
    ],
    proTip:
      'Hit protein first. If you hit your protein target, the other macros are much less ' +
      'critical for body composition.',
  },

  waterTracker: {
    title: 'Water Tracker',
    body:
      'Track your daily hydration in ounces or milliliters. Your target is based on your ' +
      'body weight and activity level. Tap the +8oz button to log a glass quickly.',
    learnMoreItems: [
      { label: 'Base target', value: 'Half your body weight in ounces' },
      { label: 'Training days', value: 'Add 16–32oz per hour of exercise' },
      { label: 'Dehydration sign', value: 'Dark yellow urine = drink more' },
    ],
    proTip: 'Drink 16oz immediately when you wake up before coffee. It jumpstarts metabolism and hydration.',
  },

  // ─── GOALS ─────────────────────────────────────────────────────────────────

  habitStreaks: {
    title: 'Habit Streaks',
    body:
      'Each habit tracks its own streak — the number of consecutive days you completed it. ' +
      'The overall streak on your Dashboard counts days where you completed at least one habit.',
    proTip:
      'Start with just 2–3 habits. Adding too many at once is the top reason people stop ' +
      'using habit trackers.',
  },

  sleepQuality: {
    title: 'Sleep Quality Rating',
    body:
      'Rate your sleep on a 1–5 scale when you log it. This rating directly affects your ' +
      'daily readiness score and your AI coach\'s recommendations for the day.',
    learnMoreItems: [
      { label: '1 star', value: 'Terrible — felt worse than before sleeping' },
      { label: '2 stars', value: 'Poor — still tired, struggled all day' },
      { label: '3 stars', value: 'Average — functional but not restored' },
      { label: '4 stars', value: 'Good — felt rested and alert' },
      { label: '5 stars', value: 'Excellent — woke up energized' },
    ],
    proTip:
      'Logging both bedtime and wake time lets your AI identify sleep patterns that affect ' +
      'your performance.',
  },

  stakeGoals: {
    title: 'Stake Goals',
    body:
      'Put real money on the line for your goals. Set a target, a deadline, and a stake ' +
      'amount. If you hit the goal, your money is returned. If you miss it, the funds go to ' +
      'a charity you select. Real consequences create real accountability.',
    proTip:
      'Start with a small stake ($20–$50) to test the accountability effect before committing ' +
      'larger amounts.',
  },

  focusMode: {
    title: 'Deep Work Focus Mode',
    body:
      'A Pomodoro-based focus timer that blocks TRANSFORMR notifications during your session. ' +
      'Sessions log to your productivity history and contribute to the body-business ' +
      'correlation analysis.',
    learnMoreItems: [
      { label: 'Work interval', value: '25 minutes (adjustable)' },
      { label: 'Short break', value: '5 minutes' },
      { label: 'Long break', value: '15 minutes after 4 sessions' },
    ],
    proTip:
      'Your AI coach tracks your highest-focus days and correlates them with your workout ' +
      'days. You will see the pattern within 2 weeks.',
  },

  // ─── BUSINESS ──────────────────────────────────────────────────────────────

  mrr: {
    title: 'MRR — Monthly Recurring Revenue',
    body:
      'MRR is the predictable revenue your business generates every month from subscriptions ' +
      'or retainer clients. It is the most important metric for a SaaS or service business ' +
      'because it determines your runway and growth trajectory.',
    learnMoreItems: [
      { label: '$1,000 MRR', value: '$12,000 annual revenue run rate' },
      { label: '$10,000 MRR', value: '$120,000 annual revenue run rate' },
      { label: '$83,333 MRR', value: '$1,000,000 annual revenue run rate' },
    ],
    proTip:
      'Log every dollar you receive, even one-time payments. TRANSFORMR separates recurring ' +
      'from one-time revenue in the analytics.',
  },

  revenueLog: {
    title: 'Revenue Log',
    body:
      'Log every payment received — client invoices, product sales, affiliate commissions, ' +
      'consulting fees. TRANSFORMR uses this data to compute your MRR trend, project your ' +
      'revenue trajectory, and correlate financial performance with health metrics.',
    proTip: 'Log revenue the day it happens, not at month-end. Real-time logging keeps you motivated and accurate.',
  },

  businessMilestone: {
    title: 'Business Milestones',
    body:
      'Pre-set revenue milestones mark your progress toward your $1M goal. When you hit ' +
      'each one, TRANSFORMR celebrates the achievement and updates your trajectory projection.',
    proTip: 'Milestones are motivational anchors. The gap from $0 to $1K feels huge — the gap from $100K to $1M feels fast.',
  },

  // ─── PROFILE ───────────────────────────────────────────────────────────────

  coachingTone: {
    title: 'Coaching Tone',
    body:
      'Choose how your AI coach communicates with you. Your tone setting affects all ' +
      'AI-generated content in the app — coaching cards, workout narration, weekly reviews, ' +
      'and motivational messages.',
    learnMoreItems: [
      { label: 'Drill Sergeant', value: 'Tough love, no excuses, high intensity' },
      { label: 'Head Coach', value: 'Strategic, technical, data-focused' },
      { label: 'Best Friend', value: 'Warm, encouraging, celebratory' },
      { label: 'Sports Scientist', value: 'Evidence-based, precise, clinical' },
    ],
    proTip: 'You can change your tone anytime. Try different modes for different phases of your training.',
  },

} satisfies Record<string, HelpContent>;
