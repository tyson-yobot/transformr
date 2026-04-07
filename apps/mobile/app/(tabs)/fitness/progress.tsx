// =============================================================================
// TRANSFORMR -- Progress Tracking Screen
// =============================================================================

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Input } from '@components/ui/Input';
import { Modal } from '@components/ui/Modal';
import { WeightChart } from '@components/charts/WeightChart';
import { formatWeight, formatDate } from '@utils/formatters';
import { hapticLight, hapticSuccess } from '@utils/haptics';
import { supabase } from '@services/supabase';
import type { WeightLog, Measurement } from '@app-types/database';

interface ProgressPhoto {
  id: string;
  date: string;
  frontUrl: string | null;
  sideUrl: string | null;
  backUrl: string | null;
}

export default function ProgressScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const router = useRouter();

  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [progressPhotos, setProgressPhotos] = useState<ProgressPhoto[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Log weight modal
  const [showLogWeightModal, setShowLogWeightModal] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [newBodyFat, setNewBodyFat] = useState('');

  // Compare photos
  const [compareMode, setCompareMode] = useState(false);
  const [compareIndex1, setCompareIndex1] = useState(0);
  const [compareIndex2, setCompareIndex2] = useState(1);

  const chartData = weightLogs.map((w) => ({
    date: w.logged_at ?? w.created_at ?? '',
    weight: w.weight,
  }));

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [weightRes, measureRes] = await Promise.all([
        supabase
          .from('weight_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('logged_at', { ascending: true }),
        supabase
          .from('measurements')
          .select('*')
          .eq('user_id', user.id)
          .order('measured_at', { ascending: false })
          .limit(5),
      ]);

      if (weightRes.data) {
        setWeightLogs(weightRes.data as WeightLog[]);

        // Extract progress photos from weight logs
        const photos: ProgressPhoto[] = [];
        for (const log of weightRes.data) {
          if (log.photo_front_url || log.photo_side_url || log.photo_back_url) {
            photos.push({
              id: log.id,
              date: log.logged_at ?? log.created_at ?? '',
              frontUrl: log.photo_front_url ?? null,
              sideUrl: log.photo_side_url ?? null,
              backUrl: log.photo_back_url ?? null,
            });
          }
        }
        setProgressPhotos(photos.reverse());

        // Check for AI body analysis in latest log
        const latest = weightRes.data[weightRes.data.length - 1];
        if (latest?.ai_body_analysis) {
          const analysis = latest.ai_body_analysis as Record<string, string>;
          setAiAnalysis(analysis.summary ?? null);
        }
      }

      if (measureRes.data) {
        setMeasurements(measureRes.data as Measurement[]);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load progress data';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLogWeight = useCallback(async () => {
    const weight = parseFloat(newWeight);
    if (isNaN(weight) || weight <= 0) {
      Alert.alert('Invalid Weight', 'Please enter a valid weight.');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const bodyFat = parseFloat(newBodyFat);

      const { error: insertError } = await supabase.from('weight_logs').insert({
        user_id: user.id,
        weight,
        body_fat_percentage: !isNaN(bodyFat) ? bodyFat : null,
        logged_at: new Date().toISOString(),
      });

      if (insertError) throw insertError;

      await hapticSuccess();
      setShowLogWeightModal(false);
      setNewWeight('');
      setNewBodyFat('');
      await loadData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to log weight';
      Alert.alert('Error', message);
    }
  }, [newWeight, newBodyFat, loadData]);

  const handleAddPhoto = useCallback(async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets.length > 0) {
      // In a full implementation, upload to storage and save URL to weight_log
      Alert.alert('Photo Captured', 'Photo upload will be implemented with storage integration.');
    }
  }, []);

  const latestWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1] : null;
  const latestMeasurement = measurements.length > 0 ? measurements[0] : null;

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background.primary }]}>
        <ActivityIndicator size="large" color={colors.accent.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {error && (
          <Card style={{ marginBottom: spacing.lg, backgroundColor: `${colors.accent.danger}15` }}>
            <Text style={[typography.caption, { color: colors.accent.danger }]}>{error}</Text>
          </Card>
        )}

        {/* Current Weight */}
        {latestWeight && (
          <Card variant="elevated" style={{ marginBottom: spacing.lg }}>
            <View style={styles.currentWeightRow}>
              <View>
                <Text style={[typography.caption, { color: colors.text.muted }]}>
                  Current Weight
                </Text>
                <Text style={[typography.hero, { color: colors.text.primary }]}>
                  {formatWeight(latestWeight.weight)}
                </Text>
                {latestWeight.body_fat_percentage && (
                  <Text style={[typography.caption, { color: colors.text.secondary }]}>
                    {latestWeight.body_fat_percentage}% body fat
                  </Text>
                )}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                {latestWeight.logged_at && (
                  <Text style={[typography.tiny, { color: colors.text.muted }]}>
                    {formatDate(latestWeight.logged_at)}
                  </Text>
                )}
                {weightLogs.length >= 2 && (
                  <View style={{ marginTop: spacing.xs }}>
                    {(() => {
                      const diff =
                        latestWeight.weight - weightLogs[weightLogs.length - 2].weight;
                      const isLoss = diff < 0;
                      return (
                        <Badge
                          label={`${isLoss ? '' : '+'}${diff.toFixed(1)} lbs`}
                          variant={isLoss ? 'success' : 'warning'}
                          size="sm"
                        />
                      );
                    })()}
                  </View>
                )}
              </View>
            </View>
          </Card>
        )}

        {/* Weight Chart - Full Size */}
        <Card style={{ marginBottom: spacing.lg }}>
          <View style={styles.sectionHeader}>
            <Ionicons name="trending-up-outline" size={20} color={colors.accent.primary} />
            <Text
              style={[typography.h3, { color: colors.text.primary, marginLeft: spacing.sm }]}
            >
              Weight Trend
            </Text>
          </View>
          <View style={{ marginTop: spacing.md }}>
            {chartData.length > 1 ? (
              <WeightChart data={chartData} />
            ) : (
              <Text style={[typography.body, { color: colors.text.muted, textAlign: 'center' }]}>
                Log at least 2 weights to see your trend chart.
              </Text>
            )}
          </View>
        </Card>

        {/* Body Measurements */}
        <Card style={{ marginBottom: spacing.lg }}>
          <View style={styles.sectionHeader}>
            <Ionicons name="resize-outline" size={20} color={colors.accent.info} />
            <Text
              style={[typography.h3, { color: colors.text.primary, marginLeft: spacing.sm }]}
            >
              Body Measurements
            </Text>
          </View>
          {latestMeasurement ? (
            <View style={[styles.measureGrid, { marginTop: spacing.md, gap: spacing.sm }]}>
              {[
                { label: 'Chest', value: latestMeasurement.chest },
                { label: 'Waist', value: latestMeasurement.waist },
                { label: 'Hips', value: latestMeasurement.hips },
                { label: 'Bicep (L)', value: latestMeasurement.bicep_left },
                { label: 'Bicep (R)', value: latestMeasurement.bicep_right },
                { label: 'Thigh (L)', value: latestMeasurement.thigh_left },
                { label: 'Thigh (R)', value: latestMeasurement.thigh_right },
                { label: 'Shoulders', value: latestMeasurement.shoulders },
                { label: 'Neck', value: latestMeasurement.neck },
              ]
                .filter((m) => m.value !== null && m.value !== undefined)
                .map((m) => (
                  <View
                    key={m.label}
                    style={[
                      styles.measureItem,
                      {
                        backgroundColor: colors.background.tertiary,
                        borderRadius: borderRadius.sm,
                        padding: spacing.sm,
                      },
                    ]}
                  >
                    <Text style={[typography.tiny, { color: colors.text.muted }]}>
                      {m.label}
                    </Text>
                    <Text style={[typography.bodyBold, { color: colors.text.primary }]}>
                      {m.value}"
                    </Text>
                  </View>
                ))}
            </View>
          ) : (
            <Text
              style={[
                typography.body,
                { color: colors.text.muted, textAlign: 'center', marginTop: spacing.md },
              ]}
            >
              No measurements logged yet.
            </Text>
          )}
        </Card>

        {/* Progress Photos */}
        <Card style={{ marginBottom: spacing.lg }}>
          <View style={styles.sectionHeader}>
            <Ionicons name="camera-outline" size={20} color={colors.accent.secondary} />
            <Text
              style={[typography.h3, { color: colors.text.primary, marginLeft: spacing.sm }]}
            >
              Progress Photos
            </Text>
            <View style={{ flex: 1 }} />
            {progressPhotos.length >= 2 && (
              <Pressable onPress={() => setCompareMode((prev) => !prev)}>
                <Text style={[typography.captionBold, { color: colors.accent.primary }]}>
                  {compareMode ? 'Grid' : 'Compare'}
                </Text>
              </Pressable>
            )}
          </View>

          {progressPhotos.length > 0 ? (
            compareMode ? (
              <View style={[styles.compareContainer, { marginTop: spacing.md }]}>
                <View style={styles.compareColumn}>
                  <Text style={[typography.tiny, { color: colors.text.muted, textAlign: 'center' }]}>
                    {progressPhotos[compareIndex1]?.date
                      ? formatDate(progressPhotos[compareIndex1].date)
                      : ''}
                  </Text>
                  {progressPhotos[compareIndex1]?.frontUrl && (
                    <Image
                      source={{ uri: progressPhotos[compareIndex1].frontUrl ?? undefined }}
                      style={[
                        styles.compareImage,
                        { borderRadius: borderRadius.sm },
                      ]}
                    />
                  )}
                </View>
                <View style={styles.compareColumn}>
                  <Text style={[typography.tiny, { color: colors.text.muted, textAlign: 'center' }]}>
                    {progressPhotos[compareIndex2]?.date
                      ? formatDate(progressPhotos[compareIndex2].date)
                      : ''}
                  </Text>
                  {progressPhotos[compareIndex2]?.frontUrl && (
                    <Image
                      source={{ uri: progressPhotos[compareIndex2].frontUrl ?? undefined }}
                      style={[
                        styles.compareImage,
                        { borderRadius: borderRadius.sm },
                      ]}
                    />
                  )}
                </View>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginTop: spacing.md }}
              >
                {progressPhotos.map((photo) => (
                  <View key={photo.id} style={{ marginRight: spacing.sm }}>
                    {photo.frontUrl && (
                      <Image
                        source={{ uri: photo.frontUrl }}
                        style={[
                          styles.photoThumb,
                          { borderRadius: borderRadius.sm },
                        ]}
                      />
                    )}
                    <Text
                      style={[
                        typography.tiny,
                        { color: colors.text.muted, textAlign: 'center', marginTop: spacing.xs },
                      ]}
                    >
                      {photo.date ? formatDate(photo.date) : ''}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            )
          ) : (
            <Text
              style={[
                typography.body,
                { color: colors.text.muted, textAlign: 'center', marginTop: spacing.md },
              ]}
            >
              No progress photos yet. Start tracking your transformation!
            </Text>
          )}
        </Card>

        {/* AI Body Analysis */}
        {aiAnalysis && (
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
                AI Body Analysis
              </Text>
            </View>
            <Text
              style={[
                typography.body,
                { color: colors.text.secondary, marginTop: spacing.sm },
              ]}
            >
              {aiAnalysis}
            </Text>
          </Card>
        )}
      </ScrollView>

      {/* FABs */}
      <View style={styles.fabContainer}>
        <Pressable
          onPress={() => {
            hapticLight();
            setShowLogWeightModal(true);
          }}
          style={[
            styles.fab,
            {
              backgroundColor: colors.accent.primary,
              shadowColor: colors.accent.primary,
              marginBottom: spacing.sm,
            },
          ]}
        >
          <Ionicons name="scale-outline" size={24} color="#FFFFFF" />
        </Pressable>
        <Pressable
          onPress={() => {
            hapticLight();
            handleAddPhoto();
          }}
          style={[
            styles.fab,
            {
              backgroundColor: colors.accent.secondary,
              shadowColor: colors.accent.secondary,
            },
          ]}
        >
          <Ionicons name="camera-outline" size={24} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Log Weight Modal */}
      <Modal
        visible={showLogWeightModal}
        onDismiss={() => setShowLogWeightModal(false)}
        title="Log Weight"
      >
        <View style={{ gap: spacing.lg }}>
          <Input
            label="Weight (lbs)"
            placeholder="e.g., 185.5"
            value={newWeight}
            onChangeText={setNewWeight}
            keyboardType="numeric"
          />
          <Input
            label="Body Fat % (optional)"
            placeholder="e.g., 15"
            value={newBodyFat}
            onChangeText={setNewBodyFat}
            keyboardType="numeric"
          />
          <Button
            title="Save Weight"
            onPress={handleLogWeight}
            fullWidth
            disabled={!newWeight.trim()}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentWeightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  measureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  measureItem: {
    width: '30%',
    alignItems: 'center',
  },
  compareContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  compareColumn: {
    flex: 1,
  },
  compareImage: {
    width: '100%',
    height: 200,
    marginTop: 4,
  },
  photoThumb: {
    width: 100,
    height: 130,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    alignItems: 'center',
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
