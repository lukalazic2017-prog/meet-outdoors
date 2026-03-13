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
          background: radial-gradient(circle at 30% 30%, rgba(164,227,194,1), rgba(30,120,85,1));
          border:2px solid rgba(10,45,30,0.95);
          box-shadow: 0 16px 34px rgba(0,0,0,0.55), 0 0 18px rgba(164,227,194,0.45);
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
      iconSize: [42, 42],
      iconAnchor: [21, 21],
    });

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
        } else {
          matchRadius = true;
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

  const styles = {
    page: {
      minHeight: "100vh",
      padding: isMobile ? "0 0 34px" : "22px 16px 56px",
      background:
        "radial-gradient(1000px 500px at 12% -4%, rgba(0,255,195,0.12), transparent 58%)," +
        "radial-gradient(900px 420px at 90% -8%, rgba(124,77,255,0.11), transparent 56%)," +
        "linear-gradient(180deg, #020a08 0%, #010406 48%, #000 100%)",
      display: "flex",
      justifyContent: "center",
      color: "#f3f8f5",
      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      overflowX: "hidden",
      boxSizing: "border-box",
    },

    container: {
      width: "100%",
      maxWidth: 1280,
      overflowX: "hidden",
      boxSizing: "border-box",
    },

    hero: {
      position: "relative",
      overflow: "hidden",
      borderRadius: isMobile ? "0 0 28px 28px" : 30,
      padding: isMobile ? "14px 14px 18px" : "26px 24px",
      marginBottom: isMobile ? 14 : 22,
      border: isMobile ? "none" : "1px solid rgba(90,170,130,0.22)",
      background:
        "linear-gradient(145deg, rgba(8,26,19,0.98), rgba(3,10,8,0.98))",
      boxShadow: isMobile
        ? "0 22px 46px rgba(0,0,0,0.48)"
        : "0 24px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.04)",
    },

    heroGlow: {
      position: "absolute",
      top: -120,
      right: -80,
      width: 280,
      height: 280,
      borderRadius: "50%",
      background: "radial-gradient(circle, rgba(0,255,195,0.18), transparent 68%)",
      filter: "blur(16px)",
      pointerEvents: "none",
    },

    heroGlow2: {
      position: "absolute",
      bottom: -120,
      left: -60,
      width: 240,
      height: 240,
      borderRadius: "50%",
      background: "radial-gradient(circle, rgba(124,77,255,0.16), transparent 68%)",
      filter: "blur(20px)",
      pointerEvents: "none",
    },

    badge: {
      display: "inline-flex",
      alignItems: "center",
      padding: "7px 12px",
      borderRadius: 999,
      border: "1px solid rgba(110,186,150,0.36)",
      background: "rgba(8,40,26,0.72)",
      fontSize: 10,
      letterSpacing: "0.16em",
      textTransform: "uppercase",
      color: "rgba(214,244,227,0.95)",
      marginBottom: 10,
      fontWeight: 900,
      position: "relative",
      zIndex: 2,
    },

    titleRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: isMobile ? "flex-start" : "flex-end",
      gap: 18,
      flexWrap: "wrap",
      flexDirection: isMobile ? "column" : "row",
      position: "relative",
      zIndex: 2,
    },

    titleBox: {
      flex: "1 1 320px",
      width: "100%",
    },

    title: {
      fontSize: isMobile ? 34 : 40,
      lineHeight: 0.98,
      fontWeight: 950,
      color: "#f9fefb",
      marginBottom: 8,
      letterSpacing: "-0.04em",
      wordBreak: "break-word",
      textShadow: "0 10px 28px rgba(0,0,0,0.35)",
    },

    subtitle: {
      fontSize: isMobile ? 13 : 15,
      color: "rgba(220,240,230,0.82)",
      lineHeight: 1.62,
      maxWidth: 720,
    },

    statsRow: {
      display: "grid",
      gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, auto)",
      gap: 10,
      width: isMobile ? "100%" : "auto",
      marginTop: isMobile ? 12 : 0,
    },

    statPill: {
      padding: isMobile ? "12px 12px" : "10px 14px",
      borderRadius: 18,
      background:
        "linear-gradient(145deg, rgba(12,42,31,0.92), rgba(7,26,20,0.92))",
      border: "1px solid rgba(110,186,150,0.22)",
      whiteSpace: "nowrap",
      fontSize: 12,
      boxShadow: "0 10px 24px rgba(0,0,0,0.28)",
      textAlign: isMobile ? "center" : "left",
    },

    mobileToolbar: {
      display: isMobile ? "flex" : "none",
      alignItems: "center",
      gap: 10,
      padding: "0 14px",
      marginBottom: 14,
    },

    mobilePrimaryBtn: {
      flex: 1,
      minHeight: 46,
      borderRadius: 16,
      border: "1px solid rgba(110,186,150,0.22)",
      background:
        "linear-gradient(145deg, rgba(7,24,18,0.98), rgba(4,15,11,0.98))",
      color: "#f5fff9",
      fontWeight: 800,
      fontSize: 13,
      boxShadow: "0 12px 24px rgba(0,0,0,0.28)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },

    resultChipMobile: {
      padding: "0 14px",
      marginBottom: 12,
    },

    resultChipMobileInner: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "9px 12px",
      borderRadius: 999,
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(255,255,255,0.08)",
      color: "rgba(235,245,240,0.9)",
      fontSize: 12,
      fontWeight: 700,
    },

    filterOverlay: {
      display: isMobile && showFiltersMobile ? "block" : "none",
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.72)",
      backdropFilter: "blur(8px)",
      zIndex: 9998,
    },

    filterDrawer: {
      display: isMobile && showFiltersMobile ? "block" : "none",
      position: "fixed",
      left: 0,
      right: 0,
      bottom: 0,
      maxHeight: "88vh",
      overflowY: "auto",
      borderTopLeftRadius: 26,
      borderTopRightRadius: 26,
      background:
        "linear-gradient(180deg, rgba(7,18,14,0.99), rgba(2,8,6,0.99))",
      borderTop: "1px solid rgba(110,186,150,0.22)",
      boxShadow: "0 -26px 70px rgba(0,0,0,0.6)",
      zIndex: 9999,
      padding: "14px 14px 26px",
    },

    filterDrawerHandle: {
      width: 54,
      height: 5,
      borderRadius: 999,
      background: "rgba(255,255,255,0.22)",
      margin: "0 auto 14px",
    },

    filterDrawerHead: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 14,
    },

    filterDrawerTitle: {
      fontSize: 18,
      fontWeight: 900,
      color: "#f7fff9",
      letterSpacing: "-0.02em",
    },

    closeDrawerBtn: {
      padding: "10px 14px",
      borderRadius: 14,
      border: "1px solid rgba(255,255,255,0.10)",
      background: "rgba(255,255,255,0.05)",
      color: "#fff",
      fontWeight: 800,
      fontSize: 12,
    },

    filterBar: {
      marginTop: isMobile ? 0 : 18,
      marginBottom: 20,
      padding: isMobile ? 0 : 16,
      borderRadius: isMobile ? 0 : 24,
      background: isMobile
        ? "transparent"
        : "linear-gradient(145deg, rgba(5,18,14,0.98), rgba(3,10,8,0.98))",
      border: isMobile ? "none" : "1px solid rgba(60,120,90,0.35)",
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))",
      gap: 14,
      width: "100%",
      boxSizing: "border-box",
      overflow: "visible",
      boxShadow: isMobile
        ? "none"
        : "0 22px 60px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.03)",
    },

    filterGroup: {
      display: "flex",
      flexDirection: "column",
      position: "relative",
      fontSize: 12,
      color: "rgba(220,240,230,0.86)",
      minWidth: 0,
      width: "100%",
      boxSizing: "border-box",
    },

    filterLabel: {
      marginBottom: 7,
      opacity: 0.88,
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: "0.03em",
    },

    dropdownBox: {
      padding: "13px 14px",
      borderRadius: 16,
      background:
        "linear-gradient(145deg, rgba(7,24,18,1), rgba(4,15,11,1))",
      border: "1px solid rgba(110,186,150,0.26)",
      cursor: "pointer",
      fontSize: 13,
      color: "#f3f8f5",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
      width: "100%",
      boxSizing: "border-box",
      minWidth: 0,
      boxShadow: "0 10px 22px rgba(0,0,0,0.22)",
      minHeight: 48,
    },

    dropdownBoxText: {
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      minWidth: 0,
      flex: 1,
    },

    dropdownList: {
      position: "absolute",
      top: 64,
      left: 0,
      right: 0,
      maxHeight: 230,
      overflowY: "auto",
      background: "rgba(2,12,8,0.98)",
      borderRadius: 18,
      border: "1px solid rgba(110,186,150,0.45)",
      zIndex: 9999,
      boxShadow: "0 18px 50px rgba(0,0,0,0.85)",
      padding: 6,
    },

    dropdownItem: {
      padding: "11px 12px",
      fontSize: 13,
      cursor: "pointer",
      color: "#f3f8f5",
      wordBreak: "break-word",
      borderRadius: 12,
    },

    segmented: {
      display: "flex",
      flexWrap: "wrap",
      padding: 4,
      borderRadius: 18,
      background:
        "linear-gradient(145deg, rgba(7,24,18,1), rgba(4,15,11,1))",
      border: "1px solid rgba(110,186,150,0.26)",
      gap: 6,
      width: "100%",
      boxSizing: "border-box",
      boxShadow: "0 10px 22px rgba(0,0,0,0.22)",
    },

    segButton: (active) => ({
      padding: isMobile ? "9px 11px" : "7px 11px",
      borderRadius: 999,
      fontSize: 11,
      border: "none",
      cursor: "pointer",
      background: active
        ? "linear-gradient(135deg, #a4e3c2, #6bc19a, #3f8d6a)"
        : "transparent",
      color: active ? "#05150d" : "rgba(220,240,230,0.86)",
      fontWeight: active ? 800 : 600,
      whiteSpace: "nowrap",
      boxShadow: active ? "0 8px 18px rgba(107,193,154,0.28)" : "none",
      minHeight: isMobile ? 36 : "auto",
    }),

    checkboxRow: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      fontSize: 12,
      marginTop: 10,
      flexWrap: "wrap",
      color: "rgba(230,245,237,0.88)",
    },

    dateInput: {
      width: "100%",
      padding: "13px 14px",
      borderRadius: 16,
      border: "1px solid rgba(110,186,150,0.26)",
      background:
        "linear-gradient(145deg, rgba(7,24,18,1), rgba(4,15,11,1))",
      color: "#f3f8f5",
      fontSize: 12,
      boxSizing: "border-box",
      minWidth: 0,
      boxShadow: "0 10px 22px rgba(0,0,0,0.22)",
      minHeight: 48,
    },

    range: {
      width: "100%",
      accentColor: "rgba(164,227,194,1)",
    },

    rangeValue: {
      fontSize: 12,
      color: "rgba(230,255,240,0.9)",
      marginTop: 8,
    },

    rangeHint: {
      fontSize: 11,
      opacity: 0.72,
      marginTop: 4,
    },

    clearBtn: {
      padding: "13px 14px",
      borderRadius: 16,
      border: "1px solid rgba(110,186,150,0.22)",
      background: "rgba(20,60,45,0.95)",
      color: "#f5fff9",
      fontSize: 12,
      cursor: "pointer",
      alignSelf: "flex-start",
      fontWeight: 800,
      boxShadow: "0 10px 22px rgba(0,0,0,0.22)",
      minHeight: 48,
    },

    drawerActionRow: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 10,
      marginTop: 16,
    },

    mapWrapper: {
      marginTop: isMobile ? 0 : 16,
      marginBottom: 20,
      borderRadius: isMobile ? 22 : 24,
      overflow: "hidden",
      border: "1px solid rgba(70,130,100,0.22)",
      background:
        "linear-gradient(145deg, rgba(6,18,14,0.98), rgba(2,8,6,0.98))",
      boxShadow:
        "0 22px 56px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.03)",
      width: isMobile ? "calc(100% - 20px)" : "100%",
      marginLeft: isMobile ? 10 : 0,
      marginRight: isMobile ? 10 : 0,
      boxSizing: "border-box",
    },

    mapTopBar: {
      padding: isMobile ? "12px 12px" : "14px 16px",
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
      gap: 3,
      minWidth: 0,
    },

    mapTag: {
      padding: "7px 12px",
      borderRadius: 999,
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(110,186,150,0.20)",
      fontSize: 11,
      fontWeight: 700,
      color: "rgba(230,245,237,0.92)",
    },

    mapContainer: {
      height: isMobile ? 240 : 380,
      width: "100%",
    },

    grid: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(290px, 1fr))",
      gap: isMobile ? 16 : 20,
      width: "100%",
      padding: isMobile ? "0 10px" : 0,
      boxSizing: "border-box",
    },

    skeletonCard: {
      borderRadius: 24,
      overflow: "hidden",
      background:
        "linear-gradient(145deg, rgba(4,16,11,0.98), rgba(7,29,20,0.98))",
      border: "1px solid rgba(70,130,100,0.18)",
      boxShadow: "0 16px 40px rgba(0,0,0,0.40)",
    },

    skeletonImage: {
      height: isMobile ? 220 : 190,
      background:
        "linear-gradient(90deg, rgba(255,255,255,0.05), rgba(255,255,255,0.08), rgba(255,255,255,0.05))",
    },

    skeletonBody: {
      padding: 14,
      display: "grid",
      gap: 10,
    },

    skeletonLine: {
      height: 14,
      borderRadius: 999,
      background: "rgba(255,255,255,0.08)",
    },

    card: {
      borderRadius: isMobile ? 24 : 22,
      overflow: "hidden",
      background:
        "linear-gradient(145deg, rgba(4,16,11,0.99), rgba(7,29,20,0.99))",
      border: "1px solid rgba(70,130,100,0.18)",
      cursor: "pointer",
      boxShadow: isMobile
        ? "0 18px 38px rgba(0,0,0,0.42)"
        : "0 18px 46px rgba(0,0,0,0.52)",
      display: "flex",
      flexDirection: "column",
      width: "100%",
      boxSizing: "border-box",
      transition: "transform 0.28s ease, box-shadow 0.28s ease",
    },

    imgWrapper: {
      height: isMobile ? 230 : 190,
      position: "relative",
      overflow: "hidden",
    },

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
        "linear-gradient(to top, rgba(0,0,0,0.88), rgba(0,0,0,0.10))",
    },

    imgTopRow: {
      position: "absolute",
      top: 12,
      left: 12,
      right: 12,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 8,
      flexWrap: "wrap",
    },

    floatingMeta: {
      padding: "7px 11px",
      borderRadius: 999,
      background: "rgba(0,0,0,0.42)",
      border: "1px solid rgba(255,255,255,0.14)",
      color: "#fff",
      fontSize: 11,
      backdropFilter: "blur(10px)",
      fontWeight: 800,
    },

    cardBody: {
      padding: isMobile ? 16 : 15,
      display: "flex",
      flexDirection: "column",
      gap: 8,
      fontSize: 13,
      minWidth: 0,
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
        padding: "6px 10px",
        borderRadius: 999,
        border: `1px solid ${border}`,
        fontSize: 10,
        textTransform: "uppercase",
        letterSpacing: "0.10em",
        color: "#f5fff9",
        background: bg,
        fontWeight: 900,
        boxShadow: "0 8px 18px rgba(0,0,0,0.22)",
      };
    },

    titleText: {
      fontSize: isMobile ? 20 : 18,
      fontWeight: 900,
      color: "#f7fff9",
      wordBreak: "break-word",
      letterSpacing: "-0.02em",
      lineHeight: 1.15,
    },

    metaRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 12,
      marginTop: 2,
      flexDirection: isMobile ? "column" : "row",
    },

    metaLeft: {
      display: "flex",
      flexDirection: "column",
      gap: 6,
      fontSize: 12,
      color: "rgba(210,234,220,0.9)",
    },

    metaRight: {
      fontSize: 12,
      color: "rgba(200,220,210,0.82)",
      textAlign: isMobile ? "left" : "right",
      wordBreak: "break-word",
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.06)",
      padding: "8px 10px",
      borderRadius: 12,
    },

    bottomRow: {
      marginTop: 8,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12,
      flexWrap: "wrap",
    },

    creatorChip: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "9px 11px",
      borderRadius: 999,
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.06)",
      fontSize: 11,
      color: "rgba(235,245,240,0.88)",
      fontWeight: 700,
    },

    viewButton: {
      padding: isMobile ? "12px 16px" : "10px 14px",
      borderRadius: 999,
      border: "none",
      background: "linear-gradient(120deg, #a4e3c2, #6bc19a, #3f8d6a)",
      color: "#032013",
      fontSize: 12,
      fontWeight: 900,
      cursor: "pointer",
      boxShadow: "0 10px 24px rgba(63,141,106,0.28)",
      minHeight: isMobile ? 42 : "auto",
    },

    emptyState: {
      borderRadius: 24,
      padding: isMobile ? "28px 18px" : "38px 24px",
      textAlign: "center",
      background:
        "linear-gradient(145deg, rgba(5,18,14,0.98), rgba(2,8,6,0.98))",
      border: "1px solid rgba(70,130,100,0.18)",
      boxShadow: "0 20px 50px rgba(0,0,0,0.45)",
      margin: isMobile ? "0 10px" : 0,
    },

    emptyTitle: {
      fontSize: 22,
      fontWeight: 900,
      color: "#f7fff9",
      marginBottom: 8,
    },

    emptyText: {
      fontSize: 13,
      color: "rgba(220,240,230,0.78)",
      lineHeight: 1.6,
    },

    stickyFilterBar: {
      display: isMobile ? "flex" : "none",
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
    },
  };

  const stats = {
    total: filteredTours.length,
    upcoming: filteredTours.filter((t) => getStatus(t) === "Upcoming").length,
    inProgress: filteredTours.filter((t) => getStatus(t) === "In progress")
      .length,
    expired: filteredTours.filter((t) => getStatus(t) === "Expired").length,
  };

  const filterContent = (
    <div style={styles.filterBar}>
      <div style={styles.filterGroup}>
        <span style={styles.filterLabel}>Activity</span>
        <div
          style={styles.dropdownBox}
          onClick={() => {
            setShowActivityList((p) => !p);
            setShowCountryList(false);
          }}
        >
          <span style={styles.dropdownBoxText}>{activityFilter}</span>
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
                    a === activityFilter ? "rgba(20,70,50,0.9)" : "transparent",
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

      <div style={styles.filterGroup}>
        <span style={styles.filterLabel}>Country</span>
        <div
          style={styles.dropdownBox}
          onClick={() => {
            setShowCountryList((p) => !p);
            setShowActivityList(false);
          }}
        >
          <span style={styles.dropdownBoxText}>{countryFilter}</span>
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
                    c === countryFilter ? "rgba(20,70,50,0.9)" : "transparent",
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
          <label htmlFor="capacityFilter">Only tours with available spots</label>
        </div>
      </div>

      <div style={styles.filterGroup}>
        <span style={styles.filterLabel}>Start date from</span>
        <input
          type="date"
          value={startDateFilter}
          onChange={(e) => setStartDateFilter(e.target.value)}
          style={styles.dateInput}
        />
      </div>

      <div style={styles.filterGroup}>
        <span style={styles.filterLabel}>Start date to</span>
        <input
          type="date"
          value={endDateFilter}
          onChange={(e) => setEndDateFilter(e.target.value)}
          style={styles.dateInput}
        />
      </div>

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
            setRadiusKm(0);
            setRadiusCenter(mapCenter);
          }}
          style={styles.clearBtn}
        >
          Clear all
        </button>
      </div>

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
        <div style={styles.rangeHint}>Tap map to change center</div>
      </div>

      {isMobile && (
        <div style={styles.drawerActionRow}>
          <button
            type="button"
            style={styles.clearBtn}
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
          >
            Reset
          </button>

          <button
            type="button"
            style={{
              ...styles.clearBtn,
              background: "linear-gradient(120deg, #a4e3c2, #6bc19a, #3f8d6a)",
              color: "#032013",
            }}
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
      <div style={styles.container}>
        <div style={styles.hero}>
          <div style={styles.heroGlow} />
          <div style={styles.heroGlow2} />

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

        {isMobile ? (
          <>
            <div style={styles.mobileToolbar}>
              <button
                type="button"
                style={styles.mobilePrimaryBtn}
                onClick={() => setShowFiltersMobile(true)}
              >
                ⚙️ Filters
              </button>

              <button
                type="button"
                style={styles.mobilePrimaryBtn}
                onClick={() =>
                  window.scrollTo({ top: 520, behavior: "smooth" })
                }
              >
                🗺️ Map
              </button>
            </div>

            <div style={styles.resultChipMobile}>
              <div style={styles.resultChipMobileInner}>
                🔍 {filteredTours.length} tours shown
              </div>
            </div>

            <div
              style={styles.filterOverlay}
              onClick={() => setShowFiltersMobile(false)}
            />

            <div style={styles.filterDrawer}>
              <div style={styles.filterDrawerHandle} />
              <div style={styles.filterDrawerHead}>
                <div style={styles.filterDrawerTitle}>Filters</div>
                <button
                  type="button"
                  style={styles.closeDrawerBtn}
                  onClick={() => setShowFiltersMobile(false)}
                >
                  Close
                </button>
              </div>
              {filterContent}
            </div>
          </>
        ) : (
          filterContent
        )}

        <div style={styles.mapWrapper}>
          <div style={styles.mapTopBar}>
            <div style={styles.mapTopLeft}>
              <span style={{ fontSize: 14, fontWeight: 800 }}>Map of tours</span>
              <span style={{ fontSize: 11, opacity: 0.82 }}>
                Pan and zoom the map freely. Markers show tours with a location —
                tap a marker to open the tour.
              </span>
            </div>

            <div style={styles.mapTag}>
              🎯 Center: {radiusCenter[0].toFixed(2)}, {radiusCenter[1].toFixed(2)}
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

        {loading ? (
          <div style={styles.grid}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={styles.skeletonCard}>
                <div style={styles.skeletonImage} />
                <div style={styles.skeletonBody}>
                  <div style={{ ...styles.skeletonLine, width: "34%" }} />
                  <div style={{ ...styles.skeletonLine, width: "82%", height: 18 }} />
                  <div style={{ ...styles.skeletonLine, width: "62%" }} />
                  <div style={{ ...styles.skeletonLine, width: "46%" }} />
                </div>
              </div>
            ))}
          </div>
        ) : filteredTours.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyTitle}>No tours found</div>
            <div style={styles.emptyText}>
              Try changing activity, country, dates or radius and explore again.
            </div>
          </div>
        ) : (
          <div style={styles.grid}>
            {filteredTours.map((tour) => {
              const status = getStatus(tour);
              const creatorName =
                tour.profiles?.full_name || tour.creator_name || "Unknown creator";

              return (
                <div
                  key={tour.id}
                  style={styles.card}
                  onClick={() => navigate(`/tour/${tour.id}`)}
                  onMouseEnter={(e) => {
                    if (isMobile) return;
                    e.currentTarget.style.transform = "translateY(-6px)";
                    e.currentTarget.style.boxShadow = "0 28px 70px rgba(0,0,0,0.66)";
                    const img = e.currentTarget.querySelector("img");
                    if (img) img.style.transform = "scale(1.06)";
                  }}
                  onMouseLeave={(e) => {
                    if (isMobile) return;
                    e.currentTarget.style.transform = "translateY(0px)";
                    e.currentTarget.style.boxShadow = "0 18px 46px rgba(0,0,0,0.52)";
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

                    <div style={styles.imgTopRow}>
                      <div style={styles.statusPill(status)}>{status}</div>
                      <div style={styles.floatingMeta}>
                        🧭 {tour.activity || "Activity"}
                      </div>
                    </div>
                  </div>

                  <div style={styles.cardBody}>
                    <div style={styles.titleText}>{tour.title}</div>

                    <div style={styles.metaRow}>
                      <div style={styles.metaLeft}>
                        <span>📍 {tour.country || "Country"}</span>
                        {tour.start_date && (
                          <span>
                            📅 {new Date(tour.start_date).toLocaleDateString()}
                            {tour.end_date
                              ? ` – ${new Date(tour.end_date).toLocaleDateString()}`
                              : ""}
                          </span>
                        )}
                      </div>

                      <div style={styles.metaRight}>👤 {creatorName}</div>
                    </div>

                    <div style={styles.bottomRow}>
                      <div style={styles.creatorChip}>
                        {hasAvailableSpots(tour) ? "✅ Spots available" : "⛔ Full"}
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