// =============================================================================
// TRANSFORMR — VoiceMicButton
// Floating mic button with recording state, pulse animation, and feedback toasts.
// Drop into any screen at a fixed position — single tap to record.
// =============================================================================

import React, { useEffect, useRef, useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme/index';
import { hapticLight, hapticMedium, hapticWarning } from '@utils/haptics';
import {
  startRecording,
  stopRecording,
  isRecording,
  transcribeAudio,
  parseVoiceCommandAI,
  type VoiceContext,
  type ParsedVoiceCommand,
} from '@services/voice';

export interface VoiceMicButtonProps {
  context: VoiceContext;
  onCommand: (result: ParsedVoiceCommand) => void;
  onError?: (message: string) => void;
  bottom?: number;
  right?: number;
  disabled?: boolean;
}

export function VoiceMicButton({
  context,
  onCommand,
  onError,
  bottom = 100,
  right = 20,
  disabled = false,
}: VoiceMicButtonProps) {
  const { colors } = useTheme();
  const recording = useRef(false);
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0);

  const stopPulse = useCallback(() => {
    cancelAnimation(pulseScale);
    cancelAnimation(pulseOpacity);
    pulseScale.value = withTiming(1, { duration: 150 });
    pulseOpacity.value = withTiming(0, { duration: 150 });
  }, [pulseScale, pulseOpacity]);

  const startPulse = useCallback(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.6, { duration: 700, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 700, easing: Easing.in(Easing.ease) }),
      ),
      -1,
      false,
    );
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0.5, { duration: 700 }),
        withTiming(0, { duration: 700 }),
      ),
      -1,
      false,
    );
  }, [pulseScale, pulseOpacity]);

  useEffect(() => {
    return () => {
      stopPulse();
    };
  }, [stopPulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const handlePress = useCallback(async () => {
    if (disabled) return;

    if (recording.current) {
      // Stop recording and process
      recording.current = false;
      stopPulse();
      hapticMedium();

      const uri = await stopRecording();
      if (!uri) return;

      // Transcribe audio via cloud Whisper, then parse command
      const transcript = await transcribeAudio(uri);
      if (!transcript) {
        hapticWarning();
        onError?.("Didn't catch that. Try speaking more clearly.");
        return;
      }

      const result = await parseVoiceCommandAI(transcript, context);
      if (result.command.action === 'unknown') {
        hapticWarning();
        onError?.(`Didn't understand: "${transcript}". Try: "Log 185 pounds 8 reps"`);
        return;
      }

      hapticMedium();
      onCommand(result);
    } else {
      // Start recording
      recording.current = true;
      hapticLight();
      startPulse();

      try {
        await startRecording();
      } catch {
        recording.current = false;
        stopPulse();
        hapticWarning();
        onError?.('Microphone permission required. Enable in Settings.');
      }
    }
  }, [disabled, stopPulse, startPulse, onCommand, onError]);

  const active = isRecording();

  return (
    <View
      style={[
        styles.container,
        { bottom, right },
      ]}
      pointerEvents="box-none"
    >
      {/* Pulse ring */}
      <Animated.View
        style={[
          styles.pulse,
          { backgroundColor: colors.accent.primary },
          pulseStyle,
        ]}
      />
      {/* Mic button */}
      <Pressable
        onPress={handlePress}
        disabled={disabled}
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: active ? colors.feedback.error : colors.accent.primary,
            opacity: disabled ? 0.4 : pressed ? 0.8 : 1,
          },
        ]}
        accessibilityLabel={active ? 'Stop voice recording' : 'Start voice command'}
        accessibilityRole="button"
      >
        <Ionicons
          name={active ? 'stop' : 'mic'}
          size={22}
          color="#FFFFFF"
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  pulse: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  button: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
