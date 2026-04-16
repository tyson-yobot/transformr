# TRANSFORMR — PHOTOREALISTIC UI UPGRADE
## Complete Claude Code Execution Prompt
### Repository Analysis: April 16, 2026 | All file paths verified against actual codebase

---

## CRITICAL CONTEXT FROM CODEBASE AUDIT

Before reading any further: **the 5 fitness bug fixes from `docs/superpowers/plans/2026-04-16-fitness-overhaul.md` are already committed.** Check `workout-player.tsx` — it already has `timerRunning`, `logCaloriesBurned`, `useLocalSearchParams`, the "+ Add Exercise" button, and calorie burn logic. **Do not re-apply those fixes.** Start at Phase 1.

**What's already solid (do NOT rewrite):**
- Theme system: all colors, typography, spacing, borderRadius tokens are correct
- All chart components exist and work: MacroRings, WeightChart, ProgressRing, StretchCalendar, etc.
- All stores (14 Zustand) are complete and wired to Supabase
- All 28 Edge Functions are deployed
- All 40 Supabase migrations exist
- The 5 workout player bug fixes are already in the code

**What's actually missing (the real work):**
1. `BodyMap.tsx` has simplified rectangular paths — needs anatomically curved paths + back view + muscle highlight mode
2. `pain-tracker.tsx` ignores `BodyMap.tsx` entirely — uses a generic Ionicons body icon with dots
3. Exercise Library has zero visual anatomy — text rows only
4. Exercise Detail has no anatomy diagram at all — muscle_groups shown as text badges
5. `MiniSparkline` on Dashboard is an empty View — never implemented
6. Skia (`@shopify/react-native-skia` v2.0.0-next.4) is installed and never used

---

## START HERE

```powershell
cd C:\dev\transformr\apps\mobile
git checkout -b feat/photorealistic-ui
npx tsc --noEmit 2>&1 | Select-String "error" | Measure-Object | Select-Object -ExpandProperty Count
```

Baseline the error count. Every phase must end with the same count or fewer. Zero by the final commit.

---

## PHASE 1 — NEW FILES TO CREATE

Create these files exactly as specified. Each file below is complete and production-ready.

### 1A. `utils/muscleMapping.ts`

