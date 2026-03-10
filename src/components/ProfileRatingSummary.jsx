import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function ProfileRatingSummary({ profileId }) {

  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadStats();
  }, [profileId]);

  async function loadStats() {

    if (!profileId) return;

    const { data } = await supabase
      .from("profile_rating_stats")
      .select("*")
      .eq("profile_id", profileId)
      .maybeSingle();

    setStats(data || null);
  }

  if (!stats) return null;

  return (
    <div
      style={{
        marginTop: 10,
        padding: "6px 12px",
        borderRadius: 999,
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.1)",
        display: "inline-flex",
        alignItems: "center",
        gap: 8
      }}
    >
      ⭐ {stats.avg_rating?.toFixed(1)} ({stats.total_ratings})
    </div>
  );
}