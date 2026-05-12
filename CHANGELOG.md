# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.0] - 2026-05-12

### Added

- `BmltClient.rawQuery<T>(queryString, format?)` — execute a raw BMLT query string directly against the server. The switcher can be written as a bare endpoint name (`GetSearchResults&...`) or with the explicit `switcher=` key (`switcher=GetSearchResults&...`).
- `meeting_key_value` in `SearchResultsParams` now accepts `string | string[]`, enabling multi-value field searches (e.g. `meeting_key_value: ['USA', 'US']` serialises as `meeting_key_value[]=USA&meeting_key_value[]=US`).
- `MeetingQueryBuilder.fieldValue()` now accepts `string | string[]` to match multiple values for a field key.
- Raw query input section added to the browser demo (`docs/index.html`).

## [1.1.0] - 2026-04-27

### Added

- `BmltClient.searchMeetingsWithFormats()` — fetches meetings and the formats they reference in a single round-trip using `get_used_formats=true`. Avoids a separate `getFormats()` call on large servers.
- `MeetingQueryBuilder.executeWithFormats()` — equivalent fluent builder method that returns `MeetingsWithFormats`.
- `BmltClient.getServerURL()` and `BmltClient.setServerURL()` — read and update the server URL after construction.
- `findDuplicateMeetings(lists, options?)` utility — identifies the same meeting appearing across multiple result lists. Configurable comparison fields and normalization.
- `countUniqueGroups(meetings)` utility — counts distinct groups (service body + meeting name) in a meeting list.
- Additional language codes added to the `Language` enum.

## [1.0.6] - 2026-03-26

### Fixed

- Response type corrections in `responses.ts`.

### Changed

- Dependency updates.

## [1.0.0] - 2025-09-06

### Added

- Initial release.
- `BmltClient` with full BMLT Semantic API coverage: `searchMeetings`, `getFormats`, `getServiceBodies`, `getChanges`, `getFieldKeys`, `getFieldValues`, `getNAWSDump`, `getServerInfo`, `getCoverageArea`.
- `MeetingQueryBuilder` — fluent, chainable query builder for meeting searches.
- `QuickSearch` — convenience helpers (`today()`, `virtual()`, `evening()`, `weekend()`, etc.).
- Built-in geocoding via OpenStreetMap Nominatim with rate limiting and retry.
- `BmltClient.searchMeetingsByAddress()` and `searchMeetingsByCoordinates()` for geographic searches.
- `BmltClient.geocodeAddress()` and `reverseGeocode()`.
- Configurable user agent, timeout, default format, and geocoding options.
- `BmltQueryError` / `BmltErrorType` for typed error handling.
- Zero external runtime dependencies — p-queue and p-retry are bundled via Vite.
- ES module only; native `fetch` API; TypeScript declarations included.

[Unreleased]: https://github.com/bmlt-enabled/bmlt-query-client/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/bmlt-enabled/bmlt-query-client/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/bmlt-enabled/bmlt-query-client/compare/v1.0.6...v1.1.0
[1.0.6]: https://github.com/bmlt-enabled/bmlt-query-client/compare/v1.0.0...v1.0.6
[1.0.0]: https://github.com/bmlt-enabled/bmlt-query-client/releases/tag/v1.0.0
