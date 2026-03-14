import * as ImageManipulator from 'expo-image-manipulator';

const PHOTO_MAX_PX = 1200;
const AVATAR_MAX_PX = 800;
const COMPRESS_QUALITY = 0.75;

/**
 * Resize + compress a check-in photo.
 * Longest side capped at 1200px, JPEG at 75% quality.
 * Returns a new local URI.
 */
export async function compressPhoto(uri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: PHOTO_MAX_PX } }],
    { compress: COMPRESS_QUALITY, format: ImageManipulator.SaveFormat.JPEG },
  );
  return result.uri;
}

/**
 * Resize + compress an avatar photo.
 * Longest side capped at 800px, JPEG at 75% quality.
 * Returns a new local URI.
 */
export async function compressAvatar(uri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: AVATAR_MAX_PX } }],
    { compress: COMPRESS_QUALITY, format: ImageManipulator.SaveFormat.JPEG },
  );
  return result.uri;
}
