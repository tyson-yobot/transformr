// =============================================================================
// TRANSFORMR -- Add Food Screen
// =============================================================================

import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Icon3D } from '@components/ui/Icon3D';
import { useTheme } from '@theme/index';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { ProgressRing } from '@components/ui/ProgressRing';
import { Skeleton } from '@components/ui/Skeleton';
import { useNutritionStore } from '@stores/nutritionStore';
import { useProfileStore } from '@stores/profileStore';
import { useChallengeStore } from '@stores/challengeStore';
import { MEAL_TYPES, MACRO_COLORS } from '@utils/constants';
import { hapticLight, hapticSuccess } from '@utils/haptics';
import type { Food } from '@app-types/database';
import { ScreenHelpButton } from '@components/ui/ScreenHelpButton';
import { ScreenBackground } from '@components/ui/ScreenBackground';
import { AmbientBackground } from '@components/ui/AmbientBackground';
import { EmptyStateBackground } from '@components/ui/EmptyStateBackground';
import { ActionToast, useActionToast } from '@components/ui/ActionToast';
import { SCREEN_HELP } from '../../../constants/screenHelp';
import { checkFoodBeforeLogging, type ComplianceResult } from '@services/ai/compliance';

type MealType = typeof MEAL_TYPES[number];

interface QueuedItem {
  food: Food | null;          // null = manual entry
  mealType: MealType;
  quantity: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  foodName: string;
  source: 'manual' | 'search';
  foodId?: string;
}

const MEAL_TYPE_OPTIONS: { value: MealType; label: string; icon3d: import('@components/ui/Icon3D').Icon3DName; iconColor: string }[] = [
  { value: 'breakfast',    label: 'Breakfast', icon3d: 'sun',        iconColor: '#F59E0B' },
  { value: 'lunch',        label: 'Lunch',     icon3d: 'fork-knife', iconColor: '#10B981' },
  { value: 'dinner',       label: 'Dinner',    icon3d: 'moon',       iconColor: '#A855F7' },
  { value: 'snack',        label: 'Snack',     icon3d: 'cookie',     iconColor: '#F97316' },
  { value: 'shake',        label: 'Shake',     icon3d: 'drink',      iconColor: '#06B6D4' },
  { value: 'pre_workout',  label: 'Pre-WO',    icon3d: 'lightning',  iconColor: '#EAB308' },
  { value: 'post_workout', label: 'Post-WO',   icon3d: 'dumbbell',   iconColor: '#A855F7' },
];

