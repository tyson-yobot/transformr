// =============================================================================
// TRANSFORMR -- Supplement Management (Budget-Aware + Evidence)
// Real data from user_supplements table. AI recommendations with evidence
// badges, budget tracking, tier grouping, and daily logging.
// =============================================================================

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { ScreenHelpButton } from '@components/ui/ScreenHelpButton';
import { ScreenBackground } from '@components/ui/ScreenBackground';
import { AmbientBackground } from '@components/ui/AmbientBackground';
import { SCREEN_HELP } from '../../../constants/screenHelp';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme/index';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Modal } from '@components/ui/Modal';
import { Input } from '@components/ui/Input';
import { ProgressRing } from '@components/ui/ProgressRing';
import { Skeleton } from '@components/ui/Skeleton';
import { EvidenceBadge } from '@components/ui/EvidenceBadge';
import { BudgetBar } from '@components/ui/BudgetBar';
import { Disclaimer } from '@components/ui/Disclaimer';
import { SupplementDaysRemaining } from '@components/nutrition/SupplementDaysRemaining';
import { useSupplementsStore } from '@stores/supplementsStore';
import { hapticLight, hapticSuccess, hapticMedium } from '@utils/haptics';
import { AIInsightCard } from '@components/cards/AIInsightCard';
import { HelpBubble } from '@components/ui/HelpBubble';
import { differenceInDays } from 'date-fns';
import type {
  SupplementCategory,
  SupplementRecommendation,
  SupplementTier,
  UserSupplement,
} from '@app-types/ai';

/** Estimate doses taken based on days since purchase/creation and frequency */
function estimateDosesTaken(sup: UserSupplement): number {
  const startDate = sup.purchased_at ?? sup.created_at;
  const daysSince = differenceInDays(new Date(), new Date(startDate));
  const dailyRate = getDailyRate(sup.frequency);
  return Math.max(0, Math.round(daysSince * dailyRate));
}

function getDailyRate(frequency: string): number {
  switch (frequency) {
    case 'twice_daily': return 2;
    case 'weekly': return 1 / 7;
    case 'as_needed': return 0.5;
    default: return 1; // 'daily' and fallback
  }
}

const TIER_ORDER: SupplementTier[] = ['essential', 'recommended', 'optional'];

const TIER_LABEL: Record<SupplementTier, string> = {
  essential: 'Essential',
  recommended: 'Recommended',
  optional: 'Optional',
};

const TIER_ICON: Record<SupplementTier, React.ComponentProps<typeof Ionicons>['name']> = {
  essential: 'shield-checkmark',
  recommended: 'star',
  optional: 'leaf',
};

const CATEGORY_OPTIONS: { key: SupplementCategory; label: string }[] = [
  { key: 'protein', label: 'Protein' },
  { key: 'creatine', label: 'Creatine' },
  { key: 'vitamin', label: 'Vitamins' },
  { key: 'mineral', label: 'Minerals' },
  { key: 'amino_acid', label: 'Amino Acids' },
  { key: 'pre_workout', label: 'Pre-Workout' },
  { key: 'post_workout', label: 'Post-Workout' },
  { key: 'sleep', label: 'Sleep' },
  { key: 'adaptogen', label: 'Adaptogen' },
  { key: 'omega', label: 'Omega' },
  { key: 'probiotic', label: 'Probiotic' },
  { key: 'other', label: 'Other' },
];

function groupByTier(
  supplements: UserSupplement[],
): { tier: SupplementTier; items: UserSupplement[] }[] {
  const map = new Map<SupplementTier, UserSupplement[]>();
  for (const sup of supplements) {
    const list = map.get(sup.tier) ?? [];
    list.push(sup);
    map.set(sup.tier, list);
  }
  return TIER_ORDER.filter((t) => map.has(t)).map((tier) => ({
    tier,
    items: map.get(tier) ?? [],
  }));
}

