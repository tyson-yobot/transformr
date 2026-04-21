// =============================================================================
// TRANSFORMR -- Sleep Tracker
// =============================================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Input } from '@components/ui/Input';
import { Modal } from '@components/ui/Modal';
import { SleepChart } from '@components/charts/SleepChart';
import { AIInsightCard } from '@components/cards/AIInsightCard';
import { Disclaimer } from '@components/ui/Disclaimer';
import { useSleepStore } from '@stores/sleepStore';
import { formatDuration } from '@utils/formatters';
import { hapticLight, hapticSuccess } from '@utils/haptics';
import { HelpBubble } from '@components/ui/HelpBubble';
import { ScreenHelpButton } from '@components/ui/ScreenHelpButton';
import { ActionToast, useActionToast } from '@components/ui/ActionToast';
import { EmptyState } from '@components/ui/EmptyState';
import { Skeleton } from '@components/ui/Skeleton';
import { SCREEN_HELP } from '../../../constants/screenHelp';

const QUALITY_LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];
const isValidTime = (t: string): boolean => /^\d{1,2}:\d{2}$/.test(t);

export default function SleepTracker() {
  const { colors, typography, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { lastSleep, sleepHistory, isLoading, fetchSleepHistory, logSleep } =
    useSleepStore();
  const { toast, show: showToast, hide: hideToast } = useActionToast();

  const [refreshing, setRefreshing] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [bedtime, setBedtime] = useState('22:30');
  const [wakeTime, setWakeTime] = useState('06:30');
  const [quality, setQuality] = useState(3);
  const [caffeineCutoff, setCaffeineCutoff] = useState('14:00');
  const [screenCutoff, setScreenCutoff] = useState('21:00');

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => <ScreenHelpButton content={SCREEN_HELP.sleepScreen} />,
    });
  }, [navigation]);

  useEffect(() => {
    const now = new Date();
    const twoWeeksAgo = new Date(now);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    fetchSleepHistory({
      start: twoWeeksAgo.toISOString(),
      end: now.toISOString(),
    });
  }, [fetchSleepHistory]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    const now = new Date();
    const twoWeeksAgo = new Date(now);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    await fetchSleepHistory({
      start: twoWeeksAgo.toISOString(),
      end: now.toISOString(),
    });
    setRefreshing(false);
  }, [fetchSleepHistory]);

  const calculateDuration = useCallback(
    (bed: string, wake: string): number => {
      const [bH, bM] = bed.split(':').map(Number);
      const [wH, wM] = wake.split(':').map(Number);
      const bedMin = (bH ?? 0) * 60 + (bM ?? 0);
      let wakeMin = (wH ?? 0) * 60 + (wM ?? 0);
      if (wakeMin <= bedMin) wakeMin += 24 * 60;
      return wakeMin - bedMin;
    },
    [],
  );

  const handleLogSleep = useCallback(async () => {
    if (!isValidTime(bedtime) || !isValidTime(wakeTime)) {
      Alert.alert('Invalid Time', 'Please enter times in HH:MM format (e.g. 22:30).');
      return;
    }
    const today = new Date().toISOString().substring(0, 10);
    const duration = calculateDuration(bedtime, wakeTime);
    await logSleep({
      bedtime: `${today}T${bedtime}:00`,
      wake_time: `${today}T${wakeTime}:00`,
      duration_minutes: duration,
      quality,
      caffeine_cutoff_time: caffeineCutoff,
      screen_cutoff_time: screenCutoff,
    });
    const storeError = useSleepStore.getState().error;
    if (storeError) {
      Alert.alert('Save Failed', storeError);
      return;
    }
    await hapticSuccess();
    showToast('Sleep logged', { subtext: 'Check your readiness score tomorrow' });
    setShowLogModal(false);
  }, [bedtime, wakeTime, quality, caffeineCutoff, screenCutoff, logSleep, calculateDuration, showToast]);

  const chartData = useMemo(
    () => {
      const qualityMap = (q: number): 'poor' | 'fair' | 'good' | 'excellent' => {
        if (q <= 1) return 'poor';
        if (q <= 2) return 'fair';
        if (q <= 3) return 'good';
        return 'excellent';
      };
      return sleepHistory
        .filter((s) => s.duration_minutes != null)
        .map((s) => ({
          date: s.created_at ?? s.bedtime,
          duration: (s.duration_minutes ?? 0) / 60,
          quality: qualityMap(s.quality ?? 3),
        }))
        .reverse();
    },
    [sleepHistory],
  );

  const avgSleep = useMemo(() => {
    if (sleepHistory.length === 0) return 0;
    const total = sleepHistory.reduce(
      (sum, s) => sum + (s.duration_minutes ?? 0),
      0,
    );
    return total / sleepHistory.length;
  }, [sleepHistory]);

  const avgQuality = useMemo(() => {
    const withQuality = sleepHistory.filter((s) => s.quality != null);
    if (withQuality.length === 0) return 0;
    return (
      withQuality.reduce((sum, s) => sum + (s.quality ?? 0), 0) /
      withQuality.length
    );
  }, [sleepHistory]);

  const sleepScore = useMemo(() => {
    const durationScore = Math.min(avgSleep / 480, 1) * 50;
    const qualityScore = (avgQuality / 5) * 50;
    return Math.round(durationScore + qualityScore);
  }, [avgSleep, avgQuality]);

  const aiRecommendation = lastSleep?.ai_sleep_recommendation ?? null;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <StatusBar style="light" backgroundColor="#0C0A15" />
      <ActionToast
        message={toast.message}
        subtext={toast.subtext}
        visible={toast.visible}
        onHide={hideToast}
        type={toast.type}
      />
      <ScrollView
        contentContainerStyle={[styles.content, { padding: spacing.lg, paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent.primary}
          />
        }
      >
        <AIInsightCard screenKey="goals/sleep" style={{ marginBottom: spacing.md }} />

        {isLoading ? (
          <View style={{ gap: spacing.md }}>
            <Skeleton variant="card" height={120} style={{ marginBottom: spacing.md }} />
            <Skeleton variant="card" height={80} style={{ marginBottom: spacing.md }} />
            <Skeleton variant="card" height={200} style={{ marginBottom: spacing.md }} />
            <Skeleton variant="card" height={120} />
          </View>
        ) : sleepHistory.length === 0 ? (
          <EmptyState
            ionIcon="moon-outline"
            title="Sleep is where you grow"
            subtitle="Log your sleep to unlock AI-powered recovery insights and optimize your performance."
            actionLabel="Log Last Night's Sleep"
            onAction={() => { hapticLight(); setShowLogModal(true); }}
          />
        ) : (
        <>

        {/* Sleep Score */}
        <Animated.View entering={FadeInDown.delay(100)}>
          <Card variant="elevated">
            <View style={styles.scoreSection}>
              <View
                style={[
                  styles.scoreBadge,
                  {
                    backgroundColor:
                      sleepScore >= 80
                        ? `${colors.accent.success}20`
                        : sleepScore >= 50
                          ? `${colors.accent.warning}20`
                          : `${colors.accent.danger}20`,
                    borderRadius: 40,
                  },
                ]}
              >
                <Text
                  style={[
                    typography.stat,
                    {
                      color:
                        sleepScore >= 80
                          ? colors.accent.success
                          : sleepScore >= 50
                            ? colors.accent.warning
                            : colors.accent.danger,
                    },
                  ]}
                >
                  {sleepScore}
                </Text>
              </View>
              <Text
                style={[
                  typography.caption,
                  { color: colors.text.secondary, marginTop: spacing.sm },
                ]}
              >
                Sleep Score
              </Text>
            </View>
          </Card>
        </Animated.View>

        {/* Stats Row */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <View style={[styles.statsRow, { marginTop: spacing.lg, gap: spacing.md }]}>
            <Card style={{ flex: 1 }}>
              <Text style={[typography.captionBold, { color: colors.text.secondary }]}>
                Avg Sleep
              </Text>
              <Text style={[typography.statSmall, { color: colors.text.primary }]}>
                {formatDuration(Math.round(avgSleep))}
              </Text>
            </Card>
            <Card style={{ flex: 1 }}>
              <Text style={[typography.captionBold, { color: colors.text.secondary }]}>
                Avg Quality
              </Text>
              <Text style={[typography.statSmall, { color: colors.text.primary }]}>
                {avgQuality.toFixed(1)}/5
              </Text>
              <Text style={[typography.tiny, { color: colors.text.muted }]}>
                {QUALITY_LABELS[Math.round(avgQuality)] ?? ''}
              </Text>
            </Card>
          </View>
        </Animated.View>

        {/* Sleep Chart */}
        <Animated.View entering={FadeInDown.delay(300)}>
          <Text
            style={[
              typography.h3,
              {
                color: colors.text.primary,
                marginTop: spacing.xl,
                marginBottom: spacing.md,
              },
            ]}
          >
            Last 14 Days
          </Text>
          <Card>
            <SleepChart data={chartData} targetHours={8} />
          </Card>
        </Animated.View>

        {/* AI Recommendation */}
        {aiRecommendation && (
          <Animated.View entering={FadeInDown.delay(400)}>
            <Card
              style={{
                marginTop: spacing.lg,
                borderWidth: 1,
                borderColor: colors.accent.primary,
              }}
            >
              <View style={styles.aiHeader}>
                <Text style={[typography.bodyBold, { color: colors.accent.primary }]}>
                  AI Sleep Coach
                </Text>
                <Badge label="AI" variant="info" size="sm" />
              </View>
              <Text
                style={[
                  typography.body,
                  { color: colors.text.secondary, marginTop: spacing.sm },
                ]}
              >
                {aiRecommendation}
              </Text>
            </Card>
          </Animated.View>
        )}

        {/* Last Sleep */}
        {lastSleep && (
          <Animated.View entering={FadeInDown.delay(500)}>
            <Text
              style={[
                typography.h3,
                {
                  color: colors.text.primary,
                  marginTop: spacing.xl,
                  marginBottom: spacing.md,
                },
              ]}
            >
              Last Night
            </Text>
            <Card>
              <View style={[styles.detailRow, { marginBottom: spacing.sm }]}>
                <Text style={[typography.body, { color: colors.text.secondary }]}>
                  Bedtime
                </Text>
                <Text style={[typography.monoBody, { color: colors.text.primary }]}>
                  {lastSleep.bedtime?.substring(11, 16) ?? '--:--'}
                </Text>
              </View>
              <View style={[styles.detailRow, { marginBottom: spacing.sm }]}>
                <Text style={[typography.body, { color: colors.text.secondary }]}>
                  Wake Time
                </Text>
                <Text style={[typography.monoBody, { color: colors.text.primary }]}>
                  {lastSleep.wake_time?.substring(11, 16) ?? '--:--'}
                </Text>
              </View>
              <View style={[styles.detailRow, { marginBottom: spacing.sm }]}>
                <Text style={[typography.body, { color: colors.text.secondary }]}>
                  Duration
                </Text>
                <Text style={[typography.monoBody, { color: colors.text.primary }]}>
                  {formatDuration(lastSleep.duration_minutes ?? 0)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[typography.body, { color: colors.text.secondary }]}>
                  Quality
                </Text>
                <View style={styles.starsRow}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <Text
                      key={i}
                      style={{
                        fontSize: 18,
                        color:
                          i < (lastSleep.quality ?? 0)
                            ? colors.accent.gold
                            : colors.background.tertiary,
                      }}
                    >
                      {'\u2605'}
                    </Text>
                  ))}
                </View>
              </View>
            </Card>
          </Animated.View>
        )}

        {/* Sleep History with Duration Badges */}
        {sleepHistory.length > 1 && (
          <Animated.View entering={FadeInDown.delay(520)}>
            <Text
              style={[
                typography.h3,
                { color: colors.text.primary, marginTop: spacing.xl, marginBottom: spacing.md },
              ]}
            >
              Sleep History
            </Text>
            {sleepHistory.slice(0, 7).map((entry) => {
              const hours = (entry.duration_minutes ?? 0) / 60;
              const badgeBg =
                hours < 6
                  ? colors.accent.danger
                  : hours < 7
                    ? colors.accent.warning
                    : colors.accent.success;
              return (
                <View
                  key={entry.id}
                  style={[
                    styles.historyRow,
                    {
                      backgroundColor: colors.background.secondary,
                      borderRadius: 10,
                      padding: spacing.md,
                      marginBottom: spacing.sm,
                    },
                  ]}
                >
                  <Text style={[typography.caption, { color: colors.text.secondary, flex: 1 }]}>
                    {entry.bedtime ? new Date(entry.bedtime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '--'}
                  </Text>
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 12,
                      backgroundColor: badgeBg,
                    }}
                  >
                    <Text style={[typography.tiny, { color: '#FFFFFF', fontWeight: '600' }]}>
                      {hours.toFixed(1)}h
                    </Text>
                  </View>
                </View>
              );
            })}
          </Animated.View>
        )}

        {/* Disclaimer */}
        {aiRecommendation && (
          <Animated.View entering={FadeInDown.delay(550)}>
            <Disclaimer type="sleep" style={{ marginTop: spacing.lg }} />
          </Animated.View>
        )}

        {/* Log Sleep Button */}
        <HelpBubble id="sleep_log" message="Log sleep to unlock AI recovery insights" position="above" />
        <Button
          title="Log Sleep"
          onPress={() => { hapticLight(); setShowLogModal(true); }}
          accessibilityLabel="Log last night's sleep"
          fullWidth
          style={{ marginTop: spacing.xl }}
        />

        <View style={{ height: 24 }} />
        </>
        )}
      </ScrollView>

      {/* Log Sleep Modal */}
      <Modal
        visible={showLogModal}
        onDismiss={() => setShowLogModal(false)}
        title="Log Sleep"
      >
        <Input
          label="Bedtime (HH:MM)"
          value={bedtime}
          onChangeText={setBedtime}
          placeholder="22:30"
        />
        <Input
          label="Wake Time (HH:MM)"
          value={wakeTime}
          onChangeText={setWakeTime}
          placeholder="06:30"
          containerStyle={{ marginTop: spacing.md }}
        />

        <Text
          style={[
            typography.captionBold,
            { color: colors.text.secondary, marginTop: spacing.lg, marginBottom: spacing.sm },
          ]}
        >
          Sleep Quality
        </Text>
        <View style={styles.starsRow}>
          {Array.from({ length: 5 }, (_, i) => (
            <Pressable key={i} onPress={() => { hapticLight(); setQuality(i + 1); }} accessibilityLabel={`Set sleep quality to ${i + 1} stars`} hitSlop={8}>
              <Text
                style={{
                  fontSize: 32,
                  color:
                    i < quality
                      ? colors.accent.gold
                      : colors.background.tertiary,
                }}
              >
                {'\u2605'}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text
          style={[
            typography.caption,
            { color: colors.text.secondary, textAlign: 'center', marginTop: spacing.xs },
          ]}
        >
          {QUALITY_LABELS[quality]}
        </Text>

        <Input
          label="Caffeine Cutoff (HH:MM)"
          value={caffeineCutoff}
          onChangeText={setCaffeineCutoff}
          placeholder="14:00"
          containerStyle={{ marginTop: spacing.lg }}
        />
        <Input
          label="Screen Cutoff (HH:MM)"
          value={screenCutoff}
          onChangeText={setScreenCutoff}
          placeholder="21:00"
          containerStyle={{ marginTop: spacing.md }}
        />

        <Button
          title="Save Sleep Log"
          onPress={handleLogSleep}
          fullWidth
          loading={isLoading}
          style={{ marginTop: spacing.xl }}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingBottom: 24 },
  scoreSection: { alignItems: 'center', paddingVertical: 8 },
  scoreBadge: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: { flexDirection: 'row' },
  aiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
