import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, LayoutChangeEvent } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Svg, {
  Circle,
  Line,
  Path,
  Text as SvgText,
} from 'react-native-svg';
import { useTheme } from '@theme/index';

interface CorrelationDataPoint {
  x: number;
  y: number;
  label?: string;
}

interface CorrelationChartProps {
  data: CorrelationDataPoint[];
  xAxisLabel?: string;
  yAxisLabel?: string;
  dotColor?: string;
  trendLineColor?: string;
  onPointPress?: (point: CorrelationDataPoint) => void;
}

const CHART_PADDING = { top: 20, right: 20, bottom: 40, left: 48 };

function computeLinearRegression(
  points: CorrelationDataPoint[],
): { slope: number; intercept: number; r: number } {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: 0, r: 0 };

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  let sumY2 = 0;

  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumX2 += p.x * p.x;
    sumY2 += p.y * p.y;
  }

  const denominator = n * sumX2 - sumX * sumX;
  if (denominator === 0) return { slope: 0, intercept: sumY / n, r: 0 };

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  // Pearson correlation coefficient
  const rNumerator = n * sumXY - sumX * sumY;
  const rDenominator = Math.sqrt(
    (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY),
  );
  const r = rDenominator === 0 ? 0 : rNumerator / rDenominator;

  return { slope, intercept, r };
}

function getCorrelationStrength(r: number): string {
  const absR = Math.abs(r);
  if (absR >= 0.8) return 'Strong';
  if (absR >= 0.5) return 'Moderate';
  if (absR >= 0.3) return 'Weak';
  return 'Very weak';
}

