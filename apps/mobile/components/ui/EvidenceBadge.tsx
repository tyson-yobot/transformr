// =============================================================================
// TRANSFORMR -- Evidence Badge
// Displays the strength of scientific evidence backing a supplement with a
// color-coded badge and optional tooltip-style info popover.
// =============================================================================

import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme/index';

type EvidenceLevel = 'strong' | 'moderate' | 'emerging' | 'anecdotal';

interface EvidenceSource {
  title: string;
  year: number;
  type: 'meta_analysis' | 'rct' | 'review' | 'observational' | 'expert_opinion';
}

interface EvidenceBadgeProps {
  level: EvidenceLevel;
  sources?: EvidenceSource[];
  compact?: boolean;
}

const LEVEL_CONFIG: Record<EvidenceLevel, { label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }> = {
  strong: { label: 'Strong', icon: 'shield-checkmark' },
  moderate: { label: 'Moderate', icon: 'shield-half' },
  emerging: { label: 'Emerging', icon: 'flask' },
  anecdotal: { label: 'Anecdotal', icon: 'chatbubble-ellipses-outline' },
};

const SOURCE_TYPE_LABEL: Record<EvidenceSource['type'], string> = {
  meta_analysis: 'Meta-analysis',
  rct: 'RCT',
  review: 'Review',
  observational: 'Observational',
  expert_opinion: 'Expert opinion',
};

export function EvidenceBadge({ level, sources, compact = false }: EvidenceBadgeProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const [showSources, setShowSources] = useState(false);

  const config = LEVEL_CONFIG[level];

  const badgeColor = (() => {
    switch (level) {
      case 'strong':
        return colors.accent.success;
      case 'moderate':
        return colors.accent.cyan;
      case 'emerging':
        return colors.accent.warning;
      case 'anecdotal':
        return colors.text.muted;
    }
  })();

  const badgeBg = (() => {
    switch (level) {
      case 'strong':
        return colors.accent.successDim;
      case 'moderate':
        return colors.accent.cyanDim;
      case 'emerging':
        return colors.accent.warningDim;
      case 'anecdotal':
        return colors.background.tertiary;
    }
  })();

  const handlePress = useCallback(() => {
    if (sources && sources.length > 0) {
      setShowSources((v) => !v);
    }
  }, [sources]);

  if (compact) {
    return (
      <View
        style={[
          styles.compactBadge,
          { backgroundColor: badgeBg, borderRadius: borderRadius.sm },
        ]}
      >
        <Ionicons name={config.icon} size={10} color={badgeColor} />
        <Text
          style={[
            typography.tiny,
            {
              color: badgeColor,
              marginLeft: 3,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              fontSize: 9,
            },
          ]}
        >
          {config.label}
        </Text>
      </View>
    );
  }

  return (
    <View>
      <Pressable
        onPress={handlePress}
        style={[
          styles.badge,
          {
            backgroundColor: badgeBg,
            borderRadius: borderRadius.sm,
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.xs,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Evidence: ${config.label}${sources && sources.length > 0 ? '. Tap for sources.' : ''}`}
      >
        <Ionicons name={config.icon} size={14} color={badgeColor} />
        <Text
          style={[
            typography.tiny,
            {
              color: badgeColor,
              marginLeft: spacing.xs,
              textTransform: 'uppercase',
              letterSpacing: 1,
              fontWeight: '600',
            },
          ]}
        >
          {config.label}
        </Text>
        {sources && sources.length > 0 && (
          <Ionicons
            name={showSources ? 'chevron-up' : 'chevron-down'}
            size={12}
            color={badgeColor}
            style={{ marginLeft: spacing.xs }}
          />
        )}
      </Pressable>
      {showSources && sources && sources.length > 0 && (
        <View
          style={[
            styles.sourcesContainer,
            {
              backgroundColor: colors.background.tertiary,
              borderColor: colors.border.subtle,
              borderRadius: borderRadius.sm,
              padding: spacing.sm,
              marginTop: spacing.xs,
            },
          ]}
        >
          {sources.map((source, idx) => (
            <View key={`${source.title}-${idx}`} style={[styles.sourceRow, { marginTop: idx === 0 ? 0 : spacing.xs }]}>
              <View
                style={[
                  styles.sourceTypeBadge,
                  {
                    backgroundColor: badgeBg,
                    borderRadius: borderRadius.sm,
                    paddingHorizontal: 4,
                    paddingVertical: 1,
                  },
                ]}
              >
                <Text style={{ fontSize: 8, color: badgeColor, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {SOURCE_TYPE_LABEL[source.type]}
                </Text>
              </View>
              <Text
                style={[
                  typography.tiny,
                  { color: colors.text.secondary, marginLeft: spacing.xs, flex: 1 },
                ]}
                numberOfLines={2}
              >
                {source.title} ({source.year})
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  compactBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  sourcesContainer: {
    borderWidth: 1,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sourceTypeBadge: {},
});
