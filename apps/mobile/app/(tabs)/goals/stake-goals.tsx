// =============================================================================
// TRANSFORMR -- Stake Goals
// =============================================================================

import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Input } from '@components/ui/Input';
import { Modal } from '@components/ui/Modal';
import { ProgressBar } from '@components/ui/ProgressBar';
import { Chip } from '@components/ui/Chip';
import { hapticSuccess, hapticWarning } from '@utils/haptics';
import { formatCurrency } from '@utils/formatters';
import type { StakeGoal, StakeEvaluation, Goal } from '@app-types/database';

interface StakeGoalWithDetails extends StakeGoal {
  goalTitle: string;
  evaluations: StakeEvaluation[];
}

export default function StakeGoalsScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();

  const [stakeGoals, setStakeGoals] = useState<StakeGoalWithDetails[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [stakeAmount, setStakeAmount] = useState('');
  const [charityName, setCharityName] = useState('');
  const [evaluationFreq, setEvaluationFreq] = useState<StakeGoal['evaluation_frequency']>('weekly');

  const totalSaved = useMemo(
    () => stakeGoals.reduce((sum, sg) => sum + (sg.total_saved ?? 0), 0),
    [stakeGoals],
  );

  const totalLost = useMemo(
    () => stakeGoals.reduce((sum, sg) => sum + (sg.total_lost ?? 0), 0),
    [stakeGoals],
  );

  const handleCreateStake = useCallback(() => {
    if (!newGoalTitle.trim() || !stakeAmount.trim()) return;
    const amount = parseFloat(stakeAmount);
    if (isNaN(amount) || amount <= 0) return;

    const newStake: StakeGoalWithDetails = {
      id: Date.now().toString(),
      goal_id: Date.now().toString(),
      stake_amount: amount,
      evaluation_frequency: evaluationFreq,
      charity_name: charityName.trim() || undefined,
      total_saved: 0,
      total_lost: 0,
      is_active: true,
      goalTitle: newGoalTitle.trim(),
      evaluations: [],
    };

    setStakeGoals((prev) => [...prev, newStake]);
    setShowCreateModal(false);
    setNewGoalTitle('');
    setStakeAmount('');
    setCharityName('');
    hapticSuccess();
  }, [newGoalTitle, stakeAmount, charityName, evaluationFreq]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { padding: spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary */}
        <Animated.View entering={FadeInDown.delay(100)}>
          <View style={[styles.summaryRow, { gap: spacing.md }]}>
            <Card style={{ flex: 1 }} variant="elevated">
              <Text style={[typography.captionBold, { color: colors.accent.success }]}>
                Total Saved
              </Text>
              <Text style={[typography.stat, { color: colors.accent.success }]}>
                {formatCurrency(totalSaved)}
              </Text>
            </Card>
            <Card style={{ flex: 1 }} variant="elevated">
              <Text style={[typography.captionBold, { color: colors.accent.danger }]}>
                Total Lost
              </Text>
              <Text style={[typography.stat, { color: colors.accent.danger }]}>
                {formatCurrency(totalLost)}
              </Text>
            </Card>
          </View>
        </Animated.View>

        {/* Active Stake Goals */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <Text
            style={[
              typography.h3,
              { color: colors.text.primary, marginTop: spacing.xl, marginBottom: spacing.md },
            ]}
          >
            Active Stakes
          </Text>
        </Animated.View>

        {stakeGoals
          .filter((sg) => sg.is_active)
          .map((stakeGoal, index) => {
            const passCount = stakeGoal.evaluations.filter((e) => e.passed).length;
            const failCount = stakeGoal.evaluations.filter((e) => !e.passed).length;
            const totalEvals = stakeGoal.evaluations.length;
            const passRate = totalEvals > 0 ? passCount / totalEvals : 0;

            return (
              <Animated.View key={stakeGoal.id} entering={FadeInDown.delay(300 + index * 50)}>
                <Card style={{ marginBottom: spacing.md }}>
                  <View style={styles.stakeHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={[typography.bodyBold, { color: colors.text.primary }]}>
                        {stakeGoal.goalTitle}
                      </Text>
                      <Text style={[typography.caption, { color: colors.text.secondary }]}>
                        {formatCurrency(stakeGoal.stake_amount)} per {stakeGoal.evaluation_frequency ?? 'week'}
                      </Text>
                    </View>
                    <Badge
                      label={stakeGoal.is_active ? 'Active' : 'Inactive'}
                      variant={stakeGoal.is_active ? 'success' : 'default'}
                      size="sm"
                    />
                  </View>

                  {stakeGoal.charity_name && (
                    <Text
                      style={[
                        typography.tiny,
                        { color: colors.text.muted, marginTop: spacing.xs },
                      ]}
                    >
                      Charity: {stakeGoal.charity_name}
                    </Text>
                  )}

                  {totalEvals > 0 && (
                    <View style={{ marginTop: spacing.md }}>
                      <ProgressBar
                        progress={passRate}
                        label="Pass Rate"
                        showPercentage
                        color={passRate >= 0.8 ? colors.accent.success : colors.accent.warning}
                      />
                      <View style={[styles.evalRow, { marginTop: spacing.sm }]}>
                        <Text style={[typography.tiny, { color: colors.accent.success }]}>
                          {passCount} passed
                        </Text>
                        <Text style={[typography.tiny, { color: colors.accent.danger }]}>
                          {failCount} failed
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Evaluation History */}
                  {stakeGoal.evaluations.length > 0 && (
                    <View style={{ marginTop: spacing.md }}>
                      <View style={styles.evalHistoryRow}>
                        {stakeGoal.evaluations.slice(-10).map((ev, i) => (
                          <View
                            key={ev.id ?? i}
                            style={[
                              styles.evalDot,
                              {
                                backgroundColor: ev.passed
                                  ? colors.accent.success
                                  : colors.accent.danger,
                                borderRadius: 4,
                              },
                            ]}
                          />
                        ))}
                      </View>
                    </View>
                  )}

                  <View style={[styles.savedLostRow, { marginTop: spacing.md }]}>
                    <Text style={[typography.captionBold, { color: colors.accent.success }]}>
                      Saved: {formatCurrency(stakeGoal.total_saved ?? 0)}
                    </Text>
                    <Text style={[typography.captionBold, { color: colors.accent.danger }]}>
                      Lost: {formatCurrency(stakeGoal.total_lost ?? 0)}
                    </Text>
                  </View>
                </Card>
              </Animated.View>
            );
          })}

        {stakeGoals.filter((sg) => sg.is_active).length === 0 && (
          <Card>
            <Text
              style={[typography.body, { color: colors.text.secondary, textAlign: 'center' }]}
            >
              No active stakes. Put money on the line to stay accountable!
            </Text>
          </Card>
        )}

        {/* Create Stake Button */}
        <Button
          title="Create New Stake"
          onPress={() => setShowCreateModal(true)}
          fullWidth
          style={{ marginTop: spacing.xl }}
        />

        {/* Stripe Integration Note */}
        <Card style={{ marginTop: spacing.lg, borderWidth: 1, borderColor: colors.border.default }}>
          <Text style={[typography.caption, { color: colors.text.muted, textAlign: 'center' }]}>
            Payment processing powered by Stripe. Funds are held securely and released based on evaluation results.
          </Text>
        </Card>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Create Stake Modal */}
      <Modal
        visible={showCreateModal}
        onDismiss={() => setShowCreateModal(false)}
        title="Create Stake Goal"
      >
        <Input
          label="Goal"
          value={newGoalTitle}
          onChangeText={setNewGoalTitle}
          placeholder="What are you committing to?"
        />
        <Input
          label="Stake Amount ($)"
          value={stakeAmount}
          onChangeText={setStakeAmount}
          placeholder="50"
          keyboardType="decimal-pad"
          containerStyle={{ marginTop: spacing.md }}
        />
        <Input
          label="Charity (optional)"
          value={charityName}
          onChangeText={setCharityName}
          placeholder="Where failed stakes go"
          containerStyle={{ marginTop: spacing.md }}
        />

        <Text
          style={[
            typography.captionBold,
            { color: colors.text.secondary, marginTop: spacing.lg, marginBottom: spacing.sm },
          ]}
        >
          Evaluation Frequency
        </Text>
        <View style={styles.freqRow}>
          {(['daily', 'weekly', 'monthly'] as const).map((freq) => (
            <Chip
              key={freq}
              label={freq.charAt(0).toUpperCase() + freq.slice(1)}
              selected={evaluationFreq === freq}
              onPress={() => setEvaluationFreq(freq)}
            />
          ))}
        </View>

        <Button
          title="Create Stake"
          onPress={handleCreateStake}
          fullWidth
          disabled={!newGoalTitle.trim() || !stakeAmount.trim()}
          style={{ marginTop: spacing.xl }}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingBottom: 24 },
  summaryRow: { flexDirection: 'row' },
  stakeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  evalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  evalHistoryRow: { flexDirection: 'row', gap: 4 },
  evalDot: { width: 8, height: 8 },
  savedLostRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  freqRow: { flexDirection: 'row', gap: 8 },
});
