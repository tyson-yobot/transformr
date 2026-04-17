// ==========================================
// PROFILES
// ==========================================

export interface NotificationPreferences {
  wake_up: { enabled: boolean; time: string };
  meals: { enabled: boolean; times: string[] };
  gym: { enabled: boolean; time: string };
  sleep: { enabled: boolean; time: string };
  water: { enabled: boolean; interval_minutes: number };
  daily_checkin: { enabled: boolean; time: string };
  weekly_review: { enabled: boolean; day: string; time: string };
  focus_reminder: { enabled: boolean; time: string };
  supplement: { enabled: boolean };
  partner_activity: { enabled: boolean };
}

export interface Profile {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  height_inches?: number;
  current_weight?: number;
  goal_weight?: number;
  goal_direction?: 'gain' | 'lose' | 'maintain';
  activity_level?: 'sedentary' | 'light' | 'moderate' | 'very_active' | 'extra_active';
  daily_calorie_target?: number;
  daily_protein_target?: number;
  daily_carb_target?: number;
  daily_fat_target?: number;
  daily_water_target_oz?: number;
  timezone?: string;
  theme?: 'dark' | 'light' | 'system';
  notification_preferences?: NotificationPreferences;
  voice_commands_enabled?: boolean;
  narrator_enabled?: boolean;
  narrator_voice?: string;
  spotify_connected?: boolean;
  spotify_access_token?: string;
  spotify_refresh_token?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  subscription_tier?: 'free' | 'pro' | 'elite' | 'partners';
  subscription_expires_at?: string;
  watch_paired?: boolean;
  expo_push_token?: string;
  supplement_budget_monthly?: number;
  weekly_grocery_budget_usd?: number;
  onboarding_completed?: boolean;
  coaching_tone?: 'drill_sergeant' | 'motivational' | 'balanced' | 'calm';
  created_at?: string;
  updated_at?: string;
}

// ==========================================
// PARTNERSHIPS
// ==========================================

export interface SharedPreferences {
  can_see_weight: boolean;
  can_see_workouts: boolean;
  can_see_nutrition: boolean;
  can_see_habits: boolean;
  can_see_goals: boolean;
  can_see_mood: boolean;
  can_see_journal: boolean;
  can_see_business: boolean;
  can_see_finance: boolean;
  can_nudge: boolean;
  can_challenge: boolean;
  live_sync_enabled: boolean;
}

export interface Partnership {
  id: string;
  user_a?: string;
  user_b?: string;
  status?: 'pending' | 'active' | 'paused' | 'ended';
  invite_code?: string;
  shared_preferences?: SharedPreferences;
  joint_streak?: number;
  longest_joint_streak?: number;
  created_at?: string;
}

// ==========================================
// COUNTDOWNS
// ==========================================

export interface Countdown {
  id: string;
  user_id?: string;
  title: string;
  target_date: string;
  emoji?: string;
  is_primary?: boolean;
  color?: string;
  linked_goal_ids?: string[];
  created_at?: string;
}

// ==========================================
// FITNESS
// ==========================================

export interface Exercise {
  id: string;
  name: string;
  category?: 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps' | 'legs' | 'glutes' | 'abs' | 'cardio' | 'compound' | 'olympic' | 'stretching' | 'mobility';
  muscle_groups: string[];
  equipment?: 'barbell' | 'dumbbell' | 'cable' | 'machine' | 'bodyweight' | 'kettlebell' | 'bands' | 'smith_machine' | 'trx' | 'other';
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  instructions?: string;
  tips?: string;
  common_mistakes?: string;
  video_url?: string;
  image_url?: string;
  is_compound?: boolean;
  is_custom?: boolean;
  created_by?: string;
  created_at?: string;
}

export interface WeightLog {
  id: string;
  user_id?: string;
  weight: number;
  body_fat_percentage?: number;
  photo_front_url?: string;
  photo_side_url?: string;
  photo_back_url?: string;
  ai_body_analysis?: Record<string, unknown>;
  notes?: string;
  logged_at?: string;
  created_at?: string;
}

