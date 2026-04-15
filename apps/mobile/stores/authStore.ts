// =============================================================================
// TRANSFORMR — Auth Store
// =============================================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import type { Session, User, Subscription } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  error: string | null;
  rateLimitSeconds: number;
}

interface AuthActions {
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  setSession: (session: Session | null) => void;
  listenToAuthChanges: () => Subscription;
  clearError: () => void;
  tickRateLimit: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // --- State ---
      session: null,
      user: null,
      loading: false,
      error: null,
      rateLimitSeconds: 0,

      // --- Actions ---
      signUp: async (email, password, displayName) => {
        if (get().rateLimitSeconds > 0) {
          set({ error: `Please wait ${get().rateLimitSeconds}s before trying again.` });
          return;
        }
        set({ loading: true, error: null });
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { display_name: displayName },
            },
          });
          if (error) {
            // Parse Supabase rate limit errors
            if (error.message.includes('after') || error.message.includes('seconds') || error.status === 429) {
              const match = error.message.match(/(\d+)/);
              const secs = match ? parseInt(match[1] ?? '60', 10) : 60;
              set({ error: `Please wait ${secs} seconds before trying again.`, loading: false, rateLimitSeconds: secs });
              // Countdown
              const interval = setInterval(() => {
                const remaining = get().rateLimitSeconds - 1;
                if (remaining <= 0) {
                  clearInterval(interval);
                  set({ rateLimitSeconds: 0 });
                } else {
                  set({ rateLimitSeconds: remaining });
                }
              }, 1000);
            } else {
              throw error;
            }
            return;
          }
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

      signInWithGoogle: async () => {
        set({ loading: true, error: null });
        try {
          const redirectUrl = Linking.createURL('callback');
          const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: redirectUrl,
              queryParams: { access_type: 'offline', prompt: 'consent' },
              skipBrowserRedirect: true,
            },
          });
          if (error) throw error;
          if (!data.url) throw new Error('No auth URL returned');

          const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
          if (result.type === 'success' && result.url) {
            const url = new URL(result.url);
            // PKCE flow: exchange code for session
            const code = url.searchParams.get('code');
            if (code) {
              await supabase.auth.exchangeCodeForSession(code);
              set({ loading: false });
              return;
            }
            // Implicit flow: tokens may be in hash fragment
            const hash = url.hash.startsWith('#') ? url.hash.substring(1) : '';
            const hashParams = new URLSearchParams(hash);
            const accessToken = hashParams.get('access_token') ?? url.searchParams.get('access_token');
            const refreshToken = hashParams.get('refresh_token') ?? url.searchParams.get('refresh_token');
            if (accessToken && refreshToken) {
              await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
              set({ loading: false });
              return;
            }
          }
          set({ loading: false });
        } catch (err: unknown) {
          const raw = err instanceof Error ? err.message : 'Google sign-in failed';
          set({ error: raw, loading: false });
        }
      },

      signInWithApple: async () => {
        set({ loading: true, error: null });
        try {
          const redirectUrl = Linking.createURL('callback');
          const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'apple',
            options: {
              redirectTo: redirectUrl,
              skipBrowserRedirect: true,
            },
          });
          if (error) throw error;
          if (!data.url) throw new Error('No auth URL returned');

          const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
          if (result.type === 'success' && result.url) {
            const url = new URL(result.url);
            // PKCE flow: exchange code for session
            const code = url.searchParams.get('code');
            if (code) {
              await supabase.auth.exchangeCodeForSession(code);
              set({ loading: false });
              return;
            }
            // Implicit flow: tokens may be in hash fragment
            const hash = url.hash.startsWith('#') ? url.hash.substring(1) : '';
            const hashParams = new URLSearchParams(hash);
            const accessToken = hashParams.get('access_token') ?? url.searchParams.get('access_token');
            const refreshToken = hashParams.get('refresh_token') ?? url.searchParams.get('refresh_token');
            if (accessToken && refreshToken) {
              await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
              set({ loading: false });
              return;
            }
          }
          set({ loading: false });
        } catch (err: unknown) {
          const raw = err instanceof Error ? err.message : 'Apple sign-in failed';
          set({ error: raw, loading: false });
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

      tickRateLimit: () => {
        const remaining = get().rateLimitSeconds - 1;
        set({ rateLimitSeconds: Math.max(0, remaining) });
      },
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
