/**
 * Basic usage examples using the NYC demo BMLT server
 */

import { BmltClient, Weekday, VenueType, Language, MeetingQueryBuilder, QuickSearch } from '../src';

// Initialize client with NYC demo server
const client = new BmltClient({
  rootServerURL: 'https://latest.aws.bmlt.app/main_server'
});

async function basicExamples() {
  console.log('=== Basic BMLT Query Client Examples ===\n');

  try {
    // Example 1: Get all meetings
    console.log('1. Getting all meetings...');
    const allMeetings = await client.searchMeetings({ page_size: 5 });
    console.log(`Found ${allMeetings.length} meetings (first 5):`);
    allMeetings.forEach(meeting => {
      console.log(`  - ${meeting.meeting_name} (${meeting.location_text})`);
    });
    console.log();

    // Example 2: Get virtual meetings
    console.log('2. Getting virtual meetings...');
    const virtualMeetings = await client.searchMeetings({
      venue_types: VenueType.VIRTUAL,
      page_size: 5
    });
    console.log(`Found ${virtualMeetings.length} virtual meetings:`);
    virtualMeetings.forEach(meeting => {
      console.log(`  - ${meeting.meeting_name} at ${meeting.start_time}`);
      if (meeting.virtual_meeting_link) {
        console.log(`    Link: ${meeting.virtual_meeting_link}`);
      }
    });
    console.log();

    // Example 3: Get meetings for specific days
    console.log('3. Getting Monday and Wednesday meetings...');
    const weekdayMeetings = await client.searchMeetings({
      weekdays: [Weekday.MONDAY, Weekday.WEDNESDAY],
      page_size: 5
    });
    console.log(`Found ${weekdayMeetings.length} meetings:`);
    weekdayMeetings.forEach(meeting => {
      const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][meeting.weekday_tinyint - 1];
      console.log(`  - ${dayName}: ${meeting.meeting_name} at ${meeting.start_time}`);
    });
    console.log();

    // Example 4: Search by coordinates (Times Square area)
    console.log('4. Getting meetings near Times Square...');
    const nearbyMeetings = await client.searchMeetingsByCoordinates(
      { latitude: 40.7580, longitude: -73.9855 }, // Times Square
      2, // 2 miles radius
      undefined,
      { page_size: 5 }
    );
    console.log(`Found ${nearbyMeetings.length} meetings within 2 miles of Times Square:`);
    nearbyMeetings.forEach(meeting => {
      console.log(`  - ${meeting.meeting_name} (${meeting.distance_in_miles?.toFixed(1)} miles)`);
      console.log(`    ${meeting.location_text}`);
    });
    console.log();

    // Example 5: Search by address with geocoding
    console.log('5. Getting meetings near Central Park...');
    const centralParkMeetings = await client.searchMeetingsByAddress({
      address: 'Central Park, New York, NY',
      radiusMiles: 1.5,
      searchParams: { page_size: 3 }
    });
    console.log(`Found ${centralParkMeetings.length} meetings within 1.5 miles of Central Park:`);
    centralParkMeetings.forEach(meeting => {
      console.log(`  - ${meeting.meeting_name}`);
      console.log(`    ${meeting.location_text} (${meeting.distance_in_miles?.toFixed(1)} miles)`);
    });
    console.log();

    // Example 6: Get server information
    console.log('6. Server information...');
    const serverInfo = await client.getServerInfo();
    console.log(`Server version: ${serverInfo.version}`);
    console.log(`Available languages: ${serverInfo.langs?.join(', ')}`);
    console.log();

    // Example 7: Get meeting formats
    console.log('7. Available meeting formats...');
    const formats = await client.getFormats({ lang_enum: Language.ENGLISH });
    console.log(`Found ${formats.length} formats:`);
    formats.slice(0, 5).forEach(format => {
      console.log(`  - ${format.key_string}: ${format.name_string}`);
    });
    console.log();

    // Example 8: Get service bodies
    console.log('8. Service bodies...');
    const serviceBodies = await client.getServiceBodies();
    console.log(`Found ${serviceBodies.length} service bodies:`);
    serviceBodies.slice(0, 3).forEach(sb => {
      console.log(`  - ${sb.name} (${sb.type})`);
    });
    console.log();

  } catch (error) {
    console.error('Error in basic examples:', error);
  }
}

