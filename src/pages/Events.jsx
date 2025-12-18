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

  // LOAD EVENTS
  async function loadEvents() {
    setLoading(true);

    const { data } = await supabase
      .from("events_with_counts")
      .select("*")
      .order("start_time", { ascending: true });

    setEvents(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadEvents();
  }, []);

  // REALTIME
  useEffect(() => {
    const channel = supabase
      .channel("events-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "event_attendees" },
        loadEvents
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const now = new Date();
  const filteredEvents = events.filter((evt) => {
    if (evt.end_time && new Date(evt.end_time) < now) return false;
    if (countryFilter !== "All countries" && evt.country !== countryFilter)
      return false;
    if (categoryFilter !== "All categories" && evt.category !== categoryFilter)
      return false;
    return true;
  });

  const countries = [
    "All countries","Serbia","Bosnia & Herzegovina","Croatia","Montenegro",
    "North Macedonia","Albania","Greece","Italy","France","Germany",
    "Austria","Switzerland","USA",
  ];

  const categories = [
    "All categories","Meetup","Festival","Workshop","Hiking Day",
    "Climbing Event","Bike Gathering","Community Event",
  ];

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <div style={styles.hero}>
        <h1 style={styles.title}>🔥 Outdoor Events</h1>
        <p style={styles.subtitle}>
          Real gatherings · Real people · Real adventures
        </p>

        {/* FILTERS */}
        <div style={styles.filters}>
          <Filter
            value={countryFilter}
            open={showCountryList}
            setOpen={setShowCountryList}
            closeOther={setShowCategoryList}
            list={countries}
            onSelect={setCountryFilter}
          />
          <Filter
            value={categoryFilter}
            open={showCategoryList}
            setOpen={setShowCategoryList}
            closeOther={setShowCountryList}
            list={categories}
            onSelect={setCategoryFilter}
          />
        </div>
      </div>

      {/* GRID */}
      <div style={styles.grid}>
        {!loading &&
          filteredEvents.map((evt) => (
            <div
              key={evt.id}
              style={styles.card}
              onClick={() => navigate(`/event/${evt.id}`)}
            >
              {/* IMAGE */}
              <div style={styles.imageWrap}>
                <img
                  src={evt.cover_url || DEFAULT_COVER}
                  alt=""
                  style={styles.image}
                />
                <div style={styles.imageOverlay} />
                <div style={styles.categoryTag}>#{evt.category}</div>
              </div>

              {/* CONTENT */}
              <div style={styles.cardBody}>
                <div style={styles.cardTitle}>{evt.title}</div>
                <div style={styles.location}>
                  📍 {evt.city || evt.country}
                </div>

                {/* ATTENDEES */}
                <div style={styles.attendees}>
                  <div style={styles.avatars}>
                    {(evt.attendees || []).slice(0, 5).map(
                      (a, i) =>
                        a?.avatar_url && (
                          <img
                            key={i}
                            src={a.avatar_url}
                            alt=""
                            style={styles.avatar}
                          />
                        )
                    )}
                  </div>

                  <div style={styles.count}>
                    👥 {evt.attendees_count || 0}
                  </div>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

/* -------------------------------- */
/* FILTER COMPONENT */
/* -------------------------------- */
function Filter({ value, open, setOpen, closeOther, list, onSelect }) {
  return (
    <div style={{ position: "relative" }}>
      <div
        style={styles.filterBox}
        onClick={() => {
          setOpen((p) => !p);
          closeOther(false);
        }}
      >
        {value} ▾
      </div>
      {open && (
        <div style={styles.dropdown}>
          {list.map((v) => (
            <div
              key={v}
              style={styles.dropdownItem}
              onClick={() => {
                onSelect(v);
                setOpen(false);
              }}
            >
              {v}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* -------------------------------- */
/* STYLES – BRUTAL MODE */
/* -------------------------------- */
const styles = {
  page: {
    minHeight: "100vh",
    padding: "50px 28px",
    background:
      "radial-gradient(circle at top, #04140f 0%, #02060b 45%, #000 100%)",
    color: "#eafff5",
  },

  hero: {
    marginBottom: 40,
  },

  title: {
    fontSize: 38,
    fontWeight: 900,
    letterSpacing: "-0.02em",
  },

  subtitle: {
    marginTop: 6,
    opacity: 0.75,
    fontSize: 15,
  },

  filters: {
    display: "flex",
    gap: 14,
    marginTop: 24,
    flexWrap: "wrap",
  },

  filterBox: {
    padding: "10px 18px",
    borderRadius: 999,
    border: "1px solid rgba(0,255,190,0.6)",
    background:
      "linear-gradient(135deg, rgba(0,0,0,0.85), rgba(0,255,190,0.12))",
    cursor: "pointer",
    fontWeight: 700,
    boxShadow: "0 0 18px rgba(0,255,190,0.25)",
  },

  dropdown: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    background: "rgba(3,12,9,0.98)",
    borderRadius: 18,
    border: "1px solid rgba(0,255,190,0.4)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.9)",
    zIndex: 1000,
  },

  dropdownItem: {
    padding: "12px 16px",
    cursor: "pointer",
    fontSize: 14,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px,1fr))",
    gap: 26,
  },

  card: {
    borderRadius: 26,
    overflow: "hidden",
    cursor: "pointer",
    background:
      "linear-gradient(145deg, rgba(5,25,20,0.95), rgba(2,10,8,0.95))",
    border: "1px solid rgba(0,255,190,0.25)",
    boxShadow: "0 30px 80px rgba(0,0,0,0.9)",
    transition: "transform 0.35s ease, box-shadow 0.35s ease",
  },

  imageWrap: {
    position: "relative",
    height: 200,
    overflow: "hidden",
  },

  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transform: "scale(1.05)",
  },

  imageOverlay: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0.2))",
  },

  categoryTag: {
    position: "absolute",
    top: 14,
    left: 14,
    padding: "5px 12px",
    borderRadius: 999,
    background: "rgba(0,255,190,0.18)",
    border: "1px solid rgba(0,255,190,0.6)",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.08em",
  },

  cardBody: {
    padding: 18,
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: 800,
    marginBottom: 6,
  },

  location: {
    fontSize: 13,
    opacity: 0.8,
  },

  attendees: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
  },

  avatars: {
    display: "flex",
  },

  avatar: {
    width: 30,
    height: 30,
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid #00ffbe",
    marginLeft: -10,
  },

  count: {
    fontSize: 13,
    fontWeight: 700,
  },
};