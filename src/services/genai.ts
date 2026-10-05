import { GoogleGenAI } from '@google/genai';

let currentApiKey: string | undefined = process.env.GOOGLE_GENAI_API_KEY;

if (!currentApiKey) {
  console.warn(
    'GOOGLE_GENAI_API_KEY not set — ADK orchestrator will fall back to deterministic mode'
  );
}

export let genAI: GoogleGenAI | null = currentApiKey
  ? new GoogleGenAI({ apiKey: currentApiKey })
  : null;

let lastRotatedAt: string | null = currentApiKey ? new Date().toISOString() : null;

/**
 * Rotates the Gemini API key at runtime without restarting the server process.
 * Re-instantiates the GoogleGenAI client and updates process.env.
 */
export function rotateApiKey(newKey: string): {
  success: boolean;
  rotatedAt: string;
  fingerprint: string | null;
} {
  currentApiKey = (newKey || '').trim();
  if (currentApiKey) {
    process.env.GOOGLE_GENAI_API_KEY = currentApiKey;
    genAI = new GoogleGenAI({ apiKey: currentApiKey });
  } else {
    delete process.env.GOOGLE_GENAI_API_KEY;
    genAI = null;
  }
  lastRotatedAt = new Date().toISOString();
  console.log(`[AUTH] Google GenAI API key rotated at ${lastRotatedAt}`);
  return {
    success: true,
    rotatedAt: lastRotatedAt,
    fingerprint: currentApiKey
      ? `${currentApiKey.slice(0, 4)}...${currentApiKey.slice(-4)}`
      : null,
  };
}

export function getApiKeyStatus() {
  return {
    configured: Boolean(genAI),
    lastRotatedAt,
    fingerprint: currentApiKey
      ? `${currentApiKey.slice(0, 4)}...${currentApiKey.slice(-4)}`
      : null,
  };
}
