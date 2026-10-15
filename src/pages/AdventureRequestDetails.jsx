import React, { useCallback, useEffect, useMemo, useState } from "react";

import { Link, useNavigate, useParams } from "react-router-dom";

import { supabase } from "../supabaseClient";

import { useAuth } from "../context/AuthContext";

function Icon({ name, size = 20, strokeWidth = 2 }) {

  const icons = {

    arrowLeft: <><path d="M19 12H5"/><path d="m11 18-6-6 6-6"/></>,

    arrowRight: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,

    sparkle: <><path d="m12 3 1.1 3.3L16 8l-2.9 1.7L12 13l-1.1-3.3L8 8l2.9-1.7L12 3Z"/><path d="m18 14 .7 2.3L21 17l-2.3.7L18 20l-.7-2.3L15 17l2.3-.7L18 14Z"/></>,

    mapPin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,

    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,

    users: <><circle cx="9" cy="8" r="3"/><path d="M3 20v-2a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v2"/><path d="M16 4.5a3 3 0 0 1 0 6M17 13a5 5 0 0 1 4 5v2"/></>,

    wallet: <><rect x="3" y="6" width="18" height="14" rx="3"/><path d="M3 9h15M16 13h5"/></>,

    mountain: <><path d="m3 20 6.2-10 3.2 4.8L15.8 9 21 20Z"/><path d="m7.5 13 1.7 1.6 1.4-1.2"/></>,

    check: <path d="m5 12 4 4L19 6"/>,

    x: <><path d="m6 6 12 12M18 6 6 18"/></>,

    shield: <><path d="M12 3 5 6v5c0 4.6 2.9 8.4 7 10 4.1-1.6 7-5.4 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/></>,

    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,

    package: <><path d="m12 3 8 4-8 4-8-4 8-4Z"/><path d="m4 7 8 4 8-4M4 12l8 4 8-4M4 17l8 4 8-4"/></>,

    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,

    alert: <><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></>,

    phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.8 2.1Z"/>,

  };

  return (

    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"

      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">

      {icons[name]}

    </svg>

  );

}

const money = (value, currency = "RSD") => {

  if (value === null || value === undefined || value === "") return "Po dogovoru";

  const n = Number(value);

  if (!Number.isFinite(n)) return `${value} ${currency}`;

  try {

    return new Intl.NumberFormat("sr-Latn-RS", {

      style: "currency", currency: currency || "RSD", maximumFractionDigits: 0

    }).format(n);

  } catch {

    return `${n.toLocaleString("sr-Latn-RS")} ${currency || "RSD"}`;

  }

};

const dateText = (value) => {

  if (!value) return "Fleksibilno";

  const d = new Date(`${value}T12:00:00`);

  return Number.isNaN(d.getTime())

    ? value

    : new Intl.DateTimeFormat("sr-Latn-RS", { day: "2-digit", month: "short", year: "numeric" }).format(d);

};

const difficultyText = (value) =>

  ({ easy: "Lako", medium: "Srednje", hard: "Teško" }[value] || value || "Nije navedeno");

function isCurrentPending(offer, request) {

  return Boolean(request?.status === "open" && offer?.status === "pending" &&

    Number(offer.intent_revision) === Number(request.revision));

}

function Avatar({ host }) {

  const label = (host?.full_name || host?.username || "H").trim();

  if (host?.avatar_url) return <img className="hostAvatar" src={host.avatar_url} alt={label} />;

  return <span className="hostAvatar avatarFallback">{label.charAt(0).toUpperCase()}</span>;

}

function StatusPill({ status }) {

  const labels = {

    pending: "Čeka tvoju odluku",

    accepted: "Prihvaćena",

    rejected: "Odbijena",

    withdrawn: "Povučena",

  };

  return <span className={`offerStatus ${status || "pending"}`}>{labels[status] || status}</span>;

}

