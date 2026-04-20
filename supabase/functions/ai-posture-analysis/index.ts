// =============================================================================
// TRANSFORMR -- AI Posture Analysis Edge Function
// Analyzes posture from front/side view images using Claude Vision, or
// performs a text-based assessment using the user's workout history.
// Saves results to posture_analysis_results table.
// =============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { COMPLIANCE_PREAMBLE } from '../_shared/compliance.ts';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
const AI_MODEL_VISION = 'claude-sonnet-4-20250514';
const AI_MODEL_TEXT = 'claude-sonnet-4-20250514';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PostureView {
  head_alignment: string;
  shoulder_alignment: string;
  hip_alignment: string;
}

interface SideView {
  cervical_curve: string;
  lumbar_curve: string;
  pelvic_tilt: string;
}

interface ExercisePrescribed {
  name: string;
  sets: number;
  reps: number;
  frequency: string;
  video_cue: string;
}

interface PostureAnalysisResult {
  overall_score: number;
  front_view: PostureView | null;
  side_view: SideView | null;
  issues: string[];
  recommendations: string[];
  exercises_prescribed: ExercisePrescribed[];
  improvement_timeline: string;
}

interface RequestBody {
  image_base64?: string;
  side_image_base64?: string;
  view_type: 'front' | 'side' | 'both';
  previous_analysis_id?: string | null;
}

interface WorkoutRow {
  started_at: string;
  exercises: string | null;
  notes: string | null;
}

// ---------------------------------------------------------------------------
// Text-based posture assessment from workout history
// ---------------------------------------------------------------------------

async function textBasedPostureAssessment(
  supabase: ReturnType<typeof createClient>,
  userId: string,
): Promise<PostureAnalysisResult> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();

  const { data: workouts } = await supabase
    .from('workout_sessions')
    .select('started_at, exercises, notes')
    .eq('user_id', userId)
    .gte('started_at', thirtyDaysAgo)
    .order('started_at', { ascending: false })
    .limit(20);

  const { data: profile } = await supabase
    .from('profiles')
    .select('occupation, activity_level, display_name')
    .eq('id', userId)
    .maybeSingle();

  const workoutSummary = (workouts as WorkoutRow[] | null)?.map((w) => ({
    date: w.started_at,
    exercises: w.exercises ?? 'not recorded',
    notes: w.notes ?? '',
  })) ?? [];

  const systemPrompt = `${COMPLIANCE_PREAMBLE}

You are a posture assessment specialist. Based on the user's workout history and profile, provide a text-based posture assessment. Focus on common imbalances associated with their training patterns and lifestyle.

ALWAYS respond with valid JSON matching this exact structure — no prose, no markdown fences:
{
  "overall_score": 65,
  "front_view": {
    "head_alignment": "likely forward due to sedentary work",
    "shoulder_alignment": "possible right dominance from training",
    "hip_alignment": "level"
  },
  "side_view": {
    "cervical_curve": "increased forward curve likely",
    "lumbar_curve": "normal to slightly increased",
    "pelvic_tilt": "mild anterior tilt"
  },
  "issues": ["Forward head posture risk", "Anterior pelvic tilt pattern"],
  "recommendations": ["Chin tucks 3x15 daily", "Hip flexor stretches"],
  "exercises_prescribed": [
    {
      "name": "Chin Tucks",
      "sets": 3,
      "reps": 15,
      "frequency": "daily",
      "video_cue": "Pull chin back, create a double chin"
    }
  ],
  "improvement_timeline": "4-6 weeks with consistent practice"
}`;

  const userMessage = `Profile: ${JSON.stringify(profile ?? {})}
Recent workouts (last 30 days): ${JSON.stringify(workoutSummary)}

Based on this training history and profile, assess likely posture patterns and prescribe corrective exercises.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: AI_MODEL_TEXT,
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Claude API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const rawText: string = data.content?.[0]?.text ?? '{}';

  const fenceMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonText = fenceMatch ? fenceMatch[1].trim() : rawText.trim();

  try {
    return JSON.parse(jsonText) as PostureAnalysisResult;
  } catch {
    return {
      overall_score: 60,
      front_view: null,
      side_view: null,
      issues: ['Unable to determine — image analysis recommended'],
      recommendations: ['Take a posture photo for a more accurate assessment'],
      exercises_prescribed: [],
      improvement_timeline: 'Unknown without image analysis',
    };
  }
}

// ---------------------------------------------------------------------------
// Vision-based posture analysis
// ---------------------------------------------------------------------------

async function visionBasedPostureAnalysis(
  imageBase64: string,
  sideImageBase64: string | null,
  viewType: 'front' | 'side' | 'both',
): Promise<PostureAnalysisResult> {
  const systemPrompt = `${COMPLIANCE_PREAMBLE}

