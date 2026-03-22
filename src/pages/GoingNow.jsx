import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

const FALLBACK_IMAGE =
  "https://images.pexels.com/photos/1761279/pexels-photo-1761279.jpeg";

const CATEGORY_OPTIONS = [
  { value: "all", label: "All" },
  { value: "outdoor", label: "Outdoor" },
  { value: "chill", label: "Chill" },
  { value: "night", label: "Night out" },
  { value: "sport", label: "Sport" },
  { value: "trip", label: "Mini trip" },
  { value: "activity", label: "Activity" },
];

const VIBE_OPTIONS = [
  { value: "all", label: "All vibes" },
  { value: "chill", label: "Chill" },
  { value: "social", label: "Social" },
  { value: "active", label: "Active" },
  { value: "party", label: "Party" },
  { value: "adventurous", label: "Adventurous" },
];

function formatDateTime(value) {
  if (!value) return "Time soon";

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Time soon";

  return d.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getCategoryEmoji(category) {
  switch ((category || "").toLowerCase()) {
    case "outdoor":
      return "🌿";
    case "chill":
      return "☕";
    case "night":
      return "🌙";
    case "sport":
      return "🏀";
    case "trip":
      return "🚗";
    case "activity":
      return "⚡";
    default:
      return "🔥";
  }
}

function getVibeEmoji(vibe) {
  switch ((vibe || "").toLowerCase()) {
    case "chill":
      return "🫶";
    case "social":
      return "👋";
    case "active":
      return "💪";
    case "party":
      return "🎉";
    case "adventurous":
      return "🏕️";
    default:
      return "✨";
  }
}

function getStatusLabel(item) {
  if (item.status === "cancelled") return "Cancelled";
  if (item.is_expired || item.status === "ended") return "Ended";
  if (item.is_full || item.status === "full") return "Full";
  return "Active";
}

function getStatusStyle(item) {
  const label = getStatusLabel(item);

  if (label === "Cancelled") {
    return {
      background: "rgba(255,80,80,0.12)",
      border: "1px solid rgba(255,80,80,0.22)",
      color: "#ffd0d0",
    };
  }

  if (label === "Ended") {
    return {
      background: "rgba(255,255,255,0.10)",
      border: "1px solid rgba(255,255,255,0.12)",
      color: "#f0f7fb",
    };
  }

  if (label === "Full") {
    return {
      background: "rgba(255,255,255,0.10)",
      border: "1px solid rgba(255,255,255,0.12)",
      color: "#ffffff",
    };
  }

  return {
    background:
      "linear-gradient(135deg, rgba(167,243,208,0.94), rgba(103,232,249,0.94), rgba(96,165,250,0.94))",
    border: "1px solid rgba(103,232,249,0.16)",
    color: "#06252e",
  };
}

function GoingNowMedia({ item, hero = false }) {
  const fallback = item.image_url || item.cover_image || FALLBACK_IMAGE;
  const mediaUrl = item.media_url || null;
  const mediaType = item.media_type || null;

  const mediaStyle = {
    width: "100%",
    height: "100%",
    position: hero ? "absolute" : "relative",
    inset: hero ? 0 : undefined,
    objectFit: "cover",
    display: "block",
    filter: hero ? "saturate(1.08) contrast(1.04) brightness(0.92)" : "none",
  };

  if (mediaUrl && mediaType === "video") {
    return (
      <video
        src={mediaUrl}
        muted
        playsInline
        loop
        autoPlay
        preload="metadata"
        style={mediaStyle}
      />
    );
  }

  if (mediaUrl) {
    return (
      <img
        src={mediaUrl}
        alt={item.title || "Going now"}
        style={mediaStyle}
      />
    );
  }

  return (
    <img
      src={fallback}
      alt={item.title || "Going now"}
      style={mediaStyle}
    />
  );
}

function HeroMiniStat({ label, value }) {
  return (
    <div
      style={{
        borderRadius: 18,
        padding: "12px 14px",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(125,211,252,0.12)",
        minWidth: 100,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: "0.10em",
          color: "rgba(225,247,255,0.56)",
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 24,
          lineHeight: 1,
          fontWeight: 950,
          letterSpacing: "-0.04em",
          color: "#f2fffd",
          textTransform: "capitalize",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function SectionTitle({ title, subtitle, action, onAction }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        gap: 16,
        flexWrap: "wrap",
        marginBottom: 14,
      }}
    >
      <div>
        <div
          style={{
            fontSize: 30,
            lineHeight: 1,
            fontWeight: 950,
            letterSpacing: "-0.04em",
            marginBottom: 8,
          }}
        >
          {title}
        </div>
        <div
          style={{
            color: "rgba(235,249,255,0.70)",
            fontWeight: 600,
            lineHeight: 1.6,
          }}
        >
          {subtitle}
        </div>
      </div>

      {action ? (
        <button type="button" onClick={onAction} style={secondaryTinyBtn}>
          {action}
        </button>
      ) : null}
    </div>
  );
}

function EmptyCard({ title, text, actionLabel, onAction, glassPanel }) {
  return (
    <div
      style={{
        ...glassPanel,
        padding: 24,
      }}
    >
      <div
        style={{
          fontSize: 28,
          fontWeight: 950,
          letterSpacing: "-0.03em",
          marginBottom: 10,
        }}
      >
        {title}
      </div>

      <div
        style={{
          color: "rgba(235,249,255,0.72)",
          lineHeight: 1.65,
          fontWeight: 600,
          marginBottom: 16,
          maxWidth: 720,
        }}
      >
        {text}
      </div>

      <button type="button" onClick={onAction} style={primaryButtonStyle}>
        {actionLabel}
      </button>
    </div>
  );
}

function FeaturedCard({ item, navigate }) {
  if (!item) return null;

  return (
    <div
      onClick={() => navigate(`/going-now/${item.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          navigate(`/going-now/${item.id}`);
        }
      }}
      style={{
        ...featuredCardStyle,
        cursor: "pointer",
      }}
    >
      <div
        style={{
          position: "relative",
          minHeight: 420,
          overflow: "hidden",
        }}
      >
        <GoingNowMedia item={item} hero />

        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(4,10,14,0.98) 6%, rgba(4,10,14,0.72) 34%, rgba(4,10,14,0.18) 62%, rgba(4,10,14,0.06) 100%)",
          }}
        />

        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 76% 20%, rgba(103,232,249,0.20), transparent 18%), radial-gradient(circle at 20% 28%, rgba(167,243,208,0.16), transparent 18%), radial-gradient(circle at 52% 20%, rgba(255,255,255,0.10), transparent 20%)",
          }}
        />

        <div
          style={{
            position: "absolute",
            top: 18,
            left: 18,
            right: 18,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <div style={topFeatureBadge}>🔥 Featured live plan</div>

          <div
            style={{
              ...statusPillStyle,
              ...getStatusStyle(item),
            }}
          >
            {getStatusLabel(item)}
          </div>
        </div>

        {item.media_type === "video" ? (
          <div style={videoBadgeLarge}>🎬 Video preview</div>
        ) : null}

        <div
          style={{
            position: "absolute",
            left: 22,
            right: 22,
            bottom: 22,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginBottom: 12,
            }}
          >
            {item.category ? (
              <span style={chipStyle}>
                {getCategoryEmoji(item.category)} {item.category}
              </span>
            ) : null}
            {item.vibe ? (
              <span style={chipStyle}>
                {getVibeEmoji(item.vibe)} {item.vibe}
              </span>
            ) : null}
            {item.difficulty ? (
              <span style={chipStyle}>🎯 {item.difficulty}</span>
            ) : null}
          </div>

          <div
            style={{
              fontSize: "clamp(34px, 5vw, 56px)",
              lineHeight: 0.95,
              fontWeight: 950,
              letterSpacing: "-0.055em",
              color: "#fff",
              marginBottom: 12,
              maxWidth: 780,
              textShadow: "0 16px 34px rgba(0,0,0,0.34)",
            }}
          >
            {item.title || "Untitled plan"}
          </div>

          <div
            style={{
              color: "rgba(238,250,245,0.84)",
              lineHeight: 1.65,
              fontWeight: 600,
              marginBottom: 14,
              fontSize: 15.5,
              maxWidth: 820,
            }}
          >
            {(item.description || "Jump in and join this live plan now.").slice(
              0,
              170
            )}
            {(item.description || "").length > 170 ? "..." : ""}
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <div style={metaPill}>📍 {item.location_text || "Location soon"}</div>
            <div style={metaPill}>⏰ {formatDateTime(item.starts_at)}</div>
            <div style={metaPill}>
              👥 {item.joined_count || 0}/{item.spots_total || 0}
            </div>
            <div style={metaPill}>🪑 {item.spots_left || 0} left</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CompactSideCard({ item, navigate }) {
  if (!item) return null;

  return (
    <div
      onClick={() => navigate(`/going-now/${item.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          navigate(`/going-now/${item.id}`);
        }
      }}
      style={compactCardStyle}
    >
      <div
        style={{
          position: "relative",
          width: 122,
          minWidth: 122,
          height: 122,
          borderRadius: 18,
          overflow: "hidden",
          background: "#07131a",
        }}
      >
        <div style={{ position: "absolute", inset: 0 }}>
          <GoingNowMedia item={item} />
        </div>

        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(4,10,14,0.72), rgba(4,10,14,0.12))",
          }}
        />

        {item.media_type === "video" ? (
          <div style={videoMiniBadge}>🎬</div>
        ) : null}
      </div>

      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 8,
          }}
        >
          {item.category ? (
            <span style={tinyChip}>
              {getCategoryEmoji(item.category)} {item.category}
            </span>
          ) : null}
          <span
            style={{
              ...tinyChip,
              ...(getStatusLabel(item) === "Active"
                ? {
                    background:
                      "linear-gradient(135deg, rgba(167,243,208,0.92), rgba(103,232,249,0.92), rgba(96,165,250,0.92))",
                    color: "#06252e",
                    border: "none",
                  }
                : {}),
            }}
          >
            {getStatusLabel(item)}
          </span>
        </div>

        <div
          style={{
            fontSize: 20,
            lineHeight: 1.03,
            fontWeight: 900,
            letterSpacing: "-0.04em",
            color: "#fff",
            marginBottom: 8,
          }}
        >
          {item.title || "Untitled plan"}
        </div>

        <div
          style={{
            color: "rgba(231,247,251,0.74)",
            lineHeight: 1.55,
            fontWeight: 600,
            fontSize: 13.5,
            marginBottom: 10,
          }}
        >
          📍 {item.location_text || "Location soon"}
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span style={smallStat}>⏰ {formatDateTime(item.starts_at)}</span>
          <span style={smallStat}>👥 {item.joined_count || 0}</span>
        </div>
      </div>
    </div>
  );
}

