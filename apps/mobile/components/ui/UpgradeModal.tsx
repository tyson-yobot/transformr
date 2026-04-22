// =============================================================================
// TRANSFORMR — UpgradeModal (rebuilt)
//
// Triggered via upgradeModalEvents.emit(featureKey) from useFeatureGate.
// Place <UpgradeModal /> inside app/(tabs)/_layout.tsx above all screens.
// No props — subscribes internally to upgradeModalEvents.
// =============================================================================

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions, Modal, Pressable, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import Animated, {
  useAnimatedStyle, useSharedValue, withSpring, withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@theme/index';
import { upgradeModalEvents, FeatureKey, useFeatureGate } from '../../hooks/useFeatureGate';
import { useSubscriptionStore } from '../../stores/subscriptionStore';
import type { SubscriptionTier } from '../../stores/subscriptionStore';
import { createSubscription } from '../../services/stripe';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type UpgradeTier = 'pro' | 'elite' | 'partners';
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const TIER_CTA: Record<UpgradeTier, string> = {
  pro:      'Unlock Pro — Start Transforming',
  elite:    'Go Elite — See Your Future',
  partners: 'Train Together — Go Partners',
};

const TIER_MONTHLY: Record<UpgradeTier, string> = {
  pro: '$9.99', elite: '$14.99', partners: '$19.99',
};
const TIER_ANNUAL_MONTHLY: Record<UpgradeTier, string> = {
  pro: '$6.67', elite: '$10.00', partners: '$13.33',
};
const TIER_ANNUAL_TOTAL: Record<UpgradeTier, string> = {
  pro: '$79.99', elite: '$119.99', partners: '$159.99',
};
const TIER_ANNUAL_SAVINGS: Record<UpgradeTier, string> = {
  pro: 'save $39.89/yr', elite: 'save $59.89/yr', partners: 'save $79.89/yr',
};

const TIER_FEATURES: Record<UpgradeTier, string[]> = {
  pro: [
    'AI Adaptive Programming — rewrites your program after every session',
    'AI Meal Camera — snap food, macros log instantly',
    'AI Grocery Lists — weekly shopping from your meal plan',
    'Unlimited Habits — no 3-habit cap',
    'Streak Shields — protect your streak once per month',
    'Unlimited Data History — no 7-day cutoff',
    'AI Daily Coaching — personalized cues every morning',
    'AI Journal Prompts — guided reflection tied to your data',
    'Mood \u00d7 Performance Correlation — weekly pattern reports',
    'AI Workout Narrator — rep-by-rep audio coaching',
    'Deep Work Focus Mode — distraction-free sessions',
    'Leaderboards — compete with the community',
    'Business & Finance Tracking — body and wallet in one app',
    'Spotify Integration — seamless workout playlists',
    'Home Screen Widgets — glanceable stats without opening the app',
  ],
  elite: [
    'Everything in Pro, plus:',
    'AI Trajectory Simulator — see where you\'ll be in 12 months',
    'AI Form Check Video — instant rep-by-rep feedback',
    'Ghost Mode Training — race your best self',
    'AI Body Composition Analysis — progress photo measurement',
    'Daily Mood \u00d7 Performance — not just weekly',
    'AI Sleep Optimizer — data-backed sleep protocol',
    'AI Vision Board — visual identity built from your goals',
    'AI Supplement Advisor — protocol optimized for your data',
    'Custom Dashboard Builder — drag-and-drop your stats',
    'Apple Watch Companion — full sync without phone',
    'AI Weekly Report — deep dive every Sunday',
    'NFC & Geofence Triggers — automate from your environment',
  ],
  partners: [
    'Everything in Elite, for two people:',
    'Partner Linking — connect one partner account',
    'Partner Dashboard — see their streaks and check-ins',
    'Live Sync Workouts — train together in real time',
    'Joint Streaks — shared accountability streak',
    'Partner Nudges — gentle pokes when they go quiet',
    'Partner Challenges — head-to-head goal races',
    'Partner Activity Feed — live updates from their sessions',
    'Partner Reactions — emoji reactions on their wins',
    'Shared Vision Board — combined future, built together',
    'Couples Weekly Review — joint progress recap every Sunday',
  ],
};

const TIER_LABELS: Record<UpgradeTier, string> = {
  pro: 'Pro', elite: 'Elite', partners: 'Partners',
};

const TIER_RANK: Record<SubscriptionTier, number> = {
  free: 0, pro: 1, elite: 2, partners: 3,
};

function getUpgradeTabs(currentTier: SubscriptionTier): UpgradeTier[] {
  const all: UpgradeTier[] = ['pro', 'elite', 'partners'];
  return all.filter((t) => TIER_RANK[t] > TIER_RANK[currentTier]);
}

// ---------------------------------------------------------------------------
// Inner content
// ---------------------------------------------------------------------------

interface ModalContentProps {
  featureKey: FeatureKey;
  onClose: () => void;
}

function ModalContent({ featureKey, onClose }: ModalContentProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const currentTier = useSubscriptionStore((s) => s.tier);
  const { requiredTier } = useFeatureGate(featureKey);

  const tabs = getUpgradeTabs(currentTier);
  const defaultTab: UpgradeTier = tabs.includes(requiredTier as UpgradeTier)
    ? (requiredTier as UpgradeTier)
    : (tabs[0] ?? 'pro');

  const [selectedTab, setSelectedTab] = useState<UpgradeTier>(defaultTab);
  const [isAnnual, setIsAnnual] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleCTA = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    try {
      const result = await createSubscription(selectedTab, isAnnual ? 'annual' : 'monthly');
      if (!result.error) onClose();
    } finally {
      setIsLoading(false);
    }
  }, [selectedTab, isAnnual, onClose]);

  const price = isAnnual ? TIER_ANNUAL_MONTHLY[selectedTab] : TIER_MONTHLY[selectedTab];
  const savingsLine = isAnnual
    ? `${TIER_ANNUAL_TOTAL[selectedTab]}/yr \u00b7 ${TIER_ANNUAL_SAVINGS[selectedTab]}`
    : 'billed monthly';

  return (
    <View style={{ flex: 1 }}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingTop: spacing.md }]}>
        <Text
          style={[typography.h2, { color: colors.text.primary, flex: 1, fontWeight: '700' }]}
        >
          Unlock More
        </Text>
        <Pressable
          onPress={onClose}
          style={[styles.closeBtn, { backgroundColor: colors.background.tertiary, borderRadius: 22 }]}
          accessibilityLabel="Close upgrade modal"
          accessibilityRole="button"
        >
          <Text style={[typography.body, { color: colors.text.secondary, fontWeight: '600' }]}>
            {'\u2715'}
          </Text>
        </Pressable>
      </View>

      {/* Tier tabs */}
      {tabs.length > 1 && (
        <View style={[styles.tabs, { marginHorizontal: spacing.lg, gap: spacing.xs }]}>
          {tabs.map((tab) => (
            <Pressable
              key={tab}
              onPress={() => setSelectedTab(tab)}
              style={[
                styles.tab,
                {
                  backgroundColor: selectedTab === tab
                    ? colors.accent.primary
                    : colors.background.tertiary,
                  borderRadius: borderRadius.full,
                  flex: 1,
                },
              ]}
              accessibilityRole="tab"
              accessibilityState={{ selected: selectedTab === tab }}
              accessibilityLabel={`${TIER_LABELS[tab]} tab`}
            >
              <Text
                style={[
                  typography.captionBold,
                  { color: selectedTab === tab ? '#FFFFFF' : colors.text.secondary },
                ]}
              >
                {TIER_LABELS[tab]}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Price display */}
        <View style={{ marginTop: spacing.lg, marginBottom: spacing.sm }}>
          <Text style={[typography.h1, { color: colors.text.primary, fontWeight: '800' }]}>
            {price}
            <Text
              style={[typography.body, { color: colors.text.secondary, fontWeight: '400' }]}
            >
              {' '}/mo
            </Text>
          </Text>
          <Text style={[typography.caption, { color: colors.text.muted, marginTop: 2 }]}>
            {savingsLine}
          </Text>
        </View>

        {/* Annual toggle */}
        <Pressable
          onPress={() => setIsAnnual((v) => !v)}
          style={[
            styles.annualToggle,
            {
              backgroundColor: isAnnual ? colors.dim.primary : colors.background.tertiary,
              borderColor: isAnnual ? colors.accent.primary : colors.border.default,
              borderRadius: borderRadius.md,
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.md,
              marginBottom: spacing.lg,
            },
          ]}
          accessibilityRole="switch"
          accessibilityState={{ checked: isAnnual }}
          accessibilityLabel={
            isAnnual
              ? `Annual billing on \u2014 ${TIER_ANNUAL_SAVINGS[selectedTab]}`
              : `Switch to annual \u2014 ${TIER_ANNUAL_SAVINGS[selectedTab]}`
          }
        >
          <View style={styles.toggleRow}>
            <View
              style={[
                styles.toggleDot,
                { backgroundColor: isAnnual ? colors.accent.primary : colors.text.muted },
              ]}
            />
            <Text
              style={[typography.body, { color: colors.text.primary, marginLeft: spacing.sm }]}
            >
              Annual{' '}
              <Text style={{ color: colors.accent.success, fontWeight: '700' }}>
                \u00b7 {TIER_ANNUAL_SAVINGS[selectedTab]}
              </Text>
            </Text>
          </View>
        </Pressable>

        {/* Feature list */}
        {TIER_FEATURES[selectedTab].map((line) => (
          <View key={line} style={[styles.featureLine, { marginBottom: spacing.xs }]}>
            <Text
              style={[
                typography.caption,
                { color: colors.accent.primary, marginRight: spacing.xs, marginTop: 1 },
              ]}
            >
              \u00b7
            </Text>
            <Text style={[typography.body, { color: colors.text.secondary, flex: 1 }]}>
              {line}
            </Text>
          </View>
        ))}

        {/* CTA */}
        <TouchableOpacity
          onPress={handleCTA}
          disabled={isLoading}
          style={[
            styles.cta,
            {
              backgroundColor: isLoading
                ? colors.accent.primaryDark
                : colors.accent.primary,
              borderRadius: borderRadius.md,
              marginTop: spacing.lg,
              height: 52,
            },
          ]}
          accessibilityLabel={TIER_CTA[selectedTab]}
          accessibilityRole="button"
          accessibilityState={{ disabled: isLoading, busy: isLoading }}
        >
          <Text style={[typography.h3, { color: '#FFFFFF', fontWeight: '700' }]}>
            {isLoading ? 'Processing\u2026' : TIER_CTA[selectedTab]}
          </Text>
        </TouchableOpacity>

        <Text
          style={[
            typography.caption,
            { color: colors.text.muted, textAlign: 'center', marginTop: spacing.md },
          ]}
        >
          Cancel anytime \u00b7 Secure payment by Stripe
        </Text>
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Shell — subscribes to upgradeModalEvents
// ---------------------------------------------------------------------------

export function UpgradeModal() {
  const { colors } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [featureKey, setFeatureKey] = useState<FeatureKey>('ai_chat_coach');
  const featureKeyRef = useRef<FeatureKey>('ai_chat_coach');

  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  const open = useCallback(
    (feature: FeatureKey) => {
      featureKeyRef.current = feature;
      setFeatureKey(feature);
      setIsVisible(true);
      backdropOpacity.value = withTiming(1, { duration: 250 });
      translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
    },
    [backdropOpacity, translateY],
  );

  const close = useCallback(() => {
    backdropOpacity.value = withTiming(0, { duration: 200 });
    translateY.value = withSpring(SCREEN_HEIGHT, { damping: 20, stiffness: 200 });
    setTimeout(() => setIsVisible(false), 300);
  }, [backdropOpacity, translateY]);

  useEffect(() => {
    upgradeModalEvents.setListener(open);
    return () => {
      upgradeModalEvents.setListener(null);
    };
  }, [open]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={close}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={close}
            accessibilityLabel="Dismiss upgrade modal"
            accessibilityRole="button"
          />
        </Animated.View>
        <Animated.View
          style={[
            styles.sheet,
            { backgroundColor: colors.background.primary },
            sheetStyle,
          ]}
        >
          <View style={styles.handleContainer}>
            <View style={[styles.handle, { backgroundColor: colors.border.default }]} />
          </View>
          <ModalContent featureKey={featureKey} onClose={close} />
        </Animated.View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  overlay:         { flex: 1, justifyContent: 'flex-end' },
  backdrop:        { backgroundColor: 'rgba(0,0,0,0.8)' },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.88,
  },
  handleContainer: { alignItems: 'center', paddingTop: 12, paddingBottom: 4 },
  handle:          { width: 36, height: 4, borderRadius: 2 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  closeBtn:        { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  tabs:            { flexDirection: 'row', marginTop: 8 },
  tab:             { paddingVertical: 8, alignItems: 'center', justifyContent: 'center' },
  annualToggle:    { borderWidth: 1.5 },
  toggleRow:       { flexDirection: 'row', alignItems: 'center' },
  toggleDot:       { width: 20, height: 20, borderRadius: 10 },
  featureLine:     { flexDirection: 'row', alignItems: 'flex-start' },
  cta:             { alignItems: 'center', justifyContent: 'center' },
});
