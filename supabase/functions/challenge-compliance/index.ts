import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { COMPLIANCE_PREAMBLE } from "../_shared/compliance.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const AI_MODEL = "claude-sonnet-4-20250514";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ---------------------------------------------------------------------------
// Whole30 elimination categories — used for pre-screening foods
// ---------------------------------------------------------------------------
const WHOLE30_ELIMINATED_KEYWORDS: string[] = [
  // Grains
  "wheat", "bread", "pasta", "rice", "oat", "corn", "barley", "rye", "quinoa",
  "flour", "cereal", "grain", "tortilla", "cracker", "bagel", "muffin",
  // Legumes
  "bean", "lentil", "pea", "chickpea", "peanut", "soy", "tofu", "edamame",
  "hummus", "legume",
  // Dairy
  "milk", "cheese", "yogurt", "butter", "cream", "dairy", "whey", "casein",
  "ice cream", "kefir",
  // Added sugar / sweeteners
  "sugar", "syrup", "honey", "agave", "stevia", "splenda", "aspartame",
  "maltodextrin", "dextrose", "fructose", "candy", "chocolate",
  // Alcohol
  "beer", "wine", "vodka", "whiskey", "alcohol", "spirits", "liquor", "rum",
  // Additives
  "carrageenan", "msg", "monosodium glutamate", "sulfite",
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FoodItem {
  name: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

interface WorkoutData {
  duration_minutes: number;
  type?: string;
  started_at: string;
  is_outdoor?: boolean;
}

interface MealData {
  foods: FoodItem[];
  meal_time: string;
}

interface WaterData {
  oz_added: number;
  daily_total: number;
}

interface FoodSearchData {
  food_name: string;
  food_data?: Record<string, unknown>;
}

type ActionData = MealData | WorkoutData | WaterData | FoodSearchData | Record<string, never>;

type ActionType =
  | "meal_logged"
  | "workout_logged"
  | "water_logged"
  | "food_searched"
  | "manual_check";

interface TaskStatus {
  completed: boolean;
  progress: number;
  target: number;
}

interface ComplianceResponse {
  compliant: boolean;
  violations: string[];
  warnings: string[];
  task_status: Record<string, TaskStatus>;
  recommendation: string;
}

interface ChallengeTask {
  id: string;
  label: string;
  type: string;
  auto_verify: boolean;
  config: Record<string, unknown>;
}

interface ChallengeRules {
  tasks: ChallengeTask[];
  fasting_protocol?: string;
  elimination_list?: string[];
  rest_days_per_week?: number;
  [key: string]: unknown;
}

interface ChallengeDefinition {
  id: string;
  name: string;
  slug: string;
  duration_days: number;
  rules: ChallengeRules;
  restart_on_failure?: boolean;
}

interface Enrollment {
  id: string;
  user_id: string;
  current_day?: number;
  restart_count?: number;
  configuration?: Record<string, unknown>;
  challenge_definitions: ChallengeDefinition;
}

interface DailyLog {
  tasks_completed: Record<string, boolean>;
  all_tasks_completed: boolean;
}

// ---------------------------------------------------------------------------
// Claude helper (only called for subjective diet checks)
// ---------------------------------------------------------------------------
async function callClaude(systemPrompt: string, userMessage: string): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: AI_MODEL,
      max_tokens: 512,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });
  const data = await response.json();
  return data.content[0].text;
}

// ---------------------------------------------------------------------------
// Whole30 food check (pure logic — no AI call)
// ---------------------------------------------------------------------------
function checkWhole30Compliance(
  foods: FoodItem[],
  extraEliminations: string[] = []
): { compliant: boolean; violations: string[] } {
  const allKeywords = [...WHOLE30_ELIMINATED_KEYWORDS, ...extraEliminations.map((s) => s.toLowerCase())];
  const violations: string[] = [];

  for (const food of foods) {
    const nameLower = food.name.toLowerCase();
    const matched = allKeywords.find((kw) => nameLower.includes(kw));
    if (matched) {
      violations.push(`"${food.name}" contains ${matched} (not Whole30 compliant)`);
    }
  }

  return { compliant: violations.length === 0, violations };
}

