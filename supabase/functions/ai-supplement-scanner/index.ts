// =============================================================================
// TRANSFORMR -- AI Supplement Bottle Scanner Edge Function
// Analyzes supplement label images using Claude Vision to extract and assess
// ingredients, evidence quality, interactions, and overall product quality.
// =============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { COMPLIANCE_PREAMBLE } from '../_shared/compliance.ts';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
const AI_MODEL = 'claude-sonnet-4-20250514';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface KeyIngredient {
  name: string;
  amount: string;
  purpose: string;
  evidence: 'strong' | 'moderate' | 'weak' | 'unclear';
  notes: string;
}

interface SupplementScanResult {
  product_name: string;
  serving_size: string;
  key_ingredients: KeyIngredient[];
  ingredients_of_concern: string[];
  overall_assessment: string;
  interactions: string[];
  compliance_note: string;
}

interface RequestBody {
  image_base64: string;
  user_query?: string;
  save_to_stack?: boolean;
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      },
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = (await req.json()) as RequestBody;
    const { image_base64, user_query, save_to_stack } = body;

    if (!image_base64) {
      return new Response(
        JSON.stringify({ error: 'image_base64 is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const systemPrompt = `${COMPLIANCE_PREAMBLE}

You are a supplement ingredient analyzer. The user has photographed a supplement label. Extract and analyze every ingredient visible on the label.

For each ingredient provide:
- what it does for the body (wellness-focused, not medical claims)
- evidence quality (strong/moderate/weak/unclear) based on peer-reviewed research
- typical effective dose range
- any known interaction risks or sensitivities

ALWAYS respond with valid JSON matching this exact structure — no prose, no markdown fences:
{
  "product_name": "Product Name Here",
  "serving_size": "1 scoop (30g)",
  "key_ingredients": [
    {
      "name": "Ingredient Name",
      "amount": "5g",
      "purpose": "What it may support",
      "evidence": "strong",
      "notes": "Additional context about this ingredient"
    }
  ],
  "ingredients_of_concern": [
    "Sucralose - artificial sweetener, may cause GI sensitivity in some individuals"
  ],
  "overall_assessment": "Brief honest assessment of the product quality and value",
  "interactions": [
    "May interact with blood thinners — consult healthcare provider"
  ],
  "compliance_note": "These supplement suggestions are for informational purposes only and are not medical advice. Individual responses vary. Consult a healthcare provider before starting any new supplement."
}

If the image is not a supplement label, set product_name to "Not a supplement label" and explain in overall_assessment.`;

    type MessageContent =
      | { type: 'image'; source: { type: 'base64'; media_type: 'image/jpeg'; data: string } }
      | { type: 'text'; text: string };

    const contentParts: MessageContent[] = [
      {
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/jpeg',
          data: image_base64,
        },
      },
      {
        type: 'text',
        text: user_query
          ? `Please analyze this supplement label. Additional question from the user: ${user_query}`
          : 'Please analyze this supplement label and provide a complete ingredient breakdown.',
      },
    ];

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: AI_MODEL,
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: 'user', content: contentParts }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Claude Vision API error ${response.status}: ${errText}`);
    }

    const aiData = await response.json();
    const rawText: string = aiData.content?.[0]?.text ?? '{}';

    const fenceMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonText = fenceMatch ? fenceMatch[1].trim() : rawText.trim();

    let result: SupplementScanResult;
    try {
      result = JSON.parse(jsonText) as SupplementScanResult;
    } catch {
      result = {
        product_name: 'Unable to parse label',
        serving_size: 'Unknown',
        key_ingredients: [],
        ingredients_of_concern: [],
        overall_assessment: 'The label could not be read clearly. Please retake the photo with better lighting.',
        interactions: [],
        compliance_note: 'These supplement suggestions are for informational purposes only. Consult a healthcare provider before starting any new supplement.',
      };
    }

    // Optionally save to supplement_logs
    let savedLogId: string | null = null;
    if (save_to_stack && result.product_name !== 'Not a supplement label' && result.product_name !== 'Unable to parse label') {
      // First check if this supplement already exists in the supplements table
      const { data: existingSupp } = await supabase
        .from('supplements')
        .select('id')
        .ilike('name', result.product_name)
        .maybeSingle();

      let supplementId: string | null = null;

      if (existingSupp?.id) {
        supplementId = existingSupp.id as string;
      } else {
        // Insert a new supplement record
        const { data: newSupp } = await supabase
          .from('supplements')
          .insert({ name: result.product_name })
          .select('id')
          .single();
        supplementId = newSupp?.id ?? null;
      }

      if (supplementId) {
        const { data: logRow } = await supabase
          .from('supplement_logs')
          .insert({
            user_id: user.id,
            supplement_id: supplementId,
            taken_at: new Date().toISOString(),
          })
          .select('id')
          .single();
        savedLogId = logRow?.id ?? null;
      }
    }

    return new Response(
      JSON.stringify({ ...result, saved_log_id: savedLogId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
