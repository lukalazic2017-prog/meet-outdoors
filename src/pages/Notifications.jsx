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

function dateGroup(value) {
  if (!value) return "Ranije";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Ranije";
  }

  const now = new Date();
  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const itemDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
  const difference = Math.round(
    (today - itemDay) / 86400000
  );

  if (difference === 0) return "Danas";
  if (difference === 1) return "Juče";
  if (difference < 7) return "Ove nedelje";

  return "Ranije";
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

  const body = (
    <>
      <span
        className={`notificationIcon ${meta.tone}`}
      >
        <Icon name={meta.icon} size={20} />
      </span>

      <div className="notificationBody">
        <div className="notificationMeta">
          <span>{meta.label}</span>

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

          {target && (
            <span>
              Pogledaj detalje
              <Icon name="arrowRight" size={15} />
            </span>
          )}
        </div>
      </div>

      {unread && <span className="unreadDot" />}
    </>
  );

  const className = [
    "notificationCard",
    unread ? "unread" : "",
    isAdventure ? "adventureCard" : "",
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

  const groupedNotifications = useMemo(() => {
    const groups = {
      Danas: [],
      Juče: [],
      "Ove nedelje": [],
      Ranije: [],
    };

    notifications.forEach((notification) => {
      groups[
        dateGroup(notification.created_at)
      ].push(notification);
    });

    return Object.entries(groups).filter(
      ([, items]) => items.length
    );
  }, [notifications]);

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
          ) : (
            <div className="groups">
              {groupedNotifications.map(
                ([groupName, items]) => (
                  <section
                    className="group"
                    key={groupName}
                  >
                    <div className="groupHeader">
                      <div>
                        <span />
                        <h2>{groupName}</h2>
                      </div>

                      <small>
                        {items.length}{" "}
                        {items.length === 1
                          ? "obaveštenje"
                          : "obaveštenja"}
                      </small>
                    </div>

                    <div className="list">
                      {items.map(
                        (notification) => (
                          <NotificationCard
                            key={
                              notification.id
                            }
                            notification={
                              notification
                            }
                            onOpen={
                              markAsRead
                            }
                          />
                        )
                      )}
                    </div>
                  </section>
                )
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
        background: rgba(255,255,255,.78);
        box-shadow: 0 10px 28px rgba(29,50,37,.04);
        transition: .2s ease;
      }

      a.notificationCard:hover {
        transform: translateY(-2px);
        background: white;
        border-color: #bdcbb8;
        box-shadow: 0 18px 40px rgba(29,50,37,.08);
      }

      .notificationCard.unread {
        border-color: #bfd2ae;
        background:
          linear-gradient(
            135deg,
            rgba(241,248,234,.98),
            rgba(255,255,255,.9)
          );
        box-shadow:
          0 12px 34px rgba(84, 118, 65, .08);
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
        inset: 0 auto 0 0;
        width: 4px;
        background: linear-gradient(180deg, #a9d56f, #2d6545);
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

      .notificationMeta > span {
        color: #789457;
        font-size: 8px;
        font-weight: 900;
        letter-spacing: .09em;
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

      .notificationBottom > span {
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
      }

      @media (max-width: 370px) {
        .content {
          padding: 0 13px;
        }

        .notificationCard {
          grid-template-columns: 1fr;
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
