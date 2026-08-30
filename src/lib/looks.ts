import AsyncStorage from '@react-native-async-storage/async-storage';
import { Analysis } from './fashion';
import { deleteTryOnImage } from './files';

// v2: v1 inlined the try-on as a base64 PNG. AsyncStorage on Android is
// SQLite, and reading a row bigger than the 2MB CursorWindow throws
// "Row too big to fit into CursorWindow requiredPos=0, totalRows=1" — so one
// saved look bricked every later read. v2 stores a file uri instead.
//
// The v2 key is kept deliberately. v2 rows held a single `tryOn`; they are
// widened to the per-outfit array on read (see `normalise`) rather than
// discarded, because bumping the key would throw away the user's history and
// orphan six images per look on disk.
const KEY = 'fitted.looks.v2';
const LEGACY_KEYS = ['fitted.looks.v1'];
const MAX = 30;

export interface Look {
  id: string;
  savedAt: number;
  /** Original photo uri on the device. */
  photo: string;
  /** Thumbnail for the history grid: the first try-on that landed. */
  tryOn: string | null;
  /**
   * One file uri per outfit, in `analysis.outfits` order; null for a slot that
   * has not rendered. This is what makes reopening a look free — previously
   * only the first image's uri was recorded, so the other five were
   * regenerated (or sat on an unending shimmer) every time.
   */
  tryOns: (string | null)[];
  analysis: Analysis;
}

/** Drops the oversized v1 row so it can never be read again. */
export async function purgeLegacyLooks(): Promise<void> {
  await AsyncStorage.multiRemove(LEGACY_KEYS).catch(() => {});
}

/**
 * Every mutation here is a read-modify-write of one AsyncStorage row. Six
 * try-ons finish within milliseconds of each other, so concurrent writes would
 * each start from the same snapshot and all but the last would be lost.
 * Chaining them costs nothing and is what makes the array reliable.
 */
let queue: Promise<unknown> = Promise.resolve();

function serial<T>(job: () => Promise<T>): Promise<T> {
  const run = queue.then(job, job);
  queue = run.catch(() => {});
  return run;
}

/**
 * Give every record the current shape. A v2 row has `tryOn` but no `tryOns`,
 * and a row written mid-render can have an array shorter than the outfit list.
 * Normalising on read means the rest of the app only ever sees one shape.
 */
function normalise(look: Look): Look {
  const count = look.analysis?.outfits?.length ?? 0;
  const saved = Array.isArray(look.tryOns) ? look.tryOns : [];
  const tryOns: (string | null)[] = [];
  for (let i = 0; i < count; i++) tryOns.push(saved[i] ?? null);
  // A v2 row's single uri is the first outfit's image.
  if (count > 0 && !tryOns[0] && look.tryOn) tryOns[0] = look.tryOn;
  return { ...look, tryOns, tryOn: tryOns[0] ?? tryOns.find(Boolean) ?? look.tryOn ?? null };
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
    return (JSON.parse(raw) as Look[]).map(normalise);
  } catch {
    return [];
  }
}

async function write(looks: Look[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(looks));
}

/** Every image a look owns, for eviction and deletion. */
function imagesOf(look: Look): (string | null)[] {
  return [look.tryOn, ...(look.tryOns ?? [])];
}

/** Newest first, capped. Returns the new list so callers need no second read. */
export async function saveLook(look: Look): Promise<Look[]> {
  return serial(async () => {
    const existing = await loadLooks();
    const merged = [normalise(look), ...existing.filter((l) => l.id !== look.id)];
    const next = merged.slice(0, MAX);
    // Whatever falls off the end takes all of its image files with it.
    await Promise.all(merged.slice(MAX).flatMap((l) => imagesOf(l).map(deleteTryOnImage)));
    await write(next);
    return next;
  });
}

/**
 * Record one outfit's rendered image. Indexed, because all six slots are
 * persisted now rather than only the first.
 */
export async function setLookTryOn(id: string, index: number, uri: string): Promise<Look[]> {
  return serial(async () => {
    const existing = await loadLooks();
    const next = existing.map((look) => {
      if (look.id !== id) return look;
      const tryOns = [...look.tryOns];
      tryOns[index] = uri;
      // The grid thumbnail is the first outfit once it lands, else whatever
      // arrived first — a look that rendered out of order still shows a tile.
      return { ...look, tryOns, tryOn: tryOns[0] ?? tryOns.find(Boolean) ?? null };
    });
    await write(next);
    return next;
  });
}

export async function deleteLook(id: string): Promise<Look[]> {
  return serial(async () => {
    const existing = await loadLooks();
    const gone = existing.find((l) => l.id === id);
    if (gone) await Promise.all(imagesOf(gone).map(deleteTryOnImage));
    const next = existing.filter((l) => l.id !== id);
    await write(next);
    return next;
  });
}
