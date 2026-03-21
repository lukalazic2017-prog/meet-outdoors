import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";

const FALLBACK_IMAGE =
  "https://images.pexels.com/photos/1761279/pexels-photo-1761279.jpeg";
const FALLBACK_AVATAR = "https://i.pravatar.cc/150?img=12";

export default function GoingNowDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);
  const [joinBusy, setJoinBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const cardStyle = {
    borderRadius: 22,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.09)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
  };

  const formatDateTime = (value) => {
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
  };

  const formatJoinedTime = (value) => {
    if (!value) return "Just joined";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "Just joined";

    return d.toLocaleString(undefined, {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDisplayName = (p) =>
    p?.profiles?.full_name?.trim() || `Explorer ${String(p.user_id).slice(0, 6)}`;

  const refreshParticipants = async (goingNowId) => {
    const { data, error } = await supabase
      .from("going_now_participants")
      .select(`
        id,
        user_id,
        joined_at,
        status,
        profiles (
          full_name,
          avatar_url
        )
      `)
      .eq("going_now_id", goingNowId)
      .eq("status", "joined")
      .order("joined_at", { ascending: true });

    if (error) {
      console.error("refresh participants error:", error);
      return;
    }

    setParticipants(data || []);
  };

  const refreshItem = async (goingNowId) => {
    const { data, error } = await supabase
      .from("going_now_overview")
      .select("*")
      .eq("id", goingNowId)
      .single();

    if (error) {
      console.error("refresh item error:", error);
      return;
    }

    setItem(data || null);
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

      const { data: participantsData, error: participantsError } = await supabase
        .from("going_now_participants")
        .select(`
          id,
          user_id,
          joined_at,
          status,
          profiles (
            full_name,
            avatar_url
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
      setParticipants(participantsData || []);
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
          await refreshParticipants(id);
          await refreshItem(id);
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
          await refreshItem(id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(participantsChannel);
      supabase.removeChannel(goingNowChannel);
    };
  }, [id]);

  const isOwner = useMemo(() => {
    return !!user?.id && !!item?.user_id && user.id === item.user_id;
  }, [user, item]);

  const isJoined = useMemo(() => {
    if (!user?.id) return false;
    return participants.some((p) => p.user_id === user.id);
  }, [participants, user]);

  const joinedCount = participants.length;
  const spotsTotal = item?.spots_total || 0;
  const spotsLeft = Math.max(spotsTotal - joinedCount, 0);
  const expired = item?.expires_at ? new Date(item.expires_at).getTime() <= Date.now() : false;
  const isFull = joinedCount >= spotsTotal && spotsTotal > 0;

  const activeStatus = useMemo(() => {
    if (!item) return "loading";
    if (item.status === "cancelled") return "cancelled";
    if (expired) return "ended";
    if (isFull) return "full";
    return "active";
  }, [item, expired, isFull]);

  const startsSoon = (() => {
    if (!item?.starts_at) return false;
    const diff = new Date(item.starts_at).getTime() - Date.now();
    return diff > 0 && diff <= 1000 * 60 * 90;
  })();

  const canJoin = !!user?.id && !isOwner && !isJoined && !isFull && activeStatus === "active";
  const canLeave = !!user?.id && isJoined && !joinBusy;

  const handleJoin = async () => {
    if (!user?.id) {
      navigate("/login");
      return;
    }
    if (!item?.id || joinBusy || !canJoin) return;

    try {
      setJoinBusy(true);
      setErrorMsg("");

      const { error } = await supabase.from("going_now_participants").insert({
        going_now_id: item.id,
        user_id: user.id,
        status: "joined",
      });

      if (error) {
        console.error(error);
        setErrorMsg(error.message || "Could not join.");
        return;
      }

      await refreshParticipants(item.id);
      await refreshItem(item.id);
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

      await refreshParticipants(item.id);
      await refreshItem(item.id);
    } finally {
      setJoinBusy(false);
    }
  };

  const openChat = () => {
    navigate(`/going-now/${id}/chat`);
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#020807", color: "#fff", padding: "32px 20px" }}>
        <div style={{ maxWidth: 980, margin: "0 auto" }}>
          <div style={{ ...cardStyle, padding: 24, fontSize: 18, fontWeight: 800 }}>
            Loading live plan...
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div style={{ minHeight: "100vh", background: "#020807", color: "#fff", padding: "32px 20px" }}>
        <div style={{ maxWidth: 980, margin: "0 auto" }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              marginBottom: 20,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.05)",
              color: "#fff",
              borderRadius: 999,
              padding: "10px 14px",
              cursor: "pointer",
              fontWeight: 800,
            }}
          >
            ← Back
          </button>

          <div style={{ ...cardStyle, padding: 28 }}>
            <h1 style={{ fontSize: 34, margin: "0 0 10px" }}>Plan not found</h1>
            <p style={{ color: "rgba(255,255,255,0.72)", margin: 0 }}>
              This going now plan does not exist or is no longer available.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, rgba(0,255,186,0.08), transparent 22%), linear-gradient(to bottom, rgba(2,8,7,0.94), rgba(2,8,7,0.99))",
        color: "#fff",
        padding: "24px 16px 90px",
      }}
    >
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            marginBottom: 18,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(255,255,255,0.05)",
            color: "#fff",
            borderRadius: 999,
            padding: "10px 14px",
            cursor: "pointer",
            fontWeight: 800,
            backdropFilter: "blur(8px)",
          }}
        >
          ← Back
        </button>

        <div
          style={{
            overflow: "hidden",
            borderRadius: 30,
            border: "1px solid rgba(255,255,255,0.10)",
            background:
              "linear-gradient(155deg, rgba(9,15,14,0.88), rgba(4,10,9,0.98))",
            boxShadow:
              "0 24px 60px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          <div style={{ position: "relative", height: 320 }}>
            <img
              src={FALLBACK_IMAGE}
              alt={item.title || "Going now"}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: "saturate(1.05) contrast(1.02)",
              }}
            />

            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(to top, rgba(2,8,7,0.98), rgba(2,8,7,0.24) 48%, rgba(2,8,7,0.10))",
              }}
            />

            <div
              style={{
                position: "absolute",
                left: 22,
                right: 22,
                top: 18,
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  borderRadius: 999,
                  background: "rgba(0,255,186,0.92)",
                  color: "#03261d",
                  fontWeight: 900,
                  fontSize: 12,
                  boxShadow: "0 0 18px rgba(0,255,186,0.24)",
                }}
              >
                🔥 Going now
              </div>

              {startsSoon && activeStatus === "active" ? (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "8px 12px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.10)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "#fff",
                    fontWeight: 800,
                    fontSize: 12,
                    backdropFilter: "blur(8px)",
                  }}
                >
                  Starting soon
                </div>
              ) : null}

              {activeStatus === "full" ? (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "8px 12px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.10)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "#fff",
                    fontWeight: 800,
                    fontSize: 12,
                  }}
                >
                  Full
                </div>
              ) : null}

              {activeStatus === "ended" ? (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "8px 12px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.10)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "#fff",
                    fontWeight: 800,
                    fontSize: 12,
                  }}
                >
                  Ended
                </div>
              ) : null}

              {activeStatus === "cancelled" ? (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "8px 12px",
                    borderRadius: 999,
                    background: "rgba(255,90,90,0.12)",
                    border: "1px solid rgba(255,90,90,0.22)",
                    color: "#ffd0d0",
                    fontWeight: 800,
                    fontSize: 12,
                  }}
                >
                  Cancelled
                </div>
              ) : null}
            </div>

            <div
              style={{
                position: "absolute",
                left: 22,
                right: 22,
                bottom: 22,
              }}
            >
              <h1
                style={{
                  margin: 0,
                  fontSize: 48,
                  lineHeight: 0.96,
                  fontWeight: 950,
                  letterSpacing: "-0.04em",
                  maxWidth: 700,
                  textShadow: "0 10px 30px rgba(0,0,0,0.35)",
                }}
              >
                {item.title || "Untitled plan"}
              </h1>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 10,
                  marginTop: 14,
                }}
              >
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "9px 12px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    backdropFilter: "blur(8px)",
                    fontWeight: 800,
                  }}
                >
                  📍 {item.location_text || "Location soon"}
                </div>

                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "9px 12px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    backdropFilter: "blur(8px)",
                    fontWeight: 800,
                  }}
                >
                  ⏰ {formatDateTime(item.starts_at)}
                </div>
              </div>
            </div>
          </div>

          <div style={{ padding: 22 }}>
            <div
              className="going-now-details-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "1.2fr 0.8fr",
                gap: 18,
              }}
            >
              <div style={{ display: "grid", gap: 18 }}>
                <div style={{ ...cardStyle, padding: 18 }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        padding: 14,
                        borderRadius: 18,
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.07)",
                      }}
                    >
                      <div style={{ fontSize: 12, opacity: 0.68, marginBottom: 6, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                        Spots
                      </div>
                      <div style={{ fontWeight: 900, fontSize: 20 }}>
                        {joinedCount}/{spotsTotal}
                      </div>
                      <div style={{ fontSize: 13, opacity: 0.72, marginTop: 3 }}>
                        people going
                      </div>
                    </div>

                    <div
                      style={{
                        padding: 14,
                        borderRadius: 18,
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.07)",
                      }}
                    >
                      <div style={{ fontSize: 12, opacity: 0.68, marginBottom: 6, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                        Spots left
                      </div>
                      <div style={{ fontWeight: 900, fontSize: 20 }}>{spotsLeft}</div>
                      <div style={{ fontSize: 13, opacity: 0.72, marginTop: 3 }}>
                        open right now
                      </div>
                    </div>

                    <div
                      style={{
                        padding: 14,
                        borderRadius: 18,
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.07)",
                      }}
                    >
                      <div style={{ fontSize: 12, opacity: 0.68, marginBottom: 6, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                        Vibe
                      </div>
                      <div style={{ fontWeight: 900, fontSize: 20 }}>
                        {item.vibe || item.difficulty || "Social"}
                      </div>
                      <div style={{ fontSize: 13, opacity: 0.72, marginTop: 3 }}>
                        how this feels
                      </div>
                    </div>
                  </div>
                </div>

                {item.description ? (
                  <div style={{ ...cardStyle, padding: 18 }}>
                    <div
                      style={{
                        fontSize: 13,
                        opacity: 0.72,
                        marginBottom: 10,
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: "0.10em",
                      }}
                    >
                      About this plan
                    </div>

                    <div
                      style={{
                        color: "rgba(238,250,245,0.92)",
                        lineHeight: 1.65,
                        fontSize: 16,
                        fontWeight: 600,
                      }}
                    >
                      {item.description}
                    </div>
                  </div>
                ) : null}

                <div style={{ ...cardStyle, padding: 18 }}>
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
                    <div style={{ fontSize: 22, fontWeight: 950, letterSpacing: "-0.02em" }}>
                      Going ({joinedCount})
                    </div>

                    {joinedCount > 0 ? (
                      <div style={{ display: "flex", alignItems: "center" }}>
                        {participants.slice(0, 5).map((p, index) => (
                          <img
                            key={p.id}
                            src={p.profiles?.avatar_url || FALLBACK_AVATAR}
                            alt={getDisplayName(p)}
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: "50%",
                              objectFit: "cover",
                              border: "2px solid #07100f",
                              marginLeft: index === 0 ? 0 : -10,
                              boxShadow: "0 6px 16px rgba(0,0,0,0.25)",
                              background: "#0d1715",
                            }}
                          />
                        ))}
                      </div>
                    ) : null}
                  </div>

                  {participants.length === 0 ? (
                    <div
                      style={{
                        padding: 16,
                        borderRadius: 16,
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        color: "rgba(255,255,255,0.72)",
                        fontWeight: 600,
                      }}
                    >
                      Nobody joined yet. Be the first one in.
                    </div>
                  ) : (
                    <div style={{ display: "grid", gap: 10 }}>
                      {participants.map((p) => (
                        <div
                          key={p.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 12,
                            padding: 12,
                            borderRadius: 16,
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.06)",
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
                              style={{
                                width: 46,
                                height: 46,
                                borderRadius: "50%",
                                objectFit: "cover",
                                border: "2px solid rgba(255,255,255,0.08)",
                                background: "#0c1513",
                              }}
                            />

                            <div style={{ minWidth: 0 }}>
                              <div
                                style={{
                                  fontWeight: 900,
                                  fontSize: 15,
                                  color: "#f2fffb",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {getDisplayName(p)}
                              </div>

                              <div
                                style={{
                                  fontSize: 12,
                                  color: "rgba(255,255,255,0.66)",
                                  marginTop: 3,
                                  fontWeight: 600,
                                }}
                              >
                                Joined {formatJoinedTime(p.joined_at)}
                              </div>
                            </div>
                          </div>

                          {user?.id === p.user_id ? (
                            <div
                              style={{
                                padding: "7px 10px",
                                borderRadius: 999,
                                background: "rgba(0,255,186,0.12)",
                                border: "1px solid rgba(0,255,186,0.24)",
                                color: "#baffea",
                                fontWeight: 900,
                                fontSize: 11,
                                whiteSpace: "nowrap",
                              }}
                            >
                              You
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: "grid", gap: 18 }}>
                <div
                  style={{
                    ...cardStyle,
                    padding: 18,
                    position: "sticky",
                    top: 96,
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      opacity: 0.72,
                      marginBottom: 10,
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.10em",
                    }}
                  >
                    Join this plan
                  </div>

                  <div
                    style={{
                      fontSize: 28,
                      lineHeight: 1,
                      fontWeight: 950,
                      letterSpacing: "-0.04em",
                      marginBottom: 8,
                    }}
                  >
                    {!user?.id
                      ? "Login to join"
                      : isOwner
                      ? "You started this"
                      : isJoined
                      ? "You're in"
                      : activeStatus === "ended"
                      ? "Plan ended"
                      : activeStatus === "cancelled"
                      ? "Plan cancelled"
                      : activeStatus === "full"
                      ? "Plan is full"
                      : "Jump in now"}
                  </div>

                  <div
                    style={{
                      color: "rgba(255,255,255,0.72)",
                      lineHeight: 1.55,
                      marginBottom: 16,
                      fontWeight: 600,
                    }}
                  >
                    Fast plan, real people, zero overthinking. If the vibe feels right,
                    join and move.
                  </div>

                  {!user?.id ? (
                    <button
                      type="button"
                      onClick={() => navigate("/login")}
                      style={{
                        width: "100%",
                        border: "none",
                        borderRadius: 18,
                        padding: "15px 18px",
                        background: "linear-gradient(135deg, #00ffba, #00d694 50%, #00a871 100%)",
                        color: "#03271d",
                        fontWeight: 900,
                        fontSize: 15,
                        cursor: "pointer",
                        marginBottom: 12,
                        boxShadow: "0 16px 34px rgba(0,255,186,0.16)",
                      }}
                    >
                      Login to join
                    </button>
                  ) : isOwner ? (
                    <div
                      style={{
                        padding: "14px 16px",
                        borderRadius: 18,
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.10)",
                        fontWeight: 800,
                        marginBottom: 12,
                      }}
                    >
                      You started this plan.
                    </div>
                  ) : isJoined ? (
                    <>
                      <button
                        type="button"
                        onClick={openChat}
                        style={{
                          width: "100%",
                          border: "none",
                          borderRadius: 18,
                          padding: "15px 18px",
                          background: "linear-gradient(135deg, #00ffba, #00d694 50%, #00a871 100%)",
                          color: "#03271d",
                          fontWeight: 900,
                          fontSize: 15,
                          cursor: "pointer",
                          marginBottom: 10,
                          boxShadow: "0 16px 34px rgba(0,255,186,0.16)",
                        }}
                      >
                        Open chat
                      </button>

                      <button
                        type="button"
                        onClick={handleLeave}
                        disabled={joinBusy}
                        style={{
                          width: "100%",
                          border: "none",
                          borderRadius: 18,
                          padding: "15px 18px",
                          background: "rgba(255,255,255,0.10)",
                          color: "#fff",
                          fontWeight: 900,
                          fontSize: 15,
                          cursor: "pointer",
                          marginBottom: 12,
                        }}
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
                        width: "100%",
                        border: "none",
                        borderRadius: 18,
                        padding: "15px 18px",
                        background: canJoin
                          ? "linear-gradient(135deg, #00ffba, #00d694 50%, #00a871 100%)"
                          : "rgba(255,255,255,0.10)",
                        color: canJoin ? "#03271d" : "rgba(255,255,255,0.58)",
                        fontWeight: 900,
                        fontSize: 15,
                        cursor: canJoin ? "pointer" : "not-allowed",
                        marginBottom: 12,
                        boxShadow: canJoin ? "0 16px 34px rgba(0,255,186,0.16)" : "none",
                      }}
                    >
                      {activeStatus === "ended"
                        ? "Ended"
                        : activeStatus === "cancelled"
                        ? "Cancelled"
                        : activeStatus === "full"
                        ? "Full"
                        : joinBusy
                        ? "Joining..."
                        : "Join now"}
                    </button>
                  )}

                  <div style={{ display: "grid", gap: 10 }}>
                    <div
                      style={{
                        padding: "12px 14px",
                        borderRadius: 16,
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        fontWeight: 700,
                      }}
                    >
                      👥 {joinedCount} going now
                    </div>

                    <div
                      style={{
                        padding: "12px 14px",
                        borderRadius: 16,
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        fontWeight: 700,
                      }}
                    >
                      🪑 {spotsLeft} spots left
                    </div>

                    <div
                      style={{
                        padding: "12px 14px",
                        borderRadius: 16,
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        fontWeight: 700,
                      }}
                    >
                      📍 {item.location_text || "Location soon"}
                    </div>
                  </div>

                  {errorMsg ? (
                    <div
                      style={{
                        marginTop: 14,
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
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .going-now-details-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}