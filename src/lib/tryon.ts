import { Analysis } from './fashion';
import { toFileUri } from './image';

/**
 * Photoreal try-on. Returns a base64 PNG of the same person wearing the
 * suggested outfit — same face, same pose, same background.
 *
 * Identity preservation comes from three things, in order of impact:
 *  1. `input_fidelity: 'high'` on the edits endpoint. This is the parameter
 *     OpenAI added specifically to keep faces and other distinctive details
 *     intact through an edit. Without it the model treats the photo as loose
 *     inspiration and hands back a different, prettier human.
 *  2. `size: 'auto'`, so the output keeps the input's aspect ratio. Forcing a
 *     fixed size re-crops the subject, which shifts framing and drags the face
 *     with it.
 *  3. A prompt that spends most of its words on what must NOT change.
 */

const ENDPOINT = 'https://api.openai.com/v1/images/edits';

/**
 * Preferred first. gpt-image-1.5 tracks the input face noticeably closer than
 * gpt-image-1 at the same settings; gpt-image-1 is the fallback for keys that
 * have not been granted the newer model.
 */
const MODELS = ['gpt-image-1.5', 'gpt-image-1'];

/** Longest a single edit is allowed to take before we give up. */
const TIMEOUT_MS = 180_000;

/**
 * The outfit shape is owned by fashion.ts and may grow. Read it through a loose
 * view so a renamed or added field can never break the build here.
 */
type LooseOutfit = Record<string, unknown>;

const text = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

/** First non-empty string among the given keys. */
const pick = (outfit: LooseOutfit, ...keys: string[]): string => {
  for (const key of keys) {
    const value = text(outfit[key]);
    if (value) return value;
  }
  return '';
};

function garmentLines(outfit: Analysis['outfit']): string {
  const loose = (outfit ?? {}) as unknown as LooseOutfit;

  const parts: [string, string][] = [
    ['Top', pick(loose, 'top', 'upper', 'shirt')],
    ['Bottom', pick(loose, 'bottom', 'lower', 'trousers', 'pants')],
    ['Shoes', pick(loose, 'shoes', 'footwear')],
    ['Outerwear', pick(loose, 'outerwear', 'jacket', 'layer')],
    ['Accessory', pick(loose, 'accessory', 'accessories')],
  ];

  const lines = parts
    .filter(([, value]) => value.length > 0)
    .map(([label, value]) => `- ${label}: ${value}`);

  return lines.length ? lines.join('\n') : '- A simple, well-fitted outfit in colours that suit them';
}

function buildPrompt(outfit: Analysis['outfit']): string {
  return `Virtual clothing swap on this exact photograph.

ABSOLUTE RULE: the person in this photo is a specific real human being. Do not
generate a new person. Treat every pixel that is not clothing as locked.

MUST REMAIN IDENTICAL — carry these through from the input untouched:
- the face: bone structure, jawline, chin, cheekbones, nose shape and width,
  lips, eye shape, eye colour, eyebrows, facial hair, skin texture, moles,
  freckles and blemishes
- the exact hairstyle, hairline, hair length, hair colour and stray hairs
- skin tone and complexion on the face, neck, arms and hands
- body shape, height, weight, build, shoulder width and proportions
- the exact pose, limb positions, hand positions, head tilt and gaze direction
- the facial expression
- the background, floor, wall, shadows, lighting direction, colour temperature,
  camera angle, framing, crop and depth of field

CHANGE ONLY THE GARMENTS the person is wearing. Replace them with:
${garmentLines(outfit)}

The new garments must be photorealistic, drape naturally over this person's
actual body with realistic fabric folds, seams and shadows, and sit in the same
lighting as the original photograph.

Do not beautify, slim, retouch, restyle, age, de-age or otherwise idealise the
person. Do not smooth their skin. Do not change their weight or their height.
If the output face is not instantly recognisable as the exact same individual
as the input, the result is wrong.`;
}

function buildForm(model: string, fileUri: string, prompt: string): FormData {
  const form = new FormData();
  form.append('model', model);
  form.append('prompt', prompt);
  // The parameter that actually fixes the face. Only the edits endpoint takes
  // it, and only 'low' | 'high' are accepted.
  form.append('input_fidelity', 'high');
  form.append('quality', 'high');
  // Match the input's aspect ratio instead of forcing a portrait crop.
  form.append('size', 'auto');
  // No mask: a mask would have to be an accurate garment cutout, and a rough
  // one bleeds into skin and hair. High input fidelity handles the isolation.
  form.append('image[]', {
    uri: fileUri,
    name: 'photo.jpg',
    type: 'image/jpeg',
  } as unknown as Blob);
  return form;
}

/** True when the error is "this key cannot use that model", not a real failure. */
function isModelUnavailable(status: number, detail: string): boolean {
  if (status !== 400 && status !== 403 && status !== 404) return false;
  const lower = detail.toLowerCase();
  return (
    lower.includes('model') &&
    (lower.includes('does not exist') ||
      lower.includes('not found') ||
      lower.includes('unsupported') ||
      lower.includes('do not have access') ||
      lower.includes('must be verified'))
  );
}

export async function generateTryOn(uri: string, outfit: Analysis['outfit']): Promise<string> {
  const key = process.env.EXPO_PUBLIC_AI_KEY;
  if (!key) throw new Error('No API key');

  // The edits endpoint wants a real file, so a resized copy is written to disk.
  const fileUri = await toFileUri(uri, 1024);
  const prompt = buildPrompt(outfit);

  let lastError = 'Try-on failed';

  for (const model of MODELS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(ENDPOINT, {
        method: 'POST',
        // Content-Type is deliberately unset so fetch adds the multipart boundary.
        headers: { authorization: `Bearer ${key}` },
        body: buildForm(model, fileUri, prompt),
        signal: controller.signal,
      });
    } catch (error) {
      clearTimeout(timer);
      lastError = controller.signal.aborted
        ? 'Try-on timed out'
        : (error as Error)?.message || 'Try-on failed';
      continue;
    }
    clearTimeout(timer);

    if (response.ok) {
      const json = (await response.json()) as { data?: { b64_json?: string }[] };
      const b64 = json.data?.[0]?.b64_json;
      if (b64) return b64;
      lastError = 'No image returned';
      continue;
    }

    const detail = await response.text().catch(() => '');
    lastError = detail.slice(0, 200) || `Try-on failed (${response.status})`;
    // Anything other than "you can't use this model" is a genuine failure —
    // retrying on an older model would only burn another 40 seconds.
    if (!isModelUnavailable(response.status, detail)) break;
  }

  throw new Error(lastError);
}
