import { Item } from '../types';
import { VaultEntry, addToVault } from './storage';

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

async function saveContacts(items: Item[]): Promise<number> {
  const candidates = items.filter(
    (i) => i.type === 'contact' && i.payload.name && i.payload.phone
  );
  return candidates.length;
}

async function addEvents(items: Item[]): Promise<number> {
  const candidates = items.filter((i) => i.type === 'event' && i.payload.title);
  return candidates.length;
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
  return entries.length;
}

async function filePlaces(items: Item[]): Promise<number> {
  const candidates = items.filter(
    (i) => i.type === 'place' && (i.payload.name || i.payload.address)
  );
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

  const counts = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.type] = (acc[item.type] ?? 0) + 1;
    return acc;
  }, {});

  return steps.filter((step) => (counts[step.key] ?? 0) > 0);
}

export function formatLabel(step: ActionStep, count: number): string {
  return step.label.replace('{n}', String(count));
}
