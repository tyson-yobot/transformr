// =============================================================================
// TRANSFORMR -- NarratorCard
// Shown after each set log when the workout narrator is enabled.
// =============================================================================

import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '@theme/index';
import { MonoText } from '@components/ui/MonoText';

interface NarratorCardProps {
  narration: string;
  restSeconds: number;
}

export function NarratorCard({ narration, restSeconds }: NarratorCardProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();

  const translateY = useSharedValue(60);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withSpring(0, { damping: 18, stiffness: 200 });
    opacity.value = withSpring(1, { damping: 18, stiffness: 200 });
  }, [opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[animatedStyle, styles.card, { borderRadius: borderRadius.md }]}>
      <View
        style={[
          styles.inner,
          {
            backgroundColor: colors.background.secondary,
            borderLeftWidth: 3,
            borderLeftColor: colors.accent.cyan,
            borderRadius: borderRadius.md,
            padding: spacing.md,
          },
        ]}
      >
        <Text style={[typography.body, { color: colors.text.secondary }]}>
          {narration}
        </Text>
        {restSeconds > 0 && (
          <MonoText
            variant="monoCaption"
            color={colors.accent.cyan}
            style={{ marginTop: spacing.xs }}
          >
            Rest: {restSeconds}s
          </MonoText>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  inner: {},
});
