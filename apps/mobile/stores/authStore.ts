// =============================================================================
// TRANSFORMR — Auth Store
// =============================================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session, User, Subscription } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  error: string | null;
}

interface AuthActions {
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  setSession: (session: Session | null) => void;
  listenToAuthChanges: () => Subscription;
  clearError: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      // --- State ---
      session: null,
      user: null,
      loading: false,
      error: null,

      // --- Actions ---
      signUp: async (email, password, displayName) => {
        set({ loading: true, error: null });
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { display_name: displayName },
            },
          });
          if (error) throw error;
          set({ session: data.session, user: data.user, loading: false });
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Sign up failed';
          set({ error: message, loading: false });
        }
      },

      signIn: async (email, password) => {
        set({ loading: true, error: null });
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (error) throw error;
          set({ session: data.session, user: data.user, loading: false });
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Sign in failed';
          set({ error: message, loading: false });
        }
      },

      signOut: async () => {
        set({ loading: true, error: null });
        try {
          const { error } = await supabase.auth.signOut();
          if (error) throw error;
          set({ session: null, user: null, loading: false });
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Sign out failed';
          set({ error: message, loading: false });
        }
      },

      resetPassword: async (email) => {
        set({ loading: true, error: null });
        try {
          const { error } = await supabase.auth.resetPasswordForEmail(email);
          if (error) throw error;
          set({ loading: false });
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Password reset failed';
          set({ error: message, loading: false });
        }
      },

      listenToAuthChanges: () => {
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
          set({ session, user: session?.user ?? null });
        });
        return subscription;
      },

      setSession: (session) => set({ session, user: session?.user ?? null }),

      clearError: () => set({ error: null }),
    }),
    {
      name: 'transformr-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        session: state.session,
        user: state.user,
      }),
    },
  ),
);
