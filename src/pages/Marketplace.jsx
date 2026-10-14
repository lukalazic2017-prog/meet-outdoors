import React, { useCallback, useEffect, useMemo, useState } from "react";

import { Link } from "react-router-dom";

import { supabase } from "../supabaseClient";

import { useAuth } from "../context/AuthContext";

const PAGE_SIZE = 18;

const TYPES = { all: "Sve", adventure: "Avanture", accommodation: "Smeštaj", mixed: "Kombinovano" };

const TYPE_LABELS = { adventure: "Avantura", accommodation: "Smeštaj", mixed: "Kombinovano" };

const money = (v, c = "RSD") => {

  if (v === null || v === undefined || v === "") return "Po dogovoru";

  try { return new Intl.NumberFormat("sr-Latn-RS", { style: "currency", currency: c || "RSD", maximumFractionDigits: 0 }).format(Number(v)); }

  catch { return `${Number(v).toLocaleString("sr-Latn-RS")} ${c || "RSD"}`; }

};

const date = (v) => {

  if (!v) return "Fleksibilno";

  const d = new Date(`${v}T12:00:00`);

  return Number.isNaN(d.getTime()) ? v : new Intl.DateTimeFormat("sr-Latn-RS", { day: "numeric", month: "short", year: "numeric" }).format(d);

};

const period = (a, b) => !a && !b ? "Fleksibilan termin" : a && b && a !== b ? `${date(a)} – ${date(b)}` : date(a || b);

const Icon = ({ name, size = 18 }) => {

  const paths = {

    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,

    arrow: <><path d="M5 12h14m-6-6 6 6-6 6"/></>,

    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,

    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,

    users: <><circle cx="9" cy="8" r="3"/><path d="M3 20v-2a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v2m1-15a3 3 0 0 1 0 6m1 2a5 5 0 0 1 4 5v2"/></>,

    wallet: <><rect x="2" y="5" width="20" height="15" rx="3"/><path d="M2 9h20m-6 5h3"/></>,

    eye: <><path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/></>,

    eyeoff: <><path d="M3 3l18 18M10.6 6.1A11 11 0 0 1 12 6c6.4 0 10 6 10 6a17 17 0 0 1-3.2 3.7M6.3 6.3C3.6 8.1 2 12 2 12s3.6 6 10 6c1.6 0 3-.4 4.2-1"/></>,

    check: <path d="m5 12 4 4L19 6"/>,

    refresh: <><path d="M20 7v5h-5M4 17v-5h5"/><path d="M18 9a7 7 0 0 0-12-2L4 9m2 6a7 7 0 0 0 12 2l2-2"/></>,

    mountain: <><path d="m2 20 7-12 4 6 3-4 6 10H2Z"/><path d="m7 11 2 2 2-2"/></>,

    house: <><path d="m3 11 9-8 9 8M5 10v11h14V10M9 21v-7h6v7"/></>,

    spark: <><path d="m12 2 2.3 7.7L22 12l-7.7 2.3L12 22l-2.3-7.7L2 12l7.7-2.3L12 2Z"/></>,

    sliders: <><path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="2" fill="currentColor" stroke="none"/><circle cx="16" cy="17" r="2" fill="currentColor" stroke="none"/></>,

  };

  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.spark}</svg>;

};

// Lokalna, objašnjiva procena podudaranja na osnovu podataka profila.

// Ne predstavlja proveru dostupnosti, cene hosta niti geografsku udaljenost.

