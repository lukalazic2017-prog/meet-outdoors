import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";

function Icon({ name, size = 20, strokeWidth = 2 }) {
  const paths = {
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </>
    ),
    message: (
      <>
        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
        <path d="M8 9h8M8 13h5" />
      </>
    ),
    heart: (
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
    ),
    star: (
      <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z" />
    ),
    users: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20v-2a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v2" />
        <path d="M16 4.5a3 3 0 0 1 0 6M17 13a5 5 0 0 1 4 5v2" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    arrowRight: (
      <>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </>
    ),
    refresh: (
      <>
        <path d="M20 7v5h-5M4 17v-5h5" />
        <path d="M18.4 9A7 7 0 0 0 6 6.5L4 9M5.6 15A7 7 0 0 0 18 17.5l2-2.5" />
      </>
    ),
    alert: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5M12 16h.01" />
      </>
    ),
    inbox: (
      <>
        <path d="M4 4h16l2 11v5H2v-5Z" />
        <path d="M2 15h6l2 3h4l2-3h6" />
      </>
    ),
    sparkle: (
      <>
        <path d="m12 3 1.1 3.3L16 8l-2.9 1.7L12 13l-1.1-3.3L8 8l2.9-1.7L12 3Z" />
        <path d="m18 14 .7 2.3L21 17l-2.3.7L18 20l-.7-2.3L15 17l2.3-.7L18 14Z" />
      </>
    ),
    shield: (
      <>
        <path d="M12 3 5 6v5c0 4.6 2.9 8.4 7 10 4.1-1.6 7-5.4 7-10V6l-7-3Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

function formatDate(value) {
  if (!value) return "Nepoznato vreme";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Nepoznato vreme";
  }

  return new Intl.DateTimeFormat("sr-Latn-RS", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function relativeTime(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const difference = Date.now() - date.getTime();
  const minutes = Math.floor(difference / 60000);
  const hours = Math.floor(difference / 3600000);
  const days = Math.floor(difference / 86400000);

  if (minutes < 1) return "Upravo sada";
  if (minutes < 60) return `Pre ${minutes} min`;
  if (hours < 24) return `Pre ${hours} h`;
  if (days === 1) return "Juče";
  if (days < 7) return `Pre ${days} dana`;

  return formatDate(value);
}

function notificationMeta(notification) {
  const text = [
    notification.type,
    notification.title,
    notification.message,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (notification.type === "adventure_demand") {
    return {
      icon: "sparkle",
      label: "Nova potražnja",
      tone: "adventure",
      actionLabel: "Otvori potražnju",
    };
  }

  if (notification.type === "adventure_offer") {
    return {
      icon: "sparkle",
      label: "Nova ponuda",
      tone: "offer",
      actionLabel: "Pogledaj ponudu",
    };
  }

  if (notification.type === "adventure_offer_accepted") {
    return {
      icon: "check",
      label: "Ponuda prihvaćena",
      tone: "success",
      actionLabel: null,
    };
  }

  if (notification.type === "adventure_offer_rejected") {
    return {
      icon: "alert",
      label: "Ponuda odbijena",
      tone: "neutral",
      actionLabel: null,
    };
  }

  if (
    text.includes("booking") ||
    text.includes("rezerv")
  ) {
    return {
      icon: "users",
      label: "Rezervacija",
      tone: "purple",
      actionLabel: "Pogledaj detalje",
    };
  }

  if (
    text.includes("comment") ||
    text.includes("komentar")
  ) {
    return {
      icon: "message",
      label: "Komentar",
      tone: "blue",
      actionLabel: "Pogledaj detalje",
    };
  }

  if (
    text.includes("review") ||
    text.includes("recenz")
  ) {
    return {
      icon: "star",
      label: "Recenzija",
      tone: "gold",
      actionLabel: "Pogledaj detalje",
    };
  }

  if (
    text.includes("interest") ||
    text.includes("zainteres")
  ) {
    return {
      icon: "heart",
      label: "Interesovanje",
      tone: "rose",
      actionLabel: "Pogledaj detalje",
    };
  }

  if (
    text.includes("event") ||
    text.includes("događ")
  ) {
    return {
      icon: "calendar",
      label: "Događaj",
      tone: "green",
      actionLabel: "Pogledaj detalje",
    };
  }

  if (
    text.includes("welcome") ||
    text.includes("dobrodo")
  ) {
    return {
      icon: "sparkle",
      label: "MeetOutdoors",
      tone: "lime",
      actionLabel: null,
    };
  }

  return {
    icon: "bell",
    label: "Obaveštenje",
    tone: "neutral",
    actionLabel: null,
  };
}

function NotificationCard({
  notification,
  onOpen,
}) {
  const meta = notificationMeta(notification);

  const target =
  notification.type === "adventure_demand" &&
  notification.adventure_intent_id
    ? `/host/demand/${notification.adventure_intent_id}`

    : notification.type === "adventure_offer" &&
        notification.adventure_intent_id
      ? `/agent/request/${notification.adventure_intent_id}`

      : notification.type === "adventure_offer_accepted" &&
          notification.adventure_intent_id
        ? `/host/demand/${notification.adventure_intent_id}`

        : notification.type === "adventure_offer_rejected" &&
            notification.adventure_intent_id
          ? `/host/demand/${notification.adventure_intent_id}`

          : notification.event_id
            ? `/event/${notification.event_id}`

            : notification.package_id
              ? `/package/${notification.package_id}`

              : null;

  const unread = notification.is_read !== true;
  const isAdventure =
    notification.type === "adventure_demand" ||
    notification.type === "adventure_offer" ||
    notification.type === "adventure_offer_accepted" ||
    notification.type === "adventure_offer_rejected";

  const isRecent =
    notification.created_at &&
    Date.now() - new Date(notification.created_at).getTime() <
      1000 * 60 * 60 * 24 * 7;

  const ageClass = isRecent ? "recentNotification" : "olderNotification";

  const body = (
    <>
      <span
        className={`notificationIcon ${meta.tone}`}
      >
        <Icon name={meta.icon} size={20} />
      </span>

      <div className="notificationBody">
        <div className="notificationMeta">
          <div className="metaLeft">
            <span>{meta.label}</span>
            {unread && <em>Novo</em>}
          </div>

          <small>
            <Icon name="clock" size={13} />
            {relativeTime(notification.created_at)}
          </small>
        </div>

        <h3>
          {notification.title || "Novo obaveštenje"}
        </h3>

        <p>
          {notification.message ||
            "Imaš novu aktivnost na svom MeetOutdoors nalogu."}
        </p>

        <div className="notificationBottom">
          <small>
            {formatDate(notification.created_at)}
          </small>

          <div className="notificationBottomRight">
            <span className={`readState ${unread ? "isUnread" : "isRead"}`}>
              {unread ? "Nepročitano" : "Pročitano"}
            </span>

            {target && (
              <span className="detailAction">
                {meta.actionLabel || "Pogledaj detalje"}
                <Icon name="arrowRight" size={15} />
              </span>
            )}
          </div>
        </div>
      </div>

      {unread && <span className="unreadDot" />}
    </>
  );

  const className = [
    "notificationCard",
    unread ? "unread" : "read",
    isAdventure ? "adventureCard" : "",
    ageClass,
  ]
    .filter(Boolean)
    .join(" ");

  if (target) {
    return (
      <Link
        to={target}
        className={className}
        onClick={() => onOpen(notification)}
      >
        {body}
      </Link>
    );
  }

  return (
    <article
      className={className}
      onClick={() => onOpen(notification)}
      style={{
        cursor: unread ? "pointer" : "default",
      }}
    >
      {body}
    </article>
  );
}

function LoadingState() {
  return (
    <>
      <NotificationsStyles />

      <main className="statePage">
        <div className="stateCard">
          <span className="loader" />
          <h1>Učitavanje obaveštenja</h1>
          <p>
            Proveravamo šta je novo na tvom nalogu.
          </p>
        </div>
      </main>
    </>
  );
}

export default function Notifications() {
  const {
    profile,
    loading: authLoading,
  } = useAuth();

  const [notifications, setNotifications] =
    useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [markingAll, setMarkingAll] =
    useState(false);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const loadNotifications = useCallback(async () => {
    if (!profile?.id) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const {
        data,
        error: notificationsError,
      } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", profile.id)
        .order("created_at", {
          ascending: false,
        });

      if (notificationsError) {
        throw notificationsError;
      }

      setNotifications(data || []);
    } catch (loadError) {
      console.error(
        "Greška pri učitavanju obaveštenja:",
        loadError
      );
      setNotifications([]);
      setError(
        loadError.message ||
          "Obaveštenja trenutno nije moguće učitati."
      );
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  const markAsRead = useCallback(
    async (notification) => {
      if (
        !profile?.id ||
        !notification?.id ||
        notification.is_read === true
      ) {
        return;
      }

      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id
            ? {
                ...item,
                is_read: true,
              }
            : item
        )
      );

      const { error: readError } = await supabase
        .from("notifications")
        .update({
          is_read: true,
        })
        .eq("id", notification.id)
        .eq("user_id", profile.id);

      if (readError) {
        console.error(
          "Greška pri označavanju obaveštenja kao pročitanog:",
          readError
        );

        setNotifications((current) =>
          current.map((item) =>
            item.id === notification.id
              ? {
                  ...item,
                  is_read: false,
                }
              : item
          )
        );
      }
    },
    [profile?.id]
  );

  const markAllAsRead = useCallback(async () => {
    if (!profile?.id || markingAll) return;

    const hasUnread = notifications.some(
      (item) => item.is_read !== true
    );

    if (!hasUnread) return;

    setMarkingAll(true);

    const previousNotifications = notifications;

    setNotifications((current) =>
      current.map((item) => ({
        ...item,
        is_read: true,
      }))
    );

    try {
      const { error: readAllError } =
        await supabase
          .from("notifications")
          .update({
            is_read: true,
          })
          .eq("user_id", profile.id)
          .or("is_read.eq.false,is_read.is.null");

      if (readAllError) {
        throw readAllError;
      }
    } catch (readAllError) {
      console.error(
        "Greška pri označavanju svih obaveštenja kao pročitanih:",
        readAllError
      );

      setNotifications(previousNotifications);

      setError(
        readAllError.message ||
          "Nije moguće označiti sva obaveštenja kao pročitana."
      );
    } finally {
      setMarkingAll(false);
    }
  }, [
    profile?.id,
    markingAll,
    notifications,
  ]);

  useEffect(() => {
    if (authLoading) return;

    loadNotifications();
  }, [authLoading, loadNotifications]);

  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel(
        `notifications-realtime-${profile.id}`
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) => {
          const newNotification = payload.new;

          setNotifications((current) => {
            const exists = current.some(
              (item) =>
                item.id === newNotification.id
            );

            if (exists) {
              return current;
            }

            return [
              newNotification,
              ...current,
            ];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) => {
          const updatedNotification =
            payload.new;

          setNotifications((current) =>
            current.map((item) =>
              item.id ===
              updatedNotification.id
                ? updatedNotification
                : item
            )
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) => {
          const deletedId =
            payload.old?.id;

          if (!deletedId) return;

          setNotifications((current) =>
            current.filter(
              (item) =>
                item.id !== deletedId
            )
          );
        }
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          console.error(
            "Realtime notifications channel error"
          );
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  useEffect(() => {
    function syncPageSize() {
      const width = window.innerWidth;

      if (width <= 480) {
        setPageSize(4);
      } else if (width <= 760) {
        setPageSize(5);
      } else {
        setPageSize(8);
      }
    }

    syncPageSize();
    window.addEventListener("resize", syncPageSize);

    return () => {
      window.removeEventListener("resize", syncPageSize);
    };
  }, []);

  useEffect(() => {
    setPage(1);
  }, [filter]);

  const filteredNotifications = useMemo(() => {
    if (filter === "unread") {
      return notifications.filter(
        (notification) => notification.is_read !== true
      );
    }

    if (filter === "adventure") {
      return notifications.filter((notification) =>
        [
          "adventure_demand",
          "adventure_offer",
          "adventure_offer_accepted",
          "adventure_offer_rejected",
        ].includes(notification.type)
      );
    }

    return notifications;
  }, [notifications, filter]);

  const pageCount = useMemo(
    () => Math.max(1, Math.ceil(filteredNotifications.length / pageSize)),
    [filteredNotifications.length, pageSize]
  );

  const paginatedNotifications = useMemo(() => {
    const safePage = Math.min(page, pageCount);
    const startIndex = (safePage - 1) * pageSize;

    return filteredNotifications.slice(startIndex, startIndex + pageSize);
  }, [filteredNotifications, page, pageCount, pageSize]);

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageCount]);

  const unreadCount = useMemo(
    () =>
      notifications.filter(
        (notification) =>
          notification.is_read !== true
      ).length,
    [notifications]
  );

  if (authLoading || loading) {
    return <LoadingState />;
  }

  return (
    <>
      <NotificationsStyles />

      <main className="notificationsPage">
        <section className="hero">
          <div className="heroContent">
            <span className="kicker">
              <span />
              Centar aktivnosti
            </span>

            <h1>
              Tvoja
              <br />
              obaveštenja.
            </h1>

            <p>
              Sve što traži tvoju pažnju na jednom mestu —
              rezervacije, poruke, outdoor potražnje, ponude
              i važne aktivnosti na tvom MeetOutdoors nalogu.
            </p>
          </div>

          <div className="stats">
            <article>
              <strong>
                {notifications.length}
              </strong>
              <span>ukupno</span>
            </article>

            <article>
              <strong>{unreadCount}</strong>
              <span>nepročitanih</span>
            </article>

            <article>
              <strong>
                {notifications.length
                  ? relativeTime(
                      notifications[0].created_at
                    )
                  : "—"}
              </strong>
              <span>poslednja aktivnost</span>
            </article>
          </div>
        </section>

        <section className="content">
          <header className="toolbar">
            <div>
              <span className="sectionKicker">
                Aktivnost naloga
              </span>

              <h2>Najnovije promene</h2>

              <p>
                Najvažnije prvo. Sve ostalo uredno,
                hronološki i bez buke.
              </p>
            </div>

            <div className="toolbarActions">
              {unreadCount > 0 && (
                <button
                  type="button"
                  className="markAllButton"
                  onClick={markAllAsRead}
                  disabled={markingAll}
                >
                  <Icon
                    name="check"
                    size={16}
                  />
                  {markingAll
                    ? "Označavanje..."
                    : "Označi sve kao pročitano"}
                </button>
              )}

              <button
                type="button"
                onClick={loadNotifications}
              >
                <Icon
                  name="refresh"
                  size={16}
                />
                Osveži
              </button>
            </div>
          </header>

          {notifications.length > 0 && (
            <div className="filterBar" role="tablist" aria-label="Filtriranje obaveštenja">
              <button
                type="button"
                className={filter === "all" ? "active" : ""}
                onClick={() => setFilter("all")}
              >
                Sve
                <span>{notifications.length}</span>
              </button>

              <button
                type="button"
                className={filter === "unread" ? "active" : ""}
                onClick={() => setFilter("unread")}
              >
                Nepročitano
                <span>{unreadCount}</span>
              </button>

              <button
                type="button"
                className={filter === "adventure" ? "active" : ""}
                onClick={() => setFilter("adventure")}
              >
                Agent & ponude
                <span>
                  {notifications.filter((notification) =>
                    [
                      "adventure_demand",
                      "adventure_offer",
                      "adventure_offer_accepted",
                      "adventure_offer_rejected",
                    ].includes(notification.type)
                  ).length}
                </span>
              </button>
            </div>
          )}

          {error && (
            <div
              className="errorBox"
              role="alert"
            >
              <span>
                <Icon
                  name="alert"
                  size={18}
                />
              </span>

              <p>{error}</p>

              <button
                type="button"
                onClick={loadNotifications}
              >
                Pokušaj ponovo
              </button>
            </div>
          )}

          {!profile?.id ? (
            <div className="emptyState">
              <span>
                <Icon
                  name="user"
                  size={30}
                />
              </span>

              <h3>
                Prijavi se da vidiš obaveštenja.
              </h3>

              <p>
                Obaveštenja su dostupna samo
                prijavljenim korisnicima.
              </p>

              <Link to="/login">
                Prijavi se
                <Icon
                  name="arrowRight"
                  size={16}
                />
              </Link>
            </div>
          ) : notifications.length === 0 ? (
            <div className="emptyState">
              <span>
                <Icon
                  name="inbox"
                  size={30}
                />
              </span>

              <h3>
                Trenutno nema obaveštenja.
              </h3>

              <p>
                Kada stigne rezervacija, komentar,
                nova outdoor potražnja ili ponuda,
                pojaviće se ovde.
              </p>

              <Link to="/events">
                Istraži događaje
                <Icon
                  name="arrowRight"
                  size={16}
                />
              </Link>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="emptyState compactEmpty">
              <span>
                <Icon name="inbox" size={28} />
              </span>
              <h3>Nema obaveštenja u ovom prikazu.</h3>
              <p>Promeni filter da vidiš ostatak aktivnosti.</p>
              <button type="button" className="resetFilterButton" onClick={() => setFilter("all")}>
                Prikaži sva obaveštenja
              </button>
            </div>
          ) : (
            <div className="notificationViewport">
              <div className="notificationGrid">
                {paginatedNotifications.map((notification) => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    onOpen={markAsRead}
                  />
                ))}
              </div>

              {pageCount > 1 && (
                <div
                  className="paginationBar"
                  aria-label="Stranice obaveštenja"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setPage((current) => Math.max(1, current - 1))
                    }
                    disabled={page === 1}
                  >
                    Prethodna
                  </button>

                  <span>
                    {page} / {pageCount}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setPage((current) =>
                        Math.min(pageCount, current + 1)
                      )
                    }
                    disabled={page === pageCount}
                  >
                    Sledeća
                  </button>
                </div>
              )}
            </div>
          )}

          <section className="infoSection">
            <div>
              <span className="sectionKicker">
                Ostani u toku
              </span>

              <h2>
                Važne aktivnosti, bez suvišne buke.
              </h2>

              <p>
                MeetOutdoors obaveštenja su komandni centar
                za ono što zahteva tvoju akciju — od rezervacije
                do nove potražnje ili ponude.
              </p>
            </div>

            <div className="benefits">
              <article>
                <span>
                  <Icon
                    name="users"
                    size={20}
                  />
                </span>

                <div>
                  <strong>Rezervacije</strong>
                  <small>
                    Prati nove zahteve i aktivnosti
                    učesnika.
                  </small>
                </div>
              </article>

              <article>
                <span>
                  <Icon
                    name="message"
                    size={20}
                  />
                </span>

                <div>
                  <strong>Interakcije</strong>
                  <small>
                    Vidi komentare, recenzije i
                    interesovanja.
                  </small>
                </div>
              </article>

              <article>
                <span>
                  <Icon
                    name="shield"
                    size={20}
                  />
                </span>

                <div>
                  <strong>Outdoor potražnje</strong>
                  <small>
                    Hostovi dobijaju realnu tražnju, a korisnici
                    ponude koje mogu da prihvate ili odbiju.
                  </small>
                </div>
              </article>
            </div>
          </section>
        </section>
      </main>
    </>
  );
}

function NotificationsStyles() {
  return (
    <style>{`
      * { box-sizing: border-box; }
      body { margin: 0; background: #eef1e9; }
      button { font: inherit; }

      .notificationsPage,
      .statePage {
        min-height: 100vh;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system,
          BlinkMacSystemFont, "Segoe UI", sans-serif;
        color: #20332a;
      }

      .notificationsPage {
        padding: 118px 28px 28px;
        background:
          radial-gradient(circle at 10% -2%, rgba(181, 220, 140, .22), transparent 28%),
          radial-gradient(circle at 96% 18%, rgba(49, 94, 65, .12), transparent 30%),
          linear-gradient(180deg, #f7f8f4 0%, #edf1e9 100%);
      }

      .notificationsPage a {
        color: inherit;
        text-decoration: none;
      }

      .hero {
        position: relative;
        isolation: isolate;
        width: min(1180px, 100%);
        min-height: 440px;
        margin: 0 auto;
        padding: 40px;
        overflow: hidden;
        border-radius: 36px;
        background:
          radial-gradient(circle at 80% 20%, rgba(191, 237, 128, .15), transparent 25%),
          linear-gradient(135deg, #0a2417 0%, #123b26 52%, #2b5e3f 100%);
        color: #fff;
        box-shadow: 0 34px 90px rgba(23, 54, 36, .18);
      }

      .hero::before {
        content: "";
        position: absolute;
        width: 520px;
        height: 520px;
        right: -180px;
        top: -200px;
        border-radius: 50%;
        border: 1px solid rgba(255,255,255,.08);
        box-shadow:
          0 0 0 80px rgba(255,255,255,.025),
          0 0 0 160px rgba(255,255,255,.015);
        z-index: -1;
      }

      .toolbar,
      .groupHeader,
      .notificationMeta,
      .notificationBottom {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
      }

      .heroContent {
        max-width: 780px;
        padding: 56px 0 42px;
      }

      .kicker {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 9px 13px;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,.14);
        background: rgba(255,255,255,.07);
        color: rgba(255,255,255,.75);
        font-size: 9px;
        font-weight: 900;
        letter-spacing: .12em;
        text-transform: uppercase;
      }

      .kicker > span {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #cef39a;
        box-shadow: 0 0 0 5px rgba(206,243,154,.12);
      }

      .hero h1 {
        margin: 24px 0 0;
        font-size: clamp(58px, 8vw, 98px);
        line-height: .88;
        letter-spacing: -.08em;
      }

      .heroContent p {
        max-width: 600px;
        margin: 24px 0 0;
        color: rgba(255,255,255,.62);
        font-size: 14px;
        line-height: 1.75;
      }

      .stats {
        display: grid;
        grid-template-columns: repeat(3, minmax(0,1fr));
        gap: 12px;
        margin-top: 8px;
        padding-top: 22px;
        border-top: 1px solid rgba(255,255,255,.11);
      }

      .stats article {
        padding: 14px 16px;
        border: 1px solid rgba(255,255,255,.09);
        border-radius: 18px;
        background: rgba(255,255,255,.055);
        backdrop-filter: blur(14px);
      }

      .stats strong,
      .stats span {
        display: block;
      }

      .stats strong {
        font-size: 25px;
        letter-spacing: -.04em;
      }

      .stats span {
        margin-top: 5px;
        color: rgba(255,255,255,.43);
        font-size: 8px;
        font-weight: 800;
        letter-spacing: .08em;
        text-transform: uppercase;
      }

      .content {
        width: min(1120px, 100%);
        margin: 0 auto;
      }

      .toolbar {
        align-items: flex-end;
        margin: 52px 0 22px;
      }

      .toolbarActions {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        flex-wrap: wrap;
        gap: 9px;
      }

      .sectionKicker {
        color: #769450;
        font-size: 9px;
        font-weight: 900;
        letter-spacing: .13em;
        text-transform: uppercase;
      }

      .toolbar h2,
      .infoSection h2 {
        margin: 9px 0 0;
        color: #21352b;
        font-size: clamp(34px, 5vw, 52px);
        line-height: .98;
        letter-spacing: -.06em;
      }

      .toolbar p {
        margin: 10px 0 0;
        color: #7e8b82;
        font-size: 10px;
      }

      .toolbarActions > button,
      .errorBox button {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        border: 1px solid #d5dfd1;
        background: rgba(255,255,255,.8);
        color: #4c6255;
        cursor: pointer;
        font-weight: 850;
      }

      .toolbarActions > button {
        min-height: 43px;
        padding: 0 15px;
        border-radius: 13px;
        font-size: 9px;
      }

      .toolbarActions > button:disabled {
        cursor: wait;
        opacity: .65;
      }

      .toolbarActions .markAllButton {
        border-color: #bfd2ae;
        background: #edf5e7;
        color: #4c6d39;
      }

      .filterBar {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;
        margin: 0 0 24px;
        padding: 6px;
        width: fit-content;
        max-width: 100%;
        border: 1px solid #d9e2d6;
        border-radius: 15px;
        background: rgba(255,255,255,.62);
        box-shadow: 0 8px 24px rgba(31,51,38,.035);
      }

      .filterBar button {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-height: 38px;
        padding: 0 12px;
        border: 0;
        border-radius: 10px;
        background: transparent;
        color: #6f7d74;
        cursor: pointer;
        font-size: 9px;
        font-weight: 850;
      }

      .filterBar button span {
        display: grid;
        place-items: center;
        min-width: 21px;
        height: 21px;
        padding: 0 6px;
        border-radius: 999px;
        background: #e8eee5;
        color: #617068;
        font-size: 7px;
      }

      .filterBar button.active {
        background: #183b29;
        color: #fff;
        box-shadow: 0 8px 18px rgba(29,70,47,.14);
      }

      .filterBar button.active span {
        background: rgba(255,255,255,.12);
        color: #dff1cb;
      }

      .groups {
        display: grid;
        gap: 31px;
      }

      .group {
        display: grid;
        gap: 12px;
      }

      .groupHeader {
        padding: 0 4px;
      }

      .groupHeader > div {
        display: flex;
        align-items: center;
        gap: 9px;
      }

      .groupHeader > div > span {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #7d9c58;
        box-shadow: 0 0 0 5px rgba(125,156,88,.11);
      }

      .groupHeader h2 {
        margin: 0;
        color: #405548;
        font-size: 13px;
      }

      .groupHeader small {
        color: #929c95;
        font-size: 8px;
      }

      .list {
        display: grid;
        gap: 10px;
      }

      .notificationCard {
        position: relative;
        display: grid;
        grid-template-columns: auto minmax(0,1fr);
        gap: 14px;
        padding: 18px;
        border: 1px solid #dbe3d8;
        border-radius: 20px;
        background: rgba(255,255,255,.82);
        box-shadow: 0 10px 28px rgba(29,50,37,.035);
        transition: .2s ease;
      }

      .notificationCard.read {
        opacity: .76;
        background: rgba(250,251,249,.68);
        box-shadow: none;
      }

      .notificationCard.read:hover {
        opacity: 1;
      }

      .notificationCard.olderNotification {
        border-color: #e2e7e0;
      }

      .notificationCard.olderNotification.read {
        filter: saturate(.82);
      }

      a.notificationCard:hover {
        transform: translateY(-2px);
        background: white;
        border-color: #bdcbb8;
        box-shadow: 0 18px 40px rgba(29,50,37,.08);
      }

      .notificationCard.unread {
        border-color: #adc89a;
        background:
          linear-gradient(
            135deg,
            rgba(239,248,230,.99),
            rgba(255,255,255,.96)
          );
        box-shadow:
          0 14px 38px rgba(73, 110, 55, .11);
      }

      .notificationCard.unread::after {
        content: "";
        position: absolute;
        inset: 0 auto 0 0;
        width: 4px;
        border-radius: 20px 0 0 20px;
        background: linear-gradient(180deg, #91bd61, #2f6947);
      }

      .notificationIcon {
        display: grid;
        place-items: center;
        width: 49px;
        height: 49px;
        border-radius: 15px;
        background: #e9eee6;
        color: #66776c;
      }


      .notificationCard.adventureCard {
        overflow: hidden;
        border-color: rgba(97, 128, 71, .28);
        background:
          radial-gradient(circle at 100% 0%, rgba(202, 239, 158, .18), transparent 30%),
          rgba(255,255,255,.92);
      }

      .notificationCard.adventureCard::before {
        content: "";
        position: absolute;
        inset: 0 0 auto 0;
        height: 3px;
        background: linear-gradient(90deg, #b2dc7c, #2d6545);
      }

      .notificationCard.adventureCard.unread {
        border-color: rgba(107, 146, 77, .42);
        box-shadow:
          0 18px 44px rgba(48, 86, 58, .10),
          inset 0 1px 0 rgba(255,255,255,.8);
      }

      .notificationIcon.adventure {
        background:
          linear-gradient(145deg, #163f2b, #2d6a49);
        color: #d9f6ae;
        box-shadow: 0 10px 24px rgba(28, 73, 47, .22);
      }

      .notificationIcon.offer {
        background:
          linear-gradient(145deg, #f0f6e7, #dcebc9);
        color: #466c36;
      }

      .notificationIcon.success {
        background:
          linear-gradient(145deg, #e4f4e8, #d4ead9);
        color: #2f6c47;
      }

      .adventureHint {
        display: inline-flex !important;
        align-items: center;
        gap: 6px;
        color: #587148 !important;
        font-weight: 900 !important;
        letter-spacing: .02em;
      }

      .notificationIcon.green {
        background: #e8f0de;
        color: #5f7c43;
      }

      .notificationIcon.blue {
        background: #e7eef5;
        color: #4e7091;
      }

      .notificationIcon.purple {
        background: #eee9f7;
        color: #705b92;
      }

      .notificationIcon.gold {
        background: #f7f0dc;
        color: #96772f;
      }

      .notificationIcon.rose {
        background: #f7e9e9;
        color: #9d5656;
      }

      .notificationIcon.lime {
        background: #e8f2de;
        color: #608443;
      }

      .notificationBody {
        min-width: 0;
      }

      .metaLeft {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 7px;
      }

      .metaLeft > span {
        color: #789457;
        font-size: 8px;
        font-weight: 900;
        letter-spacing: .09em;
        text-transform: uppercase;
      }

      .metaLeft > em {
        padding: 4px 6px;
        border-radius: 999px;
        background: #dff0d2;
        color: #527640;
        font-style: normal;
        font-size: 6px;
        font-weight: 950;
        letter-spacing: .08em;
        text-transform: uppercase;
      }

      .notificationMeta small {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        color: #929c95;
        font-size: 8px;
      }

      .notificationBody h3 {
        margin: 7px 0 0;
        color: #304538;
        font-size: 17px;
        line-height: 1.25;
        letter-spacing: -.025em;
      }

      .notificationBody p {
        margin: 7px 0 0;
        color: #77837b;
        font-size: 12px;
        line-height: 1.65;
      }

      .notificationBottom {
        margin-top: 13px;
        padding-top: 11px;
        border-top: 1px solid #e5e9e3;
      }

      .notificationBottom > small {
        color: #9aa29c;
        font-size: 7px;
      }

      .notificationBottomRight {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 8px;
      }

      .readState {
        display: inline-flex;
        align-items: center;
        min-height: 23px;
        padding: 0 8px;
        border-radius: 999px;
        font-size: 6px;
        font-weight: 900;
        letter-spacing: .06em;
        text-transform: uppercase;
      }

      .readState.isUnread {
        background: #e1f0d6;
        color: #53753f;
      }

      .readState.isRead {
        background: #edf0ec;
        color: #89938d;
      }

      .detailAction {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: #48604f;
        font-size: 8px;
        font-weight: 850;
      }

      .unreadDot {
        position: absolute;
        top: 17px;
        right: 17px;
        width: 9px;
        height: 9px;
        border: 2px solid white;
        border-radius: 50%;
        background: #79a250;
        box-shadow:
          0 0 0 4px rgba(121,162,80,.1);
      }

      .errorBox {
        display: grid;
        grid-template-columns:
          auto minmax(0,1fr) auto;
        align-items: center;
        gap: 11px;
        margin-bottom: 18px;
        padding: 14px;
        border: 1px solid #efc7c2;
        border-radius: 16px;
        background: #fff0ee;
        color: #963f35;
      }

      .errorBox > span {
        display: grid;
        place-items: center;
        width: 34px;
        height: 34px;
        border-radius: 10px;
        background: #f8d7d3;
      }

      .errorBox p {
        margin: 0;
        font-size: 10px;
      }

      .errorBox button {
        border: 0;
        background: transparent;
        color: inherit;
        font-size: 9px;
      }

      .emptyState {
        display: grid;
        place-items: center;
        padding: 76px 25px;
        border: 1px dashed #cad6c6;
        border-radius: 26px;
        background: rgba(255,255,255,.58);
        text-align: center;
      }

      .emptyState > span {
        display: grid;
        place-items: center;
        width: 68px;
        height: 68px;
        border-radius: 21px;
        background: #e7f0dc;
        color: #608047;
      }

      .emptyState h3 {
        margin: 19px 0 0;
        color: #34483b;
        font-size: 21px;
        letter-spacing: -.03em;
      }

      .emptyState p {
        max-width: 520px;
        margin: 10px auto 0;
        color: #869188;
        font-size: 11px;
        line-height: 1.65;
      }

      .compactEmpty {
        padding: 48px 24px;
      }

      .resetFilterButton {
        margin-top: 18px;
        padding: 11px 14px;
        border: 1px solid #d5dfd1;
        border-radius: 11px;
        background: #183a27;
        color: white;
        cursor: pointer;
        font-size: 9px;
        font-weight: 850;
      }

      .emptyState a {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        margin-top: 20px;
        padding: 12px 15px;
        border-radius: 12px;
        background: #183a27;
        color: white !important;
        font-size: 10px;
        font-weight: 850;
      }

      .infoSection {
        display: grid;
        grid-template-columns:
          minmax(0,.8fr)
          minmax(480px,1.2fr);
        gap: 34px;
        margin-top: 48px;
        padding: 34px;
        border: 1px solid #dbe3d8;
        border-radius: 29px;
        background: rgba(255,255,255,.68);
        box-shadow:
          0 16px 42px rgba(31,51,38,.05);
      }

      .infoSection > div:first-child p {
        margin: 15px 0 0;
        color: #7d8981;
        font-size: 11px;
        line-height: 1.7;
      }

      .benefits {
        display: grid;
        gap: 10px;
      }

      .benefits article {
        display: flex;
        gap: 12px;
        padding: 14px;
        border: 1px solid #dde4da;
        border-radius: 16px;
        background: #f8faf6;
      }

      .benefits article > span {
        display: grid;
        place-items: center;
        flex: 0 0 auto;
        width: 41px;
        height: 41px;
        border-radius: 13px;
        background: #e7f0dc;
        color: #5e7b43;
      }

      .benefits strong,
      .benefits small {
        display: block;
      }

      .benefits strong {
        color: #3c5143;
        font-size: 10px;
      }

      .benefits small {
        margin-top: 4px;
        color: #89938c;
        font-size: 8px;
        line-height: 1.5;
      }

      .statePage {
        display: grid;
        place-items: center;
        padding: 118px 24px 24px;
        background:
          radial-gradient(circle at top left, rgba(166,203,126,.18), transparent 30%),
          #eef1e9;
      }

      .stateCard {
        display: grid;
        place-items: center;
        width: min(500px,100%);
        padding: 50px 30px;
        border: 1px solid #dce3d9;
        border-radius: 28px;
        background: rgba(255,255,255,.83);
        text-align: center;
        box-shadow:
          0 20px 60px rgba(28,48,35,.08);
      }

      .loader {
        width: 38px;
        height: 38px;
        border: 3px solid #dce5d7;
        border-top-color: #52783c;
        border-radius: 50%;
        animation: spin .8s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      .stateCard h1 {
        margin: 18px 0 0;
        font-size: 28px;
        letter-spacing: -.04em;
      }

      .stateCard p {
        margin: 9px 0 0;
        color: #7e8981;
        font-size: 11px;
      }

      @media (max-width: 900px) {
        .infoSection {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 700px) {
        .notificationsPage {
          padding: 84px 0 64px;
        }

        .statePage {
          padding-top: 84px;
        }

        .hero {
          min-height: 470px;
          padding: 24px;
          border-radius: 0 0 32px 32px;
        }

        .content {
          padding: 0 18px;
        }

        .toolbar {
          align-items: flex-start;
          flex-direction: column;
        }

        .toolbarActions {
          width: 100%;
          justify-content: flex-start;
        }

        .filterBar {
          width: 100%;
        }

        .filterBar button {
          flex: 1;
          justify-content: center;
        }

        .stats {
          grid-template-columns: 1fr;
        }

        .infoSection {
          padding: 24px;
        }
      }

      @media (max-width: 480px) {
        .hero {
          padding: 19px;
        }

        .hero h1 {
          font-size: 49px;
        }

        .toolbarActions {
          align-items: stretch;
          flex-direction: column;
        }

        .toolbarActions > button {
          justify-content: center;
          width: 100%;
        }

        .notificationCard {
          grid-template-columns:
            auto minmax(0,1fr);
          padding: 15px;
        }

        .notificationMeta,
        .notificationBottom {
          align-items: flex-start;
          flex-direction: column;
        }

        .notificationBottomRight {
          width: 100%;
          justify-content: space-between;
        }
      }

      @media (max-width: 370px) {
        .content {
          padding: 0 13px;
        }

        .notificationCard {
          grid-template-columns: 1fr;
        }
      }


      /* =========================================================
         NOTIFICATIONS — PREMIUM COMPACT INBOX V4
         Natural card heights. No giant empty cards.
         Page itself stays locked; pagination handles overflow.
         ========================================================= */

      html,
      body {
        overflow: hidden;
      }

      .notificationsPage {
        height: 100svh;
        min-height: 100svh;
        overflow: hidden;
        padding: 64px 10px 10px;
        display: grid;
        grid-template-rows: auto minmax(0, 1fr);
        gap: 8px;
        background:
          radial-gradient(circle at 8% -3%, rgba(174, 211, 137, .14), transparent 24%),
          radial-gradient(circle at 96% 16%, rgba(31, 77, 51, .055), transparent 28%),
          linear-gradient(180deg, #f7f9f4 0%, #eef2eb 100%);
      }

      .hero {
        width: min(1180px, 100%);
        min-height: 0;
        height: auto;
        margin: 0 auto;
        padding: 16px 18px;
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        gap: 18px;
        overflow: hidden;
        border: 1px solid rgba(255,255,255,.08);
        border-radius: 20px;
        background:
          radial-gradient(circle at 88% 4%, rgba(202, 239, 158, .11), transparent 25%),
          linear-gradient(135deg, #0b2518 0%, #123a27 55%, #28583e 100%);
        box-shadow:
          0 16px 38px rgba(24, 55, 37, .14),
          inset 0 1px 0 rgba(255,255,255,.035);
      }

      .hero::before {
        display: none;
      }

      .heroContent {
        min-width: 0;
        max-width: 680px;
        padding: 0;
      }

      .kicker {
        gap: 6px;
        padding: 5px 8px;
        border-color: rgba(255,255,255,.12);
        background: rgba(255,255,255,.055);
        font-size: 6px;
        letter-spacing: .11em;
      }

      .kicker > span {
        width: 5px;
        height: 5px;
        box-shadow: 0 0 0 3px rgba(206,243,154,.09);
      }

      .hero h1 {
        margin: 7px 0 0;
        font-size: clamp(32px, 4.4vw, 48px);
        line-height: .93;
        letter-spacing: -.06em;
      }

      .hero h1 br {
        display: none;
      }

      .heroContent p {
        max-width: 590px;
        margin: 7px 0 0;
        color: rgba(255,255,255,.56);
        font-size: 8px;
        line-height: 1.45;
      }

      .stats {
        display: grid;
        grid-template-columns: repeat(3, 94px);
        gap: 6px;
        margin: 0;
        padding: 0;
        border: 0;
      }

      .stats article {
        min-width: 0;
        padding: 9px 10px;
        border: 1px solid rgba(255,255,255,.09);
        border-radius: 12px;
        background: rgba(255,255,255,.052);
        backdrop-filter: blur(12px);
      }

      .stats strong {
        overflow: hidden;
        color: #fff;
        font-size: 17px;
        line-height: 1;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .stats span {
        margin-top: 4px;
        color: rgba(255,255,255,.40);
        font-size: 5px;
        letter-spacing: .05em;
      }

      .content {
        position: relative;
        width: min(1180px, 100%);
        min-height: 0;
        height: 100%;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        gap: 6px;
        overflow: hidden;
      }

      .toolbar {
        flex: 0 0 auto;
        min-height: 44px;
        margin: 0;
        padding: 6px 8px;
        align-items: center;
        border: 1px solid #dbe4d7;
        border-radius: 13px;
        background: rgba(255,255,255,.72);
        box-shadow: 0 6px 18px rgba(31,51,38,.035);
      }

      .sectionKicker {
        font-size: 5.5px;
      }

      .toolbar h2 {
        margin-top: 2px;
        font-size: 17px;
        letter-spacing: -.04em;
      }

      .toolbar p {
        display: none;
      }

      .toolbarActions {
        gap: 5px;
      }

      .toolbarActions > button {
        min-height: 30px;
        padding: 0 9px;
        border-radius: 9px;
        font-size: 6px;
      }

      .toolbarActions > button svg {
        width: 12px;
        height: 12px;
      }

      .filterBar {
        flex: 0 0 auto;
        width: 100%;
        max-width: none;
        min-height: 38px;
        margin: 0;
        padding: 4px;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 4px;
        border: 1px solid #dce4d9;
        border-radius: 12px;
        background: rgba(255,255,255,.66);
        box-shadow: 0 6px 18px rgba(31,51,38,.025);
      }

      .filterBar button {
        justify-content: center;
        min-width: 0;
        min-height: 30px;
        padding: 0 9px;
        gap: 6px;
        border-radius: 9px;
        font-size: 6px;
      }

      .filterBar button span {
        min-width: 17px;
        height: 17px;
        padding: 0 4px;
        font-size: 5px;
      }

      .filterBar button.active {
        background: linear-gradient(135deg, #123824, #1d5135);
        box-shadow: 0 5px 12px rgba(29,70,47,.10);
      }

      .notificationViewport {
        flex: 1 1 auto;
        min-height: 0;
        display: flex;
        flex-direction: column;
        gap: 6px;
        overflow: hidden;
      }

      .notificationGrid {
        flex: 0 0 auto;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        align-content: start;
        gap: 7px;
      }

      .notificationCard {
        position: relative;
        min-width: 0;
        height: auto;
        min-height: 92px;
        max-height: 104px;
        overflow: hidden;
        display: grid;
        grid-template-columns: 38px minmax(0,1fr);
        align-items: start;
        gap: 10px;
        padding: 10px 11px;
        border: 1px solid #dce5d9;
        border-radius: 14px;
        background: rgba(255,255,255,.88);
        box-shadow: 0 7px 18px rgba(29,50,37,.035);
        transition:
          transform .18s ease,
          border-color .18s ease,
          box-shadow .18s ease,
          background .18s ease;
      }

      .notificationCard.read {
        opacity: .92;
        background: rgba(255,255,255,.74);
      }

      a.notificationCard:hover {
        transform: translateY(-1px);
        border-color: #bdcdb8;
        background: #fff;
        box-shadow: 0 10px 22px rgba(29,50,37,.055);
      }

      .notificationCard.unread {
        border-color: #b7cdab;
        background:
          linear-gradient(135deg, rgba(244,250,238,.98), rgba(255,255,255,.96));
        box-shadow: 0 8px 22px rgba(70,104,54,.07);
      }

      .notificationCard.unread::after {
        width: 3px;
        border-radius: 14px 0 0 14px;
        background: linear-gradient(180deg, #9ac768, #376f4b);
      }

      .notificationCard.adventureCard {
        border-color: rgba(95,130,72,.24);
        background:
          radial-gradient(circle at 100% 0%, rgba(206,239,165,.10), transparent 33%),
          rgba(255,255,255,.90);
      }

      .notificationCard.adventureCard::before {
        height: 2px;
        background: linear-gradient(90deg, #b4dc80, #326b49, transparent 76%);
      }

      .notificationIcon {
        width: 38px;
        height: 38px;
        border-radius: 11px;
      }

      .notificationIcon svg {
        width: 17px;
        height: 17px;
      }

      .notificationIcon.adventure {
        box-shadow: 0 7px 16px rgba(28,73,47,.15);
      }

      .notificationBody {
        min-width: 0;
      }

      .notificationMeta {
        gap: 6px;
      }

      .metaLeft {
        min-width: 0;
        gap: 4px;
      }

      .metaLeft > span {
        overflow: hidden;
        max-width: 180px;
        color: #6f8e51;
        font-size: 5.5px;
        letter-spacing: .08em;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .metaLeft > em {
        padding: 2px 5px;
        font-size: 4.5px;
      }

      .notificationMeta small {
        flex: 0 0 auto;
        gap: 3px;
        color: #98a099;
        font-size: 5.5px;
      }

      .notificationMeta small svg {
        width: 10px;
        height: 10px;
      }

      .notificationBody h3 {
        margin: 4px 0 0;
        overflow: hidden;
        color: #304538;
        font-size: 12px;
        line-height: 1.15;
        letter-spacing: -.02em;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .notificationBody p {
        display: -webkit-box;
        margin: 4px 0 0;
        overflow: hidden;
        -webkit-line-clamp: 1;
        -webkit-box-orient: vertical;
        color: #7c877f;
        font-size: 7px;
        line-height: 1.35;
      }

      .notificationBottom {
        margin-top: 6px;
        padding-top: 6px;
        gap: 5px;
        border-top-color: #e8ece6;
      }

      .notificationBottom > small {
        display: none;
      }

      .notificationBottomRight {
        width: 100%;
        justify-content: flex-start;
        gap: 5px;
      }

      .readState {
        min-height: 18px;
        padding: 0 6px;
        font-size: 4.5px;
      }

      .detailAction {
        margin-left: auto;
        gap: 4px;
        color: #48604f;
        font-size: 5.5px;
      }

      .detailAction svg {
        width: 10px;
        height: 10px;
      }

      .unreadDot {
        top: 8px;
        right: 8px;
        width: 6px;
        height: 6px;
        border-width: 1px;
        box-shadow: 0 0 0 3px rgba(121,162,80,.07);
      }

      .paginationBar {
        flex: 0 0 auto;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        min-height: 31px;
        padding: 1px 0;
      }

      .paginationBar button {
        min-height: 26px;
        padding: 0 9px;
        border: 1px solid #d5ded2;
        border-radius: 8px;
        background: rgba(255,255,255,.82);
        color: #526359;
        cursor: pointer;
        font-size: 5.5px;
        font-weight: 850;
      }

      .paginationBar button:disabled {
        opacity: .35;
        cursor: default;
      }

      .paginationBar span {
        min-width: 42px;
        color: #768078;
        text-align: center;
        font-size: 5.5px;
        font-weight: 850;
      }

      .infoSection {
        display: none !important;
      }

      .emptyState {
        flex: 1 1 auto;
        min-height: 0;
        padding: 24px 18px;
        border-radius: 16px;
      }

      .emptyState > span {
        width: 46px;
        height: 46px;
        border-radius: 14px;
      }

      .emptyState h3 {
        margin-top: 9px;
        font-size: 16px;
      }

      .emptyState p {
        margin-top: 5px;
        font-size: 8px;
      }

      .emptyState a,
      .resetFilterButton {
        margin-top: 10px;
        padding: 8px 11px;
        font-size: 7px;
      }

      .errorBox {
        position: absolute;
        z-index: 8;
        top: 0;
        right: 0;
        max-width: 420px;
        margin: 0;
        padding: 9px;
        border-radius: 11px;
        box-shadow: 0 8px 22px rgba(81,35,31,.08);
      }

      .statePage {
        height: 100svh;
        min-height: 100svh;
        overflow: hidden;
        padding: 64px 10px 10px;
      }

      .stateCard {
        width: min(430px,100%);
        padding: 28px 20px;
        border-radius: 20px;
      }

      @media (max-width: 760px) {
        .notificationsPage {
          padding: 58px 7px 7px;
          gap: 6px;
        }

        .hero {
          padding: 11px 12px;
          gap: 8px;
          border-radius: 15px;
        }

        .heroContent {
          max-width: none;
        }

        .kicker {
          padding: 4px 6px;
          font-size: 5px;
        }

        .hero h1 {
          margin-top: 5px;
          font-size: clamp(25px, 7vw, 31px);
        }

        .heroContent p {
          display: none;
        }

        .stats {
          grid-template-columns: repeat(3, 62px);
          gap: 4px;
        }

        .stats article {
          padding: 7px 6px;
          border-radius: 9px;
        }

        .stats strong {
          font-size: 13px;
        }

        .stats span {
          margin-top: 3px;
          font-size: 4px;
        }

        .toolbar {
          min-height: 38px;
          padding: 4px 5px;
          border-radius: 10px;
        }

        .toolbar > div:first-child {
          display: block;
        }

        .toolbar .sectionKicker {
          display: none;
        }

        .toolbar h2 {
          margin: 0;
          font-size: 12px;
        }

        .toolbarActions > button {
          min-height: 27px;
          padding: 0 7px;
          font-size: 5.5px;
        }

        .filterBar {
          min-height: 34px;
          padding: 3px;
        }

        .filterBar button {
          min-height: 27px;
          padding: 0 5px;
          font-size: 5.5px;
        }

        .notificationGrid {
          grid-template-columns: 1fr;
          gap: 5px;
        }

        .notificationCard {
          min-height: 82px;
          max-height: 88px;
          grid-template-columns: 36px minmax(0,1fr);
          gap: 8px;
          padding: 8px 9px;
          border-radius: 12px;
        }

        .notificationIcon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
        }

        .notificationIcon svg {
          width: 16px;
          height: 16px;
        }

        .notificationBody h3 {
          font-size: 11px;
        }

        .notificationBody p {
          font-size: 6.5px;
        }

        .notificationBottom {
          margin-top: 5px;
          padding-top: 5px;
        }

        .paginationBar {
          min-height: 28px;
        }

        .paginationBar button {
          min-height: 24px;
          padding: 0 8px;
          font-size: 5px;
        }
      }

      @media (max-width: 480px) {
        .notificationsPage {
          padding: 58px 6px 6px;
        }

        .hero {
          padding: 10px;
          grid-template-columns: minmax(0,1fr) auto;
        }

        .kicker {
          font-size: 4.5px;
        }

        .hero h1 {
          font-size: 24px;
        }

        .stats {
          grid-template-columns: repeat(3, 55px);
        }

        .stats article {
          padding: 6px 5px;
        }

        .stats strong {
          font-size: 11px;
        }

        .stats span {
          font-size: 3.6px;
        }

        .toolbar {
          min-height: 35px;
        }

        .toolbar h2 {
          font-size: 10px;
        }

        .toolbarActions {
          gap: 3px;
        }

        .toolbarActions > button {
          min-height: 25px;
          padding: 0 6px;
          font-size: 5px;
        }

        .filterBar {
          min-height: 32px;
        }

        .filterBar button {
          min-height: 25px;
          padding: 0 4px;
          gap: 4px;
          font-size: 5px;
        }

        .filterBar button span {
          min-width: 15px;
          height: 15px;
          font-size: 4px;
        }

        .notificationCard {
          min-height: 78px;
          max-height: 84px;
          grid-template-columns: 34px minmax(0,1fr);
          padding: 7px 8px;
        }

        .notificationIcon {
          width: 34px;
          height: 34px;
        }

        .metaLeft > span {
          max-width: 130px;
          font-size: 5px;
        }

        .notificationMeta small {
          font-size: 5px;
        }

        .notificationBody h3 {
          font-size: 10.5px;
        }

        .notificationBody p {
          font-size: 6px;
        }

        .readState {
          min-height: 17px;
          font-size: 4px;
        }

        .detailAction {
          font-size: 5px;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        *,
        *::before,
        *::after {
          animation: none !important;
          transition: none !important;
          scroll-behavior: auto !important;
        }
      }
    `}</style>
  );
}
