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

const EMPTY_SUMMARY = {
  total_packages: 0,
  total_events: 0,
  total_bookings: 0,
  pending_bookings: 0,
  approved_bookings: 0,
  completed_bookings: 0,
  gross_revenue: 0,
  total_expenses: 0,
  average_rating: 0,
};

const BOOKING_STATUS = {
  pending: {
    label: "Na čekanju",
    className: "pending",
  },
  approved: {
    label: "Odobreno",
    className: "approved",
  },
  rejected: {
    label: "Odbijeno",
    className: "rejected",
  },
  cancelled: {
    label: "Otkazano",
    className: "cancelled",
  },
  completed: {
    label: "Završeno",
    className: "completed",
  },
};

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
    wallet: (
      <>
        <path d="M4 6h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h12" />
        <path d="M16 12h5v4h-5a2 2 0 0 1 0-4Z" />
      </>
    ),
    money: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M16 8.5c-.7-.9-1.8-1.5-3.3-1.5-2 0-3.2 1-3.2 2.4 0 1.6 1.4 2.1 3.5 2.6 2.2.5 3.5 1.2 3.5 2.8 0 1.5-1.3 2.7-3.6 2.7-1.7 0-3.1-.6-4-1.8" />
        <path d="M12 5.5v13" />
      </>
    ),
    star: (
      <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z" />
    ),
    check: <path d="m5 12 4 4L19 6" />,
    x: <path d="M18 6 6 18M6 6l12 12" />,
    refresh: (
      <>
        <path d="M20 7v5h-5M4 17v-5h5" />
        <path d="M18.4 9A7 7 0 0 0 6 6.5L4 9M5.6 15A7 7 0 0 0 18 17.5l2-2.5" />
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

function formatDate(value, includeTime = false) {
  if (!value) return "Datum nije dodat";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("sr-Latn-RS", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(includeTime
      ? {
          hour: "2-digit",
          minute: "2-digit",
        }
      : {}),
  }).format(date);
}

