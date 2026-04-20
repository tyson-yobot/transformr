// =============================================================================
// TRANSFORMR — AI Voice Command NLU
// Accepts an ambiguous voice transcript + active screen context.
// Returns a structured command with confidence score.
// =============================================================================
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

type ActiveScreen =
  | "workout_player"
  | "nutrition"
  | "habits"
  | "mood"
  | "journal"
  | "body"
  | "focus"
  | "general";

interface WorkoutContext {
  currentExercise?: string;
  lastSet?: { weight: number; reps: number };
}

interface NutritionContext {
  caloriesRemaining?: number;
  proteinRemaining?: number;
}

interface VoiceCommandRequest {
  transcript: string;
  activeScreen: ActiveScreen;
  workoutContext?: WorkoutContext | null;
  nutritionContext?: NutritionContext | null;
}

interface ParsedVoiceCommand {
  command: Record<string, unknown>;
  confidence: number;
  humanReadable: string;
}

const COMMAND_SCHEMA = `
Available commands by domain:

FITNESS: log_set {weight, reps}, next_exercise, prev_exercise, start_rest_timer {seconds}, end_workout, swap_exercise {exerciseName}, check_ghost, check_pr

NUTRITION: log_food {foodName, quantity?}, log_water {oz}, log_supplement {supplementName}, check_macros, add_meal {mealType, foods}

BODY: log_weight {weight}, log_measurement {bodyPart, value, unit}

HABITS: complete_habit {habitName}, check_habit_streak {habitName?}

MOOD: log_mood {mood: 1-10}, log_journal_entry {text}

FOCUS: start_focus, end_focus, log_distraction {description}

GENERAL: check_readiness, check_streak, open_ai_chat

For unknown or unclear commands: { action: "unknown", rawText: <original> }
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      },
    );

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as VoiceCommandRequest;
    const { transcript, activeScreen, workoutContext, nutritionContext } = body;

    const contextDescription = buildContextDescription(
      activeScreen,
      workoutContext,
      nutritionContext,
    );

    const systemPrompt = `${COMPLIANCE_PREAMBLE}

You are a voice command parser for the TRANSFORMR fitness and wellness app.
Parse the user's voice transcript into a structured command.

${COMMAND_SCHEMA}

Current context: ${contextDescription}

Respond ONLY with valid JSON in this exact shape:
{
  "command": { "action": "...", ...params },
  "confidence": 0.0-1.0,
  "humanReadable": "plain English description of what will happen"
}

Rules:
- confidence 0.9+ = clear match
- confidence 0.7-0.89 = likely match
- confidence < 0.7 = use unknown action
- Extract numbers from words ("eighty five" → 85, "eight reps" → 8)
- Infer context from active screen (on workout_player, numbers likely refer to sets)`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: AI_MODEL,
        max_tokens: 256,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: `Parse this voice command: "${transcript}"`,
          },
        ],
      }),
    });

    const aiData = await response.json();
    const rawText = aiData.content?.[0]?.text ?? "{}";

    let parsed: ParsedVoiceCommand;
    try {
      parsed = JSON.parse(rawText) as ParsedVoiceCommand;
    } catch {
      parsed = {
        command: { action: "unknown", rawText: transcript },
        confidence: 0,
        humanReadable: "",
      };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function buildContextDescription(
  screen: ActiveScreen,
  workout?: WorkoutContext | null,
  nutrition?: NutritionContext | null,
): string {
  const parts: string[] = [`Active screen: ${screen}`];

  if (screen === "workout_player" && workout) {
    if (workout.currentExercise) {
      parts.push(`Current exercise: ${workout.currentExercise}`);
    }
    if (workout.lastSet) {
      parts.push(
        `Last set: ${workout.lastSet.weight} lbs × ${workout.lastSet.reps} reps`,
      );
    }
  }

  if (screen === "nutrition" && nutrition) {
    if (nutrition.caloriesRemaining !== undefined) {
      parts.push(`Calories remaining: ${nutrition.caloriesRemaining}`);
    }
    if (nutrition.proteinRemaining !== undefined) {
      parts.push(`Protein remaining: ${nutrition.proteinRemaining}g`);
    }
  }

  return parts.join(". ");
}
