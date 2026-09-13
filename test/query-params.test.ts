/**
 * Offline unit tests for query-parameter serialization and the fluent builder,
 * focused on the virtual-meeting params (no network).
 */

import { describe, test, expect } from 'vitest';
import {
  buildBmltURL,
  BmltClient,
  BmltDataFormat,
  BmltEndpoint,
  MeetingQueryBuilder,
  QuickSearch,
  VenueType,
} from '../src/index';

// A client is only needed to construct the builder; getParams() never hits the network.
const client = new BmltClient({ serverURL: 'https://example.org/main_server' });

describe('buildBmltURL — virtual-meeting params', () => {
  test('serializes venue_types as a repeated array and the aggregator params as scalars', () => {
    const url = buildBmltURL({
      serverURL: 'https://example.org/main_server',
      format: BmltDataFormat.JSON,
      endpoint: BmltEndpoint.GET_SEARCH_RESULTS,
      parameters: {
        venue_types: [VenueType.VIRTUAL, VenueType.HYBRID],
        sort_results_by_next_start: true,
        next_start_grace_minutes: 15,
        target_time_zone: 'America/New_York',
      },
    });

    // Decode %5B%5D / %2F so the assertions read the way BMLT receives them.
    const decoded = decodeURIComponent(url);

    // Repeated array form is mandatory: the aggregator truncates the comma form
    // `venue_types=2,3` to just `2`, dropping hybrids.
    expect(decoded).toContain('venue_types[]=2');
    expect(decoded).toContain('venue_types[]=3');
    expect(decoded).not.toContain('venue_types=2,3');

    expect(decoded).toContain('sort_results_by_next_start=1');
    expect(decoded).toContain('next_start_grace_minutes=15');
    expect(decoded).toContain('target_time_zone=America/New_York');
  });

  test('omits a false boolean sort flag only when unset; false serializes as 0', () => {
    const url = buildBmltURL({
      serverURL: 'https://example.org/main_server',
      format: BmltDataFormat.JSON,
      endpoint: BmltEndpoint.GET_SEARCH_RESULTS,
      parameters: { sort_results_by_next_start: false },
    });
    expect(decodeURIComponent(url)).toContain('sort_results_by_next_start=0');
  });
});

describe('MeetingQueryBuilder — virtual-meeting helpers', () => {
  test('sortByNextStart() sets the flag and optional grace window', () => {
    const params = new MeetingQueryBuilder(client).sortByNextStart(15).getParams();
    expect(params.sort_results_by_next_start).toBe(true);
    expect(params.next_start_grace_minutes).toBe(15);
  });

  test('sortByNextStart() without a grace window leaves it unset', () => {
    const params = new MeetingQueryBuilder(client).sortByNextStart().getParams();
    expect(params.sort_results_by_next_start).toBe(true);
    expect(params.next_start_grace_minutes).toBeUndefined();
  });

  test('targetTimeZone() sets the IANA zone', () => {
    const params = new MeetingQueryBuilder(client).targetTimeZone('Europe/London').getParams();
    expect(params.target_time_zone).toBe('Europe/London');
  });

  test('virtualOrHybrid() selects venue types 2 and 3', () => {
    const params = new MeetingQueryBuilder(client).virtualOrHybrid().getParams();
    expect(params.venue_types).toEqual([VenueType.VIRTUAL, VenueType.HYBRID]);
  });
});

describe('QuickSearch.virtualSoonest()', () => {
  test('combines virtual+hybrid with next-start ordering', () => {
    const params = new QuickSearch(client).virtualSoonest().getParams();
    expect(params.venue_types).toEqual([VenueType.VIRTUAL, VenueType.HYBRID]);
    expect(params.sort_results_by_next_start).toBe(true);
    expect(params.target_time_zone).toBeUndefined();
  });

  test('applies a target time zone when provided', () => {
    const params = new QuickSearch(client).virtualSoonest('America/Chicago').getParams();
    expect(params.target_time_zone).toBe('America/Chicago');
  });
});
