import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@theme/index';

interface WidgetCardProps {
  title: string;
  action?: {
    label: string;
    onPress: () => void;
  };
  showDragHandle?: boolean;
  children: React.ReactNode;
  style?: ViewStyle;
}

function DragHandle() {
  const { colors, spacing } = useTheme();

  return (
    <View
      style={[
        styles.dragHandle,
        { marginBottom: spacing.md, alignSelf: 'center' },
      ]}
    >
      <View
        style={[
          styles.dragDot,
          { backgroundColor: colors.text.muted },
        ]}
      />
      <View
        style={[
          styles.dragDot,
          { backgroundColor: colors.text.muted, marginLeft: 4 },
        ]}
      />
      <View
        style={[
          styles.dragDot,
          { backgroundColor: colors.text.muted, marginLeft: 4 },
        ]}
      />
    </View>
  );
}

export function WidgetCard({
  title,
  action,
  showDragHandle = false,
  children,
  style,
}: WidgetCardProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.background.secondary,
          borderRadius: borderRadius.lg,
          padding: spacing.lg,
        },
        style,
      ]}
    >
      {showDragHandle ? <DragHandle /> : null}

      {/* Title bar */}
      <View style={[styles.titleBar, { marginBottom: spacing.md }]}>
        <Text
          style={[typography.h3, { color: colors.text.primary, flex: 1 }]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {action ? (
          <Pressable
            onPress={action.onPress}
            hitSlop={8}
            accessibilityRole="button"
          >
            <Text
              style={[
                typography.captionBold,
                { color: colors.accent.primary },
              ]}
            >
              {action.label}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {/* Content slot */}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {},
  dragHandle: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  dragDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  titleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  content: {},
});