You are an expert posture analyst. Analyze the provided posture image(s) carefully. Identify alignment issues, muscular imbalances, and postural deviations. Provide specific corrective exercises.

ALWAYS respond with valid JSON matching this exact structure — no prose, no markdown fences:
{
  "overall_score": 72,
  "front_view": {
    "head_alignment": "slight_forward",
    "shoulder_alignment": "left_higher",
    "hip_alignment": "level"
  },
  "side_view": {
    "cervical_curve": "increased",
    "lumbar_curve": "normal",
    "pelvic_tilt": "anterior"
  },
  "issues": ["Forward head posture", "Left shoulder elevation", "Anterior pelvic tilt"],
  "recommendations": ["Chin tucks 3x15 daily", "Wall angels 2x10", "Hip flexor stretches"],
  "exercises_prescribed": [
    {
      "name": "Chin Tucks",
      "sets": 3,
      "reps": 15,
      "frequency": "daily",
      "video_cue": "Pull chin back, make a double chin"
    },
    {
      "name": "Wall Angels",
      "sets": 2,
      "reps": 10,
      "frequency": "daily",
      "video_cue": "Stand against wall, slide arms up and overhead"
    }
  ],
  "improvement_timeline": "4-6 weeks with consistent practice"
}

If only a front view is provided, set side_view fields to "not assessed".
If only a side view is provided, set front_view fields to "not assessed".`;

  type MessageContent =
    | { type: 'image'; source: { type: 'base64'; media_type: 'image/jpeg'; data: string } }
    | { type: 'text'; text: string };

  const contentParts: MessageContent[] = [
    {
      type: 'image',
      source: {
        type: 'base64',
        media_type: 'image/jpeg',
        data: imageBase64,
      },
    },
    {
      type: 'text',
      text: viewType === 'front'
        ? 'This is the front view of my posture. Please analyze my alignment.'
        : viewType === 'side'
        ? 'This is the side view of my posture. Please analyze my alignment.'
        : 'This is the front view of my posture.',
    },
  ];

  if (sideImageBase64 && viewType === 'both') {
    contentParts.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: 'image/jpeg',
        data: sideImageBase64,
      },
    });
    contentParts.push({
      type: 'text',
      text: 'This is the side view. Please analyze both views together for a comprehensive posture assessment.',
    });
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: AI_MODEL_VISION,
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: contentParts }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Claude Vision API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const rawText: string = data.content?.[0]?.text ?? '{}';

  const fenceMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonText = fenceMatch ? fenceMatch[1].trim() : rawText.trim();

  try {
    return JSON.parse(jsonText) as PostureAnalysisResult;
  } catch {
    return {
      overall_score: 50,
      front_view: null,
      side_view: null,
      issues: ['Analysis could not be parsed — please try again'],
      recommendations: ['Ensure good lighting and full body visibility'],
      exercises_prescribed: [],
      improvement_timeline: 'N/A',
    };
  }
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
    const { image_base64, side_image_base64, view_type } = body;

    let result: PostureAnalysisResult;

    if (image_base64) {
      result = await visionBasedPostureAnalysis(
        image_base64,
        side_image_base64 ?? null,
        view_type,
      );
    } else {
      result = await textBasedPostureAssessment(supabase, user.id);
    }

    // Persist to database
    const followUpDate = new Date();
    followUpDate.setDate(followUpDate.getDate() + 42); // 6 weeks from now

    const { data: savedRow, error: saveError } = await supabase
      .from('posture_analysis_results')
      .insert({
        user_id: user.id,
        image_base64: image_base64 ?? null,
        front_view: result.front_view,
        side_view: result.side_view,
        overall_score: result.overall_score,
        issues: result.issues,
        recommendations: result.recommendations,
        exercises_prescribed: result.exercises_prescribed,
        follow_up_date: followUpDate.toISOString().split('T')[0],
      })
      .select('id')
      .single();

    if (saveError) {
      throw new Error(`Failed to save posture analysis: ${saveError.message}`);
    }

    return new Response(
      JSON.stringify({ ...result, id: savedRow.id }),
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
