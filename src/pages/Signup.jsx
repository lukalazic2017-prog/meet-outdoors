import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

function Icon({ name, size = 20 }) {
  const icons = {
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    host: (
      <>
        <path d="M4 20h16" />
        <path d="m6 20 2-10h8l2 10" />
        <path d="M9 10V6a3 3 0 0 1 6 0v4" />
      </>
    ),
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </>
    ),
    lock: (
      <>
        <rect x="4" y="10" width="16" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </>
    ),
    eye: (
      <>
        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
        <circle cx="12" cy="12" r="2.5" />
      </>
    ),
    eyeOff: (
      <>
        <path d="m3 3 18 18" />
        <path d="M10.6 10.7a2 2 0 0 0 2.7 2.7" />
        <path d="M9.4 5.2A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a17.4 17.4 0 0 1-2.1 3.1" />
        <path d="M6.2 6.2C3.5 8 2 12 2 12s3.5 7 10 7a9.7 9.7 0 0 0 4-.8" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    arrow: (
      <>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </>
    ),
    compass: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" />
      </>
    ),
    sparkles: (
      <>
        <path d="m12 3 1.1 3.4L16.5 8l-3.4 1.6L12 13l-1.1-3.4L7.5 8l3.4-1.6L12 3Z" />
        <path d="m19 14 .7 2.1L22 17l-2.3.9L19 20l-.7-2.1L16 17l2.3-.9L19 14Z" />
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
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {icons[name]}
    </svg>
  );
}

function makeTemporaryUsername(role) {
  const suffix = `${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2, 7)}`.slice(0, 10);

  return `${role === "host" ? "host" : "user"}_${suffix}`.toLowerCase();
}

