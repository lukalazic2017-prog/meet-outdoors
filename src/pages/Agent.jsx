import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";

const EXAMPLES = [
  "U subotu nas dvoje iz Beograda, imamo auto, do 8.000 RSD ukupno, nešto lagano u prirodi.",
  "Sledećeg vikenda bih na rafting sa 3 drugara, do 70€ po osobi.",
  "Hoću jednodnevni izlet oko Niša, bez previše hodanja, idem sa detetom.",
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
  skiing: "Skijanje",
  "horse riding": "Jahanje",
  fishing: "Ribolov",
  "nature trip": "Izlet u prirodi",
  other: "Outdoor avantura",
};

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
    package: (
      <>
        <path d="m12 3 8 4-8 4-8-4 8-4Z" />
        <path d="m4 7 8 4 8-4M4 12l8 4 8-4M4 17l8 4 8-4" />
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

export default function Agent() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const inputRef = useRef(null);

  const [prompt, setPrompt] = useState("");
  const [intent, setIntent] = useState(null);
  const [inventory, setInventory] = useState(null);

  const [thinking, setThinking] = useState(false);
  const [sendingDemand, setSendingDemand] = useState(false);
  const [sentResult, setSentResult] = useState(null);
  const [error, setError] = useState("");
  const [showEdit, setShowEdit] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login", { replace: true });
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!authLoading && user && !intent) {
      const t = window.setTimeout(() => inputRef.current?.focus(), 280);
      return () => window.clearTimeout(t);
    }
  }, [authLoading, user, intent]);

  const dateText = useMemo(() => {
    if (!intent) return null;
    const start = formatDate(intent.start_date);
    const end = formatDate(intent.end_date);
    if (start && end && intent.start_date !== intent.end_date) {
      return `${start} — ${end}`;
    }
    return start || end;
  }, [intent]);

  const packages = inventory?.packages || [];
  const events = inventory?.events || [];
  const hasInventory = packages.length > 0 || events.length > 0;

  const canSearch = prompt.trim().length >= 4 && !thinking;

  function updateIntent(field, value) {
    setIntent((prev) => ({
      ...(prev || {}),
      [field]: value,
    }));
    setError("");
  }

  async function searchWithAI(event) {
    event?.preventDefault();
    if (!canSearch) return;

    setThinking(true);
    setError("");
    setSentResult(null);
    setIntent(null);
    setInventory(null);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        navigate("/login", { replace: true });
        return;
      }

      const { data: aiData, error: aiError } = await supabase.functions.invoke(
  "meetoutdoors-agent",
  {
    body: { message: prompt.trim() },
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  }
);

     if (aiError) {
  console.error("Agent Edge Function error:", aiError);

  let realMessage = aiError.message || "AI Agent greška";

  try {
    if (aiError.context) {
      const errorBody = await aiError.context.json();

      console.error("Edge Function response:", errorBody);

      if (errorBody?.error) {
        realMessage = errorBody.error;
      }
    }
  } catch (parseError) {
    console.error("Could not parse Edge Function error:", parseError);
  }

  throw new Error(realMessage);
}
      if (!aiData?.success || !aiData?.intent) {
        throw new Error(aiData?.error || "Agent nije uspeo da razume zahtev.");
      }

      const parsed = aiData.intent;
      setIntent(parsed);

      if (!parsed.activity) {
        setInventory({
          packages: [],
          events: [],
          counts: { packages: 0, events: 0 },
          has_existing_inventory: false,
        });
        return;
      }

      const { data: inventoryData, error: inventoryError } = await supabase.rpc(
        "search_adventure_inventory",
        {
          p_activity: parsed.activity,
          p_location_text: parsed.location_text || null,
          p_start_date: parsed.start_date || null,
          p_end_date: parsed.end_date || null,
          p_people_count: Number(parsed.people_count) || 1,
          p_budget_per_person:
            parsed.budget_per_person === null ||
            parsed.budget_per_person === undefined
              ? null
              : Number(parsed.budget_per_person),
          p_currency: parsed.currency || "RSD",
          p_difficulty: parsed.difficulty || null,
        }
      );

      if (inventoryError) throw inventoryError;

      setInventory(
        inventoryData || {
          packages: [],
          events: [],
          counts: { packages: 0, events: 0 },
          has_existing_inventory: false,
        }
      );
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

  async function rerunInventory() {
    if (!intent?.activity) {
      setError("Agent još nema dovoljno informacija o aktivnosti.");
      return;
    }

    setThinking(true);
    setError("");

    try {
      const { data, error: rpcError } = await supabase.rpc(
        "search_adventure_inventory",
        {
          p_activity: intent.activity,
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
        }
      );

      if (rpcError) throw rpcError;
      setInventory(data);
      setShowEdit(false);
    } catch (err) {
      console.error("Inventory refresh error:", err);
      setError(err?.message || "Nismo uspeli da osvežimo rezultate.");
    } finally {
      setThinking(false);
    }
  }

  async function sendDemandToHosts() {
    if (!intent?.activity || sendingDemand) return;

    setSendingDemand(true);
    setError("");

    try {
      const { data, error: rpcError } = await supabase.rpc(
        "create_adventure_intent_and_notify_hosts",
        {
          p_activity: intent.activity,
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
    setInventory(null);
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

  if (!user) return null;

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
              Ne traži avanturu.
              <span>Opiši je.</span>
            </h1>

            <p>
              Jedna poruka je dovoljna. Agent razume šta želiš, proverava
              stvarnu MeetOutdoors ponudu i, ako treba, aktivira relevantne
              domaćine da naprave novu.
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
                      AI razume, Reality Engine proverava
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
              <div className="ai-thinking-orb">
                <span className="ring ring-one" />
                <span className="ring ring-two" />
                <span className="core">
                  <Icon name="sparkles" size={25} />
                </span>
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
                    Reality Engine
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
                      icon="mountain"
                      label="Aktivnost"
                      value={
                        ACTIVITY_LABELS[intent.activity] ||
                        intent.activity ||
                        null
                      }
                    />
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
                    <DetailPill
                      icon="route"
                      label="Težina"
                      value={
                        DIFFICULTY_LABELS[intent.difficulty] ||
                        intent.difficulty ||
                        null
                      }
                    />
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
                        <label>
                          <span>Aktivnost</span>
                          <select
                            value={intent.activity || ""}
                            onChange={(e) =>
                              updateIntent("activity", e.target.value || null)
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
                        onClick={rerunInventory}
                        disabled={thinking}
                      >
                        {thinking ? (
                          <>
                            <span className="button-loader" />
                            Proveravam ponovo...
                          </>
                        ) : (
                          <>
                            <Icon name="retry" size={16} />
                            Osveži rezultate
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
                        REALITY ENGINE
                      </span>
                      <h2>
                        {hasInventory
                          ? "Ovo već postoji."
                          : "Nema dovoljno dobre gotove opcije."}
                      </h2>
                      <p>
                        {hasInventory
                          ? "Pronašao sam stvarne MeetOutdoors opcije koje odgovaraju tvom zahtevu."
                          : "Neću ti izmišljati preporuke. Trenutno nema odgovarajuće aktivne ponude u bazi."}
                      </p>
                    </div>

                    <div className={`ai-engine-status ${hasInventory ? "found" : ""}`}>
                      <span />
                      {hasInventory
                        ? `${packages.length + events.length} opcija`
                        : "Custom match"}
                    </div>
                  </div>

                  {packages.length > 0 && (
                    <div className="ai-result-section">
                      <div className="ai-result-title">
                        <Icon name="package" size={16} />
                        Paketi
                      </div>

                      <div className="ai-cards">
                        {packages.slice(0, 6).map((item, index) => (
                          <Link
                            to={
                              item.slug
                                ? `/paketi/${item.slug}`
                                : `/package/${item.package_id}`
                            }
                            key={item.package_id}
                            className="ai-match-card"
                            style={{ "--delay": `${index * 60}ms` }}
                          >
                            <div
                              className="ai-match-cover"
                              style={
                                item.cover_url
                                  ? {
                                      backgroundImage: `linear-gradient(180deg, rgba(7,24,15,.02), rgba(7,24,15,.58)), url("${item.cover_url}")`,
                                    }
                                  : undefined
                              }
                            >
                              {!item.cover_url && (
                                <Icon name="mountain" size={30} />
                              )}

                              <span className="ai-score">
                                {item.match_score || 0}% match
                              </span>
                            </div>

                            <div className="ai-match-body">
                              <div className="ai-match-meta">
                                <span>
                                  {ACTIVITY_LABELS[item.activity] ||
                                    item.activity}
                                </span>
                                {item.city && <span>{item.city}</span>}
                              </div>

                              <h3>{item.title}</h3>

                              <div className="ai-match-bottom">
                                <strong>
                                  {formatMoney(item.price, item.currency) ||
                                    "Cena na upit"}
                                </strong>
                                <span>
                                  Otvori
                                  <Icon name="chevron" size={14} />
                                </span>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {events.length > 0 && (
                    <div className="ai-result-section">
                      <div className="ai-result-title">
                        <Icon name="event" size={16} />
                        Događaji
                      </div>

                      <div className="ai-event-list">
                        {events.slice(0, 6).map((item) => (
                          <Link
                            to={`/event/${item.event_id}`}
                            key={item.event_id}
                            className="ai-event-row"
                          >
                            <span className="ai-event-icon">
                              <Icon name="calendar" size={18} />
                            </span>

                            <div className="ai-event-copy">
                              <small>
                                {item.location || item.country || "Outdoor"}
                              </small>
                              <strong>{item.title}</strong>
                              <span>
                                {item.start_date
                                  ? new Intl.DateTimeFormat("sr-Latn-RS", {
                                      day: "2-digit",
                                      month: "short",
                                    }).format(new Date(item.start_date))
                                  : "Termin po dogovoru"}
                              </span>
                            </div>

                            <Icon name="chevron" size={16} />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {!hasInventory && (
                    <div className="ai-empty-visual">
                      <div className="ai-empty-orbit">
                        <span className="orbit orbit-a" />
                        <span className="orbit orbit-b" />
                        <span className="empty-core">
                          <Icon name="sparkles" size={24} />
                        </span>
                      </div>

                      <div>
                        <strong>Tu Agent postaje tržište.</strong>
                        <p>
                          Umesto da završi pretragu sa “nema rezultata”,
                          MeetOutdoors može da pošalje tvoj konkretan zahtev
                          relevantnim domaćinima.
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
                    CUSTOM MATCH
                  </span>

                  <h2>
                    {hasInventory
                      ? "Želiš još bolju opciju?"
                      : "Da aktiviram domaćine?"}
                  </h2>

                  <p>
                    {hasInventory
                      ? "Možeš odmah otvoriti postojeću ponudu ili pustiti Agent da traži konkretnu ponudu baš za tvoj zahtev."
                      : "Relevantni outdoor domaćini dobiće anonimnu potražnju i moći će da ti pošalju konkretnu ponudu."}
                  </p>

                  <div className="ai-privacy-box">
                    <Icon name="shield" size={17} />
                    <div>
                      <strong>Identitet ostaje privatan.</strong>
                      <span>
                        Domaćini ne vide ko si dok ne prihvatiš neku ponudu.
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="ai-host-cta"
                    onClick={sendDemandToHosts}
                    disabled={sendingDemand || !intent.activity}
                  >
                    {sendingDemand ? (
                      <>
                        <span className="button-loader" />
                        Aktiviram relevantne domaćine...
                      </>
                    ) : (
                      <>
                        <span>
                          {hasInventory
                            ? "Traži custom ponude"
                            : "Pošalji potražnju hostovima"}
                        </span>
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
                      <p>Reality Engine proverava</p>
                    </div>
                    <i />
                    <div>
                      <span>03</span>
                      <p>Hostovi stvaraju</p>
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
                naprave konkretnu ponudu, a ti ćeš dobiti obaveštenje čim neka
                stigne.
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
                <p>Paketi i događaji dolaze iz stvarne MeetOutdoors baze.</p>
              </div>
              <div>
                <span>03</span>
                <strong>Ako ne postoji — stvaramo</strong>
                <p>Relevantni hostovi mogu da naprave ponudu za tvoj zahtev.</p>
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

      @media (max-width: 1020px) {
        .ai-result-layout {
          grid-template-columns: 1fr;
        }

        .ai-action-sticky {
          position: static;
        }

        .ai-action-panel {
          max-width: none;
        }
      }

      @media (max-width: 820px) {
        .ai-page {
          padding: 92px 15px 55px;
        }

        .ai-hero h1 {
          font-size: clamp(56px, 12vw, 86px);
        }

        .ai-thinking {
          grid-template-columns: 1fr;
          gap: 20px;
          text-align: center;
        }

        .ai-thinking-steps {
          justify-content: center;
        }

        .ai-pills {
          grid-template-columns: repeat(2, minmax(0,1fr));
        }

        .ai-cards {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 620px) {
        .ai-page {
          padding: 82px 0 48px;
        }

        .ai-shell {
          width: 100%;
        }

        .ai-hero {
          padding: 0 17px;
          margin-bottom: 30px;
        }

        .ai-hero h1 {
          font-size: 57px;
        }

        .ai-hero p {
          font-size: 11px;
        }

        .ai-composer-wrap {
          padding: 0 12px;
        }

        .ai-composer {
          padding: 18px;
          border-radius: 24px;
        }

        .ai-composer textarea {
          min-height: 180px;
          font-size: 23px;
        }

        .ai-composer-bottom {
          align-items: stretch;
          flex-direction: column;
        }

        .ai-composer-meta {
          justify-content: space-between;
        }

        .ai-primary {
          justify-content: space-between;
          width: 100%;
        }

        .ai-example-list {
          flex-direction: column;
        }

        .ai-example-list button {
          width: 100%;
        }

        .ai-thinking,
        .ai-result-layout,
        .ai-sent {
          margin-left: 12px;
          margin-right: 12px;
        }

        .ai-thinking {
          padding: 24px 18px;
          border-radius: 24px;
        }

        .ai-thinking-orb {
          width: 130px;
          height: 130px;
        }

        .ai-understood,
        .ai-inventory,
        .ai-action-sticky {
          padding: 18px;
          border-radius: 22px;
        }

        .ai-understood-head,
        .ai-inventory-head {
          flex-direction: column;
        }

        .ai-pills {
          grid-template-columns: 1fr;
        }

        .ai-edit-grid {
          grid-template-columns: 1fr;
        }

        .ai-empty-visual {
          grid-template-columns: 1fr;
          text-align: center;
        }

        .ai-sent {
          padding: 37px 18px;
          border-radius: 24px;
        }

        .ai-sent-actions {
          flex-direction: column;
        }

        .ai-principles {
          grid-template-columns: 1fr;
          margin: 35px 12px 0;
        }

        .ai-principles > div {
          min-height: 100px;
        }
      }

      @media (max-width: 390px) {
        .ai-hero h1 {
          font-size: 49px;
        }

        .ai-composer textarea {
          font-size: 21px;
        }

        .ai-understood h2,
        .ai-inventory-head h2 {
          font-size: 30px;
        }
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
    `}</style>
  );
}
