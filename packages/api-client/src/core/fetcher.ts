/**
 * Custom fetcher for Orval-generated API client
 * Handles request/response processing and error handling
 */

export interface FetcherConfig {
  baseURL?: string;
  headers?: Record<string, string>;
}

let config: FetcherConfig = {
  baseURL: "http://localhost:3000",
  headers: {},
};

/**
 * Configure the API client
 */
export function configure(newConfig: Partial<FetcherConfig>): void {
  config = { ...config, ...newConfig };
}

/**
 * Get current configuration
 */
export function getConfig(): FetcherConfig {
  return { ...config };
}

/**
 * Custom fetcher function used by Orval-generated client
 */
export async function customFetcher<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const fullUrl = url.startsWith("http") ? url : `${config.baseURL}${url}`;

  const response = await fetch(fullUrl, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...config.headers,
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message ||
        errorData.message ||
        `HTTP ${response.status}: ${response.statusText}`
    );
  }

  // Handle empty responses
  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    return {} as T;
  }

  const data = await response.json();

  // Unwrap the API response (assumes your API returns { success, data, requestId })
  if (data && typeof data === "object" && "data" in data) {
    return data.data as T;
  }

  return data as T;
}

export type ErrorType<Error> = Error;
