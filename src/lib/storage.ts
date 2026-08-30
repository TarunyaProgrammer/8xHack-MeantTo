import AsyncStorage from '@react-native-async-storage/async-storage';
import { Item, Session } from '../types';

// v2: v1 could contain junk entries written by failed extractions, which then
// suppressed every retry. Bumping the key discards those.
const K_ITEMS = 'meantto.items.v2';
const K_SESSION = 'meantto.session.v1';
const K_VAULT = 'meantto.vault.v1';

/**
 * Extraction is cached by assetId so a screenshot is never processed twice.
 * This is what keeps a rescan instant.
 */
export async function loadItems(): Promise<Item[]> {
  const raw = await AsyncStorage.getItem(K_ITEMS);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Item[];
  } catch {
    return [];
  }
}

export async function saveItems(items: Item[]): Promise<void> {
  await AsyncStorage.setItem(K_ITEMS, JSON.stringify(items));
}

export async function loadSession(): Promise<Session | null> {
  const raw = await AsyncStorage.getItem(K_SESSION);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export async function saveSession(session: Session): Promise<void> {
  await AsyncStorage.setItem(K_SESSION, JSON.stringify(session));
}

/** Wifi passwords land here — there is no API to write Apple Notes. */
export interface VaultEntry {
  id: string;
  label: string;
  value: string;
  savedAt: number;
}

export async function loadVault(): Promise<VaultEntry[]> {
  const raw = await AsyncStorage.getItem(K_VAULT);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as VaultEntry[];
  } catch {
    return [];
  }
}

export async function addToVault(entries: VaultEntry[]): Promise<void> {
  const existing = await loadVault();
  const merged = [...existing, ...entries.filter((e) => !existing.some((x) => x.id === e.id))];
  await AsyncStorage.setItem(K_VAULT, JSON.stringify(merged));
}

export async function clearAll(): Promise<void> {
  await AsyncStorage.multiRemove([K_ITEMS, K_SESSION, K_VAULT]);
}
