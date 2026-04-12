// =============================================================================
// TRANSFORMR -- Chat Store
// Manages AI Chat Coach conversations and messages client-side.
// =============================================================================

import { create } from 'zustand';
import {
  archiveConversation,
  deleteConversation,
  fetchConversation,
  fetchConversations,
  fetchMessages,
  renameConversation,
  sendChatMessage,
  togglePinConversation,
} from '@services/ai/chat';
import type {
  ChatConversation,
  ChatMessage,
  ChatTopic,
} from '@app-types/ai';

interface ChatState {
  conversations: ChatConversation[];
  activeConversationId: string | null;
  messagesByConversation: Record<string, ChatMessage[]>;
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  isSending: boolean;
  error: string | null;
}

interface ChatActions {
  fetchConversationList: () => Promise<void>;
  openConversation: (conversationId: string) => Promise<void>;
  startNewConversation: (topic?: ChatTopic) => void;
  sendMessage: (content: string, topic?: ChatTopic) => Promise<void>;
  archive: (conversationId: string) => Promise<void>;
  remove: (conversationId: string) => Promise<void>;
  rename: (conversationId: string, title: string) => Promise<void>;
  togglePin: (conversationId: string, pinned: boolean) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

type ChatStore = ChatState & ChatActions;

function makeOptimisticUserMessage(
  conversationId: string,
  content: string,
): ChatMessage {
  return {
    id: `temp-${Date.now()}`,
    conversation_id: conversationId,
    user_id: '',
    role: 'user',
    content,
    suggestions: null,
    disclaimer_type: null,
    context_snapshot: null,
    model: null,
    tokens_in: null,
    tokens_out: null,
    latency_ms: null,
    created_at: new Date().toISOString(),
  };
}

export const useChatStore = create<ChatStore>()((set, get) => ({
  // --- State ---
  conversations: [],
  activeConversationId: null,
  messagesByConversation: {},
  isLoadingConversations: false,
  isLoadingMessages: false,
  isSending: false,
  error: null,

  // --- Actions ---
  fetchConversationList: async () => {
    set({ isLoadingConversations: true, error: null });
    try {
      const conversations = await fetchConversations();
      set({ conversations, isLoadingConversations: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load conversations';
      set({ error: message, isLoadingConversations: false });
    }
  },

  openConversation: async (conversationId) => {
    set({
      activeConversationId: conversationId,
      isLoadingMessages: true,
      error: null,
    });
    try {
      const [conversation, messages] = await Promise.all([
        fetchConversation(conversationId),
        fetchMessages(conversationId),
      ]);

      set((state) => ({
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: messages,
        },
        conversations: state.conversations.some((c) => c.id === conversation.id)
          ? state.conversations.map((c) => (c.id === conversation.id ? conversation : c))
          : [conversation, ...state.conversations],
        isLoadingMessages: false,
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to open conversation';
      set({ error: message, isLoadingMessages: false });
    }
  },

  startNewConversation: () => {
    set({ activeConversationId: null, error: null });
  },

  sendMessage: async (content, topic = 'general') => {
    const trimmed = content.trim();
    if (trimmed.length === 0) return;

    const state = get();
    const conversationId = state.activeConversationId;
    const tempConvoId = conversationId ?? `pending-${Date.now()}`;

    const optimistic = makeOptimisticUserMessage(tempConvoId, trimmed);

    set({
      isSending: true,
      error: null,
      messagesByConversation: {
        ...state.messagesByConversation,
        [tempConvoId]: [
          ...(state.messagesByConversation[tempConvoId] ?? []),
          optimistic,
        ],
      },
    });

    try {
      const response = await sendChatMessage({
        conversationId,
        message: trimmed,
        topic,
      });

      const realConvoId = response.conversation_id;

      const assistantMessage: ChatMessage = {
        id: response.message_id,
        conversation_id: realConvoId,
        user_id: '',
        role: 'assistant',
        content: response.content,
        suggestions: response.suggestions,
        disclaimer_type: response.disclaimer_type,
        context_snapshot: null,
        model: null,
        tokens_in: null,
        tokens_out: null,
        latency_ms: response.latency_ms,
        created_at: response.created_at,
      };

      set((s) => {
        const pendingMessages = s.messagesByConversation[tempConvoId] ?? [];

        // Swap the temp convo key for the real one if needed
        const reassigned: Record<string, ChatMessage[]> = { ...s.messagesByConversation };
        if (tempConvoId !== realConvoId) {
          delete reassigned[tempConvoId];
        }

        const rebuilt = pendingMessages.map((m) =>
          m.id === optimistic.id ? { ...m, conversation_id: realConvoId } : m,
        );

        reassigned[realConvoId] = [...rebuilt, assistantMessage];

        return {
          isSending: false,
          activeConversationId: realConvoId,
          messagesByConversation: reassigned,
        };
      });

      // Refresh list so titles and timestamps are accurate
      void get().fetchConversationList();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send message';
      set((s) => {
        const existing = s.messagesByConversation[tempConvoId] ?? [];
        return {
          isSending: false,
          error: message,
          messagesByConversation: {
            ...s.messagesByConversation,
            [tempConvoId]: existing.filter((m) => m.id !== optimistic.id),
          },
        };
      });
    }
  },

  archive: async (conversationId) => {
    try {
      await archiveConversation(conversationId);
      set((s) => ({
        conversations: s.conversations.filter((c) => c.id !== conversationId),
        activeConversationId:
          s.activeConversationId === conversationId ? null : s.activeConversationId,
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to archive conversation';
      set({ error: message });
    }
  },

  remove: async (conversationId) => {
    try {
      await deleteConversation(conversationId);
      set((s) => {
        const next = { ...s.messagesByConversation };
        delete next[conversationId];
        return {
          conversations: s.conversations.filter((c) => c.id !== conversationId),
          messagesByConversation: next,
          activeConversationId:
            s.activeConversationId === conversationId ? null : s.activeConversationId,
        };
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete conversation';
      set({ error: message });
    }
  },

  rename: async (conversationId, title) => {
    try {
      await renameConversation(conversationId, title);
      set((s) => ({
        conversations: s.conversations.map((c) =>
          c.id === conversationId ? { ...c, title } : c,
        ),
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to rename conversation';
      set({ error: message });
    }
  },

  togglePin: async (conversationId, pinned) => {
    try {
      await togglePinConversation(conversationId, pinned);
      set((s) => ({
        conversations: s.conversations.map((c) =>
          c.id === conversationId ? { ...c, pinned } : c,
        ),
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to pin conversation';
      set({ error: message });
    }
  },

  clearError: () => set({ error: null }),

  reset: () =>
    set({
      conversations: [],
      activeConversationId: null,
      messagesByConversation: {},
      isLoadingConversations: false,
      isLoadingMessages: false,
      isSending: false,
      error: null,
    }),
}));
