import { useState, useCallback } from 'react';
import { startRecording, stopRecording, isRecording as checkRecording, parseVoiceCommand } from '@services/voice';

export function useVoice() {
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [lastCommand, setLastCommand] = useState<ReturnType<typeof parseVoiceCommand> | null>(null);

  const startListening = useCallback(async () => {
    try {
      setRecording(true);
      await startRecording();
    } catch {
      setRecording(false);
    }
  }, []);

  const stopListening = useCallback(async () => {
    try {
      setRecording(false);
      setProcessing(true);
      const uri = await stopRecording();

      if (uri) {
        // In production, this would send audio to a speech-to-text service
        // For now, we simulate with a placeholder
        const command = parseVoiceCommand('');
        setLastCommand(command);
        return command;
      }
      return null;
    } catch {
      return null;
    } finally {
      setProcessing(false);
    }
  }, []);

  return {
    recording,
    processing,
    lastCommand,
    startListening,
    stopListening,
    isRecording: checkRecording,
  };
}
