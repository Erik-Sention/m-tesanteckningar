# Guide: Använda Gemini API för bildanalys och matrekommendationer i Next.js

Den här guiden visar steg för steg hur du integrerar Gemini API i ett Next.js-projekt för att analysera bilder (t.ex. av ditt kylskåp eller skafferi) och generera matrekommendationer på svenska.

## 1. Skapa ett nytt Next.js-projekt

```bash
npx create-next-app@latest ditt-projektnamn --typescript
cd ditt-projektnamn
```

## 2. Installera nödvändiga paket

Du behöver t.ex. `axios` för API-anrop och eventuellt `formidable` eller liknande för filuppladdning:

```bash
npm install axios
```

## 3. Skaffa API-nyckel till Gemini

1. Gå till [Gemini API:s utvecklarportal](https://ai.google.dev/)
2. Skapa ett konto och generera en API-nyckel
3. Lägg till din nyckel i en `.env.local`-fil:

```
GEMINI_API_KEY=din-nyckel-här
```

## 4. Skapa en API-route för bildanalys

Skapa t.ex. `src/pages/api/analysera-bild.ts`:

```ts
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Endast POST tillåtet' });
  }

  // Här hanterar du filuppladdning, t.ex. med formidable eller multer
  // Exempel: const bildBuffer = ...;

  try {
    const geminiResponse = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent',
      {
        contents: [
          {
            parts: [
              { text: 'Vad finns i mitt kylskåp och skafferi? Ge mig 3 maträtter jag kan laga av det du ser. Svara på svenska.' },
              { inline_data: { mime_type: 'image/jpeg', data: bildBuffer.toString('base64') } }
            ]
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GEMINI_API_KEY}`
        }
      }
    );
    res.status(200).json({ svar: geminiResponse.data });
  } catch (error: any) {
    res.status(500).json({ fel: error.message });
  }
}
```

> **Tips:** Hantera filuppladdning säkert och kontrollera filtyp/storlek!

## 5. Skapa en frontend för bilduppladdning

Exempel på komponent (i `src/app/matrekommendationer/page.tsx`):

```tsx
'use client';
import { useState } from 'react';

export default function MatRekommendationer() {
  const [bild, setBild] = useState<File | null>(null);
  const [svar, setSvar] = useState<string>('');
  const [laddar, setLaddar] = useState(false);

  const hanteraUppladdning = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bild) return;
    setLaddar(true);
    const formData = new FormData();
    formData.append('bild', bild);
    const res = await fetch('/api/analysera-bild', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    setSvar(data.svar || data.fel);
    setLaddar(false);
  };

  return (
    <form onSubmit={hanteraUppladdning}>
      <label htmlFor="bild">Ladda upp bild:</label>
      <input
        id="bild"
        type="file"
        accept="image/*"
        onChange={e => setBild(e.target.files?.[0] || null)}
        required
      />
      <button type="submit" disabled={laddar}>
        {laddar ? 'Analyserar...' : 'Analysera bild'}
      </button>
      {svar && <div style={{ color: '#111', background: '#fff', padding: 8 }}>{svar}</div>}
    </form>
  );
}
```

## 6. Viktiga tips
- **All text på svenska** (se exempel ovan)
- **Hög kontrast** på all text och knappar
- **Undvik "Maximum update depth"-fel:**
  - Använd alltid korrekt dependency array i `useEffect`
  - Sätt aldrig state i en `useEffect` utan att ha full kontroll på vad som triggar den
- **API-nycklar får aldrig läcka till frontend!**
- **Hantera fel och visa tydliga felmeddelanden på svenska**
- **Håll koden modulär och ren**

## 7. Länkar
- [Gemini API-dokumentation](https://ai.google.dev/docs)
- [Next.js API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes)
- [Formidable för filuppladdning](https://www.npmjs.com/package/formidable)

---

**Lycka till med ditt projekt!** 