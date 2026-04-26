# BMLT Query Client

[![npm version](https://badge.fury.io/js/bmlt-query-client.svg)](https://badge.fury.io/js/bmlt-query-client)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18.0%2B-green.svg)](https://nodejs.org/)
[![npm](https://img.shields.io/npm/v/bmlt-query-client.svg)](https://www.npmjs.com/package/bmlt-query-client)

A modern TypeScript/JavaScript client for querying BMLT (Basic Meeting List Tool) servers with built-in geocoding support using the native fetch API.

## Demo

[https://bmlt-enabled.github.io/bmlt-query-client/](https://bmlt-enabled.github.io/bmlt-query-client/)

## Features

- 🚀 **Zero dependencies** - Uses native fetch API
- 🏛️ **Complete BMLT API coverage** - All semantic endpoints supported
- 🌍 **Built-in geocoding** - Uses Nominatim for address-to-coordinates conversion
- 🔍 **Fluent query builder** - Chainable API for complex meeting searches
- ⚡ **Rate limiting & retry logic** - Stable operation with automatic retries
- 📱 **Browser ready** - Works in all modern browsers via ES modules
- 🎯 **TypeScript support** - Full type definitions included
- 📦 **ES Module format** - Single optimized browser-compatible build

## Quick Start

### For Browser (ES Modules)

The easiest way to use the BMLT Query Client in the browser is via ES modules:

```html
<script type="module">
  // Import directly from a CDN (when published)
  import { BmltClient, VenueType, QuickSearch } from 'https://cdn.aws.bmlt.app/app.js';

  // Or import from your local build
  // import { BmltClient, VenueType, QuickSearch } from './dist/app.js';

  // Initialize the client
  const client = new BmltClient({
    serverURL: 'https://latest.aws.bmlt.app/main_server', // NYC demo server
  });

  // Search for virtual meetings
  const virtualMeetings = await client.searchMeetings({
    venue_types: VenueType.VIRTUAL,
    page_size: 10,
  });

  // Search meetings by address
  const nearbyMeetings = await client.searchMeetingsByAddress({
    address: 'Times Square, New York, NY',
    radiusMiles: 5,
    searchParams: { page_size: 10 },
  });

  // Use the fluent query builder
  const quickSearch = new QuickSearch(client);
  const todaysMeetings = await quickSearch.today().virtualOnly().execute();

  console.log('Found meetings:', nearbyMeetings);
</script>
```

### For Node.js

```bash
npm install bmlt-query-client
```

```javascript
import { BmltClient, VenueType, MeetingQueryBuilder } from 'bmlt-query-client';

const client = new BmltClient({
  serverURL: 'https://your-bmlt-server.org/main_server',
});

// Search for meetings
const meetings = await client.searchMeetings({
  weekdays: [1, 2, 3], // Sunday, Monday, Tuesday
  venue_types: VenueType.IN_PERSON,
});

// Use the query builder for complex searches
const builder = new MeetingQueryBuilder(client);
const eveningMeetings = await builder
  .onWeekdays(1, 2, 3, 4, 5) // Weekdays
  .startingAfter(17, 0) // After 5 PM
  .inPersonOnly()
  .nearCoordinates({ latitude: 40.7589, longitude: -73.9851 }, 2) // 2 mile radius
  .execute();
```

## Bundle Size

The client has been optimized for minimal bundle size:

- **ES Module**: ~55KB (15KB gzipped) - Zero external dependencies, fully self-contained

## Browser Support

- ✅ Chrome 63+
- ✅ Firefox 67+
- ✅ Safari 13.1+
- ✅ Edge 79+

All modern browsers with ES2020 support and native fetch API.

## Key Features

### Comprehensive BMLT API Support

```javascript
// Server information
const serverInfo = await client.getServerInfo();

// Meeting formats
const formats = await client.getFormats();

// Service bodies
const serviceBodies = await client.getServiceBodies();

// Field values
const fieldValues = await client.getFieldValues({
  meeting_key: 'location_municipality',
});

// Changes within date range
const changes = await client.getChanges({
  start_date: '2023-01-01',
  end_date: '2023-01-31',
});
```

### Built-in Geocoding

```javascript
// Geocode an address
const result = await client.geocodeAddress('Times Square, New York');
console.log(result.coordinates); // { latitude: 40.758, longitude: -73.985 }

// Search meetings by address (uses geocoding automatically)
const meetings = await client.searchMeetingsByAddress({
  address: 'Central Park, New York',
  radiusMiles: 2,
  sortByDistance: true,
});
```

### Fluent Query Builder

```javascript
const builder = new MeetingQueryBuilder(client);

// Build complex queries with method chaining
const meetings = await builder
  .onWeekdays(Weekday.SATURDAY, Weekday.SUNDAY)
  .virtualOnly()
  .startingAfter(10, 0) // After 10 AM
  .endingBefore(20, 0) // Before 8 PM
  .searchText('meditation')
  .sortByDistance()
  .paginate(20, 1) // 20 results, page 1
  .execute();
```

### Quick Search Helpers

```javascript
const quickSearch = new QuickSearch(client);

// Pre-built search methods
const todaysMeetings = await quickSearch.today().execute();
const virtualMeetings = await quickSearch.virtual().execute();
const eveningMeetings = await quickSearch.evening().execute();
const weekendMeetings = await quickSearch.weekend().execute();

// Combine quick searches with additional filters
const todaysVirtualMeetings = await quickSearch
  .today()
  .virtualOnly()
  .startingAfter(18, 0) // After 6 PM
  .execute();
```

### Finding Duplicate Meetings

When querying meetings from multiple service bodies or servers, use `findDuplicateMeetings` to identify the same meeting appearing in more than one list:

```javascript
import { findDuplicateMeetings } from 'bmlt-query-client';

const [listA, listB] = await Promise.all([
  client.searchMeetings({ services: [1] }),
  client.searchMeetings({ services: [2] }),
]);

const duplicates = findDuplicateMeetings([listA, listB]);

for (const group of duplicates) {
  console.log(`Duplicate: ${group.key}`);
  for (const { meeting, listIndex } of group.entries) {
    console.log(`  List ${listIndex}: id=${meeting.id_bigint}`);
  }
}
```

By default, meetings are compared on `weekday_tinyint`, `start_time`, `meeting_name`, and `location_text` (case-insensitive). You can customize the fields:

```javascript
// Compare only on name and street address
const duplicates = findDuplicateMeetings([listA, listB], {
  fields: ['meeting_name', 'location_street'],
  normalize: true, // lowercase + trim (default)
});
```

### Counting Unique Groups

Use `countUniqueGroups` to get the total number of distinct groups in a meeting list. A group is identified by its service body plus meeting name (case-insensitive, trimmed), so multiple weekly occurrences of the same group count once:

```javascript
import { countUniqueGroups } from 'bmlt-query-client';

const meetings = await client.searchMeetings();
const total = countUniqueGroups(meetings);
console.log(`Total unique groups: ${total}`);
```

## Error Handling

The client provides comprehensive error handling with specific error types:

```javascript
import { BmltQueryError, BmltErrorType } from 'bmlt-query-client';

try {
  const meetings = await client.searchMeetings({ invalid: 'parameter' });
} catch (error) {
  if (error instanceof BmltQueryError) {
    console.log('Error type:', error.type);
    console.log('User message:', error.getUserMessage());

    if (error.isRetryable()) {
      // Handle retryable errors (network, timeout, rate limit)
      console.log('This error can be retried');
    }

    if (error.isType(BmltErrorType.GEOCODING_ERROR)) {
      // Handle geocoding-specific errors
      console.log('Geocoding failed');
    }
  }
}
```

## Examples

- **[Browser Demo](./docs/index.html)** - Complete browser example using ES modules

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build the ES module bundle
npm run build

# Clean build directory
npm run clean

# Code formatting
npm run format        # Format all files
npm run format:check  # Check formatting

# Code quality
npm run lint          # Lint code
npm run type-check    # TypeScript checking
```

## Configuration

### Runtime Configuration

You can update client settings after initialization:

```javascript
// Update user agent for all requests
client.setUserAgent('my-updated-app/2.0.0');
console.log(client.getUserAgent()); // 'my-updated-app/2.0.0'

// Update request timeout
client.setTimeout(60000); // 60 seconds
console.log(client.getTimeout()); // 60000

// Update server URL
client.setServerURL('https://new-server.org/main_server');
console.log(client.getServerURL());

// Update default data format
client.setDefaultFormat(BmltDataFormat.JSONP);
console.log(client.getDefaultFormat());
```

### Client Options

```javascript
const client = new BmltClient({
  serverURL: 'https://your-server.org/main_server', // Required
  defaultFormat: BmltDataFormat.JSON, // Optional
  timeout: 30000, // 30 seconds
  userAgent: 'my-app/1.0.0', // Custom user agent
  enableGeocoding: true, // Enable address search
  geocodingOptions: {
    countryCode: 'us', // Bias results to US
    retryCount: 3, // Retry failed requests
    timeout: 10000, // Geocoding timeout
  },
});
```

### Geocoding Options

```javascript
const client = new BmltClient({
  serverURL: 'https://your-server.org/main_server',
  geocodingOptions: {
    countryCode: 'us', // ISO country code bias
    viewbox: [-74.2, 40.4, -73.7, 40.9], // Geographic bounding box [w,s,e,n]
    bounded: true, // Restrict to viewbox
    retryCount: 3, // Request retry attempts
    timeout: 10000, // Request timeout (ms)
    intervalCap: 1, // Rate limit: requests per interval
    interval: 1000, // Rate limit interval (ms)
    concurrency: 1, // Max concurrent requests
  },
});
```

## License

MIT License

## Contributing

Contributions are welcome! Please read the contributing guidelines and submit pull requests.
