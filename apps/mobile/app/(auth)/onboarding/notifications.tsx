// =============================================================================
// TRANSFORMR -- Onboarding: Notification Preferences
// =============================================================================

import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Switch, Platform, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useTheme } from '@theme/index';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { useProfileStore } from '@stores/profileStore';
import type { NotificationPreferences } from '@app-types/database';

interface NotificationGroupState {
  enabled: boolean;
  time: string;
}

interface NotificationGroup {
  key: keyof NotificationPreferences;
  label: string;
  icon: string;
  description: string;
  hasTime: boolean;
  defaultTime: string;
}

const DEFAULT_GROUP_STATE: NotificationGroupState = { enabled: false, time: '' };

const NOTIFICATION_GROUPS: NotificationGroup[] = [
  {
    key: 'wake_up',
    label: 'Wake Up',
    icon: '\u2600\uFE0F',
    description: 'Morning motivation and daily briefing',
    hasTime: true,
    defaultTime: '06:30',
  },
  {
    key: 'meals',
    label: 'Meal Reminders',
    icon: '\uD83C\uDF7D\uFE0F',
    description: 'Log your meals on time',
    hasTime: true,
    defaultTime: '12:00',
  },
  {
    key: 'gym',
    label: 'Gym Time',
    icon: '\uD83C\uDFCB\uFE0F',
    description: 'Workout reminders',
    hasTime: true,
    defaultTime: '17:00',
  },
  {
    key: 'sleep',
    label: 'Sleep',
    icon: '\uD83C\uDF19',
    description: 'Wind-down and sleep tracking reminder',
    hasTime: true,
    defaultTime: '22:00',
  },
  {
    key: 'water',
    label: 'Water Intake',
    icon: '\uD83D\uDCA7',
    description: 'Stay hydrated throughout the day',
    hasTime: false,
    defaultTime: '',
  },
  {
    key: 'daily_checkin',
    label: 'Daily Check-in',
    icon: '\uD83D\uDCDD',
    description: 'End-of-day reflection and scoring',
    hasTime: true,
    defaultTime: '21:00',
  },
];

