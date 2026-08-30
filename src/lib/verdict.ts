import { askText } from './ai';
import { Item, ItemType, TYPE_LABEL, emptyCounts } from '../types';

/** Counts come from the real extracted items. Nothing here is hardcoded. */
export function computeCounts(items: Item[]): Record<ItemType, number> {
  const counts = emptyCounts();
  for (const item of items) counts[item.type] += 1;
  return counts;
}

/**
 * Sums prices found on `link` items. Best effort — a screenshot with an
 * unreadable price contributes nothing rather than a guess.
 */
export function computeTotalValue(items: Item[]): number {
  return items
    .filter((i) => i.type === 'link' && i.payload.price)
    .reduce((sum, i) => {
      const digits = i.payload.price.replace(/[^0-9.]/g, '');
      const value = Number.parseFloat(digits);
      return Number.isFinite(value) ? sum + value : sum;
    }, 0);
}

export function actionableCount(items: Item[]): number {
  return items.filter((i) => i.type !== 'junk').length;
}

export function doneCount(items: Item[]): number {
  return items.filter((i) => i.status === 'done').length;
}

/** The breakdown rows on the Verdict screen, largest first, junk excluded. */
export function verdictRows(counts: Record<ItemType, number>) {
  return (Object.keys(counts) as ItemType[])
    .filter((t) => t !== 'junk' && counts[t] > 0)
    .sort((a, b) => counts[b] - counts[a])
    .map((type) => ({ type, label: TYPE_LABEL[type], count: counts[type] }));
}

/**
 * Derived entirely from real counts, so it is true even without a model call.
 * Used as-is if the model is unavailable — never a fabricated stand-in.
 */
function fallbackLine(total: number, done: number): string {
  if (total === 0) return 'Nothing to answer for.';
  return `You did ${done} of them.`;
}

/**
 * One short closing line. Input is the count table only — never the images.
 */
export async function generateVerdictLine(
  counts: Record<ItemType, number>,
  totalScreenshots: number,
  done: number
): Promise<string> {
  const rows = verdictRows(counts);
  if (rows.length === 0) return fallbackLine(rows.length, done);

  const table = rows.map((r) => `${r.count} ${r.label}`).join('\n');

  try {
    const line = await askText(
      `You write one closing line for a screen that has just shown someone
the truth about their screenshot folder.

Use only the numbers given. Never invent a number. Be specific and dry — the
line should land like a fact, not a joke. Under 60 characters. No exclamation
marks, no encouragement, no advice. Return the line only.

Good: "You did 3 of them."
Bad: "You have many unfinished tasks!"`,
      `${totalScreenshots} screenshots.\n${table}\nActed on: ${done}`
    );
    return line || fallbackLine(rows.length, done);
  } catch {
    return fallbackLine(rows.length, done);
  }
}
