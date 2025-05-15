import { TranscriptionResult } from '../types';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Funktion för att transkribera med OpenAI API
export async function transcribeWithOpenAI(
  audioBlob: Blob, 
  apiKey: string
): Promise<TranscriptionResult> {
  try {
    console.log("transcribeWithOpenAI startad");
    
    // Rensa API-nyckeln från eventuella oönskade tecken
    const trimmedApiKey = apiKey.trim();
    if (!trimmedApiKey) {
      throw new Error('OpenAI API-nyckel saknas.');
    }
    
    console.log(`- API nyckel börjar med: ${trimmedApiKey.substring(0, 10)}...`);
    console.log(`- API nyckel längd: ${trimmedApiKey.length}`);
    console.log(`- API nyckel sk- format: ${trimmedApiKey.startsWith('sk-')}`);
    console.log(`- API nyckel sk-proj- format: ${trimmedApiKey.startsWith('sk-proj-')}`);
    console.log(`- Audio blob storlek: ${audioBlob.size} bytes`);
    console.log(`- Audio blob typ: ${audioBlob.type}`);
    
    console.log("Skapar OpenAI klient...");
    const openai = new OpenAI({ 
      apiKey: trimmedApiKey,
      dangerouslyAllowBrowser: true  // Tillåt användning i webbläsaren
    });
    
    console.log("Konverterar blob till File-objekt...");
    const file = await toFile(audioBlob, 'recording.wav');
    console.log(`- Skapat File-objekt: ${file.name}, ${file.size} bytes, ${file.type}`);
    
    console.log("Anropar OpenAI transkriberings-API...");
    const response = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: 'sv'
    });
    
    console.log("Fick svar från OpenAI:");
    console.log(`- Textlängd: ${response.text.length} tecken`);
    console.log(`- Början av text: ${response.text.substring(0, 30)}...`);
    
    return {
      text: response.text
    };
  } catch (error) {
    console.error("Fel i transcribeWithOpenAI:", error);
    
    // Mer detaljerad loggning av felet
    if (error instanceof Error) {
      console.error(`- Feltyp: ${error.name}`);
      console.error(`- Felmeddelande: ${error.message}`);
      console.error(`- Stack trace: ${error.stack}`);
      
      // Speciell hantering för vanliga OpenAI-fel
      if (error.message.includes('401')) {
        console.error("401 AUTH FEL: API-nyckeln är ogiltig eller saknar rättigheter");
      } else if (error.message.includes('429')) {
        console.error("429 RATE LIMIT: För många anrop till API:et");
      } else if (error.message.includes('400')) {
        console.error("400 BAD REQUEST: Något i förfrågan är felaktigt, kontrollera filens format");
      } else if (error.message.includes('500')) {
        console.error("500 SERVER ERROR: OpenAI:s servrar har problem");
      } else if (error.message.includes('Connection')) {
        console.error("ANSLUTNINGSFEL: Kontrollera din internetanslutning");
      }
    }
    
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
    
    // Förbättrad prompt enligt nya instruktioner
    const prompt = `
Syfte: Sammanfattningen ska fungera både som en minnesanteckning för deltagarna och som information för frånvarande kollegor och chefen. Den ska ligga till grund för vidare arbete.
Målgrupp: Projektteamet (som deltog) och deras chef (som inte deltog).
Omfattning och format: Sammanfattningen ska vara cirka en halv till en A4-sida. Använd tydliga rubriker, minst för 'Beslut' och 'Åtgärdspunkter'.
Inkludera: Fokusera på fattade beslut, identifierade åtgärdspunkter (inklusive ansvarig person och deadline), samt de huvudsakliga diskussionspunkterna som var avgörande för besluten.
Exkludera/Hantera: Exkludera småprat. Övrig information som är relevant men inte passar under 'Beslut' eller 'Åtgärdspunkter' kan samlas under en lämplig rubrik som t.ex. 'Övrigt' eller 'Viktiga diskussioner'.
Stil: Skriv i en tydlig, kortfattad och handlingsorienterad stil.
Prioritera: Se till att alla deadlines och annan ytterst viktig information är tydligt markerade. Använd punktlistor där det är lämpligt för bättre läsbarhet.

Här är texten:
${base64Audio}
`;
    
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
  apiKey: string,
  customPrompt?: string
): Promise<string> {
  try {
    // Skapa en Google Gemini-klient
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Använd custom prompt om den finns, annars standardprompten
    const prompt = customPrompt && customPrompt.trim().length > 0
      ? `${customPrompt}\n\nHär är texten:\n${text}`
      : `
Syfte: Sammanfattningen ska fungera både som en minnesanteckning för deltagarna och som information för frånvarande kollegor och chefen. Den ska ligga till grund för vidare arbete.
Målgrupp: Projektteamet (som deltog) och deras chef (som inte deltog).
Omfattning och format: Sammanfattningen ska vara cirka en halv till en A4-sida. Använd tydliga rubriker, minst för 'Beslut' och 'Åtgärdspunkter'.
Inkludera: Fokusera på fattade beslut, identifierade åtgärdspunkter (inklusive ansvarig person och deadline), samt de huvudsakliga diskussionspunkterna som var avgörande för besluten.
Exkludera/Hantera: Exkludera småprat. Övrig information som är relevant men inte passar under 'Beslut' eller 'Åtgärdspunkter' kan samlas under en lämplig rubrik som t.ex. 'Övrigt' eller 'Viktiga diskussioner'.
Stil: Skriv i en tydlig, kortfattad och handlingsorienterad stil.
Prioritera: Se till att alla deadlines och annan ytterst viktig information är tydligt markerade. Använd punktlistor där det är lämpligt för bättre läsbarhet.
\nHär är texten:\n${text}
`;
    
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

// Funktion för att sammanfatta text med OpenAI
export async function summarizeWithOpenAI(
  text: string,
  apiKey: string
): Promise<string> {
  try {
    // Rensa API-nyckeln från eventuella oönskade tecken
    const trimmedApiKey = apiKey.trim();
    if (!trimmedApiKey) {
      throw new Error('OpenAI API-nyckel saknas.');
    }
    const openai = new OpenAI({ 
      apiKey: trimmedApiKey,
      dangerouslyAllowBrowser: true  // Tillåt användning i webbläsaren
    });
    
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Du är en assistent som sammanfattar mötesanteckningar på svenska. Skapa en koncis och välorganiserad sammanfattning som bevarar viktiga punkter, beslut och åtgärdspunkter. Formattera svaret med tydliga rubriker och punktlistor när det är lämpligt."
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0.5,
    });
    
    return response.choices[0].message.content || "Kunde inte generera sammanfattning.";
  } catch (error) {
    console.error('Fel vid sammanfattning med OpenAI:', error);
    throw error;
  }
} 