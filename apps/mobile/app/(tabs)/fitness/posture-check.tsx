// =============================================================================
// TRANSFORMR -- AI Posture Check Screen
// 5-step interactive posture analysis: intro → front photo → side photo →
// analyzing → results with ProgressRing score, issues, and exercises.
// =============================================================================

import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { ProgressRing } from '@components/ui/ProgressRing';
import { hapticLight, hapticMedium, hapticSuccess } from '@utils/haptics';
import { supabase } from '@services/supabase';
import { useFeatureGate } from '@hooks/useFeatureGate';
import { ScreenBackground } from '@components/ui/ScreenBackground';
import { AmbientBackground } from '@components/ui/AmbientBackground';
import { EmptyStateBackground } from '@components/ui/EmptyStateBackground';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PostureStep = 'intro' | 'front-photo' | 'side-photo' | 'analyzing' | 'results';

interface ExercisePrescribed {
  name: string;
  sets: number;
  reps: number;
  frequency: string;
  video_cue: string;
}

interface PostureView {
  head_alignment: string;
  shoulder_alignment: string;
  hip_alignment: string;
}

interface SideView {
  cervical_curve: string;
  lumbar_curve: string;
  pelvic_tilt: string;
}

interface PostureResult {
  id: string;
  overall_score: number;
  front_view: PostureView | null;
  side_view: SideView | null;
  issues: string[];
  recommendations: string[];
  exercises_prescribed: ExercisePrescribed[];
  improvement_timeline: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function classifyIssue(issue: string): 'danger' | 'warning' | 'info' {
  const lower = issue.toLowerCase();
  if (
    lower.includes('severe') ||
    lower.includes('pain') ||
    lower.includes('critical') ||
    lower.includes('scoliosis')
  ) {
    return 'danger';
  }
  if (
    lower.includes('moderate') ||
    lower.includes('tilt') ||
    lower.includes('elevation') ||
    lower.includes('anterior')
  ) {
    return 'warning';
  }
  return 'info';
}

function scoreColor(score: number, colors: ReturnType<typeof useTheme>['colors']): string {
  if (score >= 80) return colors.accent.success;
  if (score >= 60) return colors.accent.warning;
  return colors.accent.danger;
}

function scoreLabel(score: number): string {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 55) return 'Fair';
  return 'Needs Work';
}