export interface Measurement {
  id: string;
  user_id?: string;
  chest?: number;
  waist?: number;
  hips?: number;
  bicep_left?: number;
  bicep_right?: number;
  thigh_left?: number;
  thigh_right?: number;
  calf_left?: number;
  calf_right?: number;
  neck?: number;
  shoulders?: number;
  forearm_left?: number;
  forearm_right?: number;
  measured_at?: string;
}

export interface WorkoutTemplate {
  id: string;
  user_id?: string;
  name: string;
  description?: string;
  category?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  day_of_week?: number;
  estimated_duration_minutes?: number;
  is_shared?: boolean;
  is_ai_generated?: boolean;
  ai_last_adjusted_at?: string;
  sort_order?: number;
  created_at?: string;
}

export interface WorkoutTemplateExercise {
  id: string;
  template_id?: string;
  exercise_id?: string;
  sort_order: number;
  target_sets?: number;
  target_reps?: string;
  target_weight?: number;
  target_rpe?: number;
  rest_seconds?: number;
  superset_group?: string;
  notes?: string;
  created_at?: string;
}

export interface WorkoutSession {
  id: string;
  user_id?: string;
  template_id?: string;
  name: string;
  started_at: string;
  completed_at?: string;
  duration_minutes?: number;
  total_volume?: number;
  total_sets?: number;
  notes?: string;
  mood_before?: number;
  mood_after?: number;
  energy_level?: number;
  readiness_score?: number;
  is_with_partner?: boolean;
  is_live_sync?: boolean;
  partner_session_id?: string;
  spotify_playlist_id?: string;
  form_check_video_url?: string;
  ai_form_feedback?: Record<string, unknown>;
  mobility_completed?: boolean;
  created_at?: string;
}

export interface WorkoutSet {
  id: string;
  session_id?: string;
  exercise_id?: string;
  set_number: number;
  reps?: number;
  weight?: number;
  duration_seconds?: number;
  distance?: number;
  is_warmup?: boolean;
  is_dropset?: boolean;
  is_failure?: boolean;
  is_personal_record?: boolean;
  rpe?: number;
  ghost_weight?: number;
  ghost_reps?: number;
  ghost_beaten?: boolean;
  notes?: string;
  logged_at?: string;
  created_at?: string;
}

export interface PersonalRecord {
  id: string;
  user_id?: string;
  exercise_id?: string;
  record_type?: 'max_weight' | 'max_reps' | 'max_volume' | 'max_duration' | 'max_1rm';
  value: number;
  previous_record?: number;
  workout_session_id?: string;
  achieved_at?: string;
  created_at?: string;
}

export interface LiveWorkoutSync {
  id: string;
  session_id?: string;
  user_id?: string;
  partner_id?: string;
  exercise_name?: string;
  set_number?: number;
  reps?: number;
  weight?: number;
  status?: 'resting' | 'active' | 'completed';
  synced_at?: string;
}

export interface PainLog {
  id: string;
  user_id?: string;
  body_part: string;
  pain_level?: number;
  pain_type?: 'sharp' | 'dull' | 'aching' | 'burning' | 'tingling' | 'stiffness';
  notes?: string;
  logged_at?: string;
}

export interface MobilitySession {
  id: string;
  user_id?: string;
  target_muscles: string[];
  duration_minutes?: number;
  exercises_completed?: Record<string, unknown>;
  post_workout_session_id?: string;
  completed_at?: string;
}

// ==========================================
// NUTRITION
// ==========================================

export interface Food {
  id: string;
  name: string;
  brand?: string;
  serving_size: number;
  serving_unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  saturated_fat?: number;
  trans_fat?: number;
  cholesterol?: number;
  potassium?: number;
  barcode?: string;
  open_food_facts_id?: string;
  image_url?: string;
  is_custom?: boolean;
  created_by?: string;
  is_verified?: boolean;
  created_at?: string;
}

