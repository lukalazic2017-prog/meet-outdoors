import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function Chat() {
  const { tourId } = useParams();

  const [messages, setMessages] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [tour, setTour] = useState(null);
  const [user, setUser] = useState(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const bottomRef = useRef(null);

  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  }, []);

  const fmtTime = useCallback((d) => {
    try {
      return new Date(d).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  }, []);

  const fetchProfileIfMissing = useCallback(async (userId) => {
    if (!userId) return;

    const { data: p } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .eq("id", userId)
      .maybeSingle();

    if (p?.id) {
      setProfiles((prev) => ({ ...prev, [p.id]: p }));
    }
  }, []);

  const loadTour = useCallback(async () => {
    if (!tourId) {
      setNotFound(true);
      return;
    }

    const { data, error } = await supabase
      .from("tours")
      .select("*")
      .eq("id", tourId)
      .single();

    if (error || !data) {
      console.log("LOAD TOUR ERROR:", error);
      setTour(null);
      setNotFound(true);
      return;
    }

    setTour(data);
    setNotFound(false);
  }, [tourId]);

  const loadMessages = useCallback(async () => {
    if (!tourId) return;

    const { data, error } = await supabase
      .from("tour_messages")
      .select("*")
      .eq("tour_id", tourId)
      .order("created_at", { ascending: true });

    if (error) {
      console.log("LOAD MESSAGES ERROR:", error);
      return;
    }

    const rows = data || [];
    setMessages(rows);

    const ids = [...new Set(rows.map((m) => m.user_id).filter(Boolean))];

    if (ids.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", ids);

      const map = {};
      (profs || []).forEach((p) => {
        map[p.id] = p;
      });

      setProfiles(map);
    } else {
      setProfiles({});
    }

    setTimeout(() => scrollToBottom(false), 50);
  }, [tourId, scrollToBottom]);

  const subscribeToMessages = useCallback(() => {
    if (!tourId) return null;

    const channel = supabase
      .channel(`tour_chat_${tourId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "tour_messages",
          filter: `tour_id=eq.${tourId}`,
        },
        (payload) => {
          const msg = payload?.new;
          if (!msg) return;

          setMessages((prev) => {
            if (prev.some((x) => x.id === msg.id)) return prev;
            return [...prev, msg];
          });

          fetchProfileIfMissing(msg.user_id);
          setTimeout(() => scrollToBottom(true), 30);
        }
      )
      .subscribe();

    return channel;
  }, [tourId, fetchProfileIfMissing, scrollToBottom]);

  useEffect(() => {
    let channel;

    async function init() {
      setLoading(true);

      const { data } = await supabase.auth.getUser();
      const me = data?.user || null;
      setUser(me);

      await loadTour();
      await loadMessages();

      channel = subscribeToMessages();

      setLoading(false);
    }

    init();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [loadTour, loadMessages, subscribeToMessages]);

  async function sendMessage() {
    if (!text.trim() || !user || !tourId || notFound) return;

    const msgText = text.trim();
    setText("");

    const { error } = await supabase.from("tour_messages").insert([
      {
        tour_id: tourId,
        user_id: user.id,
        message: msgText,
      },
    ]);

    if (error) {
      console.log("SEND MESSAGE ERROR:", error);
      setText(msgText);
      return;
    }

    setTimeout(() => scrollToBottom(true), 40);
  }

  const onKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [text, user, tourId, notFound]
  );

  const ui = useMemo(
    () => ({
      page: {
        height: "86vh",
        padding: 16,
        display: "flex",
        flexDirection: "column",
        color: "#ffffff",
        background:
          "radial-gradient(circle at top, #062c22 0%, #02060b 45%, #000 100%)",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      },
      header: {
        padding: "14px 18px",
        borderRadius: 18,
        marginBottom: 14,
        background:
          "linear-gradient(135deg, rgba(0,0,0,0.9), rgba(0,255,160,0.18))",
        border: "1px solid rgba(0,255,160,0.35)",
        boxShadow: "0 20px 40px rgba(0,0,0,0.9)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      },
      list: {
        flex: 1,
        overflowY: "auto",
        padding: "10px 6px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      },
      inputBar: {
        marginTop: 12,
        padding: 12,
        borderRadius: 18,
        background:
          "linear-gradient(135deg, rgba(0,0,0,0.85), rgba(0,255,160,0.18))",
        border: "1px solid rgba(0,255,160,0.35)",
        boxShadow: "0 20px 40px rgba(0,0,0,0.9)",
        display: "flex",
        gap: 10,
        alignItems: "center",
      },
      input: {
        flex: 1,
        padding: "14px 16px",
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,0.2)",
        background: "rgba(0,0,0,0.7)",
        color: "#ffffff",
        fontSize: 14,
        outline: "none",
        resize: "none",
      },
      sendBtn: {
        padding: "14px 22px",
        borderRadius: 999,
        border: "none",
        background:
          "linear-gradient(135deg, #00ffb0 0%, #00d1ff 45%, #ffffff 100%)",
        color: "#022015",
        fontWeight: 900,
        fontSize: 13,
        letterSpacing: "0.08em",
        cursor: "pointer",
        boxShadow: "0 10px 30px rgba(0,255,160,0.4)",
      },
      livePill: {
        fontSize: 12,
        padding: "6px 12px",
        borderRadius: 999,
        background: "rgba(0,255,160,0.15)",
        border: "1px solid rgba(0,255,160,0.5)",
        color: "#baffea",
        fontWeight: 700,
      },
    }),
    []
  );

  if (loading) {
    return <div style={{ padding: 20, color: "white" }}>Loading chat...</div>;
  }

  if (!user) {
    return <div style={{ padding: 20, color: "white" }}>You must be logged in.</div>;
  }

  if (notFound || !tour) {
    return (
      <div style={{ padding: 20, color: "white" }}>
        Invalid chat. Open chat from a tour page.
      </div>
    );
  }

  return (
    <div style={ui.page}>
      <div style={ui.header}>
        <div>
          <div
            style={{
              fontSize: 11,
              letterSpacing: "0.14em",
              opacity: 0.7,
              textTransform: "uppercase",
            }}
          >
            Tour chat
          </div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>💬 {tour.title}</div>
        </div>
        <div style={ui.livePill}>Live</div>
      </div>

      <div style={ui.list}>
        {messages.map((msg) => {
          const p = profiles[msg.user_id];
          const mine = msg.user_id === user.id;
          const creator = msg.user_id === tour.creator_id;

          return (
            <div
              key={msg.id}
              style={{
                display: "flex",
                flexDirection: mine ? "row-reverse" : "row",
                alignItems: "flex-end",
                gap: 10,
              }}
            >
              <img
                src={p?.avatar_url || "https://i.pravatar.cc/150?img=1"}
                alt=""
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: creator
                    ? "3px solid gold"
                    : mine
                    ? "2px solid #00ffb0"
                    : "2px solid rgba(255,255,255,0.25)",
                }}
              />

              <div
                style={{
                  maxWidth: "72%",
                  padding: "12px 16px",
                  borderRadius: 18,
                  background: mine
                    ? "linear-gradient(135deg, rgba(0,255,160,0.35), rgba(0,180,255,0.25))"
                    : "rgba(255,255,255,0.08)",
                  border: creator ? "1px solid gold" : "1px solid rgba(255,255,255,0.12)",
                  boxShadow: "0 12px 30px rgba(0,0,0,0.6)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    marginBottom: 4,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    flexWrap: "wrap",
                  }}
                >
                  {p?.full_name || "Explorer"}
                  {creator && (
                    <span
                      style={{
                        fontSize: 11,
                        padding: "2px 8px",
                        borderRadius: 999,
                        background: "rgba(255,215,0,0.18)",
                        border: "1px solid gold",
                        color: "gold",
                        fontWeight: 800,
                      }}
                    >
                      ORGANIZER
                    </span>
                  )}
                </div>

                <div
                  style={{
                    fontSize: 14,
                    lineHeight: 1.5,
                    opacity: 0.95,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {msg.message}
                </div>

                <div
                  style={{
                    fontSize: 11,
                    opacity: 0.55,
                    marginTop: 6,
                    textAlign: mine ? "right" : "left",
                  }}
                >
                  {fmtTime(msg.created_at)}
                </div>
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      <div style={ui.inputBar}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Write a message..."
          rows={1}
          style={ui.input}
        />

        <button onClick={sendMessage} style={ui.sendBtn}>
          SEND
        </button>
      </div>
    </div>
  );
}