```typescript
// FULL FILE CONTENT — copy verbatim:

export type BodyPart =
  | 'head' | 'neck' | 'leftShoulder' | 'rightShoulder' | 'chest'
  | 'leftArm' | 'rightArm' | 'leftForearm' | 'rightForearm'
  | 'abdomen' | 'leftHip' | 'rightHip' | 'leftThigh' | 'rightThigh'
  | 'leftKnee' | 'rightKnee' | 'leftShin' | 'rightShin'
  | 'leftFoot' | 'rightFoot' | 'lowerBack';

export const MUSCLE_TO_BODY_PARTS: Record<string, BodyPart[]> = {
  pectoralis_major: ['chest'], pectoralis_minor: ['chest'], chest: ['chest'],
  serratus_anterior: ['chest', 'abdomen'],
  deltoid_anterior: ['leftShoulder', 'rightShoulder'],
  deltoid_lateral: ['leftShoulder', 'rightShoulder'],
  deltoid_posterior: ['leftShoulder', 'rightShoulder'],
  deltoids: ['leftShoulder', 'rightShoulder'], shoulders: ['leftShoulder', 'rightShoulder'],
  latissimus_dorsi: ['lowerBack'], lats: ['lowerBack'],
  trapezius: ['leftShoulder', 'rightShoulder', 'neck'], traps: ['leftShoulder', 'rightShoulder', 'neck'],
  rhomboids: ['lowerBack'], erector_spinae: ['lowerBack'], lower_back: ['lowerBack'],
  back: ['lowerBack', 'leftShoulder', 'rightShoulder'],
  teres_major: ['lowerBack', 'leftShoulder', 'rightShoulder'],
  teres_minor: ['lowerBack', 'leftShoulder', 'rightShoulder'],
  infraspinatus: ['lowerBack', 'leftShoulder', 'rightShoulder'],
  supraspinatus: ['leftShoulder', 'rightShoulder'],
  biceps_brachii: ['leftArm', 'rightArm'], biceps: ['leftArm', 'rightArm'],
  brachialis: ['leftArm', 'rightArm'], brachioradialis: ['leftForearm', 'rightForearm'],
  triceps_brachii: ['leftArm', 'rightArm'], triceps: ['leftArm', 'rightArm'],
  triceps_long_head: ['leftArm', 'rightArm'], triceps_lateral_head: ['leftArm', 'rightArm'],
  forearms: ['leftForearm', 'rightForearm'], flexors: ['leftForearm', 'rightForearm'],
  extensors: ['leftForearm', 'rightForearm'], wrist_flexors: ['leftForearm', 'rightForearm'],
  rectus_abdominis: ['abdomen'], abs: ['abdomen'], core: ['abdomen'],
  obliques: ['abdomen', 'leftHip', 'rightHip'], transverse_abdominis: ['abdomen'],
  gluteus_maximus: ['leftHip', 'rightHip'], gluteus_medius: ['leftHip', 'rightHip'],
  gluteus_minimus: ['leftHip', 'rightHip'], glutes: ['leftHip', 'rightHip'],
  hip_flexors: ['leftHip', 'rightHip'], iliopsoas: ['leftHip', 'rightHip'], piriformis: ['leftHip', 'rightHip'],
  quadriceps: ['leftThigh', 'rightThigh'], quads: ['leftThigh', 'rightThigh'],
  rectus_femoris: ['leftThigh', 'rightThigh'], vastus_lateralis: ['leftThigh', 'rightThigh'],
  vastus_medialis: ['leftThigh', 'rightThigh'],
  hamstrings: ['leftThigh', 'rightThigh'], biceps_femoris: ['leftThigh', 'rightThigh'],
  semitendinosus: ['leftThigh', 'rightThigh'], semimembranosus: ['leftThigh', 'rightThigh'],
  adductors: ['leftThigh', 'rightThigh'], abductors: ['leftThigh', 'rightThigh'],
  inner_thigh: ['leftThigh', 'rightThigh'],
  gastrocnemius: ['leftShin', 'rightShin'], soleus: ['leftShin', 'rightShin'],
  calves: ['leftShin', 'rightShin'], tibialis_anterior: ['leftShin', 'rightShin'],
  peroneals: ['leftShin', 'rightShin'],
  full_body: ['chest','abdomen','leftShoulder','rightShoulder','leftArm','rightArm','leftThigh','rightThigh','leftShin','rightShin','lowerBack'],
  cardio: ['chest','abdomen','leftThigh','rightThigh','leftShin','rightShin'],
};

export function musclesToBodyParts(muscles: string[]): BodyPart[] {
  const parts = new Set<BodyPart>();
  for (const muscle of muscles) {
    const normalized = muscle.toLowerCase().replace(/\s+/g, '_');
    const mapped = MUSCLE_TO_BODY_PARTS[normalized];
    if (mapped) { for (const part of mapped) parts.add(part); }
  }
  return Array.from(parts);
}

export function categoryToBodyParts(category: string): BodyPart[] {
  const map: Record<string, BodyPart[]> = {
    chest:     ['chest', 'leftShoulder', 'rightShoulder', 'leftArm', 'rightArm'],
    back:      ['lowerBack', 'leftShoulder', 'rightShoulder'],
    shoulders: ['leftShoulder', 'rightShoulder'],
    biceps:    ['leftArm', 'rightArm'],
    triceps:   ['leftArm', 'rightArm'],
    legs:      ['leftThigh','rightThigh','leftShin','rightShin','leftHip','rightHip'],
    glutes:    ['leftHip', 'rightHip'],
    abs:       ['abdomen'],
    cardio:    ['chest','abdomen','leftThigh','rightThigh','leftShin','rightShin'],
    compound:  ['chest','lowerBack','leftThigh','rightThigh','leftShoulder','rightShoulder'],
    olympic:   ['chest','lowerBack','leftThigh','rightThigh','leftShoulder','rightShoulder','leftArm','rightArm'],
    mobility:  ['leftHip','rightHip','lowerBack','leftShin','rightShin'],
    stretching:['lowerBack','leftThigh','rightThigh','leftHip','rightHip'],
  };
  return map[category] ?? [];
}
```

### 1B. `components/workout/ExerciseThumbnail.tsx`

