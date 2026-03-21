// src/pages/Home.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

const VIDEO_SRC = "/media/video.mp4";
const MOBILE_BOTTOM_NAV_HEIGHT = 92;

const FALLBACK_TOUR_IMAGE =
  "https://images.pexels.com/photos/3324422/pexels-photo-3324422.jpeg";
const FALLBACK_EVENT_IMAGE =
  "https://images.pexels.com/photos/1761279/pexels-photo-1761279.jpeg";


function useIsMobile(breakpoint = 768) {
  const getValue = useCallback(() => {
    return typeof window !== "undefined"
      ? window.innerWidth <= breakpoint
      : false;
  }, [breakpoint]);

  const [isMobile, setIsMobile] = useState(getValue);

  useEffect(() => {
    const onResize = () => setIsMobile(getValue());

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [getValue]);

  return isMobile;
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(media.matches);

    const handler = (e) => setReduced(e.matches);

    if (media.addEventListener) {
      media.addEventListener("change", handler);
      return () => media.removeEventListener("change", handler);
    }

    media.addListener(handler);
    return () => media.removeListener(handler);
  }, []);

  return reduced;
}

function SectionHeader({
  styles,
  eyebrow,
  title,
  subtitle,
  actionLabel,
  onAction,
}) {
  return (
    <div style={styles.sectionHeaderRow}>
      <div style={styles.sectionTitleBlock}>
        <div style={styles.sectionEyebrow}>{eyebrow}</div>
        <div style={styles.sectionTitle}>{title}</div>
        {subtitle ? <div style={styles.sectionSubtitle}>{subtitle}</div> : null}
      </div>

      {actionLabel ? (
        <button type="button" style={styles.seeAllButton} onClick={onAction}>
          <span>{actionLabel}</span>
          <span style={{ fontSize: 16 }}>→</span>
        </button>
      ) : null}
    </div>
  );
}

function CategoryCard({ styles, icon, title, subtitle, onClick }) {
  return (
    <button
      type="button"
      style={styles.categoryCard}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (window.innerWidth <= 768) return;
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.borderColor = "rgba(0,255,186,0.22)";
        e.currentTarget.style.boxShadow =
          "0 24px 48px rgba(0,0,0,0.34), 0 0 0 1px rgba(0,255,186,0.10)";
      }}
      onMouseLeave={(e) => {
        if (window.innerWidth <= 768) return;
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.10)";
        e.currentTarget.style.boxShadow =
          "0 18px 40px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.05)";
      }}
    >
      <div style={styles.categoryGlow} />
      <div style={styles.categoryIconWrap}>
        <span style={styles.categoryIcon}>{icon}</span>
      </div>
      <div style={styles.categoryTitle}>{title}</div>
      <div style={styles.categorySubtitle}>{subtitle}</div>
    </button>
  );
}

function HowStep({ styles, number, title, text }) {
  return (
    <div style={styles.howCard}>
      <div style={styles.howGlow} />
      <div style={styles.howNumber}>{number}</div>
      <div style={styles.howTitle}>{title}</div>
      <div style={styles.howText}>{text}</div>
    </div>
  );
}

function HeroStat({ styles, value, label }) {
  return (
    <div style={styles.heroStatCard}>
      <div style={styles.heroStatValue}>{value}</div>
      <div style={styles.heroStatLabel}>{label}</div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const isMobile = useIsMobile(768);
  const prefersReducedMotion = usePrefersReducedMotion();

  const [loaded, setLoaded] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  const [tours, setTours] = useState([]);
  const [events, setEvents] = useState([]);
  const [loadingContent, setLoadingContent] = useState(true);
  const [goingNow, setGoingNow] = useState([]);

  const [typedTop, setTypedTop] = useState("");
  const [typedBrand, setTypedBrand] = useState("");

  const TOP_TEXT = "Welcome to";
  const BRAND_TEXT = "MeetOutdoors";

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 220);

    async function loadContent() {
      setLoadingContent(true);

 const [
  { data: toursData, error: toursError },
  { data: eventsData, error: eventsError },
  { data: goingNowData, error: goingNowError },
] = await Promise.all([
  supabase
    .from("tours")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(12),
  supabase
    .from("events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(8),
  supabase
    .from("going_now_overview")
    .select("*")
    .order("starts_at", { ascending: true })
    .limit(8),
]);

console.log("toursError:", toursError);
console.log("eventsError:", eventsError);
console.log("goingNowError:", goingNowError);
console.log("goingNowData:", goingNowData);

      setTours(toursData || []);
setEvents(eventsData || []);
setGoingNow(goingNowData || []);
setLoadingContent(false);
    }

    loadContent();

    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const handleScroll = () => {
      setScrollY(window.scrollY || window.pageYOffset || 0);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (prefersReducedMotion) {
      setTypedTop(TOP_TEXT);
      setTypedBrand(BRAND_TEXT);
      return;
    }

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
          }, 50);
        }, 130);
      }
    }, 40);

    return () => {
      clearInterval(topTimer);
      if (brandTimer) clearInterval(brandTimer);
    };
  }, [prefersReducedMotion]);

  const heroParallax = prefersReducedMotion ? 0 : scrollY * 0.16;

  const newTours = tours.slice(0, 4);
