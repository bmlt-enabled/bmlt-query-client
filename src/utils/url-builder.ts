/**
 * Utility functions for building BMLT API URLs and handling parameters
 */

import { BmltDataFormat, BmltEndpoint } from '../types';

export interface URLBuilderOptions {
  rootServerURL: string;
  format: BmltDataFormat;
  endpoint: BmltEndpoint;
  parameters?: Record<string, unknown>;
}

/**
 * Build a BMLT API URL with parameters
 */
export function buildBmltURL(options: URLBuilderOptions): string {
  const { rootServerURL, format, endpoint, parameters = {} } = options;

  // Ensure root server URL ends with slash
  const baseURL = rootServerURL.endsWith('/') ? rootServerURL : `${rootServerURL}/`;

  // Build the base endpoint URL
  const endpointURL = `${baseURL}client_interface/${format}/`;

  // Convert parameters to query string
  const queryParams = new URLSearchParams();
  queryParams.set('switcher', endpoint);

  // Add other parameters
  Object.entries(parameters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        // Handle array parameters
        value.forEach((item, index) => {
          if (typeof item === 'number' || typeof item === 'string') {
            queryParams.append(`${key}[]`, item.toString());
          }
        });
      } else if (typeof value === 'boolean') {
        queryParams.set(key, value ? '1' : '0');
      } else {
        queryParams.set(key, value.toString());
      }
    }
  });

  return `${endpointURL}?${queryParams.toString()}`;
}

/**
 * Normalize parameter values for BMLT API
 */
export function normalizeParameters(params: Record<string, unknown>): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      // Handle array parameters with positive/negative values
      if (Array.isArray(value)) {
        normalized[key] = value.map(item => {
          if (typeof item === 'number') {
            return item;
          } else if (typeof item === 'string') {
            const num = parseFloat(item);
            return isNaN(num) ? item : num;
          }
          return item;
        });
      }
      // Handle boolean parameters
      else if (typeof value === 'boolean') {
        normalized[key] = value;
      }
      // Handle numeric strings
      else if (typeof value === 'string') {
        const num = parseFloat(value);
        if (!isNaN(num) && isFinite(num)) {
          normalized[key] = num;
        } else {
          normalized[key] = value;
        }
      }
      // Keep other values as-is
      else {
        normalized[key] = value;
      }
    }
  });

  return normalized;
}

/**
 * Validate endpoint/format combinations
 */
export function validateEndpointFormat(endpoint: BmltEndpoint, format: BmltDataFormat): void {
  const validCombinations: Record<BmltEndpoint, BmltDataFormat[]> = {
    [BmltEndpoint.GET_SEARCH_RESULTS]: [
      BmltDataFormat.JSON,
      BmltDataFormat.JSONP,
      BmltDataFormat.TSML,
    ],
    [BmltEndpoint.GET_FORMATS]: [BmltDataFormat.JSON, BmltDataFormat.JSONP],
    [BmltEndpoint.GET_SERVICE_BODIES]: [BmltDataFormat.JSON, BmltDataFormat.JSONP],
    [BmltEndpoint.GET_CHANGES]: [BmltDataFormat.JSON, BmltDataFormat.JSONP],
    [BmltEndpoint.GET_FIELD_KEYS]: [BmltDataFormat.JSON, BmltDataFormat.JSONP],
    [BmltEndpoint.GET_FIELD_VALUES]: [BmltDataFormat.JSON, BmltDataFormat.JSONP],
    [BmltEndpoint.GET_NAWS_DUMP]: [BmltDataFormat.CSV],
    [BmltEndpoint.GET_SERVER_INFO]: [BmltDataFormat.JSON, BmltDataFormat.JSONP],
    [BmltEndpoint.GET_COVERAGE_AREA]: [BmltDataFormat.JSON, BmltDataFormat.JSONP],
  };

  const validFormats = validCombinations[endpoint];
  if (!validFormats.includes(format)) {
    throw new Error(
      `Invalid format '${format}' for endpoint '${endpoint}'. Valid formats: ${validFormats.join(', ')}`
    );
  }
}

/**
 * Clean and validate a root server URL
 */
export function validateRootServerURL(url: string): string {
  try {
    const urlObj = new URL(url);
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      throw new Error('Root server URL must use http or https protocol');
    }

    // Return the URL without trailing slash for consistency
    return urlObj.href.replace(/\/$/, '');
  } catch (error) {
    throw new Error(`Invalid root server URL: ${url}`);
  }
}

/**
 * Extract numeric IDs from various parameter formats
 */
export function extractIds(value: unknown): number[] {
  if (typeof value === 'number') {
    return [value];
  }

  if (typeof value === 'string') {
    // Handle comma-separated values
    return value
      .split(',')
      .map(id => parseInt(id.trim(), 10))
      .filter(id => !isNaN(id));
  }

  if (Array.isArray(value)) {
    return value
      .map(item => (typeof item === 'number' ? item : parseInt(String(item), 10)))
      .filter(id => !isNaN(id));
  }

  return [];
}

/**
 * Format time values for BMLT API
 */
export function formatTimeValue(
  hours?: number,
  minutes?: number
): { hours?: number; minutes?: number } {
  const result: { hours?: number; minutes?: number } = {};

  if (typeof hours === 'number') {
    if (hours < 0 || hours > 23) {
      throw new Error('Hours must be between 0 and 23');
    }
    result.hours = hours;
  }

  if (typeof minutes === 'number') {
    if (minutes < 0 || minutes > 59) {
      throw new Error('Minutes must be between 0 and 59');
    }
    result.minutes = minutes;
  }

  return result;
}

/**
 * Validate coordinate values
 */
export function validateCoordinates(latitude: number, longitude: number): void {
  if (typeof latitude !== 'number' || isNaN(latitude)) {
    throw new Error('Latitude must be a valid number');
  }

  if (typeof longitude !== 'number' || isNaN(longitude)) {
    throw new Error('Longitude must be a valid number');
  }

  if (latitude < -90 || latitude > 90) {
    throw new Error('Latitude must be between -90 and 90 degrees');
  }

  if (longitude < -180 || longitude > 180) {
    throw new Error('Longitude must be between -180 and 180 degrees');
  }
}

/**
 * Validate radius values
 */
export function validateRadius(radius: number): void {
  if (typeof radius !== 'number' || isNaN(radius)) {
    throw new Error('Radius must be a valid number');
  }

  if (radius <= 0) {
    throw new Error('Radius must be greater than 0');
  }
}

/**
 * Convert miles to kilometers
 */
export function milesToKilometers(miles: number): number {
  return miles * 1.60934;
}

/**
 * Convert kilometers to miles
 */
export function kilometersToMiles(km: number): number {
  return km / 1.60934;
}
