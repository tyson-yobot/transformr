import { act } from '@testing-library/react-native';
import { useInsightStore } from '../../stores/insightStore';

// ---------------------------------------------------------------------------
// Supabase mock
// ---------------------------------------------------------------------------

const mockGetUser = jest.fn().mockResolvedValue({
  data: { user: { id: 'user-123' } },
  error: null,
});
const mockFrom = jest.fn();

jest.mock('../../services/supabase', () => ({
  supabase: {
    auth: { getUser: (...args: unknown[]) => mockGetUser(...args) },
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

// ---------------------------------------------------------------------------
// Chain helper
// ---------------------------------------------------------------------------

function makeChain(result: { data: unknown; error: null | { message: string } }) {
  type Chain = Record<string, jest.Mock>;
  const chain: Chain = {};
  ['select', 'eq', 'order', 'update', 'single', 'limit', 'in'].forEach((m) => {
    chain[m] = jest.fn().mockReturnValue(chain);
  });
  chain['then'] = jest.fn().mockImplementation(
    (resolve: (v: typeof result) => unknown) => Promise.resolve(result).then(resolve)
  );
  return chain;
}

beforeEach(() => {
  jest.clearAllMocks();
  useInsightStore.setState({
    predictions: [],
    proactiveMessages: [],
    isLoading: false,
    error: null,
  });
});

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

describe('initial state', () => {
  it('has empty predictions', () => {
    expect(useInsightStore.getState().predictions).toHaveLength(0);
  });

  it('has empty proactiveMessages', () => {
    expect(useInsightStore.getState().proactiveMessages).toHaveLength(0);
  });

  it('is not loading', () => {
    expect(useInsightStore.getState().isLoading).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// fetchAll
// ---------------------------------------------------------------------------

describe('fetchAll', () => {
  it('fetches predictions and proactive messages', async () => {
    const prediction = { id: 'pred-1', user_id: 'user-123', type: 'weight', message: 'Keep going!' };
    const message = { id: 'msg-1', user_id: 'user-123', content: 'Great job!' };

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return makeChain({ data: [prediction], error: null });
      return makeChain({ data: [message], error: null });
    });

    await act(async () => {
      await useInsightStore.getState().fetchAll();
    });

    expect(useInsightStore.getState().predictions).toHaveLength(1);
    expect(useInsightStore.getState().proactiveMessages).toHaveLength(1);
    expect(useInsightStore.getState().isLoading).toBe(false);
  });

  it('sets error when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    await act(async () => {
      await useInsightStore.getState().fetchAll();
    });

    expect(useInsightStore.getState().error).toBe('Not authenticated');
  });
});

// ---------------------------------------------------------------------------
// acknowledgePrediction
// ---------------------------------------------------------------------------

describe('acknowledgePrediction', () => {
  it('acknowledges a prediction and removes from list', async () => {
    const pred = { id: 'pred-1', acknowledged: false };
    useInsightStore.setState({ predictions: [pred as never] });
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }));

    await act(async () => {
      await useInsightStore.getState().acknowledgePrediction('pred-1');
    });

    // The prediction should be removed or marked acknowledged
    const preds = useInsightStore.getState().predictions;
    expect(preds.find((p) => p.id === 'pred-1' && !p.acknowledged)).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// dismissMessage / markMessageRead
// ---------------------------------------------------------------------------

describe('dismissMessage', () => {
  it('removes a dismissed message', async () => {
    const msg = { id: 'msg-1', dismissed: false };
    useInsightStore.setState({ proactiveMessages: [msg as never] });
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }));

    await act(async () => {
      await useInsightStore.getState().dismissMessage('msg-1');
    });

    const msgs = useInsightStore.getState().proactiveMessages;
    expect(msgs.find((m) => m.id === 'msg-1' && !m.dismissed)).toBeUndefined();
  });
});

describe('markMessageRead', () => {
  it('marks a message as read', async () => {
    const msg = { id: 'msg-1', is_read: false };
    useInsightStore.setState({ proactiveMessages: [msg as never] });
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }));

    await act(async () => {
      await useInsightStore.getState().markMessageRead('msg-1');
    });

    const updatedMsg = useInsightStore.getState().proactiveMessages.find((m) => m.id === 'msg-1');
    if (updatedMsg) {
      expect(updatedMsg.is_read).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// unreadCount
// ---------------------------------------------------------------------------

describe('unreadCount', () => {
  it('returns count of unread messages', () => {
    useInsightStore.setState({
      proactiveMessages: [
        { id: '1', is_read: false } as never,
        { id: '2', is_read: true } as never,
        { id: '3', is_read: false } as never,
      ],
    });
    expect(useInsightStore.getState().unreadCount()).toBe(2);
  });

  it('returns 0 when all messages are read', () => {
    useInsightStore.setState({
      proactiveMessages: [{ id: '1', is_read: true } as never],
    });
    expect(useInsightStore.getState().unreadCount()).toBe(0);
  });
});
