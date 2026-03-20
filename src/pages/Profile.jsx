// src/pages/Profile.jsx

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import ProfileRatingSummary from "../components/ProfileRatingSummary";
import ProfileRatingBox from "../components/ProfileRatingBox";

/* =========================
   CONSTANTS
========================= */

const BREAKPOINT = 900;
const FALLBACK_AVATAR = "https://i.pravatar.cc/300?img=12";

const ALLOWED_TABS = ["overview", "tours", "events", "friends", "timeline"];

const PAGE_BG =
  "radial-gradient(1200px 620px at 14% 0%, rgba(0,255,195,0.15), transparent 54%)," +
  "radial-gradient(900px 520px at 86% 6%, rgba(124,77,255,0.14), transparent 52%)," +
  "radial-gradient(700px 420px at 50% 100%, rgba(255,180,70,0.07), transparent 55%)," +
  "linear-gradient(180deg, #02070a 0%, #010406 100%)";

/* =========================
   HELPERS
========================= */

function useIsSmall(breakpoint = BREAKPOINT) {
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

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

function openExternalUrl(url, type) {
  if (!url) return "#";
  if (/^https?:\/\//i.test(url)) return url;

  const clean = String(url).replace(/^@/, "").trim();

  if (type === "instagram") return `https://instagram.com/${clean}`;
  if (type === "tiktok") return `https://www.tiktok.com/@${clean}`;
  if (type === "youtube") return `https://youtube.com/@${clean}`;

  return url;
}

function getTourDateLabel(t) {
  return t?.date_start || t?.start_date || t?.date || "";
}

function getEventDateLabel(e) {
  return e?.start_date || e?.start_time || e?.date || "";
}

function getTourImage(t) {
  return (
    t?.cover_url ||
    (Array.isArray(t?.image_urls) ? t.image_urls[0] : null) ||
    t?.image_url ||
    ""
  );
}

function getCover(profile) {
  return (
    profile?.cover_url ||
    profile?.header_url ||
    profile?.banner_url ||
    profile?.cover ||
    profile?.cover_image_url ||
    ""
  );
}

function getSafeName(profile) {
  return profile?.full_name || profile?.username || "Explorer";
}

function getLocationLabel(profile) {
  const parts = [profile?.city, profile?.country].filter(Boolean);
  return parts.length ? parts.join(", ") : "Location not set";
}

function dedupeById(items = []) {
  const seen = new Set();
  return items.filter((item) => {
    if (!item?.id) return false;
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function getInitialTab(search) {
  const tab = new URLSearchParams(search).get("tab");
  return ALLOWED_TABS.includes(tab) ? tab : "overview";
}

function getSocialButtonStyle(type) {
  if (type === "instagram") {
    return {
      background:
        "linear-gradient(135deg, rgba(225,48,108,0.23), rgba(255,186,73,0.17))",
      border: "1px solid rgba(225,48,108,0.38)",
      color: "#fff4f8",
      boxShadow: "0 0 20px rgba(225,48,108,0.16)",
    };
  }

  if (type === "tiktok") {
    return {
      background:
        "linear-gradient(135deg, rgba(0,0,0,0.82), rgba(255,0,80,0.20), rgba(0,255,255,0.14))",
      border: "1px solid rgba(255,255,255,0.14)",
      color: "#ffffff",
      boxShadow: "0 0 20px rgba(255,0,80,0.14)",
    };
  }

  return {
    background:
      "linear-gradient(135deg, rgba(255,0,0,0.20), rgba(255,80,80,0.14))",
    border: "1px solid rgba(255,0,0,0.36)",
    color: "#fff1f1",
    boxShadow: "0 0 20px rgba(255,0,0,0.14)",
  };
}

function getProfileCompletion(profile) {
  const cover = getCover(profile);

  const checks = [
    {
      key: "avatar",
      label: "Avatar photo",
      done: Boolean(profile?.avatar_url),
    },
    {
      key: "bio",
      label: "Bio / description",
      done: Boolean(profile?.bio && String(profile.bio).trim().length >= 8),
    },
    {
      key: "cover",
      label: "Cover image",
      done: Boolean(cover),
    },
    {
      key: "location",
      label: "Location",
      done: Boolean(profile?.city || profile?.country),
    },
  ];

  const doneCount = checks.filter((x) => x.done).length;
  const total = checks.length;
  const percent = Math.round((doneCount / total) * 100);
  const missing = checks.filter((x) => !x.done);

  return {
    cover,
    checks,
    doneCount,
    total,
    percent,
    missing,
    isComplete: missing.length === 0,
    canJoinTours: missing.length === 0,
  };
}

function buildTimeline({ tours, events, ratings }) {
  const items = [];

  (tours || []).forEach((t) => {
    if (!t?.created_at) return;
    items.push({
      key: `tour-${t.id}-${t.created_at}`,
      type: "tour",
      created_at: t.created_at,
      title: "Created a new tour",
      subtitle: t.title || "Untitled tour",
      meta: `${t.location_name || "Unknown place"}${t.country ? `, ${t.country}` : ""}`,
      cover: getTourImage(t),
      id: t.id,
    });
  });

  (events || []).forEach((e) => {
    const createdAt = e?.created_at || e?.start_date || e?.start_time;
    if (!createdAt) return;
    items.push({
      key: `event-${e.id}-${createdAt}`,
      type: "event",
      created_at: createdAt,
      title: "Created an event",
      subtitle: e.title || "Untitled event",
      meta: `${e.city || "City"}${e.country ? `, ${e.country}` : ""}`,
      cover: e.cover_url || null,
      id: e.id,
    });
  });

  (ratings || []).slice(0, 10).forEach((r, idx) => {
    if (!r?.created_at) return;
    items.push({
      key: `rating-${idx}-${r.created_at}`,
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
  return items.slice(0, 16);
}

function getLevelMeta({ toursCount, eventsCount, followersCount, avgRating, isFriend }) {
  const totalXp =
    (toursCount || 0) * 120 +
    (eventsCount || 0) * 80 +
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
  const progress = Math.max(0, Math.min(1, (totalXp - prev) / (cap - prev)));

  const themes = {
    1: { a: "#00ffc3", b: "#00b4ff", c: "#7c4dff" },
    2: { a: "#00ffb0", b: "#00d1ff", c: "#ffffff" },
    3: { a: "#b184ff", b: "#00ffc3", c: "#00b4ff" },
    4: { a: "#ffe26b", b: "#ff9b6b", c: "#00ffc3" },
    5: { a: "#ff5fd2", b: "#00ffc3", c: "#00b4ff" },
  };

  const badgeText = {
    1: "🌱 Just getting started",
    2: "🌲 Growing explorer",
    3: "🧭 Pathfinder energy",
    4: "⛰️ Summit grinder",
    5: "🏆 Absolute legend",
  }[lvl];

  const badges = [];
  if (toursCount >= 1) badges.push({ t: "🧭 Explorer", tip: "Created at least 1 tour" });
  if (eventsCount >= 1) badges.push({ t: "🏕️ Host", tip: "Created at least 1 event" });
  if (followersCount >= 10) badges.push({ t: "🔥 Popular", tip: "10+ followers" });
  if (lvl >= 4) badges.push({ t: "💠 Elite", tip: "Level 4+" });
  if (lvl >= 5) badges.push({ t: "🏆 Legend", tip: "Level 5" });

  return {
    level: lvl,
    levelName: names[lvl],
    theme: themes[lvl] || themes[1],
    xp: Math.round(totalXp),
    nextCap: cap,
    progress,
    badgeText,
    badges,
  };
}

/* =========================
   SHARED UI
========================= */

const FriendBadge = ({ small = false }) => (
  <span
    style={{
      fontSize: small ? 10 : 11,
      padding: small ? "4px 9px" : "5px 12px",
      borderRadius: 999,
      background: "linear-gradient(135deg, #00ffc3, #00b4ff, #7c4dff)",
      color: "#02130d",
      fontWeight: 950,
      boxShadow: "0 0 18px rgba(0,255,195,0.35)",
      whiteSpace: "nowrap",
      border: "1px solid rgba(255,255,255,0.18)",
      letterSpacing: "0.05em",
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      flexShrink: 0,
    }}
  >
    🤝 FRIEND
  </span>
);

function SectionHeader({ eyebrow, title, right }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
        marginBottom: 14,
      }}
    >
      <div>
        {eyebrow ? (
          <div
            style={{
              fontSize: 11,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "rgba(230,255,245,0.62)",
              fontWeight: 900,
              marginBottom: 6,
            }}
          >
            {eyebrow}
          </div>
        ) : null}

        <div
          style={{
            fontSize: 22,
            fontWeight: 950,
            lineHeight: 1.06,
            color: "#f8fffb",
            letterSpacing: "-0.03em",
          }}
        >
          {title}
        </div>
      </div>

      {right || null}
    </div>
  );
}

function EmptyState({ text, action }) {
  return (
    <div
      style={{
        borderRadius: 20,
        padding: "18px 16px",
        background: "rgba(0,0,0,0.28)",
        border: "1px solid rgba(255,255,255,0.08)",
        color: "rgba(235,250,242,0.76)",
        fontSize: 13,
        lineHeight: 1.7,
      }}
    >
      <div>{text}</div>
      {action ? <div style={{ marginTop: 12 }}>{action}</div> : null}
    </div>
  );
}

function SocialLinks({ profile, compact = false }) {
  const base = {
    textDecoration: "none",
    fontWeight: 900,
    fontSize: compact ? 11 : 12,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: compact ? "8px 12px" : "9px 14px",
    borderRadius: 999,
  };

  const hasAny = profile?.instagram_url || profile?.tiktok_url || profile?.youtube_url;
  if (!hasAny) return null;

  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: compact ? "flex-start" : "center",
      }}
    >
      {profile.instagram_url && (
        <a
          href={openExternalUrl(profile.instagram_url, "instagram")}
          target="_blank"
          rel="noopener noreferrer"
          style={{ ...base, ...getSocialButtonStyle("instagram") }}
        >
          📸 Instagram
        </a>
      )}

      {profile.tiktok_url && (
        <a
          href={openExternalUrl(profile.tiktok_url, "tiktok")}
          target="_blank"
          rel="noopener noreferrer"
          style={{ ...base, ...getSocialButtonStyle("tiktok") }}
        >
          🎵 TikTok
        </a>
      )}

      {profile.youtube_url && (
        <a
          href={openExternalUrl(profile.youtube_url, "youtube")}
          target="_blank"
          rel="noopener noreferrer"
          style={{ ...base, ...getSocialButtonStyle("youtube") }}
        >
          ▶️ YouTube
        </a>
      )}
    </div>
  );
}

function CompletionCard({ completion, onEdit, isOwner }) {
  if (!isOwner) return null;

  const ringColor =
    completion.percent >= 100
      ? "#00ffc3"
      : completion.percent >= 75
      ? "#ffe26b"
      : "#ff9b6b";

  return (
    <div
      style={{
        borderRadius: 26,
        padding: 18,
        background:
          "linear-gradient(145deg, rgba(255,190,90,0.10), rgba(255,255,255,0.05))",
        border: "1px solid rgba(255,200,120,0.18)",
        boxShadow: "0 16px 46px rgba(0,0,0,0.30)",
      }}
    >
      <SectionHeader
        eyebrow="Profile setup"
        title={completion.isComplete ? "Profile completed" : "Complete your profile"}
        right={
          <div
            style={{
              padding: "8px 12px",
              borderRadius: 999,
              background: "rgba(0,0,0,0.28)",
              border: "1px solid rgba(255,255,255,0.10)",
              fontWeight: 900,
              fontSize: 12,
            }}
          >
            {completion.percent}%
          </div>
        }
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "110px 1fr",
          gap: 16,
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            margin: "0 auto",
            background: `conic-gradient(${ringColor} ${completion.percent * 3.6}deg, rgba(255,255,255,0.10) 0deg)`,
            boxShadow: "0 0 28px rgba(255,200,120,0.10)",
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "#071012",
              display: "grid",
              placeItems: "center",
              border: "1px solid rgba(255,255,255,0.08)",
              fontWeight: 950,
              fontSize: 18,
              color: "#fff",
            }}
          >
            {completion.percent}%
          </div>
        </div>

        <div>
          <div
            style={{
              fontSize: 14,
              lineHeight: 1.7,
              color: "rgba(245,255,250,0.92)",
            }}
          >
            To keep MeetOutdoors profiles real and active, <b>avatar photo, bio and cover image</b> should be completed.
            Users with unfinished profiles may look inactive and can be blocked from joining tours.
          </div>

          <div style={{ display: "grid", gap: 8, marginTop: 14 }}>
            {completion.checks.map((item) => (
              <div
                key={item.key}
                style={{
                  borderRadius: 14,
                  padding: "10px 12px",
                  background: item.done
                    ? "rgba(0,255,176,0.10)"
                    : "rgba(255,255,255,0.05)",
                  border: item.done
                    ? "1px solid rgba(0,255,176,0.24)"
                    : "1px solid rgba(255,255,255,0.08)",
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                  alignItems: "center",
                  fontSize: 13,
                }}
              >
                <span>{item.label}</span>
                <span style={{ fontWeight: 900, color: item.done ? "#9cffd8" : "#ffd48a" }}>
                  {item.done ? "Done" : "Missing"}
                </span>
              </div>
            ))}
          </div>

          {!completion.isComplete ? (
            <button
              style={{
                marginTop: 14,
                padding: "12px 16px",
                borderRadius: 999,
                border: "none",
                cursor: "pointer",
                fontWeight: 950,
                color: "#05150d",
                background: "linear-gradient(135deg, #ffe26b, #ffb86b, #00ffc3)",
                boxShadow: "0 14px 36px rgba(255,190,90,0.18)",
              }}
              onClick={onEdit}
            >
              Complete profile now
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function MediaPlaceholderCard({ isOwner, onEdit }) {
  return (
    <div
      style={{
        borderRadius: 26,
        padding: 18,
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 16px 46px rgba(0,0,0,0.26)",
      }}
    >
      <SectionHeader eyebrow="Media" title="Photos & videos" />

      <div
        style={{
          fontSize: 14,
          lineHeight: 1.7,
          color: "rgba(245,255,250,0.84)",
        }}
      >
        This section is ready for profile posts, photos and videos that stay on the profile and also appear in the timeline.
      </div>

      <div
        style={{
          marginTop: 14,
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 10,
        }}
      >
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            style={{
              aspectRatio: "1 / 1",
              borderRadius: 20,
              background:
                "linear-gradient(145deg, rgba(0,255,195,0.10), rgba(124,77,255,0.08), rgba(255,180,70,0.06))",
              border: "1px solid rgba(255,255,255,0.08)",
              display: "grid",
              placeItems: "center",
              color: "rgba(255,255,255,0.36)",
              fontWeight: 900,
              fontSize: 13,
            }}
          >
            MEDIA
          </div>
        ))}
      </div>

      {isOwner ? (
        <button
          style={{
            marginTop: 14,
            padding: "11px 16px",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(0,0,0,0.30)",
            color: "#fff",
            fontWeight: 900,
            cursor: "pointer",
          }}
          onClick={onEdit}
        >
          Set up profile content
        </button>
      ) : null}
    </div>
  );
}

function StatTile({ label, value, icon, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        cursor: onClick ? "pointer" : "default",
        borderRadius: 22,
        padding: "14px 14px",
        background: "rgba(255,255,255,0.07)",
        border: "1px solid rgba(255,255,255,0.10)",
        boxShadow: "0 14px 36px rgba(0,0,0,0.22)",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 16,
          display: "grid",
          placeItems: "center",
          background:
            "linear-gradient(135deg, rgba(0,255,195,0.14), rgba(124,77,255,0.14), rgba(255,180,70,0.10))",
          border: "1px solid rgba(255,255,255,0.10)",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>

      <div>
        <div style={{ fontSize: 11, opacity: 0.72 }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 950, lineHeight: 1.08 }}>{value}</div>
      </div>
    </div>
  );
}

function TourCard({ t, navigate, compact = false }) {
  const img = getTourImage(t);

  return (
    <div
      onClick={() => navigate(`/tour/${t.id}`)}
      style={{
        cursor: "pointer",
        borderRadius: 20,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(0,0,0,0.35)",
        boxShadow: "0 16px 40px rgba(0,0,0,0.30)",
      }}
    >
      <div style={{ position: "relative", height: compact ? 132 : 156 }}>
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
            background: "linear-gradient(180deg, rgba(0,0,0,0.05), rgba(0,0,0,0.90))",
          }}
        />

        <div style={{ position: "absolute", left: 12, right: 12, bottom: 12 }}>
          <div style={{ fontWeight: 950, fontSize: 14, lineHeight: 1.2 }}>{t.title}</div>
          <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
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
          gap: 8,
          fontSize: 12,
          opacity: 0.9,
        }}
      >
        <span>{getTourDateLabel(t) ? `🗓 ${getTourDateLabel(t)}` : "🗓 Date TBA"}</span>
        <span>{t.price ? `💶 ${t.price}€` : "Free"}</span>
      </div>
    </div>
  );
}

