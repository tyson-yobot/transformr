// =============================================================================
// TRANSFORMR -- Business Milestones Screen
// =============================================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { ProgressBar } from '@components/ui/ProgressBar';
import { Input } from '@components/ui/Input';
import { Modal } from '@components/ui/Modal';
import { Skeleton } from '@components/ui/Skeleton';
import { useBusinessStore } from '@stores/businessStore';
import { formatCurrency, formatDate, formatDateInput, dateInputToISO } from '@utils/formatters';
import { hapticLight, hapticSuccess } from '@utils/haptics';
import { supabase } from '@services/supabase';
import type { BusinessMilestone } from '@app-types/database';

export default function MilestonesScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const { businesses } = useBusinessStore();

  const [milestones, setMilestones] = useState<BusinessMilestone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<BusinessMilestone | null>(null);

  const [formTitle, setFormTitle] = useState('');
  const [formMetric, setFormMetric] = useState('');
  const [formTargetValue, setFormTargetValue] = useState('');
  const [formCurrentValue, setFormCurrentValue] = useState('');
  const [formTargetDate, setFormTargetDate] = useState('');

  const selectedBusiness = businesses[0] ?? null;

  const fetchMilestones = useCallback(async () => {
    if (!selectedBusiness) return;
    try {
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('business_milestones')
        .select('*')
        .eq('business_id', selectedBusiness.id)
        .order('sort_order', { ascending: true });
      if (fetchError) throw fetchError;
      setMilestones((data ?? []) as BusinessMilestone[]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch milestones';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [selectedBusiness]);

  useEffect(() => {
    fetchMilestones();
  }, [fetchMilestones]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMilestones();
    setRefreshing(false);
  }, [fetchMilestones]);

  const resetForm = useCallback(() => {
    setFormTitle('');
    setFormMetric('');
    setFormTargetValue('');
    setFormCurrentValue('');
    setFormTargetDate('');
    setEditingMilestone(null);
  }, []);

  const openEditModal = useCallback((milestone: BusinessMilestone) => {
    setEditingMilestone(milestone);
    setFormTitle(milestone.title);
    setFormMetric(milestone.target_metric ?? '');
    setFormTargetValue(milestone.target_value?.toString() ?? '');
    setFormCurrentValue(milestone.current_value?.toString() ?? '');
    setFormTargetDate(milestone.target_date ?? '');
    setShowAddModal(true);
  }, []);

  const handleSaveMilestone = useCallback(async () => {
    if (!formTitle.trim() || !selectedBusiness) return;
    try {
      const payload = {
        business_id: selectedBusiness.id,
        title: formTitle.trim(),
        target_metric: formMetric.trim() || undefined,
        target_value: formTargetValue ? parseFloat(formTargetValue) : undefined,
        current_value: formCurrentValue ? parseFloat(formCurrentValue) : undefined,
        target_date: dateInputToISO(formTargetDate) || undefined,
      };

      if (editingMilestone) {
        const { data, error: updateError } = await supabase
          .from('business_milestones')
          .update(payload)
          .eq('id', editingMilestone.id)
          .select()
          .single();
        if (updateError) throw updateError;
        setMilestones((prev) =>
          prev.map((m) => (m.id === editingMilestone.id ? (data as BusinessMilestone) : m)),
        );
      } else {
        const { data, error: insertError } = await supabase
          .from('business_milestones')
          .insert({ ...payload, sort_order: milestones.length })
          .select()
          .single();
        if (insertError) throw insertError;
        setMilestones((prev) => [...prev, data as BusinessMilestone]);
      }

      await hapticSuccess();
      setShowAddModal(false);
      resetForm();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save milestone';
      setError(message);
    }
  }, [formTitle, formMetric, formTargetValue, formCurrentValue, formTargetDate, selectedBusiness, editingMilestone, milestones.length, resetForm]);

  const handleToggleComplete = useCallback(async (milestone: BusinessMilestone) => {
    const newCompleted = !milestone.is_completed;
    try {
      const { data, error: updateError } = await supabase
        .from('business_milestones')
        .update({
          is_completed: newCompleted,
          completed_at: newCompleted ? new Date().toISOString() : null,
        })
        .eq('id', milestone.id)
        .select()
        .single();
      if (updateError) throw updateError;
      setMilestones((prev) =>
        prev.map((m) => (m.id === milestone.id ? (data as BusinessMilestone) : m)),
      );
      if (newCompleted) await hapticSuccess();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update milestone';
      setError(message);
    }
  }, []);

  const { active, completed } = useMemo(() => {
    const a: BusinessMilestone[] = [];
    const c: BusinessMilestone[] = [];
    for (const m of milestones) {
      if (m.is_completed) c.push(m);
      else a.push(m);
    }
    return { active: a, completed: c };
  }, [milestones]);

  const getMilestoneProgress = (m: BusinessMilestone): number => {
    if (m.is_completed) return 1;
    if (!m.target_value || m.target_value === 0) return 0;
    return Math.min((m.current_value ?? 0) / m.target_value, 1);
  };

  if (isLoading) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
        <View style={{ padding: spacing.lg, gap: spacing.md }}>
          <Skeleton variant="card" height={120} />
          <Skeleton variant="card" height={120} />
          <Skeleton variant="card" height={120} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { padding: spacing.lg }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent.primary} />
        }
      >
        {error && (
          <Card style={{ marginBottom: spacing.md }}>
            <Text style={[typography.body, { color: colors.accent.danger, textAlign: 'center' }]}>{error}</Text>
          </Card>
        )}

        <Text style={[typography.h3, { color: colors.text.primary, marginBottom: spacing.md }]}>
          Active Milestones
        </Text>

        {active.map((milestone, index) => {
          const progress = getMilestoneProgress(milestone);
          return (
            <Animated.View key={milestone.id} entering={FadeInDown.delay(100 + index * 60)}>
              <Card style={{ marginBottom: spacing.md }} onPress={() => openEditModal(milestone)}>
                <View style={styles.milestoneHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.bodyBold, { color: colors.text.primary }]} numberOfLines={2}>
                      {milestone.title}
                    </Text>
                    {milestone.target_metric && (
                      <Text style={[typography.caption, { color: colors.text.secondary, marginTop: spacing.xs }]}>
                        Metric: {milestone.target_metric}
                      </Text>
                    )}
                  </View>
                  <Pressable onPress={() => { hapticLight(); handleToggleComplete(milestone); }} accessibilityLabel={`Mark ${milestone.title} as complete`}>
                    <View style={[styles.checkBox, { borderColor: colors.accent.primary, borderRadius: borderRadius.sm }]} />
                  </Pressable>
                </View>

                <ProgressBar progress={progress} showPercentage style={{ marginTop: spacing.md }} />

                {milestone.target_value != null && (
                  <Text style={[typography.tiny, { color: colors.text.muted, marginTop: spacing.xs }]}>
                    <Text style={typography.monoBody}>{formatCurrency(milestone.current_value ?? 0)}</Text> / <Text style={typography.monoBody}>{formatCurrency(milestone.target_value)}</Text>
                  </Text>
                )}

                {milestone.target_date && (
                  <Text style={[typography.tiny, { color: colors.text.muted, marginTop: spacing.xs }]}>
                    Target: {formatDate(milestone.target_date)}
                  </Text>
                )}
              </Card>
            </Animated.View>
          );
        })}

        {active.length === 0 && (
          <Card style={{ marginBottom: spacing.lg }}>
            <Text style={[typography.body, { color: colors.text.secondary, textAlign: 'center' }]}>
              No active milestones. Set your first target!
            </Text>
          </Card>
        )}

        {completed.length > 0 && (
          <>
            <Text style={[typography.h3, { color: colors.text.primary, marginTop: spacing.xl, marginBottom: spacing.md }]}>
              Completed ({completed.length})
            </Text>
            {completed.map((milestone, index) => (
              <Animated.View key={milestone.id} entering={FadeInDown.delay(300 + index * 40)}>
                <View
                  style={[styles.completedRow, {
                    backgroundColor: colors.background.secondary,
                    borderRadius: borderRadius.md,
                    padding: spacing.md,
                    marginBottom: spacing.sm,
                  }]}
                >
                  <Pressable onPress={() => { hapticLight(); handleToggleComplete(milestone); }} accessibilityLabel={`Mark ${milestone.title} as incomplete`}>
                    <View style={[styles.checkBoxDone, { backgroundColor: colors.accent.success, borderRadius: borderRadius.sm }]}>
                      <Text style={{ color: colors.text.inverse, fontSize: 12 }}>{'\u2713'}</Text>
                    </View>
                  </Pressable>
                  <View style={{ flex: 1, marginLeft: spacing.md }}>
                    <Text
                      style={[typography.body, { color: colors.text.secondary, textDecorationLine: 'line-through' }]}
                      numberOfLines={1}
                    >
                      {milestone.title}
                    </Text>
                    {milestone.completed_at && (
                      <Text style={[typography.tiny, { color: colors.text.muted }]}>
                        Completed {formatDate(milestone.completed_at)}
                      </Text>
                    )}
                  </View>
                  {milestone.celebration_message && <Badge label="Celebrated" variant="success" size="sm" />}
                </View>
              </Animated.View>
            ))}
          </>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      <Pressable
        onPress={() => { hapticLight(); resetForm(); setShowAddModal(true); }}
        accessibilityLabel="Add new milestone"
        style={[styles.fab, { backgroundColor: colors.accent.primary, borderRadius: 28, shadowColor: colors.accent.primary }]}
      >
        <Text style={[typography.h2, { color: colors.text.inverse }]}>+</Text>
      </Pressable>

      <Modal
        visible={showAddModal}
        onDismiss={() => { setShowAddModal(false); resetForm(); }}
        title={editingMilestone ? 'Edit Milestone' : 'Add Milestone'}
      >
        <Input label="Milestone Title" value={formTitle} onChangeText={setFormTitle} placeholder="e.g. Reach $10K MRR" />
        <Input label="Target Metric (optional)" value={formMetric} onChangeText={setFormMetric} placeholder="e.g. MRR, Customers" containerStyle={{ marginTop: spacing.md }} />
        <Input label="Target Value ($)" value={formTargetValue} onChangeText={setFormTargetValue} placeholder="10000" keyboardType="decimal-pad" containerStyle={{ marginTop: spacing.md }} />
        <Input label="Current Value ($)" value={formCurrentValue} onChangeText={setFormCurrentValue} placeholder="0" keyboardType="decimal-pad" containerStyle={{ marginTop: spacing.md }} />
        <Input label="Target Date (optional)" value={formTargetDate} onChangeText={(t) => setFormTargetDate(formatDateInput(t))} placeholder="MM/DD/YYYY" keyboardType="number-pad" maxLength={10} containerStyle={{ marginTop: spacing.md }} />
        <Button
          title={editingMilestone ? 'Update Milestone' : 'Create Milestone'}
          onPress={handleSaveMilestone}
          fullWidth
          disabled={!formTitle.trim()}
          style={{ marginTop: spacing.xl }}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingBottom: 24 },
  milestoneHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  checkBox: { width: 24, height: 24, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  checkBoxDone: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  completedRow: { flexDirection: 'row', alignItems: 'center' },
  fab: {
    position: 'absolute', bottom: 24, right: 24, width: 56, height: 56,
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
  },
});
