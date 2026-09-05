import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

function Icon({ name, size = 20, strokeWidth = 2 }) {
  const icons = {
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
    shield: (
      <>
        <path d="M12 3 5 6v5c0 4.6 2.9 8.4 7 10 4.1-1.6 7-5.4 7-10V6l-7-3Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    alert: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5" />
        <path d="M12 16h.01" />
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
      {icons[name]}
    </svg>
  );
}

function getPasswordStrength(password) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) return { label: "Slaba", level: 1 };
  if (score <= 3) return { label: "Dobra", level: 2 };
  return { label: "Jaka", level: 3 };
}

export default function ResetPassword() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [validRecovery, setValidRecovery] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const strength = getPasswordStrength(password);

  useEffect(() => {
    let mounted = true;

    async function checkRecoverySession() {
      const { data } = await supabase.auth.getSession();

      if (!mounted) return;

      if (data?.session?.user) {
        setValidRecovery(true);
      }

      setCheckingSession(false);
    }

    checkRecoverySession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (event === "PASSWORD_RECOVERY" || session?.user) {
        setValidRecovery(true);
        setCheckingSession(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Nova lozinka mora imati najmanje 8 karaktera.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Lozinke se ne poklapaju.");
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) throw updateError;

      setSuccess(true);

      // Recovery link creates an authenticated session.
      // Sign out after password change so the next access uses the new password.
      await supabase.auth.signOut();
    } catch (err) {
      const message = String(err?.message || "").toLowerCase();

      if (
        message.includes("same password") ||
        message.includes("different from the old")
      ) {
        setError("Nova lozinka mora biti drugačija od prethodne.");
      } else if (
        message.includes("expired") ||
        message.includes("invalid") ||
        message.includes("session")
      ) {
        setValidRecovery(false);
        setError("Link za promenu lozinke je istekao ili više nije važeći.");
      } else {
        setError("Promena lozinke nije uspela. Pokušaj ponovo.");
      }
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <>
        <ResetPasswordStyles />
        <main className="resetPage">
          <section className="resetCard resetState">
            <span className="resetLoader" />
            <h1>Proveravamo link...</h1>
            <p>Samo trenutak dok potvrđujemo zahtev za promenu lozinke.</p>
          </section>
        </main>
      </>
    );
  }

  if (success) {
    return (
      <>
        <ResetPasswordStyles />
        <main className="resetPage">
          <section className="resetCard resetState">
            <span className="resetIcon success">
              <Icon name="check" size={26} />
            </span>

            <span className="resetKicker">Lozinka promenjena</span>
            <h1>Sve je spremno.</h1>
            <p>
              Nova lozinka je sačuvana. Sada se prijavi sa novim podacima.
            </p>

            <button
              type="button"
              className="primaryButton"
              onClick={() => navigate("/login", { replace: true })}
            >
              Idi na prijavu
              <Icon name="arrowRight" size={18} />
            </button>
          </section>
        </main>
      </>
    );
  }

  if (!validRecovery) {
    return (
      <>
        <ResetPasswordStyles />
        <main className="resetPage">
          <section className="resetCard resetState">
            <span className="resetIcon error">
              <Icon name="alert" size={25} />
            </span>

            <span className="resetKicker">Nevažeći link</span>
            <h1>Ovaj link više ne važi.</h1>
            <p>
              Link je možda istekao, već je iskorišćen ili nije pravilno
              otvoren. Zatraži novi link za promenu lozinke.
            </p>

            <Link to="/forgot-password" className="primaryButton">
              Pošalji novi link
              <Icon name="arrowRight" size={18} />
            </Link>

            <Link to="/login" className="textLink">
              Nazad na prijavu
            </Link>
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      <ResetPasswordStyles />

      <main className="resetPage">
        <section className="resetCard">
          <Link to="/login" className="backLink">
            <Icon name="arrowLeft" size={17} />
            Nazad na prijavu
          </Link>

          <span className="resetIcon">
            <Icon name="lock" size={24} />
          </span>

          <span className="resetKicker">Nova lozinka</span>
          <h1>Zaštiti svoj nalog.</h1>
          <p className="resetLead">
            Postavi novu lozinku koju ne koristiš na drugim servisima.
          </p>

          <form className="resetForm" onSubmit={handleSubmit}>
            <label>
              <span>Nova lozinka</span>

              <div className="inputWrap">
                <Icon name="lock" size={18} />

                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    if (error) setError("");
                  }}
                  placeholder="Najmanje 8 karaktera"
                  autoComplete="new-password"
                  minLength={8}
                  disabled={loading}
                  required
                />

                <button
                  type="button"
                  className="passwordToggle"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={
                    showPassword ? "Sakrij lozinku" : "Prikaži lozinku"
                  }
                  disabled={loading}
                >
                  <Icon name={showPassword ? "eyeOff" : "eye"} size={18} />
                </button>
              </div>
            </label>

            {password && (
              <div className="strengthRow">
                <div className="strengthBars">
                  {[1, 2, 3].map((item) => (
                    <span
                      key={item}
                      className={item <= strength.level ? "active" : ""}
                    />
                  ))}
                </div>
                <small>Jačina: {strength.label}</small>
              </div>
            )}

            <label>
              <span>Ponovi novu lozinku</span>

              <div className="inputWrap">
                <Icon name="lock" size={18} />

                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value);
                    if (error) setError("");
                  }}
                  placeholder="Ponovi novu lozinku"
                  autoComplete="new-password"
                  minLength={8}
                  disabled={loading}
                  required
                />
              </div>
            </label>

            {error && (
              <div className="resetError" role="alert">
                <Icon name="alert" size={18} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="primaryButton buttonReset"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="buttonLoader" />
                  Čuvanje...
                </>
              ) : (
                <>
                  Sačuvaj novu lozinku
                  <Icon name="arrowRight" size={18} />
                </>
              )}
            </button>
          </form>

          <div className="securityNote">
            <Icon name="shield" size={16} />
            <span>
              Preporuka: koristi jedinstvenu lozinku sa velikim i malim
              slovima, brojevima i specijalnim znakovima.
            </span>
          </div>
        </section>
      </main>
    </>
  );
}

