# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.3.0] - 2026-05-15

### Added

- `Meeting` response type now includes fields previously missing from the interface: `formats` (comma-separated format key strings), `phone_meeting_number`, `bus_lines`, `train_lines`, `shared_group_id_bigint`, `lang_enum`, `contact_name_1`/`contact_name_2`, `contact_phone_1`/`contact_phone_2`, `contact_email_1`/`contact_email_2`, and `admin_notes`.
- `ServerInfo` response type rewritten to match the actual `GetServerInfo` response: added `versionInt`, `centerLongitude`, `centerLatitude`, `centerZoom`, `defaultDuration`, `regionBias`, `charSet`, `distanceUnits`, `semanticAdmin`, `changesPerMeeting`, `meeting_states_and_provinces`, `meeting_counties_and_sub_provinces`, `available_keys`, `google_api_key`, `dbVersion`, `dbPrefix`, `phpVersion`, `auto_geocoding_enabled`, `county_auto_geocoding_enabled`, `zip_auto_geocoding_enabled`, `commit`, `default_closed_status`, and `aggregator_mode_enabled`.

### Changed

- **Breaking:** `Meeting` numeric fields are now typed as `string` to match the actual JSON response (BMLT returns these as quoted strings): `weekday_tinyint`, `venue_type`, `published`, `latitude`, `longitude`, `distance_in_km`, `distance_in_miles`.
- **Breaking:** `ServiceBody` fields `description`, `url`, `helpline`, `world_id`, and `parent_id` are now required (the server always returns them, possibly as empty strings).
- **Breaking:** `Format` fields `world_id` and `format_type_enum` are now required (the server always returns them, possibly as empty strings).
- **Breaking:** `ServerInfo` interface no longer includes the fictional fields `availableEndpoints`, `supportedFormats`, `name`, `description`, or `coverageArea`. `langs` is now a comma-separated `string` (was `string[]`).
- **Breaking:** `CoverageArea` rewritten with the actual response fields (`nw_corner_longitude`, `nw_corner_latitude`, `se_corner_longitude`, `se_corner_latitude` — all numeric strings); replaces the previous `north_latitude`/`south_latitude`/`east_longitude`/`west_longitude` fields.
- `BmltClient.getServerInfo()` and `getCoverageArea()` now unwrap the single-element array returned by the server, preserving the single-object return type.

### Fixed

- Misleading doc comment on `Meeting.format_shared_id_list` — clarified that this field is comma-separated format IDs while the new `formats` field is comma-separated format key strings.

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

[Unreleased]: https://github.com/bmlt-enabled/bmlt-query-client/compare/v1.3.0...HEAD
[1.3.0]: https://github.com/bmlt-enabled/bmlt-query-client/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/bmlt-enabled/bmlt-query-client/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/bmlt-enabled/bmlt-query-client/compare/v1.0.6...v1.1.0
[1.0.6]: https://github.com/bmlt-enabled/bmlt-query-client/compare/v1.0.0...v1.0.6
[1.0.0]: https://github.com/bmlt-enabled/bmlt-query-client/releases/tag/v1.0.0
