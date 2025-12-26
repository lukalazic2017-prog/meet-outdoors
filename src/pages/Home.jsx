// src/pages/Home.jsx
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

const VIDEO_SRC = "/media/video.mp4";

export default function Home() {
  const navigate = useNavigate();

  const [loaded, setLoaded] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [tours, setTours] = useState([]);
  const [events, setEvents] = useState([]);

  // --- Typewriter headline state (Welcome to -> MeetOutdoors) ---
  const [typedTop, setTypedTop] = useState("");
  const [typedBrand, setTypedBrand] = useState("");

  const TOP_TEXT = "Welcome to";
  const BRAND_TEXT = "MeetOutdoors";

  // ----------------- LOAD DATA + ANIMATIONS -----------------
  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 250);

    async function loadContent() {
      const { data: toursData } = await supabase
        .from("tours")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(12);

      const { data: eventsData } = await supabase
        .from("events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(8);

      setTours(toursData || []);
      setEvents(eventsData || []);
    }

    loadContent();
    return () => clearTimeout(t);
  }, []);

  // parallax scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY || window.pageYOffset || 0);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const heroParallax = scrollY * 0.18;

  // ----------------- TYPEWRITER (no emoji, instant glyphs) -----------------
  useEffect(() => {
    // reset on mount
    setTypedTop("");
    setTypedBrand("");

    let topI = 0;
    let brandI = 0;

    const topTimer = setInterval(() => {
      topI += 1;
      setTypedTop(TOP_TEXT.slice(0, topI));
      if (topI >= TOP_TEXT.length) {
        clearInterval(topTimer);

        // small pause, then brand
        setTimeout(() => {
          const brandTimer = setInterval(() => {
            brandI += 1;
            setTypedBrand(BRAND_TEXT.slice(0, brandI));
            if (brandI >= BRAND_TEXT.length) clearInterval(brandTimer);
          }, 55);
        }, 160);
      }
    }, 45);

    return () => {
      clearInterval(topTimer);
    };
  }, []);

  // ----------------- DERIVED LISTS -----------------
  const newTours = tours.slice(0, 4);
  const popularTours = tours.slice(4, 8);
  const trendingTours = tours.slice(8, 12);

  // ----------------- STYLES -----------------
  const styles = useMemo(() => {
    const isMobile =
      typeof window !== "undefined" ? window.innerWidth <= 520 : false;

    return {
      page: {
        position: "relative",
        minHeight: "100vh",
        overflowX: "hidden",
        color: "white",
        fontFamily: "Inter, system-ui",
        zIndex: 1,
      },

      bgVideo: {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        zIndex: -2,
      },

      overlay: {
        position: "fixed",
        inset: 0,
        background:
          "radial-gradient(circle at 20% 10%, rgba(0,255,186,0.14), rgba(0,0,0,0.0) 55%), linear-gradient(to bottom, rgba(0,0,0,0.35), rgba(0,0,0,0.92))",
        backdropFilter: "blur(4px)",
        zIndex: -1,
      },

      hero: {
        padding: isMobile ? "120px 18px 120px" : "150px 20px 140px",
        maxWidth: 1150,
        margin: "0 auto",
        textAlign: "left",
        opacity: loaded ? 1 : 0,
        transform: loaded
          ? `translateY(${heroParallax * 0.3}px)`
          : "translateY(24px)",
        transition: "opacity 0.9s ease, transform 0.9s ease",
      },

      heroPill: {
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 14px",
        borderRadius: 999,
        border: "1px solid rgba(0,255,176,0.35)",
        background: "rgba(0,0,0,0.55)",
        fontSize: 12,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: "rgba(210,255,240,0.9)",
        marginBottom: 16,
        boxShadow: "0 0 18px rgba(0,255,176,0.3)",
      },

      // NEW: Welcome + Brand block
      welcomeWrap: {
        marginBottom: 14,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      },

      welcomeTop: {
        fontSize: isMobile ? 16 : 18,
        fontWeight: 800,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: "rgba(220,255,245,0.92)",
        textShadow: "0 10px 26px rgba(0,0,0,0.85)",
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
      },

      smallSpark: {
        width: 10,
        height: 10,
        borderRadius: 999,
        background: "rgba(0,255,186,0.9)",
        boxShadow: "0 0 18px rgba(0,255,186,0.85)",
        flex: "0 0 auto",
      },

      brandRow: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
      },

      brandMark: {
        width: isMobile ? 44 : 52,
        height: isMobile ? 44 : 52,
        borderRadius: 16,
        background:
          "linear-gradient(145deg, rgba(0,255,186,0.35), rgba(0,209,255,0.18), rgba(255,255,255,0.08))",
        border: "1px solid rgba(255,255,255,0.18)",
        boxShadow:
          "0 0 26px rgba(0,255,186,0.28), 0 18px 55px rgba(0,0,0,0.75)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flex: "0 0 auto",
        position: "relative",
        overflow: "hidden",
      },

      // Simple "tree" mark without emoji/SVGs that might load late
      treeGlyph: {
        fontSize: isMobile ? 18 : 20,
        fontWeight: 900,
        letterSpacing: "0.02em",
        color: "rgba(235,255,250,0.95)",
        textShadow: "0 8px 16px rgba(0,0,0,0.55)",
        transform: "translateY(-1px)",
      },

      title: {
        fontSize: isMobile ? 44 : 60,
        fontWeight: 950,
        lineHeight: 1.02,
        marginBottom: 14,
        background:
          "linear-gradient(100deg, #f6fff9, #a9ffe4, #38ffd0, #a7ffe2)",
        WebkitBackgroundClip: "text",
        color: "transparent",
        textShadow: "0 16px 50px rgba(0,0,0,0.9)",
      },

      subtitle: {
        fontSize: isMobile ? 16 : 20,
        maxWidth: 680,
        opacity: 0.92,
        marginBottom: 26,
        textShadow: "0 8px 28px rgba(0,0,0,0.85)",
        lineHeight: 1.55,
      },

      heroMetaRow: {
        display: "flex",
        flexWrap: "wrap",
        gap: 12,
        fontSize: 13,
        color: "rgba(220,245,238,0.9)",
        marginTop: 6,
      },

      metaTag: {
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "7px 11px",
        borderRadius: 999,
        background: "rgba(0,0,0,0.6)",
        border: "1px solid rgba(255,255,255,0.16)",
        backdropFilter: "blur(10px)",
      },

      ctaRow: {
        display: "flex",
        flexWrap: "wrap",
        gap: 14,
        marginTop: 22,
      },

      buttonPrimary: {
        padding: "14px 28px",
        borderRadius: 30,
        background: "linear-gradient(130deg, #00ffba, #00c48c, #007f5f)",
        color: "#002a1d",
        fontWeight: 900,
        cursor: "pointer",
        fontSize: 16,
        boxShadow:
          "0 0 26px rgba(0,255,200,0.55), 0 14px 45px rgba(0,0,0,0.85)",
        border: "none",
        transition: "transform 0.16s ease, box-shadow 0.16s ease",
      },

      buttonGhost: {
        padding: "14px 24px",
        borderRadius: 30,
        border: "1px solid rgba(255,255,255,0.48)",
        background: "rgba(0,0,0,0.45)",
        cursor: "pointer",
        fontSize: 14,
        fontWeight: 700,
        backdropFilter: "blur(5px)",
        color: "white",
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        transition: "transform 0.16s ease, background 0.16s ease",
      },

      sectionWrapper: {
        maxWidth: 1200,
        margin: "0 auto",
        padding: "18px 20px 60px",
      },

      sectionHeaderRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        gap: 16,
        marginBottom: 18,
        marginTop: 8,
      },

      sectionTitleBlock: {
        display: "flex",
        flexDirection: "column",
        gap: 4,
      },

      sectionTitle: {
        fontSize: 24,
        fontWeight: 850,
        textShadow: "0 4px 14px rgba(0,0,0,0.8)",
        display: "flex",
        alignItems: "center",
        gap: 10,
      },

      sectionTag: {
        fontSize: 11,
        textTransform: "uppercase",
        letterSpacing: "0.22em",
        color: "rgba(180,220,210,0.8)",
      },

      seeAll: {
        fontSize: 13,
        color: "#a9ffe4",
        cursor: "pointer",
        opacity: 0.9,
      },

      grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))",
        gap: 20,
      },

      card: {
        position: "relative",
        borderRadius: 20,
        overflow: "hidden",
        background:
          "linear-gradient(145deg, rgba(0,0,0,0.75), rgba(0,22,18,0.98))",
        border: "1px solid rgba(255,255,255,0.12)",
        backdropFilter: "blur(12px)",
        cursor: "pointer",
        transition:
          "transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease",
        boxShadow: "0 18px 40px rgba(0,0,0,0.85)",
      },

      cardMediaWrapper: {
        position: "relative",
        width: "100%",
        height: 180,
        overflow: "hidden",
      },

      cardImg: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        transform: "scale(1.02)",
        transition: "transform 0.4s ease, opacity 0.4s ease",
      },

      cardGradientTop: {
        position: "absolute",
        inset: 0,
        background:
          "linear-gradient(to bottom, rgba(0,0,0,0.15), rgba(0,0,0,0.55))",
      },

      cardGradientBottom: {
        position: "absolute",
        inset: 0,
        background:
          "linear-gradient(to top, rgba(0,0,0,0.95), rgba(0,0,0,0.0))",
      },

      cardTopRow: {
        position: "absolute",
        top: 10,
        left: 10,
        right: 10,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: 11,
      },

      badge: {
        padding: "5px 10px",
        borderRadius: 999,
        background:
          "radial-gradient(circle at 0% 0%, #00ffba, #00b383, #003828)",
        color: "#002015",
        fontWeight: 800,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        boxShadow: "0 0 16px rgba(0,255,184,0.75)",
      },

      priceTag: {
        padding: "5px 10px",
        borderRadius: 999,
        background: "rgba(0,0,0,0.7)",
        border: "1px solid rgba(255,255,255,0.55)",
        color: "rgba(245,255,250,0.95)",
        fontWeight: 700,
      },

      cardBody: {
        padding: 14,
      },

      cardTitle: {
        fontSize: 17,
        fontWeight: 850,
        marginBottom: 6,
      },

      cardLocationRow: {
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontSize: 13,
        color: "rgba(215,235,230,0.9)",
        marginBottom: 10,
      },

      cardMetaRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: 12,
        color: "rgba(200,225,220,0.85)",
      },

      chipRow: {
        display: "flex",
        gap: 6,
        flexWrap: "wrap",
      },

      chip: {
        padding: "4px 8px",
        borderRadius: 999,
        background: "rgba(0,0,0,0.7)",
        border: "1px solid rgba(255,255,255,0.16)",
      },

      footerSpace: {
        height: 120,
      },

      // caret cursor for typewriter
      caret: {
        display: "inline-block",
        width: 10,
        marginLeft: 2,
        opacity: 0.9,
        animation: "blink 1s steps(1) infinite",
      },
    };
  }, [loaded, heroParallax]);

  // ----------------- HELPERS -----------------
  const getActivityLabel = (t) =>
    t.activity_type || t.category || t.type || (t.is_event ? "Event" : "Adventure");

  const getLocationLabel = (t) =>
    t.location ||
    t.location_name ||
    [t.city, t.country].filter(Boolean).join(", ") ||
    "Unknown location";

  const getPriceLabel = (t) => {
    if (t.price === 0) return "Free";
    if (!t.price) return "Flexible price";
    return `${t.price} €`;
  };

  const cardHoverStyle = {
    transform: "translateY(-6px) scale(1.01)",
    boxShadow: "0 26px 55px rgba(0,0,0,0.95), 0 0 0 1px rgba(0,255,184,0.25)",
    borderColor: "rgba(0,255,184,0.7)",
  };

  // ---------------------------------------------------------
  // RENDER PAGE
  // ---------------------------------------------------------
  return (
    <>
      {/* Inline keyframes (no external css needed) */}
      <style>{`
        @keyframes blink { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }
      `}</style>

      {/* BACKGROUND VIDEO */}
      <video src={VIDEO_SRC} autoPlay muted loop playsInline style={styles.bgVideo} />
      <div style={styles.overlay}></div>

      {/* PAGE CONTENT */}
      <div style={styles.page}>
        {/* HERO SECTION */}
        <div style={styles.hero}>
          <div style={styles.heroPill}>
            <span>★</span>
            <span>MEET NEW PEOPLE OUTSIDE, NOT ONLINE</span>
          </div>

          {/* NEW: Welcome + MeetOutdoors (typewriter) */}
          <div style={styles.welcomeWrap}>
            <div style={styles.welcomeTop}>
              <span style={styles.smallSpark} />
              <span>
                {typedTop}
                {typedTop.length < TOP_TEXT.length && <span style={styles.caret}>|</span>}
              </span>
            </div>

            <div style={styles.brandRow}>
              <div style={styles.brandMark} aria-hidden>
                <span style={styles.treeGlyph}>▲</span>
              </div>

              <h1 style={{ ...styles.title, marginBottom: 0 }}>
                {typedBrand}
                {typedTop.length >= TOP_TEXT.length && typedBrand.length < BRAND_TEXT.length && (
                  <span style={styles.caret}>|</span>
                )}
              </h1>
            </div>
          </div>

          <div style={styles.subtitle}>
            Join curated hiking, camping, rafting and city escape tours with real people — not
            fake profiles. Pick your activity, grab your backpack and meet outdoors.
          </div>

          <div style={styles.heroMetaRow}>
            <div style={styles.metaTag}>🏔️ <span>Verified guides</span></div>
            <div style={styles.metaTag}>🤝 <span>Small friendly groups</span></div>
            <div style={styles.metaTag}>🌍 <span>Local & international tours</span></div>
          </div>

          <div style={styles.ctaRow}>
            <button
              style={styles.buttonPrimary}
              onClick={() => navigate("/tours")}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
                e.currentTarget.style.boxShadow =
                  "0 0 36px rgba(0,255,200,0.75), 0 18px 55px rgba(0,0,0,1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0) scale(1)";
                e.currentTarget.style.boxShadow =
                  "0 0 26px rgba(0,255,200,0.55), 0 14px 45px rgba(0,0,0,0.85)";
              }}
            >
              Explore tours
            </button>

            <button
              style={styles.buttonGhost}
              onClick={() => navigate("/events")}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.background = "rgba(0,0,0,0.7)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.background = "rgba(0,0,0,0.45)";
              }}
            >
              <span>See upcoming events</span>
              <span style={{ fontSize: 18 }}>➜</span>
            </button>
          </div>
        </div>

        {/* NEW ADVENTURES */}
        {newTours.length > 0 && (
          <section style={styles.sectionWrapper}>
            <div style={styles.sectionHeaderRow}>
              <div style={styles.sectionTitleBlock}>
                <div style={styles.sectionTag}>New</div>
                <div style={styles.sectionTitle}>
                  Fresh adventures <span style={{ fontSize: 16, opacity: 0.7 }}>✨</span>
                </div>
              </div>
              <div style={styles.seeAll} onClick={() => navigate("/tours")}>
                View all tours →
              </div>
            </div>

            <div style={styles.grid}>
              {newTours.map((t) => (
                <div
                  key={t.id}
                  style={styles.card}
                  onClick={() => navigate(`/tour/${t.id}`)}
                  onMouseEnter={(e) => Object.assign(e.currentTarget.style, cardHoverStyle)}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0px) scale(1)";
                    e.currentTarget.style.boxShadow = "0 18px 40px rgba(0,0,0,0.85)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                  }}
                >
                  <div style={styles.cardMediaWrapper}>
                    <img
                      src={
                        t.cover_url ||
                        "https://images.pexels.com/photos/3324422/pexels-photo-3324422.jpeg"
                      }
                      alt={t.title}
                      style={styles.cardImg}
                    />
                    <div style={styles.cardGradientTop} />
                    <div style={styles.cardGradientBottom} />

                    <div style={styles.cardTopRow}>
                      <div style={styles.badge}>{getActivityLabel(t)}</div>
                      <div style={styles.priceTag}>{getPriceLabel(t)}</div>
                    </div>
                  </div>

                  <div style={styles.cardBody}>
                    <div style={styles.cardTitle}>{t.title}</div>

                    <div style={styles.cardLocationRow}>
                      <span>📍</span>
                      <span>{getLocationLabel(t)}</span>
                    </div>

                    <div style={styles.cardMetaRow}>
                      <div style={styles.chipRow}>
                        <span style={styles.chip}>{t.difficulty || "All levels"}</span>
                        <span style={styles.chip}>{t.duration || "1–3 days"}</span>
                      </div>
                      <span>👥 {t.max_people || t.capacity || "Small group"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* POPULAR RIGHT NOW */}
        {popularTours.length > 0 && (
          <section style={styles.sectionWrapper}>
            <div style={styles.sectionHeaderRow}>
              <div style={styles.sectionTitleBlock}>
                <div style={styles.sectionTag}>Popular</div>
                <div style={styles.sectionTitle}>
                  Popular right now <span style={{ fontSize: 16, opacity: 0.7 }}>🔥</span>
                </div>
              </div>
              <div style={styles.seeAll} onClick={() => navigate("/tours?sort=popular")}>
                See popular tours →
              </div>
            </div>

            <div style={styles.grid}>
              {popularTours.map((t) => (
                <div
                  key={t.id}
                  style={styles.card}
                  onClick={() => navigate(`/tour/${t.id}`)}
                  onMouseEnter={(e) => Object.assign(e.currentTarget.style, cardHoverStyle)}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0px) scale(1)";
                    e.currentTarget.style.boxShadow = "0 18px 40px rgba(0,0,0,0.85)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                  }}
                >
                  <div style={styles.cardMediaWrapper}>
                    <img
                      src={
                        t.cover_url ||
                        "https://images.pexels.com/photos/414171/pexels-photo-414171.jpeg"
                      }
                      alt={t.title}
                      style={styles.cardImg}
                    />
                    <div style={styles.cardGradientTop} />
                    <div style={styles.cardGradientBottom} />

                    <div style={styles.cardTopRow}>
                      <div style={styles.badge}>{getActivityLabel(t)}</div>
                      <div style={styles.priceTag}>{getPriceLabel(t)}</div>
                    </div>
                  </div>

                  <div style={styles.cardBody}>
                    <div style={styles.cardTitle}>{t.title}</div>

                    <div style={styles.cardLocationRow}>
                      <span>📍</span>
                      <span>{getLocationLabel(t)}</span>
                    </div>

                    <div style={styles.cardMetaRow}>
                      <div style={styles.chipRow}>
                        <span style={styles.chip}>{t.difficulty || "Moderate"}</span>
                        <span style={styles.chip}>{t.duration || "Weekend"}</span>
                      </div>
                      <span>⭐ {t.rating || "4.8+"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* TRENDING THIS WEEK */}
        {trendingTours.length > 0 && (
          <section style={styles.sectionWrapper}>
            <div style={styles.sectionHeaderRow}>
              <div style={styles.sectionTitleBlock}>
                <div style={styles.sectionTag}>Trending</div>
                <div style={styles.sectionTitle}>
                  Trending this week <span style={{ fontSize: 16, opacity: 0.7 }}>📈</span>
                </div>
              </div>
              <div style={styles.seeAll} onClick={() => navigate("/tours?sort=trending")}>
                Explore trending →
              </div>
            </div>

            <div style={styles.grid}>
              {trendingTours.map((t) => (
                <div
                  key={t.id}
                  style={styles.card}
                  onClick={() => navigate(`/tour/${t.id}`)}
                  onMouseEnter={(e) => Object.assign(e.currentTarget.style, cardHoverStyle)}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0px) scale(1)";
                    e.currentTarget.style.boxShadow = "0 18px 40px rgba(0,0,0,0.85)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                  }}
                >
                  <div style={styles.cardMediaWrapper}>
                    <img
                      src={
                        t.cover_url ||
                        "https://images.pexels.com/photos/2398220/pexels-photo-2398220.jpeg"
                      }
                      alt={t.title}
                      style={styles.cardImg}
                    />
                    <div style={styles.cardGradientTop} />
                    <div style={styles.cardGradientBottom} />

                    <div style={styles.cardTopRow}>
                      <div style={styles.badge}>{getActivityLabel(t)}</div>
                      <div style={styles.priceTag}>{getPriceLabel(t)}</div>
                    </div>
                  </div>

                  <div style={styles.cardBody}>
                    <div style={styles.cardTitle}>{t.title}</div>

                    <div style={styles.cardLocationRow}>
                      <span>📍</span>
                      <span>{getLocationLabel(t)}</span>
                    </div>

                    <div style={styles.cardMetaRow}>
                      <div style={styles.chipRow}>
                        <span style={styles.chip}>{t.difficulty || "Easy / Chill"}</span>
                        <span style={styles.chip}>{t.duration || "Day trip"}</span>
                      </div>
                      <span>💬 {t.joined_count || t.spots_taken || 12}+ joined</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* EVENTS SECTION */}
        {events.length > 0 && (
          <section style={styles.sectionWrapper}>
            <div style={styles.sectionHeaderRow}>
              <div style={styles.sectionTitleBlock}>
                <div style={styles.sectionTag}>Events</div>
                <div style={styles.sectionTitle}>
                  Upcoming events <span style={{ fontSize: 16, opacity: 0.7 }}>📅</span>
                </div>
              </div>
              <div style={styles.seeAll} onClick={() => navigate("/events")}>
                See all events →
              </div>
            </div>

            <div style={styles.grid}>
              {events.map((e) => (
                <div
                  key={e.id}
                  style={styles.card}
                  onClick={() => navigate(`/event/${e.id}`)}
                  onMouseEnter={(eDom) =>
                    Object.assign(eDom.currentTarget.style, cardHoverStyle)
                  }
                  onMouseLeave={(eDom) => {
                    eDom.currentTarget.style.transform = "translateY(0px) scale(1)";
                    eDom.currentTarget.style.boxShadow = "0 18px 40px rgba(0,0,0,0.85)";
                    eDom.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                  }}
                >
                  <div style={styles.cardMediaWrapper}>
                    <img
                      src={
                        e.cover_url ||
                        "https://images.pexels.com/photos/1761279/pexels-photo-1761279.jpeg"
                      }
                      alt={e.title}
                      style={styles.cardImg}
                    />
                    <div style={styles.cardGradientTop} />
                    <div style={styles.cardGradientBottom} />

                    <div style={styles.cardTopRow}>
                      <div style={styles.badge}>{e.category || "Event"}</div>
                      <div style={styles.priceTag}>{getPriceLabel(e)}</div>
                    </div>
                  </div>

                  <div style={styles.cardBody}>
                    <div style={styles.cardTitle}>{e.title}</div>

                    <div style={styles.cardLocationRow}>
                      <span>📍</span>
                      <span>
                        {e.location_name ||
                          [e.city, e.country].filter(Boolean).join(", ") ||
                          "Location TBA"}
                      </span>
                    </div>

                    <div style={styles.cardMetaRow}>
                      <div style={styles.chipRow}>
                        <span style={styles.chip}>
                          {e.start_date
                            ? new Date(e.start_date).toLocaleDateString()
                            : "Date soon"}
                        </span>
                        <span style={styles.chip}>{e.time || "Time TBA"}</span>
                      </div>
                      <span>👥 {e.capacity || "Limited spots"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <div style={styles.footerSpace}></div>
      </div>
    </>
  );
}