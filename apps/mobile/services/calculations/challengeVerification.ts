// =============================================================================
// TRANSFORMR -- Challenge Task Auto-Verification
// =============================================================================
// Checks real app data against challenge task requirements.
// This is the core differentiator — auto-verified challenges vs manual checklists.

import { supabase } from '@services/supabase';

interface VerificationResult {
  taskId: string;
  verified: boolean;
  currentValue: number;
  targetValue: number;
  unit: string;
}

/**
 * Verify all tasks for a given challenge day against actual logged data.
 */
export async function verifyDailyTasks(
  userId: string,
  date: string,
  tasks: Array<{
    id: string;
    type: string;
    config: Record<string, unknown>;
  }>
): Promise<Record<string, VerificationResult>> {
  const results: Record<string, VerificationResult> = {};

  for (const task of tasks) {
    switch (task.type) {
      case 'workout':
        results[task.id] = await verifyWorkout(userId, date, task.config);
        break;
      case 'water':
        results[task.id] = await verifyWater(userId, date, task.config);
        break;
      case 'nutrition':
        results[task.id] = await verifyNutrition(userId, date, task.config);
        break;
      case 'reading':
        results[task.id] = await verifyReading(userId, date, task.config);
        break;
      case 'photo':
        results[task.id] = await verifyProgressPhoto(userId, date);
        break;
      case 'meditation':
        results[task.id] = await verifyMeditation(userId, date, task.config);
        break;
      case 'steps':
        results[task.id] = await verifySteps(userId, date, task.config);
        break;
      case 'alcohol_free':
        results[task.id] = await verifyAlcoholFree(userId, date);
        break;
      case 'fasting':
        results[task.id] = await verifyFasting(userId, date, task.config);
        break;
      default:
        // Custom/manual tasks can't be auto-verified
        results[task.id] = {
          taskId: task.id,
          verified: false,
          currentValue: 0,
          targetValue: 1,
          unit: 'completion',
        };
    }
  }

  return results;
}

async function verifyWorkout(
  userId: string,
  date: string,
  config: Record<string, unknown>
): Promise<VerificationResult> {
  const minDuration = (config.min_duration_minutes as number) ?? 45;
  const minCount = (config.min_count as number) ?? 1;
  const requireOutdoor = (config.require_outdoor as boolean) ?? false;

  const { data: sessions } = await supabase
    .from('workout_sessions')
    .select('id, duration_minutes, location_type')
    .eq('user_id', userId)
    .gte('started_at', `${date}T00:00:00`)
    .lte('started_at', `${date}T23:59:59`)
    .gte('duration_minutes', minDuration);

  const qualifyingSessions = sessions ?? [];
  let count = qualifyingSessions.length;

  if (requireOutdoor) {
    const outdoorCount = qualifyingSessions.filter(
      (s: { location_type?: string }) => s.location_type === 'outdoor'
    ).length;
    // Need at least one outdoor and total >= minCount
    if (outdoorCount < 1) count = Math.min(count, minCount - 1);
  }

  return {
    taskId: 'workout',
    verified: count >= minCount,
    currentValue: count,
    targetValue: minCount,
    unit: 'workouts',
  };
}

async function verifyWater(
  userId: string,
  date: string,
  config: Record<string, unknown>
): Promise<VerificationResult> {
  const minOz = (config.min_oz as number) ?? 128;

  const { data: logs } = await supabase
    .from('water_logs')
    .select('amount_oz')
    .eq('user_id', userId)
    .gte('logged_at', `${date}T00:00:00`)
    .lte('logged_at', `${date}T23:59:59`);

  const totalOz = (logs ?? []).reduce(
    (sum: number, l: { amount_oz?: number }) => sum + (l.amount_oz ?? 0),
    0
  );

  return {
    taskId: 'water',
    verified: totalOz >= minOz,
    currentValue: Math.round(totalOz),
    targetValue: minOz,
    unit: 'oz',
  };
}

async function verifyNutrition(
  userId: string,
  date: string,
  config: Record<string, unknown>
): Promise<VerificationResult> {
  const maxCalories = config.max_calories as number | undefined;
  const minProtein = config.min_protein_g as number | undefined;

  const { data: logs } = await supabase
    .from('nutrition_logs')
    .select('calories, protein')
    .eq('user_id', userId)
    .gte('logged_at', `${date}T00:00:00`)
    .lte('logged_at', `${date}T23:59:59`);

  const totalCalories = (logs ?? []).reduce(
    (sum: number, l: { calories?: number }) => sum + (l.calories ?? 0),
    0
  );
  const totalProtein = (logs ?? []).reduce(
    (sum: number, l: { protein?: number }) => sum + (l.protein ?? 0),
    0
  );

  let verified = true;
  if (maxCalories && totalCalories > maxCalories) verified = false;
  if (minProtein && totalProtein < minProtein) verified = false;

  // Must have logged at least one meal
  if ((logs ?? []).length === 0) verified = false;

  return {
    taskId: 'nutrition',
    verified,
    currentValue: totalCalories,
    targetValue: maxCalories ?? 0,
    unit: 'cal',
  };
}

