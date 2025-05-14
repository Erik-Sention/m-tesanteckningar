import { TranscriptionResult } from '../types';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Funktion för att transkribera med OpenAI API
export async function transcribeWithOpenAI(
  audioBlob: Blob, 
  apiKey: string
): Promise<TranscriptionResult> {
  try {
    const openai = new OpenAI({ apiKey });
    
    const response = await openai.audio.transcriptions.create({
      file: await toFile(audioBlob, 'recording.wav'),
      model: 'whisper-1',
      language: 'sv'
    });
    
    return {
      text: response.text
    };
  } catch (error) {
    console.error('Fel vid transkribering med OpenAI:', error);
    throw error;
  }
}

// Funktion för att transkribera med Google Gemini API
export async function transcribeWithGemini(
  audioBlob: Blob,
  apiKey: string
): Promise<TranscriptionResult> {
  try {
    // Konvertera ljudet till en base64-sträng
    const base64Audio = await blobToBase64(audioBlob);
    
    // Skapa en Google Gemini-klient
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Konfigurera förfrågan
    const prompt = "Transkribera den här ljudfilen så noggrant som möjligt till text. Svara ENDAST med transkriberingen, utan några extra förklaringar eller text. Språket är svenska.";
    
    // Skapa bild-delen (vi behandlar ljudet som en bild för Gemini API)
    const imageParts = [{
      inlineData: {
        data: base64Audio.split(',')[1], // Ta bort data:audio/wav;base64, från början
        mimeType: audioBlob.type
      }
    }];
    
    // Skicka förfrågan till Gemini
    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();
    
    return {
      text: text
    };
  } catch (error) {
    console.error('Fel vid transkribering med Gemini:', error);
    throw error;
  }
}

// Hjälpfunktion för att konvertera blob till File-objekt för OpenAI API
async function toFile(blob: Blob, filename: string): Promise<File> {
  return new File([blob], filename, { type: blob.type });
}

// Hjälpfunktion för att konvertera Blob till base64
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Kontrollera om Web Speech API stöds i webbläsaren
export function isSpeechRecognitionSupported(): boolean {
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
}

// Ny funktion för att transkribera lokalt med Web Speech API
export async function transcribeLocally(audioBlob: Blob): Promise<TranscriptionResult> {
  return new Promise((resolve, reject) => {
    try {
      // Kontrollera om Web Speech API stöds i webbläsaren
      if (!isSpeechRecognitionSupported()) {
        throw new Error('Web Speech API stöds inte i din webbläsare. Försök med en annan webbläsare som Chrome.');
      }

      // Skapa en audio-element för att spela upp ljudet
      const audio = new Audio();
      const audioUrl = URL.createObjectURL(audioBlob);
      audio.src = audioUrl;

      // Konfigurera Speech Recognition
      // @ts-expect-error - TypeScript känner inte till webkitSpeechRecognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'sv-SE';
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      // Samla ihop resultaten
      let finalTranscript = '';
      let isRecognitionRunning = false;

      recognition.onstart = () => {
        isRecognitionRunning = true;
        console.log('Taligenkänning startad');
      };

      // Definiera en typ för SpeechRecognitionEvent
      interface SpeechRecognitionEvent {
        resultIndex: number;
        results: {
          [index: number]: {
            isFinal: boolean;
            [index: number]: {
              transcript: string;
            };
          };
          length: number;
        };
      }

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          }
        }
      };

      // Definiera en typ för SpeechRecognitionErrorEvent
      interface SpeechRecognitionErrorEvent {
        error: string;
      }

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Fel vid taligenkänning:', event.error);
        // Fortsätt om det bara är ett no-speech fel, annars stoppa
        if (event.error === 'no-speech') {
          console.log('Inget tal hittades, fortsätter lyssna');
          return;
        }

        URL.revokeObjectURL(audioUrl);
        audio.pause();
        isRecognitionRunning = false;
        recognition.abort();
        
        if (finalTranscript.length > 0) {
          // Om vi har fått någon transkription alls, returnera den även om det blev ett fel
          resolve({
            text: finalTranscript.trim()
          });
        } else {
          reject(new Error(`Fel vid taligenkänning: ${event.error}`));
        }
      };

      recognition.onend = () => {
        isRecognitionRunning = false;
        console.log('Taligenkänning avslutad');
        
        // URL.revokeObjectURL(audioUrl);
        // audio.pause();
        
        // Om inspelningen fortfarande spelas, starta om igenkänningen
        if (!audio.ended && !audio.paused) {
          console.log('Ljudet spelas fortfarande, startar om igenkänningen');
          try {
            recognition.start();
          } catch (e) {
            console.error('Kunde inte starta om igenkänningen:', e);
          }
          return;
        }
        
        // Om vi inte har någon transkription, ge ett användbart meddelande
        if (!finalTranscript.trim()) {
          resolve({
            text: "Transkriberingen kunde inte utföras med Web Speech API. För att transkribera ljudet, ladda ner inspelningen och använd ett externt verktyg som Microsoft Word eller Google Docs som har inbyggd taligenkänning."
          });
        } else {
          resolve({
            text: finalTranscript.trim()
          });
        }
      };

      // När ljudet är klart, stoppa igenkänningen efter en liten fördröjning
      audio.onended = () => {
        setTimeout(() => {
          if (isRecognitionRunning) {
            recognition.stop();
          }
        }, 1000); // Extra tid för att säkerställa att allt tal fångas
      };

      // Starta igenkänningen och spela upp ljudet
      recognition.start();
      
      // Lägg till en liten fördröjning innan ljudet startar för att se till att recognition har startat
      setTimeout(() => {
        audio.play().catch(error => {
          console.error('Fel vid uppspelning av ljud:', error);
          recognition.abort();
          URL.revokeObjectURL(audioUrl);
          reject(error);
        });
      }, 500);
      
    } catch (error) {
      console.error('Fel vid lokal transkribering:', error);
      reject(error);
    }
  });
}

// Funktion för att sammanfatta text med Google Gemini API
export async function summarizeWithGemini(
  text: string,
  apiKey: string
): Promise<string> {
  try {
    // Skapa en Google Gemini-klient
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Konfigurera förfrågan
    const prompt = `Sammanfatta följande mötestext på ett koncist och strukturerat sätt. 
    Behåll viktiga punkter, beslut och åtgärdspunkter. 
    Svara på svenska, formatterat med tydliga rubriker och punktlistor där lämpligt:

    ${text}`;
    
    // Skicka förfrågan till Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text();
    
    return summary;
  } catch (error) {
    console.error('Fel vid sammanfattning med Gemini:', error);
    throw error;
  }
} 