const popularTours = tours.slice(4, 8);
const trendingTours = tours.slice(8, 12);
const featuredTour = newTours[0] || tours[0] || null;
const liveGoingNow = goingNow.slice(0, 8);


  const stats = useMemo(
    () => [
      { value: `${tours.length}+`, label: "Fresh tours" },
      { value: `${events.length}+`, label: "Events" },
      { value: "Real", label: "People" },
      { value: "100%", label: "Outdoor vibe" },
    ],
    [tours.length, events.length]
  );

  const categories = useMemo(
    () => [
      {
        icon: "🥾",
        title: "Hiking",
        subtitle: "Trails, climbs and scenic weekends",
        path: "/tours?category=hiking",
      },
      {
        icon: "🏕️",
        title: "Camping",
        subtitle: "Sleep outside and reset your head",
        path: "/tours?category=camping",
      },
      {
        icon: "🚣",
        title: "Rafting",
        subtitle: "Fast water, adrenaline and chaos",
        path: "/tours?category=rafting",
      },
      {
        icon: "🌆",
        title: "City escapes",
        subtitle: "Quick plans with real social energy",
        path: "/tours?category=city-escape",
      },
    ],
    []
  );

  const styles = useMemo(() => {
    return {
      page: {
        position: "relative",
        minHeight: "100vh",
        overflowX: "hidden",
        color: "#ffffff",
        fontFamily:
          "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        zIndex: 1,
        background: "#020807",
        paddingBottom: isMobile ? MOBILE_BOTTOM_NAV_HEIGHT + 26 : 0,
      },

      bgVideo: {
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        zIndex: -5,
        filter: isMobile
          ? "saturate(0.92) brightness(0.70)"
          : "saturate(1.02) brightness(0.77)",
      },

      bgMesh: {
        position: "fixed",
        inset: 0,
        zIndex: -4,
        background: `
          radial-gradient(circle at 12% 10%, rgba(0,255,186,0.18), transparent 24%),
          radial-gradient(circle at 86% 14%, rgba(0,170,255,0.14), transparent 24%),
          radial-gradient(circle at 52% 82%, rgba(0,255,153,0.10), transparent 28%),
          radial-gradient(circle at 50% 20%, rgba(255,255,255,0.03), transparent 20%)
        `,
        pointerEvents: "none",
      },

      overlay: {
        position: "fixed",
        inset: 0,
        background: isMobile
          ? "linear-gradient(to bottom, rgba(2,8,7,0.16), rgba(2,8,7,0.68) 28%, rgba(2,8,7,0.96) 100%)"
          : "linear-gradient(to bottom, rgba(2,8,7,0.14), rgba(2,8,7,0.54) 25%, rgba(2,8,7,0.88) 66%, rgba(2,8,7,0.98) 100%)",
        backdropFilter: isMobile ? "blur(7px)" : "blur(5px)",
        zIndex: -3,
      },

      topAura: {
        position: "absolute",
        top: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: isMobile ? "92%" : "74%",
        height: isMobile ? 230 : 320,
        borderRadius: 999,
        background:
          "radial-gradient(circle, rgba(0,255,186,0.10), rgba(0,255,186,0.03), transparent 72%)",
        filter: "blur(40px)",
        pointerEvents: "none",
      },

      heroShell: {
        position: "relative",
        maxWidth: 1280,
        margin: "0 auto",
        padding: isMobile ? "80px 16px 20px" : "126px 24px 56px",
      },

      hero: {
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1.2fr) minmax(360px, 0.8fr)",
        gap: isMobile ? 16 : 24,
        alignItems: "stretch",
        opacity: loaded ? 1 : 0,
        transform: loaded
          ? `translateY(${heroParallax * 0.28}px)`
          : "translateY(22px)",
        transition: "opacity 0.9s ease, transform 0.9s ease",
      },

      heroLeftCard: {
        position: "relative",
        overflow: "hidden",
        borderRadius: isMobile ? 28 : 38,
        padding: isMobile ? "22px 18px 20px" : "36px 36px 30px",
        background:
          "linear-gradient(145deg, rgba(9,16,15,0.76), rgba(3,10,9,0.90))",
        border: "1px solid rgba(255,255,255,0.12)",
        boxShadow:
          "0 28px 90px rgba(0,0,0,0.52), inset 0 1px 0 rgba(255,255,255,0.08)",
        backdropFilter: "blur(18px)",
      },

      heroGlow: {
        position: "absolute",
        top: -130,
        right: -90,
        width: 280,
        height: 280,
        borderRadius: "50%",
        background:
          "radial-gradient(circle, rgba(0,255,186,0.18), transparent 65%)",
        pointerEvents: "none",
      },

      heroGlow2: {
        position: "absolute",
        bottom: -130,
        left: -90,
        width: 260,
        height: 260,
        borderRadius: "50%",
        background:
          "radial-gradient(circle, rgba(0,170,255,0.14), transparent 68%)",
        pointerEvents: "none",
      },

      heroGridLine: {
        position: "absolute",
        inset: 0,
        background:
          "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
        backgroundSize: "42px 42px",
        maskImage:
          "linear-gradient(to bottom, rgba(0,0,0,0.55), rgba(0,0,0,0.08))",
        pointerEvents: "none",
      },

      heroPill: {
        position: "relative",
        zIndex: 1,
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: isMobile ? "8px 12px" : "8px 16px",
        borderRadius: 999,
        border: "1px solid rgba(0,255,176,0.30)",
        background: "rgba(255,255,255,0.06)",
        color: "rgba(225,255,244,0.96)",
        fontSize: isMobile ? 10 : 11,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        fontWeight: 900,
        boxShadow: "0 0 24px rgba(0,255,176,0.16)",
        marginBottom: isMobile ? 16 : 18,
        width: "fit-content",
      },

      liveDot: {
        width: 8,
        height: 8,
        borderRadius: 999,
        background: "#00ffba",
        boxShadow: "0 0 16px rgba(0,255,186,0.95)",
        flex: "0 0 auto",
      },

      welcomeWrap: {
        position: "relative",
        zIndex: 1,
        display: "flex",
        flexDirection: "column",
        gap: isMobile ? 8 : 10,
        marginBottom: isMobile ? 12 : 14,
      },

      welcomeTop: {
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        fontSize: isMobile ? 12 : 17,
        fontWeight: 800,
        letterSpacing: isMobile ? "0.12em" : "0.16em",
        textTransform: "uppercase",
        color: "rgba(228,255,248,0.9)",
        textShadow: "0 10px 28px rgba(0,0,0,0.5)",
      },

      smallSpark: {
        width: isMobile ? 8 : 10,
        height: isMobile ? 8 : 10,
        borderRadius: 999,
        background: "rgba(0,255,186,0.95)",
        boxShadow: "0 0 18px rgba(0,255,186,0.95)",
        flex: "0 0 auto",
      },

      brandRow: {
        display: "flex",
        alignItems: "center",
        gap: isMobile ? 12 : 14,
        flexWrap: "wrap",
      },

      brandMark: {
        width: isMobile ? 52 : 66,
        height: isMobile ? 52 : 66,
        borderRadius: isMobile ? 18 : 22,
        background:
          "linear-gradient(145deg, rgba(0,255,186,0.24), rgba(0,153,255,0.16), rgba(255,255,255,0.08))",
        border: "1px solid rgba(255,255,255,0.16)",
        boxShadow:
          "0 18px 40px rgba(0,0,0,0.35), 0 0 28px rgba(0,255,186,0.14)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        flex: "0 0 auto",
      },

      brandMarkShine: {
        position: "absolute",
        inset: 0,
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.22), transparent 38%, transparent 60%, rgba(255,255,255,0.08))",
        pointerEvents: "none",
      },

      treeGlyph: {
        position: "relative",
        zIndex: 1,
        fontSize: isMobile ? 18 : 24,
        fontWeight: 950,
        color: "rgba(240,255,251,0.96)",
        textShadow: "0 6px 16px rgba(0,0,0,0.45)",
        transform: "translateY(-1px)",
      },

      title: {
        fontSize: isMobile ? 42 : 76,
        lineHeight: isMobile ? 0.95 : 0.92,
        fontWeight: 950,
        letterSpacing: "-0.055em",
        margin: 0,
        background:
          "linear-gradient(100deg, #fbfffd 0%, #e6fff6 18%, #80ffdd 46%, #12f0b6 68%, #d5fff1 100%)",
        WebkitBackgroundClip: "text",
        color: "transparent",
        textShadow: "0 16px 48px rgba(0,0,0,0.4)",
      },

      caret: {
        display: "inline-block",
        width: 10,
        marginLeft: 2,
        opacity: 0.95,
        animation: "blink 1s steps(1) infinite",
      },

      heroMiniHook: {
        position: "relative",
        zIndex: 1,
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        marginTop: 10,
        marginBottom: 14,
      },

      heroMiniHookItem: {
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 11px",
        borderRadius: 999,
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.10)",
        fontSize: isMobile ? 11 : 12,
        color: "rgba(230,250,244,0.92)",
        fontWeight: 800,
      },

      subtitle: {
        position: "relative",
        zIndex: 1,
        fontSize: isMobile ? 16 : 20,
        lineHeight: isMobile ? 1.45 : 1.5,
        color: "rgba(244,252,248,0.96)",
        maxWidth: 760,
        marginTop: isMobile ? 8 : 10,
        marginBottom: isMobile ? 8 : 8,
        textShadow: "0 8px 24px rgba(0,0,0,0.4)",
        fontWeight: 800,
      },

      subtext: {
        position: "relative",
        zIndex: 1,
        fontSize: isMobile ? 13 : 15,
        lineHeight: 1.6,
        color: "rgba(218,236,229,0.84)",
        maxWidth: 720,
        marginBottom: isMobile ? 18 : 20,
      },

      heroMetaRow: {
        position: "relative",
        zIndex: 1,
        display: "flex",
        flexWrap: "wrap",
        gap: isMobile ? 8 : 12,
        marginBottom: isMobile ? 18 : 20,
      },

      metaTag: {
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: isMobile ? "8px 11px" : "8px 12px",
        borderRadius: 999,
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.12)",
        backdropFilter: "blur(10px)",
        color: "rgba(230,250,244,0.94)",
        fontSize: isMobile ? 11 : 13,
        fontWeight: 700,
      },

      heroSearchBar: {
        position: "relative",
        zIndex: 1,
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1.3fr 1fr auto",
        gap: 10,
        padding: "12px",
        borderRadius: 24,
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.12)",
        backdropFilter: "blur(12px)",
        marginBottom: isMobile ? 16 : 18,
        boxShadow: "0 14px 34px rgba(0,0,0,0.22)",
      },

      searchBlock: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: isMobile ? "12px 12px" : "12px 14px",
        borderRadius: 18,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        minHeight: 56,
      },

      searchIcon: {
        fontSize: 18,
        opacity: 0.92,
      },

      searchTexts: {
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
      },

      searchLabel: {
        fontSize: 10,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: "rgba(184,222,211,0.82)",
        fontWeight: 900,
        marginBottom: 3,
      },

      searchValue: {
        fontSize: isMobile ? 13 : 14,
        fontWeight: 800,
        color: "#f2fffb",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      },

      heroSearchButton: {
        appearance: "none",
        border: "none",
        outline: "none",
        padding: isMobile ? "15px 16px" : "0 20px",
        borderRadius: 18,
        background: "linear-gradient(135deg, #00ffba, #00d694 50%, #00a871 100%)",
        color: "#03271d",
        fontWeight: 900,
        fontSize: 15,
        cursor: "pointer",
        boxShadow:
          "0 18px 38px rgba(0,255,186,0.2), 0 10px 30px rgba(0,0,0,0.35)",
        minHeight: 56,
        transition: "transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease",
      },

      ctaRow: {
        position: "relative",
        zIndex: 1,
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        flexWrap: "wrap",
        gap: 12,
        marginBottom: isMobile ? 18 : 20,
      },

      buttonPrimary: {
        appearance: "none",
        border: "none",
        outline: "none",
        padding: isMobile ? "15px 18px" : "15px 28px",
        borderRadius: 999,
        background: "linear-gradient(135deg, #00ffba, #00d694 50%, #00a871 100%)",
        color: "#03271d",
        fontWeight: 900,
        fontSize: isMobile ? 15 : 16,
        cursor: "pointer",
        boxShadow:
          "0 18px 38px rgba(0,255,186,0.2), 0 10px 30px rgba(0,0,0,0.35)",
        transition: "transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease",
        width: isMobile ? "100%" : "auto",
      },

      buttonGhost: {
        appearance: "none",
        border: "1px solid rgba(255,255,255,0.16)",
        outline: "none",
        padding: isMobile ? "14px 18px" : "15px 22px",
        borderRadius: 999,
        background: "rgba(255,255,255,0.05)",
        color: "#ffffff",
        fontWeight: 800,
        fontSize: 14,
        cursor: "pointer",
        backdropFilter: "blur(10px)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        transition: "transform 0.18s ease, background 0.18s ease, border-color 0.18s ease",
        width: isMobile ? "100%" : "auto",
      },

      heroBottomInfo: {
        position: "relative",
        zIndex: 1,
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))",
        gap: 10,
        marginTop: isMobile ? 6 : 10,
      },

      heroStatCard: {
        padding: isMobile ? "12px 12px" : "13px 14px",
        borderRadius: 18,
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.09)",
        backdropFilter: "blur(10px)",
      },

      heroStatValue: {
        fontSize: isMobile ? 18 : 22,
        fontWeight: 900,
        color: "#eafff8",
        marginBottom: 4,
      },

      heroStatLabel: {
        fontSize: isMobile ? 11 : 12,
        color: "rgba(220,240,234,0.82)",
        letterSpacing: "0.04em",
      },

      heroRightCard: {
        position: "relative",
        overflow: "hidden",
        borderRadius: isMobile ? 28 : 38,
        padding: isMobile ? "14px" : "22px",
        background:
          "linear-gradient(155deg, rgba(6,12,11,0.82), rgba(2,8,7,0.94))",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow:
          "0 24px 80px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)",
        backdropFilter: "blur(16px)",
        minHeight: isMobile ? "auto" : 560,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: isMobile ? 10 : 0,
      },

      spotlightLabel: {
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        width: "fit-content",
        padding: "8px 12px",
        borderRadius: 999,
        background: "rgba(0,255,186,0.08)",
        border: "1px solid rgba(0,255,186,0.16)",
        color: "#baffea",
        fontSize: 11,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        fontWeight: 900,
        marginBottom: 14,
      },

      spotlightCard: {
        position: "relative",
        borderRadius: 28,
        overflow: "hidden",
        minHeight: isMobile ? 220 : 350,
        background: "#07100f",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 20px 48px rgba(0,0,0,0.4)",
        cursor: "pointer",
      },

      spotlightImage: {
        width: "100%",
        height: "100%",
        minHeight: isMobile ? 220 : 350,
        objectFit: "cover",
      },

      skeletonSpotlight: {
        width: "100%",
        minHeight: isMobile ? 220 : 350,
        background:
          "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.10) 50%, rgba(255,255,255,0.04) 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.8s infinite linear",
      },

      spotlightOverlay: {
        position: "absolute",
        inset: 0,
        background:
          "linear-gradient(to top, rgba(2,8,7,0.96), rgba(2,8,7,0.2) 48%, rgba(2,8,7,0.08))",
      },

      spotlightContent: {
        position: "absolute",
        left: 18,
        right: 18,
        bottom: 18,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      },

      spotlightTopRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap",
      },

      spotlightBadge: {
        display: "inline-flex",
        alignItems: "center",
        padding: "6px 10px",
        borderRadius: 999,
        background: "rgba(0,255,186,0.9)",
        color: "#03261d",
        fontSize: 11,
        fontWeight: 900,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        boxShadow: "0 0 18px rgba(0,255,186,0.35)",
      },

      spotlightPrice: {
        display: "inline-flex",
        alignItems: "center",
        padding: "6px 10px",
        borderRadius: 999,
        background: "rgba(0,0,0,0.45)",
        border: "1px solid rgba(255,255,255,0.16)",
        color: "rgba(245,255,250,0.94)",
        fontSize: 11,
        fontWeight: 800,
      },

      spotlightTitle: {
        fontSize: isMobile ? 22 : 30,
        lineHeight: 1.03,
        fontWeight: 900,
        margin: 0,
        color: "#f6fffb",
        textShadow: "0 8px 24px rgba(0,0,0,0.4)",
      },

      spotlightLocation: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        color: "rgba(228,244,239,0.88)",
        fontSize: isMobile ? 13 : 14,
      },

      spotlightMeta: {
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
      },

      spotlightChip: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "7px 10px",
        borderRadius: 999,
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.12)",
        color: "#ecfaf6",
        fontSize: 12,
        fontWeight: 700,
      },

      sideMiniPanel: {
        marginTop: isMobile ? 10 : 14,
        display: "grid",
        gridTemplateColumns: "1fr",
        gap: isMobile ? 8 : 10,
      },

      sideMiniCard: {
        padding: isMobile ? "12px 12px" : "14px 14px",
        borderRadius: 18,
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.09)",
      },

      sideMiniTitle: {
        fontSize: isMobile ? 13 : 14,
        fontWeight: 900,
        color: "#f6fffb",
        marginBottom: 4,
      },

      sideMiniText: {
        fontSize: isMobile ? 12 : 13,
        lineHeight: 1.45,
        color: "rgba(218,236,229,0.8)",
      },

      sectionWrapper: {
        maxWidth: 1280,
        margin: "0 auto",
        padding: isMobile ? "18px 16px 28px" : "10px 24px 54px",
      },

      sectionHeaderRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        gap: 16,
        marginBottom: isMobile ? 14 : 18,
      },

      sectionTitleBlock: {
        display: "flex",
        flexDirection: "column",
        gap: 5,
      },

      sectionEyebrow: {
        fontSize: isMobile ? 10 : 11,
        textTransform: "uppercase",
        letterSpacing: "0.22em",
        color: "rgba(184,222,211,0.82)",
        fontWeight: 900,
      },

      sectionTitle: {
        fontSize: isMobile ? 22 : 30,
        fontWeight: 900,
        lineHeight: 1.04,
        color: "#f6fffb",
        textShadow: "0 6px 18px rgba(0,0,0,0.25)",
      },

      sectionSubtitle: {
        fontSize: isMobile ? 13 : 14,
        color: "rgba(218,236,229,0.78)",
        lineHeight: 1.45,
        maxWidth: 720,
      },

      seeAllButton: {
        appearance: "none",
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.05)",
        color: "#baffea",
        padding: isMobile ? "10px 12px" : "11px 14px",
        borderRadius: 999,
        fontWeight: 800,
        fontSize: isMobile ? 12 : 13,
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        cursor: "pointer",
        whiteSpace: "nowrap",
        backdropFilter: "blur(10px)",
      },

      howGrid: {
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))",
        gap: isMobile ? 12 : 16,
      },

      howCard: {
        position: "relative",
        overflow: "hidden",
        padding: isMobile ? "16px" : "22px",
        borderRadius: 24,
        background:
          "linear-gradient(145deg, rgba(9,15,14,0.84), rgba(4,10,9,0.96))",
        border: "1px solid rgba(255,255,255,0.10)",
        boxShadow:
          "0 18px 40px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.05)",
      },

      howGlow: {
        position: "absolute",
        top: -80,
        right: -60,
        width: 140,
        height: 140,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(0,255,186,0.10), transparent 72%)",
        pointerEvents: "none",
      },

      howNumber: {
        width: isMobile ? 36 : 40,
        height: isMobile ? 36 : 40,
        borderRadius: 14,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #00ffba, #00c792)",
        color: "#03271d",
        fontWeight: 950,
        fontSize: isMobile ? 14 : 16,
        marginBottom: 12,
        boxShadow: "0 0 18px rgba(0,255,186,0.18)",
        position: "relative",
        zIndex: 1,
      },

      howTitle: {
        fontSize: isMobile ? 17 : 20,
        fontWeight: 900,
        marginBottom: 8,
        color: "#f7fffc",
        position: "relative",
        zIndex: 1,
      },

      howText: {
        fontSize: isMobile ? 13 : 15,
        lineHeight: 1.55,
        color: "rgba(218,236,229,0.82)",
        position: "relative",
        zIndex: 1,
      },

      categoriesGrid: {
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))",
        gap: 14,
      },

      categoryCard: {
        appearance: "none",
        border: "1px solid rgba(255,255,255,0.10)",
        background:
          "linear-gradient(145deg, rgba(9,15,14,0.84), rgba(4,10,9,0.96))",
        borderRadius: 24,
        padding: isMobile ? "18px 14px" : "22px 18px",
        textAlign: "left",
        cursor: "pointer",
        color: "white",
        boxShadow:
          "0 18px 40px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.05)",
        transition: "transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease",
        position: "relative",
        overflow: "hidden",
      },

      categoryGlow: {
        position: "absolute",
        top: -70,
        right: -70,
        width: 140,
        height: 140,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(0,255,186,0.10), transparent 72%)",
        pointerEvents: "none",
      },

      categoryIconWrap: {
        width: isMobile ? 46 : 52,
        height: isMobile ? 46 : 52,
        borderRadius: 16,
        background:
          "linear-gradient(145deg, rgba(0,255,186,0.18), rgba(0,168,255,0.12))",
        border: "1px solid rgba(255,255,255,0.10)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 14,
        position: "relative",
        zIndex: 1,
      },

      categoryIcon: {
        fontSize: isMobile ? 22 : 24,
      },

      categoryTitle: {
        fontSize: isMobile ? 16 : 18,
        fontWeight: 900,
        marginBottom: 6,
        position: "relative",
        zIndex: 1,
      },

      categorySubtitle: {
        fontSize: isMobile ? 12 : 13,
        lineHeight: 1.5,
        color: "rgba(218,236,229,0.78)",
        position: "relative",
        zIndex: 1,
      },

      grid: {
        display: isMobile ? "flex" : "grid",
        gridTemplateColumns: isMobile
          ? undefined
          : "repeat(auto-fit, minmax(285px, 1fr))",
        gap: isMobile ? 14 : 18,
        overflowX: isMobile ? "auto" : "visible",
        paddingBottom: isMobile ? 8 : 0,
        scrollSnapType: isMobile ? "x mandatory" : "none",
      },

      card: {
        position: "relative",
        overflow: "hidden",
        borderRadius: 24,
        background:
          "linear-gradient(155deg, rgba(9,15,14,0.86), rgba(4,10,9,0.96))",
        border: "1px solid rgba(255,255,255,0.10)",
        backdropFilter: "blur(14px)",
        cursor: "pointer",
        transition:
          "transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease",
        boxShadow:
          "0 18px 40px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.05)",
        minWidth: isMobile ? "84vw" : "auto",
        flex: isMobile ? "0 0 84vw" : "unset",
        scrollSnapAlign: isMobile ? "start" : "none",
      },

      cardShine: {
        position: "absolute",
        top: 0,
        left: -140,
        width: 160,
        height: "100%",
        background:
          "linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)",
        transform: "skewX(-18deg)",
        pointerEvents: "none",
        transition: "left 0.5s ease",
      },

      cardMediaWrapper: {
        position: "relative",
        width: "100%",
        height: isMobile ? 188 : 210,
        overflow: "hidden",
      },

      cardImg: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        transform: "scale(1.03)",
        transition: "transform 0.45s ease, opacity 0.45s ease",
      },

      cardImageTopFade: {
        position: "absolute",
        inset: 0,
        background:
          "linear-gradient(to bottom, rgba(0,0,0,0.12), rgba(0,0,0,0.46))",
      },

      cardImageBottomFade: {
        position: "absolute",
        inset: 0,
        background:
          "linear-gradient(to top, rgba(2,8,7,0.95), rgba(2,8,7,0.06) 48%)",
      },

      cardTopRow: {
        position: "absolute",
        top: 12,
        left: 12,
        right: 12,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 8,
      },

      badge: {
        display: "inline-flex",
        alignItems: "center",
        padding: isMobile ? "6px 10px" : "6px 11px",
        borderRadius: 999,
        background:
          "linear-gradient(135deg, rgba(0,255,186,0.95), rgba(0,210,149,0.95))",
        color: "#02251b",
        fontWeight: 900,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        fontSize: isMobile ? 10 : 11,
        boxShadow: "0 0 18px rgba(0,255,186,0.25)",
        maxWidth: "65%",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      },

      priceTag: {
        display: "inline-flex",
        alignItems: "center",
        padding: isMobile ? "6px 10px" : "6px 11px",
        borderRadius: 999,
        background: "rgba(0,0,0,0.45)",
        border: "1px solid rgba(255,255,255,0.18)",
        color: "rgba(248,255,252,0.95)",
        fontWeight: 800,
        fontSize: isMobile ? 10 : 11,
        whiteSpace: "nowrap",
      },

      cardBody: {
        position: "relative",
        padding: isMobile ? 14 : 16,
      },

      cardTitle: {
        fontSize: isMobile ? 17 : 18,
        fontWeight: 900,
        lineHeight: 1.15,
        color: "#f7fffc",
        marginBottom: 8,
        minHeight: isMobile ? "auto" : 42,
      },

      cardLocationRow: {
        display: "flex",
        alignItems: "center",
        gap: 7,
        fontSize: isMobile ? 12 : 13,
        color: "rgba(221,238,232,0.88)",
        marginBottom: 12,
      },

      cardMetaRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        fontSize: isMobile ? 11 : 12,
        color: "rgba(204,226,218,0.86)",
      },

      chipRow: {
        display: "flex",
        gap: 7,
        flexWrap: "wrap",
      },

      chip: {
        display: "inline-flex",
        alignItems: "center",
        padding: "5px 9px",
        borderRadius: 999,
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.10)",
        color: "#eafbf5",
        fontWeight: 700,
      },

      metaRight: {
        whiteSpace: "nowrap",
        fontWeight: 800,
        color: "rgba(228,248,240,0.92)",
      },

      emptyState: {
        maxWidth: 1280,
        margin: "0 auto",
        padding: isMobile ? "14px 16px 42px" : "20px 24px 56px",
      },

      emptyCard: {
        borderRadius: 28,
        padding: isMobile ? "18px" : "24px",
        background:
          "linear-gradient(145deg, rgba(8,14,13,0.82), rgba(3,8,7,0.96))",
        border: "1px solid rgba(255,255,255,0.10)",
        boxShadow: "0 18px 44px rgba(0,0,0,0.32)",
      },

      emptyTitle: {
        fontSize: isMobile ? 20 : 24,
        fontWeight: 900,
        marginBottom: 8,
      },

      emptyText: {
        fontSize: isMobile ? 14 : 15,
        lineHeight: 1.6,
        color: "rgba(216,235,228,0.84)",
        maxWidth: 720,
      },

      footerSpace: {
        height: isMobile ? MOBILE_BOTTOM_NAV_HEIGHT + 36 : 120,
      },
    };
  }, [heroParallax, isMobile, loaded]);

  const getActivityLabel = (item) =>
    item.activity_type ||
    item.category ||
    item.type ||
    (item.is_event ? "Event" : "Adventure");

  const getLocationLabel = (item) =>
    item.location ||
    item.location_name ||
    [item.city, item.country].filter(Boolean).join(", ") ||
    "Unknown location";

  const getPriceLabel = (item) => {
    if (item.price === 0 || item.price_from === 0 || item.is_free) return "Free";
    if (item.price) return `${item.price} €`;
    if (item.price_from) return `From ${item.price_from} €`;
    return "Flexible";
  };

  const getEventDateLabel = (eventItem) => {
    if (!eventItem.start_date) return "Date soon";

    const d = new Date(eventItem.start_date);
    if (Number.isNaN(d.getTime())) return "Date soon";

    return d.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };
