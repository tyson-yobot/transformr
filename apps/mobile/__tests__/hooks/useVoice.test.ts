import { renderHook, act } from '@testing-library/react-native';

const mockStartRecording = jest.fn().mockResolvedValue(undefined);
const mockStopRecording = jest.fn().mockResolvedValue('audio-path');
const mockParseVoiceCommand = jest.fn().mockReturnValue({ type: 'log_workout', params: {} });
const mockIsRecording = jest.fn().mockReturnValue(false);

jest.mock('../../services/voice', () => ({
  startRecording: (...args: unknown[]) => mockStartRecording(...args),
  stopRecording: (...args: unknown[]) => mockStopRecording(...args),
  isRecording: (...args: unknown[]) => mockIsRecording(...args),
  parseVoiceCommand: (...args: unknown[]) => mockParseVoiceCommand(...args),
}));

import { useVoice } from '../../hooks/useVoice';

describe('useVoice', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStartRecording.mockResolvedValue(undefined);
    mockStopRecording.mockResolvedValue('audio-path');
    mockParseVoiceCommand.mockReturnValue({ type: 'log_workout', params: {} });
    mockIsRecording.mockReturnValue(false);
  });

  it('has initial state: recording=false, processing=false, lastCommand=null', () => {
    const { result } = renderHook(() => useVoice());
    expect(result.current.recording).toBe(false);
    expect(result.current.processing).toBe(false);
    expect(result.current.lastCommand).toBeNull();
  });

  it('exposes startListening, stopListening, and isRecording', () => {
    const { result } = renderHook(() => useVoice());
    expect(typeof result.current.startListening).toBe('function');
    expect(typeof result.current.stopListening).toBe('function');
    expect(typeof result.current.isRecording).toBe('function');
  });

  it('startListening sets recording to true and calls startRecording', async () => {
    const { result } = renderHook(() => useVoice());

    await act(async () => {
      await result.current.startListening();
    });

    expect(result.current.recording).toBe(true);
    expect(mockStartRecording).toHaveBeenCalledTimes(1);
  });

  it('stopListening sets recording to false', async () => {
    const { result } = renderHook(() => useVoice());

    await act(async () => {
      await result.current.startListening();
    });

    await act(async () => {
      await result.current.stopListening();
    });

    expect(result.current.recording).toBe(false);
  });

  it('stopListening sets lastCommand from parseVoiceCommand', async () => {
    const fakeCommand = { type: 'log_workout', params: { exercise: 'bench' } };
    mockParseVoiceCommand.mockReturnValue(fakeCommand);

    const { result } = renderHook(() => useVoice());

    await act(async () => {
      await result.current.startListening();
    });

    await act(async () => {
      await result.current.stopListening();
    });

    expect(result.current.lastCommand).toEqual(fakeCommand);
  });

  it('stopListening leaves lastCommand null when stopRecording returns null uri', async () => {
    mockStopRecording.mockResolvedValue(null);
    const { result } = renderHook(() => useVoice());

    await act(async () => {
      await result.current.startListening();
    });

    await act(async () => {
      await result.current.stopListening();
    });

    expect(result.current.lastCommand).toBeNull();
    expect(mockParseVoiceCommand).not.toHaveBeenCalled();
  });

  it('startListening resets recording to false on error', async () => {
    mockStartRecording.mockRejectedValue(new Error('mic unavailable'));
    const { result } = renderHook(() => useVoice());

    await act(async () => {
      await result.current.startListening();
    });

    expect(result.current.recording).toBe(false);
  });
});
