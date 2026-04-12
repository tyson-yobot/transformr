import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, LayoutChangeEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  FadeIn,
} from 'react-native-reanimated';
import Svg, {
  Path,
  Line,
  Circle,
  Defs,
  LinearGradient,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { useTheme } from '@theme/index';
import {
  subDays,
  subMonths,
  subYears,
  isAfter,
  format,
  differenceInDays,
} from 'date-fns';

interface WeightDataPoint {
  date: string;
  weight: number;
}

type TimeRange = '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL';

interface WeightChartProps {
  data: WeightDataPoint[];
  goalWeight?: number;
  unit?: string;
  onDataPointPress?: (point: WeightDataPoint) => void;
}

const TIME_RANGES: TimeRange[] = ['1W', '1M', '3M', '6M', '1Y', 'ALL'];

const CHART_PADDING = { top: 20, right: 16, bottom: 30, left: 48 };

function getStartDateForRange(range: TimeRange): Date | null {
  const now = new Date();
  switch (range) {
    case '1W': return subDays(now, 7);
    case '1M': return subMonths(now, 1);
    case '3M': return subMonths(now, 3);
    case '6M': return subMonths(now, 6);
    case '1Y': return subYears(now, 1);
    case 'ALL': return null;
  }
}

function buildLinePath(
  points: { x: number; y: number }[],
  smooth: boolean = true,
): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M${points[0]!.x},${points[0]!.y}`;

  let path = `M${points[0]!.x},${points[0]!.y}`;

  if (!smooth || points.length < 3) {
    for (let i = 1; i < points.length; i++) {
      path += ` L${points[i]!.x},${points[i]!.y}`;
    }
    return path;
  }

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]!;
    const curr = points[i]!;
    const cpx = (prev.x + curr.x) / 2;
    path += ` C${cpx},${prev.y} ${cpx},${curr.y} ${curr.x},${curr.y}`;
  }

  return path;
}

export function WeightChart({
  data,
  goalWeight,
  unit = 'lbs',
  onDataPointPress,
}: WeightChartProps) {
  const { colors, typography, spacing, borderRadius, isDark } = useTheme();
  const [selectedRange, setSelectedRange] = useState<TimeRange>('3M');
  const [containerWidth, setContainerWidth] = useState(0);
  const [selectedPoint, setSelectedPoint] = useState<WeightDataPoint | null>(null);

  const chartHeight = 200;

  const filteredData = useMemo(() => {
    const startDate = getStartDateForRange(selectedRange);
    if (!startDate) return data;
    return data.filter((d) => isAfter(new Date(d.date), startDate));
  }, [data, selectedRange]);

  const chartArea = useMemo(() => ({
    x: CHART_PADDING.left,
    y: CHART_PADDING.top,
    width: Math.max(containerWidth - CHART_PADDING.left - CHART_PADDING.right, 0),
    height: Math.max(chartHeight - CHART_PADDING.top - CHART_PADDING.bottom, 0),
  }), [containerWidth]);

  const { minWeight, maxWeight, points, linePath, fillPath } = useMemo(() => {
    if (filteredData.length === 0 || chartArea.width <= 0) {
      return { minWeight: 0, maxWeight: 100, points: [], linePath: '', fillPath: '' };
    }

    const weights = filteredData.map((d) => d.weight);
    if (goalWeight !== undefined) weights.push(goalWeight);

    const min = Math.floor(Math.min(...weights) - 2);
    const max = Math.ceil(Math.max(...weights) + 2);
    const range = max - min || 1;

    const mapped = filteredData.map((d, i) => ({
      x: chartArea.x + (i / Math.max(filteredData.length - 1, 1)) * chartArea.width,
      y: chartArea.y + (1 - (d.weight - min) / range) * chartArea.height,
    }));

    const line = buildLinePath(mapped);
    const fill = mapped.length > 0
      ? `${line} L${mapped[mapped.length - 1]!.x},${chartArea.y + chartArea.height} L${mapped[0]!.x},${chartArea.y + chartArea.height} Z`
      : '';

    return { minWeight: min, maxWeight: max, points: mapped, linePath: line, fillPath: fill };
  }, [filteredData, chartArea, goalWeight]);

  const goalY = useMemo(() => {
    if (goalWeight === undefined) return null;
    const range = maxWeight - minWeight || 1;
    return chartArea.y + (1 - (goalWeight - minWeight) / range) * chartArea.height;
  }, [goalWeight, minWeight, maxWeight, chartArea]);

  const yLabels = useMemo(() => {
    const count = 4;
    const range = maxWeight - minWeight;
    const step = range / (count - 1);
    return Array.from({ length: count }, (_, i) => {
      const value = minWeight + step * i;
      const y = chartArea.y + (1 - (value - minWeight) / (range || 1)) * chartArea.height;
      return { value: Math.round(value), y };
    });
  }, [minWeight, maxWeight, chartArea]);

  const xLabels = useMemo(() => {
    if (filteredData.length < 2) return [];
    const count = Math.min(5, filteredData.length);
    const step = Math.floor((filteredData.length - 1) / (count - 1));
    return Array.from({ length: count }, (_, i) => {
      const idx = Math.min(i * step, filteredData.length - 1);
      const x = chartArea.x + (idx / Math.max(filteredData.length - 1, 1)) * chartArea.width;
      const days = differenceInDays(new Date(), new Date(filteredData[0]!.date));
      const fmt = days > 180 ? 'MMM yy' : days > 30 ? 'MMM d' : 'M/d';
      return { label: format(new Date(filteredData[idx]!.date), fmt), x };
    });
  }, [filteredData, chartArea]);

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  }, []);

  const handleChartPress = useCallback(
    (evt: { nativeEvent: { locationX: number } }) => {
      if (filteredData.length === 0 || chartArea.width <= 0) return;
      const touchX = evt.nativeEvent.locationX;
      const ratio = Math.max(0, Math.min(1, (touchX - chartArea.x) / chartArea.width));
      const idx = Math.round(ratio * (filteredData.length - 1));
      const point = filteredData[idx]!;
      setSelectedPoint(point);
      onDataPointPress?.(point);
    },
    [filteredData, chartArea, onDataPointPress],
  );

  const selectedIdx = useMemo(() => {
    if (!selectedPoint) return -1;
    return filteredData.findIndex(
      (d) => d.date === selectedPoint.date && d.weight === selectedPoint.weight,
    );
  }, [selectedPoint, filteredData]);

  const accentColor = colors.accent.primary;
  const gradientId = 'weightGradient';

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {/* Tooltip */}
      {selectedPoint && (
        <Animated.View
          entering={FadeIn.duration(200)}
          style={[
            styles.tooltip,
            {
              backgroundColor: colors.background.tertiary,
              borderRadius: borderRadius.sm,
              padding: spacing.sm,
            },
          ]}
        >
          <Text style={[typography.captionBold, { color: colors.text.primary }]}>
            {selectedPoint.weight} {unit}
          </Text>
          <Text style={[typography.tiny, { color: colors.text.secondary }]}>
            {format(new Date(selectedPoint.date), 'MMM d, yyyy')}
          </Text>
        </Animated.View>
      )}

      {/* Chart */}
      <Pressable onPress={handleChartPress}>
        <Svg width={containerWidth} height={chartHeight}>
          <Defs>
            <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={accentColor} stopOpacity={0.3} />
              <Stop offset="1" stopColor={accentColor} stopOpacity={0} />
            </LinearGradient>
          </Defs>

          {/* Grid lines */}
          {yLabels.map((label) => (
            <Line
              key={label.value}
              x1={chartArea.x}
              y1={label.y}
              x2={chartArea.x + chartArea.width}
              y2={label.y}
              stroke={colors.border.subtle}
              strokeWidth={1}
            />
          ))}

          {/* Y-axis labels */}
          {yLabels.map((label) => (
            <SvgText
              key={`label-${label.value}`}
              x={chartArea.x - 8}
              y={label.y + 4}
              textAnchor="end"
              fontSize={11}
              fill={colors.text.muted}
            >
              {label.value}
            </SvgText>
          ))}

          {/* X-axis labels */}
          {xLabels.map((label, i) => (
            <SvgText
              key={`x-${i}`}
              x={label.x}
              y={chartArea.y + chartArea.height + 18}
              textAnchor="middle"
              fontSize={10}
              fill={colors.text.muted}
            >
              {label.label}
            </SvgText>
          ))}

          {/* Gradient fill */}
          {fillPath ? <Path d={fillPath} fill={`url(#${gradientId})`} /> : null}

          {/* Weight line */}
          {linePath ? (
            <Path
              d={linePath}
              stroke={accentColor}
              strokeWidth={2.5}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}

          {/* Goal weight line */}
          {goalY !== null && (
            <>
              <Line
                x1={chartArea.x}
                y1={goalY}
                x2={chartArea.x + chartArea.width}
                y2={goalY}
                stroke={colors.accent.success}
                strokeWidth={1.5}
                strokeDasharray="6,4"
              />
              <SvgText
                x={chartArea.x + chartArea.width + 2}
                y={goalY + 4}
                fontSize={10}
                fill={colors.accent.success}
              >
                Goal
              </SvgText>
            </>
          )}

          {/* Selected point indicator */}
          {selectedIdx >= 0 && points[selectedIdx] && (() => {
            const pt = points[selectedIdx]!;
            return (
              <>
                <Line
                  x1={pt.x}
                  y1={chartArea.y}
                  x2={pt.x}
                  y2={chartArea.y + chartArea.height}
                  stroke={colors.text.muted}
                  strokeWidth={1}
                  strokeDasharray="3,3"
                />
                <Circle
                  cx={pt.x}
                  cy={pt.y}
                  r={6}
                  fill={accentColor}
                  stroke={colors.background.primary}
                  strokeWidth={2}
                />
              </>
            );
          })()}
        </Svg>
      </Pressable>

      {/* Time range selector */}
      <View style={[styles.rangeRow, { marginTop: spacing.md }]}>
        {TIME_RANGES.map((range) => {
          const isActive = range === selectedRange;
          return (
            <Pressable
              key={range}
              onPress={() => {
                setSelectedRange(range);
                setSelectedPoint(null);
              }}
              style={[
                styles.rangeButton,
                {
                  backgroundColor: isActive
                    ? accentColor
                    : colors.background.tertiary,
                  borderRadius: borderRadius.sm,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.xs,
                },
              ]}
            >
              <Text
                style={[
                  typography.captionBold,
                  { color: isActive ? '#FFFFFF' : colors.text.secondary },
                ]}
              >
                {range}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  tooltip: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 10,
    alignItems: 'center',
  },
  rangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rangeButton: {
    alignItems: 'center',
  },
});
