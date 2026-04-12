import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import Svg, {
  Path,
  Circle,
  Line,
  Defs,
  LinearGradient,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { useTheme } from '@theme/index';
import { format, differenceInDays } from 'date-fns';

interface TrajectoryPoint {
  date: string;
  value: number;
}

interface TargetMarker {
  date: string;
  value: number;
  label: string;
}

interface TrajectoryChartProps {
  currentPath: TrajectoryPoint[];
  optimalPath: TrajectoryPoint[];
  currentLabel?: string;
  optimalLabel?: string;
  targets?: TargetMarker[];
  unit?: string;
  youAreHereIndex?: number;
}

const CHART_PADDING = { top: 20, right: 16, bottom: 30, left: 48 };

function buildSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M${points[0]!.x},${points[0]!.y}`;

  let path = `M${points[0]!.x},${points[0]!.y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]!;
    const curr = points[i]!;
    const cpx = (prev.x + curr.x) / 2;
    path += ` C${cpx},${prev.y} ${cpx},${curr.y} ${curr.x},${curr.y}`;
  }
  return path;
}

function buildShadedArea(
  upper: { x: number; y: number }[],
  lower: { x: number; y: number }[],
): string {
  if (upper.length === 0 || lower.length === 0) return '';

  const forwardPath = buildSmoothPath(upper);
  const reversedLower = [...lower].reverse();

  let returnPath = '';
  if (reversedLower.length > 0) {
    returnPath = ` L${reversedLower[0]!.x},${reversedLower[0]!.y}`;
    for (let i = 1; i < reversedLower.length; i++) {
      const prev = reversedLower[i - 1]!;
      const curr = reversedLower[i]!;
      const cpx = (prev.x + curr.x) / 2;
      returnPath += ` C${cpx},${prev.y} ${cpx},${curr.y} ${curr.x},${curr.y}`;
    }
  }

  return `${forwardPath}${returnPath} Z`;
}

