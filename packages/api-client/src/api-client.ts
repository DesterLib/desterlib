import { HttpClient, type HttpClientConfig } from "./core/http-client.js";
import { MediaEndpoint } from "./endpoints/media.endpoint.js";
import { MoviesEndpoint } from "./endpoints/movies.endpoint.js";
import { TVShowsEndpoint } from "./endpoints/tv-shows.endpoint.js";
import { MusicEndpoint } from "./endpoints/music.endpoint.js";
import { ComicsEndpoint } from "./endpoints/comics.endpoint.js";
import { CollectionsEndpoint } from "./endpoints/collections.endpoint.js";
import { ScanEndpoint } from "./endpoints/scan.endpoint.js";
import { SearchEndpoint } from "./endpoints/search.endpoint.js";
import { SettingsEndpoint } from "./endpoints/settings.endpoint.js";
import { NotificationsEndpoint } from "./endpoints/notifications.endpoint.js";

/**
 * Configuration options for the Dester API client
 */
export interface DesterClientConfig extends Omit<HttpClientConfig, "baseUrl"> {
  /**
   * Base URL for the Dester API
   * @default 'http://localhost:3000'
   */
  baseUrl?: string;
}

/**
 * Main Dester API client that aggregates all endpoint modules
 *
 * @example
 * Basic usage:
 * ```ts
 * const api = new DesterClient({
 *   baseUrl: 'http://localhost:3000'
 * });
 *
 * // Use modular endpoints
 * const movies = await api.movies.list({ limit: 10 });
 * const media = await api.media.getById('media-id');
 * const settings = await api.settings.get();
 * ```
 *
 * @example
 * With error handling:
 * ```ts
 * import { ApiError, ValidationError } from '@dester/api-client';
 *
 * try {
 *   const movie = await api.movies.getById('123');
 * } catch (error) {
 *   if (error instanceof ValidationError) {
 *     console.log('Validation errors:', error.getValidationMessages());
 *   } else if (error instanceof ApiError) {
 *     console.log('API error:', error.statusCode, error.message);
 *   }
 * }
 * ```
 */
export class DesterClient {
  private readonly httpClient: HttpClient;

  /** Media endpoint module */
  public readonly media: MediaEndpoint;

  /** Movies endpoint module */
  public readonly movies: MoviesEndpoint;

  /** TV Shows endpoint module */
  public readonly tvShows: TVShowsEndpoint;

  /** Music endpoint module */
  public readonly music: MusicEndpoint;

  /** Comics endpoint module */
  public readonly comics: ComicsEndpoint;

  /** Collections endpoint module */
  public readonly collections: CollectionsEndpoint;

  /** Scan endpoint module */
  public readonly scan: ScanEndpoint;

  /** Search endpoint module */
  public readonly search: SearchEndpoint;

  /** Settings endpoint module */
  public readonly settings: SettingsEndpoint;

  /** Notifications endpoint module */
  public readonly notifications: NotificationsEndpoint;

  constructor(config: DesterClientConfig = {}) {
    const baseUrl = config.baseUrl || "http://localhost:3000";

    this.httpClient = new HttpClient({
      ...config,
      baseUrl,
    });

    // Initialize endpoint modules
    this.media = new MediaEndpoint(this.httpClient);
    this.movies = new MoviesEndpoint(this.httpClient);
    this.tvShows = new TVShowsEndpoint(this.httpClient);
    this.music = new MusicEndpoint(this.httpClient);
    this.comics = new ComicsEndpoint(this.httpClient);
    this.collections = new CollectionsEndpoint(this.httpClient);
    this.scan = new ScanEndpoint(this.httpClient);
    this.search = new SearchEndpoint(this.httpClient);
    this.settings = new SettingsEndpoint(this.httpClient);
    this.notifications = new NotificationsEndpoint(this.httpClient);
  }

  /**
   * Update the base URL
   *
   * @param baseUrl - The new base URL
   */
  setBaseUrl(baseUrl: string): void {
    this.httpClient.setBaseUrl(baseUrl);
  }

  /**
   * Get access to the underlying HTTP client for custom requests
   *
   * @returns The HTTP client instance
   *
   * @example
   * ```ts
   * // Make a custom request not covered by endpoints
   * const data = await api.getHttpClient().get('/custom-endpoint');
   * ```
   */
  getHttpClient(): HttpClient {
    return this.httpClient;
  }
}
