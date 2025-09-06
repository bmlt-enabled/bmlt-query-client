/**
 * BMLT Query Client - A TypeScript client for BMLT servers with built-in geocoding
 */

// Main client classes
export { BmltClient } from './client/bmlt-client';
export type { BmltClientOptions } from './client/bmlt-client';
export { MeetingQueryBuilder, QuickSearch } from './client/query-builder';

// Services
export { GeocodingService } from './services/geocoding';
export type { NominatimResponse } from './services/geocoding';

// Utilities
export * from './utils/url-builder';
export * from './utils/errors';

// Type definitions
export * from './types';
