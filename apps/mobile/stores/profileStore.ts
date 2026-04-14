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

      // PGRST116 = no rows found — create the profile row for new users
      if (error && error.code === 'PGRST116') {
        const { data: created, error: createError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            email: user.email ?? '',
            display_name: user.user_metadata?.display_name ?? user.email?.split('@')[0] ?? 'User',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();
        if (createError) throw createError;
        set({ profile: created as Profile, isLoading: false });
        return;
      }
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
      let profile = get().profile;

      // If no profile in memory, fetch the auth user and upsert
      if (!profile) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');
        const { data: upserted, error: upsertError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            email: user.email ?? '',
            display_name: user.user_metadata?.display_name ?? user.email?.split('@')[0] ?? 'User',
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();
        if (upsertError) throw upsertError;
        set({ profile: upserted as Profile, isLoading: false });
        return;
      }

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
