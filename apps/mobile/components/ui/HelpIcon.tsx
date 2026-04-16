// =============================================================================
// TRANSFORMR — HelpIcon
// Small ⓘ icon that opens a bottom-sheet with plain-English feature/metric help.
// Uses RN Modal so it renders above everything, even deep inside ScrollViews.
// =============================================================================

import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme/index';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { hapticLight } from '@utils/haptics';
import type { HelpContent } from '../../constants/helpContent';

export type { HelpContent };

interface HelpIconProps {
  content: HelpContent;
  size?: number;
  color?: string;
  style?: object;
}

const SHEET_TRANSLATE = 420;

export function HelpIcon({ content, size = 16, color, style }: HelpIconProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = React.useState(false);
  const translateY = useSharedValue(SHEET_TRANSLATE);

  const open = useCallback(() => {
    void hapticLight();
    setVisible(true);
    translateY.value = withSpring(0, { damping: 20, stiffness: 200, mass: 0.8 });
  }, [translateY]);

  const close = useCallback(() => {
    translateY.value = withTiming(SHEET_TRANSLATE, { duration: 220 }, (finished) => {
      if (finished) runOnJS(setVisible)(false);
    });
  }, [translateY]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <>
      <TouchableOpacity
        onPress={open}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        accessibilityLabel={`Help: ${content.title}`}
        accessibilityRole="button"
        style={[styles.iconButton, style]}
      >
        <Ionicons
          name="information-circle-outline"
          size={size}
          color={color ?? colors.text.muted}
        />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={close}
        statusBarTranslucent
      >
        <Pressable style={styles.backdrop} onPress={close}>
          <Animated.View
            style={[
              styles.sheet,
              {
                backgroundColor: colors.background.secondary,
                borderTopLeftRadius: borderRadius.xl,
                borderTopRightRadius: borderRadius.xl,
                paddingBottom: insets.bottom + 24,
              },
              sheetStyle,
            ]}
          >
            {/* Handle bar */}
            <View style={[styles.handle, { backgroundColor: colors.border.default }]} />

            {/* Title row */}
            <View style={[styles.titleRow, { marginBottom: spacing.md }]}>
              <Ionicons
                name="information-circle"
                size={22}
                color={colors.accent.primary}
                style={{ marginRight: spacing.sm }}
              />
              <Text style={[typography.h3, { color: colors.text.primary, flex: 1 }]}>
                {content.title}
              </Text>
            </View>

            {/* Body */}
            <Text style={[typography.body, { color: colors.text.secondary, lineHeight: 23, marginBottom: spacing.lg }]}>
              {content.body}
            </Text>

            {/* Learn more items */}
            {content.learnMoreItems && content.learnMoreItems.length > 0 && (
              <View
                style={[
                  styles.factsContainer,
                  {
                    backgroundColor: colors.background.tertiary,
                    borderRadius: borderRadius.md,
                    padding: spacing.lg,
                    marginBottom: spacing.lg,
                  },
                ]}
              >
                {content.learnMoreItems.map((item, i) => (
                  <View
                    key={i}
                    style={[
                      styles.factRow,
                      i < content.learnMoreItems.length - 1 && {
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderBottomColor: colors.border.default,
                      },
                    ]}
                  >
                    <Text style={[typography.caption, { color: colors.text.muted, flex: 1 }]}>
                      {item.label}
                    </Text>
                    <Text style={[typography.captionBold, { color: colors.text.primary }]}>
                      {item.value}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Pro tip */}
            {content.proTip && (
              <View
                style={[
                  styles.proTip,
                  {
                    backgroundColor: colors.accent.primaryDim,
                    borderRadius: borderRadius.md,
                    padding: spacing.md,
                    marginBottom: spacing.xl,
                  },
                ]}
              >
                <Ionicons
                  name="flash"
                  size={14}
                  color={colors.accent.primary}
                  style={{ marginRight: spacing.sm, marginTop: 2 }}
                />
                <Text style={[typography.caption, { color: colors.accent.primary, flex: 1, lineHeight: 19 }]}>
                  <Text style={typography.captionBold}>Pro tip: </Text>
                  {content.proTip}
                </Text>
              </View>
            )}

            {/* Dismiss */}
            <TouchableOpacity
              style={[
                styles.dismissBtn,
                {
                  backgroundColor: colors.background.tertiary,
                  borderRadius: borderRadius.md,
                },
              ]}
              onPress={close}
              accessibilityRole="button"
              accessibilityLabel="Close help"
            >
              <Text style={[typography.bodyBold, { color: colors.text.secondary }]}>
                Got it
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  factsContainer: {},
  factRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  proTip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  dismissBtn: {
    paddingVertical: 14,
    alignItems: 'center',
  },
});
