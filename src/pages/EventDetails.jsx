
import React, { useEffect, useState } from "react";
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

  // ===== HELPERS =====
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

  // ===== LOAD ATTENDEES =====
  const loadAttendees = async (eventId, currentUser) => {
    const { data } = await supabase
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

    setAttendees(data || []);
    setAttendeesCount(data?.length || 0);

    if (currentUser) {
      setHasJoined((data || []).some((row) => row.user_id === currentUser.id));
    } else {
      setHasJoined(false);
    }
  };

  // ===== LOAD EVENT =====
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
        setLoading(false);
        return;
      }

      setEvent(ev);
      await loadAttendees(ev.id, user);
      setLoading(false);
    };

    load();
  }, [id]);

  // ===== JOIN =====
  const handleJoin = async () => {
    if (!event) return;

    if (!user) {
      setErrorMsg("Please sign in to join this event.");
      return;
    }

    if (joining || hasJoined) return;

    setJoining(true);
    setErrorMsg("");

    await supabase.from("event_attendees").upsert(
      [{ event_id: event.id, user_id: user.id }],
      { onConflict: "event_id,user_id" }
    );

    await loadAttendees(event.id, user);
    setJoining(false);
  };

  // ===== LEAVE =====
  const handleLeave = async () => {
    if (!event) return;

    if (!user) {
      setErrorMsg("Please sign in to leave this event.");
      return;
    }

    if (leaving) return;

    setLeaving(true);
    setErrorMsg("");

    await supabase
      .from("event_attendees")
      .delete()
      .eq("event_id", event.id)
      .eq("user_id", user.id);

    await loadAttendees(event.id, user);
    setLeaving(false);
  };

  // ===== DELETE EVENT =====
  const handleDeleteEvent = async () => {
    if (!event) return;

    const ok = window.confirm("Delete this event permanently?");
    if (!ok) return;

    const { error } = await supabase.from("events").delete().eq("id", event.id);

    if (!error) {
      navigate("/events");
    }
  };

  const isOwner = user && event && user.id === event.creator_id;

  // ===== STYLES (Outdoor Luxury / Patagonia vibe) =====
  const styles = {
    page: {
      minHeight: "100vh",
      background:
        "radial-gradient(circle at top, rgba(245,242,235,1) 0%, rgba(241,236,227,1) 30%, rgba(236,231,221,1) 100%)",
      color: "#1a1d17",
      padding: "22px 16px 40px",
      fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
      display: "flex",
      justifyContent: "center",
    },
    container: {
      width: "100%",
      maxWidth: 1180,
    },

    topBar: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
      flexWrap: "wrap",
      marginBottom: 14,
    },
    backBtn: {
      display: "inline-flex",
      alignItems: "center",
      gap: 10,
      padding: "10px 14px",
      borderRadius: 999,
      border: "1px solid rgba(58, 72, 46, 0.18)",
      background: "rgba(255,255,255,0.7)",
      backdropFilter: "blur(8px)",
      cursor: "pointer",
      fontWeight: 700,
      fontSize: 13,
      color: "#1f2a1d",
      boxShadow: "0 10px 22px rgba(0,0,0,0.06)",
    },
    crumb: {
      fontSize: 12,
      color: "rgba(40,52,34,0.72)",
      fontWeight: 600,
    },

    hero: {
      position: "relative",
      borderRadius: 26,
      overflow: "hidden",
      border: "1px solid rgba(55, 72, 44, 0.18)",
      boxShadow: "0 30px 90px rgba(16, 20, 14, 0.18)",
      background: "rgba(255,255,255,0.55)",
    },
    heroImg: {
      width: "100%",
      height: 320,
      objectFit: "cover",
      transform: "scale(1.02)",
      filter: "saturate(1.05) contrast(1.02)",
    },
    heroOverlay: {
      position: "absolute",
      inset: 0,
      background:
        "linear-gradient(to top, rgba(236,231,221,0.96) 0%, rgba(236,231,221,0.25) 55%, rgba(236,231,221,0.0) 100%)",
    },
    heroContent: {
      position: "absolute",
      inset: 18,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-end",
      gap: 16,
      flexWrap: "wrap",
    },
    heroLeft: {
      minWidth: 280,
      maxWidth: 720,
    },
    badgesRow: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      flexWrap: "wrap",
      marginBottom: 10,
    },
    badge: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "7px 12px",
      borderRadius: 999,
      border: "1px solid rgba(58, 72, 46, 0.18)",
      background: "rgba(255,255,255,0.72)",
      backdropFilter: "blur(8px)",
      fontSize: 12,
      fontWeight: 800,
      color: "#263321",
      letterSpacing: "0.06em",
      textTransform: "uppercase",
    },
    heroTitle: {
      fontSize: 36,
      fontWeight: 900,
      lineHeight: 1.05,
      margin: 0,
      color: "#162014",
      textShadow: "0 10px 18px rgba(0,0,0,0.10)",
    },
    heroSubtitle: {
      marginTop: 8,
      fontSize: 14,
      fontWeight: 600,
      color: "rgba(28, 34, 22, 0.78)",
      maxWidth: 620,
    },
    metaRow: {
      marginTop: 12,
      display: "flex",
      gap: 10,
      flexWrap: "wrap",
    },
    metaPill: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "10px 12px",
      borderRadius: 14,
      border: "1px solid rgba(58, 72, 46, 0.16)",
      background: "rgba(255,255,255,0.78)",
      backdropFilter: "blur(10px)",
      fontSize: 12,
      fontWeight: 700,
      color: "rgba(26, 32, 20, 0.9)",
      boxShadow: "0 10px 24px rgba(0,0,0,0.06)",
    },

    heroRight: {
      minWidth: 280,
      maxWidth: 360,
      alignSelf: "flex-end",
    },
    actionCard: {
      borderRadius: 20,
      padding: 14,
      border: "1px solid rgba(58, 72, 46, 0.18)",
      background: "rgba(255,255,255,0.82)",
      backdropFilter: "blur(10px)",
      boxShadow: "0 18px 40px rgba(0,0,0,0.10)",
    },
    actionTitle: {
      fontSize: 13,
      fontWeight: 900,
      letterSpacing: "0.02em",
      marginBottom: 6,
      color: "#1b2617",
    },
    actionSub: {
      fontSize: 12,
      fontWeight: 700,
      color: "rgba(35, 45, 30, 0.76)",
      marginBottom: 12,
    },
    bigCount: {
      fontSize: 28,
      fontWeight: 900,
      color: "#1b2617",
      lineHeight: 1,
    },
    countHint: {
      marginTop: 4,
      fontSize: 12,
      fontWeight: 700,
      color: "rgba(35,45,30,0.7)",
    },
    primaryBtn: (disabled) => ({
      marginTop: 12,
      width: "100%",
      padding: "12px 14px",
      borderRadius: 999,
      border: "none",
      cursor: disabled ? "default" : "pointer",
      fontWeight: 900,
      fontSize: 13,
      background: disabled
        ? "rgba(38, 60, 32, 0.25)"
        : "linear-gradient(135deg, #28402a, #1f3423)",
      color: "#f3f1ea",
      boxShadow: disabled ? "none" : "0 14px 32px rgba(33, 52, 31, 0.25)",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
    }),
    secondaryBtn: {
      marginTop: 10,
      width: "100%",
      padding: "11px 14px",
      borderRadius: 999,
      border: "1px solid rgba(96, 52, 37, 0.25)",
      cursor: "pointer",
      fontWeight: 900,
      fontSize: 13,
      background: "rgba(255,255,255,0.85)",
      color: "#5a2d22",
      boxShadow: "0 12px 26px rgba(0,0,0,0.06)",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
    },
    ownerRow: {
      marginTop: 10,
      display: "flex",
      gap: 10,
    },
    ownerBtn: (danger) => ({
      flex: 1,
      padding: "11px 12px",
      borderRadius: 999,
      border: danger
        ? "1px solid rgba(140, 60, 40, 0.28)"
        : "1px solid rgba(58, 72, 46, 0.18)",
      cursor: "pointer",
      fontWeight: 900,
      fontSize: 12,
      background: danger ? "rgba(255, 240, 235, 0.9)" : "rgba(255,255,255,0.9)",
      color: danger ? "#7a2a1a" : "#1f2a1d",
      boxShadow: "0 12px 26px rgba(0,0,0,0.06)",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    }),
    errorBox: {
      marginTop: 10,
      borderRadius: 14,
      padding: "10px 12px",
      border: "1px solid rgba(140,60,40,0.22)",
      background: "rgba(255, 238, 234, 0.9)",
      color: "#7a2a1a",
      fontWeight: 800,
      fontSize: 12,
    },

    grid: {
      display: "grid",
      gridTemplateColumns: "minmax(0, 3fr) minmax(0, 2fr)",
      gap: 16,
      marginTop: 16,
      alignItems: "start",
    },
    card: {
      borderRadius: 22,
      padding: 16,
      border: "1px solid rgba(58, 72, 46, 0.18)",
      background: "rgba(255,255,255,0.82)",
      backdropFilter: "blur(10px)",
      boxShadow: "0 20px 55px rgba(0,0,0,0.10)",
    },
    sectionTitleRow: {
      display: "flex",
      alignItems: "baseline",
      justifyContent: "space-between",
      gap: 10,
      marginBottom: 10,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: 1000,
      color: "#1b2617",
      letterSpacing: "0.02em",
    },
    sectionHint: {
      fontSize: 12,
      fontWeight: 700,
      color: "rgba(35,45,30,0.72)",
    },
    paragraph: {
      marginTop: 6,
      fontSize: 13,
      lineHeight: 1.65,
      fontWeight: 650,
      color: "rgba(26, 32, 20, 0.86)",
      whiteSpace: "pre-wrap",
    },
    infoGrid: {
      marginTop: 12,
      display: "grid",
      gridTemplateColumns: "repeat(2, minmax(0,1fr))",
      gap: 10,
    },
    infoBox: {
      borderRadius: 16,
      padding: 12,
      border: "1px solid rgba(58, 72, 46, 0.14)",
      background: "rgba(245,242,235,0.65)",
    },
    infoLabel: {
      fontSize: 11,
      textTransform: "uppercase",
      letterSpacing: "0.12em",
      fontWeight: 900,
      color: "rgba(35,45,30,0.65)",
      marginBottom: 6,
    },
    infoValue: {
      fontSize: 13,
      fontWeight: 900,
      color: "#1b2617",
    },

    mapBox: {
      borderRadius: 18,
      overflow: "hidden",
      border: "1px solid rgba(58, 72, 46, 0.18)",
      boxShadow: "0 14px 38px rgba(0,0,0,0.08)",
    },
    mapWrap: {
      height: 260,
      width: "100%",
    },

    attendeesWrap: {
      marginTop: 16,
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
      border: "1px solid rgba(58, 72, 46, 0.16)",
      background: "rgba(245,242,235,0.75)",
      fontWeight: 900,
      fontSize: 12,
      color: "#1f2a1d",
    },
    attendeeList: {
      marginTop: 12,
      maxHeight: 320,
      overflowY: "auto",
      paddingRight: 4,
    },
    attendeeRow: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "10px 10px",
      borderRadius: 16,
      border: "1px solid rgba(58, 72, 46, 0.14)",
      background: "rgba(255,255,255,0.88)",
      boxShadow: "0 10px 22px rgba(0,0,0,0.06)",
      marginBottom: 10,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: "50%",
      objectFit: "cover",
      border: "1px solid rgba(58, 72, 46, 0.18)",
      background: "rgba(245,242,235,0.9)",
    },
    avatarFallback: {
      width: 40,
      height: 40,
      borderRadius: "50%",
      border: "1px solid rgba(58, 72, 46, 0.18)",
      background:
        "linear-gradient(135deg, rgba(40,64,42,0.18), rgba(160,140,95,0.18))",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: 1000,
      color: "#1f2a1d",
    },
    attendeeName: {
      fontSize: 13,
      fontWeight: 1000,
      color: "#1b2617",
      display: "flex",
      alignItems: "center",
      gap: 8,
    },
    youTag: {
      display: "inline-flex",
      padding: "3px 8px",
      borderRadius: 999,
      border: "1px solid rgba(40,64,42,0.24)",
      background: "rgba(245,242,235,0.9)",
      fontSize: 10,
      fontWeight: 1000,
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      color: "#1f2a1d",
    },
  };

  // ===== RENDER =====
  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.topBar}>
            <div style={styles.backBtn} onClick={() => navigate(-1)}>
              ← Back
            </div>
            <div style={styles.crumb}>Loading event…</div>
          </div>

          <div style={styles.hero}>
            <img src={defaultCover} alt="loading" style={styles.heroImg} />
            <div style={styles.heroOverlay} />
          </div>

          <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
            <div style={styles.card}>
              <div style={styles.sectionTitleRow}>
                <div style={styles.sectionTitle}>About this event</div>
                <div style={styles.sectionHint}>Loading details…</div>
              </div>
              <div style={{ height: 14, borderRadius: 10, background: "rgba(0,0,0,0.06)" }} />
              <div style={{ height: 14, marginTop: 10, borderRadius: 10, background: "rgba(0,0,0,0.06)" }} />
              <div style={{ height: 14, marginTop: 10, borderRadius: 10, background: "rgba(0,0,0,0.06)" }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.topBar}>
            <div style={styles.backBtn} onClick={() => navigate(-1)}>
              ← Back
            </div>
            <div style={styles.crumb}>Event not found</div>
          </div>

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
    );
  }

  const joinLabel = hasJoined ? "You’re going" : "Join event";

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* TOP BAR */}
        <div style={styles.topBar}>
          <div style={styles.backBtn} onClick={() => navigate(-1)}>
            ← Back to explore
          </div>
          <div style={styles.crumb}>
            {event.category ? `${event.category} · ` : ""}
            {event.country || "Outdoor"}
          </div>
        </div>

        {/* HERO */}
        <div style={styles.hero}>
          <img src={coverUrl} alt={event.title} style={styles.heroImg} />
          <div style={styles.heroOverlay} />

          <div style={styles.heroContent}>
            <div style={styles.heroLeft}>
              <div style={styles.badgesRow}>
                {event.category && (
                  <div style={styles.badge}>⛰ {event.category}</div>
                )}
                <div style={styles.badge}>🌿 Outdoor event</div>
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
            </div>

            <div style={styles.heroRight}>
              <div style={styles.actionCard}>
                <div style={styles.actionTitle}>Reserve your spot</div>
                <div style={styles.actionSub}>
                  Join the group and see who’s going.
                </div>

                <div style={styles.bigCount}>{attendeesCount}</div>
                <div style={styles.countHint}>
                  {attendeesCount === 0
                    ? "Be the first one to join."
                    : attendeesCount === 1
                    ? "Person going so far."
                    : "People going so far."}
                </div>

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
                  <div style={{ marginTop: 10, fontSize: 12, fontWeight: 750, color: "rgba(35,45,30,0.72)" }}>
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
              </div>
            </div>
          </div>
        </div>

        {/* MAIN GRID */}
        <div style={styles.grid}>
          {/* LEFT - ABOUT + INFO */}
          <div style={styles.card}>
            <div style={styles.sectionTitleRow}>
              <div style={styles.sectionTitle}>About this event</div>
              <div style={styles.sectionHint}>
                Details, vibe and what to expect.
              </div>
            </div>

            <div style={styles.paragraph}>
              {event.description || "The organizer hasn’t added a description yet."}
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
                <div style={styles.infoValue}>
                  {event.organizer_name || "Host not specified"}
                </div>
                {event.website_url && (
                  <a
                    href={event.website_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "inline-block",
                      marginTop: 8,
                      fontSize: 12,
                      fontWeight: 900,
                      color: "#1f3423",
                      textDecoration: "underline",
                    }}
                  >
                    Visit event website
                  </a>
                )}
              </div>
            </div>

            {/* ATTENDEES */}
            <div style={styles.attendeesWrap}>
              <div style={styles.attendeesHeader}>
                <div style={styles.sectionTitle}>People going</div>
                <div style={styles.attendeesCountChip}>
                  👥 {attendeesCount} {attendeesCount === 1 ? "person" : "people"}
                </div>
              </div>

              {attendees.length === 0 ? (
                <div style={{ marginTop: 10, fontSize: 12, fontWeight: 800, color: "rgba(35,45,30,0.72)" }}>
                  No one yet. Be the first to join.
                </div>
              ) : (
                <div style={styles.attendeeList}>
                  {attendees.map((row) => {
                    const p = row.profiles;
                    const fullName = p?.full_name || "Outdoor friend";
                    const isYou = user && row.user_id === user.id;

                    return (
                      <div key={row.id} style={styles.attendeeRow}>
                        {p?.avatar_url ? (
                          <img src={p.avatar_url} alt="" style={styles.avatar} />
                        ) : (
                          <div style={styles.avatarFallback}>
                            {initialsFromName(fullName)}
                          </div>
                        )}

                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          <div style={styles.attendeeName}>
                            {fullName}
                            {isYou && <span style={styles.youTag}>YOU</span>}
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 750, color: "rgba(35,45,30,0.68)" }}>
                            {isYou ? "That’s you" : "Joining the adventure"}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT - MAP */}
          <div style={styles.card}>
            <div style={styles.sectionTitleRow}>
              <div style={styles.sectionTitle}>Meeting point</div>
              <div style={styles.sectionHint}>Plan your route.</div>
            </div>

            <div style={styles.mapBox}>
              <MapContainer
                center={[event.latitude || 43.9, event.longitude || 21]}
                zoom={7}
                scrollWheelZoom={true}
                style={styles.mapWrap}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[event.latitude || 43.9, event.longitude || 21]} />
              </MapContainer>
            </div>

            <div style={{ marginTop: 10, fontSize: 12, fontWeight: 800, color: "rgba(35,45,30,0.72)" }}>
              Coordinates:
              <div style={{ marginTop: 6, fontSize: 13, fontWeight: 1000, color: "#1b2617" }}>
                {event.latitude?.toFixed(4) ?? "—"}, {event.longitude?.toFixed(4) ?? "—"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}