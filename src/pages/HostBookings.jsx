import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&auto=format&fit=crop";

const FALLBACK_AVATAR =
  "https://api.dicebear.com/8.x/initials/svg?seed=User";

function Icon({ name, size = 20, strokeWidth = 2 }) {
  const icons = {
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </>
    ),
    mapPin: (
      <>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    users: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20v-2a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v2" />
        <path d="M16 4.5a3 3 0 0 1 0 6M17 13a5 5 0 0 1 4 5v2" />
      </>
    ),
    package: (
      <>
        <path d="m12 3 8 4-8 4-8-4 8-4Z" />
        <path d="m4 7 8 4 8-4M4 12l8 4 8-4M4 17l8 4 8-4" />
      </>
    ),
    arrowRight: (
      <>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </>
    ),
    shield: (
      <>
        <path d="M12 3 5 6v5c0 4.6 2.9 8.4 7 10 4.1-1.6 7-5.4 7-10V6l-7-3Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    alert: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5M12 16h.01" />
      </>
    ),
    refresh: (
      <>
        <path d="M20 7v5h-5M4 17v-5h5" />
        <path d="M18.4 9A7 7 0 0 0 6 6.5L4 9M5.6 15A7 7 0 0 0 18 17.5l2-2.5" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    x: (
      <>
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    inbox: (
      <>
        <path d="M4 4h16l2 11v5H2v-5Z" />
        <path d="M2 15h6l2 3h4l2-3h6" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </>
    ),
    phone: (
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.7 2.6a2 2 0 0 1-.5 2.1L8 9.7a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.8.4 1.7.6 2.6.7a2 2 0 0 1 2 2.3Z" />
    ),
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </>
    ),
    money: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v10M15 9.5c-.6-1-1.7-1.5-3-1.5-1.7 0-3 1-3 2.3 0 1.5 1.3 2 3.2 2.4 1.8.4 2.8 1 2.8 2.3 0 1.4-1.2 2.5-3.2 2.5-1.5 0-2.8-.6-3.6-1.6" />
      </>
    ),
    bolt: (
      <>
        <path d="m13 2-8 12h7l-1 8 8-12h-7l1-8Z" />
      </>
    ),
    filter: (
      <>
        <path d="M4 6h16" />
        <path d="M7 12h10" />
        <path d="M10 18h4" />
      </>
    ),
    chevron: <path d="m9 18 6-6-6-6" />,
    eye: (
      <>
        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
        <circle cx="12" cy="12" r="2.5" />
      </>
    ),
    sparkle: (
      <>
        <path d="m12 3 1.1 3.3L16 8l-2.9 1.7L12 13l-1.1-3.3L8 8l2.9-1.7L12 3Z" />
        <path d="m18 14 .7 2.3L21 17l-2.3.7L18 20l-.7-2.3L15 17l2.3-.7L18 14Z" />
      </>
    ),
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
      {icons[name]}
    </svg>
  );
}