const normalize = (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

const words = (value) => normalize(value).split(/[^a-z0-9čćžšđ]+/).filter((w) => w.length > 2);

function getMatch(demand, host) {

  const kind = demand.intent_type || "adventure";

  const activities = Array.isArray(host?.activities) ? host.activities : [];

  const purposes = Array.isArray(host?.host_purposes) ? host.host_purposes : [];

  const activity = normalize(demand.activity);

  const activityMatched = Boolean(activity && activities.some((a) => {

    const x = normalize(a);

    return x === activity || (x.length > 3 && activity.length > 3 && (x.includes(activity) || activity.includes(x)));

  }));

  const location = words(demand.location_text);

  const hostPlaces = [host?.city, host?.country, host?.public_location].filter(Boolean).join(" ");

  const placeWords = words(hostPlaces);

  const locationMatched = location.length > 0 && placeWords.length > 0 && location.some((w) => placeWords.includes(w));

  const purposeMatched = kind === "mixed"

    ? purposes.includes("adventures") || purposes.includes("accommodation")

    : purposes.includes(kind === "accommodation" ? "accommodation" : "adventures");

  let score = 0;

  const reasons = [];

  if (purposeMatched) { score += 25; reasons.push("Odgovarajući tip ponude"); }

  if (kind !== "accommodation" && activityMatched) { score += 50; reasons.push("Poklapa se aktivnost"); }

  if (kind === "accommodation" && purposeMatched) score += 25;

  if (locationMatched) { score += 25; reasons.push("Poklapa se lokacija profila"); }

  // Ne nagrađujemo nedostajuće informacije kao potvrđena podudaranja.

  return { score, reasons, activityMatched, locationMatched };

}



export default function Marketplace() {

  const { user, profile, isHost, loading: authLoading } = useAuth();

  const [items, setItems] = useState([]);
  const [offerStatuses, setOfferStatuses] = useState({});

  const [dismissed, setDismissed] = useState([]);

  const [page, setPage] = useState(0);

  const [hasMore, setHasMore] = useState(false);

  const [loading, setLoading] = useState(true);

  const [busyId, setBusyId] = useState(null);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [type, setType] = useState("all");

  const [view, setView] = useState("active");

  const [sort, setSort] = useState("match");

  const [locationFilter, setLocationFilter] = useState("");

  const [minBudget, setMinBudget] = useState("");

  const [onlyMatched, setOnlyMatched] = useState(false);

  const load = useCallback(async (nextPage = 0, append = false) => {

    if (!user?.id || !isHost) { setLoading(false); return; }

    setLoading(true);

    setError("");

    try {

      const [market, hidden] = await Promise.all([

        supabase.rpc(sort === "match" ? "get_ranked_marketplace_demands" : "get_marketplace_demands", { p_limit: PAGE_SIZE, p_offset: nextPage * PAGE_SIZE }),

        supabase.rpc("get_my_dismissed_demands"),

      ]);

      if (market.error) throw market.error;

      if (hidden.error) throw hidden.error;

      const rows = market.data || [];
        // Status is read-only. An individual RPC failure must not break the marketplace.
        const statusResults = await Promise.all(rows.map(async (demand) => {
          const { data, error: statusError } = await supabase.rpc(
            "get_my_marketplace_offer_status", { p_intent_id: demand.id }
          );
          if (statusError) return [demand.id, null];
          return [demand.id, data && typeof data === "object" && !Array.isArray(data) ? data : null];
        }));
        setOfferStatuses((old) => append
          ? { ...old, ...Object.fromEntries(statusResults) }
          : Object.fromEntries(statusResults));

      setItems((old) => append ? [...old, ...rows.filter((r) => !old.some((x) => x.id === r.id))] : rows);

      setDismissed((hidden.data || []).map((x) => x.intent_id));

      setHasMore(rows.length === PAGE_SIZE);

      setPage(nextPage);

    } catch (e) {

      setError(e.message || "Nije moguće učitati potražnje.");

    } finally { setLoading(false); }

  }, [user?.id, isHost, sort]);

  useEffect(() => { if (!authLoading) load(0); }, [authLoading, load]);

  const scoredItems = useMemo(() => items.map((r) => ({ ...r, _match: r.match_score !== undefined ? { score: Number(r.match_score), reasons: r.match_reason ? String(r.match_reason).split(" · ") : [] } : getMatch(r, profile) })), [items, profile]);

  const filtered = useMemo(() => {

    const q = normalize(search);

    const loc = normalize(locationFilter);

    const minimum = minBudget.trim() === "" ? null : Number(minBudget);

    return scoredItems.filter((r) => {

      if (type !== "all" && r.intent_type !== type) return false;

      if (q && ![r.activity, r.location_text, r.intent_type, TYPE_LABELS[r.intent_type]].some((v) => normalize(v).includes(q))) return false;

      if (loc && !normalize(r.location_text).includes(loc)) return false;

      if (minimum !== null && Number.isFinite(minimum) && (r.budget_per_person == null || Number(r.budget_per_person) < minimum)) return false;

      if (onlyMatched && r._match.score < 50) return false;

      return true;

    }).sort((a, b) => {

      if (sort === "match") return b._match.score - a._match.score || new Date(b.created_at) - new Date(a.created_at);

      if (sort === "oldest") return new Date(a.created_at) - new Date(b.created_at);

      if (sort === "budget") return Number(b.budget_per_person ?? -1) - Number(a.budget_per_person ?? -1);

      return new Date(b.created_at) - new Date(a.created_at);

    });

  }, [scoredItems, type, search, sort, locationFilter, minBudget, onlyMatched]);  async function dismiss(id) {

    if (busyId) return;

    setBusyId(id); setError("");

    try {

      const { error: e } = await supabase.rpc("reject_adventure_demand", { p_intent_id: id });

      if (e) throw e;

      setItems((old) => old.filter((x) => x.id !== id));

      setDismissed((old) => [...new Set([...old, id])]);

      // Popunjavamo listu ponovnim učitavanjem nakon filtriranja na serveru.

      await load(0);

    } catch (e) { setError(e.message || "Zahtev nije moguće sakriti."); }

    finally { setBusyId(null); }

  }

  async function restore(id) {

    if (busyId) return;

    setBusyId(id); setError("");

    try {

      const { error: e } = await supabase.rpc("restore_dismissed_demand", { p_intent_id: id });

      if (e) throw e;

      setDismissed((old) => old.filter((x) => x !== id));

      await load(0);

    } catch (e) { setError(e.message || "Zahtev nije moguće vratiti."); }

    finally { setBusyId(null); }

  }

  const canUse = Boolean(user && isHost);

  return <>

    <style>{styles}</style>

    <main className="mo-marketplace">

      <div className="mo-shell">

        <div className="mo-topline"><Link to="/dashboard">← Host Dashboard</Link><span><span className="mo-live-dot"/> MEETOUTDOORS MARKETPLACE</span></div>

        <header className="mo-hero">

          <div className="mo-hero-copy"><span className="mo-eyebrow"><Icon name="spark" size={14}/> MEETOUTDOORS / ZA DOMAĆINE</span>

            <h1>Ljudi traže.<br/><em>Ti kreiraš iskustvo.</em></h1>

            <p>Pronađi putnike koji već znaju šta žele. Pregledaj zahteve, pošalji ponudu i pretvori interesovanje u novu rezervaciju.</p>

            <div className="mo-hero-actions"><button onClick={() => document.getElementById("mo-market-results")?.scrollIntoView({ behavior: "smooth" })}>Istraži potražnje <Icon name="arrow" size={17}/></button><Link to="/dashboard">Moj dashboard <Icon name="arrow" size={15}/></Link></div>

          </div>

          <div className="mo-hero-art" aria-hidden="true"><div className="mo-art-orbit"/><div className="mo-art-sun"/><div className="mo-ridge mo-ridge-back"/><div className="mo-ridge mo-ridge-mid"/><div className="mo-ridge mo-ridge-front"/><div className="mo-art-coordinate">EXPLORE · CONNECT · EXPERIENCE</div></div>

        </header>

        <div className="mo-overview"><div><span className="mo-overview-icon"><Icon name="mountain" size={19}/></span><div><small>UČITANE POTRAŽNJE</small><strong>{items.length}<em>{hasMore ? "+" : ""}</em></strong></div></div><div><span className="mo-overview-icon"><Icon name="check" size={19}/></span><div><small>ODGOVORENO U LISTI</small><strong>{items.filter((r) => { const o = offerStatuses[r.id]; return o ? ["pending", "accepted"].includes(o.offer_status || o.status) : r.already_responded; }).length}</strong></div></div><div><span className="mo-overview-icon"><Icon name="eyeoff" size={19}/></span><div><small>SAKRIVENI ZAHTEVI</small><strong>{dismissed.length}</strong></div></div><div className="mo-overview-note"><span className="mo-live-dot"/> Novi zahtevi stižu direktno od korisnika <Icon name="arrow" size={17}/></div></div>

        {!authLoading && !canUse ? <section className="mo-empty"><Icon name="mountain" size={30}/><h2>Marketplace je za hostove</h2><p>Prijavi se na host nalog da vidiš potražnje i pošalješ ponudu.</p><Link to={user ? "/" : "/login"}>{user ? "Nazad na početnu" : "Prijavi se"} <Icon name="arrow" size={16}/></Link></section> : <>

          <section className="mo-toolbar" id="mo-market-results"><div className="mo-toolbar-heading"><div><span className="mo-kicker">AKTUELNA POTRAŽNJA</span><h2>Aktuelne potražnje<span className="mo-heading-dot">.</span></h2></div><button className="mo-refresh" onClick={() => load(0)} disabled={loading} title="Osveži"><Icon name="refresh" size={17}/> Osveži</button></div>

            <div className="mo-controls"><div className="mo-search"><Icon name="search" size={19}/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pretraži aktivnost ili lokaciju..." aria-label="Pretraga učitanih potražnji"/></div><div className="mo-select-wrap"><Icon name="sliders" size={16}/><select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sortiranje"><option value="match">Najbolje podudaranje</option><option value="newest">Najnovije</option><option value="oldest">Najstarije</option><option value="budget">Najveći budžet</option></select></div></div>

            <div className="mo-smart-controls"><label>Lokacija<input value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} placeholder="Npr. Tara" /></label><label>Min. budžet po osobi<input type="number" min="0" value={minBudget} onChange={(e) => setMinBudget(e.target.value)} placeholder="Bez minimuma" /></label><label className="mo-smart-toggle"><input type="checkbox" checked={onlyMatched} onChange={(e) => setOnlyMatched(e.target.checked)} /> Samo jača podudaranja (50+)</label></div><p className="mo-match-disclaimer">Match Score je informativna procena prema aktivnostima, tipu ponude i lokaciji tvog profila. U režimu „Najbolje podudaranje“ redosled računa server. Ne potvrđuje raspoloživost ni udaljenost.</p><div className="mo-filterbar"><div className="mo-tabs">{Object.entries(TYPES).map(([key, label]) => <button key={key} className={type === key ? "active" : ""} onClick={() => setType(key)}>{label}</button>)}</div><div className="mo-view-switch"><button className={view === "active" ? "selected" : ""} onClick={() => setView("active")}>Aktivno</button><button className={view === "hidden" ? "selected" : ""} onClick={() => setView("hidden")}>Sakriveno <span>{dismissed.length}</span></button></div></div>

          </section>

          {error && <div className="mo-error" role="alert">{error} <button onClick={() => load(0)}>Pokušaj ponovo</button></div>}

          {view === "active" ? <>

            <div className="mo-results-meta"><span>{loading && !items.length ? "Učitavamo..." : `${filtered.length} prikazanih potražnji`}</span><span>Budžet je prikazan po osobi, kada je naveden</span></div>

            <div className="mo-cards">{filtered.map((r) => {

              const kind = r.intent_type || "adventure";

              const offer = offerStatuses[r.id];
              const offerStatus = offer?.offer_status || offer?.status || null;
              const responded = offer
                ? ["pending", "accepted"].includes(offerStatus)
                : Boolean(r.already_responded);
              const statusText = offerStatus === "pending" ? "Ponuda poslata"
                : offerStatus === "accepted" ? "Prihvaćena"
                : offerStatus === "rejected" ? "Odbijena"
                : offerStatus === "withdrawn" ? "Povučena"
                : responded ? "Ponuda poslata" : "Prima ponude";
              const actionText = offerStatus === "pending" ? "Izmeni ponudu"
                : offerStatus === "accepted" ? "Detalji"
                : offer?.can_send === true ? "Pošalji ponovo"
                : offerStatus === "rejected" ? "Detalji"
                : offerStatus === "withdrawn" ? "Detalji"
                : responded ? "Detalji" : "Pošalji ponudu";

              const title = r.activity || (kind === "accommodation" ? "Potraga za smeštajem" : kind === "mixed" ? "Kompletan outdoor doživljaj" : "Outdoor avantura");

              const hasBudget = r.budget_per_person !== null && r.budget_per_person !== undefined;

              return <article className={`mo-card mo-card--${kind} ${responded ? "mo-card--responded" : ""}`} key={r.id}>

                <div className="mo-card-accent" aria-hidden="true" />

                <div className="mo-card-top">

                  <span className={`mo-type mo-type-${kind}`}><Icon name={kind === "accommodation" ? "house" : kind === "mixed" ? "spark" : "mountain"} size={14}/>{TYPE_LABELS[kind] || "Avantura"}</span>

                  <span className={responded ? "mo-replied" : "mo-open"}>{responded ? <Icon name="check" size={13}/> : <i/>}{statusText}</span>

                </div>

                <div className="mo-match-strip"><span className="mo-match-score">{r._match.score}/100 <small>MATCH</small></span><span className="mo-match-reasons">{r._match.reasons.length ? r._match.reasons.join(" · ") : "Nema potvrđenih podudaranja u profilu"}</span></div><div className="mo-card-main">

                  <h3 title={title}>{title}</h3>

                  <div className="mo-location"><Icon name="pin" size={16}/><span>{r.location_text || "Lokacija po dogovoru"}</span></div>

                </div>

                <div className="mo-card-facts">

                  <div className="mo-fact"><span className="mo-fact-icon"><Icon name="calendar" size={17}/></span><div><small>TERMIN</small><strong>{period(r.start_date, r.end_date)}</strong></div></div>

                  <div className="mo-fact"><span className="mo-fact-icon"><Icon name="users" size={17}/></span><div><small>BROJ OSOBA</small><strong>{r.people_count || 1} {Number(r.people_count) === 1 ? "osoba" : "osoba"}</strong></div></div>

                </div>

                <div className="mo-card-bottom">

                  <div className="mo-budget"><small>{hasBudget ? "BUDŽET PO OSOBI" : "PLANIRANI BUDŽET"}</small><strong>{money(r.budget_per_person, r.currency)}</strong></div>

                  <div className="mo-card-actions"><button className="mo-hide" title="Sakrij ovu potražnju" aria-label="Sakrij ovu potražnju" disabled={Boolean(busyId)} onClick={() => dismiss(r.id)}><Icon name="eyeoff" size={17}/></button><Link className="mo-offer-link" to={`/host/demand/${r.id}`}>{actionText}<Icon name="arrow" size={17}/></Link></div>

                </div>

              </article>;

            })}</div>

            {!loading && !filtered.length && <section className="mo-empty"><Icon name="search" size={28}/><h3>Trenutno nema rezultata</h3><p>{search || type !== "all" ? "Probaj drugu pretragu ili kategoriju." : "Nove potražnje će se pojaviti ovde čim ih korisnici kreiraju."}</p><button onClick={() => { setSearch(""); setType("all"); setLocationFilter(""); setMinBudget(""); setOnlyMatched(false); }}>Obriši filtere</button></section>}

            {loading && <div className="mo-loading"><span className="mo-spinner"/> Učitavamo potražnje...</div>}

            {hasMore && !loading && <div className="mo-loadmore"><button onClick={() => load(page + 1, true)}>Učitaj još potražnji <Icon name="arrow" size={16}/></button></div>}

            <p className="mo-footnote">Pretraga, filteri i Match Score važe samo za trenutno učitane potražnje. Globalno rangiranje zahteva izmene RPC funkcije.</p>

          </> : <section className="mo-hidden-section"><div className="mo-hidden-head"><h3>Sakrivene potražnje</h3><p>Vrati zahtev u Marketplace kada poželiš da ga ponovo razmotriš.</p></div>{dismissed.length ? <div className="mo-hidden-list">{dismissed.map((id) => <div key={id} className="mo-hidden-row"><span><Icon name="eyeoff" size={17}/> Sakriven zahtev <small>{id.slice(0, 8)}…</small></span><button disabled={Boolean(busyId)} onClick={() => restore(id)}><Icon name="refresh" size={15}/> Vrati u pregled</button></div>)}</div> : <div className="mo-hidden-empty">Nema sakrivenih potražnji.</div>}</section>}

        </>}

      </div>

    </main>

  </>;

}

