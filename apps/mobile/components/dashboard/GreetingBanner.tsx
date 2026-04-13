import React from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { format } from 'date-fns';
import { useTheme } from '@theme/index';
import { getTodayGreeting } from '@utils/greetings';

export function GreetingBanner(): React.JSX.Element {
  const { colors, typography, spacing } = useTheme();
  const { text, timeLabel } = getTodayGreeting();
  const formattedDate = format(new Date(), 'EEEE, MMMM d');

  const styles = StyleSheet.create({
    container: {
      marginBottom: spacing.lg,
    },
    greetingText: {
      ...typography.h1,
      color: colors.text.primary,
      marginBottom: spacing.xs,
    },
    subtitleText: {
      ...typography.caption,
      color: colors.text.muted,
    },
  });

  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
      <Text style={styles.greetingText}>{text}</Text>
      <Text style={styles.subtitleText}>
        {timeLabel} — {formattedDate}
      </Text>
    </Animated.View>
  );
}
