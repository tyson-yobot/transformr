// =============================================================================
// TRANSFORMR -- AI Form Check Screen
// =============================================================================

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ScreenHelpButton } from '@components/ui/ScreenHelpButton';
import { SCREEN_HELP } from '../../../constants/screenHelp';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Input } from '@components/ui/Input';
import { ProgressRing } from '@components/ui/ProgressRing';
import { hapticLight, hapticSuccess } from '@utils/haptics';
import { AIInsightCard } from '@components/cards/AIInsightCard';
import { analyzeExerciseForm } from '@services/ai/formCheck';
import { supabase } from '@services/supabase';
import { useFeatureGate } from '@hooks/useFeatureGate';

type FormCheckPhase = 'setup' | 'countdown' | 'recording' | 'review' | 'analyzing' | 'results';

interface FormAnalysisResult {
  score: number;
  issues: { title: string; description: string; severity: 'low' | 'medium' | 'high' }[];
  corrections: string[];
  injuryRisk: 'low' | 'moderate' | 'high';
  overallFeedback: string;
}

export default function FormCheckScreen() {
  const { colors, typography, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const formCheckGate = useFeatureGate('ai_form_check');

  const [phase, setPhase] = useState<FormCheckPhase>('setup');
  const [countdown, setCountdown] = useState(3);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] = useState('Squat');
  const [analysisResult, setAnalysisResult] = useState<FormAnalysisResult | null>(null);

  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingPromiseRef = useRef<Promise<{ uri: string } | undefined> | null>(null);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => <ScreenHelpButton content={SCREEN_HELP.formCheckScreen} />,
    });
  }, [navigation]);

  const handleStartRecording = useCallback(async () => {
    setPhase('recording');
    setRecordingDuration(0);
    await hapticSuccess();

    recordingRef.current = setInterval(() => {
      setRecordingDuration((prev) => prev + 1);
    }, 1000);

    recordingPromiseRef.current = cameraRef.current?.recordAsync?.({ maxDuration: 30 }) ?? null;
  }, []);

  const handleStartCountdown = useCallback(async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Camera Required', 'Camera permission is needed for form checks.');
        return;
      }
    }

    setPhase('countdown');
    setCountdown(3);
    await hapticLight();

    let count = 3;
    countdownRef.current = setInterval(() => {
      count--;
      setCountdown(count);
      if (count <= 0) {
        if (countdownRef.current) clearInterval(countdownRef.current);
        handleStartRecording();
      }
    }, 1000);
  }, [permission, requestPermission, handleStartRecording]);

  const handleStopRecording = useCallback(async () => {
    if (recordingRef.current) clearInterval(recordingRef.current);
    setPhase('review');
    await hapticLight();

    // stopRecording() triggers the recordAsync() promise to resolve
    cameraRef.current?.stopRecording?.();
    if (recordingPromiseRef.current) {
      try {
        const video = await recordingPromiseRef.current;
        if (video?.uri) setVideoUri(video.uri);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Recording could not be saved.';
        Alert.alert('Recording Error', msg);
      } finally {
        recordingPromiseRef.current = null;
      }
    }
  }, []);

  const handleSubmitForAnalysis = useCallback(async () => {
    if (!videoUri) return;
    if (!formCheckGate.isAvailable) { setPhase('review'); return; }
    setPhase('analyzing');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const aiResult = await analyzeExerciseForm(videoUri, user.id, selectedExercise);
      const severityMap: Record<string, 'low' | 'medium' | 'high'> = {
        minor: 'low',
        moderate: 'medium',
        major: 'high',
      };
      const mapped: FormAnalysisResult = {
        score: aiResult.overall_score ?? 75,
        issues: (aiResult.form_issues ?? []).map((issue) => ({
          title: issue.body_part ?? 'Issue',
          description: issue.issue ?? '',
          severity: severityMap[issue.severity] ?? 'medium',
        })),
        corrections: (aiResult.form_issues ?? []).map((i) => i.correction).filter(Boolean),
        injuryRisk: aiResult.injury_risk === 'medium' ? 'moderate' : (aiResult.injury_risk ?? 'low'),
        overallFeedback: (aiResult.positive_notes ?? []).join(' '),
      };
      setAnalysisResult(mapped);
      setPhase('results');
      await hapticSuccess();
    } catch {
      Alert.alert('Error', 'Failed to analyze form. Please try again.');
      setPhase('review');
    }
  }, [videoUri, selectedExercise, formCheckGate.isAvailable]);

  const handleReset = useCallback(() => {
    setPhase('setup');
    setVideoUri(null);
    setAnalysisResult(null);
    setCountdown(3);
    setRecordingDuration(0);
  }, []);

  const getInjuryRiskColor = (risk: string): string => {
    switch (risk) {
      case 'low':
        return colors.accent.success;
      case 'moderate':
        return colors.accent.warning;
      case 'high':
        return colors.accent.danger;
      default:
        return colors.text.muted;
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'low':
        return colors.accent.info;
      case 'medium':
        return colors.accent.warning;
      case 'high':
        return colors.accent.danger;
      default:
        return colors.text.muted;
    }
  };

  // Setup phase
  if (phase === 'setup') {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
        <StatusBar style="light" backgroundColor="#0C0A15" />
        <ScrollView
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 90 }}
          showsVerticalScrollIndicator={false}
        >
          <AIInsightCard screenKey="fitness/form-check" style={{ marginBottom: spacing.md }} />

          <View style={styles.headerBlock}>
            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: `${colors.accent.primary}15`,
                  borderRadius: 40,
                  width: 80,
                  height: 80,
                },
              ]}
            >
              <Ionicons name="videocam" size={40} color={colors.accent.primary} />
            </View>
            <Text
              style={[
                typography.h1,
                { color: colors.text.primary, marginTop: spacing.lg, textAlign: 'center' },
              ]}
            >
              AI Form Check
            </Text>
            <Text
              style={[
                typography.body,
                { color: colors.text.secondary, marginTop: spacing.sm, textAlign: 'center' },
              ]}
            >
              Record your exercise form and get AI-powered feedback on technique, safety, and
              corrections.
            </Text>
          </View>

          <Card style={{ marginTop: spacing.xl }}>
            <Text style={[typography.h3, { color: colors.text.primary, marginBottom: spacing.md }]}>
              Setup Instructions
            </Text>
            {[
              'Place your phone on a stable surface or ask someone to film you',
              'Position the camera at a 45-degree angle for best analysis',
              'Ensure full body is visible in the frame',
              'Good lighting helps the AI analyze your form better',
              'Perform 3-5 reps of the exercise',
            ].map((instruction, idx) => (
              <View key={idx} style={[styles.instructionRow, { marginBottom: spacing.sm }]}>
                <View
                  style={[
                    styles.stepNumber,
                    {
                      backgroundColor: colors.accent.primary,
                      borderRadius: 12,
                      width: 24,
                      height: 24,
                    },
                  ]}
                >
                  <Text style={[typography.tiny, { color: colors.text.inverse, fontWeight: '700' }]}>
                    {idx + 1}
                  </Text>
                </View>
                <Text
                  style={[
                    typography.body,
                    { color: colors.text.secondary, flex: 1, marginLeft: spacing.md },
                  ]}
                >
                  {instruction}
                </Text>
              </View>
            ))}
          </Card>

          <Input
            label="Exercise Name"
            value={selectedExercise}
            onChangeText={setSelectedExercise}
            placeholder="e.g. Squat, Deadlift, Bench Press"
            containerStyle={{ marginTop: spacing.lg }}
          />

          <Button
            title="Start Recording"
            onPress={handleStartCountdown}
            fullWidth
            size="lg"
            style={{ marginTop: spacing.xl }}
            leftIcon={<Ionicons name="videocam" size={22} color={colors.text.inverse} />}
          />
        </ScrollView>
      </View>
    );
  }

  // Countdown phase
  if (phase === 'countdown') {
    return (
      <View style={[styles.screen, styles.centered, { backgroundColor: colors.background.primary }]}>
        <Text style={[typography.hero, { color: colors.text.primary, fontSize: 80, fontVariant: ['tabular-nums'] }]}>
          {countdown}
        </Text>
        <Text style={[typography.body, { color: colors.text.secondary, marginTop: spacing.md }]}>
          Get ready...
        </Text>
      </View>
    );
  }

  // Recording phase
  if (phase === 'recording') {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
        {permission?.granted && (
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing="back"
          />
        )}
        <View style={styles.recordingOverlay}>
          <View style={styles.recordingTopBar}>
            <View style={[styles.recordingIndicator, { borderRadius: 4 }]}>
              <View
                style={[
                  styles.recordingDot,
                  { backgroundColor: colors.accent.danger, borderRadius: 5 },
                ]}
              />
              <Text style={[typography.monoBody, { color: colors.text.inverse, fontWeight: '700', marginLeft: spacing.sm }]}>
                {Math.floor(recordingDuration / 60)}:
                {(recordingDuration % 60).toString().padStart(2, '0')}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={handleStopRecording}
            accessibilityLabel="Stop recording"
            accessibilityRole="button"
            style={[
              styles.stopButton,
              { borderColor: colors.text.inverse },
            ]}
          >
            <View
              style={[
                styles.stopButtonInner,
                {
                  backgroundColor: colors.accent.danger,
                  borderRadius: 8,
                },
              ]}
            />
          </Pressable>
        </View>
      </View>
    );
  }

  // Review phase
  if (phase === 'review') {
    return (
      <View style={[styles.screen, styles.centered, { backgroundColor: colors.background.primary }]}>
        <Ionicons name="checkmark-circle" size={64} color={colors.accent.success} />
        <Text style={[typography.h2, { color: colors.text.primary, marginTop: spacing.lg }]}>
          Video Recorded!
        </Text>
        <Text
          style={[
            typography.body,
            { color: colors.text.secondary, marginTop: spacing.sm, textAlign: 'center' },
          ]}
        >
          <Text style={typography.monoBody}>{recordingDuration}</Text> seconds captured.{'\n'}Submit for AI analysis?
        </Text>
        <View style={{ marginTop: spacing.xl, gap: spacing.sm, width: '80%' }}>
          <Button
            title="Submit for Analysis"
            onPress={handleSubmitForAnalysis}
            fullWidth
            size="lg"
            leftIcon={<Ionicons name="sparkles" size={20} color={colors.text.inverse} />}
          />
          <Button
            title="Re-record"
            variant="outline"
            onPress={handleReset}
            fullWidth
          />
        </View>
      </View>
    );
  }

  // Analyzing phase
  if (phase === 'analyzing') {
    return (
      <View style={[styles.screen, styles.centered, { backgroundColor: colors.background.primary }]}>
        <ProgressRing progress={-1} size={80} strokeWidth={8} color={colors.accent.primary} />
        <Text style={[typography.h3, { color: colors.text.primary, marginTop: spacing.lg }]}>
          Analyzing Your Form...
        </Text>
        <Text style={[typography.caption, { color: colors.text.muted, marginTop: spacing.sm }]}>
          Our AI is reviewing your technique
        </Text>
      </View>
    );
  }

  // Results phase
  if (phase === 'results' && analysisResult) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
        <StatusBar style="light" backgroundColor="#0C0A15" />
        <ScrollView
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 90 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Score */}
          <View style={[styles.headerBlock, { marginBottom: spacing.xl }]}>
            <ProgressRing
              progress={analysisResult.score / 100}
              size={140}
              strokeWidth={12}
              color={
                analysisResult.score >= 80
                  ? colors.accent.success
                  : analysisResult.score >= 60
                    ? colors.accent.warning
                    : colors.accent.danger
              }
            >
              <Text style={[typography.hero, { color: colors.text.primary }]}>
                {analysisResult.score}
              </Text>
              <Text style={[typography.tiny, { color: colors.text.muted }]}>/ 100</Text>
            </ProgressRing>
            <Text style={[typography.h2, { color: colors.text.primary, marginTop: spacing.lg }]}>
              Form Score
            </Text>
          </View>

          {/* Injury Risk Indicator */}
          <Card
            style={{
              marginBottom: spacing.lg,
              borderLeftWidth: 3,
              borderLeftColor: getInjuryRiskColor(analysisResult.injuryRisk),
            }}
          >
            <View style={styles.riskRow}>
              <Ionicons
                name="shield-outline"
                size={22}
                color={getInjuryRiskColor(analysisResult.injuryRisk)}
              />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={[typography.captionBold, { color: colors.text.muted }]}>
                  Injury Risk
                </Text>
                <Text
                  style={[
                    typography.h3,
                    { color: getInjuryRiskColor(analysisResult.injuryRisk) },
                  ]}
                >
                  {analysisResult.injuryRisk.toUpperCase()}
                </Text>
              </View>
            </View>
          </Card>

          {/* Issues Found */}
          {analysisResult.issues.length > 0 && (
            <View style={{ marginBottom: spacing.lg }}>
              <Text
                style={[
                  typography.h3,
                  { color: colors.text.primary, marginBottom: spacing.md },
                ]}
              >
                Issues Found ({analysisResult.issues.length})
              </Text>
              {analysisResult.issues.map((issue, idx) => (
                <Card key={idx} style={{ marginBottom: spacing.sm }}>
                  <View style={styles.issueHeader}>
                    <Ionicons
                      name="alert-circle"
                      size={20}
                      color={getSeverityColor(issue.severity)}
                    />
                    <Text
                      style={[
                        typography.bodyBold,
                        { color: colors.text.primary, flex: 1, marginLeft: spacing.sm },
                      ]}
                    >
                      {issue.title}
                    </Text>
                    <Badge
                      label={issue.severity}
                      variant={
                        issue.severity === 'high'
                          ? 'danger'
                          : issue.severity === 'medium'
                            ? 'warning'
                            : 'info'
                      }
                      size="sm"
                    />
                  </View>
                  <Text
                    style={[
                      typography.body,
                      { color: colors.text.secondary, marginTop: spacing.sm },
                    ]}
                  >
                    {issue.description}
                  </Text>
                </Card>
              ))}
            </View>
          )}

          {/* Corrections */}
          {analysisResult.corrections.length > 0 && (
            <Card style={{ marginBottom: spacing.lg }}>
              <View style={styles.sectionHeader}>
                <Ionicons name="bulb-outline" size={20} color={colors.accent.success} />
                <Text
                  style={[
                    typography.h3,
                    { color: colors.text.primary, marginLeft: spacing.sm },
                  ]}
                >
                  Corrections
                </Text>
              </View>
              {analysisResult.corrections.map((correction, idx) => (
                <View
                  key={idx}
                  style={[styles.correctionRow, { marginTop: spacing.sm }]}
                >
                  <Ionicons name="checkmark-circle" size={16} color={colors.accent.success} />
                  <Text
                    style={[
                      typography.body,
                      { color: colors.text.secondary, flex: 1, marginLeft: spacing.sm },
                    ]}
                  >
                    {correction}
                  </Text>
                </View>
              ))}
            </Card>
          )}

          {/* Overall Feedback */}
          <Card
            style={{
              marginBottom: spacing.lg,
              borderLeftWidth: 3,
              borderLeftColor: colors.accent.secondary,
            }}
          >
            <View style={styles.sectionHeader}>
              <Ionicons name="sparkles" size={18} color={colors.accent.secondary} />
              <Text
                style={[
                  typography.captionBold,
                  { color: colors.accent.secondary, marginLeft: spacing.sm },
                ]}
              >
                AI Summary
              </Text>
            </View>
            <Text
              style={[
                typography.body,
                { color: colors.text.secondary, marginTop: spacing.sm, lineHeight: 24 },
              ]}
            >
              {analysisResult.overallFeedback}
            </Text>
          </Card>

          <View style={{ gap: spacing.sm }}>
            <Button
              title="Check Another Exercise"
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBlock: {
    alignItems: 'center',
    marginTop: 24,
  },
  iconCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepNumber: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 60,
  },
  recordingTopBar: {
    alignItems: 'center',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  recordingDot: {
    width: 10,
    height: 10,
  },
  stopButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopButtonInner: {
    width: 32,
    height: 32,
  },
  riskRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  issueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  correctionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
});