export interface SavedMeal {
  id: string;
  user_id?: string;
  name: string;
  description?: string;
  meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'shake' | 'pre_workout' | 'post_workout';
  is_shared?: boolean;
  total_calories?: number;
  total_protein?: number;
  total_carbs?: number;
  total_fat?: number;
  prep_time_minutes?: number;
  instructions?: string;
  image_url?: string;
  created_at?: string;
}

export interface SavedMealItem {
  id: string;
  saved_meal_id?: string;
  food_id?: string;
  quantity?: number;
  created_at?: string;
}

export interface NutritionLog {
  id: string;
  user_id?: string;
  food_id?: string;
  saved_meal_id?: string;
  meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'shake' | 'pre_workout' | 'post_workout';
  quantity?: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  source?: 'manual' | 'camera' | 'barcode' | 'voice' | 'saved_meal' | 'menu_scan';
  photo_url?: string;
  ai_confidence?: number;
  logged_at?: string;
  created_at?: string;
}

export interface WaterLog {
  id: string;
  user_id?: string;
  amount_oz: number;
  logged_at?: string;
}

export interface Supplement {
  id: string;
  user_id?: string;
  name: string;
  dosage?: string;
  frequency?: string;
  times?: string[];
  category?: 'protein' | 'creatine' | 'vitamin' | 'mineral' | 'amino_acid' | 'pre_workout' | 'post_workout' | 'sleep' | 'other';
  is_ai_recommended?: boolean;
  ai_recommendation_reason?: string;
  is_active?: boolean;
  created_at?: string;
}

export interface SupplementLog {
  id: string;
  user_id?: string;
  supplement_id?: string;
  taken_at?: string;
}

export interface MealPrepPlan {
  id: string;
  user_id?: string;
  partnership_id?: string;
  week_start: string;
  total_prep_time_minutes?: number;
  grocery_list?: Record<string, unknown>;
  total_estimated_cost?: number;
  meals?: Record<string, unknown>;
  prep_instructions?: Record<string, unknown>;
  container_plan?: Record<string, unknown>;
  ai_generated?: boolean;
  created_at?: string;
}

export interface GroceryList {
  id: string;
  user_id?: string;
  meal_prep_plan_id?: string;
  week_start?: string;
  items: Record<string, unknown>;
  total_estimated_cost?: number;
  ai_generated?: boolean;
  created_at?: string;
}

// ==========================================
// GOALS & HABITS
// ==========================================

export interface Goal {
  id: string;
  user_id?: string;
  partnership_id?: string;
  title: string;
  description?: string;
  category?: 'fitness' | 'nutrition' | 'business' | 'financial' | 'personal' | 'relationship' | 'education' | 'health' | 'mindset';
  goal_type?: 'target' | 'habit' | 'milestone' | 'project';
  target_value?: number;
  current_value?: number;
  unit?: string;
  start_date?: string;
  target_date?: string;
  countdown_id?: string;
  status?: 'active' | 'completed' | 'paused' | 'abandoned';
  priority?: number;
  color?: string;
  icon?: string;
  is_staked?: boolean;
  stake_amount?: number;
  stake_charity?: string;
  created_at?: string;
  completed_at?: string;
}

export interface GoalMilestone {
  id: string;
  goal_id?: string;
  title: string;
  target_value?: number;
  target_date?: string;
  is_completed?: boolean;
  completed_at?: string;
  celebration_message?: string;
  sort_order?: number;
  created_at?: string;
}

export interface Habit {
  id: string;
  user_id?: string;
  name: string;
  description?: string;
  category?: 'fitness' | 'nutrition' | 'business' | 'health' | 'personal' | 'mindset' | 'finance' | 'learning';
  frequency?: 'daily' | 'weekdays' | 'weekends' | 'custom';
  custom_days?: number[];
  target_count?: number;
  unit?: string;
  reminder_time?: string;
  color?: string;
  icon?: string;
  is_active?: boolean;
  current_streak?: number;
  longest_streak?: number;
  streak_shields?: number;
  sort_order?: number;
  created_at?: string;
}

