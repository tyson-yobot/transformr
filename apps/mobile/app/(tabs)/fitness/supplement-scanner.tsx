// =============================================================================
// TRANSFORMR -- AI Supplement Scanner Screen
// Camera/upload → label preview → AI analysis → results with ingredient
// breakdown, concerns, overall assessment, and stack save option.
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
import { hapticLight, hapticMedium, hapticSuccess } from '@utils/haptics';
import { supabase } from '@services/supabase';
import { useFeatureGate } from '@hooks/useFeatureGate';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ScannerStep = 'capture' | 'preview' | 'analyzing' | 'results';

type EvidenceLevel = 'strong' | 'moderate' | 'weak' | 'unclear';

interface KeyIngredient {
  name: string;
  amount: string;
  purpose: string;
  evidence: EvidenceLevel;
  notes: string;
}

interface ScanResult {
  product_name: string;
  serving_size: string;
  key_ingredients: KeyIngredient[];
  ingredients_of_concern: string[];
  overall_assessment: string;
  interactions: string[];
  compliance_note: string;
  saved_log_id?: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function evidenceBadgeVariant(
  evidence: EvidenceLevel,
): 'success' | 'info' | 'warning' | 'danger' {
  switch (evidence) {
    case 'strong':
      return 'success';
    case 'moderate':
      return 'info';
    case 'weak':
      return 'warning';
    case 'unclear':
    default:
      return 'danger';
  }
}

function evidenceLabel(evidence: EvidenceLevel): string {
  switch (evidence) {
    case 'strong':
      return 'Strong Evidence';
    case 'moderate':
      return 'Moderate Evidence';
    case 'weak':
      return 'Weak Evidence';
    case 'unclear':
    default:
      return 'Unclear Evidence';
  }
}

async function pickOrCaptureImage(): Promise<{ base64: string; uri: string } | null> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();