export default function NotificationsScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const router = useRouter();
  const updateProfile = useProfileStore((s) => s.updateProfile);

  const [groups, setGroups] = useState<
    Record<string, NotificationGroupState>
  >(() => {
    const initial: Record<string, NotificationGroupState> = {};
    NOTIFICATION_GROUPS.forEach((g) => {
      initial[g.key] = { enabled: true, time: g.defaultTime };
    });
    return initial;
  });

  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);

  const toggleGroup = useCallback((key: string) => {
    setGroups((prev) => {
      const current = prev[key] ?? DEFAULT_GROUP_STATE;
      return { ...prev, [key]: { ...current, enabled: !current.enabled } };
    });
  }, []);

  const updateTime = useCallback((key: string, time: string) => {
    setGroups((prev) => {
      const current = prev[key] ?? DEFAULT_GROUP_STATE;
      return { ...prev, [key]: { ...current, time } };
    });
  }, []);

  const requestPermission = useCallback(async () => {
    const { granted } = await Notifications.requestPermissionsAsync();
    setPermissionGranted(granted);

    if (!granted) {
      Alert.alert(
        'Notifications Disabled',
        'You can enable notifications later in your device settings.',
        [{ text: 'OK' }],
      );
    }
  }, []);

  const handleContinue = useCallback(async () => {
    // Request permission if not yet asked
    if (permissionGranted === null) {
      await requestPermission();
    }

    // Build notification preferences for profile
    const g = (key: string): NotificationGroupState => groups[key] ?? DEFAULT_GROUP_STATE;

    const prefs: NotificationPreferences = {
      wake_up: { enabled: g('wake_up').enabled, time: g('wake_up').time },
      meals: { enabled: g('meals').enabled, times: [g('meals').time] },
      gym: { enabled: g('gym').enabled, time: g('gym').time },
      sleep: { enabled: g('sleep').enabled, time: g('sleep').time },
      water: { enabled: g('water').enabled, interval_minutes: 60 },
      daily_checkin: { enabled: g('daily_checkin').enabled, time: g('daily_checkin').time },
      weekly_review: { enabled: true, day: 'sunday', time: '18:00' },
      focus_reminder: { enabled: false, time: '09:00' },
      supplement: { enabled: false },
      partner_activity: { enabled: true },
    };

    await updateProfile({ notification_preferences: prefs });
    router.push('/(auth)/onboarding/ready');
  }, [groups, permissionGranted, requestPermission, updateProfile, router]);

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background.primary }]}
      contentContainerStyle={{ padding: spacing.xxl, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[typography.h1, { color: colors.text.primary, marginBottom: spacing.sm }]}>
        Notifications
      </Text>
      <Text style={[typography.body, { color: colors.text.secondary, marginBottom: spacing.xxl }]}>
        Set up reminders to stay on track. You can adjust these anytime in settings.
      </Text>

      {/* Permission Status */}
      {permissionGranted === false && (
        <View
          style={[
            styles.banner,
            {
              backgroundColor: colors.accent.warning + '18',
              borderRadius: borderRadius.md,
              padding: spacing.md,
              marginBottom: spacing.xl,
              borderWidth: 1,
              borderColor: colors.accent.warning + '40',
            },
          ]}
        >
          <Text style={[typography.caption, { color: colors.accent.warning }]}>
            Push notifications are disabled. Enable them in Settings to receive reminders.
          </Text>
        </View>
      )}

      {/* Notification Groups */}
      {NOTIFICATION_GROUPS.map((group) => {
        const state = groups[group.key] ?? DEFAULT_GROUP_STATE;
        return (
          <View
            key={group.key}
            style={[
              styles.groupCard,
              {
                backgroundColor: colors.background.secondary,
                borderRadius: borderRadius.lg,
                padding: spacing.lg,
                marginBottom: spacing.md,
              },
            ]}
          >
            <View style={styles.groupHeader}>
              <Text style={{ fontSize: 24, marginRight: spacing.md }}>{group.icon}</Text>
              <View style={styles.flex}>
                <Text style={[typography.bodyBold, { color: colors.text.primary }]}>
                  {group.label}
                </Text>
                <Text style={[typography.caption, { color: colors.text.secondary }]}>
                  {group.description}
                </Text>
              </View>
              <Switch
                value={state.enabled}
                onValueChange={() => toggleGroup(group.key)}
                trackColor={{ false: colors.background.tertiary, true: colors.accent.primary + '60' }}
                thumbColor={state.enabled ? colors.accent.primary : colors.text.muted}
              />
            </View>

            {/* Time Picker (simplified as text input) */}
            {group.hasTime && state.enabled && (
              <View style={[styles.timeRow, { marginTop: spacing.md }]}>
                <Text style={[typography.caption, { color: colors.text.muted, marginRight: spacing.sm }]}>
                  Time:
                </Text>
                <Input
                  placeholder="HH:MM"
                  value={state.time}
                  onChangeText={(t) => updateTime(group.key, t)}
                  keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'}
                  containerStyle={{ flex: 1 }}
                />
              </View>
            )}
          </View>
        );
      })}

      {/* Enable Push Button */}
      {permissionGranted === null && (
        <Button
          title="Enable Push Notifications"
          onPress={requestPermission}
          variant="outline"
          fullWidth
          size="md"
          style={{ marginTop: spacing.lg, marginBottom: spacing.md }}
        />
      )}

      {/* Continue */}
      <Button
        title="Continue"
        onPress={handleContinue}
        fullWidth
        size="lg"
        style={{ marginTop: spacing.xl }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  banner: {},
  groupCard: {},
  groupHeader: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
  timeRow: { flexDirection: 'row', alignItems: 'center' },
});
