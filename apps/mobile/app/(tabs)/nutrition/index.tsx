// =============================================================================
// TRANSFORMR -- Nutrition Home / Daily View
// =============================================================================

import { useState, useCallback, useMemo, useEffect } from 'react';
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme/index';
import { MonoText } from '@components/ui/MonoText';
import { Card } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';
import { ProgressRing } from '@components/ui/ProgressRing';
import { BottomSheet } from '@components/ui/BottomSheet';
import { MealCard } from '@components/nutrition/MealCard';
import { useNutrition } from '@hooks/useNutrition';
import { useNutritionStore } from '@stores/nutritionStore';
import { useProfileStore } from '@stores/profileStore';
import { formatCalories, formatMacro, formatOz, formatDateShort } from '@utils/formatters';
import { MEAL_TYPES, MACRO_COLORS, DEFAULT_WATER_TARGET_OZ } from '@utils/constants';
import { hapticLight, hapticMedium, hapticSuccess } from '@utils/haptics';
import { AIInsightCard } from '@components/cards/AIInsightCard';
import { HelpBubble } from '@components/ui/HelpBubble';
import { EmptyState } from '@components/ui/EmptyState';
import { ProgressBar } from '@components/ui/ProgressBar';
import { useFeatureGate } from '@hooks/useFeatureGate';
import type { NutritionLog } from '@app-types/database';
import { HelpIcon } from '@components/ui/HelpIcon';
import { GlowCard } from '@components/ui/GlowCard';
import { ScreenHelpButton } from '@components/ui/ScreenHelpButton';
import { ActionToast, useActionToast } from '@components/ui/ActionToast';
import { Coachmark } from '@components/ui/Coachmark';
import type { CoachmarkStep } from '@components/ui/Coachmark';
import { HELP } from '../../../constants/helpContent';
import { SCREEN_HELP } from '../../../constants/screenHelp';
import { COACHMARK_KEYS, COACHMARK_CONTENT } from '../../../constants/coachmarkSteps';

type MealType = typeof MEAL_TYPES[number];

interface MealSection {
  type: MealType;
  label: string;
  emoji: string;
}

const MEAL_SECTIONS: MealSection[] = [
  { type: 'breakfast', label: 'Breakfast', emoji: '\u{1F373}' },
  { type: 'lunch', label: 'Lunch', emoji: '\u{1F96A}' },
  { type: 'dinner', label: 'Dinner', emoji: '\u{1F35D}' },
  { type: 'snack', label: 'Snacks', emoji: '\u{1F34E}' },
  { type: 'shake', label: 'Shakes', emoji: '\u{1F964}' },
  { type: 'pre_workout', label: 'Pre-Workout', emoji: '\u{26A1}' },
  { type: 'post_workout', label: 'Post-Workout', emoji: '\u{1F4AA}' },
];

function getDateString(offset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().split('T')[0] ?? '';
}

function getDateLabel(offset: number): string {
  if (offset === 0) return 'Today';
  if (offset === -1) return 'Yesterday';
  if (offset === 1) return 'Tomorrow';
  return formatDateShort(new Date(Date.now() + offset * 86400000).toISOString());
}

