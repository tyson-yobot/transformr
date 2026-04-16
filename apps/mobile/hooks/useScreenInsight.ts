// =============================================================================
// TRANSFORMR -- useScreenInsight Hook (Module 6)
// Fetches a cached or fresh AI micro-insight for a given screen key.
// Returns { insight, category, isLoading, refresh }.
// =============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@services/supabase';

interface ScreenInsightState {
  insight: string | null;
  category: string;
  isLoading: boolean;
  refresh: () => void;
}

const COOLDOWN_MS = 4 * 60 * 60 * 1000; // 4 hours

/**
 * Edge functions occasionally return insight wrapped in a markdown JSON fence.
 * Strip it and extract the plain insight string.
 */
function stripJsonFence(raw: string): string {
  const trimmed = raw.trim();
  // Strip ```json ... ``` or ``` ... ``` using replace (more robust than anchor regex)
  const stripped = trimmed
    .replace(/^```(?:json)?\s*/s, '')
    .replace(/\s*```\s*$/s, '')
    .trim();

  // Try to parse as JSON and extract .insight
  for (const candidate of [stripped, trimmed]) {
    if (candidate.startsWith('{')) {
      try {
        const parsed = JSON.parse(candidate) as Record<string, unknown>;
        if (typeof parsed['insight'] === 'string') {
          return parsed['insight'];
        }
      } catch {
        // not valid JSON
      }
    }
  }
  return stripped || trimmed;
}

// In-memory cache to avoid duplicate requests within the same session
const memoryCache: Record<
  string,
  { insight: string; category: string; fetchedAt: number }
> = {};

export function useScreenInsight(screenKey: string): ScreenInsightState {
  const [insight, setInsight] = useState<string | null>(
    memoryCache[screenKey]?.insight ?? null,
  );
  const [category, setCategory] = useState(
    memoryCache[screenKey]?.category ?? 'general',
  );
  const [isLoading, setIsLoading] = useState(false);
  const mountedRef = useRef(true);

  const fetchInsight = useCallback(
    async (forceRefresh: boolean) => {
      // Check memory cache
      const cached = memoryCache[screenKey];
      if (!forceRefresh && cached && Date.now() - cached.fetchedAt < COOLDOWN_MS) {
        setInsight(cached.insight);
        setCategory(cached.category);
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke(
          'ai-screen-insight',
          {
            body: { screen_key: screenKey, force_refresh: forceRefresh },
          },
        );

        if (!mountedRef.current) return;

        if (error) {
          // Silently fail — insights are non-critical
          return;
        }

        // Strip markdown JSON fences if edge function returns wrapped content
        const rawInsight = (data as { insight?: string })?.insight ?? null;
        const insightText = rawInsight ? stripJsonFence(rawInsight) : null;
        const cat = (data as { category?: string })?.category ?? 'general';

        // If the DB had poisoned (fence-wrapped) cache, force a fresh fetch once
        if (insightText && insightText.includes('```') && !forceRefresh) {
          void fetchInsight(true);
          return;
        }

        setInsight(insightText);
        setCategory(cat);

        if (insightText) {
          memoryCache[screenKey] = {
            insight: insightText,
            category: cat,
            fetchedAt: Date.now(),
          };
        }
      } catch {
        // Non-critical — silently fail
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    },
    [screenKey],
  );

  useEffect(() => {
    mountedRef.current = true;
    void fetchInsight(false);
    return () => {
      mountedRef.current = false;
    };
  }, [fetchInsight]);

  const refresh = useCallback(() => {
    void fetchInsight(true);
  }, [fetchInsight]);

  return { insight, category, isLoading, refresh };
}
