// =============================================================================
// TRANSFORMR -- Profile & Settings Screen
// =============================================================================

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@theme/index';
import { StatusBar } from 'expo-status-bar';
import type { ThemeMode } from '@theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@components/ui/Card';
import { Toggle } from '@components/ui/Toggle';
import { MonoText } from '@components/ui/MonoText';
import { Avatar } from '@components/ui/Avatar';
import { ProgressBar } from '@components/ui/ProgressBar';
import { SectionTile } from '@components/ui/SectionTile';
import { useProfileStore } from '@stores/profileStore';
import { useSettingsStore } from '@stores/settingsStore';
import { useAuthStore } from '@stores/authStore';
import { useHabitStore } from '@stores/habitStore';
import { useSubscriptionStore } from '@stores/subscriptionStore';
import { AIInsightCard } from '@components/cards/AIInsightCard';
import { useGamificationStyle, CoachingTone } from '@hooks/useGamificationStyle';
import { upgradeModalEvents } from '@hooks/useFeatureGate';
import { formatNumber } from '@utils/formatters';
import { hapticLight, hapticMedium } from '@utils/haptics';
import { HelpBubble } from '@components/ui/HelpBubble';
import { supabase } from '../../../services/supabase';
import { ScreenHelpButton } from '@components/ui/ScreenHelpButton';
import { SCREEN_HELP } from '../../../constants/screenHelp';

// ---------------------------------------------------------------------------
// Appearance segmented control
// ---------------------------------------------------------------------------
const THEME_OPTIONS = [
  { value: 'dark'   as ThemeMode, icon: 'moon-outline'     as keyof typeof Ionicons.glyphMap, label: 'Dark' },
  { value: 'light'  as ThemeMode, icon: 'sunny-outline'    as keyof typeof Ionicons.glyphMap, label: 'Light' },
  { value: 'system' as ThemeMode, icon: 'settings-outline' as keyof typeof Ionicons.glyphMap, label: 'System' },
] as const;

function AppearancePicker() {
  const { spacing, mode, setMode } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xs }}>
      {THEME_OPTIONS.map((opt) => (
        <SectionTile
          key={opt.value}
          icon={opt.icon}
          label={opt.label}
          size="sm"
          isSelected={mode === opt.value}
          onPress={() => setMode(opt.value)}
        />
      ))}
    </View>
  );
}
// ---------------------------------------------------------------------------
// Section Header
// ---------------------------------------------------------------------------
function SectionHeader({ title, danger = false }: { title: string; danger?: boolean }) {
  const { colors, typography, spacing } = useTheme();
  return (
    <Text
      style={[
        typography.sectionTitle,
        {
          color: danger ? colors.accent.danger : colors.accent.primary,
          textTransform: 'uppercase',
          marginTop: spacing.xl,
          marginBottom: spacing.sm,
          marginLeft: spacing.xs,
        },
      ]}
    >
      {title}
    </Text>
  );
}

// ---------------------------------------------------------------------------
// Row item
// ---------------------------------------------------------------------------
interface SettingsRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  label: string;
  value?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  danger?: boolean;
  iconBg?: string;
  accessibilityLabel?: string;
}

