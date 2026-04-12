import { supabase } from '@services/supabase';

interface JournalContext {
  userId: string;
  todayHighlights: {
    workoutCompleted: boolean;
    caloriesMet: boolean;
    habitsCompleted: number;
    habitTotal: number;
    moodAvg: number | null;
    prsAchieved: string[];
  };
  recentEntryThemes: string[];
}

interface JournalPrompt {
  prompt: string;
  followUpQuestions: string[];
}

interface JournalResponse {
  reflection: string;
  patternsDetected: {
    pattern: string;
    insight: string;
    suggestion: string;
  }[];
  encouragement: string;
}

export async function getJournalPrompt(
  context: JournalContext,
): Promise<JournalPrompt> {
  const { data, error } = await supabase.functions.invoke('ai-journal-prompt', {
    body: { ...context, type: 'prompt' },
  });

  if (error) throw error;
  return data as JournalPrompt;
}

export async function getJournalResponse(
  userId: string,
  entryText: string,
  wins: string[],
  struggles: string[],
  gratitude: string[],
): Promise<JournalResponse> {
  const { data, error } = await supabase.functions.invoke('ai-journal-prompt', {
    body: {
      userId,
      type: 'response',
      entryText,
      wins,
      struggles,
      gratitude,
    },
  });

  if (error) throw error;
  return data as JournalResponse;
}
