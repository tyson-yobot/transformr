// App-wide constants

export const APP_NAME = 'TRANSFORMR';
export const APP_TAGLINE = 'Every rep. Every meal. Every dollar. Every day.';

// AI Model
export const AI_MODEL = 'claude-sonnet-4-20250514';

// API endpoints
export const OPEN_FOOD_FACTS_API = 'https://world.openfoodfacts.org/api/v2';

// Timing
export const DEFAULT_REST_SECONDS = 90;
export const WATER_REMINDER_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
export const SYNC_DEBOUNCE_MS = 500;
export const OFFLINE_SYNC_INTERVAL_MS = 30 * 1000; // 30 seconds

// Limits
export const MAX_SETS_PER_EXERCISE = 20;
export const MAX_WORKOUT_DURATION_HOURS = 4;
export const MAX_PHOTO_SIZE_MB = 10;
export const MAX_VIDEO_DURATION_SECONDS = 30;

// Defaults
export const DEFAULT_WATER_TARGET_OZ = 100;
export const DEFAULT_REST_TIMER_SECONDS = 90;
export const DEFAULT_POMODORO_MINUTES = 25;
export const DEFAULT_BREAK_MINUTES = 5;
export const DEFAULT_LONG_BREAK_MINUTES = 15;

// Nutrition
export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack', 'shake', 'pre_workout', 'post_workout'] as const;
export const MACRO_COLORS = {
  protein: '#10B981',
  carbs: '#3B82F6',
  fat: '#F59E0B',
} as const;

// Fitness
export const EXERCISE_CATEGORIES = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps',
  'legs', 'glutes', 'abs', 'cardio', 'compound',
  'olympic', 'stretching', 'mobility',
] as const;

export const EQUIPMENT_TYPES = [
  'barbell', 'dumbbell', 'cable', 'machine', 'bodyweight',
  'kettlebell', 'bands', 'smith_machine', 'trx', 'other',
] as const;

// Body parts for pain tracker
export const BODY_PARTS = [
  'head', 'neck', 'left_shoulder', 'right_shoulder',
  'left_elbow', 'right_elbow', 'left_wrist', 'right_wrist',
  'upper_back', 'lower_back', 'chest', 'abs',
  'left_hip', 'right_hip', 'left_knee', 'right_knee',
  'left_ankle', 'right_ankle', 'left_shin', 'right_shin',
] as const;

// Dashboard widgets
export const WIDGET_TYPES = [
  'countdown', 'weight_chart', 'macro_rings', 'streak_counter',
  'revenue_chart', 'partner_card', 'readiness_score', 'focus_timer',
  'habit_checklist', 'sleep_summary', 'mood_trend', 'pr_list',
  'water_tracker', 'motivation_quote', 'todays_workout', 'todays_plan',
  'weekly_progress', 'goal_progress', 'sparkline_weight',
  'sparkline_calories', 'sparkline_revenue', 'skill_progress',
  'book_progress', 'net_worth_card', 'body_business_correlation',
] as const;

// Streak thresholds for celebrations
export const STREAK_MILESTONES = [7, 14, 21, 30, 50, 75, 100, 150, 200, 365] as const;

// RPE Scale
export const RPE_SCALE = [
  { value: 6, label: 'Very Light' },
  { value: 7, label: 'Light' },
  { value: 8, label: 'Moderate' },
  { value: 9, label: 'Hard' },
  { value: 10, label: 'Max Effort' },
] as const;
