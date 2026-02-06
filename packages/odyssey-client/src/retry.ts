import { OdysseyError } from "./errors";

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

function isRetryable(error: unknown): boolean {
  if (error instanceof OdysseyError) {
    return error.statusCode === 429 || error.statusCode >= 500;
  }
  return false;
}

export async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === MAX_RETRIES || !isRetryable(error)) {
        throw error;
      }

      const delayMs = BASE_DELAY_MS * Math.pow(2, attempt); // 1s, 2s, 4s
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
}
