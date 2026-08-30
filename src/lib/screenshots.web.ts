/**
 * Web build of the permission surface.
 *
 * There is no media library in a browser — the user hands us one file through
 * a picker, and the browser owns that consent. So permission is never
 * something this app has to request here.
 */
export type PermissionState = 'granted' | 'denied' | 'undetermined';

export const SCAN_LIMIT = 50;

export interface Screenshot {
  assetId: string;
  uri: string;
  takenAt: number;
}

export async function requestPhotoPermission(): Promise<PermissionState> {
  return 'granted';
}

export async function getPhotoPermission(): Promise<PermissionState> {
  return 'granted';
}

export async function listScreenshots(): Promise<Screenshot[]> {
  return [];
}

export async function countScreenshots(): Promise<number> {
  return 0;
}
