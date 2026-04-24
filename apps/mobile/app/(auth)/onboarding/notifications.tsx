// =============================================================================
// TRANSFORMR -- Onboarding: Notification Preferences
// =============================================================================

import { useState, useCallback, type ComponentType } from 'react';
import { View, Text, ScrollView, StyleSheet, Switch, Platform, Alert } from 'react-native';
import { Image as ExpoImage, type ImageProps } from 'expo-image';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@theme/index';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { OnboardingBackground } from '@components/ui/OnboardingBackground';
import { useProfileStore } from '@stores/profileStore';
import { hapticLight } from '@utils/haptics';
import type { NotificationPreferences } from '@app-types/database';

// Cast needed: expo class components don't satisfy React 19's JSX class element interface
const Image = ExpoImage as unknown as ComponentType<ImageProps>;

const HERO_URL = 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200&q=80';
const BLUR_HASH = 'LBF}@q~q~qof~qj[WBj[j[j[M{j[';

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

interface MealTimes {
  breakfast: string;
  lunch: string;
  dinner: string;
  snack: string;
  drink: string;
}

const DEFAULT_GROUP_STATE: NotificationGroupState = { enabled: false, time: '' };

const DEFAULT_MEAL_TIMES: MealTimes = {
  breakfast: '08:00',
  lunch: '12:30',
  dinner: '18:30',
  snack: '15:00',
  drink: '',
};

const MEAL_SLOTS: { key: keyof MealTimes; label: string; icon: string }[] = [
  { key: 'breakfast', label: 'Breakfast', icon: '🍳' },
  { key: 'lunch', label: 'Lunch', icon: '🥗' },
  { key: 'dinner', label: 'Dinner', icon: '🍽️' },
  { key: 'snack', label: 'Snack', icon: '🍎' },
  { key: 'drink', label: 'Drink / Other', icon: '🥤' },
];

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
    description: 'Set reminder times for each meal you want to log',
    hasTime: false, // custom multi-time UI handled separately
    defaultTime: '',
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
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const updateProfile = useProfileStore((s) => s.updateProfile);

  const [mealTimes, setMealTimes] = useState<MealTimes>(DEFAULT_MEAL_TIMES);

  const updateMealTime = useCallback((meal: keyof MealTimes, time: string) => {
    setMealTimes((prev) => ({ ...prev, [meal]: time }));
  }, []);

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
    hapticLight();
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
      meals: {
        enabled: g('meals').enabled,
        times: Object.values(mealTimes).filter((t) => t.trim().length > 0),
      },
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
  }, [groups, mealTimes, permissionGranted, requestPermission, updateProfile, router]);

  return (
    <OnboardingBackground imageUrl={HERO_URL} blurHash={BLUR_HASH} localSource={require('@assets/images/hero-notifications.jpg')}>
      <StatusBar style="light" backgroundColor="#0C0A15" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 50, paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Icon + Headline */}
        <View style={styles.heroSection}>
          <Image
            source={require('@assets/icons/transformr-icon.png')}
            style={styles.icon}
            contentFit="contain"
          />
          <Text style={styles.headline}>Your AI coach{'\n'}has your back.</Text>
          <Text style={styles.subheadline}>
            We'll nudge you when you need it, celebrate when you earn it, and stay quiet when you don't.
          </Text>
        </View>

        {/* Form */}
        <View style={styles.formSection}>

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
          {NOTIFICATION_GROUPS.map((group, groupIndex) => {
            const state = groups[group.key] ?? DEFAULT_GROUP_STATE;
            return (
              <Animated.View
                key={group.key}
                entering={FadeInDown.delay(100 + groupIndex * 60)}
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
                    accessibilityLabel={`Toggle ${group.label} notifications`}
                  />
                </View>

                {/* Generic single time picker */}
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

                {/* Meal reminders — individual time picker per meal type */}
                {group.key === 'meals' && state.enabled && (
                  <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
                    {MEAL_SLOTS.map((slot) => (
                      <View key={slot.key} style={[styles.timeRow, { alignItems: 'center' }]}>
                        <Text style={{ fontSize: 16, width: 24 }}>{slot.icon}</Text>
                        <Text style={[typography.caption, { color: colors.text.secondary, flex: 1, marginLeft: spacing.sm }]}>
                          {slot.label}
                        </Text>
                        <Input
                          placeholder="HH:MM"
                          value={mealTimes[slot.key]}
                          onChangeText={(t) => updateMealTime(slot.key, t)}
                          keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'}
                          containerStyle={{ width: 90 }}
                        />
                      </View>
                    ))}
                    <Text style={[typography.tiny, { color: colors.text.muted, marginTop: spacing.xs }]}>
                      Leave blank for any meal you don't want a reminder for.
                    </Text>
                  </View>
                )}
              </Animated.View>
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
        </View>
      </ScrollView>
    </OnboardingBackground>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: {},
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  icon: { width: 56, height: 56, marginBottom: 12 },
  headline: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F0F0FC' /* brand-ok */,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 34,
  },
  subheadline: {
    fontSize: 15,
    color: 'rgba(240, 240, 252, 0.75)',
    textAlign: 'center',
    lineHeight: 22,
  },
  formSection: { paddingHorizontal: 24 },
  banner: {},
  groupCard: {},
  groupHeader: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
  timeRow: { flexDirection: 'row', alignItems: 'center' },
});
