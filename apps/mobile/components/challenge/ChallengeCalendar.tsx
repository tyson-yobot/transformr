import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@theme/index';
import type { ChallengeDailyLog } from '@app-types/database';

interface ChallengeCalendarProps {
  dailyLogs: ChallengeDailyLog[];
  totalDays: number;
}

type DayStatus = 'complete' | 'partial' | 'missed' | 'future' | 'current';

const CELLS_PER_ROW = 7;

export function ChallengeCalendar({ dailyLogs, totalDays }: ChallengeCalendarProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();

  const today = new Date().toISOString().split('T')[0];

  const dayStatusMap = useMemo(() => {
    const map = new Map<number, DayStatus>();
    const logsByDay = new Map<number, ChallengeDailyLog>();

    for (const log of dailyLogs) {
      logsByDay.set(log.day_number, log);
    }

    // Determine the current day from the last log or from log count
    const latestLogDay = dailyLogs.reduce(
      (max, log) => Math.max(max, log.day_number),
      0,
    );

    for (let day = 1; day <= totalDays; day++) {
      const log = logsByDay.get(day);

      if (day > latestLogDay + 1) {
        map.set(day, 'future');
      } else if (day === latestLogDay + 1) {
        // Current day (next expected day)
        map.set(day, 'current');
      } else if (!log) {
        map.set(day, 'missed');
      } else if (log.all_complete) {
        map.set(day, 'complete');
      } else {
        // Has a log but not all tasks done
        const tasks = log.tasks_completed;
        const completedCount = Object.values(tasks).filter(Boolean).length;
        const totalCount = Object.keys(tasks).length;

        if (totalCount > 0 && completedCount > 0) {
          map.set(day, 'partial');
        } else {
          map.set(day, 'missed');
        }
      }
    }

    return map;
  }, [dailyLogs, totalDays]);

  function getStatusColor(status: DayStatus): string {
    switch (status) {
      case 'complete':
        return colors.accent.success;
      case 'partial':
        return colors.accent.warning;
      case 'missed':
        return colors.accent.danger;
      case 'future':
        return colors.background.tertiary;
      case 'current':
        return colors.background.tertiary;
    }
  }

  // Build grid rows
  const rows: number[][] = [];
  for (let i = 0; i < totalDays; i += CELLS_PER_ROW) {
    const row: number[] = [];
    for (let j = i; j < i + CELLS_PER_ROW && j < totalDays; j++) {
      row.push(j + 1);
    }
    rows.push(row);
  }

  return (
    <View style={styles.container}>
      {/* Legend */}
      <View style={[styles.legend, { marginBottom: spacing.md }]}>
        <LegendItem color={colors.accent.success} label="Complete" />
        <LegendItem color={colors.accent.warning} label="Partial" />
        <LegendItem color={colors.accent.danger} label="Missed" />
        <LegendItem color={colors.background.tertiary} label="Future" />
      </View>

      {/* Grid */}
      <View style={styles.grid}>
        {rows.map((row, rowIdx) => (
          <View key={rowIdx} style={[styles.row, { marginBottom: spacing.xs }]}>
            {row.map((day) => {
              const status = dayStatusMap.get(day) ?? 'future';
              const isCurrent = status === 'current';
              const bgColor = getStatusColor(status);

              return (
                <View
                  key={day}
                  style={[
                    styles.cell,
                    {
                      backgroundColor: bgColor,
                      borderRadius: borderRadius.sm,
                      marginRight: spacing.xs,
                      borderWidth: isCurrent ? 2 : 0,
                      borderColor: isCurrent
                        ? colors.accent.primary
                        : 'transparent',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.cellText,
                      {
                        color:
                          status === 'future' || status === 'current'
                            ? colors.text.muted
                            : colors.text.primary,
                        fontSize: 10,
                        fontWeight: isCurrent ? '700' : '500',
                      },
                    ]}
                  >
                    {day}
                  </Text>
                </View>
              );
            })}

            {/* Fill remaining cells in last row for alignment */}
            {row.length < CELLS_PER_ROW &&
              Array.from({ length: CELLS_PER_ROW - row.length }).map((_, i) => (
                <View
                  key={`empty-${i}`}
                  style={[styles.cell, { marginRight: spacing.xs, opacity: 0 }]}
                />
              ))}
          </View>
        ))}
      </View>
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  const { colors, typography, spacing } = useTheme();

  return (
    <View style={[styles.legendItem, { marginRight: spacing.md }]}>
      <View
        style={[
          styles.legendDot,
          { backgroundColor: color, marginRight: spacing.xs },
        ]}
      />
      <Text style={[typography.tiny, { color: colors.text.muted }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  grid: {},
  row: {
    flexDirection: 'row',
  },
  cell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 44,
  },
  cellText: {
    textAlign: 'center',
  },
});