const styles = `

.mo-smart-controls{display:flex;flex-wrap:wrap;align-items:end;gap:12px;margin-top:12px}.mo-smart-controls label{display:flex;flex-direction:column;gap:6px;color:#56705e;font-size:11px;font-weight:750}.mo-smart-controls input:not([type=checkbox]){width:185px;max-width:100%;min-height:40px;padding:0 11px;border:1px solid #dce6dc;border-radius:10px;background:#fff;color:#203c2b;font-size:12px}.mo-smart-controls .mo-smart-toggle{flex-direction:row;align-items:center;min-height:40px;gap:8px}.mo-smart-toggle input{accent-color:#1d5438}.mo-match-disclaimer{font-size:11px;color:#788b7b;line-height:1.5;margin:11px 0 0}.mo-match-strip{display:flex;align-items:center;gap:10px;margin:14px 21px 0;padding:9px 11px;background:#f0f5ea;border-radius:10px;min-width:0}.mo-match-score{white-space:nowrap;color:#255f3b;font-size:17px;font-weight:850}.mo-match-score small{display:block;font-size:8px;letter-spacing:1px}.mo-match-reasons{font-size:10px;line-height:1.45;color:#557260;overflow-wrap:anywhere}@media(max-width:700px){.mo-smart-controls{display:grid;grid-template-columns:1fr 1fr}.mo-smart-controls input:not([type=checkbox]){width:100%}.mo-smart-controls .mo-smart-toggle{grid-column:1/-1}.mo-match-strip{margin:12px 17px 0}}



.mo-marketplace{--bg:#f5f7f3;--forest:#102b24;--green:#184c3b;--lime:#d4ed9a;--muted:#77877f;--line:#e6ebe5;background:var(--bg);color:#1b3028;min-height:100vh;padding:30px 22px 90px;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}

.mo-marketplace *{box-sizing:border-box}.mo-marketplace button,.mo-marketplace input,.mo-marketplace select{font:inherit}.mo-marketplace button{cursor:pointer}.mo-marketplace a{text-decoration:none}.mo-shell{max-width:1220px;margin:auto}.mo-topline{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;gap:12px;font-size:12px;font-weight:700}.mo-topline a{color:#53685c}.mo-topline>span{color:#527060;letter-spacing:1.8px;font-size:10px}.mo-live-dot{display:inline-block;width:7px;height:7px;background:#65a97a;border-radius:50%;margin-right:7px}

.mo-hero{background:radial-gradient(circle at 82% 15%,#2a5c48 0%,transparent 37%),linear-gradient(115deg,#102820,#153d2f 70%,#214f3a);border-radius:23px;min-height:306px;display:flex;align-items:center;position:relative;overflow:hidden;padding:46px 55px;color:#fff;isolation:isolate}.mo-hero-copy{position:relative;z-index:2;max-width:600px}.mo-eyebrow{font-size:10px;letter-spacing:2px;color:#d1eaa0;font-weight:800;display:flex;align-items:center;gap:8px}.mo-hero h1{font-size:clamp(30px,4vw,53px);letter-spacing:-2.3px;line-height:1.09;margin:17px 0 14px;font-weight:800}.mo-hero h1 em{font-style:normal;color:#d9f0a4}.mo-hero p{font-size:13px;line-height:1.85;color:#c0d1c8;max-width:440px;margin:0}.mo-hero-actions{display:flex;align-items:center;gap:24px;margin-top:24px}.mo-hero-actions button{border:0;background:#d9efa8;color:#183326;padding:12px 17px;border-radius:10px;font-size:12px;font-weight:800;display:flex;align-items:center;gap:14px}.mo-hero-actions a{color:#e8f0e9;font-size:12px;font-weight:700;display:flex;align-items:center;gap:7px}.mo-hero-art{position:absolute;right:30px;top:0;bottom:0;width:37%;display:flex;align-items:center;justify-content:center;opacity:.85}.mo-art-ring{border:1px solid #ffffff22;border-radius:50%;position:absolute;aspect-ratio:1}.mo-art-ring-one{width:260px}.mo-art-ring-two{width:370px}.mo-art-sun{position:absolute;width:112px;height:112px;background:#d9efa8;border-radius:50%;top:56px;right:31%;filter:blur(.3px)}.mo-art-mountains{position:absolute;font-size:190px;bottom:-70px;right:14%;filter:grayscale(1) brightness(1.5);opacity:.36}.mo-art-label{position:absolute;bottom:24px;right:20px;letter-spacing:2px;font-size:9px;color:#d5e7d8}.mo-art-label span{margin-left:12px}

.mo-toolbar{margin-top:37px}.mo-toolbar-heading{display:flex;align-items:end;justify-content:space-between;gap:12px}.mo-kicker{color:#628a65;font-size:10px;font-weight:800;letter-spacing:2px}.mo-toolbar h2{font-size:clamp(21px,2.6vw,29px);letter-spacing:-1px;margin:7px 0 0}.mo-heading-dot{color:#83a869}.mo-refresh{border:1px solid #dce4da;background:#fff;color:#496456;padding:9px 12px;border-radius:10px;font-size:12px;font-weight:700;display:flex;align-items:center;gap:8px}.mo-controls{display:flex;gap:10px;margin-top:22px}.mo-search{background:#fff;border:1px solid var(--line);border-radius:12px;display:flex;align-items:center;gap:10px;padding:0 14px;flex:1;color:#6b8575}.mo-search input{height:45px;width:100%;border:0;outline:none;color:#203a2c;background:transparent;font-size:12px}.mo-select-wrap{background:#fff;border:1px solid var(--line);border-radius:12px;display:flex;align-items:center;gap:7px;padding:0 12px;color:#5b7565}.mo-select-wrap select{border:0;outline:none;background:transparent;color:#2c4939;font-size:12px;min-width:126px}.mo-filterbar{display:flex;justify-content:space-between;gap:12px;align-items:center;margin:18px 0 0}.mo-tabs{display:flex;gap:5px;flex-wrap:wrap}.mo-tabs button{border:1px solid transparent;background:transparent;color:#66786e;padding:9px 14px;font-size:12px;font-weight:750;border-radius:9px}.mo-tabs button.active{background:#163e2e;color:#fff}.mo-view-switch{display:flex;align-items:center;background:#e8ede7;padding:3px;border-radius:10px;white-space:nowrap}.mo-view-switch button{border:0;background:transparent;color:#687b6e;padding:8px 11px;font-size:11px;font-weight:800;border-radius:8px}.mo-view-switch button.selected{background:#fff;color:#1d3b2a;box-shadow:0 1px 5px #0000000a}.mo-view-switch span{font-size:10px;margin-left:3px;color:#839486}.mo-results-meta{display:flex;justify-content:space-between;gap:10px;font-size:11px;color:#7c8b80;margin:24px 0 12px}.mo-results-meta span:first-child{color:#3d5848;font-weight:800}.mo-cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.mo-card{background:#fff;border:1px solid #e5ebe3;border-radius:16px;padding:19px;transition:transform .18s,border-color .18s,box-shadow .18s;min-width:0}.mo-card:hover{transform:translateY(-3px);border-color:#c6d8c7;box-shadow:0 12px 35px #163f2710}.mo-card-top{display:flex;align-items:center;justify-content:space-between;gap:8px}.mo-type{display:inline-flex;align-items:center;gap:6px;border-radius:7px;padding:6px 9px;font-size:10px;font-weight:800;background:#eef4e8;color:#426d47}.mo-type-accommodation{background:#eaf2fa;color:#3d6c9a}.mo-type-mixed{background:#f3ecfb;color:#7c5ca0}.mo-open,.mo-replied{display:flex;align-items:center;gap:5px;font-size:10px;font-weight:750;color:#799083;white-space:nowrap}.mo-open i{width:6px;height:6px;background:#62b781;border-radius:50%}.mo-replied{color:#2f8155}.mo-card h3{font-size:18px;line-height:1.28;letter-spacing:-.5px;margin:20px 0 8px;color:#1a3327;min-height:46px;overflow-wrap:anywhere}.mo-location{display:flex;align-items:center;gap:5px;color:#6f8375;font-size:12px;min-height:20px}.mo-details{display:flex;flex-wrap:wrap;gap:13px;margin-top:20px;padding:16px 0;border-top:1px solid #edf0ea;border-bottom:1px solid #edf0ea}.mo-details>div{display:flex;align-items:center;gap:6px;color:#556d5c;font-size:11px;font-weight:600}.mo-details svg{color:#8aa18e;flex-shrink:0}.mo-card-bottom{display:flex;align-items:end;justify-content:space-between;gap:8px;margin-top:17px}.mo-budget{display:flex;flex-direction:column;gap:5px;min-width:0}.mo-budget small{font-size:9px;font-weight:800;letter-spacing:1px;color:#8b9b8f}.mo-budget strong{font-size:17px;letter-spacing:-.5px;color:#203f2e;overflow-wrap:anywhere}.mo-card-actions{display:flex;gap:6px;align-items:center;flex-shrink:0}.mo-hide{display:grid;place-items:center;width:34px;height:35px;border:1px solid #e7ece5;border-radius:9px;background:#fff;color:#738b7b}.mo-offer-link{display:flex;align-items:center;gap:7px;padding:10px 11px;background:#153e2c;color:#fff;font-size:11px;font-weight:800;border-radius:9px;white-space:nowrap}.mo-offer-link:hover,.mo-hero-actions button:hover{filter:brightness(1.12)}.mo-marketplace button:disabled{opacity:.5;cursor:not-allowed}.mo-error{background:#fff0eb;border:1px solid #f1c9b9;color:#9b4933;padding:13px 15px;border-radius:12px;font-size:12px;margin-top:17px}.mo-error button{background:none;border:0;text-decoration:underline;color:inherit;font-weight:800}.mo-empty{margin-top:18px;padding:56px 20px;border:1px dashed #d8e2d6;background:#fff;border-radius:15px;text-align:center;color:#73917b}.mo-empty h2,.mo-empty h3{color:#24452f;margin:14px 0 7px}.mo-empty p{font-size:12px;color:#718477;line-height:1.7}.mo-empty a,.mo-empty button{display:inline-flex;align-items:center;gap:8px;border:0;background:#17412f;color:#fff;padding:11px 15px;border-radius:9px;font-size:12px;font-weight:800;margin-top:10px}.mo-loading,.mo-loadmore{text-align:center;margin-top:25px;font-size:12px;color:#637d69}.mo-spinner{display:inline-block;width:13px;height:13px;border:2px solid #cbd9c8;border-top-color:#1c6d43;border-radius:50%;animation:mo-spin .7s linear infinite;margin-right:7px;vertical-align:middle}@keyframes mo-spin{to{transform:rotate(360deg)}}.mo-loadmore button{border:1px solid #d9e4d7;border-radius:10px;background:#fff;color:#214a33;padding:12px 19px;font-size:12px;font-weight:800;display:inline-flex;align-items:center;gap:10px}.mo-footnote{font-size:10px;color:#93a296;text-align:center;margin-top:25px}.mo-hidden-section{background:#fff;border:1px solid var(--line);border-radius:15px;margin-top:20px;padding:24px}.mo-hidden-head h3{font-size:19px;margin:0 0 7px}.mo-hidden-head p{font-size:12px;color:#718777;margin:0 0 19px}.mo-hidden-list{display:grid;gap:8px}.mo-hidden-row{border:1px solid #eaf0e8;border-radius:10px;padding:13px;display:flex;align-items:center;justify-content:space-between;gap:12px}.mo-hidden-row>span{display:flex;align-items:center;gap:9px;font-size:12px;font-weight:700;color:#385440}.mo-hidden-row small{color:#9ba99d;font-size:10px}.mo-hidden-row button{display:flex;align-items:center;gap:7px;border:0;border-radius:8px;background:#e9f2e5;color:#31623b;padding:9px 12px;font-size:11px;font-weight:800}.mo-hidden-empty{font-size:12px;color:#7b9180;padding:22px;background:#f7f9f5;border-radius:10px}

@media(max-width:1020px){.mo-cards{grid-template-columns:repeat(2,minmax(0,1fr))}.mo-hero-art{opacity:.4}.mo-hero-copy{max-width:580px}}@media(max-width:680px){.mo-marketplace{padding:17px 13px 55px}.mo-topline>span{font-size:8px;letter-spacing:.9px}.mo-hero{padding:32px 22px;min-height:290px;border-radius:16px}.mo-hero h1{font-size:35px;letter-spacing:-1.5px}.mo-hero p{font-size:12px}.mo-hero-art{right:-85px;width:55%;opacity:.18}.mo-hero-actions{gap:15px;flex-wrap:wrap}.mo-toolbar{margin-top:27px}.mo-toolbar-heading{align-items:center}.mo-toolbar h2{font-size:22px}.mo-controls{flex-direction:column}.mo-search input{height:43px}.mo-select-wrap{height:43px}.mo-select-wrap select{flex:1}.mo-filterbar{align-items:stretch;flex-direction:column}.mo-tabs{display:grid;grid-template-columns:repeat(4,1fr);gap:2px}.mo-tabs button{font-size:10px;padding:9px 4px}.mo-view-switch{align-self:flex-start}.mo-results-meta span:last-child{display:none}.mo-cards{grid-template-columns:1fr;gap:11px}.mo-card{padding:17px}.mo-card h3{min-height:0;margin-top:16px}.mo-details{margin-top:15px}.mo-card-bottom{margin-top:14px}.mo-hidden-row{align-items:flex-start;flex-direction:column}.mo-hidden-row button{align-self:flex-end}}

/* MARKETPLACE / SIGNATURE EDITION — scoped, self-contained */

.mo-marketplace{--bg:#f6f7f3;--forest:#112c23;--green:#204d39;--lime:#d5e99c;--muted:#718077;--line:#e4eae3;background:var(--bg);color:#192c24;padding:24px 24px 92px;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:-.01em}

.mo-shell{max-width:1280px}

.mo-topline{margin:0 0 17px;font-size:12px}.mo-topline a{color:#546b5b;transition:color .2s}.mo-topline a:hover{color:#173e2b}.mo-topline>span{font-size:10px;letter-spacing:2px}

.mo-hero{min-height:286px;border-radius:22px;padding:40px 49px;background:radial-gradient(ellipse at 80% 0%,#325846 0%,transparent 53%),linear-gradient(125deg,#102b22,#1c4332 72%,#234b38);box-shadow:0 14px 45px #1a392417;isolation:isolate}

.mo-hero:before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(120deg,transparent 0 76px,#ffffff06 77px 78px);pointer-events:none}

.mo-hero-copy{max-width:670px}.mo-eyebrow{font-size:10px;letter-spacing:2.2px;color:#d8ecad}.mo-hero h1{font-size:clamp(37px,4.4vw,61px);font-weight:790;line-height:1.04;letter-spacing:-2.9px;margin:16px 0 13px}.mo-hero h1 em{color:#d9eaa5}.mo-hero p{max-width:470px;font-size:13px;line-height:1.8;color:#c3d5c9}

.mo-hero-actions{margin-top:22px;gap:24px}.mo-hero-actions button{background:#e2f0b6;color:#163528;padding:12px 16px;border-radius:10px;box-shadow:0 6px 20px #0000001b}.mo-hero-actions a{font-size:12px}

.mo-hero-art{right:0;top:0;bottom:0;width:44%;opacity:1;overflow:hidden;pointer-events:none}.mo-art-orbit{position:absolute;width:360px;height:360px;border:1px solid #d7efc81c;border-radius:50%;right:13%;top:-78px;box-shadow:0 0 0 50px #ffffff05,0 0 0 101px #ffffff04}.mo-art-sun{position:absolute;width:145px;height:145px;right:29%;top:24px;border-radius:50%;background:linear-gradient(155deg,#e5f4c4,#b4d48b);box-shadow:0 0 90px #cce3a42c}.mo-ridge{position:absolute;inset:auto -10% 0 -12%;height:100%;transform:translateY(1px)}.mo-ridge-back{background:#426e54;clip-path:polygon(0 87%,20% 55%,37% 72%,57% 35%,81% 75%,100% 48%,100% 100%,0 100%);opacity:.9}.mo-ridge-mid{background:#2d5941;clip-path:polygon(0 100%,0 79%,17% 67%,36% 89%,60% 49%,79% 78%,100% 60%,100% 100%)}.mo-ridge-front{background:#153e2e;clip-path:polygon(0 100%,0 96%,20% 77%,41% 96%,69% 65%,100% 88%,100% 100%)}.mo-art-coordinate{position:absolute;right:28px;bottom:17px;font-size:9px;letter-spacing:2px;color:#c6dcbf;opacity:.8}

.mo-overview{display:grid;grid-template-columns:1fr 1fr 1fr 1.45fr;gap:10px;margin-top:12px}.mo-overview>div{background:#fff;border:1px solid #e8ede5;border-radius:14px;min-height:77px;padding:14px 18px;display:flex;align-items:center;gap:13px}.mo-overview-icon{height:40px;width:40px;flex-shrink:0;border-radius:11px;background:#edf3e8;color:#315d3e;display:grid;place-items:center}.mo-overview small{font-size:9px;font-weight:800;letter-spacing:1.25px;color:#8b9c8f;display:block}.mo-overview strong{font-size:25px;font-weight:800;line-height:1.2;letter-spacing:-1px;color:#1a3828}.mo-overview strong em{font-size:16px;font-style:normal;color:#9db68b}.mo-overview .mo-overview-note{background:#eaf0e3;color:#52715a;justify-content:center;font-size:12px;font-weight:700;gap:10px}.mo-overview-note svg{margin-left:auto}.mo-overview-note .mo-live-dot{margin:0}

.mo-toolbar{margin-top:34px;scroll-margin-top:22px}.mo-toolbar-heading{align-items:center}.mo-toolbar h2{font-size:clamp(24px,2.6vw,33px);font-weight:800;letter-spacing:-1.25px;margin:6px 0 0}.mo-kicker{letter-spacing:1.9px;color:#688767}.mo-refresh{border-radius:10px;padding:10px 13px}

.mo-controls{margin-top:19px;gap:9px}.mo-search,.mo-select-wrap{border-radius:11px;box-shadow:0 2px 8px #15341e04}.mo-search input{height:47px;font-size:13px}.mo-select-wrap select{font-size:12px}.mo-filterbar{margin-top:13px;padding-bottom:17px;border-bottom:1px solid #e1e8df}.mo-tabs button{font-size:12px;padding:9px 15px;border-radius:9px}.mo-tabs button.active{background:#173e2c;box-shadow:0 4px 11px #143b2718}.mo-view-switch{background:#e9eee6}.mo-results-meta{margin:19px 0 13px}

.mo-cards{gap:13px;grid-template-columns:repeat(3,minmax(0,1fr))}.mo-card{position:relative;display:flex;flex-direction:column;padding:21px 21px 19px;border:1px solid #e5ebe4;border-radius:15px;box-shadow:0 3px 11px #1a352907;transition:transform .2s,box-shadow .2s,border-color .2s;overflow:hidden}.mo-card:before{content:"";position:absolute;left:0;top:0;width:100%;height:3px;background:linear-gradient(90deg,#7ea87d,#d4e5aa);opacity:0;transition:opacity .2s}.mo-card:hover{transform:translateY(-4px);border-color:#c6d8c4;box-shadow:0 17px 37px #1c3e2616}.mo-card:hover:before{opacity:1}.mo-type{font-size:10px;padding:7px 10px;border-radius:8px}.mo-open,.mo-replied{font-size:10px}.mo-card-rule{height:1px;background:linear-gradient(90deg,#e4ebe2,transparent);margin:17px 0 0}.mo-card h3{font-size:19px;line-height:1.23;letter-spacing:-.65px;margin:17px 0 10px;min-height:47px;font-weight:780}.mo-location{font-size:12px;color:#738778}.mo-details{margin-top:19px;gap:10px 16px;padding:15px 0}.mo-details>div{font-size:11px}.mo-card-bottom{margin-top:auto;padding-top:16px;align-items:center}.mo-budget small{font-size:9px}.mo-budget strong{font-size:18px;font-weight:800}.mo-hide{height:38px;width:38px;border-radius:10px;transition:background .2s,color .2s}.mo-hide:hover{background:#fbeee9;color:#a05241}.mo-offer-link{padding:12px 13px;border-radius:10px;background:#173f2d;transition:background .2s}.mo-offer-link:hover{background:#275d41}.mo-marketplace :is(button,a,input,select):focus-visible{outline:3px solid #96c777;outline-offset:3px}

.mo-hidden-section{border-radius:15px}.mo-hidden-row{border-radius:11px}.mo-footnote{margin-top:22px}

@media(max-width:1050px){.mo-overview{grid-template-columns:repeat(3,1fr)}.mo-overview-note{grid-column:1/-1}.mo-hero-art{width:48%;opacity:.75}.mo-hero-copy{max-width:560px}.mo-cards{grid-template-columns:repeat(2,minmax(0,1fr))}}

@media(max-width:690px){.mo-marketplace{padding:16px 13px 65px}.mo-topline>span{font-size:8px;letter-spacing:1px}.mo-hero{padding:30px 23px;min-height:277px;border-radius:16px}.mo-hero h1{font-size:38px;letter-spacing:-1.7px}.mo-hero-copy{max-width:100%}.mo-hero p{max-width:330px;font-size:12px}.mo-hero-art{right:-40%;width:90%;opacity:.22}.mo-hero-actions{gap:16px}.mo-overview{grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-top:8px}.mo-overview>div{min-height:77px;padding:11px 8px;gap:7px;border-radius:11px}.mo-overview-icon{width:30px;height:30px;border-radius:8px}.mo-overview-icon svg{width:15px}.mo-overview small{font-size:8px;letter-spacing:.2px}.mo-overview strong{font-size:22px}.mo-overview .mo-overview-note{grid-column:1/-1;min-height:43px;padding:10px 13px;font-size:11px}.mo-toolbar{margin-top:27px}.mo-toolbar h2{font-size:24px}.mo-refresh{font-size:11px}.mo-controls{flex-direction:column}.mo-search input{height:44px}.mo-select-wrap{height:44px}.mo-select-wrap select{flex:1}.mo-filterbar{flex-direction:column;align-items:stretch;gap:11px}.mo-tabs{display:grid;grid-template-columns:repeat(4,1fr);gap:3px}.mo-tabs button{padding:10px 3px;font-size:10px}.mo-view-switch{align-self:flex-start}.mo-results-meta span:last-child{display:none}.mo-cards{grid-template-columns:1fr;gap:10px}.mo-card{padding:19px}.mo-card h3{min-height:0;font-size:19px}.mo-card-bottom{margin-top:0}.mo-hidden-row{flex-direction:column;align-items:flex-start}.mo-hidden-row button{align-self:flex-end}}

@media(prefers-reduced-motion:reduce){.mo-marketplace *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}

/* ATELIER / refined compact visual language */

.mo-marketplace{--bg:#f3f5f0;--forest:#102b22;--green:#173e30;--lime:#d8efab;--line:#e1e8dd;background:linear-gradient(180deg,#f7f9f5 0,#f1f4ef 100%);padding-top:20px}

.mo-shell{max-width:1320px}

.mo-topline{margin-bottom:14px}.mo-topline a{font-weight:700;font-size:11px}.mo-topline>span{color:#648071}

.mo-hero{min-height:300px;border-radius:20px;padding:43px 48px;background:radial-gradient(ellipse at 75% 0%,#326d51 0,transparent 50%),linear-gradient(122deg,#0a251d 0%,#143d2d 63%,#28533b 100%);box-shadow:0 16px 45px #0b2c1d1b}

.mo-hero:after{content:"";position:absolute;inset:0;border:1px solid #ffffff20;border-radius:inherit;pointer-events:none}

.mo-hero h1{font-size:clamp(38px,4.5vw,64px);letter-spacing:-3px;max-width:700px}.mo-hero h1 em{font-style:normal;color:#d8edaa}

.mo-hero p{max-width:445px;font-size:13px;line-height:1.7}.mo-eyebrow{color:#c8e7a4}

.mo-hero-actions button{border:0;background:#e1f1b5;color:#17372a;font-weight:800}.mo-hero-actions button:hover{background:#f0facd}

.mo-art-sun{width:165px;height:165px;right:25%;top:21px;background:linear-gradient(155deg,#e8f5c6,#a6d39a);box-shadow:0 0 95px #c9ebaa42}

.mo-overview{gap:9px}.mo-overview>div{border-color:#e2e9df;box-shadow:0 3px 12px #152f2108}.mo-overview .mo-overview-note{background:#e7eddf;color:#43694e}

.mo-toolbar{margin-top:31px}.mo-toolbar-heading h2{font-size:clamp(25px,2.5vw,32px)}

.mo-search{background:#fff;border:1px solid #dce6dc}.mo-search:focus-within{border-color:#8cba87;box-shadow:0 0 0 3px #a5cfa329}.mo-select-wrap{background:#fff;border:1px solid #dce6dc}

.mo-tabs button.active{background:#153e2d}.mo-tabs button:not(.active):hover{background:#e8eee5}

.mo-cards{gap:12px}.mo-card{border-radius:16px;border-color:#e0e8de;box-shadow:0 5px 22px #193b2810;background:linear-gradient(180deg,#fff 0%,#fdfefb 100%)}

.mo-card:hover{transform:translateY(-3px);box-shadow:0 16px 38px #193b281a}.mo-card:before{height:4px;background:linear-gradient(90deg,#285c42,#c9e59b)}

.mo-card h3{font-size:19px;line-height:1.25;color:#172f22}.mo-type{font-weight:800}.mo-location{color:#647a6b}

.mo-details{border-top:1px solid #edf1eb;border-bottom:1px solid #edf1eb}.mo-budget strong{font-size:18px;color:#193e2a}.mo-offer-link{background:#153d2c;font-weight:800}.mo-offer-link:hover{background:#266547}

.mo-hide:hover{background:#f7ece7}.mo-hidden-section{box-shadow:0 8px 24px #193b2810}

@media(max-width:690px){.mo-marketplace{padding:14px 12px 55px}.mo-hero{min-height:290px;padding:31px 23px}.mo-hero h1{font-size:37px;letter-spacing:-1.9px}.mo-hero-art{right:-39%;opacity:.19}.mo-overview>div{padding:11px 8px}.mo-overview small{font-size:7.5px}.mo-overview strong{font-size:21px}.mo-card{padding:18px}.mo-card h3{font-size:18px}}

/* SIGNATURE DEMAND CARDS — editorial, compact, actionable */

.mo-cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;align-items:stretch}

.mo-card{--card-accent:#88a982;position:relative;isolation:isolate;display:flex;flex-direction:column;min-width:0;min-height:342px;padding:0!important;border:1px solid #dfe8dc!important;border-radius:20px!important;background:#fff!important;box-shadow:0 7px 26px #163b2510!important;overflow:hidden;transition:transform .22s ease,box-shadow .22s ease,border-color .22s ease}

.mo-card--accommodation{--card-accent:#a9b8a2}.mo-card--mixed{--card-accent:#d2b985}.mo-card--responded{--card-accent:#9eaf9d}

.mo-card:hover{transform:translateY(-5px);border-color:#b8d1b6!important;box-shadow:0 20px 46px #163b2522!important}

.mo-card:before{display:none!important}.mo-card-accent{height:5px;background:linear-gradient(90deg,#1c5039,var(--card-accent) 65%,#e8efd9);flex:none}

.mo-card-top{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:18px 21px 0;margin:0!important}

.mo-type{display:inline-flex;align-items:center;gap:7px;padding:7px 10px!important;border-radius:8px!important;background:#edf3e9!important;color:#315c3d!important;font-size:10px!important;letter-spacing:.4px;font-weight:800}

.mo-type-accommodation{background:#eff1eb!important;color:#546b50!important}.mo-type-mixed{background:#f8f2e5!important;color:#80663b!important}

.mo-open,.mo-replied{display:inline-flex;align-items:center;gap:6px;white-space:nowrap;font-size:10px!important;font-weight:800!important}

.mo-open{color:#4b8561}.mo-open i{height:7px;width:7px;border-radius:50%;background:#58ad70;box-shadow:0 0 0 3px #58ad701d}

.mo-replied{color:#3f6c50;background:#edf5ed;border-radius:100px;padding:7px 9px}

.mo-card-main{padding:18px 21px 0;min-height:115px}

.mo-card-main h3{margin:0 0 11px!important;min-height:0!important;font-size:clamp(19px,1.65vw,23px)!important;font-weight:800!important;line-height:1.19!important;letter-spacing:-.8px!important;color:#183527!important;overflow-wrap:anywhere;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden}

.mo-card-main .mo-location{display:flex;align-items:center;gap:7px;font-size:12px!important;font-weight:600;color:#728578!important;min-width:0}.mo-location span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

.mo-card-facts{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:9px 21px 0;padding:15px 0;border-top:1px solid #e9eee7;border-bottom:1px solid #e9eee7}

.mo-fact{display:flex;align-items:center;gap:9px;min-width:0}.mo-fact-icon{flex:none;width:34px;height:34px;border-radius:10px;background:#f1f5ed;display:grid;place-items:center;color:#4e7559}

.mo-fact>div{min-width:0}.mo-fact small{display:block;color:#95a398;font-size:9px;letter-spacing:.9px;font-weight:800;margin-bottom:4px}.mo-fact strong{display:block;color:#2d4535;font-size:11px;line-height:1.4;font-weight:750;overflow-wrap:anywhere}

.mo-card-bottom{margin-top:auto!important;padding:18px 21px 20px!important;display:flex;align-items:flex-end;justify-content:space-between;gap:8px;border:0!important;background:linear-gradient(180deg,#fff,#fbfdf9)}

.mo-budget{min-width:0}.mo-budget small{display:block;color:#889c8b!important;font-size:9px!important;letter-spacing:.8px;font-weight:800;margin-bottom:5px}.mo-budget strong{display:block;color:#173e2c!important;font-size:clamp(15px,1.5vw,19px)!important;line-height:1.2;font-weight:850!important;overflow-wrap:anywhere}

.mo-card-actions{display:flex;gap:7px;align-items:center;flex:none}.mo-hide{height:40px!important;width:40px!important;border-radius:11px!important;background:#eef3eb!important;color:#61796b!important;border:0!important;display:grid;place-items:center}.mo-hide:hover{background:#f8ebe7!important;color:#a45b4d!important}

.mo-offer-link{display:inline-flex;align-items:center;justify-content:center;gap:9px;white-space:nowrap;min-height:40px;padding:0 13px!important;border-radius:11px!important;background:#194a34!important;color:#fff!important;font-size:11px!important;font-weight:800!important;box-shadow:0 4px 12px #183d2c18}.mo-offer-link:hover{background:#2c6747!important}

@media(max-width:1130px){.mo-cards{grid-template-columns:repeat(2,minmax(0,1fr))}.mo-card-main{min-height:106px}}

@media(max-width:700px){.mo-cards{grid-template-columns:1fr;gap:12px}.mo-card{min-height:0}.mo-card-top{padding:16px 17px 0}.mo-card-main{padding:15px 17px 0;min-height:0}.mo-card-main h3{font-size:21px!important}.mo-card-facts{margin:16px 17px 0;padding:12px 0}.mo-card-bottom{padding:16px 17px 17px!important}.mo-budget strong{font-size:19px!important}.mo-offer-link{padding:0 14px!important}}

@media(max-width:370px){.mo-card-facts{gap:6px}.mo-fact{gap:6px}.mo-fact-icon{width:29px;height:29px}.mo-fact strong{font-size:10px}.mo-card-bottom{flex-wrap:wrap}.mo-card-actions{width:100%}.mo-offer-link{flex:1}}

`;
