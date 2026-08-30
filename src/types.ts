/**
 * Core data model.
 *
 * Every Item on screen must originate from a real MediaLibrary asset.
 * There is no mock item, no seeded fixture, no demo mode anywhere in this app.
 */

export type ItemType =
  | 'contact'
  | 'event'
  | 'wifi'
  | 'place'
  | 'link'
  | 'reply_owed'
  | 'junk';

export type ItemStatus = 'pending' | 'done' | 'dismissed';

export interface Item {
  id: string;
  /** MediaLibrary asset id — the proof this came from a real screenshot. */
  assetId: string;
  uri: string;
  takenAt: number;
  type: ItemType;
  payload: Record<string, string>;
  status: ItemStatus;
  /** Generated from this screenshot's own payload. Never picked from a list. */
  roastLine: string;
}

export interface Session {
  scannedAt: number;
  counts: Record<ItemType, number>;
  /** Sum of prices found across `link` items. Best effort, never guaranteed. */
  totalValue: number;
  executed: string[];
}

export const ACTIONABLE_TYPES: ItemType[] = [
  'contact',
  'event',
  'wifi',
  'place',
  'link',
  'reply_owed',
];

export const emptyCounts = (): Record<ItemType, number> => ({
  contact: 0,
  event: 0,
  wifi: 0,
  place: 0,
  link: 0,
  reply_owed: 0,
  junk: 0,
});

export const TYPE_LABEL: Record<ItemType, string> = {
  contact: 'contacts',
  event: 'events',
  wifi: 'wifi passwords',
  place: 'places',
  link: 'things to buy',
  reply_owed: 'replies you owe',
  junk: 'noise',
};
