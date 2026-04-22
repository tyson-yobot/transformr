// =============================================================================
// TRANSFORMR -- Barcode Food Scanner
// =============================================================================

import { useState, useCallback, useEffect } from 'react';
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
import { useFeatureGate } from '@hooks/useFeatureGate';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme/index';
import { StatusBar } from 'expo-status-bar';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { ProgressRing } from '@components/ui/ProgressRing';
import { useNutritionStore } from '@stores/nutritionStore';
import { useProfileStore } from '@stores/profileStore';
import { formatMacro } from '@utils/formatters';
import { MACRO_COLORS, MEAL_TYPES, OPEN_FOOD_FACTS_API } from '@utils/constants';
import { hapticSuccess, hapticLight, hapticWarning } from '@utils/haptics';
import { HelpBubble } from '@components/ui/HelpBubble';
import { ActionToast, useActionToast } from '@components/ui/ActionToast';
import { useNavigation } from '@react-navigation/native';
import { ScreenHelpButton } from '@components/ui/ScreenHelpButton';
import { ScreenBackground } from '@components/ui/ScreenBackground';
import { AmbientBackground } from '@components/ui/AmbientBackground';
import { SCREEN_HELP } from '../../../constants/screenHelp';

type MealType = typeof MEAL_TYPES[number];

interface ScannedFood {
  name: string;
  brand: string;
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  imageUrl: string | null;
  barcode: string;
}

type ScanStage = 'scanning' | 'loading' | 'result' | 'not_found';

