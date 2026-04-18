// =============================================================================
// TRANSFORMR — Wearables Settings Screen
//
// Shows Apple Watch, Garmin, and Fitbit connection state.
// Apple Watch uses react-native-watch-connectivity for real reachability.
// Garmin and Fitbit show connection state from Supabase profile.
// =============================================================================

import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';
import { useProfileStore } from '@stores/profileStore';
import { isWatchReachable } from '@services/watch';
import { hapticLight } from '@utils/haptics';
import { formatRelativeTime } from '@utils/formatters';

interface WearableConfig {
  id: 'appleWatch' | 'garmin' | 'fitbit';
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  description: string;
  profileConnectedKey: string | null;
  profileLastSyncKey: string | null;
}

const WEARABLES: WearableConfig[] = [
  {
    id: 'appleWatch',
    name: 'Apple Watch',
    icon: 'watch-outline',
    iconColor: '#FF375F',
    description: 'Heart rate, activity rings, and workout sync',
    profileConnectedKey: 'watch_paired',
    profileLastSyncKey: 'watch_last_sync_at',
  },
  {
    id: 'garmin',
    name: 'Garmin',
    icon: 'navigate-circle-outline',
    iconColor: '#00A6A0',
    description: 'GPS distance, VO2 max, and training load',
    profileConnectedKey: 'garmin_connected',
    profileLastSyncKey: 'garmin_last_sync_at',
  },
  {
    id: 'fitbit',
    name: 'Fitbit',
    icon: 'fitness-outline',
    iconColor: '#00B0B9',
    description: 'Steps, sleep stages, and heart rate zones',
    profileConnectedKey: 'fitbit_connected',
    profileLastSyncKey: 'fitbit_last_sync_at',
  },
];

export default function WearablesScreen() {
  const { colors, typography, spacing, borderRadius, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const profile = useProfileStore((s) => s.profile);
  const updateProfile = useProfileStore((s) => s.updateProfile);

  const [watchReachable, setWatchReachable] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    isWatchReachable()
      .then(setWatchReachable)
      .catch(() => setWatchReachable(false));
  }, []);

  const isConnected = useCallback(
    (w: WearableConfig): boolean => {
      if (!w.profileConnectedKey || !profile) return false;
      return !!(profile as unknown as Record<string, unknown>)[w.profileConnectedKey];
    },
    [profile],
  );

  const lastSync = useCallback(
    (w: WearableConfig): string | null => {
      if (!w.profileLastSyncKey || !profile) return null;
      return ((profile as unknown as Record<string, unknown>)[w.profileLastSyncKey] as string | null) ?? null;
    },
    [profile],
  );

  const handleToggle = useCallback(
    async (w: WearableConfig) => {
      if (!w.profileConnectedKey) return;
      hapticLight();

      const connected = isConnected(w);

      if (connected) {
        Alert.alert(
          `Disconnect ${w.name}`,
          `Remove ${w.name} connection? Your synced data will be preserved.`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Disconnect',
              style: 'destructive',
              onPress: async () => {
                setToggling(w.id);
                await updateProfile({ [w.profileConnectedKey!]: false });
                setToggling(null);
              },
            },
          ],
        );
      } else {
        // For Apple Watch — use native reachability
        if (w.id === 'appleWatch') {
          const reachable = await isWatchReachable().catch(() => false);
          if (!reachable) {
            Alert.alert(
              'Apple Watch Not Found',
              'Make sure your Apple Watch is paired, nearby, and the TRANSFORMR Watch app is installed.',
            );
            return;
          }
          setToggling(w.id);
          await updateProfile({ watch_paired: true });
          setToggling(null);
          return;
        }

        // Garmin / Fitbit — OAuth flow placeholder
        Alert.alert(
          `Connect ${w.name}`,
          `OAuth connection for ${w.name} requires the TRANSFORMR companion app or browser flow. This will be available in a future update.`,
        );
      }
    },
    [isConnected, updateProfile],
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.background.primary} />

      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + spacing.md,
            paddingHorizontal: spacing.lg,
            paddingBottom: spacing.md,
            borderBottomColor: colors.border.default,
          },
        ]}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go back"
          accessibilityRole="button"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={[typography.h2, { color: colors.text.primary, flex: 1, marginLeft: spacing.sm }]}>
          Wearables
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 90 }}
        showsVerticalScrollIndicator={false}
      >
        {WEARABLES.map((w, i) => {
          const connected = isConnected(w);
          const sync = lastSync(w);
          const isToggling = toggling === w.id;

          return (
            <Animated.View
              key={w.id}
              entering={FadeInDown.delay(i * 80).duration(400)}
              style={{ marginBottom: spacing.md }}
            >
              <Card
                variant="elevated"
                style={{
                  padding: spacing.lg,
                  borderLeftWidth: 3,
                  borderLeftColor: connected ? colors.accent.success : colors.border.default,
                }}
              >
                <View style={styles.cardHeader}>
                  <View
                    style={[
                      styles.iconWrap,
                      {
                        backgroundColor: `${w.iconColor}20`,
                        borderRadius: borderRadius.sm,
                        width: 44,
                        height: 44,
                        marginRight: spacing.md,
                      },
                    ]}
                  >
                    <Ionicons name={w.icon} size={22} color={w.iconColor} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={styles.nameRow}>
                      <Text style={[typography.bodyBold, { color: colors.text.primary }]}>
                        {w.name}
                      </Text>
                      {connected && (
                        <Badge label="Connected" variant="success" size="sm" style={{ marginLeft: spacing.xs }} />
                      )}
                      {w.id === 'appleWatch' && watchReachable && !connected && (
                        <Badge label="In Range" variant="info" size="sm" style={{ marginLeft: spacing.xs }} />
                      )}
                    </View>
                    <Text style={[typography.caption, { color: colors.text.secondary, marginTop: 2 }]}>
                      {w.description}
                    </Text>
                    {sync && connected && (
                      <Text style={[typography.tiny, { color: colors.text.muted, marginTop: 4 }]}>
                        Last sync: {formatRelativeTime(sync)}
                      </Text>
                    )}
                  </View>
                </View>

                <Pressable
                  onPress={() => handleToggle(w)}
                  disabled={isToggling}
                  style={[
                    styles.toggleBtn,
                    {
                      backgroundColor: connected
                        ? colors.background.tertiary
                        : colors.accent.primary,
                      borderRadius: borderRadius.md,
                      paddingVertical: spacing.sm,
                      marginTop: spacing.md,
                    },
                  ]}
                  accessibilityLabel={connected ? `Disconnect ${w.name}` : `Connect ${w.name}`}
                  accessibilityRole="button"
                >
                  {isToggling ? (
                    <ActivityIndicator color={connected ? colors.text.secondary : '#FFFFFF'} size="small" />
                  ) : (
                    <Text
                      style={[
                        typography.captionBold,
                        { color: connected ? colors.text.secondary : '#FFFFFF' },
                      ]}
                    >
                      {connected ? 'Disconnect' : 'Connect'}
                    </Text>
                  )}
                </Pressable>
              </Card>
            </Animated.View>
          );
        })}

        <Text
          style={[
            typography.tiny,
            { color: colors.text.muted, textAlign: 'center', marginTop: spacing.md },
          ]}
        >
          Data synced from your wearable is used for insights and coaching only.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:     { flex: 1 },
  header:     { flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  iconWrap:   { alignItems: 'center', justifyContent: 'center' },
  nameRow:    { flexDirection: 'row', alignItems: 'center' },
  toggleBtn:  { alignItems: 'center' },
});
