
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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

function RoomHeroMedia({ item }) {
  const fallback =
    item?.media_url ||
    item?.image_url ||
    item?.cover_image ||
    FALLBACK_IMAGE;

  if (item?.media_url && item?.media_type === "video") {
    return (
      <video
        src={item.media_url}
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
          filter: "saturate(1.06) contrast(1.04) brightness(0.85)",
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
        filter: "saturate(1.06) contrast(1.04) brightness(0.85)",
      }}
    />
  );
}

export default function GoingNowChat() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [user, setUser] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const listRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = useCallback((smooth = true) => {
    if (!listRef.current) return;

    listRef.current.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: smooth ? "smooth" : "auto",
    });
  }, []);

  const openProfile = useCallback(
    (userId) => {
      if (!userId) return;
      navigate(`/profile/${userId}`);
    },
    [navigate]
  );

  const getDisplayName = useCallback(
    (obj) =>
      obj?.profiles?.full_name?.trim() ||
      obj?.profiles?.username?.trim() ||
      `Explorer ${String(obj?.user_id || "").slice(0, 6)}`,
    []
  );

  const loadParticipants = useCallback(
    async (goingNowId, ownerId = null) => {
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
        console.error("participants load error:", error);
        return [];
      }

      const resolvedOwnerId = ownerId || item?.user_id || null;
      const sorted = [...(data || [])].sort((a, b) => {
        if (resolvedOwnerId) {
          if (a.user_id === resolvedOwnerId) return -1;
          if (b.user_id === resolvedOwnerId) return 1;
        }
        return new Date(a.joined_at) - new Date(b.joined_at);
      });

      setParticipants(sorted);
      return sorted;
    },
    [item]
  );

  const loadMessages = useCallback(
    async (goingNowId) => {
      const { data, error } = await supabase
        .from("going_now_messages")
        .select(`
          id,
          going_now_id,
          user_id,
          text,
          created_at,
          profiles (
            full_name,
            username,
            avatar_url,
            is_verified
          )
        `)
        .eq("going_now_id", goingNowId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("messages load error:", error);
        return;
      }

      setMessages(data || []);
      setTimeout(() => scrollToBottom(false), 50);
    },
    [scrollToBottom]
  );

  const loadItem = useCallback(async (goingNowId) => {
    const { data, error } = await supabase
      .from("going_now_overview")
      .select("*")
      .eq("id", goingNowId)
      .single();

    if (error) {
      console.error("chat item refresh error:", error);
      return null;
    }

    setItem(data || null);
    return data || null;
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadPage() {
      setLoading(true);
      setErrorMsg("");
      setAccessDenied(false);

      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!mounted) return;

      if (!authUser) {
        setUser(null);
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      setUser(authUser);

      const itemData = await loadItem(id);

      if (!itemData) {
        setErrorMsg("Could not load this chat.");
        setLoading(false);
        return;
      }

      const participantRows = await loadParticipants(id, itemData.user_id);

      const isOwner = authUser.id === itemData.user_id;
      const isJoined = participantRows.some((p) => p.user_id === authUser.id);

      if (!isOwner && !isJoined) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      await loadMessages(id);

      if (!mounted) return;
      setLoading(false);
    }

    loadPage();

    return () => {
      mounted = false;
    };
  }, [id, loadItem, loadMessages, loadParticipants]);

  useEffect(() => {
    if (!id || accessDenied) return;

    const msgChannel = supabase
      .channel(`going-now-chat-${id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "going_now_messages",
          filter: `going_now_id=eq.${id}`,
        },
        async () => {
          await loadMessages(id);
        }
      )
      .subscribe();

    const participantChannel = supabase
      .channel(`going-now-chat-participants-${id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "going_now_participants",
          filter: `going_now_id=eq.${id}`,
        },
        async () => {
          const refreshedItem = await loadItem(id);
          await loadParticipants(id, refreshedItem?.user_id);
        }
      )
      .subscribe();

    const itemChannel = supabase
      .channel(`going-now-chat-item-${id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "going_now",
          filter: `id=eq.${id}`,
        },
        async () => {
          const refreshedItem = await loadItem(id);
          await loadParticipants(id, refreshedItem?.user_id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(participantChannel);
      supabase.removeChannel(itemChannel);
    };
  }, [id, accessDenied, loadMessages, loadParticipants, loadItem]);

  const canSend = useMemo(() => {
    return !!user?.id && text.trim().length > 0 && !sending && !accessDenied;
  }, [user, text, sending, accessDenied]);

  const isOwner = useMemo(() => {
    return !!user?.id && !!item?.user_id && user.id === item.user_id;
  }, [user, item]);

  const statusMeta = useMemo(() => getStatusMeta(item), [item]);

  const sendMessage = async () => {
    const clean = text.trim();
    if (!user?.id || !clean || sending) return;

    try {
      setSending(true);
      setErrorMsg("");

      const { error } = await supabase.from("going_now_messages").insert({
        going_now_id: id,
        user_id: user.id,
        text: clean,
      });

      if (error) {
        console.error("send message error:", error);
        setErrorMsg(error.message || "Could not send message.");
        return;
      }

      setText("");
      if (textareaRef.current) textareaRef.current.style.height = "58px";
      setTimeout(() => scrollToBottom(), 80);
    } finally {
      setSending(false);
    }
  };

  const autoResize = (el) => {
    if (!el) return;
    el.style.height = "58px";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  };

  if (loading) {
    return (
      <PageShell>
        <div style={{ ...glassCard, padding: 24, fontWeight: 900, fontSize: 18 }}>
          Loading chat...
        </div>
      </PageShell>
    );
  }

  if (accessDenied) {
    return (
      <PageShell>
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

          <div style={topMiniPill}>🔒 Private access</div>
        </div>

        <div style={{ ...glassPanel, padding: 24 }}>
          <div style={eyebrowStyle}>💬 Group chat</div>

          <h1 style={titleStyle}>Chat locked</h1>

          <p style={mutedText}>
            You need to be logged in and joined to this plan to enter the group chat.
          </p>

          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              marginTop: 18,
            }}
          >
            {!user?.id ? (
              <button onClick={() => navigate("/login")} style={primaryBtn}>
                Login
              </button>
            ) : (
              <button
                onClick={() => navigate(`/going-now/${id}`)}
                style={ghostBtn}
              >
                Back to details
              </button>
            )}
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
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
        <button onClick={() => navigate(`/going-now/${id}`)} style={backBtn}>
          ← Back
        </button>

        <div style={topMiniPill}>💬 Live group chat</div>
      </div>

      <div style={roomHeroStyle}>
        <div style={{ position: "relative", minHeight: 290 }}>
          <RoomHeroMedia item={item} />

          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to top, rgba(4,10,14,0.98) 10%, rgba(4,10,14,0.78) 36%, rgba(4,10,14,0.26) 62%, rgba(4,10,14,0.12) 100%)",
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
              top: 18,
              left: 18,
              right: 18,
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <div style={heroLiveBadge}>💬 Chat room</div>
              {item?.media_type === "video" ? (
                <div style={topMiniPill}>🎬 Video plan</div>
              ) : null}
            </div>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 14px",
                borderRadius: 999,
                fontWeight: 850,
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
            <div style={{ maxWidth: 760 }}>
              <div style={eyebrowOverlayStyle}>💬 Live conversation</div>

              <div
                style={{
                  fontSize: "clamp(30px, 6vw, 54px)",
                  lineHeight: 0.95,
                  fontWeight: 950,
                  letterSpacing: "-0.055em",
                  color: "#fff",
                  marginBottom: 10,
                  textShadow: "0 16px 34px rgba(0,0,0,0.34)",
                }}
              >
                {item?.title || "Going now chat"}
              </div>

              <div
                style={{
                  color: "rgba(238,250,245,0.84)",
                  lineHeight: 1.6,
                  fontWeight: 650,
                  fontSize: 15.5,
                  marginBottom: 14,
                  maxWidth: 680,
                }}
              >
                Chat with people who actually joined. Fast coordination, real energy, no dead forum feel.
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <HeroMiniStat label="Members" value={`${participants.length}`} />
                <HeroMiniStat label="Messages" value={`${messages.length}`} />
                <HeroMiniStat label="Status" value={statusMeta.label} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ height: 16 }} />

      <div className="going-chat-layout" style={chatLayoutStyle}>
        <div className="going-chat-main">
          <div style={chatShellStyle}>
            <div style={chatTopStripStyle}>
              <div style={{ minWidth: 0 }}>
                <div style={miniLabel}>Room context</div>
                <div
                  style={{
                    color: "#f2fffd",
                    fontWeight: 900,
                    fontSize: 18,
                    lineHeight: 1.1,
                    marginBottom: 8,
                  }}
                >
                  {item?.title || "Live room"}
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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
                  <span style={chipStyle}>📍 {item?.location_text || "Location soon"}</span>
                  <span style={chipStyle}>⏰ {formatDateTime(item?.starts_at)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate(`/going-now/${id}`)}
                style={headerGhostBtn}
              >
                View plan
              </button>
            </div>

            <div ref={listRef} style={messagesWrapStyle}>
              {messages.length === 0 ? (
                <div style={emptyWrapStyle}>
                  <div style={emptyIconStyle}>💬</div>
                  <div style={emptyTitleStyle}>No messages yet</div>
                  <div style={emptyTextStyle}>
                    Kick things off. Ask where people are, when they are arriving, or drop the vibe.
                  </div>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const mine = user?.id === msg.user_id;
                  const prev = messages[index - 1];
                  const next = messages[index + 1];
                  const showAvatar = !prev || prev.user_id !== msg.user_id;
                  const compactBottom = next && next.user_id === msg.user_id;
                  const isCreator = msg.user_id === item?.user_id;
                  const isVerified = !!msg?.profiles?.is_verified;

                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: "flex",
                        justifyContent: mine ? "flex-end" : "flex-start",
                        marginTop: showAvatar ? 8 : 2,
                        marginBottom: compactBottom ? 2 : 8,
                      }}
                    >
                      <div
                        style={{
                          maxWidth: "84%",
                          display: "flex",
                          gap: 10,
                          flexDirection: mine ? "row-reverse" : "row",
                          alignItems: "flex-end",
                        }}
                      >
                        <div
                          style={{
                            width: 38,
                            display: "flex",
                            alignItems: "flex-end",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          {showAvatar ? (
                            <img
                              src={msg.profiles?.avatar_url || FALLBACK_AVATAR}
                              alt={getDisplayName(msg)}
                              onClick={() => openProfile(msg.user_id)}
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: "50%",
                                objectFit: "cover",
                                background: "#0d1715",
                                border: "1px solid rgba(255,255,255,0.08)",
                                boxShadow: "0 8px 18px rgba(0,0,0,0.18)",
                                cursor: "pointer",
                              }}
                            />
                          ) : null}
                        </div>

                        <div
                          style={{
                            padding: "12px 14px",
                            borderRadius: mine
                              ? "20px 20px 8px 20px"
                              : "20px 20px 20px 8px",
                            background: mine
                              ? "linear-gradient(135deg, #a7f3d0 0%, #67e8f9 50%, #60a5fa 100%)"
                              : isCreator
                              ? "linear-gradient(135deg, rgba(167,243,208,0.16), rgba(103,232,249,0.16), rgba(96,165,250,0.16))"
                              : "rgba(255,255,255,0.06)",
                            color: mine ? "#06232c" : "#f4fffb",
                            border: mine
                              ? "none"
                              : isCreator
                              ? "1px solid rgba(103,232,249,0.22)"
                              : "1px solid rgba(255,255,255,0.08)",
                            boxShadow: mine
                              ? "0 14px 30px rgba(103,232,249,0.16)"
                              : "0 10px 24px rgba(0,0,0,0.08)",
                            minWidth: 0,
                            backdropFilter: mine ? "none" : "blur(10px)",
                            WebkitBackdropFilter: mine ? "none" : "blur(10px)",
                          }}
                        >
                          {showAvatar ? (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                flexWrap: "wrap",
                                marginBottom: 6,
                              }}
                            >
                              <button
                                type="button"
                                onClick={() => openProfile(msg.user_id)}
                                style={{
                                  border: "none",
                                  background: "transparent",
                                  padding: 0,
                                  margin: 0,
                                  cursor: "pointer",
                                  fontSize: 12,
                                  fontWeight: 900,
                                  opacity: mine ? 0.92 : 0.9,
                                  color: mine ? "#06232c" : "#effffd",
                                }}
                              >
                                {mine ? "You" : getDisplayName(msg)}
                              </button>

                              {isCreator ? (
                                <span
                                  style={{
                                    fontSize: 10,
                                    padding: "2px 8px",
                                    borderRadius: 999,
                                    background: mine
                                      ? "rgba(6,35,44,0.14)"
                                      : "linear-gradient(135deg,#00ffc3,#00b4ff)",
                                    color: mine ? "#06232c" : "#00211a",
                                    fontWeight: 900,
                                  }}
                                >
                                  CREATOR
                                </span>
                              ) : null}

                              {isVerified ? (
                                <span
                                  style={{
                                    fontSize: 10,
                                    padding: "2px 8px",
                                    borderRadius: 999,
                                    background: "rgba(255,255,255,0.12)",
                                    color: mine ? "#06232c" : "#e7fbff",
                                    fontWeight: 900,
                                    border: "1px solid rgba(255,255,255,0.16)",
                                  }}
                                >
                                  VERIFIED
                                </span>
                              ) : null}
                            </div>
                          ) : null}

                          <div
                            style={{
                              fontSize: 15,
                              lineHeight: 1.58,
                              fontWeight: 600,
                              whiteSpace: "pre-wrap",
                              wordBreak: "break-word",
                            }}
                          >
                            {msg.text}
                          </div>

                          <div
                            style={{
                              fontSize: 11,
                              marginTop: 8,
                              opacity: mine ? 0.76 : 0.62,
                              fontWeight: 700,
                            }}
                          >
                            {formatTimeOnly(msg.created_at)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div style={composerWrapStyle}>
              {errorMsg ? <div style={errorStyle}>{errorMsg}</div> : null}

              <div className="going-chat-composer">
                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    autoResize(e.target);
                  }}
                  placeholder="Write a message..."
                  rows={2}
                  style={composerTextareaStyle}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (canSend) sendMessage();
                    }
                  }}
                />

                <button
                  type="button"
                  onClick={sendMessage}
                  disabled={!canSend}
                  style={{
                    ...sendBtnStyle,
                    background: canSend
                      ? "linear-gradient(135deg, #a7f3d0 0%, #67e8f9 50%, #60a5fa 100%)"
                      : "rgba(255,255,255,0.10)",
                    color: canSend ? "#06232c" : "rgba(255,255,255,0.58)",
                    cursor: canSend ? "pointer" : "not-allowed",
                    boxShadow: canSend
                      ? "0 14px 34px rgba(103,232,249,0.16)"
                      : "none",
                  }}
                >
                  {sending ? "Sending..." : "Send"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="going-chat-side">
          <div style={sidePanelStyle}>
            <div style={miniLabel}>People in room</div>

            <div
              style={{
                fontSize: 28,
                lineHeight: 1,
                fontWeight: 950,
                letterSpacing: "-0.04em",
                marginBottom: 12,
                color: "#f2fffd",
              }}
            >
              {participants.length} member{participants.length === 1 ? "" : "s"}
            </div>

            {participants.length === 0 ? (
              <div style={sideEmptyStyle}>No members found yet.</div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {participants.map((p) => {
                  const mine = user?.id === p.user_id;
                  const isCreator = p.user_id === item?.user_id;
                  const isVerified = !!p?.profiles?.is_verified;

                  return (
                    <div
                      key={p.id}
                      style={{
                        ...sideMemberCardStyle,
                        border: mine
                          ? "1px solid rgba(103,232,249,0.18)"
                          : isCreator
                          ? "1px solid rgba(103,232,249,0.22)"
                          : "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          minWidth: 0,
                        }}
                      >
                        <img
                          src={p.profiles?.avatar_url || FALLBACK_AVATAR}
                          alt={getDisplayName(p)}
                          onClick={() => openProfile(p.user_id)}
                          style={{
                            width: 42,
                            height: 42,
                            borderRadius: "50%",
                            objectFit: "cover",
                            background: "#0d1715",
                            border: "1px solid rgba(255,255,255,0.08)",
                            cursor: "pointer",
                          }}
                        />

                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
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
                                fontSize: 14,
                                color: "#f2fffd",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {mine ? "You" : getDisplayName(p)}
                            </button>

                            {isCreator ? (
                              <span
                                style={{
                                  fontSize: 10,
                                  padding: "2px 8px",
                                  borderRadius: 999,
                                  background: "linear-gradient(135deg,#00ffc3,#00b4ff)",
                                  color: "#00211a",
                                  fontWeight: 900,
                                }}
                              >
                                CREATOR
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
                            Joined {formatDateTime(p.joined_at)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div
              style={{
                marginTop: 16,
                paddingTop: 16,
                borderTop: "1px solid rgba(255,255,255,0.08)",
                display: "grid",
                gap: 10,
              }}
            >
              <button
                type="button"
                onClick={() => navigate(`/going-now/${id}`)}
                style={sideGhostBtn}
              >
                Open plan details
              </button>

              {isOwner ? (
                <button
                  type="button"
                  onClick={() => navigate(`/going-now/${id}/edit`)}
                  style={sidePrimaryBtn}
                >
                  Edit plan
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .going-chat-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.08fr) minmax(280px, 0.42fr);
          gap: 16px;
          align-items: start;
        }

        .going-chat-composer {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 10px;
          align-items: stretch;
        }

        @media (max-width: 980px) {
          .going-chat-layout {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 720px) {
          .going-chat-composer {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </PageShell>
  );
}

function PageShell({ children }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        marginTop: -120,
        background:
          "radial-gradient(circle at top, rgba(103,232,249,0.16), transparent 18%), radial-gradient(circle at 82% 16%, rgba(167,243,208,0.15), transparent 18%), radial-gradient(circle at 18% 72%, rgba(96,165,250,0.12), transparent 20%), linear-gradient(180deg, #031019 0%, #081b28 40%, #0b2330 100%)",
        color: "#fff",
        padding: "16px 12px 108px",
      }}
    >
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>{children}</div>
    </div>
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
          fontSize: 22,
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

const glassPanel = {
  borderRadius: 30,
  overflow: "hidden",
  border: "1px solid rgba(255,255,255,0.10)",
  background:
    "linear-gradient(160deg, rgba(10,18,20,0.92), rgba(8,16,20,0.98))",
  boxShadow:
    "0 26px 90px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.06)",
};

const glassCard = {
  borderRadius: 24,
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.045))",
  border: "1px solid rgba(157,229,219,0.14)",
  boxShadow:
    "0 20px 55px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.08)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
};

const roomHeroStyle = {
  ...glassPanel,
  overflow: "hidden",
};

const chatShellStyle = {
  ...glassPanel,
  overflow: "hidden",
};

const chatLayoutStyle = {};

const chatTopStripStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 14,
  flexWrap: "wrap",
  padding: 16,
  borderBottom: "1px solid rgba(255,255,255,0.08)",
};

const messagesWrapStyle = {
  height: "58vh",
  overflowY: "auto",
  padding: 18,
  display: "grid",
  gap: 4,
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.015), rgba(255,255,255,0.00))",
};

const composerWrapStyle = {
  borderTop: "1px solid rgba(255,255,255,0.08)",
  padding: 14,
  background: "rgba(0,0,0,0.10)",
};

const composerTextareaStyle = {
  resize: "none",
  borderRadius: 18,
  border: "1px solid rgba(125,211,252,0.14)",
  background: "rgba(255,255,255,0.06)",
  color: "#fff",
  padding: "14px 14px",
  outline: "none",
  fontSize: 15,
  lineHeight: 1.5,
  minHeight: 58,
  maxHeight: 180,
  boxSizing: "border-box",
  width: "100%",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
};

const sendBtnStyle = {
  alignSelf: "stretch",
  minWidth: 116,
  border: "none",
  borderRadius: 18,
  padding: "0 18px",
  fontWeight: 900,
  fontSize: 15,
};

const emptyWrapStyle = {
  minHeight: "100%",
  display: "grid",
  placeItems: "center",
  alignContent: "center",
  textAlign: "center",
  padding: 28,
};

const emptyIconStyle = {
  fontSize: 42,
  marginBottom: 10,
};

const emptyTitleStyle = {
  fontSize: 24,
  fontWeight: 950,
  letterSpacing: "-0.03em",
  color: "#f2fffd",
  marginBottom: 8,
};

const emptyTextStyle = {
  color: "rgba(235,249,255,0.72)",
  lineHeight: 1.65,
  fontWeight: 600,
  maxWidth: 460,
};

const eyebrowStyle = {
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
};

const eyebrowOverlayStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 12px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#effffd",
  fontWeight: 900,
  fontSize: 11,
  marginBottom: 12,
  letterSpacing: "0.03em",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
};

const heroLiveBadge = {
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
};

const primaryBtn = {
  border: "none",
  borderRadius: 18,
  padding: "15px 22px",
  background:
    "linear-gradient(135deg, #a7f3d0 0%, #67e8f9 50%, #60a5fa 100%)",
  color: "#06232c",
  fontWeight: 950,
  fontSize: 15,
  cursor: "pointer",
  boxShadow: "0 18px 40px rgba(103,232,249,0.20)",
};

const ghostBtn = {
  border: "1px solid rgba(125,211,252,0.14)",
  borderRadius: 18,
  padding: "15px 22px",
  background: "rgba(255,255,255,0.06)",
  color: "#effffd",
  fontWeight: 900,
  fontSize: 15,
  cursor: "pointer",
};

const headerGhostBtn = {
  border: "1px solid rgba(125,211,252,0.14)",
  borderRadius: 14,
  padding: "12px 14px",
  background: "rgba(255,255,255,0.06)",
  color: "#effffd",
  fontWeight: 900,
  fontSize: 14,
  cursor: "pointer",
};

const sidePrimaryBtn = {
  width: "100%",
  border: "none",
  borderRadius: 16,
  padding: "14px 16px",
  background:
    "linear-gradient(135deg, #a7f3d0 0%, #67e8f9 50%, #60a5fa 100%)",
  color: "#06232c",
  fontWeight: 950,
  fontSize: 14,
  cursor: "pointer",
  boxShadow: "0 14px 30px rgba(103,232,249,0.18)",
};

const sideGhostBtn = {
  width: "100%",
  border: "1px solid rgba(125,211,252,0.14)",
  borderRadius: 16,
  padding: "14px 16px",
  background: "rgba(255,255,255,0.06)",
  color: "#effffd",
  fontWeight: 900,
  fontSize: 14,
  cursor: "pointer",
};

const backBtn = {
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.05)",
  color: "#fff",
  borderRadius: 999,
  padding: "11px 15px",
  cursor: "pointer",
  fontWeight: 900,
  backdropFilter: "blur(10px)",
  boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
};

const topMiniPill = {
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

const titleStyle = {
  fontSize: 34,
  margin: "0 0 10px",
  lineHeight: 1,
  fontWeight: 950,
  letterSpacing: "-0.04em",
};

const mutedText = {
  color: "rgba(255,255,255,0.72)",
  margin: 0,
  lineHeight: 1.6,
};

const errorStyle = {
  marginBottom: 10,
  color: "#ffb4b4",
  background: "rgba(255,80,80,0.08)",
  border: "1px solid rgba(255,80,80,0.22)",
  padding: 10,
  borderRadius: 12,
  fontWeight: 700,
};

const miniLabel = {
  fontSize: 12,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.10em",
  color: "rgba(225,247,255,0.58)",
  marginBottom: 8,
};

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

const sidePanelStyle = {
  ...glassPanel,
  padding: 16,
  position: "sticky",
  top: 18,
};

const sideEmptyStyle = {
  padding: 14,
  borderRadius: 16,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "rgba(255,255,255,0.72)",
  fontWeight: 650,
};

const sideMemberCardStyle = {
  padding: 10,
  borderRadius: 16,
  background: "rgba(255,255,255,0.05)",
};
