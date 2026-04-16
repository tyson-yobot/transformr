import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  StyleSheet,
  ViewStyle,
  Modal,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withRepeat,
  Easing,
  FadeIn,
  FadeOut,
  SlideInDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@theme/index';

type NudgeType = 'encouragement' | 'reminder' | 'celebration';

interface NudgeOption {
  type: NudgeType;
  emoji: string;
  label: string;
}

interface NudgeButtonProps {
  onSendNudge: (type: NudgeType, message?: string) => void;
  cooldownSeconds?: number;
  lastNudgeSentAt?: string;
  style?: ViewStyle;
}

const NUDGE_OPTIONS: NudgeOption[] = [
  { type: 'encouragement', emoji: '\u{1F4AA}', label: 'Encouragement' },
  { type: 'reminder', emoji: '\u{23F0}', label: 'Reminder' },
  { type: 'celebration', emoji: '\u{1F389}', label: 'Celebration' },
];

const DEFAULT_COOLDOWN = 60;

function getRemainingCooldown(lastSentAt: string | undefined, cooldownSeconds: number): number {
  if (!lastSentAt) return 0;
  const elapsed = (Date.now() - new Date(lastSentAt).getTime()) / 1000;
  return Math.max(0, Math.ceil(cooldownSeconds - elapsed));
}

