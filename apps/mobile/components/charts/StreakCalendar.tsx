import { useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { useTheme } from '@theme/index';
import { useGamificationStyle } from '@hooks/useGamificationStyle';
import {
  subDays,
  format,
  startOfWeek,
  differenceInCalendarWeeks,
  isSameDay,
  isAfter,
  isBefore,
} from 'date-fns';

interface StreakDay {
  date: string;
  completed: boolean;
  count: number;
}

interface StreakCalendarProps {
  data: StreakDay[];
  days?: number;
  cellSize?: number;
  cellGap?: number;
  style?: ViewStyle;
}

function getIntensityColor(
  count: number,
  maxCount: number,
  accentColor: string,
  emptyColor: string,
  completed: boolean,
): string {
  if (!completed || count === 0) return emptyColor;
  const ratio = maxCount > 0 ? count / maxCount : 0;
  if (ratio <= 0.25) return `${accentColor}40`;
  if (ratio <= 0.5) return `${accentColor}70`;
  if (ratio <= 0.75) return `${accentColor}B0`;
  return accentColor;
}

function computeCurrentStreak(data: StreakDay[]): number {
  const sorted = [...data]
    .filter((d) => d.completed)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (sorted.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const firstDate = new Date(sorted[0]!.date);
  firstDate.setHours(0, 0, 0, 0);

  const diffFromToday = Math.round(
    (today.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  // If the most recent completed day is more than 1 day ago, streak is broken
  if (diffFromToday > 1) return 0;

  for (let i = 0; i < sorted.length; i++) {
    const expected = subDays(today, i + (diffFromToday === 1 ? 1 : 0));
    const current = new Date(sorted[i]!.date);
    current.setHours(0, 0, 0, 0);
    expected.setHours(0, 0, 0, 0);

    if (isSameDay(current, expected)) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

export function StreakCalendar({
  data,
  days = 90,
  cellSize = 14,
  cellGap = 3,
  style,
}: StreakCalendarProps) {
  const { colors, typography, spacing } = useTheme();
  const { style: gamStyle, isDrillSergeant, isMotivational } = useGamificationStyle();

  const isIntense = isDrillSergeant || isMotivational;
  const heatmapAccent = isIntense ? colors.accent.success : gamStyle.primaryColor;

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const startDate = useMemo(() => subDays(today, days - 1), [today, days]);

  const dataMap = useMemo(() => {
    const map = new Map<string, StreakDay>();
    for (const entry of data) {
      map.set(entry.date, entry);
    }
    return map;
  }, [data]);

  const maxCount = useMemo(() => {
    let max = 1;
    for (const entry of data) {
      if (entry.count > max) max = entry.count;
    }
    return max;
  }, [data]);

  const currentStreak = useMemo(() => computeCurrentStreak(data), [data]);

  const { cells, monthLabels, numWeeks } = useMemo(() => {
    const weekStart = startOfWeek(startDate, { weekStartsOn: 0 });
    const totalWeeks =
      differenceInCalendarWeeks(today, weekStart, { weekStartsOn: 0 }) + 1;
    const rows = 7;

    const cellList: {
      x: number;
      y: number;
      date: Date;
      color: string;
      isToday: boolean;
    }[] = [];

    const months: { label: string; x: number }[] = [];
    let lastMonth = -1;

    for (let week = 0; week < totalWeeks; week++) {
      for (let day = 0; day < rows; day++) {
        const cellDate = new Date(weekStart);
        cellDate.setDate(cellDate.getDate() + week * 7 + day);
        cellDate.setHours(0, 0, 0, 0);

        if (isBefore(cellDate, startDate) || isAfter(cellDate, today)) {
          continue;
        }

        const dateKey = format(cellDate, 'yyyy-MM-dd');
        const entry = dataMap.get(dateKey);
        const completed = entry?.completed ?? false;
        const count = entry?.count ?? 0;

        const color = getIntensityColor(
          count,
          maxCount,
          heatmapAccent,
          colors.background.tertiary,
          completed,
        );

        const x = week * (cellSize + cellGap);
        const y = day * (cellSize + cellGap);

        cellList.push({ x, y, date: cellDate, color, isToday: isSameDay(cellDate, today) });

        // Capture month label on the first row of each new month
        if (cellDate.getMonth() !== lastMonth && day === 0) {
          lastMonth = cellDate.getMonth();
          months.push({ label: format(cellDate, 'MMM'), x });
        }
      }
    }

    return { cells: cellList, monthLabels: months, numWeeks: totalWeeks };
  }, [startDate, today, dataMap, maxCount, cellSize, cellGap, colors, heatmapAccent]);

  const labelHeight = 18;
  const svgWidth = numWeeks * (cellSize + cellGap) - cellGap;
  const svgHeight = 7 * (cellSize + cellGap) - cellGap + labelHeight;

  return (
    <View style={[styles.container, style]}>
      {/* Streak counter */}
      <View style={[styles.streakRow, { marginBottom: spacing.md }]}>
        <Text
          style={[
            typography.statSmall,
            { color: isIntense ? colors.accent.fire : gamStyle.primaryColor },
          ]}
        >
          {isIntense ? `${currentStreak} \u{1F525}` : `${currentStreak} days`}
        </Text>
        <Text
          style={[
            typography.caption,
            { color: colors.text.secondary, marginLeft: spacing.xs },
          ]}
        >
          {gamStyle.streakLabel.replace('{count}', String(currentStreak))}
        </Text>
      </View>

      {/* Heatmap grid */}
      <View style={styles.scrollWrapper}>
        <Svg width={svgWidth} height={svgHeight}>
          {/* Month labels */}
          {monthLabels.map((m, i) => (
            <SvgText
              key={`month-${i}`}
              x={m.x}
              y={12}
              fontSize={10}
              fill={colors.text.muted}
            >
              {m.label}
            </SvgText>
          ))}

          {/* Day cells */}
          {cells.map((cell, i) => (
            <Rect
              key={i}
              x={cell.x}
              y={cell.y + labelHeight}
              width={cellSize}
              height={cellSize}
              rx={3}
              ry={3}
              fill={cell.color}
              stroke={cell.isToday ? colors.text.primary : 'transparent'}
              strokeWidth={cell.isToday ? 1.5 : 0}
            />
          ))}
        </Svg>
      </View>

      {/* Legend */}
      <View style={[styles.legendRow, { marginTop: spacing.sm }]}>
        <Text style={[typography.tiny, { color: colors.text.muted }]}>Less</Text>
        {[0, 0.25, 0.5, 0.75, 1].map((level) => (
          <View
            key={level}
            style={[
              styles.legendCell,
              {
                width: cellSize,
                height: cellSize,
                borderRadius: 3,
                backgroundColor:
                  level === 0
                    ? colors.background.tertiary
                    : `${heatmapAccent}${Math.round(level * 255)
                        .toString(16)
                        .padStart(2, '0')
                        .toUpperCase()}`,
                marginHorizontal: 2,
              },
            ]}
          />
        ))}
        <Text style={[typography.tiny, { color: colors.text.muted }]}>More</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scrollWrapper: {
    overflow: 'hidden',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  legendCell: {},
});
