'use client';

import { useState, useEffect } from 'react';
import { useRecording } from '../hooks/useRecording';
import { useEnv } from '../hooks/useEnv';
import RecordingButton from '../components/RecordingButton';
import TranscriptionDisplay from '../components/TranscriptionDisplay';
import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';
import { transcribeWithOpenAI, transcribeLocally, isSpeechRecognitionSupported, transcribeWithGemini } from '../utils/transcription';
import { createDownloadLink } from '../utils/recording';

// Transkriberings-metoder
export type TranscriptionMethod = 'local' | 'openai' | 'gemini';

export default function Home() {
  // Använd useEnv-hooken för att hämta miljövariabler
  const { env, loading: envLoading } = useEnv();
  
  const [apiKey, setApiKey] = useState<string>('');
  const [geminiApiKey, setGeminiApiKey] = useState<string>('');
  const [transcript, setTranscript] = useState<string>('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionProgress, setTranscriptionProgress] = useState<number>(0);
  const [transcriptionMethod, setTranscriptionMethod] = useState<TranscriptionMethod>('local');
  const [webSpeechSupported, setWebSpeechSupported] = useState<boolean>(true);

  // Initialisera API-nycklar och inställningar från miljövariabler
  useEffect(() => {
    if (!envLoading && env) {
      if (env.NEXT_PUBLIC_OPENAI_API_KEY) {
        setApiKey(env.NEXT_PUBLIC_OPENAI_API_KEY);
      }
      
      if (env.NEXT_PUBLIC_GEMINI_API_KEY) {
        setGeminiApiKey(env.NEXT_PUBLIC_GEMINI_API_KEY);
      }
      
      if (env.NEXT_PUBLIC_DEFAULT_TRANSCRIPTION_METHOD as TranscriptionMethod) {
        setTranscriptionMethod(env.NEXT_PUBLIC_DEFAULT_TRANSCRIPTION_METHOD as TranscriptionMethod);
      }
    }
  }, [env, envLoading]);

  // Kontrollera om Web Speech API stöds
  useEffect(() => {
    const isSupported = isSpeechRecognitionSupported();
    setWebSpeechSupported(isSupported);
    
    // Om Web Speech API inte stöds, försök automatiskt att använda Gemini istället
    if (!isSupported && transcriptionMethod === 'local') {
      setTranscriptionMethod('gemini');
    }
  }, [transcriptionMethod]);

  // Hämta API-nyckel och inställningar från localStorage vid sidladdning
  useEffect(() => {
    // Använd miljövariabel för API-nycklar om den finns, annars localStorage
    const hasEnvOpenAI = env && env.NEXT_PUBLIC_OPENAI_API_KEY;
    const hasEnvGemini = env && env.NEXT_PUBLIC_GEMINI_API_KEY;
    const hasEnvMethod = env && env.NEXT_PUBLIC_DEFAULT_TRANSCRIPTION_METHOD;
    
    if (!hasEnvOpenAI) {
      const savedOpenAIApiKey = localStorage.getItem('openai-api-key');
      if (savedOpenAIApiKey) {
        setApiKey(savedOpenAIApiKey);
      }
    }
    
    if (!hasEnvGemini) {
      const savedGeminiApiKey = localStorage.getItem('gemini-api-key');
      if (savedGeminiApiKey) {
        setGeminiApiKey(savedGeminiApiKey);
      }
    }
    
    // Använd miljövariabel för transkriberings-metod om den finns, annars localStorage
    if (!hasEnvMethod) {
      const savedMethod = localStorage.getItem('transcription-method');
      if (savedMethod) {
        const method = savedMethod as TranscriptionMethod;
        
        // Om Web Speech API inte stöds, använd inte lokal transkribering
        if (!webSpeechSupported && method === 'local') {
          setTranscriptionMethod('gemini');
        } else {
          setTranscriptionMethod(method);
        }
      }
    }
  }, [env, webSpeechSupported]);

  // Spara API-nycklar till localStorage när de ändras, men bara om de inte kommer från miljövariabler
  const handleApiKeyChange = (newApiKey: string) => {
    setApiKey(newApiKey);
    const hasEnvOpenAI = env && env.NEXT_PUBLIC_OPENAI_API_KEY;
    if (!hasEnvOpenAI) {
      localStorage.setItem('openai-api-key', newApiKey);
    }
  };
  
  const handleGeminiApiKeyChange = (newApiKey: string) => {
    setGeminiApiKey(newApiKey);
    const hasEnvGemini = env && env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!hasEnvGemini) {
      localStorage.setItem('gemini-api-key', newApiKey);
    }
  };
  
  // Ändra transkriberings-metod
  const handleTranscriptionMethodChange = (method: TranscriptionMethod) => {
    // Om Web Speech API inte stöds, förhindra att användaren väljer lokal transkribering
    if (!webSpeechSupported && method === 'local') {
      alert('Din webbläsare stöder inte Web Speech API. Använd en modern webbläsare som Chrome eller Edge, eller använd Google Gemini eller OpenAI API istället.');
      return;
    }
    
    setTranscriptionMethod(method);
    const hasEnvMethod = env && env.NEXT_PUBLIC_DEFAULT_TRANSCRIPTION_METHOD;
    if (!hasEnvMethod) {
      localStorage.setItem('transcription-method', method);
    }
  };

  const { 
    isRecording, 
    startRecording, 
    stopRecording, 
    audioBlob, 
    error,
    duration 
  } = useRecording({
    onRecordingComplete: async (blob) => {
      // Automatiskt starta transkribering när inspelningen är klar
      if (blob) {
        if (transcriptionMethod === 'local' && webSpeechSupported) {
          await handleLocalTranscribe(blob);
        } else if (transcriptionMethod === 'openai' && apiKey) {
          await handleOpenAITranscribe(blob);
        } else if (transcriptionMethod === 'gemini' && geminiApiKey) {
          await handleGeminiTranscribe(blob);
        } else if (!webSpeechSupported && !geminiApiKey && !apiKey) {
          alert('Du har inte angett någon API-nyckel för Gemini eller OpenAI. Ladda ner inspelningen och använd ett externt verktyg för att transkribera den.');
        }
      }
    }
  });

  const handleOpenAITranscribe = async (blob: Blob) => {
    if (!apiKey) {
      alert('Du behöver ange en OpenAI API-nyckel i inställningarna först.');
      return;
    }

    setIsTranscribing(true);
    setTranscriptionProgress(0);
    try {
      setTranscriptionProgress(50); // Simulera förlopp (kan inte hämta faktiskt förlopp från OpenAI API)
      const result = await transcribeWithOpenAI(blob, apiKey);
      setTranscript(result.text);
      setTranscriptionProgress(100);
    } catch (error) {
      console.error('Fel vid transkribering med OpenAI:', error);
      alert('Något gick fel vid transkriberingen med OpenAI. Vänligen försök igen eller ladda ner inspelningen och använd ett externt verktyg.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleGeminiTranscribe = async (blob: Blob) => {
    if (!geminiApiKey) {
      alert('Du behöver ange en Gemini API-nyckel i inställningarna först.');
      return;
    }

    setIsTranscribing(true);
    setTranscriptionProgress(0);
    try {
      setTranscriptionProgress(50); // Simulera förlopp (kan inte hämta faktiskt förlopp från Gemini API)
      const result = await transcribeWithGemini(blob, geminiApiKey);
      setTranscript(result.text);
      setTranscriptionProgress(100);
    } catch (error) {
      console.error('Fel vid transkribering med Gemini:', error);
      alert('Något gick fel vid transkriberingen med Gemini. Vänligen försök igen eller ladda ner inspelningen och använd ett externt verktyg.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleLocalTranscribe = async (blob: Blob) => {
    if (!webSpeechSupported) {
      alert('Din webbläsare stöder inte Web Speech API. Använd en modern webbläsare som Chrome eller Edge, eller använd Gemini eller OpenAI API istället.');
      return;
    }

    setIsTranscribing(true);
    setTranscriptionProgress(0);
    
    try {
      // Simulera framstegsindikatorer för bättre användargränssnitt
      const progressInterval = setInterval(() => {
        setTranscriptionProgress(prev => {
          const newProgress = prev + 5;
          return newProgress >= 90 ? 90 : newProgress;
        });
      }, 1000);

      // När vi startar transkriberingen, visa att ljudet spelas upp
      setTranscript("Ljudet spelas upp för transkribering...");

      const result = await transcribeLocally(blob);
      clearInterval(progressInterval);
      setTranscriptionProgress(100);
      setTranscript(result.text);
    } catch (error) {
      console.error('Fel vid lokal transkribering:', error);
      alert('Något gick fel vid den lokala transkriberingen. Prova att ladda ner inspelningen och använd ett externt verktyg som Microsoft Word eller Google Docs.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleDownload = () => {
    if (audioBlob) {
      const dateStr = new Date().toISOString().slice(0, 10);
      createDownloadLink(audioBlob, `mote-inspelning-${dateStr}.wav`);
    }
  };

  // Bestäm vilken transkriberings-metod som ska användas
  const getActiveTranscriptionMethod = (): TranscriptionMethod => {
    if (transcriptionMethod === 'local' && webSpeechSupported) {
      return 'local';
    } else if (transcriptionMethod === 'openai' && apiKey) {
      return 'openai';
    } else if (transcriptionMethod === 'gemini' && geminiApiKey) {
      return 'gemini';
    } else if (geminiApiKey) {
      return 'gemini';
    } else if (apiKey) {
      return 'openai';
    } else if (webSpeechSupported) {
      return 'local';
    } else {
      return 'gemini'; // Standard om inget annat fungerar (användaren måste ange API-nyckel)
    }
  };

  const activeMethod = getActiveTranscriptionMethod();
  const canTranscribe = (activeMethod === 'local' && webSpeechSupported) || 
                        (activeMethod === 'openai' && apiKey) || 
                        (activeMethod === 'gemini' && geminiApiKey);

  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        openAIApiKey={apiKey} 
        geminiApiKey={geminiApiKey}
        onOpenAIApiKeyChange={handleApiKeyChange} 
        onGeminiApiKeyChange={handleGeminiApiKeyChange}
        transcriptionMethod={transcriptionMethod}
        onTranscriptionMethodChange={handleTranscriptionMethodChange}
        webSpeechSupported={webSpeechSupported}
      />
      
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-8">
        <section className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Spela in möte</h2>
          
          {!webSpeechSupported && transcriptionMethod === 'local' && (
            <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700">
              <p className="text-sm">
                Din webbläsare stöder inte lokal transkribering med Web Speech API. 
                Använd Gemini eller OpenAI API, eller ladda ner inspelningen för att transkribera manuellt.
              </p>
            </div>
          )}
          
          <div className="flex flex-col items-center gap-4">
            <RecordingButton 
              isRecording={isRecording}
              duration={duration}
              onStartRecording={startRecording}
              onStopRecording={stopRecording}
            />
            
            {error && (
              <div className="mt-2 text-sm text-red-600">
                Det gick inte att starta inspelningen: {error.message}
              </div>
            )}
            
            {audioBlob && !isRecording && (
              <div className="mt-4 flex flex-wrap gap-4 justify-center">
                <button 
                  onClick={handleDownload}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Ladda ner inspelning
                </button>
                
                {!isTranscribing && (
                  <button 
                    onClick={() => {
                      if (activeMethod === 'local') {
                        handleLocalTranscribe(audioBlob);
                      } else if (activeMethod === 'openai') {
                        handleOpenAITranscribe(audioBlob);
                      } else if (activeMethod === 'gemini') {
                        handleGeminiTranscribe(audioBlob);
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    disabled={!canTranscribe}
                  >
                    Transkribera med {
                      activeMethod === 'local' ? 'Web Speech' : 
                      activeMethod === 'openai' ? 'OpenAI' : 
                      'Gemini'
                    }
                  </button>
                )}
              </div>
            )}
            
            {isTranscribing && (
              <div className="mt-4">
                <LoadingSpinner 
                  message={`Transkriberar med ${
                    activeMethod === 'local' ? 'Web Speech' : 
                    activeMethod === 'openai' ? 'OpenAI' : 
                    'Gemini'
                  }...`} 
                  progress={transcriptionProgress} 
                />
              </div>
            )}
          </div>
        </section>
        
        <section className="flex-1">
          <TranscriptionDisplay 
            transcript={transcript} 
            isLoading={isTranscribing} 
            transcriptionMethod={activeMethod}
            geminiApiKey={geminiApiKey}
          />
        </section>
      </main>
      
      <footer className="py-4 bg-white border-t text-center text-gray-500 text-sm">
        <p>© {new Date().getFullYear()} Mötestranskribering</p>
      </footer>
    </div>
  );
}
