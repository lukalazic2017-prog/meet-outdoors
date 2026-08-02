import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";

const FALLBACK_AVATAR =
  "https://api.dicebear.com/8.x/initials/svg?seed=User";

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1600&auto=format&fit=crop";

function Icon({ name, size = 20, strokeWidth = 2 }) {
  const icons = {
    users: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20v-2a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v2" />
        <path d="M16 4.5a3 3 0 0 1 0 6M17 13a5 5 0 0 1 4 5v2" />
      </>
    ),
    mapPin: (
      <>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </>
    ),
    arrowRight: (
      <>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </>
    ),
    arrowLeft: (
      <>
        <path d="M19 12H5" />
        <path d="m11 18-6-6 6-6" />
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
    heart: (
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
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

function LoadingState() {
  return (
    <>
      <InterestedUsersStyles />

      <main className="interestedUsersStatePage">
        <div className="interestedUsersStateCard">
          <span className="interestedUsersLoader" />
          <h1>Učitavanje zainteresovanih</h1>
          <p>Pripremamo listu korisnika za ovaj događaj.</p>
        </div>
      </main>
    </>
  );
}

export default function InterestedUsers() {
  const { id } = useParams();
  const { profile } = useAuth();

  const [event, setEvent] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [error, setError] = useState("");

  const loadInterestedUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    const {
      data: eventData,
      error: eventError,
    } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .single();

    if (eventError || !eventData) {
      setEvent(null);
      setUsers([]);
      setAllowed(false);
      setError(
        eventError?.message || "Događaj nije pronađen."
      );
      setLoading(false);
      return;
    }

    setEvent(eventData);

    const isOwner =
      profile?.id === eventData.host_id;

    setAllowed(isOwner);

    if (!isOwner) {
      setUsers([]);
      setLoading(false);
      return;
    }

    const {
      data,
      error: usersError,
    } = await supabase
      .from("event_interested")
      .select(`
        id,
        created_at,
        profiles:user_id (
          id,
          role,
          username,
          full_name,
          avatar_url,
          city,
          country
        )
      `)
      .eq("event_id", id)
      .order("created_at", {
        ascending: false,
      });

    if (usersError) {
      console.error(
        "Greška pri učitavanju zainteresovanih korisnika:",
        usersError
      );
      setUsers([]);
      setError(
        usersError.message ||
          "Zainteresovane korisnike trenutno nije moguće učitati."
      );
    } else {
      setUsers(data || []);
    }

    setLoading(false);
  }, [id, profile?.id]);

  useEffect(() => {
    loadInterestedUsers();
  }, [loadInterestedUsers]);

  const validUsers = useMemo(
    () =>
      users.filter(
        (item) => item.profiles
      ),
    [users]
  );

  const locationsCount = useMemo(() => {
    const locations = new Set(
      validUsers
        .map((item) =>
          [
            item.profiles?.city,
            item.profiles?.country,
          ]
            .filter(Boolean)
            .join(", ")
        )
        .filter(Boolean)
    );

    return locations.size;
  }, [validUsers]);

  if (loading) {
    return <LoadingState />;
  }

  if (!event) {
    return (
      <>
        <InterestedUsersStyles />

        <main className="interestedUsersStatePage">
          <div className="interestedUsersStateCard">
            <span className="interestedUsersStateIcon danger">
              <Icon name="alert" size={28} />
            </span>

            <h1>Događaj nije pronađen</h1>

            <p>
              {error ||
                "Ovaj događaj ne postoji ili više nije dostupan."}
            </p>

            <div className="interestedUsersStateActions">
              <button
                type="button"
                onClick={loadInterestedUsers}
              >
                <Icon
                  name="refresh"
                  size={16}
                />
                Pokušaj ponovo
              </button>

              <Link to="/events">
                <Icon
                  name="arrowLeft"
                  size={16}
                />
                Svi događaji
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (!allowed) {
    return (
      <>
        <InterestedUsersStyles />

        <main className="interestedUsersStatePage">
          <div className="interestedUsersStateCard">
            <span className="interestedUsersStateIcon">
              <Icon name="shield" size={28} />
            </span>

            <h1>Pristup nije dozvoljen</h1>

            <p>
              Samo organizator ovog događaja može da vidi listu
              zainteresovanih korisnika.
            </p>

            <Link
              to={`/event/${id}`}
              className="interestedUsersStatePrimary"
            >
              Nazad na događaj
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
      <InterestedUsersStyles />

      <main className="interestedUsersPage">
        <section
          className="interestedUsersHero"
          style={{
            backgroundImage: `linear-gradient(
              180deg,
              rgba(6, 20, 12, 0.1),
              rgba(6, 20, 12, 0.84)
            ), url(${event.cover_url || FALLBACK_COVER})`,
          }}
        >
          <div className="interestedUsersHeroCopy">
            <span className="interestedUsersEyebrow">
              <span />
              Host pregled
            </span>

            <h1>
              Ljudi koji žele
              <br />
              da budu deo priče.
            </h1>

            <p>
              Pregledaj korisnike zainteresovane za događaj
              <strong> {event.title}</strong>.
            </p>
          </div>

          <div className="interestedUsersHeroStats">
            <article>
              <strong>
                {validUsers.length}
              </strong>
              <span>zainteresovanih</span>
            </article>

            <article>
              <strong>
                {locationsCount}
              </strong>
              <span>različitih lokacija</span>
            </article>

            <article>
              <strong>
                {validUsers.length
                  ? formatDate(
                      validUsers[0].created_at
                    )
                  : "—"}
              </strong>
              <span>
                poslednje interesovanje
              </span>
            </article>
          </div>
        </section>

        <section className="interestedUsersContent">
          <header className="interestedUsersToolbar">
            <div>
              <span className="interestedUsersSectionLabel">
                Zainteresovani korisnici
              </span>

              <h2>{event.title}</h2>

              <p>
                Otvori profil korisnika za više informacija.
              </p>
            </div>

            <button
              type="button"
              onClick={loadInterestedUsers}
            >
              <Icon
                name="refresh"
                size={16}
              />
              Osveži
            </button>
          </header>

          {error && (
            <div
              className="interestedUsersError"
              role="alert"
            >
              <span>
                <Icon name="alert" size={18} />
              </span>

              <p>{error}</p>

              <button
                type="button"
                onClick={loadInterestedUsers}
              >
                Pokušaj ponovo
              </button>
            </div>
          )}

          {validUsers.length === 0 ? (
            <section className="interestedUsersEmpty">
              <span>
                <Icon name="users" size={31} />
              </span>

              <h2>
                Još nema zainteresovanih korisnika.
              </h2>

              <p>
                Kada neko označi događaj kao zanimljiv, njegov
                profil će se pojaviti ovde.
              </p>

              <Link to={`/event/${id}`}>
                Pogledaj događaj
                <Icon
                  name="arrowRight"
                  size={16}
                />
              </Link>
            </section>
          ) : (
            <section className="interestedUsersGrid">
              {validUsers.map((item) => {
                const user = item.profiles;

                const profileUrl =
                  user?.role === "host"
                    ? `/h/${user.username}`
                    : `/u/${user?.username}`;

                const location =
                  [
                    user?.city,
                    user?.country,
                  ]
                    .filter(Boolean)
                    .join(", ") ||
                  "Lokacija nije dodata";

                return (
                  <Link
                    key={item.id}
                    to={profileUrl}
                    className="interestedUserCard"
                  >
                    <div className="interestedUserAvatarWrap">
                      <img
                        src={
                          user?.avatar_url ||
                          FALLBACK_AVATAR
                        }
                        alt={
                          user?.full_name ||
                          user?.username ||
                          "User"
                        }
                      />

                      <span>
                        <Icon
                          name="heart"
                          size={15}
                        />
                      </span>
                    </div>

                    <div className="interestedUserBody">
                      <span className="interestedUserRole">
                        {user?.role === "host"
                          ? "Host"
                          : "Outdoor član"}
                      </span>

                      <h2>
                        {user?.full_name ||
                          user?.username ||
                          "Nepoznat korisnik"}
                      </h2>

                      <p className="interestedUserUsername">
                        @{user?.username}
                      </p>

                      <div className="interestedUserMeta">
                        <span>
                          <Icon
                            name="mapPin"
                            size={15}
                          />
                          {location}
                        </span>

                        <span>
                          <Icon
                            name="calendar"
                            size={15}
                          />
                          {formatDate(
                            item.created_at
                          )}
                        </span>
                      </div>

                      <div className="interestedUserFooter">
                        <span>
                          Pogledaj profil
                        </span>

                        <Icon
                          name="arrowRight"
                          size={16}
                        />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </section>
          )}

          <section className="interestedUsersSummary">
            <div>
              <span className="interestedUsersSectionLabel">
                Host pregled
              </span>

              <h2>
                Interesovanje koje možeš da pretvoriš u zajednicu.
              </h2>

              <p>
                Iskoristi ovu listu kao brz pregled publike koja
                prati tvoj događaj.
              </p>
            </div>

            <Link to={`/event/${id}`}>
              Otvori događaj
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

function InterestedUsersStyles() {
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

      .interestedUsersPage,
      .interestedUsersStatePage {
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

      .interestedUsersPage {
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

      .interestedUsersPage a {
        color: inherit;
        text-decoration: none;
      }

      .interestedUsersHero {
        position: relative;
        isolation: isolate;
        width: min(1200px, 100%);
        min-height: 610px;
        margin: 0 auto;
        padding: 34px;
        overflow: hidden;
        border-radius: 36px;
        background-position: center;
        background-size: cover;
        color: white;
        box-shadow:
          0 34px 90px rgba(23, 54, 36, 0.18);
      }

      .interestedUsersHero::before {
        position: absolute;
        inset: 0;
        z-index: -1;
        background:
          linear-gradient(
            180deg,
            rgba(7, 22, 13, 0.02),
            rgba(7, 22, 13, 0.48)
          );
        content: "";
      }

      .interestedUsersHeroCopy {
        max-width: 850px;
        padding-top: 112px;
      }

      .interestedUsersEyebrow {
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

      .interestedUsersEyebrow > span {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #cef39a;
        box-shadow:
          0 0 0 5px rgba(206, 243, 154, 0.12);
      }

      .interestedUsersHeroCopy h1 {
        margin: 24px 0 0;
        font-size:
          clamp(56px, 7.3vw, 94px);
        line-height: 0.9;
        letter-spacing: -0.075em;
      }

      .interestedUsersHeroCopy p {
        max-width: 610px;
        margin: 25px 0 0;
        color: rgba(255, 255, 255, 0.65);
        font-size: 14px;
        line-height: 1.75;
      }

      .interestedUsersHeroCopy strong {
        color: white;
      }

      .interestedUsersHeroStats {
        position: absolute;
        right: 34px;
        bottom: 34px;
        left: 34px;
        display: grid;
        grid-template-columns:
          repeat(3, minmax(0, 1fr));
        gap: 12px;
      }

      .interestedUsersHeroStats article {
        padding: 17px;
        border:
          1px solid rgba(255, 255, 255, 0.13);
        border-radius: 17px;
        background:
          rgba(12, 35, 21, 0.34);
        backdrop-filter: blur(16px);
      }

      .interestedUsersHeroStats strong,
      .interestedUsersHeroStats span {
        display: block;
      }

      .interestedUsersHeroStats strong {
        font-size: 18px;
        letter-spacing: -0.03em;
      }

      .interestedUsersHeroStats span {
        margin-top: 6px;
        color:
          rgba(255, 255, 255, 0.48);
        font-size: 8px;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .interestedUsersContent {
        width: min(1080px, 100%);
        margin: 0 auto;
      }

      .interestedUsersToolbar {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 20px;
        margin: 50px 0 22px;
      }

      .interestedUsersSectionLabel {
        color: #789456;
        font-size: 9px;
        font-weight: 900;
        letter-spacing: 0.13em;
        text-transform: uppercase;
      }

      .interestedUsersToolbar h2,
      .interestedUsersSummary h2 {
        margin: 8px 0 0;
        color: #2f4437;
        font-size:
          clamp(34px, 5vw, 52px);
        line-height: 1;
        letter-spacing: -0.06em;
      }

      .interestedUsersToolbar p {
        margin: 10px 0 0;
        color: #7d8981;
        font-size: 10px;
      }

      .interestedUsersToolbar > button {
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

      .interestedUsersError {
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

      .interestedUsersError > span {
        display: grid;
        place-items: center;
        width: 34px;
        height: 34px;
        border-radius: 10px;
        background: #f8d7d3;
      }

      .interestedUsersError p {
        margin: 0;
        font-size: 10px;
      }

      .interestedUsersError button {
        border: 0;
        background: transparent;
        color: inherit;
        cursor: pointer;
        font-size: 9px;
        font-weight: 850;
      }

      .interestedUsersGrid {
        display: grid;
        grid-template-columns:
          repeat(
            auto-fit,
            minmax(280px, 1fr)
          );
        gap: 18px;
      }

      .interestedUserCard {
        display: flex;
        align-items: center;
        gap: 18px;
        padding: 18px;
        border: 1px solid #dbe4d8;
        border-radius: 25px;
        background:
          rgba(255, 255, 255, 0.78);
        box-shadow:
          0 14px 38px rgba(31, 51, 38, 0.05);
        transition: 0.22s ease;
      }

      .interestedUserCard:hover {
        transform: translateY(-4px);
        border-color: #bccbb7;
        background: white;
        box-shadow:
          0 22px 48px rgba(31, 51, 38, 0.1);
      }

      .interestedUserAvatarWrap {
        position: relative;
        flex: 0 0 auto;
      }

      .interestedUserAvatarWrap img {
        display: block;
        width: 86px;
        height: 86px;
        border-radius: 24px;
        background: #e7eee3;
        object-fit: cover;
      }

      .interestedUserAvatarWrap > span {
        position: absolute;
        right: -6px;
        bottom: -5px;
        display: grid;
        place-items: center;
        width: 34px;
        height: 34px;
        border: 4px solid white;
        border-radius: 50%;
        background: #284f37;
        color: #ffd2cd;
      }

      .interestedUserBody {
        min-width: 0;
        flex: 1;
      }

      .interestedUserRole {
        display: inline-flex;
        min-height: 25px;
        align-items: center;
        padding: 0 9px;
        border-radius: 999px;
        background: #e7f0dc;
        color: #5c7941;
        font-size: 7px;
        font-weight: 900;
        letter-spacing: 0.09em;
        text-transform: uppercase;
      }

      .interestedUserBody h2 {
        margin: 9px 0 0;
        overflow: hidden;
        color: #304538;
        font-size: 21px;
        line-height: 1.1;
        letter-spacing: -0.04em;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .interestedUserUsername {
        margin: 5px 0 0;
        color: #8b958e;
        font-size: 9px;
        font-weight: 700;
      }

      .interestedUserMeta {
        display: grid;
        gap: 7px;
        margin-top: 13px;
      }

      .interestedUserMeta span {
        display: flex;
        align-items: center;
        gap: 7px;
        color: #68766d;
        font-size: 8px;
      }

      .interestedUserMeta svg {
        color: #789456;
      }

      .interestedUserFooter {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-top: 13px;
        padding-top: 12px;
        border-top: 1px solid #e4e9e1;
        color: #48604f;
        font-size: 8px;
        font-weight: 850;
      }

      .interestedUsersEmpty {
        display: grid;
        place-items: center;
        padding: 76px 25px;
        border: 1px dashed #cad6c6;
        border-radius: 27px;
        background:
          rgba(255, 255, 255, 0.6);
        text-align: center;
      }

      .interestedUsersEmpty > span {
        display: grid;
        place-items: center;
        width: 70px;
        height: 70px;
        border-radius: 22px;
        background: #e7f0dc;
        color: #608047;
      }

      .interestedUsersEmpty h2 {
        margin: 19px 0 0;
        color: #34483b;
        font-size: 23px;
        letter-spacing: -0.04em;
      }

      .interestedUsersEmpty p {
        max-width: 520px;
        margin: 10px auto 0;
        color: #869188;
        font-size: 11px;
        line-height: 1.65;
      }

      .interestedUsersEmpty a,
      .interestedUsersStatePrimary {
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

      .interestedUsersSummary {
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

      .interestedUsersSummary p {
        max-width: 650px;
        margin: 13px 0 0;
        color: #7d8981;
        font-size: 11px;
        line-height: 1.7;
      }

      .interestedUsersSummary > a {
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

      .interestedUsersSummary > a:hover {
        gap: 11px;
        transform: translateY(-2px);
        background: #214b32;
      }

      .interestedUsersStatePage {
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

      .interestedUsersStateCard {
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

      .interestedUsersLoader {
        width: 38px;
        height: 38px;
        border: 3px solid #dce5d7;
        border-top-color: #52783c;
        border-radius: 50%;
        animation:
          interestedUsersSpin 0.8s linear infinite;
      }

      @keyframes interestedUsersSpin {
        to {
          transform: rotate(360deg);
        }
      }

      .interestedUsersStateIcon {
        display: grid;
        place-items: center;
        width: 64px;
        height: 64px;
        border-radius: 21px;
        background: #e7f0dc;
        color: #608047;
      }

      .interestedUsersStateIcon.danger {
        background: #ffe9e5;
        color: #a85247;
      }

      .interestedUsersStateCard h1 {
        margin: 18px 0 0;
        color: #263a2f;
        font-size: 28px;
        letter-spacing: -0.04em;
      }

      .interestedUsersStateCard p {
        max-width: 390px;
        margin: 9px 0 0;
        color: #7e8981;
        font-size: 11px;
        line-height: 1.65;
      }

      .interestedUsersStateActions {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 9px;
        margin-top: 20px;
      }

      .interestedUsersStateActions button,
      .interestedUsersStateActions a {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        min-height: 42px;
        padding: 0 14px;
        border-radius: 12px;
        font-size: 10px;
        font-weight: 850;
      }

      .interestedUsersStateActions button {
        border: 0;
        background: #183a27;
        color: white;
        cursor: pointer;
      }

      .interestedUsersStateActions a {
        border: 1px solid #d5ded2;
        background: white;
        color: #51665a;
        text-decoration: none;
      }

      @media (max-width: 820px) {
        .interestedUsersHeroStats {
          grid-template-columns: 1fr;
        }

        .interestedUsersHero {
          min-height: 720px;
        }

        .interestedUsersSummary {
          align-items: flex-start;
          flex-direction: column;
        }
      }

      @media (max-width: 700px) {
        .interestedUsersPage {
          padding: 84px 0 64px;
        }

        .interestedUsersStatePage {
          padding-top: 84px;
        }

        .interestedUsersHero {
          min-height: 750px;
          padding: 24px;
          border-radius: 0 0 32px 32px;
        }

        .interestedUsersHeroCopy {
          padding-top: 110px;
        }

        .interestedUsersHeroStats {
          right: 24px;
          bottom: 24px;
          left: 24px;
        }

        .interestedUsersContent {
          padding: 0 18px;
        }

        .interestedUsersToolbar {
          align-items: flex-start;
          flex-direction: column;
        }
      }

      @media (max-width: 480px) {
        .interestedUsersHero {
          min-height: 790px;
          padding: 19px;
        }

        .interestedUsersHeroCopy h1 {
          font-size: 47px;
        }

        .interestedUsersHeroStats {
          right: 19px;
          bottom: 19px;
          left: 19px;
        }

        .interestedUsersContent {
          padding: 0 13px;
        }

        .interestedUserCard {
          align-items: flex-start;
          flex-direction: column;
        }

        .interestedUsersSummary {
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