async function queryBuilderExamples() {
  console.log('=== Query Builder Examples ===\n');

  try {
    // Example 1: Using the fluent query builder
    console.log('1. Evening virtual meetings using query builder...');
    const eveningVirtual = await new MeetingQueryBuilder(client)
      .virtualOnly()
      .startingAfter(17, 0) // After 5 PM
      .endingBefore(21, 0)  // Before 9 PM
      .sortByDistance()
      .paginate(5, 1)
      .execute();

    console.log(`Found ${eveningVirtual.length} evening virtual meetings:`);
    eveningVirtual.forEach(meeting => {
      console.log(`  - ${meeting.meeting_name} at ${meeting.start_time}`);
    });
    console.log();

    // Example 2: Weekend meetings near specific location
    console.log('2. Weekend meetings near Brooklyn Bridge...');
    const weekendMeetings = await new MeetingQueryBuilder(client)
      .onWeekdays(Weekday.SATURDAY, Weekday.SUNDAY)
      .inPersonOnly()
      .executeNearAddress('Brooklyn Bridge, New York, NY', 3);

    console.log(`Found ${weekendMeetings.length} weekend meetings near Brooklyn Bridge:`);
    weekendMeetings.forEach(meeting => {
      const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][meeting.weekday_tinyint - 1];
      console.log(`  - ${dayName}: ${meeting.meeting_name}`);
      console.log(`    ${meeting.location_text} (${meeting.distance_in_miles?.toFixed(1)} miles)`);
    });
    console.log();

    // Example 3: Using QuickSearch
    console.log('3. Quick search examples...');
    const quickSearch = new QuickSearch(client);

    const todaysMeetings = await quickSearch.today().paginate(3, 1).execute();
    console.log(`Today's meetings (${todaysMeetings.length}):`);
    todaysMeetings.forEach(meeting => {
      console.log(`  - ${meeting.meeting_name} at ${meeting.start_time}`);
    });

    const morningMeetings = await quickSearch.morning().paginate(3, 1).execute();
    console.log(`\nMorning meetings (${morningMeetings.length}):`);
    morningMeetings.forEach(meeting => {
      console.log(`  - ${meeting.meeting_name} at ${meeting.start_time}`);
    });
    console.log();

  } catch (error) {
    console.error('Error in query builder examples:', error);
  }
}

async function geocodingExamples() {
  console.log('=== Geocoding Examples ===\n');

  try {
    // Example 1: Direct geocoding
    console.log('1. Geocoding famous NYC locations...');
    const locations = [
      'Times Square, New York, NY',
      'Central Park, New York, NY',
      'Brooklyn Bridge, New York, NY',
      'Statue of Liberty, New York, NY'
    ];

    for (const location of locations) {
      try {
        const result = await client.geocodeAddress(location);
        console.log(`${location}:`);
        console.log(`  Coordinates: ${result.coordinates.latitude}, ${result.coordinates.longitude}`);
        console.log(`  Full name: ${result.display_name}`);
      } catch (error: any) {
        console.log(`  Failed to geocode: ${error.message}`);
      }
    }
    console.log();

    // Example 2: Reverse geocoding
    console.log('2. Reverse geocoding NYC coordinates...');
    const coords = { latitude: 40.7614, longitude: -73.9776 }; // Times Square
    const address = await client.reverseGeocode(coords);
    console.log(`Coordinates ${coords.latitude}, ${coords.longitude}:`);
    console.log(`  Address: ${address.display_name}`);
    console.log();

  } catch (error) {
    console.error('Error in geocoding examples:', error);
  }
}

async function errorHandlingExample() {
  console.log('=== Error Handling Example ===\n');

  try {
    // Try to geocode an invalid address
    await client.geocodeAddress('Invalid Address That Does Not Exist Anywhere');
  } catch (error: any) {
    console.log('Caught geocoding error:');
    console.log(`  Type: ${error.type || error.name}`);
    console.log(`  Message: ${error.message}`);
    console.log(`  User message: ${error.getUserMessage?.() || 'N/A'}`);
    console.log(`  Is retryable: ${error.isRetryable?.() || 'N/A'}`);
  }

  try {
    // Try to connect to an invalid server
    const badClient = new BmltClient({
      rootServerURL: 'https://invalid-server-that-does-not-exist.com',
      timeout: 5000
    });
    await badClient.searchMeetings();
  } catch (error: any) {
    console.log('\nCaught network error:');
    console.log(`  Type: ${error.type || error.name}`);
    console.log(`  Message: ${error.message}`);
    console.log(`  Is retryable: ${error.isRetryable?.() || 'N/A'}`);
  }
  console.log();
}

// Run all examples
async function runAllExamples() {
  await basicExamples();
  await queryBuilderExamples();
  await geocodingExamples();
  await errorHandlingExample();
  
  console.log('=== All examples completed! ===');
}

// Export for use in other files
export {
  basicExamples,
  queryBuilderExamples,
  geocodingExamples,
  errorHandlingExample,
  runAllExamples
};

// Run examples if this file is executed directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}
