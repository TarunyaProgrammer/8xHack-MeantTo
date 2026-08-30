import { Screenshot } from './screenshots';
import { Item } from '../types';

export interface ExtractProgress {
  done: number;
  total: number;
}

export interface ExtractResult {
  items: Item[];
  failed: number;
  firstError: string | null;
  failedIds: string[];
}

const DEMO_ITEMS: Item[] = [
  {
    id: 'web-1',
    assetId: 'web-demo-1',
    uri: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&auto=format&fit=crop&q=80',
    takenAt: Date.now() - 3600 * 1000 * 12,
    type: 'event',
    payload: {
      title: 'Design Systems Hackathon Pitch',
      datetime: new Date(Date.now() + 86400000 * 3).toISOString(),
    },
    status: 'pending',
    roastLine: 'Saved 3 days ago. Still haven’t marked your calendar.',
  },
  {
    id: 'web-2',
    assetId: 'web-demo-2',
    uri: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600&auto=format&fit=crop&q=80',
    takenAt: Date.now() - 3600 * 1000 * 24,
    type: 'contact',
    payload: {
      name: 'Alex Rivera',
      phone: '+1 (555) 234-5678',
    },
    status: 'pending',
    roastLine: 'A phone number trapped in a screenshot since Tuesday.',
  },
  {
    id: 'web-3',
    assetId: 'web-demo-3',
    uri: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
    takenAt: Date.now() - 3600 * 1000 * 48,
    type: 'wifi',
    payload: {
      ssid: 'Hackathon_5G_Guest',
      password: 'buildfastbreakthings',
    },
    status: 'pending',
    roastLine: 'You typed it once and kept the picture forever.',
  },
  {
    id: 'web-4',
    assetId: 'web-demo-4',
    uri: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80',
    takenAt: Date.now() - 3600 * 1000 * 72,
    type: 'place',
    payload: {
      name: 'Tartine Bakery',
      address: '600 Guerrero St, San Francisco, CA',
    },
    status: 'pending',
    roastLine: 'Saved for brunch that never happened.',
  },
  {
    id: 'web-5',
    assetId: 'web-demo-5',
    uri: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
    takenAt: Date.now() - 3600 * 1000 * 96,
    type: 'link',
    payload: {
      url: 'https://store.example.com/item',
      price: '$180',
    },
    status: 'pending',
    roastLine: '$180 item you stared at and never bought.',
  },
];

export async function extractAll(
  shots: Screenshot[],
  cached: Item[],
  onProgress?: (p: ExtractProgress) => void
): Promise<ExtractResult> {
  for (let i = 1; i <= shots.length; i++) {
    await new Promise((r) => setTimeout(r, 200));
    onProgress?.({ done: i, total: shots.length });
  }

  return {
    items: DEMO_ITEMS,
    failed: 0,
    firstError: null,
    failedIds: [],
  };
}
