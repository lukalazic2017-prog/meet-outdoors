import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";

export default function ProfileRatingBox({ ratedUserId, user }) {
  const [selected, setSelected] = useState(0);
  const [hover, setHover] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadMyRating = useCallback(async () => {
    if (!user || !ratedUserId) return;

    const { data } = await supabase
      .from("profile_ratings")
      .select("rating")
      .eq("rater_id", user.id)
      .eq("rated_user_id", ratedUserId)
      .maybeSingle();

    if (data) {
      setSelected(data.rating || 0);
    }
  }, [user, ratedUserId]);

  useEffect(() => {
    loadMyRating();
  }, [loadMyRating]);

  async function handleRate(value) {
    if (!user || user.id === ratedUserId) return;

    setSelected(value);
    setLoading(true);

    const { error } = await supabase
      .from("profile_ratings")
      .upsert(
        {
          rater_id: user.id,
          rated_user_id: ratedUserId,
          rating: value,
        },
        {
          onConflict: "rater_id,rated_user_id",
        }
      );

    if (error) {
      console.log("rating error:", error);
    }
    if (!error && ratedUserId !== user.id) {
  await supabase.from("notifications").insert({
    user_id: ratedUserId,
    title: "New rating received",
    body: "Someone rated your organizer profile.",
    type: "rating",
    seen: false,
    is_read: false,
    link: `/profile/${ratedUserId}`
  });
}

    setLoading(false);
  }

  if (!user || user.id === ratedUserId) return null;

  const active = hover || selected;

  const badge =
    active >= 5
      ? "Exceptional"
      : active >= 4
      ? "Excellent"
      : active >= 3
      ? "Good"
      : active >= 2
      ? "Fair"
      : active >= 1
      ? "Poor"
      : "";

  return (
    <div
      style={{
        marginTop: 18,
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "8px 12px",
        borderRadius: 12,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(10px)",
        width: "fit-content",
      }}
    >
      <div
        style={{
          fontSize: 11,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.55)",
          fontWeight: 700,
        }}
      >
        Rate organizer
      </div>

      <div style={{ display: "flex", gap: 6 }}>
        {[1, 2, 3, 4, 5].map((star) => {
          const activeStar = star <= active;

          return (
            <button
              key={star}
              type="button"
              onClick={() => handleRate(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              disabled={loading}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontSize: 20,
                padding: 0,
                color: activeStar ? "#ffd36b" : "rgba(255,255,255,0.25)",
                transition: "all 0.15s ease",
              }}
            >
              ★
            </button>
          );
        })}
      </div>

      {active > 0 && (
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "#ffd36b",
            letterSpacing: "0.04em",
          }}
        >
          {badge}
        </div>
      )}
    </div>
  );
}