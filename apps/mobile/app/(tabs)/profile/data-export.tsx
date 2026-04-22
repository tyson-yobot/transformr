// =============================================================================
// TRANSFORMR -- Data Export Screen
// =============================================================================

import { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useFeatureGate } from '@hooks/useFeatureGate';
import { FeatureLockOverlay } from '@components/ui/FeatureLockOverlay';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ScreenHelpButton } from '@components/ui/ScreenHelpButton';
import { SCREEN_HELP } from '../../../constants/screenHelp';
import { ScreenBackground } from '@components/ui/ScreenBackground';
import { AmbientBackground } from '@components/ui/AmbientBackground';
import { useTheme } from '@theme/index';
import { StatusBar } from 'expo-status-bar';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { ProgressBar } from '@components/ui/ProgressBar';
import { hapticLight, hapticSuccess } from '@utils/haptics';
import { supabase } from '../../../services/supabase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type ExportFormat = 'csv' | 'json' | 'pdf';

interface DataCategory {
  key: string;
  label: string;
  icon: string;
  ioniconsName?: keyof typeof Ionicons.glyphMap;
  selected: boolean;
}

const FORMAT_OPTIONS: readonly { key: ExportFormat; label: string; icon: string }[] = [
  { key: 'csv', label: 'CSV', icon: '📄' },
  { key: 'json', label: 'JSON', icon: '🔧' },
  { key: 'pdf', label: 'PDF Report', icon: '📊' },
];

const DATE_RANGES = [
  { key: 'week', label: 'Last 7 Days' },
  { key: 'month', label: 'Last 30 Days' },
  { key: 'quarter', label: 'Last 90 Days' },
  { key: 'year', label: 'Last Year' },
  { key: 'all', label: 'All Time' },
] as const;

