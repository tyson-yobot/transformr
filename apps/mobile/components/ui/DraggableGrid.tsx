import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet, ViewStyle, Dimensions, LayoutChangeEvent } from 'react-native';
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
  DragEndParams,
} from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTheme } from '@theme/index';

interface DraggableGridItem {
  id: string;
  [key: string]: unknown;
}

interface DraggableGridProps<T extends DraggableGridItem> {
  data: T[];
  onReorder: (data: T[]) => void;
  renderItem: (item: T, index: number) => React.ReactNode;
  numColumns?: number;
  itemSpacing?: number;
  style?: ViewStyle;
}

export function DraggableGrid<T extends DraggableGridItem>({
  data,
  onReorder,
  renderItem,
  numColumns = 2,
  itemSpacing,
  style,
}: DraggableGridProps<T>) {
  const { spacing, borderRadius } = useTheme();
  const gap = itemSpacing ?? spacing.md;

  const handleDragEnd = useCallback(
    ({ data: reorderedData }: DragEndParams<T>) => {
      onReorder(reorderedData);
    },
    [onReorder],
  );

  // We wrap user items in rows for the draggable list
  // DraggableFlatList works as a single-column list, so we render each item
  // inline and use flex-wrap in a container approach:
  // Actually, DraggableFlatList doesn't support numColumns natively,
  // so we treat each item individually and use a column-based width constraint.

  const renderDraggableItem = useCallback(
    ({ item, drag, isActive, getIndex }: RenderItemParams<T>) => {
      const index = getIndex() ?? 0;
      return (
        <ScaleDecorator activeScale={1.05}>
          <View
            style={[
              styles.itemWrapper,
              {
                width: `${100 / numColumns}%` as unknown as number,
                padding: gap / 2,
              },
            ]}
          >
            <View
              style={[
                styles.itemInner,
                { borderRadius: borderRadius.md },
                isActive && styles.activeItem,
              ]}
            >
              <View onTouchStart={drag}>
                {renderItem(item, index)}
              </View>
            </View>
          </View>
        </ScaleDecorator>
      );
    },
    [numColumns, gap, borderRadius, renderItem],
  );

  const keyExtractor = useCallback((item: T) => item.id, []);

  return (
    <GestureHandlerRootView style={[styles.container, style]}>
      <DraggableFlatList
        data={data}
        onDragEnd={handleDragEnd}
        keyExtractor={keyExtractor}
        renderItem={renderDraggableItem}
        numColumns={numColumns}
        contentContainerStyle={[styles.listContent, { padding: gap / 2 }]}
        columnWrapperStyle={numColumns > 1 ? styles.row : undefined}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {},
  row: {
    flexDirection: 'row',
  },
  itemWrapper: {},
  itemInner: {
    overflow: 'hidden',
  },
  activeItem: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
});
