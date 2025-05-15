import React from 'react';
import { TranscriptionMethod } from '../app/page';
import { useState, useEffect } from 'react';
import { summarizeWithGemini } from '../utils/transcription';
import SummaryDisplay from './SummaryDisplay';
import { exportSummaryToWord } from '../utils/exportWord';

interface TranscriptionDisplayProps {
  transcript: string;
  isLoading: boolean;
  transcriptionMethod: TranscriptionMethod;
  geminiApiKey: string;
}

export default function TranscriptionDisplay({
  transcript,
  isLoading,
  transcriptionMethod,
  geminiApiKey,
}: TranscriptionDisplayProps) {
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [showPromptInput, setShowPromptInput] = useState(false);
  const [customPrompt, setCustomPrompt] = useState<string>('');

  // Ladda prompt från localStorage vid mount
  useEffect(() => {
    const savedPrompt = localStorage.getItem('custom-summary-prompt');
    if (savedPrompt) setCustomPrompt(savedPrompt);
  }, []);

  // Spara prompt till localStorage när den ändras
  useEffect(() => {
    if (customPrompt) localStorage.setItem('custom-summary-prompt', customPrompt);
  }, [customPrompt]);

  const handleSummarize = async () => {
    if (!transcript || transcript.trim() === '') {
      alert('Det finns ingen text att sammanfatta.');
      return;
    }
    if (!geminiApiKey) {
      alert('Ingen giltig Gemini API-nyckel hittades. Vänligen ange en API-nyckel i inställningarna.');
      return;
    }
    try {
      setIsLoadingSummary(true);
      const summaryText = await summarizeWithGemini(
        transcript,
        geminiApiKey,
        customPrompt && customPrompt.trim().length > 0 ? customPrompt : undefined
      );
      setSummary(summaryText);
      setShowSummary(true);
      setShowPromptInput(false);
    } catch (error) {
      console.error('Fel vid sammanfattning:', error);
      alert('Något gick fel vid skapandet av sammanfattningen. Kontrollera att din Gemini API-nyckel är giltig och att du har internetanslutning.');
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const handleExportWord = () => {
    if (summary) {
      exportSummaryToWord(summary);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full p-6 bg-white rounded-lg shadow-md">
        <div className="flex items-center space-x-3">
          <div className="w-4 h-4 bg-blue-600 rounded-full animate-pulse"></div>
          <p className="text-lg font-medium text-gray-700">Transkriberar...</p>
        </div>
        <div className="mt-4 space-y-2">
          {[...Array(5)].map((_, i) => (
            <div 
              key={i} 
              className="h-4 bg-gray-200 rounded animate-pulse" 
              style={{ width: `${Math.random() * 50 + 50}%` }}
            ></div>
          ))}
        </div>
      </div>
    );
  }

  if (!transcript) {
    return (
      <div className="w-full p-6 bg-white rounded-lg shadow-md">
        <p className="text-gray-500 text-center">
          Din transkribering kommer att visas här när den är klar.
        </p>
      </div>
    );
  }

  const getMethodName = (): string => {
    switch (transcriptionMethod) {
      case 'local':
        return 'Web Speech API (lokalt)';
      case 'openai':
        return 'OpenAI';
      case 'gemini':
        return 'Google Gemini';
      default:
        return 'okänd metod';
    }
  };

  return (
    <div className="w-full p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Transkribering</h2>
        <div className="text-sm text-gray-500">
          Transkriberat med {getMethodName()}
        </div>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
        {transcript}
      </div>
      <div className="mt-4 flex justify-end space-x-2">
        <button
          onClick={() => {
            navigator.clipboard.writeText(transcript);
          }}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
        >
          Kopiera text
        </button>
        <a
          href={`data:text/plain;charset=utf-8,${encodeURIComponent(transcript)}`}
          download={`transkribering-${new Date().toISOString().slice(0, 10)}.txt`}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          Ladda ner som textfil
        </a>
        {geminiApiKey && (
          <button
            onClick={() => setShowPromptInput((v) => !v)}
            disabled={isLoadingSummary}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50"
            title="Skapa en sammanfattning av transkriberingen med hjälp av AI och visa den nedanför."
          >
            {isLoadingSummary
              ? 'Sammanfattar...'
              : 'Sammanfatta med Gemini'}
          </button>
        )}
      </div>
      {showPromptInput && (
        <div className="mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-600 rounded">
          <label htmlFor="customPrompt" className="block text-sm font-semibold text-gray-900 mb-2">
            Egen prompt för sammanfattning (valfritt)
          </label>
          <textarea
            id="customPrompt"
            value={customPrompt}
            onChange={e => setCustomPrompt(e.target.value)}
            rows={5}
            className="w-full p-2 border border-gray-400 rounded-md text-gray-900 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-600"
            placeholder="Skriv din egen instruktion till AI:n här..."
            style={{ minHeight: 80 }}
          />
          <div className="flex justify-end mt-2 gap-2">
            <button
              onClick={() => setShowPromptInput(false)}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              Avbryt
            </button>
            <button
              onClick={handleSummarize}
              disabled={isLoadingSummary}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              Skapa sammanfattning
            </button>
          </div>
        </div>
      )}
      {showSummary && summary && (
        <SummaryDisplay summary={summary} onExportWord={handleExportWord} />
      )}
    </div>
  );
} 