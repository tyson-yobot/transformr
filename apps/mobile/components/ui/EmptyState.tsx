// =============================================================================
// TRANSFORMR -- EmptyState
// Warm, encouraging empty state for data screens.
// =============================================================================

import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTheme } from '@theme/index';
import { Button } from '@components/ui/Button';

interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export function EmptyState({ icon, title, subtitle, actionLabel, onAction, style }: EmptyStateProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();

  return (
    <Animated.View entering={FadeIn.duration(400)} style={[styles.container, style]}>
      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor: colors.accent.primary + '15',
            borderRadius: borderRadius.full,
            width: 80,
            height: 80,
            marginBottom: spacing.xl,
          },
        ]}
      >
        <Text style={styles.icon}>{icon}</Text>
      </View>

      <Text
        style={[
          typography.h3,
          { color: colors.text.primary, textAlign: 'center', marginBottom: spacing.sm },
        ]}
      >
        {title}
      </Text>

      <Text
        style={[
          typography.body,
          {
            color: colors.text.secondary,
            textAlign: 'center',
            marginBottom: actionLabel ? spacing.xl : 0,
            maxWidth: 280,
          },
        ]}
      >
        {subtitle}
      </Text>

      {actionLabel && onAction && (
        <Button
          title={actionLabel}
          onPress={onAction}
          variant="primary"
          size="md"
        />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 36,
  },
});
