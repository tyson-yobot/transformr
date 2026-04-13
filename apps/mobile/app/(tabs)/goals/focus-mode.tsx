// =============================================================================
// TRANSFORMR -- Deep Work Focus Timer
// =============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Input } from '@components/ui/Input';
import { Chip } from '@components/ui/Chip';
import { ProgressRing } from '@components/ui/ProgressRing';
import { Modal } from '@components/ui/Modal';
import { Slider } from '@components/ui/Slider';
import { formatTimerDisplay } from '@utils/formatters';
import { hapticSuccess, hapticMedium, hapticWarning } from '@utils/haptics';
import type { FocusSession } from '@app-types/database';

type FocusCategory = NonNullable<FocusSession['category']>;

const FOCUS_CATEGORIES: { key: FocusCategory; label: string }[] = [
  { key: 'coding', label: 'Coding' },
  { key: 'business', label: 'Business' },
  { key: 'marketing', label: 'Marketing' },
  { key: 'learning', label: 'Learning' },
  { key: 'admin', label: 'Admin' },
  { key: 'creative', label: 'Creative' },
  { key: 'other', label: 'Other' },
];

type TimerPhase = 'work' | 'short_break' | 'long_break';
const POMODORO_DURATIONS: Record<TimerPhase, number> = {
  work: 25 * 60,
  short_break: 5 * 60,
  long_break: 15 * 60,
};

interface SessionRecord {
  task: string;
  category: FocusCategory;
  duration: number;
  distractions: number;
  rating: number;
  completedAt: string;
}

