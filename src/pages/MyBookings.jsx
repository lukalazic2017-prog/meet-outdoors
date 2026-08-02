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
  "https://api.dicebear.com/8.x/initials/svg?seed=Host";

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
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    inbox: (
      <>
        <path d="M4 4h16l2 11v5H2v-5Z" />
        <path d="M2 15h6l2 3h4l2-3h6" />
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
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    x: (
      <>
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
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

  if (normalized === "approved" || normalized === "confirmed") {
    return {
      label: "Potvrđeno",
      tone: "success",
      icon: "check",
    };
  }

  if (normalized === "rejected" || normalized === "cancelled") {
    return {
      label: normalized === "cancelled" ? "Otkazano" : "Odbijeno",
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
      <MyBookingsStyles />

      <main className="bookingsStatePage">
        <div className="bookingsStateCard">
          <span className="bookingsLoader" />
          <h1>Učitavanje rezervacija</h1>
          <p>Pripremamo pregled tvojih zahteva.</p>
        </div>
      </main>
    </>
  );
}

export default function MyBookings() {
  const { profile, loading } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadBookings = useCallback(async () => {
    if (!profile?.id) {
      setBookings([]);
      setPageLoading(false);
      return;
    }

    setPageLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("bookings")
      .select(`
        id,
        package_id,
        guests,
        note,
        status,
        created_at,
        packages:package_id (
          id,
          title,
          cover_url,
          location,
          country,
          price,
          host_id,
          profiles:host_id (
            id,
            username,
            full_name,
            avatar_url
          )
        )
      `)
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Greška pri učitavanju rezervacija:", error);
      setMessage(
        error.message ||
          "Rezervacije trenutno nije moguće učitati."
      );
      setBookings([]);
    } else {
      setBookings(data || []);
    }

    setPageLoading(false);
  }, [profile?.id]);

  useEffect(() => {
    if (loading) return;

    loadBookings();
  }, [loading, loadBookings]);

  const counts = useMemo(
    () =>
      bookings.reduce(
        (result, booking) => {
          const status = String(
            booking.status || ""
          ).toLowerCase();

          if (
            status === "approved" ||
            status === "confirmed"
          ) {
            result.confirmed += 1;
          } else if (
            status === "rejected" ||
            status === "cancelled"
          ) {
            result.closed += 1;
          } else {
            result.pending += 1;
          }

          return result;
        },
        {
          pending: 0,
          confirmed: 0,
          closed: 0,
        }
      ),
    [bookings]
  );

  if (loading || pageLoading) {
    return <LoadingState />;
  }

  if (!profile) {
    return (
      <>
        <MyBookingsStyles />

        <main className="bookingsStatePage">
          <div className="bookingsStateCard">
            <span className="bookingsStateIcon">
              <Icon name="user" size={28} />
            </span>

            <h1>Prijavi se da vidiš rezervacije</h1>

            <p>
              Pregled tvojih zahteva za rezervaciju dostupan je
              samo prijavljenim korisnicima.
            </p>

            <Link
              to="/login"
              className="bookingsStatePrimary"
            >
              Prijavi se
              <Icon name="arrowRight" size={16} />
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <MyBookingsStyles />

      <main className="bookingsPage">
        <section className="bookingsHero">
          <div className="bookingsHeroCopy">
            <span className="bookingsEyebrow">
              <span />
              Moje rezervacije
            </span>

            <h1>
              Tvoji planovi.
              <br />
              Jedan pregled.
            </h1>

            <p>
              Prati status zahteva, organizatore i detalje
              paketa koje želiš da rezervišeš.
            </p>
          </div>

          <div className="bookingsHeroStats">
            <article>
              <strong>{bookings.length}</strong>
              <span>ukupno zahteva</span>
            </article>

            <article>
              <strong>{counts.pending}</strong>
              <span>na čekanju</span>
            </article>

            <article>
              <strong>{counts.confirmed}</strong>
              <span>potvrđenih</span>
            </article>

            <article>
              <strong>{counts.closed}</strong>
              <span>zatvorenih</span>
            </article>
          </div>
        </section>

        <section className="bookingsContent">
          <header className="bookingsToolbar">
            <div>
              <span className="bookingsSectionLabel">
                Status rezervacija
              </span>

              <h2>Aktivni zahtevi.</h2>

              <p>
                Sve rezervacije prikazane su od najnovije.
              </p>
            </div>

            <button
              type="button"
              onClick={loadBookings}
            >
              <Icon name="refresh" size={16} />
              Osveži
            </button>
          </header>

          {message && (
            <div
              className="bookingsError"
              role="alert"
            >
              <span>
                <Icon name="alert" size={18} />
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
            <section className="bookingsEmpty">
              <span>
                <Icon name="inbox" size={31} />
              </span>

              <h2>Još nema rezervacija.</h2>

              <p>
                Izaberi paket, pošalji zahtev i ovde ćeš
                pratiti njegov status.
              </p>

              <Link to="/packages">
                Pregledaj pakete
                <Icon name="arrowRight" size={16} />
              </Link>
            </section>
          ) : (
            <section className="bookingsList">
              {bookings.map((booking) => {
                const pack = booking.packages;
                const host = pack?.profiles;
                const meta = statusMeta(booking.status);

                return (
                  <article
                    key={booking.id}
                    className="bookingCard"
                  >
                    <div className="bookingImageWrap">
                      <img
                        src={
                          pack?.cover_url ||
                          FALLBACK_COVER
                        }
                        alt={
                          pack?.title || "Package"
                        }
                      />

                      <span
                        className={`bookingStatus ${meta.tone}`}
                      >
                        <Icon
                          name={meta.icon}
                          size={14}
                        />
                        {meta.label}
                      </span>
                    </div>

                    <div className="bookingBody">
                      <div className="bookingTop">
                        <div>
                          <span className="bookingKicker">
                            Paket rezervacija
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

                      <div className="bookingMetaGrid">
                        <article>
                          <Icon
                            name="mapPin"
                            size={17}
                          />

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
                          <Icon
                            name="users"
                            size={17}
                          />

                          <div>
                            <span>Broj gostiju</span>
                            <strong>
                              {booking.guests || 1}
                            </strong>
                          </div>
                        </article>

                        <article>
                          <Icon
                            name="package"
                            size={17}
                          />

                          <div>
                            <span>Cena paketa</span>
                            <strong>
                              €{pack?.price || 0}
                            </strong>
                          </div>
                        </article>
                      </div>

                      {booking.note && (
                        <div className="bookingNote">
                          <span>Napomena</span>
                          <p>{booking.note}</p>
                        </div>
                      )}

                      <div className="bookingFooter">
                        {host ? (
                          <Link
                            to={`/h/${host.username}`}
                            className="bookingHost"
                          >
                            <img
                              src={
                                host.avatar_url ||
                                FALLBACK_AVATAR
                              }
                              alt={
                                host.full_name ||
                                host.username
                              }
                            />

                            <div>
                              <span>Organizator</span>

                              <strong>
                                {host.full_name ||
                                  host.username}
                              </strong>

                              <small>
                                @{host.username}
                              </small>
                            </div>
                          </Link>
                        ) : (
                          <div className="bookingHostMissing">
                            Organizator nije dostupan
                          </div>
                        )}

                        {pack && (
                          <Link
                            to={`/package/${pack.id}`}
                            className="bookingPackageLink"
                          >
                            Pogledaj paket
                            <Icon
                              name="arrowRight"
                              size={16}
                            />
                          </Link>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>
          )}

          <section className="bookingsExploreCard">
            <div>
              <span className="bookingsSectionLabel">
                Nova avantura
              </span>

              <h2>
                Još paketa čeka na tvoju rezervaciju.
              </h2>

              <p>
                Istraži ponudu organizatora i pronađi sledeće
                iskustvo koje odgovara tvom tempu.
              </p>
            </div>

            <Link to="/packages">
              Pregledaj pakete
              <Icon name="arrowRight" size={16} />
            </Link>
          </section>
        </section>
      </main>
    </>
  );
}

function MyBookingsStyles() {
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

      .bookingsPage,
      .bookingsStatePage {
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

      .bookingsPage {
        padding: 118px 28px 28px;
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

      .bookingsPage a {
        color: inherit;
        text-decoration: none;
      }

      .bookingsHero {
        position: relative;
        isolation: isolate;
        width: min(1200px, 100%);
        min-height: 600px;
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

      .bookingsHero::before {
        position: absolute;
        top: -170px;
        right: -140px;
        z-index: -1;
        width: 550px;
        height: 550px;
        border: 1px solid rgba(255, 255, 255, 0.07);
        border-radius: 50%;
        content: "";
        box-shadow:
          0 0 0 80px rgba(255, 255, 255, 0.02),
          0 0 0 160px rgba(255, 255, 255, 0.012);
      }

      .bookingsHeroCopy {
        max-width: 860px;
        padding-top: 102px;
      }

      .bookingsEyebrow {
        display: inline-flex;
        align-items: center;
        gap: 9px;
        padding: 9px 13px;
        border: 1px solid rgba(255, 255, 255, 0.14);
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.07);
        color: rgba(255, 255, 255, 0.76);
        font-size: 9px;
        font-weight: 900;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        backdrop-filter: blur(13px);
      }

      .bookingsEyebrow > span {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #cef39a;
        box-shadow:
          0 0 0 5px rgba(206, 243, 154, 0.12);
      }

      .bookingsHeroCopy h1 {
        margin: 24px 0 0;
        font-size: clamp(58px, 7.4vw, 96px);
        line-height: 0.9;
        letter-spacing: -0.075em;
      }

      .bookingsHeroCopy p {
        max-width: 590px;
        margin: 25px 0 0;
        color: rgba(255, 255, 255, 0.63);
        font-size: 14px;
        line-height: 1.75;
      }

      .bookingsHeroStats {
        position: absolute;
        right: 34px;
        bottom: 34px;
        left: 34px;
        display: grid;
        grid-template-columns:
          repeat(4, minmax(0, 1fr));
        gap: 12px;
      }

      .bookingsHeroStats article {
        padding: 17px;
        border: 1px solid rgba(255, 255, 255, 0.13);
        border-radius: 17px;
        background: rgba(12, 35, 21, 0.34);
        backdrop-filter: blur(16px);
      }

      .bookingsHeroStats strong,
      .bookingsHeroStats span {
        display: block;
      }

      .bookingsHeroStats strong {
        font-size: 19px;
        letter-spacing: -0.03em;
      }

      .bookingsHeroStats span {
        margin-top: 6px;
        color: rgba(255, 255, 255, 0.48);
        font-size: 8px;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .bookingsContent {
        width: min(1080px, 100%);
        margin: 0 auto;
      }

      .bookingsToolbar {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 20px;
        margin: 50px 0 22px;
      }

      .bookingsSectionLabel {
        color: #789456;
        font-size: 9px;
        font-weight: 900;
        letter-spacing: 0.13em;
        text-transform: uppercase;
      }

      .bookingsToolbar h2,
      .bookingsExploreCard h2 {
        margin: 8px 0 0;
        color: #2f4437;
        font-size: clamp(34px, 5vw, 52px);
        line-height: 1;
        letter-spacing: -0.06em;
      }

      .bookingsToolbar p {
        margin: 10px 0 0;
        color: #7d8981;
        font-size: 10px;
      }

      .bookingsToolbar > button {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        min-height: 43px;
        padding: 0 15px;
        border: 1px solid #d5dfd1;
        border-radius: 13px;
        background: rgba(255, 255, 255, 0.8);
        color: #4c6255;
        cursor: pointer;
        font-size: 9px;
        font-weight: 850;
      }

      .bookingsError {
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

      .bookingsError > span {
        display: grid;
        place-items: center;
        width: 34px;
        height: 34px;
        border-radius: 10px;
        background: #f8d7d3;
      }

      .bookingsError p {
        margin: 0;
        font-size: 10px;
      }

      .bookingsError button {
        border: 0;
        background: transparent;
        color: inherit;
        cursor: pointer;
        font-size: 9px;
        font-weight: 850;
      }

      .bookingsList {
        display: grid;
        gap: 18px;
      }

      .bookingCard {
        display: grid;
        grid-template-columns:
          minmax(250px, 0.68fr)
          minmax(0, 1.32fr);
        overflow: hidden;
        border: 1px solid #dbe4d8;
        border-radius: 27px;
        background: rgba(255, 255, 255, 0.8);
        box-shadow:
          0 16px 42px rgba(31, 51, 38, 0.06);
        transition: 0.22s ease;
      }

      .bookingCard:hover {
        border-color: #bccbb7;
        background: white;
        box-shadow:
          0 23px 52px rgba(31, 51, 38, 0.1);
        transform: translateY(-3px);
      }

      .bookingImageWrap {
        position: relative;
        min-height: 320px;
        overflow: hidden;
      }

      .bookingImageWrap::after {
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

      .bookingImageWrap img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.45s ease;
      }

      .bookingCard:hover
        .bookingImageWrap img {
        transform: scale(1.035);
      }

      .bookingStatus {
        position: absolute;
        top: 16px;
        left: 16px;
        z-index: 2;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-height: 34px;
        padding: 0 11px;
        border: 1px solid rgba(255, 255, 255, 0.22);
        border-radius: 999px;
        backdrop-filter: blur(13px);
        font-size: 8px;
        font-weight: 900;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .bookingStatus.pending {
        background: rgba(119, 91, 27, 0.56);
        color: #ffeab2;
      }

      .bookingStatus.success {
        background: rgba(42, 92, 48, 0.58);
        color: #d7f5be;
      }

      .bookingStatus.danger {
        background: rgba(114, 48, 43, 0.58);
        color: #ffd5d1;
      }

      .bookingBody {
        display: flex;
        min-width: 0;
        padding: 24px;
        flex-direction: column;
      }

      .bookingTop {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 20px;
      }

      .bookingKicker {
        color: #789456;
        font-size: 8px;
        font-weight: 900;
        letter-spacing: 0.11em;
        text-transform: uppercase;
      }

      .bookingTop h2 {
        margin: 9px 0 0;
        color: #304538;
        font-size: 29px;
        line-height: 1.05;
        letter-spacing: -0.05em;
      }

      .bookingTop > small {
        flex: 0 0 auto;
        color: #929b95;
        font-size: 8px;
      }

      .bookingMetaGrid {
        display: grid;
        grid-template-columns:
          repeat(3, minmax(0, 1fr));
        gap: 10px;
        margin-top: 22px;
      }

      .bookingMetaGrid article {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 13px;
        border: 1px solid #e0e7dd;
        border-radius: 15px;
        background: #f8faf6;
        color: #66804d;
      }

      .bookingMetaGrid span,
      .bookingMetaGrid strong {
        display: block;
      }

      .bookingMetaGrid span {
        color: #8b958e;
        font-size: 8px;
      }

      .bookingMetaGrid strong {
        margin-top: 3px;
        color: #405347;
        font-size: 9px;
        line-height: 1.35;
      }

      .bookingNote {
        margin-top: 15px;
        padding: 14px;
        border: 1px solid #e2e8df;
        border-radius: 15px;
        background: #fbfcfa;
      }

      .bookingNote > span {
        color: #789456;
        font-size: 8px;
        font-weight: 900;
        letter-spacing: 0.09em;
        text-transform: uppercase;
      }

      .bookingNote p {
        margin: 7px 0 0;
        color: #6f7b73;
        font-size: 10px;
        line-height: 1.65;
      }

      .bookingFooter {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 18px;
        margin-top: auto;
        padding-top: 20px;
      }

      .bookingHost {
        display: grid;
        grid-template-columns:
          auto minmax(0, 1fr);
        align-items: center;
        gap: 11px;
        min-width: 0;
      }

      .bookingHost img {
        width: 51px;
        height: 51px;
        border-radius: 15px;
        object-fit: cover;
      }

      .bookingHost span,
      .bookingHost strong,
      .bookingHost small {
        display: block;
      }

      .bookingHost span {
        color: #929b95;
        font-size: 7px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .bookingHost strong {
        margin-top: 4px;
        color: #3d5144;
        font-size: 10px;
      }

      .bookingHost small {
        margin-top: 3px;
        color: #8b958e;
        font-size: 8px;
      }

      .bookingHostMissing {
        color: #8b958e;
        font-size: 9px;
      }

      .bookingPackageLink {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        flex: 0 0 auto;
        min-height: 42px;
        padding: 0 14px;
        border: 1px solid #244d34;
        border-radius: 13px;
        background: #183a27;
        color: white !important;
        font-size: 9px;
        font-weight: 850;
        transition: 0.2s ease;
      }

      .bookingPackageLink:hover {
        gap: 10px;
        transform: translateY(-2px);
        background: #214b32;
      }

      .bookingsEmpty {
        display: grid;
        place-items: center;
        padding: 76px 25px;
        border: 1px dashed #cad6c6;
        border-radius: 27px;
        background: rgba(255, 255, 255, 0.6);
        text-align: center;
      }

      .bookingsEmpty > span {
        display: grid;
        place-items: center;
        width: 70px;
        height: 70px;
        border-radius: 22px;
        background: #e7f0dc;
        color: #608047;
      }

      .bookingsEmpty h2 {
        margin: 19px 0 0;
        color: #34483b;
        font-size: 23px;
        letter-spacing: -0.04em;
      }

      .bookingsEmpty p {
        max-width: 520px;
        margin: 10px auto 0;
        color: #869188;
        font-size: 11px;
        line-height: 1.65;
      }

      .bookingsEmpty a,
      .bookingsStatePrimary {
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

      .bookingsExploreCard {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 30px;
        margin-top: 24px;
        padding: 31px;
        border: 1px solid #dbe4d8;
        border-radius: 27px;
        background: rgba(255, 255, 255, 0.72);
        box-shadow:
          0 14px 38px rgba(31, 51, 38, 0.05);
      }

      .bookingsExploreCard p {
        max-width: 650px;
        margin: 13px 0 0;
        color: #7d8981;
        font-size: 11px;
        line-height: 1.7;
      }

      .bookingsExploreCard > a {
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

      .bookingsExploreCard > a:hover {
        gap: 11px;
        transform: translateY(-2px);
        background: #214b32;
      }

      .bookingsStatePage {
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

      .bookingsStateCard {
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

      .bookingsLoader {
        width: 38px;
        height: 38px;
        border: 3px solid #dce5d7;
        border-top-color: #52783c;
        border-radius: 50%;
        animation:
          bookingsSpin 0.8s linear infinite;
      }

      @keyframes bookingsSpin {
        to {
          transform: rotate(360deg);
        }
      }

      .bookingsStateIcon {
        display: grid;
        place-items: center;
        width: 64px;
        height: 64px;
        border-radius: 21px;
        background: #e7f0dc;
        color: #608047;
      }

      .bookingsStateCard h1 {
        margin: 18px 0 0;
        color: #263a2f;
        font-size: 28px;
        letter-spacing: -0.04em;
      }

      .bookingsStateCard p {
        max-width: 390px;
        margin: 9px 0 0;
        color: #7e8981;
        font-size: 11px;
        line-height: 1.65;
      }

      @media (max-width: 940px) {
        .bookingCard {
          grid-template-columns: 1fr;
        }

        .bookingImageWrap {
          min-height: 270px;
        }

        .bookingsHeroStats {
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
        }

        .bookingsHero {
          min-height: 700px;
        }
      }

      @media (max-width: 700px) {
        .bookingsPage {
          padding: 84px 0 64px;
        }

        .bookingsStatePage {
          padding-top: 84px;
        }

        .bookingsHero {
          min-height: 720px;
          padding: 24px;
          border-radius: 0 0 32px 32px;
        }

        .bookingsHeroCopy {
          padding-top: 110px;
        }

        .bookingsHeroStats {
          right: 24px;
          bottom: 24px;
          left: 24px;
        }

        .bookingsContent {
          padding: 0 18px;
        }

        .bookingsToolbar {
          align-items: flex-start;
          flex-direction: column;
        }

        .bookingMetaGrid {
          grid-template-columns: 1fr;
        }

        .bookingsExploreCard {
          align-items: flex-start;
          flex-direction: column;
        }
      }

      @media (max-width: 480px) {
        .bookingsHero {
          min-height: 760px;
          padding: 19px;
        }

        .bookingsHeroCopy h1 {
          font-size: 49px;
        }

        .bookingsHeroStats {
          right: 19px;
          bottom: 19px;
          left: 19px;
        }

        .bookingsContent {
          padding: 0 13px;
        }

        .bookingBody {
          padding: 20px;
        }

        .bookingTop,
        .bookingFooter {
          align-items: flex-start;
          flex-direction: column;
        }

        .bookingPackageLink {
          width: 100%;
        }

        .bookingsExploreCard {
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
