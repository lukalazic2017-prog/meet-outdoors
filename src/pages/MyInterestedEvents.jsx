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

function Icon({ name, size = 20, strokeWidth = 2 }) {
  const icons = {
    heart: (
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
    ),
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
  if (!value) return "Datum nije postavljen";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Datum nije postavljen";
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
      <MyInterestedEventsStyles />

      <main className="interestedStatePage">
        <div className="interestedStateCard">
          <span className="interestedLoader" />
          <h1>Učitavanje događaja</h1>
          <p>Pripremamo tvoju listu sačuvanih avantura.</p>
        </div>
      </main>
    </>
  );
}

export default function MyInterestedEvents() {
  const { profile, loading } = useAuth();

  const [items, setItems] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");

  const loadMyEvents = useCallback(async () => {
    if (!profile?.id) {
      setItems([]);
      setPageLoading(false);
      return;
    }

    setPageLoading(true);
    setError("");

    const { data, error: eventsError } = await supabase
      .from("event_interested")
      .select(`
        id,
        created_at,
        events:event_id (
          id,
          title,
          description,
          location,
          country,
          cover_url,
          price,
          start_date
        )
      `)
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false });

    if (eventsError) {
      console.error(eventsError);
      setItems([]);
      setError(
        eventsError.message ||
          "Događaje trenutno nije moguće učitati."
      );
    } else {
      setItems(data || []);
    }

    setPageLoading(false);
  }, [profile?.id]);

  useEffect(() => {
    if (loading) return;

    loadMyEvents();
  }, [loading, loadMyEvents]);

  const validItems = useMemo(
    () => items.filter((item) => item.events),
    [items]
  );

  const upcomingCount = useMemo(() => {
    const now = Date.now();

    return validItems.filter((item) => {
      const value = item.events?.start_date;

      if (!value) return false;

      const date = new Date(value);

      return (
        !Number.isNaN(date.getTime()) &&
        date.getTime() >= now
      );
    }).length;
  }, [validItems]);

  if (loading || pageLoading) {
    return <LoadingState />;
  }

  if (!profile) {
    return (
      <>
        <MyInterestedEventsStyles />

        <main className="interestedStatePage">
          <div className="interestedStateCard">
            <span className="interestedStateIcon">
              <Icon name="user" size={28} />
            </span>

            <h1>Prijavi se da vidiš listu</h1>

            <p>
              Tvoji zainteresovani događaji dostupni su samo
              prijavljenim korisnicima.
            </p>

            <Link
              to="/login"
              className="interestedStatePrimary"
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
      <MyInterestedEventsStyles />

      <main className="interestedPage">
        <section className="interestedHero">
          <div className="interestedHeroCopy">
            <span className="interestedEyebrow">
              <span />
              Moja lista
            </span>

            <h1>
              Događaji koje
              <br />
              ne želiš da propustiš.
            </h1>

            <p>
              Sve avanture koje si označio kao zanimljive,
              organizovane na jednom mirnom i preglednom mestu.
            </p>
          </div>

          <div className="interestedHeroStats">
            <article>
              <strong>{validItems.length}</strong>
              <span>sačuvanih događaja</span>
            </article>

            <article>
              <strong>{upcomingCount}</strong>
              <span>predstojećih</span>
            </article>

            <article>
              <strong>
                {validItems.length
                  ? formatDate(validItems[0].created_at)
                  : "—"}
              </strong>
              <span>poslednje dodato</span>
            </article>
          </div>
        </section>

        <section className="interestedContent">
          <header className="interestedToolbar">
            <div>
              <span className="interestedSectionLabel">
                Sačuvane avanture
              </span>

              <h2>Tvoja interesovanja.</h2>

              <p>
                Otvori događaj za više detalja, cenu i prijavu.
              </p>
            </div>

            <button
              type="button"
              onClick={loadMyEvents}
            >
              <Icon name="refresh" size={16} />
              Osveži
            </button>
          </header>

          {error && (
            <div
              className="interestedError"
              role="alert"
            >
              <span>
                <Icon name="alert" size={18} />
              </span>

              <p>{error}</p>

              <button
                type="button"
                onClick={loadMyEvents}
              >
                Pokušaj ponovo
              </button>
            </div>
          )}

          {validItems.length === 0 ? (
            <section className="interestedEmpty">
              <span>
                <Icon name="inbox" size={31} />
              </span>

              <h2>Još nema sačuvanih događaja.</h2>

              <p>
                Istraži ponudu i označi događaje koji ti deluju
                kao dobra sledeća avantura.
              </p>

              <Link to="/events">
                Istraži događaje
                <Icon name="arrowRight" size={16} />
              </Link>
            </section>
          ) : (
            <section className="interestedGrid">
              {validItems.map((item) => {
                const event = item.events;

                return (
                  <Link
                    key={item.id}
                    to={`/event/${event.id}`}
                    className="interestedCard"
                  >
                    <div className="interestedImageWrap">
                      <img
                        src={
                          event.cover_url ||
                          FALLBACK_COVER
                        }
                        alt={event.title}
                      />

                      <span className="interestedHeart">
                        <Icon name="heart" size={18} />
                      </span>

                      <span className="interestedPrice">
                        €{event.price || 0}
                      </span>
                    </div>

                    <div className="interestedCardBody">
                      <span className="interestedCardKicker">
                        Outdoor događaj
                      </span>

                      <h2>{event.title}</h2>

                      <p className="interestedCardDescription">
                        {event.description ||
                          "Detaljan opis događaja još nije dodat."}
                      </p>

                      <div className="interestedCardMeta">
                        <span>
                          <Icon
                            name="mapPin"
                            size={15}
                          />
                          {[event.location, event.country]
                            .filter(Boolean)
                            .join(", ") ||
                            "Lokacija nije navedena"}
                        </span>

                        <span>
                          <Icon
                            name="calendar"
                            size={15}
                          />
                          {formatDate(event.start_date)}
                        </span>
                      </div>

                      <div className="interestedCardFooter">
                        <small>
                          Sačuvano{" "}
                          {formatDate(item.created_at)}
                        </small>

                        <span>
                          Pogledaj događaj
                          <Icon
                            name="arrowRight"
                            size={15}
                          />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </section>
          )}

          <section className="interestedExploreCard">
            <div>
              <span className="interestedSectionLabel">
                Sledeća avantura
              </span>

              <h2>
                Još dobrih planova čeka napolju.
              </h2>

              <p>
                Pronađi nove ture, okupljanja i outdoor
                događaje koji odgovaraju tvom tempu.
              </p>
            </div>

            <Link to="/events">
              Pregledaj ponudu
              <Icon name="arrowRight" size={16} />
            </Link>
          </section>
        </section>
      </main>
    </>
  );
}

function MyInterestedEventsStyles() {
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

      .interestedPage,
      .interestedStatePage {
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

      .interestedPage {
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

      .interestedPage a {
        color: inherit;
        text-decoration: none;
      }

      .interestedHero {
        position: relative;
        isolation: isolate;
        width: min(1200px, 100%);
        min-height: 580px;
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

      .interestedHero::before {
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

      .interestedHeroCopy {
        max-width: 860px;
        padding-top: 102px;
      }

      .interestedEyebrow {
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

      .interestedEyebrow > span {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #cef39a;
        box-shadow:
          0 0 0 5px rgba(206, 243, 154, 0.12);
      }

      .interestedHeroCopy h1 {
        margin: 24px 0 0;
        font-size: clamp(56px, 7.4vw, 94px);
        line-height: 0.9;
        letter-spacing: -0.075em;
      }

      .interestedHeroCopy p {
        max-width: 600px;
        margin: 25px 0 0;
        color: rgba(255, 255, 255, 0.63);
        font-size: 14px;
        line-height: 1.75;
      }

      .interestedHeroStats {
        position: absolute;
        right: 34px;
        bottom: 34px;
        left: 34px;
        display: grid;
        grid-template-columns:
          repeat(3, minmax(0, 1fr));
        gap: 12px;
      }

      .interestedHeroStats article {
        padding: 17px;
        border: 1px solid rgba(255, 255, 255, 0.13);
        border-radius: 17px;
        background: rgba(12, 35, 21, 0.34);
        backdrop-filter: blur(16px);
      }

      .interestedHeroStats strong,
      .interestedHeroStats span {
        display: block;
      }

      .interestedHeroStats strong {
        font-size: 17px;
        letter-spacing: -0.03em;
      }

      .interestedHeroStats span {
        margin-top: 6px;
        color: rgba(255, 255, 255, 0.48);
        font-size: 8px;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .interestedContent {
        width: min(1120px, 100%);
        margin: 0 auto;
      }

      .interestedToolbar {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 20px;
        margin: 50px 0 22px;
      }

      .interestedSectionLabel {
        color: #789456;
        font-size: 9px;
        font-weight: 900;
        letter-spacing: 0.13em;
        text-transform: uppercase;
      }

      .interestedToolbar h2,
      .interestedExploreCard h2 {
        margin: 8px 0 0;
        color: #2f4437;
        font-size: clamp(34px, 5vw, 52px);
        line-height: 1;
        letter-spacing: -0.06em;
      }

      .interestedToolbar p {
        margin: 10px 0 0;
        color: #7d8981;
        font-size: 10px;
      }

      .interestedToolbar > button {
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

      .interestedError {
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

      .interestedError > span {
        display: grid;
        place-items: center;
        width: 34px;
        height: 34px;
        border-radius: 10px;
        background: #f8d7d3;
      }

      .interestedError p {
        margin: 0;
        font-size: 10px;
      }

      .interestedError button {
        border: 0;
        background: transparent;
        color: inherit;
        cursor: pointer;
        font-size: 9px;
        font-weight: 850;
      }

      .interestedGrid {
        display: grid;
        grid-template-columns:
          repeat(auto-fit, minmax(290px, 1fr));
        gap: 18px;
      }

      .interestedCard {
        overflow: hidden;
        border: 1px solid #dbe4d8;
        border-radius: 25px;
        background: rgba(255, 255, 255, 0.78);
        box-shadow:
          0 14px 38px rgba(31, 51, 38, 0.05);
        transition: 0.22s ease;
      }

      .interestedCard:hover {
        transform: translateY(-4px);
        border-color: #bccbb7;
        background: white;
        box-shadow:
          0 22px 48px rgba(31, 51, 38, 0.1);
      }

      .interestedImageWrap {
        position: relative;
        height: 230px;
        overflow: hidden;
      }

      .interestedImageWrap::after {
        position: absolute;
        inset: 0;
        background:
          linear-gradient(
            180deg,
            transparent 45%,
            rgba(11, 29, 18, 0.56)
          );
        content: "";
      }

      .interestedImageWrap img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.45s ease;
      }

      .interestedCard:hover
        .interestedImageWrap img {
        transform: scale(1.035);
      }

      .interestedHeart,
      .interestedPrice {
        position: absolute;
        z-index: 2;
        display: grid;
        place-items: center;
        border: 1px solid rgba(255, 255, 255, 0.22);
        background: rgba(18, 44, 28, 0.45);
        color: white;
        backdrop-filter: blur(12px);
      }

      .interestedHeart {
        top: 14px;
        right: 14px;
        width: 42px;
        height: 42px;
        border-radius: 14px;
        color: #ffd7d2;
      }

      .interestedPrice {
        right: 14px;
        bottom: 14px;
        min-height: 33px;
        padding: 0 11px;
        border-radius: 999px;
        font-size: 10px;
        font-weight: 900;
      }

      .interestedCardBody {
        padding: 19px;
      }

      .interestedCardKicker {
        color: #789456;
        font-size: 8px;
        font-weight: 900;
        letter-spacing: 0.11em;
        text-transform: uppercase;
      }

      .interestedCardBody h2 {
        margin: 9px 0 0;
        color: #304538;
        font-size: 22px;
        line-height: 1.1;
        letter-spacing: -0.04em;
      }

      .interestedCardDescription {
        display: -webkit-box;
        margin: 10px 0 0;
        overflow: hidden;
        color: #78847c;
        font-size: 10px;
        line-height: 1.65;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
      }

      .interestedCardMeta {
        display: grid;
        gap: 8px;
        margin-top: 17px;
      }

      .interestedCardMeta span {
        display: flex;
        align-items: center;
        gap: 7px;
        color: #65736a;
        font-size: 9px;
        font-weight: 700;
      }

      .interestedCardMeta svg {
        color: #779555;
      }

      .interestedCardFooter {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-top: 17px;
        padding-top: 14px;
        border-top: 1px solid #e4e9e1;
      }

      .interestedCardFooter small {
        color: #949d97;
        font-size: 7px;
      }

      .interestedCardFooter > span {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: #48604f;
        font-size: 8px;
        font-weight: 850;
      }

      .interestedEmpty {
        display: grid;
        place-items: center;
        padding: 76px 25px;
        border: 1px dashed #cad6c6;
        border-radius: 27px;
        background: rgba(255, 255, 255, 0.6);
        text-align: center;
      }

      .interestedEmpty > span {
        display: grid;
        place-items: center;
        width: 70px;
        height: 70px;
        border-radius: 22px;
        background: #e7f0dc;
        color: #608047;
      }

      .interestedEmpty h2 {
        margin: 19px 0 0;
        color: #34483b;
        font-size: 23px;
        letter-spacing: -0.04em;
      }

      .interestedEmpty p {
        max-width: 520px;
        margin: 10px auto 0;
        color: #869188;
        font-size: 11px;
        line-height: 1.65;
      }

      .interestedEmpty a,
      .interestedStatePrimary {
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

      .interestedExploreCard {
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

      .interestedExploreCard p {
        max-width: 650px;
        margin: 13px 0 0;
        color: #7d8981;
        font-size: 11px;
        line-height: 1.7;
      }

      .interestedExploreCard > a {
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

      .interestedExploreCard > a:hover {
        gap: 11px;
        transform: translateY(-2px);
        background: #214b32;
      }

      .interestedStatePage {
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

      .interestedStateCard {
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

      .interestedLoader {
        width: 38px;
        height: 38px;
        border: 3px solid #dce5d7;
        border-top-color: #52783c;
        border-radius: 50%;
        animation:
          interestedSpin 0.8s linear infinite;
      }

      @keyframes interestedSpin {
        to {
          transform: rotate(360deg);
        }
      }

      .interestedStateIcon {
        display: grid;
        place-items: center;
        width: 64px;
        height: 64px;
        border-radius: 21px;
        background: #e7f0dc;
        color: #608047;
      }

      .interestedStateCard h1 {
        margin: 18px 0 0;
        color: #263a2f;
        font-size: 28px;
        letter-spacing: -0.04em;
      }

      .interestedStateCard p {
        max-width: 390px;
        margin: 9px 0 0;
        color: #7e8981;
        font-size: 11px;
        line-height: 1.65;
      }

      @media (max-width: 820px) {
        .interestedHeroStats {
          grid-template-columns: 1fr;
        }

        .interestedHero {
          min-height: 700px;
        }

        .interestedExploreCard {
          align-items: flex-start;
          flex-direction: column;
        }
      }

      @media (max-width: 700px) {
        .interestedPage {
          padding: 84px 0 64px;
        }

        .interestedStatePage {
          padding-top: 84px;
        }

        .interestedHero {
          min-height: 720px;
          padding: 24px;
          border-radius: 0 0 32px 32px;
        }

        .interestedHeroCopy {
          padding-top: 110px;
        }

        .interestedHeroStats {
          right: 24px;
          bottom: 24px;
          left: 24px;
        }

        .interestedContent {
          padding: 0 18px;
        }

        .interestedToolbar {
          align-items: flex-start;
          flex-direction: column;
        }
      }

      @media (max-width: 480px) {
        .interestedHero {
          min-height: 760px;
          padding: 19px;
        }

        .interestedHeroCopy h1 {
          font-size: 48px;
        }

        .interestedHeroStats {
          right: 19px;
          bottom: 19px;
          left: 19px;
        }

        .interestedContent {
          padding: 0 13px;
        }

        .interestedCardFooter {
          align-items: flex-start;
          flex-direction: column;
        }

        .interestedExploreCard {
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
