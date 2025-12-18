// src/pages/MyTours.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function MyTours() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [createdTours, setCreatedTours] = useState([]);
  const [joinedTours, setJoinedTours] = useState([]);
  const [savedTours, setSavedTours] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData() {
    setLoading(true);

    const { data: auth } = await supabase.auth.getUser();
    const currentUser = auth?.user || null;

    if (!currentUser) {
      navigate("/login");
      return;
    }

    setUser(currentUser);

    const userId = currentUser.id;

    // 1) Tours created by user
    const { data: created } = await supabase
      .from("tours")
      .select("*")
      .eq("creator_id", userId)
      .order("created_at", { ascending: false });

    setCreatedTours(created || []);

    // 2) Tours user joined
    const { data: regs } = await supabase
      .from("tour_registrations")
      .select("tour_id")
      .eq("user_id", userId);

    if (regs && regs.length > 0) {
      const joinedIds = regs.map((r) => r.tour_id);
      const { data: joined } = await supabase
        .from("tours")
        .select("*")
        .in("id", joinedIds)
        .order("date_start", { ascending: true });

      setJoinedTours(joined || []);
    } else {
      setJoinedTours([]);
    }

    // 3) Saved tours (user saved)
const { data: savedRows, error: savedErr } = await supabase
  .from("saved_tours")
  .select("tour_id")
  .eq("user_id", userId);

if (savedErr) console.error("saved_tours error:", savedErr);

if (savedRows && savedRows.length > 0) {
  const savedIds = savedRows.map((r) => r.tour_id);

  const { data: savedTours, error: toursErr } = await supabase
    .from("tours")
    .select("*")
    .in("id", savedIds)
    .order("date_start", { ascending: true });

  if (toursErr) console.error("tours error:", toursErr);

  setSavedTours(savedTours || []);
} else {
  setSavedTours([]);
}

    setLoading(false);
  }

  const getCover = (tour) => {
    if (tour.cover_url) return tour.cover_url;
    if (tour.image_urls && tour.image_urls.length > 0) return tour.image_urls[0];
    return "https://images.pexels.com/photos/2387873/pexels-photo-2387873.jpeg";
  };

  // ------------- STYLES -------------
  const page = {
    minHeight: "100vh",
    padding: "30px 16px 60px",
    background:
      "radial-gradient(circle at top, #021d14 0%, #02080a 45%, #000000 100%)",
    color: "#e9fff6",
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    boxSizing: "border-box",
  };

  const container = {
    maxWidth: 1150,
    margin: "0 auto",
  };

  const header = {
    marginBottom: 26,
  };

  const title = {
    fontSize: 32,
    fontWeight: 800,
    background:
      "linear-gradient(120deg, #ffffff, #aaffee, #00ffb4, #00d1ff,#ffffff)",
    WebkitBackgroundClip: "text",
    color: "transparent",
    textShadow: "0 0 30px rgba(0,255,180,0.55)",
    marginBottom: 6,
  };

  const subtitle = {
    fontSize: 14,
    opacity: 0.8,
    maxWidth: 520,
  };

  const tagRow = {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  };

  const tag = {
    fontSize: 11,
    padding: "4px 10px",
    borderRadius: 999,
    border: "1px solid rgba(0,255,180,0.45)",
    background: "rgba(0,0,0,0.35)",
    textTransform: "uppercase",
    letterSpacing: "0.09em",
    color: "rgba(210,255,235,0.9)",
  };

  const section = {
    marginBottom: 30,
  };

  const sectionHeader = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 12,
  };

  const sectionTitle = {
    fontSize: 18,
    fontWeight: 700,
  };

  const sectionHint = {
    fontSize: 12,
    opacity: 0.7,
  };

  const grid = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 18,
  };

  const card = {
    borderRadius: 20,
    overflow: "hidden",
    background: "linear-gradient(145deg, #020a08, #00291f)",
    border: "1px solid rgba(0,255,180,0.25)",
    boxShadow:
      "0 18px 45px rgba(0,0,0,0.85), 0 0 35px rgba(0,255,180,0.18)",
    cursor: "pointer",
    transition: "transform 0.22s ease, box-shadow 0.22s ease",
  };

  const imgWrap = {
    position: "relative",
    height: 170,
    overflow: "hidden",
  };

  const img = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transform: "scale(1.03)",
    transition: "transform 0.32s ease",
  };

  const gradient = {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.05))",
  };

  const badgeRow = {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 2,
  };

  const typeBadge = {
    padding: "6px 11px",
    borderRadius: 999,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    background: "rgba(0,0,0,0.7)",
    border: "1px solid rgba(255,255,255,0.22)",
    color: "#e6fff9",
  };

  const priceChip = {
    padding: "7px 13px",
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 700,
    background:
      "linear-gradient(120deg, #00ffb4, #00d1ff, #ffffff)",
    color: "#002015",
    boxShadow: "0 0 18px rgba(0,255,180,0.7)",
  };

  const cardBody = {
    padding: "14px 15px 15px",
  };

  const cardTitle = {
    fontSize: 17,
    fontWeight: 700,
    marginBottom: 4,
    color: "#ffffff",
    textShadow: "0 0 12px rgba(0,255,180,0.5)",
  };

  const location = {
    fontSize: 13,
    opacity: 0.85,
    marginBottom: 4,
  };

  const metaRow = {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 12,
    opacity: 0.9,
    marginBottom: 8,
  };

  const bottomRow = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  };

  const miniText = {
    fontSize: 11,
    opacity: 0.75,
  };

  const pillSmall = {
    padding: "5px 11px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.25)",
    fontSize: 11,
    background: "rgba(0,0,0,0.65)",
  };

  const emptyState = {
    padding: 16,
    borderRadius: 16,
    border: "1px dashed rgba(255,255,255,0.25)",
    background: "rgba(0,0,0,0.45)",
    fontSize: 13,
    opacity: 0.85,
  };

  const loadingStyle = {
    textAlign: "center",
    marginTop: 40,
    opacity: 0.8,
  };

  const handleCardEnter = (e) => {
    e.currentTarget.style.transform = "translateY(-6px)";
    e.currentTarget.style.boxShadow =
      "0 24px 60px rgba(0,0,0,0.9), 0 0 40px rgba(0,255,180,0.25)";
    const imgEl = e.currentTarget.querySelector("img");
    if (imgEl) imgEl.style.transform = "scale(1.1)";
  };

  const handleCardLeave = (e) => {
    e.currentTarget.style.transform = "translateY(0)";
    e.currentTarget.style.boxShadow =
      "0 18px 45px rgba(0,0,0,0.85), 0 0 35px rgba(0,255,180,0.18)";
    const imgEl = e.currentTarget.querySelector("img");
    if (imgEl) imgEl.style.transform = "scale(1.03)";
  };

  const formatDate = (d) => {
    if (!d) return "No date";
    try {
      return new Date(d).toLocaleDateString();
    } catch {
      return d;
    }
  };

  const renderSection = (titleText, hint, toursArr, typeLabel) => (
    <div style={section}>
      <div style={sectionHeader}>
        <div style={sectionTitle}>{titleText}</div>
        <div style={sectionHint}>{hint}</div>
      </div>

      {toursArr.length === 0 ? (
        <div style={emptyState}>{`No ${typeLabel.toLowerCase()} yet.`}</div>
      ) : (
        <div style={grid}>
          {toursArr.map((tour) => (
            <div
              key={tour.id}
              style={card}
              onMouseEnter={handleCardEnter}
              onMouseLeave={handleCardLeave}
              onClick={() => navigate(`/tour/${tour.id}`)}
            >
              <div style={imgWrap}>
                <img src={getCover(tour)} alt={tour.title} style={img} />
                <div style={gradient} />
                <div style={badgeRow}>
                  <div style={typeBadge}>{typeLabel}</div>
                  <div style={priceChip}>
                    {tour.price ? `€ ${tour.price}` : "Free"}
                  </div>
                </div>
              </div>

              <div style={cardBody}>
                <div style={cardTitle}>{tour.title}</div>
                <div style={location}>
                  📍 {tour.location_name || "Unknown" }
                  {tour.country ? `, ${tour.country}` : ""}
                </div>

                <div style={metaRow}>
                  <span>🧭 {tour.activity || "Activity"}</span>
                  <span>
                    🕒 {formatDate(tour.date_start)} →{" "}
                    {formatDate(tour.date_end)}
                  </span>
                </div>

                <div style={bottomRow}>
                  <span style={miniText}>
                    👥 {tour.participants || 0}/{tour.max_people || "?"} people
                  </span>
                  <span style={pillSmall}>
                    View details
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div style={page}>
        <div style={container}>
          <p style={loadingStyle}>Loading your tours...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={page}>
      <div style={container}>
        {/* HEADER */}
        <div style={header}>
          <div style={tagRow}>
            <span style={tag}>My tours dashboard</span>
            {user && <span style={tag}>Signed in as {user.email}</span>}
          </div>
          <h1 style={title}>All your adventures in one place.</h1>
          <p style={subtitle}>
            See the tours you created, the groups you joined and the trips
            you saved.
          </p>
        </div>

        {/* SECTIONS */}
        {renderSection(
          "Tours you created",
          "You are the host of these adventures.",
          createdTours,
          "Created"
        )}

        {renderSection(
          "Tours you joined",
          "You are a participant in these tours.",
          joinedTours,
          "Joined"
        )}

        {renderSection(
          "Tours you saved",
          "You saved these tours.",
          savedTours,
          "Saved"
        )}
      </div>
    </div>
  );
}