// ---------------------------------------------------------------------------
// IF eating-window check (pure logic)
// ---------------------------------------------------------------------------
function checkFastingWindow(
  mealTimeIso: string,
  fastingProtocol: string,
  configuration: Record<string, unknown>
): { compliant: boolean; violations: string[] } {
  // eating_window_start is stored as HH:MM in configuration
  const windowStart = typeof configuration["eating_window_start"] === "string"
    ? configuration["eating_window_start"] as string
    : null;
  const windowEnd = typeof configuration["eating_window_end"] === "string"
    ? configuration["eating_window_end"] as string
    : null;

  // Derive window from protocol if not in configuration
  let startHour = 12; // default: noon
  let windowHours = 8;

  if (fastingProtocol === "16:8") windowHours = 8;
  else if (fastingProtocol === "18:6") windowHours = 6;
  else if (fastingProtocol === "20:4") windowHours = 4;
  else if (fastingProtocol === "5:2") return { compliant: true, violations: [] }; // no daily window

  if (windowStart) {
    const [h, m] = windowStart.split(":").map(Number);
    startHour = h + (m || 0) / 60;
  }
  if (windowEnd) {
    const [h, m] = windowEnd.split(":").map(Number);
    const endHour = h + (m || 0) / 60;
    windowHours = endHour >= startHour ? endHour - startHour : 24 - startHour + endHour;
  }

  const endHour = (startHour + windowHours) % 24;
  const mealDate = new Date(mealTimeIso);
  const mealHour = mealDate.getHours() + mealDate.getMinutes() / 60;

  let inWindow: boolean;
  if (endHour > startHour) {
    inWindow = mealHour >= startHour && mealHour < endHour;
  } else {
    // overnight window (crosses midnight)
    inWindow = mealHour >= startHour || mealHour < endHour;
  }

  if (!inWindow) {
    const startLabel = `${Math.floor(startHour)}:${String(Math.round((startHour % 1) * 60)).padStart(2, "0")} ${startHour >= 12 ? "PM" : "AM"}`;
    const endLabel = `${Math.floor(endHour)}:${String(Math.round((endHour % 1) * 60)).padStart(2, "0")} ${endHour >= 12 ? "PM" : "AM"}`;
    return {
      compliant: false,
      violations: [
        `This meal is outside your ${fastingProtocol} eating window (${startLabel} – ${endLabel})`,
      ],
    };
  }

  return { compliant: true, violations: [] };
}

// ---------------------------------------------------------------------------
// 75 Hard subjective diet compliance (calls Claude)
// ---------------------------------------------------------------------------
async function check75HardDietCompliance(
  foods: FoodItem[],
  dietPlan: string
): Promise<{ compliant: boolean; violations: string[] }> {
  const systemPrompt =
    COMPLIANCE_PREAMBLE +
    "\n\nYou are a strict diet compliance checker for the 75 Hard challenge. " +
    "Evaluate whether a meal complies with the specified diet plan. " +
    "Be strict but reasonable — common sense exceptions apply (e.g., olive oil on a clean-eating plan is fine). " +
    "ALWAYS respond with valid JSON in this exact format:\n" +
    '{"compliant": true|false, "violations": ["reason 1", "reason 2"]}';

  const foodList = foods.map((f) => f.name).join(", ");
  const userMessage = `Diet plan: ${dietPlan}\nFoods logged: ${foodList}\n\nIs this meal compliant?`;

  try {
    const raw = await callClaude(systemPrompt, userMessage);
    const parsed = JSON.parse(raw);
    return {
      compliant: Boolean(parsed.compliant),
      violations: Array.isArray(parsed.violations) ? parsed.violations : [],
    };
  } catch {
    return { compliant: true, violations: [] }; // fail open
  }
}

// ---------------------------------------------------------------------------
// Water pacing calculation
// ---------------------------------------------------------------------------
function calculateWaterPacing(
  dailyTotal: number,
  waterTask: ChallengeTask | undefined
): { on_pace: boolean; remaining_oz: number; pace_per_hour: number; message: string } {
  const targetOz = typeof waterTask?.config?.["target_oz"] === "number"
    ? waterTask.config["target_oz"] as number
    : 128; // 1 gallon default

  const remaining = Math.max(0, targetOz - dailyTotal);
  const now = new Date();
  const hoursLeft = Math.max(0.5, 24 - (now.getHours() + now.getMinutes() / 60));
  const pacePerHour = Math.ceil(remaining / hoursLeft);
  const onPace = pacePerHour <= 16; // 16 oz/hour or less is sustainable

  let message: string;
  if (remaining <= 0) {
    message = `Water goal complete! ${dailyTotal} oz logged.`;
  } else if (onPace) {
    message = `On pace ✓ — ${remaining} oz remaining, ${pacePerHour} oz/hour needed.`;
  } else {
    message = `Behind pace — need ${pacePerHour} oz/hour for the next ${Math.floor(hoursLeft)}h to hit ${targetOz} oz.`;
  }

  return { on_pace: onPace, remaining_oz: remaining, pace_per_hour: pacePerHour, message };
}

