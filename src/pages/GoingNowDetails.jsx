
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";

const FALLBACK_IMAGE =
  "https://images.pexels.com/photos/1761279/pexels-photo-1761279.jpeg";
const FALLBACK_AVATAR = "https://i.pravatar.cc/150?img=12";

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

function formatJoinedTime(value) {
  if (!value) return "Just joined";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Just joined";

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

function getDifficultyEmoji(difficulty) {
  switch ((difficulty || "").toLowerCase()) {
    case "easy":
      return "🟢";
    case "moderate":
      return "🟡";
    case "hard":
      return "🔵";
    default:
      return "🎯";
  }
}

function getStatusMeta(item, expired, isFull) {
  if (!item) {
    return {
      key: "loading",
      label: "Loading",
      pill: {
        background: "rgba(255,255,255,0.10)",
        border: "1px solid rgba(255,255,255,0.12)",
        color: "#fff",
      },
    };
  }

  if (item.status === "cancelled") {
    return {
      key: "cancelled",
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
      key: "ended",
      label: "Ended",
      pill: {
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.12)",
        color: "#eef7fb",
      },
    };
  }

  if (isFull || item.status === "full") {
    return {
      key: "full",
      label: "Full",
      pill: {
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.12)",
        color: "#ffffff",
      },
    };
  }

  return {
    key: "active",
    label: "Live now",
    pill: {
      background:
        "linear-gradient(135deg, rgba(167,243,208,0.94), rgba(103,232,249,0.94), rgba(96,165,250,0.94))",
      border: "1px solid rgba(103,232,249,0.16)",
      color: "#06252e",
    },
  };
}

function getDisplayName(p) {
  return (
    p?.profiles?.full_name?.trim() ||
    p?.profiles?.username?.trim() ||
    `Explorer ${String(p.user_id || "").slice(0, 6)}`
  );
}

