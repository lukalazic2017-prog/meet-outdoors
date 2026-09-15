import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";

const STARTERS = [
  "Prvi put idem na planinarenje. Gde da idem?",
  "Nađi mi avanturu za vikend.",
  "Treba mi smeštaj na Tari.",
  "Šta mi treba od opreme za planinarenje?",
];

function Icon({ name, size = 20 }) {
  const paths = {
    sparkles: <><path d="M12 3l1.4 3.6L17 8l-3.6 1.4L12 13l-1.4-3.6L7 8l3.6-1.4L12 3Z"/><path d="M5 14l.8 2.2L8 17l-2.2.8L5 20l-.8-2.2L2 17l2.2-.8L5 14Z"/></>,
    send: <><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></>,
    mountain: <><path d="m3 20 6.2-10 3.2 4.8L15.8 9 21 20Z"/><path d="m7.5 13 1.7 1.6 1.4-1.2"/></>,
    lock: <><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
    arrow: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    plus: <path d="M12 5v14M5 12h14"/>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

async function edgeError(error, fallback = "Agent trenutno nije dostupan.") {
  if (!error) return fallback;
  try {
    if (error.context) {
      const body = await error.context.json();
      return body?.error || error.message || fallback;
    }
  } catch {}
  return error.message || fallback;
}

function HostCard({ host }) {
  const labels = {
    adventure: "Avanture",
    accommodation: "Smeštaj",
    service: "Usluge",
    rental: "Iznajmljivanje",
  };
  return (
    <article className="mo-host-card">
      <div className="mo-host-cover">
        {host.cover_url ? <img src={host.cover_url} alt="" /> : <div className="mo-cover-fallback"><Icon name="mountain" size={27}/></div>}
      </div>
      <div className="mo-host-body">
        <div className="mo-host-head">
          <div className="mo-avatar">
            {host.avatar_url ? <img src={host.avatar_url} alt="" /> : <span>{(host.full_name || host.username || "H")[0].toUpperCase()}</span>}
          </div>
          <div>
            <strong>{host.full_name || host.username || "MeetOutdoors domaćin"}</strong>
            <small>{[host.city, host.country].filter(Boolean).join(", ") || host.public_location || "Outdoor domaćin"}</small>
          </div>
        </div>
        {host.covers_everything && <div className="mo-perfect"><Icon name="check" size={13}/> Može da pokrije ceo tvoj plan</div>}
        <div className="mo-tags">
          {(host.capabilities || []).map(x => <span key={x}>{labels[x] || x}</span>)}
        </div>
        <Link to={`/h/${host.username}`} className="mo-host-link">Pogledaj profil <Icon name="arrow" size={15}/></Link>
      </div>
    </article>
  );
}

export default function Agent() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      type: "text",
      text: "Kako vam MeetOutdoors Agent može pomoći?",
      subtext: "Pitajte me bilo šta o avanturama, smeštaju, opremi, rutama i boravku u prirodi.",
    },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [awaitingActivation, setAwaitingActivation] = useState(null);
  const [outdoorDNA, setOutdoorDNA] = useState(null);
  const inputRef = useRef(null);
  const bottomRef = useRef(null);

  const history = useMemo(
    () => messages
      .filter(m => (m.role === "user" || m.role === "assistant") && m.type === "text")
      .map(m => ({ role: m.role, content: m.text }))
      .slice(-12),
    [messages]
  );

  const guestMessageCount = useMemo(
    () => messages.filter(m => m.role === "user").length,
    [messages]
  );

  useEffect(() => {
    if (!user) return;
    supabase.from("outdoor_preferences")
      .select("preferred_activities,preferred_difficulty,typical_budget_per_person,currency,has_car,preferred_people_count,preferred_location,max_travel_minutes,last_activity")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setOutdoorDNA(data || null));
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, thinking]);

  function push(message) {
    setMessages(prev => [...prev, { id: `${Date.now()}-${Math.random()}`, ...message }]);
  }

  async function searchHosts(turn) {
    const params = {
      p_activity: turn.activity || null,
      p_location_text: turn.location_text || null,
      p_needs_adventure: Boolean(turn.needs?.adventure),
      p_needs_accommodation: Boolean(turn.needs?.accommodation),
      p_needs_service: Boolean(turn.needs?.service),
      p_needs_rental: Boolean(turn.needs?.rental),
      p_people_count: Number(turn.people_count) || 1,
      p_limit: 20,
    };
    const rpc = user ? "search_agent_hosts" : "search_agent_hosts_preview";
    const { data, error } = await supabase.rpc(rpc, params);
    if (error) throw error;
    return data || { hosts: [], count: 0, locked: !user };
  }

  async function activateHosts(context) {
    if (!user) {
      push({ role: "assistant", type: "login", text: "Ulogujte se da bih mogao da pošaljem vaš zahtev relevantnim domaćinima." });
      return;
    }

    const turn = context?.turn || {};
    const originalText = context?.originalText || "";
    const intentType =
      turn.needs?.accommodation && turn.needs?.adventure ? "mixed" :
      turn.needs?.accommodation && !turn.needs?.adventure ? "accommodation" :
      "adventure";

    const { data, error } = await supabase.rpc("create_adventure_intent_and_notify_hosts", {
      p_activity: turn.activity || null,
      p_location_text: turn.location_text || null,
      p_start_date: turn.start_date || null,
      p_end_date: turn.end_date || null,
      p_people_count: Number(turn.people_count) || 1,
      p_budget_per_person: turn.budget_per_person == null ? null : Number(turn.budget_per_person),
      p_currency: turn.currency || "RSD",
      p_difficulty: turn.difficulty || null,
      p_has_car: null,
      p_notes: originalText || null,
      p_intent_type: intentType,
    });
    if (error) throw error;

    setAwaitingActivation(null);
    push({
      role: "assistant",
      type: "success",
      text: `Aktivirao sam relevantne domaćine i poslao vaš zahtev.${data?.hosts_notified != null ? ` Obavešteno je ${data.hosts_notified} domaćina.` : ""}`,
    });
  }

  async function sendMessage(raw) {
    const text = String(raw ?? input).trim();
    if (!text || thinking) return;

    // Guests can have two real conversation turns.
    // On the third attempted message, require authentication before sending anything.
    if (!user && guestMessageCount >= 2) {
      push({
        role: "assistant",
        type: "login_gate",
        text: "Nastavite razgovor sa MeetOutdoors Agentom.",
      });
      setInput("");
      return;
    }

    setInput("");
    push({ role: "user", type: "text", text });
    setThinking(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const invoke = {
        body: {
          mode: "chat",
          message: text,
          history,
          outdoor_dna: outdoorDNA,
          client_state: {
            awaiting_host_activation: Boolean(awaitingActivation),
            last_host_search: awaitingActivation?.turn || null,
          },
        },
      };
      if (session?.access_token) invoke.headers = { Authorization: `Bearer ${session.access_token}` };

      const { data, error } = await supabase.functions.invoke("meetoutdoors-agent", invoke);
      if (error) throw new Error(await edgeError(error));
      if (!data?.success) throw new Error(data?.error || "Agent nije uspeo da odgovori.");

      if (data.action === "activate_hosts") {
        if (!awaitingActivation) {
          push({ role: "assistant", type: "text", text: "Nemam aktivan zahtev za slanje domaćinima. Recite mi prvo šta tražite." });
        } else {
          await activateHosts(awaitingActivation);
        }
        return;
      }

      if (data.action === "decline_host_activation") {
        setAwaitingActivation(null);
        push({ role: "assistant", type: "text", text: data.message || "U redu. Neću slati zahtev domaćinima. Možemo da probamo nešto drugo." });
        return;
      }

      if (data.action === "host_search") {
        push({ role: "assistant", type: "text", text: data.message || "Proveravam koji domaćini odgovaraju vašem planu." });
        const result = await searchHosts(data);
        const count = Number(result?.count || result?.hosts?.length || 0);

        if (count > 0 && !user) {
          push({ role: "assistant", type: "locked", count });
          return;
        }

        if (count > 0) {
          push({
            role: "assistant",
            type: "hosts",
            text: `Pronašao sam ${count} ${count === 1 ? "domaćina" : "domaćina"}. Evo ko najbolje odgovara onome što tražite:`,
            hosts: result.hosts || [],
          });
          return;
        }

        const ctx = { turn: data, originalText: text };
        setAwaitingActivation(ctx);
        push({
          role: "assistant",
          type: "activation",
          text: "Trenutno nema dovoljno odgovarajuće ponude. Da aktiviram relevantne domaćine i pošaljem im vaš zahtev?",
          context: ctx,
        });
        return;
      }

      if (data.action === "weather") {
        push({
          role: "assistant",
          type: "weather",
          text: data.message || "Evo aktuelnih vremenskih podataka.",
          weather: data.weather || null,
        });
        return;
      }

      push({ role: "assistant", type: "text", text: data.message || "Tu sam. Recite mi šta vas zanima." });
    } catch (err) {
      push({ role: "assistant", type: "error", text: err?.message || "Došlo je do problema. Pokušajte ponovo." });
    } finally {
      setThinking(false);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }

  function onSubmit(e) {
    e.preventDefault();
    sendMessage();
  }

  if (authLoading) {
    return <main className="mo-agent-page"><Styles/><div className="mo-loading"><div className="mo-agent-logo"><Icon name="sparkles" size={24}/></div><span>Pokrećem Agenta...</span></div></main>;
  }

  return (
    <>
      <Styles />
      <main className="mo-agent-page">
        <div className="mo-glow mo-glow-a"/>
        <div className="mo-glow mo-glow-b"/>

        <section className="mo-chat-shell">
          <header className="mo-chat-header">
            <div className="mo-agent-identity">
              <div className="mo-agent-logo"><Icon name="sparkles" size={20}/><span className="mo-pulse"/></div>
              <div>
                <strong>MeetOutdoors Agent</strong>
                <span><i/> Online · vaš AI saputnik za prirodu</span>
              </div>
            </div>
            <div className="mo-ai-badge">AI</div>
          </header>

          <div className="mo-chat-body">
            <div className="mo-date-chip">MEETOUTDOORS AGENT</div>

            {messages.map((m, index) => (
              <div key={m.id} className={`mo-row ${m.role === "user" ? "user" : "agent"} mo-enter`}>
                {m.role === "assistant" && <div className="mo-mini-avatar"><Icon name="sparkles" size={15}/></div>}

                <div className={`mo-message-wrap ${m.type}`}>
                  {m.type === "text" && (
                    <div className={`mo-bubble ${m.role === "user" ? "user-bubble" : "agent-bubble"} ${index === 0 ? "welcome" : ""}`}>
                      {index === 0 && <span className="mo-eyebrow">DOBRODOŠLI</span>}
                      <p>{m.text}</p>
                      {m.subtext && <small>{m.subtext}</small>}
                    </div>
                  )}

                  {m.type === "hosts" && <>
                    <div className="mo-bubble agent-bubble"><p>{m.text}</p></div>
                    <div className="mo-host-strip">{m.hosts.map(h => <HostCard key={h.host_id} host={h}/>)}</div>
                  </>}

                  {m.type === "locked" && (
                    <div className="mo-special-card locked">
                      <div className="mo-special-icon"><Icon name="lock" size={20}/></div>
                      <div><span>REZULTATI SU SPREMNI</span><h3>Pronašao sam {m.count} domaćina.</h3><p>Ulogujte se da vidite njihove profile, mogućnosti i kontakt.</p>
                        <button onClick={() => navigate("/login")}>Uloguj se i otključaj <Icon name="arrow" size={15}/></button>
                      </div>
                    </div>
                  )}

                  {m.type === "activation" && (
                    <div className="mo-special-card activation">
                      <div className="mo-special-icon"><Icon name="sparkles" size={20}/></div>
                      <div><span>HOST ENGINE</span><h3>Nema pravog match-a. Aktivirati domaćine?</h3><p>{m.text}</p>
                        <div className="mo-choice">
                          <button onClick={() => sendMessage("Da, aktiviraj hostove.")}>Da, aktiviraj</button>
                          <button className="secondary" onClick={() => sendMessage("Ne, ne treba.")}>Ne</button>
                        </div>
                      </div>
                    </div>
                  )}

                  {m.type === "success" && <div className="mo-bubble agent-bubble success"><span className="mo-check"><Icon name="check" size={15}/></span><p>{m.text}</p></div>}
                  {m.type === "weather" && (
                    <>
                      <div className="mo-bubble agent-bubble"><p>{m.text}</p></div>
                      {m.weather?.current && (
                        <div className="mo-weather-card">
                          <div className="mo-weather-top">
                            <div>
                              <span className="mo-weather-label">LIVE VREME</span>
                              <h3>{m.weather?.place?.name || "Lokacija"}</h3>
                              <p>{[m.weather?.place?.admin1, m.weather?.place?.country].filter(Boolean).join(", ")}</p>
                            </div>
                            <div className="mo-weather-temp">
                              {m.weather.current.temperature != null ? `${Math.round(m.weather.current.temperature)}°` : "—"}
                            </div>
                          </div>
                          <div className="mo-weather-condition">
                            {m.weather.current.condition || "Aktuelni uslovi"}
                          </div>
                          <div className="mo-weather-stats">
                            <div><span>Osećaj</span><strong>{m.weather.current.apparent_temperature != null ? `${Math.round(m.weather.current.apparent_temperature)}°C` : "—"}</strong></div>
                            <div><span>Vetar</span><strong>{m.weather.current.wind_speed != null ? `${Math.round(m.weather.current.wind_speed)} km/h` : "—"}</strong></div>
                            <div><span>Padavine</span><strong>{m.weather.current.precipitation != null ? `${m.weather.current.precipitation} mm` : "—"}</strong></div>
                          </div>
                          {Array.isArray(m.weather.days) && m.weather.days.length > 0 && (
                            <div className="mo-weather-days">
                              {m.weather.days.slice(0, 4).map((d, i) => (
                                <div key={d.date || i}>
                                  <span>{i === 0 ? "Danas" : new Date(`${d.date}T12:00:00`).toLocaleDateString("sr-RS", { weekday: "short" })}</span>
                                  <strong>{d.temperature_max != null ? `${Math.round(d.temperature_max)}°` : "—"} <small>{d.temperature_min != null ? `${Math.round(d.temperature_min)}°` : ""}</small></strong>
                                  <em>{d.precipitation_probability_max != null ? `${Math.round(d.precipitation_probability_max)}% kiše` : d.condition || ""}</em>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="mo-weather-source">Live podaci · Open-Meteo</div>
                        </div>
                      )}
                    </>
                  )}
                  {m.type === "login" && <div className="mo-bubble agent-bubble"><p>{m.text}</p><button className="mo-inline-link" onClick={() => navigate("/login")}>Uloguj se <Icon name="arrow" size={14}/></button></div>}
                  {m.type === "login_gate" && (
                    <div className="mo-special-card login-gate">
                      <div className="mo-special-icon"><Icon name="lock" size={20}/></div>
                      <div>
                        <span>NASTAVITE RAZGOVOR</span>
                        <h3>{m.text}</h3>
                        <p>Besplatno ste isprobali Agenta kroz 2 poruke. Ulogujte se ili napravite nalog da nastavite razgovor bez prekida.</p>
                        <div className="mo-choice">
                          <button onClick={() => navigate("/login")}>Uloguj se <Icon name="arrow" size={14}/></button>
                          <button className="secondary" onClick={() => navigate("/signup")}>Napravi nalog</button>
                        </div>
                      </div>
                    </div>
                  )}
                  {m.type === "error" && <div className="mo-bubble error-bubble"><p>{m.text}</p></div>}
                </div>
              </div>
            ))}

            {messages.length === 1 && (
              <div className="mo-starters">
                {STARTERS.map(x => <button key={x} onClick={() => sendMessage(x)}><Icon name="plus" size={14}/>{x}</button>)}
              </div>
            )}

            {thinking && (
              <div className="mo-row agent mo-enter">
                <div className="mo-mini-avatar thinking-avatar"><Icon name="sparkles" size={15}/></div>
                <div className="mo-bubble agent-bubble typing"><span/><span/><span/></div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          <footer className="mo-composer-zone">
            <form className="mo-composer" onSubmit={onSubmit}>
              <textarea
                ref={inputRef}
                rows={1}
                maxLength={3000}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder={!user && guestMessageCount >= 2 ? "Ulogujte se da nastavite razgovor..." : "Pitaj Agenta bilo šta o prirodi..."}
                readOnly={!user && guestMessageCount >= 2}
                onClick={() => {
                  if (!user && guestMessageCount >= 2) navigate("/login");
                }}
              />
              <button
                type="submit"
                disabled={!input.trim() || thinking || (!user && guestMessageCount >= 2)}
                aria-label="Pošalji"
              >
                {!user && guestMessageCount >= 2 ? <Icon name="lock" size={18}/> : <Icon name="send" size={19}/>}
              </button>
            </form>
            <div className="mo-composer-foot"><span><i/> Agent može da pogreši. Za rizične aktivnosti proverite uslove i stručne izvore.</span><span>{input.length}/3000</span></div>
          </footer>
        </section>
      </main>
    </>
  );
}

function Styles() {
  return <style>{`
    *{box-sizing:border-box} body{margin:0;background:#06150e}
    button,textarea{font:inherit}
    .mo-agent-page{--green:#baf37c;--green2:#8bd65f;--bg:#06150e;--panel:#0b2015;--line:rgba(220,245,216,.10);min-height:100vh;padding:94px 18px 28px;color:#f4f8f1;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:radial-gradient(circle at 50% -15%,rgba(151,224,100,.15),transparent 31%),linear-gradient(180deg,#071810,#05120c);position:relative;overflow:hidden}
    .mo-glow{position:fixed;width:420px;height:420px;border-radius:50%;filter:blur(90px);pointer-events:none;opacity:.13;animation:floatGlow 9s ease-in-out infinite alternate}.mo-glow-a{background:#9ae26c;right:-220px;top:20%}.mo-glow-b{background:#4b9a68;left:-230px;bottom:5%;animation-delay:-4s}
    .mo-chat-shell{position:relative;z-index:2;width:min(980px,100%);height:calc(100vh - 122px);min-height:620px;margin:0 auto;border:1px solid rgba(218,244,211,.12);border-radius:28px;overflow:hidden;background:rgba(8,27,17,.82);box-shadow:0 35px 100px rgba(0,0,0,.38),inset 0 1px rgba(255,255,255,.03);backdrop-filter:blur(26px);display:grid;grid-template-rows:auto 1fr auto}
    .mo-chat-header{height:74px;padding:0 22px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--line);background:rgba(13,35,23,.72);backdrop-filter:blur(20px)}
    .mo-agent-identity{display:flex;align-items:center;gap:12px}.mo-agent-logo,.mo-mini-avatar{display:grid;place-items:center;background:linear-gradient(145deg,#c8f796,#8bd55f);color:#0d2a1a;box-shadow:0 10px 30px rgba(145,218,99,.18)}
    .mo-agent-logo{width:42px;height:42px;border-radius:14px;position:relative}.mo-pulse{position:absolute;right:-1px;bottom:1px;width:10px;height:10px;border:2px solid #10291c;border-radius:50%;background:#69e36f;box-shadow:0 0 0 0 rgba(105,227,111,.5);animation:pulse 2s infinite}
    .mo-agent-identity strong{display:block;font-size:13px;letter-spacing:-.01em}.mo-agent-identity>div>span{display:flex;align-items:center;gap:6px;margin-top:4px;color:rgba(231,242,227,.47);font-size:9px}.mo-agent-identity i{width:5px;height:5px;border-radius:50%;background:#70df73}
    .mo-ai-badge{padding:6px 9px;border:1px solid rgba(188,240,140,.15);border-radius:999px;background:rgba(185,241,125,.07);color:var(--green);font-size:8px;font-weight:900;letter-spacing:.14em}
    .mo-chat-body{overflow-y:auto;padding:28px 24px 34px;scrollbar-width:thin;scrollbar-color:rgba(190,240,145,.18) transparent;background-image:linear-gradient(rgba(255,255,255,.012) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.012) 1px,transparent 1px);background-size:48px 48px}
    .mo-date-chip{width:max-content;margin:0 auto 28px;padding:6px 10px;border:1px solid rgba(255,255,255,.06);border-radius:999px;color:rgba(231,241,227,.27);font-size:7px;font-weight:900;letter-spacing:.15em}
    .mo-row{display:flex;gap:10px;margin:0 0 17px}.mo-row.user{justify-content:flex-end}.mo-mini-avatar{flex:0 0 auto;width:30px;height:30px;border-radius:10px;margin-top:3px}.mo-message-wrap{max-width:min(78%,700px)}.mo-row.user .mo-message-wrap{max-width:min(74%,640px)}
    .mo-bubble{padding:13px 16px;border-radius:18px;font-size:12px;line-height:1.65}.mo-bubble p{margin:0}.agent-bubble{border:1px solid rgba(224,245,218,.09);border-top-left-radius:6px;background:rgba(255,255,255,.055);color:rgba(245,249,243,.91);box-shadow:0 12px 35px rgba(0,0,0,.10)}.user-bubble{border-top-right-radius:6px;background:linear-gradient(135deg,#c6f392,#96dd69);color:#0b2918;font-weight:650;box-shadow:0 13px 35px rgba(130,205,85,.13)}
    .welcome{padding:19px 20px}.welcome .mo-eyebrow{display:block;margin-bottom:8px;color:var(--green);font-size:7px;font-weight:950;letter-spacing:.16em}.welcome p{font-size:17px;font-weight:800;letter-spacing:-.025em}.welcome small{display:block;max-width:480px;margin-top:7px;color:rgba(231,242,227,.47);font-size:10px;line-height:1.6}
    .mo-starters{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:6px 0 28px 40px;max-width:680px}.mo-starters button{display:flex;align-items:center;gap:8px;text-align:left;padding:11px 13px;border:1px solid rgba(216,242,208,.08);border-radius:13px;background:rgba(255,255,255,.025);color:rgba(237,246,234,.60);font-size:9px;cursor:pointer;transition:.2s}.mo-starters button:hover{transform:translateY(-2px);border-color:rgba(190,240,145,.18);color:#f2f8ef;background:rgba(184,240,123,.055)}
    .typing{display:flex;gap:5px;padding:14px 17px}.typing span{width:5px;height:5px;border-radius:50%;background:var(--green);opacity:.35;animation:typing 1.1s infinite}.typing span:nth-child(2){animation-delay:.15s}.typing span:nth-child(3){animation-delay:.3s}.thinking-avatar{animation:agentBreath 1.4s ease-in-out infinite}
    .mo-host-strip{display:flex;gap:11px;overflow-x:auto;padding:11px 2px 7px;scroll-snap-type:x mandatory;scrollbar-width:none}.mo-host-strip::-webkit-scrollbar{display:none}.mo-host-card{scroll-snap-align:start;flex:0 0 238px;border:1px solid rgba(220,245,214,.10);border-radius:18px;overflow:hidden;background:#0d2418;box-shadow:0 16px 40px rgba(0,0,0,.18);animation:cardIn .4s ease both}.mo-host-cover{height:92px;background:#112d1e;overflow:hidden}.mo-host-cover img{width:100%;height:100%;object-fit:cover}.mo-cover-fallback{height:100%;display:grid;place-items:center;color:rgba(188,240,140,.45);background:radial-gradient(circle at 50% 0,rgba(185,241,125,.13),transparent 60%)}.mo-host-body{padding:12px}.mo-host-head{display:flex;align-items:center;gap:9px}.mo-avatar{width:35px;height:35px;border-radius:11px;overflow:hidden;display:grid;place-items:center;background:rgba(184,240,123,.10);color:var(--green);font-weight:900}.mo-avatar img{width:100%;height:100%;object-fit:cover}.mo-host-head strong{display:block;font-size:10px}.mo-host-head small{display:block;margin-top:3px;color:rgba(230,241,227,.40);font-size:8px}.mo-perfect{display:flex;align-items:center;gap:5px;margin-top:10px;color:var(--green);font-size:8px;font-weight:800}.mo-tags{display:flex;flex-wrap:wrap;gap:5px;margin-top:9px}.mo-tags span{padding:5px 7px;border-radius:999px;background:rgba(255,255,255,.05);color:rgba(237,246,234,.60);font-size:7px}.mo-host-link{display:flex;align-items:center;justify-content:space-between;margin-top:11px;padding-top:10px;border-top:1px solid rgba(255,255,255,.06);color:#eaf5e6;text-decoration:none;font-size:8px;font-weight:850}
    .mo-special-card{display:flex;gap:13px;padding:17px;border:1px solid rgba(190,240,145,.12);border-radius:20px;background:linear-gradient(145deg,rgba(184,240,123,.075),rgba(255,255,255,.035));box-shadow:0 16px 45px rgba(0,0,0,.15)}.mo-special-icon{flex:0 0 auto;width:38px;height:38px;border-radius:12px;display:grid;place-items:center;background:rgba(184,240,123,.10);color:var(--green)}.mo-special-card>div:last-child{min-width:0}.mo-special-card span{color:var(--green);font-size:7px;font-weight:950;letter-spacing:.14em}.mo-special-card h3{margin:5px 0 4px;font-size:14px;letter-spacing:-.025em}.mo-special-card p{margin:0;color:rgba(231,242,227,.50);font-size:9px;line-height:1.6}.mo-special-card button,.mo-inline-link{display:inline-flex;align-items:center;gap:7px;margin-top:11px;padding:9px 12px;border:0;border-radius:10px;background:var(--green);color:#0b2918;font-size:8px;font-weight:900;cursor:pointer}.mo-choice{display:flex;gap:7px}.mo-choice .secondary{background:rgba(255,255,255,.06);color:#eaf4e6;border:1px solid rgba(255,255,255,.07)}
    .mo-weather-card{margin-top:9px;padding:17px;border:1px solid rgba(190,240,145,.12);border-radius:20px;background:radial-gradient(circle at 90% 0,rgba(184,240,123,.11),transparent 42%),linear-gradient(145deg,rgba(255,255,255,.055),rgba(255,255,255,.025));box-shadow:0 18px 45px rgba(0,0,0,.16);overflow:hidden}.mo-weather-top{display:flex;align-items:flex-start;justify-content:space-between;gap:20px}.mo-weather-label{color:var(--green);font-size:7px;font-weight:950;letter-spacing:.15em}.mo-weather-top h3{margin:5px 0 2px;font-size:17px;letter-spacing:-.03em}.mo-weather-top p{margin:0;color:rgba(231,242,227,.4);font-size:8px}.mo-weather-temp{font-size:38px;font-weight:800;line-height:1;letter-spacing:-.06em;color:#f4f9f1}.mo-weather-condition{margin-top:12px;color:rgba(239,247,236,.72);font-size:10px;text-transform:capitalize}.mo-weather-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:13px}.mo-weather-stats>div{padding:10px;border:1px solid rgba(255,255,255,.055);border-radius:12px;background:rgba(255,255,255,.025)}.mo-weather-stats span,.mo-weather-days span{display:block;color:rgba(230,241,227,.35);font-size:7px}.mo-weather-stats strong{display:block;margin-top:4px;font-size:9px}.mo-weather-days{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:8px;padding-top:9px;border-top:1px solid rgba(255,255,255,.055)}.mo-weather-days>div{padding:7px 4px;text-align:center}.mo-weather-days strong{display:block;margin-top:5px;font-size:10px}.mo-weather-days strong small{color:rgba(232,242,228,.4);font-size:8px;font-weight:600}.mo-weather-days em{display:block;margin-top:4px;color:rgba(184,240,123,.55);font-size:6px;font-style:normal}.mo-weather-source{margin-top:8px;color:rgba(231,242,227,.22);font-size:6px;text-align:right}
    .success{display:flex;align-items:flex-start;gap:9px}.mo-check{flex:0 0 auto;width:22px;height:22px;border-radius:8px;display:grid;place-items:center;background:rgba(184,240,123,.11);color:var(--green)}.error-bubble{border:1px solid rgba(255,120,120,.15);background:rgba(150,35,35,.12);color:#ffd9d9}.mo-inline-link{margin-top:10px}
    .mo-composer-zone{padding:14px 18px 12px;border-top:1px solid var(--line);background:rgba(8,25,16,.92);backdrop-filter:blur(22px)}.mo-composer{display:flex;align-items:flex-end;gap:10px;padding:8px 8px 8px 15px;border:1px solid rgba(220,245,214,.12);border-radius:18px;background:rgba(255,255,255,.045);transition:.2s}.mo-composer:focus-within{border-color:rgba(188,240,140,.28);box-shadow:0 0 0 3px rgba(184,240,123,.035)}.mo-composer textarea{width:100%;max-height:110px;min-height:38px;padding:9px 0;resize:none;border:0;outline:0;background:transparent;color:#f3f8f1;font-size:11px;line-height:1.5}.mo-composer textarea::placeholder{color:rgba(234,244,230,.28)}.mo-composer>button{flex:0 0 auto;width:40px;height:40px;border:0;border-radius:13px;display:grid;place-items:center;background:linear-gradient(135deg,#c6f493,#8ed762);color:#0b2a19;cursor:pointer;transition:.2s;box-shadow:0 10px 25px rgba(144,216,98,.14)}.mo-composer>button:hover:not(:disabled){transform:translateY(-2px) scale(1.02)}.mo-composer>button:disabled{opacity:.28;cursor:not-allowed}.mo-composer-foot{display:flex;justify-content:space-between;gap:12px;padding:7px 4px 0;color:rgba(231,242,227,.24);font-size:7px}.mo-composer-foot>span:first-child{display:flex;align-items:center;gap:5px}.mo-composer-foot i{width:4px;height:4px;border-radius:50%;background:#6edc70}
    .mo-loading{min-height:70vh;display:grid;place-items:center;align-content:center;gap:13px;color:rgba(237,246,234,.55);font-size:10px}.mo-loading .mo-agent-logo{animation:agentBreath 1.3s infinite}
    .mo-enter{animation:messageIn .34s cubic-bezier(.2,.8,.2,1) both}
    @keyframes messageIn{from{opacity:0;transform:translateY(9px) scale(.985)}to{opacity:1;transform:none}}
    @keyframes cardIn{from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:none}}
    @keyframes typing{0%,60%,100%{transform:translateY(0);opacity:.3}30%{transform:translateY(-4px);opacity:1}}
    @keyframes agentBreath{50%{transform:scale(1.06);box-shadow:0 0 0 7px rgba(184,240,123,.04)}}
    @keyframes pulse{70%{box-shadow:0 0 0 7px rgba(105,227,111,0)}100%{box-shadow:0 0 0 0 rgba(105,227,111,0)}}
    @keyframes floatGlow{to{transform:translate3d(0,35px,0) scale(1.08)}}
    @media(max-width:700px){
      .mo-agent-page{padding:72px 0 0;overflow:hidden}.mo-chat-shell{height:calc(100dvh - 72px);min-height:0;border-left:0;border-right:0;border-bottom:0;border-radius:22px 22px 0 0}.mo-chat-header{height:64px;padding:0 14px}.mo-agent-logo{width:37px;height:37px;border-radius:12px}.mo-agent-identity strong{font-size:11px}.mo-agent-identity>div>span{font-size:7px}.mo-chat-body{padding:20px 12px 24px}.mo-message-wrap,.mo-row.user .mo-message-wrap{max-width:88%}.mo-mini-avatar{width:27px;height:27px;border-radius:9px}.mo-bubble{font-size:11px;padding:11px 13px}.welcome p{font-size:15px}.welcome small{font-size:9px}.mo-starters{grid-template-columns:1fr;margin-left:37px}.mo-host-card{flex-basis:220px}.mo-composer-zone{padding:10px 10px 8px}.mo-composer{border-radius:16px}.mo-composer-foot>span:first-child{max-width:80%}
    }
  `}</style>;
}
