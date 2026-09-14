import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";

const FALLBACK_AVATAR =
  "https://api.dicebear.com/8.x/initials/svg?seed=Host";

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1400&q=85";


function offerLabel(type) {
  const labels = {
    adventure: "Avanture",
    accommodation: "Smeštaj",
    service: "Usluge",
    rental: "Iznajmljivanje",
  };

  return labels[type] || type;
}

function getHostOfferTypes(host) {
  const types = [];

  if (Number(host?.adventures_count || 0) > 0) types.push("adventure");
  if (Number(host?.accommodations_count || 0) > 0) types.push("accommodation");
  if (Number(host?.services_count || 0) > 0) types.push("service");
  if (Number(host?.rentals_count || 0) > 0) types.push("rental");

  return types;
}

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

    compass: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" />
      </>
    ),

    arrowRight: (
      <>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </>
    ),

    verified: (
      <>
        <path d="m12 3 2 1.4 2.4-.2.8 2.2 2 1.4-.8 2.3.8 2.3-2 1.4-.8 2.2-2.4-.2-2 1.4-2-1.4-2.4.2-.8-2.2-2-1.4.8-2.3-.8-2.3 2-1.4.8-2.2 2.4.2L12 3Z" />
        <path d="m9.5 12 1.7 1.7 3.5-3.7" />
      </>
    ),

    shield: (
      <>
        <path d="M12 3 5 6v5c0 4.6 2.9 8.4 7 10 4.1-1.6 7-5.4 7-10V6l-7-3Z" />
        <path d="m9 12 2 2 4-4" />
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

    star: (
      <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z" />
    ),

    alert: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5" />
        <path d="M12 16h.01" />
      </>
    ),

    plus: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),

    check: <path d="m5 12 4 4L19 6" />,

    activity: (
      <>
        <path d="M4 18 10 8l3 5 2-3 5 8" />
        <path d="M3 20h18" />
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

function LoadingState() {
  return (
    <>
      <HostsStyles />

      <main className="hostsStatePage">
        <div className="hostsStateCard">
          <span className="hostsLoader" />

          <h1>Učitavanje domaćina</h1>

          <p>Pronalazimo outdoor domaćine i njihove ponude.</p>
        </div>
      </main>
    </>
  );
}

function HostCard({ host }) {
  const activities = Array.isArray(host.activities)
    ? host.activities
    : [];

  const location =
    [host.city, host.country].filter(Boolean).join(", ") ||
    "Lokacija nije dodata";

  const displayName =
    host.full_name || host.username || "Outdoor Host";

  const description = host.bio
    ? host.bio.length > 130
      ? `${host.bio.slice(0, 130)}...`
      : host.bio
    : "Ovaj domaćin još nije dodao opis svog iskustva i ponude.";

  return (
    <article className="hostCard">
      <Link
        to={`/h/${host.username}`}
        className="hostMedia"
        aria-label={`Pogledaj profil ${displayName}`}
      >
        <img
          src={host.cover_url || FALLBACK_COVER}
          alt=""
          className="hostCoverImage"
        />

        <div className="hostMediaShade" />

        <div className="hostMediaTop">
          <span className="hostStatus">
            <Icon name="shield" size={14} />
            MeetOutdoors host
          </span>

          <span className="hostMediaArrow">
            <Icon name="arrowRight" size={17} />
          </span>
        </div>

      </Link>

      <div className="hostCardBody">
        <div className="hostIdentity">
          <Link to={`/h/${host.username}`} className="hostAvatarWrap">
            <img
              src={host.avatar_url || FALLBACK_AVATAR}
              alt={displayName}
              className="hostAvatar"
            />
          </Link>

          <div className="hostIdentityText">
            <div className="hostNameRow">
              <h2>{displayName}</h2>
            </div>
            <span>@{host.username || "host"}</span>

            <div className="hostIdentityLocation">
              <Icon name="mapPin" size={14} />
              <span>{location}</span>
            </div>
          </div>
        </div>

        <p className="hostBio">{description}</p>

        <div className="hostActivities">
          {activities.length > 0 ? (
            <>
              {activities.slice(0, 3).map((activity) => (
                <span key={activity}>{activity}</span>
              ))}
              {activities.length > 3 && (
                <span className="moreActivities">
                  +{activities.length - 3}
                </span>
              )}
            </>
          ) : (
            <span>Aktivnosti nisu dodate</span>
          )}
        </div>


        {getHostOfferTypes(host).length > 0 && (
          <div className="hostOfferTypes">
            {getHostOfferTypes(host).map((type) => (
              <span key={type} className={`hostOfferType ${type}`}>
                {offerLabel(type)}
              </span>
            ))}
          </div>
        )}

        <div className="hostCardFooter">
          <div className="hostTrust">
            <span className="hostTrustIcon">
              <Icon name="compass" size={17} />
            </span>

            <div>
              <strong>Outdoor domaćin</strong>
              <small>Profil na MeetOutdoors</small>
            </div>
          </div>

          <Link to={`/h/${host.username}`} className="viewHostButton">
            Profil
            <Icon name="arrowRight" size={16} />
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function Hosts() {
  const [hosts, setHosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [activityFilter, setActivityFilter] = useState("");
  const [offerFilter, setOfferFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    loadHosts();
  }, []);

  useEffect(() => {
    function syncPageSize() {
      const width = window.innerWidth;

      if (width <= 760) {
        setPageSize(6);
      } else {
        setPageSize(9);
      }
    }

    syncPageSize();
    window.addEventListener("resize", syncPageSize);

    return () => {
      window.removeEventListener("resize", syncPageSize);
    };
  }, []);

  async function loadHosts() {
    setLoading(true);
    setError("");

    try {
      const [
        hostsResult,
        eventsResult,
        accommodationsResult,
        offersResult,
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("*")
          .eq("role", "host")
          .order("created_at", { ascending: false }),

        supabase
          .from("events")
          .select("id, host_id, is_active")
          .eq("is_active", true),

        supabase
          .from("host_accommodations")
          .select("id, host_id, is_active")
          .eq("is_active", true),

        supabase
          .from("host_offers")
          .select("id, host_id, offer_type, is_active")
          .eq("is_active", true),
      ]);

      if (hostsResult.error) throw hostsResult.error;

      const events = eventsResult.error ? [] : eventsResult.data || [];
      const accommodations = accommodationsResult.error
        ? []
        : accommodationsResult.data || [];
      const offers = offersResult.error ? [] : offersResult.data || [];

      const enrichedHosts = (hostsResult.data || []).map((host) => {
        const hostEvents = events.filter((item) => item.host_id === host.id);
        const hostAccommodations = accommodations.filter(
          (item) => item.host_id === host.id
        );
        const hostOffers = offers.filter((item) => item.host_id === host.id);

        const services = hostOffers.filter(
          (item) => String(item.offer_type || "").toLowerCase() !== "rental"
        );

        const rentals = hostOffers.filter(
          (item) => String(item.offer_type || "").toLowerCase() === "rental"
        );

        return {
          ...host,
          adventures_count: hostEvents.length,
          accommodations_count: hostAccommodations.length,
          services_count: services.length,
          rentals_count: rentals.length,
          total_active_offers:
            hostEvents.length +
            hostAccommodations.length +
            services.length +
            rentals.length,
        };
      });

      setHosts(enrichedHosts);
    } catch (err) {
      console.error("Greška pri učitavanju domaćina:", err);

      setHosts([]);
      setError(
        err.message ||
          "Domaćine trenutno nije moguće učitati."
      );
    } finally {
      setLoading(false);
    }
  }

  const locations = useMemo(() => {
    const uniqueLocations = new Set();

    hosts.forEach((host) => {
      const location = [host.city, host.country]
        .filter(Boolean)
        .join(", ");

      if (location) {
        uniqueLocations.add(location);
      }
    });

    return Array.from(uniqueLocations).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [hosts]);

  const activities = useMemo(() => {
    const uniqueActivities = new Set();

    hosts.forEach((host) => {
      if (Array.isArray(host.activities)) {
        host.activities.forEach((activity) => {
          if (activity) {
            uniqueActivities.add(activity);
          }
        });
      }
    });

    return Array.from(uniqueActivities).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [hosts]);

  const filteredHosts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return hosts.filter((host) => {
      const displayName =
        host.full_name?.toLowerCase() || "";

      const username =
        host.username?.toLowerCase() || "";

      const bio =
        host.bio?.toLowerCase() || "";

      const location = [host.city, host.country]
        .filter(Boolean)
        .join(", ");

      const normalizedLocation = location.toLowerCase();

      const hostActivities = Array.isArray(host.activities)
        ? host.activities
        : [];

      const matchesSearch =
        !normalizedSearch ||
        displayName.includes(normalizedSearch) ||
        username.includes(normalizedSearch) ||
        bio.includes(normalizedSearch) ||
        normalizedLocation.includes(normalizedSearch) ||
        hostActivities.some((activity) =>
          activity.toLowerCase().includes(normalizedSearch)
        );

      const matchesLocation =
        !locationFilter || location === locationFilter;

      const matchesActivity =
        !activityFilter ||
        hostActivities.includes(activityFilter);

      const matchesOffer =
        !offerFilter ||
        getHostOfferTypes(host).includes(offerFilter);

      return (
        matchesSearch &&
        matchesLocation &&
        matchesActivity &&
        matchesOffer
      );
    });
  }, [
    hosts,
    search,
    locationFilter,
    activityFilter,
    offerFilter,
  ]);

  useEffect(() => {
    setPage(1);
  }, [search, locationFilter, activityFilter, offerFilter]);

  const pageCount = useMemo(
    () => Math.max(1, Math.ceil(filteredHosts.length / pageSize)),
    [filteredHosts.length, pageSize]
  );

  const paginatedHosts = useMemo(() => {
    const safePage = Math.min(page, pageCount);
    const startIndex = (safePage - 1) * pageSize;

    return filteredHosts.slice(startIndex, startIndex + pageSize);
  }, [filteredHosts, page, pageCount, pageSize]);

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageCount]);


  const activeOffersCount = useMemo(
    () =>
      hosts.reduce(
        (total, host) => total + Number(host.total_active_offers || 0),
        0
      ),
    [hosts]
  );

  const hasFilters =
    search.trim() ||
    locationFilter ||
    activityFilter ||
    offerFilter;

  function clearFilters() {
    setSearch("");
    setLocationFilter("");
    setActivityFilter("");
    setOfferFilter("");
  }

  if (loading) {
    return <LoadingState />;
  }

  return (
    <>
      <HostsStyles />

      <main className="hostsPage">
        <section className="hostsHero">
          <div className="hostsHeroOverlay" />

          <div className="hostsHeroContent">
            <span className="heroKicker">
              <span />
              MeetOutdoors domaćini
            </span>

            <h1>
              Upoznaj ljude
              <br />
              iza avanture.
            </h1>

            <p>
              Pronađi domaćine, pogledaj njihove avanture, smeštaj i usluge — pa ih kontaktiraj direktno.
            </p>
          </div>

          <div className="heroStats">
            <article>
              <strong>{hosts.length}</strong>
              <span>aktivnih domaćina</span>
            </article>

            <article>
              <strong>{activeOffersCount}</strong>
              <span>aktivnih ponuda</span>
            </article>
          </div>
        </section>

        <section className="hostsContent">
          <div className={`hostsFilters ${mobileFiltersOpen ? "mobileOpen" : ""}`}>
            <div className="searchField">
              <Icon name="search" size={19} />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Pretraži domaćine, lokacije ili aktivnosti"
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

            <button
              type="button"
              className="mobileFilterToggle"
              onClick={() => setMobileFiltersOpen((current) => !current)}
              aria-expanded={mobileFiltersOpen}
            >
              <Icon name="filter" size={16} />
              <span>{mobileFiltersOpen ? "Sakrij filtere" : "Filteri"}</span>
              {hasFilters && <strong>•</strong>}
            </button>

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
              <Icon name="activity" size={17} />

              <select
                value={activityFilter}
                onChange={(event) =>
                  setActivityFilter(event.target.value)
                }
              >
                <option value="">Sve aktivnosti</option>

                {activities.map((activity) => (
                  <option key={activity} value={activity}>
                    {activity}
                  </option>
                ))}
              </select>
            </div>

            <div className="filterField">
              <Icon name="filter" size={17} />

              <select
                value={offerFilter}
                onChange={(event) =>
                  setOfferFilter(event.target.value)
                }
              >
                <option value="">Sve ponude</option>
                <option value="adventure">Avanture</option>
                <option value="accommodation">Smeštaj</option>
                <option value="service">Usluge</option>
                <option value="rental">Iznajmljivanje</option>
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
            <div className="hostsError" role="alert">
              <span>
                <Icon name="alert" size={18} />
              </span>

              <p>{error}</p>

              <button type="button" onClick={loadHosts}>
                Pokušaj ponovo
              </button>
            </div>
          )}

          <div className="hostsSectionHeader">
            <div>
              <span className="sectionKicker">
                Outdoor domaćini
              </span>

              <h2>
                {hasFilters
                  ? "Rezultati pretrage"
                  : "Pronađi svog domaćina"}
              </h2>

              <p>
                Prikazano {filteredHosts.length} od {hosts.length} domaćina ·{" "}
                {filteredHosts.reduce(
                  (total, host) =>
                    total + Number(host.total_active_offers || 0),
                  0
                )} aktivnih ponuda.
              </p>
            </div>

            <span className="hostResultCount">
              <Icon name="users" size={17} />
              {filteredHosts.length}
            </span>
          </div>

          {filteredHosts.length === 0 ? (
            <div className="emptyHosts">
              <span>
                <Icon
                  name={hosts.length === 0 ? "users" : "search"}
                  size={29}
                />
              </span>

              <h3>
                {hosts.length === 0
                  ? "Još nema registrovanih domaćina."
                  : "Nema domaćina za izabrane filtere."}
              </h3>

              <p>
                {hosts.length === 0
                  ? "Postani prvi organizator i predstavi svoje outdoor avanture MeetOutdoors zajednici."
                  : "Promeni pretragu, lokaciju ili aktivnost i pokušaj ponovo."}
              </p>

              {hasFilters ? (
                <button type="button" onClick={clearFilters}>
                  Obriši filtere
                  <Icon name="arrowRight" size={16} />
                </button>
              ) : (
                <Link to="/signup">
                  <Icon name="plus" size={16} />
                  Postani domaćin
                </Link>
              )}
            </div>
          ) : (
            <>
              <section className="hostsGrid">
                {paginatedHosts.map((host) => (
                  <HostCard key={host.id} host={host} />
                ))}
              </section>

              {pageCount > 1 && (
                <nav className="hostsPagination" aria-label="Stranice domaćina">
                  <button
                    type="button"
                    onClick={() =>
                      setPage((current) => Math.max(1, current - 1))
                    }
                    disabled={page === 1}
                  >
                    Prethodna
                  </button>

                  <span>
                    Strana {page} od {pageCount}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setPage((current) => Math.min(pageCount, current + 1))
                    }
                    disabled={page === pageCount}
                  >
                    Sledeća
                  </button>
                </nav>
              )}
            </>
          )}

          <section className="hostsTrustSection">
            <div className="trustIntro">
              <span className="sectionKicker">
                Sigurnije istraživanje
              </span>

              <h2>
                Izaberi domaćina kome možeš da veruješ.
              </h2>

              <p>
                Pregledaj profil, aktivnosti, ponude i javne informacije domaćina pre nego što ga kontaktiraš direktno.
              </p>
            </div>

            <div className="trustCards">

              <article>
                <span>
                  <Icon name="activity" size={21} />
                </span>

                <div>
                  <strong>Relevantno iskustvo</strong>

                  <small>
                    Pregledaj aktivnosti i ponude koje domaćin trenutno ima.
                  </small>
                </div>
              </article>

              <article>
                <span>
                  <Icon name="shield" size={21} />
                </span>

                <div>
                  <strong>Transparentni profili</strong>

                  <small>
                    Kontakt, lokacija i javne informacije na jednom
                    mestu.
                  </small>
                </div>
              </article>
            </div>
          </section>

          <section className="hostsCta">
            <div>
              <span className="sectionKicker">
                Organizuješ outdoor iskustva?
              </span>

              <h2>
                Predstavi svoje outdoor ponude novoj zajednici.
              </h2>

              <p>
                Kreiraj host profil, objavi svoje outdoor ponude i omogući ljudima da te pronađu i kontaktiraju direktno.
              </p>
            </div>

            <Link to="/signup">
              <Icon name="plus" size={17} />
              Postani domaćin
            </Link>
          </section>
        </section>
      </main>
    </>
  );
}

