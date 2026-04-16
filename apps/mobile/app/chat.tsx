// =============================================================================
// TRANSFORMR -- AI Chat Coach Screen
// Full-screen conversational chat with the TRANSFORMR AI Coach.
// Supports topic selection, history access, compliance disclaimers, and
// optimistic rendering of user messages while the coach replies.
// =============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ListRenderItem,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useTheme } from '@theme/index';
import { Chip } from '@components/ui/Chip';
import { Disclaimer } from '@components/ui/Disclaimer';
import { GatePromptCard } from '@components/ui/GatePromptCard';
import { useChatStore } from '@stores/chatStore';
import { useFeatureGate } from '@hooks/useFeatureGate';
import type { ChatMessage, ChatTopic } from '@app-types/ai';
import { hapticLight, hapticMedium } from '@utils/haptics';
import { HelpBubble } from '@components/ui/HelpBubble';

const TOPICS: { id: ChatTopic; label: string; icon: string }[] = [
  { id: 'general', label: 'General', icon: 'chatbubble-ellipses-outline' },
  { id: 'training', label: 'Training', icon: 'barbell-outline' },
  { id: 'nutrition', label: 'Nutrition', icon: 'restaurant-outline' },
  { id: 'supplements', label: 'Supplements', icon: 'medkit-outline' },
  { id: 'sleep', label: 'Sleep', icon: 'moon-outline' },
  { id: 'mindset', label: 'Mindset', icon: 'sparkles-outline' },
  { id: 'business', label: 'Business', icon: 'trending-up-outline' },
  { id: 'goals', label: 'Goals', icon: 'flag-outline' },
];

const SUGGESTED_STARTERS: Record<ChatTopic, string[]> = {
  general: [
    'How am I doing this week?',
    'What should I focus on today?',
    'Where am I falling behind?',
  ],
  training: [
    'Is my current volume sustainable?',
    'Should I deload this week?',
    'How is my progressive overload tracking?',
  ],
  nutrition: [
    'Am I hitting my protein target?',
    'What is one thing I should change about my diet?',
    'How do my macros look this week?',
  ],
  supplements: [
    'Review my supplement stack',
    'Can I afford a budget-friendly swap?',
    'What should I take around my workouts?',
  ],
  sleep: [
    'Why has my sleep been inconsistent?',
    'Build a wind-down routine for me',
    'How is my sleep debt?',
  ],
  mindset: [
    'I feel burned out — what should I do?',
    'Help me reframe today',
    'What does my mood data say?',
  ],
  business: [
    'What is my revenue trend?',
    'Link my training days to my best business days',
    'What was my most productive week?',
  ],
  goals: [
    'Am I on pace for my countdown?',
    'Which goal is at risk?',
    'Where should I push harder?',
  ],
  labs: [
    'Explain my most recent lab snapshot',
    'What trends should I watch?',
    'Which markers should I ask my provider about?',
  ],
  recovery: [
    'How is my readiness trending?',
    'What should I do today to recover?',
    'Am I overtraining?',
  ],
};

