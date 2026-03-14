// src/pages/EventDetails.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker } from "react-leaflet";

const defaultCover =
  "https://images.pexels.com/photos/3324422/pexels-photo-3324422.jpeg";

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  const [user, setUser] = useState(null);

  const [attendees, setAttendees] = useState([]);
  const [attendeesCount, setAttendeesCount] = useState(0);
  const [hasJoined, setHasJoined] = useState(false);

  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [lightboxOpen, setLightboxOpen] = useState(false);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 820px)");
    const apply = () => setIsMobile(!!mq.matches);
    apply();
    if (mq.addEventListener) mq.addEventListener("change", apply);
    else mq.addListener(apply);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", apply);
      else mq.removeListener(apply);
    };
  }, []);

  const formatDateTime = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    return `${d.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    })} · ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  };

  const dateLine = event
    ? `${formatDateTime(event.start_time)}${
        event.end_time ? " — " + formatDateTime(event.end_time) : ""
      }`
    : "";

  const locationLine =
    event?.location_name || event?.city || event?.country || "Location TBA";

  const priceLine = event
    ? event.is_free
      ? "Free to join"
      : event.price_from
      ? `From ${event.price_from} €`
      : "Price on request"
    : "";

  const coverUrl = event?.cover_url || defaultCover;

  const initialsFromName = (name) => {
    const safe = (name || "").trim();
    if (!safe) return "👤";
    const parts = safe.split(" ").filter(Boolean);
    const a = parts[0]?.[0]?.toUpperCase() || "";
    const b = parts[1]?.[0]?.toUpperCase() || "";
    return (a + b) || "👤";
  };

  const safeNum = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const loadAttendees = async (eventId, currentUser) => {
    const { data, error } = await supabase
      .from("event_attendees")
      .select(
        `
        id,
        user_id,
        profiles (
          id,
          full_name,
          avatar_url
        )
      `
      )
      .eq("event_id", eventId)
      .order("id");

    if (error) console.log("loadAttendees error", error);

    setAttendees(data || []);
    setAttendeesCount(data?.length || 0);

    if (currentUser) {
      setHasJoined((data || []).some((row) => row.user_id === currentUser.id));
    } else {
      setHasJoined(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setErrorMsg("");

      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user ?? null);

      const { data: ev, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.log("EventDetails load error", error);
        setEvent(null);
        setLoading(false);
        return;
      }

      setEvent(ev);
      await loadAttendees(ev.id, user);
      setLoading(false);
    };

    load();
  }, [id]);

  const handleJoin = async () => {
    if (!event) return;

    if (!user) {
      setErrorMsg("Please sign in to join this event.");
      return;
    }

    if (joining || hasJoined) return;

    setJoining(true);
    setErrorMsg("");

    const { error } = await supabase.from("event_attendees").upsert(
      [{ event_id: event.id, user_id: user.id }],
      { onConflict: "event_id,user_id" }
    );

    if (error) {
      console.log("Join error", error);
      setErrorMsg("Could not join. Please try again.");
      setJoining(false);
      return;
    }

    await loadAttendees(event.id, user);
    setJoining(false);
  };

  const handleLeave = async () => {
    if (!event) return;

    if (!user) {
      setErrorMsg("Please sign in to leave this event.");
      return;
    }

    if (leaving) return;

    setLeaving(true);
    setErrorMsg("");

    const { error } = await supabase
      .from("event_attendees")
      .delete()
      .eq("event_id", event.id)
      .eq("user_id", user.id);

    if (error) {
      console.log("Leave error", error);
      setErrorMsg("Could not leave. Please try again.");
      setLeaving(false);
      return;
    }

    await loadAttendees(event.id, user);
    setLeaving(false);
  };

  const handleDeleteEvent = async () => {
    if (!event) return;

    const ok = window.confirm("Delete this event permanently?");
    if (!ok) return;

    const { error } = await supabase.from("events").delete().eq("id", event.id);

    if (error) {
      console.log("Delete event error", error);
      alert("Could not delete event.");
      return;
    }

    navigate("/events");
  };

  const isOwner = user && event && user.id === event.creator_id;
  const joinLabel = hasJoined ? "You’re going" : "Join event";

  const lat = useMemo(() => {
    const n = safeNum(event?.latitude);
    return n ?? 43.9;
  }, [event?.latitude]);

  const lng = useMemo(() => {
    const n = safeNum(event?.longitude);
    return n ?? 21;
  }, [event?.longitude]);

  const heroParticipants = attendees.slice(0, 5);

  const styles = {
    page: {
      position: "relative",
      minHeight: "100vh",
      overflowX: "hidden",
      overflowY: "visible",
      marginTop: isMobile ? -120 : 100,
      padding: isMobile ? "0 0 110px" : "64px 0 40px",
      background:
        "radial-gradient(circle at top, #081b16 0%, #04100d 28%, #02060b 58%, #000000 100%)",
      color: "#eafff5",
      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    },

    bgGlow1: {
      position: "absolute",
      top: -180,
      left: -160,
      width: 520,
      height: 520,
      borderRadius: "50%",
      background:
        "radial-gradient(circle, rgba(0,255,190,0.16), transparent 68%)",
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
      background:
        "radial-gradient(circle, rgba(124,77,255,0.16), transparent 68%)",
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
      background:
        "radial-gradient(circle, rgba(0,200,255,0.10), transparent 68%)",
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

    container: {
      position: "relative",
      zIndex: 2,
      width: "100%",
      maxWidth: 1400,
      margin: "0 auto",
      padding: isMobile ? "0 0 20px" : "0 18px 20px",
      overflow: "visible",
      boxSizing: "border-box",
    },

    topBar: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      flexWrap: "wrap",
      marginBottom: isMobile ? 0 : 14,
      padding: isMobile ? "14px 14px 10px" : "0 4px",
    },

    backBtn: {
      display: "inline-flex",
      alignItems: "center",
      gap: 10,
      minHeight: 46,
      padding: "0 16px",
      borderRadius: 999,
      border: "1px solid rgba(255,255,255,0.10)",
      background:
        "linear-gradient(145deg, rgba(7,22,17,0.96), rgba(3,11,8,0.96))",
      color: "#f5fff9",
      fontWeight: 900,
      fontSize: 13,
      boxShadow: "0 14px 32px rgba(0,0,0,0.30)",
      cursor: "pointer",
      WebkitTapHighlightColor: "transparent",
    },

    crumb: {
      fontSize: 11,
      letterSpacing: "0.14em",
      textTransform: "uppercase",
      color: "rgba(234,255,245,0.60)",
      fontWeight: 900,
    },

    hero: {
      position: "relative",
      padding: 0,
      borderRadius: isMobile ? "0 0 34px 34px" : 34,
      overflow: "hidden",
      border: isMobile ? "none" : "1px solid rgba(255,255,255,0.08)",
      background:
        "linear-gradient(145deg, rgba(10,24,19,0.94), rgba(3,10,8,0.98))",
      boxShadow: isMobile
        ? "0 26px 70px rgba(16,20,14,0.34)"
        : "0 30px 90px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.04)",
      marginBottom: isMobile ? 14 : 22,
    },

    heroImg: {
      width: "100%",
      height: isMobile ? 420 : 520,
      objectFit: "cover",
      transform: "scale(1.05)",
      filter: "saturate(1.08) contrast(1.04)",
      display: "block",
      cursor: "zoom-in",
    },

    heroOverlay: {
      position: "absolute",
      inset: 0,
      background: isMobile
        ? "linear-gradient(to top, rgba(2,8,6,1) 0%, rgba(2,8,6,0.98) 16%, rgba(2,8,6,0.68) 36%, rgba(2,8,6,0.20) 62%, rgba(2,8,6,0.08) 100%)"
        : "linear-gradient(to top, rgba(2,8,6,0.96) 0%, rgba(2,8,6,0.76) 22%, rgba(2,8,6,0.30) 55%, rgba(2,8,6,0.10) 100%)",
    },

    heroShine: {
      position: "absolute",
      inset: 0,
      background:
        "radial-gradient(circle at 18% 16%, rgba(0,255,190,0.18), transparent 28%), radial-gradient(circle at 80% 12%, rgba(124,77,255,0.18), transparent 30%)",
      mixBlendMode: "screen",
      pointerEvents: "none",
    },

    heroTopFloating: {
      position: "absolute",
      top: isMobile ? 14 : 18,
      left: isMobile ? 14 : 18,
      right: isMobile ? 14 : 18,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 10,
      flexWrap: "wrap",
      zIndex: 3,
    },

    heroTopActions: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap",
      justifyContent: "flex-end",
    },

    glassMiniBtn: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      minHeight: 40,
      minWidth: 40,
      padding: "0 14px",
      borderRadius: 999,
      border: "1px solid rgba(255,255,255,0.16)",
      background: "rgba(8,18,14,0.52)",
      backdropFilter: "blur(12px)",
      color: "#fff",
      fontWeight: 900,
      fontSize: 12,
      boxShadow: "0 12px 28px rgba(0,0,0,0.24)",
      cursor: "pointer",
      WebkitTapHighlightColor: "transparent",
    },

    heroContent: isMobile
      ? {
          position: "relative",
          padding: "0 14px 16px",
          marginTop: -26,
          display: "grid",
          gap: 14,
          zIndex: 2,
        }
      : {
          position: "absolute",
          inset: 22,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: 18,
          flexWrap: "wrap",
          zIndex: 2,
        },

    heroLeft: {
      minWidth: 0,
      maxWidth: isMobile ? "100%" : 760,
    },

    badgesRow: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      flexWrap: "wrap",
      marginBottom: 12,
    },

    badge: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "8px 13px",
      borderRadius: 999,
      border: "1px solid rgba(0,255,190,0.22)",
      background: "rgba(0,255,190,0.08)",
      boxShadow: "0 0 18px rgba(0,255,190,0.08)",
      fontSize: 11,
      fontWeight: 900,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: "#c8fff3",
      whiteSpace: "nowrap",
      backdropFilter: "blur(10px)",
    },

    heroTitle: {
      fontSize: isMobile ? 32 : 54,
      fontWeight: 1000,
      lineHeight: 0.96,
      margin: 0,
      color: "#f4fff9",
      letterSpacing: "-0.04em",
      textShadow: "0 6px 28px rgba(0,255,190,0.10)",
      wordBreak: "break-word",
    },

    heroSubtitle: {
      marginTop: 12,
      fontSize: isMobile ? 14 : 15,
      fontWeight: 700,
      color: "rgba(234,255,245,0.74)",
      maxWidth: 620,
      lineHeight: 1.65,
    },

    metaRow: {
      marginTop: 16,
      display: "flex",
      gap: 10,
      flexWrap: "wrap",
    },

    metaPill: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "10px 12px",
      borderRadius: 16,
      border: "1px solid rgba(255,255,255,0.10)",
      background: "rgba(255,255,255,0.06)",
      backdropFilter: "blur(12px)",
      fontSize: 12,
      fontWeight: 800,
      color: "rgba(234,255,245,0.90)",
      boxShadow: "0 10px 24px rgba(0,0,0,0.14)",
      maxWidth: "100%",
    },

    peoplePreviewRow: {
      marginTop: 16,
      display: "flex",
      alignItems: "center",
      gap: 12,
      flexWrap: "wrap",
    },

    peopleStack: {
      display: "flex",
      alignItems: "center",
    },

    peopleStackAvatar: {
      width: 36,
      height: 36,
      borderRadius: "50%",
      objectFit: "cover",
      border: "2px solid rgba(0,255,190,0.78)",
      boxShadow: "0 0 16px rgba(0,255,190,0.22)",
      background: "#08130f",
      color: "#fff",
    },

    peoplePreviewText: {
      fontSize: 12,
      fontWeight: 800,
      color: "rgba(234,255,245,0.72)",
    },

    heroRight: {
      minWidth: 0,
      width: isMobile ? "100%" : 360,
      maxWidth: isMobile ? "100%" : 360,
      alignSelf: isMobile ? "stretch" : "flex-end",
    },

    actionCard: {
      borderRadius: 24,
      padding: isMobile ? 16 : 18,
      border: "1px solid rgba(255,255,255,0.08)",
      background:
        "linear-gradient(145deg, rgba(9,24,18,0.92), rgba(4,12,9,0.92))",
      backdropFilter: "blur(14px)",
      boxShadow:
        "0 24px 48px rgba(0,0,0,0.20), inset 0 1px 0 rgba(255,255,255,0.04)",
    },

    actionTopRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 10,
    },

    actionTitle: {
      fontSize: 12,
      fontWeight: 1000,
      letterSpacing: "0.12em",
      marginBottom: 6,
      color: "rgba(234,255,245,0.70)",
      textTransform: "uppercase",
    },

    actionSub: {
      fontSize: 12,
      fontWeight: 700,
      color: "rgba(234,255,245,0.74)",
      lineHeight: 1.55,
    },

    statusBubble: {
      display: "inline-flex",
      padding: "7px 11px",
      borderRadius: 999,
      background: hasJoined
        ? "rgba(0,255,190,0.12)"
        : "rgba(255,255,255,0.06)",
      border: hasJoined
        ? "1px solid rgba(0,255,190,0.24)"
        : "1px solid rgba(255,255,255,0.10)",
      fontSize: 11,
      fontWeight: 1000,
      color: hasJoined ? "#cffff0" : "#fff",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      whiteSpace: "nowrap",
    },

    bigCount: {
      fontSize: isMobile ? 38 : 44,
      fontWeight: 1000,
      color: "#ffffff",
      lineHeight: 1,
      letterSpacing: "-0.04em",
      marginTop: 16,
    },

    countHint: {
      marginTop: 6,
      fontSize: 12,
      fontWeight: 800,
      color: "rgba(234,255,245,0.66)",
      lineHeight: 1.5,
    },

    miniStats: {
      display: "grid",
      gridTemplateColumns: "repeat(3, minmax(0,1fr))",
      gap: 10,
      marginTop: 16,
      marginBottom: 4,
    },

    miniStatCard: {
      borderRadius: 16,
      padding: "12px 10px",
      background:
        "linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.03))",
      border: "1px solid rgba(255,255,255,0.08)",
      textAlign: "center",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
    },

    miniStatValue: {
      fontSize: 16,
      fontWeight: 1000,
      color: "#ffffff",
      lineHeight: 1.05,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },

    miniStatLabel: {
      marginTop: 5,
      fontSize: 10,
      fontWeight: 900,
      letterSpacing: "0.10em",
      textTransform: "uppercase",
      color: "rgba(234,255,245,0.54)",
    },

    primaryBtn: (disabled) => ({
      marginTop: 14,
      width: "100%",
      minHeight: 50,
      padding: "12px 14px",
      borderRadius: 999,
      border: "none",
      cursor: disabled ? "default" : "pointer",
      fontWeight: 1000,
      fontSize: 13,
      background: disabled
        ? "rgba(255,255,255,0.14)"
        : "linear-gradient(135deg, #00ffbe, #52d6ff, #7c4dff)",
      color: disabled ? "rgba(234,255,245,0.76)" : "#042217",
      boxShadow: disabled ? "none" : "0 16px 36px rgba(0,255,190,0.20)",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      WebkitTapHighlightColor: "transparent",
    }),

    secondaryBtn: {
      marginTop: 10,
      width: "100%",
      minHeight: 48,
      padding: "11px 14px",
      borderRadius: 999,
      border: "1px solid rgba(255,255,255,0.10)",
      cursor: "pointer",
      fontWeight: 950,
      fontSize: 13,
      background: "rgba(255,255,255,0.06)",
      color: "#fff",
      boxShadow: "0 12px 26px rgba(0,0,0,0.12)",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      WebkitTapHighlightColor: "transparent",
    },

    ownerRow: {
      marginTop: 10,
      display: "flex",
      gap: 10,
      flexWrap: "wrap",
    },

    ownerBtn: (danger) => ({
      flex: 1,
      minWidth: 140,
      minHeight: 46,
      padding: "11px 12px",
      borderRadius: 999,
      border: danger
        ? "1px solid rgba(255,110,90,0.18)"
        : "1px solid rgba(255,255,255,0.10)",
      cursor: "pointer",
      fontWeight: 1000,
      fontSize: 12,
      background: danger
        ? "rgba(255,110,90,0.08)"
        : "rgba(255,255,255,0.06)",
      color: danger ? "#ffb7aa" : "#f5fff9",
      boxShadow: "0 12px 26px rgba(0,0,0,0.10)",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      WebkitTapHighlightColor: "transparent",
    }),

    errorBox: {
      marginTop: 12,
      borderRadius: 16,
      padding: "11px 12px",
      border: "1px solid rgba(255,110,90,0.18)",
      background: "rgba(255,110,90,0.10)",
      color: "#ffd0c6",
      fontWeight: 850,
      fontSize: 12,
      lineHeight: 1.5,
    },

    grid: isMobile
      ? {
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 14,
          marginTop: 14,
          alignItems: "start",
          padding: "0 14px",
        }
      : {
          display: "grid",
          gridTemplateColumns: "minmax(0, 3fr) minmax(380px, 2fr)",
          gap: 18,
          marginTop: 18,
          alignItems: "start",
        },

    card: {
      borderRadius: 28,
      padding: isMobile ? 16 : 18,
      border: "1px solid rgba(255,255,255,0.08)",
      background:
        "linear-gradient(145deg, rgba(8,26,21,0.96), rgba(2,9,7,0.96))",
      backdropFilter: "blur(12px)",
      boxShadow:
        "0 20px 55px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.04)",
      overflow: "hidden",
    },

    sectionTitleRow: {
      display: "flex",
      alignItems: "baseline",
      justifyContent: "space-between",
      gap: 10,
      marginBottom: 10,
      flexWrap: "wrap",
    },

    sectionTitle: {
      fontSize: 13,
      fontWeight: 1000,
      color: "#f4fff9",
      letterSpacing: "0.12em",
      textTransform: "uppercase",
    },

    sectionHint: {
      fontSize: 12,
      fontWeight: 800,
      color: "rgba(234,255,245,0.62)",
    },

    paragraph: {
      marginTop: 6,
      fontSize: 14,
      lineHeight: 1.75,
      fontWeight: 650,
      color: "rgba(234,255,245,0.84)",
      whiteSpace: "pre-wrap",
    },

    infoGrid: {
      marginTop: 14,
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0,1fr))",
      gap: 12,
    },

    infoBox: {
      borderRadius: 20,
      padding: 14,
      border: "1px solid rgba(255,255,255,0.08)",
      background:
        "linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.03))",
      minWidth: 0,
      boxShadow: "0 10px 22px rgba(0,0,0,0.10)",
    },

    infoLabel: {
      fontSize: 10,
      textTransform: "uppercase",
      letterSpacing: "0.16em",
      fontWeight: 1000,
      color: "rgba(234,255,245,0.52)",
      marginBottom: 8,
    },

    infoValue: {
      fontSize: 14,
      fontWeight: 900,
      color: "#ffffff",
      wordBreak: "break-word",
      lineHeight: 1.45,
    },

    mapBox: {
      borderRadius: 22,
      overflow: "hidden",
      border: "1px solid rgba(255,255,255,0.08)",
      boxShadow: "0 14px 38px rgba(0,0,0,0.18)",
    },

    mapWrap: {
      height: isMobile ? 280 : 340,
      width: "100%",
    },

    mapTopMeta: {
      marginTop: 12,
      padding: "12px 14px",
      borderRadius: 16,
      border: "1px solid rgba(255,255,255,0.08)",
      background: "rgba(255,255,255,0.04)",
      display: "grid",
      gap: 6,
    },

    attendeesWrap: {
      marginTop: 18,
    },

    attendeesHeader: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
      flexWrap: "wrap",
    },

    attendeesCountChip: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "8px 12px",
      borderRadius: 999,
      border: "1px solid rgba(255,255,255,0.10)",
      background: "rgba(255,255,255,0.06)",
      fontWeight: 1000,
      fontSize: 12,
      color: "#f5fff9",
      whiteSpace: "nowrap",
      boxShadow: "0 8px 18px rgba(0,0,0,0.08)",
    },

    attendeeList: {
      marginTop: 14,
      maxHeight: isMobile ? 420 : 520,
      overflowY: "auto",
      paddingRight: 4,
    },

    attendeeRow: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "12px 12px",
      borderRadius: 20,
      border: "1px solid rgba(255,255,255,0.08)",
      background:
        "linear-gradient(145deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))",
      boxShadow: "0 10px 22px rgba(0,0,0,0.10)",
      marginBottom: 10,
      minWidth: 0,
      transition: "transform .15s ease, box-shadow .15s ease",
    },

    avatar: {
      width: 44,
      height: 44,
      borderRadius: "50%",
      objectFit: "cover",
      border: "2px solid rgba(0,255,190,0.70)",
      background: "#0b1612",
      flex: "0 0 auto",
      boxShadow: "0 0 16px rgba(0,255,190,0.18)",
    },

    avatarFallback: {
      width: 44,
      height: 44,
      borderRadius: "50%",
      border: "2px solid rgba(0,255,190,0.34)",
      background:
        "linear-gradient(135deg, rgba(0,255,190,0.18), rgba(124,77,255,0.18))",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: 1000,
      color: "#f5fff9",
      flex: "0 0 auto",
      boxShadow: "0 8px 16px rgba(0,0,0,0.10)",
    },

    attendeeName: {
      fontSize: 13,
      fontWeight: 1000,
      color: "#ffffff",
      display: "flex",
      alignItems: "center",
      gap: 8,
      flexWrap: "wrap",
      minWidth: 0,
    },

    attendeeArrow: {
      flex: "0 0 auto",
      fontSize: 13,
      color: "rgba(234,255,245,0.52)",
      fontWeight: 900,
    },

    youTag: {
      display: "inline-flex",
      padding: "3px 8px",
      borderRadius: 999,
      border: "1px solid rgba(0,255,190,0.20)",
      background: "rgba(0,255,190,0.10)",
      fontSize: 10,
      fontWeight: 1000,
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      color: "#cffff0",
      whiteSpace: "nowrap",
    },

    stickyBar: {
      position: "relative",
      left: 10,
      right: 5,
      bottom: 0,
      zIndex: 5000,
      borderRadius: 22,
      border: "1px solid rgba(255,255,255,0.10)",
      background:
        "linear-gradient(145deg, rgba(8,26,21,0.96), rgba(2,9,7,0.96))",
      backdropFilter: "blur(18px)",
      boxShadow: "0 24px 60px rgba(0,0,0,0.32)",
      padding: 10,
    },

    stickyInner: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },

    stickyMeta: {
      minWidth: 0,
      flex: 1,
      display: "flex",
      flexDirection: "column",
      gap: 4,
    },

    stickyTitle: {
      fontSize: 13,
      fontWeight: 1000,
      color: "#ffffff",
      lineHeight: 1.15,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },

    stickySub: {
      fontSize: 12,
      fontWeight: 800,
      color: "rgba(234,255,245,0.68)",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },

    stickyBtnPrimary: (disabled) => ({
      flex: "0 0 auto",
      minHeight: 46,
      padding: "12px 16px",
      borderRadius: 16,
      border: "none",
      fontWeight: 1000,
      fontSize: 13,
      cursor: disabled ? "default" : "pointer",
      background: disabled
        ? "rgba(255,255,255,0.14)"
        : "linear-gradient(135deg, #00ffbe, #52d6ff, #7c4dff)",
      color: disabled ? "rgba(234,255,245,0.80)" : "#042217",
      boxShadow: disabled ? "none" : "0 14px 26px rgba(0,255,190,0.18)",
      whiteSpace: "nowrap",
      WebkitTapHighlightColor: "transparent",
    }),

    stickyBtnSecondary: {
      flex: "0 0 auto",
      minHeight: 46,
      padding: "12px 14px",
      borderRadius: 16,
      border: "1px solid rgba(255,255,255,0.10)",
      fontWeight: 1000,
      fontSize: 13,
      cursor: "pointer",
      background: "rgba(255,255,255,0.06)",
      color: "#fff",
      boxShadow: "0 12px 22px rgba(0,0,0,0.14)",
      whiteSpace: "nowrap",
      WebkitTapHighlightColor: "transparent",
    },

    lightboxOverlay: {
      position: "fixed",
      inset: 0,
      zIndex: 9000,
      background: "rgba(0,0,0,0.92)",
      backdropFilter: "blur(10px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 18,
    },

    lightboxImg: {
      maxWidth: "100%",
      maxHeight: "100%",
      objectFit: "contain",
      borderRadius: 20,
      boxShadow: "0 30px 80px rgba(0,0,0,0.60)",
    },

    lightboxClose: {
      position: "absolute",
      top: 16,
      right: 16,
      height: 42,
      minWidth: 42,
      padding: "0 14px",
      borderRadius: 999,
      border: "1px solid rgba(255,255,255,0.16)",
      background: "rgba(255,255,255,0.08)",
      color: "#fff",
      fontWeight: 1000,
      cursor: "pointer",
    },

    skeletonLine: {
      height: 14,
      borderRadius: 999,
      background:
        "linear-gradient(90deg, rgba(255,255,255,0.04), rgba(255,255,255,0.08), rgba(255,255,255,0.04))",
    },
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.bgGlow1} />
        <div style={styles.bgGlow2} />
        <div style={styles.bgGlow3} />
        <div style={styles.bgGrid} />

        <div style={styles.container}>
          <div style={styles.topBar}>
            <button style={styles.backBtn} onClick={() => navigate(-1)}>
              ← Back
            </button>
            <div style={styles.crumb}>Loading…</div>
          </div>

          <div style={styles.hero}>
            <img src={defaultCover} alt="loading" style={styles.heroImg} />
            <div style={styles.heroOverlay} />
            <div style={styles.heroShine} />
          </div>

          <div
            style={{
              marginTop: 16,
              display: "grid",
              gap: 12,
              padding: isMobile ? "0 14px" : 10,
              
            }}
          >
            <div style={styles.card}>
              <div style={styles.sectionTitleRow}>
                <div style={styles.sectionTitle}>About this event</div>
                <div style={styles.sectionHint}>Loading details…</div>
              </div>

              <div style={{ ...styles.skeletonLine, width: "76%" }} />
              <div
                style={{
                  ...styles.skeletonLine,
                  marginTop: 10,
                  width: "92%",
                }}
              />
              <div
                style={{
                  ...styles.skeletonLine,
                  marginTop: 10,
                  width: "64%",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div style={styles.page}>
        <div style={styles.bgGlow1} />
        <div style={styles.bgGlow2} />
        <div style={styles.bgGlow3} />
        <div style={styles.bgGrid} />

        <div style={styles.container}>
          <div style={styles.topBar}>
            <button style={styles.backBtn} onClick={() => navigate(-1)}>
              ← Back
            </button>
            <div style={styles.crumb}>Event not found</div>
          </div>

          <div style={{ padding: isMobile ? "0 14px" : 0 }}>
            
            <div style={styles.card}>
              <div style={styles.sectionTitleRow}>
                <div style={styles.sectionTitle}>We couldn’t find this event</div>
                <div style={styles.sectionHint}>It may have been removed.</div>
              </div>
              <div style={styles.paragraph}>
                Try going back and exploring other events.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={styles.page}>
        <div style={styles.bgGlow1} />
        <div style={styles.bgGlow2} />
        <div style={styles.bgGlow3} />
        <div style={styles.bgGrid} />

        <div style={styles.container}>
          <div style={styles.topBar}>
            <button style={styles.backBtn} onClick={() => navigate(-1)}>
              ← Back to explore
            </button>
            <div style={styles.crumb}>
              {event.category ? `${event.category} · ` : ""}
              {event.country || "Outdoor"}
            </div>
          </div>

          <div style={styles.hero}>
            <img
              src={coverUrl}
              alt={event.title}
              style={styles.heroImg}
              onClick={() => setLightboxOpen(true)}
            />
            <div style={styles.heroOverlay} />
            <div style={styles.heroShine} />

            <div style={styles.heroTopFloating}>
              {isMobile ? (
                <button style={styles.glassMiniBtn} onClick={() => navigate(-1)}>
                  ← Back
                </button>
              ) : (
                <div />
              )}

              <div style={styles.heroTopActions}>
                <button
                  style={styles.glassMiniBtn}
                  onClick={() => setLightboxOpen(true)}
                >
                  ⤢ View
                </button>

                {isOwner && (
                  <button
                    style={styles.glassMiniBtn}
                    onClick={() => navigate(`/edit-event/${event.id}`)}
                  >
                    ✏️ Edit
                  </button>
                )}
              </div>
            </div>

            <div style={styles.heroContent}>
              <div style={styles.heroLeft}>
                <div style={styles.badgesRow}>
                  {event.category && <div style={styles.badge}>⛰ {event.category}</div>}
                  <div style={styles.badge}>🌿 Outdoor event</div>
                  <div style={styles.badge}>⚡ Live gathering</div>
                </div>

                <h1 style={styles.heroTitle}>{event.title}</h1>

                {event.subtitle && (
                  <div style={styles.heroSubtitle}>{event.subtitle}</div>
                )}

                <div style={styles.metaRow}>
                  <div style={styles.metaPill}>📅 {dateLine || "Date TBA"}</div>
                  <div style={styles.metaPill}>📍 {locationLine}</div>
                  <div style={styles.metaPill}>👥 {attendeesCount} going</div>
                  <div style={styles.metaPill}>🏷 {priceLine}</div>
                </div>

                <div style={styles.peoplePreviewRow}>
                  <div style={styles.peopleStack}>
                    {heroParticipants.length > 0 ? (
                      heroParticipants.map((row, idx) =>
                        row?.profiles?.avatar_url ? (
                          <img
                            key={row.id}
                            src={row.profiles.avatar_url}
                            alt=""
                            style={{
                              ...styles.peopleStackAvatar,
                              marginLeft: idx === 0 ? 0 : -10,
                              zIndex: 20 - idx,
                            }}
                          />
                        ) : (
                          <div
                            key={row.id}
                            style={{
                              ...styles.peopleStackAvatar,
                              marginLeft: idx === 0 ? 0 : -10,
                              zIndex: 20 - idx,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 1000,
                            }}
                          >
                            {initialsFromName(row?.profiles?.full_name)}
                          </div>
                        )
                      )
                    ) : (
                      <div style={styles.peoplePreviewText}>No attendees yet.</div>
                    )}
                  </div>

                  {heroParticipants.length > 0 && (
                    <div style={styles.peoplePreviewText}>
                      {attendeesCount === 1
                        ? "1 person already going"
                        : `${attendeesCount} people already going`}
                    </div>
                  )}
                </div>
              </div>

              <div style={styles.heroRight}>
                <div style={styles.actionCard}>
                  <div style={styles.actionTopRow}>
                    <div>
                      <div style={styles.actionTitle}>Reserve your spot</div>
                      <div style={styles.actionSub}>
                        Join the group, see who’s going and plan the route with
                        confidence.
                      </div>
                    </div>

                    <div style={styles.statusBubble}>
                      {hasJoined ? "Going" : "Open"}
                    </div>
                  </div>

                  <div style={styles.bigCount}>{attendeesCount}</div>
                  <div style={styles.countHint}>
                    {attendeesCount === 0
                      ? "Be the first one to join."
                      : attendeesCount === 1
                      ? "Person going so far."
                      : "People going so far."}
                  </div>

                  <div style={styles.miniStats}>
                    <div style={styles.miniStatCard}>
                      <div style={styles.miniStatValue}>
                        {event.is_free
                          ? "Free"
                          : event.price_from
                          ? `${event.price_from}€`
                          : "—"}
                      </div>
                      <div style={styles.miniStatLabel}>Price</div>
                    </div>
                    <div style={styles.miniStatCard}>
                      <div style={styles.miniStatValue}>{attendeesCount}</div>
                      <div style={styles.miniStatLabel}>Going</div>
                    </div>
                    <div style={styles.miniStatCard}>
                      <div style={styles.miniStatValue}>
                        {event.city || event.country || "—"}
                      </div>
                      <div style={styles.miniStatLabel}>Place</div>
                    </div>
                  </div>

                  {!isMobile && (
                    <>
                      {hasJoined ? (
                        <>
                          <button style={styles.primaryBtn(true)} disabled>
                            ✅ You’re going
                          </button>
                          <button
                            onClick={handleLeave}
                            disabled={leaving}
                            style={styles.secondaryBtn}
                          >
                            {leaving ? "Leaving…" : "Leave event"}
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={handleJoin}
                          disabled={joining}
                          style={styles.primaryBtn(joining)}
                        >
                          {joining ? "Joining…" : joinLabel} {!joining && <span>➜</span>}
                        </button>
                      )}

                      {!user && (
                        <div
                          style={{
                            marginTop: 10,
                            fontSize: 12,
                            fontWeight: 800,
                            color: "rgba(234,255,245,0.72)",
                          }}
                        >
                          Sign in to join this event.
                        </div>
                      )}

                      {isOwner && (
                        <div style={styles.ownerRow}>
                          <button
                            onClick={() => navigate(`/edit-event/${event.id}`)}
                            style={styles.ownerBtn(false)}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={handleDeleteEvent}
                            style={styles.ownerBtn(true)}
                          >
                            🗑 Delete
                          </button>
                        </div>
                      )}

                      {errorMsg && <div style={styles.errorBox}>{errorMsg}</div>}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div style={styles.grid}>
            <div style={styles.card}>
              <div style={styles.sectionTitleRow}>
                <div style={styles.sectionTitle}>About this event</div>
                <div style={styles.sectionHint}>
                  Details, vibe and what to expect.
                </div>
              </div>

              <div style={styles.paragraph}>
                {event.description ||
                  "The organizer hasn’t added a description yet."}
              </div>

              <div style={styles.infoGrid}>
                <div style={styles.infoBox}>
                  <div style={styles.infoLabel}>Location</div>
                  <div style={styles.infoValue}>{locationLine}</div>
                </div>

                <div style={styles.infoBox}>
                  <div style={styles.infoLabel}>Dates</div>
                  <div style={styles.infoValue}>{dateLine || "Date TBA"}</div>
                </div>

                <div style={styles.infoBox}>
                  <div style={styles.infoLabel}>Price</div>
                  <div style={styles.infoValue}>{priceLine}</div>
                </div>

                <div style={styles.infoBox}>
                  <div style={styles.infoLabel}>Organizer</div>

                  <div
                    onClick={() => {
                      if (event.creator_id) navigate(`/profile/${event.creator_id}`);
                    }}
                    style={{
                      ...styles.infoValue,
                      cursor: event.creator_id ? "pointer" : "default",
                      textDecoration: event.creator_id ? "underline" : "none",
                    }}
                  >
                    {event.organizer_name || "Host not specified"}
                  </div>

                  {event.website_url && (
                    <a
                      href={event.website_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "inline-block",
                        marginTop: 10,
                        fontSize: 12,
                        fontWeight: 1000,
                        color: "#7cefe0",
                        textDecoration: "underline",
                      }}
                    >
                      Visit event website
                    </a>
                  )}
                </div>
              </div>

              <div style={styles.attendeesWrap}>
                <div style={styles.attendeesHeader}>
                  <div style={styles.sectionTitle}>People going</div>
                  <div style={styles.attendeesCountChip}>
                    👥 {attendeesCount} {attendeesCount === 1 ? "person" : "people"}
                  </div>
                </div>

                {attendees.length === 0 ? (
                  <div
                    style={{
                      marginTop: 12,
                      fontSize: 12,
                      fontWeight: 800,
                      color: "rgba(234,255,245,0.72)",
                    }}
                  >
                    No one yet. Be the first to join.
                  </div>
                ) : (
                  <div style={styles.attendeeList}>
                    {attendees.map((row) => {
                      const p = row.profiles;
                      const fullName = p?.full_name || "Outdoor friend";
                      const isYou = user && row.user_id === user.id;

                      return (
                        <div
                          key={row.id}
                          style={{
                            ...styles.attendeeRow,
                            cursor: row.user_id ? "pointer" : "default",
                          }}
                          onClick={() => {
                            if (row.user_id) navigate(`/profile/${row.user_id}`);
                          }}
                          onMouseEnter={(e) => {
                            if (isMobile) return;
                            e.currentTarget.style.transform = "translateY(-2px)";
                            e.currentTarget.style.boxShadow =
                              "0 16px 28px rgba(0,0,0,0.18)";
                          }}
                          onMouseLeave={(e) => {
                            if (isMobile) return;
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow =
                              "0 10px 22px rgba(0,0,0,0.10)";
                          }}
                        >
                          {p?.avatar_url ? (
                            <img src={p.avatar_url} alt="" style={styles.avatar} />
                          ) : (
                            <div style={styles.avatarFallback}>
                              {initialsFromName(fullName)}
                            </div>
                          )}

                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 2,
                              minWidth: 0,
                              flex: 1,
                            }}
                          >
                            <div style={styles.attendeeName}>
                              <span
                                style={{
                                  minWidth: 0,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  maxWidth: "100%",
                                }}
                              >
                                {fullName}
                              </span>
                              {isYou && <span style={styles.youTag}>YOU</span>}
                            </div>
                            <div
                              style={{
                                fontSize: 12,
                                fontWeight: 750,
                                color: "rgba(234,255,245,0.62)",
                              }}
                            >
                              {isYou ? "That’s you" : "Joining the adventure"}
                            </div>
                          </div>

                          <div style={styles.attendeeArrow}>→</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.sectionTitleRow}>
                <div style={styles.sectionTitle}>Meeting point</div>
                <div style={styles.sectionHint}>Plan your route.</div>
              </div>

              <div style={styles.mapBox}>
                <MapContainer
                  center={[lat, lng]}
                  zoom={isMobile ? 6 : 7}
                  scrollWheelZoom={true}
                  style={styles.mapWrap}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[lat, lng]} />
                </MapContainer>
              </div>

              <div style={styles.mapTopMeta}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 1000,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "rgba(234,255,245,0.54)",
                  }}
                >
                  Coordinates
                </div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 1000,
                    color: "#ffffff",
                  }}
                >
                  {safeNum(event.latitude)?.toFixed(4) ?? "—"},{" "}
                  {safeNum(event.longitude)?.toFixed(4) ?? "—"}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "rgba(234,255,245,0.66)",
                    lineHeight: 1.55,
                  }}
                >
                  Open the map, zoom in and plan your arrival before the event
                  starts.
                </div>
              </div>

              {isOwner && (
                <div
                  style={{
                    marginTop: 14,
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    onClick={() => navigate(`/edit-event/${event.id}`)}
                    style={styles.ownerBtn(false)}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={handleDeleteEvent}
                    style={styles.ownerBtn(true)}
                  >
                    🗑 Delete
                  </button>
                </div>
              )}

              {isMobile && errorMsg && <div style={styles.errorBox}>{errorMsg}</div>}
            </div>
          </div>
        </div>

        {isMobile && (
          <div style={styles.stickyBar}>
            <div style={styles.stickyInner}>
              <div style={styles.stickyMeta}>
                <div style={styles.stickyTitle}>{event.title}</div>
                <div style={styles.stickySub}>
                  👥 {attendeesCount} going · {priceLine || "Price TBA"}
                </div>
              </div>

              {hasJoined ? (
                <>
                  <button style={styles.stickyBtnPrimary(true)} disabled>
                    ✅ Going
                  </button>
                  <button
                    onClick={handleLeave}
                    disabled={leaving}
                    style={styles.stickyBtnSecondary}
                  >
                    {leaving ? "Leaving…" : "Leave"}
                  </button>
                </>
              ) : (
                <button
                  onClick={handleJoin}
                  disabled={joining}
                  style={styles.stickyBtnPrimary(joining)}
                >
                  {joining ? "Joining…" : "Join"}
                </button>
              )}
            </div>

            {!user && (
              <div
                style={{
                  marginTop: 8,
                  fontSize: 12,
                  fontWeight: 800,
                  color: "rgba(234,255,245,0.68)",
                }}
              >
                Sign in to join this event.
              </div>
            )}
          </div>
        )}
      </div>

      {lightboxOpen && (
        <div style={styles.lightboxOverlay} onClick={() => setLightboxOpen(false)}>
          <button
            style={styles.lightboxClose}
            onClick={() => setLightboxOpen(false)}
          >
            ✕
          </button>
          <img
            src={coverUrl}
            alt={event.title}
            style={styles.lightboxImg}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}