function ResetPasswordStyles() {
  return (
    <style>{`
      *{box-sizing:border-box}
      body{margin:0;background:#f4f5ef}
      button,input{font:inherit}
      button,a{-webkit-tap-highlight-color:transparent}
      .resetPage{
        min-height:100vh;display:grid;place-items:center;padding:32px 20px;
        background:
          radial-gradient(circle at 20% 10%,rgba(164,196,127,.18),transparent 28%),
          radial-gradient(circle at 90% 90%,rgba(35,79,52,.08),transparent 30%),
          #f4f5ef;
        color:#17271f;
        font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif
      }
      .resetCard{
        width:min(560px,100%);padding:34px;border:1px solid rgba(32,57,42,.09);
        border-radius:28px;background:rgba(255,255,255,.89);
        box-shadow:0 24px 70px rgba(24,46,31,.09);backdrop-filter:blur(18px)
      }
      .resetCard a{text-decoration:none}
      .backLink{
        display:inline-flex;align-items:center;gap:7px;margin-bottom:34px;
        color:#6b786f;font-size:12px;font-weight:800;transition:.18s ease
      }
      .backLink:hover{gap:10px;color:#2f4e39}
      .resetIcon{
        display:grid;place-items:center;width:48px;height:48px;margin-bottom:20px;
        border-radius:15px;background:#183b27;color:#d1f49d;
        box-shadow:0 10px 24px rgba(24,59,39,.16)
      }
      .resetIcon.success{background:#edf7df;color:#41692d;box-shadow:none}
      .resetIcon.error{background:#fff0ec;color:#a04a39;box-shadow:none}
      .resetKicker{
        display:block;margin-bottom:10px;color:#739454;font-size:10px;
        font-weight:900;letter-spacing:.14em;text-transform:uppercase
      }
      .resetCard h1{
        margin:0;font-size:clamp(38px,7vw,58px);line-height:.98;letter-spacing:-.065em
      }
      .resetLead,.resetCard>p{
        margin:17px 0 0;color:#718078;font-size:14px;line-height:1.7
      }
      .resetForm{display:grid;gap:17px;margin-top:30px}
      .resetForm label{display:grid;gap:8px}
      .resetForm label>span{font-size:11px;font-weight:850;color:#45544b}
      .inputWrap{
        display:flex;align-items:center;gap:11px;min-height:58px;padding:0 14px 0 16px;
        border:1px solid #d7ded5;border-radius:17px;background:#fff;color:#7b8980;
        transition:.18s ease
      }
      .inputWrap:focus-within{
        border-color:#739454;box-shadow:0 0 0 4px rgba(115,148,84,.11)
      }
      .inputWrap input{
        width:100%;min-width:0;min-height:56px;border:0;outline:0;
        background:transparent;color:#17271f;font-size:13px
      }
      .inputWrap input::placeholder{color:#a0aaa2}
      .passwordToggle{
        display:grid;place-items:center;flex:0 0 auto;width:35px;height:35px;
        border:0;border-radius:10px;background:transparent;color:#6f7c74;cursor:pointer
      }
      .passwordToggle:hover{background:#f1f4ee;color:#2e4b38}
      .strengthRow{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:-7px}
      .strengthBars{display:grid;grid-template-columns:repeat(3,1fr);gap:5px;flex:1}
      .strengthBars span{height:4px;border-radius:999px;background:#e2e8df}
      .strengthBars span.active{background:#7da05b}
      .strengthRow small{color:#718078;font-size:9px;font-weight:800}
      .resetError{
        display:flex;align-items:flex-start;gap:9px;padding:12px 13px;
        border:1px solid #efc9c0;border-radius:13px;background:#fff4f1;
        color:#994637;font-size:11px;font-weight:700;line-height:1.5
      }
      .primaryButton{
        display:flex;align-items:center;justify-content:center;gap:8px;min-height:54px;
        width:100%;border:0;border-radius:16px;background:#183b27;color:#fff;
        font-size:12px;font-weight:900;text-decoration:none;cursor:pointer;
        box-shadow:0 13px 30px rgba(24,59,39,.17);transition:.18s ease
      }
      .primaryButton:hover{transform:translateY(-1px);background:#214d34}
      .primaryButton:disabled{opacity:.62;cursor:not-allowed;transform:none}
      .buttonReset{margin:0}
      .securityNote{
        display:flex;align-items:flex-start;gap:9px;margin-top:22px;padding:13px;
        border-radius:14px;background:#f1f5ed;color:#65746b;font-size:10px;line-height:1.55
      }
      .securityNote svg{flex:0 0 auto;color:#678a4b}
      .resetState{text-align:left}
      .resetState .primaryButton{margin-top:26px}
      .textLink{
        display:block;margin-top:16px;text-align:center;color:#647269;
        font-size:11px;font-weight:850
      }
      .resetLoader{
        display:block;width:30px;height:30px;margin-bottom:20px;
        border:3px solid #dce4da;border-top-color:#31553c;border-radius:50%;
        animation:spin .75s linear infinite
      }
      .buttonLoader{
        width:16px;height:16px;border:2px solid rgba(255,255,255,.35);
        border-top-color:#fff;border-radius:50%;animation:spin .75s linear infinite
      }
      @keyframes spin{to{transform:rotate(360deg)}}
      @media(max-width:600px){
        .resetPage{padding:18px 12px}
        .resetCard{padding:25px 20px;border-radius:22px}
        .backLink{margin-bottom:28px}
      }
    `}</style>
  );
}
