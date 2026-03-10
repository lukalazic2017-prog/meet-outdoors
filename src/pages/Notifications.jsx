// src/pages/Notifications.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function Notifications() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    const me = auth?.user || null;
    setUser(me);

    if (!me) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", me.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.log("LOAD NOTIFICATIONS ERROR", error);
      setNotifications([]);
      setLoading(false);
      return;
    }

    setNotifications(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    let channel;

    const init = async () => {
      await loadNotifications();

      const { data: auth } = await supabase.auth.getUser();
      const me = auth?.user || null;

      if (!me) return;

      channel = supabase
        .channel(`notifications_${me.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${me.id}`,
          },
          async () => {
            await loadNotifications();
          }
        )
        .subscribe((status) => {
          console.log("NOTIFICATIONS SUBSCRIBE STATUS:", status);
        });
    };

    init();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [loadNotifications]);

  const markAsRead = useCallback(async (id) => {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);

    if (error) {
      console.log("MARK AS READ ERROR", error);
      return;
    }

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    if (error) {
      console.log("MARK ALL READ ERROR", error);
      return;
    }

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }, [user]);

  const deleteNotification = useCallback(async (id) => {
    const { error } = await supabase.from("notifications").delete().eq("id", id);

    if (error) {
      console.log("DELETE NOTIFICATION ERROR", error);
      return;
    }

    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.is_read).length,
    [notifications]
  );

  const fmtDate = useCallback((d) => {
    try {
      return new Date(d).toLocaleString();
    } catch {
      return "";
    }
  }, []);

  const styles = {
    page: {
      minHeight: "100vh",
      padding: "18px 14px 40px",
      background:
        "radial-gradient(circle at top, #062c22 0%, #02060b 45%, #000 100%)",
      color: "#fff",
      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      boxSizing: "border-box",
    },
    shell: {
      width: "100%",
      maxWidth: 980,
      margin: "0 auto",
    },
    header: {
      padding: "16px 18px",
      borderRadius: 20,
      marginBottom: 14,
      background:
        "linear-gradient(135deg, rgba(0,0,0,0.92), rgba(0,255,160,0.14))",
      border: "1px solid rgba(0,255,160,0.28)",
      boxShadow: "0 20px 40px rgba(0,0,0,0.9)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12,
      flexWrap: "wrap",
    },
    backBtn: {
      padding: "8px 12px",
      borderRadius: 999,
      border: "1px solid rgba(255,255,255,0.14)",
      background: "rgba(255,255,255,0.06)",
      color: "white",
      cursor: "pointer",
      fontWeight: 700,
      marginBottom: 8,
    },
    badge: {
      fontSize: 12,
      padding: "7px 12px",
      borderRadius: 999,
      background: "rgba(0,255,160,0.15)",
      border: "1px solid rgba(0,255,160,0.5)",
      color: "#baffea",
      fontWeight: 800,
    },
    actions: {
      display: "flex",
      gap: 10,
      flexWrap: "wrap",
      marginBottom: 14,
    },
    actionBtn: {
      padding: "10px 14px",
      borderRadius: 999,
      border: "1px solid rgba(255,255,255,0.16)",
      background: "rgba(255,255,255,0.06)",
      color: "#fff",
      cursor: "pointer",
      fontWeight: 700,
    },
    list: {
      display: "flex",
      flexDirection: "column",
      gap: 12,
    },
    card: (isRead) => ({
      padding: "14px 16px",
      borderRadius: 18,
      background: isRead
        ? "rgba(255,255,255,0.05)"
        : "linear-gradient(135deg, rgba(0,255,160,0.14), rgba(255,255,255,0.06))",
      border: isRead
        ? "1px solid rgba(255,255,255,0.10)"
        : "1px solid rgba(0,255,160,0.26)",
      boxShadow: "0 14px 34px rgba(0,0,0,0.7)",
      display: "flex",
      justifyContent: "space-between",
      gap: 14,
      alignItems: "flex-start",
      flexWrap: "wrap",
    }),
    cardLeft: {
      flex: 1,
      minWidth: 220,
    },
    title: {
      fontSize: 14,
      fontWeight: 800,
      marginBottom: 5,
      lineHeight: 1.45,
    },
    meta: {
      fontSize: 12,
      opacity: 0.7,
    },
    cardActions: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap",
    },
    miniBtn: {
      padding: "8px 12px",
      borderRadius: 999,
      border: "1px solid rgba(255,255,255,0.16)",
      background: "rgba(0,0,0,0.45)",
      color: "#fff",
      cursor: "pointer",
      fontSize: 12,
      fontWeight: 700,
    },
    empty: {
      textAlign: "center",
      padding: "36px 16px",
      opacity: 0.72,
      borderRadius: 18,
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
    },
  };

  if (loading) {
    return <div style={{ padding: 20, color: "white" }}>Loading notifications…</div>;
  }

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <div style={styles.header}>
          <div>
            <button style={styles.backBtn} onClick={() => navigate(-1)}>
              ← Back
            </button>
            <div
              style={{
                fontSize: 11,
                letterSpacing: "0.14em",
                opacity: 0.7,
                textTransform: "uppercase",
              }}
            >
              Activity
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, lineHeight: 1.15 }}>
              🔔 Notifications
            </div>
          </div>

          <div style={styles.badge}>
            Unread: <strong>{unreadCount}</strong>
          </div>
        </div>

        <div style={styles.actions}>
          <button style={styles.actionBtn} onClick={markAllAsRead}>
            Mark all as read
          </button>
        </div>

        <div style={styles.list}>
          {notifications.length === 0 ? (
            <div style={styles.empty}>No notifications yet.</div>
          ) : (
            notifications.map((n) => (
              <div key={n.id} style={styles.card(n.is_read)}>
                <div style={styles.cardLeft}>
                  <div style={styles.title}>{n.message || "Notification"}</div>
                  <div style={styles.meta}>{fmtDate(n.created_at)}</div>
                </div>

                <div style={styles.cardActions}>
                  {!n.is_read && (
                    <button
                      style={styles.miniBtn}
                      onClick={() => markAsRead(n.id)}
                    >
                      Mark read
                    </button>
                  )}

                  {n.link && (
                    <button
                      style={styles.miniBtn}
                      onClick={() => {
                        if (!n.is_read) markAsRead(n.id);
                        navigate(n.link);
                      }}
                    >
                      Open
                    </button>
                  )}

                  <button
                    style={styles.miniBtn}
                    onClick={() => deleteNotification(n.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}