```typescript
import { memo } from 'react';
import { View, ViewStyle } from 'react-native';
import { BodyMap } from '@components/ui/BodyMap';
import { useTheme } from '@theme/index';
import { musclesToBodyParts, categoryToBodyParts } from '@utils/muscleMapping';
import type { BodyPart } from '@components/ui/BodyMap';

interface ExerciseThumbnailProps {
  muscleGroups: string[];
  category?: string;
  size?: number;
  style?: ViewStyle;
}

export const ExerciseThumbnail = memo(function ExerciseThumbnail({
  muscleGroups, category, size = 56, style,
}: ExerciseThumbnailProps) {
  const { colors, borderRadius } = useTheme();
  const primaryParts: BodyPart[] = muscleGroups.length > 0
    ? musclesToBodyParts(muscleGroups)
    : (category ? categoryToBodyParts(category) : []);

  return (
    <View
      style={[{
        width: size + 16, height: Math.round(size * 2.1) + 8,
        backgroundColor: colors.background.elevated,
        borderRadius: borderRadius.md, borderWidth: 1,
        borderColor: primaryParts.length > 0 ? `${colors.accent.primary}30` : colors.border.default,
        alignItems: 'center', justifyContent: 'center',
      }, style]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <BodyMap mode="muscle" highlightPrimary={primaryParts} size={size} />
    </View>
  );
});
```

### 1C. `components/workout/MuscleGroupTile.tsx`

```typescript
import { memo, useCallback } from 'react';
import { View, Text, Pressable, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { BodyMap } from '@components/ui/BodyMap';
import { useTheme } from '@theme/index';
import { categoryToBodyParts } from '@utils/muscleMapping';
import type { BodyPart } from '@components/ui/BodyMap';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface MuscleGroupTileProps {
  muscleGroup: string; label: string; isSelected: boolean;
  onPress: () => void; size?: number; style?: ViewStyle;
}

export const MuscleGroupTile = memo(function MuscleGroupTile({
  muscleGroup, label, isSelected, onPress, size = 80, style,
}: MuscleGroupTileProps) {
  const { colors, typography } = useTheme();
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const parts: BodyPart[] = categoryToBodyParts(muscleGroup);

  const handlePressIn = useCallback(() => { scale.value = withSpring(0.93, { damping: 12, stiffness: 400 }); }, [scale]);
  const handlePressOut = useCallback(() => { scale.value = withSpring(1.0, { damping: 14, stiffness: 300 }); }, [scale]);
  const handlePress = useCallback(() => { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }, [onPress]);

  return (
    <AnimatedPressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={handlePress}
      accessibilityRole="button" accessibilityLabel={`Filter by ${label}`}
      accessibilityState={{ selected: isSelected }}
      style={[{ alignItems: 'center', gap: 5 }, style, animated]}
    >
      <View style={{
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: isSelected ? colors.dim.primary : colors.background.secondary,
        borderWidth: isSelected ? 2 : 1,
        borderColor: isSelected ? colors.accent.primary : colors.border.default,
        shadowColor: isSelected ? colors.accent.primary : 'transparent',
        shadowOffset: { width: 0, height: 0 }, shadowOpacity: isSelected ? 0.5 : 0,
        shadowRadius: isSelected ? 10 : 0, elevation: isSelected ? 6 : 0,
        alignItems: 'center', justifyContent: 'center',
      }}>
        <BodyMap mode="muscle" highlightPrimary={parts} size={Math.round(size * 0.48)} />
      </View>
      <Text style={[typography.tiny, {
        color: isSelected ? colors.accent.primary : colors.text.secondary,
        fontWeight: isSelected ? '600' : '400', textAlign: 'center', maxWidth: 70,
      }]} numberOfLines={1}>{label}</Text>
    </AnimatedPressable>
  );
});
```

### 1D. `components/charts/SkiaSparkline.tsx`