export default function SupplementsScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => <ScreenHelpButton content={SCREEN_HELP.supplements} />,
    });
  }, [navigation]);

  const supplements = useSupplementsStore((s) => s.supplements);
  const todayLogs = useSupplementsStore((s) => s.todayLogs);
  const budget = useSupplementsStore((s) => s.budget);
  const aiRecommendations = useSupplementsStore((s) => s.aiRecommendations);
  const interactionWarnings = useSupplementsStore((s) => s.interactionWarnings);
  const isLoading = useSupplementsStore((s) => s.isLoadingSupplements);
  const isLoadingRecs = useSupplementsStore((s) => s.isLoadingRecommendations);
  const error = useSupplementsStore((s) => s.error);

  const fetchAll = useSupplementsStore((s) => s.fetchAll);
  const fetchRecommendations = useSupplementsStore((s) => s.fetchRecommendations);
  const addSupplement = useSupplementsStore((s) => s.addSupplement);
  const addFromRecommendation = useSupplementsStore((s) => s.addFromRecommendation);
  const toggleActive = useSupplementsStore((s) => s.toggleActive);
  const removeSupplement = useSupplementsStore((s) => s.removeSupplement);
  const logTaken = useSupplementsStore((s) => s.logTaken);
  const setBudget = useSupplementsStore((s) => s.setBudget);
  const clearError = useSupplementsStore((s) => s.clearError);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');
  const [newName, setNewName] = useState('');
  const [newDosage, setNewDosage] = useState('');
  const [newCategory, setNewCategory] = useState<SupplementCategory>('vitamin');
  const [newCost, setNewCost] = useState('');

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  const activeSupplements = useMemo(
    () => supplements.filter((s) => s.is_active),
    [supplements],
  );
  const inactiveSupplements = useMemo(
    () => supplements.filter((s) => !s.is_active),
    [supplements],
  );
  const grouped = useMemo(() => groupByTier(activeSupplements), [activeSupplements]);

  const totalMonthlyCost = useMemo(
    () => activeSupplements.reduce((acc, s) => acc + (s.monthly_cost ?? 0), 0),
    [activeSupplements],
  );

  const takenIds = useMemo(
    () => new Set(todayLogs.map((l) => l.supplement_id)),
    [todayLogs],
  );
  const takenCount = activeSupplements.filter((s) => takenIds.has(s.id)).length;

  const handleLogTaken = useCallback(
    async (sup: UserSupplement) => {
      void hapticSuccess();
      await logTaken(sup.id);
    },
    [logTaken],
  );

  const handleToggleActive = useCallback(
    (sup: UserSupplement) => {
      void hapticMedium();
      void toggleActive(sup.id, !sup.is_active);
    },
    [toggleActive],
  );

  const handleDelete = useCallback(
    (sup: UserSupplement) => {
      void hapticMedium();
      Alert.alert('Delete Supplement', `Remove ${sup.name} permanently?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => void removeSupplement(sup.id),
        },
      ]);
    },
    [removeSupplement],
  );

  const handleAddSupplement = useCallback(async () => {
    if (newName.trim().length === 0) return;
    void hapticSuccess();
    await addSupplement({
      name: newName.trim(),
      dosage: newDosage.trim() || undefined,
      category: newCategory,
      monthlyCost: parseFloat(newCost) || 0,
    });
    setShowAddModal(false);
    setNewName('');
    setNewDosage('');
    setNewCost('');
  }, [addSupplement, newCategory, newCost, newDosage, newName]);

  const handleAddRec = useCallback(
    async (rec: SupplementRecommendation) => {
      void hapticSuccess();
      await addFromRecommendation(rec);
      Alert.alert('Added!', `${rec.name} has been added to your supplements.`);
    },
    [addFromRecommendation],
  );

  const handleSaveBudget = useCallback(async () => {
    const amount = parseFloat(budgetInput);
    if (isNaN(amount) || amount < 0) return;
    await setBudget(amount);
    setShowBudgetModal(false);
    setBudgetInput('');
  }, [budgetInput, setBudget]);

  const tierColor = useCallback(
    (tier: SupplementTier): string => {
      switch (tier) {
        case 'essential':
          return colors.accent.success;
        case 'recommended':
          return colors.accent.cyan;
        case 'optional':
          return colors.text.muted;
      }
    },
    [colors],
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <ScreenBackground />
      <AmbientBackground />
      <StatusBar style="light" backgroundColor="#0C0A15" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{  padding: spacing.lg, paddingBottom: insets.bottom + 90 }}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={{ gap: spacing.md }}>
            <Skeleton variant="card" height={80} />
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} variant="card" height={72} />
            ))}
          </View>
        ) : (
          <>
            <AIInsightCard screenKey="nutrition/supplements" style={{ marginBottom: spacing.md }} />

            {error && (
              <Pressable
                onPress={clearError}
                style={[
                  styles.errorBanner,
                  {
                    backgroundColor: colors.accent.dangerDim,
                    borderColor: colors.accent.danger,
                    borderRadius: borderRadius.md,
                    padding: spacing.md,
                    marginBottom: spacing.md,
                  },
                ]}
              >
                <Ionicons name="alert-circle-outline" size={18} color={colors.accent.danger} />
                <Text
                  style={[typography.caption, { color: colors.accent.danger, marginLeft: spacing.sm, flex: 1 }]}
                  numberOfLines={2}
                >
                  {error}
                </Text>
              </Pressable>
            )}

            {/* Summary */}
            <Animated.View entering={FadeInDown.duration(300)}>
              <Card style={{ marginBottom: spacing.md }}>
                <View style={styles.summaryRow}>
                  <ProgressRing
                    progress={activeSupplements.length > 0 ? takenCount / activeSupplements.length : 0}
                    size={72}
                    strokeWidth={6}
                    color={colors.accent.success}
                  >
                    <Text style={[typography.monoCaption, { color: colors.text.primary, fontWeight: '600' }]}>
                      {takenCount}/{activeSupplements.length}
                    </Text>
                  </ProgressRing>
                  <View style={{ flex: 1, marginLeft: spacing.lg }}>
                    <Text style={[typography.h3, { color: colors.text.primary }]}>
                      Today's Supplements
                    </Text>
                    <Text style={[typography.caption, { color: colors.text.muted, marginTop: 4 }]}>
                      {activeSupplements.length - takenCount} remaining
                    </Text>
                  </View>
                </View>
              </Card>
            </Animated.View>

            {/* Budget Bar */}
            <Animated.View entering={FadeInDown.delay(50).duration(300)}>
              <Card style={{ marginBottom: spacing.md }}>
                <Pressable
                  onPress={() => {
                    void hapticLight();
                    setBudgetInput(budget > 0 ? budget.toString() : '');
                    setShowBudgetModal(true);
                  }}
                  accessibilityLabel="Edit supplement budget"
                  accessibilityRole="button"
                >
                  {budget > 0 ? (
                    <BudgetBar spent={totalMonthlyCost} budget={budget} />
                  ) : (
                    <View style={styles.noBudgetRow}>
                      <Ionicons name="wallet-outline" size={20} color={colors.text.muted} />
                      <Text
                        style={[typography.caption, { color: colors.text.muted, marginLeft: spacing.sm }]}
                      >
                        Tap to set a monthly supplement budget
                      </Text>
                    </View>
                  )}
                </Pressable>
              </Card>
            </Animated.View>

            {/* Interaction Warnings */}
            {interactionWarnings.length > 0 && (
              <Animated.View entering={FadeInDown.delay(80).duration(300)}>
                <Card
                  style={{
                    marginBottom: spacing.md,
                    borderLeftWidth: 3,
                    borderLeftColor: colors.accent.warning,
                  }}
                >
                  <View style={styles.warningHeader}>
                    <Ionicons name="warning-outline" size={20} color={colors.accent.warning} />
                    <Text
                      style={[
                        typography.bodyBold,
                        { color: colors.accent.warning, marginLeft: spacing.sm },
                      ]}
                    >
                      Interaction Warnings
                    </Text>
                  </View>
                  {interactionWarnings.map((w, idx) => (
                    <View key={`warn-${idx}`} style={{ marginTop: spacing.md }}>
                      <Badge
                        label={w.severity.toUpperCase()}
                        variant={
                          w.severity === 'high'
                            ? 'danger'
                            : w.severity === 'medium'
                            ? 'warning'
                            : 'info'
                        }
                        size="sm"
                      />
                      <Text
                        style={[
                          typography.caption,
                          { color: colors.text.secondary, marginTop: spacing.xs },
                        ]}
                      >
                        <Text style={{ fontWeight: '600' }}>{w.supplements.join(' + ')}: </Text>
                        {w.warning}
                      </Text>
                    </View>
                  ))}
                </Card>
              </Animated.View>
            )}

            {/* Tier-Grouped Supplements */}
            {grouped.map((group, groupIdx) => (
              <Animated.View
                key={group.tier}
                entering={FadeInDown.delay(100 + groupIdx * 60).duration(300)}
              >
                <View style={[styles.tierHeader, { marginTop: spacing.md, marginBottom: spacing.sm }]}>
                  <Ionicons
                    name={TIER_ICON[group.tier]}
                    size={16}
                    color={tierColor(group.tier)}
                  />
                  <Text
                    style={[
                      typography.captionBold,
                      {
                        color: tierColor(group.tier),
                        marginLeft: spacing.xs,
                        textTransform: 'uppercase',
                        letterSpacing: 1,
                      },
                    ]}
                  >
                    {TIER_LABEL[group.tier]}
                  </Text>
                </View>
                {group.items.map((sup) => {
                  const taken = takenIds.has(sup.id);
                  return (
                    <Card key={sup.id} style={{ marginBottom: spacing.sm, opacity: taken ? 0.65 : 1 }}>
                      <View style={styles.suppRow}>
                        <View style={{ flex: 1 }}>
                          <View style={[styles.suppNameRow, { gap: spacing.sm }]}>
                            <Text style={[typography.bodyBold, { color: colors.text.primary }]}>
                              {sup.name}
                            </Text>
                            {taken && (
                              <Ionicons name="checkmark-circle" size={18} color={colors.accent.success} />
                            )}
                          </View>
                          <View style={[styles.suppMeta, { gap: spacing.sm, marginTop: spacing.xs }]}>
                            {sup.dosage && <Badge label={sup.dosage} size="sm" />}
                            {sup.monthly_cost > 0 && (
                              <Badge label={`$${sup.monthly_cost}/mo`} size="sm" variant="info" />
                            )}
                            {sup.is_ai_recommended && (
                              <Badge label="AI Rec" size="sm" variant="success" />
                            )}
                          </View>
                          <View style={{ marginTop: spacing.xs }}>
                            <EvidenceBadge
                              level={sup.evidence_level}
                              sources={sup.evidence_sources}
                              compact
                            />
                          </View>
                          {sup.bottle_size != null && sup.bottle_size > 0 && (
                            <SupplementDaysRemaining
                              bottleSize={sup.bottle_size}
                              dosesTaken={estimateDosesTaken(sup)}
                              dailyRate={getDailyRate(sup.frequency)}
                            />
                          )}
                          {sup.ai_recommendation_reason && (
                            <Text
                              style={[
                                typography.tiny,
                                { color: colors.text.muted, marginTop: spacing.xs },
                              ]}
                              numberOfLines={2}
                            >
                              {sup.ai_recommendation_reason}
                            </Text>
                          )}
                        </View>
                        <View style={[styles.suppActions, { gap: spacing.sm }]}>
                          {!taken && (
                            <Pressable
                              onPress={() => void handleLogTaken(sup)}
                              accessibilityLabel={`Mark ${sup.name} as taken`}
                              style={[
                                styles.actionBtn,
                                {
                                  backgroundColor: colors.accent.successDim,
                                  borderRadius: borderRadius.md,
                                },
                              ]}
                            >
                              <Ionicons name="checkmark" size={20} color={colors.accent.success} />
                            </Pressable>
                          )}
                          <Pressable
                            onPress={() => handleToggleActive(sup)}
                            accessibilityLabel={`Pause ${sup.name}`}
                            style={[
                              styles.actionBtn,
                              {
                                backgroundColor: colors.accent.warningDim,
                                borderRadius: borderRadius.md,
                              },
                            ]}
                          >
                            <Ionicons name="pause" size={16} color={colors.accent.warning} />
                          </Pressable>
                          <Pressable
                            onPress={() => handleDelete(sup)}
                            accessibilityLabel={`Delete ${sup.name}`}
                            style={[
                              styles.actionBtn,
                              {
                                backgroundColor: colors.accent.dangerDim,
                                borderRadius: borderRadius.md,
                              },
                            ]}
                          >
                            <Ionicons name="trash-outline" size={16} color={colors.accent.danger} />
                          </Pressable>
                        </View>
                      </View>
                    </Card>
                  );
                })}
              </Animated.View>
            ))}
            <HelpBubble id="supps_tiers" message="Start with essentials, add more if budget allows" position="below" />

            {activeSupplements.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="medical-outline" size={48} color={colors.text.muted} />
                <Text style={[typography.body, { color: colors.text.muted, marginTop: spacing.md }]}>
                  No supplements yet
                </Text>
              </View>
            )}

            {/* Inactive */}
            {inactiveSupplements.length > 0 && (
              <View style={{ marginTop: spacing.xl }}>
                <Text style={[typography.h3, { color: colors.text.muted, marginBottom: spacing.md }]}>
                  Inactive
                </Text>
                {inactiveSupplements.map((sup) => (
                  <Pressable
                    key={sup.id}
                    onPress={() => handleToggleActive(sup)}
                    accessibilityLabel={`Reactivate ${sup.name}`}
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
                      <Text style={[typography.body, { color: colors.text.muted }]}>{sup.name}</Text>
                      {sup.dosage && (
                        <Text style={[typography.tiny, { color: colors.text.muted }]}>{sup.dosage}</Text>
                      )}
                    </View>
                    <Ionicons name="play-circle-outline" size={22} color={colors.accent.primary} />
                  </Pressable>
                ))}
              </View>
            )}

            {/* AI Recommendations */}
            <View style={{ marginTop: spacing.xl }}>
              <View style={[styles.sectionHeader, { marginBottom: spacing.md }]}>
                <Ionicons name="sparkles" size={20} color={colors.accent.primary} />
                <Text
                  style={[typography.h3, { color: colors.text.primary, marginLeft: spacing.sm, flex: 1 }]}
                >
                  AI Recommendations
                </Text>
                <Button
                  title={isLoadingRecs ? 'Analyzing…' : 'Refresh'}
                  variant="ghost"
                  size="sm"
                  loading={isLoadingRecs}
                  onPress={() => void fetchRecommendations()}
                />
              </View>

              <HelpBubble id="supps_evidence" message="Tap the badge to see research behind each one" position="below" />

              {isLoadingRecs && aiRecommendations.length === 0 && (
                <View style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
                  <ActivityIndicator color={colors.accent.cyan} />
                  <Text
                    style={[
                      typography.caption,
                      { color: colors.text.muted, marginTop: spacing.md },
                    ]}
                  >
                    Analyzing your profile, training, nutrition, sleep, and labs…
                  </Text>
                </View>
              )}

              {aiRecommendations.map((rec, idx) => (
                <Card key={`rec-${idx}`} style={{ marginBottom: spacing.sm }}>
                  <View style={styles.recRow}>
                    <View style={{ flex: 1 }}>
                      <View style={[styles.recHeader, { gap: spacing.sm }]}>
                        <Text style={[typography.bodyBold, { color: colors.text.primary }]}>
                          {rec.name}
                        </Text>
                        <Badge label={rec.dosage} size="sm" variant="info" />
                      </View>
                      <View style={[styles.recMeta, { gap: spacing.sm, marginTop: spacing.xs }]}>
                        <Badge
                          label={TIER_LABEL[rec.tier]}
                          size="sm"
                          variant={rec.tier === 'essential' ? 'success' : rec.tier === 'recommended' ? 'info' : 'default'}
                        />
                        {rec.monthly_cost > 0 && (
                          <Badge label={`$${rec.monthly_cost}/mo`} size="sm" />
                        )}
                      </View>
                      <View style={{ marginTop: spacing.xs }}>
                        <EvidenceBadge
                          level={rec.evidence_level}
                          sources={rec.evidence_sources}
                        />
                      </View>
                      <Text
                        style={[
                          typography.caption,
                          { color: colors.text.muted, marginTop: spacing.xs },
                        ]}
                      >
                        {rec.reason}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => void handleAddRec(rec)}
                      accessibilityLabel={`Add ${rec.name} to supplements`}
                      style={[
                        styles.addRecBtn,
                        {
                          backgroundColor: colors.accent.primaryDim,
                          borderRadius: borderRadius.md,
                        },
                      ]}
                    >
                      <Ionicons name="add" size={20} color={colors.accent.primary} />
                    </Pressable>
                  </View>
                </Card>
              ))}
            </View>

            <View style={{ marginTop: spacing.xl }}>
              <Disclaimer type="supplement" />
            </View>
          </>
        )}
      </ScrollView>

      {/* Add FAB */}
      <Pressable
        onPress={() => {
          void hapticLight();
          setShowAddModal(true);
        }}
        accessibilityLabel="Add new supplement"
        accessibilityRole="button"
        style={[styles.fab, { backgroundColor: colors.accent.primary, borderRadius: borderRadius.full }]}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </Pressable>

      {/* Add Modal */}
      <Modal visible={showAddModal} onDismiss={() => setShowAddModal(false)} title="Add Supplement">
        <ScrollView
          style={{ maxHeight: 500 }}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
        >
          <Input label="Name" placeholder="e.g. Vitamin D3" value={newName} onChangeText={setNewName} />
          <Input label="Dosage" placeholder="e.g. 5000 IU" value={newDosage} onChangeText={setNewDosage} />
          <Input
            label="Monthly cost ($)"
            placeholder="0"
            value={newCost}
            onChangeText={setNewCost}
            keyboardType="decimal-pad"
          />

          <Text style={[typography.caption, { color: colors.text.secondary }]}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingRight: spacing.lg }}>
            {CATEGORY_OPTIONS.map((cat) => (
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
                <Text
                  style={[
                    typography.tiny,
                    { color: newCategory === cat.key ? colors.text.inverse : colors.text.secondary },
                  ]}
                >
                  {cat.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <Button
            title="Add Supplement"
            onPress={() => void handleAddSupplement()}
            disabled={newName.trim().length === 0}
            fullWidth
            style={{ marginTop: spacing.md }}
          />
        </ScrollView>
      </Modal>

      {/* Budget Modal */}
      <Modal
        visible={showBudgetModal}
        onDismiss={() => setShowBudgetModal(false)}
        title="Monthly Supplement Budget"
      >
        <View style={{ padding: spacing.lg, gap: spacing.md }}>
          <Input
            label="Budget ($)"
            placeholder="e.g. 100"
            value={budgetInput}
            onChangeText={setBudgetInput}
            keyboardType="decimal-pad"
          />
          <Button
            title="Save Budget"
            onPress={() => void handleSaveBudget()}
            fullWidth
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  warningHeader: { flexDirection: 'row', alignItems: 'center' },
  tierHeader: { flexDirection: 'row', alignItems: 'center' },
  suppRow: { flexDirection: 'row', alignItems: 'flex-start' },
  suppNameRow: { flexDirection: 'row', alignItems: 'center' },
  suppMeta: { flexDirection: 'row', flexWrap: 'wrap' },
  suppActions: { marginLeft: 12, alignItems: 'center' },
  actionBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  inactiveRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(168, 85, 247, 0.15)' },
  noBudgetRow: { flexDirection: 'row', alignItems: 'center' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center' },
  recRow: { flexDirection: 'row', alignItems: 'flex-start' },
  recHeader: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  recMeta: { flexDirection: 'row', flexWrap: 'wrap' },
  addRecBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center', marginLeft: 12 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  filterChip: { flexDirection: 'row', alignItems: 'center' },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000', /* brand-ok */
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  errorBanner: { flexDirection: 'row', alignItems: 'center', borderWidth: 1 },
});
