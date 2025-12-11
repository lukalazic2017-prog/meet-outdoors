// src/pages/Events.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function Events() {
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // FILTERS
  const [searchQuery, setSearchQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState("All countries");
  const [categoryFilter, setCategoryFilter] = useState("All categories");
  const [priceFilter, setPriceFilter] = useState("all"); // all | free | paid
  const [statusFilter, setStatusFilter] = useState("All"); // All | Upcoming | Live now | Ended
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");

  const [showCountryList, setShowCountryList] = useState(false);
  const [showCategoryList, setShowCategoryList] = useState(false);

  // ---------------------------------------------------------
  // 1️⃣ LOAD EVENTS
  // ---------------------------------------------------------
  async function loadEvents() {
    setLoading(true);

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
  // 2️⃣ STATUS HELPER – isti kao u EventDetails
  // ---------------------------------------------------------
  function getEventStatus(evt) {
    if (!evt) return "";
    const now = new Date();
    const start = evt.start_time ? new Date(evt.start_time) : null;
    const end = evt.end_time ? new Date(evt.end_time) : null;

    if (!start && !end) return "Upcoming";

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

  function formatCardDate(evt) {
    if (!evt) return "";
    const optsDate = {
      day: "2-digit",
      month: "short",
      year: "numeric",
    };
    const optsTime = {
      hour: "2-digit",
      minute: "2-digit",
    };

    const start = evt.start_time ? new Date(evt.start_time) : null;
    const end = evt.end_time ? new Date(evt.end_time) : null;

    if (!start && !end) return "Date & time TBA";

    if (start && !end) {
      return (
        start.toLocaleDateString(undefined, optsDate) +
        " · " +
        start.toLocaleTimeString(undefined, optsTime)
      );
    }

    if (!start && end) {
      return (
        end.toLocaleDateString(undefined, optsDate) +
        " · " +
        end.toLocaleTimeString(undefined, optsTime)
      );
    }

    if (start && end) {
      const sameDay = start.toDateString() === end.toDateString();
      if (sameDay) {
        return (
          start.toLocaleDateString(undefined, optsDate) +
          " · " +
          start.toLocaleTimeString(undefined, optsTime) +
          " – " +
          end.toLocaleTimeString(undefined, optsTime)
        );
      }
      return (
        start.toLocaleDateString(undefined, optsDate) +
        " – " +
        end.toLocaleDateString(undefined, optsDate)
      );
    }

    return "Date & time TBA";
  }

  // ---------------------------------------------------------
  // 3️⃣ FILTERS – front-end filtriranje
  // ---------------------------------------------------------
  const filteredEvents = events.filter((evt) => {
    const title = evt.title || "";
    const city = evt.city || "";
    const country = evt.country || "";
    const category = evt.category || "";

    // search
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      q.length === 0 ||
      title.toLowerCase().includes(q) ||
      city.toLowerCase().includes(q) ||
      country.toLowerCase().includes(q);

    // country
    const matchesCountry =
      countryFilter === "All countries" ||
      country === countryFilter;

    // category
    const matchesCategory =
      categoryFilter === "All categories" ||
      category === categoryFilter;

    // price
    let matchesPrice = true;
    const isFree =
      evt.is_free === true ||
      evt.price_from === 0 ||
      evt.price_from === null ||
      evt.price_from === undefined;

    if (priceFilter === "free") {
      matchesPrice = isFree;
    } else if (priceFilter === "paid") {
      matchesPrice = !isFree;
    }

    // status
    const status = getEventStatus(evt);
    const matchesStatus =
      statusFilter === "All" || statusFilter === status;

    // date filters – gledamo start_time
    let matchesDate = true;
    const start = evt.start_time ? new Date(evt.start_time) : null;

    if (startDateFilter) {
      const from = new Date(startDateFilter);
      if (!start || start < from) {
        matchesDate = false;
      }
    }

    if (endDateFilter) {
      const to = new Date(endDateFilter);
      if (!start || start > to) {
        matchesDate = false;
      }
    }

    return (
      matchesSearch &&
      matchesCountry &&
      matchesCategory &&
      matchesPrice &&
      matchesStatus &&
      matchesDate
    );
  });

  // ---------------------------------------------------------
  // 4️⃣ STATIC LISTS
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

  const categories = [
    "All categories",
    "Festival",
    "Meetup",
    "Workshop",
    "Conference",
    "Outdoor Expo",
    "Trail Running",
    "Climbing Day",
    "Kayak Gathering",
    "Hiking Meetup",
    "Community Event",
    "Charity Event",
    "Other",
  ];

  // ---------------------------------------------------------
  // 5️⃣ STYLES
  // ---------------------------------------------------------
  const styles = {
    page: {
      minHeight: "100vh",
      padding: "32px 16px 48px",
      background:
        "radial-gradient(circle at top, #02140f 0%, #010508 45%, #000000 100%)",
      display: "flex",
      justifyContent: "center",
      color: "#f3f8f5",
      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    },
    container: {
      width: "100%",
      maxWidth: 1180,
    },
    header: {
      marginBottom: 22,
    },
    badge: {
      display: "inline-flex",
      alignItems: "center",
      padding: "4px 10px",
      borderRadius: 999,
      border: "1px solid rgba(110,186,150,0.8)",
      background: "rgba(8,40,26,0.85)",
      fontSize: 11,
      letterSpacing: "0.16em",
      textTransform: "uppercase",
      color: "rgba(214,244,227,0.9)",
      marginBottom: 8,
    },
    titleRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-end",
      gap: 16,
      flexWrap: "wrap",
    },
    titleBox: {
      flex: "1 1 260px",
    },
    title: {
      fontSize: 30,
      fontWeight: 800,
      color: "#f9fefb",
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 14,
      color: "rgba(220,240,230,0.8)",
    },
    statsRow: {
      display: "flex",
      gap: 14,
      flexWrap: "wrap",
      fontSize: 12,
      color: "rgba(220,240,230,0.9)",
    },
    statPill: {
      padding: "6px 10px",
      borderRadius: 999,
      background: "rgba(15,52,38,0.9)",
      border: "1px solid rgba(110,186,150,0.65)",
    },

    // FILTER BAR
    filterBar: {
      marginTop: 20,
      marginBottom: 18,
      padding: 14,
      borderRadius: 18,
      background: "rgba(4,18,12,0.96)",
      border: "1px solid rgba(60,120,90,0.7)",
      display: "grid",
      gridTemplateColumns: "2fr 2fr 1.5fr 1.5fr",
      gap: 12,
    },
    filterGroup: {
      display: "flex",
      flexDirection: "column",
      position: "relative",
      fontSize: 12,
      color: "rgba(220,240,230,0.86)",
    },
    filterLabel: {
      marginBottom: 4,
      opacity: 0.85,
    },
    searchInput: {
      width: "100%",
      padding: "8px 12px",
      borderRadius: 999,
      border: "1px solid rgba(110,186,150,0.7)",
      background: "rgba(5,23,16,1)",
      color: "#f3f8f5",
      fontSize: 13,
      outline: "none",
    },
    dropdownBox: {
      padding: "8px 12px",
      borderRadius: 999,
      background: "rgba(5,23,16,1)",
      border: "1px solid rgba(110,186,150,0.7)",
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
      background: "rgba(2,12,8,0.98)",
      borderRadius: 16,
      border: "1px solid rgba(110,186,150,0.8)",
      zIndex: 9999,
      boxShadow: "0 18px 50px rgba(0,0,0,0.85)",
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
      background: "rgba(5,23,16,1)",
      border: "1px solid rgba(110,186,150,0.7)",
      gap: 4,
      flexWrap: "wrap",
    },
    segButton: (active) => ({
      padding: "5px 9px",
      borderRadius: 999,
      fontSize: 11,
      border: "none",
      cursor: "pointer",
      background: active ? "rgba(118,196,149,1)" : "transparent",
      color: active ? "#05150d" : "rgba(220,240,230,0.85)",
      fontWeight: active ? 700 : 500,
      whiteSpace: "nowrap",
    }),
    dateRow: {
      display: "flex",
      gap: 6,
    },
    dateInput: {
      flex: 1,
      padding: "7px 10px",
      borderRadius: 999,
      border: "1px solid rgba(110,186,150,0.7)",
      background: "rgba(5,23,16,1)",
      color: "#f3f8f5",
      fontSize: 12,
    },
    resetButton: {
      padding: "7px 12px",
      borderRadius: 999,
      border: "none",
      background: "rgba(20,60,45,0.95)",
      color: "#f5fff9",
      fontSize: 12,
      cursor: "pointer",
      alignSelf: "flex-start",
      marginTop: 6,
    },

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
        "linear-gradient(145deg, rgba(4,16,11,0.98), rgba(7,29,20,0.98))",
      border: "1px solid rgba(70,130,100,0.7)",
      cursor: "pointer",
      boxShadow: "0 16px 40px rgba(0,0,0,0.85)",
      display: "flex",
      flexDirection: "column",
      transition: "transform 0.2s ease-out, box-shadow 0.2s ease-out",
    },
    cardHover: {
      transform: "translateY(-3px)",
      boxShadow: "0 20px 55px rgba(0,0,0,0.95)",
    },
    imgWrapper: { height: 170, position: "relative", overflow: "hidden" },
    img: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      transform: "scale(1.03)",
      transition: "transform 0.35s ease-out",
    },
    imgOverlay: {
      position: "absolute",
      inset: 0,
      background:
        "linear-gradient(to top, rgba(0,0,0,0.86), rgba(0,0,0,0.12))",
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
        bg = "rgba(40,90,70,0.92)";
        border = "rgba(150,220,180,0.95)";
      } else if (status === "Live now") {
        bg = "rgba(120,130,40,0.92)";
        border = "rgba(210,230,150,0.95)";
      } else if (status === "Ended") {
        bg = "rgba(40,40,40,0.9)";
        border = "rgba(140,140,140,0.9)";
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
      color: "rgba(200,220,210,0.8)",
      textAlign: "right",
    },
    priceText: {
      fontWeight: 600,
    },
    categoryPill: {
      display: "inline-flex",
      padding: "3px 8px",
      borderRadius: 999,
      border: "1px solid rgba(130,200,170,0.9)",
      fontSize: 11,
      color: "rgba(230,248,240,0.96)",
      marginTop: 4,
    },
    emptyState: {
      marginTop: 30,
      textAlign: "center",
      color: "rgba(225,240,230,0.8)",
      fontSize: 14,
    },

    // Floating button
    floatingButton: {
      position: "fixed",
      right: 24,
      bottom: 24,
      borderRadius: 999,
      padding: "10px 20px",
      background:
        "linear-gradient(120deg, #a4e3c2, #6bc19a, #3f8d6a)",
      color: "#032013",
      fontSize: 14,
      fontWeight: 800,
      border: "none",
      cursor: "pointer",
      boxShadow: "0 20px 40px rgba(0,0,0,0.85)",
      display: "flex",
      alignItems: "center",
      gap: 8,
      zIndex: 998,
    },

    // Skeletons
    skeletonCard: {
      borderRadius: 18,
      padding: 0,
      overflow: "hidden",
      background:
        "linear-gradient(145deg, rgba(4,16,11,0.85), rgba(7,29,20,0.9))",
      border: "1px solid rgba(70,130,100,0.6)",
    },
    skeletonBlock: (height, marginTop = 8, width = "100%") => ({
      height,
      width,
      borderRadius: 999,
      marginTop,
      background:
        "linear-gradient(90deg, rgba(40,60,50,0.6), rgba(80,120,95,0.4), rgba(40,60,50,0.6))",
      backgroundSize: "200% 100%",
      animation: "mo-skeleton 1.2s ease-in-out infinite",
    }),
  };

  // inline keyframes for skeleton
  const skeletonKeyframes = `
    @keyframes mo-skeleton {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `;

  // STATS
  const stats = {
    total: filteredEvents.length,
    upcoming: filteredEvents.filter(
      (e) => getEventStatus(e) === "Upcoming"
    ).length,
    live: filteredEvents.filter(
      (e) => getEventStatus(e) === "Live now"
    ).length,
    ended: filteredEvents.filter(
      (e) => getEventStatus(e) === "Ended"
    ).length,
  };

  const getCover = (evt) =>
    evt.cover_url ||
    "https://images.pexels.com/photos/3324422/pexels-photo-3324422.jpeg";

  return (
    <div style={styles.page}>
      {/* keyframes for skeleton */}
      <style>{skeletonKeyframes}</style>

      <div style={styles.container}>
        {/* HEADER */}
        <div style={styles.header}>
          <div style={styles.badge}>Events · MeetOutdoors</div>

          <div style={styles.titleRow}>
            <div style={styles.titleBox}>
              <h1 style={styles.title}>Discover outdoor events around you.</h1>
              <p style={styles.subtitle}>
                Browse community meetups, festivals, workshops and outdoor
                gatherings. Filter by country, category, date and price.
              </p>
            </div>

            <div style={styles.statsRow}>
              <div style={styles.statPill}>
                Total: <strong>{stats.total}</strong>
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

        {/* FILTER BAR */}
        <div style={styles.filterBar}>
          {/* SEARCH */}
          <div style={styles.filterGroup}>
            <span style={styles.filterLabel}>Search</span>
            <input
              type="text"
              placeholder="Search by title, city or country..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
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
                          ? "rgba(20,70,50,0.9)"
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
                {categories.map((cat) => (
                  <div
                    key={cat}
                    style={{
                      ...styles.dropdownItem,
                      backgroundColor:
                        cat === categoryFilter
                          ? "rgba(20,70,50,0.9)"
                          : "transparent",
                    }}
                    onClick={() => {
                      setCategoryFilter(cat);
                      setShowCategoryList(false);
                    }}
                  >
                    {cat}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PRICE & STATUS */}
          <div style={styles.filterGroup}>
            <span style={styles.filterLabel}>Price & status</span>

            {/* PRICE */}
            <div style={styles.segmented}>
              {[
                { key: "all", label: "All" },
                { key: "free", label: "Free" },
                { key: "paid", label: "Paid" },
              ].map((p) => (
                <button
                  key={p.key}
                  type="button"
                  style={styles.segButton(priceFilter === p.key)}
                  onClick={() => setPriceFilter(p.key)}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* STATUS */}
            <div style={{ marginTop: 6, ...styles.segmented }}>
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
          </div>

          {/* DATES + RESET */}
          <div style={styles.filterGroup}>
            <span style={styles.filterLabel}>Date range (start)</span>
            <div style={styles.dateRow}>
              <input
                type="date"
                value={startDateFilter}
                onChange={(e) => setStartDateFilter(e.target.value)}
                style={styles.dateInput}
              />
              <input
                type="date"
                value={endDateFilter}
                onChange={(e) => setEndDateFilter(e.target.value)}
                style={styles.dateInput}
              />
            </div>
            <button
              type="button"
              style={styles.resetButton}
              onClick={() => {
                setSearchQuery("");
                setCountryFilter("All countries");
                setCategoryFilter("All categories");
                setPriceFilter("all");
                setStatusFilter("All");
                setStartDateFilter("");
                setEndDateFilter("");
              }}
            >
              Clear filters
            </button>
          </div>
        </div>

        {/* GRID / CONTENT */}
        <div style={styles.grid}>
          {loading &&
            [1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} style={styles.skeletonCard}>
                <div style={{ height: 170, background: "rgba(20,30,25,0.9)" }} />
                <div style={{ padding: 14 }}>
                  <div style={styles.skeletonBlock(16, 0, "30%")} />
                  <div style={styles.skeletonBlock(14, 10, "80%")} />
                  <div style={styles.skeletonBlock(12, 8, "60%")} />
                </div>
              </div>
            ))}

          {!loading &&
            filteredEvents.map((evt) => {
              const status = getEventStatus(evt);
              const dateText = formatCardDate(evt);

              let priceLabel = "Price on request";
              if (evt.is_free === true) {
                priceLabel = "Free event";
              } else if (
                typeof evt.price_from === "number" &&
                evt.price_from > 0
              ) {
                priceLabel = `From ${evt.price_from} €`;
              }

              return (
                <div
                  key={evt.id}
                  style={styles.card}
                  onClick={() => navigate(`/event/${evt.id}`)}
                  onMouseEnter={(e) => {
                    const card = e.currentTarget;
                    const img = card.querySelector("img");
                    card.style.transform = styles.cardHover.transform;
                    card.style.boxShadow = styles.cardHover.boxShadow;
                    if (img) img.style.transform = "scale(1.06)";
                  }}
                  onMouseLeave={(e) => {
                    const card = e.currentTarget;
                    const img = card.querySelector("img");
                    card.style.transform = "none";
                    card.style.boxShadow = styles.card.boxShadow;
                    if (img) img.style.transform = "scale(1.03)";
                  }}
                >
                  <div style={styles.imgWrapper}>
                    <img
                      src={getCover(evt)}
                      alt={evt.title}
                      style={styles.img}
                    />
                    <div style={styles.imgOverlay} />
                  </div>

                  <div style={styles.cardBody}>
                    <div style={styles.statusPill(status)}>{status}</div>

                    <div style={styles.titleText}>{evt.title}</div>

                    <div style={styles.locationText}>
                      📍{" "}
                      {evt.location_name ||
                        (evt.city && evt.country
                          ? `${evt.city}, ${evt.country}`
                          : evt.country || "Location to be announced")}
                    </div>

                    <div style={styles.metaRow}>
                      <div style={styles.metaLeft}>
                        <span>🕒 {dateText}</span>
                        {evt.category && (
                          <span style={styles.categoryPill}>
                            #{evt.category.replace(/\s+/g, "")}
                          </span>
                        )}
                      </div>
                      <div style={styles.metaRight}>
                        <span style={styles.priceText}>{priceLabel}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        {!loading && filteredEvents.length === 0 && (
          <div style={styles.emptyState}>
            <div style={{ fontSize: 34, marginBottom: 8 }}>🗺️</div>
            <div>No events match your search right now.</div>
            <div style={{ marginTop: 4, fontSize: 13 }}>
              Try changing filters or come back later – new events are added
              over time.
            </div>
          </div>
        )}
      </div>

      {/* FLOATING CREATE EVENT BUTTON */}
      <button
        type="button"
        style={styles.floatingButton}
        onClick={() => navigate("/create-event")}
      >
        <span
          style={{
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: "#032013",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
          }}
        >
          +
        </span>
        <span>Create event</span>
      </button>
    </div>
  );
}