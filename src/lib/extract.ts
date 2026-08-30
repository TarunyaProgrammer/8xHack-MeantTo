import { z } from 'zod';
import { SaveFormat, manipulateAsync } from 'expo-image-manipulator';
import { askStructured } from './anthropic';
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

/** ~800px JPEG keeps the image legible while cutting tokens and latency. */
async function toBase64(uri: string): Promise<string> {
  const result = await manipulateAsync(uri, [{ resize: { width: 800 } }], {
    compress: 0.6,
    format: SaveFormat.JPEG,
    base64: true,
  });
  if (!result.base64) throw new Error('Could not read screenshot');
  return result.base64;
}

function stripEmpty(payload: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(payload).filter(([, v]) => v.trim() !== ''));
}

async function extractOne(shot: Screenshot): Promise<Item> {
  const data = await toBase64(shot.uri);

  const parsed = await askStructured(ExtractionSchema, SYSTEM, [
    { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data } },
    { type: 'text', text: 'What did this screenshot mean to do?' },
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

/**
 * Extracts every screenshot not already cached. Runs a few at a time so a
 * 50-image scan finishes quickly without tripping rate limits.
 */
export async function extractAll(
  shots: Screenshot[],
  cached: Item[],
  onProgress?: (p: ExtractProgress) => void,
  concurrency = 6
): Promise<Item[]> {
  const byAsset = new Map(cached.map((i) => [i.assetId, i]));
  const pending = shots.filter((s) => !byAsset.has(s.assetId));

  let done = shots.length - pending.length;
  onProgress?.({ done, total: shots.length });

  const queue = [...pending];
  const results: Item[] = [];

  const workers = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
    while (queue.length) {
      const shot = queue.shift();
      if (!shot) return;
      try {
        results.push(await extractOne(shot));
      } catch (err) {
        // One bad screenshot must never abort the scan, and it must never be
        // replaced with invented content — it simply becomes junk.
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
  return [...cached.filter((i) => order.has(i.assetId)), ...results].sort(
    (a, b) => (order.get(a.assetId) ?? 0) - (order.get(b.assetId) ?? 0)
  );
}
