import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const AI_MODEL = "claude-sonnet-4-20250514";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function callClaude(systemPrompt: string, userMessage: string) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: AI_MODEL,
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });
  const data = await response.json();
  return data.content[0].text;
}

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
      content_type,
      pr_data,
      weekly_recap,
      milestone,
      custom_context,
      platform,
    } = await req.json();

    const validTypes = ["pr_celebration", "weekly_recap", "milestone", "transformation", "custom"];
    if (!validTypes.includes(content_type)) {
      return new Response(
        JSON.stringify({ error: `Invalid content_type. Must be one of: ${validTypes.join(", ")}` }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const targetPlatform = platform || "instagram";

    const systemPrompt = `You are a social media content creator for fitness transformation journeys.
Generate engaging, authentic social media content. Never be cringe or overly salesy.
Target platform: ${targetPlatform}

Tone: Authentic, motivational, relatable. Mix vulnerability with confidence.

ALWAYS respond with valid JSON:
{
  "caption": "The main post caption with line breaks and hashtags",
  "short_caption": "A shorter version for stories or tweets",
  "hashtags": ["#transformation", "#fitness"],
  "call_to_action": "Engaging CTA for audience",
  "story_slides": [
    {"text": "Slide 1 text overlay", "background_suggestion": "dark gradient"},
    {"text": "Slide 2 text overlay", "background_suggestion": "progress photo"}
  ],
  "alt_versions": {
    "twitter": "280-char version",
    "linkedin": "Professional angle version"
  },
  "content_notes": "Tips for when/how to post for best engagement"
}`;

    let userMessage: string;
    switch (content_type) {
      case "pr_celebration":
        userMessage = `Generate a PR celebration post. PR data: ${JSON.stringify(pr_data || {})}`;
        break;
      case "weekly_recap":
        userMessage = `Generate a weekly recap post. Week data: ${JSON.stringify(weekly_recap || {})}`;
        break;
      case "milestone":
        userMessage = `Generate a milestone celebration post. Milestone: ${JSON.stringify(milestone || {})}`;
        break;
      case "transformation":
        userMessage = `Generate a transformation journey post. Context: ${JSON.stringify(custom_context || {})}`;
        break;
      default:
        userMessage = `Generate social content. Context: ${JSON.stringify(custom_context || {})}`;
    }

    const aiResponse = await callClaude(systemPrompt, userMessage);

    let parsed;
    try {
      parsed = JSON.parse(aiResponse);
    } catch {
      parsed = {
        caption: aiResponse,
        short_caption: "",
        hashtags: [],
        call_to_action: "",
        story_slides: [],
        alt_versions: {},
        content_notes: "",
      };
    }

    return new Response(
      JSON.stringify({ content_type, platform: targetPlatform, ...parsed }),
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
