import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

/** Downscaled for upload — analysis does not need full resolution. */
export async function toBase64(uri: string, width: number): Promise<string> {
  const image = await ImageManipulator.manipulate(uri).resize({ width }).renderAsync();
  const saved = await image.saveAsync({ compress: 0.7, format: SaveFormat.JPEG, base64: true });
  if (!saved.base64) throw new Error('Could not read that photo');
  return saved.base64;
}

/** Writes a resized JPEG to disk and returns its uri, for multipart upload. */
export async function toFileUri(uri: string, width: number): Promise<string> {
  const image = await ImageManipulator.manipulate(uri).resize({ width }).renderAsync();
  const saved = await image.saveAsync({ compress: 0.85, format: SaveFormat.JPEG });
  return saved.uri;
}
