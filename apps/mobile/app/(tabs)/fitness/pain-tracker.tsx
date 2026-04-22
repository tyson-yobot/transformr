import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ScreenHelpButton } from '@components/ui/ScreenHelpButton';
import { SCREEN_HELP } from '../../../constants/screenHelp';
import { useFeatureGate } from '@hooks/useFeatureGate';
import { FeatureLockOverlay } from '@components/ui/FeatureLockOverlay';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Input } from '@components/ui/Input';
import { BottomSheet } from '@components/ui/BottomSheet';
import { Slider } from '@components/ui/Slider';
import { BodyMap } from '@components/ui/BodyMap';
import type { BodyPart, PainLevel } from '@components/ui/BodyMap';
import { Skeleton } from '@components/ui/Skeleton';
import { formatRelativeTime } from '@utils/formatters';
import { hapticLight, hapticSuccess } from '@utils/haptics';
import { supabase } from '@services/supabase';
import type { PainLog } from '@app-types/database';
import { ScreenBackground } from '@components/ui/ScreenBackground';
import { AmbientBackground } from '@components/ui/AmbientBackground';

type PainType = 'sharp' | 'dull' | 'aching' | 'burning' | 'tingling' | 'stiffness';

const PAIN_TYPES: { value: PainType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'sharp',     label: 'Sharp',     icon: 'flash' },
  { value: 'dull',      label: 'Dull',      icon: 'ellipse' },
  { value: 'aching',    label: 'Aching',    icon: 'pulse' },
  { value: 'burning',   label: 'Burning',   icon: 'flame' },
  { value: 'tingling',  label: 'Tingling',  icon: 'sparkles' },
  { value: 'stiffness', label: 'Stiffness', icon: 'lock-closed' },
];

// Human-readable labels for each BodyPart
const BODY_PART_LABELS: Record<BodyPart, string> = {
  head: 'Head', neck: 'Neck',
  leftShoulder: 'Left Shoulder', rightShoulder: 'Right Shoulder',
  chest: 'Chest', abdomen: 'Abs / Core',
  leftArm: 'Left Bicep', rightArm: 'Right Bicep',
  leftForearm: 'Left Forearm', rightForearm: 'Right Forearm',
  leftHip: 'Left Hip', rightHip: 'Right Hip',
  leftThigh: 'Left Thigh', rightThigh: 'Right Thigh',
  leftKnee: 'Left Knee', rightKnee: 'Right Knee',
  leftShin: 'Left Shin', rightShin: 'Right Shin',
  leftFoot: 'Left Foot', rightFoot: 'Right Foot',
  lowerBack: 'Lower Back',
};