export interface HabitCompletion {
  id: string;
  habit_id?: string;
  user_id?: string;
  completed_count?: number;
  value?: number;
  notes?: string;
  completed_at?: string;
}

// ==========================================
// SLEEP & MOOD
// ==========================================

export interface SleepLog {
  id: string;
  user_id?: string;
  bedtime: string;
  wake_time: string;
  duration_minutes?: number;
  quality?: number;
  caffeine_cutoff_time?: string;
  screen_cutoff_time?: string;
  notes?: string;
  ai_sleep_recommendation?: string;
  created_at?: string;
}

export interface MoodLog {
  id: string;
  user_id?: string;
  mood?: number;
  energy?: number;
  stress?: number;
  motivation?: number;
  context?: 'morning' | 'midday' | 'afternoon' | 'evening' | 'post_workout' | 'post_meal';
  notes?: string;
  logged_at?: string;
}

export interface ReadinessScore {
  id: string;
  user_id?: string;
  date: string;
  score?: number;
  sleep_component?: number;
  soreness_component?: number;
  stress_component?: number;
  energy_component?: number;
  training_load_component?: number;
  recommendation?: 'go_hard' | 'moderate' | 'light' | 'rest';
  ai_explanation?: string;
  created_at?: string;
}

// ==========================================
// BUSINESS
// ==========================================

export interface Business {
  id: string;
  user_id?: string;
  name: string;
  description?: string;
  type?: 'saas' | 'service' | 'product' | 'consulting' | 'other';
  valuation?: number;
  monthly_revenue?: number;
  monthly_expenses?: number;
  customer_count?: number;
  logo_url?: string;
  stripe_account_id?: string;
  stripe_connected?: boolean;
  created_at?: string;
}

export interface RevenueLog {
  id: string;
  business_id?: string;
  amount: number;
  type?: 'subscription' | 'one_time' | 'consulting' | 'affiliate' | 'other';
  source?: string;
  customer_name?: string;
  description?: string;
  stripe_payment_id?: string;
  transaction_date: string;
  created_at?: string;
}

export interface ExpenseLog {
  id: string;
  business_id?: string;
  amount: number;
  category?: 'infrastructure' | 'marketing' | 'tools' | 'payroll' | 'legal' | 'contractors' | 'office' | 'travel' | 'other';
  description?: string;
  is_recurring?: boolean;
  recurring_interval?: string;
  transaction_date: string;
  created_at?: string;
}

export interface Customer {
  id: string;
  business_id?: string;
  name: string;
  email?: string;
  plan_tier?: string;
  mrr?: number;
  status?: 'trial' | 'active' | 'churned' | 'paused';
  started_at?: string;
  churned_at?: string;
  notes?: string;
  created_at?: string;
}

export interface BusinessMilestone {
  id: string;
  business_id?: string;
  title: string;
  target_metric?: string;
  target_value?: number;
  current_value?: number;
  is_completed?: boolean;
  completed_at?: string;
  target_date?: string;
  celebration_message?: string;
  sort_order?: number;
  created_at?: string;
}

// ==========================================
// PERSONAL FINANCE
// ==========================================

export interface FinanceAccount {
  id: string;
  user_id?: string;
  name: string;
  type?: 'checking' | 'savings' | 'credit_card' | 'investment' | 'crypto' | 'cash' | 'other';
  balance?: number;
  currency?: string;
  is_active?: boolean;
  created_at?: string;
}

export interface FinanceTransaction {
  id: string;
  user_id?: string;
  account_id?: string;
  amount: number;
  category?: 'income' | 'food' | 'housing' | 'transportation' | 'entertainment' | 'health' | 'education' | 'shopping' | 'subscriptions' | 'savings' | 'investment' | 'business_income' | 'other';
  description?: string;
  is_recurring?: boolean;
  transaction_date: string;
  created_at?: string;
}

export interface Budget {
  id: string;
  user_id?: string;
  category: string;
  monthly_limit: number;
  current_spent?: number;
  month: string;
  created_at?: string;
}

