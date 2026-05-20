/**
 * Unit tests for utils/meetings.ts (offline, no network).
 */

import { describe, test, expect } from 'vitest';
import { countUniqueGroups } from '../src/utils/meetings';
import type { Meeting } from '../src/types';

function makeMeeting(overrides: Partial<Meeting>): Meeting {
  return {
    id_bigint: '1',
    weekday_tinyint: 2,
    venue_type: 1,
    start_time: '19:00:00',
    duration_time: '01:00:00',
    meeting_name: 'Test Group',
    location_text: '',
    latitude: 40.123456,
    longitude: -74.654321,
    published: 1,
    service_body_bigint: '125',
    formats: '',
    phone_meeting_number: '',
    bus_lines: '',
    train_lines: '',
    ...overrides,
  } as Meeting;
}

describe('countUniqueGroups', () => {
  test('returns 0 for empty list', () => {
    expect(countUniqueGroups([])).toBe(0);
  });

  test('counts a single meeting as one group', () => {
    expect(countUniqueGroups([makeMeeting({})])).toBe(1);
  });

  test('collapses multiple weekly meetings of the same group', () => {
    // Same service body, same name, same location, different days → one group.
    const meetings = [
      makeMeeting({ id_bigint: '1', weekday_tinyint: 2 }),
      makeMeeting({ id_bigint: '2', weekday_tinyint: 3 }),
      makeMeeting({ id_bigint: '3', weekday_tinyint: 4 }),
    ];
    expect(countUniqueGroups(meetings)).toBe(1);
  });

  test('splits same-named groups that meet at different locations', () => {
    // Two home groups happen to share a name but meet at different lat/lng.
    // This is the case crouton handles correctly and the old algorithm got wrong.
    const meetings = [
      makeMeeting({ id_bigint: '1', latitude: 40.111111, longitude: -74.222222 }),
      makeMeeting({ id_bigint: '2', latitude: 40.999999, longitude: -74.888888 }),
    ];
    expect(countUniqueGroups(meetings)).toBe(2);
  });

  test('treats meetings in different service bodies as different groups', () => {
    const meetings = [
      makeMeeting({ id_bigint: '1', service_body_bigint: '125' }),
      makeMeeting({ id_bigint: '2', service_body_bigint: '126' }),
    ];
    expect(countUniqueGroups(meetings)).toBe(2);
  });

  test('normalizes meeting names (case + whitespace)', () => {
    const meetings = [
      makeMeeting({ id_bigint: '1', meeting_name: 'Sunrise Group' }),
      makeMeeting({ id_bigint: '2', meeting_name: '  sunrise group  ' }),
      makeMeeting({ id_bigint: '3', meeting_name: 'SUNRISE GROUP' }),
    ];
    expect(countUniqueGroups(meetings)).toBe(1);
  });

  test('rounds coordinates to 6 decimals (matching crouton)', () => {
    // Differences past the 6th decimal should collapse.
    const meetings = [
      makeMeeting({ id_bigint: '1', latitude: 40.1234567, longitude: -74.1234567 }),
      makeMeeting({ id_bigint: '2', latitude: 40.1234568, longitude: -74.1234568 }),
    ];
    expect(countUniqueGroups(meetings)).toBe(1);
  });

  test('uses virtual link to identify virtual groups (venue_type === 2)', () => {
    // Two meetings sharing the same zoom link → one group.
    // Third with a different link → second group.
    const meetings = [
      makeMeeting({
        id_bigint: '1',
        venue_type: 2,
        meeting_name: 'Zoom Group',
        virtual_meeting_link: 'https://zoom.us/j/111',
        virtual_meeting_additional_info: '',
        latitude: 0,
        longitude: 0,
      }),
      makeMeeting({
        id_bigint: '2',
        venue_type: 2,
        meeting_name: 'Zoom Group',
        virtual_meeting_link: 'https://zoom.us/j/111',
        virtual_meeting_additional_info: '',
        latitude: 0,
        longitude: 0,
      }),
      makeMeeting({
        id_bigint: '3',
        venue_type: 2,
        meeting_name: 'Zoom Group',
        virtual_meeting_link: 'https://zoom.us/j/222',
        virtual_meeting_additional_info: '',
        latitude: 0,
        longitude: 0,
      }),
    ];
    expect(countUniqueGroups(meetings)).toBe(2);
  });

  test('treats hybrid (venue_type === 3) like in-person — uses lat/lng', () => {
    // Hybrid with same physical location but different virtual links → one group.
    const meetings = [
      makeMeeting({
        id_bigint: '1',
        venue_type: 3,
        virtual_meeting_link: 'https://zoom.us/j/111',
      }),
      makeMeeting({
        id_bigint: '2',
        venue_type: 3,
        virtual_meeting_link: 'https://zoom.us/j/222',
      }),
    ];
    expect(countUniqueGroups(meetings)).toBe(1);
  });

  test('skips meetings missing service body or name', () => {
    const meetings = [
      makeMeeting({ id_bigint: '1' }),
      makeMeeting({ id_bigint: '2', service_body_bigint: '' }),
      makeMeeting({ id_bigint: '3', meeting_name: '' }),
    ];
    expect(countUniqueGroups(meetings)).toBe(1);
  });
});
