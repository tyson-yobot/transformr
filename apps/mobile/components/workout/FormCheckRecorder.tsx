import { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ViewStyle,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions, CameraType } from 'expo-camera';
import { Video, ResizeMode } from 'expo-av';
import Animated, {
  cancelAnimation,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@theme/index';

type RecorderState = 'idle' | 'countdown' | 'recording' | 'review';

interface FormCheckRecorderProps {
  maxDurationSeconds?: number;
  countdownSeconds?: number;
  onSubmitVideo: (uri: string) => void;
  onCancel?: () => void;
  style?: ViewStyle;
}

export function FormCheckRecorder({
  maxDurationSeconds = 30,
  countdownSeconds = 3,
  onSubmitVideo,
  onCancel,
  style,
}: FormCheckRecorderProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();

  const [state, setState] = useState<RecorderState>('idle');
  const [countdown, setCountdown] = useState(countdownSeconds);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [facing, setFacing] = useState<CameraType>('back');

  const cameraRef = useRef<CameraView>(null);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Pulsing record indicator
  const recordPulse = useSharedValue(1);

  useEffect(() => {
    if (state === 'recording') {
      recordPulse.value = withRepeat(
        withSequence(
          withTiming(1.3, { duration: 500 }),
          withTiming(1, { duration: 500 }),
        ),
        -1,
        false,
      );
    } else {
      cancelAnimation(recordPulse);
      recordPulse.value = withTiming(1, { duration: 200 });
    }
    return () => cancelAnimation(recordPulse);
  }, [state, recordPulse]);

  const recordPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: recordPulse.value }],
  }));

  const cleanup = useCallback(() => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const startCountdown = useCallback(() => {
    cleanup();
    setState('countdown');
    setCountdown(countdownSeconds);

    let remaining = countdownSeconds;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    countdownTimerRef.current = setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      if (remaining <= 0) {
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
        startRecording();
      }
    }, 1000);
    // startRecording is defined after startCountdown — circular ref intentional
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdownSeconds, cleanup]);

  const startRecording = useCallback(async () => {
    setState('recording');
    setRecordingSeconds(0);

    // Recording timer
    const startTime = Date.now();
    recordTimerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setRecordingSeconds(elapsed);

      if (elapsed >= maxDurationSeconds) {
        stopRecording();
      }
    }, 500);

    try {
      const video = await cameraRef.current?.recordAsync({
        maxDuration: maxDurationSeconds,
      });
      if (video?.uri) {
        setVideoUri(video.uri);
        setState('review');
      }
    } catch {
      setState('idle');
    }
    // stopRecording is defined after startRecording — circular ref intentional
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxDurationSeconds]);

  const stopRecording = useCallback(async () => {
    cleanup();
    try {
      cameraRef.current?.stopRecording();
    } catch {
      // already stopped
    }
  }, [cleanup]);

  const handleRecordPress = useCallback(() => {
    if (state === 'idle') {
      startCountdown();
    } else if (state === 'recording') {
      stopRecording();
    }
  }, [state, startCountdown, stopRecording]);

  const handleRetake = useCallback(() => {
    setVideoUri(null);
    setState('idle');
    setRecordingSeconds(0);
  }, []);

  const handleSubmit = useCallback(() => {
    if (videoUri) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSubmitVideo(videoUri);
    }
  }, [videoUri, onSubmitVideo]);

  const toggleFacing = useCallback(() => {
    setFacing((prev) => (prev === 'back' ? 'front' : 'back'));
  }, []);

  // Permission request
  if (!permission) {
    return (
      <View style={[styles.centered, style]}>
        <ActivityIndicator color={colors.accent.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View
        style={[
          styles.centered,
          {
            backgroundColor: colors.background.secondary,
            borderRadius: borderRadius.lg,
            padding: spacing.xl,
          },
          style,
        ]}
      >
        <Text
          style={[
            typography.body,
            { color: colors.text.primary, textAlign: 'center', marginBottom: spacing.lg },
          ]}
        >
          Camera permission is required for form checks
        </Text>
        <Pressable
          onPress={requestPermission}
          style={[
            styles.actionBtn,
            {
              backgroundColor: colors.accent.primary,
              borderRadius: borderRadius.md,
              paddingVertical: spacing.md,
              paddingHorizontal: spacing.xl,
            },
          ]}
        >
          <Text style={[typography.bodyBold, { color: '#FFFFFF' /* brand-ok — white on accent button */ }]}>
            Grant Permission
          </Text>
        </Pressable>
      </View>
    );
  }

  // Review state
  if (state === 'review' && videoUri) {
    return (
      <View
        style={[
          styles.recorderWrap,
          { backgroundColor: colors.background.primary, borderRadius: borderRadius.lg },
          style,
        ]}
      >
        <Video
          source={{ uri: videoUri }}
          style={styles.videoPreview}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          isLooping
          shouldPlay
        />
        <View style={[styles.reviewActions, { padding: spacing.lg, gap: spacing.md }]}>
          <Pressable
            onPress={handleRetake}
            style={[
              styles.actionBtn,
              {
                backgroundColor: colors.background.tertiary,
                borderRadius: borderRadius.md,
                paddingVertical: spacing.md,
                flex: 1,
              },
            ]}
          >
            <Text style={[typography.bodyBold, { color: colors.text.primary, textAlign: 'center' }]}>
              Retake
            </Text>
          </Pressable>
          <Pressable
            onPress={handleSubmit}
            style={[
              styles.actionBtn,
              {
                backgroundColor: colors.accent.primary,
                borderRadius: borderRadius.md,
                paddingVertical: spacing.md,
                flex: 1,
              },
            ]}
          >
            <Text style={[typography.bodyBold, { color: '#FFFFFF' /* brand-ok — white on accent button */, textAlign: 'center' }]}>
              Submit for Analysis
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Camera state (idle, countdown, recording)
  return (
    <View
      style={[
        styles.recorderWrap,
        { backgroundColor: colors.background.primary, borderRadius: borderRadius.lg },
        style,
      ]}
    >
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        mode="video"
      >
        {/* Top bar */}
        <View style={[styles.topBar, { padding: spacing.lg }]}>
          {/* Flip camera */}
          <Pressable
            onPress={toggleFacing}
            style={[
              styles.flipBtn,
              {
                backgroundColor: 'rgba(0,0,0,0.5)',
                borderRadius: borderRadius.full,
                padding: spacing.sm,
              },
            ]}
          >
            <Text style={{ fontSize: 20 }}>{'\uD83D\uDD04'}</Text>
          </Pressable>

          {/* Timer */}
          {state === 'recording' ? (
            <View
              style={[
                styles.timerBadge,
                {
                  backgroundColor: 'rgba(239,68,68,0.8)',
                  borderRadius: borderRadius.full,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.xs,
                },
              ]}
            >
              <Text style={[typography.captionBold, { color: '#FFFFFF' /* brand-ok — white on dark camera overlay */ }]}>
                {recordingSeconds}s / {maxDurationSeconds}s
              </Text>
            </View>
          ) : null}

          {/* Cancel */}
          {onCancel ? (
            <Pressable
              onPress={onCancel}
              style={[
                styles.cancelBtn,
                {
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  borderRadius: borderRadius.full,
                  padding: spacing.sm,
                },
              ]}
            >
              <Text style={[typography.captionBold, { color: '#FFFFFF' /* brand-ok — white on dark dismiss button */ }]}>
                {'\u2715'}
              </Text>
            </Pressable>
          ) : null}
        </View>

        {/* Countdown overlay */}
        {state === 'countdown' ? (
          <View style={styles.countdownOverlay}>
            <Text
              style={{
                fontSize: 72,
                fontWeight: '900',
                color: '#FFFFFF', /* brand-ok */
                textShadowColor: 'rgba(0,0,0,0.5)',
                textShadowOffset: { width: 0, height: 2 },
                textShadowRadius: 8,
              }}
            >
              {countdown}
            </Text>
          </View>
        ) : null}

        {/* Bottom controls */}
        <View style={[styles.bottomBar, { paddingBottom: spacing.xxl }]}>
          <Pressable onPress={handleRecordPress}>
            <Animated.View
              style={[
                styles.recordButton,
                {
                  borderColor: '#FFFFFF',
                  borderWidth: 4,
                },
                recordPulseStyle,
              ]}
            >
              <View
                style={[
                  state === 'recording' ? styles.stopSquare : styles.recordInner,
                  {
                    backgroundColor:
                      state === 'recording'
                        ? colors.accent.danger
                        : colors.accent.danger,
                  },
                ]}
              />
            </Animated.View>
          </Pressable>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  recorderWrap: {
    overflow: 'hidden',
    aspectRatio: 9 / 16,
    width: '100%',
  },
  camera: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  flipBtn: {},
  timerBadge: {},
  cancelBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  recordButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  stopSquare: {
    width: 28,
    height: 28,
    borderRadius: 4,
  },
  videoPreview: {
    flex: 1,
  },
  reviewActions: {
    flexDirection: 'row',
  },
  actionBtn: {},
});
