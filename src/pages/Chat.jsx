// src/pages/Chat.jsx
import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function Chat() {
  const { tourId } = useParams();

  const [messages, setMessages] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [tour, setTour] = useState(null);
  const [user, setUser] = useState(null);
  const [text, setText] = useState("");

  const bottomRef = useRef(null);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // MAIN LOAD
  useEffect(() => {
    loadUser();
    loadTour();
    loadMessages();
    subscribeToMessages();
  }, []);

  // LOAD CURRENT USER
  async function loadUser() {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
  }

  // LOAD TOUR DATA
  async function loadTour() {
    const { data } = await supabase
      .from("tours")
      .select("*")
      .eq("id", tourId)
      .single();

    setTour(data);
  }

  // LOAD MESSAGES + PROFILES
  async function loadMessages() {
    const { data } = await supabase
      .from("tour_messages")
      .select("*")
      .eq("tour_id", tourId)
      .order("created_at", { ascending: true });

    if (!data) return;

    setMessages(data);

    const ids = [...new Set(data.map((m) => m.user_id))];

    if (ids.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", ids);

      let map = {};
      profs?.forEach((p) => (map[p.id] = p));
      setProfiles(map);
    }

    setTimeout(scrollToBottom, 200);
  }

  // REALTIME SUBSCRIBE (FIXED)
function subscribeToMessages() {
  console.log("SUBSCRIBING TO REALTIME CHAT", tourId);

  supabase
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
        console.log("REALTIME MESSAGE:", payload.new);
        setMessages((prev) => [...prev, payload.new]);
        scrollToBottom();
      }
    )
    .subscribe((status) => {
      console.log("SUBSCRIPTION STATUS:", status);
    });
}
 
    

  // SEND MESSAGE
  async function sendMessage() {
    if (!text.trim() || !user) return;

    await supabase.from("tour_messages").insert([
      {
        tour_id: tourId,
        user_id: user.id,
        message: text.trim(),
      },
    ]);

    setText("");
    setTimeout(scrollToBottom, 50);
  }

  if (!tour || !user)
    return <div style={{ padding: 20, color: "white" }}>Loading chat…</div>;

  return (
  <div
    style={{
      height: "86vh",
      padding: 16,
      display: "flex",
      flexDirection: "column",
      color: "#ffffff",
      background:
        "radial-gradient(circle at top, #062c22 0%, #02060b 45%, #000 100%)",
      fontFamily:
        "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    }}
  >
    {/* HEADER */}
    <div
      style={{
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
      }}
    >
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
        <div style={{ fontSize: 20, fontWeight: 800 }}>
          💬 {tour.title}
        </div>
      </div>

      <div
        style={{
          fontSize: 12,
          padding: "6px 12px",
          borderRadius: 999,
          background: "rgba(0,255,160,0.15)",
          border: "1px solid rgba(0,255,160,0.5)",
          color: "#baffea",
          fontWeight: 700,
        }}
      >
        Live
      </div>
    </div>

    {/* MESSAGE LIST */}
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "10px 6px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
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
            {/* AVATAR */}
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

            {/* MESSAGE BUBBLE */}
            <div
              style={{
                maxWidth: "72%",
                padding: "12px 16px",
                borderRadius: 18,
                background: mine
                  ? "linear-gradient(135deg, rgba(0,255,160,0.35), rgba(0,180,255,0.25))"
                  : "rgba(255,255,255,0.08)",
                border: creator
                  ? "1px solid gold"
                  : "1px solid rgba(255,255,255,0.12)",
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
                }}
              >
                {p?.display_name || p?.full_name || "Explorer"}
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
                {new Date(msg.created_at).toLocaleTimeString()}
              </div>
            </div>
          </div>
        );
      })}

      <div ref={bottomRef} />
    </div>

    {/* INPUT BAR */}
    <div
      style={{
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
      }}
    >
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write a message…"
        style={{
          flex: 1,
          padding: "14px 16px",
          borderRadius: 999,
          border: "1px solid rgba(255,255,255,0.2)",
          background: "rgba(0,0,0,0.7)",
          color: "#ffffff",
          fontSize: 14,
          outline: "none",
        }}
      />

      <button
        onClick={sendMessage}
        style={{
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
        }}
      >
        SEND
      </button>
    </div>
  </div>
  
)};