```typescript
import { useEffect, useMemo } from 'react';
import { ViewStyle } from 'react-native';
import { Canvas, Path, Skia, Group, useValue, runTiming, Easing } from '@shopify/react-native-skia';

interface DataPoint { value: number; }
interface SkiaSparklineProps {
  data: DataPoint[]; color: string;
  width?: number; height?: number; strokeWidth?: number;
  showFill?: boolean; animated?: boolean; style?: ViewStyle;
}

export function SkiaSparkline({ data, color, width = 120, height = 40,
  strokeWidth = 2, showFill = true, animated = true, style,
}: SkiaSparklineProps) {
  if (data.length < 2) return null;

  const progress = useValue(animated ? 0 : 1);
  useEffect(() => {
    if (!animated) return;
    runTiming(progress, 1, { duration: 700, easing: Easing.out(Easing.cubic) });
  }, [animated, progress]);

  const { linePath, fillPath } = useMemo(() => {
    const values = data.map((d) => d.value);
    const minV = Math.min(...values), maxV = Math.max(...values), range = maxV - minV || 1;
    const pad = strokeWidth + 2, plotW = width - pad * 2, plotH = height - pad * 2;
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
        {showFill && <Path path={fillPath} style="fill" color={color} opacity={0.15} />}
        <Path path={linePath} style="stroke" strokeWidth={strokeWidth}
          strokeCap="round" strokeJoin="round" color={color} start={0} end={progress} />
      </Group>
    </Canvas>
  );
}
```

### 1E. `components/ui/PurpleRadialBackground.tsx`

```typescript
import { StyleSheet, useWindowDimensions } from 'react-native';
import { Canvas, Rect, RadialGradient, vec } from '@shopify/react-native-skia';
import { useTheme } from '@theme/index';

interface PurpleRadialBackgroundProps {
  opacity?: number;
  centerY?: number;
}

export function PurpleRadialBackground({ opacity = 1, centerY = 0 }: PurpleRadialBackgroundProps) {
  const { width, height } = useWindowDimensions();
  const { colors, isDark } = useTheme();
  const effectiveOpacity = (isDark ? 0.07 : 0.03) * opacity;
  const hexOpacity = Math.round(effectiveOpacity * 255).toString(16).padStart(2, '0');

  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      <Rect x={0} y={0} width={width} height={height}>
        <RadialGradient
          c={vec(width / 2, height * centerY)}
          r={width * 0.9}
          colors={[`${colors.accent.primary}${hexOpacity}`, 'transparent']}
        />
      </Rect>
    </Canvas>
  );
}
```

### 1F. `components/ui/GlowCard.tsx`

```typescript
import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, useWindowDimensions } from 'react-native';
import { Canvas, RoundedRect, BlurMask } from '@shopify/react-native-skia';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, interpolate,
} from 'react-native-reanimated';
import { useTheme } from '@theme/index';

type GlowIntensity = 'subtle' | 'medium' | 'intense';
const INTENSITY: Record<GlowIntensity, { blur: number; opacity: number }> = {
  subtle: { blur: 8, opacity: 0.35 },
  medium: { blur: 14, opacity: 0.55 },
  intense: { blur: 22, opacity: 0.75 },
};

interface GlowCardProps {
  children: React.ReactNode;
  glowColor?: string; intensity?: GlowIntensity; animated?: boolean;
  cardBorderRadius?: number; padding?: number; style?: ViewStyle; contentStyle?: ViewStyle;
}

export function GlowCard({
  children, glowColor, intensity = 'subtle', animated = false,
  cardBorderRadius = 16, padding = 16, style, contentStyle,
}: GlowCardProps) {
  const { colors } = useTheme();
  const { width: sw } = useWindowDimensions();
  const color = glowColor ?? colors.accent.primary;
  const { blur, opacity } = INTENSITY[intensity];
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (!animated) return;
    pulse.value = withRepeat(withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sine) }), -1, true);
  }, [animated, pulse]);

  const canvasAnim = useAnimatedStyle(() => !animated ? {} : ({
    opacity: interpolate(pulse.value, [0, 1], [opacity * 0.8, opacity]),
  }));

  const pad = blur + 4;

  return (
    <View style={[styles.wrapper, style]}>
      <Animated.View style={[StyleSheet.absoluteFill, { zIndex: 0 }, canvasAnim]} pointerEvents="none">
        <Canvas style={{ width: sw, height: sw, position: 'absolute', top: -pad, left: -pad }}>
          <RoundedRect x={pad} y={pad} width={sw - pad * 2} height={sw - pad * 2}
            r={cardBorderRadius} color={color} opacity={opacity} style="stroke" strokeWidth={2}>
            <BlurMask blur={blur} style="outer" respectCTM />
          </RoundedRect>
        </Canvas>
      </Animated.View>
      <View style={[{
        backgroundColor: colors.background.secondary, borderRadius: cardBorderRadius,
        borderWidth: 1, borderColor: `${color}28`, padding, zIndex: 1,
      }, contentStyle]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({ wrapper: { position: 'relative' } });
```

