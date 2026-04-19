// =============================================================================
// TRANSFORMR — SavingsCalculator
// Sober Month / No-Spend savings tracker.
// Shows cumulative savings and projected total with tiered reward suggestions.
// =============================================================================

import { useState, useMemo, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { ProgressBar } from '@components/ui/ProgressBar';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface SavingsCalculatorProps {
  weeklySpend:     number;
  dayNumber:       number;
  totalDays:       number;
  onUpdateSpend?:  (newSpend: number) => void;
}

interface RewardTier {
  threshold: number;
  label:     string;
  emoji:     string;
}

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const REWARD_TIERS: RewardTier[] = [
  { threshold: 20,   label: 'Nice dinner out',       emoji: '🍽️' },
  { threshold: 50,   label: 'New book + spa day',    emoji: '📚' },
  { threshold: 100,  label: 'Concert tickets',       emoji: '🎶' },
  { threshold: 200,  label: 'Weekend getaway',       emoji: '🏕️' },
  { threshold: 500,  label: 'Flight + hotel',        emoji: '✈️' },
  { threshold: 1000, label: 'Dream experience',      emoji: '🌟' },
];

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function formatCurrency(value: number): string {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function SavingsCalculator({
  weeklySpend,
  dayNumber,
  totalDays,
  onUpdateSpend,
}: SavingsCalculatorProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();

  const [editValue, setEditValue] = useState(String(weeklySpend));
  const [isEditing, setIsEditing] = useState(false);

  const dailySpend    = weeklySpend / 7;
  const savedSoFar    = dailySpend * dayNumber;
  const projectedTotal = dailySpend * totalDays;

  const progress = totalDays > 0 ? Math.min(dayNumber / totalDays, 1) : 0;

  const unlockedTier = useMemo((): RewardTier | null => {
    const eligible = REWARD_TIERS.filter((t) => savedSoFar >= t.threshold);
    return eligible.length > 0 ? (eligible[eligible.length - 1] ?? null) : null;
  }, [savedSoFar]);

  const nextTier = useMemo((): RewardTier | null => {
    const next = REWARD_TIERS.find((t) => t.threshold > savedSoFar);
    return next ?? null;
  }, [savedSoFar]);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    const parsed = parseFloat(editValue);
    if (!isNaN(parsed) && parsed >= 0) {
      onUpdateSpend?.(parsed);
    } else {
      setEditValue(String(weeklySpend));
    }
  }, [editValue, weeklySpend, onUpdateSpend]);

  return (
    <Animated.View entering={FadeInDown.duration(400)}>
      {/* Big savings number */}
      <Card variant="success" style={{ marginBottom: spacing.lg }}>
        <View style={styles.centerBlock}>
          <Text style={[typography.sectionTitle, { color: colors.text.muted, letterSpacing: 1.2 }]}>
            SAVED SO FAR
          </Text>
          <Text style={[typography.stat, { color: colors.accent.success, marginTop: spacing.sm, textAlign: 'center' }]}>
            {formatCurrency(savedSoFar)}
          </Text>
          <Text style={[typography.caption, { color: colors.text.muted, marginTop: spacing.xs }]}>
            {`Day ${dayNumber} of ${totalDays}`}
          </Text>
        </View>

        <ProgressBar
          progress={progress}
          label={`${Math.round(progress * 100)}% complete`}
          color={colors.accent.success}
          height={6}
          style={{ marginTop: spacing.lg }}
        />
      </Card>

      {/* Projection card */}
      <Card variant="flat" style={{ marginBottom: spacing.lg }}>
        <View style={styles.rowBetween}>
          <Text style={[typography.body, { color: colors.text.secondary }]}>Projected total</Text>
          <Text style={[typography.bodyBold, { color: colors.text.primary }]}>
            {formatCurrency(projectedTotal)}
          </Text>
        </View>
        <View style={[styles.rowBetween, { marginTop: spacing.sm }]}>
          <Text style={[typography.body, { color: colors.text.secondary }]}>Daily savings</Text>
          <Text style={[typography.bodyBold, { color: colors.text.primary }]}>
            {formatCurrency(dailySpend)}
          </Text>
        </View>

        {/* Weekly spend editor */}
        <View style={[styles.rowBetween, { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border.subtle }]}>
          <Text style={[typography.body, { color: colors.text.secondary }]}>Weekly spend was</Text>
          {onUpdateSpend ? (
            <TextInput
              value={isEditing ? editValue : `$${weeklySpend}`}
              onFocus={() => { setIsEditing(true); setEditValue(String(weeklySpend)); }}
              onBlur={handleBlur}
              onChangeText={setEditValue}
              keyboardType="decimal-pad"
              style={[
                typography.bodyBold,
                {
                  color: colors.accent.primary,
                  backgroundColor: isEditing ? colors.background.input : 'transparent',
                  paddingHorizontal: isEditing ? spacing.sm : 0,
                  borderRadius: borderRadius.sm,
                  minWidth: 64,
                  textAlign: 'right',
                },
              ]}
            />
          ) : (
            <Text style={[typography.bodyBold, { color: colors.text.primary }]}>
              {`$${weeklySpend}`}
            </Text>
          )}
        </View>
      </Card>

      {/* Reward tiers */}
      {unlockedTier && (
        <Card variant="gold" style={{ marginBottom: spacing.md }}>
          <Text style={[typography.sectionTitle, { color: colors.accent.gold, letterSpacing: 1.2, marginBottom: spacing.sm }]}>
            YOU COULD TREAT YOURSELF TO
          </Text>
          <Text style={[typography.h3, { color: colors.text.primary }]}>
            {`${unlockedTier.emoji}  ${unlockedTier.label}`}
          </Text>
        </Card>
      )}

      {nextTier && (
        <Card variant="flat">
          <View style={styles.rowBetween}>
            <Text style={[typography.caption, { color: colors.text.muted }]}>
              {`Save ${formatCurrency(nextTier.threshold - savedSoFar)} more to unlock`}
            </Text>
            <Text style={[typography.captionBold, { color: colors.text.secondary }]}>
              {`${nextTier.emoji} ${nextTier.label}`}
            </Text>
          </View>
          <ProgressBar
            progress={nextTier.threshold > 0 ? Math.min(savedSoFar / nextTier.threshold, 1) : 1}
            color={colors.accent.gold}
            height={4}
            style={{ marginTop: spacing.sm }}
          />
        </Card>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  centerBlock: { alignItems: 'center' },
  rowBetween:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
