// src/pages/Tours.jsx
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  MapContainer,
  TileLayer,
  Marker,
  Circle,
  useMapEvents,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";

export default function Tours() {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activityFilter, setActivityFilter] = useState("All Activities");
  const [countryFilter, setCountryFilter] = useState("All Countries");
  const [statusFilter, setStatusFilter] = useState("All");
  const [capacityFilter, setCapacityFilter] = useState("all");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");

  const [showActivityList, setShowActivityList] = useState(false);
  const [showCountryList, setShowCountryList] = useState(false);
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  const [radiusKm, setRadiusKm] = useState(0);
  const [radiusCenter, setRadiusCenter] = useState([43.9, 21.0]);

  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  const mapCenter = [43.9, 21.0];
  const navigate = useNavigate();

  useEffect(() => {
    const onResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  function distanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function MapClickCenter() {
    useMapEvents({
      click(e) {
        setRadiusCenter([e.latlng.lat, e.latlng.lng]);
      },
    });
    return null;
  }

  const getOutdoorMarkerIcon = () =>
    L.divIcon({
      html: `
        <div style="
          width:42px;
          height:42px;
          border-radius:999px;
          background: radial-gradient(circle at 30% 30%, rgba(0,255,190,1), rgba(0,120,88,1));
          border:2px solid rgba(5,20,14,0.95);
          box-shadow: 0 16px 34px rgba(0,0,0,0.55), 0 0 18px rgba(0,255,190,0.45);
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:18px;
          color:#042217;
          font-weight:900;
        ">
          🧭
        </div>
      `,
      className: "",
      iconSize: [42, 42],
      iconAnchor: [21, 21],
    });

  async function loadTours() {
    const { data, error } = await supabase
      .from("tours")
      .select(
        `
        *,
        profiles:creator_id (
          full_name,
          avatar_url
        )
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.log("Load tours error:", error);
      setTours([]);
    } else {
      setTours(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadTours();
  }, []);

  function getStatus(tour) {
    const now = new Date();

    const start = tour.start_date ? new Date(tour.start_date) : null;
    const end = tour.end_date ? new Date(tour.end_date) : null;

    if (!start && !end) return "Upcoming";

    if (start && !end) {
      if (now < start) return "Upcoming";
      if (now >= start) return "In progress";
    }

    if (!start && end) {
      if (now <= end) return "In progress";
      return "Expired";
    }

    if (start && end) {
      if (now < start) return "Upcoming";
      if (now >= start && now <= end) return "In progress";
      if (now > end) return "Expired";
    }

    return "Upcoming";
  }

  function hasAvailableSpots(tour) {
    const max = tour.max_participants ?? tour.capacity ?? tour.max_people ?? null;
    const booked =
      tour.current_participants ?? tour.booked_count ?? tour.attendees_count ?? 0;

    if (!max) return true;
    return booked < max;
  }

  const filteredTours = useMemo(
    () =>
      tours.filter((tour) => {
        const tourActivity = tour.activity ?? "";
        const tourCountry = tour.country ?? "";

        const matchActivity =
          activityFilter === "All Activities" || tourActivity === activityFilter;

        const matchCountry =
          countryFilter === "All Countries" || tourCountry === countryFilter;

        const status = getStatus(tour);
        const matchStatus = statusFilter === "All" || statusFilter === status;

        let matchDate = true;
        if (startDateFilter) {
          const start = tour.start_date ? new Date(tour.start_date) : null;
          if (!start || start < new Date(startDateFilter)) {
            matchDate = false;
          }
        }
        if (endDateFilter) {
          const start = tour.start_date ? new Date(tour.start_date) : null;
          if (!start || start > new Date(endDateFilter)) {
            matchDate = false;
          }
        }

        const matchCapacity =
          capacityFilter === "all" ? true : hasAvailableSpots(tour);

        let matchRadius = true;
        if (radiusKm > 0) {
          const lat = tour.latitude;
          const lng = tour.longitude;
          if (!lat || !lng) {
            matchRadius = false;
          } else {
            const d = distanceKm(radiusCenter[0], radiusCenter[1], lat, lng);
            matchRadius = d <= radiusKm;
          }
        }

        return (
          matchActivity &&
          matchCountry &&
          matchStatus &&
          matchDate &&
          matchCapacity &&
          matchRadius
        );
      }),
    [
      tours,
      activityFilter,
      countryFilter,
      statusFilter,
      startDateFilter,
      endDateFilter,
      capacityFilter,
      radiusKm,
      radiusCenter,
    ]
  );

  const getCover = (tour) =>
    tour.cover_url ??
    tour.image_url ??
    "https://images.pexels.com/photos/2387873/pexels-photo-2387873.jpeg";

  const activities = [
    "All Activities",
    "Hiking",
    "Cycling",
    "Bicycling",
    "Running / Marathon",
    "Pilgrimage",
    "Camping",
    "Rafting",
    "Kayaking",
    "Quad Riding",
    "Horse Riding",
    "Climbing",
    "Canyoning",
    "Paragliding",
    "Parasailing",
    "Skiing & Snowboarding",
    "Water Skiing",
    "Surfing",
    "Diving",
    "Snorkeling",
    "Boat Rides",
    "Road Trip",
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

  const mobileQuickActivities = [
    "All Activities",
    "Hiking",
    "Cycling",
    "Camping",
    "Kayaking",
    "Climbing",
    "Road Trip",
    "Other",
  ];

  const activeFilterCount =
    (activityFilter !== "All Activities" ? 1 : 0) +
    (countryFilter !== "All Countries" ? 1 : 0) +
    (statusFilter !== "All" ? 1 : 0) +
    (capacityFilter !== "all" ? 1 : 0) +
    (startDateFilter ? 1 : 0) +
    (endDateFilter ? 1 : 0) +
    (radiusKm > 0 ? 1 : 0);

  const stats = {
    total: filteredTours.length,
    upcoming: filteredTours.filter((t) => getStatus(t) === "Upcoming").length,
    inProgress: filteredTours.filter((t) => getStatus(t) === "In progress")
      .length,
    expired: filteredTours.filter((t) => getStatus(t) === "Expired").length,
  };

  const filterContent = (
    <div style={styles.filtersWrap}>
      <FilterDropdown
        label="Activity"
        value={activityFilter}
        open={showActivityList}
        setOpen={setShowActivityList}
        closeOther={setShowCountryList}
        list={activities}
        onSelect={setActivityFilter}
        isMobile={isMobile}
      />

      <FilterDropdown
        label="Country"
        value={countryFilter}
        open={showCountryList}
        setOpen={setShowCountryList}
        closeOther={setShowActivityList}
        list={countries}
        onSelect={setCountryFilter}
        isMobile={isMobile}
      />

      <div style={styles.filterShellWide}>
        <div style={styles.filterLabel}>Status</div>
        <div style={styles.segmented}>
          {["All", "Upcoming", "In progress", "Expired"].map((s) => (
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

      <div style={styles.filterShellWide}>
        <div style={styles.filterLabel}>Dates</div>
        <div style={styles.dateGrid}>
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
      </div>

      <div style={styles.filterShellWide}>
        <div style={styles.filterLabel}>Availability</div>
        <label style={styles.checkboxWrap}>
          <input
            id="capacityFilter"
            type="checkbox"
            checked={capacityFilter === "availableOnly"}
            onChange={(e) =>
              setCapacityFilter(e.target.checked ? "availableOnly" : "all")
            }
          />
          <span>Only tours with available spots</span>
        </label>
      </div>

      <div style={styles.filterShellWide}>
        <div style={styles.filterLabel}>Map radius</div>
        <input
          type="range"
          min={0}
          max={300}
          value={radiusKm}
          onChange={(e) => setRadiusKm(Number(e.target.value))}
          style={styles.range}
        />
        <div style={styles.rangeValue}>
          Radius: <strong>{radiusKm} km</strong>
        </div>
        <div style={styles.rangeHint}>Tap map to change center</div>
      </div>

      <div style={styles.filterShellWide}>
        <div style={styles.filterLabel}>Reset</div>
        <button
          type="button"
          onClick={() => {
            setActivityFilter("All Activities");
            setCountryFilter("All Countries");
            setStatusFilter("All");
            setCapacityFilter("all");
            setStartDateFilter("");
            setEndDateFilter("");
            setRadiusKm(0);
            setRadiusCenter(mapCenter);
          }}
          style={styles.clearBtn}
        >
          Clear all filters
        </button>
      </div>

      {isMobile && (
        <div style={styles.mobileFilterActions}>
          <button
            type="button"
            style={styles.mobileFilterGhost}
            onClick={() => {
              setActivityFilter("All Activities");
              setCountryFilter("All Countries");
              setStatusFilter("All");
              setCapacityFilter("all");
              setStartDateFilter("");
              setEndDateFilter("");
              setRadiusKm(0);
              setRadiusCenter(mapCenter);
              setShowActivityList(false);
              setShowCountryList(false);
            }}
          >
            Reset
          </button>

          <button
            type="button"
            style={styles.mobileFilterPrimary}
            onClick={() => setShowFiltersMobile(false)}
          >
            Apply filters
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div style={styles.page}>
      <div style={styles.bgGlow1} />
      <div style={styles.bgGlow2} />
      <div style={styles.bgGlow3} />
      <div style={styles.bgGrid} />

      <div style={styles.container}>
        <div style={styles.hero}>
          <div style={styles.heroGlow} />
          <div style={styles.heroGlow2} />

          <div style={styles.heroBadge}>🧭 EXPLORE REAL ADVENTURES</div>

          <h1 style={styles.title}>Outdoor Tours</h1>

          <p style={styles.subtitle}>
            Browse powerful outdoor experiences from real hosts. Filter by
            activity, country, dates, availability and radius — then find your
            next brutal adventure.
          </p>

          <div style={styles.heroStats}>
            <div style={styles.heroStatCard}>
              <div style={styles.heroStatNumber}>{stats.total}</div>
              <div style={styles.heroStatLabel}>Visible tours</div>
            </div>

            <div style={styles.heroStatCard}>
              <div style={styles.heroStatNumber}>{stats.upcoming}</div>
              <div style={styles.heroStatLabel}>Upcoming</div>
            </div>

            <div style={styles.heroStatCard}>
              <div style={styles.heroStatNumber}>{stats.inProgress}</div>
              <div style={styles.heroStatLabel}>In progress</div>
            </div>

            <div style={styles.heroStatCard}>
              <div style={styles.heroStatNumber}>{stats.expired}</div>
              <div style={styles.heroStatLabel}>Expired</div>
            </div>
          </div>

          {!isMobile && filterContent}
        </div>

        {isMobile && (
          <>
            <div style={styles.mobileTopTools}>
              <button
                type="button"
                style={styles.mobileFilterMainBtn}
                onClick={() => setShowFiltersMobile(true)}
              >
                <span>⚙️ Filters</span>
                {activeFilterCount > 0 && (
                  <span style={styles.mobileToolbarCount}>
                    {activeFilterCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                style={styles.mobileMapBtn}
                onClick={() =>
                  window.scrollTo({ top: 760, behavior: "smooth" })
                }
              >
                🗺️ Map
              </button>

              <div style={styles.mobileResultsChip}>
                🔍 {loading ? "Loading..." : `${filteredTours.length} shown`}
              </div>
            </div>

            <div style={styles.mobileSwipeSection}>
              <div style={styles.mobileSwipeHeader}>
                <div style={styles.mobileSwipeTitle}>Quick filters</div>
                <div style={styles.mobileSwipeHint}>Swipe horizontally</div>
              </div>

              <div style={styles.mobileChipsRow}>
                {mobileQuickActivities.map((chip) => {
                  const active = activityFilter === chip;
                  return (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setActivityFilter(chip)}
                      style={{
                        ...styles.mobileChip,
                        ...(active ? styles.mobileChipActive : {}),
                      }}
                    >
                      {chip === "All Activities" ? "All" : chip}
                    </button>
                  );
                })}
              </div>

              <div style={styles.mobileChipsRowSecondary}>
                {countries.slice(0, 8).map((chip) => {
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
                      {chip === "All Countries" ? "Any country" : chip}
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              style={{
                ...styles.filterOverlay,
                display: showFiltersMobile ? "block" : "none",
              }}
              onClick={() => setShowFiltersMobile(false)}
            />

            <div
              style={{
                ...styles.filterDrawer,
                transform: showFiltersMobile
                  ? "translateY(0)"
                  : "translateY(105%)",
              }}
            >
              <div style={styles.filterDrawerHandle} />

              <div style={styles.filterDrawerHead}>
                <div style={styles.filterDrawerTitle}>Filters</div>

                <button
                  type="button"
                  style={styles.filterDrawerClose}
                  onClick={() => setShowFiltersMobile(false)}
                >
                  Close
                </button>
              </div>

              {filterContent}
            </div>
          </>
        )}

        <div style={styles.topRow}>
          <div>
            <div style={styles.sectionEyebrow}>DISCOVER</div>
            <div style={styles.sectionTitle}>Brutal upcoming tours</div>
          </div>

          {!isMobile && (
            <div style={styles.resultsPill}>
              <span style={styles.resultsDot} />
              {loading ? "Loading tours..." : `${filteredTours.length} shown`}
            </div>
          )}
        </div>

        <div style={styles.mapWrapper}>
          <div style={styles.mapTopBar}>
            <div style={styles.mapTopLeft}>
              <div style={styles.mapTitle}>Map of tours</div>
              <div style={styles.mapText}>
                Pan, zoom and tap the map. Markers open tours directly, and the
                radius updates around your selected center.
              </div>
            </div>

            <div style={styles.mapTag}>
              🎯 Center: {radiusCenter[0].toFixed(2)},{" "}
              {radiusCenter[1].toFixed(2)}
            </div>
          </div>

          <MapContainer
            center={mapCenter}
            zoom={7}
            scrollWheelZoom={true}
            style={styles.mapContainer}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapClickCenter />

            {radiusKm > 0 && (
              <Circle
                center={radiusCenter}
                radius={radiusKm * 1000}
                pathOptions={{
                  color: "rgba(0,255,190,0.95)",
                  fillColor: "rgba(0,255,190,0.95)",
                  fillOpacity: 0.08,
                  weight: 2,
                }}
              />
            )}

            <MarkerClusterGroup chunkedLoading>
              {filteredTours
                .filter((t) => t.latitude && t.longitude)
                .map((tour) => (
                  <Marker
                    key={tour.id}
                    position={[tour.latitude, tour.longitude]}
                    icon={getOutdoorMarkerIcon()}
                    eventHandlers={{
                      click: () => navigate(`/tour/${tour.id}`),
                    }}
                  />
                ))}
            </MarkerClusterGroup>
          </MapContainer>
        </div>

        {loading ? (
          <div style={styles.grid}>
            {Array.from({ length: isMobile ? 4 : 6 }).map((_, i) => (
              <div key={i} style={styles.skeletonCard}>
                <div style={styles.skeletonImage} />
                <div style={styles.skeletonBody}>
                  <div style={{ ...styles.skeletonLine, width: "34%" }} />
                  <div
                    style={{
                      ...styles.skeletonLine,
                      width: "82%",
                      height: 18,
                    }}
                  />
                  <div style={{ ...styles.skeletonLine, width: "62%" }} />
                  <div style={{ ...styles.skeletonLine, width: "46%" }} />
                </div>
              </div>
            ))}
          </div>
        ) : filteredTours.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>🌌</div>
            <div style={styles.emptyTitle}>No tours found</div>
            <div style={styles.emptyText}>
              Try changing activity, country, dates or radius and explore
              again.
            </div>
          </div>
        ) : (
          <div style={styles.grid}>
            {filteredTours.map((tour) => {
              const status = getStatus(tour);
              const creatorName =
                tour.profiles?.full_name ||
                tour.creator_name ||
                "Unknown creator";

              return (
                <div
                  key={tour.id}
                  style={styles.card}
                  onClick={() => navigate(`/tour/${tour.id}`)}
                  onMouseEnter={(e) => {
                    if (isMobile) return;
                    e.currentTarget.style.transform =
                      "translateY(-8px) scale(1.01)";
                    e.currentTarget.style.boxShadow =
                      "0 40px 120px rgba(0,0,0,0.72), 0 0 0 1px rgba(0,255,195,0.18) inset";
                    const img = e.currentTarget.querySelector("img");
                    if (img) img.style.transform = "scale(1.08)";
                  }}
                  onMouseLeave={(e) => {
                    if (isMobile) return;
                    e.currentTarget.style.transform = "translateY(0) scale(1)";
                    e.currentTarget.style.boxShadow =
                      "0 28px 80px rgba(0,0,0,0.55)";
                    const img = e.currentTarget.querySelector("img");
                    if (img) img.style.transform = "scale(1.04)";
                  }}
                >
                  <div style={styles.imageWrap}>
                    <img
                      src={getCover(tour)}
                      style={styles.image}
                      alt={tour.title}
                    />

                    <div style={styles.imageOverlay} />
                    <div style={styles.imageNoise} />

                    <div style={styles.topBadges}>
                      <div style={styles.categoryTag}>
                        #{tour.activity || "Tour"}
                      </div>
                      <div style={styles.statusBadge(status)}>{status}</div>
                    </div>

                    <div style={styles.imageBottom}>
                      <div style={styles.locationChip}>
                        📍 {tour.country || "Unknown location"}
                      </div>
                    </div>
                  </div>

                  <div style={styles.cardBody}>
                    <div style={styles.cardTitle}>{tour.title}</div>

                    <div style={styles.metaRow}>
                      <div style={styles.metaPill}>👤 {creatorName}</div>

                      {tour.start_date && (
                        <div style={styles.metaPill}>
                          📅 {new Date(tour.start_date).toLocaleDateString()}
                          {tour.end_date
                            ? ` – ${new Date(tour.end_date).toLocaleDateString()}`
                            : ""}
                        </div>
                      )}
                    </div>

                    <div style={styles.divider} />

                    <div style={styles.bottomRow}>
                      <div style={styles.creatorChip}>
                        {hasAvailableSpots(tour)
                          ? "✅ Spots available"
                          : "⛔ Full"}
                      </div>

                      <button
                        type="button"
                        style={styles.openBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/tour/${tour.id}`);
                        }}
                      >
                        Open tour →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {isMobile && (
          <div style={styles.stickyFilterBar}>
            <div style={styles.stickyFilterInfo}>
              <div style={styles.stickyFilterTitle}>Explore tours</div>
              <div style={styles.stickyFilterSub}>
                {filteredTours.length} results · {activityFilter}
              </div>
            </div>

            <button
              type="button"
              style={styles.stickyFilterBtn}
              onClick={() => setShowFiltersMobile(true)}
            >
              Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function FilterDropdown({
  label,
  value,
  open,
  setOpen,
  closeOther,
  list,
  onSelect,
  isMobile,
}) {
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
        <div
          style={{
            ...styles.dropdown,
            top: isMobile ? 70 : 76,
          }}
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
    marginTop: -120,
    padding: "64px 0 110px",
    background:
      "radial-gradient(circle at top, #081b16 0%, #04100d 28%, #02060b 58%, #000000 100%)",
    color: "#eafff5",
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  },

  container: {
    position: "relative",
    zIndex: 2,
    maxWidth: 1400,
    margin: "0 auto",
    padding: "0 18px 20px",
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
      "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
    backgroundSize: "36px 36px",
    maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)",
    pointerEvents: "none",
  },

  hero: {
    position: "relative",
    padding: "34px 24px 24px",
    borderRadius: "0 0 36px 36px",
    border: "1px solid rgba(255,255,255,0.08)",
    borderTop: "none",
    background:
      "linear-gradient(145deg, rgba(10,24,19,0.94), rgba(3,10,8,0.98))",
    boxShadow:
      "0 26px 80px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.04)",
    overflow: "visible",
    marginBottom: 22,
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
    maxWidth: 820,
    color: "rgba(234,255,245,0.72)",
    fontSize: 16,
    lineHeight: 1.7,
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
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 16,
    width: "100%",
    alignItems: "start",
  },

  filterShell: {
    position: "relative",
    minWidth: 220,
    zIndex: 30,
  },

  filterShellWide: {
    position: "relative",
    minWidth: 220,
    zIndex: 20,
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
    left: 0,
    right: 0,
    maxHeight: 320,
    overflowY: "auto",
    borderRadius: 22,
    background: "rgba(4,16,12,0.97)",
    border: "1px solid rgba(0,255,190,0.22)",
    boxShadow:
      "0 24px 80px rgba(0,0,0,0.72), 0 0 0 1px rgba(255,255,255,0.03) inset",
    zIndex: 99999,
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

  segmented: {
    display: "flex",
    flexWrap: "wrap",
    padding: 6,
    borderRadius: 18,
    background:
      "linear-gradient(145deg, rgba(7,24,18,1), rgba(4,15,11,1))",
    border: "1px solid rgba(110,186,150,0.20)",
    gap: 6,
    width: "100%",
    boxSizing: "border-box",
    boxShadow: "0 10px 22px rgba(0,0,0,0.22)",
  },

  segButton: (active) => ({
    padding: "10px 12px",
    borderRadius: 999,
    fontSize: 11,
    border: "none",
    cursor: "pointer",
    background: active
      ? "linear-gradient(135deg, rgba(0,255,190,0.92), rgba(82,214,255,0.92), rgba(124,77,255,0.92))"
      : "transparent",
    color: active ? "#042217" : "rgba(220,240,230,0.86)",
    fontWeight: active ? 900 : 700,
    whiteSpace: "nowrap",
    boxShadow: active ? "0 8px 18px rgba(0,255,190,0.24)" : "none",
    minHeight: 38,
  }),

  dateGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
  },

  dateInput: {
    width: "100%",
    padding: "13px 14px",
    borderRadius: 16,
    border: "1px solid rgba(110,186,150,0.18)",
    background:
      "linear-gradient(145deg, rgba(7,24,18,1), rgba(4,15,11,1))",
    color: "#f3f8f5",
    fontSize: 12,
    boxSizing: "border-box",
    minWidth: 0,
    boxShadow: "0 10px 22px rgba(0,0,0,0.22)",
    minHeight: 48,
  },

  checkboxWrap: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    minHeight: 52,
    padding: "0 14px",
    borderRadius: 16,
    border: "1px solid rgba(110,186,150,0.18)",
    background:
      "linear-gradient(145deg, rgba(7,24,18,1), rgba(4,15,11,1))",
    color: "rgba(230,245,237,0.88)",
    fontSize: 13,
    fontWeight: 700,
    boxShadow: "0 10px 22px rgba(0,0,0,0.22)",
  },

  range: {
    width: "100%",
    accentColor: "#00ffbe",
  },

  rangeValue: {
    fontSize: 12,
    color: "rgba(230,255,240,0.9)",
    marginTop: 8,
    fontWeight: 700,
  },

  rangeHint: {
    fontSize: 11,
    opacity: 0.72,
    marginTop: 4,
    color: "rgba(230,245,237,0.72)",
  },

  clearBtn: {
    minHeight: 52,
    padding: "0 14px",
    borderRadius: 16,
    border: "1px solid rgba(110,186,150,0.22)",
    background: "rgba(20,60,45,0.95)",
    color: "#f5fff9",
    fontSize: 13,
    cursor: "pointer",
    alignSelf: "flex-start",
    fontWeight: 900,
    boxShadow: "0 10px 22px rgba(0,0,0,0.22)",
    width: "100%",
  },

  mobileTopTools: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 14,
  },

  mobileFilterMainBtn: {
    minHeight: 48,
    padding: "0 16px",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.10)",
    background:
      "linear-gradient(145deg, rgba(7,22,17,0.96), rgba(3,11,8,0.96))",
    color: "#f5fff9",
    fontWeight: 900,
    fontSize: 13,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    boxShadow: "0 14px 32px rgba(0,0,0,0.30)",
    position: "relative",
  },

  mobileMapBtn: {
    minHeight: 48,
    padding: "0 16px",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.10)",
    background:
      "linear-gradient(145deg, rgba(7,22,17,0.96), rgba(3,11,8,0.96))",
    color: "#f5fff9",
    fontWeight: 900,
    fontSize: 13,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    boxShadow: "0 14px 32px rgba(0,0,0,0.30)",
  },

  mobileToolbarCount: {
    minWidth: 20,
    height: 20,
    borderRadius: 999,
    background: "#00ffbe",
    color: "#042217",
    fontSize: 11,
    fontWeight: 900,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 6px",
  },

  mobileResultsChip: {
    minHeight: 48,
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

  mobileSwipeSection: {
    marginBottom: 18,
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
    paddingBottom: 4,
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
  },

  mobileChipActive: {
    background:
      "linear-gradient(135deg, rgba(0,255,190,0.16), rgba(124,77,255,0.16))",
    border: "1px solid rgba(0,255,190,0.30)",
    color: "#ffffff",
    boxShadow: "0 14px 30px rgba(0,255,190,0.18)",
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
  },

  mobileChipSecondaryActive: {
    background: "rgba(0,255,190,0.12)",
    border: "1px solid rgba(0,255,190,0.22)",
    color: "#dffff5",
  },

  filterOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.76)",
    backdropFilter: "blur(8px)",
    zIndex: 9998,
  },

  filterDrawer: {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: "88vh",
    overflowY: "auto",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    background:
      "linear-gradient(180deg, rgba(7,18,14,0.995), rgba(2,8,6,0.995))",
    borderTop: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "0 -30px 80px rgba(0,0,0,0.55)",
    zIndex: 9999,
    padding: "14px 14px 28px",
    transition: "transform 0.28s ease",
  },

  filterDrawerHandle: {
    width: 56,
    height: 5,
    borderRadius: 999,
    background: "rgba(255,255,255,0.20)",
    margin: "0 auto 14px",
  },

  filterDrawerHead: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 12,
  },

  filterDrawerTitle: {
    fontSize: 19,
    fontWeight: 1000,
    color: "#fff",
    letterSpacing: "-0.02em",
  },

  filterDrawerClose: {
    minHeight: 40,
    padding: "0 14px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    fontWeight: 800,
    fontSize: 12,
  },

  mobileFilterActions: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    width: "100%",
  },

  mobileFilterGhost: {
    minHeight: 48,
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    fontWeight: 900,
    fontSize: 13,
  },

  mobileFilterPrimary: {
    minHeight: 48,
    borderRadius: 16,
    border: "none",
    background: "linear-gradient(135deg, #00ffbe, #52d6ff, #7c4dff)",
    color: "#042217",
    fontWeight: 1000,
    fontSize: 13,
    boxShadow: "0 14px 34px rgba(0,255,190,0.20)",
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

  mapWrapper: {
    marginBottom: 24,
    borderRadius: 30,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.08)",
    background:
      "linear-gradient(145deg, rgba(8,26,21,0.96), rgba(2,9,7,0.96))",
    boxShadow:
      "0 22px 56px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.03)",
  },

  mapTopBar: {
    padding: "14px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    fontSize: 12,
    color: "rgba(226,244,235,0.92)",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
    background: "rgba(255,255,255,0.02)",
  },

  mapTopLeft: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
    minWidth: 0,
  },

  mapTitle: {
    fontSize: 15,
    fontWeight: 900,
    color: "#f7fff9",
  },

  mapText: {
    fontSize: 12,
    color: "rgba(234,255,245,0.70)",
    lineHeight: 1.55,
    maxWidth: 760,
  },

  mapTag: {
    padding: "8px 12px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(110,186,150,0.20)",
    fontSize: 11,
    fontWeight: 700,
    color: "rgba(230,245,237,0.92)",
  },

  mapContainer: {
    height: 360,
    width: "100%",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: 24,
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
    display: "grid",
    gap: 12,
  },

  skeletonLine: {
    height: 14,
    borderRadius: 999,
    background: "rgba(255,255,255,0.08)",
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
    transform: "scale(1.04)",
    display: "block",
    filter: "saturate(1.08) contrast(1.04)",
    transition: "transform 0.35s ease",
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

  statusBadge: (status) => {
    let bg = "rgba(255,255,255,0.08)";
    let border = "1px solid rgba(255,255,255,0.16)";
    let color = "#ffffff";

    if (status === "Upcoming") {
      bg = "rgba(0,255,190,0.14)";
      border = "1px solid rgba(0,255,190,0.28)";
      color = "#d7fff5";
    } else if (status === "In progress") {
      bg = "rgba(255,196,0,0.14)";
      border = "1px solid rgba(255,196,0,0.26)";
      color = "#fff3c7";
    }

    return {
      padding: "7px 12px",
      borderRadius: 999,
      background: bg,
      border,
      color,
      fontSize: 11,
      fontWeight: 900,
      letterSpacing: "0.08em",
      backdropFilter: "blur(10px)",
      textTransform: "uppercase",
    };
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

  creatorChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 12px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    fontSize: 12,
    color: "rgba(235,245,240,0.88)",
    fontWeight: 800,
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
    cursor: "pointer",
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

  stickyFilterBar: {
    display: "flex",
    position: "fixed",
    left: 10,
    right: 10,
    bottom: 10,
    zIndex: 9997,
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    padding: "10px 12px",
    borderRadius: 18,
    background: "rgba(5,16,12,0.88)",
    border: "1px solid rgba(110,186,150,0.16)",
    backdropFilter: "blur(16px)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.42)",
  },

  stickyFilterInfo: {
    display: "flex",
    flexDirection: "column",
    gap: 3,
    minWidth: 0,
  },

  stickyFilterTitle: {
    fontSize: 13,
    fontWeight: 900,
    color: "#fff",
    lineHeight: 1.1,
  },

  stickyFilterSub: {
    fontSize: 11,
    color: "rgba(230,245,237,0.78)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: 180,
  },

  stickyFilterBtn: {
    padding: "12px 14px",
    borderRadius: 14,
    border: "none",
    background: "linear-gradient(120deg, #a4e3c2, #6bc19a, #3f8d6a)",
    color: "#032013",
    fontWeight: 900,
    fontSize: 12,
    minWidth: 98,
    boxShadow: "0 10px 24px rgba(63,141,106,0.28)",
    cursor: "pointer",
  },
};