const getGoingNowTimeLabel = (item) => {
  if (!item?.starts_at) return "Starting soon";

  const d = new Date(item.starts_at);
  if (Number.isNaN(d.getTime())) return "Starting soon";

  return d.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};
  const cardHoverStyle = {
    transform: "translateY(-7px) scale(1.012)",
    boxShadow:
      "0 26px 60px rgba(0,0,0,0.45), 0 0 0 1px rgba(0,255,186,0.18), inset 0 1px 0 rgba(255,255,255,0.06)",
    borderColor: "rgba(0,255,186,0.28)",
  };

  const handleCardEnter = (e) => {
    if (isMobile) return;
    Object.assign(e.currentTarget.style, cardHoverStyle);

    const img = e.currentTarget.querySelector("[data-card-image]");
    const shine = e.currentTarget.querySelector("[data-card-shine]");

    if (img) img.style.transform = "scale(1.08)";
    if (shine) shine.style.left = "110%";
  };

  const handleCardLeave = (e) => {
    if (isMobile) return;

    e.currentTarget.style.transform = "translateY(0px) scale(1)";
    e.currentTarget.style.boxShadow =
      "0 18px 40px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.05)";
    e.currentTarget.style.borderColor = "rgba(255,255,255,0.10)";

    const img = e.currentTarget.querySelector("[data-card-image]");
    const shine = e.currentTarget.querySelector("[data-card-shine]");

    if (img) img.style.transform = "scale(1.03)";
    if (shine) shine.style.left = "-140px";
  };

  const enhancePrimaryButton = (e) => {
    if (isMobile) return;
    e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
    e.currentTarget.style.boxShadow =
      "0 20px 42px rgba(0,255,186,0.26), 0 12px 34px rgba(0,0,0,0.34)";
    e.currentTarget.style.filter = "brightness(1.03)";
  };

  const resetPrimaryButton = (e) => {
    if (isMobile) return;
    e.currentTarget.style.transform = "translateY(0) scale(1)";
    e.currentTarget.style.boxShadow =
      "0 18px 38px rgba(0,255,186,0.2), 0 10px 30px rgba(0,0,0,0.35)";
    e.currentTarget.style.filter = "brightness(1)";
  };

  const enhanceGhostButton = (e) => {
    if (isMobile) return;
    e.currentTarget.style.transform = "translateY(-1px)";
    e.currentTarget.style.background = "rgba(255,255,255,0.08)";
    e.currentTarget.style.borderColor = "rgba(255,255,255,0.22)";
  };

  const resetGhostButton = (e) => {
    if (isMobile) return;
    e.currentTarget.style.transform = "translateY(0)";
    e.currentTarget.style.background = "rgba(255,255,255,0.05)";
    e.currentTarget.style.borderColor = "rgba(255,255,255,0.16)";
  };

  const renderTourCard = (tour) => (
    <div
      key={tour.id}
      style={styles.card}
      onClick={() => navigate(`/tour/${tour.id}`)}
      onMouseEnter={handleCardEnter}
      onMouseLeave={handleCardLeave}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") navigate(`/tour/${tour.id}`);
      }}
      aria-label={`Open tour ${tour.title || "tour"}`}
    >
      <div data-card-shine style={styles.cardShine} />

      <div style={styles.cardMediaWrapper}>
        <img
          src={tour.cover_url || FALLBACK_TOUR_IMAGE}
          alt={tour.title || "Tour cover"}
          style={styles.cardImg}
          data-card-image
        />
        <div style={styles.cardImageTopFade} />
        <div style={styles.cardImageBottomFade} />

        <div style={styles.cardTopRow}>
          <div style={styles.badge}>{getActivityLabel(tour)}</div>
          <div style={styles.priceTag}>{getPriceLabel(tour)}</div>
        </div>
      </div>

      <div style={styles.cardBody}>
        <div style={styles.cardTitle}>{tour.title || "Untitled tour"}</div>

        <div style={styles.cardLocationRow}>
          <span>📍</span>
          <span>{getLocationLabel(tour)}</span>
        </div>

        <div style={styles.cardMetaRow}>
          <div style={styles.chipRow}>
            <span style={styles.chip}>{tour.difficulty || "All levels"}</span>
            <span style={styles.chip}>{tour.duration || "1–3 days"}</span>
          </div>

          <span style={styles.metaRight}>
            👥 {tour.max_people || tour.capacity || "Small group"}
          </span>
        </div>
      </div>
    </div>
  );

  const renderEventCard = (eventItem) => (
    <div
      key={eventItem.id}
      style={styles.card}
      onClick={() => navigate(`/event/${eventItem.id}`)}
      onMouseEnter={handleCardEnter}
      onMouseLeave={handleCardLeave}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") navigate(`/event/${eventItem.id}`);
      }}
      aria-label={`Open event ${eventItem.title || "event"}`}
    >
      <div data-card-shine style={styles.cardShine} />

      <div style={styles.cardMediaWrapper}>
        <img
          src={eventItem.cover_url || FALLBACK_EVENT_IMAGE}
          alt={eventItem.title || "Event cover"}
          style={styles.cardImg}
          data-card-image
        />
        <div style={styles.cardImageTopFade} />
        <div style={styles.cardImageBottomFade} />

        <div style={styles.cardTopRow}>
          <div style={styles.badge}>{eventItem.category || "Event"}</div>
          <div style={styles.priceTag}>{getPriceLabel(eventItem)}</div>
        </div>
      </div>

      <div style={styles.cardBody}>
        <div style={styles.cardTitle}>
          {eventItem.title || "Untitled event"}
        </div>

        <div style={styles.cardLocationRow}>
          <span>📍</span>
          <span>
            {eventItem.location_name ||
              [eventItem.city, eventItem.country].filter(Boolean).join(", ") ||
              "Location TBA"}
          </span>
        </div>

        <div style={styles.cardMetaRow}>
          <div style={styles.chipRow}>
            <span style={styles.chip}>{getEventDateLabel(eventItem)}</span>
            <span style={styles.chip}>{eventItem.time || "Time TBA"}</span>
          </div>

          <span style={styles.metaRight}>
            👥 {eventItem.capacity || "Limited spots"}
          </span>
        </div>
      </div>
    </div>
  );
