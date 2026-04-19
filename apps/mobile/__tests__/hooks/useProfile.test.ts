import { renderHook } from '@testing-library/react-native';
import { useProfile } from '../../hooks/useProfile';

const mockFetchProfile = jest.fn();
const mockUpdateProfile = jest.fn();
let mockUserId: string | null = 'u-1';

jest.mock('../../stores/profileStore', () => ({
  useProfileStore: jest.fn(),
}));

jest.mock('../../stores/authStore', () => ({
  useAuthStore: jest.fn(),
}));

import { useProfileStore } from '../../stores/profileStore';
import { useAuthStore } from '../../stores/authStore';

const mockedUseProfileStore = useProfileStore as jest.MockedFunction<typeof useProfileStore>;
const mockedUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

function buildProfileState() {
  return {
    profile: null,
    isLoading: false,
    error: null as string | null,
    fetchProfile: mockFetchProfile,
    updateProfile: mockUpdateProfile,
    setTheme: jest.fn(),
    clearError: jest.fn(),
    reset: jest.fn(),
  };
}

function setupMocks() {
  const state = buildProfileState();
  mockedUseProfileStore.mockImplementation(
    (selector?: (s: ReturnType<typeof buildProfileState>) => unknown) =>
      selector ? selector(state) : state,
  );
  mockedUseAuthStore.mockReturnValue(
    { user: mockUserId ? { id: mockUserId } : null } as ReturnType<typeof useAuthStore>,
  );
}

describe('useProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUserId = 'u-1';
    setupMocks();
  });

  it('calls fetchProfile on mount when a user id exists', () => {
    renderHook(() => useProfile());
    expect(mockFetchProfile).toHaveBeenCalledTimes(1);
  });

  it('does NOT call fetchProfile when user is null', () => {
    mockUserId = null;
    setupMocks();
    renderHook(() => useProfile());
    expect(mockFetchProfile).not.toHaveBeenCalled();
  });

  it('returns profile from the store', () => {
    const { result } = renderHook(() => useProfile());
    expect(result.current.profile).toBeNull();
  });

  it('returns isLoading from the store', () => {
    const { result } = renderHook(() => useProfile());
    expect(result.current.isLoading).toBe(false);
  });

  it('returns error from the store', () => {
    const { result } = renderHook(() => useProfile());
    expect(result.current.error).toBeNull();
  });

  it('returns updateProfile from the store', () => {
    const { result } = renderHook(() => useProfile());
    expect(typeof result.current.updateProfile).toBe('function');
  });
});
