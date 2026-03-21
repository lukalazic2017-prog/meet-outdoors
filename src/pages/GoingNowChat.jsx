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

  const scrollToBottom = useCallback((smooth = true) => {
    if (!listRef.current) return;

    listRef.current.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: smooth ? "smooth" : "auto",
    });
  }, []);

  const getDisplayName = useCallback(
    (obj) =>
      obj?.profiles?.full_name?.trim() ||
      `Explorer ${String(obj?.user_id || "").slice(0, 6)}`,
    []
  );

  const loadParticipants = useCallback(async (goingNowId) => {
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
      console.error("participants load error:", error);
      return [];
    }

    setParticipants(data || []);
    return data || [];
  }, []);

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
            avatar_url
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

      const { data: itemData, error: itemError } = await supabase
        .from("going_now_overview")
        .select("*")
        .eq("id", id)
        .single();

      if (itemError || !itemData) {
        console.error("chat item error:", itemError);
        setErrorMsg("Could not load this chat.");
        setLoading(false);
        return;
      }

      setItem(itemData);

      const participantRows = await loadParticipants(id);

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
  }, [id, loadMessages, loadParticipants]);

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
          await loadParticipants(id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(participantChannel);
    };
  }, [id, accessDenied, loadMessages, loadParticipants]);

  const canSend = useMemo(() => {
    return !!user?.id && text.trim().length > 0 && !sending && !accessDenied;
  }, [user, text, sending, accessDenied]);

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
      setTimeout(() => scrollToBottom(), 80);
    } finally {
      setSending(false);
    }
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

      <div style={chatShellStyle}>
        <div style={chatHeaderStyle}>
          <div
            style={{
              position: "absolute",
              top: -90,
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
              bottom: -80,
              left: -70,
              width: 200,
              height: 200,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(167,243,208,0.16), transparent 68%)",
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div style={{ maxWidth: 640 }}>
              <div style={eyebrowStyle}>💬 Group chat</div>

              <div
                style={{
                  fontSize: "clamp(28px, 5vw, 42px)",
                  lineHeight: 0.96,
                  fontWeight: 950,
                  letterSpacing: "-0.05em",
                  color: "#fff",
                  marginBottom: 10,
                }}
              >
                {item?.title || "Going now chat"}
              </div>

              <div
                style={{
                  color: "rgba(235,249,255,0.72)",
                  fontWeight: 600,
                  lineHeight: 1.6,
                  marginBottom: 14,
                }}
              >
                Chat with people who joined this plan and keep the vibe moving.
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <HeroMiniStat
                  label="Members"
                  value={`${participants.length}`}
                />
                <HeroMiniStat
                  label="Status"
                  value={item?.status || "active"}
                />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "10px 12px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.10)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                maxWidth: "100%",
              }}
            >
              {participants.slice(0, 6).map((p, index) => (
                <img
                  key={p.id}
                  src={p.profiles?.avatar_url || FALLBACK_AVATAR}
                  alt={getDisplayName(p)}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "2px solid rgba(8,17,22,0.96)",
                    marginLeft: index === 0 ? 0 : -10,
                    boxShadow: "0 6px 16px rgba(0,0,0,0.25)",
                    background: "#0d1715",
                  }}
                />
              ))}
              <span
                style={{
                  marginLeft: 10,
                  color: "#effffd",
                  fontWeight: 850,
                  fontSize: 12,
                  whiteSpace: "nowrap",
                }}
              >
                {participants.length} member{participants.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>
        </div>

        <div style={chatBodyWrap}>
          <div ref={listRef} style={messagesWrapStyle}>
            {messages.length === 0 ? (
              <div style={emptyMessageCard}>
                No messages yet. Start the vibe.
              </div>
            ) : (
              messages.map((msg, index) => {
                const mine = user?.id === msg.user_id;
                const prev = messages[index - 1];
                const showAvatar =
                  !prev || prev.user_id !== msg.user_id;

                return (
                  <div
                    key={msg.id}
                    style={{
                      display: "flex",
                      justifyContent: mine ? "flex-end" : "flex-start",
                    }}
                  >
                    <div
                      style={{
                        maxWidth: "82%",
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
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: "50%",
                              objectFit: "cover",
                              background: "#0d1715",
                              border: "1px solid rgba(255,255,255,0.08)",
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
                            : "rgba(255,255,255,0.06)",
                          color: mine ? "#06232c" : "#f4fffb",
                          border: mine
                            ? "none"
                            : "1px solid rgba(255,255,255,0.08)",
                          boxShadow: mine
                            ? "0 14px 30px rgba(103,232,249,0.16)"
                            : "none",
                          minWidth: 0,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 900,
                            marginBottom: 6,
                            opacity: mine ? 0.92 : 0.8,
                          }}
                        >
                          {mine ? "You" : getDisplayName(msg)}
                        </div>

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
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
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
                value={text}
                onChange={(e) => setText(e.target.value)}
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

      <style>{`
        .going-chat-composer {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 10px;
          align-items: stretch;
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
        background:
          "radial-gradient(circle at top, rgba(103,232,249,0.16), transparent 18%), radial-gradient(circle at 82% 16%, rgba(167,243,208,0.15), transparent 18%), radial-gradient(circle at 18% 72%, rgba(96,165,250,0.12), transparent 20%), linear-gradient(180deg, #031019 0%, #081b28 40%, #0b2330 100%)",
        color: "#fff",
        padding: "16px 12px 108px",
      }}
    >
      <div style={{ maxWidth: 980, margin: "0 auto" }}>{children}</div>
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

const chatShellStyle = glassPanel;

const chatHeaderStyle = {
  position: "relative",
  padding: "20px 18px 18px",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  overflow: "hidden",
};

const chatBodyWrap = {
  display: "grid",
  gridTemplateRows: "1fr auto",
  minHeight: "68vh",
};

const messagesWrapStyle = {
  height: "58vh",
  overflowY: "auto",
  padding: 18,
  display: "grid",
  gap: 12,
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

const emptyMessageCard = {
  padding: 18,
  borderRadius: 18,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "rgba(255,255,255,0.72)",
  fontWeight: 600,
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