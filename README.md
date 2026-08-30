# Meant To

Your Screenshots folder is the biggest to-do list on your phone and it has no
interface.

People screenshot things as a way of saying "deal with this later" — a wifi
password, a number in a chat, an event poster, a product they meant to buy.
Later never comes.

Meant To reads that folder, tells you the truth about it, then empties it in
one button by actually performing the actions.

> Your phone can already read one screenshot. This reads the four hundred you
> forgot about.

## How it works

1. **Scan** — reads the Screenshots album (its own album on both platforms),
   newest first, capped at 50.
2. **Extract** — one vision call per screenshot into a strict schema. Seven
   types: contact, event, wifi, place, link, reply owed, junk.
3. **Verdict** — the real counts, in a big font, with a closing line.
4. **Fix it** — one button runs every action in a visible cascade.
5. **Results** — what changed, what's left.

## What actually happens when you press the button

| Type | Action | Real write |
| --- | --- | --- |
| contact | Saved to your Contacts | **Yes** |
| event | Added to your Calendar | **Yes** |
| wifi | Filed locally, latest copied to clipboard | Local |
| place | Filed locally | Local |
| link | Staged | Local |
| reply owed | Drafted | Draft only |

Contacts and Calendar are genuine writes — open your own Contacts app
afterwards and the entries are there.

**Messages are never sent.** Replies are drafted and left for you.

## No placeholder data

Every value on screen traces back to a real screenshot on the device. There is
no mock mode, no demo mode, no seeded fixtures and no sample fallback.

- An empty album renders a real empty state
- A failed extraction becomes `junk` and drops out of the counts — it is never
  replaced with a plausible-looking guess
- A missing API key throws and surfaces a visible error rather than silently
  degrading to fabricated content
- Counts are computed at runtime, never hardcoded

## Setup

```bash
npm install
cp .env.example .env      # add your OpenAI API key
npx expo start
```

Open in Expo Go. No development build is required.

**Why SDK 54 and not the latest:** Expo Go on the App Store stops at SDK 54 —
SDK 55 and later are not published there. Staying on 54 means the app opens in
the stock Expo Go on any phone, including a judge's, with no provisioning
profile or sideloaded APK.

The key ships in the bundle via `EXPO_PUBLIC_AI_KEY`, which is acceptable for a
demo build only. A real release puts it behind a proxy.

## Stack

Expo SDK 54 · React Native 0.81 · TypeScript · Reanimated · react-native-svg · zod

Vision extraction runs on OpenAI `gpt-4o-mini` through the Chat Completions
API, called directly over `fetch`. Official provider SDKs import Node builtins
at module load, which Metro cannot resolve for React Native, so a small direct
client is less fragile than shimming those. Structured output uses a strict
JSON Schema generated from the zod schema, and every response is validated
against it before use.

Local-only persistence through AsyncStorage, keyed by MediaLibrary `assetId` so
a screenshot is never extracted twice.

## Design

White surfaces, a single accent, generous spacing, and as little text as the
screen can carry. Icons are inline SVG — emoji are never used in the UI because
they render inconsistently across platforms.

## Known platform limits

- iOS exposes no call or message history, so "you never replied" is not
  computable
- There is no API to write Apple Notes, so wifi passwords go to an in-app vault
- SMS cannot be sent programmatically, which is why replies are drafts
