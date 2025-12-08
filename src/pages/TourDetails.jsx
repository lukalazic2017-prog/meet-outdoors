// src/pages/TourDetails.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker } from "react-leaflet";

export default function TourDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [tour, setTour] = useState(null);
  const [user, setUser] = useState(null);
  const [isJoined, setIsJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);

  // realtime list
  const [participants, setParticipants] = useState([]);
  const [interested, setInterested] = useState([]);

  // ========= INITIAL LOAD =========
  useEffect(() => {
    loadTour();
  }, [id]);

  async function loadTour() {
    setLoading(true);

    // USER
    const { data: auth } = await supabase.auth.getUser();
    const currentUser = auth?.user || null;
    setUser(currentUser);

    // TOUR
    const { data, error } = await supabase
      .from("tours")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      console.error(error);
      setLoading(false);
      return;
    }

    setTour(data);

    // participants + interested + joined flag
    await Promise.all([
      loadParticipants(data, currentUser),
      loadInterested(),
    ]);

    setLoading(false);
  }

  // ========= LOAD PARTICIPANTS (WITH PROFILES) =========
  async function loadParticipants(currentTour = null, currentUser = null) {
    const { data, error } = await supabase
      .from("tour_registrations")
      .select("user_id, profiles ( id, avatar_url, display_name )")
      .eq("tour_id", id);

    if (error) {
      console.error("loadParticipants error:", error);
      return;
    }

    const regs = data || [];
    setParticipants(regs);

    const u = currentUser || user;
    if (u) {
      const joined = regs.some((r) => r.user_id === u.id);
      setIsJoined(joined);
    }

    // osveži lokalni tour.participants da bude tačan broj
    const baseTour = currentTour || tour;
    if (baseTour) {
      setTour({ ...baseTour, participants: regs.length });
    }
  }

  // ========= LOAD INTERESTED (WITH PROFILES) =========
  async function loadInterested() {
    const { data, error } = await supabase
      .from("tour_interested")
      .select("user_id, profiles ( id, avatar_url, display_name )")
      .eq("tour_id", id);

    if (error) {
      console.error("loadInterested error:", error);
      return;
    }

    setInterested(data || []);
  }

  // ========= REALTIME LISTENER (JOIN / LEAVE / INTERESTED) =========
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel("tour_live_" + id)
      // registracije
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tour_registrations",
          filter: `tour_id=eq.${id}`,
        },
        () => {
          // refresuj samo učesnike
          loadParticipants();
        }
      )
      // interested
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tour_interested",
          filter: `tour_id=eq.${id}`,
        },
        () => {
          loadInterested();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ========= JOIN TOUR =========
  async function joinTour() {
    if (!user) return navigate("/login");

    const maxPeople = tour.max_people || 0;
    const currentCount = participants.length;

    if (maxPeople && currentCount >= maxPeople) {
      return alert("This tour is full!");
    }

    const { error } = await supabase.from("tour_registrations").insert([
      {
        tour_id: id,
        user_id: user.id,
      },
    ]);

    if (error) {
      console.error(error);
      return alert("Could not join.");
    }

    // notifikacija kreatoru
    await supabase.from("notifications").insert({
      user_id: tour.creator_id,
      message: `Someone joined your tour: ${tour.title}`,
      link: `/tour/${id}`,
      read: false,
    });

    // update participants u tours tabeli (koristi realan broj)
    const newCount = currentCount + 1;
    await supabase
      .from("tours")
      .update({ participants: newCount })
      .eq("id", id);

    alert("Joined tour!");

    // instant refresh fronta (iako postoji realtime)
    loadParticipants();
  }

  // ========= LEAVE TOUR =========
  async function leaveTour() {
    if (!user) return navigate("/login");

    const { error } = await supabase
      .from("tour_registrations")
      .delete()
      .eq("tour_id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error(error);
      return alert("Could not leave the tour.");
    }

    const currentCount = participants.length;
    const newCount = Math.max(currentCount - 1, 0);

    await supabase
      .from("tours")
      .update({ participants: newCount })
      .eq("id", id);

    alert("You left the tour.");

    loadParticipants();
  }

  // ========= MARK INTERESTED =========
  async function markInterested() {
    if (!user) return navigate("/login");

    // već postoji u interested listi
    const already = interested.some((i) => i.user_id === user.id);
    if (already) {
      alert("You are already marked as interested for this tour.");
      return;
    }

    const { error } = await supabase
      .from("tour_interested")
      .insert([{ tour_id: id, user_id: user.id }]);

    if (error) {
      console.error(error);
      return alert("Could not mark as interested.");
    }

    await supabase.from("notifications").insert({
      user_id: tour.creator_id,
      message: `Someone is interested in your tour: ${tour.title}`,
      link: `/tour/${id}`,
      read: false,
    });

    alert("You will receive notifications!");

    loadInterested();
  }

  // ========= DELETE TOUR =========
  async function deleteTour() {
    if (!window.confirm("Delete this tour forever?")) return;

    const { data: regs } = await supabase
      .from("tour_registrations")
      .select("user_id")
      .eq("tour_id", id);

    if (regs && regs.length > 0) {
      for (let p of regs) {
        await supabase.from("notifications").insert({
          user_id: p.user_id,
          message: `The tour ${tour.title} has been cancelled.`,
          link: "/tours",
          read: false,
        });
      }
    }

    const { error } = await supabase.from("tours").delete().eq("id", id);

    if (!error) {
      alert("Tour deleted!");
      navigate("/tours");
    } else {
      console.error(error);
      alert("Error deleting tour.");
    }
  }

  // ========= LOADING =========
  if (loading || !tour) {
    return (
      <div
        style={{
          minHeight: "70vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
        }}
      >
        Loading tour...
      </div>
    );
  }

  const isCreator = user && user.id === tour.creator_id;
  const currentCount = participants.length;
  const isFull =
    tour.max_people && currentCount >= (tour.max_people || Number.MAX_SAFE_INTEGER);
  const gallery = Array.isArray(tour.image_urls) ? tour.image_urls : [];

  // ===================== STILOVI ========================
  const pageWrapper = {
    minHeight: "100vh",
    padding: "24px 16px 50px",
    background:
      "radial-gradient(circle at top, #071f16 0%, #020806 45%, #020405 100%)",
    color: "#ffffff",
    boxSizing: "border-box",
  };

  const container = {
    maxWidth: "1100px",
    margin: "0 auto",
    boxSizing: "border-box",
  };

  const headerCard = {
    borderRadius: 22,
    overflow: "hidden",
    position: "relative",
    marginBottom: 18,
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 26px 70px rgba(0,0,0,0.75)",
  };

  const coverOverlay = {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.9) 75%)",
  };

  const layout = {
    marginTop: 20,
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.8fr) minmax(0, 1.2fr)",
    gap: 18,
  };

  const card = {
    background: "rgba(0,0,0,0.55)",
    borderRadius: 20,
    padding: 18,
    border: "1px solid rgba(255,255,255,0.06)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.8)",
    backdropFilter: "blur(18px)",
  };

  const sectionTitle = {
    fontSize: 14,
    textTransform: "uppercase",
    letterSpacing: "0.09em",
    color: "rgba(200,255,230,0.85)",
    marginBottom: 10,
  };

  const pillRow = {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  };

  const pill = {
    fontSize: 12,
    padding: "4px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.5)",
  };

  const primaryBtn = {
    width: "100%",
    padding: "12px",
    border: "none",
    borderRadius: 999,
    background:
      "linear-gradient(135deg, #00ffb0 0%, #00cf7c 40%, #02a45d 100%)",
    color: "#02140b",
    fontWeight: 800,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    cursor: "pointer",
    marginBottom: 10,
  };

  const secondaryBtn = {
    width: "100%",
    padding: "11px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.2)",
    background: "rgba(0,0,0,0.6)",
    color: "white",
    fontWeight: 600,
    cursor: "pointer",
    marginBottom: 10,
  };

  const dangerBtn = {
    width: "100%",
    padding: "11px",
    borderRadius: 999,
    border: "none",
    background: "#ff4040",
    color: "white",
    fontWeight: 700,
    cursor: "pointer",
  };

  const smallBtn = {
    padding: "6px 14px",
    borderRadius: 999,
    border: "none",
    background: "rgba(0,0,0,0.7)",
    color: "white",
    cursor: "pointer",
    fontSize: 13,
  };

  const isSmallScreen =
    typeof window !== "undefined" && window.innerWidth < 820;
  const layoutResponsive = isSmallScreen
    ? { ...layout, gridTemplateColumns: "1fr" }
    : layout;

  return (
    <div style={pageWrapper}>
      <div style={container}>
        {/* HERO */}
        <div style={headerCard}>
          <div
            style={{
              position: "relative",
              height: 260,
              overflow: "hidden",
            }}
          >
            <img
              src={
                tour.cover_url ||
                "https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg"
              }
              alt="cover"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: "scale(1.02)",
                filter: "saturate(1.15) contrast(1.05)",
              }}
            />
            <div style={coverOverlay} />

            <div
              style={{
                position: "absolute",
                left: 18,
                right: 18,
                bottom: 18,
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "4px 10px",
                  borderRadius: 999,
                  background: "rgba(0,0,0,0.65)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "rgba(210,255,230,0.95)",
                  marginBottom: 8,
                }}
              >
                <span>⛰️ {tour.activity || "Outdoor tour"}</span>
                <span style={{ opacity: 0.7 }}>•</span>
                <span>{tour.country || "Unknown country"}</span>
              </div>

              <h1
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  textShadow: "0 8px 30px rgba(0,0,0,0.9)",
                }}
              >
                {tour.title}
              </h1>

              <div
                style={{
                  fontSize: 13,
                  color: "rgba(230,255,240,0.78)",
                  maxWidth: 520,
                }}
              >
                {tour.location_name && (
                  <>
                    📍 {tour.location_name}
                    {tour.country ? `, ${tour.country}` : ""}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* GLAVNI LAYOUT */}
        <div style={layoutResponsive}>
          {/* LEFT */}
          <div style={card}>
            {/* OVERVIEW */}
            <div style={{ marginBottom: 14 }}>
              <div style={sectionTitle}>Overview</div>
              <div style={pillRow}>
                <div style={pill}>
                  🗓 {tour.date_start} → {tour.date_end}
                </div>
                <div style={pill}>
                  💶 {tour.price ? `${tour.price} € per person` : "Free tour"}
                </div>
                <div style={pill}>
                  👥 {currentCount}/{tour.max_people || "∞"} participants
                  {isFull && (
                    <span style={{ color: "#ff8080", marginLeft: 6 }}>
                      (Full)
                    </span>
                  )}
                </div>
                {tour.is_legal_entity && (
                  <div style={pill}>🏢 Organized by a legal entity</div>
                )}
              </div>
            </div>

            {/* DESCRIPTION */}
            <div style={{ marginBottom: 18 }}>
              <div style={sectionTitle}>Description</div>
              <p
                style={{
                  fontSize: 14,
                  lineHeight: 1.55,
                  color: "rgba(240,255,245,0.9)",
                  whiteSpace: "pre-line",
                }}
              >
                {tour.description || "No description provided."}
              </p>
            </div>

            {/* GALLERY */}
            {gallery.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={sectionTitle}>Gallery</div>

                <div
                  style={{
                    borderRadius: 16,
                    overflow: "hidden",
                    marginBottom: 10,
                    border: "1px solid rgba(255,255,255,0.12)",
                  }}
                >
                  <img
                    src={gallery[currentImage]}
                    alt="Tour"
                    style={{
                      width: "100%",
                      height: 230,
                      objectFit: "cover",
                    }}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <button
                    style={smallBtn}
                    onClick={() =>
                      setCurrentImage((prev) =>
                        prev === 0 ? gallery.length - 1 : prev - 1
                      )
                    }
                  >
                    ◀ Prev
                  </button>
                  <span style={{ fontSize: 12, opacity: 0.7 }}>
                    {currentImage + 1} / {gallery.length}
                  </span>
                  <button
                    style={smallBtn}
                    onClick={() =>
                      setCurrentImage((prev) =>
                        prev === gallery.length - 1 ? 0 : prev + 1
                      )
                    }
                  >
                    Next ▶
                  </button>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    overflowX: "auto",
                    paddingBottom: 4,
                  }}
                >
                  {gallery.map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => setCurrentImage(idx)}
                      style={{
                        flex: "0 0 70px",
                        height: 60,
                        borderRadius: 10,
                        overflow: "hidden",
                        border:
                          idx === currentImage
                            ? "2px solid #00ffb0"
                            : "1px solid rgba(255,255,255,0.2)",
                        cursor: "pointer",
                      }}
                    >
                      <img
                        src={img}
                        alt={`thumb-${idx}`}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MAP */}
            <div>
              <div style={sectionTitle}>Location on map</div>
              {tour.latitude && tour.longitude ? (
                <>
                  <div
                    style={{
                      marginTop: 15,
                      borderRadius: 12,
                      overflow: "hidden",
                    }}
                  >
                    <MapContainer
                      center={[tour.latitude, tour.longitude]}
                      zoom={12}
                      scrollWheelZoom={true}
                      style={{ height: "250px", width: "100%" }}
                    >
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <Marker position={[tour.latitude, tour.longitude]} />
                    </MapContainer>
                  </div>
                  <div
                    style={{
                      marginTop: 8,
                      fontSize: 12,
                      color: "rgba(230,255,240,0.75)",
                    }}
                  >
                    📌 {tour.latitude.toFixed(4)}, {tour.longitude.toFixed(4)}
                  </div>
                </>
              ) : (
                <p style={{ fontSize: 13, opacity: 0.8 }}>
                  Location coordinates are not set for this tour.
                </p>
              )}
            </div>
          </div>

          {/* RIGHT */}
          <div style={card}>
            <div style={{ marginBottom: 16 }}>
              <div style={sectionTitle}>Your options</div>

              {!isCreator && (
                <>
                  {!isJoined && (
                    <button
                      style={{
                        ...primaryBtn,
                        opacity: isFull ? 0.5 : 1,
                        cursor: isFull ? "default" : "pointer",
                      }}
                      disabled={isFull || loading}
                      onClick={joinTour}
                    >
                      {isFull ? "Tour is full" : "Join tour"}
                    </button>
                  )}

                  {/* INTERESTED */}
                  <button
                    style={secondaryBtn}
                    onClick={markInterested}
                    disabled={loading}
                  >
                    I&apos;m interested
                  </button>

                  {/* JOINED → CHAT + LEAVE */}
                  {isJoined && (
                    <>
                      <button
                        style={secondaryBtn}
                        onClick={() => navigate(`/chat/${tour.id}`)}
                      >
                        Open group chat
                      </button>

                      <button
                        style={{
                          ...secondaryBtn,
                          background: "rgba(255,60,60,0.25)",
                          border: "1px solid rgba(255,60,60,0.5)",
                          color: "white",
                        }}
                        onClick={leaveTour}
                      >
                        Leave tour
                      </button>
                    </>
                  )}
                </>
              )}

              {/* CREATOR OPTIONS */}
              {isCreator && (
                <>
                  <button
                    style={secondaryBtn}
                    onClick={() => navigate(`/chat/${tour.id}`)}
                  >
                    Open group chat
                  </button>
                  <button
                    style={secondaryBtn}
                    onClick={() => navigate(`/edit-tour/${tour.id}`)}
                  >
                    Edit tour
                  </button>
                  <button style={dangerBtn} onClick={deleteTour}>
                    Delete tour
                  </button>
                </>
              )}
            </div>

            {/* SUMMARY + PARTICIPANTS + INTERESTED */}
            <div>
              <div style={sectionTitle}>Quick summary</div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  fontSize: 13,
                }}
              >
                <div style={pill}>🏷️ {tour.title || "Tour title"}</div>
                <div style={pill}>
                  🧭 {tour.activity || "Activity not set"}
                </div>
                <div style={pill}>
                  📍{" "}
                  {tour.location_name
                    ? `${tour.location_name}${
                        tour.country ? ", " + tour.country : ""
                      }`
                    : "Location not set"}
                </div>
                <div style={pill}>
                  👥 {currentCount}/{tour.max_people || "∞"} participants
                </div>
                <div style={pill}>
                  💶 {tour.price ? `${tour.price} €` : "Free"}
                </div>
                <div style={pill}>
                  🕒 {tour.date_start} → {tour.date_end}
                </div>
              </div>

              {/* PARTICIPANTS LIST */}
              <div style={{ marginTop: 22 }}>
                <div style={sectionTitle}>Participants</div>

                {participants.length === 0 && (
                  <div style={{ opacity: 0.6, fontSize: 13 }}>
                    No participants yet.
                  </div>
                )}

                {participants.map((p, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 10,
                      background: "rgba(255,255,255,0.05)",
                      padding: "8px 12px",
                      borderRadius: 12,
                    }}
                  >
                    <img
                      src={
                        p.profiles?.avatar_url ||
                        "https://i.pravatar.cc/150?img=5"
                      }
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                      alt="avatar"
                    />
                    <div style={{ fontSize: 14 }}>
                      {p.profiles?.display_name || "User"}
                    </div>
                  </div>
                ))}
              </div>

              {/* INTERESTED LIST */}
              <div style={{ marginTop: 18 }}>
                <div style={sectionTitle}>
                  Interested ({interested.length})
                </div>

                {interested.length === 0 && (
                  <div style={{ opacity: 0.6, fontSize: 13 }}>
                    No one is marked as interested yet.
                  </div>
                )}

                {interested.map((i, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 8,
                      padding: "6px 10px",
                      borderRadius: 10,
                      background: "rgba(255,255,255,0.03)",
                    }}
                  >
                    <img
                      src={
                        i.profiles?.avatar_url ||
                        "https://i.pravatar.cc/150?img=6"
                      }
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                      alt="avatar"
                    />
                    <div style={{ fontSize: 13 }}>
                      {i.profiles?.display_name || "User"}
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  marginTop: 14,
                  fontSize: 11,
                  opacity: 0.7,
                  lineHeight: 1.5,
                }}
              >
                Tip: use the group chat to coordinate meeting points, gear and
                timing so everyone arrives relaxed and ready.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}