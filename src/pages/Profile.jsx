// src/pages/Profile.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function Profile() {
  const { id } = useParams(); // user id čiji profil gledamo
  const navigate = useNavigate();

  const [authUser, setAuthUser] = useState(null);
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [tours, setTours] = useState([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);

  const [avgRating, setAvgRating] = useState(null);
  const [ratingsCount, setRatingsCount] = useState(0);
  const [myRating, setMyRating] = useState(0);
  const [isRatingSaving, setIsRatingSaving] = useState(false);

  const [timeline, setTimeline] = useState([]);

  const [ratingPanelOpen, setRatingPanelOpen] = useState(false);

  // ================== LOAD AUTH USER ==================
  useEffect(() => {
    async function loadAuth() {
      const { data } = await supabase.auth.getUser();
      setAuthUser(data?.user || null);
    }
    loadAuth();
  }, []);

  // ================== LOAD PROFILE DATA ==================
  useEffect(() => {
    if (!id) return;
    async function loadProfile() {
      setLoading(true);

      // 1) PROFILE (pretpostavljam tabela "profiles")
     let { data: profileData } = await supabase
  .from("profiles")
  .select("*")
  .eq("id", id)
  .maybeSingle();

if (!profileData) {
  const { error: insertErr } = await supabase
    .from("profiles")
    .insert({
      id,
      full_name: "",
      bio: "",
      avatar_url: "",
      cover_url: "",
      home_base: "",
      favorite_activity: "",
      instagram_url: "",
      tiktok_url: "",
      youtube_url: "",
    });

  if (insertErr) console.error("Auto create profile:", insertErr);

  profileData = {
    id,
    full_name: "",
    bio: "",
    avatar_url: "",
    cover_url: "",
    home_base: "",
    favorite_activity: "",
    instagram_url: "",
    tiktok_url: "",
    youtube_url: "",
  };
}

setProfileUser(profileData);


      setProfileUser(profileData);

      // 2) TOURS (tabela "tours", polje creator_id)
      const { data: toursData } = await supabase
        .from("tours")
        .select("*")
        .eq("creator_id", id)
        .order("created_at", { ascending: false });

      setTours(toursData || []);

      // 3) FOLLOWERS
      const { data: followers } = await supabase
        .from("followers")
        .select("*", { count: "exact", head: true })
        .eq("following_id", id);

      setFollowersCount(followers?.length ?? followers?.count ?? 0);

      // broj ljudi koje on prati
      const { data: following } = await supabase
        .from("followers")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", id);

      setFollowingCount(following?.length ?? following?.count ?? 0);

      // da li JA pratim njega
      if (authUser) {
        const { data: rel } = await supabase
          .from("followers")
          .select("id")
          .eq("follower_id", authUser.id)
          .eq("following_id", id)
          .maybeSingle();

        setIsFollowing(!!rel);
      }

      // 4) RATING
      const { data: ratingRows } = await supabase
        .from("user_ratings")
        .select("*")
        .eq("rated_user_id", id);

      if (ratingRows && ratingRows.length > 0) {
        const sum = ratingRows.reduce((acc, r) => acc + (r.rating || 0), 0);
        const avg = sum / ratingRows.length;
        setAvgRating(avg);
        setRatingsCount(ratingRows.length);
      } else {
        setAvgRating(null);
        setRatingsCount(0);
      }

      if (authUser) {
        const { data: myRow } = await supabase
          .from("user_ratings")
          .select("*")
          .eq("rated_user_id", id)
          .eq("rater_id", authUser.id)
          .maybeSingle();

        setMyRating(myRow?.rating || 0);
      }

      // 5) TIMELINE – miks tura + ratinga (samo da izgleda brutalno)
      const timelineItems = [];

      (toursData || []).forEach((t) => {
        timelineItems.push({
          type: "tour",
          created_at: t.created_at,
          title: `Created a new tour: ${t.title}`,
          description: `${t.location_name || "Unknown place"}, ${
            t.country || ""
          }`,
        });
      });

      (ratingRows || []).forEach((r) => {
        timelineItems.push({
          type: "rating",
          created_at: r.created_at,
          title: `Received a ${r.rating}★ rating`,
          description: r.comment || "Someone enjoyed this adventure.",
        });
      });

      timelineItems.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      setTimeline(timelineItems.slice(0, 15));

      setLoading(false);
    }

    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, authUser?.id]);

  const isOwnProfile = authUser && authUser.id === id;

  // ================== XP & LEVEL ==================
  const { level, xp, nextLevelXp, levelName, levelColor } = useMemo(() => {
    const toursCount = tours.length;
    const followers = followersCount;
    const ratingBonus = avgRating ? avgRating * 40 : 0;

    const baseXp = toursCount * 120 + followers * 40 + ratingBonus * 3;
    const totalXp = Math.round(baseXp);

    // jednostavan sistem:
    // lvl1: 0-199, lvl2: 200-399, lvl3: 400-699, lvl4: 700-1199, lvl5+: 1200+
    let lvl = 1;
    if (totalXp >= 200) lvl = 2;
    if (totalXp >= 400) lvl = 3;
    if (totalXp >= 700) lvl = 4;
    if (totalXp >= 1200) lvl = 5;

    const lvlNames = {
      1: "Trail Rookie",
      2: "Forest Explorer",
      3: "Mountain Wolf",
      4: "Summit Hunter",
      5: "Wilderness Master",
    };

    const lvlColors = {
      1: "#7fefb5",
      2: "#4dd0ff",
      3: "#b184ff",
      4: "#ffe26b",
      5: "#ff9b6b",
    };

    const threshold = {
      1: 200,
      2: 400,
      3: 700,
      4: 1200,
      5: 1600,
    }[lvl];

    const prevThreshold = {
      1: 0,
      2: 200,
      3: 400,
      4: 700,
      5: 1200,
    }[lvl];

    const inLevelXp = Math.max(0, totalXp - prevThreshold);
    const neededInLevel = Math.max(1, threshold - prevThreshold);
    const nextXp = threshold;

    return {
      level: lvl,
      xp: totalXp,
      nextLevelXp: nextXp,
      levelName: lvlNames[lvl],
      levelColor: lvlColors[lvl],
      inLevelXp,
      neededInLevel,
    };
  }, [tours.length, followersCount, avgRating]);

  // progress (0–1) za XP bar
  const xpProgress = useMemo(() => {
    if (!nextLevelXp) return 0;
    const prevThreshold =
      level === 1 ? 0 : level === 2 ? 200 : level === 3 ? 400 : level === 4 ? 700 : 1200;
    const inLevelXp = xp - prevThreshold;
    const needed = nextLevelXp - prevThreshold;
    return Math.max(0, Math.min(1, inLevelXp / needed));
  }, [xp, level, nextLevelXp]);

  // ================== FOLLOW / UNFOLLOW ==================
  async function toggleFollow() {
    if (!authUser) {
      navigate("/login");
      return;
    }
    if (isOwnProfile) return;

    try {
      if (!isFollowing) {
        const { error } = await supabase.from("followers").insert({
          follower_id: authUser.id,
          following_id: id,
        });
        if (error) throw error;
        setIsFollowing(true);
        setFollowersCount((c) => c + 1);
      } else {
        const { error } = await supabase
          .from("followers")
          .delete()
          .eq("follower_id", authUser.id)
          .eq("following_id", id);
        if (error) throw error;
        setIsFollowing(false);
        setFollowersCount((c) => Math.max(0, c - 1));
      }
    } catch (err) {
      console.error("Follow error:", err);
      alert("Could not update follow status.");
    }
  }

  // ================== RATING SAVE ==================
  async function handleRate(newRating) {
    if (!authUser) {
      navigate("/login");
      return;
    }
    if (isOwnProfile) return;

    setIsRatingSaving(true);
    try {
      const { error } = await supabase.from("user_ratings").upsert(
        {
          rater_id: authUser.id,
          rated_user_id: id,
          rating: newRating,
        },
        {
          onConflict: "rater_id,rated_user_id",
        }
      );
      if (error) throw error;

      setMyRating(newRating);

      // recompute avg
      const { data: ratingRows } = await supabase
        .from("user_ratings")
        .select("*")
        .eq("rated_user_id", id);

      if (ratingRows && ratingRows.length > 0) {
        const sum = ratingRows.reduce((acc, r) => acc + (r.rating || 0), 0);
        const avg = sum / ratingRows.length;
        setAvgRating(avg);
        setRatingsCount(ratingRows.length);
      } else {
        setAvgRating(null);
        setRatingsCount(0);
      }
    } catch (err) {
      console.error("Rating error:", err);
      alert("Could not save rating.");
    } finally {
      setIsRatingSaving(false);
    }
  }

  // ================== STYLES ==================
  const pageStyle = {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top, #04251a 0%, #02070a 45%, #000000 100%)",
    color: "#ffffff",
    paddingBottom: 40,
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  };

  const containerStyle = {
    maxWidth: 1150,
    margin: "0 auto",
    padding: "18px 16px 40px",
  };

  const heroCardStyle = {
    position: "relative",
    borderRadius: 26,
    overflow: "hidden",
    border: "1px solid rgba(0,255,160,0.28)",
    boxShadow:
      "0 30px 80px rgba(0,0,0,0.9), 0 0 40px rgba(0,255,160,0.32)",
    marginBottom: 22,
  };

  const heroBackdropStyle = {
    width: "100%",
    height: 210,
    objectFit: "cover",
    filter: "saturate(1.15) contrast(1.03)",
    transform: "scale(1.03)",
  };

  const heroOverlayStyle = {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.92) 90%)",
  };

  const avatarOuterStyle = {
    position: "absolute",
    left: "50%",
    bottom: 20,
    transform: "translateX(-50%)",
    width: 104,
    height: 104,
    borderRadius: "50%",
    background:
      "radial-gradient(circle at 30% 0%, rgba(255,255,255,0.6), transparent 60%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const avatarRingStyle = {
    width: 94,
    height: 94,
    borderRadius: "50%",
    padding: 3,
    background: `conic-gradient(from 190deg, ${levelColor}, #00ffc3, #00b4ff, #7c4dff, ${levelColor})`,
    boxShadow:
      "0 0 30px rgba(0,255,190,0.7), 0 0 60px rgba(0,255,150,0.4)",
  };

  const avatarImgStyle = {
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    objectFit: "cover",
    border: "3px solid #02150e",
  };

  const heroContentStyle = {
    position: "absolute",
    left: 24,
    right: 24,
    bottom: 20,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 12,
  };

  const heroTextLeft = {
    maxWidth: 360,
  };

  const heroNameStyle = {
    fontSize: 26,
    fontWeight: 800,
    marginBottom: 4,
  };

  const heroSubStyle = {
    fontSize: 13,
    color: "rgba(230,255,245,0.8)",
  };

  const heroButtonsRight = {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 6,
  };

  const mainLayoutStyle = {
    marginTop: 60,
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.7fr) minmax(0, 1.3fr)",
    gap: 18,
  };

  const cardStyle = {
    background: "rgba(0,0,0,0.55)",
    borderRadius: 20,
    padding: 16,
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 24px 60px rgba(0,0,0,0.85)",
    backdropFilter: "blur(18px)",
  };

  const sectionTitleStyle = {
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    color: "rgba(210,255,230,0.85)",
    marginBottom: 10,
  };

  const pillRowStyle = {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  };

  const pillStyle = {
    padding: "4px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.18)",
    fontSize: 12,
    background: "rgba(0,0,0,0.5)",
  };

  const primaryActionBtn = {
    padding: "8px 16px",
    borderRadius: 999,
    border: "none",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 13,
    color: "#02130b",
    background:
      "linear-gradient(135deg, #00ffb0 0%, #00d1ff 50%, #ffffff 100%)",
    boxShadow: "0 0 18px rgba(0,255,180,0.65)",
  };

  const ghostBtn = {
    padding: "7px 14px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.35)",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 12,
    background: "rgba(0,0,0,0.3)",
    color: "#ffffff",
  };

  const ratingStarStyle = (active) => ({
    cursor: "pointer",
    fontSize: 24,
    marginRight: 2,
    filter: active
      ? "drop-shadow(0 0 8px rgba(255,230,120,0.8))"
      : "none",
  });

  const miniLabel = {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    color: "rgba(255,255,255,0.6)",
  };

  const statNumber = {
    fontSize: 18,
    fontWeight: 800,
  };

  const isSmallScreen =
    typeof window !== "undefined" && window.innerWidth < 850;

  const responsiveLayout = isSmallScreen
    ? { ...mainLayoutStyle, gridTemplateColumns: "1fr" }
    : mainLayoutStyle;

  // ================== RENDER ==================
  if (loading || !profileUser) {
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
            }}
          >
            Loading profile...
          </div>
        </div>
      </div>
    );
  }

  const avatarUrl =
    profileUser.avatar_url ||
    "https://i.pravatar.cc/300?img=12";

  const coverUrl =
    profileUser.cover_url ||
    (tours[0]?.cover_url ||
      "https://images.pexels.com/photos/417173/pexels-photo-417173.jpeg");

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        {/* HERO */}
        <div style={heroCardStyle}>
          <img src={coverUrl} alt="backdrop" style={heroBackdropStyle} />
          <div style={heroOverlayStyle} />

          {/* avatar ring */}
          <div style={avatarOuterStyle}>
            <div style={avatarRingStyle}>
              <img src={avatarUrl} alt="avatar" style={avatarImgStyle} />
            </div>
          </div>

          {/* hero content */}
          <div style={heroContentStyle}>
            <div style={heroTextLeft}>
              <div style={miniLabel}>
                Level {level} · {levelName}
              </div>
              <h1 style={heroNameStyle}>
                {profileUser.display_name || profileUser.username || "Explorer"}
              </h1>
              <div style={heroSubStyle}>
                {profileUser.bio ||
                  "No description yet. This explorer prefers actions over words."}
              </div>
            </div>

            <div style={heroButtonsRight}>
              {!isOwnProfile && (
                <button
                  style={primaryActionBtn}
                  onClick={toggleFollow}
                >
                  {isFollowing ? "Following ✓" : "Follow"}
                </button>
              )}

              {!isOwnProfile && (
                <button
                  style={ghostBtn}
                  onClick={() => setRatingPanelOpen((p) => !p)}
                >
                  {ratingPanelOpen ? "Close rating" : "Rate profile"}
                </button>
              )}

              {isOwnProfile && (
                <button
                  style={ghostBtn}
                  onClick={() => navigate("/edit-profile")}
                >
                  Edit profile
                </button>
              )}
            </div>
          </div>
        </div>

        {/* MAIN LAYOUT */}
        <div style={responsiveLayout}>
          {/* LEFT – XP, badges, timeline */}
          <div style={cardStyle}>
            {/* XP / LEVEL */}
            <div style={{ marginBottom: 18 }}>
              <div style={sectionTitleStyle}>Adventure level</div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "space-between",
                  gap: 10,
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={miniLabel}>XP</div>
                  <div style={statNumber}>{xp}</div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "rgba(255,255,255,0.65)",
                    }}
                  >
                    Next level at {nextLevelXp} XP
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: 180 }}>
                  <div
                    style={{
                      height: 10,
                      borderRadius: 999,
                      background: "rgba(255,255,255,0.1)",
                      overflow: "hidden",
                      boxShadow:
                        "0 0 16px rgba(0,255,190,0.35)",
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.round(xpProgress * 100)}%`,
                        height: "100%",
                        borderRadius: 999,
                        background: `linear-gradient(90deg, ${levelColor}, #00ffb0, #00d1ff)`,
                        transition: "width 0.4s ease",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 11,
                      color: "rgba(230,255,245,0.8)",
                    }}
                  >
                    {levelName}
                  </div>
                </div>
              </div>
            </div>

            {/* BADGES */}
            <div style={{ marginBottom: 18 }}>
              <div style={sectionTitleStyle}>Badges</div>
              <div style={pillRowStyle}>
                <div style={pillStyle}>
                  🏔️ {tours.length >= 3 ? "Trail Creator" : "New Guide"}
                </div>
                <div style={pillStyle}>
                  👥{" "}
                  {followersCount >= 5
                    ? "Community Builder"
                    : "Growing crew"}
                </div>
                <div style={pillStyle}>
                  ⭐{" "}
                  {avgRating
                    ? `Rated ${avgRating.toFixed(1)}★`
                    : "Awaiting first rating"}
                </div>
                {xp > 700 && (
                  <div style={pillStyle}>🔥 High-Altitude Grinder</div>
                )}
                {tours.length === 0 && (
                  <div style={pillStyle}>🌱 Just getting started</div>
                )}
              </div>
            </div>

            {/* TIMELINE */}
            <div>
              <div style={sectionTitleStyle}>Activity timeline</div>
              {timeline.length === 0 && (
                <div
                  style={{
                    fontSize: 13,
                    color: "rgba(255,255,255,0.7)",
                  }}
                >
                  No public activity yet. Once tours and ratings appear,
                  they will show up here.
                </div>
              )}

              {timeline.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    marginTop: 6,
                  }}
                >
                  {timeline.map((item, index) => (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        gap: 10,
                        fontSize: 13,
                        background: "rgba(0,0,0,0.5)",
                        borderRadius: 14,
                        padding: 10,
                        border:
                          "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <div
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 999,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background:
                            item.type === "tour"
                              ? "rgba(0,255,160,0.18)"
                              : "rgba(255,230,120,0.2)",
                        }}
                      >
                        {item.type === "tour" ? "🗺️" : "⭐"}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>
                          {item.title}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "rgba(255,255,255,0.7)",
                          }}
                        >
                          {item.description}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "rgba(255,255,255,0.5)",
                            marginTop: 3,
                          }}
                        >
                          {item.created_at &&
                            new Date(
                              item.created_at
                            ).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT – STATS, rating, gallery */}
          <div style={cardStyle}>
            {/* STATS */}
            <div style={{ marginBottom: 16 }}>
              <div style={sectionTitleStyle}>Stats</div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: 10,
                }}
              >
                <div>
                  <div style={miniLabel}>Tours</div>
                  <div style={statNumber}>{tours.length}</div>
                </div>
                <div>
                  <div style={miniLabel}>Followers</div>
                  <div style={statNumber}>{followersCount}</div>
                </div>
                <div>
                  <div style={miniLabel}>Following</div>
                  <div style={statNumber}>{followingCount}</div>
                </div>
              </div>
            </div>

            {/* RATING SUMMARY */}
            <div style={{ marginBottom: 16 }}>
              <div style={sectionTitleStyle}>Rating</div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 6,
                }}
              >
                <div style={{ fontSize: 26 }}>
                  {avgRating ? avgRating.toFixed(1) : "N/A"}
                  <span style={{ fontSize: 16 }}> ★</span>
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "rgba(255,255,255,0.7)",
                  }}
                >
                  {ratingsCount} rating
                  {ratingsCount === 1 ? "" : "s"}
                </div>
              </div>

              {!isOwnProfile && (
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      marginBottom: 4,
                      color: "rgba(255,255,255,0.8)",
                    }}
                  >
                    Your rating:
                  </div>
                  <div>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        onClick={() => handleRate(star)}
                        style={ratingStarStyle(star <= myRating)}
                      >
                        {star <= myRating ? "★" : "☆"}
                      </span>
                    ))}
                    {isRatingSaving && (
                      <span
                        style={{
                          marginLeft: 8,
                          fontSize: 11,
                          opacity: 0.7,
                        }}
                      >
                        Saving...
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* GALLERY */}
            <div style={{ marginBottom: 16 }}>
              <div style={sectionTitleStyle}>Recent adventures</div>
              {tours.length === 0 && (
                <div
                  style={{
                    fontSize: 13,
                    color: "rgba(255,255,255,0.7)",
                  }}
                >
                  No tours created yet.
                </div>
              )}

              {tours.length > 0 && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                    gap: 8,
                  }}
                >
                  {tours.slice(0, 6).map((t) => {
                    const img =
                      t.cover_url ||
                      (Array.isArray(t.image_urls) &&
                        t.image_urls[0]);
                    return (
                      <div
                        key={t.id}
                        onClick={() => navigate(`/tour/${t.id}`)}
                        style={{
                          borderRadius: 12,
                          overflow: "hidden",
                          cursor: "pointer",
                          border:
                            "1px solid rgba(255,255,255,0.15)",
                        }}
                      >
                        {img ? (
                          <img
                            src={img}
                            alt={t.title}
                            style={{
                              width: "100%",
                              height: 90,
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "100%",
                              height: 90,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 12,
                              background:
                                "linear-gradient(135deg,#063624,#020b0a)",
                            }}
                          >
                            {t.title}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* QUICK ACTIONS */}
            <div>
              <div style={sectionTitleStyle}>Quick actions</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {!isOwnProfile && (
                  <>
                    <button
                      style={ghostBtn}
                      onClick={() => navigate(`/chat/${id}`)}
                    >
                      💬 Start chat
                    </button>
                    <button
                      style={ghostBtn}
                      onClick={() => navigate("/create-tour")}
                    >
                      🗺️ Invite to a tour
                    </button>
                  </>
                )}

                {isOwnProfile && (
                  <button
                    style={ghostBtn}
                    onClick={() => navigate("/my-tours")}
                  >
                    🎒 Manage my tours
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RATING PANEL (ako želiš da iskače extra, ali već imamo gore) */}
        {ratingPanelOpen && !isOwnProfile && (
          <div
            style={{
              marginTop: 16,
              ...cardStyle,
            }}
          >
            <div style={sectionTitleStyle}>Rate this explorer</div>
            <div style={{ marginBottom: 6 }}>
              Click a star to rate between 1 and 5.
            </div>
            <div>
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  onClick={() => handleRate(star)}
                  style={ratingStarStyle(star <= myRating)}
                >
                  {star <= myRating ? "★" : "☆"}
                </span>
              ))}
              {isRatingSaving && (
                <span
                  style={{
                    marginLeft: 8,
                    fontSize: 11,
                    opacity: 0.7,
                  }}
                >
                  Saving...
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}