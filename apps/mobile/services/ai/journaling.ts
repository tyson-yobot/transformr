import { supabase } from '@services/supabase';
import { buildUserAIContext } from './context';
import type { UserAIContext } from './context';

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
  const userContext: UserAIContext | null = await buildUserAIContext(context.userId).catch(() => null);

  const { data, error } = await supabase.functions.invoke('ai-journal-prompt', {
    body: { ...context, type: 'prompt', userContext },
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
  const userContext: UserAIContext | null = await buildUserAIContext(userId).catch(() => null);

  const { data, error } = await supabase.functions.invoke('ai-journal-prompt', {
    body: {
      userId,
      type: 'response',
      entryText,
      wins,
      struggles,
      gratitude,
      userContext,
    },
  });

  if (error) throw error;
  return data as JournalResponse;
}
