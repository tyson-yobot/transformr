import { supabase } from './supabase';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

interface SocialContentInput {
  userId: string;
  type: 'transformation' | 'weekly_recap' | 'pr_celebration' | 'milestone' | 'time_lapse' | 'custom';
  data: Record<string, unknown>;
}

interface GeneratedContent {
  imageUrl: string | null;
  videoUrl: string | null;
  caption: string;
  hashtags: string[];
}

export async function generateSocialContent(
  input: SocialContentInput,
): Promise<GeneratedContent> {
  const { data, error } = await supabase.functions.invoke('social-content-gen', {
    body: input,
  });

  if (error) throw error;
  return data as GeneratedContent;
}

export async function shareContent(
  contentUrl: string,
  caption: string,
): Promise<boolean> {
  try {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) return false;

    // Download content to local file for sharing
    const localUri = `${FileSystem.cacheDirectory}share_${Date.now()}.jpg`;
    await FileSystem.downloadAsync(contentUrl, localUri);

    await Sharing.shareAsync(localUri, {
      dialogTitle: caption,
      mimeType: 'image/jpeg',
    });

    return true;
  } catch {
    return false;
  }
}

export function generatePRCaption(
  exerciseName: string,
  recordType: string,
  value: number,
  previousRecord: number | null,
): string {
  const improvement = previousRecord ? ` (up from ${previousRecord})` : '';
  const typeLabel: Record<string, string> = {
    max_weight: `${value} lbs`,
    max_reps: `${value} reps`,
    max_volume: `${value} lbs volume`,
    max_1rm: `${value} lbs est. 1RM`,
  };

  return `NEW PR! 🏆 ${exerciseName}: ${typeLabel[recordType] ?? value}${improvement}\n\n#TRANSFORMR #PersonalRecord #GymLife`;
}

export function generateTransformationCaption(
  startWeight: number,
  currentWeight: number,
  daysIn: number,
): string {
  const change = Math.abs(currentWeight - startWeight);
  const direction = currentWeight > startWeight ? 'gained' : 'lost';
  return `${daysIn} days in. ${change.toFixed(1)} lbs ${direction}. The transformation continues. 💪\n\n#TRANSFORMR #Transformation #Progress`;
}

export function generateWeeklyCaption(
  workouts: number,
  streak: number,
  grade: string,
): string {
  return `Week in review: ${workouts} workouts, ${streak}-day streak, ${grade} overall grade. Consistency is everything. 🔥\n\n#TRANSFORMR #WeeklyReview #Consistency`;
}
