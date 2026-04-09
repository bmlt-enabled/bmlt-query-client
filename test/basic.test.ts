/**
 * Basic integration tests using the NYC demo server
 */

import { describe, test, expect } from 'vitest';
import { BmltClient, Weekday, VenueType, BmltQueryError } from '../src/index';

describe('BMLT Query Client - Basic Tests', () => {
  const client = new BmltClient({
    serverURL: 'https://latest.aws.bmlt.app/main_server',
    timeout: 15000, // 15 second timeout for tests
  });

  test('should get server info', async () => {
    const serverInfo = await client.getServerInfo();
    expect(serverInfo).toBeDefined();
    // API returns an array, check the first element
    if (Array.isArray(serverInfo)) {
      expect(serverInfo.length).toBeGreaterThan(0);
      expect(serverInfo[0]).toHaveProperty('version');
    } else {
      expect(serverInfo).toHaveProperty('version');
    }
  });

  test('should get meeting formats', async () => {
    const formats = await client.getFormats();
    expect(Array.isArray(formats)).toBe(true);
    expect(formats.length).toBeGreaterThan(0);

    if (formats.length > 0) {
      expect(formats[0]).toHaveProperty('id'); // API uses 'id' not 'shared_id_bigint'
      expect(formats[0]).toHaveProperty('key_string');
      expect(formats[0]).toHaveProperty('name_string');
    }
  });

  test('should get service bodies', async () => {
    const serviceBodies = await client.getServiceBodies();
    expect(Array.isArray(serviceBodies)).toBe(true);
    expect(serviceBodies.length).toBeGreaterThan(0);

    if (serviceBodies.length > 0) {
      expect(serviceBodies[0]).toHaveProperty('id');
      expect(serviceBodies[0]).toHaveProperty('name');
    }
  });

  test('should search for meetings', async () => {
    const meetings = await client.searchMeetings({ page_size: 10 });
    expect(Array.isArray(meetings)).toBe(true);
    expect(meetings.length).toBeGreaterThan(0);
    expect(meetings.length).toBeLessThanOrEqual(10);

    if (meetings.length > 0) {
      const meeting = meetings[0];
      expect(meeting).toHaveProperty('id_bigint');
      expect(meeting).toHaveProperty('meeting_name');
      expect(meeting).toHaveProperty('weekday_tinyint');
      expect(meeting).toHaveProperty('start_time');
      expect(meeting).toHaveProperty('latitude');
      expect(meeting).toHaveProperty('longitude');
    }
  });

  test('should search for virtual meetings', async () => {
    const virtualMeetings = await client.searchMeetings({
      venue_types: VenueType.VIRTUAL,
      page_size: 5,
    });

    expect(Array.isArray(virtualMeetings)).toBe(true);
    virtualMeetings.forEach(meeting => {
      expect(meeting.venue_type).toBe(VenueType.VIRTUAL);
    });
  });

  test('should search for meetings on specific weekdays', async () => {
    const mondayMeetings = await client.searchMeetings({
      weekdays: Weekday.MONDAY,
      page_size: 5,
    });

    expect(Array.isArray(mondayMeetings)).toBe(true);
    mondayMeetings.forEach(meeting => {
      expect(parseInt(meeting.weekday_tinyint.toString())).toBe(Weekday.MONDAY);
    });
  });

  test('should geocode a NYC address', async () => {
    const result = await client.geocodeAddress('Times Square, New York, NY');

    expect(result).toBeDefined();
    expect(result.coordinates).toBeDefined();
    expect(result.coordinates.latitude).toBeCloseTo(40.758, 1);
    expect(result.coordinates.longitude).toBeCloseTo(-73.985, 1);
    expect(result.display_name).toContain('New York');
  });

  test('should search meetings by address with geocoding', async () => {
    const meetings = await client.searchMeetingsByAddress({
      address: 'Central Park, New York, NY',
      radiusMiles: 2,
      searchParams: { page_size: 5 },
    });

    expect(Array.isArray(meetings)).toBe(true);
    meetings.forEach(meeting => {
      expect(meeting.distance_in_miles).toBeDefined();
      expect(parseFloat(meeting.distance_in_miles?.toString() || '0')).toBeLessThanOrEqual(2);
    });
  });

  test('should search meetings by coordinates', async () => {
    const meetings = await client.searchMeetingsByCoordinates(
      { latitude: 40.758, longitude: -73.9855 }, // Times Square
      1, // 1 mile radius
      undefined,
      { page_size: 5 }
    );

    expect(Array.isArray(meetings)).toBe(true);
    meetings.forEach(meeting => {
      expect(meeting.distance_in_miles).toBeDefined();
      expect(parseFloat(meeting.distance_in_miles?.toString() || '0')).toBeLessThanOrEqual(1);
    });
  });

  test('should fetch meetings and formats in a single request', async () => {
    const result = await client.searchMeetingsWithFormats({ page_size: 10 });

    expect(result).toHaveProperty('meetings');
    expect(result).toHaveProperty('formats');
    expect(Array.isArray(result.meetings)).toBe(true);
    expect(Array.isArray(result.formats)).toBe(true);
    expect(result.meetings.length).toBeGreaterThan(0);
    expect(result.formats.length).toBeGreaterThan(0);

    // Every format returned should be referenced by at least one meeting
    const usedFormatIds = new Set(
      result.meetings.flatMap(m =>
        (m.format_shared_id_list ?? '')
          .split(',')
          .map(id => id.trim())
          .filter(Boolean)
      )
    );
    result.formats.forEach(fmt => {
      expect(usedFormatIds.has(fmt.id)).toBe(true);
    });
  });

  test('should filter formats with OR (formats_comparison_operator)', async () => {
    const formats = await client.getFormats();
    // Pick two real format ids from the live server
    const ids = formats.slice(0, 2).map(f => parseInt(f.id));
    expect(ids.length).toBe(2);

    const andResults = await client.searchMeetings({ formats: ids, page_size: 50 });
    const orResults = await client.searchMeetings({
      formats: ids,
      formats_comparison_operator: 'OR',
      page_size: 50,
    });

    // OR should be a superset of AND
    expect(orResults.length).toBeGreaterThanOrEqual(andResults.length);

    // Every OR result must reference at least one of the requested formats
    orResults.forEach(meeting => {
      const meetingFormatIds = (meeting.format_shared_id_list ?? '')
        .split(',')
        .map(id => parseInt(id.trim()))
        .filter(n => !isNaN(n));
      expect(ids.some(id => meetingFormatIds.includes(id))).toBe(true);
    });
  });

  test('should get service bodies with recursive children', async () => {
    const all = await client.getServiceBodies();
    // Find a service body that has at least one child
    const parent = all.find(sb => all.some(c => parseInt(c.parent_id) === parseInt(sb.id)));
    if (!parent) return; // server has no hierarchy; skip assertions

    const flat = await client.getServiceBodies({ services: [parseInt(parent.id)] });
    const recursive = await client.getServiceBodies({
      services: [parseInt(parent.id)],
      recursive: true,
    });

    expect(flat.length).toBe(1);
    expect(recursive.length).toBeGreaterThan(1);
    expect(recursive.some(sb => sb.id === parent.id)).toBe(true);
  });

  test('should get service bodies with parents hierarchy', async () => {
    const all = await client.getServiceBodies();
    // Find a child whose parent_id resolves to a real service body
    const child = all.find(
      sb => parseInt(sb.parent_id) > 0 && all.some(p => p.id === sb.parent_id)
    );
    if (!child) return;

    const withParents = await client.getServiceBodies({
      services: [parseInt(child.id)],
      parents: true,
    });

    expect(withParents.length).toBeGreaterThan(1);
    expect(withParents.some(sb => sb.id === child.id)).toBe(true);
    expect(withParents.some(sb => sb.id === child.parent_id)).toBe(true);
  });

  test('should get field keys', async () => {
    const keys = await client.getFieldKeys();
    expect(Array.isArray(keys)).toBe(true);
    expect(keys.length).toBeGreaterThan(0);
    expect(keys[0]).toHaveProperty('key');
  });

  test('should get field values for meeting_name', async () => {
    const values = await client.getFieldValues({ meeting_key: 'meeting_name' });
    expect(Array.isArray(values)).toBe(true);
    expect(values.length).toBeGreaterThan(0);
  });

  test('should get meeting changes within a date range', async () => {
    const end = new Date();
    const start = new Date();
    start.setFullYear(end.getFullYear() - 1);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);

    const changes = await client.getChanges({
      start_date: fmt(start),
      end_date: fmt(end),
    });

    expect(Array.isArray(changes)).toBe(true);
    if (changes.length > 0) {
      expect(changes[0]).toHaveProperty('date_string');
      expect(changes[0]).toHaveProperty('change_type');
    }
  });

  test('should get coverage area', async () => {
    const coverage = await client.getCoverageArea();
    expect(coverage).toBeDefined();
  });

  test.skip('should handle geocoding errors gracefully', async () => {
    await expect(
      client.geocodeAddress('This Is Not A Real Address That Exists Anywhere')
    ).rejects.toThrow(BmltQueryError);
  }, 15000); // 15 second timeout

  test.skip('should handle invalid coordinates', () => {
    expect(() => {
      client.searchMeetingsByCoordinates(
        { latitude: 999, longitude: 999 }, // Invalid coordinates
        5
      );
    }).toThrow('Latitude must be between -90 and 90 degrees');
  });

  test('should handle user agent configuration', () => {
    // Test getting default user agent
    expect(client.getUserAgent()).toBe('bmlt-query-client/1.0.0');

    // Test setting custom user agent
    const customUserAgent = 'my-custom-app/2.1.0';
    client.setUserAgent(customUserAgent);
    expect(client.getUserAgent()).toBe(customUserAgent);

    // Test validation
    expect(() => client.setUserAgent('')).toThrow('User agent must be a non-empty string');
    expect(() => client.setUserAgent('   ')).toThrow('User agent must be a non-empty string');

    // Reset user agent for other tests
    client.setUserAgent('bmlt-query-client/1.0.0');
  });

  test('should handle timeout configuration', () => {
    // Test getting current timeout (set to 15000 for this test client)
    expect(client.getTimeout()).toBe(15000);

    // Test setting custom timeout
    client.setTimeout(60000);
    expect(client.getTimeout()).toBe(60000);

    // Test validation
    expect(() => client.setTimeout(-1)).toThrow('Timeout must be a positive integer');
    expect(() => client.setTimeout(0)).toThrow('Timeout must be a positive integer');
    expect(() => client.setTimeout(1.5)).toThrow('Timeout must be a positive integer');

    // Reset timeout for other tests
    client.setTimeout(15000);
  });
});
