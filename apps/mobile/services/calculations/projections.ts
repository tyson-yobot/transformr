// Weight and revenue projection calculations

import { addDays, format } from 'date-fns';

interface WeightDataPoint {
  date: string;
  weight: number;
}

interface RevenueDataPoint {
  date: string;
  amount: number;
}

export function projectWeight(
  history: WeightDataPoint[],
  targetWeight: number,
  daysToProject: number = 90,
): WeightDataPoint[] {
  if (history.length < 2) return [];

  // Calculate average daily change over last 30 entries
  const recentHistory = history.slice(-30);
  const totalChange = (recentHistory[recentHistory.length - 1]?.weight ?? 0) - (recentHistory[0]?.weight ?? 0);
  const daysBetween = recentHistory.length > 1 ? recentHistory.length - 1 : 1;
  const dailyChange = totalChange / daysBetween;

  const projections: WeightDataPoint[] = [];
  const lastWeight = history[history.length - 1]?.weight ?? 0;
  const startDate = new Date();

  for (let i = 1; i <= daysToProject; i++) {
    const projectedWeight = lastWeight + dailyChange * i;
    // Clamp to reasonable bounds
    const clampedWeight = Math.max(80, Math.min(400, projectedWeight));
    projections.push({
      date: format(addDays(startDate, i), 'yyyy-MM-dd'),
      weight: Math.round(clampedWeight * 10) / 10,
    });
  }

  return projections;
}

export function projectRevenue(
  history: RevenueDataPoint[],
  daysToProject: number = 90,
): RevenueDataPoint[] {
  if (history.length < 2) return [];

  // Calculate growth rate from last 4 data points (monthly)
  const recent = history.slice(-4);
  const totalGrowth = (recent[recent.length - 1]?.amount ?? 0) - (recent[0]?.amount ?? 0);
  const periods = recent.length > 1 ? recent.length - 1 : 1;
  const avgGrowthPerPeriod = totalGrowth / periods;

  const projections: RevenueDataPoint[] = [];
  const lastAmount = history[history.length - 1]?.amount ?? 0;
  const startDate = new Date();

  // Project monthly
  const months = Math.ceil(daysToProject / 30);
  for (let i = 1; i <= months; i++) {
    projections.push({
      date: format(addDays(startDate, i * 30), 'yyyy-MM-dd'),
      amount: Math.max(0, Math.round(lastAmount + avgGrowthPerPeriod * i)),
    });
  }

  return projections;
}

export function daysToTarget(
  currentValue: number,
  targetValue: number,
  dailyChange: number,
): number | null {
  if (dailyChange === 0) return null;

  const remaining = targetValue - currentValue;
  if ((remaining > 0 && dailyChange <= 0) || (remaining < 0 && dailyChange >= 0)) {
    return null; // Going wrong direction
  }

  return Math.ceil(Math.abs(remaining / dailyChange));
}

export function calculateLinearRegression(
  data: { x: number; y: number }[],
): { slope: number; intercept: number; r2: number } {
  const n = data.length;
  if (n < 2) return { slope: 0, intercept: 0, r2: 0 };

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (const point of data) {
    sumX += point.x;
    sumY += point.y;
    sumXY += point.x * point.y;
    sumX2 += point.x * point.x;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // R-squared
  const yMean = sumY / n;
  let ssRes = 0, ssTot = 0;
  for (const point of data) {
    const predicted = slope * point.x + intercept;
    ssRes += (point.y - predicted) ** 2;
    ssTot += (point.y - yMean) ** 2;
  }
  const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot;

  return { slope, intercept, r2 };
}
