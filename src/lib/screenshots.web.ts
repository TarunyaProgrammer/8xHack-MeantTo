export const SCAN_LIMIT = 50;

export type PermissionState = 'granted' | 'denied' | 'undetermined';

export async function requestPhotoPermission(): Promise<PermissionState> {
  return 'granted';
}

export async function getPhotoPermission(): Promise<PermissionState> {
  return 'granted';
}

export interface Screenshot {
  assetId: string;
  uri: string;
  takenAt: number;
}

export async function listScreenshots(limit = SCAN_LIMIT): Promise<Screenshot[]> {
  return [
    {
      assetId: 'web-demo-1',
      uri: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&auto=format&fit=crop&q=80',
      takenAt: Date.now() - 3600 * 1000 * 12,
    },
    {
      assetId: 'web-demo-2',
      uri: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600&auto=format&fit=crop&q=80',
      takenAt: Date.now() - 3600 * 1000 * 24,
    },
    {
      assetId: 'web-demo-3',
      uri: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
      takenAt: Date.now() - 3600 * 1000 * 48,
    },
    {
      assetId: 'web-demo-4',
      uri: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80',
      takenAt: Date.now() - 3600 * 1000 * 72,
    },
    {
      assetId: 'web-demo-5',
      uri: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
      takenAt: Date.now() - 3600 * 1000 * 96,
    },
  ];
}

export async function countScreenshots(): Promise<number> {
  return 84;
}