function GoingNowCard({ item, navigate }) {
  return (
    <div
      key={item.id}
      onClick={() => navigate(`/going-now/${item.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          navigate(`/going-now/${item.id}`);
        }
      }}
      style={cardStyle}
    >
      <div
        style={{
          position: "relative",
          minHeight: 260,
        }}
      >
        <GoingNowMedia item={item} hero />

        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(4,10,14,0.98) 8%, rgba(4,10,14,0.72) 36%, rgba(4,10,14,0.26) 60%, rgba(4,10,14,0.10) 100%)",
          }}
        />

        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 76% 20%, rgba(103,232,249,0.22), transparent 20%), radial-gradient(circle at 22% 26%, rgba(167,243,208,0.16), transparent 18%), radial-gradient(circle at 48% 18%, rgba(255,205,130,0.10), transparent 18%)",
          }}
        />

        <div
          style={{
            position: "absolute",
            top: 14,
            left: 14,
            right: 14,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <div style={miniLiveBadge}>🔥 Going now</div>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "8px 12px",
              borderRadius: 999,
              fontWeight: 900,
              fontSize: 11,
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              ...getStatusStyle(item),
            }}
          >
            {getStatusLabel(item)}
          </div>
        </div>

        {item.media_type === "video" ? (
          <div style={videoBadgeCard}>🎬 VIDEO</div>
        ) : null}

        <div
          style={{
            position: "absolute",
            left: 16,
            right: 16,
            bottom: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginBottom: 10,
            }}
          >
            {item.category ? (
              <span style={chipStyle}>
                {getCategoryEmoji(item.category)} {item.category}
              </span>
            ) : null}
            {item.vibe ? (
              <span style={chipStyle}>
                {getVibeEmoji(item.vibe)} {item.vibe}
              </span>
            ) : null}
            {item.difficulty ? (
              <span style={chipStyle}>🎯 {item.difficulty}</span>
            ) : null}
          </div>

          <div
            style={{
              fontSize: 30,
              lineHeight: 0.98,
              fontWeight: 950,
              letterSpacing: "-0.05em",
              color: "#fff",
              marginBottom: 10,
              textShadow: "0 12px 28px rgba(0,0,0,0.36)",
            }}
          >
            {item.title || "Untitled plan"}
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <div style={metaPill}>📍 {item.location_text || "Location soon"}</div>
            <div style={metaPill}>⏰ {formatDateTime(item.starts_at)}</div>
          </div>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        {item.description ? (
          <div
            style={{
              color: "rgba(238,250,245,0.86)",
              lineHeight: 1.65,
              fontWeight: 600,
              marginBottom: 14,
              fontSize: 14.5,
            }}
          >
            {item.description.length > 120
              ? `${item.description.slice(0, 120)}...`
              : item.description}
          </div>
        ) : (
          <div
            style={{
              color: "rgba(238,250,245,0.66)",
              lineHeight: 1.65,
              fontWeight: 600,
              marginBottom: 14,
              fontSize: 14.5,
            }}
          >
            Join this live plan now.
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <div style={smallStat}>
              👥 {item.joined_count || 0}/{item.spots_total || 0}
            </div>
            <div style={smallStat}>🪑 {item.spots_left || 0} left</div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/going-now/${item.id}`);
            }}
            style={openButtonStyle}
          >
            Open
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GoingNow() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [vibe, setVibe] = useState("all");

  const shellBg =
    "radial-gradient(circle at top, rgba(103,232,249,0.16), transparent 18%), radial-gradient(circle at 82% 16%, rgba(167,243,208,0.15), transparent 18%), radial-gradient(circle at 18% 72%, rgba(96,165,250,0.12), transparent 20%), linear-gradient(180deg, #031019 0%, #081b28 40%, #0b2330 100%)";

  const glassPanel = {
    borderRadius: 30,
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.045))",
    border: "1px solid rgba(157,229,219,0.14)",
    boxShadow:
      "0 20px 55px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.08)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
  };

  const miniPill = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 14px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.12)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    fontWeight: 850,
    color: "#effffd",
  };

  const loadGoingNow = async () => {
    setLoading(true);
    setErrorMsg("");

    const { data, error } = await supabase
      .from("going_now_overview")
      .select("*")
      .order("starts_at", { ascending: true });

    if (error) {
      console.error("going now page error:", error);
      setErrorMsg(error.message || "Could not load plans.");
      setItems([]);
      setLoading(false);
      return;
    }

    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadGoingNow();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("going-now-feed")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "going_now",
        },
        async () => {
          await loadGoingNow();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "going_now_participants",
        },
        async () => {
          await loadGoingNow();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredItems = useMemo(() => {
    return (items || []).filter((item) => {
      const text = search.trim().toLowerCase();

      const matchesSearch =
        !text ||
        item.title?.toLowerCase().includes(text) ||
        item.description?.toLowerCase().includes(text) ||
        item.location_text?.toLowerCase().includes(text) ||
        item.category?.toLowerCase().includes(text) ||
        item.vibe?.toLowerCase().includes(text);

      const matchesCategory =
        category === "all" || (item.category || "").toLowerCase() === category;

      const matchesVibe =
        vibe === "all" || (item.vibe || "").toLowerCase() === vibe;

      return matchesSearch && matchesCategory && matchesVibe;
    });
  }, [items, search, category, vibe]);

  const liveItems = filteredItems.filter(
    (item) => item.status === "active" && !item.is_expired
  );

  const endedItems = filteredItems.filter(
    (item) => item.status !== "active" || item.is_expired
  );

  const featuredItem = liveItems[0] || filteredItems[0] || null;
  const sideSpotlight = liveItems.slice(1, 4);

  const totalPlans = filteredItems.length;
  const liveCount = liveItems.length;
  const videoCount = filteredItems.filter((item) => item.media_type === "video").length;

  return (
    <div
      style={{
        minHeight: "100vh",
        marginTop: -120,
        background: shellBg,
        color: "#fff",
        padding: "16px 12px 108px",
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 14,
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => navigate(-1)}
            style={{
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.05)",
              color: "#fff",
              borderRadius: 999,
              padding: "11px 15px",
              cursor: "pointer",
              fontWeight: 900,
              backdropFilter: "blur(10px)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
            }}
          >
            ← Back
          </button>

          <div style={miniPill}>⚡ Live social plans</div>
        </div>

        <div
          style={{
            ...glassPanel,
            overflow: "hidden",
            marginBottom: 18,
          }}
        >
          <div
            style={{
              position: "relative",
              padding: "24px 18px 18px",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -80,
                right: -80,
                width: 220,
                height: 220,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(103,232,249,0.18), transparent 68%)",
                pointerEvents: "none",
              }}
            />

            <div
              style={{
                position: "absolute",
                bottom: -90,
                left: -80,
                width: 220,
                height: 220,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(167,243,208,0.14), transparent 68%)",
                pointerEvents: "none",
              }}
            />

            <div
              style={{
                position: "relative",
                display: "flex",
                justifyContent: "space-between",
                gap: 18,
                flexWrap: "wrap",
                alignItems: "flex-end",
              }}
            >
              <div style={{ maxWidth: 780 }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 12px",
                    borderRadius: 999,
                    background:
                      "linear-gradient(135deg, rgba(167,243,208,0.18), rgba(103,232,249,0.18))",
                    border: "1px solid rgba(103,232,249,0.14)",
                    color: "#dffeff",
                    fontWeight: 900,
                    fontSize: 11,
                    marginBottom: 12,
                    letterSpacing: "0.03em",
                  }}
                >
                  ⚡ Live plans
                </div>

                <div
                  style={{
                    fontSize: "clamp(38px, 7vw, 68px)",
                    lineHeight: 0.92,
                    fontWeight: 950,
                    letterSpacing: "-0.055em",
                    marginBottom: 12,
                  }}
                >
                  Going now
                </div>

                <div
                  style={{
                    color: "rgba(235,249,255,0.74)",
                    fontWeight: 600,
                    lineHeight: 1.65,
                    maxWidth: 760,
                    fontSize: 15.5,
                  }}
                >
                  Discover live plans happening now or very soon. This is the fast,
                  visual, social layer that makes the app feel alive — not static.
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                    marginTop: 16,
                  }}
                >
                  <HeroMiniStat label="Showing" value={totalPlans} />
                  <HeroMiniStat label="Live now" value={liveCount} />
                  <HeroMiniStat label="Video" value={videoCount} />
                  <HeroMiniStat
                    label="Filters"
                    value={
                      (category !== "all" ? 1 : 0) +
                      (vibe !== "all" ? 1 : 0) +
                      (search ? 1 : 0)
                    }
                  />
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gap: 10,
                  minWidth: 260,
                  width: "100%",
                  maxWidth: 320,
                }}
              >
                <button
                  type="button"
                  onClick={() => navigate("/going-now/create")}
                  style={primaryButtonStyle}
                >
                  Start a plan
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setCategory("all");
                    setVibe("all");
                  }}
                  style={secondaryButtonStyle}
                >
                  Clear filters
                </button>
              </div>
            </div>
          </div>

          <div style={{ padding: 16 }}>
            <div className="going-now-filters" style={filtersGrid}>
              <div style={{ position: "relative" }}>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by title, place, vibe..."
                  style={inputStyle}
                />
              </div>

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={inputStyle}
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} style={{ color: "#000" }}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <select
                value={vibe}
                onChange={(e) => setVibe(e.target.value)}
                style={inputStyle}
              >
                {VIBE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} style={{ color: "#000" }}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {featuredItem ? (
          <div className="editorial-layout" style={{ marginBottom: 26 }}>
            <div className="editorial-main">
              <SectionTitle
                title="Featured right now"
                subtitle="The strongest live plan on the page. Big, visual, premium."
              />
              <FeaturedCard item={featuredItem} navigate={navigate} />
            </div>

            <div className="editorial-side">
              <SectionTitle
                title="Spotlight"
                subtitle="More plans worth opening fast."
              />
              <div style={{ display: "grid", gap: 12 }}>
                {sideSpotlight.length > 0 ? (
                  sideSpotlight.map((item) => (
                    <CompactSideCard
                      key={item.id}
                      item={item}
                      navigate={navigate}
                    />
                  ))
                ) : (
                  <div style={sideEmptyStyle}>
                    No extra spotlight plans yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {errorMsg ? (
          <div
            style={{
              marginBottom: 16,
              color: "#ffb4b4",
              background: "rgba(255,80,80,0.08)",
              border: "1px solid rgba(255,80,80,0.22)",
              padding: 12,
              borderRadius: 14,
              fontWeight: 700,
            }}
          >
            {errorMsg}
          </div>
        ) : null}

        {loading ? (
          <div style={{ ...glassPanel, padding: 24, fontWeight: 800 }}>
            Loading plans...
          </div>
        ) : (
          <>
            <SectionTitle
              title={`Live now (${liveItems.length})`}
              subtitle="Active plans people can still join."
              action="Create new"
              onAction={() => navigate("/going-now/create")}
            />

            {liveItems.length === 0 ? (
              <EmptyCard
                title="No live plans found"
                text="Try another search, remove filters, or start a new plan."
                actionLabel="Start a plan"
                onAction={() => navigate("/going-now/create")}
                glassPanel={glassPanel}
              />
            ) : (
              <div className="going-now-grid" style={gridStyle}>
                {liveItems.map((item) => (
                  <GoingNowCard
                    key={item.id}
                    item={item}
                    navigate={navigate}
                  />
                ))}
              </div>
            )}

            {endedItems.length > 0 ? (
              <>
                <div style={{ height: 22 }} />
                <SectionTitle
                  title={`Past / unavailable (${endedItems.length})`}
                  subtitle="Ended, full, or cancelled plans."
                />

                <div className="going-now-grid" style={gridStyle}>
                  {endedItems.map((item) => (
                    <GoingNowCard
                      key={item.id}
                      item={item}
                      navigate={navigate}
                    />
                  ))}
                </div>
              </>
            ) : null}
          </>
        )}
      </div>

      <style>{`
        .editorial-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.8fr);
          gap: 18px;
          align-items: start;
        }

        .going-now-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
        }

        .going-now-filters {
          display: grid;
          grid-template-columns: 1.45fr 1fr 1fr;
          gap: 12px;
        }

        @media (max-width: 1120px) {
          .editorial-layout {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 980px) {
          .going-now-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 860px) {
          .going-now-grid {
            grid-template-columns: 1fr;
          }

          .going-now-filters {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

const gridStyle = {};
const filtersGrid = {};

const inputStyle = {
  width: "100%",
  borderRadius: 18,
  border: "1px solid rgba(125,211,252,0.14)",
  background: "rgba(255,255,255,0.06)",
  color: "#fff",
  padding: "14px 14px",
  outline: "none",
  fontSize: 15,
  boxSizing: "border-box",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
};

const chipStyle = {
  display: "inline-flex",
  alignItems: "center",
  padding: "7px 10px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#ecfaf6",
  fontSize: 12,
  fontWeight: 800,
  textTransform: "capitalize",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
};

const tinyChip = {
  display: "inline-flex",
  alignItems: "center",
  padding: "6px 9px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#ecfaf6",
  fontSize: 11,
  fontWeight: 800,
  textTransform: "capitalize",
};

const metaPill = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 11px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#ffffff",
  fontWeight: 800,
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
};

const smallStat = {
  display: "inline-flex",
  alignItems: "center",
  padding: "8px 11px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(125,211,252,0.12)",
  color: "#eafbf5",
  fontWeight: 800,
  fontSize: 12.5,
};

const primaryButtonStyle = {
  border: "none",
  borderRadius: 18,
  padding: "15px 18px",
  background:
    "linear-gradient(135deg, #a7f3d0 0%, #67e8f9 50%, #60a5fa 100%)",
  color: "#06232c",
  fontWeight: 950,
  fontSize: 15,
  cursor: "pointer",
  boxShadow: "0 18px 40px rgba(103,232,249,0.20)",
  width: "100%",
};

const secondaryButtonStyle = {
  border: "1px solid rgba(125,211,252,0.14)",
  borderRadius: 18,
  padding: "15px 18px",
  background: "rgba(255,255,255,0.06)",
  color: "#effffd",
  fontWeight: 900,
  fontSize: 15,
  cursor: "pointer",
  width: "100%",
};

const secondaryTinyBtn = {
  border: "1px solid rgba(125,211,252,0.14)",
  borderRadius: 999,
  padding: "10px 14px",
  background: "rgba(255,255,255,0.06)",
  color: "#effffd",
  fontWeight: 900,
  fontSize: 13,
  cursor: "pointer",
};

const openButtonStyle = {
  border: "none",
  borderRadius: 14,
  padding: "11px 14px",
  background:
    "linear-gradient(135deg, #a7f3d0 0%, #67e8f9 50%, #60a5fa 100%)",
  color: "#06232c",
  fontWeight: 900,
  cursor: "pointer",
  boxShadow: "0 10px 26px rgba(103,232,249,0.18)",
};

const topFeatureBadge = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 14px",
  borderRadius: 999,
  background:
    "linear-gradient(135deg, #a7f3d0 0%, #67e8f9 50%, #60a5fa 100%)",
  color: "#06252e",
  fontWeight: 950,
  fontSize: 11,
  letterSpacing: "0.03em",
  boxShadow: "0 14px 34px rgba(103,232,249,0.22)",
};

const miniLiveBadge = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "9px 13px",
  borderRadius: 999,
  background:
    "linear-gradient(135deg, #a7f3d0 0%, #67e8f9 50%, #60a5fa 100%)",
  color: "#06252e",
  fontWeight: 950,
  fontSize: 11,
  letterSpacing: "0.03em",
  boxShadow: "0 14px 34px rgba(103,232,249,0.22)",
};

const statusPillStyle = {
  display: "inline-flex",
  alignItems: "center",
  padding: "8px 12px",
  borderRadius: 999,
  fontWeight: 900,
  fontSize: 11,
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
};

const videoBadgeLarge = {
  position: "absolute",
  top: 68,
  right: 18,
  padding: "10px 14px",
  borderRadius: 999,
  background: "rgba(0,0,0,0.45)",
  color: "#fff",
  fontWeight: 900,
  fontSize: 12,
  border: "1px solid rgba(255,255,255,0.18)",
  backdropFilter: "blur(10px)",
};

const videoBadgeCard = {
  position: "absolute",
  top: 54,
  right: 14,
  padding: "8px 12px",
  borderRadius: 999,
  background: "rgba(0,0,0,0.45)",
  color: "#fff",
  fontWeight: 900,
  fontSize: 11,
  border: "1px solid rgba(255,255,255,0.18)",
  backdropFilter: "blur(8px)",
};

const videoMiniBadge = {
  position: "absolute",
  top: 10,
  right: 10,
  width: 30,
  height: 30,
  borderRadius: "50%",
  display: "grid",
  placeItems: "center",
  background: "rgba(0,0,0,0.45)",
  border: "1px solid rgba(255,255,255,0.18)",
  backdropFilter: "blur(8px)",
};

const cardStyle = {
  borderRadius: 28,
  overflow: "hidden",
  border: "1px solid rgba(255,255,255,0.10)",
  background:
    "linear-gradient(160deg, rgba(10,18,20,0.92), rgba(8,16,20,0.98))",
  boxShadow:
    "0 24px 70px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.05)",
  cursor: "pointer",
  transition: "transform 0.22s ease, box-shadow 0.22s ease",
};

const featuredCardStyle = {
  borderRadius: 34,
  overflow: "hidden",
  border: "1px solid rgba(255,255,255,0.10)",
  background:
    "linear-gradient(160deg, rgba(10,18,20,0.92), rgba(8,16,20,0.98))",
  boxShadow:
    "0 28px 80px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.05)",
};

const compactCardStyle = {
  display: "flex",
  gap: 12,
  alignItems: "stretch",
  borderRadius: 22,
  padding: 12,
  border: "1px solid rgba(255,255,255,0.10)",
  background:
    "linear-gradient(160deg, rgba(10,18,20,0.92), rgba(8,16,20,0.98))",
  boxShadow:
    "0 18px 46px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.05)",
  cursor: "pointer",
};

const sideEmptyStyle = {
  borderRadius: 22,
  padding: 18,
  border: "1px solid rgba(255,255,255,0.10)",
  background:
    "linear-gradient(160deg, rgba(10,18,20,0.92), rgba(8,16,20,0.98))",
  color: "rgba(235,249,255,0.72)",
  fontWeight: 700,
};