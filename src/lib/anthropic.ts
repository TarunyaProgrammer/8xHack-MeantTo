import Anthropic from '@anthropic-ai/sdk';

/**
 * Model is pinned here so the extraction and verdict calls can never drift
 * apart. Extraction is a simple read-a-screenshot task, so it runs at low
 * effort — that is what keeps a 50-image scan inside the 30s budget.
 */
export const MODEL = 'claude-opus-5';
export const EFFORT = 'low' as const;

export class MissingKeyError extends Error {
  constructor() {
    super('No API key. Set EXPO_PUBLIC_AI_KEY in .env and restart the bundler.');
    this.name = 'MissingKeyError';
  }
}

let client: Anthropic | null = null;

/**
 * Throws rather than returning null. A missing key must surface as a visible
 * error state — this app never falls back to fabricated content.
 */
export function getClient(): Anthropic {
  const apiKey = process.env.EXPO_PUBLIC_AI_KEY;
  if (!apiKey) throw new MissingKeyError();
  if (!client) {
    client = new Anthropic({
      apiKey,
      // Required outside Node. The key ships in the bundle, which is acceptable
      // for a demo build only — a real release puts it behind a proxy.
      dangerouslyAllowBrowser: true,
    });
  }
  return client;
}

export function hasKey(): boolean {
  return Boolean(process.env.EXPO_PUBLIC_AI_KEY);
}
