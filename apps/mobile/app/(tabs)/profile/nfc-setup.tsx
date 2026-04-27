// =============================================================================
// TRANSFORMR -- NFC Trigger Setup Screen
// =============================================================================

import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useFeatureGate } from '@hooks/useFeatureGate';
import { FeatureLockOverlay } from '@components/ui/FeatureLockOverlay';
import { useTheme } from '@theme/index';
import { StatusBar } from 'expo-status-bar';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Badge } from '@components/ui/Badge';
import { initNfc, readNfcTag } from '@services/nfc';
import { Modal } from '@components/ui/Modal';
import { supabase } from '@services/supabase';
import { hapticLight, hapticMedium, hapticSuccess } from '@utils/haptics';
import type { NfcTrigger } from '@app-types/database';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { ScreenHelpButton } from '@components/ui/ScreenHelpButton';
import { SCREEN_HELP } from '../../../constants/screenHelp';
import { ScreenBackground } from '@components/ui/ScreenBackground';
import { AmbientBackground } from '@components/ui/AmbientBackground';
import { EmptyStateBackground } from '@components/ui/EmptyStateBackground';

// ---------------------------------------------------------------------------
// Available NFC actions
// ---------------------------------------------------------------------------
interface NfcAction {
  value: string;
  label: string;
  icon: string;
}

