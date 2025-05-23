import { useState, useEffect } from 'react';
import { TranscriptionMethod } from '../app/page';
import { useEnv } from '../hooks/useEnv';

interface SettingsProps {
  geminiApiKey: string;
  onGeminiApiKeyChange: (apiKey: string) => void;
  transcriptionMethod: TranscriptionMethod;
  onTranscriptionMethodChange: (method: TranscriptionMethod) => void;
  webSpeechSupported: boolean;
}

export default function Settings({ 
  geminiApiKey,
  onGeminiApiKeyChange,
  transcriptionMethod, 
  onTranscriptionMethodChange,
  webSpeechSupported
}: SettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localGeminiKey, setLocalGeminiKey] = useState(geminiApiKey || '');
  const [localTranscriptionMethod, setLocalTranscriptionMethod] = useState(transcriptionMethod);
  
  const { env } = useEnv();
  
  const isGeminiFromEnv = Boolean(env?.NEXT_PUBLIC_GEMINI_API_KEY) || (geminiApiKey && geminiApiKey.startsWith('AIza'));

  useEffect(() => {
    setLocalGeminiKey(geminiApiKey || '');
  }, [geminiApiKey]);

  const handleSave = () => {
    if (!isGeminiFromEnv) {
      onGeminiApiKeyChange(localGeminiKey);
    }
    
    if (!webSpeechSupported && localTranscriptionMethod === 'local') {
      alert('Din webbläsare stöder inte Web Speech API. Du kan inte använda lokal transkribering.');
      setLocalTranscriptionMethod('gemini');
      onTranscriptionMethodChange('gemini');
    } else {
      onTranscriptionMethodChange(localTranscriptionMethod);
    }
    
    setIsOpen(false);
  };

  return (
    <div>
      <button
        onClick={() => setIsOpen(true)}
        className="text-gray-600 hover:text-gray-800 p-2 rounded-full"
        aria-label="Inställningar"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </button>

      {isOpen && (
          <div className="fixed inset-0 bg-[rgba(0,0,50,0.3)] flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Inställningar</h2>
            
            <div className="mb-4">
              <div className="flex flex-col gap-2">
                {geminiApiKey && (
                  <div className="p-3 bg-green-50 border-l-4 border-green-400 text-green-700 text-sm">
                    <div className="font-semibold">Google Gemini API</div>
                    <div>{isGeminiFromEnv ? 'Förkonfigurerad och redo att användas' : 'Konfigurerad manuellt'}</div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transkriberings-metod
              </label>
              
              <div className="space-y-3">
                <label className={`flex items-center space-x-3 cursor-pointer ${!webSpeechSupported ? 'opacity-50' : ''}`}>
                  <input
                    type="radio"
                    checked={localTranscriptionMethod === 'local'}
                    onChange={() => setLocalTranscriptionMethod('local')}
                    className="form-radio h-5 w-5 text-blue-600"
                    disabled={!webSpeechSupported}
                  />
                  <span className="text-gray-700 text-sm font-medium">Använd lokal transkribering (Web Speech API)</span>
                </label>
                {!webSpeechSupported && (
                  <div className="ml-8 p-2 bg-yellow-50 border-l-2 border-yellow-400 text-yellow-700 text-xs">
                    Din webbläsare stöder inte Web Speech API.
                  </div>
                )}
                
                <label className={`flex items-center space-x-3 cursor-pointer ${!geminiApiKey ? 'opacity-50' : ''}`}>
                  <input
                    type="radio"
                    checked={localTranscriptionMethod === 'gemini'}
                    onChange={() => setLocalTranscriptionMethod('gemini')}
                    className="form-radio h-5 w-5 text-blue-600"
                    disabled={!geminiApiKey}
                  />
                  <span className="text-gray-700 text-sm font-medium">Använd Google Gemini API</span>
                </label>
              </div>
              
              <p className="mt-2 text-sm text-gray-500">
                Välj vilken metod som ska användas för att transkribera inspelningar.
              </p>
            </div>
            
            {!isGeminiFromEnv && (
              <div className={`mb-4 ${localTranscriptionMethod !== 'gemini' ? 'opacity-50' : ''}`}>
                <label htmlFor="geminiKey" className="block text-sm font-medium text-gray-700 mb-1">
                  Google Gemini API-nyckel 
                  {localTranscriptionMethod !== 'gemini' && ' (inte nödvändig med vald metod)'}
                </label>
                <input
                  type="password"
                  id="geminiKey"
                  value={localGeminiKey}
                  onChange={(e) => setLocalGeminiKey(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="AIza..."
                  disabled={localTranscriptionMethod !== 'gemini'}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Du behöver en API-nyckel för att använda Google Gemini. Du kan få en egen nyckel gratis på <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google AI Studio</a>.
                </p>
              </div>
            )}
            
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100"
              >
                Avbryt
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Spara
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 