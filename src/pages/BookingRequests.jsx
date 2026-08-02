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

function Icon({
  name,
  size = 20,
  strokeWidth = 2,
}) {
  const icons = {
    calendar: (
      <>
        <rect
          x="3"
          y="5"
          width="18"
          height="16"
          rx="2"
        />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </>
    ),
    users: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20v-2a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v2" />
        <path d="M16 4.5a3 3 0 0 1 0 6M17 13a5 5 0 0 1 4 5v2" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    close: (
      <>
        <path d="M6 6l12 12" />
        <path d="M18 6 6 18" />
      </>
    ),
    arrowRight: (
      <>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </>
    ),
    mapPin: (
      <>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    note: (
      <>
        <path d="M5 4h14v16H5z" />
        <path d="M8 8h8M8 12h8M8 16h5" />
      </>
    ),
    euro: (
      <>
        <path d="M18 7.5A6 6 0 1 0 18 16.5" />
        <path d="M5 10h8M5 14h8" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    alert: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5M12 16h.01" />
      </>
    ),
    shield: (
      <>
        <path d="M12 3 5 6v5c0 4.6 2.9 8.4 7 10 4.1-1.6 7-5.4 7-10V6l-7-3Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    refresh: (
      <>
        <path d="M20 7v5h-5M4 17v-5h5" />
        <path d="M18.4 9A7 7 0 0 0 6 6.5L4 9M5.6 15A7 7 0 0 0 18 17.5l2-2.5" />
      </>
    ),
    inbox: (
      <>
        <path d="M4 4h16v13H4z" />
        <path d="m4 13 4-4h8l4 4" />
        <path d="M9 17h6" />
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
  if (!value) {
    return "Datum nije dostupan";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Datum nije dostupan";
  }

  return new Intl.DateTimeFormat(
    "sr-Latn-RS",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
}

function normalizeStatus(value) {
  const status = String(
    value || "pending"
  ).toLowerCase();

  if (
    status === "approved" ||
    status === "confirmed"
  ) {
    return "approved";
  }

  if (
    status === "rejected" ||
    status === "cancelled"
  ) {
    return "rejected";
  }

  return "pending";
}

function getStatusMeta(value) {
  const status = normalizeStatus(value);

  if (status === "approved") {
    return {
      status,
      label: "Odobreno",
      icon: "check",
    };
  }

  if (status === "rejected") {
    return {
      status,
      label: "Odbijeno",
      icon: "close",
    };
  }

  return {
    status: "pending",
    label: "Na čekanju",
    icon: "clock",
  };
}

function LoadingState() {
  return (
    <>
      <BookingRequestsStyles />

      <main className="bookingRequestsStatePage">
        <div className="bookingRequestsStateCard">
          <span className="bookingRequestsLoader" />

          <h1>Učitavanje zahteva</h1>

          <p>
            Pripremamo najnovije booking
            zahteve.
          </p>
        </div>
      </main>
    </>
  );
}

export default function BookingRequests() {
  const {
    profile,
    isHost,
    loading: authLoading,
  } = useAuth();

  const [bookings, setBookings] =
    useState([]);
  const [pageLoading, setPageLoading] =
    useState(true);
  const [message, setMessage] =
    useState("");
  const [updatingId, setUpdatingId] =
    useState(null);

  const loadBookings = useCallback(async () => {
    if (authLoading) return;

    if (!profile?.id || !isHost) {
      setBookings([]);
      setPageLoading(false);
      return;
    }

    setPageLoading(true);
    setMessage("");

    try {
      const {
        data,
        error,
      } = await supabase
        .from("bookings")
        .select(`
          id,
          package_id,
          user_id,
          guests,
          note,
          status,
          created_at,
          updated_at,
          approved_at,
          rejected_at,
          packages:package_id (
            id,
            title,
            cover_url,
            location,
            country,
            price
          ),
          profiles:user_id (
            id,
            username,
            full_name,
            avatar_url,
            role
          )
        `)
        .eq("host_id", profile.id)
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      setBookings(data || []);
    } catch (loadError) {
      console.error(
        "Greška pri učitavanju booking zahteva:",
        loadError
      );

      setBookings([]);
      setMessage(
        loadError?.message ||
          "Booking zahteve trenutno nije moguće učitati."
      );
    } finally {
      setPageLoading(false);
    }
  }, [
    authLoading,
    isHost,
    profile?.id,
  ]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  async function sendStatusNotification(
    booking,
    status
  ) {
    if (
      !booking?.user_id ||
      !profile?.id
    ) {
      return;
    }

    const approved =
      status === "approved";

    const {
      error: notificationError,
    } = await supabase
      .from("notifications")
      .insert({
        user_id: booking.user_id,
        from_user_id: profile.id,
        package_id:
          booking.package_id || null,
        type: approved
          ? "booking_approved"
          : "booking_rejected",
        title: approved
          ? "Rezervacija je odobrena"
          : "Rezervacija je odbijena",
        message: approved
          ? `Tvoja rezervacija za paket ${
              booking.packages?.title ||
              "MeetOutdoors paket"
            } je odobrena.`
          : `Tvoja rezervacija za paket ${
              booking.packages?.title ||
              "MeetOutdoors paket"
            } je odbijena.`,
      });

    if (notificationError) {
      console.error(
        "Rezervacija je ažurirana, ali notifikacija nije poslata:",
        notificationError
      );
    }
  }

  async function updateStatus(
    booking,
    nextStatus
  ) {
    if (
      !booking?.id ||
      !profile?.id ||
      updatingId
    ) {
      return;
    }

    const status =
      normalizeStatus(nextStatus);

    if (status === "pending") {
      return;
    }

    const currentStatus =
      normalizeStatus(booking.status);

    if (currentStatus === status) {
      return;
    }

    const now =
      new Date().toISOString();

    const payload = {
      status,
      updated_at: now,
      approved_at:
        status === "approved"
          ? now
          : null,
      rejected_at:
        status === "rejected"
          ? now
          : null,
    };

    try {
      setUpdatingId(booking.id);
      setMessage("");

      const {
        data: updatedBooking,
        error,
      } = await supabase
        .from("bookings")
        .update(payload)
        .eq("id", booking.id)
        .eq("host_id", profile.id)
        .select(`
          id,
          status,
          updated_at,
          approved_at,
          rejected_at
        `)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!updatedBooking) {
        throw new Error(
          "Zahtev nije ažuriran. Proveri dozvole i vlasništvo."
        );
      }

      setBookings((previous) =>
        previous.map((item) =>
          item.id === booking.id
            ? {
                ...item,
                ...updatedBooking,
              }
            : item
        )
      );

      await sendStatusNotification(
        booking,
        status
      );
    } catch (updateError) {
      console.error(
        "Greška pri promeni statusa rezervacije:",
        updateError
      );

      setMessage(
        updateError?.message ||
          "Status rezervacije nije moguće promeniti."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  const stats = useMemo(() => {
    return bookings.reduce(
      (result, booking) => {
        const status =
          normalizeStatus(
            booking.status
          );

        result.total += 1;
        result[status] += 1;

        return result;
      },
      {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
      }
    );
  }, [bookings]);

  if (
    authLoading ||
    pageLoading
  ) {
    return <LoadingState />;
  }

  if (!isHost) {
    return (
      <>
        <BookingRequestsStyles />

        <main className="bookingRequestsStatePage">
          <div className="bookingRequestsStateCard">
            <span className="bookingRequestsStateIcon">
              <Icon
                name="shield"
                size={28}
              />
            </span>

            <h1>
              Pristup je namenjen hostovima
            </h1>

            <p>
              Samo host profili mogu da
              pregledaju booking zahteve.
            </p>

            <Link
              to="/"
              className="bookingRequestsStatePrimary"
            >
              Nazad na početnu

              <Icon
                name="arrowRight"
                size={16}
              />
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <BookingRequestsStyles />

      <main className="bookingRequestsPage">
        <section className="bookingRequestsHero">
          <div className="bookingRequestsHeroCopy">
            <span className="bookingRequestsEyebrow">
              <span />
              Host rezervacije
            </span>

            <h1>
              Zahtevi koji
              <br />
              čekaju odluku.
            </h1>

            <p>
              Pregledaj goste, detalje
              paketa i brzo odobri ili
              odbij svaki booking zahtev.
            </p>
          </div>

          <div className="bookingRequestsHeroStats">
            <article>
              <strong>
                {stats.total}
              </strong>
              <span>
                ukupno zahteva
              </span>
            </article>

            <article>
              <strong>
                {stats.pending}
              </strong>
              <span>
                na čekanju
              </span>
            </article>

            <article>
              <strong>
                {stats.approved}
              </strong>
              <span>odobreno</span>
            </article>

            <article>
              <strong>
                {stats.rejected}
              </strong>
              <span>odbijeno</span>
            </article>
          </div>
        </section>

        <section className="bookingRequestsContent">
          <header className="bookingRequestsToolbar">
            <div>
              <span className="bookingRequestsSectionLabel">
                Booking zahtevi
              </span>

              <h2>
                Upravljaj rezervacijama.
              </h2>

              <p>
                Najnoviji zahtevi prikazani
                su prvi.
              </p>
            </div>

            <button
              type="button"
              onClick={loadBookings}
            >
              <Icon
                name="refresh"
                size={16}
              />
              Osveži
            </button>
          </header>

          {message && (
            <div
              className="bookingRequestsError"
              role="alert"
            >
              <span>
                <Icon
                  name="alert"
                  size={18}
                />
              </span>

              <p>{message}</p>

              <button
                type="button"
                onClick={loadBookings}
              >
                Pokušaj ponovo
              </button>
            </div>
          )}

          {bookings.length === 0 ? (
            <section className="bookingRequestsEmpty">
              <span>
                <Icon
                  name="inbox"
                  size={32}
                />
              </span>

              <h2>
                Još nema booking zahteva.
              </h2>

              <p>
                Novi zahtevi će se pojaviti
                ovde kada gost pošalje
                rezervaciju za neki od
                tvojih paketa.
              </p>

              <Link to="/packages">
                Pogledaj pakete

                <Icon
                  name="arrowRight"
                  size={16}
                />
              </Link>
            </section>
          ) : (
            <section className="bookingRequestsList">
              {bookings.map((booking) => {
                const user =
                  booking.profiles;
                const pack =
                  booking.packages;
                const meta =
                  getStatusMeta(
                    booking.status
                  );

                const username =
                  user?.username || "";

                const userUrl =
                  username
                    ? user?.role === "host"
                      ? `/h/${username}`
                      : `/u/${username}`
                    : null;

                const location =
                  [
                    pack?.location,
                    pack?.country,
                  ]
                    .filter(Boolean)
                    .join(", ") ||
                  "Lokacija nije navedena";

                const isUpdating =
                  updatingId ===
                  booking.id;

                return (
                  <article
                    key={booking.id}
                    className="bookingRequestCard"
                  >
                    <div className="bookingRequestImage">
                      <img
                        src={
                          pack?.cover_url ||
                          FALLBACK_COVER
                        }
                        alt={
                          pack?.title ||
                          "MeetOutdoors paket"
                        }
                        onError={(
                          imageEvent
                        ) => {
                          imageEvent.currentTarget.src =
                            FALLBACK_COVER;
                        }}
                      />

                      <span
                        className={`bookingRequestStatus ${meta.status}`}
                      >
                        <Icon
                          name={meta.icon}
                          size={13}
                        />
                        {meta.label}
                      </span>
                    </div>

                    <div className="bookingRequestBody">
                      <div className="bookingRequestTop">
                        <div>
                          <span>
                            Booking zahtev
                          </span>

                          <h2>
                            {pack?.title ||
                              "Paket više nije dostupan"}
                          </h2>
                        </div>

                        <small>
                          {formatDate(
                            booking.created_at
                          )}
                        </small>
                      </div>

                      <p className="bookingRequestLocation">
                        <Icon
                          name="mapPin"
                          size={15}
                        />

                        {location}
                      </p>

                      <div className="bookingRequestFacts">
                        <article>
                          <Icon
                            name="users"
                            size={17}
                          />

                          <div>
                            <span>
                              Broj gostiju
                            </span>

                            <strong>
                              {booking.guests ||
                                1}
                            </strong>
                          </div>
                        </article>

                        <article>
                          <Icon
                            name="euro"
                            size={17}
                          />

                          <div>
                            <span>
                              Cena paketa
                            </span>

                            <strong>
                              €{pack?.price ||
                                0}
                            </strong>
                          </div>
                        </article>

                        <article>
                          <Icon
                            name="clock"
                            size={17}
                          />

                          <div>
                            <span>
                              Status
                            </span>

                            <strong>
                              {meta.label}
                            </strong>
                          </div>
                        </article>
                      </div>

                      <div className="bookingRequestGuestRow">
                        {userUrl ? (
                          <Link
                            to={userUrl}
                            className="bookingRequestGuest"
                          >
                            <img
                              src={
                                user?.avatar_url ||
                                FALLBACK_AVATAR
                              }
                              alt={
                                user?.full_name ||
                                username ||
                                "Korisnik"
                              }
                              onError={(
                                imageEvent
                              ) => {
                                imageEvent.currentTarget.src =
                                  FALLBACK_AVATAR;
                              }}
                            />

                            <div>
                              <span>Gost</span>

                              <strong>
                                {user?.full_name ||
                                  username ||
                                  "Nepoznat korisnik"}
                              </strong>

                              <small>
                                @{username}
                              </small>
                            </div>

                            <Icon
                              name="arrowRight"
                              size={16}
                            />
                          </Link>
                        ) : (
                          <div className="bookingRequestGuest bookingRequestGuestMissing">
                            <img
                              src={
                                FALLBACK_AVATAR
                              }
                              alt=""
                            />

                            <div>
                              <span>Gost</span>

                              <strong>
                                Korisnik nije dostupan
                              </strong>
                            </div>
                          </div>
                        )}

                        {booking.note ? (
                          <div className="bookingRequestNote">
                            <Icon
                              name="note"
                              size={17}
                            />

                            <p>
                              {booking.note}
                            </p>
                          </div>
                        ) : (
                          <div className="bookingRequestNote empty">
                            <Icon
                              name="note"
                              size={17}
                            />

                            <p>
                              Gost nije dodao
                              napomenu.
                            </p>
                          </div>
                        )}
                      </div>

                      {(booking.approved_at ||
                        booking.rejected_at) && (
                        <div className="bookingRequestHistory">
                          {booking.approved_at && (
                            <span className="approved">
                              <Icon
                                name="check"
                                size={14}
                              />
                              Odobreno{" "}
                              {formatDate(
                                booking.approved_at
                              )}
                            </span>
                          )}

                          {booking.rejected_at && (
                            <span className="rejected">
                              <Icon
                                name="close"
                                size={14}
                              />
                              Odbijeno{" "}
                              {formatDate(
                                booking.rejected_at
                              )}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="bookingRequestActions">
                        {pack?.id ? (
                          <Link
                            to={`/package/${pack.id}`}
                          >
                            Pogledaj paket

                            <Icon
                              name="arrowRight"
                              size={15}
                            />
                          </Link>
                        ) : (
                          <span className="bookingRequestDeletedPackage">
                            Paket nije dostupan
                          </span>
                        )}

                        <div>
                          {meta.status !==
                            "approved" && (
                            <button
                              type="button"
                              className="approve"
                              disabled={
                                isUpdating
                              }
                              onClick={() =>
                                updateStatus(
                                  booking,
                                  "approved"
                                )
                              }
                            >
                              <Icon
                                name="check"
                                size={16}
                              />

                              {isUpdating
                                ? "Obrada..."
                                : "Odobri"}
                            </button>
                          )}

                          {meta.status !==
                            "rejected" && (
                            <button
                              type="button"
                              className="reject"
                              disabled={
                                isUpdating
                              }
                              onClick={() =>
                                updateStatus(
                                  booking,
                                  "rejected"
                                )
                              }
                            >
                              <Icon
                                name="close"
                                size={16}
                              />

                              {isUpdating
                                ? "Obrada..."
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

          <section className="bookingRequestsSummary">
            <div>
              <span className="bookingRequestsSectionLabel">
                Brza odluka
              </span>

              <h2>
                Svaki odgovor gostu šalje
                automatsku notifikaciju.
              </h2>

              <p>
                Odobravanje i odbijanje
                ostaju povezani sa
                postojećom Supabase
                logikom.
              </p>
            </div>

            <Link to="/packages">
              Upravljaj paketima

              <Icon
                name="arrowRight"
                size={16}
              />
            </Link>
          </section>
        </section>
      </main>
    </>
  );
}

function BookingRequestsStyles() {
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
        -webkit-tap-highlight-color:
          transparent;
      }

      .bookingRequestsPage,
      .bookingRequestsStatePage {
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

      .bookingRequestsPage {
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

      .bookingRequestsPage a {
        color: inherit;
        text-decoration: none;
      }

      .bookingRequestsHero {
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
          0 34px 90px
          rgba(23, 54, 36, 0.18);
      }

      .bookingRequestsHero::before {
        position: absolute;
        top: -170px;
        right: -140px;
        z-index: -1;
        width: 550px;
        height: 550px;
        border:
          1px solid
          rgba(255, 255, 255, 0.07);
        border-radius: 50%;
        content: "";
        box-shadow:
          0 0 0 80px
            rgba(255, 255, 255, 0.02),
          0 0 0 160px
            rgba(255, 255, 255, 0.012);
      }

      .bookingRequestsHeroCopy {
        max-width: 900px;
        padding-top: 105px;
      }

      .bookingRequestsEyebrow {
        display: inline-flex;
        align-items: center;
        gap: 9px;
        padding: 9px 13px;
        border:
          1px solid
          rgba(255, 255, 255, 0.14);
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

      .bookingRequestsEyebrow > span {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #cef39a;
        box-shadow:
          0 0 0 5px
          rgba(206, 243, 154, 0.12);
      }

      .bookingRequestsHeroCopy h1 {
        margin: 24px 0 0;
        font-size:
          clamp(56px, 7.3vw, 94px);
        line-height: 0.9;
        letter-spacing: -0.075em;
      }

      .bookingRequestsHeroCopy p {
        max-width: 610px;
        margin: 25px 0 0;
        color:
          rgba(255, 255, 255, 0.63);
        font-size: 14px;
        line-height: 1.75;
      }

      .bookingRequestsHeroStats {
        position: absolute;
        right: 34px;
        bottom: 34px;
        left: 34px;
        display: grid;
        grid-template-columns:
          repeat(4, minmax(0, 1fr));
        gap: 12px;
      }

      .bookingRequestsHeroStats article {
        padding: 17px;
        border:
          1px solid
          rgba(255, 255, 255, 0.13);
        border-radius: 17px;
        background:
          rgba(12, 35, 21, 0.34);
        backdrop-filter: blur(16px);
      }

      .bookingRequestsHeroStats strong,
      .bookingRequestsHeroStats span {
        display: block;
      }

      .bookingRequestsHeroStats strong {
        font-size: 20px;
        letter-spacing: -0.03em;
      }

      .bookingRequestsHeroStats span {
        margin-top: 6px;
        color:
          rgba(255, 255, 255, 0.48);
        font-size: 8px;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .bookingRequestsContent {
        width: min(1100px, 100%);
        margin: 0 auto;
      }

      .bookingRequestsToolbar {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 20px;
        margin: 50px 0 22px;
      }

      .bookingRequestsSectionLabel {
        color: #789456;
        font-size: 9px;
        font-weight: 900;
        letter-spacing: 0.13em;
        text-transform: uppercase;
      }

      .bookingRequestsToolbar h2,
      .bookingRequestsSummary h2 {
        margin: 8px 0 0;
        color: #2f4437;
        font-size:
          clamp(34px, 5vw, 52px);
        line-height: 1;
        letter-spacing: -0.06em;
      }

      .bookingRequestsToolbar p,
      .bookingRequestsSummary p {
        margin: 10px 0 0;
        color: #7d8981;
        font-size: 10px;
        line-height: 1.65;
      }

      .bookingRequestsToolbar > button {
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

      .bookingRequestsError {
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

      .bookingRequestsError > span {
        display: grid;
        place-items: center;
        width: 34px;
        height: 34px;
        border-radius: 10px;
        background: #f8d7d3;
      }

      .bookingRequestsError p {
        margin: 0;
        font-size: 10px;
      }

      .bookingRequestsError button {
        border: 0;
        background: transparent;
        color: inherit;
        cursor: pointer;
        font-size: 9px;
        font-weight: 850;
      }

      .bookingRequestsList {
        display: grid;
        gap: 18px;
      }

      .bookingRequestCard {
        display: grid;
        grid-template-columns:
          minmax(250px, 0.38fr)
          minmax(0, 0.62fr);
        overflow: hidden;
        border: 1px solid #dbe4d8;
        border-radius: 27px;
        background:
          rgba(255, 255, 255, 0.8);
        box-shadow:
          0 16px 42px
          rgba(31, 51, 38, 0.06);
        transition: 0.22s ease;
      }

      .bookingRequestCard:hover {
        transform: translateY(-3px);
        border-color: #bdccb8;
        background: white;
        box-shadow:
          0 22px 52px
          rgba(31, 51, 38, 0.1);
      }

      .bookingRequestImage {
        position: relative;
        min-height: 390px;
        overflow: hidden;
      }

      .bookingRequestImage::after {
        position: absolute;
        inset: 0;
        background:
          linear-gradient(
            180deg,
            transparent 55%,
            rgba(11, 29, 18, 0.44)
          );
        content: "";
      }

      .bookingRequestImage img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.45s ease;
      }

      .bookingRequestCard:hover
        .bookingRequestImage img {
        transform: scale(1.035);
      }

      .bookingRequestStatus {
        position: absolute;
        top: 15px;
        left: 15px;
        z-index: 2;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-height: 30px;
        padding: 0 10px;
        border:
          1px solid
          rgba(255, 255, 255, 0.17);
        border-radius: 999px;
        background:
          rgba(19, 46, 29, 0.45);
        color: white;
        font-size: 8px;
        font-weight: 900;
        letter-spacing: 0.09em;
        text-transform: uppercase;
        backdrop-filter: blur(12px);
      }

      .bookingRequestStatus.approved {
        background:
          rgba(48, 107, 65, 0.78);
      }

      .bookingRequestStatus.rejected {
        background:
          rgba(146, 59, 49, 0.8);
      }

      .bookingRequestStatus.pending {
        background:
          rgba(139, 103, 38, 0.78);
      }

      .bookingRequestBody {
        display: flex;
        min-width: 0;
        padding: 24px;
        flex-direction: column;
      }

      .bookingRequestTop {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
      }

      .bookingRequestTop span {
        color: #789456;
        font-size: 8px;
        font-weight: 900;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }

      .bookingRequestTop h2 {
        margin: 7px 0 0;
        color: #304538;
        font-size: 27px;
        line-height: 1.05;
        letter-spacing: -0.05em;
      }

      .bookingRequestTop small {
        flex: 0 0 auto;
        color: #8f9992;
        font-size: 8px;
      }

      .bookingRequestLocation {
        display: flex;
        align-items: center;
        gap: 7px;
        margin: 10px 0 0;
        color: #77837a;
        font-size: 9px;
      }

      .bookingRequestFacts {
        display: grid;
        grid-template-columns:
          repeat(3, minmax(0, 1fr));
        gap: 9px;
        margin-top: 18px;
      }

      .bookingRequestFacts article {
        display: flex;
        align-items: center;
        gap: 9px;
        padding: 12px;
        border: 1px solid #e0e7dd;
        border-radius: 15px;
        background: #f8faf6;
        color: #67804e;
      }

      .bookingRequestFacts span,
      .bookingRequestFacts strong {
        display: block;
      }

      .bookingRequestFacts span {
        color: #8b958e;
        font-size: 7px;
      }

      .bookingRequestFacts strong {
        margin-top: 3px;
        color: #405347;
        font-size: 9px;
      }

      .bookingRequestGuestRow {
        display: grid;
        grid-template-columns:
          minmax(0, 0.9fr)
          minmax(0, 1.1fr);
        gap: 10px;
        margin-top: 14px;
      }

      .bookingRequestGuest {
        display: grid;
        grid-template-columns:
          auto minmax(0, 1fr) auto;
        align-items: center;
        gap: 11px;
        padding: 12px;
        border: 1px solid #dfe6dc;
        border-radius: 16px;
        background: #f8faf6;
      }

      .bookingRequestGuestMissing {
        grid-template-columns:
          auto minmax(0, 1fr);
      }

      .bookingRequestGuest img {
        width: 48px;
        height: 48px;
        border-radius: 14px;
        object-fit: cover;
      }

      .bookingRequestGuest span,
      .bookingRequestGuest strong,
      .bookingRequestGuest small {
        display: block;
      }

      .bookingRequestGuest span {
        color: #8b958e;
        font-size: 7px;
      }

      .bookingRequestGuest strong {
        margin-top: 3px;
        color: #3d5144;
        font-size: 10px;
      }

      .bookingRequestGuest small {
        margin-top: 2px;
        color: #8d9790;
        font-size: 8px;
      }

      .bookingRequestNote {
        display: flex;
        align-items: flex-start;
        gap: 9px;
        padding: 13px;
        border: 1px solid #e0e7dd;
        border-radius: 16px;
        background: #f8faf6;
        color: #6b8155;
      }

      .bookingRequestNote.empty {
        opacity: 0.76;
      }

      .bookingRequestNote p {
        margin: 0;
        color: #727f76;
        font-size: 9px;
        line-height: 1.6;
      }

      .bookingRequestHistory {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 14px;
      }

      .bookingRequestHistory span {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 10px;
        border-radius: 999px;
        font-size: 8px;
        font-weight: 800;
      }

      .bookingRequestHistory .approved {
        background: #e6f1df;
        color: #4e7438;
      }

      .bookingRequestHistory .rejected {
        background: #fff0ee;
        color: #a34d43;
      }

      .bookingRequestActions {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-top: auto;
        padding-top: 17px;
        border-top: 1px solid #e1e7df;
      }

      .bookingRequestActions > a,
      .bookingRequestActions button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        min-height: 41px;
        padding: 0 13px;
        border-radius: 12px;
        font-size: 9px;
        font-weight: 850;
      }

      .bookingRequestActions > a {
        border: 1px solid #d5dfd1;
        background: white;
        color: #4f6456;
      }

      .bookingRequestActions > div {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 8px;
      }

      .bookingRequestActions button {
        cursor: pointer;
      }

      .bookingRequestActions
        button.approve {
        border: 1px solid #b9d4ae;
        background: #e7f3e1;
        color: #47733d;
      }

      .bookingRequestActions
        button.reject {
        border: 1px solid #e2b2ad;
        background: #fff0ee;
        color: #a24d43;
      }

      .bookingRequestActions
        button:disabled {
        cursor: wait;
        opacity: 0.62;
      }

      .bookingRequestDeletedPackage {
        color: #8b958e;
        font-size: 9px;
      }

      .bookingRequestsEmpty {
        display: grid;
        place-items: center;
        padding: 76px 25px;
        border: 1px dashed #cad6c6;
        border-radius: 27px;
        background:
          rgba(255, 255, 255, 0.6);
        text-align: center;
      }

      .bookingRequestsEmpty > span {
        display: grid;
        place-items: center;
        width: 70px;
        height: 70px;
        border-radius: 22px;
        background: #e7f0dc;
        color: #608047;
      }

      .bookingRequestsEmpty h2 {
        margin: 19px 0 0;
        color: #34483b;
        font-size: 23px;
        letter-spacing: -0.04em;
      }

      .bookingRequestsEmpty p {
        max-width: 520px;
        margin: 10px auto 0;
        color: #869188;
        font-size: 11px;
        line-height: 1.65;
      }

      .bookingRequestsEmpty a {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        margin-top: 18px;
        min-height: 43px;
        padding: 0 15px;
        border-radius: 13px;
        background: #183a27;
        color: white !important;
        font-size: 9px;
        font-weight: 850;
      }

      .bookingRequestsSummary {
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
          0 14px 38px
          rgba(31, 51, 38, 0.05);
      }

      .bookingRequestsSummary p {
        max-width: 650px;
      }

      .bookingRequestsSummary > a {
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

      .bookingRequestsSummary > a:hover {
        gap: 11px;
        transform: translateY(-2px);
        background: #214b32;
      }

      .bookingRequestsStatePage {
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

      .bookingRequestsStateCard {
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
          0 20px 60px
          rgba(28, 48, 35, 0.08);
      }

      .bookingRequestsLoader {
        width: 38px;
        height: 38px;
        border: 3px solid #dce5d7;
        border-top-color: #52783c;
        border-radius: 50%;
        animation:
          bookingRequestsSpin
          0.8s linear infinite;
      }

      @keyframes bookingRequestsSpin {
        to {
          transform: rotate(360deg);
        }
      }

      .bookingRequestsStateIcon {
        display: grid;
        place-items: center;
        width: 64px;
        height: 64px;
        border-radius: 21px;
        background: #e7f0dc;
        color: #608047;
      }

      .bookingRequestsStateCard h1 {
        margin: 18px 0 0;
        color: #263a2f;
        font-size: 28px;
        letter-spacing: -0.04em;
      }

      .bookingRequestsStateCard p {
        max-width: 390px;
        margin: 9px 0 0;
        color: #7e8981;
        font-size: 11px;
        line-height: 1.65;
      }

      .bookingRequestsStatePrimary {
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

      @media (max-width: 930px) {
        .bookingRequestsHeroStats {
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
        }

        .bookingRequestsHero {
          min-height: 700px;
        }

        .bookingRequestCard {
          grid-template-columns: 1fr;
        }

        .bookingRequestImage {
          min-height: 300px;
        }
      }

      @media (max-width: 700px) {
        .bookingRequestsPage {
          padding: 84px 0 64px;
        }

        .bookingRequestsStatePage {
          padding-top: 84px;
        }

        .bookingRequestsHero {
          min-height: 760px;
          padding: 24px;
          border-radius:
            0 0 32px 32px;
        }

        .bookingRequestsHeroCopy {
          padding-top: 110px;
        }

        .bookingRequestsHeroStats {
          right: 24px;
          bottom: 24px;
          left: 24px;
        }

        .bookingRequestsContent {
          padding: 0 18px;
        }

        .bookingRequestsToolbar {
          align-items: flex-start;
          flex-direction: column;
        }

        .bookingRequestFacts,
        .bookingRequestGuestRow {
          grid-template-columns: 1fr;
        }

        .bookingRequestsSummary {
          align-items: flex-start;
          flex-direction: column;
        }
      }

      @media (max-width: 480px) {
        .bookingRequestsHero {
          min-height: 800px;
          padding: 19px;
        }

        .bookingRequestsHeroCopy h1 {
          font-size: 47px;
        }

        .bookingRequestsHeroStats {
          right: 19px;
          bottom: 19px;
          left: 19px;
        }

        .bookingRequestsContent {
          padding: 0 13px;
        }

        .bookingRequestBody {
          padding: 19px;
        }

        .bookingRequestTop,
        .bookingRequestActions {
          align-items: flex-start;
          flex-direction: column;
        }

        .bookingRequestActions,
        .bookingRequestActions > div,
        .bookingRequestActions > a,
        .bookingRequestActions button {
          width: 100%;
        }

        .bookingRequestsSummary {
          padding: 22px;
        }
      }

      @media (
        prefers-reduced-motion: reduce
      ) {
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
