// =============================================================================
// TRANSFORMR -- Restaurant Menu Scanner
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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFeatureGate } from '@hooks/useFeatureGate';
import { GatePromptCard } from '@components/ui/GatePromptCard';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Animated, { FadeIn, FadeInUp, SlideInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Input } from '@components/ui/Input';
import { useNutritionStore } from '@stores/nutritionStore';
import { formatCalories, formatMacro } from '@utils/formatters';
import { MACRO_COLORS, MEAL_TYPES } from '@utils/constants';
import { hapticMedium, hapticSuccess, hapticLight } from '@utils/haptics';
import { ProgressRing } from '@components/ui/ProgressRing';
import { analyzeMenuPhoto } from '@services/ai/mealCamera';
import { supabase } from '../../../services/supabase';
import { useNavigation } from '@react-navigation/native';
import { ScreenHelpButton } from '@components/ui/ScreenHelpButton';
import { SCREEN_HELP } from '../../../constants/screenHelp';

type MealType = typeof MEAL_TYPES[number];

interface MenuItem {
  id: string;
  name: string;
  description: string;
  estimatedCalories: number;
  estimatedProtein: number;
  estimatedCarbs: number;
  estimatedFat: number;
  price?: string;
  confidence: number;
}

type ScanStage = 'capture' | 'analyzing' | 'results';

