// =============================================================================
// TRANSFORMR -- Card Component
// Purple Ambient Glow System — variant-aware card with shadow tokens
// =============================================================================

import React, { useCallback } from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@theme/index';

export type CardVariant =
  | 'default'   // Subtle purple glow — standard content cards
  | 'elevated'  // Strong glow — hero / featured cards
  | 'ai'        // Cyan accent — AI-generated content
  | 'success'   // Green accent — completion / achievement cards
  | 'fire'      // Orange accent — streak cards
  | 'gold'      // Amber accent — PR / milestone cards
  | 'partner'   // Pink accent — partner feature cards
  | 'danger'    // Red accent — warning / missed cards
  | 'flat'      // No glow — nested / inline cards only
  // Legacy variants kept for backwards compatibility:
  | 'outlined'
  | 'featured';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  padding?: number;
  borderAccent?: boolean;
  headerGradient?: boolean;
  accessibilityLabel?: string;
  accessibilityRole?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Card({
  children,
  variant = 'default',
  header,
  footer,
  onPress,
  style,
  padding,
  borderAccent = false,
  headerGradient = false,
  accessibilityLabel,
  accessibilityRole: _accessibilityRole,
}: CardProps) {
  const { colors, spacing, borderRadius, isDark } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    if (!onPress) return;
    scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
  }, [onPress, scale]);

  const handlePressOut = useCallback(() => {
    if (!onPress) return;
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  }, [onPress, scale]);

  const handlePress = useCallback(() => {
    if (!onPress) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress]);

  const effectivePadding = padding ?? spacing.lg;
  const variantStyle = getVariantStyle(variant, colors, isDark);

  const borderAccentStyle: ViewStyle = borderAccent
    ? { borderLeftWidth: 3, borderLeftColor: variantStyle.accentColor }
    : {};

  // Visual container — border, background, padding. No shadow props here so
  // this style is safe to place on Reanimated's AnimatedPressable (Fabric dev
  // mode warns when shadowOffset is passed as a native prop via Reanimated).
  const visualStyle: ViewStyle = {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: effectivePadding,
    borderWidth: 1,
    borderColor: colors.border.default,
    ...(variantStyle.borderOverride ?? {}),
    ...borderAccentStyle,
  };

  const content = (
    <>
      {headerGradient && (
        <View
          style={[
            styles.headerGradient,
            {
              backgroundColor: variantStyle.glowColor,
              borderTopLeftRadius: borderRadius.lg,
              borderTopRightRadius: borderRadius.lg,
            },
          ]}
        />
      )}
      {header && (
        <View
          style={[
            styles.section,
            {
              marginBottom: spacing.md,
              paddingBottom: spacing.md,
              borderBottomWidth: 1,
              borderBottomColor: colors.border.subtle,
            },
          ]}
        >
          {header}
        </View>
      )}
      <View style={styles.body}>{children}</View>
      {footer && (
        <View
          style={[
            styles.section,
            {
              marginTop: spacing.md,
              paddingTop: spacing.md,
              borderTopWidth: 1,
              borderTopColor: colors.border.subtle,
            },
          ]}
        >
          {footer}
        </View>
      )}
    </>
  );

  if (onPress) {
    // Shadow lives on the outer plain View so Reanimated never receives
    // shadowOffset as a native prop (which triggers warnForStyleProps in Fabric
    // dev builds). The inner AnimatedPressable carries visual + scale animation.
    return (
      <View
        style={[
          {
            borderRadius: borderRadius.lg,
            backgroundColor: colors.background.secondary, // required for iOS shadow
            ...variantStyle.shadowProps,
          },
          style,
        ]}
      >
        <AnimatedPressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[visualStyle, animatedStyle]}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
        >
          {content}
        </AnimatedPressable>
      </View>
    );
  }

  // Non-pressable — no Reanimated involved, shadow merged directly.
  return (
    <View style={[visualStyle, variantStyle.shadowProps, style]}>
      {content}
    </View>
  );
}

// -----------------------------------------------------------------------------
// Variant resolver — returns shadow + accent color + glow overlay color
// -----------------------------------------------------------------------------

