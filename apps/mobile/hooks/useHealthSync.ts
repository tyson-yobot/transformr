// =============================================================================
// TRANSFORMR -- useHealthSync Hook (Module 9)
// Unified hook for syncing health data from Apple HealthKit (iOS) or
// Google Health Connect (Android). Provides permission state, sync function,
// and latest daily summary.
// =============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import { supabase } from '@services/supabase';
import type { DailySummary } from '@services/health/appleHealth';

interface HealthSyncState {
  isAvailable: boolean;
  hasPermission: boolean;
  isLoading: boolean;
  isSyncing: boolean;
  lastSyncAt: string | null;
  todaySummary: DailySummary | null;
  error: string | null;
  requestPermissions: () => Promise<boolean>;
  sync: () => Promise<void>;
}

export function useHealthSync(): HealthSyncState {
  const [isAvailable, setIsAvailable] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [todaySummary, setTodaySummary] = useState<DailySummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    void checkAvailability();
    return () => {
      mountedRef.current = false;
    };
  }, []);

  async function checkAvailability() {
    setIsLoading(true);
    try {
      if (Platform.OS === 'ios') {
        const apple = await import('@services/health/appleHealth');
        const available = await apple.isAvailable();
        if (mountedRef.current) setIsAvailable(available);
      } else if (Platform.OS === 'android') {
        const google = await import('@services/health/googleHealth');
        const available = await google.isAvailable();
        if (mountedRef.current) setIsAvailable(available);
      }
    } catch {
      if (mountedRef.current) setIsAvailable(false);
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      let granted = false;
      if (Platform.OS === 'ios') {
        const apple = await import('@services/health/appleHealth');
        granted = await apple.requestPermissions();
      } else if (Platform.OS === 'android') {
        const google = await import('@services/health/googleHealth');
        granted = await google.requestPermissions();
      }
      if (mountedRef.current) setHasPermission(granted);
      return granted;
    } catch {
      if (mountedRef.current) setHasPermission(false);
      return false;
    }
  }, []);

  const sync = useCallback(async () => {
    setIsSyncing(true);
    setError(null);

    try {
      const today = new Date().toISOString().split('T')[0]!;
      let summary: DailySummary;

      if (Platform.OS === 'ios') {
        const apple = await import('@services/health/appleHealth');
        summary = await apple.getDailySummary(today);
      } else if (Platform.OS === 'android') {
        const google = await import('@services/health/googleHealth');
        summary = await google.getDailySummary(today);
      } else {
        throw new Error('Health sync not supported on this platform');
      }

      if (!mountedRef.current) return;
      setTodaySummary(summary);

      // Write synced data to Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Sync weight if available
      if (summary.weight) {
        await supabase.from('weight_logs').upsert(
          {
            user_id: user.id,
            date: today,
            weight: summary.weight,
            source: 'health_kit',
          },
          { onConflict: 'user_id,date' },
        );
      }

      // Sync sleep if available
      if (summary.sleepHours > 0) {
        await supabase.from('sleep_logs').upsert(
          {
            user_id: user.id,
            date: today,
            duration_hours: summary.sleepHours,
            source: 'health_kit',
          },
          { onConflict: 'user_id,date' },
        );
      }

      const syncTime = new Date().toISOString();
      if (mountedRef.current) setLastSyncAt(syncTime);
    } catch (err) {
      if (mountedRef.current) {
        setError(
          err instanceof Error ? err.message : 'Health sync failed',
        );
      }
    } finally {
      if (mountedRef.current) setIsSyncing(false);
    }
  }, []);

  return {
    isAvailable,
    hasPermission,
    isLoading,
    isSyncing,
    lastSyncAt,
    todaySummary,
    error,
    requestPermissions,
    sync,
  };
}