  if (status !== 'granted') {
    const libStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (libStatus.status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Camera or photo library access is needed to scan supplement labels.',
      );
      return null;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.8,
      allowsEditing: true,
      aspect: [3, 4],
    });
    if (result.canceled || !result.assets[0]?.base64 || !result.assets[0]?.uri) return null;
    return { base64: result.assets[0].base64, uri: result.assets[0].uri };
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    base64: true,
    quality: 0.8,
    allowsEditing: true,
    aspect: [3, 4],
  });
  if (result.canceled || !result.assets[0]?.base64 || !result.assets[0]?.uri) return null;
  return { base64: result.assets[0].base64, uri: result.assets[0].uri };
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function SupplementScannerScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const supplementScannerGate = useFeatureGate('ai_supplement_scanner');

  const [step, setStep] = useState<ScannerStep>('capture');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [expandedIngredient, setExpandedIngredient] = useState<number | null>(null);
  const [savingToStack, setSavingToStack] = useState(false);
  const [savedToStack, setSavedToStack] = useState(false);

  const handleCapture = useCallback(async () => {
    await hapticLight();
    const captured = await pickOrCaptureImage();
    if (!captured) return;
    setImageBase64(captured.base64);
    setImageUri(captured.uri);
    setStep('preview');
    await hapticSuccess();
  }, []);

  const handleRetake = useCallback(async () => {
    await hapticLight();
    setImageBase64(null);
    setImageUri(null);
    setStep('capture');
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!imageBase64) return;
    if (!supplementScannerGate.isAvailable) { setStep('preview'); return; }
    await hapticMedium();
    setStep('analyzing');

    try {
      const { data, error } = await supabase.functions.invoke('ai-supplement-scanner', {
        body: { image_base64: imageBase64 },
      });

      if (error) throw new Error(error.message ?? 'Analysis failed');

      setResult(data as ScanResult);
      setStep('results');
      await hapticSuccess();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Analysis failed. Please try again.';
      Alert.alert('Scan Error', msg);
      setStep('preview');
    }
  }, [imageBase64, supplementScannerGate.isAvailable]);

  const handleAddToStack = useCallback(async () => {
    if (!imageBase64 || savingToStack || savedToStack) return;
    await hapticMedium();
    setSavingToStack(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-supplement-scanner', {
        body: { image_base64: imageBase64, save_to_stack: true },
      });

      if (error) throw new Error(error.message ?? 'Failed to save');

      const saved = data as ScanResult;
      if (saved.saved_log_id) {
        setSavedToStack(true);
        await hapticSuccess();
        Alert.alert('Added to Stack', `${result?.product_name ?? 'Supplement'} has been added to your supplement log.`);
      } else {
        Alert.alert('Note', 'Supplement was not saved — it may already be in your stack or could not be identified.');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to add to stack.';
      Alert.alert('Error', msg);
    } finally {
      setSavingToStack(false);
    }
  }, [imageBase64, savingToStack, savedToStack, result?.product_name]);

  const handleReset = useCallback(async () => {
    await hapticLight();
    setStep('capture');
    setImageBase64(null);
    setImageUri(null);
    setResult(null);
    setExpandedIngredient(null);
    setSavedToStack(false);
  }, []);

  // --------------------------------------------------------------------------
  // Step 1 — Capture
  // --------------------------------------------------------------------------

  if (step === 'capture') {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
        <StatusBar style="light" backgroundColor="#0C0A15" />
        <ScrollView
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 90 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerBlock}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: `${colors.accent.cyan}15`, borderRadius: 40 },
              ]}
            >
              <Ionicons name="scan" size={40} color={colors.accent.cyan} />
            </View>
            <Text
              style={[
                typography.h1,
                { color: colors.text.primary, marginTop: spacing.lg, textAlign: 'center' },
              ]}
            >
              Supplement Scanner
            </Text>
            <Text
              style={[
                typography.body,
                { color: colors.text.secondary, marginTop: spacing.sm, textAlign: 'center' },
              ]}
            >
              Point your camera at a supplement label to get an AI-powered ingredient analysis.
            </Text>
          </View>

          <Pressable
            onPress={handleCapture}
            style={[
              styles.cameraLaunchArea,
              {
                borderColor: colors.accent.cyan,
                borderRadius: borderRadius.xl,
                backgroundColor: `${colors.accent.cyan}08`,
                marginTop: spacing.xl,
              },
            ]}
            accessibilityLabel="Scan supplement label"
            accessibilityRole="button"
          >
            <View
              style={[
                styles.cameraIconRing,
                {
                  backgroundColor: `${colors.accent.cyan}20`,
                  borderColor: `${colors.accent.cyan}40`,
                  borderRadius: 50,
                },
              ]}
            >
              <Ionicons name="camera" size={52} color={colors.accent.cyan} />
            </View>
            <Text
              style={[
                typography.h3,
                { color: colors.text.primary, marginTop: spacing.lg },
              ]}
            >
              Scan Label
            </Text>
            <Text
              style={[
                typography.body,
                { color: colors.text.muted, marginTop: spacing.xs },
              ]}
            >
              Tap to take a photo or choose from gallery
            </Text>
          </Pressable>

          <Card style={{ marginTop: spacing.xl }} variant="ai">
            <View style={styles.rowCenter}>
              <Ionicons name="sparkles" size={18} color={colors.accent.cyan} />
              <Text
                style={[
                  typography.captionBold,
                  { color: colors.accent.cyan, marginLeft: spacing.sm },
                ]}
              >
                AI ANALYSIS INCLUDES
              </Text>
            </View>
            {[
              'Every ingredient with purpose and evidence rating',
              'Ingredients of concern flagged in red',
              'Interaction risks and sensitivities',
              'Overall product quality assessment',
            ].map((item, idx) => (
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
                  {item}
                </Text>
              </View>
            ))}
          </Card>
        </ScrollView>
      </View>
    );
  }

  // --------------------------------------------------------------------------
  // Step 2 — Preview
  // --------------------------------------------------------------------------

  if (step === 'preview') {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
        <StatusBar style="light" backgroundColor="#0C0A15" />
        <ScrollView
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 90 }}
          showsVerticalScrollIndicator={false}
        >
          <Text
            style={[
              typography.h2,
              { color: colors.text.primary, textAlign: 'center', marginTop: spacing.md },
            ]}
          >
            Label Preview
          </Text>
          <Text
            style={[
              typography.body,
              { color: colors.text.secondary, textAlign: 'center', marginTop: spacing.sm },
            ]}
          >
            Make sure the label text is clearly visible before analyzing.
          </Text>

          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={[
                styles.previewImage,
                {
                  borderRadius: borderRadius.lg,
                  borderColor: colors.border.default,
                  borderWidth: 1,
                  marginTop: spacing.xl,
                },
              ]}
              resizeMode="contain"
            />
          ) : null}

          <Button
            title="Analyze Label"
            onPress={handleAnalyze}
            fullWidth
            size="lg"
            style={{ marginTop: spacing.xl }}
            leftIcon={<Ionicons name="sparkles" size={20} color={colors.text.inverse} />}
          />
          <Button
            title="Retake Photo"
            variant="outline"
            onPress={handleRetake}
            fullWidth
            style={{ marginTop: spacing.sm }}
            leftIcon={<Ionicons name="camera" size={18} color={colors.accent.primary} />}
          />
        </ScrollView>
      </View>
    );
  }

  // --------------------------------------------------------------------------
  // Step 3 — Analyzing
  // --------------------------------------------------------------------------

  if (step === 'analyzing') {
    return (
      <View style={[styles.screen, styles.centered, { backgroundColor: colors.background.primary }]}>
        <StatusBar style="light" backgroundColor="#0C0A15" />
        <ActivityIndicator size="large" color={colors.accent.cyan} />
        <Text
          style={[
            typography.h3,
            { color: colors.text.primary, marginTop: spacing.xl, textAlign: 'center' },
          ]}
        >
          Scanning Ingredients...
        </Text>
        <Text
          style={[
            typography.body,
            { color: colors.text.secondary, marginTop: spacing.sm, textAlign: 'center' },
          ]}
        >
          Our AI is reading the label and assessing every ingredient for quality and evidence.
        </Text>
      </View>
    );
  }

  // --------------------------------------------------------------------------
  // Step 4 — Results
  // --------------------------------------------------------------------------

  if (step === 'results' && result) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
        <StatusBar style="light" backgroundColor="#0C0A15" />
        <ScrollView
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 90 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Product Header */}
          <Card variant="elevated" style={{ marginBottom: spacing.lg }}>
            <View style={styles.rowCenter}>
              <View
                style={[
                  styles.productIconWrap,
                  { backgroundColor: `${colors.accent.cyan}15`, borderRadius: 16 },
                ]}
              >
                <Ionicons name="flask" size={24} color={colors.accent.cyan} />
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={[typography.h3, { color: colors.text.primary }]}>
                  {result.product_name}
                </Text>
                <Text style={[typography.caption, { color: colors.text.muted }]}>
                  Serving size: {result.serving_size}
                </Text>
              </View>
              <Badge label="AI Scan" variant="info" size="sm" />
            </View>
          </Card>

          {/* Overall Assessment */}
          <Card variant="ai" style={{ marginBottom: spacing.lg }}>
            <View style={[styles.rowCenter, { marginBottom: spacing.sm }]}>
              <Ionicons name="sparkles" size={18} color={colors.accent.cyan} />
              <Text
                style={[
                  typography.captionBold,
                  { color: colors.accent.cyan, marginLeft: spacing.sm },
                ]}
              >
                AI ASSESSMENT
              </Text>
            </View>
            <Text style={[typography.body, { color: colors.text.secondary, lineHeight: 22 }]}>
              {result.overall_assessment}
            </Text>
          </Card>

          {/* Key Ingredients */}
          {result.key_ingredients.length > 0 && (
            <View style={{ marginBottom: spacing.lg }}>
              <Text
                style={[
                  typography.h3,
                  { color: colors.text.primary, marginBottom: spacing.md },
                ]}
              >
                Ingredients ({result.key_ingredients.length})
              </Text>
              {result.key_ingredients.map((ingredient, idx) => (
                <Card
                  key={idx}
                  style={{ marginBottom: spacing.sm }}
                  onPress={() =>
                    setExpandedIngredient(expandedIngredient === idx ? null : idx)
                  }
                >
                  <View style={styles.ingredientHeader}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.ingredientTitleRow}>
                        <Text
                          style={[
                            typography.bodyBold,
                            { color: colors.text.primary },
                          ]}
                        >
                          {ingredient.name}
                        </Text>
                        {ingredient.amount ? (
                          <Text
                            style={[
                              typography.caption,
                              { color: colors.text.muted, marginLeft: spacing.sm },
                            ]}
                          >
                            {ingredient.amount}
                          </Text>
                        ) : null}
                      </View>
                      <Text
                        style={[
                          typography.caption,
                          { color: colors.text.secondary, marginTop: 2 },
                        ]}
                        numberOfLines={1}
                      >
                        {ingredient.purpose}
                      </Text>
                    </View>
                    <View style={styles.ingredientRight}>
                      <Badge
                        label={evidenceLabel(ingredient.evidence)}
                        variant={evidenceBadgeVariant(ingredient.evidence)}
                        size="sm"
                      />
                      <Ionicons
                        name={expandedIngredient === idx ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color={colors.text.muted}
                        style={{ marginTop: spacing.xs }}
                      />
                    </View>
                  </View>

                  {expandedIngredient === idx && ingredient.notes ? (
                    <View
                      style={[
                        styles.ingredientNotes,
                        {
                          backgroundColor: colors.background.tertiary,
                          borderRadius: borderRadius.md,
                          marginTop: spacing.md,
                          padding: spacing.md,
                        },
                      ]}
                    >
                      <Text
                        style={[typography.body, { color: colors.text.secondary }]}
                      >
                        {ingredient.notes}
                      </Text>
                    </View>
                  ) : null}
                </Card>
              ))}
            </View>
          )}

          {/* Ingredients of Concern */}
          {result.ingredients_of_concern.length > 0 && (
            <Card
              variant="danger"
              style={{ marginBottom: spacing.lg, borderLeftWidth: 3, borderLeftColor: colors.accent.danger }}
            >
              <View style={[styles.rowCenter, { marginBottom: spacing.md }]}>
                <Ionicons name="warning" size={20} color={colors.accent.danger} />
                <Text
                  style={[
                    typography.h3,
                    { color: colors.accent.danger, marginLeft: spacing.sm },
                  ]}
                >
                  Ingredients of Concern
                </Text>
              </View>
              {result.ingredients_of_concern.map((concern, idx) => (
                <View
                  key={idx}
                  style={[styles.instructionRow, { marginBottom: spacing.sm }]}
                >
                  <Ionicons name="alert-circle" size={16} color={colors.accent.danger} />
                  <Text
                    style={[
                      typography.body,
                      { color: colors.text.secondary, flex: 1, marginLeft: spacing.sm },
                    ]}
                  >
                    {concern}
                  </Text>
                </View>
              ))}
            </Card>
          )}

          {/* Interactions */}
          {result.interactions.length > 0 && (
            <Card
              style={{
                marginBottom: spacing.lg,
                borderLeftWidth: 3,
                borderLeftColor: colors.accent.warning,
              }}
            >
              <View style={[styles.rowCenter, { marginBottom: spacing.md }]}>
                <Ionicons name="git-merge-outline" size={18} color={colors.accent.warning} />
                <Text
                  style={[
                    typography.h3,
                    { color: colors.text.primary, marginLeft: spacing.sm },
                  ]}
                >
                  Interaction Notes
                </Text>
              </View>
              {result.interactions.map((interaction, idx) => (
                <View
                  key={idx}
                  style={[styles.instructionRow, { marginBottom: spacing.sm }]}
                >
                  <Ionicons name="information-circle-outline" size={16} color={colors.accent.warning} />
                  <Text
                    style={[
                      typography.body,
                      { color: colors.text.secondary, flex: 1, marginLeft: spacing.sm },
                    ]}
                  >
                    {interaction}
                  </Text>
                </View>
              ))}
            </Card>
          )}

          {/* Compliance Note */}
          <Card variant="flat" style={{ marginBottom: spacing.lg }}>
            <View style={styles.rowCenter}>
              <Ionicons name="shield-checkmark-outline" size={16} color={colors.text.muted} />
              <Text
                style={[
                  typography.tiny,
                  { color: colors.text.muted, flex: 1, marginLeft: spacing.sm, lineHeight: 18 },
                ]}
              >
                {result.compliance_note}
              </Text>
            </View>
          </Card>

          {/* Action Buttons */}
          <View style={{ gap: spacing.sm }}>
            {!savedToStack ? (
              <Button
                title={savingToStack ? 'Adding to Stack...' : 'Add to My Stack'}
                onPress={handleAddToStack}
                fullWidth
                size="lg"
                loading={savingToStack}
                leftIcon={
                  !savingToStack ? (
                    <Ionicons name="add-circle-outline" size={20} color={colors.text.inverse} />
                  ) : undefined
                }
              />
            ) : (
              <Card variant="success">
                <View style={styles.rowCenter}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.accent.success} />
                  <Text
                    style={[
                      typography.bodyBold,
                      { color: colors.accent.success, marginLeft: spacing.sm },
                    ]}
                  >
                    Added to Your Stack
                  </Text>
                </View>
              </Card>
            )}
            <Button
              title="Scan Another Label"
              variant="outline"
              onPress={handleReset}
              fullWidth
              leftIcon={<Ionicons name="scan" size={18} color={colors.accent.primary} />}
            />
            <Button
              title="Back to Fitness"
              variant="ghost"
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
  cameraLaunchArea: {
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  cameraIconRing: {
    width: 100,
    height: 100,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 360,
  },
  productIconWrap: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ingredientHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  ingredientTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
  },
  ingredientRight: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  ingredientNotes: {},
});
