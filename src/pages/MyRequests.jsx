import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";
// Deterministicki izbor ilustrativne fotografije: bez API poziva i bez promene pri osvezavanju.
// Slike su tematske ilustracije, ne fotografije konkretne ponude ili smestaja.
const PHOTO = {
  hikingGroup: ["photo-1551632811-561732d1e306","photo-1464822759023-fed622ff2c3b","photo-1472396961693-142e6e269027","photo-1500534623283-312aade485b7","photo-1470770841072-f978cf4d019e"],
  hikingSolo: ["photo-1464822759023-fed622ff2c3b","photo-1454496522488-7a8e488e860e","photo-1470770841072-f978cf4d019e","photo-1500530855697-b586d89ba3ee"],
  ski: ["photo-1517299321609-52687d1bc55a","photo-1485546784815-e380f3297414","photo-1455156218388-5e61b526818b","photo-1519681393784-d120267933ba"],
  kayak: ["photo-1501785888041-af3ef285b470","photo-1470770841072-f978cf4d019e","photo-1500534623283-312aade485b7"],
  cycling: ["photo-1485965120184-e220f721d03e","photo-1552674605-db6ffd4facb5","photo-1507035895480-2b3156c31fc8"],
  camp: ["photo-1478131143081-80f7f84ca84d","photo-1500530855697-b586d89ba3ee","photo-1464822759023-fed622ff2c3b"],
  accommodation: ["photo-1449158743715-0a90ebb6d2d8","photo-1510798831971-661eb04b3739","photo-1449844908441-8829872d2607","photo-1484154218962-a197022b5858","photo-1470770841072-f978cf4d019e"],
  service: ["photo-1500534623283-312aade485b7","photo-1472396961693-142e6e269027","photo-1551632811-561732d1e306"],
  rental: ["photo-1485965120184-e220f721d03e","photo-1478131143081-80f7f84ca84d","photo-1501785888041-af3ef285b470"],
  mixed: ["photo-1500530855697-b586d89ba3ee","photo-1470770841072-f978cf4d019e","photo-1464822759023-fed622ff2c3b"]
};
const hashPhoto = (value) => {let h=2166136261;for(const c of String(value||'')){h=Math.imul(h^c.charCodeAt(0),16777619)}return h>>>0;};
const chooseDemandPhoto = (r) => {
  const t=String([r.activity,r.description,r.title].filter(Boolean).join(' ')).toLocaleLowerCase('sr');
  const category=String(r.intent_type||'').toLowerCase();
  let key=category==='accommodation'?'accommodation':category==='rental'?'rental':category==='service'?'service':category==='mixed'?'mixed':'hikingSolo';
  if(/skij|ski |snowboard|bordov|instruktor sk/.test(t))key='ski';
  else if(/kajak|kanu|rafting|splavar/.test(t))key='kayak';
  else if(/bicikl|bike|mtb|cycling/.test(t))key='cycling';
  else if(/kamp|šator|sator/.test(t))key='camp';
  else if(/planinar|pešač|pesac|uspon|vodič|vodic|trek|hiking/.test(t))key=Number(r.people_count||1)>1?'hikingGroup':'hikingSolo';
  const list=PHOTO[key]||PHOTO.mixed;
  const id=list[hashPhoto(r.id||t)%list.length];
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=880&q=78`;
};

const adventureArt = "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1100&q=82";
const accommodationArt = "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=1100&q=82";
const serviceArt = "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1100&q=82";
const rentalArt = "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=1100&q=82";
const mixedArt = "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1100&q=82";
const scene = {adventure:adventureArt, accommodation:accommodationArt, service:serviceArt, rental:rentalArt, mixed:mixedArt};

const fmtDate = (s) => {
  if (!s) return "Fleksibilno";
  const d = new Date(`${s}T12:00:00`);
  return Number.isNaN(d.getTime()) ? s : new Intl.DateTimeFormat("sr-Latn-RS",{day:"numeric",month:"short",year:"numeric"}).format(d);
};
const money = (n,c="RSD") => n == null ? "Po dogovoru" : `${new Intl.NumberFormat("sr-Latn-RS").format(Number(n))} ${c || "RSD"}`;
const typeIcons={adventure:"⛰",accommodation:"⌂",service:"✧",rental:"◈",mixed:"✦"};
const types = {adventure:"Avantura",accommodation:"Smeštaj",mixed:"Kombinovani zahtev",service:"Usluga",rental:"Iznajmljivanje"};
const statuses = {open:"Otvorena",matched:"Dogovoreno",closed:"Zatvorena",cancelled:"Otkazana"};
const Icon = ({name,size=18}) => {
  const shapes = {
    search:<><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></>,
    arrow:<><path d="M5 12h14m-6-6 6 6-6 6"/></>,
    pin:<><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2"/></>,
    calendar:<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4m8-4v4M3 10h18"/></>,
    users:<><circle cx="9" cy="8" r="3"/><path d="M3 20v-2a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v2m2-15a3 3 0 0 1 0 6m1 3a5 5 0 0 1 4 5v2"/></>,
    refresh:<><path d="M20 7v5h-5M4 17v-5h5M18 9A7 7 0 0 0 6 6l-2 3m2 6a7 7 0 0 0 12 3l2-3"/></>,
    inbox:<><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M3 13h5l2 3h4l2-3h5"/></>,
    sparkle:<><path d="m12 2 2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2Z"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{shapes[name]}</svg>;
};
export default function MyRequests() {
  const {user,loading:authLoading}=useAuth();
  const [requests,setRequests]=useState([]);
  const [counts,setCounts]=useState({});
  const [hostAvatars,setHostAvatars]=useState({});
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [query,setQuery]=useState("");
  const [filter,setFilter]=useState("all");
  const load=useCallback(async()=>{
    if(!user?.id){setLoading(false);return;}
    setLoading(true);setError("");
    try {
      const {data,error:err}=await supabase.from("adventure_intents")
        .select("id,activity,intent_type,location_text,start_date,end_date,people_count,budget_per_person,currency,status,created_at")
        .eq("user_id",user.id).order("created_at",{ascending:false}).limit(200);
      if(err)throw err;
      const list=data||[];
      setRequests(list);
      if(list.length){
        const {data:responses,error:responseError}=await supabase.from("adventure_intent_responses")
          .select("intent_id,status,host_id").in("intent_id",list.map(x=>x.id));
        if(responseError)throw responseError;
        const grouped={};
        for(const item of responses||[]){
          if(!grouped[item.intent_id])grouped[item.intent_id]={total:0,pending:0,accepted:0};
          if(item.status==="pending"||item.status==="accepted"){
            grouped[item.intent_id].total++;
            grouped[item.intent_id][item.status]++;
          }
        }
        const hostIds=[...new Set((responses||[]).filter(x=>x.status==="pending"||x.status==="accepted").map(x=>x.host_id).filter(Boolean))];
        if(hostIds.length){
          const {data:hosts}=await supabase.from("profiles").select("id,full_name,avatar_url").in("id",hostIds);
          if(hosts) setHostAvatars(Object.fromEntries(hosts.map(x=>[x.id,x])));
        }
        for(const item of responses||[]){
          if(item.host_id && (item.status==="pending"||item.status==="accepted")){
            (grouped[item.intent_id].hostIds ||= []).push(item.host_id);
          }
        }
        setCounts(grouped);
      }else {setCounts({});setHostAvatars({});}
    }catch(e){setError(e.message||"Nije moguće učitati potražnje.");}
    finally{setLoading(false);}
  },[user?.id]);
  useEffect(()=>{if(!authLoading)load();},[authLoading,load]);
  const filtered=useMemo(()=>requests.filter(r=>{
    const matches=filter==="all"||r.status===filter;
    const text=`${r.activity||""} ${r.location_text||""} ${types[r.intent_type]||""}`.toLocaleLowerCase("sr");
    return matches&&text.includes(query.trim().toLocaleLowerCase("sr"));
  }),[requests,filter,query]);
  const openCount=requests.filter(x=>x.status==="open").length;
  const waiting=requests.filter(x=>x.status==="open"&&(counts[x.id]?.pending||0)>0).length;
  return <main className="mrPage"><style>{`
    .mrTypeIcon{display:inline-grid;place-items:center;width:29px;height:29px;border-radius:9px;background:#eaf2e5;font-size:20px;margin-right:8px;vertical-align:middle}.mrOfferNotice{background:#e8f5e5;border-radius:10px;padding:8px 10px}.mrCard{transition:transform .2s,box-shadow .2s}.mrCard:focus-within{outline:2px solid #8cbf7a}
    .mrPage{--forest:#193e2c;--lime:#c9ee91;min-height:100vh;padding:114px 20px 80px;background:#f3f5f0;color:#21392b;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}
    .mrPage *{box-sizing:border-box}.mrPage a{text-decoration:none;color:inherit}.mrWrap{max-width:1180px;margin:auto}
    .mrHero{position:relative;overflow:hidden;display:flex;align-items:end;justify-content:space-between;gap:28px;padding:38px 42px;border-radius:28px;background:linear-gradient(118deg,#173927,#28583d);color:white}
    .mrHero:after{content:"";position:absolute;right:-75px;top:-130px;width:380px;height:380px;border-radius:50%;border:65px solid rgba(210,244,161,.065);pointer-events:none}
    .mrEyebrow{display:flex;align-items:center;gap:8px;color:#c9ee91;font-size:11px;letter-spacing:.16em;font-weight:800;text-transform:uppercase}
    .mrHero h1{font-size:clamp(34px,5vw,56px);letter-spacing:-.055em;line-height:1.05;margin:16px 0 12px}.mrHero p{max-width:530px;margin:0;color:#c7d9cb;line-height:1.7;font-size:14px}
    .mrHeroLink{position:relative;z-index:1;flex-shrink:0;display:inline-flex;align-items:center;gap:9px;background:var(--lime);color:#1c3b29!important;padding:14px 18px;border-radius:13px;font-weight:800;font-size:13px}
    .mrStats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:18px 0 25px}.mrStat{padding:18px 20px;background:#fff;border:1px solid #e3e9df;border-radius:18px}.mrStat span{display:block;font-size:12px;color:#758477;font-weight:650}.mrStat strong{display:block;margin-top:7px;font-size:27px;letter-spacing:-.04em}
    .mrBar{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;margin-bottom:17px}.mrBar h2{font-size:23px;letter-spacing:-.04em;margin:0}.mrFilters{display:flex;gap:8px;flex-wrap:wrap}
    .mrFilters button{border:1px solid #dce5d9;background:white;padding:9px 13px;border-radius:10px;font:inherit;font-size:12px;font-weight:750;color:#536456;cursor:pointer}
    .mrFilters button.active{background:var(--forest);border-color:var(--forest);color:white}
    .mrSearch{display:flex;align-items:center;gap:9px;padding:0 14px;height:45px;background:white;border:1px solid #dce5d9;border-radius:13px;color:#829184;margin-bottom:17px}
    .mrSearch input{border:0;outline:0;width:100%;font:inherit;font-size:13px;color:#203b2a;background:transparent}
    .mrGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
    .mrCard{min-width:0;display:flex;flex-direction:column;background:white;border:1px solid #dfe7dc;border-radius:20px;overflow:hidden;box-shadow:0 10px 32px rgba(30,57,38,.035);transition:transform .18s,border-color .18s,box-shadow .18s}
    .mrCard:hover{transform:translateY(-3px);border-color:#b4ccb0;box-shadow:0 17px 40px rgba(30,57,38,.09)}
    .mrCardBody{padding:21px 22px 17px;flex:1}.mrTop{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
    .mrType{font-size:10px;font-weight:850;text-transform:uppercase;letter-spacing:.11em;color:#527848}.mrStatus{font-size:11px;font-weight:800;padding:6px 9px;border-radius:100px;background:#eff4ec;color:#526f49}
    .mrStatus.matched{background:#e7f3e4;color:#2b7c4b}.mrStatus.closed,.mrStatus.cancelled{background:#f1f1ed;color:#788076}
    .mrCard h3{font-size:21px;line-height:1.23;letter-spacing:-.04em;margin:15px 0 9px;overflow-wrap:anywhere}
    .mrLocation{display:flex;align-items:center;gap:6px;color:#7a897e;font-size:12px}
    .mrMeta{display:flex;flex-wrap:wrap;gap:9px;margin:17px 0}.mrMeta span{display:inline-flex;align-items:center;gap:7px;padding:9px 11px;border-radius:10px;background:#f4f7f1;font-size:12px;color:#536856;font-weight:650}
    .mrBottom{display:flex;align-items:center;justify-content:space-between;gap:12px;border-top:1px solid #edf1eb;padding:16px 22px}
    .mrBudget small{display:block;font-size:10px;color:#849087;font-weight:750;letter-spacing:.07em;text-transform:uppercase}.mrBudget strong{display:block;font-size:17px;margin-top:3px}
    .mrAction{display:inline-flex;align-items:center;gap:8px;padding:11px 13px;border-radius:11px;background:var(--forest);color:#fff!important;font-size:12px;font-weight:800;white-space:nowrap}
    .mrOfferNotice{display:inline-flex;align-items:center;gap:7px;margin-top:2px;font-size:11px;color:#386f45;font-weight:800}
    .mrState{padding:65px 20px;border:1px dashed #cddccd;background:#fff;border-radius:20px;text-align:center;color:#6c7b6e}.mrState strong{display:block;font-size:20px;color:#24432d;margin:12px 0 7px}.mrState p{font-size:13px;line-height:1.6}
    .mrError{padding:14px 16px;margin-bottom:15px;border-radius:12px;background:#fff0ed;color:#a24739;font-size:13px}.mrRefresh{border:0;background:transparent;color:#4a7351;font:inherit;font-size:12px;font-weight:800;cursor:pointer;display:inline-flex;align-items:center;gap:7px}
    @media(max-width:760px){.mrPage{padding:88px 12px 45px}.mrHero{padding:25px 22px;display:block;border-radius:22px}.mrHeroLink{margin-top:20px}.mrStats{gap:8px}.mrStat{padding:14px}.mrStat strong{font-size:23px}.mrGrid{grid-template-columns:1fr}.mrBar{align-items:start}.mrCardBody{padding:18px}.mrBottom{padding:15px 18px}}
    @media(max-width:380px){.mrStats{grid-template-columns:1fr 1fr}.mrStats .mrStat:last-child{grid-column:span 2}.mrBottom{align-items:start;flex-direction:column}.mrAction{width:100%;justify-content:center}}

    .mrPremiumMain{display:flex;align-items:stretch;gap:12px;min-width:0}.mrPremiumText{flex:1;min-width:0}
    .mrScene{width:108px;min-height:112px;max-height:155px;object-fit:cover;border-radius:11px;flex:none}
    .mrHostStack{display:flex;align-items:center;gap:8px;margin-top:7px}.mrHostStack small{color:#66776c;font-size:10px;font-weight:650}
    .mrAvatarPile{display:flex;padding-left:4px}.mrAvatarPile img,.mrAvatarPile span{width:24px;height:24px;border-radius:50%;object-fit:cover;border:2px solid white;margin-left:-5px;background:#dcebd9;color:#1e4832;display:grid;place-items:center;font-size:10px;font-weight:800}
    @media(max-width:760px){.mrScene{width:92px;min-height:105px}.mrPremiumMain{gap:10px}.mrCard .mrMeta span{padding:4px 5px}.mrCard .mrTypeIcon{display:none}.mrCard .mrType{font-size:9px}.mrHostStack small{display:none}}
    @media(max-width:360px){.mrScene{width:76px}.mrCard .mrMeta{gap:3px}.mrCard .mrMeta span{font-size:10px}}
    /* Compact application layout */
    .mrPage{padding:86px 18px 48px}
    .mrWrap{max-width:1040px}
    .mrHero{padding:20px 24px;border-radius:17px;gap:16px;align-items:center}
    .mrHero:after{width:200px;height:200px;top:-115px;right:-30px;border-width:30px}
    .mrEyebrow{font-size:9px;letter-spacing:.1em}
    .mrHero h1{font-size:clamp(24px,3vw,32px);line-height:1.15;letter-spacing:-.035em;margin:6px 0 3px}
    .mrHero p{font-size:12px;line-height:1.4}
    .mrHeroLink{padding:10px 13px;border-radius:9px;font-size:12px}
    .mrStats{gap:8px;margin:10px 0 17px}
    .mrStat{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:11px 14px;border-radius:11px}
    .mrStat span{font-size:11px}.mrStat strong{margin:0;font-size:20px}
    .mrBar{margin-bottom:10px}.mrBar h2{font-size:18px}
    .mrFilters{gap:5px}.mrFilters button{padding:7px 10px;border-radius:8px}
    .mrSearch{height:38px;border-radius:9px;margin-bottom:11px}
    .mrGrid{gap:10px}.mrCard{border-radius:13px;box-shadow:none}
    .mrCardBody{padding:13px 15px 10px}
    .mrTypeIcon{width:22px;height:22px;font-size:15px;border-radius:6px;margin-right:5px}
    .mrCard h3{font-size:17px;margin:9px 0 5px;line-height:1.25}
    .mrMeta{gap:6px;margin:10px 0 5px}.mrMeta span{padding:5px 7px;font-size:11px;border-radius:7px}
    .mrStatus{padding:4px 7px}.mrBottom{padding:10px 15px}
    .mrBudget strong{font-size:14px}.mrBudget small{font-size:9px}
    .mrAction{padding:9px 11px;border-radius:8px;font-size:11px}
    .mrOfferNotice{font-size:11px;padding:5px 8px}
    @media(max-width:760px){
      .mrPage{padding:76px 10px 28px}
      .mrHero{padding:13px 14px;border-radius:12px;display:flex;align-items:center;gap:10px}
      .mrEyebrow,.mrHero p{display:none}
      .mrHero h1{font-size:21px;margin:0}
      .mrHeroLink{margin:0;padding:9px 10px;font-size:11px;white-space:nowrap}
      .mrStats{grid-template-columns:repeat(3,minmax(0,1fr));gap:5px;margin:8px 0 12px}
      .mrStat{display:block;padding:8px 7px;text-align:center;border-radius:9px}
      .mrStat span{font-size:9px;line-height:1.2;min-height:22px}
      .mrStat strong{font-size:19px;margin-top:2px}
      .mrBar{display:block;margin-bottom:8px}
      .mrBar h2{display:none}
      .mrFilters{display:flex;flex-wrap:nowrap;overflow-x:auto;padding-bottom:3px;scrollbar-width:none}
      .mrFilters::-webkit-scrollbar{display:none}
      .mrFilters button{flex-shrink:0;font-size:11px;padding:7px 10px}
      .mrSearch{height:35px;margin-bottom:9px}
      .mrGrid{grid-template-columns:1fr;gap:8px}
      .mrCardBody{padding:11px 12px 7px}
      .mrCard h3{font-size:16px;margin:7px 0 4px}
      .mrMeta{margin:7px 0 4px}
      .mrBottom{padding:9px 12px;flex-direction:row;align-items:center}
      .mrAction{width:auto;padding:8px 9px;font-size:10px}
      .mrBudget small{font-size:8px}.mrBudget strong{font-size:13px}
    }
    @media(max-width:380px){
      .mrStats{grid-template-columns:repeat(3,minmax(0,1fr))}
      .mrStats .mrStat:last-child{grid-column:auto}
      .mrHero h1{font-size:19px}
      .mrBottom{flex-direction:row;align-items:center}
      .mrAction{width:auto;justify-content:center}
    }
  
    .mrScene{object-fit:cover!important;filter:saturate(.9);border-radius:12px!important}
    .mrCard{box-shadow:none!important;border:1px solid #e4ebe2!important;border-radius:17px!important}
    .mrPage{background:#f7f8f5!important}
    @media(max-width:760px){.mrPage{padding:85px 12px 38px!important}.mrCard{border-radius:16px!important}.mrScene{width:90px!important;min-height:100px!important}.mrCardBody{padding:14px!important}.mrCard h3{font-size:17px!important}.mrMeta{gap:7px!important}.mrMeta span{background:transparent!important;padding:0!important}.mrBottom{padding:12px 14px!important}}
    `}</style><div className="mrWrap">
    <header className="mrHero"><div><div className="mrEyebrow"><Icon name="sparkle" size={16}/> MEETOUTDOORS</div><h1>Moje potražnje</h1><p>Pregled zahteva i ponuda na jednom mestu.</p></div><Link to="/create-request" className="mrHeroLink">Nova potražnja <Icon name="arrow" size={17}/></Link></header>
    <section className="mrStats"><div className="mrStat"><span>Ukupno zahteva</span><strong>{requests.length}</strong></div><div className="mrStat"><span>Otvorene potražnje</span><strong>{openCount}</strong></div><div className="mrStat"><span>Čekaju tvoju odluku</span><strong>{waiting}</strong></div></section>
    <div className="mrBar"><h2>Moje potražnje</h2><div className="mrFilters">{[["all","Sve"],["open","Otvorene"],["matched","Dogovorene"],["closed","Zatvorene"]].map(([v,label])=><button key={v} type="button" className={filter===v?"active":""} onClick={()=>setFilter(v)}>{label}</button>)}<button type="button" onClick={load} title="Osveži" aria-label="Osveži"><Icon name="refresh" size={16}/></button></div></div>
    <label className="mrSearch"><Icon name="search"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Pretraži po aktivnosti ili lokaciji..." aria-label="Pretraži potražnje"/></label>
    {error&&<div className="mrError">{error} <button className="mrRefresh" onClick={load} type="button">Pokušaj ponovo</button></div>}
    {authLoading||loading?<div className="mrState">Učitavanje potražnji...</div>:!user?<div className="mrState"><strong>Prijavi se da vidiš svoje zahteve.</strong><Link to="/login">Prijavi se →</Link></div>:filtered.length===0?<div className="mrState"><Icon name="inbox" size={28}/><strong>{requests.length?"Nema rezultata za izabrani filter.":"Još nemaš potražnji."}</strong><p>Opiši šta tražiš i hostovi će moći da ti pošalju ponude.</p><Link className="mrAction" to="/create-request">Kreiraj potražnju <Icon name="arrow" size={16}/></Link></div>:<div className="mrGrid">{filtered.map(r=><article className="mrCard" key={r.id}><div className="mrCardBody"><div className="mrPremiumMain"><img className="mrScene" src={chooseDemandPhoto(r)} alt="" loading="lazy"/><div className="mrPremiumText"><div className="mrTop"><span className="mrType"><span className="mrTypeIcon">{typeIcons[r.intent_type] || "⛰"}</span>{types[r.intent_type]||"Avantura"}</span><span className={`mrStatus ${r.status||"open"}`}>{statuses[r.status]||r.status}</span></div><h3>{r.activity|| (r.intent_type==="accommodation"?"Potraga za smeštajem":"Moja potražnja")}</h3><div className="mrLocation"><Icon name="pin" size={15}/>{r.location_text||"Lokacija po dogovoru"}</div><div className="mrMeta"><span><Icon name="calendar" size={15}/>{fmtDate(r.start_date)}{r.end_date&&r.end_date!==r.start_date?` – ${fmtDate(r.end_date)}`:""}</span><span><Icon name="users" size={15}/>{r.people_count||1} osoba</span></div>{(counts[r.id]?.pending||0)>0&&<span className="mrOfferNotice"><Icon name="sparkle" size={14}/>{counts[r.id].pending} {counts[r.id].pending===1?"ponuda čeka":"ponude čekaju"} tvoju odluku</span>}{(counts[r.id]?.hostIds||[]).length>0&&<div className="mrHostStack"><div className="mrAvatarPile">{[...new Set(counts[r.id].hostIds)].slice(0,3).map(hid=>hostAvatars[hid]?.avatar_url?<img key={hid} src={hostAvatars[hid].avatar_url} alt={hostAvatars[hid].full_name||"Host"} loading="lazy"/>:<span key={hid}>{(hostAvatars[hid]?.full_name||"H").charAt(0)}</span>)}</div><small>Hostovi su poslali ponude</small></div>}</div></div></div><div className="mrBottom"><div className="mrBudget"><small>Planirani budžet po osobi</small><strong>{money(r.budget_per_person,r.currency)}</strong></div><Link className="mrAction" to={`/agent/request/${r.id}`}>Detalji i ponude <Icon name="arrow" size={16}/></Link></div></article>)}</div>}
  </div></main>;
}
