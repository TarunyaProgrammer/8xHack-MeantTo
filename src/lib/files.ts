import * as FileSystem from 'expo-file-system/legacy';

const DIR = `${FileSystem.documentDirectory}tryons`;

/**
 * Try-on images live on disk, never in AsyncStorage. On Android AsyncStorage
 * is SQLite, and any row larger than the 2MB CursorWindow throws
 * "Row too big to fit into CursorWindow" on every subsequent read — a single
 * saved base64 PNG was enough to poison the whole store.
 */
export async function saveTryOnImage(id: string, base64: string): Promise<string> {
  const dir = await FileSystem.getInfoAsync(DIR);
  if (!dir.exists) await FileSystem.makeDirectoryAsync(DIR, { intermediates: true });
  const uri = `${DIR}/${id}.png`;
  await FileSystem.writeAsStringAsync(uri, base64, { encoding: 'base64' });
  return uri;
}

export async function deleteTryOnImage(uri: string | null): Promise<void> {
  if (!uri || !uri.startsWith(DIR)) return;
  await FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {});
}
