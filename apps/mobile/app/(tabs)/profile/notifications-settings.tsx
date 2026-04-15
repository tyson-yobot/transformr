// =============================================================================
// TRANSFORMR -- Notification Settings Screen
// =============================================================================

import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Toggle } from '@components/ui/Toggle';
import { useProfileStore } from '@stores/profileStore';
import { hapticLight } from '@utils/haptics';
import type { NotificationPreferences } from '@app-types/database';

// ---------------------------------------------------------------------------
// Default prefs
// ---------------------------------------------------------------------------
const DEFAULT_PREFS: NotificationPreferences = {
  wake_up: { enabled: true, time: '06:00' },
  meals: { enabled: true, times: ['08:00', '12:00', '18:00'] },
  gym: { enabled: true, time: '16:00' },
  sleep: { enabled: true, time: '22:00' },
  water: { enabled: true, interval_minutes: 60 },
  daily_checkin: { enabled: true, time: '21:00' },
  weekly_review: { enabled: true, day: 'sunday', time: '10:00' },
  focus_reminder: { enabled: false, time: '09:00' },
  supplement: { enabled: false },
  partner_activity: { enabled: true },
};

// ---------------------------------------------------------------------------
// Notification group definition
// ---------------------------------------------------------------------------
interface NotifGroup {
  key: keyof NotificationPreferences;
  icon: string;
  label: string;
  description: string;
  timeLabel?: string;
}

const GROUPS: NotifGroup[] = [
  {
    key: 'wake_up',
    icon: '🌅',
    label: 'Wake-Up Reminder',
    description: 'Morning routine nudge',
    timeLabel: 'Time',
  },
  {
    key: 'meals',
    icon: '🍽️',
    label: 'Meal Reminders',
    description: 'Custom times for each meal',
    timeLabel: 'Times',
  },
  {
    key: 'gym',
    icon: '🏋️',
    label: 'Gym Reminder',
    description: 'Time to hit the gym',
    timeLabel: 'Time',
  },
  {
    key: 'sleep',
    icon: '😴',
    label: 'Sleep Reminder',
    description: 'Wind down for bed',
    timeLabel: 'Time',
  },
  {
    key: 'water',
    icon: '💧',
    label: 'Water Reminders',
    description: 'Hydration interval',
    timeLabel: 'Every',
  },
  {
    key: 'daily_checkin',
    icon: '📋',
    label: 'Daily Check-In',
    description: 'End-of-day reflection',
    timeLabel: 'Time',
  },
  {
    key: 'weekly_review',
    icon: '📊',
    label: 'Weekly Review',
    description: 'Week-in-review notification',
    timeLabel: 'Day/Time',
  },
  {
    key: 'focus_reminder',
    icon: '🎯',
    label: 'Focus Reminder',
    description: 'Deep work time',
    timeLabel: 'Time',
  },
  {
    key: 'supplement',
    icon: '💊',
    label: 'Supplement Reminders',
    description: 'Based on your supplement schedule',
  },
  {
    key: 'partner_activity',
    icon: '👫',
    label: 'Partner Activity',
    description: 'Nudges & partner updates',
  },
];

