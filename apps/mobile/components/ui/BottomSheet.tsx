import React, { useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '@theme/index';

interface BottomSheetProps {
  visible: boolean;
  onDismiss: () => void;
  snapPoints?: number[]; // percentages of screen height, e.g. [0.25, 0.5, 0.9]
  initialSnap?: number; // index into snapPoints
  showHandle?: boolean;
  children: React.ReactNode;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SPRING_CONFIG = { damping: 25, stiffness: 250, mass: 0.8 };

export function BottomSheet({
  visible,
  onDismiss,
  snapPoints = [0.4, 0.75],
  initialSnap = 0,
  showHandle = true,
  children,
}: BottomSheetProps) {
  const { colors, borderRadius } = useTheme();

  const snapHeights = useMemo(
    () => snapPoints.map((p) => SCREEN_HEIGHT * p),
    [snapPoints],
  );

  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);
  const contextY = useSharedValue(0);
  const currentHeight = useSharedValue(snapHeights[initialSnap] ?? snapHeights[0] ?? SCREEN_HEIGHT * 0.4);

  const dismiss = useCallback(() => {
    onDismiss();
  }, [onDismiss]);

  useEffect(() => {
    if (visible) {
      const targetHeight = snapHeights[initialSnap] ?? snapHeights[0] ?? SCREEN_HEIGHT * 0.4;
      currentHeight.value = targetHeight;
      translateY.value = withSpring(SCREEN_HEIGHT - targetHeight, SPRING_CONFIG);
      backdropOpacity.value = withTiming(1, { duration: 250 });
    } else {
      translateY.value = withTiming(SCREEN_HEIGHT, {
        duration: 250,
        easing: Easing.in(Easing.cubic),
      });
      backdropOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible, snapHeights, initialSnap, translateY, backdropOpacity, currentHeight]);

  const findNearestSnap = useCallback(
    (y: number): number => {
      let minDist = Infinity;
      let nearest = snapHeights[0] ?? SCREEN_HEIGHT * 0.4;
      for (const h of snapHeights) {
        const target = SCREEN_HEIGHT - h;
        const dist = Math.abs(y - target);
        if (dist < minDist) {
          minDist = dist;
          nearest = h;
        }
      }
      return nearest;
    },
    [snapHeights],
  );

  const panGesture = Gesture.Pan()
    .onStart(() => {
      contextY.value = translateY.value;
    })
    .onUpdate((event) => {
      const newY = contextY.value + event.translationY;
      const minY = SCREEN_HEIGHT - (snapHeights[snapHeights.length - 1] ?? SCREEN_HEIGHT * 0.75);
      translateY.value = Math.max(minY, newY);
    })
    .onEnd((event) => {
      // Dismiss if dragged past threshold
      const dismissThreshold = SCREEN_HEIGHT - (snapHeights[0] ?? SCREEN_HEIGHT * 0.4) * 0.5;
      if (translateY.value > dismissThreshold || event.velocityY > 1500) {
        translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250 });
        backdropOpacity.value = withTiming(0, { duration: 200 });
        runOnJS(dismiss)();
        return;
      }

      // Snap to nearest point
      const nearestHeight = findNearestSnap(translateY.value);
      currentHeight.value = nearestHeight;
      translateY.value = withSpring(SCREEN_HEIGHT - nearestHeight, SPRING_CONFIG);
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
    pointerEvents: backdropOpacity.value > 0 ? 'auto' as const : 'none' as const,
  }));

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} />
      </Animated.View>
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            styles.sheet,
            {
              height: SCREEN_HEIGHT,
              backgroundColor: colors.background.secondary,
              borderTopLeftRadius: borderRadius.xl,
              borderTopRightRadius: borderRadius.xl,
            },
            sheetStyle,
          ]}
        >
          {showHandle && (
            <View style={styles.handleContainer}>
              <View style={[styles.handle, { backgroundColor: colors.border.default }]} />
            </View>
          )}
          <ScrollView
            style={styles.scrollContent}
            contentContainerStyle={styles.scrollContainer}
            bounces={false}
            showsVerticalScrollIndicator
          >
            {children}
          </ScrollView>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: 40,
  },
});
