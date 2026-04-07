// =============================================================================
// TRANSFORMR -- Supplement Management
// =============================================================================

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Modal } from '@components/ui/Modal';
import { Input } from '@components/ui/Input';
import { ProgressRing } from '@components/ui/ProgressRing';
import { useNutritionStore } from '@stores/nutritionStore';
import { hapticLight, hapticSuccess, hapticMedium } from '@utils/haptics';
import type { Supplement } from '../../../types/database';

type SupplementCategory = NonNullable<Supplement['category']>;

const SUPPLEMENT_CATEGORIES: Array<{ key: SupplementCategory; label: string; icon: string }> = [
  { key: 'protein', label: 'Protein', icon: 'barbell' },
  { key: 'creatine', label: 'Creatine', icon: 'flash' },
  { key: 'vitamin', label: 'Vitamins', icon: 'sunny' },
  { key: 'mineral', label: 'Minerals', icon: 'leaf' },
  { key: 'amino_acid', label: 'Amino Acids', icon: 'fitness' },
  { key: 'pre_workout', label: 'Pre-Workout', icon: 'rocket' },
  { key: 'post_workout', label: 'Post-Workout', icon: 'medkit' },
  { key: 'sleep', label: 'Sleep', icon: 'moon' },
  { key: 'other', label: 'Other', icon: 'ellipsis-horizontal' },
];

interface SupplementWithStatus extends Supplement {
  takenToday: boolean;
  lastTakenAt: string | null;
}

interface AIRecommendation {
  id: string;
  name: string;
  dosage: string;
  reason: string;
  category: SupplementCategory;
}

interface InteractionWarning {
  id: string;
  supplements: [string, string];
  severity: 'low' | 'medium' | 'high';
  description: string;
}

const FREQUENCY_OPTIONS = ['Daily', 'Twice daily', 'Pre-workout', 'Post-workout', 'Before bed', 'With meals'] as const;