interface VariantStyle {
  // Shadow/elevation only. MUST stay on plain Views — never on Animated
  // components (Reanimated passes these as Fabric native props which triggers
  // warnForStyleProps in dev mode for nested-object properties like shadowOffset).
  shadowProps:     ViewStyle;
  // Optional border overrides (e.g. light-mode depth on default variant).
  borderOverride?: ViewStyle;
  accentColor:     string;
  glowColor:       string;
}

function getVariantStyle(
  variant: CardVariant,
  colors: ReturnType<typeof useTheme>['colors'],
  isDark: boolean,
): VariantStyle {
  switch (variant) {
    case 'elevated':
    case 'featured':
      return {
        shadowProps: isDark
          ? colors.shadow.cardStrong
          : {
              shadowColor:   '#7C3AED', // brand purple — light-mode branded shadow
              shadowOffset:  { width: 0, height: 4 },
              shadowOpacity: 0.12,
              shadowRadius:  14,
              elevation:     6,
            },
        accentColor: colors.accent.primary,
        glowColor:   colors.glow.purple,
      };

    case 'ai':
      return {
        shadowProps: {
          shadowColor:    colors.accent.cyan,
          shadowOffset:   { width: 0, height: 4 },
          shadowOpacity:  0.18,
          shadowRadius:   16,
          elevation:      8,
        },
        accentColor: colors.accent.cyan,
        glowColor:   colors.glow.cyan,
      };

    case 'success':
      return {
        shadowProps: {
          shadowColor:    colors.accent.success,
          shadowOffset:   { width: 0, height: 2 },
          shadowOpacity:  0.14,
          shadowRadius:   8,
          elevation:      4,
        },
        accentColor: colors.accent.success,
        glowColor:   colors.glow.success,
      };

    case 'fire':
      return {
        shadowProps: {
          shadowColor:    colors.accent.fire,
          shadowOffset:   { width: 0, height: 2 },
          shadowOpacity:  0.14,
          shadowRadius:   8,
          elevation:      4,
        },
        accentColor: colors.accent.fire,
        glowColor:   colors.glow.fire,
      };

    case 'gold':
      return {
        shadowProps: {
          shadowColor:    colors.accent.gold,
          shadowOffset:   { width: 0, height: 4 },
          shadowOpacity:  0.18,
          shadowRadius:   16,
          elevation:      8,
        },
        accentColor: colors.accent.gold,
        glowColor:   colors.glow.gold,
      };

    case 'partner':
      return {
        shadowProps: {
          shadowColor:    colors.accent.pink,
          shadowOffset:   { width: 0, height: 4 },
          shadowOpacity:  0.18,
          shadowRadius:   16,
          elevation:      8,
        },
        accentColor: colors.accent.pink,
        glowColor:   colors.glow.pink,
      };

    case 'danger':
      return {
        shadowProps: {
          shadowColor:    colors.accent.danger,
          shadowOffset:   { width: 0, height: 2 },
          shadowOpacity:  0.12,
          shadowRadius:   8,
          elevation:      4,
        },
        accentColor: colors.accent.danger,
        glowColor:   colors.glow.danger,
      };

    case 'flat':
      return {
        shadowProps: {},
        accentColor: colors.border.default,
        glowColor:   'transparent',
      };

    case 'outlined':
      return {
        shadowProps: {},
        accentColor: colors.border.default,
        glowColor:   'transparent',
      };

    // default — subtle purple glow
    default:
      return {
        shadowProps: isDark
          ? colors.shadow.cardSubtle
          : {
              shadowColor:   '#7C3AED',
              shadowOffset:  { width: 0, height: 2 },
              shadowOpacity: 0.07,
              shadowRadius:  8,
              elevation:     2,
            },
        borderOverride: isDark
          ? undefined
          : { borderWidth: 1, borderColor: 'rgba(124,58,237,0.09)' }, // brand purple tint — light-mode depth
        accentColor: colors.accent.primary,
        glowColor:   colors.glow.purpleSoft,
      };
  }
}

const styles = StyleSheet.create({
  section:        {},
  body:           {},
  headerGradient: {
    position: 'absolute',
    top:      0,
    left:     0,
    right:    0,
    height:   60,
    opacity:  0.6,
  },
});
