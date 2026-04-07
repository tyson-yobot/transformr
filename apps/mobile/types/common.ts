export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'shake' | 'pre_workout' | 'post_workout';
export type GoalCategory = 'fitness' | 'nutrition' | 'business' | 'financial' | 'personal' | 'relationship' | 'education' | 'health' | 'mindset';
export type GoalStatus = 'active' | 'completed' | 'paused' | 'abandoned';
export type HabitFrequency = 'daily' | 'weekdays' | 'weekends' | 'custom';
export type ExerciseCategory = 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps' | 'legs' | 'glutes' | 'abs' | 'cardio' | 'compound' | 'olympic' | 'stretching' | 'mobility';
export type Equipment = 'barbell' | 'dumbbell' | 'cable' | 'machine' | 'bodyweight' | 'kettlebell' | 'bands' | 'smith_machine' | 'trx' | 'other';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  hasMore: boolean;
}

export interface DateRange {
  start: string;
  end: string;
}

export type SortDirection = 'asc' | 'desc';