export interface NetWorthSnapshot {
  id: string;
  user_id?: string;
  total_assets?: number;
  total_liabilities?: number;
  net_worth?: number;
  business_equity?: number;
  snapshot_date?: string;
  created_at?: string;
}

// ==========================================
// FOCUS, JOURNAL, SKILLS
// ==========================================

export interface FocusSession {
  id: string;
  user_id?: string;
  task_description?: string;
  category?: 'coding' | 'business' | 'marketing' | 'learning' | 'admin' | 'creative' | 'other';
  planned_duration_minutes?: number;
  actual_duration_minutes?: number;
  started_at: string;
  completed_at?: string;
  distractions_count?: number;
  productivity_rating?: number;
  notes?: string;
  created_at?: string;
}

export interface JournalEntry {
  id: string;
  user_id?: string;
  date: string;
  ai_prompt?: string;
  entry_text?: string;
  wins?: string[];
  struggles?: string[];
  gratitude?: string[];
  tomorrow_focus?: string[];
  ai_response?: string;
  ai_patterns_detected?: Record<string, unknown>;
  mood_at_entry?: number;
  tags?: string[];
  is_private?: boolean;
  created_at?: string;
}

export interface MonthlyLetter {
  id: string;
  user_id?: string;
  month: string;
  letter_text: string;
  highlights?: Record<string, unknown>;
  created_at?: string;
}

export interface Skill {
  id: string;
  user_id?: string;
  name: string;
  category?: 'technical' | 'business' | 'fitness' | 'nutrition' | 'language' | 'creative' | 'leadership' | 'other';
  proficiency?: number;
  target_proficiency?: number;
  hours_practiced?: number;
  notes?: string;
  created_at?: string;
}

export interface Book {
  id: string;
  user_id?: string;
  title: string;
  author?: string;
  category?: string;
  status?: 'want_to_read' | 'reading' | 'completed' | 'abandoned';
  pages_total?: number;
  pages_read?: number;
  rating?: number;
  notes?: string;
  key_takeaways?: string[];
  ai_recommended?: boolean;
  ai_recommendation_reason?: string;
  started_at?: string;
  completed_at?: string;
  created_at?: string;
}

export interface Course {
  id: string;
  user_id?: string;
  title: string;
  platform?: string;
  category?: string;
  url?: string;
  progress_percent?: number;
  status?: 'planned' | 'in_progress' | 'completed' | 'abandoned';
  certificate_url?: string;
  notes?: string;
  started_at?: string;
  completed_at?: string;
  created_at?: string;
}

// ==========================================
// PARTNER FEATURES
// ==========================================

export interface PartnerNudge {
  id: string;
  from_user_id?: string;
  to_user_id?: string;
  type?: 'encouragement' | 'reminder' | 'celebration' | 'challenge' | 'reaction';
  message?: string;
  emoji?: string;
  reaction_to?: string;
  is_read?: boolean;
  created_at?: string;
}

export interface PartnerChallenge {
  id: string;
  partnership_id?: string;
  created_by?: string;
  title: string;
  description?: string;
  challenge_type?: 'both_complete' | 'competition' | 'streak' | 'custom';
  metric?: string;
  target_value?: number;
  duration_days?: number;
  start_date?: string;
  end_date?: string;
  user_a_progress?: number;
  user_b_progress?: number;
  winner_id?: string;
  stake_amount?: number;
  status?: 'active' | 'completed' | 'expired';
  created_at?: string;
}

// ==========================================
// NFC & GEOFENCE
// ==========================================

export interface NfcTrigger {
  id: string;
  user_id?: string;
  tag_id: string;
  label: string;
  action: string;
  action_params?: Record<string, unknown>;
  is_active?: boolean;
  created_at?: string;
}

export interface GeofenceTrigger {
  id: string;
  user_id?: string;
  label: string;
  latitude: number;
  longitude: number;
  radius_meters?: number;
  trigger_on?: 'enter' | 'exit' | 'both';
  action: string;
  action_params?: Record<string, unknown>;
  is_active?: boolean;
  created_at?: string;
}

