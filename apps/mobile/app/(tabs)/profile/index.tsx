// =============================================================================
// TRANSFORMR -- Profile & Settings Screen
// =============================================================================

import React, { useCallback, useMemo } from 'react';
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
import { Badge } from '@components/ui/Badge';
import { MonoText } from '@components/ui/MonoText';
import { useProfileStore } from '@stores/profileStore';
import { useSettingsStore } from '@stores/settingsStore';
import { useAuthStore } from '@stores/authStore';
import { AIInsightCard } from '@components/cards/AIInsightCard';
import { useGamificationStyle } from '@hooks/useGamificationStyle';
import { formatDate, formatNumber } from '@utils/formatters';
import { hapticLight, hapticMedium } from '@utils/haptics';

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
// Main Screen
// ---------------------------------------------------------------------------
export default function ProfileScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const profile = useProfileStore((s) => s.profile);
  const settings = useSettingsStore();
  const signOut = useAuthStore((s) => s.signOut);
  const { mode: gamificationMode, toggleMode: toggleGamificationMode } = useGamificationStyle();

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

      {/* Settings */}
      <SectionHeader title="Preferences" />
      <Animated.View entering={FadeInDown.delay(100).duration(400)}>
        <SettingsRow
          icon={gamificationMode === 'competitive' ? '🏆' : '🌱'}
          label="Mode"
          accessibilityLabel="Toggle gamification mode"
          rightElement={
            <View style={{ alignItems: 'flex-end' }}>
              <Toggle
                value={gamificationMode === 'competitive'}
                onValueChange={() => toggleGamificationMode()}
              />
              <Text
                style={[
                  typography.tiny,
                  { color: colors.text.muted, marginTop: 2 },
                ]}
              >
                {gamificationMode === 'competitive' ? 'Competitive' : 'Supportive'}
              </Text>
            </View>
          }
        />
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
});
