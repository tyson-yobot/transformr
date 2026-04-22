import { useState, useCallback } from 'react';
import {
  startRecording,
  stopRecording,
  isRecording as checkRecording,
  parseVoiceCommand,
  parseVoiceCommandAI,
  transcribeAudio,
} from '@services/voice';
import type { ParsedVoiceCommand, VoiceContext } from '@services/voice';

export function useVoice(context?: VoiceContext) {
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [lastCommand, setLastCommand] = useState<ParsedVoiceCommand | null>(null);
  const [lastTranscript, setLastTranscript] = useState<string | null>(null);

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
        // Transcribe the recorded audio to text via the cloud edge function
        const transcript = await transcribeAudio(uri);
        setLastTranscript(transcript);

        if (!transcript) {
          setLastCommand(null);
          return null;
        }

        // Parse the transcript: first try fast local regex, then fall back to AI NLU
        let command: ParsedVoiceCommand;
        if (context) {
          command = await parseVoiceCommandAI(transcript, context);
        } else {
          command = parseVoiceCommand(transcript);
        }

        setLastCommand(command);
        return command;
      }
      return null;
    } catch {
      return null;
    } finally {
      setProcessing(false);
    }
  }, [context]);

  return {
    recording,
    processing,
    lastCommand,
    lastTranscript,
    startListening,
    stopListening,
    isRecording: checkRecording,
  };
}
