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

  const [typedTop, setTypedTop] = useState("");
  const [typedBrand, setTypedBrand] = useState("");

  const TOP_TEXT = "Welcome to";
  const BRAND_TEXT = "MeetOutdoors";

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

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY || window.pageYOffset || 0);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const heroParallax = scrollY * 0.18;

  useEffect(() => {
    setTypedTop("");
    setTypedBrand("");

    let topI = 0;
    let brandI = 0;
    let brandTimer = null;

    const topTimer = setInterval(() => {
      topI += 1;
      setTypedTop(TOP_TEXT.slice(0, topI));

      if (topI >= TOP_TEXT.length) {
        clearInterval(topTimer);

        setTimeout(() => {
          brandTimer = setInterval(() => {
            brandI += 1;
            setTypedBrand(BRAND_TEXT.slice(0, brandI));
            if (brandI >= BRAND_TEXT.length) clearInterval(brandTimer);
          }, 55);
        }, 160);
      }
    }, 45);

    return () => {
      clearInterval(topTimer);
      if (brandTimer) clearInterval(brandTimer);
    };
  }, []);

  const newTours = tours.slice(0, 4);
  const popularTours = tours.slice(4, 8);
  const trendingTours = tours.slice(8, 12);

  const isMobile =
    typeof window !== "undefined" ? window.innerWidth <= 768 : false;

  const styles = useMemo(() => {
    return {
      page: {
        position: "relative",
        minHeight: "100vh",
        overflowX: "hidden",
        color: "white",
        fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
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
        background: isMobile
          ? "linear-gradient(to bottom, rgba(0,0,0,0.20), rgba(0,0,0,0.78) 45%, rgba(0,0,0,0.96) 100%)"
          : "radial-gradient(circle at 20% 10%, rgba(0,255,186,0.14), rgba(0,0,0,0.0) 55%), linear-gradient(to bottom, rgba(0,0,0,0.35), rgba(0,0,0,0.92))",
        backdropFilter: isMobile ? "blur(5px)" : "blur(4px)",
        zIndex: -1,
      },

      hero: {
        padding: isMobile ? "88px 16px 46px" : "150px 20px 140px",
        maxWidth: 1150,
        margin: "0 auto",
        textAlign: "left",
        opacity: loaded ? 1 : 0,
        transform: loaded
          ? `translateY(${isMobile ? 0 : heroParallax * 0.3}px)`
          : "translateY(24px)",
        transition: "opacity 0.9s ease, transform 0.9s ease",
      },

      heroInner: {
        maxWidth: isMobile ? "100%" : 760,
        padding: isMobile ? "0" : "0",
      },

      heroPill: {
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: isMobile ? "7px 12px" : "6px 14px",
        borderRadius: 999,
        border: "1px solid rgba(0,255,176,0.30)",
        background: "rgba(0,0,0,0.46)",
        fontSize: isMobile ? 10 : 12,
        letterSpacing: isMobile ? "0.10em" : "0.16em",
        textTransform: "uppercase",
        color: "rgba(210,255,240,0.9)",
        marginBottom: isMobile ? 14 : 16,
        boxShadow: "0 0 18px rgba(0,255,176,0.22)",
        fontWeight: 800,
      },

      welcomeWrap: {
        marginBottom: isMobile ? 12 : 14,
        display: "flex",
        flexDirection: "column",
        gap: isMobile ? 8 : 10,
      },

      welcomeTop: {
        fontSize: isMobile ? 13 : 18,
        fontWeight: 800,
        letterSpacing: isMobile ? "0.12em" : "0.16em",
        textTransform: "uppercase",
        color: "rgba(220,255,245,0.92)",
        textShadow: "0 10px 26px rgba(0,0,0,0.85)",
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
      },

      smallSpark: {
        width: isMobile ? 8 : 10,
        height: isMobile ? 8 : 10,
        borderRadius: 999,
        background: "rgba(0,255,186,0.9)",
        boxShadow: "0 0 18px rgba(0,255,186,0.85)",
        flex: "0 0 auto",
      },

      brandRow: {
        display: "flex",
        alignItems: "center",
        gap: isMobile ? 10 : 12,
        flexWrap: "wrap",
      },

      brandMark: {
        width: isMobile ? 42 : 52,
        height: isMobile ? 42 : 52,
        borderRadius: isMobile ? 14 : 16,
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

      treeGlyph: {
        fontSize: isMobile ? 17 : 20,
        fontWeight: 900,
        letterSpacing: "0.02em",
        color: "rgba(235,255,250,0.95)",
        textShadow: "0 8px 16px rgba(0,0,0,0.55)",
        transform: "translateY(-1px)",
      },

      title: {
        fontSize: isMobile ? 38 : 60,
        fontWeight: 950,
        lineHeight: isMobile ? 0.98 : 1.02,
        marginBottom: 14,
        background:
          "linear-gradient(100deg, #f6fff9, #a9ffe4, #38ffd0, #a7ffe2)",
        WebkitBackgroundClip: "text",
        color: "transparent",
        textShadow: "0 16px 50px rgba(0,0,0,0.9)",
      },

      subtitle: {
        fontSize: isMobile ? 15 : 20,
        maxWidth: isMobile ? "100%" : 680,
        opacity: 0.92,
        marginBottom: isMobile ? 18 : 26,
        textShadow: "0 8px 28px rgba(0,0,0,0.85)",
        lineHeight: isMobile ? 1.5 : 1.55,
      },

      heroMetaRow: {
        display: "flex",
        flexWrap: "wrap",
        gap: isMobile ? 8 : 12,
        fontSize: isMobile ? 11 : 13,
        color: "rgba(220,245,238,0.9)",
        marginTop: 6,
      },

      metaTag: {
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: isMobile ? "7px 10px" : "7px 11px",
        borderRadius: 999,
        background: "rgba(0,0,0,0.52)",
        border: "1px solid rgba(255,255,255,0.14)",
        backdropFilter: "blur(10px)",
      },

      ctaRow: {
        display: "flex",
        flexWrap: isMobile ? "nowrap" : "wrap",
        gap: 12,
        marginTop: isMobile ? 18 : 22,
        flexDirection: isMobile ? "column" : "row",
      },

      buttonPrimary: {
        padding: isMobile ? "15px 18px" : "14px 28px",
        borderRadius: 30,
        background: "linear-gradient(130deg, #00ffba, #00c48c, #007f5f)",
        color: "#002a1d",
        fontWeight: 900,
        cursor: "pointer",
        fontSize: isMobile ? 15 : 16,
        boxShadow:
          "0 0 26px rgba(0,255,200,0.55), 0 14px 45px rgba(0,0,0,0.85)",
        border: "none",
        transition: "transform 0.16s ease, box-shadow 0.16s ease",
        width: isMobile ? "100%" : "auto",
      },

      buttonGhost: {
        padding: isMobile ? "14px 18px" : "14px 24px",
        borderRadius: 30,
        border: "1px solid rgba(255,255,255,0.26)",
        background: "rgba(0,0,0,0.45)",
        cursor: "pointer",
        fontSize: isMobile ? 14 : 14,
        fontWeight: 700,
        backdropFilter: "blur(5px)",
        color: "white",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        transition: "transform 0.16s ease, background 0.16s ease",
        width: isMobile ? "100%" : "auto",
      },

      sectionWrapper: {
        maxWidth: 1200,
        margin: "0 auto",
        padding: isMobile ? "6px 16px 26px" : "18px 20px 60px",
      },

      sectionHeaderRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        gap: 16,
        marginBottom: isMobile ? 12 : 18,
        marginTop: 8,
      },

      sectionTitleBlock: {
        display: "flex",
        flexDirection: "column",
        gap: 4,
      },

      sectionTitle: {
        fontSize: isMobile ? 20 : 24,
        fontWeight: 850,
        textShadow: "0 4px 14px rgba(0,0,0,0.8)",
        display: "flex",
        alignItems: "center",
        gap: 10,
      },

      sectionTag: {
        fontSize: isMobile ? 10 : 11,
        textTransform: "uppercase",
        letterSpacing: isMobile ? "0.16em" : "0.22em",
        color: "rgba(180,220,210,0.8)",
        fontWeight: 800,
      },

      seeAll: {
        fontSize: isMobile ? 12 : 13,
        color: "#a9ffe4",
        cursor: "pointer",
        opacity: 0.9,
        whiteSpace: "nowrap",
      },

      grid: {
        display: isMobile ? "flex" : "grid",
        gridTemplateColumns: isMobile
          ? undefined
          : "repeat(auto-fill, minmax(270px, 1fr))",
        gap: 16,
        overflowX: isMobile ? "auto" : "visible",
        paddingBottom: isMobile ? 6 : 0,
        scrollSnapType: isMobile ? "x mandatory" : "none",
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
        minWidth: isMobile ? "82vw" : "auto",
        flex: isMobile ? "0 0 82vw" : "unset",
        scrollSnapAlign: isMobile ? "start" : "none",
      },

      cardMediaWrapper: {
        position: "relative",
        width: "100%",
        height: isMobile ? 165 : 180,
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
        gap: 8,
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
        fontSize: isMobile ? 10 : 11,
      },

      priceTag: {
        padding: "5px 10px",
        borderRadius: 999,
        background: "rgba(0,0,0,0.7)",
        border: "1px solid rgba(255,255,255,0.35)",
        color: "rgba(245,255,250,0.95)",
        fontWeight: 700,
        fontSize: isMobile ? 10 : 11,
      },

      cardBody: {
        padding: isMobile ? 13 : 14,
      },

      cardTitle: {
        fontSize: isMobile ? 16 : 17,
        fontWeight: 850,
        marginBottom: 6,
      },

      cardLocationRow: {
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontSize: isMobile ? 12 : 13,
        color: "rgba(215,235,230,0.9)",
        marginBottom: 10,
      },

      cardMetaRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: isMobile ? 11 : 12,
        color: "rgba(200,225,220,0.85)",
        gap: 10,
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
        height: isMobile ? 90 : 120,
      },

      caret: {
        display: "inline-block",
        width: 10,
        marginLeft: 2,
        opacity: 0.9,
        animation: "blink 1s steps(1) infinite",
      },
    };
  }, [loaded, heroParallax, isMobile]);

  const getActivityLabel = (t) =>
    t.activity_type || t.category || t.type || (t.is_event ? "Event" : "Adventure");

  const getLocationLabel = (t) =>
    t.location ||
    t.location_name ||
    [t.city, t.country].filter(Boolean).join(", ") ||
    "Unknown location";

  const getPriceLabel = (t) => {
    if (t.price === 0 || t.price_from === 0 || t.is_free) return "Free";
    if (t.price) return `${t.price} €`;
    if (t.price_from) return `${t.price_from} €`;
    return "Flexible";
  };

  const cardHoverStyle = {
    transform: "translateY(-6px) scale(1.01)",
    boxShadow: "0 26px 55px rgba(0,0,0,0.95), 0 0 0 1px rgba(0,255,184,0.25)",
    borderColor: "rgba(0,255,184,0.7)",
  };

  const renderTourCard = (t) => (
    <div
      key={t.id}
      style={styles.card}
      onClick={() => navigate(`/tour/${t.id}`)}
      onMouseEnter={(e) => {
        if (!isMobile) Object.assign(e.currentTarget.style, cardHoverStyle);
      }}
      onMouseLeave={(e) => {
        if (!isMobile) {
          e.currentTarget.style.transform = "translateY(0px) scale(1)";
          e.currentTarget.style.boxShadow = "0 18px 40px rgba(0,0,0,0.85)";
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
        }
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
  );

  const renderEventCard = (e) => (
    <div
      key={e.id}
      style={styles.card}
      onClick={() => navigate(`/event/${e.id}`)}
      onMouseEnter={(eDom) => {
        if (!isMobile) Object.assign(eDom.currentTarget.style, cardHoverStyle);
      }}
      onMouseLeave={(eDom) => {
        if (!isMobile) {
          eDom.currentTarget.style.transform = "translateY(0px) scale(1)";
          eDom.currentTarget.style.boxShadow = "0 18px 40px rgba(0,0,0,0.85)";
          eDom.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
        }
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
  );

  return (
    <>
      <style>{`
        @keyframes blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }

        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      <video src={VIDEO_SRC} autoPlay muted loop playsInline style={styles.bgVideo} />
      <div style={styles.overlay}></div>

      <div style={styles.page}>
        <div style={styles.hero}>
          <div style={styles.heroInner}>
            <div style={styles.heroPill}>
              <span>★</span>
              <span>MEET NEW PEOPLE OUTSIDE</span>
            </div>

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
              Join hiking, camping, rafting and city escape tours with real people.
              Pick your activity, grab your backpack and meet outdoors.
            </div>

            <div style={styles.heroMetaRow}>
              <div style={styles.metaTag}>🏔️ <span>Verified guides</span></div>
              <div style={styles.metaTag}>🤝 <span>Friendly groups</span></div>
              <div style={styles.metaTag}>🌍 <span>Outdoor community</span></div>
            </div>

            <div style={styles.ctaRow}>
              <button
                style={styles.buttonPrimary}
                onClick={() => navigate("/tours")}
                onMouseEnter={(e) => {
                  if (!isMobile) {
                    e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
                    e.currentTarget.style.boxShadow =
                      "0 0 36px rgba(0,255,200,0.75), 0 18px 55px rgba(0,0,0,1)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isMobile) {
                    e.currentTarget.style.transform = "translateY(0) scale(1)";
                    e.currentTarget.style.boxShadow =
                      "0 0 26px rgba(0,255,200,0.55), 0 14px 45px rgba(0,0,0,0.85)";
                  }
                }}
              >
                Explore tours
              </button>

              <button
                style={styles.buttonGhost}
                onClick={() => navigate("/events")}
                onMouseEnter={(e) => {
                  if (!isMobile) {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.background = "rgba(0,0,0,0.7)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isMobile) {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.background = "rgba(0,0,0,0.45)";
                  }
                }}
              >
                <span>See upcoming events</span>
                <span style={{ fontSize: 18 }}>➜</span>
              </button>
            </div>
          </div>
        </div>

        {newTours.length > 0 && (
          <section style={styles.sectionWrapper}>
            <div style={styles.sectionHeaderRow}>
              <div style={styles.sectionTitleBlock}>
                <div style={styles.sectionTag}>New</div>
                <div style={styles.sectionTitle}>Fresh adventures ✨</div>
              </div>
              <div style={styles.seeAll} onClick={() => navigate("/tours")}>
                View all →
              </div>
            </div>

            <div style={{ ...styles.grid }} className="hide-scrollbar">
              {newTours.map(renderTourCard)}
            </div>
          </section>
        )}

        {popularTours.length > 0 && (
          <section style={styles.sectionWrapper}>
            <div style={styles.sectionHeaderRow}>
              <div style={styles.sectionTitleBlock}>
                <div style={styles.sectionTag}>Popular</div>
                <div style={styles.sectionTitle}>Popular right now 🔥</div>
              </div>
              <div style={styles.seeAll} onClick={() => navigate("/tours?sort=popular")}>
                See more →
              </div>
            </div>

            <div style={{ ...styles.grid }} className="hide-scrollbar">
              {popularTours.map(renderTourCard)}
            </div>
          </section>
        )}

        {trendingTours.length > 0 && (
          <section style={styles.sectionWrapper}>
            <div style={styles.sectionHeaderRow}>
              <div style={styles.sectionTitleBlock}>
                <div style={styles.sectionTag}>Trending</div>
                <div style={styles.sectionTitle}>Trending this week 📈</div>
              </div>
              <div style={styles.seeAll} onClick={() => navigate("/tours?sort=trending")}>
                Explore →
              </div>
            </div>

            <div style={{ ...styles.grid }} className="hide-scrollbar">
              {trendingTours.map(renderTourCard)}
            </div>
          </section>
        )}

        {events.length > 0 && (
          <section style={styles.sectionWrapper}>
            <div style={styles.sectionHeaderRow}>
              <div style={styles.sectionTitleBlock}>
                <div style={styles.sectionTag}>Events</div>
                <div style={styles.sectionTitle}>Upcoming events 📅</div>
              </div>
              <div style={styles.seeAll} onClick={() => navigate("/events")}>
                See all →
              </div>
            </div>

            <div style={{ ...styles.grid }} className="hide-scrollbar">
              {events.map(renderEventCard)}
            </div>
          </section>
        )}

        <div style={styles.footerSpace}></div>
      </div>
    </>
  );
}