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

function statusMeta(status) {
  const normalized = String(status || "").toLowerCase();

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
      tone: "success",
      icon: "check",
    };
  }

  if (normalized === "cancelled") {
    return {
      label: "Otkazano",
      tone: "danger",
      icon: "x",
    };
  }

  return {
    label: "Na čekanju",
    tone: "pending",
    icon: "clock",
  };
}

function LoadingState() {
  return (
    <>
      <HostBookingsStyles />
      <main className="hostBookingsStatePage">
        <div className="hostBookingsStateCard">
          <span className="hostBookingsLoader" />
          <h1>Učitavanje rezervacija</h1>
          <p>Pripremamo zahteve za tvoje pakete.</p>
        </div>
      </main>
    </>
  );
}

export default function HostBookings() {
  const { profile, isHost, loading } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");

  const loadBookings = useCallback(async () => {
    if (!profile?.id || !isHost) {
      setBookings([]);
      setPageLoading(false);
      return;
    }

    setPageLoading(true);
    setMessage("");

    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          id,
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
            currency
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
      console.error("Greška pri učitavanju rezervacija:", error);
      setBookings([]);
      setMessage(
        error?.message ||
          "Rezervacije trenutno nije moguće učitati."
      );
    } finally {
      setPageLoading(false);
    }
  }, [isHost, profile?.id]);

  useEffect(() => {
    if (loading) return;
    loadBookings();
  }, [loading, loadBookings]);

  const updateBookingStatus = useCallback(
    async (booking, status) => {
      if (!profile?.id) return;

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

        const { error } = await supabase
          .from("bookings")
          .update(payload)
          .eq("id", booking.id);

        if (error) throw error;

        const { error: notificationError } =
          await supabase
            .from("notifications")
            .insert({
              user_id: booking.user_id,
              from_user_id: profile.id,
              package_id: booking.package_id,
              type: `booking_${status}`,
              title:
                status === "approved"
                  ? "Rezervacija je odobrena"
                  : status === "completed"
                  ? "Rezervacija je završena"
                  : "Rezervacija je odbijena",
              message:
                status === "approved"
                  ? `Tvoja rezervacija za ${
                      booking.packages?.title ||
                      "paket"
                    } je odobrena.`
                  : status === "completed"
                  ? `Rezervacija za ${
                      booking.packages?.title ||
                      "paket"
                    } je označena kao završena.`
                  : `Tvoja rezervacija za ${
                      booking.packages?.title ||
                      "paket"
                    } je odbijena.`,
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
                  status,
                  approved_at:
                    payload.approved_at,
                  rejected_at:
                    payload.rejected_at,
                  completed_at:
                    payload.completed_at,
                }
              : item
          )
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
      }
    },
    [profile?.id]
  );

  const counts = useMemo(() => {
    return bookings.reduce(
      (result, booking) => {
        const status = String(
          booking.status || ""
        ).toLowerCase();

        if (status === "approved") {
          result.approved += 1;
        } else if (status === "rejected") {
          result.rejected += 1;
        } else if (status === "completed") {
          result.completed += 1;
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
      }
    );
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    const rows = bookings.filter((booking) => {
      const status = String(
        booking.status || "pending"
      ).toLowerCase();

      if (
        statusFilter !== "all" &&
        status !== statusFilter
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
        return Number(b.guests || 1) -
          Number(a.guests || 1);
      }

      if (sortOrder === "value") {
        const aValue =
          Number(a.total_amount) ||
          Number(a.packages?.price || 0) *
            Number(a.guests || 1);
        const bValue =
          Number(b.total_amount) ||
          Number(b.packages?.price || 0) *
            Number(b.guests || 1);

        return bValue - aValue;
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

  const totalGuests = useMemo(
    () =>
      bookings.reduce(
        (sum, booking) =>
          sum + Number(booking.guests || 1),
        0
      ),
    [bookings]
  );

  const totalValue = useMemo(
    () =>
      bookings.reduce((sum, booking) => {
        const value =
          Number(booking.total_amount) ||
          Number(booking.packages?.price || 0) *
            Number(booking.guests || 1);

        return sum + value;
      }, 0),
    [bookings]
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
        <section className="hostBookingsHero">
          <div className="hostBookingsHeroCopy">
            <span className="hostBookingsEyebrow">
              <span />
              Host dashboard
            </span>

            <h1>
              Zahtevi koji
              <br />
              čekaju tvoju odluku.
            </h1>

            <p>
              Pregledaj goste, detalje paketa i odobri ili
              odbij rezervacije sa jednog mesta.
            </p>
          </div>

          <div className="hostBookingsHeroStats">
            <article>
              <strong>{bookings.length}</strong>
              <span>ukupno zahteva</span>
            </article>

            <article>
              <strong>{counts.pending}</strong>
              <span>na čekanju</span>
            </article>

            <article>
              <strong>{counts.approved}</strong>
              <span>odobrenih</span>
            </article>

            <article>
              <strong>{totalGuests}</strong>
              <span>ukupno gostiju</span>
            </article>
          </div>
        </section>

        <section className="hostBookingsContent">
          <header className="hostBookingsToolbar">
            <div>
              <span className="hostBookingsSectionLabel">
                Upravljanje rezervacijama
              </span>

              <h2>Najnoviji zahtevi.</h2>

              <p>
                Zahtevi su prikazani od najnovijeg ka starijem.
              </p>
            </div>

            <button type="button" onClick={loadBookings}>
              <Icon name="refresh" size={16} />
              Osveži
            </button>
          </header>

          <section className="hostBookingsControls">
            <label className="hostBookingsSearch">
              <Icon name="search" size={17} />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
                placeholder="Ime, telefon, email, paket ili ID..."
              />
            </label>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              aria-label="Filtriraj rezervacije"
            >
              <option value="all">Sve rezervacije</option>
              <option value="pending">Na čekanju</option>
              <option value="approved">Odobrene</option>
              <option value="rejected">Odbijene</option>
              <option value="completed">Završene</option>
              <option value="cancelled">Otkazane</option>
            </select>

            <select
              value={sortOrder}
              onChange={(event) =>
                setSortOrder(event.target.value)
              }
              aria-label="Sortiraj rezervacije"
            >
              <option value="newest">Najnovije</option>
              <option value="oldest">Najstarije</option>
              <option value="guests">Najviše osoba</option>
              <option value="value">Najveća vrednost</option>
            </select>

            <div className="hostBookingsValue">
              <Icon name="money" size={17} />
              <div>
                <span>Ukupna vrednost</span>
                <strong>
                  €{totalValue.toFixed(2)}
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

              <button type="button" onClick={loadBookings}>
                Pokušaj ponovo
              </button>
            </div>
          )}

          {filteredBookings.length === 0 ? (
            <section className="hostBookingsEmpty">
              <span>
                <Icon name="inbox" size={31} />
              </span>

              <h2>Još nema zahteva za rezervaciju.</h2>

              <p>
                Kada korisnik rezerviše neki od tvojih paketa,
                njegov zahtev će se pojaviti ovde.
              </p>

              <Link to="/dashboard">
                Nazad na dashboard
                <Icon name="arrowRight" size={16} />
              </Link>
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
                  booking.phone ||
                  user?.phone ||
                  "";

                const totalAmount =
                  Number(booking.total_amount) ||
                  Number(pack?.price || 0) *
                    Number(booking.guests || 1);

                const currency =
                  booking.currency ||
                  pack?.currency ||
                  "EUR";

                return (
                  <article
                    key={booking.id}
                    className="hostBookingCard"
                  >
                    <div className="hostBookingImageWrap">
                      <img
                        src={pack?.cover_url || FALLBACK_COVER}
                        alt={pack?.title || "Paket"}
                      />

                      <span
                        className={`hostBookingStatus ${meta.tone}`}
                      >
                        <Icon name={meta.icon} size={14} />
                        {meta.label}
                      </span>
                    </div>

                    <div className="hostBookingBody">
                      <div className="hostBookingTop">
                        <div>
                          <span className="hostBookingKicker">
                            Rezervacija #{String(booking.id).slice(0, 8)}
                          </span>

                          <h2>
                            {pack?.title ||
                              "Paket je obrisan"}
                          </h2>
                        </div>

                        <small>
                          {formatDate(
                            booking.created_at
                          )}
                        </small>
                      </div>

                      <div className="hostBookingMetaGrid">
                        <article>
                          <Icon name="mapPin" size={17} />
                          <div>
                            <span>Lokacija</span>
                            <strong>
                              {[
                                pack?.location,
                                pack?.country,
                              ]
                                .filter(Boolean)
                                .join(", ") ||
                                "Lokacija nije navedena"}
                            </strong>
                          </div>
                        </article>

                        <article>
                          <Icon name="users" size={17} />
                          <div>
                            <span>Broj gostiju</span>
                            <strong>
                              {booking.guests || 1}
                            </strong>
                          </div>
                        </article>

                        <article>
                          <Icon name="money" size={17} />
                          <div>
                            <span>Ukupna vrednost</span>
                            <strong>
                              {currency}{" "}
                              {totalAmount.toFixed(2)}
                            </strong>
                          </div>
                        </article>
                      </div>

                      <div className="hostBookingContact">
                        <div>
                          <span>Kontakt za rezervaciju</span>
                          <strong>{bookingName}</strong>
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
                        booking.rejected_at) && (
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
                        </div>
                      )}

                      <div className="hostBookingFooter">
                        {user ? (
                          <Link
                            to={userUrl}
                            className="hostBookingUser"
                          >
                            <img
                              src={
                                user.avatar_url ||
                                FALLBACK_AVATAR
                              }
                              alt={
                                user.full_name ||
                                user.username
                              }
                            />

                            <div>
                              <span>Gost</span>
                              <strong>
                                {bookingName}
                              </strong>
                              <small>
                                @{user.username}
                              </small>
                            </div>
                          </Link>
                        ) : (
                          <div className="hostBookingUserMissing">
                            Korisnik nije dostupan
                          </div>
                        )}

                        <div className="hostBookingActions">
                          {pack && (
                            <Link
                              to={`/package/${pack.id}`}
                              className="hostBookingPackageLink"
                            >
                              Paket
                              <Icon
                                name="arrowRight"
                                size={15}
                              />
                            </Link>
                          )}

                          {booking.status !== "approved" && (
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
                              <Icon name="check" size={16} />
                              {isUpdating
                                ? "Čuvanje..."
                                : "Odobri"}
                            </button>
                          )}

                          {booking.status === "approved" && (
                            <button
                              type="button"
                              className="complete"
                              disabled={isUpdating}
                              onClick={() =>
                                updateBookingStatus(
                                  booking,
                                  "completed"
                                )
                              }
                            >
                              <Icon name="check" size={16} />
                              {isUpdating
                                ? "Čuvanje..."
                                : "Završi"}
                            </button>
                          )}

                          {booking.status !== "rejected" && (
                            <button
                              type="button"
                              className="reject"
                              disabled={isUpdating}
                              onClick={() =>
                                updateBookingStatus(
                                  booking,
                                  "rejected"
                                )
                              }
                            >
                              <Icon name="x" size={16} />
                              {isUpdating
                                ? "Čuvanje..."
                                : "Odbij"}
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
                Jasne odluke. Bolje iskustvo za goste.
              </h2>

              <p>
                Redovno proveravaj nove zahteve i odgovori
                korisnicima dok je njihovo interesovanje sveže.
              </p>
            </div>

            <Link to="/dashboard">
              Otvori dashboard
              <Icon name="arrowRight" size={16} />
            </Link>
          </section>
        </section>
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
        background: #edf1e9;
      }

      button {
        font: inherit;
      }

      button,
      a {
        -webkit-tap-highlight-color: transparent;
      }

      .hostBookingsPage,
      .hostBookingsStatePage {
        min-height: 100vh;
        color: #203229;
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
        padding: 118px 28px 70px;
        background:
          radial-gradient(
            circle at 7% 0%,
            rgba(177, 211, 139, 0.18),
            transparent 27%
          ),
          radial-gradient(
            circle at 94% 25%,
            rgba(64, 106, 75, 0.1),
            transparent 24%
          ),
          #edf1e9;
      }

      .hostBookingsPage a {
        color: inherit;
        text-decoration: none;
      }

      .hostBookingsHero {
        position: relative;
        isolation: isolate;
        width: min(1200px, 100%);
        min-height: 610px;
        margin: 0 auto;
        padding: 34px;
        overflow: hidden;
        border-radius: 36px;
        background:
          radial-gradient(
            circle at 84% 17%,
            rgba(202, 241, 148, 0.14),
            transparent 27%
          ),
          linear-gradient(
            135deg,
            #0d2a1a,
            #173f28 58%,
            #28563a
          );
        color: white;
        box-shadow:
          0 34px 90px rgba(23, 54, 36, 0.18);
      }

      .hostBookingsHero::before {
        position: absolute;
        top: -170px;
        right: -140px;
        z-index: -1;
        width: 550px;
        height: 550px;
        border:
          1px solid rgba(255, 255, 255, 0.07);
        border-radius: 50%;
        content: "";
        box-shadow:
          0 0 0 80px rgba(255, 255, 255, 0.02),
          0 0 0 160px rgba(255, 255, 255, 0.012);
      }

      .hostBookingsHeroCopy {
        max-width: 880px;
        padding-top: 105px;
      }

      .hostBookingsEyebrow {
        display: inline-flex;
        align-items: center;
        gap: 9px;
        padding: 9px 13px;
        border:
          1px solid rgba(255, 255, 255, 0.14);
        border-radius: 999px;
        background:
          rgba(255, 255, 255, 0.07);
        color:
          rgba(255, 255, 255, 0.76);
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
        background: #cef39a;
        box-shadow:
          0 0 0 5px rgba(206, 243, 154, 0.12);
      }

      .hostBookingsHeroCopy h1 {
        margin: 24px 0 0;
        font-size:
          clamp(56px, 7.3vw, 94px);
        line-height: 0.9;
        letter-spacing: -0.075em;
      }

      .hostBookingsHeroCopy p {
        max-width: 610px;
        margin: 25px 0 0;
        color:
          rgba(255, 255, 255, 0.63);
        font-size: 14px;
        line-height: 1.75;
      }

      .hostBookingsHeroStats {
        position: absolute;
        right: 34px;
        bottom: 34px;
        left: 34px;
        display: grid;
        grid-template-columns:
          repeat(4, minmax(0, 1fr));
        gap: 12px;
      }

      .hostBookingsHeroStats article {
        padding: 17px;
        border:
          1px solid rgba(255, 255, 255, 0.13);
        border-radius: 17px;
        background:
          rgba(12, 35, 21, 0.34);
        backdrop-filter: blur(16px);
      }

      .hostBookingsHeroStats strong,
      .hostBookingsHeroStats span {
        display: block;
      }

      .hostBookingsHeroStats strong {
        font-size: 19px;
        letter-spacing: -0.03em;
      }

      .hostBookingsHeroStats span {
        margin-top: 6px;
        color:
          rgba(255, 255, 255, 0.48);
        font-size: 8px;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .hostBookingsContent {
        width: min(1100px, 100%);
        margin: 0 auto;
      }

      .hostBookingsToolbar {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 20px;
        margin: 50px 0 22px;
      }

      .hostBookingsSectionLabel {
        color: #789456;
        font-size: 9px;
        font-weight: 900;
        letter-spacing: 0.13em;
        text-transform: uppercase;
      }

      .hostBookingsToolbar h2,
      .hostBookingsSummary h2 {
        margin: 8px 0 0;
        color: #2f4437;
        font-size:
          clamp(34px, 5vw, 52px);
        line-height: 1;
        letter-spacing: -0.06em;
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
        border: 1px solid #d5dfd1;
        border-radius: 13px;
        background:
          rgba(255, 255, 255, 0.8);
        color: #4c6255;
        cursor: pointer;
        font-size: 9px;
        font-weight: 850;
      }


      .hostBookingsControls{position:sticky;top:86px;z-index:20;display:grid;grid-template-columns:minmax(240px,1fr) auto auto auto;gap:10px;margin-bottom:18px;padding:12px;border:1px solid #d8e1d5;border-radius:18px;background:rgba(237,241,233,.92);box-shadow:0 12px 30px rgba(31,51,38,.07);backdrop-filter:blur(16px)}
      .hostBookingsSearch{display:flex;align-items:center;gap:9px;min-height:44px;padding:0 13px;border:1px solid #d4ded1;border-radius:13px;background:#fff;color:#728078}
      .hostBookingsSearch input{width:100%;min-width:0;border:0;outline:0;background:transparent;color:#263a2f;font-size:10px}
      .hostBookingsControls select{min-height:44px;padding:0 12px;border:1px solid #d4ded1;border-radius:13px;background:#fff;color:#465b4e;outline:0;font-size:9px;font-weight:800}
      .hostBookingsValue{display:flex;align-items:center;gap:9px;min-height:44px;padding:0 13px;border-radius:13px;background:#183a27;color:#fff}
      .hostBookingsValue span,.hostBookingsValue strong{display:block}
      .hostBookingsValue span{color:rgba(255,255,255,.5);font-size:7px}
      .hostBookingsValue strong{margin-top:2px;font-size:10px}
      .hostBookingContact{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-top:15px;padding:14px;border:1px solid #dbe5d7;border-radius:16px;background:#edf5e6}
      .hostBookingContact span,.hostBookingContact strong{display:block}
      .hostBookingContact span{color:#789456;font-size:8px;font-weight:900;text-transform:uppercase;letter-spacing:.08em}
      .hostBookingContact strong{margin-top:5px;color:#34483b;font-size:11px}
      .hostBookingContactLinks{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:7px}
      .hostBookingContactLinks a{display:inline-flex;align-items:center;gap:6px;min-height:35px;padding:0 10px;border:1px solid #cfddca;border-radius:11px;background:#fff;color:#4b6253!important;font-size:8px;font-weight:800}
      .hostBookingActions button.complete{border:1px solid #385d86;background:#e8f1fb;color:#385d86}

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
          minmax(270px, 0.68fr)
          minmax(0, 1.32fr);
        overflow: hidden;
        border: 1px solid #dbe4d8;
        border-radius: 27px;
        background:
          rgba(255, 255, 255, 0.8);
        box-shadow:
          0 16px 42px rgba(31, 51, 38, 0.06);
        transition: 0.22s ease;
      }

      .hostBookingCard:hover {
        border-color: #bccbb7;
        background: white;
        box-shadow:
          0 23px 52px rgba(31, 51, 38, 0.1);
        transform: translateY(-3px);
      }

      .hostBookingImageWrap {
        position: relative;
        min-height: 350px;
        overflow: hidden;
      }

      .hostBookingImageWrap::after {
        position: absolute;
        inset: 0;
        background:
          linear-gradient(
            180deg,
            transparent 48%,
            rgba(11, 29, 18, 0.54)
          );
        content: "";
      }

      .hostBookingImageWrap img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.45s ease;
      }

      .hostBookingCard:hover
        .hostBookingImageWrap img {
        transform: scale(1.035);
      }

      .hostBookingStatus {
        position: absolute;
        top: 16px;
        left: 16px;
        z-index: 2;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-height: 34px;
        padding: 0 11px;
        border:
          1px solid rgba(255, 255, 255, 0.22);
        border-radius: 999px;
        backdrop-filter: blur(13px);
        font-size: 8px;
        font-weight: 900;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .hostBookingStatus.pending {
        background:
          rgba(119, 91, 27, 0.56);
        color: #ffeab2;
      }

      .hostBookingStatus.success {
        background:
          rgba(42, 92, 48, 0.58);
        color: #d7f5be;
      }

      .hostBookingStatus.danger {
        background:
          rgba(114, 48, 43, 0.58);
        color: #ffd5d1;
      }

      .hostBookingBody {
        display: flex;
        min-width: 0;
        padding: 24px;
        flex-direction: column;
      }

      .hostBookingTop {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 20px;
      }

      .hostBookingKicker {
        color: #789456;
        font-size: 8px;
        font-weight: 900;
        letter-spacing: 0.11em;
        text-transform: uppercase;
      }

      .hostBookingTop h2 {
        margin: 9px 0 0;
        color: #304538;
        font-size: 29px;
        line-height: 1.05;
        letter-spacing: -0.05em;
      }

      .hostBookingTop > small {
        flex: 0 0 auto;
        color: #929b95;
        font-size: 8px;
      }

      .hostBookingMetaGrid {
        display: grid;
        grid-template-columns:
          repeat(3, minmax(0, 1fr));
        gap: 10px;
        margin-top: 22px;
      }

      .hostBookingMetaGrid article {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 13px;
        border: 1px solid #e0e7dd;
        border-radius: 15px;
        background: #f8faf6;
        color: #66804d;
      }

      .hostBookingMetaGrid span,
      .hostBookingMetaGrid strong {
        display: block;
      }

      .hostBookingMetaGrid span {
        color: #8b958e;
        font-size: 8px;
      }

      .hostBookingMetaGrid strong {
        margin-top: 3px;
        color: #405347;
        font-size: 9px;
        line-height: 1.35;
      }

      .hostBookingNote {
        margin-top: 15px;
        padding: 14px;
        border: 1px solid #e2e8df;
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
        margin-top: 14px;
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

      .hostBookingFooter {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 18px;
        margin-top: auto;
        padding-top: 20px;
      }

      .hostBookingUser {
        display: grid;
        grid-template-columns:
          auto minmax(0, 1fr);
        align-items: center;
        gap: 11px;
        min-width: 0;
      }

      .hostBookingUser img {
        width: 51px;
        height: 51px;
        border-radius: 15px;
        object-fit: cover;
      }

      .hostBookingUser span,
      .hostBookingUser strong,
      .hostBookingUser small {
        display: block;
      }

      .hostBookingUser span {
        color: #929b95;
        font-size: 7px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .hostBookingUser strong {
        margin-top: 4px;
        color: #3d5144;
        font-size: 10px;
      }

      .hostBookingUser small {
        margin-top: 3px;
        color: #8b958e;
        font-size: 8px;
      }

      .hostBookingUserMissing {
        color: #8b958e;
        font-size: 9px;
      }

      .hostBookingActions {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 8px;
      }

      .hostBookingActions a,
      .hostBookingActions button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        min-height: 41px;
        padding: 0 13px;
        border-radius: 12px;
        cursor: pointer;
        font-size: 9px;
        font-weight: 850;
        transition: 0.2s ease;
      }

      .hostBookingPackageLink {
        border: 1px solid #d4ded1;
        background: #f8faf6;
        color: #4b6253;
      }

      .hostBookingActions button.approve {
        border: 1px solid #49753b;
        background: #426d35;
        color: white;
      }

      .hostBookingActions button.reject {
        border: 1px solid #d8a39d;
        background: #fff0ee;
        color: #a34d43;
      }

      .hostBookingActions button:disabled {
        cursor: wait;
        opacity: 0.62;
      }

      .hostBookingActions a:hover,
      .hostBookingActions button:hover:not(:disabled) {
        transform: translateY(-2px);
      }

      .hostBookingsEmpty {
        display: grid;
        place-items: center;
        padding: 76px 25px;
        border: 1px dashed #cad6c6;
        border-radius: 27px;
        background:
          rgba(255, 255, 255, 0.6);
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
      .hostBookingsStatePrimary {
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
        text-decoration: none;
      }

      .hostBookingsSummary {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 30px;
        margin-top: 24px;
        padding: 31px;
        border: 1px solid #dbe4d8;
        border-radius: 27px;
        background:
          rgba(255, 255, 255, 0.72);
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
        background: #183a27;
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
          #edf1e9;
      }

      .hostBookingsStateCard {
        display: grid;
        place-items: center;
        width: min(500px, 100%);
        padding: 50px 30px;
        border: 1px solid #dce3d9;
        border-radius: 28px;
        background:
          rgba(255, 255, 255, 0.84);
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

      @media (max-width: 1100px) {
        .hostBookingsControls {
          grid-template-columns: 1fr 1fr;
        }
      }

      @media (max-width: 960px) {
        .hostBookingCard {
          grid-template-columns: 1fr;
        }

        .hostBookingImageWrap {
          min-height: 280px;
        }

        .hostBookingsHeroStats {
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
        }

        .hostBookingsHero {
          min-height: 710px;
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
          min-height: 740px;
          padding: 24px;
          border-radius: 0 0 32px 32px;
        }

        .hostBookingsHeroCopy {
          padding-top: 110px;
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

        .hostBookingContact {
          align-items: flex-start;
          flex-direction: column;
        }

        .hostBookingContactLinks {
          width: 100%;
          justify-content: flex-start;
        }

        .hostBookingMetaGrid {
          grid-template-columns: 1fr;
        }

        .hostBookingsSummary {
          align-items: flex-start;
          flex-direction: column;
        }
      }

      @media (max-width: 480px) {
        .hostBookingsHero {
          min-height: 780px;
          padding: 19px;
        }

        .hostBookingsHeroCopy h1 {
          font-size: 47px;
        }

        .hostBookingsHeroStats {
          right: 19px;
          bottom: 19px;
          left: 19px;
        }

        .hostBookingsContent {
          padding: 0 13px;
        }

        .hostBookingBody {
          padding: 20px;
        }

        .hostBookingTop,
        .hostBookingFooter {
          align-items: flex-start;
          flex-direction: column;
        }

        .hostBookingActions {
          width: 100%;
          justify-content: flex-start;
        }

        .hostBookingActions a,
        .hostBookingActions button {
          flex: 1;
        }

        .hostBookingsSummary {
          padding: 22px;
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
