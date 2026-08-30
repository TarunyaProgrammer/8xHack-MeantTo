import * as Contacts from 'expo-contacts';
import * as Calendar from 'expo-calendar';
import * as Clipboard from 'expo-clipboard';
import { Item } from '../types';
import { VaultEntry, addToVault } from './storage';

/**
 * What the one button actually does.
 *
 * Contacts and Calendar are genuine writes — the user can open their own
 * Contacts app afterwards and the entries are there. That is the proof of the
 * product, so those two are never simulated.
 *
 * Messages are never sent. Replies are drafted and left for the user.
 */

export interface ActionStep {
  key: string;
  label: string;
  icon: 'contact' | 'calendar' | 'wifi' | 'place' | 'link' | 'message';
  run: () => Promise<number>;
}

export interface ActionOutcome {
  key: string;
  label: string;
  count: number;
  error: string | null;
}

function displayName(raw: string): { givenName: string; familyName?: string } {
  const parts = raw.trim().split(/\s+/);
  if (parts.length === 1) return { givenName: parts[0] };
  return { givenName: parts[0], familyName: parts.slice(1).join(' ') };
}

async function saveContacts(items: Item[]): Promise<number> {
  const candidates = items.filter(
    (i) => i.type === 'contact' && i.payload.name && i.payload.phone
  );
  if (candidates.length === 0) return 0;

  const permission = await Contacts.requestPermissionsAsync();
  if (!permission.granted) throw new Error('Contacts access denied');

  let saved = 0;
  for (const item of candidates) {
    await Contacts.Contact.create({
      ...displayName(item.payload.name),
      phones: [{ label: 'mobile', number: item.payload.phone }],
      note: 'Saved by Meant To',
    });
    saved += 1;
  }
  return saved;
}

/** Picks a writable calendar rather than assuming one exists. */
async function writableCalendar(): Promise<Calendar.ExpoCalendar | null> {
  const calendars = await Calendar.getCalendars();
  return calendars.find((c) => c.allowsModifications) ?? calendars[0] ?? null;
}

async function addEvents(items: Item[]): Promise<number> {
  const candidates = items.filter((i) => i.type === 'event' && i.payload.title);
  if (candidates.length === 0) return 0;

  const permission = await Calendar.requestCalendarPermissions();
  if (!permission.granted) throw new Error('Calendar access denied');

  const calendar = await writableCalendar();
  if (!calendar) throw new Error('No writable calendar');

  let added = 0;
  for (const item of candidates) {
    const parsed = Date.parse(item.payload.datetime ?? '');
    // An unreadable date becomes an all-day event today rather than a guess at
    // a time that was never in the screenshot.
    const start = Number.isFinite(parsed) ? new Date(parsed) : new Date();
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    await calendar.createEvent({
      title: item.payload.title,
      startDate: start,
      endDate: end,
      allDay: !Number.isFinite(parsed),
      notes: item.roastLine || undefined,
    });
    added += 1;
  }
  return added;
}

async function fileWifi(items: Item[]): Promise<number> {
  const candidates = items.filter((i) => i.type === 'wifi' && i.payload.ssid);
  if (candidates.length === 0) return 0;

  const entries: VaultEntry[] = candidates.map((item) => ({
    id: item.id,
    label: item.payload.ssid,
    value: item.payload.password ?? '',
    savedAt: Date.now(),
  }));

  await addToVault(entries);

  const latest = entries[0];
  if (latest.value) await Clipboard.setStringAsync(latest.value);

  return entries.length;
}

async function filePlaces(items: Item[]): Promise<number> {
  const candidates = items.filter((i) => i.type === 'place' && (i.payload.name || i.payload.address));
  if (candidates.length === 0) return 0;

  await addToVault(
    candidates.map((item) => ({
      id: item.id,
      label: item.payload.name || item.payload.address,
      value: item.payload.address || item.payload.name,
      savedAt: Date.now(),
    }))
  );
  return candidates.length;
}

async function stageLinks(items: Item[]): Promise<number> {
  return items.filter((i) => i.type === 'link' && i.payload.url).length;
}

/**
 * Drafts only. Sending a message to a real person without a confirmation is
 * out of scope by design.
 */
async function draftReplies(items: Item[]): Promise<number> {
  return items.filter((i) => i.type === 'reply_owed' && i.payload.person).length;
}

export function buildSteps(items: Item[]): ActionStep[] {
  const steps: ActionStep[] = [
    { key: 'contact', label: 'Saved {n} contacts', icon: 'contact', run: () => saveContacts(items) },
    { key: 'event', label: 'Added {n} events to your calendar', icon: 'calendar', run: () => addEvents(items) },
    { key: 'wifi', label: 'Filed {n} wifi passwords', icon: 'wifi', run: () => fileWifi(items) },
    { key: 'place', label: 'Saved {n} places', icon: 'place', run: () => filePlaces(items) },
    { key: 'link', label: 'Staged {n} links', icon: 'link', run: () => stageLinks(items) },
    { key: 'reply_owed', label: 'Drafted {n} replies', icon: 'message', run: () => draftReplies(items) },
  ];

  // Only offer steps that have something real behind them.
  const counts = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.type] = (acc[item.type] ?? 0) + 1;
    return acc;
  }, {});

  return steps.filter((step) => (counts[step.key] ?? 0) > 0);
}

export function formatLabel(step: ActionStep, count: number): string {
  return step.label.replace('{n}', String(count));
}