// ==========================================
// DASHBOARD
// ==========================================

export interface DashboardLayout {
  id: string;
  user_id?: string;
  name?: string;
  is_active?: boolean;
  layout: Record<string, unknown>;
  created_at?: string;
}

// ==========================================
// SOCIAL CONTENT
// ==========================================

export interface SocialContent {
  id: string;
  user_id?: string;
  type?: 'transformation' | 'weekly_recap' | 'pr_celebration' | 'milestone' | 'time_lapse' | 'custom';
  template?: string;
  content_data?: Record<string, unknown>;
  image_url?: string;
  video_url?: string;
  caption?: string;
  platform?: string;
  is_shared?: boolean;
  shared_at?: string;
  created_at?: string;
}

// ==========================================
// STAKE GOALS
// ==========================================

export interface StakeGoal {
  id: string;
  goal_id?: string;
  user_id?: string;
  stake_amount: number;
  evaluation_frequency?: 'daily' | 'weekly' | 'monthly';
  charity_name?: string;
  charity_url?: string;
  partner_receives?: boolean;
  stripe_payment_intent_id?: string;
  evaluation_criteria?: Record<string, unknown>;
  total_lost?: number;
  total_saved?: number;
  is_active?: boolean;
  created_at?: string;
}

export interface StakeEvaluation {
  id: string;
  stake_goal_id?: string;
  period_start?: string;
  period_end?: string;
  passed: boolean;
  evaluation_data?: Record<string, unknown>;
  amount_at_risk?: number;
  amount_charged?: number;
  notes?: string;
  created_at?: string;
}

// ==========================================
// COMMUNITY
// ==========================================

export interface CommunityChallenge {
  id: string;
  created_by?: string;
  title: string;
  description?: string;
  challenge_type?: string;
  metric?: string;
  target_value?: number;
  start_date?: string;
  end_date?: string;
  max_participants?: number;
  is_public?: boolean;
  created_at?: string;
}

export interface ChallengeParticipant {
  id: string;
  challenge_id?: string;
  user_id?: string;
  current_progress?: number;
  rank?: number;
  joined_at?: string;
}

export interface CommunityLeaderboard {
  id: string;
  user_id?: string;
  category?: 'consistency' | 'volume' | 'streaks' | 'prs' | 'overall';
  score?: number;
  rank?: number;
  period?: 'weekly' | 'monthly' | 'all_time';
  period_start?: string;
  updated_at?: string;
}

// ==========================================
// ACHIEVEMENTS
// ==========================================

export interface Achievement {
  id: string;
  key: string;
  title: string;
  description?: string;
  icon?: string;
  category?: 'fitness' | 'nutrition' | 'body' | 'business' | 'finance' | 'consistency' | 'partner' | 'community' | 'mindset' | 'learning';
  tier?: 'bronze' | 'silver' | 'gold' | 'diamond';
  requirement_type?: string;
  requirement_value?: number;
  secret?: boolean;
  created_at?: string;
}

export interface UserAchievement {
  id: string;
  user_id?: string;
  achievement_id?: string;
  earned_at?: string;
}

// ==========================================
// NOTIFICATIONS
// ==========================================

export interface NotificationLogEntry {
  id: string;
  user_id?: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  is_sent?: boolean;
  sent_at?: string;
  is_read?: boolean;
  read_at?: string;
  created_at?: string;
}

// ==========================================
// DAILY CHECK-INS & WEEKLY REVIEWS
// ==========================================

export interface DailyCheckin {
  id: string;
  user_id?: string;
  date: string;
  day_score?: number;
  habits_completed?: number;
  habits_total?: number;
  calories_logged?: number;
  protein_logged?: number;
  workouts_completed?: number;
  sleep_hours?: number;
  focus_hours?: number;
  revenue_logged?: number;
  water_oz?: number;
  mood_average?: number;
  ai_morning_briefing?: string;
  ai_evening_reflection?: string;
  created_at?: string;
}