function formatMoney(value, currency = "EUR") {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("sr-Latn-RS", {
    style: "currency",
    currency: currency || "EUR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function numberValue(value) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function DashboardLoading() {
  return (
    <>
      <DashboardStyles />

      <main className="dashboardStatePage">
        <div className="dashboardStateCard">
          <span className="dashboardLoader" />
          <h1>Učitavanje kontrolnog centra</h1>
          <p>
            Pripremamo rezervacije, finansije, događaje i pakete.
          </p>
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

          <h1>Samo organizatori imaju pristup.</h1>

          <p>
            Ovaj kontrolni centar namenjen je host profilima koji
            upravljaju događajima, turama i rezervacijama.
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

function StatCard({
  icon,
  label,
  value,
  description,
  accent = "green",
}) {
  return (
    <article className={`statCard ${accent}`}>
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

function StatusBadge({ status }) {
  const config = BOOKING_STATUS[status] || {
    label: status || "Nepoznato",
    className: "unknown",
  };

  return (
    <span className={`statusBadge ${config.className}`}>
      {config.label}
    </span>
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
    item.image_url ||
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

function BookingRow({ booking }) {
  const packageData = booking.package || booking.packages || null;
  const title =
    packageData?.title ||
    booking.package_title ||
    "Rezervacija paketa";

  const amount =
    booking.total_amount ??
    (packageData?.price
      ? numberValue(packageData.price) *
        Math.max(numberValue(booking.guests), 1)
      : 0);

  const currency =
    booking.currency ||
    packageData?.currency ||
    "EUR";

  return (
    <article className="bookingRow">
      <div className="bookingIdentity">
        <span className="bookingIcon">
          <Icon name="booking" size={18} />
        </span>

        <div>
          <strong>{title}</strong>
          <small>
            {formatDate(booking.created_at, true)}
            {" · "}
            {Math.max(numberValue(booking.guests), 1)}
            {Math.max(numberValue(booking.guests), 1) === 1
              ? " gost"
              : " gosta"}
          </small>
        </div>
      </div>

      <div className="bookingAmount">
        <strong>{formatMoney(amount, currency)}</strong>
        <small>
          {booking.payment_status === "paid"
            ? "Plaćeno"
            : "Nije plaćeno"}
        </small>
      </div>

      <StatusBadge status={booking.status} />
    </article>
  );
}

export default function HostDashboard() {
  const { profile, isHost, loading } = useAuth();

  const [events, setEvents] = useState([]);
  const [packages, setPackages] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [eventCounts, setEventCounts] = useState({});
  const [packageCounts, setPackageCounts] = useState({});
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [deletingItem, setDeletingItem] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = useCallback(
    async ({ silent = false } = {}) => {
      if (!profile?.id || !isHost) {
        setEvents([]);
        setPackages([]);
        setBookings([]);
        setSummary(EMPTY_SUMMARY);
        setEventCounts({});
        setPackageCounts({});
        setDashboardLoading(false);
        return;
      }

      if (silent) {
        setRefreshing(true);
      } else {
        setDashboardLoading(true);
      }

      setMessage("");

      try {
        const [
          eventsResult,
          packagesResult,
          bookingsResult,
          summaryResult,
        ] = await Promise.all([
          supabase
            .from("events")
            .select(
              "id, title, cover_url, location, country, start_date, created_at, is_active"
            )
            .eq("host_id", profile.id)
            .order("created_at", {
              ascending: false,
            }),

          supabase
            .from("packages")
            .select(
              "id, title, cover_url, image_url, location, country, start_date, created_at, price, currency, is_active"
            )
            .eq("host_id", profile.id)
            .order("created_at", {
              ascending: false,
            }),

          supabase
            .from("bookings")
            .select(`
              id,
              status,
              payment_status,
              guests,
              total_amount,
              currency,
              created_at,
              package:package_id (
                id,
                title,
                price,
                currency
              )
            `)
            .eq("host_id", profile.id)
            .order("created_at", {
              ascending: false,
            })
            .limit(6),

          supabase
            .from("host_dashboard_summary")
            .select("*")
            .eq("host_id", profile.id)
            .maybeSingle(),
        ]);

        if (eventsResult.error) {
          throw eventsResult.error;
        }

        if (packagesResult.error) {
          throw packagesResult.error;
        }

        if (bookingsResult.error) {
          throw bookingsResult.error;
        }

        const loadedEvents = eventsResult.data || [];
        const loadedPackages = packagesResult.data || [];

        setEvents(loadedEvents);
        setPackages(loadedPackages);
        setBookings(bookingsResult.data || []);

        if (summaryResult.error) {
          console.error(
            "Summary view error:",
            summaryResult.error
          );
        }

        setSummary({
          ...EMPTY_SUMMARY,
          ...(summaryResult.data || {}),
        });

        const eventIds = loadedEvents.map((item) => item.id);
        const packageIds = loadedPackages.map((item) => item.id);

        const [
          eventInterestResult,
          packageInterestResult,
        ] = await Promise.all([
          eventIds.length > 0
            ? supabase
                .from("event_interested")
                .select("event_id")
                .in("event_id", eventIds)
            : Promise.resolve({
                data: [],
                error: null,
              }),

          packageIds.length > 0
            ? supabase
                .from("package_interested")
                .select("package_id")
                .in("package_id", packageIds)
            : Promise.resolve({
                data: [],
                error: null,
              }),
        ]);

        if (eventInterestResult.error) {
          console.error(
            "Event interest error:",
            eventInterestResult.error
          );
        }

        if (packageInterestResult.error) {
          console.error(
            "Package interest error:",
            packageInterestResult.error
          );
        }

        const nextEventCounts = (
          eventInterestResult.data || []
        ).reduce((accumulator, row) => {
          accumulator[row.event_id] =
            numberValue(accumulator[row.event_id]) + 1;

          return accumulator;
        }, {});

        const nextPackageCounts = (
          packageInterestResult.data || []
        ).reduce((accumulator, row) => {
          accumulator[row.package_id] =
            numberValue(accumulator[row.package_id]) + 1;

          return accumulator;
        }, {});

        setEventCounts(nextEventCounts);
        setPackageCounts(nextPackageCounts);
      } catch (error) {
        console.error(
          "Greška pri učitavanju dashboarda:",
          error
        );

        setMessage(
          error?.message ||
            "Kontrolni centar trenutno nije moguće učitati."
        );
      } finally {
        setDashboardLoading(false);
        setRefreshing(false);
      }
    },
    [isHost, profile?.id]
  );

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

      setSummary((current) => ({
        ...current,
        total_events: Math.max(
          numberValue(current.total_events) - 1,
          0
        ),
      }));
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

      setSummary((current) => ({
        ...current,
        total_packages: Math.max(
          numberValue(current.total_packages) - 1,
          0
        ),
      }));
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
        (sum, count) => sum + numberValue(count),
        0
      ),
    [eventCounts]
  );

  const totalPackageInterested = useMemo(
    () =>
      Object.values(packageCounts).reduce(
        (sum, count) => sum + numberValue(count),
        0
      ),
    [packageCounts]
  );

  const totalInterest =
    totalEventInterested + totalPackageInterested;

  const grossRevenue = numberValue(summary.gross_revenue);
  const totalExpenses = numberValue(summary.total_expenses);
  const netRevenue = grossRevenue - totalExpenses;
  const pendingBookings = numberValue(
    summary.pending_bookings
  );
  const totalBookings = numberValue(summary.total_bookings);
  const averageRating = numberValue(summary.average_rating);

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

            <div className="heroTopbar">
              <span className="heroTopbarBadge">
                <Icon name="dashboard" size={15} />
                Creator OS
              </span>

              <button
                type="button"
                className="refreshButton"
                onClick={() =>
                  loadDashboard({ silent: true })
                }
                disabled={refreshing}
              >
                {refreshing ? (
                  <span className="smallLoader light" />
                ) : (
                  <Icon name="refresh" size={16} />
                )}

                {refreshing ? "Osvežavanje" : "Osveži"}
              </button>
            </div>

            <div className="heroMain">
              <div className="heroCopy">
                <span className="heroKicker">
                  Kontrolni centar organizatora
                </span>

                <h1>
                  Dobrodošao,
                  <br />
                  {hostName}.
                </h1>

                <p>
                  Rezervacije, prihod, interesovanje i sav sadržaj
                  sada su na jednom mestu. Bez tabela sa strane i
                  bez ručnog sabiranja.
                </p>

                <div className="heroPulse">
                  <span className="heroPulseDot" />

                  <div>
                    <strong>
                      {pendingBookings > 0
                        ? `${pendingBookings} novih zahteva čeka odgovor`
                        : "Sve rezervacije su obrađene"}
                    </strong>

                    <small>
                      {totalBookings} ukupno evidentiranih rezervacija
                    </small>
                  </div>
                </div>
              </div>

              <div className="heroActions">
                <Link
                  to="/host-bookings"
                  className="heroPrimaryAction"
                >
                  <span>
                    <Icon name="booking" size={20} />
                  </span>

                  <div>
                    <strong>Otvori rezervacije</strong>
                    <small>
                      Odobri, odbij ili završi zahteve.
                    </small>
                  </div>

                  <Icon name="arrowRight" size={18} />
                </Link>

                <div className="heroActionPair">
                  <Link
                    to="/create-event"
                    className="heroMiniAction"
                  >
                    <Icon name="calendar" size={18} />
                    Novi događaj
                  </Link>

                  <Link
                    to="/create-package"
                    className="heroMiniAction"
                  >
                    <Icon name="package" size={18} />
                    Novi paket
                  </Link>
                </div>
              </div>
            </div>

            <div className="heroBottom">
              <div className="heroBottomMetric">
                <span>Bruto prihod</span>
                <strong>
                  {formatMoney(grossRevenue, "EUR")}
                </strong>
              </div>

              <div className="heroBottomMetric">
                <span>Prosečna ocena</span>
                <strong>
                  {averageRating.toFixed(1)} / 5
                </strong>
              </div>

              <div className="heroBottomLinks">
                {profile?.username && (
                  <Link to={`/h/${profile.username}`}>
                    <Icon name="eye" size={17} />
                    Javni profil
                  </Link>
                )}

                <Link to="/host-bookings">
                  Sve rezervacije
                  <Icon name="arrowRight" size={16} />
                </Link>
              </div>
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
              icon="money"
              label="Bruto prihod"
              value={formatMoney(grossRevenue, "EUR")}
              description="Odobrene i završene rezervacije."
              accent="dark"
            />

            <StatCard
              icon="booking"
              label="Na čekanju"
              value={pendingBookings}
              description="Zahtevi koji čekaju tvoju odluku."
              accent="amber"
            />

            <StatCard
              icon="star"
              label="Prosečna ocena"
              value={averageRating.toFixed(1)}
              description="Ocene svih objavljenih paketa."
              accent="gold"
            />

            <StatCard
              icon="heart"
              label="Interesovanje"
              value={totalInterest}
              description="Sačuvani događaji i paketi."
              accent="green"
            />
          </section>

          <section className="operationsGrid">
            <article className="financePanel">
              <div className="panelHeader">
                <div>
                  <span className="sectionKicker">
                    Finansije
                  </span>
                  <h2>Poslovni rezultat</h2>
                </div>

                <span className="panelIcon">
                  <Icon name="wallet" size={21} />
                </span>
              </div>

              <div className="financeHero">
                <span>Procena neto rezultata</span>
                <strong>
                  {formatMoney(netRevenue, "EUR")}
                </strong>
                <small>
                  Bruto prihod umanjen za evidentirane troškove.
                </small>
              </div>

              <div className="financeBreakdown">
                <div>
                  <span>Prihod</span>
                  <strong>
                    {formatMoney(grossRevenue, "EUR")}
                  </strong>
                </div>

                <div>
                  <span>Troškovi</span>
                  <strong>
                    {formatMoney(totalExpenses, "EUR")}
                  </strong>
                </div>

                <div>
                  <span>Završene ture</span>
                  <strong>
                    {numberValue(summary.completed_bookings)}
                  </strong>
                </div>
              </div>
            </article>

            <article className="bookingPanel">
              <div className="panelHeader">
                <div>
                  <span className="sectionKicker">
                    Poslednje aktivnosti
                  </span>
                  <h2>Nove rezervacije</h2>
                </div>

                <Link to="/host-bookings" className="panelLink">
                  Sve rezervacije
                  <Icon name="arrowRight" size={15} />
                </Link>
              </div>

              <div className="bookingList">
                {bookings.length === 0 ? (
                  <div className="compactEmpty">
                    <span>
                      <Icon name="booking" size={24} />
                    </span>

                    <div>
                      <strong>Još nema rezervacija.</strong>
                      <small>
                        Novi zahtevi će se pojaviti ovde.
                      </small>
                    </div>
                  </div>
                ) : (
                  bookings.slice(0, 4).map((booking) => (
                    <BookingRow
                      key={booking.id}
                      booking={booking}
                    />
                  ))
                )}
              </div>
            </article>
          </section>

          <section className="dashboardQuickActions">
            <div className="quickActionsHeading">
              <div>
                <span className="sectionKicker">
                  Brze akcije
                </span>
                <h2>Najvažnije, bez lutanja.</h2>
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
                    Objavi jednodnevnu avanturu.
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
                    Kreiraj turu ili višednevno iskustvo.
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
                    Upravljaj svim zahtevima gostiju.
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

          <section className="inventoryHeader">
            <div>
              <span className="sectionKicker">
                Ponuda
              </span>
              <h2>Sadržaj koji prodaješ.</h2>
              <p>
                Uredi, proveri interesovanje ili otvori javni prikaz
                svake ponude.
              </p>
            </div>

            <div className="inventorySummary">
              <span>
                {events.length + packages.length}
              </span>
              <small>ukupno aktivnih stavki</small>
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
                  Jednodnevna okupljanja, aktivnosti i avanture.
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
                description="Kreiraj prvu outdoor avanturu i počni da okupljaš zajednicu."
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
                  Višednevna iskustva, ture i kompletne outdoor ponude.
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
                description="Kreiraj turu ili kompletno iskustvo sa aktivnostima, rasporedom i cenom."
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
      *{box-sizing:border-box}
      body{margin:0;background:#edf1e9}
      button,input,textarea{font:inherit}
      button,a{-webkit-tap-highlight-color:transparent}
      .hostDashboardPage,.dashboardStatePage{min-height:100vh;color:#17271f;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
      .hostDashboardPage{padding:128px 24px 96px;background:radial-gradient(circle at 8% 0%,rgba(173,211,132,.2),transparent 25%),radial-gradient(circle at 96% 18%,rgba(67,111,77,.11),transparent 27%),#edf1e9}
      .hostDashboardPage a,.dashboardStatePage a{color:inherit;text-decoration:none}
      .dashboardContainer{width:min(1280px,100%);margin:0 auto}
      .dashboardHero{position:relative;isolation:isolate;min-height:610px;padding:32px;overflow:hidden;border-radius:38px;color:#fff;box-shadow:0 34px 90px rgba(19,49,31,.21)}
      .dashboardHero:before{position:absolute;inset:0;z-index:-2;content:"";background:linear-gradient(105deg,rgba(3,18,9,.98),rgba(15,50,29,.9) 53%,rgba(18,41,28,.68)),url("https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1800&q=88") center/cover}
      .dashboardHero:after{position:absolute;inset:0;z-index:-1;content:"";background:radial-gradient(circle at 74% 35%,rgba(201,242,140,.12),transparent 25%)}
      .heroDecoration{position:absolute;z-index:-1;border:1px solid rgba(255,255,255,.07);border-radius:50%}
      .heroDecorationOne{right:-190px;bottom:-245px;width:560px;height:560px;box-shadow:0 0 0 85px rgba(255,255,255,.018),0 0 0 170px rgba(255,255,255,.01)}
      .heroDecorationTwo{top:-120px;right:25%;width:240px;height:240px}
      .heroTopbar{display:flex;align-items:center;justify-content:space-between;gap:16px}
      .heroTopbarBadge,.refreshButton{display:inline-flex;align-items:center;gap:8px;min-height:38px;padding:0 13px;border:1px solid rgba(255,255,255,.14);border-radius:999px;background:rgba(255,255,255,.07);color:rgba(255,255,255,.78);font-size:9px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;backdrop-filter:blur(12px)}
      .refreshButton{cursor:pointer;letter-spacing:0;text-transform:none;transition:.18s}
      .refreshButton:hover:not(:disabled){background:rgba(255,255,255,.13);color:#fff}
      .refreshButton:disabled{cursor:wait;opacity:.7}
      .heroMain{display:grid;grid-template-columns:minmax(0,1.18fr) minmax(340px,.62fr);align-items:end;gap:56px;margin-top:96px}
      .heroKicker,.sectionKicker{display:block;color:#7f9f5d;font-size:9px;font-weight:900;letter-spacing:.14em;text-transform:uppercase}
      .heroKicker{color:#c9f28c}
      .heroCopy h1{max-width:820px;margin:16px 0 0;font-size:clamp(58px,7.4vw,98px);line-height:.89;letter-spacing:-.078em}
      .heroCopy p{max-width:620px;margin:24px 0 0;color:rgba(255,255,255,.64);font-size:14px;line-height:1.75}
      .heroPulse{display:flex;align-items:center;gap:12px;width:fit-content;margin-top:28px;padding:12px 15px;border:1px solid rgba(255,255,255,.11);border-radius:16px;background:rgba(255,255,255,.06);backdrop-filter:blur(11px)}
      .heroPulseDot{width:9px;height:9px;border-radius:50%;background:#c9f28c;box-shadow:0 0 0 6px rgba(201,242,140,.11)}
      .heroPulse strong,.heroPulse small{display:block}
      .heroPulse strong{font-size:10px}
      .heroPulse small{margin-top:3px;color:rgba(255,255,255,.48);font-size:8px}
      .heroActions{display:grid;gap:12px}
      .heroPrimaryAction{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:14px;min-height:92px;padding:16px;border-radius:21px;background:#c9f28c;color:#183a27!important;box-shadow:0 18px 42px rgba(3,17,8,.25);transition:.2s}
      .heroPrimaryAction:hover{transform:translateY(-3px)}
      .heroPrimaryAction>span{display:grid;place-items:center;width:52px;height:52px;border-radius:16px;background:rgba(24,58,39,.11)}
      .heroPrimaryAction strong,.heroPrimaryAction small{display:block}
      .heroPrimaryAction strong{font-size:12px}
      .heroPrimaryAction small{margin-top:4px;opacity:.65;font-size:9px}
      .heroActionPair{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
      .heroMiniAction{display:flex;align-items:center;justify-content:center;gap:8px;min-height:55px;padding:0 12px;border:1px solid rgba(255,255,255,.14);border-radius:16px;background:rgba(255,255,255,.08);color:#fff!important;font-size:9px;font-weight:850;backdrop-filter:blur(12px);transition:.18s}
      .heroMiniAction:hover{background:rgba(255,255,255,.14);transform:translateY(-2px)}
      .heroBottom{display:grid;grid-template-columns:auto auto minmax(0,1fr);align-items:end;gap:42px;margin-top:58px;padding-top:22px;border-top:1px solid rgba(255,255,255,.1)}
      .heroBottomMetric span,.heroBottomMetric strong{display:block}
      .heroBottomMetric span{color:rgba(255,255,255,.45);font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:.08em}
      .heroBottomMetric strong{margin-top:5px;font-size:18px}
      .heroBottomLinks{display:flex;justify-content:flex-end;gap:18px}
      .heroBottomLinks a{display:inline-flex;align-items:center;gap:7px;color:rgba(255,255,255,.65);font-size:9px;font-weight:800;transition:.18s}
      .heroBottomLinks a:hover{gap:10px;color:#fff}
      .dashboardMessage{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:11px;margin-top:20px;padding:14px;border:1px solid #efc6c1;border-radius:16px;background:#fff0ee;color:#963e34}
      .dashboardMessage>span{display:grid;place-items:center;width:32px;height:32px;border-radius:10px;background:#f7d7d3}
      .dashboardMessage p{margin:0;font-size:11px;line-height:1.5}
      .dashboardMessage button{display:grid;place-items:center;width:32px;height:32px;padding:0;border:0;border-radius:9px;background:transparent;color:inherit;cursor:pointer}
      .statsGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-top:22px}
      .statCard{min-width:0;padding:21px;border:1px solid #d9e1d6;border-radius:23px;background:rgba(255,255,255,.8);box-shadow:0 14px 36px rgba(34,53,41,.05)}
      .statCard.dark{background:#173625;color:#fff;border-color:#173625}
      .statCardTop{display:flex;align-items:center;justify-content:space-between;gap:15px;margin-bottom:24px}
      .statIcon,.statTrend{display:grid;place-items:center;border-radius:13px}
      .statIcon{width:45px;height:45px;background:#e8f1dd;color:#58763e}
      .statCard.dark .statIcon{background:rgba(255,255,255,.1);color:#c9f28c}
      .statCard.amber .statIcon{background:#fff0dc;color:#aa6a22}
      .statCard.gold .statIcon{background:#fff6d8;color:#a67c14}
      .statTrend{width:29px;height:29px;background:#f0f4eb;color:#87987b}
      .statCard.dark .statTrend{background:rgba(255,255,255,.08);color:rgba(255,255,255,.5)}
      .statCard>strong{display:block;color:#20342a;font-size:clamp(25px,3vw,35px);line-height:1;letter-spacing:-.05em;overflow-wrap:anywhere}
      .statCard.dark>strong{color:#fff}
      .statLabel{display:block;margin-top:10px;color:#47584e;font-size:11px;font-weight:850}
      .statCard.dark .statLabel{color:rgba(255,255,255,.8)}
      .statCard>small{display:block;margin-top:6px;color:#929b94;font-size:9px;line-height:1.5}
      .statCard.dark>small{color:rgba(255,255,255,.42)}
      .operationsGrid{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:16px;margin-top:22px}
      .financePanel,.bookingPanel{padding:25px;border:1px solid #d9e1d6;border-radius:27px;background:rgba(255,255,255,.78);box-shadow:0 15px 40px rgba(31,51,38,.05)}
      .panelHeader{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}
      .panelHeader h2{margin:7px 0 0;font-size:28px;line-height:1;letter-spacing:-.05em}
      .panelIcon{display:grid;place-items:center;width:47px;height:47px;border-radius:15px;background:#e7f0dc;color:#5c7943}
      .panelLink{display:inline-flex;align-items:center;gap:6px;color:#5b6d61!important;font-size:9px;font-weight:850}
      .financeHero{margin-top:27px;padding:23px;border-radius:21px;background:linear-gradient(135deg,#183a27,#274f38);color:#fff}
      .financeHero span,.financeHero strong,.financeHero small{display:block}
      .financeHero span{color:rgba(255,255,255,.48);font-size:8px;font-weight:850;text-transform:uppercase;letter-spacing:.08em}
      .financeHero strong{margin-top:9px;font-size:38px;line-height:1;letter-spacing:-.05em}
      .financeHero small{margin-top:8px;color:rgba(255,255,255,.46);font-size:8px;line-height:1.5}
      .financeBreakdown{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin-top:12px}
      .financeBreakdown div{padding:13px;border:1px solid #e0e6dd;border-radius:15px;background:#f8faf6}
      .financeBreakdown span,.financeBreakdown strong{display:block}
      .financeBreakdown span{color:#8c968f;font-size:8px}
      .financeBreakdown strong{margin-top:5px;color:#34483b;font-size:12px}
      .bookingList{display:grid;gap:9px;margin-top:20px}
      .bookingRow{display:grid;grid-template-columns:minmax(0,1fr) auto auto;align-items:center;gap:13px;padding:12px;border:1px solid #e0e6dd;border-radius:16px;background:#f8faf6}
      .bookingIdentity{display:flex;align-items:center;gap:11px;min-width:0}
      .bookingIcon{display:grid;place-items:center;flex:0 0 auto;width:38px;height:38px;border-radius:12px;background:#e6efd9;color:#5c7843}
      .bookingIdentity div{min-width:0}
      .bookingIdentity strong,.bookingIdentity small,.bookingAmount strong,.bookingAmount small{display:block}
      .bookingIdentity strong{overflow:hidden;color:#34483b;font-size:10px;text-overflow:ellipsis;white-space:nowrap}
      .bookingIdentity small{margin-top:4px;color:#929b94;font-size:7px}
      .bookingAmount{text-align:right}
      .bookingAmount strong{font-size:10px}
      .bookingAmount small{margin-top:3px;color:#929b94;font-size:7px}
      .statusBadge{display:inline-flex;align-items:center;justify-content:center;min-height:28px;padding:0 9px;border-radius:999px;font-size:7px;font-weight:900;text-transform:uppercase;letter-spacing:.04em}
      .statusBadge.pending{background:#fff0dc;color:#9c611f}
      .statusBadge.approved{background:#e4f2dc;color:#4e7835}
      .statusBadge.rejected,.statusBadge.cancelled{background:#ffe9e6;color:#9e453a}
      .statusBadge.completed{background:#e4edf8;color:#3d638d}
      .statusBadge.unknown{background:#ecefeb;color:#6c776f}
      .compactEmpty{display:flex;align-items:center;gap:12px;padding:22px;border:1px dashed #cdd7ca;border-radius:17px;background:#f8faf6}
      .compactEmpty>span{display:grid;place-items:center;width:46px;height:46px;border-radius:15px;background:#e7f0dc;color:#5b7841}
      .compactEmpty strong,.compactEmpty small{display:block}
      .compactEmpty strong{font-size:10px}
      .compactEmpty small{margin-top:4px;color:#8c968f;font-size:8px}
      .dashboardQuickActions,.dashboardSection,.inventoryHeader{margin-top:34px}
      .quickActionsHeading,.dashboardSectionHeader,.inventoryHeader{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin-bottom:17px}
      .quickActionsHeading h2,.dashboardSectionHeader h2,.inventoryHeader h2{margin:7px 0 0;color:#20342a;font-size:clamp(29px,4vw,41px);line-height:1;letter-spacing:-.055em}
      .dashboardSectionHeader p,.inventoryHeader p{max-width:600px;margin:11px 0 0;color:#7e8981;font-size:11px;line-height:1.6}
      .inventorySummary{display:flex;align-items:center;gap:10px;padding:12px 15px;border:1px solid #d9e1d6;border-radius:16px;background:rgba(255,255,255,.7)}
      .inventorySummary span{font-size:24px;font-weight:900}
      .inventorySummary small{max-width:90px;color:#89938c;font-size:8px;line-height:1.35}
      .quickActionGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:13px}
      .quickActionCard{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:12px;min-height:87px;padding:14px;border:1px solid #d9e1d6;border-radius:20px;background:rgba(255,255,255,.75);transition:.2s}
      .quickActionCard:hover{border-color:#9caf91;background:#fff;transform:translateY(-3px);box-shadow:0 14px 32px rgba(35,53,42,.07)}
      .quickActionCard>span{display:grid;place-items:center;width:46px;height:46px;border-radius:14px;background:#e8f1dd;color:#59763f}
      .quickActionCard strong,.quickActionCard small{display:block}
      .quickActionCard strong{color:#34483b;font-size:11px}
      .quickActionCard small{margin-top:4px;color:#909992;font-size:8px;line-height:1.45}
      .quickActionCard>svg{color:#8c978f}
      .dashboardSection{padding:27px;border:1px solid #d9e1d6;border-radius:28px;background:rgba(255,255,255,.6);box-shadow:0 15px 43px rgba(32,51,39,.045)}
      .packagesDashboardSection{background:linear-gradient(145deg,rgba(238,245,231,.9),rgba(255,255,255,.68))}
      .sectionButton{display:inline-flex;align-items:center;justify-content:center;gap:7px;flex:0 0 auto;min-height:43px;padding:0 15px;border-radius:13px;background:#183a27;color:#fff!important;font-size:10px;font-weight:850;box-shadow:0 11px 25px rgba(24,58,39,.15);transition:.18s}
      .sectionButton:hover{gap:11px;background:#224c34;transform:translateY(-2px)}
      .dashboardItemsGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:17px}
      .dashboardItemCard{min-width:0;overflow:hidden;border:1px solid #dce2d9;border-radius:23px;background:#fff;transition:.2s}
      .dashboardItemCard:hover{transform:translateY(-4px);box-shadow:0 18px 42px rgba(32,51,39,.09)}
      .itemImageWrapper{position:relative;height:205px;overflow:hidden}
      .itemImage{display:block;width:100%;height:100%;object-fit:cover;transition:transform .5s}
      .dashboardItemCard:hover .itemImage{transform:scale(1.04)}
      .itemImageOverlay{position:absolute;inset:0;background:linear-gradient(180deg,rgba(4,14,8,.08),rgba(4,14,8,.58))}
      .itemTypeBadge,.interestBadge{position:absolute;top:13px;display:inline-flex;align-items:center;gap:6px;min-height:30px;padding:0 10px;border:1px solid rgba(255,255,255,.17);border-radius:999px;background:rgba(5,20,11,.55);color:#fff;font-size:9px;font-weight:850;backdrop-filter:blur(11px)}
      .itemTypeBadge{left:13px}
      .interestBadge{right:13px;color:#d8f6aa}
      .itemBody{padding:18px}
      .itemKicker{color:#7a9958;font-size:8px;font-weight:900;letter-spacing:.1em;text-transform:uppercase}
      .itemHeading h3{margin:7px 0 0;color:#23362b;font-size:21px;line-height:1.12;letter-spacing:-.035em}
      .itemMeta{display:grid;gap:7px;margin-top:14px}
      .itemMeta>span{display:flex;align-items:center;gap:7px;color:#7b877f;font-size:9px;line-height:1.4}
      .itemMeta svg{flex:0 0 auto;color:#789258}
      .interestSummary{display:flex;align-items:center;gap:10px;margin-top:15px;padding:12px;border-radius:14px;background:#f3f7ee}
      .interestSummary>span{display:grid;place-items:center;width:34px;height:34px;border-radius:11px;background:#e5efd9;color:#5d7b42}
      .interestSummary strong,.interestSummary small{display:block}
      .interestSummary strong{color:#354a3c;font-size:14px}
      .interestSummary small{margin-top:2px;color:#879188;font-size:8px}
      .itemActions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:15px}
      .itemAction,.deleteAction{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:39px;padding:0 9px;border-radius:11px;cursor:pointer;font-size:9px;font-weight:800;transition:.17s}
      .itemAction{border:1px solid #dbe2d8;background:#f8faf6;color:#475b4e!important}
      .itemAction:hover{border-color:#94aa88;background:#fff}
      .deleteAction{border:1px solid #efcfca;background:#fff2f0;color:#9a4439}
      .deleteAction:hover:not(:disabled){border-color:#df9d94;background:#ffe9e6}
      .deleteAction:disabled{cursor:not-allowed;opacity:.65}
      .smallLoader{width:14px;height:14px;border:2px solid rgba(154,68,57,.2);border-top-color:currentColor;border-radius:50%;animation:dashboardSpin .75s linear infinite}
      .smallLoader.light{border-color:rgba(255,255,255,.22);border-top-color:#fff}
      .emptySection{display:grid;place-items:center;padding:55px 20px;border:1px dashed #cfd8cc;border-radius:21px;background:linear-gradient(145deg,rgba(241,246,235,.8),rgba(250,251,248,.8));text-align:center}
      .emptyIcon{display:grid;place-items:center;width:61px;height:61px;border-radius:19px;background:#e6efd9;color:#607f45}
      .emptySection h3{margin:17px 0 0;color:#34483b;font-size:18px;letter-spacing:-.025em}
      .emptySection p{max-width:510px;margin:9px auto 0;color:#879189;font-size:10px;line-height:1.6}
      .emptySection a{display:inline-flex;align-items:center;gap:7px;margin-top:18px;padding:12px 15px;border-radius:12px;background:#183a27;color:#fff!important;font-size:10px;font-weight:850}
      .dashboardStatePage{display:grid;place-items:center;padding:118px 24px 24px;background:radial-gradient(circle at top left,rgba(166,203,126,.18),transparent 30%),#edf1e9}
      .dashboardStateCard{display:grid;place-items:center;width:min(520px,100%);padding:50px 30px;border:1px solid #dce3d9;border-radius:28px;background:rgba(255,255,255,.82);text-align:center;box-shadow:0 20px 60px rgba(28,48,35,.08)}
      .dashboardLoader{width:37px;height:37px;border:3px solid #dce5d7;border-top-color:#52783c;border-radius:50%;animation:dashboardSpin .8s linear infinite}
      @keyframes dashboardSpin{to{transform:rotate(360deg)}}
      .stateIcon{display:grid;place-items:center;width:60px;height:60px;border-radius:19px;background:#e7f0dc;color:#5b7841}
      .dashboardStateCard h1{margin:19px 0 0;color:#24372c;font-size:29px;letter-spacing:-.045em}
      .dashboardStateCard p{max-width:390px;margin:10px auto 0;color:#7e8981;font-size:11px;line-height:1.6}
      .stateLink{display:inline-flex;align-items:center;gap:7px;margin-top:21px;padding:12px 15px;border-radius:13px;background:#183a27;color:#fff!important;font-size:10px;font-weight:850}
      @media(max-width:1080px){
        .heroMain{grid-template-columns:minmax(0,1fr) 340px}
        .statsGrid,.quickActionGrid{grid-template-columns:repeat(2,minmax(0,1fr))}
        .operationsGrid{grid-template-columns:1fr}
        .dashboardItemsGrid{grid-template-columns:repeat(2,minmax(0,1fr))}
      }
      @media(max-width:760px){
        .hostDashboardPage{padding:92px 0 72px}
        .dashboardStatePage{padding-top:92px}
        .dashboardHero{min-height:auto;padding:24px;border-radius:0 0 32px 32px}
        .heroMain{grid-template-columns:1fr;margin-top:78px}
        .heroCopy h1{font-size:clamp(49px,11vw,72px)}
        .heroBottom{grid-template-columns:repeat(2,minmax(0,1fr))}
        .heroBottomLinks{grid-column:1/-1;justify-content:flex-start}
        .statsGrid,.operationsGrid,.dashboardQuickActions,.inventoryHeader,.dashboardSection,.dashboardMessage{margin-right:18px;margin-left:18px}
        .dashboardSectionHeader,.inventoryHeader{align-items:flex-start;flex-direction:column}
        .inventorySummary{width:100%;justify-content:center}
      }
      @media(max-width:590px){
        .heroTopbarBadge{display:none}
        .heroMain{margin-top:62px}
        .heroCopy h1{font-size:46px}
        .heroActionPair,.statsGrid,.quickActionGrid,.dashboardItemsGrid{grid-template-columns:1fr}
        .heroBottom{gap:20px}
        .financeBreakdown{grid-template-columns:1fr}
        .bookingRow{grid-template-columns:minmax(0,1fr) auto}
        .bookingAmount{display:none}
        .dashboardSection{padding:19px;border-radius:22px}
      }
      @media(max-width:430px){
        .dashboardHero{padding:20px 17px 25px}
        .heroCopy h1{font-size:41px}
        .heroCopy p{font-size:12px}
        .heroPulse{width:100%}
        .heroBottom{grid-template-columns:1fr}
        .heroBottomLinks{grid-column:auto;flex-direction:column}
        .statsGrid,.operationsGrid,.dashboardQuickActions,.inventoryHeader,.dashboardSection,.dashboardMessage{margin-right:13px;margin-left:13px}
        .quickActionsHeading h2,.dashboardSectionHeader h2,.inventoryHeader h2{font-size:31px}
        .itemActions{grid-template-columns:1fr}
        .financeHero strong{font-size:31px}
        .bookingRow{grid-template-columns:1fr}
        .statusBadge{justify-self:start}
      }
      @media(prefers-reduced-motion:reduce){*,*:before,*:after{animation:none!important;scroll-behavior:auto!important;transition:none!important}}
    `}</style>
  );
}
