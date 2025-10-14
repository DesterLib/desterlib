import type { HttpClient } from "../core/http-client.js";

/**
 * Base class for all endpoint modules
 * Provides access to the HTTP client for making requests
 */
export abstract class BaseEndpoint {
  constructor(protected readonly client: HttpClient) {}
}
