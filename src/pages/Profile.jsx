 // src/pages/Profile.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";


/* ================= FRIEND BADGE ================= */
const FriendBadge = () => (
  <span
    style={{
      fontSize: 11,
      padding: "4px 12px",
      borderRadius: 999,
      background: "linear-gradient(135deg, #00ffc3, #00b4ff, #7c4dff)",
      color: "#02130d",
      fontWeight: 950,
      boxShadow: "0 0 18px rgba(0,255,195,0.45)",
      whiteSpace: "nowrap",
      border: "1px solid rgba(255,255,255,0.20)",
      letterSpacing: "0.06em",
    }}
  >
    🤝 FRIEND
  </span>
);

/* ================= SMALL SCREEN HOOK ================= */
function useIsSmall(breakpoint = 900) {
  const [isSmall, setIsSmall] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < breakpoint;
  });

  useEffect(() => {
    const onResize = () => setIsSmall(window.innerWidth < breakpoint);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);

  return isSmall;
}

/* ================= MOBILE PROFILE VIEW ================= */
/* ================= MOBILE PROFILE VIEW (FULL) ================= */
function MobileProfileView({
  profile,
  cover,
  avatar,
  xp,
  level,
  levelName,
  badgeText,
  badges,

  followersCount,
  followingCount,
  toursCount,
  eventsCount,
  avgRating,

  isOwnProfile,
  isFollowing,
  isFriend,
  followBusy,
  toggleFollow,
  goEdit,

  tours = [],
  events = [],
  timeline = [],
  navigate,
}) {
  const safeName = profile?.full_name || profile?.username || "Explorer";
  const safeCity = profile?.city || "City";
  const safeCountry = profile?.country || "Country";

  const openExternal = (url, type) => {
    if (!url) return "#";
    if (url.startsWith("http")) return url;

    const clean = url.replace("@", "").trim();
    if (type === "instagram") return `https://instagram.com/${clean}`;
    if (type === "tiktok") return `https://www.tiktok.com/@${clean}`;
    if (type === "youtube") return `https://youtube.com/@${clean}`;
    return url;
  };

  const fmtDate = (d) => {
    if (!d) return "";
    try {
      return new Date(d).toLocaleDateString();
    } catch {
      return "";
    }
  };

  const glass = {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "0 20px 70px rgba(0,0,0,0.65)",
    backdropFilter: "blur(16px)",
    borderRadius: 22,
  };

  const pill = {
    fontSize: 12,
    padding: "7px 12px",
    borderRadius: 999,
    background: "rgba(0,0,0,0.35)",
    border: "1px solid rgba(255,255,255,0.14)",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    whiteSpace: "nowrap",
  };

  const btnPrimary = {
    width: "100%",
    padding: "14px 0",
    borderRadius: 999,
    border: "none",
    fontWeight: 950,
    fontSize: 15,
    cursor: followBusy ? "default" : "pointer",
    background: isFollowing
      ? "rgba(255,255,255,0.14)"
      : "linear-gradient(135deg,#00ffc3,#00b4ff,#7c4dff)",
    color: isFollowing ? "white" : "#02130d",
    boxShadow: "0 0 30px rgba(0,255,195,0.30)",
    opacity: followBusy ? 0.7 : 1,
  };

  const btnGhost = {
    width: "100%",
    padding: "12px 0",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.22)",
    background: "rgba(0,0,0,0.35)",
    fontWeight: 950,
    color: "white",
    cursor: "pointer",
  };

  const sectionTitle = {
    fontSize: 12,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: "rgba(230,255,245,0.75)",
    marginBottom: 10,
  };

  const card = { ...glass, padding: 14 };

  const Stat = ({ label, value, onClick }) => (
    <div
      onClick={onClick}
      style={{
        background: "rgba(255,255,255,0.08)",
        borderRadius: 16,
        padding: 12,
        textAlign: "center",
        border: "1px solid rgba(255,255,255,0.10)",
        cursor: onClick ? "pointer" : "default",
      }}
    >
      <div style={{ fontSize: 18, fontWeight: 950 }}>{value}</div>
      <div style={{ fontSize: 11, opacity: 0.75 }}>{label}</div>
    </div>
  );

  const TourCard = ({ t }) => {
    const img =
      t.cover_url ||
      (Array.isArray(t.image_urls) ? t.image_urls[0] : null) ||
      "";

    return (
      <div
        onClick={() => navigate?.(`/tour/${t.id}`)}
        style={{
          cursor: "pointer",
          borderRadius: 18,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(0,0,0,0.35)",
        }}
      >
        <div style={{ position: "relative", height: 140 }}>
          {img ? (
            <img
              src={img}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                background:
                  "radial-gradient(320px 140px at 20% 25%, rgba(0,255,195,0.20), transparent 60%)," +
                  "radial-gradient(360px 160px at 80% 25%, rgba(124,77,255,0.18), transparent 65%)," +
                  "linear-gradient(180deg, rgba(0,0,0,0.20), rgba(0,0,0,0.92))",
              }}
            />
          )}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(0,0,0,0.05), rgba(0,0,0,0.88))",
            }}
          />
          <div style={{ position: "absolute", left: 10, bottom: 10, right: 10 }}>
            <div style={{ fontWeight: 950, fontSize: 14 }}>{t.title}</div>
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 3 }}>
              📍 {t.location_name || "Unknown place"}
              {t.country ? `, ${t.country}` : ""}
            </div>
          </div>
        </div>

        <div
          style={{
            padding: 10,
            display: "flex",
            justifyContent: "space-between",
            fontSize: 12,
            opacity: 0.9,
          }}
        >
          <span>{t.date_start ? `🗓 ${t.date_start}` : "🗓 Date TBA"}</span>
          <span>{t.price ? `💶 ${t.price}€` : "Free"}</span>
        </div>
      </div>
    );
  };

  const EventCard = ({ e }) => {
    const img = e.cover_url || "";
    return (
      <div
        onClick={() => navigate?.(`/event/${e.id}`)}
        style={{
          cursor: "pointer",
          borderRadius: 18,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(0,0,0,0.35)",
        }}
      >
        <div style={{ position: "relative", height: 140 }}>
          {img ? (
            <img
              src={img}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                background:
                  "radial-gradient(320px 140px at 20% 25%, rgba(124,77,255,0.22), transparent 60%)," +
                  "radial-gradient(360px 160px at 80% 25%, rgba(0,255,195,0.18), transparent 65%)," +
                  "linear-gradient(180deg, rgba(0,0,0,0.20), rgba(0,0,0,0.92))",
              }}
            />
          )}

          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(0,0,0,0.05), rgba(0,0,0,0.90))",
            }}
          />

          <div style={{ position: "absolute", left: 10, bottom: 10, right: 10 }}>
            <div style={{ fontWeight: 950, fontSize: 14 }}>{e.title}</div>
            <div style={{ fontSize: 12, opacity: 0.82, marginTop: 3 }}>
              📍 {e.city || "City"}
              {e.country ? `, ${e.country}` : ""}
            </div>
          </div>
        </div>

        <div
          style={{
            padding: 10,
            display: "flex",
            justifyContent: "space-between",
            fontSize: 12,
            opacity: 0.9,
          }}
        >
          <span>🗓 {e.start_date ? fmtDate(e.start_date) : "Date TBA"}</span>
          <span>→ Open</span>
        </div>
      </div>
    );
  };

  const TimelineRow = ({ it }) => {
    const icon = it.type === "tour" ? "🗺️" : it.type === "event" ? "🎟️" : "⭐";
    return (
      <div
        onClick={() => {
          if (it.type === "tour" && it.id) navigate?.(`/tour/${it.id}`);
          if (it.type === "event" && it.id) navigate?.(`/event/${it.id}`);
        }}
        style={{
          cursor: it.type === "rating" ? "default" : "pointer",
          borderRadius: 16,
          padding: 12,
          background: "rgba(0,0,0,0.35)",
          border: "1px solid rgba(255,255,255,0.10)",
          display: "flex",
          gap: 12,
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background:
              it.type === "tour"
                ? "rgba(0,255,195,0.16)"
                : it.type === "event"
                ? "rgba(124,77,255,0.18)"
                : "rgba(255,215,100,0.18)",
            border: "1px solid rgba(255,255,255,0.12)",
            flexShrink: 0,
          }}
        >
          {icon}
        </div>

        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 12, opacity: 0.75 }}>
            {it.created_at ? fmtDate(it.created_at) : ""}
          </div>
          <div
            style={{
              fontWeight: 950,
              fontSize: 14,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {it.title}
          </div>
          <div
            style={{
              fontSize: 13,
              opacity: 0.9,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              marginTop: 2,
            }}
          >
            {it.subtitle}
          </div>
          {it.meta ? (
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 3 }}>
              {it.meta}
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(700px 320px at 20% 0%, rgba(0,255,195,0.22), transparent 60%)," +
          "radial-gradient(700px 320px at 80% 0%, rgba(124,77,255,0.18), transparent 60%)," +
          "linear-gradient(180deg, #02080a, #010405)",
        color: "white",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* COVER + AVATAR OVERLAY */}
      <div style={{ position: "relative", height: 240 }}>
        {cover ? (
          <img
            src={cover}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "saturate(1.18) contrast(1.06) brightness(0.88)",
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              background:
                "radial-gradient(520px 220px at 15% 20%, rgba(0,255,195,0.25), transparent 60%)," +
                "radial-gradient(520px 240px at 85% 20%, rgba(124,77,255,0.22), transparent 60%)," +
                "linear-gradient(180deg, rgba(0,0,0,0.15), rgba(0,0,0,0.92))",
            }}
          />
        )}

        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.10), rgba(0,0,0,0.88))",
          }}
        />

        {/* avatar ring centered */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: -56,
            transform: "translateX(-50%)",
            width: 124,
            height: 124,
            borderRadius: "50%",
            padding: 4,
            background: "linear-gradient(135deg,#00ffc3,#00b4ff,#7c4dff)",
            boxShadow: "0 0 30px rgba(0,255,195,0.35)",
          }}
        >
          <img
            src={avatar}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              objectFit: "cover",
              objectPosition: "50% 35%", // malo ka čelu (bolje za portrete)
              border: "3px solid rgba(0,0,0,0.75)",
              background: "rgba(0,0,0,0.35)",
            }}
          />
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ padding: 14, paddingTop: 74, maxWidth: 720, margin: "0 auto" }}>
        {/* NAME + META */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 30, fontWeight: 950, lineHeight: 1.05 }}>
            {safeName}
          </div>

          <div style={{ opacity: 0.78, fontSize: 13, marginTop: 6 }}>
            📍 {safeCity}, {safeCountry}
          </div>

          <div
            style={{
              marginTop: 10,
              display: "flex",
              gap: 10,
              justifyContent: "center",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <span style={pill}>
              🧬 Level <b>{level}</b> • {levelName}
            </span>

            <span style={pill}>🧠 XP <b>{xp}</b></span>

            {badgeText ? <span style={pill}>🏅 {badgeText}</span> : null}
          </div>

          {badges?.length ? (
            <div
              style={{
                marginTop: 10,
                display: "flex",
                gap: 8,
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              {badges.slice(0, 6).map((b) => (
                <span
                  key={b.t}
                  title={b.tip}
                  style={{
                    fontSize: 12,
                    padding: "6px 10px",
                    borderRadius: 999,
                    background: "rgba(0,0,0,0.35)",
                    border: "1px solid rgba(255,255,255,0.14)",
                    opacity: 0.95,
                  }}
                >
                  {b.t}
                </span>
              ))}
            </div>
          ) : null}

          {isFriend ? (
            <div style={{ marginTop: 10 }}>
              <span
                style={{
                  fontSize: 11,
                  padding: "5px 12px",
                  borderRadius: 999,
                  background:
                    "linear-gradient(135deg, #00ffc3, #00b4ff, #7c4dff)",
                  color: "#02130d",
                  fontWeight: 950,
                  border: "1px solid rgba(255,255,255,0.20)",
                  letterSpacing: "0.06em",
                  boxShadow: "0 0 18px rgba(0,255,195,0.35)",
                }}
              >
                🤝 FRIEND
              </span>
            </div>
          ) : null}
        </div>

        {/* BIO */}
        <div
          style={{
            marginTop: 14,
            ...glass,
            padding: 14,
            lineHeight: 1.6,
            fontSize: 14,
            opacity: 0.92,
          }}
        >
          {profile?.bio || "No description yet. This explorer prefers actions over words."}
        </div>

        {/* STATS */}
        <div
          style={{
            marginTop: 14,
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 10,
          }}
        >
          <Stat label="Tours" value={toursCount} onClick={() => navigate?.(`/profile/${profile.id}?tab=tours`)} />
          <Stat label="Events" value={eventsCount} onClick={() => navigate?.(`/profile/${profile.id}?tab=events`)} />
          <Stat label="Followers" value={followersCount} />
          <Stat label="Rating" value={avgRating || "N/A"} />
        </div>

        {/* CTA */}
        <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
          {isOwnProfile ? (
            <>
              <button onClick={goEdit} style={btnGhost}>
                Edit profile
              </button>
              <button onClick={() => navigate?.("/my-tours")} style={btnGhost}>
                🎒 Manage tours
              </button>
            </>
          ) : (
            <button onClick={toggleFollow} disabled={followBusy} style={btnPrimary}>
              {isFollowing ? "Following ✓" : "Follow"}
            </button>
          )}

          {isFriend && !isOwnProfile ? (
            <button onClick={() => navigate?.(`/chat/${profile.id}`)} style={btnGhost}>
              💬 Chat
            </button>
          ) : null}
        </div>

        {/* SOCIAL LINKS */}
        {(profile?.instagram_url || profile?.tiktok_url || profile?.youtube_url) && (
          <div
            style={{
              marginTop: 16,
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {profile.instagram_url && (
              <a
                href={openExternal(profile.instagram_url, "instagram")}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: "8px 14px",
                  borderRadius: 999,
                  background: "rgba(225,48,108,0.18)",
                  border: "1px solid rgba(225,48,108,0.35)",
                  color: "white",
                  textDecoration: "none",
                  fontWeight: 900,
                  fontSize: 12,
                }}
              >
                📸 Instagram
              </a>
            )}
            {profile.tiktok_url && (
              <a
                href={openExternal(profile.tiktok_url, "tiktok")}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: "8px 14px",
                  borderRadius: 999,
                  background: "rgba(255,0,80,0.16)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  color: "white",
                  textDecoration: "none",
                  fontWeight: 900,
                  fontSize: 12,
                }}
              >
                🎵 TikTok
              </a>
            )}
            {profile.youtube_url && (
              <a
                href={openExternal(profile.youtube_url, "youtube")}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: "8px 14px",
                  borderRadius: 999,
                  background: "rgba(255,0,0,0.16)",
                  border: "1px solid rgba(255,0,0,0.35)",
                  color: "white",
                  textDecoration: "none",
                  fontWeight: 900,
                  fontSize: 12,
                }}
              >
                ▶️ YouTube
              </a>
            )}
          </div>
        )}

        {/* TOURS */}
        <div style={{ marginTop: 18, ...card }}>
          <div style={sectionTitle}>Tours</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 18, fontWeight: 950 }}>Created tours</div>
            <div style={pill}>🗺️ {tours.length}</div>
          </div>

          {tours.length === 0 ? (
            <div style={{ marginTop: 10, opacity: 0.75, fontSize: 13 }}>No tours created yet.</div>
          ) : (
            <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
              {tours.slice(0, 3).map((t) => (
                <TourCard key={t.id} t={t} />
              ))}
              {tours.length > 3 ? (
                <button style={btnGhost} onClick={() => navigate?.(`/profile/${profile.id}?tab=tours`)}>
                  View all tours →
                </button>
              ) : null}
            </div>
          )}
        </div>

        {/* EVENTS */}
        <div style={{ marginTop: 14, ...card }}>
          <div style={sectionTitle}>Events</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 18, fontWeight: 950 }}>Upcoming events</div>
            <div style={pill}>🎟️ {events.length}</div>
          </div>

          {events.length === 0 ? (
            <div style={{ marginTop: 10, opacity: 0.75, fontSize: 13 }}>No events yet.</div>
          ) : (
            <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
              {events.slice(0, 3).map((e) => (
                <EventCard key={e.id} e={e} />
              ))}
              {events.length > 3 ? (
                <button style={btnGhost} onClick={() => navigate?.(`/profile/${profile.id}?tab=events`)}>
                  View all events →
                </button>
              ) : null}
            </div>
          )}
        </div>

        {/* TIMELINE */}
        <div style={{ marginTop: 14, ...card, marginBottom: 28 }}>
          <div style={sectionTitle}>Timeline</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 18, fontWeight: 950 }}>Recent activity</div>
            <div style={pill}>🕒 {timeline.length}</div>
          </div>

          {timeline.length === 0 ? (
            <div style={{ marginTop: 10, opacity: 0.75, fontSize: 13 }}>No activity yet.</div>
          ) : (
            <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
              {timeline.slice(0, 6).map((it, idx) => (
                <TimelineRow key={idx} it={it} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isSmall = useIsSmall(900);

  const [authUser, setAuthUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [tours, setTours] = useState([]);
  const [events, setEvents] = useState([]);
  const [timeline, setTimeline] = useState([]);

  const [followersList, setFollowersList] = useState([]);
  const [friendsList, setFriendsList] = useState([]);

  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const [isFollowing, setIsFollowing] = useState(false);
  const [isFriend, setIsFriend] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);

  const [avgRating, setAvgRating] = useState(null);
  const [ratingsCount, setRatingsCount] = useState(0);
  const [myRating, setMyRating] = useState(null);
  const [ratingBusy, setRatingBusy] = useState(false);

  const [showFollowers, setShowFollowers] = useState(false);
  const [showFriends, setShowFriends] = useState(false);

  const [activeTab, setActiveTab] = useState("overview");

  const isOwnProfile = authUser && authUser.id === id;

  // ================= AUTH =================
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setAuthUser(data?.user || null));
  }, []);

  // ================= HELPERS =================
  const fmtDate = (d) => {
    if (!d) return "";
    try {
      return new Date(d).toLocaleString();
    } catch {
      return "";
    }
  };

  // ================= LOAD ALL =================
  async function loadAll() {
    if (!id) return;
    setLoading(true);

    const { data: auth } = await supabase.auth.getUser();
    const me = auth?.user || null;
    setAuthUser(me);

    // PROFILE
    const { data: prof, error: profErr } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();
    if (profErr) console.log("PROFILE ERR", profErr);
    setProfile(prof || null);

    // TOURS
    const { data: toursData, error: toursErr } = await supabase
      .from("tours")
      .select("*")
      .eq("creator_id", id)
      .order("created_at", { ascending: false });
    if (toursErr) console.log("TOURS ERR", toursErr);
    setTours(toursData || []);

    // EVENTS
    const { data: eventsData, error: eventsErr } = await supabase
      .from("events")
      .select("*")
      .eq("creator_id", id)
      .order("start_date", { ascending: true })
      .limit(12);
    if (eventsErr) console.log("EVENTS ERR", eventsErr);
    setEvents(eventsData || []);

    // FOLLOWERS COUNT
    const { count: followersCnt, error: followersCntErr } = await supabase
      .from("profile_follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", id);
    if (followersCntErr) console.log("FOLLOWERS COUNT ERR", followersCntErr);
    setFollowersCount(followersCnt || 0);

    // FOLLOWING COUNT
    const { count: followingCnt, error: followingCntErr } = await supabase
      .from("profile_follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", id);
    if (followingCntErr) console.log("FOLLOWING COUNT ERR", followingCntErr);
    setFollowingCount(followingCnt || 0);

    // DO I FOLLOW?
    let iFollow = false;
    if (me && me.id !== id) {
      const { data: row, error: rowErr } = await supabase
        .from("profile_follows")
        .select("id")
        .eq("follower_id", me.id)
        .eq("following_id", id)
        .maybeSingle();
      if (rowErr) console.log("FOLLOW CHECK ERR", rowErr);
      iFollow = !!row;
      setIsFollowing(!!row);
    } else {
      setIsFollowing(false);
    }

    // FRIEND CHECK (mutual follow) — računamo u istom loadAll (bez starih state-ova)
    let friendNow = false;
    if (me && me.id !== id) {
      const { data: a } = await supabase
        .from("profile_follows")
        .select("id")
        .eq("follower_id", me.id)
        .eq("following_id", id)
        .maybeSingle();

      const { data: b } = await supabase
        .from("profile_follows")
        .select("id")
        .eq("follower_id", id)
        .eq("following_id", me.id)
        .maybeSingle();

      friendNow = !!a && !!b;
      setIsFriend(friendNow);
    } else {
      setIsFriend(false);
    }

    // FOLLOWERS LIST (2-step safe)
    const { data: folIdsRows, error: folIdsErr } = await supabase
      .from("profile_follows")
      .select("follower_id, created_at")
      .eq("following_id", id)
      .order("created_at", { ascending: false })
      .limit(120);

    if (folIdsErr) console.log("FOLLOWERS IDS ERR", folIdsErr);

    const followerIds = (folIdsRows || []).map((r) => r.follower_id).filter(Boolean);

    if (followerIds.length === 0) {
      setFollowersList([]);
    } else {
      const { data: folProfiles, error: folProfilesErr } = await supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url, country, city")
        .in("id", followerIds);

      if (folProfilesErr) console.log("FOLLOWERS PROFILES ERR", folProfilesErr);

      const map = new Map((folProfiles || []).map((p) => [p.id, p]));
      const ordered = followerIds.map((pid) => map.get(pid)).filter(Boolean);
      setFollowersList(ordered);
    }

    // FRIENDS LIST (private)
    const canSeeFriendsNow = (me && me.id === id) || friendNow;
    if (canSeeFriendsNow) {
      const { data: followingRows, error: fr1Err } = await supabase
        .from("profile_follows")
        .select("following_id")
        .eq("follower_id", id)
        .limit(800);
      if (fr1Err) console.log("FRIENDS following ERR", fr1Err);

      const { data: followersRows2, error: fr2Err } = await supabase
        .from("profile_follows")
        .select("follower_id")
        .eq("following_id", id)
        .limit(800);
      if (fr2Err) console.log("FRIENDS followers ERR", fr2Err);

      const followingIds = new Set((followingRows || []).map((r) => r.following_id).filter(Boolean));
      const mutualIds = (followersRows2 || [])
        .map((r) => r.follower_id)
        .filter((x) => x && followingIds.has(x));

      if (mutualIds.length === 0) {
        setFriendsList([]);
      } else {
        const { data: mutualProfiles, error: mpErr } = await supabase
          .from("profiles")
          .select("id, full_name, username, avatar_url, country, city")
          .in("id", mutualIds);
        if (mpErr) console.log("FRIENDS PROFILES ERR", mpErr);

        const m = new Map((mutualProfiles || []).map((p) => [p.id, p]));
        const ordered = mutualIds.map((pid) => m.get(pid)).filter(Boolean);
        setFriendsList(ordered);
      }
    } else {
      setFriendsList([]);
    }

    // RATINGS (AVG + COUNT)
    const { data: ratings, error: rErr } = await supabase
      .from("profile_ratings")
      .select("rating, created_at")
      .eq("rated_user_id", id);
    if (rErr) console.log("RATINGS ERR", rErr);

    if (ratings && ratings.length > 0) {
      const sum = ratings.reduce((a, r) => a + (r.rating || 0), 0);
      setAvgRating(sum / ratings.length);
      setRatingsCount(ratings.length);
    } else {
      setAvgRating(null);
      setRatingsCount(0);
    }

    // MY RATING
    if (me && me.id !== id) {
      const { data: my, error: myErr } = await supabase
        .from("profile_ratings")
        .select("rating")
        .eq("rater_id", me.id)
        .eq("rated_user_id", id)
        .maybeSingle();
      if (myErr) console.log("MY RATING ERR", myErr);
      setMyRating(my?.rating || null);
    } else {
      setMyRating(null);
    }

    // TIMELINE (tours + events + rating)
    const items = [];

    (toursData || []).forEach((t) => {
      items.push({
        type: "tour",
        created_at: t.created_at,
        title: "Created a new tour",
        subtitle: t.title,
        meta: `${t.location_name || "Unknown place"}${t.country ? `, ${t.country}` : ""}`,
        cover: t.cover_url || (Array.isArray(t.image_urls) ? t.image_urls[0] : null),
        id: t.id,
      });
    });

    (eventsData || []).forEach((e) => {
      items.push({
        type: "event",
        created_at: e.created_at || e.start_date || new Date().toISOString(),
        title: "Created an event",
        subtitle: e.title,
        meta: `${e.city || "City"}${e.country ? `, ${e.country}` : ""}`,
        cover: e.cover_url || null,
        id: e.id,
      });
    });

    (ratings || []).slice(0, 10).forEach((r) => {
      items.push({
        type: "rating",
        created_at: r.created_at,
        title: "Received a rating",
        subtitle: `${r.rating} ★`,
        meta: "Someone rated this explorer.",
        cover: null,
        id: null,
      });
    });

    items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    setTimeline(items.slice(0, 16));

    setLoading(false);
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line
  }, [id]);

  // ================= ACTIONS =================
  async function toggleFollow(e) {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    if (!authUser) return navigate("/login");
    if (isOwnProfile) return;
    if (followBusy) return;

    setFollowBusy(true);

    try {
      if (isFollowing) {
        const { error } = await supabase
          .from("profile_follows")
          .delete()
          .eq("follower_id", authUser.id)
          .eq("following_id", id);
        if (error) console.log("UNFOLLOW ERR", error);
      } else {
        const { error } = await supabase.from("profile_follows").insert({
          follower_id: authUser.id,
          following_id: id,
        });
        if (error) console.log("FOLLOW ERR", error);
      }
      await loadAll();
    } finally {
      setFollowBusy(false);
    }
  }

  async function rate(value) {
    if (!authUser) return navigate("/login");
    if (isOwnProfile) return;
    if (ratingBusy) return;

    setRatingBusy(true);
    try {
      const { error } = await supabase.from("profile_ratings").upsert(
        { rater_id: authUser.id, rated_user_id: id, rating: value },
        { onConflict: "rater_id,rated_user_id" }
      );
      if (error) console.log("RATE ERR", error);

      setMyRating(value);
      await loadAll();
    } finally {
      setRatingBusy(false);
    }
  }

  // ================= XP / LEVEL / BADGES =================
  const { level, levelName, theme, xp, nextCap, progress, badgeText, badges } = useMemo(() => {
    const totalXp =
      (tours.length || 0) * 120 +
      (events.length || 0) * 80 +
      (followersCount || 0) * 40 +
      (avgRating ? avgRating * 60 : 0) +
      (isFriend ? 200 : 0);

    let lvl = 1;
    if (totalXp >= 250) lvl = 2;
    if (totalXp >= 550) lvl = 3;
    if (totalXp >= 950) lvl = 4;
    if (totalXp >= 1500) lvl = 5;

    const names = {
      1: "Trail Rookie",
      2: "Forest Explorer",
      3: "Pathfinder",
      4: "Summit Alpha",
      5: "Wilderness Legend",
    };

    const caps = { 1: 250, 2: 550, 3: 950, 4: 1500, 5: 2200 };
    const prev = lvl === 1 ? 0 : caps[lvl - 1];
    const cap = caps[lvl];
    const prog = Math.max(0, Math.min(1, (totalXp - prev) / (cap - prev)));

    const themes = {
      1: { a: "#00ffc3", b: "#00b4ff", c: "#7c4dff" },
      2: { a: "#00ffb0", b: "#00d1ff", c: "#ffffff" },
      3: { a: "#b184ff", b: "#00ffc3", c: "#00b4ff" },
      4: { a: "#ffe26b", b: "#ff9b6b", c: "#00ffc3" },
      5: { a: "#ff4dd8", b: "#00ffc3", c: "#00b4ff" },
    };

    const badge = {
      1: "🌱 Just getting started",
      2: "🌲 Growing explorer",
      3: "🧭 Pathfinder energy",
      4: "⛰️ Summit grinder",
      5: "🏆 Absolute legend",
    }[lvl];

    const b = [];
    if ((tours.length || 0) >= 1) b.push({ t: "🧭 Explorer", tip: "Created at least 1 tour" });
    if ((events.length || 0) >= 1) b.push({ t: "🏕️ Host", tip: "Created at least 1 event" });
    if (followersCount >= 10) b.push({ t: "🔥 Popular", tip: "10+ followers" });
    if (lvl >= 4) b.push({ t: "💠 Elite", tip: "Level 4+" });
    if (lvl >= 5) b.push({ t: "🏆 Legend", tip: "Level 5" });

    return {
      level: lvl,
      levelName: names[lvl],
      theme: themes[lvl] || themes[1],
      xp: Math.round(totalXp),
      nextCap: cap,
      progress: prog,
      badgeText: badge,
      badges: b,
    };
  }, [tours.length, events.length, followersCount, avgRating, isFriend]);

  // ================= UI STYLES =================
  const page = {
    minHeight: "100vh",
    color: "#eafff7",
    background:
      "radial-gradient(1200px 600px at 15% 0%, rgba(0,255,195,0.18), transparent 55%)," +
      "radial-gradient(900px 500px at 85% 10%, rgba(124,77,255,0.16), transparent 55%)," +
      "linear-gradient(180deg, #02080a 0%, #010405 100%)",
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  };

  const wrap = {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "18px 16px 90px",
    display: "flex",
    flexDirection: "column",
    gap: 18,
  };

  const glass = {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "0 30px 90px rgba(0,0,0,0.65)",
    backdropFilter: "blur(18px)",
    borderRadius: 26,
  };

  const card = { ...glass, padding: 18 };

  const sectionTitle = {
    fontSize: 12,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: "rgba(230,255,245,0.75)",
    marginBottom: 10,
  };

  const pill = {
    padding: "8px 12px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.35)",
    fontSize: 12,
    display: "inline-flex",
    gap: 8,
    alignItems: "center",
  };

  const btnPrimary = {
    padding: "12px 18px",
    borderRadius: 999,
    border: "none",
    cursor: "pointer",
    fontWeight: 950,
    color: "#03120c",
    background: `linear-gradient(135deg, ${theme.a}, ${theme.b}, ${theme.c})`,
    boxShadow: "0 10px 34px rgba(0,255,195,0.26)",
    transition: "transform .15s ease, opacity .15s ease",
  };

  const btnGhost = {
    padding: "11px 16px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.26)",
    background: "rgba(0,0,0,0.35)",
    color: "white",
    cursor: "pointer",
    fontWeight: 900,
    transition: "transform .15s ease, opacity .15s ease",
  };

  const tabsWrap = {
    ...glass,
    padding: 10,
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
  };

  const tabBtn = (active) => ({
    ...btnGhost,
    padding: "10px 14px",
    borderRadius: 999,
    background: active ? `linear-gradient(135deg, ${theme.a}, ${theme.b}, ${theme.c})` : "rgba(0,0,0,0.35)",
    color: active ? "#03120c" : "white",
    border: "1px solid rgba(255,255,255,0.14)",
    boxShadow: active ? "0 10px 30px rgba(0,255,195,0.18)" : "none",
  });

  const grid = {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.6fr) minmax(0, 1.1fr)",
    gap: 18,
  };
  const gridResponsive = isSmall ? { ...grid, gridTemplateColumns: "1fr" } : grid;

  // ================= RENDER LOADING =================
  if (loading || !profile) {
    return (
      <div style={page}>
        <div style={wrap}>
          <div
            style={{
              ...glass,
              padding: 28,
              minHeight: "60vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
            }}
          >
            Loading profile…
          </div>
        </div>
      </div>
    );
  }

  // ================= ASSETS (AVATAR + COVER) =================
  const avatar = profile.avatar_url || "https://i.pravatar.cc/300?img=12";
  const cover =
    profile.cover_url ||
    profile.header_url ||
    profile.banner_url ||
    profile.cover ||
    profile.cover_image_url ||
    "";

  const canSeeFriends = isOwnProfile || isFriend;

  // ================= MOBILE OVERRIDE =================
  if (isSmall) {
  return (
    <MobileProfileView
      profile={profile}
      cover={cover}
      avatar={avatar}
      xp={xp}
      level={level}
      levelName={levelName}
      badgeText={badgeText}
      badges={badges}
      followersCount={followersCount}
      followingCount={followingCount}
      toursCount={tours.length}
      eventsCount={events.length}
      avgRating={avgRating ? avgRating.toFixed(1) : null}
      isOwnProfile={isOwnProfile}
      isFollowing={isFollowing}
      isFriend={isFriend}
      followBusy={followBusy}
      toggleFollow={toggleFollow}
      goEdit={() => navigate("/edit-profile")}
      tours={tours}
      events={events}
      timeline={timeline}
      navigate={navigate}
    />
  );
}

  // ================= DESKTOP UI =================
  const actionBar = (
    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
      {!isOwnProfile ? (
        <>
          <button
            type="button"
            style={{ ...btnPrimary, opacity: followBusy ? 0.7 : 1 }}
            onClick={toggleFollow}
            disabled={followBusy}
          >
            {isFollowing ? "Following ✓" : "Follow"}
          </button>

          {isFriend && (
            <button style={btnGhost} onClick={() => navigate(`/chat/${id}`)}>
              💬 Chat
            </button>
          )}

          {isFriend && <FriendBadge />}
        </>
      ) : (
        <>
          <button style={btnGhost} onClick={() => navigate("/edit-profile")}>
            Edit profile
          </button>
          <button style={btnGhost} onClick={() => navigate("/my-tours")}>
            🎒 Manage tours
          </button>
        </>
      )}
    </div>
  );

  const heroCard = (
    <div style={{ ...glass, overflow: "visible", position: "relative", padding: 0 }}>
      {/* cover */}
      <div style={{ position: "relative", height: 340 }}>
        {cover ? (
          <img
            src={cover}
            alt="cover"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "saturate(1.18) contrast(1.06) brightness(0.92)",
              transform: "scale(1.03)",
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              background:
                "radial-gradient(800px 320px at 18% 18%, rgba(0,255,195,0.22), transparent 60%)," +
                "radial-gradient(820px 340px at 82% 18%, rgba(124,77,255,0.20), transparent 65%)," +
                "linear-gradient(180deg, rgba(0,0,0,0.25), rgba(0,0,0,0.92))",
            }}
          />
        )}

        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.92) 92%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(520px 260px at 18% 12%, rgba(0,255,195,0.25), transparent 65%)," +
              "radial-gradient(540px 280px at 82% 12%, rgba(124,77,255,0.22), transparent 70%)",
            mixBlendMode: "screen",
            opacity: 0.9,
          }}
        />
      </div>

      {/* hero content */}
      <div style={{ padding: 18, marginTop: -92, position: "relative" }}>
        <div style={{ display: "flex", gap: 16, alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap" }}>
          {/* LEFT */}
          <div style={{ display: "flex", gap: 14, alignItems: "flex-end" }}>
            {/* avatar ring */}
            <div
              style={{
                width: 126,
                height: 126,
                borderRadius: "50%",
                padding: 4,
                background: `conic-gradient(from 210deg, ${theme.a}, ${theme.b}, ${theme.c}, ${theme.a})`,
                boxShadow: "0 0 44px rgba(0,255,195,0.35), 0 0 90px rgba(124,77,255,0.18)",
              }}
            >
              <img
                src={avatar}
                alt="avatar"
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "3px solid rgba(0,0,0,0.8)",
                }}
              />
            </div>

            <div style={{ paddingBottom: 6, maxWidth: 640 }}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
                <div style={pill}>
                  🧬 Level <b style={{ color: "white" }}>{level}</b>
                  <span style={{ opacity: 0.6 }}>•</span>
                  <span style={{ color: "rgba(255,255,255,0.9)" }}>{levelName}</span>
                </div>
                <div style={pill}>🏅 {badgeText}</div>
                <div style={pill}>
                  📍 {profile.city || "City"}
                  <span style={{ opacity: 0.6 }}>•</span>
                  {profile.country || "Country"}
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ fontSize: 36, fontWeight: 950, lineHeight: 1.03 }}>
                  {profile.full_name || profile.username || "Explorer"}
                </div>
                {isFriend && <FriendBadge />}
              </div>

              <div style={{ marginTop: 8, fontSize: 13, opacity: 0.82, lineHeight: 1.6 }}>
                {profile.bio || "No description yet. This explorer prefers actions over words."}
              </div>

              {/* SOCIAL LINKS */}
              {(profile.instagram_url || profile.tiktok_url || profile.youtube_url) && (
                <div style={{ marginTop: 14, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                  {profile.instagram_url && (
                    <a
                      href={
                        profile.instagram_url.startsWith("http")
                          ? profile.instagram_url
                          : `https://instagram.com/${profile.instagram_url}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 16px",
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 950,
                        letterSpacing: "0.05em",
                        background: "linear-gradient(135deg, rgba(225,48,108,0.35), rgba(255,220,128,0.25))",
                        border: "1px solid rgba(225,48,108,0.45)",
                        color: "#fff0f7",
                        textDecoration: "none",
                        boxShadow: "0 0 24px rgba(225,48,108,0.35)",
                      }}
                    >
                      📸 Instagram
                    </a>
                  )}

                  {profile.tiktok_url && (
                    <a
                      href={
                        profile.tiktok_url.startsWith("http")
                          ? profile.tiktok_url
                          : `https://www.tiktok.com/@${profile.tiktok_url.replace("@", "")}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 16px",
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 950,
                        letterSpacing: "0.05em",
                        background:
                          "linear-gradient(135deg, rgba(0,0,0,0.85), rgba(255,0,80,0.35), rgba(0,255,255,0.35))",
                        border: "1px solid rgba(255,255,255,0.25)",
                        color: "#ffffff",
                        textDecoration: "none",
                        boxShadow: "0 0 28px rgba(255,0,80,0.35), 0 0 28px rgba(0,255,255,0.25)",
                      }}
                    >
                      🎵 TikTok
                    </a>
                  )}

                  {profile.youtube_url && (
                    <a
                      href={
                        profile.youtube_url.startsWith("http")
                          ? profile.youtube_url
                          : `https://youtube.com/@${profile.youtube_url.replace("@", "")}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 16px",
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 950,
                        letterSpacing: "0.05em",
                        background: "linear-gradient(135deg, rgba(255,0,0,0.35), rgba(255,80,80,0.20))",
                        border: "1px solid rgba(255,0,0,0.55)",
                        color: "#ffeaea",
                        textDecoration: "none",
                        boxShadow: "0 0 30px rgba(255,0,0,0.45)",
                      }}
                    >
                      ▶️ YouTube
                    </a>
                  )}
                </div>
              )}

              {/* extra badges */}
              {badges.length > 0 && (
                <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {badges.map((b) => (
                    <span
                      key={b.t}
                      title={b.tip}
                      style={{
                        fontSize: 12,
                        padding: "6px 10px",
                        borderRadius: 999,
                        background: "rgba(0,0,0,0.35)",
                        border: "1px solid rgba(255,255,255,0.14)",
                        opacity: 0.95,
                      }}
                    >
                      {b.t}
                    </span>
                  ))}
                </div>
              )}

              {/* XP bar */}
              <div style={{ marginTop: 12, maxWidth: 640 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, opacity: 0.78, marginBottom: 6 }}>
                  <span>XP</span>
                  <span>
                    {xp} / {nextCap}
                  </span>
                </div>
                <div
                  style={{
                    height: 11,
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.12)",
                    overflow: "hidden",
                    boxShadow: "0 0 22px rgba(0,255,195,0.15)",
                  }}
                >
                  <div
                    style={{
                      width: `${Math.round(progress * 100)}%`,
                      height: "100%",
                      borderRadius: 999,
                      background: `linear-gradient(90deg, ${theme.a}, ${theme.b}, ${theme.c})`,
                      transition: "width 0.35s ease",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT actions */}
          {actionBar}
        </div>

        {/* stats strip */}
        <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 10 }}>
          {[
            { label: "Tours", value: tours.length, icon: "🗺️", click: () => setActiveTab("tours") },
            { label: "Followers", value: followersCount, icon: "👥", click: () => setShowFollowers(true) },
            { label: "Following", value: followingCount, icon: "🧷", click: () => setActiveTab("overview") },
            { label: "Rating", value: avgRating ? avgRating.toFixed(1) : "N/A", icon: "⭐", click: () => setActiveTab("overview") },
          ].map((s) => (
            <div
              key={s.label}
              onClick={s.click}
              style={{
                cursor: "pointer",
                background: "rgba(0,0,0,0.35)",
                border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: 18,
                padding: 14,
                display: "flex",
                alignItems: "center",
                gap: 10,
                boxShadow: "0 16px 50px rgba(0,0,0,0.45)",
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "linear-gradient(135deg, rgba(0,255,195,0.14), rgba(124,77,255,0.14))",
                  border: "1px solid rgba(255,255,255,0.10)",
                }}
              >
                {s.icon}
              </div>
              <div>
                <div style={{ fontSize: 11, opacity: 0.75 }}>{s.label}</div>
                <div style={{ fontSize: 20, fontWeight: 950, lineHeight: 1.1 }}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const tabs = (
    <div style={tabsWrap}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button style={tabBtn(activeTab === "overview")} onClick={() => setActiveTab("overview")}>
          Overview
        </button>
        <button style={tabBtn(activeTab === "tours")} onClick={() => setActiveTab("tours")}>
          Tours
        </button>
        <button style={tabBtn(activeTab === "events")} onClick={() => setActiveTab("events")}>
          Events
        </button>

        <button
          style={tabBtn(activeTab === "friends")}
          onClick={() => {
            if (canSeeFriends) setActiveTab("friends");
            else setShowFriends(true);
          }}
        >
          Friends {canSeeFriends ? "" : "🔒"}
        </button>

        <button style={tabBtn(activeTab === "timeline")} onClick={() => setActiveTab("timeline")}>
          Timeline
        </button>
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
        <div style={pill}>
          🧠 XP: <b style={{ color: "white" }}>{xp}</b>
        </div>
        <div style={pill}>
          🎟️ Events: <b style={{ color: "white" }}>{events.length}</b>
        </div>
      </div>
    </div>
  );

  // ================= OVERVIEW GRID =================
  const OverviewGrid = (
    <div style={gridResponsive}>
      {/* LEFT: Timeline */}
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={sectionTitle}>Timeline</div>
            <div style={{ fontSize: 18, fontWeight: 950 }}>Recent activity</div>
          </div>
          <div style={{ ...pill, opacity: 0.95 }}>🕒 {timeline.length} items</div>
        </div>

        {timeline.length === 0 ? (
          <div style={{ marginTop: 12, opacity: 0.7, fontSize: 13 }}>No activity yet.</div>
        ) : (
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 12 }}>
            {timeline.map((it, i) => (
              <div
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: it.cover ? "84px 1fr" : "1fr",
                  gap: 12,
                  padding: 12,
                  borderRadius: 18,
                  background: "rgba(0,0,0,0.35)",
                  border: "1px solid rgba(255,255,255,0.10)",
                }}
              >
                {it.cover ? (
                  <div
                    style={{
                      width: 84,
                      height: 66,
                      borderRadius: 14,
                      overflow: "hidden",
                      border: "1px solid rgba(255,255,255,0.10)",
                      cursor: it.type === "tour" || it.type === "event" ? "pointer" : "default",
                    }}
                    onClick={() => {
                      if (it.type === "tour" && it.id) navigate(`/tour/${it.id}`);
                      if (it.type === "event" && it.id) navigate(`/event/${it.id}`);
                    }}
                  >
                    <img src={it.cover} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "saturate(1.15)" }} />
                  </div>
                ) : null}

                <div style={{ display: "flex", gap: 10 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 16,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background:
                        it.type === "tour"
                          ? "rgba(0,255,195,0.16)"
                          : it.type === "event"
                          ? "rgba(124,77,255,0.18)"
                          : "rgba(255,215,100,0.18)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      flexShrink: 0,
                    }}
                  >
                    {it.type === "tour" ? "🗺️" : it.type === "event" ? "🎟️" : "⭐"}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, opacity: 0.75 }}>{fmtDate(it.created_at)}</div>
                    <div style={{ fontWeight: 950, fontSize: 14 }}>{it.title}</div>
                    <div style={{ fontSize: 14, opacity: 0.95, marginTop: 2 }}>{it.subtitle}</div>
                    <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>{it.meta}</div>

                    {(it.type === "tour" || it.type === "event") && it.id && (
                      <button
                        style={{ marginTop: 10, ...btnGhost, padding: "8px 12px", fontSize: 12 }}
                        onClick={() => navigate(`/${it.type}/${it.id}`)}
                      >
                        Open {it.type} →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT: Rating + Quick cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Rating */}
        <div style={card}>
          <div style={sectionTitle}>Rating</div>

          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 36, fontWeight: 950, lineHeight: 1 }}>
                {avgRating ? avgRating.toFixed(1) : "N/A"}
                <span style={{ fontSize: 16, opacity: 0.9 }}> ★</span>
              </div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                {ratingsCount} rating{ratingsCount === 1 ? "" : "s"}
              </div>
            </div>

            <div style={pill}>
              🏆 Boost: <b style={{ color: "white" }}>{Math.round((avgRating || 0) * 60)}</b> XP
            </div>
          </div>

          {!isOwnProfile && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 6 }}>Your rating:</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <span
                    key={s}
                    onClick={() => rate(s)}
                    style={{
                      cursor: ratingBusy ? "default" : "pointer",
                      fontSize: 32,
                      color: s <= (myRating || 0) ? "#ffd36b" : "rgba(255,255,255,0.28)",
                      textShadow: s <= (myRating || 0) ? "0 0 14px rgba(255,211,107,0.45)" : "none",
                      userSelect: "none",
                      opacity: ratingBusy ? 0.7 : 1,
                    }}
                  >
                    ★
                  </span>
                ))}
                {ratingBusy && <span style={{ fontSize: 12, opacity: 0.7, marginLeft: 8 }}>Saving…</span>}
              </div>
            </div>
          )}
        </div>

        {/* Quick: Tours */}
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={sectionTitle}>Tours</div>
              <div style={{ fontSize: 18, fontWeight: 950 }}>Created tours</div>
            </div>
            <div style={pill}>🗺️ {tours.length}</div>
          </div>

          {tours.length === 0 ? (
            <div style={{ marginTop: 12, opacity: 0.7, fontSize: 13 }}>No tours created yet.</div>
          ) : (
            <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 12 }}>
              {tours.slice(0, 8).map((t) => {
                const img = t.cover_url || (Array.isArray(t.image_urls) ? t.image_urls[0] : null) || "";
                return (
                  <div
                    key={t.id}
                    onClick={() => navigate(`/tour/${t.id}`)}
                    style={{
                      cursor: "pointer",
                      borderRadius: 18,
                      overflow: "hidden",
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(0,0,0,0.35)",
                      boxShadow: "0 18px 60px rgba(0,0,0,0.35)",
                    }}
                  >
                    <div style={{ position: "relative", height: 122 }}>
                      {img ? (
                        <img
                          src={img}
                          alt=""
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            filter: "saturate(1.15) contrast(1.05) brightness(0.92)",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            background:
                              "radial-gradient(300px 140px at 20% 25%, rgba(0,255,195,0.20), transparent 60%)," +
                              "radial-gradient(320px 160px at 80% 25%, rgba(124,77,255,0.18), transparent 65%)," +
                              "linear-gradient(180deg, rgba(0,0,0,0.20), rgba(0,0,0,0.92))",
                          }}
                        />
                      )}
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.05), rgba(0,0,0,0.85))" }} />
                      <div style={{ position: "absolute", left: 10, bottom: 10, right: 10 }}>
                        <div style={{ fontWeight: 950, fontSize: 13 }}>{t.title}</div>
                        <div style={{ fontSize: 11, opacity: 0.75, marginTop: 3 }}>
                          {t.location_name || "Unknown place"}
                          {t.country ? `, ${t.country}` : ""}
                        </div>
                      </div>
                    </div>

                    <div style={{ padding: 10, display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <div style={{ fontSize: 11, opacity: 0.72 }}>{t.date_start ? `🗓 ${t.date_start}` : "🗓 Date tbd"}</div>
                      <div style={{ fontSize: 11, opacity: 0.9 }}>{t.price ? `💶 ${t.price}€` : "Free"}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <button style={{ ...btnGhost, marginTop: 14, width: "100%" }} onClick={() => setActiveTab("tours")}>
            View tours →
          </button>
        </div>
      </div>
    </div>
  );

  // ================= TABS CONTENT =================
  const ToursTab = (
    <div style={card}>
      <div style={sectionTitle}>Tours</div>
      <div style={{ fontSize: 20, fontWeight: 950 }}>All created tours</div>

      {tours.length === 0 ? (
        <div style={{ marginTop: 12, opacity: 0.7, fontSize: 13 }}>No tours created yet.</div>
      ) : (
        <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
          {tours.map((t) => {
            const img = t.cover_url || (Array.isArray(t.image_urls) ? t.image_urls[0] : null) || "";
            return (
              <div
                key={t.id}
                onClick={() => navigate(`/tour/${t.id}`)}
                style={{
                  cursor: "pointer",
                  borderRadius: 18,
                  overflow: "hidden",
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(0,0,0,0.35)",
                  boxShadow: "0 18px 60px rgba(0,0,0,0.35)",
                }}
              >
                <div style={{ position: "relative", height: 150 }}>
                  {img ? (
                    <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "saturate(1.15) contrast(1.05) brightness(0.92)" }} />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        background:
                          "radial-gradient(340px 160px at 20% 25%, rgba(0,255,195,0.20), transparent 60%)," +
                          "radial-gradient(360px 180px at 80% 25%, rgba(124,77,255,0.18), transparent 65%)," +
                          "linear-gradient(180deg, rgba(0,0,0,0.20), rgba(0,0,0,0.92))",
                      }}
                    />
                  )}
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.05), rgba(0,0,0,0.88))" }} />
                  <div style={{ position: "absolute", left: 10, bottom: 10, right: 10 }}>
                    <div style={{ fontWeight: 950, fontSize: 14 }}>{t.title}</div>
                    <div style={{ fontSize: 12, opacity: 0.78, marginTop: 3 }}>
                      📍 {t.location_name || "Unknown place"}
                      {t.country ? `, ${t.country}` : ""}
                    </div>
                  </div>
                </div>

                <div style={{ padding: 10, display: "flex", justifyContent: "space-between", gap: 8, fontSize: 12, opacity: 0.9 }}>
                  <span>{t.date_start ? `🗓 ${t.date_start}` : "🗓 Date tbd"}</span>
                  <span>{t.price ? `💶 ${t.price}€` : "Free"}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const EventsTab = (
    <div style={card}>
      <div style={sectionTitle}>Events</div>
      <div style={{ fontSize: 20, fontWeight: 950 }}>Upcoming adventures</div>

      {events.length === 0 ? (
        <div style={{ marginTop: 12, opacity: 0.7, fontSize: 13 }}>No events created yet.</div>
      ) : (
        <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
          {events.map((e) => {
            const c = e.cover_url || "";
            return (
              <div
                key={e.id}
                onClick={() => navigate(`/event/${e.id}`)}
                style={{
                  cursor: "pointer",
                  borderRadius: 18,
                  overflow: "hidden",
                  background: "rgba(0,0,0,0.35)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  boxShadow: "0 18px 60px rgba(0,0,0,0.35)",
                }}
              >
                <div style={{ position: "relative", height: 150 }}>
                  {c ? (
                    <img src={c} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "saturate(1.15) contrast(1.05)" }} />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        background:
                          "radial-gradient(340px 160px at 20% 25%, rgba(124,77,255,0.22), transparent 60%)," +
                          "radial-gradient(360px 180px at 80% 25%, rgba(0,255,195,0.18), transparent 65%)," +
                          "linear-gradient(180deg, rgba(0,0,0,0.20), rgba(0,0,0,0.92))",
                      }}
                    />
                  )}
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.05), rgba(0,0,0,0.90))" }} />
                  <div style={{ position: "absolute", bottom: 10, left: 10, right: 10 }}>
                    <div style={{ fontWeight: 950, fontSize: 14 }}>{e.title}</div>
                    <div style={{ fontSize: 12, opacity: 0.82, marginTop: 2 }}>
                      📍 {e.city || "City"}
                      {e.country ? `, ${e.country}` : ""}
                    </div>
                  </div>
                </div>

                <div style={{ padding: 10, display: "flex", justifyContent: "space-between", fontSize: 12, opacity: 0.9 }}>
                  <span>🗓️ {e.start_date ? new Date(e.start_date).toLocaleDateString() : "Date TBA"}</span>
                  <span>→ Open</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const TimelineTab = (
    <div style={card}>
      <div style={sectionTitle}>Timeline</div>
      <div style={{ fontSize: 20, fontWeight: 950 }}>Everything this explorer did</div>

      {timeline.length === 0 ? (
        <div style={{ marginTop: 12, opacity: 0.7, fontSize: 13 }}>No activity yet.</div>
      ) : (
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 12 }}>
          {timeline.map((it, i) => (
            <div
              key={i}
              style={{
                padding: 14,
                borderRadius: 18,
                background: "rgba(0,0,0,0.35)",
                border: "1px solid rgba(255,255,255,0.10)",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background:
                    it.type === "tour"
                      ? "rgba(0,255,195,0.16)"
                      : it.type === "event"
                      ? "rgba(124,77,255,0.18)"
                      : "rgba(255,215,100,0.18)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  flexShrink: 0,
                }}
              >
                {it.type === "tour" ? "🗺️" : it.type === "event" ? "🎟️" : "⭐"}
              </div>

              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 12, opacity: 0.75 }}>{fmtDate(it.created_at)}</div>
                <div style={{ fontWeight: 950, fontSize: 15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {it.title} — {it.subtitle}
                </div>
                <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>{it.meta}</div>
              </div>

              {(it.type === "tour" || it.type === "event") && it.id ? (
                <button style={{ ...btnGhost, padding: "8px 12px", fontSize: 12 }} onClick={() => navigate(`/${it.type}/${it.id}`)}>
                  Open →
                </button>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const FriendsTab = (
    <div style={card}>
      <div style={sectionTitle}>Friends</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div style={{ fontSize: 20, fontWeight: 950 }}>Mutual follows</div>
        {!canSeeFriends && <div style={pill}>🔒 Private</div>}
      </div>

      {!canSeeFriends ? (
        <div style={{ marginTop: 12, opacity: 0.78, fontSize: 13, lineHeight: 1.6 }}>
          Friends list is private. <b>Only friends</b> can see it.
        </div>
      ) : friendsList.length === 0 ? (
        <div style={{ marginTop: 12, opacity: 0.7, fontSize: 13 }}>No friends yet.</div>
      ) : (
        <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10 }}>
          {friendsList.map((u) => (
            <div
              key={u.id}
              onClick={() => navigate(`/profile/${u.id}`)}
              style={{
                cursor: "pointer",
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(0,0,0,0.35)",
                padding: 12,
                display: "flex",
                gap: 10,
                alignItems: "center",
              }}
            >
              <img
                src={u.avatar_url || "https://i.pravatar.cc/80"}
                alt=""
                style={{ width: 46, height: 46, borderRadius: "50%", objectFit: "cover" }}
              />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 950, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "flex", gap: 8, alignItems: "center" }}>
                  {u.full_name || u.username || "Explorer"} <FriendBadge />
                </div>
                <div style={{ fontSize: 12, opacity: 0.75 }}>
                  {u.city || "City"}, {u.country || "Country"}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ================= RETURN =================
  return (
    <div style={page}>
      <div style={wrap}>
        {heroCard}
        {tabs}

        {activeTab === "overview" && OverviewGrid}
        {activeTab === "tours" && ToursTab}
        {activeTab === "events" && EventsTab}
        {activeTab === "timeline" && TimelineTab}
        {activeTab === "friends" && FriendsTab}

        {/* FOLLOWERS MODAL */}
        {showFollowers && (
          <div
            onClick={() => setShowFollowers(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.55)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
              zIndex: 9999,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "min(760px, 96vw)",
                maxHeight: "78vh",
                overflow: "auto",
                ...glass,
                padding: 16,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div>
                  <div style={sectionTitle}>Followers</div>
                  <div style={{ fontSize: 18, fontWeight: 950 }}>{followersCount} people</div>
                </div>
                <button style={btnGhost} onClick={() => setShowFollowers(false)}>
                  Close
                </button>
              </div>

              {followersList.length === 0 ? (
                <div style={{ opacity: 0.75, padding: 10 }}>No followers yet.</div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10, marginTop: 10 }}>
                  {followersList.map((u) => (
                    <div
                      key={u.id}
                      onClick={() => {
                        setShowFollowers(false);
                        navigate(`/profile/${u.id}`);
                      }}
                      style={{
                        cursor: "pointer",
                        borderRadius: 16,
                        border: "1px solid rgba(255,255,255,0.12)",
                        background: "rgba(0,0,0,0.35)",
                        padding: 12,
                        display: "flex",
                        gap: 10,
                        alignItems: "center",
                      }}
                    >
                      <img
                        src={u.avatar_url || "https://i.pravatar.cc/80"}
                        alt=""
                        style={{ width: 46, height: 46, borderRadius: "50%", objectFit: "cover" }}
                      />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 950, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {u.full_name || u.username || "Explorer"}
                        </div>
                        <div style={{ fontSize: 12, opacity: 0.75 }}>
                          {u.city || "City"}, {u.country || "Country"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* FRIENDS PRIVATE LOCK MODAL */}
        {showFriends && !canSeeFriends && (
          <div
            onClick={() => setShowFriends(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.55)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
              zIndex: 9999,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "min(620px, 96vw)",
                ...glass,
                padding: 18,
              }}
            >
              <div style={sectionTitle}>Friends</div>

              <div style={{ fontSize: 20, fontWeight: 950 }}>
                🔒 Private list
              </div>

              <div
                style={{
                  marginTop: 10,
                  fontSize: 13,
                  opacity: 0.82,
                  lineHeight: 1.6,
                }}
              >
                Friends list is private.  
                <b> Only friends</b> can see it.  
                Follow each other to unlock.
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 10,
                  marginTop: 14,
                }}
              >
                <button
                  style={btnGhost}
                  onClick={() => setShowFriends(false)}
                >
                  Close
                </button>

                {!isOwnProfile && (
                  <button
                    style={btnPrimary}
                    onClick={toggleFollow}
                    disabled={followBusy}
                  >
                    {isFollowing ? "Following ✓" : "Follow"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}