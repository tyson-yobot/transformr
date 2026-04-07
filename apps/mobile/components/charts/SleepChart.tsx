import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, LayoutChangeEvent } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Svg, {
  Rect,
  Line,
  Defs,
  LinearGradient,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { useTheme } from '@theme/index';
import { format } from 'date-fns';

type SleepQuality = 'poor' | 'fair' | 'good' | 'excellent';

interface SleepDataPoint {
  date: string;
  duration: number; // hours as decimal (e.g. 7.5)
  quality: SleepQuality;
  bedtime?: string;
  wakeTime?: string;
}

interface SleepChartProps {
  data: SleepDataPoint[];
  targetHours?: number;
  onBarPress?: (point: SleepDataPoint) => void;
}

const CHART_PADDING = { top: 16, right: 12, bottom: 40, left: 36 };

const QUALITY_COLORS: Record<SleepQuality, string> = {
  poor: '#EF4444',
  fair: '#F59E0B',
  good: '#6366F1',
  excellent: '#22C55E',
};

function formatDuration(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function SleepChart({
  data,
  targetHours = 8,
  onBarPress,
}: SleepChartProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const [width, setWidth] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const chartHeight = 200;

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

  const maxHours = useMemo(
    () => Math.max(targetHours + 2, ...data.map((d) => d.duration)),
    [data, targetHours],
  );

  const bars = useMemo(() => {
    if (data.length === 0 || chartArea.width <= 0) return [];
    const gap = 4;
    const barWidth = Math.max(
      (chartArea.width - (data.length - 1) * gap) / data.length,
      4,
    );

    return data.map((d, i) => {
      const barHeight = (d.duration / maxHours) * chartArea.height;
      const x = chartArea.x + i * (barWidth + gap);
      const y = chartArea.y + chartArea.height - barHeight;
      return { ...d, x, y, barWidth, barHeight };
    });
  }, [data, chartArea, maxHours]);

  const targetY = useMemo(
    () => chartArea.y + chartArea.height - (targetHours / maxHours) * chartArea.height,
    [chartArea, targetHours, maxHours],
  );

  const yLabels = useMemo(() => {
    const labels: { value: number; y: number }[] = [];
    for (let h = 0; h <= maxHours; h += 2) {
      labels.push({
        value: h,
        y: chartArea.y + chartArea.height - (h / maxHours) * chartArea.height,
      });
    }
    return labels;
  }, [maxHours, chartArea]);

  const handlePress = useCallback(
    (evt: { nativeEvent: { locationX: number } }) => {
      if (bars.length === 0) return;
      const touchX = evt.nativeEvent.locationX;
      let closest = 0;
      let minDist = Infinity;
      bars.forEach((bar, i) => {
        const dist = Math.abs(touchX - (bar.x + bar.barWidth / 2));
        if (dist < minDist) {
          minDist = dist;
          closest = i;
        }
      });
      setSelectedIdx(closest);
      onBarPress?.(data[closest]);
    },
    [bars, data, onBarPress],
  );

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {/* Tooltip */}
      {selectedIdx !== null && data[selectedIdx] && (
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
            {format(new Date(data[selectedIdx].date), 'MMM d')}
          </Text>
          <Text style={[typography.tiny, { color: colors.text.secondary }]}>
            {formatDuration(data[selectedIdx].duration)} - {data[selectedIdx].quality}
          </Text>
          {data[selectedIdx].bedtime && data[selectedIdx].wakeTime && (
            <Text style={[typography.tiny, { color: colors.text.muted }]}>
              {data[selectedIdx].bedtime} - {data[selectedIdx].wakeTime}
            </Text>
          )}
        </Animated.View>
      )}

      <Pressable onPress={handlePress}>
        <Svg width={width} height={chartHeight}>
          <Defs>
            {/* Gradient per quality */}
            {(Object.keys(QUALITY_COLORS) as SleepQuality[]).map((q) => (
              <LinearGradient key={q} id={`sleep-${q}`} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={QUALITY_COLORS[q]} stopOpacity={1} />
                <Stop offset="1" stopColor={QUALITY_COLORS[q]} stopOpacity={0.5} />
              </LinearGradient>
            ))}
          </Defs>

          {/* Grid lines and Y labels */}
          {yLabels.map((label) => (
            <React.Fragment key={label.value}>
              <Line
                x1={chartArea.x}
                y1={label.y}
                x2={chartArea.x + chartArea.width}
                y2={label.y}
                stroke={colors.border.subtle}
                strokeWidth={1}
              />
              <SvgText
                x={chartArea.x - 6}
                y={label.y + 4}
                textAnchor="end"
                fontSize={10}
                fill={colors.text.muted}
              >
                {label.value}h
              </SvgText>
            </React.Fragment>
          ))}

          {/* Target sleep line */}
          <Line
            x1={chartArea.x}
            y1={targetY}
            x2={chartArea.x + chartArea.width}
            y2={targetY}
            stroke={colors.accent.success}
            strokeWidth={1.5}
            strokeDasharray="6,4"
          />
          <SvgText
            x={chartArea.x + chartArea.width}
            y={targetY - 4}
            textAnchor="end"
            fontSize={9}
            fill={colors.accent.success}
          >
            {targetHours}h target
          </SvgText>

          {/* Bars color-coded by quality */}
          {bars.map((bar, i) => (
            <React.Fragment key={i}>
              <Rect
                x={bar.x}
                y={bar.y}
                width={bar.barWidth}
                height={Math.max(bar.barHeight, 1)}
                rx={3}
                fill={`url(#sleep-${bar.quality})`}
                opacity={selectedIdx === i ? 1 : 0.85}
                stroke={selectedIdx === i ? colors.text.primary : 'transparent'}
                strokeWidth={selectedIdx === i ? 1.5 : 0}
              />
              {/* X-axis date label */}
              <SvgText
                x={bar.x + bar.barWidth / 2}
                y={chartArea.y + chartArea.height + 16}
                textAnchor="middle"
                fontSize={9}
                fill={colors.text.muted}
              >
                {format(new Date(bar.date), 'M/d')}
              </SvgText>
              {/* Bedtime/wake labels (stacked below date) */}
              {bar.bedtime && bar.wakeTime && (
                <SvgText
                  x={bar.x + bar.barWidth / 2}
                  y={chartArea.y + chartArea.height + 28}
                  textAnchor="middle"
                  fontSize={7}
                  fill={colors.text.muted}
                >
                  {bar.bedtime}
                </SvgText>
              )}
            </React.Fragment>
          ))}
        </Svg>
      </Pressable>

      {/* Quality legend */}
      <View style={[styles.legend, { marginTop: spacing.sm }]}>
        {(Object.keys(QUALITY_COLORS) as SleepQuality[]).map((q) => (
          <View key={q} style={[styles.legendItem, { gap: spacing.xs }]}>
            <View
              style={[styles.legendDot, { backgroundColor: QUALITY_COLORS[q] }]}
            />
            <Text style={[typography.tiny, { color: colors.text.secondary }]}>
              {q.charAt(0).toUpperCase() + q.slice(1)}
            </Text>
          </View>
        ))}
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
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
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
});
