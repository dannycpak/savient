// EXIF stripping — re-encoding through expo-image-manipulator drops all metadata
// (including GPS) before anything is uploaded. Required by BACKEND_SPEC §9.
import * as ImageManipulator from "expo-image-manipulator";

export async function stripExifAndResize(uri: string, maxDim = 1600) {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: maxDim } }],
    { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG },
  );
  return result.uri; // clean JPEG, no EXIF
}
