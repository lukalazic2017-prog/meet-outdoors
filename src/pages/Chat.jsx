import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function FollowersList() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);

  // ================= LOAD LISTS =================
  const loadLists = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);

    // Followers (ko mene prati)
    const { data: followersData } = await supabase
      .from("follows")
      .select("follower_id, profiles:profiles!follows_follower_id_fkey(*)")
      .eq("following_id", user.id);

    setFollowers(followersData?.map((row) => row.profiles) || []);

    // Following (koga ja pratim)
    const { data: followingData } = await supabase
      .from("follows")
      .select("following_id, profiles:profiles!follows_following_id_fkey(*)")
      .eq("follower_id", user.id);

    setFollowing(followingData?.map((row) => row.profiles) || []);

    setLoading(false);
  }, [user?.id]);

  // ================= USE EFFECT =================
  useEffect(() => {
    loadLists();
  }, [loadLists]);

  if (loading) {
    return (
      <div style={{ color: "white", padding: "20px" }}>
        Loading...
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#04140c",
        color: "white",
        padding: "20px",
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: "25px" }}>
        Followers & Following
      </h2>

      {/* FOLLOWERS */}
      <section style={{ marginBottom: "35px" }}>
        <h3>Followers</h3>

        {followers.length === 0 && (
          <p style={{ opacity: 0.6 }}>Nobody follows you yet.</p>
        )}

        {followers.map((p) => (
          <div
            key={p.id}
            onClick={() => navigate(`/profile/${p.id}`)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              background: "rgba(255,255,255,0.08)",
              padding: "12px",
              borderRadius: "12px",
              marginBottom: "10px",
              cursor: "pointer",
            }}
          >
            <img
              src={p.avatar_url || "https://i.pravatar.cc/100?img=12"}
              alt="avatar"
              style={{
                width: "45px",
                height: "45px",
                borderRadius: "50%",
                objectFit: "cover",
              }}
            />
            <div>
              <div style={{ fontWeight: 600 }}>
                {p.full_name || "User"}
              </div>
              <div style={{ opacity: 0.6, fontSize: "14px" }}>
                {p.role === "creator" ? "Tour Creator" : "Member"}
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* FOLLOWING */}
      <section>
        <h3>Following</h3>

        {following.length === 0 && (
          <p style={{ opacity: 0.6 }}>
            You're not following anyone yet.
          </p>
        )}

        {following.map((p) => (
          <div
            key={p.id}
            onClick={() => navigate(`/profile/${p.id}`)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              background: "rgba(255,255,255,0.08)",
              padding: "12px",
              borderRadius: "12px",
              marginBottom: "10px",
              cursor: "pointer",
            }}
          >
            <img
              src={p.avatar_url || "https://i.pravatar.cc/100?img=12"}
              alt="avatar"
              style={{
                width: "45px",
                height: "45px",
                borderRadius: "50%",
                objectFit: "cover",
              }}
            />
            <div>
              <div style={{ fontWeight: 600 }}>
                {p.full_name || "User"}
              </div>
              <div style={{ opacity: 0.6, fontSize: "14px" }}>
                {p.role === "creator" ? "Tour Creator" : "Member"}
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}