import { supabase } from "@/lib/supabase";
import { stripExifAndResize } from "@/lib/images";

/** Upload a local image URI to specimen-photos after EXIF strip. Returns storage path. */
export async function uploadSpecimenPhoto(localUri: string, specimenId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const clean = await stripExifAndResize(localUri);
  const path = `${user.id}/${specimenId}/${Date.now()}.jpg`;
  const file = await fetch(clean).then((r) => r.arrayBuffer());
  const { error: upErr } = await supabase.storage
    .from("specimen-photos")
    .upload(path, file, { contentType: "image/jpeg", upsert: false });
  if (upErr) throw upErr;

  const { count } = await supabase
    .from("specimen_photos")
    .select("id", { count: "exact", head: true })
    .eq("specimen_id", specimenId);

  const { data, error } = await supabase
    .from("specimen_photos")
    .insert({
      specimen_id: specimenId,
      storage_path: path,
      is_primary: (count ?? 0) === 0,
    })
    .select("id, storage_path, is_primary")
    .single();
  if (error) throw error;
  return data;
}

export async function signedPhotoUrl(storagePath: string, expiresIn = 3600) {
  const { data, error } = await supabase.storage
    .from("specimen-photos")
    .createSignedUrl(storagePath, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}
