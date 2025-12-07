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

  // UČITAVANJE TURE + USERA
  useEffect(() => {
    loadTour();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function loadTour() {
    setLoading(true);

    const { data: auth } = await supabase.auth.getUser();
    const currentUser = auth?.user || null;
    setUser(currentUser);

    const { data, error } = await supabase
      .from("tours")
      .select("*")
      .eq("id", id)
      .single();

    if (!error && data) {
      setTour(data);

      // da li je user već prijavljen
      if (currentUser) {
        const { data: reg } = await supabase
          .from("tour_registrations")
          .select("*")
          .eq("tour_id", id)
          .eq("user_id", currentUser.id)
          .maybeSingle();

        setIsJoined(!!reg);
      }
    } else {
      console.error(error);
    }

    setLoading(false);
  }

  // PRIDRUŽI SE TURI
  async function joinTour() {
    if (!user) return navigate("/login");

    const currentParticipants = tour.participants || 0;
    const maxPeople = tour.max_people || 0;

    if (maxPeople && currentParticipants >= maxPeople) {
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

    await supabase
      .from("tours")
      .update({ participants: currentParticipants + 1 })
      .eq("id", id);

    alert("Joined tour!");
    loadTour();
  }

  // INTERESOVANJE ZA TURU
  async function markInterested() {
    if (!user) return navigate("/login");

    const { error } = await supabase.from("tour_interested").insert([
      {
        tour_id: id,
        user_id: user.id,
      },
    ]);

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
  }

  // BRISANJE TURE
  async function deleteTour() {
    if (!window.confirm("Delete this tour forever?")) return;

    // notifikacija svim učesnicima
    const { data: participants } = await supabase
      .from("tour_registrations")
      .select("user_id")
      .eq("tour_id", id);

    if (participants && participants.length > 0) {
      for (let p of participants) {
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
  const isFull =
    (tour.participants || 0) >= (tour.max_people || Number.MAX_SAFE_INTEGER);
  const gallery = Array.isArray(tour.image_urls) ? tour.image_urls : [];

  // ===== STILOVI =====
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
        {/* HERO / COVER */}
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

            {/* tekst na coveru */}
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
          {/* LEFT: opis + slike + mapa */}
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
                  👥 {tour.participants}/{tour.max_people} participants
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

            {/* OPIS */}
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

            {/* GALERIJA */}
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

            {/* MAPA */}
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
                    📌 {tour.latitude.toFixed(4)},{" "}
                    {tour.longitude.toFixed(4)}
                  </div>
                </>
              ) : (
                <p style={{ fontSize: 13, opacity: 0.8 }}>
                  Location coordinates are not set for this tour.
                </p>
              )}
            </div>
          </div>

          {/* RIGHT: akcije + rezime */}
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

                  <button
                    style={secondaryBtn}
                    onClick={markInterested}
                    disabled={loading}
                  >
                    I&apos;m interested
                  </button>

                  {isJoined && (
                    <button
                      style={secondaryBtn}
                      onClick={() => navigate(`/chat/${tour.id}`)}
                    >
                      Open group chat
                    </button>
                  )}
                </>
              )}

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

            {/* QUICK SUMMARY */}
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
                  👥 {tour.participants}/{tour.max_people} participants
                </div>
                <div style={pill}>
                  💶 {tour.price ? `${tour.price} €` : "Free"}
                </div>
                <div style={pill}>
                  🕒 {tour.date_start} → {tour.date_end}
                </div>
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