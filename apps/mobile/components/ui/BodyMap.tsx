import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@theme/index';

type BodyPart =
  | 'head'
  | 'neck'
  | 'leftShoulder'
  | 'rightShoulder'
  | 'chest'
  | 'leftArm'
  | 'rightArm'
  | 'leftForearm'
  | 'rightForearm'
  | 'abdomen'
  | 'leftHip'
  | 'rightHip'
  | 'leftThigh'
  | 'rightThigh'
  | 'leftKnee'
  | 'rightKnee'
  | 'leftShin'
  | 'rightShin'
  | 'leftFoot'
  | 'rightFoot'
  | 'lowerBack';

interface PainLevel {
  part: BodyPart;
  level: number; // 0-10
}

interface BodyMapProps {
  painLevels?: PainLevel[];
  selectedPart?: BodyPart | null;
  onSelectPart?: (part: BodyPart) => void;
  width?: number;
  height?: number;
  style?: ViewStyle;
}

// SVG paths for a simplified front-view body outline
const BODY_PATHS: Record<BodyPart, string> = {
  head: 'M140,10 C155,10 170,25 170,45 C170,65 155,78 140,78 C125,78 110,65 110,45 C110,25 125,10 140,10 Z',
  neck: 'M130,78 L150,78 L148,95 L132,95 Z',
  leftShoulder: 'M132,95 L100,105 L95,120 L130,110 Z',
  rightShoulder: 'M148,95 L180,105 L185,120 L150,110 Z',
  chest: 'M130,95 L150,95 L155,145 L125,145 Z',
  leftArm: 'M95,120 L85,170 L75,170 L90,118 Z',
  rightArm: 'M185,120 L195,170 L205,170 L190,118 Z',
  leftForearm: 'M85,170 L78,225 L68,225 L75,170 Z',
  rightForearm: 'M195,170 L202,225 L212,225 L205,170 Z',
  abdomen: 'M125,145 L155,145 L158,195 L122,195 Z',
  leftHip: 'M122,195 L140,195 L135,215 L118,215 Z',
  rightHip: 'M140,195 L158,195 L162,215 L145,215 Z',
  leftThigh: 'M118,215 L135,215 L130,285 L115,285 Z',
  rightThigh: 'M145,215 L162,215 L165,285 L150,285 Z',
  leftKnee: 'M115,285 L130,285 L128,310 L113,310 Z',
  rightKnee: 'M150,285 L165,285 L167,310 L148,310 Z',
  leftShin: 'M113,310 L128,310 L126,375 L111,375 Z',
  rightShin: 'M148,310 L167,310 L169,375 L146,375 Z',
  leftFoot: 'M111,375 L126,375 L130,395 L105,395 Z',
  rightFoot: 'M146,375 L169,375 L175,395 L142,395 Z',
  lowerBack: 'M125,160 L155,160 L155,195 L125,195 Z', // overlaps abdomen from behind, shown slightly offset
};

export function BodyMap({
  painLevels = [],
  selectedPart = null,
  onSelectPart,
  width = 280,
  height = 410,
  style,
}: BodyMapProps) {
  const { colors } = useTheme();

  const painMap = useMemo(() => {
    const map = new Map<BodyPart, number>();
    painLevels.forEach(({ part, level }) => {
      map.set(part, Math.max(0, Math.min(10, level)));
    });
    return map;
  }, [painLevels]);

  const getPainColor = useCallback(
    (level: number): string => {
      if (level === 0) return 'transparent';
      if (level <= 3) return `${colors.accent.success}80`;
      if (level <= 5) return `${colors.accent.warning}90`;
      if (level <= 7) return `${colors.accent.fire}A0`;
      return `${colors.accent.danger}C0`;
    },
    [colors],
  );

  const handlePartPress = useCallback(
    (part: BodyPart) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onSelectPart?.(part);
    },
    [onSelectPart],
  );

  const bodyParts = useMemo(() => {
    // Exclude lowerBack from default front view unless it has pain data
    const partsToRender = (Object.keys(BODY_PATHS) as BodyPart[]).filter(
      (part) => part !== 'lowerBack' || painMap.has(part),
    );
    return partsToRender;
  }, [painMap]);

  return (
    <View style={[styles.container, { width, height }, style]}>
      <Svg width={width} height={height} viewBox="0 0 280 410">
        {bodyParts.map((part) => {
          const path = BODY_PATHS[part];
          const painLevel = painMap.get(part) ?? 0;
          const isSelected = selectedPart === part;
          const fillColor = painLevel > 0 ? getPainColor(painLevel) : colors.background.tertiary;

          return (
            <G key={part}>
              <Path
                d={path}
                fill={fillColor}
                stroke={isSelected ? colors.accent.primary : colors.border.default}
                strokeWidth={isSelected ? 2.5 : 1}
                onPress={() => handlePartPress(part)}
              />
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

export type { BodyPart, PainLevel };

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
