import { supabase } from "../supabaseClient";

export async function uploadProfileFile({ bucket, userId, file, folder = "file" }) {
  if (!file) return null;

  const ext = file.name.split(".").pop();
  const filePath = `${userId}/${folder}-${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);

  return data.publicUrl;
}