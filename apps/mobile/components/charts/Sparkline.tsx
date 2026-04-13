import { useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Svg, {
  Path,
  Circle,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import { useTheme } from '@theme/index';

interface SparklineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
  strokeWidth?: number;
  showFill?: boolean;
  showDot?: boolean;
  showTrendArrow?: boolean;
  style?: ViewStyle;
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

function computeTrend(data: number[]): 'up' | 'down' | 'flat' {
  if (data.length < 2) return 'flat';
  // Compare average of last third vs first third
  const third = Math.max(1, Math.floor(data.length / 3));
  const firstAvg =
    data.slice(0, third).reduce<number>((a, b) => a + b, 0) / third;
  const lastAvg =
    data.slice(-third).reduce<number>((a, b) => a + b, 0) / third;
  const diff = lastAvg - firstAvg;
  const range = Math.max(...data) - Math.min(...data) || 1;
  const threshold = range * 0.05;
  if (diff > threshold) return 'up';
  if (diff < -threshold) return 'down';
  return 'flat';
}

export function Sparkline({
  data,
  color,
  width: chartWidth = 80,
  height: chartHeight = 32,
  strokeWidth: lineWidth = 1.5,
  showFill = true,
  showDot = true,
  showTrendArrow = true,
  style,
}: SparklineProps) {
  const { colors, typography, spacing } = useTheme();

  const lineColor = color ?? colors.accent.primary;
  const gradientId = `sparkGrad-${Math.random().toString(36).substring(2, 8)}`;
  const padding = 2;

  const trend = useMemo(() => computeTrend(data), [data]);

  const trendColor = useMemo(() => {
    if (trend === 'up') return colors.accent.success;
    if (trend === 'down') return colors.accent.danger;
    return colors.text.muted;
  }, [trend, colors]);

  const { linePath, fillPath, lastPoint } = useMemo(() => {
    if (data.length === 0) {
      return { points: [], linePath: '', fillPath: '', lastPoint: null };
    }

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const drawWidth = chartWidth - padding * 2;
    const drawHeight = chartHeight - padding * 2;

    const pts = data.map((v, i) => ({
      x: padding + (i / Math.max(data.length - 1, 1)) * drawWidth,
      y: padding + (1 - (v - min) / range) * drawHeight,
    }));

    const line = buildSmoothPath(pts);
    const fill = pts.length > 1
      ? `${line} L${pts[pts.length - 1]!.x},${chartHeight - padding} L${pts[0]!.x},${chartHeight - padding} Z`
      : '';
    const last = pts[pts.length - 1] ?? null;

    return { points: pts, linePath: line, fillPath: fill, lastPoint: last };
  }, [data, chartWidth, chartHeight]);

  const trendArrow = useMemo(() => {
    if (!showTrendArrow || trend === 'flat') return null;
    return trend === 'up' ? '\u2191' : '\u2193';
  }, [showTrendArrow, trend]);

  return (
    <View style={[styles.container, { flexDirection: 'row', alignItems: 'center' }, style]}>
      <Svg width={chartWidth} height={chartHeight}>
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={lineColor} stopOpacity={0.3} />
            <Stop offset="1" stopColor={lineColor} stopOpacity={0} />
          </LinearGradient>
        </Defs>

        {/* Gradient fill below line */}
        {showFill && fillPath ? (
          <Path d={fillPath} fill={`url(#${gradientId})`} />
        ) : null}

        {/* Line */}
        {linePath ? (
          <Path
            d={linePath}
            stroke={lineColor}
            strokeWidth={lineWidth}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}

        {/* Last value dot */}
        {showDot && lastPoint && (
          <Circle
            cx={lastPoint.x}
            cy={lastPoint.y}
            r={3}
            fill={lineColor}
          />
        )}
      </Svg>

      {/* Trend arrow */}
      {trendArrow && (
        <Text
          style={[
            typography.captionBold,
            { color: trendColor, marginLeft: spacing.xs },
          ]}
        >
          {trendArrow}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
});
