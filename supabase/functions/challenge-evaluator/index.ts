// NOTE: No AI API calls — compliance preamble not required
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChallengeTask {
  id: string;
  label: string;
  type:
    | "workout"
    | "water"
    | "nutrition"
    | "photo"
    | "checkbox"
    | "steps"
    | "meditation"
    | "fasting"
    | "calories"
    | "protein";
  auto_verify: boolean;
  config: Record<string, any>;
}

interface ChallengeRules {
  tasks: ChallengeTask[];
  daily_targets?: Record<string, any>;
  rest_pattern?: string;
  schedule?: Record<string, any>;
  weekly_plan?: any[];
  protocols?: any[];
  user_selects_protocol?: boolean;
  elimination_list?: string[];
}

interface VerifyResult {
  completed: boolean;
  [key: string]: any;
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const today = new Date().toISOString().split("T")[0];
    const todayStart = `${today}T00:00:00Z`;
    const todayEnd = `${today}T23:59:59Z`;

    // Optional: evaluate a single user (for testing / manual trigger)
    let filterUserId: string | null = null;
    try {
      const body = await req.json();
      if (body?.user_id) {
        filterUserId = body.user_id;
      }
    } catch {
      // No body — evaluate all
    }

    // Get all active enrollments with their challenge definitions
    let enrollmentQuery = supabaseAdmin
      .from("challenge_enrollments")
      .select(
        `
        id,
        user_id,
        challenge_id,
        started_at,
        current_day,
        restart_count,
        status,
        configuration,
        target_end_date,
        challenge_definitions (
          id,
          name,
          slug,
          duration_days,
          rules,
          restart_on_failure
        )
      `
      )
      .eq("status", "active");

    if (filterUserId) {
      enrollmentQuery = enrollmentQuery.eq("user_id", filterUserId);
    }

    const { data: enrollments, error: enrollError } = await enrollmentQuery;

    if (enrollError) {
      throw new Error(`Failed to fetch enrollments: ${enrollError.message}`);
    }