const renderGoingNowCard = (item) => (
  <div
    key={item.id}
    style={styles.card}
    onClick={() => navigate(`/going-now/${item.id}`)}
    onMouseEnter={handleCardEnter}
    onMouseLeave={handleCardLeave}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => {
      if (e.key === "Enter" || e.key === " ") {
        navigate(`/going-now/${item.id}`);
      }
    }}
    aria-label={`Open going now ${item.title || "plan"}`}
  >
    <div data-card-shine style={styles.cardShine} />

    <div style={styles.cardMediaWrapper}>
      <img
        src={FALLBACK_EVENT_IMAGE}
        alt={item.title || "Going now"}
        style={styles.cardImg}
        data-card-image
      />
      <div style={styles.cardImageTopFade} />
      <div style={styles.cardImageBottomFade} />

      <div style={styles.cardTopRow}>
        <div style={styles.badge}>🔥 Going now</div>
        <div style={styles.priceTag}>
          {item.is_full ? "Full" : `${item.spots_left} spots left`}
        </div>
      </div>
    </div>

    <div style={styles.cardBody}>
      <div style={styles.cardTitle}>{item.title || "Untitled plan"}</div>

      <div style={styles.cardLocationRow}>
        <span>📍</span>
        <span>{item.location_text || "Location soon"}</span>
      </div>

      <div style={styles.cardMetaRow}>
        <div style={styles.chipRow}>
          <span style={styles.chip}>{getGoingNowTimeLabel(item)}</span>
          <span style={styles.chip}>{item.vibe || "Social"}</span>
        </div>

        <span style={styles.metaRight}>
          👥 {item.joined_count}/{item.spots_total}
        </span>
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

        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }

        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      <video
        src={VIDEO_SRC}
        autoPlay
        muted
        loop
        playsInline
        style={styles.bgVideo}
      />
      <div style={styles.bgMesh} />
      <div style={styles.overlay} />

      <div style={styles.page}>
        <section style={styles.heroShell}>
          <div style={styles.topAura} />

          <div style={styles.hero}>
            <div style={styles.heroLeftCard}>
              <div style={styles.heroGlow} />
              <div style={styles.heroGlow2} />
              <div style={styles.heroGridLine} />

              <div style={styles.heroPill}>
                <span style={styles.liveDot} />
                <span>Meet new people outside</span>
              </div>

              <div style={styles.welcomeWrap}>
                <div style={styles.welcomeTop}>
                  <span style={styles.smallSpark} />
                  <span>
                    {typedTop}
                    {typedTop.length < TOP_TEXT.length && !prefersReducedMotion ? (
                      <span style={styles.caret}>|</span>
                    ) : null}
                  </span>
                </div>

                <div style={styles.brandRow}>
                  <div style={styles.brandMark} aria-hidden="true">
                    <div style={styles.brandMarkShine} />
                    <span style={styles.treeGlyph}>▲</span>
                  </div>

                  <h1 style={styles.title}>
                    {typedBrand}
                    {typedTop.length >= TOP_TEXT.length &&
                    typedBrand.length < BRAND_TEXT.length &&
                    !prefersReducedMotion ? (
                      <span style={styles.caret}>|</span>
                    ) : null}
                  </h1>
                </div>
              </div>

              <div style={styles.subtitle}>
                Find your people. Go outside. Make it count.
              </div>

              <div style={styles.subtext}>
                Real adventures, real plans, real people you might actually want
                to meet.
              </div>

              <div style={styles.heroMiniHook}>
                <div style={styles.heroMiniHookItem}>⚡ Fast to explore</div>
                <div style={styles.heroMiniHookItem}>🤝 Real social vibe</div>
                <div style={styles.heroMiniHookItem}>🏕️ Outdoor-first</div>
              </div>

              <div style={styles.heroMetaRow}>
                <div style={styles.metaTag}>🏔️ <span>Verified guides</span></div>
                <div style={styles.metaTag}>🌍 <span>Outdoor community</span></div>
                <div style={styles.metaTag}>✨ <span>Zero boring vibes</span></div>
              </div>

              <div style={styles.heroSearchBar}>
                <div style={styles.searchBlock}>
                  <span style={styles.searchIcon}>📍</span>
                  <div style={styles.searchTexts}>
                    <div style={styles.searchLabel}>Where</div>
                    <div style={styles.searchValue}>
                      Mountains, rivers, nature, weekend spots
                    </div>
                  </div>
                </div>

                <div style={styles.searchBlock}>
                  <span style={styles.searchIcon}>🥾</span>
                  <div style={styles.searchTexts}>
                    <div style={styles.searchLabel}>What</div>
                    <div style={styles.searchValue}>
                      Hiking, camping, rafting, meetups
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  style={styles.heroSearchButton}
                  onClick={() => navigate("/tours")}
                  onMouseEnter={enhancePrimaryButton}
                  onMouseLeave={resetPrimaryButton}
                >
                  Explore now
                </button>
              </div>

              <div style={styles.ctaRow}>
                <button
                  type="button"
                  style={styles.buttonPrimary}
                  onClick={() => navigate("/tours")}
                  onMouseEnter={enhancePrimaryButton}
                  onMouseLeave={resetPrimaryButton}
                >
                  Explore tours
                </button>

                <button
                  type="button"
                  style={styles.buttonGhost}
                  onClick={() => navigate("/events")}
                  onMouseEnter={enhanceGhostButton}
                  onMouseLeave={resetGhostButton}
                >
                  <span>See events</span>
                  <span style={{ fontSize: 18 }}>➜</span>
                </button>
              </div>

              <div style={styles.heroBottomInfo}>
                {stats.map((item) => (
                  <HeroStat
                    key={item.label}
                    styles={styles}
                    value={item.value}
                    label={item.label}
                  />
                ))}
              </div>
            </div>

            <div style={styles.heroRightCard}>
              <div>
                <div style={styles.spotlightLabel}>
                  <span>★</span>
                  <span>Featured spotlight</span>
                </div>
              </div>

              {loadingContent && !featuredTour ? (
                <div style={styles.spotlightCard}>
                  <div style={styles.skeletonSpotlight} />
                </div>
              ) : featuredTour ? (
                <div
                  style={styles.spotlightCard}
                  onClick={() => navigate(`/tour/${featuredTour.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      navigate(`/tour/${featuredTour.id}`);
                    }
                  }}
                >
                  <img
                    src={featuredTour.cover_url || FALLBACK_TOUR_IMAGE}
                    alt={featuredTour.title || "Featured tour"}
                    style={styles.spotlightImage}
                  />
                  <div style={styles.spotlightOverlay} />

                  <div style={styles.spotlightContent}>
                    <div style={styles.spotlightTopRow}>
                      <div style={styles.spotlightBadge}>
                        {getActivityLabel(featuredTour)}
                      </div>
                      <div style={styles.spotlightPrice}>
                        {getPriceLabel(featuredTour)}
                      </div>
                    </div>

                    <h2 style={styles.spotlightTitle}>
                      {featuredTour.title || "Untitled tour"}
                    </h2>

                    <div style={styles.spotlightLocation}>
                      <span>📍</span>
                      <span>{getLocationLabel(featuredTour)}</span>
                    </div>

                    <div style={styles.spotlightMeta}>
                      <span style={styles.spotlightChip}>
                        🥾 {featuredTour.difficulty || "All levels"}
                      </span>
                      <span style={styles.spotlightChip}>
                        ⏳ {featuredTour.duration || "1–3 days"}
                      </span>
                      <span style={styles.spotlightChip}>
                        👥{" "}
                        {featuredTour.max_people ||
                          featuredTour.capacity ||
                          "Small group"}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={styles.emptyCard}>
                  <div style={styles.emptyTitle}>Something good is coming</div>
                  <div style={styles.emptyText}>
                    As soon as tours appear, this spotlight becomes the thing
                    that instantly pulls people deeper into the app.
                  </div>
                </div>
              )}

              <div style={styles.sideMiniPanel}>
                <div style={styles.sideMiniCard}>
                  <div style={styles.sideMiniTitle}>Why this should work</div>
                  <div style={styles.sideMiniText}>
                    People do not want more listings. They want a reason to go
                    out and someone to do it with.
                  </div>
                </div>

                <div style={styles.sideMiniCard}>
                  <div style={styles.sideMiniTitle}>Quick next step</div>
                  <div style={styles.sideMiniText}>
                    Tap a category, open a tour, feel the vibe, make the plan.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          style={{
            ...styles.sectionWrapper,
            marginTop: isMobile ? 8 : 0,
          }}
        >
          <SectionHeader
            styles={styles}
            eyebrow="How it works"
            title="From scroll to real memory"
            subtitle="Make the first 20 seconds feel obvious, easy and exciting."
          />

          <div style={styles.howGrid}>
            <HowStep
              styles={styles}
              number="01"
              title="Discover"
              text="See things you'd actually want to do, not a wall of boring cards."
            />
            <HowStep
              styles={styles}
              number="02"
              title="Join"
              text="Open it, feel the vibe, check the details and commit without friction."
            />
            <HowStep
              styles={styles}
              number="03"
              title="Go outside"
              text="Turn a random scroll into a real plan, with real people and a real story."
            />
          </div>
        </section>

        <section style={styles.sectionWrapper}>
          <SectionHeader
            styles={styles}
            eyebrow="Categories"
            title="Choose your kind of adventure"
            subtitle="People stay longer when they can instantly find their lane."
          />

          <div style={styles.categoriesGrid}>
            {categories.map((cat) => (
              <CategoryCard
                key={cat.title}
                styles={styles}
                icon={cat.icon}
                title={cat.title}
                subtitle={cat.subtitle}
                onClick={() => navigate(cat.path)}
              />
            ))}
          </div>
        </section>

       <section style={styles.sectionWrapper}>
  <SectionHeader
    styles={styles}
    eyebrow="Live plans"
    title="Going now 🔥"
    subtitle="Instant plans happening soon. Fast energy, real people, zero overthinking."
    actionLabel="See all"
    onAction={() => navigate("/going-now")}
  />

  {loadingContent ? (
    <div style={styles.emptyCard}>
      <div style={styles.emptyTitle}>Loading live plans...</div>
      <div style={styles.emptyText}>
        We are checking if anyone is going out right now.
      </div>
    </div>
  ) : liveGoingNow.length === 0 ? (
    <div style={styles.emptyCard}>
      <div style={styles.emptyTitle}>No live plans yet</div>
      <div style={styles.emptyText}>
        Going now is connected, but there are no visible live plans at the moment.
      </div>
    </div>
  ) : (
    <div style={styles.grid} className="hide-scrollbar">
      {liveGoingNow.map(renderGoingNowCard)}
    </div>
  )}
</section>

        {newTours.length > 0 && (
          <section style={styles.sectionWrapper}>
            <SectionHeader
              styles={styles}
              eyebrow="New"
              title="Fresh adventures waiting for you ✨"
              subtitle="The newest things worth opening first."
              actionLabel="View all"
              onAction={() => navigate("/tours")}
            />

            <div style={styles.grid} className="hide-scrollbar">
              {newTours.map(renderTourCard)}
            </div>
          </section>
        )}

        {popularTours.length > 0 && (
          <section style={styles.sectionWrapper}>
            <SectionHeader
              styles={styles}
              eyebrow="Popular"
              title="What people are opening right now 🔥"
              subtitle="The fastest way to create curiosity is showing momentum."
              actionLabel="See more"
              onAction={() => navigate("/tours?sort=popular")}
            />

            <div style={styles.grid} className="hide-scrollbar">
              {popularTours.map(renderTourCard)}
            </div>
          </section>
        )}

        {trendingTours.length > 0 && (
          <section style={styles.sectionWrapper}>
            <SectionHeader
              styles={styles}
              eyebrow="Trending"
              title="Hard to ignore this week 📈"
              subtitle="Movement makes people click."
              actionLabel="Explore"
              onAction={() => navigate("/tours?sort=trending")}
            />

            <div style={styles.grid} className="hide-scrollbar">
              {trendingTours.map(renderTourCard)}
            </div>
          </section>
        )}

        {events.length > 0 && (
          <section style={styles.sectionWrapper}>
            <SectionHeader
              styles={styles}
              eyebrow="Events"
              title="Upcoming outdoor meetups 📅"
              subtitle="Easy social proof. Easy next action."
              actionLabel="See all"
              onAction={() => navigate("/events")}
            />

            <div style={styles.grid} className="hide-scrollbar">
              {events.map(renderEventCard)}
            </div>
          </section>
        )}

        {!newTours.length &&
          !popularTours.length &&
          !trendingTours.length &&
          !events.length && (
            <section style={styles.emptyState}>
              <div style={styles.emptyCard}>
                <div style={styles.emptyTitle}>
                  This is already a strong first impression
                </div>
                <div style={styles.emptyText}>
                  Once tours and events fill in, the page becomes much more
                  addictive because people will instantly have something real to
                  open.
                </div>
              </div>
            </section>
          )}

        <div style={styles.footerSpace} />
      </div>
    </>
  );
}