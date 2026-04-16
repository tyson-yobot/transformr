// =============================================================================
// TRANSFORMR -- Daily Briefing Hook
// =============================================================================

import { useMemo } from 'react';
import { useProfileStore } from '@stores/profileStore';
import { useGoalStore } from '@stores/goalStore';
import { useWorkoutStore } from '@stores/workoutStore';
import { useNutritionStore } from '@stores/nutritionStore';
import { useHabitStore } from '@stores/habitStore';
import { useSleepStore } from '@stores/sleepStore';
import { useMoodStore } from '@stores/moodStore';
import { useCountdown } from './useCountdown';

interface GamePlanItem {
  icon: string;
  title: string;
  subtitle: string;
}

interface CountdownInfo {
  daysRemaining: number;
  percentElapsed: number;
  goalTitle: string;
}

interface DailyBriefingData {
  greeting: string;
  userName: string;
  countdown: CountdownInfo | null;
  gamePlan: GamePlanItem[];
  readinessScore: number;
  todayDate: string;
  motivationMessage: string;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning.';
  if (hour < 17) return 'Good afternoon.';
  return 'Good evening.';
}

function formatTodayDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function buildMotivationMessage(data: {
  streakDays: number;
  habitsTotal: number;
  habitsCompleted: number;
  goalsCount: number;
  workoutScheduled: boolean;
}): string {
  const { streakDays, habitsTotal, habitsCompleted, goalsCount, workoutScheduled } = data;

  if (streakDays >= 30) {
    return `${streakDays} days in a row. That kind of consistency is rare -- you are building something permanent.`;
  }
  if (streakDays >= 7) {
    return `${streakDays}-day streak and counting. Every day you show up, the gap between who you are and who you want to be gets smaller.`;
  }
  if (habitsCompleted > 0 && habitsCompleted === habitsTotal) {
    return 'You cleared every habit yesterday. Stack another perfect day and watch what compounds.';
  }
  if (workoutScheduled && goalsCount > 0) {
    return `You have a workout queued and ${goalsCount} active ${goalsCount === 1 ? 'goal' : 'goals'} in motion. Small wins today, big results tomorrow.`;
  }
  if (goalsCount > 0) {
    return `${goalsCount} ${goalsCount === 1 ? 'goal is' : 'goals are'} active. Progress is not always visible, but every rep, meal, and habit is moving the needle.`;
  }
  return 'A new day, a clean slate. What you do in the next 16 hours matters more than you think.';
}

export function useDailyBriefing(): DailyBriefingData {
  const profile = useProfileStore((s) => s.profile);
  const goals = useGoalStore((s) => s.goals);
  const templates = useWorkoutStore((s) => s.templates);
  const habits = useHabitStore((s) => s.habits);
  const todayCompletions = useHabitStore((s) => s.todayCompletions);
  const getTodayMacros = useNutritionStore((s) => s.getTodayMacros);

  // Find the primary goal with a target date for countdown
  const primaryGoal = useMemo(
    () => goals.find((g) => g.target_date && g.status === 'active') ?? null,
    [goals],
  );

  const countdownValue = useCountdown(primaryGoal?.target_date ?? null);

  const userName = useMemo(() => {
    if (!profile?.display_name) return '';
    return profile.display_name.split(' ')[0] ?? '';
  }, [profile?.display_name]);

  const countdown = useMemo<CountdownInfo | null>(() => {
    if (!primaryGoal || countdownValue.isExpired) return null;

    // Calculate percent elapsed from start to target
    let percentElapsed = 0;
    if (primaryGoal.start_date && primaryGoal.target_date) {
      const start = new Date(primaryGoal.start_date).getTime();
      const end = new Date(primaryGoal.target_date).getTime();
      const now = Date.now();
      const total = end - start;
      if (total > 0) {
        percentElapsed = Math.min(1, Math.max(0, (now - start) / total));
      }
    }

    return {
      daysRemaining: countdownValue.totalDays,
      percentElapsed,
      goalTitle: primaryGoal.title,
    };
  }, [primaryGoal, countdownValue]);

  const gamePlan = useMemo<GamePlanItem[]>(() => {
    const items: GamePlanItem[] = [];

    // Workout card
    const todayTemplate = templates[0]; // First template as today's workout
    if (todayTemplate) {
      items.push({
        icon: '\uD83C\uDFCB\uFE0F',
        title: todayTemplate.name ?? 'Workout',
        subtitle: 'Scheduled today',
      });
    } else {
      items.push({
        icon: '\uD83C\uDFCB\uFE0F',
        title: 'Rest Day',
        subtitle: 'Recovery matters',
      });
    }

    // Nutrition card
    const macros = getTodayMacros();
    const targetCal = profile?.daily_calorie_target ?? 2400;
    const targetProtein = profile?.daily_protein_target ?? 160;
    const remainingCal = Math.max(0, targetCal - macros.calories);
    const remainingProtein = Math.max(0, targetProtein - macros.protein);
    items.push({
      icon: '\uD83E\uDD57',
      title: `${remainingCal} cal remaining`,
      subtitle: `${remainingProtein}g protein to go`,
    });

    // Habits card
    const completedIds = new Set(todayCompletions.map((c) => c.habit_id));
    const remaining = habits.filter((h) => !completedIds.has(h.id)).length;
    items.push({
      icon: '\u2705',
      title: `${remaining} habits left`,
      subtitle: remaining === 0 ? 'All done!' : 'Keep stacking',
    });

    // Focus goal card
    if (primaryGoal) {
      items.push({
        icon: '\uD83C\uDFAF',
        title: primaryGoal.title,
        subtitle: countdown
          ? `${countdown.daysRemaining}d remaining`
          : 'In progress',
      });
    }

    return items;
  }, [templates, getTodayMacros, profile, habits, todayCompletions, primaryGoal, countdown]);

  const lastSleep = useSleepStore((s) => s.lastSleep);
  const todayMood = useMoodStore((s) => s.todayMood);

  const readinessScore = useMemo(() => {
    // Weighted readiness: sleep quality 50%, mood 25%, energy 25%
    // Each input is 1-5 scale → normalise to 0-100
    let score = 72; // baseline when no data yet
    let weightSum = 0;
    let weightedScore = 0;

    if (lastSleep?.quality != null) {
      weightedScore += (lastSleep.quality / 5) * 100 * 0.5;
      weightSum += 0.5;
    }
    if (todayMood?.mood != null) {
      weightedScore += (todayMood.mood / 5) * 100 * 0.25;
      weightSum += 0.25;
    }
    if (todayMood?.energy != null) {
      weightedScore += (todayMood.energy / 5) * 100 * 0.25;
      weightSum += 0.25;
    }

    if (weightSum > 0) {
      // Scale to full weight; if only partial data exists, blend with baseline
      score = Math.round(weightedScore / weightSum);
    }
    return Math.min(100, Math.max(0, score));
  }, [lastSleep, todayMood]);

  const motivationMessage = useMemo(() => {
    const completedIds = new Set(todayCompletions.map((c) => c.habit_id));
    const maxStreak = habits.reduce((max, h) => Math.max(max, h.current_streak ?? 0), 0);
    return buildMotivationMessage({
      streakDays: maxStreak,
      habitsTotal: habits.length,
      habitsCompleted: completedIds.size,
      goalsCount: goals.length,
      workoutScheduled: templates.length > 0,
    });
  }, [habits, todayCompletions, goals, templates]);

  return {
    greeting: getGreeting(),
    userName,
    countdown,
    gamePlan,
    readinessScore,
    todayDate: formatTodayDate(),
    motivationMessage,
  };
}
