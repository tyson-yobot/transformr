// =============================================================================
// ReferralCodeCard.tsx — Displays referral code with copy/share actions
// =============================================================================
import React from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme/index';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface ReferralCodeCardProps {
  code: string;
  onShare: () => void;
  onCopy: () => void;
  loading?: boolean;
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export const ReferralCodeCard: React.FC<ReferralCodeCardProps> = ({
  code,
  onShare,
  onCopy,
  loading = false,
}) => {
  const { colors, typography, spacing, borderRadius } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.background.secondary,
          borderRadius: borderRadius.xl,
          padding: spacing.lg,
          borderWidth: 1,
          borderColor: colors.accent.primary + '40',
        },
      ]}
    >
      {/* Purple glow border effect */}
      <View
        style={[
          styles.glowBorder,
          {
            borderRadius: borderRadius.xl,
            borderColor: colors.accent.primary + '25',
          },
        ]}
      />

      <Text
        style={[
          styles.label,
          {
            color: colors.text.secondary,
            fontSize: typography.sizes.sm,
            fontWeight: typography.weights.medium as '500',
            marginBottom: spacing.sm,
          },
        ]}
      >
        Your Referral Code
      </Text>

      {loading ? (
        <ActivityIndicator
          size="large"
          color={colors.accent.primary}
          style={{ marginVertical: spacing.md }}
        />
      ) : (
        <Text
          style={[
            styles.code,
            {
              color: colors.text.primary,
              fontSize: 28,
              fontWeight: typography.weights.bold as '700',
              letterSpacing: 4,
              marginBottom: spacing.lg,
            },
          ]}
          selectable
          accessibilityLabel={`Referral code: ${code}`}
        >
          {code}
        </Text>
      )}

      {/* Action buttons */}
      <View style={[styles.actions, { gap: spacing.sm }]}>
        <Pressable
          onPress={onCopy}
          disabled={loading}
          style={({ pressed }) => [
            styles.actionButton,
            {
              backgroundColor: pressed
                ? colors.accent.primary + '30'
                : colors.accent.primary + '15',
              borderRadius: borderRadius.lg,
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.md,
              opacity: loading ? 0.5 : 1,
            },
          ]}
          accessibilityLabel="Copy referral code"
          accessibilityRole="button"
        >
          <Ionicons
            name="copy-outline"
            size={20}
            color={colors.accent.primary}
            style={{ marginRight: spacing.xs }}
          />
          <Text
            style={{
              color: colors.accent.primary,
              fontSize: typography.sizes.sm,
              fontWeight: typography.weights.semibold as '600',
            }}
          >
            Copy
          </Text>
        </Pressable>

        <Pressable
          onPress={onShare}
          disabled={loading}
          style={({ pressed }) => [
            styles.actionButton,
            {
              backgroundColor: pressed
                ? colors.accent.primary
                : colors.accent.primary + 'E6',
              borderRadius: borderRadius.lg,
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.md,
              opacity: loading ? 0.5 : 1,
            },
          ]}
          accessibilityLabel="Share referral code"
          accessibilityRole="button"
        >
          <Ionicons
            name="share-outline"
            size={20}
            color="#FFFFFF"
            style={{ marginRight: spacing.xs }}
          />
          <Text
            style={{
              color: '#FFFFFF',
              fontSize: typography.sizes.sm,
              fontWeight: typography.weights.semibold as '600',
            }}
          >
            Share
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

// -----------------------------------------------------------------------------
// Styles
// -----------------------------------------------------------------------------

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    alignItems: 'center',
  },
  glowBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
  },
  label: {
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  code: {
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    width: '100%',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
});

export default ReferralCodeCard;
