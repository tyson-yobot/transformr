import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, LayoutChangeEvent } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
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

interface MoodDataPoint {
  date: string;
  mood: number;
  energy: number;
  stress: number;
}

interface MoodChartProps {
  data: MoodDataPoint[];
  showEnergy?: boolean;
  showStress?: boolean;
  onPointPress?: (point: MoodDataPoint) => void;
}

interface MetricConfig {
  key: keyof Omit<MoodDataPoint, 'date'>;
  label: string;
  color: string;
  emoji: string;
}

const CHART_PADDING = { top: 20, right: 16, bottom: 30, left: 36 };

const MOOD_EMOJIS: Record<number, string> = {
  1: '\u{1F629}', // very sad
  2: '\u{1F61E}', // sad
  3: '\u{1F615}', // confused
  4: '\u{1F610}', // neutral
  5: '\u{1F642}', // slight smile
  6: '\u{1F60A}', // happy
  7: '\u{1F604}', // very happy
  8: '\u{1F601}', // beaming
  9: '\u{1F929}', // star eyes
  10: '\u{1F525}', // fire
};

function getMoodEmoji(value: number): string {
  const clamped = Math.max(1, Math.min(10, Math.round(value)));
  return MOOD_EMOJIS[clamped] ?? '\u{1F610}';
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

export function MoodChart({
  data,
  showEnergy = true,
  showStress = true,
  onPointPress,
}: MoodChartProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const [width, setWidth] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const chartHeight = 200;

  const metrics: MetricConfig[] = useMemo(
    () => [
      { key: 'mood', label: 'Mood', color: colors.accent.primary, emoji: '\u{1F60A}' },
      ...(showEnergy
        ? [{ key: 'energy' as const, label: 'Energy', color: colors.accent.success, emoji: '\u{26A1}' }]
        : []),
      ...(showStress
        ? [{ key: 'stress' as const, label: 'Stress', color: colors.accent.danger, emoji: '\u{1F4A5}' }]
        : []),
    ],
    [colors, showEnergy, showStress],
  );

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

  const mapPoints = useCallback(
    (values: number[]): { x: number; y: number }[] =>
      values.map((v, i) => ({
        x: chartArea.x + (i / Math.max(values.length - 1, 1)) * chartArea.width,
        y: chartArea.y + (1 - v / 10) * chartArea.height,
      })),
    [chartArea],
  );

  const seriesData = useMemo(
    () =>
      metrics.map((m) => ({
        ...m,
        points: mapPoints(data.map((d) => d[m.key])),
        path: buildSmoothPath(mapPoints(data.map((d) => d[m.key]))),
      })),
    [metrics, data, mapPoints],
  );

  // Compute averages for each metric
  const averages = useMemo(
    () =>
      metrics.map((m) => {
        const values = data.map((d) => d[m.key]);
        const avg = values.length > 0 ? values.reduce<number>((a, b) => a + b, 0) / values.length : 5;
        const y = chartArea.y + (1 - avg / 10) * chartArea.height;
        return { ...m, avg, y };
      }),
    [metrics, data, chartArea],
  );

  const xLabels = useMemo(() => {
    if (data.length < 2) return [];
    const count = Math.min(6, data.length);
    const step = Math.floor((data.length - 1) / (count - 1));
    const days = data.length > 1
      ? differenceInDays(new Date(data[data.length - 1]!.date), new Date(data[0]!.date))
      : 0;
    const fmt = days > 60 ? 'MMM d' : 'M/d';
    return Array.from({ length: count }, (_, i) => {
      const idx = Math.min(i * step, data.length - 1);
      return {
        label: format(new Date(data[idx]!.date), fmt),
        x: chartArea.x + (idx / Math.max(data.length - 1, 1)) * chartArea.width,
      };
    });
  }, [data, chartArea]);

  const handlePress = useCallback(
    (evt: { nativeEvent: { locationX: number } }) => {
      if (data.length === 0 || chartArea.width <= 0) return;
      const touchX = evt.nativeEvent.locationX;
      const ratio = Math.max(0, Math.min(1, (touchX - chartArea.x) / chartArea.width));
      const idx = Math.round(ratio * (data.length - 1));
      setSelectedIdx(idx);
      const point = data[idx];
      if (point) onPointPress?.(point);
    },
    [data, chartArea, onPointPress],
  );

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
              {format(new Date(sel.date), 'MMM d, yyyy')}
            </Text>
            <Text style={[typography.tiny, { color: colors.text.secondary }]}>
              {getMoodEmoji(sel.mood)} Mood: {sel.mood}/10
            </Text>
            <Text style={[typography.tiny, { color: colors.text.secondary }]}>
              {'\u{26A1}'} Energy: {sel.energy}/10
            </Text>
            <Text style={[typography.tiny, { color: colors.text.secondary }]}>
              {'\u{1F4A5}'} Stress: {sel.stress}/10
            </Text>
          </Animated.View>
        );
      })()}

      <Pressable onPress={handlePress}>
        <Svg width={width} height={chartHeight}>
          <Defs>
            <LinearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.accent.primary} stopOpacity={0.2} />
              <Stop offset="1" stopColor={colors.accent.primary} stopOpacity={0} />
            </LinearGradient>
          </Defs>

          {/* Grid lines */}
          {[0, 2.5, 5, 7.5, 10].map((v) => {
            const y = chartArea.y + (1 - v / 10) * chartArea.height;
            return (
              <React.Fragment key={v}>
                <Line
                  x1={chartArea.x}
                  y1={y}
                  x2={chartArea.x + chartArea.width}
                  y2={y}
                  stroke={colors.border.subtle}
                  strokeWidth={1}
                />
                <SvgText
                  x={chartArea.x - 6}
                  y={y + 4}
                  textAnchor="end"
                  fontSize={10}
                  fill={colors.text.muted}
                >
                  {v}
                </SvgText>
              </React.Fragment>
            );
          })}

          {/* X-axis labels */}
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

          {/* Mood gradient fill */}
          {seriesData[0] && seriesData[0].points.length > 1 && (() => {
            const s0 = seriesData[0]!;
            const lastPt = s0.points[s0.points.length - 1]!;
            const firstPt = s0.points[0]!;
            return (
              <Path
                d={`${s0.path} L${lastPt.x},${chartArea.y + chartArea.height} L${firstPt.x},${chartArea.y + chartArea.height} Z`}
                fill="url(#moodGrad)"
              />
            );
          })()}

          {/* Average lines */}
          {averages.map((avg) => (
            <Line
              key={`avg-${avg.key}`}
              x1={chartArea.x}
              y1={avg.y}
              x2={chartArea.x + chartArea.width}
              y2={avg.y}
              stroke={avg.color}
              strokeWidth={1}
              strokeDasharray="2,4"
              opacity={0.4}
            />
          ))}

          {/* Series lines */}
          {seriesData.map((series) =>
            series.points.length > 1 ? (
              <Path
                key={series.key}
                d={series.path}
                stroke={series.color}
                strokeWidth={series.key === 'mood' ? 2.5 : 2}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={series.key === 'mood' ? undefined : '5,3'}
              />
            ) : null,
          )}

          {/* Emoji markers at data points (mood only, spaced out) */}
          {seriesData[0]?.points.map((pt, i) => {
            // Show emoji every Nth point to avoid clutter
            const step = Math.max(1, Math.floor(data.length / 8));
            if (i % step !== 0 && i !== data.length - 1) return null;
            return (
              <SvgText
                key={`emoji-${i}`}
                x={pt.x}
                y={pt.y - 8}
                textAnchor="middle"
                fontSize={12}
              >
                {getMoodEmoji(data[i]!.mood)}
              </SvgText>
            );
          })}

          {/* Data point dots */}
          {seriesData.map((series) =>
            series.points.map((pt, i) => (
              <Circle
                key={`${series.key}-${i}`}
                cx={pt.x}
                cy={pt.y}
                r={series.key === 'mood' ? 3.5 : 2.5}
                fill={series.color}
              />
            )),
          )}

          {/* Selected indicator */}
          {selectedIdx !== null && seriesData[0]?.points[selectedIdx] && (() => {
            const selPt = seriesData[0]!.points[selectedIdx]!;
            return (
              <>
                <Line
                  x1={selPt.x}
                  y1={chartArea.y}
                  x2={selPt.x}
                  y2={chartArea.y + chartArea.height}
                  stroke={colors.text.muted}
                  strokeWidth={1}
                  strokeDasharray="3,3"
                />
                {seriesData.map((series) => {
                  const pt = series.points[selectedIdx];
                  return pt ? (
                    <Circle
                      key={`sel-${series.key}`}
                      cx={pt.x}
                      cy={pt.y}
                      r={6}
                      fill={series.color}
                      stroke={colors.background.primary}
                      strokeWidth={2}
                    />
                  ) : null;
                })}
              </>
            );
          })()}
        </Svg>
      </Pressable>

      {/* Legend */}
      <View style={[styles.legend, { marginTop: spacing.sm }]}>
        {metrics.map((m) => (
          <View key={m.key} style={[styles.legendItem, { gap: spacing.xs }]}>
            <View style={[styles.legendDot, { backgroundColor: m.color }]} />
            <Text style={[typography.tiny, { color: colors.text.secondary }]}>
              {m.label}
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
    gap: 16,
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
