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
        .select("id, full_name, display_name, avatar_url")
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
        height: "82vh",
        padding: 20,
        display: "flex",
        flexDirection: "column",
        color: "white",
        background: "linear-gradient(to bottom, #02110a, #000000)",
      }}
    >
      {/* HEADER */}
      <h2
        style={{
          textAlign: "center",
          paddingBottom: 10,
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          marginBottom: 15,
          fontSize: 22,
        }}
      >
        💬 Chat – {tour.title}
      </h2>

      {/* MESSAGE LIST */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 10,
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
                alignItems: "flex-start",
                gap: 10,
                marginBottom: 15,
              }}
            >
              {/* AVATAR */}
              <img
                src={p?.avatar_url || "https://i.pravatar.cc/150?img=1"}
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: creator ? "3px solid gold" : "2px solid #0a3",
                }}
              />

              {/* MESSAGE BUBBLE */}
              <div
                style={{
                  maxWidth: "70%",
                  background: mine
                    ? "rgba(0,180,120,0.35)"
                    : "rgba(255,255,255,0.06)",
                  padding: "10px 14px",
                  borderRadius: 14,
                  border: creator ? "1px solid gold" : "1px solid transparent",
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 3 }}>
                  {p?.display_name || p?.full_name || "User"}{" "}
                  {creator && (
                    <span style={{ color: "gold", fontSize: 12 }}>
                      · Organizer
                    </span>
                  )}
                </div>

                <div>{msg.message}</div>

                <div style={{ fontSize: 11, opacity: 0.5, marginTop: 4 }}>
                  {new Date(msg.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* INPUT BAR */}
      <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a message..."
          style={{
            flex: 1,
            padding: 14,
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.05)",
            color: "white",
          }}
        />

        <button
          onClick={sendMessage}
          style={{
            padding: "14px 22px",
            background: "linear-gradient(135deg,#00ffb0,#00c8ff)",
            border: "none",
            borderRadius: 12,
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}