export default function FocusMode() {
  const { colors, typography, spacing, borderRadius } = useTheme();

  const [taskDescription, setTaskDescription] = useState('');
  const [category, setCategory] = useState<FocusCategory>('coding');
  const [phase, setPhase] = useState<TimerPhase>('work');
  const [timeRemaining, setTimeRemaining] = useState(POMODORO_DURATIONS.work);
  const [isRunning, setIsRunning] = useState(false);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [distractions, setDistractions] = useState(0);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [productivityRating, setProductivityRating] = useState(7);
  const [sessionHistory, setSessionHistory] = useState<SessionRecord[]>([]);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalDuration = POMODORO_DURATIONS[phase];
  const progress = 1 - timeRemaining / totalDuration;

  const handlePhaseComplete = useCallback(async () => {
    setIsRunning(false);
    await hapticSuccess();

    if (phase === 'work') {
      const newCount = pomodoroCount + 1;
      setPomodoroCount(newCount);

      if (newCount % 4 === 0) {
        setPhase('long_break');
        setTimeRemaining(POMODORO_DURATIONS.long_break);
      } else {
        setPhase('short_break');
        setTimeRemaining(POMODORO_DURATIONS.short_break);
      }

      setShowRatingModal(true);
    } else {
      setPhase('work');
      setTimeRemaining(POMODORO_DURATIONS.work);
    }
  }, [phase, pomodoroCount]);

  const handlePhaseCompleteRef = useRef(handlePhaseComplete);
  handlePhaseCompleteRef.current = handlePhaseComplete;

  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            void handlePhaseCompleteRef.current();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, timeRemaining]);

  const handleStart = useCallback(() => {
    setIsRunning(true);
    hapticMedium();
  }, []);

  const handlePause = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setPhase('work');
    setTimeRemaining(POMODORO_DURATIONS.work);
    setDistractions(0);
  }, []);

  const handleDistraction = useCallback(async () => {
    setDistractions((prev) => prev + 1);
    await hapticWarning();
  }, []);

  const handleSaveRating = useCallback(() => {
    const record: SessionRecord = {
      task: taskDescription || 'Untitled session',
      category,
      duration: POMODORO_DURATIONS.work,
      distractions,
      rating: productivityRating,
      completedAt: new Date().toISOString(),
    };
    setSessionHistory((prev) => [record, ...prev]);
    setDistractions(0);
    setShowRatingModal(false);
  }, [taskDescription, category, distractions, productivityRating]);

  const phaseColor = useMemo(() => {
    switch (phase) {
      case 'work':
        return colors.accent.primary;
      case 'short_break':
        return colors.accent.success;
      case 'long_break':
        return colors.accent.info;
    }
  }, [phase, colors]);

  const phaseLabel = useMemo(() => {
    switch (phase) {
      case 'work':
        return 'Focus Time';
      case 'short_break':
        return 'Short Break';
      case 'long_break':
        return 'Long Break';
    }
  }, [phase]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { padding: spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        {/* DND Indicator */}
        {isRunning && (
          <Animated.View entering={FadeIn.duration(300)}>
            <View
              style={[
                styles.dndBanner,
                {
                  backgroundColor: `${colors.accent.danger}20`,
                  borderRadius: borderRadius.md,
                  padding: spacing.md,
                  marginBottom: spacing.lg,
                },
              ]}
            >
              <Text style={[typography.captionBold, { color: colors.accent.danger }]}>
                Do Not Disturb Active
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Timer */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.timerSection}>
          <Badge label={phaseLabel} variant={phase === 'work' ? 'info' : 'success'} />
          <ProgressRing
            progress={progress}
            size={220}
            strokeWidth={14}
            color={phaseColor}
            style={{ marginTop: spacing.lg }}
          >
            <Text style={[typography.hero, { color: colors.text.primary, fontSize: 44 }]}>
              {formatTimerDisplay(timeRemaining)}
            </Text>
            <Text style={[typography.caption, { color: colors.text.secondary }]}>
              #{pomodoroCount + 1} Pomodoro
            </Text>
          </ProgressRing>
        </Animated.View>

        {/* Controls */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <View style={[styles.controlRow, { marginTop: spacing.xl, gap: spacing.md }]}>
            {!isRunning ? (
              <Button
                title="Start"
                onPress={handleStart}
                style={{ flex: 1 }}
              />
            ) : (
              <Button
                title="Pause"
                onPress={handlePause}
                variant="secondary"
                style={{ flex: 1 }}
              />
            )}
            <Button
              title="Reset"
              onPress={handleReset}
              variant="outline"
              style={{ flex: 1 }}
            />
          </View>
        </Animated.View>

        {/* Task Input */}
        <Animated.View entering={FadeInDown.delay(300)}>
          <Input
            label="Task Description"
            value={taskDescription}
            onChangeText={setTaskDescription}
            placeholder="What are you working on?"
            containerStyle={{ marginTop: spacing.xl }}
          />
        </Animated.View>

        {/* Category Selector */}
        <Animated.View entering={FadeInDown.delay(400)}>
          <Text
            style={[
              typography.captionBold,
              { color: colors.text.secondary, marginTop: spacing.lg, marginBottom: spacing.sm },
            ]}
          >
            Category
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.sm }}
          >
            {FOCUS_CATEGORIES.map((c) => (
              <Chip
                key={c.key}
                label={c.label}
                selected={category === c.key}
                onPress={() => setCategory(c.key)}
              />
            ))}
          </ScrollView>
        </Animated.View>

        {/* Distraction Counter */}
        <Animated.View entering={FadeInDown.delay(500)}>
          <Card style={{ marginTop: spacing.xl }}>
            <View style={styles.distractionRow}>
              <View>
                <Text style={[typography.bodyBold, { color: colors.text.primary }]}>
                  Distractions
                </Text>
                <Text style={[typography.caption, { color: colors.text.secondary }]}>
                  Tap when you get distracted
                </Text>
              </View>
              <Pressable
                onPress={handleDistraction}
                accessibilityLabel={`Log distraction, current count ${distractions}`}
                style={[
                  styles.distractionButton,
                  {
                    backgroundColor: colors.accent.danger,
                    borderRadius: borderRadius.md,
                  },
                ]}
              >
                <Text style={[typography.statSmall, { color: '#FFFFFF' }]}>
                  {distractions}
                </Text>
              </Pressable>
            </View>
          </Card>
        </Animated.View>

        {/* Session History */}
        {sessionHistory.length > 0 && (
          <Animated.View entering={FadeInDown.delay(600)}>
            <Text
              style={[
                typography.h3,
                { color: colors.text.primary, marginTop: spacing.xl, marginBottom: spacing.md },
              ]}
            >
              Session History
            </Text>
            {sessionHistory.slice(0, 10).map((session, i) => (
              <Card key={i} style={{ marginBottom: spacing.sm }}>
                <View style={styles.sessionRow}>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[typography.bodyBold, { color: colors.text.primary }]}
                      numberOfLines={1}
                    >
                      {session.task}
                    </Text>
                    <Text style={[typography.caption, { color: colors.text.secondary }]}>
                      {Math.round(session.duration / 60)}min
                      {' \u2022 '}{session.distractions} distraction{session.distractions !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  <View style={styles.ratingBadge}>
                    <Text style={[typography.monoBody, { color: colors.accent.primary }]}>
                      {session.rating}/10
                    </Text>
                  </View>
                </View>
              </Card>
            ))}
          </Animated.View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Rating Modal */}
      <Modal
        visible={showRatingModal}
        onDismiss={() => setShowRatingModal(false)}
        title="Session Complete!"
      >
        <Text style={[typography.body, { color: colors.text.secondary, marginBottom: spacing.lg }]}>
          How productive was this session?
        </Text>
        <Slider
          value={productivityRating}
          onValueChange={setProductivityRating}
          min={1}
          max={10}
          step={1}
          label="Productivity Rating"
          fillColor={colors.accent.primary}
        />
        <Text style={[typography.caption, { color: colors.text.muted, marginTop: spacing.sm }]}>
          Distractions this session: <Text style={typography.monoBody}>{distractions}</Text>
        </Text>
        <Button
          title="Save & Continue"
          onPress={handleSaveRating}
          fullWidth
          style={{ marginTop: spacing.xl }}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingBottom: 24 },
  timerSection: { alignItems: 'center' },
  dndBanner: { alignItems: 'center' },
  controlRow: { flexDirection: 'row' },
  distractionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  distractionButton: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingBadge: { alignItems: 'center' },
});