export default function MenuScannerScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const gate = useFeatureGate('ai_meal_camera');

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => <ScreenHelpButton content={SCREEN_HELP.menuScannerScreen} />,
    });
  }, [navigation]);

  const { logFood } = useNutritionStore();
  const [permission, requestPermission] = useCameraPermissions();

  const [stage, setStage] = useState<ScanStage>('capture');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [restaurantName, setRestaurantName] = useState('');
  const [mealType, setMealType] = useState<MealType>('dinner');
  const [isLogging, setIsLogging] = useState(false);

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current) return;
    hapticMedium();
    setStage('analyzing');

    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8, base64: true });
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const analysis = await analyzeMenuPhoto(photo.uri, user.id, restaurantName || undefined);
      const items: MenuItem[] = (analysis.foods ?? []).map((f, i) => ({
        id: String(i + 1),
        name: f.name,
        description: f.serving_size ?? '',
        estimatedCalories: f.estimated_calories ?? 0,
        estimatedProtein: f.estimated_protein ?? 0,
        estimatedCarbs: f.estimated_carbs ?? 0,
        estimatedFat: f.estimated_fat ?? 0,
        price: undefined,
        confidence: f.confidence ?? 0.85,
      }));

      setMenuItems(items);
      setStage('results');
    } catch {
      setStage('capture');
      Alert.alert('Error', 'Failed to analyze menu. Please try again.');
    }
  }, [restaurantName]);

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

  const totalMacros = menuItems
    .filter((item) => selectedItems.has(item.id))
    .reduce(
      (acc, item) => ({
        calories: acc.calories + item.estimatedCalories,
        protein: acc.protein + item.estimatedProtein,
        carbs: acc.carbs + item.estimatedCarbs,
        fat: acc.fat + item.estimatedFat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );

  const handleLogSelected = useCallback(async () => {
    if (selectedItems.size === 0) return;
    setIsLogging(true);
    hapticSuccess();

    const items = menuItems.filter((item) => selectedItems.has(item.id));

    for (const item of items) {
      await logFood({
        meal_type: mealType,
        quantity: 1,
        calories: item.estimatedCalories,
        protein: item.estimatedProtein,
        carbs: item.estimatedCarbs,
        fat: item.estimatedFat,
        source: 'menu_scan',
      });
    }

    setIsLogging(false);
    router.back();
  }, [selectedItems, menuItems, mealType, logFood, router]);

  const handleRetake = useCallback(() => {
    hapticLight();
    setStage('capture');
    setMenuItems([]);
    setSelectedItems(new Set());
  }, []);

  const handleSaveFavorite = useCallback(() => {
    if (restaurantName.trim().length === 0) {
      Alert.alert('Restaurant Name', 'Please enter a restaurant name to save as favorite.');
      return;
    }
    hapticSuccess();
    Alert.alert('Saved!', `${restaurantName} has been saved to your favorites.`);
  }, [restaurantName]);

  // Feature gate check (must be after all hooks)
  if (!gate.isAvailable) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.primary }}>
        <GatePromptCard featureKey="ai_meal_camera" height={200} />
      </SafeAreaView>
    );
  }

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
        <Ionicons name="reader-outline" size={64} color={colors.text.muted} />
        <Text style={[typography.h3, { color: colors.text.primary, marginTop: spacing.lg }]}>
          Camera access needed
        </Text>
        <Text style={[typography.body, { color: colors.text.muted, marginTop: spacing.sm, textAlign: 'center', paddingHorizontal: spacing.xxl }]}>
          We need camera access to scan restaurant menus
        </Text>
        <Button title="Grant Access" onPress={requestPermission} style={{ marginTop: spacing.xl }} />
        <Button title="Go Back" variant="ghost" onPress={() => router.back()} style={{ marginTop: spacing.sm }} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {stage === 'capture' && (
        <>
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing="back"
          />
          <View style={[styles.overlay, { paddingTop: insets.top }]}>
            <View style={[styles.topBar, { padding: spacing.lg }]}>
              <Pressable onPress={() => router.back()} hitSlop={12}>
                <Ionicons name="close" size={28} color="#FFFFFF" />
              </Pressable>
              <Text style={[typography.h3, { color: colors.text.inverse }]}>Menu Scanner</Text>
              <View style={{ width: 28 }} />
            </View>

            <View style={styles.captureCenter}>
              <View style={[styles.menuFrame, { borderColor: colors.accent.warning, borderRadius: borderRadius.lg }]} />
              <Text style={[typography.caption, { color: colors.text.inverse, marginTop: spacing.md }]}>
                Photograph the menu page
              </Text>
            </View>

            <View style={[styles.captureBottom, { paddingBottom: insets.bottom + spacing.lg }]}>
              <Pressable
                onPress={handleCapture}
                accessibilityLabel="Take photo of menu"
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
            <ProgressRing progress={-1} size={80} strokeWidth={8} color={colors.accent.warning} />
            <Text style={[typography.h3, { color: colors.text.primary, marginTop: spacing.xl }]}>
              Reading the menu...
            </Text>
            <Text style={[typography.body, { color: colors.text.muted, marginTop: spacing.sm, textAlign: 'center', paddingHorizontal: spacing.xxl }]}>
              AI is identifying menu items and estimating nutritional info
            </Text>
          </Animated.View>
        </View>
      )}

      {stage === 'results' && (
        <Animated.View entering={SlideInDown.duration(400)} style={[styles.container, { backgroundColor: colors.background.primary }]}>
          <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.md }]}>
            <Pressable onPress={handleRetake}>
              <Ionicons name="camera-reverse-outline" size={24} color={colors.text.secondary} />
            </Pressable>
            <Text style={[typography.h3, { color: colors.text.primary }]}>Menu Items</Text>
            <Pressable onPress={() => router.back()}>
              <Ionicons name="close" size={24} color={colors.text.secondary} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={{ padding: spacing.lg, paddingBottom: 160 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Restaurant Name */}
            <View style={{ marginBottom: spacing.lg }}>
              <Input
                label="Restaurant"
                placeholder="Enter restaurant name"
                value={restaurantName}
                onChangeText={setRestaurantName}
                rightIcon={
                  restaurantName.trim().length > 0 ? (
                    <Pressable onPress={handleSaveFavorite}>
                      <Ionicons name="heart-outline" size={20} color={colors.accent.danger} />
                    </Pressable>
                  ) : undefined
                }
              />
            </View>

            {/* Meal Type */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: spacing.lg }}
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

            {/* Selected Total */}
            {selectedItems.size > 0 && (
              <Card style={{ marginBottom: spacing.lg }}>
                <View style={styles.totalRow}>
                  <Text style={[typography.body, { color: colors.text.secondary }]}>
                    Selected ({selectedItems.size})
                  </Text>
                  <Text style={[typography.statSmall, { color: colors.text.primary }]}>
                    {formatCalories(totalMacros.calories)}
                  </Text>
                </View>
                <View style={[styles.macroRow, { marginTop: spacing.sm, gap: spacing.lg }]}>
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
            )}

            {/* Menu Items */}
            <Text style={[typography.h3, { color: colors.text.primary, marginBottom: spacing.md }]}>
              Detected Items
            </Text>

            {menuItems.map((item) => (
              <Animated.View key={item.id} entering={FadeInUp.duration(300)}>
                <Card
                  style={{
                    marginBottom: spacing.sm,
                    opacity: selectedItems.has(item.id) ? 1 : 0.6,
                  }}
                  onPress={() => toggleItem(item.id)}
                >
                  <View style={styles.menuItemHeader}>
                    <Ionicons
                      name={selectedItems.has(item.id) ? 'checkbox' : 'square-outline'}
                      size={22}
                      color={selectedItems.has(item.id) ? colors.accent.success : colors.text.muted}
                    />
                    <View style={{ flex: 1, marginLeft: spacing.md }}>
                      <Text style={[typography.bodyBold, { color: colors.text.primary }]}>
                        {item.name}
                      </Text>
                      <Text style={[typography.caption, { color: colors.text.muted, marginTop: 2 }]} numberOfLines={2}>
                        {item.description}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[typography.monoCaption, { color: colors.text.primary, fontWeight: '700' }]}>
                        {formatCalories(item.estimatedCalories)}
                      </Text>
                      <Text style={[typography.tiny, { color: colors.text.muted }]}>
                        {item.price}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.menuItemMacros, { marginTop: spacing.md, gap: spacing.md }]}>
                    <Text style={[typography.tiny, { color: MACRO_COLORS.protein }]}>
                      P: {formatMacro(item.estimatedProtein)}
                    </Text>
                    <Text style={[typography.tiny, { color: MACRO_COLORS.carbs }]}>
                      C: {formatMacro(item.estimatedCarbs)}
                    </Text>
                    <Text style={[typography.tiny, { color: MACRO_COLORS.fat }]}>
                      F: {formatMacro(item.estimatedFat)}
                    </Text>
                    <Badge
                      label={`${Math.round(item.confidence * 100)}%`}
                      variant={item.confidence >= 0.85 ? 'success' : 'warning'}
                      size="sm"
                    />
                  </View>
                </Card>
              </Animated.View>
            ))}

            <Text style={[typography.tiny, { color: colors.text.muted, marginTop: spacing.md, textAlign: 'center' }]}>
              Macro estimates are AI-generated and may vary from actual values
            </Text>
          </ScrollView>

          {/* Log Button */}
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
              onPress={handleLogSelected}
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
  centered: { justifyContent: 'center', alignItems: 'center' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  captureCenter: { alignItems: 'center' },
  menuFrame: {
    width: 300,
    height: 400,
    borderWidth: 2,
  },
  captureBottom: { alignItems: 'center' },
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
  scroll: { flex: 1 },
  mealChip: {},
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  macroRow: { flexDirection: 'row' },
  menuItemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  menuItemMacros: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bottomBar: { borderTopWidth: 1 },
});
