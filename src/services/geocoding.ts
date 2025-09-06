/**
 * Nominatim geocoding service with retry logic and rate limiting
 */

import pRetry from 'p-retry';
import PQueue from 'p-queue';
import { GeocodeResult, GeocodeOptions, RateLimitOptions, BmltError, Coordinates } from '../types';
import { BmltQueryError, BmltErrorType, ErrorHandler } from '../utils/errors';

export interface NominatimResponse {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    house_number?: string;
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
  };
  importance?: number;
  boundingbox: string[];
}

export class GeocodingService {
  private baseURL: string;
  private queue: PQueue;
  private readonly defaultOptions: Required<Omit<GeocodeOptions, 'viewbox'>> & {
    viewbox?: [number, number, number, number];
  };

  constructor(options: GeocodeOptions & RateLimitOptions = {}) {
    const {
      retryCount = 3,
      timeout = 10000,
      userAgent = 'bmlt-query-client/1.0.0',
      countryCode = 'us',
      viewbox,
      bounded = false,
      intervalCap = 1,
      interval = 1000, // 1 second between requests
      concurrency = 1,
      carryoverConcurrencyCount = false,
      ...rateLimitOptions
    } = options;

    this.defaultOptions = {
      retryCount,
      timeout,
      userAgent,
      countryCode,
      viewbox,
      bounded,
    };

    this.baseURL = 'https://nominatim.openstreetmap.org';

    this.queue = new PQueue({
      intervalCap,
      interval,
      concurrency,
      carryoverConcurrencyCount,
      ...rateLimitOptions,
    });
  }

  /**
   * Make a fetch request with timeout and error handling
   */
  private async fetchWithTimeout<T>(url: string, timeout: number, userAgent: string): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': userAgent,
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        if (response.status === 429) {
          const error: BmltError = new Error('Rate limit exceeded for geocoding service');
          error.name = 'RateLimitError';
          error.statusCode = 429;
          throw error;
        }

