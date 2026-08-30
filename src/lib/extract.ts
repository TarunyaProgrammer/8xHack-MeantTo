import { z } from 'zod';
import { ImageManipulator, SaveFormat, manipulateAsync } from 'expo-image-manipulator';
import { askStructured, imagePart, textPart } from './ai';
import { Screenshot } from './screenshots';
import { Item, ItemType } from '../types';

/**
 * Strict schema. The model returns exactly this or the item is dropped to
 * `junk` — there is no lenient parse and no guessed fallback.
 */
const ExtractionSchema = z.object({
  type: z.enum(['contact', 'event', 'wifi', 'place', 'link', 'reply_owed', 'junk']),
  payload: z.object({
    name: z.string(),
    phone: z.string(),
    title: z.string(),
    datetime: z.string(),
    ssid: z.string(),
    password: z.string(),
    address: z.string(),
    url: z.string(),
    price: z.string(),
    person: z.string(),
    context: z.string(),
  }),
  roastLine: z.string(),
});

const SYSTEM = `You read a single phone screenshot and identify the one thing the
owner meant to do with it.

Classify into exactly one type:
- contact: a phone number with a name, usually inside a chat or a profile
- event: a poster, invite or message carrying a date and time
- wifi: a network name with a password
- place: a restaurant, address or location worth saving
- link: a product, listing or article, ideally with a price
- reply_owed: a conversation the owner clearly never answered
- junk: memes, noise, or anything with no action in it

Fill only the payload fields that are genuinely visible. Leave every other
field as an empty string. Never invent a name, number, price, date or address
that is not legible in the image — an empty string is always correct when you
cannot read it.

roastLine: one dry, specific sentence about this screenshot, referencing a real
detail you can see — a price, a date, a repetition. Never generic, never
encouraging, no exclamation marks. Under 90 characters. For junk, return an
empty string.`;

/**
 * ~800px JPEG keeps the image legible while cutting tokens and latency.
 *
 * Uses the contextual API, which is the supported path in SDK 54.
 * `manipulateAsync` is deprecated there and does not handle every Android
 * media URI, so it is only a fallback.
 */
async function toBase64(uri: string): Promise<string> {
  try {
    const image = await ImageManipulator.manipulate(uri).resize({ width: 800 }).renderAsync();
    const saved = await image.saveAsync({
      compress: 0.6,
      format: SaveFormat.JPEG,
      base64: true,
    });
    if (saved.base64) return saved.base64;
    throw new Error('No base64 from manipulator');
  } catch (err) {
    console.log('[extract] contextual manipulator failed, falling back:', String(err).slice(0, 160));
    const result = await manipulateAsync(uri, [{ resize: { width: 800 } }], {
      compress: 0.6,
      format: SaveFormat.JPEG,
      base64: true,
    });
    if (!result.base64) throw new Error('Could not read screenshot');
    return result.base64;
  }
}

function stripEmpty(payload: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(payload).filter(([, v]) => v.trim() !== ''));
}

async function extractOne(shot: Screenshot): Promise<Item> {
  const data = await toBase64(shot.uri);

  const parsed = await askStructured(ExtractionSchema, SYSTEM, [
    imagePart(data),
    textPart('What did this screenshot mean to do?'),
  ]);

  return {
    id: shot.assetId,
    assetId: shot.assetId,
    uri: shot.uri,
    takenAt: shot.takenAt,
    // An unparseable response becomes junk. It never becomes a plausible guess.
    type: (parsed?.type ?? 'junk') as ItemType,
    payload: parsed ? stripEmpty(parsed.payload) : {},
    status: 'pending',
    roastLine: parsed?.roastLine ?? '',
  };
}

export interface ExtractProgress {
  done: number;
  total: number;
}

export interface ExtractResult {
  items: Item[];
  /** How many screenshots failed outright. */
  failed: number;
  /** First real error, kept so a total failure can be reported honestly. */
  firstError: string | null;
  /**
   * Assets whose extraction threw. These must never be written to the cache —
   * a cached failure looks identical to a real `junk` result and permanently
   * suppresses the retry.
   */
  failedIds: string[];
}

/**
 * Extracts every screenshot not already cached. Runs a few at a time so a
 * 50-image scan finishes quickly without tripping rate limits.
 */
export async function extractAll(
  shots: Screenshot[],
  cached: Item[],
  onProgress?: (p: ExtractProgress) => void,
  concurrency = 6
): Promise<ExtractResult> {
  const byAsset = new Map(cached.map((i) => [i.assetId, i]));
  const pending = shots.filter((s) => !byAsset.has(s.assetId));

  let done = shots.length - pending.length;
  onProgress?.({ done, total: shots.length });

  const queue = [...pending];
  const results: Item[] = [];
  let failed = 0;
  let firstError: string | null = null;
  const failedIds: string[] = [];

  const workers = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
    while (queue.length) {
      const shot = queue.shift();
      if (!shot) return;
      try {
        results.push(await extractOne(shot));
      } catch (err) {
        // One bad screenshot must never abort the scan, and it must never be
        // replaced with invented content — it simply becomes junk. But the
        // reason is recorded: if everything fails, that is an error to report,
        // not a folder full of memes.
        failed += 1;
        failedIds.push(shot.assetId);
        const message = err instanceof Error ? err.message : String(err);
        if (!firstError) firstError = message;
        console.log('[extract] failed', shot.assetId, message.slice(0, 200));
        results.push({
          id: shot.assetId,
          assetId: shot.assetId,
          uri: shot.uri,
          takenAt: shot.takenAt,
          type: 'junk',
          payload: {},
          status: 'pending',
          roastLine: '',
        });
      }
      done += 1;
      onProgress?.({ done, total: shots.length });
    }
  });

  await Promise.all(workers);

  const order = new Map(shots.map((s, i) => [s.assetId, i]));
  const items = [...cached.filter((i) => order.has(i.assetId)), ...results].sort(
    (a, b) => (order.get(a.assetId) ?? 0) - (order.get(b.assetId) ?? 0)
  );

  const breakdown = items.reduce<Record<string, number>>((acc, i) => {
    acc[i.type] = (acc[i.type] ?? 0) + 1;
    return acc;
  }, {});
  console.log('[extract] done', items.length, 'items,', failed, 'failed', breakdown);
  return { items, failed, firstError, failedIds };
}
