import { supabase } from "../supabaseClient";

export async function sendNotification(userId, type, message, link = null) {
  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    type,
    message,
    link,
  });

  if (error) {
    console.error("Notification error:", error);
  }
}