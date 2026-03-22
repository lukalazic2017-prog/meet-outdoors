// src/pages/Home.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

const HERO_IMAGE =
  "https://images.pexels.com/photos/1365425/pexels-photo-1365425.jpeg";
const MOBILE_BOTTOM_NAV_HEIGHT = 92;

const FALLBACK_TOUR_IMAGE =
  "https://images.pexels.com/photos/3324422/pexels-photo-3324422.jpeg";
const FALLBACK_EVENT_IMAGE =
  "https://images.pexels.com/photos/1761279/pexels-photo-1761279.jpeg";

const COLORS = {
  bg: "#06110d",
  bgSoft: "#0b1712",
  card: "rgba(10, 22, 17, 0.74)",
  card2: "rgba(8, 18, 14, 0.86)",
  line: "rgba(111, 255, 218, 0.14)",
  lineStrong: "rgba(111, 255, 218, 0.24)",
  text: "#f4fff9",
  textSoft: "rgba(228, 255, 247, 0.76)",
  textDim: "rgba(205, 236, 225, 0.62)",
  mint: "#37f2c3",
  mintBlue: "#2ee6ff",
  mintSoft: "#8fffe0",
  forest: "#123127",
  deep: "#08120e",
};

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

function SectionHeader({
  styles,
  eyebrow,
  title,
  subtitle,
  actionLabel,
  onAction,
  live = false,
}) {
  return (
    <div style={styles.sectionHeader}>
      <div>
        <div
          style={{
            ...styles.sectionEyebrow,
            ...(live ? styles.sectionEyebrowLive : {}),
          }}
        >
          {live ? <span style={styles.liveDotSmall} /> : null}
          <span>{eyebrow}</span>
        </div>

        <h2 style={styles.sectionTitle}>{title}</h2>
        {subtitle ? <p style={styles.sectionSubtitle}>{subtitle}</p> : null}
      </div>

      {actionLabel ? (
        <button type="button" style={styles.sectionAction} onClick={onAction}>
          <span>{actionLabel}</span>
          <span>→</span>
        </button>
      ) : null}
    </div>
  );
}

function ShortcutButton({ styles, icon, label, onClick, isMobile }) {
  const onEnter = (e) => {
    if (isMobile) return;
    e.currentTarget.style.transform = "translateY(-3px)";
    e.currentTarget.style.borderColor = COLORS.lineStrong;
    e.currentTarget.style.boxShadow =
      "0 18px 40px rgba(0,0,0,0.24), 0 0 0 1px rgba(55,242,195,0.08), inset 0 1px 0 rgba(255,255,255,0.05)";
  };

  const onLeave = (e) => {
    if (isMobile) return;
    e.currentTarget.style.transform = "translateY(0px)";
    e.currentTarget.style.borderColor = COLORS.line;
    e.currentTarget.style.boxShadow =
      "0 12px 30px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.04)";
  };

  return (
    <button
      type="button"
      style={styles.shortcutButton}
      onClick={onClick}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <span style={styles.shortcutIcon}>{icon}</span>
      <span style={styles.shortcutLabel}>{label}</span>
    </button>
  );
}

function SearchChip({ styles, icon, label, value }) {
  return (
    <div style={styles.searchChip}>
      <div style={styles.searchChipIcon}>{icon}</div>
      <div style={styles.searchChipTexts}>
        <div style={styles.searchChipLabel}>{label}</div>
        <div style={styles.searchChipValue}>{value}</div>
      </div>
    </div>
  );
}

