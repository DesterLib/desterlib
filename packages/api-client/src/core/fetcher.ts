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
 * Get CSRF token from cookie
 */
function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
  return match?.[1] ?? null;
}

/**
 * Custom fetcher function used by Orval-generated client
 */
export async function customFetcher<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const fullUrl = url.startsWith("http") ? url : `${config.baseURL}${url}`;

  // Get CSRF token for state-changing requests
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...config.headers,
    ...(options?.headers as Record<string, string>),
  };

  // Add CSRF token for POST, PUT, PATCH, DELETE
  if (
    csrfToken &&
    options?.method &&
    ["POST", "PUT", "PATCH", "DELETE"].includes(options.method)
  ) {
    headers["x-csrf-token"] = csrfToken;
  }

  const response = await fetch(fullUrl, {
    ...options,
    credentials: "include", // Include cookies for CSRF
    headers,
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
    return {
      data: {},
      status: response.status,
      headers: response.headers,
    } as T;
  }

  const data = await response.json();
  return {
    data,
    status: response.status,
    headers: response.headers,
  } as T;
}

export type ErrorType<Error> = Error;
