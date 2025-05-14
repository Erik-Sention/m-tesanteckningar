import { useState, useEffect, useRef, useCallback } from 'react';

interface UseRecordingProps {
  onRecordingComplete?: (blob: Blob, duration: number) => void;
}

interface UseRecordingReturn {
  isRecording: boolean;
  duration: number;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  audioBlob: Blob | null;
  error: Error | null;
}

export function useRecording({ onRecordingComplete }: UseRecordingProps = {}): UseRecordingReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  // Rensa timer när komponenten unmountas
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, []);

  const startRecording = useCallback(async () => {
    try {
      audioChunksRef.current = [];
      setError(null);
      setDuration(0);
      setAudioBlob(null);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(blob);
        
        if (onRecordingComplete) {
          onRecordingComplete(blob, duration);
        }
        
        // Stoppa alla spår i strömmen
        stream.getTracks().forEach(track => track.stop());
      };

      // Starta inspelning
      mediaRecorder.start(1000); // Samla data varje sekund
      setIsRecording(true);

      // Starta timer för att hålla koll på inspelningstid
      timerRef.current = window.setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Okänt fel vid start av inspelning'));
      console.error('Fel vid start av inspelning:', err);
    }
  }, [duration, onRecordingComplete]);

  const stopRecording = useCallback(() => {
    if (!mediaRecorderRef.current) return;

    // Stoppa inspelning
    if (mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    // Stoppa timer
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setIsRecording(false);
  }, []);

  return {
    isRecording,
    duration,
    startRecording,
    stopRecording,
    audioBlob,
    error
  };
} 