function ExploreCard({
  item,
  styles,
  image,
  badge,
  price,
  title,
  location,
  chips = [],
  rightMeta,
  onClick,
  isMobile,
}) {
  const onEnter = (e) => {
    if (isMobile) return;
    e.currentTarget.style.transform = "translateY(-6px)";
    e.currentTarget.style.borderColor = COLORS.lineStrong;
    e.currentTarget.style.boxShadow =
      "0 26px 60px rgba(0,0,0,0.28), 0 0 0 1px rgba(55,242,195,0.08), inset 0 1px 0 rgba(255,255,255,0.05)";
    const img = e.currentTarget.querySelector("[data-explore-card-image]");
    if (img) img.style.transform = "scale(1.06)";
  };

  const onLeave = (e) => {
    if (isMobile) return;
    e.currentTarget.style.transform = "translateY(0px)";
    e.currentTarget.style.borderColor = COLORS.line;
    e.currentTarget.style.boxShadow =
      "0 14px 34px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.04)";
    const img = e.currentTarget.querySelector("[data-explore-card-image]");
    if (img) img.style.transform = "scale(1.02)";
  };

  return (
    <div
      key={item.id}
      style={styles.card}
      onClick={onClick}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick();
      }}
    >
      <div style={styles.cardMedia}>
        <img
          src={image}
          alt={title}
          style={styles.cardImage}
          data-explore-card-image
        />
        <div style={styles.cardMediaOverlayTop} />
        <div style={styles.cardMediaOverlayBottom} />

        <div style={styles.cardMediaTopRow}>
          <div style={styles.cardBadge}>{badge}</div>
          <div style={styles.cardPrice}>{price}</div>
        </div>
      </div>

      <div style={styles.cardBody}>
        <div style={styles.cardTitle}>{title}</div>

        <div style={styles.cardLocation}>
          <span>📍</span>
          <span>{location}</span>
        </div>

        <div style={styles.cardBottomRow}>
          <div style={styles.cardChips}>
            {chips.map((chip, idx) => (
              <span key={`${chip}-${idx}`} style={styles.cardChip}>
                {chip}
              </span>
            ))}
          </div>

          {rightMeta ? <div style={styles.cardMetaRight}>{rightMeta}</div> : null}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const isMobile = useIsMobile(768);

  const [loaded, setLoaded] = useState(false);
  const [tours, setTours] = useState([]);
  const [events, setEvents] = useState([]);
  const [goingNow, setGoingNow] = useState([]);
  const [loadingContent, setLoadingContent] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 120);

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

      setTours(toursData || []);
      setEvents(eventsData || []);
      setGoingNow(goingNowData || []);
      setLoadingContent(false);
    }

    loadContent();

    return () => clearTimeout(t);
  }, []);

  const getActivityLabel = (item) =>
    item.activity_type ||
    item.category ||
    item.type ||
    (item.is_event ? "Event" : "Adventure");

  const getLocationLabel = (item) =>
    item.location ||
    item.location_name ||
    item.location_text ||
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

  const getSpotsText = (item) => {
    if (item?.is_full) return "Full";
    if (typeof item?.spots_left === "number") return `${item.spots_left} spots left`;
    return "Open";
  };

  const newTours = tours.slice(0, 6);
  const popularTours = tours.slice(6, 10);
  const featuredTour = tours[0] || null;

  const featuredLive = goingNow[0] || null;
  const sideLive = goingNow.slice(1, 3);

  const upcomingEvents = events.slice(0, 6);

  const stats = useMemo(
    () => [
      { value: `${tours.length}+`, label: "Tours" },
      { value: `${events.length}+`, label: "Events" },
      { value: `${goingNow.length}+`, label: "Live plans" },
    ],
    [tours.length, events.length, goingNow.length]
  );

  const styles = useMemo(() => {
    return {
      page: {
        minHeight: "100vh",
        color: COLORS.text,
        marginTop: -200,
        background: `
          radial-gradient(circle at 12% 10%, rgba(46,230,255,0.10), transparent 22%),
          radial-gradient(circle at 80% 8%, rgba(55,242,195,0.10), transparent 24%),
          radial-gradient(circle at 50% 70%, rgba(143,255,224,0.04), transparent 30%),
          linear-gradient(180deg, #04100c 0%, #07130f 32%, #081611 65%, #091712 100%)
        `,
        fontFamily:
          "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        paddingBottom: isMobile ? MOBILE_BOTTOM_NAV_HEIGHT + 24 : 72,
      },

      hero: {
        position: "relative",
        minHeight: isMobile ? "90vh" : "100vh",
        display: "flex",
        alignItems: "flex-end",
        overflow: "hidden",
      },

      heroImage: {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        transform: loaded ? "scale(1.02)" : "scale(1.06)",
        transition: "transform 1.4s ease",
      },

      heroOverlay: {
        position: "absolute",
        inset: 0,
        background: isMobile
          ? "linear-gradient(to bottom, rgba(4,14,10,0.10) 0%, rgba(4,14,10,0.24) 20%, rgba(4,14,10,0.58) 58%, rgba(4,14,10,0.94) 100%)"
          : "linear-gradient(to bottom, rgba(4,14,10,0.06) 0%, rgba(4,14,10,0.16) 20%, rgba(4,14,10,0.50) 56%, rgba(4,14,10,0.94) 100%)",
      },

      heroGlow: {
        position: "absolute",
        top: isMobile ? 42 : 52,
        left: "50%",
        transform: "translateX(-50%)",
        width: isMobile ? "92%" : "62%",
        height: isMobile ? 180 : 260,
        borderRadius: 999,
        background:
          "radial-gradient(circle, rgba(55,242,195,0.18), rgba(46,230,255,0.08), transparent 72%)",
        filter: "blur(34px)",
        pointerEvents: "none",
      },

      heroInner: {
        position: "relative",
        zIndex: 2,
        width: "100%",
        maxWidth: 1280,
        margin: "0 auto",
        padding: isMobile ? "110px 16px 140px" : "118px 24px 190px",
      },

      heroContent: {
        maxWidth: 840,
        opacity: loaded ? 1 : 0,
        transform: loaded ? "translateY(0px)" : "translateY(24px)",
        transition: "opacity 0.85s ease, transform 0.85s ease",
      },

      heroEyebrow: {
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "9px 13px",
        borderRadius: 999,
        background: "rgba(6, 28, 21, 0.42)",
        border: `1px solid ${COLORS.lineStrong}`,
        color: COLORS.mintSoft,
        fontSize: isMobile ? 10 : 11,
        fontWeight: 900,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        marginBottom: isMobile ? 18 : 22,
        backdropFilter: "blur(12px)",
        boxShadow: "0 10px 28px rgba(0,0,0,0.16)",
      },

      heroTitle: {
        margin: 0,
        fontSize: isMobile ? 46 : 88,
        lineHeight: isMobile ? 0.96 : 0.88,
        fontWeight: 950,
        letterSpacing: "-0.065em",
        color: "#effff8",
        maxWidth: 900,
        textShadow: "0 12px 30px rgba(0,0,0,0.28)",
      },

      heroTitleAccent: {
        background: "linear-gradient(135deg, #37f2c3 0%, #2ee6ff 100%)",
        WebkitBackgroundClip: "text",
        color: "transparent",
      },

      heroSubtitle: {
        marginTop: 16,
        marginBottom: 0,
        maxWidth: 700,
        fontSize: isMobile ? 15 : 20,
        lineHeight: 1.62,
        color: "rgba(229,255,246,0.84)",
        fontWeight: 600,
      },

      heroActions: {
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        gap: 12,
        marginTop: isMobile ? 24 : 30,
        width: isMobile ? "100%" : "auto",
        maxWidth: isMobile ? 420 : "none",
      },

      heroPrimaryBtn: {
        appearance: "none",
        border: "none",
        outline: "none",
        padding: isMobile ? "16px 18px" : "16px 24px",
        borderRadius: 999,
        background: "linear-gradient(135deg, #37f2c3 0%, #2ee6ff 100%)",
        color: "#052018",
        fontWeight: 950,
        fontSize: 15,
        cursor: "pointer",
        boxShadow:
          "0 18px 38px rgba(55,242,195,0.24), 0 8px 24px rgba(0,0,0,0.18)",
      },

      heroGhostBtn: {
        appearance: "none",
        border: `1px solid ${COLORS.lineStrong}`,
        outline: "none",
        padding: isMobile ? "15px 18px" : "15px 22px",
        borderRadius: 999,
        background: "rgba(8, 26, 20, 0.38)",
        color: COLORS.text,
        fontWeight: 800,
        fontSize: 14,
        cursor: "pointer",
        backdropFilter: "blur(12px)",
      },

      floatingSearchWrap: {
        position: "relative",
        zIndex: 4,
        maxWidth: 1280,
        margin: isMobile ? "-78px auto 0" : "-82px auto 0",
        padding: isMobile ? "0 16px" : "0 24px",
      },

      floatingSearch: {
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1.2fr 0.9fr 0.9fr auto",
        gap: 10,
        padding: isMobile ? 12 : 14,
        borderRadius: isMobile ? 24 : 28,
        background: "rgba(7, 22, 17, 0.78)",
        border: `1px solid ${COLORS.lineStrong}`,
        boxShadow:
          "0 26px 70px rgba(0,0,0,0.34), 0 0 0 1px rgba(55,242,195,0.06), inset 0 1px 0 rgba(255,255,255,0.04)",
        backdropFilter: "blur(20px)",
      },

      searchChip: {
        minHeight: 66,
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 14px",
        borderRadius: 18,
        background: "rgba(255,255,255,0.03)",
        border: `1px solid ${COLORS.line}`,
      },

      searchChipIcon: {
        width: 40,
        height: 40,
        borderRadius: 14,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(145deg, rgba(55,242,195,0.14), rgba(46,230,255,0.14))",
        border: `1px solid ${COLORS.line}`,
        fontSize: 18,
        flex: "0 0 auto",
      },

      searchChipTexts: {
        minWidth: 0,
      },

      searchChipLabel: {
        fontSize: 10,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: COLORS.textDim,
        fontWeight: 800,
        marginBottom: 4,
      },

      searchChipValue: {
        fontSize: isMobile ? 13 : 14,
        color: COLORS.text,
        fontWeight: 800,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      },

      searchButton: {
        appearance: "none",
        border: "none",
        outline: "none",
        minHeight: 66,
        padding: isMobile ? "16px 18px" : "0 24px",
        borderRadius: 18,
        background: "linear-gradient(135deg, #37f2c3 0%, #2ee6ff 100%)",
        color: "#062119",
        fontWeight: 950,
        fontSize: 15,
        cursor: "pointer",
        boxShadow: "0 16px 34px rgba(55,242,195,0.18)",
      },

      section: {
        maxWidth: 1280,
        margin: "0 auto",
        padding: isMobile ? "30px 16px 0" : "38px 24px 0",
      },

      sectionHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        gap: 16,
        marginBottom: isMobile ? 14 : 18,
      },

      sectionEyebrow: {
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        fontSize: isMobile ? 10 : 11,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: COLORS.textDim,
        fontWeight: 900,
        marginBottom: 8,
      },

      sectionEyebrowLive: {
        color: COLORS.mintSoft,
      },

      liveDotSmall: {
        width: 8,
        height: 8,
        borderRadius: 999,
        background: COLORS.mint,
        boxShadow: "0 0 14px rgba(55,242,195,0.62)",
      },

      sectionTitle: {
        margin: 0,
        fontSize: isMobile ? 24 : 34,
        lineHeight: 1.05,
        fontWeight: 900,
        letterSpacing: "-0.04em",
        color: COLORS.text,
      },

      sectionSubtitle: {
        marginTop: 8,
        marginBottom: 0,
        maxWidth: 760,
        fontSize: isMobile ? 13 : 14,
        lineHeight: 1.6,
        color: COLORS.textSoft,
      },

      sectionAction: {
        appearance: "none",
        border: `1px solid ${COLORS.lineStrong}`,
        background: "rgba(7, 22, 17, 0.44)",
        color: COLORS.text,
        padding: isMobile ? "10px 12px" : "10px 14px",
        borderRadius: 999,
        fontWeight: 800,
        fontSize: isMobile ? 12 : 13,
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        cursor: "pointer",
        whiteSpace: "nowrap",
        backdropFilter: "blur(8px)",
      },

      featuredEditorial: {
        display: "grid",
        gridTemplateColumns: isMobile
          ? "1fr"
          : "minmax(0, 1.05fr) minmax(360px, 0.95fr)",
        gap: isMobile ? 14 : 18,
        alignItems: "stretch",
      },

      featuredImageCard: {
        position: "relative",
        overflow: "hidden",
        minHeight: isMobile ? 300 : 470,
        borderRadius: isMobile ? 28 : 32,
        border: `1px solid ${COLORS.lineStrong}`,
        background: "rgba(255,255,255,0.03)",
        boxShadow:
          "0 24px 62px rgba(0,0,0,0.24), 0 0 0 1px rgba(55,242,195,0.06), inset 0 1px 0 rgba(255,255,255,0.04)",
      },

      featuredImage: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        transform: "scale(1.03)",
      },

      featuredOverlay: {
        position: "absolute",
        inset: 0,
        background:
          "linear-gradient(to top, rgba(4,14,10,0.97), rgba(4,14,10,0.20) 48%, rgba(4,14,10,0.08))",
      },

      featuredImageContent: {
        position: "absolute",
        left: isMobile ? 16 : 20,
        right: isMobile ? 16 : 20,
        bottom: isMobile ? 16 : 20,
      },

      featuredBadge: {
        display: "inline-flex",
        alignItems: "center",
        padding: "7px 11px",
        borderRadius: 999,
        background: "linear-gradient(135deg, #37f2c3 0%, #2ee6ff 100%)",
        color: "#052018",
        fontWeight: 950,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        fontSize: 11,
        marginBottom: 10,
      },

      featuredImageTitle: {
        margin: 0,
        fontSize: isMobile ? 28 : 42,
        lineHeight: isMobile ? 1.02 : 0.98,
        fontWeight: 950,
        letterSpacing: "-0.045em",
        color: COLORS.text,
      },

      featuredImageMeta: {
        marginTop: 10,
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
      },

      featuredImageChip: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "8px 11px",
        borderRadius: 999,
        background: "rgba(8, 30, 23, 0.50)",
        border: `1px solid ${COLORS.line}`,
        color: COLORS.text,
        fontSize: 12,
        fontWeight: 700,
      },

      featuredTextCard: {
        borderRadius: isMobile ? 28 : 32,
        padding: isMobile ? "20px 18px" : "28px 26px",
        background:
          "linear-gradient(145deg, rgba(8,24,18,0.78), rgba(7,18,14,0.90))",
        border: `1px solid ${COLORS.lineStrong}`,
        boxShadow:
          "0 20px 52px rgba(0,0,0,0.20), 0 0 0 1px rgba(55,242,195,0.05), inset 0 1px 0 rgba(255,255,255,0.03)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      },

      editorialKicker: {
        fontSize: 11,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: COLORS.mintSoft,
        fontWeight: 900,
        marginBottom: 12,
      },

      editorialTitle: {
        margin: 0,
        fontSize: isMobile ? 30 : 44,
        lineHeight: isMobile ? 1.03 : 1.02,
        fontWeight: 950,
        color: COLORS.text,
        letterSpacing: "-0.05em",
      },

      editorialText: {
        marginTop: 14,
        marginBottom: 0,
        fontSize: isMobile ? 14 : 15,
        lineHeight: 1.72,
        color: COLORS.textSoft,
      },

      editorialStats: {
        display: "grid",
        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        gap: 10,
        marginTop: 18,
      },

      editorialStat: {
        padding: "12px 12px",
        borderRadius: 18,
        background: "rgba(255,255,255,0.03)",
        border: `1px solid ${COLORS.line}`,
      },

      editorialStatValue: {
        fontSize: isMobile ? 18 : 20,
        fontWeight: 950,
        color: COLORS.text,
        marginBottom: 3,
      },

      editorialStatLabel: {
        fontSize: 12,
        color: COLORS.textDim,
      },

      editorialActions: {
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        gap: 10,
        marginTop: 18,
      },

      editorialPrimary: {
        appearance: "none",
        border: "none",
        outline: "none",
        padding: "15px 18px",
        borderRadius: 999,
        background: "linear-gradient(135deg, #37f2c3 0%, #2ee6ff 100%)",
        color: "#052018",
        fontWeight: 950,
        fontSize: 15,
        cursor: "pointer",
      },

      editorialGhost: {
        appearance: "none",
        border: `1px solid ${COLORS.lineStrong}`,
        outline: "none",
        padding: "14px 18px",
        borderRadius: 999,
        background: "rgba(8, 26, 20, 0.38)",
        color: COLORS.text,
        fontWeight: 800,
        fontSize: 14,
        cursor: "pointer",
      },

      shortcutsRow: {
        display: "flex",
        gap: 12,
        overflowX: "auto",
        paddingBottom: 4,
        scrollbarWidth: "none",
      },

      shortcutButton: {
        appearance: "none",
        border: `1px solid ${COLORS.line}`,
        background:
          "linear-gradient(145deg, rgba(8,24,18,0.74), rgba(7,18,14,0.88))",
        color: COLORS.text,
        borderRadius: 20,
        padding: "14px 16px",
        display: "inline-flex",
        alignItems: "center",
        gap: 12,
        whiteSpace: "nowrap",
        cursor: "pointer",
        boxShadow:
          "0 12px 30px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.04)",
        minWidth: isMobile ? "auto" : 170,
        transition:
          "transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease",
      },

      shortcutIcon: {
        width: 42,
        height: 42,
        borderRadius: 14,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(145deg, rgba(55,242,195,0.14), rgba(46,230,255,0.14))",
        border: `1px solid ${COLORS.line}`,
        fontSize: 20,
      },

      shortcutLabel: {
        fontSize: 14,
        fontWeight: 850,
        color: COLORS.text,
      },

      livePanel: {
        borderRadius: isMobile ? 28 : 34,
        padding: isMobile ? "16px" : "22px",
        background:
          "linear-gradient(145deg, rgba(8,24,18,0.76), rgba(7,17,13,0.92))",
        border: `1px solid ${COLORS.lineStrong}`,
        boxShadow:
          "0 22px 60px rgba(0,0,0,0.22), 0 0 0 1px rgba(55,242,195,0.06), inset 0 1px 0 rgba(255,255,255,0.03)",
      },

      liveGrid: {
        display: "grid",
        gridTemplateColumns: isMobile
          ? "1fr"
          : "minmax(0, 1.08fr) minmax(320px, 0.92fr)",
        gap: isMobile ? 14 : 18,
      },

      liveFeaturedCard: {
        position: "relative",
        overflow: "hidden",
        minHeight: isMobile ? 360 : 520,
        borderRadius: isMobile ? 24 : 28,
        border: `1px solid ${COLORS.lineStrong}`,
        background:
          "linear-gradient(145deg, rgba(8,24,18,0.72), rgba(7,17,13,0.92))",
        boxShadow:
          "0 22px 60px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.04)",
        cursor: "pointer",
      },

      liveFeaturedImage: {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        transform: "scale(1.03)",
      },

      liveFeaturedOverlay: {
        position: "absolute",
        inset: 0,
        background:
          "linear-gradient(to top, rgba(4,14,10,0.98), rgba(4,14,10,0.26) 44%, rgba(4,14,10,0.10))",
      },

      liveFeaturedContent: {
        position: "absolute",
        left: isMobile ? 16 : 22,
        right: isMobile ? 16 : 22,
        bottom: isMobile ? 16 : 22,
      },

      liveFeaturedTopRow: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 10,
      },

      liveUrgentBadge: {
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        borderRadius: 999,
        background: "linear-gradient(135deg, #37f2c3 0%, #2ee6ff 100%)",
        color: "#052018",
        fontSize: 11,
        fontWeight: 950,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
      },

      liveStatusPill: {
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        borderRadius: 999,
        background: "rgba(8, 28, 21, 0.52)",
        border: `1px solid ${COLORS.line}`,
        color: COLORS.text,
        fontSize: 11,
        fontWeight: 800,
      },

      liveFeaturedTitle: {
        margin: 0,
        fontSize: isMobile ? 30 : 46,
        lineHeight: isMobile ? 1.02 : 0.98,
        fontWeight: 950,
        letterSpacing: "-0.05em",
        color: COLORS.text,
        maxWidth: 700,
      },

      liveFeaturedText: {
        marginTop: 10,
        marginBottom: 0,
        fontSize: isMobile ? 14 : 15,
        lineHeight: 1.64,
        color: COLORS.textSoft,
        maxWidth: 640,
      },

      liveMetaRow: {
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        marginTop: 12,
      },

      liveMetaChip: {
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        padding: "8px 11px",
        borderRadius: 999,
        background: "rgba(8, 30, 23, 0.52)",
        border: `1px solid ${COLORS.line}`,
        color: COLORS.text,
        fontSize: 12,
        fontWeight: 700,
      },

      liveButtons: {
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        gap: 10,
        marginTop: 14,
      },

      livePrimary: {
        appearance: "none",
        border: "none",
        outline: "none",
        padding: isMobile ? "15px 18px" : "14px 22px",
        borderRadius: 999,
        background: "linear-gradient(135deg, #37f2c3 0%, #2ee6ff 100%)",
        color: "#052018",
        fontWeight: 950,
        fontSize: 15,
        cursor: "pointer",
      },

      liveGhost: {
        appearance: "none",
        border: `1px solid ${COLORS.lineStrong}`,
        outline: "none",
        padding: isMobile ? "14px 18px" : "14px 20px",
        borderRadius: 999,
        background: "rgba(8, 26, 20, 0.38)",
        color: COLORS.text,
        fontWeight: 800,
        fontSize: 14,
        cursor: "pointer",
      },

      stackedCards: {
        display: "grid",
        gridTemplateColumns: "1fr",
        gap: 14,
      },

      stackedCard: {
        position: "relative",
        overflow: "hidden",
        minHeight: 252,
        borderRadius: 22,
        border: `1px solid ${COLORS.line}`,
        background:
          "linear-gradient(155deg, rgba(8,24,18,0.72), rgba(7,17,13,0.88))",
        boxShadow:
          "0 14px 34px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.04)",
        cursor: "pointer",
      },

      stackedCardImage: {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        transform: "scale(1.03)",
      },

      stackedCardOverlay: {
        position: "absolute",
        inset: 0,
        background:
          "linear-gradient(to top, rgba(4,14,10,0.98), rgba(4,14,10,0.24) 48%)",
      },

      stackedCardContent: {
        position: "absolute",
        left: 16,
        right: 16,
        bottom: 16,
      },

      stackedCardTitle: {
        margin: "8px 0 0",
        fontSize: 21,
        lineHeight: 1.05,
        fontWeight: 900,
        color: COLORS.text,
      },

      rail: {
        display: "flex",
        gap: 14,
        overflowX: "auto",
        paddingBottom: 8,
        scrollSnapType: "x mandatory",
      },

      popularGrid: {
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1.05fr 0.95fr",
        gap: isMobile ? 14 : 18,
      },

      popularLeft: {
        display: "grid",
        gap: 18,
      },

      popularRight: {
        display: "grid",
        gap: 18,
      },

      card: {
        position: "relative",
        overflow: "hidden",
        borderRadius: 24,
        background:
          "linear-gradient(155deg, rgba(8,24,18,0.74), rgba(7,17,13,0.90))",
        border: `1px solid ${COLORS.line}`,
        backdropFilter: "blur(10px)",
        cursor: "pointer",
        transition:
          "transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease",
        boxShadow:
          "0 14px 34px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.04)",
        minWidth: isMobile ? "84vw" : "auto",
        flex: isMobile ? "0 0 84vw" : "unset",
        scrollSnapAlign: isMobile ? "start" : "none",
      },

      cardMedia: {
        position: "relative",
        width: "100%",
        height: isMobile ? 198 : 228,
        overflow: "hidden",
      },

      cardImage: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        transform: "scale(1.02)",
        transition: "transform 0.45s ease",
      },

      cardMediaOverlayTop: {
        position: "absolute",
        inset: 0,
        background:
          "linear-gradient(to bottom, rgba(0,0,0,0.08), rgba(0,0,0,0.24))",
      },

      cardMediaOverlayBottom: {
        position: "absolute",
        inset: 0,
        background:
          "linear-gradient(to top, rgba(4,14,10,0.96), rgba(4,14,10,0.08) 48%)",
      },

      cardMediaTopRow: {
        position: "absolute",
        top: 12,
        left: 12,
        right: 12,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 8,
      },

      cardBadge: {
        display: "inline-flex",
        alignItems: "center",
        padding: "6px 10px",
        borderRadius: 999,
        background: "linear-gradient(135deg, #37f2c3 0%, #2ee6ff 100%)",
        color: "#052018",
        fontWeight: 950,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        fontSize: 11,
        maxWidth: "65%",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      },

      cardPrice: {
        display: "inline-flex",
        alignItems: "center",
        padding: "6px 10px",
        borderRadius: 999,
        background: "rgba(8, 28, 21, 0.54)",
        border: `1px solid ${COLORS.line}`,
        color: COLORS.text,
        fontWeight: 700,
        fontSize: 11,
        whiteSpace: "nowrap",
      },

      cardBody: {
        padding: isMobile ? 14 : 16,
      },

      cardTitle: {
        fontSize: isMobile ? 17 : 19,
        fontWeight: 900,
        lineHeight: 1.14,
        color: COLORS.text,
        marginBottom: 8,
      },

      cardLocation: {
        display: "flex",
        alignItems: "center",
        gap: 7,
        fontSize: isMobile ? 12 : 13,
        color: COLORS.textSoft,
        marginBottom: 12,
      },

      cardBottomRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        fontSize: isMobile ? 11 : 12,
        color: COLORS.textSoft,
      },

      cardChips: {
        display: "flex",
        gap: 7,
        flexWrap: "wrap",
      },

      cardChip: {
        display: "inline-flex",
        alignItems: "center",
        padding: "5px 9px",
        borderRadius: 999,
        background: "rgba(255,255,255,0.03)",
        border: `1px solid ${COLORS.line}`,
        color: COLORS.text,
        fontWeight: 700,
      },

      cardMetaRight: {
        whiteSpace: "nowrap",
        fontWeight: 700,
        color: COLORS.text,
      },

      emptyCard: {
        borderRadius: 24,
        padding: isMobile ? "18px" : "24px",
        background:
          "linear-gradient(145deg, rgba(8,24,18,0.72), rgba(7,17,13,0.88))",
        border: `1px solid ${COLORS.line}`,
        boxShadow: "0 16px 38px rgba(0,0,0,0.16)",
      },

      emptyTitle: {
        fontSize: isMobile ? 20 : 24,
        fontWeight: 900,
        marginBottom: 8,
        color: COLORS.text,
      },

      emptyText: {
        fontSize: isMobile ? 14 : 15,
        lineHeight: 1.6,
        color: COLORS.textSoft,
        maxWidth: 720,
      },
    };
  }, [isMobile, loaded]);

  const featuredTitle =
    featuredTour?.title || "Your next outdoor story starts here";
  const featuredLocation = featuredTour
    ? getLocationLabel(featuredTour)
    : "Anywhere nature calls you";

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <img src={HERO_IMAGE} alt="MeetOutdoors hero" style={styles.heroImage} />
        <div style={styles.heroOverlay} />
        <div style={styles.heroGlow} />

        <div style={styles.heroInner}>
          <div style={styles.heroContent}>
            <div style={styles.heroEyebrow}>
              <span style={styles.liveDotSmall} />
              <span>Outdoor social app</span>
            </div>

            <h1 style={styles.heroTitle}>
              Find people.
              <br />
              Go outside.
              <br />
              <span style={styles.heroTitleAccent}>Do something real.</span>
            </h1>

            <p style={styles.heroSubtitle}>
              Hikes, trips and spontaneous plans with real people near you.
            </p>

            <div style={styles.heroActions}>
              <button
                type="button"
                style={styles.heroPrimaryBtn}
                onClick={() => navigate("/tours")}
              >
                Explore adventures
              </button>

              <button
                type="button"
                style={styles.heroGhostBtn}
                onClick={() => navigate("/going-now")}
              >
                What&apos;s happening now
              </button>
            </div>
          </div>
        </div>
      </section>

      <div style={styles.floatingSearchWrap}>
        <div style={styles.floatingSearch}>
          <SearchChip
            styles={styles}
            icon="📍"
            label="Where to"
            value="Mountains, lakes, city escapes"
          />
          <SearchChip
            styles={styles}
            icon="🥾"
            label="Activity"
            value="Hiking, camping, rafting"
          />
          <SearchChip
            styles={styles}
            icon="📅"
            label="When"
            value="This weekend"
          />

          <button
            type="button"
            style={styles.searchButton}
            onClick={() => navigate("/tours")}
          >
            Search
          </button>
        </div>
      </div>

      <section style={styles.section}>
        <SectionHeader
          styles={styles}
          eyebrow="Featured adventure"
          title="This weekend starts here"
          subtitle="Hand-picked outdoor plans designed to get you outside faster. Less scrolling. More doing."
        />

        <div style={styles.featuredEditorial}>
          <div
            style={styles.featuredImageCard}
            onClick={() =>
              featuredTour ? navigate(`/tour/${featuredTour.id}`) : navigate("/tours")
            }
          >
            <img
              src={featuredTour?.cover_url || FALLBACK_TOUR_IMAGE}
              alt={featuredTitle}
              style={styles.featuredImage}
            />
            <div style={styles.featuredOverlay} />

            <div style={styles.featuredImageContent}>
              <div style={styles.featuredBadge}>
                {featuredTour ? getActivityLabel(featuredTour) : "Adventure"}
              </div>

              <h3 style={styles.featuredImageTitle}>{featuredTitle}</h3>

              <div style={styles.featuredImageMeta}>
                <span style={styles.featuredImageChip}>📍 {featuredLocation}</span>
                <span style={styles.featuredImageChip}>
                  💸 {featuredTour ? getPriceLabel(featuredTour) : "Flexible"}
                </span>
                <span style={styles.featuredImageChip}>
                  👥 {featuredTour?.max_people || featuredTour?.capacity || "Small group"}
                </span>
              </div>
            </div>
          </div>

          <div style={styles.featuredTextCard}>
            <div style={styles.editorialKicker}>Editor&apos;s pick</div>

            <h3 style={styles.editorialTitle}>
              Curated escapes for people who prefer fresh air over endless feeds.
            </h3>

            <p style={styles.editorialText}>
              Discover standout hikes, social adventures and outdoor moments worth
              leaving the house for.
            </p>

            <div style={styles.editorialStats}>
              {stats.map((stat) => (
                <div key={stat.label} style={styles.editorialStat}>
                  <div style={styles.editorialStatValue}>{stat.value}</div>
                  <div style={styles.editorialStatLabel}>{stat.label}</div>
                </div>
              ))}
            </div>

            <div style={styles.editorialActions}>
              <button
                type="button"
                style={styles.editorialPrimary}
                onClick={() =>
                  featuredTour ? navigate(`/tour/${featuredTour.id}`) : navigate("/tours")
                }
              >
                Open featured
              </button>

              <button
                type="button"
                style={styles.editorialGhost}
                onClick={() => navigate("/events")}
              >
                Browse events
              </button>
            </div>
          </div>
        </div>
      </section>

      <section style={styles.section}>
        <SectionHeader
          styles={styles}
          eyebrow="Quick actions"
          title="Move fast"
          subtitle="Jump straight into the things people actually use."
        />

        <div style={styles.shortcutsRow}>
          <ShortcutButton
            styles={styles}
            icon="✨"
            label="Create tour"
            onClick={() => navigate("/create-tour")}
            isMobile={isMobile}
          />
          <ShortcutButton
            styles={styles}
            icon="🔴"
            label="Going now"
            onClick={() => navigate("/going-now")}
            isMobile={isMobile}
          />
          <ShortcutButton
            styles={styles}
            icon="🎫"
            label="Events"
            onClick={() => navigate("/events")}
            isMobile={isMobile}
          />
          <ShortcutButton
            styles={styles}
            icon="🧭"
            label="Explore"
            onClick={() => navigate("/tours")}
            isMobile={isMobile}
          />
          <ShortcutButton
            styles={styles}
            icon="👥"
            label="Community"
            onClick={() => navigate("/community")}
            isMobile={isMobile}
          />
        </div>
      </section>

      <section style={styles.section}>
        <div style={styles.livePanel}>
          <SectionHeader
            styles={styles}
            eyebrow="Live right now"
            title="Spontaneous outdoor plans happening near you"
            subtitle="See what people are doing in real time and jump in while the moment is still alive."
            actionLabel="Open Going Now"
            onAction={() => navigate("/going-now")}
            live
          />

          {featuredLive ? (
            <div style={styles.liveGrid}>
              <div
                style={styles.liveFeaturedCard}
                onClick={() => navigate("/going-now")}
              >
                <img
                  src={featuredLive.cover_url || FALLBACK_EVENT_IMAGE}
                  alt={featuredLive.title || "Live now"}
                  style={styles.liveFeaturedImage}
                />
                <div style={styles.liveFeaturedOverlay} />

                <div style={styles.liveFeaturedContent}>
                  <div style={styles.liveFeaturedTopRow}>
                    <div style={styles.liveUrgentBadge}>Live now</div>
                    <div style={styles.liveStatusPill}>
                      {getGoingNowTimeLabel(featuredLive)}
                    </div>
                  </div>

                  <h3 style={styles.liveFeaturedTitle}>
                    {featuredLive.title || "Something real is happening right now"}
                  </h3>

                  <p style={styles.liveFeaturedText}>
                    Last-minute plans, local energy and real people getting outside
                    without waiting for next week.
                  </p>

                  <div style={styles.liveMetaRow}>
                    <span style={styles.liveMetaChip}>
                      📍 {getLocationLabel(featuredLive)}
                    </span>
                    <span style={styles.liveMetaChip}>
                      👥 {getSpotsText(featuredLive)}
                    </span>
                    <span style={styles.liveMetaChip}>
                      💸 {getPriceLabel(featuredLive)}
                    </span>
                  </div>

                  <div style={styles.liveButtons}>
                    <button
                      type="button"
                      style={styles.livePrimary}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate("/going-now");
                      }}
                    >
                      Join the vibe
                    </button>

                    <button
                      type="button"
                      style={styles.liveGhost}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate("/events");
                      }}
                    >
                      More live plans
                    </button>
                  </div>
                </div>
              </div>

              <div style={styles.stackedCards}>
                {sideLive.map((item) => (
                  <div
                    key={item.id}
                    style={styles.stackedCard}
                    onClick={() => navigate("/going-now")}
                  >
                    <img
                      src={item.cover_url || FALLBACK_EVENT_IMAGE}
                      alt={item.title || "Live plan"}
                      style={styles.stackedCardImage}
                    />
                    <div style={styles.stackedCardOverlay} />

                    <div style={styles.stackedCardContent}>
                      <div style={styles.featuredBadge}>Live now</div>
                      <h4 style={styles.stackedCardTitle}>
                        {item.title || "Live activity"}
                      </h4>
                      <div style={styles.liveMetaRow}>
                        <span style={styles.liveMetaChip}>
                          📍 {getLocationLabel(item)}
                        </span>
                        <span style={styles.liveMetaChip}>
                          ⏰ {getGoingNowTimeLabel(item)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={styles.emptyCard}>
              <div style={styles.emptyTitle}>No live plans yet</div>
              <div style={styles.emptyText}>
                As soon as people start posting spontaneous meetups, this becomes
                your real-time social panel.
              </div>
            </div>
          )}
        </div>
      </section>

      <section style={styles.section}>
        <SectionHeader
          styles={styles}
          eyebrow="Fresh adventures"
          title="Newly created outdoor plans"
          subtitle="The latest tours people can join right now."
          actionLabel="See all tours"
          onAction={() => navigate("/tours")}
        />

        {newTours.length ? (
          <div style={styles.rail}>
            {newTours.map((tour) => (
              <ExploreCard
                key={tour.id}
                item={tour}
                styles={styles}
                image={tour.cover_url || FALLBACK_TOUR_IMAGE}
                badge={getActivityLabel(tour)}
                price={getPriceLabel(tour)}
                title={tour.title || "Untitled tour"}
                location={getLocationLabel(tour)}
                chips={[tour.difficulty || "All levels", tour.duration || "1–3 days"]}
                rightMeta={`👥 ${tour.max_people || tour.capacity || "Small group"}`}
                onClick={() => navigate(`/tour/${tour.id}`)}
                isMobile={isMobile}
              />
            ))}
          </div>
        ) : (
          <div style={styles.emptyCard}>
            <div style={styles.emptyTitle}>No tours yet</div>
            <div style={styles.emptyText}>
              Create the first tour and this rail becomes your freshest entry point.
            </div>
          </div>
        )}
      </section>

      <section style={styles.section}>
        <SectionHeader
          styles={styles}
          eyebrow="Popular this week"
          title="The most joined adventures"
          subtitle="Outdoor plans getting the most attention from the community."
          actionLabel="Browse all"
          onAction={() => navigate("/tours")}
        />

        {popularTours.length ? (
          <div style={styles.popularGrid}>
            <div style={styles.popularLeft}>
              {popularTours.slice(0, 2).map((tour) => (
                <ExploreCard
                  key={tour.id}
                  item={tour}
                  styles={styles}
                  image={tour.cover_url || FALLBACK_TOUR_IMAGE}
                  badge={getActivityLabel(tour)}
                  price={getPriceLabel(tour)}
                  title={tour.title || "Untitled tour"}
                  location={getLocationLabel(tour)}
                  chips={[tour.difficulty || "All levels", tour.duration || "1–3 days"]}
                  rightMeta={`👥 ${tour.max_people || tour.capacity || "Small group"}`}
                  onClick={() => navigate(`/tour/${tour.id}`)}
                  isMobile={isMobile}
                />
              ))}
            </div>

            <div style={styles.popularRight}>
              {popularTours.slice(2, 4).map((tour) => (
                <ExploreCard
                  key={tour.id}
                  item={tour}
                  styles={styles}
                  image={tour.cover_url || FALLBACK_TOUR_IMAGE}
                  badge={getActivityLabel(tour)}
                  price={getPriceLabel(tour)}
                  title={tour.title || "Untitled tour"}
                  location={getLocationLabel(tour)}
                  chips={[tour.difficulty || "All levels", tour.duration || "1–3 days"]}
                  rightMeta={`👥 ${tour.max_people || tour.capacity || "Small group"}`}
                  onClick={() => navigate(`/tour/${tour.id}`)}
                  isMobile={isMobile}
                />
              ))}
            </div>
          </div>
        ) : (
          <div style={styles.emptyCard}>
            <div style={styles.emptyTitle}>No popular picks yet</div>
            <div style={styles.emptyText}>
              When tours start getting traction, this section becomes your strongest
              discovery block.
            </div>
          </div>
        )}
      </section>

      <section style={styles.section}>
        <SectionHeader
          styles={styles}
          eyebrow="Upcoming events"
          title="Meetups, hikes and outdoor gatherings"
          subtitle="Same premium card style, but focused on event energy."
          actionLabel="All events"
          onAction={() => navigate("/events")}
        />

        {upcomingEvents.length ? (
          <div style={styles.rail}>
            {upcomingEvents.map((eventItem) => (
              <ExploreCard
                key={eventItem.id}
                item={eventItem}
                styles={styles}
                image={eventItem.cover_url || FALLBACK_EVENT_IMAGE}
                badge={getActivityLabel(eventItem)}
                price={getPriceLabel(eventItem)}
                title={eventItem.title || "Untitled event"}
                location={getLocationLabel(eventItem)}
                chips={[
                  getEventDateLabel(eventItem),
                  eventItem.category || eventItem.type || "Outdoor event",
                ]}
                rightMeta={`🎫 ${
                  eventItem.max_people || eventItem.capacity || "Open spots"
                }`}
                onClick={() => navigate(`/event/${eventItem.id}`)}
                isMobile={isMobile}
              />
            ))}
          </div>
        ) : (
          <div style={styles.emptyCard}>
            <div style={styles.emptyTitle}>No events yet</div>
            <div style={styles.emptyText}>
              When events start landing, they’ll appear here with the same premium
              visual system as tours.
            </div>
          </div>
        )}
      </section>

      {loadingContent ? (
        <section style={styles.section}>
          <div style={styles.emptyCard}>
            <div style={styles.emptyTitle}>Loading home content…</div>
            <div style={styles.emptyText}>
              Pulling tours, events and live plans from Supabase.
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}