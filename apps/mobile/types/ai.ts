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

// ---------------------------------------------------------------------------
// Budget-Aware Supplement Types (Module 3)
// ---------------------------------------------------------------------------

export type SupplementTier = 'essential' | 'recommended' | 'optional';
export type SupplementEvidenceLevel = 'strong' | 'moderate' | 'emerging' | 'anecdotal';
export type SupplementTiming =
  | 'morning'
  | 'pre_workout'
  | 'post_workout'
  | 'with_meals'
  | 'evening'
  | 'bedtime'
  | 'as_needed';
export type SupplementCategory =
  | 'protein'
  | 'creatine'
  | 'vitamin'
  | 'mineral'
  | 'amino_acid'
  | 'pre_workout'
  | 'post_workout'
  | 'sleep'
  | 'adaptogen'
  | 'omega'
  | 'probiotic'
  | 'other';

export interface EvidenceSource {
  title: string;
  year: number;
  type: 'meta_analysis' | 'rct' | 'review' | 'observational' | 'expert_opinion';
}

export interface UserSupplement {
  id: string;
  user_id: string;
  name: string;
  dosage: string | null;
  timing: SupplementTiming;
  frequency: string;
  category: SupplementCategory;
  tier: SupplementTier;
  priority: number;
  evidence_level: SupplementEvidenceLevel;
  evidence_sources: EvidenceSource[];
  monthly_cost: number;
  is_active: boolean;
  is_ai_recommended: boolean;
  ai_recommendation_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserSupplementLog {
  id: string;
  user_id: string;
  supplement_id: string;
  taken_at: string;
}

export interface SupplementRecommendation {
  name: string;
  category: SupplementCategory;
  dosage: string;
  timing: SupplementTiming;
  frequency: string;
  tier: SupplementTier;
  priority: number;
  evidence_level: SupplementEvidenceLevel;
  evidence_sources: EvidenceSource[];
  monthly_cost: number;
  reason: string;
}

export interface InteractionWarning {
  supplements: string[];
  warning: string;
  severity: 'high' | 'medium' | 'low';
}

export interface SupplementAdvisorResponse {
  recommendations: SupplementRecommendation[];
  interactions_warnings: InteractionWarning[];
  daily_schedule: Record<string, string[]>;
  total_estimated_monthly_cost: number;
  budget_fit: boolean;
  budget_notes: string;
  tokens_in: number;
  tokens_out: number;
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

// ---------------------------------------------------------------------------
// AI Chat Coach
// ---------------------------------------------------------------------------

export type ChatTopic =
  | 'general'
  | 'training'
  | 'nutrition'
  | 'supplements'
  | 'sleep'
  | 'mindset'
  | 'business'
  | 'goals'
  | 'labs'
  | 'recovery';

export type ChatDisclaimerType =
  | 'supplement'
  | 'lab'
  | 'nutrition'
  | 'workout'
  | 'sleep'
  | 'general';

export interface ChatConversation {
  id: string;
  user_id: string;
  title: string;
  topic: ChatTopic;
  last_message_at: string;
  message_count: number;
  is_archived: boolean;
  pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  user_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  suggestions: string[] | null;
  disclaimer_type: ChatDisclaimerType | null;
  context_snapshot: Record<string, unknown> | null;
  model: string | null;
  tokens_in: number | null;
  tokens_out: number | null;
  latency_ms: number | null;
  created_at: string;
}

export interface ChatSendResponse {
  conversation_id: string;
  message_id: string;
  role: 'assistant';
  content: string;
  suggestions: string[];
  disclaimer_type: ChatDisclaimerType | null;
  created_at: string;
  latency_ms: number;
}

// ---------------------------------------------------------------------------
// Lab Work Scanner + Interpreter
// ---------------------------------------------------------------------------

export type LabUploadStatus = 'pending' | 'processing' | 'complete' | 'failed';
export type LabFileType = 'image' | 'pdf';

export type BiomarkerCategory =
  | 'metabolic'
  | 'lipid'
  | 'hormone'
  | 'thyroid'
  | 'vitamin'
  | 'mineral'
  | 'inflammation'
  | 'liver'
  | 'kidney'
  | 'blood_count'
  | 'other';

export type BiomarkerFlag =
  | 'low'
  | 'normal'
  | 'high'
  | 'optimal'
  | 'suboptimal'
  | 'unknown';

export interface LabUpload {
  id: string;
  user_id: string;
  title: string;
  lab_name: string | null;
  collected_at: string | null;
  storage_path: string;
  file_type: LabFileType;
  mime_type: string;
  file_size_bytes: number | null;
  status: LabUploadStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface LabInterpretation {
  id: string;
  upload_id: string;
  user_id: string;
  overall_summary: string;
  wellness_score: number | null;
  highlights: string[];
  concerns: string[];
  lifestyle_suggestions: string[];
  follow_up_questions: string[];
  disclaimer_text: string;
  model: string;
  tokens_in: number | null;
  tokens_out: number | null;
  latency_ms: number | null;
  created_at: string;
}

export interface LabBiomarker {
  id: string;
  upload_id: string;
  interpretation_id: string | null;
  user_id: string;
  name: string;
  category: BiomarkerCategory;
  value: number | null;
  unit: string | null;
  reference_low: number | null;
  reference_high: number | null;
  flag: BiomarkerFlag;
  trend_note: string | null;
  collected_at: string | null;
  created_at: string;
}

export interface LabInterpretResponse {
  upload_id: string;
  interpretation_id: string;
  overall_summary: string;
  wellness_score: number;
  highlights: string[];
  concerns: string[];
  lifestyle_suggestions: string[];
  follow_up_questions: string[];
  biomarker_count: number;
  disclaimer_text: string;
  latency_ms: number;
}

export interface LabUploadDetail {
  upload: LabUpload;
  interpretation: LabInterpretation | null;
  biomarkers: LabBiomarker[];
}
