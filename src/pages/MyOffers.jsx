import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";

const statuses = { pending: "Na čekanju", accepted: "Prihvaćena", rejected: "Odbijena", withdrawn: "Povučena" };
const tabs = [{ id: "all", label: "Sve ponude" }, { id: "pending", label: "Na čekanju" }, { id: "accepted", label: "Prihvaćene" }, { id: "rejected", label: "Odbijene" }, { id: "withdrawn", label: "Povučene" }];
const formatDate = (value) => value ? new Intl.DateTimeFormat("sr-Latn-RS", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value)) : "Po dogovoru";
const money = (value, currency = "RSD") => value == null ? "Po dogovoru" : `${Number(value).toLocaleString("sr-Latn-RS")} ${currency || "RSD"}`;
const Icon = ({ name, size = 18 }) => {
  const paths = {
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    left: <path d="M19 12H5m6-6-6 6 6 6" />,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    users: <><circle cx="9" cy="8" r="3" /><path d="M3 20v-2a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v2m1-15a3 3 0 0 1 0 6m1 2a5 5 0 0 1 4 5v2" /></>,
    send: <><path d="m22 2-7 20-4-9-9-4 20-7Z" /><path d="M22 2 11 13" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    close: <path d="M18 6 6 18M6 6l12 12" />,
    refresh: <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M18 9a7 7 0 0 0-12-2L4 9m2 6a7 7 0 0 0 12 2l2-2" /></>,
    layers: <><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M8 9h8M8 13h8M8 17h5" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.layers}</svg>;
};

export default function MyOffers() {
  const { user, isHost, loading: authLoading } = useAuth();
  const [offers, setOffers] = useState([]);
  const [details, setDetails] = useState({});
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(null);
  const [limit, setLimit] = useState(12);

  const load = useCallback(async () => {
    if (!user?.id || !isHost) { setLoading(false); return; }
    setLoading(true);
    setError("");
    try {
      const { data, error: e } = await supabase.from("adventure_intent_responses")
        .select("id,intent_id,host_id,message,proposed_price,currency,status,accepted_contact_phone,accepted_at,created_at,updated_at")
        .eq("host_id", user.id).order("created_at", { ascending: false }).limit(200);
      if (e) throw e;
      const rows = data || [];
      setOffers(rows);
      const uniqueIds = [...new Set(rows.map((r) => r.intent_id).filter(Boolean))];
      const resolved = {};
      // The host-safe RPC respects demand visibility and avoids exposing private user fields.
      for (let i = 0; i < uniqueIds.length; i += 8) {
        const batch = uniqueIds.slice(i, i + 8);
        const results = await Promise.all(batch.map((id) => supabase.rpc("get_host_adventure_demand", { p_intent_id: id })));
        results.forEach((result, j) => {
          if (!result.error && result.data) resolved[batch[j]] = Array.isArray(result.data) ? result.data[0] : result.data;
        });
      }
      setDetails(resolved);
    } catch (e) { setError(e.message || "Ponude trenutno nisu dostupne."); }
    finally { setLoading(false); }
  }, [user?.id, isHost]);

  useEffect(() => { if (!authLoading) load(); }, [authLoading, load]);
  const counts = useMemo(() => ({ all: offers.length, ...Object.fromEntries(Object.keys(statuses).map((s) => [s, offers.filter((o) => o.status === s).length])) }), [offers]);
  const filtered = useMemo(() => offers.filter((o) => {
    if (tab !== "all" && o.status !== tab) return false;
    const d = details[o.intent_id];
    return `${d?.activity || ""} ${d?.location_text || ""} ${o.message || ""}`.toLowerCase().includes(query.trim().toLowerCase());
  }), [offers, details, tab, query]);

  const withdraw = async (offer) => {
    if (!window.confirm("Želiš li da povučeš ovu ponudu?")) return;
    setBusy(offer.id);
    setError("");
    try {
      const { error: e } = await supabase.rpc("manage_adventure_offer", { p_response_id: offer.id, p_action: "withdraw" });
      if (e) throw e;
      await load();
    } catch (e) { setError(e.message || "Nije moguće povući ponudu."); }
    finally { setBusy(null); }
  };

  return <div className="mo-root">
    <style>{`
      .mo-root{--forest:#102c25;--deep:#09251f;--sage:#b5d5bc;--muted:#74877f;--border:#e2eae5;min-height:100vh;background:#f5f7f3;color:var(--forest);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;padding:34px 22px 80px}.mo-wrap{max-width:1220px;margin:auto}.mo-root *{box-sizing:border-box}.mo-root a{text-decoration:none;color:inherit}.mo-back{display:inline-flex;align-items:center;gap:8px;color:#647b70;font-size:13px;font-weight:700;margin-bottom:22px}.mo-hero{position:relative;overflow:hidden;background:linear-gradient(125deg,#102f27,#0b241f 75%);border-radius:25px;padding:38px 40px;color:#fff;box-shadow:0 22px 55px #102f2717}.mo-hero:before,.mo-hero:after{content:"";position:absolute;border:1px solid #ffffff16;border-radius:50%;width:400px;height:400px;right:-90px;top:-230px}.mo-hero:after{width:270px;height:270px;right:20px;top:-155px}.mo-eyebrow{display:flex;align-items:center;gap:8px;color:#b9dbc5;letter-spacing:2px;font-size:10px;font-weight:800;text-transform:uppercase}.mo-hero h1{font-size:clamp(30px,4vw,46px);letter-spacing:-1.9px;margin:13px 0 9px;font-weight:780;line-height:1.1}.mo-hero p{color:#bdd1c6;font-size:14px;max-width:510px;line-height:1.7;margin:0}.mo-hero-actions{display:flex;gap:10px;margin-top:24px;flex-wrap:wrap}.mo-hero-link{background:#d4e9d7;color:#123b2c!important;border-radius:11px;padding:12px 17px;font-size:13px;font-weight:800;display:inline-flex;gap:9px;align-items:center}.mo-hero-link.secondary{background:#ffffff13;color:#fff!important;border:1px solid #ffffff25}.mo-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:20px 0 25px}.mo-metric{border:1px solid var(--border);background:white;border-radius:16px;padding:19px 21px}.mo-metric span{font-size:11px;color:#81918a;font-weight:700}.mo-metric strong{display:block;font-size:29px;letter-spacing:-1.1px;margin-top:5px}.mo-panel{background:white;border:1px solid var(--border);border-radius:21px;padding:21px}.mo-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:20px}.mo-toolbar h2{font-size:19px;letter-spacing:-.5px;margin:0}.mo-search{border:1px solid #dce5df;border-radius:11px;background:#f9faf8;padding:11px 13px;font:inherit;font-size:13px;min-width:230px;outline:none}.mo-search:focus{border-color:#80a48f}.mo-tabs{display:flex;gap:7px;overflow-x:auto;padding-bottom:15px;margin-bottom:15px;border-bottom:1px solid var(--border)}.mo-tab{white-space:nowrap;border:1px solid transparent;background:transparent;color:#788980;padding:10px 13px;border-radius:9px;font-size:12px;font-weight:750;cursor:pointer}.mo-tab.active{background:#eaf3ec;color:#1c533b;border-color:#d5e8d9}.mo-tab b{font-size:11px;margin-left:6px;opacity:.7}.mo-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.mo-card{border:1px solid #e0e8e2;border-radius:18px;background:#fff;overflow:hidden;transition:transform .2s,border-color .2s,box-shadow .2s}.mo-card:hover{transform:translateY(-3px);border-color:#a8c9b0;box-shadow:0 15px 35px #183f2610}.mo-card-main{padding:21px 22px 16px}.mo-top{display:flex;justify-content:space-between;gap:10px;align-items:center}.mo-category{font-size:10px;font-weight:800;letter-spacing:1.2px;color:#628674;text-transform:uppercase}.mo-status{font-size:10px;font-weight:800;border-radius:100px;padding:7px 10px;background:#f1f3f1;color:#607269}.mo-status.pending{background:#fff5df;color:#92661c}.mo-status.accepted{background:#e5f5e9;color:#287146}.mo-status.rejected{background:#fceced;color:#ad5457}.mo-card h3{font-size:20px;line-height:1.3;letter-spacing:-.6px;margin:17px 0 9px}.mo-location{display:flex;align-items:center;gap:6px;color:#77877e;font-size:12px}.mo-facts{display:flex;gap:17px;flex-wrap:wrap;margin:18px 0;padding:14px 0;border-top:1px solid #edf0ed;border-bottom:1px solid #edf0ed;color:#526b5c;font-size:12px}.mo-facts span{display:inline-flex;gap:6px;align-items:center}.mo-message{color:#7a8880;font-size:12px;line-height:1.65;min-height:37px;margin:0 0 18px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.mo-price-row{display:flex;justify-content:space-between;align-items:end;gap:12px}.mo-price-label{font-size:10px;letter-spacing:.8px;color:#8b998f;font-weight:800;text-transform:uppercase}.mo-price{font-size:23px;font-weight:850;letter-spacing:-.8px;margin-top:5px}.mo-created{font-size:11px;color:#8a9b90}.mo-card-footer{padding:12px 21px;border-top:1px solid #e8eee9;background:#fbfcfa;display:flex;gap:8px;justify-content:space-between;align-items:center}.mo-open{display:inline-flex;gap:7px;align-items:center;color:#1e5137!important;font-size:12px;font-weight:800}.mo-withdraw{background:none;border:0;color:#a45555;font-weight:750;font-size:12px;cursor:pointer;padding:9px}.mo-contact{margin-top:13px;padding:10px 12px;background:#e9f4eb;border-radius:9px;color:#266440;font-size:12px;font-weight:700;overflow-wrap:anywhere}.mo-empty{text-align:center;padding:60px 15px;color:#6d8175}.mo-empty h3{color:#183e2d;margin-bottom:6px}.mo-error{background:#fff0ef;color:#a13d3d;border-radius:12px;padding:13px 16px;margin-bottom:16px;font-size:13px}.mo-more{display:block;margin:22px auto 0;background:#e7f1e9;color:#205337;border:0;padding:12px 23px;border-radius:10px;font-weight:800;cursor:pointer}.mo-refresh{border:1px solid #dce7de;background:#fff;border-radius:10px;padding:10px;cursor:pointer;color:#24513a;display:flex;align-items:center}.mo-skeleton{padding:60px;text-align:center;color:#6b8273}@media(max-width:800px){.mo-root{padding:20px 12px 65px}.mo-hero{padding:29px 23px;border-radius:20px}.mo-metrics{grid-template-columns:repeat(2,1fr)}.mo-grid{grid-template-columns:1fr}.mo-toolbar{align-items:stretch;flex-direction:column}.mo-search{min-width:0;width:100%}.mo-panel{padding:14px}.mo-metric{padding:15px}.mo-card-main{padding:19px}.mo-card-footer{padding:12px 19px}}
    `}</style>
    <div className="mo-wrap">
      <Link className="mo-back" to="/dashboard"><Icon name="left" size={16} /> Nazad na kontrolnu tablu</Link>
      <header className="mo-hero">
        <div className="mo-eyebrow"><Icon name="layers" size={15} /> MEETOUTDOORS / HOST CENTAR</div>
        <h1>Moje ponude<span style={{ color: "#a9d2b3" }}>.</span></h1>
        <p>Sve tvoje ponude na jednom mestu. Prati odgovore korisnika, upravljaj aktivnim ponudama i brzo se vrati na potražnje.</p>
        <div className="mo-hero-actions"><Link to="/marketplace" className="mo-hero-link"><Icon name="send" size={16} /> Pronađi nove potražnje</Link><Link to="/dashboard" className="mo-hero-link secondary">Host dashboard <Icon name="arrow" size={15} /></Link></div>
      </header>
      {authLoading || loading ? <div className="mo-skeleton">Učitavanje ponuda…</div> : !user || !isHost ? <div className="mo-panel" style={{ marginTop: 20 }}>Ova stranica dostupna je samo prijavljenim hostovima.</div> : <>
        <div className="mo-metrics">{[{ key: "all", title: "Ukupno ponuda" }, { key: "pending", title: "Na čekanju" }, { key: "accepted", title: "Prihvaćene" }, { key: "rejected", title: "Odbijene" }].map((item) => <div className="mo-metric" key={item.key}><span>{item.title}</span><strong>{counts[item.key] || 0}</strong></div>)}</div>
        {error && <div className="mo-error" role="alert">{error}</div>}
        <section className="mo-panel"><div className="mo-toolbar"><h2>Pregled ponuda</h2><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><input className="mo-search" value={query} onChange={(e) => { setQuery(e.target.value); setLimit(12); }} placeholder="Pretraži ponude…" aria-label="Pretraži ponude" /><button className="mo-refresh" onClick={load} title="Osveži ponude" aria-label="Osveži ponude"><Icon name="refresh" /></button></div></div>
          <div className="mo-tabs">{tabs.map((t) => <button key={t.id} className={`mo-tab ${tab === t.id ? "active" : ""}`} onClick={() => { setTab(t.id); setLimit(12); }}>{t.label}<b>{counts[t.id] || 0}</b></button>)}</div>
          {filtered.length === 0 ? <div className="mo-empty"><Icon name="layers" size={30} /><h3>Nema ponuda u ovom prikazu</h3><p>Promeni filter ili pogledaj dostupne potražnje.</p><Link className="mo-hero-link" to="/marketplace">Istraži potražnje <Icon name="arrow" size={15} /></Link></div> : <><div className="mo-grid">{filtered.slice(0, limit).map((offer) => {
            const d = details[offer.intent_id];
            const title = d?.activity || (d?.intent_type === "accommodation" ? "Potražnja za smeštajem" : "Potražnja");
            const canWithdraw = offer.status === "pending" && d?.status === "open";
            return <article className="mo-card" key={offer.id}><div className="mo-card-main"><div className="mo-top"><span className="mo-category">{d?.intent_type === "accommodation" ? "SMEŠTAJ" : d?.intent_type === "mixed" ? "KOMBINOVANO" : "AVANTURA"}</span><span className={`mo-status ${offer.status}`}>{statuses[offer.status] || offer.status}</span></div><h3>{title}</h3><div className="mo-location"><Icon name="pin" size={15} />{d?.location_text || "Lokacija nije dostupna"}</div><div className="mo-facts"><span><Icon name="calendar" size={15} />{formatDate(d?.start_date)}</span>{d?.people_count != null && <span><Icon name="users" size={15} />{d.people_count} osoba</span>}</div><p className="mo-message">{offer.message || "Ponuda je poslata bez dodatne poruke."}</p><div className="mo-price-row"><div><div className="mo-price-label">Tvoja ponuda</div><div className="mo-price">{money(offer.proposed_price, offer.currency)}</div></div><span className="mo-created">Poslato {formatDate(offer.created_at)}</span></div>{offer.status === "accepted" && offer.accepted_contact_phone && <div className="mo-contact">Kontakt korisnika: <a href={`tel:${offer.accepted_contact_phone}`}>{offer.accepted_contact_phone}</a></div>}</div><div className="mo-card-footer"><Link className="mo-open" to={`/host/demand/${offer.intent_id}`}>Detalji ponude <Icon name="arrow" size={16} /></Link>{canWithdraw && <button className="mo-withdraw" disabled={busy === offer.id} onClick={() => withdraw(offer)}>{busy === offer.id ? "Povlačenje…" : "Povuci ponudu"}</button>}</div></article>;
          })}</div>{filtered.length > limit && <button className="mo-more" onClick={() => setLimit((n) => n + 12)}>Prikaži još ponuda</button>}</>}
        </section>
      </>}
    </div>
  </div>;
}
