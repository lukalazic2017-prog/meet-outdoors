// src/pages/EventDetails.jsx
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
  const [attendeesLoading, setAttendeesLoading] = useState(true);
  const [attendeesCount, setAttendeesCount] = useState(0);
  const [hasJoined, setHasJoined] = useState(false);

  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const [errorMsg, setErrorMsg] = useState("");

  // ===== HELPERS =====
  const formatDateTime = (isoString) => {
    if (!isoString) return null;
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return null;

    const date = d.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const time = d.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
    return  `${date} · ${time};`
  };

  const buildDateLine = (ev) => {
    if (!ev) return "";
    const start = formatDateTime(ev.start_time);
    const end = formatDateTime(ev.end_time);

    if (start && end) {
      return `${start}  —  ${end};`
    }
    return start || end || "Date will be announced";
  };

  const coverUrl = event?.cover_url || defaultCover;
  const dateLine = buildDateLine(event);
  const locationLine = event
    ? event.location_name || event.city || event.country || "Location TBA"
    : "";

  // ===== LOAD ATTENDEES (LIST + HAS JOINED) =====
  async function loadAttendees(eventId, currentUser) {
    setAttendeesLoading(true);
    try {
      const { data, error } = await supabase
        .from("event_attendees")
        .select(
          `
          id,
          user_id,
          created_at,
          profiles (
            id,
            full_name,
            avatar_url,
            display_name
          )
        `
        )
        .eq("event_id", eventId)
        .order("created_at", { ascending: true });

      if (error) {
        console.log("Load attendees error:", error);
        return;
      }

      setAttendees(data || []);
      setAttendeesCount(data ? data.length : 0);

      if (currentUser) {
        const joined = (data || []).some(
          (row) => row.user_id === currentUser.id
        );
        setHasJoined(joined);
      } else {
        setHasJoined(false);
      }
    } catch (err) {
      console.log("Load attendees exception:", err);
    } finally {
      setAttendeesLoading(false);
    }
  }

  // ===== LOAD EVENT + USER =====
  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      setErrorMsg("");

      try {
        // 1) user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.log("getUser error:", userError);
        }
        setUser(user ?? null);

        // 2) event
        const { data: eventData, error: eventError } = await supabase
          .from("events")
          .select("*")
          .eq("id", id)
          .single();

        if (eventError) {
          console.log("Event load error:", eventError);
          setEvent(null);
          setErrorMsg("Event not found.");
          setLoading(false);
          return;
        }

        setEvent(eventData);

        // 3) attendees
        await loadAttendees(eventData.id, user ?? null);
      } catch (err) {
        console.log("EventDetails load exception:", err);
        setErrorMsg("Something went wrong while loading this event.");
      } finally {
        setLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ===== JOIN EVENT =====
  const handleJoinEvent = async () => {
    if (!event) return;

    if (!user) {
      setErrorMsg("Please sign in to join this event.");
      return;
    }

    if (hasJoined || joining) {
      return;
    }

    setJoining(true);
    setErrorMsg("");

    try {
      const { error } = await supabase
        .from("event_attendees")
        .upsert(
          [
            {
              event_id: event.id,
              user_id: user.id,
            },
          ],
          {
            onConflict: "event_id,user_id",
            ignoreDuplicates: true,
          }
        );

      if (error) {
        console.log("Join event error:", error);
        setErrorMsg("Could not join this event. Please try again.");
      } else {
        await loadAttendees(event.id, user);
      }
    } catch (err) {
      console.log("Join event exception:", err);
      setErrorMsg("Unexpected error while joining. Please try again.");
    } finally {
      setJoining(false);
    }
  };

  // ===== LEAVE EVENT =====
  const handleLeaveEvent = async () => {
    if (!event || !user || leaving) return;

    setLeaving(true);
    setErrorMsg("");

    try {
      const { error } = await supabase
        .from("event_attendees")
        .delete()
        .eq("event_id", event.id)
        .eq("user_id", user.id);

      if (error) {
        console.log("Leave event error:", error);
        setErrorMsg("Could not leave this event. Please try again.");
      } else {
        await loadAttendees(event.id, user);
      }
    } catch (err) {
      console.log("Leave event exception:", err);
      setErrorMsg("Unexpected error while leaving. Please try again.");
    } finally {
      setLeaving(false);
    }
  };

  // ===== STYLES =====
  const styles = {
    page: {
      minHeight: "100vh",
      padding: "26px 16px 40px",
      background:
        "radial-gradient(circle at top, #010d0e 0%, #020308 45%, #000000 100%)",
      display: "flex",
      justifyContent: "center",
      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      color: "#f6fbf8",
    },
    container: {
      width: "100%",
      maxWidth: 1180,
    },
    backRow: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 10,
      fontSize: 12,
      color: "rgba(210,235,225,0.85)",
      cursor: "pointer",
    },
    hero: {
      position: "relative",
      borderRadius: 24,
      overflow: "hidden",
      border: "1px solid rgba(0,255,184,0.35)",
      boxShadow: "0 28px 80px rgba(0,0,0,0.9)",
      marginBottom: 20,
    },
    heroImg: {
      width: "100%",
      height: 280,
      objectFit: "cover",
      transform: "scale(1.02)",
    },
    heroOverlay: {
      position: "absolute",
      inset: 0,
      background:
        "linear-gradient(to top right, rgba(0,0,0,0.82), rgba(0,0,0,0.20))",
    },
    heroContent: {
      position: "absolute",
      inset: 18,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-end",
      gap: 18,
      flexWrap: "wrap",
    },
    heroLeft: {
      maxWidth: "70%",
      minWidth: 260,
    },
    categoryBadge: {
      display: "inline-flex",
      padding: "4px 10px",
      borderRadius: 999,
      border: "1px solid rgba(0,255,184,0.9)",
      background: "rgba(0,30,22,0.95)",
      fontSize: 11,
      letterSpacing: "0.16em",
      textTransform: "uppercase",
      marginBottom: 10,
      color: "#e2fff7",
    },
    heroTitle: {
      fontSize: 30,
      fontWeight: 800,
      marginBottom: 4,
    },
    heroSubtitle: {
      fontSize: 13,
      color: "rgba(225,245,235,0.9)",
    },
    heroMetaRow: {
      display: "flex",
      flexWrap: "wrap",
      gap: 10,
      marginTop: 10,
      fontSize: 12,
      color: "rgba(215,235,225,0.9)",
    },
    pill: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "4px 10px",
      borderRadius: 999,
      background: "rgba(5,35,25,0.92)",
      border: "1px solid rgba(120,200,165,0.8)",
      fontSize: 11,
    },
    heroRight: {
      minWidth: 220,
      maxWidth: 280,
      alignSelf: "flex-end",
    },
    joinCard: {
      borderRadius: 18,
      padding: 14,
      background:
        "radial-gradient(circle at top left, rgba(2,40,28,0.98), rgba(3,18,14,0.98))",
      border: "1px solid rgba(0,255,184,0.6)",
      boxShadow: "0 18px 55px rgba(0,0,0,0.88)",
      fontSize: 12,
    },
    joinHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      marginBottom: 8,
    },
    joinTitle: {
      fontSize: 13,
      fontWeight: 700,
    },
    joinBadge: {
      fontSize: 11,
      textTransform: "uppercase",
      letterSpacing: "0.12em",
      color: "rgba(180,255,220,0.9)",
    },
    joinCount: {
      fontSize: 12,
      color: "rgba(220,245,235,0.9)",
      marginBottom: 12,
    },
    joinButton: (secondary) => ({
      width: "100%",
      padding: "9px 16px",
      borderRadius: 999,
      border: secondary
        ? "1px solid rgba(140,200,170,0.8)"
        : "none",
      cursor: secondary ? "default" : "pointer",
      fontWeight: 700,
      fontSize: 13,
      background: secondary
        ? "rgba(4,22,18,0.95)"
        : "linear-gradient(125deg, #00ffb8, #00c287, #00905c)",
      color: secondary ? "rgba(220,245,235,0.9)" : "#022015",
      boxShadow: secondary
        ? "none"
        : "0 0 20px rgba(0,255,184,0.45)",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    }),
    leaveButton: {
      width: "100%",
      marginTop: 8,
      padding: "8px 16px",
      borderRadius: 999,
      border: "1px solid rgba(255,120,120,0.9)",
      cursor: "pointer",
      fontWeight: 600,
      fontSize: 12,
      background: "rgba(40,8,8,0.95)",
      color: "#ffb3b3",
      boxShadow: "0 0 12px rgba(255,80,80,0.5)",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },
    errorInline: {
      marginTop: 8,
      borderRadius: 8,
      padding: "6px 8px",
      background: "rgba(255,60,60,0.08)",
      border: "1px solid rgba(255,100,100,0.8)",
      color: "#ff9a9a",
      fontSize: 11,
    },
    mainGrid: {
      display: "grid",
      gridTemplateColumns: "minmax(0, 3fr) minmax(0, 2.2fr)",
      gap: 18,
      alignItems: "flex-start",
    },
    card: {
      borderRadius: 18,
      padding: 18,
      background:
        "radial-gradient(circle at top left, rgba(10,32,26,0.97), rgba(5,16,13,0.97))",
      border: "1px solid rgba(80,145,115,0.9)",
      boxShadow: "0 20px 60px rgba(0,0,0,0.85)",
      fontSize: 13,
    },
    sectionTitleRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      gap: 8,
      marginBottom: 10,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: 700,
    },
    sectionHint: {
      fontSize: 11,
      color: "rgba(210,235,225,0.8)",
    },
    paragraph: {
      fontSize: 13,
      color: "rgba(230,245,237,0.9)",
      lineHeight: 1.55,
      whiteSpace: "pre-wrap",
    },
    infoList: {
      marginTop: 6,
      display: "grid",
      gridTemplateColumns: "minmax(0,1.1fr) minmax(0,1fr)",
      gap: 10,
      fontSize: 12,
    },
    infoItem: {
      padding: 10,
      borderRadius: 12,
      background: "rgba(4,22,18,0.95)",
      border: "1px solid rgba(120,190,155,0.8)",
    },
    infoLabel: {
      fontSize: 11,
      textTransform: "uppercase",
      letterSpacing: "0.12em",
      color: "rgba(190,220,210,0.9)",
      marginBottom: 4,
    },
    infoValue: {
      fontSize: 13,
      color: "rgba(235,250,242,0.96)",
    },
    mapBox: {
      borderRadius: 16,
      overflow: "hidden",
      border: "1px solid rgba(85,145,120,0.9)",
      marginTop: 10,
    },
    mapContainer: {
      height: 220,
      width: "100%",
    },
    skeleton: {
      opacity: 0.6,
    },
    attendeesCardWrapper: {
      marginTop: 20,
    },
    attendeesList: {
      marginTop: 10,
      maxHeight: 260,
      overflowY: "auto",
      paddingRight: 4,
    },
    attendeeRow: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "7px 8px",
      borderRadius: 10,
      background: "rgba(3,18,14,0.96)",
      border: "1px solid rgba(80,140,115,0.88)",
      marginBottom: 6,
    },
    attendeeAvatar: {
      width: 34,
      height: 34,
      borderRadius: "50%",
      objectFit: "cover",
      border: "1px solid rgba(0,255,184,0.9)",
      background:
        "linear-gradient(135deg, rgba(0,255,184,0.2), rgba(0,140,90,0.4))",
    },
    attendeeFallbackAvatar: {
      width: 34,
      height: 34,
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background:
        "radial-gradient(circle at top, rgba(0,255,184,0.25), rgba(0,120,80,0.6))",
      color: "#022015",
      fontSize: 14,
      fontWeight: 700,
      border: "1px solid rgba(0,255,184,0.9)",
    },
    attendeeText: {
      display: "flex",
      flexDirection: "column",
      fontSize: 12,
    },
    attendeeName: {
      fontWeight: 600,
      color: "rgba(235,250,242,0.96)",
    },
    attendeeSub: {
      fontSize: 11,
      color: "rgba(200,225,215,0.9)",
    },
    attendeeYouTag: {
      marginLeft: 6,
      padding: "2px 6px",
      borderRadius: 999,
      border: "1px solid rgba(0,255,184,0.9)",
      fontSize: 9,
      textTransform: "uppercase",
      letterSpacing: "0.12em",
      color: "rgba(190,255,230,0.98)",
    },
  };

  // ===== RENDERING =====
  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.backRow}>Loading event…</div>
          <div style={{ ...styles.hero, ...styles.skeleton }}>
            <img src={defaultCover} alt="loading" style={styles.heroImg} />
            <div style={styles.heroOverlay} />
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.backRow} onClick={() => navigate(-1)}>
            ← Back
          </div>
          <div style={styles.joinCard}>
            We couldn't find this event. It may have been removed.
          </div>
        </div>
      </div>
    );
  }

  const now = new Date();

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* BACK */}
        <div style={styles.backRow} onClick={() => navigate(-1)}>
          <span>← Back to explore</span>
          <span style={{ opacity: 0.6 }}>
            · Today {now.toLocaleDateString()}
          </span>
        </div>

        {/* HERO */}
        <div style={styles.hero}>
          <img src={coverUrl} alt={event.title} style={styles.heroImg} />
          <div style={styles.heroOverlay} />

          <div style={styles.heroContent}>
            <div style={styles.heroLeft}>
              {event.category && (
                <div style={styles.categoryBadge}>{event.category}</div>
              )}
              <h1 style={styles.heroTitle}>{event.title}</h1>
              {event.subtitle && (
                <div style={styles.heroSubtitle}>{event.subtitle}</div>
              )}

              <div style={styles.heroMetaRow}>
                <span style={styles.pill}>
                  <span>📅</span>
                  <span>{dateLine}</span>
                </span>
                <span style={styles.pill}>
                  <span>📍</span>
                  <span>{locationLine}</span>
                </span>
                <span style={styles.pill}>
                  <span>👥</span>
                  <span>
                    {attendeesCount === 0
                      ? "Be the first to join"
                      : `${attendeesCount} going`}
                  </span>
                </span>
              </div>
            </div>

            <div style={styles.heroRight}>
              <div style={styles.joinCard}>
                <div style={styles.joinHeader}>
                  <div style={styles.joinTitle}>
                    Join this outdoor experience
                  </div>
                  <div style={styles.joinBadge}>
                    {hasJoined ? "You're in" : "Limited spots"}
                  </div>
                </div>

                <div style={styles.joinCount}>
                  {attendeesCount === 0 &&
                    "No one has joined yet – start the group!"}
                  {attendeesCount === 1 &&
                    "1 person is going so far."}
                  {attendeesCount > 1 &&
                    `${attendeesCount} people are going so far.`}
                </div>

                {hasJoined ? (
                  <>
                    <button style={styles.joinButton(true)} disabled>
                      ✅ You’re going
                    </button>
                    <button
                      style={styles.leaveButton}
                      onClick={handleLeaveEvent}
                      disabled={leaving}
                    >
                      {leaving ? "Leaving…" : "Leave event"}
                    </button>
                  </>
                ) : (
                  <button
                    style={styles.joinButton(false)}
                    onClick={handleJoinEvent}
                    disabled={joining}
                  >
                    {joining ? "Joining…" : "Join event"}
                    {!joining && <span>➜</span>}
                  </button>
                )}

                {!user && (
                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 11,
                      color: "rgba(200,225,215,0.95)",
                    }}
                  >
                    Sign in to confirm your spot and see who else is going.
                  </div>
                )}

                {errorMsg && (
                  <div style={styles.errorInline}>{errorMsg}</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* MAIN GRID */}
        <div style={styles.mainGrid}>
          {/* LEFT – ABOUT */}
          <div style={styles.card}>
            <div style={styles.sectionTitleRow}>
              <div style={styles.sectionTitle}>About this event</div>
              <div style={styles.sectionHint}>
                Get a feel for the vibe, pace and people.
              </div>
            </div>

            <div style={styles.paragraph}>
              {event.description
                ? event.description
                : "The organizer hasn’t added a detailed description yet. Expect an outdoor gathering built around fresh air, good company and shared adventure."}
            </div>

            <div style={styles.infoList}>
              <div style={styles.infoItem}>
                <div style={styles.infoLabel}>Location</div>
                <div style={styles.infoValue}>{locationLine}</div>
              </div>

              <div style={styles.infoItem}>
                <div style={styles.infoLabel}>Dates & timing</div>
                <div style={styles.infoValue}>{dateLine}</div>
              </div>

              <div style={styles.infoItem}>
                <div style={styles.infoLabel}>Price</div>
                <div style={styles.infoValue}>
                  {event.is_free
                    ? "Free to join"
                    : event.price_from
                    ? `From ${event.price_from} €`
                    : "Price on request"}
                </div>
              </div>

              <div style={styles.infoItem}>
                <div style={styles.infoLabel}>Organizer</div>
                <div style={styles.infoValue}>
                  {event.organizer_name || "Host not specified yet"}
                  {event.website_url && (
                    <>
                      <br />
                      <a
                        href={event.website_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          fontSize: 11,
                          color: "rgba(150,230,200,0.95)",
                          textDecoration: "underline",
                        }}
                      >
                        Visit event website
                      </a>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT – MAP & COORDINATES */}
          <div style={styles.card}>
            <div style={styles.sectionTitleRow}>
              <div style={styles.sectionTitle}>Where you’ll meet</div>
              <div style={styles.sectionHint}>
                Exact spot so you can plan your trip.
              </div>
            </div>

            <div style={styles.mapBox}>
              <MapContainer
                center={[
                  event.latitude || 43.9,
                  event.longitude || 21.0,
                ]}
                zoom={7}
                scrollWheelZoom={true}
                style={styles.mapContainer}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker
                  position={[
                    event.latitude || 43.9,
                    event.longitude || 21.0,
                  ]}
                />
              </MapContainer>
            </div>

            <div style={{ marginTop: 10, fontSize: 12 }}>
              <div style={styles.sectionHint}>
                Coordinates for this event:
              </div>
              <div
                style={{
                  marginTop: 4,
                  color: "rgba(220,245,235,0.95)",
                }}
              >
                {event.latitude?.toFixed(4) ?? "—"},{" "}
                {event.longitude?.toFixed(4) ?? "—"}
              </div>
            </div>
          </div>
        </div>

        {/* ATTENDEES SECTION – SCROLL LIST */}
        <div style={styles.attendeesCardWrapper}>
          <div style={styles.card}>
            <div style={styles.sectionTitleRow}>
              <div style={styles.sectionTitle}>
                People going to this event
              </div>
              <div style={styles.sectionHint}>
                See who you’ll be sharing the trail with.
              </div>
            </div>

            {attendeesLoading ? (
              <div style={styles.sectionHint}>
                Loading attendees…
              </div>
            ) : attendees.length === 0 ? (
              <div style={styles.sectionHint}>
                No one has joined yet. Be the first one to click “Join
                event” and start the group.
              </div>
            ) : (
              <div style={styles.attendeesList}>
                {attendees.map((row) => {
                  const profile = row.profiles;
                  const fullName =
                    profile?.full_name || "Outdoor friend";
                  const displayName = profile?.display_name || "";
                  const avatarUrl = profile?.avatar_url || null;

                  const initials = fullName
                    .split(" ")
                    .filter(Boolean)
                    .map((s) => s[0]?.toUpperCase())
                    .slice(0, 2)
                    .join("");

                  const isYou = user && profile?.id === user.id;

                  return (
                    <div key={row.id} style={styles.attendeeRow}>
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={fullName}
                          style={styles.attendeeAvatar}
                        />
                      ) : (
                        <div style={styles.attendeeFallbackAvatar}>
                          {initials || "👤"}
                        </div>
                      )}

                      <div style={styles.attendeeText}>
                        <div style={styles.attendeeName}>
                          {fullName}
                          {isYou && (
                            <span style={styles.attendeeYouTag}>
                              YOU
                            </span>
                          )}
                        </div>
                        {displayName && (
                          <div style={styles.attendeeSub}>
                            @{displayName}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}