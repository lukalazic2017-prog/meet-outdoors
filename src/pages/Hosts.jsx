import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";

const FALLBACK_AVATAR =
  "https://api.dicebear.com/8.x/initials/svg?seed=Host";

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1400&q=85";

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

          <p>Pronalazimo organizatore outdoor avantura.</p>
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
    : "Ovaj domaćin još nije dodao opis svog iskustva i avantura.";

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
          <span className={host.is_verified ? "hostStatus verified" : "hostStatus"}>
            <Icon
              name={host.is_verified ? "verified" : "shield"}
              size={14}
            />
            {host.is_verified ? "Verifikovan host" : "MeetOutdoors host"}
          </span>

          <span className="hostMediaArrow">
            <Icon name="arrowRight" size={17} />
          </span>
        </div>

        <div className="hostMediaBottom">
          <span>
            <Icon name="mapPin" size={14} />
            {location}
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
            {host.is_verified && (
              <span className="avatarVerified">
                <Icon name="check" size={12} strokeWidth={3} />
              </span>
            )}
          </Link>

          <div className="hostIdentityText">
            <div className="hostNameRow">
              <h2>{displayName}</h2>
            </div>
            <span>@{host.username || "host"}</span>
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

        <div className="hostCardFooter">
          <div className="hostTrust">
            <span className="hostTrustIcon">
              <Icon name="compass" size={17} />
            </span>

            <div>
              <strong>Outdoor organizator</strong>
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
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  useEffect(() => {
    loadHosts();
  }, []);

  async function loadHosts() {
    setLoading(true);
    setError("");

    try {
      const { data, error: hostsError } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "host")
        .order("created_at", { ascending: false });

      if (hostsError) {
        throw hostsError;
      }

      setHosts(data || []);
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

      const matchesVerified =
        !verifiedOnly || Boolean(host.is_verified);

      return (
        matchesSearch &&
        matchesLocation &&
        matchesActivity &&
        matchesVerified
      );
    });
  }, [
    hosts,
    search,
    locationFilter,
    activityFilter,
    verifiedOnly,
  ]);

  const verifiedCount = useMemo(
    () => hosts.filter((host) => host.is_verified).length,
    [hosts]
  );

  const hasFilters =
    search.trim() ||
    locationFilter ||
    activityFilter ||
    verifiedOnly;

  function clearFilters() {
    setSearch("");
    setLocationFilter("");
    setActivityFilter("");
    setVerifiedOnly(false);
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
              Pronađi organizatore koji kreiraju događaje, ture i
              outdoor iskustva na lokacijama koje želiš da istražiš.
            </p>
          </div>

          <div className="heroStats">
            <article>
              <strong>{hosts.length}</strong>
              <span>aktivnih domaćina</span>
            </article>

            <article>
              <strong>{verifiedCount}</strong>
              <span>verifikovanih profila</span>
            </article>

            <article>
              <strong>{activities.length}</strong>
              <span>outdoor aktivnosti</span>
            </article>
          </div>
        </section>

        <section className="hostsContent">
          <div className="hostsFilters">
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

            <label className="verifiedFilter">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(event) =>
                  setVerifiedOnly(event.target.checked)
                }
              />

              <span className="verifiedCheckbox">
                {verifiedOnly && (
                  <Icon name="verified" size={15} />
                )}
              </span>

              Samo verifikovani
            </label>

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
                Outdoor organizatori
              </span>

              <h2>
                {hasFilters
                  ? "Rezultati pretrage"
                  : "Pronađi svog domaćina"}
              </h2>

              <p>
                Prikazano {filteredHosts.length} od {hosts.length}{" "}
                domaćina.
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
            <section className="hostsGrid">
              {filteredHosts.map((host) => (
                <HostCard key={host.id} host={host} />
              ))}
            </section>
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
                Pregledaj profil, opis, aktivnosti i ponude domaćina
                pre nego što se prijaviš za događaj ili rezervišeš
                paket.
              </p>
            </div>

            <div className="trustCards">
              <article>
                <span>
                  <Icon name="verified" size={21} />
                </span>

                <div>
                  <strong>Verifikovani profili</strong>

                  <small>
                    Jasno označeni domaćini koji su prošli proveru
                    platforme.
                  </small>
                </div>
              </article>

              <article>
                <span>
                  <Icon name="activity" size={21} />
                </span>

                <div>
                  <strong>Relevantno iskustvo</strong>

                  <small>
                    Pregledaj aktivnosti i avanture koje domaćin
                    organizuje.
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
                Predstavi svoje avanture novoj zajednici.
              </h2>

              <p>
                Kreiraj host profil, objavi događaje i pakete i poveži
                se sa ljudima koji žele više vremena u prirodi.
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
        padding: 14px 0 3px;
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

      .hostIdentityText span {
        display: block;
        overflow: hidden;
        margin-top: 5px;
        color: #879188;
        font-size: 9px;
        font-weight: 750;
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
          width: 80px;
          height: 80px;
          margin-top: -40px;
          border-radius: 23px;
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
        height: 250px;
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
        position: absolute;
        right: 16px;
        bottom: 17px;
        left: 16px;
      }

      .hostMediaBottom > span {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        max-width: 100%;
        min-height: 31px;
        padding: 0 10px;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 999px;
        background: rgba(5, 18, 10, 0.42);
        color: rgba(255, 255, 255, 0.88);
        font-size: 8px;
        font-weight: 800;
        text-overflow: ellipsis;
        white-space: nowrap;
        backdrop-filter: blur(12px);
      }

      .hostMediaBottom svg {
        flex: 0 0 auto;
        color: #d5f4a6;
      }

      .hostCardBody {
        position: relative;
        z-index: 1;
        padding: 0 21px 21px;
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
        width: 88px;
        height: 88px;
        margin-top: -43px;
        border: 5px solid #ffffff;
        border-radius: 27px;
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
    `}</style>
  );
}