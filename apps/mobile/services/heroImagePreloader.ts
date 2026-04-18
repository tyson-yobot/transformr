// =============================================================================
// TRANSFORMR -- Hero Image Preloader
// Warms expo-image's memory-disk cache with local hero assets so HeroCard
// renders instantly without a loading flash on first mount.
// Image.loadAsync accepts number (local require) and resolves asynchronously;
// we fire-and-forget so it never blocks the UI thread.
// =============================================================================

import { Image } from 'expo-image';

// Metro bundler requires static asset paths at build time — ES import() is
// not supported for local image assets in Expo/React Native.
/* eslint-disable @typescript-eslint/no-var-requires */
const HERO_IMAGES = {
  fitness:   require('../assets/images/hero-fitness.jpg') as number,
  nutrition: require('../assets/images/hero-nutrition.jpg') as number,
  goals:     require('../assets/images/hero-goals.jpg') as number,
  business:  require('../assets/images/hero-business.jpg') as number,
};
/* eslint-enable @typescript-eslint/no-var-requires */

export function preloadHeroImages(): void {
  Object.values(HERO_IMAGES).forEach((src) => {
    Image.loadAsync(src).catch(() => {
      // preload failed — HeroCard will fall back to blurhash on first render
    });
  });
}

export { HERO_IMAGES };
