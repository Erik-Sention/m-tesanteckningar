import Settings from './Settings';
import { TranscriptionMethod } from '../app/page';

interface HeaderProps {
  openAIApiKey: string;
  geminiApiKey: string;
  onOpenAIApiKeyChange: (apiKey: string) => void;
  onGeminiApiKeyChange: (apiKey: string) => void;
  transcriptionMethod: TranscriptionMethod;
  onTranscriptionMethodChange: (method: TranscriptionMethod) => void;
  webSpeechSupported: boolean;
}

export default function Header({ 
  openAIApiKey, 
  geminiApiKey,
  onOpenAIApiKeyChange, 
  onGeminiApiKeyChange,
  transcriptionMethod, 
  onTranscriptionMethodChange,
  webSpeechSupported
}: HeaderProps) {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-8 w-8 text-blue-600" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" 
            />
          </svg>
          <h1 className="ml-2 text-2xl font-bold text-gray-900">Mötestranskribering</h1>
        </div>
        <div>
          <Settings 
            openAIApiKey={openAIApiKey} 
            geminiApiKey={geminiApiKey}
            onOpenAIApiKeyChange={onOpenAIApiKeyChange} 
            onGeminiApiKeyChange={onGeminiApiKeyChange}
            transcriptionMethod={transcriptionMethod}
            onTranscriptionMethodChange={onTranscriptionMethodChange}
            webSpeechSupported={webSpeechSupported}
          />
        </div>
      </div>
    </header>
  );
} 