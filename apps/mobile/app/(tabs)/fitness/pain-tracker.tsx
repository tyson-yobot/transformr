// =============================================================================
// TRANSFORMR -- Pain / Injury Tracker Screen
// =============================================================================

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Input } from '@components/ui/Input';
import { Modal } from '@components/ui/Modal';
import { Slider } from '@components/ui/Slider';
import { formatRelativeTime } from '@utils/formatters';
import { hapticLight, hapticSuccess } from '@utils/haptics';
import { Skeleton } from '@components/ui/Skeleton';
import { supabase } from '@services/supabase';
import type { PainLog } from '@app-types/database';

type PainType = 'sharp' | 'dull' | 'aching' | 'burning' | 'tingling' | 'stiffness';

interface BodyPart {
  id: string;
  label: string;
  x: number; // percent from left
  y: number; // percent from top
}

const BODY_PARTS: BodyPart[] = [
  { id: 'head', label: 'Head', x: 50, y: 5 },
  { id: 'neck', label: 'Neck', x: 50, y: 12 },
  { id: 'left_shoulder', label: 'Left Shoulder', x: 30, y: 18 },
  { id: 'right_shoulder', label: 'Right Shoulder', x: 70, y: 18 },
  { id: 'chest', label: 'Chest', x: 50, y: 24 },
  { id: 'upper_back', label: 'Upper Back', x: 50, y: 22 },
  { id: 'left_bicep', label: 'Left Bicep', x: 22, y: 28 },
  { id: 'right_bicep', label: 'Right Bicep', x: 78, y: 28 },
  { id: 'core', label: 'Core/Abs', x: 50, y: 34 },
  { id: 'lower_back', label: 'Lower Back', x: 50, y: 38 },
  { id: 'left_hip', label: 'Left Hip', x: 35, y: 44 },
  { id: 'right_hip', label: 'Right Hip', x: 65, y: 44 },
  { id: 'left_quad', label: 'Left Quad', x: 38, y: 56 },
  { id: 'right_quad', label: 'Right Quad', x: 62, y: 56 },
  { id: 'left_hamstring', label: 'Left Hamstring', x: 38, y: 62 },
  { id: 'right_hamstring', label: 'Right Hamstring', x: 62, y: 62 },
  { id: 'left_knee', label: 'Left Knee', x: 38, y: 68 },
  { id: 'right_knee', label: 'Right Knee', x: 62, y: 68 },
  { id: 'left_calf', label: 'Left Calf', x: 38, y: 78 },
  { id: 'right_calf', label: 'Right Calf', x: 62, y: 78 },
  { id: 'left_ankle', label: 'Left Ankle', x: 38, y: 88 },
  { id: 'right_ankle', label: 'Right Ankle', x: 62, y: 88 },
  { id: 'left_wrist', label: 'Left Wrist', x: 16, y: 40 },
  { id: 'right_wrist', label: 'Right Wrist', x: 84, y: 40 },
  { id: 'left_elbow', label: 'Left Elbow', x: 18, y: 34 },
  { id: 'right_elbow', label: 'Right Elbow', x: 82, y: 34 },
];

const PAIN_TYPES: { value: PainType; label: string; icon: string }[] = [
  { value: 'sharp', label: 'Sharp', icon: 'flash' },
  { value: 'dull', label: 'Dull', icon: 'ellipse' },
  { value: 'aching', label: 'Aching', icon: 'pulse' },
  { value: 'burning', label: 'Burning', icon: 'flame' },
  { value: 'tingling', label: 'Tingling', icon: 'sparkles' },
  { value: 'stiffness', label: 'Stiffness', icon: 'lock-closed' },
];

