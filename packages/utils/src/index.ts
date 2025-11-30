// Shared utility functions

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function retry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> {
  return fn().catch((error) => {
    if (retries > 0) {
      return sleep(delay).then(() => retry(fn, retries - 1, delay * 2));
    }
    throw error;
  });
}
