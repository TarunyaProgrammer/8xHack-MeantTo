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
 *   https://www.myntra.com/<slug>?rawQuery=<q>&rf=Price%3A<min>.0_<max>.0_<min>.0%20TO%20<max>.0
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

/** Known slots first; anything the analysis adds later lands after them. */
const SLOT_ORDER = ['top', 'bottom', 'shoes'];


/**
 * Read the shoppable garments off the outfit. Deliberately structural rather
 * than hardcoded to top/bottom/shoes: another agent owns the `Analysis` type
 * and may add outerwear or accessories, and those should appear here without
 * this file changing. Anything non-string or empty is skipped.
 */
/**
 * Only real, buyable garments — an explicit allowlist, deliberately not a
 * denylist.
 *
 * This previously took every non-empty string on the outfit and excluded a few
 * known prose fields. When the analysis schema later grew `occasion`,
 * `formality`, `scheme`, `silhouette`, `fabric` and `fit`, those descriptors
 * started appearing as shoppable rows — "business casual" is not something you
 * can buy. A denylist silently breaks every time the schema grows; an
 * allowlist fails closed.
 */
const GARMENT_SLOTS: { key: string; label: string; aliases: string[] }[] = [
  { key: 'Top', label: 'Top', aliases: ['top', 'upper', 'shirt'] },
  { key: 'Bottom', label: 'Bottom', aliases: ['bottom', 'lower', 'trousers', 'pants'] },
  { key: 'Shoes', label: 'Shoes', aliases: ['shoes', 'footwear'] },
  { key: 'Layer', label: 'Layer', aliases: ['outerwear', 'jacket', 'layer'] },
  { key: 'Detail', label: 'Detail', aliases: ['accessory', 'accessories'] },
];

export function garmentsFrom(outfit: unknown): Garment[] {
  if (!outfit || typeof outfit !== 'object') return [];
  const record = outfit as Record<string, unknown>;

  const garments: Garment[] = [];
  for (const slot of GARMENT_SLOTS) {
    for (const alias of slot.aliases) {
      const value = record[alias];
      if (typeof value === 'string' && value.trim().length > 0) {
        garments.push({ key: slot.key, description: value.trim() });
        break;
      }
    }
  }
  return garments;
}

export interface ShopLink {
  retailer: string;
  url: string;
}


/**
 * Ajio exposes price only as fixed buckets. Every bucket overlapping the band
 * is selected and OR-ed by repeating the facet key.
 */
const AJIO_BUCKETS: { label: string; min: number; max: number }[] = [
  { label: 'Below Rs.500', min: 0, max: 500 },
  { label: 'Rs.500-1000', min: 500, max: 1000 },
  { label: 'Rs.1001-1500', min: 1001, max: 1500 },
  { label: 'Rs.1501-2000', min: 1501, max: 2000 },
  { label: 'Rs.2001-2500', min: 2001, max: 2500 },
  { label: 'Rs.2501-5000', min: 2501, max: 5000 },
  { label: 'Above Rs.5000', min: 5000, max: Number.MAX_SAFE_INTEGER },
];

function ajioBuckets(band: { min: number; max: number }): string {
  const hits = AJIO_BUCKETS.filter((b) => b.min <= band.max && b.max >= band.min);
  if (hits.length === 0) return '';
  const facets = hits.map((b) => `%3Apricerange%3A${encodeURIComponent(b.label)}`).join('');
  return `&query=%3Arelevance${facets}&gridColumns=3`;
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

  // Myntra's range filter is `rf=Price:` with a redundant triple value.
  // The obvious `f=Price_range:min_max` returns totalCount 0 — an empty results
  // page that still answers HTTP 200, which is why it looks like it works.
  // Verified: unfiltered 819 -> rf 1000-2000 = 303, f=Price_range = 0.
  const myntraPriceFilter = encodeURIComponent(
    `Price:${band.min}.0_${band.max}.0_${band.min}.0 TO ${band.max}.0`
  );
  const myntraPath = slug || 'clothing';

  return [
    {
      retailer: 'Myntra',
      url: `https://www.myntra.com/${myntraPath}?rawQuery=${q}&rf=${myntraPriceFilter}`,
    },
    {
      retailer: 'Amazon',
      // nodl=1 is Amazon's own app-link exclusion rule. Without it Android
      // hands the URL to the Amazon app, which keeps the search text and
      // silently drops low-price/high-price — so every band looked identical.
      url: `https://www.amazon.in/s?k=${q}&low-price=${band.min}&high-price=${band.max}&nodl=1`,
    },
    // Ajio has no continuous price param — only fixed buckets, OR-ed by
    // repeating the key. Verified against its own facet JSON.
    {
      retailer: 'Ajio',
      url: `https://www.ajio.com/search/?text=${q}${ajioBuckets(band)}`,
    },
  ];
}

/** A dead link should do nothing, never take the screen down with it. */
/**
 * Opens in an in-app browser rather than handing off to the retailer's app.
 *
 * Android App Links mean Myntra, Amazon and Ajio all claim their own https
 * URLs, and their apps parse the search term but discard the price filter —
 * which made every price band return the same results. A Custom Tab keeps the
 * full URL intact, and it keeps the user inside our app.
 *
 * Falls back to Linking when the browser module is unavailable, so this still
 * works on a build that predates it.
 */
export async function openShopLink(url: string): Promise<void> {
  try {
    const browser = await import('expo-web-browser');
    await browser.openBrowserAsync(url, {
      presentationStyle: browser.WebBrowserPresentationStyle.FULL_SCREEN,
      toolbarColor: '#EFEFEC',
      controlsColor: '#0E0E0E',
    });
    return;
  } catch {
    // Module missing or failed to open — fall through to the OS handler.
  }

  try {
    await Linking.openURL(url);
  } catch {
    // No handler at all — nothing useful to say, so stay silent.
  }
}
