import { renderHook, act } from '@testing-library/react-native';

const mockInitNfc = jest.fn().mockResolvedValue(true);
const mockCleanupNfc = jest.fn().mockResolvedValue(undefined);
const mockFetchUserNfcTriggers = jest.fn().mockResolvedValue([]);
const mockReadNfcTag = jest.fn().mockResolvedValue(null);
const mockExecuteNfcAction = jest.fn().mockResolvedValue(undefined);

jest.mock('../../services/nfc', () => ({
  initNfc: (...args: unknown[]) => mockInitNfc(...args),
  readNfcTag: (...args: unknown[]) => mockReadNfcTag(...args),
  fetchUserNfcTriggers: (...args: unknown[]) => mockFetchUserNfcTriggers(...args),
  executeNfcAction: (...args: unknown[]) => mockExecuteNfcAction(...args),
  cleanupNfc: (...args: unknown[]) => mockCleanupNfc(...args),
}));

jest.mock('../../stores/authStore', () => ({
  useAuthStore: jest.fn((selector?: (s: { user: { id: string } }) => unknown) => {
    const mockState = { user: { id: 'u-1' } };
    return selector ? selector(mockState) : mockState;
  }),
}));

const mockRouterPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ push: mockRouterPush })),
}));

import { useNFC } from '../../hooks/useNFC';

describe('useNFC', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockInitNfc.mockResolvedValue(true);
    mockCleanupNfc.mockResolvedValue(undefined);
    mockFetchUserNfcTriggers.mockResolvedValue([]);
    mockReadNfcTag.mockResolvedValue(null);
  });

  it('has initial state: supported=false, scanning=false before initNfc resolves', () => {
    // Before async initNfc resolves, state starts false
    const { result, unmount } = renderHook(() => useNFC());
    expect(result.current.supported).toBe(false);
    expect(result.current.scanning).toBe(false);
    unmount();
  });

  it('calls initNfc on mount', async () => {
    const { unmount } = renderHook(() => useNFC());
    await act(async () => {
      await Promise.resolve();
    });
    expect(mockInitNfc).toHaveBeenCalledTimes(1);
    unmount();
  });

  it('sets supported=true after initNfc resolves with true', async () => {
    mockInitNfc.mockResolvedValue(true);
    const { result, unmount } = renderHook(() => useNFC());

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.supported).toBe(true);
    unmount();
  });

  it('calls cleanupNfc on unmount', async () => {
    const { unmount } = renderHook(() => useNFC());
    await act(async () => {
      await Promise.resolve();
    });

    unmount();

    expect(mockCleanupNfc).toHaveBeenCalledTimes(1);
  });

  it('fetches NFC triggers when user exists', async () => {
    const fakeTriggers = [
      {
        id: 't-1',
        tag_id: 'nfc-abc',
        label: 'Gym entry',
        action: 'navigate',
        action_params: null,
        is_active: true,
      },
    ];
    mockFetchUserNfcTriggers.mockResolvedValue(fakeTriggers);

    const { result, unmount } = renderHook(() => useNFC());
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(mockFetchUserNfcTriggers).toHaveBeenCalledWith('u-1');
    expect(result.current.triggers).toEqual(fakeTriggers);
    unmount();
  });

  it('triggers list is empty when fetchUserNfcTriggers returns empty', async () => {
    mockFetchUserNfcTriggers.mockResolvedValue([]);

    const { result, unmount } = renderHook(() => useNFC());
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(result.current.triggers).toEqual([]);
    unmount();
  });
});
