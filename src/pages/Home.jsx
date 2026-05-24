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
const FALLBACK_EXPERIENCE_IMAGE =
  "https://images.pexels.com/photos/1732278/pexels-photo-1732278.jpeg";

const COLORS = {
  bg: "#020403",
  line: "rgba(125, 255, 209, 0.13)",
  lineStrong: "rgba(125, 255, 209, 0.28)",
  text: "#f4fff9",
  textSoft: "rgba(231, 255, 247, 0.78)",
  textDim: "rgba(199, 236, 225, 0.58)",
  mint: "#16f5a2",
  mintBlue: "#40e7ff",
  mintSoft: "#8fffe0",
  gold: "#f4d06f",
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
          onClick={() => railRef.current?.scrollBy({ left: -420, behavior: "smooth" })}
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
          onClick={() => railRef.current?.scrollBy({ left: 420, behavior: "smooth" })}
        >
          →
        </button>
      ) : null}
    </div>
  );
}

function PremiumQuickActions({ styles, navigate }) {
  const actions = [
    {
      label: "Going Now",
      text: "See what people are doing right now.",
      icon: "LIVE",
      path: "/going-now",
      primary: true,
    },
    {
      label: "Book Experiences",
      text: "Search hosts, dates and packages.",
      icon: "BOOK",
      path: "/experiences",
    },
    {
      label: "Create",
      text: "Start a live plan, tour or event.",
      icon: "HOST",
      path: "/going-now/create",
    },
  ];

  return (
    <div style={styles.quickPanel}>
      {actions.map((action) => (
        <button
          key={action.label}
          type="button"
          style={{ ...styles.quickCard, ...(action.primary ? styles.quickCardPrimary : {}) }}
          onClick={() => navigate(action.path)}
        >
          <span style={styles.quickIcon}>{action.icon}</span>
          <span style={styles.quickBody}>
            <strong style={styles.quickTitle}>{action.label}</strong>
            <span style={styles.quickText}>{action.text}</span>
          </span>
          <span style={styles.quickArrow}>→</span>
        </button>
      ))}
    </div>
  );
}

