// =============================================================================
// TRANSFORMR -- Weather Card (Module 10)
// Dashboard card showing current weather with workout & hydration tips.
// =============================================================================

import { useEffect, useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';
import { supabase } from '@services/supabase';

interface WeatherData {
  temperature_f: number;
  feels_like_f: number;
  humidity: number;
  condition: string;
  condition_code: string;
  wind_mph: number;
  uv_index: number;
  workout_recommendation: string;
  hydration_note: string;
}

const CONDITION_ICONS: Record<string, string> = {
  'Clear sky': 'sunny-outline',
  'Mainly clear': 'sunny-outline',
  'Partly cloudy': 'partly-sunny-outline',
  'Overcast': 'cloud-outline',
  'Foggy': 'cloud-outline',
  'Rime fog': 'cloud-outline',
  'Light drizzle': 'rainy-outline',
  'Moderate drizzle': 'rainy-outline',
  'Slight rain': 'rainy-outline',
  'Moderate rain': 'rainy-outline',
  'Heavy rain': 'rainy-outline',
  'Slight snow': 'snow-outline',
  'Moderate snow': 'snow-outline',
  'Heavy snow': 'snow-outline',
  'Thunderstorm': 'thunderstorm-outline',
};

interface WeatherCardProps {
  style?: object;
}

export function WeatherCard({ style }: WeatherCardProps) {
  const { colors, typography, spacing } = useTheme();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Get location — use a default if location services unavailable
      let latitude = 37.7749;
      let longitude = -122.4194;

      if (Platform.OS !== 'web') {
        try {
          const Location = await import('expo-location');
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            const loc = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Low,
            });
            latitude = loc.coords.latitude;
            longitude = loc.coords.longitude;
          }
        } catch {
          // Use default location
        }
      }

      const { data, error: fetchErr } = await supabase.functions.invoke(
        'weather-fetch',
        { body: { latitude, longitude } },
      );

      if (fetchErr) throw fetchErr;
      setWeather(data as WeatherData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load weather');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchWeather();
  }, [fetchWeather]);

  if (isLoading) {
    return (
      <Card style={StyleSheet.flatten([styles.card, style])}>
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={colors.accent.cyan} />
          <Text style={[typography.tiny, { color: colors.text.muted, marginLeft: spacing.sm }]}>
            Loading weather...
          </Text>
        </View>
      </Card>
    );
  }

  if (error || !weather) return null;

  const icon =
    CONDITION_ICONS[weather.condition] ?? 'partly-sunny-outline';

  const uvBadgeVariant =
    weather.uv_index >= 8
      ? 'danger' as const
      : weather.uv_index >= 5
        ? 'warning' as const
        : 'default' as const;

  return (
    <Animated.View entering={FadeInDown.duration(300)} style={style}>
      <Pressable onPress={() => setExpanded((p) => !p)}>
        <Card style={styles.card}>
          <View style={styles.row}>
            <Ionicons
              name={icon as keyof typeof Ionicons.glyphMap}
              size={28}
              color={colors.accent.cyan}
            />
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <View style={styles.tempRow}>
                <Text style={[typography.h3, { color: colors.text.primary }]}>
                  {weather.temperature_f}°F
                </Text>
                <Text style={[typography.caption, { color: colors.text.muted, marginLeft: spacing.sm }]}>
                  Feels {weather.feels_like_f}°F
                </Text>
              </View>
              <Text style={[typography.caption, { color: colors.text.secondary }]}>
                {weather.condition}
              </Text>
            </View>
            <View style={[styles.metaCol, { gap: 4 }]}>
              <Badge label={`UV ${weather.uv_index}`} size="sm" variant={uvBadgeVariant} />
              <Text style={[typography.tiny, { color: colors.text.muted }]}>
                {weather.wind_mph} mph
              </Text>
            </View>
          </View>

          {/* Workout recommendation - always shown */}
          <View style={[styles.tipRow, { marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border.subtle }]}>
            <Ionicons name="barbell-outline" size={14} color={colors.accent.primary} />
            <Text
              style={[typography.tiny, { color: colors.text.secondary, flex: 1, marginLeft: spacing.xs }]}
              numberOfLines={expanded ? undefined : 2}
            >
              {weather.workout_recommendation}
            </Text>
          </View>

          {expanded && (
            <View style={[styles.tipRow, { marginTop: spacing.xs }]}>
              <Ionicons name="water-outline" size={14} color={colors.accent.cyan} />
              <Text style={[typography.tiny, { color: colors.text.secondary, flex: 1, marginLeft: spacing.xs }]}>
                {weather.hydration_note}
              </Text>
            </View>
          )}
        </Card>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {},
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tempRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  metaCol: {
    alignItems: 'flex-end',
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
});
