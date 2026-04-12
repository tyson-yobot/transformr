// =============================================================================
// TRANSFORMR -- Customer Tracker
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
import { Chip } from '@components/ui/Chip';
import { hapticLight, hapticSuccess } from '@utils/haptics';
import { formatCurrency, formatNumber } from '@utils/formatters';
import type { Customer } from '@app-types/database';

type CustomerStatus = NonNullable<Customer['status']>;

const STATUS_OPTIONS: { key: CustomerStatus; label: string }[] = [
  { key: 'trial', label: 'Trial' },
  { key: 'active', label: 'Active' },
  { key: 'paused', label: 'Paused' },
  { key: 'churned', label: 'Churned' },
];

export default function CustomersScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filterStatus, setFilterStatus] = useState<CustomerStatus | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPlan, setNewPlan] = useState('');
  const [newMrr, setNewMrr] = useState('');

  const filteredCustomers = useMemo(
    () =>
      filterStatus
        ? customers.filter((c) => c.status === filterStatus)
        : customers,
    [customers, filterStatus],
  );

  const totalMrr = useMemo(
    () =>
      customers
        .filter((c) => c.status === 'active')
        .reduce((sum, c) => sum + (c.mrr ?? 0), 0),
    [customers],
  );

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of customers) {
      const status = c.status ?? 'active';
      counts[status] = (counts[status] ?? 0) + 1;
    }
    return counts;
  }, [customers]);

  const churnRate = useMemo(() => {
    if (customers.length === 0) return 0;
    const churned = customers.filter((c) => c.status === 'churned').length;
    return (churned / customers.length) * 100;
  }, [customers]);

  const handleAddCustomer = useCallback(() => {
    if (!newName.trim()) return;
    const customer: Customer = {
      id: Date.now().toString(),
      name: newName.trim(),
      email: newEmail.trim() || undefined,
      plan_tier: newPlan.trim() || undefined,
      mrr: newMrr ? parseFloat(newMrr) : undefined,
      status: 'active',
      started_at: new Date().toISOString(),
    };
    setCustomers((prev) => [...prev, customer]);
    setShowAddModal(false);
    setNewName('');
    setNewEmail('');
    setNewPlan('');
    setNewMrr('');
    hapticSuccess();
  }, [newName, newEmail, newPlan, newMrr]);

  const getStatusVariant = (status: CustomerStatus): 'success' | 'warning' | 'danger' | 'info' | 'default' => {
    switch (status) {
      case 'active': return 'success';
      case 'trial': return 'info';
      case 'paused': return 'warning';
      case 'churned': return 'danger';
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { padding: spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary */}
        <Animated.View entering={FadeInDown.delay(100)}>
          <View style={[styles.statsRow, { gap: spacing.md }]}>
            <Card style={{ flex: 1 }}>
              <Text style={[typography.captionBold, { color: colors.text.secondary }]}>
                Total MRR
              </Text>
              <Text style={[typography.statSmall, { color: colors.accent.success }]}>
                {formatCurrency(totalMrr)}
              </Text>
            </Card>
            <Card style={{ flex: 1 }}>
              <Text style={[typography.captionBold, { color: colors.text.secondary }]}>
                Customers
              </Text>
              <Text style={[typography.statSmall, { color: colors.text.primary }]}>
                {formatNumber(customers.length)}
              </Text>
            </Card>
            <Card style={{ flex: 1 }}>
              <Text style={[typography.captionBold, { color: colors.text.secondary }]}>
                Churn
              </Text>
              <Text
                style={[
                  typography.statSmall,
                  { color: churnRate > 5 ? colors.accent.danger : colors.text.primary },
                ]}
              >
                <Text style={typography.monoBody}>{churnRate.toFixed(1)}%</Text>
              </Text>
            </Card>
          </View>
        </Animated.View>

        {/* Filter */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              gap: spacing.sm,
              marginTop: spacing.lg,
              marginBottom: spacing.md,
            }}
          >
            <Chip
              label={`All (${customers.length})`}
              selected={filterStatus === null}
              onPress={() => setFilterStatus(null)}
            />
            {STATUS_OPTIONS.map((s) => (
              <Chip
                key={s.key}
                label={`${s.label} (${statusCounts[s.key] ?? 0})`}
                selected={filterStatus === s.key}
                onPress={() =>
                  setFilterStatus(filterStatus === s.key ? null : s.key)
                }
              />
            ))}
          </ScrollView>
        </Animated.View>

        {/* Customer List */}
        {filteredCustomers.map((customer, index) => (
          <Animated.View key={customer.id} entering={FadeInDown.delay(300 + index * 30)}>
            <Card style={{ marginBottom: spacing.sm }}>
              <View style={styles.customerRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.bodyBold, { color: colors.text.primary }]}>
                    {customer.name}
                  </Text>
                  {customer.email && (
                    <Text style={[typography.caption, { color: colors.text.secondary }]}>
                      {customer.email}
                    </Text>
                  )}
                  {customer.plan_tier && (
                    <Text style={[typography.tiny, { color: colors.text.muted }]}>
                      Plan: {customer.plan_tier}
                    </Text>
                  )}
                </View>
                <View style={styles.customerRight}>
                  <Badge
                    label={customer.status ?? 'active'}
                    variant={getStatusVariant(customer.status ?? 'active')}
                    size="sm"
                  />
                  {customer.mrr != null && (
                    <Text
                      style={[
                        typography.monoBody,
                        { color: colors.accent.success, marginTop: spacing.xs },
                      ]}
                    >
                      {formatCurrency(customer.mrr)}/mo
                    </Text>
                  )}
                </View>
              </View>
            </Card>
          </Animated.View>
        ))}

        {filteredCustomers.length === 0 && (
          <Card>
            <Text style={[typography.body, { color: colors.text.secondary, textAlign: 'center' }]}>
              No customers yet. Add your first customer!
            </Text>
          </Card>
        )}

        {/* Add Customer */}
        <Button
          title="Add Customer"
          onPress={() => { hapticLight(); setShowAddModal(true); }}
          accessibilityLabel="Add new customer"
          fullWidth
          style={{ marginTop: spacing.xl }}
        />

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Add Customer Modal */}
      <Modal
        visible={showAddModal}
        onDismiss={() => setShowAddModal(false)}
        title="Add Customer"
      >
        <Input label="Name" value={newName} onChangeText={setNewName} placeholder="Customer name" />
        <Input label="Email" value={newEmail} onChangeText={setNewEmail} placeholder="email@example.com" keyboardType="email-address" containerStyle={{ marginTop: spacing.md }} />
        <Input label="Plan Tier" value={newPlan} onChangeText={setNewPlan} placeholder="Pro, Enterprise..." containerStyle={{ marginTop: spacing.md }} />
        <Input label="MRR ($)" value={newMrr} onChangeText={setNewMrr} placeholder="99" keyboardType="decimal-pad" containerStyle={{ marginTop: spacing.md }} />
        <Button title="Add Customer" onPress={handleAddCustomer} fullWidth disabled={!newName.trim()} style={{ marginTop: spacing.xl }} />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingBottom: 24 },
  statsRow: { flexDirection: 'row' },
  customerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  customerRight: { alignItems: 'flex-end' },
});