        if (response.status >= 400) {
          const error: BmltError = new Error(
            `Geocoding service error: ${response.status} ${response.statusText}`
          );
          error.name = 'GeocodingError';
          error.statusCode = response.status;
          throw error;
        }
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        const timeoutError: BmltError = new Error('Request timeout during geocoding');
        timeoutError.name = 'TimeoutError';
        throw timeoutError;
      }

      if (error instanceof TypeError) {
        const networkError: BmltError = new Error('Network error occurred during geocoding');
        networkError.name = 'NetworkError';
        throw networkError;
      }

      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Geocode an address using Nominatim
   */
  async geocode(address: string, options: Partial<GeocodeOptions> = {}): Promise<GeocodeResult> {
    const geocodeOptions = { ...this.defaultOptions, ...options };

    return this.queue.add(async (): Promise<GeocodeResult> => {
      return pRetry(
        async () => {
          try {
            // Build search parameters with region bias
            const searchParams: Record<string, string | number> = {
              q: address,
              format: 'json',
              addressdetails: 1,
              limit: 1,
              dedupe: 1,
            };

            // Add country code bias if specified
            if (geocodeOptions.countryCode) {
              searchParams.countrycodes = geocodeOptions.countryCode;
            }

            // Add viewbox if specified
            if (geocodeOptions.viewbox) {
              searchParams.viewbox = geocodeOptions.viewbox.join(',');
              if (geocodeOptions.bounded) {
                searchParams.bounded = 1;
              }
            }

            // Build URL with parameters
            const searchUrl = new URL(`${this.baseURL}/search`);
            Object.entries(searchParams).forEach(([key, value]) => {
              searchUrl.searchParams.append(key, String(value));
            });

            const response = await this.fetchWithTimeout<NominatimResponse[]>(
              searchUrl.toString(),
              geocodeOptions.timeout,
              geocodeOptions.userAgent
            );

            if (!response || response.length === 0) {
              throw new BmltQueryError(
                BmltErrorType.GEOCODING_ERROR,
                `No results found for address: ${address}`
              );
            }

            // Always take the first result (most relevant based on search parameters)
            const result = response[0];
            const coordinates: Coordinates = {
              latitude: parseFloat(result.lat),
              longitude: parseFloat(result.lon),
            };

            // Validate coordinates
            if (isNaN(coordinates.latitude) || isNaN(coordinates.longitude)) {
              const error: BmltError = new Error(
                'Invalid coordinates received from geocoding service'
              );
              error.name = 'GeocodingError';
              throw error;
            }

            if (
              coordinates.latitude < -90 ||
              coordinates.latitude > 90 ||
              coordinates.longitude < -180 ||
              coordinates.longitude > 180
            ) {
              const error: BmltError = new Error('Coordinates out of valid range');
              error.name = 'GeocodingError';
              throw error;
            }

            return {
              coordinates,
              display_name: result.display_name,
              confidence: result.importance,
              address: result.address
                ? {
                    house_number: result.address.house_number,
                    road: result.address.road,
                    neighbourhood: result.address.neighbourhood,
                    suburb: result.address.suburb,
                    city: result.address.city || result.address.town || result.address.village,
                    county: result.address.county,
                    state: result.address.state,
                    postcode: result.address.postcode,
                    country: result.address.country,
                  }
                : undefined,
            };
          } catch (error) {
            // Re-throw errors from fetchWithTimeout or validation
            throw error;
          }
        },
        {
          retries: geocodeOptions.retryCount,
          factor: 2,
          minTimeout: 1000,
          maxTimeout: 10000,
          onFailedAttempt: error => {
            console.warn(
              `Geocoding attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left. Error: ${error.message}`
            );
          },
        }
      );
    }) as Promise<GeocodeResult>;
  }

  /**
   * Batch geocode multiple addresses
   */
  async batchGeocode(
    addresses: string[],
    options: Partial<GeocodeOptions> = {}
  ): Promise<GeocodeResult[]> {
    const promises = addresses.map(address =>
      this.geocode(address, options).catch(error => {
        console.warn(`Failed to geocode address "${address}":`, error.message);
        return null;
      })
    );

    const results = await Promise.all(promises);
    return results.filter((result): result is GeocodeResult => result !== null);
  }

  /**
   * Reverse geocode coordinates to an address
   */
  async reverseGeocode(
    coordinates: Coordinates,
    options: Partial<GeocodeOptions> = {}
  ): Promise<GeocodeResult> {
    const geocodeOptions = { ...this.defaultOptions, ...options };

    return this.queue.add(async (): Promise<GeocodeResult> => {
      return pRetry(
        async () => {
          try {
            // Build URL with parameters
            const reverseUrl = new URL(`${this.baseURL}/reverse`);
            reverseUrl.searchParams.append('lat', String(coordinates.latitude));
            reverseUrl.searchParams.append('lon', String(coordinates.longitude));
            reverseUrl.searchParams.append('format', 'json');
            reverseUrl.searchParams.append('addressdetails', '1');

            const response = await this.fetchWithTimeout<NominatimResponse>(
              reverseUrl.toString(),
              geocodeOptions.timeout,
              geocodeOptions.userAgent
            );

            if (!response) {
              const error: BmltError = new Error(
                `No results found for coordinates: ${coordinates.latitude}, ${coordinates.longitude}`
              );
              error.name = 'GeocodingError';
              throw error;
            }

            const result = response;

            return {
              coordinates: {
                latitude: parseFloat(result.lat),
                longitude: parseFloat(result.lon),
              },
              display_name: result.display_name,
              confidence: result.importance,
              address: result.address
                ? {
                    house_number: result.address.house_number,
                    road: result.address.road,
                    neighbourhood: result.address.neighbourhood,
                    suburb: result.address.suburb,
                    city: result.address.city || result.address.town || result.address.village,
                    county: result.address.county,
                    state: result.address.state,
                    postcode: result.address.postcode,
                    country: result.address.country,
                  }
                : undefined,
            };
          } catch (error) {
            // Re-throw errors from fetchWithTimeout
            throw error;
          }
        },
        {
          retries: geocodeOptions.retryCount,
          factor: 2,
          minTimeout: 1000,
          maxTimeout: 10000,
        }
      );
    }) as Promise<GeocodeResult>;
  }

  /**
   * Get the current queue size
   */
  getQueueSize(): number {
    return this.queue.size;
  }

  /**
   * Get the number of pending operations
   */
  getPendingCount(): number {
    return this.queue.pending;
  }

  /**
   * Clear the queue
   */
  clearQueue(): void {
    this.queue.clear();
  }

  /**
   * Set concurrency limit
   */
  setConcurrency(concurrency: number): void {
    this.queue.concurrency = concurrency;
  }
}
