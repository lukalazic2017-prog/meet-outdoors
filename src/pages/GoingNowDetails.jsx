import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";

const FALLBACK_AVATAR = "https://i.pravatar.cc/150?img=12";
const FALLBACK_IMAGE =
  "https://images.pexels.com/photos/1761279/pexels-photo-1761279.jpeg";

function formatDateTime(value) {
  if (!value) return "Time soon";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Time soon";

  return d.toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTimeOnly(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCompactDate(value) {
  if (!value) return "Recently";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Recently";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
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

function getDifficultyMeta(diff) {
  switch ((diff || "").toLowerCase()) {
    case "easy":
      return {
        label: "Easy",
        bg: "rgba(167,243,208,0.14)",
        border: "1px solid rgba(167,243,208,0.24)",
        color: "#d6fff0",
      };
    case "moderate":
      return {
        label: "Moderate",
        bg: "rgba(103,232,249,0.14)",
        border: "1px solid rgba(103,232,249,0.24)",
        color: "#dcfbff",
      };
    case "hard":
      return {
        label: "Hard",
        bg: "rgba(96,165,250,0.14)",
        border: "1px solid rgba(96,165,250,0.24)",
        color: "#e9f0ff",
      };
    default:
      return {
        label: "Open",
        bg: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.12)",
        color: "#eef7fb",
      };
  }
}

function getStatusMeta(item) {
  if (!item) {
    return {
      label: "Loading",
      pill: {
        background: "rgba(255,255,255,0.10)",
        border: "1px solid rgba(255,255,255,0.12)",
        color: "#fff",
      },
    };
  }

  const expired = item.expires_at
    ? new Date(item.expires_at).getTime() <= Date.now()
    : false;

  if (item.status === "cancelled") {
    return {
      label: "Cancelled",
      pill: {
        background: "rgba(255,90,90,0.12)",
        border: "1px solid rgba(255,90,90,0.22)",
        color: "#ffd7d7",
      },
    };
  }

  if (expired || item.status === "ended") {
    return {
      label: "Ended",
      pill: {
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.12)",
        color: "#eef7fb",
      },
    };
  }

  if (item.status === "full") {
    return {
      label: "Full",
      pill: {
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.12)",
        color: "#ffffff",
      },
    };
  }

  return {
    label: "Live",
    pill: {
      background:
        "linear-gradient(135deg, rgba(167,243,208,0.94), rgba(103,232,249,0.94), rgba(96,165,250,0.94))",
      border: "1px solid rgba(103,232,249,0.16)",
      color: "#06252e",
    },
  };
}

function getRelativeTimeLabel(startsAt, expiresAt, status) {
  const now = Date.now();
  const start = startsAt ? new Date(startsAt).getTime() : null;
  const end = expiresAt ? new Date(expiresAt).getTime() : null;

  if (status === "cancelled") return "This plan was cancelled.";
  if (end && end <= now) return "This live plan has ended.";

  if (start && start > now) {
    const diff = start - now;
    const mins = Math.max(1, Math.round(diff / 60000));
    if (mins < 60) return `Starts in ${mins} min`;
    const hours = Math.floor(mins / 60);
    const rem = mins % 60;
    return rem ? `Starts in ${hours}h ${rem}m` : `Starts in ${hours}h`;
  }

  if (start && start <= now) {
    const diff = now - start;
    const mins = Math.max(1, Math.round(diff / 60000));
    if (mins < 60) return `Started ${mins} min ago`;
    const hours = Math.floor(mins / 60);
    const rem = mins % 60;
    return rem ? `Started ${hours}h ${rem}m ago` : `Started ${hours}h ago`;
  }

  return "Live now";
}

function getTimeLeftLabel(expiresAt) {
  if (!expiresAt) return "No end time set";
  const now = Date.now();
  const end = new Date(expiresAt).getTime();
  if (Number.isNaN(end)) return "No end time set";
  if (end <= now) return "Ended";

  const diff = end - now;
  const mins = Math.max(1, Math.round(diff / 60000));
  if (mins < 60) return `Ends in ${mins} min`;

  const hours = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem ? `Ends in ${hours}h ${rem}m` : `Ends in ${hours}h`;
}

function getDisplayName(profile, fallbackUserId = "") {
  return (
    profile?.full_name?.trim() ||
    profile?.username?.trim() ||
    `Explorer ${String(fallbackUserId || "").slice(0, 6)}`
  );
}

