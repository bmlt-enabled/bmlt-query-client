/**
 * Main BMLT client class for querying BMLT servers
 */

import { GeocodingService } from '../services/geocoding';
import {
  BmltDataFormat,
  BmltEndpoint,
  BmltError,
  Meeting,
  Format,
  MeetingsWithFormats,
  ServiceBody,
  Change,
  ServerInfo,
  CoverageArea,
  FieldKey,
  FieldValue,
  SearchResultsParams,
  GeographicSearchParams,
  FormatsParams,
  ServiceBodiesParams,
  ChangesParams,
  FieldValuesParams,
  NAWSDumpParams,
  GeocodeOptions,
  RateLimitOptions,
  Coordinates,
} from '../types';
import {
  buildBmltURL,
  validateEndpointFormat,
  validateServerURL,
  validateCoordinates,
  validateRadius,
} from '../utils/url-builder';
import { ErrorHandler } from '../utils/errors';

export interface BmltClientOptions {
  /** Server URL */
  serverURL: string;

  /** Default data format */
  defaultFormat?: BmltDataFormat;

  /** HTTP request timeout in milliseconds */
  timeout?: number;

  /** User agent string */
  userAgent?: string;

  /** Geocoding options */
  geocodingOptions?: GeocodeOptions & RateLimitOptions;

  /** Enable automatic geocoding for address searches */
  enableGeocoding?: boolean;
}

export class BmltClient {
  private timeout: number;
  private userAgent: string;
  private readonly geocodingService?: GeocodingService;
  private serverURL: string;
  private defaultFormat: BmltDataFormat;

  constructor(options: BmltClientOptions) {
    const {
      serverURL,
      defaultFormat = BmltDataFormat.JSON,
      timeout = 30000,
      userAgent = 'bmlt-query-client/1.0.0',
      geocodingOptions = {},
      enableGeocoding = true,
    } = options;

    // Validate and normalize server URL
    this.serverURL = validateServerURL(serverURL);
    this.defaultFormat = defaultFormat;
    this.timeout = timeout;
    this.userAgent = userAgent;

    // Initialize geocoding service if enabled
    if (enableGeocoding) {
      this.geocodingService = new GeocodingService(geocodingOptions);
    }
  }

