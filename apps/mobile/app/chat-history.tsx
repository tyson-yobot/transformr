// =============================================================================
// TRANSFORMR -- AI Chat History
// Shows pinned and recent conversations with the AI Coach. Supports pin,
// rename, archive, and delete actions.
// =============================================================================

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Alert,
  ListRenderItem,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@theme/index';
import { useChatStore } from '@stores/chatStore';
import type { ChatConversation, ChatTopic } from '@app-types/ai';
import { hapticLight, hapticMedium } from '@utils/haptics';

const TOPIC_ICONS: Record<ChatTopic, keyof typeof Ionicons.glyphMap> = {
  general: 'chatbubble-ellipses-outline',
  training: 'barbell-outline',
  nutrition: 'restaurant-outline',
  supplements: 'medkit-outline',
  sleep: 'moon-outline',
  mindset: 'sparkles-outline',
  business: 'trending-up-outline',
  goals: 'flag-outline',
  labs: 'flask-outline',
  recovery: 'heart-outline',
};

function formatRelativeDate(iso: string): string {
  const now = new Date();
  const then = new Date(iso);
  const diffMs = now.getTime() - then.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ChatHistoryScreen() {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [refreshing, setRefreshing] = useState(false);

  const conversations = useChatStore((s) => s.conversations);
  const isLoading = useChatStore((s) => s.isLoadingConversations);
  const error = useChatStore((s) => s.error);
  const fetchConversationList = useChatStore((s) => s.fetchConversationList);
  const openConversation = useChatStore((s) => s.openConversation);
  const remove = useChatStore((s) => s.remove);
  const archive = useChatStore((s) => s.archive);
  const togglePin = useChatStore((s) => s.togglePin);
  const clearError = useChatStore((s) => s.clearError);

  useEffect(() => {
    void fetchConversationList();
  }, [fetchConversationList]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchConversationList();
    setRefreshing(false);
  }, [fetchConversationList]);

  const handleOpen = useCallback(
    async (conversationId: string) => {
      void hapticLight();
      await openConversation(conversationId);
      router.push({ pathname: '/chat', params: { conversation_id: conversationId } });
    },
    [openConversation, router],
  );

  const handleLongPress = useCallback(
    (conversation: ChatConversation) => {
      void hapticMedium();
      Alert.alert(
        conversation.title,
        'What would you like to do?',
        [
          {
            text: conversation.pinned ? 'Unpin' : 'Pin',
            onPress: () => void togglePin(conversation.id, !conversation.pinned),
          },
          {
            text: 'Archive',
            onPress: () => void archive(conversation.id),
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              Alert.alert(
                'Delete conversation?',
                'This cannot be undone.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => void remove(conversation.id),
                  },
                ],
              );
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ],
      );
    },
    [archive, remove, togglePin],
  );

  const pinned = useMemo(
    () => conversations.filter((c) => c.pinned),
    [conversations],
  );
  const recent = useMemo(
    () => conversations.filter((c) => !c.pinned),
    [conversations],
  );

  const renderItem: ListRenderItem<ChatConversation> = useCallback(
    ({ item, index }) => (
      <Animated.View entering={FadeInDown.delay(index * 30).duration(280)}>
        <Pressable
          onPress={() => void handleOpen(item.id)}
          onLongPress={() => handleLongPress(item)}
          style={({ pressed }) => [
            styles.row,
            {
              backgroundColor: colors.background.secondary,
              borderColor: colors.border.subtle,
              borderRadius: borderRadius.md,
              padding: spacing.md,
              marginBottom: spacing.sm,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Open conversation: ${item.title}`}
        >
          <View
            style={[
              styles.iconWrapper,
              {
                backgroundColor: colors.accent.primaryDim,
                borderRadius: borderRadius.md,
              },
            ]}
          >
            <Ionicons
              name={TOPIC_ICONS[item.topic] ?? 'chatbubble-outline'}
              size={20}
              color={colors.accent.cyan}
            />
          </View>
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <View style={styles.titleRow}>
              {item.pinned && (
                <Ionicons
                  name="pin"
                  size={12}
                  color={colors.accent.gold}
                  style={{ marginRight: spacing.xs }}
                />
              )}
              <Text
                style={[typography.bodyBold, { color: colors.text.primary, flex: 1 }]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
            </View>
            <Text
              style={[
                typography.caption,
                { color: colors.text.secondary, marginTop: spacing.xs / 2 },
              ]}
              numberOfLines={1}
            >
              {item.message_count} {item.message_count === 1 ? 'message' : 'messages'} · {formatRelativeDate(item.last_message_at)}
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.text.muted}
          />
        </Pressable>
      </Animated.View>
    ),
    [
      borderRadius.md,
      colors.accent.cyan,
      colors.accent.gold,
      colors.accent.primaryDim,
      colors.background.secondary,
      colors.border.subtle,
      colors.text.muted,
      colors.text.primary,
      colors.text.secondary,
      handleLongPress,
      handleOpen,
      spacing.md,
      spacing.sm,
      spacing.xs,
      typography.bodyBold,
      typography.caption,
    ],
  );

  const renderEmpty = () => (
    <View
      style={[
        styles.emptyContainer,
        { paddingTop: spacing.xxxl * 2, paddingHorizontal: spacing.xl },
      ]}
    >
      <Ionicons
        name="chatbubbles-outline"
        size={56}
        color={colors.text.muted}
      />
      <Text
        style={[
          typography.h3,
          { color: colors.text.primary, marginTop: spacing.lg, textAlign: 'center' },
        ]}
      >
        No conversations yet
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
        Start a conversation with your AI Coach for data-driven guidance.
      </Text>
      <Pressable
        onPress={() => {
          void hapticLight();
          router.push('/chat');
        }}
        style={[
          styles.ctaButton,
          {
            backgroundColor: colors.accent.primary,
            borderRadius: borderRadius.md,
            paddingHorizontal: spacing.xl,
            paddingVertical: spacing.md,
            marginTop: spacing.xl,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Start a new conversation"
      >
        <Ionicons name="sparkles" size={16} color="#FFFFFF" />
        <Text
          style={[
            typography.bodyBold,
            { color: '#FFFFFF', marginLeft: spacing.sm },
          ]}
        >
          New Conversation
        </Text>
      </Pressable>
    </View>
  );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background.primary },
      ]}
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
        <Text
          style={[typography.h3, { color: colors.text.primary }]}
        >
          Chat History
        </Text>
        <Pressable
          onPress={() => {
            void hapticLight();
            router.push('/chat');
          }}
          accessibilityLabel="New conversation"
          accessibilityRole="button"
          hitSlop={12}
        >
          <Ionicons
            name="add-circle-outline"
            size={24}
            color={colors.accent.cyan}
          />
        </Pressable>
      </View>

      {error && (
        <Pressable
          onPress={clearError}
          style={[
            styles.errorBanner,
            {
              backgroundColor: colors.accent.dangerDim,
              borderColor: colors.accent.danger,
              marginHorizontal: spacing.lg,
              marginTop: spacing.sm,
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

      {isLoading && conversations.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.accent.primary} />
        </View>
      ) : (
        <FlatList
          data={[...pinned, ...recent]}
          renderItem={renderItem}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.md,
            paddingBottom: insets.bottom + spacing.xl,
            flexGrow: 1,
          }}
          ListHeaderComponent={
            pinned.length > 0 && recent.length > 0 ? (
              <Text
                style={[
                  typography.caption,
                  {
                    color: colors.text.muted,
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    marginBottom: spacing.sm,
                  },
                ]}
              >
                Pinned
              </Text>
            ) : null
          }
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent.primary}
              colors={[colors.accent.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
});
