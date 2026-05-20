/**
 * Utility functions for working with Meeting arrays
 */

import { Meeting } from '../types';

/** A single meeting paired with the index of the list it came from */
export interface DuplicateMeetingEntry {
  meeting: Meeting;
  /** Index of the source list in the array passed to findDuplicateMeetings */
  listIndex: number;
}

/** A group of meetings from different lists that match on the comparison key */
export interface DuplicateMeetingGroup {
  /** Composite key used for matching */
  key: string;
  /** All matching entries, one per occurrence across the lists */
  entries: DuplicateMeetingEntry[];
}

export interface FindDuplicatesOptions {
  /**
   * Meeting fields used to build the composite comparison key.
   * Defaults to weekday, start time, meeting name, and location.
   */
  fields?: Array<keyof Meeting>;

  /**
   * Normalize string values before comparing (lowercase + trim).
   * Defaults to true.
   */
  normalize?: boolean;
}

const DEFAULT_FIELDS: Array<keyof Meeting> = [
  'weekday_tinyint',
  'start_time',
  'meeting_name',
  'location_text',
];

function normalizeValue(value: unknown, normalize: boolean): string {
  const str = value === null || value === undefined ? '' : String(value);
  return normalize ? str.toLowerCase().trim() : str;
}

function buildKey(meeting: Meeting, fields: Array<keyof Meeting>, normalize: boolean): string {
  return fields.map(field => normalizeValue(meeting[field], normalize)).join(' | ');
}

/**
 * Find meetings that appear in more than one of the provided lists.
 *
 * Comparison is done via a composite key built from the specified fields
 * (default: weekday, start time, meeting name, location). Only groups that
 * span at least two different lists are returned.
 *
 * @example
 * const duplicates = findDuplicateMeetings([listA, listB]);
 * for (const group of duplicates) {
 *   console.log(`Duplicate: ${group.key}`);
 *   for (const { meeting, listIndex } of group.entries) {
 *     console.log(`  List ${listIndex}: id=${meeting.id_bigint}`);
 *   }
 * }
 */
export function findDuplicateMeetings(
  meetingLists: Meeting[][],
  options: FindDuplicatesOptions = {}
): DuplicateMeetingGroup[] {
  const { fields = DEFAULT_FIELDS, normalize = true } = options;

  // Build a map from composite key -> entries
  const keyMap = new Map<string, DuplicateMeetingEntry[]>();

  for (let listIndex = 0; listIndex < meetingLists.length; listIndex++) {
    for (const meeting of meetingLists[listIndex]) {
      const key = buildKey(meeting, fields, normalize);
      if (!keyMap.has(key)) {
        keyMap.set(key, []);
      }
      keyMap.get(key)!.push({ meeting, listIndex });
    }
  }

  // Keep only groups that appear in at least 2 distinct lists
  const result: DuplicateMeetingGroup[] = [];
  for (const [key, entries] of keyMap) {
    const listIndices = new Set(entries.map(e => e.listIndex));
    if (listIndices.size >= 2) {
      result.push({ key, entries });
    }
  }

  return result;
}

/**
 * Count unique groups across a list of meetings.
 *
 * A "group" is identified by the combination of service body, meeting name
 * (case-insensitive, trimmed), and meeting location — physical coordinates
 * for in-person/hybrid (venue_type !== 2), or the virtual meeting link plus
 * additional info for virtual (venue_type === 2). Multiple weekly meetings of
 * the same group count once; two distinct groups that happen to share a name
 * but meet at different locations count separately. Matches the long-standing
 * "group_id" definition used by crouton.
 *
 * Meetings missing a service body or name are skipped.
 */
export function countUniqueGroups(meetings: Meeting[]): number {
  const seen = new Set<string>();

  for (const meeting of meetings) {
    const sbId = meeting.service_body_bigint;
    const name = meeting.meeting_name;
    if (!sbId || !name) continue;

    const normalizedName = name.trim().toLowerCase();
    const location =
      meeting.venue_type === 2
        ? `${meeting.virtual_meeting_link ?? ''}|${meeting.virtual_meeting_additional_info ?? ''}`
        : `${meeting.latitude.toFixed(6)}|${meeting.longitude.toFixed(6)}`;

    seen.add(`${sbId}|${normalizedName}|${location}`);
  }

  return seen.size;
}
