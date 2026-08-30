import AsyncStorage from '@react-native-async-storage/async-storage';
import { Analysis } from './fashion';

const KEY = 'fitted.looks.v1';
const MAX = 30;

export interface Look {
  id: string;
  savedAt: number;
  /** Original photo uri on the device. */
  photo: string;
  /** Generated try-on, base64 PNG. Null while it was still rendering. */
  tryOn: string | null;
  analysis: Analysis;
}

export async function loadLooks(): Promise<Look[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Look[];
  } catch {
    return [];
  }
}

/** Newest first, capped — base64 images are large and this is device storage. */
export async function saveLook(look: Look): Promise<void> {
  const existing = await loadLooks();
  const next = [look, ...existing.filter((l) => l.id !== look.id)].slice(0, MAX);
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}

export async function updateLookTryOn(id: string, tryOn: string): Promise<void> {
  const existing = await loadLooks();
  const next = existing.map((l) => (l.id === id ? { ...l, tryOn } : l));
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}

export async function deleteLook(id: string): Promise<void> {
  const existing = await loadLooks();
  await AsyncStorage.setItem(KEY, JSON.stringify(existing.filter((l) => l.id !== id)));
}
