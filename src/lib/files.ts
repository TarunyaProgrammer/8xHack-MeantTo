import * as FileSystem from 'expo-file-system/legacy';

const DIR = `${FileSystem.documentDirectory}tryons`;

/**
 * Deterministic name: `<lookId>-<index>.png`. Because the name is derivable
 * from the look's id, a look's images can be found again on disk even if the
 * saved record lost track of their uris — which is exactly what happened to
 * every look saved before the record grew a per-outfit array.
 */
export function tryOnImageUri(lookId: string, index: number): string {
  return `${DIR}/${lookId}-${index}.png`;
}

/**
 * Try-on images live on disk, never in AsyncStorage. On Android AsyncStorage
 * is SQLite, and any row larger than the 2MB CursorWindow throws
 * "Row too big to fit into CursorWindow" on every subsequent read — a single
 * saved base64 PNG was enough to poison the whole store.
 */
export async function saveTryOnImage(lookId: string, index: number, base64: string): Promise<string> {
  const dir = await FileSystem.getInfoAsync(DIR);
  if (!dir.exists) await FileSystem.makeDirectoryAsync(DIR, { intermediates: true });
  const uri = tryOnImageUri(lookId, index);
  await FileSystem.writeAsStringAsync(uri, base64, { encoding: 'base64' });
  return uri;
}

/**
 * The image for this slot if it is still on disk, else null. Used to reclaim
 * renders that were paid for but never recorded, so reopening a look from
 * history does not pay for them a second time.
 */
export async function findTryOnImage(lookId: string, index: number): Promise<string | null> {
  const uri = tryOnImageUri(lookId, index);
  try {
    const info = await FileSystem.getInfoAsync(uri);
    return info.exists ? uri : null;
  } catch {
    return null;
  }
}

export async function deleteTryOnImage(uri: string | null): Promise<void> {
  if (!uri || !uri.startsWith(DIR)) return;
  await FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {});
}
