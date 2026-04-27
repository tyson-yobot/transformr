// =============================================================================
// TRANSFORMR -- Lab Work Detail Screen
// Shows the full AI interpretation -- overall summary, wellness score,
// highlights, concerns, lifestyle suggestions, follow-up questions, and the
// detected biomarkers grouped by category. Always includes the lab disclaimer.
// =============================================================================

import React, { useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@theme/index';
import { Icon3D } from '@components/ui/Icon3D';
import { StatusBar } from 'expo-status-bar';
import { Disclaimer } from '@components/ui/Disclaimer';
import { useLabsStore } from '@stores/labsStore';
import type {
  BiomarkerCategory,
  BiomarkerFlag,
  LabBiomarker,
} from '@app-types/ai';
import { hapticLight } from '@utils/haptics';
import { ScreenBackground } from '@components/ui/ScreenBackground';
import { AmbientBackground } from '@components/ui/AmbientBackground';

const CATEGORY_LABEL: Record<BiomarkerCategory, string> = {
  metabolic: 'Metabolic',
  lipid: 'Lipid Panel',
  hormone: 'Hormones',
  thyroid: 'Thyroid',
  vitamin: 'Vitamins',
  mineral: 'Minerals',
  inflammation: 'Inflammation',
  liver: 'Liver',
  kidney: 'Kidney',
  blood_count: 'Blood Count',
  other: 'Other',
};

const CATEGORY_ORDER: BiomarkerCategory[] = [
  'metabolic',
  'lipid',
  'hormone',
  'thyroid',
  'vitamin',
  'mineral',
  'inflammation',
  'liver',
  'kidney',
  'blood_count',
  'other',
];

const FLAG_LABEL: Record<BiomarkerFlag, string> = {
  low: 'Below range',
  normal: 'Within range',
  high: 'Above range',
  optimal: 'Optimal',
  suboptimal: 'Suboptimal',
  unknown: 'Unread',
};

function groupBiomarkers(
  biomarkers: LabBiomarker[],
): { category: BiomarkerCategory; items: LabBiomarker[] }[] {
  const map = new Map<BiomarkerCategory, LabBiomarker[]>();
  for (const marker of biomarkers) {
    const existing = map.get(marker.category) ?? [];
    existing.push(marker);
    map.set(marker.category, existing);
  }
  return CATEGORY_ORDER.filter((c) => map.has(c)).map((category) => ({
    category,
    items: map.get(category) ?? [],
  }));
}

export default function LabDetailScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ upload_id?: string }>();
  const uploadId = params.upload_id ?? null;

  const detail = useLabsStore((s) =>
    uploadId ? s.detailsByUploadId[uploadId] ?? null : null,
  );
  const isLoading = useLabsStore((s) => s.isLoadingDetail);
  const error = useLabsStore((s) => s.error);
  const loadUploadDetail = useLabsStore((s) => s.loadUploadDetail);
  const clearError = useLabsStore((s) => s.clearError);

  useEffect(() => {
    if (uploadId) {
      void loadUploadDetail(uploadId);
    }
  }, [loadUploadDetail, uploadId]);

  const flagColor = useCallback(
    (flag: BiomarkerFlag): string => {
      switch (flag) {
        case 'optimal':
        case 'normal':
          return colors.accent.success;
        case 'suboptimal':
          return colors.accent.warning;
        case 'low':
        case 'high':
          return colors.accent.danger;
        case 'unknown':
          return colors.text.muted;
      }
    },
    [colors],
  );

  const groupedBiomarkers = useMemo(
    () => groupBiomarkers(detail?.biomarkers ?? []),
    [detail?.biomarkers],
  );

  const renderHeader = () => (
    <View
      style={[
        styles.header,
        {
          paddingTop: insets.top + spacing.sm,
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.md,
          borderBottomColor: colors.border.subtle,
          backgroundColor: colors.background.secondary,
        },
      ]}
    >
      <Pressable
        onPress={() => {
          void hapticLight();
          router.back();
        }}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Back"
      >
        <Ionicons name="chevron-back" size={26} color={colors.text.primary} />
      </Pressable>
      <Text
        style={[typography.h3, { color: colors.text.primary, flex: 1, textAlign: 'center' }]}
        numberOfLines={1}
      >
        {detail?.upload.title ?? 'Lab Work'}
      </Text>
      <View style={{ width: 26 }} />
    </View>
  );

  if (!uploadId) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background.primary },
        ]}
      >
        {renderHeader()}
        <View style={styles.centeredMessage}>
          <Text style={[typography.body, { color: colors.text.secondary }]}>
            Missing upload id.
          </Text>
        </View>
      </View>
    );
  }

  if (isLoading && !detail) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background.primary },
        ]}
      >
        {renderHeader()}
        <View style={styles.centeredMessage}>
          <ActivityIndicator color={colors.accent.primary} />
        </View>
      </View>
    );
  }

  if (!detail) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background.primary },
        ]}
      >
        {renderHeader()}
        <View style={styles.centeredMessage}>
          <Icon3D
            name="document"
            size={48}
          />
          <Text
            style={[
              typography.body,
              {
                color: colors.text.secondary,
                marginTop: spacing.md,
                textAlign: 'center',
              },
            ]}
          >
            Lab work not found.
          </Text>
        </View>
      </View>
    );
  }

  const { upload, interpretation } = detail;
  const isStillProcessing =
    upload.status === 'pending' || upload.status === 'processing';
  const isFailed = upload.status === 'failed';

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background.primary },
      ]}
    >
      <ScreenBackground />
      <AmbientBackground />
      {renderHeader()}

      <ScrollView
        contentContainerStyle={{
          padding: spacing.lg,
          paddingBottom: insets.bottom + spacing.xxxl,
        }}
        showsVerticalScrollIndicator={false}
      >
        {error && (
          <Pressable
            onPress={clearError}
            style={[
              styles.errorBanner,
              {
                backgroundColor: colors.accent.dangerDim,
                borderColor: colors.accent.danger,
                borderRadius: borderRadius.md,
                padding: spacing.md,
                marginBottom: spacing.md,
              },
            ]}
          >
            <Icon3D
              name="warning"
              size={18}
            />
            <Text
              style={[
                typography.caption,
                { color: colors.accent.danger, marginLeft: spacing.sm, flex: 1 },
              ]}
              numberOfLines={3}
            >
              {error}
            </Text>
          </Pressable>
        )}

        <Animated.View entering={FadeInDown.duration(320)}>
          <View
            style={[
              styles.metaCard,
              {
                backgroundColor: colors.background.secondary,
                borderColor: colors.border.subtle,
                borderRadius: borderRadius.md,
                padding: spacing.md,
              },
            ]}
          >
            <View style={styles.metaRow}>
              <Text style={[typography.caption, { color: colors.text.muted }]}>
                Lab
              </Text>
              <Text
                style={[typography.captionBold, { color: colors.text.primary }]}
              >
                {upload.lab_name ?? 'Not specified'}
              </Text>
            </View>
            <View style={[styles.metaRow, { marginTop: spacing.xs }]}>
              <Text style={[typography.caption, { color: colors.text.muted }]}>
                Collected
              </Text>
              <Text
                style={[typography.captionBold, { color: colors.text.primary }]}
              >
                {upload.collected_at ?? 'Not specified'}
              </Text>
            </View>
            <View style={[styles.metaRow, { marginTop: spacing.xs }]}>
              <Text style={[typography.caption, { color: colors.text.muted }]}>
                Uploaded
              </Text>
              <Text
                style={[typography.captionBold, { color: colors.text.primary }]}
              >
                {new Date(upload.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </View>
          </View>
        </Animated.View>

        {isStillProcessing && (
          <View
            style={[
              styles.processingCard,
              {
                backgroundColor: colors.accent.cyanDim,
                borderColor: colors.accent.cyan,
                borderRadius: borderRadius.md,
                padding: spacing.md,
                marginTop: spacing.md,
              },
            ]}
          >
            <ActivityIndicator color={colors.accent.cyan} />
            <Text
              style={[
                typography.caption,
                { color: colors.accent.cyan, marginLeft: spacing.md, flex: 1 },
              ]}
            >
              Interpreting with TRANSFORMR AI. This usually takes 10-30 seconds.
            </Text>
          </View>
        )}

        {isFailed && (
          <View
            style={[
              styles.processingCard,
              {
                backgroundColor: colors.accent.dangerDim,
                borderColor: colors.accent.danger,
                borderRadius: borderRadius.md,
                padding: spacing.md,
                marginTop: spacing.md,
              },
            ]}
          >
            <Icon3D
              name="warning"
              size={20}
            />
            <Text
              style={[
                typography.caption,
                { color: colors.accent.danger, marginLeft: spacing.md, flex: 1 },
              ]}
            >
              Interpretation failed. Try re-uploading a clearer photo.
            </Text>
          </View>
        )}

        {interpretation && (
          <>
            <Animated.View
              entering={FadeInDown.delay(80).duration(320)}
              style={[
                styles.scoreCard,
                {
                  backgroundColor: colors.background.secondary,
                  borderColor: colors.border.subtle,
                  borderRadius: borderRadius.md,
                  padding: spacing.lg,
                  marginTop: spacing.lg,
                },
              ]}
            >
              <Text
                style={[
                  typography.caption,
                  {
                    color: colors.text.muted,
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                  },
                ]}
              >
                Wellness Range Score
              </Text>
              <Text
                style={[
                  typography.h1,
                  { color: colors.accent.cyan, marginTop: spacing.xs },
                ]}
              >
                {interpretation.wellness_score ?? '—'}
                <Text
                  style={[typography.body, { color: colors.text.muted }]}
                >
                  {' '}
                  / 100
                </Text>
              </Text>
              <Text
                style={[
                  typography.body,
                  { color: colors.text.primary, marginTop: spacing.md },
                ]}
              >
                {interpretation.overall_summary}
              </Text>
            </Animated.View>

            {interpretation.highlights.length > 0 && (
              <Section
                title="Highlights"
                icon="sparkles-outline"
                tint={colors.accent.success}
                items={interpretation.highlights}
              />
            )}

            {interpretation.concerns.length > 0 && (
              <Section
                title="Worth Discussing"
                icon="alert-circle-outline"
                tint={colors.accent.warning}
                items={interpretation.concerns}
              />
            )}

            {interpretation.lifestyle_suggestions.length > 0 && (
              <Section
                title="Lifestyle Suggestions"
                icon="leaf-outline"
                tint={colors.accent.primary}
                items={interpretation.lifestyle_suggestions}
              />
            )}

            {interpretation.follow_up_questions.length > 0 && (
              <Section
                title="Questions for Your Clinician"
                icon="help-circle-outline"
                tint={colors.accent.cyan}
                items={interpretation.follow_up_questions}
              />
            )}
          </>
        )}

        {groupedBiomarkers.length > 0 && (
          <Animated.View
            entering={FadeInDown.delay(120).duration(320)}
            style={{ marginTop: spacing.xl }}
          >
            <Text
              style={[
                typography.caption,
                {
                  color: colors.text.muted,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  marginBottom: spacing.sm,
                },
              ]}
            >
              Biomarkers
            </Text>
            {groupedBiomarkers.map((group) => (
              <View
                key={group.category}
                style={[
                  styles.biomarkerGroup,
                  {
                    backgroundColor: colors.background.secondary,
                    borderColor: colors.border.subtle,
                    borderRadius: borderRadius.md,
                    padding: spacing.md,
                    marginBottom: spacing.sm,
                  },
                ]}
              >
                <Text
                  style={[
                    typography.captionBold,
                    {
                      color: colors.text.secondary,
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                      marginBottom: spacing.sm,
                    },
                  ]}
                >
                  {CATEGORY_LABEL[group.category]}
                </Text>
                {group.items.map((marker, index) => (
                  <View
                    key={marker.id}
                    style={[
                      styles.biomarkerRow,
                      {
                        borderTopColor: colors.border.subtle,
                        borderTopWidth: index === 0 ? 0 : StyleSheet.hairlineWidth,
                        paddingVertical: spacing.sm,
                      },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
      <StatusBar style="light" backgroundColor="#0C0A15" />
                      <Text
                        style={[
                          typography.bodyBold,
                          { color: colors.text.primary },
                        ]}
                      >
                        {marker.name}
                      </Text>
                      {marker.trend_note && (
                        <Text
                          style={[
                            typography.tiny,
                            {
                              color: colors.text.muted,
                              marginTop: spacing.xs / 2,
                            },
                          ]}
                          numberOfLines={2}
                        >
                          {marker.trend_note}
                        </Text>
                      )}
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text
                        style={[
                          typography.bodyBold,
                          { color: colors.text.primary },
                        ]}
                      >
                        {marker.value !== null
                          ? `${marker.value}${marker.unit ? ` ${marker.unit}` : ''}`
                          : '—'}
                      </Text>
                      <Text
                        style={[
                          typography.tiny,
                          {
                            color: flagColor(marker.flag),
                            marginTop: spacing.xs / 2,
                            textTransform: 'uppercase',
                            letterSpacing: 1,
                          },
                        ]}
                      >
                        {FLAG_LABEL[marker.flag]}
                      </Text>
                      {marker.reference_low !== null &&
                        marker.reference_high !== null && (
                          <Text
                            style={[
                              typography.tiny,
                              { color: colors.text.muted },
                            ]}
                          >
                            Range {marker.reference_low}-{marker.reference_high}
                            {marker.unit ? ` ${marker.unit}` : ''}
                          </Text>
                        )}
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </Animated.View>
        )}

        <View style={{ marginTop: spacing.xl }}>
          <Disclaimer type="lab" />
        </View>
      </ScrollView>
    </View>
  );
}

interface SectionProps {
  title: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  tint: string;
  items: string[];
}

function Section({ title, icon, tint, items }: SectionProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();

  return (
    <Animated.View
      entering={FadeInDown.delay(100).duration(320)}
      style={[
        styles.section,
        {
          backgroundColor: colors.background.secondary,
          borderColor: colors.border.subtle,
          borderRadius: borderRadius.md,
          padding: spacing.md,
          marginTop: spacing.md,
        },
      ]}
    >
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={18} color={tint} />
        <Text
          style={[
            typography.captionBold,
            {
              color: tint,
              marginLeft: spacing.sm,
              textTransform: 'uppercase',
              letterSpacing: 1,
            },
          ]}
        >
          {title}
        </Text>
      </View>
      {items.map((text, index) => (
        <View
          key={`${title}-${index}`}
          style={[styles.bulletRow, { marginTop: spacing.sm }]}
        >
          <View
            style={[
              styles.bulletDot,
              { backgroundColor: tint, marginTop: 7 },
            ]}
          />
          <Text
            style={[
              typography.body,
              {
                color: colors.text.primary,
                marginLeft: spacing.sm,
                flex: 1,
                lineHeight: 20,
              },
            ]}
          >
            {text}
          </Text>
        </View>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  centeredMessage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  metaCard: {
    borderWidth: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  processingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  scoreCard: {
    borderWidth: 1,
  },
  section: {
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  biomarkerGroup: {
    borderWidth: 1,
  },
  biomarkerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
});
