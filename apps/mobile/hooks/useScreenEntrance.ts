// =============================================================================
// TRANSFORMR -- useScreenEntrance
// Screen-level entrance choreography hook (Reanimated 3)
// =============================================================================

import { useRef, useEffect, useCallback } from 'react';
import {
  makeMutable,
  useAnimatedStyle,
  withTiming,
  cancelAnimation,
  useReducedMotion,
  Easing,
} from 'react-native-reanimated';
import { useFocusEffect } from 'expo-router';
import { InteractionManager } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UseScreenEntranceOptions {
  sections: string[];
  staggerMs?: number;
  duration?: number;
  fromY?: number;
}

interface UseScreenEntranceReturn {
  getEntranceStyle: (section: string) => ReturnType<typeof useAnimatedStyle>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useScreenEntrance({
  sections,
  staggerMs = 65,
  duration = 380,
  fromY = 18,
}: UseScreenEntranceOptions): UseScreenEntranceReturn {
  const reducedMotion = useReducedMotion();

  // -------------------------------------------------------------------------
  // Shared values — created once via makeMutable (safe outside hook call tree)
  // -------------------------------------------------------------------------
  const opacityValues = useRef<SharedValue<number>[]>(
    sections.map(() => makeMutable(0)),
  ).current;

  const translateYValues = useRef<SharedValue<number>[]>(
    sections.map(() => makeMutable(fromY)),
  ).current;

  // -------------------------------------------------------------------------
  // DEV-mode invariant: sections.length must never change between renders.
  // If it does, the hook-in-loop pattern above will produce mismatched styles.
  // -------------------------------------------------------------------------
  const prevSectionsLen = useRef(sections.length);
  useEffect(() => {
    if (__DEV__ && prevSectionsLen.current !== sections.length) {
      throw new Error(
        `useScreenEntrance: sections.length changed from ${prevSectionsLen.current} to ${sections.length}. Pass a stable array literal.`,
      );
    }
    prevSectionsLen.current = sections.length;
  });

  // -------------------------------------------------------------------------
  // Animated styles — one per section, called at hook top-level in a loop.
  // sections is a stable array literal from the call site; its length never
  // changes between renders, so this loop is structurally equivalent to
  // calling useAnimatedStyle N times at the top level.
  // -------------------------------------------------------------------------

  // Section counts used by callers:
  //   dashboard  → 5 sections
  //   fitness    → 4 sections
  //   nutrition  → 4 sections
  // We create exactly as many animated styles as sections.length.
  /* eslint-disable react-hooks/rules-of-hooks */
  const entranceStyles = sections.map((_, idx) =>
    useAnimatedStyle(() => ({
      opacity: opacityValues[idx]!.value,
      transform: [{ translateY: translateYValues[idx]!.value }],
    })),
  );
  /* eslint-enable react-hooks/rules-of-hooks */

  // -------------------------------------------------------------------------
  // Reduced-motion fast path — set all values to final state immediately
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (reducedMotion) {
      sections.forEach((_, idx) => {
        opacityValues[idx]!.value = 1;
        translateYValues[idx]!.value = 0;
      });
    }
    // Only run when reducedMotion changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion]);

  // -------------------------------------------------------------------------
  // Timeout handle refs for cleanup
  // -------------------------------------------------------------------------
  const timeoutIds = useRef<ReturnType<typeof setTimeout>[]>([]);
  const interactionRef = useRef<ReturnType<typeof InteractionManager.runAfterInteractions> | null>(null);

  // -------------------------------------------------------------------------
  // useFocusEffect — stagger in on focus, instant reset on blur
  // -------------------------------------------------------------------------
  useFocusEffect(
    useCallback(() => {
      if (reducedMotion) return;

      // Run after all pending interactions (navigation transitions) settle
      interactionRef.current = InteractionManager.runAfterInteractions(() => {
        sections.forEach((_, idx) => {
          const id = setTimeout(() => {
            opacityValues[idx]!.value = withTiming(1, {
              duration,
              easing: Easing.out(Easing.cubic),
            });
            translateYValues[idx]!.value = withTiming(0, {
              duration,
              easing: Easing.out(Easing.cubic),
            });
          }, idx * staggerMs);
          timeoutIds.current.push(id);
        });
      });

      // Cleanup on blur: cancel animations, clear timeouts, instant reset
      return () => {
        // Clear pending interaction handle
        interactionRef.current?.cancel();
        interactionRef.current = null;

        // Clear all pending timeouts
        timeoutIds.current.forEach((id) => clearTimeout(id));
        timeoutIds.current = [];

        // Cancel in-flight animations and reset to hidden state
        sections.forEach((_, idx) => {
          cancelAnimation(opacityValues[idx]!);
          cancelAnimation(translateYValues[idx]!);
          opacityValues[idx]!.value = 0;
          translateYValues[idx]!.value = fromY;
        });
      };
      // sections, staggerMs, duration, fromY are stable (constant arrays/numbers)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reducedMotion]),
  );

  // -------------------------------------------------------------------------
  // Unmount cleanup — cancel all animations
  // -------------------------------------------------------------------------
  useEffect(() => {
    return () => {
      interactionRef.current?.cancel();
      timeoutIds.current.forEach((id) => clearTimeout(id));
      sections.forEach((_, idx) => {
        cancelAnimation(opacityValues[idx]!);
        cancelAnimation(translateYValues[idx]!);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------------------------------------------------------
  // Fallback animated style — fully visible, used when section name not found
  // -------------------------------------------------------------------------
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const fallbackStyle = useAnimatedStyle(() => ({
    opacity: 1,
    transform: [{ translateY: 0 }],
  }));

  // -------------------------------------------------------------------------
  // getEntranceStyle — returns pre-created animated style for a section name
  // -------------------------------------------------------------------------
  const getEntranceStyle = useCallback(
    (section: string): ReturnType<typeof useAnimatedStyle> => {
      const idx = sections.indexOf(section);
      if (idx === -1 || entranceStyles[idx] === undefined) {
        return fallbackStyle;
      }
      return entranceStyles[idx] as ReturnType<typeof useAnimatedStyle>;
    },
    [sections, entranceStyles, fallbackStyle],
  );

  return { getEntranceStyle };
}
