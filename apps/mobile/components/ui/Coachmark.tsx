// =============================================================================
// TRANSFORMR — Coachmark (First-Run Spotlight Tour)
// Shows a spotlight highlight with tooltip on the first visit to complex screens.
// Dismissed state persisted to MMKV — never shown again on that screen.
// =============================================================================

import React, { useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '@theme/index';
import { getStorageBool, setStorageBool } from '@utils/storage';
import { hapticLight } from '@utils/haptics';

const { width: SCREEN_W } = Dimensions.get('window');

export interface CoachmarkStep {
  targetX: number;
  targetY: number;
  targetWidth: number;
  targetHeight: number;
  title: string;
  body: string;
  position: 'above' | 'below';
}

interface CoachmarkProps {
  screenKey: string;
  steps: CoachmarkStep[];
  onComplete?: () => void;
}

const SPOTLIGHT_PAD = 8;
const TOOLTIP_HEIGHT = 170;

export function Coachmark({ screenKey, steps, onComplete }: CoachmarkProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const [visible, setVisible] = React.useState(false);
  const [stepIndex, setStepIndex] = React.useState(0);
  const opacity = useSharedValue(0);
  const mmkvKey = `@transformr/coachmark_seen_${screenKey}`;

  useEffect(() => {
    if (steps.length === 0) return;
    const seen = getStorageBool(mmkvKey);
    if (!seen) {
      setVisible(true);
      opacity.value = withTiming(1, { duration: 300 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps.length]);

  const dismiss = () => {
    opacity.value = withTiming(0, { duration: 200 }, (finished) => {
      if (finished) runOnJS(doFinish)();
    });
  };

  const doFinish = () => {
    setVisible(false);
    setStorageBool(mmkvKey, true);
    onComplete?.();
  };

  const advance = () => {
    void hapticLight();
    if (stepIndex < steps.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      dismiss();
    }
  };

  const overlayStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  if (!visible || steps.length === 0) return null;

  const step = steps[stepIndex];
  if (!step) return null;

  const spotX = step.targetX - SPOTLIGHT_PAD;
  const spotY = step.targetY - SPOTLIGHT_PAD;
  const spotW = step.targetWidth + SPOTLIGHT_PAD * 2;
  const spotH = step.targetHeight + SPOTLIGHT_PAD * 2;

  const tooltipTop =
    step.position === 'below'
      ? spotY + spotH + 16
      : Math.max(0, spotY - TOOLTIP_HEIGHT - 16);

  return (
    <Modal visible transparent animationType="none" onRequestClose={dismiss}>
      <Animated.View style={[StyleSheet.absoluteFill, overlayStyle]}>
        {/* Dark overlay — four panels around the spotlight */}
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={advance}
          activeOpacity={1}
        >
          {/* Top */}
          <View
            style={[
              styles.overlayPanel,
              { height: Math.max(0, spotY), width: SCREEN_W },
            ]}
          />
          {/* Middle row */}
          <View style={[styles.row, { height: spotH }]}>
            <View style={[styles.overlayPanel, { width: Math.max(0, spotX) }]} />
            {/* Spotlight gap — transparent */}
            <View style={{ width: spotW }} />
            <View style={[styles.overlayPanel, { flex: 1 }]} />
          </View>
          {/* Bottom */}
          <View style={[styles.overlayPanel, { flex: 1, width: SCREEN_W }]} />
        </TouchableOpacity>

        {/* Spotlight ring */}
        <View
          style={[
            styles.spotlightRing,
            {
              left: spotX - 2,
              top: spotY - 2,
              width: spotW + 4,
              height: spotH + 4,
              borderColor: colors.accent.primary,
              borderRadius: borderRadius.md,
            },
          ]}
        />

        {/* Tooltip card */}
        <View
          style={[
            styles.tooltip,
            {
              top: tooltipTop,
              backgroundColor: colors.background.secondary,
              borderColor: colors.border.default,
              borderRadius: borderRadius.lg,
            },
          ]}
        >
          <Text style={[typography.bodyBold, { color: colors.text.primary, marginBottom: spacing.sm }]}>
            {step.title}
          </Text>
          <Text style={[typography.body, { color: colors.text.secondary, lineHeight: 21, marginBottom: spacing.md }]}>
            {step.body}
          </Text>

          {/* Step dots + next button */}
          <View style={styles.footer}>
            <View style={styles.dots}>
              {steps.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    {
                      backgroundColor:
                        i === stepIndex ? colors.accent.primary : colors.border.default,
                      width: i === stepIndex ? 16 : 6,
                    },
                  ]}
                />
              ))}
            </View>
            <TouchableOpacity
              onPress={advance}
              style={[styles.nextBtn, { backgroundColor: colors.accent.primary, borderRadius: borderRadius.sm }]}
              accessibilityRole="button"
              accessibilityLabel={stepIndex < steps.length - 1 ? 'Next tip' : 'Got it'}
            >
              <Text style={[typography.captionBold, { color: '#fff' }]}>
                {stepIndex < steps.length - 1 ? 'Next →' : 'Got it'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Skip */}
          <TouchableOpacity onPress={dismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={[typography.tiny, { color: colors.text.muted, textAlign: 'center', marginTop: spacing.sm }]}>
              Skip tour
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlayPanel: { backgroundColor: 'rgba(0,0,0,0.78)' },
  row: { flexDirection: 'row' },
  spotlightRing: {
    position: 'absolute',
    borderWidth: 2,
  },
  tooltip: {
    position: 'absolute',
    left: 20,
    right: 20,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000', /* brand-ok */
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { height: 6, borderRadius: 3 },
  nextBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
});
