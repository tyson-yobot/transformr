import { supabase } from '@services/supabase';
import { buildUserAIContext } from './context';
import type { UserAIContext } from './context';
import type { AIFormCheckResult } from '@app-types/ai';
import * as FileSystem from 'expo-file-system';

export async function analyzeExerciseForm(
  videoUri: string,
  userId: string,
  exerciseName: string,
): Promise<AIFormCheckResult> {
  // Convert video to base64
  const base64 = await FileSystem.readAsStringAsync(videoUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const userContext: UserAIContext | null = await buildUserAIContext(userId).catch(() => null);

  const { data, error } = await supabase.functions.invoke('ai-form-check', {
    body: {
      userId,
      video: base64,
      mimeType: 'video/mp4',
      exerciseName,
      userContext,
    },
  });

  if (error) throw error;
  return data as AIFormCheckResult;
}

export async function uploadFormCheckVideo(
  videoUri: string,
  userId: string,
  sessionId: string,
): Promise<string> {
  const fileName = `${userId}/${sessionId}/${Date.now()}.mp4`;
  const fileContent = await FileSystem.readAsStringAsync(videoUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const { error } = await supabase.storage
    .from('form-check-videos')
    .upload(fileName, decode(fileContent), {
      contentType: 'video/mp4',
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from('form-check-videos')
    .getPublicUrl(fileName);

  return urlData.publicUrl;
}

function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
