import * as MediaLibrary from 'expo-media-library';

export interface Photo {
  id: string;
  uri: string;
  takenAt: number;
}

/**
 * Most recent camera photos. Reuses the media library permission the app
 * already holds, so no new native module and no rebuild.
 */
export async function listRecentPhotos(limit = 24): Promise<Photo[]> {
  const page = await MediaLibrary.getAssetsAsync({
    first: limit,
    sortBy: [[MediaLibrary.SortBy.creationTime, false]],
    mediaType: [MediaLibrary.MediaType.photo],
  });
  return page.assets.map((a) => ({ id: a.id, uri: a.uri, takenAt: a.creationTime }));
}
