/**
 * Fluent query builder for BMLT meeting searches
 */

import {
  SearchResultsParams,
  Meeting,
  Weekday,
  VenueType,
  SortKey,
  Language,
  BmltDataFormat,
  Coordinates,
} from '../types';
import { BmltClient } from './bmlt-client';

export class MeetingQueryBuilder {
  private params: SearchResultsParams = {};
  private client: BmltClient;

  constructor(client: BmltClient) {
    this.client = client;
  }

  /**
   * Include or exclude specific meeting IDs
   */
  meetingIds(ids: number | number[], exclude = false): this {
    if (Array.isArray(ids)) {
      this.params.meeting_ids = exclude ? ids.map(id => -id) : ids;
    } else {
      this.params.meeting_ids = exclude ? -ids : ids;
    }
    return this;
  }

  /**
   * Include meetings on specific weekdays
   */
  onWeekdays(...days: Weekday[]): this {
    this.params.weekdays = days.length === 1 ? days[0] : days;
    return this;
  }

  /**
   * Exclude meetings on specific weekdays
   */
  notOnWeekdays(...days: Weekday[]): this {
    const excludeDays = days.map(day => -day);
    this.params.weekdays = excludeDays.length === 1 ? excludeDays[0] : excludeDays;
    return this;
  }

  /**
   * Filter by venue types
   */
  venueTypes(...types: VenueType[]): this {
    this.params.venue_types = types.length === 1 ? types[0] : types;
    return this;
  }

  /**
   * Include only in-person meetings
   */
  inPersonOnly(): this {
    return this.venueTypes(VenueType.IN_PERSON);
  }

  /**
   * Include only virtual meetings
   */
  virtualOnly(): this {
    return this.venueTypes(VenueType.VIRTUAL);
  }

  /**
   * Include only hybrid meetings
   */
  hybridOnly(): this {
    return this.venueTypes(VenueType.HYBRID);
  }

  /**
   * Include virtual and hybrid meetings
   */
  virtualOrHybrid(): this {
    return this.venueTypes(VenueType.VIRTUAL, VenueType.HYBRID);
  }

  /**
   * Filter by meeting formats
   */
  formats(formatIds: number | number[], exclude = false): this {
    if (Array.isArray(formatIds)) {
      this.params.formats = exclude ? formatIds.map(id => -id) : formatIds;
    } else {
      this.params.formats = exclude ? -formatIds : formatIds;
    }
    return this;
  }

  /**
   * Use OR logic for format matching instead of AND
   */
  anyFormat(): this {
    this.params.formats_comparison_operator = 'OR';
    return this;
  }

  /**
   * Filter by service bodies
   */
  serviceBodies(serviceBodyIds: number | number[], exclude = false): this {
    if (Array.isArray(serviceBodyIds)) {
      this.params.services = exclude ? serviceBodyIds.map(id => -id) : serviceBodyIds;
    } else {
      this.params.services = exclude ? -serviceBodyIds : serviceBodyIds;
    }
    return this;
  }

  /**
   * Include child service bodies
   */
  includeChildServiceBodies(): this {
    this.params.recursive = true;
    return this;
  }

  /**
   * Search for specific text
   */
  searchText(text: string): this {
    this.params.SearchString = text;
    return this;
  }

  /**
   * Meetings starting after specific time
   */
  startingAfter(hours: number, minutes = 0): this {
    this.params.StartsAfterH = hours;
    this.params.StartsAfterM = minutes;
    return this;
  }

  /**
   * Meetings starting before specific time
   */
  startingBefore(hours: number, minutes = 0): this {
    this.params.StartsBeforeH = hours;
    this.params.StartsBeforeM = minutes;
    return this;
  }

  /**
   * Meetings ending before specific time
   */
  endingBefore(hours: number, minutes = 0): this {
    this.params.EndsBeforeH = hours;
    this.params.EndsBeforeM = minutes;
    return this;
  }

  /**
   * Minimum meeting duration
   */
  minimumDuration(hours = 0, minutes = 0): this {
    if (hours > 0) this.params.MinDurationH = hours;
    if (minutes > 0) this.params.MinDurationM = minutes;
    return this;
  }

  /**
   * Maximum meeting duration
   */
  maximumDuration(hours = 0, minutes = 0): this {
    if (hours > 0) this.params.MaxDurationH = hours;
    if (minutes > 0) this.params.MaxDurationM = minutes;
    return this;
  }

  /**
   * Search within geographic area by coordinates
   */
  nearCoordinates(coordinates: Coordinates, radiusMiles?: number, radiusKm?: number): this {
    this.params.lat_val = coordinates.latitude;
    this.params.long_val = coordinates.longitude;

    if (radiusMiles !== undefined) {
      this.params.geo_width = radiusMiles;
    } else if (radiusKm !== undefined) {
      this.params.geo_width_km = radiusKm;
    }

    return this;
  }

  /**
   * Search for specific field value
   */
  fieldValue(fieldKey: string, value: string): this {
    this.params.meeting_key = fieldKey;
    this.params.meeting_key_value = value;
    return this;
  }

