// =============================================================================
// TRANSFORMR -- AI Challenge Coach Service
// =============================================================================

import { supabase } from '@services/supabase';
import type {
  ChallengeDefinition,
  ChallengeEnrollment,
  ChallengeDailyLog,
} from '@app-types/database';

interface ChallengeCoachResponse {
  message: string;
  tips: string[];
  urgentTasks: string[];
  motivation: string;
}

/**
 * Get AI coaching for active challenge based on progress and patterns.
 */
export async function getChallengeCoaching(
  enrollmentId: string,
  challenge: ChallengeDefinition,
  enrollment: ChallengeEnrollment,
  recentLogs: ChallengeDailyLog[],
  timeOfDay: 'morning' | 'afternoon' | 'evening'
): Promise<ChallengeCoachResponse> {
  const completedDays = recentLogs.filter((l) => l.all_tasks_completed).length;
  const missedTasks = recentLogs
    .flatMap((log) => {
      const tasks = log.tasks_completed ?? {};
      return Object.entries(tasks)
        .filter(([, done]) => !done)
        .map(([taskId]) => taskId);
    });

  // Count frequency of missed tasks
  const missedFrequency: Record<string, number> = {};
  for (const task of missedTasks) {
    missedFrequency[task] = (missedFrequency[task] ?? 0) + 1;
  }

  const { data, error } = await supabase.functions.invoke('challenge-coach', {
    body: {
      enrollment_id: enrollmentId,
      challenge_name: challenge.name,
      challenge_rules: challenge.rules,
      current_day: enrollment.current_day,
      total_days: challenge.duration_days,
      restart_count: enrollment.restart_count,
      completed_days_last_7: completedDays,
      missed_task_frequency: missedFrequency,
      time_of_day: timeOfDay,
      restart_on_failure: challenge.restart_on_failure,
    },
  });

  if (error) {
    throw new Error(`Challenge coaching failed: ${error.message}`);
  }

  return data as ChallengeCoachResponse;
}

/**
 * Get challenge-specific diet compliance check.
 * Used by 75 Hard, Whole30, and custom challenges with nutrition rules.
 */
export async function checkDietCompliance(
  userId: string,
  date: string,
  dietRules: Record<string, unknown>
): Promise<{ compliant: boolean; violations: string[]; score: number }> {
  const { data, error } = await supabase.functions.invoke('ai-meal-analysis', {
    body: {
      action: 'diet_compliance',
      user_id: userId,
      date,
      diet_rules: dietRules,
    },
  });

  if (error) {
    return { compliant: true, violations: [], score: 100 }; // Fail open
  }

  return data as { compliant: boolean; violations: string[]; score: number };
}

/**
 * Generate challenge failure reflection.
 * Called when a restart-on-failure challenge resets.
 */
export async function generateFailureReflection(
  challenge: ChallengeDefinition,
  enrollment: ChallengeEnrollment,
  failedDay: number,
  missedTasks: string[]
): Promise<{ reflection: string; strategy: string[] }> {
  const { data, error } = await supabase.functions.invoke('challenge-coach', {
    body: {
      action: 'failure_reflection',
      challenge_name: challenge.name,
      failed_on_day: failedDay,
      restart_number: (enrollment.restart_count ?? 0) + 1,
      missed_tasks: missedTasks,
      previous_best_streak: enrollment.current_day,
    },
  });

  if (error) {
    return {
      reflection: `You made it to Day ${failedDay}. That's ${failedDay} days of discipline. Let's go again.`,
      strategy: ['Set earlier reminders for the tasks you missed', 'Consider adjusting your daily schedule'],
    };
  }

  return data as { reflection: string; strategy: string[] };
}

/**
 * Generate challenge completion celebration message.
 */
export async function generateCompletionMessage(
  challenge: ChallengeDefinition,
  enrollment: ChallengeEnrollment,
  totalLogs: ChallengeDailyLog[]
): Promise<{ message: string; stats: Record<string, string> }> {
  const perfectDays = totalLogs.filter((l) => l.all_tasks_completed).length;
  const totalDays = challenge.duration_days;

  const { data, error } = await supabase.functions.invoke('challenge-coach', {
    body: {
      action: 'completion',
      challenge_name: challenge.name,
      total_days: totalDays,
      perfect_days: perfectDays,
      restart_count: enrollment.restart_count ?? 0,
      compliance_rate: Math.round((perfectDays / totalDays) * 100),
    },
  });

  if (error) {
    return {
      message: `You completed ${challenge.name}! ${perfectDays}/${totalDays} perfect days. Incredible discipline.`,
      stats: {
        'Perfect Days': `${perfectDays}/${totalDays}`,
        'Compliance Rate': `${Math.round((perfectDays / totalDays) * 100)}%`,
        'Restarts': String(enrollment.restart_count ?? 0),
      },
    };
  }

  return data as { message: string; stats: Record<string, string> };
}
