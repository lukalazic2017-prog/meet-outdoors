// src/pages/Chat.jsx
import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function Chat() {
  const { tourId } = useParams();
  const [messages, setMessages] = useState([]);
  const [profileMap, setProfileMap] = useState({});
  const [text, setText] = useState("");
  const [tour, setTour] = useState(null);
  const [user, setUser] = useState(null);

  const bottomRef = useRef(null);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    loadUser();
    loadTour();
    loadMessages();
    subscribeToMessages();
  }, []);

  async function loadUser() {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
  }

  async function loadTour() {
    const { data } = await supabase
      .from("tours")
      .select("*")
      .eq("id", tourId)
      .single();
    setTour(data);
  }

  async function loadMessages() {
    const { data } = await supabase
      .from("tour_messages")
      .select("*")
      .eq("tour_id", tourId)
      .order("created_at", { ascending: true });

    if (!data) return;

    setMessages(data);

    const userIds = [...new Set(data.map((msg) => msg.user_id))];
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("id", userIds);

      let map = {};
      profiles?.forEach((p) => (map[p.id] = p));
      setProfileMap(map);
    }

    setTimeout(scrollToBottom, 200);
  }

  function subscribeToMessages() {
    supabase
      .channel(`tour_chat_${tourId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "tour_messages" },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
          scrollToBottom();
        }
      )
      .subscribe();
  }

  // ⛔ SEND MESSAGE + NOTIFICATIONS
  async function sendMessage() {
    if (!text.trim() || !user) return;

    // 1) Upis poruke
    await supabase.from("tour_messages").insert([
      {
        tour_id: tourId,
        user_id: user.id,
        message: text,
      },
    ]);

    // 2) 🔔 NOTIFIKACIJE OSTALIMA (ne šalje meni)
    const { data: participants } = await supabase
      .from("tour_registrations")
      .select("user_id")
      .eq("tour_id", tourId);

    if (participants) {
      for (let p of participants) {
        if (p.user_id !== user.id) {
          await supabase.from("notifications").insert({
            user_id: p.user_id,
            title: "New message in tour chat",
            body: text,
            link: `/chat/${tourId}`,
            read: false,
          });
        }
      }
    }

    setText("");
  }

  if (!tour || !user)
    return <div style={{ color: "white", padding: 20 }}>Loading chat...</div>;

  return (
    <div
      style={{
        padding: "20px",
        color: "white",
        height: "80vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: "10px" }}>
        Chat: {tour.title}
      </h2>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          background: "rgba(255,255,255,0.04)",
          padding: 10,
          borderRadius: 12,
        }}
      >
        {messages.map((msg) => {
          const p = profileMap[msg.user_id];
          const isCreator = msg.user_id === tour.creator_id;

          return (
            <div
              key={msg.id}
              style={{
                marginBottom: "15px",
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
              }}
            >
              <img
                src={p?.avatar_url}
                alt="pfp"
                style={{
                  width: 45,
                  height: 45,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: isCreator ? "3px solid gold" : "2px solid #444",
                }}
              />

              <div>
                <div style={{ fontWeight: "600" }}>
                  {p?.first_name} {p?.last_name}{" "}
                  {isCreator && (
                    <span style={{ color: "gold" }}>(Organizator)</span>
                  )}
                </div>

                <div style={{ opacity: 0.8 }}>{msg.message}</div>

                <div style={{ fontSize: 12, opacity: 0.5 }}>
                  {new Date(msg.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          );
        })}

        <div ref={bottomRef}></div>
      </div>

      {/* INPUT */}
      <div
        style={{
          marginTop: 10,
          display: "flex",
          gap: 10,
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a message..."
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 10,
            border: "none",
          }}
        />

        <button
          onClick={sendMessage}
          style={{
            padding: "12px 20px",
            background: "#00c97b",
            border: "none",
            borderRadius: 10,
            cursor: "pointer",
            fontWeight: "700",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}