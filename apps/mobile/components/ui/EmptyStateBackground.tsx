// =============================================================================
// TRANSFORMR — Empty State Background
// Renders a faint themed photo behind empty state content with dark gradient overlay.
// Photo is fetched from Pexels once and cached.
// =============================================================================

import { useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { Image as ExpoImage, type ImageProps } from 'expo-image';
import { LinearGradient as LG, type LinearGradientProps } from 'expo-linear-gradient';

const Image = ExpoImage as unknown as ComponentType<ImageProps>;
const LinearGradient = LG as unknown as ComponentType<LinearGradientProps>;

const PEXELS_API = 'https://api.pexels.com/v1/search';
const PEXELS_KEY = process.env['EXPO_PUBLIC_PEXELS_API_KEY'] ?? '';

// In-memory cache so the same theme reuses the same photo across screens
const photoCache = new Map<string, string>();

interface Props {
  /** Pexels search query — e.g. "gym dark moody", "healthy food dark" */
  query: string;
  /** Background photo opacity 0-1. Default 0.15. Use 0.10 for nutrition, 0.15 for fitness, 0.18 for goals/profile */
  opacity?: number;
  /** Render children on top */
  children?: ReactNode;
  /** Override gradient colors (default = brand dark stack) */
  gradientColors?: readonly [string, string, ...string[]];
}

export function EmptyStateBackground({
  query,
  opacity = 0.15,
  children,
  gradientColors,
}: Props) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(photoCache.get(query) ?? null);

  useEffect(() => {
    if (photoCache.has(query)) {
      setPhotoUrl(photoCache.get(query) ?? null);
      return;
    }
    if (!PEXELS_KEY) return;

    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(
          `${PEXELS_API}?query=${encodeURIComponent(query)}&per_page=15&orientation=portrait`,
          { headers: { Authorization: PEXELS_KEY } },
        );
        if (!res.ok) return;
        const data = (await res.json()) as {
          photos?: Array<{ src?: { large2x?: string; large?: string } }>;
        };
        if (cancelled) return;
        // Pick a random photo from the top 15 to vary across users
        const photos = data.photos ?? [];
        if (photos.length === 0) return;
        const pick = photos[Math.floor(Math.random() * Math.min(photos.length, 15))];
        const url = pick?.src?.large2x ?? pick?.src?.large ?? null;
        if (url) {
          photoCache.set(query, url);
          setPhotoUrl(url);
        }
      } catch {
        // Silent fail — empty state still renders without background
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [query]);

  const overlay = gradientColors ?? ([
    'rgba(12, 10, 21, 0.5)',
    'rgba(12, 10, 21, 0.85)',
    'rgba(12, 10, 21, 0.95)',
  ] as const);

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
      {photoUrl ? (
        <Image
          source={{ uri: photoUrl }}
          style={[StyleSheet.absoluteFillObject, { opacity }]}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
      ) : null}
      <LinearGradient
        colors={overlay}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
      {children ? <View style={{ flex: 1 }}>{children}</View> : null}
    </View>
  );
}
