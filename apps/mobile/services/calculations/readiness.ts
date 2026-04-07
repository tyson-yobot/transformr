// Daily readiness score calculator
// Composite score 1-100 based on sleep, soreness, stress, energy, and training load

interface ReadinessInput {
  sleepHours: number | null;
  sleepQuality: number | null; // 1-5
  moodScore: number | null; // 1-10
  stressLevel: number | null; // 1-10
  energyLevel: number | null; // 1-10
  sorenessLevel: number | null; // 1-10
  workoutsLast3Days: number;
  totalVolumeLast3Days: number;
  avgVolumePer3Days: number;
}

interface ReadinessResult {
  score: number;
  sleepComponent: number;
  sorenessComponent: number;
  stressComponent: number;
  energyComponent: number;
  trainingLoadComponent: number;
  recommendation: 'go_hard' | 'moderate' | 'light' | 'rest';
  explanation: string;
}

export function calculateReadinessScore(input: ReadinessInput): ReadinessResult {
  // Sleep component (0-25 points)
  let sleepComponent = 15; // default if no data
  if (input.sleepHours !== null && input.sleepQuality !== null) {
    const hourScore = Math.min(1, input.sleepHours / 8) * 15;
    const qualityScore = (input.sleepQuality / 5) * 10;
    sleepComponent = Math.round(hourScore + qualityScore);
  }

  // Soreness component (0-20 points) - inverted: less sore = more points
  let sorenessComponent = 15;
  if (input.sorenessLevel !== null) {
    sorenessComponent = Math.round(20 * (1 - (input.sorenessLevel - 1) / 9));
  }

  // Stress component (0-20 points) - inverted: less stress = more points
  let stressComponent = 15;
  if (input.stressLevel !== null) {
    stressComponent = Math.round(20 * (1 - (input.stressLevel - 1) / 9));
  }

  // Energy component (0-20 points)
  let energyComponent = 15;
  if (input.energyLevel !== null) {
    energyComponent = Math.round(20 * ((input.energyLevel - 1) / 9));
  }

  // Training load component (0-15 points)
  let trainingLoadComponent = 10;
  if (input.avgVolumePer3Days > 0) {
    const loadRatio = input.totalVolumeLast3Days / input.avgVolumePer3Days;
    if (loadRatio <= 0.5) {
      trainingLoadComponent = 15; // Well rested
    } else if (loadRatio <= 1.0) {
      trainingLoadComponent = 12;
    } else if (loadRatio <= 1.3) {
      trainingLoadComponent = 8;
    } else if (loadRatio <= 1.6) {
      trainingLoadComponent = 5;
    } else {
      trainingLoadComponent = 2; // Overreaching
    }
  }

  const score = Math.min(100, Math.max(1,
    sleepComponent + sorenessComponent + stressComponent + energyComponent + trainingLoadComponent
  ));

  const recommendation = getRecommendation(score);
  const explanation = buildExplanation(score, {
    sleepComponent,
    sorenessComponent,
    stressComponent,
    energyComponent,
    trainingLoadComponent,
  });

  return {
    score,
    sleepComponent,
    sorenessComponent,
    stressComponent,
    energyComponent,
    trainingLoadComponent,
    recommendation,
    explanation,
  };
}

function getRecommendation(score: number): 'go_hard' | 'moderate' | 'light' | 'rest' {
  if (score >= 80) return 'go_hard';
  if (score >= 60) return 'moderate';
  if (score >= 40) return 'light';
  return 'rest';
}

function buildExplanation(
  score: number,
  components: {
    sleepComponent: number;
    sorenessComponent: number;
    stressComponent: number;
    energyComponent: number;
    trainingLoadComponent: number;
  },
): string {
  const parts: string[] = [];

  if (components.sleepComponent < 12) parts.push('sleep quality is low');
  if (components.sorenessComponent < 8) parts.push('muscle soreness is elevated');
  if (components.stressComponent < 8) parts.push('stress levels are high');
  if (components.energyComponent < 8) parts.push('energy is depleted');
  if (components.trainingLoadComponent < 5) parts.push('recent training load is very high');

  if (score >= 80) {
    return 'You\'re fully recovered and ready to push hard today.' +
      (parts.length > 0 ? ` Minor note: ${parts.join(', ')}.` : '');
  }
  if (score >= 60) {
    return `Moderate readiness. ${parts.length > 0 ? `Watch out: ${parts.join(', ')}.` : ''} Train at moderate intensity.`;
  }
  if (score >= 40) {
    return `Below optimal. ${parts.join(', ')}. Consider a lighter session or active recovery.`;
  }
  return `Recovery day recommended. ${parts.join(', ')}. Your body needs rest to adapt and grow.`;
}

export function getReadinessEmoji(score: number): string {
  if (score >= 80) return '🟢';
  if (score >= 60) return '🟡';
  if (score >= 40) return '🟠';
  return '🔴';
}