export default function PainTrackerScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();

  const [painLogs, setPainLogs] = useState<PainLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Body map selection
  const [selectedBodyPart, setSelectedBodyPart] = useState<BodyPart | null>(null);

  // Pain log form
  const [showLogModal, setShowLogModal] = useState(false);
  const [painLevel, setPainLevel] = useState(5);
  const [painType, setPainType] = useState<PainType>('aching');
  const [painNotes, setPainNotes] = useState('');

  // Selected body part history
  const [selectedPartHistory, setSelectedPartHistory] = useState<PainLog[]>([]);

  const loadPainLogs = useCallback(async () => {
    try {
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error: fetchError } = await supabase
        .from('pain_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('logged_at', { ascending: false })
        .limit(100);

      if (fetchError) throw fetchError;
      setPainLogs((data ?? []) as PainLog[]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load pain logs';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPainLogs();
  }, [loadPainLogs]);

  // Update history when body part selected
  useEffect(() => {
    if (selectedBodyPart) {
      const history = painLogs.filter((log) => log.body_part === selectedBodyPart.id);
      setSelectedPartHistory(history);
    } else {
      setSelectedPartHistory([]);
    }
  }, [selectedBodyPart, painLogs]);

  const handleBodyPartPress = useCallback(
    (part: BodyPart) => {
      hapticLight();
      setSelectedBodyPart(part);
    },
    [],
  );

  const handleLogPain = useCallback(async () => {
    if (!selectedBodyPart) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error: insertError } = await supabase.from('pain_logs').insert({
        user_id: user.id,
        body_part: selectedBodyPart.id,
        pain_level: painLevel,
        pain_type: painType,
        notes: painNotes.trim() || null,
        logged_at: new Date().toISOString(),
      });

      if (insertError) throw insertError;

      await hapticSuccess();
      setShowLogModal(false);
      setPainLevel(5);
      setPainType('aching');
      setPainNotes('');
      await loadPainLogs();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to log pain';
      Alert.alert('Error', message);
    }
  }, [selectedBodyPart, painLevel, painType, painNotes, loadPainLogs]);

  const getPainColor = (level: number): string => {
    if (level <= 3) return colors.accent.success;
    if (level <= 6) return colors.accent.warning;
    return colors.accent.danger;
  };

  // Get active pain areas (logged in the last 7 days)
  const activePainAreas = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentLogs = painLogs.filter(
      (log) => log.logged_at && new Date(log.logged_at) >= weekAgo,
    );

    const areaMap = new Map<string, number>();
    for (const log of recentLogs) {
      const existing = areaMap.get(log.body_part) ?? 0;
      areaMap.set(log.body_part, Math.max(existing, log.pain_level ?? 0));
    }
    return areaMap;
  }, [painLogs]);

  if (loading) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background.primary, padding: spacing.lg }]}>
        <Skeleton variant="card" height={440} style={{ marginBottom: spacing.md }} />
        <Skeleton variant="card" height={120} style={{ marginBottom: spacing.md }} />
        <Skeleton variant="card" height={80} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {error && (
          <Card style={{ marginBottom: spacing.lg, backgroundColor: `${colors.accent.danger}15` }}>
            <Text style={[typography.caption, { color: colors.accent.danger }]}>{error}</Text>
          </Card>
        )}

        {/* Interactive Body Map */}
        <Card variant="elevated" style={{ marginBottom: spacing.lg }}>
          <Text style={[typography.h3, { color: colors.text.primary, marginBottom: spacing.md }]}>
            Tap where it hurts
          </Text>
          <View
            style={[
              styles.bodyMap,
              {
                backgroundColor: colors.background.tertiary,
                borderRadius: borderRadius.lg,
                height: 440,
              },
            ]}
          >
            {/* Body silhouette outline */}
            <View style={styles.bodyOutline}>
              <Ionicons name="body" size={300} color={`${colors.text.muted}30`} />
            </View>

            {/* Tappable body part hotspots */}
            {BODY_PARTS.map((part) => {
              const painLevelForPart = activePainAreas.get(part.id);
              const isSelected = selectedBodyPart?.id === part.id;
              const hasPain = painLevelForPart !== undefined;

              return (
                <Pressable
                  key={part.id}
                  onPress={() => handleBodyPartPress(part)}
                  accessibilityLabel={`${part.label}${hasPain ? `, pain level ${painLevelForPart}` : ''}`}
                  accessibilityRole="button"
                  style={[
                    styles.bodyPartDot,
                    {
                      left: `${part.x}%`,
                      top: `${part.y}%`,
                      backgroundColor: hasPain
                        ? getPainColor(painLevelForPart)
                        : isSelected
                          ? colors.accent.primary
                          : `${colors.text.muted}40`,
                      borderColor: isSelected ? '#FFFFFF' : 'transparent',
                      borderWidth: isSelected ? 2 : 0,
                      width: hasPain ? 20 : 16,
                      height: hasPain ? 20 : 16,
                      borderRadius: 10,
                    },
                  ]}
                  hitSlop={12}
                />
              );
            })}
          </View>
        </Card>

        {/* Selected Body Part Info */}
        {selectedBodyPart && (
          <Card style={{ marginBottom: spacing.lg }}>
            <View style={styles.selectedPartHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[typography.h3, { color: colors.text.primary }]}>
                  {selectedBodyPart.label}
                </Text>
                {activePainAreas.has(selectedBodyPart.id) && (
                  <Badge
                    label={`Pain: ${activePainAreas.get(selectedBodyPart.id)}/10`}
                    variant="danger"
                    size="sm"
                    style={{ marginTop: spacing.xs }}
                  />
                )}
              </View>
              <Button
                title="Log Pain"
                size="sm"
                onPress={() => {
                  hapticLight();
                  setShowLogModal(true);
                }}
                leftIcon={<Ionicons name="add" size={16} color="#FFFFFF" />}
              />
            </View>

            {/* Pain History for Selected Part */}
            {selectedPartHistory.length > 0 ? (
              <View style={{ marginTop: spacing.md }}>
                <Text
                  style={[
                    typography.captionBold,
                    { color: colors.text.muted, marginBottom: spacing.sm },
                  ]}
                >
                  Pain History
                </Text>

                {/* Mini Trend */}
                <View style={[styles.trendRow, { marginBottom: spacing.md, gap: spacing.xs }]}>
                  {selectedPartHistory.slice(0, 14).reverse().map((log, _idx) => (
                    <View
                      key={log.id}
                      style={[
                        styles.trendBar,
                        {
                          backgroundColor: getPainColor(log.pain_level ?? 0),
                          height: ((log.pain_level ?? 0) / 10) * 40,
                          borderRadius: 2,
                        },
                      ]}
                    />
                  ))}
                </View>

                {selectedPartHistory.slice(0, 5).map((log) => (
                  <View
                    key={log.id}
                    style={[
                      styles.historyRow,
                      {
                        paddingVertical: spacing.sm,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.border.subtle,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.painLevelBadge,
                        {
                          backgroundColor: getPainColor(log.pain_level ?? 0),
                          borderRadius: borderRadius.sm,
                          width: 32,
                          height: 32,
                        },
                      ]}
                    >
                      <Text style={[typography.monoCaption, { color: '#FFFFFF', fontWeight: '700' }]}>
                        {log.pain_level}
                      </Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: spacing.md }}>
                      <Text style={[typography.captionBold, { color: colors.text.primary }]}>
                        {log.pain_type ?? 'Unknown'}
                      </Text>
                      {log.notes && (
                        <Text
                          style={[typography.tiny, { color: colors.text.muted }]}
                          numberOfLines={1}
                        >
                          {log.notes}
                        </Text>
                      )}
                    </View>
                    <Text style={[typography.tiny, { color: colors.text.muted }]}>
                      {log.logged_at ? formatRelativeTime(log.logged_at) : ''}
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
                No pain logged for this area.
              </Text>
            )}
          </Card>
        )}

        {/* Recent Pain Log */}
        <Text style={[typography.h3, { color: colors.text.primary, marginBottom: spacing.md }]}>
          Recent Pain Entries
        </Text>
        {painLogs.length > 0 ? (
          painLogs.slice(0, 10).map((log) => {
            const bodyPart = BODY_PARTS.find((bp) => bp.id === log.body_part);
            return (
              <Card key={log.id} style={{ marginBottom: spacing.sm }}>
                <View style={styles.logRow}>
                  <View
                    style={[
                      styles.painLevelBadge,
                      {
                        backgroundColor: getPainColor(log.pain_level ?? 0),
                        borderRadius: borderRadius.sm,
                        width: 36,
                        height: 36,
                      },
                    ]}
                  >
                    <Text style={[typography.monoBody, { color: '#FFFFFF', fontWeight: '700' }]}>
                      {log.pain_level}
                    </Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.md }}>
                    <Text style={[typography.bodyBold, { color: colors.text.primary }]}>
                      {bodyPart?.label ?? log.body_part}
                    </Text>
                    <View style={[styles.logMeta, { gap: spacing.sm }]}>
                      {log.pain_type && (
                        <Badge label={log.pain_type} size="sm" />
                      )}
                      <Text style={[typography.tiny, { color: colors.text.muted }]}>
                        {log.logged_at ? formatRelativeTime(log.logged_at) : ''}
                      </Text>
                    </View>
                  </View>
                </View>
              </Card>
            );
          })
        ) : (
          <Card>
            <Text style={[typography.body, { color: colors.text.muted, textAlign: 'center' }]}>
              No pain entries yet. Tap on the body map to log pain.
            </Text>
          </Card>
        )}
      </ScrollView>

      {/* Log Pain Modal */}
      <Modal
        visible={showLogModal}
        onDismiss={() => setShowLogModal(false)}
        title={`Log Pain - ${selectedBodyPart?.label ?? ''}`}
      >
        <View style={{ gap: spacing.lg }}>
          <Slider
            value={painLevel}
            onValueChange={setPainLevel}
            min={1}
            max={10}
            step={1}
            label="Pain Level"
            fillColor={getPainColor(painLevel)}
          />

          <View>
            <Text
              style={[
                typography.captionBold,
                { color: colors.text.secondary, marginBottom: spacing.sm },
              ]}
            >
              Pain Type
            </Text>
            <View style={[styles.painTypeGrid, { gap: spacing.sm }]}>
              {PAIN_TYPES.map((pt) => (
                <Pressable
                  key={pt.value}
                  onPress={() => {
                    setPainType(pt.value);
                    hapticLight();
                  }}
                  accessibilityLabel={`Pain type: ${pt.label}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: painType === pt.value }}
                  style={[
                    styles.painTypeChip,
                    {
                      backgroundColor:
                        painType === pt.value
                          ? colors.accent.primary
                          : colors.background.tertiary,
                      borderRadius: borderRadius.md,
                      padding: spacing.sm,
                    },
                  ]}
                >
                  <Ionicons
                    name={pt.icon as keyof typeof Ionicons.glyphMap}
                    size={18}
                    color={painType === pt.value ? '#FFFFFF' : colors.text.secondary}
                  />
                  <Text
                    style={[
                      typography.tiny,
                      {
                        color: painType === pt.value ? '#FFFFFF' : colors.text.secondary,
                        marginTop: 2,
                      },
                    ]}
                  >
                    {pt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <Input
            label="Notes (optional)"
            placeholder="Any additional details..."
            value={painNotes}
            onChangeText={setPainNotes}
            multiline
          />

          <Button title="Save Pain Log" onPress={handleLogPain} fullWidth />
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
  bodyMap: {
    position: 'relative',
    overflow: 'hidden',
  },
  bodyOutline: {
    position: 'absolute',
    top: '5%',
    left: '25%',
    opacity: 0.5,
  },
  bodyPartDot: {
    position: 'absolute',
    marginLeft: -8,
    marginTop: -8,
  },
  selectedPartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 40,
  },
  trendBar: {
    flex: 1,
    minWidth: 6,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  painLevelBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  painTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  painTypeChip: {
    width: '30%',
    alignItems: 'center',
  },
});
