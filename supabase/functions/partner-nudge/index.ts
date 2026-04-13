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

    const { partner_id, nudge_type, custom_message } = await req.json();

    if (!partner_id) {
      return new Response(
        JSON.stringify({ error: "partner_id is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify partnership exists
    const { data: partnership, error: partnerError } = await supabaseAdmin
      .from("accountability_partners")
      .select("*")
      .or(
        `and(user_id.eq.${user.id},partner_id.eq.${partner_id}),and(user_id.eq.${partner_id},partner_id.eq.${user.id})`
      )
      .eq("status", "active")
      .single();

    if (partnerError || !partnership) {
      return new Response(
        JSON.stringify({ error: "No active partnership found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check nudge rate limit (max 3 per day)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { count: todayNudges } = await supabaseAdmin
      .from("partner_nudges")
      .select("*", { count: "exact", head: true })
      .eq("sender_id", user.id)
      .eq("recipient_id", partner_id)
      .gte("sent_at", todayStart.toISOString());

    if ((todayNudges || 0) >= 3) {
      return new Response(
        JSON.stringify({ error: "Daily nudge limit reached (3 per day)" }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get sender's display name
    const { data: senderProfile } = await supabaseAdmin
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();

    const senderName = senderProfile?.display_name || "Your partner";

    // Nudge messages by type
    const nudgeMessages: Record<string, { title: string; body: string }> = {
      workout: {
        title: "Gym Nudge",
        body: `${senderName} wants you to hit the gym today! No excuses.`,
      },
      meal: {
        title: "Meal Reminder",
        body: `${senderName} is reminding you to log your meals. Stay on track!`,
      },
      checkin: {
        title: "Check-in Nudge",
        body: `${senderName} wants to know how you're doing. Complete your daily check-in!`,
      },
      motivation: {
        title: "You Got This!",
        body: `${senderName} believes in you. Keep pushing forward!`,
      },
      custom: {
        title: "Partner Message",
        body: custom_message || `${senderName} sent you a nudge!`,
      },
    };

    const message = nudgeMessages[nudge_type] || nudgeMessages.motivation;

    // Store nudge record
    const { error: nudgeError } = await supabaseAdmin
      .from("partner_nudges")
      .insert({
        sender_id: user.id,
        recipient_id: partner_id,
        nudge_type: nudge_type || "motivation",
        message: message.body,
        sent_at: new Date().toISOString(),
      });

    if (nudgeError) throw nudgeError;

    // Send notification to partner
    const { error: notifError } = await supabaseAdmin
      .from("notifications")
      .insert({
        user_id: partner_id,
        type: "partner_nudge",
        title: message.title,
        body: message.body,
        data: { sender_id: user.id, nudge_type },
        scheduled_for: new Date().toISOString(),
      });

    if (notifError) throw notifError;

    return new Response(
      JSON.stringify({
        success: true,
        nudge_type: nudge_type || "motivation",
        message: message.body,
        nudges_remaining_today: 3 - ((todayNudges || 0) + 1),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
