// src/pages/Notifications.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function Notifications() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // UČITAVANJE USERA + NOTIFIKACIJA
  useEffect(() => {
    async function load() {
      setLoading(true);
      setErrorMsg("");

      const { data: auth } = await supabase.auth.getUser();
      const currentUser = auth?.user || null;

      if (!currentUser) {
        setUser(null);
        setItems([]);
        setLoading(false);
        return;
      }

      setUser(currentUser);

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        console.error("Notifications load error:", error);
        setErrorMsg("Could not load notifications.");
      } else {
        setItems(data || []);
      }

      setLoading(false);
    }

    load();
  }, []);

  // REALTIME – sluša INSERT na notifications
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("notifications_user_" + user.id)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          const notif = payload.new;
          // samo ako je za ovog usera
          if (notif.user_id === user.id) {
            setItems((prev) => [notif, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Označi sve kao pročitano
  async function markAllRead() {
    if (!user) return;

    // lokalno
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));

    // baza
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);
  }

  // klik na jednu notifikaciju
  async function openNotification(n) {
    if (!user) return;

    // lokalno mark read
    setItems((prev) =>
      prev.map((item) =>
        item.id === n.id ? { ...item, read: true } : item
      )
    );

    // u bazi mark read
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", n.id)
      .eq("user_id", user.id);

    if (n.link) {
      navigate(n.link);
    }
  }

  const pageStyle = {
    minHeight: "100vh",
    padding: "24px 16px 40px",
    background:
      "radial-gradient(circle at top, #050c10 0%, #020308 45%, #000000 100%)",
    color: "#ffffff",
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    boxSizing: "border-box",
  };

  const containerStyle = {
    maxWidth: 920,
    margin: "0 auto",
  };

  const headerRow = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  };

  const titleStyle = {
    fontSize: 26,
    fontWeight: 800,
  };

  const markAllBtn = {
    padding: "8px 14px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.2)",
    background: "rgba(0,0,0,0.7)",
    color: "#ffffff",
    fontSize: 12,
    cursor: "pointer",
  };

  const listStyle = {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    marginTop: 10,
  };

  const itemStyle = (read) => ({
    padding: "10px 14px",
    borderRadius: 14,
    background: read
      ? "rgba(255,255,255,0.04)"
      : "linear-gradient(135deg, rgba(0,255,160,0.12), rgba(0,0,0,0.9))",
    border: read
      ? "1px solid rgba(255,255,255,0.06)"
      : "1px solid rgba(0,255,160,0.6)",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  });

  const textCol = {
    display: "flex",
    flexDirection: "column",
    gap: 2,
  };

  const titleText = {
    fontSize: 14,
    fontWeight: 600,
  };

  const bodyText = {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
  };

  const metaCol = {
    textAlign: "right",
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    minWidth: 120,
  };

  if (loading) {
    return (
      <div style={pageStyle}>
        <div style={containerStyle}>
          <div
            style={{
              minHeight: "60vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
            }}
          >
            Loading notifications...
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={pageStyle}>
        <div style={containerStyle}>
          <div
            style={{
              minHeight: "60vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              opacity: 0.8,
            }}
          >
            Please log in to see your notifications.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <div style={headerRow}>
          <div>
            <div
              style={{
                fontSize: 11,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                opacity: 0.8,
                marginBottom: 4,
              }}
            >
              🔔 Notifications
            </div>
            <h1 style={titleStyle}>What&apos;s new for you</h1>
          </div>

          {items.length > 0 && (
            <button style={markAllBtn} onClick={markAllRead}>
              Mark all as read
            </button>
          )}
        </div>

        {errorMsg && (
          <div
            style={{
              marginBottom: 12,
              padding: "8px 10px",
              borderRadius: 10,
              background: "rgba(255,60,80,0.2)",
              border: "1px solid rgba(255,60,80,0.6)",
              fontSize: 13,
            }}
          >
            {errorMsg}
          </div>
        )}

        {items.length === 0 ? (
          <div
            style={{
              marginTop: 40,
              textAlign: "center",
              fontSize: 14,
              opacity: 0.7,
            }}
          >
            You don&apos;t have any notifications yet.
          </div>
        ) : (
          <div style={listStyle}>
            {items.map((n) => {
              const title =
                n.title ||
                (n.message && "Notification") ||
                "Notification";
              const text = n.body || n.message || "";
              const date = n.created_at
                ? new Date(n.created_at).toLocaleString()
                : "";

              return (
                <div
                  key={n.id}
                  style={itemStyle(n.read)}
                  onClick={() => openNotification(n)}
                >
                  <div style={textCol}>
                    <div style={titleText}>
                      {!n.read && (
                        <span
                          style={{
                            display: "inline-block",
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: "#00ffb0",
                            marginRight: 6,
                          }}
                        />
                      )}
                      {title}
                    </div>
                    {text && <div style={bodyText}>{text}</div>}
                    {n.link && (
                      <div
                        style={{
                          fontSize: 11,
                          marginTop: 4,
                          color: "rgba(0,255,160,0.85)",
                        }}
                      >
                        Tap to open
                      </div>
                    )}
                  </div>
                  <div style={metaCol}>
                    <div>{date}</div>
                    {n.read && (
                      <div style={{ marginTop: 4, opacity: 0.8 }}>
                        Read
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}