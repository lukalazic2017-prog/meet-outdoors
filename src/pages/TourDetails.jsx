import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker } from "react-leaflet";

export default function TourDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [tour, setTour] = useState(null);
  const [user, setUser] = useState(null);
  const [isJoined, setIsJoined] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);
  const [participantsList, setParticipantsList] = useState([]);
  const [countdown, setCountdown] = useState("");
  const [creatorProfile, setCreatorProfile] = useState(null);

  function formatDate(date) {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function getCountdown(deadline) {
    if (!deadline) return "";

    const now = new Date();
    const end = new Date(deadline);
    const diff = end - now;

    if (diff <= 0) return "Applications closed";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  useEffect(() => {
    if (!tour?.application_deadline) return;

    setCountdown(getCountdown(tour.application_deadline));

    const interval = setInterval(() => {
      setCountdown(getCountdown(tour.application_deadline));
    }, 1000);

    return () => clearInterval(interval);
  }, [tour?.application_deadline]);

  useEffect(() => {
    loadTour();
    // eslint-disable-next-line
  }, [id]);

  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`tour-${id}-realtime`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tour_registrations",
          filter: `tour_id=eq.${id}`,
        },
        async () => {
          const { data: people, error: peopleError } = await supabase
            .from("tour_registrations")
            .select(`
              user_id,
              joined_at,
              status,
              profiles:profiles (
                full_name,
                avatar_url,
                is_verified_creator
              )
            `)
            .eq("tour_id", id)
            .eq("status", "joined")
            .order("joined_at", { ascending: true });

          if (peopleError) {
            console.log("REALTIME PEOPLE ERROR", peopleError);
            return;
          }

          const safePeople = people || [];
          setParticipantsList(safePeople);

          if (user) {
            const joinedNow = safePeople.some((p) => p.user_id === user.id);
            setIsJoined(joinedNow);
          }

          const { count, error: countError } = await supabase
            .from("tour_registrations")
            .select("*", { count: "exact", head: true })
            .eq("tour_id", id)
            .eq("status", "joined");

          if (countError) console.log("REALTIME COUNT ERROR", countError);

          setTour((prev) =>
            prev ? { ...prev, participants: count ?? 0 } : prev
          );
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [id, user]);

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

    if (error) {
      console.log("LOAD TOUR ERROR", error);
      setLoading(false);
      return;
    }

    if (data) {
      const { count, error: countError } = await supabase
        .from("tour_registrations")
        .select("*", { count: "exact", head: true })
        .eq("tour_id", id)
        .eq("status", "joined");

      if (countError) console.log("COUNT ERROR", countError);

      setTour({ ...data, participants: count ?? 0 });

      const { data: people, error: peopleError } = await supabase
        .from("tour_registrations")
        .select(`
          user_id,
          joined_at,
          status,
          profiles:profiles (
            full_name,
            avatar_url,
            is_verified_creator
          )
        `)
        .eq("tour_id", id)
        .eq("status", "joined")
        .order("joined_at", { ascending: true });

      if (peopleError) console.log("PEOPLE LOAD ERROR", peopleError);

      const safePeople = people || [];
      setParticipantsList(safePeople);

      if (data?.creator_id) {
        const { data: cp, error: cpError } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url, home_base, is_verified_creator")
          .eq("id", data.creator_id)
          .maybeSingle();

        if (cpError) console.log("CREATOR PROFILE ERROR", cpError);

        setCreatorProfile(cp || null);
      } else {
        setCreatorProfile(null);
      }

      if (currentUser) {
        const joinedNow = safePeople.some((p) => p.user_id === currentUser.id);
        setIsJoined(joinedNow);

        const { data: saved, error: savedError } = await supabase
          .from("saved_tours")
          .select("id")
          .eq("tour_id", id)
          .eq("user_id", currentUser.id)
          .maybeSingle();

        if (savedError) console.log("SAVED TOUR ERROR", savedError);

        setIsSaved(!!saved);
      } else {
        setIsJoined(false);
        setIsSaved(false);
      }
    }

    setLoading(false);
  }

  async function joinTour() {
    if (!user) return navigate("/login");

    if (
      tour.application_deadline &&
      new Date() > new Date(tour.application_deadline)
    ) {
      return alert("Applications are closed.");
    }

    const fullNow =
      (tour?.participants || 0) >=
      (tour?.max_people || Number.MAX_SAFE_INTEGER);

    if (fullNow) {
      return alert("This tour is full.");
    }

    const { error } = await supabase
      .from("tour_registrations")
      .upsert(
        [
          {
            tour_id: id,
            user_id: user.id,
            status: "joined",
            joined_at: new Date().toISOString(),
          },
        ],
        { onConflict: "tour_id,user_id" }
      );

    if (error) {
      console.log("JOIN TOUR ERROR", error);
      alert("Could not join the tour. Please try again.");
      return;
    }

    setIsJoined(true);
    await loadTour();
  }

  async function leaveTour() {
    if (!user) return navigate("/login");

    const { error } = await supabase
      .from("tour_registrations")
      .delete()
      .eq("tour_id", id)
      .eq("user_id", user.id);

    if (error) {
      console.log("LEAVE TOUR ERROR", error);
      alert("Could not leave the tour. Please try again.");
      return;
    }

    setIsJoined(false);
    await loadTour();
  }

  async function toggleSave() {
    if (!user) return navigate("/login");

    if (isSaved) {
      const { error } = await supabase
        .from("saved_tours")
        .delete()
        .eq("tour_id", id)
        .eq("user_id", user.id);

      if (error) {
        console.log("UNSAVE ERROR", error);
        return;
      }

      setIsSaved(false);
    } else {
      const { error } = await supabase
        .from("saved_tours")
        .insert([{ tour_id: id, user_id: user.id }]);

      if (error) {
        console.log("SAVE ERROR", error);
        return;
      }

      setIsSaved(true);
    }
  }

  async function deleteTour() {
    if (!window.confirm("Delete this tour forever?")) return;

    await supabase.from("tour_registrations").delete().eq("tour_id", id);
    await supabase.from("tours").delete().eq("id", id);

    navigate("/tours");
  }

  if (loading || !tour) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background:
            "radial-gradient(circle at top, #071f16 0%, #020806 45%, #020405 100%)",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
          padding: 20,
        }}
      >
        <div
          style={{
            padding: "18px 24px",
            borderRadius: 18,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
            fontWeight: 800,
            letterSpacing: "0.04em",
          }}
        >
          Loading tour...
        </div>
      </div>
    );
  }

  const isCreator = user && user.id === tour.creator_id;
  const isFull =
    (tour.participants || 0) >= (tour.max_people || Number.MAX_SAFE_INTEGER);
  const gallery = Array.isArray(tour.image_urls) ? tour.image_urls : [];
  const isSmallScreen =
    typeof window !== "undefined" && window.innerWidth < 860;

  const coverImage =
    tour.cover_url ||
    "https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg";

  const pageWrapper = {
    minHeight: "100vh",
    padding: isSmallScreen ? "0 0 96px" : "22px 16px 50px",
    background:
      "radial-gradient(1000px 460px at 12% -5%, rgba(0,255,176,0.10), transparent 56%)," +
      "radial-gradient(900px 420px at 90% -8%, rgba(124,77,255,0.10), transparent 54%)," +
      "linear-gradient(180deg, #071f16 0%, #020806 45%, #020405 100%)",
    color: "#ffffff",
    boxSizing: "border-box",
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  };

  const container = {
    maxWidth: "1180px",
    margin: "0 auto",
    boxSizing: "border-box",
  };

  const headerCard = {
    borderRadius: isSmallScreen ? "0 0 28px 28px" : 28,
    overflow: "hidden",
    position: "relative",
    marginBottom: isSmallScreen ? 14 : 18,
    border: isSmallScreen ? "none" : "1px solid rgba(255,255,255,0.08)",
    boxShadow: isSmallScreen
      ? "0 22px 48px rgba(0,0,0,0.42)"
      : "0 26px 70px rgba(0,0,0,0.75)",
    background: "rgba(0,0,0,0.35)",
  };

  const coverOverlay = {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(180deg, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.55) 38%, rgba(0,0,0,0.92) 100%)",
  };

  const layout = {
    marginTop: 20,
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.8fr) minmax(0, 1.2fr)",
    gap: 18,
  };

  const layoutResponsive = isSmallScreen
    ? { ...layout, gridTemplateColumns: "1fr", gap: 14, marginTop: 14 }
    : layout;

  const card = {
    background:
      "linear-gradient(145deg, rgba(0,0,0,0.52), rgba(8,18,14,0.74))",
    borderRadius: isSmallScreen ? 22 : 24,
    padding: isSmallScreen ? 15 : 18,
    border: "1px solid rgba(255,255,255,0.07)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
    backdropFilter: "blur(18px)",
  };

  const sectionTitle = {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: "0.13em",
    color: "rgba(200,255,230,0.85)",
    marginBottom: 10,
    fontWeight: 900,
  };

  const pillRow = {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  };

  const pill = {
    fontSize: 12,
    padding: "8px 11px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.05)",
    boxShadow: "0 8px 18px rgba(0,0,0,0.18)",
  };

  const primaryBtn = {
    width: "100%",
    padding: isSmallScreen ? "14px 14px" : "13px 12px",
    border: "none",
    borderRadius: 999,
    background:
      "linear-gradient(135deg, #00ffb0 0%, #00cf7c 40%, #02a45d 100%)",
    color: "#02140b",
    fontWeight: 900,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    cursor: "pointer",
    marginBottom: 10,
    boxShadow: "0 16px 36px rgba(0,207,124,0.22)",
    minHeight: isSmallScreen ? 48 : "auto",
  };

  const secondaryBtn = {
    width: "100%",
    padding: isSmallScreen ? "13px 12px" : "11px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(255,255,255,0.05)",
    color: "white",
    fontWeight: 800,
    cursor: "pointer",
    marginBottom: 10,
    minHeight: isSmallScreen ? 46 : "auto",
  };

  const dangerBtn = {
    width: "100%",
    padding: isSmallScreen ? "13px 12px" : "11px",
    borderRadius: 999,
    border: "none",
    background: "linear-gradient(135deg, #ff5d5d, #d92c2c)",
    color: "white",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 16px 36px rgba(255,64,64,0.16)",
    minHeight: isSmallScreen ? 46 : "auto",
  };

  const smallBtn = {
    padding: "8px 14px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.58)",
    color: "white",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 700,
  };

  const heroInfoCard = {
    position: "absolute",
    left: isSmallScreen ? 14 : 18,
    right: isSmallScreen ? 14 : 18,
    bottom: isSmallScreen ? 14 : 18,
    zIndex: 2,
  };

  const statGrid = {
    display: "grid",
    gridTemplateColumns: isSmallScreen ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
    gap: 10,
    marginTop: 14,
  };

  const statCard = {
    padding: isSmallScreen ? "12px 10px" : "14px 12px",
    borderRadius: 18,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 12px 28px rgba(0,0,0,0.20)",
    textAlign: "center",
  };

  const quickSummaryGrid = {
    display: "grid",
    gridTemplateColumns: isSmallScreen ? "1fr" : "1fr 1fr",
    gap: 10,
  };

  return (
    <div style={pageWrapper}>
      <div style={container}>
        <div style={headerCard}>
          <div
            style={{
              position: "relative",
              height: isSmallScreen ? 360 : 320,
              overflow: "hidden",
            }}
          >
            <img
              src={coverImage}
              alt="cover"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: "scale(1.03)",
                filter: "saturate(1.15) contrast(1.05)",
              }}
            />
            <div style={coverOverlay} />

            <div
              style={{
                position: "absolute",
                top: isSmallScreen ? 14 : 16,
                left: isSmallScreen ? 14 : 18,
                right: isSmallScreen ? 14 : 18,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 10,
                zIndex: 2,
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={() => navigate(-1)}
                style={{
                  border: "1px solid rgba(255,255,255,0.16)",
                  background: "rgba(0,0,0,0.38)",
                  color: "#fff",
                  borderRadius: 999,
                  padding: "10px 14px",
                  fontWeight: 800,
                  backdropFilter: "blur(10px)",
                  boxShadow: "0 10px 24px rgba(0,0,0,0.25)",
                  cursor: "pointer",
                }}
              >
                ← Back
              </button>

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  justifyContent: "flex-end",
                }}
              >
                <div
                  style={{
                    padding: "7px 11px",
                    borderRadius: 999,
                    background: "rgba(0,0,0,0.42)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    fontSize: 11,
                    fontWeight: 800,
                    backdropFilter: "blur(10px)",
                  }}
                >
                  ⛰️ {tour.activity || "Outdoor tour"}
                </div>

                <div
                  style={{
                    padding: "7px 11px",
                    borderRadius: 999,
                    background: "rgba(0,0,0,0.42)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    fontSize: 11,
                    fontWeight: 800,
                    backdropFilter: "blur(10px)",
                  }}
                >
                  🌍 {tour.country || "Unknown country"}
                </div>
              </div>
            </div>

            <div style={heroInfoCard}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 12px",
                  borderRadius: 999,
                  background: "rgba(0,0,0,0.48)",
                  border: "1px solid rgba(255,255,255,0.16)",
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "rgba(210,255,230,0.95)",
                  marginBottom: 10,
                  fontWeight: 900,
                  backdropFilter: "blur(10px)",
                }}
              >
                🧭 Premium outdoor experience
              </div>

              <h1
                style={{
                  fontSize: isSmallScreen ? 30 : 34,
                  lineHeight: 0.98,
                  fontWeight: 950,
                  letterSpacing: "-0.03em",
                  textShadow: "0 8px 30px rgba(0,0,0,0.85)",
                  margin: 0,
                }}
              >
                {tour.title}
              </h1>

              <div
                style={{
                  marginTop: 8,
                  fontSize: isSmallScreen ? 13 : 14,
                  color: "rgba(230,255,240,0.82)",
                  maxWidth: 620,
                  lineHeight: 1.55,
                }}
              >
                {tour.location_name ? (
                  <>
                    📍 {tour.location_name}
                    {tour.country ? `, ${tour.country}` : ""}
                  </>
                ) : (
                  "Outdoor destination"
                )}
              </div>

              <div style={statGrid}>
                <div style={statCard}>
                  <div style={{ fontSize: 18, fontWeight: 900 }}>
                    {tour.participants || 0}
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.75, marginTop: 3 }}>
                    Joined
                  </div>
                </div>

                <div style={statCard}>
                  <div style={{ fontSize: 18, fontWeight: 900 }}>
                    {tour.max_people || "∞"}
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.75, marginTop: 3 }}>
                    Capacity
                  </div>
                </div>

                <div style={statCard}>
                  <div style={{ fontSize: 18, fontWeight: 900 }}>
                    {tour.price ? `${tour.price}€` : "Free"}
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.75, marginTop: 3 }}>
                    Price
                  </div>
                </div>

                <div style={statCard}>
                  <div style={{ fontSize: 18, fontWeight: 900 }}>
                    {isFull ? "Full" : "Open"}
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.75, marginTop: 3 }}>
                    Status
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={layoutResponsive}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={card}>
              <div style={sectionTitle}>Overview</div>

              {creatorProfile && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 8 }}>
                    Organized by
                  </div>

                  <Link
                    to={`/profile/${creatorProfile.id}`}
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        background: "rgba(255,255,255,0.06)",
                        padding: "10px 12px",
                        borderRadius: 18,
                        border: "1px solid rgba(255,255,255,0.10)",
                        boxShadow: "0 12px 28px rgba(0,0,0,0.22)",
                      }}
                    >
                      <img
                        src={
                          creatorProfile.avatar_url || "https://i.pravatar.cc/80"
                        }
                        alt=""
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: "50%",
                          objectFit: "cover",
                          border: "1px solid rgba(255,255,255,0.12)",
                        }}
                      />

                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            flexWrap: "wrap",
                            fontWeight: 900,
                            fontSize: 14,
                          }}
                        >
                          <span>{creatorProfile?.full_name || "Organizer"}</span>

                          {creatorProfile?.is_verified_creator && (
                            <span
                              style={{
                                fontSize: 10,
                                padding: "4px 8px",
                                borderRadius: 999,
                                background: "rgba(0,255,176,0.14)",
                                border: "1px solid rgba(0,255,176,0.35)",
                                color: "#9cffd8",
                                fontWeight: 900,
                                letterSpacing: "0.06em",
                                textTransform: "uppercase",
                              }}
                            >
                              Verified Organizer
                            </span>
                          )}
                        </div>

                        <div
                          style={{
                            fontSize: 12,
                            opacity: 0.7,
                            marginTop: 2,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {creatorProfile.home_base || "Organizer profile"}
                        </div>
                      </div>

                      <div
                        style={{
                          fontSize: 12,
                          opacity: 0.72,
                          fontWeight: 700,
                        }}
                      >
                        Open →
                      </div>
                    </div>
                  </Link>
                </div>
              )}

              <div style={pillRow}>
                <div style={pill}>
                  🗓 {tour.date_start} → {tour.date_end}
                </div>
                <div style={pill}>
                  💶 {tour.price ? `${tour.price} € per person` : "Free tour"}
                </div>
                <div style={pill}>
                  👥 {tour.participants || 0}/{tour.max_people} participants
                  {isFull && (
                    <span style={{ color: "#ff9090", marginLeft: 6 }}>
                      (Full)
                    </span>
                  )}
                </div>
                {tour.is_legal_entity && (
                  <div style={pill}>🏢 Organized by a legal entity</div>
                )}
              </div>

              {(tour.application_start || tour.application_deadline) && (
                <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
                  {tour.application_start && (
                    <div style={pill}>
                      📝 Applications from {formatDate(tour.application_start)}
                    </div>
                  )}

                  {tour.application_deadline && (
                    <div style={pill}>
                      ⏳ Applications until {formatDate(tour.application_deadline)}
                      {countdown && (
                        <span
                          style={{
                            marginLeft: 6,
                            color: "#00ffb0",
                            fontWeight: 700,
                          }}
                        >
                          ({countdown})
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div style={{ marginTop: 18 }}>
                <div style={sectionTitle}>Description</div>
                <p
                  style={{
                    fontSize: 14,
                    lineHeight: 1.7,
                    color: "rgba(240,255,245,0.92)",
                    whiteSpace: "pre-line",
                    margin: 0,
                  }}
                >
                  {tour.description || "No description provided."}
                </p>
              </div>
            </div>

            {gallery.length > 0 && (
              <div style={card}>
                <div style={sectionTitle}>Gallery</div>

                <div
                  style={{
                    borderRadius: 18,
                    overflow: "hidden",
                    marginBottom: 12,
                    border: "1px solid rgba(255,255,255,0.10)",
                    boxShadow: "0 16px 38px rgba(0,0,0,0.32)",
                  }}
                >
                  <img
                    src={gallery[currentImage]}
                    alt="Tour"
                    style={{
                      width: "100%",
                      height: isSmallScreen ? 260 : 300,
                      objectFit: "cover",
                    }}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 10,
                    gap: 10,
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

                  <span style={{ fontSize: 12, opacity: 0.72 }}>
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
                    gap: 8,
                    overflowX: "auto",
                    paddingBottom: 4,
                  }}
                >
                  {gallery.map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => setCurrentImage(idx)}
                      style={{
                        flex: "0 0 76px",
                        height: 66,
                        borderRadius: 12,
                        overflow: "hidden",
                        border:
                          idx === currentImage
                            ? "2px solid #00ffb0"
                            : "1px solid rgba(255,255,255,0.14)",
                        cursor: "pointer",
                        boxShadow:
                          idx === currentImage
                            ? "0 0 0 3px rgba(0,255,176,0.12)"
                            : "none",
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

            {tour.video_url && (
              <div style={card}>
                <div style={sectionTitle}>Video</div>

                <div
                  style={{
                    borderRadius: 18,
                    overflow: "hidden",
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(0,0,0,0.75)",
                    boxShadow: "0 18px 50px rgba(0,0,0,0.50)",
                  }}
                >
                  <video
                    src={tour.video_url}
                    controls
                    playsInline
                    preload="metadata"
                    style={{
                      width: "100%",
                      height: isSmallScreen ? 230 : 280,
                      objectFit: "cover",
                      backgroundColor: "black",
                    }}
                  />
                </div>

                <div
                  style={{
                    marginTop: 8,
                    fontSize: 11,
                    opacity: 0.72,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  🎬 Tour video preview
                </div>
              </div>
            )}

            <div style={card}>
              <div style={sectionTitle}>Location on map</div>

              {tour.latitude && tour.longitude ? (
                <>
                  <div
                    style={{
                      marginTop: 10,
                      borderRadius: 16,
                      overflow: "hidden",
                      border: "1px solid rgba(255,255,255,0.10)",
                      boxShadow: "0 16px 40px rgba(0,0,0,0.34)",
                    }}
                  >
                    <MapContainer
                      center={[tour.latitude, tour.longitude]}
                      zoom={12}
                      scrollWheelZoom={true}
                      style={{
                        height: isSmallScreen ? "250px" : "290px",
                        width: "100%",
                      }}
                    >
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <Marker position={[tour.latitude, tour.longitude]} />
                    </MapContainer>
                  </div>

                  <div
                    style={{
                      marginTop: 10,
                      fontSize: 12,
                      color: "rgba(230,255,240,0.78)",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 14,
                      padding: "10px 12px",
                      width: "fit-content",
                    }}
                  >
                    📌 {tour.latitude.toFixed(4)}, {tour.longitude.toFixed(4)}
                  </div>
                </>
              ) : (
                <p style={{ fontSize: 13, opacity: 0.8, margin: 0 }}>
                  Location coordinates are not set for this tour.
                </p>
              )}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={card}>
              <div style={sectionTitle}>Your options</div>

              {!isCreator && (
                <>
                  {!isJoined ? (
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
                  ) : (
                    <button
                      style={secondaryBtn}
                      onClick={leaveTour}
                      disabled={loading}
                    >
                      Leave tour
                    </button>
                  )}

                  <button
                    style={secondaryBtn}
                    onClick={toggleSave}
                    disabled={loading}
                  >
                    {isSaved ? "♥ Saved" : "♡ Save tour"}
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

            <div style={card}>
              <div style={sectionTitle}>Quick summary</div>

              <div style={quickSummaryGrid}>
                <div style={pill}>🏷️ {tour.title || "Tour title"}</div>
                <div style={pill}>🧭 {tour.activity || "Activity not set"}</div>

                {creatorProfile && (
                  <div style={pill}>
                    👤 Organizer:{" "}
                    <Link
                      to={`/profile/${creatorProfile.id}`}
                      style={{
                        color: "#00ffb0",
                        textDecoration: "none",
                        fontWeight: 800,
                      }}
                    >
                      {creatorProfile.full_name || "Organizer"}
                    </Link>
                  </div>
                )}

                {creatorProfile?.is_verified_creator && (
                  <div style={pill}>✅ Verified creator</div>
                )}

                <div style={pill}>
                  📍{" "}
                  {tour.location_name
                    ? `${tour.location_name}${tour.country ? ", " + tour.country : ""}`
                    : "Location not set"}
                </div>

                <div style={pill}>
                  👥 {tour.participants || 0}/{tour.max_people} participants
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
                  marginTop: 16,
                  fontSize: 12,
                  opacity: 0.75,
                  lineHeight: 1.6,
                  padding: "12px 14px",
                  borderRadius: 16,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                Tip: use the group chat to coordinate meeting points, gear and
                timing so everyone arrives relaxed and ready.
              </div>
            </div>

            <div style={card}>
              <div style={sectionTitle}>Participants</div>

              {participantsList.length === 0 ? (
                <div style={{ fontSize: 13, opacity: 0.68 }}>
                  No participants yet
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gap: 10,
                  }}
                >
                  {participantsList.map((p, idx) => (
                    <Link
                      key={idx}
                      to={`/profile/${p.user_id}`}
                      style={{ textDecoration: "none", color: "inherit" }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          background: "rgba(255,255,255,0.06)",
                          padding: "10px 12px",
                          borderRadius: 18,
                          cursor: "pointer",
                          border: "1px solid rgba(255,255,255,0.08)",
                          boxShadow: "0 10px 24px rgba(0,0,0,0.18)",
                        }}
                      >
                        {p.profiles?.avatar_url ? (
                          <img
                            src={p.profiles.avatar_url}
                            alt=""
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: "50%",
                              objectFit: "cover",
                              border: "1px solid rgba(255,255,255,0.10)",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: "50%",
                              background:
                                "linear-gradient(135deg, #1abc9c, #00ffb0)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 13,
                              fontWeight: 900,
                              color: "#000",
                            }}
                          >
                            {p.profiles?.full_name?.[0] || "U"}
                          </div>
                        )}

                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 800,
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              flexWrap: "wrap",
                            }}
                          >
                            <span>{p.profiles?.full_name || "User"}</span>

                            {p.profiles?.is_verified_creator && (
                              <span
                                style={{
                                  fontSize: 10,
                                  padding: "3px 7px",
                                  borderRadius: 999,
                                  background: "rgba(0,255,176,0.12)",
                                  border: "1px solid rgba(0,255,176,0.28)",
                                  color: "#9cffd8",
                                  fontWeight: 900,
                                  letterSpacing: "0.05em",
                                  textTransform: "uppercase",
                                }}
                              >
                                Verified
                              </span>
                            )}
                          </div>

                          <div
                            style={{
                              fontSize: 11,
                              opacity: 0.66,
                              marginTop: 2,
                            }}
                          >
                            Joined the adventure
                          </div>
                        </div>

                        <div style={{ fontSize: 12, opacity: 0.65 }}>
                          Open →
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {isSmallScreen && !isCreator && (
          <div
            style={{
              position: "fixed",
              left: 10,
              right: 10,
              bottom: 10,
              zIndex: 9999,
              borderRadius: 20,
              background: "rgba(4,12,9,0.88)",
              border: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(16px)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.42)",
              padding: 10,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                marginBottom: 8,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 900,
                    color: "#fff",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {tour.title}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "rgba(230,255,240,0.75)",
                    marginTop: 2,
                  }}
                >
                  👥 {tour.participants || 0}/{tour.max_people} ·{" "}
                  {tour.price ? `${tour.price}€` : "Free"}
                </div>
              </div>

              <button
                onClick={toggleSave}
                style={{
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "rgba(255,255,255,0.06)",
                  color: "#fff",
                  borderRadius: 14,
                  padding: "12px 14px",
                  fontWeight: 800,
                  minWidth: 68,
                }}
              >
                {isSaved ? "♥" : "♡"}
              </button>
            </div>

            {!isJoined ? (
              <button
                style={{
                  ...primaryBtn,
                  marginBottom: 0,
                  opacity: isFull ? 0.5 : 1,
                  cursor: isFull ? "default" : "pointer",
                }}
                disabled={isFull || loading}
                onClick={joinTour}
              >
                {isFull ? "Tour is full" : "Join tour"}
              </button>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <button
                  style={{ ...secondaryBtn, marginBottom: 0 }}
                  onClick={leaveTour}
                  disabled={loading}
                >
                  Leave
                </button>

                <button
                  style={{ ...primaryBtn, marginBottom: 0 }}
                  onClick={() => navigate(`/chat/${tour.id}`)}
                >
                  Group chat
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}