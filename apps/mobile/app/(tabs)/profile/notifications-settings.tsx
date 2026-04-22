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
import { StatusBar } from 'expo-status-bar';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Toggle } from '@components/ui/Toggle';
import { useProfileStore } from '@stores/profileStore';
import { hapticLight, hapticMedium } from '@utils/haptics';
import * as Notifications from 'expo-notifications';
import type { NotificationPreferences } from '@app-types/database';
import { useNavigation } from '@react-navigation/native';
import { ScreenHelpButton } from '@components/ui/ScreenHelpButton';
import { SCREEN_HELP } from '../../../constants/screenHelp';
import { ScreenBackground } from '@components/ui/ScreenBackground';
import { AmbientBackground } from '@components/ui/AmbientBackground';

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
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => <ScreenHelpButton content={SCREEN_HELP.notificationsSettingsScreen} />,
    });
  }, [navigation]);

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
        Alert.prompt(
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

  // Send a test push notification immediately
  const handleTestNotification = useCallback(async () => {
    await hapticMedium();
    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        if (newStatus !== 'granted') {
          Alert.alert('Permission Required', 'Enable notifications in your device settings to test.');
          return;
        }
      }
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'TRANSFORMR Test',
          body: "Your notifications are working! You're all set.",
          sound: true,
        },
        trigger: null,
      });
      Alert.alert('Test Sent', 'Check your notification tray!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not send test notification';
      Alert.alert('Error', msg);
    }
  }, []);

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
      <ScreenBackground />
      <AmbientBackground />
      {/* Global Toggle */}
      <Animated.View entering={FadeInDown.duration(400)}>
        <Card variant="elevated" style={{ marginBottom: spacing.xl }}>
          <View style={styles.globalRow}>
            <View style={{ flex: 1 }}>
      <StatusBar style="light" backgroundColor="#0C0A15" />
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

      {/* Priority Slots */}
      <Animated.View entering={FadeInDown.delay(40).duration(400)}>
        <Card
          variant="default"
          style={{ marginBottom: spacing.xl }}
          header={
            <Text style={[typography.h3, { color: colors.text.primary }]}>
              Priority Slots
            </Text>
          }
        >
          {([
            { key: 'wake_up' as const, label: 'Morning Briefing', icon: '🌅' },
            { key: 'meals' as const, label: 'Meal Reminder', icon: '🍽️' },
            { key: 'gym' as const, label: 'Streak at Risk', icon: '🔥' },
            { key: 'daily_checkin' as const, label: 'Evening Check-In', icon: '📋' },
          ] as const).map((slot) => {
            const enabled = isGroupEnabled(slot.key) && globalEnabled;
            return (
              <View
                key={slot.key}
                style={[
                  styles.priorityRow,
                  {
                    paddingVertical: spacing.sm,
                    borderBottomColor: colors.border.subtle,
                  },
                ]}
              >
                <Text style={{ fontSize: 18, marginRight: spacing.sm }}>{slot.icon}</Text>
                <Text style={[typography.body, { color: colors.text.primary, flex: 1 }]}>
                  {slot.label}
                </Text>
                <Toggle
                  value={enabled}
                  onValueChange={(v) => void handleToggleGroup(slot.key, v)}
                  disabled={!globalEnabled}
                />
              </View>
            );
          })}
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
      {/* Quiet Hours Info */}
      <Animated.View entering={FadeInDown.delay(350).duration(400)}>
        <Card
          variant="outlined"
          style={{ marginTop: spacing.lg, marginBottom: spacing.lg }}
        >
          <View style={styles.quietRow}>
            <Text style={{ fontSize: 18, marginRight: spacing.md }}>🌙</Text>
            <View style={{ flex: 1 }}>
              <Text style={[typography.bodyBold, { color: colors.text.primary }]}>
                Quiet Hours
              </Text>
              <Text
                style={[
                  typography.caption,
                  { color: colors.text.secondary, marginTop: spacing.xs },
                ]}
              >
                Notifications are automatically silenced between 10 PM and 6 AM.
                Adjust in your device's Focus / Do Not Disturb settings.
              </Text>
            </View>
          </View>
        </Card>
      </Animated.View>

      {/* Test Notification */}
      <Animated.View entering={FadeInDown.delay(400).duration(400)}>
        <Button
          title="Send Test Notification"
          variant="outline"
          fullWidth
          onPress={handleTestNotification}
          accessibilityLabel="Send a test push notification"
          style={{ marginBottom: spacing.xl }}
        />
      </Animated.View>
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
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.15)',
  },
  priorityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  quietRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
});
