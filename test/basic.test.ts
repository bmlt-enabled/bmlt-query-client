/**
 * Basic integration tests using the NYC demo server
 */

import { describe, test, expect } from 'vitest';
import { BmltClient, Weekday, VenueType, BmltQueryError } from '../src/index';

describe('BMLT Query Client - Basic Tests', () => {
  const client = new BmltClient({
    rootServerURL: 'https://latest.aws.bmlt.app/main_server',
    timeout: 15000 // 15 second timeout for tests
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
      page_size: 5
    });
    
    expect(Array.isArray(virtualMeetings)).toBe(true);
    virtualMeetings.forEach(meeting => {
      expect(meeting.venue_type).toBe(VenueType.VIRTUAL);
    });
  });

  test('should search for meetings on specific weekdays', async () => {
    const mondayMeetings = await client.searchMeetings({
      weekdays: Weekday.MONDAY,
      page_size: 5
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
      searchParams: { page_size: 5 }
    });
    
    expect(Array.isArray(meetings)).toBe(true);
    meetings.forEach(meeting => {
      expect(meeting.distance_in_miles).toBeDefined();
      expect(parseFloat(meeting.distance_in_miles?.toString() || '0')).toBeLessThanOrEqual(2);
    });
  });

  test('should search meetings by coordinates', async () => {
    const meetings = await client.searchMeetingsByCoordinates(
      { latitude: 40.7580, longitude: -73.9855 }, // Times Square
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
});
