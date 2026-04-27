// =============================================================================
// TRANSFORMR -- Share Button
// =============================================================================

import { useCallback } from 'react';
import { Pressable, Text, Share, StyleSheet } from 'react-native';
import { Icon3D } from '@components/ui/Icon3D';
import { useTheme } from '@theme/index';
import { hapticLight } from '@utils/haptics';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ShareType =
  | 'pr'
  | 'streak'
  | 'weekly_grade'
  | 'weight_milestone'
  | 'challenge_complete'
  | 'achievement';

interface ShareData {
  title: string;
  value: string;
  subtitle?: string;
  icon?: string;
}

interface ShareButtonProps {
  type: ShareType;
  data: ShareData;
  size?: 'sm' | 'md';
  label?: string;
}

// ---------------------------------------------------------------------------
// Caption generator
// ---------------------------------------------------------------------------

function generateCaption(type: ShareType, data: ShareData): string {
  const hashtags = '#TRANSFORMR #Fitness';

  switch (type) {
    case 'pr':
      return `NEW PR! ${data.value} - ${data.title}${data.subtitle ? ` (${data.subtitle})` : ''}\n\n${hashtags} #PersonalRecord`;
    case 'streak':
      return `${data.value} streak! ${data.title}. Consistency is everything.\n\n${hashtags} #Streak`;
    case 'weekly_grade':
      return `Weekly grade: ${data.value} - ${data.title}.\n\n${hashtags} #WeeklyReview`;
    case 'weight_milestone':
      return `Milestone hit: ${data.value} - ${data.title}.${data.subtitle ? ` ${data.subtitle}` : ''}\n\n${hashtags} #Milestone`;
    case 'challenge_complete':
      return `Challenge complete! ${data.title} - ${data.value}.${data.subtitle ? ` ${data.subtitle}` : ''}\n\n${hashtags} #ChallengeComplete`;
    case 'achievement':
      return `Achievement unlocked: ${data.title} - ${data.value}!${data.subtitle ? ` ${data.subtitle}` : ''}\n\n${hashtags} #Achievement`;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ShareButton({ type, data, size = 'md', label }: ShareButtonProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();

  const iconSize = size === 'sm' ? 18 : 22;
  const paddingValue = size === 'sm' ? spacing.sm : spacing.md;

  const handlePress = useCallback(async () => {
    await hapticLight();
    const caption = generateCaption(type, data);
    await Share.share({ message: caption });
  }, [type, data]);

  return (
    <Pressable
      onPress={handlePress}
      style={[
        styles.button,
        {
          backgroundColor: colors.background.tertiary,
          borderRadius: borderRadius.md,
          paddingHorizontal: paddingValue,
          paddingVertical: paddingValue - 2,
        },
      ]}
      accessibilityLabel={label ?? 'Share'}
      accessibilityRole="button"
    >
      <Icon3D name="share" size={iconSize} />
      {label ? (
        <Text
          style={[
            size === 'sm' ? typography.caption : typography.captionBold,
            {
              color: colors.accent.primary,
              marginLeft: spacing.xs,
            },
          ]}
        >
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
