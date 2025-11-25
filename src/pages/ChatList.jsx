import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Link } from "react-router-dom";

export default function ChatList() {
  const [user, setUser] = useState(null);
  const [tours, setTours] = useState([]);
  const [unread, setUnread] = useState({});

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setUser(data.user);
    });
  }, []);

  // Load all tours where I am the creator or participant
  useEffect(() => {
    const raw = JSON.parse(localStorage.getItem("tours")) || [];
    if (!user) return;

    const myTours = raw.filter(
      (t) => t.createdBy === user.id || t.signedUpUsers?.includes(user.id)
    );

    setTours(myTours);
  }, [user]);

  // Load unread message count for each tour
  useEffect(() => {
    async function loadUnread() {
      if (!user) return;

      let map = {};

      for (let t of tours) {
        // Last read timestamp
        const { data: lastRead } = await supabase
          .from("message_reads")
          .select("last_read_at")
          .eq("user_id", user.id)
          .eq("tour_id", t.id)
          .single();

        const lastSeen = lastRead?.last_read_at || "1970-01-01";

        // Count new messages
        const { count } = await supabase
          .from("tour_messages")
          .select("*", { count: "exact", head: true })
          .eq("tour_id", t.id)
          .gt("created_at", lastSeen);

        map[t.id] = count || 0;
      }

      setUnread(map);
    }

    if (tours.length > 0) loadUnread();
  }, [tours, user]);

  return (
    <div
      style={{
        padding: "20px",
        color: "white",
        background: "#0f172a",
        minHeight: "100vh",
        fontFamily: "Poppins",
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
        💬 My Chats
      </h2>

      {tours.length === 0 ? (
        <p style={{ textAlign: "center", opacity: 0.7 }}>
          You are not part of any tour chats yet.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          {tours.map((t, i) => (
            <Link
              key={i}
              to={`/chat/${t.id}`}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "15px",
                background: "rgba(255,255,255,0.08)",
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.15)",
                textDecoration: "none",
                color: "white",
              }}
            >
              <div>
                <h3 style={{ margin: 0 }}>{t.name}</h3>
                <p style={{ margin: "5px 0 0", opacity: 0.7 }}>
                  {t.location}
                </p>
              </div>

              {/* NOTIFICATION BADGE */}
              {unread[t.id] > 0 && (
                <span
                  style={{
                    background: "#ef4444",
                    color: "white",
                    borderRadius: "10px",
                    padding: "5px 10px",
                    fontWeight: 700,
                    fontSize: "14px",
                  }}
                >
                  🔔 {unread[t.id]}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}