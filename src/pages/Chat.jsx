import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 860 : false
  );

  const listRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 860);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

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
    const msgText = text.trim();
    if (!msgText || !user || !tourId || notFound) return;

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

    if (creatorId && creatorId !== user.id) {
      const { error: notifError } = await supabase.from("notifications").insert({
        user_id: creatorId,
        title: "New chat message",
        body: "Someone sent a message in your tour chat.",
        type: "tour_chat",
        seen: false,
        is_read: false,
        link: `/tour/${tourId}`,
      });

      if (notifError) {
        console.log("SEND NOTIFICATION ERROR:", notifError);
      }
    }

    if (textareaRef.current) {
      textareaRef.current.style.height = "54px";
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
    el.style.height = "54px";
    el.style.height = `${Math.min(el.scrollHeight, 150)}px`;
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
        groups.push({
          type: "date",
          label: dateLabel,
          id: `date-${dateLabel}-${msg.id}`,
        });
        lastDate = dateLabel;
      }
      groups.push({ type: "message", data: msg, id: msg.id });
    });

    return groups;
  }, [messages, fmtDate]);

  const participantsCount = useMemo(() => {
    return [...new Set(messages.map((m) => m.user_id).filter(Boolean))].length;
  }, [messages]);

  const ui = useMemo(
    () => ({
      page: {
        minHeight: "100vh",
        padding: isMobile ? "0 0 90px" : "16px 16px 24px",
        color: "#ffffff",
        marginTop: -120,
        background:
          "radial-gradient(900px 320px at 10% 0%, rgba(0,255,184,0.16), transparent 55%)," +
          "radial-gradient(900px 360px at 90% 0%, rgba(88,170,255,0.14), transparent 55%)," +
          "linear-gradient(180deg, #04110d 0%, #02070b 52%, #000000 100%)",
        fontFamily:
          "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        boxSizing: "border-box",
      },

      wrap: {
        width: "100%",
        maxWidth: isMobile ? "100%" : 1220,
        margin: "0 auto",
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr)",
        gap: isMobile ? 0 : 14,
      },

      hero: {
        position: "relative",
        overflow: "hidden",
        borderRadius: isMobile ? "0 0 28px 28px" : 28,
        padding: isMobile ? "18px 14px 16px" : "18px 20px 18px",
        background:
          "radial-gradient(120% 120% at 0% 0%, rgba(0,255,184,0.18), transparent 40%)," +
          "radial-gradient(120% 120% at 100% 0%, rgba(88,170,255,0.16), transparent 40%)," +
          "linear-gradient(180deg, rgba(8,22,18,0.97), rgba(3,10,9,0.97))",
        border: isMobile ? "none" : "1px solid rgba(255,255,255,0.08)",
        borderBottom: isMobile ? "1px solid rgba(255,255,255,0.08)" : undefined,
        boxShadow: isMobile
          ? "0 20px 40px rgba(0,0,0,0.36)"
          : "0 0 0 1px rgba(0,255,184,0.08), 0 24px 60px rgba(0,0,0,0.65), 0 0 40px rgba(0,255,184,0.08)",
        backdropFilter: "blur(20px)",
      },

      heroTop: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: isMobile ? "flex-start" : "center",
        gap: 12,
        flexWrap: "wrap",
      },

      heroLeft: {
        minWidth: 0,
        flex: 1,
      },

      backRow: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: 10,
        flexWrap: "wrap",
      },

      backBtn: {
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: isMobile ? "8px 12px" : "9px 14px",
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.05)",
        color: "#eafff7",
        fontWeight: 800,
        fontSize: 12,
        cursor: "pointer",
        backdropFilter: "blur(10px)",
      },

      miniOverline: {
        fontSize: 11,
        letterSpacing: "0.18em",
        opacity: 0.7,
        textTransform: "uppercase",
        fontWeight: 800,
      },

      heroTitle: {
        fontSize: isMobile ? 28 : 32,
        fontWeight: 1000,
        marginTop: 4,
        lineHeight: 1.05,
        wordBreak: "break-word",
        letterSpacing: "-0.03em",
      },

      heroSub: {
        marginTop: 8,
        fontSize: isMobile ? 13 : 14,
        lineHeight: 1.55,
        color: "rgba(233,255,246,0.76)",
        maxWidth: 760,
      },

      heroMetaRow: {
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        marginTop: 14,
      },

      pill: {
        fontSize: 12,
        padding: "8px 12px",
        borderRadius: 999,
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.08)",
        color: "rgba(255,255,255,0.86)",
        fontWeight: 800,
        backdropFilter: "blur(10px)",
        whiteSpace: "nowrap",
      },

      livePill: {
        fontSize: 12,
        padding: "8px 14px",
        borderRadius: 999,
        background:
          "linear-gradient(135deg, rgba(0,255,184,0.20), rgba(88,170,255,0.20))",
        border: "1px solid rgba(0,255,184,0.35)",
        color: "#c7fff1",
        fontWeight: 1000,
        letterSpacing: "0.08em",
        boxShadow: "0 0 20px rgba(0,255,184,0.14)",
        whiteSpace: "nowrap",
      },

      shell: {
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) 310px",
        gap: 14,
        alignItems: "start",
        padding: isMobile ? 12 : 0,
      },

      chatShell: {
        display: "flex",
        flexDirection: "column",
        minHeight: isMobile ? "calc(100vh - 235px)" : "74vh",
        borderRadius: isMobile ? 24 : 28,
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
        padding: isMobile ? "14px 10px 14px" : "18px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        background:
          "radial-gradient(700px 240px at 20% 0%, rgba(0,255,184,0.05), transparent 60%)," +
          "radial-gradient(700px 260px at 80% 0%, rgba(88,170,255,0.05), transparent 60%)",
      },

      sideCard: {
        borderRadius: 28,
        overflow: "hidden",
        background:
          "linear-gradient(180deg, rgba(6,16,16,0.96), rgba(3,9,10,0.98))",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow:
          "0 0 0 1px rgba(255,255,255,0.03), 0 24px 70px rgba(0,0,0,0.72)",
        backdropFilter: "blur(18px)",
        display: isMobile ? "none" : "block",
      },

      sideInner: {
        padding: 18,
      },

      sideTitle: {
        fontSize: 12,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: "rgba(233,255,246,0.62)",
        fontWeight: 900,
        marginBottom: 10,
      },

      sideBig: {
        fontSize: 22,
        fontWeight: 1000,
        color: "#ffffff",
        lineHeight: 1.1,
      },

      sideText: {
        marginTop: 8,
        fontSize: 13,
        lineHeight: 1.65,
        color: "rgba(233,255,246,0.74)",
      },

      quickGrid: {
        marginTop: 16,
        display: "grid",
        gap: 10,
      },

      quickBox: {
        padding: "12px 12px",
        borderRadius: 18,
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.08)",
      },

      quickLabel: {
        fontSize: 11,
        color: "rgba(233,255,246,0.58)",
        textTransform: "uppercase",
        letterSpacing: "0.10em",
        fontWeight: 900,
        marginBottom: 5,
      },

      quickValue: {
        fontSize: 13,
        color: "#ffffff",
        fontWeight: 800,
        wordBreak: "break-word",
      },

      openTourBtn: {
        marginTop: 16,
        width: "100%",
        padding: "12px 14px",
        borderRadius: 16,
        border: "none",
        background:
          "linear-gradient(135deg, #00ffb0 0%, #00d1ff 52%, #ffffff 100%)",
        color: "#022015",
        fontWeight: 1000,
        fontSize: 13,
        letterSpacing: "0.08em",
        cursor: "pointer",
        boxShadow:
          "0 10px 30px rgba(0,255,160,0.22), 0 0 20px rgba(0,209,255,0.12)",
      },

      dateDividerWrap: {
        display: "flex",
        justifyContent: "center",
        margin: "2px 0 8px",
      },

      dateDivider: {
        fontSize: 11,
        fontWeight: 900,
        letterSpacing: "0.10em",
        color: "rgba(255,255,255,0.66)",
        padding: "8px 12px",
        borderRadius: 999,
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.22)",
        textTransform: "uppercase",
      },

      empty: {
        padding: "40px 20px",
        color: "rgba(255,255,255,0.72)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: 10,
      },

      emptyIcon: {
        fontSize: 42,
      },

      inputBar: {
        padding: isMobile ? "10px" : "14px",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        background:
          "linear-gradient(180deg, rgba(0,0,0,0.18), rgba(0,0,0,0.38))",
        display: "flex",
        gap: 10,
        alignItems: "flex-end",
        position: isMobile ? "sticky" : "relative",
        bottom: 0,
      },

      inputWrap: {
        flex: 1,
        position: "relative",
      },

      input: {
        width: "100%",
        minHeight: 54,
        maxHeight: 150,
        padding: isMobile ? "15px 16px" : "15px 18px",
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
        minWidth: isMobile ? 58 : 122,
        height: 54,
        padding: isMobile ? "0 16px" : "0 22px",
        borderRadius: 18,
        border: "none",
        background:
          "linear-gradient(135deg, #00ffb0 0%, #00d1ff 50%, #ffffff 100%)",
        color: "#022015",
        fontWeight: 1000,
        fontSize: isMobile ? 18 : 13,
        letterSpacing: isMobile ? "0" : "0.1em",
        cursor: "pointer",
        boxShadow:
          "0 10px 30px rgba(0,255,160,0.30), 0 0 20px rgba(0,209,255,0.18)",
        flexShrink: 0,
      },

      screenState: {
        minHeight: "100vh",
        padding: "24px 16px",
        background:
          "radial-gradient(900px 320px at 10% 0%, rgba(0,255,184,0.14), transparent 55%)," +
          "radial-gradient(900px 360px at 90% 0%, rgba(88,170,255,0.12), transparent 55%)," +
          "linear-gradient(180deg, #04110d 0%, #02070b 50%, #000000 100%)",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily:
          "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      },

      screenCard: {
        width: "100%",
        maxWidth: 520,
        padding: 24,
        borderRadius: 28,
        background:
          "linear-gradient(180deg, rgba(5,16,15,0.96), rgba(2,8,10,0.98))",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow:
          "0 0 0 1px rgba(255,255,255,0.03), 0 24px 70px rgba(0,0,0,0.72)",
        textAlign: "center",
      },
    }),
    [isMobile]
  );

  if (loading) {
    return (
      <div style={ui.screenState}>
        <div style={ui.screenCard}>
          <div style={{ fontSize: 42, marginBottom: 12 }}>💬</div>
          <div style={{ fontSize: 24, fontWeight: 1000 }}>Loading chat...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={ui.screenState}>
        <div style={ui.screenCard}>
          <div style={{ fontSize: 42, marginBottom: 12 }}>🔒</div>
          <div style={{ fontSize: 24, fontWeight: 1000, marginBottom: 10 }}>
            You must be logged in
          </div>
          <div style={{ color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>
            Sign in first, then open the group chat from your tour.
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !tour) {
    return (
      <div style={ui.screenState}>
        <div style={ui.screenCard}>
          <div style={{ fontSize: 42, marginBottom: 12 }}>🧭</div>
          <div style={{ fontSize: 24, fontWeight: 1000, marginBottom: 10 }}>
            Invalid chat
          </div>
          <div style={{ color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>
            Open the chat from a valid tour page.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={ui.page}>
      <div style={ui.wrap}>
        <div style={ui.hero}>
          <div style={ui.backRow}>
            <button style={ui.backBtn} onClick={() => navigate(`/tour/${tourId}`)}>
              ← Back to tour
            </button>
          </div>

          <div style={ui.heroTop}>
            <div style={ui.heroLeft}>
              <div style={ui.miniOverline}>Tour chat room</div>
              <div style={ui.heroTitle}>💬 {tour.title}</div>
              <div style={ui.heroSub}>
                Real-time group chat for everyone joining this adventure.
              </div>

              <div style={ui.heroMetaRow}>
                <span style={ui.pill}>🗺️ Live conversation</span>
                {tour.location_name && (
                  <span style={ui.pill}>📍 {tour.location_name}</span>
                )}
                {tour.country && <span style={ui.pill}>🌍 {tour.country}</span>}
                <span style={ui.pill}>👥 {participantsCount} active people</span>
              </div>
            </div>

            <div style={ui.livePill}>LIVE</div>
          </div>
        </div>

        <div style={ui.shell}>
          <div style={ui.chatShell}>
            <div ref={listRef} style={ui.list}>
              {groupedMessages.length === 0 ? (
                <div style={ui.empty}>
                  <div style={ui.emptyIcon}>🚀</div>
                  <div style={{ fontSize: 18, fontWeight: 900 }}>
                    No messages yet
                  </div>
                  <div style={{ maxWidth: 360, lineHeight: 1.6 }}>
                    Start the conversation and bring this tour group to life.
                  </div>
                </div>
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
                        gap: 10,
                      }}
                    >
                      <div
                        onClick={() => openProfile(msg.user_id)}
                        title="Open profile"
                        style={{
                          width: isMobile ? 40 : 46,
                          height: isMobile ? 40 : 46,
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
                          maxWidth: isMobile ? "84%" : "76%",
                          minWidth: 110,
                          padding: isMobile ? "11px 12px 9px" : "12px 14px 10px",
                          borderRadius: mine
                            ? "22px 22px 8px 22px"
                            : "22px 22px 22px 8px",
                          background: mine
                            ? "linear-gradient(135deg, rgba(0,255,160,0.24), rgba(0,180,255,0.18), rgba(124,77,255,0.18))"
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
                            fontSize: isMobile ? 12 : 13,
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
                                padding: "4px 8px",
                                borderRadius: 999,
                                background:
                                  "linear-gradient(135deg, rgba(255,215,0,0.20), rgba(255,170,0,0.14))",
                                border: "1px solid rgba(255,215,0,0.34)",
                                color: "#ffd76a",
                                fontWeight: 1000,
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
                            fontSize: isMobile ? 13.5 : 14,
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
                            opacity: 0.54,
                            marginTop: 8,
                            textAlign: mine ? "right" : "left",
                            fontWeight: 800,
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
                {isMobile ? "➜" : "SEND"}
              </button>
            </div>
          </div>

          <div style={ui.sideCard}>
            <div style={ui.sideInner}>
              <div style={ui.sideTitle}>Chat info</div>
              <div style={ui.sideBig}>{tour.title}</div>
              <div style={ui.sideText}>
                Keep the group coordinated about meeting point, timing, gear and
                updates.
              </div>

              <div style={ui.quickGrid}>
                <div style={ui.quickBox}>
                  <div style={ui.quickLabel}>Location</div>
                  <div style={ui.quickValue}>
                    {tour.location_name || "Not specified"}
                    {tour.country ? `, ${tour.country}` : ""}
                  </div>
                </div>

                <div style={ui.quickBox}>
                  <div style={ui.quickLabel}>Messages</div>
                  <div style={ui.quickValue}>{messages.length}</div>
                </div>

                <div style={ui.quickBox}>
                  <div style={ui.quickLabel}>Participants talking</div>
                  <div style={ui.quickValue}>{participantsCount}</div>
                </div>
              </div>

              <button
                style={ui.openTourBtn}
                onClick={() => navigate(`/tour/${tourId}`)}
              >
                OPEN TOUR PAGE
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}