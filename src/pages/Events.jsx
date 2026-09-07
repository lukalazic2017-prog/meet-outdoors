import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=85";

function Icon({
  name,
  size = 20,
  strokeWidth = 2,
  fill = "none",
  className = "",
}) {
  const icons = {
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),

    mapPin: (
      <>
        <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),

    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
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

    arrowRight: (
      <>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </>
    ),

    compass: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" />
      </>
    ),

    filter: (
      <>
        <path d="M4 6h16" />
        <path d="M7 12h10" />
        <path d="M10 18h4" />
      </>
    ),

    close: (
      <>
        <path d="m6 6 12 12" />
        <path d="m18 6-12 12" />
      </>
    ),

    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
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

    alert: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5" />
        <path d="M12 16h.01" />
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

function formatPrice(value) {
  const number = Number(value);

  if (!Number.isFinite(number) || number <= 0) {
    return "Besplatno";
  }

  return new Intl.NumberFormat("sr-Latn-RS", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(number);
}

function formatDate(value) {
  if (!value) return "Datum uskoro";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("sr-Latn-RS", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function LoadingState() {
  return (
    <>
      <EventsStyles />

      <main className="eventsStatePage">
        <div className="eventsStateCard">
          <span className="eventsLoader" />
          <h1>Učitavanje događaja</h1>
          <p>Pronalazimo najnovije outdoor avanture.</p>
        </div>
      </main>
    </>
  );
}

function EventCard({ event }) {
  const location =
    [event.location, event.country].filter(Boolean).join(", ") ||
    "Lokacija nije dodata";

  const dateValue =
    event.start_date ||
    event.event_date ||
    event.date ||
    event.created_at;

  const capacity =
    event.capacity ||
    event.max_people ||
    event.max_participants ||
    null;

  return (
    <Link to={`/event/${event.id}`} className="eventCard">
      <div className="eventImageWrapper">
        <img
          src={event.cover_url || FALLBACK_IMAGE}
          alt={event.title || "Outdoor događaj"}
          className="eventImage"
        />

        <div className="eventImageOverlay" />

        <span className="eventTypeBadge">
          <Icon name="compass" size={14} />
          Outdoor događaj
        </span>

        <span className="eventPriceBadge">
          {formatPrice(event.price)}
        </span>
      </div>

      <div className="eventCardBody">
        <span className="eventKicker">MeetOutdoors iskustvo</span>

        <h2>{event.title || "Događaj bez naziva"}</h2>

        <div className="eventMeta">
          <span>
            <Icon name="mapPin" size={15} />
            {location}
          </span>

          <span>
            <Icon name="calendar" size={15} />
            {formatDate(dateValue)}
          </span>

          {capacity && (
            <span>
              <Icon name="users" size={15} />
              Do {capacity} učesnika
            </span>
          )}
        </div>

        {event.description && (
          <p className="eventDescription">
            {event.description}
          </p>
        )}

        <div className="eventCardFooter">
          <div>
            <small>Cena po osobi</small>
            <strong>{formatPrice(event.price)}</strong>
          </div>

          <span className="eventArrow">
            Pogledaj događaj
            <Icon name="arrowRight" size={17} />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [priceFilter, setPriceFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    function syncPageSize() {
      const width = window.innerWidth;
      if (width <= 580) setPageSize(6);
      else if (width <= 1080) setPageSize(8);
      else setPageSize(12);
    }

    syncPageSize();
    window.addEventListener("resize", syncPageSize);
    return () => window.removeEventListener("resize", syncPageSize);
  }, []);

  async function loadEvents() {
    setLoading(true);
    setError("");

    try {
      const { data, error: eventsError } = await supabase
        .from("events")
        .select("*")
        .order("created_at", { ascending: false });

      if (eventsError) {
        throw eventsError;
      }

      setEvents(data || []);
    } catch (err) {
      console.error("Greška pri učitavanju događaja:", err);
      setError(
        err.message || "Događaje trenutno nije moguće učitati."
      );
    } finally {
      setLoading(false);
    }
  }

  const locations = useMemo(() => {
    const uniqueLocations = new Set();

    events.forEach((event) => {
      const location = [event.location, event.country]
        .filter(Boolean)
        .join(", ");

      if (location) {
        uniqueLocations.add(location);
      }
    });

    return Array.from(uniqueLocations).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [events]);

  const filteredEvents = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return events.filter((event) => {
      const title = event.title?.toLowerCase() || "";
      const description = event.description?.toLowerCase() || "";
      const location = [event.location, event.country]
        .filter(Boolean)
        .join(", ");
      const normalizedLocation = location.toLowerCase();
      const price = Number(event.price || 0);

      const matchesSearch =
        !normalizedSearch ||
        title.includes(normalizedSearch) ||
        description.includes(normalizedSearch) ||
        normalizedLocation.includes(normalizedSearch);

      const matchesLocation =
        !locationFilter || location === locationFilter;

      const matchesPrice =
        priceFilter === "all" ||
        (priceFilter === "free" && price <= 0) ||
        (priceFilter === "under50" && price > 0 && price < 50) ||
        (priceFilter === "50to100" && price >= 50 && price <= 100) ||
        (priceFilter === "over100" && price > 100);

      return matchesSearch && matchesLocation && matchesPrice;
    });
  }, [events, search, locationFilter, priceFilter]);

  useEffect(() => {
    setPage(1);
  }, [search, locationFilter, priceFilter]);

  const pageCount = useMemo(
    () => Math.max(1, Math.ceil(filteredEvents.length / pageSize)),
    [filteredEvents.length, pageSize]
  );

  const paginatedEvents = useMemo(() => {
    const safePage = Math.min(page, pageCount);
    const startIndex = (safePage - 1) * pageSize;
    return filteredEvents.slice(startIndex, startIndex + pageSize);
  }, [filteredEvents, page, pageCount, pageSize]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  function clearFilters() {
    setSearch("");
    setLocationFilter("");
    setPriceFilter("all");
  }

  const hasFilters =
    search.trim() ||
    locationFilter ||
    priceFilter !== "all";

  if (loading) {
    return <LoadingState />;
  }

  return (
    <>
      <EventsStyles />

      <main className="eventsPage">
        <section className="eventsHero">
          <div className="eventsHeroOverlay" />

          

          <div className="eventsHeroContent">
            <span className="heroKicker">
              <span />
              Događaji na otvorenom
            </span>

            <h1>
              Pronađi svoju
              <br />
              sledeću avanturu.
            </h1>

            <p>
              Otkrij događaje koje organizuju lokalni domaćini i
              pridruži se ljudima koji biraju prirodu.
            </p>
          </div>

          <div className="heroStats">
            <div>
              <strong>{events.length}</strong>
              <span>objavljenih događaja</span>
            </div>

            <div>
              <strong>{locations.length}</strong>
              <span>različitih lokacija</span>
            </div>

            <div>
              <strong>100%</strong>
              <span>outdoor iskustva</span>
            </div>
          </div>
        </section>

        <section className="eventsContent">
          <div className="filterPanel">
            <div className="searchField">
              <Icon name="search" size={19} />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Pretraži događaje, aktivnosti ili lokacije"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Obriši pretragu"
                >
                  <Icon name="close" size={16} />
                </button>
              )}
            </div>

            <div className="filterField">
              <Icon name="mapPin" size={17} />

              <select
                value={locationFilter}
                onChange={(event) =>
                  setLocationFilter(event.target.value)
                }
              >
                <option value="">Sve lokacije</option>

                {locations.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </div>

            <div className="filterField">
              <Icon name="filter" size={17} />

              <select
                value={priceFilter}
                onChange={(event) =>
                  setPriceFilter(event.target.value)
                }
              >
                <option value="all">Sve cene</option>
                <option value="free">Besplatno</option>
                <option value="under50">Do 50 €</option>
                <option value="50to100">50 € – 100 €</option>
                <option value="over100">Preko 100 €</option>
              </select>
            </div>

            {hasFilters && (
              <button
                type="button"
                className="clearFilters"
                onClick={clearFilters}
              >
                <Icon name="close" size={15} />
                Obriši filtere
              </button>
            )}
          </div>

          {error && (
            <div className="eventsError" role="alert">
              <span>
                <Icon name="alert" size={18} />
              </span>

              <p>{error}</p>

              <button type="button" onClick={loadEvents}>
                Pokušaj ponovo
              </button>
            </div>
          )}

          <div className="eventsSectionHeader">
            <div>
              <span className="sectionKicker">
                Istraži avanture
              </span>

              <h2>
                {hasFilters
                  ? "Rezultati pretrage"
                  : "Najnoviji događaji"}
              </h2>

              <p>
                Prikazano {filteredEvents.length} od {events.length}{" "}
                događaja.
              </p>
            </div>

            <span className="resultCount">
              <Icon name="compass" size={17} />
              {filteredEvents.length}
            </span>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="emptyEvents">
              <span>
                <Icon name="search" size={28} />
              </span>

              <h3>
                {events.length === 0
                  ? "Još nema objavljenih događaja."
                  : "Nema događaja za izabrane filtere."}
              </h3>

              <p>
                {events.length === 0
                  ? "Čim domaćini objave nove avanture, pojaviće se ovde."
                  : "Promeni pretragu, lokaciju ili cenovni rang i pokušaj ponovo."}
              </p>

              {hasFilters ? (
                <button type="button" onClick={clearFilters}>
                  Obriši filtere
                  <Icon name="arrowRight" size={16} />
                </button>
              ) : (
                <Link to="/">
                  Nazad na početnu
                  <Icon name="arrowRight" size={16} />
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="eventsGrid">
                {paginatedEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>

              {pageCount > 1 && (
                <nav className="eventsPagination" aria-label="Stranice događaja">
                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={page === 1}
                  >
                    Prethodna
                  </button>
                  <span>Strana {page} od {pageCount}</span>
                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
                    disabled={page === pageCount}
                  >
                    Sledeća
                  </button>
                </nav>
              )}
            </>
          )}

          <section className="eventsCta">
            <div>
              <span className="sectionKicker">
                Organizuješ avanture?
              </span>

              <h2>Podeli svoje iskustvo sa zajednicom.</h2>

              <p>
                Kreiraj događaj, pronađi učesnike i izgradi svoj
                MeetOutdoors profil.
              </p>
            </div>

            <Link to="/create-event">
              <Icon name="plus" size={17} />
              Kreiraj događaj
            </Link>
          </section>
        </section>
      </main>
    </>
  );
}

function EventsStyles() {
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
      select {
        font: inherit;
      }

      button,
      a {
        -webkit-tap-highlight-color: transparent;
      }

      .eventsPage,
      .eventsStatePage {
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

      .eventsPage {
        padding: 28px;
        background:
          radial-gradient(
            circle at 7% 1%,
            rgba(169, 203, 131, 0.17),
            transparent 25%
          ),
          radial-gradient(
            circle at 95% 30%,
            rgba(85, 129, 91, 0.1),
            transparent 24%
          ),
          #f1f3ec;
      }

      .eventsPage a,
      .eventsStatePage a {
        color: inherit;
        text-decoration: none;
      }

      .eventsHero {
        position: relative;
        isolation: isolate;
        width: min(1240px, 100%);
        min-height: 620px;
        display: flex;
        flex-direction: column;
        margin: 0 auto;
        padding: 34px;
        overflow: hidden;
        border-radius: 34px;
        background:
          url("https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1900&q=90")
          center / cover;
        color: white;
        box-shadow: 0 30px 80px rgba(25, 53, 36, 0.17);
      }

      .eventsHero::before {
        position: absolute;
        inset: 0;
        z-index: -3;
        content: "";
        background:
          url("https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1900&q=90")
          center / cover;
        transition: transform 0.8s ease;
      }

      .eventsHero:hover::before {
        transform: scale(1.018);
      }

      .eventsHeroOverlay {
        position: absolute;
        inset: 0;
        z-index: -2;
        background:
          linear-gradient(
            180deg,
            rgba(4, 15, 8, 0.3),
            rgba(4, 15, 8, 0.25) 28%,
            rgba(4, 15, 8, 0.77) 75%,
            rgba(4, 14, 8, 0.96)
          ),
          linear-gradient(
            90deg,
            rgba(4, 15, 8, 0.54),
            transparent 68%
          );
      }

      .eventsHeroTop {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
      }

      .eventsBrand {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        font-size: 16px;
        font-weight: 900;
        letter-spacing: -0.03em;
      }

      .eventsBrand > span {
        display: grid;
        place-items: center;
        width: 43px;
        height: 43px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.1);
        color: #c9f28c;
        backdrop-filter: blur(13px);
      }

      .packagesLink {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-height: 42px;
        padding: 0 14px;
        border: 1px solid rgba(255, 255, 255, 0.18);
        border-radius: 13px;
        background: rgba(255, 255, 255, 0.09);
        color: white !important;
        font-size: 10px;
        font-weight: 850;
        backdrop-filter: blur(13px);
        transition: 0.18s ease;
      }

      .packagesLink:hover {
        gap: 12px;
        background: rgba(255, 255, 255, 0.17);
      }

      .eventsHeroContent {
        max-width: 850px;
        margin-top: auto;
        padding: 100px 0 55px;
      }

      .heroKicker {
        display: inline-flex;
        align-items: center;
        gap: 9px;
        padding: 9px 13px;
        border: 1px solid rgba(255, 255, 255, 0.17);
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.08);
        color: rgba(255, 255, 255, 0.82);
        font-size: 10px;
        font-weight: 850;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        backdrop-filter: blur(12px);
      }

      .heroKicker > span {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #c9f28c;
        box-shadow: 0 0 0 5px rgba(201, 242, 140, 0.12);
      }

      .eventsHeroContent h1 {
        margin: 24px 0 0;
        font-size: clamp(58px, 8vw, 104px);
        line-height: 0.9;
        letter-spacing: -0.08em;
      }

      .eventsHeroContent p {
        max-width: 620px;
        margin: 25px 0 0;
        color: rgba(255, 255, 255, 0.65);
        font-size: 15px;
        line-height: 1.7;
      }

      .heroStats {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
        padding-top: 22px;
        border-top: 1px solid rgba(255, 255, 255, 0.12);
      }

      .heroStats > div {
        min-width: 0;
      }

      .heroStats strong,
      .heroStats span {
        display: block;
      }

      .heroStats strong {
        font-size: 25px;
        letter-spacing: -0.04em;
      }

      .heroStats span {
        margin-top: 5px;
        color: rgba(255, 255, 255, 0.48);
        font-size: 9px;
        font-weight: 750;
        text-transform: uppercase;
        letter-spacing: 0.07em;
      }

      .eventsContent {
        width: min(1240px, 100%);
        margin: 0 auto;
      }

      .filterPanel {
        position: relative;
        z-index: 5;
        display: grid;
        grid-template-columns:
          minmax(280px, 1.7fr)
          minmax(180px, 0.7fr)
          minmax(170px, 0.65fr)
          auto;
        gap: 10px;
        margin: -33px 28px 0;
        padding: 13px;
        border: 1px solid rgba(33, 53, 40, 0.1);
        border-radius: 22px;
        background: rgba(255, 255, 255, 0.9);
        box-shadow: 0 20px 55px rgba(31, 52, 38, 0.12);
        backdrop-filter: blur(17px);
      }

      .searchField,
      .filterField {
        display: flex;
        align-items: center;
        gap: 10px;
        min-height: 52px;
        padding: 0 14px;
        border: 1px solid #dce3d9;
        border-radius: 14px;
        background: #f9faf7;
        color: #7c8880;
        transition: 0.18s ease;
      }

      .searchField:focus-within,
      .filterField:focus-within {
        border-color: #86a36b;
        background: white;
        box-shadow: 0 0 0 4px rgba(134, 163, 107, 0.1);
      }

      .searchField input,
      .filterField select {
        width: 100%;
        min-width: 0;
        min-height: 50px;
        border: 0;
        outline: 0;
        background: transparent;
        color: #25382d;
        font-size: 11px;
      }

      .searchField input::placeholder {
        color: #9ba59e;
      }

      .searchField button {
        display: grid;
        place-items: center;
        flex: 0 0 auto;
        width: 30px;
        height: 30px;
        padding: 0;
        border: 0;
        border-radius: 9px;
        background: #edf1ea;
        color: #738077;
        cursor: pointer;
      }

      .filterField select {
        cursor: pointer;
      }

      .clearFilters {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        min-height: 52px;
        padding: 0 14px;
        border: 1px solid #e6cbc7;
        border-radius: 14px;
        background: #fff3f1;
        color: #9a4a3f;
        cursor: pointer;
        font-size: 9px;
        font-weight: 850;
        white-space: nowrap;
      }

      .eventsError {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        align-items: center;
        gap: 11px;
        margin-top: 24px;
        padding: 14px;
        border: 1px solid #efc6c1;
        border-radius: 16px;
        background: #fff0ee;
        color: #963e34;
      }

      .eventsError > span {
        display: grid;
        place-items: center;
        width: 32px;
        height: 32px;
        border-radius: 10px;
        background: #f7d7d3;
      }

      .eventsError p {
        margin: 0;
        font-size: 11px;
      }

      .eventsError button {
        border: 0;
        background: transparent;
        color: inherit;
        cursor: pointer;
        font-size: 10px;
        font-weight: 850;
      }

      .eventsSectionHeader {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 20px;
        margin: 55px 0 20px;
      }

      .sectionKicker {
        display: block;
        color: #789857;
        font-size: 9px;
        font-weight: 900;
        letter-spacing: 0.13em;
        text-transform: uppercase;
      }

      .eventsSectionHeader h2,
      .eventsCta h2 {
        margin: 8px 0 0;
        color: #20342a;
        font-size: clamp(34px, 5vw, 51px);
        line-height: 0.98;
        letter-spacing: -0.06em;
      }

      .eventsSectionHeader p {
        margin: 10px 0 0;
        color: #818c84;
        font-size: 10px;
      }

      .resultCount {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 13px;
        border: 1px solid #dce3d9;
        border-radius: 13px;
        background: rgba(255, 255, 255, 0.7);
        color: #526a59;
        font-size: 11px;
        font-weight: 850;
      }

      .eventsGrid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 18px;
      }

      .eventCard {
        min-width: 0;
        overflow: hidden;
        border: 1px solid #dae2d7;
        border-radius: 24px;
        background: rgba(255, 255, 255, 0.78);
        box-shadow: 0 12px 35px rgba(31, 51, 38, 0.045);
        transition: 0.22s ease;
      }

      .eventCard:hover {
        transform: translateY(-5px);
        box-shadow: 0 22px 48px rgba(31, 51, 38, 0.11);
      }

      .eventImageWrapper {
        position: relative;
        height: 245px;
        overflow: hidden;
      }

      .eventImage {
        width: 100%;
        height: 100%;
        display: block;
        object-fit: cover;
        transition: transform 0.55s ease;
      }

      .eventCard:hover .eventImage {
        transform: scale(1.045);
      }

      .eventImageOverlay {
        position: absolute;
        inset: 0;
        background:
          linear-gradient(
            180deg,
            rgba(4, 14, 8, 0.06),
            rgba(4, 14, 8, 0.6)
          );
      }

      .eventTypeBadge,
      .eventPriceBadge {
        position: absolute;
        top: 14px;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-height: 31px;
        padding: 0 10px;
        border: 1px solid rgba(255, 255, 255, 0.17);
        border-radius: 999px;
        background: rgba(5, 20, 11, 0.54);
        color: white;
        font-size: 9px;
        font-weight: 850;
        backdrop-filter: blur(12px);
      }

      .eventTypeBadge {
        left: 14px;
      }

      .eventPriceBadge {
        right: 14px;
        color: #d8f7a8;
      }

      .eventCardBody {
        padding: 20px;
      }

      .eventKicker {
        color: #799958;
        font-size: 8px;
        font-weight: 900;
        letter-spacing: 0.11em;
        text-transform: uppercase;
      }

      .eventCardBody h2 {
        margin: 8px 0 0;
        color: #24372c;
        font-size: 24px;
        line-height: 1.1;
        letter-spacing: -0.04em;
      }

      .eventMeta {
        display: grid;
        gap: 8px;
        margin-top: 16px;
      }

      .eventMeta > span {
        display: flex;
        align-items: center;
        gap: 7px;
        color: #7c8880;
        font-size: 9px;
        line-height: 1.4;
      }

      .eventMeta svg {
        flex: 0 0 auto;
        color: #799557;
      }

      .eventDescription {
        display: -webkit-box;
        overflow: hidden;
        margin: 16px 0 0;
        color: #77837b;
        font-size: 10px;
        line-height: 1.65;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 3;
      }

      .eventCardFooter {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 15px;
        margin-top: 20px;
        padding-top: 16px;
        border-top: 1px solid #e2e7df;
      }

      .eventCardFooter small,
      .eventCardFooter strong {
        display: block;
      }

      .eventCardFooter small {
        color: #949d96;
        font-size: 8px;
      }

      .eventCardFooter strong {
        margin-top: 4px;
        color: #284334;
        font-size: 15px;
      }

      .eventArrow {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        color: #385541;
        font-size: 9px;
        font-weight: 850;
        transition: 0.18s ease;
      }

      .eventCard:hover .eventArrow {
        gap: 11px;
      }

      .emptyEvents {
        display: grid;
        place-items: center;
        padding: 70px 25px;
        border: 1px dashed #ccd7c9;
        border-radius: 24px;
        background: rgba(255, 255, 255, 0.58);
        text-align: center;
      }

      .emptyEvents > span {
        display: grid;
        place-items: center;
        width: 64px;
        height: 64px;
        border-radius: 20px;
        background: #e7f0dc;
        color: #608047;
      }

      .emptyEvents h3 {
        margin: 18px 0 0;
        color: #34483b;
        font-size: 20px;
        letter-spacing: -0.03em;
      }

      .emptyEvents p {
        max-width: 520px;
        margin: 10px auto 0;
        color: #869188;
        font-size: 11px;
        line-height: 1.65;
      }

      .emptyEvents button,
      .emptyEvents a {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        margin-top: 19px;
        padding: 12px 15px;
        border: 0;
        border-radius: 12px;
        background: #183a27;
        color: white !important;
        cursor: pointer;
        font-size: 10px;
        font-weight: 850;
      }

      .eventsCta {
        position: relative;
        isolation: isolate;
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 35px;
        margin-top: 45px;
        padding: 38px;
        overflow: hidden;
        border-radius: 29px;
        background:
          linear-gradient(
            130deg,
            rgba(13, 47, 28, 0.98),
            rgba(27, 73, 45, 0.94)
          );
        color: white;
        box-shadow: 0 22px 55px rgba(24, 58, 39, 0.14);
      }

      .eventsCta::after {
        position: absolute;
        right: -100px;
        bottom: -170px;
        z-index: -1;
        width: 360px;
        height: 360px;
        border: 1px solid rgba(255, 255, 255, 0.07);
        border-radius: 50%;
        content: "";
        box-shadow:
          0 0 0 65px rgba(255, 255, 255, 0.02),
          0 0 0 130px rgba(255, 255, 255, 0.012);
      }

      .eventsCta .sectionKicker {
        color: #c9f28c;
      }

      .eventsCta h2 {
        max-width: 730px;
        color: white;
      }

      .eventsCta p {
        max-width: 610px;
        margin: 14px 0 0;
        color: rgba(255, 255, 255, 0.57);
        font-size: 11px;
        line-height: 1.65;
      }

      .eventsCta > a {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        flex: 0 0 auto;
        min-height: 49px;
        padding: 0 17px;
        border-radius: 14px;
        background: #c9f28c;
        color: #183a27 !important;
        font-size: 10px;
        font-weight: 900;
        box-shadow: 0 12px 28px rgba(4, 18, 9, 0.18);
        transition: 0.18s ease;
      }

      .eventsCta > a:hover {
        gap: 12px;
        transform: translateY(-2px);
      }

      .eventsStatePage {
        display: grid;
        place-items: center;
        padding: 24px;
        background:
          radial-gradient(
            circle at top left,
            rgba(166, 203, 126, 0.18),
            transparent 30%
          ),
          #f1f3ec;
      }

      .eventsStateCard {
        display: grid;
        place-items: center;
        width: min(500px, 100%);
        padding: 50px 30px;
        border: 1px solid #dce3d9;
        border-radius: 28px;
        background: rgba(255, 255, 255, 0.82);
        text-align: center;
        box-shadow: 0 20px 60px rgba(28, 48, 35, 0.08);
      }

      .eventsLoader {
        width: 37px;
        height: 37px;
        border: 3px solid #dce5d7;
        border-top-color: #52783c;
        border-radius: 50%;
        animation: eventsSpin 0.8s linear infinite;
      }

      @keyframes eventsSpin {
        to {
          transform: rotate(360deg);
        }
      }

      .eventsStateCard h1 {
        margin: 18px 0 0;
        color: #24372c;
        font-size: 28px;
        letter-spacing: -0.04em;
      }

      .eventsStateCard p {
        margin: 9px 0 0;
        color: #7e8981;
        font-size: 11px;
      }

      @media (max-width: 1030px) {
        .filterPanel {
          grid-template-columns: 1fr 1fr;
        }

        .searchField {
          grid-column: 1 / -1;
        }

        .eventsGrid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 760px) {
        .eventsPage {
          padding: 0 0 70px;
        }

        .eventsHero {
          min-height: 600px;
          padding: 24px;
          border-radius: 0 0 31px 31px;
        }

        .eventsHeroContent h1 {
          font-size: clamp(54px, 12vw, 78px);
        }

        .filterPanel {
          margin-right: 18px;
          margin-left: 18px;
        }

        .eventsSectionHeader,
        .eventsGrid,
        .emptyEvents,
        .eventsCta,
        .eventsError {
          margin-right: 18px;
          margin-left: 18px;
        }

        .eventsCta {
          align-items: flex-start;
          flex-direction: column;
        }
      }

      @media (max-width: 580px) {
        .eventsHero {
          min-height: 570px;
          padding: 20px;
        }

        .eventsBrand {
          font-size: 14px;
        }

        .packagesLink {
          width: 42px;
          padding: 0;
          justify-content: center;
          font-size: 0;
        }

        .eventsHeroContent h1 {
          font-size: 48px;
        }

        .heroStats {
          grid-template-columns: 1fr;
          gap: 14px;
        }

        .filterPanel,
        .eventsGrid {
          grid-template-columns: 1fr;
        }

        .searchField {
          grid-column: auto;
        }

        .eventsSectionHeader {
          align-items: flex-start;
          flex-direction: column;
        }

        .eventsGrid {
          display: grid;
        }

        .eventImageWrapper {
          height: 225px;
        }

        .eventsCta {
          padding: 27px;
        }
      }

      @media (max-width: 420px) {
        .eventsHero {
          min-height: 550px;
          padding: 17px;
        }

        .eventsHeroContent h1 {
          font-size: 42px;
        }

        .eventsHeroContent p {
          font-size: 13px;
        }

        .filterPanel,
        .eventsSectionHeader,
        .eventsGrid,
        .emptyEvents,
        .eventsCta,
        .eventsError {
          margin-right: 13px;
          margin-left: 13px;
        }

        .eventCardBody {
          padding: 17px;
        }

        .eventCardFooter {
          align-items: flex-start;
          flex-direction: column;
        }

        .eventsCta h2 {
          font-size: 35px;
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

      /* =========================================================
         EVENTS — COMPACT DISCOVERY
         ========================================================= */

      .eventsPage { padding: 82px 18px 44px; }

      .eventsHero {
        min-height: 230px;
        padding: 22px;
        border-radius: 24px;
      }

      .eventsHeroContent {
        max-width: 760px;
        padding: 26px 0 20px;
      }

      .heroKicker {
        padding: 7px 10px;
        font-size: 8px;
      }

      .eventsHeroContent h1 {
        margin-top: 13px;
        font-size: clamp(42px, 6vw, 66px);
        line-height: .92;
      }

      .eventsHeroContent p {
        max-width: 590px;
        margin-top: 12px;
        font-size: 12px;
        line-height: 1.5;
      }

      .heroStats {
        gap: 8px;
        padding-top: 13px;
      }

      .heroStats strong { font-size: 20px; }
      .heroStats span { font-size: 7px; }

      .filterPanel {
        grid-template-columns:
          minmax(260px, 1.6fr)
          minmax(150px, .7fr)
          minmax(150px, .7fr)
          auto;
        gap: 8px;
        margin: -20px 18px 0;
        padding: 9px;
        border-radius: 16px;
      }

      .searchField,
      .filterField,
      .clearFilters {
        min-height: 44px;
        border-radius: 11px;
      }

      .searchField,
      .filterField { padding: 0 11px; }

      .searchField input,
      .filterField select {
        min-height: 42px;
        font-size: 10px;
      }

      .clearFilters {
        padding: 0 11px;
        font-size: 8px;
      }

      .eventsSectionHeader {
        margin: 28px 0 14px;
        align-items: center;
      }

      .eventsSectionHeader h2 {
        margin-top: 4px;
        font-size: clamp(26px, 4vw, 38px);
      }

      .eventsSectionHeader p {
        margin-top: 6px;
        font-size: 9px;
      }

      .resultCount {
        padding: 8px 10px;
        border-radius: 10px;
        font-size: 9px;
      }

      .eventsGrid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 14px;
      }

      .eventCard {
        border-radius: 20px;
      }

      .eventImageWrapper {
        height: 170px;
      }

      .eventTypeBadge,
      .eventPriceBadge {
        top: 10px;
        font-size: 7px;
        min-height: 27px;
        padding: 0 8px;
      }

      .eventTypeBadge { left: 10px; }
      .eventPriceBadge { right: 10px; }

      .eventCardBody {
        padding: 14px;
      }

      .eventKicker { font-size: 7px; }

      .eventCardBody h2 {
        margin-top: 6px;
        font-size: 18px;
      }

      .eventMeta {
        gap: 6px;
        margin-top: 9px;
      }

      .eventMeta span {
        min-height: 26px;
        padding: 0 8px;
        font-size: 7px;
      }

      .eventDescription {
        margin-top: 9px;
        font-size: 9px;
        line-height: 1.45;
        -webkit-line-clamp: 2;
      }

      .eventCardFooter {
        margin-top: 11px;
        padding-top: 10px;
      }

      .eventCardFooter small { font-size: 7px; }
      .eventCardFooter strong { font-size: 16px; }

      .eventArrow {
        font-size: 8px;
      }

      .eventsCta {
        margin-top: 18px;
        padding: 20px 22px;
        border-radius: 20px;
      }

      .eventsCta h2 {
        font-size: clamp(26px, 4vw, 38px);
      }

      .eventsCta p {
        margin-top: 8px;
        font-size: 9px;
      }

      .eventsCta > a {
        min-height: 40px;
        padding: 0 13px;
        border-radius: 11px;
        font-size: 8px;
      }

      .eventsPagination {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        margin-top: 18px;
      }

      .eventsPagination button {
        min-height: 38px;
        padding: 0 14px;
        border: 1px solid #d8e0d5;
        border-radius: 11px;
        background: rgba(255,255,255,.85);
        color: #405448;
        cursor: pointer;
        font-size: 9px;
        font-weight: 850;
      }

      .eventsPagination button:disabled {
        opacity: .4;
        cursor: default;
      }

      .eventsPagination span {
        color: #76827a;
        font-size: 9px;
        font-weight: 800;
      }

      @media (max-width: 1080px) {
        .eventsGrid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 760px) {
        .eventsPage {
          padding: 74px 0 34px;
        }

        .eventsHero {
          min-height: 175px;
          padding: 16px;
          border-radius: 0 0 22px 22px;
        }

        .eventsHeroContent {
          padding: 18px 0 12px;
        }

        .eventsHeroContent h1 {
          margin-top: 9px;
          font-size: 34px;
        }

        .eventsHeroContent p {
          margin-top: 7px;
          font-size: 10px;
        }

        .heroStats {
          gap: 5px;
          padding-top: 10px;
        }

        .heroStats strong { font-size: 16px; }
        .heroStats span { font-size: 6px; }

        .filterPanel {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          margin: -13px 12px 0;
          padding: 7px;
          gap: 6px;
        }

        .searchField { grid-column: 1 / -1; }

        .eventsSectionHeader,
        .eventsGrid,
        .emptyEvents,
        .eventsCta,
        .eventsError,
        .eventsPagination {
          margin-right: 12px;
          margin-left: 12px;
        }

        .eventsSectionHeader {
          margin-top: 20px;
          margin-bottom: 10px;
        }

        .eventsSectionHeader h2 { font-size: 27px; }

        .eventsGrid {
          grid-template-columns: 1fr;
          gap: 10px;
        }

        .eventCard {
          display: grid;
          grid-template-columns: 116px minmax(0, 1fr);
          min-height: 154px;
          border-radius: 16px;
        }

        .eventImageWrapper {
          height: 100%;
          min-height: 154px;
        }

        .eventTypeBadge {
          top: 8px;
          left: 8px;
          max-width: 92px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .eventPriceBadge {
          top: auto;
          right: 8px;
          bottom: 8px;
        }

        .eventCardBody {
          min-width: 0;
          padding: 10px 11px;
        }

        .eventKicker { font-size: 7px; }

        .eventCardBody h2 {
          margin-top: 5px;
          font-size: 15px;
        }

        .eventMeta {
          margin-top: 7px;
          gap: 4px;
        }

        .eventMeta span {
          min-height: 22px;
          padding: 0 6px;
          font-size: 7px;
        }

        .eventMeta span:nth-child(n+3) { display: none; }

        .eventDescription {
          margin-top: 7px;
          font-size: 9px;
          -webkit-line-clamp: 1;
        }

        .eventCardFooter {
          margin-top: 8px;
          padding-top: 7px;
        }

        .eventCardFooter small { font-size: 6px; }
        .eventCardFooter strong { font-size: 14px; }

        .eventArrow {
          font-size: 7px;
        }

        .eventsCta {
          align-items: center;
          flex-direction: row;
          gap: 12px;
          padding: 16px;
        }

        .eventsCta .sectionKicker,
        .eventsCta p { display: none; }

        .eventsCta h2 {
          margin: 0;
          font-size: 20px;
        }

        .eventsCta > a {
          min-height: 38px;
          white-space: nowrap;
        }
      }

      @media (max-width: 580px) {
        .eventsHero { min-height: 165px; }
        .eventsHeroContent h1 { font-size: 31px; }

        .eventCard {
          grid-template-columns: 108px minmax(0,1fr);
          min-height: 148px;
        }

        .eventImageWrapper { min-height: 148px; }
      }

    `}</style>
  );
}