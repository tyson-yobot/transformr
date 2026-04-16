import { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@theme/index';

interface PlanItem {
  id: string;
  icon: string;
  label: string;
  subtitle?: string;
  isCompleted: boolean;
  onPress: () => void;
}

interface TodaysPlanCardProps {
  items: PlanItem[];
  style?: ViewStyle;
}

function CheckCircle({ checked }: { checked: boolean }) {
  const { colors, borderRadius } = useTheme();

  return (
    <View
      style={[
        styles.checkCircle,
        {
          borderRadius: borderRadius.full,
          borderWidth: 2,
          borderColor: checked ? colors.accent.success : colors.border.default,
          backgroundColor: checked ? colors.accent.success : 'transparent',
        },
      ]}
    >
      {checked ? (
        <Text style={styles.checkMark}>{'\u2713'}</Text>
      ) : null}
    </View>
  );
}

function PlanRow({ item }: { item: PlanItem }) {
  const { colors, typography, spacing } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  }, [scale]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    item.onPress();
  }, [item]);

  const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.planRow,
        {
          paddingVertical: spacing.md,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border.subtle,
        },
        animatedStyle,
      ]}
      accessibilityRole="button"
      accessibilityState={{ checked: item.isCompleted }}
    >
      <Text style={{ fontSize: 20, marginRight: spacing.md }}>{item.icon}</Text>
      <View style={styles.planTextWrap}>
        <Text
          style={[
            typography.bodyBold,
            {
              color: item.isCompleted
                ? colors.text.muted
                : colors.text.primary,
              textDecorationLine: item.isCompleted ? 'line-through' : 'none',
            },
          ]}
          numberOfLines={1}
        >
          {item.label}
        </Text>
        {item.subtitle ? (
          <Text
            style={[
              typography.caption,
              { color: colors.text.secondary, marginTop: 2 },
            ]}
            numberOfLines={1}
          >
            {item.subtitle}
          </Text>
        ) : null}
      </View>
      <CheckCircle checked={item.isCompleted} />
    </AnimatedPressable>
  );
}

export function TodaysPlanCard({ items, style }: TodaysPlanCardProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();

  const completedCount = items.filter((i) => i.isCompleted).length;

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
      {/* Header */}
      <View style={[styles.header, { marginBottom: spacing.sm }]}>
        <Text style={[typography.h3, { color: colors.text.primary }]}>
          Today's Plan
        </Text>
        <Text style={[typography.caption, { color: colors.text.secondary }]}>
          {completedCount}/{items.length}
        </Text>
      </View>

      {/* Items */}
      {items.map((item) => (
        <PlanRow key={item.id} item={item} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planTextWrap: {
    flex: 1,
  },
  checkCircle: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: '#FFFFFF', /* brand-ok */
    fontSize: 14,
    fontWeight: '700',
  },
});