function SettingsRow({
  icon,
  iconColor,
  label,
  value,
  onPress,
  rightElement,
  danger = false,
  iconBg,
  accessibilityLabel: a11yLabel,
}: SettingsRowProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();

  const iconBackground = iconBg ?? (danger ? colors.accent.dangerSubtle : colors.accent.primarySubtle);
  const resolvedIconColor = iconColor ?? (danger ? colors.accent.danger : colors.accent.primary);

  const content = (
    <View
      style={[
        styles.settingsRow,
        {
          backgroundColor: colors.background.secondary,
          borderRadius: borderRadius.md,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
          marginBottom: spacing.xs,
          minHeight: 52,
          ...colors.shadow.cardSubtle,
        },
      ]}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          backgroundColor: iconBackground,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: spacing.md,
        }}
      >
        <Ionicons name={icon} size={20} color={resolvedIconColor} />
      </View>
      <Text
        style={[
          typography.body,
          {
            color: danger ? colors.accent.danger : colors.text.primary,
            flex: 1,
          },
        ]}
      >
        {label}
      </Text>
      {rightElement ?? (
        <>
          {value && (
            <Text
              style={[
                typography.caption,
                { color: colors.text.secondary, marginRight: spacing.sm },
              ]}
            >
              {value}
            </Text>
          )}
          {onPress && (
            <Text style={[typography.body, { color: colors.text.muted }]}>
              {'\u203A'}
            </Text>
          )}
        </>
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={() => {
          void hapticLight();
          onPress();
        }}
        accessibilityRole="button"
        accessibilityLabel={a11yLabel ?? label}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

// ---------------------------------------------------------------------------
// Tier Badge
// ---------------------------------------------------------------------------
const TIER_LABELS: Record<string, string> = {
  free: 'Free',
  pro: 'Pro',
  elite: 'Elite',
  partners: 'Partners',
};

const TIER_NEXT_FEATURE: Record<string, Parameters<typeof upgradeModalEvents.emit>[0]> = {
  free: 'ai_insights',
  pro: 'business_tracking',
  elite: 'partner_features',
  partners: 'partner_features',
};

function TierBadge({ tier }: { tier: string }) {
  const { colors, typography, spacing, borderRadius } = useTheme();

  const handlePress = useCallback(() => {
    void hapticMedium();
    const featureKey = TIER_NEXT_FEATURE[tier] ?? 'ai_insights';
    upgradeModalEvents.emit(featureKey);
  }, [tier]);

  const badgeColor =
    tier === 'partners'
      ? colors.accent.fire
      : tier === 'elite'
        ? colors.accent.secondary
        : tier === 'pro'
          ? colors.accent.primary
          : colors.text.muted;

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`Subscription tier: ${TIER_LABELS[tier] ?? tier}. Tap to upgrade.`}
      style={[
        styles.tierBadge,
        {
          backgroundColor: `${badgeColor}20`,
          borderColor: badgeColor,
          borderRadius: borderRadius.full,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs,
        },
      ]}
    >
      <Text style={[typography.captionBold, { color: badgeColor }]}>
        {TIER_LABELS[tier] ?? tier.toUpperCase()}
      </Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// XP Progress Bar
// ---------------------------------------------------------------------------
const XP_PER_LEVEL = 500;

function XpProgressBar({ xp }: { xp: number }) {
  const { colors, typography, spacing } = useTheme();
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const xpIntoLevel = xp % XP_PER_LEVEL;
  const progress = xpIntoLevel / XP_PER_LEVEL;

  return (
    <View style={{ marginTop: spacing.sm }}>
      <View style={[styles.xpLabelRow, { marginBottom: spacing.xs }]}>
        <Text style={[typography.tiny, { color: colors.text.muted }]}>
          Level {level}
        </Text>
        <MonoText variant="monoCaption" color={colors.accent.primary}>
          {formatNumber(xpIntoLevel)} / {formatNumber(XP_PER_LEVEL)} XP
        </MonoText>
      </View>
      <ProgressBar
        progress={progress}
        color={colors.accent.primary}
        height={6}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Coaching Tone Options
// ---------------------------------------------------------------------------
interface CoachingToneOption {
  id: CoachingTone;
  label: string;
  icon: string;
  description: string;
  example: string;
}

const COACHING_TONES: CoachingToneOption[] = [
  {
    id: 'drill_sergeant',
    label: 'Drill Sergeant',
    icon: '🎖️',
    description: 'Intense, no-excuses accountability. Calls you out directly.',
    example: "You said you'd do it. You didn't. Fix that tomorrow.",
  },
  {
    id: 'motivational',
    label: 'Motivational Builder',
    icon: '🔥',
    description: 'Hypes you up, builds you up. Celebrates every win.',
    example: "You showed up 4 out of 5 days — that's ELITE. Keep pushing!",
  },
  {
    id: 'balanced',
    label: 'Balanced Coach',
    icon: '📊',
    description: 'Data-driven, professional. Gives you the numbers straight.',
    example: "Your consistency is 87% this week. 13% gap to close.",
  },
  {
    id: 'calm',
    label: 'Calm Supporter',
    icon: '🌿',
    description: 'Gentle, patient, no pressure. Celebrates effort over results.',
    example: "You've been showing up. That consistency is building something real.",
  },
];

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------
export default function ProfileScreen() {
  const { colors, typography, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();

  const profile = useProfileStore((s) => s.profile);
  const settings = useSettingsStore();
  const signOut = useAuthStore((s) => s.signOut);
  const { tone: selectedTone, setTone } = useGamificationStyle();
  const tier = useSubscriptionStore((s) => s.tier);

  // Top streak from habitStore
  const habits = useHabitStore((s) => s.habits);
  const topStreak = useMemo(
    () => Math.max(0, ...habits.map((h) => h.current_streak ?? 0)),
    [habits],
  );


  // Days tracked since account creation
  const daysTracked = useMemo(() => {
    if (!profile?.created_at) return 0;
    const created = new Date(profile.created_at);
    const now = new Date();
    return Math.max(
      0,
      Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)),
    );
  }, [profile?.created_at]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => <ScreenHelpButton content={SCREEN_HELP.profileHome} />,
    });
  }, [navigation]);

  // Total workout sessions
  const [totalWorkouts, setTotalWorkouts] = useState(0);

  useEffect(() => {
    const fetchWorkoutCount = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { count } = await supabase
        .from('workout_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);
      if (count != null) setTotalWorkouts(count);
    };
    void fetchWorkoutCount();
  }, []);

  // XP (derive from profile if available, else 0)
  const xp = (profile as unknown as { xp?: number })?.xp ?? 0;

  const handleSignOut = useCallback(() => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          void hapticMedium();
          void signOut();
        },
      },
    ]);
  }, [signOut]);

  // Avatar source from profile avatar_url if present
  const avatarSource = (profile as unknown as { avatar_url?: string })?.avatar_url
    ? { uri: (profile as unknown as { avatar_url: string }).avatar_url }
    : undefined;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.primary }}>
    <StatusBar style="light" backgroundColor="#0C0A15" />
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background.primary }]}
      contentContainerStyle={{
        paddingTop: spacing.lg,
        paddingBottom: insets.bottom + 100,
        paddingHorizontal: spacing.lg,
      }}
      showsVerticalScrollIndicator={false}
    >
      <AIInsightCard screenKey="profile/index" style={{ marginBottom: spacing.md }} />

      {/* Avatar + Name + Email + Tier */}
      <Animated.View
        entering={FadeInDown.duration(400)}
        style={[styles.profileHeader, { marginBottom: spacing.md }]}
      >
        <View style={{
          padding: 3,
          borderRadius: 999,
          borderWidth: 3,
          borderColor: colors.accent.primary,
          shadowColor: colors.accent.primary,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.35,
          shadowRadius: 14,
          elevation: 8,
        }}>
          <Avatar
            source={avatarSource}
            name={profile?.display_name ?? undefined}
            size="xl"
          />
        </View>
        <View style={{ marginLeft: spacing.lg, flex: 1 }}>
          <Text
            style={[typography.h2, { color: colors.text.primary }]}
            numberOfLines={1}
          >
            {profile?.display_name ?? 'User'}
          </Text>
          <Text
            style={[typography.caption, { color: colors.text.secondary }]}
            numberOfLines={1}
          >
            {profile?.email ?? ''}
          </Text>
          <View style={{ marginTop: spacing.xs }}>
            <TierBadge tier={tier} />
          </View>
        </View>
      </Animated.View>

      {/* XP Progress Bar */}
      <Animated.View entering={FadeInDown.delay(30).duration(400)} style={{ marginBottom: spacing.lg }}>
        <XpProgressBar xp={xp} />
      </Animated.View>

      {/* Stats Row */}
      <Animated.View entering={FadeInDown.delay(50).duration(400)}>
        <Card variant="elevated" style={{ marginBottom: spacing.lg }}>
          <View style={styles.statsGrid}>
            <StatBlock
              label="Workouts"
              value={formatNumber(totalWorkouts)}
            />
            <StatBlock
              label="Days Tracked"
              value={formatNumber(daysTracked)}
            />
            <StatBlock
              label="Top Streak"
              value={`${formatNumber(topStreak)}d`}
            />
          </View>
        </Card>
      </Animated.View>

      {/* Coaching Style */}
      <SectionHeader title="Coaching Style" />
      <Animated.View entering={FadeInDown.delay(100).duration(400)} style={{ marginBottom: spacing.lg }}>
        {COACHING_TONES.map((toneOption) => {
          const isSelected = selectedTone === toneOption.id;
          return (
            <Pressable
              key={toneOption.id}
              onPress={() => {
                void hapticLight();
                setTone(toneOption.id);
              }}
              accessibilityRole="radio"
              accessibilityLabel={toneOption.label}
              accessibilityState={{ selected: isSelected }}
              style={[
                styles.toneOption,
                {
                  backgroundColor: isSelected ? colors.accent.primarySubtle : colors.background.secondary,
                  borderColor: isSelected ? colors.accent.primary : colors.border.default,
                  borderRadius: 12,
                  marginBottom: spacing.xs,
                  ...(isSelected ? colors.shadow.card : colors.shadow.cardSubtle),
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <View style={styles.toneLabelRow}>
                  <Text style={{ fontSize: 18, marginRight: spacing.sm }}>{toneOption.icon}</Text>
                  <Text style={[typography.bodyBold, { color: colors.text.primary }]}>
                    {toneOption.label}
                  </Text>
                </View>
                <Text
                  style={[typography.caption, { color: colors.text.secondary, marginTop: 2 }]}
                >
                  {toneOption.description}
                </Text>
                <Text
                  style={[typography.caption, { color: colors.text.muted, marginTop: 4, fontStyle: 'italic' }]}
                  numberOfLines={2}
                >
                  "{toneOption.example}"
                </Text>
              </View>
              {isSelected && (
                <Text style={{ fontSize: 20, color: colors.accent.primary, marginLeft: spacing.sm }}>
                  ✓
                </Text>
              )}
            </Pressable>
          );
        })}
      </Animated.View>
      <HelpBubble id="profile_coaching" message="Choose how your AI coach talks to you" position="below" />

      {/* Settings */}
      <SectionHeader title="Appearance" />
      <Animated.View entering={FadeInDown.delay(100).duration(400)}>
        <AppearancePicker />
      </Animated.View>

      <SectionHeader title="Preferences" />
      <Animated.View entering={FadeInDown.delay(100).duration(400)}>
        <SettingsRow
          icon="notifications-outline"
          iconColor={colors.accent.warning}
          label="Notification Settings"
          iconBg={colors.dim.warning}
          onPress={() => router.push('/(tabs)/profile/notifications-settings')}
        />
        <SettingsRow
          icon="mic-outline"
          iconColor={colors.accent.info}
          label="Voice Commands"
          iconBg={colors.dim.info}
          accessibilityLabel="Toggle voice commands"
          rightElement={
            <Toggle
              value={settings.voiceEnabled}
              onValueChange={(v) => settings.updateSetting('voiceEnabled', v)}
            />
          }
        />
        <SettingsRow
          icon="mic-outline"
          iconColor={colors.accent.primary}
          label="Narrator"
          iconBg={colors.dim.primary}
          accessibilityLabel="Toggle narrator"
          rightElement={
            <Toggle
              value={settings.narratorEnabled}
              onValueChange={(v) =>
                settings.updateSetting('narratorEnabled', v)
              }
            />
          }
        />
        <SettingsRow
          icon="resize-outline"
          iconColor={colors.accent.primary}
          label="Units"
          value="Imperial"
          onPress={() => {
            hapticLight();
            Alert.alert('Units', 'Metric/imperial toggle coming in a future update.');
          }}
        />
      </Animated.View>

      <SectionHeader title="Features" />
      <Animated.View entering={FadeInDown.delay(150).duration(400)}>
        <SettingsRow
          icon="people-outline"
          iconColor={colors.accent.pink}
          label="Partner"
          iconBg={colors.dim.pink}
          onPress={() => router.push('/(tabs)/profile/partner')}
        />
        <SettingsRow
          icon="trophy-outline"
          iconColor={colors.accent.gold}
          label="Achievements"
          iconBg={colors.dim.gold}
          onPress={() => router.push('/(tabs)/profile/achievements')}
        />
        <SettingsRow
          icon="grid-outline"
          iconColor={colors.accent.primary}
          label="Customize Dashboard"
          iconBg={colors.dim.primary}
          onPress={() => router.push('/(tabs)/profile/dashboard-builder')}
        />
        <SettingsRow
          icon="radio-outline"
          iconColor={colors.accent.cyan}
          label="NFC Triggers"
          iconBg={colors.dim.cyan}
          onPress={() => router.push('/(tabs)/profile/nfc-setup')}
        />
        <SettingsRow
          icon="link-outline"
          iconColor={colors.accent.info}
          label="Integrations"
          iconBg={colors.dim.info}
          onPress={() => router.push('/(tabs)/profile/integrations')}
        />
      </Animated.View>

      <SectionHeader title="Account" danger />
      <Animated.View entering={FadeInDown.delay(200).duration(400)}>
        <SettingsRow
          icon="create-outline"
          iconColor={colors.accent.primary}
          label="Edit Profile"
          onPress={() => {
            hapticLight();
            router.push('/(tabs)/profile/edit-profile' as never);
          }}
        />
        <SettingsRow
          icon="key-outline"
          iconColor={colors.accent.warning}
          label="Change Password"
          iconBg={colors.dim.warning}
          onPress={() => {
            hapticLight();
            const email = useAuthStore.getState().user?.email;
            if (!email) return;
            Alert.alert(
              'Reset Password',
              `We'll send a reset link to ${email}`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Send Link',
                  onPress: async () => {
                    try {
                      const { supabase: sb } = await import('@services/supabase');
                      const { error: resetError } = await sb.auth.resetPasswordForEmail(email);
                      if (resetError) throw resetError;
                      Alert.alert('Email Sent', 'Check your inbox for a password reset link.');
                    } catch (err: unknown) {
                      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to send reset link. Please try again.');
                    }
                  },
                },
              ],
            );
          }}
        />
        <SettingsRow
          icon="log-out-outline"
          label="Sign Out"
          danger
          onPress={handleSignOut}
        />
      </Animated.View>

      <SectionHeader title="Data" />
      <Animated.View entering={FadeInDown.delay(250).duration(400)}>
        <SettingsRow
          icon="download-outline"
          iconColor={colors.accent.success}
          label="Export Data"
          iconBg={colors.dim.success}
          onPress={() => router.push('/(tabs)/profile/data-export')}
        />
        <SettingsRow
          icon="lock-closed-outline"
          iconColor={colors.accent.primary}
          label="Privacy"
          iconBg={colors.dim.primary}
          onPress={() => {
            hapticLight();
            router.push('/(tabs)/profile/about' as never);
          }}
        />
        <SettingsRow
          icon="information-circle-outline"
          iconColor={colors.accent.primary}
          label="About"
          iconBg={colors.dim.primary}
          onPress={() => router.push('/(tabs)/profile/about')}
        />
      </Animated.View>
    </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Stat Block
// ---------------------------------------------------------------------------
function StatBlock({ label, value }: { label: string; value: string }) {
  const { colors, typography, spacing } = useTheme();
  return (
    <View style={styles.statBlock}>
      <MonoText
        variant="statSmall"
        color={colors.text.primary}
        numberOfLines={1}
      >
        {value}
      </MonoText>
      <Text
        style={[
          typography.tiny,
          { color: colors.text.muted, marginTop: spacing.xs },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  xpLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tierBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statBlock: {
    width: '33.33%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toneOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 2,
  },
  toneLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
});
