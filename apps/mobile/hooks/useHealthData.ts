// =============================================================================
// TRANSFORMR -- useHealthData Hook (Module 9)
// TanStack Query hook exposing health platform data (steps, HR, sleep, weight).
// After a successful fetch, syncs data to local Supabase records.
// Handles permission states and graceful degradation on unsupported platforms.
// =============================================================================

import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@services/supabase';
import { useAuthStore } from '@stores/authStore';
import {
  isHealthAvailable,
  requestHealthPermissions,
  fetchTodaySteps,
  fetchHeartRateData,
  fetchSleepData,
  fetchWeightHistory,
} from '@services/health';
import type {
  HeartRateReading,
  SleepRecord,
  WeightRecord,
} from '@services/health';

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

const HEALTH_QUERY_KEY = 'healthData';
const STALE_TIME_MS = 5 * 60 * 1000; // 5 minutes

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HealthData {
  steps: number;
  heartRate: HeartRateReading[];
  sleep: SleepRecord[];
  weight: WeightRecord[];
  hasPermissions: boolean;
  isAvailable: boolean;
}

// ---------------------------------------------------------------------------
// Fetcher
// ---------------------------------------------------------------------------

async function fetchAllHealthData(): Promise<HealthData> {
  const available = await isHealthAvailable();
  if (!available) {
    return {
      steps: 0,
      heartRate: [],
      sleep: [],
      weight: [],
      hasPermissions: false,
      isAvailable: false,
    };
  }

  const [steps, heartRate, sleep, weight] = await Promise.all([
    fetchTodaySteps(),
    fetchHeartRateData(7),
    fetchSleepData(7),
    fetchWeightHistory(30),
  ]);

  return {
    steps,
    heartRate,
    sleep,
    weight,
    hasPermissions: true,
    isAvailable: true,
  };
}

// ---------------------------------------------------------------------------
// Supabase sync helpers
// ---------------------------------------------------------------------------

async function syncHealthToSupabase(
  userId: string,
  data: HealthData,
): Promise<void> {
  const today = new Date().toISOString().split('T')[0]!;

  const ops: Promise<unknown>[] = [];

  // Sync step count
  if (data.steps > 0) {
    ops.push(
      supabase
        .from('step_logs')
        .upsert(
          { user_id: userId, date: today, steps: data.steps, source: 'health_platform' },
          { onConflict: 'user_id,date' },
        ),
    );
  }

  // Sync latest sleep record for today
  const todaySleep = data.sleep.find((s) => s.date === today);
  if (todaySleep) {
    ops.push(
      supabase
        .from('sleep_logs')
        .upsert(
          {
            user_id: userId,
            date: today,
            duration_hours: todaySleep.durationHours,
            quality_score: qualityToScore(todaySleep.quality),
            source: 'health_platform',
          },
          { onConflict: 'user_id,date' },
        ),
    );
  }

  // Sync latest weight
  const latestWeight = data.weight[0];
  if (latestWeight) {
    ops.push(
      supabase
        .from('weight_logs')
        .upsert(
          {
            user_id: userId,
            date: latestWeight.date,
            weight_kg: latestWeight.kg,
            source: 'health_platform',
          },
          { onConflict: 'user_id,date' },
        ),
    );
  }

  await Promise.allSettled(ops);
}

function qualityToScore(quality: SleepRecord['quality']): number {
  const map: Record<SleepRecord['quality'], number> = {
    poor: 25,
    fair: 50,
    good: 75,
    excellent: 95,
  };
  return map[quality];
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UseHealthDataResult {
  steps: number;
  heartRate: HeartRateReading[];
  sleep: SleepRecord[];
  weight: WeightRecord[];
  hasPermissions: boolean;
  isAvailable: boolean;
  isLoading: boolean;
  error: Error | null;
  requestPermissions: () => Promise<boolean>;
  refetch: () => void;
}

export function useHealthData(): UseHealthDataResult {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery<HealthData, Error>({
    queryKey: [HEALTH_QUERY_KEY],
    queryFn: fetchAllHealthData,
    staleTime: STALE_TIME_MS,
    retry: 1,
  });

  const permissionMutation = useMutation<boolean, Error, void>({
    mutationFn: async () => {
      const granted = await requestHealthPermissions();
      if (granted) {
        // Invalidate so a fresh fetch happens with new permissions
        await queryClient.invalidateQueries({ queryKey: [HEALTH_QUERY_KEY] });
      }
      return granted;
    },
  });

  // Sync to Supabase whenever fresh data arrives
  const handleRequestPermissions = useCallback(async (): Promise<boolean> => {
    return permissionMutation.mutateAsync();
  }, [permissionMutation]);

  // Sync to Supabase if user is logged in and data is available
  if (data?.hasPermissions && user?.id) {
    void syncHealthToSupabase(user.id, data).catch(() => {
      // Non-critical — sync errors are silent
    });
  }

  return {
    steps: data?.steps ?? 0,
    heartRate: data?.heartRate ?? [],
    sleep: data?.sleep ?? [],
    weight: data?.weight ?? [],
    hasPermissions: data?.hasPermissions ?? false,
    isAvailable: data?.isAvailable ?? false,
    isLoading,
    error: error ?? null,
    requestPermissions: handleRequestPermissions,
    refetch,
  };
}
