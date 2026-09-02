import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";

const ACTIVITIES = [
  "Planinarenje",
  "Hiking",
  "Kampovanje",
  "Rafting",
  "Kajak",
  "Biciklizam",
  "Penjanje",
  "Via ferrata",
  "Paraglajding",
  "Skijanje",
  "Jahanje",
  "Ribolov",
  "Izlet u prirodi",
  "Ostalo",
];

const DIFFICULTIES = [
  { value: "", label: "Nije mi bitno" },
  { value: "easy", label: "Lagano" },
  { value: "medium", label: "Umereno" },
  { value: "hard", label: "Izazovno" },
];

const initialForm = {
  activity: "",
  location: "",
  startDate: "",
  endDate: "",
  peopleCount: 1,
  budget: "",
  difficulty: "",
  hasCar: null,
  notes: "",
};

function Icon({ name, size = 20 }) {
  const paths = {
    sparkles: (
      <>
        <path d="M12 3l1.4 3.6L17 8l-3.6 1.4L12 13l-1.4-3.6L7 8l3.6-1.4L12 3Z" />
        <path d="M5 14l.8 2.2L8 17l-2.2.8L5 20l-.8-2.2L2 17l2.2-.8L5 14Z" />
        <path d="M19 13l.6 1.4L21 15l-1.4.6L19 17l-.6-1.4L17 15l1.4-.6L19 13Z" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    map: (
      <>
        <polygon points="1 6 8 2 16 6 23 2 23 18 16 22 8 18 1 22 1 6" />
        <line x1="8" y1="2" x2="8" y2="18" />
        <line x1="16" y1="6" x2="16" y2="22" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </>
    ),
    wallet: (
      <>
        <path d="M20 7V5a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h15v12H5a3 3 0 0 1-3-3V6" />
        <path d="M16 13h2" />
      </>
    ),
    car: (
      <>
        <path d="M5 17H3v-5l2-5h14l2 5v5h-2" />
        <path d="M5 17v2h3v-2h8v2h3v-2" />
        <path d="M5 12h14" />
        <circle cx="7" cy="14.5" r="1" />
        <circle cx="17" cy="14.5" r="1" />
      </>
    ),
    arrow: (
      <>
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="13 6 19 12 13 18" />
      </>
    ),
    check: <polyline points="20 6 9 17 4 12" />,
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

export default function Agent() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => {
    return form.activity.trim() && Number(form.peopleCount) > 0;
  }, [form.activity, form.peopleCount]);

  const update = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (error) setError("");
  };

  async function handleSubmit(e) {
    e.preventDefault();

    if (!user) {
      navigate("/login");
      return;
    }

    if (!form.activity) {
      setError("Izaberi aktivnost koju želiš.");
      return;
    }

    if (form.endDate && form.startDate && form.endDate < form.startDate) {
      setError("Krajnji datum ne može biti pre početnog.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setResult(null);

      const { data, error: rpcError } = await supabase.rpc(
        "create_adventure_intent_and_notify_hosts",
        {
          p_activity: form.activity,
          p_location_text: form.location.trim() || null,
          p_start_date: form.startDate || null,
          p_end_date: form.endDate || null,
          p_people_count: Number(form.peopleCount) || 1,
          p_budget_per_person:
            form.budget === "" ? null : Number(form.budget),
          p_currency: "RSD",
          p_difficulty: form.difficulty || null,
          p_has_car: form.hasCar,
          p_notes: form.notes.trim() || null,
        }
      );

      if (rpcError) throw rpcError;

      setResult(data);
    } catch (err) {
      console.error("Agent request error:", err);
      setError(
        err?.message ||
          "Nismo uspeli da pošaljemo zahtev. Pokušaj ponovo."
      );
    } finally {
      setLoading(false);
    }
  }

  function resetAgent() {
    setForm(initialForm);
    setResult(null);
    setError("");
  }

  return (
    <main className="mo-agent">
      <style>{`
        .mo-agent {
          --ink: #15231c;
          --muted: #6c7971;
          --green: #214f3b;
          --green-dark: #173c2d;
          --line: rgba(24, 53, 40, 0.11);
          --soft: #f4f7f3;

          min-height: 100vh;
          background:
            radial-gradient(circle at 90% 4%, rgba(92, 137, 105, .12), transparent 30%),
            radial-gradient(circle at 8% 35%, rgba(193, 210, 190, .20), transparent 24%),
            #fbfcfa;
          color: var(--ink);
          padding: 112px 20px 70px;
          box-sizing: border-box;
        }

        .mo-agent * {
          box-sizing: border-box;
        }

        .mo-agent-shell {
          width: min(1120px, 100%);
          margin: 0 auto;
        }

        .mo-agent-hero {
          max-width: 760px;
          margin-bottom: 34px;
        }

        .mo-agent-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border: 1px solid var(--line);
          border-radius: 999px;
          background: rgba(255,255,255,.76);
          backdrop-filter: blur(14px);
          font-size: 13px;
          font-weight: 800;
          color: var(--green);
          margin-bottom: 18px;
        }

        .mo-agent h1 {
          margin: 0;
          max-width: 720px;
          font-size: clamp(40px, 6vw, 72px);
          line-height: .98;
          letter-spacing: -0.055em;
          font-weight: 850;
        }

        .mo-agent-lead {
          max-width: 660px;
          margin: 22px 0 0;
          font-size: 18px;
          line-height: 1.65;
          color: var(--muted);
        }

        .mo-agent-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.55fr) minmax(280px, .75fr);
          gap: 22px;
          align-items: start;
        }

        .mo-agent-card {
          background: rgba(255,255,255,.9);
          border: 1px solid var(--line);
          border-radius: 28px;
          box-shadow: 0 24px 70px rgba(24, 48, 36, .08);
        }

        .mo-agent-form {
          padding: 28px;
        }

        .mo-agent-section-title {
          margin: 0 0 6px;
          font-size: 20px;
          letter-spacing: -.02em;
        }

        .mo-agent-section-copy {
          margin: 0 0 24px;
          color: var(--muted);
          line-height: 1.55;
          font-size: 14px;
        }

        .mo-agent-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 17px;
        }

        .mo-agent-field {
          min-width: 0;
        }

        .mo-agent-field.full {
          grid-column: 1 / -1;
        }

        .mo-agent-label {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 8px;
          font-size: 13px;
          font-weight: 800;
          color: #34473d;
        }

        .mo-agent input,
        .mo-agent select,
        .mo-agent textarea {
          width: 100%;
          border: 1px solid #dce3de;
          border-radius: 15px;
          background: #fff;
          color: var(--ink);
          font: inherit;
          outline: none;
          transition: .18s ease;
        }

        .mo-agent input,
        .mo-agent select {
          height: 52px;
          padding: 0 14px;
        }

        .mo-agent textarea {
          min-height: 116px;
          resize: vertical;
          padding: 14px;
          line-height: 1.55;
        }

        .mo-agent input:focus,
        .mo-agent select:focus,
        .mo-agent textarea:focus {
          border-color: rgba(33, 79, 59, .55);
          box-shadow: 0 0 0 4px rgba(33, 79, 59, .08);
        }

        .mo-agent-choice-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 9px;
        }

        .mo-agent-choice {
          min-height: 50px;
          border: 1px solid #dce3de;
          border-radius: 14px;
          background: white;
          color: #536159;
          cursor: pointer;
          font-weight: 750;
          transition: .18s ease;
        }

        .mo-agent-choice:hover {
          border-color: #aebbb3;
        }

        .mo-agent-choice.active {
          border-color: var(--green);
          background: #eef5f0;
          color: var(--green);
          box-shadow: inset 0 0 0 1px var(--green);
        }

        .mo-agent-error {
          margin-top: 18px;
          padding: 13px 15px;
          border-radius: 14px;
          background: #fff3f2;
          border: 1px solid #f0d2cf;
          color: #9a3f38;
          font-size: 14px;
          font-weight: 650;
        }

        .mo-agent-submit {
          width: 100%;
          min-height: 58px;
          margin-top: 22px;
          border: 0;
          border-radius: 17px;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 10px;
          background: var(--green);
          color: white;
          cursor: pointer;
          font-size: 15px;
          font-weight: 850;
          box-shadow: 0 15px 30px rgba(33, 79, 59, .19);
          transition: .2s ease;
        }

        .mo-agent-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          background: var(--green-dark);
        }

        .mo-agent-submit:disabled {
          opacity: .55;
          cursor: not-allowed;
          box-shadow: none;
        }

        .mo-agent-side {
          position: sticky;
          top: 100px;
          overflow: hidden;
        }

        .mo-agent-side-top {
          padding: 25px;
          background: linear-gradient(145deg, #173d2d, #2c624a);
          color: white;
        }

        .mo-agent-side-top h2 {
          margin: 15px 0 8px;
          font-size: 24px;
          letter-spacing: -.035em;
        }

        .mo-agent-side-top p {
          margin: 0;
          color: rgba(255,255,255,.72);
          line-height: 1.55;
          font-size: 14px;
        }

        .mo-agent-steps {
          padding: 8px 25px 24px;
          background: white;
        }

        .mo-agent-step {
          display: grid;
          grid-template-columns: 32px 1fr;
          gap: 12px;
          padding: 17px 0;
          border-bottom: 1px solid var(--line);
        }

        .mo-agent-step:last-child {
          border-bottom: 0;
        }

        .mo-agent-step-number {
          width: 32px;
          height: 32px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: var(--soft);
          color: var(--green);
          font-size: 12px;
          font-weight: 900;
        }

        .mo-agent-step strong {
          display: block;
          margin-bottom: 4px;
          font-size: 14px;
        }

        .mo-agent-step span {
          display: block;
          color: var(--muted);
          line-height: 1.45;
          font-size: 12px;
        }

        .mo-agent-success {
          padding: 38px;
          text-align: center;
        }

        .mo-agent-success-icon {
          width: 66px;
          height: 66px;
          display: grid;
          place-items: center;
          margin: 0 auto 20px;
          border-radius: 50%;
          background: #e8f4eb;
          color: var(--green);
        }

        .mo-agent-success h2 {
          margin: 0;
          font-size: clamp(28px, 4vw, 42px);
          letter-spacing: -.04em;
        }

        .mo-agent-success > p {
          max-width: 560px;
          margin: 13px auto 0;
          color: var(--muted);
          line-height: 1.6;
        }

        .mo-agent-success-stat {
          display: inline-flex;
          flex-direction: column;
          margin-top: 24px;
          padding: 17px 28px;
          border-radius: 17px;
          background: var(--soft);
        }

        .mo-agent-success-stat strong {
          font-size: 28px;
          color: var(--green);
        }

        .mo-agent-success-stat span {
          margin-top: 2px;
          color: var(--muted);
          font-size: 12px;
          font-weight: 700;
        }

        .mo-agent-again {
          display: block;
          margin: 22px auto 0;
          border: 0;
          background: transparent;
          color: var(--green);
          font-weight: 850;
          cursor: pointer;
          font-size: 14px;
        }

        @media (max-width: 820px) {
          .mo-agent {
            padding: 94px 14px 45px;
          }

          .mo-agent-layout {
            grid-template-columns: 1fr;
          }

          .mo-agent-side {
            position: static;
          }
        }

        @media (max-width: 560px) {
          .mo-agent h1 {
            font-size: 43px;
          }

          .mo-agent-lead {
            font-size: 16px;
          }

          .mo-agent-form {
            padding: 20px;
          }

          .mo-agent-grid {
            grid-template-columns: 1fr;
          }

          .mo-agent-field.full {
            grid-column: auto;
          }

          .mo-agent-card {
            border-radius: 22px;
          }

          .mo-agent-choice-row {
            grid-template-columns: 1fr;
          }

          .mo-agent-success {
            padding: 28px 20px;
          }
        }
      `}</style>

      <div className="mo-agent-shell">
        <section className="mo-agent-hero">
          <div className="mo-agent-badge">
            <Icon name="sparkles" size={16} />
            MEETOUTDOORS AGENT
          </div>

          <h1>Gde želiš da te priroda odvede?</h1>

          <p className="mo-agent-lead">
            Reci nam šta želiš. MeetOutdoors će pronaći najbolju
            mogućnost — a ako je još nema, tvoja potražnja može stići
            do relevantnih outdoor domaćina.
          </p>
        </section>

        <div className="mo-agent-layout">
          <section className="mo-agent-card">
            {result ? (
              <div className="mo-agent-success">
                <div className="mo-agent-success-icon">
                  <Icon name="check" size={30} />
                </div>

                <h2>Potraga je pokrenuta.</h2>

                <p>
                  Zapamtili smo šta tražiš. Relevantni domaćini mogu
                  dobiti signal da postoji potražnja za ovakvom
                  avanturom.
                </p>

                <div className="mo-agent-success-stat">
                  <strong>{result?.hosts_notified ?? 0}</strong>
                  <span>
                    {Number(result?.hosts_notified) === 1
                      ? "relevantan domaćin obavešten"
                      : "relevantnih domaćina obavešteno"}
                  </span>
                </div>

                <button
                  className="mo-agent-again"
                  type="button"
                  onClick={resetAgent}
                >
                  Napravi novu potragu
                </button>
              </div>
            ) : (
              <form
                className="mo-agent-form"
                onSubmit={handleSubmit}
              >
                <h2 className="mo-agent-section-title">
                  Ispričaj nam šta tražiš
                </h2>

                <p className="mo-agent-section-copy">
                  Ne moraš da znaš tačan plan. Dovoljno je da nam daš
                  nekoliko smernica.
                </p>

                <div className="mo-agent-grid">
                  <div className="mo-agent-field">
                    <label className="mo-agent-label">
                      <Icon name="sparkles" size={16} />
                      Aktivnost
                    </label>

                    <select
                      value={form.activity}
                      onChange={(e) =>
                        update("activity", e.target.value)
                      }
                    >
                      <option value="">Izaberi aktivnost</option>

                      {ACTIVITIES.map((activity) => (
                        <option
                          key={activity}
                          value={activity}
                        >
                          {activity}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mo-agent-field">
                    <label className="mo-agent-label">
                      <Icon name="map" size={16} />
                      Gde?
                    </label>

                    <input
                      value={form.location}
                      onChange={(e) =>
                        update("location", e.target.value)
                      }
                      placeholder="npr. Tara, Rtanj, do 100 km..."
                    />
                  </div>

                  <div className="mo-agent-field">
                    <label className="mo-agent-label">
                      <Icon name="calendar" size={16} />
                      Od
                    </label>

                    <input
                      type="date"
                      value={form.startDate}
                      onChange={(e) =>
                        update("startDate", e.target.value)
                      }
                    />
                  </div>

                  <div className="mo-agent-field">
                    <label className="mo-agent-label">
                      <Icon name="calendar" size={16} />
                      Do
                    </label>

                    <input
                      type="date"
                      min={form.startDate || undefined}
                      value={form.endDate}
                      onChange={(e) =>
                        update("endDate", e.target.value)
                      }
                    />
                  </div>

                  <div className="mo-agent-field">
                    <label className="mo-agent-label">
                      <Icon name="users" size={16} />
                      Broj osoba
                    </label>

                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={form.peopleCount}
                      onChange={(e) =>
                        update("peopleCount", e.target.value)
                      }
                    />
                  </div>

                  <div className="mo-agent-field">
                    <label className="mo-agent-label">
                      <Icon name="wallet" size={16} />
                      Budžet po osobi
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={form.budget}
                      onChange={(e) =>
                        update("budget", e.target.value)
                      }
                      placeholder="npr. 5000 RSD"
                    />
                  </div>

                  <div className="mo-agent-field">
                    <label className="mo-agent-label">
                      Težina
                    </label>

                    <select
                      value={form.difficulty}
                      onChange={(e) =>
                        update("difficulty", e.target.value)
                      }
                    >
                      {DIFFICULTIES.map((difficulty) => (
                        <option
                          key={difficulty.value}
                          value={difficulty.value}
                        >
                          {difficulty.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mo-agent-field">
                    <label className="mo-agent-label">
                      <Icon name="car" size={16} />
                      Imaš prevoz?
                    </label>

                    <div className="mo-agent-choice-row">
                      <button
                        type="button"
                        className={`mo-agent-choice ${
                          form.hasCar === true ? "active" : ""
                        }`}
                        onClick={() => update("hasCar", true)}
                      >
                        Da
                      </button>

                      <button
                        type="button"
                        className={`mo-agent-choice ${
                          form.hasCar === false ? "active" : ""
                        }`}
                        onClick={() => update("hasCar", false)}
                      >
                        Ne
                      </button>

                      <button
                        type="button"
                        className={`mo-agent-choice ${
                          form.hasCar === null ? "active" : ""
                        }`}
                        onClick={() => update("hasCar", null)}
                      >
                        Svejedno
                      </button>
                    </div>
                  </div>

                  <div className="mo-agent-field full">
                    <label className="mo-agent-label">
                      Još nešto što bi trebalo da znamo?
                    </label>

                    <textarea
                      value={form.notes}
                      onChange={(e) =>
                        update("notes", e.target.value)
                      }
                      placeholder="npr. Idemo sa detetom, ne želimo previše hodanja, voleli bismo ručak u prirodi..."
                    />
                  </div>
                </div>

                {error && (
                  <div className="mo-agent-error">
                    {error}
                  </div>
                )}

                <button
                  className="mo-agent-submit"
                  type="submit"
                  disabled={!canSubmit || loading}
                >
                  <Icon name="sparkles" />

                  {loading
                    ? "Tražimo najbolju opciju..."
                    : "Izvedi me napolje"}

                  {!loading && <Icon name="arrow" />}
                </button>
              </form>
            )}
          </section>

          <aside className="mo-agent-card mo-agent-side">
            <div className="mo-agent-side-top">
              <Icon name="sparkles" size={26} />

              <h2>Ne traži satima. Reci šta želiš.</h2>

              <p>
                MeetOutdoors pretvara tvoju želju za izlaskom u
                konkretan signal koji možemo povezati sa pravim
                outdoor domaćinima.
              </p>
            </div>

            <div className="mo-agent-steps">
              <div className="mo-agent-step">
                <div className="mo-agent-step-number">01</div>
                <div>
                  <strong>Kažeš šta želiš</strong>
                  <span>
                    Aktivnost, vreme, društvo, budžet i nekoliko
                    ograničenja.
                  </span>
                </div>
              </div>

              <div className="mo-agent-step">
                <div className="mo-agent-step-number">02</div>
                <div>
                  <strong>MeetOutdoors traži rešenje</strong>
                  <span>
                    Postojeće ponude i relevantni domaćini postaju deo
                    iste potrage.
                  </span>
                </div>
              </div>

              <div className="mo-agent-step">
                <div className="mo-agent-step-number">03</div>
                <div>
                  <strong>Avantura postaje moguća</strong>
                  <span>
                    Ako prava ponuda još ne postoji, tržište dobija
                    signal šta ljudi zapravo žele.
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}