export default function PainTrackerScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const router = useRouter();
  const painGate = useFeatureGate('pain_tracker');

  const [painLogs, setPainLogs] = useState<PainLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedPart, setSelectedPart] = useState<BodyPart | null>(null);
  const [showLogSheet, setShowLogSheet] = useState(false);
  const [painLevel, setPainLevel] = useState(5);
  const [painType, setPainType] = useState<PainType>('aching');
  const [painNotes, setPainNotes] = useState('');

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => <ScreenHelpButton content={SCREEN_HELP.painTrackerScreen} />,
    });
  }, [navigation]);

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
      setError('Failed to load pain logs. Pull to refresh.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPainLogs(); }, [loadPainLogs]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPainLogs();
    setRefreshing(false);
  }, [loadPainLogs]);

  const handleSelectPart = useCallback((part: BodyPart) => {
    hapticLight();
    setSelectedPart(part);
  }, []);

  const handleLogPain = useCallback(async () => {
    if (!selectedPart) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { error: insertError } = await supabase.from('pain_logs').insert({
        user_id: user.id,
        body_part: selectedPart,
        pain_level: painLevel,
        pain_type: painType,
        notes: painNotes.trim() || null,
        logged_at: new Date().toISOString(),
      });
      if (insertError) throw insertError;
      await hapticSuccess();
      setShowLogSheet(false);
      setPainLevel(5);
      setPainType('aching');
      setPainNotes('');
      await loadPainLogs();
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to log pain');
    }
  }, [selectedPart, painLevel, painType, painNotes, loadPainLogs]);

  const getPainColor = useCallback((level: number): string => {
    if (level <= 3) return colors.accent.success;
    if (level <= 6) return colors.accent.warning;
    return colors.accent.danger;
  }, [colors]);

  // Compute pain levels for BodyMap from last 7 days
  const bodyMapPainLevels = useMemo((): PainLevel[] => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const areaMap = new Map<string, number>();
    for (const log of painLogs) {
      if (!log.logged_at || new Date(log.logged_at) < weekAgo) continue;
      const existing = areaMap.get(log.body_part) ?? 0;
      areaMap.set(log.body_part, Math.max(existing, log.pain_level ?? 0));
    }
    return Array.from(areaMap.entries())
      .filter(([part]) => part in BODY_PART_LABELS)
      .map(([part, level]) => ({ part: part as BodyPart, level }));
  }, [painLogs]);

  // History for selected part
  const selectedPartHistory = useMemo(() => {
    if (!selectedPart) return [];
    return painLogs.filter((log) => log.body_part === selectedPart);
  }, [selectedPart, painLogs]);

  if (!painGate.isAvailable) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
        <StatusBar style="light" backgroundColor="#0C0A15" />
        <FeatureLockOverlay
          featureKey="pain_tracker"
          title="Pain Tracker"
          description="Track and manage pain points to optimize your training around injuries and recovery."
          onGoBack={() => router.back()}
        />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background.primary, padding: spacing.lg }]}>
        <Skeleton variant="card" height={500} style={{ marginBottom: spacing.md }} />
        <Skeleton variant="card" height={120} style={{ marginBottom: spacing.md }} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <ScreenBackground />
      <AmbientBackground />
      <StatusBar style="light" backgroundColor="#0C0A15" />
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 90 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent.primary}
          />
        }
      >
        {error && (
          <Card style={{ marginBottom: spacing.lg, backgroundColor: `${colors.accent.danger}15` }}>
            <Text style={[typography.caption, { color: colors.accent.danger }]}>{error}</Text>
            <Button
              title="Retry"
              variant="outline"
              onPress={() => { void loadPainLogs(); }}
              size="sm"
              style={{ marginTop: spacing.sm }}
              accessibilityLabel="Retry loading pain logs"
            />
          </Card>
        )}

        {/* Anatomical Body Map */}
        <Card variant="elevated" style={{ marginBottom: spacing.lg }}>
          <Text style={[typography.h3, { color: colors.text.primary, marginBottom: spacing.sm }]}>
            Tap where it hurts
          </Text>
          <Text style={[typography.caption, { color: colors.text.muted, marginBottom: spacing.lg }]}>
            Select a body region to log or review pain
          </Text>
          <BodyMap
            mode="pain"
            painLevels={bodyMapPainLevels}
            selectedPart={selectedPart}
            onSelectPart={handleSelectPart}
            showBack
            size="lg"
            style={{ alignSelf: 'center' }}
          />
        </Card>

        {/* Selected Part — history + log button */}
        {selectedPart && (
          <Card style={{ marginBottom: spacing.lg }}>
            <View style={[styles.selectedHeader, { marginBottom: spacing.md }]}>
              <View style={{ flex: 1 }}>
                <Text style={[typography.h3, { color: colors.text.primary }]}>
                  {BODY_PART_LABELS[selectedPart]}
                </Text>
                {bodyMapPainLevels.find((pl) => pl.part === selectedPart) && (
                  <Badge
                    label={`Pain: ${bodyMapPainLevels.find((pl) => pl.part === selectedPart)?.level ?? 0}/10`}
                    variant="danger"
                    size="sm"
                    style={{ marginTop: spacing.xs, alignSelf: 'flex-start' }}
                  />
                )}
              </View>
              <Button
                title="Log Pain"
                size="sm"
                onPress={() => { hapticLight(); setShowLogSheet(true); }}
                leftIcon={<Ionicons name="add" size={16} color={colors.text.inverse} />}
              />
            </View>

            {selectedPartHistory.length > 0 ? (
              <>
                <Text style={[typography.captionBold, { color: colors.text.muted, marginBottom: spacing.sm }]}>
                  PAIN TREND
                </Text>
                {/* Mini animated bar chart */}
                <View style={[styles.trendRow, { marginBottom: spacing.md }]}>
                  {selectedPartHistory.slice(0, 14).reverse().map((log) => (
                    <View
                      key={log.id}
                      style={[
                        styles.trendBar,
                        {
                          backgroundColor: getPainColor(log.pain_level ?? 0),
                          height: Math.max(4, ((log.pain_level ?? 0) / 10) * 40),
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
                        styles.badgeCircle,
                        {
                          backgroundColor: getPainColor(log.pain_level ?? 0),
                          borderRadius: borderRadius.sm,
                        },
                      ]}
                    >
                      <Text style={[typography.monoCaption, { color: '#FFFFFF' /* brand-ok — white on colored badge */, fontWeight: '700' }]}>
                        {log.pain_level}
                      </Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: spacing.md }}>
                      <Text style={[typography.captionBold, { color: colors.text.primary }]}>
                        {log.pain_type ?? 'Unknown'}
                      </Text>
                      {log.notes && (
                        <Text style={[typography.tiny, { color: colors.text.muted }]} numberOfLines={1}>
                          {log.notes}
                        </Text>
                      )}
                    </View>
                    <Text style={[typography.tiny, { color: colors.text.muted }]}>
                      {log.logged_at ? formatRelativeTime(log.logged_at) : ''}
                    </Text>
                  </View>
                ))}
              </>
            ) : (
              <Text style={[typography.body, { color: colors.text.muted, textAlign: 'center' }]}>
                No pain logged for this area yet.
              </Text>
            )}
          </Card>
        )}

        {/* Recent Pain Entries */}
        <Text style={[typography.h3, { color: colors.text.primary, marginBottom: spacing.md }]}>
          Recent Pain Entries
        </Text>
        {painLogs.length > 0 ? (
          painLogs.slice(0, 10).map((log, index) => (
            <Animated.View
              key={log.id}
              entering={FadeInDown.duration(300).delay(index * 40)}
            >
              <Card style={{ marginBottom: spacing.sm }}>
                <View style={styles.logRow}>
                  <View
                    style={[
                      styles.badgeCircle,
                      {
                        backgroundColor: getPainColor(log.pain_level ?? 0),
                        borderRadius: borderRadius.sm,
                        width: 36,
                        height: 36,
                      },
                    ]}
                  >
                    <Text style={[typography.monoBody, { color: '#FFFFFF' /* brand-ok — white on colored badge */, fontWeight: '700' }]}>
                      {log.pain_level}
                    </Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.md }}>
                    <Text style={[typography.bodyBold, { color: colors.text.primary }]}>
                      {BODY_PART_LABELS[log.body_part as BodyPart] ?? log.body_part}
                    </Text>
                    <View style={[styles.logMeta, { gap: spacing.sm }]}>
                      {log.pain_type && <Badge label={log.pain_type} size="sm" />}
                      <Text style={[typography.tiny, { color: colors.text.muted }]}>
                        {log.logged_at ? formatRelativeTime(log.logged_at) : ''}
                      </Text>
                    </View>
                  </View>
                </View>
              </Card>
            </Animated.View>
          ))
        ) : (
          <Card>
            <Text style={[typography.body, { color: colors.text.muted, textAlign: 'center' }]}>
              No pain entries yet. Tap on the body map to log pain.
            </Text>
          </Card>
        )}
      </ScrollView>

      {/* Log Pain Bottom Sheet */}
      <BottomSheet
        visible={showLogSheet}
        onDismiss={() => setShowLogSheet(false)}
        snapPoints={[0.55, 0.8]}
        initialSnap={0}
      >
        <View style={{ padding: spacing.lg, gap: spacing.lg }}>
          <Text style={[typography.h3, { color: colors.text.primary }]}>
            Log Pain — {selectedPart ? BODY_PART_LABELS[selectedPart] : ''}
          </Text>

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
            <Text style={[typography.captionBold, { color: colors.text.secondary, marginBottom: spacing.sm }]}>
              Pain Type
            </Text>
            <View style={[styles.painTypeGrid, { gap: spacing.sm }]}>
              {PAIN_TYPES.map((pt) => (
                <Pressable
                  key={pt.value}
                  onPress={() => { setPainType(pt.value); hapticLight(); }}
                  accessibilityLabel={`Pain type: ${pt.label}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: painType === pt.value }}
                  style={[
                    styles.painTypeChip,
                    {
                      backgroundColor: painType === pt.value
                        ? colors.accent.primary
                        : colors.background.tertiary,
                      borderRadius: borderRadius.md,
                      padding: spacing.sm,
                    },
                  ]}
                >
                  <Ionicons
                    name={pt.icon}
                    size={18}
                    color={painType === pt.value ? colors.text.inverse : colors.text.secondary}
                  />
                  <Text
                    style={[
                      typography.tiny,
                      {
                        color: painType === pt.value ? colors.text.inverse : colors.text.secondary,
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
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  selectedHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  trendRow: { flexDirection: 'row', alignItems: 'flex-end', height: 40, gap: 3 },
  trendBar: { flex: 1, minWidth: 6 },
  historyRow: { flexDirection: 'row', alignItems: 'center' },
  badgeCircle: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  logRow: { flexDirection: 'row', alignItems: 'center' },
  logMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  painTypeGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  painTypeChip: { width: '30%', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(168, 85, 247, 0.15)' },
});
