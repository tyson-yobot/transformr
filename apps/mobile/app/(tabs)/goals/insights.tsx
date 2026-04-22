// =============================================================================
// TRANSFORMR -- AI Insights Screen (Module 7)
// Aggregated view of AI predictions, proactive messages, and pattern alerts.
// =============================================================================

import { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { ListSkeleton } from '@components/ui/ScreenSkeleton';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ScreenHelpButton } from '@components/ui/ScreenHelpButton';
import { SCREEN_HELP } from '../../../constants/screenHelp';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';
import { Disclaimer } from '@components/ui/Disclaimer';
import { PredictionAlert } from '@components/cards/PredictionAlert';
import { useInsightStore } from '@stores/insightStore';

export default function InsightsScreen() {
  const { colors, typography, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const predictions = useInsightStore((s) => s.predictions);
  const proactiveMessages = useInsightStore((s) => s.proactiveMessages);
  const isLoading = useInsightStore((s) => s.isLoading);
  const error = useInsightStore((s) => s.error);
  const fetchAll = useInsightStore((s) => s.fetchAll);
  const acknowledgePrediction = useInsightStore((s) => s.acknowledgePrediction);
  const dismissMessage = useInsightStore((s) => s.dismissMessage);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => <ScreenHelpButton content={SCREEN_HELP.insightsScreen} />,
    });
  }, [navigation]);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  const handleRefresh = useCallback(() => {
    void fetchAll();
  }, [fetchAll]);

  const criticalPredictions = predictions.filter((p) => p.severity === 'critical');
  const warningPredictions = predictions.filter((p) => p.severity === 'warning');
  const infoPredictions = predictions.filter((p) => p.severity === 'info');

  const unreadMessages = proactiveMessages.filter((m) => !m.is_read);
  const readMessages = proactiveMessages.filter((m) => m.is_read);

  const isEmpty =
    predictions.length === 0 && proactiveMessages.length === 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <StatusBar style="light" backgroundColor="#0C0A15" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 90 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor={colors.accent.primary}
          />
        }
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(300)}>
          <View style={[styles.headerRow, { marginBottom: spacing.lg }]}>
            <Ionicons name="analytics-outline" size={24} color={colors.accent.cyan} />
            <Text style={[typography.h2, { color: colors.text.primary, marginLeft: spacing.sm }]}>
              AI Insights
            </Text>
            {predictions.length + unreadMessages.length > 0 && (
              <Badge
                label={`${predictions.length + unreadMessages.length} new`}
                size="sm"
                variant="info"
              />
            )}
          </View>
        </Animated.View>

        {/* Loading */}
        {isLoading && isEmpty && (
          <ListSkeleton />
        )}

        {/* Error */}
        {error && (
          <Card style={{ marginBottom: spacing.lg, backgroundColor: `${colors.accent.danger}10` }}>
            <Text style={[typography.caption, { color: colors.accent.danger }]}>
              {error}
            </Text>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && isEmpty && (
          <View style={styles.emptyState}>
            <Ionicons name="sparkles" size={48} color={colors.text.muted} />
            <Text style={[typography.body, { color: colors.text.muted, marginTop: spacing.md }]}>
              No insights right now
            </Text>
            <Text style={[typography.caption, { color: colors.text.muted, marginTop: spacing.xs, textAlign: 'center' }]}>
              Keep logging your workouts, meals, and sleep — AI insights appear as patterns emerge in your data.
            </Text>
          </View>
        )}

        {/* Critical Predictions */}
        {criticalPredictions.length > 0 && (
          <>
            <Text style={[typography.captionBold, { color: colors.accent.danger, marginBottom: spacing.sm }]}>
              CRITICAL
            </Text>
            {criticalPredictions.map((p) => (
              <PredictionAlert
                key={p.id}
                title={p.title}
                body={p.body}
                severity={p.severity}
                category={p.category}
                confidence={p.confidence}
                actionLabel={p.action_label}
                actionRoute={p.action_route}
                onDismiss={() => void acknowledgePrediction(p.id)}
                style={{ marginBottom: spacing.sm }}
              />
            ))}
          </>
        )}

        {/* Warning Predictions */}
        {warningPredictions.length > 0 && (
          <>
            <Text
              style={[
                typography.captionBold,
                {
                  color: colors.accent.warning,
                  marginBottom: spacing.sm,
                  marginTop: criticalPredictions.length > 0 ? spacing.lg : 0,
                },
              ]}
            >
              WARNINGS
            </Text>
            {warningPredictions.map((p) => (
              <PredictionAlert
                key={p.id}
                title={p.title}
                body={p.body}
                severity={p.severity}
                category={p.category}
                confidence={p.confidence}
                actionLabel={p.action_label}
                actionRoute={p.action_route}
                onDismiss={() => void acknowledgePrediction(p.id)}
                style={{ marginBottom: spacing.sm }}
              />
            ))}
          </>
        )}

        {/* Info Predictions */}
        {infoPredictions.length > 0 && (
          <>
            <Text
              style={[
                typography.captionBold,
                {
                  color: colors.accent.cyan,
                  marginBottom: spacing.sm,
                  marginTop:
                    criticalPredictions.length + warningPredictions.length > 0
                      ? spacing.lg
                      : 0,
                },
              ]}
            >
              INSIGHTS
            </Text>
            {infoPredictions.map((p) => (
              <PredictionAlert
                key={p.id}
                title={p.title}
                body={p.body}
                severity={p.severity}
                category={p.category}
                confidence={p.confidence}
                actionLabel={p.action_label}
                actionRoute={p.action_route}
                onDismiss={() => void acknowledgePrediction(p.id)}
                style={{ marginBottom: spacing.sm }}
              />
            ))}
          </>
        )}

        {/* Proactive Messages */}
        {proactiveMessages.length > 0 && (
          <>
            <Text
              style={[
                typography.captionBold,
                {
                  color: colors.text.secondary,
                  marginBottom: spacing.sm,
                  marginTop: predictions.length > 0 ? spacing.xl : 0,
                },
              ]}
            >
              PROACTIVE MESSAGES
            </Text>

            {/* Unread first */}
            {unreadMessages.map((msg) => (
              <Animated.View key={msg.id} entering={FadeInDown.duration(200)}>
                <PredictionAlert
                  title={msg.title}
                  body={msg.body}
                  severity={msg.severity}
                  category={msg.category}
                  actionLabel={msg.action_label}
                  actionRoute={msg.action_url}
                  onDismiss={() => void dismissMessage(msg.id)}
                  style={{ marginBottom: spacing.sm }}
                />
              </Animated.View>
            ))}

            {/* Read messages */}
            {readMessages.map((msg) => (
              <Animated.View key={msg.id} entering={FadeInDown.duration(200)}>
                <Card style={{ marginBottom: spacing.sm, opacity: 0.6 }}>
                  <View style={styles.readMsgRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[typography.captionBold, { color: colors.text.secondary }]}>
                        {msg.title}
                      </Text>
                      <Text
                        style={[typography.caption, { color: colors.text.muted, marginTop: 2 }]}
                        numberOfLines={2}
                      >
                        {msg.body}
                      </Text>
                    </View>
                  </View>
                </Card>
              </Animated.View>
            ))}
          </>
        )}

        <Disclaimer type="general" style={{ marginTop: spacing.xl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  readMsgRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
