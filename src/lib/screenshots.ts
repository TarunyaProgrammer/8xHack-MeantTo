import {
  Album,
  AssetField,
  MediaType,
  Query,
  getPermissionsAsync,
  requestPermissionsAsync,
} from 'expo-media-library';

/**
 * Screenshots are their own album on both platforms, so this is a filter and
 * not a classification problem. Nothing here ever invents an asset.
 */
const ALBUM_NAMES = ['Screenshots', 'Screenshot'];

export const SCAN_LIMIT = 50;

/** Lightweight metadata reads are cheap; cap the count query rather than the album. */
const COUNT_LIMIT = 10000;

export type PermissionState = 'granted' | 'denied' | 'undetermined';

export async function requestPhotoPermission(): Promise<PermissionState> {
  const res = await requestPermissionsAsync();
  if (res.granted) return 'granted';
  return res.canAskAgain ? 'undetermined' : 'denied';
}

export async function getPhotoPermission(): Promise<PermissionState> {
  const res = await getPermissionsAsync();
  if (res.granted) return 'granted';
  return res.canAskAgain ? 'undetermined' : 'denied';
}

async function findScreenshotsAlbum(): Promise<Album | null> {
  for (const name of ALBUM_NAMES) {
    try {
      const album = await Album.get(name);
      if (album) return album;
    } catch {
      // Album.get throws on some platforms when the album is absent.
    }
  }
  return null;
}

function baseQuery(album: Album | null): Query {
  const query = new Query()
    .eq(AssetField.MEDIA_TYPE, MediaType.IMAGE)
    .orderBy({ key: AssetField.CREATION_TIME, ascending: false });
  return album ? query.album(album) : query;
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
  const assets = await baseQuery(album).limit(limit).exe();

  return Promise.all(
    assets.map(async (asset) => ({
      assetId: asset.id,
      uri: await asset.getUri(),
      takenAt: (await asset.getCreationTime()) ?? Date.now(),
    }))
  );
}

/**
 * Total screenshots in the album — the headline number on the Verdict screen.
 * Uses metadata-only execution so it stays fast on a large library.
 */
export async function countScreenshots(): Promise<number> {
  const album = await findScreenshotsAlbum();
  const metadata = await baseQuery(album).limit(COUNT_LIMIT).exeForMetadata();
  return metadata.length;
}