function formatDate(value) {
  if (!value) return "Datum nije dostupan";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Datum nije dostupan";
  }

  return new Intl.DateTimeFormat("sr-Latn-RS", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatCurrency(value, currency = "EUR") {
  const amount = Number(value || 0);

  try {
    return new Intl.NumberFormat("sr-Latn-RS", {
      style: "currency",
      currency: currency || "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency || "EUR"} ${amount.toFixed(2)}`;
  }
}

function statusMeta(status) {
  const normalized = String(status || "pending").toLowerCase();

  if (normalized === "approved") {
    return {
      label: "Odobreno",
      tone: "success",
      icon: "check",
    };
  }

  if (normalized === "rejected") {
    return {
      label: "Odbijeno",
      tone: "danger",
      icon: "x",
    };
  }

  if (normalized === "completed") {
    return {
      label: "Završeno",
      tone: "completed",
      icon: "check",
    };
  }

  if (normalized === "cancelled") {
    return {
      label: "Otkazano",
      tone: "muted",
      icon: "x",
    };
  }

  return {
    label: "Čeka odgovor",
    tone: "pending",
    icon: "clock",
  };
}

function getBookingValue(booking) {
  const totalAmount = Number(booking?.total_amount);

  if (Number.isFinite(totalAmount) && totalAmount > 0) {
    return totalAmount;
  }

  return (
    Number(booking?.packages?.price || 0) *
    Number(booking?.guests || 1)
  );
}

function LoadingState() {
  return (
    <>
      <HostBookingsStyles />

      <main className="hostBookingsStatePage">
        <div className="hostBookingsStateCard">
          <span className="hostBookingsLoader" />
          <h1>Učitavanje rezervacija</h1>
          <p>Pripremamo tvoj host kontrolni centar.</p>
        </div>
      </main>
    </>
  );
}

function ConfirmModal({
  action,
  booking,
  onCancel,
  onConfirm,
  loading,
}) {
  if (!action || !booking) return null;

  const bookingName =
    [booking.first_name, booking.last_name]
      .filter(Boolean)
      .join(" ") ||
    booking.profiles?.full_name ||
    booking.profiles?.username ||
    "Gost";

  const packageTitle =
    booking.packages?.title || "ovaj paket";

  const isReject = action === "rejected";

  return (
    <div className="bookingModalBackdrop" role="presentation">
      <div
        className="bookingModal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-modal-title"
      >
        <span
          className={`bookingModalIcon ${
            isReject ? "danger" : "success"
          }`}
        >
          <Icon
            name={isReject ? "x" : "check"}
            size={24}
          />
        </span>

        <span className="bookingModalKicker">
          Potvrda odluke
        </span>

        <h2 id="booking-modal-title">
          {isReject
            ? "Odbiti rezervaciju?"
            : "Označiti rezervaciju kao završenu?"}
        </h2>

        <p>
          {isReject
            ? `Odbićeš rezervaciju gosta ${bookingName} za “${packageTitle}”.`
            : `Rezervaciju gosta ${bookingName} za “${packageTitle}” označićeš kao završenu.`}
        </p>

        <div className="bookingModalActions">
          <button
            type="button"
            className="secondary"
            onClick={onCancel}
            disabled={loading}
          >
            Odustani
          </button>

          <button
            type="button"
            className={isReject ? "danger" : "success"}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading
              ? "Čuvanje..."
              : isReject
              ? "Da, odbij"
              : "Da, završi"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HostBookings() {
  const { profile, isHost, loading } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [sortOrder, setSortOrder] = useState("newest");
  const [confirmState, setConfirmState] = useState({
    action: null,
    booking: null,
  });

  const loadBookings = useCallback(
    async ({ silent = false } = {}) => {
      if (!profile?.id || !isHost) {
        setBookings([]);
        setPageLoading(false);
        return;
      }

      if (!silent) {
        setPageLoading(true);
      }

      setMessage("");

      try {
        const { data, error } = await supabase
          .from("bookings")
          .select(`
            id,
            host_id,
            package_id,
            user_id,
            guests,
            note,
            first_name,
            last_name,
            email,
            phone,
            total_amount,
            currency,
            payment_status,
            status,
            created_at,
            updated_at,
            approved_at,
            rejected_at,
            completed_at,
            packages:package_id (
              id,
              title,
              cover_url,
              location,
              country,
              price,
              currency,
              start_date,
              end_date
            ),
            profiles:user_id (
              id,
              username,
              full_name,
              avatar_url,
              role,
              phone
            )
          `)
          .eq("host_id", profile.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        setBookings(data || []);
      } catch (error) {
        console.error(
          "Greška pri učitavanju rezervacija:",
          error
        );
        setBookings([]);
        setMessage(
          error?.message ||
            "Rezervacije trenutno nije moguće učitati."
        );
      } finally {
        if (!silent) {
          setPageLoading(false);
        }
      }
    },
    [isHost, profile?.id]
  );

  useEffect(() => {
    if (loading) return;

    void loadBookings();
  }, [loading, loadBookings]);

  useEffect(() => {
    if (!profile?.id || !isHost) return undefined;

    const channel = supabase
      .channel(`host-bookings-${profile.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: `host_id=eq.${profile.id}`,
        },
        () => {
          void loadBookings({ silent: true });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [isHost, loadBookings, profile?.id]);

  useEffect(() => {
    if (!successMessage) return undefined;

    const timer = window.setTimeout(() => {
      setSuccessMessage("");
    }, 3500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [successMessage]);

  const updateBookingStatus = useCallback(
    async (booking, status) => {
      if (!profile?.id || !booking?.id) return;

      const now = new Date().toISOString();

      const payload = {
        status,
        updated_at: now,
        approved_at:
          status === "approved"
            ? now
            : booking.approved_at,
        rejected_at:
          status === "rejected"
            ? now
            : booking.rejected_at,
        completed_at:
          status === "completed"
            ? now
            : booking.completed_at,
      };

      try {
        setUpdatingId(booking.id);
        setMessage("");
        setSuccessMessage("");

        const { error } = await supabase
          .from("bookings")
          .update(payload)
          .eq("id", booking.id)
          .eq("host_id", profile.id);

        if (error) throw error;

        const notificationTitle =
          status === "approved"
            ? "Rezervacija je odobrena"
            : status === "completed"
            ? "Rezervacija je završena"
            : "Rezervacija je odbijena";

        const notificationMessage =
          status === "approved"
            ? `Tvoja rezervacija za ${
                booking.packages?.title || "paket"
              } je odobrena.`
            : status === "completed"
            ? `Rezervacija za ${
                booking.packages?.title || "paket"
              } je označena kao završena.`
            : `Tvoja rezervacija za ${
                booking.packages?.title || "paket"
              } je odbijena.`;

        const { error: notificationError } =
          await supabase.from("notifications").insert({
            user_id: booking.user_id,
            from_user_id: profile.id,
            package_id: booking.package_id,
            type: `booking_${status}`,
            title: notificationTitle,
            message: notificationMessage,
            is_read: false,
          });

        if (notificationError) {
          console.error(
            "Obaveštenje nije poslato:",
            notificationError
          );
        }

        setBookings((previous) =>
          previous.map((item) =>
            item.id === booking.id
              ? {
                  ...item,
                  ...payload,
                }
              : item
          )
        );

        setSuccessMessage(
          status === "approved"
            ? "Rezervacija je odobrena i korisnik je obavešten."
            : status === "completed"
            ? "Rezervacija je označena kao završena."
            : "Rezervacija je odbijena i korisnik je obavešten."
        );
      } catch (error) {
        console.error(
          "Greška pri promeni statusa:",
          error
        );

        setMessage(
          error?.message ||
            "Status rezervacije nije moguće promeniti."
        );
      } finally {
        setUpdatingId(null);
        setConfirmState({
          action: null,
          booking: null,
        });
      }
    },
    [profile?.id]
  );

  const counts = useMemo(() => {
    return bookings.reduce(
      (result, booking) => {
        const status = String(
          booking.status || "pending"
        ).toLowerCase();

        if (status === "approved") {
          result.approved += 1;
        } else if (status === "rejected") {
          result.rejected += 1;
        } else if (status === "completed") {
          result.completed += 1;
        } else if (status === "cancelled") {
          result.cancelled += 1;
        } else {
          result.pending += 1;
        }

        return result;
      },
      {
        pending: 0,
        approved: 0,
        rejected: 0,
        completed: 0,
        cancelled: 0,
      }
    );
  }, [bookings]);

  const approvedValue = useMemo(
    () =>
      bookings.reduce((sum, booking) => {
        if (
          String(booking.status || "").toLowerCase() !==
          "approved"
        ) {
          return sum;
        }

        return sum + getBookingValue(booking);
      }, 0),
    [bookings]
  );

  const pendingValue = useMemo(
    () =>
      bookings.reduce((sum, booking) => {
        const status = String(
          booking.status || "pending"
        ).toLowerCase();

        if (
          status === "approved" ||
          status === "rejected" ||
          status === "completed" ||
          status === "cancelled"
        ) {
          return sum;
        }

        return sum + getBookingValue(booking);
      }, 0),
    [bookings]
  );

  const approvedGuests = useMemo(
    () =>
      bookings.reduce((sum, booking) => {
        if (
          String(booking.status || "").toLowerCase() !==
          "approved"
        ) {
          return sum;
        }

        return sum + Number(booking.guests || 1);
      }, 0),
    [bookings]
  );

  const filteredBookings = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    const rows = bookings.filter((booking) => {
      const status = String(
        booking.status || "pending"
      ).toLowerCase();

      const normalizedStatus =
        ["approved", "rejected", "completed", "cancelled"].includes(
          status
        )
          ? status
          : "pending";

      if (
        statusFilter !== "all" &&
        normalizedStatus !== statusFilter
      ) {
        return false;
      }

      if (!query) return true;

      const pack = booking.packages;
      const user = booking.profiles;

      const fullName = [
        booking.first_name,
        booking.last_name,
      ]
        .filter(Boolean)
        .join(" ");

      return [
        booking.id,
        fullName,
        booking.email,
        booking.phone,
        user?.full_name,
        user?.username,
        pack?.title,
        pack?.location,
        pack?.country,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(query)
        );
    });

    return [...rows].sort((a, b) => {
      if (sortOrder === "oldest") {
        return (
          new Date(a.created_at).getTime() -
          new Date(b.created_at).getTime()
        );
      }

      if (sortOrder === "guests") {
        return (
          Number(b.guests || 1) -
          Number(a.guests || 1)
        );
      }

      if (sortOrder === "value") {
        return getBookingValue(b) - getBookingValue(a);
      }

      return (
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
      );
    });
  }, [
    bookings,
    searchTerm,
    sortOrder,
    statusFilter,
  ]);

  const tabs = useMemo(
    () => [
      {
        value: "pending",
        label: "Čeka odgovor",
        count: counts.pending,
      },
      {
        value: "all",
        label: "Sve",
        count: bookings.length,
      },
      {
        value: "approved",
        label: "Odobrene",
        count: counts.approved,
      },
      {
        value: "completed",
        label: "Završene",
        count: counts.completed,
      },
      {
        value: "rejected",
        label: "Odbijene",
        count: counts.rejected,
      },
      {
        value: "cancelled",
        label: "Otkazane",
        count: counts.cancelled,
      },
    ],
    [bookings.length, counts]
  );

  if (loading || pageLoading) {
    return <LoadingState />;
  }

  if (!isHost) {
    return (
      <>
        <HostBookingsStyles />

        <main className="hostBookingsStatePage">
          <div className="hostBookingsStateCard">
            <span className="hostBookingsStateIcon">
              <Icon name="shield" size={28} />
            </span>

            <h1>Pristup je namenjen hostovima</h1>

            <p>
              Samo host profili mogu da upravljaju zahtevima za
              rezervaciju.
            </p>

            <Link
              to="/"
              className="hostBookingsStatePrimary"
            >
              Nazad na početnu
              <Icon name="arrowRight" size={16} />
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <HostBookingsStyles />

      <main className="hostBookingsPage">
        {successMessage && (
          <div className="hostBookingsSuccessToast">
            <span>
              <Icon name="check" size={17} />
            </span>
            <p>{successMessage}</p>
          </div>
        )}

        <section className="hostBookingsHero">
          <div className="hostBookingsHeroGrid" />

          <div className="hostBookingsHeroCopy">
            <span className="hostBookingsEyebrow">
              <span />
              Host kontrolni centar
            </span>

            <h1>
              Rezervacije
              <br />
              bez čekanja.
            </h1>

            <p>
              Najvažniji zahtevi su uvek prvi. Odgovori gostima,
              prati vrednost rezervacija i vodi iskustvo od
              zahteva do završene avanture.
            </p>

            {counts.pending > 0 ? (
              <div className="hostBookingsHeroUrgent">
                <span>
                  <Icon name="bolt" size={19} />
                </span>

                <div>
                  <strong>
                    {counts.pending}{" "}
                    {counts.pending === 1
                      ? "zahtev čeka"
                      : "zahteva čekaju"}{" "}
                    tvoj odgovor
                  </strong>
                  <small>
                    Potencijalna vrednost:{" "}
                    {formatCurrency(pendingValue, "EUR")}
                  </small>
                </div>

                <button
                  type="button"
                  onClick={() => setStatusFilter("pending")}
                >
                  Pregledaj
                  <Icon name="arrowRight" size={15} />
                </button>
              </div>
            ) : (
              <div className="hostBookingsHeroClear">
                <Icon name="check" size={18} />
                Sve rezervacije su obrađene.
              </div>
            )}
          </div>

          <div className="hostBookingsHeroStats">
            <article className="urgent">
              <span>
                <Icon name="clock" size={18} />
              </span>
              <div>
                <strong>{counts.pending}</strong>
                <small>čeka odgovor</small>
              </div>
            </article>

            <article>
              <span>
                <Icon name="check" size={18} />
              </span>
              <div>
                <strong>{counts.approved}</strong>
                <small>odobreno</small>
              </div>
            </article>

            <article>
              <span>
                <Icon name="users" size={18} />
              </span>
              <div>
                <strong>{approvedGuests}</strong>
                <small>odobrenih gostiju</small>
              </div>
            </article>

            <article>
              <span>
                <Icon name="money" size={18} />
              </span>
              <div>
                <strong>
                  {formatCurrency(approvedValue, "EUR")}
                </strong>
                <small>vrednost odobrenih</small>
              </div>
            </article>
          </div>
        </section>

        <section className="hostBookingsContent">
          <header className="hostBookingsToolbar">
            <div>
              <span className="hostBookingsSectionLabel">
                Operativni pregled
              </span>

              <h2>
                Ono što traži akciju — prvo.
              </h2>

              <p>
                Rezervacije se osvežavaju u realnom vremenu.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadBookings()}
            >
              <Icon name="refresh" size={16} />
              Osveži
            </button>
          </header>

          <section className="hostBookingsTabs">
            {tabs.map((tab) => (
              <button
                type="button"
                key={tab.value}
                className={
                  statusFilter === tab.value ? "active" : ""
                }
                onClick={() => setStatusFilter(tab.value)}
              >
                <span>{tab.label}</span>
                <strong>{tab.count}</strong>
              </button>
            ))}
          </section>

          <section className="hostBookingsControls">
            <label className="hostBookingsSearch">
              <Icon name="search" size={17} />

              <input
                type="search"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
                placeholder="Ime gosta, telefon, email, paket ili ID..."
              />

              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  aria-label="Obriši pretragu"
                >
                  <Icon name="x" size={14} />
                </button>
              )}
            </label>

            <div className="hostBookingsSort">
              <Icon name="filter" size={16} />

              <select
                value={sortOrder}
                onChange={(event) =>
                  setSortOrder(event.target.value)
                }
                aria-label="Sortiraj rezervacije"
              >
                <option value="newest">Najnovije prvo</option>
                <option value="oldest">Najstarije prvo</option>
                <option value="guests">Najviše gostiju</option>
                <option value="value">Najveća vrednost</option>
              </select>
            </div>

            <div className="hostBookingsValue">
              <span>
                <Icon name="money" size={17} />
              </span>

              <div>
                <small>Odobrena vrednost</small>
                <strong>
                  {formatCurrency(approvedValue, "EUR")}
                </strong>
              </div>
            </div>
          </section>

          {message && (
            <div className="hostBookingsError" role="alert">
              <span>
                <Icon name="alert" size={18} />
              </span>

              <p>{message}</p>

              <button
                type="button"
                onClick={() => void loadBookings()}
              >
                Pokušaj ponovo
              </button>
            </div>
          )}

          {filteredBookings.length === 0 ? (
            <section className="hostBookingsEmpty">
              <span>
                <Icon name="inbox" size={31} />
              </span>

              <h2>
                {statusFilter === "pending"
                  ? "Nema zahteva koji čekaju odgovor."
                  : "Nema rezervacija za ovaj prikaz."}
              </h2>

              <p>
                {statusFilter === "pending"
                  ? "Odlično — trenutno nema gostiju koji čekaju tvoju odluku."
                  : "Promeni filter ili pretragu i pokušaj ponovo."}
              </p>

              {statusFilter !== "all" ? (
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter("all");
                    setSearchTerm("");
                  }}
                >
                  Prikaži sve rezervacije
                  <Icon name="arrowRight" size={16} />
                </button>
              ) : (
                <Link to="/dashboard">
                  Nazad na dashboard
                  <Icon name="arrowRight" size={16} />
                </Link>
              )}
            </section>
          ) : (
            <section className="hostBookingsList">
              {filteredBookings.map((booking) => {
                const pack = booking.packages;
                const user = booking.profiles;
                const meta = statusMeta(booking.status);

                const userUrl =
                  user?.role === "host"
                    ? `/h/${user.username}`
                    : `/u/${user?.username}`;

                const isUpdating =
                  updatingId === booking.id;

                const bookingName =
                  [
                    booking.first_name,
                    booking.last_name,
                  ]
                    .filter(Boolean)
                    .join(" ") ||
                  user?.full_name ||
                  user?.username ||
                  "Gost";

                const bookingPhone =
                  booking.phone || user?.phone || "";

                const totalAmount =
                  getBookingValue(booking);

                const currency =
                  booking.currency ||
                  pack?.currency ||
                  "EUR";

                const currentStatus = String(
                  booking.status || "pending"
                ).toLowerCase();

                const isPending =
                  ![
                    "approved",
                    "rejected",
                    "completed",
                    "cancelled",
                  ].includes(currentStatus);

                return (
                  <article
                    key={booking.id}
                    className={`hostBookingCard ${
                      isPending ? "priority" : ""
                    }`}
                  >
                    <div className="hostBookingImageWrap">
                      <img
                        src={pack?.cover_url || FALLBACK_COVER}
                        alt={pack?.title || "Paket"}
                      />

                      <div className="hostBookingImageOverlay" />

                      <span
                        className={`hostBookingStatus ${meta.tone}`}
                      >
                        <Icon name={meta.icon} size={14} />
                        {meta.label}
                      </span>

                      {isPending && (
                        <span className="hostBookingPriorityTag">
                          <Icon name="bolt" size={13} />
                          Potrebna akcija
                        </span>
                      )}

                      <div className="hostBookingImageBottom">
                        <span>
                          <Icon name="calendar" size={14} />
                          {pack?.start_date
                            ? formatDate(pack.start_date)
                            : "Termin paketa"}
                        </span>

                        <span>
                          <Icon name="users" size={14} />
                          {booking.guests || 1}{" "}
                          {Number(booking.guests || 1) === 1
                            ? "gost"
                            : "gostiju"}
                        </span>
                      </div>
                    </div>

                    <div className="hostBookingBody">
                      <div className="hostBookingTop">
                        <div>
                          <span className="hostBookingKicker">
                            Rezervacija #
                            {String(booking.id).slice(0, 8)}
                          </span>

                          <h2>
                            {pack?.title || "Paket je obrisan"}
                          </h2>

                          <div className="hostBookingCreated">
                            <Icon name="clock" size={13} />
                            Zahtev poslat{" "}
                            {formatDate(booking.created_at)}
                          </div>
                        </div>

                        <div className="hostBookingValueStrong">
                          <span>Vrednost</span>
                          <strong>
                            {formatCurrency(
                              totalAmount,
                              currency
                            )}
                          </strong>
                        </div>
                      </div>

                      <div className="hostBookingGuestPanel">
                        <div className="hostBookingGuestIdentity">
                          <img
                            src={
                              user?.avatar_url ||
                              FALLBACK_AVATAR
                            }
                            alt={bookingName}
                          />

                          <div>
                            <span>Gost</span>
                            <strong>{bookingName}</strong>
                            <small>
                              {user?.username
                                ? `@${user.username}`
                                : "MeetOutdoors korisnik"}
                            </small>
                          </div>
                        </div>

                        <div className="hostBookingGuestFacts">
                          <article>
                            <Icon name="users" size={16} />
                            <span>
                              {booking.guests || 1}{" "}
                              {Number(
                                booking.guests || 1
                              ) === 1
                                ? "osoba"
                                : "osobe"}
                            </span>
                          </article>

                          <article>
                            <Icon name="mapPin" size={16} />
                            <span>
                              {[
                                pack?.location,
                                pack?.country,
                              ]
                                .filter(Boolean)
                                .join(", ") ||
                                "Lokacija nije navedena"}
                            </span>
                          </article>
                        </div>
                      </div>

                      <div className="hostBookingContact">
                        <div>
                          <span>Kontakt</span>
                          <strong>
                            Javi se gostu ako treba dodatna potvrda.
                          </strong>
                        </div>

                        <div className="hostBookingContactLinks">
                          {bookingPhone && (
                            <a href={`tel:${bookingPhone}`}>
                              <Icon name="phone" size={15} />
                              {bookingPhone}
                            </a>
                          )}

                          {booking.email && (
                            <a href={`mailto:${booking.email}`}>
                              <Icon name="mail" size={15} />
                              {booking.email}
                            </a>
                          )}
                        </div>
                      </div>

                      {booking.note && (
                        <div className="hostBookingNote">
                          <span>Napomena gosta</span>
                          <p>{booking.note}</p>
                        </div>
                      )}

                      {(booking.approved_at ||
                        booking.rejected_at ||
                        booking.completed_at) && (
                        <div className="hostBookingHistory">
                          {booking.approved_at && (
                            <span className="approved">
                              <Icon name="check" size={14} />
                              Odobreno{" "}
                              {formatDate(
                                booking.approved_at
                              )}
                            </span>
                          )}

                          {booking.rejected_at && (
                            <span className="rejected">
                              <Icon name="x" size={14} />
                              Odbijeno{" "}
                              {formatDate(
                                booking.rejected_at
                              )}
                            </span>
                          )}

                          {booking.completed_at && (
                            <span className="completed">
                              <Icon name="check" size={14} />
                              Završeno{" "}
                              {formatDate(
                                booking.completed_at
                              )}
                            </span>
                          )}
                        </div>
                      )}

                      <div
                        className={`hostBookingFooter ${
                          isPending ? "stickyActions" : ""
                        }`}
                      >
                        <div className="hostBookingSecondaryActions">
                          {user?.username && (
                            <Link to={userUrl}>
                              <Icon name="eye" size={15} />
                              Profil gosta
                            </Link>
                          )}

                          {pack && (
                            <Link
                              to={`/package/${pack.id}`}
                            >
                              <Icon name="package" size={15} />
                              Otvori paket
                            </Link>
                          )}
                        </div>

                        <div className="hostBookingActions">
                          {isPending && (
                            <>
                              <button
                                type="button"
                                className="approve"
                                disabled={isUpdating}
                                onClick={() =>
                                  updateBookingStatus(
                                    booking,
                                    "approved"
                                  )
                                }
                              >
                                <Icon
                                  name="check"
                                  size={17}
                                />
                                {isUpdating
                                  ? "Čuvanje..."
                                  : "Odobri rezervaciju"}
                              </button>

                              <button
                                type="button"
                                className="reject"
                                disabled={isUpdating}
                                onClick={() =>
                                  setConfirmState({
                                    action: "rejected",
                                    booking,
                                  })
                                }
                              >
                                <Icon name="x" size={16} />
                                Odbij
                              </button>
                            </>
                          )}

                          {currentStatus ===
                            "approved" && (
                            <button
                              type="button"
                              className="complete"
                              disabled={isUpdating}
                              onClick={() =>
                                setConfirmState({
                                  action: "completed",
                                  booking,
                                })
                              }
                            >
                              <Icon
                                name="check"
                                size={16}
                              />
                              Označi kao završeno
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>
          )}

          <section className="hostBookingsSummary">
            <div>
              <span className="hostBookingsSectionLabel">
                Host kontrolni centar
              </span>

              <h2>
                Brz odgovor gradi poverenje.
              </h2>

              <p>
                Novi zahtevi se pojavljuju automatski. Prioritet je
                da gost što pre dobije jasan odgovor, bez čekanja i
                dodatnog proveravanja stranice.
              </p>
            </div>

            <Link to="/dashboard">
              Otvori dashboard
              <Icon name="arrowRight" size={16} />
            </Link>
          </section>
        </section>

        <ConfirmModal
          action={confirmState.action}
          booking={confirmState.booking}
          loading={
            updatingId === confirmState.booking?.id
          }
          onCancel={() =>
            setConfirmState({
              action: null,
              booking: null,
            })
          }
          onConfirm={() => {
            if (
              confirmState.booking &&
              confirmState.action
            ) {
              void updateBookingStatus(
                confirmState.booking,
                confirmState.action
              );
            }
          }}
        />
      </main>
    </>
  );
}

function HostBookingsStyles() {
  return (
    <style>{`
      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        background: #e9eee5;
      }

      button,
      input,
      select {
        font: inherit;
      }

      button,
      a {
        -webkit-tap-highlight-color: transparent;
      }

      .hostBookingsPage,
      .hostBookingsStatePage {
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

      .hostBookingsPage {
        position: relative;
        padding: 118px 28px 72px;
        background:
          radial-gradient(
            circle at 7% 0%,
            rgba(177, 211, 139, 0.2),
            transparent 27%
          ),
          radial-gradient(
            circle at 96% 31%,
            rgba(59, 113, 73, 0.11),
            transparent 26%
          ),
          #e9eee5;
      }

      .hostBookingsPage a {
        color: inherit;
        text-decoration: none;
      }

      .hostBookingsSuccessToast {
        position: fixed;
        top: 96px;
        right: 24px;
        z-index: 5000;
        display: flex;
        align-items: center;
        gap: 10px;
        max-width: min(430px, calc(100vw - 32px));
        padding: 12px 14px;
        border: 1px solid rgba(142, 199, 109, 0.34);
        border-radius: 16px;
        background: rgba(17, 48, 29, 0.94);
        color: white;
        box-shadow: 0 20px 55px rgba(17, 44, 27, 0.25);
        backdrop-filter: blur(18px);
      }

      .hostBookingsSuccessToast > span {
        display: grid;
        place-items: center;
        flex: 0 0 auto;
        width: 34px;
        height: 34px;
        border-radius: 11px;
        background: #baff9e;
        color: #173b27;
      }

      .hostBookingsSuccessToast p {
        margin: 0;
        font-size: 10px;
        line-height: 1.5;
      }

      .hostBookingsHero {
        position: relative;
        isolation: isolate;
        width: min(1240px, 100%);
        min-height: 650px;
        margin: 0 auto;
        padding: 40px;
        overflow: hidden;
        border-radius: 38px;
        background:
          radial-gradient(
            circle at 84% 12%,
            rgba(186, 255, 158, 0.15),
            transparent 26%
          ),
          linear-gradient(
            135deg,
            #071b10,
            #10311d 52%,
            #24553a
          );
        color: white;
        box-shadow:
          0 38px 100px rgba(18, 49, 31, 0.24);
      }

      .hostBookingsHero::before {
        position: absolute;
        top: -220px;
        right: -170px;
        z-index: -2;
        width: 650px;
        height: 650px;
        border: 1px solid rgba(255, 255, 255, 0.07);
        border-radius: 50%;
        content: "";
        box-shadow:
          0 0 0 90px rgba(255, 255, 255, 0.018),
          0 0 0 180px rgba(255, 255, 255, 0.01);
      }

      .hostBookingsHeroGrid {
        position: absolute;
        inset: 0;
        z-index: -1;
        opacity: 0.15;
        background-image:
          linear-gradient(
            rgba(255, 255, 255, 0.05) 1px,
            transparent 1px
          ),
          linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.05) 1px,
            transparent 1px
          );
        background-size: 42px 42px;
        mask-image:
          linear-gradient(
            180deg,
            rgba(0, 0, 0, 0.7),
            transparent 80%
          );
      }

      .hostBookingsHeroCopy {
        max-width: 900px;
        padding-top: 76px;
      }

      .hostBookingsEyebrow {
        display: inline-flex;
        align-items: center;
        gap: 9px;
        padding: 9px 13px;
        border: 1px solid rgba(255, 255, 255, 0.14);
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.07);
        color: rgba(255, 255, 255, 0.74);
        font-size: 9px;
        font-weight: 900;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        backdrop-filter: blur(13px);
      }

      .hostBookingsEyebrow > span {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #baff9e;
        box-shadow:
          0 0 0 5px rgba(186, 255, 158, 0.13);
      }

      .hostBookingsHeroCopy h1 {
        margin: 25px 0 0;
        font-size: clamp(64px, 8vw, 106px);
        line-height: 0.85;
        letter-spacing: -0.08em;
      }

      .hostBookingsHeroCopy > p {
        max-width: 650px;
        margin: 26px 0 0;
        color: rgba(255, 255, 255, 0.61);
        font-size: 14px;
        line-height: 1.75;
      }

      .hostBookingsHeroUrgent,
      .hostBookingsHeroClear {
        margin-top: 28px;
      }

      .hostBookingsHeroUrgent {
        display: grid;
        grid-template-columns:
          auto minmax(0, 1fr) auto;
        align-items: center;
        gap: 13px;
        width: min(640px, 100%);
        padding: 13px;
        border: 1px solid rgba(186, 255, 158, 0.2);
        border-radius: 18px;
        background:
          linear-gradient(
            145deg,
            rgba(186, 255, 158, 0.12),
            rgba(255, 255, 255, 0.045)
          );
        backdrop-filter: blur(18px);
      }

      .hostBookingsHeroUrgent > span {
        display: grid;
        place-items: center;
        width: 43px;
        height: 43px;
        border-radius: 14px;
        background: #baff9e;
        color: #173b27;
      }

      .hostBookingsHeroUrgent strong,
      .hostBookingsHeroUrgent small {
        display: block;
      }

      .hostBookingsHeroUrgent strong {
        font-size: 11px;
      }

      .hostBookingsHeroUrgent small {
        margin-top: 4px;
        color: rgba(255, 255, 255, 0.52);
        font-size: 8px;
      }

      .hostBookingsHeroUrgent button {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        min-height: 38px;
        padding: 0 11px;
        border: 0;
        border-radius: 11px;
        background: #baff9e;
        color: #173b27;
        cursor: pointer;
        font-size: 8px;
        font-weight: 900;
      }

      .hostBookingsHeroClear {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 12px;
        border: 1px solid rgba(186, 255, 158, 0.18);
        border-radius: 999px;
        background: rgba(186, 255, 158, 0.09);
        color: #d8ffca;
        font-size: 9px;
        font-weight: 850;
      }

      .hostBookingsHeroStats {
        position: absolute;
        right: 40px;
        bottom: 40px;
        left: 40px;
        display: grid;
        grid-template-columns:
          repeat(4, minmax(0, 1fr));
        gap: 11px;
      }

      .hostBookingsHeroStats article {
        display: flex;
        align-items: center;
        gap: 11px;
        min-width: 0;
        padding: 15px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 17px;
        background: rgba(6, 24, 13, 0.36);
        backdrop-filter: blur(16px);
      }

      .hostBookingsHeroStats article.urgent {
        border-color: rgba(186, 255, 158, 0.24);
        background: rgba(186, 255, 158, 0.09);
      }

      .hostBookingsHeroStats article > span {
        display: grid;
        place-items: center;
        flex: 0 0 auto;
        width: 38px;
        height: 38px;
        border-radius: 12px;
        background: rgba(186, 255, 158, 0.1);
        color: #baff9e;
      }

      .hostBookingsHeroStats strong,
      .hostBookingsHeroStats small {
        display: block;
      }

      .hostBookingsHeroStats strong {
        overflow: hidden;
        color: white;
        font-size: 18px;
        letter-spacing: -0.035em;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .hostBookingsHeroStats small {
        margin-top: 4px;
        color: rgba(255, 255, 255, 0.42);
        font-size: 7px;
        font-weight: 800;
        letter-spacing: 0.07em;
        text-transform: uppercase;
      }

      .hostBookingsContent {
        width: min(1140px, 100%);
        margin: 0 auto;
      }

      .hostBookingsToolbar {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 20px;
        margin: 52px 0 19px;
      }

      .hostBookingsSectionLabel {
        color: #6f914e;
        font-size: 9px;
        font-weight: 900;
        letter-spacing: 0.13em;
        text-transform: uppercase;
      }

      .hostBookingsToolbar h2,
      .hostBookingsSummary h2 {
        margin: 9px 0 0;
        color: #20352a;
        font-size: clamp(37px, 5vw, 57px);
        line-height: 0.95;
        letter-spacing: -0.065em;
      }

      .hostBookingsToolbar p {
        margin: 10px 0 0;
        color: #7d8981;
        font-size: 10px;
      }

      .hostBookingsToolbar > button {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        min-height: 43px;
        padding: 0 15px;
        border: 1px solid #d4dfd1;
        border-radius: 13px;
        background: rgba(255, 255, 255, 0.84);
        color: #48604f;
        cursor: pointer;
        font-size: 9px;
        font-weight: 850;
        box-shadow: 0 10px 24px rgba(30, 51, 38, 0.05);
      }

      .hostBookingsTabs {
        display: flex;
        gap: 8px;
        overflow-x: auto;
        padding-bottom: 5px;
        scrollbar-width: none;
      }

      .hostBookingsTabs::-webkit-scrollbar {
        display: none;
      }

      .hostBookingsTabs button {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        flex: 0 0 auto;
        min-height: 42px;
        padding: 0 12px;
        border: 1px solid #d5dfd2;
        border-radius: 13px;
        background: rgba(255, 255, 255, 0.68);
        color: #647168;
        cursor: pointer;
        font-size: 9px;
        font-weight: 850;
        transition: 0.18s ease;
      }

      .hostBookingsTabs button strong {
        display: grid;
        place-items: center;
        min-width: 23px;
        height: 23px;
        padding: 0 6px;
        border-radius: 999px;
        background: #e8eee4;
        color: #4d6355;
        font-size: 8px;
      }

      .hostBookingsTabs button:hover {
        transform: translateY(-1px);
        border-color: #b5c6af;
      }

      .hostBookingsTabs button.active {
        border-color: #173b27;
        background: #173b27;
        color: white;
        box-shadow: 0 11px 26px rgba(23, 59, 39, 0.15);
      }

      .hostBookingsTabs button.active strong {
        background: #baff9e;
        color: #173b27;
      }

      .hostBookingsControls {
        position: sticky;
        top: 86px;
        z-index: 20;
        display: grid;
        grid-template-columns:
          minmax(300px, 1fr)
          minmax(185px, auto)
          minmax(190px, auto);
        gap: 10px;
        margin: 11px 0 20px;
        padding: 11px;
        border: 1px solid rgba(202, 216, 198, 0.95);
        border-radius: 19px;
        background: rgba(233, 238, 229, 0.91);
        box-shadow:
          0 16px 38px rgba(31, 51, 38, 0.08);
        backdrop-filter: blur(18px);
      }

      .hostBookingsSearch,
      .hostBookingsSort {
        display: flex;
        align-items: center;
        gap: 9px;
        min-height: 46px;
        padding: 0 13px;
        border: 1px solid #d4ded1;
        border-radius: 13px;
        background: white;
        color: #728078;
      }

      .hostBookingsSearch input {
        width: 100%;
        min-width: 0;
        border: 0;
        outline: 0;
        background: transparent;
        color: #263a2f;
        font-size: 10px;
      }

      .hostBookingsSearch button {
        display: grid;
        place-items: center;
        flex: 0 0 auto;
        width: 28px;
        height: 28px;
        padding: 0;
        border: 0;
        border-radius: 8px;
        background: #edf1ea;
        color: #728078;
        cursor: pointer;
      }

      .hostBookingsSort select {
        min-width: 155px;
        border: 0;
        outline: 0;
        background: transparent;
        color: #465b4e;
        cursor: pointer;
        font-size: 9px;
        font-weight: 800;
      }

      .hostBookingsValue {
        display: flex;
        align-items: center;
        gap: 10px;
        min-height: 46px;
        padding: 0 13px;
        border-radius: 13px;
        background:
          linear-gradient(
            135deg,
            #173b27,
            #25563a
          );
        color: white;
      }

      .hostBookingsValue > span {
        display: grid;
        place-items: center;
        width: 32px;
        height: 32px;
        border-radius: 10px;
        background: rgba(186, 255, 158, 0.1);
        color: #baff9e;
      }

      .hostBookingsValue small,
      .hostBookingsValue strong {
        display: block;
      }

      .hostBookingsValue small {
        color: rgba(255, 255, 255, 0.46);
        font-size: 7px;
      }

      .hostBookingsValue strong {
        margin-top: 2px;
        font-size: 10px;
      }

      .hostBookingsError {
        display: grid;
        grid-template-columns:
          auto minmax(0, 1fr) auto;
        align-items: center;
        gap: 11px;
        margin-bottom: 18px;
        padding: 14px;
        border: 1px solid #efc7c2;
        border-radius: 16px;
        background: #fff0ee;
        color: #963f35;
      }

      .hostBookingsError > span {
        display: grid;
        place-items: center;
        width: 34px;
        height: 34px;
        border-radius: 10px;
        background: #f8d7d3;
      }

      .hostBookingsError p {
        margin: 0;
        font-size: 10px;
      }

      .hostBookingsError button {
        border: 0;
        background: transparent;
        color: inherit;
        cursor: pointer;
        font-size: 9px;
        font-weight: 850;
      }

      .hostBookingsList {
        display: grid;
        gap: 18px;
      }

      .hostBookingCard {
        display: grid;
        grid-template-columns:
          minmax(300px, 0.72fr)
          minmax(0, 1.28fr);
        overflow: hidden;
        border: 1px solid #d8e2d5;
        border-radius: 29px;
        background: rgba(255, 255, 255, 0.82);
        box-shadow:
          0 17px 44px rgba(31, 51, 38, 0.065);
        transition:
          transform 0.22s ease,
          box-shadow 0.22s ease,
          border-color 0.22s ease;
      }

      .hostBookingCard:hover {
        transform: translateY(-4px);
        border-color: #b9c9b5;
        box-shadow:
          0 26px 62px rgba(31, 51, 38, 0.11);
      }

      .hostBookingCard.priority {
        border-color: #aeca99;
        box-shadow:
          0 18px 50px rgba(71, 111, 60, 0.11);
      }

      .hostBookingImageWrap {
        position: relative;
        min-height: 390px;
        overflow: hidden;
      }

      .hostBookingImageWrap img {
        width: 100%;
        height: 100%;
        display: block;
        object-fit: cover;
        transition: transform 0.5s ease;
      }

      .hostBookingCard:hover .hostBookingImageWrap img {
        transform: scale(1.035);
      }

      .hostBookingImageOverlay {
        position: absolute;
        inset: 0;
        background:
          linear-gradient(
            180deg,
            rgba(5, 17, 10, 0.08),
            rgba(5, 17, 10, 0.12) 38%,
            rgba(5, 17, 10, 0.82)
          );
      }

      .hostBookingStatus,
      .hostBookingPriorityTag {
        position: absolute;
        z-index: 2;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-height: 33px;
        padding: 0 10px;
        border: 1px solid rgba(255, 255, 255, 0.18);
        border-radius: 999px;
        backdrop-filter: blur(13px);
        font-size: 8px;
        font-weight: 900;
      }

      .hostBookingStatus {
        top: 16px;
        left: 16px;
      }

      .hostBookingPriorityTag {
        top: 16px;
        right: 16px;
        background: #baff9e;
        color: #173b27;
      }

      .hostBookingStatus.pending {
        border-color: rgba(255, 236, 168, 0.3);
        background: rgba(93, 70, 20, 0.58);
        color: #fff0b8;
      }

      .hostBookingStatus.success {
        border-color: rgba(186, 255, 158, 0.28);
        background: rgba(31, 79, 40, 0.6);
        color: #dcffcf;
      }

      .hostBookingStatus.completed {
        background: rgba(45, 87, 111, 0.58);
        color: #d9efff;
      }

      .hostBookingStatus.danger {
        background: rgba(112, 44, 40, 0.62);
        color: #ffd9d5;
      }

      .hostBookingStatus.muted {
        background: rgba(48, 55, 50, 0.58);
        color: rgba(255, 255, 255, 0.68);
      }

      .hostBookingImageBottom {
        position: absolute;
        right: 16px;
        bottom: 17px;
        left: 16px;
        z-index: 2;
        display: flex;
        flex-wrap: wrap;
        gap: 7px;
      }

      .hostBookingImageBottom span {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-height: 31px;
        padding: 0 9px;
        border: 1px solid rgba(255, 255, 255, 0.14);
        border-radius: 999px;
        background: rgba(4, 17, 9, 0.5);
        color: rgba(255, 255, 255, 0.78);
        font-size: 8px;
        font-weight: 800;
        backdrop-filter: blur(11px);
      }

      .hostBookingBody {
        display: flex;
        min-width: 0;
        padding: 25px;
        flex-direction: column;
      }

      .hostBookingTop {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 20px;
      }

      .hostBookingKicker {
        color: #6f914e;
        font-size: 8px;
        font-weight: 900;
        letter-spacing: 0.11em;
        text-transform: uppercase;
      }

      .hostBookingTop h2 {
        margin: 8px 0 0;
        color: #263d31;
        font-size: 31px;
        line-height: 1.02;
        letter-spacing: -0.055em;
      }

      .hostBookingCreated {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        margin-top: 9px;
        color: #8b958e;
        font-size: 8px;
      }

      .hostBookingValueStrong {
        flex: 0 0 auto;
        min-width: 110px;
        padding: 11px 12px;
        border: 1px solid #dce5d9;
        border-radius: 14px;
        background: #f5f8f2;
        text-align: right;
      }

      .hostBookingValueStrong span,
      .hostBookingValueStrong strong {
        display: block;
      }

      .hostBookingValueStrong span {
        color: #8b958e;
        font-size: 7px;
        text-transform: uppercase;
      }

      .hostBookingValueStrong strong {
        margin-top: 5px;
        color: #294233;
        font-size: 13px;
      }

      .hostBookingGuestPanel {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        margin-top: 20px;
        padding: 14px;
        border: 1px solid #dce5d9;
        border-radius: 17px;
        background:
          linear-gradient(
            145deg,
            #f8faf6,
            #eef5e9
          );
      }

      .hostBookingGuestIdentity {
        display: flex;
        align-items: center;
        gap: 11px;
        min-width: 0;
      }

      .hostBookingGuestIdentity img {
        flex: 0 0 auto;
        width: 52px;
        height: 52px;
        border-radius: 15px;
        object-fit: cover;
        box-shadow: 0 8px 20px rgba(31, 51, 38, 0.1);
      }

      .hostBookingGuestIdentity span,
      .hostBookingGuestIdentity strong,
      .hostBookingGuestIdentity small {
        display: block;
      }

      .hostBookingGuestIdentity span {
        color: #7e995f;
        font-size: 7px;
        font-weight: 900;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .hostBookingGuestIdentity strong {
        margin-top: 3px;
        overflow: hidden;
        color: #354b3e;
        font-size: 11px;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .hostBookingGuestIdentity small {
        margin-top: 3px;
        color: #879188;
        font-size: 8px;
      }

      .hostBookingGuestFacts {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 7px;
      }

      .hostBookingGuestFacts article {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-height: 34px;
        padding: 0 10px;
        border: 1px solid #d3dfcf;
        border-radius: 11px;
        background: white;
        color: #5a7544;
      }

      .hostBookingGuestFacts span {
        color: #5c6e62;
        font-size: 8px;
        font-weight: 800;
      }

      .hostBookingContact {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        margin-top: 12px;
        padding: 13px 14px;
        border: 1px solid #dbe5d7;
        border-radius: 16px;
        background: #edf5e6;
      }

      .hostBookingContact span,
      .hostBookingContact strong {
        display: block;
      }

      .hostBookingContact span {
        color: #729052;
        font-size: 7px;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .hostBookingContact strong {
        margin-top: 4px;
        color: #43564a;
        font-size: 9px;
      }

      .hostBookingContactLinks {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 7px;
      }

      .hostBookingContactLinks a {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-height: 35px;
        padding: 0 10px;
        border: 1px solid #cfddca;
        border-radius: 11px;
        background: white;
        color: #4b6253 !important;
        font-size: 8px;
        font-weight: 800;
        transition: 0.18s ease;
      }

      .hostBookingContactLinks a:hover {
        transform: translateY(-1px);
        border-color: #9fb597;
      }

      .hostBookingNote {
        margin-top: 12px;
        padding: 13px 14px;
        border: 1px solid #e1e8de;
        border-radius: 15px;
        background: #fbfcfa;
      }

      .hostBookingNote > span {
        color: #789456;
        font-size: 8px;
        font-weight: 900;
        letter-spacing: 0.09em;
        text-transform: uppercase;
      }

      .hostBookingNote p {
        margin: 7px 0 0;
        color: #6f7b73;
        font-size: 10px;
        line-height: 1.65;
      }

      .hostBookingHistory {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 12px;
      }

      .hostBookingHistory span {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 10px;
        border-radius: 999px;
        font-size: 8px;
        font-weight: 800;
      }

      .hostBookingHistory .approved {
        background: #e6f1df;
        color: #4e7438;
      }

      .hostBookingHistory .rejected {
        background: #fff0ee;
        color: #a34d43;
      }

      .hostBookingHistory .completed {
        background: #e9f1f8;
        color: #456b87;
      }

      .hostBookingFooter {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        margin-top: auto;
        padding-top: 19px;
      }

      .hostBookingSecondaryActions {
        display: flex;
        flex-wrap: wrap;
        gap: 7px;
      }

      .hostBookingSecondaryActions a {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-height: 38px;
        padding: 0 11px;
        border: 1px solid #d6dfd2;
        border-radius: 11px;
        background: #f8faf6;
        color: #53665a;
        font-size: 8px;
        font-weight: 850;
        transition: 0.18s ease;
      }

      .hostBookingSecondaryActions a:hover {
        transform: translateY(-1px);
        background: white;
      }

      .hostBookingActions {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 8px;
      }

      .hostBookingActions button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        min-height: 43px;
        padding: 0 13px;
        border-radius: 12px;
        cursor: pointer;
        font-size: 9px;
        font-weight: 900;
        transition:
          transform 0.18s ease,
          box-shadow 0.18s ease,
          background 0.18s ease;
      }

      .hostBookingActions button.approve {
        min-width: 150px;
        border: 1px solid #173b27;
        background: #173b27;
        color: white;
        box-shadow: 0 11px 24px rgba(23, 59, 39, 0.17);
      }

      .hostBookingActions button.approve:hover:not(:disabled) {
        background: #224f35;
        box-shadow: 0 14px 30px rgba(23, 59, 39, 0.22);
      }

      .hostBookingActions button.reject {
        border: 1px solid #ddb1ab;
        background: #fff1ef;
        color: #a34d43;
      }

      .hostBookingActions button.complete {
        border: 1px solid #486e8c;
        background: #eaf2f8;
        color: #3f6582;
      }

      .hostBookingActions button:hover:not(:disabled) {
        transform: translateY(-2px);
      }

      .hostBookingActions button:disabled {
        cursor: wait;
        opacity: 0.62;
      }

      .hostBookingsEmpty {
        display: grid;
        place-items: center;
        padding: 76px 25px;
        border: 1px dashed #c9d6c6;
        border-radius: 27px;
        background: rgba(255, 255, 255, 0.58);
        text-align: center;
      }

      .hostBookingsEmpty > span {
        display: grid;
        place-items: center;
        width: 70px;
        height: 70px;
        border-radius: 22px;
        background: #e7f0dc;
        color: #608047;
      }

      .hostBookingsEmpty h2 {
        margin: 19px 0 0;
        color: #34483b;
        font-size: 23px;
        letter-spacing: -0.04em;
      }

      .hostBookingsEmpty p {
        max-width: 520px;
        margin: 10px auto 0;
        color: #869188;
        font-size: 11px;
        line-height: 1.65;
      }

      .hostBookingsEmpty a,
      .hostBookingsEmpty button,
      .hostBookingsStatePrimary {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        margin-top: 20px;
        padding: 12px 15px;
        border: 0;
        border-radius: 12px;
        background: #173b27;
        color: white !important;
        cursor: pointer;
        font-size: 10px;
        font-weight: 850;
        text-decoration: none;
      }

      .hostBookingsSummary {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 30px;
        margin-top: 26px;
        padding: 32px;
        border: 1px solid #d9e3d6;
        border-radius: 28px;
        background:
          linear-gradient(
            145deg,
            rgba(255, 255, 255, 0.78),
            rgba(238, 245, 233, 0.76)
          );
        box-shadow:
          0 14px 38px rgba(31, 51, 38, 0.05);
      }

      .hostBookingsSummary p {
        max-width: 650px;
        margin: 13px 0 0;
        color: #7d8981;
        font-size: 11px;
        line-height: 1.7;
      }

      .hostBookingsSummary > a {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        flex: 0 0 auto;
        min-height: 45px;
        padding: 0 16px;
        border-radius: 14px;
        background: #173b27;
        color: white !important;
        font-size: 10px;
        font-weight: 850;
        transition: 0.2s ease;
      }

      .hostBookingsSummary > a:hover {
        gap: 11px;
        transform: translateY(-2px);
        background: #214b32;
      }

      .bookingModalBackdrop {
        position: fixed;
        inset: 0;
        z-index: 6000;
        display: grid;
        place-items: center;
        padding: 20px;
        background: rgba(4, 13, 8, 0.72);
        backdrop-filter: blur(13px);
      }

      .bookingModal {
        width: min(470px, 100%);
        padding: 25px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 24px;
        background:
          radial-gradient(
            circle at 100% 0%,
            rgba(186, 255, 158, 0.1),
            transparent 34%
          ),
          #10271a;
        color: white;
        box-shadow: 0 35px 100px rgba(0, 0, 0, 0.4);
      }

      .bookingModalIcon {
        display: grid;
        place-items: center;
        width: 52px;
        height: 52px;
        border-radius: 16px;
      }

      .bookingModalIcon.danger {
        background: rgba(255, 123, 112, 0.13);
        color: #ffb4ad;
      }

      .bookingModalIcon.success {
        background: rgba(186, 255, 158, 0.12);
        color: #baff9e;
      }

      .bookingModalKicker {
        display: block;
        margin-top: 20px;
        color: #baff9e;
        font-size: 8px;
        font-weight: 900;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }

      .bookingModal h2 {
        margin: 8px 0 0;
        font-size: 31px;
        line-height: 1;
        letter-spacing: -0.05em;
      }

      .bookingModal p {
        margin: 12px 0 0;
        color: rgba(255, 255, 255, 0.57);
        font-size: 10px;
        line-height: 1.7;
      }

      .bookingModalActions {
        display: flex;
        justify-content: flex-end;
        gap: 9px;
        margin-top: 23px;
      }

      .bookingModalActions button {
        min-height: 43px;
        padding: 0 14px;
        border-radius: 12px;
        cursor: pointer;
        font-size: 9px;
        font-weight: 900;
      }

      .bookingModalActions button.secondary {
        border: 1px solid rgba(255, 255, 255, 0.13);
        background: rgba(255, 255, 255, 0.06);
        color: white;
      }

      .bookingModalActions button.danger {
        border: 1px solid #ff9c93;
        background: #a54840;
        color: white;
      }

      .bookingModalActions button.success {
        border: 1px solid #baff9e;
        background: #baff9e;
        color: #173b27;
      }

      .bookingModalActions button:disabled {
        cursor: wait;
        opacity: 0.65;
      }

      .hostBookingsStatePage {
        display: grid;
        place-items: center;
        padding: 118px 24px 24px;
        background:
          radial-gradient(
            circle at top left,
            rgba(166, 203, 126, 0.18),
            transparent 30%
          ),
          #e9eee5;
      }

      .hostBookingsStateCard {
        display: grid;
        place-items: center;
        width: min(500px, 100%);
        padding: 50px 30px;
        border: 1px solid #dce3d9;
        border-radius: 28px;
        background: rgba(255, 255, 255, 0.84);
        text-align: center;
        box-shadow:
          0 20px 60px rgba(28, 48, 35, 0.08);
      }

      .hostBookingsLoader {
        width: 38px;
        height: 38px;
        border: 3px solid #dce5d7;
        border-top-color: #52783c;
        border-radius: 50%;
        animation:
          hostBookingsSpin 0.8s linear infinite;
      }

      @keyframes hostBookingsSpin {
        to {
          transform: rotate(360deg);
        }
      }

      .hostBookingsStateIcon {
        display: grid;
        place-items: center;
        width: 64px;
        height: 64px;
        border-radius: 21px;
        background: #e7f0dc;
        color: #608047;
      }

      .hostBookingsStateCard h1 {
        margin: 18px 0 0;
        color: #263a2f;
        font-size: 28px;
        letter-spacing: -0.04em;
      }

      .hostBookingsStateCard p {
        max-width: 390px;
        margin: 9px 0 0;
        color: #7e8981;
        font-size: 11px;
        line-height: 1.65;
      }

      @media (max-width: 1050px) {
        .hostBookingsHeroStats {
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
        }

        .hostBookingsHero {
          min-height: 760px;
        }

        .hostBookingCard {
          grid-template-columns:
            minmax(260px, 0.6fr)
            minmax(0, 1.4fr);
        }

        .hostBookingsControls {
          grid-template-columns: 1fr 1fr;
        }

        .hostBookingsValue {
          grid-column: 1 / -1;
        }
      }

      @media (max-width: 880px) {
        .hostBookingCard {
          grid-template-columns: 1fr;
        }

        .hostBookingImageWrap {
          min-height: 320px;
        }

        .hostBookingGuestPanel,
        .hostBookingFooter {
          align-items: flex-start;
          flex-direction: column;
        }

        .hostBookingGuestFacts,
        .hostBookingActions {
          justify-content: flex-start;
        }
      }

      @media (max-width: 700px) {
        .hostBookingsPage {
          padding: 84px 0 64px;
        }

        .hostBookingsStatePage {
          padding-top: 84px;
        }

        .hostBookingsHero {
          min-height: 800px;
          padding: 24px;
          border-radius: 0 0 32px 32px;
        }

        .hostBookingsHeroCopy {
          padding-top: 95px;
        }

        .hostBookingsHeroStats {
          right: 24px;
          bottom: 24px;
          left: 24px;
        }

        .hostBookingsContent {
          padding: 0 18px;
        }

        .hostBookingsToolbar {
          align-items: flex-start;
          flex-direction: column;
        }

        .hostBookingsControls {
          position: static;
          grid-template-columns: 1fr;
        }

        .hostBookingsValue {
          grid-column: auto;
        }

        .hostBookingContact {
          align-items: flex-start;
          flex-direction: column;
        }

        .hostBookingContactLinks {
          width: 100%;
          justify-content: flex-start;
        }

        .hostBookingFooter.stickyActions {
          position: sticky;
          bottom: 0;
          z-index: 4;
          margin: 18px -20px -20px;
          padding: 13px 20px 18px;
          border-top: 1px solid #dce5d8;
          background:
            linear-gradient(
              180deg,
              rgba(255, 255, 255, 0.88),
              white
            );
          backdrop-filter: blur(14px);
        }

        .hostBookingsSummary {
          align-items: flex-start;
          flex-direction: column;
        }
      }

      @media (max-width: 500px) {
        .hostBookingsHero {
          min-height: 850px;
          padding: 19px;
        }

        .hostBookingsHeroCopy h1 {
          font-size: 50px;
        }

        .hostBookingsHeroUrgent {
          grid-template-columns: auto 1fr;
        }

        .hostBookingsHeroUrgent button {
          grid-column: 1 / -1;
          width: 100%;
          justify-content: center;
        }

        .hostBookingsHeroStats {
          right: 19px;
          bottom: 19px;
          left: 19px;
          grid-template-columns: 1fr 1fr;
        }

        .hostBookingsContent {
          padding: 0 13px;
        }

        .hostBookingBody {
          padding: 20px;
        }

        .hostBookingTop {
          flex-direction: column;
        }

        .hostBookingValueStrong {
          width: 100%;
          text-align: left;
        }

        .hostBookingGuestFacts {
          width: 100%;
        }

        .hostBookingGuestFacts article {
          flex: 1;
        }

        .hostBookingSecondaryActions,
        .hostBookingActions {
          width: 100%;
        }

        .hostBookingSecondaryActions a,
        .hostBookingActions button {
          flex: 1;
        }

        .hostBookingActions button.approve {
          min-width: 0;
          width: 100%;
          flex-basis: 100%;
        }

        .hostBookingsSummary {
          padding: 23px;
        }

        .bookingModalActions {
          flex-direction: column-reverse;
        }

        .bookingModalActions button {
          width: 100%;
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