function HostsStyles() {
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

      .hostsPage,
      .hostsStatePage {
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

      .hostsPage {
        padding: 118px 28px 90px;
        background:
          radial-gradient(
            circle at 8% 1%,
            rgba(169, 203, 131, 0.17),
            transparent 25%
          ),
          radial-gradient(
            circle at 96% 31%,
            rgba(85, 129, 91, 0.1),
            transparent 25%
          ),
          #f1f3ec;
      }

      .hostsPage a,
      .hostsStatePage a {
        color: inherit;
        text-decoration: none;
      }

      .hostsHero {
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
        color: white;
        box-shadow: 0 30px 80px rgba(25, 53, 36, 0.17);
      }

      .hostsHero::before {
        position: absolute;
        inset: 0;
        z-index: -3;
        content: "";
        background:
          url("https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1900&q=90")
          center / cover;
        transition: transform 0.8s ease;
      }

      .hostsHero:hover::before {
        transform: scale(1.018);
      }

      .hostsHeroOverlay {
        position: absolute;
        inset: 0;
        z-index: -2;
        background:
          linear-gradient(
            180deg,
            rgba(4, 15, 8, 0.28),
            rgba(4, 15, 8, 0.2) 28%,
            rgba(4, 15, 8, 0.78) 76%,
            rgba(4, 14, 8, 0.97)
          ),
          linear-gradient(
            90deg,
            rgba(4, 15, 8, 0.58),
            transparent 70%
          );
      }

      .hostsHeroContent {
        max-width: 900px;
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

      .hostsHeroContent h1 {
        margin: 24px 0 0;
        font-size: clamp(58px, 8vw, 104px);
        line-height: 0.9;
        letter-spacing: -0.08em;
      }

      .hostsHeroContent p {
        max-width: 640px;
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
        letter-spacing: 0.07em;
        text-transform: uppercase;
      }

      .hostsContent {
        width: min(1240px, 100%);
        margin: 0 auto;
      }

      .hostsFilters {
        position: relative;
        z-index: 5;
        display: grid;
        grid-template-columns:
          minmax(280px, 1.5fr)
          minmax(170px, 0.65fr)
          minmax(170px, 0.65fr)
          auto
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

      .verifiedFilter {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        min-height: 52px;
        padding: 0 13px;
        border: 1px solid #dce3d9;
        border-radius: 14px;
        background: #f9faf7;
        color: #526258;
        cursor: pointer;
        font-size: 9px;
        font-weight: 850;
        white-space: nowrap;
      }

      .verifiedFilter input {
        position: absolute;
        width: 1px;
        height: 1px;
        opacity: 0;
        pointer-events: none;
      }

      .verifiedCheckbox {
        display: grid;
        place-items: center;
        width: 22px;
        height: 22px;
        border: 1px solid #cfd8cc;
        border-radius: 7px;
        background: white;
        color: #183a27;
      }

      .verifiedFilter input:checked + .verifiedCheckbox {
        border-color: #c9f28c;
        background: #c9f28c;
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

      .hostsError {
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

      .hostsError > span {
        display: grid;
        place-items: center;
        width: 32px;
        height: 32px;
        border-radius: 10px;
        background: #f7d7d3;
      }

      .hostsError p {
        margin: 0;
        font-size: 11px;
      }

      .hostsError button {
        border: 0;
        background: transparent;
        color: inherit;
        cursor: pointer;
        font-size: 10px;
        font-weight: 850;
      }

      .hostsSectionHeader {
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

      .hostsSectionHeader h2,
      .hostsTrustSection h2,
      .hostsCta h2 {
        margin: 8px 0 0;
        color: #20342a;
        font-size: clamp(34px, 5vw, 51px);
        line-height: 0.98;
        letter-spacing: -0.06em;
      }

      .hostsSectionHeader p {
        margin: 10px 0 0;
        color: #818c84;
        font-size: 10px;
      }

      .hostResultCount {
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

      .hostsGrid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 20px;
      }

      .hostCard {
        min-width: 0;
        overflow: hidden;
        border: 1px solid rgba(40, 65, 49, 0.1);
        border-radius: 28px;
        background: rgba(255, 255, 255, 0.9);
        box-shadow:
          0 12px 35px rgba(31, 51, 38, 0.05),
          0 2px 8px rgba(31, 51, 38, 0.03);
        transition:
          transform 0.22s ease,
          box-shadow 0.22s ease,
          border-color 0.22s ease;
      }

      .hostCard:hover {
        transform: translateY(-6px);
        border-color: rgba(111, 145, 94, 0.25);
        box-shadow:
          0 26px 58px rgba(31, 51, 38, 0.12),
          0 5px 15px rgba(31, 51, 38, 0.04);
      }

      .hostCover {
        position: relative;
        height: 220px;
        overflow: hidden;
      }

      .hostCoverImage {
        width: 100%;
        height: 100%;
        display: block;
        object-fit: cover;
        transition: transform 0.58s ease;
      }

      .hostCard:hover .hostCoverImage {
        transform: scale(1.055);
      }

      .hostCoverOverlay {
        position: absolute;
        inset: 0;
        background:
          linear-gradient(
            180deg,
            rgba(4, 14, 8, 0.04),
            rgba(4, 14, 8, 0.08) 42%,
            rgba(4, 14, 8, 0.72)
          );
      }

      .hostStatus {
        position: absolute;
        top: 14px;
        right: 14px;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-height: 31px;
        padding: 0 10px;
        border: 1px solid rgba(255, 255, 255, 0.18);
        border-radius: 999px;
        background: rgba(5, 20, 11, 0.58);
        color: rgba(255, 255, 255, 0.9);
        font-size: 8px;
        font-weight: 900;
        backdrop-filter: blur(12px);
      }

      .hostStatus.verified {
        border-color: rgba(201, 242, 140, 0.34);
        background: rgba(24, 58, 39, 0.72);
        color: #daf8ae;
      }

      .hostCardBody {
        padding: 0 20px 20px;
      }

      .hostIdentity {
        display: flex;
        align-items: flex-end;
        gap: 14px;
        min-width: 0;
      }

      .hostAvatar {
        flex: 0 0 auto;
        width: 86px;
        height: 86px;
        margin-top: -43px;
        border: 4px solid white;
        border-radius: 25px;
        object-fit: cover;
        background: #e5ebdf;
        box-shadow:
          0 14px 30px rgba(29, 46, 35, 0.14),
          0 3px 8px rgba(29, 46, 35, 0.05);
      }

      .hostIdentityText {
        min-width: 0;
        flex: 1;
        padding: 15px 0 2px;
      }

      .hostIdentityText h2 {
        overflow: hidden;
        margin: 0;
        color: #25382d;
        font-size: 22px;
        line-height: 1.08;
        letter-spacing: -0.045em;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .hostIdentityText > span {
        display: block;
        overflow: hidden;
        margin-top: 5px;
        color: #879188;
        font-size: 10px;
        font-weight: 750;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .hostIdentityLocation {
        display: flex;
        align-items: center;
        gap: 6px;
        min-width: 0;
        margin-top: 9px;
        color: #5f7167;
      }

      .hostIdentityLocation svg {
        flex: 0 0 auto;
        color: #6f9250;
      }

      .hostIdentityLocation span {
        display: block;
        min-width: 0;
        overflow: hidden;
        font-size: 11px;
        font-weight: 800;
        line-height: 1.25;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .hostLocation {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        margin-top: 18px;
        padding: 8px 10px;
        border: 1px solid #dfe6dc;
        border-radius: 999px;
        background: #f6f8f3;
        color: #65756c;
        font-size: 9px;
        font-weight: 800;
      }

      .hostLocation svg {
        flex: 0 0 auto;
        color: #769657;
      }

      .hostBio {
        display: -webkit-box;
        min-height: 58px;
        margin: 15px 0 0;
        overflow: hidden;
        color: #707d75;
        font-size: 10px;
        line-height: 1.7;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 3;
      }

      .hostActivities {
        display: flex;
        flex-wrap: wrap;
        gap: 7px;
        margin-top: 15px;
      }

      .hostActivities > span {
        display: inline-flex;
        align-items: center;
        min-height: 30px;
        padding: 0 10px;
        border: 1px solid #d8e0d5;
        border-radius: 999px;
        background: #f5f8f1;
        color: #596b60;
        font-size: 8px;
        font-weight: 850;
      }

      .hostActivities .moreActivities {
        border-color: #cad9be;
        background: #e7efde;
        color: #5c7744;
      }

      .hostCardFooter {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        gap: 12px;
        margin-top: 20px;
        padding-top: 17px;
        border-top: 1px solid #e1e7df;
      }

      .hostTrust {
        display: flex;
        align-items: center;
        gap: 9px;
        min-width: 0;
      }

      .hostTrust > span {
        display: grid;
        place-items: center;
        flex: 0 0 auto;
        width: 38px;
        height: 38px;
        border-radius: 12px;
        background: #e8f1dd;
        color: #5b7840;
      }

      .hostTrust strong,
      .hostTrust small {
        display: block;
      }

      .hostTrust strong {
        color: #44564b;
        font-size: 9px;
      }

      .hostTrust small {
        margin-top: 3px;
        color: #929b94;
        font-size: 7px;
      }

      .viewHostButton {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        flex: 0 0 auto;
        min-height: 42px;
        padding: 0 14px;
        border-radius: 13px;
        background: #183a27;
        color: white !important;
        font-size: 8px;
        font-weight: 900;
        box-shadow: 0 10px 22px rgba(24, 58, 39, 0.14);
        transition:
          gap 0.18s ease,
          transform 0.18s ease,
          background 0.18s ease;
      }

      .viewHostButton:hover {
        gap: 11px;
        transform: translateY(-1px);
        background: #224d35;
      }

      .emptyHosts {
        display: grid;
        place-items: center;
        padding: 70px 25px;
        border: 1px dashed #ccd7c9;
        border-radius: 24px;
        background: rgba(255, 255, 255, 0.58);
        text-align: center;
      }

      .emptyHosts > span {
        display: grid;
        place-items: center;
        width: 64px;
        height: 64px;
        border-radius: 20px;
        background: #e7f0dc;
        color: #608047;
      }

      .emptyHosts h3 {
        margin: 18px 0 0;
        color: #34483b;
        font-size: 20px;
        letter-spacing: -0.03em;
      }

      .emptyHosts p {
        max-width: 520px;
        margin: 10px auto 0;
        color: #869188;
        font-size: 11px;
        line-height: 1.65;
      }

      .emptyHosts button,
      .emptyHosts a {
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

      .hostsTrustSection {
        display: grid;
        grid-template-columns: minmax(0, 0.8fr) minmax(520px, 1.2fr);
        gap: 35px;
        margin-top: 45px;
        padding: 34px;
        border: 1px solid #dbe3d8;
        border-radius: 28px;
        background: rgba(255, 255, 255, 0.68);
        box-shadow: 0 16px 42px rgba(31, 51, 38, 0.05);
      }

      .trustIntro p {
        max-width: 520px;
        margin: 15px 0 0;
        color: #7d8981;
        font-size: 11px;
        line-height: 1.7;
      }

      .trustCards {
        display: grid;
        gap: 11px;
      }

      .trustCards article {
        display: flex;
        align-items: flex-start;
        gap: 13px;
        padding: 15px;
        border: 1px solid #dde4da;
        border-radius: 17px;
        background: #f8faf6;
      }

      .trustCards article > span {
        display: grid;
        place-items: center;
        flex: 0 0 auto;
        width: 42px;
        height: 42px;
        border-radius: 13px;
        background: #e7f0dc;
        color: #5e7b43;
      }

      .trustCards strong,
      .trustCards small {
        display: block;
      }

      .trustCards strong {
        color: #3c5143;
        font-size: 11px;
      }

      .trustCards small {
        margin-top: 5px;
        color: #89938c;
        font-size: 9px;
        line-height: 1.55;
      }

      .hostsCta {
        position: relative;
        isolation: isolate;
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 35px;
        margin-top: 28px;
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

      .hostsCta::after {
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

      .hostsCta .sectionKicker {
        color: #c9f28c;
      }

      .hostsCta h2 {
        max-width: 760px;
        color: white;
      }

      .hostsCta p {
        max-width: 620px;
        margin: 14px 0 0;
        color: rgba(255, 255, 255, 0.57);
        font-size: 11px;
        line-height: 1.65;
      }

      .hostsCta > a {
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

      .hostsCta > a:hover {
        gap: 12px;
        transform: translateY(-2px);
      }

      .hostsStatePage {
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

      .hostsStateCard {
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

      .hostsLoader {
        width: 37px;
        height: 37px;
        border: 3px solid #dce5d7;
        border-top-color: #52783c;
        border-radius: 50%;
        animation: hostsSpin 0.8s linear infinite;
      }

      @keyframes hostsSpin {
        to {
          transform: rotate(360deg);
        }
      }

      .hostsStateCard h1 {
        margin: 18px 0 0;
        color: #24372c;
        font-size: 28px;
        letter-spacing: -0.04em;
      }

      .hostsStateCard p {
        margin: 9px 0 0;
        color: #7e8981;
        font-size: 11px;
      }

      @media (max-width: 1080px) {
        .hostsFilters {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .searchField {
          grid-column: 1 / -1;
        }

        .hostsGrid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .hostsTrustSection {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 760px) {
        .hostsPage {
          padding: 94px 0 70px;
        }

        .hostsHero {
          min-height: 600px;
          padding: 24px;
          border-radius: 0 0 31px 31px;
        }

        .hostsHeroContent h1 {
          font-size: clamp(54px, 12vw, 78px);
        }

        .hostsFilters {
          margin-right: 18px;
          margin-left: 18px;
        }

        .hostsSectionHeader,
        .hostsGrid,
        .emptyHosts,
        .hostsTrustSection,
        .hostsCta,
        .hostsError {
          margin-right: 18px;
          margin-left: 18px;
        }

        .hostsCta {
          align-items: flex-start;
          flex-direction: column;
        }
      }

      @media (max-width: 580px) {
        .hostsHero {
          min-height: 570px;
          padding: 20px;
        }

        .hostsHeroContent h1 {
          font-size: 48px;
        }

        .heroStats,
        .hostsFilters,
        .hostsGrid {
          grid-template-columns: 1fr;
        }

        .searchField {
          grid-column: auto;
        }

        .hostsSectionHeader {
          align-items: flex-start;
          flex-direction: column;
        }

        .hostCard {
          border-radius: 25px;
        }

        .hostCover {
          height: 235px;
        }

        .hostCardBody {
          padding: 0 17px 18px;
        }

        .hostAvatar {
          width: 88px;
          height: 88px;
          margin-top: -43px;
          border-radius: 26px;
        }

        .hostCardFooter {
          grid-template-columns: 1fr;
        }

        .viewHostButton {
          width: 100%;
          min-height: 48px;
          font-size: 9px;
        }

        .hostsTrustSection {
          padding: 25px;
        }

        .hostsCta {
          padding: 27px;
        }
      }

      @media (max-width: 420px) {
        .hostsHero {
          min-height: 550px;
          padding: 17px;
        }

        .hostsHeroContent h1 {
          font-size: 42px;
        }

        .hostsHeroContent p {
          font-size: 13px;
        }

        .hostsFilters,
        .hostsSectionHeader,
        .hostsGrid,
        .emptyHosts,
        .hostsTrustSection,
        .hostsCta,
        .hostsError {
          margin-right: 13px;
          margin-left: 13px;
        }

        .hostsCta h2 {
          font-size: 35px;
        }
      }


      /* =========================================================
         HOST CARDS — PREMIUM REDESIGN
         ========================================================= */

      .hostsSectionHeader {
        margin-top: 68px;
        margin-bottom: 26px;
      }

      .hostsGrid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 24px;
      }

      .hostCard {
        position: relative;
        min-width: 0;
        overflow: hidden;
        border: 1px solid rgba(36, 60, 44, 0.09);
        border-radius: 30px;
        background: #ffffff;
        box-shadow:
          0 10px 30px rgba(31, 51, 38, 0.055),
          0 1px 0 rgba(255, 255, 255, 0.85) inset;
        transition:
          transform 0.25s ease,
          box-shadow 0.25s ease,
          border-color 0.25s ease;
      }

      .hostCard::after {
        position: absolute;
        inset: 0;
        z-index: 0;
        border: 1px solid transparent;
        border-radius: inherit;
        pointer-events: none;
        content: "";
        transition: border-color 0.25s ease;
      }

      .hostCard:hover {
        transform: translateY(-8px);
        border-color: rgba(96, 130, 77, 0.22);
        box-shadow:
          0 30px 70px rgba(29, 49, 36, 0.14),
          0 8px 24px rgba(29, 49, 36, 0.05);
      }

      .hostMedia {
        position: relative;
        display: block;
        height: 292px;
        overflow: hidden;
        background: #dce5d6;
      }

      .hostCover,
      .hostCoverOverlay,
      .hostLocation {
        display: none;
      }

      .hostCoverImage {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition:
          transform 0.75s cubic-bezier(0.2, 0.7, 0.2, 1),
          filter 0.3s ease;
      }

      .hostCard:hover .hostCoverImage {
        transform: scale(1.065);
        filter: saturate(1.05);
      }

      .hostMediaShade {
        position: absolute;
        inset: 0;
        background:
          linear-gradient(
            180deg,
            rgba(5, 17, 10, 0.22) 0%,
            rgba(5, 17, 10, 0.02) 42%,
            rgba(5, 17, 10, 0.78) 100%
          );
      }

      .hostMediaTop {
        position: absolute;
        top: 15px;
        right: 15px;
        left: 15px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }

      .hostStatus {
        position: static;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-height: 33px;
        padding: 0 11px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 999px;
        background: rgba(6, 22, 12, 0.58);
        color: rgba(255, 255, 255, 0.92);
        font-size: 8px;
        font-weight: 900;
        letter-spacing: 0.02em;
        backdrop-filter: blur(15px);
      }

      .hostStatus.verified {
        border-color: rgba(211, 247, 163, 0.34);
        background: rgba(26, 63, 42, 0.76);
        color: #d8f7aa;
      }

      .hostMediaArrow {
        display: grid;
        place-items: center;
        width: 36px;
        height: 36px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.12);
        color: white;
        backdrop-filter: blur(15px);
        transition:
          transform 0.2s ease,
          background 0.2s ease;
      }

      .hostCard:hover .hostMediaArrow {
        transform: translateX(2px);
        background: rgba(255, 255, 255, 0.22);
      }

      .hostMediaBottom {
        display: none;
      }

      .hostCardBody {
        position: relative;
        z-index: 1;
        padding: 0 22px 22px;
      }

      .hostIdentity {
        display: flex;
        align-items: flex-end;
        gap: 14px;
        min-width: 0;
      }

      .hostAvatarWrap {
        position: relative;
        flex: 0 0 auto;
        display: block;
      }

      .hostAvatar {
        display: block;
        width: 96px;
        height: 96px;
        margin-top: -47px;
        border: 5px solid #ffffff;
        border-radius: 29px;
        object-fit: cover;
        background: #e5ebdf;
        box-shadow:
          0 14px 32px rgba(29, 46, 35, 0.17),
          0 3px 8px rgba(29, 46, 35, 0.06);
        transition: transform 0.2s ease;
      }

      .hostAvatarWrap:hover .hostAvatar {
        transform: translateY(-2px);
      }

      .avatarVerified {
        position: absolute;
        right: -3px;
        bottom: 3px;
        display: grid;
        place-items: center;
        width: 25px;
        height: 25px;
        border: 3px solid white;
        border-radius: 50%;
        background: #c9f28c;
        color: #183a27;
        box-shadow: 0 5px 12px rgba(24, 58, 39, 0.16);
      }

      .hostIdentityText {
        min-width: 0;
        flex: 1;
        padding: 16px 0 3px;
      }

      .hostNameRow {
        display: flex;
        align-items: center;
        gap: 6px;
        min-width: 0;
      }

      .hostIdentityText h2 {
        overflow: hidden;
        margin: 0;
        color: #20352a;
        font-size: 22px;
        line-height: 1.05;
        letter-spacing: -0.045em;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .hostIdentityText > span {
        display: block;
        overflow: hidden;
        margin-top: 5px;
        color: #8a958d;
        font-size: 9px;
        font-weight: 800;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .hostBio {
        display: -webkit-box;
        min-height: 61px;
        margin: 18px 0 0;
        overflow: hidden;
        color: #6f7d74;
        font-size: 10px;
        line-height: 1.7;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 3;
      }

      .hostActivities {
        display: flex;
        flex-wrap: wrap;
        gap: 7px;
        min-height: 31px;
        margin-top: 16px;
      }

      .hostActivities > span {
        display: inline-flex;
        align-items: center;
        min-height: 30px;
        padding: 0 10px;
        border: 1px solid #dce5d8;
        border-radius: 999px;
        background: #f5f8f2;
        color: #52665a;
        font-size: 8px;
        font-weight: 850;
      }

      .hostActivities .moreActivities {
        border-color: #d4e1ca;
        background: #eaf2e2;
        color: #587640;
      }

      .hostCardFooter {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-top: 19px;
        padding-top: 17px;
        border-top: 1px solid #e6ebe3;
      }

      .hostTrust {
        display: flex;
        align-items: center;
        gap: 9px;
        min-width: 0;
      }

      .hostTrustIcon {
        display: grid;
        place-items: center;
        flex: 0 0 auto;
        width: 37px;
        height: 37px;
        border-radius: 12px;
        background: #e9f2df;
        color: #58773e;
      }

      .hostTrust strong,
      .hostTrust small {
        display: block;
      }

      .hostTrust strong {
        color: #405348;
        font-size: 8px;
      }

      .hostTrust small {
        margin-top: 3px;
        color: #98a199;
        font-size: 7px;
      }

      .viewHostButton {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        flex: 0 0 auto;
        min-height: 41px;
        padding: 0 13px;
        border-radius: 13px;
        background: #183a27;
        color: white !important;
        font-size: 8px;
        font-weight: 900;
        box-shadow: 0 8px 18px rgba(24, 58, 39, 0.13);
        transition:
          gap 0.18s ease,
          transform 0.18s ease,
          background 0.18s ease;
      }

      .viewHostButton:hover {
        gap: 11px;
        transform: translateY(-1px);
        background: #224d35;
      }

      @media (max-width: 1080px) {
        .hostsGrid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 580px) {
        .hostsGrid {
          grid-template-columns: 1fr;
        }

        .hostMedia {
          height: 235px;
        }

        .hostCard {
          border-radius: 26px;
        }
      }

      @media (max-width: 420px) {
        .hostMedia {
          height: 220px;
        }

        .hostAvatar {
          width: 80px;
          height: 80px;
          margin-top: -39px;
          border-radius: 24px;
        }

        .hostIdentityText h2 {
          font-size: 20px;
        }

        .hostCardFooter {
          align-items: center;
          flex-direction: row;
        }

        .viewHostButton {
          width: auto;
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
         HOSTS — COMPACT DISCOVERY
         ========================================================= */

      .hostsPage {
        padding: 82px 18px 44px;
      }

      .hostsHero {
        min-height: 250px;
        padding: 22px;
        border-radius: 24px;
      }

      .hostsHeroContent {
        max-width: 760px;
        padding: 28px 0 22px;
      }

      .heroKicker {
        padding: 7px 10px;
        font-size: 8px;
      }

      .hostsHeroContent h1 {
        margin-top: 14px;
        font-size: clamp(42px, 6vw, 68px);
        line-height: .92;
      }

      .hostsHeroContent p {
        max-width: 590px;
        margin-top: 13px;
        font-size: 12px;
        line-height: 1.55;
      }

      .heroStats {
        gap: 8px;
        padding-top: 14px;
      }

      .heroStats strong {
        font-size: 20px;
      }

      .heroStats span {
        font-size: 7px;
      }

      .hostsFilters {
        grid-template-columns:
          minmax(260px, 1.6fr)
          minmax(150px, .7fr)
          minmax(150px, .7fr)
          auto
          auto;
        gap: 8px;
        margin: -22px 18px 0;
        padding: 9px;
        border-radius: 16px;
      }

      .searchField,
      .filterField,
      .verifiedFilter,
      .clearFilters {
        min-height: 44px;
        border-radius: 11px;
      }

      .searchField,
      .filterField {
        padding: 0 11px;
      }

      .searchField input,
      .filterField select {
        min-height: 42px;
        font-size: 10px;
      }

      .verifiedFilter,
      .clearFilters {
        padding: 0 11px;
        font-size: 8px;
      }

      .hostsSectionHeader {
        margin: 28px 0 14px;
        align-items: center;
      }

      .hostsSectionHeader h2 {
        margin-top: 4px;
        font-size: clamp(26px, 4vw, 38px);
      }

      .hostsSectionHeader p {
        margin-top: 6px;
        font-size: 9px;
      }

      .hostResultCount {
        padding: 8px 10px;
        border-radius: 10px;
        font-size: 9px;
      }

      .hostsGrid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 14px;
      }

      .hostCard {
        border-radius: 20px;
      }

      .hostMedia {
        height: 170px;
      }

      .hostMediaTop {
        top: 10px;
        right: 10px;
        left: 10px;
      }

      .hostStatus {
        min-height: 27px;
        padding: 0 8px;
        font-size: 7px;
      }

      .hostMediaArrow {
        width: 30px;
        height: 30px;
      }

      .hostMediaBottom {
        right: 10px;
        bottom: 10px;
        left: 10px;
      }

      .hostMediaBottom > span {
        min-height: 27px;
        padding: 0 8px;
        font-size: 7px;
      }

      .hostCardBody {
        padding: 0 14px 14px;
      }

      .hostIdentity {
        gap: 10px;
      }

      .hostAvatar {
        width: 60px;
        height: 60px;
        margin-top: -30px;
        border-width: 3px;
        border-radius: 18px;
      }

      .hostIdentityText {
        padding: 9px 0 1px;
      }

      .hostIdentityText h2 {
        font-size: 17px;
      }

      .hostIdentityText span {
        margin-top: 3px;
        font-size: 8px;
      }

      .hostBio {
        min-height: 0;
        margin-top: 10px;
        font-size: 9px;
        line-height: 1.5;
        -webkit-line-clamp: 2;
      }

      .hostActivities {
        gap: 5px;
        margin-top: 10px;
      }

      .hostActivities > span {
        min-height: 25px;
        padding: 0 8px;
        font-size: 7px;
      }

      .hostCardFooter {
        margin-top: 11px;
        padding-top: 10px;
      }

      .hostTrust {
        display: none;
      }

      .viewHostButton {
        width: 100%;
        min-height: 36px;
        padding: 0 12px;
        border-radius: 10px;
        font-size: 8px;
      }

      .hostsTrustSection {
        margin-top: 24px;
        padding: 18px;
        grid-template-columns: 1fr;
        gap: 12px;
        border-radius: 20px;
      }

      .trustIntro {
        display: none;
      }

      .trustCards {
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
      }

      .trustCards article {
        align-items: center;
        padding: 10px;
        border-radius: 12px;
      }

      .trustCards article > span {
        width: 34px;
        height: 34px;
        border-radius: 10px;
      }

      .trustCards strong {
        font-size: 9px;
      }

      .trustCards small {
        margin-top: 3px;
        font-size: 7px;
        line-height: 1.4;
      }

      .hostsCta {
        margin-top: 16px;
        padding: 20px 22px;
        border-radius: 20px;
      }

      .hostsCta h2 {
        font-size: clamp(26px, 4vw, 38px);
      }

      .hostsCta p {
        margin-top: 8px;
        font-size: 9px;
      }

      .hostsCta > a {
        min-height: 40px;
        padding: 0 13px;
        border-radius: 11px;
        font-size: 8px;
      }

      .hostsPagination {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        margin-top: 18px;
      }

      .hostsPagination button {
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

      .hostsPagination button:disabled {
        opacity: .4;
        cursor: default;
      }

      .hostsPagination span {
        color: #76827a;
        font-size: 9px;
        font-weight: 800;
      }

      @media (max-width: 1080px) {
        .hostsGrid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .trustCards {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 760px) {
        .hostsPage {
          padding: 74px 0 34px;
        }

        .hostsHero {
          min-height: 180px;
          padding: 16px;
          border-radius: 0 0 22px 22px;
        }

        .hostsHeroContent {
          padding: 18px 0 12px;
        }

        .hostsHeroContent h1 {
          margin-top: 9px;
          font-size: 34px;
        }

        .hostsHeroContent p {
          margin-top: 7px;
          font-size: 10px;
        }

        .heroStats {
          gap: 5px;
          padding-top: 10px;
        }

        .heroStats strong {
          font-size: 16px;
        }

        .heroStats span {
          font-size: 6px;
        }

        .hostsFilters {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          margin: -14px 12px 0;
          padding: 7px;
          gap: 6px;
        }

        .searchField {
          grid-column: 1 / -1;
        }

        .hostsSectionHeader,
        .hostsGrid,
        .emptyHosts,
        .hostsTrustSection,
        .hostsCta,
        .hostsError,
        .hostsPagination {
          margin-right: 12px;
          margin-left: 12px;
        }

        .hostsSectionHeader {
          margin-top: 20px;
          margin-bottom: 10px;
        }

        .hostsSectionHeader h2 {
          font-size: 27px;
        }

        .hostsGrid {
          grid-template-columns: 1fr;
          gap: 10px;
        }

        .hostCard {
          display: grid;
          grid-template-columns: 116px minmax(0, 1fr);
          min-height: 156px;
          border-radius: 16px;
        }

        .hostMedia {
          height: 100%;
          min-height: 156px;
        }

        .hostMediaTop {
          inset: 8px 8px auto 8px;
        }

        .hostStatus {
          max-width: 92px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .hostMediaArrow {
          display: none;
        }

        .hostMediaBottom {
          right: 8px;
          bottom: 8px;
          left: 8px;
        }

        .hostMediaBottom > span {
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .hostCardBody {
          min-width: 0;
          padding: 10px 11px;
        }

        .hostAvatarWrap {
          display: none;
        }

        .hostIdentityText {
          padding: 0;
        }

        .hostIdentityText h2 {
          font-size: 15px;
        }

        .hostIdentityText span {
          font-size: 8px;
        }

        .hostBio {
          margin-top: 8px;
          font-size: 9px;
          line-height: 1.4;
          -webkit-line-clamp: 2;
        }

        .hostActivities {
          margin-top: 8px;
        }

        .hostActivities > span {
          min-height: 23px;
          padding: 0 7px;
          font-size: 7px;
        }

        .hostActivities > span:nth-child(n+3) {
          display: none;
        }

        .hostCardFooter {
          margin-top: 9px;
          padding-top: 8px;
        }

        .viewHostButton {
          min-height: 34px;
          font-size: 8px;
        }

        .hostsTrustSection {
          margin-top: 18px;
          padding: 12px;
        }

        .trustCards {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          scrollbar-width: none;
        }

        .trustCards::-webkit-scrollbar {
          display: none;
        }

        .trustCards article {
          flex: 0 0 220px;
        }

        .hostsCta {
          align-items: center;
          flex-direction: row;
          gap: 12px;
          padding: 16px;
        }

        .hostsCta .sectionKicker,
        .hostsCta p {
          display: none;
        }

        .hostsCta h2 {
          margin: 0;
          font-size: 20px;
        }

        .hostsCta > a {
          min-height: 38px;
          white-space: nowrap;
        }
      }

      @media (max-width: 580px) {
        .hostsHero {
          min-height: 165px;
        }

        .hostsHeroContent h1 {
          font-size: 31px;
        }

        .hostsHeroContent p {
          font-size: 9.5px;
        }

        .hostCard {
          grid-template-columns: 108px minmax(0, 1fr);
          min-height: 150px;
        }

        .hostMedia {
          min-height: 150px;
        }
      }


      /* =========================================================
         HOSTS V3 — PREMIUM COMPACT DISCOVERY
         Existing profile query, filters and pagination preserved.
         ========================================================= */

      .hostsPage{
        padding-top:74px;
        padding-bottom:46px;
      }

      .hostsHero,
      .hostsContent{
        width:min(1420px,calc(100% - 28px));
      }

      .hostsHero{
        min-height:320px;
        border-radius:26px;
      }

      .hostsHeroContent{
        max-width:780px;
        padding:30px;
      }

      .hostsHeroContent h1{
        font-size:clamp(42px,5vw,68px);
        line-height:.94;
        letter-spacing:-.065em;
      }

      .hostsHeroContent p{
        max-width:650px;
        margin-top:12px;
        font-size:11px;
        line-height:1.55;
      }

      .heroStats{
        right:20px;
        bottom:18px;
        left:20px;
        gap:6px;
      }

      .heroStats article{
        min-height:56px;
        padding:8px 10px;
        border-radius:12px;
      }

      .heroStats strong{font-size:16px}
      .heroStats span{font-size:6px}

      .hostsContent{
        padding-top:10px;
      }

      .hostsFilters{
        position:sticky;
        top:72px;
        z-index:25;
        gap:6px;
        padding:8px;
        border-radius:14px;
        backdrop-filter:blur(18px);
      }

      .searchField,
      .filterField,
      .verifiedFilter{
        min-height:40px;
        border-radius:10px;
      }

      .searchField input,
      .filterField select{
        font-size:9px;
      }

      .hostsSectionHeader{
        margin-top:10px;
        margin-bottom:8px;
      }

      .hostsSectionHeader h2{
        font-size:clamp(20px,2.2vw,28px);
      }

      .hostsGrid{
        gap:10px;
      }

      .hostCard{
        border-radius:17px;
        overflow:hidden;
      }

      .hostMedia{
        min-height:180px;
      }

      .hostCardBody{
        padding:11px;
      }

      .hostAvatarWrap{
        width:46px;
        height:46px;
      }

      .hostIdentityText h2{
        font-size:16px;
      }

      .hostBio{
        display:-webkit-box;
        min-height:30px;
        margin-top:8px;
        overflow:hidden;
        font-size:8px;
        line-height:1.45;
        -webkit-box-orient:vertical;
        -webkit-line-clamp:2;
      }

      .hostActivities{
        gap:4px;
        margin-top:8px;
      }

      .hostActivities span{
        padding:5px 7px;
        font-size:6px;
      }

      .hostCardFooter{
        margin-top:8px;
        padding-top:8px;
      }

      .viewHostButton{
        min-height:32px;
        padding:0 9px;
        border-radius:9px;
      }

      @media(max-width:760px){
        .hostsPage{
          padding-top:62px;
          padding-bottom:62px;
        }

        .hostsHero,
        .hostsContent{
          width:100%;
        }

        .hostsHero{
          min-height:285px;
          border-radius:0 0 22px 22px;
        }

        .hostsHeroContent{
          padding:18px 14px 78px;
        }

        .hostsHeroContent h1{
          font-size:35px;
        }

        .hostsHeroContent p{
          max-width:92%;
          font-size:9px;
        }

        .heroStats{
          right:10px;
          bottom:10px;
          left:10px;
          gap:4px;
        }

        .heroStats article{
          min-height:48px;
          padding:6px;
        }

        .heroStats strong{font-size:12px}
        .heroStats span{font-size:5px}

        .hostsContent{padding:6px}

        .hostsFilters{
          top:60px;
          display:flex;
          gap:5px;
          overflow-x:auto;
          padding:6px;
          scrollbar-width:none;
        }

        .hostsFilters::-webkit-scrollbar{display:none}

        .searchField{
          flex:1 0 78vw;
          min-width:240px;
        }

        .filterField,
        .verifiedFilter{
          flex:0 0 auto;
          min-width:150px;
        }

        .hostsGrid{
          display:flex;
          gap:8px;
          overflow-x:auto;
          padding:2px 14px 7px 1px;
          scroll-snap-type:x mandatory;
          scrollbar-width:none;
        }

        .hostsGrid::-webkit-scrollbar{display:none}

        .hostCard{
          flex:0 0 82vw;
          max-width:315px;
          display:block;
          min-height:auto;
          scroll-snap-align:start;
        }

        .hostMedia{
          min-height:170px;
          height:170px;
        }

        .hostCardBody{padding:10px}
      }

      @media(max-width:420px){
        .hostsHero{min-height:270px}
        .hostsHeroContent h1{font-size:31px}
        .hostCard{flex-basis:86vw}
      }


      /* CATALOG HOST DIRECTORY */
      .hostOfferTypes{
        display:flex;
        flex-wrap:wrap;
        gap:5px;
        margin-top:9px;
      }

      .hostOfferType{
        display:inline-flex;
        align-items:center;
        min-height:24px;
        padding:0 8px;
        border:1px solid #dce5d8;
        border-radius:999px;
        background:#fff;
        color:#5d6e63;
        font-size:6px;
        font-weight:900;
      }

      .hostOfferType.adventure{
        background:#edf5e7;
        color:#587441;
      }

      .hostOfferType.accommodation{
        background:#f0f4ea;
        color:#4f6756;
      }

      .hostOfferType.service{
        background:#f5f3ea;
        color:#796d47;
      }

      .hostOfferType.rental{
        background:#eef3f2;
        color:#526b67;
      }

      .hostsFilters{
        grid-template-columns:
          minmax(240px,1.4fr)
          minmax(145px,.62fr)
          minmax(145px,.62fr)
          minmax(145px,.62fr)
          auto
          auto;
      }

      @media(max-width:1080px){
        .hostsFilters{
          grid-template-columns:repeat(2,minmax(0,1fr));
        }
      }

      @media(max-width:760px){
        .hostsFilters{
          display:flex;
        }
      }



      /* =========================================================
         MEETOUTDOORS SIGNATURE UI — premium visual system
         Visual treatment only. Data/filter/routing logic unchanged.
         ========================================================= */

      :root {
        --mo-bg: #eef1ea;
        --mo-paper: rgba(255,255,255,.88);
        --mo-paper-solid: #f9faf6;
        --mo-ink: #14231a;
        --mo-muted: #758078;
        --mo-deep: #07140c;
        --mo-green: #c8f79d;
        --mo-green-2: #a8dc7c;
        --mo-line: rgba(18,42,26,.085);
        --mo-shadow-sm: 0 12px 34px rgba(26,52,34,.08);
        --mo-shadow-md: 0 22px 60px rgba(22,47,31,.12);
        --mo-shadow-lg: 0 36px 100px rgba(17,43,27,.18);
      }

      .hostsPage,
      .eventsPage {
        background:
          radial-gradient(circle at 9% 3%, rgba(176,214,137,.17), transparent 24%),
          radial-gradient(circle at 94% 30%, rgba(73,118,79,.10), transparent 23%),
          linear-gradient(180deg, #f1f4ed 0%, #ecefe8 100%);
      }

      .heroKicker {
        border: 1px solid rgba(255,255,255,.18);
        background: rgba(255,255,255,.075);
        box-shadow: inset 0 1px 0 rgba(255,255,255,.07);
        backdrop-filter: blur(18px) saturate(130%);
        -webkit-backdrop-filter: blur(18px) saturate(130%);
      }

      .heroKicker > span {
        background: #d6ffae;
        box-shadow:
          0 0 0 5px rgba(205,255,166,.09),
          0 0 22px rgba(205,255,166,.35);
      }

      .sectionKicker {
        letter-spacing: .13em !important;
        font-weight: 900 !important;
      }

      .searchField,
      .filterField {
        border-color: rgba(28,51,35,.08);
        background: rgba(248,250,246,.88);
        box-shadow: inset 0 1px 0 rgba(255,255,255,.75);
      }

      .searchField:hover,
      .filterField:hover {
        border-color: rgba(72,112,79,.17);
        background: #fff;
      }

      .searchField:focus-within,
      .filterField:focus-within {
        border-color: rgba(93,135,93,.44);
        background: #fff;
        box-shadow:
          0 0 0 4px rgba(116,157,104,.085),
          0 10px 28px rgba(31,60,40,.07);
      }

      .clearFilters {
        transition:
          transform .18s ease,
          border-color .18s ease,
          box-shadow .18s ease;
      }

      .clearFilters:hover {
        transform: translateY(-1px);
        border-color: rgba(163,77,64,.28);
        box-shadow: 0 10px 25px rgba(130,60,50,.08);
      }

      .hostsSectionHeader h2,
      .eventsSectionHeader h2,
      .trustIntro h2,
      .hostsCta h2,
      .eventsCta h2 {
        letter-spacing: -.055em !important;
        text-wrap: balance;
      }

      .hostsPagination button,
      .eventsPagination button {
        border: 1px solid rgba(28,51,35,.09);
        background: rgba(255,255,255,.76);
        box-shadow: inset 0 1px 0 rgba(255,255,255,.65);
        transition:
          transform .18s ease,
          box-shadow .18s ease,
          background .18s ease;
      }

      .hostsPagination button:not(:disabled):hover,
      .eventsPagination button:not(:disabled):hover {
        transform: translateY(-1px);
        background: #fff;
        box-shadow: 0 10px 26px rgba(30,57,39,.09);
      }

      @media (prefers-reduced-motion: reduce) {
        .hostCard,
        .eventCard,
        .hostMedia img,
        .eventImage,
        .viewHostButton,
        .eventArrow {
          transition: none !important;
        }
      }

      /* ========================= HOSTS — SIGNATURE ========================= */

      .hostsPage {
        padding-top: 104px;
      }

      .hostsHero {
        min-height: 650px;
        border-radius: 38px;
        box-shadow:
          0 40px 110px rgba(20,47,29,.22),
          inset 0 1px 0 rgba(255,255,255,.05);
      }

      .hostsHero::before {
        filter: saturate(.91) contrast(1.03);
      }

      .hostsHeroOverlay {
        background:
          radial-gradient(circle at 76% 16%, rgba(202,255,166,.10), transparent 29%),
          linear-gradient(180deg, rgba(3,13,7,.18) 0%, rgba(3,13,7,.26) 34%, rgba(3,13,7,.82) 78%, rgba(3,13,7,.97) 100%),
          linear-gradient(90deg, rgba(3,13,7,.65), rgba(3,13,7,.08) 72%);
      }

      .hostsHeroContent {
        max-width: 930px;
        padding-bottom: 62px;
      }

      .hostsHeroContent h1 {
        max-width: 930px;
        font-size: clamp(58px, 7.6vw, 102px);
        font-weight: 790;
        line-height: .91;
        letter-spacing: -.075em;
        text-shadow: 0 18px 55px rgba(0,0,0,.24);
      }

      .hostsHeroContent p {
        max-width: 600px;
        color: rgba(255,255,255,.70);
        font-size: 15.5px;
        line-height: 1.72;
      }

      .heroStats {
        gap: 0;
        padding-top: 18px;
        border-top-color: rgba(255,255,255,.13);
      }

      .heroStats article {
        position: relative;
        padding: 4px 24px 2px 0;
      }

      .heroStats article:not(:first-child) {
        padding-left: 24px;
      }

      .heroStats article:not(:first-child)::before {
        content: "";
        position: absolute;
        left: 0;
        top: 4px;
        bottom: 4px;
        width: 1px;
        background: rgba(255,255,255,.10);
      }

      .heroStats strong {
        font-size: 29px;
        font-weight: 800;
      }

      .heroStats span {
        color: rgba(255,255,255,.50);
      }

      .hostsFilters {
        margin-top: -37px;
        padding: 10px;
        border: 1px solid rgba(23,50,31,.075);
        border-radius: 25px;
        background: rgba(250,252,248,.86);
        box-shadow:
          0 28px 70px rgba(24,51,32,.13),
          inset 0 1px 0 rgba(255,255,255,.78);
        backdrop-filter: blur(24px) saturate(135%);
        -webkit-backdrop-filter: blur(24px) saturate(135%);
      }

      .verifiedFilter {
        border-color: rgba(28,51,35,.08);
        background: rgba(248,250,246,.88);
        transition: .18s ease;
      }

      .verifiedFilter:hover {
        border-color: rgba(72,112,79,.18);
        background: #fff;
      }

      .verifiedCheckbox {
        border-color: rgba(45,72,52,.15);
        border-radius: 8px;
      }

      .verifiedFilter input:checked + .verifiedCheckbox {
        border-color: #bee991;
        background: linear-gradient(180deg,#d8ffb5,#bde88f);
        box-shadow: 0 5px 14px rgba(108,153,77,.16);
      }

      .hostsSectionHeader {
        margin-top: 72px;
        align-items: center;
      }

      .hostsSectionHeader h2 {
        margin-top: 8px;
        font-size: clamp(34px, 4vw, 56px);
        font-weight: 790;
        line-height: .98;
      }

      .hostsSectionHeader p {
        color: #7a857d;
      }

      .hostResultCount {
        min-width: 54px;
        height: 54px;
        border: 1px solid rgba(26,51,34,.08);
        border-radius: 18px;
        background: rgba(255,255,255,.78);
        box-shadow:
          0 14px 34px rgba(27,54,36,.08),
          inset 0 1px 0 rgba(255,255,255,.8);
      }

      .hostsGrid {
        gap: 22px;
      }

      .hostCard {
        position: relative;
        overflow: hidden;
        border: 1px solid rgba(25,51,33,.075);
        border-radius: 27px;
        background: rgba(255,255,255,.88);
        box-shadow:
          0 14px 38px rgba(31,58,39,.075),
          inset 0 1px 0 rgba(255,255,255,.75);
        transition:
          transform .32s cubic-bezier(.2,.8,.2,1),
          box-shadow .32s ease,
          border-color .32s ease;
      }

      .hostCard:hover {
        transform: translateY(-7px);
        border-color: rgba(82,127,83,.17);
        box-shadow:
          0 30px 70px rgba(24,54,34,.15),
          inset 0 1px 0 rgba(255,255,255,.82);
      }

      .hostMedia {
        min-height: 250px;
        overflow: hidden;
      }

      .hostCoverImage {
        transition: transform .75s cubic-bezier(.2,.8,.2,1);
      }

      .hostCard:hover .hostCoverImage {
        transform: scale(1.045);
      }

      .hostMediaShade {
        background:
          linear-gradient(180deg, rgba(3,13,7,.04) 18%, rgba(3,13,7,.15) 55%, rgba(3,13,7,.72) 100%),
          linear-gradient(90deg, rgba(3,13,7,.22), transparent 60%);
      }

      .hostStatus {
        border: 1px solid rgba(255,255,255,.18);
        background: rgba(5,16,10,.42);
        box-shadow: inset 0 1px 0 rgba(255,255,255,.08);
        backdrop-filter: blur(14px);
      }

      .hostStatus.verified {
        border-color: rgba(211,255,180,.28);
        background: rgba(32,67,34,.48);
        color: #dcffc5;
      }

      .hostMediaArrow {
        border: 1px solid rgba(255,255,255,.16);
        background: rgba(255,255,255,.09);
        backdrop-filter: blur(14px);
        transition: transform .22s ease, background .22s ease;
      }

      .hostCard:hover .hostMediaArrow {
        transform: translateX(3px);
        background: rgba(255,255,255,.15);
      }

      .hostCardBody {
        padding: 0 21px 21px;
      }

      .hostAvatarWrap {
        border: 5px solid rgba(255,255,255,.96);
        box-shadow:
          0 12px 28px rgba(21,50,31,.16),
          0 0 0 1px rgba(21,50,31,.055);
      }

      .avatarVerified {
        background: linear-gradient(180deg,#dcffbd,#b8e889);
        box-shadow: 0 5px 15px rgba(75,122,57,.18);
      }

      .hostIdentityText h2 {
        font-weight: 790;
        letter-spacing: -.035em;
      }

      .hostBio {
        color: #69756e;
        line-height: 1.68;
      }

      .hostActivities span,
      .hostOfferType {
        border-color: rgba(29,56,37,.07);
        background: #f4f6f1;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.72);
      }

      .hostOfferType {
        font-weight: 850;
      }

      .hostCardFooter {
        margin-top: 19px;
        padding-top: 17px;
        border-top-color: rgba(28,52,35,.07);
      }

      .hostTrustIcon {
        background:
          linear-gradient(180deg, rgba(203,242,166,.28), rgba(203,242,166,.13));
        color: #365a35;
      }

      .viewHostButton {
        border: 1px solid rgba(18,44,27,.08);
        background: #11241a;
        color: #fff !important;
        box-shadow:
          0 10px 26px rgba(17,44,27,.15),
          inset 0 1px 0 rgba(255,255,255,.06);
        transition:
          transform .18s ease,
          background .18s ease,
          box-shadow .18s ease;
      }

      .viewHostButton:hover {
        transform: translateY(-1px);
        background: #183122;
        box-shadow: 0 14px 30px rgba(17,44,27,.20);
      }

      .hostsTrustSection {
        border: 1px solid rgba(23,50,31,.075);
        border-radius: 32px;
        background:
          radial-gradient(circle at 88% 10%, rgba(195,233,157,.19), transparent 33%),
          rgba(255,255,255,.64);
        box-shadow:
          0 24px 65px rgba(25,53,34,.08),
          inset 0 1px 0 rgba(255,255,255,.76);
        backdrop-filter: blur(15px);
      }

      .trustCards article {
        border-color: rgba(26,52,34,.07);
        background: rgba(255,255,255,.70);
        box-shadow: inset 0 1px 0 rgba(255,255,255,.7);
      }

      .trustCards article > span {
        background: linear-gradient(180deg,#e5ffd0,#d1f0b6);
        box-shadow: 0 10px 22px rgba(80,126,65,.10);
      }

      .hostsCta {
        overflow: hidden;
        position: relative;
        border: 1px solid rgba(255,255,255,.06);
        border-radius: 34px;
        background:
          radial-gradient(circle at 80% 0%, rgba(201,255,170,.12), transparent 34%),
          linear-gradient(135deg,#09170f 0%,#10271a 58%,#0a1b12 100%);
        box-shadow: 0 32px 85px rgba(14,39,24,.18);
      }

      .hostsCta::after {
        content: "";
        position: absolute;
        width: 240px;
        height: 240px;
        right: -80px;
        bottom: -110px;
        border: 1px solid rgba(213,255,186,.09);
        border-radius: 50%;
        box-shadow:
          0 0 0 42px rgba(213,255,186,.025),
          0 0 0 88px rgba(213,255,186,.015);
        pointer-events: none;
      }

      .hostsCta > a {
        background: linear-gradient(180deg,#ddffc2,#bde891);
        color: #112116 !important;
        box-shadow: 0 15px 34px rgba(119,167,82,.18);
      }

      @media (max-width: 760px) {
        .hostsPage {
          padding: 78px 12px 64px;
        }

        .hostsHero {
          min-height: 560px;
          padding: 22px;
          border-radius: 26px;
        }

        .hostsHeroContent {
          padding: 86px 0 32px;
        }

        .hostsHeroContent h1 {
          font-size: clamp(46px, 15vw, 70px);
        }

        .heroStats article {
          padding-right: 12px;
        }

        .heroStats article:not(:first-child) {
          padding-left: 12px;
        }

        .hostsFilters {
          margin: -22px 8px 0;
          border-radius: 20px;
        }

        .hostsSectionHeader {
          margin-top: 54px;
        }

        .hostCard {
          border-radius: 23px;
        }

        .hostMedia {
          min-height: 230px;
        }

        .hostsTrustSection,
        .hostsCta {
          border-radius: 26px;
        }
      }



      /* =========================================================
         MOBILE COMPACT — less scroll, clearer hierarchy
         ========================================================= */
      @media (max-width: 760px) {
        .hostsPage {
          padding: 66px 10px 42px !important;
        }

        .hostsHero {
          min-height: 360px !important;
          padding: 18px !important;
          border-radius: 22px !important;
        }

        .hostsHeroContent {
          max-width: 100% !important;
          padding: 42px 0 20px !important;
        }

        .heroKicker {
          padding: 7px 10px !important;
          font-size: 8px !important;
          letter-spacing: .08em !important;
        }

        .hostsHeroContent h1 {
          margin-top: 16px !important;
          font-size: clamp(38px, 12vw, 52px) !important;
          line-height: .95 !important;
          letter-spacing: -.065em !important;
        }

        .hostsHeroContent p {
          margin-top: 14px !important;
          max-width: 95% !important;
          font-size: 12px !important;
          line-height: 1.55 !important;
        }

        .heroStats {
          grid-template-columns: repeat(2, minmax(0,1fr)) !important;
          padding-top: 14px !important;
          gap: 0 !important;
        }

        .heroStats article {
          padding: 2px 10px 0 0 !important;
        }

        .heroStats article:not(:first-child) {
          padding-left: 12px !important;
        }

        .heroStats strong {
          font-size: 22px !important;
        }

        .heroStats span {
          margin-top: 3px !important;
          font-size: 7px !important;
          letter-spacing: .05em !important;
        }

        .hostsFilters {
          grid-template-columns: 1fr 1fr !important;
          gap: 7px !important;
          margin: 10px 0 0 !important;
          padding: 8px !important;
          border-radius: 16px !important;
          box-shadow: 0 10px 28px rgba(24,51,32,.08) !important;
        }

        .searchField {
          grid-column: 1 / -1 !important;
        }

        .searchField,
        .filterField {
          min-height: 44px !important;
          padding: 0 11px !important;
          border-radius: 11px !important;
          gap: 7px !important;
        }

        .searchField input,
        .filterField select {
          min-height: 42px !important;
          font-size: 10px !important;
        }

        .clearFilters {
          grid-column: 1 / -1 !important;
          min-height: 40px !important;
          border-radius: 10px !important;
          font-size: 8px !important;
        }

        .hostsSectionHeader {
          margin: 34px 2px 14px !important;
          align-items: flex-end !important;
        }

        .sectionKicker {
          font-size: 7px !important;
        }

        .hostsSectionHeader h2 {
          margin-top: 5px !important;
          font-size: 28px !important;
        }

        .hostsSectionHeader p {
          margin-top: 7px !important;
          font-size: 9px !important;
        }

        .hostResultCount {
          min-width: 42px !important;
          height: 42px !important;
          border-radius: 13px !important;
          font-size: 10px !important;
        }

        .hostsGrid {
          grid-template-columns: 1fr !important;
          gap: 12px !important;
        }

        .hostCard {
          display: grid !important;
          grid-template-columns: 118px minmax(0,1fr) !important;
          min-height: 154px !important;
          border-radius: 18px !important;
        }

        .hostMedia {
          min-height: 154px !important;
          height: 100% !important;
          border-radius: 0 !important;
        }

        .hostMediaTop {
          inset: 9px 8px auto 8px !important;
        }

        .hostStatus {
          padding: 6px 7px !important;
          font-size: 6.5px !important;
        }

        .hostMediaArrow {
          display: none !important;
        }

        .hostCardBody {
          min-width: 0 !important;
          padding: 12px 12px 11px !important;
        }

        .hostIdentity {
          min-height: 0 !important;
          gap: 8px !important;
        }

        .hostAvatarWrap {
          width: 38px !important;
          height: 38px !important;
          min-width: 38px !important;
          margin-top: 0 !important;
          border-width: 3px !important;
        }

        .hostIdentityText h2 {
          font-size: 15px !important;
          line-height: 1.05 !important;
        }

        .hostIdentityText > span {
          margin-top: 2px !important;
          font-size: 8px !important;
        }

        .hostIdentityLocation {
          margin-top: 4px !important;
          gap: 4px !important;
          font-size: 8px !important;
        }

        .hostBio {
          display: -webkit-box !important;
          -webkit-line-clamp: 2 !important;
          -webkit-box-orient: vertical !important;
          overflow: hidden !important;
          margin: 9px 0 0 !important;
          font-size: 9px !important;
          line-height: 1.45 !important;
        }

        .hostActivities {
          margin-top: 8px !important;
          gap: 5px !important;
        }

        .hostActivities span {
          padding: 5px 7px !important;
          border-radius: 999px !important;
          font-size: 6.5px !important;
        }

        .hostActivities span:nth-child(n+3) {
          display: none !important;
        }

        .hostOfferTypes {
          margin-top: 7px !important;
          gap: 4px !important;
        }

        .hostOfferType {
          padding: 4px 6px !important;
          font-size: 6px !important;
        }

        .hostCardFooter {
          margin-top: 9px !important;
          padding-top: 8px !important;
        }

        .hostTrust {
          display: none !important;
        }

        .viewHostButton {
          margin-left: auto !important;
          min-height: 34px !important;
          padding: 0 10px !important;
          border-radius: 10px !important;
          font-size: 8px !important;
        }

        .hostsTrustSection {
          margin-top: 40px !important;
          padding: 20px 16px !important;
          border-radius: 20px !important;
        }

        .trustIntro h2 {
          font-size: 26px !important;
        }

        .trustIntro p {
          font-size: 10px !important;
          line-height: 1.55 !important;
        }

        .trustCards {
          grid-template-columns: 1fr !important;
          gap: 8px !important;
          margin-top: 16px !important;
        }

        .trustCards article {
          padding: 12px !important;
          border-radius: 14px !important;
        }

        .trustCards article > span {
          width: 36px !important;
          height: 36px !important;
          border-radius: 11px !important;
        }

        .hostsCta {
          margin-top: 38px !important;
          padding: 22px 16px !important;
          border-radius: 20px !important;
        }

        .hostsCta h2 {
          font-size: 27px !important;
        }

        .hostsCta p {
          font-size: 10px !important;
          line-height: 1.55 !important;
        }

        .hostsCta > a {
          min-height: 42px !important;
          padding: 0 13px !important;
          font-size: 8px !important;
        }
      }



      /* =========================================================
         MOBILE PAGED GRID V2
         6 cards per page on phone, 9 on larger screens.
         No horizontal swipe for filters or cards.
         ========================================================= */

      .mobileFilterToggle {
        display: none;
      }

      @media (max-width: 760px) {
        .hostsPage {
          padding: 64px 10px 38px !important;
          overflow-x: hidden !important;
        }

        .hostsHero {
          min-height: 310px !important;
          padding: 16px !important;
          border-radius: 20px !important;
        }

        .hostsHeroContent {
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          max-width: 100% !important;
          padding: 34px 0 14px !important;
          text-align: center !important;
        }

        .heroKicker {
          margin-inline: auto !important;
          padding: 6px 9px !important;
          font-size: 7.5px !important;
        }

        .hostsHeroContent h1 {
          margin: 13px auto 0 !important;
          max-width: 320px !important;
          font-size: clamp(35px, 10.8vw, 46px) !important;
          line-height: .95 !important;
          text-align: center !important;
        }

        .hostsHeroContent p {
          margin: 11px auto 0 !important;
          max-width: 310px !important;
          font-size: 10.5px !important;
          line-height: 1.45 !important;
          text-align: center !important;
        }

        .heroStats {
          width: 100% !important;
          max-width: 320px !important;
          margin: 0 auto !important;
          grid-template-columns: repeat(2,1fr) !important;
          padding-top: 12px !important;
          text-align: center !important;
        }

        .heroStats article,
        .heroStats article:not(:first-child) {
          padding: 1px 8px !important;
        }

        .heroStats strong {
          font-size: 19px !important;
        }

        .heroStats span {
          font-size: 6.2px !important;
        }

        .hostsFilters {
          display: grid !important;
          grid-template-columns: 1fr auto !important;
          gap: 7px !important;
          margin: 10px 0 0 !important;
          padding: 7px !important;
          border-radius: 15px !important;
          overflow: visible !important;
          overflow-x: visible !important;
          white-space: normal !important;
        }

        .hostsFilters .searchField {
          grid-column: 1 !important;
          min-width: 0 !important;
        }

        .mobileFilterToggle {
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 6px !important;
          min-width: 82px !important;
          min-height: 42px !important;
          padding: 0 10px !important;
          border: 1px solid rgba(32,58,39,.09) !important;
          border-radius: 11px !important;
          background: #10241a !important;
          color: white !important;
          font-size: 8px !important;
          font-weight: 850 !important;
          cursor: pointer !important;
        }

        .mobileFilterToggle strong {
          color: #caff9f !important;
          font-size: 13px !important;
          line-height: 1 !important;
        }

        .hostsFilters > .filterField,
        .hostsFilters > .clearFilters {
          display: none !important;
        }

        .hostsFilters.mobileOpen {
          grid-template-columns: 1fr 1fr !important;
        }

        .hostsFilters.mobileOpen .searchField {
          grid-column: 1 / -1 !important;
        }

        .hostsFilters.mobileOpen .mobileFilterToggle {
          grid-column: 1 / -1 !important;
          min-height: 38px !important;
          background: #eef3eb !important;
          color: #24402d !important;
        }

        .hostsFilters.mobileOpen > .filterField {
          display: flex !important;
          min-width: 0 !important;
          width: 100% !important;
          min-height: 42px !important;
          padding: 0 9px !important;
          border-radius: 10px !important;
        }

        .hostsFilters.mobileOpen > .clearFilters {
          display: inline-flex !important;
          grid-column: 1 / -1 !important;
          min-height: 37px !important;
        }

        .searchField {
          min-height: 42px !important;
          border-radius: 11px !important;
        }

        .searchField input,
        .filterField select {
          min-height: 40px !important;
          font-size: 9px !important;
        }

        .hostsSectionHeader {
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          gap: 9px !important;
          margin: 30px 0 13px !important;
          text-align: center !important;
        }

        .hostsSectionHeader > div {
          width: 100% !important;
          text-align: center !important;
        }

        .hostsSectionHeader h2 {
          margin: 4px auto 0 !important;
          font-size: 26px !important;
          line-height: 1 !important;
          text-align: center !important;
        }

        .hostsSectionHeader p {
          margin: 6px auto 0 !important;
          font-size: 8.5px !important;
          text-align: center !important;
        }

        .hostResultCount {
          min-width: 40px !important;
          height: 34px !important;
          padding: 0 10px !important;
          border-radius: 11px !important;
        }

        .hostsGrid {
          display: grid !important;
          grid-template-columns: repeat(2, minmax(0,1fr)) !important;
          gap: 9px !important;
          width: 100% !important;
          overflow: visible !important;
          overflow-x: visible !important;
          scroll-snap-type: none !important;
        }

        .hostsGrid > * {
          min-width: 0 !important;
          width: auto !important;
          scroll-snap-align: none !important;
        }

        .hostCard {
          display: block !important;
          min-height: 0 !important;
          border-radius: 15px !important;
          overflow: hidden !important;
        }

        .hostMedia {
          display: block !important;
          height: 104px !important;
          min-height: 104px !important;
        }

        .hostMediaTop {
          inset: 7px 7px auto 7px !important;
        }

        .hostStatus {
          padding: 4px 6px !important;
          font-size: 5.5px !important;
          gap: 3px !important;
        }

        .hostStatus svg {
          width: 10px !important;
          height: 10px !important;
        }

        .hostCardBody {
          padding: 9px !important;
          text-align: center !important;
        }

        .hostIdentity {
          display: block !important;
          text-align: center !important;
        }

        .hostAvatarWrap {
          width: 38px !important;
          height: 38px !important;
          min-width: 38px !important;
          margin: -26px auto 5px !important;
          border-width: 3px !important;
        }

        .hostIdentityText {
          min-width: 0 !important;
          text-align: center !important;
        }

        .hostIdentityText h2 {
          margin: 0 auto !important;
          font-size: 13px !important;
          line-height: 1.05 !important;
          text-align: center !important;
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
        }

        .hostIdentityText > span {
          display: block !important;
          font-size: 6.8px !important;
          text-align: center !important;
        }

        .hostIdentityLocation {
          justify-content: center !important;
          margin-top: 4px !important;
          font-size: 7px !important;
          white-space: nowrap !important;
          overflow: hidden !important;
        }

        .hostBio {
          display: none !important;
        }

        .hostActivities {
          justify-content: center !important;
          margin-top: 7px !important;
          gap: 4px !important;
        }

        .hostActivities span {
          max-width: 100% !important;
          padding: 4px 6px !important;
          font-size: 5.8px !important;
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
        }

        .hostActivities span:nth-child(n+2) {
          display: none !important;
        }

        .hostOfferTypes {
          justify-content: center !important;
          margin-top: 5px !important;
          gap: 3px !important;
        }

        .hostOfferType {
          padding: 3px 5px !important;
          font-size: 5.3px !important;
        }

        .hostOfferType:nth-child(n+3) {
          display: none !important;
        }

        .hostCardFooter {
          justify-content: center !important;
          margin-top: 7px !important;
          padding-top: 7px !important;
        }

        .hostTrust {
          display: none !important;
        }

        .viewHostButton {
          width: 100% !important;
          min-height: 30px !important;
          justify-content: center !important;
          margin: 0 !important;
          padding: 0 8px !important;
          border-radius: 8px !important;
          font-size: 7px !important;
        }

        .hostsPagination {
          margin-top: 18px !important;
          gap: 8px !important;
          justify-content: center !important;
        }

        .hostsPagination button {
          min-height: 36px !important;
          padding: 0 11px !important;
          border-radius: 10px !important;
          font-size: 7px !important;
        }

        .hostsPagination span {
          font-size: 8px !important;
        }

        .hostsTrustSection,
        .hostsCta {
          text-align: center !important;
        }

        .trustIntro,
        .trustIntro h2,
        .trustIntro p,
        .hostsCta > div,
        .hostsCta h2,
        .hostsCta p {
          text-align: center !important;
        }

        .hostsCta > a {
          margin-inline: auto !important;
        }
      }

      @media (max-width: 360px) {
        .hostsGrid {
          gap: 7px !important;
        }

        .hostMedia {
          height: 96px !important;
          min-height: 96px !important;
        }

        .hostCardBody {
          padding: 8px !important;
        }

        .hostIdentityText h2 {
          font-size: 12px !important;
        }
      }

    `}</style>
  );
}