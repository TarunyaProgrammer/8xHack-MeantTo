# Fitted

Point your phone at a full-body photo. Get the colours that actually suit you,
one specific outfit built from them, and a photoreal image of **you wearing it**.

Not another colour-analysis app that tells you you're a "Deep Autumn" and stops.
The try-on is the product.

---

## What it does

1. **Photo** — shoot one in-app or pick from your library
2. **Analysis** — skin undertone, value, chroma, contrast, build and proportion,
   mapped to one of the 12 seasonal colour types
3. **Outfit** — one specific look derived from that: named garments, cuts,
   fabrics and colours. Never "a nice top".
4. **Try-on** — the same person, same face, same pose, wearing it
5. **Shop** — each garment deep-links to a real, price-filtered search

## The two hard parts

**Identity preservation.** Image edits regenerate faces by default — early
versions returned a different human. Fixed with `input_fidelity: "high"` on
`gpt-image-1.5`, verified by measuring pixel difference over the face region
against the original: RMS dropped from 37.4 to ~7.

**Fashion reasoning.** The recommendation prompt is a six-step procedure —
derive the season from undertone/value/chroma, let contrast govern how colours
are *arranged*, apply line and proportion, then fabric and formality. Built from
research across Sci\ART colour analysis, Permanent Style, Inside Out Style and
NC State's body-shape study. It carries an explicit ban on the plain-tee default
and a rotating brief so the same person doesn't get the same outfit twice.

## No fabricated data

Every value on screen traces to the user's real photo or real device data.

- No mock mode, no seeded fixtures, no sample fallback
- A failed analysis surfaces a visible error rather than a plausible-looking guess
- **Prices are never invented.** We have no product API, so garments link to a
  real filtered search and the retailer shows its own price. A convincing fake
  number is worse than no number.

## Shopping links

| Retailer | Price filter | How it was verified |
| --- | --- | --- |
| Myntra | `rf=Price:<min>_<max>_<min> TO <max>` | Live result counts: 819 unfiltered → 455 / 294 / 69 across bands |
| Amazon.in | `low-price` / `high-price` in rupees, plus `nodl=1` | A/B tested with a negative control |
| Ajio | Fixed buckets, OR-ed by repeating `pricerange` | Read from Ajio's own facet JSON |

The obvious Myntra parameter (`f=Price_range:`) answers HTTP 200 while returning
`totalCount: 0` — an empty page that looks like a working filter. Worth knowing
if you ever build against it.

Links open in an in-app browser rather than handing off to the retailer's app:
all three register `handle_all_urls`, and their apps keep the search term while
silently dropping the price parameters.

## Stack

Expo SDK 54 · React Native 0.81 · TypeScript · Reanimated · react-native-svg

SDK 54 specifically: Expo Go on the App Store stops there, so the project opens
in stock Expo Go on any phone. Android needs a dev build regardless, because
Expo Go can no longer grant full media-library access.

The OpenAI API is called directly over `fetch`. Provider SDKs import Node
builtins at module load, which Metro cannot resolve for React Native. Structured
output still uses a strict JSON Schema generated from the zod schema, and every
response is validated before use.

## Setup

```bash
npm install
cp .env.example .env      # add your OpenAI API key
npx expo start --dev-client
```

Android needs a development build for camera and media library:

```bash
npx eas-cli build --platform android --profile development
```

## Design

Monochrome UI, colour from photography. Black pills, white cards, cool grey
ground — no accent hue competing with the imagery. Radius scales with element
size. Icons are inline SVG; emoji are never used, because they render
inconsistently across platforms.
