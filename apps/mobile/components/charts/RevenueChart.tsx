import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, LayoutChangeEvent } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Svg, {
  Rect,
  Path,
  Line,
  Circle,
  Defs,
  LinearGradient,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { useTheme } from '@theme/index';

interface MonthlyRevenue {
  month: string;
  revenue: number;
  cumulative: number;
}

interface RevenueChartProps {
  data: MonthlyRevenue[];
  goalRevenue?: number;
  currency?: string;
  onBarPress?: (entry: MonthlyRevenue) => void;
}

const CHART_PADDING = { top: 20, right: 16, bottom: 34, left: 56 };

function formatCurrency(value: number, currency: string): string {
  if (value >= 1_000_000) return `${currency}${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${currency}${(value / 1_000).toFixed(0)}K`;
  return `${currency}${value.toFixed(0)}`;
}

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

export function RevenueChart({
  data,
  goalRevenue,
  currency = '$',
  onBarPress,
}: RevenueChartProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const [containerWidth, setContainerWidth] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const chartHeight = 220;

  const chartArea = useMemo(
    () => ({
      x: CHART_PADDING.left,
      y: CHART_PADDING.top,
      width: Math.max(containerWidth - CHART_PADDING.left - CHART_PADDING.right, 0),
      height: Math.max(chartHeight - CHART_PADDING.top - CHART_PADDING.bottom, 0),
    }),
    [containerWidth],
  );

  const maxRevenue = useMemo(() => {
    const values = data.map((d) => d.revenue);
    if (goalRevenue !== undefined) values.push(goalRevenue);
    return Math.max(...values, 1);
  }, [data, goalRevenue]);

  const maxCumulative = useMemo(() => {
    const values = data.map((d) => d.cumulative);
    return Math.max(...values, 1);
  }, [data]);

  const barWidth = useMemo(() => {
    if (data.length === 0 || chartArea.width <= 0) return 0;
    const totalGap = data.length > 1 ? (data.length - 1) * 4 : 0;
    return Math.max((chartArea.width - totalGap) / data.length, 4);
  }, [data.length, chartArea.width]);

  const bars = useMemo(() => {
    if (chartArea.width <= 0) return [];
    const gap = 4;
    return data.map((entry, i) => {
      const x = chartArea.x + i * (barWidth + gap);
      const barHeight = (entry.revenue / maxRevenue) * chartArea.height;
      const y = chartArea.y + chartArea.height - barHeight;
      return { x, y, width: barWidth, height: barHeight, entry };
    });
  }, [data, chartArea, barWidth, maxRevenue]);

  const cumulativeLine = useMemo(() => {
    if (bars.length === 0) return '';
    const points = bars.map((bar, i) => ({
      x: bar.x + bar.width / 2,
      y: chartArea.y + (1 - data[i]!.cumulative / maxCumulative) * chartArea.height,
    }));
    return buildSmoothPath(points);
  }, [bars, data, chartArea, maxCumulative]);

  const cumulativePoints = useMemo(() => {
    if (bars.length === 0) return [];
    return bars.map((bar, i) => ({
      x: bar.x + bar.width / 2,
      y: chartArea.y + (1 - data[i]!.cumulative / maxCumulative) * chartArea.height,
    }));
  }, [bars, data, chartArea, maxCumulative]);

  const goalY = useMemo(() => {
    if (goalRevenue === undefined) return null;
    return chartArea.y + (1 - goalRevenue / maxRevenue) * chartArea.height;
  }, [goalRevenue, maxRevenue, chartArea]);

  const yLabels = useMemo(() => {
    const count = 4;
    const step = maxRevenue / (count - 1);
    return Array.from({ length: count }, (_, i) => {
      const value = step * i;
      const y = chartArea.y + (1 - value / maxRevenue) * chartArea.height;
      return { value, y };
    });
  }, [maxRevenue, chartArea]);

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  }, []);

  const handlePress = useCallback(
    (evt: { nativeEvent: { locationX: number } }) => {
      if (bars.length === 0) return;
      const touchX = evt.nativeEvent.locationX;
      let closest = 0;
      let minDist = Infinity;
      bars.forEach((bar, i) => {
        const centerX = bar.x + bar.width / 2;
        const dist = Math.abs(touchX - centerX);
        if (dist < minDist) {
          minDist = dist;
          closest = i;
        }
      });
      setSelectedIdx(closest);
      onBarPress?.(data[closest]!);
    },
    [bars, data, onBarPress],
  );

  const barColor = colors.accent.primary;
  const lineColor = colors.accent.success;

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {/* Tooltip */}
      {selectedIdx !== null && data[selectedIdx] && (() => {
        const sel = data[selectedIdx]!;
        return (
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
              {sel.month}
            </Text>
            <Text style={[typography.tiny, { color: colors.text.secondary }]}>
              Revenue: {formatCurrency(sel.revenue, currency)}
            </Text>
            <Text style={[typography.tiny, { color: colors.text.secondary }]}>
              Cumulative: {formatCurrency(sel.cumulative, currency)}
            </Text>
          </Animated.View>
        );
      })()}

      <Pressable onPress={handlePress}>
        <Svg width={containerWidth} height={chartHeight}>
          <Defs>
            <LinearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={barColor} stopOpacity={1} />
              <Stop offset="1" stopColor={barColor} stopOpacity={0.6} />
            </LinearGradient>
          </Defs>

          {/* Grid lines and Y-axis labels */}
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
                {formatCurrency(label.value, currency)}
              </SvgText>
            </React.Fragment>
          ))}

          {/* Bars */}
          {bars.map((bar, i) => (
            <React.Fragment key={i}>
              <Rect
                x={bar.x}
                y={bar.y}
                width={bar.width}
                height={Math.max(bar.height, 1)}
                rx={3}
                fill={selectedIdx === i ? colors.accent.secondary : 'url(#barGrad)'}
              />
              {/* X-axis label */}
              <SvgText
                x={bar.x + bar.width / 2}
                y={chartArea.y + chartArea.height + 16}
                textAnchor="middle"
                fontSize={9}
                fill={colors.text.muted}
              >
                {bar.entry.month.length > 3
                  ? bar.entry.month.substring(0, 3)
                  : bar.entry.month}
              </SvgText>
            </React.Fragment>
          ))}

          {/* Cumulative line overlay */}
          {cumulativeLine ? (
            <Path
              d={cumulativeLine}
              stroke={lineColor}
              strokeWidth={2}
              fill="none"
              strokeLinecap="round"
            />
          ) : null}

          {/* Cumulative data points */}
          {cumulativePoints.map((pt, i) => (
            <Circle
              key={`dot-${i}`}
              cx={pt.x}
              cy={pt.y}
              r={3}
              fill={lineColor}
            />
          ))}

          {/* Goal line */}
          {goalY !== null && (
            <>
              <Line
                x1={chartArea.x}
                y1={goalY}
                x2={chartArea.x + chartArea.width}
                y2={goalY}
                stroke={colors.accent.warning}
                strokeWidth={1.5}
                strokeDasharray="6,4"
              />
              <SvgText
                x={chartArea.x + chartArea.width}
                y={goalY - 4}
                textAnchor="end"
                fontSize={10}
                fill={colors.accent.warning}
              >
                Goal
              </SvgText>
            </>
          )}

          {/* Selected indicator */}
          {selectedIdx !== null && bars[selectedIdx] && (() => {
            const selBar = bars[selectedIdx]!;
            return (
              <Line
                x1={selBar.x + selBar.width / 2}
                y1={chartArea.y}
                x2={selBar.x + selBar.width / 2}
                y2={chartArea.y + chartArea.height}
                stroke={colors.text.muted}
                strokeWidth={1}
                strokeDasharray="3,3"
              />
            );
          })()}
        </Svg>
      </Pressable>

      {/* Legend */}
      <View style={[styles.legendRow, { marginTop: spacing.sm }]}>
        <View style={[styles.legendItem, { gap: spacing.xs }]}>
          <View style={[styles.legendBox, { backgroundColor: barColor }]} />
          <Text style={[typography.tiny, { color: colors.text.secondary }]}>
            Monthly
          </Text>
        </View>
        <View style={[styles.legendItem, { gap: spacing.xs, marginLeft: spacing.lg }]}>
          <View style={[styles.legendLine, { backgroundColor: lineColor }]} />
          <Text style={[typography.tiny, { color: colors.text.secondary }]}>
            Cumulative
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
  tooltip: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 10,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendBox: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendLine: {
    width: 16,
    height: 2,
    borderRadius: 1,
  },
});
