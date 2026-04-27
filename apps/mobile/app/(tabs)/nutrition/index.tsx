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
import { Sun, ForkKnife, Moon, Cookie, Drop, Lightning, Barbell, Plus, CaretLeft, CaretRight, BookmarkSimple, ChartBar, Camera, Barcode, NotePencil, PencilSimple } from 'phosphor-react-native';
import { useTheme } from '@theme/index';
import { StatusBar } from 'expo-status-bar';
import { MonoText } from '@components/ui/MonoText';
import { TabHeroBackground } from '@components/ui/TabHeroBackground';
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
import { SectionTile } from '@components/ui/SectionTile';
import { PurpleRadialBackground } from '@components/ui/PurpleRadialBackground';
import { ScreenBackground } from '@components/ui/ScreenBackground';
import { AmbientBackground } from '@components/ui/AmbientBackground';
import { ScreenHelpButton } from '@components/ui/ScreenHelpButton';
import { ActionToast, useActionToast } from '@components/ui/ActionToast';
import { Coachmark } from '@components/ui/Coachmark';
import type { CoachmarkStep } from '@components/ui/Coachmark';
import { Icon3D, type Icon3DName } from '@components/ui/Icon3D';
import { HELP } from '../../../constants/helpContent';
import { SCREEN_HELP } from '../../../constants/screenHelp';
import { COACHMARK_KEYS, COACHMARK_CONTENT } from '../../../constants/coachmarkSteps';
import { VoiceMicButton } from '@components/ui/VoiceMicButton';
import type { ParsedVoiceCommand } from '@services/voice';
import { useChallengeStore } from '@stores/challengeStore';
import { checkWaterPace } from '@services/ai/compliance';

type MealType = typeof MEAL_TYPES[number];

