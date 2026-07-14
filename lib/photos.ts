import { supabase } from "@/lib/supabase";
import { stripExifAndResize } from "@/lib/images";

/** Upload an EXIF-stripped JPEG under `{userId}/{…}.jpg` and return storage path. */
export async function uploadPrivateImage(
  bucket: "specimen-photos" | "check-uploads",
  localUri: string,
  objectName?: string,
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const cleanUri = await stripExifAndResize(localUri);
  const path = `${user.id}/${objectName ?? `${Date.now()}.jpg`}`;
  const file = await fetch(cleanUri).then((r) => r.arrayBuffer());
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: "image/jpeg",
    upsert: false,
  });
  if (error) throw error;
  return path;
}

export async function signedPhotoUrl(bucket: "specimen-photos" | "check-uploads", path: string) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
  if (error) throw error;
  return data.signedUrl;
}
