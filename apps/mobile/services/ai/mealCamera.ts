import { supabase } from '@services/supabase';
import type { AIMealAnalysis } from '@app-types/ai';
import * as FileSystem from 'expo-file-system';

export async function analyzeMealPhoto(
  photoUri: string,
  userId: string,
): Promise<AIMealAnalysis> {
  // Convert photo to base64
  const base64 = await FileSystem.readAsStringAsync(photoUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const { data, error } = await supabase.functions.invoke('ai-meal-analysis', {
    body: {
      userId,
      image: base64,
      mimeType: 'image/jpeg',
    },
  });

  if (error) throw error;
  return data as AIMealAnalysis;
}

export async function analyzeMenuPhoto(
  photoUri: string,
  userId: string,
  restaurantName?: string,
): Promise<AIMealAnalysis> {
  const base64 = await FileSystem.readAsStringAsync(photoUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const { data, error } = await supabase.functions.invoke('ai-menu-scan', {
    body: {
      userId,
      image: base64,
      mimeType: 'image/jpeg',
      restaurantName,
    },
  });

  if (error) throw error;
  return data as AIMealAnalysis;
}
