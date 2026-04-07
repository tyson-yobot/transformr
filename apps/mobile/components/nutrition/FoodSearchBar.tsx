import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  ViewStyle,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@theme/index';
import type { Food } from '../../types/database';

type FoodFilter = 'all' | 'custom' | 'verified';

interface FoodSearchBarProps {
  onSearch: (query: string) => void;
  onSelectFood: (food: Food) => void;
  onBarcodeScan: () => void;
  onCameraCapture: () => void;
  searchResults: Food[];
  recentFoods: Food[];
  isSearching?: boolean;
  style?: ViewStyle;
}

const DEBOUNCE_MS = 350;

export function FoodSearchBar({
  onSearch,
  onSelectFood,
  onBarcodeScan,
  onCameraCapture,
  searchResults,
  recentFoods,
  isSearching = false,
  style,
}: FoodSearchBarProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FoodFilter>('all');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);
  const focusAnim = useSharedValue(0);

  const handleChangeText = useCallback(
    (text: string) => {
      setQuery(text);
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        onSearch(text.trim());
      }, DEBOUNCE_MS);
    },
    [onSearch],
  );

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    focusAnim.value = withTiming(1, { duration: 200 });
  }, [focusAnim]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    focusAnim.value = withTiming(0, { duration: 200 });
  }, [focusAnim]);

  const handleSelectFood = useCallback(
    (food: Food) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onSelectFood(food);
      setQuery('');
      inputRef.current?.blur();
    },
    [onSelectFood],
  );

  const handleBarcode = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onBarcodeScan();
  }, [onBarcodeScan]);

  const handleCamera = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onCameraCapture();
  }, [onCameraCapture]);

  const handleFilterChange = useCallback((filter: FoodFilter) => {
    Haptics.selectionAsync();
    setActiveFilter(filter);
  }, []);

  const filteredResults = useMemo(() => {
    const source = query.trim().length > 0 ? searchResults : recentFoods;
    switch (activeFilter) {
      case 'custom':
        return source.filter((f) => f.is_custom);
      case 'verified':
        return source.filter((f) => f.is_verified);
      default:
        return source;
    }
  }, [query, searchResults, recentFoods, activeFilter]);

  const showResults = isFocused && (query.trim().length > 0 || recentFoods.length > 0);

  const containerBorderStyle = useAnimatedStyle(() => ({
    borderColor:
      focusAnim.value > 0.5 ? colors.border.focus : colors.border.default,
  }));

  const renderFoodItem = useCallback(
    ({ item }: { item: Food }) => (
      <Pressable
        onPress={() => handleSelectFood(item)}
        style={[
          styles.resultItem,
          {
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.lg,
            borderBottomWidth: 1,
            borderBottomColor: colors.border.subtle,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Select ${item.name}`}
      >
        <View style={styles.resultInfo}>
          <Text
            style={[typography.body, { color: colors.text.primary }]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          {item.brand ? (
            <Text
              style={[typography.caption, { color: colors.text.muted }]}
              numberOfLines={1}
            >
              {item.brand}
            </Text>
          ) : null}
        </View>
        <View style={styles.resultMacros}>
          <Text style={[typography.captionBold, { color: colors.accent.fire }]}>
            {item.calories} cal
          </Text>
          <Text style={[typography.tiny, { color: colors.text.secondary, marginTop: 2 }]}>
            P:{item.protein}g C:{item.carbs}g F:{item.fat}g
          </Text>
        </View>
        {item.is_verified ? (
          <View
            style={[
              styles.verifiedDot,
              { backgroundColor: colors.accent.success },
            ]}
          />
        ) : null}
      </Pressable>
    ),
    [handleSelectFood, colors, typography, spacing],
  );

  const keyExtractor = useCallback((item: Food) => item.id, []);

  const FILTERS: { key: FoodFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'custom', label: 'My Foods' },
    { key: 'verified', label: 'Verified' },
  ];

  return (
    <View style={[styles.container, style]}>
      <Animated.View
        style={[
          styles.inputRow,
          {
            backgroundColor: colors.background.input,
            borderRadius: borderRadius.md,
            borderWidth: 1.5,
            paddingHorizontal: spacing.md,
          },
          containerBorderStyle,
        ]}
      >
        <Text style={[styles.searchIcon, { color: colors.text.muted }]}>
          {'\u{1F50D}'}
        </Text>
        <TextInput
          ref={inputRef}
          value={query}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="Search foods..."
          placeholderTextColor={colors.text.muted}
          style={[
            typography.body,
            styles.input,
            { color: colors.text.primary },
          ]}
          returnKeyType="search"
          accessibilityLabel="Search foods"
        />
        {isSearching ? (
          <ActivityIndicator size="small" color={colors.accent.primary} />
        ) : null}

        <Pressable
          onPress={handleBarcode}
          style={[styles.iconButton, { marginLeft: spacing.sm }]}
          accessibilityRole="button"
          accessibilityLabel="Scan barcode"
          hitSlop={8}
        >
          <Text style={{ fontSize: 20 }}>{'\u{1F4F7}'}</Text>
        </Pressable>

        <Pressable
          onPress={handleCamera}
          style={[styles.iconButton, { marginLeft: spacing.sm }]}
          accessibilityRole="button"
          accessibilityLabel="AI meal camera"
          hitSlop={8}
        >
          <Text style={{ fontSize: 20 }}>{'\u{1F372}'}</Text>
        </Pressable>
      </Animated.View>

      {showResults ? (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={[
            styles.resultsContainer,
            {
              backgroundColor: colors.background.secondary,
              borderRadius: borderRadius.lg,
              borderWidth: 1,
              borderColor: colors.border.default,
              marginTop: spacing.sm,
            },
          ]}
        >
          <View style={[styles.filterRow, { paddingHorizontal: spacing.md, paddingTop: spacing.md }]}>
            {FILTERS.map((f) => (
              <Pressable
                key={f.key}
                onPress={() => handleFilterChange(f.key)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor:
                      activeFilter === f.key
                        ? colors.accent.primary
                        : colors.background.tertiary,
                    borderRadius: borderRadius.full,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.xs,
                    marginRight: spacing.sm,
                  },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: activeFilter === f.key }}
              >
                <Text
                  style={[
                    typography.caption,
                    {
                      color:
                        activeFilter === f.key
                          ? '#FFFFFF'
                          : colors.text.secondary,
                      fontWeight: '600',
                    },
                  ]}
                >
                  {f.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {query.trim().length === 0 && recentFoods.length > 0 ? (
            <Text
              style={[
                typography.captionBold,
                {
                  color: colors.text.muted,
                  paddingHorizontal: spacing.lg,
                  paddingTop: spacing.md,
                },
              ]}
            >
              RECENT
            </Text>
          ) : null}

          <FlatList
            data={filteredResults}
            renderItem={renderFoodItem}
            keyExtractor={keyExtractor}
            keyboardShouldPersistTaps="handled"
            style={styles.resultsList}
            ListEmptyComponent={
              <View style={[styles.emptyState, { padding: spacing.xl }]}>
                <Text style={[typography.body, { color: colors.text.muted, textAlign: 'center' }]}>
                  {isSearching
                    ? 'Searching...'
                    : query.trim().length > 0
                      ? 'No foods found'
                      : 'No recent foods'}
                </Text>
              </View>
            }
          />
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 8,
  },
  iconButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 32,
    height: 32,
  },
  resultsContainer: {
    maxHeight: 360,
    overflow: 'hidden',
  },
  filterRow: {
    flexDirection: 'row',
  },
  filterChip: {},
  resultsList: {},
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultInfo: {
    flex: 1,
  },
  resultMacros: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  verifiedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 8,
  },
  emptyState: {},
});
