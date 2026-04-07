// =============================================================================
// TRANSFORMR — Dashboard Store
// =============================================================================

import { create } from 'zustand';
import { supabase } from '../services/supabase';
import type { DashboardLayout } from '../types/database';

/** A widget configuration for the dashboard. */
interface DashboardWidget {
  id: string;
  type: string;
  title: string;
  size: 'small' | 'medium' | 'large';
  position: number;
  visible: boolean;
  config: Record<string, string | number | boolean>;
}

const DEFAULT_WIDGETS: DashboardWidget[] = [
  { id: 'workout-summary', type: 'workout_summary', title: 'Workout Summary', size: 'medium', position: 0, visible: true, config: {} },
  { id: 'macro-tracker', type: 'macro_tracker', title: 'Macro Tracker', size: 'medium', position: 1, visible: true, config: {} },
  { id: 'habit-streaks', type: 'habit_streaks', title: 'Habit Streaks', size: 'small', position: 2, visible: true, config: {} },
  { id: 'goal-progress', type: 'goal_progress', title: 'Goal Progress', size: 'medium', position: 3, visible: true, config: {} },
  { id: 'mood-check', type: 'mood_check', title: 'Mood Check-In', size: 'small', position: 4, visible: true, config: {} },
  { id: 'sleep-quality', type: 'sleep_quality', title: 'Sleep Quality', size: 'small', position: 5, visible: true, config: {} },
  { id: 'water-intake', type: 'water_intake', title: 'Water Intake', size: 'small', position: 6, visible: true, config: {} },
  { id: 'partner-activity', type: 'partner_activity', title: 'Partner Activity', size: 'medium', position: 7, visible: true, config: {} },
  { id: 'business-revenue', type: 'business_revenue', title: 'Business Revenue', size: 'large', position: 8, visible: true, config: {} },
  { id: 'finance-overview', type: 'finance_overview', title: 'Finance Overview', size: 'large', position: 9, visible: true, config: {} },
];

interface DashboardState {
  layout: DashboardWidget[];
  availableWidgets: DashboardWidget[];
  isLoading: boolean;
  error: string | null;
}

interface DashboardActions {
  fetchLayout: () => Promise<void>;
  saveLayout: (layout: DashboardWidget[]) => Promise<void>;
  resetToDefault: () => Promise<void>;
  clearError: () => void;
}

type DashboardStore = DashboardState & DashboardActions;

/** Convert widget array to the Record layout format used in the database. */
function widgetsToLayoutRecord(widgets: DashboardWidget[]): Record<string, unknown> {
  return { widgets };
}

/** Extract widget array from the database layout Record. */
function layoutRecordToWidgets(layout: Record<string, unknown>): DashboardWidget[] {
  if (Array.isArray(layout.widgets)) {
    return layout.widgets as DashboardWidget[];
  }
  return DEFAULT_WIDGETS;
}

export const useDashboardStore = create<DashboardStore>()((set) => ({
  // --- State ---
  layout: DEFAULT_WIDGETS,
  availableWidgets: DEFAULT_WIDGETS,
  isLoading: false,
  error: null,

  // --- Actions ---
  fetchLayout: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('dashboard_layouts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();
      if (error) throw error;

      if (data) {
        const dashboardLayout = data as DashboardLayout;
        set({
          layout: layoutRecordToWidgets(dashboardLayout.layout),
          availableWidgets: DEFAULT_WIDGETS,
          isLoading: false,
        });
      } else {
        set({
          layout: DEFAULT_WIDGETS,
          availableWidgets: DEFAULT_WIDGETS,
          isLoading: false,
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch dashboard layout';
      set({ error: message, isLoading: false });
    }
  },

  saveLayout: async (layout) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('dashboard_layouts')
        .upsert(
          {
            user_id: user.id,
            name: 'default',
            is_active: true,
            layout: widgetsToLayoutRecord(layout),
          },
          { onConflict: 'user_id' },
        );
      if (error) throw error;

      set({ layout, isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save dashboard layout';
      set({ error: message, isLoading: false });
    }
  },

  resetToDefault: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('dashboard_layouts')
        .upsert(
          {
            user_id: user.id,
            name: 'default',
            is_active: true,
            layout: widgetsToLayoutRecord(DEFAULT_WIDGETS),
          },
          { onConflict: 'user_id' },
        );
      if (error) throw error;

      set({ layout: DEFAULT_WIDGETS, isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to reset dashboard';
      set({ error: message, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
