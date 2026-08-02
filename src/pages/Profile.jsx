import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

function Icon({ name, size = 20 }) {
  const icons = {
    compass: <><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z"/></>,
    edit: <><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/></>,
    logout: <><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M21 19V5a2 2 0 0 0-2-2h-6"/></>,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
    verified: <><path d="M12 3l2.2 1.7 2.8-.2.9 2.7 2.3 1.6-1 2.6.7 2.7-2.4 1.4-.6 2.8-2.8-.1L12 20l-2.1-1.8-2.8.1-.6-2.8-2.4-1.4.7-2.7-1-2.6 2.3-1.6.9-2.7 2.8.2Z"/><path d="m8.5 12 2.2 2.2 4.8-5"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.7 2.6a2 2 0 0 1-.5 2.1L8 9.7a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.8.4 1.7.6 2.6.7a2 2 0 0 1 2 2.3Z"/>,
    globe: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></>,
    instagram: <><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/></>,
    play: <><circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4Z"/></>,
    arrow: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
    shield: <><path d="M12 3 5 6v5c0 4.6 2.9 8.4 7 10 4.1-1.6 7-5.4 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/></>,
    alert: <><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></>,
    refresh: <><path d="M20 7v5h-5M4 17v-5h5"/><path d="M18.4 9A7 7 0 0 0 6 6.5L4 9M5.6 15A7 7 0 0 0 18 17.5l2-2.5"/></>,
  };

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true">
      {icons[name]}
    </svg>
  );
}

