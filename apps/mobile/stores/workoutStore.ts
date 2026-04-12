// =============================================================================
// TRANSFORMR — Workout Store
// =============================================================================

import { create } from 'zustand';
import { supabase } from '../services/supabase';
import type {
  WorkoutSession,
  WorkoutTemplate,
  Exercise,
  WorkoutSet,
} from '../types/database';

/** Data for logging a single set. */
interface SetData {
  weight?: number;
  reps?: number;
  duration_seconds?: number;
  distance?: number;
  rpe?: number;
  is_warmup?: boolean;
  is_dropset?: boolean;
  is_failure?: boolean;
}

/** Filters for querying exercises. */
interface ExerciseFilter {
  category?: Exercise['category'];
  equipment?: Exercise['equipment'];
  difficulty?: Exercise['difficulty'];
  search?: string;
}

/** Ghost-mode data from a previous session. */
interface GhostSet {
  exercise_id: string;
  set_number: number;
  weight: number | undefined;
  reps: number | undefined;
  session_date: string;
}

interface WorkoutState {
  activeSession: WorkoutSession | null;
  templates: WorkoutTemplate[];
  exercises: Exercise[];
  isLoading: boolean;
  error: string | null;
}

interface WorkoutActions {
  startWorkout: (templateId: string | null) => Promise<void>;
  logSet: (exerciseId: string, setData: SetData) => Promise<void>;
  completeWorkout: () => Promise<void>;
  fetchTemplates: () => Promise<void>;
  fetchExercises: (filters?: ExerciseFilter) => Promise<void>;
  getGhostData: (exerciseId: string) => Promise<GhostSet[]>;
  clearError: () => void;
  reset: () => void;
}

type WorkoutStore = WorkoutState & WorkoutActions;

export const useWorkoutStore = create<WorkoutStore>()((set, get) => ({
  // --- State ---
  activeSession: null,
  templates: [],
  exercises: [],
  isLoading: false,
  error: null,

  // --- Actions ---
  startWorkout: async (templateId) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('workout_sessions')
        .insert({
          user_id: user.id,
          template_id: templateId,
          name: 'Workout',
          started_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;

      set({ activeSession: data as WorkoutSession, isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to start workout';
      set({ error: message, isLoading: false });
    }
  },

  logSet: async (exerciseId, setData) => {
    set({ isLoading: true, error: null });
    try {
      const session = get().activeSession;
      if (!session) throw new Error('No active workout session');

      // Get current set count for this exercise in this session
      const { count, error: countError } = await supabase
        .from('workout_sets')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', session.id)
        .eq('exercise_id', exerciseId);
      if (countError) throw countError;

      const setNumber = (count ?? 0) + 1;

      const insertData: Omit<WorkoutSet, 'id'> = {
        session_id: session.id,
        exercise_id: exerciseId,
        set_number: setNumber,
        weight: setData.weight,
        reps: setData.reps,
        duration_seconds: setData.duration_seconds,
        distance: setData.distance,
        rpe: setData.rpe,
        is_warmup: setData.is_warmup ?? false,
        is_dropset: setData.is_dropset ?? false,
        is_failure: setData.is_failure ?? false,
        logged_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('workout_sets')
        .insert(insertData);
      if (error) throw error;

      set({ isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to log set';
      set({ error: message, isLoading: false });
    }
  },

  completeWorkout: async () => {
    set({ isLoading: true, error: null });
    try {
      const session = get().activeSession;
      if (!session) throw new Error('No active workout session');

      const completedAt = new Date().toISOString();
      const startedAt = new Date(session.started_at).getTime();
      const durationMinutes = Math.round((Date.now() - startedAt) / 60_000);

      const { error } = await supabase
        .from('workout_sessions')
        .update({
          completed_at: completedAt,
          duration_minutes: durationMinutes,
        })
        .eq('id', session.id);
      if (error) throw error;

      set({ activeSession: null, isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to complete workout';
      set({ error: message, isLoading: false });
    }
  },

  fetchTemplates: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('workout_templates')
        .select('*')
        .or(`user_id.eq.${user.id},is_shared.eq.true`)
        .order('sort_order');
      if (error) throw error;

      set({ templates: (data ?? []) as WorkoutTemplate[], isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch templates';
      set({ error: message, isLoading: false });
    }
  },

  fetchExercises: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      let query = supabase.from('exercises').select('*');

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.equipment) {
        query = query.eq('equipment', filters.equipment);
      }
      if (filters?.difficulty) {
        query = query.eq('difficulty', filters.difficulty);
      }
      if (filters?.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }

      const { data, error } = await query.order('name');
      if (error) throw error;

      set({ exercises: (data ?? []) as Exercise[], isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch exercises';
      set({ error: message, isLoading: false });
    }
  },

  getGhostData: async (exerciseId): Promise<GhostSet[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Get the most recent completed session's sets for this exercise
      const { data, error } = await supabase
        .from('workout_sets')
        .select(`
          exercise_id,
          set_number,
          weight,
          reps,
          workout_sessions!inner(user_id, completed_at)
        `)
        .eq('exercise_id', exerciseId)
        .eq('workout_sessions.user_id', user.id)
        .not('workout_sessions.completed_at', 'is', null)
        .order('workout_sessions(completed_at)', { ascending: false })
        .limit(20);
      if (error) throw error;

      return (data ?? []).map((row: Record<string, unknown>) => ({
        exercise_id: (row.exercise_id as string) ?? exerciseId,
        set_number: row.set_number as number,
        weight: row.weight as number,
        reps: row.reps as number,
        session_date: '',
      }));
    } catch {
      return [];
    }
  },

  clearError: () => set({ error: null }),

  reset: () =>
    set({
      activeSession: null,
      templates: [],
      exercises: [],
      isLoading: false,
      error: null,
    }),
}));
