// Home screen widget data provider
// Updates widget data that iOS/Android widgets can read

import { storage } from '@utils/storage';

interface WidgetData {
  countdown: {
    title: string;
    daysLeft: number;
    emoji: string;
  } | null;
  macros: {
    caloriesConsumed: number;
    caloriesTarget: number;
    proteinConsumed: number;
    proteinTarget: number;
  } | null;
  streak: {
    current: number;
    emoji: string;
  } | null;
  readiness: {
    score: number;
    recommendation: string;
  } | null;
  nextWorkout: {
    name: string;
    time: string;
  } | null;
}

const WIDGET_DATA_KEY = 'widget_data';

export function updateWidgetData(data: Partial<WidgetData>): void {
  const existing = getWidgetData();
  const updated = { ...existing, ...data };
  storage.set(WIDGET_DATA_KEY, JSON.stringify(updated));

  // In production, this would also call native widget update APIs
  // via react-native-widget-extension
}

export function getWidgetData(): WidgetData {
  const raw = storage.getString(WIDGET_DATA_KEY);
  if (!raw) {
    return {
      countdown: null,
      macros: null,
      streak: null,
      readiness: null,
      nextWorkout: null,
    };
  }
  try {
    return JSON.parse(raw) as WidgetData;
  } catch {
    return {
      countdown: null,
      macros: null,
      streak: null,
      readiness: null,
      nextWorkout: null,
    };
  }
}

export function updateCountdownWidget(title: string, daysLeft: number, emoji: string): void {
  updateWidgetData({ countdown: { title, daysLeft, emoji } });
}

export function updateMacroWidget(
  caloriesConsumed: number,
  caloriesTarget: number,
  proteinConsumed: number,
  proteinTarget: number,
): void {
  updateWidgetData({
    macros: { caloriesConsumed, caloriesTarget, proteinConsumed, proteinTarget },
  });
}

export function updateStreakWidget(current: number): void {
  const emoji = current >= 100 ? '🏆' : current >= 30 ? '🔥' : current >= 7 ? '💪' : '📈';
  updateWidgetData({ streak: { current, emoji } });
}

export function updateReadinessWidget(score: number, recommendation: string): void {
  updateWidgetData({ readiness: { score, recommendation } });
}

export function updateNextWorkoutWidget(name: string, time: string): void {
  updateWidgetData({ nextWorkout: { name, time } });
}
