// src/pages/Events.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

const DEFAULT_COVER =
  "https://images.pexels.com/photos/3324422/pexels-photo-3324422.jpeg";

export default function Events() {
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [countryFilter, setCountryFilter] = useState("All countries");
  const [categoryFilter, setCategoryFilter] = useState("All categories");

  const [showCountryList, setShowCountryList] = useState(false);
  const [showCategoryList, setShowCategoryList] = useState(false);

  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  const countryRef = useRef(null);
  const categoryRef = useRef(null);

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

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

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

  useEffect(() => {
    const onClickOutside = (e) => {
      if (countryRef.current && !countryRef.current.contains(e.target)) {
        setShowCountryList(false);
      }

      if (categoryRef.current && !categoryRef.current.contains(e.target)) {
        setShowCategoryList(false);
      }
    };

    const onEsc = (e) => {
      if (e.key === "Escape") {
        setShowCountryList(false);
        setShowCategoryList(false);
      }
    };

    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEsc);

    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const now = Date.now();

  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      if (evt.end_time && new Date(evt.end_time) < now) return false;
      if (countryFilter !== "All countries" && evt.country !== countryFilter)
        return false;
      if (categoryFilter !== "All categories" && evt.category !== categoryFilter)
        return false;
      return true;
    });
  }, [events, countryFilter, categoryFilter, now]);

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
    "Meetup",
    "Festival",
    "Hiking Day",
    "Running Event",
    "Charity Event",
    "Outdoor Conference",
    "Workshop",
    "Retreat",
    "Charity Event",
    "Climbing Event",
    "Bike Gathering",
    "Community Event",
    "Ski School Event",
    "Paragliding School Event",
    "Diving School Event",
    "Climbing School Event",
    "Survival Training Event",
  ];

  const activeFilterCount =
    (countryFilter !== "All countries" ? 1 : 0) +
    (categoryFilter !== "All categories" ? 1 : 0);

  const totalPeopleJoining = events.reduce(
    (sum, e) => sum + (e.attendees_count || 0),
    0
  );

  const quickCategories = [
    "All categories",
    "Meetup",
    "Festival",
    "Workshop",
    "Hiking Day",
    "Running Event",
    "Charity Event",
    "Retreat",
    "Climbing Event",
    "Bike Gathering",
    "Community Event",
    "Ski School Event",
    "Paragliding School Event",
    "Diving School Event",
    "Climbing School Event",
    "Survival Training Event",
  ];

  const quickCountries = [
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
  ];

  const resetFilters = () => {
    setCountryFilter("All countries");
    setCategoryFilter("All categories");
    setShowCountryList(false);
    setShowCategoryList(false);
  };

  const isTrainingCategory = (category) => {
    return [
      "Ski School Event",
      "Paragliding School Event",
      "Diving School Event",
      "Climbing School Event",
      "Survival Training Event",
    ].includes(category);
  };

  const filterContent = (
    <div style={styles.filterRowDesktop}>
      <Filter
        label="Country"
        value={countryFilter}
        open={showCountryList}
        setOpen={setShowCountryList}
        closeOther={setShowCategoryList}
        list={countries}
        onSelect={setCountryFilter}
        isMobile={isMobile}
        innerRef={countryRef}
      />

      <Filter
        label="Category"
        value={categoryFilter}
        open={showCategoryList}
        setOpen={setShowCategoryList}
        closeOther={setShowCountryList}
        list={categories}
        onSelect={setCategoryFilter}
        isMobile={isMobile}
        innerRef={categoryRef}
      />

      {activeFilterCount > 0 && (
        <button
          type="button"
          style={styles.desktopResetBtn}
          onClick={resetFilters}
        >
          Reset all ({activeFilterCount})
        </button>
      )}
    </div>
  );

  return (
    <div style={styles.page}>
      <style>{`
        .events-hide-scrollbar::-webkit-scrollbar {
          display: none;
        }

        .events-dropdown-scroll::-webkit-scrollbar {
          width: 8px;
        }

        .events-dropdown-scroll::-webkit-scrollbar-thumb {
          background: rgba(170,255,228,0.18);
          border-radius: 999px;
        }

        .events-card-hover {
          transition: transform 0.35s ease, box-shadow 0.35s ease, border-color 0.35s ease;
        }

        .events-card-hover:hover {
          transform: translateY(-8px) scale(1.01);
          box-shadow:
            0 42px 120px rgba(0,0,0,0.72),
            0 0 0 1px rgba(0,255,195,0.18) inset,
            0 0 40px rgba(0,255,190,0.10);
          border-color: rgba(160,255,226,0.16);
        }

        .events-card-hover:hover img {
          transform: scale(1.1);
        }
      `}</style>

      <div style={styles.bgGlow1} />
      <div style={styles.bgGlow2} />
      <div style={styles.bgGlow3} />
      <div style={styles.bgGrid} />

      <div style={styles.container}>
        <div style={styles.hero}>
          <div style={styles.heroGlow} />
          <div style={styles.heroGlow2} />
          <div style={styles.heroLine} />

          <div style={styles.heroBadge}>⚡ LIVE OUTDOOR ENERGY</div>

          <h1 style={styles.title}>Outdoor Events</h1>

          <p style={styles.subtitle}>
            Real gatherings. Wild places. Good people. Find the next brutal
            adventure, training, school event or community experience and jump in.
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
              <div style={styles.heroStatNumber}>{totalPeopleJoining}</div>
              <div style={styles.heroStatLabel}>People joining</div>
            </div>
          </div>

          {!isMobile && (
            <>
              <div style={styles.quickSection}>
                <div style={styles.quickSectionHead}>
                  <div style={styles.quickSectionTitle}>Quick categories</div>
                  <div style={styles.quickSectionSub}>
                    Everything important in one brutal filter bar
                  </div>
                </div>

                <div
                  style={styles.quickRow}
                  className="events-hide-scrollbar"
                >
                  {quickCategories.map((chip) => {
                    const active = categoryFilter === chip;
                    const training = isTrainingCategory(chip);

                    return (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setCategoryFilter(chip)}
                        style={{
                          ...styles.quickChip,
                          ...(active ? styles.quickChipActive : {}),
                          ...(training ? styles.quickChipTraining : {}),
                          ...(active && training
                            ? styles.quickChipTrainingActive
                            : {}),
                        }}
                      >
                        {chip === "All categories" ? "All" : chip}
                      </button>
                    );
                  })}
                </div>

                <div
                  style={{ ...styles.quickRow, marginTop: 10 }}
                  className="events-hide-scrollbar"
                >
                  {quickCountries.map((chip) => {
                    const active = countryFilter === chip;
                    return (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setCountryFilter(chip)}
                        style={{
                          ...styles.quickChipSecondary,
                          ...(active ? styles.quickChipSecondaryActive : {}),
                        }}
                      >
                        {chip === "All countries" ? "Any country" : chip}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={styles.desktopFilterShell}>
                <div style={styles.desktopFilterTopRow}>
                  <div style={styles.desktopFilterTitle}>Advanced selectors</div>
                  <div style={styles.desktopFilterMeta}>
                    {loading ? "Loading…" : `${filteredEvents.length} shown`}
                  </div>
                </div>
                {filterContent}
              </div>
            </>
          )}
        </div>

        {isMobile && (
          <>
            <div style={styles.mobileResultsOnly}>
              <div style={styles.mobileResultsChip}>
                🔍 {loading ? "Loading..." : `${filteredEvents.length} shown`}
              </div>

              {activeFilterCount > 0 && (
                <button
                  type="button"
                  style={styles.mobileResetBtn}
                  onClick={resetFilters}
                >
                  Reset ({activeFilterCount})
                </button>
              )}
            </div>

            <div style={styles.mobileSwipeSection}>
              <div style={styles.mobileSwipeHeader}>
                <div style={styles.mobileSwipeTitle}>Quick categories</div>
                <div style={styles.mobileSwipeHint}>Swipe horizontally</div>
              </div>

              <div
                style={styles.mobileChipsRow}
                className="events-hide-scrollbar"
              >
                {quickCategories.map((chip) => {
                  const active = categoryFilter === chip;
                  const training = isTrainingCategory(chip);

                  return (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setCategoryFilter(chip)}
                      style={{
                        ...styles.mobileChip,
                        ...(active ? styles.mobileChipActive : {}),
                        ...(training ? styles.mobileChipTraining : {}),
                        ...(active && training
                          ? styles.mobileChipTrainingActive
                          : {}),
                      }}
                    >
                      {chip === "All categories" ? "All" : chip}
                    </button>
                  );
                })}
              </div>

              <div
                style={styles.mobileChipsRowSecondary}
                className="events-hide-scrollbar"
              >
                {quickCountries.map((chip) => {
                  const active = countryFilter === chip;
                  return (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setCountryFilter(chip)}
                      style={{
                        ...styles.mobileChipSecondary,
                        ...(active ? styles.mobileChipSecondaryActive : {}),
                      }}
                    >
                      {chip === "All countries" ? "Any country" : chip}
                    </button>
                  );
                })}
              </div>

              <div style={styles.mobileInlineFilters}>
                <Filter
                  label="Country"
                  value={countryFilter}
                  open={showCountryList}
                  setOpen={setShowCountryList}
                  closeOther={setShowCategoryList}
                  list={countries}
                  onSelect={setCountryFilter}
                  isMobile={true}
                  innerRef={countryRef}
                />

                <Filter
                  label="Category"
                  value={categoryFilter}
                  open={showCategoryList}
                  setOpen={setShowCategoryList}
                  closeOther={setShowCountryList}
                  list={categories}
                  onSelect={setCategoryFilter}
                  isMobile={true}
                  innerRef={categoryRef}
                />
              </div>
            </div>
          </>
        )}

        <div style={styles.topRow}>
          <div>
            <div style={styles.sectionEyebrow}>DISCOVER</div>
            <div style={styles.sectionTitle}>Brutal upcoming events</div>
          </div>

          {!isMobile && (
            <div style={styles.resultsPill}>
              <span style={styles.resultsDot} />
              {loading ? "Loading events..." : `${filteredEvents.length} shown`}
            </div>
          )}
        </div>

        <div
          style={isMobile ? styles.mobileCardsRow : styles.grid}
          className={isMobile ? "events-hide-scrollbar" : ""}
        >
          {loading
            ? Array.from({ length: isMobile ? 4 : 6 }).map((_, i) => (
                <div
                  key={i}
                  style={isMobile ? styles.mobileSkeletonCard : styles.skeletonCard}
                >
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
                const visibleAvatars = attendees
                  .filter((a) => a?.avatar_url)
                  .slice(0, 5);

                const training = isTrainingCategory(evt.category);

                return (
                  <div
                    key={evt.id}
                    style={isMobile ? styles.mobileCard : styles.card}
                    className={!isMobile ? "events-card-hover" : ""}
                    onClick={() => navigate(`/event/${evt.id}`)}
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
                        <div
                          style={{
                            ...styles.categoryTag,
                            ...(training ? styles.categoryTagTraining : {}),
                          }}
                        >
                          #{evt.category || "Event"}
                        </div>

                        <div
                          style={{
                            ...styles.livePill,
                            ...(training ? styles.trainingPill : {}),
                          }}
                        >
                          {training ? "● TRAINING" : "● LIVE"}
                        </div>
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
                        {training && (
                          <div
                            style={{
                              ...styles.metaPill,
                              ...styles.trainingMetaPill,
                            }}
                          >
                            🎓 School / Training
                          </div>
                        )}
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
                              <div style={styles.emptyAvatars}>
                                No attendees yet
                              </div>
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
              Change category or country and load another adventure.
            </div>

            <button
              type="button"
              style={styles.emptyResetBtn}
              onClick={resetFilters}
            >
              Reset filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Filter({
  label,
  value,
  open,
  setOpen,
  closeOther,
  list,
  onSelect,
  isMobile,
  innerRef,
}) {
  return (
    <div style={styles.filterShell} ref={innerRef}>
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
        <div
          style={{
            ...styles.dropdown,
            ...(isMobile ? styles.dropdownMobile : {}),
          }}
          className="events-dropdown-scroll"
        >
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

const styles = {
  page: {
    position: "relative",
    minHeight: "100vh",
    overflowX: "hidden",
    overflowY: "visible",
    marginTop: -100,
    padding: "72px 0 44px",
    background:
      "radial-gradient(circle at top, #0a1f19 0%, #05110e 26%, #02070b 58%, #000000 100%)",
    color: "#eafff5",
    fontFamily:
      'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },

  container: {
    position: "relative",
    zIndex: 2,
    maxWidth: 1400,
    margin: "0 auto",
    padding: "0 18px 24px",
    overflow: "visible",
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

  bgGlow3: {
    position: "absolute",
    bottom: -160,
    left: "20%",
    width: 420,
    height: 420,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(0,200,255,0.10), transparent 68%)",
    filter: "blur(45px)",
    pointerEvents: "none",
  },

  bgGrid: {
    position: "absolute",
    inset: 0,
    backgroundImage:
      "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
    backgroundSize: "36px 36px",
    maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)",
    pointerEvents: "none",
  },

  hero: {
    position: "relative",
    padding: "36px 24px 24px",
    borderRadius: "0 0 38px 38px",
    border: "1px solid rgba(255,255,255,0.08)",
    borderTop: "none",
    background:
      "linear-gradient(145deg, rgba(10,24,19,0.94), rgba(3,10,8,0.98))",
    boxShadow:
      "0 26px 80px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.04)",
    overflow: "visible",
    marginBottom: 24,
  },

  heroGlow: {
    position: "absolute",
    top: -120,
    right: -100,
    width: 260,
    height: 260,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(0,255,190,0.14), transparent 68%)",
    filter: "blur(24px)",
    pointerEvents: "none",
  },

  heroGlow2: {
    position: "absolute",
    left: -90,
    bottom: -110,
    width: 240,
    height: 240,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(124,77,255,0.14), transparent 70%)",
    filter: "blur(30px)",
    pointerEvents: "none",
  },

  heroLine: {
    position: "absolute",
    left: 24,
    right: 24,
    top: 0,
    height: 1,
    background:
      "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)",
    pointerEvents: "none",
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
    position: "relative",
    zIndex: 2,
  },

  title: {
    marginTop: 18,
    fontSize: "clamp(34px, 6vw, 64px)",
    lineHeight: 0.96,
    fontWeight: 1000,
    letterSpacing: "-0.04em",
    color: "#f4fff9",
    textShadow: "0 6px 28px rgba(0,255,190,0.12)",
    position: "relative",
    zIndex: 2,
  },

  subtitle: {
    marginTop: 14,
    maxWidth: 760,
    color: "rgba(234,255,245,0.72)",
    fontSize: 16,
    lineHeight: 1.72,
    fontWeight: 500,
    position: "relative",
    zIndex: 2,
  },

  heroStats: {
    marginTop: 24,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
    gap: 14,
    position: "relative",
    zIndex: 2,
  },

  heroStatCard: {
    borderRadius: 24,
    padding: "18px 18px",
    border: "1px solid rgba(255,255,255,0.08)",
    background:
      "linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
    boxShadow:
      "inset 0 1px 0 rgba(255,255,255,0.05), 0 10px 26px rgba(0,0,0,0.18)",
    backdropFilter: "blur(10px)",
  },

  heroStatNumber: {
    fontSize: 30,
    fontWeight: 1000,
    color: "#ffffff",
    lineHeight: 1,
  },

  heroStatLabel: {
    marginTop: 7,
    fontSize: 12,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "rgba(234,255,245,0.62)",
    fontWeight: 800,
  },

  quickSection: {
    marginTop: 24,
    padding: "18px",
    borderRadius: 26,
    border: "1px solid rgba(255,255,255,0.08)",
    background:
      "linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
    backdropFilter: "blur(14px)",
    boxShadow: "0 16px 40px rgba(0,0,0,0.24)",
  },

  quickSectionHead: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 12,
  },

  quickSectionTitle: {
    fontSize: 13,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: "rgba(234,255,245,0.82)",
    fontWeight: 900,
  },

  quickSectionSub: {
    fontSize: 12,
    color: "rgba(234,255,245,0.58)",
    fontWeight: 700,
  },

  quickRow: {
    display: "flex",
    gap: 10,
    overflowX: "auto",
    paddingBottom: 4,
    WebkitOverflowScrolling: "touch",
    scrollbarWidth: "none",
    msOverflowStyle: "none",
  },

  quickChip: {
    flex: "0 0 auto",
    minHeight: 42,
    padding: "0 16px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.05)",
    color: "rgba(234,255,245,0.88)",
    fontWeight: 800,
    fontSize: 12,
    whiteSpace: "nowrap",
    boxShadow: "0 10px 24px rgba(0,0,0,0.24)",
    cursor: "pointer",
  },

  quickChipActive: {
    background:
      "linear-gradient(135deg, rgba(0,255,190,0.16), rgba(124,77,255,0.16))",
    border: "1px solid rgba(0,255,190,0.30)",
    color: "#ffffff",
    boxShadow: "0 14px 30px rgba(0,255,190,0.18)",
  },

  quickChipTraining: {
    border: "1px solid rgba(124,77,255,0.20)",
    background: "rgba(124,77,255,0.08)",
  },

  quickChipTrainingActive: {
    background:
      "linear-gradient(135deg, rgba(124,77,255,0.24), rgba(0,255,190,0.16))",
    border: "1px solid rgba(170,130,255,0.34)",
    color: "#ffffff",
  },

  quickChipSecondary: {
    flex: "0 0 auto",
    minHeight: 38,
    padding: "0 14px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    color: "rgba(234,255,245,0.72)",
    fontWeight: 700,
    fontSize: 11,
    whiteSpace: "nowrap",
    cursor: "pointer",
  },

  quickChipSecondaryActive: {
    background: "rgba(0,255,190,0.12)",
    border: "1px solid rgba(0,255,190,0.22)",
    color: "#dffff5",
  },

  desktopFilterShell: {
    marginTop: 16,
    padding: "18px",
    borderRadius: 26,
    border: "1px solid rgba(255,255,255,0.08)",
    background:
      "linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
    backdropFilter: "blur(14px)",
    boxShadow: "0 16px 40px rgba(0,0,0,0.24)",
  },

  desktopFilterTopRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 14,
  },

  desktopFilterTitle: {
    fontSize: 13,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: "rgba(234,255,245,0.76)",
    fontWeight: 900,
  },

  desktopFilterMeta: {
    fontSize: 12,
    color: "rgba(234,255,245,0.60)",
    fontWeight: 700,
  },

  filterRowDesktop: {
    display: "grid",
    gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr) auto",
    gap: 16,
    alignItems: "end",
  },

  desktopResetBtn: {
    minHeight: 54,
    padding: "0 18px",
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.05)",
    color: "#f6fff9",
    fontWeight: 800,
    fontSize: 12,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  filterShell: {
    position: "relative",
    minWidth: 0,
    zIndex: 30,
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
    minHeight: 54,
    padding: "0 18px",
    borderRadius: 18,
    border: "1px solid rgba(0,255,190,0.22)",
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
    background: "rgba(4,16,12,0.98)",
    border: "1px solid rgba(0,255,190,0.22)",
    boxShadow:
      "0 24px 80px rgba(0,0,0,0.72), 0 0 0 1px rgba(255,255,255,0.03) inset",
    zIndex: 99999,
    padding: 8,
    backdropFilter: "blur(14px)",
  },

  dropdownMobile: {
    position: "relative",
    top: 10,
    left: "auto",
    right: "auto",
    maxHeight: 240,
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

  mobileResultsOnly: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 14,
  },

  mobileResultsChip: {
    minHeight: 50,
    padding: "0 14px",
    borderRadius: 16,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "rgba(234,255,245,0.88)",
    fontWeight: 800,
    fontSize: 12,
    display: "inline-flex",
    alignItems: "center",
    whiteSpace: "nowrap",
  },

  mobileResetBtn: {
    minHeight: 50,
    padding: "0 14px",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.10)",
    background:
      "linear-gradient(145deg, rgba(7,22,17,0.96), rgba(3,11,8,0.96))",
    color: "#f5fff9",
    fontWeight: 900,
    fontSize: 12,
    cursor: "pointer",
  },

  mobileSwipeSection: {
    marginBottom: 20,
    padding: "14px 12px",
    borderRadius: 22,
    border: "1px solid rgba(255,255,255,0.07)",
    background:
      "linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
    boxShadow: "0 16px 36px rgba(0,0,0,0.18)",
  },

  mobileSwipeHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
    paddingInline: 2,
  },

  mobileSwipeTitle: {
    fontSize: 12,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: "rgba(234,255,245,0.88)",
    fontWeight: 900,
  },

  mobileSwipeHint: {
    fontSize: 11,
    color: "rgba(234,255,245,0.58)",
    fontWeight: 700,
  },

  mobileChipsRow: {
    display: "flex",
    gap: 10,
    overflowX: "auto",
    paddingBottom: 6,
    paddingLeft: 2,
    paddingRight: 2,
    WebkitOverflowScrolling: "touch",
    scrollbarWidth: "none",
    msOverflowStyle: "none",
  },

  mobileChipsRowSecondary: {
    display: "flex",
    gap: 10,
    overflowX: "auto",
    paddingTop: 10,
    paddingBottom: 8,
    paddingLeft: 2,
    paddingRight: 2,
    WebkitOverflowScrolling: "touch",
    scrollbarWidth: "none",
    msOverflowStyle: "none",
  },

  mobileChip: {
    flex: "0 0 auto",
    minHeight: 42,
    padding: "0 16px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.05)",
    color: "rgba(234,255,245,0.88)",
    fontWeight: 800,
    fontSize: 12,
    whiteSpace: "nowrap",
    boxShadow: "0 10px 24px rgba(0,0,0,0.24)",
    cursor: "pointer",
  },

  mobileChipActive: {
    background:
      "linear-gradient(135deg, rgba(0,255,190,0.16), rgba(124,77,255,0.16))",
    border: "1px solid rgba(0,255,190,0.30)",
    color: "#ffffff",
    boxShadow: "0 14px 30px rgba(0,255,190,0.18)",
  },

  mobileChipTraining: {
    border: "1px solid rgba(124,77,255,0.20)",
    background: "rgba(124,77,255,0.08)",
  },

  mobileChipTrainingActive: {
    background:
      "linear-gradient(135deg, rgba(124,77,255,0.24), rgba(0,255,190,0.16))",
    border: "1px solid rgba(170,130,255,0.34)",
    color: "#ffffff",
  },

  mobileChipSecondary: {
    flex: "0 0 auto",
    minHeight: 38,
    padding: "0 14px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    color: "rgba(234,255,245,0.70)",
    fontWeight: 700,
    fontSize: 11,
    whiteSpace: "nowrap",
    cursor: "pointer",
  },

  mobileChipSecondaryActive: {
    background: "rgba(0,255,190,0.12)",
    border: "1px solid rgba(0,255,190,0.22)",
    color: "#dffff5",
  },

  mobileInlineFilters: {
    marginTop: 12,
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 12,
  },

  topRow: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 18,
    flexWrap: "wrap",
    marginBottom: 20,
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

  mobileCardsRow: {
    display: "flex",
    gap: 16,
    overflowX: "auto",
    paddingBottom: 10,
    paddingLeft: 2,
    paddingRight: 2,
    WebkitOverflowScrolling: "touch",
    scrollbarWidth: "none",
    msOverflowStyle: "none",
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
  },

  mobileCard: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 30,
    cursor: "pointer",
    background:
      "linear-gradient(145deg, rgba(8,26,21,0.98), rgba(2,9,7,0.98))",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 28px 80px rgba(0,0,0,0.55)",
    flex: "0 0 84%",
    minWidth: "84%",
    maxWidth: "84%",
  },

  imageWrap: {
    position: "relative",
    height: 250,
    overflow: "hidden",
  },

  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transform: "scale(1.06)",
    display: "block",
    filter: "saturate(1.08) contrast(1.04)",
    transition: "transform 0.45s ease",
  },

  imageOverlay: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(to top, rgba(0,0,0,0.94) 0%, rgba(0,0,0,0.26) 45%, rgba(0,0,0,0.06) 100%)",
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

  categoryTagTraining: {
    background: "rgba(124,77,255,0.18)",
    border: "1px solid rgba(170,130,255,0.34)",
    color: "#f0e5ff",
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

  trainingPill: {
    background: "rgba(124,77,255,0.18)",
    border: "1px solid rgba(170,130,255,0.34)",
    color: "#f0e5ff",
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
    padding: 22,
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

  trainingMetaPill: {
    background: "rgba(124,77,255,0.12)",
    border: "1px solid rgba(170,130,255,0.24)",
    color: "#efe4ff",
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

  mobileSkeletonCard: {
    overflow: "hidden",
    borderRadius: 30,
    background:
      "linear-gradient(145deg, rgba(8,26,21,0.96), rgba(2,9,7,0.96))",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 28px 80px rgba(0,0,0,0.42)",
    flex: "0 0 84%",
    minWidth: "84%",
    maxWidth: "84%",
  },

  skeletonImage: {
    height: 250,
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

  emptyResetBtn: {
    marginTop: 18,
    minHeight: 46,
    padding: "0 18px",
    borderRadius: 16,
    border: "none",
    background: "linear-gradient(135deg, #00ffbe, #52d6ff, #7c4dff)",
    color: "#042217",
    fontWeight: 1000,
    fontSize: 13,
    boxShadow: "0 14px 34px rgba(0,255,190,0.20)",
    cursor: "pointer",
  },
};