export default function NutritionHomeScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();

  const { todayMacros } = useNutrition();
  const { todayLogs, waterLogs, supplements, supplementLogs, logWater, fetchTodayNutrition, deleteLog, foodNameMap } =
    useNutritionStore();
  const { profile } = useProfileStore();

  const cameraGate = useFeatureGate('ai_meal_camera');
  const barcodeGate = useFeatureGate('barcode_scanner');

  const [dayOffset, setDayOffset] = useState(0);
  const [fabOpen, setFabOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { toast, show: showToast, hide: hideToast } = useActionToast();

  const [coachmarkSteps, setCoachmarkSteps] = React.useState<CoachmarkStep[]>([]);
  const macroRingsRef = React.useRef<View>(null);
  const fabRef = React.useRef<View>(null);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => <ScreenHelpButton content={SCREEN_HELP.nutritionHome} />,
    });
  }, [navigation]);

  useEffect(() => {
    void fetchTodayNutrition(dayOffset);
  }, [dayOffset, fetchTodayNutrition]);

  const measureCoachmarks = React.useCallback(() => {
    const content = COACHMARK_CONTENT.nutrition;
    const steps: CoachmarkStep[] = [];
    let pending = 2;
    const done = () => {
      if (--pending === 0) setCoachmarkSteps(steps.filter(Boolean) as CoachmarkStep[]);
    };
    macroRingsRef.current?.measure((_x, _y, w, h, px, py) => {
      const s0 = content[0];
      if (s0) steps[0] = { ...s0, targetX: px, targetY: py, targetWidth: w, targetHeight: h };
      done();
    });
    fabRef.current?.measure((_x, _y, w, h, px, py) => {
      const s1 = content[1];
      if (s1) steps[1] = { ...s1, targetX: px, targetY: py, targetWidth: w, targetHeight: h };
      done();
    });
  }, []);

  const targets = useMemo(() => ({
    calories: profile?.daily_calorie_target ?? 2200,
    protein: profile?.daily_protein_target ?? 180,
    carbs: profile?.daily_carb_target ?? 250,
    fat: profile?.daily_fat_target ?? 70,
    water: profile?.daily_water_target_oz ?? DEFAULT_WATER_TARGET_OZ,
  }), [profile]);

  const remaining = useMemo(() => ({
    calories: Math.max(0, targets.calories - todayMacros.calories),
    protein: Math.max(0, targets.protein - todayMacros.protein),
    carbs: Math.max(0, targets.carbs - todayMacros.carbs),
    fat: Math.max(0, targets.fat - todayMacros.fat),
  }), [targets, todayMacros]);

  const totalWater = useMemo(
    () => waterLogs.reduce((sum, log) => sum + log.amount_oz, 0),
    [waterLogs],
  );

  const supplementsTaken = useMemo(() => {
    const takenIds = new Set(supplementLogs.map((l) => l.supplement_id));
    return supplements.map((s) => ({
      ...s,
      taken: takenIds.has(s.id),
    }));
  }, [supplements, supplementLogs]);

  const logsByMeal = useMemo(() => {
    const grouped: Record<string, NutritionLog[]> = {};
    for (const log of todayLogs) {
      const key = log.meal_type ?? 'snack';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(log);
    }
    return grouped;
  }, [todayLogs]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTodayNutrition(dayOffset);
    setRefreshing(false);
  }, [dayOffset, fetchTodayNutrition]);

  const handlePrevDay = useCallback(() => {
    hapticLight();
    setDayOffset((prev) => prev - 1);
  }, []);

  const handleNextDay = useCallback(() => {
    hapticLight();
    setDayOffset((prev) => prev + 1);
  }, []);

  const handleQuickAdd = useCallback((mealType: MealType) => {
    hapticLight();
    router.push({ pathname: '/(tabs)/nutrition/add-food', params: { meal: mealType } });
  }, [router]);

  const handleEditLog = useCallback((logId: string) => {
    router.push({ pathname: '/(tabs)/nutrition/add-food', params: { editId: logId } });
  }, [router]);

  const handleDeleteLog = useCallback((logId: string) => {
    hapticMedium();
    void deleteLog(logId);
  }, [deleteLog]);

  const handleAddWater = useCallback(async (oz: number) => {
    hapticSuccess();
    await logWater(oz);
    const newTotal = totalWater + oz;
    showToast('Hydration logged', { subtext: `${Math.round(newTotal)}oz today` });
  }, [logWater, totalWater, showToast]);

  const handleFabToggle = useCallback(() => {
    hapticLight();
    setFabOpen((prev) => !prev);
  }, []);

  const handleFabAction = useCallback((action: 'camera' | 'barcode' | 'manual' | 'menu') => {
    setFabOpen(false);
    hapticMedium();
    switch (action) {
      case 'camera':
        if (!cameraGate.isAvailable || cameraGate.isCapped) {
          cameraGate.showUpgradeModal();
          return;
        }
        router.push('/(tabs)/nutrition/meal-camera');
        break;
      case 'barcode':
        if (!barcodeGate.isAvailable || barcodeGate.isCapped) {
          barcodeGate.showUpgradeModal();
          return;
        }
        router.push('/(tabs)/nutrition/barcode-scanner');
        break;
      case 'menu':
        router.push('/(tabs)/nutrition/menu-scanner');
        break;
      case 'manual':
        router.push('/(tabs)/nutrition/add-food');
        break;
    }
  }, [router, cameraGate, barcodeGate]);

  const fabScale = useSharedValue(1);
  const fabAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + spacing.sm,
            paddingHorizontal: spacing.lg,
            paddingBottom: spacing.md,
            backgroundColor: colors.background.primary,
          },
        ]}
      >
        <Text style={[typography.h1, { color: colors.text.primary }]}>Nutrition</Text>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => { hapticLight(); router.push('/(tabs)/nutrition/saved-meals'); }}
            accessibilityLabel="Saved meals"
            style={[styles.headerBtn, { backgroundColor: colors.background.secondary, borderRadius: borderRadius.md }]}
          >
            <Ionicons name="bookmark-outline" size={20} color={colors.text.secondary} />
          </Pressable>
          <Pressable
            onPress={() => { hapticLight(); router.push('/(tabs)/nutrition/analytics'); }}
            accessibilityLabel="Nutrition analytics"
            style={[styles.headerBtn, { backgroundColor: colors.background.secondary, borderRadius: borderRadius.md, marginLeft: spacing.sm }]}
          >
            <Ionicons name="analytics-outline" size={20} color={colors.text.secondary} />
          </Pressable>
        </View>
      </View>

      {/* Date Selector */}
      <View style={[styles.dateSelector, { paddingHorizontal: spacing.lg, marginBottom: spacing.md }]}>
        <Pressable onPress={handlePrevDay} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.text.secondary} />
        </Pressable>
        <Pressable onPress={() => setDayOffset(0)}>
          <Text style={[typography.h3, { color: colors.text.primary }]}>
            {getDateLabel(dayOffset)}
          </Text>
          {dayOffset !== 0 && (
            <Text style={[typography.tiny, { color: colors.accent.primary, textAlign: 'center', marginTop: 2 }]}>
              {getDateString(dayOffset)}
            </Text>
          )}
        </Pressable>
        <Pressable onPress={handleNextDay} hitSlop={12}>
          <Ionicons name="chevron-forward" size={24} color={colors.text.secondary} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent.primary}
          />
        }
      >
        <AIInsightCard screenKey="nutrition/index" style={{ marginBottom: spacing.md }} />

        {/* Macro Rings */}
        <View ref={macroRingsRef} onLayout={measureCoachmarks}>
          <GlowCard intensity="subtle" animated style={{ marginBottom: spacing.lg }}>
            <View style={[styles.sectionHeader, { marginBottom: spacing.md }]}>
              <Text style={[typography.h3, { color: colors.text.primary }]}>Today's Macros</Text>
              <HelpIcon content={HELP.macroRings} size={13} />
            </View>
            <View style={styles.macroRingsRow}>
              <ProgressRing
                progress={Math.min(1, todayMacros.calories / targets.calories)}
                size={100}
                strokeWidth={8}
                color={colors.accent.primary}
              >
                <MonoText variant="statSmall" color={colors.text.primary}>
                  {Math.round(todayMacros.calories)}
                </MonoText>
                <Text style={[typography.tiny, { color: colors.text.muted }]}>cal</Text>
              </ProgressRing>

              <View style={styles.macroMiniRings}>
                <View style={styles.miniRingItem}>
                  <ProgressRing
                    progress={Math.min(1, todayMacros.protein / targets.protein)}
                    size={56}
                    strokeWidth={5}
                    color={MACRO_COLORS.protein}
                  >
                    <MonoText variant="monoCaption" color={colors.text.primary}>
                      {Math.round(todayMacros.protein)}g
                    </MonoText>
                  </ProgressRing>
                  <Text style={[typography.tiny, { color: MACRO_COLORS.protein, marginTop: 4 }]}>
                    Protein
                  </Text>
                </View>

                <View style={styles.miniRingItem}>
                  <ProgressRing
                    progress={Math.min(1, todayMacros.carbs / targets.carbs)}
                    size={56}
                    strokeWidth={5}
                    color={MACRO_COLORS.carbs}
                  >
                    <MonoText variant="monoCaption" color={colors.text.primary}>
                      {Math.round(todayMacros.carbs)}g
                    </MonoText>
                  </ProgressRing>
                  <Text style={[typography.tiny, { color: MACRO_COLORS.carbs, marginTop: 4 }]}>
                    Carbs
                  </Text>
                </View>

                <View style={styles.miniRingItem}>
                  <ProgressRing
                    progress={Math.min(1, todayMacros.fat / targets.fat)}
                    size={56}
                    strokeWidth={5}
                    color={MACRO_COLORS.fat}
                  >
                    <MonoText variant="monoCaption" color={colors.text.primary}>
                      {Math.round(todayMacros.fat)}g
                    </MonoText>
                  </ProgressRing>
                  <Text style={[typography.tiny, { color: MACRO_COLORS.fat, marginTop: 4 }]}>
                    Fat
                  </Text>
                </View>
              </View>
            </View>

            {/* Remaining Macros */}
            <View style={[styles.remainingRow, { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border.subtle }]}>
              <View style={styles.remainingItem}>
                <Text style={[typography.tiny, { color: colors.text.muted }]}>Remaining</Text>
                <MonoText variant="monoCaption" color={colors.text.primary}>
                  {formatCalories(remaining.calories)}
                </MonoText>
              </View>
              <View style={styles.remainingItem}>
                <Text style={[typography.tiny, { color: MACRO_COLORS.protein }]}>P</Text>
                <MonoText variant="monoCaption" color={colors.text.primary}>
                  {formatMacro(remaining.protein)}
                </MonoText>
              </View>
              <View style={styles.remainingItem}>
                <Text style={[typography.tiny, { color: MACRO_COLORS.carbs }]}>C</Text>
                <MonoText variant="monoCaption" color={colors.text.primary}>
                  {formatMacro(remaining.carbs)}
                </MonoText>
              </View>
              <View style={styles.remainingItem}>
                <Text style={[typography.tiny, { color: MACRO_COLORS.fat }]}>F</Text>
                <MonoText variant="monoCaption" color={colors.text.primary}>
                  {formatMacro(remaining.fat)}
                </MonoText>
              </View>
            </View>
          </GlowCard>
        </View>
        {/* Calorie Progress Bar */}
        <View>
          <Card style={{ marginBottom: spacing.lg }}>
            <ProgressBar
              progress={todayMacros.calories / targets.calories}
              label={`${formatCalories(todayMacros.calories)} of ${formatCalories(targets.calories)}`}
              showPercentage
              color={
                todayMacros.calories > targets.calories * 1.1
                  ? colors.accent.danger
                  : todayMacros.calories >= targets.calories * 0.9
                  ? colors.accent.warning
                  : colors.accent.success
              }
              height={12}
            />
          </Card>
        </View>

        <HelpBubble id="nutrition_macros" message="Tap any ring to see your full macro breakdown" position="below" />

        {/* Quick Links */}
        <View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: spacing.lg }}
            contentContainerStyle={{ gap: spacing.sm }}
          >
            <Pressable
              onPress={() => { hapticLight(); router.push('/(tabs)/nutrition/meal-plans'); }}
              accessibilityLabel="Meal plans"
              style={[styles.quickLink, { backgroundColor: colors.background.secondary, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }]}
            >
              <Ionicons name="calendar-outline" size={16} color={colors.accent.primary} />
              <Text style={[typography.caption, { color: colors.text.primary, marginLeft: spacing.xs }]}>Meal Plans</Text>
            </Pressable>
            <Pressable
              onPress={() => { hapticLight(); router.push('/(tabs)/nutrition/meal-prep'); }}
              accessibilityLabel="Meal prep"
              style={[styles.quickLink, { backgroundColor: colors.background.secondary, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }]}
            >
              <Ionicons name="restaurant-outline" size={16} color={colors.accent.success} />
              <Text style={[typography.caption, { color: colors.text.primary, marginLeft: spacing.xs }]}>Meal Prep</Text>
            </Pressable>
            <Pressable
              onPress={() => { hapticLight(); router.push('/(tabs)/nutrition/grocery-list'); }}
              accessibilityLabel="Grocery list"
              style={[styles.quickLink, { backgroundColor: colors.background.secondary, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }]}
            >
              <Ionicons name="cart-outline" size={16} color={colors.accent.warning} />
              <Text style={[typography.caption, { color: colors.text.primary, marginLeft: spacing.xs }]}>Groceries</Text>
            </Pressable>
            <Pressable
              onPress={() => { hapticLight(); router.push('/(tabs)/nutrition/supplements'); }}
              accessibilityLabel="View supplements"
              style={[styles.quickLink, { backgroundColor: colors.background.secondary, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }]}
            >
              <Ionicons name="medical-outline" size={16} color={colors.accent.info} />
              <Text style={[typography.caption, { color: colors.text.primary, marginLeft: spacing.xs }]}>Supplements</Text>
            </Pressable>
          </ScrollView>
        </View>

        {/* Global empty food log state */}
        {todayLogs.length === 0 && dayOffset === 0 && (
          <View>
            <EmptyState
              icon={'\u{1F957}'}
              title="Nothing logged yet"
              subtitle="Start logging to see your macros"
              actionLabel="Log a Meal"
              onAction={() => handleQuickAdd('snack')}
              style={{ marginBottom: spacing.lg }}
            />
          </View>
        )}

        {/* Meal Sections */}
        {MEAL_SECTIONS.map((section) => {
          const logs = logsByMeal[section.type] ?? [];
          const sectionCalories = logs.reduce((sum, l) => sum + l.calories, 0);

          return (
            <View
              key={section.type}
              style={{ marginBottom: spacing.lg }}
            >
              <View style={[styles.sectionHeader, { marginBottom: spacing.sm }]}>
                <View style={styles.sectionTitleRow}>
                  <Text style={[typography.h3, { color: colors.text.primary }]}>
                    {section.emoji} {section.label}
                  </Text>
                  {sectionCalories > 0 && (
                    <Badge label={formatCalories(sectionCalories)} variant="info" size="sm" />
                  )}
                </View>
                <Pressable
                  onPress={() => handleQuickAdd(section.type)}
                  hitSlop={8}
                  style={[styles.addBtn, { backgroundColor: `${colors.accent.primary}20`, borderRadius: borderRadius.full }]}
                >
                  <Ionicons name="add" size={18} color={colors.accent.primary} />
                  <Text style={[typography.caption, { color: colors.accent.primary, marginLeft: 2 }]}>Add</Text>
                </Pressable>
              </View>

              {logs.length > 0 ? (
                <View style={{ gap: spacing.sm }}>
                  {logs.map((log) => (
                    <MealCard
                      key={log.id}
                      log={log}
                      foodName={log.food_id ? (foodNameMap[log.food_id] ?? 'Custom Food') : 'Custom Food'}
                      onEdit={handleEditLog}
                      onDelete={handleDeleteLog}
                    />
                  ))}
                </View>
              ) : (
                <Pressable
                  onPress={() => handleQuickAdd(section.type)}
                  style={[
                    styles.emptyMeal,
                    {
                      backgroundColor: colors.background.secondary,
                      borderRadius: borderRadius.lg,
                      borderColor: colors.border.subtle,
                      borderWidth: 1,
                      borderStyle: 'dashed',
                      padding: spacing.lg,
                    },
                  ]}
                >
                  <Ionicons name="add-circle-outline" size={24} color={colors.text.muted} />
                  <Text style={[typography.caption, { color: colors.text.muted, marginTop: spacing.xs }]}>
                    Tap to log {section.label.toLowerCase()}
                  </Text>
                </Pressable>
              )}
            </View>
          );
        })}

        {/* Water Tracker */}
        <View>
          <Card style={{ marginBottom: spacing.lg }}>
            <View style={styles.sectionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[typography.h3, { color: colors.text.primary }]}>
                  {'\u{1F4A7}'} Water
                </Text>
                <HelpIcon content={HELP.waterTracker} size={13} />
              </View>
              <MonoText variant="monoCaption" color={colors.text.muted}>
                {formatOz(totalWater)} / {formatOz(targets.water)}
              </MonoText>
            </View>

            <View style={[styles.waterBarContainer, { marginTop: spacing.md }]}>
              <View
                style={[
                  styles.waterBarTrack,
                  {
                    backgroundColor: colors.background.tertiary,
                    borderRadius: borderRadius.full,
                    height: 12,
                  },
                ]}
              >
                <View
                  style={[
                    styles.waterBarFill,
                    {
                      backgroundColor: colors.accent.info,
                      borderRadius: borderRadius.full,
                      width: `${Math.min(100, (totalWater / targets.water) * 100)}%`,
                      height: 12,
                    },
                  ]}
                />
              </View>
            </View>

            <View style={[styles.waterButtonRow, { marginTop: spacing.md, gap: spacing.sm }]}>
              {[4, 8, 12, 16].map((oz) => (
                <Pressable
                  key={oz}
                  onPress={() => handleAddWater(oz)}
                  style={[
                    styles.waterBtn,
                    {
                      backgroundColor: colors.background.tertiary,
                      borderRadius: borderRadius.md,
                      paddingVertical: spacing.sm,
                      paddingHorizontal: spacing.md,
                    },
                  ]}
                >
                  <MonoText variant="monoCaption" color={colors.accent.info}>
                    +{oz}oz
                  </MonoText>
                </Pressable>
              ))}
            </View>
          </Card>
        </View>

        {/* Supplement Checklist */}
        <View>
          <Card style={{ marginBottom: spacing.lg }}>
            <View style={styles.sectionHeader}>
              <Text style={[typography.h3, { color: colors.text.primary }]}>
                {'\u{1F48A}'} Supplements
              </Text>
              <Pressable
                onPress={() => { hapticLight(); router.push('/(tabs)/nutrition/supplements'); }}
                accessibilityLabel="Manage supplements"
              >
                <Text style={[typography.caption, { color: colors.accent.primary }]}>Manage</Text>
              </Pressable>
            </View>

            {supplementsTaken.length > 0 ? (
              <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
                {supplementsTaken.map((supp) => (
                  <Pressable
                    key={supp.id}
                    style={[styles.supplementRow, { paddingVertical: spacing.sm }]}
                    onPress={() => {
                      if (!supp.taken) {
                        hapticSuccess();
                        useNutritionStore.getState().logSupplement(supp.id).catch(() => {
                          // Supplement log is non-critical; store state already updated optimistically
                        });
                      }
                    }}
                  >
                    <Ionicons
                      name={supp.taken ? 'checkbox' : 'square-outline'}
                      size={22}
                      color={supp.taken ? colors.accent.success : colors.text.muted}
                    />
                    <View style={{ flex: 1, marginLeft: spacing.md }}>
                      <Text
                        style={[
                          typography.body,
                          {
                            color: supp.taken ? colors.text.muted : colors.text.primary,
                            textDecorationLine: supp.taken ? 'line-through' : 'none',
                          },
                        ]}
                      >
                        {supp.name}
                      </Text>
                      {supp.dosage && (
                        <Text style={[typography.tiny, { color: colors.text.muted }]}>
                          {supp.dosage}
                        </Text>
                      )}
                    </View>
                    {supp.category && (
                      <Badge label={supp.category} size="sm" />
                    )}
                  </Pressable>
                ))}
              </View>
            ) : (
              <Pressable
                onPress={() => router.push('/(tabs)/nutrition/supplements')}
                style={{ marginTop: spacing.md, alignItems: 'center', paddingVertical: spacing.lg }}
              >
                <Text style={[typography.caption, { color: colors.text.muted }]}>
                  No supplements tracked. Tap to add.
                </Text>
              </Pressable>
            )}
          </Card>
        </View>
      </ScrollView>

      <HelpBubble id="nutrition_add" message="Log meals with camera, barcode, or search" position="above" />

      {/* FAB */}
      <Animated.View
        ref={fabRef}
        style={[
          styles.fab,
          {
            bottom: insets.bottom + 20,
            right: spacing.lg,
            backgroundColor: colors.accent.primary,
            borderRadius: borderRadius.full,
          },
          fabAnimatedStyle,
        ]}
      >
        <Pressable
          onPress={handleFabToggle}
          accessibilityLabel="Log food"
          onPressIn={() => { fabScale.value = withSpring(0.9); }}
          onPressOut={() => { fabScale.value = withSpring(1); }}
          style={styles.fabInner}
        >
          <Ionicons name={fabOpen ? 'close' : 'add'} size={28} color="#FFFFFF" />
        </Pressable>
      </Animated.View>

      <ActionToast
        message={toast.message}
        subtext={toast.subtext}
        visible={toast.visible}
        onHide={hideToast}
        type={toast.type}
      />
      <Coachmark screenKey={COACHMARK_KEYS.nutrition} steps={coachmarkSteps} />

      {/* FAB Bottom Sheet */}
      <BottomSheet
        visible={fabOpen}
        onDismiss={() => setFabOpen(false)}
        snapPoints={[0.35]}
      >
        <View style={{ padding: spacing.lg, gap: spacing.md }}>
          <Text style={[typography.h3, { color: colors.text.primary, marginBottom: spacing.sm }]}>
            Log Food
          </Text>
          <Pressable
            onPress={() => handleFabAction('camera')}
            style={[styles.fabOption, { backgroundColor: colors.background.secondary, borderRadius: borderRadius.lg, padding: spacing.lg }]}
          >
            <View style={[styles.fabOptionIcon, { backgroundColor: `${colors.accent.primary}20`, borderRadius: borderRadius.md }]}>
              <Ionicons name="camera" size={24} color={colors.accent.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={[typography.bodyBold, { color: colors.text.primary }]}>AI Camera</Text>
              <Text style={[typography.caption, { color: colors.text.muted }]}>Snap a photo of your meal</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => handleFabAction('barcode')}
            style={[styles.fabOption, { backgroundColor: colors.background.secondary, borderRadius: borderRadius.lg, padding: spacing.lg }]}
          >
            <View style={[styles.fabOptionIcon, { backgroundColor: `${colors.accent.success}20`, borderRadius: borderRadius.md }]}>
              <Ionicons name="barcode" size={24} color={colors.accent.success} />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={[typography.bodyBold, { color: colors.text.primary }]}>Barcode</Text>
              <Text style={[typography.caption, { color: colors.text.muted }]}>Scan a product barcode</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => handleFabAction('menu')}
            style={[styles.fabOption, { backgroundColor: colors.background.secondary, borderRadius: borderRadius.lg, padding: spacing.lg }]}
          >
            <View style={[styles.fabOptionIcon, { backgroundColor: `${colors.accent.warning}20`, borderRadius: borderRadius.md }]}>
              <Ionicons name="reader" size={24} color={colors.accent.warning} />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={[typography.bodyBold, { color: colors.text.primary }]}>Menu Scanner</Text>
              <Text style={[typography.caption, { color: colors.text.muted }]}>Scan a restaurant menu</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => handleFabAction('manual')}
            style={[styles.fabOption, { backgroundColor: colors.background.secondary, borderRadius: borderRadius.lg, padding: spacing.lg }]}
          >
            <View style={[styles.fabOptionIcon, { backgroundColor: `${colors.accent.info}20`, borderRadius: borderRadius.md }]}>
              <Ionicons name="create" size={24} color={colors.accent.info} />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={[typography.bodyBold, { color: colors.text.primary }]}>Manual Entry</Text>
              <Text style={[typography.caption, { color: colors.text.muted }]}>Search or type macros</Text>
            </View>
          </Pressable>
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  headerBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scroll: { flex: 1 },
  macroRingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  macroMiniRings: {
    flexDirection: 'row',
    gap: 16,
  },
  miniRingItem: {
    alignItems: 'center',
  },
  remainingRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  remainingItem: {
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  emptyMeal: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  waterBarContainer: {},
  waterBarTrack: { overflow: 'hidden' },
  waterBarFill: {},
  waterButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  waterBtn: {
    flex: 1,
    alignItems: 'center',
  },
  supplementRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    elevation: 8,
    shadowColor: '#000', /* brand-ok */
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fabOptionIcon: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
