// =============================================================================
// TRANSFORMR -- Disclaimer Banner
// Displays compliance-safe disclaimer text on AI-generated health content.
// Never dismissible. Always visible on health-related AI output.
// =============================================================================

import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Icon3D } from '@components/ui/Icon3D';
import { useTheme } from '@theme/index';

type DisclaimerType = 'supplement' | 'lab' | 'nutrition' | 'workout' | 'general' | 'sleep';

const DISCLAIMER_TEXT: Record<DisclaimerType, string> = {
  supplement:
    'These supplement suggestions are for informational purposes only and are not medical advice. Individual responses vary. Consult a healthcare provider before starting any new supplement.',
  lab: 'This interpretation is educational and does not constitute medical diagnosis or advice. Please discuss your results with a qualified healthcare provider for personalized medical guidance.',
  nutrition:
    'These nutrition suggestions support general wellness goals and are not a substitute for professional dietary or medical advice.',
  workout:
    'Listen to your body. If you experience pain beyond normal training discomfort, stop and consult a medical professional.',
  general:
    'This guidance supports your personal wellness goals and is not medical advice. For health concerns, consult a qualified professional.',
  sleep:
    'These sleep suggestions are based on general wellness research and your personal data patterns. For persistent sleep issues, consult a healthcare provider.',
};

interface DisclaimerProps {
  type: DisclaimerType;
  compact?: boolean;
  style?: ViewStyle;
}

export function Disclaimer({ type, compact = false, style }: DisclaimerProps) {
  const { colors, spacing, borderRadius, typography } = useTheme();

  const text = DISCLAIMER_TEXT[type];

  if (compact) {
    return (
      <View
        style={[
          styles.compactContainer,
          {
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.md,
          },
          style,
        ]}
        accessibilityRole="text"
        accessibilityLabel={`Disclaimer: ${text}`}
      >
        <Ionicons
          name="information-circle-outline"
          size={14}
          color={colors.text.muted}
          style={{ marginRight: spacing.xs }}
        />
        <Text
          style={[
            typography.tiny,
            { color: colors.text.muted, flex: 1 },
          ]}
          numberOfLines={2}
        >
          {text}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background.tertiary,
          borderRadius: borderRadius.md,
          padding: spacing.md,
          borderWidth: 1,
          borderColor: colors.border.subtle,
        },
        style,
      ]}
      accessibilityRole="text"
      accessibilityLabel={`Disclaimer: ${text}`}
    >
      <View style={[styles.headerRow, { marginBottom: spacing.sm }]}>
        <Icon3D
          name="shield"
          size={16}
          style={{ marginRight: spacing.sm }}
        />
        <Text
          style={[
            typography.captionBold,
            { color: colors.text.secondary },
          ]}
        >
          Wellness Disclaimer
        </Text>
      </View>
      <Text
        style={[
          typography.caption,
          { color: colors.text.muted },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
