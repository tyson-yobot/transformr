import { act } from '@testing-library/react-native';
import { useChatStore } from '../../stores/chatStore';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockFetchConversations = jest.fn();
const mockFetchConversation = jest.fn();
const mockFetchMessages = jest.fn();
const mockSendChatMessage = jest.fn();
const mockArchiveConversation = jest.fn();
const mockDeleteConversation = jest.fn();
const mockRenameConversation = jest.fn();
const mockTogglePinConversation = jest.fn();

jest.mock('../../services/ai/chat', () => ({
  fetchConversations: (...args: unknown[]) => mockFetchConversations(...args),
  fetchConversation: (...args: unknown[]) => mockFetchConversation(...args),
  fetchMessages: (...args: unknown[]) => mockFetchMessages(...args),
  sendChatMessage: (...args: unknown[]) => mockSendChatMessage(...args),
  archiveConversation: (...args: unknown[]) => mockArchiveConversation(...args),
  deleteConversation: (...args: unknown[]) => mockDeleteConversation(...args),
  renameConversation: (...args: unknown[]) => mockRenameConversation(...args),
  togglePinConversation: (...args: unknown[]) => mockTogglePinConversation(...args),
}));

beforeEach(() => {
  jest.clearAllMocks();
  useChatStore.getState().reset();
});

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

