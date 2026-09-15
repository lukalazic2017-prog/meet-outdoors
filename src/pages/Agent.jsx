import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";

const EXAMPLES = [
  "Sledećeg vikenda nas četvoro hoće rafting na Tari, treba nam i smeštaj.",
  "Idemo sa detetom na Kopaonik, treba nam lagana aktivnost i smeštaj za dve noći.",
  "Treba mi host oko Niša koji organizuje planinarenje i može da obezbedi opremu.",
];

const ACTIVITY_LABELS = {
  hiking: "Planinarenje",
  camping: "Kampovanje",
  cycling: "Biciklizam",
  climbing: "Penjanje",
  "via ferrata": "Via ferrata",
  rafting: "Rafting",
  kayaking: "Kajak",
  paragliding: "Paraglajding",
  skydiving: "Padobranstvo",
  skiing: "Skijanje",
  snowboarding: "Snowboarding",
  "horse riding": "Jahanje",
  fishing: "Ribolov",
  "nature trip": "Izlet u prirodi",
  "trail running": "Trail running",
  canyoning: "Kanjoning",
  surfing: "Surfing",
  sailing: "Jedrenje",
  diving: "Ronjenje",
  other: "Outdoor avantura",
};


const ACTIVITY_ALIASES = {
  hiking: "hiking",
  planinarenje: "hiking",
  trekking: "hiking",
  trek: "hiking",
  camping: "camping",
  kampovanje: "camping",
  cycling: "cycling",
  biciklizam: "cycling",
  biking: "cycling",
  mtb: "cycling",
  climbing: "climbing",
  penjanje: "climbing",
  "rock climbing": "climbing",
  "via ferrata": "via ferrata",
  "via-ferrata": "via ferrata",
  rafting: "rafting",
  kayaking: "kayaking",
  kayak: "kayaking",
  kajak: "kayaking",
  paragliding: "paragliding",
  paraglajding: "paragliding",
  skydiving: "skydiving",
  "sky diving": "skydiving",
  padobranstvo: "skydiving",
  skiing: "skiing",
  skijanje: "skiing",
  snowboarding: "snowboarding",
  snoubording: "snowboarding",
  "horse riding": "horse riding",
  "horseback riding": "horse riding",
  jahanje: "horse riding",
  fishing: "fishing",
  ribolov: "fishing",
  pecanje: "fishing",
  "nature trip": "nature trip",
  "outdoor trip": "nature trip",
  "izlet u prirodi": "nature trip",
  "trail running": "trail running",
  "trail trcanje": "trail running",
  "trail trčanje": "trail running",
  canyoning: "canyoning",
  kanjoning: "canyoning",
  surfing: "surfing",
  surfovanje: "surfing",
  sailing: "sailing",
  jedrenje: "sailing",
  diving: "diving",
  "scuba diving": "diving",
  ronjenje: "diving",
  other: "other",
  ostalo: "other",
};

function normalizeActivity(value) {
  if (!value) return null;

  const normalized = String(value)
    .trim()
    .toLowerCase()
    .replace(/[_]+/g, " ")
    .replace(/\s+/g, " ");

  return ACTIVITY_ALIASES[normalized] || normalized;
}

const DIFFICULTY_LABELS = {
  easy: "Lagano",
  medium: "Umereno",
  hard: "Izazovno",
};

