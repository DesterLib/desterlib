import {
  ApiError,
  NetworkError,
  ValidationError,
  createApiError,
} from "./errors.js";
import { z } from "zod";

/**
 * Configuration options for the HTTP client
 */
export interface HttpClientConfig {
  /** Base URL for all API requests */
  baseUrl: string;
  /** Optional authentication token */
  token?: string;
  /** Additional headers to include in all requests */
  headers?: Record<string, string>;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
}

/**
 * Core HTTP client for making API requests with built-in error handling,
 * token management, and schema validation support.
 *
 * @example
 * ```ts
 * const client = new HttpClient({
 *   baseUrl: 'https://api.example.com',
 *   token: 'your-token'
 * });
 *
 * const data = await client.get('/users', UserListSchema);
 * ```
 */
export class HttpClient {
  private baseUrl: string;
  private token?: string;
  private headers: Record<string, string>;
  private timeout: number;

  constructor(config: HttpClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, ""); // Remove trailing slash
    this.token = config.token;
    this.headers = {
      "Content-Type": "application/json",
      ...config.headers,
    };
    this.timeout = config.timeout ?? 30000;
  }

  /**
   * Set or update the authentication token
   * @param token - The authentication token
   */
  setToken(token: string): void {
    this.token = token;
  }

  /**
   * Clear the authentication token
   */
  clearToken(): void {
    this.token = undefined;
  }

  /**
   * Get the current authentication token
   */
  getToken(): string | undefined {
    return this.token;
  }

  /**
   * Update the base URL
   * @param baseUrl - The new base URL
   */
  setBaseUrl(baseUrl: string): void {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  /**
   * Get the current base URL
   * @returns The current base URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Make a GET request
   * @param endpoint - API endpoint path
   * @param schema - Optional Zod schema for validation
   * @returns Validated response data
   */
  async get<T>(endpoint: string, schema?: z.ZodSchema<T>): Promise<T> {
    return this.request<T>("GET", endpoint, undefined, schema);
  }

  /**
   * Make a POST request
   * @param endpoint - API endpoint path
   * @param body - Request body
   * @param schema - Optional Zod schema for validation
   * @returns Validated response data
   */
  async post<T>(
    endpoint: string,
    body?: any,
    schema?: z.ZodSchema<T>
  ): Promise<T> {
    return this.request<T>("POST", endpoint, body, schema);
  }

  /**
   * Make a PUT request
   * @param endpoint - API endpoint path
   * @param body - Request body
   * @param schema - Optional Zod schema for validation
   * @returns Validated response data
   */
  async put<T>(
    endpoint: string,
    body?: any,
    schema?: z.ZodSchema<T>
  ): Promise<T> {
    return this.request<T>("PUT", endpoint, body, schema);
  }

  /**
   * Make a PATCH request
   * @param endpoint - API endpoint path
   * @param body - Request body
   * @param schema - Optional Zod schema for validation
   * @returns Validated response data
   */
  async patch<T>(
    endpoint: string,
    body?: any,
    schema?: z.ZodSchema<T>
  ): Promise<T> {
    return this.request<T>("PATCH", endpoint, body, schema);
  }

  /**
   * Make a DELETE request
   * @param endpoint - API endpoint path
   * @param schema - Optional Zod schema for validation
   * @returns Validated response data
   */
  async delete<T>(endpoint: string, schema?: z.ZodSchema<T>): Promise<T> {
    return this.request<T>("DELETE", endpoint, undefined, schema);
  }

  /**
   * Core request method with timeout and validation
   */
  private async request<T>(
    method: string,
    endpoint: string,
    body?: any,
    schema?: z.ZodSchema<T>
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const headers: Record<string, string> = { ...this.headers };

      if (this.token) {
        headers["Authorization"] = `Bearer ${this.token}`;
      }

      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      const responseData = await response.json();

      // Extract data from the API response envelope
      // API responses are wrapped in: { success: true, requestId: string, data: T }
      const data = responseData?.data ?? responseData;

      // Validate with Zod schema if provided
      if (schema) {
        try {
          return schema.parse(data);
        } catch (err) {
          throw new ValidationError(
            "Response validation failed",
            err instanceof z.ZodError ? err.errors : undefined
          );
        }
      }

      return data as T;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof ApiError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw new NetworkError(`Request timeout after ${this.timeout}ms`);
        }
        throw new NetworkError(error.message);
      }

      throw new NetworkError("An unknown error occurred");
    }
  }

  /**
   * Handle error responses from the API
   */
  private async handleErrorResponse(response: Response): Promise<never> {
    let errorData: any;

    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }

    const message =
      errorData?.error?.message ||
      errorData?.message ||
      `Request failed with status ${response.status}`;

    throw createApiError(message, response.status, errorData);
  }

  /**
   * Build query string from parameters
   *
   * Filters out undefined, null, and empty string values.
   * Handles Date objects (converts to ISO string), arrays (repeated params), and primitives.
   *
   * @param params - Query parameters object
   * @returns Query string with leading '?' or empty string if no valid params
   *
   * @example
   * ```ts
   * buildQueryString({ limit: 10, type: 'MOVIE' })
   * // Returns: '?limit=10&type=MOVIE'
   *
   * buildQueryString({ tags: ['action', 'sci-fi'] })
   * // Returns: '?tags=action&tags=sci-fi'
   *
   * buildQueryString({ date: new Date('2024-01-01') })
   * // Returns: '?date=2024-01-01T00:00:00.000Z'
   *
   * buildQueryString({ name: undefined, age: null })
   * // Returns: ''
   * ```
   */
  buildQueryString(params: Record<string, any>): string {
    const filtered = Object.entries(params)
      .filter(
        ([_, value]) => value !== undefined && value !== null && value !== ""
      )
      .map(([key, value]) => {
        if (value instanceof Date) {
          return `${encodeURIComponent(key)}=${encodeURIComponent(value.toISOString())}`;
        }
        if (Array.isArray(value)) {
          return value
            .map(
              (v) =>
                `${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`
            )
            .join("&");
        }
        return `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`;
      });

    return filtered.length > 0 ? `?${filtered.join("&")}` : "";
  }
}