export default function AdventureRequestDetails() {

  const { id } = useParams();

  const navigate = useNavigate();

  const { user, loading: authLoading } = useAuth();

  const [request, setRequest] = useState(null);

  const [offers, setOffers] = useState([]);

  const [hosts, setHosts] = useState({});

  const [packages, setPackages] = useState({});

  const [events, setEvents] = useState({});

  const [loading, setLoading] = useState(true);

  const [actingId, setActingId] = useState(null);

  const [error, setError] = useState("");

  const [notice, setNotice] = useState("");

  const [acceptingOffer, setAcceptingOffer] = useState(null);

  const [contactPhone, setContactPhone] = useState("");

  const [contactConsent, setContactConsent] = useState(false);
  const [acceptError, setAcceptError] = useState("");

  const [editMode, setEditMode] = useState(false);

  const [editForm, setEditForm] = useState({});

  const [savingRequest, setSavingRequest] = useState(false);

  const [sortMode, setSortMode] = useState("recommended");

  const [selectedForCompare, setSelectedForCompare] = useState([]);

  const [compareOpen, setCompareOpen] = useState(false);
  const [previewOfferId, setPreviewOfferId] = useState(null);

  const loadData = useCallback(async () => {

    if (!id || !user?.id) return;

    setLoading(true);

    setError("");

    try {

      const { data: intent, error: intentError } = await supabase

        .from("adventure_intents")

        .select("id,user_id,activity,location_text,start_date,end_date,people_count,budget_per_person,currency,difficulty,has_car,notes,intent_type,revision,status,created_at")

        .eq("id", id)

        .eq("user_id", user.id)

        .single();

      if (intentError) throw intentError;

      const { data: responseRows, error: responseError } = await supabase

        .from("adventure_intent_responses")

        .select("id,intent_id,host_id,message,proposed_price,currency,package_id,event_id,intent_revision,status,accepted_contact_phone,accepted_at,created_at,updated_at")

        .eq("intent_id", id)

        .order("created_at", { ascending: true });

      if (responseError) throw responseError;

      const rows = responseRows || [];

      const hostIds = [...new Set(rows.map((r) => r.host_id).filter(Boolean))];

      const packageIds = [...new Set(rows.map((r) => r.package_id).filter(Boolean))];

      const eventIds = [...new Set(rows.map((r) => r.event_id).filter((v) => v !== null && v !== undefined))];

      let hostMap = {};

      if (hostIds.length) {

        const { data: hostRows, error: hostError } = await supabase

          .from("profiles")

          .select("id,full_name,username,avatar_url,city,country,bio,is_verified,phone,instagram_url,website_url")

          .in("id", hostIds);

        if (hostError) throw hostError;

        hostMap = Object.fromEntries((hostRows || []).map((h) => [h.id, h]));

      }

      let packageMap = {};

      if (packageIds.length) {

        const { data: packageRows, error: packageError } = await supabase

          .from("packages")

          .select("id,title,slug,price,currency,image_url,cover_url,city,country,duration_text,duration,is_active")

          .in("id", packageIds);

        if (packageError) throw packageError;

        packageMap = Object.fromEntries((packageRows || []).map((p) => [p.id, p]));

      }

      let eventMap = {};

      if (eventIds.length) {

        const { data: eventRows, error: eventError } = await supabase

          .from("events")

          .select("id,host_id,title,description,location,country,cover_url,price,start_date,end_date,is_active")

          .in("id", eventIds);

        if (eventError) throw eventError;

        eventMap = Object.fromEntries((eventRows || []).map((item) => [String(item.id), item]));

      }

      setRequest(intent);

        setEditForm({

          activity: intent.activity || "", location_text: intent.location_text || "",

          start_date: intent.start_date || "", end_date: intent.end_date || "",

          people_count: intent.people_count || 1,

          budget_per_person: intent.budget_per_person ?? "",

          currency: intent.currency || "RSD", difficulty: intent.difficulty || "",

          has_car: intent.has_car === null ? "" : String(intent.has_car),

          notes: intent.notes || "", intent_type: intent.intent_type || "adventure"

        });

      setOffers(rows);

      setHosts(hostMap);

      setPackages(packageMap);

      setEvents(eventMap);

    } catch (e) {

      console.error("Adventure request load error:", e);

      setError(e.message || "Zahtev trenutno nije moguće učitati.");

    } finally {

      setLoading(false);

    }

  }, [id, user?.id]);

  useEffect(() => {

    if (authLoading) return;

    if (!user) {

      navigate("/login", { replace: true });

      return;

    }

    loadData();

  }, [authLoading, user, navigate, loadData]);

  const dates = useMemo(() => {

    if (!request) return "Fleksibilno";

    if (request.start_date && request.end_date && request.start_date !== request.end_date) {

      return `${dateText(request.start_date)} — ${dateText(request.end_date)}`;

    }

    return dateText(request.start_date || request.end_date);

  }, [request]);

  const acceptedOffer = useMemo(

    () => offers.find((offer) => offer.status === "accepted") || null,

    [offers]

  );

  const sortedOffers = useMemo(() => {

    const priority = { accepted: 0, pending: 1, rejected: 2, withdrawn: 3 };

    return [...offers].sort((a, b) => {

      if (sortMode === "priceLow" || sortMode === "priceHigh") {

        const aPrice = a.proposed_price == null ? null : Number(a.proposed_price);

        const bPrice = b.proposed_price == null ? null : Number(b.proposed_price);

        if (aPrice === null && bPrice !== null) return 1;

        if (bPrice === null && aPrice !== null) return -1;

        if (aPrice !== null && bPrice !== null && a.currency === b.currency && aPrice !== bPrice) {

          return sortMode === "priceLow" ? aPrice - bPrice : bPrice - aPrice;

        }

      }

      if (sortMode === "newest") return new Date(b.created_at) - new Date(a.created_at);

      return (priority[a.status] ?? 4) - (priority[b.status] ?? 4) || new Date(b.created_at) - new Date(a.created_at);

    });

  }, [offers, sortMode]);

  function toggleCompare(offerId) {

    setSelectedForCompare((current) => current.includes(offerId)

      ? current.filter((id) => id !== offerId)

      : current.length < 3 ? [...current, offerId] : current);

  }

  const compareOffers = selectedForCompare.map((offerId) => offers.find((offer) => offer.id === offerId)).filter(Boolean);

  function openAcceptModal(offer) {
    setAcceptError("");

    if (!offer || actingId || !isCurrentPending(offer, request)) return;

    setError("");

    setNotice("");

    setAcceptingOffer(offer);

    setContactPhone("");

    setContactConsent(false);

  }

  function closeAcceptModal() {
    setAcceptError("");

    if (actingId) return;

    setAcceptingOffer(null);

    setContactPhone("");

    setContactConsent(false);

  }

  async function decide(responseId, action, phone = null) {

    if (!responseId || actingId) return;

    const selectedOffer = offers.find((item) => item.id === responseId);

    if (!isCurrentPending(selectedOffer, request)) {

      setError("Ova ponuda više nije aktivna za trenutnu verziju zahteva. Osveži stranicu.");
      if (action === "accept") setAcceptError("Ponuda više nije aktivna. Osveži stranicu.");

      return;

    }

    const isAccept = action === "accept";

    const cleanPhone = isAccept ? String(phone || "").trim() : null;

    if (isAccept) {

      if (cleanPhone.length < 6 || cleanPhone.length > 30) {

        setAcceptError("Unesi broj telefona od 6 do 30 karaktera.");

        return;

      }

      if (!contactConsent) {

        setAcceptError("Označi saglasnost za deljenje broja telefona.");

        return;

      }

    }

    setActingId(responseId);
    setAcceptError("");

    setError("");

    setNotice("");

    try {

      const params = {

        p_response_id: responseId,

        p_action: action,

      };

      if (isAccept) {

        params.p_contact_phone = cleanPhone;

      }

      const { data: rpcResult, error: rpcError } = await supabase.rpc(
        "respond_to_adventure_offer",
        params
      );
      if (rpcError) throw rpcError;

      // PostgREST may return a business-level failure without an HTTP error.
      const result = Array.isArray(rpcResult) ? rpcResult[0] : rpcResult;
      if (result === false || (result && typeof result === "object" &&
          (result.success === false || result.ok === false || result.error))) {
        throw new Error(
          (result && (result.message || result.error || result.reason)) ||
          "Baza nije potvrdila ovu akciju. Proveri da li je ponuda još aktivna."
        );
      }

      // Confirm the actual persisted status, not just that the RPC returned HTTP 200.
      const { data: verifiedOffer, error: verifyError } = await supabase
        .from("adventure_intent_responses")
        .select("id,status")
        .eq("id", responseId)
        .single();
      if (verifyError) throw new Error(
        "Nije moguće proveriti rezultat u bazi: " + verifyError.message
      );
      const expectedStatus = isAccept ? "accepted" : "rejected";
      if (verifiedOffer?.status !== expectedStatus) {
        console.error("Offer RPC returned without status change", {
          responseId, action, rpcResult, verifiedOffer
        });
        throw new Error(
          `Ponuda nije promenila status (trenutno: ${verifiedOffer?.status || "nepoznat"}). ` +
          "Supabase funkcija je završila poziv, ali nije izvršila prihvatanje. " +
          "Proveri funkciju respond_to_adventure_offer u bazi."
        );
      }

      setAcceptingOffer(null);
      setContactPhone("");
      setContactConsent(false);
      await loadData();
      setNotice(isAccept
        ? "Ponuda je prihvaćena. Kontakt je prosleđen izabranom domaćinu."
        : "Ponuda je odbijena.");

    } catch (e) {

      console.error("Adventure offer decision error:", e);
      if (isAccept) setAcceptError(e.message || "Prihvatanje nije uspelo. Pokušaj ponovo.");

      setError(

        e.message || "Akcija trenutno nije mogla da bude izvršena."

      );

    } finally {

      setActingId(null);

    }

  }

  async function manageRequest(action) {

    if (savingRequest || !request || request.status !== "open") return;

    if (action === "delete" && !window.confirm("Trajno obrisati potražnju i sve primljene ponude?")) return;

    if (action === "close" && !window.confirm("Zatvoriti potražnju? Nove ponude više neće biti moguće.")) return;

    setSavingRequest(true); setError(""); setNotice("");

    try {

      if (action === "edit") {

        const unchanged =

          (editForm.activity || "").trim() === (request.activity || "") &&

          (editForm.location_text || "").trim() === (request.location_text || "") &&

          (editForm.start_date || "") === (request.start_date || "") &&

          (editForm.end_date || "") === (request.end_date || "") &&

          Number(editForm.people_count || 1) === Number(request.people_count || 1) &&

          (editForm.budget_per_person === "" ? null : Number(editForm.budget_per_person)) === (request.budget_per_person == null ? null : Number(request.budget_per_person)) &&

          (editForm.currency || "RSD") === (request.currency || "RSD") &&

          (editForm.difficulty || "") === (request.difficulty || "") &&

          (editForm.has_car === "" ? null : editForm.has_car === "true") === (request.has_car ?? null) &&

          (editForm.notes || "").trim() === (request.notes || "") &&

          (editForm.intent_type || "adventure") === (request.intent_type || "adventure");

        if (unchanged) { setNotice("Nema izmena za čuvanje."); setEditMode(false); return; }

        if (!editForm.activity.trim()) { setError("Unesi naziv aktivnosti."); return; }

        if (editForm.start_date && editForm.end_date && editForm.end_date < editForm.start_date) { setError("Datum završetka ne može biti pre početka."); return; }

        if (!window.confirm("Izmena zahteva može poništiti postojeće ponude. Želiš li da nastaviš?")) return;

      }

      const params = { p_intent_id: id, p_action: action };

      if (action === "edit") Object.assign(params, {

        p_activity: editForm.activity.trim(),

        p_location_text: editForm.location_text.trim() || null,

        p_start_date: editForm.start_date || null,

        p_end_date: editForm.end_date || null,

        p_people_count: Number(editForm.people_count) || 1,

        p_budget_per_person: editForm.budget_per_person === "" ? null : Number(editForm.budget_per_person),

        p_currency: editForm.currency || "RSD",

        p_difficulty: editForm.difficulty || null,

        p_has_car: editForm.has_car === "" ? null : editForm.has_car === "true",

        p_notes: editForm.notes.trim() || null,

        p_intent_type: editForm.intent_type || "adventure"

      });

      const { error: e } = await supabase.rpc("manage_adventure_demand", params);

      if (e) throw e;

      if (action === "delete") { navigate("/agent", { replace: true }); return; }

      setEditMode(false);

      await loadData();

      setNotice(action === "edit" ? "Potražnja je izmenjena. Prethodne ponude možda više nisu važeće." : "Potražnja je zatvorena.");

    } catch (e) { setError(e.message || "Akcija nije uspela."); }

    finally { setSavingRequest(false); }

  }

  if (authLoading || loading) {

    return (

      <>

        <Styles />

        <main className="requestPage loadingPage">

          <div className="loadingCard">

            <span className="spinner" />

            <h1>Učitavamo tvoje ponude</h1>

            <p>Agent priprema odgovore domaćina.</p>

          </div>

        </main>

      </>

    );

  }

  if (error && !request) {

    return (

      <>

        <Styles />

        <main className="requestPage">

          <div className="shell">

            <button className="backBtn" onClick={() => navigate(-1)} type="button">

              <Icon name="arrowLeft" size={17}/> Nazad

            </button>

            <section className="emptyFatal">

              <span><Icon name="alert" size={27}/></span>

              <small>Zahtev nije dostupan</small>

              <h1>Ne možemo da otvorimo ovu potražnju.</h1>

              <p>{error}</p>

              <Link to="/notifications">Otvori obaveštenja <Icon name="arrowRight" size={16}/></Link>

            </section>

          </div>

        </main>

      </>

    );

  }

  return (

    <>

      <Styles />

      <main className="requestPage">

        <div className="shell">

          <button className="backBtn" onClick={() => navigate(-1)} type="button">

            <Icon name="arrowLeft" size={17}/> Nazad

          </button>

          <section className="hero">

            <div className="heroTop">

              <span className="agentBadge"><Icon name="sparkle" size={15}/> MeetOutdoors Agent</span>

              <span className={`requestStatus ${request?.status || "open"}`}>

                <span />

                {request?.status === "matched" ? "Ponuda izabrana" :

                 request?.status === "closed" ? "Zatvoreno" :

                 request?.status === "cancelled" ? "Otkazano" : "Potraga aktivna"}

              </span>

            </div>

            <div className="heroContent">

              <div>

                <span className="kicker light">Tvoja outdoor potražnja</span>

                <h1>{request?.activity || "Avantura"}</h1>

                <p>

                  Domaćini koji mogu da ispune tvoj zahtev šalju konkretne ponude.

                  Uporedi ih i izaberi onu koja ti najviše odgovara.

                </p>

              </div>

              <div className="offerCount">

                <strong>{offers.length}</strong>

                <span>{offers.length === 1 ? "ponuda" : "ponude"}</span>

                <small>od relevantnih domaćina</small>

              </div>

            </div>

          </section>

          {request?.status === "open" && (

            <section className="moRequestTools">

              <div><strong>Upravljanje potražnjom</strong><span>Izmeni uslove ili zatvori zahtev kada više ne tražiš ponude.</span></div>

              <div className="moRequestButtons">

                <button type="button" onClick={() => setEditMode((v) => !v)}>{editMode ? "Odustani" : "Uredi"}</button>

                <button type="button" disabled={savingRequest} onClick={() => manageRequest("close")}>Zatvori</button>

                <button type="button" className="danger" disabled={savingRequest} onClick={() => manageRequest("delete")}>Obriši</button>

              </div>

            </section>

          )}

          {editMode && request?.status === "open" && (

            <form className="moEditRequest" onSubmit={(e) => { e.preventDefault(); manageRequest("edit"); }}>

              <label>Vrsta zahteva<select value={editForm.intent_type} onChange={(e) => setEditForm({ ...editForm, intent_type: e.target.value })}><option value="adventure">Avantura</option><option value="accommodation">Smeštaj</option><option value="mixed">Kombinovano</option></select></label>

              <label>Aktivnost / naslov<input required value={editForm.activity} onChange={(e) => setEditForm({ ...editForm, activity: e.target.value })}/></label>

              <label>Lokacija<input value={editForm.location_text} onChange={(e) => setEditForm({ ...editForm, location_text: e.target.value })}/></label>

              <label>Broj osoba<input type="number" min="1" required value={editForm.people_count} onChange={(e) => setEditForm({ ...editForm, people_count: e.target.value })}/></label>

              <label>Od datuma<input type="date" value={editForm.start_date} onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })}/></label>

              <label>Do datuma<input type="date" min={editForm.start_date || undefined} value={editForm.end_date} onChange={(e) => setEditForm({ ...editForm, end_date: e.target.value })}/></label>

              <label>Budžet po osobi<input type="number" min="0" value={editForm.budget_per_person} onChange={(e) => setEditForm({ ...editForm, budget_per_person: e.target.value })}/></label>

              <label>Valuta<select value={editForm.currency} onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })}><option value="RSD">RSD</option><option value="EUR">EUR</option><option value="USD">USD</option></select></label>

              <label>Težina<select value={editForm.difficulty} onChange={(e) => setEditForm({ ...editForm, difficulty: e.target.value })}><option value="">Nije navedeno</option><option value="easy">Lako</option><option value="medium">Srednje</option><option value="hard">Teško</option></select></label>

              <label>Imam prevoz<select value={editForm.has_car} onChange={(e) => setEditForm({ ...editForm, has_car: e.target.value })}><option value="">Nije navedeno</option><option value="true">Da</option><option value="false">Ne</option></select></label>

              <label className="moEditWide">Napomene<textarea rows="3" value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}/></label>

              <button className="moEditSave" type="submit" disabled={savingRequest}>{savingRequest ? "Čuvam..." : "Sačuvaj izmene"}</button>

            </form>

          )}

          <section className="summaryPanel">

            <div className="summaryItem"><span><Icon name="mapPin" size={18}/></span><div><small>Lokacija</small><strong>{request?.location_text || "Nije navedeno"}</strong></div></div>

            <div className="summaryItem"><span><Icon name="calendar" size={18}/></span><div><small>Termin</small><strong>{dates}</strong></div></div>

            <div className="summaryItem"><span><Icon name="users" size={18}/></span><div><small>Osobe</small><strong>{request?.people_count || 1}</strong></div></div>

            <div className="summaryItem"><span><Icon name="wallet" size={18}/></span><div><small>Tvoj budžet / osobi</small><strong>{money(request?.budget_per_person, request?.currency)}</strong></div></div>

            <div className="summaryItem"><span><Icon name="mountain" size={18}/></span><div><small>Težina</small><strong>{difficultyText(request?.difficulty)}</strong></div></div>

          </section>

          {notice && <div className="notice"><Icon name="check" size={17}/><span>{notice}</span></div>}

          {error && request && <div className="errorBox"><Icon name="alert" size={17}/><span>{error}</span></div>}

          <section className="contentGrid">

            <div className="offersColumn">

              <div className="sectionHead">

                <div>

                  <span className="kicker">Odgovori domaćina</span>

                  <h2>{acceptedOffer ? "Tvoja izabrana ponuda." : "Izaberi ko te vodi napolje."}</h2>

                </div>

                <span className="privacy"><Icon name="shield" size={15}/> Ti odlučuješ</span>

              </div>

              {offers.length > 0 && (

                  <div className="compareToolbar">

                    <div><strong>Pristigle ponude</strong><span>Označi 2 ili 3 ponude za uporedni pregled.</span></div>

                    <div className="compareControls">

                      <label>Sortiranje <select value={sortMode} onChange={(event) => setSortMode(event.target.value)}>

                        <option value="recommended">Preporučeni redosled</option>

                        <option value="newest">Najnovije</option>

                        <option value="priceLow">Niža cena prvo*</option>

                        <option value="priceHigh">Viša cena prvo*</option>

                      </select></label>

                      <button type="button" disabled={compareOffers.length < 2} onClick={() => setCompareOpen(true)}>Uporedi ({compareOffers.length}/3)</button>

                    </div>

                    {(sortMode === "priceLow" || sortMode === "priceHigh") && <small>* Cene u različitim valutama se ne preračunavaju.</small>}

                  </div>

                )}

                {!offers.length ? (

                <div className="noOffers">

                  <span><Icon name="clock" size={25}/></span>

                  <h3>Još nema ponuda.</h3>

                  <p>Relevantni domaćini su obavešteni. Kada neko pošalje ponudu, pojaviće se ovde.</p>

                </div>

              ) : (

                <div className="offerList">

                  {sortedOffers.map((offer) => {

                    const host = hosts[offer.host_id] || {};

                    const pkg = offer.package_id ? packages[offer.package_id] : null;

                    const accepted = offer.status === "accepted";

                    const pending = isCurrentPending(offer, request);

                    const stale = offer.status === "pending" && !pending;

                    const evt = offer.event_id ? events[String(offer.event_id)] : null;

                    const hostName = host.full_name || host.username || "Outdoor domaćin";

                    return (

                      <article key={offer.id} className={`offerCard ${accepted ? "chosen" : ""} ${offer.status || ""}`}>

                        {accepted && <div className="chosenRibbon"><Icon name="check" size={14}/> Izabrana ponuda</div>}

                        <label className="compareChoice">

                            <input type="checkbox" checked={selectedForCompare.includes(offer.id)} onChange={() => toggleCompare(offer.id)} disabled={!selectedForCompare.includes(offer.id) && selectedForCompare.length >= 3}/>

                            <span>Uporedi ovu ponudu</span>

                          </label>

                          <div className="offerHeader">

                          <div className="hostIdentity">

                            <Avatar host={host}/>

                            <div>

                              <div className="hostNameLine">

                                <h3>{hostName}</h3>

                                {host.is_verified && <span className="verified"><Icon name="check" size={11}/></span>}

                              </div>

                              <p>{[host.city, host.country].filter(Boolean).join(", ") || "MeetOutdoors domaćin"}</p>

                            </div>

                          </div>

                          <StatusPill status={offer.status}/>

                        </div>

                        <div className="moHostInsights">
                          {host.bio && <p className="moHostBio">{host.bio.length > 220 ? `${host.bio.slice(0, 220)}…` : host.bio}</p>}
                          <div className="moHostFacts">
                            {host.is_verified && <span>✓ Verifikovan domaćin</span>}
                            {host.city && <span>⌖ {host.city}{host.country ? `, ${host.country}` : ""}</span>}
                            {host.website_url && <a href={host.website_url} target="_blank" rel="noopener noreferrer">Veb-sajt ↗</a>}
                            {host.instagram_url && <a href={host.instagram_url} target="_blank" rel="noopener noreferrer">Instagram ↗</a>}
                          </div>
                        </div>
                        <button className="moOfferPreviewBtn" type="button" onClick={() => setPreviewOfferId(offer.id)}>Pregled cele ponude ↗</button>
                        <div className="priceBlock">

                          <small>Ponuda</small>

                          <strong>{money(offer.proposed_price, offer.currency)}</strong>

                          {offer.proposed_price !== null && offer.proposed_price !== undefined && <span>po osobi</span>}

                        </div>

                        {offer.message && (

                          <div className="messageBox">

                            <span><Icon name="sparkle" size={16}/></span>

                            <p>{offer.message}</p>

                          </div>

                        )}

                          {evt && (

                            <Link className="packageCard" to={`/event/${evt.id}`}>

                              <div className="packageImage">

                                {evt.cover_url ? <img src={evt.cover_url} alt={evt.title} /> : <span><Icon name="mountain" size={22}/></span>}

                              </div>

                              <div className="packageCopy">

                                <small>Povezan događaj</small>

                                <strong>{evt.title}</strong>

                                <span>{[evt.location, evt.country].filter(Boolean).join(", ")}</span>

                              </div>

                              <Icon name="arrowRight" size={17}/>

                            </Link>

                          )}

                          {stale && <div className="moStaleOffer">Ova ponuda je za prethodnu verziju zahteva i ne može se prihvatiti.</div>}

                        {pkg && (

                          <Link className="packageCard" to={pkg.slug ? `/paketi/${pkg.slug}` : `/package/${pkg.id}`}>

                            <div className="packageImage">

                              {pkg.cover_url || pkg.image_url

                                ? <img src={pkg.cover_url || pkg.image_url} alt={pkg.title}/>

                                : <span><Icon name="package" size={22}/></span>}

                            </div>

                            <div className="packageCopy">

                              <small>Povezan paket</small>

                              <strong>{pkg.title}</strong>

                              <span>{[pkg.city, pkg.country].filter(Boolean).join(", ")}</span>

                            </div>

                            <Icon name="arrowRight" size={17}/>

                          </Link>

                        )}

                        <div className="offerActions">

                          {host.username && (

                            <Link className="profileBtn" to={`/h/${host.username}`}>

                              <Icon name="user" size={16}/> Pogledaj domaćina

                            </Link>

                          )}

                          {pending && request?.status === "open" && (

                            <>

                              <button className="rejectBtn" type="button" disabled={Boolean(actingId)}

                                onClick={() => decide(offer.id, "reject")}>

                                <Icon name="x" size={16}/>

                                {actingId === offer.id ? "Obrađujem..." : "Odbij"}

                              </button>

                              <button className="acceptBtn" type="button" disabled={Boolean(actingId)}

                                onClick={() => openAcceptModal(offer)}>

                                <Icon name="check" size={17}/>

                                {actingId === offer.id ? "Obrađujem..." : "Prihvati ponudu"}

                              </button>

                            </>

                          )}

                        </div>

                        {accepted && (

                          <div className="contactArea">

                            <div>

                              <span className="kicker">Sledeći korak</span>

                              <strong>Nastavite dogovor.</strong>

                              <p>Ponuda je prihvaćena. Kontakt i javni profil domaćina su ti sada pri ruci.</p>

                            </div>

                            <div className="contactActions">

                              {host.phone && <a href={`tel:${host.phone}`}><Icon name="phone" size={15}/> Pozovi</a>}

                              {host.username && <Link to={`/h/${host.username}`}>Profil <Icon name="arrowRight" size={15}/></Link>}

                            </div>

                          </div>

                        )}

                      </article>

                    );

                  })}

                </div>

              )}

            </div>

            <aside className="sideColumn">

              <div className="sideCard">

                <span className="kicker">Kako da izabereš</span>

                <h3>Ne gledaj samo cenu.</h3>

                <div className="tips">

                  <div><span>01</span><p>Pročitaj šta domaćin konkretno nudi.</p></div>

                  <div><span>02</span><p>Otvori profil i proveri iskustvo domaćina.</p></div>

                  <div><span>03</span><p>Izaberi ponudu koja ti daje najviše poverenja.</p></div>

                </div>

              </div>

              <div className="safeCard">

                <span><Icon name="shield" size={20}/></span>

                <div>

                  <strong>Tvoja odluka je konačna za ovaj zahtev.</strong>

                  <p>Kada prihvatiš jednu ponudu, ostale aktivne ponude se automatski zatvaraju.</p>

                </div>

              </div>

            </aside>

          </section>

        </div>

      </main>

      {compareOpen && (

          <div className="compareBackdrop" onMouseDown={() => setCompareOpen(false)}>

            <section className="compareDialog" role="dialog" aria-modal="true" aria-labelledby="compare-title" onMouseDown={(e) => e.stopPropagation()}>

              <div className="compareHeading"><div><span className="kicker">Pametniji izbor</span><h2 id="compare-title">Uporedi ponude</h2><p>Uporedi cene, hostove i sadržaj ponuda pre odluke.</p></div><button type="button" onClick={() => setCompareOpen(false)} aria-label="Zatvori poređenje"><Icon name="x" size={20}/></button></div>

              <div className="compareGrid">{compareOffers.map((offer) => {

                const host = hosts[offer.host_id] || {};

                return <article className="compareItem" key={offer.id}>

                  <div className="compareHost"><Avatar host={host}/><div><strong>{host.full_name || host.username || "Outdoor domaćin"}</strong><span>{[host.city,host.country].filter(Boolean).join(", ") || "MeetOutdoors"}</span></div></div>

                  <StatusPill status={offer.status}/>

                  <div className="comparePrice"><small>Ponuđena cena</small><strong>{money(offer.proposed_price,offer.currency)}</strong><span>Proveri u opisu da li je po osobi ili ukupno.</span></div>

                    {offer.event_id && events[String(offer.event_id)] &&

                      <Link className="compareProfile" to={`/event/${offer.event_id}`}>

                        Događaj: {events[String(offer.event_id)].title} <Icon name="arrowRight" size={15}/>

                      </Link>}

                  <div className="compareMessage"><small>Šta ponuda obuhvata</small><p>{offer.message || "Host nije uneo detaljan opis."}</p></div>

                  {host.username && <Link className="compareProfile" to={`/h/${host.username}`}>Pogledaj profil <Icon name="arrowRight" size={15}/></Link>}

                  {isCurrentPending(offer, request) && <button className="compareAccept" type="button" disabled={Boolean(actingId)} onClick={() => {setCompareOpen(false);openAcceptModal(offer);}}>Izaberi ovu ponudu</button>}

                </article>;

              })}</div>

              <div className="compareFoot"><span>Najniža cena ne znači nužno najbolju ponudu. Proveri šta je uključeno.</span><button type="button" onClick={() => setCompareOpen(false)}>Zatvori</button></div>

            </section>

          </div>

        )}

        {previewOfferId && (() => {
        const offer = offers.find((item) => item.id === previewOfferId);
        if (!offer) return null;
        const host = hosts[offer.host_id] || {};
        const hostName = host.full_name || host.username || "Outdoor domaćin";
        return <div className="moPreviewBackdrop" role="presentation" onMouseDown={() => setPreviewOfferId(null)}>
          <section className="moPreviewDialog" role="dialog" aria-modal="true" aria-labelledby="mo-preview-title" onMouseDown={(event) => event.stopPropagation()}>
            <button type="button" className="moPreviewClose" onClick={() => setPreviewOfferId(null)} aria-label="Zatvori pregled">×</button>
            <span className="moPreviewKicker">MEETOUTDOORS · PONUDA DOMAĆINA</span>
            <div className="moPreviewHost"><Avatar host={host}/><div><h2 id="mo-preview-title">{hostName}</h2><p>{[host.city,host.country].filter(Boolean).join(", ") || "Outdoor domaćin"}{host.is_verified ? " · Verifikovan" : ""}</p></div></div>
            {host.bio && <p className="moPreviewBio">{host.bio}</p>}
            <div className="moPreviewPrice"><small>PONUĐENA CENA</small><strong>{money(offer.proposed_price,offer.currency)}</strong><span>Proveri u opisu da li je cena po osobi ili ukupno.</span></div>
            <h3>Šta ponuda obuhvata</h3><p className="moPreviewMessage">{offer.message || "Domaćin nije uneo opis."}</p>
            <div className="moPreviewActions">{host.username && <Link to={`/h/${host.username}`} onClick={() => setPreviewOfferId(null)}>Profil domaćina ↗</Link>}{isCurrentPending(offer,request) && <button type="button" onClick={() => {setPreviewOfferId(null);openAcceptModal(offer);}}>Prihvati ponudu →</button>}</div>
          </section>
        </div>;
      })()}
      {acceptingOffer && (

        <div className="acceptModalBackdrop" onMouseDown={closeAcceptModal}>

          <section

            className="acceptModal"

            role="dialog"

            aria-modal="true"

            aria-labelledby="accept-offer-title"

            onMouseDown={(event) => event.stopPropagation()}

          >

            <button

              type="button"

              className="modalClose"

              onClick={closeAcceptModal}

              disabled={Boolean(actingId)}

              aria-label="Zatvori"

            >

              <Icon name="x" size={18} />

            </button>

            <span className="modalIcon">

              <Icon name="check" size={24} />

            </span>

            <span className="kicker">Potvrda ponude</span>

            <h2 id="accept-offer-title">Još samo kontakt.</h2>

            <p className="modalLead">

              Prihvataš ponudu domaćina{" "}

              <strong>

                {hosts[acceptingOffer.host_id]?.full_name ||

                  hosts[acceptingOffer.host_id]?.username ||

                  "MeetOutdoors domaćina"}

              </strong>

              . Unesi broj na koji domaćin može da te kontaktira radi

              završnog dogovora.

            </p>

            <div className="modalOfferSummary">

              <div>

                <small>Ponuda</small>

                <strong>

                  {money(

                    acceptingOffer.proposed_price,

                    acceptingOffer.currency

                  )}

                </strong>

              </div>

              <span>

                <Icon name="shield" size={16} />

                Broj se deli tek nakon potvrde

              </span>

            </div>

            <label className="phoneField">

              <span>Broj telefona</span>

              <div>

                <Icon name="phone" size={18} />

                <input

                  type="tel"

                  inputMode="tel"

                  autoComplete="tel"

                  placeholder="+381 6x xxx xxxx"

                  value={contactPhone}

                  maxLength={30}

                  autoFocus

                  onChange={(event) => { setContactPhone(event.target.value); setAcceptError(""); }}

                />

              </div>

              <small>

                Unesi broj koji želiš da podeliš baš sa ovim domaćinom.

              </small>

            </label>

            <label className="consentRow">

              <input

                type="checkbox"

                checked={contactConsent}

                onChange={(event) => {
                  setContactConsent(event.target.checked);
                  setAcceptError("");
                }}

              />

              <span className="consentCheck">

                {contactConsent && <Icon name="check" size={13} />}

              </span>

              <span>

                Saglasan sam da MeetOutdoors prosledi ovaj broj

                izabranom domaćinu radi dogovora oko aktivnosti.

              </span>

            </label>

            <div className="modalPrivacy">

              <Icon name="shield" size={17} />

              <p>

                Ostali domaćini ne dobijaju ovaj kontakt. Prihvatanjem

                ove ponude ostale aktivne ponude se zatvaraju.

              </p>

            </div>

            {acceptError && <div role="alert" className="moAcceptError">{acceptError}</div>}
            <div className="modalActions">

              <button

                type="button"

                className="modalCancel"

                onClick={closeAcceptModal}

                disabled={Boolean(actingId)}

              >

                Odustani

              </button>

              <button

                type="button"

                className="modalConfirm"

                disabled={

                  Boolean(actingId) ||

                  contactPhone.trim().length < 6 ||

                  !contactConsent

                }

                onClick={() =>

                  decide(

                    acceptingOffer.id,

                    "accept",

                    contactPhone

                  )

                }

              >

                <Icon name="check" size={17} />

                {actingId === acceptingOffer.id

                  ? "Prihvatam..."

                  : "Potvrdi i prihvati"}

              </button>

            </div>

          </section>

        </div>

      )}

    </>

  );

}

