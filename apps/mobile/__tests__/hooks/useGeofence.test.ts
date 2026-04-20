import { renderHook, act } from '@testing-library/react-native';

const mockRequestLocationPermissions = jest.fn().mockResolvedValue(true);
const mockFetchUserGeofences = jest.fn().mockResolvedValue([]);
const mockStartGeofencing = jest.fn().mockResolvedValue(undefined);
const mockStopGeofencing = jest.fn().mockResolvedValue(undefined);
const mockConvertToGeofenceRegions = jest.fn().mockReturnValue([]);

jest.mock('../../services/geofence', () => ({
  requestLocationPermissions: (...args: unknown[]) => mockRequestLocationPermissions(...args),
  fetchUserGeofences: (...args: unknown[]) => mockFetchUserGeofences(...args),
  startGeofencing: (...args: unknown[]) => mockStartGeofencing(...args),
  stopGeofencing: (...args: unknown[]) => mockStopGeofencing(...args),
  convertToGeofenceRegions: (...args: unknown[]) => mockConvertToGeofenceRegions(...args),
}));

jest.mock('../../stores/authStore', () => ({
  useAuthStore: jest.fn((selector?: (s: { user: { id: string } }) => unknown) => {
    const mockState = { user: { id: 'u-1' } };
    return selector ? selector(mockState) : mockState;
  }),
}));

import { useGeofence } from '../../hooks/useGeofence';

describe('useGeofence', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequestLocationPermissions.mockResolvedValue(true);
    mockFetchUserGeofences.mockResolvedValue([]);
    mockStartGeofencing.mockResolvedValue(undefined);
    mockStopGeofencing.mockResolvedValue(undefined);
    mockConvertToGeofenceRegions.mockReturnValue([]);
  });

  it('has initial state: triggers empty, enabled false, hasPermission false before mount resolves', () => {
    const { result, unmount } = renderHook(() => useGeofence());
    expect(result.current.triggers).toEqual([]);
    expect(result.current.enabled).toBe(false);
    expect(result.current.hasPermission).toBe(false);
    unmount();
  });

  it('exposes enableGeofencing and disableGeofencing functions', () => {
    const { result, unmount } = renderHook(() => useGeofence());
    expect(typeof result.current.enableGeofencing).toBe('function');
    expect(typeof result.current.disableGeofencing).toBe('function');
    unmount();
  });

  it('calls fetchUserGeofences with user id on mount when user exists', async () => {
    const { unmount } = renderHook(() => useGeofence());
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
    expect(mockFetchUserGeofences).toHaveBeenCalledWith('u-1');
    unmount();
  });

  it('does not request permissions when geofences list is empty', async () => {
    mockFetchUserGeofences.mockResolvedValue([]);

    const { unmount } = renderHook(() => useGeofence());
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
    unmount();

    // enableGeofencing is only called when geofences.length > 0
    expect(mockRequestLocationPermissions).not.toHaveBeenCalled();
  });

  it('requests permissions and starts geofencing when geofences exist', async () => {
    const fakeGeofences = [
      {
        id: 'g-1',
        label: 'Gym',
        latitude: 51.5,
        longitude: -0.1,
        radius_meters: 200,
        trigger_on: 'enter',
        action: 'navigate',
        action_params: null,
        is_active: true,
      },
    ];
    mockFetchUserGeofences.mockResolvedValue(fakeGeofences);
    mockConvertToGeofenceRegions.mockReturnValue([{ id: 'g-1', lat: 51.5, lng: -0.1, radius: 200 }]);

    const { result, unmount } = renderHook(() => useGeofence());
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(mockRequestLocationPermissions).toHaveBeenCalledTimes(1);
    expect(mockStartGeofencing).toHaveBeenCalledTimes(1);
    expect(result.current.hasPermission).toBe(true);
    expect(result.current.enabled).toBe(true);
    unmount();
  });

  it('calls stopGeofencing on unmount', async () => {
    const { unmount } = renderHook(() => useGeofence());
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
    unmount();
    expect(mockStopGeofencing).toHaveBeenCalled();
  });

  it('disableGeofencing stops geofencing and sets enabled to false', async () => {
    const fakeGeofences = [
      {
        id: 'g-1',
        label: 'Gym',
        latitude: 51.5,
        longitude: -0.1,
        radius_meters: 200,
        trigger_on: 'enter',
        action: 'navigate',
        action_params: null,
        is_active: true,
      },
    ];
    mockFetchUserGeofences.mockResolvedValue(fakeGeofences);
    mockConvertToGeofenceRegions.mockReturnValue([{ id: 'g-1' }]);

    const { result, unmount } = renderHook(() => useGeofence());
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    await act(async () => {
      await result.current.disableGeofencing();
    });

    expect(result.current.enabled).toBe(false);
    unmount();
  });
});
