// =============================================================================
// TRANSFORMR — Auth Store
// =============================================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
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
      loading: true, // true until AsyncStorage rehydration completes
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
              emailRedirectTo: Linking.createURL('auth/callback'),
            },
          });
          if (error) {
            const raw = error.message?.toLowerCase() ?? '';
            if (raw.includes('after') || raw.includes('seconds') || error.status === 429) {
              const match = error.message.match(/(\d+)/);
              const secs = match ? parseInt(match[1] ?? '60', 10) : 60;
              set({ error: `Please wait ${secs} seconds before trying again.`, loading: false, rateLimitSeconds: secs });
              const interval = setInterval(() => {
                const remaining = get().rateLimitSeconds - 1;
                if (remaining <= 0) {
                  clearInterval(interval);
                  set({ rateLimitSeconds: 0 });
                } else {
                  set({ rateLimitSeconds: remaining });
                }
              }, 1000);
            } else if (raw.includes('already registered') || raw.includes('already exists') || raw.includes('user_already_exists')) {
              set({ error: 'An account with this email already exists. Try signing in.', loading: false });
            } else if (raw.includes('password') && raw.includes('6')) {
              set({ error: 'Password must be at least 8 characters.', loading: false });
            } else {
              set({ error: error.message ?? 'Registration failed. Please try again.', loading: false });
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
          if (error) {
            const msg = (() => {
              const raw = error.message?.toLowerCase() ?? '';
              if (raw.includes('invalid login') || raw.includes('invalid_credentials') || raw.includes('invalid credentials')) {
                return 'Incorrect email or password. Please try again.';
              }
              if (raw.includes('email not confirmed') || raw.includes('not confirmed')) {
                return 'Please confirm your email before signing in. Check your inbox.';
              }
              if (raw.includes('too many') || error.status === 429) {
                return 'Too many attempts. Please wait a few minutes and try again.';
              }
              if (raw.includes('network') || raw.includes('fetch') || raw.includes('connect')) {
                return 'Unable to connect. Check your internet connection.';
              }
              return error.message ?? 'Sign in failed. Please try again.';
            })();
            set({ error: msg, loading: false });
            return;
          }
          set({ session: data.session, user: data.user, loading: false });
        } catch (err: unknown) {
          const raw = (err instanceof Error ? err.message : '').toLowerCase();
          const msg = raw.includes('network request failed') || raw.includes('failed to fetch') || raw.includes('unable to connect')
            ? 'Unable to connect. Check your internet connection.'
            : (err instanceof Error ? err.message : '') || 'Sign in failed. Please try again.';
          set({ error: msg, loading: false });
        }
      },

      signInWithGoogle: async () => {
        set({ loading: true, error: null });
        try {
          await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

          const response = await GoogleSignin.signIn();
          const idToken = response.data?.idToken;

          if (!idToken) {
            throw new Error('No ID token returned from Google Sign-In');
          }

          const { data, error } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: idToken,
          });

          if (error) throw error;

          set({
            session: data.session,
            user: data.user,
            loading: false,
            error: null,
          });
        } catch (err: unknown) {
          if (err !== null && typeof err === 'object' && 'code' in err) {
            const code = (err as { code: string }).code;
            if (code === statusCodes.SIGN_IN_CANCELLED) {
              set({ loading: false, error: null });
              return;
            }
            if (code === statusCodes.IN_PROGRESS) {
              set({ loading: false, error: null });
              return;
            }
            if (code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
              set({ loading: false, error: 'Google Play Services is not available on this device.' });
              return;
            }
          }
          const message = err instanceof Error ? err.message : 'Google sign-in failed. Please try again.';
          set({ error: message, loading: false });
        }
      },

      signInWithApple: async () => {
        set({ loading: true, error: null });
        try {
          const redirectUrl = Linking.createURL('auth/callback');
          const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'apple',
            options: {
              redirectTo: redirectUrl,
              skipBrowserRedirect: true,
            },
          });
          if (error) throw error;
          if (!data.url) throw new Error('No auth URL returned');

          await WebBrowser.warmUpAsync();
          const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl, { preferEphemeralSession: true });
          await WebBrowser.coolDownAsync();

          if (result.type === 'success' && result.url) {
            const parsed = new URL(result.url);
            const code = parsed.searchParams.get('code');
            if (code) {
              await supabase.auth.exchangeCodeForSession(code);
              set({ loading: false });
              return;
            }
            const hash = parsed.hash.startsWith('#') ? parsed.hash.substring(1) : '';
            const hashParams = new URLSearchParams(hash);
            const accessToken = hashParams.get('access_token') ?? parsed.searchParams.get('access_token');
            const refreshToken = hashParams.get('refresh_token') ?? parsed.searchParams.get('refresh_token');
            if (accessToken && refreshToken) {
              await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
              set({ loading: false });
              return;
            }
          }
          if (result.type === 'cancel') {
            set({ loading: false });
            return;
          }
          set({ loading: false, error: 'Apple sign in did not complete. Please try again.' });
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
          const redirectTo = Linking.createURL('auth/callback');
          const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
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
      onRehydrateStorage: () => () => {
        // Once AsyncStorage has been read, clear the loading gate so
        // index.tsx can make an informed routing decision.
        useAuthStore.setState({ loading: false });
      },
    },
  ),
);
