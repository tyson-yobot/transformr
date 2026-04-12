// =============================================================================
// TRANSFORMR -- Reorder Predictor (Cron)
// Daily job that checks each user's supplement inventory. For supplements with
// bottle_size and purchased_at set, calculates daily consumption rate from
// user_supplement_logs, estimates days until empty, and inserts proactive
// messages when a reorder is approaching or the bottle is depleted.
// =============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SupplementRow {
  id: string;
  user_id: string;
  name: string;
  bottle_size: number;
  purchased_at: string;
  reorder_reminder_sent: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Fetch all supplements that have inventory tracking enabled
    const { data: supplements, error: fetchErr } = await supabase
      .from("user_supplements")
      .select("id, user_id, name, bottle_size, purchased_at, reorder_reminder_sent")
      .eq("is_active", true)
      .not("bottle_size", "is", null)
      .not("purchased_at", "is", null);

    if (fetchErr) throw fetchErr;
    if (!supplements || supplements.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, reminders_sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let remindersSent = 0;
    const now = new Date();

    for (const sup of supplements as SupplementRow[]) {
      const purchasedAt = new Date(sup.purchased_at);
      const daysSincePurchase = Math.max(
        1,
        Math.ceil((now.getTime() - purchasedAt.getTime()) / (1000 * 60 * 60 * 24)),
      );

      // Count logs since purchase
      const { count, error: countErr } = await supabase
        .from("user_supplement_logs")
        .select("id", { count: "exact", head: true })
        .eq("supplement_id", sup.id)
        .gte("taken_at", sup.purchased_at);

      if (countErr) continue;

      const dosesTaken = count ?? 0;
      const dosesRemaining = Math.max(0, sup.bottle_size - dosesTaken);
      const dailyRate = dosesTaken / daysSincePurchase;

      if (dailyRate <= 0) continue;

      const daysUntilEmpty = Math.round(dosesRemaining / dailyRate);

      // Depleted — "You're out of X"
      if (daysUntilEmpty <= 0) {
        await supabase.from("proactive_messages").insert({
          user_id: sup.user_id,
          category: "reorder",
          title: `You're out of ${sup.name}`,
          body: `Based on your usage pattern (${dailyRate.toFixed(1)} doses/day), your bottle of ${sup.name} is now empty. Time to restock to keep your routine on track.`,
          severity: "warning",
          action_label: "Mark restocked",
          reference_id: sup.id,
          expires_at: new Date(now.getTime() + 7 * 24 * 3600 * 1000).toISOString(),
        });
        remindersSent++;
        continue;
      }

      // Approaching depletion — 5-7 days warning
      if (daysUntilEmpty <= 7 && !sup.reorder_reminder_sent) {
        const runOutDate = new Date(
          now.getTime() + daysUntilEmpty * 24 * 3600 * 1000,
        );
        const formattedDate = runOutDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });

        await supabase.from("proactive_messages").insert({
          user_id: sup.user_id,
          category: "reorder",
          title: `Reorder ${sup.name} soon`,
          body: `You have about ${daysUntilEmpty} days of ${sup.name} left (${dosesRemaining} doses at ${dailyRate.toFixed(1)}/day). Estimated run-out: ${formattedDate}. Order now to avoid a gap in your routine.`,
          severity: "info",
          action_label: "Order now",
          reference_id: sup.id,
          expires_at: runOutDate.toISOString(),
        });

        // Set the reminder flag so we don't spam
        await supabase
          .from("user_supplements")
          .update({ reorder_reminder_sent: true })
          .eq("id", sup.id);

        remindersSent++;
      }
    }

    return new Response(
      JSON.stringify({
        processed: supplements.length,
        reminders_sent: remindersSent,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