export default function AddFoodScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ meal?: string; editId?: string }>();

  const searchResults = useNutritionStore((s) => s.searchResults);
  const isLoading = useNutritionStore((s) => s.isLoading);
  const searchFoods = useNutritionStore((s) => s.searchFoods);
  const logFood = useNutritionStore((s) => s.logFood);
  const profile = useProfileStore((s) => s.profile);
  const activeEnrollment = useChallengeStore((s) => s.activeEnrollment);
  const challengeDefinitions = useChallengeStore((s) => s.challengeDefinitions);
  const { toast, show: showToast, hide: hideToast } = useActionToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [mealType, setMealType] = useState<MealType>(
    (params.meal as MealType) ?? 'snack',
  );
  const [quantity, setQuantity] = useState(1);
  const [isLogging, setIsLogging] = useState(false);
  const [queuedItems, setQueuedItems] = useState<QueuedItem[]>([]);

  // Compliance pre-screen — runs when a food is selected and a diet challenge is active
  const [complianceResult, setComplianceResult] = useState<ComplianceResult | null>(null);
  const [complianceLoading, setComplianceLoading] = useState(false);

  // The active challenge definition (joined from store)
  const activeDef = useMemo(
    () => challengeDefinitions.find((d) => d.id === activeEnrollment?.challenge_id) ?? null,
    [challengeDefinitions, activeEnrollment]
  );

  // Whether the active challenge has diet-based compliance rules
  const hasDietRules = useMemo(() => {
    if (!activeDef) return false;
    const slug = activeDef.slug;
    return (
      slug === 'whole30' ||
      slug === '75-hard' ||
      slug === '75hard' ||
      slug === 'intermittent-fasting' ||
      Boolean(activeDef.rules?.elimination_list?.length) ||
      Boolean(activeDef.rules?.fasting_protocol)
    );
  }, [activeDef]);

  // Manual entry fields
  const [manualMode, setManualMode] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualCalories, setManualCalories] = useState('');
  const [manualProtein, setManualProtein] = useState('');
  const [manualCarbs, setManualCarbs] = useState('');
  const [manualFat, setManualFat] = useState('');

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => <ScreenHelpButton content={SCREEN_HELP.addFood} />,
    });
  }, [navigation]);

  useEffect(() => {
    // Load recent/popular foods on mount
    searchFoods('');
  }, [searchFoods]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      searchFoods(query);
    }
  }, [searchFoods]);

  const scaledMacros = useMemo(() => {
    if (!selectedFood) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    return {
      calories: selectedFood.calories * quantity,
      protein: selectedFood.protein * quantity,
      carbs: selectedFood.carbs * quantity,
      fat: selectedFood.fat * quantity,
    };
  }, [selectedFood, quantity]);

  const handleSelectFood = useCallback((food: Food) => {
    hapticLight();
    setSelectedFood(food);
    setQuantity(1);
    setManualMode(false);
    setComplianceResult(null);

    // Fire compliance pre-screen if a diet challenge is active
    if (activeEnrollment && hasDietRules) {
      setComplianceLoading(true);
      void checkFoodBeforeLogging(activeEnrollment.id, { name: food.name })
        .then((result) => setComplianceResult(result))
        .finally(() => setComplianceLoading(false));
    }
  }, [activeEnrollment, hasDietRules]);

  const handleQuantityChange = useCallback((delta: number) => {
    hapticLight();
    setQuantity((prev) => Math.max(0.25, Math.round((prev + delta) * 4) / 4));
  }, []);

  const handleAddAndContinue = useCallback(() => {
    hapticSuccess();
    let item: QueuedItem;
    if (manualMode) {
      item = {
        food: null,
        mealType,
        quantity: 1,
        calories: Number(manualCalories) || 0,
        protein: Number(manualProtein) || 0,
        carbs: Number(manualCarbs) || 0,
        fat: Number(manualFat) || 0,
        foodName: manualName.trim(),
        source: 'manual',
      };
    } else if (selectedFood) {
      item = {
        food: selectedFood,
        mealType,
        quantity,
        calories: scaledMacros.calories,
        protein: scaledMacros.protein,
        carbs: scaledMacros.carbs,
        fat: scaledMacros.fat,
        foodName: selectedFood.name,
        source: 'search',
        foodId: selectedFood.id,
      };
    } else {
      return;
    }
    setQueuedItems((prev) => [...prev, item]);
    // Reset for next item
    setSelectedFood(null);
    setManualMode(false);
    setManualName('');
    setManualCalories('');
    setManualProtein('');
    setManualCarbs('');
    setManualFat('');
    setSearchQuery('');
    setComplianceResult(null);
    searchFoods('');
  }, [manualMode, selectedFood, mealType, quantity, scaledMacros, manualName, manualCalories, manualProtein, manualCarbs, manualFat, searchFoods]);

  const handleRemoveFromQueue = useCallback((index: number) => {
    hapticLight();
    setQueuedItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const queueTotals = useMemo(() => {
    return queuedItems.reduce(
      (acc, item) => ({
        calories: acc.calories + item.calories,
        protein: acc.protein + item.protein,
        carbs: acc.carbs + item.carbs,
        fat: acc.fat + item.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );
  }, [queuedItems]);

  const handleAddToLog = useCallback(async () => {
    setIsLogging(true);
    hapticSuccess();

    // Build list of all items to log: queued + current selection
    const itemsToLog: QueuedItem[] = [...queuedItems];

    if (manualMode && manualName.trim().length > 0 && Number(manualCalories) > 0) {
      itemsToLog.push({
        food: null,
        mealType,
        quantity: 1,
        calories: Number(manualCalories) || 0,
        protein: Number(manualProtein) || 0,
        carbs: Number(manualCarbs) || 0,
        fat: Number(manualFat) || 0,
        foodName: manualName.trim(),
        source: 'manual',
      });
    } else if (selectedFood) {
      itemsToLog.push({
        food: selectedFood,
        mealType,
        quantity,
        calories: scaledMacros.calories,
        protein: scaledMacros.protein,
        carbs: scaledMacros.carbs,
        fat: scaledMacros.fat,
        foodName: selectedFood.name,
        source: 'search',
        foodId: selectedFood.id,
      });
    }

    // Log each item
    for (const item of itemsToLog) {
      if (item.source === 'manual' && !item.foodId) {
        await logFood({
          meal_type: item.mealType,
          quantity: item.quantity,
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
          source: 'manual',
          food_name: item.foodName,
        });
      } else {
        await logFood({
          food_id: item.foodId,
          meal_type: item.mealType,
          quantity: item.quantity,
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
          source: 'manual',
        });
      }
    }

    const storeError = useNutritionStore.getState().error;
    setIsLogging(false);
    if (storeError) {
      Alert.alert('Failed to Log', storeError);
      return;
    }
    const count = itemsToLog.length;
    showToast(
      count === 1 ? 'Meal logged' : `${count} items logged`,
      { subtext: 'Nutrition updated' },
    );
    router.back();
  }, [queuedItems, manualMode, selectedFood, mealType, quantity, scaledMacros, manualName, manualCalories, manualProtein, manualCarbs, manualFat, logFood, router, showToast]);

  const hasCurrentItem = manualMode
    ? manualName.length > 0 && Number(manualCalories) > 0
    : selectedFood !== null;
  const canLog = hasCurrentItem || queuedItems.length > 0;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background.primary }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <ScreenBackground />
      <AmbientBackground />
      <StatusBar style="light" backgroundColor="#0C0A15" />
      <ActionToast
        message={toast.message}
        subtext={toast.subtext}
        visible={toast.visible}
        onHide={hideToast}
        type={toast.type}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{  padding: spacing.lg, paddingBottom: insets.bottom + 90 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Search Bar */}
        <Animated.View entering={FadeInDown.duration(300)}>
          <Input
            placeholder="Search foods..."
            value={searchQuery}
            onChangeText={handleSearch}
            leftIcon={<Ionicons name="search" size={18} color={colors.text.muted} />}
            rightIcon={
              searchQuery.length > 0 ? (
                <Pressable onPress={() => { setSearchQuery(''); searchFoods(''); }}>
                  <Ionicons name="close-circle" size={18} color={colors.text.muted} />
                </Pressable>
              ) : undefined
            }
            containerStyle={{ marginBottom: spacing.md }}
          />
        </Animated.View>

        {/* Meal Type Selector */}
        <Animated.View entering={FadeInDown.duration(300).delay(100)}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: spacing.lg }}
            contentContainerStyle={{ gap: spacing.sm }}
          >
            {MEAL_TYPE_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => { hapticLight(); setMealType(option.value); }}
                style={[
                  styles.mealChip,
                  {
                    backgroundColor: mealType === option.value
                      ? colors.accent.primary
                      : colors.background.secondary,
                    borderRadius: borderRadius.full,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                  },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Icon3D
                    name={option.icon3d}
                    size={14}
                  />
                  <Text
                    style={[
                      typography.caption,
                      {
                        color: mealType === option.value ? '#FFFFFF' : colors.text.secondary, /* brand-ok */
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Toggle Manual Mode */}
        <Pressable
          onPress={() => {
            hapticLight();
            setManualMode((prev) => !prev);
            setSelectedFood(null);
          }}
          style={{ marginBottom: spacing.lg }}
        >
          <Text style={[typography.caption, { color: colors.accent.primary }]}>
            {manualMode ? 'Search for food instead' : "Can't find it? Enter manually"}
          </Text>
        </Pressable>

        {manualMode ? (
          /* Manual Entry Form */
          <Animated.View entering={FadeIn.duration(300)}>
            <Card style={{ marginBottom: spacing.lg, shadowColor: '#A855F7', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 4 }}>
              <Text style={[typography.h3, { color: colors.text.primary, marginBottom: spacing.md }]}>
                Manual Entry
              </Text>
              <Input
                label="Food Name"
                placeholder="e.g. Grilled chicken breast"
                value={manualName}
                onChangeText={setManualName}
                containerStyle={{ marginBottom: spacing.md }}
              />
              <View style={[styles.macroInputRow, { gap: spacing.sm }]}>
                <View style={styles.macroInputItem}>
                  <Input
                    label="Calories"
                    placeholder="0"
                    keyboardType="numeric"
                    value={manualCalories}
                    onChangeText={setManualCalories}
                  />
                </View>
                <View style={styles.macroInputItem}>
                  <Input
                    label="Protein (g)"
                    placeholder="0"
                    keyboardType="numeric"
                    value={manualProtein}
                    onChangeText={setManualProtein}
                  />
                </View>
              </View>
              <View style={[styles.macroInputRow, { gap: spacing.sm, marginTop: spacing.sm }]}>
                <View style={styles.macroInputItem}>
                  <Input
                    label="Carbs (g)"
                    placeholder="0"
                    keyboardType="numeric"
                    value={manualCarbs}
                    onChangeText={setManualCarbs}
                  />
                </View>
                <View style={styles.macroInputItem}>
                  <Input
                    label="Fat (g)"
                    placeholder="0"
                    keyboardType="numeric"
                    value={manualFat}
                    onChangeText={setManualFat}
                  />
                </View>
              </View>
            </Card>
          </Animated.View>
        ) : selectedFood ? (
          /* Selected Food Detail */
          <Animated.View entering={FadeIn.duration(300)}>
            <Card style={{ marginBottom: spacing.lg, shadowColor: '#A855F7', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 4 }}>
              <View style={styles.selectedFoodHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.h3, { color: colors.text.primary }]}>
                    {selectedFood.name}
                  </Text>
                  {selectedFood.brand && (
                    <Text style={[typography.caption, { color: colors.text.muted }]}>
                      {selectedFood.brand}
                    </Text>
                  )}
                  <Text style={[typography.tiny, { color: colors.text.muted, marginTop: 4 }]}>
                    {selectedFood.serving_size}{selectedFood.serving_unit} per serving
                  </Text>
                </View>
                <Pressable onPress={() => setSelectedFood(null)}>
                  <Ionicons name="close-circle" size={24} color={colors.text.muted} />
                </Pressable>
              </View>

              {/* Quantity Adjuster */}
              <View style={[styles.quantityRow, { marginTop: spacing.lg }]}>
                <Text style={[typography.body, { color: colors.text.secondary }]}>Servings</Text>
                <View style={styles.quantityControls}>
                  <Pressable
                    onPress={() => handleQuantityChange(-0.25)}
                    accessibilityLabel="Decrease serving quantity"
                    accessibilityRole="button"
                    style={[styles.quantityBtn, { backgroundColor: colors.background.tertiary, borderRadius: borderRadius.md }]}
                  >
                    <Ionicons name="remove" size={20} color={colors.text.primary} />
                  </Pressable>
                  <Text style={[typography.statSmall, { color: colors.text.primary, minWidth: 60, textAlign: 'center' }]}>
                    {quantity}
                  </Text>
                  <Pressable
                    onPress={() => handleQuantityChange(0.25)}
                    accessibilityLabel="Increase serving quantity"
                    accessibilityRole="button"
                    style={[styles.quantityBtn, { backgroundColor: colors.background.tertiary, borderRadius: borderRadius.md }]}
                  >
                    <Ionicons name="add" size={20} color={colors.text.primary} />
                  </Pressable>
                </View>
              </View>

              {/* Challenge compliance badge */}
              {(complianceLoading || complianceResult) && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginTop: spacing.md,
                    paddingVertical: spacing.xs,
                    paddingHorizontal: spacing.sm,
                    borderRadius: borderRadius.md,
                    backgroundColor: complianceLoading
                      ? `${colors.background.tertiary}`
                      : complianceResult?.compliant
                        ? `${colors.accent.success}18`
                        : `${colors.accent.danger}18`,
                  }}
                >
                  {complianceLoading ? (
                    <Ionicons name="hourglass-outline" size={14} color={colors.text.muted} style={{ marginRight: 6 }} />
                  ) : (
                    <Icon3D
                      name={complianceResult?.compliant ? 'check' : 'warning'}
                      size={14}
                      style={{ marginRight: 6 }}
                    />
                  )}
                  <Text
                    style={[
                      typography.tiny,
                      {
                        color: complianceLoading
                          ? colors.text.muted
                          : complianceResult?.compliant
                            ? colors.accent.success
                            : colors.accent.danger,
                        flex: 1,
                      },
                    ]}
                  >
                    {complianceLoading
                      ? 'Checking compliance…'
                      : complianceResult?.compliant
                        ? complianceResult.recommendation || 'Compliant ✓'
                        : (complianceResult?.violations[0] ?? 'May not comply with challenge rules')}
                  </Text>
                </View>
              )}

              {/* Macro Preview */}
              <View style={[styles.macroPreview, { marginTop: spacing.lg, gap: spacing.md }]}>
                <View style={styles.macroPreviewItem}>
                  <ProgressRing
                    progress={Math.min(1, scaledMacros.calories / (profile?.daily_calorie_target ?? 2200))}
                    size={60}
                    strokeWidth={5}
                    color={colors.accent.primary}
                  >
                    <Text style={[typography.monoCaption, { color: colors.text.primary, fontSize: 11 }]}>
                      {Math.round(scaledMacros.calories)}
                    </Text>
                  </ProgressRing>
                  <Text style={[typography.tiny, { color: colors.text.muted, marginTop: 4 }]}>Cal</Text>
                </View>
                <View style={styles.macroPreviewItem}>
                  <ProgressRing
                    progress={Math.min(1, scaledMacros.protein / (profile?.daily_protein_target ?? 180))}
                    size={60}
                    strokeWidth={5}
                    color={MACRO_COLORS.protein}
                  >
                    <Text style={[typography.monoCaption, { color: colors.text.primary, fontSize: 11 }]}>
                      {Math.round(scaledMacros.protein)}g
                    </Text>
                  </ProgressRing>
                  <Text style={[typography.tiny, { color: MACRO_COLORS.protein, marginTop: 4 }]}>Protein</Text>
                </View>
                <View style={styles.macroPreviewItem}>
                  <ProgressRing
                    progress={Math.min(1, scaledMacros.carbs / (profile?.daily_carb_target ?? 250))}
                    size={60}
                    strokeWidth={5}
                    color={MACRO_COLORS.carbs}
                  >
                    <Text style={[typography.monoCaption, { color: colors.text.primary, fontSize: 11 }]}>
                      {Math.round(scaledMacros.carbs)}g
                    </Text>
                  </ProgressRing>
                  <Text style={[typography.tiny, { color: MACRO_COLORS.carbs, marginTop: 4 }]}>Carbs</Text>
                </View>
                <View style={styles.macroPreviewItem}>
                  <ProgressRing
                    progress={Math.min(1, scaledMacros.fat / (profile?.daily_fat_target ?? 70))}
                    size={60}
                    strokeWidth={5}
                    color={MACRO_COLORS.fat}
                  >
                    <Text style={[typography.monoCaption, { color: colors.text.primary, fontSize: 11 }]}>
                      {Math.round(scaledMacros.fat)}g
                    </Text>
                  </ProgressRing>
                  <Text style={[typography.tiny, { color: MACRO_COLORS.fat, marginTop: 4 }]}>Fat</Text>
                </View>
              </View>
            </Card>
          </Animated.View>
        ) : (
          /* Search Results / Recent Foods */
          <Animated.View entering={FadeInDown.duration(300).delay(200)}>
            {isLoading ? (
              <View style={[styles.loadingContainer, { gap: spacing.md }]}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} variant="card" height={72} style={{ marginBottom: spacing.xs }} />
                ))}
              </View>
            ) : (
              <>
                <Text style={[typography.h3, { color: colors.text.primary, marginBottom: spacing.md }]}>
                  {searchQuery.length >= 2 ? 'Results' : 'Common Foods'}
                </Text>

                {searchResults.length > 0 ? (
                  <View style={{ gap: spacing.sm }}>
                    {searchResults.map((food) => (
                      <Pressable
                        key={food.id}
                        accessibilityLabel={`Select ${food.name}, ${Math.round(food.calories)} calories`}
                        accessibilityRole="button"
                        onPress={() => handleSelectFood(food)}
                        style={[
                          styles.foodResult,
                          {
                            backgroundColor: colors.background.secondary,
                            borderRadius: borderRadius.lg,
                            padding: spacing.lg,
                          },
                        ]}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={[typography.bodyBold, { color: colors.text.primary }]}>
                            {food.name}
                          </Text>
                          {food.brand && (
                            <Text style={[typography.caption, { color: colors.text.muted }]}>
                              {food.brand}
                            </Text>
                          )}
                          <Text style={[typography.tiny, { color: colors.text.muted, marginTop: 4 }]}>
                            {food.serving_size}{food.serving_unit}
                          </Text>
                        </View>
                        <View style={styles.foodResultMacros}>
                          <Text style={[typography.monoCaption, { color: colors.text.primary, fontWeight: '600' }]}>
                            {Math.round(food.calories)} cal
                          </Text>
                          <View style={[styles.foodResultMacroRow, { marginTop: 4 }]}>
                            <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, backgroundColor: `${colors.accent.success}15` }}>
                              <Text style={[typography.tiny, { color: colors.accent.success, fontWeight: '600' }]}>
                                P: {Math.round(food.protein)}g
                              </Text>
                            </View>
                            <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, backgroundColor: `${colors.accent.info}15` }}>
                              <Text style={[typography.tiny, { color: colors.accent.info, fontWeight: '600' }]}>
                                C: {Math.round(food.carbs)}g
                              </Text>
                            </View>
                            <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, backgroundColor: `${colors.accent.warning}15` }}>
                              <Text style={[typography.tiny, { color: colors.accent.warning, fontWeight: '600' }]}>
                                F: {Math.round(food.fat)}g
                              </Text>
                            </View>
                          </View>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={colors.text.muted} style={{ marginLeft: spacing.sm }} />
                      </Pressable>
                    ))}
                  </View>
                ) : searchQuery.length >= 2 ? (
                  <View style={[styles.emptyState, { position: 'relative', overflow: 'hidden', borderRadius: 16 }]}>
                    <EmptyStateBackground query="healthy food ingredients dark" opacity={0.10} />
                    <Icon3D name="search" size={48} />
                    <Text style={[typography.body, { color: colors.text.muted, marginTop: spacing.md, textAlign: 'center' }]}>
                      No foods found for "{searchQuery}"
                    </Text>
                    <Button
                      title="Enter Manually"
                      variant="outline"
                      size="sm"
                      onPress={() => { setManualMode(true); setManualName(searchQuery); }}
                      style={{ marginTop: spacing.md }}
                    />
                  </View>
                ) : (
                  <View style={[styles.emptyState, { position: 'relative', overflow: 'hidden', borderRadius: 16 }]}>
                    <EmptyStateBackground query="healthy food ingredients dark" opacity={0.10} />
                    <Icon3D name="fork-knife" size={48} />
                    <Text style={[typography.body, { color: colors.text.muted, marginTop: spacing.md }]}>
                      Start typing to search foods
                    </Text>
                  </View>
                )}
              </>
            )}
          </Animated.View>
        )}

        {/* Queued Items Summary */}
        {queuedItems.length > 0 && (
          <Animated.View entering={FadeInDown.duration(300)}>
            <Card style={{ marginTop: spacing.lg }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
                <Text style={[typography.bodyBold, { color: colors.text.primary }]}>
                  Queued ({queuedItems.length})
                </Text>
                <Text style={[typography.monoCaption, { color: colors.accent.primary }]}>
                  {Math.round(queueTotals.calories)} cal total
                </Text>
              </View>
              {queuedItems.map((item, index) => (
                <View
                  key={`${item.foodName}-${index}`}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: spacing.xs,
                    borderTopWidth: index > 0 ? 1 : 0,
                    borderTopColor: colors.border.subtle,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.caption, { color: colors.text.primary }]} numberOfLines={1}>
                      {item.foodName}
                    </Text>
                    <Text style={[typography.tiny, { color: colors.text.muted }]}>
                      {Math.round(item.calories)} cal · P {Math.round(item.protein)}g · C {Math.round(item.carbs)}g · F {Math.round(item.fat)}g
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => handleRemoveFromQueue(index)}
                    hitSlop={8}
                    accessibilityLabel={`Remove ${item.foodName} from queue`}
                    accessibilityRole="button"
                    style={{ padding: spacing.xs }}
                  >
                    <Ionicons name="close-circle" size={20} color={colors.accent.danger} />
                  </Pressable>
                </View>
              ))}
            </Card>
          </Animated.View>
        )}
      </ScrollView>

      {/* Bottom Action Bar */}
      {canLog && (
        <Animated.View
          entering={FadeIn.duration(200)}
          style={[
            styles.bottomBar,
            {
              backgroundColor: colors.background.primary,
              borderTopColor: colors.border.subtle,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.md,
            },
          ]}
        >
          {hasCurrentItem && (
            <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: queuedItems.length > 0 || hasCurrentItem ? 0 : spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Button
                  title="Add & Continue"
                  onPress={handleAddAndContinue}
                  variant="outline"
                  size="md"
                  fullWidth
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  title={isLogging ? 'Logging...' : queuedItems.length > 0 ? `Log All (${queuedItems.length + 1})` : 'Add to Log'}
                  onPress={handleAddToLog}
                  loading={isLogging}
                  variant="primary"
                  size="md"
                  fullWidth
                />
              </View>
            </View>
          )}
          {!hasCurrentItem && queuedItems.length > 0 && (
            <Button
              title={isLogging ? 'Logging...' : `Log All (${queuedItems.length})`}
              onPress={handleAddToLog}
              loading={isLogging}
              variant="primary"
              fullWidth
              size="lg"
            />
          )}
        </Animated.View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  mealChip: {},
  selectedFoodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  quantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  macroPreview: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  macroPreviewItem: {
    alignItems: 'center',
  },
  macroInputRow: {
    flexDirection: 'row',
  },
  macroInputItem: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  foodResult: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.15)',
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  foodResultMacros: {
    alignItems: 'flex-end',
  },
  foodResultMacroRow: {
    flexDirection: 'row',
    gap: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  bottomBar: {
    borderTopWidth: 1,
  },
});
