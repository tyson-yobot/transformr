import { useCallback, useMemo } from 'react';
import { View, Text, ViewStyle } from 'react-native';
import Svg, { Path, G, Defs, RadialGradient, Stop, Ellipse } from 'react-native-svg';
import Animated, {
  useSharedValue, useAnimatedStyle, withSequence, withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@theme/index';

export type BodyPart =
  | 'head' | 'neck' | 'leftShoulder' | 'rightShoulder' | 'chest'
  | 'leftArm' | 'rightArm' | 'leftForearm' | 'rightForearm'
  | 'abdomen' | 'leftHip' | 'rightHip' | 'leftThigh' | 'rightThigh'
  | 'leftKnee' | 'rightKnee' | 'leftShin' | 'rightShin'
  | 'leftFoot' | 'rightFoot' | 'lowerBack';

export interface PainLevel { part: BodyPart; level: number; }
export type BodyMapMode = 'pain' | 'muscle';

export interface BodyMapProps {
  mode?: BodyMapMode;
  painLevels?: PainLevel[];
  highlightPrimary?: BodyPart[];
  highlightSecondary?: BodyPart[];
  selectedPart?: BodyPart | null;
  onSelectPart?: (part: BodyPart) => void;
  showBack?: boolean;
  size?: 'sm' | 'md' | 'lg' | number;
  style?: ViewStyle;
  /** Override the default purple accent for muscle highlighting */
  accentColor?: string;
}

const SIZE_MAP = { sm: 80, md: 160, lg: 220 } as const;
function resolveWidth(s: 'sm' | 'md' | 'lg' | number): number {
  return typeof s === 'number' ? s : SIZE_MAP[s];
}

const FRONT_PATHS: Record<BodyPart, string> = {
  head:          'M100,10 C116,10 130,23 130,42 C130,62 116,76 100,76 C84,76 70,62 70,42 C70,23 84,10 100,10 Z',
  neck:          'M88,76 C88,76 90,86 90,94 L110,94 C110,86 112,76 112,76 Z',
  leftShoulder:  'M90,94 C78,94 60,98 50,112 C44,120 44,132 50,138 C58,132 68,126 76,122 L88,106 Z',
  rightShoulder: 'M110,94 C122,94 140,98 150,112 C156,120 156,132 150,138 C142,132 132,126 124,122 L112,106 Z',
  chest:         'M88,106 C92,104 108,104 112,106 L116,150 L84,150 Z',
  leftArm:       'M50,138 C44,150 40,166 42,180 C44,190 52,194 58,190 C64,178 68,162 68,148 L76,122 Z',
  rightArm:      'M150,138 C156,150 160,166 158,180 C156,190 148,194 142,190 C136,178 132,162 132,148 L124,122 Z',
  leftForearm:   'M42,180 C40,192 40,208 44,222 C46,230 54,232 60,228 C62,214 62,198 58,190 Z',
  rightForearm:  'M158,180 C160,192 160,208 156,222 C154,230 146,232 140,228 C138,214 138,198 142,190 Z',
  abdomen:       'M84,150 L116,150 L118,196 L82,196 Z',
  leftHip:       'M82,196 L100,198 L98,224 C92,224 84,222 78,218 C74,210 74,202 82,196 Z',
  rightHip:      'M118,196 L100,198 L102,224 C108,224 116,222 122,218 C126,210 126,202 118,196 Z',
  leftThigh:     'M78,218 L98,224 L96,290 L74,286 C72,266 72,240 78,218 Z',
  rightThigh:    'M122,218 L102,224 L104,290 L126,286 C128,266 128,240 122,218 Z',
  leftKnee:      'M74,286 L96,290 L95,312 L73,308 Z',
  rightKnee:     'M104,290 L126,286 L127,308 L105,312 Z',
  leftShin:      'M73,308 L95,312 L93,378 L71,374 Z',
  rightShin:     'M105,312 L127,308 L129,374 L107,378 Z',
  leftFoot:      'M71,374 L93,378 C94,388 92,396 84,400 C76,402 66,398 62,390 C64,382 68,376 71,374 Z',
  rightFoot:     'M107,378 L129,374 C132,382 136,390 134,398 C128,406 116,406 110,400 C104,394 104,388 107,378 Z',
  lowerBack:     'M84,165 L116,165 L118,196 L82,196 Z',
};

const BACK_PATHS: Record<BodyPart, string> = {
  head:          'M100,10 C116,10 130,23 130,42 C130,62 116,76 100,76 C84,76 70,62 70,42 C70,23 84,10 100,10 Z',
  neck:          'M88,76 C88,76 90,86 90,94 L110,94 C110,86 112,76 112,76 Z',
  leftShoulder:  'M90,94 C76,90 58,96 48,110 C42,120 44,134 52,140 C58,134 66,128 74,124 L88,108 Z',
  rightShoulder: 'M110,94 C124,90 142,96 152,110 C158,120 156,134 148,140 C142,134 134,128 126,124 L112,108 Z',
  chest:         'M88,106 L112,106 L116,152 L84,152 Z',
  leftArm:       'M52,140 C44,152 40,168 42,182 C44,192 52,196 58,192 C64,180 68,164 68,150 L74,124 Z',
  rightArm:      'M148,140 C156,152 160,168 158,182 C156,192 148,196 142,192 C136,180 132,164 132,150 L126,124 Z',
  leftForearm:   'M42,182 C40,194 40,210 44,224 C46,232 54,234 60,230 C62,216 62,200 58,192 Z',
  rightForearm:  'M158,182 C160,194 160,210 156,224 C154,232 146,234 140,230 C138,216 138,200 142,192 Z',
  lowerBack:     'M82,150 L118,150 L120,200 L80,200 Z',
  abdomen:       'M84,152 L116,152 L118,168 L82,168 Z',
  leftHip:       'M80,200 L100,202 C98,228 92,238 82,240 C74,238 70,228 70,216 C70,206 74,200 80,200 Z',
  rightHip:      'M120,200 L100,202 C102,228 108,238 118,240 C126,238 130,228 130,216 C130,206 126,200 120,200 Z',
  leftThigh:     'M70,216 L96,228 L94,292 L72,288 C70,268 68,240 70,216 Z',
  rightThigh:    'M130,216 L104,228 L106,292 L128,288 C130,268 132,240 130,216 Z',
  leftKnee:      'M72,288 L94,292 L93,314 L71,310 Z',
  rightKnee:     'M106,292 L128,288 L129,310 L107,314 Z',
  leftShin:      'M71,310 L93,314 L91,380 L69,376 Z',
  rightShin:     'M107,314 L129,310 L131,376 L109,380 Z',
  leftFoot:      'M69,376 L91,380 C92,390 90,398 82,400 C74,402 64,398 60,390 C62,382 66,376 69,376 Z',
  rightFoot:     'M109,380 L131,376 C134,384 138,392 136,400 C130,406 118,406 112,400 C106,394 106,388 109,380 Z',
};

const FRONT_EXCLUDED = new Set<BodyPart>(['lowerBack']);
const BACK_EXCLUDED  = new Set<BodyPart>(['chest', 'abdomen']);

interface FigureColors {
  elevated: string; borderLight: string; borderFocus: string;
  primary: string; primaryLight: string;
  success: string; warning: string; fire: string; danger: string;
  muted: string;
}

function Figure({ paths, excluded, painMap, primary, secondary, selectedPart, onSelect, mode, width, c }: {
  paths: Record<BodyPart, string>; excluded: Set<BodyPart>;
  painMap: Map<BodyPart, number>; primary: Set<BodyPart>; secondary: Set<BodyPart>;
  selectedPart: BodyPart | null; onSelect?: (p: BodyPart) => void;
  mode: BodyMapMode; width: number; c: FigureColors;
}) {
  const height = width * 2.1;
  const parts = (Object.keys(paths) as BodyPart[]).filter((p) => !excluded.has(p));

  function getFill(part: BodyPart): string {
    if (mode === 'pain') {
      const lv = painMap.get(part) ?? 0;
      if (lv <= 0) return c.elevated;
      if (lv <= 3) return `${c.success}B0`;
      if (lv <= 5) return `${c.warning}C0`;
      if (lv <= 7) return `${c.fire}D0`;
      return `${c.danger}E8`;
    }
    if (primary.has(part))   return `${c.primary}99`;
    if (secondary.has(part)) return `${c.primaryLight}55`;
    return c.elevated;
  }

  return (
    <Svg width={width} height={height} viewBox="0 0 200 420">
      <Defs>
        <RadialGradient id="figureGlow" cx="50%" cy="30%" r="50%">
          <Stop offset="0%"   stopColor={c.primary} stopOpacity={0.04} />
          <Stop offset="100%" stopColor={c.primary} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Ellipse cx={100} cy={210} rx={90} ry={200} fill="url(#figureGlow)" />
      {parts.map((part) => {
        const isSelected = selectedPart === part;
        const f = getFill(part);
        const isActive = mode === 'pain'
          ? (painMap.get(part) ?? 0) > 0
          : primary.has(part) || secondary.has(part);
        return (
          <G key={part}>
            {(isSelected || isActive) && (
              <Path d={paths[part]} fill={isSelected ? c.borderFocus : f} opacity={0.3} transform="translate(0,1)" />
            )}
            <Path
              d={paths[part]}
              fill={f}
              stroke={isSelected ? c.borderFocus : c.borderLight}
              strokeWidth={isSelected ? 2 : 1}
              onPress={onSelect ? () => onSelect(part) : undefined}
            />
          </G>
        );
      })}
    </Svg>
  );
}

export function BodyMap({
  mode = 'pain', painLevels = [], highlightPrimary = [], highlightSecondary = [],
  selectedPart = null, onSelectPart, showBack = false, size = 'md', style,
  accentColor,
}: BodyMapProps) {
  const { colors } = useTheme();
  const containerScale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: containerScale.value }] }));

  const handlePress = useCallback((part: BodyPart) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    containerScale.value = withSequence(
      withSpring(1.04, { damping: 10, stiffness: 400 }),
      withSpring(1,    { damping: 14, stiffness: 300 }),
    );
    onSelectPart?.(part);
  }, [onSelectPart, containerScale]);

  const painMap = useMemo(() => {
    const m = new Map<BodyPart, number>();
    for (const { part, level } of painLevels) m.set(part, Math.max(0, Math.min(10, level)));
    return m;
  }, [painLevels]);

  const primary   = useMemo(() => new Set(highlightPrimary),   [highlightPrimary]);
  const secondary = useMemo(() => new Set(highlightSecondary), [highlightSecondary]);
  const w = resolveWidth(size);

  const c: FigureColors = {
    elevated:    colors.background.elevated,
    borderLight: colors.border.light,
    borderFocus: colors.border.focus,
    primary:     accentColor ?? colors.accent.primary,
    primaryLight: accentColor ? `${accentColor}99` : colors.accent.primaryLight,
    success:     colors.accent.success,
    warning:     colors.accent.warning,
    fire:        colors.accent.fire,
    danger:      colors.accent.danger,
    muted:       colors.text.muted,
  };

  const figureProps = {
    painMap, primary, secondary, selectedPart, mode, width: w, c,
    onSelect: onSelectPart ? handlePress : undefined,
  };

  const labelStyle = {
    fontSize: 11, fontWeight: '500' as const,
    color: colors.text.muted,
    marginTop: 4, letterSpacing: 0.5, textTransform: 'uppercase' as const,
  };

  if (showBack) {
    return (
      <View style={[{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center' }, style]}>
        <Animated.View style={[{ alignItems: 'center' }, animStyle]}>
          <Figure {...figureProps} paths={FRONT_PATHS} excluded={FRONT_EXCLUDED} />
          <Text style={labelStyle}>Front</Text>
        </Animated.View>
        <View style={{
          width: 1, backgroundColor: colors.border.default,
          marginHorizontal: 12, alignSelf: 'stretch', marginVertical: 20,
        }} />
        <View style={{ alignItems: 'center' }}>
          <Figure {...figureProps} paths={BACK_PATHS} excluded={BACK_EXCLUDED} />
          <Text style={labelStyle}>Back</Text>
        </View>
      </View>
    );
  }

  return (
    <Animated.View style={[animStyle, style]}>
      <Figure {...figureProps} paths={FRONT_PATHS} excluded={FRONT_EXCLUDED} />
    </Animated.View>
  );
}

