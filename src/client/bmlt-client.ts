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
  validateRootServerURL,
  validateCoordinates,
  validateRadius,
} from '../utils/url-builder';
import { ErrorHandler } from '../utils/errors';

export interface BmltClientOptions {
  /** Root server URL */
  rootServerURL: string;

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
  private geocodingService?: GeocodingService;
  private rootServerURL: string;
  private defaultFormat: BmltDataFormat;

  constructor(options: BmltClientOptions) {
    const {
      rootServerURL,
      defaultFormat = BmltDataFormat.JSON,
      timeout = 30000,
      userAgent = 'bmlt-query-client/1.0.0',
      geocodingOptions = {},
      enableGeocoding = true,
    } = options;

    // Validate and normalize root server URL
    this.rootServerURL = validateRootServerURL(rootServerURL);
    this.defaultFormat = defaultFormat;
    this.timeout = timeout;
    this.userAgent = userAgent;

    // Initialize geocoding service if enabled
    if (enableGeocoding) {
      this.geocodingService = new GeocodingService(geocodingOptions);
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
    let response: Response | undefined;

    try {
      // Validate endpoint/format combination
      validateEndpointFormat(endpoint, format);

      // Build the request URL
      const url = buildBmltURL({
        rootServerURL: this.rootServerURL,
        format,
        endpoint,
        parameters,
      });

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      try {
        // Make the request
        response = await fetch(url, {
          method: 'GET',
          headers: {
            'User-Agent': this.userAgent,
          },
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      // Check if response is ok
      if (!response.ok) {
        throw ErrorHandler.handleFetchError(
          new Error(`HTTP ${response.status}: ${response.statusText}`),
          response
        );
      }

      // Get response text
      const responseText = await response.text();

      // Handle CSV responses
      if (format === BmltDataFormat.CSV) {
        return responseText as T;
      }

      // Handle JSONP responses
      if (format === BmltDataFormat.JSONP) {
        // Extract JSON from JSONP callback
        const callbackName = (parameters.callback as string) || 'callback';
        const jsonMatch = responseText.match(new RegExp(`${callbackName}\\((.+)\\);?$`));

        if (!jsonMatch) {
          throw new Error('Invalid JSONP response format');
        }

        return JSON.parse(jsonMatch[1]) as T;
      }

      // Handle JSON and TSML responses
      if (format === BmltDataFormat.JSON || format === BmltDataFormat.TSML) {
        return JSON.parse(responseText) as T;
      }

      // Fallback - return as text
      return responseText as T;
    } catch (error) {
      throw ErrorHandler.handleFetchError(error, response);
    }
  }

  /**
   * Search for meetings
   */
  async searchMeetings(params: SearchResultsParams = {}): Promise<Meeting[]> {
    const { format = this.defaultFormat, ...searchParams } = params;
    return this.makeRequest<Meeting[]>(BmltEndpoint.GET_SEARCH_RESULTS, searchParams, format);
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
    return this.makeRequest<ServerInfo>(BmltEndpoint.GET_SERVER_INFO);
  }

  /**
   * Get server coverage area
   */
  async getCoverageArea(): Promise<CoverageArea> {
    return this.makeRequest<CoverageArea>(BmltEndpoint.GET_COVERAGE_AREA);
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
   * Get the root server URL
   */
  getRootServerURL(): string {
    return this.rootServerURL;
  }

  /**
   * Update the root server URL
   */
  setRootServerURL(url: string): void {
    this.rootServerURL = validateRootServerURL(url);
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
}
