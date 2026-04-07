import { supabase } from '@services/supabase';

interface CorrelationContext {
  userId: string;
  weightData: Array<{ date: string; weight: number }>;
  workoutData: Array<{ date: string; volume: number; duration: number }>;
  sleepData: Array<{ date: string; hours: number; quality: number }>;
  moodData: Array<{ date: string; mood: number; energy: number }>;
  revenueData: Array<{ date: string; amount: number }>;
  focusData: Array<{ date: string; hours: number }>;
}

interface CorrelationResult {
  correlations: Array<{
    metricA: string;
    metricB: string;
    correlation: number; // -1 to 1
    insight: string;
    strength: 'strong' | 'moderate' | 'weak';
  }>;
  topInsights: string[];
  recommendations: string[];
  chartData: Array<{
    label: string;
    xValues: number[];
    yValues: number[];
    xLabel: string;
    yLabel: string;
  }>;
}

export async function analyzeCorrelations(
  context: CorrelationContext,
): Promise<CorrelationResult> {
  const { data, error } = await supabase.functions.invoke('ai-correlation', {
    body: context,
  });

  if (error) throw error;
  return data as CorrelationResult;
}
