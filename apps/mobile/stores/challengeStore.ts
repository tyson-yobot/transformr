// =============================================================================
// TRANSFORMR — Challenge Center Store
// =============================================================================

import { create } from 'zustand';
import { supabase } from '../services/supabase';
import type {
  ChallengeDefinition,
  ChallengeEnrollment,
  ChallengeDailyLog,
} from '../types/database';

/** Progress summary for today's challenge tasks. */
interface TodayProgress {
  completed: number;
  total: number;
  percentage: number;
}

interface ChallengeState {
  challengeDefinitions: ChallengeDefinition[];
  activeEnrollment: ChallengeEnrollment | null;
  enrollments: ChallengeEnrollment[];
  dailyLogs: ChallengeDailyLog[];
  todayLog: ChallengeDailyLog | null;
  isLoading: boolean;
  error: string | null;
}

interface ChallengeActions {
  fetchChallengeDefinitions: () => Promise<void>;
  fetchEnrollments: (userId: string) => Promise<void>;
  fetchActiveEnrollment: (userId: string) => Promise<void>;
  fetchDailyLogs: (enrollmentId: string) => Promise<void>;
  enrollInChallenge: (
    userId: string,
    challengeId: string,
    configuration?: Record<string, unknown>,
  ) => Promise<void>;
  logDailyTask: (
    enrollmentId: string,
    taskId: string,
    completed: boolean,
    autoVerified?: boolean,
  ) => Promise<void>;
  completeDailyLog: (enrollmentId: string) => Promise<void>;
  abandonChallenge: (enrollmentId: string) => Promise<void>;
  restartChallenge: (enrollmentId: string) => Promise<void>;
  createCustomChallenge: (
    userId: string,
    definition: Omit<ChallengeDefinition, 'id' | 'created_at'>,
  ) => Promise<void>;
  getTodayProgress: () => TodayProgress;
  clearError: () => void;
  reset: () => void;
}

type ChallengeStore = ChallengeState & ChallengeActions;

