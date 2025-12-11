
import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // FILTERI
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [countryFilter, setCountryFilter] = useState("All Countries");
  const [statusFilter, setStatusFilter] = useState("All"); // All | Upcoming | Live now | Ended
  const [isFreeFilter, setIsFreeFilter] = useState("all"); // all | freeOnly
  const [monthFilter, setMonthFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  const [showCategoryList, setShowCategoryList] = useState(false);
  const [showCountryList, setShowCountryList] = useState(false);

  const mapCenter = [43.9, 21.0]; // Balkan default
  const navigate = useNavigate();

  // ---------------------------------------------------------
  // 1️⃣ Učitavanje svih eventova
  // ---------------------------------------------------------
  async function loadEvents() {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("start_time", { ascending: true });

    if (error) {
      console.log("Load events error:", error);
      setEvents([]);
    } else {
      setEvents(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadEvents();
  }, []);

  // ---------------------------------------------------------
  // 2️⃣ Status eventa (Upcoming / Live now / Ended)
  // ---------------------------------------------------------
  function getEventStatus(evt) {
    if (!evt.start_time && !evt.end_time) return "Upcoming";

    const now = new Date();
    const start = evt.start_time ? new Date(evt.start_time) : null;
    const end = evt.end_time ? new Date(evt.end_time) : null;

    if (start && !end) {
      if (now < start) return "Upcoming";
      if (now >= start) return "Live now";
    }

    if (!start && end) {
      if (now <= end) return "Live now";
      return "Ended";
    }

    if (start && end) {
      if (now < start) return "Upcoming";
      if (now >= start && now <= end) return "Live now";
      if (now > end) return "Ended";
    }

    return "Upcoming";
  }

  // ---------------------------------------------------------
  // 3️⃣ Helper – format datuma
  // ---------------------------------------------------------
  function formatEventDateRange(evt) {
    if (!evt.start_time && !evt.end_time) return "Date to be announced";

    const opts = { day: "2-digit", month: "short", year: "numeric" };
    const start = evt.start_time ? new Date(evt.start_time) : null;
    const end = evt.end_time ? new Date(evt.end_time) : null;

    if (start && !end) {
      return start.toLocaleDateString(undefined, opts);
    }
    if (!start && end) {
      return end.toLocaleDateString(undefined, opts);
    }
    if (start && end) {
      const sameDay =
        start.toDateString() === end.toDateString();
      if (sameDay) {
        return start.toLocaleDateString(undefined, opts);
      }
      return (
        start.toLocaleDateString(undefined, opts) +
        " – " +
        end.toLocaleDateString(undefined, opts)
      );
    }
    return "Date to be announced";
  }

  // ---------------------------------------------------------
  // 4️⃣ FILTERI
  // ---------------------------------------------------------
  const filteredEvents = events.filter((evt) => {
    const title = evt.title?.toLowerCase() || "";
    const city = evt.city?.toLowerCase() || "";
    const locationName = evt.location_name?.toLowerCase() || "";

    // search
    const search = searchTerm.toLowerCase().trim();
    const matchSearch =
      search === "" ||
      title.includes(search) ||
      city.includes(search) ||
      locationName.includes(search);

    // category
    const matchCategory =
      categoryFilter === "All" ||
      evt.category === categoryFilter;

    // country
    const matchCountry =
      countryFilter === "All Countries" ||
      evt.country === countryFilter;

    // status
    const status = getEventStatus(evt);
    const matchStatus =
      statusFilter === "All" || statusFilter === status;

    // month filter – gledamo start_time
    let matchMonth = true;
    if (monthFilter !== "All") {
      if (!evt.start_time) {
        matchMonth = false;
      } else {
        const m = new Date(evt.start_time).getMonth(); // 0–11
        const mIndex = months.indexOf(monthFilter);
        matchMonth = m === mIndex;
      }
    }

    // free only
    const matchFree =
      isFreeFilter === "all"
        ? true
        : evt.is_free === true || evt.price_from === 0;

    return (
      matchSearch &&
      matchCategory &&
      matchCountry &&
      matchStatus &&
      matchMonth &&
      matchFree
    );
  });

  // ---------------------------------------------------------
  // 5️⃣ Fallback za sliku
  // ---------------------------------------------------------
  const getCover = (evt) =>
    evt.cover_url ??
    "https://images.pexels.com/photos/3324422/pexels-photo-3324422.jpeg";

  // ---------------------------------------------------------
  // LISTE
  // ---------------------------------------------------------
  const categories = [
    "All",
    "Hiking Meetup",
    "Trail Run",
    "Cycling Ride",
    "Climbing Session",
    "Outdoor Festival",
    "Pilgrimage",
    "Workshop / Class",
    "Community Meetup",
    "Camping Night",
    "Other",
  ];

  const countries = [
    "All Countries",
    "Serbia",
    "Bosnia & Herzegovina",
    "Croatia",
    "Montenegro",
    "North Macedonia",
    "Albania",
    "Greece",
    "Bulgaria",
    "Romania",
    "Slovenia",
    "Hungary",
    "Austria",
    "Germany",
    "Switzerland",
    "Italy",
    "Spain",
    "France",
    "Portugal",
    "Turkey",
    "Georgia",
    "Cyprus",
    "USA",
    "Canada",
    "Australia",
    "Other",
  ];

  // meseci (index = getMonth())
  const months = [
    "All",
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // ---------------------------------------------------------
  // DIZAJN – Airbnb + tvoj outdoor stil
  // ---------------------------------------------------------
  const styles = {
    page: {
      minHeight: "100vh",
      padding: "32px 16px 48px",
      background:
        "radial-gradient(circle at top, #020a0b 0%, #020308 40%, #000000 100%)",
      display: "flex",
      justifyContent: "center",
      color: "#f5f9f7",
      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    },
    container: {
      width: "100%",
      maxWidth: 1180,
    },
    header: { textAlign: "left", marginBottom: 22 },
    badge: {
      display: "inline-flex",
      alignItems: "center",
      padding: "4px 10px",
      borderRadius: 999,
      border: "1px solid rgba(140,210,180,0.9)",
      background: "rgba(8,44,36,0.95)",
      fontSize: 11,
      letterSpacing: "0.18em",
      textTransform: "uppercase",
      color: "rgba(210,243,230,0.96)",
      marginBottom: 8,
    },
    titleRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-end",
      gap: 16,
      flexWrap: "wrap",
    },
    titleBox: { flex: "1 1 260px" },
    title: {
      fontSize: 30,
      fontWeight: 800,
      color: "#f9fefb",
      marginBottom: 6,
    },
    subtitle: {
      fontSize: 14,
      color: "rgba(220,240,230,0.8)",
      maxWidth: 520,
    },
    statsRow: {
      display: "flex",
      gap: 10,
      flexWrap: "wrap",
      fontSize: 12,
      color: "rgba(220,240,230,0.9)",
    },
    statPill: {
      padding: "6px 10px",
      borderRadius: 999,
      background: "rgba(10,40,30,0.98)",
      border: "1px solid rgba(120,195,160,0.8)",
    },

    // search & filters
    searchRow: {
      marginTop: 18,
      marginBottom: 10,
      display: "flex",
      gap: 10,
      flexWrap: "wrap",
      alignItems: "center",
    },
    searchInput: {
      flex: "1 1 240px",
      padding: "9px 12px",
      borderRadius: 999,
      border: "1px solid rgba(110,186,150,0.7)",
      background: "rgba(4,18,12,0.96)",
      color: "#f5f9f7",
      fontSize: 13,
      outline: "none",
    },
    createButton: {
      padding: "9px 18px",
      borderRadius: 999,
      border: "none",
      background:
        "linear-gradient(120deg, #fdf2b7, #f0c76e, #ed9f4b)",
      color: "#321a03",
      fontSize: 13,
      fontWeight: 700,
      cursor: "pointer",
      whiteSpace: "nowrap",
    },

    filterBar: {
      marginTop: 10,
      marginBottom: 18,
      padding: 14,
      borderRadius: 18,
      background: "rgba(3,14,11,0.98)",
      border: "1px solid rgba(65,125,100,0.8)",
      display: "grid",
      gridTemplateColumns: "2fr 2fr 2fr",
      gap: 12,
    },
    filterGroup: {
      display: "flex",
      flexDirection: "column",
      position: "relative",
      fontSize: 12,
      color: "rgba(220,240,230,0.86)",
    },
    filterLabel: { marginBottom: 4, opacity: 0.85 },
    dropdownBox: {
      padding: "8px 12px",
      borderRadius: 999,
      background: "rgba(4,20,18,1)",
      border: "1px solid rgba(110,186,150,0.8)",
      cursor: "pointer",
      fontSize: 13,
      color: "#f3f8f5",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    dropdownList: {
      position: "absolute",
      top: 54,
      left: 0,
      right: 0,
      maxHeight: 230,
      overflowY: "auto",
      background: "rgba(2,10,10,0.98)",
      borderRadius: 16,
      border: "1px solid rgba(110,186,150,0.8)",
      zIndex: 9999,
      boxShadow: "0 18px 50px rgba(0,0,0,0.9)",
    },
    dropdownItem: {
      padding: "9px 12px",
      fontSize: 13,
      cursor: "pointer",
      color: "#f3f8f5",
    },

    segmented: {
      display: "inline-flex",
      padding: 3,
      borderRadius: 999,
      background: "rgba(5,21,18,1)",
      border: "1px solid rgba(110,186,150,0.8)",
      gap: 4,
    },
    segButton: (active) => ({
      padding: "5px 10px",
      borderRadius: 999,
      fontSize: 11,
      border: "none",
      cursor: "pointer",
      background: active ? "rgba(118,196,149,1)" : "transparent",
      color: active ? "#05150d" : "rgba(220,240,230,0.85)",
      fontWeight: active ? 700 : 500,
    }),

    checkboxRow: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      fontSize: 12,
      marginTop: 4,
    },

    monthsRow: {
      display: "flex",
      flexWrap: "wrap",
      gap: 6,
      marginTop: 4,
    },
    monthChip: (active) => ({
      padding: "4px 9px",
      borderRadius: 999,
      border: active
        ? "1px solid rgba(170,230,200,0.95)"
        : "1px solid rgba(70,120,95,0.8)",
      fontSize: 11,
      cursor: "pointer",
      background: active
        ? "rgba(40,90,70,0.95)"
        : "rgba(5,20,16,1)",
      color: active
        ? "#f7fff9"
        : "rgba(210,235,220,0.9)",
    }),

    // MAP WRAPPER
    mapWrapper: {
      marginTop: 12,
      marginBottom: 22,
      borderRadius: 20,
      overflow: "hidden",
      border: "1px solid rgba(70,130,100,0.75)",
      background:
        "radial-gradient(circle at top, rgba(24,72,51,0.7), rgba(4,12,9,1))",
      boxShadow: "0 22px 60px rgba(0,0,0,0.9)",
    },
    mapTopBar: {
      padding: "10px 14px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      flexWrap: "wrap",
      fontSize: 12,
      color: "rgba(226,244,235,0.92)",
    },
    mapTopLeft: {
      display: "flex",
      flexDirection: "column",
      gap: 2,
    },
    mapContainer: { height: 260, width: "100%" },

    // GRID
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
      gap: 18,
    },
    card: {
      borderRadius: 18,
      overflow: "hidden",
      background:
        "linear-gradient(150deg, rgba(5,14,11,0.98), rgba(8,30,24,0.98))",
      border: "1px solid rgba(80,140,110,0.8)",
      cursor: "pointer",
      boxShadow: "0 16px 40px rgba(0,0,0,0.85)",
      display: "flex",
      flexDirection: "column",
    },
    imgWrapper: { height: 170, position: "relative", overflow: "hidden" },
    img: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      transform: "scale(1.02)",
      transition: "transform 0.35s ease-out",
    },
    imgOverlayTop: {
      position: "absolute",
      inset: 0,
      background:
        "linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0.1))",
    },
    topTag: {
      position: "absolute",
      top: 10,
      left: 10,
      padding: "4px 9px",
      borderRadius: 999,
      fontSize: 11,
      border: "1px solid rgba(250,245,215,0.95)",
      background: "rgba(22,16,5,0.96)",
      color: "#fff7d7",
      textTransform: "uppercase",
      letterSpacing: "0.12em",
    },
    cardBody: {
      padding: 14,
      display: "flex",
      flexDirection: "column",
      gap: 6,
      fontSize: 13,
    },
    statusPill: (status) => {
      let bg = "rgba(40,80,60,0.9)";
      let border = "rgba(110,186,150,0.9)";
      if (status === "Upcoming") {
        bg = "rgba(35,88,75,0.95)";
        border = "rgba(160,225,190,0.96)";
      } else if (status === "Live now") {
        bg = "rgba(88,130,42,0.95)";
        border = "rgba(212,240,150,0.98)";
      } else if (status === "Ended") {
        bg = "rgba(40,40,40,0.92)";
        border = "rgba(140,140,140,0.95)";
      }
      return {
        alignSelf: "flex-start",
        padding: "4px 9px",
        borderRadius: 999,
        border: `1px solid ${border}`,
        fontSize: 11,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        color: "#f5fff9",
        background: bg,
      };
    },
    titleText: {
      fontSize: 15,
      fontWeight: 700,
      color: "#f7fff9",
    },
    locationText: {
      fontSize: 12,
      color: "rgba(220,240,230,0.85)",
    },
    metaRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 8,
      marginTop: 4,
    },
    metaLeft: {
      display: "flex",
      flexDirection: "column",
      gap: 2,
      fontSize: 12,
      color: "rgba(210,234,220,0.9)",
    },
    metaRight: {
      fontSize: 11,
      color: "rgba(200,220,210,0.9)",
      textAlign: "right",
    },
    priceText: {
      fontWeight: 700,
      fontSize: 13,
    },
    viewButton: {
      marginTop: 8,
      alignSelf: "flex-start",
      padding: "7px 14px",
      borderRadius: 999,
      border: "none",
      background:
        "linear-gradient(120deg, #fdf2b7, #f0c76e, #ed9f4b)",
      color: "#321a03",
      fontSize: 12,
      fontWeight: 700,
      cursor: "pointer",
    },
  };

  // STATISTIKA
  const stats = {
    total: filteredEvents.length,
    upcoming: filteredEvents.filter((e) => getEventStatus(e) === "Upcoming")
      .length,
    live: filteredEvents.filter((e) => getEventStatus(e) === "Live now").length,
    ended: filteredEvents.filter((e) => getEventStatus(e) === "Ended").length,
  };

  const handleCreateEvent = () => {
    navigate("/create-event");
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* HEADER */}
        <div style={styles.header}>
          <div style={styles.badge}>Events · MeetOutdoors</div>

          <div style={styles.titleRow}>
            <div style={styles.titleBox}>
              <h1 style={styles.title}>Meet people where nature happens.</h1>
              <p style={styles.subtitle}>
                Discover outdoor gatherings, meetups and festivals hosted by
                the community. Join something new this week.
              </p>
            </div>

            <div style={styles.statsRow}>
              <div style={styles.statPill}>
                Events: <strong>{stats.total}</strong>
              </div>
              <div style={styles.statPill}>
                Upcoming: <strong>{stats.upcoming}</strong>
              </div>
              <div style={styles.statPill}>
                Live now: <strong>{stats.live}</strong>
              </div>
              <div style={styles.statPill}>
                Ended: <strong>{stats.ended}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* SEARCH + CREATE */}
        <div style={styles.searchRow}>
          <input
            type="text"
            placeholder="Search by name, city or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
          <button
            type="button"
            style={styles.createButton}
            onClick={handleCreateEvent}
          >
            + Create event
          </button>
        </div>

        {/* FILTER BAR */}
        <div style={styles.filterBar}>
          {/* CATEGORY */}
          <div style={styles.filterGroup}>
            <span style={styles.filterLabel}>Category</span>
            <div
              style={styles.dropdownBox}
              onClick={() => {
                setShowCategoryList((p) => !p);
                setShowCountryList(false);
              }}
            >
              <span>{categoryFilter}</span>
              <span>▾</span>
            </div>
            {showCategoryList && (
              <div style={styles.dropdownList}>
                {categories.map((c) => (
                  <div
                    key={c}
                    style={{
                      ...styles.dropdownItem,
                      backgroundColor:
                        c === categoryFilter
                          ? "rgba(20,68,56,0.95)"
                          : "transparent",
                    }}
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

          {/* COUNTRY */}
          <div style={styles.filterGroup}>
            <span style={styles.filterLabel}>Country</span>
            <div
              style={styles.dropdownBox}
              onClick={() => {
                setShowCountryList((p) => !p);
                setShowCategoryList(false);
              }}
            >
              <span>{countryFilter}</span>
              <span>▾</span>
            </div>
            {showCountryList && (
              <div style={styles.dropdownList}>
                {countries.map((c) => (
                  <div
                    key={c}
                    style={{
                      ...styles.dropdownItem,
                      backgroundColor:
                        c === countryFilter
                          ? "rgba(20,68,56,0.95)"
                          : "transparent",
                    }}
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

          {/* STATUS */}
          <div style={styles.filterGroup}>
            <span style={styles.filterLabel}>Status</span>
            <div style={styles.segmented}>
              {["All", "Upcoming", "Live now", "Ended"].map((s) => (
                <button
                  key={s}
                  type="button"
                  style={styles.segButton(statusFilter === s)}
                  onClick={() => setStatusFilter(s)}
                >
                  {s}
                </button>
              ))}
            </div>

            <div style={styles.checkboxRow}>
              <input
                id="freeOnly"
                type="checkbox"
                checked={isFreeFilter === "freeOnly"}
                onChange={(e) =>
                  setIsFreeFilter(e.target.checked ? "freeOnly" : "all")
                }
              />
              <label htmlFor="freeOnly">Only free events</label>
            </div>
          </div>

          {/* MONTH SELECTOR */}
          <div style={styles.filterGroup}>
            <span style={styles.filterLabel}>Month</span>
            <div style={styles.monthsRow}>
              {months.map((m) => (
                <button
                  key={m}
                  type="button"
                  style={styles.monthChip(monthFilter === m)}
                  onClick={() => setMonthFilter(m)}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* RESET */}
          <div style={styles.filterGroup}>
            <span style={styles.filterLabel}>Reset filters</span>
            <button
              type="button"
              onClick={() => {
                setCategoryFilter("All");
                setCountryFilter("All Countries");
                setStatusFilter("All");
                setIsFreeFilter("all");
                setMonthFilter("All");
                setSearchTerm("");
              }}
              style={{
                padding: "7px 12px",
                borderRadius: 999,
                border: "none",
                background: "rgba(20,60,45,0.95)",
                color: "#f5fff9",
                fontSize: 12,
                cursor: "pointer",
                alignSelf: "flex-start",
              }}
            >
              Clear all
            </button>
          </div>
        </div>

        {/* MAPA */}
        <div style={styles.mapWrapper}>
          <div style={styles.mapTopBar}>
            <div style={styles.mapTopLeft}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>
                Map of events
              </span>
              <span style={{ fontSize: 11, opacity: 0.8 }}>
                Markers show events with a location. Drag and zoom the map to
                explore where the community meets.
              </span>
            </div>
          </div>

          <MapContainer
            center={mapCenter}
            zoom={6}
            scrollWheelZoom={true}
            style={styles.mapContainer}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            <MarkerClusterGroup chunkedLoading>
              {filteredEvents
                .filter((e) => e.latitude && e.longitude)
                .map((evt) => (
                  <Marker
                    key={evt.id}
                    position={[evt.latitude, evt.longitude]}
                    eventHandlers={{
                      click: () => navigate(`/event/${evt.id}`),
                    }}
                  />
                ))}
            </MarkerClusterGroup>
          </MapContainer>
        </div>

        {/* GRID */}
        <div style={styles.grid}>
          {!loading &&
            filteredEvents.map((evt) => {
              const status = getEventStatus(evt);
              const dateText = formatEventDateRange(evt);

              const isFree = evt.is_free || evt.price_from === 0 || evt.price_from === null;
              const priceLabel = isFree
                ? "Free event"
                : evt.price_from
                ? `From ${evt.price_from} €`
                : "Price on request";

              return (
                <div
                  key={evt.id}
                  style={styles.card}
                  onClick={() => navigate(`/event/${evt.id}`)}
                  onMouseEnter={(e) => {
                    const img = e.currentTarget.querySelector("img");
                    if (img) img.style.transform = "scale(1.06)";
                  }}
                  onMouseLeave={(e) => {
                    const img = e.currentTarget.querySelector("img");
                    if (img) img.style.transform = "scale(1.02)";
                  }}
                >
                  <div style={styles.imgWrapper}>
                    <img
                      src={getCover(evt)}
                      style={styles.img}
                      alt={evt.title}
                    />
                    <div style={styles.imgOverlayTop} />
                    <div style={styles.topTag}>
                      {evt.category || "Community Event"}
                    </div>
                  </div>

                  <div style={styles.cardBody}>
                    <div style={styles.statusPill(status)}>{status}</div>

                    <div style={styles.titleText}>{evt.title}</div>

                    <div style={styles.locationText}>
                      📍{" "}
                      {evt.location_name ||
                        evt.city ||
                        "Location to be announced"}
                      {evt.country ? ` · ${evt.country}` : ""}
                    </div>

                    <div style={styles.metaRow}>
                      <div style={styles.metaLeft}>
                        <span>📅 {dateText}</span>
                        {evt.organizer_name && (
                          <span>👤 {evt.organizer_name}</span>
                        )}
                      </div>

                      <div style={styles.metaRight}>
                        <div style={styles.priceText}>{priceLabel}</div>
                      </div>
                    </div>

                    <button
                      type="button"
                      style={styles.viewButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/event/${evt.id}`);
                      }}
                    >
                      View event
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}