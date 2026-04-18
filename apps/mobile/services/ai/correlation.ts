import { supabase } from '@services/supabase';
import { buildUserAIContext } from './context';
import type { UserAIContext } from './context';

interface CorrelationContext {
  userId: string;
  weightData: { date: string; weight: number }[];
  workoutData: { date: string; volume: number; duration: number }[];
  sleepData: { date: string; hours: number; quality: number }[];
  moodData: { date: string; mood: number; energy: number }[];
  revenueData: { date: string; amount: number }[];
  focusData: { date: string; hours: number }[];
}

interface CorrelationResult {
  correlations: {
    metricA: string;
    metricB: string;
    correlation: number; // -1 to 1
    insight: string;
    strength: 'strong' | 'moderate' | 'weak';
  }[];
  topInsights: string[];
  recommendations: string[];
  chartData: {
    label: string;
    xValues: number[];
    yValues: number[];
    xLabel: string;
    yLabel: string;
  }[];
}

export async function analyzeCorrelations(
  context: CorrelationContext,
): Promise<CorrelationResult> {
  const userContext: UserAIContext | null = await buildUserAIContext(context.userId).catch(() => null);

  const { data, error } = await supabase.functions.invoke('ai-correlation', {
    body: { ...context, userContext },
  });

  if (error) throw error;
  return data as CorrelationResult;
}