function HeroMedia({ item, onOpen }) {
  const fallback =
    item?.media_url || item?.image_url || item?.cover_image || FALLBACK_IMAGE;

  if (item?.media_url && item?.media_type === "video") {
    return (
      <video
        src={item.media_url}
        muted
        autoPlay
        loop
        playsInline
        preload="metadata"
        onClick={onOpen}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          cursor: "pointer",
          filter: "saturate(1.08) contrast(1.06) brightness(0.82)",
        }}
      />
    );
  }

  return (
    <img
      src={fallback}
      alt={item?.title || "Going now"}
      onClick={onOpen}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        cursor: "pointer",
        filter: "saturate(1.08) contrast(1.06) brightness(0.82)",
      }}
    />
  );
}

function HeroMiniStat({ label, value }) {
  return (
    <div
      style={{
        padding: "10px 12px",
        borderRadius: 16,
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.12)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        minWidth: 96,
      }}
    >
      <div
        style={{
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "rgba(227,247,242,0.66)",
          fontWeight: 800,
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          color: "#f5fffd",
          fontWeight: 900,
          fontSize: 15,
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function ParticipantStack({ participants, onOpenProfile }) {
  const visible = participants.slice(0, 6);
  const extra = Math.max(0, participants.length - visible.length);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        {visible.map((p, index) => (
          <img
            key={p.id || `${p.user_id}-${index}`}
            src={p?.profiles?.avatar_url || FALLBACK_AVATAR}
            alt={getDisplayName(p?.profiles, p?.user_id)}
            onClick={() => onOpenProfile?.(p?.user_id)}
            style={{
              width: 42,
              height: 42,
              borderRadius: "50%",
              objectFit: "cover",
              border: "2px solid rgba(3,10,14,0.95)",
              marginLeft: index === 0 ? 0 : -10,
              boxShadow: "0 8px 24px rgba(0,0,0,0.22)",
              cursor: "pointer",
              background: "#0d1715",
            }}
          />
        ))}
      </div>

      <div>
        <div style={{ color: "#f3fffc", fontWeight: 900, fontSize: 15 }}>
          {participants.length} going now
        </div>
        <div style={{ color: "rgba(227,247,242,0.68)", fontSize: 13 }}>
          {extra > 0 ? `+${extra} more joined` : "Tap avatars to open profiles"}
        </div>
      </div>
    </div>
  );
}

function MediaFullscreen({ open, item, onClose }) {
  if (!open) return null;

  const src =
    item?.media_url || item?.image_url || item?.cover_image || FALLBACK_IMAGE;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(2,8,12,0.92)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 18,
      }}
    >
      <button
        type="button"
        onClick={onClose}
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          width: 46,
          height: 46,
          borderRadius: "50%",
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(255,255,255,0.08)",
          color: "#fff",
          fontSize: 22,
          cursor: "pointer",
        }}
      >
        ×
      </button>

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(1200px, 100%)",
          maxHeight: "90vh",
          borderRadius: 26,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.10)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.34)",
          background: "#050b0f",
        }}
      >
        {item?.media_url && item?.media_type === "video" ? (
          <video
            src={src}
            controls
            autoPlay
            playsInline
            style={{
              width: "100%",
              maxHeight: "90vh",
              display: "block",
              background: "#000",
            }}
          />
        ) : (
          <img
            src={src}
            alt={item?.title || "Media"}
            style={{
              width: "100%",
              maxHeight: "90vh",
              objectFit: "contain",
              display: "block",
              background: "#000",
            }}
          />
        )}
      </div>
    </div>
  );
}

function SectionTitle({ eyebrow, title, sub }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {eyebrow ? (
        <div
          style={{
            fontSize: 11,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "rgba(181,245,235,0.72)",
            fontWeight: 900,
            marginBottom: 8,
          }}
        >
          {eyebrow}
        </div>
      ) : null}

      <div
        style={{
          color: "#f3fffc",
          fontWeight: 950,
          fontSize: 24,
          lineHeight: 1.02,
          letterSpacing: "-0.03em",
          marginBottom: sub ? 8 : 0,
        }}
      >
        {title}
      </div>

      {sub ? (
        <div
          style={{
            color: "rgba(227,247,242,0.70)",
            lineHeight: 1.6,
            fontSize: 14,
          }}
        >
          {sub}
        </div>
      ) : null}
    </div>
  );
}