type DateRangeKey = typeof DATE_RANGES[number]['key'];

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------
export default function DataExportScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const gate = useFeatureGate('data_export');

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => <ScreenHelpButton content={SCREEN_HELP.dataExportScreen} />,
    });
  }, [navigation]);

  const [format, setFormat] = useState<ExportFormat>('csv');
  const [dateRange, setDateRange] = useState<DateRangeKey>('month');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const [categories, setCategories] = useState<DataCategory[]>([
    { key: 'workouts', label: 'Workouts', icon: '🏋️', selected: true },
    { key: 'nutrition', label: 'Nutrition', icon: '🍎', selected: true },
    { key: 'weight', label: 'Weight & Body', icon: '⚖️', selected: true },
    { key: 'habits', label: 'Habits', icon: '', ioniconsName: 'checkmark-circle-outline' as keyof typeof Ionicons.glyphMap, selected: true },
    { key: 'sleep', label: 'Sleep', icon: '😴', selected: false },
    { key: 'mood', label: 'Mood & Energy', icon: '😊', selected: false },
    { key: 'business', label: 'Business', icon: '💼', selected: false },
    { key: 'finance', label: 'Finance', icon: '💰', selected: false },
    { key: 'goals', label: 'Goals', icon: '🎯', selected: true },
    { key: 'journal', label: 'Journal', icon: '📖', selected: false },
  ]);

  // Toggle category
  const handleToggleCategory = useCallback(
    (key: string) => {
      void hapticLight();
      setCategories((prev) =>
        prev.map((c) => (c.key === key ? { ...c, selected: !c.selected } : c)),
      );
    },
    [],
  );

  // Select all / none
  const handleSelectAll = useCallback(
    (selectAll: boolean) => {
      void hapticLight();
      setCategories((prev) =>
        prev.map((c) => ({ ...c, selected: selectAll })),
      );
    },
    [],
  );

  // Generate & share
  const handleExport = useCallback(async () => {
    const selectedCats = categories.filter((c) => c.selected);
    if (selectedCats.length === 0) {
      Alert.alert('Error', 'Select at least one data category to export.');
      return;
    }

    setIsExporting(true);
    setExportProgress(0);
    await hapticLight();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const dateLabel = DATE_RANGES.find((d) => d.key === dateRange)?.label ?? dateRange;
      const since = (() => {
        const d = new Date();
        if (dateRange === 'week') d.setDate(d.getDate() - 7);
        else if (dateRange === 'month') d.setDate(d.getDate() - 30);
        else if (dateRange === 'quarter') d.setDate(d.getDate() - 90);
        else if (dateRange === 'year') d.setFullYear(d.getFullYear() - 1);
        else return undefined;
        return d.toISOString();
      })();

      const exportData: Record<string, unknown[]> = {};
      const total = selectedCats.length;

      for (let i = 0; i < selectedCats.length; i++) {
        const cat = selectedCats[i];
        if (!cat) continue;
        setExportProgress((i + 0.5) / total);

        let query;
        if (cat.key === 'workouts') {
          query = supabase.from('workout_sessions').select('*').eq('user_id', user.id);
        } else if (cat.key === 'nutrition') {
          query = supabase.from('nutrition_logs').select('*').eq('user_id', user.id);
        } else if (cat.key === 'habits') {
          query = supabase.from('habit_completions').select('*').eq('user_id', user.id);
        } else if (cat.key === 'sleep') {
          query = supabase.from('sleep_logs').select('*').eq('user_id', user.id);
        } else if (cat.key === 'mood') {
          query = supabase.from('mood_logs').select('*').eq('user_id', user.id);
        } else if (cat.key === 'business') {
          query = supabase.from('revenue_logs').select('*').eq('user_id', user.id);
        } else {
          continue;
        }

        if (since) query = query.gte('created_at', since);
        const { data: rows } = await query;
        exportData[cat.key] = rows ?? [];
        setExportProgress((i + 1) / total);
      }

      setExportProgress(1);
      await hapticSuccess();

      const content =
        format === 'json'
          ? JSON.stringify(exportData, null, 2)
          : Object.entries(exportData)
              .map(([key, rows]) => {
                if (rows.length === 0) return `# ${key}\n(no data)\n`;
                const headers = Object.keys(rows[0] as object).join(',');
                const csvRows = (rows as Record<string, unknown>[]).map((r) =>
                  Object.values(r)
                    .map((v) => (typeof v === 'string' ? `"${v.replace(/"/g, '""')}"` : String(v ?? '')))
                    .join(','),
                );
                return [`# ${key}`, headers, ...csvRows].join('\n');
              })
              .join('\n\n');

      Alert.alert(
        'Export Ready',
        `${format.toUpperCase()} export ready.\nCategories: ${selectedCats.map((c) => c.label).join(', ')}\nRange: ${dateLabel}`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Share',
            onPress: async () => {
              await Share.share({ message: content });
            },
          },
        ],
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Export failed';
      Alert.alert('Export Error', msg);
    } finally {
      setIsExporting(false);
    }
  }, [categories, format, dateRange]);

  const selectedCount = categories.filter((c) => c.selected).length;

  if (!gate.isAvailable) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background.primary }}>
        <FeatureLockOverlay
          featureKey="data_export"
          title="Data Export"
          description="Export your complete training, nutrition, and health data in multiple formats."
          onGoBack={() => navigation.goBack()}
        />
      </View>
    );
  }

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
      {/* Export Format */}
      <Animated.View entering={FadeInDown.duration(400)}>
        <Text
          style={[
            typography.h3,
            { color: colors.text.primary, marginBottom: spacing.md },
          ]}
        >
          Export Format
        </Text>
        <View style={[styles.formatRow, { gap: spacing.sm, marginBottom: spacing.xl }]}>
      <StatusBar style="light" backgroundColor="#0C0A15" />
          {FORMAT_OPTIONS.map((opt) => {
            const isActive = format === opt.key;
            return (
              <Pressable
                key={opt.key}
                onPress={() => {
                  void hapticLight();
                  setFormat(opt.key);
                }}
                accessibilityLabel={`Export as ${opt.label}`}
                accessibilityRole="radio"
                accessibilityState={{ selected: isActive }}
                style={[
                  styles.formatOption,
                  {
                    backgroundColor: isActive
                      ? `${colors.accent.primary}20`
                      : colors.background.secondary,
                    borderRadius: borderRadius.md,
                    padding: spacing.lg,
                    borderWidth: isActive ? 1.5 : 0,
                    borderColor: colors.accent.primary,
                  },
                ]}
              >
                <Text style={{ fontSize: 24, marginBottom: spacing.xs }}>
                  {opt.icon}
                </Text>
                <Text
                  style={[
                    typography.captionBold,
                    {
                      color: isActive
                        ? colors.accent.primary
                        : colors.text.secondary,
                    },
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Animated.View>

      {/* Date Range */}
      <Animated.View entering={FadeInDown.delay(50).duration(400)}>
        <Text
          style={[
            typography.h3,
            { color: colors.text.primary, marginBottom: spacing.md },
          ]}
        >
          Date Range
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.sm, marginBottom: spacing.xl }}
        >
          {DATE_RANGES.map((range) => {
            const isActive = dateRange === range.key;
            return (
              <Pressable
                key={range.key}
                onPress={() => {
                  void hapticLight();
                  setDateRange(range.key);
                }}
                accessibilityLabel={`Date range: ${range.label}`}
                accessibilityRole="radio"
                accessibilityState={{ selected: isActive }}
                style={[
                  styles.rangeChip,
                  {
                    backgroundColor: isActive
                      ? colors.accent.primary
                      : colors.background.secondary,
                    borderRadius: borderRadius.full,
                    paddingHorizontal: spacing.lg,
                    paddingVertical: spacing.sm,
                  },
                ]}
              >
                <Text
                  style={[
                    typography.captionBold,
                    {
                      color: isActive ? colors.text.inverse : colors.text.secondary,
                    },
                  ]}
                >
                  {range.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </Animated.View>

      {/* Data Categories */}
      <Animated.View entering={FadeInDown.delay(100).duration(400)}>
        <View style={styles.categoryHeader}>
          <Text
            style={[
              typography.h3,
              { color: colors.text.primary, flex: 1 },
            ]}
          >
            Data Categories
          </Text>
          <Pressable onPress={() => handleSelectAll(selectedCount < categories.length)}>
            <Text
              style={[
                typography.captionBold,
                { color: colors.accent.primary },
              ]}
            >
              {selectedCount === categories.length ? 'Deselect All' : 'Select All'}
            </Text>
          </Pressable>
        </View>

        <View style={{ marginTop: spacing.md }}>
          {categories.map((cat) => (
            <Pressable
              key={cat.key}
              onPress={() => handleToggleCategory(cat.key)}
              style={[
                styles.categoryRow,
                {
                  backgroundColor: cat.selected
                    ? `${colors.accent.primary}10`
                    : colors.background.secondary,
                  borderRadius: borderRadius.md,
                  padding: spacing.md,
                  marginBottom: spacing.xs,
                  borderWidth: cat.selected ? 1 : 0,
                  borderColor: colors.accent.primary,
                },
              ]}
            >
              {cat.ioniconsName ? (
                <Ionicons name={cat.ioniconsName} size={18} color={colors.text.secondary} style={{ marginRight: spacing.md }} />
              ) : (
                <Text style={{ fontSize: 18, marginRight: spacing.md }}>
                  {cat.icon}
                </Text>
              )}
              <Text
                style={[
                  typography.body,
                  {
                    color: cat.selected
                      ? colors.text.primary
                      : colors.text.secondary,
                    flex: 1,
                  },
                ]}
              >
                {cat.label}
              </Text>
              <View
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: cat.selected
                      ? colors.accent.primary
                      : 'transparent',
                    borderColor: cat.selected
                      ? colors.accent.primary
                      : colors.border.default,
                    borderRadius: 6,
                  },
                ]}
              >
                {cat.selected && (
                  <Text style={{ color: colors.text.inverse, fontSize: 12 }}>
                    {'\u2713'}
                  </Text>
                )}
              </View>
            </Pressable>
          ))}
        </View>
      </Animated.View>

      {/* Export Progress */}
      {isExporting && (
        <Animated.View entering={FadeInDown.duration(300)}>
          <Card
            variant="default"
            style={{ marginTop: spacing.xl }}
          >
            <Text
              style={[
                typography.bodyBold,
                {
                  color: colors.text.primary,
                  marginBottom: spacing.sm,
                },
              ]}
            >
              Generating export...
            </Text>
            <ProgressBar
              progress={exportProgress}
              color={colors.accent.primary}
              showPercentage
            />
          </Card>
        </Animated.View>
      )}

      {/* Generate Button */}
      <Animated.View entering={FadeInDown.delay(150).duration(400)}>
        <Button
          title={isExporting ? 'Exporting...' : 'Generate & Share'}
          variant="primary"
          fullWidth
          onPress={handleExport}
          loading={isExporting}
          disabled={isExporting || selectedCount === 0}
          style={{ marginTop: spacing.xl }}
        />
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  formatRow: {
    flexDirection: 'row',
  },
  formatOption: {
    flex: 1,
    alignItems: 'center',
  },
  rangeChip: {
    alignItems: 'center',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