  /**
   * Fetch a URL and parse the response according to format
   */
  private async fetchAndParse<T>(
    url: string,
    format: BmltDataFormat,
    parameters: Record<string, unknown> = {}
  ): Promise<T> {
    let response: Response | undefined;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      try {
        response = await fetch(url, {
          method: 'GET',
          headers: { 'User-Agent': this.userAgent },
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (!response.ok) {
        throw ErrorHandler.handleFetchError(
          new Error(`HTTP ${response.status}: ${response.statusText}`),
          response
        );
      }

      const responseText = await response.text();

      if (format === BmltDataFormat.CSV) return responseText as T;

      if (format === BmltDataFormat.JSONP) {
        const callbackName = (parameters.callback as string) || 'callback';
        const jsonMatch = responseText.match(new RegExp(`${callbackName}\\((.+)\\);?$`));
        if (!jsonMatch) throw new Error('Invalid JSONP response format');
        return JSON.parse(jsonMatch[1]) as T;
      }

      if (format === BmltDataFormat.JSON || format === BmltDataFormat.TSML) {
        return JSON.parse(responseText) as T;
      }

      return responseText as T;
    } catch (error) {
      throw ErrorHandler.handleFetchError(error, response);
    }
  }

  /**
   * Make a request to the BMLT API
   */
  private async makeRequest<T>(
    endpoint: BmltEndpoint,
    parameters: Record<string, unknown> = {},
    format: BmltDataFormat = this.defaultFormat
  ): Promise<T> {
    validateEndpointFormat(endpoint, format);
    const url = buildBmltURL({ serverURL: this.serverURL, format, endpoint, parameters });
    return this.fetchAndParse<T>(url, format, parameters);
  }

  /**
   * Execute a raw BMLT query string against the server.
   *
   * Pass the query exactly as you'd append it to a BMLT URL.  The switcher
   * can be written with or without the key name:
   *
   *   // bare endpoint name — most common shorthand
   *   client.rawQuery('GetSearchResults&venue_types=2&meeting_key=location_nation&meeting_key_value[]=USA&meeting_key_value[]=US')
   *
   *   // explicit switcher= key also works
   *   client.rawQuery('switcher=GetSearchResults&venue_types=2')
   */
  async rawQuery<T = unknown>(
    queryString: string,
    format: BmltDataFormat = this.defaultFormat
  ): Promise<T> {
    const baseURL = this.serverURL.endsWith('/') ? this.serverURL : `${this.serverURL}/`;
    const endpointURL = `${baseURL}client_interface/${format}/`;

    // If the first token has no '=' it is a bare endpoint name; prepend switcher=
    const firstSegment = queryString.split('&')[0];
    const normalized = firstSegment.includes('=') ? queryString : `switcher=${queryString}`;

    return this.fetchAndParse<T>(`${endpointURL}?${normalized}`, format);
  }

  /**
   * Search for meetings
   */
  async searchMeetings(params: SearchResultsParams = {}): Promise<Meeting[]> {
    const { format = this.defaultFormat, ...searchParams } = params;
    return this.makeRequest<Meeting[]>(BmltEndpoint.GET_SEARCH_RESULTS, searchParams, format);
  }

  /**
   * Search for meetings and return both meetings and the formats they reference in a
   * single request. Uses get_used_formats=true so the server wraps the response as
   * { meetings: Meeting[], formats: Format[] } instead of a bare Meeting[].
   *
   * This replaces the common pattern of Promise.all([getFormats(), searchMeetings()])
   * with a single round-trip, which matters for large servers where getFormats() can
   * return hundreds of unused format records.
   */
  async searchMeetingsWithFormats(
    params: Omit<SearchResultsParams, 'get_used_formats' | 'get_formats_only'> = {}
  ): Promise<MeetingsWithFormats> {
    const { format = this.defaultFormat, ...searchParams } = params;
    return this.makeRequest<MeetingsWithFormats>(
      BmltEndpoint.GET_SEARCH_RESULTS,
      { ...searchParams, get_used_formats: true },
      format
    );
  }

  /**
   * Search for meetings by geographic location using geocoding
   */
  async searchMeetingsByAddress(params: GeographicSearchParams): Promise<Meeting[]> {
    if (!this.geocodingService) {
      throw new Error('Geocoding is not enabled. Initialize client with enableGeocoding: true');
    }

    const { address, radiusMiles, radiusKm, sortByDistance = true, searchParams = {} } = params;

    // Geocode the address
    const geocodeResult = await this.geocodingService.geocode(address);

    // Build search parameters with coordinates
    const geoSearchParams: SearchResultsParams = {
      ...searchParams,
      lat_val: geocodeResult.coordinates.latitude,
      long_val: geocodeResult.coordinates.longitude,
      sort_results_by_distance: sortByDistance,
    };

    // Add radius parameter
    if (radiusMiles !== undefined) {
      validateRadius(radiusMiles);
      geoSearchParams.geo_width = radiusMiles;
    } else if (radiusKm !== undefined) {
      validateRadius(radiusKm);
      geoSearchParams.geo_width_km = radiusKm;
    }

    return this.searchMeetings(geoSearchParams);
  }

  /**
   * Search for meetings by coordinates
   */
  async searchMeetingsByCoordinates(
    coordinates: Coordinates,
    radiusMiles?: number,
    radiusKm?: number,
    searchParams: Omit<
      SearchResultsParams,
      'lat_val' | 'long_val' | 'geo_width' | 'geo_width_km'
    > = {}
  ): Promise<Meeting[]> {
    validateCoordinates(coordinates.latitude, coordinates.longitude);

    const geoSearchParams: SearchResultsParams = {
      ...searchParams,
      lat_val: coordinates.latitude,
      long_val: coordinates.longitude,
      sort_results_by_distance: true,
    };

    if (radiusMiles !== undefined) {
      validateRadius(radiusMiles);
      geoSearchParams.geo_width = radiusMiles;
    } else if (radiusKm !== undefined) {
      validateRadius(radiusKm);
      geoSearchParams.geo_width_km = radiusKm;
    }

    return this.searchMeetings(geoSearchParams);
  }

  /**
   * Get available meeting formats
   */
  async getFormats(params: FormatsParams = {}): Promise<Format[]> {
    const { format = this.defaultFormat, ...formatParams } = params;
    return this.makeRequest<Format[]>(BmltEndpoint.GET_FORMATS, formatParams, format);
  }

  /**
   * Get service bodies
   */
  async getServiceBodies(params: ServiceBodiesParams = {}): Promise<ServiceBody[]> {
    const { format = this.defaultFormat, ...serviceParams } = params;
    return this.makeRequest<ServiceBody[]>(BmltEndpoint.GET_SERVICE_BODIES, serviceParams, format);
  }

  /**
   * Get meeting changes within a date range
   */
  async getChanges(params: ChangesParams = {}): Promise<Change[]> {
    const { format = this.defaultFormat, ...changeParams } = params;
    return this.makeRequest<Change[]>(BmltEndpoint.GET_CHANGES, changeParams, format);
  }

  /**
   * Get available field keys
   */
  async getFieldKeys(): Promise<FieldKey[]> {
    return this.makeRequest<FieldKey[]>(BmltEndpoint.GET_FIELD_KEYS);
  }

  /**
   * Get field values for a specific field key
   */
  async getFieldValues(params: FieldValuesParams): Promise<FieldValue[]> {
    const { format = this.defaultFormat, ...fieldParams } = params;
    return this.makeRequest<FieldValue[]>(BmltEndpoint.GET_FIELD_VALUES, fieldParams, format);
  }

  /**
   * Get NAWS dump for a service body (CSV format only)
   */
  async getNAWSDump(params: NAWSDumpParams): Promise<string> {
    return this.makeRequest<string>(BmltEndpoint.GET_NAWS_DUMP, params, BmltDataFormat.CSV);
  }

  /**
   * Get server information
   */
  async getServerInfo(): Promise<ServerInfo> {
    const result = await this.makeRequest<ServerInfo[]>(BmltEndpoint.GET_SERVER_INFO);
    return result[0];
  }

  /**
   * Get server coverage area
   */
  async getCoverageArea(): Promise<CoverageArea> {
    const result = await this.makeRequest<CoverageArea[]>(BmltEndpoint.GET_COVERAGE_AREA);
    return result[0];
  }

  /**
   * Geocode an address using the built-in geocoding service
   */
  async geocodeAddress(address: string, options?: Partial<GeocodeOptions>) {
    if (!this.geocodingService) {
      throw new Error('Geocoding is not enabled. Initialize client with enableGeocoding: true');
    }

    return this.geocodingService.geocode(address, options);
  }

  /**
   * Reverse geocode coordinates to an address
   */
  async reverseGeocode(coordinates: Coordinates, options?: Partial<GeocodeOptions>) {
    if (!this.geocodingService) {
      throw new Error('Geocoding is not enabled. Initialize client with enableGeocoding: true');
    }

    return this.geocodingService.reverseGeocode(coordinates, options);
  }

  /**
   * Get the server URL
   */
  getServerURL(): string {
    return this.serverURL;
  }

  /**
   * Update the server URL
   */
  setServerURL(url: string): void {
    this.serverURL = validateServerURL(url);
  }

  /**
   * Get the default data format
   */
  getDefaultFormat(): BmltDataFormat {
    return this.defaultFormat;
  }

  /**
   * Set the default data format
   */
  setDefaultFormat(format: BmltDataFormat): void {
    this.defaultFormat = format;
  }

  /**
   * Get geocoding service statistics
   */
  getGeocodingStats() {
    if (!this.geocodingService) {
      return null;
    }

    return {
      queueSize: this.geocodingService.getQueueSize(),
      pendingCount: this.geocodingService.getPendingCount(),
    };
  }

  /**
   * Clear the geocoding queue
   */
  clearGeocodingQueue(): void {
    if (this.geocodingService) {
      this.geocodingService.clearQueue();
    }
  }

  /**
   * Get the current user agent string
   */
  getUserAgent(): string {
    return this.userAgent;
  }

  /**
   * Set the user agent string for HTTP requests
   */
  setUserAgent(userAgent: string): void {
    if (!userAgent || userAgent.trim().length === 0) {
      throw new Error('User agent must be a non-empty string');
    }
    this.userAgent = userAgent.trim();

    // Also update the geocoding service user agent if it exists
    if (this.geocodingService) {
      this.geocodingService.setUserAgent(this.userAgent);
    }
  }

  /**
   * Get the current timeout setting
   */
  getTimeout(): number {
    return this.timeout;
  }

  /**
   * Set the timeout for HTTP requests
   */
  setTimeout(timeout: number): void {
    if (!Number.isInteger(timeout) || timeout <= 0) {
      throw new Error('Timeout must be a positive integer');
    }
    this.timeout = timeout;
  }
}
