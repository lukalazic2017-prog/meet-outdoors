import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";
import CookieSettingsButton from "../components/CookieSettingsButton";

/* =========================================================
   ICONS
========================================================= */

function Icon({
  name,
  size = 20,
  strokeWidth = 2,
  fill = "none",
  className = "",
}) {
  const icons = {
    arrowRight: (
      <>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    mapPin: (
      <>
        <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    compass: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" />
      </>
    ),
    hiking: (
      <>
        <path d="M3 20 9 9l4 7 3-5 5 9" />
        <path d="M4 20h16" />
        <circle cx="17" cy="5" r="2" />
      </>
    ),
    camping: (
      <>
        <path d="m4 20 8-15 8 15" />
        <path d="M8 20h8" />
        <path d="m12 5 4 15" />
      </>
    ),
    rafting: (
      <>
        <path d="M4 15h16l-2 4H6l-2-4Z" />
        <path d="m8 15 2-7" />
        <path d="m16 15-2-7" />
        <path d="M3 22c2-1 4-1 6 0 2 1 4 1 6 0 2-1 4-1 6 0" />
      </>
    ),
    cycling: (
      <>
        <circle cx="6" cy="17" r="4" />
        <circle cx="18" cy="17" r="4" />
        <path d="m6 17 4-8h4l4 8" />
        <path d="M10 9 8 6" />
        <path d="M13 6h3" />
        <path d="m10 9 4 8" />
      </>
    ),
    climbing: (
      <>
        <circle cx="15" cy="4" r="2" />
        <path d="m13 7-3 4 3 3-2 6" />
        <path d="m13 9 4 3 3-1" />
        <path d="m10 11-4 2-2 4" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M8 3v4M16 3v4M3 10h18" />
      </>
    ),
    users: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20v-2a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v2" />
        <path d="M16 4.5a3 3 0 0 1 0 6" />
        <path d="M17 13a5 5 0 0 1 4 5v2" />
      </>
    ),
    shield: (
      <>
        <path d="M12 3 5 6v5c0 4.6 2.9 8.4 7 10 4.1-1.6 7-5.4 7-10V6l-7-3Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    star: (
      <path d="m12 2.8 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9L6.4 20l1.1-6.2L3 9.4l6.2-.9L12 2.8Z" />
    ),
    plus: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),
    package: (
      <>
        <path d="m4 8 8-4 8 4-8 4-8-4Z" />
        <path d="m4 8 8 4 8-4" />
        <path d="M4 8v8l8 4 8-4V8" />
        <path d="M12 12v8" />
      </>
    ),
    dashboard: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    booking: (
      <>
        <rect x="4" y="4" width="16" height="17" rx="2" />
        <path d="M8 2v4M16 2v4M4 9h16" />
        <path d="m8 15 2 2 5-5" />
      </>
    ),
    heart: (
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
    ),
    eye: (
      <>
        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
        <circle cx="12" cy="12" r="2.5" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    trend: (
      <>
        <path d="m3 17 6-6 4 4 7-8" />
        <path d="M15 7h5v5" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    sparkles: (
      <>
        <path d="m12 3 1.1 3.4L16.5 8l-3.4 1.6L12 13l-1.1-3.4L7.5 8l3.4-1.6L12 3Z" />
        <path d="m19 14 .7 2.1L22 17l-2.3.9L19 20l-.7-2.1L16 17l2.3-.9L19 14Z" />
      </>
    ),
    filter: (
      <>
        <path d="M4 6h16M7 12h10M10 18h4" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),
    menu: (
      <>
        <path d="M4 7h16M4 12h16M4 17h16" />
      </>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {icons[name]}
    </svg>
  );
}

/* =========================================================
   DATA
========================================================= */

const categories = [
  { label: "Sve", value: "", icon: "compass" },
  { label: "Planinarenje", value: "hiking", icon: "hiking" },
  { label: "Kampovanje", value: "camping", icon: "camping" },
  { label: "Rafting", value: "rafting", icon: "rafting" },
  { label: "Biciklizam", value: "cycling", icon: "cycling" },
  { label: "Penjanje", value: "climbing", icon: "climbing" },
];




const HOME_FALLBACK_COVER =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=88";

const HOME_FALLBACK_AVATAR =
  "https://api.dicebear.com/8.x/initials/svg?seed=MeetOutdoors";

function formatHomeDate(value) {
  if (!value) return "Termin uskoro";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Termin uskoro";
  }

  return new Intl.DateTimeFormat("sr-Latn-RS", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

function formatHomePrice(value, currency = "EUR") {
  const number = Number(value || 0);

  if (!Number.isFinite(number) || number <= 0) {
    return "Besplatno";
  }

  return new Intl.NumberFormat("sr-Latn-RS", {
    style: "currency",
    currency: currency || "EUR",
    maximumFractionDigits: 0,
  }).format(number);
}

function notificationTarget(notification) {
  if (notification?.event_id) return `/event/${notification.event_id}`;
  if (notification?.package_id) return `/package/${notification.package_id}`;
  return "/notifications";
}

function isUnread(notification) {
  return notification?.is_read === false || notification?.read === false;
}

function isBookingNotification(notification) {
  const value = [
    notification?.type,
    notification?.title,
    notification?.message,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return value.includes("booking") || value.includes("rezerv");
}

function relativeTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return "Upravo sada";
  if (minutes < 60) return `Pre ${minutes} min`;
  if (hours < 24) return `Pre ${hours} h`;
  if (days === 1) return "Juče";
  if (days < 7) return `Pre ${days} dana`;
  return new Intl.DateTimeFormat("sr-Latn-RS", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

function HomeNotifications({ notifications, onRead, hostMode = false }) {
  const latest = notifications.slice(0, 4);
  const unreadCount = notifications.filter(isUnread).length;

  return (
    <section className={`homeNotifications pageContainer ${hostMode ? "hostMode" : "userMode"}`}>
      <div className="homeNotificationsHeader">
        <div>
          <span className="dashboardKicker">
            <span />
            {hostMode ? "Prioritet" : "Tvoja aktivnost"}
          </span>
          <h2>
            {unreadCount > 0
              ? `${unreadCount} ${unreadCount === 1 ? "novo obaveštenje" : "nova obaveštenja"}`
              : "Sve je pregledano."}
          </h2>
          <p>
            {hostMode
              ? "Nove rezervacije i važne promene vidiš odmah, bez osvežavanja stranice."
              : "Status rezervacija i važne promene stižu ovde u realnom vremenu."}
          </p>
        </div>

        <Link to="/notifications" className="homeNotificationsAll">
          Sva obaveštenja
          <Icon name="arrowRight" size={17} />
        </Link>
      </div>

      {latest.length > 0 ? (
        <div className="homeNotificationGrid">
          {latest.map((notification) => {
            const unread = isUnread(notification);
            return (
              <Link
                key={notification.id}
                to={notificationTarget(notification)}
                className={`homeNotificationCard ${unread ? "unread" : ""}`}
                onClick={() => onRead(notification)}
              >
                <span className="homeNotificationIcon">
                  <Icon name={isBookingNotification(notification) ? "booking" : "bell"} size={19} />
                </span>

                <div className="homeNotificationCopy">
                  <div>
                    <small>{isBookingNotification(notification) ? "Rezervacija" : "Obaveštenje"}</small>
                    <span>{relativeTime(notification.created_at)}</span>
                  </div>
                  <strong>{notification.title || "Novo obaveštenje"}</strong>
                  <p>{notification.message || "Imaš novu aktivnost na MeetOutdoors nalogu."}</p>
                </div>

                {unread && <span className="homeUnreadDot" />}
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="homeNotificationsEmpty">
          <span><Icon name="bell" size={22} /></span>
          <div>
            <strong>Nema novih obaveštenja.</strong>
            <p>Kada se nešto važno dogodi, pojaviće se ovde odmah.</p>
          </div>
        </div>
      )}
    </section>
  );
}

function useHomeLiveData(profile) {
  const userId = profile?.id || null;
  const role = profile?.role || null;

  const [platformStats, setPlatformStats] = useState({
    users: 0,
    hosts: 0,
    events: 0,
    packages: 0,
  });

  const [notifications, setNotifications] = useState([]);
  const [hostOwnStats, setHostOwnStats] = useState({
    events: 0,
    packages: 0,
  });

  const [homeDiscovery, setHomeDiscovery] = useState({
    hosts: [],
    events: [],
    packages: [],
    places: [],
  });

  useEffect(() => {
    let mounted = true;

    async function loadPlatformStats() {
      try {
        const [usersRes, hostsRes, eventsRes, packagesRes] =
          await Promise.all([
            supabase
              .from("profiles")
              .select("id", { count: "exact", head: true }),
            supabase
              .from("profiles")
              .select("id", { count: "exact", head: true })
              .eq("role", "host"),
            supabase
              .from("events")
              .select("id", { count: "exact", head: true }),
            supabase
              .from("packages")
              .select("id", { count: "exact", head: true }),
          ]);

        const firstError =
          usersRes.error ||
          hostsRes.error ||
          eventsRes.error ||
          packagesRes.error;

        if (firstError) {
          console.error(
            "Greška pri učitavanju statistike početne strane:",
            firstError
          );
          return;
        }

        if (!mounted) return;

        setPlatformStats({
          users: usersRes.count ?? 0,
          hosts: hostsRes.count ?? 0,
          events: eventsRes.count ?? 0,
          packages: packagesRes.count ?? 0,
        });
      } catch (error) {
        console.error(
          "Greška pri učitavanju statistike početne strane:",
          error
        );
      }
    }

    async function loadHomeDiscovery() {
      try {
        const now = new Date().toISOString();

        const [
          hostsRes,
          eventsRes,
          packagesRes,
          placesRes,
        ] = await Promise.all([
          supabase
            .from("profiles")
            .select(`
              id,
              username,
              full_name,
              city,
              country,
              avatar_url,
              cover_url,
              is_verified,
              created_at
            `)
            .eq("role", "host")
            .eq("account_status", "active")
            .order("created_at", { ascending: false })
            .limit(6),

          supabase
            .from("events")
            .select(`
              id,
              host_id,
              title,
              location,
              country,
              cover_url,
              price,
              capacity,
              start_date,
              created_at,
              is_active
            `)
            .eq("is_active", true)
            .gte("start_date", now)
            .order("created_at", { ascending: false })
            .limit(6),

          supabase
            .from("packages")
            .select(`
              id,
              host_id,
              title,
              location,
              country,
              cover_url,
              price,
              currency,
              duration,
              capacity,
              created_at,
              is_active
            `)
            .eq("is_active", true)
            .order("created_at", { ascending: false })
            .limit(6),

          supabase
            .from("places")
            .select(`
              id,
              name,
              cover_url,
              locality,
              region,
              country_name,
              checkins_count,
              photos_count,
              created_at,
              moderation_status,
              is_active
            `)
            .eq("is_active", true)
            .eq("moderation_status", "approved")
            .is("deleted_at", null)
            .order("created_at", { ascending: false })
            .limit(6),
        ]);

        const discoveryError =
          hostsRes.error ||
          eventsRes.error ||
          packagesRes.error ||
          placesRes.error;

        if (discoveryError) {
          console.error(
            "Greška pri učitavanju novog sadržaja za Home:",
            discoveryError
          );
          return;
        }

        if (!mounted) return;

        setHomeDiscovery({
          hosts: hostsRes.data ?? [],
          events: eventsRes.data ?? [],
          packages: packagesRes.data ?? [],
          places: placesRes.data ?? [],
        });
      } catch (error) {
        console.error(
          "Greška pri učitavanju novog sadržaja za Home:",
          error
        );
      }
    }

    void loadPlatformStats();
    void loadHomeDiscovery();

    const channel = supabase
      .channel("home-platform-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => {
          void loadPlatformStats();
          void loadHomeDiscovery();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "events" },
        () => {
          void loadPlatformStats();
          void loadHomeDiscovery();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "packages" },
        () => {
          void loadPlatformStats();
          void loadHomeDiscovery();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "places" },
        () => void loadHomeDiscovery()
      )
      .subscribe();

    return () => {
      mounted = false;
      void supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    if (!userId) {
      setNotifications([]);
      setHostOwnStats({ events: 0, packages: 0 });

      return () => {
        mounted = false;
      };
    }

    async function loadNotifications() {
      try {
        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(20);

        if (error) {
          console.error(
            "Greška pri učitavanju obaveštenja:",
            error
          );
          return;
        }

        if (mounted) {
          setNotifications(data ?? []);
        }
      } catch (error) {
        console.error("Greška pri učitavanju obaveštenja:", error);
      }
    }

    async function loadHostOwnStats() {
      if (role !== "host") {
        if (mounted) {
          setHostOwnStats({ events: 0, packages: 0 });
        }
        return;
      }

      try {
        const [eventsRes, packagesRes] = await Promise.all([
          supabase
            .from("events")
            .select("id", { count: "exact", head: true })
            .eq("host_id", userId),
          supabase
            .from("packages")
            .select("id", { count: "exact", head: true })
            .eq("host_id", userId),
        ]);

        const firstError = eventsRes.error || packagesRes.error;

        if (firstError) {
          console.error(
            "Greška pri učitavanju host statistike:",
            firstError
          );
          return;
        }

        if (!mounted) return;

        setHostOwnStats({
          events: eventsRes.count ?? 0,
          packages: packagesRes.count ?? 0,
        });
      } catch (error) {
        console.error(
          "Greška pri učitavanju host statistike:",
          error
        );
      }
    }

    void loadNotifications();
    void loadHostOwnStats();

    const notificationChannel = supabase
      .channel(`home-notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => void loadNotifications()
      )
      .subscribe();

    const hostChannel =
      role === "host"
        ? supabase
            .channel(`home-host-content-${userId}`)
            .on(
              "postgres_changes",
              {
                event: "*",
                schema: "public",
                table: "events",
                filter: `host_id=eq.${userId}`,
              },
              () => void loadHostOwnStats()
            )
            .on(
              "postgres_changes",
              {
                event: "*",
                schema: "public",
                table: "packages",
                filter: `host_id=eq.${userId}`,
              },
              () => void loadHostOwnStats()
            )
            .subscribe()
        : null;

    return () => {
      mounted = false;
      void supabase.removeChannel(notificationChannel);

      if (hostChannel) {
        void supabase.removeChannel(hostChannel);
      }
    };
  }, [role, userId]);

  async function markRead(notification) {
    if (!userId || !notification?.id || !isUnread(notification)) {
      return;
    }

    setNotifications((current) =>
      current.map((item) =>
        item.id === notification.id
          ? { ...item, is_read: true, read: true }
          : item
      )
    );

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notification.id)
        .eq("user_id", userId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error(
        "Greška pri označavanju obaveštenja kao pročitanog:",
        error
      );

      void (async () => {
        const { data } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(20);

        if (data) {
          setNotifications(data);
        }
      })();
    }
  }

  return {
    platformStats,
    notifications,
    hostOwnStats,
    homeDiscovery,
    markRead,
  };
}

/* =========================================================
   SHARED UI
========================================================= */

function AdventureSearch({ compact = false, firstName = "" }) {
  const navigate = useNavigate();

  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    const params = new URLSearchParams();

    if (location.trim()) params.set("location", location.trim());
    if (category) params.set("category", category);

    navigate(params.toString() ? `/events?${params.toString()}` : "/events");
  }

  return (
    <form
      className={compact ? "searchCard compact" : "searchCard"}
      onSubmit={handleSubmit}
    >
      <div className="searchTop">
        <div>
          <span>
            {firstName
              ? `Gde idemo sledeće, ${firstName}?`
              : "Pronađi sledeću avanturu"}
          </span>
          <strong>Šta želiš da istražiš?</strong>
        </div>

        <span className="searchTopIcon">
          <Icon name="sparkles" size={20} />
        </span>
      </div>

      <div className="searchMainRow">
        <label className="searchInput">
          <Icon name="mapPin" size={20} />

          <input
            type="search"
            value={location}
            placeholder="Grad, planina ili destinacija"
            onChange={(event) => setLocation(event.target.value)}
          />
        </label>

        <button type="submit" className="primarySearchButton">
          <Icon name="search" size={19} />
          <span>Istraži</span>
          <Icon name="arrowRight" size={18} />
        </button>
      </div>

      <div className="categoryRow">
        {categories.map((item) => (
          <button
            key={item.label}
            type="button"
            className={category === item.value ? "active" : ""}
            onClick={() => setCategory(item.value)}
          >
            <Icon name={item.icon} size={16} />
            {item.label}
          </button>
        ))}
      </div>
    </form>
  );
}

function SectionHeader({ kicker, title, description, linkTo, linkLabel }) {
  return (
    <div className="sectionHeading">
      <div>
        <span>{kicker}</span>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>

      {linkTo && (
        <Link to={linkTo} className="sectionLink">
          {linkLabel}
          <Icon name="arrowRight" size={18} />
        </Link>
      )}
    </div>
  );
}

function EventCards({ events = [] }) {
  if (events.length === 0) {
    return (
      <div className="liveHomeEmpty">
        <span>
          <Icon name="calendar" size={23} />
        </span>
        <div>
          <strong>Još nema novih aktivnih događaja.</strong>
          <p>Čim domaćini objave novu avanturu, pojaviće se ovde.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="eventGrid homeSwipeRow">
      {events.slice(0, 3).map((event) => {
        const eventLocation =
          [event.location, event.country]
            .filter(Boolean)
            .join(", ") || "Lokacija nije navedena";

        return (
          <Link
            key={event.id}
            to={`/event/${event.id}`}
            className="eventCard"
          >
            <img
              src={event.cover_url || HOME_FALLBACK_COVER}
              alt={event.title || "Outdoor događaj"}
            />

            <div className="eventOverlay" />

            <div className="eventTop">
              <span>Novi događaj</span>
              <span>{formatHomeDate(event.start_date)}</span>
            </div>

            <div className="eventBody">
              <div className="eventLocation">
                <Icon name="mapPin" size={15} />
                {eventLocation}
              </div>

              <h3>{event.title || "Outdoor događaj"}</h3>

              <div className="eventMetaLine">
                <span>
                  <Icon name="users" size={14} />
                  {event.capacity || "—"} mesta
                </span>
                <span>{formatHomePrice(event.price)}</span>
              </div>

              <div className="eventFooter">
                <div>
                  <small>Početak</small>
                  <strong>{formatHomeDate(event.start_date)}</strong>
                </div>

                <span>
                  <Icon name="arrowRight" />
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function HomeDiscoveryShowcase({ discovery }) {
  const hosts = discovery?.hosts || [];
  const packages = discovery?.packages || [];
  const places = discovery?.places || [];

  return (
    <section className="homeDiscovery pageContainer">
      <div className="homeDiscoveryIntro">
        <span className="dashboardKicker">
          <span />
          Novo na MeetOutdoors
        </span>

        <h2>Zajednica se menja svaki dan.</h2>

        <p>
          Najnoviji domaćini, ture i lokacije dolaze direktno iz MeetOutdoors
          zajednice.
        </p>
      </div>

      <div className="homeDiscoveryBlock">
        <SectionHeader
          kicker="Novi domaćini"
          title="Upoznaj ljude iza avantura."
          description="Najnoviji aktivni host profili na MeetOutdoors."
          linkTo="/hosts"
          linkLabel="Svi domaćini"
        />

        {hosts.length > 0 ? (
          <div className="homeHostGrid homeSwipeRow">
            {hosts.slice(0, 4).map((host) => {
              const hostLocation =
                [host.city, host.country]
                  .filter(Boolean)
                  .join(", ") || "Lokacija nije navedena";

              return (
                <Link
                  key={host.id}
                  to={`/h/${host.username}`}
                  className="homeHostCard"
                >
                  <div className="homeHostCover">
                    <img
                      src={host.cover_url || HOME_FALLBACK_COVER}
                      alt=""
                    />
                    <div />
                    <span>
                      {host.is_verified ? (
                        <>
                          <Icon name="shield" size={13} />
                          Verifikovan domaćin
                        </>
                      ) : (
                        "Novi domaćin"
                      )}
                    </span>
                  </div>

                  <div className="homeHostIdentity">
                    <img
                      src={host.avatar_url || HOME_FALLBACK_AVATAR}
                      alt={host.full_name || host.username || "Host"}
                    />

                    <div>
                      <strong>
                        {host.full_name ||
                          host.username ||
                          "MeetOutdoors domaćin"}
                      </strong>

                      <small>
                        <Icon name="mapPin" size={12} />
                        {hostLocation}
                      </small>
                    </div>

                    <Icon name="arrowRight" size={17} />
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="liveHomeEmpty">
            <span>
              <Icon name="users" size={23} />
            </span>
            <div>
              <strong>Još nema novih domaćina za prikaz.</strong>
              <p>Novi host profili će se automatski pojaviti ovde.</p>
            </div>
          </div>
        )}
      </div>

      <div className="homeDiscoveryBlock">
        <SectionHeader
          kicker="Nove ture i paketi"
          title="Nova iskustva koja možeš da rezervišeš."
          description="Najnovije aktivne ture i paketi, direktno od domaćina."
          linkTo="/packages"
          linkLabel="Svi paketi"
        />

        {packages.length > 0 ? (
          <div className="homePackageGrid homeSwipeRow">
            {packages.slice(0, 4).map((item) => {
              const packageLocation =
                [item.location, item.country]
                  .filter(Boolean)
                  .join(", ") || "Lokacija nije navedena";

              return (
                <Link
                  key={item.id}
                  to={`/package/${item.id}`}
                  className="homePackageCard"
                >
                  <div className="homePackageImage">
                    <img
                      src={item.cover_url || HOME_FALLBACK_COVER}
                      alt={item.title || "Outdoor paket"}
                    />
                    <div />
                    <span>
                      <Icon name="package" size={13} />
                      Novi paket
                    </span>
                  </div>

                  <div className="homePackageBody">
                    <small>
                      <Icon name="mapPin" size={13} />
                      {packageLocation}
                    </small>

                    <h3>{item.title || "Outdoor paket"}</h3>

                    <div>
                      <span>
                        <Icon name="clock" size={13} />
                        {item.duration || "Trajanje uskoro"}
                      </span>

                      <strong>
                        {formatHomePrice(
                          item.price,
                          item.currency || "EUR"
                        )}
                      </strong>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="liveHomeEmpty">
            <span>
              <Icon name="package" size={23} />
            </span>
            <div>
              <strong>Još nema novih aktivnih paketa.</strong>
              <p>Čim domaćin objavi paket, pojaviće se ovde.</p>
            </div>
          </div>
        )}
      </div>

      <div className="homeDiscoveryBlock placesBlock">
        <SectionHeader
          kicker="Novo na mapi"
          title="Mesta koja zajednica upravo otkriva."
          description="Najnovije odobrene i aktivne outdoor lokacije na MeetOutdoors mapi."
          linkTo="/explore"
          linkLabel="Otvori mapu"
        />

        {places.length > 0 ? (
          <div className="homePlaceGrid homeSwipeRow">
            {places.slice(0, 6).map((place) => {
              const placeLocation =
                [place.locality, place.region, place.country_name]
                  .filter(Boolean)
                  .join(" · ") || "Srbija";

              return (
                <Link
                  key={place.id}
                  to={`/explore/${place.id}`}
                  className="homePlaceCard"
                >
                  <img
                    src={place.cover_url || HOME_FALLBACK_COVER}
                    alt={place.name || "Outdoor lokacija"}
                  />

                  <div className="homePlaceShade" />

                  <div className="homePlaceCopy">
                    <small>
                      <Icon name="mapPin" size={13} />
                      {placeLocation}
                    </small>

                    <strong>{place.name}</strong>

                    <span>
                      {place.checkins_count || 0} check-inova ·{" "}
                      {place.photos_count || 0} fotografija
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="liveHomeEmpty">
            <span>
              <Icon name="mapPin" size={23} />
            </span>
            <div>
              <strong>Još nema novih lokacija za prikaz.</strong>
              <p>Odobrene lokacije će se automatski pojaviti ovde.</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}


/* =========================================================
   GUEST HOME
========================================================= */

function GuestHome({ platformStats, discovery }) {
  return (
    <main className="home">
      <section className="guestHero">
        <div className="heroMedia guestHeroBackground" />
        <div className="heroOverlay" />

        <div className="heroTopBar pageContainer">


         
        </div>

        <div className="pageContainer guestHeroContent">
          <div className="guestCopy">
            <span className="eyebrow">
              <span className="eyebrowDot" />
              Prave avanture. Pravi ljudi.
            </span>

            <h1>
              Vikend je prekratak
              <em>za dosadne planove.</em>
            </h1>

            <p>
              Otkrij outdoor događaje, upoznaj lokalne domaćine i
              rezerviši iskustva koja se pamte duže od jedne fotografije.
            </p>

            <div className="guestActions">
              <Link to="/events" className="lightButton">
                Istraži avanture
                <Icon name="arrowRight" />
              </Link>

              <Link to="/signup" className="glassButton">
                Pridruži se zajednici
              </Link>
            </div>

            <div className="guestProof liveProof">
              <div>
                <strong>{platformStats.users}</strong>
                <span>registrovanih ljudi</span>
              </div>
              <div>
                <strong>{platformStats.hosts}</strong>
                <span>aktivnih domaćina</span>
              </div>
              <div>
                <strong>{platformStats.events}</strong>
                <span>aktivnih događaja</span>
              </div>
              <div>
                <strong>{platformStats.packages}</strong>
                <span>paketa i tura</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="guestSearchWrap pageContainer">
        <AdventureSearch />
      </div>

      <section className="featuredSection pageContainer firstSection">
        <SectionHeader
          kicker="Najnoviji događaji"
          title="Nove avanture na MeetOutdoors."
          description="Poslednji aktivni događaji koje su domaćini objavili na platformi."
          linkTo="/events"
          linkLabel="Pogledaj sve"
        />

        <EventCards events={discovery.events} />
      </section>

      <HomeDiscoveryShowcase discovery={discovery} />

      <section className="trustStrip pageContainer">
        <article>
          <span>
            <Icon name="shield" size={22} />
          </span>
          <div>
            <strong>Provereni domaćini</strong>
            <p>Jasni profili, ocene i iskustva drugih korisnika.</p>
          </div>
        </article>

        <article>
          <span>
            <Icon name="booking" size={22} />
          </span>
          <div>
            <strong>Jednostavna rezervacija</strong>
            <p>Bez lutanja po porukama i nepotrebnog čekanja.</p>
          </div>
        </article>

        <article>
          <span>
            <Icon name="users" size={22} />
          </span>
          <div>
            <strong>Zajednica, ne oglasnik</strong>
            <p>Ljudi, događaji i priče na jednom mestu.</p>
          </div>
        </article>
      </section>

      <section className="roleChoice pageContainer">
        <SectionHeader
          kicker="Jedna platforma, dve uloge"
          title="Doživi prirodu ili je pretvori u posao."
          description="MeetOutdoors radi i za ljude koji traže iskustva i za domaćine koji ih kreiraju."
        />

        <div className="roleGrid">
          <article className="roleCard userRole">
            <div className="roleImage roleUserImage" />
            <div className="roleGradient" />

            <div className="roleContent">
              <span className="roleNumber">01 / Avanturista</span>
              <h3>Pronađi ljude i mesta zbog kojih se vikend pamti.</h3>
              <p>
                Pretraži događaje, sačuvaj favorite i rezerviši sledeću
                avanturu bez komplikacija.
              </p>

              <Link to="/signup">
                Pridruži se kao korisnik
                <Icon name="arrowRight" />
              </Link>
            </div>
          </article>

          <article className="roleCard hostRole">
            <div className="roleImage roleHostImage" />
            <div className="roleGradient" />

            <div className="roleContent">
              <span className="roleNumber">02 / Domaćin</span>
              <h3>Pretvori znanje, lokaciju i energiju u iskustvo.</h3>
              <p>
                Objavi događaje, upravljaj rezervacijama i gradi reputaciju
                pouzdanog outdoor domaćina.
              </p>

              <Link to="/signup">
                Postani domaćin
                <Icon name="arrowRight" />
              </Link>
            </div>
          </article>
        </div>
      </section>

      <section className="guestFinal">
        <div className="guestFinalBackground" />
        <div className="guestFinalOverlay" />

        <div className="guestFinalContent">
          <span>MeetOutdoors zajednica</span>

          <h2>
            Manje planiranja.
            <em>Više života napolju.</em>
          </h2>

          <p>
            Napravi nalog i pronađi ljude, mesta i iskustva zbog kojih ćeš
            želeti da vikend traje duže.
          </p>

          <Link to="/signup" className="lightButton">
            Kreiraj besplatan nalog
            <Icon name="arrowRight" />
          </Link>
        </div>
      </section>
    </main>
  );
}

/* =========================================================
   USER HOME
========================================================= */

function UserHome({ profile, notifications, onRead, discovery }) {
  const firstName = useMemo(() => {
    if (!profile?.full_name) return "";
    return profile.full_name.trim().split(" ")[0];
  }, [profile]);

  return (
    <main className="home userHome">
      <section className="userTop pageContainer">
        <div className="userGreeting">
          <span className="dashboardKicker">
            <span />
            Dobrodošao nazad
          </span>

          <h1>
            {firstName ? `${firstName}, ` : ""}
            šta ti treba od vikenda?
          </h1>

          <p>
            Izaberi pravac, pronađi događaj i rezerviši mesto bez
            nepotrebnog skrolovanja.
          </p>
        </div>

        <div className="userTopActions">
          <Link to="/my-bookings">
            <Icon name="booking" size={18} />
            Moje rezervacije
          </Link>

          <Link to="/my-events">
            <Icon name="heart" size={18} />
            Sačuvano
          </Link>
        </div>
      </section>

      <HomeNotifications notifications={notifications} onRead={onRead} />

      <section className="userSearchStage pageContainer">
        <div className="userSearchImage" />
        <div className="userSearchOverlay" />

        <div className="userSearchCopy">
          <span>Brza pretraga</span>
          <h2>Nađi avanturu za manje od jednog minuta.</h2>
          <p>
            Lokacija, aktivnost i jedan klik. Ostalo ćemo skratiti koliko
            možemo.
          </p>
        </div>

        <AdventureSearch compact firstName={firstName} />
      </section>

      <section className="quickLinks pageContainer">
        <Link to="/events">
          <span>
            <Icon name="compass" />
          </span>
          <div>
            <strong>Istraži događaje</strong>
            <small>Jednodnevne avanture i okupljanja</small>
          </div>
          <Icon name="arrowRight" />
        </Link>

        <Link to="/packages">
          <span>
            <Icon name="package" />
          </span>
          <div>
            <strong>Adventure paketi</strong>
            <small>Kompletna višednevna iskustva</small>
          </div>
          <Icon name="arrowRight" />
        </Link>

        <Link to="/hosts">
          <span>
            <Icon name="users" />
          </span>
          <div>
            <strong>Pronađi domaćina</strong>
            <small>Upoznaj lokalne eksperte</small>
          </div>
          <Icon name="arrowRight" />
        </Link>
      </section>

      <section className="featuredSection pageContainer">
        <SectionHeader
          kicker="Najnoviji događaji"
          title="Tvoj sledeći vikend može početi ovde."
          description="Najnoviji aktivni događaji koje su domaćini upravo objavili."
          linkTo="/events"
          linkLabel="Svi događaji"
        />

        <EventCards events={discovery.events} />
      </section>

      <HomeDiscoveryShowcase discovery={discovery} />

      <section className="userDashboardGrid pageContainer">
        <div className="upcomingCard">
          <div className="miniHeader">
            <div>
              <span>Novo na platformi</span>
              <h3>Sveže objavljeno.</h3>
            </div>

            <Link to="/events">
              Sve
              <Icon name="arrowRight" size={16} />
            </Link>
          </div>

          <div className="upcomingList">
            {[
              ...discovery.events.slice(0, 2).map((event) => ({
                id: `event-${event.id}`,
                title: event.title,
                date: formatHomeDate(event.start_date),
                status: "Događaj",
                icon: "calendar",
                to: `/event/${event.id}`,
              })),
              ...discovery.packages.slice(0, 2).map((item) => ({
                id: `package-${item.id}`,
                title: item.title,
                date: [item.location, item.country]
                  .filter(Boolean)
                  .join(", ") || "Nova outdoor ponuda",
                status: "Paket",
                icon: "package",
                to: `/package/${item.id}`,
              })),
            ]
              .slice(0, 4)
              .map((entry) => (
                <Link to={entry.to} key={entry.id}>
                  <span className="upcomingIcon">
                    <Icon name={entry.icon} size={19} />
                  </span>

                  <div>
                    <strong>{entry.title}</strong>
                    <small>{entry.date}</small>
                  </div>

                  <span className="tripStatus confirmed">
                    {entry.status}
                  </span>
                </Link>
              ))}

            {discovery.events.length === 0 &&
              discovery.packages.length === 0 && (
                <div className="homeMiniEmpty">
                  Novi događaji i paketi će se pojaviti ovde.
                </div>
              )}
          </div>
        </div>

        <div className="userSidePromo">
          <div className="userSidePromoImage" />
          <div className="userSidePromoOverlay" />

          <div>
            <span>
              <Icon name="sparkles" size={16} />
              Izađi iz rutine
            </span>

            <h3>Ne čekaj savršen trenutak. Napravi ga.</h3>

            <Link to="/events">
              Pronađi avanturu
              <Icon name="arrowRight" size={16} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

/* =========================================================
   HOST HOME
========================================================= */

function HostHome({ profile, notifications, onRead, hostOwnStats }) {
  const firstName = useMemo(() => {
    if (!profile?.full_name) return "Domaćine";
    return profile.full_name.trim().split(" ")[0];
  }, [profile]);

  const unreadCount = notifications.filter(isUnread).length;
  const bookingAlerts = notifications.filter(
    (notification) => isUnread(notification) && isBookingNotification(notification)
  ).length;

  const liveStats = [
    {
      label: "Aktivni događaji",
      value: hostOwnStats.events,
      description: "Objavljeno i aktivno",
      icon: "calendar",
    },
    {
      label: "Aktivni paketi",
      value: hostOwnStats.packages,
      description: "Paketi na tvom profilu",
      icon: "package",
    },
    {
      label: "Nove rezervacije",
      value: bookingAlerts,
      description: "Traže tvoju pažnju",
      icon: "booking",
    },
    {
      label: "Nepročitano",
      value: unreadCount,
      description: "Nova obaveštenja",
      icon: "bell",
    },
  ];

  return (
    <main className="home hostHome">
      <section className="hostTop pageContainer">
        <div>
          <span className="dashboardKicker">
            <span />
            Host studio uživo
          </span>

          <h1>Dobrodošao nazad, {firstName}.</h1>

          <p>
            Rezervacije, obaveštenja i tvoje objave su na jednom mestu.
            Ono što traži odgovor ide prvo.
          </p>
        </div>

        <div className="hostTopActions hostTopActionsTriple">
          <Link to="/create-event" className="hostPrimaryAction">
            <Icon name="plus" size={18} />
            Novi događaj
          </Link>

          <Link to="/create-package" className="hostSecondaryAction">
            <Icon name="package" size={18} />
            Novi paket
          </Link>

          <Link to="/dashboard" className="hostSecondaryAction">
            <Icon name="dashboard" size={18} />
            Dashboard
          </Link>
        </div>
      </section>

      <section className="hostOverview pageContainer">
        <div className="hostOverviewHero">
          <div className="hostOverviewImage" />
          <div className="hostOverviewOverlay" />

          <div className="hostOverviewCopy">
            <span>Današnji fokus</span>
            <h2>
              {bookingAlerts > 0
                ? `${bookingAlerts} ${bookingAlerts === 1 ? "nova rezervacija čeka" : "nove rezervacije čekaju"} odgovor.`
                : unreadCount > 0
                  ? `${unreadCount} ${unreadCount === 1 ? "novo obaveštenje čeka" : "nova obaveštenja čekaju"}.`
                  : "Sve je pod kontrolom."}
            </h2>
            <p>
              {bookingAlerts > 0
                ? "Odgovori gostima dok je interesovanje sveže. Nove aktivnosti stižu ovde u realnom vremenu."
                : "Nema hitnih zahteva. Možeš da se fokusiraš na nove događaje i pakete."}
            </p>

            <Link to={bookingAlerts > 0 ? "/host-bookings" : "/notifications"} className="lightButton">
              {bookingAlerts > 0 ? "Otvori rezervacije" : "Otvori obaveštenja"}
              <Icon name="arrowRight" />
            </Link>
          </div>
        </div>

        <div className="hostTodayCard">
          <div className="hostTodayTop">
            <div>
              <span>Pregled uživo</span>
              <strong>Tvoj host studio</strong>
            </div>

            <div className="onlineBadge">
              <span />
              Realtime
            </div>
          </div>

          <div className="hostTodayStats">
            <article>
              <Icon name="booking" />
              <div>
                <strong>{bookingAlerts}</strong>
                <span>Nove rezervacije</span>
              </div>
            </article>

            <article>
              <Icon name="calendar" />
              <div>
                <strong>{hostOwnStats.events}</strong>
                <span>Aktivni događaji</span>
              </div>
            </article>

            <article>
              <Icon name="package" />
              <div>
                <strong>{hostOwnStats.packages}</strong>
                <span>Aktivni paketi</span>
              </div>
            </article>
          </div>

          <Link to="/dashboard">
            Pogledaj kompletan pregled
            <Icon name="arrowRight" />
          </Link>
        </div>
      </section>

      <section className="hostStats pageContainer">
        {liveStats.map((stat) => (
          <article key={stat.label}>
            <div className="hostStatIcon">
              <Icon name={stat.icon} />
            </div>

            <div className="hostStatTop">
              <span>{stat.label}</span>
              <Icon name="trend" size={17} />
            </div>

            <strong>{stat.value}</strong>
            <small>{stat.description}</small>
          </article>
        ))}
      </section>

      <HomeNotifications
        notifications={notifications}
        onRead={onRead}
        hostMode
      />

      <section className="hostWorkspace pageContainer hostWorkspaceLive">
        <div className="hostMainColumn">
          <div className="hostSectionHeader">
            <div>
              <span>Tvoj sadržaj</span>
              <h2>Objavljuj bez gubljenja vremena.</h2>
            </div>

            <Link to="/dashboard">
              Host studio
              <Icon name="arrowRight" size={17} />
            </Link>
          </div>

          <div className="hostCreationGrid">
            <Link to="/create-event" className="hostCreationCard eventCreation">
              <span><Icon name="calendar" size={24} /></span>
              <small>Jednodnevna avantura</small>
              <h3>Kreiraj novi događaj.</h3>
              <p>Dodaj termin, lokaciju, kapacitet, cenu i naslovnu fotografiju.</p>
              <strong>Pokreni kreiranje <Icon name="arrowRight" size={18} /></strong>
            </Link>

            <Link to="/create-package" className="hostCreationCard packageCreation">
              <span><Icon name="package" size={24} /></span>
              <small>Kompletno iskustvo</small>
              <h3>Kreiraj novi paket.</h3>
              <p>Složi višednevnu ponudu sa sadržajem, terminima i cenom.</p>
              <strong>Pokreni kreiranje <Icon name="arrowRight" size={18} /></strong>
            </Link>
          </div>
        </div>

        <aside className="hostSideColumn">
          <div className="quickCreateCard liveSummaryCard">
            <span className="hostCardKicker">Tvoj profil uživo</span>
            <h3>Šta je trenutno aktivno?</h3>

            <Link to={`/h/${profile.username}`}>
              <span><Icon name="eye" /></span>
              <div>
                <strong>Pogledaj javni profil</strong>
                <small>Proveri kako gost vidi tvoju ponudu</small>
              </div>
              <Icon name="arrowRight" />
            </Link>

            <Link to="/notifications">
              <span><Icon name="bell" /></span>
              <div>
                <strong>{unreadCount} nepročitanih</strong>
                <small>Rezervacije i promene naloga</small>
              </div>
              <Icon name="arrowRight" />
            </Link>
          </div>

          <div className="profileProgressCard">
            <div className="progressTop">
              <span>Host profil</span>
              <strong>Aktivan</strong>
            </div>

            <div className="progressBar"><span /></div>
            <h3>Neka profil prodaje iskustvo umesto tebe.</h3>
            <p>
              Fotografije, opis i jasna ponuda povećavaju poverenje pre nego što gost pošalje rezervaciju.
            </p>

            <Link to="/edit-profile">
              Uredi profil
              <Icon name="arrowRight" size={17} />
            </Link>
          </div>
        </aside>
      </section>

      <section className="hostMotivation pageContainer">
        <div className="hostMotivationImage" />
        <div className="hostMotivationOverlay" />

        <div className="hostMotivationContent">
          <span>Tvoja zajednica raste</span>
          <h2>
            Ne organizuješ samo događaje.
            <em>Stvaraš uspomene.</em>
          </h2>
          <p>
            Svaki novi događaj i paket je prilika da neko otkrije novo mesto,
            upozna nove ljude i ponese priču koju će dugo pamtiti.
          </p>

          <div className="hostMotivationActions">
            <Link to="/create-event" className="lightButton">
              Kreiraj događaj
              <Icon name="arrowRight" />
            </Link>
            <Link to="/create-package" className="glassButton">
              Kreiraj paket
              <Icon name="arrowRight" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function HomeLegalFooter() {
  return (
    <footer className="homeLegalFooter">
      <div className="pageContainer homeLegalFooterInner">
        <div className="homeLegalBrand">
          <strong>MeetOutdoors</strong>
          <span>Prave avanture. Pravi ljudi.</span>
        </div>

        <nav className="homeLegalLinks" aria-label="Pravne informacije">
          <Link to="/terms">Uslovi korišćenja</Link>
          <Link to="/privacy">Politika privatnosti</Link>
          <Link to="/cookies">Politika kolačića</Link>
          <CookieSettingsButton className="homeCookieSettings">
            Podešavanja kolačića
          </CookieSettingsButton>
        </nav>

        <span className="homeLegalCopyright">
          © {new Date().getFullYear()} MeetOutdoors. Sva prava zadržana.
        </span>
      </div>
    </footer>
  );
}

/* =========================================================
   MAIN
========================================================= */

export default function Home() {
  const { profile, loading } = useAuth();
  const {
    platformStats,
    notifications,
    hostOwnStats,
    homeDiscovery,
    markRead,
  } = useHomeLiveData(profile);

  if (loading) {
    return (
      <>
        <HomeStyles />
        <div className="homeLoading">
          <div className="loadingLogo">
            <Icon name="compass" size={31} />
          </div>
          <span>MeetOutdoors</span>
        </div>
      </>
    );
  }

  const isHost = profile?.role === "host";
  const isUser = profile && !isHost;

  return (
    <>
      <HomeStyles />
      {!profile && <GuestHome platformStats={platformStats} discovery={homeDiscovery} />}
      {isUser && (
        <UserHome
          profile={profile}
          notifications={notifications}
          onRead={markRead}
          discovery={homeDiscovery}
        />
      )}
      {isHost && (
        <HostHome
          profile={profile}
          notifications={notifications}
          onRead={markRead}
          hostOwnStats={hostOwnStats}
        />
      )}
      <HomeLegalFooter />
    </>
  );
}

/* =========================================================
   STYLES
========================================================= */

function HomeStyles() {
  return (
    <style>{`
      * {
        box-sizing: border-box;
      }

      html {
        scroll-behavior: smooth;
      }

      body {
        margin: 0;
        background: #f4f5ef;
      }

      button,
      input {
        font: inherit;
      }

      button,
      a {
        -webkit-tap-highlight-color: transparent;
      }

      .home {
        min-height: 100vh;
        overflow: hidden;
        background:
          radial-gradient(circle at 12% 18%, rgba(166, 201, 128, 0.14), transparent 27%),
          #f4f5ef;
        color: #14251d;
        font-family:
          Inter,
          ui-sans-serif,
          system-ui,
          -apple-system,
          BlinkMacSystemFont,
          "Segoe UI",
          sans-serif;
      }

      .home a {
        color: inherit;
        text-decoration: none;
      }

      .pageContainer {
        width: min(1200px, calc(100% - 48px));
        margin-inline: auto;
      }

      .eyebrow,
      .dashboardKicker {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        font-weight: 850;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .eyebrow {
        padding: 9px 14px;
        border: 1px solid rgba(255,255,255,0.22);
        border-radius: 999px;
        background: rgba(255,255,255,0.1);
        backdrop-filter: blur(15px);
        color: white;
        font-size: 12px;
      }

      .dashboardKicker {
        color: #6c8b4d;
        font-size: 10px;
      }

      .eyebrowDot,
      .dashboardKicker > span {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #c9f28c;
        box-shadow: 0 0 0 5px rgba(201,242,140,0.13);
      }

      .dashboardKicker > span {
        background: #719b4e;
        box-shadow: 0 0 0 5px rgba(113,155,78,0.1);
      }

      .lightButton,
      .glassButton,
      .hostPrimaryAction,
      .hostSecondaryAction {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 11px;
        min-height: 56px;
        padding: 0 22px;
        border-radius: 16px;
        font-size: 14px;
        font-weight: 850;
        transition: 0.22s ease;
      }

      .lightButton,
      .hostPrimaryAction {
        background: #c9f28c;
        color: #153020 !important;
        box-shadow: 0 17px 38px rgba(0,0,0,0.18);
      }

      .glassButton {
        border: 1px solid rgba(255,255,255,0.25);
        background: rgba(255,255,255,0.09);
        color: white !important;
        backdrop-filter: blur(14px);
      }

      .hostSecondaryAction {
        border: 1px solid #d9e1d5;
        background: white;
        color: #34513e;
      }

      .lightButton:hover,
      .glassButton:hover,
      .hostPrimaryAction:hover,
      .hostSecondaryAction:hover {
        transform: translateY(-2px);
      }

      /* HERO / GUEST */

      .guestHero {
        position: relative;
        isolation: isolate;
        min-height: 760px;
        display: flex;
        align-items: center;
        padding: 135px 0 105px;
        color: white;
      }

      .heroMedia,
      .heroOverlay {
        position: absolute;
        inset: 0;
      }

      .heroMedia {
        z-index: -3;
        background-size: cover;
        background-position: center;
      }

      .guestHeroBackground {
        background-image:
          url("https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2200&q=92");
      }

      .heroOverlay {
        z-index: -2;
        background:
          linear-gradient(90deg, rgba(5,16,10,0.95), rgba(6,18,11,0.72) 58%, rgba(6,18,11,0.22)),
          linear-gradient(0deg, rgba(6,16,10,0.6), transparent 58%);
      }

      .heroTopBar {
        position: absolute;
        top: 28px;
        left: 50%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        transform: translateX(-50%);
      }

      .homeBrand {
        display: inline-flex;
        align-items: center;
        gap: 11px;
        color: white !important;
        font-size: 16px;
        font-weight: 900;
        letter-spacing: -0.03em;
      }

      .homeBrand > span {
        display: grid;
        place-items: center;
        width: 44px;
        height: 44px;
        border: 1px solid rgba(255,255,255,0.18);
        border-radius: 14px;
        background: rgba(255,255,255,0.1);
        color: #c9f28c;
        backdrop-filter: blur(14px);
      }

      .heroTopActions {
        display: flex;
        align-items: center;
        gap: 9px;
      }

      .heroTopActions a {
        display: inline-flex;
        align-items: center;
        min-height: 42px;
        padding: 0 14px;
        border-radius: 13px;
        font-size: 11px;
        font-weight: 850;
      }

      .heroLoginLink {
        border: 1px solid rgba(255,255,255,0.18);
        background: rgba(255,255,255,0.08);
        color: white !important;
      }

      .heroJoinLink {
        background: #c9f28c;
        color: #173021 !important;
      }

      .guestHeroContent {
        display: block;
      }

      .guestCopy {
        max-width: 820px;
      }

      .guestCopy h1 {
        margin: 24px 0 0;
        font-size: clamp(58px, 7vw, 95px);
        line-height: 0.93;
        letter-spacing: -0.075em;
      }

      .guestCopy h1 em {
        display: block;
        color: #c9f28c;
        font-style: normal;
      }

      .guestCopy > p {
        max-width: 650px;
        margin: 27px 0 0;
        color: rgba(255,255,255,0.72);
        font-size: 17px;
        line-height: 1.72;
      }

      .guestActions {
        display: flex;
        flex-wrap: wrap;
        gap: 13px;
        margin-top: 32px;
      }

      .guestProof {
        display: flex;
        flex-wrap: wrap;
        gap: 34px;
        margin-top: 40px;
      }

      .guestProof div {
        display: grid;
        gap: 3px;
      }

      .guestProof strong {
        font-size: 22px;
      }

      .guestProof span {
        color: rgba(255,255,255,0.55);
        font-size: 12px;
      }

      /* SEARCH */

      .guestSearchWrap {
        position: relative;
        z-index: 5;
        margin-top: -67px;
      }

      .searchCard,
      .hostTodayCard {
        padding: 25px;
        border: 1px solid rgba(34,52,41,0.1);
        border-radius: 26px;
        background: rgba(249,250,246,0.97);
        color: #14251d;
        box-shadow: 0 28px 75px rgba(22,39,29,0.16);
        backdrop-filter: blur(22px);
      }

      .searchCard.compact {
        box-shadow: none;
        border-color: rgba(255,255,255,0.13);
      }

      .searchTop,
      .hostTodayTop {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 20px;
        margin-bottom: 18px;
      }

      .searchTop span,
      .hostTodayTop span {
        display: block;
        margin-bottom: 5px;
        color: #758177;
        font-size: 10px;
        font-weight: 850;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .searchTop strong,
      .hostTodayTop strong {
        font-size: 22px;
        letter-spacing: -0.035em;
      }

      .searchTopIcon {
        display: grid !important;
        place-items: center;
        flex: 0 0 auto;
        width: 43px;
        height: 43px;
        margin: 0 !important;
        border-radius: 14px;
        background: #e8f3da;
        color: #416329 !important;
      }

      .searchMainRow {
        display: grid;
        grid-template-columns: minmax(0,1fr) auto;
        gap: 10px;
      }

      .searchInput {
        display: flex;
        align-items: center;
        gap: 12px;
        min-height: 57px;
        padding: 0 17px;
        border: 1px solid #d8ded5;
        border-radius: 16px;
        background: white;
        color: #68756d;
      }

      .searchInput:focus-within {
        border-color: #789a51;
        box-shadow: 0 0 0 4px rgba(120,154,81,0.12);
      }

      .searchInput input {
        width: 100%;
        min-height: 55px;
        border: 0;
        outline: 0;
        background: transparent;
        color: #14251d;
      }

      .primarySearchButton {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 9px;
        min-width: 150px;
        min-height: 57px;
        padding: 0 18px;
        border: 0;
        border-radius: 16px;
        background: #172f22;
        color: white;
        cursor: pointer;
        font-weight: 850;
        box-shadow: 0 15px 30px rgba(23,47,34,0.16);
      }

      .categoryRow {
        display: flex;
        gap: 8px;
        margin: 14px -3px -2px;
        padding: 3px;
        overflow-x: auto;
        scrollbar-width: none;
      }

      .categoryRow::-webkit-scrollbar {
        display: none;
      }

      .categoryRow button {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        flex: 0 0 auto;
        min-height: 39px;
        padding: 0 12px;
        border: 1px solid #d9dfd6;
        border-radius: 999px;
        background: transparent;
        color: #69746c;
        cursor: pointer;
        font-size: 11px;
        font-weight: 750;
      }

      .categoryRow button.active {
        border-color: #183a27;
        background: #183a27;
        color: white;
      }

      /* SECTIONS */

      .featuredSection,
      .roleChoice {
        padding: 105px 0;
      }

      .firstSection {
        padding-top: 120px;
      }

      .sectionHeading {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 24px;
        margin-bottom: 34px;
      }

      .sectionHeading > div {
        max-width: 760px;
      }

      .sectionHeading span,
      .hostSectionHeader > div > span,
      .hostCardKicker {
        display: block;
        margin-bottom: 10px;
        color: #718d52;
        font-size: 10px;
        font-weight: 900;
        letter-spacing: 0.13em;
        text-transform: uppercase;
      }

      .sectionHeading h2,
      .hostSectionHeader h2 {
        margin: 0;
        font-size: clamp(38px, 5vw, 60px);
        line-height: 1.02;
        letter-spacing: -0.06em;
      }

      .sectionHeading p {
        max-width: 650px;
        margin: 14px 0 0;
        color: #758178;
        font-size: 13px;
        line-height: 1.65;
      }

      .sectionLink,
      .hostSectionHeader > a {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding-bottom: 5px;
        border-bottom: 1px solid #9ba79e;
        font-size: 12px;
        font-weight: 850;
      }

      /* EVENTS */

      .eventGrid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 18px;
      }

      .eventCard {
        position: relative;
        min-height: 490px;
        overflow: hidden;
        border-radius: 27px;
        color: white;
        box-shadow: 0 20px 50px rgba(24,41,31,0.14);
        transition: 0.28s ease;
      }

      .eventCard:hover {
        transform: translateY(-6px);
        box-shadow: 0 30px 70px rgba(24,41,31,0.22);
      }

      .eventCard > img,
      .eventOverlay {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
      }

      .eventCard > img {
        object-fit: cover;
        transition: transform 0.7s ease;
      }

      .eventCard:hover > img {
        transform: scale(1.06);
      }

      .eventOverlay {
        background:
          linear-gradient(180deg, rgba(5,14,8,0.08), rgba(5,15,9,0.94));
      }

      .eventTop {
        position: absolute;
        top: 15px;
        left: 15px;
        right: 64px;
        display: flex;
        justify-content: space-between;
        gap: 10px;
      }

      .eventTop span {
        padding: 8px 10px;
        border: 1px solid rgba(255,255,255,0.18);
        border-radius: 999px;
        background: rgba(7,20,12,0.45);
        backdrop-filter: blur(11px);
        font-size: 9px;
        font-weight: 850;
      }

      .eventHeart {
        position: absolute;
        top: 15px;
        right: 15px;
        z-index: 2;
        display: grid;
        place-items: center;
        width: 40px;
        height: 40px;
        padding: 0;
        border: 1px solid rgba(255,255,255,0.18);
        border-radius: 13px;
        background: rgba(7,20,12,0.45);
        color: white;
        cursor: pointer;
        backdrop-filter: blur(11px);
      }

      .eventBody {
        position: absolute;
        inset: auto 0 0;
        padding: 22px;
      }

      .eventLocation,
      .eventMetaLine,
      .eventMetaLine span {
        display: flex;
        align-items: center;
      }

      .eventLocation {
        gap: 6px;
        color: rgba(255,255,255,0.64);
        font-size: 11px;
      }

      .eventBody h3 {
        margin: 9px 0 13px;
        font-size: 26px;
        line-height: 1.08;
        letter-spacing: -0.045em;
      }

      .eventMetaLine {
        justify-content: space-between;
        gap: 12px;
        color: rgba(255,255,255,0.7);
        font-size: 11px;
      }

      .eventMetaLine span {
        gap: 6px;
      }

      .eventMetaLine span:first-child {
        color: #d0f89a;
        font-weight: 800;
      }

      .eventFooter {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        margin-top: 17px;
        padding-top: 16px;
        border-top: 1px solid rgba(255,255,255,0.15);
      }

      .eventFooter small,
      .eventFooter strong {
        display: block;
      }

      .eventFooter small {
        color: rgba(255,255,255,0.55);
      }

      .eventFooter strong {
        margin-top: 2px;
      }

      .eventFooter > span {
        display: grid;
        place-items: center;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: #c9f28c;
        color: #163020;
      }

      /* TRUST */

      .trustStrip {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 14px;
        margin-top: 8px;
      }

      .trustStrip article {
        display: flex;
        align-items: flex-start;
        gap: 13px;
        padding: 20px;
        border: 1px solid #dde4da;
        border-radius: 20px;
        background: rgba(255,255,255,0.72);
      }

      .trustStrip article > span {
        display: grid;
        place-items: center;
        flex: 0 0 auto;
        width: 44px;
        height: 44px;
        border-radius: 14px;
        background: #eaf3de;
        color: #4b6c31;
      }

      .trustStrip strong {
        display: block;
        font-size: 12px;
      }

      .trustStrip p {
        margin: 5px 0 0;
        color: #7c887f;
        font-size: 10px;
        line-height: 1.55;
      }

      /* ROLES */

      .roleGrid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 20px;
      }

      .roleCard {
        position: relative;
        min-height: 540px;
        overflow: hidden;
        border-radius: 30px;
        color: white;
        box-shadow: 0 24px 60px rgba(27,44,34,0.15);
      }

      .roleImage,
      .roleGradient {
        position: absolute;
        inset: 0;
      }

      .roleImage {
        background-size: cover;
        background-position: center;
        transition: transform 0.7s ease;
      }

      .roleCard:hover .roleImage {
        transform: scale(1.05);
      }

      .roleUserImage {
        background-image:
          url("https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=1400&q=88");
      }

      .roleHostImage {
        background-image:
          url("https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&w=1400&q=88");
      }

      .roleGradient {
        background:
          linear-gradient(180deg, rgba(5,15,9,0.05), rgba(5,16,10,0.94));
      }

      .roleContent {
        position: absolute;
        inset: auto 0 0;
        padding: 30px;
      }

      .roleNumber {
        color: #c9f28c;
        font-size: 10px;
        font-weight: 850;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }

      .roleContent h3 {
        max-width: 500px;
        margin: 15px 0 12px;
        font-size: 35px;
        line-height: 1;
        letter-spacing: -0.055em;
      }

      .roleContent p {
        max-width: 500px;
        margin: 0;
        color: rgba(255,255,255,0.68);
        font-size: 13px;
        line-height: 1.65;
      }

      .roleContent a {
        display: inline-flex;
        align-items: center;
        gap: 9px;
        margin-top: 23px;
        color: #c9f28c;
        font-size: 12px;
        font-weight: 850;
      }

      /* GUEST FINAL */

      .guestFinal {
        position: relative;
        isolation: isolate;
        min-height: 620px;
        display: grid;
        place-items: center;
        padding: 80px 24px;
        color: white;
        text-align: center;
      }

      .guestFinalBackground,
      .guestFinalOverlay {
        position: absolute;
        inset: 0;
      }

      .guestFinalBackground {
        z-index: -2;
        background:
          url("https://images.unsplash.com/photo-1464278533981-50106e6176b1?auto=format&fit=crop&w=2200&q=90")
          center / cover;
      }

      .guestFinalOverlay {
        z-index: -1;
        background: rgba(7,20,12,0.8);
      }

      .guestFinalContent {
        max-width: 850px;
      }

      .guestFinalContent > span,
      .hostMotivationContent > span {
        color: #c9f28c;
        font-size: 10px;
        font-weight: 900;
        letter-spacing: 0.13em;
        text-transform: uppercase;
      }

      .guestFinalContent h2,
      .hostMotivationContent h2 {
        margin: 17px 0 0;
        font-size: clamp(45px, 6vw, 76px);
        line-height: 1;
        letter-spacing: -0.065em;
      }

      .guestFinalContent h2 em,
      .hostMotivationContent h2 em {
        display: block;
        color: #c9f28c;
        font-style: normal;
      }

      .guestFinalContent p,
      .hostMotivationContent p {
        max-width: 630px;
        margin: 23px auto 30px;
        color: rgba(255,255,255,0.67);
        line-height: 1.7;
      }


      /* LIVE HOME DISCOVERY */

      .homeDiscovery {
        padding: 15px 0 100px;
      }

      .homeDiscoveryIntro {
        max-width: 820px;
        margin-bottom: 52px;
      }

      .homeDiscoveryIntro h2 {
        margin: 14px 0 0;
        font-size: clamp(42px, 5.5vw, 68px);
        line-height: 0.98;
        letter-spacing: -0.065em;
      }

      .homeDiscoveryIntro > p {
        max-width: 680px;
        margin: 17px 0 0;
        color: #748078;
        font-size: 13px;
        line-height: 1.7;
      }

      .homeDiscoveryBlock + .homeDiscoveryBlock {
        margin-top: 72px;
      }

      .homeHostGrid,
      .homePackageGrid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 14px;
      }

      .homeHostCard,
      .homePackageCard {
        min-width: 0;
        overflow: hidden;
        border: 1px solid #dce4d9;
        border-radius: 23px;
        background: rgba(255,255,255,0.92);
        box-shadow: 0 16px 42px rgba(27,45,34,0.07);
        transition: 0.22s ease;
      }

      .homeHostCard:hover,
      .homePackageCard:hover,
      .homePlaceCard:hover {
        transform: translateY(-5px);
        box-shadow: 0 24px 56px rgba(27,45,34,0.12);
      }

      .homeHostCover,
      .homePackageImage {
        position: relative;
        height: 175px;
        overflow: hidden;
        background: #dfe8d9;
      }

      .homeHostCover > img,
      .homePackageImage > img {
        width: 100%;
        height: 100%;
        display: block;
        object-fit: cover;
        transition: 0.55s ease;
      }

      .homeHostCard:hover .homeHostCover > img,
      .homePackageCard:hover .homePackageImage > img {
        transform: scale(1.05);
      }

      .homeHostCover > div,
      .homePackageImage > div {
        position: absolute;
        inset: 0;
        background: linear-gradient(180deg, rgba(4,14,8,.04), rgba(4,14,8,.65));
      }

      .homeHostCover > span,
      .homePackageImage > span {
        position: absolute;
        left: 12px;
        bottom: 12px;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-height: 30px;
        padding: 0 9px;
        border: 1px solid rgba(255,255,255,.16);
        border-radius: 999px;
        background: rgba(7,24,14,.56);
        color: #d9ffca;
        font-size: 7px;
        font-weight: 900;
        backdrop-filter: blur(10px);
      }

      .homeHostIdentity {
        display: grid;
        grid-template-columns: 48px minmax(0,1fr) auto;
        align-items: center;
        gap: 10px;
        padding: 13px;
      }

      .homeHostIdentity > img {
        width: 48px;
        height: 48px;
        border-radius: 15px;
        object-fit: cover;
        background: #e5ebdf;
      }

      .homeHostIdentity > div {
        min-width: 0;
      }

      .homeHostIdentity strong,
      .homeHostIdentity small {
        display: block;
      }

      .homeHostIdentity strong {
        overflow: hidden;
        color: #2e4336;
        font-size: 10px;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .homeHostIdentity small {
        display: flex;
        align-items: center;
        gap: 4px;
        margin-top: 5px;
        overflow: hidden;
        color: #849087;
        font-size: 7px;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .homeHostIdentity > svg {
        color: #729152;
      }

      .homePackageBody {
        padding: 15px;
      }

      .homePackageBody > small {
        display: flex;
        align-items: center;
        gap: 5px;
        overflow: hidden;
        color: #7e8981;
        font-size: 7px;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .homePackageBody h3 {
        margin: 9px 0 0;
        color: #293e31;
        font-size: 17px;
        line-height: 1.15;
        letter-spacing: -0.035em;
      }

      .homePackageBody > div {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin-top: 15px;
        padding-top: 13px;
        border-top: 1px solid #e5eae3;
      }

      .homePackageBody > div > span {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        color: #78847c;
        font-size: 7px;
      }

      .homePackageBody > div > strong {
        color: #24402f;
        font-size: 10px;
      }

      .homePlaceGrid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 14px;
      }

      .homePlaceCard {
        position: relative;
        min-height: 260px;
        overflow: hidden;
        border-radius: 23px;
        color: white !important;
        box-shadow: 0 16px 42px rgba(27,45,34,0.1);
        transition: 0.22s ease;
      }

      .homePlaceCard > img,
      .homePlaceShade {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
      }

      .homePlaceCard > img {
        object-fit: cover;
        transition: 0.55s ease;
      }

      .homePlaceCard:hover > img {
        transform: scale(1.05);
      }

      .homePlaceShade {
        background: linear-gradient(180deg, rgba(4,14,8,.06), rgba(4,14,8,.84));
      }

      .homePlaceCopy {
        position: absolute;
        right: 0;
        bottom: 0;
        left: 0;
        padding: 18px;
      }

      .homePlaceCopy small,
      .homePlaceCopy strong,
      .homePlaceCopy span {
        display: block;
      }

      .homePlaceCopy small {
        display: flex;
        align-items: center;
        gap: 5px;
        color: rgba(255,255,255,.62);
        font-size: 7px;
      }

      .homePlaceCopy strong {
        margin-top: 7px;
        font-size: 19px;
        line-height: 1.05;
        letter-spacing: -0.035em;
      }

      .homePlaceCopy span {
        margin-top: 8px;
        color: rgba(255,255,255,.48);
        font-size: 7px;
      }

      .liveHomeEmpty {
        display: flex;
        align-items: center;
        gap: 13px;
        min-height: 110px;
        padding: 20px;
        border: 1px dashed #ced9ca;
        border-radius: 20px;
        background: rgba(255,255,255,.66);
      }

      .liveHomeEmpty > span {
        display: grid;
        place-items: center;
        flex: 0 0 auto;
        width: 48px;
        height: 48px;
        border-radius: 15px;
        background: #e8f1de;
        color: #66834b;
      }

      .liveHomeEmpty strong {
        display: block;
        color: #3d5144;
        font-size: 11px;
      }

      .liveHomeEmpty p {
        margin: 5px 0 0;
        color: #89938c;
        font-size: 8px;
      }

      .upcomingList > a {
        display: grid;
        grid-template-columns: auto minmax(0,1fr) auto;
        align-items: center;
        gap: 12px;
        color: inherit;
        text-decoration: none;
      }

      .homeMiniEmpty {
        padding: 18px;
        border: 1px dashed #d3ddd0;
        border-radius: 14px;
        color: #8b958e;
        font-size: 9px;
      }

      @media(max-width: 1000px) {
        .homeHostGrid,
        .homePackageGrid {
          grid-template-columns: repeat(2, minmax(0,1fr));
        }

        .homePlaceGrid {
          grid-template-columns: repeat(2, minmax(0,1fr));
        }
      }

      @media(max-width: 620px) {
        .homeDiscovery {
          padding-bottom: 72px;
        }

        .homeDiscoveryBlock + .homeDiscoveryBlock {
          margin-top: 54px;
        }

        .homeHostGrid,
        .homePackageGrid,
        .homePlaceGrid {
          grid-template-columns: 1fr;
        }

        .homePlaceCard {
          min-height: 235px;
        }
      }


      /* HORIZONTAL SWIPE / SCROLL SNAP */

      .homeSwipeRow {
        display: grid !important;
        grid-auto-flow: column;
        grid-auto-columns: minmax(280px, 31%);
        grid-template-columns: none !important;
        gap: 14px;
        overflow-x: auto;
        overflow-y: hidden;
        padding: 4px 2px 18px;
        margin-right: -2px;
        scroll-snap-type: x mandatory;
        scroll-padding-inline: 2px;
        overscroll-behavior-inline: contain;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
      }

      .homeSwipeRow::-webkit-scrollbar {
        display: none;
      }

      .homeSwipeRow > * {
        min-width: 0;
        scroll-snap-align: start;
        scroll-snap-stop: normal;
      }

      .eventGrid.homeSwipeRow {
        grid-auto-columns: minmax(320px, 35%);
      }

      .homeHostGrid.homeSwipeRow {
        grid-auto-columns: minmax(250px, 26%);
      }

      .homePackageGrid.homeSwipeRow {
        grid-auto-columns: minmax(280px, 29%);
      }

      .homePlaceGrid.homeSwipeRow {
        grid-auto-columns: minmax(300px, 32%);
      }

      .homeSwipeRow::after {
        content: "";
        width: 1px;
      }

      @media(max-width: 1000px) {
        .eventGrid.homeSwipeRow {
          grid-auto-columns: minmax(300px, 48%);
        }

        .homeHostGrid.homeSwipeRow,
        .homePackageGrid.homeSwipeRow {
          grid-auto-columns: minmax(260px, 44%);
        }

        .homePlaceGrid.homeSwipeRow {
          grid-auto-columns: minmax(290px, 48%);
        }
      }

      @media(max-width: 700px) {
        .homeSwipeRow {
          width: calc(100% + 24px);
          margin-right: -24px;
          padding-right: 24px;
          scroll-padding-inline: 0;
        }

        .eventGrid.homeSwipeRow {
          grid-auto-columns: minmax(285px, 86%);
        }

        .homeHostGrid.homeSwipeRow {
          grid-auto-columns: minmax(245px, 78%);
        }

        .homePackageGrid.homeSwipeRow {
          grid-auto-columns: minmax(270px, 82%);
        }

        .homePlaceGrid.homeSwipeRow {
          grid-auto-columns: minmax(285px, 86%);
        }
      }

      @media(max-width: 430px) {
        .eventGrid.homeSwipeRow {
          grid-auto-columns: 88%;
        }

        .homeHostGrid.homeSwipeRow {
          grid-auto-columns: 80%;
        }

        .homePackageGrid.homeSwipeRow {
          grid-auto-columns: 84%;
        }

        .homePlaceGrid.homeSwipeRow {
          grid-auto-columns: 88%;
        }
      }

      /* USER */

      .userHome,
      .hostHome {
        padding: 46px 0 100px;
      }

      .userTop,
      .hostTop {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 25px;
        padding-top: 25px;
      }

      .userGreeting,
      .hostTop > div:first-child {
        max-width: 760px;
      }

      .userGreeting h1,
      .hostTop h1 {
        margin: 12px 0 0;
        font-size: clamp(46px, 6vw, 76px);
        line-height: 0.95;
        letter-spacing: -0.07em;
      }

      .userGreeting p,
      .hostTop p {
        max-width: 650px;
        margin: 17px 0 0;
        color: #758178;
        font-size: 14px;
        line-height: 1.7;
      }

      .userTopActions,
      .hostTopActions {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 9px;
      }

      .userTopActions a {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-height: 44px;
        padding: 0 14px;
        border: 1px solid #dae2d7;
        border-radius: 13px;
        background: white;
        color: #3c5545;
        font-size: 10px;
        font-weight: 850;
      }

      .userSearchStage {
        position: relative;
        isolation: isolate;
        display: grid;
        grid-template-columns: minmax(0,0.72fr) minmax(390px,0.78fr);
        align-items: center;
        gap: 35px;
        min-height: 440px;
        margin-top: 35px;
        padding: 38px;
        overflow: hidden;
        border-radius: 30px;
        color: white;
      }

      .userSearchImage,
      .userSearchOverlay {
        position: absolute;
        inset: 0;
      }

      .userSearchImage {
        z-index: -2;
        background:
          url("https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1900&q=92")
          center / cover;
      }

      .userSearchOverlay {
        z-index: -1;
        background:
          linear-gradient(90deg, rgba(5,16,10,0.92), rgba(5,16,10,0.62), rgba(5,16,10,0.38));
      }

      .userSearchCopy {
        max-width: 520px;
      }

      .userSearchCopy > span {
        color: #c9f28c;
        font-size: 10px;
        font-weight: 900;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }

      .userSearchCopy h2 {
        margin: 13px 0 0;
        font-size: clamp(38px, 5vw, 58px);
        line-height: 0.98;
        letter-spacing: -0.06em;
      }

      .userSearchCopy p {
        max-width: 480px;
        margin: 16px 0 0;
        color: rgba(255,255,255,0.66);
        font-size: 12px;
        line-height: 1.65;
      }

      .quickLinks {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 14px;
        margin-top: 18px;
      }

      .quickLinks > a {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: 13px;
        padding: 20px;
        border: 1px solid #dde3db;
        border-radius: 20px;
        background: rgba(255,255,255,0.94);
        box-shadow: 0 16px 42px rgba(27,45,34,0.07);
        transition: 0.22s ease;
      }

      .quickLinks > a:hover {
        transform: translateY(-4px);
      }

      .quickLinks > a > span {
        display: grid;
        place-items: center;
        width: 46px;
        height: 46px;
        border-radius: 14px;
        background: #eaf3de;
        color: #47672e;
      }

      .quickLinks strong,
      .quickLinks small {
        display: block;
      }

      .quickLinks strong {
        font-size: 11px;
      }

      .quickLinks small {
        margin-top: 4px;
        color: #7b877f;
        font-size: 9px;
      }

      .userDashboardGrid {
        display: grid;
        grid-template-columns: minmax(0,1.1fr) minmax(330px,0.9fr);
        gap: 18px;
        margin-bottom: 30px;
      }

      .upcomingCard {
        padding: 24px;
        border: 1px solid #dce3da;
        border-radius: 24px;
        background: white;
      }

      .miniHeader {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 18px;
        margin-bottom: 18px;
      }

      .miniHeader span {
        display: block;
        color: #718d52;
        font-size: 9px;
        font-weight: 900;
        letter-spacing: 0.11em;
        text-transform: uppercase;
      }

      .miniHeader h3 {
        margin: 6px 0 0;
        font-size: 25px;
        letter-spacing: -0.04em;
      }

      .miniHeader > a {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 10px;
        font-weight: 850;
      }

      .upcomingList {
        display: grid;
        gap: 10px;
      }

      .upcomingList article {
        display: grid;
        grid-template-columns: auto minmax(0,1fr) auto;
        align-items: center;
        gap: 12px;
        padding: 13px;
        border: 1px solid #e0e6de;
        border-radius: 16px;
        background: #f8faf6;
      }

      .upcomingIcon {
        display: grid;
        place-items: center;
        width: 42px;
        height: 42px;
        border-radius: 13px;
        background: #e8f1dd;
        color: #5d7a43;
      }

      .upcomingList strong,
      .upcomingList small {
        display: block;
      }

      .upcomingList strong {
        font-size: 10px;
      }

      .upcomingList small {
        margin-top: 4px;
        color: #879289;
        font-size: 8px;
      }

      .tripStatus {
        padding: 8px 10px;
        border-radius: 999px;
        background: #fff0d7;
        color: #9a6318;
        font-size: 8px;
        font-weight: 850;
      }

      .tripStatus.confirmed {
        background: #e9f5dc;
        color: #4f772e;
      }

      .userSidePromo {
        position: relative;
        isolation: isolate;
        min-height: 300px;
        display: flex;
        align-items: flex-end;
        overflow: hidden;
        border-radius: 24px;
        color: white;
      }

      .userSidePromoImage,
      .userSidePromoOverlay {
        position: absolute;
        inset: 0;
      }

      .userSidePromoImage {
        z-index: -2;
        background:
          url("https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1300&q=90")
          center / cover;
      }

      .userSidePromoOverlay {
        z-index: -1;
        background:
          linear-gradient(180deg, rgba(5,16,10,0.08), rgba(5,16,10,0.9));
      }

      .userSidePromo > div:last-child {
        padding: 24px;
      }

      .userSidePromo span {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        color: #c9f28c;
        font-size: 9px;
        font-weight: 850;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }

      .userSidePromo h3 {
        max-width: 480px;
        margin: 12px 0 18px;
        font-size: 30px;
        line-height: 1;
        letter-spacing: -0.05em;
      }

      .userSidePromo a {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        color: #c9f28c;
        font-size: 10px;
        font-weight: 850;
      }

      /* HOST */

      .hostOverview {
        display: grid;
        grid-template-columns: minmax(0,1.35fr) minmax(340px,0.65fr);
        gap: 18px;
        margin-top: 34px;
      }

      .hostOverviewHero {
        position: relative;
        isolation: isolate;
        min-height: 390px;
        display: flex;
        align-items: center;
        overflow: hidden;
        border-radius: 28px;
        color: white;
      }

      .hostOverviewImage,
      .hostOverviewOverlay {
        position: absolute;
        inset: 0;
      }

      .hostOverviewImage {
        z-index: -2;
        background:
          url("https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1800&q=92")
          center / cover;
      }

      .hostOverviewOverlay {
        z-index: -1;
        background:
          linear-gradient(90deg, rgba(5,16,10,0.94), rgba(5,16,10,0.6), rgba(5,16,10,0.2));
      }

      .hostOverviewCopy {
        max-width: 600px;
        padding: 34px;
      }

      .hostOverviewCopy > span {
        color: #c9f28c;
        font-size: 9px;
        font-weight: 900;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }

      .hostOverviewCopy h2 {
        margin: 13px 0 0;
        font-size: clamp(40px, 5vw, 58px);
        line-height: 0.98;
        letter-spacing: -0.06em;
      }

      .hostOverviewCopy p {
        max-width: 520px;
        margin: 17px 0 24px;
        color: rgba(255,255,255,0.68);
        font-size: 12px;
        line-height: 1.65;
      }

      .onlineBadge {
        display: flex;
        align-items: center;
        gap: 7px;
        align-self: flex-start;
        padding: 8px 10px;
        border-radius: 999px;
        background: #e9f5dc;
        color: #426429;
        font-size: 9px;
        font-weight: 850;
      }

      .onlineBadge span {
        width: 7px;
        height: 7px;
        margin: 0;
        border-radius: 50%;
        background: #61a62f;
      }

      .hostTodayStats {
        display: grid;
        gap: 9px;
      }

      .hostTodayStats article {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px;
        border: 1px solid #dfe5dc;
        border-radius: 15px;
        background: white;
      }

      .hostTodayStats article > svg {
        color: #658347;
      }

      .hostTodayStats strong,
      .hostTodayStats span {
        display: block;
      }

      .hostTodayStats strong {
        font-size: 18px;
      }

      .hostTodayStats span {
        margin: 2px 0 0;
        color: #7d8981;
        font-size: 10px;
        text-transform: none;
        letter-spacing: 0;
      }

      .hostTodayCard > a {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid #dfe4dc;
        color: #36543f;
        font-size: 11px;
        font-weight: 850;
      }

      .hostStats {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 14px;
        margin-top: 18px;
      }

      .hostStats article {
        padding: 20px;
        border: 1px solid #dce2da;
        border-radius: 20px;
        background: rgba(255,255,255,0.96);
        box-shadow: 0 14px 34px rgba(27,45,34,0.06);
      }

      .hostStatIcon {
        display: grid;
        place-items: center;
        width: 42px;
        height: 42px;
        margin-bottom: 18px;
        border-radius: 13px;
        background: #eaf3de;
        color: #4a6d30;
      }

      .hostStatTop {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        color: #7a867e;
        font-size: 10px;
      }

      .hostStatTop svg {
        color: #719c4d;
      }

      .hostStats article > strong {
        display: block;
        margin-top: 8px;
        font-size: 34px;
        letter-spacing: -0.05em;
      }

      .hostStats article > small {
        color: #7e8982;
        font-size: 8px;
      }

      .hostWorkspace {
        display: grid;
        grid-template-columns: minmax(0, 1.45fr) minmax(310px, 0.55fr);
        gap: 22px;
        padding: 90px 0;
      }

      .hostSectionHeader {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 20px;
        margin-bottom: 24px;
      }

      .hostSectionHeader h2 {
        font-size: 35px;
      }

      .bookingList {
        overflow: hidden;
        border: 1px solid #dce2da;
        border-radius: 23px;
        background: white;
      }

      .bookingItem {
        display: grid;
        grid-template-columns: auto minmax(160px,1fr) auto auto auto;
        align-items: center;
        gap: 16px;
        padding: 18px;
      }

      .bookingItem + .bookingItem {
        border-top: 1px solid #e2e7e0;
      }

      .bookingAvatar {
        display: grid;
        place-items: center;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: #183a27;
        color: white;
        font-weight: 850;
      }

      .bookingInfo strong,
      .bookingInfo span {
        display: block;
      }

      .bookingInfo strong {
        font-size: 10px;
      }

      .bookingInfo span {
        margin-top: 4px;
        color: #7a867e;
        font-size: 10px;
      }

      .bookingMeta {
        display: flex;
        gap: 12px;
      }

      .bookingMeta span {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        color: #6f7c73;
        font-size: 9px;
      }

      .bookingStatus {
        padding: 8px 10px;
        border-radius: 999px;
        background: #fff0d7;
        color: #9a6318;
        font-size: 8px;
        font-weight: 850;
      }

      .bookingStatus.approved {
        background: #e9f5dc;
        color: #4f772e;
      }

      .bookingItem > a {
        display: grid;
        place-items: center;
        width: 37px;
        height: 37px;
        border-radius: 11px;
        background: #f1f3ee;
      }

      .hostSideColumn {
        display: grid;
        gap: 17px;
        align-content: start;
      }

      .quickCreateCard,
      .profileProgressCard {
        padding: 22px;
        border: 1px solid #dce2da;
        border-radius: 23px;
        background: white;
      }

      .quickCreateCard h3,
      .profileProgressCard h3 {
        margin: 0 0 17px;
        font-size: 22px;
        letter-spacing: -0.035em;
      }

      .quickCreateCard > a {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: 11px;
        padding: 14px 0;
      }

      .quickCreateCard > a + a {
        border-top: 1px solid #e1e6df;
      }

      .quickCreateCard > a > span {
        display: grid;
        place-items: center;
        width: 42px;
        height: 42px;
        border-radius: 13px;
        background: #eaf3de;
        color: #4a6c31;
      }

      .quickCreateCard strong,
      .quickCreateCard small {
        display: block;
      }

      .quickCreateCard strong {
        font-size: 10px;
      }

      .quickCreateCard small {
        margin-top: 3px;
        color: #808c84;
        font-size: 8px;
      }

      .progressTop {
        display: flex;
        justify-content: space-between;
        margin-bottom: 10px;
        font-size: 10px;
        font-weight: 850;
      }

      .progressBar {
        height: 8px;
        margin-bottom: 18px;
        overflow: hidden;
        border-radius: 999px;
        background: #e8ece6;
      }

      .progressBar span {
        display: block;
        width: 82%;
        height: 100%;
        border-radius: inherit;
        background: #719b4e;
      }

      .profileProgressCard p {
        color: #77837b;
        font-size: 11px;
        line-height: 1.6;
      }

      .profileProgressCard > a {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        margin-top: 8px;
        color: #3c5d45;
        font-size: 10px;
        font-weight: 850;
      }

      .hostMotivation {
        position: relative;
        isolation: isolate;
        min-height: 560px;
        display: flex;
        align-items: center;
        overflow: hidden;
        border-radius: 32px;
        color: white;
      }

      .hostMotivationImage,
      .hostMotivationOverlay {
        position: absolute;
        inset: 0;
      }

      .hostMotivationImage {
        z-index: -2;
        background:
          url("https://images.unsplash.com/photo-1464278533981-50106e6176b1?auto=format&fit=crop&w=1900&q=90")
          center / cover;
      }

      .hostMotivationOverlay {
        z-index: -1;
        background:
          linear-gradient(90deg, rgba(6,18,11,0.92), rgba(6,18,11,0.57), rgba(6,18,11,0.12));
      }

      .hostMotivationContent {
        max-width: 700px;
        padding: 60px;
      }

      .hostMotivationContent h2 {
        font-size: clamp(44px, 5vw, 68px);
      }

      .hostMotivationContent p {
        margin-inline: 0;
      }


      /* LIVE HOME / NOTIFICATIONS */

      .liveProof {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, auto));
        justify-content: start;
        gap: 0;
        width: fit-content;
        overflow: hidden;
        border: 1px solid rgba(255,255,255,0.16);
        border-radius: 20px;
        background: rgba(5,18,10,0.28);
        backdrop-filter: blur(16px);
      }

      .liveProof > div {
        min-width: 145px;
        padding: 16px 20px;
      }

      .liveProof > div + div {
        border-left: 1px solid rgba(255,255,255,0.12);
      }

      .homeNotifications {
        margin-top: 24px;
        padding: 26px;
        border: 1px solid #d9e2d6;
        border-radius: 28px;
        background:
          radial-gradient(circle at 92% 10%, rgba(201,242,140,0.16), transparent 24%),
          rgba(255,255,255,0.92);
        box-shadow: 0 20px 55px rgba(28,47,35,0.08);
      }

      .homeNotifications.hostMode {
        margin-top: 20px;
        border-color: #bfd1b4;
        background:
          radial-gradient(circle at 93% 0%, rgba(201,242,140,0.19), transparent 27%),
          linear-gradient(145deg, #f7faF3, #ffffff);
      }

      .homeNotificationsHeader {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 24px;
        margin-bottom: 20px;
      }

      .homeNotificationsHeader h2 {
        margin: 10px 0 0;
        font-size: clamp(28px, 4vw, 43px);
        line-height: 1;
        letter-spacing: -0.055em;
      }

      .homeNotificationsHeader p {
        max-width: 640px;
        margin: 10px 0 0;
        color: #748078;
        font-size: 11px;
        line-height: 1.6;
      }

      .homeNotificationsAll {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        flex: 0 0 auto;
        min-height: 43px;
        padding: 0 14px;
        border: 1px solid #d5dfd1;
        border-radius: 13px;
        background: #fff;
        color: #35513e !important;
        font-size: 10px;
        font-weight: 850;
      }

      .homeNotificationGrid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
      }

      .homeNotificationCard {
        position: relative;
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: 12px;
        min-width: 0;
        padding: 16px;
        border: 1px solid #dfe5dc;
        border-radius: 18px;
        background: #f8faf6;
        transition: 0.2s ease;
      }

      .homeNotificationCard:hover {
        transform: translateY(-2px);
        border-color: #aebfa6;
        background: white;
        box-shadow: 0 14px 30px rgba(28,47,35,0.08);
      }

      .homeNotificationCard.unread {
        border-color: #b8d1a8;
        background: linear-gradient(135deg, #eff7e7, #fbfdf9);
      }

      .homeNotificationIcon {
        display: grid;
        place-items: center;
        width: 44px;
        height: 44px;
        border-radius: 14px;
        background: #e6f0dc;
        color: #55743c;
      }

      .homeNotificationCopy {
        min-width: 0;
      }

      .homeNotificationCopy > div {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }

      .homeNotificationCopy small {
        color: #719050;
        font-size: 8px;
        font-weight: 900;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .homeNotificationCopy > div > span {
        color: #929c95;
        font-size: 8px;
      }

      .homeNotificationCopy strong {
        display: block;
        overflow: hidden;
        margin-top: 6px;
        color: #2d4235;
        font-size: 12px;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .homeNotificationCopy p {
        display: -webkit-box;
        margin: 5px 0 0;
        overflow: hidden;
        color: #78847c;
        font-size: 9px;
        line-height: 1.55;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }

      .homeUnreadDot {
        position: absolute;
        top: 12px;
        right: 12px;
        width: 8px;
        height: 8px;
        border: 2px solid white;
        border-radius: 50%;
        background: #79a250;
        box-shadow: 0 0 0 4px rgba(121,162,80,0.1);
      }

      .homeNotificationsEmpty {
        display: flex;
        align-items: center;
        gap: 13px;
        padding: 18px;
        border: 1px dashed #cfd9cb;
        border-radius: 18px;
        background: #f8faf6;
      }

      .homeNotificationsEmpty > span {
        display: grid;
        place-items: center;
        width: 45px;
        height: 45px;
        border-radius: 14px;
        background: #e8f1dd;
        color: #5b7941;
      }

      .homeNotificationsEmpty strong {
        display: block;
        font-size: 11px;
      }

      .homeNotificationsEmpty p {
        margin: 4px 0 0;
        color: #829087;
        font-size: 9px;
      }

      .hostTopActionsTriple {
        max-width: 520px;
      }

      .hostCreationGrid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
      }

      .hostCreationCard {
        position: relative;
        min-height: 300px;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        padding: 24px;
        overflow: hidden;
        border-radius: 25px;
        color: white !important;
        box-shadow: 0 20px 48px rgba(21,42,29,0.14);
        transition: 0.25s ease;
      }

      .hostCreationCard::before {
        position: absolute;
        inset: 0;
        z-index: -2;
        content: "";
        background-position: center;
        background-size: cover;
        transition: transform 0.6s ease;
      }

      .hostCreationCard::after {
        position: absolute;
        inset: 0;
        z-index: -1;
        content: "";
        background: linear-gradient(180deg, rgba(5,16,10,0.08), rgba(5,16,10,0.94));
      }

      .hostCreationCard.eventCreation::before {
        background-image: url("https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1200&q=88");
      }

      .hostCreationCard.packageCreation::before {
        background-image: url("https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1200&q=88");
      }

      .hostCreationCard:hover {
        transform: translateY(-5px);
      }

      .hostCreationCard:hover::before {
        transform: scale(1.05);
      }

      .hostCreationCard > span {
        position: absolute;
        top: 18px;
        left: 18px;
        display: grid;
        place-items: center;
        width: 48px;
        height: 48px;
        border: 1px solid rgba(255,255,255,0.18);
        border-radius: 15px;
        background: rgba(255,255,255,0.1);
        color: #c9f28c;
        backdrop-filter: blur(12px);
      }

      .hostCreationCard small {
        color: #c9f28c;
        font-size: 8px;
        font-weight: 900;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }

      .hostCreationCard h3 {
        margin: 10px 0 0;
        font-size: 28px;
        line-height: 1;
        letter-spacing: -0.05em;
      }

      .hostCreationCard p {
        margin: 10px 0 0;
        color: rgba(255,255,255,0.62);
        font-size: 10px;
        line-height: 1.55;
      }

      .hostCreationCard > strong {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        margin-top: 17px;
        font-size: 9px;
      }

      .hostMotivationActions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      @media (max-width: 850px) {
        .homeNotificationGrid,
        .hostCreationGrid {
          grid-template-columns: 1fr;
        }

        .liveProof {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          width: 100%;
        }

        .liveProof > div:nth-child(3) {
          border-left: 0;
          border-top: 1px solid rgba(255,255,255,0.12);
        }

        .liveProof > div:nth-child(4) {
          border-top: 1px solid rgba(255,255,255,0.12);
        }
      }

      @media (max-width: 700px) {
        .homeNotifications {
          margin-top: 18px;
          padding: 20px;
          border-radius: 23px;
        }

        .homeNotificationsHeader {
          align-items: flex-start;
          flex-direction: column;
        }

        .homeNotificationsAll {
          width: 100%;
          justify-content: center;
        }

        .hostTopActionsTriple {
          grid-template-columns: 1fr 1fr !important;
        }

        .hostTopActionsTriple a:last-child {
          grid-column: 1 / -1;
        }
      }

      @media (max-width: 460px) {
        .liveProof {
          grid-template-columns: 1fr 1fr;
        }

        .liveProof > div {
          min-width: 0;
          padding: 14px;
        }

        .liveProof strong {
          font-size: 20px;
        }

        .liveProof span {
          font-size: 9px;
        }

        .homeNotificationCard {
          grid-template-columns: auto minmax(0, 1fr);
          padding: 14px;
        }

        .homeNotificationCopy > div {
          align-items: flex-start;
          flex-direction: column;
          gap: 3px;
        }

        .hostTopActionsTriple {
          grid-template-columns: 1fr !important;
        }

        .hostTopActionsTriple a:last-child {
          grid-column: auto;
        }
      }

      /* LOADING */

      .homeLoading {
        min-height: 100vh;
        display: grid;
        place-content: center;
        justify-items: center;
        gap: 13px;
        background: #f4f5ef;
        color: #183a27;
        font-family: Inter, system-ui, sans-serif;
        font-weight: 850;
      }

      .loadingLogo {
        display: grid;
        place-items: center;
        width: 62px;
        height: 62px;
        border-radius: 20px;
        background: #183a27;
        color: #c9f28c;
        animation: homePulse 1.3s infinite ease-in-out;
      }

      @keyframes homePulse {
        50% {
          transform: scale(1.06);
          opacity: 0.78;
        }
      }

      /* RESPONSIVE */

      @media (max-width: 1050px) {
        .eventGrid {
          grid-template-columns: repeat(2, 1fr);
        }

        .eventCard:first-child {
          grid-column: span 2;
        }

        .hostOverview,
        .userSearchStage {
          grid-template-columns: 1fr;
        }

        .hostStats {
          grid-template-columns: repeat(2, 1fr);
        }

        .hostWorkspace,
        .userDashboardGrid {
          grid-template-columns: 1fr;
        }

        .searchCard.compact {
          max-width: 650px;
        }
      }

      @media (max-width: 760px) {
        .pageContainer {
          width: calc(100% - 32px);
        }

        .guestHero {
          min-height: 700px;
          padding: 115px 0 90px;
        }

        .heroTopBar {
          top: 20px;
        }

        .homeBrand {
          font-size: 14px;
        }

        .homeBrand > span {
          width: 40px;
          height: 40px;
        }

        .heroJoinLink {
          display: none !important;
        }

        .guestCopy h1 {
          font-size: 49px;
        }

        .guestCopy > p {
          font-size: 15px;
        }

        .guestSearchWrap {
          margin-top: -45px;
        }

        .searchCard,
        .hostTodayCard {
          padding: 18px;
          border-radius: 22px;
        }

        .searchMainRow {
          grid-template-columns: 1fr;
        }

        .primarySearchButton {
          width: 100%;
        }

        .featuredSection,
        .roleChoice {
          padding: 80px 0;
        }

        .firstSection {
          padding-top: 95px;
        }

        .sectionHeading,
        .hostSectionHeader,
        .userTop,
        .hostTop {
          align-items: flex-start;
          flex-direction: column;
        }

        .sectionLink {
          display: none;
        }

        .eventGrid,
        .roleGrid,
        .quickLinks,
        .trustStrip,
        .hostStats {
          grid-template-columns: 1fr;
        }

        .eventCard:first-child {
          grid-column: auto;
        }

        .eventCard {
          min-height: 460px;
        }

        .roleCard {
          min-height: 490px;
        }

        .roleContent h3 {
          font-size: 31px;
        }

        .userHome,
        .hostHome {
          padding-top: 26px;
        }

        .userGreeting h1,
        .hostTop h1 {
          font-size: 46px;
        }

        .userTopActions,
        .hostTopActions {
          justify-content: flex-start;
        }

        .userSearchStage {
          min-height: auto;
          padding: 24px;
        }

        .userSearchCopy h2,
        .hostOverviewCopy h2 {
          font-size: 40px;
        }

        .hostOverviewHero {
          min-height: 420px;
        }

        .hostWorkspace {
          padding: 75px 0;
        }

        .bookingItem {
          grid-template-columns: auto 1fr auto;
        }

        .bookingMeta,
        .bookingStatus {
          grid-column: 2;
        }

        .bookingItem > a {
          grid-column: 3;
          grid-row: 1 / span 3;
        }

        .hostMotivation {
          min-height: 620px;
          border-radius: 26px;
        }

        .hostMotivationContent {
          padding: 30px;
        }

        .hostMotivationContent h2 {
          font-size: 43px;
        }
      }

      @media (max-width: 460px) {
        .guestHero {
          min-height: 670px;
        }

        .guestCopy h1 {
          font-size: 43px;
        }

        .guestActions,
        .hostTopActions {
          flex-direction: column;
          align-items: stretch;
        }

        .guestActions a,
        .hostTopActions a {
          width: 100%;
        }

        .guestProof {
          gap: 18px;
        }

        .guestProof strong {
          font-size: 19px;
        }

        .guestProof span {
          font-size: 10px;
        }

        .searchTopIcon {
          display: none !important;
        }

        .sectionHeading h2,
        .hostSectionHeader h2 {
          font-size: 36px;
        }

        .userGreeting h1,
        .hostTop h1 {
          font-size: 41px;
        }

        .userTopActions {
          width: 100%;
        }

        .userTopActions a {
          flex: 1;
          justify-content: center;
        }

        .userSearchStage {
          padding: 19px;
        }

        .upcomingList article {
          grid-template-columns: auto 1fr;
        }

        .tripStatus {
          grid-column: 2;
          justify-self: start;
        }

        .bookingMeta {
          flex-direction: column;
          gap: 5px;
        }

        .hostOverviewCopy {
          padding: 24px;
        }

        .hostMotivationContent {
          padding: 24px;
        }
      }


      /* =========================================================
         LEGAL FOOTER
      ========================================================= */

      .homeLegalFooter {
        width: 100%;
        padding: 26px 0;
        border-top: 1px solid rgba(28, 54, 38, 0.09);
        background: #eef0e9;
      }

      .homeLegalFooterInner {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: 28px;
      }

      .homeLegalBrand {
        display: flex;
        flex-direction: column;
        gap: 3px;
      }

      .homeLegalBrand strong {
        color: #20382a;
        font-size: 13px;
        font-weight: 900;
        letter-spacing: -0.02em;
      }

      .homeLegalBrand span,
      .homeLegalCopyright {
        color: #7c887f;
        font-size: 9px;
        font-weight: 650;
      }

      .homeLegalLinks {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-wrap: wrap;
        gap: 6px 18px;
      }

      .homeLegalLinks a,
      .homeCookieSettings {
        padding: 0;
        border: 0;
        background: transparent;
        color: #53665a;
        font: inherit;
        font-size: 10px;
        font-weight: 800;
        text-decoration: none;
        cursor: pointer;
        transition: color 0.18s ease;
      }

      .homeLegalLinks a:hover,
      .homeCookieSettings:hover {
        color: #1e4b31;
      }

      .homeLegalCopyright {
        white-space: nowrap;
        text-align: right;
      }

      @media (max-width: 900px) {
        .homeLegalFooterInner {
          grid-template-columns: 1fr;
          justify-items: center;
          gap: 14px;
          text-align: center;
        }

        .homeLegalBrand {
          align-items: center;
        }

        .homeLegalCopyright {
          white-space: normal;
          text-align: center;
        }
      }

      @media (max-width: 520px) {
        .homeLegalFooter {
          padding: 23px 0 25px;
        }

        .homeLegalLinks {
          gap: 10px 16px;
        }
      }

      /* =========================================================
         FINAL RESPONSIVE UX HARDENING
      ========================================================= */

      :root {
        --home-navbar-clearance: 148px;
        --home-page-gap: 24px;
      }

      html,
      body,
      #root {
        width: 100%;
        max-width: 100%;
        overflow-x: clip;
      }

      .home,
      .home * {
        min-width: 0;
      }

      .home {
        width: 100%;
        max-width: 100vw;
        overflow-x: clip;
      }

      .pageContainer {
        width: min(1200px, calc(100% - (var(--home-page-gap) * 2)));
        max-width: 100%;
      }

      /* Fixed navbar clearance: content never sits beneath navigation. */
      .userHome,
      .hostHome {
        padding-top: var(--home-navbar-clearance);
      }

      .userTop,
      .hostTop {
        position: relative;
        z-index: 2;
        padding-top: 0;
      }

      .userGreeting h1,
      .hostTop h1,
      .userSearchCopy h2,
      .guestCopy h1,
      .sectionHeading h2,
      .hostSectionHeader h2 {
        overflow-wrap: anywhere;
        text-wrap: balance;
      }

      .userGreeting p,
      .hostTop p,
      .userSearchCopy p,
      .guestCopy > p,
      .sectionHeading p {
        text-wrap: pretty;
      }

      /* User search stage */
      .userSearchStage {
        grid-template-columns: minmax(0, 0.88fr) minmax(360px, 0.72fr);
        gap: clamp(24px, 4vw, 52px);
        padding: clamp(28px, 4vw, 48px);
        border: 1px solid rgba(255,255,255,0.12);
        box-shadow: 0 28px 75px rgba(14,31,20,0.2);
      }

      .userSearchStage > * {
        min-width: 0;
        max-width: 100%;
      }

      .searchCard,
      .searchCard.compact {
        width: 100%;
        max-width: 100%;
        min-width: 0;
      }

      .searchCard.compact {
        padding: clamp(18px, 2.4vw, 26px);
        border-color: rgba(255,255,255,0.22);
        background: rgba(250,251,247,0.97);
        box-shadow: 0 22px 55px rgba(3,17,9,0.2);
      }

      .searchTop > div {
        min-width: 0;
      }

      .searchTop strong {
        display: block;
        max-width: 100%;
        overflow-wrap: anywhere;
        text-wrap: balance;
      }

      .searchMainRow {
        width: 100%;
        grid-template-columns: minmax(0, 1fr) minmax(132px, auto);
      }

      .searchInput {
        width: 100%;
        min-width: 0;
      }

      .searchInput input {
        min-width: 0;
        max-width: 100%;
        font-size: 16px;
      }

      .primarySearchButton {
        width: auto;
        min-width: 136px;
        max-width: 100%;
        white-space: nowrap;
      }

      .categoryRow {
        width: calc(100% + 6px);
        max-width: calc(100% + 6px);
        scroll-padding-inline: 3px;
        overscroll-behavior-inline: contain;
        -webkit-overflow-scrolling: touch;
      }

      .categoryRow button {
        white-space: nowrap;
      }

      /* Cards and action rows never force horizontal overflow. */
      .userTopActions,
      .hostTopActions,
      .guestActions,
      .quickLinks,
      .eventGrid,
      .roleGrid,
      .hostStats,
      .userDashboardGrid,
      .hostWorkspace {
        max-width: 100%;
      }

      .userTopActions a,
      .hostTopActions a,
      .quickLinks > a,
      .bookingItem,
      .upcomingList article {
        min-width: 0;
      }

      .quickLinks strong,
      .quickLinks small,
      .bookingInfo strong,
      .bookingInfo span {
        overflow-wrap: anywhere;
      }

      @media (max-width: 1050px) {
        :root {
          --home-navbar-clearance: 138px;
        }

        .userSearchStage {
          grid-template-columns: 1fr;
          min-height: auto;
        }

        .userSearchCopy {
          max-width: 680px;
        }

        .searchCard.compact {
          max-width: none;
        }
      }

      @media (max-width: 760px) {
        :root {
          --home-navbar-clearance: 146px;
          --home-page-gap: 16px;
        }

        .userHome,
        .hostHome {
          padding-top: var(--home-navbar-clearance);
          padding-bottom: 72px;
        }

        .userTop,
        .hostTop {
          gap: 20px;
        }

        .userGreeting h1,
        .hostTop h1 {
          font-size: clamp(40px, 11vw, 54px);
          line-height: 0.98;
          letter-spacing: -0.06em;
        }

        .userTopActions,
        .hostTopActions {
          width: 100%;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .userTopActions a,
        .hostTopActions a {
          width: 100%;
          min-height: 52px;
          justify-content: center;
          padding-inline: 12px;
          text-align: center;
        }

        .userSearchStage {
          gap: 24px;
          margin-top: 28px;
          padding: 24px;
          border-radius: 28px;
          background: #0c2116;
        }

        .userSearchCopy h2 {
          font-size: clamp(38px, 10vw, 52px);
          line-height: 0.98;
        }

        .userSearchCopy p {
          max-width: 100%;
          font-size: 13px;
        }

        .searchCard,
        .searchCard.compact {
          padding: 20px;
          border-radius: 24px;
        }

        .searchTop {
          gap: 12px;
        }

        .searchTop strong {
          font-size: clamp(24px, 7vw, 31px);
          line-height: 1.08;
        }

        .searchMainRow {
          grid-template-columns: minmax(0, 1fr);
          gap: 12px;
        }

        .searchInput,
        .primarySearchButton {
          width: 100%;
          min-width: 0;
          min-height: 58px;
        }

        .primarySearchButton {
          justify-content: center;
        }

        .categoryRow {
          margin-top: 15px;
          padding-bottom: 6px;
        }

        .categoryRow button {
          min-height: 43px;
          padding-inline: 14px;
        }

        .quickLinks {
          gap: 12px;
        }

        .quickLinks > a {
          padding: 18px;
        }
      }

      @media (max-width: 460px) {
        :root {
          --home-navbar-clearance: 138px;
          --home-page-gap: 13px;
        }

        .userTopActions,
        .hostTopActions {
          grid-template-columns: 1fr 1fr;
        }

        .userTopActions a,
        .hostTopActions a {
          min-height: 54px;
          font-size: 10px;
          gap: 7px;
        }

        .userSearchStage {
          padding: 19px;
          border-radius: 26px;
        }

        .searchCard,
        .searchCard.compact {
          padding: 18px;
          border-radius: 22px;
        }

        .searchTopIcon {
          display: none !important;
        }

        .searchInput {
          padding-inline: 14px;
        }

        .primarySearchButton {
          min-height: 56px;
        }

        .categoryRow {
          width: calc(100% + 2px);
          max-width: calc(100% + 2px);
          margin-inline: -1px;
        }
      }

      @media (max-width: 360px) {
        .userTopActions,
        .hostTopActions {
          grid-template-columns: 1fr;
        }

        .userGreeting h1,
        .hostTop h1 {
          font-size: 38px;
        }

        .userSearchStage {
          padding: 15px;
        }

        .searchCard,
        .searchCard.compact {
          padding: 16px;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        *,
        *::before,
        *::after {
          scroll-behavior: auto !important;
          animation: none !important;
          transition: none !important;
        }
      }
    `}</style>
  );
}