function Styles() {

  return <style>{`

    *{box-sizing:border-box}

    body{margin:0;background:#f1f4ee}

    button,input,textarea,select{font:inherit}

    .requestPage{min-height:100vh;padding:112px 24px 72px;color:#20352a;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:radial-gradient(circle at 8% 0%,rgba(194,226,158,.22),transparent 27%),radial-gradient(circle at 94% 20%,rgba(46,99,67,.10),transparent 26%),linear-gradient(180deg,#f8f9f5,#edf1e9)}

    .requestPage a{text-decoration:none;color:inherit}.shell{width:min(1220px,100%);margin:0 auto}

    .backBtn{display:inline-flex;align-items:center;gap:8px;margin-bottom:16px;padding:10px 13px;border:1px solid #d9e1d6;border-radius:12px;background:rgba(255,255,255,.75);color:#58695f;font-size:10px;font-weight:850;cursor:pointer}

    .hero{position:relative;overflow:hidden;padding:32px;border-radius:34px;background:radial-gradient(circle at 85% 15%,rgba(203,241,151,.15),transparent 24%),linear-gradient(135deg,#092418,#123b27 55%,#316847);color:#fff;box-shadow:0 30px 80px rgba(27,57,39,.18)}

    .hero:after{content:"";position:absolute;width:480px;height:480px;right:-220px;top:-220px;border-radius:50%;border:1px solid rgba(255,255,255,.07);box-shadow:0 0 0 70px rgba(255,255,255,.02),0 0 0 140px rgba(255,255,255,.012)}

    .heroTop,.heroContent,.sectionHead,.offerHeader,.hostIdentity,.hostNameLine,.offerActions,.contactArea,.contactActions{display:flex;align-items:center}

    .heroTop,.heroContent,.sectionHead,.offerHeader,.contactArea{justify-content:space-between}.heroTop{gap:12px;position:relative;z-index:1}

    .agentBadge,.requestStatus,.privacy,.offerStatus{display:inline-flex;align-items:center;gap:7px;border-radius:999px;font-size:8px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}

    .agentBadge{padding:9px 12px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.07);color:rgba(255,255,255,.75)}

    .requestStatus{padding:9px 12px;background:rgba(255,255,255,.06);color:rgba(255,255,255,.67)}.requestStatus>span{width:7px;height:7px;border-radius:50%;background:#c9ef91;box-shadow:0 0 0 5px rgba(201,239,145,.1)}

    .heroContent{position:relative;z-index:1;gap:30px;margin-top:65px;align-items:flex-end}.heroContent>div:first-child{max-width:760px}

    .kicker{display:block;color:#789858;font-size:8px;font-weight:900;letter-spacing:.13em;text-transform:uppercase}.kicker.light{color:#c9ee98}

    .hero h1{margin:12px 0 0;font-size:clamp(50px,7vw,84px);line-height:.9;letter-spacing:-.075em}.hero p{max-width:650px;margin:20px 0 0;color:rgba(255,255,255,.58);font-size:12px;line-height:1.7}

    .offerCount{flex:0 0 180px;padding:20px;border:1px solid rgba(255,255,255,.11);border-radius:21px;background:rgba(255,255,255,.07);backdrop-filter:blur(16px)}

    .offerCount strong,.offerCount span,.offerCount small{display:block}.offerCount strong{color:#e2f8c0;font-size:38px;line-height:1}.offerCount span{margin-top:5px;font-size:10px;font-weight:900}.offerCount small{margin-top:8px;color:rgba(255,255,255,.45);font-size:8px}

    .moRequestTools{display:flex;justify-content:space-between;gap:12px;align-items:center;background:#fff;border:1px solid #dce7dc;border-radius:16px;padding:15px 19px;margin:14px 0}

    .moRequestTools>div:first-child{display:grid;gap:4px}.moRequestTools strong{color:#234331;font-size:13px}.moRequestTools span{font-size:11px;color:#789081}.moRequestButtons{display:flex;gap:7px;flex-wrap:wrap}.moRequestButtons button,.moEditSave{border:0;background:#17412f;color:white;padding:10px 14px;border-radius:9px;font-size:12px;font-weight:750;cursor:pointer}.moRequestButtons .danger{background:#fff0ed;color:#9c3d2c}.moEditRequest{background:#fff;border:1px solid #dce7dc;border-radius:16px;padding:19px;margin:12px 0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px}.moEditRequest label{display:grid;gap:6px;font-size:11px;font-weight:750;color:#4c6a57}.moEditRequest input,.moEditRequest select,.moEditRequest textarea{width:100%;padding:11px;border:1px solid #dce6dc;border-radius:9px;background:#fafcf9;color:#243d2e;font:inherit}.moEditWide{grid-column:1/-1}.moEditSave{justify-self:start}@media(max-width:700px){.moRequestTools{margin:12px;flex-direction:column;align-items:stretch}.moEditRequest{margin:12px;grid-template-columns:1fr}.moEditWide{grid-column:auto}}

    .summaryPanel{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin-top:14px;padding:10px;border:1px solid #dce4d9;border-radius:22px;background:rgba(255,255,255,.8);box-shadow:0 12px 34px rgba(31,52,38,.05)}

    .summaryItem{display:flex;align-items:center;gap:10px;min-height:67px;padding:10px;border-radius:15px;background:#f8faf6}.summaryItem>span{display:grid;place-items:center;flex:0 0 36px;width:36px;height:36px;border-radius:11px;background:#e8f1e0;color:#5e7e46}

    .summaryItem small,.summaryItem strong{display:block}.summaryItem small{color:#929c95;font-size:7px;font-weight:850;text-transform:uppercase;letter-spacing:.05em}.summaryItem strong{margin-top:4px;color:#405348;font-size:9px;line-height:1.35}

    .notice,.errorBox{display:flex;align-items:center;gap:9px;margin-top:14px;padding:13px 15px;border-radius:14px;font-size:9px;font-weight:750}.notice{border:1px solid #cfe2c3;background:#edf6e8;color:#527443}.errorBox{border:1px solid #ecc9c4;background:#fff0ee;color:#93493e}

    .contentGrid{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:18px;align-items:start;margin-top:25px}.sectionHead{gap:15px;align-items:flex-start}.sectionHead h2{margin:8px 0 0;font-size:clamp(28px,4vw,42px);line-height:.98;letter-spacing:-.06em;color:#20382a}

    .privacy{flex:0 0 auto;padding:9px 11px;background:#e9f1e3;color:#5e784b}.offerList{display:grid;gap:13px;margin-top:18px}

    .offerCard{position:relative;overflow:hidden;padding:22px;border:1px solid #dce4d9;border-radius:24px;background:rgba(255,255,255,.86);box-shadow:0 14px 38px rgba(31,52,38,.05);transition:.18s ease}.offerCard:hover{transform:translateY(-1px);box-shadow:0 18px 45px rgba(31,52,38,.075)}

    .offerCard.chosen{border-color:#9cbb80;background:linear-gradient(180deg,#fbfff8,#f3f9ee);box-shadow:0 18px 45px rgba(76,112,54,.10)}.offerCard.rejected,.offerCard.withdrawn{opacity:.67}

    .chosenRibbon{display:inline-flex;align-items:center;gap:6px;margin:-22px -22px 18px;padding:9px 13px;background:#dff0d2;color:#4f743d;font-size:8px;font-weight:900;text-transform:uppercase;letter-spacing:.08em}

    .hostIdentity{gap:12px;min-width:0}.hostAvatar{display:grid;place-items:center;width:52px;height:52px;flex:0 0 52px;border-radius:16px;object-fit:cover;background:#e4ecdf;color:#577346;font-size:18px;font-weight:900}.hostNameLine{gap:7px}.hostNameLine h3{margin:0;color:#31483a;font-size:14px;letter-spacing:-.02em}.hostIdentity p{margin:5px 0 0;color:#8a958e;font-size:8px}.verified{display:grid;place-items:center;width:17px;height:17px;border-radius:50%;background:#315f42;color:#fff}

    .offerStatus{padding:8px 10px;background:#edf1ea;color:#718078}.offerStatus.pending{background:#f1f3e5;color:#7c8249}.offerStatus.accepted{background:#e2f1d8;color:#50763d}.offerStatus.rejected,.offerStatus.withdrawn{background:#f1eeee;color:#8b7470}

    .priceBlock{margin-top:19px;padding:16px;border:1px solid #e1e7df;border-radius:16px;background:#f8faf7}.priceBlock small,.priceBlock strong,.priceBlock span{display:block}.priceBlock small{color:#919b94;font-size:7px;font-weight:900;text-transform:uppercase;letter-spacing:.07em}.priceBlock strong{margin-top:4px;color:#284733;font-size:24px;letter-spacing:-.045em}.priceBlock span{margin-top:2px;color:#8d9890;font-size:8px}

    .messageBox{display:flex;gap:10px;margin-top:10px;padding:14px;border-radius:15px;background:#f0f5ec}.messageBox>span{color:#6f8c55}.messageBox p{margin:0;color:#5e7064;font-size:9px;line-height:1.65}

    .packageCard{display:flex;align-items:center;gap:11px;margin-top:10px;padding:10px;border:1px solid #dfe6dc;border-radius:15px;background:#fbfcfa}.packageImage{display:grid;place-items:center;overflow:hidden;width:54px;height:54px;flex:0 0 54px;border-radius:12px;background:#e9efe5;color:#6c805e}.packageImage img{width:100%;height:100%;object-fit:cover}.packageCopy{min-width:0;flex:1}.packageCopy small,.packageCopy strong,.packageCopy span{display:block}.packageCopy small{color:#8d998f;font-size:7px;text-transform:uppercase;font-weight:850}.packageCopy strong{overflow:hidden;margin-top:4px;color:#3f5547;font-size:10px;text-overflow:ellipsis;white-space:nowrap}.packageCopy span{margin-top:3px;color:#929d95;font-size:7px}

    .offerActions{justify-content:flex-end;gap:7px;flex-wrap:wrap;margin-top:15px}.offerActions a,.offerActions button{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:39px;padding:0 12px;border-radius:11px;font-size:8px;font-weight:900;cursor:pointer}.profileBtn{margin-right:auto;border:1px solid #dce4d9;background:#f8faf6;color:#566a5c}.rejectBtn{border:1px solid #e2d7d4;background:#fff;color:#886c67}.acceptBtn{border:0;background:linear-gradient(135deg,#143b28,#306747);color:#fff;box-shadow:0 10px 22px rgba(38,85,56,.15)}.offerActions button:disabled{opacity:.5;cursor:not-allowed}

    .contactArea{gap:12px;margin-top:15px;padding:14px;border:1px solid #cfe0c5;border-radius:16px;background:#eaf5e4;align-items:flex-end}.contactArea>div:first-child{max-width:520px}.contactArea strong{display:block;margin-top:5px;color:#3f6243;font-size:11px}.contactArea p{margin:4px 0 0;color:#718271;font-size:8px;line-height:1.5}.contactActions{gap:6px}.contactActions a{display:inline-flex;align-items:center;gap:5px;padding:9px 10px;border-radius:10px;background:#fff;color:#486348;font-size:8px;font-weight:900}

    .sideColumn{display:grid;gap:12px}.sideCard,.safeCard{padding:20px;border:1px solid #dce4d9;border-radius:22px;background:rgba(255,255,255,.82);box-shadow:0 12px 34px rgba(31,52,38,.045)}.sideCard h3{margin:8px 0 0;color:#30483a;font-size:23px;line-height:1;letter-spacing:-.05em}.tips{display:grid;gap:8px;margin-top:18px}.tips>div{display:flex;gap:10px;padding:11px;border-radius:13px;background:#f7f9f5}.tips span{color:#87a46d;font-size:8px;font-weight:900}.tips p{margin:0;color:#748078;font-size:8px;line-height:1.5}

    .safeCard{display:flex;gap:11px;background:#eef5e9}.safeCard>span{color:#5f7e49}.safeCard strong{display:block;color:#50684f;font-size:9px}.safeCard p{margin:5px 0 0;color:#7b897c;font-size:8px;line-height:1.5}

    .noOffers,.emptyFatal,.loadingCard{padding:42px 28px;border:1px solid #dce4d9;border-radius:24px;background:rgba(255,255,255,.84);text-align:center}.noOffers{margin-top:18px}.noOffers>span,.emptyFatal>span{display:grid;place-items:center;width:56px;height:56px;margin:0 auto;border-radius:17px;background:#eaf0e6;color:#657b58}.noOffers h3,.emptyFatal h1,.loadingCard h1{margin:15px 0 0;color:#30463a;letter-spacing:-.04em}.noOffers p,.emptyFatal p,.loadingCard p{max-width:500px;margin:8px auto 0;color:#818d85;font-size:9px;line-height:1.6}.emptyFatal{width:min(570px,100%);margin:60px auto}.emptyFatal small{display:block;margin-top:16px;color:#956d66;font-size:8px;font-weight:900;text-transform:uppercase}.emptyFatal a{display:inline-flex;align-items:center;gap:6px;margin-top:18px;padding:11px 14px;border-radius:11px;background:#173c28;color:#fff;font-size:8px;font-weight:900}

    .loadingPage{display:grid;place-items:center}.loadingCard{width:min(520px,100%)}.spinner{display:block;width:38px;height:38px;margin:0 auto;border:3px solid #dbe4d7;border-top-color:#53793d;border-radius:50%;animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}

    .acceptModalBackdrop{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;padding:20px;background:rgba(8,25,16,.58);backdrop-filter:blur(10px)}

    .acceptModal{position:relative;width:min(520px,100%);max-height:calc(100vh - 40px);overflow:auto;padding:28px;border:1px solid rgba(255,255,255,.8);border-radius:28px;background:#fbfcf9;box-shadow:0 35px 100px rgba(5,28,15,.3)}

    .modalClose{position:absolute;top:17px;right:17px;display:grid;place-items:center;width:38px;height:38px;padding:0;border:1px solid #dde5da;border-radius:12px;background:#f4f7f1;color:#647269;cursor:pointer}

    .modalIcon{display:grid;place-items:center;width:54px;height:54px;margin-bottom:20px;border-radius:17px;background:linear-gradient(135deg,#173e2a,#397451);color:#e2f6c7;box-shadow:0 12px 26px rgba(31,78,50,.16)}

    .acceptModal h2{margin:9px 0 0;color:#203a2a;font-size:34px;line-height:1;letter-spacing:-.055em}

    .modalLead{margin:13px 0 0;color:#738078;font-size:10px;line-height:1.7}.modalLead strong{color:#405848}

    .modalOfferSummary{display:flex;align-items:center;justify-content:space-between;gap:15px;margin-top:20px;padding:14px;border:1px solid #dce5d8;border-radius:16px;background:#f2f7ee}

    .modalOfferSummary small,.modalOfferSummary strong{display:block}.modalOfferSummary small{color:#89968d;font-size:7px;font-weight:900;text-transform:uppercase;letter-spacing:.07em}.modalOfferSummary strong{margin-top:4px;color:#2f5138;font-size:18px}

    .modalOfferSummary>span{display:inline-flex;align-items:center;gap:6px;color:#61775f;font-size:7px;font-weight:850}

    .phoneField{display:block;margin-top:20px}.phoneField>span{display:block;margin-bottom:7px;color:#405448;font-size:8px;font-weight:900;text-transform:uppercase;letter-spacing:.07em}

    .phoneField>div{display:flex;align-items:center;gap:10px;height:52px;padding:0 14px;border:1px solid #ccd9c7;border-radius:14px;background:#fff;color:#668158;transition:.18s ease}.phoneField>div:focus-within{border-color:#7fa364;box-shadow:0 0 0 4px rgba(119,157,89,.10)}

    .phoneField input{width:100%;height:100%;padding:0;border:0;outline:0;background:transparent;color:#294233;font-size:14px;font-weight:750}.phoneField input::placeholder{color:#a5aea8;font-weight:500}

    .phoneField>small{display:block;margin-top:7px;color:#939d96;font-size:7px}

    .consentRow{position:relative;display:grid;grid-template-columns:20px minmax(0,1fr);gap:10px;align-items:start;margin-top:15px;padding:13px;border:1px solid #dde5da;border-radius:14px;background:#fff;cursor:pointer}.consentRow>input{position:absolute;opacity:0;pointer-events:none}.consentCheck{display:grid;place-items:center;width:20px;height:20px;border:1px solid #bccbb6;border-radius:6px;background:#f7f9f5;color:#fff}.consentRow>input:checked+.consentCheck{border-color:#326546;background:#326546}.consentRow>span:last-child{color:#68766d;font-size:8px;line-height:1.55}

    .modalPrivacy{display:flex;gap:9px;margin-top:10px;padding:11px 12px;border-radius:13px;background:#edf4e8;color:#5c7656}.modalPrivacy svg{flex:0 0 auto}.modalPrivacy p{margin:0;font-size:7px;line-height:1.55}

    .moAcceptError{margin-top:14px;padding:12px 14px;border:1px solid #f1c5ba;background:#fff1ed;color:#a13220;border-radius:12px;font-size:13px;line-height:1.5;font-weight:700}
    .modalActions{display:grid;grid-template-columns:.8fr 1.2fr;gap:8px;margin-top:20px}.modalActions button{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:46px;padding:0 14px;border-radius:13px;font-size:9px;font-weight:900;cursor:pointer}.modalCancel{border:1px solid #d9e1d6;background:#fff;color:#67756c}.modalConfirm{border:0;background:linear-gradient(135deg,#123a26,#326b49);color:#fff;box-shadow:0 11px 24px rgba(32,79,50,.17)}.modalActions button:disabled{opacity:.48;cursor:not-allowed}

    .moStaleOffer{margin-top:12px;padding:12px;border:1px solid #e8d9ba;border-radius:12px;background:#fff9ed;color:#8a6a36;font-size:11px;line-height:1.5}

    .compareToolbar{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;margin-top:17px;padding:15px 17px;border:1px solid #dce5d8;border-radius:17px;background:#fff}

    .compareToolbar>div:first-child{display:grid;gap:4px}.compareToolbar strong{font-size:13px;color:#294331}.compareToolbar span{font-size:11px;color:#788a7b}.compareToolbar>small{width:100%;font-size:10px;color:#8a968c}.compareControls{display:flex;align-items:center;gap:9px;flex-wrap:wrap}.compareControls label{display:flex;align-items:center;gap:7px;font-size:11px;color:#647767}.compareControls select{max-width:200px;padding:10px;border:1px solid #d8e3d4;border-radius:10px;background:#f7faf5;color:#26442f;font-size:12px}.compareControls button,.compareAccept{padding:11px 15px;border:0;border-radius:11px;background:#214d33;color:white;font-size:12px;font-weight:800;cursor:pointer}.compareControls button:disabled{opacity:.4;cursor:not-allowed}.compareChoice{display:inline-flex;align-items:center;gap:7px;margin-bottom:13px;padding:8px 10px;border-radius:10px;background:#f2f6ee;color:#4b694f;font-size:11px;font-weight:750;cursor:pointer}.compareChoice input{accent-color:#326e48;width:15px;height:15px}

    .compareBackdrop{position:fixed;inset:0;z-index:9998;display:grid;place-items:center;padding:18px;background:rgba(9,29,18,.65);backdrop-filter:blur(9px)}.compareDialog{width:min(1080px,100%);max-height:calc(100vh - 36px);overflow:auto;padding:26px;border-radius:26px;background:#f6f9f3;box-shadow:0 30px 100px rgba(0,0,0,.25)}.compareHeading,.compareFoot{display:flex;justify-content:space-between;align-items:start;gap:15px}.compareHeading h2{margin:7px 0;color:#1c3d2a;font-size:clamp(25px,4vw,38px);letter-spacing:-.05em}.compareHeading p,.compareFoot span{color:#718272;font-size:12px}.compareHeading button{display:grid;place-items:center;width:38px;height:38px;border:1px solid #d9e5d7;border-radius:11px;background:white;cursor:pointer}.compareGrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:12px;margin:20px 0}.compareItem{display:flex;flex-direction:column;align-items:flex-start;gap:13px;min-width:0;padding:19px;border:1px solid #dce7d8;border-radius:19px;background:white}.compareHost{display:flex;align-items:center;gap:10px}.compareHost strong,.compareHost span{display:block}.compareHost strong{font-size:13px;color:#24402d}.compareHost span{margin-top:4px;font-size:11px;color:#849285}.comparePrice{width:100%;padding:15px;border-radius:13px;background:#eef5e8}.comparePrice small,.comparePrice strong,.comparePrice span,.compareMessage small{display:block}.comparePrice small,.compareMessage small{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:#738873}.comparePrice strong{margin:6px 0;color:#224a30;font-size:23px;overflow-wrap:anywhere}.comparePrice span{font-size:10px;color:#728471}.compareMessage{width:100%;flex:1}.compareMessage p{font-size:12px;line-height:1.65;white-space:pre-wrap;overflow-wrap:anywhere;color:#4e6253}.compareProfile{display:inline-flex;align-items:center;gap:6px;color:#356744!important;font-size:12px;font-weight:800}.compareAccept{width:100%}.compareFoot{align-items:center;border-top:1px solid #dce6d8;padding-top:15px}.compareFoot button{padding:9px 14px;border:1px solid #d6e1d2;border-radius:10px;background:white;color:#385540;cursor:pointer}

    @media(max-width:980px){.summaryPanel{grid-template-columns:repeat(2,minmax(0,1fr))}.contentGrid{grid-template-columns:1fr}.sideColumn{grid-template-columns:repeat(2,minmax(0,1fr))}}

    @media(max-width:700px){.requestPage{padding:82px 0 55px}.backBtn{margin-left:16px}.hero{padding:21px;border-radius:0 0 30px 30px}.heroTop,.heroContent,.sectionHead,.contactArea{align-items:flex-start;flex-direction:column}.heroContent{margin-top:45px}.hero h1{font-size:52px}.offerCount{width:100%;flex:auto}.summaryPanel{margin:12px 12px 0;grid-template-columns:1fr 1fr}.contentGrid{padding:0 12px}.sideColumn{grid-template-columns:1fr}.privacy{margin-top:2px}.offerHeader{align-items:flex-start;gap:10px}.offerActions{justify-content:stretch}.offerActions a,.offerActions button{flex:1}.profileBtn{margin-right:0}.contactActions{width:100%}.contactActions a{flex:1;justify-content:center}}

    @media(max-width:450px){.acceptModalBackdrop{padding:10px;align-items:end}.acceptModal{padding:23px 18px 18px;border-radius:25px 25px 18px 18px}.acceptModal h2{font-size:30px}.modalOfferSummary{align-items:flex-start;flex-direction:column}.modalActions{grid-template-columns:1fr}.modalConfirm{grid-row:1}.modalCancel{grid-row:2}.hero h1{font-size:45px}.summaryPanel{grid-template-columns:1fr}.offerCard{padding:17px}.chosenRibbon{margin:-17px -17px 16px}.offerHeader{flex-direction:column}.offerStatus{align-self:flex-start}.offerActions{display:grid;grid-template-columns:1fr 1fr}.profileBtn{grid-column:1/-1}.contactActions{flex-direction:column}.contactActions a{width:100%;justify-content:center}}

    @media(prefers-reduced-motion:reduce){*,*:before,*:after{animation:none!important;transition:none!important}}

  
    /* Final UI: richer host presentation and offer preview */
    .moHostInsights{margin:14px 0;padding:13px 15px;border:1px solid #e4ece2;background:#f8fbf6;border-radius:14px}.moHostBio{font-size:12px!important;line-height:1.7!important;color:#53685a!important;margin:0 0 10px!important}.moHostFacts{display:flex;flex-wrap:wrap;gap:7px}.moHostFacts span,.moHostFacts a{display:inline-flex;padding:7px 9px;border-radius:8px;background:#edf4e9;color:#3f6a49;font-size:11px;font-weight:750;text-decoration:none}.moOfferPreviewBtn{display:inline-flex;align-items:center;justify-content:center;border:1px solid #bcd4b9;background:#e9f3e6;color:#234f31;padding:10px 15px;border-radius:10px;font-weight:800;font-size:12px;cursor:pointer;margin:5px 0 13px}.moOfferPreviewBtn:hover{background:#dbeed6}.moPreviewBackdrop{position:fixed;inset:0;z-index:9999;background:rgba(8,28,19,.68);backdrop-filter:blur(8px);display:grid;place-items:center;padding:18px}.moPreviewDialog{position:relative;width:min(100%,600px);max-height:min(90vh,850px);overflow:auto;border-radius:25px;padding:30px;background:#fff;box-shadow:0 30px 90px #0004}.moPreviewClose{position:absolute;right:18px;top:16px;border:0;border-radius:50%;background:#eef3ec;color:#34513c;width:38px;height:38px;font-size:25px;cursor:pointer}.moPreviewKicker{color:#668668;font-size:10px;letter-spacing:2px;font-weight:900}.moPreviewHost{display:flex;align-items:center;gap:15px;margin:22px 0 14px}.moPreviewHost h2{font-size:25px;letter-spacing:-1px;margin:0 0 5px}.moPreviewHost p,.moPreviewBio{font-size:13px;line-height:1.7;color:#65786a;margin:0}.moPreviewBio{padding:13px;background:#f6f9f3;border-radius:12px}.moPreviewPrice{display:flex;flex-direction:column;gap:6px;background:#163c2a;color:white;border-radius:17px;padding:22px;margin:18px 0}.moPreviewPrice small{font-size:10px;letter-spacing:1.5px;color:#c8dfa8}.moPreviewPrice strong{font-size:31px}.moPreviewPrice span{font-size:11px;color:#d5e3d7}.moPreviewDialog h3{font-size:15px;margin:18px 0 9px}.moPreviewMessage{white-space:pre-wrap;font-size:13px;line-height:1.85;color:#405847}.moPreviewActions{display:flex;gap:9px;flex-wrap:wrap;margin-top:22px}.moPreviewActions a,.moPreviewActions button{flex:1;text-align:center;padding:13px 16px;border-radius:11px;border:1px solid #cfdfcd;background:#eef5e9;color:#244f34;font-size:12px;font-weight:850;text-decoration:none;cursor:pointer}.moPreviewActions button{border:0;background:#183f2c;color:white}@media(max-width:600px){.moPreviewBackdrop{padding:0;align-items:end}.moPreviewDialog{max-height:94vh;border-radius:24px 24px 0 0;padding:25px 18px 30px}.moPreviewActions{flex-direction:column}}

    /* Compact responsive details: prioritize offers above decoration */
    .requestPage{padding:86px 16px 48px}
    .shell{width:min(1080px,100%)}
    .hero{padding:20px 24px;border-radius:20px;box-shadow:0 10px 30px rgba(27,57,39,.10)}
    .hero:after{display:none}
    .heroContent{margin-top:17px;gap:16px;align-items:center}
    .hero h1{font-size:clamp(26px,3vw,39px);line-height:1.12;letter-spacing:-.045em;margin:5px 0 0}
    .hero p{margin-top:7px;line-height:1.45;font-size:11px;max-width:510px}
    .offerCount{min-width:100px;padding:12px 15px}
    .summaryPanel{margin-top:10px;padding:7px;gap:6px;border-radius:14px}
    .contentGrid{margin-top:15px;gap:12px;grid-template-columns:minmax(0,1fr) 270px}
    .sectionHead h2{font-size:clamp(22px,2.6vw,30px);margin-top:4px}
    .offerCard{padding:15px;border-radius:16px;box-shadow:0 6px 20px rgba(31,52,38,.04)}
    .moHostInsights{margin:9px 0;padding:10px 12px}
    .moHostBio{line-height:1.45!important}
    .moOfferPreviewBtn{margin:3px 0 8px;padding:8px 12px}
    .moPreviewDialog{padding:22px;border-radius:18px;max-height:86dvh}
    .moPreviewHost{margin:12px 0;gap:10px}
    .moPreviewHost h2{font-size:21px}
    .moPreviewPrice{padding:15px;margin:12px 0}
    .moPreviewPrice strong{font-size:25px}
    .moPreviewActions{margin-top:12px}
    @media(max-width:980px){.contentGrid{grid-template-columns:1fr}}
    @media(max-width:700px){
      .requestPage{padding:72px 0 34px}
      .backBtn{margin-left:12px}
      .hero{padding:15px 14px;border-radius:0 0 16px 16px}
      .heroTop{flex-direction:row;align-items:center;flex-wrap:wrap;gap:7px}
      .heroContent{margin-top:11px;flex-direction:row;align-items:center;gap:10px}
      .hero h1{font-size:clamp(22px,6vw,30px);line-height:1.13;margin-top:4px}
      .hero p{display:none}
      .offerCount{width:auto;min-width:75px;flex:0 0 auto;padding:8px 10px;border-radius:12px}
      .offerCount small{display:none}
      .summaryPanel{margin:8px 10px 0;display:flex;overflow-x:auto;gap:6px;padding:6px;scrollbar-width:thin;scroll-snap-type:x proximity}
      .summaryPanel>*{flex:0 0 auto;min-width:110px;scroll-snap-align:start}
      .contentGrid{margin-top:12px;padding:0 10px;gap:10px}
      .sectionHead{gap:6px}
      .sectionHead h2{font-size:23px}
      .offerCard{padding:12px;border-radius:13px}
      .offerHeader{flex-direction:row;align-items:center;flex-wrap:wrap}
      .offerActions{gap:6px}
      .offerActions a,.offerActions button{padding:9px 10px}
      .moHostInsights{padding:9px;margin:8px 0}
      .moPreviewBackdrop{padding:0;align-items:end}
      .moPreviewDialog{max-height:88dvh;padding:17px 15px 22px;border-radius:18px 18px 0 0}
      .moPreviewHost h2{font-size:20px}
      .moPreviewPrice{padding:12px}
      .moPreviewPrice strong{font-size:23px}
      .moPreviewActions{flex-direction:row}
    }
    @media(max-width:450px){
      .hero h1{font-size:23px}
      .offerCount{min-width:65px}
      .summaryPanel{grid-template-columns:none}
      .offerHeader{flex-direction:row}
      .offerActions{grid-template-columns:1fr 1fr}
      .moPreviewActions{flex-direction:column}
    }
`}</style>;

}