export default function SupplementsScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const { logSupplement } = useNutritionStore();

  const [supplements, setSupplements] = useState<SupplementWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<SupplementCategory | 'all'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDosage, setNewDosage] = useState('');
  const [newCategory, setNewCategory] = useState<SupplementCategory>('vitamin');
  const [newFrequency, setNewFrequency] = useState('Daily');
  const [newTiming, setNewTiming] = useState('');

  // AI recommendations
  const aiRecommendations: AIRecommendation[] = useMemo(() => [
    {
      id: 'rec-1',
      name: 'Vitamin D3',
      dosage: '5000 IU',
      reason: 'Based on your training volume and indoor lifestyle, D3 supports recovery and immune function.',
      category: 'vitamin',
    },
    {
      id: 'rec-2',
      name: 'Ashwagandha',
      dosage: '600mg',
      reason: 'May help with cortisol management given your high-intensity training schedule.',
      category: 'other',
    },
  ], []);

  // Interaction warnings
  const interactionWarnings: InteractionWarning[] = useMemo(() => [
    {
      id: 'warn-1',
      supplements: ['Calcium', 'Iron'],
      severity: 'medium',
      description: 'Calcium can reduce iron absorption. Take at least 2 hours apart.',
    },
    {
      id: 'warn-2',
      supplements: ['Caffeine', 'Creatine'],
      severity: 'low',
      description: 'Some research suggests caffeine may reduce creatine uptake. Consider timing them separately.',
    },
  ], []);

  useEffect(() => {
    const mockSupplements: SupplementWithStatus[] = [
      { id: '1', name: 'Whey Protein Isolate', dosage: '30g', frequency: 'Post-workout', category: 'protein', is_active: true, takenToday: true, lastTakenAt: '2026-04-06T08:30:00Z' },
      { id: '2', name: 'Creatine Monohydrate', dosage: '5g', frequency: 'Daily', category: 'creatine', is_active: true, takenToday: true, lastTakenAt: '2026-04-06T07:00:00Z' },
      { id: '3', name: 'Vitamin D3', dosage: '5000 IU', frequency: 'Daily', category: 'vitamin', is_active: true, is_ai_recommended: true, ai_recommendation_reason: 'Supports recovery and bone health', takenToday: false, lastTakenAt: null },
      { id: '4', name: 'Omega-3 Fish Oil', dosage: '2000mg', frequency: 'Daily', category: 'other', is_active: true, takenToday: false, lastTakenAt: null },
      { id: '5', name: 'Magnesium Glycinate', dosage: '400mg', frequency: 'Before bed', category: 'mineral', is_active: true, takenToday: false, lastTakenAt: null },
      { id: '6', name: 'Caffeine + L-Theanine', dosage: '200mg/100mg', frequency: 'Pre-workout', category: 'pre_workout', is_active: true, takenToday: true, lastTakenAt: '2026-04-06T06:00:00Z' },
      { id: '7', name: 'ZMA', dosage: '3 capsules', frequency: 'Before bed', category: 'sleep', is_active: true, takenToday: false, lastTakenAt: null },
      { id: '8', name: 'BCAAs', dosage: '10g', frequency: 'During workout', category: 'amino_acid', is_active: false, takenToday: false, lastTakenAt: null },
    ];
    setSupplements(mockSupplements);
    setIsLoading(false);
  }, []);

  const activeSupplements = useMemo(
    () => supplements.filter((s) => s.is_active !== false),
    [supplements],
  );

  const filteredSupplements = useMemo(() => {
    let sups = activeSupplements;
    if (filterCategory !== 'all') {
      sups = sups.filter((s) => s.category === filterCategory);
    }
    return sups;
  }, [activeSupplements, filterCategory]);

  const inactiveSupplements = useMemo(
    () => supplements.filter((s) => s.is_active === false),
    [supplements],
  );

  const takenCount = activeSupplements.filter((s) => s.takenToday).length;
  const totalActive = activeSupplements.length;

  const handleLogSupplement = useCallback(
    async (supp: SupplementWithStatus) => {
      hapticSuccess();
      await logSupplement(supp.id);
      setSupplements((prev) =>
        prev.map((s) =>
          s.id === supp.id ? { ...s, takenToday: true, lastTakenAt: new Date().toISOString() } : s,
        ),
      );
    },
    [logSupplement],
  );

  const handleToggleActive = useCallback((suppId: string) => {
    hapticMedium();
    setSupplements((prev) =>
      prev.map((s) =>
        s.id === suppId ? { ...s, is_active: !s.is_active } : s,
      ),
    );
  }, []);

  const handleDeleteSupplement = useCallback((suppId: string) => {
    hapticMedium();
    Alert.alert('Delete Supplement', 'Remove this supplement permanently?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => setSupplements((prev) => prev.filter((s) => s.id !== suppId)),
      },
    ]);
  }, []);

  const handleAddSupplement = useCallback(() => {
    if (newName.trim().length === 0) return;
    hapticSuccess();
    const newSup: SupplementWithStatus = {
      id: Date.now().toString(),
      name: newName.trim(),
      dosage: newDosage.trim() || undefined,
      frequency: newFrequency,
      times: newTiming ? [newTiming] : undefined,
      category: newCategory,
      is_active: true,
      takenToday: false,
      lastTakenAt: null,
    };
    setSupplements((prev) => [newSup, ...prev]);
    setShowAddModal(false);
    setNewName('');
    setNewDosage('');
    setNewTiming('');
  }, [newName, newDosage, newCategory, newFrequency, newTiming]);

  const handleAddFromRecommendation = useCallback((rec: AIRecommendation) => {
    hapticSuccess();
    const newSup: SupplementWithStatus = {
      id: Date.now().toString(),
      name: rec.name,
      dosage: rec.dosage,
      frequency: 'Daily',
      category: rec.category,
      is_active: true,
      is_ai_recommended: true,
      ai_recommendation_reason: rec.reason,
      takenToday: false,
      lastTakenAt: null,
    };
    setSupplements((prev) => [newSup, ...prev]);
    Alert.alert('Added!', `${rec.name} has been added to your supplements.`);
  }, []);

  const getSeverityColor = (severity: InteractionWarning['severity']): string => {
    switch (severity) {
      case 'high': return colors.accent.danger;
      case 'medium': return colors.accent.warning;
      case 'low': return colors.accent.info;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={colors.accent.primary} />
          </View>
        ) : (
          <>
            {/* Summary */}
            <Animated.View entering={FadeInDown.duration(300)}>
              <Card style={{ marginBottom: spacing.lg }}>
                <View style={styles.summaryRow}>
                  <ProgressRing
                    progress={totalActive > 0 ? takenCount / totalActive : 0}
                    size={72}
                    strokeWidth={6}
                    color={colors.accent.success}
                  >
                    <Text style={[typography.captionBold, { color: colors.text.primary }]}>
                      {takenCount}/{totalActive}
                    </Text>
                  </ProgressRing>
                  <View style={{ flex: 1, marginLeft: spacing.lg }}>
                    <Text style={[typography.h3, { color: colors.text.primary }]}>
                      Today's Supplements
                    </Text>
                    <Text style={[typography.caption, { color: colors.text.muted, marginTop: 4 }]}>
                      {totalActive - takenCount} remaining
                    </Text>
                  </View>
                </View>
              </Card>
            </Animated.View>

            {/* Interaction Warnings */}
            {interactionWarnings.length > 0 && (
              <Animated.View entering={FadeInDown.duration(300).delay(50)}>
                <Card style={{ marginBottom: spacing.lg, borderLeftWidth: 3, borderLeftColor: colors.accent.warning }}>
                  <View style={styles.warningHeader}>
                    <Ionicons name="warning-outline" size={20} color={colors.accent.warning} />
                    <Text style={[typography.bodyBold, { color: colors.accent.warning, marginLeft: spacing.sm }]}>
                      Interaction Warnings
                    </Text>
                  </View>
                  {interactionWarnings.map((warning) => (
                    <View
                      key={warning.id}
                      style={[styles.warningItem, { marginTop: spacing.md }]}
                    >
                      <Badge
                        label={warning.severity.toUpperCase()}
                        variant={warning.severity === 'high' ? 'danger' : warning.severity === 'medium' ? 'warning' : 'info'}
                        size="sm"
                      />
                      <Text style={[typography.caption, { color: colors.text.secondary, marginTop: spacing.xs }]}>
                        <Text style={{ fontWeight: '600' }}>{warning.supplements.join(' + ')}: </Text>
                        {warning.description}
                      </Text>
                    </View>
                  ))}
                </Card>
              </Animated.View>
            )}

            {/* Category Filter */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: spacing.lg }}
              contentContainerStyle={{ gap: spacing.sm }}
            >
              <Pressable
                onPress={() => { hapticLight(); setFilterCategory('all'); }}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: filterCategory === 'all' ? colors.accent.primary : colors.background.secondary,
                    borderRadius: borderRadius.full,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                  },
                ]}
              >
                <Text style={[typography.caption, { color: filterCategory === 'all' ? '#FFFFFF' : colors.text.secondary }]}>
                  All
                </Text>
              </Pressable>
              {SUPPLEMENT_CATEGORIES.map((cat) => (
                <Pressable
                  key={cat.key}
                  onPress={() => { hapticLight(); setFilterCategory(cat.key); }}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: filterCategory === cat.key ? colors.accent.primary : colors.background.secondary,
                      borderRadius: borderRadius.full,
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.sm,
                    },
                  ]}
                >
                  <Ionicons
                    name={cat.icon as keyof typeof Ionicons.glyphMap}
                    size={12}
                    color={filterCategory === cat.key ? '#FFFFFF' : colors.text.secondary}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={[typography.tiny, { color: filterCategory === cat.key ? '#FFFFFF' : colors.text.secondary }]}>
                    {cat.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Active Supplements List */}
            {filteredSupplements.length > 0 ? (
              <View style={{ gap: spacing.sm }}>
                {filteredSupplements.map((supp, index) => (
                  <Animated.View key={supp.id} entering={FadeInDown.duration(300).delay(100 + index * 50)}>
                    <Card style={{ opacity: supp.takenToday ? 0.7 : 1 }}>
                      <View style={styles.suppRow}>
                        <View style={{ flex: 1 }}>
                          <View style={[styles.suppNameRow, { gap: spacing.sm }]}>
                            <Text style={[typography.bodyBold, { color: colors.text.primary }]}>
                              {supp.name}
                            </Text>
                            {supp.takenToday && (
                              <Ionicons name="checkmark-circle" size={18} color={colors.accent.success} />
                            )}
                          </View>
                          <View style={[styles.suppMeta, { gap: spacing.sm, marginTop: spacing.xs }]}>
                            {supp.dosage && <Badge label={supp.dosage} size="sm" />}
                            {supp.frequency && <Badge label={supp.frequency} size="sm" variant="info" />}
                            {supp.is_ai_recommended && (
                              <Badge label="AI Rec" size="sm" variant="success" />
                            )}
                          </View>
                          {supp.ai_recommendation_reason && (
                            <Text style={[typography.tiny, { color: colors.text.muted, marginTop: spacing.xs }]}>
                              {supp.ai_recommendation_reason}
                            </Text>
                          )}
                        </View>
                        <View style={[styles.suppActions, { gap: spacing.sm }]}>
                          {!supp.takenToday && (
                            <Pressable
                              onPress={() => handleLogSupplement(supp)}
                              style={[
                                styles.actionBtn,
                                { backgroundColor: `${colors.accent.success}20`, borderRadius: borderRadius.md },
                              ]}
                            >
                              <Ionicons name="checkmark" size={20} color={colors.accent.success} />
                            </Pressable>
                          )}
                          <Pressable
                            onPress={() => handleToggleActive(supp.id)}
                            style={[
                              styles.actionBtn,
                              { backgroundColor: `${colors.accent.warning}20`, borderRadius: borderRadius.md },
                            ]}
                          >
                            <Ionicons name="pause" size={16} color={colors.accent.warning} />
                          </Pressable>
                          <Pressable
                            onPress={() => handleDeleteSupplement(supp.id)}
                            style={[
                              styles.actionBtn,
                              { backgroundColor: `${colors.accent.danger}20`, borderRadius: borderRadius.md },
                            ]}
                          >
                            <Ionicons name="trash-outline" size={16} color={colors.accent.danger} />
                          </Pressable>
                        </View>
                      </View>
                    </Card>
                  </Animated.View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="medical-outline" size={48} color={colors.text.muted} />
                <Text style={[typography.body, { color: colors.text.muted, marginTop: spacing.md }]}>
                  No supplements found
                </Text>
              </View>
            )}

            {/* Inactive Supplements */}
            {inactiveSupplements.length > 0 && (
              <View style={{ marginTop: spacing.xl }}>
                <Text style={[typography.h3, { color: colors.text.muted, marginBottom: spacing.md }]}>
                  Inactive
                </Text>
                {inactiveSupplements.map((supp) => (
                  <Pressable
                    key={supp.id}
                    onPress={() => handleToggleActive(supp.id)}
                    style={[
                      styles.inactiveRow,
                      {
                        backgroundColor: colors.background.secondary,
                        borderRadius: borderRadius.lg,
                        padding: spacing.md,
                        marginBottom: spacing.xs,
                        opacity: 0.5,
                      },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[typography.body, { color: colors.text.muted }]}>{supp.name}</Text>
                      {supp.dosage && (
                        <Text style={[typography.tiny, { color: colors.text.muted }]}>{supp.dosage}</Text>
                      )}
                    </View>
                    <Ionicons name="play-circle-outline" size={22} color={colors.accent.primary} />
                  </Pressable>
                ))}
              </View>
            )}

            {/* AI Recommendations */}
            <Animated.View entering={FadeInDown.duration(300).delay(300)}>
              <View style={{ marginTop: spacing.xl }}>
                <View style={[styles.sectionHeader, { marginBottom: spacing.md }]}>
                  <Ionicons name="sparkles" size={20} color={colors.accent.primary} />
                  <Text style={[typography.h3, { color: colors.text.primary, marginLeft: spacing.sm }]}>
                    AI Recommendations
                  </Text>
                </View>

                {aiRecommendations.map((rec) => (
                  <Card key={rec.id} style={{ marginBottom: spacing.sm }}>
                    <View style={styles.recRow}>
                      <View style={{ flex: 1 }}>
                        <View style={[styles.recHeader, { gap: spacing.sm }]}>
                          <Text style={[typography.bodyBold, { color: colors.text.primary }]}>
                            {rec.name}
                          </Text>
                          <Badge label={rec.dosage} size="sm" variant="info" />
                        </View>
                        <Text style={[typography.caption, { color: colors.text.muted, marginTop: spacing.xs }]}>
                          {rec.reason}
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => handleAddFromRecommendation(rec)}
                        style={[
                          styles.addRecBtn,
                          { backgroundColor: `${colors.accent.primary}20`, borderRadius: borderRadius.md },
                        ]}
                      >
                        <Ionicons name="add" size={20} color={colors.accent.primary} />
                      </Pressable>
                    </View>
                  </Card>
                ))}
              </View>
            </Animated.View>
          </>
        )}
      </ScrollView>

      {/* Add FAB */}
      <Pressable
        onPress={() => { hapticLight(); setShowAddModal(true); }}
        style={[styles.fab, { backgroundColor: colors.accent.primary, borderRadius: borderRadius.full }]}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </Pressable>

      {/* Add Modal */}
      <Modal
        visible={showAddModal}
        onDismiss={() => setShowAddModal(false)}
        title="Add Supplement"
      >
        <ScrollView style={{ maxHeight: 500 }} contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
          <Input label="Name" placeholder="e.g. Vitamin D3" value={newName} onChangeText={setNewName} />
          <Input label="Dosage" placeholder="e.g. 5000 IU" value={newDosage} onChangeText={setNewDosage} />

          <Text style={[typography.caption, { color: colors.text.secondary }]}>Frequency</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
            {FREQUENCY_OPTIONS.map((freq) => (
              <Pressable
                key={freq}
                onPress={() => setNewFrequency(freq)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: newFrequency === freq ? colors.accent.primary : colors.background.tertiary,
                    borderRadius: borderRadius.full,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                  },
                ]}
              >
                <Text style={[typography.tiny, { color: newFrequency === freq ? '#FFFFFF' : colors.text.secondary }]}>
                  {freq}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <Input label="Timing (optional)" placeholder="e.g. 8:00 AM" value={newTiming} onChangeText={setNewTiming} />

          <Text style={[typography.caption, { color: colors.text.secondary }]}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
            {SUPPLEMENT_CATEGORIES.map((cat) => (
              <Pressable
                key={cat.key}
                onPress={() => setNewCategory(cat.key)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: newCategory === cat.key ? colors.accent.primary : colors.background.tertiary,
                    borderRadius: borderRadius.full,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                  },
                ]}
              >
                <Text style={[typography.tiny, { color: newCategory === cat.key ? '#FFFFFF' : colors.text.secondary }]}>
                  {cat.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <Button
            title="Add Supplement"
            onPress={handleAddSupplement}
            disabled={newName.trim().length === 0}
            fullWidth
            style={{ marginTop: spacing.md }}
          />
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  loadingState: { alignItems: 'center', paddingVertical: 60 },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  warningItem: {},
  filterChip: { flexDirection: 'row', alignItems: 'center' },
  suppRow: { flexDirection: 'row', alignItems: 'flex-start' },
  suppNameRow: { flexDirection: 'row', alignItems: 'center' },
  suppMeta: { flexDirection: 'row', flexWrap: 'wrap' },
  suppActions: { marginLeft: 12, alignItems: 'center' },
  actionBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  inactiveRow: { flexDirection: 'row', alignItems: 'center' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center' },
  recRow: { flexDirection: 'row', alignItems: 'flex-start' },
  recHeader: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  addRecBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center', marginLeft: 12 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  fab: {
    position: 'absolute', bottom: 24, right: 20, width: 56, height: 56,
    justifyContent: 'center', alignItems: 'center',
    elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8,
  },
});
