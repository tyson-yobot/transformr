// =============================================================================
// TRANSFORMR — RestTimerPanel
// Animated slide-up panel for rest timer (replaces fullscreen overlay)
// =============================================================================

import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme/index';
import { hapticLight } from '@utils/haptics';

interface RestTimerPanelProps {
  isResting: boolean;
  restSeconds: number;
  setNumber: number;
  isCompound: boolean;
  exerciseName?: string;
  onSkipRest: () => void;
  onExtendRest: () => void;
  onLogSet: () => void;
}

const PANEL_HEIGHT = 200;
const SPRING_CONFIG = { damping: 16, stiffness: 180 };

export function RestTimerPanel({
  isResting,
  restSeconds,
  setNumber,
  isCompound,
  exerciseName,
  onSkipRest,
  onExtendRest,
  onLogSet,
}: RestTimerPanelProps) {
  const { colors, typography } = useTheme();
  const translateY = useSharedValue(PANEL_HEIGHT);

  useEffect(() => {
    translateY.value = withSpring(isResting ? 0 : PANEL_HEIGHT, SPRING_CONFIG);
  }, [isResting, translateY]);

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: interpolate(translateY.value, [0, PANEL_HEIGHT], [1, 0]),
  }));

  const minutes = Math.floor(restSeconds / 60);
  const seconds = restSeconds % 60;
  const timerDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  return (
    <Animated.View
      style={[
        styles.panel,
        {
          backgroundColor: colors.background.elevated,
          borderTopColor: colors.border.subtle,
        },
        panelStyle,
      ]}
      pointerEvents={isResting ? 'auto' : 'none'}
    >
      {/* Rest type indicator */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View
            style={[
              styles.restBadge,
              { backgroundColor: isCompound ? `${colors.accent.fire}30` : `${colors.accent.primary}30` },
            ]}
          >
            <Ionicons
              name={isCompound ? 'barbell-outline' : 'fitness-outline'}
              size={14}
              color={isCompound ? colors.accent.fire : colors.accent.primary}
            />
            <Text
              style={[
                typography.tiny,
                { color: isCompound ? colors.accent.fire : colors.accent.primary, fontWeight: '600' },
              ]}
            >
              {isCompound ? 'Compound Rest' : 'Isolation Rest'}
            </Text>
          </View>
          {exerciseName && (
            <Text style={[typography.tiny, { color: colors.text.muted }]} numberOfLines={1}>
              {exerciseName}
            </Text>
          )}
        </View>
        <Text style={[typography.tiny, { color: colors.text.muted }]}>Set {setNumber}</Text>
      </View>

      {/* Timer display */}
      <View style={styles.timerRow}>
        <Text
          style={[
            styles.timer,
            { color: restSeconds <= 10 ? colors.accent.fire : colors.text.primary },
          ]}
          accessibilityLabel={`Rest timer: ${minutes} minutes ${seconds} seconds remaining`}
          accessibilityRole="timer"
        >
          {timerDisplay}
        </Text>
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        <Pressable
          onPress={() => { onExtendRest(); hapticLight(); }}
          accessibilityLabel="Add 30 seconds to rest timer"
          accessibilityRole="button"
          style={[styles.actionBtn, { backgroundColor: colors.background.glass }]}
        >
          <Ionicons name="add-circle-outline" size={18} color={colors.text.secondary} />
          <Text style={[typography.tiny, { color: colors.text.secondary, fontWeight: '600' }]}>+30s</Text>
        </Pressable>

        <Pressable
          onPress={() => { onSkipRest(); hapticLight(); }}
          accessibilityLabel="Skip rest and continue"
          accessibilityRole="button"
          style={[
            styles.actionBtn,
            styles.actionBtnPrimary,
            { backgroundColor: colors.accent.primary },
          ]}
        >
          <Ionicons name="play-forward" size={18} color={colors.text.inverse} />
          <Text style={[typography.tiny, { color: colors.text.inverse, fontWeight: '700' }]}>Skip Rest</Text>
        </Pressable>

        <Pressable
          onPress={() => { onLogSet(); hapticLight(); }}
          accessibilityLabel="Log next set now"
          accessibilityRole="button"
          style={[styles.actionBtn, { backgroundColor: colors.background.glass }]}
        >
          <Ionicons name="checkmark-circle-outline" size={18} color={colors.accent.success} />
          <Text style={[typography.tiny, { color: colors.accent.success, fontWeight: '600' }]}>Log Set</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    height: PANEL_HEIGHT,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    zIndex: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  restBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timerRow: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timer: {
    fontSize: 56,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
  },
  actionBtnPrimary: {
    flex: 1,
  },
});
