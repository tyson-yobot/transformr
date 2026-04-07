// =============================================================================
// TRANSFORMR — Profile Store
// =============================================================================

import { create } from 'zustand';
import { supabase } from '../services/supabase';
import type { Profile } from '../types/database';

interface ProfileState {
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;
}

interface ProfileActions {
  fetchProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Omit<Profile, 'id' | 'email'>>) => Promise<void>;
  setTheme: (mode: NonNullable<Profile['theme']>) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

type ProfileStore = ProfileState & ProfileActions;

export const useProfileStore = create<ProfileStore>()((set, get) => ({
  // --- State ---
  profile: null,
  isLoading: false,
  error: null,

  // --- Actions ---
  fetchProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error) throw error;

      set({ profile: data as Profile, isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch profile';
      set({ error: message, isLoading: false });
    }
  },

  updateProfile: async (updates) => {
    set({ isLoading: true, error: null });
    try {
      const profile = get().profile;
      if (!profile) throw new Error('No profile loaded');

      const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', profile.id)
        .select()
        .single();
      if (error) throw error;

      set({ profile: data as Profile, isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update profile';
      set({ error: message, isLoading: false });
    }
  },

  setTheme: async (mode) => {
    const { updateProfile } = get();
    await updateProfile({ theme: mode });
  },

  clearError: () => set({ error: null }),

  reset: () => set({ profile: null, isLoading: false, error: null }),
}));
