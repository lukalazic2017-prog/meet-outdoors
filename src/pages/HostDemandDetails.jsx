import React, { useCallback, useEffect, useMemo, useState } from "react";

import { Link, useNavigate, useParams } from "react-router-dom";

import { supabase } from "../supabaseClient";

import { useAuth } from "../context/AuthContext";

function Icon({ name, size = 20, strokeWidth = 2 }) {

  const paths = {

    arrowLeft: (

      <>

        <path d="M19 12H5" />

        <path d="m11 18-6-6 6-6" />

      </>

    ),

    arrowRight: (

      <>

        <path d="M5 12h14" />

        <path d="m13 6 6 6-6 6" />

      </>

    ),

    sparkle: (

      <>

        <path d="m12 3 1.1 3.3L16 8l-2.9 1.7L12 13l-1.1-3.3L8 8l2.9-1.7L12 3Z" />

        <path d="m18 14 .7 2.3L21 17l-2.3.7L18 20l-.7-2.3L15 17l2.3-.7L18 14Z" />

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

    users: (

      <>

        <circle cx="9" cy="8" r="3" />

        <path d="M3 20v-2a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v2" />

        <path d="M16 4.5a3 3 0 0 1 0 6M17 13a5 5 0 0 1 4 5v2" />

      </>

    ),

    wallet: (

      <>

        <rect x="3" y="6" width="18" height="14" rx="3" />

        <path d="M3 9h15M16 13h5" />

        <circle cx="16" cy="13" r=".5" fill="currentColor" stroke="none" />

      </>

    ),

    mountain: (

      <>

        <path d="m3 20 6.2-10 3.2 4.8L15.8 9 21 20Z" />

        <path d="m7.5 13 1.7 1.6 1.4-1.2" />

      </>

    ),

    car: (

      <>

        <path d="m5 11 2-5h10l2 5" />

        <rect x="3" y="11" width="18" height="7" rx="2" />

        <path d="M6 18v2M18 18v2M7 14h.01M17 14h.01" />

      </>

    ),

    message: (

      <>

        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />

        <path d="M8 9h8M8 13h5" />

      </>

    ),

    package: (

      <>

        <path d="m12 3 8 4-8 4-8-4 8-4Z" />

        <path d="m4 7 8 4 8-4M4 12l8 4 8-4M4 17l8 4 8-4" />

      </>

    ),

    check: <path d="m5 12 4 4L19 6" />,

    alert: (

      <>

        <circle cx="12" cy="12" r="9" />

        <path d="M12 8v5M12 16h.01" />

      </>

    ),

    clock: (

      <>

        <circle cx="12" cy="12" r="9" />

        <path d="M12 7v5l3 2" />

      </>

    ),

    shield: (

      <>

        <path d="M12 3 5 6v5c0 4.6 2.9 8.4 7 10 4.1-1.6 7-5.4 7-10V6l-7-3Z" />

        <path d="m9 12 2 2 4-4" />

      </>

    ),

    send: (

      <>

        <path d="m22 2-7 20-4-9-9-4Z" />

        <path d="M22 2 11 13" />

      </>

    ),

    phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.8 2.1Z" />,

    user: (

      <>

        <circle cx="12" cy="8" r="4" />

        <path d="M4 21a8 8 0 0 1 16 0" />

      </>

    ),

    x: (

      <>

        <path d="m6 6 12 12M18 6 6 18" />

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

      {paths[name]}

    </svg>

  );

}

function formatDate(value) {

  if (!value) return "Nije navedeno";

  const date = new Date(`${value}T12:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("sr-Latn-RS", {

    day: "2-digit",

    month: "short",

    year: "numeric",

  }).format(date);

}

function formatMoney(value, currency = "RSD") {

  if (value === null || value === undefined || value === "") {

    return "Nije navedeno";

  }

  const number = Number(value);

  if (!Number.isFinite(number)) return `${value} ${currency}`;

  try {

    return new Intl.NumberFormat("sr-Latn-RS", {

      style: "currency",

      currency: currency || "RSD",

      maximumFractionDigits: 0,

    }).format(number);

  } catch {

    return `${number.toLocaleString("sr-Latn-RS")} ${currency || "RSD"}`;

  }

}

function difficultyLabel(value) {

  const map = {

    easy: "Lako",

    medium: "Srednje",

    hard: "Teško",

  };

  return map[value] || value || "Nije navedeno";

}

function DetailItem({ icon, label, value, strong = false }) {

  return (

    <article className="detailItem">

      <span className="detailIcon">

        <Icon name={icon} size={19} />

      </span>

      <div>

        <small>{label}</small>

        <strong className={strong ? "emphasis" : ""}>{value}</strong>

      </div>

    </article>

  );

}

function LoadingState() {

  return (

    <>

      <Styles />

      <main className="statePage">

        <section className="stateCard">

          <span className="loader" />

          <h1>Učitavamo potražnju</h1>

          <p>Proveravamo detalje i pripremamo prostor za tvoju ponudu.</p>

        </section>

      </main>

    </>

  );

}

export default function HostDemandDetails() {

  const { id } = useParams();

  const navigate = useNavigate();

  const { user, loading: authLoading } = useAuth();

  const [demand, setDemand] = useState(null);
  const [requesterProfile,setRequesterProfile] = useState(null);

  const [existingOffer, setExistingOffer] = useState(null);

  const [packages, setPackages] = useState([]);
  const [events, setEvents] = useState([]);
  const [eventId, setEventId] = useState("");

  const [message, setMessage] = useState("");

  const [price, setPrice] = useState("");

  const [currency, setCurrency] = useState("RSD");

  const [packageId, setPackageId] = useState("");

  const [loading, setLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  const [rejecting, setRejecting] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState(false);
  const [editingOffer, setEditingOffer] = useState(false);
  const [managingOffer, setManagingOffer] = useState(false);

  const [acceptedUser, setAcceptedUser] = useState(null);

  const loadPage = useCallback(async () => {

    if (!id || !user?.id) return;

    setLoading(true);

    setError("");

    try {

      const [

        demandResult,

        offerResult,

        packagesResult,
        eventsResult,

      ] = await Promise.all([

        supabase.rpc("get_host_adventure_demand", {

          p_intent_id: id,

        }),

        supabase

          .from("adventure_intent_responses")

          .select(

            "id, intent_id, host_id, message, proposed_price, currency, package_id, event_id, status, intent_revision, accepted_contact_phone, accepted_at, created_at, updated_at"

          )

          .eq("intent_id", id)

          .eq("host_id", user.id)

          .maybeSingle(),

        supabase

          .from("packages")

          .select("id, title, price, currency, is_active")

          .eq("host_id", user.id)

          .eq("is_active", true)

          .order("created_at", { ascending: false }),
        supabase.from("events")
          .select("id, title, location, start_date, price, is_active")
          .eq("host_id", user.id)
          .eq("is_active", true)
          .order("start_date", { ascending: true }),
      ]);

      if (demandResult.error) throw demandResult.error;

      if (offerResult.error) throw offerResult.error;

      if (packagesResult.error) throw packagesResult.error;
      if (eventsResult.error) throw eventsResult.error;

      setDemand(demandResult.data || null);
      const requesterId = demandResult.data?.user_id || demandResult.data?.requester_id;
      if (requesterId) {
        const {data: requester} = await supabase.from("profiles")
          .select("id,full_name,username,avatar_url,city,is_verified")
          .eq("id",requesterId).maybeSingle();
        setRequesterProfile(requester || null);
      } else setRequesterProfile(null);

      setExistingOffer(offerResult.data || null);

      setPackages(packagesResult.data || []);
      setEvents(eventsResult.data || []);

      setAcceptedUser(null);

      if (

        offerResult.data?.status === "accepted" &&

        offerResult.data?.accepted_contact_phone

      ) {

        const { data: acceptedNotification, error: acceptedNotificationError } =

          await supabase

            .from("notifications")

            .select("from_user_id")

            .eq("user_id", user.id)

            .eq("type", "adventure_offer_accepted")

            .eq("adventure_intent_id", id)

            .not("from_user_id", "is", null)

            .order("created_at", { ascending: false })

            .limit(1)

            .maybeSingle();

        if (acceptedNotificationError) {
          console.warn("Accepted user notification unavailable:", acceptedNotificationError);
        }

        if (acceptedNotification?.from_user_id) {

          const { data: acceptedProfile, error: acceptedProfileError } =

            await supabase

              .from("profiles")

              .select("id, full_name, username, avatar_url, city, country")

              .eq("id", acceptedNotification.from_user_id)

              .maybeSingle();

          if (acceptedProfileError) {
            console.warn("Accepted user profile unavailable:", acceptedProfileError);
          } else {
            setAcceptedUser(acceptedProfile || null);
          }

        }

      }

      if (offerResult.data) {

        setMessage(offerResult.data.message || "");

        setPrice(

          offerResult.data.proposed_price === null ||

            offerResult.data.proposed_price === undefined

            ? ""

            : String(offerResult.data.proposed_price)

        );

        setCurrency(offerResult.data.currency || "RSD");

        setPackageId(offerResult.data.package_id || "");
        setEventId(offerResult.data.event_id == null ? "" : String(offerResult.data.event_id));

      }

    } catch (loadError) {

      console.error("Host demand load error:", loadError);

      setError(

        loadError.message ||

          "Potražnju trenutno nije moguće učitati."

      );

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

    loadPage();

  }, [authLoading, user, navigate, loadPage]);

  const dateText = useMemo(() => {

    if (!demand) return "Nije navedeno";

    if (!demand.start_date && !demand.end_date) {

      return "Fleksibilno";

    }

    if (demand.start_date && demand.end_date) {

      if (demand.start_date === demand.end_date) {

        return formatDate(demand.start_date);

      }

      return `${formatDate(demand.start_date)} — ${formatDate(

        demand.end_date

      )}`;

    }

    return formatDate(demand.start_date || demand.end_date);

  }, [demand]);

  const currentRevision = Number(demand?.revision ?? 1);
  const offerRevision = Number(existingOffer?.intent_revision ?? 1);
  const offerIsCurrent = offerRevision === currentRevision;
  const canEditOffer = demand?.status === "open" && existingOffer?.status === "pending" && offerIsCurrent;
  const canResubmitOffer = demand?.status === "open" && (
    existingOffer?.status === "withdrawn" ||
    (existingOffer?.status === "rejected" && offerRevision < currentRevision)
  );

  const canSubmit = useMemo(() => {
    if (!demand || demand.status !== "open") return false;
    if (existingOffer && !editingOffer) return false;
    if (existingOffer && editingOffer && !(
      (existingOffer.status === "pending" && Number(existingOffer.intent_revision ?? 1) === Number(demand.revision ?? 1)) ||
      existingOffer.status === "withdrawn" ||
      (existingOffer.status === "rejected" && Number(existingOffer.intent_revision ?? 1) < Number(demand.revision ?? 1))
    )) return false;
    const numericPrice = price === "" ? null : Number(price);
    if (numericPrice !== null && (!Number.isFinite(numericPrice) || numericPrice < 0)) return false;
    return Boolean(message.trim() || numericPrice !== null || packageId || eventId);
  }, [demand, existingOffer, editingOffer, message, price, packageId, eventId]);

  async function handleSubmit(event) {

    event.preventDefault();

    if (!canSubmit || submitting) return;

    setSubmitting(true);

    setError("");

    try {

      const numericPrice =

        price === "" ? null : Number(price);

      const isEditing = existingOffer?.status === "pending" && editingOffer;
      const selectedEvent = eventId ? Number(eventId) : null;
      // Biramo event RPC samo kada je događaj trenutno izabran.
      // Ako je uklonjen, obični RPC briše stari event_id (SQL 5.10)
      // i po potrebi čuva novi package_id.
      const useEventRpc = selectedEvent !== null;
      const rpcName = isEditing
        ? (useEventRpc ? "manage_adventure_event_offer" : "manage_adventure_offer")
        : (selectedEvent !== null ? "create_adventure_event_offer" : "create_adventure_offer");
      const args = isEditing
        ? (useEventRpc
            ? { p_response_id: existingOffer.id, p_event_id: selectedEvent, p_message: message.trim() || null, p_proposed_price: numericPrice, p_currency: currency || "RSD" }
            : { p_response_id: existingOffer.id, p_action: "edit", p_message: message.trim() || null, p_proposed_price: numericPrice, p_currency: currency || "RSD", p_package_id: packageId || null })
        : (selectedEvent !== null
            ? { p_intent_id: id, p_event_id: selectedEvent, p_message: message.trim() || null, p_proposed_price: numericPrice, p_currency: currency || "RSD" }
            : { p_intent_id: id, p_message: message.trim() || null, p_proposed_price: numericPrice, p_currency: currency || "RSD", p_package_id: packageId || null });
      const { error: rpcError } = await supabase.rpc(rpcName, args);

      if (rpcError) throw rpcError;

      setSuccess(true);
      setEditingOffer(false);
      await loadPage();
    } catch (submitError) {

      console.error("Adventure offer submit error:", submitError);

      setError(

        submitError.message ||

          "Ponuda trenutno nije mogla da bude poslata."

      );

    } finally {

      setSubmitting(false);

    }

  }

  async function handleReject() {

    if (!id || !user?.id || existingOffer?.status === "pending" || existingOffer?.status === "accepted" || rejecting) return;

    const confirmed = window.confirm(

      "Odbiti ovu potražnju? Nestaće sa tvog aktivnog Host Dashboarda."

    );

    if (!confirmed) return;

    setRejecting(true);

    setError("");

    try {

      const { error: rpcError } = await supabase.rpc(

        "reject_adventure_demand",

        {

          p_intent_id: id,

        }

      );

      if (rpcError) throw rpcError;

      // RPC samo sakriva zahtev ovom hostu; ne kreira odbijenu ponudu.
      navigate("/marketplace", { replace: true });

    } catch (rejectError) {

      console.error("Adventure demand reject error:", rejectError);

      setError(

        rejectError?.message ||

          "Potražnju trenutno nije moguće odbiti."

      );

    } finally {

      setRejecting(false);

    }

  }

  if (authLoading || loading) {

    return <LoadingState />;

  }

  return (

    <>

      <Styles />

      <main className="demandPage">

        <div className="pageShell">

          <button

            type="button"

            className="backButton"

            onClick={() => navigate(-1)}

          >

            <Icon name="arrowLeft" size={17} />

            Nazad

          </button>

          {error && !demand ? (

            <section className="fatalCard">

              <span>

                <Icon name="alert" size={26} />

              </span>

              <small>Potražnja nije dostupna</small>

              <h1>Ne možemo da otvorimo ovaj zahtev.</h1>

              <p>{error}</p>

              <Link to="/notifications">

                Nazad na obaveštenja

                <Icon name="arrowRight" size={16} />

              </Link>

            </section>

          ) : (

            <>

              <style>{`.premiumRequester{max-width:1100px;margin:8px auto 12px;display:flex;justify-content:space-between;align-items:center;gap:12px;background:#fff;border:1px solid #e1e9e0;border-radius:14px;padding:10px 14px}.premiumRequesterIdentity{display:flex;align-items:center;gap:10px;min-width:0}.premiumRequesterIdentity img,.premiumRequesterFallback{width:44px;height:44px;border-radius:50%;object-fit:cover;background:#e1eee0;display:grid;place-items:center;font-weight:800;color:#20513a}.premiumRequesterIdentity strong{display:block;font-size:13px;color:#1e3828}.premiumRequesterIdentity small{display:block;font-size:11px;color:#718274;margin-top:2px}.premiumRequesterLink{font-size:12px;font-weight:800;color:#28563b;text-decoration:none;white-space:nowrap}@media(max-width:500px){.premiumRequester{margin:7px 9px;padding:9px 11px}.premiumRequesterLink{font-size:10px}}`}</style>
              {requesterProfile && <div className="premiumRequester"><div className="premiumRequesterIdentity">{requesterProfile.avatar_url ? <img src={requesterProfile.avatar_url} alt=""/> : <span className="premiumRequesterFallback">{(requesterProfile.full_name||"K").charAt(0)}</span>}<div><strong>{requesterProfile.full_name||requesterProfile.username||"Korisnik"}</strong><small>{requesterProfile.city||"MeetOutdoors korisnik"}{requesterProfile.is_verified?" · Verifikovan":""}</small></div></div>{requesterProfile.username && <Link to={`/u/${requesterProfile.username}`} className="premiumRequesterLink">Pogledaj profil →</Link>}</div>}
              <section className="hero">

                <div className="heroTop">

                  <span className="heroBadge">

                    <Icon name="sparkle" size={15} />

                    Agent · nova prilika

                  </span>

                  <span

                    className={`statusBadge ${

                      demand?.status === "open" ? "open" : "closed"

                    }`}

                  >

                    <span />

                    {demand?.status === "open"

                      ? "Potražnja je aktivna"

                      : demand?.status === "matched"
                        ? "Ponuda je izabrana"
                        : "Potražnja je zatvorena"}

                  </span>

                </div>

                <div className="heroGrid">

                  <div className="heroCopy">

                    <span className="eyebrow">Outdoor potražnja</span>

                    <h1>

                      {demand?.activity || "Nova avantura"}

                    </h1>

                    <p>

                      Neko želi da izađe napolje. Ako ovo možeš

                      kvalitetno da organizuješ, pošalji konkretnu

                      ponudu — bez spama i bez nagađanja.

                    </p>

                  </div>

                  <div className="opportunityCard">

                    <span className="opportunityLabel">

                      Potencijal po osobi

                    </span>

                    <strong>

                      {formatMoney(

                        demand?.budget_per_person,

                        demand?.currency

                      )}

                    </strong>

                    <small>

                      Budžet korisnika je signal, ne obaveza.

                      Ponudi realnu cenu za iskustvo koje možeš

                      da isporučiš.

                    </small>

                  </div>

                </div>

              </section>

              <section className="mainGrid">

                <div className="leftColumn">

                  <section className="panel detailsPanel">

                    <header className="panelHeader">

                      <div>

                        <span className="sectionKicker">

                          Šta korisnik traži

                        </span>

                        <h2>Kontekst pre ponude.</h2>

                      </div>

                      <span className="privacyBadge">

                        <Icon name="shield" size={15} />

                        Privatnost zaštićena

                      </span>

                    </header>

                    <div className="detailsGrid">

                      <DetailItem

                        icon="mountain"

                        label="Aktivnost"

                        value={demand?.activity || "Nije navedeno"}

                        strong

                      />

                      <DetailItem

                        icon="mapPin"

                        label="Lokacija"

                        value={

                          demand?.location_text || "Nije navedeno"

                        }

                      />

                      <DetailItem

                        icon="calendar"

                        label="Termin"

                        value={dateText}

                      />

                      <DetailItem

                        icon="users"

                        label="Broj osoba"

                        value={`${demand?.people_count || 1}`}

                      />

                      <DetailItem

                        icon="wallet"

                        label="Budžet po osobi"

                        value={formatMoney(

                          demand?.budget_per_person,

                          demand?.currency

                        )}

                      />

                      <DetailItem

                        icon="mountain"

                        label="Težina"

                        value={difficultyLabel(demand?.difficulty)}

                      />

                      <DetailItem

                        icon="car"

                        label="Prevoz"

                        value={

                          demand?.has_car === true

                            ? "Korisnik ima auto"

                            : demand?.has_car === false

                              ? "Bez sopstvenog auta"

                              : "Nije navedeno"

                        }

                      />

                    </div>

                    <div className="privacyNote">

                      <span>

                        <Icon name="shield" size={18} />

                      </span>

                      <div>

                        <strong>Identitet korisnika nije prikazan.</strong>

                        <p>

                          MeetOutdoors ti pokazuje samo podatke potrebne

                          da proceniš da li možeš da ispuniš zahtev.

                          Kontakt dolazi tek kroz nastavak dogovora.

                        </p>

                      </div>

                    </div>

                  </section>

                  <section className="panel signalPanel">

                    <span className="sectionKicker">Zašto ovo vredi</span>

                    <h2>Ovo nije hladan lead.</h2>

                    <p>

                      Korisnik je već rekao šta želi, gde želi da ide,

                      sa koliko ljudi i kakav budžet ima. Tvoj posao je

                      samo da odgovoriš dobrom, konkretnom ponudom.

                    </p>

                    <div className="signalSteps">

                      <article>

                        <span>01</span>

                        <strong>Razumi zahtev</strong>

                        <small>

                          Termin, lokacija, grupa i očekivanja su već

                          definisani.

                        </small>

                      </article>

                      <article>

                        <span>02</span>

                        <strong>Pošalji ponudu</strong>

                        <small>

                          Kratko objasni iskustvo, cenu i šta dobija.

                        </small>

                      </article>

                      <article>

                        <span>03</span>

                        <strong>Dogovorite avanturu</strong>

                        <small>

                          Ako korisnik prihvati, dobija signal da nastavi

                          sa tobom.

                        </small>

                      </article>

                    </div>

                  </section>

                </div>

                <aside className="offerPanel">

                  <div className="offerSticky">

                    {(success || existingOffer) && !editingOffer ? (

                      <div className="sentState">

                        <span className="sentIcon">

                          <Icon name="check" size={25} />

                        </span>

                        <span className="sectionKicker">

                          {existingOffer?.status === "accepted"

                            ? "Dogovor potvrđen"

                            : existingOffer?.status === "rejected"

                              ? "Ponuda završena"

                              : "Ponuda poslata"}

                        </span>

                        <h2>

                          {existingOffer?.status === "accepted"

                            ? "Korisnik je izabrao tvoju ponudu."

                            : existingOffer?.status === "rejected"

                              ? "Korisnik je izabrao drugu opciju."

                              : "Sada je red na korisnika."}

                        </h2>

                        <p>

                          {existingOffer?.status === "accepted"

                            ? "Kontakt je otključan samo za tebe. Javi se korisniku i završite detalje avanture."

                            : existingOffer?.status === "rejected"

                              ? "Ova ponuda više nije aktivna. Kontakt korisnika nije dostupan."

                              : "Tvoja ponuda je poslata. Korisnik može da je prihvati ili odbije, a ti ćeš dobiti novo obaveštenje kada odluči."}

                        </p>

                        <div className="offerSummary">

                          {existingOffer?.proposed_price !== null &&

                            existingOffer?.proposed_price !==

                              undefined && (

                              <div>

                                <small>Ponuđena cena</small>

                                <strong>

                                  {formatMoney(

                                    existingOffer.proposed_price,

                                    existingOffer.currency

                                  )}

                                </strong>

                              </div>

                            )}

                          {existingOffer?.message && (

                            <div>

                              <small>Tvoja poruka</small>

                              <p>{existingOffer.message}</p>

                            </div>

                          )}

                          <div>

                            <small>Status</small>

                            <strong className="pendingStatus">

                              {existingOffer?.status === "accepted"

                                ? "Prihvaćena"

                                : existingOffer?.status === "rejected"

                                  ? "Odbijena"

                                  : existingOffer?.status === "withdrawn"

                                    ? "Povučena"

                                    : "Čeka odgovor"}

                            </strong>

                          </div>

                        </div>

                        {canEditOffer && (
                          <div className="moManageActions">
                            <button type="button" onClick={() => { setEditingOffer(true); setSuccess(false); setError(""); }}>Uredi ponudu</button>
                            <button type="button" disabled={managingOffer} onClick={async () => {
                              if (!canEditOffer || !window.confirm("Povući poslatu ponudu?")) return;
                              setManagingOffer(true); setError("");
                              try {
                                const { error: e } = await supabase.rpc("manage_adventure_offer", {
                                  p_response_id: existingOffer.id, p_action: "withdraw"
                                });
                                if (e) throw e;
                                await loadPage();
                              } catch (e) { setError(e.message || "Ponuda nije povučena."); }
                              finally { setManagingOffer(false); }
                            }}>{managingOffer ? "Povlačim..." : "Povuci ponudu"}</button>
                          </div>
                        )}
                        {canResubmitOffer && existingOffer?.status === "withdrawn" && (
                          <div className="moManageActions"><button type="button" onClick={() => { setEditingOffer(true); setSuccess(false); setError(""); }}>Pošalji novu ponudu</button></div>
                        )}
                        {canResubmitOffer && existingOffer?.status === "rejected" && (
                          <div className="moManageActions"><button type="button" onClick={() => { setEditingOffer(true); setSuccess(false); setError(""); }}>Ponudi za izmenjen zahtev</button></div>
                        )}
                        {existingOffer?.status === "accepted" && existingOffer?.accepted_contact_phone && (

                            <div className="acceptedContactCard">

                              <div className="acceptedContactTop">

                                <span className="acceptedContactIcon">

                                  <Icon name="user" size={21} />

                                </span>

                                <div>

                                  <small>Korisnik koji je prihvatio</small>

                                  <strong>

                                    {acceptedUser?.full_name ||

                                      acceptedUser?.username ||

                                      "MeetOutdoors korisnik"}

                                  </strong>

                                  {(acceptedUser?.city || acceptedUser?.country) && (

                                    <span>

                                      {[acceptedUser?.city, acceptedUser?.country]

                                        .filter(Boolean)

                                        .join(", ")}

                                    </span>

                                  )}

                                </div>

                              </div>

                              <div className="acceptedPhone">

                                <span>

                                  <Icon name="phone" size={18} />

                                </span>

                                <div>

                                  <small>Broj za dogovor</small>

                                  <strong>

                                    {existingOffer.accepted_contact_phone}

                                  </strong>

                                </div>

                              </div>

                              <div className="acceptedContactActions">

                                <a

                                  href={`tel:${existingOffer.accepted_contact_phone}`}

                                  className="callAction"

                                >

                                  <Icon name="phone" size={16} />

                                  Pozovi korisnika

                                </a>

                                {acceptedUser?.username && (

                                  <Link

                                    to={`/u/${acceptedUser.username}`}

                                    className="userProfileAction"

                                  >

                                    Profil

                                    <Icon name="arrowRight" size={15} />

                                  </Link>

                                )}

                              </div>

                              <div className="acceptedPrivacy">

                                <Icon name="shield" size={15} />

                                <span>

                                  Ovaj kontakt je korisnik podelio tek nakon

                                  prihvatanja tvoje ponude.

                                </span>

                              </div>

                            </div>

                          )}

                        <button
                          type="button"
                          className="secondaryAction"
                          onClick={loadPage}
                          disabled={loading || submitting || managingOffer}
                          style={{ cursor: "pointer", border: "1px solid #d9e1d6", background: "#f6faf4" }}
                        >
                          <Icon name="clock" size={16} />
                          Osveži status ponude
                        </button>

                        <Link

                          to="/notifications"

                          className="secondaryAction"

                        >

                          Obaveštenja

                          <Icon name="arrowRight" size={16} />

                        </Link>

                      </div>

                    ) : demand?.status !== "open" ? (

                      <div className="closedState">

                        <span>

                          <Icon name="clock" size={24} />

                        </span>

                        <h2>Ova prilika više nije aktivna.</h2>

                        <p>

                          Korisnik je već pronašao opciju ili je

                          potražnja zatvorena.

                        </p>

                      </div>

                    ) : (

                      <form onSubmit={handleSubmit}>

                        <div className="formIntro">

                          <span className="sectionKicker">

                            Tvoja ponuda

                          </span>

                          <h2>Mogu da ponudim ovo.</h2>

                          <p>

                            Napiši dovoljno da korisnik odmah razume

                            zašto bi izabrao baš tebe.

                          </p>

                        </div>

                        {error && (

                          <div className="formError" role="alert">

                            <Icon name="alert" size={17} />

                            <span>{error}</span>

                          </div>

                        )}

                        <label className="field">

                          <span>

                            Poruka korisniku

                            <small>preporučeno</small>

                          </span>

                          <textarea

                            value={message}

                            onChange={(event) =>

                              setMessage(event.target.value)

                            }

                            placeholder="Npr. Mogu da organizujem vođenu turu u subotu. Tura traje oko 5 sati, uključuje vodiča i pauzu za ručak..."

                            maxLength={2000}

                            rows={6}

                          />

                          <small className="fieldHint">

                            {message.length}/2000

                          </small>

                        </label>

                        <div className="priceRow">

                          <label className="field">

                            <span>Cena po osobi</span>

                            <div className="priceInput">

                              <input

                                type="number"

                                min="0"

                                step="1"

                                inputMode="decimal"

                                value={price}

                                onChange={(event) =>

                                  setPrice(event.target.value)

                                }

                                placeholder="npr. 4500"

                              />

                              <select

                                value={currency}

                                onChange={(event) =>

                                  setCurrency(event.target.value)

                                }

                              >

                                <option value="RSD">RSD</option>

                                <option value="EUR">EUR</option>

                              </select>

                            </div>

                          </label>

                        </div>

                        <label className="field">
                          <span>Poveži postojeći događaj <small>opciono</small></span>
                          <select className="packageSelect" value={eventId}
                            onChange={(e) => { setEventId(e.target.value); if (e.target.value) setPackageId(""); }}>
                            <option value="">Bez povezanog događaja</option>
                            {events.map((item) => (
                              <option key={item.id} value={String(item.id)}>
                                {item.title}{item.location ? ` · ${item.location}` : ""}
                              </option>
                            ))}
                          </select>
                          <small className="fieldHint left">Izaberi jedan od svojih aktivnih događaja.</small>
                        </label>

                        <label className="field">

                          <span>

                            Poveži postojeći paket

                            <small>opciono</small>

                          </span>

                          <select

                            className="packageSelect"

                            value={packageId}

                            onChange={(event) => {
                              setPackageId(event.target.value);
                              if (event.target.value) setEventId("");
                            }}

                          >

                            <option value="">

                              Bez povezanog paketa

                            </option>

                            {packages.map((item) => (

                              <option

                                key={item.id}

                                value={item.id}

                              >

                                {item.title}

                                {item.price !== null &&

                                item.price !== undefined

                                  ? ` · ${formatMoney(

                                      item.price,

                                      item.currency

                                    )}`

                                  : ""}

                              </option>

                            ))}

                          </select>

                          <small className="fieldHint left">

                            Ako već imaš odgovarajući paket, korisnik

                            će moći da vidi njegove detalje.

                          </small>

                        </label>

                        <div className="submitNote">

                          <Icon name="shield" size={16} />

                          <span>

                            Jedna jasna ponuda je bolja od deset

                            generičkih poruka.

                          </span>

                        </div>

                        <button

                          type="submit"

                          className="submitButton"

                          disabled={!canSubmit || submitting}

                        >

                          {submitting ? (

                            <>

                              <span className="buttonLoader" />

                              Šaljem ponudu...

                            </>

                          ) : (

                            <>

                              Pošalji ponudu

                              <Icon name="send" size={17} />

                            </>

                          )}

                        </button>

                        {!canSubmit && !submitting && (

                          <small className="submitHint">

                            Dodaj poruku, cenu ili poveži paket da bi

                            ponuda bila konkretna.

                          </small>

                        )}

                        {editingOffer && (
                          <button type="button" className="rejectDemandButton" onClick={() => { setEditingOffer(false); setError(""); }}>
                            Otkaži izmene
                          </button>
                        )}
                        {!editingOffer && <>
                        <div className="offerDecisionDivider">

                          <span>ili</span>

                        </div>

                        <button

                          type="button"

                          className="rejectDemandButton"

                          onClick={handleReject}

                          disabled={submitting || rejecting}

                        >

                          {rejecting ? (

                            <>

                              <span className="buttonLoader dark" />

                              Odbijam zahtev...

                            </>

                          ) : (

                            <>

                              <Icon name="x" size={17} />

                              Odbij ovu potražnju

                            </>

                          )}

                        </button>

                        <small className="rejectDemandHint">

                          Ako ovo nije za tebe, odbij zahtev i više se

                          neće prikazivati u aktivnom dashboardu.

                        </small>

                        </>}
                      </form>

                    )}

                  </div>

                </aside>

              </section>

            </>

          )}

        </div>

      </main>

    </>

  );

}

function Styles() {

  return (

    <style>{`

      .moManageActions{display:flex;gap:9px;flex-wrap:wrap;margin:18px 0 6px}
      .moManageActions button{border:1px solid #b9cdb9;background:#173e2d;color:#fff;border-radius:10px;padding:11px 15px;font-weight:750;cursor:pointer}
      .moManageActions button+button{background:#fff;color:#375743}
      * { box-sizing: border-box; }

      body {

        margin: 0;

        background: #f2f4ef;

      }

      button,

      input,

      textarea,

      select {

        font: inherit;

      }

      .demandPage,

      .statePage {

        min-height: 100vh;

        font-family:

          Inter,

          ui-sans-serif,

          system-ui,

          -apple-system,

          BlinkMacSystemFont,

          "Segoe UI",

          sans-serif;

        color: #20342a;

      }

      .demandPage {

        padding: 112px 24px 70px;

        background:

          radial-gradient(circle at 8% 0%, rgba(191, 225, 151, .24), transparent 28%),

          radial-gradient(circle at 92% 18%, rgba(58, 107, 73, .12), transparent 28%),

          linear-gradient(180deg, #f8f9f5 0%, #edf1e9 100%);

      }

      .demandPage a {

        color: inherit;

        text-decoration: none;

      }

      .pageShell {

        width: min(1220px, 100%);

        margin: 0 auto;

      }

      .backButton {

        display: inline-flex;

        align-items: center;

        gap: 8px;

        margin-bottom: 16px;

        padding: 10px 13px;

        border: 1px solid #d8e0d5;

        border-radius: 12px;

        background: rgba(255,255,255,.72);

        color: #53665a;

        cursor: pointer;

        font-size: 10px;

        font-weight: 850;

        box-shadow: 0 8px 20px rgba(31,53,38,.04);

      }

      .hero {

        position: relative;

        overflow: hidden;

        min-height: 390px;

        padding: 34px;

        border-radius: 34px;

        background:

          radial-gradient(circle at 86% 12%, rgba(201, 241, 146, .14), transparent 24%),

          linear-gradient(135deg, #0a2518, #123a26 54%, #2d6242);

        color: white;

        box-shadow: 0 30px 80px rgba(28, 58, 40, .18);

      }

      .hero::before {

        content: "";

        position: absolute;

        width: 520px;

        height: 520px;

        right: -220px;

        top: -230px;

        border-radius: 50%;

        border: 1px solid rgba(255,255,255,.08);

        box-shadow:

          0 0 0 75px rgba(255,255,255,.025),

          0 0 0 150px rgba(255,255,255,.015);

        pointer-events: none;

      }

      .heroTop,

      .panelHeader {

        display: flex;

        align-items: center;

        justify-content: space-between;

        gap: 14px;

      }

      .heroBadge,

      .statusBadge,

      .privacyBadge {

        display: inline-flex;

        align-items: center;

        gap: 7px;

        border-radius: 999px;

        font-size: 9px;

        font-weight: 900;

        letter-spacing: .08em;

        text-transform: uppercase;

      }

      .heroBadge {

        padding: 9px 12px;

        border: 1px solid rgba(255,255,255,.13);

        background: rgba(255,255,255,.07);

        color: rgba(255,255,255,.74);

      }

      .statusBadge {

        padding: 9px 12px;

        border: 1px solid rgba(255,255,255,.10);

        background: rgba(255,255,255,.06);

        color: rgba(255,255,255,.65);

      }

      .statusBadge > span {

        width: 7px;

        height: 7px;

        border-radius: 50%;

      }

      .statusBadge.open > span {

        background: #c8ef8d;

        box-shadow: 0 0 0 5px rgba(200,239,141,.10);

      }

      .statusBadge.closed > span {

        background: #d8c5b5;

      }

      .heroGrid {

        position: relative;

        z-index: 1;

        display: grid;

        grid-template-columns: minmax(0, 1.3fr) minmax(280px, .7fr);

        gap: 46px;

        align-items: end;

        margin-top: 74px;

      }

      .heroCopy {

        max-width: 760px;

      }

      .eyebrow,

      .sectionKicker {

        display: block;

        font-size: 9px;

        font-weight: 900;

        letter-spacing: .13em;

        text-transform: uppercase;

      }

      .eyebrow {

        color: #c7ee94;

      }

      .hero h1 {

        margin: 13px 0 0;

        font-size: clamp(50px, 7vw, 86px);

        line-height: .9;

        letter-spacing: -.075em;

      }

      .heroCopy p {

        max-width: 650px;

        margin: 22px 0 0;

        color: rgba(255,255,255,.59);

        font-size: 13px;

        line-height: 1.75;

      }

      .opportunityCard {

        padding: 22px;

        border: 1px solid rgba(255,255,255,.11);

        border-radius: 22px;

        background: rgba(255,255,255,.07);

        backdrop-filter: blur(18px);

      }

      .opportunityLabel {

        display: block;

        color: rgba(255,255,255,.48);

        font-size: 8px;

        font-weight: 900;

        letter-spacing: .1em;

        text-transform: uppercase;

      }

      .opportunityCard > strong {

        display: block;

        margin-top: 9px;

        color: #e0f8bb;

        font-size: 29px;

        letter-spacing: -.05em;

      }

      .opportunityCard > small {

        display: block;

        margin-top: 11px;

        color: rgba(255,255,255,.48);

        font-size: 9px;

        line-height: 1.6;

      }

      .mainGrid {

        display: grid;

        grid-template-columns: minmax(0, 1fr) 390px;

        gap: 18px;

        align-items: start;

        margin-top: 18px;

      }

      .leftColumn {

        display: grid;

        gap: 18px;

      }

      .panel,

      .offerSticky {

        border: 1px solid #dbe3d8;

        background: rgba(255,255,255,.82);

        box-shadow: 0 16px 44px rgba(31,51,38,.055);

      }

      .panel {

        padding: 28px;

        border-radius: 27px;

      }

      .sectionKicker {

        color: #779656;

      }

      .panelHeader {

        align-items: flex-start;

      }

      .panelHeader h2,

      .signalPanel h2,

      .formIntro h2,

      .sentState h2,

      .closedState h2 {

        margin: 8px 0 0;

        color: #20372a;

        font-size: clamp(27px, 4vw, 38px);

        line-height: .98;

        letter-spacing: -.055em;

      }

      .privacyBadge {

        flex: 0 0 auto;

        padding: 9px 11px;

        background: #edf4e8;

        color: #587345;

      }

      .detailsGrid {

        display: grid;

        grid-template-columns: repeat(2, minmax(0,1fr));

        gap: 10px;

        margin-top: 25px;

      }

      .detailItem {

        display: flex;

        align-items: center;

        gap: 13px;

        min-height: 83px;

        padding: 14px;

        border: 1px solid #e0e6de;

        border-radius: 17px;

        background: #f8faf6;

      }

      .detailIcon {

        display: grid;

        place-items: center;

        flex: 0 0 auto;

        width: 43px;

        height: 43px;

        border-radius: 13px;

        background: #e8f1df;

        color: #5c7d43;

      }

      .detailItem small,

      .detailItem strong {

        display: block;

      }

      .detailItem small {

        color: #8a958d;

        font-size: 8px;

        font-weight: 800;

        letter-spacing: .06em;

        text-transform: uppercase;

      }

      .detailItem strong {

        margin-top: 5px;

        color: #405348;

        font-size: 11px;

        line-height: 1.35;

      }

      .detailItem strong.emphasis {

        color: #22442f;

        font-size: 13px;

      }

      .privacyNote {

        display: flex;

        gap: 12px;

        margin-top: 14px;

        padding: 15px;

        border: 1px solid #dce7d5;

        border-radius: 17px;

        background: #f0f6eb;

      }

      .privacyNote > span {

        display: grid;

        place-items: center;

        flex: 0 0 auto;

        width: 36px;

        height: 36px;

        border-radius: 11px;

        background: #dfebd8;

        color: #5f7e48;

      }

      .privacyNote strong {

        display: block;

        color: #4a654f;

        font-size: 10px;

      }

      .privacyNote p {

        margin: 5px 0 0;

        color: #7b897e;

        font-size: 9px;

        line-height: 1.55;

      }

      .signalPanel > p {

        max-width: 690px;

        margin: 13px 0 0;

        color: #7b887f;

        font-size: 11px;

        line-height: 1.7;

      }

      .signalSteps {

        display: grid;

        grid-template-columns: repeat(3, minmax(0,1fr));

        gap: 10px;

        margin-top: 22px;

      }

      .signalSteps article {

        padding: 17px;

        border: 1px solid #e0e6de;

        border-radius: 17px;

        background: #f8faf7;

      }

      .signalSteps article > span {

        color: #8daa66;

        font-size: 9px;

        font-weight: 900;

      }

      .signalSteps strong,

      .signalSteps small {

        display: block;

      }

      .signalSteps strong {

        margin-top: 18px;

        color: #405448;

        font-size: 11px;

      }

      .signalSteps small {

        margin-top: 6px;

        color: #8a958e;

        font-size: 8px;

        line-height: 1.55;

      }

      .offerPanel {

        min-width: 0;

      }

      .offerSticky {

        position: sticky;

        top: 94px;

        padding: 23px;

        border-radius: 26px;

      }

      .formIntro p,

      .sentState > p,

      .closedState > p {

        margin: 11px 0 0;

        color: #7f8c83;

        font-size: 10px;

        line-height: 1.65;

      }

      .formError {

        display: flex;

        align-items: flex-start;

        gap: 8px;

        margin-top: 16px;

        padding: 12px;

        border: 1px solid #efc9c3;

        border-radius: 13px;

        background: #fff0ee;

        color: #95453a;

        font-size: 9px;

        line-height: 1.5;

      }

      .field {

        display: block;

        margin-top: 17px;

      }

      .field > span {

        display: flex;

        align-items: center;

        justify-content: space-between;

        gap: 8px;

        color: #53675a;

        font-size: 9px;

        font-weight: 900;

      }

      .field > span small {

        color: #9aa49d;

        font-size: 7px;

        font-weight: 800;

        letter-spacing: .04em;

        text-transform: uppercase;

      }

      .field textarea,

      .field input,

      .field select {

        width: 100%;

        outline: none;

        border: 1px solid #d9e1d6;

        background: #fbfcfa;

        color: #33493b;

        transition: .18s ease;

      }

      .field textarea {

        display: block;

        min-height: 138px;

        margin-top: 8px;

        padding: 13px;

        resize: vertical;

        border-radius: 14px;

        font-size: 10px;

        line-height: 1.65;

      }

      .field textarea:focus,

      .field input:focus,

      .field select:focus {

        border-color: #91ad77;

        background: white;

        box-shadow: 0 0 0 4px rgba(132,167,103,.10);

      }

      .field textarea::placeholder,

      .field input::placeholder {

        color: #a4ada6;

      }

      .fieldHint {

        display: block;

        margin-top: 5px;

        color: #9aa39c;

        font-size: 7px;

        text-align: right;

      }

      .fieldHint.left {

        text-align: left;

        line-height: 1.45;

      }

      .priceInput {

        display: grid;

        grid-template-columns: minmax(0,1fr) 90px;

        gap: 7px;

        margin-top: 8px;

      }

      .priceInput input,

      .priceInput select,

      .packageSelect {

        height: 45px;

        padding: 0 12px;

        border-radius: 13px;

        font-size: 10px;

      }

      .packageSelect {

        margin-top: 8px;

      }

      .submitNote {

        display: flex;

        align-items: flex-start;

        gap: 8px;

        margin-top: 17px;

        padding: 11px;

        border-radius: 13px;

        background: #f0f5ec;

        color: #71816f;

        font-size: 8px;

        line-height: 1.45;

      }

      .submitButton,

      .secondaryAction {

        display: inline-flex;

        align-items: center;

        justify-content: center;

        gap: 8px;

        width: 100%;

        min-height: 49px;

        margin-top: 13px;

        border-radius: 14px;

        font-size: 10px;

        font-weight: 900;

      }

      .submitButton {

        border: 0;

        background: linear-gradient(135deg, #133a27, #2c6544);

        color: white;

        cursor: pointer;

        box-shadow: 0 14px 28px rgba(31,75,50,.18);

      }

      .submitButton:hover:not(:disabled) {

        transform: translateY(-1px);

      }

      .submitButton:disabled {

        cursor: not-allowed;

        opacity: .46;

        box-shadow: none;

      }

      .buttonLoader {

        width: 15px;

        height: 15px;

        border: 2px solid rgba(255,255,255,.35);

        border-top-color: white;

        border-radius: 50%;

        animation: spin .75s linear infinite;

      }

      .submitHint {

      .offerDecisionDivider{

        display:flex;

        align-items:center;

        gap:10px;

        margin:16px 0 12px;

        color:#9aa49d;

        font-size:8px;

        font-weight:900;

        text-transform:uppercase;

        letter-spacing:.12em;

      }

      .offerDecisionDivider::before,

      .offerDecisionDivider::after{

        content:"";

        flex:1;

        height:1px;

        background:#e1e6df;

      }

      .rejectDemandButton{

        display:flex;

        align-items:center;

        justify-content:center;

        gap:8px;

        width:100%;

        min-height:46px;

        border:1px solid #e5d2cd;

        border-radius:14px;

        background:#fff8f6;

        color:#97483d;

        font-size:10px;

        font-weight:900;

        cursor:pointer;

        transition:.18s ease;

      }

      .rejectDemandButton:hover{

        border-color:#d5a69d;

        background:#fff0ed;

        transform:translateY(-1px);

      }

      .rejectDemandButton:disabled{

        opacity:.58;

        cursor:not-allowed;

        transform:none;

      }

      .rejectDemandHint{

        display:block;

        margin-top:8px;

        color:#929c95;

        font-size:8px;

        line-height:1.5;

        text-align:center;

      }

        display: block;

        margin-top: 7px;

        color: #9aa49d;

        font-size: 7px;

        line-height: 1.4;

        text-align: center;

      }

      .sentState,

      .closedState {

        text-align: center;

      }

      .sentIcon,

      .closedState > span {

        display: grid;

        place-items: center;

        width: 58px;

        height: 58px;

        margin: 0 auto 18px;

        border-radius: 18px;

      }

      .sentIcon {

        background: #e4f1dc;

        color: #4f793b;

        box-shadow: 0 10px 26px rgba(75,120,58,.12);

      }

      .closedState > span {

        background: #edf0eb;

        color: #748078;

      }

      .offerSummary {

        display: grid;

        gap: 8px;

        margin-top: 18px;

        text-align: left;

      }

      .offerSummary > div {

        padding: 13px;

        border: 1px solid #e0e6de;

        border-radius: 14px;

        background: #f8faf7;

      }

      .offerSummary small,

      .offerSummary strong {

        display: block;

      }

      .offerSummary small {

        color: #919c94;

        font-size: 7px;

        font-weight: 850;

        letter-spacing: .05em;

        text-transform: uppercase;

      }

      .offerSummary strong {

        margin-top: 5px;

        color: #3e5445;

        font-size: 12px;

      }

      .offerSummary p {

        margin: 6px 0 0;

        color: #66756b;

        font-size: 9px;

        line-height: 1.55;

      }

      .pendingStatus {

        color: #6c874f !important;

      }

      .acceptedContactCard {

        margin-top: 14px;

        padding: 15px;

        border: 1px solid #bfd6b3;

        border-radius: 18px;

        background: linear-gradient(180deg, #f3faee, #eaf5e4);

        text-align: left;

        box-shadow: 0 12px 28px rgba(64, 104, 52, .08);

      }

      .acceptedContactTop {

        display: flex;

        align-items: center;

        gap: 11px;

      }

      .acceptedContactIcon {

        display: grid;

        place-items: center;

        width: 45px;

        height: 45px;

        flex: 0 0 45px;

        border-radius: 14px;

        background: #dcecd3;

        color: #4e7440;

      }

      .acceptedContactTop small,

      .acceptedContactTop strong,

      .acceptedContactTop span,

      .acceptedPhone small,

      .acceptedPhone strong {

        display: block;

      }

      .acceptedContactTop small,

      .acceptedPhone small {

        color: #80907f;

        font-size: 7px;

        font-weight: 900;

        letter-spacing: .06em;

        text-transform: uppercase;

      }

      .acceptedContactTop strong {

        margin-top: 4px;

        color: #31513a;

        font-size: 12px;

      }

      .acceptedContactTop > div > span {

        margin-top: 3px;

        color: #87948a;

        font-size: 8px;

      }

      .acceptedPhone {

        display: flex;

        align-items: center;

        gap: 10px;

        margin-top: 13px;

        padding: 12px;

        border: 1px solid #d4e2cd;

        border-radius: 14px;

        background: rgba(255,255,255,.78);

      }

      .acceptedPhone > span {

        display: grid;

        place-items: center;

        width: 35px;

        height: 35px;

        flex: 0 0 35px;

        border-radius: 11px;

        background: #e6f1df;

        color: #527943;

      }

      .acceptedPhone strong {

        margin-top: 4px;

        color: #294a33;

        font-size: 14px;

        letter-spacing: -.02em;

      }

      .acceptedContactActions {

        display: grid;

        grid-template-columns: 1fr auto;

        gap: 7px;

        margin-top: 9px;

      }

      .acceptedContactActions a {

        display: inline-flex;

        align-items: center;

        justify-content: center;

        gap: 7px;

        min-height: 42px;

        padding: 0 12px;

        border-radius: 12px;

        font-size: 8px;

        font-weight: 900;

      }

      .callAction {

        background: linear-gradient(135deg, #143b28, #306747);

        color: white !important;

        box-shadow: 0 10px 22px rgba(38,85,56,.14);

      }

      .userProfileAction {

        border: 1px solid #cedcc8;

        background: white;

        color: #526a56 !important;

      }

      .acceptedPrivacy {

        display: flex;

        align-items: flex-start;

        gap: 7px;

        margin-top: 10px;

        color: #70836e;

        font-size: 7px;

        line-height: 1.5;

      }

      .acceptedPrivacy svg {

        flex: 0 0 auto;

      }

      .secondaryAction {

        border: 1px solid #d9e2d6;

        background: #f8faf6;

        color: #486052;

      }

      .fatalCard,

      .stateCard {

        width: min(560px, 100%);

        margin: 70px auto 0;

        padding: 40px 30px;

        border: 1px solid #dce4d9;

        border-radius: 28px;

        background: rgba(255,255,255,.88);

        text-align: center;

        box-shadow: 0 20px 60px rgba(27,49,34,.08);

      }

      .fatalCard > span {

        display: grid;

        place-items: center;

        width: 62px;

        height: 62px;

        margin: 0 auto;

        border-radius: 19px;

        background: #f7e8e5;

        color: #985146;

      }

      .fatalCard > small {

        display: block;

        margin-top: 18px;

        color: #9a6e67;

        font-size: 8px;

        font-weight: 900;

        letter-spacing: .1em;

        text-transform: uppercase;

      }

      .fatalCard h1,

      .stateCard h1 {

        margin: 9px 0 0;

        color: #2a3f32;

        font-size: 30px;

        letter-spacing: -.045em;

      }

      .fatalCard p,

      .stateCard p {

        margin: 10px 0 0;

        color: #7f8b83;

        font-size: 10px;

        line-height: 1.6;

      }

      .fatalCard a {

        display: inline-flex;

        align-items: center;

        gap: 7px;

        margin-top: 20px;

        padding: 12px 15px;

        border-radius: 12px;

        background: #173c28;

        color: white;

        font-size: 9px;

        font-weight: 900;

      }

      .statePage {

        display: grid;

        place-items: center;

        padding: 110px 24px 30px;

        background:

          radial-gradient(circle at top left, rgba(177,214,137,.20), transparent 30%),

          #eff2ec;

      }

      .stateCard {

        display: grid;

        place-items: center;

        margin: 0;

      }

      .loader {

        width: 38px;

        height: 38px;

        border: 3px solid #dce5d7;

        border-top-color: #52783c;

        border-radius: 50%;

        animation: spin .8s linear infinite;

      }

      @keyframes spin {

        to { transform: rotate(360deg); }

      }

      @media (max-width: 980px) {

        .heroGrid,

        .mainGrid {

          grid-template-columns: 1fr;

        }

        .heroGrid {

          gap: 20px;

        }

        .opportunityCard {

          max-width: 420px;

        }

        .offerSticky {

          position: static;

        }

      }

      @media (max-width: 720px) {

        .demandPage {

          padding: 82px 0 56px;

        }

        .pageShell {

          width: 100%;

        }

        .backButton {

          margin-left: 16px;

        }

        .hero {

          min-height: 430px;

          padding: 22px;

          border-radius: 0 0 30px 30px;

        }

        .heroTop {

          align-items: flex-start;

          flex-direction: column;

        }

        .heroGrid {

          margin-top: 48px;

        }

        .hero h1 {

          font-size: 53px;

        }

        .mainGrid {

          padding: 0 16px;

        }

        .panel,

        .offerSticky {

          padding: 21px;

          border-radius: 22px;

        }

        .panelHeader {

          flex-direction: column;

        }

        .detailsGrid {

          grid-template-columns: 1fr;

        }

        .signalSteps {

          grid-template-columns: 1fr;

        }

      }

      @media (max-width: 440px) {

        .hero {

          padding: 19px;

        }

        .hero h1 {

          font-size: 46px;

        }

        .heroCopy p {

          font-size: 11px;

        }

        .opportunityCard {

          padding: 17px;

        }

        .mainGrid {

          padding: 0 12px;

        }

        .panel,

        .offerSticky {

          padding: 18px;

        }

        .privacyNote {

          align-items: flex-start;

        }

        .priceInput {

          grid-template-columns: 1fr 78px;

        }

        .acceptedContactActions {

          grid-template-columns: 1fr;

        }

      }

      /* MEETOUTDOORS / SIGNATURE HOST OFFER — DESIGN LAYER */
      .demandPage {
        min-height: 100vh;
        padding: 104px 22px 84px;
        background: radial-gradient(ellipse 65% 42% at 90% 0%, #dce9d8 0%, transparent 75%),
          radial-gradient(ellipse 40% 34% at 0% 35%, #e9eee4 0%, transparent 80%), #f6f8f4;
        color: #18342a;
      }
      .pageShell { width: min(1190px, 100%); }
      .backButton { margin-bottom: 16px; border-radius: 999px; border: 1px solid #dce6db;
        background: #fff; padding: 10px 16px; font-size: 12px; font-weight: 750;
        box-shadow: 0 3px 12px rgba(19,48,33,.035); }
      .backButton:hover { background: #eaf3e9; transform: translateX(-2px); }
      .hero { overflow: hidden; isolation: isolate; border: 1px solid #264f3b;
        border-radius: 25px; padding: 28px 32px 31px;
        background: radial-gradient(ellipse at 86% 12%, rgba(158,208,153,.21), transparent 38%),
          linear-gradient(125deg, #102b22 0%, #194631 60%, #24583c 100%);
        box-shadow: 0 22px 48px rgba(15,47,31,.15); }
      .hero::before { opacity: .26; }
      .heroTop { margin-bottom: 22px; }
      .heroBadge { background: rgba(233,255,226,.1); border: 1px solid rgba(222,255,221,.24);
        color: #e1f4d5; border-radius: 999px; font-size: 10px; font-weight: 750; letter-spacing: .035em; }
      .statusBadge { border-radius: 999px; background: rgba(255,255,255,.1);
        border: 1px solid rgba(255,255,255,.2); color: #f4fff1; font-size: 10px; }
      .heroGrid { grid-template-columns: minmax(0,1fr) minmax(240px,290px); gap: 30px; align-items: end; }
      .heroCopy .eyebrow { color: #c7e6b6; font-weight: 800; letter-spacing: .16em; }
      .hero h1 { font-size: clamp(30px, 3.1vw, 47px); line-height: 1.07; letter-spacing: -.045em;
        max-width: 650px; color: #fff; margin-bottom: 12px; }
      .heroCopy p { color: #d1e3d3; font-size: 12px; line-height: 1.7; max-width: 560px; }
      .opportunityCard { background: rgba(255,255,255,.095); border: 1px solid rgba(228,255,228,.22);
        border-radius: 20px; padding: 20px; backdrop-filter: blur(12px); box-shadow: none; }
      .opportunityCard > strong { color: #f6ffeb; font-size: clamp(24px,2.3vw,34px); letter-spacing: -.045em; }
      .opportunityCard > small { color: #d3e3d0; font-size: 10px; line-height: 1.6; }
      .mainGrid { grid-template-columns: minmax(0, 1fr) minmax(320px, 370px); gap: 16px; margin-top: 16px; }
      .leftColumn { gap: 16px; }
      .panel, .offerSticky { background: #fff; border: 1px solid #e0e8de;
        box-shadow: 0 9px 32px rgba(28,59,40,.045); }
      .panel { border-radius: 21px; padding: 26px; }
      .offerSticky { border-radius: 21px; padding: 24px; top: 96px; border-top: 4px solid #8fbb7c; }
      .panelHeader { gap: 12px; }
      .panelHeader h2 { color: #163a2b; letter-spacing: -.035em; }
      .sectionKicker { color: #668d6b; letter-spacing: .11em; font-weight: 850; }
      .privacyBadge { border-radius: 999px; background: #eff6ed; color: #436c4d; border: 1px solid #deead9; }
      .detailsGrid { gap: 10px; }
      .detailItem { border: 1px solid #e7ede4; border-radius: 15px; background: #fbfcfa;
        transition: border-color .18s ease, transform .18s ease, box-shadow .18s ease; }
      .detailItem:hover { border-color: #a9c7a3; transform: translateY(-2px);
        box-shadow: 0 8px 22px rgba(30,70,41,.06); }
      .detailIcon { background: #e9f3e7; color: #336747; border-radius: 12px; }
      .detailItem strong { color: #1b3a2c; }
      .field input, .field textarea, .field select { border: 1px solid #dce7db;
        border-radius: 12px; background: #fbfdfb; color: #193d2c; font-size: 13px; }
      .field input:focus, .field textarea:focus, .field select:focus { border-color: #5e9b66;
        box-shadow: 0 0 0 3px rgba(95,151,97,.11); outline: none; }
      .submitButton { border-radius: 13px; background: #184c32; color: white;
        box-shadow: 0 9px 20px rgba(23,78,49,.15); font-weight: 800; }
      .submitButton:hover:not(:disabled) { background: #23633e; transform: translateY(-1px); }
      .offerSummary { background: #f5f9f3; border: 1px solid #e2eddf; border-radius: 15px; }
      .sentIcon { background: #e4f4df; color: #277444; }
      .moManageActions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
      .moManageActions button { cursor: pointer; padding: 11px 13px; border-radius: 11px;
        border: 1px solid #d7e5d5; background: #f0f7ee; color: #1b5836;
        font-size: 12px; font-weight: 750; transition: background .15s ease; }
      .moManageActions button:hover { background: #e3f0df; }
      .moManageActions button:disabled { opacity: .55; cursor: wait; }
      @media(max-width: 980px) {
        .heroGrid { grid-template-columns: 1fr; }
        .opportunityCard { max-width: none; }
        .mainGrid { grid-template-columns: 1fr; }
        .offerSticky { position: static; }
      }
      @media(max-width: 600px) {
        .demandPage { padding: 90px 12px 48px; }
        .hero { padding: 21px 18px; border-radius: 19px; }
        .heroTop { gap: 9px; flex-wrap: wrap; }
        .hero h1 { font-size: 29px; }
        .opportunityCard { padding: 16px; border-radius: 15px; }
        .panel, .offerSticky { padding: 18px; border-radius: 17px; }
        .mainGrid { gap: 12px; margin-top: 12px; }
        .detailsGrid { grid-template-columns: 1fr 1fr; }
      }

      @media (prefers-reduced-motion: reduce) {

        *,

        *::before,

        *::after {

          animation: none !important;

          transition: none !important;

          scroll-behavior: auto !important;

        }

      }

    
      /* Final UI: clear request details and offer composition */
      .offerSticky,.panel{box-shadow:0 15px 48px rgba(17,52,32,.065)!important;border-color:#e1eade!important}.offerSticky{background:linear-gradient(180deg,#fff,#f8fbf6)!important}.submitButton{min-height:49px!important;box-shadow:0 8px 22px rgba(20,66,37,.16)!important}.detailItem{background:#f7faf5!important}.detailItem small{letter-spacing:.035em}.offerSummary{border-left:4px solid #79a96d!important}.formGroup textarea:focus,.formGroup input:focus,.formGroup select:focus{outline:3px solid #b5d9a5;outline-offset:2px}@media(max-width:700px){.offerSticky{position:static!important}.panel,.offerSticky{border-radius:18px!important}}

      /* Compact details: host / desktop and mobile */
      .demandPage .pageShell { max-width: 1080px; }
      .demandPage .hero { min-height: 0; padding: 19px 23px 20px; border-radius: 18px; box-shadow: 0 8px 24px rgba(15,47,31,.10); }
      .demandPage .heroTop { margin-bottom: 8px; gap: 8px; }
      .demandPage .heroGrid { margin-top: 10px; gap: 15px; grid-template-columns: minmax(0,1fr) minmax(180px,235px); align-items: center; }
      .demandPage .hero h1 { font-size: clamp(24px,2.8vw,35px); line-height: 1.13; margin: 6px 0; }
      .demandPage .heroCopy p { margin-top: 6px; line-height: 1.45; font-size: 11px; }
      .demandPage .opportunityCard { padding: 12px 14px; border-radius: 13px; }
      .demandPage .opportunityCard > strong { font-size: 22px; }
      .demandPage .mainGrid { gap: 12px; margin-top: 12px; }
      .demandPage .leftColumn { gap: 12px; }
      .demandPage .panel, .demandPage .offerSticky { padding: 17px 19px; border-radius: 15px; }
      .demandPage .detailsGrid { gap: 8px; }
      .demandPage .detailItem { padding: 10px; border-radius: 10px; }
      @media (max-width: 980px) {
        .demandPage .heroGrid { grid-template-columns: minmax(0,1fr) minmax(150px,200px); }
      }
      @media (max-width: 720px) {
        .demandPage { padding-top: 76px; }
        .demandPage .hero { margin: 0 10px; padding: 14px 15px; border-radius: 16px; }
        .demandPage .heroTop { flex-direction: row; align-items: center; flex-wrap: wrap; margin-bottom: 6px; }
        .demandPage .heroGrid { grid-template-columns: minmax(0,1fr); gap: 9px; margin-top: 7px; }
        .demandPage .hero h1 { font-size: clamp(22px,6vw,29px); margin: 5px 0; }
        .demandPage .heroCopy p { margin-top: 4px; font-size: 11px; line-height: 1.4; }
        .demandPage .opportunityCard { max-width: none; padding: 10px 12px; }
        .demandPage .opportunityCard > strong { font-size: 20px; }
        .demandPage .mainGrid { padding: 0 10px; gap: 10px; margin-top: 10px; }
        .demandPage .leftColumn { gap: 10px; }
        .demandPage .panel, .demandPage .offerSticky { padding: 13px 14px; border-radius: 13px; }
        .demandPage .detailsGrid { grid-template-columns: repeat(2,minmax(0,1fr)); gap: 7px; }
      }
      @media (max-width: 380px) {
        .demandPage .hero { margin: 0 8px; padding: 12px; }
        .demandPage .mainGrid { padding: 0 8px; }
        .demandPage .hero h1 { font-size: 22px; }
      }
`}</style>

  );

}
