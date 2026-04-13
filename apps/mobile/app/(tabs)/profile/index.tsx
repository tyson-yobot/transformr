// =============================================================================
// TRANSFORMR -- Profile & Settings Screen
// =============================================================================

import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@theme/index';
import type { ThemeMode } from '@theme/colors';
import { Card } from '@components/ui/Card';
import { Toggle } from '@components/ui/Toggle';
import { MonoText } from '@components/ui/MonoText';
import { useProfileStore } from '@stores/profileStore';
import { useSettingsStore } from '@stores/settingsStore';
import { useAuthStore } from '@stores/authStore';
import { AIInsightCard } from '@components/cards/AIInsightCard';
import { useGamificationStyle, CoachingTone } from '@hooks/useGamificationStyle';
import { formatDate, formatNumber } from '@utils/formatters';
import { hapticLight, hapticMedium } from '@utils/haptics';
import { HelpBubble } from '@components/ui/HelpBubble';

// ---------------------------------------------------------------------------
// Section Header
// ---------------------------------------------------------------------------
function SectionHeader({ title }: { title: string }) {
  const { colors, typography, spacing } = useTheme();
  return (
    <Text
      style={[
        typography.captionBold,
        {
          color: colors.text.muted,
          textTransform: 'uppercase',
          letterSpacing: 1.2,
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
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  danger?: boolean;
  accessibilityLabel?: string;
}

function SettingsRow({
  icon,
  label,
  value,
  onPress,
  rightElement,
  danger = false,
  accessibilityLabel: a11yLabel,
}: SettingsRowProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();

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
        },
      ]}
    >
      <Text style={{ fontSize: 18, marginRight: spacing.md }}>{icon}</Text>
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

  const profile = useProfileStore((s) => s.profile);
  const settings = useSettingsStore();
  const signOut = useAuthStore((s) => s.signOut);
  const { tone: selectedTone, setTone } = useGamificationStyle();

  // Theme cycle
  const themeOptions: ThemeMode[] = ['dark', 'light', 'system'];
  const currentThemeLabel = settings.theme.charAt(0).toUpperCase() + settings.theme.slice(1);

  const handleThemeCycle = useCallback(() => {
    const currentIdx = themeOptions.indexOf(settings.theme);
    const nextIdx = (currentIdx + 1) % themeOptions.length;
    const nextTheme = themeOptions[nextIdx] as ThemeMode;
    settings.updateSetting('theme', nextTheme);
    void hapticLight();
  }, [settings, themeOptions]);

  // Stats
  const memberSince = profile?.created_at
    ? formatDate(profile.created_at)
    : 'N/A';

  const totalWorkouts = 0; // placeholder; would come from a query

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

  return (
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

      {/* Avatar + Name + Email */}
      <Animated.View
        entering={FadeInDown.duration(400)}
        style={[styles.profileHeader, { marginBottom: spacing.xl }]}
      >
        <View
          style={[
            styles.avatar,
            {
              backgroundColor: colors.accent.primary,
              borderRadius: 40,
            },
          ]}
        >
          <Text style={{ fontSize: 32 }}>
            {profile?.display_name?.charAt(0)?.toUpperCase() ?? '?'}
          </Text>
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
        </View>
      </Animated.View>

      {/* Key Stats Card */}
      <Animated.View entering={FadeInDown.delay(50).duration(400)}>
        <Card variant="default" style={{ marginBottom: spacing.lg }}>
          <View style={styles.statsGrid}>
            <StatBlock label="Member Since" value={memberSince} />
            <StatBlock
              label="Total Workouts"
              value={formatNumber(totalWorkouts)}
            />
            <StatBlock
              label="Current Weight"
              value={
                profile?.current_weight
                  ? `${formatNumber(profile.current_weight, 1)} lbs`
                  : '--'
              }
            />
            <StatBlock label="Streak" value="0d" />
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
                  backgroundColor: colors.background.secondary,
                  borderColor: isSelected ? colors.accent.primary : 'transparent',
                  borderRadius: 12,
                  marginBottom: spacing.xs,
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
      <SectionHeader title="Preferences" />
      <Animated.View entering={FadeInDown.delay(100).duration(400)}>
        <SettingsRow
          icon="🎨"
          label="Theme"
          value={currentThemeLabel}
          onPress={handleThemeCycle}
        />
        <SettingsRow
          icon="🔔"
          label="Notification Settings"
          onPress={() => router.push('/(tabs)/profile/notifications-settings')}
        />
        <SettingsRow
          icon="🎙️"
          label="Voice Commands"
          accessibilityLabel="Toggle voice commands"
          rightElement={
            <Toggle
              value={settings.voiceEnabled}
              onValueChange={(v) => settings.updateSetting('voiceEnabled', v)}
            />
          }
        />
        <SettingsRow
          icon="📖"
          label="Narrator"
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
          icon="📏"
          label="Units"
          value="Imperial"
          onPress={() => {
            // Future: toggle metric/imperial
          }}
        />
      </Animated.View>

      <SectionHeader title="Features" />
      <Animated.View entering={FadeInDown.delay(150).duration(400)}>
        <SettingsRow
          icon="👫"
          label="Partner"
          onPress={() => router.push('/(tabs)/profile/partner')}
        />
        <SettingsRow
          icon="🏆"
          label="Achievements"
          onPress={() => router.push('/(tabs)/profile/achievements')}
        />
        <SettingsRow
          icon="📊"
          label="Customize Dashboard"
          onPress={() => router.push('/(tabs)/profile/dashboard-builder')}
        />
        <SettingsRow
          icon="📱"
          label="NFC Triggers"
          onPress={() => router.push('/(tabs)/profile/nfc-setup')}
        />
        <SettingsRow
          icon="🔗"
          label="Integrations"
          onPress={() => router.push('/(tabs)/profile/integrations')}
        />
      </Animated.View>

      <SectionHeader title="Account" />
      <Animated.View entering={FadeInDown.delay(200).duration(400)}>
        <SettingsRow
          icon="✏️"
          label="Edit Profile"
          onPress={() => {
            // Future: Edit profile screen
          }}
        />
        <SettingsRow
          icon="🔑"
          label="Change Password"
          onPress={() => {
            // Future: Change password flow
          }}
        />
        <SettingsRow
          icon="🚪"
          label="Sign Out"
          danger
          onPress={handleSignOut}
        />
      </Animated.View>

      <SectionHeader title="Data" />
      <Animated.View entering={FadeInDown.delay(250).duration(400)}>
        <SettingsRow
          icon="📤"
          label="Export Data"
          onPress={() => router.push('/(tabs)/profile/data-export')}
        />
        <SettingsRow
          icon="🔒"
          label="Privacy"
          onPress={() => {
            // Future: Privacy settings
          }}
        />
        <SettingsRow
          icon="ℹ️"
          label="About"
          onPress={() => router.push('/(tabs)/profile/about')}
        />
      </Animated.View>
    </ScrollView>
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
  avatar: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statBlock: {
    width: '50%',
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