describe('initial state', () => {
  it('has empty conversations', () => {
    expect(useChatStore.getState().conversations).toHaveLength(0);
  });

  it('has null activeConversationId', () => {
    expect(useChatStore.getState().activeConversationId).toBeNull();
  });

  it('has empty messagesByConversation', () => {
    expect(useChatStore.getState().messagesByConversation).toEqual({});
  });

  it('is not loading or sending', () => {
    expect(useChatStore.getState().isLoadingConversations).toBe(false);
    expect(useChatStore.getState().isLoadingMessages).toBe(false);
    expect(useChatStore.getState().isSending).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// clearError / reset
// ---------------------------------------------------------------------------

describe('clearError', () => {
  it('clears error', () => {
    useChatStore.setState({ error: 'Oops' });
    useChatStore.getState().clearError();
    expect(useChatStore.getState().error).toBeNull();
  });
});

describe('reset', () => {
  it('resets all state', () => {
    useChatStore.setState({ conversations: [{ id: 'c1' } as never], error: 'err' });
    useChatStore.getState().reset();
    expect(useChatStore.getState().conversations).toHaveLength(0);
    expect(useChatStore.getState().error).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// startNewConversation
// ---------------------------------------------------------------------------

describe('startNewConversation', () => {
  it('clears activeConversationId and error', () => {
    useChatStore.setState({ activeConversationId: 'c1', error: 'err' });
    useChatStore.getState().startNewConversation();
    expect(useChatStore.getState().activeConversationId).toBeNull();
    expect(useChatStore.getState().error).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// fetchConversationList
// ---------------------------------------------------------------------------

describe('fetchConversationList', () => {
  it('fetches conversations and updates state', async () => {
    const convos = [{ id: 'c1', title: 'Workout Tips' }, { id: 'c2', title: 'Nutrition' }];
    mockFetchConversations.mockResolvedValueOnce(convos);

    await act(async () => {
      await useChatStore.getState().fetchConversationList();
    });

    expect(useChatStore.getState().conversations).toHaveLength(2);
    expect(useChatStore.getState().isLoadingConversations).toBe(false);
  });

  it('sets error when fetch fails', async () => {
    mockFetchConversations.mockRejectedValueOnce(new Error('Network error'));

    await act(async () => {
      await useChatStore.getState().fetchConversationList();
    });

    expect(useChatStore.getState().error).toBe('Network error');
    expect(useChatStore.getState().isLoadingConversations).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// openConversation
// ---------------------------------------------------------------------------

describe('openConversation', () => {
  it('loads conversation and messages', async () => {
    const convo = { id: 'c1', title: 'Workout Tips' };
    const messages = [{ id: 'm1', conversation_id: 'c1', content: 'Hello' }];
    mockFetchConversation.mockResolvedValueOnce(convo);
    mockFetchMessages.mockResolvedValueOnce(messages);

    await act(async () => {
      await useChatStore.getState().openConversation('c1');
    });

    expect(useChatStore.getState().activeConversationId).toBe('c1');
    expect(useChatStore.getState().messagesByConversation['c1']).toHaveLength(1);
    expect(useChatStore.getState().isLoadingMessages).toBe(false);
  });

  it('merges existing conversation into list', async () => {
    const existing = { id: 'c1', title: 'Old Title' };
    useChatStore.setState({ conversations: [existing as never] });
    const updated = { id: 'c1', title: 'Updated Title' };
    mockFetchConversation.mockResolvedValueOnce(updated);
    mockFetchMessages.mockResolvedValueOnce([]);

    await act(async () => {
      await useChatStore.getState().openConversation('c1');
    });

    const convos = useChatStore.getState().conversations;
    expect(convos).toHaveLength(1);
    expect(convos[0]?.title).toBe('Updated Title');
  });

  it('sets error when fetch fails', async () => {
    mockFetchConversation.mockRejectedValueOnce(new Error('Not found'));
    mockFetchMessages.mockResolvedValueOnce([]);

    await act(async () => {
      await useChatStore.getState().openConversation('c1');
    });

    expect(useChatStore.getState().error).toBeTruthy();
    expect(useChatStore.getState().isLoadingMessages).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// sendMessage
// ---------------------------------------------------------------------------

describe('sendMessage', () => {
  it('sends a message and updates state with response', async () => {
    const sendResponse = {
      conversation_id: 'c1',
      message_id: 'm-assistant-1',
      content: 'Here is your plan.',
      suggestions: null,
      disclaimer_type: null,
      latency_ms: 500,
      created_at: new Date().toISOString(),
    };
    mockSendChatMessage.mockResolvedValueOnce(sendResponse);
    mockFetchConversations.mockResolvedValueOnce([]);

    useChatStore.setState({ activeConversationId: 'c1' });

    await act(async () => {
      await useChatStore.getState().sendMessage('What is my macro target?');
    });

    expect(useChatStore.getState().isSending).toBe(false);
    expect(useChatStore.getState().activeConversationId).toBe('c1');
    const msgs = useChatStore.getState().messagesByConversation['c1'];
    expect(msgs).toBeDefined();
    // Both the user message and assistant message should be there
    expect(msgs?.some((m) => m.role === 'assistant')).toBe(true);
  });

  it('ignores empty/whitespace-only messages', async () => {
    await useChatStore.getState().sendMessage('   ');
    expect(mockSendChatMessage).not.toHaveBeenCalled();
  });

  it('removes optimistic message on send failure', async () => {
    mockSendChatMessage.mockRejectedValueOnce(new Error('Send failed'));

    useChatStore.setState({ activeConversationId: 'c1' });

    await act(async () => {
      await useChatStore.getState().sendMessage('Hello');
    });

    expect(useChatStore.getState().error).toBe('Send failed');
    expect(useChatStore.getState().isSending).toBe(false);
    // optimistic message removed
    const msgs = useChatStore.getState().messagesByConversation['c1'];
    expect(msgs ?? []).toHaveLength(0);
  });

  it('handles new conversation (no active conversationId)', async () => {
    const sendResponse = {
      conversation_id: 'c-new',
      message_id: 'm-1',
      content: 'Reply here.',
      suggestions: null,
      disclaimer_type: null,
      latency_ms: 300,
      created_at: new Date().toISOString(),
    };
    mockSendChatMessage.mockResolvedValueOnce(sendResponse);
    mockFetchConversations.mockResolvedValueOnce([]);

    // No active conversation
    useChatStore.setState({ activeConversationId: null });

    await act(async () => {
      await useChatStore.getState().sendMessage('Start new chat');
    });

    expect(useChatStore.getState().activeConversationId).toBe('c-new');
  });
});

// ---------------------------------------------------------------------------
// archive / remove / rename / togglePin
// ---------------------------------------------------------------------------

describe('archive', () => {
  it('removes conversation from list', async () => {
    useChatStore.setState({ conversations: [{ id: 'c1' } as never] });
    mockArchiveConversation.mockResolvedValueOnce(undefined);

    await act(async () => {
      await useChatStore.getState().archive('c1');
    });

    expect(useChatStore.getState().conversations).toHaveLength(0);
  });

  it('clears active conversation if archived', async () => {
    useChatStore.setState({ activeConversationId: 'c1', conversations: [{ id: 'c1' } as never] });
    mockArchiveConversation.mockResolvedValueOnce(undefined);

    await act(async () => {
      await useChatStore.getState().archive('c1');
    });

    expect(useChatStore.getState().activeConversationId).toBeNull();
  });

  it('sets error when archive fails', async () => {
    mockArchiveConversation.mockRejectedValueOnce(new Error('Archive failed'));

    await act(async () => {
      await useChatStore.getState().archive('c1');
    });

    expect(useChatStore.getState().error).toBe('Archive failed');
  });
});

describe('remove', () => {
  it('removes conversation and its messages', async () => {
    useChatStore.setState({
      conversations: [{ id: 'c1' } as never],
      messagesByConversation: { c1: [{ id: 'm1' } as never] },
    });
    mockDeleteConversation.mockResolvedValueOnce(undefined);

    await act(async () => {
      await useChatStore.getState().remove('c1');
    });

    expect(useChatStore.getState().conversations).toHaveLength(0);
    expect(useChatStore.getState().messagesByConversation['c1']).toBeUndefined();
  });

  it('sets error when remove fails', async () => {
    mockDeleteConversation.mockRejectedValueOnce(new Error('Delete failed'));

    await act(async () => {
      await useChatStore.getState().remove('c1');
    });

    expect(useChatStore.getState().error).toBe('Delete failed');
  });
});

describe('rename', () => {
  it('renames the conversation in list', async () => {
    useChatStore.setState({ conversations: [{ id: 'c1', title: 'Old' } as never] });
    mockRenameConversation.mockResolvedValueOnce(undefined);

    await act(async () => {
      await useChatStore.getState().rename('c1', 'New Title');
    });

    expect(useChatStore.getState().conversations[0]?.title).toBe('New Title');
  });

  it('sets error when rename fails', async () => {
    mockRenameConversation.mockRejectedValueOnce(new Error('Rename failed'));

    await act(async () => {
      await useChatStore.getState().rename('c1', 'Fail');
    });

    expect(useChatStore.getState().error).toBe('Rename failed');
  });
});

describe('togglePin', () => {
  it('pins conversation', async () => {
    useChatStore.setState({ conversations: [{ id: 'c1', pinned: false } as never] });
    mockTogglePinConversation.mockResolvedValueOnce(undefined);

    await act(async () => {
      await useChatStore.getState().togglePin('c1', true);
    });

    expect(useChatStore.getState().conversations[0]?.pinned).toBe(true);
  });

  it('sets error when togglePin fails', async () => {
    mockTogglePinConversation.mockRejectedValueOnce(new Error('Pin failed'));

    await act(async () => {
      await useChatStore.getState().togglePin('c1', false);
    });

    expect(useChatStore.getState().error).toBe('Pin failed');
  });
});
