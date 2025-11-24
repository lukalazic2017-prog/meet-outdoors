import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function Chat() {
  const { tourId } = useParams();
  const [messages, setMessages] = useState([]);
  const [user, setUser] = useState(null);
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const messagesEndRef = useRef(null);

  // AUTO SCROLL
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [messages]);

  // LOAD USER
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setUser(data.user);
    });
  }, []);

  // LOAD MESSAGES + REALTIME
  useEffect(() => {
    async function loadMessages() {
      const { data } = await supabase
        .from("tour_messages")
        .select("*, profiles(full_name, avatar_url)")
        .eq("tour_id", tourId)
        .order("created_at", { ascending: true });

      setMessages(data || []);
    }

    loadMessages();

    // REALTIME
    const channel = supabase
      .channel("msg_" + tourId)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "tour_messages" },
        (payload) => {
          if (payload.new.tour_id === tourId) {
            setMessages((prev) => [...prev, payload.new]);
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [tourId]);

  // UPDATE READ TIME
  useEffect(() => {
    if (!user) return;
    supabase.from("message_reads").upsert({
      user_id: user.id,
      tour_id: tourId,
      last_read_at: new Date().toISOString(),
    });
  }, [user, tourId]);

  // ---------------------------------------------------
  // 🚀 SEND MESSAGE (ISPRAVNO NAPISANO)
  // ---------------------------------------------------
  async function sendMessage() {
    if (!user) return;
    if (!text && !imageFile) return;

    let imageUrl = null;

    // Upload slike ako postoji
    if (imageFile) {
      const fileName = `${user.id}-${Date.now()}.${
        imageFile.name.split(".").pop()
      }`;

      const { error: uploadErr } = await supabase.storage
        .from("chat-images")
        .upload(fileName, imageFile);

      if (uploadErr) {
        console.log("UPLOAD ERROR:", uploadErr);
      } else {
        const { data } = supabase.storage
          .from("chat-images")
          .getPublicUrl(fileName);

        imageUrl = data.publicUrl;
      }
    }

    await supabase.from("tour_messages").insert({
      tour_id: tourId,
      sender_id: user.id,
      message: text || "",
      image_url: imageUrl,
    });

    setText("");
    setImageFile(null);
  }

  // ---------------------------------------------------

  return (
    <div
      style={{
        height: "calc(100vh - 80px)",
        display: "flex",
        flexDirection: "column",
        background: "#0f172a",
        color: "white",
        padding: "10px",
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: "10px" }}>
        💬 Grupni Chat (Tura #{tourId})
      </h2>

      {/* CHAT LIST */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "10px",
          borderRadius: "10px",
          background: "rgba(255,255,255,0.05)",
        }}
      >
        {messages.map((msg, i) => {
          const isMe = msg.sender_id === user?.id;

          return (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: isMe ? "row-reverse" : "row",
                alignItems: "flex-start",
                marginBottom: "12px",
              }}
            >
              {/* AVATAR */}
              <img
                src={
                  msg.profiles?.avatar_url ||
                  `https://ui-avatars.com/api/?name=${msg.profiles?.full_name}&background=0f172a&color=fff`
                }
                alt="avatar"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  margin: "0 8px",
                }}
              />

              <div>
                <div
                  style={{
                    fontSize: "13px",
                    opacity: 0.7,
                    marginBottom: "3px",
                  }}
                >
                  {msg.profiles?.full_name} •{" "}
                  {new Date(msg.created_at).toLocaleTimeString()}
                </div>

                {/* MESSAGE BUBBLE */}
                <div
                  style={{
                    background: isMe
                      ? "rgba(59,130,246,0.25)" // Plava za tebe
                      : "rgba(34,197,94,0.25)", // Zelena za druge
                    padding: "10px 14px",
                    borderRadius: "12px",
                    maxWidth: "250px",
                    wordBreak: "break-word",
                    boxShadow: "0 0 8px rgba(0,0,0,0.3)",
                  }}
                >
                  {msg.message && <div>{msg.message}</div>}

                  {msg.image_url && (
                    <img
                      src={msg.image_url}
                      alt="upload"
                      style={{
                        width: "100%",
                        marginTop: "8px",
                        borderRadius: "8px",
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef}></div>
      </div>

      {/* INPUT AREA */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginTop: "10px",
        }}
      >
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files[0])}
          style={{
            background: "white",
            padding: "6px",
            borderRadius: "8px",
            color: "black",
            width: "30%",
          }}
        />

        <input
          placeholder="Napiši poruku..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{
            flex: 1,
            padding: "10px",
            borderRadius: "8px",
            border: "none",
            outline: "none",
            background: "rgba(255,255,255,0.1)",
            color: "white",
          }}
        />

        <button
          onClick={sendMessage}
          style={{
            background: "#22c55e",
            padding: "10px 18px",
            borderRadius: "10px",
            border: "none",
            color: "black",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          ➤
        </button>
      </div>
    </div>
  );
}