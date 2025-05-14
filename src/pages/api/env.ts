import { NextApiRequest, NextApiResponse } from 'next';

type EnvVars = {
  NEXT_PUBLIC_GEMINI_API_KEY?: string;
  NEXT_PUBLIC_OPENAI_API_KEY?: string;
  NEXT_PUBLIC_DEFAULT_TRANSCRIPTION_METHOD?: string;
};

export default function handler(req: NextApiRequest, res: NextApiResponse<EnvVars>) {
  // Returnera endast de miljövariabler vi explicit vill dela med klienten
  res.status(200).json({
    NEXT_PUBLIC_GEMINI_API_KEY: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
    NEXT_PUBLIC_OPENAI_API_KEY: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    NEXT_PUBLIC_DEFAULT_TRANSCRIPTION_METHOD: process.env.NEXT_PUBLIC_DEFAULT_TRANSCRIPTION_METHOD,
  });
} 