/**
 * Request parameter types for BMLT API endpoints
 */

import { BmltDataFormat, Weekday, VenueType, SortKey, Language } from './base';

export interface BaseSearchParams {
  /** Data format for response */
  format?: BmltDataFormat;
  /** Language code for format names */
  lang_enum?: Language;
  /** JSONP callback function name */
  callback?: string;
}

export interface SearchResultsParams extends BaseSearchParams {
  /** Include specific meeting IDs (positive) or exclude (negative) */
  meeting_ids?: number | number[];
  
  /** Include formats used in search results */
  get_used_formats?: boolean;
  
  /** Return only formats (requires get_used_formats=true) */
  get_formats_only?: boolean;
  
  /** Include meetings on specific days */
  weekdays?: Weekday | Weekday[];
  
  /** Include meetings with specific venue types */
  venue_types?: VenueType | VenueType[];
  
  /** Include meetings with specific formats */
  formats?: number | number[];
  
  /** Use OR logic for format matching (default is AND) */
  formats_comparison_operator?: 'OR';
  
  /** Include meetings from specific service bodies */
  services?: number | number[];
  
  /** Include child service bodies when filtering by services */
  recursive?: boolean;
  
  /** Search for specific text */
  SearchString?: string;
  
  /** Search radius for geographic searches */
  SearchStringRadius?: number;
  
  /** Meetings starting after hour (0-23) */
  StartsAfterH?: number;
  
  /** Meetings starting after minute (0-59) */
  StartsAfterM?: number;
  
  /** Meetings starting before hour (0-23) */
  StartsBeforeH?: number;
  
  /** Meetings starting before minute (0-59) */
  StartsBeforeM?: number;
  
  /** Meetings ending before hour (0-23) */
  EndsBeforeH?: number;
  
  /** Meetings ending before minute (0-59) */
  EndsBeforeM?: number;
  
  /** Minimum duration in hours */
  MinDurationH?: number;
  
  /** Minimum duration in minutes */
  MinDurationM?: number;
  
  /** Maximum duration in hours */
  MaxDurationH?: number;
  
  /** Maximum duration in minutes */
  MaxDurationM?: number;
  
  /** Latitude for geographic search */
  lat_val?: number;
  
  /** Longitude for geographic search */
  long_val?: number;
  
  /** Search radius in miles */
  geo_width?: number;
  
  /** Search radius in kilometers */
  geo_width_km?: number;
  
  /** Sort results by distance when using geographic search */
  sort_results_by_distance?: boolean;
  
  /** Search for specific field value */
  meeting_key?: string;
  
  /** The value to search for */
  meeting_key_value?: string;
  
  /** Return only specific fields (comma-separated) */
  data_field_key?: string;
  
  /** Sort results by specific fields (comma-separated) */
  sort_keys?: string;
  
  /** Use predefined sort aliases */
  sort_key?: SortKey;
  
  /** Number of results per page */
  page_size?: number;
  
  /** Page number (defaults to 1) */
  page_num?: number;
  
  /** Published status: undefined=published only, 0=all, -1=unpublished only */
  advanced_published?: 0 | -1;
  
  /** Include specific root server IDs (for aggregator mode) */
  root_server_ids?: number | number[];
}

export interface GeographicSearchParams {
  /** Address to geocode and search around */
  address: string;
  
  /** Search radius in miles */
  radiusMiles?: number;
  
  /** Search radius in kilometers */
  radiusKm?: number;
  
  /** Sort results by distance */
  sortByDistance?: boolean;
  
  /** Other search parameters */
  searchParams?: Omit<SearchResultsParams, 'lat_val' | 'long_val' | 'geo_width' | 'geo_width_km' | 'sort_results_by_distance'>;
}

export interface FormatsParams extends BaseSearchParams {
  /** Show all formats */
  show_all?: boolean;
  
  /** Array of format IDs to include/exclude */
  format_ids?: number[];
  
  /** Array of format key strings to filter by */
  key_strings?: string[];
}

export interface ServiceBodiesParams extends BaseSearchParams {
  /** Array of service body IDs to include/exclude */
  services?: number[];
  
  /** Include child service bodies */
  recursive?: boolean;
  
  /** Include parent service bodies */
  parents?: boolean;
}

export interface ChangesParams extends BaseSearchParams {
  /** Start date in YYYY-MM-DD format */
  start_date?: string;
  
  /** End date in YYYY-MM-DD format */
  end_date?: string;
  
  /** Specific meeting ID */
  meeting_id?: number;
  
  /** Service body ID */
  service_body_id?: number;
}

export interface FieldValuesParams extends BaseSearchParams {
  /** The field key to get values for (required) */
  meeting_key: string;
  
  /** Comma-separated list of format IDs to limit field values to */
  specific_formats?: string;
  
  /** Include all formats */
  all_formats?: boolean;
}

export interface NAWSDumpParams extends Record<string, unknown> {
  /** Service body ID (required) */
  sb_id: number;
}
