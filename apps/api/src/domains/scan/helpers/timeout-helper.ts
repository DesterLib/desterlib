/**
 * Timeout utilities for handling slow/unresponsive mounted drives
 * Works with any mount type: FTP, SMB, NFS, slow USB, network drives, etc.
 */

import { logger } from "@/lib/utils";

/**
 * Execute a promise with a timeout
 * Useful for operations on slow or unresponsive mounted drives
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operationName: string,
): Promise<T> {
  let timeoutHandle: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(
        new Error(
          `Operation "${operationName}" timed out after ${timeoutMs}ms. This may indicate a slow or unresponsive mounted drive.`,
        ),
      );
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutHandle!);
    return result;
  } catch (error) {
    clearTimeout(timeoutHandle!);
    throw error;
  }
}

/**
 * Retry an operation with exponential backoff
 * Useful for transient failures on mounted drives
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    operationName: string;
  },
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 1000,
    maxDelayMs = 10000,
    operationName,
  } = options;

  let lastError: Error | unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries) {
        logger.error(
          `Operation "${operationName}" failed after ${maxRetries + 1} attempts`,
        );
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(initialDelayMs * Math.pow(2, attempt), maxDelayMs);

      logger.warn(
        `Operation "${operationName}" failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms... Error: ${error instanceof Error ? error.message : String(error)}`,
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Execute operation with both timeout and retry logic
 * Best for operations on potentially slow/unreliable mounted drives
 */
export async function withTimeoutAndRetry<T>(
  operation: () => Promise<T>,
  options: {
    timeoutMs?: number;
    maxRetries?: number;
    operationName: string;
  },
): Promise<T> {
  const { timeoutMs = 60000, maxRetries = 3, operationName } = options;

  return withRetry(() => withTimeout(operation(), timeoutMs, operationName), {
    maxRetries,
    operationName,
  });
}
