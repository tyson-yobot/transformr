import React, { useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  StyleSheet,
  ViewStyle,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  FadeInDown,
  FadeIn,
  SlideInDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@theme/index';

interface DetectedFood {
  id: string;
  name: string;
  confidence: number;
  estimatedCalories: number;
  estimatedProtein: number;
  estimatedCarbs: number;
  estimatedFat: number;
  servingDescription: string;
}

type CameraState = 'scanning' | 'analyzing' | 'results';

interface MealCameraOverlayProps {
  state: CameraState;
  detectedFoods: DetectedFood[];
  onAddFood: (food: DetectedFood) => void;
  onRetake: () => void;
  onClose: () => void;
  style?: ViewStyle;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const GUIDE_SIZE = SCREEN_WIDTH * 0.75;

function getConfidenceColor(
  confidence: number,
  accentColors: { success: string; warning: string; danger: string },
): string {
  if (confidence >= 0.8) return accentColors.success;
  if (confidence >= 0.5) return accentColors.warning;
  return accentColors.danger;
}

function getConfidenceLabel(confidence: number): string {
  if (confidence >= 0.8) return 'High';
  if (confidence >= 0.5) return 'Medium';
  return 'Low';
}

function ScanningOverlay() {
  const { colors, typography, spacing } = useTheme();
  const pulseOpacity = useSharedValue(0.4);

  React.useEffect(() => {
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [pulseOpacity]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  return (
    <View style={styles.centerOverlay}>
      <Animated.View
        style={[
          styles.guideFrame,
          {
            width: GUIDE_SIZE,
            height: GUIDE_SIZE,
            borderRadius: 20,
            borderWidth: 3,
            borderColor: colors.accent.primary,
            borderStyle: 'dashed',
          },
          pulseStyle,
        ]}
      />
      <Text
        style={[
          typography.bodyBold,
          { color: '#FFFFFF', marginTop: spacing.xl, textAlign: 'center' },
        ]}
      >
        Position your meal in the frame
      </Text>
      <Text
        style={[
          typography.caption,
          { color: 'rgba(255,255,255,0.7)', marginTop: spacing.sm, textAlign: 'center' },
        ]}
      >
        Keep the camera steady for best results
      </Text>
    </View>
  );
}

function AnalyzingOverlay() {
  const { colors, typography, spacing } = useTheme();
  const scanLineY = useSharedValue(0);

  React.useEffect(() => {
    scanLineY.value = withRepeat(
      withTiming(GUIDE_SIZE, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [scanLineY]);

  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanLineY.value }],
  }));

  return (
    <View style={styles.centerOverlay}>
      <View
        style={[
          styles.guideFrame,
          {
            width: GUIDE_SIZE,
            height: GUIDE_SIZE,
            borderRadius: 20,
            borderWidth: 2,
            borderColor: colors.accent.primary,
            overflow: 'hidden',
          },
        ]}
      >
        <Animated.View
          style={[
            styles.scanLine,
            {
              backgroundColor: colors.accent.primary,
              width: GUIDE_SIZE - 4,
            },
            scanLineStyle,
          ]}
        />
      </View>
      <View style={[styles.analyzingRow, { marginTop: spacing.xl }]}>
        <ActivityIndicator size="small" color={colors.accent.primary} />
        <Text
          style={[
            typography.bodyBold,
            { color: '#FFFFFF', marginLeft: spacing.md },
          ]}
        >
          Analyzing your meal...
        </Text>
      </View>
    </View>
  );
}

function ResultsOverlay({
  detectedFoods,
  onAddFood,
  onRetake,
}: {
  detectedFoods: DetectedFood[];
  onAddFood: (food: DetectedFood) => void;
  onRetake: () => void;
}) {
  const { colors, typography, spacing, borderRadius } = useTheme();

  const handleAddFood = useCallback(
    (food: DetectedFood) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onAddFood(food);
    },
    [onAddFood],
  );

  const handleRetake = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onRetake();
  }, [onRetake]);

  const renderFoodItem = useCallback(
    ({ item, index }: { item: DetectedFood; index: number }) => {
      const confidenceColor = getConfidenceColor(item.confidence, colors.accent);
      const confidenceLabel = getConfidenceLabel(item.confidence);
      const confidencePercent = Math.round(item.confidence * 100);

      return (
        <Animated.View
          entering={FadeInDown.delay(index * 100).duration(300).springify()}
          style={[
            styles.foodResultCard,
            {
              backgroundColor: colors.background.secondary,
              borderRadius: borderRadius.lg,
              padding: spacing.lg,
              marginBottom: spacing.md,
            },
          ]}
        >
          <View style={styles.foodResultHeader}>
            <View style={styles.foodResultInfo}>
              <Text
                style={[typography.bodyBold, { color: colors.text.primary }]}
                numberOfLines={1}
              >
                {item.name}
              </Text>
              <Text style={[typography.caption, { color: colors.text.muted, marginTop: 2 }]}>
                {item.servingDescription}
              </Text>
            </View>
            <View style={[styles.confidenceBadge, { backgroundColor: `${confidenceColor}20`, borderRadius: borderRadius.full, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs }]}>
              <View style={[styles.confidenceDot, { backgroundColor: confidenceColor }]} />
              <Text style={[typography.tiny, { color: confidenceColor, marginLeft: 4 }]}>
                {confidenceLabel} {confidencePercent}%
              </Text>
            </View>
          </View>

          <View style={[styles.foodResultMacros, { marginTop: spacing.md }]}>
            <Text style={[typography.caption, { color: colors.accent.fire }]}>
              {item.estimatedCalories} cal
            </Text>
            <Text style={[typography.caption, { color: colors.accent.info, marginLeft: spacing.md }]}>
              P: {item.estimatedProtein}g
            </Text>
            <Text style={[typography.caption, { color: colors.accent.success, marginLeft: spacing.md }]}>
              C: {item.estimatedCarbs}g
            </Text>
            <Text style={[typography.caption, { color: colors.accent.warning, marginLeft: spacing.md }]}>
              F: {item.estimatedFat}g
            </Text>
          </View>

          <Pressable
            onPress={() => handleAddFood(item)}
            style={[
              styles.addButton,
              {
                backgroundColor: colors.accent.primary,
                borderRadius: borderRadius.md,
                paddingVertical: spacing.sm,
                marginTop: spacing.md,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Add ${item.name} to food log`}
          >
            <Text style={[typography.bodyBold, { color: '#FFFFFF', textAlign: 'center' }]}>
              Add to Log
            </Text>
          </Pressable>
        </Animated.View>
      );
    },
    [colors, typography, spacing, borderRadius, handleAddFood],
  );

  const keyExtractor = useCallback((item: DetectedFood) => item.id, []);

  return (
    <Animated.View
      entering={SlideInDown.duration(400).springify()}
      style={[
        styles.resultsPanel,
        {
          backgroundColor: colors.background.primary,
          borderTopLeftRadius: borderRadius.xl,
          borderTopRightRadius: borderRadius.xl,
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.xl,
          paddingBottom: spacing.xxxl,
        },
      ]}
    >
      <View style={styles.resultsHeader}>
        <Text style={[typography.h2, { color: colors.text.primary }]}>
          Detected Foods
        </Text>
        <Text style={[typography.caption, { color: colors.text.secondary }]}>
          {detectedFoods.length} item{detectedFoods.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {detectedFoods.length === 0 ? (
        <Animated.View
          entering={FadeIn.duration(300)}
          style={[styles.emptyResults, { padding: spacing.xxl }]}
        >
          <Text style={{ fontSize: 48 }}>{'\u{1F937}'}</Text>
          <Text
            style={[
              typography.body,
              { color: colors.text.muted, textAlign: 'center', marginTop: spacing.md },
            ]}
          >
            No foods detected. Try retaking the photo with better lighting.
          </Text>
        </Animated.View>
      ) : (
        <FlatList
          data={detectedFoods}
          renderItem={renderFoodItem}
          keyExtractor={keyExtractor}
          style={{ marginTop: spacing.md }}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Pressable
        onPress={handleRetake}
        style={[
          styles.retakeButton,
          {
            backgroundColor: colors.background.tertiary,
            borderRadius: borderRadius.md,
            paddingVertical: spacing.md,
            marginTop: spacing.lg,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Retake photo"
      >
        <Text style={[typography.bodyBold, { color: colors.text.primary, textAlign: 'center' }]}>
          Retake Photo
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export function MealCameraOverlay({
  state,
  detectedFoods,
  onAddFood,
  onRetake,
  onClose,
  style,
}: MealCameraOverlayProps) {
  const { typography, borderRadius } = useTheme();

  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  }, [onClose]);

  return (
    <View style={[styles.overlay, style]}>
      <Pressable
        onPress={handleClose}
        style={[
          styles.closeButton,
          {
            backgroundColor: 'rgba(0,0,0,0.6)',
            borderRadius: borderRadius.full,
            width: 40,
            height: 40,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Close camera"
        hitSlop={12}
      >
        <Text style={[typography.bodyBold, { color: '#FFFFFF' }]}>
          {'\u2715'}
        </Text>
      </Pressable>

      {state === 'scanning' ? <ScanningOverlay /> : null}
      {state === 'analyzing' ? <AnalyzingOverlay /> : null}
      {state === 'results' ? (
        <ResultsOverlay
          detectedFoods={detectedFoods}
          onAddFood={onAddFood}
          onRetake={onRetake}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideFrame: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanLine: {
    height: 2,
    position: 'absolute',
    left: 2,
  },
  analyzingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultsPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: SCREEN_HEIGHT * 0.65,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  foodResultCard: {},
  foodResultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  foodResultInfo: {
    flex: 1,
    marginRight: 12,
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confidenceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  foodResultMacros: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButton: {},
  emptyResults: {
    alignItems: 'center',
  },
  retakeButton: {},
});
