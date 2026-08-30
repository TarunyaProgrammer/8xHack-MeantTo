import { z } from 'zod';

/**
 * Minimal OpenAI Chat Completions client over fetch.
 *
 * Deliberately not the official SDK: it imports Node builtins at module load,
 * which Metro cannot resolve for React Native. This is small enough that a
 * direct client is less fragile than shimming those.
 */

const ENDPOINT = 'https://api.openai.com/v1/chat/completions';

/**
 * Pinned here so extraction and the verdict can never drift apart.
 * A vision-capable, cheap, fast model — a 50-image scan has to finish inside
 * the 30s budget without costing real money.
 */
export const MODEL = 'gpt-4o-mini';

export class MissingKeyError extends Error {
  constructor() {
    super('No API key. Set EXPO_PUBLIC_AI_KEY in .env and restart the bundler.');
    this.name = 'MissingKeyError';
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function hasKey(): boolean {
  return Boolean(process.env.EXPO_PUBLIC_AI_KEY);
}

function apiKey(): string {
  const key = process.env.EXPO_PUBLIC_AI_KEY;
  if (!key) throw new MissingKeyError();
  return key;
}

type TextPart = { type: 'text'; text: string };
type ImagePart = { type: 'image_url'; image_url: { url: string } };
export type ContentPart = TextPart | ImagePart;

/** Builds the data URI an image part needs. */
export function imagePart(base64: string, mediaType = 'image/jpeg'): ImagePart {
  return { type: 'image_url', image_url: { url: `data:${mediaType};base64,${base64}` } };
}

export function textPart(text: string): TextPart {
  return { type: 'text', text };
}

interface ChatResponse {
  choices?: { message?: { content?: string } }[];
  error?: { message?: string };
}

async function call(
  system: string,
  content: string | ContentPart[],
  maxTokens: number,
  responseFormat?: Record<string, unknown>
): Promise<string> {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey()}`,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content },
      ],
      ...(responseFormat ? { response_format: responseFormat } : {}),
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new ApiError(response.status, detail.slice(0, 300) || response.statusText);
  }

  const json = (await response.json()) as ChatResponse;
  if (json.error?.message) throw new ApiError(response.status, json.error.message);
  return json.choices?.[0]?.message?.content ?? '';
}

/** Free-text call. Used for the one-line verdict. */
export async function askText(system: string, prompt: string, maxTokens = 200): Promise<string> {
  return (await call(system, prompt, maxTokens)).trim();
}

/**
 * Structured call. Validates the response against the schema and throws if it
 * does not match — a malformed reply is never coerced into a plausible object.
 */
export async function askStructured<T extends z.ZodType>(
  schema: T,
  system: string,
  content: ContentPart[],
  maxTokens = 1024
): Promise<z.infer<T>> {
  const { $schema, ...jsonSchema } = z.toJSONSchema(schema) as Record<string, unknown>;

  const text = await call(system, content, maxTokens, {
    type: 'json_schema',
    json_schema: { name: 'extraction', strict: true, schema: jsonSchema },
  });

  return schema.parse(JSON.parse(text));
}
