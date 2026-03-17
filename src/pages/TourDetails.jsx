// src/pages/TourDetails.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker } from "react-leaflet";

const FALLBACK_COVER =
  "https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg";

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

  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 860 : false
  );

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 860);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

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

  function isTrainingTour(t) {
    return (
      t?.is_training === true ||
      [
        "Ski School",
        "Paragliding School",
        "Diving School",
        "Climbing School",
        "Survival School",
        "Kayak School",
        "Horse Riding School",
        "Cycling School",
        "Hiking School",
        "Camping School",
      ].includes(t?.activity)
    );
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

  const training = useMemo(() => isTrainingTour(tour), [tour]);

  if (loading || !tour) {
    return (
      <div style={styles.loadingPage}>
        <div style={styles.loadingBox}>Loading tour...</div>
      </div>
    );
  }

  const isCreator = user && user.id === tour.creator_id;
  const isFull =
    (tour.participants || 0) >= (tour.max_people || Number.MAX_SAFE_INTEGER);

  const gallery = Array.isArray(tour.image_urls) ? tour.image_urls : [];
  const coverImage = tour.cover_url || FALLBACK_COVER;

  return (
    <div
      style={{
        ...styles.page,
        marginTop: isMobile ? -120 : 100,
        padding: isMobile ? "0 0 108px" : "64px 0 42px",
      }}
    >
      <div style={styles.bgGlow1} />
      <div style={styles.bgGlow2} />
      <div style={styles.bgGlow3} />
      <div style={styles.bgGrid} />

      <div
        style={{
          ...styles.container,
          padding: isMobile ? "0 0 20px" : "0 18px 20px",
        }}
      >
        <div
          style={{
            ...styles.topBar,
            padding: isMobile ? "14px 14px 10px" : "0 4px",
            marginBottom: isMobile ? 0 : 14,
          }}
        >
          <button style={styles.backBtn} onClick={() => navigate(-1)}>
            ← Back
          </button>

          <div style={styles.crumb}>
            {tour.activity ? `${tour.activity} · ` : ""}
            {tour.country || "Outdoor"}
          </div>
        </div>

        <div
          style={{
            ...styles.hero,
            borderRadius: isMobile ? "0 0 34px 34px" : 34,
          }}
        >
          <div
            style={{
              ...styles.heroImageWrap,
              height: isMobile ? 460 : 540,
            }}
          >
            <img src={coverImage} alt="cover" style={styles.heroImage} />
            <div style={styles.heroOverlay} />
            <div style={styles.heroShine} />

            <div
              style={{
                ...styles.heroTopBar,
                top: isMobile ? 14 : 18,
                left: isMobile ? 14 : 18,
                right: isMobile ? 14 : 18,
              }}
            >
              {isMobile ? (
                <button style={styles.glassBtn} onClick={() => navigate(-1)}>
                  ← Back
                </button>
              ) : (
                <div />
              )}

              <div style={styles.heroTopRight}>
                <div style={styles.heroGlassTag}>
                  {training ? "🎓" : "⛰️"} {tour.activity || "Outdoor tour"}
                </div>
                <div style={styles.heroGlassTag}>
                  🌍 {tour.country || "Unknown country"}
                </div>
                {training && (
                  <div style={{ ...styles.heroGlassTag, ...styles.trainingHeroTag }}>
                    🏫 Training / School
                  </div>
                )}
              </div>
            </div>

            <div
              style={{
                ...styles.heroContent,
                left: isMobile ? 14 : 20,
                right: isMobile ? 14 : 20,
                bottom: isMobile ? 14 : 20,
              }}
            >
              <div style={styles.heroBadge}>
                {training ? "🎓 PREMIUM TRAINING EXPERIENCE" : "🧭 PREMIUM OUTDOOR EXPERIENCE"}
              </div>

              <h1
                style={{
                  ...styles.heroTitle,
                  fontSize: isMobile ? 32 : 48,
                }}
              >
                {tour.title}
              </h1>

              <div style={styles.heroSubtitle}>
                {tour.location_name ? (
                  <>
                    📍 {tour.location_name}
                    {tour.country ? `, ${tour.country}` : ""}
                  </>
                ) : (
                  "Outdoor destination"
                )}
              </div>

              <div
                style={{
                  ...styles.heroStatsGrid,
                  gridTemplateColumns: isMobile
                    ? "repeat(2, 1fr)"
                    : "repeat(4, 1fr)",
                }}
              >
                <div style={styles.heroStatCard}>
                  <div style={styles.heroStatValue}>{tour.participants || 0}</div>
                  <div style={styles.heroStatLabel}>Joined</div>
                </div>

                <div style={styles.heroStatCard}>
                  <div style={styles.heroStatValue}>{tour.max_people || "∞"}</div>
                  <div style={styles.heroStatLabel}>Capacity</div>
                </div>

                <div style={styles.heroStatCard}>
                  <div style={styles.heroStatValue}>
                    {tour.price ? `${tour.price}€` : "Free"}
                  </div>
                  <div style={styles.heroStatLabel}>Price</div>
                </div>

                <div style={styles.heroStatCard}>
                  <div style={styles.heroStatValue}>{isFull ? "Full" : "Open"}</div>
                  <div style={styles.heroStatLabel}>Status</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            ...styles.layout,
            gridTemplateColumns: isMobile
              ? "1fr"
              : "minmax(0, 1.8fr) minmax(0, 1.2fr)",
            gap: isMobile ? 14 : 18,
            marginTop: isMobile ? 14 : 18,
            padding: isMobile ? "0 14px" : 0,
          }}
        >
          <div style={styles.column}>
            <div style={styles.card}>
              <div style={styles.sectionTop}>
                <div style={styles.sectionTitle}>Overview</div>
                <div style={styles.sectionHint}>Everything you need at a glance.</div>
              </div>

              {creatorProfile && (
                <div style={{ marginBottom: 16 }}>
                  <div style={styles.microLabel}>Organized by</div>

                  <Link
                    to={`/profile/${creatorProfile.id}`}
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <div style={styles.organizerCard}>
                      <img
                        src={creatorProfile.avatar_url || "https://i.pravatar.cc/80"}
                        alt=""
                        style={styles.organizerAvatar}
                      />

                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={styles.organizerNameRow}>
                          <span style={styles.organizerName}>
                            {creatorProfile?.full_name || "Organizer"}
                          </span>

                          {creatorProfile?.is_verified_creator && (
                            <span style={styles.verifiedBadge}>
                              Verified Organizer
                            </span>
                          )}
                        </div>

                        <div style={styles.organizerSub}>
                          {creatorProfile.home_base || "Organizer profile"}
                        </div>
                      </div>

                      <div style={styles.organizerArrow}>Open →</div>
                    </div>
                  </Link>
                </div>
              )}

              <div style={styles.pillRow}>
                <div style={styles.pill}>
                  🗓 {formatDate(tour.date_start)} → {formatDate(tour.date_end)}
                </div>
                <div style={styles.pill}>
                  💶 {tour.price ? `${tour.price} € per person` : "Free tour"}
                </div>
                <div style={styles.pill}>
                  👥 {tour.participants || 0}/{tour.max_people} participants
                  {isFull && (
                    <span style={{ color: "#ff9e9e", marginLeft: 6 }}>(Full)</span>
                  )}
                </div>
                {tour.is_legal_entity && (
                  <div style={styles.pill}>🏢 Organized by a legal entity</div>
                )}

                {training && <div style={styles.pill}>🎓 Training mode</div>}
                {training && tour.skill_level && (
                  <div style={styles.pill}>
                    🎯 {String(tour.skill_level).replaceAll("_", " ")}
                  </div>
                )}
                {training && tour.training_language && (
                  <div style={styles.pill}>🗣 {tour.training_language}</div>
                )}
                {training && tour.duration_label && (
                  <div style={styles.pill}>⏱ {tour.duration_label}</div>
                )}
                {training && tour.equipment_included && (
                  <div style={styles.pill}>🧰 Equipment included</div>
                )}
                {training && tour.certificate_included && (
                  <div style={styles.pill}>📜 Certificate included</div>
                )}
                {training &&
                  tour.training_spots_left !== null &&
                  tour.training_spots_left !== undefined && (
                    <div style={styles.pill}>
                      🎟 {tour.training_spots_left} spots left
                    </div>
                  )}
              </div>

              {(tour.application_start || tour.application_deadline) && (
                <div style={{ marginTop: 14, display: "grid", gap: 8 }}>
                  {tour.application_start && (
                    <div style={styles.pill}>
                      📝 Applications from {formatDate(tour.application_start)}
                    </div>
                  )}

                  {tour.application_deadline && (
                    <div style={styles.pill}>
                      ⏳ Applications until {formatDate(tour.application_deadline)}
                      {countdown && (
                        <span style={styles.countdownAccent}>({countdown})</span>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div style={{ marginTop: 18 }}>
                <div style={styles.sectionTitle}>Description</div>
                <p style={styles.bodyText}>
                  {tour.description || "No description provided."}
                </p>
              </div>
            </div>

            {gallery.length > 0 && (
              <div style={styles.card}>
                <div style={styles.sectionTop}>
                  <div style={styles.sectionTitle}>Gallery</div>
                  <div style={styles.sectionHint}>
                    Swipe the vibe before you join.
                  </div>
                </div>

                <div style={styles.galleryMainWrap}>
                  <img
                    src={gallery[currentImage]}
                    alt="Tour"
                    style={{
                      ...styles.galleryMainImage,
                      height: isMobile ? 260 : 320,
                    }}
                  />
                </div>

                <div style={styles.galleryControls}>
                  <button
                    style={styles.galleryBtn}
                    onClick={() =>
                      setCurrentImage((prev) =>
                        prev === 0 ? gallery.length - 1 : prev - 1
                      )
                    }
                  >
                    ◀ Prev
                  </button>

                  <span style={styles.galleryCount}>
                    {currentImage + 1} / {gallery.length}
                  </span>

                  <button
                    style={styles.galleryBtn}
                    onClick={() =>
                      setCurrentImage((prev) =>
                        prev === gallery.length - 1 ? 0 : prev + 1
                      )
                    }
                  >
                    Next ▶
                  </button>
                </div>

                <div style={styles.galleryThumbs}>
                  {gallery.map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => setCurrentImage(idx)}
                      style={{
                        ...styles.galleryThumbItem,
                        border:
                          idx === currentImage
                            ? "2px solid #00ffb0"
                            : "1px solid rgba(255,255,255,0.12)",
                        boxShadow:
                          idx === currentImage
                            ? "0 0 0 3px rgba(0,255,176,0.12)"
                            : "none",
                      }}
                    >
                      <img src={img} alt={`thumb-${idx}`} style={styles.galleryThumbImg} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tour.video_url && (
              <div style={styles.card}>
                <div style={styles.sectionTop}>
                  <div style={styles.sectionTitle}>Video</div>
                  <div style={styles.sectionHint}>Tour preview</div>
                </div>

                <div style={styles.videoWrap}>
                  <video
                    src={tour.video_url}
                    controls
                    playsInline
                    preload="metadata"
                    style={{
                      ...styles.video,
                      height: isMobile ? 230 : 300,
                    }}
                  />
                </div>

                <div style={styles.videoHint}>🎬 Watch the mood before joining</div>
              </div>
            )}

            <div style={styles.card}>
              <div style={styles.sectionTop}>
                <div style={styles.sectionTitle}>Location on map</div>
                <div style={styles.sectionHint}>Plan your route.</div>
              </div>

              {tour.latitude && tour.longitude ? (
                <>
                  <div style={styles.mapWrap}>
                    <MapContainer
                      center={[tour.latitude, tour.longitude]}
                      zoom={12}
                      scrollWheelZoom={true}
                      style={{
                        height: isMobile ? "250px" : "310px",
                        width: "100%",
                      }}
                    >
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <Marker position={[tour.latitude, tour.longitude]} />
                    </MapContainer>
                  </div>

                  <div style={styles.coordChip}>
                    📌 {tour.latitude.toFixed(4)}, {tour.longitude.toFixed(4)}
                  </div>
                </>
              ) : (
                <p style={styles.emptySmallText}>
                  Location coordinates are not set for this tour.
                </p>
              )}
            </div>
          </div>

          <div style={styles.column}>
            <div style={styles.card}>
              <div style={styles.sectionTop}>
                <div style={styles.sectionTitle}>Your options</div>
                <div style={styles.sectionHint}>Fast actions, no clutter.</div>
              </div>

              {!isCreator && (
                <>
                  {!isJoined ? (
                    <button
                      style={{
                        ...styles.primaryBtn,
                        opacity: isFull ? 0.5 : 1,
                        cursor: isFull ? "default" : "pointer",
                      }}
                      disabled={isFull || loading}
                      onClick={joinTour}
                    >
                      {isFull
                        ? "Tour is full"
                        : training
                        ? "Join training"
                        : "Join tour"}
                    </button>
                  ) : (
                    <button
                      style={styles.secondaryBtn}
                      onClick={leaveTour}
                      disabled={loading}
                    >
                      Leave tour
                    </button>
                  )}

                  <button
                    style={styles.secondaryBtn}
                    onClick={toggleSave}
                    disabled={loading}
                  >
                    {isSaved ? "♥ Saved" : "♡ Save tour"}
                  </button>

                  {isJoined && (
                    <button
                      style={styles.secondaryBtn}
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
                    style={styles.secondaryBtn}
                    onClick={() => navigate(`/chat/${tour.id}`)}
                  >
                    Open group chat
                  </button>
                  <button
                    style={styles.secondaryBtn}
                    onClick={() => navigate(`/edit-tour/${tour.id}`)}
                  >
                    Edit tour
                  </button>
                  <button style={styles.dangerBtn} onClick={deleteTour}>
                    Delete tour
                  </button>
                </>
              )}
            </div>

            <div style={styles.card}>
              <div style={styles.sectionTop}>
                <div style={styles.sectionTitle}>Quick summary</div>
                <div style={styles.sectionHint}>The essentials in one place.</div>
              </div>

              <div
                style={{
                  ...styles.quickSummaryGrid,
                  gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                }}
              >
                <div style={styles.pill}>🏷️ {tour.title || "Tour title"}</div>
                <div style={styles.pill}>🧭 {tour.activity || "Activity not set"}</div>

                {creatorProfile && (
                  <div style={styles.pill}>
                    👤 Organizer:{" "}
                    <Link
                      to={`/profile/${creatorProfile.id}`}
                      style={styles.inlineLink}
                    >
                      {creatorProfile.full_name || "Organizer"}
                    </Link>
                  </div>
                )}

                {creatorProfile?.is_verified_creator && (
                  <div style={styles.pill}>✅ Verified creator</div>
                )}

                <div style={styles.pill}>
                  📍{" "}
                  {tour.location_name
                    ? `${tour.location_name}${tour.country ? ", " + tour.country : ""}`
                    : "Location not set"}
                </div>

                <div style={styles.pill}>
                  👥 {tour.participants || 0}/{tour.max_people} participants
                </div>

                <div style={styles.pill}>
                  💶 {tour.price ? `${tour.price} €` : "Free"}
                </div>

                <div style={styles.pill}>
                  🕒 {formatDate(tour.date_start)} → {formatDate(tour.date_end)}
                </div>

                {training && <div style={styles.pill}>🎓 Training mode</div>}
                {training && tour.skill_level && (
                  <div style={styles.pill}>
                    🎯 {String(tour.skill_level).replaceAll("_", " ")}
                  </div>
                )}
                {training && tour.training_language && (
                  <div style={styles.pill}>🗣 {tour.training_language}</div>
                )}
                {training && tour.duration_label && (
                  <div style={styles.pill}>⏱ {tour.duration_label}</div>
                )}
                {training && tour.equipment_included && (
                  <div style={styles.pill}>🧰 Equipment included</div>
                )}
                {training && tour.certificate_included && (
                  <div style={styles.pill}>📜 Certificate included</div>
                )}
              </div>

              <div style={styles.tipBox}>
                Tip: use the group chat to coordinate meeting points, gear and
                timing so everyone arrives relaxed and ready.
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.sectionTop}>
                <div style={styles.sectionTitle}>Participants</div>
                <div style={styles.sectionHint}>
                  {participantsList.length} joined so far
                </div>
              </div>

              {participantsList.length === 0 ? (
                <div style={styles.emptySmallText}>No participants yet</div>
              ) : (
                <div style={styles.participantsGrid}>
                  {participantsList.map((p, idx) => (
                    <Link
                      key={idx}
                      to={`/profile/${p.user_id}`}
                      style={{ textDecoration: "none", color: "inherit" }}
                    >
                      <div style={styles.participantRow}>
                        {p.profiles?.avatar_url ? (
                          <img
                            src={p.profiles.avatar_url}
                            alt=""
                            style={styles.participantAvatar}
                          />
                        ) : (
                          <div style={styles.participantFallback}>
                            {p.profiles?.full_name?.[0] || "U"}
                          </div>
                        )}

                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={styles.participantNameRow}>
                            <span style={styles.participantName}>
                              {p.profiles?.full_name || "User"}
                            </span>

                            {p.profiles?.is_verified_creator && (
                              <span style={styles.participantVerified}>
                                Verified
                              </span>
                            )}
                          </div>

                          <div style={styles.participantSub}>
                            Joined the adventure
                          </div>
                        </div>

                        <div style={styles.participantArrow}>Open →</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {isMobile && !isCreator && (
          <div style={styles.stickyBar}>
            <div style={styles.stickyTop}>
              <div style={{ minWidth: 0 }}>
                <div style={styles.stickyTitle}>{tour.title}</div>
                <div style={styles.stickySub}>
                  👥 {tour.participants || 0}/{tour.max_people} ·{" "}
                  {tour.price ? `${tour.price}€` : "Free"}
                </div>
              </div>

              <button onClick={toggleSave} style={styles.stickySaveBtn}>
                {isSaved ? "♥" : "♡"}
              </button>
            </div>

            {!isJoined ? (
              <button
                style={{
                  ...styles.primaryBtn,
                  marginBottom: 0,
                  opacity: isFull ? 0.5 : 1,
                  cursor: isFull ? "default" : "pointer",
                }}
                disabled={isFull || loading}
                onClick={joinTour}
              >
                {isFull ? "Tour is full" : training ? "Join training" : "Join tour"}
              </button>
            ) : (
              <div style={styles.stickyActionGrid}>
                <button
                  style={{ ...styles.secondaryBtn, marginBottom: 0 }}
                  onClick={leaveTour}
                  disabled={loading}
                >
                  Leave
                </button>

                <button
                  style={{ ...styles.primaryBtn, marginBottom: 0 }}
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

const styles = {
  loadingPage: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top, #071f16 0%, #020806 45%, #020405 100%)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    padding: 20,
  },

  loadingBox: {
    padding: "18px 24px",
    borderRadius: 18,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
    fontWeight: 800,
    letterSpacing: "0.04em",
  },

  page: {
    position: "relative",
    minHeight: "100vh",
    overflowX: "hidden",
    overflowY: "visible",
    background:
      "radial-gradient(circle at top, #081b16 0%, #04100d 28%, #02060b 58%, #000000 100%)",
    color: "#eafff5",
    fontFamily:
      'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },

  container: {
    position: "relative",
    zIndex: 2,
    maxWidth: 1400,
    margin: "0 auto",
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

  topBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
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
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.08)",
    background:
      "linear-gradient(145deg, rgba(10,24,19,0.94), rgba(3,10,8,0.98))",
    boxShadow:
      "0 30px 90px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.04)",
    marginBottom: 18,
  },

  heroImageWrap: {
    position: "relative",
    overflow: "hidden",
  },

  heroImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transform: "scale(1.04)",
    filter: "saturate(1.12) contrast(1.06)",
    display: "block",
  },

  heroOverlay: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(to top, rgba(2,8,6,1) 0%, rgba(2,8,6,0.96) 18%, rgba(2,8,6,0.70) 38%, rgba(2,8,6,0.18) 66%, rgba(2,8,6,0.08) 100%)",
  },

  heroShine: {
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(circle at 18% 16%, rgba(0,255,190,0.18), transparent 28%), radial-gradient(circle at 80% 12%, rgba(124,77,255,0.18), transparent 30%)",
    mixBlendMode: "screen",
    pointerEvents: "none",
  },

  heroTopBar: {
    position: "absolute",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
    flexWrap: "wrap",
    zIndex: 3,
  },

  heroTopRight: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },

  glassBtn: {
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
  },

  heroGlassTag: {
    padding: "7px 11px",
    borderRadius: 999,
    background: "rgba(0,0,0,0.42)",
    border: "1px solid rgba(255,255,255,0.12)",
    fontSize: 11,
    fontWeight: 800,
    backdropFilter: "blur(10px)",
    color: "#fff",
  },

  trainingHeroTag: {
    background: "rgba(124,77,255,0.18)",
    border: "1px solid rgba(170,130,255,0.34)",
    color: "#efe4ff",
  },

  heroContent: {
    position: "absolute",
    zIndex: 2,
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
  },

  heroTitle: {
    marginTop: 14,
    marginBottom: 0,
    lineHeight: 0.96,
    fontWeight: 1000,
    letterSpacing: "-0.04em",
    color: "#f4fff9",
    textShadow: "0 6px 28px rgba(0,255,190,0.12)",
  },

  heroSubtitle: {
    marginTop: 10,
    maxWidth: 680,
    color: "rgba(234,255,245,0.76)",
    fontSize: 14,
    lineHeight: 1.65,
    fontWeight: 700,
  },

  heroStatsGrid: {
    marginTop: 16,
    display: "grid",
    gap: 10,
  },

  heroStatCard: {
    borderRadius: 18,
    padding: "12px 12px",
    border: "1px solid rgba(255,255,255,0.08)",
    background:
      "linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.03))",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
    backdropFilter: "blur(10px)",
    textAlign: "center",
  },

  heroStatValue: {
    fontSize: 20,
    fontWeight: 1000,
    color: "#fff",
    lineHeight: 1.05,
  },

  heroStatLabel: {
    marginTop: 4,
    fontSize: 11,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "rgba(234,255,245,0.62)",
    fontWeight: 800,
  },

  layout: {
    display: "grid",
    alignItems: "start",
  },

  column: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },

  card: {
    borderRadius: 28,
    padding: 18,
    border: "1px solid rgba(255,255,255,0.08)",
    background:
      "linear-gradient(145deg, rgba(8,26,21,0.96), rgba(2,9,7,0.96))",
    backdropFilter: "blur(12px)",
    boxShadow:
      "0 20px 55px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.04)",
    overflow: "hidden",
  },

  sectionTop: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 10,
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

  microLabel: {
    fontSize: 12,
    opacity: 0.75,
    marginBottom: 8,
    color: "rgba(234,255,245,0.74)",
    fontWeight: 800,
  },

  organizerCard: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    background: "rgba(255,255,255,0.06)",
    padding: "10px 12px",
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "0 12px 28px rgba(0,0,0,0.22)",
  },

  organizerAvatar: {
    width: 42,
    height: 42,
    borderRadius: "50%",
    objectFit: "cover",
    border: "1px solid rgba(255,255,255,0.12)",
  },

  organizerNameRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },

  organizerName: {
    fontWeight: 900,
    fontSize: 14,
    color: "#fff",
  },

  organizerSub: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    color: "rgba(234,255,245,0.70)",
  },

  organizerArrow: {
    fontSize: 12,
    opacity: 0.72,
    fontWeight: 700,
    color: "rgba(234,255,245,0.72)",
  },

  verifiedBadge: {
    fontSize: 10,
    padding: "4px 8px",
    borderRadius: 999,
    background: "rgba(0,255,176,0.14)",
    border: "1px solid rgba(0,255,176,0.35)",
    color: "#9cffd8",
    fontWeight: 900,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
  },

  pillRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },

  pill: {
    fontSize: 12,
    padding: "9px 12px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.05)",
    boxShadow: "0 8px 18px rgba(0,0,0,0.18)",
    color: "rgba(240,255,245,0.90)",
    fontWeight: 800,
  },

  countdownAccent: {
    marginLeft: 6,
    color: "#00ffb0",
    fontWeight: 800,
  },

  bodyText: {
    fontSize: 14,
    lineHeight: 1.75,
    color: "rgba(240,255,245,0.92)",
    whiteSpace: "pre-line",
    margin: 0,
  },

  galleryMainWrap: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 12,
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "0 16px 38px rgba(0,0,0,0.32)",
  },

  galleryMainImage: {
    width: "100%",
    objectFit: "cover",
    display: "block",
  },

  galleryControls: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    gap: 10,
  },

  galleryBtn: {
    padding: "9px 14px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.58)",
    color: "white",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 700,
  },

  galleryCount: {
    fontSize: 12,
    opacity: 0.72,
    color: "rgba(234,255,245,0.72)",
    fontWeight: 800,
  },

  galleryThumbs: {
    display: "flex",
    gap: 8,
    overflowX: "auto",
    paddingBottom: 4,
  },

  galleryThumbItem: {
    flex: "0 0 76px",
    height: 66,
    borderRadius: 12,
    overflow: "hidden",
    cursor: "pointer",
  },

  galleryThumbImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  videoWrap: {
    borderRadius: 18,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.75)",
    boxShadow: "0 18px 50px rgba(0,0,0,0.50)",
  },

  video: {
    width: "100%",
    objectFit: "cover",
    backgroundColor: "black",
    display: "block",
  },

  videoHint: {
    marginTop: 8,
    fontSize: 11,
    opacity: 0.72,
    display: "flex",
    alignItems: "center",
    gap: 6,
    color: "rgba(234,255,245,0.72)",
    fontWeight: 700,
  },

  mapWrap: {
    marginTop: 10,
    borderRadius: 16,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "0 16px 40px rgba(0,0,0,0.34)",
  },

  coordChip: {
    marginTop: 10,
    fontSize: 12,
    color: "rgba(230,255,240,0.78)",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 14,
    padding: "10px 12px",
    width: "fit-content",
    fontWeight: 800,
  },

  emptySmallText: {
    fontSize: 13,
    opacity: 0.76,
    margin: 0,
    color: "rgba(234,255,245,0.76)",
    fontWeight: 700,
  },

  primaryBtn: {
    width: "100%",
    padding: "14px 14px",
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
    minHeight: 48,
    fontSize: 13,
  },

  secondaryBtn: {
    width: "100%",
    padding: "13px 12px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(255,255,255,0.05)",
    color: "white",
    fontWeight: 800,
    cursor: "pointer",
    marginBottom: 10,
    minHeight: 46,
    fontSize: 13,
  },

  dangerBtn: {
    width: "100%",
    padding: "13px 12px",
    borderRadius: 999,
    border: "none",
    background: "linear-gradient(135deg, #ff5d5d, #d92c2c)",
    color: "white",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 16px 36px rgba(255,64,64,0.16)",
    minHeight: 46,
    fontSize: 13,
  },

  quickSummaryGrid: {
    display: "grid",
    gap: 10,
  },

  inlineLink: {
    color: "#00ffb0",
    textDecoration: "none",
    fontWeight: 800,
  },

  tipBox: {
    marginTop: 16,
    fontSize: 12,
    opacity: 0.82,
    lineHeight: 1.6,
    padding: "12px 14px",
    borderRadius: 16,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "rgba(234,255,245,0.80)",
    fontWeight: 700,
  },

  participantsGrid: {
    display: "grid",
    gap: 10,
  },

  participantRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "rgba(255,255,255,0.06)",
    padding: "10px 12px",
    borderRadius: 18,
    cursor: "pointer",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 10px 24px rgba(0,0,0,0.18)",
  },

  participantAvatar: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    objectFit: "cover",
    border: "1px solid rgba(255,255,255,0.10)",
  },

  participantFallback: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #1abc9c, #00ffb0)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 13,
    fontWeight: 900,
    color: "#000",
  },

  participantNameRow: {
    fontSize: 13,
    fontWeight: 800,
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },

  participantName: {
    color: "#fff",
  },

  participantVerified: {
    fontSize: 10,
    padding: "3px 7px",
    borderRadius: 999,
    background: "rgba(0,255,176,0.12)",
    border: "1px solid rgba(0,255,176,0.28)",
    color: "#9cffd8",
    fontWeight: 900,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  },

  participantSub: {
    fontSize: 11,
    opacity: 0.66,
    marginTop: 2,
    color: "rgba(234,255,245,0.66)",
    fontWeight: 700,
  },

  participantArrow: {
    fontSize: 12,
    opacity: 0.65,
    color: "rgba(234,255,245,0.65)",
    fontWeight: 700,
  },

  stickyBar: {
    position: "fixed",
    left: 10,
    right: 10,
    bottom: "calc(72px + env(safe-area-inset-bottom))",
    zIndex: 40,
    borderRadius: 20,
    background: "rgba(4,12,9,0.88)",
    border: "1px solid rgba(255,255,255,0.08)",
    backdropFilter: "blur(16px)",
    boxShadow: "0 24px 60px rgba(0,0,0,0.42)",
    padding: 10,
  },

  stickyTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 8,
  },

  stickyTitle: {
    fontSize: 13,
    fontWeight: 900,
    color: "#fff",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  stickySub: {
    fontSize: 11,
    color: "rgba(230,255,240,0.75)",
    marginTop: 2,
    fontWeight: 700,
  },

  stickySaveBtn: {
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    borderRadius: 14,
    padding: "12px 14px",
    fontWeight: 800,
    minWidth: 68,
    cursor: "pointer",
  },

  stickyActionGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
  },
};