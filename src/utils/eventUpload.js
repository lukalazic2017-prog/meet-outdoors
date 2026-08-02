import { supabase } from "../supabaseClient";

export async function uploadEventCover(userId, file) {
  if (!file) return null;

  const ext = file.name.split(".").pop();
  const filePath = `event-${Date.now()}.${ext}`;

  const { data, error } = await supabase.storage
    .from("event-covers")
    .upload(filePath, file);

  alert(JSON.stringify({ data, error, filePath }));

  if (error) throw error;

  const { data: publicData } = supabase.storage
    .from("event-covers")
    .getPublicUrl(filePath);

  return publicData.publicUrl;
}