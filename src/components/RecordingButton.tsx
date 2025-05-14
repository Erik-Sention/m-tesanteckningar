import { useEffect, useState } from 'react';
import { formatDuration } from '../utils/recording';

interface RecordingButtonProps {
  isRecording: boolean;
  duration: number;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

export default function RecordingButton({
  isRecording,
  duration,
  onStartRecording,
  onStopRecording
}: RecordingButtonProps) {
  const [formattedDuration, setFormattedDuration] = useState('0:00');

  useEffect(() => {
    setFormattedDuration(formatDuration(duration));
  }, [duration]);

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={isRecording ? onStopRecording : onStartRecording}
        className={`${
          isRecording
            ? 'bg-red-600 hover:bg-red-700'
            : 'bg-blue-600 hover:bg-blue-700'
        } text-white font-medium rounded-full p-4 w-16 h-16 flex items-center justify-center transition-all`}
        aria-label={isRecording ? 'Stoppa inspelning' : 'Starta inspelning'}
      >
        {isRecording ? (
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-8 w-8" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <rect x="6" y="6" width="12" height="12" fill="currentColor" />
          </svg>
        ) : (
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-8 w-8" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <circle cx="12" cy="12" r="6" fill="currentColor" />
          </svg>
        )}
      </button>
      {isRecording && (
        <div className="flex items-center gap-2">
          <span className="animate-pulse h-2 w-2 bg-red-600 rounded-full"></span>
          <span className="text-sm font-medium">{formattedDuration}</span>
        </div>
      )}
    </div>
  );
} 