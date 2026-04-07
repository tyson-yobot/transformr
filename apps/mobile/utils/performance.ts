// =============================================================================
// TRANSFORMR -- Performance Optimization Utilities
// =============================================================================

import { useCallback, useMemo, useRef } from 'react';
import { InteractionManager } from 'react-native';

/**
 * Defer heavy work until after animations/transitions complete.
 * Use for data fetching, analytics, or computation that doesn't need
 * to run during screen transitions.
 */
export function runAfterInteractions(task: () => void): void {
  InteractionManager.runAfterInteractions(task);
}

/**
 * Debounce a function call. Useful for search inputs, scroll handlers.
 */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Throttle a function to run at most once per interval.
 * Useful for scroll position tracking, real-time sync updates.
 */
export function throttle<T extends (...args: unknown[]) => void>(
  fn: T,
  interval: number
): (...args: Parameters<T>) => void {
  let lastRun = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    const remaining = interval - (now - lastRun);

    if (remaining <= 0) {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      lastRun = now;
      fn(...args);
    } else if (!timer) {
      timer = setTimeout(() => {
        lastRun = Date.now();
        timer = null;
        fn(...args);
      }, remaining);
    }
  };
}

/**
 * Hook to get a stable callback reference that always calls the latest closure.
 * Avoids stale closure issues without causing re-renders.
 */
export function useStableCallback<T extends (...args: never[]) => unknown>(callback: T): T {
  const ref = useRef(callback);
  ref.current = callback;
  return useCallback((...args: Parameters<T>) => ref.current(...args), []) as T;
}

/**
 * Batch state updates for lists to avoid excessive re-renders.
 * Groups rapid updates (e.g., real-time sync) into a single render.
 */
export function createBatchUpdater<T>(
  onBatch: (items: T[]) => void,
  delay = 100
): (item: T) => void {
  let batch: T[] = [];
  let timer: ReturnType<typeof setTimeout> | null = null;

  return (item: T) => {
    batch.push(item);
    if (!timer) {
      timer = setTimeout(() => {
        onBatch(batch);
        batch = [];
        timer = null;
      }, delay);
    }
  };
}

/**
 * Simple LRU memo for expensive pure computations.
 * Caches the last N results keyed by a string.
 */
export function createMemoCache<T>(maxSize = 50): {
  get: (key: string) => T | undefined;
  set: (key: string, value: T) => void;
  clear: () => void;
} {
  const cache = new Map<string, T>();

  return {
    get(key: string) {
      const value = cache.get(key);
      if (value !== undefined) {
        // Move to end (most recently used)
        cache.delete(key);
        cache.set(key, value);
      }
      return value;
    },
    set(key: string, value: T) {
      if (cache.has(key)) {
        cache.delete(key);
      } else if (cache.size >= maxSize) {
        // Delete oldest (first entry)
        const firstKey = cache.keys().next().value;
        if (firstKey !== undefined) cache.delete(firstKey);
      }
      cache.set(key, value);
    },
    clear() {
      cache.clear();
    },
  };
}

/**
 * Chunk an array for paginated rendering in FlatList.
 */
export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Retry with exponential backoff for network requests.
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}
