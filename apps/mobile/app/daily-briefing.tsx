// =============================================================================
// TRANSFORMR -- Daily Briefing Screen
// =============================================================================

import {
  View,
  Text,
  ScrollView,
  FlatList,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { ProgressRing } from '@components/ui/ProgressRing';
import { ProgressBar } from '@components/ui/ProgressBar';
import { MonoText } from '@components/ui/MonoText';
import { useDailyBriefing } from '@hooks/useDailyBriefing';
import { useSettingsStore } from '@stores/settingsStore';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GAME_PLAN_CARD_WIDTH = SCREEN_WIDTH * 0.42;

const ANIMATION_BASE_DELAY = 200;
const ANIMATION_STAGGER = 150;

export default function DailyBriefingScreen() {
  const { colors, typography, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const updateSetting = useSettingsStore((s) => s.updateSetting);

  const {
    greeting,
    userName,
    countdown,
    gamePlan,
    readinessScore,
    todayDate,
    motivationMessage,
  } = useDailyBriefing();

  const handleStartDay = () => {
    updateSetting('lastBriefingDate', new Date().toDateString());
    router.replace('/(tabs)/dashboard');
  };

  const handleSkip = () => {
    updateSetting('lastBriefingDate', new Date().toDateString());
    router.replace('/(tabs)/dashboard');
  };

  const getReadinessColor = (score: number): string => {
    if (score >= 70) return '#10B981';
    if (score >= 40) return '#F59E0B';
    return '#EF4444';
  };

  const getReadinessRecommendation = (score: number): string => {
    if (score >= 80) return 'You are primed for a high-intensity session.';
    if (score >= 70) return 'Solid readiness -- train with confidence.';
    if (score >= 50) return 'Moderate readiness. Consider adjusting volume.';
    if (score >= 40) return 'Recovery is lagging. A lighter session may be wise.';
    return 'Your body needs rest. Prioritize recovery today.';
  };

  const readinessColor = getReadinessColor(readinessScore);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background.primary }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + spacing.xxl,
          paddingBottom: insets.bottom + spacing.xxxl,
          paddingHorizontal: spacing.xl,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* ================================================================= */}
      {/* Section 1 -- Greeting + Countdown                                 */}
      {/* ================================================================= */}
      <Animated.View
        entering={FadeInDown.delay(ANIMATION_BASE_DELAY).duration(500)}
        style={styles.section}
      >
        <Text style={[typography.caption, { color: colors.text.secondary }]}>
          {todayDate}
        </Text>
        <Text
          style={[
            typography.hero,
            { color: colors.text.primary, marginTop: spacing.sm },
          ]}
        >
          {greeting}
        </Text>
        {userName ? (
          <Text
            style={[
              typography.h1,
              { color: colors.accent.primary, marginTop: spacing.xs },
            ]}
          >
            {userName}
          </Text>
        ) : null}

        {countdown ? (
          <View style={[styles.countdownContainer, { marginTop: spacing.xl }]}>
            <View style={styles.countdownRow}>
              <MonoText variant="countdown" color={colors.text.primary}>
                {countdown.daysRemaining}
              </MonoText>
              <Text
                style={[
                  typography.body,
                  { color: colors.text.secondary, marginLeft: spacing.md },
                ]}
              >
                days to{'\n'}
                {countdown.goalTitle}
              </Text>
            </View>
            <ProgressBar
              progress={countdown.percentElapsed}
              color={colors.accent.primary}
              height={4}
              style={{ marginTop: spacing.md }}
            />
          </View>
        ) : null}
      </Animated.View>

      {/* ================================================================= */}
      {/* Section 2 -- Game Plan                                            */}
      {/* ================================================================= */}
      <Animated.View
        entering={FadeInDown.delay(ANIMATION_BASE_DELAY + ANIMATION_STAGGER).duration(500)}
        style={styles.section}
      >
        <Text
          style={[
            typography.h3,
            { color: colors.text.primary, marginBottom: spacing.md },
          ]}
        >
          Today's game plan
        </Text>
        <FlatList
          data={gamePlan ?? []}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, index) => `gp-${index}`}
          contentContainerStyle={{ gap: spacing.md }}
          renderItem={({ item }) => (
            <Card
              variant="outlined"
              style={{
                width: GAME_PLAN_CARD_WIDTH,
                paddingVertical: spacing.lg,
                paddingHorizontal: spacing.md,
              }}
            >
              <Text style={{ fontSize: 24, marginBottom: spacing.sm }}>
                {item.icon}
              </Text>
              <Text
                style={[
                  typography.captionBold,
                  { color: colors.text.primary },
                ]}
                numberOfLines={2}
              >
                {item.title}
              </Text>
              <Text
                style={[
                  typography.caption,
                  { color: colors.text.secondary, marginTop: spacing.xs },
                ]}
                numberOfLines={1}
              >
                {item.subtitle}
              </Text>
            </Card>
          )}
        />
      </Animated.View>

      {/* ================================================================= */}
      {/* Section 3 -- Readiness Score                                      */}
      {/* ================================================================= */}
      <Animated.View
        entering={FadeInDown.delay(ANIMATION_BASE_DELAY + ANIMATION_STAGGER * 2).duration(500)}
        style={[styles.section, styles.centered]}
      >
        <ProgressRing
          progress={readinessScore / 100}
          size={140}
          strokeWidth={12}
          color={readinessColor}
        >
          <View style={styles.ringContent}>
            <MonoText variant="stat" color={readinessColor}>
              {readinessScore}
            </MonoText>
            <Text
              style={[
                typography.tiny,
                { color: colors.text.muted, marginTop: 2 },
              ]}
            >
              READINESS
            </Text>
          </View>
        </ProgressRing>
        <Text
          style={[
            typography.body,
            {
              color: colors.text.secondary,
              textAlign: 'center',
              marginTop: spacing.lg,
              maxWidth: 280,
            },
          ]}
        >
          {getReadinessRecommendation(readinessScore)}
        </Text>
      </Animated.View>

      {/* ================================================================= */}
      {/* Section 4 -- AI Motivation                                        */}
      {/* ================================================================= */}
      <Animated.View
        entering={FadeInDown.delay(ANIMATION_BASE_DELAY + ANIMATION_STAGGER * 3).duration(500)}
        style={styles.section}
      >
        <Card variant="ai">
          <View style={{ padding: spacing.lg }}>
            <View style={styles.aiHeader}>
              <View
                style={[
                  styles.aiDot,
                  { backgroundColor: colors.accent.cyan },
                ]}
              />
              <Text
                style={[
                  typography.captionBold,
                  { color: colors.accent.cyan, marginLeft: spacing.sm },
                ]}
              >
                AI Insight
              </Text>
            </View>
            <Text
              style={[
                typography.body,
                {
                  color: colors.text.primary,
                  marginTop: spacing.md,
                  lineHeight: 24,
                },
              ]}
            >
              {motivationMessage}
            </Text>
          </View>
        </Card>
      </Animated.View>

      {/* ================================================================= */}
      {/* Section 5 -- CTA                                                  */}
      {/* ================================================================= */}
      <Animated.View
        entering={FadeInDown.delay(ANIMATION_BASE_DELAY + ANIMATION_STAGGER * 4).duration(500)}
        style={[styles.section, { gap: spacing.md }]}
      >
        <Button
          title="Start your day"
          onPress={handleStartDay}
          variant="primary"
          size="lg"
          fullWidth
        />
        <Button
          title="Skip"
          onPress={handleSkip}
          variant="ghost"
          size="md"
          fullWidth
        />
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
  section: {
    marginBottom: 32,
  },
  centered: {
    alignItems: 'center',
  },
  countdownContainer: {},
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ringContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