export default function ChatScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ conversation_id?: string; topic?: ChatTopic }>();

  const [input, setInput] = useState('');
  const [topic, setTopic] = useState<ChatTopic>(params.topic ?? 'general');
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef<FlatList<ChatMessage>>(null);

  const chatGate = useFeatureGate('ai_chat_coach');

  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const messagesByConversation = useChatStore((s) => s.messagesByConversation);
  const isLoadingMessages = useChatStore((s) => s.isLoadingMessages);
  const isSending = useChatStore((s) => s.isSending);
  const error = useChatStore((s) => s.error);
  const openConversation = useChatStore((s) => s.openConversation);
  const startNewConversation = useChatStore((s) => s.startNewConversation);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const clearError = useChatStore((s) => s.clearError);

  const messages = useMemo<ChatMessage[]>(() => {
    if (activeConversationId && messagesByConversation[activeConversationId]) {
      return messagesByConversation[activeConversationId] ?? [];
    }
    const pendingKeys = Object.keys(messagesByConversation).filter((k) =>
      k.startsWith('pending-'),
    );
    if (pendingKeys.length > 0) {
      const key = pendingKeys[pendingKeys.length - 1] as string;
      return messagesByConversation[key] ?? [];
    }
    return [];
  }, [activeConversationId, messagesByConversation]);

  // Load the conversation passed in via params on mount
  useEffect(() => {
    if (params.conversation_id && params.conversation_id !== activeConversationId) {
      void openConversation(params.conversation_id);
    }
  }, [params.conversation_id, activeConversationId, openConversation]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (messages.length === 0) return;
    const timeout = setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 50);
    return () => clearTimeout(timeout);
  }, [messages.length]);

  const handleRefreshMessages = useCallback(async () => {
    if (!activeConversationId) return;
    setRefreshing(true);
    await openConversation(activeConversationId);
    setRefreshing(false);
  }, [activeConversationId, openConversation]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (trimmed.length === 0 || isSending) return;
    setInput('');
    void hapticMedium();
    chatGate.trackUsage();
    void sendMessage(trimmed, topic);
  }, [chatGate, input, isSending, sendMessage, topic]);

  const handleStarterPress = useCallback(
    (starter: string) => {
      void hapticMedium();
      setInput('');
      chatGate.trackUsage();
      void sendMessage(starter, topic);
    },
    [chatGate, sendMessage, topic],
  );

  const handleNewChat = useCallback(() => {
    void hapticMedium();
    startNewConversation();
    setInput('');
  }, [startNewConversation]);

  const handleHistoryPress = useCallback(() => {
    void hapticLight();
    router.push('/chat-history');
  }, [router]);

  const renderMessage: ListRenderItem<ChatMessage> = useCallback(
    ({ item, index }) => {
      const isUser = item.role === 'user';
      return (
        <Animated.View
          entering={FadeInUp.delay(index * 20).duration(260)}
          style={[
            styles.messageRow,
            { justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: spacing.md },
          ]}
        >
          <View
            style={[
              styles.bubble,
              {
                backgroundColor: isUser
                  ? colors.accent.primary
                  : colors.background.tertiary,
                borderTopRightRadius: isUser ? borderRadius.sm : borderRadius.lg,
                borderTopLeftRadius: isUser ? borderRadius.lg : borderRadius.sm,
                borderBottomRightRadius: borderRadius.lg,
                borderBottomLeftRadius: borderRadius.lg,
                padding: spacing.md,
                maxWidth: '85%',
                borderWidth: isUser ? 0 : 1,
                borderColor: isUser ? 'transparent' : colors.border.subtle,
              },
            ]}
          >
            {!isUser && (
              <View style={styles.assistantHeader}>
                <Ionicons
                  name="sparkles"
                  size={14}
                  color={colors.accent.cyan}
                />
                <Text
                  style={[
                    typography.tiny,
                    {
                      color: colors.accent.cyan,
                      marginLeft: spacing.xs,
                      fontWeight: '600',
                    },
                  ]}
                >
                  TRANSFORMR COACH
                </Text>
              </View>
            )}
            <Text
              style={[
                typography.body,
                {
                  color: isUser ? colors.text.inverse : colors.text.primary,
                  marginTop: isUser ? 0 : spacing.xs,
                },
              ]}
            >
              {item.content}
            </Text>
            {!isUser && item.disclaimer_type && (
              <Disclaimer
                type={item.disclaimer_type}
                compact
                style={{ marginTop: spacing.sm }}
              />
            )}
          </View>
        </Animated.View>
      );
    },
    [
      colors.accent.cyan,
      colors.accent.primary,
      colors.background.tertiary,
      colors.border.subtle,
      colors.text.primary,
      borderRadius.lg,
      borderRadius.sm,
      spacing.md,
      spacing.sm,
      spacing.xs,
      typography.body,
      typography.tiny,
    ],
  );

  const keyExtractor = useCallback((item: ChatMessage) => item.id, []);

  const renderEmptyState = () => (
    <Animated.View
      entering={FadeInDown.duration(400)}
      style={[styles.emptyContainer, { padding: spacing.xl }]}
    >
      <View
        style={[
          styles.emptyIcon,
          {
            backgroundColor: colors.accent.primaryDim,
            borderRadius: borderRadius.full,
          },
        ]}
      >
        <Ionicons
          name="sparkles"
          size={36}
          color={colors.accent.cyan}
        />
      </View>
      <Text
        style={[
          typography.h2,
          {
            color: colors.text.primary,
            marginTop: spacing.lg,
            textAlign: 'center',
          },
        ]}
      >
        How can I help you today?
      </Text>
      <Text
        style={[
          typography.body,
          {
            color: colors.text.secondary,
            marginTop: spacing.sm,
            textAlign: 'center',
          },
        ]}
      >
        Ask me anything about your training, nutrition, sleep, supplements, or goals. I have your data.
      </Text>

      <View
        style={{
          width: '100%',
          marginTop: spacing.xl,
          gap: spacing.sm,
        }}
      >
        {(SUGGESTED_STARTERS[topic] ?? SUGGESTED_STARTERS.general).map((starter) => (
          <Pressable
            key={starter}
            onPress={() => handleStarterPress(starter)}
            style={({ pressed }) => [
              styles.starterCard,
              {
                backgroundColor: colors.background.surface,
                borderColor: colors.border.subtle,
                borderRadius: borderRadius.md,
                paddingVertical: spacing.md,
                paddingHorizontal: spacing.lg,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Ask: ${starter}`}
          >
            <Text style={[typography.body, { color: colors.text.primary, flex: 1 }]}>
              {starter}
            </Text>
            <Ionicons
              name="arrow-forward"
              size={18}
              color={colors.accent.cyan}
            />
          </Pressable>
        ))}
      </View>
    </Animated.View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background.primary }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + spacing.sm,
            paddingHorizontal: spacing.lg,
            paddingBottom: spacing.md,
            borderBottomColor: colors.border.subtle,
            backgroundColor: colors.background.secondary,
          },
        ]}
      >
        <Pressable
          onPress={() => {
            void hapticLight();
            router.back();
          }}
          accessibilityLabel="Back"
          accessibilityRole="button"
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={26} color={colors.text.primary} />
        </Pressable>
        <View style={styles.headerTitle}>
          <Ionicons name="sparkles" size={18} color={colors.accent.cyan} />
          <View>
            <Text
              style={[
                typography.h3,
                { color: colors.text.primary, marginLeft: spacing.xs },
              ]}
            >
              AI Coach
            </Text>
            {chatGate.remainingUses !== null && (
              <Text
                style={[
                  typography.tiny,
                  { color: colors.text.muted, marginLeft: spacing.xs },
                ]}
              >
                {chatGate.remainingUses} messages left today
              </Text>
            )}
          </View>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            onPress={handleHistoryPress}
            accessibilityLabel="History"
            accessibilityRole="button"
            hitSlop={12}
            style={{ marginRight: spacing.md }}
          >
            <Ionicons name="time-outline" size={22} color={colors.text.primary} />
          </Pressable>
          <Pressable
            onPress={handleNewChat}
            accessibilityLabel="New conversation"
            accessibilityRole="button"
            hitSlop={12}
          >
            <Ionicons name="add-circle-outline" size={24} color={colors.accent.cyan} />
          </Pressable>
        </View>
      </View>

      {/* Topic selector */}
      <View style={{ paddingVertical: spacing.sm }}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={TOPICS}
          keyExtractor={(t) => t.id}
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            gap: spacing.sm,
          }}
          renderItem={({ item }) => (
            <Chip
              label={item.label}
              selected={topic === item.id}
              onPress={() => {
                void hapticLight();
                setTopic(item.id);
              }}
              icon={
                <Ionicons
                  name={item.icon as keyof typeof Ionicons.glyphMap}
                  size={14}
                  color={topic === item.id ? '#FFFFFF' : colors.text.secondary}
                />
              }
            />
          )}
        />
      </View>

      {/* Messages */}
      {isLoadingMessages ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.accent.primary} />
        </View>
      ) : messages.length === 0 ? (
        <FlatList
          data={[]}
          renderItem={null}
          keyExtractor={() => 'empty'}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        />
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={keyExtractor}
          removeClippedSubviews={true}
          windowSize={8}
          maxToRenderPerBatch={10}
          initialNumToRender={15}
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            flexGrow: 1,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshing={refreshing}
          onRefresh={handleRefreshMessages}
          ListFooterComponent={
            isSending ? (
              <View style={[styles.typingRow, { marginTop: spacing.sm }]}>
                <View
                  style={[
                    styles.typingBubble,
                    {
                      backgroundColor: colors.background.tertiary,
                      borderRadius: borderRadius.lg,
                      paddingHorizontal: spacing.lg,
                      paddingVertical: spacing.md,
                      borderColor: colors.border.subtle,
                    },
                  ]}
                >
                  <ActivityIndicator
                    size="small"
                    color={colors.accent.cyan}
                  />
                  <Text
                    style={[
                      typography.caption,
                      { color: colors.text.secondary, marginLeft: spacing.sm },
                    ]}
                  >
                    Coach is thinking…
                  </Text>
                </View>
              </View>
            ) : null
          }
        />
      )}

      {/* Error banner */}
      {error && (
        <Pressable
          onPress={clearError}
          style={[
            styles.errorBanner,
            {
              backgroundColor: colors.accent.dangerDim,
              borderColor: colors.accent.danger,
              marginHorizontal: spacing.lg,
              marginBottom: spacing.sm,
              borderRadius: borderRadius.md,
              padding: spacing.md,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Error: ${error}. Tap to dismiss.`}
        >
          <Ionicons
            name="alert-circle-outline"
            size={18}
            color={colors.accent.danger}
          />
          <Text
            style={[
              typography.caption,
              { color: colors.accent.danger, marginLeft: spacing.sm, flex: 1 },
            ]}
            numberOfLines={2}
          >
            {error}
          </Text>
        </Pressable>
      )}

      <HelpBubble id="chat_context" message="Your coach knows all your data — ask anything" position="below" />

      {/* Composer or Gate */}
      {chatGate.isCapped ? (
        <View
          style={{
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.sm,
            paddingBottom: insets.bottom > 0 ? insets.bottom : spacing.md,
            backgroundColor: colors.background.secondary,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: colors.border.subtle,
          }}
        >
          <GatePromptCard featureKey="ai_chat_coach" height={100} />
        </View>
      ) : (
        <View
          style={[
            styles.composerRow,
            {
              paddingHorizontal: spacing.lg,
              paddingTop: spacing.sm,
              paddingBottom: insets.bottom > 0 ? insets.bottom : spacing.md,
              backgroundColor: colors.background.secondary,
              borderTopColor: colors.border.subtle,
            },
          ]}
        >
          <View
            style={[
              styles.inputWrapper,
              {
                backgroundColor: colors.background.input,
                borderRadius: borderRadius.lg,
                borderColor: colors.border.subtle,
                paddingHorizontal: spacing.md,
              },
            ]}
          >
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Message your coach…"
              placeholderTextColor={colors.text.muted}
              style={[
                styles.input,
                typography.body,
                { color: colors.text.primary },
              ]}
              multiline
              maxLength={2000}
              editable={!isSending}
              accessibilityLabel="Message input"
            />
          </View>
          <Pressable
            onPress={handleSend}
            disabled={isSending || input.trim().length === 0}
            style={[
              styles.sendButton,
              {
                backgroundColor: input.trim().length === 0
                  ? colors.background.tertiary
                  : colors.accent.primary,
                marginLeft: spacing.sm,
                borderRadius: borderRadius.full,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Send message"
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons
                name="arrow-up"
                size={22}
                color={input.trim().length === 0 ? colors.text.muted : '#FFFFFF'}
              />
            )}
          </Pressable>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageRow: {
    flexDirection: 'row',
  },
  bubble: {
    flexShrink: 1,
  },
  assistantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typingRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  composerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  inputWrapper: {
    flex: 1,
    borderWidth: 1,
    minHeight: 48,
    maxHeight: 140,
    justifyContent: 'center',
  },
  input: {
    paddingVertical: 10,
    paddingHorizontal: 0,
    maxHeight: 120,
  },
  sendButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
