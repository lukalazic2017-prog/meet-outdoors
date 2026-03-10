import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function Chat() {
  const { tourId } = useParams();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [tour, setTour] = useState(null);
  const [user, setUser] = useState(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const listRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = useCallback((smooth = true) => {
    const el = listRef.current;
    if (!el) return;

    if (smooth) {
      el.scrollTo({
        top: el.scrollHeight,
        behavior: "smooth",
      });
    } else {
      el.scrollTop = el.scrollHeight;
    }
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

  const fmtDate = useCallback((d) => {
    try {
      return new Date(d).toLocaleDateString([], {
        day: "2-digit",
        month: "short",
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

  const creatorId = tour?.creator_id;

  const sendMessage = useCallback(async () => {
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
    // notify tour creator
if (tour?.creator_id && tour.creator_id !== user.id) {
  await supabase.from("notifications").insert({
    user_id: tour.creator_id,
    title: "New chat message",
    body: "Someone sent a message in your tour chat.",
    type: "tour_chat",
    seen: false,
    is_read: false,
    link: `/tour/${tourId}`
  });
}

    if (error) {
      console.log("SEND MESSAGE ERROR:", error);
      setText(msgText);
      return;
    }

    if (textareaRef.current) {
      textareaRef.current.style.height = "48px";
    }

    setTimeout(() => scrollToBottom(true), 40);
  }, [text, user, tourId, notFound, scrollToBottom, creatorId]);

  const onKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  const onTextChange = useCallback((e) => {
    setText(e.target.value);

    const el = e.target;
    el.style.height = "48px";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, []);

  const openProfile = useCallback(
    (userId) => {
      if (!userId) return;
      navigate(`/profile/${userId}`);
    },
    [navigate]
  );

  const groupedMessages = useMemo(() => {
    const groups = [];
    let lastDate = "";

    messages.forEach((msg) => {
      const dateLabel = fmtDate(msg.created_at);
      if (dateLabel !== lastDate) {
        groups.push({ type: "date", label: dateLabel, id: `date-${dateLabel}-${msg.id}` });
        lastDate = dateLabel;
      }
      groups.push({ type: "message", data: msg, id: msg.id });
    });

    return groups;
  }, [messages, fmtDate]);

  const ui = useMemo(
    () => ({
      page: {
        minHeight: "calc(100vh - 78px)",
        padding: 16,
        display: "flex",
        flexDirection: "column",
        color: "#ffffff",
        background:
          "radial-gradient(900px 320px at 10% 0%, rgba(0,255,184,0.14), transparent 55%)," +
          "radial-gradient(900px 360px at 90% 0%, rgba(88,170,255,0.12), transparent 55%)," +
          "linear-gradient(180deg, #04110d 0%, #02070b 50%, #000000 100%)",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        boxSizing: "border-box",
      },
      wrap: {
        width: "100%",
        maxWidth: 1180,
        margin: "0 auto",
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr)",
        gap: 14,
      },
      hero: {
        position: "relative",
        overflow: "hidden",
        borderRadius: 26,
        padding: "18px 18px 16px",
        background:
          "radial-gradient(120% 120% at 0% 0%, rgba(0,255,184,0.16), transparent 40%)," +
          "radial-gradient(120% 120% at 100% 0%, rgba(88,170,255,0.16), transparent 40%)," +
          "linear-gradient(180deg, rgba(8,22,18,0.96), rgba(3,10,9,0.96))",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow:
          "0 0 0 1px rgba(0,255,184,0.08), 0 24px 60px rgba(0,0,0,0.65), 0 0 40px rgba(0,255,184,0.08)",
        backdropFilter: "blur(20px)",
      },
      heroTop: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
      },
      heroLeft: {
        minWidth: 0,
      },
      miniOverline: {
        fontSize: 11,
        letterSpacing: "0.18em",
        opacity: 0.68,
        textTransform: "uppercase",
      },
      heroTitle: {
        fontSize: 26,
        fontWeight: 950,
        marginTop: 4,
        lineHeight: 1.1,
        wordBreak: "break-word",
      },
      heroMetaRow: {
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        marginTop: 12,
      },
      pill: {
        fontSize: 12,
        padding: "7px 12px",
        borderRadius: 999,
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.08)",
        color: "rgba(255,255,255,0.86)",
        fontWeight: 700,
        backdropFilter: "blur(10px)",
      },
      livePill: {
        fontSize: 12,
        padding: "8px 14px",
        borderRadius: 999,
        background:
          "linear-gradient(135deg, rgba(0,255,184,0.18), rgba(88,170,255,0.18))",
        border: "1px solid rgba(0,255,184,0.32)",
        color: "#c7fff1",
        fontWeight: 900,
        letterSpacing: "0.08em",
        boxShadow: "0 0 20px rgba(0,255,184,0.14)",
        whiteSpace: "nowrap",
      },
      chatShell: {
        display: "flex",
        flexDirection: "column",
        minHeight: "72vh",
        borderRadius: 26,
        overflow: "hidden",
        background:
          "linear-gradient(180deg, rgba(5,16,15,0.96), rgba(2,8,10,0.98))",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow:
          "0 0 0 1px rgba(255,255,255,0.03), 0 24px 70px rgba(0,0,0,0.72)",
        backdropFilter: "blur(18px)",
      },
      list: {
        flex: 1,
        overflowY: "auto",
        padding: "18px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        background:
          "radial-gradient(700px 240px at 20% 0%, rgba(0,255,184,0.04), transparent 60%)," +
          "radial-gradient(700px 260px at 80% 0%, rgba(88,170,255,0.04), transparent 60%)",
      },
      dateDividerWrap: {
        display: "flex",
        justifyContent: "center",
        margin: "2px 0 8px",
      },
      dateDivider: {
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: "0.08em",
        color: "rgba(255,255,255,0.66)",
        padding: "7px 12px",
        borderRadius: 999,
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.22)",
      },
      inputBar: {
        padding: 14,
        borderTop: "1px solid rgba(255,255,255,0.06)",
        background:
          "linear-gradient(180deg, rgba(0,0,0,0.18), rgba(0,0,0,0.38))",
        display: "flex",
        gap: 12,
        alignItems: "flex-end",
      },
      inputWrap: {
        flex: 1,
        position: "relative",
      },
      input: {
        width: "100%",
        minHeight: 48,
        maxHeight: 140,
        padding: "14px 18px",
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,0.10)",
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.03))",
        color: "#ffffff",
        fontSize: 14,
        outline: "none",
        resize: "none",
        boxSizing: "border-box",
        lineHeight: 1.45,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
      },
      sendBtn: {
        minWidth: 116,
        height: 48,
        padding: "0 22px",
        borderRadius: 16,
        border: "none",
        background:
          "linear-gradient(135deg, #00ffb0 0%, #00d1ff 50%, #ffffff 100%)",
        color: "#022015",
        fontWeight: 950,
        fontSize: 13,
        letterSpacing: "0.1em",
        cursor: "pointer",
        boxShadow:
          "0 10px 30px rgba(0,255,160,0.30), 0 0 20px rgba(0,209,255,0.18)",
      },
      empty: {
        padding: 30,
        color: "rgba(255,255,255,0.72)",
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
      <div style={ui.wrap}>
        <div style={ui.hero}>
          <div style={ui.heroTop}>
            <div style={ui.heroLeft}>
              <div style={ui.miniOverline}>Tour chat room</div>
              <div style={ui.heroTitle}>💬 {tour.title}</div>

              <div style={ui.heroMetaRow}>
                <span style={ui.pill}>🗺️ Live conversation</span>
                {tour.location_name && (
                  <span style={ui.pill}>📍 {tour.location_name}</span>
                )}
                {tour.country && (
                  <span style={ui.pill}>🌍 {tour.country}</span>
                )}
              </div>
            </div>

            <div style={ui.livePill}>LIVE</div>
          </div>
        </div>

        <div style={ui.chatShell}>
          <div ref={listRef} style={ui.list}>
            {groupedMessages.length === 0 ? (
              <div style={ui.empty}>No messages yet. Start the conversation.</div>
            ) : (
              groupedMessages.map((item) => {
                if (item.type === "date") {
                  return (
                    <div key={item.id} style={ui.dateDividerWrap}>
                      <div style={ui.dateDivider}>{item.label}</div>
                    </div>
                  );
                }

                const msg = item.data;
                const p = profiles[msg.user_id];
                const mine = msg.user_id === user.id;
                const creator = msg.user_id === tour.creator_id;

                return (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      flexDirection: mine ? "row-reverse" : "row",
                      alignItems: "flex-end",
                      gap: 12,
                    }}
                  >
                    <div
                      onClick={() => openProfile(msg.user_id)}
                      title="Open profile"
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: "50%",
                        padding: 2,
                        background: creator
                          ? "linear-gradient(135deg, #ffd76a, #ffb347, #fff0ba)"
                          : mine
                          ? "linear-gradient(135deg, #00ffb0, #00d1ff, #7c4dff)"
                          : "linear-gradient(135deg, rgba(255,255,255,0.28), rgba(255,255,255,0.08))",
                        boxShadow: creator
                          ? "0 0 16px rgba(255,215,90,0.26)"
                          : mine
                          ? "0 0 18px rgba(0,255,176,0.20)"
                          : "none",
                        cursor: "pointer",
                        flexShrink: 0,
                      }}
                    >
                      <img
                        src={p?.avatar_url || "https://i.pravatar.cc/150?img=1"}
                        alt=""
                        style={{
                          width: "100%",
                          height: "100%",
                          borderRadius: "50%",
                          objectFit: "cover",
                          border: "2px solid rgba(0,0,0,0.55)",
                          display: "block",
                        }}
                      />
                    </div>

                    <div
                      style={{
                        maxWidth: "76%",
                        minWidth: 120,
                        padding: "12px 14px 10px",
                        borderRadius: mine
                          ? "22px 22px 8px 22px"
                          : "22px 22px 22px 8px",
                        background: mine
                          ? "linear-gradient(135deg, rgba(0,255,160,0.22), rgba(0,180,255,0.18), rgba(124,77,255,0.18))"
                          : "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.05))",
                        border: creator
                          ? "1px solid rgba(255,215,90,0.40)"
                          : mine
                          ? "1px solid rgba(0,255,184,0.16)"
                          : "1px solid rgba(255,255,255,0.08)",
                        boxShadow:
                          "0 12px 30px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.03)",
                        backdropFilter: "blur(14px)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 900,
                          marginBottom: 6,
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          flexWrap: "wrap",
                          justifyContent: mine ? "flex-end" : "flex-start",
                        }}
                      >
                        <span
                          onClick={() => openProfile(msg.user_id)}
                          style={{
                            cursor: "pointer",
                            color: creator ? "#ffe396" : "#ffffff",
                          }}
                        >
                          {p?.full_name || "Explorer"}
                        </span>

                        {creator && (
                          <span
                            style={{
                              fontSize: 10,
                              padding: "4px 9px",
                              borderRadius: 999,
                              background:
                                "linear-gradient(135deg, rgba(255,215,0,0.20), rgba(255,170,0,0.14))",
                              border: "1px solid rgba(255,215,0,0.34)",
                              color: "#ffd76a",
                              fontWeight: 900,
                              letterSpacing: "0.08em",
                              textTransform: "uppercase",
                            }}
                          >
                            Organizer
                          </span>
                        )}
                      </div>

                      <div
                        style={{
                          fontSize: 14,
                          lineHeight: 1.55,
                          opacity: 0.97,
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                          textAlign: mine ? "right" : "left",
                        }}
                      >
                        {msg.message}
                      </div>

                      <div
                        style={{
                          fontSize: 11,
                          opacity: 0.52,
                          marginTop: 8,
                          textAlign: mine ? "right" : "left",
                          fontWeight: 700,
                          letterSpacing: "0.03em",
                        }}
                      >
                        {fmtTime(msg.created_at)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div style={ui.inputBar}>
            <div style={ui.inputWrap}>
              <textarea
                ref={textareaRef}
                value={text}
                onChange={onTextChange}
                onKeyDown={onKeyDown}
                placeholder="Write a message..."
                rows={1}
                style={ui.input}
              />
            </div>

            <button onClick={sendMessage} style={ui.sendBtn}>
              SEND
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}