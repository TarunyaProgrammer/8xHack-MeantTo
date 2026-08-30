import AsyncStorage from '@react-native-async-storage/async-storage';
import { Analysis } from './fashion';
import { deleteTryOnImage } from './files';

// v2: v1 inlined the try-on as a base64 PNG. AsyncStorage on Android is
// SQLite, and reading a row bigger than the 2MB CursorWindow throws
// "Row too big to fit into CursorWindow requiredPos=0, totalRows=1" — so one
// saved look bricked every later read. v2 stores a file uri instead.
const KEY = 'fitted.looks.v2';
const LEGACY_KEYS = ['fitted.looks.v1'];
const MAX = 30;

export interface Look {
  id: string;
  savedAt: number;
  /** Original photo uri on the device. */
  photo: string;
  /** Generated try-on, a file uri on disk. Null while it was still rendering. */
  tryOn: string | null;
  analysis: Analysis;
}

/** Drops the oversized v1 row so it can never be read again. */
export async function purgeLegacyLooks(): Promise<void> {
  await AsyncStorage.multiRemove(LEGACY_KEYS).catch(() => {});
}

export async function loadLooks(): Promise<Look[]> {
  let raw: string | null = null;
  try {
    raw = await AsyncStorage.getItem(KEY);
  } catch {
    // An unreadable row must never take a screen down with it. Drop it and
    // carry on with an empty gallery.
    await AsyncStorage.removeItem(KEY).catch(() => {});
    return [];
  }
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Look[];
  } catch {
    return [];
  }
}

async function write(looks: Look[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(looks));
}

/** Newest first, capped. */
export async function saveLook(look: Look): Promise<void> {
  const existing = await loadLooks();
  const merged = [look, ...existing.filter((l) => l.id !== look.id)];
  const next = merged.slice(0, MAX);
  // Whatever falls off the end takes its image file with it.
  await Promise.all(merged.slice(MAX).map((l) => deleteTryOnImage(l.tryOn)));
  await write(next);
}

export async function updateLookTryOn(id: string, tryOn: string): Promise<void> {
  const existing = await loadLooks();
  await write(existing.map((l) => (l.id === id ? { ...l, tryOn } : l)));
}

export async function deleteLook(id: string): Promise<void> {
  const existing = await loadLooks();
  await deleteTryOnImage(existing.find((l) => l.id === id)?.tryOn ?? null);
  await write(existing.filter((l) => l.id !== id));
}
