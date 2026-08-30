import { z } from 'zod';

/**
 * Minimal Messages API client over fetch.
 *
 * The official SDK is not usable here: its credential chain imports node:fs,
 * node:path and node:crypto at module load, none of which Metro can resolve
 * for React Native. Shimming four Node builtins is more fragile than the
 * twenty lines below, so this talks to the API directly.
 */

const ENDPOINT = 'https://api.anthropic.com/v1/messages';
const API_VERSION = '2023-06-01';

/**
 * Pinned here so extraction and the verdict can never drift apart. Reading a
 * screenshot is a simple task, so it runs at low effort — that is what keeps a
 * 50-image scan inside the 30s budget.
 */
export const MODEL = 'claude-opus-5';
export const EFFORT = 'low' as const;

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

type TextBlock = { type: 'text'; text: string };
type ImageBlock = {
  type: 'image';
  source: { type: 'base64'; media_type: string; data: string };
};
export type ContentBlock = TextBlock | ImageBlock;

interface MessagesRequest {
  system?: string;
  content: string | ContentBlock[];
  maxTokens?: number;
  /** JSON Schema for structured output. */
  schema?: Record<string, unknown>;
}

interface MessagesResponse {
  content: { type: string; text?: string }[];
  stop_reason?: string;
}

async function call(req: MessagesRequest): Promise<string> {
  const body: Record<string, unknown> = {
    model: MODEL,
    max_tokens: req.maxTokens ?? 1024,
    messages: [{ role: 'user', content: req.content }],
    output_config: {
      effort: EFFORT,
      ...(req.schema ? { format: { type: 'json_schema', schema: req.schema } } : {}),
    },
  };
  if (req.system) body.system = req.system;

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey(),
      'anthropic-version': API_VERSION,
      // The key ships in the bundle for this demo build. A real release puts
      // it behind a proxy instead.
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new ApiError(response.status, detail.slice(0, 300) || response.statusText);
  }

  const json = (await response.json()) as MessagesResponse;
  return json.content.find((b) => b.type === 'text')?.text ?? '';
}

/** Free-text call. Used for the one-line verdict. */
export async function askText(system: string, prompt: string, maxTokens = 200): Promise<string> {
  return (await call({ system, content: prompt, maxTokens })).trim();
}

/**
 * Structured call. Validates the response against the schema and throws if it
 * does not match — a malformed reply is never coerced into a plausible object.
 */
export async function askStructured<T extends z.ZodType>(
  schema: T,
  system: string,
  content: ContentBlock[],
  maxTokens = 1024
): Promise<z.infer<T>> {
  const { $schema, ...jsonSchema } = z.toJSONSchema(schema) as Record<string, unknown>;

  const text = await call({ system, content, maxTokens, schema: jsonSchema });
  return schema.parse(JSON.parse(text));
}
