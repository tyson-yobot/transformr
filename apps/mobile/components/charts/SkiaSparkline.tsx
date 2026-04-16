import { useEffect, useMemo } from 'react';
import { ViewStyle } from 'react-native';
import { Canvas, Path, Skia, Group } from '@shopify/react-native-skia';
import Animated, { useSharedValue, withTiming, Easing } from 'react-native-reanimated';

interface DataPoint { value: number; }

interface SkiaSparklineProps {
  data: DataPoint[];
  color: string;
  width?: number;
  height?: number;
  strokeWidth?: number;
  showFill?: boolean;
  animated?: boolean;
  style?: ViewStyle;
}

export function SkiaSparkline({
  data, color, width = 120, height = 40,
  strokeWidth = 2, showFill = true, animated = true, style,
}: SkiaSparklineProps) {
  if (data.length < 2) return null;

  const progress = useSharedValue(animated ? 0 : 1);

  useEffect(() => {
    if (!animated) return;
    progress.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });
  }, [animated, progress]);

  const { linePath, fillPath } = useMemo(() => {
    const values = data.map((d) => d.value);
    const minV = Math.min(...values);
    const maxV = Math.max(...values);
    const range = maxV - minV || 1;
    const pad = strokeWidth + 2;
    const plotW = width - pad * 2;
    const plotH = height - pad * 2;

    const pts = values.map((v, i) => ({
      x: pad + (i / (values.length - 1)) * plotW,
      y: pad + plotH - ((v - minV) / range) * plotH,
    }));

    const line = Skia.Path.Make();
    line.moveTo(pts[0]!.x, pts[0]!.y);
    for (let i = 1; i < pts.length; i++) {
      const p = pts[i - 1]!, c = pts[i]!, cx = (p.x + c.x) / 2;
      line.cubicTo(cx, p.y, cx, c.y, c.x, c.y);
    }

    const fill = line.copy();
    fill.lineTo(pts[pts.length - 1]!.x, height - pad);
    fill.lineTo(pts[0]!.x, height - pad);
    fill.close();

    return { linePath: line, fillPath: fill };
  }, [data, width, height, strokeWidth]);

  return (
    <Canvas style={[{ width, height }, style]}>
      <Group>
        {showFill && (
          <Path path={fillPath} style="fill" color={color} opacity={0.15} />
        )}
        <Path
          path={linePath}
          style="stroke"
          strokeWidth={strokeWidth}
          strokeCap="round"
          strokeJoin="round"
          color={color}
          start={0}
          end={progress}
        />
      </Group>
    </Canvas>
  );
}
