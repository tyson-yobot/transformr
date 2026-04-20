import { renderHook } from '@testing-library/react-native';
import { usePartner } from '../../hooks/usePartner';
import type { Partnership, Profile } from '../../types/database';

const mockFetchPartnership = jest.fn();
let mockUserId: string | null = 'u-1';

jest.mock('../../stores/partnerStore', () => ({
  usePartnerStore: jest.fn(),
}));

jest.mock('../../stores/authStore', () => ({
  useAuthStore: jest.fn(),
}));

import { usePartnerStore } from '../../stores/partnerStore';
import { useAuthStore } from '../../stores/authStore';

const mockedUsePartnerStore = usePartnerStore as jest.MockedFunction<typeof usePartnerStore>;
const mockedUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

function buildPartnerState() {
  return {
    partnership: null as Partnership | null,
    partnerProfile: null as Profile | null,
    isLoading: false,
    error: null as string | null,
    pendingInviteCode: null as string | null,
    fetchPartnership: mockFetchPartnership,
    createPartnershipInvite: jest.fn(),
    sendNudge: jest.fn(),
    linkPartner: jest.fn(),
    setPendingInviteCode: jest.fn(),
    clearError: jest.fn(),
    reset: jest.fn(),
  };
}

function setupMocks() {
  const state = buildPartnerState();
  mockedUsePartnerStore.mockImplementation(
    (selector?: (s: ReturnType<typeof buildPartnerState>) => unknown) =>
      selector ? selector(state) : state,
  );
  mockedUseAuthStore.mockReturnValue(
    { user: mockUserId ? { id: mockUserId } : null } as ReturnType<typeof useAuthStore>,
  );
}

describe('usePartner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUserId = 'u-1';
    setupMocks();
  });

  it('calls fetchPartnership on mount when user id exists', () => {
    renderHook(() => usePartner());
    expect(mockFetchPartnership).toHaveBeenCalledTimes(1);
  });

  it('does NOT call fetchPartnership when user is null', () => {
    mockUserId = null;
    setupMocks();
    renderHook(() => usePartner());
    expect(mockFetchPartnership).not.toHaveBeenCalled();
  });

  it('returns partnership as null from the store initially', () => {
    const { result } = renderHook(() => usePartner());
    expect(result.current.partnership).toBeNull();
  });

  it('returns partnerProfile as null from the store initially', () => {
    const { result } = renderHook(() => usePartner());
    expect(result.current.partnerProfile).toBeNull();
  });

  it('returns isLoading from the store', () => {
    const { result } = renderHook(() => usePartner());
    expect(result.current.isLoading).toBe(false);
  });

  it('returns error from the store', () => {
    const { result } = renderHook(() => usePartner());
    expect(result.current.error).toBeNull();
  });

  it('returns callable store actions', () => {
    const { result } = renderHook(() => usePartner());
    expect(typeof result.current.fetchPartnership).toBe('function');
    expect(typeof result.current.createPartnershipInvite).toBe('function');
    expect(typeof result.current.sendNudge).toBe('function');
  });
});
