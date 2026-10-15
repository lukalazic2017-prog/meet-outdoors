import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";

const categories = [
  ["adventure", "Avantura", "Planinarenje, rafting, ture i aktivnosti"],
  ["accommodation", "Smeštaj", "Vikendice, kampovi i prenoćišta"],
  ["service", "Usluga", "Vodiči, prevoz, instruktori i druge usluge"],
  ["rental", "Iznajmljivanje", "Bicikli, kajaci, oprema i drugo"],
  ["mixed", "Avantura + smeštaj", "Jedan zahtev za avanturu i smeštaj"],
];
const initial = { type: "adventure", activity: "", location: "", start: "", end: "", people: "1", budget: "", currency: "RSD", difficulty: "", car: "", notes: "" };
export default function CreateRequest() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
  const needsActivity = form.type !== "accommodation";
  const submit = async (event) => {
    event.preventDefault();
    if (saving) return;
    setError("");
    if (!user) { navigate("/login", { state: { from: "/create-request" } }); return; }
    if (needsActivity && !form.activity.trim()) { setError("Unesi šta tražiš."); return; }
    if (form.end && form.start && form.end < form.start) { setError("Datum završetka ne može biti pre početka."); return; }
    const people = Number(form.people);
    if (!Number.isInteger(people) || people < 1 || people > 1000) { setError("Broj osoba mora biti između 1 i 1000."); return; }
    if (form.budget !== "" && (!Number.isFinite(Number(form.budget)) || Number(form.budget) < 0)) { setError("Unesi ispravan budžet."); return; }
    setSaving(true);
    try {
      const { data, error: rpcError } = await supabase.rpc("create_manual_outdoor_demand", {
        p_intent_type: form.type,
        p_activity: form.activity.trim() || null,
        p_location_text: form.location.trim() || null,
        p_start_date: form.start || null,
        p_end_date: form.end || null,
        p_people_count: people,
        p_budget_per_person: form.budget === "" ? null : Number(form.budget),
        p_currency: form.currency,
        p_difficulty: form.type === "adventure" || form.type === "mixed" ? (form.difficulty || null) : null,
        p_has_car: form.car === "" ? null : form.car === "yes",
        p_notes: form.notes.trim() || null,
      });
      if (rpcError) throw rpcError;
      if (!data?.success || !data?.intent_id) throw new Error("Zahtev nije potvrđen. Pokušaj ponovo.");
      navigate(`/agent/request/${data.intent_id}`, { replace: true });
    } catch (e) { setError(e?.message || "Potražnja nije kreirana."); }
    finally { setSaving(false); }
  };
  return <main className="cr-page"><style>{`
    .cr-page{min-height:100vh;background:#f4f6f1;padding:112px 18px 70px;color:#1b3828;font-family:Inter,system-ui,sans-serif}.cr-wrap{max-width:940px;margin:auto}.cr-back{font-size:13px;color:#55725e;text-decoration:none;font-weight:700}.cr-head{margin:22px 0 25px}.cr-head h1{font-size:clamp(32px,5vw,50px);letter-spacing:-.05em;margin:8px 0}.cr-head p{color:#698071;line-height:1.6}.cr-panel{background:white;border:1px solid #e1e9dd;border-radius:23px;padding:28px;box-shadow:0 15px 45px #173d2810}.cr-label{display:block;font-size:13px;font-weight:800;margin:21px 0 8px}.cr-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.cr-categories{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.cr-choice{border:1px solid #dfe8dc;border-radius:13px;padding:15px;background:#fafcf9;text-align:left;cursor:pointer;color:#24442f}.cr-choice.active{border-color:#2e6743;background:#eff8e9;box-shadow:inset 0 0 0 1px #2e6743}.cr-choice strong{display:block;font-size:14px}.cr-choice small{display:block;font-size:11px;color:#6a8271;margin-top:5px;line-height:1.4}.cr-field{width:100%;padding:13px 14px;border:1px solid #dce5da;border-radius:11px;background:white;color:#193b28;font:inherit;font-size:14px;outline-color:#3c8155;min-width:0}.cr-field:focus{border-color:#3c8155}.cr-hint{font-size:12px;color:#708473;margin-top:7px;line-height:1.5}.cr-error{padding:13px 15px;border-radius:11px;background:#fff0eb;color:#a03c2c;margin:20px 0}.cr-actions{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:28px;flex-wrap:wrap}.cr-submit{border:0;border-radius:12px;background:#183f2b;color:white;font:inherit;font-size:14px;font-weight:800;padding:15px 24px;cursor:pointer}.cr-submit:disabled{opacity:.6;cursor:wait}.cr-agent{font-size:13px;color:#416f4c;text-decoration:none;font-weight:750}@media(max-width:640px){.cr-page{padding:90px 12px 35px}.cr-panel{padding:18px}.cr-grid,.cr-categories{grid-template-columns:1fr}.cr-actions{align-items:stretch;flex-direction:column}.cr-submit{width:100%}}
  `}</style><div className="cr-wrap"><Link className="cr-back" to="/my-requests">← Moje potražnje</Link><header className="cr-head"><h1>Pronađi ono što ti treba.</h1><p>Objavi potražnju i dozvoli domaćinima da ti pošalju ponude. Bez razgovora sa AI agentom.</p></header>
    <form className="cr-panel" onSubmit={submit}>
      <div className="cr-label">Šta tražiš?</div><div className="cr-categories">{categories.map(([value,title,description])=><button key={value} type="button" className={`cr-choice ${form.type===value?"active":""}`} aria-pressed={form.type===value} onClick={()=>set("type",value)}><strong>{title}</strong><small>{description}</small></button>)}</div>
      {form.type === "mixed" && <p className="cr-hint">Kombinovani zahtev trenutno obuhvata avanturu i smeštaj. Prihvatanje jedne ponude završava zahtev; nezavisno prihvatanje više ponuda dolazi u narednoj fazi.</p>}
      <label className="cr-label" htmlFor="cr-activity">{form.type === "accommodation" ? "Kakav smeštaj želiš? (opciono)" : "Šta tačno tražiš?"}</label><input id="cr-activity" className="cr-field" maxLength={300} required={needsActivity} value={form.activity} onChange={e=>set("activity",e.target.value)} placeholder={form.type==="rental"?"Npr. dva MTB bicikla za vikend":form.type==="service"?"Npr. lokalni vodič za uspon":form.type==="accommodation"?"Npr. vikendica za četiri osobe":"Npr. organizovana planinarska tura"}/>
      <div className="cr-grid"><div><label className="cr-label" htmlFor="cr-location">Lokacija</label><input id="cr-location" className="cr-field" maxLength={300} value={form.location} onChange={e=>set("location",e.target.value)} placeholder="Npr. Stara planina"/></div><div><label className="cr-label" htmlFor="cr-people">Broj osoba</label><input id="cr-people" className="cr-field" type="number" min="1" max="1000" required value={form.people} onChange={e=>set("people",e.target.value)}/></div><div><label className="cr-label" htmlFor="cr-start">Od datuma</label><input id="cr-start" className="cr-field" type="date" value={form.start} onChange={e=>set("start",e.target.value)}/></div><div><label className="cr-label" htmlFor="cr-end">Do datuma</label><input id="cr-end" className="cr-field" type="date" min={form.start||undefined} value={form.end} onChange={e=>set("end",e.target.value)}/></div><div><label className="cr-label" htmlFor="cr-budget">Budžet po osobi (opciono)</label><input id="cr-budget" className="cr-field" type="number" min="0" step="0.01" value={form.budget} onChange={e=>set("budget",e.target.value)} placeholder="Po dogovoru"/></div><div><label className="cr-label" htmlFor="cr-currency">Valuta</label><select id="cr-currency" className="cr-field" value={form.currency} onChange={e=>set("currency",e.target.value)}><option value="RSD">RSD</option><option value="EUR">EUR</option></select></div></div>
      {(form.type==="adventure"||form.type==="mixed")&&<div><label className="cr-label" htmlFor="cr-difficulty">Nivo težine (opciono)</label><select id="cr-difficulty" className="cr-field" value={form.difficulty} onChange={e=>set("difficulty",e.target.value)}><option value="">Nije važno</option><option value="easy">Lako</option><option value="moderate">Srednje</option><option value="hard">Zahtevno</option></select></div>}
      <label className="cr-label" htmlFor="cr-car">Imaš sopstveni prevoz?</label><select id="cr-car" className="cr-field" value={form.car} onChange={e=>set("car",e.target.value)}><option value="">Nije navedeno</option><option value="yes">Da</option><option value="no">Ne</option></select>
      <label className="cr-label" htmlFor="cr-notes">Dodatni detalji</label><textarea id="cr-notes" className="cr-field" rows={5} maxLength={5000} value={form.notes} onChange={e=>set("notes",e.target.value)} placeholder="Napiši sve što je važno domaćinima..."/>
      {error&&<div className="cr-error" role="alert">{error}</div>}{!authLoading&&!user&&<p className="cr-hint">Za objavljivanje potražnje potrebna je prijava.</p>}
      <div className="cr-actions"><Link className="cr-agent" to="/agent">Radije koristiš AI agenta? →</Link><button className="cr-submit" type="submit" disabled={saving||authLoading}>{saving?"Objavljivanje...":"Objavi potražnju →"}</button></div>
    </form></div></main>;
}
