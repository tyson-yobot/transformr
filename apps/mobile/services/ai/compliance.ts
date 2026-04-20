// =============================================================================
// TRANSFORMR — Compliance Service
// =============================================================================
// Two exports:
//   1. COMPLIANCE_SYSTEM_PREAMBLE — safety text prepended to AI system prompts
//   2. Compliance-checking functions — call the challenge-compliance Edge Function
//      to validate user actions against active challenge rules in real time.
// =============================================================================

import { supabase } from '@services/supabase';

// ---------------------------------------------------------------------------
// Compliance preamble (re-exported for mobile AI service imports)
// Edge Functions use the canonical copy in supabase/functions/_shared/compliance.ts
// ---------------------------------------------------------------------------
export const COMPLIANCE_SYSTEM_PREAMBLE = `
You are TRANSFORMR's AI coach — a personalized guide for fitness, nutrition, mindset,
business performance, and life transformation. You have access to the user's complete
data profile and you use it to give specific, relevant, actionable guidance.

SAFETY AND COMPLIANCE REQUIREMENTS (NON-NEGOTIABLE):
- All health, fitness, and nutrition guidance is informational and educational only.
- Never diagnose, treat, or claim to diagnose or treat any medical condition.
- For lab results and health markers: frame all observations as "worth discussing with
  your healthcare provider" — never as diagnosis or treatment recommendations.
- For supplement recommendations: always include "consult your healthcare provider
  before starting any new supplement, especially if you have existing conditions."
- For injury-related content: always recommend consulting a qualified healthcare
  professional for persistent, severe, or worsening symptoms.
- Never recommend specific medications, dosages, or clinical protocols.
- Never provide financial advice — business metrics are motivational context only.

COACHING STANDARDS:
- Be specific to the user's actual data — never give generic advice.
- Reference their actual numbers, streaks, and recent performance.
- Match the coaching tone they have selected in their profile.
- Be honest about plateaus and challenges — never gaslight their data.
- Celebrate real wins with genuine specificity.
`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ComplianceFoodItem {
  name: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

export interface ComplianceWorkout {
  duration_minutes: number;
  type?: string;
  started_at: string;
  is_outdoor?: boolean;
}

export interface ComplianceTaskStatus {
  completed: boolean;
  progress: number;
  target: number;
}

export interface ComplianceResult {
  compliant: boolean;
  violations: string[];
  warnings: string[];
  task_status: Record<string, ComplianceTaskStatus>;
  recommendation: string;
}

// Safe fallback returned when the Edge Function call fails.
// Never throws — never blocks the user from logging their data.
const OPEN_RESULT: ComplianceResult = {
  compliant: true,
  violations: [],
  warnings: [],
  task_status: {},
  recommendation: '',
};

// ---------------------------------------------------------------------------
// Internal helper — call the challenge-compliance Edge Function
// ---------------------------------------------------------------------------
async function invokeCompliance(
  enrollmentId: string,
  actionType: 'meal_logged' | 'workout_logged' | 'water_logged' | 'food_searched' | 'manual_check',
  actionData: Record<string, unknown>
): Promise<ComplianceResult> {
  const { data, error } = await supabase.functions.invoke('challenge-compliance', {
    body: {
      enrollment_id: enrollmentId,
      action_type: actionType,
      action_data: actionData,
    },
  });

  if (error) {
    return OPEN_RESULT; // fail open — never block logging
  }

  return data as ComplianceResult;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Check whether a logged meal complies with the active challenge's diet rules.
 * Called after the user taps "Add to Log" on a food item.
 *
 * Never throws. Returns compliant: true on error so logging is never blocked.
 */
export async function checkMealCompliance(
  enrollmentId: string,
  foods: ComplianceFoodItem[],
  mealTime: string
): Promise<ComplianceResult> {
  return invokeCompliance(enrollmentId, 'meal_logged', {
    foods,
    meal_time: mealTime,
  });
}

/**
 * Check whether a completed workout satisfies challenge requirements.
 * Called after the user ends a workout session (e.g., 75 Hard gap + outdoor check).
 *
 * Never throws. Returns compliant: true on error so workout logging is never blocked.
 */
export async function checkWorkoutCompliance(
  enrollmentId: string,
  workout: ComplianceWorkout
): Promise<ComplianceResult> {
  return invokeCompliance(enrollmentId, 'workout_logged', {
    duration_minutes: workout.duration_minutes,
    type: workout.type ?? 'strength',
    started_at: workout.started_at,
    is_outdoor: workout.is_outdoor ?? false,
  });
}

/**
 * Calculate water intake pacing against the challenge's daily water target.
 * Called after each water log entry.
 *
 * Never throws. Returns compliant: true on error.
 */
export async function checkWaterPace(
  enrollmentId: string,
  ozAdded: number,
  dailyTotal: number
): Promise<ComplianceResult> {
  return invokeCompliance(enrollmentId, 'water_logged', {
    oz_added: ozAdded,
    daily_total: dailyTotal,
  });
}

/**
 * Pre-screen a food item before the user logs it.
 * Called from food search results when a diet-restricting challenge is active.
 * Use to show a "Not Whole30" badge alongside the food row.
 *
 * Never throws. Returns compliant: true on error.
 */
export async function checkFoodBeforeLogging(
  enrollmentId: string,
  food: ComplianceFoodItem
): Promise<ComplianceResult> {
  return invokeCompliance(enrollmentId, 'food_searched', {
    food_name: food.name,
  });
}

/**
 * Retrieve the full real-time compliance status for today's tasks.
 * Called from challenge-active.tsx on mount to show live task progress
 * (not just the midnight evaluator result).
 *
 * Never throws. Returns compliant: true on error.
 */
export async function getFullComplianceStatus(
  enrollmentId: string
): Promise<ComplianceResult> {
  return invokeCompliance(enrollmentId, 'manual_check', {});
}
