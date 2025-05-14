import { useState, useEffect } from 'react';

interface EnvVars {
  NEXT_PUBLIC_GEMINI_API_KEY?: string;
  NEXT_PUBLIC_OPENAI_API_KEY?: string;
  NEXT_PUBLIC_DEFAULT_TRANSCRIPTION_METHOD?: string;
}

export function useEnv() {
  const [env, setEnv] = useState<EnvVars>({
    NEXT_PUBLIC_GEMINI_API_KEY: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
    NEXT_PUBLIC_OPENAI_API_KEY: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    NEXT_PUBLIC_DEFAULT_TRANSCRIPTION_METHOD: process.env.NEXT_PUBLIC_DEFAULT_TRANSCRIPTION_METHOD
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Försök bara hämta miljövariabler om vi inte redan har dem från processen
    const hasEnvVars = Boolean(
      process.env.NEXT_PUBLIC_GEMINI_API_KEY || 
      process.env.NEXT_PUBLIC_OPENAI_API_KEY || 
      process.env.NEXT_PUBLIC_DEFAULT_TRANSCRIPTION_METHOD
    );

    if (!hasEnvVars) {
      fetch('/api/env')
        .then(response => {
          if (!response.ok) {
            throw new Error('Kunde inte hämta miljövariabler');
          }
          return response.json();
        })
        .then(data => {
          setEnv(data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Fel vid hämtning av miljövariabler:', err);
          setError(err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  return { env, loading, error };
} 