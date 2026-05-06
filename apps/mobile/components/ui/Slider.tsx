import { useCallback } from 'react';
import { View, Text, StyleSheet, ViewStyle, LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@theme/index';

interface SliderProps {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  showValue?: boolean;
  trackColor?: string;
  fillColor?: string;
  thumbColor?: string;
  style?: ViewStyle;
  testID?: string;
}

const THUMB_SIZE = 28;
const TRACK_HEIGHT = 6;

export function Slider({
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  showValue = true,
  trackColor,
  fillColor,
  thumbColor,
  style,
  testID,
}: SliderProps) {
  const { colors, typography, spacing } = useTheme();
  const trackWidth = useSharedValue(0);
  const thumbX = useSharedValue(0);
  const isDragging = useSharedValue(false);
  const startX = useSharedValue(0);

  const activeTrackColor = fillColor ?? colors.accent.primary;
  const inactiveTrackColor = trackColor ?? colors.background.tertiary;
  const activeThumbColor = thumbColor ?? colors.accent.primary;

  const clampValue = useCallback(
    (v: number): number => {
      const stepped = Math.round(v / step) * step;
      return Math.max(min, Math.min(max, stepped));
    },
    [min, max, step],
  );

  const valueToPosition = useCallback(
    (v: number, width: number): number => {
      const ratio = (v - min) / (max - min);
      return ratio * width;
    },
    [min, max],
  );

  const positionToValue = useCallback(
    (x: number, width: number): number => {
      if (width === 0) return min;
      const ratio = Math.max(0, Math.min(1, x / width));
      return clampValue(min + ratio * (max - min));
    },
    [min, max, clampValue],
  );

  const handleLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const width = e.nativeEvent.layout.width - THUMB_SIZE;
      trackWidth.value = width;
      thumbX.value = valueToPosition(value, width);
    },
    [value, trackWidth, thumbX, valueToPosition],
  );

  const emitHaptic = useCallback(() => {
    Haptics.selectionAsync();
  }, []);

  const emitChange = useCallback(
    (newValue: number) => {
      onValueChange(newValue);
    },
    [onValueChange],
  );

  // JS-thread handlers invoked via runOnJS from gesture worklets. positionToValue
  // and valueToPosition are useCallback wrappers (closure over min/max/step) — calling
  // them directly from a worklet throws "non-worklet anonymous function on the UI thread".
  const handleSliderUpdate = useCallback(
    (x: number, w: number) => {
      const newValue = positionToValue(x, w);
      emitChange(newValue);
    },
    [positionToValue, emitChange],
  );

  const handleSliderEnd = useCallback(
    (currentX: number, w: number) => {
      const snappedValue = positionToValue(currentX, w);
      const snappedX = valueToPosition(snappedValue, w);
      thumbX.value = withSpring(snappedX, { damping: 20, stiffness: 300 });
      emitChange(snappedValue);
      emitHaptic();
    },
    [positionToValue, valueToPosition, thumbX, emitChange, emitHaptic],
  );

  const panGesture = Gesture.Pan()
    .onStart(() => {
      'worklet';
      isDragging.value = true;
      startX.value = thumbX.value;
    })
    .onUpdate((event) => {
      'worklet';
      const newX = Math.max(0, Math.min(trackWidth.value, startX.value + event.translationX));
      thumbX.value = newX;
      runOnJS(handleSliderUpdate)(newX, trackWidth.value);
    })
    .onEnd(() => {
      'worklet';
      isDragging.value = false;
      runOnJS(handleSliderEnd)(thumbX.value, trackWidth.value);
    });

  const fillStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      width: thumbX.value + THUMB_SIZE / 2,
    };
  });

  const thumbScaleStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [
        { translateX: thumbX.value },
        { scale: isDragging.value ? 1.15 : 1 },
      ],
    };
  });

  return (
    <View style={[styles.wrapper, style]} testID={testID}>
      {(label || showValue) && (
        <View style={[styles.labelRow, { marginBottom: spacing.sm }]}>
          {label && (
            <Text style={[typography.captionBold, { color: colors.text.secondary }]}>
              {label}
            </Text>
          )}
          {showValue && (
            <Text style={[typography.bodyBold, { color: colors.text.primary }]}>
              {clampValue(value)}
            </Text>
          )}
        </View>
      )}
      <GestureDetector gesture={panGesture}>
        <View style={styles.trackContainer} onLayout={handleLayout}>
          <View
            style={[
              styles.track,
              {
                backgroundColor: inactiveTrackColor,
                borderRadius: TRACK_HEIGHT / 2,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.fill,
              {
                backgroundColor: activeTrackColor,
                borderRadius: TRACK_HEIGHT / 2,
              },
              fillStyle,
            ]}
          />
          {/* Outer Animated.View: position + scale animation only — no shadow props
              so Reanimated (Fabric) never passes shadowOffset as a native prop */}
          <Animated.View style={[styles.thumb, thumbScaleStyle]}>
            <View
              style={{
                flex: 1,
                borderRadius: THUMB_SIZE / 2,
                backgroundColor: activeThumbColor,
                shadowColor: activeTrackColor,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 4,
              }}
            />
          </Animated.View>
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {},
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trackContainer: {
    height: THUMB_SIZE + 8,
    justifyContent: 'center',
    paddingHorizontal: THUMB_SIZE / 2,
  },
  track: {
    height: TRACK_HEIGHT,
    width: '100%',
  },
  fill: {
    height: TRACK_HEIGHT,
    position: 'absolute',
    left: 0,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
  },
});
