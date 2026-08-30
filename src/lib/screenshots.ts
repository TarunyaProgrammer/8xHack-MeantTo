import * as MediaLibrary from 'expo-media-library';

/**
 * Screenshots are their own album on both platforms, so this is a filter and
 * not a classification problem. Nothing here ever invents an asset.
 */
const ALBUM_NAMES = ['Screenshots', 'Screenshot'];

export const SCAN_LIMIT = 50;

export type PermissionState = 'granted' | 'denied' | 'undetermined';

export async function requestPhotoPermission(): Promise<PermissionState> {
  const res = await MediaLibrary.requestPermissionsAsync();
  if (res.granted) return 'granted';
  return res.canAskAgain ? 'undetermined' : 'denied';
}

export async function getPhotoPermission(): Promise<PermissionState> {
  const res = await MediaLibrary.getPermissionsAsync();
  if (res.granted) return 'granted';
  return res.canAskAgain ? 'undetermined' : 'denied';
}

async function findScreenshotsAlbum(): Promise<MediaLibrary.Album | null> {
  for (const name of ALBUM_NAMES) {
    try {
      const album = await MediaLibrary.getAlbumAsync(name);
      if (album) return album;
    } catch {
      // getAlbumAsync rejects on some platforms when the album is absent.
    }
  }
  return null;
}

export interface Screenshot {
  assetId: string;
  uri: string;
  takenAt: number;
}

/**
 * Returns the most recent screenshots, newest first. Returns an empty array
 * when the album does not exist or is empty — callers must render a real
 * empty state rather than substituting anything.
 */
export async function listScreenshots(limit = SCAN_LIMIT): Promise<Screenshot[]> {
  const album = await findScreenshotsAlbum();

  const page = await MediaLibrary.getAssetsAsync({
    first: limit,
    sortBy: [[MediaLibrary.SortBy.creationTime, false]],
    mediaType: [MediaLibrary.MediaType.photo],
    ...(album ? { album } : {}),
  });

  return page.assets.map((asset) => ({
    assetId: asset.id,
    uri: asset.uri,
    takenAt: asset.creationTime,
  }));
}

/** Total screenshots — the headline number on the Verdict screen. */
export async function countScreenshots(): Promise<number> {
  const album = await findScreenshotsAlbum();
  if (album) return album.assetCount ?? 0;

  const page = await MediaLibrary.getAssetsAsync({
    first: 1,
    mediaType: [MediaLibrary.MediaType.photo],
  });
  return page.totalCount ?? 0;
}