function Icon({ name, size = 20, strokeWidth = 1.9 }) {
  const paths = {
    sparkles: (
      <>
        <path d="M12 3l1.4 3.6L17 8l-3.6 1.4L12 13l-1.4-3.6L7 8l3.6-1.4L12 3Z" />
        <path d="M5 14l.8 2.2L8 17l-2.2.8L5 20l-.8-2.2L2 17l2.2-.8L5 14Z" />
        <path d="M19 13l.6 1.4L21 15l-1.4.6L19 17l-.6-1.4L17 15l1.4-.6L19 13Z" />
      </>
    ),
    arrow: (
      <>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </>
    ),
    send: (
      <>
        <path d="m22 2-7 20-4-9-9-4Z" />
        <path d="M22 2 11 13" />
      </>
    ),
    map: (
      <>
        <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Z" />
        <path d="M9 3v15M15 6v15" />
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
      </>
    ),
    car: (
      <>
        <path d="m5 11 2-5h10l2 5" />
        <rect x="3" y="11" width="18" height="7" rx="2" />
        <path d="M6 18v2M18 18v2M7 14h.01M17 14h.01" />
      </>
    ),
    mountain: (
      <>
        <path d="m3 20 6.2-10 3.2 4.8L15.8 9 21 20Z" />
        <path d="m7.5 13 1.7 1.6 1.4-1.2" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    chevron: <path d="m9 18 6-6-6-6" />,
    shield: (
      <>
        <path d="M12 3 5 6v5c0 4.6 2.9 8.4 7 10 4.1-1.6 7-5.4 7-10V6l-7-3Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    route: (
      <>
        <circle cx="6" cy="18" r="2" />
        <circle cx="18" cy="6" r="2" />
        <path d="M8 18h3a4 4 0 0 0 4-4v-4a4 4 0 0 1 3-4" />
      </>
    ),
    event: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
        <path d="m8 15 2 2 5-5" />
      </>
    ),
    edit: (
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
      </>
    ),
    retry: (
      <>
        <path d="M20 7v5h-5" />
        <path d="M20 12a8 8 0 1 0-2.3 5.7" />
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
  if (!value) return null;
  const d = new Date(`${value}T12:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("sr-Latn-RS", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

function formatMoney(value, currency = "RSD") {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return `${value} ${currency || ""}`.trim();
  try {
    return new Intl.NumberFormat("sr-Latn-RS", {
      style: "currency",
      currency: currency || "RSD",
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${n.toLocaleString("sr-Latn-RS")} ${currency || "RSD"}`;
  }
}

function DetailPill({ icon, label, value }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="ai-pill">
      <span><Icon name={icon} size={15} /></span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

async function getFunctionErrorMessage(error, fallback = "AI Agent greška") {
  if (!error) return fallback;
  let message = error?.message || fallback;

  try {
    if (error?.context) {
      const body = await error.context.json();
      if (body?.error) message = body.error;
    }
  } catch (parseError) {
    console.error("Could not parse Edge Function error:", parseError);
  }

  return message;
}

export default function Agent() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const inputRef = useRef(null);

  const [prompt, setPrompt] = useState("");
  const [intent, setIntent] = useState(null);
  const [hostResults, setHostResults] = useState(null);

  const [thinking, setThinking] = useState(false);
  const [sendingDemand, setSendingDemand] = useState(false);
  const [sentResult, setSentResult] = useState(null);
  const [error, setError] = useState("");
  const [showEdit, setShowEdit] = useState(false);

  useEffect(() => {
    if (!authLoading && !intent) {
      const t = window.setTimeout(() => inputRef.current?.focus(), 280);
      return () => window.clearTimeout(t);
    }
  }, [authLoading, intent]);

  const dateText = useMemo(() => {
    if (!intent) return null;
    const start = formatDate(intent.start_date);
    const end = formatDate(intent.end_date);
    if (start && end && intent.start_date !== intent.end_date) {
      return `${start} — ${end}`;
    }
    return start || end;
  }, [intent]);

  const hosts = useMemo(() => hostResults?.hosts || [], [hostResults?.hosts]);
  const foundHostCount = Number(hostResults?.count || hosts.length || 0);
  const hasHostMatches = foundHostCount > 0;
  const hasVisibleHosts = Boolean(user) && hosts.length > 0;


  const canSearch = prompt.trim().length >= 4 && !thinking;

  function updateIntent(field, value) {
    setIntent((prev) => ({
      ...(prev || {}),
      [field]: value,
    }));
    setError("");
    setHostResults(null);
  }

  function inferHostNeeds(currentIntent, rawPrompt = "") {
    const intentType = currentIntent?.intent_type || null;
    const text = `${rawPrompt} ${currentIntent?.assistant_summary || ""}`.toLowerCase();

    const needsAccommodation =
      intentType === "accommodation" ||
      intentType === "mixed" ||
      /smeštaj|smestaj|noćenj|nocenj|apartman|vikendic|hotel|hostel|brvnar|kuć|kuc|glamping|planinarski dom/.test(text);

    const needsRental =
      /iznajm|rent|oprem|bicikl|bike|e-bike|kajak|sup|čamac|camac|quad|atv|ski|skije|snowboard|šator|sator/.test(text);

    const needsService =
      /uslug|vodič|vodic|transfer|prevoz|instruktor|fotograf|video|team building|servis|podršk|podrsk/.test(text);

    const explicitAdventure =
      intentType === "adventure" ||
      intentType === "mixed" ||
      Boolean(currentIntent?.activity) ||
      /avantur|rafting|planinar|hiking|kampov|cycling|biciklizam|penjan|via ferrata|paraglajd|skij|snowboard|jahan|ribolov|kanjon|surf|jedren|ronjen|kajak/.test(text);

    return {
      adventure: explicitAdventure,
      accommodation: needsAccommodation,
      service: needsService,
      rental: needsRental,
    };
  }

  async function searchHosts(currentIntent, rawPrompt = "") {
    const needs = inferHostNeeds(currentIntent, rawPrompt);

    const params = {
      p_activity: normalizeActivity(currentIntent?.activity) || null,
      p_location_text: currentIntent?.location_text || null,
      p_needs_adventure: needs.adventure,
      p_needs_accommodation: needs.accommodation,
      p_needs_service: needs.service,
      p_needs_rental: needs.rental,
      p_people_count: Number(currentIntent?.people_count) || 1,
      p_limit: 20,
    };

    const rpcName = user
      ? "search_agent_hosts"
      : "search_agent_hosts_preview";

    const { data, error: rpcError } = await supabase.rpc(rpcName, params);

    if (rpcError) throw rpcError;

    const normalized = data || {
      success: true,
      hosts: [],
      count: 0,
      query: { needs },
      locked: !user,
    };

    setHostResults(normalized);
    return normalized;
  }

  async function searchWithAI(event) {
    event?.preventDefault();
    if (!canSearch) return;

    setThinking(true);
    setError("");
    setSentResult(null);
    setIntent(null);
    setHostResults(null);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Agent session read error:", sessionError);
      }

      let outdoorDNA = null;

      if (session?.user) {
        try {
          const { data: dnaData, error: dnaReadError } = await supabase
            .from("outdoor_preferences")
            .select(`
              preferred_activities,
              preferred_difficulty,
              typical_budget_per_person,
              currency,
              has_car,
              preferred_people_count,
              preferred_location,
              max_travel_minutes,
              adventures_requested,
              adventures_completed,
              last_activity
            `)
            .eq("user_id", session.user.id)
            .maybeSingle();

          if (dnaReadError) {
            console.error("Outdoor DNA read error:", dnaReadError);
          } else {
            outdoorDNA = dnaData || null;
          }
        } catch (dnaReadError) {
          console.error("Outdoor DNA read error:", dnaReadError);
        }
      }

      const invokeOptions = {
        body: {
          mode: "parse",
          message: prompt.trim(),
          outdoor_dna: outdoorDNA,
        },
      };

      if (session?.access_token) {
        invokeOptions.headers = {
          Authorization: `Bearer ${session.access_token}`,
        };
      }

      const { data: aiData, error: aiError } = await supabase.functions.invoke(
        "meetoutdoors-agent",
        invokeOptions
      );

      if (aiError) {
        console.error("Agent Edge Function error:", aiError);
        const realMessage = await getFunctionErrorMessage(aiError);
        throw new Error(realMessage);
      }
      if (!aiData?.success || !aiData?.intent) {
        throw new Error(aiData?.error || "Agent nije uspeo da razume zahtev.");
      }

      const parsed = {
        ...aiData.intent,
        activity: normalizeActivity(aiData.intent?.activity),
      };
      setIntent(parsed);

      /*
        Outdoor DNA learning is intentionally non-blocking.
        Guests can use Agent discovery without an account.
      */
      if (session?.user) {
        try {
          const { error: dnaError } = await supabase.rpc(
            "update_outdoor_dna_from_intent",
            {
              p_activity: parsed.activity || null,
              p_difficulty: parsed.difficulty || null,
              p_budget_per_person:
                parsed.budget_per_person === null ||
                parsed.budget_per_person === undefined
                  ? null
                  : Number(parsed.budget_per_person),
              p_currency: parsed.currency || null,
              p_has_car:
                typeof parsed.has_car === "boolean" ? parsed.has_car : null,
              p_people_count:
                parsed.people_count === null ||
                parsed.people_count === undefined
                  ? null
                  : Number(parsed.people_count),
              p_location_text: parsed.location_text || null,
            }
          );

          if (dnaError) {
            console.error("Outdoor DNA learning error:", dnaError);
          }
        } catch (dnaError) {
          console.error("Outdoor DNA learning error:", dnaError);
        }
      }

      await searchHosts(parsed, prompt.trim());
    } catch (err) {
      console.error("MeetOutdoors Agent error:", err);
      setError(
        err?.message ||
          "Agent trenutno nije uspeo da obradi zahtev. Pokušaj ponovo."
      );
    } finally {
      setThinking(false);
    }
  }

  async function rerunHostSearch() {
    if (!intent) {
      setError("Agent još nema dovoljno informacija za novu pretragu.");
      return;
    }

    setThinking(true);
    setError("");

    try {
      await searchHosts(intent, prompt.trim());
      setShowEdit(false);
    } catch (err) {
      console.error("Host Engine refresh error:", err);
      setError(err?.message || "Nismo uspeli da osvežimo domaćine.");
    } finally {
      setThinking(false);
    }
  }

  async function sendDemandToHosts() {
    if (!intent || sendingDemand) return;

    if (!user) {
      navigate("/login");
      return;
    }

    const intentType = intent.intent_type || "adventure";
    const needsActivity = intentType === "adventure" || intentType === "mixed";

    if (needsActivity && !intent.activity) {
      setError("Za ovu potražnju Agent mora da zna koju avanturu ili aktivnost tražiš.");
      return;
    }

    setSendingDemand(true);
    setError("");

    try {
      const { data, error: rpcError } = await supabase.rpc(
        "create_adventure_intent_and_notify_hosts",
        {
          p_activity: normalizeActivity(intent.activity) || null,
          p_location_text: intent.location_text || null,
          p_start_date: intent.start_date || null,
          p_end_date: intent.end_date || null,
          p_people_count: Number(intent.people_count) || 1,
          p_budget_per_person:
            intent.budget_per_person === null ||
            intent.budget_per_person === undefined ||
            intent.budget_per_person === ""
              ? null
              : Number(intent.budget_per_person),
          p_currency: intent.currency || "RSD",
          p_difficulty: intent.difficulty || null,
          p_has_car:
            typeof intent.has_car === "boolean" ? intent.has_car : null,
          p_notes: prompt.trim() || intent.notes || null,
          p_intent_type: intentType,
        }
      );

      if (rpcError) throw rpcError;
      setSentResult(data);
    } catch (err) {
      console.error("Send demand error:", err);
      setError(
        err?.message ||
          "Nismo uspeli da pošaljemo potražnju domaćinima."
      );
    } finally {
      setSendingDemand(false);
    }
  }

  function resetAgent() {
    setPrompt("");
    setIntent(null);
    setHostResults(null);
    setSentResult(null);
    setError("");
    setShowEdit(false);
    window.setTimeout(() => inputRef.current?.focus(), 100);
  }

  if (authLoading) {
    return (
      <>
        <Styles />
        <main className="ai-loading-page">
          <div className="ai-orb-loader">
            <span />
            <span />
            <span />
          </div>
          <strong>Pokrećemo MeetOutdoors Agent</strong>
          <small>Pripremamo tvoju outdoor pretragu.</small>
        </main>
      </>
    );
  }

  return (
    <>
      <Styles />

      <main className="ai-page">
        <div className="ai-ambient ai-ambient-one" />
        <div className="ai-ambient ai-ambient-two" />
        <div className="ai-grid-noise" />

        <div className="ai-shell">
          <header className="ai-hero">
            <div className="ai-kicker">
              <span className="ai-kicker-dot">
                <Icon name="sparkles" size={14} />
              </span>
              MEETOUTDOORS AGENT
              <span className="ai-live">AI</span>
            </div>

            <h1>
              Reci šta želiš.
              <span>Agent nalazi ko to može.</span>
            </h1>

            <p>
              Ne pretražuješ katalog. Opiši plan, društvo, lokaciju i šta ti
              treba — Agent pronalazi relevantne domaćine i, kada treba,
              šalje im zahtev da naprave Event baš za tvoju potrebu.
            </p>
          </header>

          {!intent && !thinking && (
            <section className="ai-composer-wrap ai-rise">
              <form className="ai-composer" onSubmit={searchWithAI}>
                <div className="ai-composer-top">
                  <span className="ai-agent-mark">
                    <Icon name="sparkles" size={19} />
                  </span>
                  <span className="ai-composer-label">
                    Reci mi kako želiš da izađeš napolje
                  </span>
                </div>

                <textarea
                  ref={inputRef}
                  value={prompt}
                  onChange={(e) => {
                    setPrompt(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="Npr. U subotu nas dvoje iz Beograda, imamo auto, do 8.000 RSD ukupno, nešto lagano u prirodi..."
                  maxLength={3000}
                  rows={5}
                />

                <div className="ai-composer-bottom">
                  <div className="ai-composer-meta">
                    <span>
                      <Icon name="shield" size={14} />
                      AI razume, Host Engine povezuje
                    </span>
                    <small>{prompt.length}/3000</small>
                  </div>

                  <button
                    type="submit"
                    className="ai-primary"
                    disabled={!canSearch}
                  >
                    <span>Izvedi me napolje</span>
                    <span className="ai-primary-icon">
                      <Icon name="arrow" size={18} />
                    </span>
                  </button>
                </div>
              </form>

              <div className="ai-examples">
                <span className="ai-examples-label">Probaj ovako</span>
                <div className="ai-example-list">
                  {EXAMPLES.map((example) => (
                    <button
                      key={example}
                      type="button"
                      onClick={() => {
                        setPrompt(example);
                        inputRef.current?.focus();
                      }}
                    >
                      <Icon name="sparkles" size={13} />
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}

          {thinking && !intent && (
            <section className="ai-thinking ai-rise">
              <div className="ai-thinking-orb ai-agent-alive">
                <span className="agent-wave wave-one" />
                <span className="agent-wave wave-two" />
                <span className="agent-wave wave-three" />
                <span className="agent-compass-line line-a" />
                <span className="agent-compass-line line-b" />
                <span className="ring ring-one" />
                <span className="ring ring-two" />
                <span className="core">
                  <Icon name="sparkles" size={25} />
                </span>
                <span className="agent-particle particle-a" />
                <span className="agent-particle particle-b" />
                <span className="agent-particle particle-c" />
              </div>

              <div className="ai-thinking-copy">
                <span className="ai-thinking-label">AGENT RAZMIŠLJA</span>
                <h2>Razumem šta želiš.</h2>
                <p>
                  Pretvaram tvoju poruku u konkretan outdoor plan i proveravam
                  stvarnu ponudu na MeetOutdoors-u.
                </p>

                <div className="ai-thinking-steps">
                  <span className="active">
                    <Icon name="check" size={13} />
                    Razumevanje zahteva
                  </span>
                  <span>
                    <span className="mini-loader" />
                    Host Engine
                  </span>
                  <span>Najbolje opcije</span>
                </div>
              </div>
            </section>
          )}

          {intent && !sentResult && (
            <div className="ai-result-layout ai-rise">
              <section className="ai-result-main">
                <div className="ai-understood">
                  <div className="ai-understood-head">
                    <div>
                      <span className="ai-section-label">
                        <Icon name="sparkles" size={14} />
                        AGENT JE RAZUMEO
                      </span>
                      <h2>
                        {intent.assistant_summary ||
                          "Evo kako sam razumeo tvoju avanturu."}
                      </h2>
                    </div>

                    <button
                      type="button"
                      className="ai-ghost"
                      onClick={() => setShowEdit((v) => !v)}
                    >
                      <Icon name="edit" size={15} />
                      Preciziraj
                    </button>
                  </div>

                  <div className="ai-pills">
                    <DetailPill
                      icon="sparkles"
                      label="Tražiš"
                      value={
                        intent.intent_type === "accommodation"
                          ? "Smeštaj"
                          : intent.intent_type === "mixed"
                            ? "Avanturu + smeštaj"
                            : "Avanturu"
                      }
                    />
                    {intent.intent_type !== "accommodation" && (
                      <DetailPill
                        icon="mountain"
                        label="Aktivnost"
                        value={
                          ACTIVITY_LABELS[intent.activity] ||
                          intent.activity ||
                          null
                        }
                      />
                    )}
                    <DetailPill
                      icon="map"
                      label="Lokacija"
                      value={intent.location_text}
                    />
                    <DetailPill
                      icon="calendar"
                      label="Termin"
                      value={dateText}
                    />
                    <DetailPill
                      icon="users"
                      label="Društvo"
                      value={
                        intent.people_count
                          ? `${intent.people_count} ${
                              Number(intent.people_count) === 1
                                ? "osoba"
                                : "osobe"
                            }`
                          : null
                      }
                    />
                    <DetailPill
                      icon="wallet"
                      label="Budžet po osobi"
                      value={formatMoney(
                        intent.budget_per_person,
                        intent.currency || "RSD"
                      )}
                    />
                    {intent.intent_type !== "accommodation" && (
                      <DetailPill
                        icon="route"
                        label="Težina"
                        value={
                          DIFFICULTY_LABELS[intent.difficulty] ||
                          intent.difficulty ||
                          null
                        }
                      />
                    )}
                    <DetailPill
                      icon="car"
                      label="Prevoz"
                      value={
                        intent.has_car === true
                          ? "Imate auto"
                          : intent.has_car === false
                            ? "Bez auta"
                            : null
                      }
                    />
                  </div>

                  {intent.missing_fields?.length > 0 && (
                    <div className="ai-missing">
                      <Icon name="sparkles" size={16} />
                      <span>
                        Mogu da radim i sa ovim, ali rezultat će biti bolji ako
                        dopuniš: {intent.missing_fields.join(", ")}.
                      </span>
                    </div>
                  )}

                  {showEdit && (
                    <div className="ai-edit-panel">
                      <div className="ai-edit-grid">
                        {intent.intent_type !== "accommodation" && (
                          <label>
                            <span>Aktivnost</span>
                            <select
                              value={intent.activity || ""}
                              onChange={(e) =>
                                updateIntent("activity", normalizeActivity(e.target.value || null))
                              }
                            >
                              <option value="">Izaberi</option>
                              {Object.entries(ACTIVITY_LABELS).map(([value, label]) => (
                                <option key={value} value={value}>
                                  {label}
                                </option>
                              ))}
                            </select>
                          </label>
                        )}

                        <label>
                          <span>Lokacija</span>
                          <input
                            value={intent.location_text || ""}
                            onChange={(e) =>
                              updateIntent("location_text", e.target.value || null)
                            }
                            placeholder="npr. Beograd i okolina"
                          />
                        </label>

                        <label>
                          <span>Od</span>
                          <input
                            type="date"
                            value={intent.start_date || ""}
                            onChange={(e) =>
                              updateIntent("start_date", e.target.value || null)
                            }
                          />
                        </label>

                        <label>
                          <span>Do</span>
                          <input
                            type="date"
                            value={intent.end_date || ""}
                            onChange={(e) =>
                              updateIntent("end_date", e.target.value || null)
                            }
                          />
                        </label>

                        <label>
                          <span>Broj osoba</span>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={intent.people_count || 1}
                            onChange={(e) =>
                              updateIntent(
                                "people_count",
                                Math.max(1, Number(e.target.value) || 1)
                              )
                            }
                          />
                        </label>

                        <label>
                          <span>Budžet po osobi</span>
                          <input
                            type="number"
                            min="0"
                            value={intent.budget_per_person ?? ""}
                            onChange={(e) =>
                              updateIntent(
                                "budget_per_person",
                                e.target.value === ""
                                  ? null
                                  : Number(e.target.value)
                              )
                            }
                            placeholder="npr. 4000"
                          />
                        </label>
                      </div>

                      <button
                        type="button"
                        className="ai-refresh"
                        onClick={rerunHostSearch}
                        disabled={thinking}
                      >
                        {thinking ? (
                          <>
                            <span className="button-loader" />
                            Tražim domaćine...
                          </>
                        ) : (
                          <>
                            <Icon name="retry" size={16} />
                            Osveži domaćine
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                <section className="ai-inventory">
                  <div className="ai-inventory-head">
                    <div>
                      <span className="ai-section-label">
                        <Icon name="route" size={14} />
                        HOST ENGINE
                      </span>
                      <h2>
                        {hasHostMatches
                          ? user
                            ? "Najbolji domaćini za tvoj plan."
                            : `Pronašao sam ${foundHostCount} domaćina za tvoj plan.`
                          : "Nisam pronašao dovoljno dobar direktan match."}
                      </h2>
                      <p>
                        {hasHostMatches
                          ? user
                            ? "Agent je uporedio lokaciju, aktivnost i ono što svaki domaćin može da ponudi."
                            : "Rezultati su spremni. Uloguj se da vidiš koji domaćini najbolje odgovaraju tvom planu."
                          : "Neću izmišljati rezultat. Možeš poslati konkretan zahtev kada se uloguješ."}
                      </p>
                    </div>

                    <div className={`ai-engine-status ${hasHostMatches ? "found" : ""}`}>
                      <span />
                      {hasHostMatches
                        ? `${foundHostCount} ${foundHostCount === 1 ? "domaćin" : "domaćina"}`
                        : "Custom request"}
                    </div>
                  </div>

                  {hasHostMatches && !user ? (
                    <div className="ai-locked-results">
                      <div className="ai-locked-stack" aria-hidden="true">
                        {[0, 1, 2].map((item) => (
                          <div key={item} className="ai-locked-card">
                            <div className="ai-locked-avatar" />
                            <div className="ai-locked-lines">
                              <span />
                              <span />
                            </div>
                            <Icon name="shield" size={17} />
                          </div>
                        ))}
                      </div>

                      <div className="ai-locked-copy">
                        <span className="ai-section-label">
                          <Icon name="shield" size={14} />
                          REZULTATI SU ZAKLJUČANI
                        </span>
                        <h3>Pronašao sam {foundHostCount} domaćina.</h3>
                        <p>
                          Uloguj se da vidiš njihove profile, mogućnosti i ko
                          najbolje odgovara tvom planu.
                        </p>
                        <button
                          type="button"
                          className="ai-login-results"
                          onClick={() => navigate("/login")}
                        >
                          Uloguj se i otključaj rezultate
                          <Icon name="arrow" size={15} />
                        </button>
                      </div>
                    </div>
                  ) : hasVisibleHosts ? (
                    <div className="ai-host-results">
                      {hosts.map((host, index) => {
                        const capabilities = host.capabilities || [];
                        const capabilityLabels = {
                          adventure: "Avanture",
                          accommodation: "Smeštaj",
                          service: "Usluge",
                          rental: "Iznajmljivanje",
                        };

                        return (
                          <article
                            key={host.host_id}
                            className="ai-host-card"
                            style={{ "--host-delay": `${index * 70}ms` }}
                          >
                            <div className="ai-host-cover">
                              {host.cover_url ? (
                                <img src={host.cover_url} alt="" />
                              ) : (
                                <div className="ai-host-cover-fallback">
                                  <Icon name="mountain" size={28} />
                                </div>
                              )}
                            </div>

                            <div className="ai-host-card-body">
                              <div className="ai-host-identity">
                                <div className="ai-host-avatar">
                                  {host.avatar_url ? (
                                    <img
                                      src={host.avatar_url}
                                      alt={host.full_name || host.username || "Domaćin"}
                                    />
                                  ) : (
                                    <span>
                                      {(host.full_name || host.username || "H")
                                        .trim()
                                        .charAt(0)
                                        .toUpperCase()}
                                    </span>
                                  )}
                                </div>

                                <div>
                                  <strong>{host.full_name || host.username || "Outdoor domaćin"}</strong>
                                  <span>
                                    {[host.city, host.country].filter(Boolean).join(", ") ||
                                      host.public_location ||
                                      "MeetOutdoors domaćin"}
                                  </span>
                                </div>
                              </div>

                              {host.covers_everything && (
                                <div className="ai-host-best">
                                  <Icon name="check" size={13} />
                                  Može da pokrije ceo tvoj plan
                                </div>
                              )}

                              <div className="ai-host-capabilities">
                                {capabilities.map((capability) => (
                                  <span key={capability}>
                                    {capabilityLabels[capability] || capability}
                                  </span>
                                ))}
                              </div>

                              {host.bio && <p className="ai-host-bio">{host.bio}</p>}

                              <Link
                                to={`/h/${host.username}`}
                                className="ai-host-profile-link"
                              >
                                Pogledaj domaćina
                                <Icon name="arrow" size={15} />
                              </Link>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="ai-empty-visual">
                      <div className="ai-empty-orbit">
                        <span className="orbit orbit-a" />
                        <span className="orbit orbit-b" />
                        <span className="empty-core">
                          <Icon name="sparkles" size={24} />
                        </span>
                      </div>

                      <div>
                        <strong>Tu Agent radi ono što katalog ne može.</strong>
                        <p>
                          Pošalji svoj plan relevantnim domaćinima. Oni mogu da
                          naprave Event baš prema tvom zahtevu.
                        </p>
                      </div>
                    </div>
                  )}
                </section>
              </section>

              <aside className="ai-action-panel">
                <div className="ai-action-sticky">
                  <span className="ai-section-label">
                    <Icon name="sparkles" size={14} />
                    {intent.intent_type === "accommodation" ? "SMEŠTAJ" : "CUSTOM MATCH"}
                  </span>

                  <h2>Pronađimo domaćina za tvoj plan.</h2>

                  <p>
                    Agent razume šta ti treba i aktivira relevantne domaćine. Ako
                    nema gotovog rešenja, domaćin može da napravi Event baš prema
                    tvom zahtevu.
                  </p>

                  <div className="ai-privacy-box">
                    <Icon name="shield" size={17} />
                    <div>
                      <strong>Zahtev ide samo relevantnim domaćinima.</strong>
                      <span>
                        Agent bira domaćine prema aktivnosti, lokaciji i mogućnostima.
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="ai-host-cta"
                    onClick={sendDemandToHosts}
                    disabled={
                      sendingDemand ||
                      ((intent.intent_type === "adventure" ||
                        intent.intent_type === "mixed") &&
                        !intent.activity)
                    }
                  >
                    {sendingDemand ? (
                      <>
                        <span className="button-loader" />
                        Aktiviram relevantne domaćine...
                      </>
                    ) : (
                      <>
                        <span>Pošalji zahtev relevantnim domaćinima</span>
                        <Icon name="send" size={17} />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    className="ai-new-search"
                    onClick={resetAgent}
                  >
                    Nova AI pretraga
                  </button>

                  <div className="ai-flow-mini">
                    <div>
                      <span>01</span>
                      <p>Agent razume</p>
                    </div>
                    <i />
                    <div>
                      <span>02</span>
                      <p>Host Engine povezuje</p>
                    </div>
                    <i />
                    <div>
                      <span>03</span>
                      <p>Hostovi odgovaraju Eventom</p>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          )}

          {sentResult && (
            <section className="ai-sent ai-rise">
              <div className="ai-sent-glow" />

              <div className="ai-sent-icon">
                <Icon name="check" size={30} />
              </div>

              <span className="ai-section-label centered">
                POTRAGA JE AKTIVNA
              </span>

              <h2>Agent je pustio zahtev u mrežu.</h2>

              <p>
                Tvoja potražnja je sačuvana. Relevantni domaćini sada mogu da
                odgovore na zahtev i naprave Event prema tvojoj potrebi. Dobićeš
                obaveštenje kada se pojavi odgovor.
              </p>

              <div className="ai-sent-stat">
                <strong>{sentResult?.hosts_notified ?? 0}</strong>
                <span>
                  {Number(sentResult?.hosts_notified) === 1
                    ? "relevantan domaćin obavešten"
                    : "relevantnih domaćina obavešteno"}
                </span>
              </div>

              <div className="ai-sent-actions">
                <Link to="/notifications" className="ai-primary-link">
                  Otvori obaveštenja
                  <Icon name="arrow" size={17} />
                </Link>

                <button type="button" onClick={resetAgent}>
                  Nova potraga
                </button>
              </div>
            </section>
          )}

          {error && (
            <div className="ai-error ai-rise">
              <span>
                <Icon name="close" size={15} />
              </span>
              <div>
                <strong>Agent je naišao na problem.</strong>
                <p>{error}</p>
              </div>
              <button type="button" onClick={() => setError("")}>
                <Icon name="close" size={15} />
              </button>
            </div>
          )}

          {!intent && !thinking && (
            <section className="ai-principles">
              <div>
                <span>01</span>
                <strong>Reci šta želiš</strong>
                <p>Bez formularskog razmišljanja. Piši prirodno.</p>
              </div>
              <div>
                <span>02</span>
                <strong>Agent proverava stvarnost</strong>
                <p>Agent traži domaćine prema onome što stvarno nude i rade.</p>
              </div>
              <div>
                <span>03</span>
                <strong>Ako ne postoji — stvaramo</strong>
                <p>Relevantni hostovi mogu da naprave Event za tvoj zahtev.</p>
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
}

function Styles() {
  return (
    <style>{`
      * { box-sizing: border-box; }

      body {
        margin: 0;
        background: #07170f;
      }

      button,
      textarea,
      input,
      select {
        font: inherit;
      }

      .ai-page,
      .ai-loading-page {
        --bg: #07170f;
        --bg2: #0b2116;
        --ink: #f3f8f2;
        --muted: rgba(229, 239, 229, .60);
        --green: #b8f07b;
        --green-2: #8ad160;
        --panel: rgba(16, 37, 25, .72);
        --panel-2: rgba(255,255,255,.055);
        --line: rgba(214, 239, 209, .11);
        --shadow: 0 30px 90px rgba(0,0,0,.28);
        font-family:
          Inter,
          ui-sans-serif,
          system-ui,
          -apple-system,
          BlinkMacSystemFont,
          "Segoe UI",
          sans-serif;
      }

      .ai-page {
        position: relative;
        min-height: 100vh;
        overflow: hidden;
        padding: 112px 22px 76px;
        color: var(--ink);
        background:
          radial-gradient(circle at 72% -10%, rgba(155, 230, 105, .12), transparent 30%),
          radial-gradient(circle at 15% 26%, rgba(67, 130, 86, .13), transparent 24%),
          linear-gradient(180deg, #07170f 0%, #091b12 46%, #07170f 100%);
      }

      .ai-grid-noise {
        position: fixed;
        inset: 0;
        pointer-events: none;
        opacity: .28;
        background-image:
          linear-gradient(rgba(255,255,255,.018) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,.018) 1px, transparent 1px);
        background-size: 52px 52px;
        mask-image: linear-gradient(to bottom, black, transparent 76%);
      }

      .ai-ambient {
        position: fixed;
        border-radius: 50%;
        filter: blur(60px);
        pointer-events: none;
        animation: ambientFloat 12s ease-in-out infinite alternate;
      }

      .ai-ambient-one {
        width: 420px;
        height: 420px;
        right: -160px;
        top: 20%;
        background: rgba(132, 218, 91, .10);
      }

      .ai-ambient-two {
        width: 360px;
        height: 360px;
        left: -190px;
        bottom: 8%;
        background: rgba(78, 140, 94, .10);
        animation-delay: -4s;
      }

      .ai-shell {
        position: relative;
        z-index: 2;
        width: min(1240px, 100%);
        margin: 0 auto;
      }

      .ai-hero {
        max-width: 900px;
        margin-bottom: 46px;
      }

      .ai-kicker,
      .ai-section-label {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-size: 9px;
        font-weight: 900;
        letter-spacing: .15em;
        text-transform: uppercase;
      }

      .ai-kicker {
        color: rgba(231, 244, 227, .66);
      }

      .ai-kicker-dot {
        display: grid;
        place-items: center;
        width: 27px;
        height: 27px;
        border: 1px solid rgba(193, 241, 149, .20);
        border-radius: 9px;
        background: rgba(183, 239, 123, .08);
        color: var(--green);
        box-shadow: inset 0 0 18px rgba(185, 241, 125, .05);
      }

      .ai-live {
        padding: 5px 7px;
        margin-left: 2px;
        border: 1px solid rgba(190, 240, 145, .17);
        border-radius: 999px;
        color: var(--green);
        background: rgba(184, 240, 123, .07);
        font-size: 7px;
        letter-spacing: .10em;
      }

      .ai-hero h1 {
        max-width: 980px;
        margin: 18px 0 0;
        font-size: clamp(58px, 8vw, 108px);
        line-height: .84;
        letter-spacing: -.075em;
        font-weight: 880;
      }

      .ai-hero h1 span {
        display: block;
        margin-top: 10px;
        color: transparent;
        background: linear-gradient(100deg, #f0f8ec, #bdf184 58%, #7ecb69);
        -webkit-background-clip: text;
        background-clip: text;
      }

      .ai-hero p {
        max-width: 710px;
        margin: 26px 0 0;
        color: var(--muted);
        font-size: 14px;
        line-height: 1.8;
      }

      .ai-composer-wrap {
        max-width: 1020px;
      }

      .ai-composer {
        position: relative;
        overflow: hidden;
        padding: 24px;
        border: 1px solid rgba(211, 239, 207, .14);
        border-radius: 28px;
        background:
          linear-gradient(180deg, rgba(255,255,255,.075), rgba(255,255,255,.035)),
          rgba(12, 31, 20, .70);
        backdrop-filter: blur(22px);
        box-shadow:
          0 28px 90px rgba(0,0,0,.28),
          inset 0 1px 0 rgba(255,255,255,.04);
      }

      .ai-composer::before {
        content: "";
        position: absolute;
        inset: -1px;
        border-radius: inherit;
        pointer-events: none;
        background:
          radial-gradient(circle at 18% 0%, rgba(190,241,138,.11), transparent 32%);
      }

      .ai-composer-top,
      .ai-composer-bottom {
        position: relative;
        z-index: 1;
      }

      .ai-composer-top {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .ai-agent-mark {
        display: grid;
        place-items: center;
        width: 38px;
        height: 38px;
        border-radius: 12px;
        background: #b7ed7f;
        color: #11321f;
        box-shadow: 0 12px 28px rgba(161, 227, 105, .15);
      }

      .ai-composer-label {
        color: rgba(239,247,236,.78);
        font-size: 11px;
        font-weight: 800;
      }

      .ai-composer textarea {
        position: relative;
        z-index: 1;
        display: block;
        width: 100%;
        min-height: 168px;
        margin-top: 18px;
        padding: 4px 2px;
        resize: vertical;
        border: 0;
        outline: 0;
        background: transparent;
        color: #f5faf3;
        font-size: clamp(21px, 3vw, 31px);
        line-height: 1.38;
        letter-spacing: -.035em;
      }

      .ai-composer textarea::placeholder {
        color: rgba(237,245,234,.25);
      }

      .ai-composer-bottom {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 18px;
        margin-top: 16px;
        padding-top: 18px;
        border-top: 1px solid rgba(227,241,223,.08);
      }

      .ai-composer-meta {
        display: flex;
        align-items: center;
        gap: 13px;
        min-width: 0;
        color: rgba(226,238,223,.42);
      }

      .ai-composer-meta > span {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 8px;
        font-weight: 800;
      }

      .ai-composer-meta small {
        font-size: 8px;
      }

      .ai-primary,
      .ai-host-cta,
      .ai-primary-link {
        border: 0;
        text-decoration: none;
        cursor: pointer;
        transition: .22s ease;
      }

      .ai-primary {
        display: inline-flex;
        align-items: center;
        gap: 14px;
        flex: 0 0 auto;
        min-height: 56px;
        padding: 6px 7px 6px 20px;
        border-radius: 17px;
        background: linear-gradient(135deg, #c6f592, #91dc69);
        color: #0e2c1b;
        font-size: 10px;
        font-weight: 950;
        box-shadow: 0 16px 36px rgba(143, 216, 103, .18);
      }

      .ai-primary:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 22px 42px rgba(143, 216, 103, .23);
      }

      .ai-primary:disabled {
        opacity: .40;
        cursor: not-allowed;
        box-shadow: none;
      }

      .ai-primary-icon {
        display: grid;
        place-items: center;
        width: 42px;
        height: 42px;
        border-radius: 13px;
        background: rgba(10,42,25,.10);
      }

      .ai-examples {
        margin-top: 17px;
      }

      .ai-examples-label {
        display: block;
        margin-bottom: 8px;
        color: rgba(230,241,227,.34);
        font-size: 8px;
        font-weight: 900;
        letter-spacing: .11em;
        text-transform: uppercase;
      }

      .ai-example-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .ai-example-list button {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        max-width: 100%;
        padding: 9px 11px;
        border: 1px solid rgba(219,238,214,.09);
        border-radius: 12px;
        background: rgba(255,255,255,.025);
        color: rgba(233,243,230,.48);
        cursor: pointer;
        font-size: 8px;
        line-height: 1.4;
        text-align: left;
        transition: .18s ease;
      }

      .ai-example-list button:hover {
        border-color: rgba(188,237,143,.22);
        background: rgba(183,237,126,.055);
        color: rgba(240,248,237,.72);
        transform: translateY(-1px);
      }

      .ai-thinking {
        display: grid;
        grid-template-columns: 190px minmax(0, 1fr);
        gap: 38px;
        align-items: center;
        max-width: 960px;
        min-height: 330px;
        padding: 36px;
        border: 1px solid var(--line);
        border-radius: 30px;
        background: rgba(255,255,255,.038);
        backdrop-filter: blur(22px);
        box-shadow: var(--shadow);
      }

      .ai-thinking-orb {
        position: relative;
        display: grid;
        place-items: center;
        width: 160px;
        height: 160px;
        margin: 0 auto;
      }

      .ai-thinking-orb .ring,
      .ai-empty-orbit .orbit {
        position: absolute;
        inset: 0;
        border: 1px solid rgba(187,238,139,.19);
        border-radius: 50%;
      }

      .ai-thinking-orb .ring-one {
        animation: spin 7s linear infinite;
      }

      .ai-thinking-orb .ring-one::after,
      .ai-empty-orbit .orbit-a::after {
        content: "";
        position: absolute;
        width: 9px;
        height: 9px;
        right: 17px;
        top: 21px;
        border-radius: 50%;
        background: var(--green);
        box-shadow: 0 0 22px rgba(182,238,123,.70);
      }

      .ai-thinking-orb .ring-two {
        inset: 25px;
        border-style: dashed;
        animation: spinReverse 10s linear infinite;
      }

      .ai-thinking-orb .core {
        display: grid;
        place-items: center;
        width: 68px;
        height: 68px;
        border-radius: 22px;
        background: linear-gradient(145deg, #bff18b, #87d160);
        color: #11301e;
        box-shadow:
          0 0 0 14px rgba(179,237,122,.05),
          0 18px 38px rgba(126,202,90,.18);
        animation: pulse 2.2s ease-in-out infinite;
      }

      .ai-thinking-label {
        color: var(--green);
        font-size: 8px;
        font-weight: 950;
        letter-spacing: .14em;
      }

      .ai-thinking-copy h2 {
        margin: 10px 0 0;
        font-size: clamp(34px, 5vw, 56px);
        line-height: .98;
        letter-spacing: -.055em;
      }

      .ai-thinking-copy > p {
        max-width: 590px;
        margin: 14px 0 0;
        color: var(--muted);
        font-size: 11px;
        line-height: 1.7;
      }

      .ai-thinking-steps {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 24px;
      }

      .ai-thinking-steps > span {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 10px;
        border: 1px solid rgba(220,239,216,.08);
        border-radius: 999px;
        color: rgba(229,239,226,.38);
        font-size: 7px;
        font-weight: 850;
      }

      .ai-thinking-steps > span.active {
        border-color: rgba(184,238,125,.17);
        color: #bbed8c;
        background: rgba(178,236,119,.055);
      }

      .mini-loader,
      .button-loader {
        border-radius: 50%;
        animation: spin .75s linear infinite;
      }

      .mini-loader {
        width: 11px;
        height: 11px;
        border: 1.5px solid rgba(184,238,125,.20);
        border-top-color: #b8ee7e;
      }

      .ai-result-layout {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 330px;
        gap: 18px;
        align-items: start;
      }

      .ai-result-main {
        display: grid;
        gap: 18px;
        min-width: 0;
      }

      .ai-understood,
      .ai-inventory,
      .ai-action-sticky,
      .ai-sent {
        border: 1px solid var(--line);
        background:
          linear-gradient(180deg, rgba(255,255,255,.055), rgba(255,255,255,.028)),
          rgba(10,28,18,.65);
        backdrop-filter: blur(22px);
        box-shadow: 0 22px 70px rgba(0,0,0,.20);
      }

      .ai-understood,
      .ai-inventory {
        border-radius: 27px;
        padding: 26px;
      }

      .ai-understood-head,
      .ai-inventory-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 18px;
      }

      .ai-section-label {
        color: #a9df79;
      }

      .ai-section-label.centered {
        justify-content: center;
      }

      .ai-understood h2,
      .ai-inventory-head h2,
      .ai-action-panel h2 {
        margin: 9px 0 0;
        color: #f1f7ef;
        font-size: clamp(28px, 4vw, 42px);
        line-height: 1;
        letter-spacing: -.05em;
      }

      .ai-understood h2 {
        max-width: 690px;
      }

      .ai-ghost {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        flex: 0 0 auto;
        min-height: 38px;
        padding: 0 11px;
        border: 1px solid rgba(216,239,211,.09);
        border-radius: 11px;
        background: rgba(255,255,255,.025);
        color: rgba(232,243,229,.55);
        cursor: pointer;
        font-size: 8px;
        font-weight: 850;
      }

      .ai-pills {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
        margin-top: 23px;
      }

      .ai-pill {
        display: flex;
        align-items: center;
        gap: 10px;
        min-height: 68px;
        padding: 11px;
        border: 1px solid rgba(222,239,218,.075);
        border-radius: 15px;
        background: rgba(255,255,255,.025);
      }

      .ai-pill > span {
        display: grid;
        place-items: center;
        flex: 0 0 auto;
        width: 37px;
        height: 37px;
        border-radius: 11px;
        background: rgba(179,233,126,.075);
        color: #9fda73;
      }

      .ai-pill small,
      .ai-pill strong {
        display: block;
      }

      .ai-pill small {
        color: rgba(225,238,221,.36);
        font-size: 6px;
        font-weight: 900;
        letter-spacing: .07em;
        text-transform: uppercase;
      }

      .ai-pill strong {
        margin-top: 4px;
        color: rgba(241,248,239,.76);
        font-size: 9px;
        line-height: 1.35;
      }

      .ai-missing {
        display: flex;
        align-items: flex-start;
        gap: 9px;
        margin-top: 13px;
        padding: 12px;
        border: 1px solid rgba(214,183,101,.12);
        border-radius: 13px;
        background: rgba(206,161,64,.045);
        color: rgba(238,224,186,.58);
        font-size: 8px;
        line-height: 1.5;
      }

      .ai-edit-panel {
        margin-top: 16px;
        padding: 17px;
        border: 1px solid rgba(218,239,214,.085);
        border-radius: 17px;
        background: rgba(2,14,8,.22);
        animation: rise .25s ease both;
      }

      .ai-edit-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0,1fr));
        gap: 10px;
      }

      .ai-edit-grid label span {
        display: block;
        margin-bottom: 6px;
        color: rgba(228,240,225,.42);
        font-size: 7px;
        font-weight: 850;
      }

      .ai-edit-grid input,
      .ai-edit-grid select {
        width: 100%;
        height: 43px;
        padding: 0 11px;
        border: 1px solid rgba(217,238,213,.10);
        border-radius: 11px;
        outline: 0;
        background: rgba(255,255,255,.035);
        color: rgba(241,248,239,.78);
        font-size: 9px;
      }

      .ai-edit-grid select option {
        color: #173022;
      }

      .ai-refresh {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        min-height: 41px;
        margin-top: 10px;
        padding: 0 13px;
        border: 1px solid rgba(180,232,128,.15);
        border-radius: 11px;
        background: rgba(177,231,125,.065);
        color: #b9e98d;
        cursor: pointer;
        font-size: 8px;
        font-weight: 900;
      }

      .ai-refresh:disabled {
        opacity: .5;
        cursor: not-allowed;
      }

      .ai-inventory-head p {
        max-width: 600px;
        margin: 10px 0 0;
        color: var(--muted);
        font-size: 9px;
        line-height: 1.65;
      }

      .ai-engine-status {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        flex: 0 0 auto;
        padding: 8px 10px;
        border: 1px solid rgba(219,237,215,.08);
        border-radius: 999px;
        color: rgba(230,240,227,.43);
        font-size: 7px;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: .07em;
      }

      .ai-engine-status span {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #d6a968;
        box-shadow: 0 0 0 5px rgba(214,169,104,.07);
      }

      .ai-engine-status.found span {
        background: #a6df76;
        box-shadow: 0 0 0 5px rgba(166,223,118,.07);
      }

      .ai-result-section {
        margin-top: 24px;
      }

      .ai-result-title {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        margin-bottom: 10px;
        color: rgba(231,241,228,.55);
        font-size: 8px;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: .09em;
      }

      .ai-cards {
        display: grid;
        grid-template-columns: repeat(2, minmax(0,1fr));
        gap: 10px;
      }

      .ai-match-card {
        overflow: hidden;
        border: 1px solid rgba(219,239,215,.08);
        border-radius: 18px;
        background: rgba(255,255,255,.025);
        color: inherit;
        text-decoration: none;
        transition: .22s ease;
        animation: cardIn .45s ease both;
        animation-delay: var(--delay);
      }

      .ai-match-card:hover {
        transform: translateY(-4px);
        border-color: rgba(187,235,142,.17);
        background: rgba(255,255,255,.04);
        box-shadow: 0 18px 36px rgba(0,0,0,.16);
      }


      .ai-ranking-note {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        margin-top: 18px;
        padding: 12px 14px;
        border: 1px solid rgba(236, 199, 108, .14);
        border-radius: 14px;
        background: rgba(204, 155, 66, .055);
        color: rgba(244, 220, 160, .72);
        font-size: 8px;
        line-height: 1.55;
      }

      .ai-ranking-note svg { flex: 0 0 auto; margin-top: 1px; }
      .ai-ranking-note strong { display: block; color: #f0d99d; margin-bottom: 2px; }

      .ai-curated-section {
        position: relative;
        margin-top: 26px;
        padding-top: 24px;
        border-top: 1px solid rgba(222, 240, 217, .08);
      }

      .ai-curated-heading {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 14px;
      }

      .ai-curated-heading h3 {
        margin: 7px 0 0;
        color: #f3f8f1;
        font-size: clamp(20px, 3vw, 30px);
        letter-spacing: -.045em;
        line-height: 1.05;
      }

      .ai-confidence {
        flex: 0 0 auto;
        padding: 7px 9px;
        border-radius: 999px;
        font-size: 6px;
        font-weight: 950;
        letter-spacing: .08em;
        text-transform: uppercase;
      }

      .ai-confidence.strong {
        border: 1px solid rgba(190, 240, 140, .20);
        background: rgba(184, 240, 123, .08);
        color: #c7f39b;
        box-shadow: 0 0 24px rgba(167, 230, 104, .06);
      }

      .ai-confidence.soft {
        border: 1px solid rgba(235, 201, 122, .15);
        background: rgba(220, 172, 84, .06);
        color: #e7cc91;
      }

      .ai-curated-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
      }

      .ai-curated-card {
        position: relative;
        overflow: hidden;
        min-width: 0;
        border: 1px solid rgba(211, 239, 205, .11);
        border-radius: 21px;
        background: rgba(255,255,255,.032);
        color: inherit;
        text-decoration: none;
        box-shadow: 0 18px 45px rgba(0,0,0,.16);
        transition: transform .22s ease, border-color .22s ease, box-shadow .22s ease;
        animation: curatedIn .52s cubic-bezier(.2,.75,.22,1) both;
        animation-delay: var(--rank-delay);
      }

      .ai-curated-card.is-top {
        grid-column: 1 / -1;
        display: grid;
        grid-template-columns: minmax(240px, .92fr) minmax(0, 1.08fr);
        min-height: 250px;
        border-color: rgba(190, 240, 140, .18);
        background:
          linear-gradient(135deg, rgba(180, 239, 120, .055), transparent 48%),
          rgba(255,255,255,.034);
        box-shadow: 0 26px 70px rgba(0,0,0,.20);
      }

      .ai-curated-card:hover {
        transform: translateY(-3px);
        border-color: rgba(195, 240, 151, .24);
        box-shadow: 0 28px 70px rgba(0,0,0,.24);
      }

      .ai-curated-cover {
        position: relative;
        display: grid;
        place-items: center;
        min-height: 150px;
        background:
          radial-gradient(circle at 30% 20%, rgba(174, 235, 112, .12), transparent 34%),
          linear-gradient(145deg, rgba(55, 101, 63, .28), rgba(14, 39, 23, .60));
        background-size: cover;
        background-position: center;
        color: rgba(220, 240, 214, .34);
      }

      .ai-curated-card.is-top .ai-curated-cover { min-height: 250px; }

      .ai-rank-number {
        position: absolute;
        left: 13px;
        top: 12px;
        color: rgba(244, 250, 242, .72);
        font-size: 9px;
        font-weight: 950;
        letter-spacing: .12em;
      }

      .ai-score-orb {
        position: absolute;
        right: 12px;
        top: 12px;
        display: grid;
        place-items: center;
        width: 58px;
        height: 58px;
        border-radius: 50%;
        background:
          radial-gradient(circle, rgba(6, 24, 14, .96) 60%, transparent 62%),
          conic-gradient(#bff18a var(--score), rgba(255,255,255,.09) 0);
        box-shadow: 0 10px 28px rgba(0,0,0,.28), 0 0 24px rgba(177, 235, 118, .08);
        backdrop-filter: blur(10px);
      }

      .ai-score-orb span {
        margin-top: 8px;
        color: #d6f7b3;
        font-size: 14px;
        font-weight: 950;
        letter-spacing: -.04em;
      }

      .ai-score-orb small {
        margin-top: -9px;
        color: rgba(216, 240, 194, .48);
        font-size: 5px;
        font-weight: 900;
        text-transform: uppercase;
      }

      .ai-curated-body { padding: 17px; }
      .ai-curated-card.is-top .ai-curated-body { display: flex; flex-direction: column; justify-content: center; padding: 25px; }

      .ai-curated-meta { display: flex; flex-wrap: wrap; gap: 6px; }
      .ai-curated-meta span {
        padding: 5px 7px;
        border-radius: 999px;
        background: rgba(184, 236, 130, .06);
        color: rgba(197, 235, 162, .62);
        font-size: 6px;
        font-weight: 900;
      }

      .ai-curated-body h4 {
        margin: 10px 0 0;
        color: #f4f9f2;
        font-size: 18px;
        line-height: 1.08;
        letter-spacing: -.035em;
      }

      .ai-curated-card.is-top .ai-curated-body h4 { font-size: clamp(24px, 4vw, 36px); }

      .ai-curated-body p {
        margin: 9px 0 0;
        color: rgba(227, 239, 223, .52);
        font-size: 8px;
        line-height: 1.65;
      }

      .ai-curated-card.is-top .ai-curated-body p { max-width: 520px; font-size: 9px; }

      .ai-curated-bottom {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin-top: 18px;
        padding-top: 14px;
        border-top: 1px solid rgba(223, 240, 219, .07);
      }

      .ai-curated-bottom strong { color: #bced8f; font-size: 11px; }
      .ai-curated-bottom span {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        color: rgba(235, 244, 232, .52);
        font-size: 7px;
        font-weight: 900;
      }

      @keyframes curatedIn {
        from { opacity: 0; transform: translateY(16px) scale(.985); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }

      .ai-match-cover {
        position: relative;
        display: grid;
        place-items: center;
        height: 142px;
        background:
          linear-gradient(145deg, rgba(75,124,77,.24), rgba(22,54,32,.45));
        background-position: center;
        background-size: cover;
        color: rgba(210,236,203,.30);
      }

      .ai-score {
        position: absolute;
        right: 9px;
        top: 9px;
        padding: 6px 8px;
        border: 1px solid rgba(255,255,255,.10);
        border-radius: 999px;
        background: rgba(5,22,13,.58);
        backdrop-filter: blur(10px);
        color: #c1ed96;
        font-size: 6px;
        font-weight: 900;
        text-transform: uppercase;
      }

      .ai-match-body {
        padding: 14px;
      }

      .ai-match-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .ai-match-meta span {
        padding: 4px 6px;
        border-radius: 999px;
        background: rgba(181,234,128,.06);
        color: rgba(189,233,149,.58);
        font-size: 6px;
        font-weight: 850;
      }

      .ai-match-body h3 {
        margin: 9px 0 0;
        color: rgba(244,249,242,.86);
        font-size: 15px;
        line-height: 1.15;
        letter-spacing: -.025em;
      }

      .ai-match-bottom {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        margin-top: 16px;
      }

      .ai-match-bottom strong {
        color: #b7e989;
        font-size: 10px;
      }

      .ai-match-bottom span {
        display: inline-flex;
        align-items: center;
        gap: 3px;
        color: rgba(231,241,228,.40);
        font-size: 7px;
        font-weight: 850;
      }

      .ai-event-list {
        display: grid;
        gap: 7px;
      }

      .ai-event-row {
        display: grid;
        grid-template-columns: 43px minmax(0,1fr) auto;
        gap: 10px;
        align-items: center;
        min-height: 68px;
        padding: 10px;
        border: 1px solid rgba(219,238,215,.075);
        border-radius: 15px;
        background: rgba(255,255,255,.022);
        color: inherit;
        text-decoration: none;
        transition: .18s ease;
      }

      .ai-event-row:hover {
        border-color: rgba(184,234,138,.16);
        background: rgba(255,255,255,.04);
        transform: translateX(2px);
      }

      .ai-event-icon {
        display: grid;
        place-items: center;
        width: 43px;
        height: 43px;
        border-radius: 12px;
        background: rgba(182,234,130,.07);
        color: #a6dc79;
      }

      .ai-event-copy small,
      .ai-event-copy strong,
      .ai-event-copy span {
        display: block;
      }

      .ai-event-copy small {
        color: rgba(227,239,224,.35);
        font-size: 6px;
        font-weight: 850;
        text-transform: uppercase;
      }

      .ai-event-copy strong {
        margin-top: 3px;
        color: rgba(244,249,242,.82);
        font-size: 10px;
      }

      .ai-event-copy span {
        margin-top: 3px;
        color: rgba(226,238,223,.42);
        font-size: 7px;
      }

      .ai-empty-visual {
        display: grid;
        grid-template-columns: 120px minmax(0,1fr);
        gap: 24px;
        align-items: center;
        margin-top: 24px;
        padding: 22px;
        border: 1px dashed rgba(187,233,145,.12);
        border-radius: 20px;
        background:
          radial-gradient(circle at 15% 50%, rgba(166,225,106,.055), transparent 27%);
      }

      .ai-empty-orbit {
        position: relative;
        display: grid;
        place-items: center;
        width: 100px;
        height: 100px;
        margin: 0 auto;
      }

      .ai-empty-orbit .orbit-b {
        inset: 16px;
        border-style: dashed;
        animation: spinReverse 9s linear infinite;
      }

      .empty-core {
        display: grid;
        place-items: center;
        width: 48px;
        height: 48px;
        border-radius: 16px;
        background: rgba(176,232,119,.08);
        color: #a6dd77;
      }

      .ai-empty-visual strong {
        display: block;
        color: rgba(241,248,239,.78);
        font-size: 16px;
        letter-spacing: -.025em;
      }

      .ai-empty-visual p {
        max-width: 510px;
        margin: 7px 0 0;
        color: rgba(225,237,222,.43);
        font-size: 8px;
        line-height: 1.65;
      }

      .ai-action-sticky {
        position: sticky;
        top: 96px;
        padding: 22px;
        border-radius: 24px;
      }

      .ai-action-panel h2 {
        font-size: 29px;
      }

      .ai-action-panel > div > p {
        margin: 11px 0 0;
        color: rgba(225,237,222,.48);
        font-size: 9px;
        line-height: 1.65;
      }

      .ai-privacy-box {
        display: flex;
        align-items: flex-start;
        gap: 9px;
        margin-top: 17px;
        padding: 12px;
        border: 1px solid rgba(176,229,125,.10);
        border-radius: 13px;
        background: rgba(174,228,121,.045);
        color: #a7da79;
      }

      .ai-privacy-box svg {
        flex: 0 0 auto;
      }

      .ai-privacy-box strong,
      .ai-privacy-box span {
        display: block;
      }

      .ai-privacy-box strong {
        font-size: 8px;
      }

      .ai-privacy-box span {
        margin-top: 4px;
        color: rgba(225,237,222,.42);
        font-size: 7px;
        line-height: 1.5;
      }

      .ai-host-cta {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        width: 100%;
        min-height: 50px;
        margin-top: 14px;
        padding: 0 14px;
        border-radius: 14px;
        background: linear-gradient(135deg, #bdf089, #83d25f);
        color: #102c1b;
        font-size: 9px;
        font-weight: 950;
        box-shadow: 0 15px 30px rgba(133,209,93,.14);
      }

      .ai-host-cta:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 20px 36px rgba(133,209,93,.19);
      }

      .ai-host-cta:disabled {
        opacity: .5;
        cursor: not-allowed;
      }

      .button-loader {
        width: 14px;
        height: 14px;
        border: 2px solid rgba(16,44,27,.18);
        border-top-color: #12331f;
      }

      .ai-new-search {
        width: 100%;
        margin-top: 8px;
        padding: 10px;
        border: 0;
        background: transparent;
        color: rgba(229,240,226,.40);
        cursor: pointer;
        font-size: 8px;
        font-weight: 850;
      }

      .ai-flow-mini {
        display: grid;
        gap: 8px;
        margin-top: 19px;
        padding-top: 17px;
        border-top: 1px solid rgba(221,239,218,.07);
      }

      .ai-flow-mini div {
        display: grid;
        grid-template-columns: 27px 1fr;
        gap: 8px;
        align-items: center;
      }

      .ai-flow-mini div > span {
        display: grid;
        place-items: center;
        width: 27px;
        height: 27px;
        border: 1px solid rgba(218,237,214,.08);
        border-radius: 9px;
        color: #96c96f;
        font-size: 6px;
        font-weight: 950;
      }

      .ai-flow-mini p {
        margin: 0;
        color: rgba(228,239,225,.40);
        font-size: 7px;
        font-weight: 800;
      }

      .ai-flow-mini i {
        display: block;
        width: 1px;
        height: 8px;
        margin-left: 13px;
        background: rgba(218,237,214,.08);
      }

      .ai-sent {
        position: relative;
        overflow: hidden;
        max-width: 760px;
        margin: 0 auto;
        padding: 46px 34px;
        border-radius: 30px;
        text-align: center;
      }

      .ai-sent-glow {
        position: absolute;
        width: 360px;
        height: 360px;
        left: 50%;
        top: -270px;
        transform: translateX(-50%);
        border-radius: 50%;
        background: rgba(171,229,111,.16);
        filter: blur(30px);
      }

      .ai-sent-icon {
        position: relative;
        z-index: 1;
        display: grid;
        place-items: center;
        width: 66px;
        height: 66px;
        margin: 0 auto 18px;
        border-radius: 22px;
        background: linear-gradient(145deg, #c3f191, #86d160);
        color: #11321f;
        box-shadow:
          0 0 0 15px rgba(177,232,120,.045),
          0 18px 38px rgba(129,203,88,.16);
      }

      .ai-sent h2 {
        position: relative;
        z-index: 1;
        margin: 10px 0 0;
        font-size: clamp(36px, 6vw, 59px);
        line-height: .95;
        letter-spacing: -.06em;
      }

      .ai-sent > p {
        position: relative;
        z-index: 1;
        max-width: 590px;
        margin: 15px auto 0;
        color: rgba(226,238,223,.48);
        font-size: 10px;
        line-height: 1.7;
      }

      .ai-sent-stat {
        position: relative;
        z-index: 1;
        display: inline-flex;
        flex-direction: column;
        margin-top: 21px;
        padding: 13px 20px;
        border: 1px solid rgba(186,234,140,.11);
        border-radius: 15px;
        background: rgba(180,232,127,.045);
      }

      .ai-sent-stat strong {
        color: #bced8e;
        font-size: 28px;
        letter-spacing: -.05em;
      }

      .ai-sent-stat span {
        margin-top: 3px;
        color: rgba(226,238,223,.40);
        font-size: 7px;
        font-weight: 850;
      }

      .ai-sent-actions {
        position: relative;
        z-index: 1;
        display: flex;
        justify-content: center;
        gap: 8px;
        margin-top: 20px;
      }

      .ai-primary-link,
      .ai-sent-actions button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        min-height: 45px;
        padding: 0 15px;
        border-radius: 13px;
        font-size: 8px;
        font-weight: 900;
      }

      .ai-primary-link {
        background: linear-gradient(135deg, #bff08d, #88d362);
        color: #102d1b;
      }

      .ai-sent-actions button {
        border: 1px solid rgba(220,239,216,.09);
        background: rgba(255,255,255,.025);
        color: rgba(232,242,229,.54);
        cursor: pointer;
      }

      .ai-error {
        display: grid;
        grid-template-columns: 36px minmax(0,1fr) auto;
        gap: 10px;
        align-items: center;
        max-width: 760px;
        margin-top: 16px;
        padding: 12px;
        border: 1px solid rgba(228,137,123,.16);
        border-radius: 14px;
        background: rgba(137,51,42,.14);
      }

      .ai-error > span {
        display: grid;
        place-items: center;
        width: 36px;
        height: 36px;
        border-radius: 11px;
        background: rgba(224,119,104,.10);
        color: #e4a097;
      }

      .ai-error strong {
        display: block;
        color: #efc2bb;
        font-size: 8px;
      }

      .ai-error p {
        margin: 3px 0 0;
        color: rgba(239,194,187,.58);
        font-size: 7px;
        line-height: 1.45;
      }

      .ai-error > button {
        border: 0;
        background: transparent;
        color: rgba(238,193,186,.40);
        cursor: pointer;
      }

      .ai-principles {
        display: grid;
        grid-template-columns: repeat(3, minmax(0,1fr));
        gap: 9px;
        max-width: 1020px;
        margin-top: 46px;
      }

      .ai-principles > div {
        min-height: 130px;
        padding: 17px;
        border-top: 1px solid rgba(221,239,217,.09);
      }

      .ai-principles span {
        color: #87bc66;
        font-size: 7px;
        font-weight: 950;
      }

      .ai-principles strong {
        display: block;
        margin-top: 25px;
        color: rgba(240,247,238,.68);
        font-size: 10px;
      }

      .ai-principles p {
        margin: 6px 0 0;
        color: rgba(225,237,222,.34);
        font-size: 7px;
        line-height: 1.55;
      }

      .ai-loading-page {
        display: grid;
        place-items: center;
        align-content: center;
        min-height: 100vh;
        gap: 8px;
        background:
          radial-gradient(circle at 50% 35%, rgba(150,219,100,.10), transparent 28%),
          #07170f;
        color: rgba(239,247,236,.75);
      }

      .ai-loading-page strong {
        margin-top: 8px;
        font-size: 11px;
      }

      .ai-loading-page small {
        color: rgba(229,239,226,.36);
        font-size: 8px;
      }

      .ai-orb-loader {
        position: relative;
        width: 60px;
        height: 60px;
      }

      .ai-orb-loader span {
        position: absolute;
        inset: 0;
        border: 1px solid rgba(183,236,125,.18);
        border-radius: 50%;
        animation: pulseRing 1.8s ease-out infinite;
      }

      .ai-orb-loader span:nth-child(2) { animation-delay: .35s; }
      .ai-orb-loader span:nth-child(3) { animation-delay: .7s; }

      .ai-rise {
        animation: rise .48s cubic-bezier(.2,.75,.22,1) both;
      }

      @keyframes rise {
        from { opacity: 0; transform: translateY(14px); }
        to { opacity: 1; transform: translateY(0); }
      }

      @keyframes ambientFloat {
        from { transform: translate3d(0, -12px, 0) scale(.95); }
        to { transform: translate3d(18px, 18px, 0) scale(1.05); }
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      @keyframes spinReverse {
        to { transform: rotate(-360deg); }
      }

      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.045); }
      }

      @keyframes pulseRing {
        0% { opacity: .9; transform: scale(.45); }
        100% { opacity: 0; transform: scale(1.35); }
      }

      @keyframes cardIn {
        from { opacity: 0; transform: translateY(12px); }
        to { opacity: 1; transform: translateY(0); }
      }



      /* =========================================================
         MEETOUTDOORS AGENT — FINAL PRODUCT UI V3
         Graphite / stone / restrained outdoor accent.
         One final visual layer. Backend and Agent logic untouched.
         ========================================================= */

      body {
        background: #0d0f0e;
      }

      .ai-page,
      .ai-loading-page {
        --bg: #0d0f0e;
        --bg2: #121513;
        --ink: #f4f2ec;
        --muted: rgba(235, 233, 225, .58);
        --green: #9dce88;
        --green-2: #78aa69;
        --stone: #c8b99c;
        --stone-soft: #e0d6c4;
        --panel: rgba(23, 26, 24, .88);
        --panel-2: rgba(255,255,255,.038);
        --line: rgba(255,255,255,.085);
        --line-strong: rgba(255,255,255,.13);
        --shadow: 0 22px 70px rgba(0,0,0,.28);
        color: var(--ink);
      }

      .ai-page {
        isolation: isolate;
        overflow-x: hidden;
        padding: 94px 18px 54px;
        background:
          radial-gradient(circle at 76% -8%, rgba(157, 206, 136, .075), transparent 30%),
          radial-gradient(circle at 13% 23%, rgba(200, 185, 156, .045), transparent 24%),
          linear-gradient(180deg, #0d0f0e 0%, #111412 45%, #0d0f0e 100%);
      }

      .ai-page::before {
        content: "";
        position: fixed;
        inset: 0;
        z-index: 0;
        pointer-events: none;
        opacity: .34;
        background-image:
          linear-gradient(rgba(255,255,255,.012) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,.012) 1px, transparent 1px);
        background-size: 48px 48px;
        mask-image: linear-gradient(to bottom, #000, transparent 74%);
      }

      .ai-grid-noise { display: none; }

      .ai-ambient {
        opacity: .55;
        filter: blur(80px);
        animation-duration: 16s;
      }

      .ai-ambient-one {
        width: 340px;
        height: 340px;
        right: -150px;
        top: 4%;
        background: rgba(143, 192, 122, .08);
      }

      .ai-ambient-two {
        width: 300px;
        height: 300px;
        left: -170px;
        bottom: 10%;
        background: rgba(192, 176, 145, .055);
      }

      .ai-shell {
        width: min(1280px, 100%);
      }

      /* HERO */
      .ai-hero {
        max-width: 840px;
        margin-bottom: 22px;
      }

      .ai-kicker {
        width: fit-content;
        padding: 5px 8px 5px 5px;
        border: 1px solid var(--line);
        border-radius: 999px;
        background: rgba(255,255,255,.025);
        color: rgba(241,239,232,.60);
        box-shadow: inset 0 1px rgba(255,255,255,.025);
        backdrop-filter: blur(12px);
      }

      .ai-kicker-dot {
        width: 25px;
        height: 25px;
        border-radius: 8px;
        border-color: rgba(157,206,136,.17);
        background: rgba(157,206,136,.07);
        color: #a9d596;
        box-shadow: none;
      }

      .ai-live {
        padding: 4px 6px;
        border-color: rgba(157,206,136,.14);
        background: rgba(157,206,136,.055);
        color: #a9d596;
      }

      .ai-hero h1 {
        max-width: 820px;
        margin-top: 15px;
        font-size: clamp(46px, 6.8vw, 82px);
        line-height: .91;
        letter-spacing: -.067em;
        font-weight: 850;
        text-wrap: balance;
        text-shadow: none;
      }

      .ai-hero h1 span {
        margin-top: 5px;
        color: #c7b99d;
        background: none;
        -webkit-text-fill-color: initial;
        filter: none;
      }

      .ai-hero p {
        max-width: 650px;
        margin-top: 15px;
        color: var(--muted);
        font-size: 11px;
        line-height: 1.65;
      }

      /* COMPOSER */
      .ai-composer-wrap {
        max-width: 950px;
      }

      .ai-composer {
        padding: 18px;
        border: 1px solid var(--line-strong);
        border-radius: 22px;
        background:
          linear-gradient(180deg, rgba(255,255,255,.044), rgba(255,255,255,.018)),
          rgba(20, 23, 21, .86);
        box-shadow:
          0 22px 62px rgba(0,0,0,.24),
          inset 0 1px 0 rgba(255,255,255,.035);
        backdrop-filter: blur(20px);
        transition: border-color .2s ease, box-shadow .2s ease, transform .2s ease;
      }

      .ai-composer::before {
        background: linear-gradient(90deg, rgba(157,206,136,.045), transparent 38%);
      }

      .ai-composer:focus-within {
        transform: translateY(-1px);
        border-color: rgba(157,206,136,.28);
        box-shadow:
          0 28px 72px rgba(0,0,0,.28),
          0 0 0 3px rgba(157,206,136,.025),
          inset 0 1px 0 rgba(255,255,255,.04);
      }

      .ai-agent-mark {
        width: 32px;
        height: 32px;
        border-radius: 10px;
        background: #c7b99d;
        color: #1b1c1a;
        box-shadow: none;
      }

      .ai-composer-label {
        color: rgba(244,242,236,.69);
        font-size: 9px;
      }

      .ai-composer textarea {
        min-height: 112px;
        margin-top: 12px;
        resize: none;
        color: #f4f2ec;
        font-size: clamp(18px, 2.3vw, 26px);
        line-height: 1.34;
        caret-color: #9dce88;
      }

      .ai-composer textarea::placeholder {
        color: rgba(244,242,236,.20);
      }

      .ai-composer textarea::selection {
        background: rgba(157,206,136,.18);
      }

      .ai-composer-bottom {
        gap: 10px;
        margin-top: 9px;
        padding-top: 10px;
        border-top-color: rgba(255,255,255,.065);
      }

      .ai-composer-meta {
        color: rgba(239,236,228,.36);
      }

      .ai-primary,
      .ai-host-cta,
      .ai-primary-link {
        position: relative;
        overflow: hidden;
        border: 1px solid rgba(173,218,153,.18);
        background: #a7d393;
        color: #111611;
        box-shadow: none;
      }

      .ai-primary {
        min-height: 43px;
        padding: 4px 5px 4px 14px;
        border-radius: 12px;
        font-size: 8px;
      }

      .ai-primary-icon {
        width: 33px;
        height: 33px;
        border-radius: 9px;
        background: rgba(17,22,17,.10);
      }

      .ai-primary:hover:not(:disabled),
      .ai-host-cta:hover:not(:disabled),
      .ai-primary-link:hover {
        transform: translateY(-1px);
        background: #b3dc9f;
        box-shadow: 0 12px 26px rgba(0,0,0,.16);
      }

      .ai-examples {
        margin-top: 9px;
      }

      .ai-examples-label {
        margin-bottom: 6px;
        color: rgba(241,238,230,.28);
        font-size: 6.5px;
      }

      .ai-example-list {
        flex-wrap: nowrap;
        gap: 5px;
        overflow-x: auto;
        padding-bottom: 3px;
        scrollbar-width: none;
      }

      .ai-example-list::-webkit-scrollbar { display: none; }

      .ai-example-list button {
        flex: 0 0 auto;
        max-width: 310px;
        padding: 7px 9px;
        border-color: rgba(255,255,255,.07);
        border-radius: 10px;
        background: rgba(255,255,255,.022);
        color: rgba(241,238,230,.43);
        font-size: 7px;
      }

      .ai-example-list button:hover {
        transform: none;
        border-color: rgba(157,206,136,.16);
        background: rgba(157,206,136,.035);
        color: rgba(245,243,237,.72);
      }

      /* THINKING */
      .ai-thinking {
        grid-template-columns: 118px minmax(0,1fr);
        gap: 24px;
        max-width: 820px;
        min-height: 220px;
        padding: 22px;
        border: 1px solid var(--line);
        border-radius: 22px;
        background: rgba(20,23,21,.88);
        box-shadow: var(--shadow);
      }

      .ai-thinking-orb {
        width: 102px;
        height: 102px;
      }

      .ai-thinking-orb .ring,
      .ai-empty-orbit .orbit {
        border-color: rgba(157,206,136,.15);
      }

      .ai-thinking-orb .core {
        width: 48px;
        height: 48px;
        border-radius: 15px;
        background: #a7d393;
        color: #111611;
        box-shadow: 0 0 0 10px rgba(157,206,136,.035);
      }

      .ai-thinking-label,
      .ai-section-label {
        color: #9fc68e;
      }

      .ai-thinking-copy h2 {
        font-size: clamp(28px, 4vw, 44px);
      }

      .ai-thinking-copy > p {
        font-size: 9px;
      }

      .ai-thinking-steps {
        margin-top: 15px;
      }

      .ai-thinking-steps > span {
        padding: 6px 8px;
        border-color: rgba(255,255,255,.065);
        color: rgba(238,235,227,.32);
      }

      .ai-thinking-steps > span.active {
        border-color: rgba(157,206,136,.15);
        background: rgba(157,206,136,.04);
        color: #a7d393;
      }

      /* RESULT LAYOUT */
      .ai-result-layout {
        grid-template-columns: minmax(0,1fr) 280px;
        gap: 10px;
      }

      .ai-result-main {
        gap: 10px;
      }

      .ai-understood,
      .ai-inventory,
      .ai-action-sticky,
      .ai-sent {
        border: 1px solid var(--line);
        background:
          linear-gradient(180deg, rgba(255,255,255,.032), rgba(255,255,255,.016)),
          rgba(19,22,20,.90);
        box-shadow: 0 16px 44px rgba(0,0,0,.19);
        backdrop-filter: blur(18px);
      }

      .ai-understood,
      .ai-inventory {
        padding: 16px;
        border-radius: 17px;
      }

      .ai-understood::before,
      .ai-inventory::before {
        display: none;
      }

      .ai-understood-head,
      .ai-inventory-head {
        gap: 10px;
      }

      .ai-understood h2,
      .ai-inventory-head h2,
      .ai-action-panel h2 {
        margin-top: 5px;
        color: #f3f1ea;
        font-size: clamp(22px, 3.2vw, 32px);
        line-height: 1.04;
      }

      .ai-ghost {
        min-height: 31px;
        padding: 0 8px;
        border-color: rgba(255,255,255,.07);
        border-radius: 9px;
        background: rgba(255,255,255,.02);
        color: rgba(241,238,230,.45);
        font-size: 6.5px;
      }

      .ai-pills {
        grid-template-columns: repeat(4,minmax(0,1fr));
        gap: 5px;
        margin-top: 12px;
      }

      .ai-pill {
        gap: 7px;
        min-height: 50px;
        padding: 7px;
        border: 1px solid rgba(255,255,255,.06);
        border-radius: 11px;
        background: rgba(255,255,255,.018);
      }

      .ai-pill:hover {
        transform: none;
        border-color: rgba(255,255,255,.085);
        background: rgba(255,255,255,.026);
      }

      .ai-pill > span {
        width: 29px;
        height: 29px;
        border-radius: 9px;
        background: rgba(157,206,136,.055);
        color: #98c186;
      }

      .ai-pill small {
        font-size: 5px;
        color: rgba(239,236,228,.30);
      }

      .ai-pill strong {
        margin-top: 2px;
        font-size: 7.5px;
        color: rgba(246,244,238,.72);
      }

      .ai-missing,
      .ai-ranking-note {
        margin-top: 8px;
        padding: 8px 9px;
        border-radius: 10px;
        font-size: 7px;
      }

      .ai-edit-panel {
        margin-top: 9px;
        padding: 10px;
        border-color: rgba(255,255,255,.07);
        border-radius: 12px;
        background: rgba(0,0,0,.12);
      }

      .ai-edit-grid {
        gap: 6px;
      }

      .ai-edit-grid input,
      .ai-edit-grid select {
        height: 36px;
        border-color: rgba(255,255,255,.08);
        border-radius: 9px;
        background: rgba(255,255,255,.025);
        color: #ece9e1;
        font-size: 8px;
      }

      .ai-refresh {
        min-height: 34px;
        margin-top: 7px;
        border-color: rgba(157,206,136,.13);
        border-radius: 9px;
        background: rgba(157,206,136,.04);
        color: #a7d393;
      }

      .ai-inventory-head p {
        margin-top: 6px;
        font-size: 8px;
      }

      .ai-engine-status {
        padding: 6px 8px;
        border-color: rgba(255,255,255,.07);
        background: rgba(255,255,255,.018);
        color: rgba(239,236,228,.37);
        font-size: 5.8px;
      }

      .ai-engine-status.found {
        border-color: rgba(157,206,136,.12);
        background: rgba(157,206,136,.04);
      }

      .ai-engine-status span,
      .ai-engine-status.found span {
        background: #a7d393;
        box-shadow: 0 0 0 4px rgba(157,206,136,.05);
      }

      /* TOP RECOMMENDATION */
      .ai-curated-section {
        margin: 14px 0 0;
        padding: 14px 0 0;
        border: 0;
        border-top: 1px solid rgba(255,255,255,.065);
        border-radius: 0;
        background: transparent;
      }

      .ai-curated-heading {
        margin-bottom: 8px;
      }

      .ai-curated-heading h3 {
        margin-top: 4px;
        font-size: clamp(18px,2.5vw,24px);
      }

      .ai-confidence {
        padding: 5px 7px;
        font-size: 5px;
      }

      .ai-confidence.strong {
        border-color: rgba(157,206,136,.15);
        background: rgba(157,206,136,.045);
        color: #b2d8a1;
        box-shadow: none;
      }

      .ai-confidence.soft {
        border-color: rgba(200,185,156,.13);
        background: rgba(200,185,156,.04);
        color: #c9bda4;
      }

      .ai-curated-grid {
        gap: 7px;
      }

      .ai-curated-card {
        border: 1px solid rgba(255,255,255,.07);
        border-radius: 14px;
        background: #171a18;
        box-shadow: none;
      }

      .ai-curated-card:hover {
        transform: translateY(-2px);
        border-color: rgba(255,255,255,.11);
        box-shadow: 0 14px 30px rgba(0,0,0,.16);
      }

      .ai-curated-card.is-top {
        grid-template-columns: minmax(230px,.95fr) minmax(0,1.05fr);
        min-height: 220px;
        border-color: rgba(157,206,136,.12);
        background: #171a18;
        box-shadow: 0 16px 36px rgba(0,0,0,.18);
      }

      .ai-curated-card.is-top::after {
        content: "NAJBOLJI MATCH";
        top: 10px;
        left: 10px;
        padding: 5px 7px;
        border-color: rgba(255,255,255,.11);
        background: rgba(12,14,13,.72);
        color: #ece8df;
        font-size: 5.5px;
        letter-spacing: .1em;
      }

      .ai-curated-cover,
      .ai-curated-card.is-top .ai-curated-cover {
        min-height: 220px;
        background:
          linear-gradient(180deg,rgba(12,14,13,.03),rgba(12,14,13,.72)),
          #242824;
      }

      .ai-score-orb {
        width: 50px;
        height: 50px;
        background:
          radial-gradient(circle, rgba(18,21,19,.96) 59%, transparent 61%),
          conic-gradient(#a7d393 var(--score), rgba(255,255,255,.08) 0);
        box-shadow: 0 8px 18px rgba(0,0,0,.24);
      }

      .ai-score-orb span {
        color: #d9e9d1;
        font-size: 12px;
      }

      .ai-score-orb small {
        color: rgba(226,232,222,.44);
      }

      .ai-curated-body,
      .ai-curated-card.is-top .ai-curated-body {
        padding: 15px;
      }

      .ai-curated-meta span {
        padding: 4px 6px;
        background: rgba(255,255,255,.03);
        color: rgba(238,235,227,.45);
        font-size: 5.5px;
      }

      .ai-curated-body h4 {
        margin-top: 7px;
        color: #f2efe8;
        font-size: 16px;
      }

      .ai-curated-card.is-top .ai-curated-body h4 {
        font-size: clamp(22px,3vw,30px);
      }

      .ai-curated-body p,
      .ai-curated-card.is-top .ai-curated-body p {
        margin-top: 7px;
        color: rgba(235,232,223,.48);
        font-size: 7.5px;
        line-height: 1.55;
      }

      .ai-curated-bottom {
        margin-top: 12px;
        padding-top: 10px;
        border-top-color: rgba(255,255,255,.055);
      }

      .ai-curated-bottom strong,
      .ai-match-bottom strong {
        color: #c8b99c;
      }

      .ai-curated-bottom span {
        color: rgba(238,235,227,.42);
      }

      /* SECONDARY INVENTORY */
      .ai-result-section {
        margin-top: 14px;
      }

      .ai-result-title {
        margin-bottom: 7px;
        color: rgba(241,238,230,.42);
        font-size: 6.5px;
      }

      .ai-cards {
        gap: 6px;
      }

      .ai-match-card {
        border-color: rgba(255,255,255,.06);
        border-radius: 12px;
        background: rgba(255,255,255,.016);
      }

      .ai-match-card:hover {
        transform: translateY(-2px);
        border-color: rgba(255,255,255,.10);
        background: rgba(255,255,255,.025);
        box-shadow: none;
      }

      .ai-match-cover {
        height: 116px;
        background: #242824;
      }

      .ai-score {
        background: rgba(15,17,16,.72);
        color: #d8e7d1;
      }

      .ai-match-body {
        padding: 10px;
      }

      .ai-match-meta span {
        background: rgba(255,255,255,.025);
        color: rgba(239,236,228,.42);
      }

      .ai-match-body h3 {
        margin-top: 6px;
        font-size: 12px;
      }

      .ai-match-bottom {
        margin-top: 10px;
      }

      .ai-event-list {
        gap: 5px;
      }

      .ai-event-row {
        grid-template-columns: 34px minmax(0,1fr) auto;
        gap: 8px;
        min-height: 55px;
        padding: 7px;
        border-color: rgba(255,255,255,.06);
        border-radius: 11px;
        background: rgba(255,255,255,.014);
      }

      .ai-event-row:hover {
        transform: translateY(-1px);
        border-color: rgba(255,255,255,.095);
      }

      .ai-event-icon {
        width: 34px;
        height: 34px;
        border-radius: 9px;
        background: rgba(157,206,136,.045);
        color: #91bb82;
      }

      /* CUSTOM MATCH AS SECONDARY */
      .ai-action-sticky {
        top: 86px;
        padding: 14px;
        border-radius: 15px;
        border-color: rgba(255,255,255,.075);
        background: rgba(18,21,19,.94);
        box-shadow: 0 14px 34px rgba(0,0,0,.16);
      }

      .ai-action-panel h2 {
        font-size: 22px;
      }

      .ai-action-panel > div > p {
        margin-top: 7px;
        color: rgba(235,232,223,.43);
        font-size: 7.5px;
        line-height: 1.5;
      }

      .ai-privacy-box {
        margin-top: 10px;
        padding: 8px;
        border-color: rgba(255,255,255,.06);
        border-radius: 10px;
        background: rgba(255,255,255,.018);
        color: #9fc68e;
      }

      .ai-privacy-box strong { font-size: 7px; }
      .ai-privacy-box span { font-size: 6px; }

      .ai-host-cta {
        min-height: 39px;
        margin-top: 9px;
        border-radius: 10px;
        font-size: 7px;
      }

      .ai-new-search {
        margin-top: 4px;
        padding: 7px;
        color: rgba(239,236,228,.36);
        font-size: 6.5px;
      }

      .ai-flow-mini {
        margin-top: 10px;
        padding-top: 9px;
      }

      .ai-flow-mini div {
        grid-template-columns: 22px 1fr;
        gap: 6px;
      }

      .ai-flow-mini div > span {
        width: 22px;
        height: 22px;
        border-radius: 7px;
        color: #9fc68e;
        font-size: 5px;
      }

      .ai-flow-mini p {
        font-size: 6px;
      }

      /* EMPTY / SENT / ERROR */
      .ai-empty-visual {
        grid-template-columns: 82px minmax(0,1fr);
        gap: 16px;
        margin-top: 14px;
        padding: 14px;
        border-color: rgba(255,255,255,.07);
        border-radius: 14px;
        background: rgba(255,255,255,.014);
      }

      .ai-empty-orbit {
        width: 72px;
        height: 72px;
      }

      .empty-core {
        width: 38px;
        height: 38px;
        border-radius: 12px;
        background: rgba(157,206,136,.055);
        color: #9fc68e;
      }

      .ai-empty-visual strong {
        font-size: 13px;
      }

      .ai-empty-visual p {
        font-size: 7px;
      }

      .ai-sent {
        max-width: 680px;
        padding: 30px 24px;
        border-radius: 22px;
      }

      .ai-sent-glow {
        background: rgba(157,206,136,.08);
      }

      .ai-sent-icon {
        width: 52px;
        height: 52px;
        border-radius: 16px;
        background: #a7d393;
        color: #111611;
        box-shadow: 0 0 0 10px rgba(157,206,136,.03);
      }

      .ai-sent h2 {
        font-size: clamp(30px,5vw,48px);
      }

      .ai-sent > p {
        font-size: 8.5px;
      }

      .ai-sent-stat {
        border-color: rgba(255,255,255,.07);
        background: rgba(255,255,255,.018);
      }

      .ai-sent-stat strong {
        color: #c8b99c;
      }

      .ai-primary-link {
        background: #a7d393;
        color: #111611;
      }

      .ai-error {
        border-color: rgba(197,107,96,.16);
        background: rgba(116,44,38,.16);
      }

      /* PRINCIPLES */
      .ai-principles {
        gap: 5px;
        max-width: 950px;
        margin-top: 16px;
      }

      .ai-principles > div {
        min-height: 78px;
        padding: 9px;
        border: 1px solid rgba(255,255,255,.055);
        border-radius: 11px;
        background: rgba(255,255,255,.012);
      }

      .ai-principles > div:hover {
        transform: none;
        border-color: rgba(255,255,255,.08);
        background: rgba(255,255,255,.018);
      }

      .ai-principles span {
        color: #9fc68e;
        font-size: 5.5px;
      }

      .ai-principles strong {
        margin-top: 10px;
        font-size: 8px;
      }

      .ai-principles p {
        margin-top: 4px;
        font-size: 6px;
      }

      /* LOADING */
      .ai-loading-page {
        background:
          radial-gradient(circle at 50% 35%, rgba(157,206,136,.06), transparent 28%),
          #0d0f0e;
      }

      .ai-orb-loader span {
        border-color: rgba(157,206,136,.15);
      }

      /* TABLET */

      .ai-host-results {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
        margin-top: 22px;
      }

      .ai-host-card {
        overflow: hidden;
        min-width: 0;
        border: 1px solid rgba(214, 239, 209, .11);
        border-radius: 22px;
        background: rgba(255,255,255,.045);
        box-shadow: 0 18px 50px rgba(0,0,0,.16);
        animation: hostCardIn .52s ease both;
        animation-delay: var(--host-delay, 0ms);
      }

      .ai-host-cover {
        height: 118px;
        overflow: hidden;
        background: rgba(184,240,123,.06);
      }

      .ai-host-cover img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .ai-host-cover-fallback {
        display: grid;
        place-items: center;
        width: 100%;
        height: 100%;
        color: var(--green);
        background:
          radial-gradient(circle at 70% 10%, rgba(184,240,123,.13), transparent 36%),
          linear-gradient(135deg, rgba(255,255,255,.05), transparent);
      }

      .ai-host-card-body {
        padding: 14px;
      }

      .ai-host-identity {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .ai-host-avatar {
        display: grid;
        place-items: center;
        flex: 0 0 42px;
        width: 42px;
        height: 42px;
        overflow: hidden;
        border: 1px solid rgba(205,241,174,.16);
        border-radius: 14px;
        background: rgba(184,240,123,.09);
        color: var(--green);
        font-size: 14px;
        font-weight: 950;
      }

      .ai-host-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .ai-host-identity > div:last-child {
        min-width: 0;
      }

      .ai-host-identity strong,
      .ai-host-identity span {
        display: block;
      }

      .ai-host-identity strong {
        overflow: hidden;
        color: #f4f9f1;
        font-size: 13px;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .ai-host-identity span {
        margin-top: 3px;
        color: rgba(229,239,229,.48);
        font-size: 9px;
      }

      .ai-host-best {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        margin-top: 12px;
        padding: 6px 8px;
        border: 1px solid rgba(184,240,123,.16);
        border-radius: 999px;
        background: rgba(184,240,123,.075);
        color: var(--green);
        font-size: 8px;
        font-weight: 900;
      }

      .ai-host-capabilities {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
        margin-top: 10px;
      }

      .ai-host-capabilities span {
        padding: 5px 7px;
        border: 1px solid rgba(230,242,226,.08);
        border-radius: 999px;
        background: rgba(255,255,255,.035);
        color: rgba(235,244,232,.68);
        font-size: 8px;
        font-weight: 800;
      }

      .ai-host-bio {
        display: -webkit-box;
        overflow: hidden;
        margin: 10px 0 0;
        color: rgba(229,239,229,.48);
        font-size: 9px;
        line-height: 1.55;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
      }

      .ai-host-profile-link {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        min-height: 38px;
        margin-top: 12px;
        padding: 0 11px;
        border-radius: 11px;
        background: rgba(184,240,123,.10);
        color: #d9f7bd;
        text-decoration: none;
        font-size: 9px;
        font-weight: 900;
        transition: .2s ease;
      }

      .ai-host-profile-link:hover {
        background: rgba(184,240,123,.15);
        transform: translateY(-1px);
      }

      @keyframes hostCardIn {
        from { opacity: 0; transform: translateY(12px); }
        to { opacity: 1; transform: translateY(0); }
      }

      @media (max-width: 1020px) {
        .ai-result-layout {
          grid-template-columns: 1fr;
        }

        .ai-action-panel {
          order: 2;
        }

        .ai-action-sticky {
          position: static;
          display: grid;
          grid-template-columns: minmax(0,1fr) auto auto;
          align-items: center;
          gap: 7px 10px;
        }

        .ai-action-sticky .ai-section-label,
        .ai-action-sticky h2,
        .ai-action-sticky > p,
        .ai-action-sticky .ai-privacy-box,
        .ai-action-sticky .ai-flow-mini {
          grid-column: 1 / -1;
        }

        .ai-host-cta,
        .ai-new-search {
          width: auto;
          margin-top: 0;
        }
      }

      /* MOBILE */
      @media (max-width: 620px) {
        .ai-page {
          padding: 64px 7px 24px;
        }

        .ai-hero {
          margin-bottom: 10px;
          padding: 0 4px;
        }

        .ai-kicker {
          padding: 4px 6px 4px 4px;
          font-size: 6.5px;
        }

        .ai-kicker-dot {
          width: 22px;
          height: 22px;
        }

        .ai-hero h1 {
          margin-top: 8px;
          font-size: clamp(35px,10.8vw,46px);
          line-height: .92;
          letter-spacing: -.06em;
        }

        .ai-hero h1 span {
          margin-top: 2px;
        }

        .ai-hero p {
          max-width: 94%;
          margin-top: 7px;
          font-size: 8px;
          line-height: 1.45;
        }

        .ai-composer-wrap {
          max-width: none;
          padding: 0;
        }

        .ai-composer {
          padding: 10px;
          border-radius: 15px;
        }

        .ai-agent-mark {
          width: 27px;
          height: 27px;
          border-radius: 8px;
        }

        .ai-composer-label {
          font-size: 7px;
        }

        .ai-composer textarea {
          min-height: 78px;
          margin-top: 7px;
          font-size: 17px;
          line-height: 1.3;
        }

        .ai-composer-bottom {
          align-items: stretch;
          flex-direction: column;
          gap: 6px;
          margin-top: 5px;
          padding-top: 7px;
        }

        .ai-composer-meta {
          justify-content: space-between;
        }

        .ai-composer-meta > span,
        .ai-composer-meta small {
          font-size: 6px;
        }

        .ai-primary {
          justify-content: space-between;
          width: 100%;
          min-height: 38px;
          border-radius: 10px;
        }

        .ai-primary-icon {
          width: 30px;
          height: 30px;
        }

        .ai-examples {
          margin-top: 6px;
        }

        .ai-example-list button {
          max-width: 240px;
          padding: 6px 7px;
          font-size: 6px;
        }

        .ai-principles {
          grid-template-columns: repeat(3,minmax(0,1fr));
          gap: 3px;
          margin-top: 8px;
        }

        .ai-principles > div {
          min-height: 59px;
          padding: 6px;
          border-radius: 8px;
        }

        .ai-principles strong {
          margin-top: 6px;
          font-size: 6.5px;
          line-height: 1.15;
        }

        .ai-principles p {
          display: none;
        }

        .ai-thinking,
        .ai-result-layout,
        .ai-sent {
          margin-left: 0;
          margin-right: 0;
        }

        .ai-thinking {
          grid-template-columns: 70px minmax(0,1fr);
          gap: 10px;
          min-height: 128px;
          padding: 10px;
          border-radius: 14px;
          text-align: left;
        }

        .ai-thinking-orb {
          width: 66px;
          height: 66px;
        }

        .ai-thinking-orb .core {
          width: 34px;
          height: 34px;
          border-radius: 10px;
        }

        .ai-thinking-copy h2 {
          margin-top: 4px;
          font-size: 22px;
        }

        .ai-thinking-copy > p {
          margin-top: 5px;
          font-size: 7px;
          line-height: 1.45;
        }

        .ai-thinking-steps {
          gap: 3px;
          margin-top: 7px;
        }

        .ai-thinking-steps > span {
          padding: 4px 5px;
          font-size: 5px;
        }

        .ai-understood,
        .ai-inventory,
        .ai-action-sticky {
          padding: 9px;
          border-radius: 13px;
        }

        .ai-understood-head,
        .ai-inventory-head,
        .ai-curated-heading {
          align-items: flex-start;
          gap: 5px;
        }

        .ai-understood h2,
        .ai-inventory-head h2,
        .ai-action-panel h2 {
          margin-top: 3px;
          font-size: 19px;
          line-height: 1.02;
        }

        .ai-section-label {
          font-size: 6px;
        }

        .ai-ghost {
          min-height: 27px;
          padding: 0 6px;
          font-size: 5.5px;
        }

        .ai-pills {
          grid-template-columns: repeat(2,minmax(0,1fr));
          gap: 3px;
          margin-top: 7px;
        }

        .ai-pill {
          min-height: 42px;
          padding: 5px;
          border-radius: 9px;
        }

        .ai-pill > span {
          width: 25px;
          height: 25px;
          border-radius: 7px;
        }

        .ai-pill small {
          font-size: 4.5px;
        }

        .ai-pill strong {
          font-size: 6.5px;
        }

        .ai-edit-grid {
          grid-template-columns: 1fr 1fr;
          gap: 4px;
        }

        .ai-edit-grid input,
        .ai-edit-grid select {
          height: 32px;
          padding: 0 7px;
          font-size: 7px;
        }

        .ai-inventory-head p {
          display: none;
        }

        .ai-engine-status {
          padding: 5px 6px;
          font-size: 5px;
        }

        .ai-curated-section {
          margin-top: 8px;
          padding-top: 8px;
        }

        .ai-curated-heading {
          flex-direction: row;
        }

        .ai-curated-heading h3 {
          font-size: 15px;
        }

        .ai-curated-grid {
          display: flex;
          gap: 5px;
          overflow-x: auto;
          padding-bottom: 3px;
          scroll-snap-type: x proximity;
          scrollbar-width: none;
        }

        .ai-curated-grid::-webkit-scrollbar { display: none; }

        .ai-curated-card,
        .ai-curated-card.is-top {
          display: block;
          flex: 0 0 80vw;
          min-height: 0;
          grid-column: auto;
          scroll-snap-align: start;
          border-radius: 11px;
        }

        .ai-curated-cover,
        .ai-curated-card.is-top .ai-curated-cover {
          min-height: 120px;
          height: 120px;
        }

        .ai-curated-card.is-top::after {
          top: 7px;
          left: 7px;
          padding: 4px 5px;
          font-size: 4.5px;
        }

        .ai-score-orb {
          width: 44px;
          height: 44px;
          right: 7px;
          top: 7px;
        }

        .ai-curated-body,
        .ai-curated-card.is-top .ai-curated-body {
          padding: 9px;
        }

        .ai-curated-body h4,
        .ai-curated-card.is-top .ai-curated-body h4 {
          margin-top: 5px;
          font-size: 14px;
        }

        .ai-curated-body p,
        .ai-curated-card.is-top .ai-curated-body p {
          margin-top: 5px;
          font-size: 6.5px;
        }

        .ai-curated-bottom {
          margin-top: 8px;
          padding-top: 7px;
        }

        .ai-curated-bottom strong {
          font-size: 8px;
        }

        .ai-curated-bottom span {
          font-size: 5.5px;
        }

        .ai-cards {
          display: flex;
          gap: 5px;
          overflow-x: auto;
          padding-bottom: 3px;
          scrollbar-width: none;
          scroll-snap-type: x proximity;
        }

        .ai-cards::-webkit-scrollbar { display: none; }

        .ai-match-card {
          flex: 0 0 190px;
          scroll-snap-align: start;
        }

        .ai-match-cover {
          height: 90px;
        }

        .ai-match-body {
          padding: 8px;
        }

        .ai-match-body h3 {
          font-size: 10px;
        }

        .ai-event-list {
          display: flex;
          gap: 5px;
          overflow-x: auto;
          padding-bottom: 3px;
          scrollbar-width: none;
        }

        .ai-event-list::-webkit-scrollbar { display: none; }

        .ai-event-row {
          flex: 0 0 220px;
        }

        .ai-action-sticky {
          display: block;
        }

        .ai-action-panel > div > p,
        .ai-flow-mini {
          display: none;
        }

        .ai-privacy-box {
          margin-top: 6px;
        }

        .ai-host-cta,
        .ai-new-search {
          width: 100%;
          margin-top: 5px;
        }

        .ai-sent {
          padding: 22px 12px;
          border-radius: 15px;
        }

        .ai-sent h2 {
          font-size: 30px;
        }

        .ai-sent-actions {
          flex-direction: column;
        }

        .ai-empty-visual {
          grid-template-columns: 58px minmax(0,1fr);
          gap: 9px;
          padding: 9px;
        }

        .ai-empty-orbit {
          width: 52px;
          height: 52px;
        }
      }

      @media (max-width: 380px) {
        .ai-hero h1 { font-size: 33px; }
        .ai-pills { grid-template-columns: 1fr 1fr; }
        .ai-match-card { flex-basis: 180px; }
        .ai-event-row { flex-basis: 205px; }
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


      /* =========================================================
         HOST-FIRST AGENT — PRODUCT + MOTION PASS
         ========================================================= */
      .ai-host-first-bridge {
        position: relative;
        overflow: hidden;
        margin-top: 20px;
        padding: 24px;
        border: 1px solid rgba(190,239,151,.14);
        border-radius: 26px;
        background:
          radial-gradient(circle at 12% 0%, rgba(184,240,123,.11), transparent 28%),
          linear-gradient(145deg, rgba(255,255,255,.055), rgba(255,255,255,.025));
      }

      .ai-host-first-bridge::after {
        content: "";
        position: absolute;
        width: 180px;
        height: 180px;
        right: -70px;
        bottom: -95px;
        border: 1px solid rgba(184,240,123,.12);
        border-radius: 50%;
        box-shadow:
          0 0 0 26px rgba(184,240,123,.025),
          0 0 0 52px rgba(184,240,123,.018);
        pointer-events: none;
      }

      .ai-host-orbit {
        position: relative;
        width: 74px;
        height: 74px;
        margin-bottom: 20px;
      }

      .host-orbit-ring,
      .host-orbit-core {
        position: absolute;
        inset: 50% auto auto 50%;
        transform: translate(-50%,-50%);
        border-radius: 50%;
      }

      .host-orbit-ring {
        border: 1px solid rgba(184,240,123,.22);
      }

      .host-orbit-ring.ring-a {
        width: 72px;
        height: 72px;
        animation: hostOrbitSpin 8s linear infinite;
      }

      .host-orbit-ring.ring-a::after {
        content: "";
        position: absolute;
        width: 6px;
        height: 6px;
        top: 5px;
        left: 13px;
        border-radius: 50%;
        background: var(--green);
        box-shadow: 0 0 18px rgba(184,240,123,.8);
      }

      .host-orbit-ring.ring-b {
        width: 52px;
        height: 52px;
        border-style: dashed;
        animation: hostOrbitSpin 11s linear infinite reverse;
      }

      .host-orbit-core {
        display: grid;
        place-items: center;
        width: 38px;
        height: 38px;
        color: #07170f;
        background: linear-gradient(145deg,#d7ffad,#9ee16e);
        box-shadow: 0 8px 28px rgba(150,220,101,.24);
      }

      .ai-host-bridge-copy {
        position: relative;
        z-index: 2;
        max-width: 680px;
      }

      .ai-host-bridge-copy h3 {
        margin: 9px 0 8px;
        font-size: clamp(23px,3vw,34px);
        line-height: 1.02;
        letter-spacing: -.045em;
      }

      .ai-host-bridge-copy p {
        margin: 0;
        max-width: 650px;
        color: var(--muted);
        line-height: 1.7;
      }

      .ai-capability-row {
        position: relative;
        z-index: 2;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 20px;
      }

      .ai-capability-row span {
        padding: 8px 11px;
        border: 1px solid rgba(214,239,209,.10);
        border-radius: 999px;
        color: rgba(243,248,242,.78);
        background: rgba(255,255,255,.035);
        font-size: 11px;
        font-weight: 760;
      }

      .ai-agent-alive {
        isolation: isolate;
      }

      .agent-wave {
        position: absolute;
        inset: 50% auto auto 50%;
        width: 76px;
        height: 76px;
        border: 1px solid rgba(184,240,123,.22);
        border-radius: 50%;
        transform: translate(-50%,-50%);
        opacity: 0;
        animation: agentSignal 2.7s ease-out infinite;
      }

      .agent-wave.wave-two { animation-delay: .9s; }
      .agent-wave.wave-three { animation-delay: 1.8s; }

      .agent-compass-line {
        position: absolute;
        inset: 50% auto auto 50%;
        width: 108px;
        height: 1px;
        transform-origin: 0 50%;
        background: linear-gradient(90deg, rgba(184,240,123,.5), transparent);
        opacity: .32;
        z-index: -1;
      }

      .agent-compass-line.line-a {
        animation: agentRadar 5.2s linear infinite;
      }

      .agent-compass-line.line-b {
        animation: agentRadar 7.4s linear infinite reverse;
      }

      .agent-particle {
        position: absolute;
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: #caff9f;
        box-shadow: 0 0 14px rgba(202,255,159,.75);
        animation: agentParticle 2.8s ease-in-out infinite;
      }

      .particle-a { top: 13%; left: 70%; }
      .particle-b { top: 72%; left: 18%; animation-delay: -.9s; }
      .particle-c { top: 76%; left: 78%; animation-delay: -1.7s; }

      .ai-thinking-copy h2 {
        animation: softTextBreath 2.4s ease-in-out infinite;
      }

      .ai-composer:focus-within {
        border-color: rgba(184,240,123,.26);
        box-shadow:
          0 30px 90px rgba(0,0,0,.24),
          0 0 0 1px rgba(184,240,123,.045),
          0 0 48px rgba(141,210,96,.055);
      }

      .ai-composer:focus-within .ai-agent-mark {
        animation: composerAlive 2.2s ease-in-out infinite;
      }

      @keyframes agentSignal {
        0% { transform: translate(-50%,-50%) scale(.52); opacity: .5; }
        70% { opacity: .12; }
        100% { transform: translate(-50%,-50%) scale(1.8); opacity: 0; }
      }

      @keyframes agentRadar {
        to { transform: rotate(360deg); }
      }

      @keyframes agentParticle {
        0%,100% { transform: translateY(0) scale(.8); opacity: .3; }
        50% { transform: translateY(-8px) scale(1.15); opacity: 1; }
      }

      @keyframes hostOrbitSpin {
        to { transform: translate(-50%,-50%) rotate(360deg); }
      }

      @keyframes softTextBreath {
        0%,100% { opacity: .88; }
        50% { opacity: 1; }
      }

      @keyframes composerAlive {
        0%,100% { box-shadow: 0 0 0 0 rgba(184,240,123,0); }
        50% { box-shadow: 0 0 0 7px rgba(184,240,123,.055); }
      }

      @media (max-width: 720px) {
        .ai-page {
          padding: 82px 12px 44px;
        }

        .ai-hero {
          margin: 0 auto 24px;
          text-align: center;
        }

        .ai-kicker {
          justify-content: center;
        }

        .ai-hero h1 {
          margin-inline: auto;
          font-size: clamp(38px,12vw,54px);
          line-height: .94;
        }

        .ai-hero p {
          margin-inline: auto;
          max-width: 340px;
          font-size: 12px;
          line-height: 1.55;
        }

        .ai-composer-wrap {
          margin-top: 0;
        }

        .ai-composer {
          padding: 14px;
          border-radius: 20px;
        }

        .ai-composer textarea {
          min-height: 112px;
          font-size: 14px;
          line-height: 1.55;
        }

        .ai-composer-bottom {
          gap: 10px;
        }

        .ai-primary {
          min-height: 46px;
        }

        .ai-example-list {
          display: grid;
          grid-template-columns: 1fr;
          gap: 7px;
        }

        .ai-example-list button {
          width: 100%;
          min-height: 42px;
          text-align: left;
        }

        .ai-thinking {
          min-height: 290px;
          padding: 24px 18px;
          border-radius: 22px;
          text-align: center;
        }

        .ai-thinking-orb {
          margin-inline: auto;
        }

        .ai-thinking-steps {
          justify-content: center;
        }

        .ai-understood,
        .ai-inventory,
        .ai-action-sticky {
          border-radius: 20px;
        }

        .ai-understood-head,
        .ai-inventory-head {
          text-align: center;
        }

        .ai-section-label {
          justify-content: center;
        }

        .ai-pills {
          justify-content: center;
        }

        .ai-host-first-bridge {
          padding: 19px 15px;
          border-radius: 20px;
          text-align: center;
        }

        .ai-host-orbit {
          margin: 0 auto 16px;
        }

        .ai-capability-row {
          justify-content: center;
          gap: 6px;
        }

        .ai-capability-row span {
          padding: 7px 9px;
          font-size: 9px;
        }

        .ai-action-panel,
        .ai-action-sticky {
          text-align: center;
        }

        .ai-privacy-box {
          text-align: left;
        }

        .ai-flow-mini {
          justify-content: center;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .agent-wave,
        .agent-compass-line,
        .agent-particle,
        .host-orbit-ring,
        .ai-thinking-copy h2,
        .ai-composer:focus-within .ai-agent-mark {
          animation: none !important;
        }
      }


      @media (max-width: 760px) {
        .ai-host-results {
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .ai-host-cover {
          height: 88px;
        }

        .ai-host-card {
          border-radius: 16px;
        }

        .ai-host-card-body {
          padding: 10px;
        }

        .ai-host-avatar {
          flex-basis: 34px;
          width: 34px;
          height: 34px;
          border-radius: 11px;
        }

        .ai-host-identity {
          gap: 7px;
        }

        .ai-host-identity strong {
          font-size: 10px;
        }

        .ai-host-identity span,
        .ai-host-bio {
          font-size: 7px;
        }

        .ai-host-best {
          margin-top: 8px;
          padding: 5px 6px;
          font-size: 7px;
        }

        .ai-host-capabilities {
          gap: 4px;
          margin-top: 7px;
        }

        .ai-host-capabilities span {
          padding: 4px 5px;
          font-size: 7px;
        }

        .ai-host-bio {
          -webkit-line-clamp: 1;
        }

        .ai-host-profile-link {
          min-height: 34px;
          margin-top: 8px;
          padding: 0 8px;
          font-size: 8px;
        }
      }

      @media (max-width: 430px) {
        .ai-host-results {
          grid-template-columns: 1fr;
        }

        .ai-host-cover {
          height: 108px;
        }
      }


      .ai-locked-results {
        display: grid;
        grid-template-columns: minmax(0, .9fr) minmax(0, 1.1fr);
        gap: 18px;
        align-items: center;
        margin-top: 16px;
        padding: 18px;
        border: 1px solid rgba(255,255,255,.09);
        border-radius: 22px;
        background: rgba(255,255,255,.035);
      }

      .ai-locked-stack {
        display: grid;
        gap: 9px;
        filter: blur(3px);
        opacity: .5;
        pointer-events: none;
      }

      .ai-locked-card {
        display: grid;
        grid-template-columns: 38px 1fr 28px;
        gap: 10px;
        align-items: center;
        min-height: 62px;
        padding: 10px 12px;
        border: 1px solid rgba(255,255,255,.08);
        border-radius: 15px;
        background: rgba(255,255,255,.045);
      }

      .ai-locked-avatar {
        width: 38px;
        height: 38px;
        border-radius: 12px;
        background: rgba(255,255,255,.12);
      }

      .ai-locked-lines {
        display: grid;
        gap: 7px;
      }

      .ai-locked-lines span {
        height: 7px;
        border-radius: 999px;
        background: rgba(255,255,255,.12);
      }

      .ai-locked-lines span:last-child {
        width: 62%;
      }

      .ai-locked-copy h3 {
        margin: 9px 0 0;
        color: #fff;
        font-size: 24px;
        line-height: 1.04;
        letter-spacing: -.04em;
      }

      .ai-locked-copy p {
        margin: 9px 0 0;
        color: rgba(255,255,255,.56);
        font-size: 10px;
        line-height: 1.6;
      }

      .ai-login-results {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        min-height: 43px;
        margin-top: 14px;
        padding: 0 14px;
        border: 1px solid rgba(224,246,175,.18);
        border-radius: 13px;
        background: #dff2ad;
        color: #17301f;
        font-size: 9px;
        font-weight: 900;
        cursor: pointer;
      }

      @media (max-width: 760px) {
        .ai-locked-results {
          grid-template-columns: 1fr;
          padding: 14px;
        }

        .ai-locked-stack {
          max-height: 120px;
          overflow: hidden;
        }

        .ai-locked-copy {
          text-align: center;
        }

        .ai-login-results {
          width: 100%;
        }
      }

    `}</style>
  );
}
