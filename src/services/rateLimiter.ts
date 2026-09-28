/**
 * @module: Small Business Loan Agent
 * @file: rateLimiter.ts
 * @description: Simple sliding-window rate limiter for Gemini API calls
 * @author: Maíra Pontin
 * @created: 2026-09-23
 * @updated: 260923_161500
 * @version: 1.0.0
 * @reviewer:
 * @ai_reviewer:
 * @reviewer_date:
 */

const WINDOW_MS = 60_000;
const DEFAULT_LIMIT = parseInt(process.env.GEMINI_RATE_LIMIT_PER_MINUTE || '60', 10);

const calls: number[] = [];

export function checkRateLimit(): void {
  const now = Date.now();
  const cutoff = now - WINDOW_MS;

  while (calls.length > 0 && calls[0] < cutoff) {
    calls.shift();
  }

  if (calls.length >= DEFAULT_LIMIT) {
    throw new Error(
      `Gemini rate limit exceeded: ${DEFAULT_LIMIT} calls per minute. ` +
      `Set GEMINI_RATE_LIMIT_PER_MINUTE to adjust.`
    );
  }

  calls.push(now);
}

export function getRateLimitStats(): { callsInWindow: number; limit: number } {
  const now = Date.now();
  const cutoff = now - WINDOW_MS;
  const active = calls.filter((t) => t >= cutoff);
  return { callsInWindow: active.length, limit: DEFAULT_LIMIT };
}