function getTodayDateString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export const useChallengeStore = create<ChallengeStore>()((set, get) => ({
  // --- State ---
  challengeDefinitions: [],
  activeEnrollment: null,
  enrollments: [],
  dailyLogs: [],
  todayLog: null,
  isLoading: false,
  error: null,

  // --- Actions ---

  fetchChallengeDefinitions: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Load all system challenges plus any created by this user
      const { data, error } = await supabase
        .from('challenge_definitions')
        .select('*')
        .or(`is_system.eq.true,created_by.eq.${user.id}`)
        .order('created_at', { ascending: false });
      if (error) throw error;

      set({
        challengeDefinitions: (data ?? []) as ChallengeDefinition[],
        isLoading: false,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch challenge definitions';
      set({ error: message, isLoading: false });
    }
  },

  fetchEnrollments: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('challenge_enrollments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;

      set({
        enrollments: (data ?? []) as ChallengeEnrollment[],
        isLoading: false,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch enrollments';
      set({ error: message, isLoading: false });
    }
  },

  fetchActiveEnrollment: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('challenge_enrollments')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;

      set({
        activeEnrollment: (data as ChallengeEnrollment) ?? null,
        isLoading: false,
      });

      // If we found an active enrollment, also load today's log
      if (data) {
        const today = getTodayDateString();
        const { data: logData, error: logError } = await supabase
          .from('challenge_daily_logs')
          .select('*')
          .eq('enrollment_id', data.id)
          .eq('date', today)
          .maybeSingle();
        if (logError) throw logError;

        set({ todayLog: (logData as ChallengeDailyLog) ?? null });
      } else {
        set({ todayLog: null });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch active enrollment';
      set({ error: message, isLoading: false });
    }
  },

  fetchDailyLogs: async (enrollmentId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('challenge_daily_logs')
        .select('*')
        .eq('enrollment_id', enrollmentId)
        .order('day_number', { ascending: true });
      if (error) throw error;

      const logs = (data ?? []) as ChallengeDailyLog[];
      const today = getTodayDateString();
      const todayLog = logs.find((log) => log.date === today) ?? null;

      set({
        dailyLogs: logs,
        todayLog,
        isLoading: false,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch daily logs';
      set({ error: message, isLoading: false });
    }
  },

  enrollInChallenge: async (
    userId: string,
    challengeId: string,
    configuration?: Record<string, unknown>,
  ) => {
    set({ isLoading: true, error: null });
    try {
      // Calculate target_end_date from challenge duration
      const { challengeDefinitions } = get();
      const def = challengeDefinitions.find((d) => d.id === challengeId);
      const durationDays = def?.duration_days ?? 30;
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + durationDays);

      const { data, error } = await supabase
        .from('challenge_enrollments')
        .insert({
          user_id: userId,
          challenge_id: challengeId,
          status: 'active',
          started_at: startDate.toISOString().split('T')[0],
          target_end_date: endDate.toISOString().split('T')[0],
          current_day: 1,
          restart_count: 0,
          configuration: configuration ?? null,
        })
        .select()
        .single();
      if (error) throw error;

      const enrollment = data as ChallengeEnrollment;

      set((state) => ({
        activeEnrollment: enrollment,
        enrollments: [enrollment, ...state.enrollments],
        todayLog: null,
        dailyLogs: [],
        isLoading: false,
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to enroll in challenge';
      set({ error: message, isLoading: false });
    }
  },

  logDailyTask: async (
    enrollmentId: string,
    taskId: string,
    completed: boolean,
    autoVerified?: boolean,
  ) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const today = getTodayDateString();
      const { activeEnrollment, todayLog } = get();

      if (todayLog) {
        // Update existing log — merge task status
        const updatedTasks = {
          ...todayLog.tasks_completed,
          [taskId]: completed,
          ...(autoVerified !== undefined ? { [`${taskId}_auto`]: autoVerified } : {}),
        };

        const { data, error } = await supabase
          .from('challenge_daily_logs')
          .update({ tasks_completed: updatedTasks })
          .eq('id', todayLog.id)
          .select()
          .single();
        if (error) throw error;

        const updatedLog = data as ChallengeDailyLog;

        set((state) => ({
          todayLog: updatedLog,
          dailyLogs: state.dailyLogs.map((log) =>
            log.id === updatedLog.id ? updatedLog : log,
          ),
          isLoading: false,
        }));
      } else {
        // Create a new daily log for today
        const tasksCompleted: Record<string, boolean> = {
          [taskId]: completed,
          ...(autoVerified !== undefined ? { [`${taskId}_auto`]: autoVerified } : {}),
        };

        const { data, error } = await supabase
          .from('challenge_daily_logs')
          .insert({
            enrollment_id: enrollmentId,
            user_id: user.id,
            date: today,
            day_number: activeEnrollment?.current_day ?? 1,
            tasks_completed: tasksCompleted,
            all_tasks_completed: false,
          })
          .select()
          .single();
        if (error) throw error;

        const newLog = data as ChallengeDailyLog;

        set((state) => ({
          todayLog: newLog,
          dailyLogs: [...state.dailyLogs, newLog],
          isLoading: false,
        }));
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to log daily task';
      set({ error: message, isLoading: false });
    }
  },

  completeDailyLog: async (enrollmentId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { todayLog, activeEnrollment } = get();
      if (!todayLog) throw new Error('No daily log found for today');

      // Mark today's log as fully complete
      const { data: updatedLog, error: logError } = await supabase
        .from('challenge_daily_logs')
        .update({ all_tasks_completed: true })
        .eq('id', todayLog.id)
        .select()
        .single();
      if (logError) throw logError;

      // Advance the enrollment's current day
      // current_day serves as the streak counter; longest_streak is the all-time best
      const nextDay = (activeEnrollment?.current_day ?? 1) + 1;
      const newLongestStreak = Math.max(activeEnrollment?.longest_streak ?? 0, nextDay - 1);

      const { data: updatedEnrollment, error: enrollError } = await supabase
        .from('challenge_enrollments')
        .update({
          current_day: nextDay,
          longest_streak: newLongestStreak,
        })
        .eq('id', enrollmentId)
        .select()
        .single();
      if (enrollError) throw enrollError;

      const log = updatedLog as ChallengeDailyLog;
      const enrollment = updatedEnrollment as ChallengeEnrollment;

      set((state) => ({
        todayLog: log,
        dailyLogs: state.dailyLogs.map((l) => (l.id === log.id ? log : l)),
        activeEnrollment: enrollment,
        enrollments: state.enrollments.map((e) =>
          e.id === enrollment.id ? enrollment : e,
        ),
        isLoading: false,
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to complete daily log';
      set({ error: message, isLoading: false });
    }
  },

  abandonChallenge: async (enrollmentId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('challenge_enrollments')
        .update({ status: 'abandoned' })
        .eq('id', enrollmentId)
        .select()
        .single();
      if (error) throw error;

      const enrollment = data as ChallengeEnrollment;

      set((state) => ({
        activeEnrollment:
          state.activeEnrollment?.id === enrollmentId ? null : state.activeEnrollment,
        enrollments: state.enrollments.map((e) =>
          e.id === enrollment.id ? enrollment : e,
        ),
        todayLog: state.activeEnrollment?.id === enrollmentId ? null : state.todayLog,
        dailyLogs: state.activeEnrollment?.id === enrollmentId ? [] : state.dailyLogs,
        isLoading: false,
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to abandon challenge';
      set({ error: message, isLoading: false });
    }
  },

  restartChallenge: async (enrollmentId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { activeEnrollment, challengeDefinitions } = get();
      const prevRestartCount = activeEnrollment?.restart_count ?? 0;

      // Recalculate target_end_date from challenge duration
      const def = challengeDefinitions.find(
        (d) => d.id === activeEnrollment?.challenge_id,
      );
      const durationDays = def?.duration_days ?? 30;
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + durationDays);

      const { data, error } = await supabase
        .from('challenge_enrollments')
        .update({
          current_day: 1,
          started_at: startDate.toISOString().split('T')[0],
          target_end_date: endDate.toISOString().split('T')[0],
          restart_count: prevRestartCount + 1,
          status: 'active',
        })
        .eq('id', enrollmentId)
        .select()
        .single();
      if (error) throw error;

      const enrollment = data as ChallengeEnrollment;

      set((state) => ({
        activeEnrollment: enrollment,
        enrollments: state.enrollments.map((e) =>
          e.id === enrollment.id ? enrollment : e,
        ),
        todayLog: null,
        dailyLogs: [],
        isLoading: false,
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to restart challenge';
      set({ error: message, isLoading: false });
    }
  },

  createCustomChallenge: async (
    userId: string,
    definition: Omit<ChallengeDefinition, 'id' | 'created_at'>,
  ) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('challenge_definitions')
        .insert({
          ...definition,
          created_by: userId,
          is_system: false,
        })
        .select()
        .single();
      if (error) throw error;

      set((state) => ({
        challengeDefinitions: [data as ChallengeDefinition, ...state.challengeDefinitions],
        isLoading: false,
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create custom challenge';
      set({ error: message, isLoading: false });
    }
  },

  getTodayProgress: (): TodayProgress => {
    const { todayLog, activeEnrollment, challengeDefinitions } = get();

    if (!activeEnrollment || !activeEnrollment.challenge_id) {
      return { completed: 0, total: 0, percentage: 0 };
    }

    // Find the challenge definition to determine total tasks
    const definition = challengeDefinitions.find(
      (d) => d.id === activeEnrollment.challenge_id,
    );
    const totalTasks = definition?.rules?.tasks?.length ?? 0;

    if (totalTasks === 0) {
      return { completed: 0, total: 0, percentage: 0 };
    }

    if (!todayLog) {
      return { completed: 0, total: totalTasks, percentage: 0 };
    }

    // Count tasks marked as completed (ignore auto-verification metadata keys)
    const completedCount = Object.entries(todayLog.tasks_completed).filter(
      ([key, value]) => !key.endsWith('_auto') && value === true,
    ).length;

    return {
      completed: completedCount,
      total: totalTasks,
      percentage: Math.round((completedCount / totalTasks) * 100),
    };
  },

  clearError: () => set({ error: null }),

  reset: () =>
    set({
      challengeDefinitions: [],
      activeEnrollment: null,
      enrollments: [],
      dailyLogs: [],
      todayLog: null,
      isLoading: false,
      error: null,
    }),
}));