function EventCard({ e, navigate, compact = false }) {
  const img = e?.cover_url || "";

  return (
    <div
      onClick={() => navigate(`/event/${e.id}`)}
      style={{
        cursor: "pointer",
        borderRadius: 20,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(0,0,0,0.35)",
        boxShadow: "0 16px 40px rgba(0,0,0,0.30)",
      }}
    >
      <div style={{ position: "relative", height: compact ? 132 : 156 }}>
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
            background: "linear-gradient(180deg, rgba(0,0,0,0.05), rgba(0,0,0,0.90))",
          }}
        />

        <div style={{ position: "absolute", left: 12, right: 12, bottom: 12 }}>
          <div style={{ fontWeight: 950, fontSize: 14, lineHeight: 1.2 }}>{e.title}</div>
          <div style={{ fontSize: 12, opacity: 0.82, marginTop: 4 }}>
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
          gap: 8,
          fontSize: 12,
          opacity: 0.9,
        }}
      >
        <span>🗓 {getEventDateLabel(e) ? formatDate(getEventDateLabel(e)) : "Date TBA"}</span>
        <span>→ Open</span>
      </div>
    </div>
  );
}

function TimelineItem({ it, navigate, compact = false }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: it.cover && !compact ? "90px 1fr" : "1fr",
        gap: 12,
        padding: 12,
        borderRadius: 20,
        background: "rgba(0,0,0,0.35)",
        border: "1px solid rgba(255,255,255,0.10)",
      }}
    >
      {it.cover && !compact ? (
        <div
          style={{
            width: 90,
            height: 70,
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
          <img
            src={it.cover}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      ) : null}

      <div style={{ display: "flex", gap: 10 }}>
        <div
          style={{
            width: 42,
            height: 42,
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

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, opacity: 0.75 }}>{formatDateTime(it.created_at)}</div>
          <div
            style={{
              fontWeight: 950,
              fontSize: 14,
              marginTop: 1,
              whiteSpace: compact ? "nowrap" : "normal",
              overflow: compact ? "hidden" : "visible",
              textOverflow: compact ? "ellipsis" : "clip",
            }}
          >
            {it.title}
          </div>
          <div
            style={{
              fontSize: 14,
              opacity: 0.95,
              marginTop: 2,
              whiteSpace: compact ? "nowrap" : "normal",
              overflow: compact ? "hidden" : "visible",
              textOverflow: compact ? "ellipsis" : "clip",
            }}
          >
            {it.subtitle}
          </div>
          {it.meta ? (
            <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>{it.meta}</div>
          ) : null}

          {(it.type === "tour" || it.type === "event") && it.id ? (
            <button
              style={{
                marginTop: 10,
                padding: "8px 12px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(0,0,0,0.30)",
                color: "#fff",
                fontWeight: 900,
                cursor: "pointer",
                fontSize: 12,
              }}
              onClick={() => navigate(`/${it.type}/${it.id}`)}
            >
              Open {it.type} →
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* =========================
   MOBILE VIEW
========================= */

function MobileProfileView({
  profile,
  authUser,
  tours,
  joinedTours,
  events,
  timeline,
  followersCount,
  followingCount,
  isOwnProfile,
  isFollowing,
  isFriend,
  followBusy,
  avgRating,
  ratingsCount,
  levelMeta,
  completion,
  toggleFollow,
  goEdit,
  navigate,
}) {
  const [avatarZoom, setAvatarZoom] = useState(false);

  const avatar = profile?.avatar_url || FALLBACK_AVATAR;
  const cover = completion.cover;
  const safeName = getSafeName(profile);
  const locationLabel = getLocationLabel(profile);
  const safeBio =
    profile?.bio || "No description yet. This explorer prefers actions over words.";

  const glass = {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "0 18px 60px rgba(0,0,0,0.55)",
    backdropFilter: "blur(16px)",
    borderRadius: 24,
  };

  const pill = {
    fontSize: 12,
    padding: "8px 12px",
    borderRadius: 999,
    background: "rgba(0,0,0,0.35)",
    border: "1px solid rgba(255,255,255,0.14)",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    whiteSpace: "nowrap",
    color: "rgba(245,255,250,0.96)",
  };

  const btnPrimary = {
    width: "100%",
    padding: "15px 0",
    borderRadius: 999,
    border: "none",
    fontWeight: 950,
    fontSize: 15,
    cursor: followBusy ? "default" : "pointer",
    background: isFollowing
      ? "rgba(255,255,255,0.14)"
      : `linear-gradient(135deg, ${levelMeta.theme.a}, ${levelMeta.theme.b}, ${levelMeta.theme.c})`,
    color: isFollowing ? "white" : "#02130d",
    boxShadow: "0 0 24px rgba(0,255,195,0.24), 0 16px 40px rgba(0,0,0,0.32)",
    opacity: followBusy ? 0.7 : 1,
  };

  const btnGhost = {
    width: "100%",
    padding: "13px 0",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(0,0,0,0.35)",
    fontWeight: 950,
    color: "white",
    cursor: "pointer",
  };

  const card = { ...glass, padding: 14 };

  return (
    <div
      style={{
        minHeight: "100vh",
        paddingTop: 84,
        paddingBottom: 30,
        marginTop: -120,
        background: PAGE_BG,
        color: "white",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div style={{ position: "relative", height: 270 }}>
        {cover ? (
          <img
            src={cover}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "saturate(1.16) contrast(1.08) brightness(0.84)",
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
                "radial-gradient(420px 220px at 50% 100%, rgba(255,180,70,0.10), transparent 60%)," +
                "linear-gradient(180deg, rgba(0,0,0,0.15), rgba(0,0,0,0.92))",
            }}
          />
        )}

        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, rgba(0,0,0,0.12), rgba(0,0,0,0.94))",
          }}
        />

        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: -58,
            transform: "translateX(-50%)",
            width: 132,
            height: 132,
            borderRadius: "50%",
            padding: 4,
            background: `conic-gradient(from 210deg, ${levelMeta.theme.a}, ${levelMeta.theme.b}, ${levelMeta.theme.c}, ${levelMeta.theme.a})`,
            boxShadow:
              "0 0 34px rgba(0,255,195,0.35), 0 0 90px rgba(0,180,255,0.18)",
          }}
        >
          <img
            src={avatar}
            alt=""
            onClick={() => setAvatarZoom(true)}
            style={{
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              objectFit: "cover",
              objectPosition: "50% 35%",
              border: "3px solid rgba(0,0,0,0.82)",
              background: "rgba(0,0,0,0.35)",
              cursor: "pointer",
            }}
          />
        </div>
      </div>

      <div style={{ padding: 14, paddingTop: 74, maxWidth: 760, margin: "0 auto" }}>
        {isOwnProfile && !completion.isComplete ? (
          <div style={{ marginBottom: 14 }}>
            <CompletionCard completion={completion} onEdit={goEdit} isOwner={isOwnProfile} />
          </div>
        ) : null}

        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 32,
              fontWeight: 950,
              lineHeight: 1.04,
              textShadow: "0 10px 30px rgba(0,0,0,0.55)",
            }}
          >
            {safeName}
          </div>

          <div
            style={{
              marginTop: 10,
              display: "flex",
              gap: 8,
              justifyContent: "center",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <ProfileRatingSummary profileId={profile.id} />

            <span
              style={{
                fontSize: 13,
                padding: "6px 12px",
                borderRadius: 999,
                background: "rgba(255,211,107,0.12)",
                border: "1px solid rgba(255,211,107,0.30)",
                color: "#ffd36b",
                fontWeight: 900,
              }}
            >
              ⭐ {avgRating ? avgRating.toFixed(1) : "New"} rating
            </span>

            {profile?.is_verified_creator ? (
              <span
                style={{
                  fontSize: 11,
                  padding: "5px 10px",
                  borderRadius: 999,
                  background: "rgba(0,255,176,0.14)",
                  border: "1px solid rgba(0,255,176,0.35)",
                  color: "#9cffd8",
                  fontWeight: 900,
                }}
              >
                ✔ MeetOutdoors Verified
              </span>
            ) : null}

            {Boolean(isFriend) ? <FriendBadge /> : null}
          </div>

          <div style={{ opacity: 0.84, fontSize: 13, marginTop: 10 }}>
            📍 {locationLabel}
          </div>

          <div
            style={{
              marginTop: 12,
              display: "flex",
              gap: 8,
              justifyContent: "center",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <span style={pill}>
              🧬 Level <b>{levelMeta.level}</b> • {levelMeta.levelName}
            </span>

            <span style={pill}>
              🧠 XP <b>{levelMeta.xp}</b>
            </span>

            {levelMeta.badgeText ? <span style={pill}>🏅 {levelMeta.badgeText}</span> : null}
          </div>

          {levelMeta.badges?.length ? (
            <div
              style={{
                marginTop: 10,
                display: "flex",
                gap: 8,
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              {levelMeta.badges.slice(0, 6).map((b) => (
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
        </div>

        <div
          style={{
            marginTop: 16,
            ...glass,
            padding: 16,
            lineHeight: 1.72,
            fontSize: 14,
            opacity: 0.96,
          }}
        >
          {safeBio}
        </div>

        <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
          {isOwnProfile ? (
            <>
              <button onClick={goEdit} style={btnGhost}>
                Edit profile
              </button>
              <button onClick={() => navigate("/my-tours")} style={btnGhost}>
                🎒 Manage tours
              </button>
            </>
          ) : (
            <button onClick={toggleFollow} disabled={followBusy} style={btnPrimary}>
              {isFollowing ? "Following ✓" : "Follow"}
            </button>
          )}
        </div>

        <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
          <StatTile
            label="Tours"
            value={tours.length}
            icon="🗺️"
            onClick={() => navigate(`/profile/${profile.id}?tab=tours`)}
          />
          <StatTile
            label="Events"
            value={events.length}
            icon="🎟️"
            onClick={() => navigate(`/profile/${profile.id}?tab=events`)}
          />
          <StatTile label="Followers" value={followersCount} icon="👥" />
          <StatTile label="Following" value={followingCount} icon="🧷" />
        </div>

        <div style={{ marginTop: 14, ...card }}>
          <SectionHeader
            eyebrow="Identity"
            title="Explorer profile"
            right={
              <div
                style={{
                  fontSize: 12,
                  padding: "8px 10px",
                  borderRadius: 999,
                  background: "rgba(0,0,0,0.30)",
                  border: "1px solid rgba(255,255,255,0.10)",
                }}
              >
                {ratingsCount} ratings
              </div>
            }
          />

          <div style={{ display: "grid", gap: 10 }}>
            <div
              style={{
                borderRadius: 16,
                padding: "12px 14px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                fontSize: 13,
                lineHeight: 1.7,
              }}
            >
              <b>From:</b> {locationLabel}
            </div>

            {!completion.isComplete ? (
              <div
                style={{
                  borderRadius: 16,
                  padding: "12px 14px",
                  background: "rgba(255,190,90,0.08)",
                  border: "1px solid rgba(255,190,90,0.18)",
                  fontSize: 13,
                  lineHeight: 1.7,
                  color: "#fff3dd",
                }}
              >
                Avatar, bio and cover image should be completed to keep the community active and trusted.
              </div>
            ) : null}
          </div>

          <div style={{ marginTop: 14 }}>
            <SocialLinks profile={profile} />
          </div>
        </div>

        {!isOwnProfile ? (
          <div style={{ marginTop: 14, ...card }}>
            <SectionHeader eyebrow="Created" title="What this explorer created" />
            <div style={{ display: "grid", gap: 12 }}>
              {tours.slice(0, 2).map((t) => (
                <TourCard key={t.id} t={t} navigate={navigate} compact />
              ))}

              {events.slice(0, 2).map((e) => (
                <EventCard key={e.id} e={e} navigate={navigate} compact />
              ))}

              {tours.length === 0 && events.length === 0 ? (
                <EmptyState text="No created tours or events yet." />
              ) : null}
            </div>
          </div>
        ) : null}

        <div style={{ marginTop: 14 }}>
          <MediaPlaceholderCard isOwner={isOwnProfile} onEdit={goEdit} />
        </div>

        <div style={{ marginTop: 14 }}>
          <ProfileRatingBox ratedUserId={profile.id} user={authUser} />
        </div>

        <div style={{ marginTop: 18, ...card }}>
          <SectionHeader
            eyebrow="Tours"
            title="Created tours"
            right={<div style={pill}>🗺️ {tours.length}</div>}
          />

          {tours.length === 0 ? (
            <EmptyState text="No tours created yet." />
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {tours.slice(0, 3).map((t) => (
                <TourCard key={t.id} t={t} navigate={navigate} />
              ))}
              {tours.length > 3 ? (
                <button
                  style={btnGhost}
                  onClick={() => navigate(`/profile/${profile.id}?tab=tours`)}
                >
                  View all tours →
                </button>
              ) : null}
            </div>
          )}
        </div>

        <div style={{ marginTop: 14, ...card }}>
          <SectionHeader
            eyebrow="Events"
            title="Created events"
            right={<div style={pill}>🎟️ {events.length}</div>}
          />

          {events.length === 0 ? (
            <EmptyState text="No events yet." />
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {events.slice(0, 3).map((e) => (
                <EventCard key={e.id} e={e} navigate={navigate} />
              ))}
              {events.length > 3 ? (
                <button
                  style={btnGhost}
                  onClick={() => navigate(`/profile/${profile.id}?tab=events`)}
                >
                  View all events →
                </button>
              ) : null}
            </div>
          )}
        </div>

        {isOwnProfile ? (
          <div style={{ marginTop: 14, ...card }}>
            <SectionHeader
              eyebrow="Joined"
              title="Tours joined"
              right={<div style={pill}>🤝 {joinedTours.length}</div>}
            />

            {joinedTours.length === 0 ? (
              <EmptyState text="No joined tours yet." />
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {joinedTours.slice(0, 3).map((t) => (
                  <TourCard key={t.id} t={t} navigate={navigate} />
                ))}
              </div>
            )}
          </div>
        ) : null}

        <div style={{ marginTop: 14, ...card, marginBottom: 28 }}>
          <SectionHeader
            eyebrow="Timeline"
            title="Recent activity"
            right={<div style={pill}>🕒 {timeline.length}</div>}
          />

          {timeline.length === 0 ? (
            <EmptyState text="No activity yet." />
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {timeline.slice(0, 6).map((it) => (
                <TimelineItem key={it.key} it={it} navigate={navigate} compact />
              ))}
            </div>
          )}
        </div>
      </div>

      {avatarZoom ? (
        <div
          onClick={() => setAvatarZoom(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.96)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            backdropFilter: "blur(12px)",
            padding: 18,
          }}
        >
          <div style={{ width: "100%", maxWidth: 430, textAlign: "center" }}>
            <img
              src={avatar}
              alt=""
              style={{
                width: "100%",
                maxWidth: 430,
                borderRadius: 26,
                boxShadow: "0 40px 120px rgba(0,0,0,0.9)",
                border: "1px solid rgba(255,255,255,0.14)",
              }}
            />
            <div
              style={{
                marginTop: 14,
                fontSize: 13,
                opacity: 0.78,
                color: "white",
              }}
            >
              Tap anywhere to close
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* =========================
   MAIN PROFILE
========================= */

export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isSmall = useIsSmall();

  const [authUser, setAuthUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [tours, setTours] = useState([]);
  const [joinedTours, setJoinedTours] = useState([]);
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

  const [showFollowers, setShowFollowers] = useState(false);
  const [showFriends, setShowFriends] = useState(false);

  const [activeTab, setActiveTab] = useState(() => getInitialTab(location.search));

  const isOwnProfile = Boolean(authUser && authUser.id === id);

  useEffect(() => {
    const tab = getInitialTab(location.search);
    setActiveTab(tab);
  }, [location.search]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setAuthUser(data?.user || null);
    });
  }, []);

  const goToTab = useCallback(
    (tab) => {
      const safeTab = ALLOWED_TABS.includes(tab) ? tab : "overview";
      navigate(`/profile/${id}?tab=${safeTab}`);
    },
    [navigate, id]
  );

  const loadAll = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setNotFound(false);

    let cancelled = false;

    try {
      const { data: auth } = await supabase.auth.getUser();
      const me = auth?.user || null;

      if (!cancelled) setAuthUser(me);

      const [
        profileRes,
        toursRes,
        joinedRes,
        eventsRes,
        followersCountRes,
        followingCountRes,
        ratingsRes,
      ] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
        supabase.from("tours").select("*").eq("creator_id", id).order("created_at", { ascending: false }),
        supabase
          .from("tour_participants")
          .select(
            `
            tour_id,
            tours (*)
          `
          )
          .eq("user_id", id),
        supabase
          .from("events")
          .select("*")
          .eq("creator_id", id)
          .order("start_date", { ascending: true })
          .limit(24),
        supabase
          .from("profile_follows")
          .select("*", { count: "exact", head: true })
          .eq("following_id", id),
        supabase
          .from("profile_follows")
          .select("*", { count: "exact", head: true })
          .eq("follower_id", id),
        supabase.from("profile_ratings").select("rating, created_at").eq("rated_user_id", id),
      ]);

      if (cancelled) return;

      if (profileRes.error || !profileRes.data) {
        setProfile(null);
        setNotFound(true);
        setLoading(false);
        return;
      }

      const profileData = profileRes.data;
      const toursData = toursRes.data || [];
      const eventsData = eventsRes.data || [];

      const joinedData = dedupeById(
        (joinedRes.data || []).map((row) => row.tours).filter(Boolean)
      );

      setProfile(profileData);
      setTours(toursData);
      setJoinedTours(joinedData);
      setEvents(eventsData);

      setFollowersCount(followersCountRes.count || 0);
      setFollowingCount(followingCountRes.count || 0);

      const ratings = ratingsRes.data || [];
      if (ratings.length > 0) {
        const sum = ratings.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
        setAvgRating(sum / ratings.length);
        setRatingsCount(ratings.length);
      } else {
        setAvgRating(null);
        setRatingsCount(0);
      }

      let amFollowing = false;
      let mutualFriend = false;

      if (me && me.id !== id) {
        const [followARes, followBRes] = await Promise.all([
          supabase
            .from("profile_follows")
            .select("id")
            .eq("follower_id", me.id)
            .eq("following_id", id)
            .maybeSingle(),
          supabase
            .from("profile_follows")
            .select("id")
            .eq("follower_id", id)
            .eq("following_id", me.id)
            .maybeSingle(),
        ]);

        amFollowing = Boolean(followARes.data);
        mutualFriend = Boolean(followARes.data && followBRes.data);
      }

      setIsFollowing(amFollowing);
      setIsFriend(mutualFriend);

      const followersIdsRes = await supabase
        .from("profile_follows")
        .select("follower_id, created_at")
        .eq("following_id", id)
        .order("created_at", { ascending: false })
        .limit(120);

      const followerIds = (followersIdsRes.data || [])
        .map((r) => r.follower_id)
        .filter(Boolean);

      if (followerIds.length > 0) {
        const followersProfilesRes = await supabase
          .from("profiles")
          .select("id, full_name, username, avatar_url, country, city")
          .in("id", followerIds);

        const map = new Map((followersProfilesRes.data || []).map((p) => [p.id, p]));
        setFollowersList(followerIds.map((pid) => map.get(pid)).filter(Boolean));
      } else {
        setFollowersList([]);
      }

      const canSeeFriendsNow = (me && me.id === id) || mutualFriend;

      if (canSeeFriendsNow) {
        const [followingRowsRes, followersRowsRes] = await Promise.all([
          supabase
            .from("profile_follows")
            .select("following_id")
            .eq("follower_id", id)
            .limit(800),
          supabase
            .from("profile_follows")
            .select("follower_id")
            .eq("following_id", id)
            .limit(800),
        ]);

        const followingIds = new Set(
          (followingRowsRes.data || []).map((r) => r.following_id).filter(Boolean)
        );

        const mutualIds = (followersRowsRes.data || [])
          .map((r) => r.follower_id)
          .filter((x) => x && followingIds.has(x));

        if (mutualIds.length > 0) {
          const mutualProfilesRes = await supabase
            .from("profiles")
            .select("id, full_name, username, avatar_url, country, city")
            .in("id", mutualIds);

          const m = new Map((mutualProfilesRes.data || []).map((p) => [p.id, p]));
          setFriendsList(mutualIds.map((pid) => m.get(pid)).filter(Boolean));
        } else {
          setFriendsList([]);
        }
      } else {
        setFriendsList([]);
      }

      setTimeline(
        buildTimeline({
          tours: toursData,
          events: eventsData,
          ratings,
        })
      );
    } catch (err) {
      console.error("PROFILE LOAD ERROR", err);
      setProfile(null);
      setNotFound(true);
    } finally {
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!mounted) return;
      await loadAll();
    })();

    return () => {
      mounted = false;
    };
  }, [loadAll]);

  async function toggleFollow(e) {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    if (!authUser) {
      navigate("/login");
      return;
    }
    if (isOwnProfile || followBusy) return;

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

  const completion = useMemo(() => getProfileCompletion(profile), [profile]);

  const levelMeta = useMemo(
    () =>
      getLevelMeta({
        toursCount: tours.length,
        eventsCount: events.length,
        followersCount,
        avgRating,
        isFriend,
      }),
    [tours.length, events.length, followersCount, avgRating, isFriend]
  );

  const page = {
    minHeight: "100vh",
    color: "#eafff7",
    background: PAGE_BG,
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    paddingTop: 112,
  };

  const wrap = {
    maxWidth: 1240,
    margin: "0 auto",
    padding: "20px 16px 90px",
    display: "flex",
    flexDirection: "column",
    gap: 18,
  };

  const glass = {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "0 24px 80px rgba(0,0,0,0.58)",
    backdropFilter: "blur(18px)",
    borderRadius: 28,
  };

  const card = { ...glass, padding: 18 };

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
    background: `linear-gradient(135deg, ${levelMeta.theme.a}, ${levelMeta.theme.b}, ${levelMeta.theme.c})`,
    boxShadow: "0 10px 34px rgba(0,255,195,0.26)",
  };

  const btnGhost = {
    padding: "11px 16px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.22)",
    background: "rgba(0,0,0,0.35)",
    color: "white",
    cursor: "pointer",
    fontWeight: 900,
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
    background: active
      ? `linear-gradient(135deg, ${levelMeta.theme.a}, ${levelMeta.theme.b}, ${levelMeta.theme.c})`
      : "rgba(0,0,0,0.35)",
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

  if (loading) {
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
              fontWeight: 900,
            }}
          >
            Loading profile…
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div style={page}>
        <div style={wrap}>
          <div
            style={{
              ...glass,
              padding: 28,
              minHeight: "50vh",
              display: "grid",
              placeItems: "center",
              textAlign: "center",
            }}
          >
            <div>
              <div style={{ fontSize: 28, fontWeight: 950, marginBottom: 8 }}>
                Profile not found
              </div>
              <div style={{ opacity: 0.78, marginBottom: 16 }}>
                This explorer profile does not exist or is unavailable.
              </div>
              <button style={btnGhost} onClick={() => navigate(-1)}>
                Go back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const avatar = profile.avatar_url || FALLBACK_AVATAR;
  const cover = completion.cover;
  const safeName = getSafeName(profile);
  const locationLabel = getLocationLabel(profile);
  const canSeeFriends = isOwnProfile || isFriend;

  if (isSmall) {
    return (
      <MobileProfileView
        profile={profile}
        authUser={authUser}
        tours={tours}
        joinedTours={joinedTours}
        events={events}
        timeline={timeline}
        followersCount={followersCount}
        followingCount={followingCount}
        isOwnProfile={isOwnProfile}
        isFollowing={isFollowing}
        isFriend={isFriend}
        followBusy={followBusy}
        avgRating={avgRating}
        ratingsCount={ratingsCount}
        levelMeta={levelMeta}
        completion={completion}
        toggleFollow={toggleFollow}
        goEdit={() => navigate("/edit-profile")}
        navigate={navigate}
      />
    );
  }

  const actionBar = (
    <div
      style={{
        display: "flex",
        gap: 10,
        alignItems: "center",
        flexWrap: "wrap",
        justifyContent: "flex-end",
      }}
    >
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

          {isFriend ? <FriendBadge /> : null}
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
    <div
      style={{
        ...glass,
        overflow: "hidden",
        position: "relative",
        padding: 0,
      }}
    >
      <div style={{ position: "relative", height: 380 }}>
        {cover ? (
          <img
            src={cover}
            alt="cover"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "saturate(1.10) contrast(1.06) brightness(0.90)",
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
                "radial-gradient(680px 320px at 50% 100%, rgba(255,180,70,0.09), transparent 60%)," +
                "linear-gradient(180deg, rgba(0,0,0,0.25), rgba(0,0,0,0.92))",
            }}
          />
        )}

        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.92) 92%)",
          }}
        />
      </div>

      <div style={{ padding: 22, marginTop: -104, position: "relative" }}>
        <div
          style={{
            display: "flex",
            gap: 18,
            alignItems: "flex-end",
            justifyContent: "space-between",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 16,
              alignItems: "flex-end",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                width: 132,
                height: 132,
                borderRadius: "50%",
                padding: 4,
                background: `conic-gradient(from 210deg, ${levelMeta.theme.a}, ${levelMeta.theme.b}, ${levelMeta.theme.c}, ${levelMeta.theme.a})`,
                boxShadow:
                  "0 0 44px rgba(0,255,195,0.30), 0 0 90px rgba(124,77,255,0.16)",
                flexShrink: 0,
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

            <div style={{ paddingBottom: 6, maxWidth: 700 }}>
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <div style={pill}>
                  🧬 Level <b style={{ color: "white" }}>{levelMeta.level}</b>
                  <span style={{ opacity: 0.6 }}>•</span>
                  <span style={{ color: "rgba(255,255,255,0.92)" }}>{levelMeta.levelName}</span>
                </div>

                <div style={pill}>🏅 {levelMeta.badgeText}</div>

                <div style={pill}>
                  📍 {locationLabel}
                </div>

                {!completion.isComplete ? (
                  <div
                    style={{
                      ...pill,
                      background: "rgba(255,190,90,0.10)",
                      border: "1px solid rgba(255,190,90,0.20)",
                      color: "#ffe8b8",
                    }}
                  >
                    ⚠ Incomplete profile
                  </div>
                ) : null}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 12,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <div style={{ fontSize: 40, fontWeight: 950, lineHeight: 1.02 }}>
                  {safeName}
                </div>

                <ProfileRatingSummary profileId={profile.id} />

                {profile?.is_verified_creator ? (
                  <span
                    style={{
                      fontSize: 11,
                      padding: "5px 10px",
                      borderRadius: 999,
                      background: "rgba(0,255,176,0.14)",
                      border: "1px solid rgba(0,255,176,0.35)",
                      color: "#9cffd8",
                      fontWeight: 900,
                      letterSpacing: "0.05em",
                    }}
                  >
                    ✔ MeetOutdoors Verified
                  </span>
                ) : null}

                {isFriend ? <FriendBadge /> : null}
              </div>

              <div
                style={{
                  marginTop: 8,
                  fontSize: 14,
                  opacity: 0.88,
                  lineHeight: 1.75,
                  maxWidth: 760,
                }}
              >
                {profile.bio ||
                  "No description yet. This explorer prefers actions over words."}
              </div>

              <div style={{ marginTop: 14, maxWidth: 720 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 11,
                    opacity: 0.78,
                    marginBottom: 6,
                  }}
                >
                  <span>XP progress</span>
                  <span>
                    {levelMeta.xp} / {levelMeta.nextCap}
                  </span>
                </div>
                <div
                  style={{
                    height: 11,
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.12)",
                    overflow: "hidden",
                    boxShadow: "0 0 22px rgba(0,255,195,0.10)",
                  }}
                >
                  <div
                    style={{
                      width: `${Math.round(levelMeta.progress * 100)}%`,
                      height: "100%",
                      borderRadius: 999,
                      background: `linear-gradient(90deg, ${levelMeta.theme.a}, ${levelMeta.theme.b}, ${levelMeta.theme.c})`,
                      transition: "width 0.35s ease",
                    }}
                  />
                </div>
              </div>

              {levelMeta.badges.length > 0 ? (
                <div
                  style={{
                    marginTop: 12,
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  {levelMeta.badges.map((b) => (
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

              <div style={{ marginTop: 14 }}>
                <SocialLinks profile={profile} compact />
              </div>
            </div>
          </div>

          {actionBar}
        </div>

        <div
          style={{
            marginTop: 18,
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 12,
          }}
        >
          <StatTile label="Tours" value={tours.length} icon="🗺️" onClick={() => goToTab("tours")} />
          <StatTile label="Followers" value={followersCount} icon="👥" onClick={() => setShowFollowers(true)} />
          <StatTile label="Following" value={followingCount} icon="🧷" />
          <StatTile
            label="Rating"
            value={avgRating ? avgRating.toFixed(1) : "N/A"}
            icon="⭐"
          />
        </div>
      </div>
    </div>
  );

  const tabs = (
    <div style={tabsWrap}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button style={tabBtn(activeTab === "overview")} onClick={() => goToTab("overview")}>
          Overview
        </button>
        <button style={tabBtn(activeTab === "tours")} onClick={() => goToTab("tours")}>
          Tours
        </button>
        <button style={tabBtn(activeTab === "events")} onClick={() => goToTab("events")}>
          Events
        </button>
        <button
          style={tabBtn(activeTab === "friends")}
          onClick={() => {
            if (canSeeFriends) goToTab("friends");
            else setShowFriends(true);
          }}
        >
          Friends {canSeeFriends ? "" : "🔒"}
        </button>
        <button style={tabBtn(activeTab === "timeline")} onClick={() => goToTab("timeline")}>
          Timeline
        </button>
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          flexWrap: "wrap",
          justifyContent: "flex-end",
        }}
      >
        <div style={pill}>
          🧠 XP: <b style={{ color: "white" }}>{levelMeta.xp}</b>
        </div>
        <div style={pill}>
          🎟️ Events: <b style={{ color: "white" }}>{events.length}</b>
        </div>
      </div>
    </div>
  );

  const OverviewGrid = (
    <div style={gridResponsive}>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {isOwnProfile && !completion.isComplete ? (
          <CompletionCard
            completion={completion}
            onEdit={() => navigate("/edit-profile")}
            isOwner={isOwnProfile}
          />
        ) : null}

        <div style={card}>
          <SectionHeader
            eyebrow="Identity"
            title="Profile essentials"
            right={
              <div style={{ ...pill, opacity: 0.95 }}>
                📍 {locationLabel}
              </div>
            }
          />

          <div style={{ display: "grid", gap: 12 }}>
            <div
              style={{
                borderRadius: 18,
                padding: "14px 16px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                fontSize: 14,
                lineHeight: 1.75,
              }}
            >
              <b>From:</b> {locationLabel}
            </div>

            {!completion.isComplete ? (
              <div
                style={{
                  borderRadius: 18,
                  padding: "14px 16px",
                  background: "rgba(255,190,90,0.08)",
                  border: "1px solid rgba(255,190,90,0.18)",
                  fontSize: 14,
                  lineHeight: 1.75,
                  color: "#fff3dd",
                }}
              >
                To keep the app from feeling empty, users should have an <b>avatar, bio and cover image</b>.
                Unfinished profiles can look inactive and should be pushed to complete setup before joining tours.
              </div>
            ) : (
              <div
                style={{
                  borderRadius: 18,
                  padding: "14px 16px",
                  background: "rgba(0,255,176,0.08)",
                  border: "1px solid rgba(0,255,176,0.16)",
                  fontSize: 14,
                  lineHeight: 1.75,
                  color: "#ddfff2",
                }}
              >
                This profile is complete and looks trustworthy for the community.
              </div>
            )}

            {!isOwnProfile ? (
              <div style={{ marginTop: 4 }}>
                <ProfileRatingBox ratedUserId={profile.id} user={authUser} />
              </div>
            ) : null}
          </div>
        </div>

        <MediaPlaceholderCard
          isOwner={isOwnProfile}
          onEdit={() => navigate("/edit-profile")}
        />

        <div style={card}>
          <SectionHeader
            eyebrow="Timeline"
            title="Recent activity"
            right={<div style={{ ...pill, opacity: 0.95 }}>🕒 {timeline.length} items</div>}
          />

          {timeline.length === 0 ? (
            <EmptyState text="No activity yet." />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {timeline.map((it) => (
                <TimelineItem key={it.key} it={it} navigate={navigate} />
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={card}>
          <SectionHeader
            eyebrow="Rating"
            title="Reputation"
            right={
              <div style={pill}>
                🏆 Boost: <b style={{ color: "white" }}>{Math.round((avgRating || 0) * 60)}</b> XP
              </div>
            }
          />

          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div style={{ fontSize: 38, fontWeight: 950, lineHeight: 1 }}>
                {avgRating ? avgRating.toFixed(1) : "N/A"}
                <span style={{ fontSize: 16, opacity: 0.9 }}> ★</span>
              </div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                {ratingsCount} rating{ratingsCount === 1 ? "" : "s"}
              </div>
            </div>
          </div>

          {isOwnProfile ? (
            <div style={{ marginTop: 14 }}>
              <ProfileRatingBox ratedUserId={profile.id} user={authUser} />
            </div>
          ) : null}
        </div>

        <div style={card}>
          <SectionHeader
            eyebrow="Created"
            title="Created tours"
            right={<div style={pill}>🗺️ {tours.length}</div>}
          />

          {tours.length === 0 ? (
            <EmptyState text="No tours created yet." />
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: 12,
              }}
            >
              {tours.slice(0, 8).map((t) => (
                <TourCard key={t.id} t={t} navigate={navigate} compact />
              ))}
            </div>
          )}

          <button
            style={{ ...btnGhost, marginTop: 14, width: "100%" }}
            onClick={() => goToTab("tours")}
          >
            View tours →
          </button>
        </div>

        <div style={card}>
          <SectionHeader
            eyebrow="Created"
            title="Created events"
            right={<div style={pill}>🎟️ {events.length}</div>}
          />

          {events.length === 0 ? (
            <EmptyState text="No events created yet." />
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: 12,
              }}
            >
              {events.slice(0, 6).map((e) => (
                <EventCard key={e.id} e={e} navigate={navigate} compact />
              ))}
            </div>
          )}

          <button
            style={{ ...btnGhost, marginTop: 14, width: "100%" }}
            onClick={() => goToTab("events")}
          >
            View events →
          </button>
        </div>

        {isOwnProfile ? (
          <div style={card}>
            <SectionHeader
              eyebrow="Joined"
              title="Tours joined"
              right={<div style={pill}>🤝 {joinedTours.length}</div>}
            />

            {joinedTours.length === 0 ? (
              <EmptyState text="No joined tours yet." />
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                  gap: 12,
                }}
              >
                {joinedTours.slice(0, 4).map((t) => (
                  <TourCard key={t.id} t={t} navigate={navigate} compact />
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );

  const ToursTab = (
    <div style={card}>
      <SectionHeader eyebrow="Tours" title="All created tours" />

      {tours.length === 0 ? (
        <EmptyState text="No tours created yet." />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 12,
          }}
        >
          {tours.map((t) => (
            <TourCard key={t.id} t={t} navigate={navigate} />
          ))}
        </div>
      )}
    </div>
  );

  const EventsTab = (
    <div style={card}>
      <SectionHeader eyebrow="Events" title="All created events" />

      {events.length === 0 ? (
        <EmptyState text="No events created yet." />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 12,
          }}
        >
          {events.map((e) => (
            <EventCard key={e.id} e={e} navigate={navigate} />
          ))}
        </div>
      )}
    </div>
  );

  const TimelineTab = (
    <div style={card}>
      <SectionHeader eyebrow="Timeline" title="Everything this explorer did" />

      {timeline.length === 0 ? (
        <EmptyState text="No activity yet." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {timeline.map((it) => (
            <TimelineItem key={it.key} it={it} navigate={navigate} compact={false} />
          ))}
        </div>
      )}
    </div>
  );

  const FriendsTab = (
    <div style={card}>
      <SectionHeader
        eyebrow="Friends"
        title="Mutual follows"
        right={!canSeeFriends ? <div style={pill}>🔒 Private</div> : null}
      />

      {!canSeeFriends ? (
        <EmptyState text="Friends list is private. Only friends can see it." />
      ) : friendsList.length === 0 ? (
        <EmptyState text="No friends yet." />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 10,
          }}
        >
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
                style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover" }}
              />
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 950,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                  }}
                >
                  <span>{u.full_name || u.username || "Explorer"}</span>
                  <FriendBadge small />
                </div>
                <div style={{ fontSize: 12, opacity: 0.75 }}>
                  {[u.city, u.country].filter(Boolean).join(", ") || "Location not set"}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

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

        {showFollowers ? (
          <div
            onClick={() => setShowFollowers(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.62)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
              zIndex: 9999,
              backdropFilter: "blur(8px)",
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
              <SectionHeader
                eyebrow="Followers"
                title={`${followersCount} people`}
                right={
                  <button style={btnGhost} onClick={() => setShowFollowers(false)}>
                    Close
                  </button>
                }
              />

              {followersList.length === 0 ? (
                <EmptyState text="No followers yet." />
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                    gap: 10,
                  }}
                >
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
                        <div
                          style={{
                            fontWeight: 950,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {u.full_name || u.username || "Explorer"}
                        </div>
                        <div style={{ fontSize: 12, opacity: 0.75 }}>
                          {[u.city, u.country].filter(Boolean).join(", ") || "Location not set"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}

        {showFriends && !canSeeFriends ? (
          <div
            onClick={() => setShowFriends(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.62)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
              zIndex: 9999,
              backdropFilter: "blur(8px)",
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
              <SectionHeader eyebrow="Friends" title="🔒 Private list" />

              <div
                style={{
                  marginTop: 10,
                  fontSize: 13,
                  opacity: 0.82,
                  lineHeight: 1.6,
                }}
              >
                Friends list is private. <b>Only friends</b> can see it. Follow each other to unlock.
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 10,
                  marginTop: 14,
                }}
              >
                <button style={btnGhost} onClick={() => setShowFriends(false)}>
                  Close
                </button>

                {!isOwnProfile ? (
                  <button style={btnPrimary} onClick={toggleFollow} disabled={followBusy}>
                    {isFollowing ? "Following ✓" : "Follow"}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}