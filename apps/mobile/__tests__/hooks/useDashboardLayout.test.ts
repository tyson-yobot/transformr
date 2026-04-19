import { renderHook, act } from '@testing-library/react-native';
import { useDashboardLayout } from '../../hooks/useDashboardLayout';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockFetchLayout = jest.fn();
const mockSaveLayout = jest.fn().mockResolvedValue(undefined);
const mockResetToDefault = jest.fn().mockResolvedValue(undefined);

const mockDashboardState = {
  layout: [] as { id: string; type: string; title: string; size: string; position: number; visible: boolean; config: Record<string, string | number | boolean> }[],
  isLoading: false,
  error: null,
  fetchLayout: mockFetchLayout,
  saveLayout: mockSaveLayout,
  resetToDefault: mockResetToDefault,
  clearError: jest.fn(),
};

jest.mock('../../stores/dashboardStore', () => ({
  useDashboardStore: jest.fn((selector?: (s: typeof mockDashboardState) => unknown) =>
    selector ? selector(mockDashboardState) : mockDashboardState,
  ),
}));

const mockAuthState = { user: { id: 'u-1' } };
jest.mock('../../stores/authStore', () => ({
  useAuthStore: jest.fn((selector?: (s: typeof mockAuthState) => unknown) =>
    selector ? selector(mockAuthState) : mockAuthState,
  ),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useDashboardLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDashboardState.layout = [];
  });

  it('calls fetchLayout on mount when user exists', () => {
    renderHook(() => useDashboardLayout());
    expect(mockFetchLayout).toHaveBeenCalledTimes(1);
  });

  it('returns layout and isLoading from store', () => {
    const { result } = renderHook(() => useDashboardLayout());
    expect(result.current.layout).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('resetToDefault calls store.resetToDefault', async () => {
    const { result } = renderHook(() => useDashboardLayout());
    await act(async () => {
      await result.current.resetToDefault();
    });
    expect(mockResetToDefault).toHaveBeenCalledTimes(1);
  });

  it('addWidget appends a new widget and calls saveLayout', async () => {
    mockDashboardState.layout = [
      { id: 'w1', type: 'steps', title: 'Steps', size: 'medium', position: 0, visible: true, config: {} },
    ];
    const { result } = renderHook(() => useDashboardLayout());
    await act(async () => {
      await result.current.addWidget('calories');
    });
    expect(mockSaveLayout).toHaveBeenCalledTimes(1);
    const savedLayout = mockSaveLayout.mock.calls[0][0] as { type: string; position: number }[];
    expect(savedLayout).toHaveLength(2);
    expect(savedLayout[1]?.type).toBe('calories');
    expect(savedLayout[1]?.position).toBe(1);
  });

  it('addWidget title is capitalized from widget type', async () => {
    const { result } = renderHook(() => useDashboardLayout());
    await act(async () => {
      await result.current.addWidget('step_count');
    });
    const saved = mockSaveLayout.mock.calls[0][0] as { title: string }[];
    expect(saved[0]?.title).toBe('Step Count');
  });

  it('removeWidget filters out widget at given index', async () => {
    mockDashboardState.layout = [
      { id: 'w1', type: 'steps', title: 'Steps', size: 'medium', position: 0, visible: true, config: {} },
      { id: 'w2', type: 'calories', title: 'Calories', size: 'medium', position: 1, visible: true, config: {} },
    ];
    const { result } = renderHook(() => useDashboardLayout());
    await act(async () => {
      await result.current.removeWidget(0);
    });
    const saved = mockSaveLayout.mock.calls[0][0] as { id: string }[];
    expect(saved).toHaveLength(1);
    expect(saved[0]?.id).toBe('w2');
  });

  it('reorderWidgets moves widget from index to new index', async () => {
    mockDashboardState.layout = [
      { id: 'w1', type: 'steps', title: 'Steps', size: 'medium', position: 0, visible: true, config: {} },
      { id: 'w2', type: 'calories', title: 'Calories', size: 'medium', position: 1, visible: true, config: {} },
      { id: 'w3', type: 'water', title: 'Water', size: 'medium', position: 2, visible: true, config: {} },
    ];
    const { result } = renderHook(() => useDashboardLayout());
    await act(async () => {
      await result.current.reorderWidgets(2, 0);
    });
    const saved = mockSaveLayout.mock.calls[0][0] as { id: string }[];
    expect(saved[0]?.id).toBe('w3');
    expect(saved[1]?.id).toBe('w1');
  });
});