function HeroMedia({ item }) {
  const fallback = item?.image_url || item?.cover_image || FALLBACK_IMAGE;
  const mediaUrl = item?.media_url || null;
  const mediaType = item?.media_type || null;

  if (mediaUrl && mediaType === "video") {
    return (
      <video
        src={mediaUrl}
        muted
        playsInline
        loop
        autoPlay
        preload="metadata"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: "saturate(1.08) contrast(1.05) brightness(0.90)",
          display: "block",
        }}
      />
    );
  }

  if (mediaUrl) {
    return (
      <img
        src={mediaUrl}
        alt={item?.title || "Going now"}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: "saturate(1.08) contrast(1.05) brightness(0.90)",
          display: "block",
        }}
      />
    );
  }

  return (
    <img
      src={fallback}
      alt={item?.title || "Going now"}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        filter: "saturate(1.08) contrast(1.05) brightness(0.90)",
        display: "block",
      }}
    />
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
  const [errorMsg, setErrorMsg] = useState("");

  const shellBg =
    "radial-gradient(circle at top, rgba(103,232,249,0.16), transparent 18%), radial-gradient(circle at 82% 16%, rgba(167,243,208,0.15), transparent 18%), radial-gradient(circle at 18% 72%, rgba(96,165,250,0.12), transparent 20%), linear-gradient(180deg, #031019 0%, #081b28 40%, #0b2330 100%)";

  const glassPanel = {
    borderRadius: 28,
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.045))",
    border: "1px solid rgba(157,229,219,0.14)",
    boxShadow:
      "0 20px 55px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.08)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
  };

  const softCard = {
    borderRadius: 20,
    background: "rgba(255,255,255,0.055)",
    border: "1px solid rgba(125,211,252,0.12)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
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

  const labelStyle = {
    fontSize: 12,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    color: "rgba(225,247,255,0.58)",
  };

  const openProfile = (userId) => {
    if (!userId) return;
    navigate(`/profile/${userId}`);
  };

  const sortParticipants = (rows, ownerId) => {
    return [...(rows || [])].sort((a, b) => {
      if (ownerId) {
        if (a.user_id === ownerId) return -1;
        if (b.user_id === ownerId) return 1;
      }
      return new Date(a.joined_at) - new Date(b.joined_at);
    });
  };

  const refreshParticipants = async (goingNowId, ownerId = null) => {
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
      console.error("refresh participants error:", error);
      return;
    }

    setParticipants(sortParticipants(data || [], ownerId || item?.user_id || null));
  };

  const refreshItem = async (goingNowId) => {
    const { data, error } = await supabase
      .from("going_now_overview")
      .select("*")
      .eq("id", goingNowId)
      .single();

    if (error) {
      console.error("refresh item error:", error);
      return null;
    }

    setItem(data || null);
    return data || null;
  };

  useEffect(() => {
    let mounted = true;

    async function loadPage() {
      setLoading(true);
      setErrorMsg("");

      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!mounted) return;
      setUser(authUser || null);

      const { data: itemData, error: itemError } = await supabase
        .from("going_now_overview")
        .select("*")
        .eq("id", id)
        .single();

      if (itemError) {
        console.error("going now details error:", itemError);
        if (mounted) {
          setErrorMsg("Could not load this plan.");
          setLoading(false);
        }
        return;
      }

      const { data: participantsData, error: participantsError } =
        await supabase
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
          .eq("going_now_id", id)
          .eq("status", "joined")
          .order("joined_at", { ascending: true });

      if (participantsError) {
        console.error("participants error:", participantsError);
      }

      if (!mounted) return;

      setItem(itemData || null);
      setParticipants(sortParticipants(participantsData || [], itemData?.user_id || null));
      setLoading(false);
    }

    loadPage();

    return () => {
      mounted = false;
    };
  }, [id]);

  useEffect(() => {
    if (!id) return;

    const participantsChannel = supabase
      .channel(`going-now-participants-${id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "going_now_participants",
          filter: `going_now_id=eq.${id}`,
        },
        async () => {
          const refreshedItem = await refreshItem(id);
          await refreshParticipants(id, refreshedItem?.user_id || null);
        }
      )
      .subscribe();

    const goingNowChannel = supabase
      .channel(`going-now-item-${id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "going_now",
          filter: `id=eq.${id}`,
        },
        async () => {
          const refreshedItem = await refreshItem(id);
          await refreshParticipants(id, refreshedItem?.user_id || null);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(participantsChannel);
      supabase.removeChannel(goingNowChannel);
    };
  }, [id, refreshItem, refreshParticipants]);

  const isOwner = useMemo(() => {
    return !!user?.id && !!item?.user_id && user.id === item.user_id;
  }, [user, item]);

  const isJoined = useMemo(() => {
    if (!user?.id) return false;
    return participants.some((p) => p.user_id === user.id);
  }, [participants, user]);

  const creator = useMemo(() => {
    if (!item?.user_id) return null;
    return participants.find((p) => p.user_id === item.user_id) || null;
  }, [participants, item]);

  const joinedCount = participants.length;
  const spotsTotal = item?.spots_total || 0;
  const spotsLeft = Math.max(spotsTotal - joinedCount, 0);
  const expired = item?.expires_at
    ? new Date(item.expires_at).getTime() <= Date.now()
    : false;
  const isFull = joinedCount >= spotsTotal && spotsTotal > 0;

  const statusMeta = useMemo(() => {
    return getStatusMeta(item, expired, isFull);
  }, [item, expired, isFull]);

  const startsSoon = useMemo(() => {
    if (!item?.starts_at) return false;
    const diff = new Date(item.starts_at).getTime() - Date.now();
    return diff > 0 && diff <= 1000 * 60 * 90;
  }, [item]);

  const canJoin =
    !!user?.id &&
    !isOwner &&
    !isJoined &&
    !isFull &&
    statusMeta.key === "active";

  const handleJoin = async () => {
    if (!user?.id) {
      navigate("/login");
      return;
    }
    if (!item?.id || joinBusy || !canJoin) return;

    try {
      setJoinBusy(true);
      setErrorMsg("");

      const { error } = await supabase
        .from("going_now_participants")
        .upsert(
          {
            going_now_id: item.id,
            user_id: user.id,
            status: "joined",
            joined_at: new Date().toISOString(),
          },
          { onConflict: "going_now_id,user_id" }
        );

      if (error) {
        console.error(error);
        setErrorMsg(error.message || "Could not join.");
        return;
      }

      const refreshedItem = await refreshItem(item.id);
      await refreshParticipants(item.id, refreshedItem?.user_id || null);
    } finally {
      setJoinBusy(false);
    }
  };

  const handleLeave = async () => {
    if (!user?.id || !item?.id || joinBusy || !isJoined) return;

    try {
      setJoinBusy(true);
      setErrorMsg("");

      const { error } = await supabase
        .from("going_now_participants")
        .delete()
        .eq("going_now_id", item.id)
        .eq("user_id", user.id);

      if (error) {
        console.error(error);
        setErrorMsg(error.message || "Could not leave.");
        return;
      }

      const refreshedItem = await refreshItem(item.id);
      await refreshParticipants(item.id, refreshedItem?.user_id || null);
    } finally {
      setJoinBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!isOwner || !item?.id) return;
    const ok = window.confirm("Delete this plan?");
    if (!ok) return;

    try {
      setJoinBusy(true);
      const { error } = await supabase.from("going_now").delete().eq("id", item.id);
      if (error) {
        console.error(error);
        setErrorMsg(error.message || "Could not delete plan.");
        return;
      }
      navigate("/going-now");
    } finally {
      setJoinBusy(false);
    }
  };

  const openChat = () => {
    navigate(`/going-now/${id}/chat`);
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          marginTop: -120,
          background: shellBg,
          color: "#fff",
          padding: "22px 14px 92px",
        }}
      >
        <div style={{ maxWidth: 1220, margin: "0 auto" }}>
          <div
            style={{
              ...glassPanel,
              padding: 24,
              fontSize: 18,
              fontWeight: 900,
            }}
          >
            Loading live plan...
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: shellBg,
          color: "#fff",
          padding: "22px 14px 92px",
        }}
      >
        <div style={{ maxWidth: 1220, margin: "0 auto" }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              marginBottom: 18,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.06)",
              color: "#fff",
              borderRadius: 999,
              padding: "11px 15px",
              cursor: "pointer",
              fontWeight: 900,
              backdropFilter: "blur(10px)",
            }}
          >
            ← Back
          </button>

          <div style={{ ...glassPanel, padding: 28 }}>
            <h1
              style={{
                margin: "0 0 10px",
                fontSize: 34,
                lineHeight: 1,
                fontWeight: 950,
                letterSpacing: "-0.04em",
              }}
            >
              Plan not found
            </h1>
            <p
              style={{
                color: "rgba(255,255,255,0.72)",
                margin: 0,
                fontSize: 15,
              }}
            >
              This going now plan does not exist or is no longer available.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const topActionTitle = !user?.id
    ? "Login to join"
    : isOwner
    ? "You started this"
    : isJoined
    ? "You're in"
    : statusMeta.key === "ended"
    ? "Plan ended"
    : statusMeta.key === "cancelled"
    ? "Plan cancelled"
    : statusMeta.key === "full"
    ? "Plan is full"
    : "Jump in now";

  return (
    <div
      style={{
        minHeight: "100vh",
        color: "#fff",
        marginTop: -120,
        background: shellBg,
        padding: "16px 12px 108px",
      }}
    >
      <div style={{ maxWidth: 1240, margin: "0 auto" }}>
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

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 14px",
              borderRadius: 999,
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              fontWeight: 850,
              ...statusMeta.pill,
            }}
          >
            {statusMeta.key === "active" && "LIVE PLAN"}
            {statusMeta.key === "full" && "FULL"}
            {statusMeta.key === "ended" && "ENDED"}
            {statusMeta.key === "cancelled" && "CANCELLED"}
          </div>
        </div>

        <div
          style={{
            overflow: "hidden",
            borderRadius: 34,
            border: "1px solid rgba(255,255,255,0.09)",
            background:
              "linear-gradient(160deg, rgba(10,18,20,0.92), rgba(8,16,20,0.98))",
            boxShadow:
              "0 26px 90px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          <div
            style={{
              position: "relative",
              minHeight: 580,
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <HeroMedia item={item} />

            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(to top, rgba(4,10,14,0.98) 8%, rgba(4,10,14,0.76) 34%, rgba(4,10,14,0.34) 58%, rgba(4,10,14,0.14) 100%)",
              }}
            />

            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "radial-gradient(circle at 74% 22%, rgba(103,232,249,0.24), transparent 20%), radial-gradient(circle at 26% 26%, rgba(167,243,208,0.18), transparent 18%), radial-gradient(circle at 52% 18%, rgba(255,205,130,0.14), transparent 18%)",
              }}
            />

            <div
              style={{
                position: "absolute",
                left: 18,
                right: 18,
                top: 18,
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 14px",
                    borderRadius: 999,
                    background:
                      "linear-gradient(135deg, #a7f3d0 0%, #67e8f9 50%, #60a5fa 100%)",
                    color: "#06252e",
                    fontWeight: 950,
                    fontSize: 12,
                    letterSpacing: "0.03em",
                    boxShadow: "0 16px 36px rgba(103,232,249,0.28)",
                  }}
                >
                  🔥 Going now
                </div>

                {item.media_type === "video" ? (
                  <div style={miniPill}>🎬 Video preview</div>
                ) : null}

                {startsSoon && statusMeta.key === "active" ? (
                  <div style={miniPill}>⚡ Starting soon</div>
                ) : null}

                {statusMeta.key === "full" ? <div style={miniPill}>Full</div> : null}
                {statusMeta.key === "ended" ? <div style={miniPill}>Ended</div> : null}
              </div>

              {joinedCount > 0 ? (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "8px 10px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                  }}
                >
                  {participants.slice(0, 5).map((p, index) => (
                    <img
                      key={p.id}
                      src={p.profiles?.avatar_url || FALLBACK_AVATAR}
                      alt={getDisplayName(p)}
                      onClick={() => openProfile(p.user_id)}
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "2px solid rgba(7,17,22,0.96)",
                        marginLeft: index === 0 ? 0 : -9,
                        background: "#0b1418",
                        cursor: "pointer",
                      }}
                    />
                  ))}
                  <span
                    style={{
                      marginLeft: 10,
                      fontSize: 12,
                      fontWeight: 850,
                      color: "#f2fffd",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {joinedCount} going
                  </span>
                </div>
              ) : null}
            </div>

            <div
              style={{
                position: "absolute",
                left: 18,
                right: 18,
                bottom: 18,
              }}
            >
              <div style={{ maxWidth: 880 }}>
                {creator ? (
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 12,
                      marginBottom: 14,
                      padding: "10px 14px",
                      borderRadius: 999,
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      width: "fit-content",
                      cursor: "pointer",
                    }}
                    onClick={() => openProfile(creator.user_id)}
                  >
                    <img
                      src={creator.profiles?.avatar_url || FALLBACK_AVATAR}
                      alt={getDisplayName(creator)}
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                    />
                    <div style={{ fontWeight: 900, color: "#f2fffd" }}>
                      {getDisplayName(creator)}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        padding: "2px 8px",
                        borderRadius: 999,
                        background: "linear-gradient(135deg,#00ffc3,#00b4ff)",
                        color: "#00211a",
                        fontWeight: 900,
                      }}
                    >
                      👑 CREATOR
                    </div>
                    {creator.profiles?.is_verified ? (
                      <div
                        style={{
                          fontSize: 10,
                          padding: "2px 8px",
                          borderRadius: 999,
                          background: "rgba(255,255,255,0.12)",
                          color: "#effffd",
                          fontWeight: 900,
                          border: "1px solid rgba(255,255,255,0.16)",
                        }}
                      >
                        VERIFIED
                      </div>
                    ) : null}
                  </div>
                ) : null}

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
                    <span style={chipStyle}>
                      {getDifficultyEmoji(item.difficulty)} {item.difficulty}
                    </span>
                  ) : null}
                </div>

                <h1
                  style={{
                    margin: 0,
                    fontSize: "clamp(38px, 7vw, 74px)",
                    lineHeight: 0.95,
                    fontWeight: 950,
                    letterSpacing: "-0.06em",
                    textShadow: "0 16px 44px rgba(0,0,0,0.42)",
                    maxWidth: 760,
                  }}
                >
                  {item.title || "Untitled plan"}
                </h1>

                <div
                  style={{
                    marginTop: 14,
                    color: "rgba(238,251,255,0.84)",
                    fontSize: "clamp(15px, 2vw, 18px)",
                    fontWeight: 650,
                    lineHeight: 1.55,
                    maxWidth: 720,
                  }}
                >
                  {item.description
                    ? item.description
                    : "Fast plan, real people, natural vibe. Show up if it feels right."}
                </div>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 10,
                    marginTop: 18,
                  }}
                >
                  <div style={miniPill}>📍 {item.location_text || "Location soon"}</div>
                  <div style={miniPill}>⏰ {formatDateTime(item.starts_at)}</div>
                  <div style={miniPill}>
                    👥 {joinedCount}/{spotsTotal || 0}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ padding: 16 }}>
            <div className="going-details-layout">
              <div className="going-main-column">
                <div
                  style={{
                    ...glassPanel,
                    padding: 16,
                    marginBottom: 16,
                  }}
                >
                  <div className="going-stats-grid">
                    <StatCard
                      icon="🔥"
                      label="Going"
                      value={`${joinedCount}/${spotsTotal}`}
                      sub="people in right now"
                    />
                    <StatCard
                      icon="🪑"
                      label="Spots left"
                      value={spotsLeft}
                      sub="available right now"
                    />
                    <StatCard
                      icon="🌿"
                      label="Vibe"
                      value={item.vibe || item.difficulty || "Social"}
                      sub="how this plan feels"
                    />
                  </div>
                </div>

                <div className="mobile-top-cta">
                  <ActionPanel
                    glassPanel={glassPanel}
                    softCard={softCard}
                    item={item}
                    id={id}
                    user={user}
                    isOwner={isOwner}
                    isJoined={isJoined}
                    joinBusy={joinBusy}
                    statusMeta={statusMeta}
                    canJoin={canJoin}
                    topActionTitle={topActionTitle}
                    joinedCount={joinedCount}
                    spotsLeft={spotsLeft}
                    errorMsg={errorMsg}
                    navigate={navigate}
                    handleJoin={handleJoin}
                    handleLeave={handleLeave}
                    handleDelete={handleDelete}
                    openChat={openChat}
                  />
                </div>

                <div
                  style={{
                    ...glassPanel,
                    padding: 16,
                    marginBottom: 16,
                  }}
                >
                  <div style={{ ...labelStyle, marginBottom: 8 }}>About this plan</div>
                  <div
                    style={{
                      color: "rgba(238,251,255,0.90)",
                      lineHeight: 1.72,
                      fontSize: 15.5,
                      fontWeight: 650,
                    }}
                  >
                    {item.description || "No description yet."}
                  </div>
                </div>

                <div
                  style={{
                    ...glassPanel,
                    padding: 16,
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      flexWrap: "wrap",
                      marginBottom: 14,
                    }}
                  >
                    <div>
                      <div style={{ ...labelStyle, marginBottom: 6 }}>People</div>
                      <div
                        style={{
                          fontSize: 28,
                          lineHeight: 1,
                          fontWeight: 950,
                          letterSpacing: "-0.04em",
                        }}
                      >
                        Going now
                      </div>
                    </div>

                    {participants.length > 0 ? (
                      <div style={{ display: "flex", alignItems: "center" }}>
                        {participants.slice(0, 6).map((p, index) => (
                          <img
                            key={p.id}
                            src={p.profiles?.avatar_url || FALLBACK_AVATAR}
                            alt={getDisplayName(p)}
                            onClick={() => openProfile(p.user_id)}
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: "50%",
                              objectFit: "cover",
                              border: "2px solid rgba(7,17,22,0.96)",
                              marginLeft: index === 0 ? 0 : -10,
                              background: "#0c171c",
                              boxShadow: "0 10px 24px rgba(0,0,0,0.22)",
                              cursor: "pointer",
                            }}
                          />
                        ))}
                      </div>
                    ) : null}
                  </div>

                  {participants.length === 0 ? (
                    <div
                      style={{
                        ...softCard,
                        padding: 18,
                        color: "rgba(235,249,255,0.74)",
                        fontWeight: 650,
                      }}
                    >
                      Nobody joined yet. Be the first one in.
                    </div>
                  ) : (
                    <div style={{ display: "grid", gap: 10 }}>
                      {participants.map((p) => {
                        const isCreator = p.user_id === item.user_id;
                        const isVerified = !!p?.profiles?.is_verified;

                        return (
                          <div
                            key={p.id}
                            style={{
                              ...softCard,
                              padding: 12,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 12,
                              border: isCreator
                                ? "1px solid rgba(103,232,249,0.24)"
                                : "1px solid rgba(125,211,252,0.12)",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                minWidth: 0,
                              }}
                            >
                              <img
                                src={p.profiles?.avatar_url || FALLBACK_AVATAR}
                                alt={getDisplayName(p)}
                                onClick={() => openProfile(p.user_id)}
                                style={{
                                  width: 48,
                                  height: 48,
                                  borderRadius: "50%",
                                  objectFit: "cover",
                                  border: "2px solid rgba(255,255,255,0.08)",
                                  background: "#0b1518",
                                  cursor: "pointer",
                                }}
                              />

                              <div style={{ minWidth: 0 }}>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    flexWrap: "wrap",
                                  }}
                                >
                                  <button
                                    type="button"
                                    onClick={() => openProfile(p.user_id)}
                                    style={{
                                      border: "none",
                                      background: "transparent",
                                      padding: 0,
                                      margin: 0,
                                      cursor: "pointer",
                                      fontWeight: 900,
                                      fontSize: 15,
                                      color: "#f2fffd",
                                      whiteSpace: "nowrap",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                    }}
                                  >
                                    {getDisplayName(p)}
                                  </button>

                                  {isCreator ? (
                                    <span
                                      style={{
                                        fontSize: 10,
                                        padding: "2px 8px",
                                        borderRadius: 999,
                                        background:
                                          "linear-gradient(135deg,#00ffc3,#00b4ff)",
                                        color: "#00211a",
                                        fontWeight: 900,
                                      }}
                                    >
                                      👑 CREATOR
                                    </span>
                                  ) : null}

                                  {isVerified ? (
                                    <span
                                      style={{
                                        fontSize: 10,
                                        padding: "2px 8px",
                                        borderRadius: 999,
                                        background: "rgba(255,255,255,0.10)",
                                        color: "#e7fbff",
                                        fontWeight: 900,
                                        border: "1px solid rgba(255,255,255,0.14)",
                                      }}
                                    >
                                      VERIFIED
                                    </span>
                                  ) : null}
                                </div>

                                <div
                                  style={{
                                    fontSize: 12,
                                    color: "rgba(232,247,255,0.64)",
                                    marginTop: 4,
                                    fontWeight: 650,
                                  }}
                                >
                                  Joined {formatJoinedTime(p.joined_at)}
                                </div>
                              </div>
                            </div>

                            {user?.id === p.user_id ? (
                              <div
                                style={{
                                  padding: "8px 10px",
                                  borderRadius: 999,
                                  background: "rgba(103,232,249,0.12)",
                                  border: "1px solid rgba(103,232,249,0.20)",
                                  color: "#d8fbff",
                                  fontWeight: 900,
                                  fontSize: 11,
                                  whiteSpace: "nowrap",
                                }}
                              >
                                You
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div
                  style={{
                    ...glassPanel,
                    padding: 16,
                  }}
                >
                  <div style={{ ...labelStyle, marginBottom: 10 }}>Quick details</div>
                  <div style={{ display: "grid", gap: 10 }}>
                    <InfoRow
                      label="Location"
                      value={item.location_text || "Location soon"}
                    />
                    <InfoRow label="Starts" value={formatDateTime(item.starts_at)} />
                    <InfoRow label="Status" value={statusMeta.label} />
                    <InfoRow label="Capacity" value={`${joinedCount}/${spotsTotal}`} />
                    {item.category ? (
                      <InfoRow label="Category" value={item.category} capitalize />
                    ) : null}
                    {item.vibe ? (
                      <InfoRow label="Vibe" value={item.vibe} capitalize />
                    ) : null}
                    {item.difficulty ? (
                      <InfoRow
                        label="Difficulty"
                        value={item.difficulty}
                        capitalize
                      />
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="going-side-column">
                <div className="desktop-side-cta">
                  <ActionPanel
                    glassPanel={glassPanel}
                    softCard={softCard}
                    item={item}
                    id={id}
                    user={user}
                    isOwner={isOwner}
                    isJoined={isJoined}
                    joinBusy={joinBusy}
                    statusMeta={statusMeta}
                    canJoin={canJoin}
                    topActionTitle={topActionTitle}
                    joinedCount={joinedCount}
                    spotsLeft={spotsLeft}
                    errorMsg={errorMsg}
                    navigate={navigate}
                    handleJoin={handleJoin}
                    handleLeave={handleLeave}
                    handleDelete={handleDelete}
                    openChat={openChat}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .going-details-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.14fr) minmax(320px, 0.86fr);
          gap: 16px;
          align-items: start;
        }

        .going-main-column,
        .going-side-column {
          min-width: 0;
        }

        .going-stats-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }

        .mobile-top-cta {
          display: none;
        }

        .desktop-side-cta {
          display: block;
        }

        @media (max-width: 980px) {
          .going-details-layout {
            grid-template-columns: 1fr;
          }

          .mobile-top-cta {
            display: block;
            margin-bottom: 16px;
          }

          .desktop-side-cta {
            display: none;
          }
        }

        @media (max-width: 720px) {
          .going-stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

function ActionPanel({
  glassPanel,
  softCard,
  item,
  id,
  user,
  isOwner,
  isJoined,
  joinBusy,
  statusMeta,
  canJoin,
  topActionTitle,
  joinedCount,
  spotsLeft,
  errorMsg,
  navigate,
  handleJoin,
  handleLeave,
  handleDelete,
  openChat,
}) {
  return (
    <div
      style={{
        ...glassPanel,
        padding: 18,
        position: "sticky",
        top: 18,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -90,
          right: -80,
          width: 220,
          height: 220,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(103,232,249,0.20), transparent 68%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          bottom: -80,
          left: -60,
          width: 180,
          height: 180,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(167,243,208,0.16), transparent 68%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          fontSize: 12,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          fontWeight: 800,
          color: "rgba(225,247,255,0.58)",
          marginBottom: 10,
        }}
      >
        Join this plan
      </div>

      <div
        style={{
          position: "relative",
          fontSize: 36,
          lineHeight: 0.95,
          fontWeight: 950,
          letterSpacing: "-0.05em",
          marginBottom: 10,
          color: "#f2fffd",
        }}
      >
        {topActionTitle}
      </div>

      <div
        style={{
          position: "relative",
          color: "rgba(235,249,255,0.74)",
          lineHeight: 1.58,
          marginBottom: 18,
          fontWeight: 650,
          fontSize: 15,
        }}
      >
        Fast plan, real people, no overthinking. Join if the vibe feels right and move.
      </div>

      {!user?.id ? (
        <button
          type="button"
          onClick={() => navigate("/login")}
          style={primaryButtonStyle}
        >
          Login to join
        </button>
      ) : isOwner ? (
        <>
          <div
            style={{
              ...softCard,
              padding: "14px 15px",
              fontWeight: 800,
              marginBottom: 10,
              color: "#effffd",
            }}
          >
            You started this plan.
          </div>

          <button
            type="button"
            onClick={() => navigate(`/going-now/${id}/edit`)}
            style={secondaryButtonStyle}
          >
            Edit plan
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={joinBusy}
            style={{
              ...secondaryButtonStyle,
              marginTop: 10,
              border: "1px solid rgba(255,90,90,0.25)",
              color: "#ffd9d9",
            }}
          >
            {joinBusy ? "Working..." : "Delete plan"}
          </button>

          <button
            type="button"
            onClick={openChat}
            style={{ ...primaryButtonStyle, marginTop: 10 }}
          >
            Open chat
          </button>
        </>
      ) : isJoined ? (
        <>
          <button
            type="button"
            onClick={openChat}
            style={primaryButtonStyle}
          >
            Open chat
          </button>

          <button
            type="button"
            onClick={handleLeave}
            disabled={joinBusy}
            style={{ ...secondaryButtonStyle, marginTop: 10 }}
          >
            {joinBusy ? "Leaving..." : "Leave plan"}
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={handleJoin}
          disabled={joinBusy || !canJoin}
          style={{
            ...primaryButtonStyle,
            background: canJoin
              ? "linear-gradient(135deg, #a7f3d0 0%, #67e8f9 50%, #60a5fa 100%)"
              : "rgba(255,255,255,0.10)",
            color: canJoin ? "#06232c" : "rgba(255,255,255,0.58)",
            cursor: canJoin ? "pointer" : "not-allowed",
            boxShadow: canJoin
              ? "0 18px 40px rgba(103,232,249,0.20)"
              : "none",
          }}
        >
          {statusMeta.key === "ended"
            ? "Ended"
            : statusMeta.key === "cancelled"
            ? "Cancelled"
            : statusMeta.key === "full"
            ? "Full"
            : joinBusy
            ? "Joining..."
            : "Join now"}
        </button>
      )}

      <div
        style={{
          marginTop: 14,
          display: "grid",
          gap: 10,
        }}
      >
        <MiniInfo value={`🔥 ${joinedCount} going now`} />
        <MiniInfo value={`🪑 ${spotsLeft} spots left`} />
        <MiniInfo value={`📍 ${item.location_text || "Location soon"}`} />
        <MiniInfo value={`⏰ ${formatDateTime(item.starts_at)}`} />
      </div>

      {errorMsg ? (
        <div
          style={{
            marginTop: 14,
            color: "#ffd0d0",
            background: "rgba(255,80,80,0.08)",
            border: "1px solid rgba(255,80,80,0.20)",
            padding: 12,
            borderRadius: 16,
            fontWeight: 750,
          }}
        >
          {errorMsg}
        </div>
      ) : null}

      <div
        style={{
          marginTop: 16,
          paddingTop: 16,
          borderTop: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <button
          type="button"
          onClick={openChat}
          style={{
            width: "100%",
            border: "1px solid rgba(125,211,252,0.14)",
            borderRadius: 18,
            padding: "14px 16px",
            background: "rgba(255,255,255,0.06)",
            color: "#effffd",
            fontWeight: 850,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          💬 Start a group chat for this plan
        </button>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub }) {
  return (
    <div
      style={{
        borderRadius: 22,
        padding: 16,
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(125,211,252,0.12)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      <div
        style={{
          fontSize: 12,
          opacity: 0.62,
          marginBottom: 10,
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: "0.10em",
          display: "flex",
          alignItems: "center",
          gap: 8,
          color: "rgba(225,247,255,0.78)",
        }}
      >
        <span>{icon}</span>
        <span>{label}</span>
      </div>

      <div
        style={{
          fontWeight: 950,
          fontSize: 26,
          lineHeight: 1,
          letterSpacing: "-0.04em",
          color: "#f2fffd",
          marginBottom: 6,
          textTransform: "capitalize",
        }}
      >
        {value}
      </div>

      <div
        style={{
          fontSize: 13,
          opacity: 0.72,
          fontWeight: 650,
          color: "rgba(230,247,255,0.82)",
        }}
      >
        {sub}
      </div>
    </div>
  );
}

function InfoRow({ label, value, capitalize = false }) {
  return (
    <div
      style={{
        borderRadius: 18,
        padding: "13px 14px",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(125,211,252,0.12)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: "0.10em",
          textTransform: "uppercase",
          color: "rgba(225,247,255,0.56)",
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: 14,
          fontWeight: 800,
          color: "#f2fffd",
          textTransform: capitalize ? "capitalize" : "none",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function MiniInfo({ value }) {
  return (
    <div
      style={{
        padding: "12px 14px",
        borderRadius: 16,
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(125,211,252,0.12)",
        fontWeight: 750,
        color: "rgba(242,255,253,0.94)",
      }}
    >
      {value}
    </div>
  );
}

const chipStyle = {
  display: "inline-flex",
  alignItems: "center",
  padding: "8px 11px",
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

const primaryButtonStyle = {
  width: "100%",
  border: "none",
  borderRadius: 20,
  padding: "16px 18px",
  background:
    "linear-gradient(135deg, #a7f3d0 0%, #67e8f9 50%, #60a5fa 100%)",
  color: "#06232c",
  fontWeight: 950,
  fontSize: 15,
  cursor: "pointer",
  boxShadow: "0 18px 40px rgba(103,232,249,0.20)",
};

const secondaryButtonStyle = {
  width: "100%",
  border: "1px solid rgba(125,211,252,0.14)",
  borderRadius: 20,
  padding: "16px 18px",
  background: "rgba(255,255,255,0.06)",
  color: "#effffd",
  fontWeight: 900,
  fontSize: 15,
  cursor: "pointer",
};
