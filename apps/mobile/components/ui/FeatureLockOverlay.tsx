// =============================================================================
// TRANSFORMR — FeatureLockOverlay
//
// Slides up from the bottom on mount when a user enters a gated screen.
// Renders ABOVE the screen content (which sits at low opacity behind it).
//
// Usage — in any gated screen:
//
//   const { isAvailable } = useFeatureGate('ai_form_check_video');
//   return (
//     <View style={{ flex: 1 }}>
//       <View style={{ flex: 1, opacity: isAvailable ? 1 : 0.12 }} pointerEvents={isAvailable ? 'auto' : 'none'}>
//         {/* screen content */}
//       </View>
//       {!isAvailable && (
//         <FeatureLockOverlay
//           featureKey="ai_form_check_video"
//           title="AI Form Check"
//           description="Record any set and get instant AI feedback — cue by cue, rep by rep."
//           onGoBack={() => router.back()}
//         />
//       )}
//     </View>
//   );
// =============================================================================

import React, { useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue, withSpring, useAnimatedStyle,
  withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme/index';
import { useFeatureGate, FeatureKey } from '@hooks/useFeatureGate';
import type { SubscriptionTier } from '@stores/subscriptionStore';

const TIER_COLORS: Record<SubscriptionTier, string> = {
  free:     '#6B5E8A',
  pro:      '#A855F7',
  elite:    '#C084FC',
  partners: '#EC4899',
};

const TIER_LABELS: Record<SubscriptionTier, string> = {
  free:     'Free',
  pro:      'Pro',
  elite:    'Elite',
  partners: 'Partners',
};

const TIER_HIGHLIGHTS: Record<SubscriptionTier, string[]> = {
  free: [],
  pro: [
    'Unlimited AI coaching',
    'AI meal camera & grocery lists',
    'Readiness score & insights',
    'Unlimited habit tracking',
  ],
  elite: [
    'AI form check video analysis',
    'Ghost Mode training',
    'AI trajectory simulator',
    'Custom dashboard builder',
  ],
  partners: [
    'Live partner sync workouts',
    'Joint streaks & accountability',
    'Partner challenges & nudges',
    'Shared vision board',
  ],
};

interface FeatureLockOverlayProps {
  featureKey: FeatureKey;
  title: string;
  description: string;
  onGoBack: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function FeatureLockOverlay({
  featureKey,
  title,
  description,
  onGoBack,
}: FeatureLockOverlayProps): React.ReactElement {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const { requiredTier, showUpgradeModal } = useFeatureGate(featureKey);

  const translateY = useSharedValue(SCREEN_HEIGHT);
  const lockScale = useSharedValue(1);

  useEffect(() => {
    translateY.value = withSpring(0, { damping: 18, stiffness: 180 });
    lockScale.value = withRepeat(
      withSequence(
        withTiming(1.18, { duration: 700 }),
        withTiming(1.0,  { duration: 700 }),
      ),
      -1,
      true,
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [translateY, lockScale]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  const lockStyle = useAnimatedStyle(() => ({
    transform: [{ scale: lockScale.value }],
  }));

  const accentColor = TIER_COLORS[requiredTier];

  const handleUnlock = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    showUpgradeModal();
  }, [showUpgradeModal]);

  return (
    <View style={styles.sheetShadow}>
    <Animated.View
      style={[
        styles.sheet,
        { backgroundColor: colors.background.primary },
        sheetStyle,
      ]}
    >
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

      <View
        style={[
          styles.badge,
          {
            backgroundColor: accentColor + '22',
            borderRadius: borderRadius.full,
            marginTop: spacing.lg,
          },
        ]}
      >
        <Text style={[typography.captionBold, { color: accentColor }]}>
          {TIER_LABELS[requiredTier]} Feature
        </Text>
      </View>

      <Animated.View style={[styles.lockContainer, lockStyle]}>
        <Ionicons name="lock-closed" size={40} color={accentColor} />
      </Animated.View>

      <Text
        style={[typography.h2, styles.title, { color: colors.text.primary }]}
      >
        {title}
      </Text>
      <Text
        style={[typography.body, styles.description, { color: colors.text.secondary }]}
      >
        {description}
      </Text>

      {TIER_HIGHLIGHTS[requiredTier].length > 0 && (
        <View style={[styles.highlightList, { marginBottom: 20 }]}>
          {TIER_HIGHLIGHTS[requiredTier].map((feature) => (
            <View key={feature} style={styles.highlightRow}>
              <Ionicons name="checkmark-circle" size={16} color={accentColor} style={{ marginRight: 8 }} />
              <Text style={[typography.caption, { color: colors.text.secondary, flex: 1 }]}>
                {feature}
              </Text>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.cta,
          { backgroundColor: accentColor, borderRadius: borderRadius.md },
        ]}
        onPress={handleUnlock}
        accessibilityLabel={`Unlock with ${TIER_LABELS[requiredTier]}`}
        accessibilityRole="button"
      >
        <Text style={[typography.h3, { color: '#FFFFFF', fontWeight: '700' }]}>
          Unlock with {TIER_LABELS[requiredTier]}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.goBack}
        onPress={onGoBack}
        accessibilityLabel="Go back"
        accessibilityRole="button"
      >
        <Text style={[typography.body, { color: colors.text.muted }]}>
          ← Go Back
        </Text>
      </TouchableOpacity>
    </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheetShadow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  accentBar: {
    height: 4,
    width: '40%',
    borderRadius: 2,
    marginTop: 8,
  },
  badge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  lockContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  title: {
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  description: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  cta: {
    width: '100%',
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  goBack: {
    paddingHorizontal: 24,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  highlightList: {
    width: '100%',
    paddingHorizontal: 12,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
});
