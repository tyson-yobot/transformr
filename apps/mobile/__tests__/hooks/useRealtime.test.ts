import { renderHook, act } from '@testing-library/react-native';

const mockOn = jest.fn().mockReturnThis();
const mockSubscribe = jest.fn().mockReturnThis();
const mockUnsubscribe = jest.fn();
const mockChannel = { on: mockOn, subscribe: mockSubscribe, unsubscribe: mockUnsubscribe };
const mockSupabaseChannel = jest.fn().mockReturnValue(mockChannel);
const mockRemoveChannel = jest.fn();

jest.mock('../../services/supabase', () => ({
  supabase: {
    channel: (...args: unknown[]) => mockSupabaseChannel(...args),
    removeChannel: (...args: unknown[]) => mockRemoveChannel(...args),
  },
}));

import { useRealtime } from '../../hooks/useRealtime';

describe('useRealtime', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOn.mockReturnValue(mockChannel);
    mockSubscribe.mockReturnValue(mockChannel);
    mockSupabaseChannel.mockReturnValue(mockChannel);
  });

  it('calls supabase.channel and subscribes on mount', () => {
    renderHook(() => useRealtime({ table: 'workouts' }));

    expect(mockSupabaseChannel).toHaveBeenCalledTimes(1);
    expect(mockOn).toHaveBeenCalledTimes(1);
    expect(mockSubscribe).toHaveBeenCalledTimes(1);
  });

  it('passes postgres_changes event to the .on() call', () => {
    renderHook(() =>
      useRealtime({ table: 'nutrition_logs', event: 'INSERT' }),
    );

    expect(mockOn).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({ table: 'nutrition_logs', event: 'INSERT' }),
      expect.any(Function),
    );
  });

  it('calls removeChannel on unmount', () => {
    const { unmount } = renderHook(() => useRealtime({ table: 'workouts' }));
    unmount();
    expect(mockRemoveChannel).toHaveBeenCalledWith(mockChannel);
  });

  it('does not subscribe when enabled=false', () => {
    renderHook(() => useRealtime({ table: 'workouts', enabled: false }));
    expect(mockSupabaseChannel).not.toHaveBeenCalled();
    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  it('calls onChange callback when payload fires with eventType INSERT', () => {
    const mockOnChange = jest.fn();
    renderHook(() =>
      useRealtime({ table: 'workouts', onChange: mockOnChange }),
    );

    // Extract the handler passed to .on()
    const handler = mockOn.mock.calls[0][2] as (payload: {
      eventType: string;
      new: Record<string, unknown>;
      old: Record<string, unknown>;
    }) => void;

    act(() => {
      handler({ eventType: 'INSERT', new: { id: '1' }, old: {} });
    });

    expect(mockOnChange).toHaveBeenCalledWith({ id: '1' });
  });

  it('calls onInsert when eventType is INSERT', () => {
    const mockOnInsert = jest.fn();
    renderHook(() =>
      useRealtime({ table: 'workouts', onInsert: mockOnInsert }),
    );

    const handler = mockOn.mock.calls[0][2] as (payload: {
      eventType: string;
      new: Record<string, unknown>;
      old: Record<string, unknown>;
    }) => void;

    act(() => {
      handler({ eventType: 'INSERT', new: { id: 'new-1' }, old: {} });
    });

    expect(mockOnInsert).toHaveBeenCalledWith({ id: 'new-1' });
  });

  it('calls onDelete with old payload when eventType is DELETE', () => {
    const mockOnDelete = jest.fn();
    renderHook(() =>
      useRealtime({ table: 'workouts', onDelete: mockOnDelete }),
    );

    const handler = mockOn.mock.calls[0][2] as (payload: {
      eventType: string;
      new: Record<string, unknown>;
      old: Record<string, unknown>;
    }) => void;

    act(() => {
      handler({ eventType: 'DELETE', new: {}, old: { id: 'old-1' } });
    });

    expect(mockOnDelete).toHaveBeenCalledWith({ id: 'old-1' });
  });

  it('includes filter in channel config when filter is provided', () => {
    renderHook(() =>
      useRealtime({ table: 'workouts', filter: 'user_id=eq.u-1' }),
    );

    expect(mockOn).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({ filter: 'user_id=eq.u-1' }),
      expect.any(Function),
    );
  });
});
