// =============================================================================
// TRANSFORMR -- Vision Board Builder
// =============================================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { ScreenHelpButton } from '@components/ui/ScreenHelpButton';
import { SCREEN_HELP } from '../../../constants/screenHelp';
import { useFeatureGate } from '@hooks/useFeatureGate';
import { GatePromptCard } from '@components/ui/GatePromptCard';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@theme/index';
import { Button } from '@components/ui/Button';
import { Chip } from '@components/ui/Chip';
import { Modal } from '@components/ui/Modal';
import { Input } from '@components/ui/Input';
import { hapticSuccess, hapticLight } from '@utils/haptics';
import { EmptyState } from '@components/ui/EmptyState';
import { Skeleton } from '@components/ui/Skeleton';
import type { VisionBoardItem } from '@app-types/database';
import { supabase } from '../../../services/supabase';

type VisionCategory = NonNullable<VisionBoardItem['category']>;

const VISION_CATEGORIES: { key: VisionCategory; label: string }[] = [
  { key: 'body', label: 'Body' },
  { key: 'business', label: 'Business' },
  { key: 'lifestyle', label: 'Lifestyle' },
  { key: 'relationship', label: 'Relationship' },
  { key: 'material', label: 'Material' },
  { key: 'travel', label: 'Travel' },
  { key: 'personal', label: 'Personal' },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = 8;
const GRID_COLS = 2;
const TILE_SIZE = (SCREEN_WIDTH - 32 - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS;

export default function VisionBoard() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const gate = useFeatureGate('vision_board');

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => <ScreenHelpButton content={SCREEN_HELP.visionBoardScreen} />,
    });
  }, [navigation]);

  const [items, setItems] = useState<VisionBoardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<VisionCategory | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      setFetchError(null);
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error: err } = await supabase
        .from('vision_board_items')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order');
      if (err) throw err;
      if (data) setItems(data as VisionBoardItem[]);
    } catch (err: unknown) {
      setFetchError(err instanceof Error ? err.message : 'Failed to load vision board.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<VisionCategory>('personal');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [fullScreenItem, setFullScreenItem] = useState<VisionBoardItem | null>(null);
  const [inspirationMode, setInspirationMode] = useState(false);
  const [inspirationIndex, setInspirationIndex] = useState(0);

  const filteredItems = useMemo(
    () =>
      filterCategory
        ? items.filter((item) => item.category === filterCategory)
        : items,
    [items, filterCategory],
  );

  const handleAddItem = useCallback(async () => {
    if (!newImageUrl.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from('vision_board_items')
      .insert({
        user_id: user.id,
        image_url: newImageUrl.trim(),
        title: newTitle.trim() || null,
        category: newCategory,
        sort_order: items.length,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (!error && data) {
      setItems((prev) => [...prev, data as VisionBoardItem]);
    }
    setShowAddModal(false);
    setNewTitle('');
    setNewImageUrl('');
    hapticSuccess();
  }, [newImageUrl, newTitle, newCategory, items.length]);

  const handlePickFromLibrary = useCallback(async () => {
    // In production this would use expo-image-picker
    // For now, prompt for URL
    setShowAddModal(true);
  }, []);

  const toggleInspirationMode = useCallback(() => {
    if (!inspirationMode && filteredItems.length === 0) return;
    setInspirationMode(!inspirationMode);
    setInspirationIndex(0);
    hapticLight();
  }, [inspirationMode, filteredItems]);

  const handleNextInspiration = useCallback(() => {
    setInspirationIndex((prev) => (prev + 1) % filteredItems.length);
    hapticLight();
  }, [filteredItems.length]);

  if (!gate.isAvailable) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.primary }}>
        <GatePromptCard featureKey="vision_board" height={200} />
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background.primary, padding: spacing.lg }]}>
        <Skeleton variant="card" height={40} style={{ marginBottom: spacing.lg }} />
        <View style={[styles.grid, { gap: GRID_GAP }]}>
          <Skeleton variant="card" height={TILE_SIZE} style={{ width: TILE_SIZE }} />
          <Skeleton variant="card" height={TILE_SIZE} style={{ width: TILE_SIZE }} />
          <Skeleton variant="card" height={TILE_SIZE} style={{ width: TILE_SIZE }} />
          <Skeleton variant="card" height={TILE_SIZE} style={{ width: TILE_SIZE }} />
        </View>
      </View>
    );
  }

  if (fetchError) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background.primary, padding: spacing.lg }]}>
        <EmptyState
          ionIcon="alert-circle-outline"
          title="Something went wrong"
          subtitle={fetchError}
          actionLabel="Retry"
          onAction={() => { void fetchItems(); }}
        />
      </View>
    );
  }

  if (inspirationMode && filteredItems.length > 0) {
    const currentItem = filteredItems[inspirationIndex];
    return (
      <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <StatusBar style="light" backgroundColor="#0C0A15" />
        <Pressable style={styles.inspirationContainer} onPress={handleNextInspiration}>
          {currentItem && (
            <>
              <Image
                source={{ uri: currentItem.image_url }}
                style={styles.inspirationImage}
                resizeMode="contain"
              />
              {currentItem.title && (
                <Animated.View entering={FadeIn.duration(500)} style={styles.inspirationOverlay}>
                  <Text style={[typography.h1, { color: colors.text.inverse, textAlign: 'center' }]}>
                    {currentItem.title}
                  </Text>
                </Animated.View>
              )}
            </>
          )}
        </Pressable>
        <Pressable
          onPress={toggleInspirationMode}
          style={[
            styles.exitButton,
            { backgroundColor: colors.background.secondary, borderRadius: 20 },
          ]}
        >
          <Text style={[typography.bodyBold, { color: colors.text.primary }]}>
            Exit
          </Text>
        </Pressable>
      </View>
    );
  }

  if (fullScreenItem) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
        <Pressable
          style={styles.inspirationContainer}
          onPress={() => setFullScreenItem(null)}
        >
          <Image
            source={{ uri: fullScreenItem.image_url }}
            style={styles.inspirationImage}
            resizeMode="contain"
          />
          {fullScreenItem.title && (
            <View style={styles.inspirationOverlay}>
              <Text style={[typography.h2, { color: colors.text.inverse, textAlign: 'center' }]}>
                {fullScreenItem.title}
              </Text>
            </View>
          )}
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { padding: spacing.lg, paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Category Filter */}
        <Animated.View entering={FadeInDown.delay(100)}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.sm, marginBottom: spacing.lg }}
          >
            <Chip
              label="All"
              selected={filterCategory === null}
              onPress={() => setFilterCategory(null)}
            />
            {VISION_CATEGORIES.map((cat) => (
              <Chip
                key={cat.key}
                label={cat.label}
                selected={filterCategory === cat.key}
                onPress={() =>
                  setFilterCategory(filterCategory === cat.key ? null : cat.key)
                }
              />
            ))}
          </ScrollView>
        </Animated.View>

        {/* Inspiration Mode Button */}
        {filteredItems.length > 0 && (
          <Button
            title="Inspiration Mode"
            onPress={toggleInspirationMode}
            variant="secondary"
            fullWidth
            style={{ marginBottom: spacing.lg }}
          />
        )}

        {/* Empty State */}
        {filteredItems.length === 0 && items.length === 0 && (
          <EmptyState
            ionIcon="images-outline"
            title="Your vision board is empty"
            subtitle="Add images that represent your dreams and goals. Link them to your goals and see them daily to stay motivated."
            actionLabel="Add First Image"
            onAction={handlePickFromLibrary}
          />
        )}

        {/* Grid */}
        <View style={styles.grid}>
          {filteredItems.map((item, index) => (
            <Animated.View
              key={item.id}
              entering={FadeInDown.delay(200 + index * 50)}
            >
              <Pressable onPress={() => { hapticLight(); setFullScreenItem(item); }} accessibilityLabel={`View ${item.title ?? 'vision board item'} full screen`}>
                <View
                  style={[
                    styles.gridTile,
                    {
                      width: TILE_SIZE,
                      height: TILE_SIZE,
                      borderRadius: borderRadius.lg,
                      overflow: 'hidden',
                    },
                  ]}
                >
                  <Image
                    source={{ uri: item.image_url }}
                    style={styles.tileImage}
                    resizeMode="cover"
                  />
                  {item.title && (
                    <View style={styles.tileOverlay}>
                      <Text
                        style={[typography.caption, { color: colors.text.inverse }]}
                        numberOfLines={2}
                      >
                        {item.title}
                      </Text>
                    </View>
                  )}
                </View>
              </Pressable>
            </Animated.View>
          ))}

          {/* Add Tile */}
          <Pressable onPress={handlePickFromLibrary} accessibilityLabel="Add new vision board image">
            <View
              style={[
                styles.gridTile,
                styles.addTile,
                {
                  width: TILE_SIZE,
                  height: TILE_SIZE,
                  borderRadius: borderRadius.lg,
                  borderColor: colors.border.default,
                  backgroundColor: colors.background.secondary,
                },
              ]}
            >
              <Text style={{ fontSize: 36, color: colors.text.muted }}>+</Text>
              <Text style={[typography.caption, { color: colors.text.muted }]}>
                Add Image
              </Text>
            </View>
          </Pressable>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Add Modal */}
      <Modal
        visible={showAddModal}
        onDismiss={() => setShowAddModal(false)}
        title="Add Vision"
      >
        <Input
          label="Image URL"
          value={newImageUrl}
          onChangeText={setNewImageUrl}
          placeholder="https://example.com/image.jpg"
        />
        <Input
          label="Title (optional)"
          value={newTitle}
          onChangeText={setNewTitle}
          placeholder="My dream..."
          containerStyle={{ marginTop: spacing.md }}
        />
        <Text
          style={[
            typography.captionBold,
            { color: colors.text.secondary, marginTop: spacing.lg, marginBottom: spacing.sm },
          ]}
        >
          Category
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.sm }}
        >
          {VISION_CATEGORIES.map((cat) => (
            <Chip
              key={cat.key}
              label={cat.label}
              selected={newCategory === cat.key}
              onPress={() => setNewCategory(cat.key)}
            />
          ))}
        </ScrollView>
        <Button
          title="Add to Board"
          onPress={handleAddItem}
          fullWidth
          disabled={!newImageUrl.trim()}
          style={{ marginTop: spacing.xl }}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingBottom: 24 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  gridTile: {},
  tileImage: { width: '100%', height: '100%' },
  tileOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
  },
  addTile: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  inspirationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inspirationImage: { width: '100%', height: '80%' },
  inspirationOverlay: {
    position: 'absolute',
    bottom: 60,
    left: 20,
    right: 20,
  },
  exitButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});
