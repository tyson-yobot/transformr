import { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  FadeInDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@theme/index';
import { Badge } from '@components/ui/Badge';
import type { ChallengeTask } from '@app-types/database';

interface DailyTaskChecklistProps {
  tasks: ChallengeTask[];
  completedTasks: Record<string, boolean>;
  autoVerified: Record<string, boolean>;
  onToggle: (taskId: string) => void;
}

interface TaskRowProps {
  task: ChallengeTask;
  isCompleted: boolean;
  isAutoVerified: boolean;
  onToggle: () => void;
  index: number;
}

function TaskRow({ task, isCompleted, isAutoVerified, onToggle, index }: TaskRowProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const checkScale = useSharedValue(1);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    checkScale.value = withSequence(
      withSpring(1.3, { damping: 6, stiffness: 300 }),
      withSpring(1, { damping: 12, stiffness: 300 }),
    );
    onToggle();
  }, [onToggle, checkScale]);

  const checkAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(300).springify()}>
      <Pressable
        onPress={handlePress}
        style={[
          styles.taskRow,
          {
            backgroundColor: isCompleted
              ? `${colors.accent.success}10`
              : colors.background.secondary,
            borderRadius: borderRadius.md,
            padding: spacing.md,
            marginBottom: spacing.sm,
            borderWidth: 1,
            borderColor: isCompleted
              ? `${colors.accent.success}30`
              : colors.border.subtle,
          },
        ]}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isCompleted }}
        accessibilityLabel={task.label}
      >
        {/* Checkbox */}
        <Animated.View
          style={[
            styles.checkbox,
            {
              width: 28,
              height: 28,
              borderRadius: borderRadius.md,
              borderWidth: 2,
              borderColor: isCompleted ? colors.accent.success : colors.border.default,
              backgroundColor: isCompleted ? colors.accent.success : 'transparent',
              marginRight: spacing.md,
            },
            checkAnimStyle,
          ]}
        >
          {isCompleted && (
            <Text style={styles.checkmark}>{'\u2713'}</Text>
          )}
        </Animated.View>

        {/* Task label */}
        <View style={styles.taskContent}>
          <Text
            style={[
              typography.body,
              {
                color: isCompleted ? colors.text.muted : colors.text.primary,
                textDecorationLine: isCompleted ? 'line-through' : 'none',
              },
            ]}
            numberOfLines={2}
          >
            {task.label}
          </Text>
        </View>

        {/* Verify indicator */}
        <View style={styles.verifySection}>
          {task.auto_verify ? (
            <View style={styles.autoIndicator}>
              <Text style={{ fontSize: 14, marginRight: 4 }}>{'\uD83E\uDD16'}</Text>
              {isAutoVerified && (
                <Badge label="Auto" variant="info" size="sm" />
              )}
            </View>
          ) : (
            <Text style={[typography.tiny, { color: colors.text.muted }]}>
              Manual
            </Text>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

export function DailyTaskChecklist({
  tasks,
  completedTasks,
  autoVerified,
  onToggle,
}: DailyTaskChecklistProps) {
  const { colors, typography, spacing } = useTheme();

  const completedCount = Object.values(completedTasks).filter(Boolean).length;
  const totalCount = tasks.length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { marginBottom: spacing.md }]}>
        <Text style={[typography.bodyBold, { color: colors.text.primary }]}>
          Today's Tasks
        </Text>
        <Text style={[typography.caption, { color: colors.text.secondary }]}>
          {completedCount}/{totalCount} complete
        </Text>
      </View>

      {/* Task list */}
      {tasks.map((task, index) => (
        <TaskRow
          key={task.id}
          task={task}
          isCompleted={!!completedTasks[task.id]}
          isAutoVerified={!!autoVerified[task.id]}
          onToggle={() => onToggle(task.id)}
          index={index}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  taskContent: {
    flex: 1,
  },
  verifySection: {
    marginLeft: 8,
    alignItems: 'flex-end',
  },
  autoIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
