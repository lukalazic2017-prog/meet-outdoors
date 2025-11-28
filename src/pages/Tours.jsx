import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1600&auto=format&fit=crop";
const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1520975916090-3105956dac38?q=80&w=1200&auto=format&fit=crop";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function Tours() {
  const query = useQuery();
  const activeTag = query.get("activity") || "";

  const [tours, setTours] = useState([]);
  const [expandedTour, setExpandedTour] = useState(null);
  const [user, setUser] = useState(null); // ➜ USER state

  // LOAD USER
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session?.user) {
        setUser(data.session.user);
      } else {
        setUser(null);
      }
    });
  }, []);

  // LOAD TOURS
  useEffect(() => {
    const raw = JSON.parse(localStorage.getItem("tours")) || [];
    const data = Array.isArray(raw) ? raw : [];
    const filtered = activeTag
      ? data.filter(
          (t) => (t.activity || "").toLowerCase() === activeTag.toLowerCase()
        )
      : data;
    setTours(filtered);
  }, [activeTag]);

  const toggleExpand = (id) => {
    setExpandedTour(expandedTour === id ? null : id);
  };

  return (
    <div>
      {/* HERO */}
      <section
        style={{
          position: "relative",
          minHeight: "35vh",
          display: "grid",
          placeItems: "center",
          padding: "60px 20px 40px",
          backgroundImage: `linear-gradient(180deg, rgba(10,40,20,0.75), rgba(10,40,20,0.85)), url(${HERO_IMAGE})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          color: "white",
          fontFamily: "Poppins, sans-serif",
          boxShadow: "inset 0 -30px 60px rgba(0,0,0,0.35)",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 900 }}>
          <h1 style={{ fontSize: "3rem", margin: 0 }}>🌍 Explore Our Adventures</h1>
          <p style={{ opacity: 0.9, marginTop: 12, fontSize: "1.15rem" }}>
            Find the perfect tour — hiking, rafting, quad rides, zip-line and more.
          </p>
        </div>
      </section>

      {/* FILTER + SORT */}
      <div
        style={{
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: "15px",
          padding: "20px",
          maxWidth: "1000px",
          margin: "40px auto",
          boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
          backdropFilter: "blur(10px)",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "15px",
          fontFamily: "Poppins, sans-serif",
        }}
      >
        {/* SEARCH */}
        <input
          type="text"
          placeholder="🔍 Search by name..."
          onChange={(e) => {
            const value = e.target.value.toLowerCase();
            const allTours = JSON.parse(localStorage.getItem("tours")) || [];
            const filtered = allTours.filter((t) =>
              t.name.toLowerCase().includes(value)
            );
            setTours(filtered);
          }}
          style={{
            padding: "12px 15px",
            borderRadius: "10px",
            border: "none",
            outline: "none",
            fontSize: "1rem",
            flex: "1 1 250px",
          }}
        />

        {/* ACTIVITY */}
        <select
          onChange={(e) => {
            const value = e.target.value;
            const allTours = JSON.parse(localStorage.getItem("tours")) || [];
            const filtered =
              value === "All"
                ? allTours
                : allTours.filter(
                    (t) =>
                      t.activity &&
                      t.activity.toLowerCase() === value.toLowerCase()
                  );
            setTours(filtered);
          }}
          style={{
            padding: "12px 15px",
            borderRadius: "10px",
            border: "none",
            fontSize: "1rem",
            flex: "1 1 180px",
            cursor: "pointer",
          }}
        >
          <option value="All">All activities</option>
          <option value="Hiking">Hiking</option>
          <option value="Rafting">Rafting</option>
          <option value="Quad driving">Quad driving</option>
          <option value="Skiing">Skiing</option>
          <option value="Diving">Diving</option>
          <option value="Camping">Camping</option>
        </select>

        {/* DATE */}
        <input
          type="date"
          onChange={(e) => {
            const selectedDate = e.target.value;
            const allTours = JSON.parse(localStorage.getItem("tours")) || [];
            const filtered = selectedDate
              ? allTours.filter((t) => t.date === selectedDate)
              : allTours;
            setTours(filtered);
          }}
          style={{
            padding: "12px 15px",
            borderRadius: "10px",
            border: "none",
            fontSize: "1rem",
            flex: "1 1 180px",
            cursor: "pointer",
          }}
        />

        {/* SORT */}
        <select
          onChange={(e) => {
            const value = e.target.value;
            const allTours = JSON.parse(localStorage.getItem("tours")) || [];
            let sorted = [...allTours];

            if (value === "PriceAsc") {
              sorted.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
            } else if (value === "PriceDesc") {
              sorted.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
            } else if (value === "DateSoonest") {
              sorted.sort((a, b) => new Date(a.date) - new Date(b.date));
            } else if (value === "DateLatest") {
              sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
            }

            setTours(sorted);
          }}
          style={{
            padding: "12px 15px",
            borderRadius: "10px",
            border: "none",
            fontSize: "1rem",
            flex: "1 1 200px",
            cursor: "pointer",
          }}
        >
          <option value="">Sort by...</option>
          <option value="PriceAsc">Price (low → high)</option>
          <option value="PriceDesc">Price (high → low)</option>
          <option value="DateSoonest">Date (soonest)</option>
          <option value="DateLatest">Date (latest)</option>
        </select>

        {/* RESET */}
        <button
          onClick={() => {
            const allTours = JSON.parse(localStorage.getItem("tours")) || [];
            setTours(allTours);
          }}
          style={{
            background: "linear-gradient(90deg, #22c55e, #4ade80, #16a34a)",
            color: "#06290f",
            fontWeight: "bold",
            border: "none",
            borderRadius: "10px",
            padding: "12px 20px",
            fontSize: "1rem",
            cursor: "pointer",
            transition: "0.3s ease",
            boxShadow: "0 6px 15px rgba(0,0,0,0.3)",
          }}
        >
          🔄 Reset filters
        </button>
      </div>

      {/* CARDS */}
      <section
        style={{
          background: "linear-gradient(160deg, #14532d, #166534)",
          padding: "36px 16px 64px",
          color: "white",
          fontFamily: "Poppins, sans-serif",
        }}
      >
        {tours.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <h2 style={{ fontSize: "2rem" }}>No tours available</h2>

            {/* SHOW ONLY IF USER IS LOGGED IN */}
            {user && (
              <Link
                to="/create-tour"
                style={{
                  display: "inline-block",
                  marginTop: 16,
                  padding: "12px 18px",
                  borderRadius: 10,
                  background: "white",
                  color: "#14532d",
                  fontWeight: 800,
                  textDecoration: "none",
                  boxShadow: "0 10px 22px rgba(0,0,0,0.25)",
                }}
              >
                + Create new tour
              </Link>
            )}
          </div>
        ) : (
          <div
            style={{
              maxWidth: 1200,
              margin: "0 auto",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 22,
            }}
          >
            {tours.map((t, i) => (
              <div
                key={i}
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 16,
                  overflow: "hidden",
                  boxShadow: "0 20px 40px rgba(0,0,0,0.35)",
                  backdropFilter: "blur(6px)",
                }}
              >
                {/* IMG */}
                <div
                  style={{
                    height: 180,
                    backgroundImage: url(`${t.image || FALLBACK_IMG}`),
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(180deg, rgba(0,0,0,0.1), rgba(0,0,0,0.35))",
                    }}
                  />

                  <span
                    style={{
                      position: "absolute",
                      top: 12,
                      left: 12,
                      background: "rgba(0,0,0,0.45)",
                      border: "1px solid rgba(255,255,255,0.22)",
                      color: "white",
                      padding: "6px 10px",
                      borderRadius: 999,
                      fontSize: 12,
                      textTransform: "capitalize",
                      backdropFilter: "blur(4px)",
                    }}
                  >
                    {t.activity || "outdoor"}
                  </span>
                </div>

                {/* CONTENT */}
                <div style={{ padding: 16 }}>
                  <h3 style={{ margin: "0 0 6px", fontSize: "1.25rem" }}>{t.name}</h3>
                  <p style={{ margin: "4px 0", opacity: 0.9 }}>📍 {t.location}</p>
                  <p style={{ margin: "4px 0", opacity: 0.9 }}>
                    📅 {t.date} &nbsp; ⏱ {t.startTime} - {t.endTime}
                  </p>
                  <p style={{ margin: "4px 0", opacity: 0.9 }}>💰 {t.price} €</p>

                  <button
                    onClick={() => toggleExpand(i)}
                    style={{
                      border: "none",
                      marginTop: 10,
                      fontWeight: 700,
                      padding: "10px 14px",
                      borderRadius: 10,
                      cursor: "pointer",
                      background: "#22c55e",
                      color: "white",
                      width: "100%",
                      boxShadow: "0 6px 15px rgba(0,0,0,0.3)",
                    }}
                  >
                    {expandedTour === i ? "Hide details" : "Show details"}
                  </button>

                  {expandedTour === i && (
                    <div
                      style={{
                        marginTop: 20,
                        background: "rgba(255,255,255,0.1)",
                        padding: 15,
                        borderRadius: 10,
                        boxShadow: "inset 0 0 15px rgba(0,0,0,0.3)",
                      }}
                    >
                      <p style={{ marginBottom: 10, opacity: 0.9 }}>
                        {t.description || "This tour has no additional description."}
                      </p>

                      <p style={{ fontWeight: 600 }}>👥 Capacity: {t.capacity}</p>

                      <div
                        style={{
                          borderRadius: 10,
                          overflow: "hidden",
                          marginTop: 15,
                          boxShadow: "0 6px 20px rgba(0,0,0,0.4)",
                        }}
                      >
                        <iframe
                          title="Tour map"
                          src={`https://www.google.com/maps?q=${encodeURIComponent(
                            t.location
                          )}&output=embed`}
                          width="100%"
                          height="250"
                          style={{ border: 0 }}
                          allowFullScreen=""
                          loading="lazy"
                        ></iframe>

                        <Link
                          to={`/chat/${t.id}`}
                          style={{
                            display: "inline-block",
                            marginTop: 15,
                            padding: "10px 16px",
                            borderRadius: 10,
                            background:
                              "linear-gradient(135deg,#22c55e,#4ade80)",
                            color: "#022c22",
                            fontWeight: 700,
                            textDecoration: "none",
                            textAlign: "center",
                            width: "100%",
                            boxShadow: "0 6px 15px rgba(0,0,0,0.25)",
                          }}
                        >
                          💬 Chat with organizer
                        </Link>
                      </div>

                      <a
                        href="mailto:info@meetoutdoors.com"
                        style={{
                          display: "inline-block",
                          marginTop: 15,
                          color: "#22c55e",
                          textDecoration: "none",
                          fontWeight: 700,
                        }}
                      >
                        📩 Contact organizer
                      </a>

                      <button
                        onClick={() => {
                          const allTours =
                            JSON.parse(localStorage.getItem("tours")) || [];
                          const updated = allTours.map((tourItem, idx) =>
                            idx === i
                              ? { ...tourItem, signedUp: !tourItem.signedUp }
                              : tourItem
                          );
                          localStorage.setItem("tours", JSON.stringify(updated));
                          setTours(updated);
                        }}
                        style={{
                          display: "block",
                          marginTop: 15,
                          width: "100%",
                          padding: "12px 20px",
                          background: t.signedUp ? "#dc2626" : "#22c55e",
                          color: "white",
                          border: "none",
                          borderRadius: 10,
                          fontWeight: "bold",
                          fontSize: "1rem",
                          cursor: "pointer",
                          transition: "0.3s ease",
                          boxShadow: "0 6px 15px rgba(0,0,0,0.3)",
                        }}
                      >
                        {t.signedUp ? "Cancel" : "Join tour"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}