---

## PHASE 2 — REPLACE `components/ui/BodyMap.tsx`

This is the highest-impact single file change. Overwrite the existing file entirely.

**Critical notes before writing:**
- Keep the same `BodyPart` type export and `PainLevel` interface — they are referenced by the existing pain-tracker screen
- The existing `BodyMapProps` changes: add `mode`, `highlightPrimary`, `highlightSecondary`, `showBack`, `size` props
- The `onSelectPart` prop stays but now takes `BodyPart` (same as before)
- Zero breaking changes for existing consumers — they all used `mode='pain'` semantics by default

**New `components/ui/BodyMap.tsx` — write the complete file:**

```typescript
// =============================================================================
// TRANSFORMR — Anatomical BodyMap Component (UPGRADED)
// apps/mobile/components/ui/BodyMap.tsx — overwrite existing file
// =============================================================================

import { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
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
}

const SIZE_MAP = { sm: 80, md: 160, lg: 220 } as const;
function resolveWidth(s: 'sm' | 'md' | 'lg' | number): number {
  return typeof s === 'number' ? s : SIZE_MAP[s];
}

// Front-view anatomical SVG paths (200×420 viewBox, cubic bezier curves)
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
const BACK_EXCLUDED = new Set<BodyPart>(['chest', 'abdomen']);

function Figure({ paths, excluded, painMap, primary, secondary, selectedPart, onSelect, mode, width, colors: c }: {
  paths: Record<BodyPart, string>; excluded: Set<BodyPart>;
  painMap: Map<BodyPart, number>; primary: Set<BodyPart>; secondary: Set<BodyPart>;
  selectedPart: BodyPart | null; onSelect?: (p: BodyPart) => void;
  mode: BodyMapMode; width: number;
  colors: { elevated: string; borderLight: string; borderFocus: string; primary: string; primaryLight: string;
            success: string; warning: string; fire: string; danger: string; };
}) {
  const height = width * 2.1;
  const parts = (Object.keys(paths) as BodyPart[]).filter((p) => !excluded.has(p));

  function fill(part: BodyPart): string {
    if (mode === 'pain') {
      const lv = painMap.get(part) ?? 0;
      if (lv <= 0) return c.elevated;
      if (lv <= 3) return `${c.success}B0`;
      if (lv <= 5) return `${c.warning}C0`;
      if (lv <= 7) return `${c.fire}D0`;
      return `${c.danger}E8`;
    }
    if (primary.has(part)) return `${c.primary}99`;
    if (secondary.has(part)) return `${c.primaryLight}55`;
    return c.elevated;
  }

  return (
    <Svg width={width} height={height} viewBox="0 0 200 420">
      <Defs>
        <RadialGradient id="glow" cx="50%" cy="30%" r="50%">
          <Stop offset="0%" stopColor={c.primary} stopOpacity={0.04} />
          <Stop offset="100%" stopColor={c.primary} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Ellipse cx={100} cy={210} rx={90} ry={200} fill="url(#glow)" />
      {parts.map((part) => {
        const isSelected = selectedPart === part;
        const f = fill(part);
        const hasPainOrHighlight = mode === 'pain'
          ? (painMap.get(part) ?? 0) > 0
          : primary.has(part) || secondary.has(part);
        return (
          <G key={part}>
            {(isSelected || hasPainOrHighlight) && (
              <Path d={paths[part]} fill={isSelected ? c.borderFocus : f} opacity={0.3} transform="translate(0,1)" />
            )}
            <Path d={paths[part]} fill={f}
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
}: BodyMapProps) {
  const { colors } = useTheme();
  const containerScale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: containerScale.value }] }));

  const handlePress = useCallback((part: BodyPart) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    containerScale.value = withSequence(withSpring(1.04, { damping: 10, stiffness: 400 }), withSpring(1, { damping: 14, stiffness: 300 }));
    onSelectPart?.(part);
  }, [onSelectPart, containerScale]);

  const painMap = useMemo(() => {
    const m = new Map<BodyPart, number>();
    for (const { part, level } of painLevels) m.set(part, Math.max(0, Math.min(10, level)));
    return m;
  }, [painLevels]);

  const primary = useMemo(() => new Set(highlightPrimary), [highlightPrimary]);
  const secondary = useMemo(() => new Set(highlightSecondary), [highlightSecondary]);
  const w = resolveWidth(size);

  const c = {
    elevated: colors.background.elevated, borderLight: colors.border.light,
    borderFocus: colors.border.focus, primary: colors.accent.primary,
    primaryLight: colors.accent.primaryLight, success: colors.accent.success,
    warning: colors.accent.warning, fire: colors.accent.fire, danger: colors.accent.danger,
  };
  const figureProps = { painMap, primary, secondary, selectedPart, mode, width: w, colors: c,
    onSelect: onSelectPart ? handlePress : undefined };

  if (showBack) {
    return (
      <View style={[{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center' }, style]}>
        <Animated.View style={[{ alignItems: 'center' }, animStyle]}>
          <Figure {...figureProps} paths={FRONT_PATHS} excluded={FRONT_EXCLUDED} />
          <Text style={{ fontSize: 11, fontWeight: '500', color: colors.text.muted, marginTop: 4, letterSpacing: 0.5, textTransform: 'uppercase' }}>Front</Text>
        </Animated.View>
        <View style={{ width: 1, backgroundColor: colors.border.default, marginHorizontal: 12, alignSelf: 'stretch', marginVertical: 20 }} />
        <View style={{ alignItems: 'center' }}>
          <Figure {...figureProps} paths={BACK_PATHS} excluded={BACK_EXCLUDED} />
          <Text style={{ fontSize: 11, fontWeight: '500', color: colors.text.muted, marginTop: 4, letterSpacing: 0.5, textTransform: 'uppercase' }}>Back</Text>
        </View>
      </View>
    );
  }

  return <Animated.View style={[animStyle, style]}><Figure {...figureProps} paths={FRONT_PATHS} excluded={FRONT_EXCLUDED} /></Animated.View>;
}

export type { BodyMapMode };
```