export function NudgeButton({
  onSendNudge,
  cooldownSeconds = DEFAULT_COOLDOWN,
  lastNudgeSentAt,
  style,
}: NudgeButtonProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [selectedType, setSelectedType] = useState<NudgeType>('encouragement');
  const [remaining, setRemaining] = useState(() =>
    getRemainingCooldown(lastNudgeSentAt, cooldownSeconds),
  );

  const fabScale = useSharedValue(1);
  const pulseScale = useSharedValue(1);

  const isOnCooldown = remaining > 0;

  useEffect(() => {
    setRemaining(getRemainingCooldown(lastNudgeSentAt, cooldownSeconds));
  }, [lastNudgeSentAt, cooldownSeconds]);

  useEffect(() => {
    if (remaining <= 0) return;
    const timer = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [remaining]);

  useEffect(() => {
    if (!isOnCooldown) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 200 });
    }
  }, [isOnCooldown, pulseScale]);

  const handleFabPress = useCallback(() => {
    if (isOnCooldown) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsExpanded(true);
  }, [isOnCooldown]);

  const handleQuickNudge = useCallback(
    (type: NudgeType) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      fabScale.value = withSequence(
        withTiming(1.3, { duration: 100 }),
        withSpring(1, { damping: 8, stiffness: 200 }),
      );
      onSendNudge(type);
      setIsExpanded(false);
      setRemaining(cooldownSeconds);
    },
    [onSendNudge, fabScale, cooldownSeconds],
  );

  const handleCustomOpen = useCallback(
    (type: NudgeType) => {
      setSelectedType(type);
      setShowCustom(true);
      setIsExpanded(false);
    },
    [],
  );

  const handleSendCustom = useCallback(() => {
    if (!customMessage.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSendNudge(selectedType, customMessage.trim());
    setCustomMessage('');
    setShowCustom(false);
    setRemaining(cooldownSeconds);
  }, [customMessage, selectedType, onSendNudge, cooldownSeconds]);

  const fabAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: fabScale.value * pulseScale.value },
    ],
  }));

  return (
    <>
      <View style={[styles.container, style]}>
        {isExpanded ? (
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(150)}
            style={[
              styles.optionsContainer,
              {
                backgroundColor: colors.background.secondary,
                borderRadius: borderRadius.lg,
                padding: spacing.md,
                marginBottom: spacing.md,
                borderWidth: 1,
                borderColor: colors.border.default,
              },
            ]}
          >
            {NUDGE_OPTIONS.map((option, index) => (
              <Animated.View
                key={option.type}
                entering={SlideInDown.delay(index * 60).duration(200).springify()}
              >
                <Pressable
                  onPress={() => handleQuickNudge(option.type)}
                  onLongPress={() => handleCustomOpen(option.type)}
                  style={[
                    styles.optionButton,
                    {
                      backgroundColor: colors.background.tertiary,
                      borderRadius: borderRadius.md,
                      padding: spacing.md,
                      marginBottom: spacing.sm,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Send ${option.label} nudge`}
                  accessibilityHint="Long press for custom message"
                >
                  <Text style={{ fontSize: 24 }}>{option.emoji}</Text>
                  <Text
                    style={[
                      typography.bodyBold,
                      { color: colors.text.primary, marginLeft: spacing.md },
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              </Animated.View>
            ))}
            <Pressable
              onPress={() => setIsExpanded(false)}
              style={[styles.cancelButton, { paddingVertical: spacing.sm }]}
              accessibilityRole="button"
            >
              <Text style={[typography.caption, { color: colors.text.muted, textAlign: 'center' }]}>
                Cancel
              </Text>
            </Pressable>
          </Animated.View>
        ) : null}

        <Animated.View style={fabAnimatedStyle}>
          <Pressable
            onPress={handleFabPress}
            style={[
              styles.fab,
              {
                backgroundColor: isOnCooldown
                  ? colors.background.tertiary
                  : colors.accent.primary,
                width: 60,
                height: 60,
                borderRadius: 30,
                shadowColor: isOnCooldown ? 'transparent' : colors.accent.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.4,
                shadowRadius: 12,
                elevation: isOnCooldown ? 0 : 8,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={
              isOnCooldown
                ? `Nudge on cooldown, ${remaining} seconds remaining`
                : 'Send nudge to partner'
            }
          >
            {isOnCooldown ? (
              <Text style={[typography.captionBold, { color: colors.text.muted }]}>
                {remaining}s
              </Text>
            ) : (
              <Text style={{ fontSize: 28 }}>{'\u{1F44B}'}</Text>
            )}
          </Pressable>
        </Animated.View>
      </View>

      <Modal
        visible={showCustom}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCustom(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.customModal,
              {
                backgroundColor: colors.background.secondary,
                borderRadius: borderRadius.xl,
                padding: spacing.xl,
                marginHorizontal: spacing.xl,
                borderWidth: 1,
                borderColor: colors.border.default,
              },
            ]}
          >
            <Text style={[typography.h3, { color: colors.text.primary }]}>
              Custom Nudge
            </Text>
            <Text style={[typography.caption, { color: colors.text.secondary, marginTop: spacing.xs }]}>
              Add a personal message to your {selectedType} nudge
            </Text>
            <TextInput
              value={customMessage}
              onChangeText={setCustomMessage}
              placeholder="Type your message..."
              placeholderTextColor={colors.text.muted}
              multiline
              maxLength={200}
              style={[
                typography.body,
                {
                  color: colors.text.primary,
                  backgroundColor: colors.background.input,
                  borderRadius: borderRadius.md,
                  borderWidth: 1.5,
                  borderColor: colors.border.default,
                  padding: spacing.md,
                  marginTop: spacing.lg,
                  minHeight: 80,
                  textAlignVertical: 'top',
                },
              ]}
              accessibilityLabel="Custom nudge message"
            />
            <View style={[styles.modalActions, { marginTop: spacing.lg, gap: spacing.md }]}>
              <Pressable
                onPress={() => setShowCustom(false)}
                style={[
                  styles.modalButton,
                  {
                    backgroundColor: colors.background.tertiary,
                    borderRadius: borderRadius.md,
                    paddingVertical: spacing.md,
                  },
                ]}
                accessibilityRole="button"
              >
                <Text style={[typography.bodyBold, { color: colors.text.primary, textAlign: 'center' }]}>
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={handleSendCustom}
                style={[
                  styles.modalButton,
                  {
                    backgroundColor: colors.accent.primary,
                    borderRadius: borderRadius.md,
                    paddingVertical: spacing.md,
                    opacity: customMessage.trim().length > 0 ? 1 : 0.5,
                  },
                ]}
                disabled={customMessage.trim().length === 0}
                accessibilityRole="button"
              >
                <Text style={[typography.bodyBold, { color: '#FFFFFF' /* brand-ok — white on accent button */, textAlign: 'center' }]}>
                  Send
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
  },
  fab: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsContainer: {},
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cancelButton: {},
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customModal: {
    width: '100%',
    maxWidth: 400,
  },
  modalActions: {
    flexDirection: 'row',
  },
  modalButton: {
    flex: 1,
  },
});
