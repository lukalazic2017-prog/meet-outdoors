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
      <div
        style={{
          minHeight: "100vh",
          background: "#020807",
          color: "#fff",
          padding: 20,
        }}
      >
        <div style={{ maxWidth: 980, margin: "0 auto" }}>Loading chat...</div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#020807",
          color: "#fff",
          padding: 20,
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
            }}
          >
            ← Back
          </button>

          <div
            style={{
              borderRadius: 24,
              padding: 24,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            <h1 style={{ marginTop: 0, fontSize: 34 }}>Chat locked</h1>
            <p style={{ color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>
              You need to be logged in and joined to this plan to enter the
              chat.
            </p>

            {!user?.id ? (
              <button
                onClick={() => navigate("/login")}
                style={{
                  border: "none",
                  borderRadius: 16,
                  padding: "14px 18px",
                  background:
                    "linear-gradient(135deg, #00ffba, #00d694 50%, #00a871 100%)",
                  color: "#03271d",
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                Login
              </button>
            ) : (
              <button
                onClick={() => navigate(`/going-now/${id}`)}
                style={{
                  border: "none",
                  borderRadius: 16,
                  padding: "14px 18px",
                  background: "rgba(255,255,255,0.10)",
                  color: "#fff",
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                Back to details
              </button>
            )}
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
        padding: "20px 14px 90px",
      }}
    >
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <button
          onClick={() => navigate(`/going-now/${id}`)}
          style={{
            marginBottom: 16,
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

        <div
          style={{
            borderRadius: 28,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.10)",
            background:
              "linear-gradient(155deg, rgba(9,15,14,0.88), rgba(4,10,9,0.98))",
            boxShadow:
              "0 24px 60px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          <div
            style={{
              padding: 18,
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "7px 11px",
                  borderRadius: 999,
                  background: "rgba(0,255,186,0.10)",
                  border: "1px solid rgba(0,255,186,0.20)",
                  color: "#baffea",
                  fontWeight: 900,
                  fontSize: 11,
                  marginBottom: 10,
                }}
              >
                💬 Group chat
              </div>

              <div
                style={{
                  fontSize: 30,
                  fontWeight: 950,
                  letterSpacing: "-0.04em",
                }}
              >
                {item?.title || "Going now chat"}
              </div>

              <div
                style={{
                  color: "rgba(255,255,255,0.68)",
                  marginTop: 6,
                  fontWeight: 600,
                }}
              >
                {participants.length} member
                {participants.length === 1 ? "" : "s"}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center" }}>
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
                    border: "2px solid #07100f",
                    marginLeft: index === 0 ? 0 : -10,
                    boxShadow: "0 6px 16px rgba(0,0,0,0.25)",
                    background: "#0d1715",
                  }}
                />
              ))}
            </div>
          </div>

          <div
            ref={listRef}
            style={{
              height: "58vh",
              overflowY: "auto",
              padding: 18,
              display: "grid",
              gap: 12,
            }}
          >
            {messages.length === 0 ? (
              <div
                style={{
                  padding: 18,
                  borderRadius: 18,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.72)",
                  fontWeight: 600,
                }}
              >
                No messages yet. Start the vibe.
              </div>
            ) : (
              messages.map((msg) => {
                const mine = user?.id === msg.user_id;

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
                        maxWidth: "78%",
                        display: "flex",
                        gap: 10,
                        flexDirection: mine ? "row-reverse" : "row",
                        alignItems: "flex-end",
                      }}
                    >
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

                      <div
                        style={{
                          padding: "12px 14px",
                          borderRadius: 18,
                          background: mine
                            ? "linear-gradient(135deg, #00ffba, #00d694 50%, #00a871 100%)"
                            : "rgba(255,255,255,0.06)",
                          color: mine ? "#03271d" : "#f4fffb",
                          border: mine
                            ? "none"
                            : "1px solid rgba(255,255,255,0.08)",
                          boxShadow: mine
                            ? "0 14px 30px rgba(0,255,186,0.14)"
                            : "none",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 900,
                            marginBottom: 6,
                            opacity: mine ? 0.9 : 0.8,
                          }}
                        >
                          {mine ? "You" : getDisplayName(msg)}
                        </div>

                        <div
                          style={{
                            fontSize: 15,
                            lineHeight: 1.55,
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
                            marginTop: 7,
                            opacity: mine ? 0.75 : 0.6,
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

          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.08)",
              padding: 14,
              background: "rgba(0,0,0,0.10)",
            }}
          >
            {errorMsg ? (
              <div
                style={{
                  marginBottom: 10,
                  color: "#ffb4b4",
                  background: "rgba(255,80,80,0.08)",
                  border: "1px solid rgba(255,80,80,0.22)",
                  padding: 10,
                  borderRadius: 12,
                  fontWeight: 700,
                }}
              >
                {errorMsg}
              </div>
            ) : null}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: 10,
              }}
            >
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Write a message..."
                rows={2}
                style={{
                  resize: "none",
                  borderRadius: 16,
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "rgba(255,255,255,0.05)",
                  color: "#fff",
                  padding: "14px 14px",
                  outline: "none",
                  fontSize: 15,
                  lineHeight: 1.5,
                }}
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
                  alignSelf: "stretch",
                  minWidth: 110,
                  border: "none",
                  borderRadius: 16,
                  padding: "0 18px",
                  background: canSend
                    ? "linear-gradient(135deg, #00ffba, #00d694 50%, #00a871 100%)"
                    : "rgba(255,255,255,0.10)",
                  color: canSend ? "#03271d" : "rgba(255,255,255,0.58)",
                  fontWeight: 900,
                  fontSize: 15,
                  cursor: canSend ? "pointer" : "not-allowed",
                }}
              >
                {sending ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}