---

## PHASE 3 — UPGRADE `app/(tabs)/fitness/exercises.tsx`

Find the category filter section (the `ScrollView` with `CATEGORIES.map`). **Replace it** with the muscle group tile grid + equipment chips:

```typescript
// ADD IMPORTS at the top of exercises.tsx:
import { MuscleGroupTile } from '@components/workout/MuscleGroupTile';
import { ExerciseThumbnail } from '@components/workout/ExerciseThumbnail';

// MUSCLE GROUP CONFIG (add near top of file, before component):
const MUSCLE_GROUPS = [
  { value: 'chest',     label: 'Chest' },
  { value: 'back',      label: 'Back' },
  { value: 'shoulders', label: 'Shoulders' },
  { value: 'biceps',    label: 'Biceps' },
  { value: 'triceps',   label: 'Triceps' },
  { value: 'abs',       label: 'Abs' },
  { value: 'legs',      label: 'Legs' },
  { value: 'glutes',    label: 'Glutes' },
  { value: 'cardio',    label: 'Cardio' },
] as const;

// REPLACE the existing category filter ScrollView with:
{/* Muscle Group Grid */}
<View style={[styles.muscleGrid, { marginBottom: spacing.md }]}>
  {MUSCLE_GROUPS.map((mg) => (
    <MuscleGroupTile
      key={mg.value}
      muscleGroup={mg.value}
      label={mg.label}
      isSelected={selectedCategory === mg.value}
      onPress={() => setSelectedCategory(
        selectedCategory === mg.value ? 'all' : mg.value as CategoryFilter
      )}
      size={72}
    />
  ))}
</View>

// ADD to StyleSheet:
muscleGrid: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 12,
  justifyContent: 'space-between',
},
```

**Upgrade the exercise list item render.** Find `renderItem` (or wherever exercises are mapped in the FlatList). Replace the existing exercise row with:

