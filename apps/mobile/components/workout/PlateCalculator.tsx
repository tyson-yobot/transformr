// =============================================================================
// TRANSFORMR — PlateCalculator
// Visual barbell plate distribution for a given weight
// =============================================================================

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@theme/index';

interface PlateCalculatorProps {
  weight: number;
  barWeight?: number;
}

interface PlateSpec {
  weight: number;
  color: string;
  width: number;
  height: number;
}

const PLATE_SPECS: PlateSpec[] = [
  { weight: 45,   color: '#3B82F6', width: 14, height: 48 },
  { weight: 35,   color: '#EAB308', width: 12, height: 44 },
  { weight: 25,   color: '#22C55E', width: 12, height: 40 },
  { weight: 10,   color: '#F97316', width: 10, height: 34 },
  { weight: 5,    color: '#A855F7', width: 8,  height: 28 },
  { weight: 2.5,  color: '#EC4899', width: 6,  height: 24 },
  { weight: 1.25, color: '#6B7280', width: 5,  height: 20 },
];

function calculatePlates(totalWeight: number, barWeight: number): number[] {
  const perSide = (totalWeight - barWeight) / 2;
  if (perSide <= 0) return [];

  const plates: number[] = [];
  let remaining = perSide;

  for (const spec of PLATE_SPECS) {
    while (remaining >= spec.weight - 0.001) {
      plates.push(spec.weight);
      remaining -= spec.weight;
    }
  }

  return plates;
}

function getPlateSpec(plateWeight: number): PlateSpec {
  const fallback = PLATE_SPECS[PLATE_SPECS.length - 1];
  return PLATE_SPECS.find((s) => Math.abs(s.weight - plateWeight) < 0.01) ?? fallback as PlateSpec;
}

export function PlateCalculator({ weight, barWeight = 45 }: PlateCalculatorProps) {
  const { colors, typography } = useTheme();

  const plates = useMemo(() => calculatePlates(weight, barWeight), [weight, barWeight]);
  const perSideWeight = (weight - barWeight) / 2;

  if (weight <= barWeight) return null;

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background.glass, borderColor: colors.border.light }]}
      accessibilityLabel={`Plate calculator: ${plates.length} plates per side for ${weight} pounds`}
    >
      <View style={styles.header}>
        <Text style={[typography.tiny, { color: colors.text.muted, fontWeight: '600' }]}>
          PLATES (per side)
        </Text>
        <Text style={[typography.tiny, { color: colors.text.secondary }]}>
          {perSideWeight} lbs/side
        </Text>
      </View>

      {/* Visual plate stack */}
      <View style={styles.barbellRow}>
        {/* Left collar */}
        <View style={[styles.collar, { backgroundColor: colors.text.muted }]} />

        {/* Bar */}
        <View style={[styles.bar, { backgroundColor: colors.text.muted }]} />

        {/* Plates */}
        <View style={styles.plateStack}>
          {plates.map((plateWeight, index) => {
            const spec = getPlateSpec(plateWeight);
            return (
              <View
                key={`${plateWeight}-${index}`}
                style={[
                  styles.plate,
                  {
                    backgroundColor: spec.color,
                    width: spec.width,
                    height: spec.height,
                    borderRadius: 3,
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Right collar */}
        <View style={[styles.collar, { backgroundColor: colors.text.muted }]} />
      </View>

      {/* Plate legend */}
      <View style={styles.legend}>
        {Array.from(new Set(plates)).map((plateWeight) => {
          const count = plates.filter((p) => Math.abs(p - plateWeight) < 0.01).length;
          const spec = getPlateSpec(plateWeight);
          return (
            <View key={plateWeight} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: spec.color }]} />
              <Text style={[typography.tiny, { color: colors.text.secondary }]}>
                {count}×{plateWeight}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  barbellRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    marginBottom: 8,
  },
  collar: {
    width: 6,
    height: 16,
    borderRadius: 2,
  },
  bar: {
    width: 40,
    height: 6,
    borderRadius: 3,
  },
  plateStack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  plate: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
