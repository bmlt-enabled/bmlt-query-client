# BMLT Query Client

A comprehensive TypeScript client for querying BMLT (Basic Meeting List Tool) servers with built-in geocoding support using Nominatim. This client provides a modern, type-safe interface to all BMLT API endpoints with automatic rate limiting, retry logic, and geographic search capabilities.

## Features

- 🚀 **Full TypeScript support** with comprehensive type definitions
- 🌍 **Built-in geocoding** using Nominatim (replaces broken StringSearchIsAnAddress)
- 🔄 **Automatic retry logic** with exponential backoff
- ⚡ **Rate limiting** to respect API limits
- 🎯 **Fluent query builder** for complex searches
- 📡 **All BMLT endpoints** supported
- 🛡️ **Comprehensive error handling**
- 📖 **Extensive documentation** and examples

## Installation

```bash
npm install bmlt-query-client
```

## Quick Start

```typescript
import { BmltClient, Weekday, VenueType } from 'bmlt-query-client';

// Initialize the client with NYC demo server
const client = new BmltClient({
  rootServerURL: 'https://latest.aws.bmlt.app/main_server'
});

// Search for meetings
const meetings = await client.searchMeetings({
  weekdays: [Weekday.MONDAY, Weekday.WEDNESDAY],
  venue_types: VenueType.VIRTUAL
});

// Search by address (with automatic geocoding)
const nearbyMeetings = await client.searchMeetingsByAddress({
  address: 'Times Square, New York, NY',
  radiusMiles: 2,
  sortByDistance: true
});
```

## API Reference

### BmltClient

The main client class for interacting with BMLT servers.

#### Constructor Options

```typescript
interface BmltClientOptions {
  rootServerURL: string;              // BMLT root server URL
  defaultFormat?: BmltDataFormat;     // Default response format (JSON)
  timeout?: number;                   // Request timeout in ms (30000)
  userAgent?: string;                 // Custom user agent
  geocodingOptions?: GeocodeOptions;  // Nominatim geocoding options
  enableGeocoding?: boolean;          // Enable geocoding service (true)
}
```

#### Basic Methods

```typescript
// Search for meetings with parameters
const meetings = await client.searchMeetings({
  weekdays: [Weekday.SATURDAY, Weekday.SUNDAY],
  venue_types: VenueType.IN_PERSON,
  geo_width: 5,
  lat_val: 40.7580, // Times Square
  long_val: -73.9855
});

// Get meeting formats
const formats = await client.getFormats({
  lang_enum: Language.ENGLISH
});

// Get service bodies
const serviceBodies = await client.getServiceBodies({
  recursive: true
});

// Get server information
const serverInfo = await client.getServerInfo();
```

#### Geographic Search Methods

```typescript
// Search by address (with geocoding)
const meetings = await client.searchMeetingsByAddress({
  address: 'Central Park, New York, NY',
  radiusKm: 3,
  searchParams: {
    venue_types: VenueType.IN_PERSON
  }
});

// Search by coordinates
const meetings = await client.searchMeetingsByCoordinates(
  { latitude: 40.7614, longitude: -73.9776 }, // Times Square
  2, // radius in miles
  undefined, // radius in km
  { weekdays: Weekday.MONDAY }
);

// Geocode an address
const result = await client.geocodeAddress('Brooklyn Bridge, New York, NY');
console.log(result.coordinates); // { latitude: 40.7061, longitude: -73.9969 }
```

### Query Builder

Use the fluent query builder for complex searches:

```typescript
import { MeetingQueryBuilder, QuickSearch } from 'bmlt-query-client';

const client = new BmltClient({ rootServerURL: 'https://latest.aws.bmlt.app/main_server' });

// Using the query builder
const meetings = await new MeetingQueryBuilder(client)
  .virtualOnly()
  .onWeekdays(Weekday.MONDAY, Weekday.WEDNESDAY, Weekday.FRIDAY)
  .startingAfter(18, 0) // 6:00 PM
  .endingBefore(21, 0)  // 9:00 PM
  .sortByDistance()
  .paginate(20, 1)
  .execute();

// Or execute with address geocoding
const nearbyMeetings = await new MeetingQueryBuilder(client)
  .inPersonOnly()
  .minimumDuration(1, 0) // At least 1 hour
  .executeNearAddress('Central Park, New York, NY', 2); // 2 miles radius

// Quick search patterns
const quickSearch = new QuickSearch(client);

const todaysMeetings = await quickSearch.today().execute();
const weekendMeetings = await quickSearch.weekend().execute();
const eveningMeetings = await quickSearch.evening().execute();
const virtualMeetings = await quickSearch.virtual().execute();
```