export default function Signup() {
  const navigate = useNavigate();

  const [role, setRole] = useState("user");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [legalConsent, setLegalConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSignup(event) {
    event.preventDefault();

    if (!legalConsent) {
      setError(
        role === "host"
          ? "Prihvati Uslove korišćenja, Politiku privatnosti, Uslove za domaćine i Bezbednosna pravila."
          : "Prihvati Uslove korišćenja i Politiku privatnosti."
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      const cleanEmail = email.trim().toLowerCase();
      const username = makeTemporaryUsername(role);
      const fullName = role === "host" ? "Novi domaćin" : "Novi korisnik";

      const { data, error: signupError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: {
            role,
            full_name: fullName,
            username,
            city: "",
            country: "",
            bio: "",
            phone: "",
            instagram_url: "",
            website_url: "",
            promo_video_url: "",
            activities: [],
            host_purposes: [],
            legal_consent: true,
            legal_consent_version: "2026-09-05",
            legal_consent_at: new Date().toISOString(),
            terms_accepted: true,
            privacy_accepted: true,
            host_terms_accepted: role === "host",
            safety_rules_accepted: role === "host",
          },
        },
      });

      if (signupError) throw signupError;

      if (!data.user?.id) {
        throw new Error("Korisnički ID nije pronađen.");
      }

      if (!data.session) {
        window.alert(
          `Nalog je kreiran.\n\nPoslali smo potvrdu na ${cleanEmail}.\n\nPotvrdi email, prijavi se i zatim dopuni profil.`
        );

        navigate("/login", {
          replace: true,
          state: {
            registeredEmail: cleanEmail,
            emailConfirmationRequired: true,
          },
        });

        return;
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          role,
          full_name: fullName,
          username,
          city: "",
          country: "",
          host_purposes: [],
        })
        .eq("id", data.user.id);

      if (profileError) throw profileError;

      navigate("/edit-profile", { replace: true });
    } catch (err) {
      const message = String(err?.message || "");
      const lower = message.toLowerCase();

      if (lower.includes("user already registered")) {
        setError("Nalog sa ovom email adresom već postoji.");
      } else if (lower.includes("rate limit")) {
        setError("Previše pokušaja. Sačekaj malo pa pokušaj ponovo.");
      } else {
        setError(message || "Došlo je do greške prilikom registracije.");
      }
    } finally {
      setLoading(false);
    }
  }

  const isHost = role === "host";

  return (
    <>
      <style>{css}</style>

      <main className={`signupPage ${isHost ? "hostMode" : "userMode"}`}>
        <div className="ambient ambientOne" />
        <div className="ambient ambientTwo" />

        <section className="authShell">
          <div className="photoLayer" aria-hidden="true">
            <div className="mountain mountainBack" />
            <div className="mountain mountainFront" />
            <div className="photoShade" />
          </div>

          <header className="topBrand">
            <Link to="/" className="brand" aria-label="MeetOutdoors početna">
              <span className="brandMark">
                <Icon name="compass" size={22} />
              </span>
              <span className="brandText">Meet<span>Outdoors</span></span>
            </Link>

            <span className="brandMini">DISCOVER · CONNECT · GO OUTSIDE</span>
          </header>

          <section className="authContent">
            <div className="intro">
              <span className="introTag">
                <Icon name="sparkles" size={13} />
                {isHost ? "ZA DOMAĆINE" : "ZA ISTRAŽIVAČE"}
              </span>

              <h1>
                {isHost ? "Pokaži ljudima šta nudiš." : "Tvoja sledeća avantura počinje ovde."}
              </h1>

              <p>
                {isHost
                  ? "Objavi avanture, smeštaj i usluge. Poveži se direktno sa ljudima koji žele napolje."
                  : "Pronađi avanture, smeštaj, mesta i domaćine — sve na jednom mestu."}
              </p>

              <div className="introMeta">
                <span>Avanture</span><i />
                <span>Smeštaj</span><i />
                <span>Mapa</span><i />
                <span>AI Agent</span>
              </div>
            </div>

            <div className="authPanel">
              <div className="panelTop">
                <div>
                  <span className="panelEyebrow">KREIRAJ NALOG</span>
                  <h2>Pridruži se MeetOutdoors-u</h2>
                </div>
                <span className="stepBadge">20 sek.</span>
              </div>

              <div className="roleSwitch" role="group" aria-label="Tip naloga">
                <button
                  type="button"
                  className={role === "user" ? "active" : ""}
                  onClick={() => {
                    setRole("user");
                    setError("");
                  }}
                >
                  <span className="roleIcon"><Icon name="user" size={18} /></span>
                  <span>
                    <strong>Korisnik</strong>
                    <small>Tražim iskustva</small>
                  </span>
                  <span className="roleCheck">
                    {role === "user" && <Icon name="check" size={11} />}
                  </span>
                </button>

                <button
                  type="button"
                  className={role === "host" ? "active" : ""}
                  onClick={() => {
                    setRole("host");
                    setError("");
                  }}
                >
                  <span className="roleIcon"><Icon name="host" size={18} /></span>
                  <span>
                    <strong>Domaćin</strong>
                    <small>Nudim iskustva</small>
                  </span>
                  <span className="roleCheck">
                    {role === "host" && <Icon name="check" size={11} />}
                  </span>
                </button>
              </div>

              <form className="form" onSubmit={handleSignup}>
                <label className="field">
                  <span>Email adresa</span>
                  <div className="control">
                    <Icon name="mail" size={17} />
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError("");
                      }}
                      placeholder="ime@email.com"
                      autoComplete="email"
                    />
                  </div>
                </label>

                <label className="field">
                  <span>Lozinka</span>
                  <div className="control">
                    <Icon name="lock" size={17} />
                    <input
                      required
                      minLength={6}
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError("");
                      }}
                      placeholder="Najmanje 6 karaktera"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="eyeButton"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? "Sakrij lozinku" : "Prikaži lozinku"}
                    >
                      <Icon name={showPassword ? "eyeOff" : "eye"} size={17} />
                    </button>
                  </div>
                </label>

                <label className="legal">
                  <input
                    type="checkbox"
                    checked={legalConsent}
                    onChange={(e) => {
                      setLegalConsent(e.target.checked);
                      setError("");
                    }}
                  />
                  <span className="legalBox">
                    {legalConsent && <Icon name="check" size={11} />}
                  </span>
                  <span>
                    Prihvatam <Link to="/terms" target="_blank">Uslove korišćenja</Link> i{" "}
                    <Link to="/privacy" target="_blank">Politiku privatnosti</Link>
                    {isHost && (
                      <>
                        , kao i <Link to="/host-terms" target="_blank">Uslove za domaćine</Link> i{" "}
                        <Link to="/safety" target="_blank">Bezbednosna pravila</Link>
                      </>
                    )}.
                  </span>
                </label>

                {error && <div className="error">{error}</div>}

                <button className="submit" type="submit" disabled={loading}>
                  <span>
                    {loading
                      ? "Kreiranje naloga..."
                      : isHost
                      ? "Kreiraj nalog domaćina"
                      : "Kreiraj nalog"}
                  </span>
                  {!loading && <Icon name="arrow" size={18} />}
                </button>
              </form>

              <div className="trustLine">
                <span><Icon name="check" size={11} /> Besplatno</span>
                <span><Icon name="check" size={11} /> Bez kartice</span>
                <span><Icon name="check" size={11} /> Profil kasnije</span>
              </div>

              <p className="loginText">
                Već imaš nalog? <Link to="/login">Prijavi se</Link>
              </p>
            </div>
          </section>
        </section>
      </main>
    </>
  );
}