export function CorrelationChart({
  data,
  xAxisLabel = 'Fitness',
  yAxisLabel = 'Business',
  dotColor,
  trendLineColor,
  onPointPress,
}: CorrelationChartProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const [width, setWidth] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const chartHeight = 240;

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

  const { minX, maxX, minY, maxY } = useMemo(() => {
    if (data.length === 0) return { minX: 0, maxX: 10, minY: 0, maxY: 10 };
    const xs = data.map((d) => d.x);
    const ys = data.map((d) => d.y);
    const xPad = (Math.max(...xs) - Math.min(...xs)) * 0.1 || 1;
    const yPad = (Math.max(...ys) - Math.min(...ys)) * 0.1 || 1;
    return {
      minX: Math.min(...xs) - xPad,
      maxX: Math.max(...xs) + xPad,
      minY: Math.min(...ys) - yPad,
      maxY: Math.max(...ys) + yPad,
    };
  }, [data]);

  const regression = useMemo(() => computeLinearRegression(data), [data]);

  const scatterPoints = useMemo(() => {
    const xRange = maxX - minX || 1;
    const yRange = maxY - minY || 1;
    return data.map((d) => ({
      svgX: chartArea.x + ((d.x - minX) / xRange) * chartArea.width,
      svgY: chartArea.y + (1 - (d.y - minY) / yRange) * chartArea.height,
      original: d,
    }));
  }, [data, chartArea, minX, maxX, minY, maxY]);

  const trendLinePath = useMemo(() => {
    if (data.length < 2 || chartArea.width <= 0) return '';
    const xRange = maxX - minX || 1;
    const yRange = maxY - minY || 1;

    const x1 = minX;
    const y1 = regression.slope * x1 + regression.intercept;
    const x2 = maxX;
    const y2 = regression.slope * x2 + regression.intercept;

    const svgX1 = chartArea.x + ((x1 - minX) / xRange) * chartArea.width;
    const svgY1 = chartArea.y + (1 - (y1 - minY) / yRange) * chartArea.height;
    const svgX2 = chartArea.x + ((x2 - minX) / xRange) * chartArea.width;
    const svgY2 = chartArea.y + (1 - (y2 - minY) / yRange) * chartArea.height;

    // Clamp to chart area
    const clampedY1 = Math.max(chartArea.y, Math.min(chartArea.y + chartArea.height, svgY1));
    const clampedY2 = Math.max(chartArea.y, Math.min(chartArea.y + chartArea.height, svgY2));

    return `M${svgX1},${clampedY1} L${svgX2},${clampedY2}`;
  }, [data, regression, chartArea, minX, maxX, minY, maxY]);

  const xAxisLabels = useMemo(() => {
    const count = 5;
    const range = maxX - minX;
    return Array.from({ length: count }, (_, i) => {
      const value = minX + (range * i) / (count - 1);
      const x = chartArea.x + (i / (count - 1)) * chartArea.width;
      return { value: Math.round(value * 10) / 10, x };
    });
  }, [minX, maxX, chartArea]);

  const yAxisLabels = useMemo(() => {
    const count = 5;
    const range = maxY - minY;
    return Array.from({ length: count }, (_, i) => {
      const value = minY + (range * i) / (count - 1);
      const y = chartArea.y + (1 - i / (count - 1)) * chartArea.height;
      return { value: Math.round(value * 10) / 10, y };
    });
  }, [minY, maxY, chartArea]);

  const handlePress = useCallback(
    (evt: { nativeEvent: { locationX: number; locationY: number } }) => {
      if (scatterPoints.length === 0) return;
      const touchX = evt.nativeEvent.locationX;
      const touchY = evt.nativeEvent.locationY;

      let closest = 0;
      let minDist = Infinity;
      scatterPoints.forEach((pt, i) => {
        const dist = Math.sqrt(
          Math.pow(touchX - pt.svgX, 2) + Math.pow(touchY - pt.svgY, 2),
        );
        if (dist < minDist) {
          minDist = dist;
          closest = i;
        }
      });

      if (minDist < 40) {
        setSelectedIdx(closest);
        const closestEntry = data[closest];
        if (closestEntry) onPointPress?.(closestEntry);
      } else {
        setSelectedIdx(null);
      }
    },
    [scatterPoints, data, onPointPress],
  );

  const pointColor = dotColor ?? colors.accent.primary;
  const lineColor = trendLineColor ?? colors.accent.warning;

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {/* Correlation coefficient display */}
      <View style={[styles.coefficientRow, { marginBottom: spacing.sm }]}>
        <Text style={[typography.captionBold, { color: colors.text.primary }]}>
          r = {regression.r.toFixed(3)}
        </Text>
        <Text
          style={[
            typography.tiny,
            {
              color:
                Math.abs(regression.r) >= 0.5
                  ? colors.accent.success
                  : colors.text.secondary,
              marginLeft: spacing.sm,
            },
          ]}
        >
          {getCorrelationStrength(regression.r)}{' '}
          {regression.r >= 0 ? 'positive' : 'negative'}
        </Text>
      </View>

      {/* Tooltip */}
      {selectedIdx !== null && data[selectedIdx] && (() => {
        const sel = data[selectedIdx];
        if (!sel) return null;
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
            {sel.label && (
              <Text style={[typography.captionBold, { color: colors.text.primary }]}>
                {sel.label}
              </Text>
            )}
            <Text style={[typography.tiny, { color: colors.text.secondary }]}>
              {xAxisLabel}: {sel.x}
            </Text>
            <Text style={[typography.tiny, { color: colors.text.secondary }]}>
              {yAxisLabel}: {sel.y}
            </Text>
          </Animated.View>
        );
      })()}

      <Pressable onPress={handlePress}>
        <Svg width={width} height={chartHeight}>
          {/* Grid lines */}
          {yAxisLabels.map((label, i) => (
            <React.Fragment key={`y-${i}`}>
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
                {label.value}
              </SvgText>
            </React.Fragment>
          ))}

          {xAxisLabels.map((label, i) => (
            <React.Fragment key={`x-${i}`}>
              <Line
                x1={label.x}
                y1={chartArea.y}
                x2={label.x}
                y2={chartArea.y + chartArea.height}
                stroke={colors.border.subtle}
                strokeWidth={1}
              />
              <SvgText
                x={label.x}
                y={chartArea.y + chartArea.height + 16}
                textAnchor="middle"
                fontSize={10}
                fill={colors.text.muted}
              >
                {label.value}
              </SvgText>
            </React.Fragment>
          ))}

          {/* Axis labels */}
          <SvgText
            x={chartArea.x + chartArea.width / 2}
            y={chartArea.y + chartArea.height + 32}
            textAnchor="middle"
            fontSize={11}
            fontWeight="600"
            fill={colors.text.secondary}
          >
            {xAxisLabel}
          </SvgText>
          <SvgText
            x={12}
            y={chartArea.y + chartArea.height / 2}
            textAnchor="middle"
            fontSize={11}
            fontWeight="600"
            fill={colors.text.secondary}
            transform={`rotate(-90, 12, ${chartArea.y + chartArea.height / 2})`}
          >
            {yAxisLabel}
          </SvgText>

          {/* Trend line */}
          {trendLinePath ? (
            <Path
              d={trendLinePath}
              stroke={lineColor}
              strokeWidth={2}
              strokeDasharray="8,4"
              fill="none"
            />
          ) : null}

          {/* Scatter dots */}
          {scatterPoints.map((pt, i) => (
            <React.Fragment key={i}>
              <Circle
                cx={pt.svgX}
                cy={pt.svgY}
                r={selectedIdx === i ? 8 : 5}
                fill={pointColor}
                opacity={selectedIdx === i ? 1 : 0.7}
                stroke={
                  selectedIdx === i ? colors.text.primary : 'transparent'
                }
                strokeWidth={selectedIdx === i ? 2 : 0}
              />
              {/* Label near point if small dataset */}
              {data.length <= 15 && pt.original.label && (
                <SvgText
                  x={pt.svgX}
                  y={pt.svgY - 10}
                  textAnchor="middle"
                  fontSize={8}
                  fill={colors.text.muted}
                >
                  {pt.original.label}
                </SvgText>
              )}
            </React.Fragment>
          ))}
        </Svg>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  coefficientRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tooltip: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 10,
  },
});
