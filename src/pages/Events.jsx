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
    "Charity Event",
  ];

  return (
    <div style={styles.page}>
      <div style={styles.bgGlow1} />
      <div style={styles.bgGlow2} />
      <div style={styles.bgGrid} />

      <div style={styles.container}>
        {/* HERO */}
        <div style={styles.hero}>
          <div style={styles.heroBadge}>⚡ LIVE OUTDOOR ENERGY</div>

          <h1 style={styles.title}>Outdoor Events</h1>

          <p style={styles.subtitle}>
            Real gatherings. Wild places. Good people. Find the next brutal
            adventure and jump in.
          </p>

          <div style={styles.heroStats}>
            <div style={styles.heroStatCard}>
              <div style={styles.heroStatNumber}>{filteredEvents.length}</div>
              <div style={styles.heroStatLabel}>Visible events</div>
            </div>

            <div style={styles.heroStatCard}>
              <div style={styles.heroStatNumber}>{events.length}</div>
              <div style={styles.heroStatLabel}>Total loaded</div>
            </div>

            <div style={styles.heroStatCard}>
              <div style={styles.heroStatNumber}>
                {events.reduce((sum, e) => sum + (e.attendees_count || 0), 0)}
              </div>
              <div style={styles.heroStatLabel}>People joining</div>
            </div>
          </div>

          {/* FILTERS */}
          <div style={styles.filtersWrap}>
            <Filter
              label="Country"
              value={countryFilter}
              open={showCountryList}
              setOpen={setShowCountryList}
              closeOther={setShowCategoryList}
              list={countries}
              onSelect={setCountryFilter}
            />
            <Filter
              label="Category"
              value={categoryFilter}
              open={showCategoryList}
              setOpen={setShowCategoryList}
              closeOther={setShowCountryList}
              list={categories}
              onSelect={setCategoryFilter}
            />
          </div>
        </div>

        {/* TOP ROW */}
        <div style={styles.topRow}>
          <div>
            <div style={styles.sectionEyebrow}>DISCOVER</div>
            <div style={styles.sectionTitle}>Brutal upcoming events</div>
          </div>

          <div style={styles.resultsPill}>
            <span style={styles.resultsDot} />
            {loading ? "Loading events..." : `${filteredEvents.length} shown`}
          </div>
        </div>

        {/* GRID */}
        <div style={styles.grid}>
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={styles.skeletonCard}>
                  <div style={styles.skeletonImage} />
                  <div style={styles.skeletonBody}>
                    <div style={styles.skeletonLineLg} />
                    <div style={styles.skeletonLineSm} />
                    <div style={styles.skeletonLineXs} />
                  </div>
                </div>
              ))
            : filteredEvents.map((evt) => {
                const attendees = evt.attendees || [];
                const visibleAvatars = attendees.filter((a) => a?.avatar_url).slice(0, 5);

                return (
                  <div
                    key={evt.id}
                    style={styles.card}
                    onClick={() => navigate(`/event/${evt.id}`)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-8px) scale(1.01)";
                      e.currentTarget.style.boxShadow =
                        "0 40px 120px rgba(0,0,0,0.72), 0 0 0 1px rgba(0,255,195,0.18) inset";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0) scale(1)";
                      e.currentTarget.style.boxShadow =
                        "0 28px 80px rgba(0,0,0,0.55)";
                    }}
                  >
                    <div style={styles.imageWrap}>
                      <img
                        src={evt.cover_url || DEFAULT_COVER}
                        alt={evt.title || "Event cover"}
                        style={styles.image}
                      />

                      <div style={styles.imageOverlay} />
                      <div style={styles.imageNoise} />

                      <div style={styles.topBadges}>
                        <div style={styles.categoryTag}>#{evt.category || "Event"}</div>
                        <div style={styles.livePill}>● LIVE</div>
                      </div>

                      <div style={styles.imageBottom}>
                        <div style={styles.locationChip}>
                          📍 {evt.city || evt.country || "Unknown location"}
                        </div>
                      </div>
                    </div>

                    <div style={styles.cardBody}>
                      <div style={styles.cardTitle}>{evt.title}</div>

                      <div style={styles.metaRow}>
                        <div style={styles.metaPill}>
                          🌍 {evt.country || "Country TBA"}
                        </div>
                        <div style={styles.metaPill}>
                          👥 {evt.attendees_count || 0} going
                        </div>
                      </div>

                      <div style={styles.divider} />

                      <div style={styles.bottomRow}>
                        <div style={styles.attendees}>
                          <div style={styles.avatars}>
                            {visibleAvatars.length > 0 ? (
                              visibleAvatars.map((a, i) => (
                                <img
                                  key={i}
                                  src={a.avatar_url}
                                  alt=""
                                  style={{
                                    ...styles.avatar,
                                    marginLeft: i === 0 ? 0 : -10,
                                    zIndex: 10 - i,
                                  }}
                                />
                              ))
                            ) : (
                              <div style={styles.emptyAvatars}>No attendees yet</div>
                            )}
                          </div>
                        </div>

                        <div style={styles.openBtn}>Open event →</div>
                      </div>
                    </div>
                  </div>
                );
              })}
        </div>

        {!loading && filteredEvents.length === 0 && (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>🌌</div>
            <div style={styles.emptyTitle}>No events for these filters</div>
            <div style={styles.emptyText}>
              Change country or category and load another adventure.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------- */
/* FILTER COMPONENT */
/* -------------------------------- */
function Filter({ label, value, open, setOpen, closeOther, list, onSelect }) {
  return (
    <div style={styles.filterShell}>
      <div style={styles.filterLabel}>{label}</div>

      <div
        style={styles.filterBox}
        onClick={() => {
          setOpen((p) => !p);
          closeOther(false);
        }}
      >
        <span style={styles.filterValue}>{value}</span>
        <span style={styles.filterArrow}>{open ? "▴" : "▾"}</span>
      </div>

      {open && (
        <div style={styles.dropdown}>
          {list.map((v) => (
            <div
              key={v}
              style={{
                ...styles.dropdownItem,
                background: value === v ? "rgba(0,255,190,0.12)" : "transparent",
                color: value === v ? "#cffff0" : "#eafff5",
              }}
              onClick={() => {
                onSelect(v);
                setOpen(false);
              }}
            >
              <span>{v}</span>
              {value === v && <span>✓</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* -------------------------------- */
/* STYLES – BRUTAL PREMIUM UI */
/* -------------------------------- */
const styles = {
  page: {
    position: "relative",
    minHeight: "100vh",
    overflow: "hidden",
    background:
      "radial-gradient(circle at top, #081b16 0%, #04100d 28%, #02060b 58%, #000000 100%)",
    color: "#eafff5",
    padding: "36px 18px 60px",
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  },

  container: {
    position: "relative",
    zIndex: 2,
    maxWidth: 1400,
    margin: "0 auto",
  },

  bgGlow1: {
    position: "absolute",
    top: -180,
    left: -160,
    width: 520,
    height: 520,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(0,255,190,0.16), transparent 68%)",
    filter: "blur(30px)",
    pointerEvents: "none",
  },

  bgGlow2: {
    position: "absolute",
    top: 40,
    right: -140,
    width: 500,
    height: 500,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(124,77,255,0.16), transparent 68%)",
    filter: "blur(40px)",
    pointerEvents: "none",
  },

  bgGrid: {
    position: "absolute",
    inset: 0,
    backgroundImage:
      "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
    backgroundSize: "36px 36px",
    maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)",
    pointerEvents: "none",
  },

  hero: {
    position: "relative",
    padding: "32px 24px 26px",
    borderRadius: 34,
    border: "1px solid rgba(255,255,255,0.08)",
    background:
      "linear-gradient(145deg, rgba(10,24,19,0.88), rgba(3,10,8,0.92))",
    boxShadow:
      "0 30px 120px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04)",
    overflow: "visible",
    marginBottom: 28,
  },

  heroBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 14px",
    borderRadius: 999,
    border: "1px solid rgba(0,255,190,0.28)",
    background: "rgba(0,255,190,0.08)",
    boxShadow: "0 0 24px rgba(0,255,190,0.12)",
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: "#b8fff0",
  },

  title: {
    marginTop: 18,
    fontSize: "clamp(34px, 6vw, 64px)",
    lineHeight: 0.96,
    fontWeight: 1000,
    letterSpacing: "-0.04em",
    color: "#f4fff9",
    textShadow: "0 6px 28px rgba(0,255,190,0.12)",
  },

  subtitle: {
    marginTop: 14,
    maxWidth: 760,
    color: "rgba(234,255,245,0.72)",
    fontSize: 16,
    lineHeight: 1.7,
    fontWeight: 500,
  },

  heroStats: {
    marginTop: 24,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
    gap: 14,
  },

  heroStatCard: {
    borderRadius: 22,
    padding: "16px 18px",
    border: "1px solid rgba(255,255,255,0.08)",
    background:
      "linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
    backdropFilter: "blur(10px)",
  },

  heroStatNumber: {
    fontSize: 28,
    fontWeight: 1000,
    color: "#ffffff",
    lineHeight: 1,
  },

  heroStatLabel: {
    marginTop: 6,
    fontSize: 12,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "rgba(234,255,245,0.62)",
    fontWeight: 800,
  },

  filtersWrap: {
    marginTop: 26,
    display: "flex",
    flexWrap: "wrap",
    gap: 16,
  },

  filterShell: {
    position: "relative",
    minWidth: 220,
  },

  filterLabel: {
    marginBottom: 8,
    fontSize: 11,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "rgba(234,255,245,0.58)",
    fontWeight: 900,
  },

  filterBox: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    minHeight: 52,
    padding: "0 18px",
    borderRadius: 999,
    border: "1px solid rgba(0,255,190,0.28)",
    background:
      "linear-gradient(135deg, rgba(0,0,0,0.78), rgba(0,255,190,0.10))",
    cursor: "pointer",
    fontWeight: 800,
    color: "#f3fff9",
    boxShadow:
      "0 0 22px rgba(0,255,190,0.12), inset 0 1px 0 rgba(255,255,255,0.05)",
    backdropFilter: "blur(12px)",
  },

  filterValue: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  filterArrow: {
    color: "#9effea",
    fontSize: 14,
    flexShrink: 0,
  },

  dropdown: {
    position: "absolute",
    top: 76,
    left: 0,
    right: 0,
    maxHeight: 320,
    overflowY: "auto",
    borderRadius: 22,
    background: "rgba(4,16,12,0.97)",
    border: "1px solid rgba(0,255,190,0.22)",
    boxShadow:
      "0 24px 80px rgba(0,0,0,0.72), 0 0 0 1px rgba(255,255,255,0.03) inset",
    zIndex: 1000,
    padding: 8,
    backdropFilter: "blur(14px)",
  },

  dropdownItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: "12px 14px",
    borderRadius: 14,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 700,
    transition: "background 0.2s ease",
  },

  topRow: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 18,
    flexWrap: "wrap",
    marginBottom: 22,
    paddingInline: 4,
  },

  sectionEyebrow: {
    fontSize: 11,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: "rgba(234,255,245,0.55)",
    fontWeight: 900,
  },

  sectionTitle: {
    marginTop: 8,
    fontSize: "clamp(22px, 3vw, 34px)",
    fontWeight: 1000,
    letterSpacing: "-0.03em",
    color: "#f3fff9",
  },

  resultsPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 16px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "rgba(234,255,245,0.84)",
    fontWeight: 800,
    fontSize: 13,
    boxShadow: "0 10px 28px rgba(0,0,0,0.28)",
  },

  resultsDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#00ffbe",
    boxShadow: "0 0 16px rgba(0,255,190,0.9)",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: 24,
  },

  card: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 30,
    cursor: "pointer",
    background:
      "linear-gradient(145deg, rgba(8,26,21,0.96), rgba(2,9,7,0.96))",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 28px 80px rgba(0,0,0,0.55)",
    transition: "transform 0.35s ease, box-shadow 0.35s ease",
  },

  imageWrap: {
    position: "relative",
    height: 240,
    overflow: "hidden",
  },

  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transform: "scale(1.06)",
    display: "block",
    filter: "saturate(1.08) contrast(1.04)",
  },

  imageOverlay: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.25) 45%, rgba(0,0,0,0.08) 100%)",
  },

  imageNoise: {
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(circle at 20% 20%, rgba(0,255,190,0.18), transparent 30%), radial-gradient(circle at 80% 10%, rgba(124,77,255,0.18), transparent 32%)",
    mixBlendMode: "screen",
  },

  topBadges: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap",
  },

  categoryTag: {
    padding: "7px 13px",
    borderRadius: 999,
    background: "rgba(0,255,190,0.14)",
    border: "1px solid rgba(0,255,190,0.34)",
    color: "#ccfff3",
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    backdropFilter: "blur(12px)",
  },

  livePill: {
    padding: "7px 12px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.16)",
    color: "#ffffff",
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: "0.08em",
    backdropFilter: "blur(10px)",
  },

  imageBottom: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
    display: "flex",
    justifyContent: "flex-start",
  },

  locationChip: {
    padding: "8px 14px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.14)",
    color: "#f5fff9",
    fontSize: 12,
    fontWeight: 800,
    backdropFilter: "blur(12px)",
    boxShadow: "0 12px 30px rgba(0,0,0,0.28)",
  },

  cardBody: {
    padding: 20,
  },

  cardTitle: {
    fontSize: 22,
    fontWeight: 1000,
    letterSpacing: "-0.03em",
    color: "#ffffff",
    lineHeight: 1.08,
  },

  metaRow: {
    marginTop: 14,
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },

  metaPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "rgba(234,255,245,0.82)",
    fontSize: 12,
    fontWeight: 800,
  },

  divider: {
    marginTop: 16,
    marginBottom: 16,
    height: 1,
    background:
      "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)",
  },

  bottomRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    flexWrap: "wrap",
  },

  attendees: {
    display: "flex",
    alignItems: "center",
    minHeight: 34,
  },

  avatars: {
    display: "flex",
    alignItems: "center",
  },

  avatar: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid rgba(0,255,190,0.78)",
    boxShadow: "0 0 16px rgba(0,255,190,0.22)",
  },

  emptyAvatars: {
    fontSize: 12,
    color: "rgba(234,255,245,0.52)",
    fontWeight: 700,
  },

  openBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px 14px",
    borderRadius: 999,
    background:
      "linear-gradient(135deg, rgba(0,255,190,0.16), rgba(124,77,255,0.14))",
    border: "1px solid rgba(255,255,255,0.10)",
    color: "#f5fff9",
    fontWeight: 900,
    fontSize: 12,
    letterSpacing: "0.04em",
    whiteSpace: "nowrap",
  },

  skeletonCard: {
    overflow: "hidden",
    borderRadius: 30,
    background:
      "linear-gradient(145deg, rgba(8,26,21,0.96), rgba(2,9,7,0.96))",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 28px 80px rgba(0,0,0,0.42)",
  },

  skeletonImage: {
    height: 240,
    background:
      "linear-gradient(90deg, rgba(255,255,255,0.04), rgba(255,255,255,0.08), rgba(255,255,255,0.04))",
  },

  skeletonBody: {
    padding: 20,
  },

  skeletonLineLg: {
    height: 24,
    width: "76%",
    borderRadius: 999,
    background: "rgba(255,255,255,0.08)",
  },

  skeletonLineSm: {
    marginTop: 12,
    height: 14,
    width: "48%",
    borderRadius: 999,
    background: "rgba(255,255,255,0.06)",
  },

  skeletonLineXs: {
    marginTop: 18,
    height: 34,
    width: "100%",
    borderRadius: 999,
    background: "rgba(255,255,255,0.05)",
  },

  emptyState: {
    marginTop: 20,
    padding: "44px 20px",
    borderRadius: 30,
    border: "1px solid rgba(255,255,255,0.08)",
    background:
      "linear-gradient(145deg, rgba(7,20,16,0.92), rgba(2,8,6,0.96))",
    boxShadow: "0 28px 80px rgba(0,0,0,0.46)",
    textAlign: "center",
  },

  emptyIcon: {
    fontSize: 48,
    marginBottom: 14,
  },

  emptyTitle: {
    fontSize: 24,
    fontWeight: 1000,
    color: "#ffffff",
    letterSpacing: "-0.03em",
  },

  emptyText: {
    marginTop: 10,
    fontSize: 14,
    color: "rgba(234,255,245,0.62)",
    lineHeight: 1.7,
  },
};