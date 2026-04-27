// =============================================================================
// TRANSFORMR — Tab Hero Background
// Faint atmospheric photo behind the top 200px of tab screens.
// Fades into the dark surface below.
// =============================================================================

import { useEffect, useState, type ComponentType } from 'react';
import { View, StyleSheet } from 'react-native';
import { Image as ExpoImage, type ImageProps } from 'expo-image';
import { LinearGradient as LG, type LinearGradientProps } from 'expo-linear-gradient';

const Image = ExpoImage as unknown as ComponentType<ImageProps>;
const LinearGradient = LG as unknown as ComponentType<LinearGradientProps>;

const PEXELS_API = 'https://api.pexels.com/v1/search';
const PEXELS_KEY = process.env['EXPO_PUBLIC_PEXELS_API_KEY'] ?? '';

const heroCache = new Map<string, string>();

interface Props {
  query: string;
  height?: number; // default 240
  opacity?: number; // default 0.12
}

export function TabHeroBackground({ query, height = 240, opacity = 0.12 }: Props) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(heroCache.get(query) ?? null);

  useEffect(() => {
    if (heroCache.has(query)) {
      setPhotoUrl(heroCache.get(query) ?? null);
      return;
    }
    if (!PEXELS_KEY) return;

    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(
          `${PEXELS_API}?query=${encodeURIComponent(query)}&per_page=10&orientation=landscape`,
          { headers: { Authorization: PEXELS_KEY } },
        );
        if (!res.ok) return;
        const data = (await res.json()) as {
          photos?: Array<{ src?: { large2x?: string; large?: string } }>;
        };
        if (cancelled) return;
        const photos = data.photos ?? [];
        if (photos.length === 0) return;
        const pick = photos[Math.floor(Math.random() * Math.min(photos.length, 10))];
        const url = pick?.src?.large2x ?? pick?.src?.large ?? null;
        if (url) {
          heroCache.set(query, url);
          setPhotoUrl(url);
        }
      } catch {
        // Silent fail
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [query]);

  return (
    <View
      style={[StyleSheet.absoluteFillObject, { height, top: 0 }]}
      pointerEvents="none"
    >
      {photoUrl ? (
        <Image
          source={{ uri: photoUrl }}
          style={[StyleSheet.absoluteFillObject, { opacity }]}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
      ) : null}
      <LinearGradient
        colors={[
          'rgba(12, 10, 21, 0.4)',
          'rgba(12, 10, 21, 0.7)',
          'rgba(12, 10, 21, 1)',
        ]}
        style={StyleSheet.absoluteFillObject}
      />
    </View>
  );
}
