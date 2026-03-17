import React, { useEffect, useMemo, useRef, useState } from "react";
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

  const [isSmallScreen, setIsSmallScreen] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 820 : false
  );

  const categoryRef = useRef(null);
  const countryRef = useRef(null);

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

  useEffect(() => {
    function handleResize() {
      setIsSmallScreen(window.innerWidth <= 820);
    }

    function handleClickOutside(e) {
      if (
        categoryRef.current &&
        !categoryRef.current.contains(e.target)
      ) {
        setShowCategoryList(false);
      }
      if (
        countryRef.current &&
        !countryRef.current.contains(e.target)
      ) {
        setShowCountryList(false);
      }
    }

    function handleEsc(e) {
      if (e.key === "Escape") {
        setShowCategoryList(false);
        setShowCountryList(false);
      }
    }

    window.addEventListener("resize", handleResize);
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);

    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  useEffect(() => {
    if (showCategoryList) setShowCountryList(false);
  }, [showCategoryList]);

  useEffect(() => {
    if (showCountryList) setShowCategoryList(false);
  }, [showCountryList]);

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
      const sameDay = start.toDateString() === end.toDateString();
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
  // 4️⃣ FILTERI
  // ---------------------------------------------------------
  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
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
        categoryFilter === "All" || evt.category === categoryFilter;

      // country
      const matchCountry =
        countryFilter === "All Countries" || evt.country === countryFilter;

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
          const mIndex = months.indexOf(monthFilter) - 1;
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
  }, [
    events,
    searchTerm,
    categoryFilter,
    countryFilter,
    statusFilter,
    monthFilter,
    isFreeFilter,
  ]);

  // ---------------------------------------------------------
  // 5️⃣ Fallback za sliku
  // ---------------------------------------------------------
  const getCover = (evt) =>
    evt.cover_url ??
    "https://images.pexels.com/photos/3324422/pexels-photo-3324422.jpeg";

  const stats = useMemo(() => {
    return {
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
  }, [filteredEvents]);

  const activeFiltersCount = [
    categoryFilter !== "All",
    countryFilter !== "All Countries",
    statusFilter !== "All",
    isFreeFilter !== "all",
    monthFilter !== "All",
    searchTerm.trim() !== "",
  ].filter(Boolean).length;

  const hasLocationEvents = filteredEvents.some(
    (e) => e.latitude && e.longitude
  );

  const handleCreateEvent = () => {
    navigate("/create-event");
  };

  const clearAllFilters = () => {
    setCategoryFilter("All");
    setCountryFilter("All Countries");
    setStatusFilter("All");
    setIsFreeFilter("all");
    setMonthFilter("All");
    setSearchTerm("");
    setShowCategoryList(false);
    setShowCountryList(false);
  };

  // ---------------------------------------------------------
  // DIZAJN
  // ---------------------------------------------------------
  const styles = {
    page: {
      minHeight: "100vh",
      background: `
        radial-gradient(circle at 10% 0%, rgba(29, 99, 74, 0.28), transparent 28%),
        radial-gradient(circle at 90% 10%, rgba(27, 111, 150, 0.22), transparent 24%),
        radial-gradient(circle at 50% 100%, rgba(99, 62, 185, 0.16), transparent 28%),
        linear-gradient(180deg, #02070a 0%, #03070a 35%, #000000 100%)
      `,
      color: "#f6fffb",
      fontFamily:
        'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },
    shell: {
      width: "100%",
      maxWidth: 1380,
      margin: "0 auto",
      padding: isSmallScreen ? "18px 12px 40px" : "28px 20px 50px",
    },

    hero: {
      position: "relative",
      overflow: "hidden",
      borderRadius: isSmallScreen ? 24 : 32,
      padding: isSmallScreen ? "18px" : "26px",
      border: "1px solid rgba(138, 199, 171, 0.18)",
      background: `
        linear-gradient(135deg, rgba(8,18,16,0.96), rgba(7,16,20,0.94)),
        radial-gradient(circle at top left, rgba(108, 196, 151, 0.12), transparent 35%)
      `,
      boxShadow:
        "0 30px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04)",
      marginBottom: 18,
    },
    glow1: {
      position: "absolute",
      width: 220,
      height: 220,
      borderRadius: "50%",
      right: -60,
      top: -60,
      background: "rgba(0, 255, 195, 0.08)",
      filter: "blur(40px)",
      pointerEvents: "none",
    },
    glow2: {
      position: "absolute",
      width: 180,
      height: 180,
      borderRadius: "50%",
      left: "10%",
      bottom: -90,
      background: "rgba(0, 153, 255, 0.08)",
      filter: "blur(40px)",
      pointerEvents: "none",
    },
    badge: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "7px 12px",
      borderRadius: 999,
      border: "1px solid rgba(155,228,194,0.25)",
      background: "rgba(8, 28, 22, 0.82)",
      color: "#d9fff0",
      fontWeight: 700,
      fontSize: 11,
      letterSpacing: "0.14em",
      textTransform: "uppercase",
      marginBottom: 14,
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
    },
    heroTop: {
      position: "relative",
      zIndex: 2,
      display: "grid",
      gridTemplateColumns: isSmallScreen ? "1fr" : "minmax(0, 1.3fr) minmax(320px, 0.8fr)",
      gap: 18,
      alignItems: "end",
    },
    titleBox: {
      minWidth: 0,
    },
    title: {
      margin: 0,
      fontSize: isSmallScreen ? 30 : 46,
      lineHeight: 1,
      fontWeight: 900,
      letterSpacing: "-0.04em",
      color: "#f8fffb",
      textShadow: "0 6px 28px rgba(0,0,0,0.35)",
    },
    subtitle: {
      margin: "12px 0 0",
      maxWidth: 700,
      fontSize: isSmallScreen ? 14 : 15,
      lineHeight: 1.7,
      color: "rgba(221,241,232,0.78)",
    },
    statGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
      gap: 10,
    },
    statCard: {
      padding: "14px 14px",
      borderRadius: 20,
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
      minHeight: 76,
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
    },
    statLabel: {
      fontSize: 12,
      color: "rgba(212,232,222,0.72)",
    },
    statValue: {
      fontSize: 26,
      fontWeight: 900,
      color: "#ffffff",
      lineHeight: 1,
    },

    stickyWrap: {
      position: "sticky",
      top: 10,
      zIndex: 40,
      marginBottom: 20,
    },
    filterSurface: {
      position: "relative",
      overflow: "visible",
      borderRadius: isSmallScreen ? 22 : 24,
      padding: isSmallScreen ? 12 : 14,
      background: "rgba(5, 12, 14, 0.74)",
      border: "1px solid rgba(149, 222, 193, 0.12)",
      boxShadow:
        "0 22px 60px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.03)",
      backdropFilter: "blur(18px)",
      WebkitBackdropFilter: "blur(18px)",
    },
    topSearchRow: {
      display: "grid",
      gridTemplateColumns: isSmallScreen ? "1fr" : "minmax(0,1fr) auto",
      gap: 12,
      alignItems: "center",
      marginBottom: 12,
    },
    searchWrap: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      minWidth: 0,
      padding: isSmallScreen ? "12px 14px" : "13px 16px",
      borderRadius: 18,
      background:
        "linear-gradient(180deg, rgba(10,21,23,0.96), rgba(7,16,18,0.96))",
      border: "1px solid rgba(157,226,197,0.13)",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
    },
    searchIcon: {
      fontSize: 15,
      opacity: 0.8,
      flexShrink: 0,
    },
    searchInput: {
      width: "100%",
      minWidth: 0,
      background: "transparent",
      border: "none",
      outline: "none",
      color: "#f5fffb",
      fontSize: 14,
    },
    createButton: {
      padding: isSmallScreen ? "12px 16px" : "13px 18px",
      borderRadius: 18,
      border: "1px solid rgba(255,255,255,0.08)",
      background:
        "linear-gradient(135deg, #fff4b8 0%, #ffd97f 42%, #ffb056 100%)",
      color: "#241404",
      fontSize: 14,
      fontWeight: 900,
      cursor: "pointer",
      boxShadow: "0 14px 34px rgba(255, 186, 90, 0.28)",
      whiteSpace: "nowrap",
    },

    quickRow: {
      display: "flex",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 12,
    },
    quickChip: (active) => ({
      padding: "8px 12px",
      borderRadius: 999,
      border: active
        ? "1px solid rgba(184,255,221,0.42)"
        : "1px solid rgba(255,255,255,0.08)",
      background: active
        ? "linear-gradient(135deg, rgba(78,170,127,0.28), rgba(32,88,66,0.45))"
        : "rgba(255,255,255,0.04)",
      color: active ? "#ecfff7" : "rgba(227,242,234,0.82)",
      cursor: "pointer",
      fontSize: 12,
      fontWeight: active ? 800 : 600,
      boxShadow: active ? "0 0 0 1px rgba(152,235,194,0.08) inset" : "none",
    }),

    filterGrid: {
      position: "relative",
      overflow: "visible",
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
      gap: 12,
      alignItems: "start",
    },
    filterCard: {
      position: "relative",
      overflow: "visible",
      minWidth: 0,
      padding: 12,
      borderRadius: 18,
      background:
        "linear-gradient(180deg, rgba(10,20,22,0.96), rgba(6,13,15,0.96))",
      border: "1px solid rgba(255,255,255,0.07)",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
    },
    filterLabel: {
      display: "block",
      marginBottom: 8,
      fontSize: 11,
      textTransform: "uppercase",
      letterSpacing: "0.12em",
      color: "rgba(204,229,218,0.62)",
      fontWeight: 800,
    },
    dropdownBox: {
      width: "100%",
      minHeight: 48,
      padding: "0 14px",
      borderRadius: 16,
      background:
        "linear-gradient(180deg, rgba(10,25,23,1), rgba(7,17,18,1))",
      border: "1px solid rgba(153,224,194,0.16)",
      color: "#f2fff8",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
      fontSize: 14,
      fontWeight: 700,
      boxSizing: "border-box",
    },
    dropdownText: {
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
    dropdownChevron: {
      opacity: 0.72,
      flexShrink: 0,
    },
    dropdownList: {
      position: isSmallScreen ? "fixed" : "absolute",
      top: isSmallScreen ? "50%" : "calc(100% + 8px)",
      left: isSmallScreen ? "50%" : 0,
      right: isSmallScreen ? "auto" : 0,
      transform: isSmallScreen ? "translate(-50%, -50%)" : "none",
      width: isSmallScreen ? "min(92vw, 420px)" : "100%",
      maxHeight: isSmallScreen ? "70vh" : 280,
      overflowY: "auto",
      background:
        "linear-gradient(180deg, rgba(7,14,15,0.995), rgba(4,10,11,0.995))",
      borderRadius: 20,
      border: "1px solid rgba(165,235,206,0.18)",
      zIndex: 99999,
      boxShadow: "0 30px 80px rgba(0,0,0,0.7)",
      padding: 8,
    },
    dropdownItem: (active) => ({
      padding: "12px 12px",
      fontSize: 14,
      cursor: "pointer",
      color: active ? "#effff7" : "rgba(233,245,239,0.88)",
      background: active
        ? "linear-gradient(135deg, rgba(71,145,111,0.34), rgba(39,84,67,0.48))"
        : "transparent",
      borderRadius: 12,
      fontWeight: active ? 800 : 600,
      marginBottom: 4,
    }),
    overlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.55)",
      backdropFilter: "blur(4px)",
      WebkitBackdropFilter: "blur(4px)",
      zIndex: 99990,
    },

    segmented: {
      display: "flex",
      flexWrap: "wrap",
      gap: 8,
    },
    segButton: (active) => ({
      padding: "10px 12px",
      borderRadius: 999,
      fontSize: 12,
      border: active
        ? "1px solid rgba(182,255,222,0.35)"
        : "1px solid rgba(255,255,255,0.08)",
      cursor: "pointer",
      background: active
        ? "linear-gradient(135deg, rgba(91,177,135,0.28), rgba(30,84,63,0.45))"
        : "rgba(255,255,255,0.03)",
      color: active ? "#effff7" : "rgba(220,240,230,0.82)",
      fontWeight: active ? 800 : 700,
    }),
    checkboxRow: {
      marginTop: 10,
      display: "flex",
      alignItems: "center",
      gap: 8,
      fontSize: 13,
      color: "rgba(224,241,233,0.86)",
    },

    monthsRow: {
      display: "flex",
      flexWrap: "wrap",
      gap: 8,
    },
    monthChip: (active) => ({
      padding: "8px 11px",
      borderRadius: 999,
      border: active
        ? "1px solid rgba(184,255,221,0.35)"
        : "1px solid rgba(255,255,255,0.08)",
      fontSize: 12,
      fontWeight: active ? 800 : 700,
      cursor: "pointer",
      background: active
        ? "linear-gradient(135deg, rgba(88,170,129,0.28), rgba(30,83,62,0.46))"
        : "rgba(255,255,255,0.03)",
      color: active ? "#f4fff8" : "rgba(216,237,227,0.82)",
    }),

    resetButton: {
      minHeight: 48,
      padding: "0 14px",
      borderRadius: 16,
      border: "1px solid rgba(255,255,255,0.09)",
      background:
        activeFiltersCount > 0
          ? "linear-gradient(135deg, rgba(84, 63, 190, 0.30), rgba(40, 72, 188, 0.28))"
          : "rgba(255,255,255,0.03)",
      color: "#f4f7ff",
      fontSize: 13,
      fontWeight: 800,
      cursor: "pointer",
      boxSizing: "border-box",
    },

    mapSection: {
      marginBottom: 22,
      borderRadius: isSmallScreen ? 22 : 26,
      overflow: "hidden",
      border: "1px solid rgba(155, 223, 194, 0.12)",
      background:
        "linear-gradient(180deg, rgba(7,14,16,0.94), rgba(4,8,10,0.98))",
      boxShadow:
        "0 24px 70px rgba(0,0,0,0.44), inset 0 1px 0 rgba(255,255,255,0.03)",
    },
    mapHead: {
      padding: isSmallScreen ? "14px 14px 12px" : "16px 18px 14px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      flexWrap: "wrap",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
    },
    mapTitleBox: {
      display: "flex",
      flexDirection: "column",
      gap: 4,
    },
    mapTitle: {
      fontSize: 15,
      fontWeight: 900,
      color: "#f6fff9",
    },
    mapSub: {
      fontSize: 12,
      color: "rgba(216,236,226,0.74)",
      lineHeight: 1.6,
      maxWidth: 620,
    },
    mapBadge: {
      padding: "8px 12px",
      borderRadius: 999,
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(255,255,255,0.08)",
      fontSize: 12,
      color: "rgba(228,242,235,0.84)",
      fontWeight: 700,
    },
    mapContainer: {
      height: isSmallScreen ? 280 : 360,
      width: "100%",
    },

    resultRow: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      margin: "18px 0 14px",
      flexWrap: "wrap",
    },
    resultText: {
      fontSize: 14,
      color: "rgba(223,241,232,0.8)",
    },

    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
      gap: 18,
    },
    card: {
      position: "relative",
      overflow: "hidden",
      borderRadius: 24,
      background:
        "linear-gradient(180deg, rgba(8,15,17,0.98), rgba(5,10,12,0.98))",
      border: "1px solid rgba(156,223,195,0.10)",
      cursor: "pointer",
      boxShadow:
        "0 18px 48px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.03)",
      display: "flex",
      flexDirection: "column",
      transition:
        "transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease",
    },
    cardGlow: {
      position: "absolute",
      inset: "auto -20% -40% auto",
      width: 140,
      height: 140,
      borderRadius: "50%",
      background: "rgba(0,255,195,0.08)",
      filter: "blur(26px)",
      pointerEvents: "none",
    },
    imgWrapper: {
      height: 210,
      position: "relative",
      overflow: "hidden",
      background: "#081011",
    },
    img: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      transform: "scale(1.02)",
      transition: "transform 0.45s ease",
    },
    imgOverlay: {
      position: "absolute",
      inset: 0,
      background:
        "linear-gradient(to top, rgba(4,8,10,0.94) 0%, rgba(4,8,10,0.24) 45%, rgba(0,0,0,0.12) 100%)",
    },
    topTagsRow: {
      position: "absolute",
      top: 12,
      left: 12,
      right: 12,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
      flexWrap: "wrap",
    },
    topTag: {
      padding: "7px 10px",
      borderRadius: 999,
      fontSize: 11,
      border: "1px solid rgba(255,255,255,0.12)",
      background: "rgba(7,12,14,0.65)",
      color: "#f7fff9",
      textTransform: "uppercase",
      letterSpacing: "0.08em",
      fontWeight: 800,
      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",
      maxWidth: "100%",
    },
    cardBody: {
      padding: 16,
      display: "flex",
      flexDirection: "column",
      gap: 10,
      flex: 1,
    },
    statusPill: (status) => {
      let bg = "rgba(46,84,66,0.5)";
      let border = "rgba(144,225,186,0.20)";
      let color = "#eafff3";

      if (status === "Upcoming") {
        bg = "rgba(33, 121, 93, 0.20)";
        border = "rgba(147, 237, 194, 0.28)";
        color = "#eafff3";
      } else if (status === "Live now") {
        bg = "rgba(135, 179, 43, 0.22)";
        border = "rgba(223, 255, 161, 0.30)";
        color = "#f7ffd8";
      } else if (status === "Ended") {
        bg = "rgba(94, 94, 94, 0.18)";
        border = "rgba(189,189,189,0.18)";
        color = "#ededed";
      }

      return {
        alignSelf: "flex-start",
        padding: "7px 11px",
        borderRadius: 999,
        border: `1px solid ${border}`,
        fontSize: 11,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        color,
        background: bg,
        fontWeight: 800,
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      };
    },
    titleText: {
      fontSize: 20,
      lineHeight: 1.2,
      fontWeight: 900,
      color: "#f7fffb",
      letterSpacing: "-0.02em",
    },
    locationText: {
      fontSize: 13,
      color: "rgba(218,237,227,0.76)",
      lineHeight: 1.6,
    },
    metaBlock: {
      display: "grid",
      gap: 8,
      marginTop: 2,
    },
    metaItem: {
      display: "flex",
      alignItems: "flex-start",
      gap: 8,
      fontSize: 13,
      color: "rgba(224,241,233,0.88)",
    },
    icon: {
      width: 18,
      textAlign: "center",
      opacity: 0.95,
      flexShrink: 0,
    },
    bottomRow: {
      marginTop: "auto",
      paddingTop: 12,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      flexWrap: "wrap",
      borderTop: "1px solid rgba(255,255,255,0.06)",
    },
    priceWrap: {
      display: "flex",
      flexDirection: "column",
      gap: 2,
    },
    priceLabel: {
      fontSize: 11,
      textTransform: "uppercase",
      letterSpacing: "0.09em",
      color: "rgba(208,227,219,0.56)",
      fontWeight: 800,
    },
    priceText: {
      fontWeight: 900,
      fontSize: 16,
      color: "#fff2ca",
    },
    viewButton: {
      padding: "10px 14px",
      borderRadius: 999,
      border: "1px solid rgba(255,255,255,0.08)",
      background:
        "linear-gradient(135deg, #fff3ba 0%, #ffd57a 42%, #ffab50 100%)",
      color: "#2b1804",
      fontSize: 13,
      fontWeight: 900,
      cursor: "pointer",
      boxShadow: "0 12px 28px rgba(255, 181, 83, 0.22)",
    },

    emptyState: {
      marginTop: 10,
      padding: isSmallScreen ? "24px 18px" : "34px 24px",
      borderRadius: 24,
      textAlign: "center",
      background:
        "linear-gradient(180deg, rgba(8,15,17,0.98), rgba(5,10,12,0.98))",
      border: "1px solid rgba(255,255,255,0.07)",
      boxShadow: "0 18px 48px rgba(0,0,0,0.38)",
    },
    emptyTitle: {
      fontSize: 22,
      fontWeight: 900,
      marginBottom: 8,
      color: "#f7fffb",
    },
    emptyText: {
      fontSize: 14,
      lineHeight: 1.7,
      color: "rgba(218,237,227,0.72)",
      maxWidth: 560,
      margin: "0 auto 16px",
    },

    loadingWrap: {
      padding: "42px 0 20px",
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
      gap: 18,
    },
    skeleton: {
      height: 360,
      borderRadius: 24,
      background:
        "linear-gradient(90deg, rgba(16,25,28,0.96) 0%, rgba(23,34,37,0.98) 50%, rgba(16,25,28,0.96) 100%)",
      backgroundSize: "200% 100%",
      animation: "eventsShimmer 1.6s linear infinite",
      border: "1px solid rgba(255,255,255,0.05)",
    },
  };

  return (
    <div style={styles.page}>
      <style>{`
        @keyframes eventsShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .events-card-hover:hover {
          transform: translateY(-4px);
          box-shadow:
            0 24px 64px rgba(0,0,0,0.52),
            inset 0 1px 0 rgba(255,255,255,0.04);
          border-color: rgba(176, 240, 209, 0.18);
        }

        .events-card-hover:hover img {
          transform: scale(1.07);
        }

        .events-scrollbar::-webkit-scrollbar {
          width: 10px;
        }

        .events-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(156, 223, 195, 0.18);
          border-radius: 999px;
        }

        .events-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .leaflet-container {
          background: #071013;
        }

        .leaflet-popup-content-wrapper,
        .leaflet-popup-tip {
          background: #081214;
          color: #f1fff8;
        }
      `}</style>

      {(showCategoryList || showCountryList) && isSmallScreen && (
        <div
          style={styles.overlay}
          onClick={() => {
            setShowCategoryList(false);
            setShowCountryList(false);
          }}
        />
      )}

      <div style={styles.shell}>
        {/* HERO */}
        <div style={styles.hero}>
          <div style={styles.glow1} />
          <div style={styles.glow2} />

          <div style={styles.badge}>Events · MeetOutdoors</div>

          <div style={styles.heroTop}>
            <div style={styles.titleBox}>
              <h1 style={styles.title}>Meet people where nature happens.</h1>
              <p style={styles.subtitle}>
                Discover outdoor gatherings, meetups and festivals hosted by
                the community. Browse premium outdoor experiences, find events
                near you, and jump into something unforgettable this week.
              </p>
            </div>

            <div style={styles.statGrid}>
              <div style={styles.statCard}>
                <span style={styles.statLabel}>Filtered events</span>
                <span style={styles.statValue}>{stats.total}</span>
              </div>
              <div style={styles.statCard}>
                <span style={styles.statLabel}>Upcoming</span>
                <span style={styles.statValue}>{stats.upcoming}</span>
              </div>
              <div style={styles.statCard}>
                <span style={styles.statLabel}>Live now</span>
                <span style={styles.statValue}>{stats.live}</span>
              </div>
              <div style={styles.statCard}>
                <span style={styles.statLabel}>Ended</span>
                <span style={styles.statValue}>{stats.ended}</span>
              </div>
            </div>
          </div>
        </div>

        {/* STICKY SEARCH + FILTERS */}
        <div style={styles.stickyWrap}>
          <div style={styles.filterSurface}>
            <div style={styles.topSearchRow}>
              <div style={styles.searchWrap}>
                <span style={styles.searchIcon}>🔎</span>
                <input
                  type="text"
                  placeholder="Search by event name, city or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={styles.searchInput}
                />
              </div>

              <button
                type="button"
                style={styles.createButton}
                onClick={handleCreateEvent}
              >
                + Create event
              </button>
            </div>

            <div style={styles.quickRow}>
              {["All", "Upcoming", "Live now", "Ended"].map((s) => (
                <button
                  key={s}
                  type="button"
                  style={styles.quickChip(statusFilter === s)}
                  onClick={() => setStatusFilter(s)}
                >
                  {s}
                </button>
              ))}

              <button
                type="button"
                style={styles.quickChip(isFreeFilter === "freeOnly")}
                onClick={() =>
                  setIsFreeFilter((prev) =>
                    prev === "freeOnly" ? "all" : "freeOnly"
                  )
                }
              >
                Free only
              </button>

              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  style={styles.quickChip(true)}
                  onClick={clearAllFilters}
                >
                  Reset {activeFiltersCount}
                </button>
              )}
            </div>

            <div style={styles.filterGrid}>
              {/* CATEGORY */}
              <div style={styles.filterCard} ref={categoryRef}>
                <span style={styles.filterLabel}>Category</span>
                <button
                  type="button"
                  style={styles.dropdownBox}
                  onClick={() => setShowCategoryList((p) => !p)}
                >
                  <span style={styles.dropdownText}>{categoryFilter}</span>
                  <span style={styles.dropdownChevron}>▾</span>
                </button>

                {showCategoryList && (
                  <div style={styles.dropdownList} className="events-scrollbar">
                    {categories.map((c) => (
                      <div
                        key={c}
                        style={styles.dropdownItem(c === categoryFilter)}
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
              <div style={styles.filterCard} ref={countryRef}>
                <span style={styles.filterLabel}>Country</span>
                <button
                  type="button"
                  style={styles.dropdownBox}
                  onClick={() => setShowCountryList((p) => !p)}
                >
                  <span style={styles.dropdownText}>{countryFilter}</span>
                  <span style={styles.dropdownChevron}>▾</span>
                </button>

                {showCountryList && (
                  <div style={styles.dropdownList} className="events-scrollbar">
                    {countries.map((c) => (
                      <div
                        key={c}
                        style={styles.dropdownItem(c === countryFilter)}
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
              <div style={styles.filterCard}>
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

              {/* MONTH */}
              <div style={styles.filterCard}>
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
              <div style={styles.filterCard}>
                <span style={styles.filterLabel}>Reset filters</span>
                <button
                  type="button"
                  onClick={clearAllFilters}
                  style={styles.resetButton}
                >
                  {activeFiltersCount > 0
                    ? `Clear all (${activeFiltersCount})`
                    : "Nothing to reset"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* MAPA */}
        <div style={styles.mapSection}>
          <div style={styles.mapHead}>
            <div style={styles.mapTitleBox}>
              <span style={styles.mapTitle}>Map of events</span>
              <span style={styles.mapSub}>
                Markers show events with a location. Drag and zoom the map to
                explore where the community meets.
              </span>
            </div>

            <div style={styles.mapBadge}>
              {filteredEvents.filter((e) => e.latitude && e.longitude).length} mapped
            </div>
          </div>

          {hasLocationEvents ? (
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
          ) : (
            <div
              style={{
                padding: "30px 18px",
                color: "rgba(220,240,230,0.75)",
                fontSize: 14,
              }}
            >
              No events with map coordinates match the current filters.
            </div>
          )}
        </div>

        {/* RESULT INFO */}
        <div style={styles.resultRow}>
          <div style={styles.resultText}>
            {loading
              ? "Loading events..."
              : `${filteredEvents.length} event${
                  filteredEvents.length === 1 ? "" : "s"
                } found`}
          </div>
        </div>

        {/* GRID */}
        {loading ? (
          <div style={styles.loadingWrap}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={styles.skeleton} />
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyTitle}>No events found</div>
            <div style={styles.emptyText}>
              Try changing category, country, month or status filters to see
              more community events.
            </div>
            <button
              type="button"
              onClick={clearAllFilters}
              style={styles.viewButton}
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div style={styles.grid}>
            {filteredEvents.map((evt) => {
              const status = getEventStatus(evt);
              const dateText = formatEventDateRange(evt);

              const isFree =
                evt.is_free || evt.price_from === 0 || evt.price_from === null;

              const priceLabel = isFree
                ? "Free event"
                : evt.price_from
                ? `From ${evt.price_from} €`
                : "Price on request";

              return (
                <div
                  key={evt.id}
                  style={styles.card}
                  className="events-card-hover"
                  onClick={() => navigate(`/event/${evt.id}`)}
                  onMouseEnter={(e) => {
                    const img = e.currentTarget.querySelector("img");
                    if (img) img.style.transform = "scale(1.07)";
                  }}
                  onMouseLeave={(e) => {
                    const img = e.currentTarget.querySelector("img");
                    if (img) img.style.transform = "scale(1.02)";
                  }}
                >
                  <div style={styles.cardGlow} />

                  <div style={styles.imgWrapper}>
                    <img
                      src={getCover(evt)}
                      style={styles.img}
                      alt={evt.title}
                    />
                    <div style={styles.imgOverlay} />

                    <div style={styles.topTagsRow}>
                      <div style={styles.topTag}>
                        {evt.category || "Community Event"}
                      </div>
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

                    <div style={styles.metaBlock}>
                      <div style={styles.metaItem}>
                        <span style={styles.icon}>📅</span>
                        <span>{dateText}</span>
                      </div>

                      {evt.organizer_name && (
                        <div style={styles.metaItem}>
                          <span style={styles.icon}>👤</span>
                          <span>{evt.organizer_name}</span>
                        </div>
                      )}
                    </div>

                    <div style={styles.bottomRow}>
                      <div style={styles.priceWrap}>
                        <span style={styles.priceLabel}>Pricing</span>
                        <span style={styles.priceText}>{priceLabel}</span>
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
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}