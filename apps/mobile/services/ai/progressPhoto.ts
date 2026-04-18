import { supabase } from '@services/supabase';
import { buildUserAIContext } from './context';
import type { UserAIContext } from './context';
import type { AIProgressPhotoAnalysis } from '@app-types/ai';
import * as FileSystem from 'expo-file-system';

export async function analyzeProgressPhotos(
  photoUris: { front?: string; side?: string; back?: string },
  userId: string,
  previousAnalysis?: AIProgressPhotoAnalysis,
): Promise<AIProgressPhotoAnalysis> {
  const photos: Record<string, string> = {};

  for (const [key, uri] of Object.entries(photoUris)) {
    if (uri) {
      photos[key] = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
    }
  }

  const userContext: UserAIContext | null = await buildUserAIContext(userId).catch(() => null);

  const { data, error } = await supabase.functions.invoke('ai-progress-photo', {
    body: {
      userId,
      photos,
      previousAnalysis,
      userContext,
    },
  });

  if (error) throw error;
  return data as AIProgressPhotoAnalysis;
}

export async function uploadProgressPhoto(
  photoUri: string,
  userId: string,
  angle: 'front' | 'side' | 'back',
): Promise<string> {
  const fileName = `${userId}/${Date.now()}_${angle}.jpg`;
  const base64 = await FileSystem.readAsStringAsync(photoUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

  const { error } = await supabase.storage
    .from('progress-photos')
    .upload(fileName, bytes, {
      contentType: 'image/jpeg',
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from('progress-photos')
    .getPublicUrl(fileName);

  return urlData.publicUrl;
}
