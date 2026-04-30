// =============================================================================
// TRANSFORMR — ExerciseInfoModal
// Explains filters, difficulty levels, and compound vs isolation
// =============================================================================

import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme/index';
import { Modal } from '@components/ui/Modal';

interface ExerciseInfoModalProps {
  visible: boolean;
  onDismiss: () => void;
}

interface InfoSectionProps {
  icon: string;
  iconColor: string;
  title: string;
  description: string;
}

function InfoSection({ icon, iconColor, title, description }: InfoSectionProps) {
  const { colors, typography, spacing } = useTheme();

  return (
    <View style={[styles.section, { borderBottomColor: colors.border.light }]}>
      <View style={styles.sectionHeader}>
        <View style={[styles.iconWrap, { backgroundColor: `${iconColor}20` }]}>
          <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={18} color={iconColor} />
        </View>
        <Text style={[typography.h3, { color: colors.text.primary }]}>{title}</Text>
      </View>
      <Text style={[typography.body, { color: colors.text.secondary, marginTop: spacing.xs }]}>
        {description}
      </Text>
    </View>
  );
}

export function ExerciseInfoModal({ visible, onDismiss }: ExerciseInfoModalProps) {
  const { colors, typography, spacing } = useTheme();

  return (
    <Modal visible={visible} onDismiss={onDismiss} title="Exercise Library Guide">
      <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 480 }}>
        <InfoSection
          icon="funnel-outline"
          iconColor={colors.accent.primary}
          title="Filters"
          description="Combine muscle group, equipment, and difficulty filters to find the right exercise. Filters use AND logic — selecting Chest + Dumbbell shows only dumbbell chest exercises. Count badges on each chip show how many exercises match."
        />

        <InfoSection
          icon="body-outline"
          iconColor="#3B82F6"
          title="Muscle Groups"
          description="Exercises match if the muscle group is their primary category OR appears in their targeted muscles list. This means a Bench Press shows under both Chest and Triceps."
        />

        <InfoSection
          icon="barbell-outline"
          iconColor="#F97316"
          title="Equipment"
          description="Filter by the equipment an exercise requires. Bodyweight exercises need no equipment. If a chip shows 0, no exercises match your current filter combination."
        />

        <InfoSection
          icon="speedometer-outline"
          iconColor="#22C55E"
          title="Difficulty Levels"
          description="Beginner exercises use simple movement patterns. Intermediate exercises add complexity or load. Advanced exercises require significant strength, mobility, or technique."
        />

        <View style={[styles.section, { borderBottomColor: colors.border.light }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconWrap, { backgroundColor: `${colors.accent.success}20` }]}>
              <Ionicons name="git-merge-outline" size={18} color={colors.accent.success} />
            </View>
            <Text style={[typography.h3, { color: colors.text.primary }]}>Compound vs Isolation</Text>
          </View>
          <View style={{ marginTop: spacing.xs, gap: spacing.xs }}>
            <View style={styles.badgeRow}>
              <View style={[styles.badge, { backgroundColor: `${colors.accent.success}20` }]}>
                <Text style={[typography.tiny, { color: colors.accent.success, fontWeight: '700' }]}>COMPOUND</Text>
              </View>
              <Text style={[typography.body, { color: colors.text.secondary, flex: 1 }]}>
                Works multiple joints and muscle groups (e.g., Squat, Bench Press)
              </Text>
            </View>
            <View style={styles.badgeRow}>
              <View style={[styles.badge, { backgroundColor: `${colors.accent.cyan}20` }]}>
                <Text style={[typography.tiny, { color: colors.accent.cyan, fontWeight: '700' }]}>ISOLATION</Text>
              </View>
              <Text style={[typography.body, { color: colors.text.secondary, flex: 1 }]}>
                Targets a single muscle group (e.g., Bicep Curl, Leg Extension)
              </Text>
            </View>
          </View>
        </View>

        <InfoSection
          icon="search-outline"
          iconColor={colors.accent.cyan}
          title="Search"
          description="Type to search by exercise name. Search works alongside your active filters — clear filters if you can't find what you're looking for."
        />
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
});