type PhosphorIconComponent = React.ComponentType<{ size?: number; color?: string; weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone' }>;

interface MealSection {
  type: MealType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  phosphorIcon?: PhosphorIconComponent;
  icon3d?: Icon3DName;
}

// MEAL_SECTIONS is defined as a function so it can use theme colors at render time
function getMealSections(colors: ReturnType<typeof useTheme>['colors']): MealSection[] {
  return [
    { type: 'breakfast', label: 'Breakfast', icon: 'sunny-outline', color: colors.accent.warning, phosphorIcon: Sun, icon3d: 'sun' },
    { type: 'lunch', label: 'Lunch', icon: 'restaurant-outline', color: colors.accent.success, phosphorIcon: ForkKnife, icon3d: 'fork-knife' },
    { type: 'dinner', label: 'Dinner', icon: 'moon-outline', color: colors.accent.info, phosphorIcon: Moon, icon3d: 'moon' },
    { type: 'snack', label: 'Snacks', icon: 'nutrition-outline', color: colors.accent.pink, phosphorIcon: Cookie, icon3d: 'cookie' },
    { type: 'shake', label: 'Shakes', icon: 'water-outline', color: colors.accent.cyan, phosphorIcon: Drop, icon3d: 'drink' },
    { type: 'pre_workout', label: 'Pre-Workout', icon: 'flash-outline', color: colors.accent.fire, phosphorIcon: Lightning, icon3d: 'lightning' },
    { type: 'post_workout', label: 'Post-Workout', icon: 'barbell-outline', color: colors.accent.primary, phosphorIcon: Barbell, icon3d: 'dumbbell' },
  ];
}

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
  const MEAL_SECTIONS = getMealSections(colors);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();

  const { todayMacros } = useNutrition();
  const todayLogs = useNutritionStore((s) => s.todayLogs);
  const waterLogs = useNutritionStore((s) => s.waterLogs);
  const supplements = useNutritionStore((s) => s.supplements);
  const supplementLogs = useNutritionStore((s) => s.supplementLogs);
  const logWater = useNutritionStore((s) => s.logWater);
  const fetchTodayNutrition = useNutritionStore((s) => s.fetchTodayNutrition);
  const deleteLog = useNutritionStore((s) => s.deleteLog);
  const foodNameMap = useNutritionStore((s) => s.foodNameMap);
  const profile = useProfileStore((s) => s.profile);
  const activeEnrollment = useChallengeStore((s) => s.activeEnrollment);
  const challengeDefinitions = useChallengeStore((s) => s.challengeDefinitions);

  const cameraGate = useFeatureGate('ai_meal_camera');
  const barcodeGate = useFeatureGate('barcode_scanner');

  const [dayOffset, setDayOffset] = useState(0);
  const [fabOpen, setFabOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [waterPacingNote, setWaterPacingNote] = useState<string | null>(null);

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

    // If an active challenge has a water task, show pacing info (non-blocking)
    const activeDef = challengeDefinitions.find((d) => d.id === activeEnrollment?.challenge_id);
    const hasWaterTask = activeDef?.rules?.tasks?.some((t) => t.type === 'water') ?? false;
    if (activeEnrollment && hasWaterTask) {
      void checkWaterPace(activeEnrollment.id, oz, newTotal)
        .then((result) => setWaterPacingNote(result.recommendation || null));
    }
  }, [logWater, totalWater, showToast, activeEnrollment, challengeDefinitions]);

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

  // Voice command handler for nutrition domain
  const handleVoiceCommand = useCallback((result: ParsedVoiceCommand) => {
    const cmd = result.command;
    switch (cmd.action) {
      case 'log_water':
        void logWater((cmd as { oz: number }).oz);
        showToast(`Water logged: ${(cmd as { oz: number }).oz}oz`, { type: 'success' });
        break;
      case 'log_food':
        router.push(`/(tabs)/nutrition/add-food?query=${encodeURIComponent((cmd as { foodName: string }).foodName)}` as never);
        break;
      case 'check_macros':
        showToast(
          `Calories: ${Math.round(remaining.calories)} remaining`,
          { subtext: `Protein: ${Math.round(remaining.protein)}g | Carbs: ${Math.round(remaining.carbs)}g | Fat: ${Math.round(remaining.fat)}g`, type: 'info' },
        );
        break;
      default:
        showToast(result.humanReadable || 'Command received', { type: 'success' });
    }
  }, [logWater, router, remaining, showToast]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <ScreenBackground />
      <AmbientBackground />
      <StatusBar style="light" backgroundColor="#0C0A15" />
      <PurpleRadialBackground />
      <TabHeroBackground query="fresh ingredients meal prep dark" height={240} opacity={0.12} />
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
            <Icon3D name="bookmark" size={22} />
          </Pressable>
          <Pressable
            onPress={() => { hapticLight(); router.push('/(tabs)/nutrition/analytics'); }}
            accessibilityLabel="Nutrition analytics"
            style={[styles.headerBtn, { backgroundColor: colors.background.secondary, borderRadius: borderRadius.md, marginLeft: spacing.sm }]}
          >
            <Icon3D name="bar-chart" size={22} />
          </Pressable>
        </View>
      </View>

      {/* Date Selector */}
      <View style={[styles.dateSelector, { paddingHorizontal: spacing.lg, marginBottom: spacing.md }]}>
        <Pressable onPress={handlePrevDay} hitSlop={12}>
          <CaretLeft size={24} color={colors.text.secondary} />
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
          <CaretRight size={24} color={colors.text.secondary} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: insets.bottom + 90 }}
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
          <GlowCard intensity="subtle" animated style={{ marginBottom: spacing.lg, shadowColor: '#A855F7', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.22, shadowRadius: 16, elevation: 8 }}>
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
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg, justifyContent: 'space-between' }}>
          <SectionTile
            icon="calendar-outline"
            label="Meal Plans"
            size="sm"
            accentColor={colors.accent.primary}
            onPress={() => { hapticLight(); router.push('/(tabs)/nutrition/meal-plans'); }}
          />
          <SectionTile
            icon="fast-food-outline"
            label="Meal Prep"
            size="sm"
            accentColor={colors.accent.success}
            onPress={() => { hapticLight(); router.push('/(tabs)/nutrition/meal-prep'); }}
          />
          <SectionTile
            icon="cart-outline"
            label="Groceries"
            size="sm"
            accentColor={colors.accent.warning}
            onPress={() => { hapticLight(); router.push('/(tabs)/nutrition/grocery-list'); }}
          />
          <SectionTile
            icon="medical-outline"
            label="Supplements"
            size="sm"
            accentColor={colors.accent.info}
            onPress={() => { hapticLight(); router.push('/(tabs)/nutrition/supplements'); }}
          />
        </View>

        {/* Global empty food log state */}
        {todayLogs.length === 0 && dayOffset === 0 && (
          <View>
            <EmptyState
              ionIcon="restaurant-outline"
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
              style={[
                { marginBottom: spacing.lg },
                logs.length > 0 && {
                  borderLeftWidth: 3,
                  borderLeftColor: '#22C55E',  // green = logged
                  paddingLeft: spacing.sm,
                  borderRadius: 2,
                },
              ]}
            >
              <View style={[styles.sectionHeader, { marginBottom: spacing.sm }]}>
                <View style={styles.sectionTitleRow}>
                  <View style={{
                    width: 28, height: 28, borderRadius: 6,
                    backgroundColor: `${section.color}15`,
                    alignItems: 'center', justifyContent: 'center',
                    marginRight: spacing.sm,
                  }}>
                    {section.icon3d ? (
                      <Icon3D name={section.icon3d} size={22} />
                    ) : section.phosphorIcon ? (
                      <section.phosphorIcon size={16} color={section.color} weight="duotone" />
                    ) : (
                      <Ionicons name={section.icon} size={16} color={section.color} />
                    )}
                  </View>
                  <Text style={[typography.h3, { color: colors.text.primary }]}>
                    {section.label}
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
                  <Plus size={18} color={colors.accent.primary} weight="bold" />
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
                <View style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: colors.dim.cyan, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="water-outline" size={14} color={colors.accent.cyan} />
                </View>
                <Text style={[typography.h3, { color: colors.text.primary }]}>Water</Text>
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
                      backgroundColor: colors.accent.cyan,
                      borderRadius: borderRadius.full,
                      width: `${Math.min(100, (totalWater / targets.water) * 100)}%`,
                      height: 12,
                    },
                  ]}
                />
              </View>
            </View>

            {waterPacingNote && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, gap: 6 }}>
                <Ionicons
                  name={waterPacingNote.startsWith('Behind') ? 'alert-circle-outline' : 'checkmark-circle-outline'}
                  size={13}
                  color={waterPacingNote.startsWith('Behind') ? colors.accent.warning : colors.accent.cyan}
                />
                <Text style={[typography.tiny, { color: colors.text.secondary, flex: 1 }]}>
                  {waterPacingNote}
                </Text>
              </View>
            )}

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
                  <MonoText variant="monoCaption" color={colors.accent.cyan}>
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
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: colors.dim.primary, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="medical-outline" size={14} color={colors.accent.primary} />
                </View>
                <Text style={[typography.h3, { color: colors.text.primary }]}>Supplements</Text>
              </View>
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
          {fabOpen ? <Plus size={28} color="#FFFFFF" weight="bold" style={{ transform: [{ rotate: '45deg' }] }} /> : <Plus size={28} color="#FFFFFF" weight="bold" />}
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
            <View style={[styles.fabOptionIcon, { backgroundColor: `${colors.accent.cyan}20`, borderRadius: borderRadius.md }]}>
              <Camera size={24} color={colors.accent.cyan} weight="duotone" />
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
              <Barcode size={24} color={colors.accent.success} weight="duotone" />
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
              <NotePencil size={24} color={colors.accent.warning} weight="duotone" />
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
              <PencilSimple size={24} color={colors.accent.info} weight="duotone" />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={[typography.bodyBold, { color: colors.text.primary }]}>Manual Entry</Text>
              <Text style={[typography.caption, { color: colors.text.muted }]}>Search or type macros</Text>
            </View>
          </Pressable>
        </View>
      </BottomSheet>
      <VoiceMicButton
        context={{
          userId: profile?.id ?? '',
          activeScreen: 'nutrition',
          nutritionContext: {
            caloriesRemaining: remaining.calories,
            proteinRemaining: remaining.protein,
          },
        }}
        onCommand={handleVoiceCommand}
        onError={(msg) => showToast(msg, { type: 'info' })}
        bottom={100}
        right={16}
      />
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
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.15)',
  },
  fabOptionIcon: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
