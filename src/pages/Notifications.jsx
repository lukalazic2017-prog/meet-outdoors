import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function Notifications() {
  const [list, setList] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setList(data);
  }

  async function markAsRead(id, link) {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);

    if (link) navigate(link);
  }

  return (
    <div style={{ padding: "20px", background: "#04160f", minHeight: "100vh", color: "white" }}>
      <h2>Notifications</h2>

      {list.length === 0 && <p>No notifications.</p>}

      {list.map((n) => (
        <div
          key={n.id}
          onClick={() => markAsRead(n.id, n.link)}
          style={{
            padding: "12px",
            marginTop: "10px",
            background: n.is_read ? "rgba(255,255,255,0.05)" : "rgba(0,255,100,0.15)",
            borderRadius: "10px",
            cursor: "pointer"
          }}
        >
          <div style={{ fontWeight: "bold" }}>{n.type}</div>
          <div>{n.message}</div>
          <div style={{ fontSize: "12px", opacity: 0.5 }}>
            {new Date(n.created_at).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}