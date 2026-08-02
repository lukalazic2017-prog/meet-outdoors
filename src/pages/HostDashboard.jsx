import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";

const FALLBACK_EVENT_IMAGE =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=85";

const FALLBACK_PACKAGE_IMAGE =
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=85";

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
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </>
    ),
    package: (
      <>
        <path d="m12 3 8 4-8 4-8-4 8-4Z" />
        <path d="m4 7 8 4 8-4" />
        <path d="M4 7v10l8 4 8-4V7" />
        <path d="M12 11v10" />
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
    heart: (
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
    ),
    plus: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),
    booking: (
      <>
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <path d="M8 2v4M16 2v4M3 9h18" />
        <path d="m8 14 2 2 5-5" />
      </>
    ),
    eye: (
      <>
        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
        <circle cx="12" cy="12" r="2.5" />
      </>
    ),
    edit: (
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
      </>
    ),
    trash: (
      <>
        <path d="M3 6h18" />
        <path d="M8 6V4h8v2" />
        <path d="m19 6-1 15H6L5 6" />
        <path d="M10 11v5M14 11v5" />
      </>
    ),
    mapPin: (
      <>
        <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
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
        <path d="M14 7h6v6" />
      </>
    ),
    alert: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5" />
        <path d="M12 16h.01" />
      </>
    ),
    close: (
      <>
        <path d="m6 6 12 12" />
        <path d="m18 6-12 12" />
      </>
    ),
    gallery: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <circle cx="9" cy="11" r="2" />
        <path d="m21 16-4-4-7 7" />
      </>
    ),
    interested: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20v-2a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v2" />
        <path d="M18 8v6M15 11h6" />
      </>
    ),
    shield: (
      <>
        <path d="M12 3 5 6v5c0 4.6 2.9 8.4 7 10 4.1-1.6 7-5.4 7-10V6l-7-3Z" />
        <path d="m9 12 2 2 4-4" />
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

function formatDate(value) {
  if (!value) return "Datum nije dodat";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("sr-Latn-RS", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function DashboardLoading() {
  return (
    <>
      <DashboardStyles />

      <main className="dashboardStatePage">
        <div className="dashboardStateCard">
          <span className="dashboardLoader" />
          <h1>Učitavanje dashboarda</h1>
          <p>Pripremamo tvoje događaje, pakete i statistiku.</p>
        </div>
      </main>
    </>
  );
}

function UnauthorizedState() {
  return (
    <>
      <DashboardStyles />

      <main className="dashboardStatePage">
        <div className="dashboardStateCard">
          <span className="stateIcon">
            <Icon name="shield" size={26} />
          </span>

          <h1>Samo domaćini imaju pristup.</h1>

          <p>
            Host Dashboard je namenjen organizatorima događaja i
            outdoor paketa.
          </p>

          <Link to="/" className="stateLink">
            Nazad na početnu
            <Icon name="arrowRight" size={17} />
          </Link>
        </div>
      </main>
    </>
  );
}

function StatCard({ icon, label, value, description }) {
  return (
    <article className="statCard">
      <div className="statCardTop">
        <span className="statIcon">
          <Icon name={icon} size={20} />
        </span>

        <span className="statTrend">
          <Icon name="trend" size={14} />
        </span>
      </div>

      <strong>{value}</strong>
      <span className="statLabel">{label}</span>
      <small>{description}</small>
    </article>
  );
}

function DashboardItemCard({
  type,
  item,
  interestedCount,
  deleting,
  onDelete,
}) {
  const isEvent = type === "event";

  const detailsUrl = isEvent
    ? `/event/${item.id}`
    : `/package/${item.id}`;

  const editUrl = isEvent
    ? `/edit-event/${item.id}`
    : `/edit-package/${item.id}`;

  const imageUrl =
    item.cover_url ||
    (isEvent
      ? FALLBACK_EVENT_IMAGE
      : FALLBACK_PACKAGE_IMAGE);

  const location =
    [item.location, item.country].filter(Boolean).join(", ") ||
    "Lokacija nije dodata";

  const dateValue =
    item.start_date ||
    item.event_date ||
    item.date ||
    item.created_at;

  return (
    <article className="dashboardItemCard">
      <div className="itemImageWrapper">
        <img
          src={imageUrl}
          alt={item.title || "Outdoor ponuda"}
          className="itemImage"
        />

        <div className="itemImageOverlay" />

        <span className="itemTypeBadge">
          <Icon
            name={isEvent ? "calendar" : "package"}
            size={14}
          />
          {isEvent ? "Događaj" : "Paket"}
        </span>

        <span className="interestBadge">
          <Icon name="heart" size={13} />
          {interestedCount}
        </span>
      </div>

      <div className="itemBody">
        <div className="itemHeading">
          <span className="itemKicker">
            {isEvent ? "Outdoor događaj" : "Outdoor paket"}
          </span>

          <h3>{item.title || "Bez naziva"}</h3>
        </div>

        <div className="itemMeta">
          <span>
            <Icon name="mapPin" size={14} />
            {location}
          </span>

          <span>
            <Icon name="clock" size={14} />
            {formatDate(dateValue)}
          </span>
        </div>

        <div className="interestSummary">
          <span>
            <Icon name="users" size={17} />
          </span>

          <div>
            <strong>{interestedCount}</strong>
            <small>
              {interestedCount === 1
                ? "zainteresovana osoba"
                : "zainteresovanih osoba"}
            </small>
          </div>
        </div>

        <div className="itemActions">
          <Link to={detailsUrl} className="itemAction">
            <Icon name="eye" size={16} />
            Pogledaj
          </Link>

          <Link to={editUrl} className="itemAction">
            <Icon name="edit" size={16} />
            Uredi
          </Link>

          {isEvent ? (
            <Link
              to={`/event/${item.id}/interested`}
              className="itemAction"
            >
              <Icon name="interested" size={16} />
              Interesovanje
            </Link>
          ) : (
            <Link
              to={`/edit-package/${item.id}/gallery`}
              className="itemAction"
            >
              <Icon name="gallery" size={16} />
              Galerija
            </Link>
          )}

          <button
            type="button"
            className="deleteAction"
            onClick={() => onDelete(item.id)}
            disabled={deleting}
          >
            {deleting ? (
              <span className="smallLoader" />
            ) : (
              <Icon name="trash" size={16} />
            )}

            {deleting ? "Brisanje" : "Obriši"}
          </button>
        </div>
      </div>
    </article>
  );
}

function EmptySection({
  type,
  title,
  description,
  buttonText,
  buttonUrl,
}) {
  return (
    <div className="emptySection">
      <span className="emptyIcon">
        <Icon
          name={type === "event" ? "calendar" : "package"}
          size={28}
        />
      </span>

      <h3>{title}</h3>
      <p>{description}</p>

      <Link to={buttonUrl}>
        <Icon name="plus" size={16} />
        {buttonText}
      </Link>
    </div>
  );
}

export default function HostDashboard() {
  const { profile, isHost, loading } = useAuth();

  const [events, setEvents] = useState([]);
  const [packages, setPackages] = useState([]);
  const [eventCounts, setEventCounts] = useState({});
  const [packageCounts, setPackageCounts] = useState({});
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [deletingItem, setDeletingItem] = useState("");

  const loadInterestCounts = useCallback(
    async (items, tableName, foreignKey) => {
      const entries = await Promise.all(
        items.map(async (item) => {
          const { count, error } = await supabase
            .from(tableName)
            .select("*", {
              count: "exact",
              head: true,
            })
            .eq(foreignKey, item.id);

          if (error) {
            console.error(
              `Greška pri brojanju interesovanja za ${item.id}:`,
              error
            );
          }

          return [item.id, count || 0];
        })
      );

      return Object.fromEntries(entries);
    },
    []
  );

  const loadDashboard = useCallback(async () => {
    if (!profile?.id || !isHost) {
      setEvents([]);
      setPackages([]);
      setEventCounts({});
      setPackageCounts({});
      setDashboardLoading(false);
      return;
    }

    setDashboardLoading(true);
    setMessage("");

    try {
      const [eventsResult, packagesResult] =
        await Promise.all([
          supabase
            .from("events")
            .select("*")
            .eq("host_id", profile.id)
            .order("created_at", {
              ascending: false,
            }),

          supabase
            .from("packages")
            .select("*")
            .eq("host_id", profile.id)
            .order("created_at", {
              ascending: false,
            }),
        ]);

      if (eventsResult.error) {
        throw eventsResult.error;
      }

      if (packagesResult.error) {
        throw packagesResult.error;
      }

      const loadedEvents = eventsResult.data || [];
      const loadedPackages = packagesResult.data || [];

      setEvents(loadedEvents);
      setPackages(loadedPackages);

      const [
        loadedEventCounts,
        loadedPackageCounts,
      ] = await Promise.all([
        loadInterestCounts(
          loadedEvents,
          "event_interested",
          "event_id"
        ),
        loadInterestCounts(
          loadedPackages,
          "package_interested",
          "package_id"
        ),
      ]);

      setEventCounts(loadedEventCounts);
      setPackageCounts(loadedPackageCounts);
    } catch (error) {
      console.error(
        "Greška pri učitavanju dashboarda:",
        error
      );

      setEvents([]);
      setPackages([]);
      setEventCounts({});
      setPackageCounts({});

      setMessage(
        error?.message ||
          "Dashboard nije moguće učitati."
      );
    } finally {
      setDashboardLoading(false);
    }
  }, [
    isHost,
    loadInterestCounts,
    profile?.id,
  ]);

  useEffect(() => {
    if (loading) return;

    loadDashboard();
  }, [loading, loadDashboard]);

  const deleteEvent = useCallback(async (id) => {
    const confirmed = window.confirm(
      "Da li sigurno želiš da obrišeš ovaj događaj?"
    );

    if (!confirmed) return;

    setDeletingItem(`event-${id}`);
    setMessage("");

    try {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setEvents((current) =>
        current.filter((event) => event.id !== id)
      );

      setEventCounts((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
    } catch (error) {
      setMessage(
        error?.message ||
          "Događaj nije moguće obrisati."
      );
    } finally {
      setDeletingItem("");
    }
  }, []);

  const deletePackage = useCallback(async (id) => {
    const confirmed = window.confirm(
      "Da li sigurno želiš da obrišeš ovaj paket?"
    );

    if (!confirmed) return;

    setDeletingItem(`package-${id}`);
    setMessage("");

    try {
      const { error } = await supabase
        .from("packages")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setPackages((current) =>
        current.filter((item) => item.id !== id)
      );

      setPackageCounts((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
    } catch (error) {
      setMessage(
        error?.message ||
          "Paket nije moguće obrisati."
      );
    } finally {
      setDeletingItem("");
    }
  }, []);

  const totalEventInterested = useMemo(
    () =>
      Object.values(eventCounts).reduce(
        (sum, number) =>
          sum + Number(number || 0),
        0
      ),
    [eventCounts]
  );

  const totalPackageInterested = useMemo(
    () =>
      Object.values(packageCounts).reduce(
        (sum, number) =>
          sum + Number(number || 0),
        0
      ),
    [packageCounts]
  );

  const totalInterest =
    totalEventInterested +
    totalPackageInterested;

  if (loading || dashboardLoading) {
    return <DashboardLoading />;
  }

  if (!isHost) {
    return <UnauthorizedState />;
  }

  const hostName =
    profile?.full_name ||
    profile?.username ||
    "domaćine";

  return (
    <>
      <DashboardStyles />

      <main className="hostDashboardPage">
        <div className="dashboardContainer">
          <section className="dashboardHero">
            <div className="heroDecoration heroDecorationOne" />
            <div className="heroDecoration heroDecorationTwo" />

            <div className="heroMain">
              <div className="heroCopy">
                <span className="heroKicker">
                  Kontrolni centar domaćina
                </span>

                <h1>
                  Dobrodošao,
                  <br />
                  {hostName}.
                </h1>

                <p>
                  Upravljaj događajima, paketima,
                  interesovanjima i rezervacijama sa jednog
                  mesta.
                </p>
              </div>

              <div className="heroActions">
                <Link
                  to="/create-event"
                  className="heroPrimaryAction"
                >
                  <span>
                    <Icon name="calendar" size={20} />
                  </span>

                  <div>
                    <strong>Kreiraj događaj</strong>
                    <small>
                      Objavi novu jednodnevnu avanturu.
                    </small>
                  </div>

                  <Icon name="arrowRight" size={18} />
                </Link>

                <Link
                  to="/create-package"
                  className="heroSecondaryAction"
                >
                  <span>
                    <Icon name="package" size={20} />
                  </span>

                  <div>
                    <strong>Kreiraj paket</strong>
                    <small>
                      Dodaj turu ili višednevno iskustvo.
                    </small>
                  </div>

                  <Icon name="arrowRight" size={18} />
                </Link>
              </div>
            </div>

            <div className="heroBottom">
              <Link to="/host-bookings">
                <Icon name="booking" size={17} />
                Upravljaj rezervacijama
                <Icon name="arrowRight" size={16} />
              </Link>

              {profile?.username && (
                <Link to={`/h/${profile.username}`}>
                  <Icon name="eye" size={17} />
                  Pogledaj javni profil
                </Link>
              )}
            </div>
          </section>

          {message && (
            <div
              className="dashboardMessage"
              role="alert"
            >
              <span>
                <Icon name="alert" size={18} />
              </span>

              <p>{message}</p>

              <button
                type="button"
                onClick={() => setMessage("")}
                aria-label="Zatvori poruku"
              >
                <Icon name="close" size={17} />
              </button>
            </div>
          )}

          <section className="statsGrid">
            <StatCard
              icon="calendar"
              label="Događaji"
              value={events.length}
              description="Ukupan broj objavljenih događaja."
            />

            <StatCard
              icon="package"
              label="Paketi"
              value={packages.length}
              description="Ture i višednevna iskustva."
            />

            <StatCard
              icon="heart"
              label="Ukupno interesovanje"
              value={totalInterest}
              description="Interesovanje za sve tvoje ponude."
            />

            <StatCard
              icon="users"
              label="Sadržaj"
              value={
                events.length + packages.length
              }
              description="Sve aktivne avanture na profilu."
            />
          </section>

          <section className="dashboardQuickActions">
            <div className="quickActionsHeading">
              <div>
                <span className="sectionKicker">
                  Brze akcije
                </span>
                <h2>Šta želiš da uradiš?</h2>
              </div>
            </div>

            <div className="quickActionGrid">
              <Link
                to="/create-event"
                className="quickActionCard"
              >
                <span>
                  <Icon name="plus" size={21} />
                </span>

                <div>
                  <strong>Novi događaj</strong>
                  <small>
                    Kreiraj jednodnevnu avanturu.
                  </small>
                </div>

                <Icon name="arrowRight" size={17} />
              </Link>

              <Link
                to="/create-package"
                className="quickActionCard"
              >
                <span>
                  <Icon name="package" size={21} />
                </span>

                <div>
                  <strong>Novi paket</strong>
                  <small>
                    Objavi turu ili višednevno iskustvo.
                  </small>
                </div>

                <Icon name="arrowRight" size={17} />
              </Link>

              <Link
                to="/host-bookings"
                className="quickActionCard"
              >
                <span>
                  <Icon name="booking" size={21} />
                </span>

                <div>
                  <strong>Rezervacije</strong>
                  <small>
                    Pregledaj i upravljaj zahtevima.
                  </small>
                </div>

                <Icon name="arrowRight" size={17} />
              </Link>

              {profile?.username && (
                <Link
                  to={`/h/${profile.username}`}
                  className="quickActionCard"
                >
                  <span>
                    <Icon name="eye" size={21} />
                  </span>

                  <div>
                    <strong>Javni profil</strong>
                    <small>
                      Proveri kako te vide korisnici.
                    </small>
                  </div>

                  <Icon name="arrowRight" size={17} />
                </Link>
              )}
            </div>
          </section>

          <section className="dashboardSection">
            <div className="dashboardSectionHeader">
              <div>
                <span className="sectionKicker">
                  Događaji
                </span>
                <h2>Moji događaji</h2>

                <p>
                  Upravljaj objavljenim događajima i pregledaj
                  interesovanje korisnika.
                </p>
              </div>

              <Link
                to="/create-event"
                className="sectionButton"
              >
                <Icon name="plus" size={16} />
                Novi događaj
              </Link>
            </div>

            {events.length === 0 ? (
              <EmptySection
                type="event"
                title="Još nemaš objavljene događaje."
                description="Kreiraj svoju prvu outdoor avanturu i počni da okupljaš zajednicu."
                buttonText="Kreiraj prvi događaj"
                buttonUrl="/create-event"
              />
            ) : (
              <div className="dashboardItemsGrid">
                {events.map((event) => (
                  <DashboardItemCard
                    key={event.id}
                    type="event"
                    item={event}
                    interestedCount={
                      eventCounts[event.id] || 0
                    }
                    deleting={
                      deletingItem ===
                      `event-${event.id}`
                    }
                    onDelete={deleteEvent}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="dashboardSection packagesDashboardSection">
            <div className="dashboardSectionHeader">
              <div>
                <span className="sectionKicker">
                  Paketi i ture
                </span>
                <h2>Moji paketi</h2>

                <p>
                  Organizuj višednevna iskustva, upravljaj
                  galerijom i prati interesovanje.
                </p>
              </div>

              <Link
                to="/create-package"
                className="sectionButton"
              >
                <Icon name="plus" size={16} />
                Novi paket
              </Link>
            </div>

            {packages.length === 0 ? (
              <EmptySection
                type="package"
                title="Još nemaš objavljene pakete."
                description="Kreiraj turu ili kompletno outdoor iskustvo sa smeštajem, aktivnostima i rasporedom."
                buttonText="Kreiraj prvi paket"
                buttonUrl="/create-package"
              />
            ) : (
              <div className="dashboardItemsGrid">
                {packages.map((item) => (
                  <DashboardItemCard
                    key={item.id}
                    type="package"
                    item={item}
                    interestedCount={
                      packageCounts[item.id] || 0
                    }
                    deleting={
                      deletingItem ===
                      `package-${item.id}`
                    }
                    onDelete={deletePackage}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}

function DashboardStyles() {
  return (
    <style>{`
      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        background: #f1f3ec;
      }

      button,
      input,
      textarea {
        font: inherit;
      }

      button,
      a {
        -webkit-tap-highlight-color: transparent;
      }

      .hostDashboardPage,
      .dashboardStatePage {
        min-height: 100vh;
        color: #17271f;
        font-family:
          Inter,
          ui-sans-serif,
          system-ui,
          -apple-system,
          BlinkMacSystemFont,
          "Segoe UI",
          sans-serif;
      }

      .hostDashboardPage {
        padding: 118px 24px 90px;
        background:
          radial-gradient(
            circle at 10% 0%,
            rgba(166, 203, 126, 0.17),
            transparent 24%
          ),
          radial-gradient(
            circle at 95% 20%,
            rgba(92, 132, 91, 0.1),
            transparent 26%
          ),
          #f1f3ec;
      }

      .hostDashboardPage a,
      .dashboardStatePage a {
        color: inherit;
        text-decoration: none;
      }

      .dashboardContainer {
        width: min(1240px, 100%);
        margin: 0 auto;
      }

      .dashboardHero {
        position: relative;
        isolation: isolate;
        min-height: 530px;
        padding: 33px;
        overflow: hidden;
        border-radius: 33px;
        color: white;
        box-shadow:
          0 28px 75px rgba(24, 58, 39, 0.18);
      }

      .dashboardHero::before {
        position: absolute;
        inset: 0;
        z-index: -2;
        content: "";
        background:
          linear-gradient(
            100deg,
            rgba(5, 20, 11, 0.97),
            rgba(14, 45, 27, 0.86) 55%,
            rgba(11, 33, 21, 0.7)
          ),
          url("https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1800&q=85")
          center / cover;
      }

      .heroDecoration {
        position: absolute;
        z-index: -1;
        border:
          1px solid rgba(255, 255, 255, 0.07);
        border-radius: 50%;
      }

      .heroDecorationOne {
        right: -180px;
        bottom: -230px;
        width: 530px;
        height: 530px;
        box-shadow:
          0 0 0 80px rgba(255, 255, 255, 0.02),
          0 0 0 160px rgba(255, 255, 255, 0.012);
      }

      .heroDecorationTwo {
        top: -120px;
        right: 24%;
        width: 230px;
        height: 230px;
      }

      .heroMain {
        display: grid;
        grid-template-columns:
          minmax(0, 1.15fr)
          minmax(330px, 0.65fr);
        align-items: end;
        gap: 45px;
        margin-top: 88px;
      }

      .heroKicker,
      .sectionKicker {
        display: block;
        color: #83a760;
        font-size: 9px;
        font-weight: 900;
        letter-spacing: 0.13em;
        text-transform: uppercase;
      }

      .heroKicker {
        color: #c9f28c;
      }

      .heroCopy h1 {
        max-width: 780px;
        margin: 15px 0 0;
        font-size:
          clamp(50px, 7vw, 91px);
        line-height: 0.92;
        letter-spacing: -0.075em;
      }

      .heroCopy p {
        max-width: 590px;
        margin: 23px 0 0;
        color:
          rgba(255, 255, 255, 0.61);
        font-size: 14px;
        line-height: 1.7;
      }

      .heroActions {
        display: grid;
        gap: 12px;
      }

      .heroPrimaryAction,
      .heroSecondaryAction {
        display: grid;
        grid-template-columns:
          auto minmax(0, 1fr) auto;
        align-items: center;
        gap: 13px;
        min-height: 84px;
        padding: 14px;
        border-radius: 19px;
        transition: 0.2s ease;
      }

      .heroPrimaryAction {
        background: #c9f28c;
        color: #183a27 !important;
        box-shadow:
          0 15px 35px rgba(3, 17, 8, 0.22);
      }

      .heroSecondaryAction {
        border:
          1px solid rgba(255, 255, 255, 0.16);
        background:
          rgba(255, 255, 255, 0.09);
        color: white !important;
        backdrop-filter: blur(12px);
      }

      .heroPrimaryAction:hover,
      .heroSecondaryAction:hover {
        transform: translateY(-3px);
      }

      .heroPrimaryAction > span,
      .heroSecondaryAction > span {
        display: grid;
        place-items: center;
        width: 48px;
        height: 48px;
        border-radius: 15px;
      }

      .heroPrimaryAction > span {
        background:
          rgba(24, 58, 39, 0.1);
      }

      .heroSecondaryAction > span {
        background:
          rgba(255, 255, 255, 0.09);
        color: #c9f28c;
      }

      .heroActions strong,
      .heroActions small {
        display: block;
      }

      .heroActions strong {
        font-size: 12px;
      }

      .heroActions small {
        margin-top: 4px;
        opacity: 0.62;
        font-size: 9px;
        line-height: 1.4;
      }

      .heroBottom {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
        margin-top: 48px;
        padding-top: 21px;
        border-top:
          1px solid rgba(255, 255, 255, 0.1);
      }

      .heroBottom > a {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color:
          rgba(255, 255, 255, 0.69);
        font-size: 10px;
        font-weight: 800;
        transition: 0.18s ease;
      }

      .heroBottom > a:hover {
        gap: 12px;
        color: white;
      }

      .dashboardMessage {
        display: grid;
        grid-template-columns:
          auto minmax(0, 1fr) auto;
        align-items: center;
        gap: 11px;
        margin-top: 20px;
        padding: 14px;
        border: 1px solid #efc6c1;
        border-radius: 16px;
        background: #fff0ee;
        color: #963e34;
      }

      .dashboardMessage > span {
        display: grid;
        place-items: center;
        width: 32px;
        height: 32px;
        border-radius: 10px;
        background: #f7d7d3;
      }

      .dashboardMessage p {
        margin: 0;
        font-size: 11px;
        line-height: 1.5;
      }

      .dashboardMessage button {
        display: grid;
        place-items: center;
        width: 32px;
        height: 32px;
        padding: 0;
        border: 0;
        border-radius: 9px;
        background: transparent;
        color: inherit;
        cursor: pointer;
      }

      .statsGrid {
        display: grid;
        grid-template-columns:
          repeat(4, minmax(0, 1fr));
        gap: 14px;
        margin-top: 22px;
      }

      .statCard {
        min-width: 0;
        padding: 20px;
        border: 1px solid #dce3d9;
        border-radius: 22px;
        background:
          rgba(255, 255, 255, 0.76);
        box-shadow:
          0 12px 34px rgba(34, 53, 41, 0.045);
      }

      .statCardTop {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 15px;
        margin-bottom: 22px;
      }

      .statIcon,
      .statTrend {
        display: grid;
        place-items: center;
        border-radius: 12px;
      }

      .statIcon {
        width: 43px;
        height: 43px;
        background: #e8f1dd;
        color: #58763e;
      }

      .statTrend {
        width: 29px;
        height: 29px;
        background: #f0f4eb;
        color: #87987b;
      }

      .statCard > strong {
        display: block;
        color: #20342a;
        font-size: 35px;
        line-height: 1;
        letter-spacing: -0.05em;
      }

      .statLabel {
        display: block;
        margin-top: 9px;
        color: #47584e;
        font-size: 11px;
        font-weight: 850;
      }

      .statCard > small {
        display: block;
        margin-top: 6px;
        color: #929b94;
        font-size: 9px;
        line-height: 1.5;
      }

      .dashboardQuickActions,
      .dashboardSection {
        margin-top: 34px;
      }

      .quickActionsHeading,
      .dashboardSectionHeader {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 20px;
        margin-bottom: 17px;
      }

      .quickActionsHeading h2,
      .dashboardSectionHeader h2 {
        margin: 7px 0 0;
        color: #20342a;
        font-size:
          clamp(29px, 4vw, 40px);
        line-height: 1;
        letter-spacing: -0.05em;
      }

      .dashboardSectionHeader p {
        max-width: 600px;
        margin: 11px 0 0;
        color: #7e8981;
        font-size: 11px;
        line-height: 1.6;
      }

      .quickActionGrid {
        display: grid;
        grid-template-columns:
          repeat(4, minmax(0, 1fr));
        gap: 13px;
      }

      .quickActionCard {
        display: grid;
        grid-template-columns:
          auto minmax(0, 1fr) auto;
        align-items: center;
        gap: 12px;
        min-height: 85px;
        padding: 14px;
        border: 1px solid #dce3d9;
        border-radius: 19px;
        background:
          rgba(255, 255, 255, 0.72);
        transition: 0.2s ease;
      }

      .quickActionCard:hover {
        border-color: #9caf91;
        background: white;
        transform: translateY(-3px);
        box-shadow:
          0 14px 32px rgba(35, 53, 42, 0.07);
      }

      .quickActionCard > span {
        display: grid;
        place-items: center;
        width: 45px;
        height: 45px;
        border-radius: 14px;
        background: #e8f1dd;
        color: #59763f;
      }

      .quickActionCard strong,
      .quickActionCard small {
        display: block;
      }

      .quickActionCard strong {
        color: #34483b;
        font-size: 11px;
      }

      .quickActionCard small {
        margin-top: 4px;
        color: #909992;
        font-size: 8px;
        line-height: 1.45;
      }

      .quickActionCard > svg {
        color: #8c978f;
      }

      .dashboardSection {
        padding: 27px;
        border: 1px solid #dce3d9;
        border-radius: 27px;
        background:
          rgba(255, 255, 255, 0.57);
        box-shadow:
          0 15px 43px rgba(32, 51, 39, 0.045);
      }

      .packagesDashboardSection {
        background:
          linear-gradient(
            145deg,
            rgba(238, 245, 231, 0.88),
            rgba(255, 255, 255, 0.66)
          );
      }

      .sectionButton {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        flex: 0 0 auto;
        min-height: 43px;
        padding: 0 15px;
        border-radius: 13px;
        background: #183a27;
        color: white !important;
        font-size: 10px;
        font-weight: 850;
        box-shadow:
          0 11px 25px rgba(24, 58, 39, 0.15);
        transition: 0.18s ease;
      }

      .sectionButton:hover {
        gap: 11px;
        background: #224c34;
        transform: translateY(-2px);
      }

      .dashboardItemsGrid {
        display: grid;
        grid-template-columns:
          repeat(3, minmax(0, 1fr));
        gap: 17px;
      }

      .dashboardItemCard {
        min-width: 0;
        overflow: hidden;
        border: 1px solid #dce2d9;
        border-radius: 22px;
        background: white;
        transition: 0.2s ease;
      }

      .dashboardItemCard:hover {
        transform: translateY(-4px);
        box-shadow:
          0 18px 42px rgba(32, 51, 39, 0.09);
      }

      .itemImageWrapper {
        position: relative;
        height: 200px;
        overflow: hidden;
      }

      .itemImage {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.5s ease;
      }

      .dashboardItemCard:hover
        .itemImage {
        transform: scale(1.04);
      }

      .itemImageOverlay {
        position: absolute;
        inset: 0;
        background:
          linear-gradient(
            180deg,
            rgba(4, 14, 8, 0.08),
            rgba(4, 14, 8, 0.57)
          );
      }

      .itemTypeBadge,
      .interestBadge {
        position: absolute;
        top: 13px;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-height: 30px;
        padding: 0 10px;
        border:
          1px solid rgba(255, 255, 255, 0.17);
        border-radius: 999px;
        background:
          rgba(5, 20, 11, 0.54);
        color: white;
        font-size: 9px;
        font-weight: 850;
        backdrop-filter: blur(11px);
      }

      .itemTypeBadge {
        left: 13px;
      }

      .interestBadge {
        right: 13px;
        color: #d8f6aa;
      }

      .itemBody {
        padding: 18px;
      }

      .itemKicker {
        color: #7a9958;
        font-size: 8px;
        font-weight: 900;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }

      .itemHeading h3 {
        margin: 7px 0 0;
        color: #23362b;
        font-size: 21px;
        line-height: 1.12;
        letter-spacing: -0.035em;
      }

      .itemMeta {
        display: grid;
        gap: 7px;
        margin-top: 14px;
      }

      .itemMeta > span {
        display: flex;
        align-items: center;
        gap: 7px;
        color: #7b877f;
        font-size: 9px;
        line-height: 1.4;
      }

      .itemMeta svg {
        flex: 0 0 auto;
        color: #789258;
      }

      .interestSummary {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-top: 15px;
        padding: 12px;
        border-radius: 14px;
        background: #f3f7ee;
      }

      .interestSummary > span {
        display: grid;
        place-items: center;
        width: 34px;
        height: 34px;
        border-radius: 11px;
        background: #e5efd9;
        color: #5d7b42;
      }

      .interestSummary strong,
      .interestSummary small {
        display: block;
      }

      .interestSummary strong {
        color: #354a3c;
        font-size: 14px;
      }

      .interestSummary small {
        margin-top: 2px;
        color: #879188;
        font-size: 8px;
      }

      .itemActions {
        display: grid;
        grid-template-columns:
          repeat(2, minmax(0, 1fr));
        gap: 8px;
        margin-top: 15px;
      }

      .itemAction,
      .deleteAction {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        min-height: 39px;
        padding: 0 9px;
        border-radius: 11px;
        cursor: pointer;
        font-size: 9px;
        font-weight: 800;
        transition: 0.17s ease;
      }

      .itemAction {
        border: 1px solid #dbe2d8;
        background: #f8faf6;
        color: #475b4e !important;
      }

      .itemAction:hover {
        border-color: #94aa88;
        background: white;
      }

      .deleteAction {
        border: 1px solid #efcfca;
        background: #fff2f0;
        color: #9a4439;
      }

      .deleteAction:hover:not(:disabled) {
        border-color: #df9d94;
        background: #ffe9e6;
      }

      .deleteAction:disabled {
        cursor: not-allowed;
        opacity: 0.65;
      }

      .smallLoader {
        width: 14px;
        height: 14px;
        border:
          2px solid rgba(154, 68, 57, 0.2);
        border-top-color: currentColor;
        border-radius: 50%;
        animation:
          dashboardSpin 0.75s linear infinite;
      }

      .emptySection {
        display: grid;
        place-items: center;
        padding: 55px 20px;
        border: 1px dashed #cfd8cc;
        border-radius: 21px;
        background:
          linear-gradient(
            145deg,
            rgba(241, 246, 235, 0.8),
            rgba(250, 251, 248, 0.8)
          );
        text-align: center;
      }

      .emptyIcon {
        display: grid;
        place-items: center;
        width: 61px;
        height: 61px;
        border-radius: 19px;
        background: #e6efd9;
        color: #607f45;
      }

      .emptySection h3 {
        margin: 17px 0 0;
        color: #34483b;
        font-size: 18px;
        letter-spacing: -0.025em;
      }

      .emptySection p {
        max-width: 510px;
        margin: 9px auto 0;
        color: #879189;
        font-size: 10px;
        line-height: 1.6;
      }

      .emptySection a {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        margin-top: 18px;
        padding: 12px 15px;
        border-radius: 12px;
        background: #183a27;
        color: white !important;
        font-size: 10px;
        font-weight: 850;
      }

      .dashboardStatePage {
        display: grid;
        place-items: center;
        padding: 118px 24px 24px;
        background:
          radial-gradient(
            circle at top left,
            rgba(166, 203, 126, 0.18),
            transparent 30%
          ),
          #f1f3ec;
      }

      .dashboardStateCard {
        display: grid;
        place-items: center;
        width: min(520px, 100%);
        padding: 50px 30px;
        border: 1px solid #dce3d9;
        border-radius: 28px;
        background:
          rgba(255, 255, 255, 0.8);
        text-align: center;
        box-shadow:
          0 20px 60px rgba(28, 48, 35, 0.08);
      }

      .dashboardLoader {
        width: 37px;
        height: 37px;
        border: 3px solid #dce5d7;
        border-top-color: #52783c;
        border-radius: 50%;
        animation:
          dashboardSpin 0.8s linear infinite;
      }

      @keyframes dashboardSpin {
        to {
          transform: rotate(360deg);
        }
      }

      .stateIcon {
        display: grid;
        place-items: center;
        width: 60px;
        height: 60px;
        border-radius: 19px;
        background: #e7f0dc;
        color: #5b7841;
      }

      .dashboardStateCard h1 {
        margin: 19px 0 0;
        color: #24372c;
        font-size: 29px;
        letter-spacing: -0.045em;
      }

      .dashboardStateCard p {
        max-width: 390px;
        margin: 10px auto 0;
        color: #7e8981;
        font-size: 11px;
        line-height: 1.6;
      }

      .stateLink {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        margin-top: 21px;
        padding: 12px 15px;
        border-radius: 13px;
        background: #183a27;
        color: white !important;
        font-size: 10px;
        font-weight: 850;
      }

      @media (max-width: 1050px) {
        .heroMain {
          grid-template-columns:
            minmax(0, 1fr) 330px;
        }

        .statsGrid,
        .quickActionGrid {
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
        }

        .dashboardItemsGrid {
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 760px) {
        .hostDashboardPage {
          padding: 84px 0 70px;
        }

        .dashboardStatePage {
          padding-top: 84px;
        }

        .dashboardHero {
          min-height: auto;
          padding: 24px;
          border-radius: 0 0 30px 30px;
        }

        .heroMain {
          grid-template-columns: 1fr;
          margin-top: 85px;
        }

        .heroCopy h1 {
          font-size:
            clamp(48px, 11vw, 72px);
        }

        .heroActions {
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
        }

        .heroPrimaryAction,
        .heroSecondaryAction {
          grid-template-columns:
            auto minmax(0, 1fr);
        }

        .heroPrimaryAction > svg,
        .heroSecondaryAction > svg {
          display: none;
        }

        .heroBottom {
          align-items: flex-start;
          flex-direction: column;
        }

        .statsGrid,
        .dashboardQuickActions,
        .dashboardSection,
        .dashboardMessage {
          margin-right: 18px;
          margin-left: 18px;
        }

        .dashboardSectionHeader {
          align-items: flex-start;
          flex-direction: column;
        }
      }

      @media (max-width: 590px) {
        .heroMain {
          margin-top: 70px;
        }

        .heroCopy h1 {
          font-size: 47px;
        }

        .heroActions,
        .statsGrid,
        .quickActionGrid,
        .dashboardItemsGrid {
          grid-template-columns: 1fr;
        }

        .heroPrimaryAction,
        .heroSecondaryAction {
          min-height: 76px;
        }

        .dashboardSection {
          padding: 19px;
          border-radius: 22px;
        }
      }

      @media (max-width: 420px) {
        .dashboardHero {
          padding: 20px 17px 24px;
        }

        .heroCopy h1 {
          font-size: 42px;
        }

        .heroCopy p {
          font-size: 12px;
        }

        .statsGrid,
        .dashboardQuickActions,
        .dashboardSection,
        .dashboardMessage {
          margin-right: 13px;
          margin-left: 13px;
        }

        .quickActionsHeading h2,
        .dashboardSectionHeader h2 {
          font-size: 31px;
        }

        .itemActions {
          grid-template-columns: 1fr;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        *,
        *::before,
        *::after {
          animation: none !important;
          scroll-behavior: auto !important;
          transition: none !important;
        }
      }
    `}</style>
  );
}
