/**
 * Response types for BMLT API endpoints
 */

import { Coordinates } from './base';

export interface Meeting {
  /** Meeting ID */
  id_bigint: string;

  /** Weekday (1=Sunday, 7=Saturday) */
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

  /** Shared group ID */
  shared_group_id_bigint?: string;

  /** Meeting formats (comma-separated format key strings, e.g. "O,D,NS,FD") */
  formats: string;

  /** Meeting formats (comma-separated format IDs) */
  format_shared_id_list?: string;

  /** Language enum (e.g. "en") */
  lang_enum?: string;

  /** Meeting comments */
  comments?: string;

  /** Virtual meeting URL */
  virtual_meeting_link?: string;

  /** Virtual meeting additional info */
  virtual_meeting_additional_info?: string;

  /** Phone meeting number (may be empty string) */
  phone_meeting_number: string;

  /** Bus lines serving the meeting location (may be empty string) */
  bus_lines: string;

  /** Train lines serving the meeting location (may be empty string) */
  train_lines: string;

  /** Primary contact name (only returned to authenticated admins) */
  contact_name_1?: string;

  /** Secondary contact name (only returned to authenticated admins) */
  contact_name_2?: string;

  /** Primary contact phone (only returned to authenticated admins) */
  contact_phone_1?: string;

  /** Secondary contact phone (only returned to authenticated admins) */
  contact_phone_2?: string;

  /** Primary contact email (only returned to authenticated admins) */
  contact_email_1?: string;

  /** Secondary contact email (only returned to authenticated admins) */
  contact_email_2?: string;

  /** Admin notes (only returned to authenticated admins) */
  admin_notes?: string;

  /** Root server URI (for aggregator mode) */
  root_server_uri?: string;

  /** Distance from search point in km (undefined when not a geographic search) */
  distance_in_km?: number;

  /** Distance from search point in miles (undefined when not a geographic search) */
  distance_in_miles?: number;
}

export interface Format {
  /** Format ID */
  id: string;

  /** Format key string */
  key_string: string;

  /** Format name */
  name_string: string;

  /** Format description */
  description_string: string;

  /** Language */
  lang: string;

  /** World format ID (may be empty string) */
  world_id: string;

  /** Format type enum (may be empty string) */
  format_type_enum: string;

  /** Root server URI (for aggregator mode) */
  root_server_uri?: string;
}

export interface ServiceBody {
  /** Service body ID */
  id: string;

  /** Service body name */
  name: string;

  /** Service body description (may be empty string) */
  description: string;

  /** Service body type */
  type: string;

  /** Service body URL (may be empty string) */
  url: string;

  /** Help line (may be empty string) */
  helpline: string;

  /** World service committee code (may be empty string) */
  world_id: string;

  /** Parent service body ID ("0" for root service bodies) */
  parent_id: string;

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
  /** Server version (e.g. "4.2.0") */
  version: string;

  /** Server version as integer (e.g. 4002000) */
  versionInt: number;

  /** Supported languages, comma-separated (e.g. "da,de,el,en,es") */
  langs: string;

  /** Native language code (e.g. "en") */
  nativeLang: string;

  /** Map center longitude */
  centerLongitude: number;

  /** Map center latitude */
  centerLatitude: number;

  /** Default map zoom level */
  centerZoom: number;

  /** Default meeting duration (HH:MM:SS) */
  defaultDuration: string;

  /** Region bias for geocoding (e.g. "us") */
  regionBias: string;

  /** Character set (e.g. "UTF-8") */
  charSet: string;

  /** Distance units ("mi" or "km") */
  distanceUnits: string;

  /** Semantic admin enabled flag (0 or 1) */
  semanticAdmin: number;

  /** Number of changes tracked per meeting */
  changesPerMeeting: number;

  /** Comma-separated list of states/provinces with meetings */
  meeting_states_and_provinces: string;

  /** Comma-separated list of counties/sub-provinces with meetings */
  meeting_counties_and_sub_provinces: string;

  /** Comma-separated list of meeting fields available in search results */
  available_keys: string;

  /** Google Maps API key */
  google_api_key: string;

  /** Database migration version */
  dbVersion: string;

  /** Database table prefix */
  dbPrefix: string;

  /** PHP version running on the server */
  phpVersion: string;

  /** Whether automatic geocoding is enabled */
  auto_geocoding_enabled: boolean;

  /** Whether county auto-geocoding is enabled */
  county_auto_geocoding_enabled: boolean;

  /** Whether ZIP auto-geocoding is enabled */
  zip_auto_geocoding_enabled: boolean;

  /** Git commit hash of the server build */
  commit: string;

  /** Whether new meetings default to closed status */
  default_closed_status: boolean;

  /** Whether aggregator mode is enabled */
  aggregator_mode_enabled: boolean;
}

export interface CoverageArea {
  /** Northwest corner longitude */
  nw_corner_longitude: number;

  /** Northwest corner latitude */
  nw_corner_latitude: number;

  /** Southeast corner longitude */
  se_corner_longitude: number;

  /** Southeast corner latitude */
  se_corner_latitude: number;
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

/**
 * Combined response when get_used_formats=true is passed to GetSearchResults.
 * The BMLT API wraps the response in an object with separate meetings and formats arrays
 * instead of returning a bare meetings array.
 */
export interface MeetingsWithFormats {
  /** Meetings matching the search criteria */
  meetings: Meeting[];
  /** Only the formats actually referenced by the returned meetings */
  formats: Format[];
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