const css = `
  *{box-sizing:border-box}
  html,body,#root{width:100%;height:100%;min-height:100%;overflow:hidden}
  body{margin:0;background:#dfe9df}
  button,input{font:inherit}
  a{text-decoration:none}
  button,a{-webkit-tap-highlight-color:transparent}

  .signupPage{
    position:relative;
    width:100%;
    height:100svh;
    overflow:hidden;
    padding:12px;
    font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
    color:#fff;
    background:
      radial-gradient(circle at 12% 18%,rgba(182,221,136,.38),transparent 26%),
      radial-gradient(circle at 87% 80%,rgba(66,113,78,.18),transparent 28%),
      linear-gradient(135deg,#e8f0e6,#d6e4d6 48%,#eef3eb);
  }

  .ambient{position:absolute;border-radius:999px;filter:blur(40px);pointer-events:none}
  .ambientOne{width:420px;height:420px;left:-160px;top:-190px;background:rgba(184,229,125,.22)}
  .ambientTwo{width:440px;height:440px;right:-190px;bottom:-210px;background:rgba(50,98,64,.12)}

  .authShell{
    position:relative;
    width:100%;
    height:100%;
    overflow:hidden;
    border-radius:34px;
    background:#173b28;
    box-shadow:0 38px 100px rgba(34,66,43,.20);
    isolation:isolate;
  }

  .photoLayer{
    position:absolute;
    inset:0;
    z-index:-3;
    overflow:hidden;
    background:
      linear-gradient(180deg,rgba(18,38,52,.06),rgba(8,28,20,.18)),
      url("https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2200&q=92")
      center/cover no-repeat;
  }

  .photoLayer:before{
    content:"";
    position:absolute;
    inset:0;
    background:
      linear-gradient(115deg,rgba(255,255,255,.16),transparent 31%),
      radial-gradient(circle at 70% 30%,rgba(255,255,255,.18),transparent 22%);
    opacity:.7;
  }

  .mountain{display:none}

  .mountainBack{
    width:70vw;height:56vw;
    min-width:760px;min-height:610px;
    right:-18vw;bottom:-24vw;
    clip-path:polygon(0 100%,22% 42%,36% 58%,53% 18%,72% 53%,84% 35%,100% 100%);
    background:
      linear-gradient(120deg,rgba(230,239,221,.86) 0 28%,rgba(87,118,90,.90) 29% 53%,rgba(38,78,50,.98) 54% 100%);
  }

  .mountainFront{
    width:76vw;height:52vw;
    min-width:820px;min-height:560px;
    left:-15vw;bottom:-31vw;
    clip-path:polygon(0 100%,0 64%,17% 45%,29% 58%,43% 26%,57% 50%,69% 31%,83% 58%,100% 37%,100% 100%);
    background:
      linear-gradient(125deg,#173e29 0 34%,#2d5d3d 35% 58%,#0d2c1b 59% 100%);
    opacity:.96;
  }

  .photoShade{
    position:absolute;inset:0;
    background:
      linear-gradient(90deg,rgba(7,24,32,.44) 0%,rgba(7,24,32,.18) 43%,rgba(5,29,22,.12) 64%,rgba(5,21,28,.36) 100%),
      linear-gradient(0deg,rgba(4,20,16,.72) 0%,rgba(6,27,21,.28) 52%,rgba(13,34,46,.08) 100%);
  }

  .topBrand{
    position:absolute;
    z-index:5;
    top:30px;left:34px;right:34px;
    display:flex;align-items:center;justify-content:space-between;gap:20px;
  }

  .brand{display:inline-flex;align-items:center;gap:12px;color:#fff}
  .brandMark{
    display:grid;place-items:center;
    width:44px;height:44px;
    border:1px solid rgba(255,255,255,.22);
    border-radius:15px;
    background:rgba(255,255,255,.075);
    color:#d9ff9a;
    box-shadow:inset 0 1px 0 rgba(255,255,255,.13);
    backdrop-filter:blur(16px);
  }
  .brandText{
    font-size:26px;line-height:1;font-weight:950;letter-spacing:-.06em;
    text-shadow:0 4px 18px rgba(0,0,0,.18)
  }
  .brandText span{color:#d8ff94}
  .brandMini{
    color:rgba(255,255,255,.58);
    font-size:8px;font-weight:900;letter-spacing:.18em
  }

  .authContent{
    position:relative;
    z-index:2;
    display:grid;
    grid-template-columns:minmax(0,1fr) 445px;
    align-items:center;
    gap:64px;
    width:100%;height:100%;
    padding:88px clamp(42px,6vw,100px) 44px;
  }

  .intro{max-width:720px}
  .introTag{
    display:inline-flex;align-items:center;gap:8px;
    margin-bottom:16px;
    color:#d8ff94;font-size:9px;font-weight:950;letter-spacing:.16em
  }
  .intro h1{
    max-width:690px;
    margin:0;
    font-size:clamp(56px,5.8vw,92px);
    line-height:.90;
    letter-spacing:-.078em;
    font-weight:950;
    text-wrap:balance;
    text-shadow:0 14px 42px rgba(4,22,11,.26)
  }
  .intro p{
    max-width:560px;margin:22px 0 0;
    color:rgba(255,255,255,.73);
    font-size:14px;line-height:1.7
  }
  .introMeta{
    display:flex;align-items:center;flex-wrap:wrap;gap:10px;
    margin-top:25px;color:rgba(255,255,255,.56);
    font-size:8px;font-weight:900;letter-spacing:.12em;text-transform:uppercase
  }
  .introMeta i{width:4px;height:4px;border-radius:50%;background:#d8ff94}

  .authPanel{
    width:100%;
    transform:translateY(-34px);
    padding:24px;
    border:1px solid rgba(255,255,255,.18);
    border-radius:30px;
    background:
      linear-gradient(155deg,rgba(255,255,255,.12),rgba(10,31,25,.24) 42%,rgba(4,18,14,.36));
    box-shadow:
      0 30px 78px rgba(2,18,11,.25),
      inset 0 1px 0 rgba(255,255,255,.17),
      inset 0 -1px 0 rgba(255,255,255,.05);
    backdrop-filter:blur(30px) saturate(145%);
    -webkit-backdrop-filter:blur(30px) saturate(145%);
  }

  .panelTop{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}
  .panelEyebrow{
    color:#d8ff94;font-size:7px;font-weight:950;letter-spacing:.16em
  }
  .panelTop h2{
    margin:7px 0 0;color:#fff;font-size:30px;line-height:1;letter-spacing:-.055em
  }
  .stepBadge{
    flex:0 0 auto;
    padding:7px 9px;border:1px solid rgba(255,255,255,.12);border-radius:999px;
    background:rgba(255,255,255,.07);color:rgba(255,255,255,.64);
    font-size:7px;font-weight:850
  }

  .roleSwitch{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:16px 0 13px}
  .roleSwitch button{
    position:relative;
    display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:8px;
    min-width:0;min-height:64px;padding:9px 11px;
    border:1px solid rgba(255,255,255,.11);border-radius:16px;
    background:rgba(255,255,255,.055);color:rgba(255,255,255,.76);
    cursor:pointer;text-align:left;transition:.18s ease
  }
  .roleSwitch button:hover{background:rgba(255,255,255,.10)}
  .roleSwitch button.active{
    border-color:rgba(216,255,148,.46);
    background:linear-gradient(180deg,rgba(216,255,148,.16),rgba(216,255,148,.075));
    color:#fff;
    box-shadow:0 10px 24px rgba(0,0,0,.13)
  }
  .roleIcon{
    display:grid;place-items:center;width:34px;height:34px;border-radius:11px;
    background:rgba(255,255,255,.08);color:rgba(255,255,255,.70)
  }
  .active .roleIcon{background:rgba(216,255,148,.14);color:#d8ff94}
  .roleSwitch strong,.roleSwitch small{display:block}
  .roleSwitch strong{font-size:10px}
  .roleSwitch small{margin-top:3px;color:rgba(255,255,255,.46);font-size:7px}
  .active small{color:rgba(255,255,255,.62)}
  .roleCheck{
    display:grid;place-items:center;width:16px;height:16px;border:1px solid rgba(255,255,255,.13);
    border-radius:50%
  }
  .active .roleCheck{border-color:#d8ff94;background:#d8ff94;color:#183c28}

  .form{display:grid;gap:10px}
  .field{display:grid;gap:5px}
  .field>span{color:rgba(255,255,255,.74);font-size:8px;font-weight:850}
  .control{
    display:grid;grid-template-columns:auto 1fr auto;align-items:center;
    min-height:49px;padding:0 13px;
    border:1px solid rgba(255,255,255,.14);border-radius:13px;
    background:rgba(255,255,255,.78);color:#758279;
    box-shadow:inset 0 1px 0 rgba(255,255,255,.7);transition:.18s ease
  }
  .control:focus-within{
    border-color:#d8ff94;background:rgba(255,255,255,.94);box-shadow:0 0 0 4px rgba(216,255,148,.10)
  }
  .control input{
    width:100%;min-width:0;height:47px;padding:0 9px;border:0;outline:0;background:transparent;
    color:#193325;font-size:11px
  }
  .control input::placeholder{color:#98a29b}
  .eyeButton{
    display:grid;place-items:center;width:34px;height:34px;border:0;border-radius:9px;
    background:transparent;color:#7d8981;cursor:pointer
  }
  .eyeButton:hover{background:#edf1eb}

  .legal{
    position:relative;display:grid;grid-template-columns:auto 1fr;align-items:start;gap:8px;
    color:rgba(255,255,255,.53);font-size:5.8px;line-height:1.48;cursor:pointer
  }
  .legal input{position:absolute;opacity:0}
  .legalBox{
    display:grid;place-items:center;width:17px;height:17px;border:1px solid rgba(255,255,255,.22);
    border-radius:5px;background:rgba(255,255,255,.07)
  }
  .legal input:checked+.legalBox{border-color:#d8ff94;background:#d8ff94;color:#173b27}
  .legal a{color:#d8ff94;font-weight:850;text-decoration:underline;text-decoration-color:rgba(216,255,148,.28)}

  .error{
    padding:8px 10px;border:1px solid rgba(255,142,128,.24);border-radius:10px;
    background:rgba(117,28,21,.38);color:#ffd1ca;font-size:7px;line-height:1.4
  }

  .submit{
    display:flex;align-items:center;justify-content:space-between;gap:10px;
    min-height:50px;padding:0 15px;border:0;border-radius:13px;
    background:linear-gradient(180deg,#d9ff9b,#bfe878);color:#183b28;
    cursor:pointer;font-size:9px;font-weight:950;
    box-shadow:0 14px 30px rgba(179,228,105,.16),inset 0 1px 0 rgba(255,255,255,.62);
    transition:.18s ease
  }
  .submit:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 18px 36px rgba(179,228,105,.21)}
  .submit:active:not(:disabled){transform:scale(.995)}
  .submit:disabled{opacity:.62;cursor:wait}







  .trustLine{
    display:flex;align-items:center;justify-content:center;gap:13px;margin-top:10px;
    color:rgba(255,255,255,.48);font-size:6px;font-weight:750
  }
  .trustLine span{display:flex;align-items:center;gap:4px}
  .trustLine svg{color:#d8ff94}

  .loginText{margin:12px 0 0;color:rgba(255,255,255,.55);font-size:7.5px;text-align:center}
  .loginText a{color:#d8ff94;font-weight:900}

  /* MOBILE: full-screen app-style composition */
  @media(max-width:760px){
    .signupPage{padding:0;background:#153623}
    .authShell{border-radius:0;box-shadow:none}
    .photoLayer{
      background:
        linear-gradient(180deg,rgba(21,44,58,.04),rgba(8,27,20,.18)),
        url("https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1400&q=92")
        center/cover no-repeat
    }
    .photoShade{
      background:
        linear-gradient(0deg,rgba(4,18,15,.82) 0%,rgba(5,25,22,.52) 46%,rgba(7,31,39,.16) 76%,rgba(11,36,48,.18) 100%),
        linear-gradient(90deg,rgba(5,23,29,.14),rgba(4,22,18,.04))
    }
    .mountainBack{
      width:155vw;height:115vw;min-width:0;min-height:0;
      right:-64vw;bottom:5vh
    }
    .mountainFront{
      width:170vw;height:110vw;min-width:0;min-height:0;
      left:-54vw;bottom:-23vh
    }

    .topBrand{
      top:calc(18px + env(safe-area-inset-top));
      left:18px;
      right:18px
    }
    .brand{gap:9px}
    .brandMark{width:37px;height:37px;border-radius:12px}
    .brandText{font-size:22px}
    .brandMini{display:none}

    .authContent{
      display:flex;
      flex-direction:column;
      justify-content:center;
      gap:0;
      width:100%;
      height:100%;
      padding:
        calc(78px + env(safe-area-inset-top))
        15px
        calc(18px + env(safe-area-inset-bottom))
    }

    .intro{
      width:88%;
      max-width:390px;
      margin:0 auto 18px;
      padding:0 2px;
      text-align:left
    }
    .introTag{
      margin-bottom:8px;
      font-size:7px;
      letter-spacing:.14em
    }
    .intro h1{
      max-width:335px;
      margin:0;
      font-size:clamp(29px,8vw,37px);
      line-height:1.01;
      letter-spacing:-.052em;
      text-wrap:balance
    }
    .intro p{
      max-width:325px;
      margin:11px 0 0;
      color:rgba(255,255,255,.76);
      font-size:10px;
      line-height:1.55;
      text-wrap:pretty
    }
    .introMeta{display:none}

    .authPanel{
      width:88%;
      max-width:390px;
      transform:none;
      margin-left:auto;
      margin-right:auto;
      padding:16px 15px 12px;
      border:1px solid rgba(255,255,255,.20);
      border-radius:25px;
      background:
        radial-gradient(circle at 12% 0%,rgba(216,255,148,.10),transparent 34%),
        linear-gradient(155deg,rgba(255,255,255,.13),rgba(11,34,27,.20) 44%,rgba(4,18,14,.34));
      box-shadow:
        0 22px 52px rgba(0,0,0,.20),
        inset 0 1px 0 rgba(255,255,255,.17),
        0 0 0 1px rgba(255,255,255,.02);
      backdrop-filter:blur(30px) saturate(150%);
      -webkit-backdrop-filter:blur(30px) saturate(150%)
    }

    .panelTop h2{margin-top:4px;font-size:21px;line-height:1.02}
    .panelEyebrow{font-size:6px;letter-spacing:.15em}
    .stepBadge{padding:6px 8px;font-size:6px;background:rgba(255,255,255,.09)}

    .roleSwitch{gap:6px;margin:10px 0 8px}
    .roleSwitch button{
      min-height:50px;padding:7px 8px;border-radius:14px
    }
    .roleIcon{width:28px;height:28px;border-radius:9px}
    .roleSwitch strong{font-size:8.3px}
    .roleSwitch small{font-size:5.8px}
    .roleCheck{position:absolute;right:6px;top:6px;width:13px;height:13px}

    .form{gap:7px}
    .field{gap:3px}
    .field>span{font-size:6.8px}
    .control{min-height:43px;padding:0 11px;border-radius:12px;background:rgba(255,255,255,.86)}
    .control input{height:41px;padding:0 8px;font-size:9.2px}
    .eyeButton{width:31px;height:31px}
    .legal{font-size:5px;line-height:1.42}
    .legalBox{width:16px;height:16px}
    .submit{min-height:44px;border-radius:12px;font-size:8.5px}

    .trustLine{margin-top:7px;gap:10px;font-size:5.2px}
    .loginText{margin-top:8px;font-size:7px}
  }

  @media(max-width:390px){
    .topBrand{
      top:calc(14px + env(safe-area-inset-top));
      left:14px;
      right:14px
    }
    .brandMark{width:34px;height:34px}
    .brandText{font-size:20px}
    .authContent{padding-left:10px;padding-right:10px}
    .intro{width:91%;margin-bottom:10px}
    .intro h1{font-size:28px;max-width:300px}
    .intro p{font-size:8.8px;max-width:300px}
    .authPanel{width:91%;padding:13px 12px 10px;border-radius:21px}
    .panelTop h2{font-size:18px}
    .roleSwitch{margin:7px 0}
    .roleSwitch button{min-height:44px}
    .control{min-height:38px}
    .control input{height:36px}
    .submit{min-height:39px}
    .trustLine{display:none}
  }

  @media(max-height:700px) and (max-width:760px){
    .topBrand{top:calc(12px + env(safe-area-inset-top))}
    .authContent{
      justify-content:center;
      padding-top:calc(64px + env(safe-area-inset-top));
      padding-bottom:calc(8px + env(safe-area-inset-bottom))
    }
    .intro{margin-bottom:7px}
    .introTag{display:none}
    .intro h1{font-size:25px;max-width:290px}
    .intro p{display:none}
    .authPanel{padding:10px 11px 8px}
    .panelTop h2{font-size:17px}
    .roleSwitch{margin:6px 0}
    .roleSwitch button{min-height:40px}
    .form{gap:5px}
    .control{min-height:35px}
    .control input{height:33px}
    .legal{font-size:4.4px}
    .submit{min-height:36px}
    .trustLine{display:none}
    .loginText{margin-top:4px}
  }
`;