export default function BarcodeScannerScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const gate = useFeatureGate('barcode_scanner');

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => <ScreenHelpButton content={SCREEN_HELP.barcodeScannerScreen} />,
    });
  }, [navigation]);

  const logFood = useNutritionStore((s) => s.logFood);
  const profile = useProfileStore((s) => s.profile);
  const { toast, show: showToast, hide: hideToast } = useActionToast();
  const [permission, requestPermission] = useCameraPermissions();

  const [stage, setStage] = useState<ScanStage>('scanning');
  const [scannedFood, setScannedFood] = useState<ScannedFood | null>(null);
  const [mealType, setMealType] = useState<MealType>('snack');
  const [quantity, setQuantity] = useState(1);
  const [isLogging, setIsLogging] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState('');

  const lookupBarcode = useCallback(async (barcode: string) => {
    setStage('loading');
    setScannedBarcode(barcode);

    try {
      const response = await fetch(
        `${OPEN_FOOD_FACTS_API}/product/${barcode}.json`,
      );
      const data = await response.json() as {
        status: number;
        product?: {
          product_name?: string;
          brands?: string;
          serving_size?: string;
          nutriments?: {
            'energy-kcal_100g'?: number;
            proteins_100g?: number;
            carbohydrates_100g?: number;
            fat_100g?: number;
            fiber_100g?: number;
            sugars_100g?: number;
          };
          image_front_small_url?: string;
        };
      };

      if (data.status === 1 && data.product) {
        const product = data.product;
        const nutriments = product.nutriments ?? {};

        setScannedFood({
          name: product.product_name ?? 'Unknown Product',
          brand: product.brands ?? '',
          servingSize: product.serving_size ?? '100g',
          calories: nutriments['energy-kcal_100g'] ?? 0,
          protein: nutriments.proteins_100g ?? 0,
          carbs: nutriments.carbohydrates_100g ?? 0,
          fat: nutriments.fat_100g ?? 0,
          fiber: nutriments.fiber_100g ?? 0,
          sugar: nutriments.sugars_100g ?? 0,
          imageUrl: product.image_front_small_url ?? null,
          barcode,
        });
        gate.trackUsage();
        setStage('result');
        hapticSuccess();
      } else {
        setStage('not_found');
        hapticWarning();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to look up product. Please try again.';
      Alert.alert('Lookup Error', msg);
      setStage('not_found');
      hapticWarning();
    }
  }, [gate]);

  const handleBarcodeScanned = useCallback(({ data }: { data: string }) => {
    if (stage !== 'scanning') return;
    lookupBarcode(data);
  }, [stage, lookupBarcode]);

  const handleQuantityChange = useCallback((delta: number) => {
    hapticLight();
    setQuantity((prev) => Math.max(0.25, Math.round((prev + delta) * 4) / 4));
  }, []);

  const handleAddToLog = useCallback(async () => {
    if (!scannedFood) return;
    setIsLogging(true);
    hapticSuccess();

    await logFood({
      meal_type: mealType,
      quantity,
      calories: scannedFood.calories * quantity,
      protein: scannedFood.protein * quantity,
      carbs: scannedFood.carbs * quantity,
      fat: scannedFood.fat * quantity,
      source: 'barcode',
    });

    setIsLogging(false);
    showToast('Meal logged', { subtext: scannedFood.name });
    router.back();
  }, [scannedFood, mealType, quantity, logFood, router, showToast]);

  const handleScanAgain = useCallback(() => {
    hapticLight();
    setStage('scanning');
    setScannedFood(null);
    setScannedBarcode('');
    setQuantity(1);
  }, []);

  const handleManualEntry = useCallback(() => {
    router.replace({
      pathname: '/(tabs)/nutrition/add-food',
      params: { meal: mealType },
    });
  }, [router, mealType]);

  // Permission handling
  if (!permission) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background.primary }]}>
      <StatusBar style="light" backgroundColor="#0C0A15" />
        <ProgressRing progress={-1} size={64} strokeWidth={6} color={colors.accent.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background.primary }]}>
        <Ionicons name="barcode-outline" size={64} color={colors.text.muted} />
        <Text style={[typography.h3, { color: colors.text.primary, marginTop: spacing.lg }]}>
          Camera access needed
        </Text>
        <Text style={[typography.body, { color: colors.text.muted, marginTop: spacing.sm, textAlign: 'center', paddingHorizontal: spacing.xxl }]}>
          We need camera access to scan barcodes
        </Text>
        <Button title="Grant Access" onPress={requestPermission} style={{ marginTop: spacing.xl }} />
        <Button title="Go Back" variant="ghost" onPress={() => router.back()} style={{ marginTop: spacing.sm }} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <ScreenBackground />
      <AmbientBackground />
      <ActionToast message={toast.message} subtext={toast.subtext} visible={toast.visible} onHide={hideToast} type={toast.type} />
      <HelpBubble id="barcode_scan" message="Scan any food barcode to auto-fill nutrition" position="above" />
      {stage === 'scanning' && (
        <>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'] }}
            onBarcodeScanned={handleBarcodeScanned}
          />

          {/* Overlay */}
          <View style={[styles.scanOverlay, { paddingTop: insets.top }]}>
            <View style={[styles.topBar, { padding: spacing.lg }]}>
              <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Close scanner" accessibilityRole="button">
                <Ionicons name="close" size={28} color="#FFFFFF" />
              </Pressable>
              <Text style={[typography.h3, { color: colors.text.inverse }]}>Scan Barcode</Text>
              <View style={{ width: 28 }} />
            </View>

            <View style={styles.scanCenter}>
              <View style={[styles.scanLine, { backgroundColor: colors.accent.primary }]} />
              <View style={[styles.scanFrameBar, { borderColor: colors.text.inverse }]} />
              <Text style={[typography.caption, { color: colors.text.inverse, marginTop: spacing.lg }]}>
                Point camera at a barcode
              </Text>
            </View>

            <View style={{ paddingBottom: insets.bottom + spacing.lg, padding: spacing.lg }}>
              <Button
                title="Enter Manually"
                variant="outline"
                onPress={handleManualEntry}
                fullWidth
                style={{ borderColor: 'rgba(255,255,255,0.4)' }}
                textStyle={{ color: colors.text.inverse }}
              />
            </View>
          </View>
        </>
      )}

      {stage === 'loading' && (
        <View style={[styles.container, styles.centered, { backgroundColor: colors.background.primary }]}>
          <ProgressRing progress={-1} size={80} strokeWidth={8} color={colors.accent.primary} />
          <Text style={[typography.h3, { color: colors.text.primary, marginTop: spacing.lg }]}>
            Looking up product...
          </Text>
          <Text style={[typography.monoCaption, { color: colors.text.muted, marginTop: spacing.sm }]}>
            Barcode: {scannedBarcode}
          </Text>
        </View>
      )}

      {stage === 'not_found' && (
        <View style={[styles.container, styles.centered, { backgroundColor: colors.background.primary, padding: spacing.lg }]}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.accent.warning} />
          <Text style={[typography.h3, { color: colors.text.primary, marginTop: spacing.lg }]}>
            Product Not Found
          </Text>
          <Text style={[typography.body, { color: colors.text.muted, marginTop: spacing.sm, textAlign: 'center' }]}>
            Barcode {scannedBarcode} was not found in the database
          </Text>
          <View style={{ gap: spacing.md, marginTop: spacing.xl, width: '100%' }}>
            <Button title="Scan Again" onPress={handleScanAgain} fullWidth />
            <Button title="Enter Manually" variant="secondary" onPress={handleManualEntry} fullWidth />
            <Button title="Cancel" variant="ghost" onPress={() => router.back()} fullWidth />
          </View>
        </View>
      )}

      {stage === 'result' && scannedFood && (
        <Animated.View entering={SlideInDown.duration(400)} style={[styles.container, { backgroundColor: colors.background.primary }]}>
          {/* Header */}
          <View style={[styles.resultHeader, { paddingTop: insets.top + spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.md }]}>
            <Pressable onPress={handleScanAgain}>
              <Ionicons name="scan-outline" size={24} color={colors.text.secondary} />
            </Pressable>
            <Text style={[typography.h3, { color: colors.text.primary }]}>Scanned Product</Text>
            <Pressable onPress={() => router.back()}>
              <Ionicons name="close" size={24} color={colors.text.secondary} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={{ padding: spacing.lg, paddingBottom: 140 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Product Info */}
            <Card style={{ marginBottom: spacing.lg }}>
              <Text style={[typography.h2, { color: colors.text.primary }]}>
                {scannedFood.name}
              </Text>
              {scannedFood.brand.length > 0 && (
                <Text style={[typography.body, { color: colors.text.muted, marginTop: 4 }]}>
                  {scannedFood.brand}
                </Text>
              )}
              <View style={[styles.servingRow, { marginTop: spacing.md }]}>
                <Badge label={`Per ${scannedFood.servingSize}`} size="sm" />
                <Badge label={`Barcode: ${scannedFood.barcode}`} size="sm" />
              </View>
            </Card>

            {/* Macros */}
            <Card style={{ marginBottom: spacing.lg }}>
              <Text style={[typography.h3, { color: colors.text.primary, marginBottom: spacing.md }]}>
                Nutrition Facts
              </Text>
              <View style={styles.macroGrid}>
                <View style={styles.macroGridItem}>
                  <ProgressRing
                    progress={Math.min(1, (scannedFood.calories * quantity) / (profile?.daily_calorie_target ?? 2200))}
                    size={64}
                    strokeWidth={5}
                    color={colors.accent.primary}
                  >
                    <Text style={[typography.monoCaption, { color: colors.text.primary, fontWeight: '700' }]}>
                      {Math.round(scannedFood.calories * quantity)}
                    </Text>
                  </ProgressRing>
                  <Text style={[typography.tiny, { color: colors.text.muted, marginTop: 4 }]}>Calories</Text>
                </View>
                <View style={styles.macroGridItem}>
                  <ProgressRing
                    progress={Math.min(1, (scannedFood.protein * quantity) / (profile?.daily_protein_target ?? 180))}
                    size={64}
                    strokeWidth={5}
                    color={MACRO_COLORS.protein}
                  >
                    <Text style={[typography.monoCaption, { color: colors.text.primary, fontWeight: '700' }]}>
                      {Math.round(scannedFood.protein * quantity)}g
                    </Text>
                  </ProgressRing>
                  <Text style={[typography.tiny, { color: MACRO_COLORS.protein, marginTop: 4 }]}>Protein</Text>
                </View>
                <View style={styles.macroGridItem}>
                  <ProgressRing
                    progress={Math.min(1, (scannedFood.carbs * quantity) / (profile?.daily_carb_target ?? 250))}
                    size={64}
                    strokeWidth={5}
                    color={MACRO_COLORS.carbs}
                  >
                    <Text style={[typography.monoCaption, { color: colors.text.primary, fontWeight: '700' }]}>
                      {Math.round(scannedFood.carbs * quantity)}g
                    </Text>
                  </ProgressRing>
                  <Text style={[typography.tiny, { color: MACRO_COLORS.carbs, marginTop: 4 }]}>Carbs</Text>
                </View>
                <View style={styles.macroGridItem}>
                  <ProgressRing
                    progress={Math.min(1, (scannedFood.fat * quantity) / (profile?.daily_fat_target ?? 70))}
                    size={64}
                    strokeWidth={5}
                    color={MACRO_COLORS.fat}
                  >
                    <Text style={[typography.monoCaption, { color: colors.text.primary, fontWeight: '700' }]}>
                      {Math.round(scannedFood.fat * quantity)}g
                    </Text>
                  </ProgressRing>
                  <Text style={[typography.tiny, { color: MACRO_COLORS.fat, marginTop: 4 }]}>Fat</Text>
                </View>
              </View>

              {/* Extra nutrients */}
              <View style={[styles.extraNutrients, { marginTop: spacing.lg, gap: spacing.sm }]}>
                <View style={styles.nutrientRow}>
                  <Text style={[typography.caption, { color: colors.text.secondary }]}>Fiber</Text>
                  <Text style={[typography.captionBold, { color: colors.text.primary }]}>
                    {formatMacro(scannedFood.fiber * quantity)}
                  </Text>
                </View>
                <View style={styles.nutrientRow}>
                  <Text style={[typography.caption, { color: colors.text.secondary }]}>Sugar</Text>
                  <Text style={[typography.captionBold, { color: colors.text.primary }]}>
                    {formatMacro(scannedFood.sugar * quantity)}
                  </Text>
                </View>
              </View>
            </Card>

            {/* Quantity */}
            <Card style={{ marginBottom: spacing.lg }}>
              <View style={styles.quantityRow}>
                <Text style={[typography.body, { color: colors.text.secondary }]}>Servings</Text>
                <View style={styles.quantityControls}>
                  <Pressable
                    onPress={() => handleQuantityChange(-0.25)}
                    accessibilityLabel="Decrease quantity"
                    accessibilityRole="button"
                    style={[styles.qtyBtn, { backgroundColor: colors.background.tertiary, borderRadius: borderRadius.md }]}
                  >
                    <Ionicons name="remove" size={20} color={colors.text.primary} />
                  </Pressable>
                  <Text style={[typography.stat, { color: colors.text.primary, minWidth: 60, textAlign: 'center' }]}>
                    {quantity}
                  </Text>
                  <Pressable
                    onPress={() => handleQuantityChange(0.25)}
                    accessibilityLabel="Increase quantity"
                    accessibilityRole="button"
                    style={[styles.qtyBtn, { backgroundColor: colors.background.tertiary, borderRadius: borderRadius.md }]}
                  >
                    <Ionicons name="add" size={20} color={colors.text.primary} />
                  </Pressable>
                </View>
              </View>
            </Card>

            {/* Meal Type */}
            <Card style={{ marginBottom: spacing.lg }}>
              <Text style={[typography.body, { color: colors.text.secondary, marginBottom: spacing.md }]}>
                Log as
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
                {(['breakfast', 'lunch', 'dinner', 'snack', 'shake'] as const).map((mt) => (
                  <Pressable
                    key={mt}
                    onPress={() => { hapticLight(); setMealType(mt); }}
                    style={[
                      styles.mealChip,
                      {
                        backgroundColor: mealType === mt ? colors.accent.primary : colors.background.tertiary,
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
            </Card>
          </ScrollView>

          {/* Add Button */}
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
              title={isLogging ? 'Adding...' : 'Add to Log'}
              onPress={handleAddToLog}
              loading={isLogging}
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
  centered: { justifyContent: 'center', alignItems: 'center' },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scanCenter: {
    alignItems: 'center',
  },
  scanFrameBar: {
    width: 260,
    height: 160,
    borderWidth: 2,
    borderRadius: 12,
  },
  scanLine: {
    position: 'absolute',
    width: 240,
    height: 2,
    top: '50%',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scroll: { flex: 1 },
  servingRow: {
    flexDirection: 'row',
    gap: 8,
  },
  macroGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  macroGridItem: {
    alignItems: 'center',
  },
  extraNutrients: {},
  nutrientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mealChip: {},
  bottomBar: {
    borderTopWidth: 1,
  },
});
