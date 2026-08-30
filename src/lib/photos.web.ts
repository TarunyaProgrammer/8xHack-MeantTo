export interface Photo {
  id: string;
  uri: string;
  takenAt: number;
}

/**
 * A browser cannot enumerate the camera roll, and shouldn't be able to. The
 * web picker asks for a single file instead — see pickFile.
 */
export async function listRecentPhotos(): Promise<Photo[]> {
  return [];
}