export function TrajectoryChart({
  currentPath,
  optimalPath,
  currentLabel = 'Current',
  optimalLabel = 'Optimal',
  targets = [],
  unit = '',
  youAreHereIndex,
}: TrajectoryChartProps) {
  const { colors, typography, spacing } = useTheme();
  const [width, setWidth] = useState(0);
  const chartHeight = 220;

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    setWidth(e.nativeEvent.layout.width);
  }, []);

  const chartArea = useMemo(
    () => ({
      x: CHART_PADDING.left,
      y: CHART_PADDING.top,
      width: Math.max(width - CHART_PADDING.left - CHART_PADDING.right, 0),
      height: Math.max(chartHeight - CHART_PADDING.top - CHART_PADDING.bottom, 0),
    }),
    [width],
  );

  // Merge all dates for consistent x-axis
  const allDates = useMemo(() => {
    const dateSet = new Set<string>();
    currentPath.forEach((p) => dateSet.add(p.date));
    optimalPath.forEach((p) => dateSet.add(p.date));
    return [...dateSet].sort();
  }, [currentPath, optimalPath]);

  const { minValue, maxValue } = useMemo(() => {
    const allValues = [
      ...currentPath.map((p) => p.value),
      ...optimalPath.map((p) => p.value),
      ...targets.map((t) => t.value),
    ];
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const padding = (max - min) * 0.1 || 5;
    return { minValue: min - padding, maxValue: max + padding };
  }, [currentPath, optimalPath, targets]);

  const mapToXY = useCallback(
    (points: TrajectoryPoint[]): { x: number; y: number }[] => {
      if (allDates.length === 0 || chartArea.width <= 0) return [];
      return points.map((p) => {
        const dateIdx = allDates.indexOf(p.date);
        const xRatio = dateIdx / Math.max(allDates.length - 1, 1);
        const yRatio = (p.value - minValue) / (maxValue - minValue || 1);
        return {
          x: chartArea.x + xRatio * chartArea.width,
          y: chartArea.y + (1 - yRatio) * chartArea.height,
        };
      });
    },
    [allDates, chartArea, minValue, maxValue],
  );

  const currentPoints = useMemo(() => mapToXY(currentPath), [currentPath, mapToXY]);
  const optimalPoints = useMemo(() => mapToXY(optimalPath), [optimalPath, mapToXY]);

  const currentLine = useMemo(() => buildSmoothPath(currentPoints), [currentPoints]);
  const optimalLine = useMemo(() => buildSmoothPath(optimalPoints), [optimalPoints]);

  // Build shaded area between the two paths (for overlapping date range)
  const shadedArea = useMemo(() => {
    const currentDates = new Set(currentPath.map((p) => p.date));
    const optimalDates = new Set(optimalPath.map((p) => p.date));
    const overlapping = allDates.filter(
      (d) => currentDates.has(d) && optimalDates.has(d),
    );

    if (overlapping.length < 2) return '';

    const upperPoints: { x: number; y: number }[] = [];
    const lowerPoints: { x: number; y: number }[] = [];

    for (const date of overlapping) {
      const currentVal = currentPath.find((p) => p.date === date)?.value ?? 0;
      const optimalVal = optimalPath.find((p) => p.date === date)?.value ?? 0;
      const dateIdx = allDates.indexOf(date);
      const xRatio = dateIdx / Math.max(allDates.length - 1, 1);
      const x = chartArea.x + xRatio * chartArea.width;

      const currentY = chartArea.y + (1 - (currentVal - minValue) / (maxValue - minValue || 1)) * chartArea.height;
      const optimalY = chartArea.y + (1 - (optimalVal - minValue) / (maxValue - minValue || 1)) * chartArea.height;

      upperPoints.push({ x, y: Math.min(currentY, optimalY) });
      lowerPoints.push({ x, y: Math.max(currentY, optimalY) });
    }

    return buildShadedArea(upperPoints, lowerPoints);
  }, [currentPath, optimalPath, allDates, chartArea, minValue, maxValue]);

  // "You are here" marker
  const youAreHerePoint = useMemo(() => {
    if (youAreHereIndex === undefined || youAreHereIndex < 0) return null;
    const idx = Math.min(youAreHereIndex, currentPoints.length - 1);
    return currentPoints[idx] ?? null;
  }, [youAreHereIndex, currentPoints]);

  // Target markers
  const targetMarkerPositions = useMemo(
    () =>
      targets.map((t) => {
        const dateIdx = allDates.indexOf(t.date);
        const xRatio = dateIdx >= 0 ? dateIdx / Math.max(allDates.length - 1, 1) : 1;
        const yRatio = (t.value - minValue) / (maxValue - minValue || 1);
        return {
          ...t,
          x: chartArea.x + xRatio * chartArea.width,
          y: chartArea.y + (1 - yRatio) * chartArea.height,
        };
      }),
    [targets, allDates, chartArea, minValue, maxValue],
  );

  // Y-axis labels
  const yLabels = useMemo(() => {
    const count = 5;
    const range = maxValue - minValue;
    return Array.from({ length: count }, (_, i) => {
      const value = minValue + (range * i) / (count - 1);
      const y = chartArea.y + (1 - i / (count - 1)) * chartArea.height;
      return { value: Math.round(value * 10) / 10, y };
    });
  }, [minValue, maxValue, chartArea]);

  // X-axis labels
  const xLabels = useMemo(() => {
    if (allDates.length < 2) return [];
    const count = Math.min(5, allDates.length);
    const step = Math.floor((allDates.length - 1) / (count - 1));
    const days = differenceInDays(
      new Date(allDates[allDates.length - 1]!),
      new Date(allDates[0]!),
    );
    const fmt = days > 180 ? 'MMM yy' : 'MMM d';
    return Array.from({ length: count }, (_, i) => {
      const idx = Math.min(i * step, allDates.length - 1);
      const x = chartArea.x + (idx / Math.max(allDates.length - 1, 1)) * chartArea.width;
      return { label: format(new Date(allDates[idx]!), fmt), x };
    });
  }, [allDates, chartArea]);

  const currentColor = colors.accent.primary;
  const optimalColor = colors.accent.success;

  return (
    <View style={styles.container} onLayout={handleLayout}>
      <Svg width={width} height={chartHeight}>
        <Defs>
          <LinearGradient id="trajShade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.accent.warning} stopOpacity={0.15} />
            <Stop offset="1" stopColor={colors.accent.warning} stopOpacity={0.05} />
          </LinearGradient>
        </Defs>

        {/* Grid */}
        {yLabels.map((label, i) => (
          <React.Fragment key={i}>
            <Line
              x1={chartArea.x}
              y1={label.y}
              x2={chartArea.x + chartArea.width}
              y2={label.y}
              stroke={colors.border.subtle}
              strokeWidth={1}
            />
            <SvgText
              x={chartArea.x - 8}
              y={label.y + 4}
              textAnchor="end"
              fontSize={10}
              fill={colors.text.muted}
            >
              {label.value}{unit}
            </SvgText>
          </React.Fragment>
        ))}

        {/* X labels */}
        {xLabels.map((l, i) => (
          <SvgText
            key={i}
            x={l.x}
            y={chartArea.y + chartArea.height + 18}
            textAnchor="middle"
            fontSize={10}
            fill={colors.text.muted}
          >
            {l.label}
          </SvgText>
        ))}

        {/* Shaded area between paths */}
        {shadedArea ? (
          <Path d={shadedArea} fill="url(#trajShade)" />
        ) : null}

        {/* Optimal path (dashed) */}
        {optimalLine ? (
          <Path
            d={optimalLine}
            stroke={optimalColor}
            strokeWidth={2}
            fill="none"
            strokeDasharray="8,4"
            strokeLinecap="round"
          />
        ) : null}

        {/* Current path (solid) */}
        {currentLine ? (
          <Path
            d={currentLine}
            stroke={currentColor}
            strokeWidth={2.5}
            fill="none"
            strokeLinecap="round"
          />
        ) : null}

        {/* Target markers */}
        {targetMarkerPositions.map((t, i) => (
          <React.Fragment key={`target-${i}`}>
            <Circle
              cx={t.x}
              cy={t.y}
              r={8}
              fill={colors.accent.warning}
              opacity={0.3}
            />
            <Circle
              cx={t.x}
              cy={t.y}
              r={4}
              fill={colors.accent.warning}
            />
            <SvgText
              x={t.x}
              y={t.y - 12}
              textAnchor="middle"
              fontSize={9}
              fontWeight="600"
              fill={colors.accent.warning}
            >
              {t.label}
            </SvgText>
          </React.Fragment>
        ))}

        {/* "You are here" marker */}
        {youAreHerePoint && (
          <>
            <Circle
              cx={youAreHerePoint.x}
              cy={youAreHerePoint.y}
              r={10}
              fill={currentColor}
              opacity={0.2}
            />
            <Circle
              cx={youAreHerePoint.x}
              cy={youAreHerePoint.y}
              r={5}
              fill={currentColor}
              stroke={colors.background.primary}
              strokeWidth={2}
            />
            <SvgText
              x={youAreHerePoint.x}
              y={youAreHerePoint.y - 14}
              textAnchor="middle"
              fontSize={10}
              fontWeight="700"
              fill={colors.text.primary}
            >
              You are here
            </SvgText>
          </>
        )}
      </Svg>

      {/* Legend */}
      <View style={[styles.legend, { marginTop: spacing.sm }]}>
        <View style={[styles.legendItem, { gap: spacing.xs }]}>
          <View style={[styles.legendSolid, { backgroundColor: currentColor }]} />
          <Text style={[typography.tiny, { color: colors.text.secondary }]}>
            {currentLabel}
          </Text>
        </View>
        <View style={[styles.legendItem, { gap: spacing.xs, marginLeft: spacing.lg }]}>
          <View style={[styles.legendDashed, { borderColor: optimalColor }]} />
          <Text style={[typography.tiny, { color: colors.text.secondary }]}>
            {optimalLabel}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendSolid: {
    width: 16,
    height: 3,
    borderRadius: 1.5,
  },
  legendDashed: {
    width: 16,
    height: 0,
    borderTopWidth: 2,
    borderStyle: 'dashed',
  },
});
