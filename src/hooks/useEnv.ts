import { useState, useEffect, useRef } from 'react';

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
  const initializedRef = useRef(false);

  useEffect(() => {
    // Förhindra att effekten körs flera gånger
    if (initializedRef.current) return;
    initializedRef.current = true;
    
    console.log("useEnv initialiseras");
    console.log("Process.env variabler:");
    
    // Manuellt extrahera och trimma värden från process.env
    const openAIKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY?.trim();
    const geminiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY?.trim();
    const defaultMethod = process.env.NEXT_PUBLIC_DEFAULT_TRANSCRIPTION_METHOD?.trim();
    
    // Kontrollera värden från process.env direkt
    if (openAIKey) {
      console.log(`- NEXT_PUBLIC_OPENAI_API_KEY från process.env finns: ${openAIKey.substring(0, 10)}...`);
      console.log(`- Längd på OpenAI-nyckel: ${openAIKey.length}`);
      console.log(`- Format korrekt: ${openAIKey.startsWith('sk-') || openAIKey.startsWith('sk-proj-')}`);
    } else {
      console.log("- NEXT_PUBLIC_OPENAI_API_KEY saknas i process.env");
    }
    
    if (geminiKey) {
      console.log(`- NEXT_PUBLIC_GEMINI_API_KEY från process.env finns: ${geminiKey.substring(0, 10)}...`);
    } else {
      console.log("- NEXT_PUBLIC_GEMINI_API_KEY saknas i process.env");
    }
    
    // Uppdatera state med de manuellt extraherade värdena
    const directEnvVars: EnvVars = {};
    if (openAIKey) directEnvVars.NEXT_PUBLIC_OPENAI_API_KEY = openAIKey;
    if (geminiKey) directEnvVars.NEXT_PUBLIC_GEMINI_API_KEY = geminiKey;
    if (defaultMethod) directEnvVars.NEXT_PUBLIC_DEFAULT_TRANSCRIPTION_METHOD = defaultMethod;
    
    // Försök bara hämta miljövariabler om vi inte redan har dem från processen
    const hasEnvVars = Boolean(openAIKey || geminiKey || defaultMethod);

    console.log(`Har miljövariabler i process.env: ${hasEnvVars}`);

    if (!hasEnvVars) {
      console.log("Hämtar miljövariabler från API...");
      fetch('/api/env')
        .then(response => {
          if (!response.ok) {
            throw new Error('Kunde inte hämta miljövariabler');
          }
          console.log("Fick svar från API/env");
          return response.json();
        })
        .then(data => {
          console.log("API/env data:");
          
          // Trimma värden från API:et också
          const trimmedData: EnvVars = {};
          if (data.NEXT_PUBLIC_OPENAI_API_KEY) {
            trimmedData.NEXT_PUBLIC_OPENAI_API_KEY = data.NEXT_PUBLIC_OPENAI_API_KEY.trim();
          }
          if (data.NEXT_PUBLIC_GEMINI_API_KEY) {
            trimmedData.NEXT_PUBLIC_GEMINI_API_KEY = data.NEXT_PUBLIC_GEMINI_API_KEY.trim();
          }
          if (data.NEXT_PUBLIC_DEFAULT_TRANSCRIPTION_METHOD) {
            trimmedData.NEXT_PUBLIC_DEFAULT_TRANSCRIPTION_METHOD = data.NEXT_PUBLIC_DEFAULT_TRANSCRIPTION_METHOD.trim();
          }
          
          console.log(`- NEXT_PUBLIC_OPENAI_API_KEY: ${trimmedData.NEXT_PUBLIC_OPENAI_API_KEY ? 'finns' : 'saknas'}`);
          console.log(`- NEXT_PUBLIC_GEMINI_API_KEY: ${trimmedData.NEXT_PUBLIC_GEMINI_API_KEY ? 'finns' : 'saknas'}`);
          
          if (trimmedData.NEXT_PUBLIC_OPENAI_API_KEY) {
            console.log(`- NEXT_PUBLIC_OPENAI_API_KEY börjar med: ${trimmedData.NEXT_PUBLIC_OPENAI_API_KEY.substring(0, 10)}...`);
          }
          
          setEnv(trimmedData);
          setLoading(false);
        })
        .catch(err => {
          console.error('Fel vid hämtning av miljövariabler:', err);
          setError(err);
          setLoading(false);
        });
    } else {
      // Använd de tidigare extraherade värdena
      console.log("Använder värden från process.env");
      setEnv(directEnvVars);
      setLoading(false);
    }
  }, []); // Tom dependency array för att köra endast vid första renderingen

  return { env, loading, error };
} 