// =============================================================================
// TRANSFORMR -- useSmartNotifications Hook (Module 8)
// Manages user's smart notification rule preferences. Fetches rules from
// Supabase and exposes a mutation to toggle individual rules on/off.
// =============================================================================

import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@services/supabase';
import { useAuthStore } from '@stores/authStore';

export type NotificationTriggerType =
  | 'missed_workout'
  | 'missed_meal_log'
  | 'water_reminder'
  | 'supplement_reminder'
  | 'sleep_window'
  | 'streak_at_risk'
  | 'weight_logged_weekly'
  | 'journal_prompt'
  | 'focus_session_reminder'
  | 'goal_deadline_approaching'
  | 'mood_check_in'
  | 'recovery_day';

export interface SmartNotificationRule {
  id: string;
  user_id: string;
  trigger_type: NotificationTriggerType;
  is_enabled: boolean;
  cooldown_hours: number;
  custom_message: string | null;
  last_triggered_at: string | null;
  created_at: string;
  updated_at: string;
}

export const TRIGGER_LABELS: Record<NotificationTriggerType, string> = {
  missed_workout: 'Missed Workout',
  missed_meal_log: 'Missed Meal Log',
  water_reminder: 'Water Reminder',
  supplement_reminder: 'Supplement Reminder',
  sleep_window: 'Sleep Window',
  streak_at_risk: 'Streak at Risk',
  weight_logged_weekly: 'Weekly Weigh-In',
  journal_prompt: 'Journal Prompt',
  focus_session_reminder: 'Focus Session Reminder',
  goal_deadline_approaching: 'Goal Deadline',
  mood_check_in: 'Mood Check-In',
  recovery_day: 'Recovery Day',
};

export const TRIGGER_DESCRIPTIONS: Record<NotificationTriggerType, string> = {
  missed_workout: 'Alert when no workout logged in 2+ days',
  missed_meal_log: 'Remind to log meals after 6pm if nothing tracked',
  water_reminder: 'Nudge at noon if under 50% of water goal',
  supplement_reminder: 'Morning reminder for unlogged supplements at 9am',
  sleep_window: 'Wind-down alert 30 minutes before target bedtime',
  streak_at_risk: 'Alert after 8pm if habit streak may break tonight',
  weight_logged_weekly: 'Reminder if no weight logged in 7 days',
  journal_prompt: 'AI-generated prompt after 3 days without journaling',
  focus_session_reminder: 'Reminder to complete a focus/deep work session',
  goal_deadline_approaching: 'Alert when a goal deadline is within 7 days at <70%',
  mood_check_in: 'Daily mood check-in prompt at 7pm',
  recovery_day: 'Recovery suggestion when readiness score is low',
};

const QUERY_KEY = 'smartNotificationRules';

async function fetchRules(userId: string): Promise<SmartNotificationRule[]> {
  const { data, error } = await supabase
    .from('smart_notification_rules')
    .select('*')
    .eq('user_id', userId)
    .order('trigger_type', { ascending: true });

  if (error) throw error;
  return (data ?? []) as SmartNotificationRule[];
}

async function toggleRuleMutation(params: {
  ruleId: string;
  isEnabled: boolean;
}): Promise<void> {
  const { error } = await supabase
    .from('smart_notification_rules')
    .update({ is_enabled: params.isEnabled, updated_at: new Date().toISOString() })
    .eq('id', params.ruleId);

  if (error) throw error;
}

interface UseSmartNotificationsResult {
  rules: SmartNotificationRule[];
  isLoading: boolean;
  error: Error | null;
  toggleRule: (ruleId: string, enabled: boolean) => Promise<void>;
  isToggling: boolean;
}

export function useSmartNotifications(): UseSmartNotificationsResult {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const { data: rules = [], isLoading, error } = useQuery<SmartNotificationRule[], Error>({
    queryKey: [QUERY_KEY, user?.id],
    queryFn: () => {
      if (!user?.id) return Promise.resolve([]);
      return fetchRules(user.id);
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const mutation = useMutation<void, Error, { ruleId: string; isEnabled: boolean }>({
    mutationFn: toggleRuleMutation,
    onMutate: async ({ ruleId, isEnabled }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY, user?.id] });
      const previous = queryClient.getQueryData<SmartNotificationRule[]>([QUERY_KEY, user?.id]);
      queryClient.setQueryData<SmartNotificationRule[]>(
        [QUERY_KEY, user?.id],
        (old) =>
          (old ?? []).map((r) =>
            r.id === ruleId ? { ...r, is_enabled: isEnabled } : r,
          ),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      const ctx = context as { previous?: SmartNotificationRule[] } | undefined;
      if (ctx?.previous) {
        queryClient.setQueryData([QUERY_KEY, user?.id], ctx.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEY, user?.id] });
    },
  });

  const toggleRule = useCallback(
    async (ruleId: string, enabled: boolean) => {
      await mutation.mutateAsync({ ruleId, isEnabled: enabled });
    },
    [mutation],
  );

  return {
    rules,
    isLoading,
    error: error ?? null,
    toggleRule,
    isToggling: mutation.isPending,
  };
}
