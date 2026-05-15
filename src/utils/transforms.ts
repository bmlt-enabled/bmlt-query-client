/**
 * Response transforms — BMLT serializes numeric fields as quoted strings.
 * These converters give consumers idiomatic typed numbers.
 */

import type { Meeting, ServerInfo, CoverageArea } from '../types/responses';

const num = (v: unknown): number => (typeof v === 'number' ? v : parseFloat(v as string));

const optNum = (v: unknown): number | undefined => {
  if (v === undefined || v === null || v === '') return undefined;
  return num(v);
};

export function transformMeeting(raw: unknown): Meeting {
  const r = raw as Record<string, unknown>;
  return {
    ...(r as unknown as Meeting),
    weekday_tinyint: num(r.weekday_tinyint),
    venue_type: num(r.venue_type),
    published: num(r.published),
    latitude: num(r.latitude),
    longitude: num(r.longitude),
    distance_in_km: optNum(r.distance_in_km),
    distance_in_miles: optNum(r.distance_in_miles),
  };
}

export function transformServerInfo(raw: unknown): ServerInfo {
  const r = raw as Record<string, unknown>;
  return {
    ...(r as unknown as ServerInfo),
    versionInt: num(r.versionInt),
    centerLongitude: num(r.centerLongitude),
    centerLatitude: num(r.centerLatitude),
    centerZoom: num(r.centerZoom),
    semanticAdmin: num(r.semanticAdmin),
    changesPerMeeting: num(r.changesPerMeeting),
  };
}

export function transformCoverageArea(raw: unknown): CoverageArea {
  const r = raw as Record<string, unknown>;
  return {
    nw_corner_longitude: num(r.nw_corner_longitude),
    nw_corner_latitude: num(r.nw_corner_latitude),
    se_corner_longitude: num(r.se_corner_longitude),
    se_corner_latitude: num(r.se_corner_latitude),
  };
}