export interface WeeklyReview {
  id: string;
  user_id?: string;
  week_start: string;
  weight_change?: number;
  workouts_completed?: number;
  workouts_target?: number;
  avg_calories?: number;
  avg_protein?: number;
  avg_sleep_hours?: number;
  avg_mood?: number;
  avg_readiness?: number;
  habits_completion_rate?: number;
  focus_hours_total?: number;
  revenue_this_week?: number;
  cumulative_revenue?: number;
  new_customers?: number;
  prs_this_week?: number;
  top_wins?: string[];
  areas_to_improve?: string[];
  next_week_goals?: string[];
  ai_weekly_summary?: string;
  fitness_grade?: string;
  nutrition_grade?: string;
  business_grade?: string;
  habits_grade?: string;
  sleep_grade?: string;
  overall_grade?: string;
  body_business_correlations?: Record<string, unknown>;
  created_at?: string;
}

// ==========================================
// VISION BOARD
// ==========================================

export interface VisionBoardItem {
  id: string;
  user_id?: string;
  image_url: string;
  title?: string;
  category?: 'body' | 'business' | 'lifestyle' | 'relationship' | 'material' | 'travel' | 'personal';
  linked_goal_id?: string;
  sort_order?: number;
  created_at?: string;
}

// ==========================================
// CHALLENGE CENTER
// ==========================================

export type ChallengeTaskType =
  | 'workout'
  | 'water'
  | 'nutrition'
  | 'reading'
  | 'photo'
  | 'meditation'
  | 'steps'
  | 'sleep'
  | 'alcohol_free'
  | 'sugar_free'
  | 'journal'
  | 'custom'
  | 'fasting'
  | 'measurement'
  | 'calories'
  | 'protein';

export type ChallengeCategory =
  | 'mental_toughness'
  | 'fitness'
  | 'nutrition'
  | 'running'
  | 'strength'
  | 'lifestyle'
  | 'custom';

export type ChallengeDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'extreme';

export type ChallengeStatus = 'active' | 'completed' | 'failed' | 'abandoned';

export interface ChallengeTask {
  id: string;
  label: string;
  type: ChallengeTaskType;
  auto_verify: boolean;
  /** Task-specific config: min_duration_minutes, min_count, target_oz, target_pages, etc. */
  config: Record<string, unknown>;
}

export interface ChallengeRules {
  tasks: ChallengeTask[];
  restart_on_failure?: boolean;
  /** Per-day overrides for progressive challenges (squat targets, plank durations, C25K intervals) */
  daily_schedule?: Record<number, Record<string, unknown>>;
  /** Allowed rest days per week (e.g., 75 Soft allows 1) */
  rest_days_per_week?: number;
  /** Fasting protocol for IF challenges */
  fasting_protocol?: '16:8' | '18:6' | '20:4' | '5:2';
  /** Whole30 elimination categories */
  elimination_list?: string[];
  [key: string]: unknown;
}

export interface ChallengeDefinition {
  id: string;
  name: string;
  slug: string;
  description?: string;
  category?: ChallengeCategory;
  difficulty?: ChallengeDifficulty;
  duration_days: number;
  rules: ChallengeRules;
  restart_on_failure?: boolean;
  is_system?: boolean;
  created_by?: string;
  icon?: string;
  color?: string;
  estimated_daily_time_minutes?: number;
  created_at?: string;
}

export interface ChallengeEnrollment {
  id: string;
  user_id?: string;
  challenge_id?: string;
  partnership_id?: string;
  started_at?: string;
  target_end_date?: string;
  actual_end_date?: string;
  status?: ChallengeStatus;
  current_day?: number;
  restart_count?: number;
  longest_streak?: number;
  configuration?: Record<string, unknown>;
  stake_goal_id?: string;
  created_at?: string;
}

export interface ChallengeDailyLog {
  id: string;
  enrollment_id?: string;
  user_id?: string;
  day_number: number;
  date: string;
  tasks_completed: Record<string, boolean>;
  all_tasks_completed?: boolean;
  auto_verified?: Record<string, boolean>;
  notes?: string;
  created_at?: string;
}