export default function GoingNowDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);
  const [joinBusy, setJoinBusy] = useState(false);
  const [leaveBusy, setLeaveBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [copied, setCopied] = useState(false);
  const [showFullMedia, setShowFullMedia] = useState(false);
  const [readMore, setReadMore] = useState(false);
  const [tick, setTick] = useState(Date.now());

  const loadItem = useCallback(async (goingNowId) => {
    const { data, error } = await supabase
      .from("going_now_overview")
      .select("*")
      .eq("id", goingNowId)
      .single();

    if (error) {
      console.error("load item error:", error);
      return null;
    }

    setItem(data || null);
    return data || null;
  }, []);

  const loadParticipants = useCallback(async (goingNowId, ownerId = null) => {
    const { data, error } = await supabase
      .from("going_now_participants")
      .select(`
        id,
        user_id,
        joined_at,
        status,
        profiles (
          full_name,
          username,
          avatar_url,
          is_verified
        )
      `)
      .eq("going_now_id", goingNowId)
      .eq("status", "joined")
      .order("joined_at", { ascending: true });

    if (error) {
      console.error("load participants error:", error);
      return [];
    }

    const resolvedOwnerId = ownerId || null;
    const sorted = [...(data || [])].sort((a, b) => {
      if (resolvedOwnerId) {
        if (a.user_id === resolvedOwnerId) return -1;
        if (b.user_id === resolvedOwnerId) return 1;
      }
      return new Date(a.joined_at) - new Date(b.joined_at);
    });

    setParticipants(sorted);
    return sorted;
  }, []);

  const refreshAll = useCallback(async () => {
    setErrorMsg("");

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    setUser(authUser || null);

    const itemData = await loadItem(id);

    if (!itemData) {
      setItem(null);
      setParticipants([]);
      return;
    }

    await loadParticipants(id, itemData.user_id);
  }, [id, loadItem, loadParticipants]);

  useEffect(() => {
    let mounted = true;

    async function loadPage() {
      setLoading(true);
      await refreshAll();
      if (!mounted) return;
      setLoading(false);
    }

    loadPage();

    return () => {
      mounted = false;
    };
  }, [refreshAll]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick(Date.now());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!id) return;

    const itemChannel = supabase
      .channel(`going-now-details-item-${id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "going_now",
          filter: `id=eq.${id}`,
        },
        async () => {
          const fresh = await loadItem(id);
          await loadParticipants(id, fresh?.user_id);
        }
      )
      .subscribe();

    const participantChannel = supabase
      .channel(`going-now-details-participants-${id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "going_now_participants",
          filter: `going_now_id=eq.${id}`,
        },
        async () => {
          const fresh = await loadItem(id);
          await loadParticipants(id, fresh?.user_id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(itemChannel);
      supabase.removeChannel(participantChannel);
    };
  }, [id, loadItem, loadParticipants]);

  const isOwner = useMemo(() => {
    return !!user?.id && !!item?.user_id && user.id === item.user_id;
  }, [user, item]);

  const hasJoined = useMemo(() => {
    return !!user?.id && participants.some((p) => p.user_id === user.id);
  }, [participants, user]);

  const creatorProfile = useMemo(() => {
    const ownerParticipant = participants.find((p) => p.user_id === item?.user_id);
    return ownerParticipant?.profiles || null;
  }, [participants, item]);

  const creatorName = useMemo(() => {
    return getDisplayName(creatorProfile, item?.user_id);
  }, [creatorProfile, item]);

  const creatorUsername = useMemo(() => {
    return creatorProfile?.username?.trim() || "";
  }, [creatorProfile]);

  const creatorAvatar = useMemo(() => {
    return creatorProfile?.avatar_url || FALLBACK_AVATAR;
  }, [creatorProfile]);

  const creatorVerified = useMemo(() => {
    return !!creatorProfile?.is_verified;
  }, [creatorProfile]);

  const statusMeta = useMemo(() => getStatusMeta(item), [item, tick]);
  const difficultyMeta = useMemo(
    () => getDifficultyMeta(item?.difficulty),
    [item?.difficulty]
  );

  const relativeTimeLabel = useMemo(
    () => getRelativeTimeLabel(item?.starts_at, item?.expires_at, item?.status),
    [item, tick]
  );

  const timeLeftLabel = useMemo(
    () => getTimeLeftLabel(item?.expires_at),
    [item?.expires_at, tick]
  );

  const canJoin = useMemo(() => {
    if (!item) return false;
    if (!user?.id) return true;
    if (hasJoined) return false;
    if (item.status === "cancelled" || item.status === "ended" || item.status === "full")
      return false;

    if (item.expires_at && new Date(item.expires_at).getTime() <= Date.now()) {
      return false;
    }

    return true;
  }, [item, user, hasJoined]);

  const isEnded = useMemo(() => {
    if (!item) return false;
    if (item.status === "cancelled" || item.status === "ended") return true;
    if (item.expires_at && new Date(item.expires_at).getTime() <= Date.now()) return true;
    return false;
  }, [item, tick]);

  const openProfile = useCallback(
    (userId) => {
      if (!userId) return;
      navigate(`/profile/${userId}`);
    },
    [navigate]
  );

  const handleJoin = async () => {
    if (!user?.id) {
      navigate("/login");
      return;
    }

    if (!item?.id || joinBusy || hasJoined || isEnded) return;

    try {
      setJoinBusy(true);
      setErrorMsg("");

      const { error } = await supabase.from("going_now_participants").insert({
        going_now_id: item.id,
        user_id: user.id,
        status: "joined",
        joined_at: new Date().toISOString(),
      });

      if (error) {
        console.error("join error:", error);
        setErrorMsg(error.message || "Could not join this live plan.");
        return;
      }

      const fresh = await loadItem(item.id);
      await loadParticipants(item.id, fresh?.user_id);
    } finally {
      setJoinBusy(false);
    }
  };

  const handleLeave = async () => {
    if (!user?.id || !item?.id || leaveBusy || !hasJoined) return;

    try {
      setLeaveBusy(true);
      setErrorMsg("");

      const { error } = await supabase
        .from("going_now_participants")
        .delete()
        .eq("going_now_id", item.id)
        .eq("user_id", user.id);

      if (error) {
        console.error("leave error:", error);
        setErrorMsg(error.message || "Could not leave this live plan.");
        return;
      }

      const fresh = await loadItem(item.id);
      await loadParticipants(item.id, fresh?.user_id);
    } finally {
      setLeaveBusy(false);
    }
  };

  const handleShare = async () => {
    try {
      const url = `${window.location.origin}/going-now/${id}`;

      if (navigator.share) {
        await navigator.share({
          title: item?.title || "Going now",
          text: item?.description || "Join this live plan",
          url,
        });
        return;
      }

      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (err) {
      console.error("share error:", err);
    }
  };

  const openChat = () => {
    if (!user?.id) {
      navigate("/login");
      return;
    }
    navigate(`/going-now/${id}/chat`);
  };

  const descriptionText = item?.description?.trim() || "";
  const longDescription = descriptionText.length > 220;
  const shownDescription =
    !longDescription || readMore
      ? descriptionText
      : `${descriptionText.slice(0, 220).trim()}...`;

  if (loading) {
    return (
      <PageShell>
        <div style={{ ...glassCard, padding: 24, fontSize: 18, fontWeight: 900 }}>
          Loading live plan...
        </div>
      </PageShell>
    );
  }

  if (!item) {
    return (
      <PageShell>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
          <button onClick={() => navigate(-1)} style={backBtn}>
            ← Back
          </button>
        </div>

        <div style={{ ...glassCard, padding: 24 }}>
          <SectionTitle
            eyebrow="Going now"
            title="This live plan was not found"
            sub="It may have been removed, expired, or never existed."
          />
          <button onClick={() => navigate("/going-now")} style={primaryBtn}>
            Explore Going Now
          </button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <MediaFullscreen
        open={showFullMedia}
        item={item}
        onClose={() => setShowFullMedia(false)}
      />

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
        <button onClick={() => navigate(-1)} style={backBtn}>
          ← Back
        </button>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="button" onClick={handleShare} style={ghostBtn}>
            {copied ? "Copied link" : "Share"}
          </button>

          {isOwner ? (
            <button
              type="button"
              onClick={() => navigate(`/going-now/${id}/edit`)}
              style={ghostBtn}
            >
              Edit
            </button>
          ) : null}
        </div>
      </div>

      <div style={heroWrapStyle}>
        <div style={{ position: "relative", minHeight: 440 }}>
          <HeroMedia item={item} onOpen={() => setShowFullMedia(true)} />

          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to top, rgba(4,10,14,0.98) 6%, rgba(4,10,14,0.82) 28%, rgba(4,10,14,0.42) 56%, rgba(4,10,14,0.18) 100%)",
            }}
          />

          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(circle at 78% 18%, rgba(103,232,249,0.22), transparent 18%), radial-gradient(circle at 20% 24%, rgba(167,243,208,0.18), transparent 18%), radial-gradient(circle at 46% 16%, rgba(255,214,125,0.08), transparent 18%)",
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
              gap: 12,
              flexWrap: "wrap",
              alignItems: "flex-start",
            }}
          >
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <div style={heroBadgeStyle}>⚡ Going now</div>
              {item?.media_type === "video" ? (
                <div style={heroGhostBadge}>🎬 Video cover</div>
              ) : (
                <div style={heroGhostBadge}>🖼️ Image cover</div>
              )}
            </div>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 14px",
                borderRadius: 999,
                fontWeight: 900,
                ...statusMeta.pill,
              }}
            >
              {statusMeta.label}
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 18,
              right: 18,
              bottom: 18,
            }}
          >
            <div style={{ maxWidth: 920 }}>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  marginBottom: 12,
                }}
              >
                {item?.category ? (
                  <span style={chipStyle}>
                    {getCategoryEmoji(item.category)} {item.category}
                  </span>
                ) : null}

                {item?.vibe ? (
                  <span style={chipStyle}>
                    {getVibeEmoji(item.vibe)} {item.vibe}
                  </span>
                ) : null}

                <span
                  style={{
                    ...chipStyle,
                    background: difficultyMeta.bg,
                    border: difficultyMeta.border,
                    color: difficultyMeta.color,
                  }}
                >
                  🧭 {difficultyMeta.label}
                </span>
              </div>

              <div
                style={{
                  color: "#fff",
                  fontWeight: 950,
                  fontSize: "clamp(30px, 6vw, 58px)",
                  lineHeight: 0.94,
                  letterSpacing: "-0.055em",
                  marginBottom: 12,
                  textShadow: "0 18px 34px rgba(0,0,0,0.36)",
                }}
              >
                {item?.title || "Live plan"}
              </div>

              <div
                style={{
                  color: "rgba(235,250,245,0.88)",
                  lineHeight: 1.65,
                  fontWeight: 650,
                  fontSize: 15.5,
                  maxWidth: 760,
                  marginBottom: 16,
                }}
              >
                {relativeTimeLabel} · {timeLeftLabel}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  marginBottom: 16,
                }}
              >
                <HeroMiniStat label="Location" value={item?.location_text || "Soon"} />
                <HeroMiniStat
                  label="Going"
                  value={`${participants.length}${item?.spots_total ? ` / ${item.spots_total}` : ""}`}
                />
                <HeroMiniStat
                  label="Starts"
                  value={formatTimeOnly(item?.starts_at) || "Soon"}
                />
                <HeroMiniStat
                  label="Ends"
                  value={formatTimeOnly(item?.expires_at) || "Open"}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 12,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                {!hasJoined ? (
                  <button
                    type="button"
                    onClick={handleJoin}
                    disabled={!canJoin || joinBusy}
                    style={{
                      ...primaryBtn,
                      cursor: !canJoin || joinBusy ? "not-allowed" : "pointer",
                      opacity: !canJoin || joinBusy ? 0.7 : 1,
                    }}
                  >
                    {joinBusy ? "Joining..." : !user?.id ? "Login to join" : "Join now"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleLeave}
                    disabled={leaveBusy}
                    style={{
                      ...secondaryDangerBtn,
                      cursor: leaveBusy ? "not-allowed" : "pointer",
                      opacity: leaveBusy ? 0.7 : 1,
                    }}
                  >
                    {leaveBusy ? "Leaving..." : "Leave plan"}
                  </button>
                )}

                <button type="button" onClick={openChat} style={ghostBrightBtn}>
                  Open live chat
                </button>

                <button
                  type="button"
                  onClick={() => setShowFullMedia(true)}
                  style={ghostBtn}
                >
                  View media
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {errorMsg ? <div style={errorStyle}>{errorMsg}</div> : null}

      <div style={{ height: 16 }} />

      <div className="going-details-grid" style={detailsGridStyle}>
        <div>
          <div style={{ ...glassCard, padding: 18, marginBottom: 16 }}>
            <SectionTitle
              eyebrow="Live summary"
              title="What this plan looks like right now"
              sub="Fast context before people decide to join."
            />

            <div className="going-quick-grid" style={quickGridStyle}>
              <InfoCard
                icon="📍"
                label="Location"
                value={item?.location_text || "Location coming soon"}
              />
              <InfoCard
                icon="👥"
                label="People going"
                value={`${participants.length}${item?.spots_total ? ` / ${item.spots_total}` : ""}`}
              />
              <InfoCard
                icon="⏰"
                label="Starts"
                value={formatDateTime(item?.starts_at)}
              />
              <InfoCard
                icon="⌛"
                label="Ends"
                value={formatDateTime(item?.expires_at)}
              />
              <InfoCard
                icon="✨"
                label="Vibe"
                value={item?.vibe || "Open vibe"}
              />
              <InfoCard
                icon="🧭"
                label="Difficulty"
                value={difficultyMeta.label}
              />
            </div>
          </div>

          <div style={{ ...glassCard, padding: 18, marginBottom: 16 }}>
            <SectionTitle
              eyebrow="Description"
              title="What the creator says"
              sub="Keep it clear, fast, and easy to trust."
            />

            {descriptionText ? (
              <>
                <div
                  style={{
                    color: "rgba(239,251,247,0.86)",
                    lineHeight: 1.8,
                    fontSize: 15.5,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {shownDescription}
                </div>

                {longDescription ? (
                  <button
                    type="button"
                    onClick={() => setReadMore((v) => !v)}
                    style={{
                      marginTop: 14,
                      background: "transparent",
                      border: "none",
                      color: "#9cf4ea",
                      fontWeight: 900,
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    {readMore ? "Show less" : "Read more"}
                  </button>
                ) : null}
              </>
            ) : (
              <div style={emptyTextStyle}>
                No description yet. The title and timing still make this discoverable.
              </div>
            )}
          </div>

          <div style={{ ...glassCard, padding: 18 }}>
            <SectionTitle
              eyebrow="People going"
              title="Who already joined"
              sub="Social proof matters. Let people see energy before they commit."
            />

            {participants.length > 0 ? (
              <>
                <ParticipantStack
                  participants={participants}
                  onOpenProfile={openProfile}
                />

                <div
                  style={{
                    display: "grid",
                    gap: 10,
                    marginTop: 18,
                  }}
                >
                  {participants.map((p) => {
                    const name = getDisplayName(p?.profiles, p?.user_id);
                    const username = p?.profiles?.username?.trim();
                    const isCreator = p.user_id === item?.user_id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => openProfile(p.user_id)}
                        style={participantRowStyle}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <img
                            src={p?.profiles?.avatar_url || FALLBACK_AVATAR}
                            alt={name}
                            style={participantAvatarStyle}
                          />

                          <div style={{ textAlign: "left", minWidth: 0 }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                flexWrap: "wrap",
                              }}
                            >
                              <span
                                style={{
                                  color: "#f4fffb",
                                  fontWeight: 900,
                                  fontSize: 15,
                                }}
                              >
                                {name}
                              </span>

                              {p?.profiles?.is_verified ? (
                                <span style={verifiedBadgeStyle}>Verified</span>
                              ) : null}

                              {isCreator ? (
                                <span style={creatorBadgeStyle}>Creator</span>
                              ) : null}
                            </div>

                            <div
                              style={{
                                color: "rgba(227,247,242,0.64)",
                                fontSize: 13,
                                marginTop: 3,
                              }}
                            >
                              {username ? `@${username}` : "Explorer"} · Joined{" "}
                              {formatCompactDate(p.joined_at)}
                            </div>
                          </div>
                        </div>

                        <span style={participantArrowStyle}>›</span>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <div style={emptyTextStyle}>
                No participants shown yet. Be the first one to join this live plan.
              </div>
            )}
          </div>
        </div>

        <div>
          <div style={{ ...glassCard, padding: 18, marginBottom: 16 }}>
            <SectionTitle
              eyebrow="Creator"
              title="Who created this live plan"
              sub="Trust starts with seeing the person behind the activity."
            />

            <button
              type="button"
              onClick={() => openProfile(item?.user_id)}
              style={creatorCardStyle}
            >
              <img
                src={creatorAvatar}
                alt={creatorName}
                style={{
                  width: 74,
                  height: 74,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2px solid rgba(255,255,255,0.12)",
                  boxShadow: "0 12px 30px rgba(0,0,0,0.24)",
                  background: "#0d1715",
                  flexShrink: 0,
                }}
              />

              <div style={{ minWidth: 0, textAlign: "left", flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    flexWrap: "wrap",
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{
                      color: "#f4fffb",
                      fontWeight: 950,
                      fontSize: 20,
                      lineHeight: 1.1,
                    }}
                  >
                    {creatorName}
                  </span>

                  {creatorVerified ? (
                    <span style={verifiedBadgeStyle}>Verified</span>
                  ) : null}
                </div>

                <div
                  style={{
                    color: "rgba(227,247,242,0.68)",
                    fontSize: 14,
                    marginBottom: 10,
                  }}
                >
                  {creatorUsername ? `@${creatorUsername}` : "Explorer profile"}
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <span style={chipStyle}>⚡ Created this live plan</span>
                  <span style={chipStyle}>👥 {participants.length} people joined</span>
                </div>
              </div>

              <span style={participantArrowStyle}>›</span>
            </button>
          </div>

          <div style={{ ...glassCard, padding: 18, marginBottom: 16 }}>
            <SectionTitle
              eyebrow="Actions"
              title="What you can do next"
              sub="Fast actions make this page feel alive."
            />

            <div style={{ display: "grid", gap: 10 }}>
              {!hasJoined ? (
                <button
                  type="button"
                  onClick={handleJoin}
                  disabled={!canJoin || joinBusy}
                  style={{
                    ...primaryBtn,
                    width: "100%",
                    justifyContent: "center",
                    opacity: !canJoin || joinBusy ? 0.7 : 1,
                    cursor: !canJoin || joinBusy ? "not-allowed" : "pointer",
                  }}
                >
                  {joinBusy ? "Joining..." : !user?.id ? "Login to join" : "Join now"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleLeave}
                  disabled={leaveBusy}
                  style={{
                    ...secondaryDangerBtn,
                    width: "100%",
                    justifyContent: "center",
                    opacity: leaveBusy ? 0.7 : 1,
                    cursor: leaveBusy ? "not-allowed" : "pointer",
                  }}
                >
                  {leaveBusy ? "Leaving..." : "Leave plan"}
                </button>
              )}

              <button
                type="button"
                onClick={openChat}
                style={{ ...ghostBrightBtn, width: "100%", justifyContent: "center" }}
              >
                Open live chat
              </button>

              <button
                type="button"
                onClick={handleShare}
                style={{ ...ghostBtn, width: "100%", justifyContent: "center" }}
              >
                {copied ? "Copied link" : "Share this plan"}
              </button>

              <button
                type="button"
                onClick={() => setShowFullMedia(true)}
                style={{ ...ghostBtn, width: "100%", justifyContent: "center" }}
              >
                Open cover media
              </button>
            </div>
          </div>

          <div style={{ ...glassCard, padding: 18 }}>
            <SectionTitle
              eyebrow="Live timing"
              title="Time status"
              sub="Useful at a glance on mobile too."
            />

            <div style={{ display: "grid", gap: 10 }}>
              <TimingPill icon="🔥" text={relativeTimeLabel} />
              <TimingPill icon="⌛" text={timeLeftLabel} />
              <TimingPill
                icon="🗓️"
                text={`Starts ${formatDateTime(item?.starts_at)}`}
              />
              <TimingPill
                icon="🏁"
                text={`Ends ${formatDateTime(item?.expires_at)}`}
              />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .going-details-grid {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 16px;
        }

        .going-quick-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        @media (max-width: 980px) {
          .going-details-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .going-quick-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </PageShell>
  );
}

/* ================= SMALL COMPONENTS ================= */

function InfoCard({ icon, label, value }) {
  return (
    <div
      style={{
        padding: 14,
        borderRadius: 18,
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: "rgba(227,247,242,0.60)",
          fontWeight: 900,
          marginBottom: 8,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        {icon} {label}
      </div>
      <div
        style={{
          color: "#f4fffb",
          fontWeight: 850,
          fontSize: 15,
          lineHeight: 1.45,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function TimingPill({ icon, text }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "12px 14px",
        borderRadius: 16,
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.08)",
        color: "#effffb",
        fontWeight: 800,
      }}
    >
      <span>{icon}</span>
      <span>{text}</span>
    </div>
  );
}

/* ================= BASE UI ================= */

function PageShell({ children }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(17,40,35,0.9), rgba(5,9,12,1) 38%), linear-gradient(180deg, #061116 0%, #08151b 100%)",
        padding: "18px 14px 40px",
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>{children}</div>
    </div>
  );
}

/* ================= STYLES ================= */

const glassCard = {
  background: "rgba(255,255,255,0.055)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 28,
  boxShadow: "0 20px 50px rgba(0,0,0,0.16)",
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
};

const heroWrapStyle = {
  ...glassCard,
  overflow: "hidden",
};

const heroBadgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 14px",
  borderRadius: 999,
  background:
    "linear-gradient(135deg, rgba(167,243,208,0.96), rgba(103,232,249,0.96), rgba(96,165,250,0.96))",
  color: "#06242d",
  fontWeight: 950,
  fontSize: 13,
  boxShadow: "0 16px 34px rgba(103,232,249,0.18)",
};

const heroGhostBadge = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 14px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#f4fffb",
  fontWeight: 850,
  fontSize: 13,
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
};

const detailsGridStyle = {
  display: "grid",
  gridTemplateColumns: "1.2fr 0.8fr",
  gap: 16,
};

const quickGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 12,
};

const chipStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "9px 12px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#f3fffc",
  fontWeight: 800,
  fontSize: 13,
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
};

const backBtn = {
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.06)",
  color: "#f4fffb",
  fontWeight: 900,
  padding: "12px 16px",
  borderRadius: 16,
  cursor: "pointer",
};

const primaryBtn = {
  display: "inline-flex",
  alignItems: "center",
  gap: 10,
  padding: "14px 18px",
  borderRadius: 16,
  border: "none",
  background: "linear-gradient(135deg, #a7f3d0 0%, #67e8f9 50%, #60a5fa 100%)",
  color: "#06252e",
  fontWeight: 950,
  fontSize: 15,
  boxShadow: "0 18px 38px rgba(103,232,249,0.20)",
  cursor: "pointer",
};

const ghostBtn = {
  display: "inline-flex",
  alignItems: "center",
  gap: 10,
  padding: "14px 18px",
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.06)",
  color: "#effffb",
  fontWeight: 900,
  fontSize: 15,
  cursor: "pointer",
};

