# Mötestranskribering

En enkel webbapp för att spela in och transkribera möten, föreläsningar eller andra ljudinspelningar. Appen erbjuder flera transkriberings-metoder:

1. **Web Speech API (lokal)** - Använder webbläsarens inbyggda taligenkänning, vilket är helt gratis men kräver en modern webbläsare som Chrome eller Edge.
2. **Google Gemini** - Använder Google Gemini API för mer avancerad taligenkänning. Kräver en API-nyckel, men har en generös gratis nivå.
3. **OpenAI** - Använder OpenAI Whisper API för högkvalitativ transkribering. Kräver en betalad API-nyckel.

## Användning

1. Öppna appen i din webbläsare
2. Klicka på "Spela in" för att börja spela in ljud från din mikrofon
3. Klicka på "Stopp" när du är klar med inspelningen
4. Appen kommer automatiskt att försöka transkribera inspelningen med den valda metoden
5. Du kan även ladda ner inspelningen för att transkribera den manuellt eller använda andra verktyg

## API-nycklar

Du kan ange API-nycklar på två sätt:

### Alternativ 1: Via inställningar i appen
1. Klicka på kugghjulsikonen i övre högra hörnet för att öppna inställningarna
2. Välj vilken transkriberings-metod du vill använda
3. Ange din API-nyckel för den valda metoden
4. Klicka på "Spara"

### Alternativ 2: Via .env.local-fil (rekommenderas)
1. Skapa en fil som heter `.env.local` i projektets rotmapp
2. Lägg till dina API-nycklar i följande format:
```
NEXT_PUBLIC_GEMINI_API_KEY=din-gemini-nyckel-här
NEXT_PUBLIC_OPENAI_API_KEY=din-openai-nyckel-här
NEXT_PUBLIC_DEFAULT_TRANSCRIPTION_METHOD=gemini
```
3. Spara filen och starta om appen

När du använder `.env.local`-filen behöver du inte ange nycklarna varje gång, och de kommer att prioriteras framför eventuella nycklar som sparats i webbläsarens localStorage.

### Skaffa API-nycklar

- **Google Gemini**: Besök [Google AI Studio](https://aistudio.google.com/app/apikey) för att skaffa en gratis API-nyckel
- **OpenAI**: Besök [OpenAI Platform](https://platform.openai.com/api-keys) för att skapa ett konto och få en API-nyckel (betalning krävs)

## Utveckling

Projektet är byggt med:
- Next.js
- React
- TypeScript
- TailwindCSS

För att köra projektet lokalt:

```bash
# Installera beroenden
npm install

# Starta utvecklingsservern
npm run dev
```

## Obs!

- Web Speech API stöds inte i alla webbläsare, särskilt inte i Firefox och Safari. För bästa resultat, använd Chrome eller Edge.
- Web Speech API kräver en aktiv internetanslutning även om transkriberingen sker lokalt.
- Kvaliteten på transkriberingen varierar beroende på mikrofonkvalitet, bakgrundsljud och tydlighet i talet.
