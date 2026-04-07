import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { supabase } from '@services/supabase';
import { useAuthStore } from '@stores/authStore';

export function useAuth() {
  const { session, user, loading, signIn, signUp, signOut, resetPassword, setSession } = useAuthStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.unsubscribe();
  }, [setSession]);

  return { session, user, loading, signIn, signUp, signOut, resetPassword };
}

export function useProtectedRoute() {
  const { session, loading } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)/dashboard');
    }
  }, [session, loading, segments, router]);
}
