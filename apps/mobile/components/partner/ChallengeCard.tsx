import { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import Animated, {
  FadeIn,
  ZoomIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@theme/index';
import type { PartnerChallenge } from '../../types/database';

type ChallengeStatus = 'active' | 'completed' | 'expired';

interface ChallengeCardProps {
  challenge: PartnerChallenge;
  currentUserId: string;
  partnerName: string;
  onAccept?: (challengeId: string) => void;
  onDecline?: (challengeId: string) => void;
  onPress?: (challengeId: string) => void;
  isPending?: boolean;
  style?: ViewStyle;
}

function getTimeRemaining(endDate: string | undefined): string {
  if (!endDate) return 'No deadline';
  const now = Date.now();
  const end = new Date(endDate).getTime();
  const diff = end - now;

  if (diff <= 0) return 'Ended';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h left`;

  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${minutes}m left`;
}

function getProgressPercent(progress: number | undefined, target: number | undefined): number {
  if (!target || target <= 0) return 0;
  const p = progress ?? 0;
  return Math.min(1, p / target);
}

export function ChallengeCard({
  challenge,
  currentUserId,
  partnerName,
  onAccept,
  onDecline,
  onPress,
  isPending = false,
  style,
}: ChallengeCardProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();

  const status = (challenge.status ?? 'active') as ChallengeStatus;
  const isCompleted = status === 'completed';
  const isExpired = status === 'expired';
  const isActive = status === 'active';

  const isUserA = challenge.created_by === currentUserId;
  const userProgress = isUserA ? challenge.user_a_progress : challenge.user_b_progress;
  const partnerProgress = isUserA ? challenge.user_b_progress : challenge.user_a_progress;

  const userPercent = getProgressPercent(userProgress, challenge.target_value);
  const partnerPercent = getProgressPercent(partnerProgress, challenge.target_value);

  const timeRemaining = useMemo(() => getTimeRemaining(challenge.end_date), [challenge.end_date]);

  const isWinner = isCompleted && challenge.winner_id === currentUserId;
  const isLoser = isCompleted && challenge.winner_id != null && challenge.winner_id !== currentUserId;
  const isTie = isCompleted && challenge.winner_id == null;

  const handleAccept = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onAccept?.(challenge.id);
  }, [challenge.id, onAccept]);

  const handleDecline = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDecline?.(challenge.id);
  }, [challenge.id, onDecline]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.(challenge.id);
  }, [challenge.id, onPress]);

  const borderColor = useMemo(() => {
    if (isWinner) return colors.accent.gold;
    if (isCompleted) return colors.accent.success;
    if (isExpired) return colors.border.default;
    return colors.accent.primary;
  }, [isWinner, isCompleted, isExpired, colors]);

  const challengeTypeLabel = useMemo(() => {
    switch (challenge.challenge_type) {
      case 'both_complete':
        return 'Both Complete';
      case 'competition':
        return 'Competition';
      case 'streak':
        return 'Streak';
      case 'custom':
        return 'Custom';
      default:
        return 'Challenge';
    }
  }, [challenge.challenge_type]);

  return (
    <Pressable
      onPress={onPress ? handlePress : undefined}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={`${challenge.title} challenge with ${partnerName}`}
    >
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[
          styles.card,
          {
            backgroundColor: colors.background.secondary,
            borderRadius: borderRadius.lg,
            padding: spacing.lg,
            borderLeftWidth: 4,
            borderLeftColor: borderColor,
          },
          style,
        ]}
      >
        <View style={styles.topRow}>
          <View style={styles.titleSection}>
            <Text
              style={[typography.h3, { color: colors.text.primary }]}
              numberOfLines={2}
            >
              {challenge.title}
            </Text>
            {challenge.description ? (
              <Text
                style={[typography.caption, { color: colors.text.secondary, marginTop: spacing.xs }]}
                numberOfLines={2}
              >
                {challenge.description}
              </Text>
            ) : null}
          </View>

          <View
            style={[
              styles.typeBadge,
              {
                backgroundColor: `${colors.accent.primary}20`,
                borderRadius: borderRadius.full,
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xs,
              },
            ]}
          >
            <Text style={[typography.tiny, { color: colors.accent.primary }]}>
              {challengeTypeLabel}
            </Text>
          </View>
        </View>

        {isActive || isCompleted ? (
          <View style={[styles.progressSection, { marginTop: spacing.lg }]}>
            <ProgressRow
              label="You"
              progress={userPercent}
              value={userProgress ?? 0}
              target={challenge.target_value ?? 0}
              metric={challenge.metric ?? ''}
              color={colors.accent.primary}
              trackColor={colors.background.tertiary}
              textPrimary={colors.text.primary}
              textSecondary={colors.text.secondary}
              borderRadiusValue={borderRadius}
              spacing={spacing}
              typography={typography}
              isWinner={isWinner}
            />
            <View style={{ height: spacing.md }} />
            <ProgressRow
              label={partnerName}
              progress={partnerPercent}
              value={partnerProgress ?? 0}
              target={challenge.target_value ?? 0}
              metric={challenge.metric ?? ''}
              color={colors.accent.secondary}
              trackColor={colors.background.tertiary}
              textPrimary={colors.text.primary}
              textSecondary={colors.text.secondary}
              borderRadiusValue={borderRadius}
              spacing={spacing}
              typography={typography}
              isWinner={isLoser}
            />
          </View>
        ) : null}

        <View style={[styles.metaRow, { marginTop: spacing.lg }]}>
          <View style={styles.metaLeft}>
            {isActive ? (
              <Text style={[typography.caption, { color: colors.accent.warning }]}>
                {'\u{23F3}'} {timeRemaining}
              </Text>
            ) : null}
            {isCompleted ? (
              <CompletionBadge
                isWinner={isWinner}
                isTie={isTie}
                colors={colors}
                typography={typography}
                spacing={spacing}
                borderRadius={borderRadius}
              />
            ) : null}
            {isExpired ? (
              <Text style={[typography.caption, { color: colors.text.muted }]}>
                Expired
              </Text>
            ) : null}
          </View>

          {challenge.stake_amount != null && challenge.stake_amount > 0 ? (
            <View
              style={[
                styles.stakeBadge,
                {
                  backgroundColor: `${colors.accent.gold}20`,
                  borderRadius: borderRadius.full,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.xs,
                },
              ]}
            >
              <Text style={[typography.captionBold, { color: colors.accent.gold }]}>
                ${challenge.stake_amount} stake
              </Text>
            </View>
          ) : null}
        </View>

        {isPending ? (
          <Animated.View
            entering={FadeIn.delay(200).duration(300)}
            style={[styles.actionRow, { marginTop: spacing.lg, gap: spacing.md }]}
          >
            <Pressable
              onPress={handleDecline}
              style={[
                styles.actionButton,
                {
                  backgroundColor: colors.background.tertiary,
                  borderRadius: borderRadius.md,
                  paddingVertical: spacing.md,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Decline challenge"
            >
              <Text style={[typography.bodyBold, { color: colors.text.primary, textAlign: 'center' }]}>
                Decline
              </Text>
            </Pressable>
            <Pressable
              onPress={handleAccept}
              style={[
                styles.actionButton,
                {
                  backgroundColor: colors.accent.primary,
                  borderRadius: borderRadius.md,
                  paddingVertical: spacing.md,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Accept challenge"
            >
              <Text style={[typography.bodyBold, { color: '#FFFFFF', textAlign: 'center' }]}>
                Accept
              </Text>
            </Pressable>
          </Animated.View>
        ) : null}

        {isWinner ? (
          <Animated.View
            entering={ZoomIn.springify().damping(10)}
            style={styles.trophyOverlay}
          >
            <Text style={{ fontSize: 28 }}>{'\u{1F3C6}'}</Text>
          </Animated.View>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

interface ProgressRowProps {
  label: string;
  progress: number;
  value: number;
  target: number;
  metric: string;
  color: string;
  trackColor: string;
  textPrimary: string;
  textSecondary: string;
  borderRadiusValue: ReturnType<typeof import('@theme/index').useTheme>['borderRadius'];
  spacing: ReturnType<typeof import('@theme/index').useTheme>['spacing'];
  typography: ReturnType<typeof import('@theme/index').useTheme>['typography'];
  isWinner: boolean;
}

function ProgressRow({
  label,
  progress,
  value,
  target,
  metric,
  color,
  trackColor,
  textPrimary,
  textSecondary,
  borderRadiusValue: _borderRadiusValue,
  spacing,
  typography,
  isWinner,
}: ProgressRowProps) {
  const percentage = Math.round(progress * 100);

  return (
    <View>
      <View style={styles.progressLabelRow}>
        <Text style={[typography.captionBold, { color: textPrimary }]}>
          {label}
          {isWinner ? ' \u{1F451}' : ''}
        </Text>
        <Text style={[typography.caption, { color: textSecondary }]}>
          {Math.round(value)} / {target} {metric}
        </Text>
      </View>
      <View
        style={[
          styles.progressTrack,
          {
            backgroundColor: trackColor,
            borderRadius: 4,
            marginTop: spacing.xs,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.progressFill,
            {
              backgroundColor: color,
              borderRadius: 4,
              width: `${percentage}%` as unknown as number,
            },
          ]}
        />
      </View>
    </View>
  );
}

interface CompletionBadgeProps {
  isWinner: boolean;
  isTie: boolean;
  colors: ReturnType<typeof import('@theme/index').useTheme>['colors'];
  typography: ReturnType<typeof import('@theme/index').useTheme>['typography'];
  spacing: ReturnType<typeof import('@theme/index').useTheme>['spacing'];
  borderRadius: ReturnType<typeof import('@theme/index').useTheme>['borderRadius'];
}

function CompletionBadge({ isWinner, isTie, colors, typography, spacing, borderRadius }: CompletionBadgeProps) {
  const label = isTie ? 'Tied!' : isWinner ? 'You Won!' : 'They Won';
  const emoji = isTie ? '\u{1F91D}' : isWinner ? '\u{1F389}' : '\u{1F44F}';
  const color = isTie ? colors.accent.info : isWinner ? colors.accent.gold : colors.accent.secondary;

  return (
    <View
      style={[
        styles.completionBadge,
        {
          backgroundColor: `${color}20`,
          borderRadius: borderRadius.full,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs,
        },
      ]}
    >
      <Text style={[typography.captionBold, { color }]}>
        {emoji} {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleSection: {
    flex: 1,
    marginRight: 12,
  },
  typeBadge: {},
  progressSection: {},
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressTrack: {
    height: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLeft: {},
  stakeBadge: {},
  completionBadge: {},
  actionRow: {
    flexDirection: 'row',
  },
  actionButton: {
    flex: 1,
  },
  trophyOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
});
