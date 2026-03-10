import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";

export default function ProfileRatingSummary({ profileId }) {
  const [avg, setAvg] = useState(0);
  const [count, setCount] = useState(0);

  const loadStats = useCallback(async () => {
    if (!profileId) return;

    const { data, error } = await supabase
      .from("profile_ratings")
      .select("rating")
      .eq("rated_user_id", profileId);

    if (error) {
      console.log("LOAD STATS ERROR:", error);
      setAvg(0);
      setCount(0);
      return;
    }

    const rows = data || [];
    const total = rows.reduce((sum, row) => sum + (row.rating || 0), 0);
    const average = rows.length ? total / rows.length : 0;

    setAvg(average);
    setCount(rows.length);
  }, [profileId]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (!count) return null;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        marginLeft: 10,
        padding: "4px 10px",
        borderRadius: 999,
        background: "rgba(255,211,107,0.12)",
        border: "1px solid rgba(255,211,107,0.28)",
        color: "#ffd36b",
        fontSize: 13,
        fontWeight: 800,
      }}
    >
      ⭐ {avg.toFixed(1)} ({count})
    </span>
  );
}