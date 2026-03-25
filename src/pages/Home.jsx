// src/pages/Home.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
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
  card: "rgba(8, 19, 15, 0.84)",
  line: "rgba(111, 255, 218, 0.12)",
  lineStrong: "rgba(111, 255, 218, 0.24)",
  text: "#f4fff9",
  textSoft: "rgba(228, 255, 247, 0.78)",
  textDim: "rgba(205, 236, 225, 0.62)",
  mint: "#37f2c3",
  mintBlue: "#2ee6ff",
  mintSoft: "#8fffe0",
};

function useIsMobile(breakpoint = 768) {
  const getValue = useCallback(() => {
    return typeof window !== "undefined" ? window.innerWidth <= breakpoint : false;
  }, [breakpoint]);

  const [isMobile, setIsMobile] = useState(getValue);

  useEffect(() => {
    const onResize = () => setIsMobile(getValue());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [getValue]);

  return isMobile;
}

function SectionHeader({ styles, eyebrow, title, subtitle, actionLabel, onAction, live = false }) {
  return (
    <div style={styles.sectionHeader}>
      <div>
        <div style={{ ...styles.sectionEyebrow, ...(live ? styles.sectionEyebrowLive : {}) }}>
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

function HorizontalRail({ styles, railRef, children, isMobile }) {
  return (
    <div style={styles.railShell}>
      {!isMobile ? (
        <button
          type="button"
          style={{ ...styles.railArrow, left: 0 }}
          onClick={() => railRef.current?.scrollBy({ left: -340, behavior: "smooth" })}
        >
          ←
        </button>
      ) : null}

      <div ref={railRef} style={styles.rail}>
        {children}
      </div>

      {!isMobile ? (
        <button
          type="button"
          style={{ ...styles.railArrow, right: 0 }}
          onClick={() => railRef.current?.scrollBy({ left: 340, behavior: "smooth" })}
        >
          →
        </button>
      ) : null}
    </div>
  );
}

function GoingNowMainCard({ item, styles, onClick }) {
  const image = item?.media_url || item?.cover_url || FALLBACK_EVENT_IMAGE;
  const location =
    item?.location_text ||
    item?.location ||
    [item?.city, item?.country].filter(Boolean).join(", ") ||
    "Unknown location";
  const participantsCount = item?.participants_count ?? 0;
  const startsAt = item?.starts_at ? new Date(item.starts_at) : null;
  const timeLabel = startsAt && !Number.isNaN(startsAt.getTime())
    ? startsAt.toLocaleString(undefined, {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Starting soon";

  return (
    <div style={styles.liveFeaturedCard} onClick={onClick} role="button" tabIndex={0}>
      <img src={image} alt={item?.title || "Live plan"} style={styles.liveFeaturedImage} />
      <div style={styles.liveFeaturedOverlay} />

      <div style={styles.liveFeaturedContent}>
        <div style={styles.liveFeaturedTopRow}>
          <div style={styles.liveUrgentBadge}>
            <span style={styles.liveDotSmall} />
            <span>Live now</span>
          </div>
          <div style={styles.liveStatusPill}>{timeLabel}</div>
        </div>

        <h3 style={styles.liveFeaturedTitle}>{item?.title || "Something real is happening right now"}</h3>
        <div style={styles.liveMetaRow}>
          <span style={styles.liveMetaChip}>📍 {location}</span>
          <span style={styles.liveMetaChip}>👥 {participantsCount} inside</span>
          {item?.category ? <span style={styles.liveMetaChip}>{item.category}</span> : null}
        </div>

        <div style={styles.liveButtons}>
          <button
            type="button"
            style={styles.livePrimary}
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            Open live plan
          </button>
          <button
            type="button"
            style={styles.liveGhost}
            onClick={(e) => {
              e.stopPropagation();
              window.location.href = "/create-going-now";
            }}
          >
            Create yours
          </button>
        </div>
      </div>
    </div>
  );
}

function GoingNowSwipeCard({ item, styles, onClick, compact = false }) {
  const image = item?.media_url || item?.cover_url || FALLBACK_EVENT_IMAGE;
  const location =
    item?.location_text ||
    item?.location ||
    [item?.city, item?.country].filter(Boolean).join(", ") ||
    "Unknown location";

  const participantsCount = item?.participants_count ?? 0;
  const startsAt = item?.starts_at ? new Date(item.starts_at) : null;
  const timeLabel = startsAt && !Number.isNaN(startsAt.getTime())
    ? startsAt.toLocaleString(undefined, {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Starting soon";

  return (
    <div
      style={{ ...styles.goingCard, ...(compact ? styles.goingCardCompact : {}) }}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <img src={image} alt={item?.title || "Going now"} style={styles.goingCardImage} />
      <div style={styles.goingCardOverlayTop} />
      <div style={styles.goingCardOverlayBottom} />

      <div style={styles.goingCardTop}>
        <div style={styles.goingLivePill}>
          <span style={styles.liveDotSmall} />
          <span>{compact ? "Soon" : "Live"}</span>
        </div>
        <div style={styles.goingGhostPill}>{timeLabel}</div>
      </div>

      <div style={styles.goingCardBottom}>
        <h3 style={styles.goingCardTitle}>{item?.title || "Live plan"}</h3>
        <div style={styles.goingCardMetaLine}>📍 {location}</div>
        <div style={styles.goingCardFooter}>
          <div style={styles.goingParticipantsPill}>👥 {participantsCount} inside</div>
          <div style={styles.goingActionPill}>Open →</div>
        </div>
      </div>
    </div>
  );
}

function ExploreCard({ item, styles, image, badge, price, title, location, chips = [], rightMeta, onClick }) {
  return (
    <div
      key={item.id}
      style={styles.card}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick();
      }}
    >
      <div style={styles.cardMedia}>
        <img src={image} alt={title} style={styles.cardImage} />
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

function VotingBanner({ styles, leaderName, leaderVotes, countdown, onOpenVoting }) {
  return (
    <div style={styles.votingBanner}>
      <div style={styles.votingGlowA} />
      <div style={styles.votingGlowB} />

      <div style={styles.votingBannerTop}>
        <div style={styles.votingEyebrow}>
          <span style={styles.liveDotSmall} />
          <span>Live city voting</span>
        </div>

        <div style={styles.votingStatusChip}>
          <span>🏆</span>
          <span>Trenutno vodi: {leaderName}</span>
        </div>
      </div>

      <div style={styles.votingBannerGrid}>
        <div style={styles.votingContent}>
          <h2 style={styles.votingTitle}>Glasaj za svoj grad</h2>
          <p style={styles.votingText}>
            Grad sa najviše glasova dobija <strong>IZAĐI NAPOLJE EVENT #1</strong>.
            Učesnici pobedničkog eventa ulaze u izbor za <strong>3 nagrade</strong>:
            glavna nagrada je <strong>tandem skok padobranom</strong>, a još dve nagrade su
            <strong> let avionom</strong>.
          </p>

          <div style={styles.votingActionRow}>
            <button type="button" style={styles.votingPrimaryBtn} onClick={onOpenVoting}>
              Otvori glasanje
            </button>
            <div style={styles.votingCountdownChip}>
              <span>⏳</span>
              <span>{countdown}</span>
            </div>
          </div>
        </div>

        <div style={styles.votingStatsWrap}>
          <div style={styles.votingStatCard}>
            <div style={styles.votingStatLabel}>Vodeći grad</div>
            <div style={styles.votingStatValue}>{leaderName}</div>
            <div style={styles.votingStatSub}>Grad u vođstvu u ovom trenutku</div>
          </div>

          <div style={styles.votingStatCard}>
            <div style={styles.votingStatLabel}>Broj glasova</div>
            <div style={styles.votingStatValue}>{leaderVotes}</div>
            <div style={styles.votingStatSub}>Live prikaz rezultata</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatNumber(num) {
  if (!num && num !== 0) return "0";
  return new Intl.NumberFormat("sr-RS").format(num);
}

function formatCountdown(seconds) {
  const total = Math.max(0, Number(seconds || 0));

  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default function Home() {
  const navigate = useNavigate();
  const isMobile = useIsMobile(768);

  const [loaded, setLoaded] = useState(false);
  const [tours, setTours] = useState([]);
  const [events, setEvents] = useState([]);
  const [goingNow, setGoingNow] = useState([]);
  const [loadingContent, setLoadingContent] = useState(true);
  const [liveFilter, setLiveFilter] = useState("all");
  const [voteSummary, setVoteSummary] = useState(null);
  const [votePoll, setVotePoll] = useState(null);

  const liveRailRef = useRef(null);
  const soonRailRef = useRef(null);
  const toursRailRef = useRef(null);
  const eventsRailRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 120);

    async function loadContent() {
      setLoadingContent(true);

      const [
        { data: toursData },
        { data: eventsData },
        { data: goingNowData },
        { data: voteSummaryData },
        { data: votePollData },
      ] = await Promise.all([
        supabase.from("tours").select("*").order("created_at", { ascending: false }).limit(8),
        supabase.from("events").select("*").order("created_at", { ascending: false }).limit(8),
        supabase.from("going_now_overview").select("*").order("starts_at", { ascending: true }).limit(16),
        supabase.from("city_vote_summary").select("*").limit(1).maybeSingle(),
        supabase
          .from("city_poll_status")
.select("*")
.order("starts_at", { ascending: false })
.limit(1)
.maybeSingle()
      ]);

      setTours(toursData || []);
      setEvents(eventsData || []);
      setGoingNow(goingNowData || []);
      setVoteSummary(voteSummaryData || null);
      setVotePoll(votePollData || null);
      setLoadingContent(false);
    }

    loadContent();
    return () => clearTimeout(t);
  }, []);

  const getActivityLabel = (item) =>
    item.activity_type || item.category || item.type || (item.is_event ? "Event" : "Adventure");

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

  const featuredLive = goingNow[0] || null;
  const liveNowItems = useMemo(() => {
    return goingNow.filter((item) => {
      if (item?.status === "ended" || item?.status === "cancelled") return false;
      if (!item?.starts_at) return true;
      const ts = new Date(item.starts_at).getTime();
      return Number.isNaN(ts) ? true : ts <= Date.now();
    });
  }, [goingNow]);

  const startingSoonItems = useMemo(() => {
    return goingNow.filter((item) => {
      if (!item?.starts_at) return false;
      const ts = new Date(item.starts_at).getTime();
      return !Number.isNaN(ts) && ts > Date.now();
    });
  }, [goingNow]);

  const filteredLiveNow = useMemo(() => {
    if (liveFilter === "all") return liveNowItems;
    return liveNowItems.filter((item) => {
      const value = `${item?.category || ""} ${item?.vibe || ""}`.toLowerCase();
      return value.includes(liveFilter);
    });
  }, [liveNowItems, liveFilter]);

const voteCountdown = useMemo(() => {
  if (!votePoll) return "Uskoro";

  if (votePoll.status === "scheduled") {
    return `Počinje za ${formatCountdown(votePoll.seconds_left)}`;
  }

  if (votePoll.status === "active") {
    return `Još ${formatCountdown(votePoll.seconds_left)}`;
  }

  return "Glasanje završeno";
}, [votePoll]);

  const styles = useMemo(
    () => ({
      page: {
        minHeight: "100vh",
        color: COLORS.text,
        background: `
        radial-gradient(circle at 12% 10%, rgba(46,230,255,0.10), transparent 22%),
        radial-gradient(circle at 80% 8%, rgba(55,242,195,0.10), transparent 24%),
        linear-gradient(180deg, #04100c 0%, #07130f 32%, #081611 65%, #091712 100%)
      `,
        fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        paddingBottom: isMobile ? MOBILE_BOTTOM_NAV_HEIGHT + 24 : 72,
      },
      hero: {
        position: "relative",
        minHeight: isMobile ? "72vh" : "76vh",
        marginTop: -30,
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
        background:
          "linear-gradient(to bottom, rgba(4,14,10,0.10) 0%, rgba(4,14,10,0.20) 22%, rgba(4,14,10,0.62) 58%, rgba(4,14,10,0.96) 100%)",
      },
      heroInner: {
        position: "relative",
        zIndex: 2,
        width: "100%",
        maxWidth: 1280,
        margin: "0 auto",
        padding: isMobile ? "110px 16px 96px" : "118px 24px 120px",
      },
      heroContent: {
        maxWidth: 760,
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
        marginBottom: 18,
        backdropFilter: "blur(12px)",
      },
      liveDotSmall: {
        width: 8,
        height: 8,
        borderRadius: 999,
        background: COLORS.mint,
        boxShadow: "0 0 14px rgba(55,242,195,0.62)",
      },
      heroTitle: {
        margin: 0,
        fontSize: isMobile ? 42 : 78,
        lineHeight: isMobile ? 0.96 : 0.9,
        fontWeight: 950,
        letterSpacing: "-0.065em",
        color: "#effff8",
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
        maxWidth: 620,
        fontSize: isMobile ? 15 : 19,
        lineHeight: 1.62,
        color: "rgba(229,255,246,0.84)",
        fontWeight: 600,
      },
      heroActions: {
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        gap: 12,
        marginTop: 24,
        width: isMobile ? "100%" : "auto",
        maxWidth: isMobile ? 420 : "none",
      },
      heroPrimaryBtn: {
        appearance: "none",
        border: "none",
        padding: isMobile ? "16px 18px" : "16px 24px",
        borderRadius: 999,
        background: "linear-gradient(135deg, #37f2c3 0%, #2ee6ff 100%)",
        color: "#052018",
        fontWeight: 950,
        fontSize: 15,
        cursor: "pointer",
        boxShadow: "0 18px 38px rgba(55,242,195,0.24)",
      },
      heroGhostBtn: {
        appearance: "none",
        border: `1px solid ${COLORS.lineStrong}`,
        padding: isMobile ? "15px 18px" : "15px 22px",
        borderRadius: 999,
        background: "rgba(8, 26, 20, 0.38)",
        color: COLORS.text,
        fontWeight: 800,
        fontSize: 14,
        cursor: "pointer",
        backdropFilter: "blur(12px)",
      },
      section: {
        maxWidth: 1280,
        margin: "0 auto",
        padding: isMobile ? "24px 16px 0" : "32px 24px 0",
      },
      sectionHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        gap: 16,
        marginBottom: 16,
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
      sectionEyebrowLive: { color: COLORS.mintSoft },
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
        maxWidth: 720,
        fontSize: isMobile ? 13 : 14,
        lineHeight: 1.6,
        color: COLORS.textSoft,
      },
      sectionAction: {
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
      },
      votingBanner: {
        position: "relative",
        overflow: "hidden",
        borderRadius: isMobile ? 26 : 30,
        border: `1px solid ${COLORS.lineStrong}`,
        background:
          "linear-gradient(145deg, rgba(8,24,18,0.86), rgba(7,17,13,0.94))",
        boxShadow: "0 22px 60px rgba(0,0,0,0.24)",
        padding: isMobile ? 18 : 22,
        marginTop: -36,
      },
      votingGlowA: {
        position: "absolute",
        width: 220,
        height: 220,
        right: -60,
        top: -80,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(46,230,255,0.18), transparent 70%)",
        pointerEvents: "none",
      },
      votingGlowB: {
        position: "absolute",
        width: 220,
        height: 220,
        left: -70,
        bottom: -90,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(55,242,195,0.16), transparent 70%)",
        pointerEvents: "none",
      },
      votingBannerTop: {
        position: "relative",
        zIndex: 1,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
        marginBottom: 14,
      },
      votingEyebrow: {
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        borderRadius: 999,
        background: "rgba(8, 28, 21, 0.52)",
        border: `1px solid ${COLORS.lineStrong}`,
        color: COLORS.mintSoft,
        fontSize: 11,
        fontWeight: 900,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
      },
      votingStatusChip: {
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        borderRadius: 999,
        background: "linear-gradient(135deg, rgba(55,242,195,0.18), rgba(46,230,255,0.14))",
        border: `1px solid ${COLORS.lineStrong}`,
        color: COLORS.text,
        fontSize: 12,
        fontWeight: 900,
      },
      votingBannerGrid: {
        position: "relative",
        zIndex: 1,
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1.3fr 0.9fr",
        gap: 16,
        alignItems: "stretch",
      },
      votingContent: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      },
      votingTitle: {
        margin: 0,
        fontSize: isMobile ? 30 : 42,
        lineHeight: 1.02,
        fontWeight: 950,
        letterSpacing: "-0.05em",
        color: COLORS.text,
      },
      votingText: {
        marginTop: 12,
        marginBottom: 0,
        maxWidth: 760,
        fontSize: isMobile ? 14 : 15,
        lineHeight: 1.72,
        color: COLORS.textSoft,
        fontWeight: 600,
      },
      votingActionRow: {
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        gap: 10,
        marginTop: 18,
        alignItems: isMobile ? "stretch" : "center",
      },
      votingPrimaryBtn: {
        appearance: "none",
        border: "none",
        padding: isMobile ? "15px 18px" : "14px 20px",
        borderRadius: 999,
        background: "linear-gradient(135deg, #37f2c3 0%, #2ee6ff 100%)",
        color: "#052018",
        fontWeight: 950,
        fontSize: 14,
        cursor: "pointer",
        boxShadow: "0 18px 38px rgba(55,242,195,0.20)",
      },
      votingCountdownChip: {
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "12px 14px",
        borderRadius: 999,
        background: "rgba(8, 28, 21, 0.52)",
        border: `1px solid ${COLORS.line}`,
        color: COLORS.text,
        fontSize: 12,
        fontWeight: 800,
        whiteSpace: "nowrap",
      },
      votingStatsWrap: {
        display: "grid",
        gap: 12,
      },
      votingStatCard: {
        padding: 16,
        borderRadius: 22,
        background: "rgba(8, 24, 18, 0.56)",
        border: `1px solid ${COLORS.line}`,
        backdropFilter: "blur(10px)",
      },
      votingStatLabel: {
        fontSize: 11,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: COLORS.textDim,
        fontWeight: 900,
        marginBottom: 8,
      },
      votingStatValue: {
        fontSize: isMobile ? 22 : 26,
        lineHeight: 1.04,
        fontWeight: 950,
        color: COLORS.text,
        marginBottom: 8,
      },
      votingStatSub: {
        fontSize: 13,
        lineHeight: 1.6,
        color: COLORS.textSoft,
      },
      liveFilters: {
        display: "flex",
        gap: 10,
        overflowX: "auto",
        paddingBottom: 6,
        marginBottom: 16,
        scrollbarWidth: "none",
      },
      liveFilterChip: (active) => ({
        border: `1px solid ${active ? COLORS.lineStrong : COLORS.line}`,
        background: active ? "linear-gradient(135deg, rgba(55,242,195,0.18), rgba(46,230,255,0.14))" : "rgba(255,255,255,0.04)",
        color: COLORS.text,
        padding: "11px 14px",
        borderRadius: 999,
        whiteSpace: "nowrap",
        fontWeight: 850,
        fontSize: 13,
        cursor: "pointer",
        flex: "0 0 auto",
      }),
      liveFeaturedCard: {
        position: "relative",
        overflow: "hidden",
        minHeight: isMobile ? 340 : 430,
        borderRadius: isMobile ? 26 : 30,
        border: `1px solid ${COLORS.lineStrong}`,
        background: "linear-gradient(145deg, rgba(8,24,18,0.72), rgba(7,17,13,0.92))",
        boxShadow: "0 22px 60px rgba(0,0,0,0.24)",
        cursor: "pointer",
        marginBottom: 16,
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
        background: "linear-gradient(to top, rgba(4,14,10,0.98), rgba(4,14,10,0.20) 45%, rgba(4,14,10,0.05))",
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
        lineHeight: 1.0,
        fontWeight: 950,
        letterSpacing: "-0.05em",
        color: COLORS.text,
        maxWidth: 720,
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
        border: "none",
        padding: isMobile ? "15px 18px" : "14px 22px",
        borderRadius: 999,
        background: "linear-gradient(135deg, #37f2c3 0%, #2ee6ff 100%)",
        color: "#052018",
        fontWeight: 950,
        fontSize: 15,
        cursor: "pointer",
      },
      liveGhost: {
        border: `1px solid ${COLORS.lineStrong}`,
        padding: isMobile ? "14px 18px" : "14px 20px",
        borderRadius: 999,
        background: "rgba(8, 26, 20, 0.38)",
        color: COLORS.text,
        fontWeight: 800,
        fontSize: 14,
        cursor: "pointer",
      },
      railShell: { position: "relative" },
      rail: {
        display: "flex",
        gap: 14,
        overflowX: "auto",
        paddingBottom: 8,
        scrollSnapType: "x mandatory",
        scrollbarWidth: "none",
        WebkitOverflowScrolling: "touch",
      },
      railArrow: {
        position: "absolute",
        top: "50%",
        transform: "translateY(-50%)",
        zIndex: 3,
        width: 46,
        height: 46,
        borderRadius: "50%",
        border: `1px solid ${COLORS.lineStrong}`,
        background: "rgba(7,22,17,0.78)",
        color: COLORS.text,
        fontWeight: 900,
        cursor: "pointer",
        backdropFilter: "blur(10px)",
      },
      goingCard: {
        position: "relative",
        overflow: "hidden",
        minWidth: isMobile ? "82vw" : 320,
        width: isMobile ? "82vw" : 320,
        height: isMobile ? 360 : 380,
        flex: "0 0 auto",
        borderRadius: isMobile ? 26 : 28,
        border: `1px solid ${COLORS.lineStrong}`,
        background: "linear-gradient(145deg, rgba(8,24,18,0.74), rgba(7,17,13,0.92))",
        boxShadow: "0 22px 54px rgba(0,0,0,0.20)",
        scrollSnapAlign: "start",
        cursor: "pointer",
      },
      goingCardCompact: {
        height: isMobile ? 320 : 340,
      },
      goingCardImage: { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.03)" },
      goingCardOverlayTop: { position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.08), rgba(0,0,0,0.18))" },
      goingCardOverlayBottom: { position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(4,14,10,0.98), rgba(4,14,10,0.16) 48%)" },
      goingCardTop: {
        position: "absolute",
        top: 14,
        left: 14,
        right: 14,
        display: "flex",
        justifyContent: "space-between",
        gap: 8,
        alignItems: "center",
      },
      goingLivePill: {
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
      goingGhostPill: {
        display: "inline-flex",
        alignItems: "center",
        padding: "8px 12px",
        borderRadius: 999,
        background: "rgba(8,28,21,0.54)",
        border: `1px solid ${COLORS.line}`,
        color: COLORS.text,
        fontWeight: 800,
        fontSize: 11,
        whiteSpace: "nowrap",
      },
      goingCardBottom: { position: "absolute", left: 16, right: 16, bottom: 16 },
      goingCardTitle: {
        margin: 0,
        fontSize: isMobile ? 24 : 28,
        lineHeight: 1.03,
        fontWeight: 950,
        letterSpacing: "-0.04em",
        color: COLORS.text,
      },
      goingCardMetaLine: {
        marginTop: 10,
        color: COLORS.textSoft,
        fontSize: 14,
        fontWeight: 700,
        lineHeight: 1.55,
      },
      goingCardFooter: {
        marginTop: 14,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 10,
      },
      goingParticipantsPill: {
        display: "inline-flex",
        alignItems: "center",
        padding: "9px 12px",
        borderRadius: 999,
        background: "rgba(8,28,21,0.52)",
        border: `1px solid ${COLORS.line}`,
        color: COLORS.text,
        fontWeight: 800,
        fontSize: 12,
      },
      goingActionPill: {
        display: "inline-flex",
        alignItems: "center",
        padding: "10px 13px",
        borderRadius: 999,
        background: "rgba(255,255,255,0.08)",
        border: `1px solid ${COLORS.line}`,
        color: COLORS.text,
        fontWeight: 900,
        fontSize: 12,
      },
      card: {
        position: "relative",
        overflow: "hidden",
        borderRadius: 24,
        background: "linear-gradient(155deg, rgba(8,24,18,0.74), rgba(7,17,13,0.90))",
        border: `1px solid ${COLORS.line}`,
        cursor: "pointer",
        boxShadow: "0 14px 34px rgba(0,0,0,0.18)",
        minWidth: isMobile ? "82vw" : 300,
        flex: "0 0 auto",
        scrollSnapAlign: "start",
      },
      cardMedia: { position: "relative", width: "100%", height: isMobile ? 184 : 210, overflow: "hidden" },
      cardImage: { width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.02)", transition: "transform 0.45s ease" },
      cardMediaOverlayTop: { position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.08), rgba(0,0,0,0.18))" },
      cardMediaOverlayBottom: { position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(4,14,10,0.96), rgba(4,14,10,0.08) 48%)" },
      cardMediaTopRow: { position: "absolute", top: 12, left: 12, right: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 },
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
      cardBody: { padding: isMobile ? 14 : 16 },
      cardTitle: { fontSize: isMobile ? 17 : 19, fontWeight: 900, lineHeight: 1.14, color: COLORS.text, marginBottom: 8 },
      cardLocation: { display: "flex", alignItems: "center", gap: 7, fontSize: isMobile ? 12 : 13, color: COLORS.textSoft, marginBottom: 12 },
      cardBottomRow: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, fontSize: isMobile ? 11 : 12, color: COLORS.textSoft },
      cardChips: { display: "flex", gap: 7, flexWrap: "wrap" },
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
      cardMetaRight: { whiteSpace: "nowrap", fontWeight: 700, color: COLORS.text },
      emptyCard: {
        borderRadius: 24,
        padding: isMobile ? "18px" : "24px",
        background: "linear-gradient(145deg, rgba(8,24,18,0.72), rgba(7,17,13,0.88))",
        border: `1px solid ${COLORS.line}`,
      },
      emptyTitle: { fontSize: isMobile ? 20 : 24, fontWeight: 900, marginBottom: 8, color: COLORS.text },
      emptyText: { fontSize: isMobile ? 14 : 15, lineHeight: 1.6, color: COLORS.textSoft, maxWidth: 720 },
    }),
    [isMobile, loaded]
  );

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <img src={HERO_IMAGE} alt="MeetOutdoors hero" style={styles.heroImage} />
        <div style={styles.heroOverlay} />

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
              <button type="button" style={styles.heroPrimaryBtn} onClick={() => navigate("/going-now")}>Open Going Now</button>
              <button type="button" style={styles.heroGhostBtn} onClick={() => navigate("/tours")}>Explore tours</button>
            </div>
          </div>
        </div>
      </section>

      <section style={styles.section}>
        <VotingBanner
          styles={styles}
          leaderName={voteSummary?.leading_name || "Beograd"}
          leaderVotes={formatNumber(voteSummary?.leading_votes || 0)}
          countdown={voteCountdown}
          onOpenVoting={() => navigate("/vote-city")}
        />
      </section>

      <section style={styles.section}>
        <SectionHeader
          styles={styles}
          eyebrow="Going now"
          title="The heartbeat of the app"
          subtitle="One strong featured live plan, then clean swipe rails for what matters most."
          actionLabel="See all"
          onAction={() => navigate("/going-now")}
          live
        />

        <div style={styles.liveFilters}>
          {[
            ["all", "All plans"],
            ["chill", "Chill"],
            ["sport", "Sport"],
            ["outdoor", "Outdoor"],
            ["trip", "Trip"],
          ].map(([value, label]) => (
            <button key={value} type="button" style={styles.liveFilterChip(liveFilter === value)} onClick={() => setLiveFilter(value)}>
              {label}
            </button>
          ))}
        </div>

        {featuredLive ? (
          <>
            <GoingNowMainCard item={featuredLive} styles={styles} onClick={() => navigate(`/going-now/${featuredLive.id}`)} />

            <SectionHeader
              styles={styles}
              eyebrow="Swipe live"
              title="Live now"
              subtitle="The fastest way to discover what is happening right now."
            />
            <HorizontalRail styles={styles} railRef={liveRailRef} isMobile={isMobile}>
              {(filteredLiveNow.length ? filteredLiveNow : liveNowItems).map((item) => (
                <GoingNowSwipeCard key={item.id} item={item} styles={styles} onClick={() => navigate(`/going-now/${item.id}`)} />
              ))}
            </HorizontalRail>

            {startingSoonItems.length ? (
              <>
                <SectionHeader
                  styles={styles}
                  eyebrow="Coming up"
                  title="Starting soon"
                  subtitle="Plans that are about to go live."
                />
                <HorizontalRail styles={styles} railRef={soonRailRef} isMobile={isMobile}>
                  {startingSoonItems.map((item) => (
                    <GoingNowSwipeCard key={item.id} item={item} styles={styles} onClick={() => navigate(`/going-now/${item.id}`)} compact />
                  ))}
                </HorizontalRail>
              </>
            ) : null}
          </>
        ) : (
          <div style={styles.emptyCard}>
            <div style={styles.emptyTitle}>No live plans yet</div>
            <div style={styles.emptyText}>As soon as people start posting spontaneous meetups, this becomes the real-time heartbeat of the app.</div>
          </div>
        )}
      </section>

      <section style={styles.section}>
        <SectionHeader
          styles={styles}
          eyebrow="Tours"
          title="Fresh adventures"
          subtitle="Clean discovery rail for tours without clutter."
          actionLabel="See all tours"
          onAction={() => navigate("/tours")}
        />

        {tours.length ? (
          <HorizontalRail styles={styles} railRef={toursRailRef} isMobile={isMobile}>
            {tours.slice(0, 8).map((tour) => (
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
              />
            ))}
          </HorizontalRail>
        ) : (
          <div style={styles.emptyCard}>
            <div style={styles.emptyTitle}>No tours yet</div>
            <div style={styles.emptyText}>Create the first tour and this rail becomes your main discovery point.</div>
          </div>
        )}
      </section>

      <section style={styles.section}>
        <SectionHeader
          styles={styles}
          eyebrow="Events"
          title="Upcoming outdoor events"
          subtitle="Same premium layout, but calmer and easier to scan."
          actionLabel="All events"
          onAction={() => navigate("/events")}
        />

        {events.length ? (
          <HorizontalRail styles={styles} railRef={eventsRailRef} isMobile={isMobile}>
            {events.slice(0, 8).map((eventItem) => (
              <ExploreCard
                key={eventItem.id}
                item={eventItem}
                styles={styles}
                image={eventItem.cover_url || FALLBACK_EVENT_IMAGE}
                badge={getActivityLabel(eventItem)}
                price={getPriceLabel(eventItem)}
                title={eventItem.title || "Untitled event"}
                location={getLocationLabel(eventItem)}
                chips={[getEventDateLabel(eventItem), eventItem.category || eventItem.type || "Outdoor event"]}
                rightMeta={`🎫 ${eventItem.max_people || eventItem.capacity || "Open spots"}`}
                onClick={() => navigate(`/event/${eventItem.id}`)}
              />
            ))}
          </HorizontalRail>
        ) : (
          <div style={styles.emptyCard}>
            <div style={styles.emptyTitle}>No events yet</div>
            <div style={styles.emptyText}>When events start landing, they’ll appear here in the same clean system.</div>
          </div>
        )}
      </section>

      {loadingContent ? (
        <section style={styles.section}>
          <div style={styles.emptyCard}>
            <div style={styles.emptyTitle}>Loading home content…</div>
            <div style={styles.emptyText}>Pulling tours, events and live plans from Supabase.</div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
