import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";

const FALLBACK_IMAGE =
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

    package: (
      <>
        <path d="m12 3 8 4-8 4-8-4 8-4Z" />
        <path d="m4 7 8 4 8-4" />
        <path d="M4 7v10l8 4 8-4V7" />
        <path d="M12 11v10" />
      </>
    ),

    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </>
    ),

    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
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

    shield: (
      <>
        <path d="M12 3 5 6v5c0 4.6 2.9 8.4 7 10 4.1-1.6 7-5.4 7-10V6l-7-3Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),

    mountain: (
      <>
        <path d="m3 20 7-12 4 7 2-3 5 8" />
        <path d="m8.8 10 2.2 2 1.4-1.4" />
      </>
    ),

    image: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="m21 15-5-5L5 21" />
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

function formatPrice(value, currency = "EUR") {
  const number = Number(value);

  if (!Number.isFinite(number) || number <= 0) {
    return "Cena na upit";
  }

  const normalizedCurrency =
    typeof currency === "string" && currency.trim()
      ? currency.trim().toUpperCase()
      : "EUR";

  try {
    return new Intl.NumberFormat("sr-Latn-RS", {
      style: "currency",
      currency: normalizedCurrency,
      maximumFractionDigits: 0,
    }).format(number);
  } catch {
    return `${number.toLocaleString("sr-Latn-RS")} ${normalizedCurrency}`;
  }
}

function getPackageDuration(item) {
  if (item.duration) {
    return item.duration;
  }

  if (item.duration_days) {
    const days = Number(item.duration_days);

    if (days === 1) {
      return "1 dan";
    }

    return `${days} dana`;
  }

  if (item.days) {
    const days = Number(item.days);

    if (days === 1) {
      return "1 dan";
    }

    return `${days} dana`;
  }

  return "Trajanje nije navedeno";
}

function getPackageCapacity(item) {
  return (
    item.capacity ||
    item.max_people ||
    item.max_participants ||
    null
  );
}

function LoadingState() {
  return (
    <>
      <PackagesStyles />

      <main className="packagesStatePage">
        <div className="packagesStateCard">
          <span className="packagesLoader" />

          <h1>Učitavanje paketa</h1>

          <p>Pronalazimo ture i outdoor iskustva za tebe.</p>
        </div>
      </main>
    </>
  );
}

function PackageCard({ item }) {
  const location =
    [item.location, item.country].filter(Boolean).join(", ") ||
    "Lokacija nije navedena";

  const capacity = getPackageCapacity(item);
  const duration = getPackageDuration(item);

  const description = item.description
    ? item.description
    : "Otkrij kompletno outdoor iskustvo koje organizuje MeetOutdoors domaćin.";

  return (
    <Link
      to={`/package/${item.id}`}
      className="packageCard"
    >
      <div className="packageImageWrapper">
        <img
          src={item.cover_url || FALLBACK_IMAGE}
          alt={item.title || "Outdoor paket"}
          className="packageImage"
        />

        <div className="packageImageOverlay" />

        <span className="packageTypeBadge">
          <Icon name="package" size={14} />
          Outdoor paket
        </span>

        <span className="packagePriceBadge">
          {formatPrice(item.price, item.currency)}
        </span>

        <div className="packageImageBottom">
          <span>
            <Icon name="clock" size={14} />
            {duration}
          </span>

          {capacity && (
            <span>
              <Icon name="users" size={14} />
              Do {capacity} osoba
            </span>
          )}
        </div>
      </div>

      <div className="packageCardBody">
        <span className="packageKicker">
          MeetOutdoors iskustvo
        </span>

        <h2>{item.title || "Paket bez naziva"}</h2>

        <div className="packageLocation">
          <Icon name="mapPin" size={15} />
          {location}
        </div>

        <p className="packageDescription">
          {description}
        </p>

        <div className="packageFeatureGrid">
          <div>
            <span>
              <Icon name="calendar" size={16} />
            </span>

            <div>
              <small>Trajanje</small>
              <strong>{duration}</strong>
            </div>
          </div>

          <div>
            <span>
              <Icon name="mountain" size={16} />
            </span>

            <div>
              <small>Tip iskustva</small>
              <strong>
                {item.category ||
                  item.activity_type ||
                  "Outdoor avantura"}
              </strong>
            </div>
          </div>
        </div>

        <div className="packageCardFooter">
          <div>
            <small>Cena paketa</small>

            <strong>
              {formatPrice(item.price, item.currency)}
            </strong>
          </div>

          <span className="packageArrow">
            Pogledaj paket
            <Icon name="arrowRight" size={17} />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function Packages() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [durationFilter, setDurationFilter] = useState("all");

  useEffect(() => {
    loadPackages();
  }, []);

  async function loadPackages() {
    setLoading(true);
    setError("");

    try {
      const { data, error: packagesError } = await supabase
        .from("packages")
        .select("*")
        .order("created_at", { ascending: false });

      if (packagesError) {
        throw packagesError;
      }

      setPackages(data || []);
    } catch (err) {
      console.error("Greška pri učitavanju paketa:", err);

      setPackages([]);
      setError(
        err.message ||
          "Pakete trenutno nije moguće učitati."
      );
    } finally {
      setLoading(false);
    }
  }

  const countries = useMemo(() => {
    return [
      ...new Set(
        packages
          .map((item) => item.country)
          .filter(Boolean)
      ),
    ].sort((a, b) => a.localeCompare(b));
  }, [packages]);

  const filteredPackages = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return packages.filter((item) => {
      const searchableText = [
        item.title,
        item.description,
        item.location,
        item.country,
        item.category,
        item.activity_type,
        item.duration,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const packagePrice = Number(item.price || 0);

      const durationDays = Number(
        item.duration_days || item.days || 0
      );

      const matchesSearch =
        !normalizedSearch ||
        searchableText.includes(normalizedSearch);

      const matchesCountry =
        !country || item.country === country;

      const matchesPrice =
        !maxPrice ||
        packagePrice <= Number(maxPrice);

      const matchesDuration =
        durationFilter === "all" ||
        (durationFilter === "short" &&
          durationDays > 0 &&
          durationDays <= 2) ||
        (durationFilter === "medium" &&
          durationDays >= 3 &&
          durationDays <= 5) ||
        (durationFilter === "long" &&
          durationDays >= 6);

      return (
        matchesSearch &&
        matchesCountry &&
        matchesPrice &&
        matchesDuration
      );
    });
  }, [
    packages,
    search,
    country,
    maxPrice,
    durationFilter,
  ]);

  const totalCountries = countries.length;

  const averagePrice = useMemo(() => {
    const prices = packages
      .map((item) => Number(item.price))
      .filter(
        (price) =>
          Number.isFinite(price) && price > 0
      );

    if (prices.length === 0) {
      return 0;
    }

    return Math.round(
      prices.reduce((sum, price) => sum + price, 0) /
        prices.length
    );
  }, [packages]);

  const hasFilters =
    search.trim() ||
    country ||
    maxPrice ||
    durationFilter !== "all";

  function clearFilters() {
    setSearch("");
    setCountry("");
    setMaxPrice("");
    setDurationFilter("all");
  }

  if (loading) {
    return <LoadingState />;
  }

  return (
    <>
      <PackagesStyles />

      <main className="packagesPage">
        <section className="packagesHero">
          <div className="packagesHeroOverlay" />

          

          <div className="packagesHeroContent">
            <span className="heroKicker">
              <span />
              Ture i outdoor paketi
            </span>

            <h1>
              Više od jednog
              <br />
              dana u prirodi.
            </h1>

            <p>
              Otkrij rafting vikende, planinarske ture,
              kampovanja i kompletna outdoor iskustva koja
              organizuju lokalni domaćini.
            </p>
          </div>

          <div className="heroStats">
            <article>
              <strong>{packages.length}</strong>
              <span>objavljenih paketa</span>
            </article>

            <article>
              <strong>{totalCountries}</strong>
              <span>zemalja i destinacija</span>
            </article>

            <article>
              <strong>
                {averagePrice > 0
                  ? formatPrice(averagePrice, "EUR")
                  : "—"}
              </strong>
              <span>prosečna početna cena</span>
            </article>
          </div>
        </section>

        <section className="packagesContent">
          <div className="packagesFilters">
            <div className="searchField">
              <Icon name="search" size={19} />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Pretraži ture, aktivnosti ili lokacije"
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
                value={country}
                onChange={(event) =>
                  setCountry(event.target.value)
                }
              >
                <option value="">Sve zemlje</option>

                {countries.map((itemCountry) => (
                  <option
                    key={itemCountry}
                    value={itemCountry}
                  >
                    {itemCountry}
                  </option>
                ))}
              </select>
            </div>

            <div className="filterField">
              <Icon name="clock" size={17} />

              <select
                value={durationFilter}
                onChange={(event) =>
                  setDurationFilter(event.target.value)
                }
              >
                <option value="all">Sva trajanja</option>
                <option value="short">Do 2 dana</option>
                <option value="medium">3 do 5 dana</option>
                <option value="long">6 ili više dana</option>
              </select>
            </div>

            <div className="filterField priceFilterField">
              <span className="currencySymbol">€</span>

              <input
                type="number"
                min="0"
                value={maxPrice}
                onChange={(event) =>
                  setMaxPrice(event.target.value)
                }
                placeholder="Maksimalna cena"
              />
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
            <div className="packagesError" role="alert">
              <span>
                <Icon name="alert" size={18} />
              </span>

              <p>{error}</p>

              <button
                type="button"
                onClick={loadPackages}
              >
                Pokušaj ponovo
              </button>
            </div>
          )}

          <div className="packagesSectionHeader">
            <div>
              <span className="sectionKicker">
                Istraži iskustva
              </span>

              <h2>
                {hasFilters
                  ? "Rezultati pretrage"
                  : "Najnoviji outdoor paketi"}
              </h2>

              <p>
                Prikazano {filteredPackages.length} od{" "}
                {packages.length} paketa.
              </p>
            </div>

            <span className="packageResultCount">
              <Icon name="package" size={17} />
              {filteredPackages.length}
            </span>
          </div>

          {filteredPackages.length === 0 ? (
            <div className="emptyPackages">
              <span>
                <Icon
                  name={
                    packages.length === 0
                      ? "package"
                      : "search"
                  }
                  size={29}
                />
              </span>

              <h3>
                {packages.length === 0
                  ? "Još nema objavljenih paketa."
                  : "Nema paketa za izabrane filtere."}
              </h3>

              <p>
                {packages.length === 0
                  ? "Čim domaćini objave nove ture i iskustva, pojaviće se ovde."
                  : "Promeni pretragu, zemlju, trajanje ili maksimalnu cenu."}
              </p>

              {hasFilters ? (
                <button
                  type="button"
                  onClick={clearFilters}
                >
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
            <section className="packagesGrid">
              {filteredPackages.map((item) => (
                <PackageCard
                  key={item.id}
                  item={item}
                />
              ))}
            </section>
          )}

          <section className="packageBenefits">
            <div className="benefitsIntro">
              <span className="sectionKicker">
                Zašto outdoor paket?
              </span>

              <h2>
                Cela avantura organizovana na jednom mestu.
              </h2>

              <p>
                Paketi mogu da obuhvate više aktivnosti,
                smeštaj, prevoz, obroke i kompletan plan
                putovanja.
              </p>
            </div>

            <div className="benefitsGrid">
              <article>
                <span>
                  <Icon name="calendar" size={21} />
                </span>

                <div>
                  <strong>Jasan raspored</strong>

                  <small>
                    Pregled trajanja i organizacije iskustva
                    pre rezervacije.
                  </small>
                </div>
              </article>

              <article>
                <span>
                  <Icon name="mountain" size={21} />
                </span>

                <div>
                  <strong>Više aktivnosti</strong>

                  <small>
                    Kombinuj planinarenje, rafting, kampovanje
                    i druge avanture.
                  </small>
                </div>
              </article>

              <article>
                <span>
                  <Icon name="shield" size={21} />
                </span>

                <div>
                  <strong>Pouzdani domaćini</strong>

                  <small>
                    Pregledaj javni profil organizatora pre
                    nego što rezervišeš.
                  </small>
                </div>
              </article>
            </div>
          </section>

          <section className="packagesCta">
            <div>
              <span className="sectionKicker">
                Organizuješ ture?
              </span>

              <h2>
                Pretvori svoju ideju u kompletno iskustvo.
              </h2>

              <p>
                Dodaj program, galeriju, cenu i sve informacije
                koje su učesnicima potrebne za rezervaciju.
              </p>
            </div>

            <Link to="/create-package">
              <Icon name="plus" size={17} />
              Kreiraj paket
            </Link>
          </section>
        </section>
      </main>
    </>
  );
}

function PackagesStyles() {
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

      .packagesPage,
      .packagesStatePage {
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

      .packagesPage {
        padding: 28px;
        background:
          radial-gradient(
            circle at 8% 1%,
            rgba(169, 203, 131, 0.17),
            transparent 25%
          ),
          radial-gradient(
            circle at 95% 31%,
            rgba(85, 129, 91, 0.1),
            transparent 25%
          ),
          #f1f3ec;
      }

      .packagesPage a,
      .packagesStatePage a {
        color: inherit;
        text-decoration: none;
      }

      .packagesHero {
        position: relative;
        isolation: isolate;
        width: min(1240px, 100%);
        min-height: 630px;
        display: flex;
        flex-direction: column;
        margin: 0 auto;
        padding: 34px;
        overflow: hidden;
        border-radius: 34px;
        color: white;
        box-shadow: 0 30px 80px rgba(25, 53, 36, 0.17);
      }

      .packagesHero::before {
        position: absolute;
        inset: 0;
        z-index: -3;
        content: "";
        background:
          url("https://images.unsplash.com/photo-1517825738774-7de9363ef735?auto=format&fit=crop&w=1900&q=90")
          center / cover;
        transition: transform 0.8s ease;
      }

      .packagesHero:hover::before {
        transform: scale(1.018);
      }

      .packagesHeroOverlay {
        position: absolute;
        inset: 0;
        z-index: -2;
        background:
          linear-gradient(
            180deg,
            rgba(4, 15, 8, 0.28),
            rgba(4, 15, 8, 0.21) 28%,
            rgba(4, 15, 8, 0.78) 76%,
            rgba(4, 14, 8, 0.97)
          ),
          linear-gradient(
            90deg,
            rgba(4, 15, 8, 0.58),
            transparent 70%
          );
      }

      .packagesHeroTop {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
      }

      .packagesBrand {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        font-size: 16px;
        font-weight: 900;
        letter-spacing: -0.03em;
      }

      .packagesBrand > span {
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

      .eventsLink {
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

      .eventsLink:hover {
        gap: 12px;
        background: rgba(255, 255, 255, 0.17);
      }

      .packagesHeroContent {
        max-width: 930px;
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

      .packagesHeroContent h1 {
        margin: 24px 0 0;
        font-size: clamp(58px, 8vw, 104px);
        line-height: 0.9;
        letter-spacing: -0.08em;
      }

      .packagesHeroContent p {
        max-width: 650px;
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

      .packagesContent {
        width: min(1240px, 100%);
        margin: 0 auto;
      }

      .packagesFilters {
        position: relative;
        z-index: 5;
        display: grid;
        grid-template-columns:
          minmax(280px, 1.45fr)
          minmax(160px, 0.6fr)
          minmax(160px, 0.6fr)
          minmax(160px, 0.55fr)
          auto;
        gap: 10px;
        margin: -33px 28px 0;
        padding: 13px;
        border: 1px solid rgba(33, 53, 40, 0.1);
        border-radius: 22px;
        background: rgba(255, 255, 255, 0.91);
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
      .filterField input,
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

      .searchField input::placeholder,
      .filterField input::placeholder {
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

      .currencySymbol {
        color: #668249;
        font-size: 14px;
        font-weight: 900;
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

      .packagesError {
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

      .packagesError > span {
        display: grid;
        place-items: center;
        width: 32px;
        height: 32px;
        border-radius: 10px;
        background: #f7d7d3;
      }

      .packagesError p {
        margin: 0;
        font-size: 11px;
      }

      .packagesError button {
        border: 0;
        background: transparent;
        color: inherit;
        cursor: pointer;
        font-size: 10px;
        font-weight: 850;
      }

      .packagesSectionHeader {
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

      .packagesSectionHeader h2,
      .packageBenefits h2,
      .packagesCta h2 {
        margin: 8px 0 0;
        color: #20342a;
        font-size: clamp(34px, 5vw, 51px);
        line-height: 0.98;
        letter-spacing: -0.06em;
      }

      .packagesSectionHeader p {
        margin: 10px 0 0;
        color: #818c84;
        font-size: 10px;
      }

      .packageResultCount {
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

      .packagesGrid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 18px;
      }

      .packageCard {
        min-width: 0;
        overflow: hidden;
        border: 1px solid #dae2d7;
        border-radius: 24px;
        background: rgba(255, 255, 255, 0.8);
        box-shadow: 0 12px 35px rgba(31, 51, 38, 0.045);
        transition: 0.22s ease;
      }

      .packageCard:hover {
        transform: translateY(-5px);
        box-shadow: 0 22px 48px rgba(31, 51, 38, 0.11);
      }

      .packageImageWrapper {
        position: relative;
        height: 250px;
        overflow: hidden;
      }

      .packageImage {
        width: 100%;
        height: 100%;
        display: block;
        object-fit: cover;
        transition: transform 0.55s ease;
      }

      .packageCard:hover .packageImage {
        transform: scale(1.045);
      }

      .packageImageOverlay {
        position: absolute;
        inset: 0;
        background:
          linear-gradient(
            180deg,
            rgba(4, 14, 8, 0.05),
            rgba(4, 14, 8, 0.68)
          );
      }

      .packageTypeBadge,
      .packagePriceBadge {
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

      .packageTypeBadge {
        left: 14px;
      }

      .packagePriceBadge {
        right: 14px;
        color: #daf8ad;
      }

      .packageImageBottom {
        position: absolute;
        right: 14px;
        bottom: 14px;
        left: 14px;
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;
      }

      .packageImageBottom > span {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-height: 29px;
        padding: 0 9px;
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 999px;
        background: rgba(5, 20, 11, 0.48);
        color: rgba(255, 255, 255, 0.86);
        font-size: 8px;
        font-weight: 800;
        backdrop-filter: blur(11px);
      }

      .packageCardBody {
        padding: 20px;
      }

      .packageKicker {
        color: #799958;
        font-size: 8px;
        font-weight: 900;
        letter-spacing: 0.11em;
        text-transform: uppercase;
      }

      .packageCardBody h2 {
        margin: 8px 0 0;
        color: #24372c;
        font-size: 24px;
        line-height: 1.1;
        letter-spacing: -0.04em;
      }

      .packageLocation {
        display: flex;
        align-items: center;
        gap: 7px;
        margin-top: 13px;
        color: #748078;
        font-size: 9px;
        font-weight: 750;
      }

      .packageLocation svg {
        flex: 0 0 auto;
        color: #789657;
      }

      .packageDescription {
        display: -webkit-box;
        min-height: 49px;
        overflow: hidden;
        margin: 14px 0 0;
        color: #77837b;
        font-size: 10px;
        line-height: 1.65;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 3;
      }

      .packageFeatureGrid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 9px;
        margin-top: 16px;
      }

      .packageFeatureGrid > div {
        display: flex;
        align-items: center;
        gap: 9px;
        min-width: 0;
        padding: 11px;
        border: 1px solid #e0e6dd;
        border-radius: 14px;
        background: #f7f9f5;
      }

      .packageFeatureGrid > div > span {
        display: grid;
        place-items: center;
        flex: 0 0 auto;
        width: 33px;
        height: 33px;
        border-radius: 10px;
        background: #e7f0dc;
        color: #5d7b43;
      }

      .packageFeatureGrid small,
      .packageFeatureGrid strong {
        display: block;
      }

      .packageFeatureGrid small {
        color: #969f98;
        font-size: 7px;
      }

      .packageFeatureGrid strong {
        overflow: hidden;
        margin-top: 3px;
        color: #45584c;
        font-size: 8px;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .packageCardFooter {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 15px;
        margin-top: 18px;
        padding-top: 16px;
        border-top: 1px solid #e2e7df;
      }

      .packageCardFooter small,
      .packageCardFooter strong {
        display: block;
      }

      .packageCardFooter small {
        color: #949d96;
        font-size: 8px;
      }

      .packageCardFooter strong {
        margin-top: 4px;
        color: #284334;
        font-size: 15px;
      }

      .packageArrow {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        color: #385541;
        font-size: 9px;
        font-weight: 850;
        transition: 0.18s ease;
      }

      .packageCard:hover .packageArrow {
        gap: 11px;
      }

      .emptyPackages {
        display: grid;
        place-items: center;
        padding: 70px 25px;
        border: 1px dashed #ccd7c9;
        border-radius: 24px;
        background: rgba(255, 255, 255, 0.58);
        text-align: center;
      }

      .emptyPackages > span {
        display: grid;
        place-items: center;
        width: 64px;
        height: 64px;
        border-radius: 20px;
        background: #e7f0dc;
        color: #608047;
      }

      .emptyPackages h3 {
        margin: 18px 0 0;
        color: #34483b;
        font-size: 20px;
        letter-spacing: -0.03em;
      }

      .emptyPackages p {
        max-width: 520px;
        margin: 10px auto 0;
        color: #869188;
        font-size: 11px;
        line-height: 1.65;
      }

      .emptyPackages button,
      .emptyPackages a {
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

      .packageBenefits {
        display: grid;
        grid-template-columns:
          minmax(0, 0.8fr)
          minmax(520px, 1.2fr);
        gap: 35px;
        margin-top: 45px;
        padding: 34px;
        border: 1px solid #dbe3d8;
        border-radius: 28px;
        background: rgba(255, 255, 255, 0.68);
        box-shadow: 0 16px 42px rgba(31, 51, 38, 0.05);
      }

      .benefitsIntro p {
        max-width: 520px;
        margin: 15px 0 0;
        color: #7d8981;
        font-size: 11px;
        line-height: 1.7;
      }

      .benefitsGrid {
        display: grid;
        gap: 11px;
      }

      .benefitsGrid article {
        display: flex;
        align-items: flex-start;
        gap: 13px;
        padding: 15px;
        border: 1px solid #dde4da;
        border-radius: 17px;
        background: #f8faf6;
      }

      .benefitsGrid article > span {
        display: grid;
        place-items: center;
        flex: 0 0 auto;
        width: 42px;
        height: 42px;
        border-radius: 13px;
        background: #e7f0dc;
        color: #5e7b43;
      }

      .benefitsGrid strong,
      .benefitsGrid small {
        display: block;
      }

      .benefitsGrid strong {
        color: #3c5143;
        font-size: 11px;
      }

      .benefitsGrid small {
        margin-top: 5px;
        color: #89938c;
        font-size: 9px;
        line-height: 1.55;
      }

      .packagesCta {
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

      .packagesCta::after {
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

      .packagesCta .sectionKicker {
        color: #c9f28c;
      }

      .packagesCta h2 {
        max-width: 760px;
        color: white;
      }

      .packagesCta p {
        max-width: 620px;
        margin: 14px 0 0;
        color: rgba(255, 255, 255, 0.57);
        font-size: 11px;
        line-height: 1.65;
      }

      .packagesCta > a {
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

      .packagesCta > a:hover {
        gap: 12px;
        transform: translateY(-2px);
      }

      .packagesStatePage {
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

      .packagesStateCard {
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

      .packagesLoader {
        width: 37px;
        height: 37px;
        border: 3px solid #dce5d7;
        border-top-color: #52783c;
        border-radius: 50%;
        animation: packagesSpin 0.8s linear infinite;
      }

      @keyframes packagesSpin {
        to {
          transform: rotate(360deg);
        }
      }

      .packagesStateCard h1 {
        margin: 18px 0 0;
        color: #24372c;
        font-size: 28px;
        letter-spacing: -0.04em;
      }

      .packagesStateCard p {
        margin: 9px 0 0;
        color: #7e8981;
        font-size: 11px;
      }

      @media (max-width: 1090px) {
        .packagesFilters {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .searchField {
          grid-column: 1 / -1;
        }

        .packagesGrid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .packageBenefits {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 760px) {
        .packagesPage {
          padding: 0 0 70px;
        }

        .packagesHero {
          min-height: 610px;
          padding: 24px;
          border-radius: 0 0 31px 31px;
        }

        .packagesHeroContent h1 {
          font-size: clamp(54px, 12vw, 78px);
        }

        .packagesFilters {
          margin-right: 18px;
          margin-left: 18px;
        }

        .packagesSectionHeader,
        .packagesGrid,
        .emptyPackages,
        .packageBenefits,
        .packagesCta,
        .packagesError {
          margin-right: 18px;
          margin-left: 18px;
        }

        .packagesCta {
          align-items: flex-start;
          flex-direction: column;
        }
      }

      @media (max-width: 580px) {
        .packagesHero {
          min-height: 580px;
          padding: 20px;
        }

        .packagesBrand {
          font-size: 14px;
        }

        .eventsLink {
          width: 42px;
          padding: 0;
          justify-content: center;
          font-size: 0;
        }

        .packagesHeroContent h1 {
          font-size: 47px;
        }

        .heroStats,
        .packagesFilters,
        .packagesGrid {
          grid-template-columns: 1fr;
        }

        .searchField {
          grid-column: auto;
        }

        .packagesSectionHeader {
          align-items: flex-start;
          flex-direction: column;
        }

        .packageBenefits {
          padding: 25px;
        }

        .packagesCta {
          padding: 27px;
        }
      }

      @media (max-width: 420px) {
        .packagesHero {
          min-height: 560px;
          padding: 17px;
        }

        .packagesHeroContent h1 {
          font-size: 41px;
        }

        .packagesHeroContent p {
          font-size: 13px;
        }

        .packagesFilters,
        .packagesSectionHeader,
        .packagesGrid,
        .emptyPackages,
        .packageBenefits,
        .packagesCta,
        .packagesError {
          margin-right: 13px;
          margin-left: 13px;
        }

        .packageCardBody {
          padding: 17px;
        }

        .packageFeatureGrid {
          grid-template-columns: 1fr;
        }

        .packageCardFooter {
          align-items: flex-start;
          flex-direction: column;
        }

        .packagesCta h2 {
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
    `}</style>
  );
}