  /**
   * Return only specific fields
   */
  selectFields(...fields: string[]): this {
    this.params.data_field_key = fields.join(',');
    return this;
  }

  /**
   * Sort results by specific fields
   */
  sortBy(...fields: string[]): this {
    this.params.sort_keys = fields.join(',');
    return this;
  }

  /**
   * Sort by predefined aliases
   */
  sortByAlias(alias: SortKey): this {
    this.params.sort_key = alias;
    return this;
  }

  /**
   * Sort by distance (requires geographic search)
   */
  sortByDistance(): this {
    this.params.sort_results_by_distance = true;
    return this;
  }

  /**
   * Set pagination
   */
  paginate(pageSize: number, pageNumber = 1): this {
    this.params.page_size = pageSize;
    this.params.page_num = pageNumber;
    return this;
  }

  /**
   * Include unpublished meetings
   */
  includeUnpublished(): this {
    this.params.advanced_published = 0;
    return this;
  }

  /**
   * Include only unpublished meetings
   */
  unpublishedOnly(): this {
    this.params.advanced_published = -1;
    return this;
  }

  /**
   * Set language for format names
   */
  language(lang: Language): this {
    this.params.lang_enum = lang;
    return this;
  }

  /**
   * Set response format
   */
  format(format: BmltDataFormat): this {
    this.params.format = format;
    return this;
  }

  /**
   * Include formats used in search results
   */
  includeFormats(): this {
    this.params.get_used_formats = true;
    return this;
  }

  /**
   * Return only formats (requires includeFormats)
   */
  formatsOnly(): this {
    this.params.get_used_formats = true;
    this.params.get_formats_only = true;
    return this;
  }

  /**
   * Filter by root server IDs (aggregator mode)
   */
  rootServerIds(serverIds: number | number[], exclude = false): this {
    if (Array.isArray(serverIds)) {
      this.params.root_server_ids = exclude ? serverIds.map(id => -id) : serverIds;
    } else {
      this.params.root_server_ids = exclude ? -serverIds : serverIds;
    }
    return this;
  }

  /**
   * Get the current query parameters
   */
  getParams(): SearchResultsParams {
    return { ...this.params };
  }

  /**
   * Reset the query builder
   */
  reset(): this {
    this.params = {};
    return this;
  }

  /**
   * Clone the current query builder
   */
  clone(): MeetingQueryBuilder {
    const cloned = new MeetingQueryBuilder(this.client);
    cloned.params = { ...this.params };
    return cloned;
  }

  /**
   * Execute the search and return results
   */
  async execute(): Promise<Meeting[]> {
    return this.client.searchMeetings(this.params);
  }

  /**
   * Execute the search by geocoding an address first
   */
  async executeNearAddress(
    address: string,
    radiusMiles?: number,
    radiusKm?: number,
    sortByDistance = true
  ): Promise<Meeting[]> {
    return this.client.searchMeetingsByAddress({
      address,
      radiusMiles,
      radiusKm,
      sortByDistance,
      searchParams: this.params,
    });
  }
}

/**
 * Convenience methods for common search patterns
 */
export class QuickSearch {
  private client: BmltClient;

  constructor(client: BmltClient) {
    this.client = client;
  }

  /**
   * Search for today's meetings
   */
  today(): MeetingQueryBuilder {
    const today = new Date().getDay();
    const weekday = today === 0 ? Weekday.SUNDAY : (today as Weekday);
    return new MeetingQueryBuilder(this.client).onWeekdays(weekday);
  }

  /**
   * Search for weekend meetings
   */
  weekend(): MeetingQueryBuilder {
    return new MeetingQueryBuilder(this.client).onWeekdays(Weekday.SATURDAY, Weekday.SUNDAY);
  }

  /**
   * Search for weekday meetings
   */
  weekdays(): MeetingQueryBuilder {
    return new MeetingQueryBuilder(this.client).onWeekdays(
      Weekday.MONDAY,
      Weekday.TUESDAY,
      Weekday.WEDNESDAY,
      Weekday.THURSDAY,
      Weekday.FRIDAY
    );
  }

  /**
   * Search for evening meetings (after 5 PM)
   */
  evening(): MeetingQueryBuilder {
    return new MeetingQueryBuilder(this.client).startingAfter(17);
  }

  /**
   * Search for morning meetings (before 12 PM)
   */
  morning(): MeetingQueryBuilder {
    return new MeetingQueryBuilder(this.client).startingBefore(12);
  }

  /**
   * Search for virtual meetings only
   */
  virtual(): MeetingQueryBuilder {
    return new MeetingQueryBuilder(this.client).virtualOnly();
  }

  /**
   * Search for in-person meetings only
   */
  inPerson(): MeetingQueryBuilder {
    return new MeetingQueryBuilder(this.client).inPersonOnly();
  }

  /**
   * Search by meeting name or location
   */
  byText(searchText: string): MeetingQueryBuilder {
    return new MeetingQueryBuilder(this.client).searchText(searchText);
  }
}
