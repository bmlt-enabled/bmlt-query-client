/**
 * Response types for BMLT API endpoints
 */

import { Coordinates } from './base';

export interface Meeting {
  /** Meeting ID */
  id_bigint: string;

  /** Weekday (1-7) */
  weekday_tinyint: number;

  /** Venue type (1=In-person, 2=Virtual, 3=Hybrid) */
  venue_type: number;

  /** Start time (24-hour format HH:MM:SS) */
  start_time: string;

  /** Duration time (HH:MM:SS) */
  duration_time: string;

  /** Time zone */
  time_zone?: string;

  /** Meeting name */
  meeting_name: string;

  /** Location text */
  location_text: string;

  /** Location info */
  location_info?: string;

  /** Location street address */
  location_street?: string;

  /** Location neighborhood */
  location_neighborhood?: string;

  /** Location borough */
  location_municipality?: string;

  /** Location city/town */
  location_city_subsection?: string;

  /** Location postal code */
  location_postal_code_1?: string;

  /** Location province/state */
  location_province?: string;

  /** Location sub province/county */
  location_sub_province?: string;

  /** Location nation */
  location_nation?: string;

  /** Latitude */
  latitude: number;

  /** Longitude */
  longitude: number;

  /** Published status (0=unpublished, 1=published) */
  published: number;

  /** Email contact */
  email_contact?: string;

  /** World Committee Code */
  worldid_mixed?: string;

  /** Service body ID */
  service_body_bigint: string;

  /** Service body Name */
  service_body_name?: string;

  /** Meeting formats (comma-separated format IDs) */
  format_shared_id_list?: string;

  /** Meeting comments */
  comments?: string;

  /** Virtual meeting URL */
  virtual_meeting_link?: string;

  /** Virtual meeting additional info */
  virtual_meeting_additional_info?: string;

  /** Root server URI (for aggregator mode) */
  root_server_uri?: string;

  /** Distance from search point (when using geographic search) */
  distance_in_km?: number;

  /** Distance in miles from search point */
  distance_in_miles?: number;
}

export interface Format {
  /** Format ID */
  shared_id_bigint: string;

  /** Format key string */
  key_string: string;

  /** Format name */
  name_string: string;

  /** Format description */
  description_string: string;

  /** Language */
  lang: string;

  /** Root server URI (for aggregator mode) */
  root_server_uri?: string;
}

export interface ServiceBody {
  /** Service body ID */
  id: string;

  /** Service body name */
  name: string;

  /** Service body description */
  description?: string;

  /** Service body type */
  type: string;

  /** Service body URL */
  url?: string;

  /** Help line */
  helpline?: string;

  /** World service committee code */
  world_id?: string;

  /** Parent service body ID */
  parent_id?: string;

  /** Root server URI (for aggregator mode) */
  root_server_uri?: string;
}

export interface Change {
  /** Change ID */
  change_id: string;

  /** Meeting ID affected by change */
  meeting_id: string;

  /** Service body ID */
  service_body_id: string;

  /** User ID who made change */
  user_id: string;

  /** User name who made change */
  user_name: string;

  /** Change date (YYYY-MM-DD) */
  change_date: string;

  /** Change time (HH:MM:SS) */
  change_time: string;

  /** Change type */
  change_type: string;

  /** Change description */
  change_description: string;

  /** Meeting name before change */
  original_meeting_name?: string;

  /** Meeting name after change */
  changed_meeting_name?: string;

  /** JSON object with detailed changes */
  json_data?: unknown;

  /** Root server URI (for aggregator mode) */
  root_server_uri?: string;
}

export interface ServerInfo {
  /** Server version */
  version: string;

  /** Available endpoints */
  availableEndpoints: string[];

  /** Supported formats */
  supportedFormats: string[];

  /** Supported languages */
  langs: string[];

  /** Native language */
  nativeLang: string;

  /** Server name */
  name?: string;

  /** Server description */
  description?: string;

  /** Coverage area information */
  coverageArea?: CoverageArea;
}

export interface CoverageArea {
  /** North boundary */
  north_latitude: number;

  /** South boundary */
  south_latitude: number;

  /** East boundary */
  east_longitude: number;

  /** West boundary */
  west_longitude: number;
}

export interface FieldKey {
  /** Field key */
  key: string;

  /** Field description */
  description: string;
}

export interface FieldValue {
  /** Field key */
  key: string;

  /** Field value */
  value: string;

  /** Meeting ID */
  meeting_id: string;
}

export interface GeocodeResult {
  /** Geocoded coordinates */
  coordinates: Coordinates;

  /** Display name of the geocoded address */
  display_name: string;

  /** Geocoding confidence (0-1) */
  confidence?: number;

  /** Address components */
  address?: {
    house_number?: string;
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}