    if (!enrollments || enrollments.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No active enrollments to evaluate",
          timestamp: today,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const results: any[] = [];

    for (const enrollment of enrollments) {
      const challenge = enrollment.challenge_definitions as any;
      if (!challenge) continue;

      const rules: ChallengeRules = challenge.rules;
      const tasks = rules.tasks || [];
      if (tasks.length === 0) continue;

      const userId = enrollment.user_id;
      const currentDay = enrollment.current_day;
      const challengeSlug: string = challenge.slug || "";
      const userConfig = (enrollment.configuration as Record<string, any>) || {};

      // ------------------------------------------------------------------
      // C25K: Only 3 run days per week. Auto-complete non-run days.
      // ------------------------------------------------------------------
      if (challengeSlug === "couch-to-5k") {
        const isRunDay = isCouchTo5kRunDay(currentDay, rules);
        if (!isRunDay) {
          await upsertDailyLog(supabaseAdmin, {
            enrollment_id: enrollment.id,
            user_id: userId,
            day_number: currentDay,
            date: today,
            tasks_completed: { rest_day: true },
            all_tasks_completed: true,
            auto_verified: { rest_day: true, reason: "non_run_day" },
          });

          await advanceDay(supabaseAdmin, enrollment, challenge);

          results.push({
            enrollment_id: enrollment.id,
            user_id: userId,
            challenge: challenge.name,
            day: currentDay,
            status: "rest_day_c25k",
          });
          continue;
        }
      }

      // ------------------------------------------------------------------
      // Progressive challenges (squat / plank): check daily_targets
      // ------------------------------------------------------------------
      if (rules.daily_targets) {
        const dayTarget = rules.daily_targets[String(currentDay)];
        if (dayTarget === "rest") {
          await upsertDailyLog(supabaseAdmin, {
            enrollment_id: enrollment.id,
            user_id: userId,
            day_number: currentDay,
            date: today,
            tasks_completed: { rest_day: true },
            all_tasks_completed: true,
            auto_verified: { rest_day: true },
          });

          await advanceDay(supabaseAdmin, enrollment, challenge);

          results.push({
            enrollment_id: enrollment.id,
            user_id: userId,
            challenge: challenge.name,
            day: currentDay,
            status: "rest_day",
          });
          continue;
        }
      }

      // ------------------------------------------------------------------
      // Check if we already have a log for today
      // ------------------------------------------------------------------
      const { data: existingLog } = await supabaseAdmin
        .from("challenge_daily_logs")
        .select("id, tasks_completed, all_tasks_completed")
        .eq("enrollment_id", enrollment.id)
        .eq("date", today)
        .single();

      // If already fully completed today, skip
      if (existingLog?.all_tasks_completed) {
        results.push({
          enrollment_id: enrollment.id,
          user_id: userId,
          challenge: challenge.name,
          day: currentDay,
          status: "already_completed",
        });
        continue;
      }

      const existingTasks =
        (existingLog?.tasks_completed as Record<string, boolean>) || {};

      // ------------------------------------------------------------------
      // Evaluate each task
      // ------------------------------------------------------------------
      const tasksCompleted: Record<string, boolean> = {};
      const autoVerified: Record<string, any> = {};

      for (const task of tasks) {
        // ----- Manual-verify / checkbox tasks -----
        if (!task.auto_verify || task.type === "checkbox") {
          tasksCompleted[task.id] = existingTasks[task.id] ?? false;
          continue;
        }

        switch (task.type) {
          // --------------------------------------------------------
          // WORKOUT
          // --------------------------------------------------------
          case "workout": {
            const verified = await verifyWorkoutTask(
              supabaseAdmin,
              userId,
              todayStart,
              todayEnd,
              task.config,
              rules,
              currentDay,
              challengeSlug,
              tasks
            );
            tasksCompleted[task.id] = verified.completed;
            autoVerified[task.id] = verified;
            break;
          }

          // --------------------------------------------------------
          // WATER
          // --------------------------------------------------------
          case "water": {
            const verified = await verifyWaterTask(
              supabaseAdmin,
              userId,
              todayStart,
              todayEnd,
              task.config
            );
            tasksCompleted[task.id] = verified.completed;
            autoVerified[task.id] = verified;
            break;
          }

          // --------------------------------------------------------
          // NUTRITION
          // --------------------------------------------------------
          case "nutrition": {
            const verified = await verifyNutritionTask(
              supabaseAdmin,
              userId,
              todayStart,
              todayEnd,
              task.config,
              challengeSlug,
              rules
            );
            tasksCompleted[task.id] = verified.completed;
            autoVerified[task.id] = verified;
            break;
          }

          // --------------------------------------------------------
          // PHOTO
          // --------------------------------------------------------
          case "photo": {
            const verified = await verifyPhotoTask(
              supabaseAdmin,
              userId,
              today,
              todayStart,
              todayEnd,
              enrollment.id,
              currentDay,
              task.config
            );
            tasksCompleted[task.id] = verified.completed;
            autoVerified[task.id] = verified;
            break;
          }

          // --------------------------------------------------------
          // STEPS
          // --------------------------------------------------------
          case "steps": {
            const verified = await verifyStepsTask(
              supabaseAdmin,
              userId,
              todayStart,
              todayEnd,
              task.config
            );
            tasksCompleted[task.id] = verified.completed;
            autoVerified[task.id] = verified;
            break;
          }

          // --------------------------------------------------------
          // MEDITATION
          // --------------------------------------------------------
          case "meditation": {
            const verified = await verifyMeditationTask(
              supabaseAdmin,
              userId,
              todayStart,
              todayEnd,
              task.config
            );
            tasksCompleted[task.id] = verified.completed;
            autoVerified[task.id] = verified;
            break;
          }

          // --------------------------------------------------------
          // FASTING
          // --------------------------------------------------------
          case "fasting": {
            const verified = await verifyFastingTask(
              supabaseAdmin,
              userId,
              todayStart,
              todayEnd,
              task.config,
              userConfig
            );
            tasksCompleted[task.id] = verified.completed;
            autoVerified[task.id] = verified;
            break;
          }

          // --------------------------------------------------------
          // CALORIES
          // --------------------------------------------------------
          case "calories": {
            const verified = await verifyCaloriesTask(
              supabaseAdmin,
              userId,
              todayStart,
              todayEnd,
              task.config
            );
            tasksCompleted[task.id] = verified.completed;
            autoVerified[task.id] = verified;
            break;
          }

          // --------------------------------------------------------
          // PROTEIN
          // --------------------------------------------------------
          case "protein": {
            const verified = await verifyProteinTask(
              supabaseAdmin,
              userId,
              todayStart,
              todayEnd,
              task.config
            );
            tasksCompleted[task.id] = verified.completed;
            autoVerified[task.id] = verified;
            break;
          }

          // --------------------------------------------------------
          // UNKNOWN — preserve existing manual entry
          // --------------------------------------------------------
          default: {
            tasksCompleted[task.id] = existingTasks[task.id] ?? false;
            break;
          }
        }
      }

      const allCompleted = tasks.every((t) => tasksCompleted[t.id] === true);

      // ------------------------------------------------------------------
      // Upsert today's daily log (merge auto-verified with manual entries)
      // ------------------------------------------------------------------
      const mergedTasks: Record<string, boolean> = { ...existingTasks };
      for (const [key, val] of Object.entries(tasksCompleted)) {
        // Auto-verified true wins; manual true also wins; only override
        // if auto says true or if we don't have a manual true.
        if (val === true || mergedTasks[key] === undefined) {
          mergedTasks[key] = val;
        }
      }

      const mergedAllCompleted = tasks.every(
        (t) => mergedTasks[t.id] === true
      );

      await upsertDailyLog(supabaseAdmin, {
        enrollment_id: enrollment.id,
        user_id: userId,
        day_number: currentDay,
        date: today,
        tasks_completed: mergedTasks,
        all_tasks_completed: mergedAllCompleted,
        auto_verified: autoVerified,
      });

      // ------------------------------------------------------------------
      // COMPLETION: Challenge finished
      // ------------------------------------------------------------------
      if (mergedAllCompleted && currentDay >= challenge.duration_days) {
        await supabaseAdmin
          .from("challenge_enrollments")
          .update({
            status: "completed",
            actual_end_date: today,
          })
          .eq("id", enrollment.id);

        await supabaseAdmin.from("notification_log").insert({
          user_id: userId,
          type: "challenge_completed",
          title: `Challenge Complete: ${challenge.name}!`,
          body: `Congratulations! You completed ${challenge.name}! All ${challenge.duration_days} days done. That is an incredible achievement.`,
          data: {
            enrollment_id: enrollment.id,
            challenge_id: challenge.id,
            challenge_name: challenge.name,
            restart_count: enrollment.restart_count,
          },
        });

        results.push({
          enrollment_id: enrollment.id,
          user_id: userId,
          challenge: challenge.name,
          day: currentDay,
          status: "challenge_completed",
        });
        continue;
      }

      // ------------------------------------------------------------------
      // DAY COMPLETED — advance to next day
      // ------------------------------------------------------------------
      if (mergedAllCompleted) {
        await advanceDay(supabaseAdmin, enrollment, challenge);

        results.push({
          enrollment_id: enrollment.id,
          user_id: userId,
          challenge: challenge.name,
          day: currentDay,
          status: "day_completed",
        });
        continue;
      }

      // ------------------------------------------------------------------
      // NOT ALL COMPLETED — check restart_on_failure
      // ------------------------------------------------------------------
      const missedTasks = tasks
        .filter((t) => !mergedTasks[t.id])
        .map((t) => t.label);

      if (challenge.restart_on_failure) {
        // RESTART: reset to Day 1
        const newRestartCount = (enrollment.restart_count || 0) + 1;
        const tomorrow = addDays(today, 1);

        await supabaseAdmin
          .from("challenge_enrollments")
          .update({
            current_day: 1,
            restart_count: newRestartCount,
            started_at: tomorrow,
            target_end_date: addDays(tomorrow, challenge.duration_days),
          })
          .eq("id", enrollment.id);

        await supabaseAdmin.from("notification_log").insert({
          user_id: userId,
          type: "challenge_restart",
          title: `${challenge.name}: Restart Required`,
          body: `Your ${challenge.name} resets to Day 1. This is restart #${newRestartCount}. Missed: ${missedTasks.join(", ")}. You have got this — get back after it.`,
          data: {
            enrollment_id: enrollment.id,
            challenge_id: challenge.id,
            challenge_name: challenge.name,
            restart_count: newRestartCount,
            missed_tasks: missedTasks,
            day_failed: currentDay,
          },
        });

        results.push({
          enrollment_id: enrollment.id,
          user_id: userId,
          challenge: challenge.name,
          day: currentDay,
          status: "restarted",
          restart_count: newRestartCount,
          missed_tasks: missedTasks,
        });
      } else {
        // Non-strict: notify incomplete and advance anyway
        if (missedTasks.length > 0) {
          await supabaseAdmin.from("notification_log").insert({
            user_id: userId,
            type: "challenge_incomplete",
            title: `${challenge.name}: Day ${currentDay} Incomplete`,
            body: `You still needed to complete: ${missedTasks.join(", ")}. Tomorrow is a new opportunity.`,
            data: {
              enrollment_id: enrollment.id,
              challenge_id: challenge.id,
              challenge_name: challenge.name,
              missed_tasks: missedTasks,
              day_number: currentDay,
            },
          });
        }

        await advanceDay(supabaseAdmin, enrollment, challenge);

        results.push({
          enrollment_id: enrollment.id,
          user_id: userId,
          challenge: challenge.name,
          day: currentDay,
          status: "incomplete",
          missed_tasks: missedTasks,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        enrollments_evaluated: enrollments.length,
        results,
        timestamp: today,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// ===========================================================================
// VERIFICATION FUNCTIONS
// ===========================================================================

// ---------------------------------------------------------------------------
// WORKOUT verification
// ---------------------------------------------------------------------------
// Handles: basic duration check, 75-Hard dual-workout (3 hr apart, outdoor),
// progressive challenges (squat/plank with daily_targets), C25K run sessions.
// ---------------------------------------------------------------------------

async function verifyWorkoutTask(
  supabase: any,
  userId: string,
  todayStart: string,
  todayEnd: string,
  config: Record<string, any>,
  rules: ChallengeRules,
  currentDay: number,
  challengeSlug: string,
  allTasks: ChallengeTask[]
): Promise<VerifyResult> {
  const { data: sessions, error } = await supabase
    .from("workout_sessions")
    .select(
      "id, duration_minutes, started_at, completed_at, name, total_volume, total_sets"
    )
    .eq("user_id", userId)
    .gte("started_at", todayStart)
    .lte("started_at", todayEnd)
    .not("completed_at", "is", null);

  if (error || !sessions) {
    return { completed: false, sessions_found: 0, total_minutes: 0 };
  }

  const totalMinutes = sessions.reduce(
    (sum: number, s: any) => sum + (s.duration_minutes || 0),
    0
  );

  // ------------------------------------------------------------------
  // Progressive challenge (squat / plank) — check daily target reps/duration
  // ------------------------------------------------------------------
  if (rules.daily_targets && config.exercise) {
    const dayTarget = rules.daily_targets[String(currentDay)];
    if (dayTarget === "rest") {
      return { completed: true, reason: "rest_day" };
    }

    if (typeof dayTarget === "number") {
      // Reps target (e.g. squat challenge: 50, 55, 60 ...)
      // Look for workout sets matching the exercise
      const { data: sets } = await supabase
        .from("workout_sets")
        .select("reps, exercise:exercises(name, slug)")
        .in(
          "session_id",
          sessions.map((s: any) => s.id)
        );

      const totalReps = (sets || []).reduce((sum: number, set: any) => {
        const slug = set.exercise?.slug || set.exercise?.name || "";
        if (
          slug.toLowerCase().includes(config.exercise.replace("_", " ")) ||
          slug.toLowerCase().includes(config.exercise)
        ) {
          return sum + (set.reps || 0);
        }
        return sum;
      }, 0);

      return {
        completed: totalReps >= dayTarget,
        total_reps: totalReps,
        target_reps: dayTarget,
        sessions_found: sessions.length,
      };
    }

    if (typeof dayTarget === "string" && dayTarget.endsWith("s")) {
      // Duration target in seconds (e.g. plank challenge: "20s", "300s")
      const targetSeconds = parseInt(dayTarget.replace("s", ""), 10);

      // Check workout session duration (the plank session total time)
      // For plank, users log a single "workout" that is the hold.
      // Also check workout_sets for timed sets.
      const { data: sets } = await supabase
        .from("workout_sets")
        .select("duration_seconds, reps, exercise:exercises(name, slug)")
        .in(
          "session_id",
          sessions.map((s: any) => s.id)
        );

      let totalHoldSeconds = 0;
      for (const set of sets || []) {
        const slug = set.exercise?.slug || set.exercise?.name || "";
        if (
          slug.toLowerCase().includes(config.exercise.replace("_", " ")) ||
          slug.toLowerCase().includes(config.exercise)
        ) {
          totalHoldSeconds += set.duration_seconds || 0;
        }
      }

      // Fallback: if no individual set data, check if a plank-named session
      // has enough total duration
      if (totalHoldSeconds === 0) {
        for (const session of sessions) {
          const name = (session.name || "").toLowerCase();
          if (
            name.includes(config.exercise.replace("_", " ")) ||
            name.includes(config.exercise)
          ) {
            totalHoldSeconds += (session.duration_minutes || 0) * 60;
          }
        }
      }

      return {
        completed: totalHoldSeconds >= targetSeconds,
        total_hold_seconds: totalHoldSeconds,
        target_seconds: targetSeconds,
        sessions_found: sessions.length,
      };
    }
  }

  // ------------------------------------------------------------------
  // 75 Hard: dual workout verification
  // Two workout tasks both have type "workout". Check if the current
  // task's specific constraints are met.
  // ------------------------------------------------------------------
  const workoutTasks = allTasks.filter(
    (t) => t.type === "workout" && t.auto_verify
  );
  const is75HardDualWorkout =
    challengeSlug === "75-hard" && workoutTasks.length >= 2;

  if (is75HardDualWorkout && sessions.length >= 2) {
    // Sort sessions by started_at
    const sorted = [...sessions].sort(
      (a: any, b: any) =>
        new Date(a.started_at).getTime() - new Date(b.started_at).getTime()
    );

    // Verify at least 2 sessions are >= 3 hours apart
    let twoSessionsApart = false;
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const gap =
          Math.abs(
            new Date(sorted[j].started_at).getTime() -
              new Date(sorted[i].started_at).getTime()
          ) /
          (1000 * 60 * 60);
        if (gap >= 3) {
          twoSessionsApart = true;
          break;
        }
      }
      if (twoSessionsApart) break;
    }

    // Check outdoor requirement for the outdoor-specific task
    const requiresOutdoor = config.location === "outdoor";
    let outdoorMet = !requiresOutdoor; // true if not required

    if (requiresOutdoor) {
      // Check if any session name/notes suggest outdoor activity
      // (running, walking, hiking, cycling, outdoor, etc.)
      const outdoorKeywords = [
        "outdoor",
        "outside",
        "run",
        "walk",
        "hike",
        "cycling",
        "bike",
        "swim",
        "park",
        "trail",
      ];
      outdoorMet = sessions.some((s: any) => {
        const name = (s.name || "").toLowerCase();
        return outdoorKeywords.some((kw) => name.includes(kw));
      });
    }

    // Check minimum duration
    const minDuration = config.min_duration_minutes || 45;
    const qualifyingSessions = sessions.filter(
      (s: any) => (s.duration_minutes || 0) >= minDuration
    );

    const completed =
      qualifyingSessions.length >= 1 && twoSessionsApart && outdoorMet;

    return {
      completed,
      sessions_found: sessions.length,
      qualifying_sessions: qualifyingSessions.length,
      total_minutes: totalMinutes,
      two_sessions_3hr_apart: twoSessionsApart,
      outdoor_met: outdoorMet,
      min_duration_required: minDuration,
    };
  }

  // ------------------------------------------------------------------
  // Standard single-workout check
  // ------------------------------------------------------------------
  let completed = sessions.length > 0;

  if (config.min_duration_minutes) {
    completed = sessions.some(
      (s: any) => (s.duration_minutes || 0) >= config.min_duration_minutes
    );
  }

  return {
    completed,
    sessions_found: sessions.length,
    total_minutes: totalMinutes,
  };
}

// ---------------------------------------------------------------------------
// WATER verification
// ---------------------------------------------------------------------------
// Handles: static target (min_oz), dynamic target (bodyweight formula).
// ---------------------------------------------------------------------------

async function verifyWaterTask(
  supabase: any,
  userId: string,
  todayStart: string,
  todayEnd: string,
  config: Record<string, any>
): Promise<VerifyResult> {
  const { data: waterLogs, error } = await supabase
    .from("water_logs")
    .select("amount_oz")
    .eq("user_id", userId)
    .gte("logged_at", todayStart)
    .lte("logged_at", todayEnd);

  if (error || !waterLogs) {
    return { completed: false, total_oz: 0, target_oz: config.min_oz || 0 };
  }

  const totalOz = waterLogs.reduce(
    (sum: number, w: any) => sum + (Number(w.amount_oz) || 0),
    0
  );

  let targetOz = config.min_oz || 0;

  // Dynamic target: "bodyweight_lbs_div_2_oz" — half bodyweight in oz
  if (config.formula === "bodyweight_lbs_div_2_oz") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("current_weight")
      .eq("id", userId)
      .single();

    const weight = Number(profile?.current_weight) || 0;
    if (weight > 0) {
      targetOz = Math.round(weight / 2);
    } else {
      // Fallback to 64 oz if no weight on file
      targetOz = 64;
    }
  }

  return {
    completed: targetOz > 0 ? totalOz >= targetOz : totalOz > 0,
    total_oz: totalOz,
    target_oz: targetOz,
  };
}

// ---------------------------------------------------------------------------
// NUTRITION verification
// ---------------------------------------------------------------------------
// Handles: min meals, max calories, Whole30 elimination check, strict diet
// flagging for 75 Hard (< 2 meals logged).
// ---------------------------------------------------------------------------

async function verifyNutritionTask(
  supabase: any,
  userId: string,
  todayStart: string,
  todayEnd: string,
  config: Record<string, any>,
  challengeSlug: string,
  rules: ChallengeRules
): Promise<VerifyResult> {
  const { data: nutritionLogs, error } = await supabase
    .from("nutrition_logs")
    .select("id, meal_type, calories, protein, carbs, fat, food_id, logged_at")
    .eq("user_id", userId)
    .gte("logged_at", todayStart)
    .lte("logged_at", todayEnd);

  if (error || !nutritionLogs) {
    return { completed: false, meals_logged: 0 };
  }

  let completed = nutritionLogs.length > 0;
  const details: Record<string, any> = {
    meals_logged: nutritionLogs.length,
  };

  // Total macros
  const totalCalories = nutritionLogs.reduce(
    (sum: number, l: any) => sum + (Number(l.calories) || 0),
    0
  );
  const totalProtein = nutritionLogs.reduce(
    (sum: number, l: any) => sum + (Number(l.protein) || 0),
    0
  );

  details.total_calories = totalCalories;
  details.total_protein = totalProtein;

  // Minimum meal count
  if (config.min_meals) {
    const mealsOk = nutritionLogs.length >= config.min_meals;
    completed = completed && mealsOk;
    details.min_meals_met = mealsOk;
  }

  // Max calorie target
  if (config.max_calories) {
    const caloriesOk = totalCalories <= config.max_calories;
    completed = completed && caloriesOk;
    details.max_calories_met = caloriesOk;
  }

  // 75 Hard strict diet: flag if fewer than 2 meals logged
  if (challengeSlug === "75-hard") {
    // Unique meal types logged today
    const mealTypes = new Set(nutritionLogs.map((l: any) => l.meal_type));
    if (mealTypes.size < 2) {
      details.strict_diet_warning = true;
      details.unique_meal_types = mealTypes.size;
      // Don't auto-fail since diet adherence is partially manual,
      // but flag it for the user
    }
  }

  // Whole30: check food items against elimination list
  if (challengeSlug === "whole30" && rules.elimination_list) {
    const eliminatedFoods = rules.elimination_list;
    // Fetch food details for logged items
    const foodIds = nutritionLogs
      .map((l: any) => l.food_id)
      .filter(Boolean);

    if (foodIds.length > 0) {
      const { data: foods } = await supabase
        .from("foods")
        .select("id, name, category, tags")
        .in("id", foodIds);

      const violations: string[] = [];
      for (const food of foods || []) {
        const foodCategory = (food.category || "").toLowerCase();
        const foodName = (food.name || "").toLowerCase();
        const foodTags = (food.tags || []) as string[];

        for (const eliminated of eliminatedFoods) {
          const elim = eliminated.toLowerCase();
          if (
            foodCategory.includes(elim) ||
            foodName.includes(elim) ||
            foodTags.some((t: string) => t.toLowerCase().includes(elim))
          ) {
            violations.push(`${food.name} (contains ${eliminated})`);
          }
        }
      }

      if (violations.length > 0) {
        completed = false;
        details.elimination_violations = violations;
      }
    }
  }

  return { completed, ...details };
}

// ---------------------------------------------------------------------------
// PHOTO verification
// ---------------------------------------------------------------------------
// Checks progress_photos storage bucket and challenge_daily_logs for a photo
// entry. Respects required_days config (e.g., Day 1 and Day 75 only).
// ---------------------------------------------------------------------------

async function verifyPhotoTask(
  supabase: any,
  userId: string,
  today: string,
  todayStart: string,
  todayEnd: string,
  enrollmentId: string,
  currentDay: number,
  config: Record<string, any>
): Promise<VerifyResult> {
  // If the photo is only required on specific days, check that
  if (config.required_days && Array.isArray(config.required_days)) {
    if (!config.required_days.includes(currentDay)) {
      return { completed: true, photo_found: false, reason: "not_required_today" };
    }
  }

  // Strategy 1: Check progress_photos storage bucket
  const folderPath = `${userId}/${today}`;
  const { data: files, error: storageError } = await supabase.storage
    .from("progress_photos")
    .list(folderPath, { limit: 1 });

  if (!storageError && files && files.length > 0) {
    return { completed: true, photo_found: true, source: "storage_bucket" };
  }

  // Strategy 2: Try hyphenated bucket name
  const { data: files2 } = await supabase.storage
    .from("progress-photos")
    .list(folderPath, { limit: 1 });

  if (files2 && files2.length > 0) {
    return { completed: true, photo_found: true, source: "storage_bucket_alt" };
  }

  // Strategy 3: Check weight_logs for photo URLs logged today
  const { data: weightLogs } = await supabase
    .from("weight_logs")
    .select("photo_front_url, photo_side_url, photo_back_url")
    .eq("user_id", userId)
    .gte("logged_at", todayStart)
    .lte("logged_at", todayEnd)
    .limit(1);

  if (weightLogs && weightLogs.length > 0) {
    const log = weightLogs[0];
    if (log.photo_front_url || log.photo_side_url || log.photo_back_url) {
      return { completed: true, photo_found: true, source: "weight_log_photo" };
    }
  }

  // Strategy 4: Check if user already manually marked photo in daily log
  const { data: dailyLog } = await supabase
    .from("challenge_daily_logs")
    .select("tasks_completed")
    .eq("enrollment_id", enrollmentId)
    .eq("date", today)
    .single();

  if (dailyLog?.tasks_completed) {
    const tc = dailyLog.tasks_completed as Record<string, any>;
    // Check all keys that look like photo tasks
    for (const [key, val] of Object.entries(tc)) {
      if (key.includes("photo") && val === true) {
        return { completed: true, photo_found: true, source: "manual_log" };
      }
    }
  }

  return { completed: false, photo_found: false };
}

// ---------------------------------------------------------------------------
// STEPS verification
// ---------------------------------------------------------------------------
// Queries daily_checkins for step data, or a dedicated step count from the
// checkin. No step_logs table exists, so we check daily_checkins and any
// health data fields.
// ---------------------------------------------------------------------------

async function verifyStepsTask(
  supabase: any,
  userId: string,
  todayStart: string,
  todayEnd: string,
  config: Record<string, any>
): Promise<VerifyResult> {
  const targetSteps = config.min_steps || 10000;
  const today = todayStart.split("T")[0];

  // Check daily_checkins for steps data (stored in the habits or data field)
  const { data: checkin } = await supabase
    .from("daily_checkins")
    .select("*")
    .eq("user_id", userId)
    .eq("date", today)
    .single();

  // The daily_checkins table may store steps in a JSONB habits field or
  // we derive from general data. Try multiple strategies.
  let totalSteps = 0;

  if (checkin) {
    // Check if steps are directly stored
    if (typeof checkin.steps === "number") {
      totalSteps = checkin.steps;
    }
    // Check habits_data JSONB
    if (checkin.habits_data && typeof checkin.habits_data === "object") {
      totalSteps = Number(checkin.habits_data.steps) || totalSteps;
    }
  }

  // Fallback: check workout_sessions for walking/running sessions and
  // estimate steps from duration (rough estimate: 100 steps/min walking)
  if (totalSteps === 0) {
    const { data: walkSessions } = await supabase
      .from("workout_sessions")
      .select("duration_minutes, name")
      .eq("user_id", userId)
      .gte("started_at", todayStart)
      .lte("started_at", todayEnd)
      .not("completed_at", "is", null);

    if (walkSessions && walkSessions.length > 0) {
      for (const session of walkSessions) {
        const name = (session.name || "").toLowerCase();
        if (
          name.includes("walk") ||
          name.includes("run") ||
          name.includes("hike") ||
          name.includes("step")
        ) {
          // Running ~160 steps/min, walking ~100 steps/min
          const rate = name.includes("run") ? 160 : 100;
          totalSteps += (session.duration_minutes || 0) * rate;
        }
      }
    }
  }

  return {
    completed: totalSteps >= targetSteps,
    total_steps: totalSteps,
    target_steps: targetSteps,
  };
}

// ---------------------------------------------------------------------------
// MEDITATION verification
// ---------------------------------------------------------------------------
// Queries focus_sessions where the task description or category suggests
// meditation. The focus_sessions category CHECK doesn't include "meditation"
// directly, so we also check task_description.
// ---------------------------------------------------------------------------

async function verifyMeditationTask(
  supabase: any,
  userId: string,
  todayStart: string,
  todayEnd: string,
  config: Record<string, any>
): Promise<VerifyResult> {
  const minMinutes = config.min_duration_minutes || config.min_minutes || 5;

  // Query focus sessions that match meditation
  const { data: sessions, error } = await supabase
    .from("focus_sessions")
    .select(
      "id, actual_duration_minutes, planned_duration_minutes, task_description, category, completed_at"
    )
    .eq("user_id", userId)
    .gte("started_at", todayStart)
    .lte("started_at", todayEnd)
    .not("completed_at", "is", null);

  if (error || !sessions) {
    return { completed: false, total_minutes: 0, target_minutes: minMinutes };
  }

  // Filter to meditation sessions
  const meditationSessions = sessions.filter((s: any) => {
    const desc = (s.task_description || "").toLowerCase();
    const cat = (s.category || "").toLowerCase();
    return (
      desc.includes("meditat") ||
      desc.includes("mindful") ||
      desc.includes("breathe") ||
      desc.includes("breathing") ||
      cat === "meditation" ||
      cat === "mindfulness"
    );
  });

  const totalMinutes = meditationSessions.reduce(
    (sum: number, s: any) =>
      sum + (s.actual_duration_minutes || s.planned_duration_minutes || 0),
    0
  );

  return {
    completed: totalMinutes >= minMinutes,
    total_minutes: totalMinutes,
    target_minutes: minMinutes,
    sessions_found: meditationSessions.length,
  };
}

// ---------------------------------------------------------------------------
// FASTING verification
// ---------------------------------------------------------------------------
// Checks meal_logs / nutrition_logs timestamps against the configured eating
// window. If all meals fall within the window, fasting is verified.
// ---------------------------------------------------------------------------

async function verifyFastingTask(
  supabase: any,
  userId: string,
  todayStart: string,
  todayEnd: string,
  config: Record<string, any>,
  userConfig: Record<string, any>
): Promise<VerifyResult> {
  // Determine the fasting protocol from enrollment configuration or task config
  const protocol = userConfig.protocol || config.protocol || "16_8";
  let fastingHours = 16;
  let eatingHours = 8;

  switch (protocol) {
    case "18_6":
      fastingHours = 18;
      eatingHours = 6;
      break;
    case "20_4":
      fastingHours = 20;
      eatingHours = 4;
      break;
    case "16_8":
    default:
      fastingHours = 16;
      eatingHours = 8;
      break;
  }

  // Determine eating window: default eating window starts at noon
  const eatingWindowStart =
    userConfig.eating_window_start || config.eating_window_start || "12:00";
  const [startHour, startMin] = eatingWindowStart.split(":").map(Number);
  const windowStartMinutes = startHour * 60 + (startMin || 0);
  const windowEndMinutes = windowStartMinutes + eatingHours * 60;

  // Fetch all nutrition logs for today
  const { data: meals, error } = await supabase
    .from("nutrition_logs")
    .select("id, logged_at, meal_type")
    .eq("user_id", userId)
    .gte("logged_at", todayStart)
    .lte("logged_at", todayEnd)
    .order("logged_at", { ascending: true });

  if (error) {
    return {
      completed: false,
      protocol,
      fasting_hours: fastingHours,
      eating_hours: eatingHours,
    };
  }

  // No meals logged = fasting maintained (could be full fast day or 5:2 restricted day)
  if (!meals || meals.length === 0) {
    return {
      completed: true,
      protocol,
      fasting_hours: fastingHours,
      eating_hours: eatingHours,
      meals_logged: 0,
      reason: "no_meals_logged",
    };
  }

  // Check that all meals fall within the eating window
  let allWithinWindow = true;
  const violations: string[] = [];

  for (const meal of meals) {
    const mealTime = new Date(meal.logged_at);
    const mealMinutes = mealTime.getUTCHours() * 60 + mealTime.getUTCMinutes();

    if (mealMinutes < windowStartMinutes || mealMinutes > windowEndMinutes) {
      allWithinWindow = false;
      const timeStr = `${String(mealTime.getUTCHours()).padStart(2, "0")}:${String(mealTime.getUTCMinutes()).padStart(2, "0")}`;
      violations.push(
        `${meal.meal_type || "meal"} at ${timeStr} outside ${eatingWindowStart}-${formatMinutes(windowEndMinutes)}`
      );
    }
  }

  // Also check the span between first and last meal
  const firstMealTime = new Date(meals[0].logged_at);
  const lastMealTime = new Date(meals[meals.length - 1].logged_at);
  const eatingSpanHours =
    (lastMealTime.getTime() - firstMealTime.getTime()) / (1000 * 60 * 60);
  const spanWithinLimit = eatingSpanHours <= eatingHours;

  return {
    completed: allWithinWindow && spanWithinLimit,
    protocol,
    fasting_hours: fastingHours,
    eating_hours: eatingHours,
    meals_logged: meals.length,
    all_within_window: allWithinWindow,
    eating_span_hours: Math.round(eatingSpanHours * 10) / 10,
    span_within_limit: spanWithinLimit,
    violations: violations.length > 0 ? violations : undefined,
  };
}

// ---------------------------------------------------------------------------
// CALORIES verification
// ---------------------------------------------------------------------------

async function verifyCaloriesTask(
  supabase: any,
  userId: string,
  todayStart: string,
  todayEnd: string,
  config: Record<string, any>
): Promise<VerifyResult> {
  const { data: nutritionLogs, error } = await supabase
    .from("nutrition_logs")
    .select("calories")
    .eq("user_id", userId)
    .gte("logged_at", todayStart)
    .lte("logged_at", todayEnd);

  if (error || !nutritionLogs) {
    return { completed: false, total_calories: 0 };
  }

  const totalCalories = nutritionLogs.reduce(
    (sum: number, l: any) => sum + (Number(l.calories) || 0),
    0
  );

  let completed = false;

  // Target can be max (cut) or min (bulk) or a range
  if (config.max_calories && config.min_calories) {
    completed =
      totalCalories >= config.min_calories &&
      totalCalories <= config.max_calories;
  } else if (config.max_calories) {
    completed = totalCalories <= config.max_calories && totalCalories > 0;
  } else if (config.min_calories) {
    completed = totalCalories >= config.min_calories;
  } else if (config.target_calories) {
    // Within 10% tolerance
    const tolerance = config.target_calories * 0.1;
    completed =
      totalCalories >= config.target_calories - tolerance &&
      totalCalories <= config.target_calories + tolerance;
  } else {
    // No target specified, just check that calories were logged
    completed = nutritionLogs.length > 0;
  }

  // If user has a profile calorie target, use that as fallback
  if (!config.max_calories && !config.min_calories && !config.target_calories) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("daily_calorie_target")
      .eq("id", userId)
      .single();

    if (profile?.daily_calorie_target && totalCalories > 0) {
      const target = profile.daily_calorie_target;
      const tolerance = target * 0.1;
      completed =
        totalCalories >= target - tolerance &&
        totalCalories <= target + tolerance;
    }
  }

  return {
    completed,
    total_calories: totalCalories,
    target: config.max_calories || config.min_calories || config.target_calories,
    meals_logged: nutritionLogs.length,
  };
}

// ---------------------------------------------------------------------------
// PROTEIN verification
// ---------------------------------------------------------------------------

async function verifyProteinTask(
  supabase: any,
  userId: string,
  todayStart: string,
  todayEnd: string,
  config: Record<string, any>
): Promise<VerifyResult> {
  const { data: nutritionLogs, error } = await supabase
    .from("nutrition_logs")
    .select("protein")
    .eq("user_id", userId)
    .gte("logged_at", todayStart)
    .lte("logged_at", todayEnd);

  if (error || !nutritionLogs) {
    return { completed: false, total_protein: 0 };
  }

  const totalProtein = nutritionLogs.reduce(
    (sum: number, l: any) => sum + (Number(l.protein) || 0),
    0
  );

  let targetProtein = config.min_protein || config.target_protein || 0;

  // If no target in config, check user profile
  if (targetProtein === 0) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("daily_protein_target, current_weight")
      .eq("id", userId)
      .single();

    if (profile?.daily_protein_target) {
      targetProtein = profile.daily_protein_target;
    } else if (profile?.current_weight) {
      // Default: 1g per lb bodyweight
      targetProtein = Math.round(Number(profile.current_weight));
    }
  }

  const completed =
    targetProtein > 0 ? totalProtein >= targetProtein : nutritionLogs.length > 0;

  return {
    completed,
    total_protein: totalProtein,
    target_protein: targetProtein,
    meals_logged: nutritionLogs.length,
  };
}

// ===========================================================================
// C25K HELPER
// ===========================================================================

/**
 * Determines if today is a run day for Couch to 5K.
 * C25K has 3 runs per week across 9 weeks (63 days).
 * Typical pattern: Mon/Wed/Fri (days 1,3,5 of each 7-day week).
 */
function isCouchTo5kRunDay(currentDay: number, rules: ChallengeRules): boolean {
  const runsPerWeek = rules.schedule?.runs_per_week || 3;

  // Determine which day of the week this is (1-7)
  const dayOfWeek = ((currentDay - 1) % 7) + 1;

  // Default run days: 1, 3, 5 (Mon, Wed, Fri pattern)
  if (runsPerWeek === 3) {
    return dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5;
  }

  // For other patterns, space them evenly
  const spacing = Math.floor(7 / runsPerWeek);
  for (let i = 0; i < runsPerWeek; i++) {
    if (dayOfWeek === 1 + i * spacing) return true;
  }

  return false;
}

// ===========================================================================
// GENERAL HELPERS
// ===========================================================================

async function upsertDailyLog(
  supabase: any,
  log: {
    enrollment_id: string;
    user_id: string;
    day_number: number;
    date: string;
    tasks_completed: Record<string, any>;
    all_tasks_completed: boolean;
    auto_verified: Record<string, any>;
  }
) {
  const { data: existing } = await supabase
    .from("challenge_daily_logs")
    .select("id, tasks_completed")
    .eq("enrollment_id", log.enrollment_id)
    .eq("date", log.date)
    .single();

  if (existing) {
    // Merge: preserve any existing manual entries, overlay auto-verified
    const mergedTasks = {
      ...(existing.tasks_completed || {}),
      ...log.tasks_completed,
    };

    await supabase
      .from("challenge_daily_logs")
      .update({
        tasks_completed: mergedTasks,
        all_tasks_completed: log.all_tasks_completed,
        auto_verified: log.auto_verified,
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("challenge_daily_logs").insert({
      enrollment_id: log.enrollment_id,
      user_id: log.user_id,
      day_number: log.day_number,
      date: log.date,
      tasks_completed: log.tasks_completed,
      all_tasks_completed: log.all_tasks_completed,
      auto_verified: log.auto_verified,
    });
  }
}

async function advanceDay(
  supabase: any,
  enrollment: any,
  challenge: any
) {
  const nextDay = (enrollment.current_day || 1) + 1;
  if (nextDay <= challenge.duration_days) {
    await supabase
      .from("challenge_enrollments")
      .update({ current_day: nextDay })
      .eq("id", enrollment.id);
  }
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function formatMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60) % 24;
  const mins = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}
