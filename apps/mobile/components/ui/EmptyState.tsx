// =============================================================================
// TRANSFORMR -- EmptyState
// Warm, encouraging empty state for data screens.
// =============================================================================

import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme/index';
import { Button } from '@components/ui/Button';

interface EmptyStateProps {
  icon: string;
  ionIcon?: keyof typeof Ionicons.glyphMap;
  accentColor?: string;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export function EmptyState({ icon, ionIcon, accentColor, title, subtitle, actionLabel, onAction, style }: EmptyStateProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const accent = accentColor ?? colors.accent.primary;

  return (
    <Animated.View entering={FadeIn.duration(400)} style={[styles.container, style]}>
      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor: `${accent}15`,
            borderRadius: borderRadius.full,
            width: 80,
            height: 80,
            marginBottom: spacing.xl,
            borderWidth: 1,
            borderColor: `${accent}25`,
            shadowColor: accent,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.2,
            shadowRadius: 12,
            elevation: 4,
          },
        ]}
      >
        {ionIcon ? (
          <Ionicons name={ionIcon} size={36} color={accent} />
        ) : (
          <Text style={styles.icon}>{icon}</Text>
        )}
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