### Available Query Builder Methods

```typescript
// Meeting IDs
.meetingIds(123) or .meetingIds([123, 456])
.meetingIds([123, 456], true) // exclude these IDs

// Time-based filters
.onWeekdays(Weekday.MONDAY, Weekday.FRIDAY)
.notOnWeekdays(Weekday.SATURDAY, Weekday.SUNDAY)
.startingAfter(18, 30) // 6:30 PM
.startingBefore(12, 0) // Before noon
.endingBefore(21, 0)   // Before 9 PM

// Duration filters
.minimumDuration(1, 0) // At least 1 hour
.maximumDuration(2, 0) // At most 2 hours

// Venue types
.inPersonOnly()
.virtualOnly()
.hybridOnly()
.virtualOrHybrid()
.venueTypes(VenueType.IN_PERSON, VenueType.HYBRID)

// Formats
.formats([17, 54]) // Include these formats
.formats([11], true) // Exclude format 11
.anyFormat() // Use OR logic for formats

// Geographic
.nearCoordinates({ latitude: 40.7128, longitude: -74.0060 }, 10) // 10 miles
.sortByDistance()

// Text search
.searchText('Step Study')

// Service bodies
.serviceBodies([123, 456])
.includeChildServiceBodies()

// Sorting and pagination
.sortBy('meeting_name', 'start_time')
.sortByAlias(SortKey.WEEKDAY_STATE)
.paginate(25, 2) // 25 per page, page 2

// Response format
.selectFields('meeting_name', 'location_text', 'start_time')
.includeFormats()
.language(Language.SPANISH)

// Publication status
.includeUnpublished()
.unpublishedOnly()

// Utilities
.getParams() // Get current parameters
.reset()     // Reset all parameters
.clone()     // Clone the builder
```

## Error Handling

The client provides comprehensive error handling with specific error types:

```typescript
import { BmltQueryError, BmltErrorType } from 'bmlt-query-client';

try {
  const meetings = await client.searchMeetings();
} catch (error) {
  if (error instanceof BmltQueryError) {
    console.log(`Error type: ${error.type}`);
    console.log(`User message: ${error.getUserMessage()}`);
    console.log(`Is retryable: ${error.isRetryable()}`);
    
    if (error.isType(BmltErrorType.GEOCODING_ERROR)) {
      console.log('Address could not be geocoded');
    }
    
    if (error.isType(BmltErrorType.RATE_LIMIT_ERROR)) {
      console.log('Rate limit exceeded, wait and retry');
    }
  }
}
```

### Error Types

- `API_ERROR` - General API errors
- `NETWORK_ERROR` - Network connectivity issues
- `VALIDATION_ERROR` - Invalid input parameters
- `GEOCODING_ERROR` - Address geocoding failures
- `RATE_LIMIT_ERROR` - Rate limits exceeded
- `TIMEOUT_ERROR` - Request timeouts
- `AUTHENTICATION_ERROR` - Authentication failures
- `SERVER_ERROR` - Server-side errors (5xx)
- `CLIENT_ERROR` - Client-side errors (4xx)
- `CONFIGURATION_ERROR` - Invalid configuration

## Configuration

### Geocoding Options

```typescript
const client = new BmltClient({
  rootServerURL: 'https://example.org',
  geocodingOptions: {
    // Retry options
    retryCount: 3,
    timeout: 10000,
    userAgent: 'MyApp/1.0.0',
    
    // Region bias (defaults to 'us')
    countryCode: 'ca',   // Bias results to Canada
    viewbox: [-125, 25, -65, 50], // [minLon, minLat, maxLon, maxLat]
    bounded: true,       // Restrict results to viewbox
    
    // Rate limiting (Nominatim allows 1 request per second)
    intervalCap: 1,      // Max requests per interval
    interval: 1000,      // Interval in ms
    concurrency: 1       // Max concurrent requests
  }
});
```

### Custom HTTP Configuration

```typescript
const client = new BmltClient({
  rootServerURL: 'https://example.org',
  timeout: 60000,      // 60 second timeout
  userAgent: 'MyApp/2.0.0 (contact@example.com)'
});
```

### Region Bias for Geocoding

The geocoding service supports region bias to improve address matching accuracy:

