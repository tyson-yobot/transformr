export interface AICoachResponse {
  message: string;
  suggestions: string[];
  priority: 'low' | 'medium' | 'high';
  category: 'fitness' | 'nutrition' | 'mindset' | 'business' | 'recovery' | 'general';
}

export interface AIMealAnalysis {
  foods: Array<{
    name: string;
    estimated_calories: number;
    estimated_protein: number;
    estimated_carbs: number;
    estimated_fat: number;
    serving_size: string;
    confidence: number;
  }>;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  overall_confidence: number;
  suggestions: string[];
}

export interface AIFormCheckResult {
  overall_score: number;
  form_issues: Array<{
    body_part: string;
    issue: string;
    severity: 'minor' | 'moderate' | 'major';
    correction: string;
  }>;
  positive_notes: string[];
  injury_risk: 'low' | 'medium' | 'high';
}

export interface AITrajectory {
  current_path: {
    weight_projection: Array<{ date: string; value: number }>;
    revenue_projection: Array<{ date: string; value: number }>;
    fitness_projection: Array<{ date: string; value: number }>;
    narrative: string;
  };
  optimal_path: {
    weight_projection: Array<{ date: string; value: number }>;
    revenue_projection: Array<{ date: string; value: number }>;
    fitness_projection: Array<{ date: string; value: number }>;
    narrative: string;
  };
  key_differences: string[];
  actionable_changes: string[];
}

export interface AIMotivation {
  message: string;
  type: 'encouragement' | 'accountability' | 'celebration' | 'challenge' | 'reflection';
  context_used: string[];
}

export interface AIProgressPhotoAnalysis {
  estimated_body_fat: number;
  muscle_development: Record<string, 'improved' | 'maintained' | 'declined'>;
  visible_changes: string[];
  recommendations: string[];
  comparison_notes: string;
}

export interface AISleepRecommendation {
  ideal_bedtime: string;
  ideal_wake_time: string;
  caffeine_cutoff: string;
  screen_cutoff: string;
  pre_sleep_routine: string[];
  issues_identified: string[];
  expected_improvement: string;
}

export interface AISupplementRecommendation {
  recommended: Array<{
    name: string;
    dosage: string;
    timing: string;
    reason: string;
    priority: 'essential' | 'recommended' | 'optional';
  }>;
  warnings: string[];
  interactions: string[];
}

export interface AIWeeklyReport {
  summary: string;
  grades: {
    fitness: string;
    nutrition: string;
    business: string;
    habits: string;
    sleep: string;
    overall: string;
  };
  wins: string[];
  improvements: string[];
  next_week_focus: string[];
  correlations: string[];
}
