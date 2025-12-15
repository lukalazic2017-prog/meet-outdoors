// src/pages/SavedTours.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function SavedTours() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function load() {
      const { data: auth } = await supabase.auth.getUser();
      const currentUser = auth?.user || null;
      setUser(currentUser);

      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // 1) saved_tours
        const { data: savedRows, error: savedError } = await supabase
          .from("saved_tours")
          .select("id, tour_id, created_at")
          .eq("user_id", currentUser.id)
          .order("created_at", { ascending: false });

        if (savedError) throw savedError;

        if (!savedRows || savedRows.length === 0) {
          setSaved([]);
          setLoading(false);
          return;
        }

        const tourIds = savedRows.map((s) => s.tour_id);

        // 2) tours
        const { data: tourData, error: toursError } = await supabase
          .from("tours")
          .select(
            `
            id,
            title,
            activity,
            country,
            location_name,
            cover_url,
            date_start,
            date_end,
            price,
            status,
            application_deadline
          `
          )
          .in("id", tourIds);

        if (toursError) throw toursError;

        const mapTours = {};
        (tourData || []).forEach((t) => {
          mapTours[t.id] = t;
        });

        const merged = savedRows
          .map((row) => ({
            saved_id: row.id,
            saved_at: row.created_at,
            tour: mapTours[row.tour_id] || null,
          }))
          .filter((x) => x.tour);

        setSaved(merged);
      } catch (err) {
        console.error(err);
        setErrorMsg("Error loading saved tours.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  function formatDate(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString();
  }

  function getStatusBadge(status, deadline) {
    const base = {
      padding: "4px 10px",
      borderRadius: 999,
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
    };

    if (status === "ACTIVE") {
      return {
        ...base,
        background: "rgba(0,255,160,0.12)",
        border: "1px solid rgba(0,255,160,0.7)",
        color: "#7bffd0",
      };
    }
    if (status === "FULL") {
      return {
        ...base,
        background: "rgba(255,230,120,0.12)",
        border: "1px solid rgba(255,220,120,0.8)",
        color: "#ffe78a",
      };
    }
    if (status === "CLOSED") {
      return {
        ...base,
        background: "rgba(160,160,160,0.12)",
        border: "1px solid rgba(180,180,180,0.8)",
        color: "#dddddd",
      };
    }
    if (status === "CANCELLED") {
      return {
        ...base,
        background: "rgba(255,80,80,0.12)",
        border: "1px solid rgba(255,120,120,0.9)",
        color: "#ffb7b7",
      };
    }

    return {
      ...base,
      background: "rgba(255,255,255,0.08)",
      border: "1px solid rgba(255,255,255,0.35)",
      color: "#ffffff",
    };
  }

  function getDeadlineText(deadline) {
    if (!deadline) return "";
    const now = new Date();
    const d = new Date(deadline);
    const diffMs = d.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffMs <= 0) return "Applications closed";
    if (diffDays === 1) return "Applications close in 1 day";
    if (diffDays < 7) return `Applications close in ${diffDays} days`;
    return `Applications close on ${d.toLocaleDateString()}`;
  }

  const pageStyle = {
    minHeight: "100vh",
    padding: "100px 16px 60px",
    background:
      "radial-gradient(circle at top, #041810 0%, #020606 50%, #000000 100%)",
    color: "#f5fff9",
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  };

  const containerStyle = {
    maxWidth: 1100,
    margin: "0 auto",
  };

  const headerStyle = {
    marginBottom: 20,
  };

  const titleStyle = {
    fontSize: 28,
    fontWeight: 800,
    marginBottom: 6,
  };

  const subtitleStyle = {
    fontSize: 14,
    color: "rgba(230,250,240,0.78)",
  };

  const gridStyle = {
    marginTop: 20,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: 18,
  };

  const cardStyle = {
    borderRadius: 18,
    overflow: "hidden",
    background:
      "linear-gradient(145deg, rgba(3,20,14,0.95), rgba(1,10,7,0.98))",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 18px 40px rgba(0,0,0,0.85)",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
  };

  const imgStyle = {
    width: "100%",
    height: 160,
    objectFit: "cover",
  };

  const bodyStyle = {
    padding: 14,
    display: "flex",
    flexDirection: "column",
    gap: 6,
    flex: 1,
  };

  const titleRowStyle = {
    display: "flex",
    justifyContent: "space-between",
    gap: 4,
    alignItems: "flex-start",
  };

  const tourTitleStyle = {
    fontSize: 16,
    fontWeight: 700,
  };

  const locationStyle = {
    fontSize: 13,
    color: "rgba(210,235,225,0.9)",
  };

  const metaRowStyle = {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    fontSize: 12,
    color: "rgba(220,240,232,0.85)",
  };

  const chipStyle = {
    padding: "4px 8px",
    borderRadius: 999,
    background: "rgba(0,0,0,0.55)",
    border: "1px solid rgba(255,255,255,0.12)",
  };

  const bottomRowStyle = {
    marginTop: 8,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 12,
  };

  const btnStyle = {
    padding: "7px 12px",
    borderRadius: 999,
    border: "none",
    background:
      "linear-gradient(135deg, #00ffba, #4bffd5, #00c28a)",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    color: "#022116",
  };

  if (loading) {
    return (
      <div style={pageStyle}>
        <div style={containerStyle}>Loading saved tours...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={pageStyle}>
        <div style={containerStyle}>
          <h2>Please log in to see your saved tours.</h2>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <div style={headerStyle}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontSize: 12,
              padding: "4px 10px",
              borderRadius: 999,
              background: "rgba(0,0,0,0.55)",
              border: "1px solid rgba(0,255,176,0.4)",
              marginBottom: 8,
            }}
          >
            <span style={{ fontSize: 14 }}>❤️</span>
            <span>Saved tours</span>
          </div>
          <h1 style={titleStyle}>Your saved adventures.</h1>
          <p style={subtitleStyle}>
            When there is a free spot or the tour changes, you will be notified
            here and in the bell icon.
          </p>
        </div>

        {errorMsg && (
          <div
            style={{
              marginTop: 8,
              marginBottom: 12,
              fontSize: 13,
              padding: "8px 10px",
              borderRadius: 10,
              background: "rgba(255,60,80,0.16)",
              border: "1px solid rgba(255,90,110,0.7)",
              color: "#ffd3d8",
            }}
          >
            {errorMsg}
          </div>
        )}

        {saved.length === 0 ? (
          <div style={{ marginTop: 20, fontSize: 14 }}>
            You don&apos;t have any saved tours yet. Explore tours and tap
            &quot;Save&quot; on the ones you like. 🌿
          </div>
        ) : (
          <div style={gridStyle}>
            {saved.map((item) => {
              const t = item.tour;
              const deadlineText = getDeadlineText(
                t.application_deadline
              );

              return (
                <div
                  key={item.saved_id}
                  style={cardStyle}
                  onClick={() => navigate(`/tour/${t.id}`)}
                >
                  <img
                    src={
                      t.cover_url ||
                      "https://images.pexels.com/photos/3324422/pexels-photo-3324422.jpeg"
                    }
                    alt={t.title}
                    style={imgStyle}
                  />

                  <div style={bodyStyle}>
                    <div style={titleRowStyle}>
                      <div>
                        <div style={tourTitleStyle}>{t.title}</div>
                        <div style={locationStyle}>
                          {t.location_name}
                          {t.country ? `, ${t.country}` : ""}
                        </div>
                      </div>
                      <div style={getStatusBadge(t.status, t.application_deadline)}>
                        {t.status || "ACTIVE"}
                      </div>
                    </div>

                    <div style={metaRowStyle}>
                      {t.activity && (
                        <div style={chipStyle}>🧭 {t.activity}</div>
                      )}
                      {t.date_start && (
                        <div style={chipStyle}>
                          📅 {formatDate(t.date_start)}{" "}
                          {t.date_end ? `– ${formatDate(t.date_end)}` : ""}
                        </div>
                      )}
                      {t.price && (
                        <div style={chipStyle}>💶 {t.price} €</div>
                      )}
                    </div>

                    <div style={bottomRowStyle}>
                      <span
                        style={{
                          fontSize: 11,
                          color: "rgba(220,240,230,0.8)",
                        }}
                      >
                        {deadlineText}
                      </span>
                      <button
                        type="button"
                        style={btnStyle}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/tour/${t.id}`);
                        }}
                      >
                        View tour
                      </button>
                    </div>
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