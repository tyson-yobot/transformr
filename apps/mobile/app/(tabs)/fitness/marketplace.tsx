// =============================================================================
// TRANSFORMR — Program Marketplace Screen
//
// Lists purchasable programs from the `programs` table.
// Locks purchased programs behind Stripe checkout via commerce service.
// =============================================================================

import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';
import { supabase } from '@services/supabase';
import {
  getAvailablePrograms,
  getUserPurchases,
  purchaseProgram,
  type Program,
} from '@services/commerce';
import { hapticLight, hapticSuccess } from '@utils/haptics';
import { ScreenBackground } from '@components/ui/ScreenBackground';
import { AmbientBackground } from '@components/ui/AmbientBackground';
import { useStripe } from '@stripe/stripe-react-native';

// eslint-disable-next-line expo/no-dynamic-env-var
const stripeKey = process.env['EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY'] ?? '';
const isStripeConfigured =
  Boolean(stripeKey) &&
  !stripeKey.includes('your-') &&
  !stripeKey.includes('xxxxx') &&
  stripeKey.startsWith('pk_');

const DIFFICULTY_COLOR: Record<string, string> = {
  beginner:     '#10B981',
  intermediate: '#f59e0b',
  advanced:     '#ef4444',
};

export default function MarketplaceScreen() {
  const { colors, typography, spacing, borderRadius, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const [programs, setPrograms] = useState<Program[]>([]);
  const [purchasedIds, setPurchasedIds] = useState<Set<string>>(new Set());
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); setRefreshing(false); return; }
    setUserId(user.id);

    const [progs, purchased] = await Promise.all([
      getAvailablePrograms(),
      getUserPurchases(user.id),
    ]);

    setPrograms(progs);
    setPurchasedIds(new Set(purchased));
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    void loadData();
  }, [loadData]);

  const handleBuy = useCallback(async (program: Program) => {
    if (!userId) return;
    hapticLight();

    if (!isStripeConfigured) {
      Alert.alert('Payment Not Available', 'Payment processing is not configured yet. Please check back later.');
      return;
    }

    Alert.alert(
      `Purchase ${program.name}`,
      `One-time purchase for $${(program.price_cents / 100).toFixed(2)}. Payment will be processed via Stripe.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Buy Now',
          onPress: async () => {
            setPurchasing(program.id);
            try {
              // Create a PaymentIntent on the server and initialise the Payment Sheet
              const intentResult = await supabase.functions.invoke('stripe-webhook', {
                body: {
                  action: 'create_program_payment_intent',
                  userId,
                  programId: program.id,
                  stripePriceId: program.stripe_price_id,
                },
              });

              if (intentResult.error || !(intentResult.data as { clientSecret?: string })?.clientSecret) {
                setPurchasing(null);
                Alert.alert('Purchase Failed', (intentResult.error?.message) ?? 'Could not start payment. Please try again.');
                return;
              }

              const { clientSecret, customerId, ephemeralKey } = intentResult.data as {
                clientSecret: string;
                customerId?: string;
                ephemeralKey?: string;
              };

              const { error: sheetError } = await initPaymentSheet({
                paymentIntentClientSecret: clientSecret,
                merchantDisplayName: 'TRANSFORMR',
                ...(customerId ? { customerId } : {}),
                ...(ephemeralKey ? { customerEphemeralKeySecret: ephemeralKey } : {}),
              });

              if (sheetError) {
                setPurchasing(null);
                Alert.alert('Purchase Failed', sheetError.message);
                return;
              }

              const { error: presentError } = await presentPaymentSheet();

              if (presentError) {
                setPurchasing(null);
                if (presentError.code !== 'Canceled') {
                  Alert.alert('Purchase Failed', presentError.message);
                }
                return;
              }

              // Payment succeeded — record the purchase
              const result = await purchaseProgram(userId, program.id, program.stripe_price_id, clientSecret);
              setPurchasing(null);

              if (result.success) {
                hapticSuccess();
                setPurchasedIds((prev) => new Set([...prev, program.id]));
                Alert.alert('Purchase Complete', `${program.name} is now unlocked!`);
              } else {
                Alert.alert('Purchase Failed', result.error ?? 'Something went wrong. Please try again.');
              }
            } catch {
              setPurchasing(null);
              Alert.alert('Purchase Failed', 'An unexpected error occurred. Please try again.');
            }
          },
        },
      ],
    );
  }, [userId, initPaymentSheet, presentPaymentSheet]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <ScreenBackground />
      <AmbientBackground />
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.background.primary} />

      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + spacing.md,
            paddingHorizontal: spacing.lg,
            paddingBottom: spacing.md,
            borderBottomColor: colors.border.default,
          },
        ]}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go back"
          accessibilityRole="button"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={[typography.h2, { color: colors.text.primary, flex: 1, marginLeft: spacing.sm }]}>
          Program Marketplace
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 90 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading && (
          <ActivityIndicator color={colors.accent.primary} style={{ marginTop: 40 }} />
        )}

        {!loading && programs.length === 0 && (
          <Card style={{ padding: spacing.lg, alignItems: 'center', marginTop: 40 }}>
            <Ionicons name="storefront-outline" size={40} color={colors.text.muted} />
            <Text style={[typography.body, { color: colors.text.muted, marginTop: spacing.md, textAlign: 'center' }]}>
              No programs available yet. Check back soon.
            </Text>
          </Card>
        )}

        {programs.map((program, i) => {
          const owned = purchasedIds.has(program.id);
          const isBuying = purchasing === program.id;

          return (
            <Animated.View
              key={program.id}
              entering={FadeInDown.delay(i * 60).duration(400)}
              style={{ marginBottom: spacing.md }}
            >
              <Card
                variant="elevated"
                style={{
                  padding: spacing.lg,
                  borderLeftWidth: 3,
                  borderLeftColor: owned ? colors.accent.success : colors.accent.primary,
                }}
              >
                {/* Title row */}
                <View style={[styles.titleRow, { marginBottom: spacing.xs }]}>
                  <Text style={[typography.h3, { color: colors.text.primary, flex: 1 }]}>
                    {program.name}
                  </Text>
                  {owned && (
                    <Badge label="Owned" variant="success" size="sm" />
                  )}
                </View>

                <Text
                  style={[typography.caption, { color: colors.text.secondary, marginBottom: spacing.sm }]}
                  numberOfLines={2}
                >
                  {program.description}
                </Text>

                {/* Meta row */}
                <View style={[styles.metaRow, { marginBottom: spacing.md, gap: spacing.sm }]}>
                  <View style={styles.metaChip}>
                    <Ionicons name="time-outline" size={13} color={colors.text.muted} />
                    <Text style={[typography.tiny, { color: colors.text.muted, marginLeft: 3 }]}>
                      {program.duration_weeks}w
                    </Text>
                  </View>
                  <View style={styles.metaChip}>
                    <Ionicons name="barbell-outline" size={13} color={colors.text.muted} />
                    <Text
                      style={[
                        typography.tiny,
                        { color: DIFFICULTY_COLOR[program.difficulty] ?? colors.text.muted, marginLeft: 3 },
                      ]}
                    >
                      {program.difficulty}
                    </Text>
                  </View>
                  <View style={styles.metaChip}>
                    <Ionicons name="pricetag-outline" size={13} color={colors.text.muted} />
                    <Text style={[typography.tiny, { color: colors.text.muted, marginLeft: 3 }]}>
                      {program.category}
                    </Text>
                  </View>
                </View>

                {/* CTA */}
                {owned ? (
                  <View
                    style={[
                      styles.ownedBadge,
                      {
                        backgroundColor: `${colors.accent.success}20`,
                        borderRadius: borderRadius.sm,
                        padding: spacing.sm,
                      },
                    ]}
                  >
                    <Ionicons name="checkmark-circle" size={16} color={colors.accent.success} />
                    <Text style={[typography.captionBold, { color: colors.accent.success, marginLeft: spacing.xs }]}>
                      Unlocked
                    </Text>
                  </View>
                ) : (
                  <Pressable
                    onPress={() => handleBuy(program)}
                    disabled={isBuying}
                    style={[
                      styles.buyBtn,
                      {
                        backgroundColor: isBuying ? colors.accent.primaryDark : colors.accent.primary,
                        borderRadius: borderRadius.md,
                        paddingVertical: spacing.sm,
                      },
                    ]}
                    accessibilityLabel={`Buy ${program.name} for $${(program.price_cents / 100).toFixed(2)}`}
                    accessibilityRole="button"
                  >
                    {isBuying ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={[typography.captionBold, { color: '#FFFFFF' }]}>
                        Buy — ${(program.price_cents / 100).toFixed(2)}
                      </Text>
                    )}
                  </Pressable>
                )}
              </Card>
            </Animated.View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:     { flex: 1 },
  header:     { flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth },
  titleRow:   { flexDirection: 'row', alignItems: 'center' },
  metaRow:    { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  metaChip:   { flexDirection: 'row', alignItems: 'center' },
  ownedBadge: { flexDirection: 'row', alignItems: 'center' },
  buyBtn:     { alignItems: 'center' },
});