function externalUrl(value) {
  if (!value) return "";
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function LoadingState() {
  return (
    <>
      <ProfileStyles />
      <main className="statePage">
        <div className="stateCard">
          <span className="loader" />
          <h1>Učitavanje profila</h1>
          <p>Pripremamo tvoj MeetOutdoors profil.</p>
        </div>
      </main>
    </>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    setError("");

    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;

      const user = authData?.user;
      if (!user) {
        navigate("/login");
        return;
      }

      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(data);
    } catch (err) {
      console.error("Greška pri učitavanju profila:", err);
      setProfile(null);
      setError(err.message || "Profil trenutno nije moguće učitati.");
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    setLoggingOut(true);
    setError("");

    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      navigate("/login");
    } catch (err) {
      console.error("Greška pri odjavljivanju:", err);
      setError(err.message || "Odjavljivanje trenutno nije uspelo.");
      setLoggingOut(false);
    }
  }

  const name = profile?.full_name || "Unnamed profile";
  const username = profile?.username ? `@${profile.username}` : "@meetoutdoors";
  const location = [profile?.city, profile?.country].filter(Boolean).join(", ");
  const activities = Array.isArray(profile?.activities) ? profile.activities : [];

  const roleLabel = useMemo(() => {
    if (!profile?.role) return "Member";
    return profile.role.charAt(0).toUpperCase() + profile.role.slice(1);
  }, [profile?.role]);

  const hostLinks = [
    profile?.phone && { icon: "phone", label: "Telefon", value: profile.phone, href: `tel:${profile.phone}` },
    profile?.instagram_url && { icon: "instagram", label: "Instagram", value: "Otvori profil", href: externalUrl(profile.instagram_url) },
    profile?.website_url && { icon: "globe", label: "Website", value: "Poseti sajt", href: externalUrl(profile.website_url) },
    profile?.promo_video_url && { icon: "play", label: "Promo video", value: "Pogledaj video", href: externalUrl(profile.promo_video_url) },
  ].filter(Boolean);

  if (loading) return <LoadingState />;

  if (!profile) {
    return (
      <>
        <ProfileStyles />
        <main className="statePage">
          <div className="stateCard">
            <span className="stateIcon"><Icon name="alert" size={27} /></span>
            <h1>Profil nije pronađen</h1>
            <p>{error || "Nismo uspeli da pronađemo podatke za ovaj profil."}</p>
            <button type="button" onClick={loadProfile}>
              <Icon name="refresh" size={16} /> Pokušaj ponovo
            </button>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <ProfileStyles />

      <main className="profilePage">
        <section
          className="hero"
          style={profile.cover_url ? {
            backgroundImage: `linear-gradient(180deg,rgba(5,19,12,.1),rgba(5,19,12,.82)),url(${profile.cover_url})`
          } : undefined}
        >
          <div className="heroTop">
            <Link to="/" className="brand">
              <span><Icon name="compass" size={21} /></span>
              MeetOutdoors
            </Link>

            <Link to="/" className="homeLink">
              Nazad na početnu <Icon name="arrow" size={15} />
            </Link>
          </div>

          <div className="heroCopy">
            <span className="eyebrow"><span /> Moj profil</span>
            <h1>Tvoj prostor.<br />Tvoja priča.</h1>
            <p>
              Predstavi zajednici ko si, šta voliš i koje outdoor
              avanture želiš da podeliš.
            </p>
          </div>
        </section>

        <section className="content">
          {error && (
            <div className="errorBox" role="alert">
              <Icon name="alert" size={18} />
              <p>{error}</p>
              <button type="button" onClick={() => setError("")}>Zatvori</button>
            </div>
          )}

          <article className="mainCard">
            <div className="identity">
              <div className="avatarWrap">
                <img
                  className="avatar"
                  src={profile.avatar_url || "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=600&auto=format&fit=crop"}
                  alt={name}
                />
                {profile.is_verified && (
                  <span className="verifiedMark"><Icon name="verified" size={22} /></span>
                )}
              </div>

              <div className="identityCopy">
                <div className="badges">
                  <span className="roleBadge">{roleLabel}</span>
                  {profile.is_verified && (
                    <span className="verifiedBadge">
                      <Icon name="verified" size={15} /> Verified
                    </span>
                  )}
                </div>

                <h2>{name}</h2>
                <p className="username">{username}</p>

                {location && (
                  <p className="location">
                    <Icon name="pin" size={16} /> {location}
                  </p>
                )}
              </div>
            </div>

            <div className="actions">
              <Link to="/edit-profile" className="editButton">
                <Icon name="edit" size={17} /> Izmeni profil
              </Link>

              <button
                type="button"
                className="logoutButton"
                onClick={logout}
                disabled={loggingOut}
              >
                <Icon name="logout" size={17} />
                {loggingOut ? "Odjavljivanje..." : "Odjavi se"}
              </button>
            </div>
          </article>

          <div className="grid">
            <section className="panel">
              <div className="panelHeader">
                <div>
                  <span className="sectionLabel">O meni</span>
                  <h3>Više od običnog profila.</h3>
                </div>
                <span className="panelIcon"><Icon name="user" size={21} /></span>
              </div>

              <p className="bio">
                {profile.bio || "Ovaj korisnik još nije dodao opis profila."}
              </p>

              <div className="activities">
                <span>Omiljene aktivnosti</span>
                {activities.length > 0 ? (
                  <div className="chips">
                    {activities.map((item) => (
                      <span className="chip" key={item}>{item}</span>
                    ))}
                  </div>
                ) : (
                  <p className="miniEmpty">Aktivnosti još nisu dodate.</p>
                )}
              </div>
            </section>

            <aside className="panel">
              <div className="panelHeader">
                <div>
                  <span className="sectionLabel">Status profila</span>
                  <h3>MeetOutdoors član.</h3>
                </div>
                <span className="panelIcon"><Icon name="shield" size={21} /></span>
              </div>

              <div className="stats">
                <article><span>Uloga</span><strong>{roleLabel}</strong></article>
                <article><span>Verifikacija</span><strong>{profile.is_verified ? "Verifikovan" : "Nije verifikovan"}</strong></article>
                <article><span>Aktivnosti</span><strong>{activities.length}</strong></article>
              </div>
            </aside>
          </div>

          {profile.role === "host" && (
            <section className="hostSection">
              <div className="hostIntro">
                <span className="sectionLabel">Host kontakt</span>
                <h3>Poveži se direktno sa organizatorom.</h3>
                <p>Kontakt podaci i dodatni kanali na jednom mestu.</p>
              </div>

              {hostLinks.length > 0 ? (
                <div className="hostLinks">
                  {hostLinks.map((item) => (
                    <a
                      key={item.label}
                      href={item.href}
                      target={item.href.startsWith("http") ? "_blank" : undefined}
                      rel={item.href.startsWith("http") ? "noreferrer" : undefined}
                      className="hostLink"
                    >
                      <span className="linkIcon"><Icon name={item.icon} size={20} /></span>
                      <span className="linkCopy">
                        <small>{item.label}</small>
                        <strong>{item.value}</strong>
                      </span>
                      <Icon name="arrow" size={17} />
                    </a>
                  ))}
                </div>
              ) : (
                <div className="hostEmpty">Kontakt podaci još nisu dodati.</div>
              )}
            </section>
          )}
        </section>
      </main>
    </>
  );
}

function ProfileStyles() {
  return (
    <style>{`
      *{box-sizing:border-box}
      body{margin:0;background:#edf1e9}
      button{font:inherit}
      button,a{-webkit-tap-highlight-color:transparent}
      .profilePage,.statePage{min-height:100vh;color:#203229;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
      .profilePage{padding:28px;background:radial-gradient(circle at 7% 0%,rgba(177,211,139,.18),transparent 27%),radial-gradient(circle at 94% 25%,rgba(64,106,75,.1),transparent 24%),#edf1e9}
      .profilePage a{color:inherit;text-decoration:none}
      .hero{position:relative;isolation:isolate;width:min(1200px,100%);min-height:570px;margin:0 auto;padding:34px;overflow:hidden;border-radius:36px;background:radial-gradient(circle at 85% 15%,rgba(202,241,148,.14),transparent 27%),linear-gradient(135deg,#0d2a1a,#173f28 58%,#28563a);background-position:center;background-size:cover;color:white;box-shadow:0 34px 90px rgba(23,54,36,.18)}
      .hero:before{position:absolute;top:-170px;right:-140px;z-index:-1;width:550px;height:550px;border:1px solid rgba(255,255,255,.07);border-radius:50%;content:"";box-shadow:0 0 0 80px rgba(255,255,255,.02),0 0 0 160px rgba(255,255,255,.012)}
      .heroTop{display:flex;align-items:center;justify-content:space-between;gap:20px}
      .brand{display:inline-flex;align-items:center;gap:10px;color:white!important;font-weight:900;letter-spacing:-.03em}
      .brand>span{display:grid;place-items:center;width:43px;height:43px;border:1px solid rgba(255,255,255,.18);border-radius:14px;background:rgba(255,255,255,.1);color:#cef39a;backdrop-filter:blur(14px)}
      .homeLink{display:inline-flex;align-items:center;gap:8px;min-height:42px;padding:0 14px;border:1px solid rgba(255,255,255,.17);border-radius:13px;background:rgba(255,255,255,.1);color:white!important;font-size:10px;font-weight:850;backdrop-filter:blur(14px);transition:.2s}
      .homeLink:hover{gap:11px;background:rgba(255,255,255,.17)}
      .heroCopy{max-width:780px;padding-top:120px}
      .eyebrow{display:inline-flex;align-items:center;gap:9px;padding:9px 13px;border:1px solid rgba(255,255,255,.14);border-radius:999px;background:rgba(255,255,255,.07);color:rgba(255,255,255,.76);font-size:9px;font-weight:900;letter-spacing:.12em;text-transform:uppercase}
      .eyebrow>span{width:7px;height:7px;border-radius:50%;background:#cef39a;box-shadow:0 0 0 5px rgba(206,243,154,.12)}
      .heroCopy h1{margin:24px 0 0;font-size:clamp(60px,8vw,102px);line-height:.88;letter-spacing:-.08em}
      .heroCopy p{max-width:580px;margin:25px 0 0;color:rgba(255,255,255,.63);font-size:14px;line-height:1.75}
      .content{position:relative;z-index:3;width:min(1120px,100%);margin:-72px auto 0}
      .mainCard{display:flex;align-items:flex-end;justify-content:space-between;gap:28px;padding:26px;border:1px solid rgba(221,229,218,.9);border-radius:28px;background:rgba(255,255,255,.88);box-shadow:0 24px 60px rgba(28,49,35,.1);backdrop-filter:blur(22px)}
      .identity{display:flex;align-items:flex-end;gap:22px;min-width:0}
      .avatarWrap{position:relative;flex:0 0 auto}
      .avatar{display:block;width:150px;height:150px;border:5px solid white;border-radius:38px;object-fit:cover;box-shadow:0 18px 42px rgba(29,50,37,.16)}
      .verifiedMark{position:absolute;right:-6px;bottom:7px;display:grid;place-items:center;width:42px;height:42px;border:4px solid white;border-radius:50%;background:#264f36;color:#d7f7a5}
      .identityCopy{min-width:0;padding-bottom:8px}
      .badges{display:flex;flex-wrap:wrap;align-items:center;gap:8px}
      .roleBadge,.verifiedBadge{display:inline-flex;align-items:center;gap:6px;min-height:29px;padding:0 10px;border-radius:999px;font-size:8px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}
      .roleBadge{background:#e7f0dc;color:#5b7840}
      .verifiedBadge{background:#e8eef5;color:#52708e}
      .identityCopy h2{margin:13px 0 0;color:#263a2f;font-size:clamp(32px,5vw,50px);line-height:1;letter-spacing:-.06em}
      .username{margin:7px 0 0;color:#87928a;font-size:12px;font-weight:650}
      .location{display:flex;align-items:center;gap:7px;margin:12px 0 0;color:#627168;font-size:10px;font-weight:700}
      .actions{display:flex;align-items:center;gap:10px;flex:0 0 auto}
      .editButton,.logoutButton{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:45px;padding:0 16px;border-radius:14px;cursor:pointer;font-size:10px;font-weight:850;transition:.2s}
      .editButton{border:1px solid #244d34;background:#183a27;color:white!important}
      .editButton:hover{transform:translateY(-2px);background:#214b32}
      .logoutButton{border:1px solid #efd1cc;background:#fff3f1;color:#a54c42}
      .logoutButton:disabled{cursor:wait;opacity:.65}
      .grid{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(320px,.7fr);gap:18px;margin-top:18px}
      .panel,.hostSection{border:1px solid #dbe4d8;border-radius:26px;background:rgba(255,255,255,.74);box-shadow:0 14px 38px rgba(31,51,38,.05)}
      .panel{padding:27px}
      .panelHeader{display:flex;align-items:flex-start;justify-content:space-between;gap:18px}
      .sectionLabel{color:#789456;font-size:9px;font-weight:900;letter-spacing:.13em;text-transform:uppercase}
      .panelHeader h3,.hostIntro h3{margin:8px 0 0;color:#2f4437;font-size:22px;line-height:1.1;letter-spacing:-.04em}
      .panelIcon{display:grid;place-items:center;flex:0 0 auto;width:44px;height:44px;border-radius:14px;background:#e8f0de;color:#608046}
      .bio{margin:27px 0 0;color:#69766e;font-size:13px;line-height:1.8}
      .activities{margin-top:29px;padding-top:22px;border-top:1px solid #e4e9e1}
      .activities>span{display:block;margin-bottom:12px;color:#667369;font-size:9px;font-weight:850;letter-spacing:.08em;text-transform:uppercase}
      .chips{display:flex;flex-wrap:wrap;gap:8px}
      .chip{padding:9px 12px;border:1px solid #d7e2d1;border-radius:999px;background:#f5f8f2;color:#506557;font-size:9px;font-weight:750}
      .miniEmpty{margin:0;color:#879289;font-size:10px}
      .stats{display:grid;gap:10px;margin-top:24px}
      .stats article{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:15px;border:1px solid #e0e7dd;border-radius:16px;background:#f8faf6}
      .stats span{color:#879188;font-size:9px}.stats strong{color:#415549;font-size:10px}
      .hostSection{display:grid;grid-template-columns:minmax(0,.65fr) minmax(500px,1.35fr);gap:30px;margin-top:18px;padding:30px}
      .hostIntro p{max-width:430px;margin:14px 0 0;color:#7d8981;font-size:11px;line-height:1.7}
      .hostLinks{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
      .hostLink{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:11px;min-width:0;padding:14px;border:1px solid #dfe6dc;border-radius:17px;background:#f8faf6;transition:.2s}
      .hostLink:hover{border-color:#bdcbb8;background:white;transform:translateY(-2px)}
      .linkIcon{display:grid;place-items:center;width:42px;height:42px;border-radius:13px;background:#e7f0dc;color:#5d7d43}
      .linkCopy{min-width:0}.linkCopy small,.linkCopy strong{display:block}
      .linkCopy small{color:#929c95;font-size:8px}
      .linkCopy strong{margin-top:4px;overflow:hidden;color:#405347;font-size:10px;text-overflow:ellipsis;white-space:nowrap}
      .hostEmpty{display:grid;place-items:center;min-height:130px;border:1px dashed #ccd7c8;border-radius:18px;color:#879289;font-size:10px}
      .errorBox{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:11px;margin-bottom:16px;padding:14px;border:1px solid #efc7c2;border-radius:16px;background:#fff0ee;color:#963f35}
      .errorBox p{margin:0;font-size:10px}.errorBox button{border:0;background:transparent;color:inherit;cursor:pointer;font-size:9px;font-weight:850}
      .statePage{display:grid;place-items:center;padding:24px;background:radial-gradient(circle at top left,rgba(166,203,126,.18),transparent 30%),#edf1e9}
      .stateCard{display:grid;place-items:center;width:min(500px,100%);padding:50px 30px;border:1px solid #dce3d9;border-radius:28px;background:rgba(255,255,255,.84);text-align:center;box-shadow:0 20px 60px rgba(28,48,35,.08)}
      .loader{width:38px;height:38px;border:3px solid #dce5d7;border-top-color:#52783c;border-radius:50%;animation:spin .8s linear infinite}
      @keyframes spin{to{transform:rotate(360deg)}}
      .stateIcon{display:grid;place-items:center;width:62px;height:62px;border-radius:20px;background:#ffe9e5;color:#a85247}
      .stateCard h1{margin:18px 0 0;color:#263a2f;font-size:28px;letter-spacing:-.04em}
      .stateCard p{max-width:380px;margin:9px 0 0;color:#7e8981;font-size:11px;line-height:1.65}
      .stateCard button{display:inline-flex;align-items:center;gap:7px;margin-top:20px;padding:12px 15px;border:0;border-radius:12px;background:#183a27;color:white;cursor:pointer;font-size:10px;font-weight:850}
      @media(max-width:930px){.mainCard{align-items:flex-start;flex-direction:column}.grid,.hostSection{grid-template-columns:1fr}}
      @media(max-width:700px){.profilePage{padding:0 0 64px}.hero{min-height:590px;padding:24px;border-radius:0 0 32px 32px}.heroCopy{padding-top:130px}.content{padding:0 18px}.identity{align-items:flex-start;flex-direction:column}.avatar{width:132px;height:132px;border-radius:34px}.hostLinks{grid-template-columns:1fr}}
      @media(max-width:480px){.hero{min-height:550px;padding:19px}.heroCopy h1{font-size:50px}.homeLink{width:42px;padding:0;justify-content:center;font-size:0}.content{padding:0 13px}.mainCard,.panel,.hostSection{padding:20px}.actions{width:100%;align-items:stretch;flex-direction:column}.editButton,.logoutButton{width:100%}}
      @media(prefers-reduced-motion:reduce){*,*:before,*:after{animation:none!important;transition:none!important;scroll-behavior:auto!important}}
    `}</style>
  );
}