```tsx
// REPLACE existing exercise row render with this:
<Pressable
  onPress={() => handleExercisePress(item)}
  onPressIn={handlePressIn}
  onPressOut={handlePressOut}
  style={[styles.exerciseCard, {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  }]}
  accessibilityRole="button"
  accessibilityLabel={`${item.name}, ${item.category ?? ''} exercise`}
>
  <ExerciseThumbnail
    muscleGroups={item.muscle_groups}
    category={item.category}
    size={44}
  />
  <View style={{ flex: 1 }}>
    <Text style={[typography.bodyBold, { color: colors.text.primary }]} numberOfLines={1}>
      {item.name}
    </Text>
    {item.muscle_groups.length > 0 && (
      <Text style={[typography.caption, { color: colors.text.secondary, marginTop: 2 }]} numberOfLines={1}>
        {item.muscle_groups.slice(0, 3).join(', ')}
      </Text>
    )}
    <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs, alignItems: 'center' }}>
      {item.equipment && (
        <Text style={[typography.tiny, { color: colors.text.muted }]}>{item.equipment}</Text>
      )}
      {item.equipment && item.difficulty && (
        <Text style={[typography.tiny, { color: colors.text.muted }]}>·</Text>
      )}
      {item.difficulty && (
        <Text style={[typography.tiny, { color: colors.text.muted }]}>{item.difficulty}</Text>
      )}
    </View>
  </View>
  <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
</Pressable>
```

---

## PHASE 4 — UPGRADE `app/(tabs)/fitness/exercise-detail.tsx`

Add anatomy section to the About view. Find where `exercise.muscle_groups` is currently displayed (as text badges) and **replace that section** with:

```typescript
// ADD IMPORTS at top of exercise-detail.tsx:
import { BodyMap } from '@components/ui/BodyMap';
import { musclesToBodyParts } from '@utils/muscleMapping';
import type { BodyPart } from '@components/ui/BodyMap';

// INSIDE the component, after exercise is loaded:
const primaryParts: BodyPart[] = useMemo(
  () => exercise ? musclesToBodyParts(exercise.muscle_groups) : [],
  [exercise],
);
const secondaryParts: BodyPart[] = useMemo(
  () => exercise?.category ? [] : [], // extend with secondary muscle data if DB has it
  [exercise],
);

// REPLACE the existing muscle_groups display section with:
<Card style={{ marginBottom: spacing.lg }}>
  <Text style={[typography.h3, { color: colors.text.primary, marginBottom: spacing.md }]}>
    Muscle Activation
  </Text>

  {/* Dual anatomy diagram */}
  <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
    <BodyMap
      mode="muscle"
      highlightPrimary={primaryParts}
      highlightSecondary={secondaryParts}
      showBack
      size="md"
    />
  </View>

  {/* Primary muscles list */}
  {exercise.muscle_groups.length > 0 && (
    <View style={{ marginBottom: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent.primary }} />
        <Text style={[typography.captionBold, { color: colors.text.secondary }]}>PRIMARY MUSCLES</Text>
      </View>
      {exercise.muscle_groups.map((m) => (
        <Text key={m} style={[typography.body, { color: colors.text.primary, marginLeft: spacing.lg, marginBottom: 2 }]}>
          {m.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
        </Text>
      ))}
    </View>
  )}
</Card>
```

---

## PHASE 5 — FIX `app/(tabs)/dashboard.tsx` MINISPARKLINE

Find the `MiniSparkline` function (it returns an empty View). Replace it entirely:

```typescript
// ADD IMPORT at top of dashboard.tsx (with other imports):
import { SkiaSparkline } from '@components/charts/SkiaSparkline';

// REPLACE the entire MiniSparkline function with:
function MiniSparkline({ data, color, width = 120, height = 40 }: {
  data: SparklinePoint[]; color: string; width?: number; height?: number;
}) {
  if (data.length < 2) return null;
  return (
    <SkiaSparkline
      data={data}
      color={color}
      width={width}
      height={height}
      strokeWidth={2}
      showFill
      animated
    />
  );
}
```

---

## PHASE 6 — ADD `PurpleRadialBackground` TO KEY SCREENS

In each of these screens, add `PurpleRadialBackground` as the **first child** of the root `View`:

**Files to update:**
- `app/(tabs)/dashboard.tsx`
- `app/(tabs)/fitness/index.tsx`
- `app/(tabs)/fitness/workout-summary.tsx`

