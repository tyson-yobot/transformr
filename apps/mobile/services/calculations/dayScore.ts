// Daily score calculation — composite score based on all daily activities

interface DayScoreInput {
  habitsCompleted: number;
  habitsTotal: number;
  caloriesTarget: number;
  caloriesLogged: number;
  proteinTarget: number;
  proteinLogged: number;
  workoutsCompleted: number;
  workoutsPlanned: number;
  sleepHours: number | null;
  waterOz: number;
  waterTarget: number;
  moodAverage: number | null; // 1-10
  focusHours: number;
}

interface DayScoreResult {
  score: number; // 0-100
  breakdown: {
    habits: number;
    nutrition: number;
    training: number;
    sleep: number;
    hydration: number;
    mood: number;
    focus: number;
  };
  grade: string;
}

export function calculateDayScore(input: DayScoreInput): DayScoreResult {
  // Habits: 25 points
  const habitsScore = input.habitsTotal > 0
    ? Math.round(25 * (input.habitsCompleted / input.habitsTotal))
    : 25;

  // Nutrition: 20 points (10 for calories, 10 for protein)
  const calorieDiff = Math.abs(input.caloriesLogged - input.caloriesTarget);
  const calorieAccuracy = input.caloriesTarget > 0
    ? Math.max(0, 1 - calorieDiff / input.caloriesTarget)
    : 0;
  const proteinRatio = input.proteinTarget > 0
    ? Math.min(1, input.proteinLogged / input.proteinTarget)
    : 0;
  const nutritionScore = Math.round(10 * calorieAccuracy + 10 * proteinRatio);

  // Training: 20 points
  const trainingScore = input.workoutsPlanned > 0
    ? Math.round(20 * Math.min(1, input.workoutsCompleted / input.workoutsPlanned))
    : (input.workoutsCompleted > 0 ? 20 : 10); // If no plan, give full credit for working out

  // Sleep: 15 points
  let sleepScore = 10;
  if (input.sleepHours !== null) {
    if (input.sleepHours >= 7 && input.sleepHours <= 9) {
      sleepScore = 15;
    } else if (input.sleepHours >= 6) {
      sleepScore = 10;
    } else {
      sleepScore = Math.round(15 * (input.sleepHours / 7));
    }
  }

  // Hydration: 10 points
  const hydrationScore = input.waterTarget > 0
    ? Math.round(10 * Math.min(1, input.waterOz / input.waterTarget))
    : 5;

  // Mood: 5 points
  const moodScore = input.moodAverage !== null
    ? Math.round(5 * ((input.moodAverage - 1) / 9))
    : 3;

  // Focus: 5 points
  const focusScore = Math.min(5, Math.round(input.focusHours * 1.25));

  const score = Math.min(100, Math.max(0,
    habitsScore + nutritionScore + trainingScore + sleepScore + hydrationScore + moodScore + focusScore
  ));

  return {
    score,
    breakdown: {
      habits: habitsScore,
      nutrition: nutritionScore,
      training: trainingScore,
      sleep: sleepScore,
      hydration: hydrationScore,
      mood: moodScore,
      focus: focusScore,
    },
    grade: scoreToGrade(score),
  };
}

function scoreToGrade(score: number): string {
  if (score >= 95) return 'A+';
  if (score >= 90) return 'A';
  if (score >= 85) return 'B+';
  if (score >= 80) return 'B';
  if (score >= 75) return 'C+';
  if (score >= 70) return 'C';
  if (score >= 65) return 'D+';
  if (score >= 60) return 'D';
  return 'F';
}

export function getDayScoreEmoji(score: number): string {
  if (score >= 90) return '🔥';
  if (score >= 80) return '💪';
  if (score >= 70) return '👍';
  if (score >= 60) return '😐';
  return '😴';
}
