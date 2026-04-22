// =============================================================================
// TRANSFORMR -- Send Nudge
// =============================================================================

import { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useTheme } from '@theme/index';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Skeleton } from '@components/ui/Skeleton';
import { usePartnerStore } from '@stores/partnerStore';
import { hapticSuccess } from '@utils/haptics';
import type { PartnerNudge } from '@app-types/database';

type NudgeType = NonNullable<PartnerNudge['type']>;

interface PrebuiltNudge {
  type: NudgeType;
  emoji: string;
  message: string;
}

const PREBUILT_NUDGES: PrebuiltNudge[] = [
  { type: 'encouragement', emoji: '\uD83D\uDCAA', message: 'You got this! Time to crush it!' },
  { type: 'encouragement', emoji: '\uD83D\uDD25', message: 'Keep the fire going!' },
  { type: 'reminder', emoji: '\u23F0', message: 'Hey, have you worked out today?' },
  { type: 'reminder', emoji: '\uD83C\uDF4E', message: 'Don\'t forget to log your meals!' },
  { type: 'reminder', emoji: '\uD83D\uDCA4', message: 'Time for bed! Get that sleep in.' },
  { type: 'celebration', emoji: '\uD83C\uDF89', message: 'Amazing progress! So proud of you!' },
  { type: 'celebration', emoji: '\uD83C\uDFC6', message: 'You just hit a new milestone!' },
  { type: 'challenge', emoji: '\u26A1', message: 'I challenge you to beat my workout today!' },
  { type: 'challenge', emoji: '\uD83C\uDFAF', message: 'Let\'s both hit our goals today!' },
  { type: 'encouragement', emoji: '\uD83D\uDE80', message: 'Let\'s go! No excuses today!' },
  { type: 'encouragement', emoji: '\u2764\uFE0F', message: 'Thinking of you, keep going!' },
  { type: 'reminder', emoji: '\uD83D\uDCA7', message: 'Drink some water!' },
];

export default function NudgeScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const insets = useSafeAreaInsets();
  const partnership = usePartnerStore((s) => s.partnership);
  const partnerProfile = usePartnerStore((s) => s.partnerProfile);
  const sendNudge = usePartnerStore((s) => s.sendNudge);
  const isLoading = usePartnerStore((s) => s.isLoading);

  const [customMessage, setCustomMessage] = useState('');
  const [sentMessage, setSentMessage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const handleSendPrebuilt = useCallback(async (nudge: PrebuiltNudge) => {
    if (isSending) return;
    setIsSending(true);
    try {
      await sendNudge(nudge.type, `${nudge.emoji} ${nudge.message}`);
      await hapticSuccess();
      setSentMessage(nudge.message);
      setTimeout(() => setSentMessage(null), 3000);
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to send nudge');
    } finally {
      setIsSending(false);
    }
  }, [sendNudge, isSending]);

  const handleSendCustom = useCallback(async () => {
    if (!customMessage.trim() || isSending) return;
    setIsSending(true);
    try {
      await sendNudge('encouragement', customMessage.trim());
      await hapticSuccess();
      setSentMessage(customMessage.trim());
      setCustomMessage('');
      setTimeout(() => setSentMessage(null), 3000);
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to send nudge');
    } finally {
      setIsSending(false);
    }
  }, [customMessage, sendNudge, isSending]);

  if (isLoading) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background.primary, padding: spacing.lg }]}>
        <StatusBar style="light" backgroundColor="#0C0A15" />
        <Skeleton variant="card" height={80} style={{ marginBottom: spacing.md }} />
        <Skeleton variant="card" height={200} style={{ marginBottom: spacing.md }} />
        <Skeleton variant="card" height={120} />
      </View>
    );
  }

  if (!partnership || !partnerProfile) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background.primary, justifyContent: 'center', alignItems: 'center', padding: spacing.xl }]}>
      <StatusBar style="light" backgroundColor="#0C0A15" />
        <Text style={[typography.h2, { color: colors.text.primary, textAlign: 'center' }]}>No Partner Linked</Text>
        <Text style={[typography.body, { color: colors.text.secondary, textAlign: 'center', marginTop: spacing.md }]}>
          Link with a partner to send nudges.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { padding: spacing.lg, paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(100)}>
          <Text style={[typography.h3, { color: colors.text.primary, textAlign: 'center' }]}>
            Nudge {partnerProfile.display_name}
          </Text>
          <Text style={[typography.caption, { color: colors.text.secondary, textAlign: 'center', marginTop: spacing.xs }]}>
            Send a quick message to keep each other motivated
          </Text>
        </Animated.View>

        {/* Success Banner */}
        {sentMessage && (
          <Animated.View entering={FadeIn}>
            <Card style={{ marginTop: spacing.lg, backgroundColor: colors.accent.successDim }}>
              <Text style={[typography.bodyBold, { color: colors.accent.success, textAlign: 'center' }]}>
                Nudge sent!
              </Text>
              <Text style={[typography.caption, { color: colors.text.secondary, textAlign: 'center', marginTop: spacing.xs }]}>
                {sentMessage}
              </Text>
            </Card>
          </Animated.View>
        )}

        {/* Prebuilt Nudges */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <Text style={[typography.captionBold, { color: colors.text.secondary, marginTop: spacing.xl, marginBottom: spacing.md }]}>
            Quick Nudges
          </Text>
          <View style={styles.nudgeGrid}>
            {PREBUILT_NUDGES.map((nudge, index) => (
              <Animated.View key={`${nudge.type}-${index}`} entering={FadeInDown.delay(250 + index * 30)}>
                <Pressable
                  onPress={() => handleSendPrebuilt(nudge)}
                  disabled={isSending}
                  style={[styles.nudgeCard, {
                    backgroundColor: colors.background.secondary,
                    borderRadius: borderRadius.md,
                    padding: spacing.md,
                    opacity: isSending ? 0.6 : 1,
                  }]}
                >
                  <Text style={{ fontSize: 28, textAlign: 'center' }}>{nudge.emoji}</Text>
                  <Text
                    style={[typography.caption, { color: colors.text.primary, textAlign: 'center', marginTop: spacing.xs }]}
                    numberOfLines={2}
                  >
                    {nudge.message}
                  </Text>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Custom Message */}
        <Animated.View entering={FadeInDown.delay(400)}>
          <Text style={[typography.captionBold, { color: colors.text.secondary, marginTop: spacing.xl, marginBottom: spacing.md }]}>
            Custom Message
          </Text>
          <Card>
            <Input
              label=""
              value={customMessage}
              onChangeText={setCustomMessage}
              placeholder="Type your own nudge message..."
              multiline
            />
            <Button
              title="Send Custom Nudge"
              onPress={handleSendCustom}
              fullWidth
              loading={isSending}
              disabled={!customMessage.trim() || isSending}
              style={{ marginTop: spacing.md }}
            />
          </Card>
        </Animated.View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingBottom: 24 },
  nudgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  nudgeCard: {
    width: 160,
    minHeight: 80,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.15)',
  },
});