// ---------------------------------------------------------------------------
// Build task_status from today's log + challenge tasks
// ---------------------------------------------------------------------------
function buildTaskStatus(
  tasks: ChallengeTask[],
  todayLog: DailyLog | null
): Record<string, TaskStatus> {
  const status: Record<string, TaskStatus> = {};
  for (const task of tasks) {
    const completed = todayLog ? Boolean(todayLog.tasks_completed[task.id]) : false;
    status[task.id] = {
      completed,
      progress: completed ? 1 : 0,
      target: 1,
    };
  }
  return status;
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Auth
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { enrollment_id, action_type, action_data } = body as {
      enrollment_id: string;
      action_type: ActionType;
      action_data: ActionData;
    };

    if (!enrollment_id || !action_type) {
      return new Response(
        JSON.stringify({ error: "enrollment_id and action_type are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Admin client for DB reads
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Load enrollment + challenge definition
    const { data: enrollment, error: enrollError } = await supabaseAdmin
      .from("challenge_enrollments")
      .select(`
        id,
        user_id,
        current_day,
        restart_count,
        configuration,
        challenge_definitions (
          id,
          name,
          slug,
          duration_days,
          rules,
          restart_on_failure
        )
      `)
      .eq("id", enrollment_id)
      .eq("user_id", user.id)
      .single();

    if (enrollError || !enrollment) {
      return new Response(
        JSON.stringify({ error: "Enrollment not found or access denied" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const typedEnrollment = enrollment as unknown as Enrollment;
    const challenge = typedEnrollment.challenge_definitions;
    const rules: ChallengeRules = challenge.rules ?? { tasks: [] };
    const tasks: ChallengeTask[] = rules.tasks ?? [];
    const config = typedEnrollment.configuration ?? {};
    const slug = challenge.slug;

    // Load today's daily log
    const todayDate = new Date().toISOString().split("T")[0];
    const { data: dailyLogData } = await supabaseAdmin
      .from("challenge_daily_logs")
      .select("tasks_completed, all_tasks_completed")
      .eq("enrollment_id", enrollment_id)
      .eq("date", todayDate)
      .maybeSingle();

    const todayLog = dailyLogData as DailyLog | null;
    const taskStatus = buildTaskStatus(tasks, todayLog);

    // Route to appropriate compliance logic
    let compliant = true;
    const violations: string[] = [];
    const warnings: string[] = [];
    let recommendation = "";

    switch (action_type) {
      case "meal_logged": {
        const mealData = action_data as MealData;
        const foods = mealData.foods ?? [];
        const mealTime = mealData.meal_time ?? new Date().toISOString();

        if (slug === "whole30" || rules.elimination_list) {
          const result = checkWhole30Compliance(foods, rules.elimination_list ?? []);
          if (!result.compliant) {
            compliant = false;
            violations.push(...result.violations);
            recommendation = "Log this item and plan a compliant replacement for your next meal.";
          } else {
            recommendation = "Whole30 compliant — keep it up!";
          }
        } else if (slug === "intermittent-fasting" || rules.fasting_protocol) {
          const protocol = rules.fasting_protocol ?? (config["fasting_protocol"] as string) ?? "16:8";
          const result = checkFastingWindow(mealTime, protocol, config);
          if (!result.compliant) {
            compliant = false;
            violations.push(...result.violations);
            recommendation = "Wait until your eating window opens, or adjust your window start time in settings.";
          } else {
            recommendation = "Within your eating window ✓";
          }
        } else if (slug === "75-hard" || slug === "75hard") {
          const dietPlan = (config["diet_plan"] as string) ?? "clean eating";
          const result = await check75HardDietCompliance(foods, dietPlan);
          if (!result.compliant) {
            compliant = false;
            violations.push(...result.violations);
            recommendation = "This meal may not align with your chosen diet. Log it honestly and stay strict tomorrow.";
          } else {
            recommendation = `Compliant with your ${dietPlan} plan ✓`;
          }
        } else {
          recommendation = "No active diet restrictions for this challenge.";
        }
        break;
      }

      case "workout_logged": {
        const workoutData = action_data as WorkoutData;

        if (slug === "75-hard" || slug === "75hard") {
          // Load today's workout sessions to check gap
          const { data: sessions } = await supabaseAdmin
            .from("workout_sessions")
            .select("id, started_at, completed_at, duration_minutes")
            .eq("user_id", user.id)
            .gte("started_at", `${todayDate}T00:00:00`)
            .order("started_at", { ascending: true });

          const todaySessions = sessions ?? [];

          if (todaySessions.length >= 2) {
            // Check gap between first and second workout
            const first = new Date(todaySessions[0].started_at);
            const second = new Date(workoutData.started_at);
            const gapHours = (second.getTime() - first.getTime()) / (1000 * 60 * 60);

            if (gapHours < 3) {
              compliant = false;
              violations.push(
                `Only ${gapHours.toFixed(1)} hours between workouts. 75 Hard requires a 3-hour minimum gap.`
              );
              recommendation = "Schedule your second workout at least 3 hours after the first.";
            } else {
              recommendation = `Both workouts complete with ${gapHours.toFixed(1)}h gap ✓`;
            }
          } else {
            recommendation = "Workout 1 of 2 logged ✓";
          }

          // Check outdoor requirement for second workout
          const outdoorTask = tasks.find((t) => t.type === "workout" && t.config["is_outdoor"] === true);
          if (outdoorTask && !workoutData.is_outdoor) {
            warnings.push("75 Hard requires one workout to be completed outdoors.");
          }
        } else {
          recommendation = "Workout logged ✓";
        }
        break;
      }

      case "water_logged": {
        const waterData = action_data as WaterData;
        const waterTask = tasks.find((t) => t.type === "water");

        if (waterTask) {
          const pacing = calculateWaterPacing(waterData.daily_total, waterTask);
          if (!pacing.on_pace && pacing.remaining_oz > 0) {
            warnings.push(pacing.message);
          }
          recommendation = pacing.message;

          // Update task_status with actual progress
          const targetOz = typeof waterTask.config["target_oz"] === "number"
            ? waterTask.config["target_oz"] as number
            : 128;
          taskStatus[waterTask.id] = {
            completed: waterData.daily_total >= targetOz,
            progress: waterData.daily_total,
            target: targetOz,
          };
        } else {
          recommendation = `${waterData.daily_total} oz logged today.`;
        }
        break;
      }

      case "food_searched": {
        const foodData = action_data as FoodSearchData;
        const foodName = foodData.food_name ?? "";

        if (slug === "whole30" || rules.elimination_list) {
          const singleFood: FoodItem = { name: foodName };
          const result = checkWhole30Compliance([singleFood], rules.elimination_list ?? []);
          if (!result.compliant) {
            compliant = false;
            violations.push(...result.violations);
            recommendation = "This item is not Whole30 compliant. Look for a compliant alternative.";
          } else {
            recommendation = "Appears Whole30 compliant ✓ (verify ingredients before logging)";
          }
        } else {
          recommendation = "No active food restrictions for this challenge.";
        }
        break;
      }

      case "manual_check": {
        // Full status check: return current state of all tasks
        const incompleteTasks = tasks.filter((t) => !taskStatus[t.id]?.completed);
        const completedCount = tasks.length - incompleteTasks.length;

        if (completedCount === tasks.length) {
          recommendation = `All ${tasks.length} tasks complete today!`;
        } else {
          const incompleteLabels = incompleteTasks.map((t) => t.label).join(", ");
          recommendation = `${completedCount}/${tasks.length} tasks done. Still needed: ${incompleteLabels}.`;

          const now = new Date();
          if (now.getHours() >= 20 && incompleteTasks.length > 0) {
            warnings.push(`It's after 8 PM — you have ${incompleteTasks.length} task(s) remaining.`);
          }
        }
        break;
      }

      default:
        recommendation = "Compliance check complete.";
    }

    const response: ComplianceResponse = {
      compliant,
      violations,
      warnings,
      task_status: taskStatus,
      recommendation,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