const NFC_ACTIONS: NfcAction[] = [
  { value: 'start_workout', label: 'Start Workout', icon: '🏋️' },
  { value: 'open_meal_log', label: 'Open Meal Log', icon: '🍽️' },
  { value: 'log_water', label: 'Log Water', icon: '💧' },
  { value: 'start_focus', label: 'Start Focus Session', icon: '🎯' },
  { value: 'check_in', label: 'Daily Check-In', icon: '📋' },
  { value: 'start_sleep', label: 'Start Sleep Tracking', icon: '😴' },
  { value: 'log_supplement', label: 'Log Supplement', icon: '💊' },
  { value: 'open_journal', label: 'Open Journal', icon: '📖' },
];

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------
export default function NfcSetupScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const navigation = useNavigation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const gate = useFeatureGate('nfc_triggers');

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => <ScreenHelpButton content={SCREEN_HELP.nfcSetupScreen} />,
    });
  }, [navigation]);

  const [triggers, setTriggers] = useState<NfcTrigger[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('start_workout');
  const [pendingTagId, setPendingTagId] = useState<string | null>(null);

  // Fetch triggers
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('nfc_triggers')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data) setTriggers(data as NfcTrigger[]);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to load NFC triggers.';
        setLoadError(msg);
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, []);

  const handleScanTag = useCallback(async () => {
    setIsScanning(true);
    await hapticMedium();

    try {
      const nfcSupported = await initNfc();
      if (!nfcSupported) {
        // Device doesn't support NFC — generate a manual ID for testing
        const fallbackId = `MANUAL-${Date.now().toString(36).toUpperCase()}`;
        setPendingTagId(fallbackId);
        setIsScanning(false);
        setShowAddModal(true);
        await hapticSuccess();
        return;
      }

      const tagId = await readNfcTag();
      if (tagId) {
        setPendingTagId(tagId);
        setIsScanning(false);
        setShowAddModal(true);
        await hapticSuccess();
      } else {
        Alert.alert('No Tag Detected', 'Hold your NFC tag closer and try again.');
        setIsScanning(false);
      }
    } catch {
      Alert.alert('NFC Error', 'Could not read NFC tag. Please try again.');
      setIsScanning(false);
    }
  }, []);

  // Save trigger
  const handleSaveTrigger = useCallback(async () => {
    if (!pendingTagId || !newLabel.trim()) {
      Alert.alert('Error', 'Please enter a label for this trigger.');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('nfc_triggers')
        .insert({
          user_id: user.id,
          tag_id: pendingTagId,
          label: newLabel.trim(),
          action: selectedAction,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setTriggers((prev) => [data as NfcTrigger, ...prev]);
      }

      await hapticSuccess();
      setShowAddModal(false);
      setNewLabel('');
      setPendingTagId(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save trigger';
      Alert.alert('Error', msg);
    }
  }, [pendingTagId, newLabel, selectedAction]);

  // Delete trigger
  const handleDeleteTrigger = useCallback(
    (triggerId: string) => {
      Alert.alert('Delete Trigger', 'Remove this NFC trigger?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await supabase.from('nfc_triggers').delete().eq('id', triggerId);
            setTriggers((prev) => prev.filter((t) => t.id !== triggerId));
            void hapticLight();
          },
        },
      ]);
    },
    [],
  );

  // Test trigger
  const handleTestTrigger = useCallback(
    async (trigger: NfcTrigger) => {
      await hapticSuccess();
      const action = NFC_ACTIONS.find((a) => a.value === trigger.action);
      Alert.alert(
        'Trigger Fired',
        `"${trigger.label}" would execute: ${action?.label ?? trigger.action}`,
      );
    },
    [],
  );

  const getActionInfo = (action: string): NfcAction => {
    return NFC_ACTIONS.find((a) => a.value === action) ?? {
      value: action,
      label: action,
      icon: '📱',
    };
  };

  if (!gate.isAvailable) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background.primary }}>
        <FeatureLockOverlay
          featureKey="nfc_triggers"
          title="NFC Triggers"
          description="Tap NFC tags to automatically start workouts, log meals, or trigger routines."
          onGoBack={() => router.back()}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <ScreenBackground />
      <AmbientBackground />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.lg,
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Scan Button */}
        <Animated.View entering={FadeInDown.duration(400)}>
          <Card variant="elevated" style={{ marginBottom: spacing.xl }}>
            <View style={styles.scanSection}>
              <Text style={{ fontSize: 48, marginBottom: spacing.md }}>
                📱
              </Text>
              <Text
                style={[
                  typography.h3,
                  {
                    color: colors.text.primary,
                    textAlign: 'center',
                    marginBottom: spacing.sm,
                  },
                ]}
              >
                {isScanning ? 'Scanning...' : 'NFC Triggers'}
              </Text>
              <Text
                style={[
                  typography.body,
                  {
                    color: colors.text.secondary,
                    textAlign: 'center',
                    marginBottom: spacing.lg,
                  },
                ]}
              >
                {isScanning
                  ? 'Hold your phone near an NFC tag'
                  : 'Tap NFC tags to trigger actions instantly'}
              </Text>
              <Button
                title={isScanning ? 'Scanning...' : 'Scan New Tag'}
                variant="primary"
                onPress={handleScanTag}
                loading={isScanning}
                disabled={isScanning}
              />
            </View>
          </Card>
        </Animated.View>

        {/* Configured Triggers */}
        <Text
          style={[
            typography.h3,
            { color: colors.text.primary, marginBottom: spacing.md },
          ]}
        >
          Configured Triggers ({triggers.length})
        </Text>

        {loadError && (
          <Card style={{ marginBottom: spacing.md, backgroundColor: `${colors.accent.danger}15` }}>
            <Text style={[typography.caption, { color: colors.accent.danger }]}>
              {loadError}
            </Text>
          </Card>
        )}

        {triggers.length === 0 && !isLoading && !loadError && (
          <View style={[styles.emptyState, { position: 'relative', overflow: 'hidden', borderRadius: 16 }]}>
            <EmptyStateBackground query="smart home technology dark" opacity={0.15} />
            <Text
              style={[
                typography.body,
                { color: colors.text.secondary, textAlign: 'center' },
              ]}
            >
              No NFC triggers configured yet. Scan a tag to get started.
            </Text>
          </View>
        )}

        {triggers.map((trigger, index) => {
          const actionInfo = getActionInfo(trigger.action);
          return (
            <Animated.View
              key={trigger.id}
              entering={FadeInDown.delay(index * 50).duration(400)}
            >
              <Card
                variant="default"
                style={{ marginBottom: spacing.sm }}
              >
                <View style={styles.triggerRow}>
                  <Text style={{ fontSize: 24, marginRight: spacing.md }}>
                    {actionInfo.icon}
                  </Text>
                  <View style={{ flex: 1 }}>
      <StatusBar style="light" backgroundColor="#0C0A15" />
                    <Text
                      style={[
                        typography.bodyBold,
                        { color: colors.text.primary },
                      ]}
                    >
                      {trigger.label}
                    </Text>
                    <Text
                      style={[
                        typography.caption,
                        { color: colors.text.secondary },
                      ]}
                    >
                      {actionInfo.label} -- Tag: {trigger.tag_id}
                    </Text>
                  </View>
                  <Badge
                    label={trigger.is_active ? 'Active' : 'Off'}
                    variant={trigger.is_active ? 'success' : 'default'}
                    size="sm"
                  />
                </View>
                <View
                  style={[styles.triggerActions, { marginTop: spacing.md }]}
                >
                  <Button
                    title="Test"
                    variant="secondary"
                    size="sm"
                    onPress={() => handleTestTrigger(trigger)}
                  />
                  <Button
                    title="Delete"
                    variant="ghost"
                    size="sm"
                    onPress={() => handleDeleteTrigger(trigger.id)}
                    textStyle={{ color: colors.accent.danger }}
                  />
                </View>
              </Card>
            </Animated.View>
          );
        })}
      </ScrollView>

      {/* Add Trigger Modal */}
      <Modal
        visible={showAddModal}
        onDismiss={() => setShowAddModal(false)}
        title="Configure Trigger"
      >
        <Text
          style={[
            typography.caption,
            { color: colors.text.secondary, marginBottom: spacing.md },
          ]}
        >
          Tag ID: {pendingTagId}
        </Text>

        <Input
          label="Label"
          placeholder="e.g. Gym entrance, Bedside table"
          value={newLabel}
          onChangeText={setNewLabel}
          containerStyle={{ marginBottom: spacing.lg }}
        />

        <Text
          style={[
            typography.captionBold,
            {
              color: colors.text.secondary,
              marginBottom: spacing.sm,
            },
          ]}
        >
          ACTION
        </Text>

        <View style={styles.actionGrid}>
          {NFC_ACTIONS.map((action) => {
            const isSelected = selectedAction === action.value;
            return (
              <Pressable
                key={action.value}
                onPress={() => {
                  void hapticLight();
                  setSelectedAction(action.value);
                }}
                style={[
                  styles.actionOption,
                  {
                    backgroundColor: isSelected
                      ? `${colors.accent.primary}20`
                      : colors.background.tertiary,
                    borderRadius: borderRadius.md,
                    padding: spacing.md,
                    borderWidth: isSelected ? 1.5 : 0,
                    borderColor: colors.accent.primary,
                  },
                ]}
              >
                <Text style={{ fontSize: 20 }}>{action.icon}</Text>
                <Text
                  style={[
                    typography.tiny,
                    {
                      color: isSelected
                        ? colors.accent.primary
                        : colors.text.secondary,
                      marginTop: spacing.xs,
                      textAlign: 'center',
                    },
                  ]}
                  numberOfLines={2}
                >
                  {action.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Button
          title="Save Trigger"
          variant="primary"
          fullWidth
          onPress={handleSaveTrigger}
          disabled={!newLabel.trim()}
          style={{ marginTop: spacing.xl }}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scanSection: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  triggerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  triggerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionOption: {
    width: '30%',
    flexGrow: 1,
    alignItems: 'center',
  },
  emptyState: {
    paddingVertical: 32,
  },
});