// ---------------------------------------------------------------------------
// Time display helper
// ---------------------------------------------------------------------------
function formatTimeDisplay(prefs: NotificationPreferences, key: keyof NotificationPreferences): string {
  const val = prefs[key];
  if (!val || typeof val !== 'object') return '';

  if ('time' in val && typeof val.time === 'string') {
    return val.time;
  }
  if ('times' in val && Array.isArray(val.times)) {
    return val.times.join(', ');
  }
  if ('interval_minutes' in val && typeof val.interval_minutes === 'number') {
    return `${val.interval_minutes} min`;
  }
  if ('day' in val && typeof val.day === 'string') {
    const day = val.day.charAt(0).toUpperCase() + val.day.slice(1);
    const time = 'time' in val && typeof val.time === 'string' ? val.time : '';
    return `${day} ${time}`;
  }
  return '';
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------
export default function NotificationsSettingsScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const insets = useSafeAreaInsets();

  const profile = useProfileStore((s) => s.profile);
  const updateProfile = useProfileStore((s) => s.updateProfile);

  const [prefs, setPrefs] = useState<NotificationPreferences>(
    (profile?.notification_preferences as NotificationPreferences | undefined) ?? DEFAULT_PREFS,
  );
  const [globalEnabled, setGlobalEnabled] = useState(true);

  // Sync prefs from profile
  useEffect(() => {
    if (profile?.notification_preferences) {
      setPrefs(profile.notification_preferences as NotificationPreferences);
    }
  }, [profile?.notification_preferences]);

  // Toggle individual group
  const handleToggleGroup = useCallback(
    async (key: keyof NotificationPreferences, enabled: boolean) => {
      void hapticLight();
      const currentVal = prefs[key];
      let updated: NotificationPreferences[keyof NotificationPreferences];

      if (typeof currentVal === 'object' && currentVal !== null) {
        updated = { ...currentVal, enabled };
      } else {
        updated = { enabled } as NotificationPreferences[keyof NotificationPreferences];
      }

      const newPrefs = { ...prefs, [key]: updated };
      setPrefs(newPrefs);
      await updateProfile({ notification_preferences: newPrefs });
    },
    [prefs, updateProfile],
  );

  // Edit time for a notification group
  const handleEditTime = useCallback(
    (key: keyof NotificationPreferences, currentDisplay: string) => {
      void hapticLight();
      const save = async (value: string | undefined) => {
        if (!value || !/^\d{2}:\d{2}$/.test(value)) {
          Alert.alert('Invalid Format', 'Please use HH:MM format, e.g. 07:30');
          return;
        }
        const currentVal = prefs[key];
        if (typeof currentVal === 'object' && currentVal !== null) {
          const newPrefs = { ...prefs, [key]: { ...currentVal, time: value } };
          setPrefs(newPrefs);
          await updateProfile({ notification_preferences: newPrefs });
        }
      };
      if (Platform.OS === 'ios') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (Alert as any).prompt(
          'Set Time',
          'Enter time in HH:MM (24-hour) format',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Save', onPress: save },
          ],
          'plain-text',
          currentDisplay,
        );
      } else {
        // Android: prompt with current value pre-filled via standard Alert
        Alert.alert(
          'Set Notification Time',
          `Current: ${currentDisplay}\n\nEdit the time in your notification settings or contact support to change notification times.`,
          [{ text: 'OK' }],
        );
      }
    },
    [prefs, updateProfile],
  );

  // Toggle global
  const handleToggleGlobal = useCallback(
    async (enabled: boolean) => {
      void hapticLight();
      setGlobalEnabled(enabled);
      // When disabled, we keep saved prefs but stop sending
      // In production this would update the push notification subscription
    },
    [],
  );

  const isGroupEnabled = (key: keyof NotificationPreferences): boolean => {
    const val = prefs[key];
    if (typeof val === 'object' && val !== null && 'enabled' in val) {
      return Boolean(val.enabled);
    }
    return false;
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background.primary }]}
      contentContainerStyle={{
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: insets.bottom + 100,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Global Toggle */}
      <Animated.View entering={FadeInDown.duration(400)}>
        <Card variant="elevated" style={{ marginBottom: spacing.xl }}>
          <View style={styles.globalRow}>
            <View style={{ flex: 1 }}>
              <Text
                style={[typography.h3, { color: colors.text.primary }]}
              >
                Notifications
              </Text>
              <Text
                style={[
                  typography.caption,
                  { color: colors.text.secondary, marginTop: spacing.xs },
                ]}
              >
                {globalEnabled
                  ? 'Notifications are active'
                  : 'All notifications are paused'}
              </Text>
            </View>
            <Toggle
              value={globalEnabled}
              onValueChange={handleToggleGlobal}
            />
          </View>
        </Card>
      </Animated.View>

      {/* Notification Groups */}
      {GROUPS.map((group, index) => {
        const enabled = isGroupEnabled(group.key) && globalEnabled;
        const timeDisplay = formatTimeDisplay(prefs, group.key);

        return (
          <Animated.View
            key={group.key}
            entering={FadeInDown.delay(50 + index * 30).duration(400)}
          >
            <View
              style={[
                styles.groupRow,
                {
                  backgroundColor: colors.background.secondary,
                  borderRadius: borderRadius.md,
                  padding: spacing.lg,
                  marginBottom: spacing.sm,
                  opacity: globalEnabled ? 1 : 0.5,
                },
              ]}
            >
              <Text style={{ fontSize: 20, marginRight: spacing.md }}>
                {group.icon}
              </Text>
              <View style={{ flex: 1 }}>
                <Text
                  style={[typography.bodyBold, { color: colors.text.primary }]}
                >
                  {group.label}
                </Text>
                <Text
                  style={[
                    typography.caption,
                    { color: colors.text.secondary, marginTop: 2 },
                  ]}
                >
                  {group.description}
                </Text>
                {timeDisplay.length > 0 && enabled && (
                  <Pressable
                    onPress={() => handleEditTime(group.key as keyof NotificationPreferences, timeDisplay)}
                    style={{ marginTop: spacing.xs }}
                  >
                    <Text
                      style={[
                        typography.captionBold,
                        { color: colors.accent.primary },
                      ]}
                    >
                      {group.timeLabel}: {timeDisplay}
                    </Text>
                  </Pressable>
                )}
              </View>
              <Toggle
                value={enabled}
                onValueChange={(v) => handleToggleGroup(group.key, v)}
                disabled={!globalEnabled}
              />
            </View>
          </Animated.View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  globalRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