function ExperienceCard({ experience, styles, onClick }) {
  return (
    <button type="button" style={styles.bookingCard} onClick={onClick}>
      <div style={styles.bookingMedia}>
        <img src={experience.image} alt={experience.name} style={styles.bookingImage} />
        <div style={styles.bookingOverlayTop} />
        <div style={styles.bookingOverlayBottom} />

        <div style={styles.bookingTopRow}>
          <span style={styles.bookingBadge}>{experience.badge}</span>
          <span style={styles.bookingPrice}>{experience.price}</span>
        </div>

        <div style={styles.bookingTitleWrap}>
          <div style={styles.bookingType}>{experience.type}</div>
          <h3 style={styles.bookingTitle}>{experience.name}</h3>
          <div style={styles.bookingLocation}>📍 {experience.location}</div>
        </div>
      </div>

      <div style={styles.bookingBody}>
        <div style={styles.bookingBodyTop}>
          <span style={styles.bookingBodyLabel}>Available dates</span>
          <strong style={styles.bookingBodyValue}>{experience.freeSpots} spots</strong>
        </div>

        <div style={styles.dateList}>
          {experience.dates.length ? (
            experience.dates.slice(0, 3).map((date) => {
              const isFull = date.free_spots <= 0 || date.closed;
              return (
                <div key={date.id} style={{ ...styles.dateRow, ...(isFull ? styles.dateRowFull : {}) }}>
                  <span style={styles.dateLabel}>{date.label}</span>
                  <span style={{ ...styles.dateSpots, ...(isFull ? styles.dateSpotsFull : {}) }}>
                    {isFull ? "FULL" : `${date.free_spots}/${date.total_spots} free`}
                  </span>
                </div>
              );
            })
          ) : (
            <div style={styles.dateRow}>
              <span style={styles.dateLabel}>Dates soon</span>
              <span style={styles.dateSpots}>Ask host</span>
            </div>
          )}
        </div>

        <div style={styles.bookingButton}>Open booking page</div>
      </div>
    </button>
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
  const timeLabel =
    startsAt && !Number.isNaN(startsAt.getTime())
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
            <span style={styles.liveDotSmallDark} />
            <span>Live now</span>
          </div>
          <div style={styles.liveStatusPill}>{timeLabel}</div>
        </div>

        <h3 style={styles.liveFeaturedTitle}>
          {item?.title || "Something real is happening right now"}
        </h3>

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
  const timeLabel =
    startsAt && !Number.isNaN(startsAt.getTime())
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
          <span style={styles.liveDotSmallDark} />
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

export default function Home() {
  const navigate = useNavigate();
  const isMobile = useIsMobile(768);

  const [loaded, setLoaded] = useState(false);
  const [tours, setTours] = useState([]);
  const [events, setEvents] = useState([]);
  const [goingNow, setGoingNow] = useState([]);
  const [hosts, setHosts] = useState([]);
  const [packages, setPackages] = useState([]);
  const [dates, setDates] = useState([]);
  const [loadingContent, setLoadingContent] = useState(true);
  const [liveFilter, setLiveFilter] = useState("all");

  const liveRailRef = useRef(null);
  const soonRailRef = useRef(null);
  const toursRailRef = useRef(null);
  const eventsRailRef = useRef(null);
  const bookingRailRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 120);

    async function loadContent() {
      setLoadingContent(true);

      const [
        { data: toursData },
        { data: eventsData },
        { data: goingNowData },
        { data: hostData },
      ] = await Promise.all([
        supabase.from("tours").select("*").order("created_at", { ascending: false }).limit(8),
        supabase.from("events").select("*").order("created_at", { ascending: false }).limit(8),
        supabase
          .from("going_now_overview")
          .select("*")
          .order("starts_at", { ascending: true })
          .limit(16),
        supabase
          .from("experience_hosts")
          .select("*")
          .eq("active", true)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      const safeHosts = hostData || [];
      let packageData = [];
      let dateData = [];

      if (safeHosts.length) {
        const hostIds = safeHosts.map((host) => host.id);

        const { data: packagesFromDb } = await supabase
          .from("experience_packages")
          .select("*")
          .in("host_id", hostIds)
          .eq("active", true)
          .order("created_at", { ascending: false });

        packageData = packagesFromDb || [];

        if (packageData.length) {
          const packageIds = packageData.map((pkg) => pkg.id);

          const { data: datesFromDb } = await supabase
            .from("experience_dates")
            .select("*")
            .in("package_id", packageIds)
            .order("start_date", { ascending: true });

          dateData = datesFromDb || [];
        }
      }

      setTours(toursData || []);
      setEvents(eventsData || []);
      setGoingNow(goingNowData || []);
      setHosts(safeHosts);
      setPackages(packageData);
      setDates(dateData);
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

  const formatDate = (value) => {
    if (!value) return "Date soon";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Date soon";
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
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

  const experienceCards = useMemo(() => {
    return hosts.map((host) => {
      const hostPackages = packages.filter((pkg) => pkg.host_id === host.id);
      const hostDates = dates.filter((date) =>
        hostPackages.some((pkg) => pkg.id === date.package_id)
      );
      const firstPackage = hostPackages[0] || null;
      const minPrice = hostPackages
        .map((pkg) => Number(pkg.price || 0))
        .filter((price) => price > 0)
        .sort((a, b) => a - b)[0];

      return {
        id: host.id,
        slug: host.slug,
        name: host.name || "Experience host",
        type: host.category || firstPackage?.title || "Outdoor experience",
        location:
          host.location ||
          [host.city, host.country].filter(Boolean).join(", ") ||
          "Outdoor location",
        image: firstPackage?.cover_url || host.cover_url || FALLBACK_EXPERIENCE_IMAGE,
        badge: host.verified ? "Verified host" : "Experience host",
        price: minPrice ? `From ${minPrice} ${firstPackage?.currency || "EUR"}` : "Price on request",
        freeSpots: hostDates.reduce((sum, date) => sum + Number(date.free_spots || 0), 0),
        dates: hostDates.map((date) => ({
          ...date,
          label: `${formatDate(date.start_date)}${date.end_date ? ` - ${formatDate(date.end_date)}` : ""}`,
        })),
      };
    });
  }, [hosts, packages, dates]);

  const fallbackExperiences = [
    {
      id: "demo-rafting-eden",
      slug: null,
      name: "Rafting Camp Eden",
      type: "Rafting • Tara",
      location: "Foča / Tara river",
      image: FALLBACK_EXPERIENCE_IMAGE,
      badge: "Partner package",
      price: "From 89 EUR",
      freeSpots: 11,
      dates: [
        { id: "a", label: "Jun 07 - Jun 09", free_spots: 8, total_spots: 12 },
        { id: "b", label: "Jun 14 - Jun 16", free_spots: 3, total_spots: 12 },
        { id: "c", label: "Jun 21 - Jun 23", free_spots: 0, total_spots: 12, closed: true },
      ],
    },
    {
      id: "demo-skydiving",
      slug: null,
      name: "Skydiving Serbia",
      type: "Tandem jump",
      location: "Paraćin, Serbia",
      image: "https://images.pexels.com/photos/70361/pexels-photo-70361.jpeg",
      badge: "Adrenaline",
      price: "Request date",
      freeSpots: 7,
      dates: [
        { id: "d", label: "Weekend slots", free_spots: 5, total_spots: 8 },
        { id: "e", label: "Sunset jumps", free_spots: 2, total_spots: 6 },
      ],
    },
  ];

  const visibleExperiences = experienceCards.length ? experienceCards : fallbackExperiences;

  const styles = useMemo(
    () => ({
      page: {
        minHeight: "100vh",
        color: COLORS.text,
        background: `
          radial-gradient(circle at 50% -8%, rgba(22,245,162,0.16), transparent 32%),
          radial-gradient(circle at 92% 10%, rgba(64,231,255,0.10), transparent 28%),
          linear-gradient(180deg, #010302 0%, #04100c 36%, #071611 100%)
        `,
        fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        paddingBottom: isMobile ? MOBILE_BOTTOM_NAV_HEIGHT + 24 : 72,
        overflowX: "hidden",
      },
      hero: {
        position: "relative",
        minHeight: isMobile ? "88vh" : "94vh",
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
        transform: loaded ? "scale(1.015)" : "scale(1.08)",
        transition: "transform 1.7s cubic-bezier(.17,.84,.32,1)",
        filter: "saturate(1.08) contrast(1.08) brightness(.92)",
      },
      heroOverlay: {
        position: "absolute",
        inset: 0,
        background: `
          radial-gradient(circle at 44% 26%, rgba(22,245,162,0.16), transparent 25%),
          linear-gradient(to bottom, rgba(1,3,2,0.14) 0%, rgba(1,3,2,0.28) 34%, rgba(1,3,2,0.78) 74%, rgba(1,3,2,1) 100%),
          linear-gradient(90deg, rgba(1,3,2,0.70), rgba(1,3,2,0.14))
        `,
      },
      heroGrid: {
        position: "absolute",
        inset: 0,
        background:
          "linear-gradient(rgba(255,255,255,.028) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.028) 1px, transparent 1px)",
        backgroundSize: "46px 46px",
        maskImage: "linear-gradient(to bottom, transparent 0%, black 30%, transparent 78%)",
        opacity: 0.38,
      },
      heroInner: {
        position: "relative",
        zIndex: 2,
        width: "100%",
        maxWidth: 1320,
        margin: "0 auto",
        padding: isMobile ? "126px 16px 112px" : "146px 28px 148px",
      },
      heroContent: {
        maxWidth: 910,
        opacity: loaded ? 1 : 0,
        transform: loaded ? "translateY(0px)" : "translateY(28px)",
        transition: "opacity 0.9s ease, transform 0.9s cubic-bezier(.17,.84,.32,1)",
      },
      heroEyebrow: {
        display: "inline-flex",
        alignItems: "center",
        gap: 9,
        padding: "9px 13px",
        borderRadius: 999,
        background: "rgba(3, 15, 11, 0.38)",
        border: `1px solid ${COLORS.lineStrong}`,
        color: COLORS.mintSoft,
        fontSize: isMobile ? 10 : 11,
        fontWeight: 950,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        marginBottom: 18,
        backdropFilter: "blur(16px)",
        boxShadow: "0 0 34px rgba(22,245,162,.10)",
      },
      liveDotSmall: {
        width: 8,
        height: 8,
        borderRadius: 999,
        background: COLORS.mint,
        boxShadow: "0 0 16px rgba(22,245,162,0.80)",
        flex: "0 0 auto",
      },
      liveDotSmallDark: {
        width: 8,
        height: 8,
        borderRadius: 999,
        background: "#052018",
        boxShadow: "0 0 14px rgba(5,32,24,0.34)",
        flex: "0 0 auto",
      },
      heroTitle: {
        margin: 0,
        fontSize: isMobile ? 49 : 98,
        lineHeight: isMobile ? 0.91 : 0.84,
        fontWeight: 950,
        letterSpacing: "-0.082em",
        color: "#f7fff9",
        textShadow: "0 24px 70px rgba(0,0,0,0.42)",
      },
      heroTitleAccent: {
        background: "linear-gradient(135deg, #16f5a2 0%, #8fffe0 42%, #40e7ff 100%)",
        WebkitBackgroundClip: "text",
        color: "transparent",
        filter: "drop-shadow(0 0 24px rgba(22,245,162,.18))",
      },
      heroSubtitle: {
        marginTop: 20,
        marginBottom: 0,
        maxWidth: 650,
        fontSize: isMobile ? 15 : 21,
        lineHeight: 1.55,
        color: "rgba(238,255,249,0.88)",
        fontWeight: 650,
      },
      heroActions: {
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        gap: 12,
        marginTop: 28,
        width: isMobile ? "100%" : "auto",
        maxWidth: isMobile ? 430 : "none",
      },
      heroPrimaryBtn: {
        appearance: "none",
        border: "none",
        padding: isMobile ? "17px 18px" : "17px 25px",
        borderRadius: 999,
        background: "linear-gradient(135deg, #16f5a2 0%, #40e7ff 100%)",
        color: "#03150f",
        fontWeight: 950,
        fontSize: 15,
        cursor: "pointer",
        boxShadow: "0 24px 54px rgba(22,245,162,0.28)",
      },
      heroGhostBtn: {
        appearance: "none",
        border: `1px solid ${COLORS.lineStrong}`,
        padding: isMobile ? "16px 18px" : "16px 23px",
        borderRadius: 999,
        background: "rgba(3, 16, 12, 0.42)",
        color: COLORS.text,
        fontWeight: 850,
        fontSize: 14,
        cursor: "pointer",
        backdropFilter: "blur(16px)",
      },
      heroStats: {
        display: "grid",
        gridTemplateColumns: isMobile ? "repeat(3, 1fr)" : "repeat(3, 150px)",
        gap: 10,
        marginTop: 24,
        maxWidth: isMobile ? "100%" : 480,
      },
      heroStat: {
        padding: "13px 12px",
        borderRadius: 20,
        background: "rgba(3, 16, 12, 0.38)",
        border: `1px solid ${COLORS.line}`,
        backdropFilter: "blur(14px)",
      },
      heroStatNum: {
        display: "block",
        fontSize: isMobile ? 18 : 22,
        fontWeight: 950,
        letterSpacing: "-0.04em",
      },
      heroStatLabel: {
        display: "block",
        marginTop: 4,
        color: COLORS.textDim,
        fontSize: 10,
        fontWeight: 900,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
      },
      section: {
        maxWidth: 1320,
        margin: "0 auto",
        padding: isMobile ? "30px 16px 0" : "44px 28px 0",
      },
      sectionTight: {
        maxWidth: 1320,
        margin: "0 auto",
        padding: isMobile ? "18px 16px 0" : "24px 28px 0",
      },
      sectionHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        gap: 16,
        marginBottom: 17,
      },
      sectionEyebrow: {
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        fontSize: isMobile ? 10 : 11,
        letterSpacing: "0.17em",
        textTransform: "uppercase",
        color: COLORS.textDim,
        fontWeight: 950,
        marginBottom: 8,
      },
      sectionEyebrowLive: { color: COLORS.mintSoft },
      sectionTitle: {
        margin: 0,
        fontSize: isMobile ? 27 : 40,
        lineHeight: 1,
        fontWeight: 950,
        letterSpacing: "-0.055em",
        color: COLORS.text,
      },
      sectionSubtitle: {
        marginTop: 9,
        marginBottom: 0,
        maxWidth: 690,
        fontSize: isMobile ? 13 : 14,
        lineHeight: 1.6,
        color: COLORS.textSoft,
      },
      sectionAction: {
        border: `1px solid ${COLORS.lineStrong}`,
        background: "rgba(7, 22, 17, 0.48)",
        color: COLORS.text,
        padding: isMobile ? "10px 12px" : "10px 14px",
        borderRadius: 999,
        fontWeight: 850,
        fontSize: isMobile ? 12 : 13,
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        cursor: "pointer",
        whiteSpace: "nowrap",
      },
      quickPanel: {
        position: "relative",
        overflow: "hidden",
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))",
        gap: 12,
        borderRadius: isMobile ? 30 : 38,
        border: `1px solid ${COLORS.lineStrong}`,
        background: `
          radial-gradient(circle at 12% 0%, rgba(22,245,162,0.18), transparent 34%),
          radial-gradient(circle at 92% 14%, rgba(64,231,255,0.12), transparent 30%),
          linear-gradient(145deg, rgba(8,24,18,0.78), rgba(3,9,7,0.92))
        `,
        boxShadow: "0 28px 78px rgba(0,0,0,0.30)",
        padding: isMobile ? 13 : 16,
        marginTop: isMobile ? -70 : -94,
        zIndex: 5,
        backdropFilter: "blur(20px)",
      },
      quickCard: {
        appearance: "none",
        border: `1px solid ${COLORS.line}`,
        background: "rgba(255,255,255,0.045)",
        color: COLORS.text,
        borderRadius: 26,
        padding: isMobile ? 15 : 18,
        display: "flex",
        alignItems: "center",
        gap: 13,
        textAlign: "left",
        cursor: "pointer",
        minHeight: isMobile ? 84 : 128,
      },
      quickCardPrimary: {
        background: "linear-gradient(145deg, rgba(22,245,162,0.19), rgba(64,231,255,0.12))",
        border: `1px solid ${COLORS.lineStrong}`,
        boxShadow: "0 20px 48px rgba(22,245,162,.10)",
      },
      quickIcon: {
        width: 50,
        height: 50,
        borderRadius: 19,
        display: "grid",
        placeItems: "center",
        background: "rgba(255,255,255,0.07)",
        border: `1px solid ${COLORS.line}`,
        flex: "0 0 auto",
        fontSize: 10,
        letterSpacing: ".12em",
        fontWeight: 950,
        color: COLORS.mintSoft,
      },
      quickBody: {
        display: "flex",
        flexDirection: "column",
        gap: 6,
        flex: 1,
      },
      quickTitle: {
        fontSize: 16,
        lineHeight: 1.1,
        fontWeight: 950,
        color: COLORS.text,
      },
      quickText: {
        fontSize: 12,
        lineHeight: 1.4,
        color: COLORS.textSoft,
        fontWeight: 650,
      },
      quickArrow: {
        color: COLORS.mintSoft,
        fontWeight: 950,
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
      bookingCard: {
        overflow: "hidden",
        minWidth: isMobile ? "86vw" : 382,
        width: isMobile ? "86vw" : 382,
        flex: "0 0 auto",
        scrollSnapAlign: "start",
        borderRadius: 32,
        border: `1px solid ${COLORS.lineStrong}`,
        background: "linear-gradient(155deg, rgba(9,25,19,.84), rgba(3,9,7,.96))",
        boxShadow: "0 24px 68px rgba(0,0,0,.30)",
        textAlign: "left",
        color: COLORS.text,
        cursor: "pointer",
        padding: 0,
      },
      bookingMedia: {
        position: "relative",
        height: isMobile ? 250 : 278,
        overflow: "hidden",
      },
      bookingImage: {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        transform: "scale(1.035)",
        filter: "saturate(1.08) contrast(1.04)",
      },
      bookingOverlayTop: {
        position: "absolute",
        inset: 0,
        background: "linear-gradient(to bottom, rgba(0,0,0,.14), transparent 48%)",
      },
      bookingOverlayBottom: {
        position: "absolute",
        inset: 0,
        background: "linear-gradient(to top, rgba(1,3,2,.96), rgba(1,3,2,.06) 58%)",
      },
      bookingTopRow: {
        position: "absolute",
        top: 14,
        left: 14,
        right: 14,
        display: "flex",
        justifyContent: "space-between",
        gap: 8,
      },
      bookingBadge: {
        display: "inline-flex",
        alignItems: "center",
        padding: "7px 11px",
        borderRadius: 999,
        background: "linear-gradient(135deg, #16f5a2, #40e7ff)",
        color: "#03150f",
        fontSize: 11,
        fontWeight: 950,
        textTransform: "uppercase",
        letterSpacing: ".08em",
      },
      bookingPrice: {
        display: "inline-flex",
        alignItems: "center",
        padding: "7px 11px",
        borderRadius: 999,
        background: "rgba(3, 15, 11, .58)",
        border: `1px solid ${COLORS.line}`,
        color: COLORS.text,
        fontSize: 11,
        fontWeight: 850,
      },
      bookingTitleWrap: {
        position: "absolute",
        left: 17,
        right: 17,
        bottom: 17,
      },
      bookingType: {
        color: COLORS.mintSoft,
        fontSize: 11,
        fontWeight: 950,
        letterSpacing: ".14em",
        textTransform: "uppercase",
        marginBottom: 8,
      },
      bookingTitle: {
        margin: 0,
        fontSize: isMobile ? 29 : 34,
        lineHeight: .96,
        letterSpacing: "-.055em",
        fontWeight: 950,
      },
      bookingLocation: {
        marginTop: 9,
        color: COLORS.textSoft,
        fontSize: 13,
        fontWeight: 750,
      },
      bookingBody: {
        padding: 16,
      },
      bookingBodyTop: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        marginBottom: 12,
      },
      bookingBodyLabel: {
        color: COLORS.textDim,
        fontSize: 10,
        fontWeight: 950,
        textTransform: "uppercase",
        letterSpacing: ".14em",
      },
      bookingBodyValue: {
        color: COLORS.mintSoft,
        fontSize: 13,
      },
      dateList: {
        display: "grid",
        gap: 8,
      },
      dateRow: {
        display: "flex",
        justifyContent: "space-between",
        gap: 10,
        alignItems: "center",
        padding: "11px 12px",
        borderRadius: 17,
        background: "rgba(255,255,255,.045)",
        border: `1px solid ${COLORS.line}`,
      },
      dateRowFull: {
        opacity: .58,
      },
      dateLabel: {
        fontSize: 13,
        fontWeight: 850,
      },
      dateSpots: {
        fontSize: 12,
        fontWeight: 950,
        color: COLORS.mintSoft,
      },
      dateSpotsFull: {
        color: "rgba(255,255,255,.58)",
      },
      bookingButton: {
        width: "100%",
        boxSizing: "border-box",
        textAlign: "center",
        marginTop: 13,
        border: "none",
        borderRadius: 999,
        padding: "14px 16px",
        background: "linear-gradient(135deg, #16f5a2 0%, #40e7ff 100%)",
        color: "#03150f",
        fontSize: 14,
        fontWeight: 950,
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
        background: active
          ? "linear-gradient(135deg, rgba(22,245,162,0.18), rgba(64,231,255,0.13))"
          : "rgba(255,255,255,0.04)",
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
        minHeight: isMobile ? 400 : 540,
        borderRadius: isMobile ? 32 : 42,
        border: `1px solid ${COLORS.lineStrong}`,
        background: "linear-gradient(145deg, rgba(8,24,18,0.72), rgba(7,17,13,0.92))",
        boxShadow: "0 30px 84px rgba(0,0,0,0.34)",
        cursor: "pointer",
        marginBottom: 20,
      },
      liveFeaturedImage: {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        transform: "scale(1.035)",
      },
      liveFeaturedOverlay: {
        position: "absolute",
        inset: 0,
        background: "linear-gradient(to top, rgba(1,3,2,0.99), rgba(1,3,2,0.42) 48%, rgba(1,3,2,0.08))",
      },
      liveFeaturedContent: {
        position: "absolute",
        left: isMobile ? 18 : 28,
        right: isMobile ? 18 : 28,
        bottom: isMobile ? 18 : 28,
      },
      liveFeaturedTopRow: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 12,
      },
      liveUrgentBadge: {
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        borderRadius: 999,
        background: "linear-gradient(135deg, #16f5a2 0%, #40e7ff 100%)",
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
        fontWeight: 850,
      },
      liveFeaturedTitle: {
        margin: 0,
        fontSize: isMobile ? 35 : 62,
        lineHeight: 0.94,
        fontWeight: 950,
        letterSpacing: "-0.07em",
        color: COLORS.text,
        maxWidth: 780,
      },
      liveMetaRow: {
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        marginTop: 14,
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
        fontWeight: 750,
      },
      liveButtons: {
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        gap: 10,
        marginTop: 16,
      },
      livePrimary: {
        border: "none",
        padding: isMobile ? "15px 18px" : "14px 22px",
        borderRadius: 999,
        background: "linear-gradient(135deg, #16f5a2 0%, #40e7ff 100%)",
        color: "#052018",
        fontWeight: 950,
        fontSize: 15,
        cursor: "pointer",
      },
      goingCard: {
        position: "relative",
        overflow: "hidden",
        minWidth: isMobile ? "82vw" : 334,
        width: isMobile ? "82vw" : 334,
        height: isMobile ? 360 : 390,
        flex: "0 0 auto",
        borderRadius: isMobile ? 28 : 30,
        border: `1px solid ${COLORS.lineStrong}`,
        background: "linear-gradient(145deg, rgba(8,24,18,0.74), rgba(7,17,13,0.92))",
        boxShadow: "0 20px 54px rgba(0,0,0,0.22)",
        scrollSnapAlign: "start",
        cursor: "pointer",
      },
      goingCardCompact: { height: isMobile ? 320 : 340 },
      goingCardImage: {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        transform: "scale(1.03)",
      },
      goingCardOverlayTop: {
        position: "absolute",
        inset: 0,
        background: "linear-gradient(to bottom, rgba(0,0,0,0.08), rgba(0,0,0,0.18))",
      },
      goingCardOverlayBottom: {
        position: "absolute",
        inset: 0,
        background: "linear-gradient(to top, rgba(4,14,10,0.98), rgba(4,14,10,0.16) 48%)",
      },
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
        background: "linear-gradient(135deg, #16f5a2 0%, #40e7ff 100%)",
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
        fontWeight: 850,
        fontSize: 11,
        whiteSpace: "nowrap",
      },
      goingCardBottom: { position: "absolute", left: 16, right: 16, bottom: 16 },
      goingCardTitle: {
        margin: 0,
        fontSize: isMobile ? 24 : 29,
        lineHeight: 1.02,
        fontWeight: 950,
        letterSpacing: "-0.045em",
        color: COLORS.text,
      },
      goingCardMetaLine: {
        marginTop: 10,
        color: COLORS.textSoft,
        fontSize: 14,
        fontWeight: 750,
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
        fontWeight: 850,
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
        borderRadius: 28,
        background: "linear-gradient(155deg, rgba(8,24,18,0.78), rgba(4,10,8,0.94))",
        border: `1px solid ${COLORS.line}`,
        cursor: "pointer",
        boxShadow: "0 18px 46px rgba(0,0,0,0.22)",
        minWidth: isMobile ? "82vw" : 312,
        flex: "0 0 auto",
        scrollSnapAlign: "start",
      },
      cardMedia: { position: "relative", width: "100%", height: isMobile ? 190 : 222, overflow: "hidden" },
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
        background: "linear-gradient(to bottom, rgba(0,0,0,0.08), rgba(0,0,0,0.18))",
      },
      cardMediaOverlayBottom: {
        position: "absolute",
        inset: 0,
        background: "linear-gradient(to top, rgba(4,14,10,0.96), rgba(4,14,10,0.08) 48%)",
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
        background: "linear-gradient(135deg, #16f5a2 0%, #40e7ff 100%)",
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
        fontWeight: 750,
        fontSize: 11,
        whiteSpace: "nowrap",
      },
      cardBody: { padding: isMobile ? 14 : 16 },
      cardTitle: {
        fontSize: isMobile ? 18 : 20,
        fontWeight: 950,
        lineHeight: 1.12,
        color: COLORS.text,
        marginBottom: 8,
        letterSpacing: "-0.025em",
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
      cardChips: { display: "flex", gap: 7, flexWrap: "wrap" },
      cardChip: {
        display: "inline-flex",
        alignItems: "center",
        padding: "5px 9px",
        borderRadius: 999,
        background: "rgba(255,255,255,0.03)",
        border: `1px solid ${COLORS.line}`,
        color: COLORS.text,
        fontWeight: 750,
      },
      cardMetaRight: { whiteSpace: "nowrap", fontWeight: 800, color: COLORS.text },
      emptyCard: {
        position: "relative",
        overflow: "hidden",
        borderRadius: 30,
        padding: isMobile ? "20px" : "26px",
        background: `
          radial-gradient(circle at 90% 0%, rgba(22,245,162,0.15), transparent 34%),
          linear-gradient(145deg, rgba(8,24,18,0.72), rgba(7,17,13,0.88))
        `,
        border: `1px solid ${COLORS.line}`,
      },
      emptyTitle: {
        fontSize: isMobile ? 22 : 28,
        fontWeight: 950,
        marginBottom: 8,
        color: COLORS.text,
        letterSpacing: "-0.04em",
      },
      emptyText: {
        fontSize: isMobile ? 14 : 15,
        lineHeight: 1.6,
        color: COLORS.textSoft,
        maxWidth: 720,
        marginBottom: 16,
      },
      emptyButton: {
        appearance: "none",
        border: "none",
        borderRadius: 999,
        padding: "13px 17px",
        background: "linear-gradient(135deg, #16f5a2 0%, #40e7ff 100%)",
        color: "#052018",
        fontWeight: 950,
        cursor: "pointer",
      },
    }),
    [isMobile, loaded]
  );

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <img src={HERO_IMAGE} alt="MeetOutdoors hero" style={styles.heroImage} />
        <div style={styles.heroOverlay} />
        <div style={styles.heroGrid} />

        <div style={styles.heroInner}>
          <div style={styles.heroContent}>
            <div style={styles.heroEyebrow}>
              <span style={styles.liveDotSmall} />
              <span>Real people • real outdoors • real experiences</span>
            </div>

            <h1 style={styles.heroTitle}>
              Don’t explore
              <br />
              alone.
              <br />
              <span style={styles.heroTitleAccent}>Book adventure.</span>
            </h1>

            <p style={styles.heroSubtitle}>
              Join live outdoor plans, discover community tours and reserve real partner
              experiences with available dates and real spots.
            </p>

            <div style={styles.heroActions}>
              <button type="button" style={styles.heroPrimaryBtn} onClick={() => navigate("/going-now")}>
                Open Going Now
              </button>
              <button
                type="button"
                style={styles.heroGhostBtn}
                onClick={() => navigate("/experiences")}
              >
                Search experiences
              </button>
            </div>

            <div style={styles.heroStats}>
              <div style={styles.heroStat}>
                <span style={styles.heroStatNum}>{goingNow.length || "Live"}</span>
                <span style={styles.heroStatLabel}>plans</span>
              </div>
              <div style={styles.heroStat}>
                <span style={styles.heroStatNum}>{tours.length || "Tours"}</span>
                <span style={styles.heroStatLabel}>community</span>
              </div>
              <div style={styles.heroStat}>
                <span style={styles.heroStatNum}>{experienceCards.length || "Host"}</span>
                <span style={styles.heroStatLabel}>booking</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={styles.sectionTight}>
        <PremiumQuickActions styles={styles} navigate={navigate} />
      </section>

      <section id="experiences" style={styles.section}>
        <SectionHeader
          styles={styles}
          eyebrow="Book experiences"
          title="Find your next outdoor host"
          subtitle="Search hosts, places, activities, dates and real package availability."
          actionLabel="Explore all"
          onAction={() => navigate("/experiences")}
        />

        <HorizontalRail styles={styles} railRef={bookingRailRef} isMobile={isMobile}>
          {visibleExperiences.map((experience) => (
            <ExperienceCard
              key={experience.id}
              experience={experience}
              styles={styles}
              onClick={() => {
                if (experience.slug) {
                  navigate(`/host/${experience.slug}`);
                  return;
                }
                navigate("/experiences");
              }}
            />
          ))}
        </HorizontalRail>
      </section>

      <section style={styles.section}>
        <SectionHeader
          styles={styles}
          eyebrow="Going now"
          title="The live heartbeat"
          subtitle="Instantly see what is happening now. Less scrolling, more real action."
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
            <button
              key={value}
              type="button"
              style={styles.liveFilterChip(liveFilter === value)}
              onClick={() => setLiveFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>

        {featuredLive ? (
          <>
            <GoingNowMainCard
              item={featuredLive}
              styles={styles}
              onClick={() => navigate(`/going-now/${featuredLive.id}`)}
            />

            <HorizontalRail styles={styles} railRef={liveRailRef} isMobile={isMobile}>
              {(filteredLiveNow.length ? filteredLiveNow : liveNowItems).map((item) => (
                <GoingNowSwipeCard
                  key={item.id}
                  item={item}
                  styles={styles}
                  onClick={() => navigate(`/going-now/${item.id}`)}
                />
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
                    <GoingNowSwipeCard
                      key={item.id}
                      item={item}
                      styles={styles}
                      onClick={() => navigate(`/going-now/${item.id}`)}
                      compact
                    />
                  ))}
                </HorizontalRail>
              </>
            ) : null}
          </>
        ) : (
          <div style={styles.emptyCard}>
            <div style={styles.emptyTitle}>Start the first live plan.</div>
            <div style={styles.emptyText}>
              No live plans yet. Create one and make MeetOutdoors feel alive from the first screen.
            </div>
            <button type="button" style={styles.emptyButton} onClick={() => navigate("/going-now/create")}>
              Create live plan
            </button>
          </div>
        )}
      </section>

      <section style={styles.section}>
        <SectionHeader
          styles={styles}
          eyebrow="Community tours"
          title="Fresh adventures"
          subtitle="Tours created by people and creators. This keeps the community alive while bookings bring revenue."
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
                rightMeta={`👥 ${tour.max_people || tour.capacity || "Group"}`}
                onClick={() => navigate(`/tour/${tour.id}`)}
              />
            ))}
          </HorizontalRail>
        ) : (
          <div style={styles.emptyCard}>
            <div style={styles.emptyTitle}>Create the first community tour.</div>
            <div style={styles.emptyText}>Your tours will appear here as a premium discovery rail.</div>
            <button type="button" style={styles.emptyButton} onClick={() => navigate("/create-tour")}>
              Create tour
            </button>
          </div>
        )}
      </section>

      <section style={styles.section}>
        <SectionHeader
          styles={styles}
          eyebrow="Events"
          title="Outdoor moments worth leaving home for"
          subtitle="Clean event cards for bigger community moments, challenges and MeetOutdoors campaigns."
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
                rightMeta={`🎫 ${eventItem.max_people || eventItem.capacity || "Open"}`}
                onClick={() => navigate(`/event/${eventItem.id}`)}
              />
            ))}
          </HorizontalRail>
        ) : (
          <div style={styles.emptyCard}>
            <div style={styles.emptyTitle}>Create the first event.</div>
            <div style={styles.emptyText}>When events start landing, they’ll appear here in the same premium system.</div>
            <button type="button" style={styles.emptyButton} onClick={() => navigate("/create-event")}>
              Create event
            </button>
          </div>
        )}
      </section>

      {loadingContent ? (
        <section style={styles.section}>
          <div style={styles.emptyCard}>
            <div style={styles.emptyTitle}>Loading MeetOutdoors…</div>
            <div style={styles.emptyText}>Pulling live plans, tours, events and experiences from Supabase.</div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
