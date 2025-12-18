// src/pages/Tours.jsx
import React, { useEffect, useState } from "react";
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

  // FILTERS: activity, country, status, capacity, date
  const [activityFilter, setActivityFilter] = useState("All Activities");
  const [countryFilter, setCountryFilter] = useState("All Countries");
  const [statusFilter, setStatusFilter] = useState("All"); // All | Upcoming | In progress | Expired
  const [capacityFilter, setCapacityFilter] = useState("all"); // all | availableOnly
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");

  const [showActivityList, setShowActivityList] = useState(false);
  const [showCountryList, setShowCountryList] = useState(false);

  // ✅ RADIUS FILTER (0-300 km) + ✅ CENTER (klik na mapu menja)
  const [radiusKm, setRadiusKm] = useState(0);
  const [radiusCenter, setRadiusCenter] = useState([43.9, 21.0]); // start center

  // mapa – samo početni centar, bez state pomeranja
  const mapCenter = [43.9, 21.0]; // Balkan default

  const navigate = useNavigate();

  // ---------------------------------------------------------
  // ✅ DISTANCE HELPER (KM)
  // ---------------------------------------------------------
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

  // ---------------------------------------------------------
  // ✅ MAP CLICK HANDLER (menja center radius kruga)
  // ---------------------------------------------------------
  function MapClickCenter() {
    useMapEvents({
      click(e) {
        setRadiusCenter([e.latlng.lat, e.latlng.lng]);
      },
    });
    return null;
  }

  // ---------------------------------------------------------
  // ✅ OUTDOOR MARKER ICON
  // ---------------------------------------------------------
  const getOutdoorMarkerIcon = () =>
    L.divIcon({
      html: `
        <div style="
          width:40px;
          height:40px;
          border-radius:999px;
          background: radial-gradient(circle at 30% 30%, rgba(164,227,194,1), rgba(30,120,85,1));
          border:2px solid rgba(10,45,30,0.95);
          box-shadow: 0 14px 30px rgba(0,0,0,0.55), 0 0 18px rgba(164,227,194,0.45);
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:18px;
          color:#052013;
          font-weight:900;
        ">
          🧭
        </div>
      `,
      className: "",
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

  // ---------------------------------------------------------
  // 1️⃣ UČITAVAMO SVE TURE — SIGURNO, BEZ RPC-A
  // ✅ DODATO: učitaj creator (profiles) preko creator_id
  // ---------------------------------------------------------
  async function loadTours() {
  const { data, error } = await supabase
    .from("tours")
    .select(`
      *,
      profiles:creator_id (
        full_name,
        avatar_url
      )
    `)
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

  // ---------------------------------------------------------
  // 2️⃣ STATUS & CAPACITY HELPERI
  // ---------------------------------------------------------
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

    if (!max) return true; // nema limita → računamo kao dostupno
    return booked < max;
  }

  // ---------------------------------------------------------
  // 3️⃣ FILTERI (aktivnost, država, status, datum, kapacitet)
  // ✅ DODATO: radius filter (0-300km)
  // ---------------------------------------------------------
  const filteredTours = tours.filter((tour) => {
    const tourActivity = tour.activity ?? "";
    const tourCountry = tour.country ?? "";

    // Activity
    const matchActivity =
      activityFilter === "All Activities" || tourActivity === activityFilter;

    // Country
    const matchCountry =
      countryFilter === "All Countries" || tourCountry === countryFilter;

    // Status
    const status = getStatus(tour);
    const matchStatus = statusFilter === "All" || statusFilter === status;

    // Date – gledamo start_date
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

    // Capacity
    const matchCapacity = capacityFilter === "all" ? true : hasAvailableSpots(tour);

    // ✅ Radius
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
    } else {
      // radius=0 => sve ture (ne filtriramo po lokaciji)
      matchRadius = true;
    }

    return matchActivity && matchCountry && matchStatus && matchDate && matchCapacity && matchRadius;
  });

  // ---------------------------------------------------------
  // 4️⃣ IMG FALLBACK
  // ---------------------------------------------------------
  const getCover = (tour) =>
    tour.cover_url ??
    tour.image_url ??
    "https://images.pexels.com/photos/2387873/pexels-photo-2387873.jpeg";

  // ---------------------------------------------------------
  // LISTE
  // ---------------------------------------------------------
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

  // ---------------------------------------------------------
  // DIZAJN — EARTH / OUTDOOR MINIMAL
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
    header: { textAlign: "left", marginBottom: 22 },
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
    titleBox: { flex: "1 1 260px" },
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
    filterLabel: {
      marginBottom: 4,
      opacity: 0.85,
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

    dateInput: {
      flex: 1,
      padding: "7px 10px",
      borderRadius: 999,
      border: "1px solid rgba(110,186,150,0.7)",
      background: "rgba(5,23,16,1)",
      color: "#f3f8f5",
      fontSize: 12,
    },

    // ✅ DODATO: radius slider styling (ne menja ostatak UI)
    range: {
      width: "100%",
      accentColor: "rgba(164,227,194,1)",
    },
    rangeValue: {
      fontSize: 12,
      color: "rgba(230,255,240,0.88)",
      marginTop: 6,
    },
    rangeHint: {
      fontSize: 11,
      opacity: 0.7,
      marginTop: 2,
    },

    // MAP WRAPPER
    mapWrapper: {
      marginTop: 16,
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
    mapContainer: { height: 320, width: "100%" },

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
    },
    imgWrapper: { height: 170, position: "relative", overflow: "hidden" },
    img: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      transform: "scale(1.02)",
      transition: "transform 0.35s ease-out",
    },
    imgOverlay: {
      position: "absolute",
      inset: 0,
      background:
        "linear-gradient(to top, rgba(0,0,0,0.76), rgba(0,0,0,0.1))",
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
      } else if (status === "In progress") {
        bg = "rgba(70,110,40,0.92)";
        border = "rgba(190,230,150,0.95)";
      } else if (status === "Expired") {
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
    viewButton: {
      marginTop: 8,
      alignSelf: "flex-start",
      padding: "7px 14px",
      borderRadius: 999,
      border: "none",
      background: "linear-gradient(120deg, #a4e3c2, #6bc19a, #3f8d6a)",
      color: "#032013",
      fontSize: 12,
      fontWeight: 700,
      cursor: "pointer",
    },
  };

  // STATISTIKA ZA HEADER
  const stats = {
    total: filteredTours.length,
    upcoming: filteredTours.filter((t) => getStatus(t) === "Upcoming").length,
    inProgress: filteredTours.filter((t) => getStatus(t) === "In progress").length,
    expired: filteredTours.filter((t) => getStatus(t) === "Expired").length,
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* HEADER */}
        <div style={styles.header}>
          <div style={styles.badge}>Tours · MeetOutdoors</div>

          <div style={styles.titleRow}>
            <div style={styles.titleBox}>
              <h1 style={styles.title}>Find your next outdoor story.</h1>
              <p style={styles.subtitle}>
                Browse verified adventures from real guides and hosts. Filter by
                activity, location, date and availability.
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
                In progress: <strong>{stats.inProgress}</strong>
              </div>
              <div style={styles.statPill}>
                Expired: <strong>{stats.expired}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* FILTER BAR */}
        <div style={styles.filterBar}>
          {/* ACTIVITIES */}
          <div style={styles.filterGroup}>
            <span style={styles.filterLabel}>Activity</span>
            <div
              style={styles.dropdownBox}
              onClick={() => {
                setShowActivityList((p) => !p);
                setShowCountryList(false);
              }}
            >
              <span>{activityFilter}</span>
              <span>▾</span>
            </div>
            {showActivityList && (
              <div style={styles.dropdownList}>
                {activities.map((a) => (
                  <div
                    key={a}
                    style={{
                      ...styles.dropdownItem,
                      backgroundColor:
                        a === activityFilter
                          ? "rgba(20,70,50,0.9)"
                          : "transparent",
                    }}
                    onClick={() => {
                      setActivityFilter(a);
                      setShowActivityList(false);
                    }}
                  >
                    {a}
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
                setShowActivityList(false);
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

          {/* STATUS + CAPACITY */}
          <div style={styles.filterGroup}>
            <span style={styles.filterLabel}>Status & availability</span>

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

            <div style={styles.checkboxRow}>
              <input
                id="capacityFilter"
                type="checkbox"
                checked={capacityFilter === "availableOnly"}
                onChange={(e) =>
                  setCapacityFilter(e.target.checked ? "availableOnly" : "all")
                }
              />
              <label htmlFor="capacityFilter">
                Only tours with available spots
              </label>
            </div>
          </div>

          {/* DATE FROM */}
          <div style={styles.filterGroup}>
            <span style={styles.filterLabel}>Start date from</span>
            <input
              type="date"
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
              style={styles.dateInput}
            />
          </div>

          {/* DATE TO */}
          <div style={styles.filterGroup}>
            <span style={styles.filterLabel}>Start date to</span>
            <input
              type="date"
              value={endDateFilter}
              onChange={(e) => setEndDateFilter(e.target.value)}
              style={styles.dateInput}
            />
          </div>

          {/* RESET */}
          <div style={styles.filterGroup}>
            <span style={styles.filterLabel}>Reset filters</span>
            <button
              type="button"
              onClick={() => {
                setActivityFilter("All Activities");
                setCountryFilter("All Countries");
                setStatusFilter("All");
                setCapacityFilter("all");
                setStartDateFilter("");
                setEndDateFilter("");
                setRadiusKm(0); // ✅ reset radius
                setRadiusCenter(mapCenter); // ✅ reset center
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

          {/* ✅ RADIUS (DODATO) */}
          <div style={styles.filterGroup}>
            <span style={styles.filterLabel}>Map radius</span>
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
            <div style={styles.rangeHint}>
              Click on map to change center
            </div>
          </div>
        </div>

        {/* MAPA – ✅ radius + ✅ klik centar + ✅ outdoor marker */}
        <div style={styles.mapWrapper}>
          <div style={styles.mapTopBar}>
            <div style={styles.mapTopLeft}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>
                Map of tours
              </span>
              <span style={{ fontSize: 11, opacity: 0.8 }}>
                Pan and zoom the map freely. Markers show tours with a location –
                tap a marker to open the tour.
              </span>
            </div>
          </div>

          <MapContainer
            center={mapCenter}
            zoom={7}
            scrollWheelZoom={true}
            style={styles.mapContainer}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            {/* ✅ klik na mapu menja centar */}
            <MapClickCenter />

            {/* ✅ radius krug (samo kad je >0) */}
            {radiusKm > 0 && (
              <Circle
                center={radiusCenter}
                radius={radiusKm * 1000}
                pathOptions={{
                  color: "rgba(164,227,194,0.9)",
                  fillColor: "rgba(164,227,194,0.9)",
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

        {/* GRID */}
        <div style={styles.grid}>
          {!loading &&
            filteredTours.map((tour) => {
              const status = getStatus(tour);

              // ✅ umesto booked mesta — creator
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
                      src={getCover(tour)}
                      style={styles.img}
                      alt={tour.title}
                    />
                    <div style={styles.imgOverlay} />
                  </div>

                  <div style={styles.cardBody}>
                    <div style={styles.statusPill(status)}>{status}</div>

                    <div style={styles.titleText}>{tour.title}</div>

                    <div style={styles.metaRow}>
                      <div style={styles.metaLeft}>
                        <span>🧭 {tour.activity || "Activity"}</span>
                        {tour.start_date && (
                          <span>
                            📅{" "}
                            {new Date(tour.start_date).toLocaleDateString()}
                            {tour.end_date
                              ? ` – ${new Date(tour.end_date).toLocaleDateString()}`
                              : ""}
                          </span>
                        )}
                      </div>

                      {/* ✅ ovde sada piše creator (umesto booked) */}
                      <div style={styles.metaRight}>
                        👤 {creatorName}
                      </div>
                    </div>

                    <button
                      type="button"
                      style={styles.viewButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/tour/${tour.id}`);
                      }}
                    >
                      View tour
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