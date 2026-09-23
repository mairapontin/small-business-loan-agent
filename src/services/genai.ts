import { GoogleGenAI } from '@google/genai';

const GOOGLE_GENAI_API_KEY = process.env.GOOGLE_GENAI_API_KEY;

if (!GOOGLE_GENAI_API_KEY) {
  console.warn(
    'GOOGLE_GENAI_API_KEY not set — ADK orchestrator will fall back to deterministic mode'
  );
}

export const genAI: GoogleGenAI | null = GOOGLE_GENAI_API_KEY
  ? new GoogleGenAI({ apiKey: GOOGLE_GENAI_API_KEY })
  : null;
