// NOTE: No AI API calls — compliance preamble not required
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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
      }
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

    const {
      exercise_id,
      exercise_name,
      weight,
      reps,
      set_type,
    } = await req.json();

    if (!exercise_name || weight == null || reps == null) {
      return new Response(
        JSON.stringify({ error: "exercise_name, weight, and reps are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const userId = user.id;
    const detectedPRs: any[] = [];

    // Check 1RM PR (weight at 1 rep)
    // Estimate 1RM using Epley formula: weight * (1 + reps/30)
    const estimated1RM = weight * (1 + reps / 30);

    // Fetch existing PRs for this exercise
    const { data: existingPRs } = await supabaseClient
      .from("personal_records")
      .select("*")
      .eq("user_id", userId)
      .eq("exercise_name", exercise_name);

    const prTypes = [
      { type: "weight", value: weight, label: "Heaviest Weight" },
      { type: "reps", value: reps, label: "Most Reps" },
      { type: "estimated_1rm", value: Math.round(estimated1RM * 10) / 10, label: "Estimated 1RM" },
      { type: "volume", value: weight * reps, label: "Set Volume" },
    ];

    for (const prCheck of prTypes) {
      const existing = (existingPRs || []).find(
        (pr: any) => pr.pr_type === prCheck.type
      );

      const isNewPR = !existing || prCheck.value > existing.value;

      if (isNewPR) {
        const previousValue = existing?.value || null;

        // Upsert the PR
        const { error: upsertError } = await supabaseClient
          .from("personal_records")
          .upsert(
            {
              user_id: userId,
              exercise_id: exercise_id || null,
              exercise_name,
              pr_type: prCheck.type,
              value: prCheck.value,
              weight_used: weight,
              reps_performed: reps,
              set_type: set_type || "working",
              achieved_at: new Date().toISOString(),
            },
            { onConflict: "user_id,exercise_name,pr_type" }
          );

        if (!upsertError) {
          detectedPRs.push({
            type: prCheck.type,
            label: prCheck.label,
            new_value: prCheck.value,
            previous_value: previousValue,
            improvement: previousValue
              ? Math.round(((prCheck.value - previousValue) / previousValue) * 100 * 10) / 10
              : null,
            exercise_name,
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        prs_detected: detectedPRs.length > 0,
        prs: detectedPRs,
        exercise_name,
        set_logged: { weight, reps },
        estimated_1rm: Math.round(estimated1RM * 10) / 10,
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