async function verifyReading(
  userId: string,
  date: string,
  config: Record<string, unknown>
): Promise<VerificationResult> {
  const minPages = (config.min_pages as number) ?? 10;

  // Check skills/books tracking for reading logs
  const { data: logs } = await supabase
    .from('focus_sessions')
    .select('duration_minutes, category')
    .eq('user_id', userId)
    .eq('category', 'reading')
    .gte('started_at', `${date}T00:00:00`)
    .lte('started_at', `${date}T23:59:59`);

  // Estimate pages: ~2 min per page
  const totalMinutes = (logs ?? []).reduce(
    (sum: number, l: { duration_minutes?: number }) => sum + (l.duration_minutes ?? 0),
    0
  );
  const estimatedPages = Math.floor(totalMinutes / 2);

  return {
    taskId: 'reading',
    verified: estimatedPages >= minPages,
    currentValue: estimatedPages,
    targetValue: minPages,
    unit: 'pages',
  };
}

async function verifyProgressPhoto(
  userId: string,
  date: string
): Promise<VerificationResult> {
  // Check if a progress photo was uploaded today
  const { data } = await supabase.storage
    .from('progress-photos')
    .list(`${userId}/${date}`);

  const hasPhoto = (data ?? []).length > 0;

  return {
    taskId: 'photo',
    verified: hasPhoto,
    currentValue: hasPhoto ? 1 : 0,
    targetValue: 1,
    unit: 'photo',
  };
}

async function verifyMeditation(
  userId: string,
  date: string,
  config: Record<string, unknown>
): Promise<VerificationResult> {
  const minMinutes = (config.min_minutes as number) ?? 5;

  const { data: sessions } = await supabase
    .from('focus_sessions')
    .select('duration_minutes')
    .eq('user_id', userId)
    .eq('category', 'meditation')
    .gte('started_at', `${date}T00:00:00`)
    .lte('started_at', `${date}T23:59:59`);

  const totalMinutes = (sessions ?? []).reduce(
    (sum: number, s: { duration_minutes?: number }) => sum + (s.duration_minutes ?? 0),
    0
  );

  return {
    taskId: 'meditation',
    verified: totalMinutes >= minMinutes,
    currentValue: totalMinutes,
    targetValue: minMinutes,
    unit: 'min',
  };
}

async function verifySteps(
  userId: string,
  date: string,
  config: Record<string, unknown>
): Promise<VerificationResult> {
  const minSteps = (config.min_steps as number) ?? 10000;

  // Steps would come from Apple Health / Google Fit integration
  // Check daily_checkins for step data
  const { data } = await supabase
    .from('daily_checkins')
    .select('data')
    .eq('user_id', userId)
    .eq('checkin_date', date)
    .maybeSingle();

  const steps = ((data?.data as Record<string, unknown>)?.steps as number | undefined) ?? 0;

  return {
    taskId: 'steps',
    verified: steps >= minSteps,
    currentValue: steps,
    targetValue: minSteps,
    unit: 'steps',
  };
}

async function verifyAlcoholFree(
  userId: string,
  date: string
): Promise<VerificationResult> {
  // Check nutrition logs for alcohol-related items
  const { data: logs } = await supabase
    .from('nutrition_logs')
    .select('food_name, notes')
    .eq('user_id', userId)
    .gte('logged_at', `${date}T00:00:00`)
    .lte('logged_at', `${date}T23:59:59`);

  // Check if any logged items contain alcohol-related keywords
  const alcoholKeywords = ['beer', 'wine', 'cocktail', 'whiskey', 'vodka', 'rum', 'gin', 'tequila', 'alcohol', 'liquor', 'margarita', 'champagne', 'sake', 'bourbon'];
  const hasAlcohol = (logs ?? []).some((log: { food_name?: string; notes?: string }) => {
    const name = (log.food_name ?? '').toLowerCase();
    const notes = (log.notes ?? '').toLowerCase();
    return alcoholKeywords.some((kw) => name.includes(kw) || notes.includes(kw));
  });

  return {
    taskId: 'alcohol_free',
    verified: !hasAlcohol,
    currentValue: hasAlcohol ? 1 : 0,
    targetValue: 0,
    unit: 'drinks',
  };
}

async function verifyFasting(
  userId: string,
  date: string,
  config: Record<string, unknown>
): Promise<VerificationResult> {
  const protocol = (config.protocol as string) ?? '16:8';
  const parts = protocol.split(':').map(Number);
  const fastHours = parts[0] ?? 16;
  const eatWindowHours = 24 - fastHours;

  // Check nutrition logs to find eating window
  const { data: logs } = await supabase
    .from('nutrition_logs')
    .select('logged_at')
    .eq('user_id', userId)
    .gte('logged_at', `${date}T00:00:00`)
    .lte('logged_at', `${date}T23:59:59`)
    .order('logged_at', { ascending: true });

  if (!logs || logs.length === 0) {
    // No food logged — could be fasting all day (5:2 protocol low-cal day)
    return {
      taskId: 'fasting',
      verified: true,
      currentValue: 24,
      targetValue: fastHours,
      unit: 'hours fasted',
    };
  }

  const firstLog = logs[0];
  const lastLog = logs[logs.length - 1];
  if (!firstLog || !lastLog) {
    return {
      taskId: 'fasting',
      verified: true,
      currentValue: 24,
      targetValue: fastHours,
      unit: 'hours fasted',
    };
  }
  const firstMeal = new Date(firstLog.logged_at);
  const lastMeal = new Date(lastLog.logged_at);
  const eatingWindowMs = lastMeal.getTime() - firstMeal.getTime();
  const eatingWindowHours = eatingWindowMs / (1000 * 60 * 60);

  return {
    taskId: 'fasting',
    verified: eatingWindowHours <= eatWindowHours,
    currentValue: Math.round(24 - eatingWindowHours),
    targetValue: fastHours,
    unit: 'hours fasted',
  };
}
