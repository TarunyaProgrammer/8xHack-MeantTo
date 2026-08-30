import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';

/**
 * Where to buy the recommended outfit.
 *
 * THE RULE: we have no product API, so we never know what anything costs.
 * Nothing in this file returns, formats or implies a product price. We build a
 * real, price-filtered search URL on a real Indian retailer and let that
 * retailer show its own live price. The only numbers here are the bounds of the
 * filter the user picked, which is their input, not a claim about any product.
 *
 * URL formats — verified against the live sites on 2026-08-30:
 *
 * MYNTRA — verified end to end.
 *   https://www.myntra.com/<slug>?rawQuery=<query>&f=Price_range%3A<min>.0_<max>.0
 *   Fetching this returns HTTP 200 and Myntra's embedded page state echoes
 *   `"appliedParams":{"filters":[{"id":"Price_range","values":["1500.0_4000.0"]}]}`,
 *   and the result set shrinks versus the unfiltered URL — so the filter is
 *   genuinely applied, not ignored. Both bounds are required and both carry a
 *   `.0` decimal; the separator is `_`.
 *
 * AMAZON.IN — search verified, price params corroborated by documentation.
 *   https://www.amazon.in/s?k=<query>&low-price=<min>&high-price=<max>
 *   `low-price` / `high-price` are Amazon's own price-box parameters and take
 *   whole currency units (rupees here), matching the min/max box in the left
 *   rail. Amazon serves 503 to non-browser clients so this could not be
 *   fetched directly; multiple independent references agree on the format.
 *   We deliberately do NOT use `rh=p_36:<min>-<max>`: sources disagree on
 *   whether it takes rupees or paise, and getting that wrong would silently
 *   filter to a hundredth of the intended band. We also omit the department
 *   param (`i=apparel`) for the same reason — unverified, and a wrong value
 *   returns nothing. The garment description is specific enough on its own.
 *
 * AJIO — search verified, price filter NOT verified, so no price filter is sent.
 *   https://www.ajio.com/search/?text=<query>
 *   Ajio is Hybris-based and puts facets in a `query=:relevance:<key>:<value>`
 *   parameter, but its price facet takes pre-defined bucket labels rather than
 *   an arbitrary min-max, and we could not confirm the key or the encoding
 *   (Akamai blocks non-browser clients). A guessed facet would either 404 or
 *   be silently dropped, so Ajio gets a plain search that definitely works.
 *
 * All three are ordinary https links, so Android App Links / iOS Universal
 * Links hand off to the retailer's native app when it is installed and fall
 * back to the browser when it is not.
 */

const K_BAND = 'fitted.priceBand.v1';

export type PriceBandId = 'budget' | 'mid' | 'premium';

export interface PriceBand {
  id: PriceBandId;
  /** Shown on the picker. Describes the filter bounds, not any product. */
  label: string;
  /** Inclusive bounds, whole rupees. */
  min: number;
  max: number;
}

/**
 * `premium` needs a finite upper bound because Myntra rejects an open-ended
 * range; ₹1,00,000 is comfortably above any garment either site sells.
 */
export const PRICE_BANDS: readonly PriceBand[] = [
  { id: 'budget', label: 'Under ₹1.5k', min: 0, max: 1500 },
  { id: 'mid', label: '₹1.5k–4k', min: 1500, max: 4000 },
  { id: 'premium', label: '₹4k+', min: 4000, max: 100000 },
];

export const DEFAULT_BAND: PriceBandId = 'mid';

function resolveBand(id: PriceBandId): PriceBand {
  return PRICE_BANDS.find((b) => b.id === id) ?? PRICE_BANDS[1];
}

function isBandId(value: unknown): value is PriceBandId {
  return typeof value === 'string' && PRICE_BANDS.some((b) => b.id === value);
}

/** Storage is best-effort: a read failure must never block the result screen. */
export async function loadPriceBand(): Promise<PriceBandId> {
  try {
    const raw = await AsyncStorage.getItem(K_BAND);
    if (isBandId(raw)) return raw;
  } catch {
    // fall through to the default
  }
  return DEFAULT_BAND;
}

export async function savePriceBand(id: PriceBandId): Promise<void> {
  try {
    await AsyncStorage.setItem(K_BAND, id);
  } catch {
    // Losing the preference is survivable; crashing on a tap is not.
  }
}

export interface Garment {
  /** The outfit field this came from — used as a React key. */
  key: string;
  description: string;
}

/** `why` is prose about the look, not something you can shop for. */
const NOT_GARMENTS = new Set(['why', 'reason', 'rationale', 'note', 'notes', 'summary']);

/** Known slots first; anything the analysis adds later lands after them. */
const SLOT_ORDER = ['top', 'bottom', 'shoes'];

function slotRank(key: string): number {
  const i = SLOT_ORDER.indexOf(key.toLowerCase());
  return i === -1 ? SLOT_ORDER.length : i;
}

/**
 * Read the shoppable garments off the outfit. Deliberately structural rather
 * than hardcoded to top/bottom/shoes: another agent owns the `Analysis` type
 * and may add outerwear or accessories, and those should appear here without
 * this file changing. Anything non-string or empty is skipped.
 */
export function garmentsFrom(outfit: unknown): Garment[] {
  if (!outfit || typeof outfit !== 'object') return [];

  return Object.entries(outfit as Record<string, unknown>)
    .filter(
      ([key, value]) =>
        typeof value === 'string' &&
        value.trim().length > 0 &&
        !NOT_GARMENTS.has(key.toLowerCase()),
    )
    .sort(([a], [b]) => slotRank(a) - slotRank(b))
    .map(([key, value]) => ({ key, description: (value as string).trim() }));
}

export interface ShopLink {
  retailer: string;
  url: string;
}

/** Myntra routes search through a path slug, e.g. /navy-linen-shirt. */
function slugify(query: string): string {
  return query
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Real search URLs for one garment, filtered to the chosen band where the
 * retailer's parameter format is verified. No prices, no product data, no
 * placeholders — just links out.
 */
export function shopLinks(description: string, bandId: PriceBandId): ShopLink[] {
  const query = description.trim();
  if (!query) return [];

  const band = resolveBand(bandId);
  const q = encodeURIComponent(query);
  const slug = slugify(query);

  const myntraPriceFilter = encodeURIComponent(`Price_range:${band.min}.0_${band.max}.0`);
  const myntraPath = slug || 'clothing';

  return [
    {
      retailer: 'Myntra',
      url: `https://www.myntra.com/${myntraPath}?rawQuery=${q}&f=${myntraPriceFilter}`,
    },
    {
      retailer: 'Amazon',
      url: `https://www.amazon.in/s?k=${q}&low-price=${band.min}&high-price=${band.max}`,
    },
    // No price filter: Ajio's facet format is unverified (see the header note).
    {
      retailer: 'Ajio',
      url: `https://www.ajio.com/search/?text=${q}`,
    },
  ];
}

/** A dead link should do nothing, never take the screen down with it. */
export async function openShopLink(url: string): Promise<void> {
  try {
    await Linking.openURL(url);
  } catch {
    // No browser or no handler — nothing useful to say, so stay silent.
  }
}
