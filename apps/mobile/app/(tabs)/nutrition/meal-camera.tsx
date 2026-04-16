// =============================================================================
// TRANSFORMR -- AI Meal Camera Screen
// =============================================================================

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { ScreenHelpButton } from '@components/ui/ScreenHelpButton';
import { SCREEN_HELP } from '../../../constants/screenHelp';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Animated, { FadeIn, FadeInUp, SlideInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { ProgressRing } from '@components/ui/ProgressRing';
import { useNutritionStore } from '@stores/nutritionStore';
import { formatCalories, formatMacro } from '@utils/formatters';
import { MACRO_COLORS, MEAL_TYPES } from '@utils/constants';
import { hapticMedium, hapticSuccess, hapticLight } from '@utils/haptics';
import { HelpBubble } from '@components/ui/HelpBubble';
import { ActionToast, useActionToast } from '@components/ui/ActionToast';
import { analyzeMealPhoto } from '@services/ai/mealCamera';
import { supabase } from '../../../services/supabase';

type MealType = typeof MEAL_TYPES[number];

interface DetectedFood {
  id: string;
  name: string;
  confidence: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  quantity: number;
}

type CameraStage = 'capture' | 'analyzing' | 'results';

export default function MealCameraScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => <ScreenHelpButton content={SCREEN_HELP.mealCamera} />,
    });
  }, [navigation]);

  const { logFood } = useNutritionStore();
  const { toast, show: showToast, hide: hideToast } = useActionToast();
  const [permission, requestPermission] = useCameraPermissions();

  const [stage, setStage] = useState<CameraStage>('capture');
  const [detectedFoods, setDetectedFoods] = useState<DetectedFood[]>([]);
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isLogging, setIsLogging] = useState(false);

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current) return;
    hapticMedium();
    setStage('analyzing');

    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8, base64: true });
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const analysis = await analyzeMealPhoto(photo.uri, user.id);
      const results: DetectedFood[] = (analysis.foods ?? []).map((f, i) => ({
        id: String(i + 1),
        name: f.name,
        confidence: f.confidence ?? 0.9,
        calories: f.estimated_calories ?? 0,
        protein: f.estimated_protein ?? 0,
        carbs: f.estimated_carbs ?? 0,
        fat: f.estimated_fat ?? 0,
        quantity: 1,
      }));

      setDetectedFoods(results);
      setSelectedItems(new Set(results.map((f) => f.id)));
      setStage('results');
    } catch {
      setStage('capture');
      Alert.alert('Error', 'Failed to analyze photo. Please try again.');
    }
  }, []);

  const toggleItem = useCallback((id: string) => {
    hapticLight();
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const updateItemQuantity = useCallback((id: string, delta: number) => {
    hapticLight();
    setDetectedFoods((prev) =>
      prev.map((food) =>
        food.id === id
          ? { ...food, quantity: Math.max(0.25, Math.round((food.quantity + delta) * 4) / 4) }
          : food,
      ),
    );
  }, []);

  const totalMacros = detectedFoods
    .filter((f) => selectedItems.has(f.id))
    .reduce(
      (acc, f) => ({
        calories: acc.calories + f.calories * f.quantity,
        protein: acc.protein + f.protein * f.quantity,
        carbs: acc.carbs + f.carbs * f.quantity,
        fat: acc.fat + f.fat * f.quantity,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );

  const handleConfirmAll = useCallback(async () => {
    setIsLogging(true);
    hapticSuccess();

    const itemsToLog = detectedFoods.filter((f) => selectedItems.has(f.id));

    for (const item of itemsToLog) {
      await logFood({
        meal_type: mealType,
        quantity: item.quantity,
        calories: item.calories * item.quantity,
        protein: item.protein * item.quantity,
        carbs: item.carbs * item.quantity,
        fat: item.fat * item.quantity,
        source: 'camera',
      });
    }

    setIsLogging(false);
    showToast('Meal logged', { subtext: `${itemsToLog.length} item${itemsToLog.length !== 1 ? 's' : ''} added` });
    router.back();
  }, [detectedFoods, selectedItems, mealType, logFood, router, showToast]);

  const handleRetake = useCallback(() => {
    hapticLight();
    setStage('capture');
    setDetectedFoods([]);
    setSelectedItems(new Set());
  }, []);


  // Permission handling
  if (!permission) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background.primary }]}>
        <ProgressRing progress={-1} size={64} strokeWidth={6} color={colors.accent.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background.primary }]}>
        <Ionicons name="camera-outline" size={64} color={colors.text.muted} />
        <Text style={[typography.h3, { color: colors.text.primary, marginTop: spacing.lg, textAlign: 'center' }]}>
          Camera access needed
        </Text>
        <Text style={[typography.body, { color: colors.text.muted, marginTop: spacing.sm, textAlign: 'center', paddingHorizontal: spacing.xxl }]}>
          We need camera access to analyze your meals with AI
        </Text>
        <Button
          title="Grant Access"
          onPress={requestPermission}
          style={{ marginTop: spacing.xl }}
        />
        <Button
          title="Go Back"
          variant="ghost"
          onPress={() => router.back()}
          style={{ marginTop: spacing.sm }}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <ActionToast message={toast.message} subtext={toast.subtext} visible={toast.visible} onHide={hideToast} type={toast.type} />
      <HelpBubble id="meal_camera" message="Point at your plate for AI calorie estimates" position="above" />
      {stage === 'capture' && (
        <>
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing="back"
          />

          {/* Camera overlay */}
          <View style={[styles.cameraOverlay, { paddingTop: insets.top }]}>
            <View style={[styles.cameraTopBar, { padding: spacing.lg }]}>
              <Pressable onPress={() => router.back()} hitSlop={12}>
                <Ionicons name="close" size={28} color="#FFFFFF" />
              </Pressable>
              <Text style={[typography.h3, { color: colors.text.inverse }]}>AI Meal Scanner</Text>
              <View style={{ width: 28 }} />
            </View>

            <View style={styles.cameraCenter}>
              <View style={[styles.scanFrame, { borderColor: colors.accent.primary, borderRadius: borderRadius.xl }]} />
              <Text style={[typography.caption, { color: colors.text.inverse, marginTop: spacing.md, textAlign: 'center' }]}>
                Center your meal in the frame
              </Text>
            </View>

            <View style={[styles.cameraBottomBar, { paddingBottom: insets.bottom + spacing.lg, padding: spacing.lg }]}>
              <Pressable
                onPress={handleCapture}
                accessibilityLabel="Take photo of meal"
                accessibilityRole="button"
                style={[styles.captureBtn, { borderColor: colors.text.inverse }]}
              >
                <View style={[styles.captureBtnInner, { backgroundColor: colors.text.inverse }]} />
              </Pressable>
            </View>
          </View>
        </>
      )}

      {stage === 'analyzing' && (
        <View style={[styles.container, styles.centered, { backgroundColor: colors.background.primary }]}>
          <Animated.View entering={FadeIn.duration(300)} style={styles.centered}>
            <ProgressRing progress={0.7} size={100} strokeWidth={6} color={colors.accent.primary}>
              <Ionicons name="sparkles" size={32} color={colors.accent.primary} />
            </ProgressRing>
            <Text style={[typography.h3, { color: colors.text.primary, marginTop: spacing.xl }]}>
              Analyzing your meal...
            </Text>
            <Text style={[typography.body, { color: colors.text.muted, marginTop: spacing.sm }]}>
              AI is identifying foods and estimating macros
            </Text>
          </Animated.View>
        </View>
      )}

      {stage === 'results' && (
        <Animated.View entering={SlideInDown.duration(400)} style={[styles.container, { backgroundColor: colors.background.primary }]}>
          {/* Header */}
          <View style={[styles.resultsHeader, { paddingTop: insets.top + spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.md }]}>
            <Pressable onPress={handleRetake} hitSlop={12}>
              <Ionicons name="camera-reverse-outline" size={24} color={colors.text.secondary} />
            </Pressable>
            <Text style={[typography.h3, { color: colors.text.primary }]}>Detected Foods</Text>
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <Ionicons name="close" size={24} color={colors.text.secondary} />
            </Pressable>
          </View>

          {/* Meal Type Selector */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.md }}
            contentContainerStyle={{ gap: spacing.sm }}
          >
            {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((mt) => (
              <Pressable
                key={mt}
                onPress={() => { hapticLight(); setMealType(mt); }}
                style={[
                  styles.mealChip,
                  {
                    backgroundColor: mealType === mt ? colors.accent.primary : colors.background.secondary,
                    borderRadius: borderRadius.full,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                  },
                ]}
              >
                <Text style={[typography.caption, { color: mealType === mt ? colors.text.inverse : colors.text.secondary }]}>
                  {mt.charAt(0).toUpperCase() + mt.slice(1)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 140 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Total Summary */}
            <Card style={{ marginBottom: spacing.lg }}>
              <View style={styles.totalRow}>
                <Text style={[typography.body, { color: colors.text.secondary }]}>Total</Text>
                <Text style={[typography.statSmall, { color: colors.text.primary }]}>
                  {formatCalories(totalMacros.calories)}
                </Text>
              </View>
              <View style={[styles.totalMacroRow, { marginTop: spacing.sm, gap: spacing.lg }]}>
                <Text style={[typography.caption, { color: MACRO_COLORS.protein }]}>
                  P: {formatMacro(totalMacros.protein)}
                </Text>
                <Text style={[typography.caption, { color: MACRO_COLORS.carbs }]}>
                  C: {formatMacro(totalMacros.carbs)}
                </Text>
                <Text style={[typography.caption, { color: MACRO_COLORS.fat }]}>
                  F: {formatMacro(totalMacros.fat)}
                </Text>
              </View>
            </Card>

            {/* Detected Items */}
            {detectedFoods.map((food) => (
              <Animated.View key={food.id} entering={FadeInUp.duration(300)}>
                <Card
                  style={{
                    marginBottom: spacing.sm,
                    opacity: selectedItems.has(food.id) ? 1 : 0.5,
                  }}
                >
                  <View style={styles.detectedFoodHeader}>
                    <Pressable onPress={() => toggleItem(food.id)}>
                      <Ionicons
                        name={selectedItems.has(food.id) ? 'checkbox' : 'square-outline'}
                        size={24}
                        color={selectedItems.has(food.id) ? colors.accent.success : colors.text.muted}
                      />
                    </Pressable>
                    <View style={{ flex: 1, marginLeft: spacing.md }}>
                      <Text style={[typography.bodyBold, { color: colors.text.primary }]}>
                        {food.name}
                      </Text>
                      <View style={[styles.confidenceRow, { marginTop: 4 }]}>
                        <Badge
                          label={`${Math.round(food.confidence * 100)}% match`}
                          variant={food.confidence >= 0.9 ? 'success' : food.confidence >= 0.7 ? 'warning' : 'danger'}
                          size="sm"
                        />
                      </View>
                    </View>
                    <Text style={[typography.monoCaption, { color: colors.text.primary, fontWeight: '700' }]}>
                      {Math.round(food.calories * food.quantity)} cal
                    </Text>
                  </View>

                  {/* Quantity adjuster */}
                  <View style={[styles.quantityRow, { marginTop: spacing.md }]}>
                    <View style={[styles.macroSmallRow, { gap: spacing.md }]}>
                      <Text style={[typography.tiny, { color: MACRO_COLORS.protein }]}>
                        P: {formatMacro(food.protein * food.quantity)}
                      </Text>
                      <Text style={[typography.tiny, { color: MACRO_COLORS.carbs }]}>
                        C: {formatMacro(food.carbs * food.quantity)}
                      </Text>
                      <Text style={[typography.tiny, { color: MACRO_COLORS.fat }]}>
                        F: {formatMacro(food.fat * food.quantity)}
                      </Text>
                    </View>
                    <View style={styles.quantityControls}>
                      <Pressable
                        onPress={() => updateItemQuantity(food.id, -0.25)}
                        style={[styles.qtyBtn, { backgroundColor: colors.background.tertiary, borderRadius: borderRadius.sm }]}
                      >
                        <Ionicons name="remove" size={14} color={colors.text.primary} />
                      </Pressable>
                      <Text style={[typography.monoCaption, { color: colors.text.primary, fontWeight: '700', minWidth: 32, textAlign: 'center' }]}>
                        {food.quantity}x
                      </Text>
                      <Pressable
                        onPress={() => updateItemQuantity(food.id, 0.25)}
                        style={[styles.qtyBtn, { backgroundColor: colors.background.tertiary, borderRadius: borderRadius.sm }]}
                      >
                        <Ionicons name="add" size={14} color={colors.text.primary} />
                      </Pressable>
                    </View>
                  </View>
                </Card>
              </Animated.View>
            ))}
          </ScrollView>

          {/* Confirm Button */}
          <Animated.View
            entering={FadeIn.duration(200)}
            style={[
              styles.bottomBar,
              {
                backgroundColor: colors.background.primary,
                borderTopColor: colors.border.subtle,
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.md,
                paddingBottom: insets.bottom + spacing.md,
              },
            ]}
          >
            <Button
              title={isLogging ? 'Logging...' : `Log ${selectedItems.size} Items`}
              onPress={handleConfirmAll}
              loading={isLogging}
              disabled={selectedItems.size === 0}
              fullWidth
              size="lg"
            />
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  cameraTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cameraCenter: {
    alignItems: 'center',
  },
  scanFrame: {
    width: 280,
    height: 280,
    borderWidth: 2,
  },
  cameraBottomBar: {
    alignItems: 'center',
  },
  captureBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureBtnInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scroll: { flex: 1 },
  mealChip: {},
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalMacroRow: {
    flexDirection: 'row',
  },
  detectedFoodHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  confidenceRow: {
    flexDirection: 'row',
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
  qtyBtn: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  macroSmallRow: {
    flexDirection: 'row',
  },
  bottomBar: {
    borderTopWidth: 1,
  },
});