const ghostBrightBtn = {
  display: "inline-flex",
  alignItems: "center",
  gap: 10,
  padding: "14px 18px",
  borderRadius: 16,
  border: "1px solid rgba(103,232,249,0.16)",
  background:
    "linear-gradient(135deg, rgba(167,243,208,0.12), rgba(103,232,249,0.12), rgba(96,165,250,0.12))",
  color: "#effffb",
  fontWeight: 900,
  fontSize: 15,
  cursor: "pointer",
};

const secondaryDangerBtn = {
  display: "inline-flex",
  alignItems: "center",
  gap: 10,
  padding: "14px 18px",
  borderRadius: 16,
  border: "1px solid rgba(255,120,120,0.16)",
  background: "rgba(255,120,120,0.08)",
  color: "#ffdede",
  fontWeight: 900,
  fontSize: 15,
  cursor: "pointer",
};

const errorStyle = {
  marginTop: 14,
  marginBottom: 14,
  padding: "14px 16px",
  borderRadius: 16,
  background: "rgba(255,90,90,0.10)",
  border: "1px solid rgba(255,90,90,0.18)",
  color: "#ffd7d7",
  fontWeight: 800,
};

const emptyTextStyle = {
  color: "rgba(227,247,242,0.66)",
  lineHeight: 1.7,
  fontSize: 15,
};

const participantRowStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  width: "100%",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)",
  padding: "12px 14px",
  borderRadius: 18,
  cursor: "pointer",
};

const participantAvatarStyle = {
  width: 48,
  height: 48,
  borderRadius: "50%",
  objectFit: "cover",
  background: "#0d1715",
  border: "1px solid rgba(255,255,255,0.08)",
};

const participantArrowStyle = {
  color: "rgba(227,247,242,0.62)",
  fontSize: 26,
  lineHeight: 1,
};

const creatorCardStyle = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  gap: 14,
  borderRadius: 22,
  padding: 14,
  background:
    "linear-gradient(135deg, rgba(167,243,208,0.08), rgba(103,232,249,0.08), rgba(96,165,250,0.08))",
  border: "1px solid rgba(103,232,249,0.14)",
  cursor: "pointer",
};

const verifiedBadgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  padding: "6px 10px",
  borderRadius: 999,
  background: "rgba(103,232,249,0.14)",
  border: "1px solid rgba(103,232,249,0.24)",
  color: "#dffcff",
  fontWeight: 900,
  fontSize: 12,
};

const creatorBadgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  padding: "6px 10px",
  borderRadius: 999,
  background: "rgba(167,243,208,0.14)",
  border: "1px solid rgba(167,243,208,0.24)",
  color: "#d7fff1",
  fontWeight: 900,
  fontSize: 12,
};