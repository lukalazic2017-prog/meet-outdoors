// src/pages/Events.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

const DEFAULT_COVER =
  "https://images.pexels.com/photos/3324422/pexels-photo-3324422.jpeg";

export default function Events() {
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // FILTERS
  const [countryFilter, setCountryFilter] = useState("All countries");
  const [categoryFilter, setCategoryFilter] = useState("All categories");

  const [showCountryList, setShowCountryList] = useState(false);
  const [showCategoryList, setShowCategoryList] = useState(false);

  // ---------------------------------------------------------
  // LOAD EVENTS (with counts + avatars)
  // ---------------------------------------------------------
  async function loadEvents() {
    setLoading(true);

    const { data, error } = await supabase
      .from("events_with_counts")
      .select("*")
      .order("start_time", { ascending: true });

    if (!error) setEvents(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadEvents();
  }, []);

  // ---------------------------------------------------------
  // REALTIME – attendees count + avatars
  // ---------------------------------------------------------
  useEffect(() => {
    const channel = supabase
      .channel("events-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "event_attendees" },
        () => {
          loadEvents();
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  // ---------------------------------------------------------
  // FILTERS (only active events)
  // ---------------------------------------------------------
  const now = new Date();

  const filteredEvents = events.filter((evt) => {
    if (evt.end_time && new Date(evt.end_time) < now) return false;

    if (
      countryFilter !== "All countries" &&
      evt.country !== countryFilter
    )
      return false;

    if (
      categoryFilter !== "All categories" &&
      evt.category !== categoryFilter
    )
      return false;

    return true;
  });

  // ---------------------------------------------------------
  // STATIC DATA
  // ---------------------------------------------------------
  const countries = [
    "All countries",
    "Serbia",
    "Bosnia & Herzegovina",
    "Croatia",
    "Montenegro",
    "North Macedonia",
    "Albania",
    "Greece",
    "Italy",
    "France",
    "Germany",
    "Austria",
    "Switzerland",
    "USA",
  ];

  const categories = [
    "All categories",
    "Meetup",
    "Festival",
    "Workshop",
    "Hiking Day",
    "Climbing Event",
    "Bike Gathering",
    "Community Event",
  ];

  // ---------------------------------------------------------
  // UI
  // ---------------------------------------------------------
  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 40,
        background:
          "radial-gradient(circle at top, #010d0e 0%, #020308 45%, #000 100%)",
        color: "#f6fbf8",
      }}
    >
      <h1 style={{ fontSize: 30, fontWeight: 800 }}>
        Discover outdoor events
      </h1>

      {/* FILTERS */}
      <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
        {/* COUNTRY */}
        <div style={{ position: "relative" }}>
          <div
            style={styles.dropdownBox}
            onClick={() => {
              setShowCountryList((p) => !p);
              setShowCategoryList(false);
            }}
          >
            {countryFilter} ▾
          </div>
          {showCountryList && (
            <div style={styles.dropdown}>
              {countries.map((c) => (
                <div
                  key={c}
                  style={styles.dropdownItem}
                  onClick={() => {
                    setCountryFilter(c);
                    setShowCountryList(false);
                  }}
                >
                  {c}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CATEGORY */}
        <div style={{ position: "relative" }}>
          <div
            style={styles.dropdownBox}
            onClick={() => {
              setShowCategoryList((p) => !p);
              setShowCountryList(false);
            }}
          >
            {categoryFilter} ▾
          </div>
          {showCategoryList && (
            <div style={styles.dropdown}>
              {categories.map((c) => (
                <div
                  key={c}
                  style={styles.dropdownItem}
                  onClick={() => {
                    setCategoryFilter(c);
                    setShowCategoryList(false);
                  }}
                >
                  {c}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px,1fr))",
          gap: 20,
          marginTop: 30,
        }}
      >
        {!loading &&
          filteredEvents.map((evt) => (
            <div
              key={evt.id}
              style={styles.card}
              onClick={() => navigate(`/event/${evt.id}`)}
            >
              {/* COVER */}
              <div style={styles.imgWrap}>
                <img
                  src={evt.cover_url || DEFAULT_COVER}
                  alt=""
                  style={styles.img}
                />
              </div>

              {/* BODY */}
              <div style={styles.body}>
                <div style={styles.category}>#{evt.category}</div>

                <div style={styles.title}>{evt.title}</div>

                <div style={styles.meta}>
                  📍 {evt.city || evt.country}
                </div>

                {/* AVATAR STACK */}
                <div style={styles.avatarRow}>
                  {(evt.attendees || [])
                    .slice(0, 5)
                    .map((a, i) =>
                      a?.avatar_url ? (
                        <img
                          key={i}
                          src={a.avatar_url}
                          alt=""
                          style={styles.avatar}
                        />
                      ) : null
                    )}

                  <span style={styles.count}>
                    👥 {evt.attendees_count || 0}
                  </span>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------
// STYLES
// ---------------------------------------------------------
const styles = {
  dropdownBox: {
    padding: "10px 14px",
    borderRadius: 999,
    border: "1px solid rgba(0,255,184,0.6)",
    cursor: "pointer",
    background: "rgba(4,20,16,0.95)",
  },
  dropdown: {
    position: "absolute",
    top: 48,
    left: 0,
    right: 0,
    background: "rgba(2,12,8,0.98)",
    borderRadius: 16,
    border: "1px solid rgba(0,255,184,0.5)",
    zIndex: 1000,
  },
  dropdownItem: {
    padding: "10px 14px",
    cursor: "pointer",
  },
  card: {
    borderRadius: 20,
    overflow: "hidden",
    border: "1px solid rgba(0,255,184,0.35)",
    background:
      "radial-gradient(circle at top left, rgba(10,32,26,0.97), rgba(5,16,13,0.97))",
    cursor: "pointer",
  },
  imgWrap: { height: 180, overflow: "hidden" },
  img: { width: "100%", height: "100%", objectFit: "cover" },
  body: { padding: 14 },
  category: {
    fontSize: 11,
    opacity: 0.8,
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 6,
  },
  meta: {
    fontSize: 12,
    opacity: 0.85,
  },
  avatarRow: {
    display: "flex",
    alignItems: "center",
    marginTop: 10,
    gap: 6,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    objectFit: "cover",
    border: "1px solid rgba(0,255,184,0.8)",
    marginLeft: -8,
  },
  count: {
    marginLeft: 10,
    fontSize: 12,
    fontWeight: 600,
  },
};