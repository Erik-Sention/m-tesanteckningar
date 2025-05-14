export interface Recording {
  id: string;
  name: string;
  date: string;
  duration: number;
  transcript?: string;
  audioUrl?: string;
}

export interface TranscriptionResult {
  text: string;
  confidence?: number;
} 