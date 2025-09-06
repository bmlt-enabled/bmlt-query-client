/**
 * Base types and enums for BMLT API
 */

export enum BmltDataFormat {
  JSON = 'json',
  JSONP = 'jsonp',
  TSML = 'tsml',
  CSV = 'csv',
}

export enum BmltEndpoint {
  GET_SEARCH_RESULTS = 'GetSearchResults',
  GET_FORMATS = 'GetFormats',
  GET_SERVICE_BODIES = 'GetServiceBodies',
  GET_CHANGES = 'GetChanges',
  GET_FIELD_KEYS = 'GetFieldKeys',
  GET_FIELD_VALUES = 'GetFieldValues',
  GET_NAWS_DUMP = 'GetNAWSDump',
  GET_SERVER_INFO = 'GetServerInfo',
  GET_COVERAGE_AREA = 'GetCoverageArea',
}

export enum Weekday {
  SUNDAY = 1,
  MONDAY = 2,
  TUESDAY = 3,
  WEDNESDAY = 4,
  THURSDAY = 5,
  FRIDAY = 6,
  SATURDAY = 7,
}

export enum VenueType {
  IN_PERSON = 1,
  VIRTUAL = 2,
  HYBRID = 3,
}

export enum SortKey {
  WEEKDAY = 'weekday',
  TIME = 'time',
  TOWN = 'town',
  STATE = 'state',
  WEEKDAY_STATE = 'weekday_state',
}

export enum Language {
  ENGLISH = 'en',
  GERMAN = 'de',
  DANISH = 'dk',
  SPANISH = 'es',
  PERSIAN = 'fa',
  FRENCH = 'fr',
  ITALIAN = 'it',
  POLISH = 'pl',
  PORTUGUESE = 'pt',
  SWEDISH = 'sv',
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface BmltError extends Error {
  statusCode?: number;
  response?: unknown;
}

export interface GeocodeOptions {
  retryCount?: number;
  timeout?: number;
  userAgent?: string;
  /** Country code for region bias (e.g., 'us', 'ca', 'gb') */
  countryCode?: string;
  /** Viewbox for region bias [minLon, minLat, maxLon, maxLat] */
  viewbox?: [number, number, number, number];
  /** Bounded search - restrict results to viewbox */
  bounded?: boolean;
}

export interface RateLimitOptions {
  intervalCap?: number;
  interval?: number;
  carryoverConcurrencyCount?: boolean;
  concurrency?: number;
}
