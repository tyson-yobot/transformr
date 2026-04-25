// NOTE: No AI API calls — compliance preamble not required
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface GiftEligibility {
  gift_tier: string;
  gift_months: number;
}

const MILESTONE_GIFTS: Record<string, GiftEligibility> = {
  "30-day streak": { gift_tier: "pro", gift_months: 1 },
  "90-day streak": { gift_tier: "pro", gift_months: 2 },
  body_goal_hit: { gift_tier: "elite", gift_months: 1 },
  "365-day streak": { gift_tier: "pro", gift_months: 3 },
};

function generateGiftCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  const randomValues = new Uint8Array(8);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < 8; i++) {
    code += chars[randomValues[i] % chars.length];
  }
  return code;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { userId, milestoneType } = await req.json();

    if (!userId || !milestoneType) {
      return new Response(
        JSON.stringify({ error: "userId and milestoneType are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const eligibility = MILESTONE_GIFTS[milestoneType];
    if (!eligibility) {
      return new Response(
        JSON.stringify({ error: `Milestone type '${milestoneType}' is not eligible for a gift` }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const giftCode = generateGiftCode();

    const { data: gift, error: insertError } = await supabaseAdmin
      .from("milestone_gifts")
      .insert({
        user_id: userId,
        milestone_type: milestoneType,
        gift_code: giftCode,
        gift_tier: eligibility.gift_tier,
        gift_months: eligibility.gift_months,
      })
      .select("id, gift_code, gift_tier, gift_months")
      .single();

    if (insertError) {
      return new Response(
        JSON.stringify({ error: insertError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        gift: {
          id: gift.id,
          giftCode: gift.gift_code,
          giftTier: gift.gift_tier,
          giftMonths: gift.gift_months,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