```typescript
// Default US bias
const usClient = new BmltClient({
  rootServerURL: 'https://example.org'
  // countryCode defaults to 'us'
});

// Canadian bias
const caClient = new BmltClient({
  rootServerURL: 'https://example.org',
  geocodingOptions: {
    countryCode: 'ca'
  }
});

// Geographic bounding box (North America)
const boundedClient = new BmltClient({
  rootServerURL: 'https://example.org',
  geocodingOptions: {
    viewbox: [-140, 25, -50, 70], // [west, south, east, north]
    bounded: true // Restrict results to this area
  }
});
```

## Data Types

### Enums

```typescript
// Weekdays (1-7)
enum Weekday {
  SUNDAY = 1, MONDAY = 2, TUESDAY = 3, WEDNESDAY = 4,
  THURSDAY = 5, FRIDAY = 6, SATURDAY = 7
}

// Venue types
enum VenueType {
  IN_PERSON = 1, VIRTUAL = 2, HYBRID = 3
}

// Response formats
enum BmltDataFormat {
  JSON = 'json', JSONP = 'jsonp', TSML = 'tsml', CSV = 'csv'
}

// Languages
enum Language {
  ENGLISH = 'en', GERMAN = 'de', SPANISH = 'es', FRENCH = 'fr',
  ITALIAN = 'it', PORTUGUESE = 'pt', SWEDISH = 'sv', // ... and more
}
```

### Response Interfaces

```typescript
interface Meeting {
  id_bigint: string;
  meeting_name: string;
  weekday_tinyint: number;
  venue_type: number;
  start_time: string;
  duration_time: string;
  location_text: string;
  latitude: number;
  longitude: number;
  // ... and many more fields
}

interface Format {
  shared_id_bigint: string;
  key_string: string;
  name_string: string;
  description_string: string;
}

interface ServiceBody {
  id: string;
  name: string;
  type: string;
  // ... additional fields
}
```

## Advanced Usage

### Custom Geocoding Service

```typescript
import { GeocodingService } from 'bmlt-query-client';

const geocoder = new GeocodingService({
  retryCount: 5,
  timeout: 15000,
  userAgent: 'MyApp/1.0.0',
  intervalCap: 1,
  interval: 1000
});

// Batch geocode multiple addresses
const addresses = [
  '123 Main St, Boston, MA',
  '456 Oak Ave, Seattle, WA',
  '789 Pine St, Portland, OR'
];

const results = await geocoder.batchGeocode(addresses);
results.forEach(result => {
  if (result) {
    console.log(`${result.display_name}: ${result.coordinates.latitude}, ${result.coordinates.longitude}`);
  }
});

// Reverse geocoding
const address = await geocoder.reverseGeocode({
  latitude: 40.7128,
  longitude: -74.0060
});
console.log(address.display_name); // "New York, NY, USA"
```

### Server Information and Capabilities

```typescript
// Get server info
const info = await client.getServerInfo();
console.log(`Server version: ${info.version}`);
console.log(`Available endpoints: ${info.availableEndpoints.join(', ')}`);

// Get coverage area
const coverage = await client.getCoverageArea();
console.log(`Coverage: ${coverage.north_latitude}, ${coverage.south_latitude}`);

// Get available field keys
const fieldKeys = await client.getFieldKeys();
fieldKeys.forEach(field => {
  console.log(`${field.key}: ${field.description}`);
});
```

### Working with Changes

```typescript
// Get changes in date range
const changes = await client.getChanges({
  start_date: '2024-01-01',
  end_date: '2024-01-31',
  service_body_id: 123
});

changes.forEach(change => {
  console.log(`${change.change_date}: ${change.change_description}`);
});
```

### Pagination

```typescript
// Get all meetings with pagination
async function getAllMeetings() {
  const allMeetings = [];
  let pageNum = 1;
  const pageSize = 100;

  while (true) {
    const meetings = await client.searchMeetings({
      page_size: pageSize,
      page_num: pageNum
    });

    if (meetings.length === 0) break;
    
    allMeetings.push(...meetings);
    pageNum++;

    if (meetings.length < pageSize) break; // Last page
  }

  return allMeetings;
}
```

## Best Practices

1. **Rate Limiting**: The client includes built-in rate limiting for geocoding. For API requests, be mindful of server load.

2. **Error Handling**: Always handle errors appropriately and use the specific error types for better user experience.

3. **Caching**: Consider caching results for formats, service bodies, and server info as they don't change frequently.

4. **Pagination**: Use pagination for large result sets to avoid overwhelming the server.

5. **Geocoding**: The Nominatim service has usage policies. Be respectful and don't abuse it. Consider implementing your own caching layer for frequently geocoded addresses. The geocoding service always returns the first (most relevant) result and defaults to US region bias.

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