```typescript
// ADD IMPORT at top:
import { PurpleRadialBackground } from '@components/ui/PurpleRadialBackground';

// In each screen's return, change:
<View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
  {/* ... existing content ... */}
</View>

// To:
<View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
  <PurpleRadialBackground />
  {/* ... existing content ... */}
</View>
```

---

## PHASE 7 — WRAP MACRO RINGS IN GLOWCARD (nutrition screen)

In `app/(tabs)/nutrition/index.tsx`, find where `MacroRings` or the calorie ring is rendered. Wrap it:

```typescript
// ADD IMPORT:
import { GlowCard } from '@components/ui/GlowCard';

// WRAP the existing MacroRings/calorie card:
<GlowCard intensity="subtle" animated style={{ marginBottom: spacing.lg }}>
  <MacroRings
    targets={{ protein: targets.protein, carbs: targets.carbs, fat: targets.fat }}
    consumed={{ protein: dailySummary.protein, carbs: dailySummary.carbs, fat: dailySummary.fat }}
    size={200}
    strokeWidth={14}
  />
</GlowCard>
```

---

## PHASE 8 — PAIN TRACKER SCREEN REPLACEMENT

Replace the ENTIRE contents of `app/(tabs)/fitness/pain-tracker.tsx` with the rebuilt version. The new version:
- Uses `<BodyMap mode="pain" showBack size="lg" />` instead of the Ionicons body icon
- Uses `<BottomSheet>` instead of `<Modal>` for the log form
- Has a real pain trend bar chart
- Has animated entry cards via `FadeInDown`

The rebuilt file is provided as a separate downloadable artifact.

---

## FINAL STEPS

```powershell
cd C:\dev\transformr\apps\mobile

# Check for any import path issues
npx tsc --noEmit 2>&1

# Common fixes if errors appear:
# - Add @utils/muscleMapping to babel.config.js module resolver if not resolving
# - Check that @shopify/react-native-skia exports match the version (v2.0.0-next.4):
#   Canvas, Path, Skia, RadialGradient, RoundedRect, BlurMask, Group, vec, Rect,
#   LinearGradient, useValue, runTiming, Easing are all available in this version

# Verify Skia imports are correct for v2.0.0-next.4
# NOTE: In Skia v2 next, 'useValue' and 'runTiming' come from @shopify/react-native-skia directly
# If SkiaSparkline throws on 'useValue', replace with Reanimated useSharedValue + Skia's 'start' prop

# Run lint
npx eslint . --max-warnings=0

# Run tests  
npx jest --passWithNoTests

# Final commit
git add -A
git commit -m "feat: photorealistic UI upgrade

- BodyMap: anatomical SVG paths with cubic bezier curves, pain + muscle modes, front/back dual view
- PainTracker: rebuilt with real anatomy figure, BottomSheet log form, animated history
- ExerciseThumbnail: anatomy figure thumbnail on every exercise card  
- MuscleGroupTile: circle anatomy tiles for Exercise Library category grid
- SkiaSparkline: GPU-rendered sparkline replaces empty MiniSparkline on Dashboard
- PurpleRadialBackground: Skia radial glow on Dashboard, Fitness Home, Workout Summary
- GlowCard: Skia BlurMask glow border for Nutrition MacroRings hero card
- muscleMapping: complete muscle-to-body-part lookup utility
- Exercise Detail: dual anatomy diagram with muscle callouts"

git push origin feat/photorealistic-ui
```

---

## SKIA VERSION NOTE

`@shopify/react-native-skia v2.0.0-next.4` has slightly different APIs from the stable v1:

```typescript
// SkiaSparkline uses useValue + runTiming from Skia
// If these throw a runtime error, use this Reanimated-compatible alternative:

import { useSharedValue, withTiming } from 'react-native-reanimated';
// and replace: const progress = useValue(0) → const progress = useSharedValue(0)
// and replace: runTiming(...) → progress.value = withTiming(1, {...})
// The Path 'start' and 'end' props accept both Skia values and Reanimated shared values in v2
```

If in doubt, check with:
```powershell
cd C:\dev\transformr\apps\mobile
node -e "const s = require('@shopify/react-native-skia'); console.log(Object.keys(s).filter(k => k.includes('Value') || k.includes('Timing')))"
```

---

*TRANSFORMR by Automate AI LLC — Every rep. Every meal. Every dollar. Every day.*
