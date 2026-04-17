// =============================================================================
// TRANSFORMR -- Dashboard Builder Screen
// =============================================================================

import { useCallback, useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useFeatureGate } from '@hooks/useFeatureGate';
import { GatePromptCard } from '@components/ui/GatePromptCard';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { ScreenHelpButton } from '@components/ui/ScreenHelpButton';
import { SCREEN_HELP } from '../../../constants/screenHelp';
import { useTheme } from '@theme/index';
import { StatusBar } from 'expo-status-bar';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { useDashboardStore } from '@stores/dashboardStore';
import { hapticLight, hapticMedium, hapticSuccess } from '@utils/haptics';

// ---------------------------------------------------------------------------
// Widget type icons
// ---------------------------------------------------------------------------
const WIDGET_ICONS: Record<string, string> = {
  workout_summary: '🏋️',
  macro_tracker: '🍎',
  habit_streaks: '🔥',
  goal_progress: '🎯',
  mood_check: '😊',
  sleep_quality: '😴',
  water_intake: '💧',
  partner_activity: '👫',
  business_revenue: '💰',
  finance_overview: '📊',
};

const SIZE_LABELS: Record<string, string> = {
  small: 'S',
  medium: 'M',
  large: 'L',
};

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------
export default function DashboardBuilderScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const gate = useFeatureGate('dashboard_builder');

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => <ScreenHelpButton content={SCREEN_HELP.dashboardBuilderScreen} />,
    });
  }, [navigation]);

  const {
    layout,
    isLoading,
    saveLayout,
    resetToDefault,
  } = useDashboardStore();

  const [widgets, setWidgets] = useState(layout);
  const [hasChanges, setHasChanges] = useState(false);

  // Toggle widget visibility
  const handleToggleWidget = useCallback(
    (widgetId: string) => {
      void hapticLight();
      setWidgets((prev) =>
        prev.map((w) =>
          w.id === widgetId ? { ...w, visible: !w.visible } : w,
        ),
      );
      setHasChanges(true);
    },
    [],
  );

  // Move widget up
  const handleMoveUp = useCallback(
    (index: number) => {
      if (index <= 0) return;
      void hapticLight();
      setWidgets((prev) => {
        const next = [...prev];
        const temp = next[index - 1];
        if (!temp || !next[index]) return prev;
        next[index - 1] = { ...next[index], position: index - 1 };
        next[index] = { ...temp, position: index };
        return next;
      });
      setHasChanges(true);
    },
    [],
  );

  // Move widget down
  const handleMoveDown = useCallback(
    (index: number) => {
      void hapticLight();
      setWidgets((prev) => {
        if (index >= prev.length - 1) return prev;
        const next = [...prev];
        const temp = next[index + 1];
        if (!temp || !next[index]) return prev;
        next[index + 1] = { ...next[index], position: index + 1 };
        next[index] = { ...temp, position: index };
        return next;
      });
      setHasChanges(true);
    },
    [],
  );

  // Cycle size
  const handleCycleSize = useCallback(
    (widgetId: string) => {
      void hapticLight();
      const sizes: ('small' | 'medium' | 'large')[] = ['small', 'medium', 'large'];
      setWidgets((prev) =>
        prev.map((w) => {
          if (w.id !== widgetId) return w;
          const currentIdx = sizes.indexOf(w.size);
          const nextSize = sizes[(currentIdx + 1) % sizes.length] as 'small' | 'medium' | 'large';
          return { ...w, size: nextSize };
        }),
      );
      setHasChanges(true);
    },
    [],
  );

  // Save
  const handleSave = useCallback(async () => {
    await hapticSuccess();
    await saveLayout(widgets);
    setHasChanges(false);
    Alert.alert('Saved', 'Dashboard layout updated.');
  }, [widgets, saveLayout]);

  // Reset
  const handleReset = useCallback(() => {
    Alert.alert('Reset Layout', 'Restore the default dashboard layout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: async () => {
          await hapticMedium();
          await resetToDefault();
          setWidgets(useDashboardStore.getState().layout);
          setHasChanges(false);
        },
      },
    ]);
  }, [resetToDefault]);

  // Visible / hidden split
  const visibleWidgets = useMemo(
    () => widgets.filter((w) => w.visible).sort((a, b) => a.position - b.position),
    [widgets],
  );
  const hiddenWidgets = useMemo(
    () => widgets.filter((w) => !w.visible),
    [widgets],
  );

  if (!gate.isAvailable) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.primary }}>
        <GatePromptCard featureKey="dashboard_builder" height={200} />
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.lg,
          paddingBottom: insets.bottom + 120,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Layout Preview */}
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text
            style={[
              typography.h3,
              { color: colors.text.primary, marginBottom: spacing.md },
            ]}
          >
            Current Layout
          </Text>
          <Card variant="outlined" style={{ marginBottom: spacing.xl }}>
            <View style={styles.previewGrid}>
              {visibleWidgets.map((w) => (
                <View
                  key={w.id}
                  style={[
                    styles.previewBlock,
                    {
                      backgroundColor: `${colors.accent.primary}15`,
                      borderRadius: borderRadius.sm,
                      padding: spacing.sm,
                      width:
                        w.size === 'large'
                          ? '100%'
                          : w.size === 'medium'
                            ? '48%'
                            : '30%',
                    },
                  ]}
                >
                  <Text style={{ fontSize: 14 }}>
                    {WIDGET_ICONS[w.type] ?? '📦'}
                  </Text>
                  <Text
                    style={[
                      typography.tiny,
                      { color: colors.text.secondary },
                    ]}
                    numberOfLines={1}
                  >
                    {w.title}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        </Animated.View>

        {/* Active Widgets */}
        <Text
          style={[
            typography.h3,
            { color: colors.text.primary, marginBottom: spacing.md },
          ]}
        >
          Active Widgets
        </Text>
        {visibleWidgets.map((widget, index) => (
          <Animated.View
            key={widget.id}
            entering={FadeInDown.delay(index * 30).duration(300)}
            layout={Layout.springify()}
          >
            <View
              style={[
                styles.widgetRow,
                {
                  backgroundColor: colors.background.secondary,
                  borderRadius: borderRadius.md,
                  padding: spacing.md,
                  marginBottom: spacing.sm,
                },
              ]}
            >
              <Text style={{ fontSize: 20, marginRight: spacing.sm }}>
                {WIDGET_ICONS[widget.type] ?? '📦'}
              </Text>
              <View style={{ flex: 1 }}>
      <StatusBar style="light" backgroundColor="#0C0A15" />
                <Text
                  style={[typography.bodyBold, { color: colors.text.primary }]}
                  numberOfLines={1}
                >
                  {widget.title}
                </Text>
              </View>

              {/* Size cycle */}
              <Pressable
                onPress={() => handleCycleSize(widget.id)}
                accessibilityLabel={`Change size of ${widget.title}, currently ${widget.size}`}
                accessibilityRole="button"
                style={[
                  styles.sizeBtn,
                  {
                    backgroundColor: colors.background.tertiary,
                    borderRadius: borderRadius.sm,
                    marginRight: spacing.xs,
                  },
                ]}
              >
                <Text
                  style={[
                    typography.captionBold,
                    { color: colors.accent.primary },
                  ]}
                >
                  {SIZE_LABELS[widget.size] ?? 'M'}
                </Text>
              </Pressable>

              {/* Move up */}
              <Pressable
                onPress={() => handleMoveUp(index)}
                disabled={index === 0}
                accessibilityLabel={`Move ${widget.title} up`}
                accessibilityRole="button"
                style={[styles.arrowBtn, { opacity: index === 0 ? 0.3 : 1 }]}
              >
                <Text style={[typography.body, { color: colors.text.muted }]}>
                  {'\u25B2'}
                </Text>
              </Pressable>

              {/* Move down */}
              <Pressable
                onPress={() => handleMoveDown(index)}
                disabled={index === visibleWidgets.length - 1}
                accessibilityLabel={`Move ${widget.title} down`}
                accessibilityRole="button"
                style={[
                  styles.arrowBtn,
                  {
                    opacity:
                      index === visibleWidgets.length - 1 ? 0.3 : 1,
                  },
                ]}
              >
                <Text style={[typography.body, { color: colors.text.muted }]}>
                  {'\u25BC'}
                </Text>
              </Pressable>

              {/* Remove */}
              <Pressable
                onPress={() => handleToggleWidget(widget.id)}
                accessibilityLabel={`Remove ${widget.title}`}
                accessibilityRole="button"
                style={[styles.arrowBtn, { marginLeft: spacing.xs }]}
              >
                <Text
                  style={[typography.body, { color: colors.accent.danger }]}
                >
                  {'\u2715'}
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        ))}

        {/* Widget Library (hidden widgets) */}
        {hiddenWidgets.length > 0 && (
          <>
            <Text
              style={[
                typography.h3,
                {
                  color: colors.text.primary,
                  marginTop: spacing.xl,
                  marginBottom: spacing.md,
                },
              ]}
            >
              Widget Library
            </Text>
            {hiddenWidgets.map((widget) => (
              <Pressable
                key={widget.id}
                onPress={() => handleToggleWidget(widget.id)}
                accessibilityLabel={`Add ${widget.title} to dashboard`}
                accessibilityRole="button"
              >
                <View
                  style={[
                    styles.widgetRow,
                    {
                      backgroundColor: colors.background.tertiary,
                      borderRadius: borderRadius.md,
                      padding: spacing.md,
                      marginBottom: spacing.sm,
                      opacity: 0.7,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 20, marginRight: spacing.sm }}>
                    {WIDGET_ICONS[widget.type] ?? '📦'}
                  </Text>
                  <Text
                    style={[
                      typography.body,
                      { color: colors.text.secondary, flex: 1 },
                    ]}
                    numberOfLines={1}
                  >
                    {widget.title}
                  </Text>
                  <Text
                    style={[
                      typography.captionBold,
                      { color: colors.accent.success },
                    ]}
                  >
                    + Add
                  </Text>
                </View>
              </Pressable>
            ))}
          </>
        )}
      </ScrollView>

      {/* Bottom Action Bar */}
      <View
        style={[
          styles.actionBar,
          {
            backgroundColor: colors.background.secondary,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            paddingBottom: insets.bottom + spacing.md,
            borderTopColor: colors.border.subtle,
          },
        ]}
      >
        <Button
          title="Reset"
          variant="outline"
          onPress={handleReset}
          style={{ marginRight: spacing.md }}
        />
        <Button
          title="Save Layout"
          variant="primary"
          onPress={handleSave}
          loading={isLoading}
          disabled={!hasChanges}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  previewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  previewBlock: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  widgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sizeBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
  },
});
