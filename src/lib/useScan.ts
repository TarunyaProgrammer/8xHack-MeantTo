import { useCallback, useState } from 'react';
import { Item, ItemType, emptyCounts } from '../types';
import { MissingKeyError } from './anthropic';
import { extractAll } from './extract';
import { SCAN_LIMIT, countScreenshots, listScreenshots } from './screenshots';
import { loadItems, saveItems, saveSession } from './storage';
import { computeCounts, computeTotalValue, doneCount, generateVerdictLine } from './verdict';

export type ScanPhase = 'idle' | 'scanning' | 'done' | 'empty' | 'error';

export interface ScanState {
  phase: ScanPhase;
  progress: { done: number; total: number };
  items: Item[];
  counts: Record<ItemType, number>;
  totalScreenshots: number;
  totalValue: number;
  verdictLine: string;
  error: string | null;
}

const initial: ScanState = {
  phase: 'idle',
  progress: { done: 0, total: 0 },
  items: [],
  counts: emptyCounts(),
  totalScreenshots: 0,
  totalValue: 0,
  verdictLine: '',
  error: null,
};

export function useScan() {
  const [state, setState] = useState<ScanState>(initial);

  const run = useCallback(async () => {
    setState({ ...initial, phase: 'scanning' });

    try {
      const [shots, total] = await Promise.all([listScreenshots(SCAN_LIMIT), countScreenshots()]);

      // A genuinely empty album gets a genuinely empty state.
      if (shots.length === 0) {
        setState((s) => ({ ...s, phase: 'empty', totalScreenshots: 0 }));
        return;
      }

      setState((s) => ({ ...s, totalScreenshots: total, progress: { done: 0, total: shots.length } }));

      const cached = await loadItems();
      const items = await extractAll(shots, cached, (progress) =>
        setState((s) => ({ ...s, progress }))
      );

      await saveItems(items);

      const counts = computeCounts(items);
      const totalValue = computeTotalValue(items);
      const verdictLine = await generateVerdictLine(counts, total, doneCount(items));

      await saveSession({ scannedAt: Date.now(), counts, totalValue, executed: [] });

      setState({
        phase: 'done',
        progress: { done: shots.length, total: shots.length },
        items,
        counts,
        totalScreenshots: total,
        totalValue,
        verdictLine,
        error: null,
      });
    } catch (err) {
      // Fail loudly. Never degrade to fabricated content.
      const message =
        err instanceof MissingKeyError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Something went wrong reading your screenshots.';
      setState((s) => ({ ...s, phase: 'error', error: message }));
    }
  }, []);

  const setItems = useCallback((items: Item[]) => {
    setState((s) => ({ ...s, items }));
    void saveItems(items);
  }, []);

  return { ...state, run, setItems };
}
