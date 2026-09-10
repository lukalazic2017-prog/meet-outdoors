import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";

const FALLBACK =
  "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=1400&q=88";

function Icon({ name, size = 18 }) {
  const icons = {
    home: (
      <>
        <path d="m3 11 9-8 9 8" />
        <path d="M5 10v10h14V10" />
        <path d="M9 20v-6h6v6" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    pin: (
      <>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    users: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20v-2a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v2" />
        <path d="M16 5a3 3 0 0 1 0 6M17 13a5 5 0 0 1 4 5v2" />
      </>
    ),
    arrow: (
      <>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </>
    ),
    close: (
      <>
        <path d="M6 6l12 12" />
        <path d="M18 6 6 18" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    filter: (
      <>
        <path d="M4 6h16M7 12h10M10 18h4" />
      </>
    ),
    euro: (
      <>
        <path d="M18 7.5A6.5 6.5 0 1 0 18 16.5" />
        <path d="M4 10h9M4 14h8" />
      </>
    ),
    sort: (
      <>
        <path d="M8 6h11M8 12h8M8 18h5" />
        <path d="m4 5-2 2 2 2M2 7h4" />
      </>
    ),
    spark: (
      <>
        <path d="m12 3 1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3Z" />
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
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {icons[name]}
    </svg>
  );
}

function priceLabel(item) {
  if (item.price_on_request) return "Cena na upit";
  const value = Number(item.price_per_night || 0);
  if (!Number.isFinite(value) || value <= 0) return "Cena na upit";

  return `${new Intl.NumberFormat("sr-Latn-RS", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value)} / noć`;
}

function StayCard({ item, onInquiry }) {
  const host = item.profiles;

  return (
    <article className="stayDiscoveryCard">
      <div className="stayDiscoveryMedia">
        <img src={item.cover_url || FALLBACK} alt={item.title || "Smeštaj"} />
        <div className="stayDiscoveryShade" />

        <span className="stayDiscoveryType">
          <Icon name="home" size={13} />
          {item.type || "Smeštaj"}
        </span>

        <div className="stayDiscoveryHero">
          <span>
            <Icon name="pin" size={13} />
            {item.location || "Lokacija nije navedena"}
          </span>
          <h2>{item.title || "Smeštaj u prirodi"}</h2>
        </div>
      </div>

      <div className="stayDiscoveryBody">
        <div className="stayDiscoveryMeta">
          <span>
            <Icon name="users" size={14} />
            {Number(item.max_guests || 0) > 0
              ? `Do ${item.max_guests} gostiju`
              : "Broj gostiju po dogovoru"}
          </span>
          <strong>{priceLabel(item)}</strong>
        </div>

        {item.description && <p>{item.description}</p>}

        <div className="stayDiscoveryFooter">
          {host?.username ? (
            <Link to={`/h/${host.username}`} className="stayDiscoveryHost">
              <span className="stayHostAvatar">
                {host.avatar_url ? (
                  <img src={host.avatar_url} alt="" />
                ) : (
                  (host.full_name || host.username || "H").slice(0, 1).toUpperCase()
                )}
              </span>
              <span>
                <small>Domaćin</small>
                <strong>{host.full_name || host.username}</strong>
              </span>
            </Link>
          ) : (
            <span />
          )}

          <button type="button" onClick={() => onInquiry(item)}>
            Pošalji upit
            <Icon name="arrow" size={15} />
          </button>
        </div>
      </div>
    </article>
  );
}

function InquiryModal({ stay, onClose }) {
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    people_count: "",
    check_in: "",
    check_out: "",
    message: "",
  });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!stay) return null;

  async function submit(event) {
    event.preventDefault();

    const fullName = form.full_name.trim();
    const phone = form.phone.trim();

    if (!fullName || !phone) {
      setError("Unesi ime i prezime i broj telefona.");
      return;
    }

    if (form.check_in && form.check_out && form.check_out < form.check_in) {
      setError("Datum odlaska ne može biti pre datuma dolaska.");
      return;
    }

    setSending(true);
    setError("");

    try {
      const { data: authData } = await supabase.auth.getUser();

      const { error: insertError } = await supabase
        .from("host_accommodation_inquiries")
        .insert({
          accommodation_id: stay.id,
          host_id: stay.host_id,
          user_id: authData?.user?.id || null,
          full_name: fullName,
          phone,
          people_count: form.people_count ? Number(form.people_count) : null,
          check_in: form.check_in || null,
          check_out: form.check_out || null,
          message: form.message.trim() || null,
        });

      if (insertError) throw insertError;
      setSuccess(true);
    } catch (err) {
      console.error("Accommodation inquiry:", err);
      setError(err?.message || "Upit trenutno ne može da se pošalje.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="stayModalBackdrop" onMouseDown={onClose}>
      <div className="stayInquiryModal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="stayInquiryHeader">
          <div>
            <span>UPIT ZA SMEŠTAJ</span>
            <h2>{stay.title}</h2>
            <p>Pošalji kontakt i željeni termin. Domaćin ti se javlja direktno.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Zatvori">
            <Icon name="close" size={19} />
          </button>
        </div>

        {success ? (
          <div className="stayInquirySuccess">
            <span><Icon name="check" size={23} /></span>
            <h3>Upit je poslat.</h3>
            <p>Domaćin je dobio tvoje podatke i željeni termin.</p>
            <button type="button" onClick={onClose}>Zatvori</button>
          </div>
        ) : (
          <form onSubmit={submit} className="stayInquiryForm">
            <label>
              <span>Ime i prezime *</span>
              <input
                value={form.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                required
              />
            </label>

            <div className="stayFormGrid">
              <label>
                <span>Telefon *</span>
                <input
                  type="tel"
                  placeholder="+381..."
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  required
                />
              </label>

              <label>
                <span>Broj gostiju</span>
                <input
                  type="number"
                  min="1"
                  max="100"
                  placeholder="2"
                  value={form.people_count}
                  onChange={(e) => setForm((f) => ({ ...f, people_count: e.target.value }))}
                />
              </label>
            </div>

            <div className="stayFormGrid">
              <label>
                <span>Dolazak</span>
                <input
                  type="date"
                  value={form.check_in}
                  onChange={(e) => setForm((f) => ({ ...f, check_in: e.target.value }))}
                />
              </label>

              <label>
                <span>Odlazak</span>
                <input
                  type="date"
                  min={form.check_in || undefined}
                  value={form.check_out}
                  onChange={(e) => setForm((f) => ({ ...f, check_out: e.target.value }))}
                />
              </label>
            </div>

            <label>
              <span>Poruka</span>
              <textarea
                rows="3"
                maxLength="700"
                placeholder="Npr. dolazimo sa detetom, zanima nas parking..."
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              />
            </label>

            {error && <div className="stayFormError">{error}</div>}

            <div className="stayInquiryActions">
              <button type="button" className="secondary" onClick={onClose}>
                Odustani
              </button>
              <button type="submit" className="primary" disabled={sending}>
                {sending ? "Slanje..." : "Pošalji upit"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function Stays() {
  const [stays, setStays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [guests, setGuests] = useState("");
  const [location, setLocation] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [priceMode, setPriceMode] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedStay, setSelectedStay] = useState(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setLoadError("");

      const { data, error } = await supabase
        .from("host_accommodations")
        .select(`
          *,
          profiles:host_id (
            id,
            full_name,
            username,
            avatar_url,
            city,
            country
          )
        `)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (!active) return;

      if (error) {
        console.error("Stays load:", error);
        setLoadError("Smeštaji trenutno ne mogu da se učitaju.");
        setStays([]);
      } else {
        setStays(data || []);
      }

      setLoading(false);
    }

    load();

    const channel = supabase
      .channel("stays-discovery-live")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "host_accommodations",
        },
        load
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const types = useMemo(
    () => [...new Set(stays.map((item) => item.type).filter(Boolean))].sort(),
    [stays]
  );


  const locations = useMemo(
    () => [...new Set(stays.map((item) => item.location).filter(Boolean))].sort(),
    [stays]
  );

  const quickFilters = [
    { label: "Brvnare", key: "type", value: "Brvnara" },
    { label: "Kamp", key: "type", value: "Kamp" },
    { label: "Glamping", key: "type", value: "Glamping" },
    { label: "Do 50 €", key: "maxPrice", value: "50" },
    { label: "4+ gosta", key: "guests", value: "4" },
    { label: "Cena na upit", key: "priceMode", value: "request" },
  ];

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (query.trim()) count += 1;
    if (type !== "all") count += 1;
    if (guests) count += 1;
    if (location !== "all") count += 1;
    if (minPrice) count += 1;
    if (maxPrice) count += 1;
    if (priceMode !== "all") count += 1;
    return count;
  }, [query, type, guests, location, minPrice, maxPrice, priceMode]);

  function clearFilters() {
    setQuery("");
    setType("all");
    setGuests("");
    setLocation("all");
    setMinPrice("");
    setMaxPrice("");
    setPriceMode("all");
    setSortBy("newest");
  }

  function applyQuickFilter(filter) {
    if (filter.key === "type") setType(filter.value);
    if (filter.key === "maxPrice") setMaxPrice(filter.value);
    if (filter.key === "guests") setGuests(filter.value);
    if (filter.key === "priceMode") setPriceMode(filter.value);
  }

  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("sr");

    const result = stays.filter((item) => {
      const matchesType = type === "all" || item.type === type;
      const matchesGuests =
        !guests ||
        !item.max_guests ||
        Number(item.max_guests) >= Number(guests);

      const matchesLocation =
        location === "all" || item.location === location;

      const itemPrice = Number(item.price_per_night || 0);
      const hasNumericPrice =
        Number.isFinite(itemPrice) && itemPrice > 0 && !item.price_on_request;

      const matchesMinPrice =
        !minPrice || !hasNumericPrice || itemPrice >= Number(minPrice);

      const matchesMaxPrice =
        !maxPrice || !hasNumericPrice || itemPrice <= Number(maxPrice);

      const matchesPriceMode =
        priceMode === "all" ||
        (priceMode === "request" && item.price_on_request) ||
        (priceMode === "fixed" && !item.price_on_request);

      const haystack = [
        item.title,
        item.location,
        item.type,
        item.description,
        item.profiles?.full_name,
        item.profiles?.username,
        item.profiles?.city,
        item.profiles?.country,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("sr");

      return (
        matchesType &&
        matchesGuests &&
        matchesLocation &&
        matchesMinPrice &&
        matchesMaxPrice &&
        matchesPriceMode &&
        (!term || haystack.includes(term))
      );
    });

    return [...result].sort((a, b) => {
      if (sortBy === "price_asc") {
        const ap = a.price_on_request ? Number.POSITIVE_INFINITY : Number(a.price_per_night || 0);
        const bp = b.price_on_request ? Number.POSITIVE_INFINITY : Number(b.price_per_night || 0);
        return ap - bp;
      }

      if (sortBy === "price_desc") {
        const ap = a.price_on_request ? -1 : Number(a.price_per_night || 0);
        const bp = b.price_on_request ? -1 : Number(b.price_per_night || 0);
        return bp - ap;
      }

      if (sortBy === "guests_desc") {
        return Number(b.max_guests || 0) - Number(a.max_guests || 0);
      }

      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });
  }, [
    stays,
    query,
    type,
    guests,
    location,
    minPrice,
    maxPrice,
    priceMode,
    sortBy,
  ]);

  return (
    <>
      <StaysStyles />

      <main className="staysPage">
        <section className="staysHero staysHeroV4">
          <div className="staysHeroCopy">
            <span className="staysKicker">
              <Icon name="home" size={15} />
              SMEŠTAJ U PRIRODI
            </span>
            <h1>Pronađi svoje mesto u prirodi.</h1>
            <p>
              Brvnare, kampovi, glamping i kuće van grada — filtriraj po lokaciji,
              ceni i broju gostiju, pa pošalji upit direktno domaćinu.
            </p>
          </div>

          <div className="staysHeroStats">
            <strong>{filtered.length}</strong>
            <span>trenutno dostupnih</span>
          </div>
        </section>

        <section className="staysQuickFilters" aria-label="Brzi filteri">
          {quickFilters.map((filter) => {
            const isActive =
              (filter.key === "type" && type === filter.value) ||
              (filter.key === "maxPrice" && maxPrice === filter.value) ||
              (filter.key === "guests" && guests === filter.value) ||
              (filter.key === "priceMode" && priceMode === filter.value);

            return (
              <button
                key={`${filter.key}-${filter.value}`}
                type="button"
                className={isActive ? "active" : ""}
                onClick={() => applyQuickFilter(filter)}
              >
                {filter.label}
              </button>
            );
          })}
        </section>

        <section className="staysFilterShell">
          <div className="staysFilterPrimary">
            <label className="staysSearch staysSearchV4">
              <Icon name="search" size={17} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tara, brvnara, kamp, domaćin..."
              />
            </label>

            <button
              type="button"
              className={`staysAdvancedToggle ${filtersOpen ? "active" : ""}`}
              onClick={() => setFiltersOpen((value) => !value)}
            >
              <Icon name="filter" size={16} />
              Filteri
              {activeFiltersCount > 0 && <span>{activeFiltersCount}</span>}
            </button>

            <label className="staysSort">
              <Icon name="sort" size={15} />
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="newest">Najnovije</option>
                <option value="price_asc">Cena: niža prvo</option>
                <option value="price_desc">Cena: viša prvo</option>
                <option value="guests_desc">Najveći kapacitet</option>
              </select>
            </label>
          </div>

          {filtersOpen && (
            <div className="staysAdvancedPanel">
              <label>
                <span>Tip smeštaja</span>
                <select value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="all">Svi tipovi</option>
                  {types.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </label>

              <label>
                <span>Lokacija</span>
                <select value={location} onChange={(e) => setLocation(e.target.value)}>
                  <option value="all">Sve lokacije</option>
                  {locations.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </label>

              <label>
                <span>Broj gostiju</span>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  placeholder="npr. 4"
                />
              </label>

              <label>
                <span>Minimalna cena</span>
                <input
                  type="number"
                  min="0"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="€"
                />
              </label>

              <label>
                <span>Maksimalna cena</span>
                <input
                  type="number"
                  min="0"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="€"
                />
              </label>

              <label>
                <span>Način cene</span>
                <select value={priceMode} onChange={(e) => setPriceMode(e.target.value)}>
                  <option value="all">Sve cene</option>
                  <option value="fixed">Fiksna cena</option>
                  <option value="request">Cena na upit</option>
                </select>
              </label>

              <div className="staysAdvancedActions">
                <button type="button" onClick={clearFilters}>Obriši sve</button>
                <button type="button" className="primary" onClick={() => setFiltersOpen(false)}>
                  Prikaži {filtered.length}
                </button>
              </div>
            </div>
          )}

          <div className="staysResultsMeta">
            <span>
              <strong>{filtered.length}</strong>{" "}
              {filtered.length === 1 ? "smeštaj" : "smeštaja"} odgovara pretrazi
            </span>

            {activeFiltersCount > 0 && (
              <button type="button" onClick={clearFilters}>Obriši filtere</button>
            )}
          </div>
        </section>

        {loading ? (
          <section className="staysState">
            <span className="staysLoader" />
            <h2>Učitavamo smeštaje...</h2>
          </section>
        ) : loadError ? (
          <section className="staysState">
            <h2>Nešto nije prošlo kako treba.</h2>
            <p>{loadError}</p>
          </section>
        ) : filtered.length === 0 ? (
          <section className="staysState">
            <span className="staysStateIcon"><Icon name="home" size={26} /></span>
            <h2>Nema smeštaja za ove filtere.</h2>
            <p>Probaj drugu lokaciju, tip smeštaja ili broj gostiju.</p>
          </section>
        ) : (
          <section className="staysGrid">
            {filtered.map((item) => (
              <StayCard
                key={item.id}
                item={item}
                onInquiry={setSelectedStay}
              />
            ))}
          </section>
        )}
      </main>

      <InquiryModal
        stay={selectedStay}
        onClose={() => setSelectedStay(null)}
      />
    </>
  );
}

function StaysStyles() {
  return (
    <style>{`
      *{box-sizing:border-box}
      .staysPage{
        min-height:100vh;
        padding:104px 24px 72px;
        background:
          radial-gradient(circle at 12% 0%,rgba(193,228,169,.20),transparent 30%),
          linear-gradient(180deg,#f5f8f2 0%,#fbfcfa 34%,#fff 100%);
        color:#17301f;
        font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
      }
      .staysHero,
      .staysFilterBar,
      .staysGrid,
      .staysState{
        width:min(1180px,100%);
        margin-inline:auto;
      }
      .staysHero{
        display:grid;
        grid-template-columns:minmax(0,1fr) auto;
        align-items:end;
        gap:34px;
        padding:32px 0 26px;
      }
      .staysKicker{
        display:inline-flex;
        align-items:center;
        gap:7px;
        color:#477251;
        font-size:10px;
        font-weight:950;
        letter-spacing:.12em;
      }
      .staysHero h1{
        max-width:780px;
        margin:14px 0 0;
        font-size:clamp(38px,5.2vw,72px);
        line-height:.94;
        letter-spacing:-.065em;
      }
      .staysHero p{
        max-width:690px;
        margin:16px 0 0;
        color:#718078;
        font-size:13px;
        line-height:1.65;
      }
      .staysHeroStats{
        min-width:150px;
        padding:18px;
        border:1px solid #dce5d8;
        border-radius:20px;
        background:rgba(255,255,255,.72);
        box-shadow:0 14px 36px rgba(35,59,42,.05);
      }
      .staysHeroStats strong,
      .staysHeroStats span{display:block}
      .staysHeroStats strong{font-size:28px;letter-spacing:-.04em}
      .staysHeroStats span{
        margin-top:3px;
        color:#7d8b82;
        font-size:8px;
        font-weight:850;
        text-transform:uppercase;
      }
      .staysFilterBar{
        position:sticky;
        top:84px;
        z-index:20;
        display:grid;
        grid-template-columns:minmax(260px,1fr) auto auto auto;
        align-items:center;
        gap:9px;
        padding:9px;
        border:1px solid rgba(201,214,198,.9);
        border-radius:18px;
        background:rgba(255,255,255,.88);
        box-shadow:0 14px 34px rgba(29,48,35,.07);
        backdrop-filter:blur(18px);
      }
      .staysSearch,
      .staysCompactFilter{
        display:flex;
        align-items:center;
        gap:8px;
        min-height:43px;
        padding:0 12px;
        border:1px solid #e1e8df;
        border-radius:12px;
        background:#f8faf7;
        color:#66776d;
      }
      .staysSearch input,
      .staysCompactFilter input,
      .staysCompactFilter select{
        width:100%;
        min-width:0;
        border:0;
        outline:0;
        background:transparent;
        color:#243b2b;
        font:inherit;
        font-size:10px;
        font-weight:750;
      }
      .staysCompactFilter select{min-width:120px}
      .staysCompactFilter input{width:110px}
      .staysResultCount{
        padding:0 10px;
        color:#7f8c84;
        font-size:8px;
        font-weight:850;
        white-space:nowrap;
      }
      .staysGrid{
        display:grid;
        grid-template-columns:repeat(3,minmax(0,1fr));
        gap:15px;
        padding-top:20px;
      }
      .stayDiscoveryCard{
        overflow:hidden;
        border:1px solid #dfe7dc;
        border-radius:22px;
        background:#fff;
        box-shadow:0 12px 32px rgba(35,54,41,.055);
      }
      .stayDiscoveryMedia{
        position:relative;
        height:230px;
        overflow:hidden;
        background:#dde6da;
      }
      .stayDiscoveryMedia>img{
        width:100%;
        height:100%;
        object-fit:cover;
        transition:transform .4s ease;
      }
      .stayDiscoveryCard:hover .stayDiscoveryMedia>img{transform:scale(1.035)}
      .stayDiscoveryShade{
        position:absolute;
        inset:0;
        background:linear-gradient(180deg,rgba(7,20,11,.04),transparent 35%,rgba(6,18,10,.82));
      }
      .stayDiscoveryType{
        position:absolute;
        top:12px;
        left:12px;
        display:inline-flex;
        align-items:center;
        gap:6px;
        min-height:30px;
        padding:0 10px;
        border:1px solid rgba(255,255,255,.17);
        border-radius:999px;
        background:rgba(8,27,15,.62);
        color:#eaffd7;
        font-size:8px;
        font-weight:900;
        backdrop-filter:blur(10px);
      }
      .stayDiscoveryHero{
        position:absolute;
        right:15px;
        bottom:15px;
        left:15px;
        color:#fff;
      }
      .stayDiscoveryHero>span{
        display:flex;
        align-items:center;
        gap:5px;
        color:rgba(255,255,255,.72);
        font-size:8px;
        font-weight:800;
      }
      .stayDiscoveryHero h2{
        margin:7px 0 0;
        font-size:21px;
        line-height:1.04;
        letter-spacing:-.035em;
      }
      .stayDiscoveryBody{padding:15px}
      .stayDiscoveryMeta{
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:10px;
      }
      .stayDiscoveryMeta span{
        display:flex;
        align-items:center;
        gap:6px;
        color:#6b796f;
        font-size:8px;
        font-weight:800;
      }
      .stayDiscoveryMeta strong{
        color:#24412e;
        font-size:10px;
        white-space:nowrap;
      }
      .stayDiscoveryBody>p{
        display:-webkit-box;
        min-height:40px;
        margin:12px 0 0;
        overflow:hidden;
        color:#7b887f;
        font-size:9px;
        line-height:1.55;
        -webkit-box-orient:vertical;
        -webkit-line-clamp:2;
      }
      .stayDiscoveryFooter{
        display:grid;
        grid-template-columns:minmax(0,1fr) auto;
        align-items:center;
        gap:10px;
        margin-top:14px;
        padding-top:12px;
        border-top:1px solid #edf1eb;
      }
      .stayDiscoveryHost{
        display:grid;
        grid-template-columns:auto minmax(0,1fr);
        align-items:center;
        gap:8px;
        min-width:0;
        color:inherit;
        text-decoration:none;
      }
      .stayHostAvatar{
        display:grid;
        place-items:center;
        width:31px;
        height:31px;
        overflow:hidden;
        border-radius:10px;
        background:#dff0d5;
        color:#24412e;
        font-size:9px;
        font-weight:950;
      }
      .stayHostAvatar img{width:100%;height:100%;object-fit:cover}
      .stayDiscoveryHost small,
      .stayDiscoveryHost strong{display:block}
      .stayDiscoveryHost small{
        color:#98a198;
        font-size:7px;
        text-transform:uppercase;
      }
      .stayDiscoveryHost strong{
        margin-top:2px;
        overflow:hidden;
        font-size:9px;
        white-space:nowrap;
        text-overflow:ellipsis;
      }
      .stayDiscoveryFooter>button{
        display:inline-flex;
        align-items:center;
        gap:7px;
        min-height:38px;
        padding:0 12px;
        border:0;
        border-radius:12px;
        background:#183a27;
        color:#fff;
        font-size:8px;
        font-weight:900;
        cursor:pointer;
      }
      .staysState{
        display:grid;
        place-items:center;
        min-height:330px;
        padding:50px 20px;
        text-align:center;
      }
      .staysState h2{margin:12px 0 0;font-size:22px}
      .staysState p{margin:7px 0 0;color:#7b887f;font-size:10px}
      .staysStateIcon{
        display:grid;
        place-items:center;
        width:54px;
        height:54px;
        border-radius:17px;
        background:#e7f1e1;
        color:#375f41;
      }
      .staysLoader{
        width:28px;
        height:28px;
        border:3px solid #dce5d8;
        border-top-color:#315d3d;
        border-radius:50%;
        animation:staySpin .8s linear infinite;
      }
      @keyframes staySpin{to{transform:rotate(360deg)}}

      .stayModalBackdrop{
        position:fixed;
        inset:0;
        z-index:5000;
        display:grid;
        place-items:center;
        padding:18px;
        background:rgba(5,14,8,.72);
        backdrop-filter:blur(9px);
      }
      .stayInquiryModal{
        width:min(560px,100%);
        max-height:min(760px,92vh);
        overflow:auto;
        border:1px solid rgba(255,255,255,.16);
        border-radius:24px;
        background:#fff;
        box-shadow:0 30px 90px rgba(0,0,0,.3);
      }
      .stayInquiryHeader{
        display:grid;
        grid-template-columns:minmax(0,1fr) auto;
        gap:18px;
        padding:21px 21px 17px;
        border-bottom:1px solid #e8eee6;
      }
      .stayInquiryHeader span{
        color:#5b835f;
        font-size:8px;
        font-weight:950;
        letter-spacing:.12em;
      }
      .stayInquiryHeader h2{
        margin:5px 0 0;
        color:#193622;
        font-size:24px;
        line-height:1;
        letter-spacing:-.04em;
      }
      .stayInquiryHeader p{
        margin:8px 0 0;
        color:#7c8981;
        font-size:9px;
        line-height:1.5;
      }
      .stayInquiryHeader>button{
        display:grid;
        place-items:center;
        width:35px;
        height:35px;
        border:1px solid #e2e8df;
        border-radius:11px;
        background:#f7f9f6;
        color:#506057;
        cursor:pointer;
      }
      .stayInquiryForm{
        display:grid;
        gap:12px;
        padding:18px 21px 21px;
      }
      .stayInquiryForm label{display:grid;gap:6px}
      .stayInquiryForm label>span{
        color:#5c6d62;
        font-size:8px;
        font-weight:850;
      }
      .stayInquiryForm input,
      .stayInquiryForm textarea{
        width:100%;
        min-height:42px;
        padding:10px 11px;
        border:1px solid #dfe6dc;
        border-radius:11px;
        outline:none;
        background:#fafbf9;
        color:#233a2a;
        font:inherit;
        font-size:10px;
      }
      .stayInquiryForm textarea{resize:vertical}
      .stayInquiryForm input:focus,
      .stayInquiryForm textarea:focus{
        border-color:#8db397;
        box-shadow:0 0 0 3px rgba(83,132,95,.08);
      }
      .stayFormGrid{
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:10px;
      }
      .stayFormError{
        padding:10px 12px;
        border:1px solid #f1cccc;
        border-radius:10px;
        background:#fff5f5;
        color:#a83b3b;
        font-size:9px;
        font-weight:700;
      }
      .stayInquiryActions{
        display:grid;
        grid-template-columns:auto 1fr;
        gap:9px;
        margin-top:2px;
      }
      .stayInquiryActions button{
        min-height:42px;
        padding:0 15px;
        border-radius:12px;
        font:inherit;
        font-size:9px;
        font-weight:900;
        cursor:pointer;
      }
      .stayInquiryActions .secondary{
        border:1px solid #dfe6dc;
        background:#fff;
        color:#607067;
      }
      .stayInquiryActions .primary{
        border:0;
        background:#183a27;
        color:#fff;
      }
      .stayInquirySuccess{
        display:grid;
        place-items:center;
        padding:44px 22px;
        text-align:center;
      }
      .stayInquirySuccess>span{
        display:grid;
        place-items:center;
        width:54px;
        height:54px;
        border-radius:17px;
        background:#e2f2d8;
        color:#2e633a;
      }
      .stayInquirySuccess h3{margin:15px 0 0;color:#1f3d28}
      .stayInquirySuccess p{margin:7px 0 0;color:#7a887f;font-size:10px}
      .stayInquirySuccess button{
        margin-top:18px;
        min-height:40px;
        padding:0 18px;
        border:0;
        border-radius:12px;
        background:#183a27;
        color:#fff;
        font-weight:850;
        cursor:pointer;
      }

      @media(max-width:980px){
        .staysGrid{grid-template-columns:repeat(2,minmax(0,1fr))}
        .staysFilterBar{grid-template-columns:1fr 1fr 1fr}
        .staysSearch{grid-column:1/-1}
        .staysResultCount{text-align:right}
      }
      @media(max-width:640px){
        .staysPage{padding:82px 13px 48px}
        .staysHero{grid-template-columns:1fr;gap:14px;padding:24px 0 18px}
        .staysHero h1{font-size:42px}
        .staysHeroStats{display:none}
        .staysFilterBar{
          top:70px;
          grid-template-columns:1fr 1fr;
          padding:7px;
          border-radius:15px;
        }
        .staysSearch{grid-column:1/-1}
        .staysResultCount{display:none}
        .staysCompactFilter select,
        .staysCompactFilter input{min-width:0;width:100%}
        .staysGrid{grid-template-columns:1fr;gap:12px;padding-top:14px}
        .stayDiscoveryMedia{height:220px}
        .stayFormGrid{grid-template-columns:1fr 1fr}
        .stayInquiryModal{border-radius:20px}
      }
      @media(max-width:420px){
        .stayFormGrid{grid-template-columns:1fr}
      }

      /* =========================================================
         STAYS V3 — PREMIUM COMPACT DISCOVERY
         Existing inquiry flow and accommodation query preserved.
         ========================================================= */

      .staysPage{
        padding:74px 16px 46px;
      }

      .staysHero,
      .staysFilterBar,
      .staysGrid,
      .staysState{
        width:min(1420px,100%);
      }

      .staysHero{
        gap:20px;
        padding:20px 0 14px;
      }

      .staysHero h1{
        max-width:760px;
        margin-top:9px;
        font-size:clamp(38px,4.8vw,64px);
      }

      .staysHero p{
        max-width:650px;
        margin-top:10px;
        font-size:11px;
        line-height:1.55;
      }

      .staysHeroStats{
        min-width:130px;
        padding:12px;
        border-radius:15px;
      }

      .staysHeroStats strong{
        font-size:25px;
      }

      .staysHeroStats span{
        font-size:7px;
      }

      .staysFilterBar{
        position:sticky;
        top:72px;
        z-index:25;
        gap:6px;
        padding:7px;
        border-radius:14px;
        backdrop-filter:blur(18px);
      }

      .staysSearch,
      .staysCompactFilter{
        min-height:40px;
        border-radius:10px;
      }

      .staysGrid{
        gap:10px;
        padding-top:12px;
      }

      .stayDiscoveryCard{
        border-radius:17px;
        overflow:hidden;
      }

      .stayDiscoveryMedia{
        height:180px;
      }

      .stayDiscoveryBody{
        padding:10px;
      }

      .stayDiscoveryHero h2{
        font-size:16px;
        line-height:1.08;
      }

      .stayDiscoveryBody > p{
        display:-webkit-box;
        min-height:30px;
        margin-top:7px;
        overflow:hidden;
        font-size:8px;
        line-height:1.45;
        -webkit-box-orient:vertical;
        -webkit-line-clamp:2;
      }

      .stayDiscoveryMeta{
        gap:7px;
      }

      .stayDiscoveryFooter{
        margin-top:8px;
        padding-top:8px;
      }

      .stayDiscoveryFooter button{
        min-height:32px;
        padding:0 9px;
        border-radius:9px;
      }

      .stayInquiryModal{
        max-width:680px;
        border-radius:18px;
      }

      @media(max-width:760px){
        .staysPage{
          padding:62px 6px 62px;
        }

        .staysHero{
          grid-template-columns:1fr;
          gap:8px;
          padding:16px 8px 10px;
        }

        .staysHero h1{
          max-width:92%;
          font-size:35px;
        }

        .staysHero p{
          max-width:92%;
          font-size:9px;
        }

        .staysHeroStats{
          display:inline-flex;
          align-items:center;
          gap:7px;
          justify-self:start;
          min-width:0;
          padding:7px 9px;
          border-radius:11px;
        }

        .staysHeroStats strong{
          font-size:16px;
        }

        .staysFilterBar{
          top:60px;
          display:flex;
          gap:5px;
          overflow-x:auto;
          padding:6px;
          scrollbar-width:none;
        }

        .staysFilterBar::-webkit-scrollbar{display:none}

        .staysSearch{
          flex:1 0 78vw;
          min-width:240px;
          grid-column:auto;
        }

        .staysCompactFilter{
          flex:0 0 150px;
        }

        .staysGrid{
          display:flex;
          gap:8px;
          overflow-x:auto;
          padding:10px 14px 7px 1px;
          scroll-snap-type:x mandatory;
          scrollbar-width:none;
        }

        .staysGrid::-webkit-scrollbar{display:none}

        .stayDiscoveryCard{
          flex:0 0 82vw;
          max-width:315px;
          scroll-snap-align:start;
        }

        .stayDiscoveryMedia{
          height:175px;
        }

        .stayDiscoveryBody{
          padding:10px;
        }
      }

      @media(max-width:420px){
        .staysHero h1{font-size:31px}
        .stayDiscoveryCard{flex-basis:86vw}
      }


      /* =========================================================
         STAYS V4 — DISCOVERY MARKETPLACE
         ========================================================= */

      .staysHeroV4{
        padding-top:14px;
        padding-bottom:10px;
      }

      .staysQuickFilters,
      .staysFilterShell{
        width:min(1420px,100%);
        margin-inline:auto;
      }

      .staysQuickFilters{
        display:flex;
        gap:7px;
        overflow-x:auto;
        padding:2px 1px 9px;
        scrollbar-width:none;
      }

      .staysQuickFilters::-webkit-scrollbar{display:none}

      .staysQuickFilters button{
        flex:0 0 auto;
        min-height:34px;
        padding:0 12px;
        border:1px solid #dfe7dc;
        border-radius:999px;
        background:#fff;
        color:#5f7066;
        font:inherit;
        font-size:9px;
        font-weight:850;
        cursor:pointer;
        transition:.2s ease;
      }

      .staysQuickFilters button:hover,
      .staysQuickFilters button.active{
        border-color:#9dbd9f;
        background:#eaf4e6;
        color:#23462d;
      }

      .staysFilterShell{
        position:sticky;
        top:74px;
        z-index:30;
        padding:7px;
        border:1px solid rgba(201,214,198,.92);
        border-radius:16px;
        background:rgba(255,255,255,.91);
        box-shadow:0 16px 38px rgba(29,48,35,.08);
        backdrop-filter:blur(18px);
      }

      .staysFilterPrimary{
        display:grid;
        grid-template-columns:minmax(280px,1fr) auto auto;
        gap:7px;
        align-items:center;
      }

      .staysSearchV4{
        min-height:42px;
      }

      .staysAdvancedToggle,
      .staysSort{
        min-height:42px;
        border:1px solid #e1e8df;
        border-radius:11px;
        background:#f8faf7;
        color:#51655a;
      }

      .staysAdvancedToggle{
        display:inline-flex;
        align-items:center;
        justify-content:center;
        gap:7px;
        padding:0 13px;
        font:inherit;
        font-size:9px;
        font-weight:900;
        cursor:pointer;
      }

      .staysAdvancedToggle.active{
        border-color:#a4c2a7;
        background:#edf6e9;
        color:#24462d;
      }

      .staysAdvancedToggle span{
        display:grid;
        place-items:center;
        min-width:20px;
        height:20px;
        padding:0 5px;
        border-radius:999px;
        background:#183a27;
        color:#fff;
        font-size:8px;
      }

      .staysSort{
        display:flex;
        align-items:center;
        gap:6px;
        padding:0 10px;
      }

      .staysSort select{
        min-width:150px;
        border:0;
        outline:0;
        background:transparent;
        color:#2c4333;
        font:inherit;
        font-size:9px;
        font-weight:800;
      }

      .staysAdvancedPanel{
        display:grid;
        grid-template-columns:repeat(6,minmax(0,1fr));
        gap:8px;
        margin-top:8px;
        padding:10px;
        border-top:1px solid #edf1eb;
        background:#fbfcfa;
        border-radius:12px;
      }

      .staysAdvancedPanel label{
        display:grid;
        gap:6px;
      }

      .staysAdvancedPanel label>span{
        color:#738178;
        font-size:8px;
        font-weight:850;
      }

      .staysAdvancedPanel input,
      .staysAdvancedPanel select{
        width:100%;
        min-height:39px;
        padding:0 10px;
        border:1px solid #dde6da;
        border-radius:10px;
        outline:0;
        background:#fff;
        color:#223b2a;
        font:inherit;
        font-size:9px;
        font-weight:750;
      }

      .staysAdvancedActions{
        grid-column:1/-1;
        display:flex;
        justify-content:flex-end;
        gap:7px;
        padding-top:2px;
      }

      .staysAdvancedActions button,
      .staysResultsMeta button{
        min-height:34px;
        padding:0 11px;
        border:1px solid #dce5d8;
        border-radius:9px;
        background:#fff;
        color:#607067;
        font:inherit;
        font-size:8px;
        font-weight:850;
        cursor:pointer;
      }

      .staysAdvancedActions .primary{
        border-color:#183a27;
        background:#183a27;
        color:#fff;
      }

      .staysResultsMeta{
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:12px;
        padding:7px 4px 1px;
        color:#7c8a80;
        font-size:8px;
        font-weight:750;
      }

      .staysResultsMeta strong{
        color:#27432f;
      }

      .stayDiscoveryMedia{
        height:210px;
      }

      .stayDiscoveryHero h2{
        font-size:19px;
      }

      .stayDiscoveryMeta span{
        font-size:9px;
      }

      .stayDiscoveryMeta strong{
        font-size:11px;
      }

      .stayDiscoveryBody>p{
        min-height:36px;
        font-size:9px;
      }

      .stayDiscoveryHost strong{
        font-size:10px;
      }

      .stayDiscoveryFooter>button{
        min-height:36px;
        font-size:9px;
      }

      @media(max-width:1100px){
        .staysAdvancedPanel{
          grid-template-columns:repeat(3,minmax(0,1fr));
        }
      }

      @media(max-width:760px){
        .staysHeroV4{
          padding:12px 8px 9px;
        }

        .staysHeroV4 h1{
          font-size:34px;
        }

        .staysQuickFilters{
          padding:2px 8px 9px;
        }

        .staysFilterShell{
          top:66px;
          margin-inline:6px;
          width:calc(100% - 12px);
          padding:6px;
          border-radius:14px;
        }

        .staysFilterPrimary{
          grid-template-columns:1fr auto;
        }

        .staysSearchV4{
          grid-column:1/-1;
        }

        .staysSort{
          min-width:0;
        }

        .staysSort select{
          min-width:0;
          width:118px;
        }

        .staysAdvancedPanel{
          position:fixed;
          right:0;
          bottom:0;
          left:0;
          z-index:6000;
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:9px;
          max-height:78dvh;
          overflow:auto;
          margin:0;
          padding:18px 14px calc(18px + env(safe-area-inset-bottom));
          border:0;
          border-radius:22px 22px 0 0;
          background:#fff;
          box-shadow:0 -24px 70px rgba(0,0,0,.20);
        }

        .staysAdvancedPanel::before{
          content:"Filteri smeštaja";
          grid-column:1/-1;
          color:#1f3b28;
          font-size:18px;
          font-weight:950;
          letter-spacing:-.03em;
        }

        .staysAdvancedPanel label>span{
          font-size:9px;
        }

        .staysAdvancedActions{
          position:sticky;
          bottom:0;
          grid-column:1/-1;
          padding-top:8px;
          padding-bottom:2px;
          background:#fff;
        }

        .staysAdvancedActions button{
          flex:1;
          min-height:42px;
        }

        .staysResultsMeta{
          padding:7px 3px 1px;
        }

        .staysGrid{
          display:grid !important;
          grid-template-columns:1fr !important;
          gap:11px !important;
          overflow:visible !important;
          padding:12px 0 0 !important;
        }

        .stayDiscoveryCard{
          width:100%;
          max-width:none !important;
          flex:none !important;
        }

        .stayDiscoveryMedia{
          height:220px;
        }

        .stayDiscoveryHero h2{
          font-size:20px;
        }

        .stayDiscoveryBody{
          padding:12px;
        }

        .stayDiscoveryBody>p{
          font-size:9.5px;
        }
      }

      @media(max-width:460px){
        .staysAdvancedPanel{
          grid-template-columns:1fr;
        }

        .staysAdvancedPanel::before,
        .staysAdvancedActions{
          grid-column:1;
        }
      }

    `}</style>
  );
}