async function pickOrCaptureImage(): Promise<string | null> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    const libStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (libStatus.status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Camera or photo library access is needed for posture analysis.',
      );
      return null;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.7,
      allowsEditing: true,
      aspect: [3, 4],
    });
    if (result.canceled || !result.assets[0]?.base64) return null;
    return result.assets[0].base64;
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    base64: true,
    quality: 0.7,
    allowsEditing: true,
    aspect: [3, 4],
  });
  if (result.canceled || !result.assets[0]?.base64) return null;
  return result.assets[0].base64;
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function PostureCheckScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const postureGate = useFeatureGate('ai_posture_analysis');

  const [step, setStep] = useState<PostureStep>('intro');
  const [frontImageBase64, setFrontImageBase64] = useState<string | null>(null);
  const [sideImageBase64, setSideImageBase64] = useState<string | null>(null);
  const [frontImageUri, setFrontImageUri] = useState<string | null>(null);
  const [sideImageUri, setSideImageUri] = useState<string | null>(null);
  const [result, setResult] = useState<PostureResult | null>(null);
  const [expandedExercise, setExpandedExercise] = useState<number | null>(null);

  const handleCaptureFront = useCallback(async () => {
    await hapticLight();
    const base64 = await pickOrCaptureImage();
    if (!base64) return;
    setFrontImageBase64(base64);
    setFrontImageUri(`data:image/jpeg;base64,${base64}`);
    await hapticSuccess();
  }, []);

  const handleCaptureSide = useCallback(async () => {
    await hapticLight();
    const base64 = await pickOrCaptureImage();
    if (!base64) return;
    setSideImageBase64(base64);
    setSideImageUri(`data:image/jpeg;base64,${base64}`);
    await hapticSuccess();
  }, []);

  const handleSkipSide = useCallback(async () => {
    await hapticLight();
    setStep('analyzing');
    await runAnalysis(frontImageBase64, null);
    // runAnalysis is defined later but is stable (useCallback with no deps that change)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frontImageBase64]);

  const handleAnalyzeWithBoth = useCallback(async () => {
    await hapticMedium();
    setStep('analyzing');
    await runAnalysis(frontImageBase64, sideImageBase64);
    // runAnalysis is defined later but is stable (useCallback with no deps that change)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frontImageBase64, sideImageBase64]);

  const runAnalysis = useCallback(
    async (front: string | null, side: string | null) => {
      if (!postureGate.isAvailable) { setStep('intro'); return; }
      try {
        const viewType = front && side ? 'both' : front ? 'front' : 'side';
        const { data, error } = await supabase.functions.invoke('ai-posture-analysis', {
          body: {
            image_base64: front ?? undefined,
            side_image_base64: side ?? undefined,
            view_type: viewType,
          },
        });

        if (error) throw new Error(error.message ?? 'Analysis failed');

        setResult(data as PostureResult);
        setStep('results');
        await hapticSuccess();
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Analysis failed. Please try again.';
        Alert.alert('Analysis Error', msg);
        setStep(front ? 'side-photo' : 'front-photo');
      }
    },
    [postureGate.isAvailable],
  );

  const handleSkipToTextAnalysis = useCallback(async () => {
    await hapticMedium();
    setStep('analyzing');
    await runAnalysis(null, null);
  }, [runAnalysis]);

  const handleReset = useCallback(async () => {
    await hapticLight();
    setStep('intro');
    setFrontImageBase64(null);
    setSideImageBase64(null);
    setFrontImageUri(null);
    setSideImageUri(null);
    setResult(null);
    setExpandedExercise(null);
  }, []);

  // --------------------------------------------------------------------------
  // Step 1 — Intro
  // --------------------------------------------------------------------------

  if (step === 'intro') {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
        <ScreenBackground />
        <AmbientBackground />
        <StatusBar style="light" backgroundColor="#0C0A15" />
        <ScrollView
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 90 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerBlock}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: `${colors.accent.primary}15`, borderRadius: 40 },
              ]}
            >
              <Ionicons name="body" size={40} color={colors.accent.primary} />
            </View>
            <Text
              style={[
                typography.h1,
                { color: colors.text.primary, marginTop: spacing.lg, textAlign: 'center' },
              ]}
            >
              AI Posture Analysis
            </Text>
            <Text
              style={[
                typography.body,
                { color: colors.text.secondary, marginTop: spacing.sm, textAlign: 'center' },
              ]}
            >
              Our AI analyzes your posture alignment, identifies issues, and prescribes targeted corrective exercises.
            </Text>
          </View>

          <Card style={{ marginTop: spacing.xl }}>
            <Text style={[typography.h3, { color: colors.text.primary, marginBottom: spacing.md }]}>
              What you need
            </Text>
            {[
              { icon: 'phone-portrait-outline' as const, text: 'Your phone or a helper to hold the camera' },
              { icon: 'expand-outline' as const, text: 'Full body visible in frame — head to feet' },
              { icon: 'sunny-outline' as const, text: 'Good lighting — avoid dark backgrounds' },
              { icon: 'body-outline' as const, text: 'Wear fitted clothing for best accuracy' },
            ].map((item, idx) => (
              <View
                key={idx}
                style={[styles.instructionRow, { marginBottom: spacing.sm }]}
              >
                <Ionicons name={item.icon} size={22} color={colors.accent.primary} />
                <Text
                  style={[
                    typography.body,
                    { color: colors.text.secondary, flex: 1, marginLeft: spacing.md },
                  ]}
                >
                  {item.text}
                </Text>
              </View>
            ))}
          </Card>

          <Card style={{ marginTop: spacing.md }} variant="ai">
            <View style={styles.rowCenter}>
              <Ionicons name="sparkles" size={18} color={colors.accent.cyan} />
              <Text
                style={[
                  typography.captionBold,
                  { color: colors.accent.cyan, marginLeft: spacing.sm },
                ]}
              >
                No photo? No problem.
              </Text>
            </View>
            <Text
              style={[
                typography.body,
                { color: colors.text.secondary, marginTop: spacing.xs },
              ]}
            >
              We can also assess likely posture patterns from your workout history — no camera required.
            </Text>
          </Card>

          <Button
            title="Start with Camera"
            onPress={() => setStep('front-photo')}
            fullWidth
            size="lg"
            style={{ marginTop: spacing.xl }}
            leftIcon={<Ionicons name="camera" size={22} color={colors.text.inverse} />}
          />
          <Button
            title="Use Workout History Instead"
            variant="outline"
            onPress={handleSkipToTextAnalysis}
            fullWidth
            style={{ marginTop: spacing.sm }}
          />
        </ScrollView>
      </View>
    );
  }

  // --------------------------------------------------------------------------
  // Step 2 — Front View Photo
  // --------------------------------------------------------------------------

  if (step === 'front-photo') {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
        <ScreenBackground />
        <AmbientBackground />
        <StatusBar style="light" backgroundColor="#0C0A15" />
        <ScrollView
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 90 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.stepIndicator}>
            {(['front-photo', 'side-photo', 'results'] as const).map((s, idx) => (
              <View
                key={s}
                style={[
                  styles.stepDot,
                  {
                    backgroundColor:
                      idx === 0 ? colors.accent.primary : colors.background.tertiary,
                    borderRadius: 4,
                  },
                ]}
              />
            ))}
          </View>

          <Text
            style={[
              typography.h2,
              { color: colors.text.primary, textAlign: 'center', marginTop: spacing.lg },
            ]}
          >
            Step 1: Front View
          </Text>
          <Text
            style={[
              typography.body,
              { color: colors.text.secondary, textAlign: 'center', marginTop: spacing.sm },
            ]}
          >
            Stand facing the camera, feet shoulder-width apart, arms relaxed at your sides.
          </Text>

          <Card style={{ marginTop: spacing.xl }}>
            <View style={styles.rowCenter}>
              <Ionicons name="person" size={22} color={colors.accent.primary} />
              <Text
                style={[
                  typography.captionBold,
                  { color: colors.text.muted, marginLeft: spacing.sm },
                ]}
              >
                FRONT VIEW GUIDE
              </Text>
            </View>
            {[
              'Camera at chest height, 6–8 feet away',
              'Stand relaxed — do not correct your posture',
              'Full body in frame from head to toes',
              'Natural standing position',
            ].map((tip, idx) => (
              <View
                key={idx}
                style={[styles.instructionRow, { marginTop: spacing.sm }]}
              >
                <Ionicons name="checkmark-circle" size={16} color={colors.accent.success} />
                <Text
                  style={[
                    typography.body,
                    { color: colors.text.secondary, flex: 1, marginLeft: spacing.sm },
                  ]}
                >
                  {tip}
                </Text>
              </View>
            ))}
          </Card>

          {frontImageUri ? (
            <View style={{ marginTop: spacing.xl }}>
              <Image
                source={{ uri: frontImageUri }}
                style={[
                  styles.photoPreview,
                  { borderRadius: borderRadius.lg, borderColor: colors.accent.success, borderWidth: 2 },
                ]}
                resizeMode="cover"
              />
              <View style={[styles.rowCenter, { marginTop: spacing.sm }]}>
                <Ionicons name="checkmark-circle" size={18} color={colors.accent.success} />
                <Text
                  style={[
                    typography.caption,
                    { color: colors.accent.success, marginLeft: spacing.xs },
                  ]}
                >
                  Front view captured
                </Text>
              </View>
              <Button
                title="Retake Photo"
                variant="outline"
                onPress={handleCaptureFront}
                fullWidth
                style={{ marginTop: spacing.md }}
                leftIcon={<Ionicons name="refresh" size={18} color={colors.accent.primary} />}
              />
              <Button
                title="Next: Side View"
                onPress={() => setStep('side-photo')}
                fullWidth
                size="lg"
                style={{ marginTop: spacing.sm }}
                rightIcon={<Ionicons name="arrow-forward" size={20} color={colors.text.inverse} />}
              />
            </View>
          ) : (
            <Pressable
              onPress={handleCaptureFront}
              style={[
                styles.cameraPlaceholder,
                {
                  borderColor: colors.border.default,
                  borderRadius: borderRadius.lg,
                  backgroundColor: colors.background.secondary,
                  marginTop: spacing.xl,
                },
              ]}
              accessibilityLabel="Take front view photo"
              accessibilityRole="button"
            >
              <Ionicons name="camera" size={48} color={colors.text.muted} />
              <Text
                style={[
                  typography.body,
                  { color: colors.text.muted, marginTop: spacing.md },
                ]}
              >
                Tap to take or upload photo
              </Text>
            </Pressable>
          )}
        </ScrollView>
      </View>
    );
  }

  // --------------------------------------------------------------------------
  // Step 3 — Side View Photo
  // --------------------------------------------------------------------------

  if (step === 'side-photo') {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
        <ScreenBackground />
        <AmbientBackground />
        <StatusBar style="light" backgroundColor="#0C0A15" />
        <ScrollView
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 90 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.stepIndicator}>
            {(['front-photo', 'side-photo', 'results'] as const).map((s, idx) => (
              <View
                key={s}
                style={[
                  styles.stepDot,
                  {
                    backgroundColor:
                      idx <= 1 ? colors.accent.primary : colors.background.tertiary,
                    borderRadius: 4,
                  },
                ]}
              />
            ))}
          </View>

          <Text
            style={[
              typography.h2,
              { color: colors.text.primary, textAlign: 'center', marginTop: spacing.lg },
            ]}
          >
            Step 2: Side View
          </Text>
          <Text
            style={[
              typography.body,
              { color: colors.text.secondary, textAlign: 'center', marginTop: spacing.sm },
            ]}
          >
            Stand sideways to the camera, arms relaxed. Either left or right side works.
          </Text>

          <Card style={{ marginTop: spacing.xl }}>
            <View style={styles.rowCenter}>
              <Ionicons name="person-outline" size={22} color={colors.accent.secondary} />
              <Text
                style={[
                  typography.captionBold,
                  { color: colors.text.muted, marginLeft: spacing.sm },
                ]}
              >
                SIDE VIEW GUIDE
              </Text>
            </View>
            {[
              'Camera at mid-torso height',
              'Stand naturally — do not correct your posture',
              'Arms hang naturally at your side',
              'Feet together, full body in frame',
            ].map((tip, idx) => (
              <View
                key={idx}
                style={[styles.instructionRow, { marginTop: spacing.sm }]}
              >
                <Ionicons name="checkmark-circle" size={16} color={colors.accent.success} />
                <Text
                  style={[
                    typography.body,
                    { color: colors.text.secondary, flex: 1, marginLeft: spacing.sm },
                  ]}
                >
                  {tip}
                </Text>
              </View>
            ))}
          </Card>

          {sideImageUri ? (
            <View style={{ marginTop: spacing.xl }}>
              <Image
                source={{ uri: sideImageUri }}
                style={[
                  styles.photoPreview,
                  { borderRadius: borderRadius.lg, borderColor: colors.accent.success, borderWidth: 2 },
                ]}
                resizeMode="cover"
              />
              <View style={[styles.rowCenter, { marginTop: spacing.sm }]}>
                <Ionicons name="checkmark-circle" size={18} color={colors.accent.success} />
                <Text
                  style={[
                    typography.caption,
                    { color: colors.accent.success, marginLeft: spacing.xs },
                  ]}
                >
                  Side view captured
                </Text>
              </View>
              <Button
                title="Retake Photo"
                variant="outline"
                onPress={handleCaptureSide}
                fullWidth
                style={{ marginTop: spacing.md }}
                leftIcon={<Ionicons name="refresh" size={18} color={colors.accent.primary} />}
              />
              <Button
                title="Analyze Both Views"
                onPress={handleAnalyzeWithBoth}
                fullWidth
                size="lg"
                style={{ marginTop: spacing.sm }}
                leftIcon={<Ionicons name="sparkles" size={20} color={colors.text.inverse} />}
              />
            </View>
          ) : (
            <>
              <Pressable
                onPress={handleCaptureSide}
                style={[
                  styles.cameraPlaceholder,
                  {
                    borderColor: colors.border.default,
                    borderRadius: borderRadius.lg,
                    backgroundColor: colors.background.secondary,
                    marginTop: spacing.xl,
                  },
                ]}
                accessibilityLabel="Take side view photo"
                accessibilityRole="button"
              >
                <Ionicons name="camera" size={48} color={colors.text.muted} />
                <Text
                  style={[
                    typography.body,
                    { color: colors.text.muted, marginTop: spacing.md },
                  ]}
                >
                  Tap to take or upload photo
                </Text>
              </Pressable>
              <Button
                title="Skip — Analyze Front View Only"
                variant="ghost"
                onPress={handleSkipSide}
                fullWidth
                style={{ marginTop: spacing.md }}
              />
            </>
          )}
        </ScrollView>
      </View>
    );
  }

  // --------------------------------------------------------------------------
  // Step 4 — Analyzing
  // --------------------------------------------------------------------------

  if (step === 'analyzing') {
    return (
      <View style={[styles.screen, styles.centered, { backgroundColor: colors.background.primary, overflow: 'hidden' }]}>
        <EmptyStateBackground query="athlete training dark gym" opacity={0.15} />
        <StatusBar style="light" backgroundColor="#0C0A15" />
        <ActivityIndicator size="large" color={colors.accent.primary} />
        <Text
          style={[
            typography.h3,
            { color: colors.text.primary, marginTop: spacing.xl, textAlign: 'center' },
          ]}
        >
          Analyzing Your Alignment...
        </Text>
        <Text
          style={[
            typography.body,
            { color: colors.text.secondary, marginTop: spacing.sm, textAlign: 'center' },
          ]}
        >
          Our AI is reviewing your posture and preparing personalized recommendations.
        </Text>
      </View>
    );
  }

  // --------------------------------------------------------------------------
  // Step 5 — Results
  // --------------------------------------------------------------------------

  if (step === 'results' && result) {
    const ringColor = scoreColor(result.overall_score, colors);

    return (
      <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
        <ScreenBackground />
        <AmbientBackground />
        <StatusBar style="light" backgroundColor="#0C0A15" />
        <ScrollView
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 90 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Score */}
          <View style={[styles.headerBlock, { marginBottom: spacing.xl }]}>
            <ProgressRing
              progress={result.overall_score / 100}
              size={160}
              strokeWidth={14}
              color={ringColor}
            >
              <Text style={[typography.hero, { color: colors.text.primary, fontSize: 48 }]}>
                {result.overall_score}
              </Text>
              <Text style={[typography.caption, { color: colors.text.muted }]}>/ 100</Text>
            </ProgressRing>
            <Text
              style={[
                typography.h2,
                { color: ringColor, marginTop: spacing.md },
              ]}
            >
              {scoreLabel(result.overall_score)}
            </Text>
            <Text
              style={[
                typography.body,
                { color: colors.text.secondary, marginTop: spacing.xs, textAlign: 'center' },
              ]}
            >
              Posture Score
            </Text>
          </View>

          {/* Issues */}
          {result.issues.length > 0 && (
            <View style={{ marginBottom: spacing.lg }}>
              <Text
                style={[
                  typography.h3,
                  { color: colors.text.primary, marginBottom: spacing.md },
                ]}
              >
                Issues Found ({result.issues.length})
              </Text>
              {result.issues.map((issue, idx) => {
                const severity = classifyIssue(issue);
                return (
                  <Card key={idx} style={{ marginBottom: spacing.sm }}>
                    <View style={styles.issueRow}>
                      <Ionicons
                        name="alert-circle"
                        size={20}
                        color={
                          severity === 'danger'
                            ? colors.accent.danger
                            : severity === 'warning'
                            ? colors.accent.warning
                            : colors.accent.info
                        }
                      />
                      <Text
                        style={[
                          typography.body,
                          { color: colors.text.primary, flex: 1, marginLeft: spacing.sm },
                        ]}
                      >
                        {issue}
                      </Text>
                      <Badge
                        label={severity === 'danger' ? 'Critical' : severity === 'warning' ? 'Moderate' : 'Minor'}
                        variant={severity === 'danger' ? 'danger' : severity === 'warning' ? 'warning' : 'info'}
                        size="sm"
                      />
                    </View>
                  </Card>
                );
              })}
            </View>
          )}

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <Card style={{ marginBottom: spacing.lg }}>
              <View style={[styles.rowCenter, { marginBottom: spacing.md }]}>
                <Ionicons name="bulb-outline" size={20} color={colors.accent.gold} />
                <Text
                  style={[
                    typography.h3,
                    { color: colors.text.primary, marginLeft: spacing.sm },
                  ]}
                >
                  Recommendations
                </Text>
              </View>
              {result.recommendations.map((rec, idx) => (
                <View
                  key={idx}
                  style={[styles.instructionRow, { marginBottom: spacing.sm }]}
                >
                  <Ionicons name="checkmark-circle" size={16} color={colors.accent.success} />
                  <Text
                    style={[
                      typography.body,
                      { color: colors.text.secondary, flex: 1, marginLeft: spacing.sm },
                    ]}
                  >
                    {rec}
                  </Text>
                </View>
              ))}
            </Card>
          )}

          {/* Prescribed Exercises */}
          {result.exercises_prescribed.length > 0 && (
            <View style={{ marginBottom: spacing.lg }}>
              <Text
                style={[
                  typography.h3,
                  { color: colors.text.primary, marginBottom: spacing.md },
                ]}
              >
                Corrective Exercises ({result.exercises_prescribed.length})
              </Text>
              {result.exercises_prescribed.map((exercise, idx) => (
                <Card
                  key={idx}
                  style={{ marginBottom: spacing.sm }}
                  onPress={() =>
                    setExpandedExercise(expandedExercise === idx ? null : idx)
                  }
                >
                  <View style={styles.exerciseHeader}>
                    <View
                      style={[
                        styles.exerciseIconWrap,
                        { backgroundColor: `${colors.accent.primary}15`, borderRadius: 20 },
                      ]}
                    >
                      <Ionicons name="fitness" size={20} color={colors.accent.primary} />
                    </View>
                    <View style={{ flex: 1, marginLeft: spacing.md }}>
                      <Text style={[typography.bodyBold, { color: colors.text.primary }]}>
                        {exercise.name}
                      </Text>
                      <Text style={[typography.caption, { color: colors.text.muted }]}>
                        {exercise.sets} sets × {exercise.reps} reps · {exercise.frequency}
                      </Text>
                    </View>
                    <Ionicons
                      name={expandedExercise === idx ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={colors.text.muted}
                    />
                  </View>
                  {expandedExercise === idx && (
                    <View
                      style={[
                        styles.exerciseCue,
                        {
                          backgroundColor: colors.background.tertiary,
                          borderRadius: borderRadius.md,
                          marginTop: spacing.md,
                          padding: spacing.md,
                        },
                      ]}
                    >
                      <View style={styles.rowCenter}>
                        <Ionicons name="information-circle-outline" size={16} color={colors.accent.info} />
                        <Text
                          style={[
                            typography.captionBold,
                            { color: colors.accent.info, marginLeft: spacing.xs },
                          ]}
                        >
                          HOW TO
                        </Text>
                      </View>
                      <Text
                        style={[
                          typography.body,
                          { color: colors.text.secondary, marginTop: spacing.xs },
                        ]}
                      >
                        {exercise.video_cue}
                      </Text>
                    </View>
                  )}
                </Card>
              ))}
            </View>
          )}

          {/* Timeline */}
          {result.improvement_timeline ? (
            <Card variant="ai" style={{ marginBottom: spacing.lg }}>
              <View style={styles.rowCenter}>
                <Ionicons name="time-outline" size={18} color={colors.accent.cyan} />
                <Text
                  style={[
                    typography.captionBold,
                    { color: colors.accent.cyan, marginLeft: spacing.sm },
                  ]}
                >
                  IMPROVEMENT TIMELINE
                </Text>
              </View>
              <Text
                style={[
                  typography.body,
                  { color: colors.text.secondary, marginTop: spacing.sm },
                ]}
              >
                {result.improvement_timeline}
              </Text>
            </Card>
          ) : null}

          <View style={{ gap: spacing.sm }}>
            <Button
              title="Analyze Again"
              onPress={handleReset}
              fullWidth
              leftIcon={<Ionicons name="refresh" size={20} color={colors.text.inverse} />}
            />
            <Button
              title="Back to Fitness"
              variant="outline"
              onPress={() => router.back()}
              fullWidth
            />
          </View>
        </ScrollView>
      </View>
    );
  }

  return null;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  headerBlock: {
    alignItems: 'center',
    marginTop: 24,
  },
  iconCircle: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  stepDot: {
    width: 24,
    height: 6,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cameraPlaceholder: {
    height: 240,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPreview: {
    width: '100%',
    height: 300,
  },
  issueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseIconWrap: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseCue: {},
});
