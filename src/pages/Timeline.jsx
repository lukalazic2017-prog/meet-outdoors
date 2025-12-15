// src/pages/Timeline.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function Timeline() {
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [user, setUser] = useState(null); // ⭐ DODATO

  const [search, setSearch] = useState("");
  const [activityFilter, setActivityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedPost, setSelectedPost] = useState(null);

  // ⭐ UCITAJ USERA
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user || null);
    });
  }, []);

  // ---- LOAD POSTS ----
  useEffect(() => {
    async function load() {
      setLoading(true);
      setErrorMsg("");

      const { data: postsData, error: postsErr } = await supabase
        .from("timeline_posts")
        .select("*")
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(80);

      if (postsErr) {
        console.error("Timeline load error:", postsErr);
        setErrorMsg("Could not load timeline. Please try again.");
        setLoading(false);
        return;
      }

      // Skupljanje user_id
      const userIds = [...new Set(postsData.map((p) => p.user_id).filter(Boolean))];

      let profilesMap = {};
      if (userIds.length > 0) {
        const { data: profilesData, error: profilesErr } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", userIds);

        if (!profilesErr && profilesData) {
          profilesData.forEach((p) => {
            profilesMap[p.id] = p;
          });
        }
      }

      setProfiles(profilesMap);
      setPosts(postsData || []);
      setLoading(false);
    }

    load();
  }, []);

  // ---- ACTIVITIES ----
  const activities = useMemo(() => {
    const s = new Set();
    posts.forEach((p) => p.activity && s.add(p.activity));
    return [...s];
  }, [posts]);

  // ---- STATISTIKA ----
  const stats = useMemo(() => {
    const total = posts.length;
    const videos = posts.filter((p) => p.type === "video").length;
    const photos = posts.filter((p) => p.type === "image").length;
    const uniqueActivities = activities.length;
    return { total, videos, photos, uniqueActivities };
  }, [posts, activities]);

  // ---- FILTER ----
  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      if (activityFilter !== "all" && p.activity !== activityFilter) return false;
      if (typeFilter !== "all" && p.type !== typeFilter) return false;

      const text = `${p.caption || ""} ${p.activity || ""}`.toLowerCase();
      if (search.trim() && !text.includes(search.toLowerCase())) return false;

      return true;
    });
  }, [posts, activityFilter, typeFilter, search]);

  const formatDate = (v) => (v ? new Date(v).toLocaleString() : "");

  // ⭐ DELETE POST (jedina nova funkcija)
  async function deletePost(postId) {
    if (!window.confirm("Delete this story permanently?")) return;

    const { error } = await supabase
      .from("timeline_posts")
      .delete()
      .eq("id", postId);

    if (error) {
      console.error(error);
      alert("Could not delete story.");
      return;
    }

    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }

  // ---- STYLES (isti tvoji) ----
  const pageStyle = {
    minHeight: "100vh",
    padding: "24px 16px 40px",
    background:
      "radial-gradient(circle at top, #062c22 0%, #02060b 45%, #000000 100%)",
    color: "#ffffff",
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    boxSizing: "border-box",
  };

  const containerStyle = { maxWidth: 1180, margin: "0 auto" };
  const heroWrapperStyle = { display: "flex", flexDirection: "column", gap: 18, marginBottom: 22 };
  const heroTopRowStyle = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" };
  const heroLeftStyle = { flex: "1 1 260px" };
  const heroRightStyle = { flex: "0 0 260px", display: "flex", flexDirection: "column", gap: 10 };

  const badgeStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 14px",
    borderRadius: 999,
    border: "1px solid rgba(0,255,160,0.7)",
    background:
      "linear-gradient(120deg, rgba(0,0,0,0.94), rgba(0,255,160,0.14))",
    fontSize: 11,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "rgba(210,255,230,0.9)",
  };

  const titleStyle = { fontSize: 34, fontWeight: 800, margin: "10px 0 4px" };
  const subtitleStyle = { fontSize: 14, color: "rgba(255,255,255,0.76)", maxWidth: 520 };

  const statRowStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0,1fr))",
    gap: 10,
    fontSize: 12,
  };

  const statBoxStyle = {
    padding: "10px 12px",
    borderRadius: 14,
    background:
      "linear-gradient(135deg, rgba(0,0,0,0.9), rgba(0,255,160,0.12))",
    border: "1px solid rgba(0,255,160,0.3)",
  };

  const statLabelStyle = { fontSize: 11, color: "rgba(210,255,230,0.8)" };
  const statValueStyle = { fontSize: 18, fontWeight: 700 };

  const addPostButtonStyle = {
    padding: "10px 16px",
    borderRadius: 999,
    border: "none",
    background:
      "linear-gradient(135deg, #00ffb0 0%, #00d1ff 45%, #ffffff 100%)",
    color: "#022015",
    fontWeight: 800,
    fontSize: 12,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    cursor: "pointer",
    boxShadow: "0 12px 30px rgba(0,255,160,0.35)",
  };

  const controlsRowStyle = {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
    alignItems: "center",
    marginTop: 6,
  };

  const searchInputStyle = {
    flex: "1 1 260px",
    padding: "10px 12px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(0,0,0,0.6)",
    color: "#ffffff",
    fontSize: 14,
    outline: "none",
  };

  const selectStyle = {
    flex: "0 0 170px",
    padding: "9px 12px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(0,0,0,0.6)",
    color: "#ffffff",
    fontSize: 13,
    outline: "none",
  };

  const gridStyle = { marginTop: 22, display: "flex", flexDirection: "column", gap: 18 };

  const cardStyle = {
    display: "flex",
    flexDirection: "row",
    gap: 16,
    padding: 16,
    borderRadius: 22,
    background:
      "linear-gradient(135deg, rgba(0,0,0,0.92), rgba(0,40,22,0.9))",
    boxShadow: "0 22px 50px rgba(0,0,0,0.9)",
    border: "1px solid rgba(255,255,255,0.04)",
  };

  const cardLeftStyle = {
    position: "relative",
    width: 260,
    minWidth: 260,
    height: 170,
    borderRadius: 18,
    overflow: "hidden",
    cursor: "pointer",
    background: "rgba(0,0,0,0.7)",
  };

  const mediaImageStyle = { width: "100%", height: "100%", objectFit: "cover", display: "block" };
  const playOverlayStyle = {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "radial-gradient(circle, rgba(0,0,0,0.3), rgba(0,0,0,0.7))",
    color: "#ffffff",
    fontSize: 38,
  };

  const gradientEdgeStyle = {
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(circle at top left, rgba(0,255,160,0.5), transparent 55%)",
    mixBlendMode: "soft-light",
    pointerEvents: "none",
  };

  const cardRightStyle = {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    minWidth: 0,
  };

  const userRowStyle = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
  };

  const avatarStyle = {
    width: 36,
    height: 36,
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid #00ffb0",
  };

  const nameStyle = { fontSize: 14, fontWeight: 600 };
  const timeStyle = { fontSize: 11, opacity: 0.7 };

  const captionStyle = {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    margin: "4px 0 8px",
  };

  const metaRowStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    flexWrap: "wrap",
  };

  const activityTagStyle = {
    padding: "4px 10px",
    borderRadius: 999,
    border: "1px solid rgba(0,255,160,0.7)",
    background: "rgba(0,255,160,0.08)",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  };

  const chipStyle = {
    padding: "3px 8px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.06)",
    fontSize: 11,
  };

  const errorStyle = {
    marginTop: 16,
    padding: "10px 12px",
    borderRadius: 14,
    background: "rgba(255,60,80,0.18)",
    border: "1px solid rgba(255,90,110,0.7)",
    color: "#ffd3d8",
    fontSize: 13,
  };

  const emptyStyle = {
    marginTop: 32,
    textAlign: "center",
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
  };

  const modalOverlayStyle = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.9)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2000,
  };

  const modalInnerStyle = {
    maxWidth: "960px",
    width: "100%",
    maxHeight: "88vh",
    padding: 16,
  };

  const modalMediaWrapperStyle = {
    width: "100%",
    maxHeight: "78vh",
    borderRadius: 22,
    overflow: "hidden",
    background: "black",
    marginBottom: 10,
  };

  const modalCloseBtnStyle = {
    marginTop: 6,
    padding: "7px 14px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.5)",
    background: "rgba(0,0,0,0.7)",
    color: "#ffffff",
    fontSize: 12,
    cursor: "pointer",
  };

  // -------------------------------
  //            RENDER
  // -------------------------------

  if (loading) {
    return (
      <div style={pageStyle}>
        <div style={containerStyle}>
          <div
            style={{
              minHeight: "60vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontSize: 16,
            }}
          >
            Loading timeline...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        {/* HERO */}
        <div style={heroWrapperStyle}>
          <div style={heroTopRowStyle}>
            <div style={heroLeftStyle}>
              <div style={badgeStyle}>
                <span>🧭 TIMELINE</span>
                <span style={{ opacity: 0.7 }}>· Live outdoor stories</span>
              </div>
              <h1 style={titleStyle}>See what the outdoors feels like.</h1>
              <p style={subtitleStyle}>
                Real moments from real explorers. Photos, videos and tours from
                mountains, rivers and cities all around the world.
              </p>
            </div>

            <div style={heroRightStyle}>
              <div style={statRowStyle}>
                <div style={statBoxStyle}>
                  <div style={statLabelStyle}>Total posts</div>
                  <div style={statValueStyle}>{stats.total}</div>
                </div>
                <div style={statBoxStyle}>
                  <div style={statLabelStyle}>Activities</div>
                  <div style={statValueStyle}>{stats.uniqueActivities}</div>
                </div>
                <div style={statBoxStyle}>
                  <div style={statLabelStyle}>Photos</div>
                  <div style={statValueStyle}>{stats.photos}</div>
                </div>
                <div style={statBoxStyle}>
                  <div style={statLabelStyle}>Videos</div>
                  <div style={statValueStyle}>{stats.videos}</div>
                </div>
              </div>

              <button
                type="button"
                style={addPostButtonStyle}
                onClick={() => navigate("/add-post")}
              >
                + Add new story
              </button>
            </div>
          </div>

          {/* CONTROLS */}
          <div style={controlsRowStyle}>
            <input
              style={searchInputStyle}
              placeholder="Search posts by caption or activity..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              style={selectStyle}
              value={activityFilter}
              onChange={(e) => setActivityFilter(e.target.value)}
            >
              <option value="all">All activities</option>
              {activities.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>

            <select
              style={{ ...selectStyle, flex: "0 0 140px" }}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">Photos + videos</option>
              <option value="image">Photos only</option>
              <option value="video">Videos only</option>
            </select>
          </div>
        </div>

        {/* ERROR */}
        {errorMsg && <div style={errorStyle}>{errorMsg}</div>}

        {/* EMPTY */}
        {filteredPosts.length === 0 && !errorMsg && (
          <div style={emptyStyle}>
            No posts found yet. Be the first to share an adventure – use{" "}
            <strong>“Add new story”</strong> above.
          </div>
        )}

        {/* LISTA POSTOVA */}
        <div style={gridStyle}>
          {filteredPosts.map((post) => {
            const profile = profiles[post.user_id] || {};
            const avatar =
              profile.avatar_url || "https://i.pravatar.cc/150?img=3";
            const name =
              profile.full_name ||
              profile.full_name ||
              "Outdoor explorer";

            const isVideo = post.type === "video";

            const likes = post.likes_count || 0;
            const comments = post.comments_count || 0;
            const shares = post.shares_count || 0;

            return (
              <div key={post.id} style={cardStyle}>
                {/* MEDIA */}
                <div
                  style={cardLeftStyle}
                  onClick={() => setSelectedPost(post)}
                >
                  {isVideo ? (
                    <>
                      <img
                        src={post.thumbnail_url || post.media_url}
                        alt={post.caption || "Video"}
                        style={mediaImageStyle}
                      />
                      <div style={playOverlayStyle}>▶</div>
                    </>
                  ) : (
                    <img
                      src={post.media_url}
                      alt={post.caption || "Image"}
                      style={mediaImageStyle}
                    />
                  )}
                  <div style={gradientEdgeStyle} />
                </div>

                {/* CONTENT */}
                <div style={cardRightStyle}>
                  <div>
                    <div style={userRowStyle}>
                      <img src={avatar} alt={name} style={avatarStyle} />
                      <div>
                        <div style={nameStyle}>{name}</div>
                        <div style={timeStyle}>
                          {formatDate(post.created_at)}
                        </div>
                      </div>
                    </div>

                    {post.caption && (
                      <div style={captionStyle}>{post.caption}</div>
                    )}

                    <div style={metaRowStyle}>
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          alignItems: "center",
                          flexWrap: "wrap",
                        }}
                      >
                        {post.activity && (
                          <span style={activityTagStyle}>
                            {post.activity.toUpperCase()}
                          </span>
                        )}
                        <span style={chipStyle}>
                          {isVideo ? "Video story" : "Photo story"}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, opacity: 0.8 }}>
                        ID: {post.id.slice(0, 6)}…
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: 10,
                      gap: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: 6,
                        alignItems: "center",
                        flexWrap: "wrap",
                        fontSize: 12,
                        color: "rgba(255,255,255,0.8)",
                      }}
                    >
                      <span>❤️ {likes}</span>
                      <span>· 💬 {comments}</span>
                      <span>· 🔁 {shares}</span>
                    </div>

                    {/* ⭐ DELETE BUTTON — vidi ga samo autor */}
                    {user?.id === post.user_id && (
                      <button
                        style={{
                          padding: "6px 12px",
                          borderRadius: 999,
                          border: "1px solid rgba(255,80,80,0.5)",
                          background: "rgba(255,0,0,0.25)",
                          color: "#ffb3b3",
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                        onClick={() => deletePost(post.id)}
                      >
                        Delete
                      </button>
                    )}

                    <button
                      type="button"
                      style={{
                        padding: "7px 13px",
                        borderRadius: 999,
                        border: "none",
                        background:
                          "linear-gradient(135deg, #00ffb0 0%, #00d1ff 50%, #ffffff 100%)",
                        color: "#02150b",
                        fontSize: 11,
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                      onClick={() => {
                        if (post.activity) {
                          navigate(
                            `/tours?activity=${encodeURIComponent(
                              post.activity
                            )}`
                          );
                        } else if (post.tour_id) {
                          navigate(`/tours?from=timeline`);
                        } else {
                          navigate("/tours");
                        }
                      }}
                    >
                      View related tours
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FULLSCREEN MODAL */}
      {selectedPost && (
        <div
          style={modalOverlayStyle}
          onClick={() => setSelectedPost(null)}
        >
          <div
            style={modalInnerStyle}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={modalMediaWrapperStyle}>
              {selectedPost.type === "video" ? (
                <video
                  src={selectedPost.media_url}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                  controls
                  autoPlay
                />
              ) : (
                <img
                  src={selectedPost.media_url}
                  alt={selectedPost.caption || "Media"}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                />
              )}
            </div>

            {selectedPost.caption && (
              <div style={{ fontSize: 14, marginBottom: 6 }}>
                {selectedPost.caption}
              </div>
            )}
            <button
              type="button"
              style={modalCloseBtnStyle}
              onClick={() => setSelectedPost(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}