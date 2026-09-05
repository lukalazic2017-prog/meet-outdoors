import React, { useState } from "react";
import { Link } from "react-router-dom";
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
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
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
    lock: (
      <>
        <rect x="4" y="10" width="16" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
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

function translateResetError(message) {
  const normalized = String(message || "").toLowerCase();

  if (normalized.includes("rate limit") || normalized.includes("too many")) {
    return "Poslato je previše zahteva. Sačekaj malo pa pokušaj ponovo.";
  }

  if (normalized.includes("network") || normalized.includes("fetch")) {
    return "Nije moguće povezivanje sa serverom. Proveri internet vezu.";
  }

  if (normalized.includes("email")) {
    return "Proveri da li je email adresa ispravno uneta.";
  }

  return "Trenutno nije moguće poslati link za promenu lozinke. Pokušaj ponovo.";
}

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Unesi email adresu.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const redirectTo = `${window.location.origin}/reset-password`;

      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(normalizedEmail, {
          redirectTo,
        });

      if (resetError) throw resetError;

      setSent(true);
    } catch (err) {
      setError(translateResetError(err?.message));
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <>
        <ForgotPasswordStyles />
        <main className="recoveryPage">
          <section className="recoveryCard successCard">
            <span className="recoveryIcon success">
              <Icon name="check" size={25} />
            </span>

            <span className="recoveryKicker">Proveri email</span>
            <h1>Link je poslat.</h1>

            <p>
              Ako postoji MeetOutdoors nalog povezan sa adresom
              <strong> {email.trim()}</strong>, dobićeš email sa linkom za
              promenu lozinke.
            </p>

            <div className="recoveryNotice">
              <Icon name="shield" size={17} />
              <span>
                Iz bezbednosnih razloga ne potvrđujemo da li određena email
                adresa postoji u sistemu.
              </span>
            </div>

            <button
              type="button"
              className="secondaryButton"
              onClick={() => {
                setSent(false);
                setError("");
              }}
            >
              Pošalji ponovo
            </button>

            <Link to="/login" className="primaryButton">
              Nazad na prijavu
              <Icon name="arrowRight" size={18} />
            </Link>
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      <ForgotPasswordStyles />

      <main className="recoveryPage">
        <section className="recoveryCard">
          <Link to="/login" className="backLink">
            <Icon name="arrowLeft" size={17} />
            Nazad na prijavu
          </Link>

          <span className="recoveryIcon">
            <Icon name="lock" size={24} />
          </span>

          <span className="recoveryKicker">Oporavak naloga</span>
          <h1>Zaboravio si lozinku?</h1>
          <p className="recoveryLead">
            Unesi email adresu svog MeetOutdoors naloga. Poslaćemo ti siguran
            link preko kog možeš da postaviš novu lozinku.
          </p>

          <form className="recoveryForm" onSubmit={handleSubmit}>
            <label>
              <span>Email adresa</span>
              <div className="inputWrap">
                <Icon name="mail" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (error) setError("");
                  }}
                  placeholder="ime@email.com"
                  autoComplete="email"
                  disabled={loading}
                  required
                />
              </div>
            </label>

            {error && (
              <div className="recoveryError" role="alert">
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
                  Slanje...
                </>
              ) : (
                <>
                  Pošalji link za reset
                  <Icon name="arrowRight" size={18} />
                </>
              )}
            </button>
          </form>

          <div className="securityNote">
            <Icon name="shield" size={16} />
            <span>
              Link za promenu lozinke šalje se samo na email adresu povezanu sa
              nalogom.
            </span>
          </div>
        </section>
      </main>
    </>
  );
}

function ForgotPasswordStyles() {
  return (
    <style>{`
      *{box-sizing:border-box}
      body{margin:0;background:#f4f5ef}
      button,input{font:inherit}
      button,a{-webkit-tap-highlight-color:transparent}
      .recoveryPage{
        min-height:100vh;display:grid;place-items:center;padding:32px 20px;
        background:
          radial-gradient(circle at 20% 10%,rgba(164,196,127,.18),transparent 28%),
          radial-gradient(circle at 90% 90%,rgba(35,79,52,.08),transparent 30%),
          #f4f5ef;
        color:#17271f;
        font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif
      }
      .recoveryCard{
        width:min(560px,100%);padding:34px;border:1px solid rgba(32,57,42,.09);
        border-radius:28px;background:rgba(255,255,255,.88);
        box-shadow:0 24px 70px rgba(24,46,31,.09);backdrop-filter:blur(18px)
      }
      .recoveryCard a{text-decoration:none}
      .backLink{
        display:inline-flex;align-items:center;gap:7px;margin-bottom:34px;
        color:#6b786f;font-size:12px;font-weight:800;transition:.18s ease
      }
      .backLink:hover{gap:10px;color:#2f4e39}
      .recoveryIcon{
        display:grid;place-items:center;width:48px;height:48px;margin-bottom:20px;
        border-radius:15px;background:#183b27;color:#d1f49d;
        box-shadow:0 10px 24px rgba(24,59,39,.16)
      }
      .recoveryIcon.success{background:#edf7df;color:#41692d;box-shadow:none}
      .recoveryKicker{
        display:block;margin-bottom:10px;color:#739454;font-size:10px;
        font-weight:900;letter-spacing:.14em;text-transform:uppercase
      }
      .recoveryCard h1{
        margin:0;font-size:clamp(38px,7vw,58px);line-height:.98;
        letter-spacing:-.065em
      }
      .recoveryLead,.recoveryCard>p{
        margin:17px 0 0;color:#718078;font-size:14px;line-height:1.7
      }
      .recoveryCard>p strong{color:#263b2f}
      .recoveryForm{display:grid;gap:18px;margin-top:30px}
      .recoveryForm label{display:grid;gap:8px}
      .recoveryForm label>span{font-size:11px;font-weight:850;color:#45544b}
      .inputWrap{
        display:flex;align-items:center;gap:11px;min-height:58px;padding:0 16px;
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
      .recoveryError{
        display:flex;align-items:flex-start;gap:9px;padding:12px 13px;
        border:1px solid #efc9c0;border-radius:13px;background:#fff4f1;
        color:#994637;font-size:11px;font-weight:700;line-height:1.5
      }
      .primaryButton,.secondaryButton{
        display:flex;align-items:center;justify-content:center;gap:8px;min-height:54px;
        width:100%;border-radius:16px;font-size:12px;font-weight:900;cursor:pointer;
        transition:.18s ease
      }
      .primaryButton{
        border:0;background:#183b27;color:#fff;text-decoration:none;
        box-shadow:0 13px 30px rgba(24,59,39,.17)
      }
      .primaryButton:hover{transform:translateY(-1px);background:#214d34}
      .primaryButton:disabled{opacity:.62;cursor:not-allowed;transform:none}
      .buttonReset{margin:0}
      .secondaryButton{
        margin-top:26px;border:1px solid #d9e0d8;background:#fff;color:#385042
      }
      .successCard{text-align:left}
      .successCard .primaryButton{margin-top:10px}
      .recoveryNotice,.securityNote{
        display:flex;align-items:flex-start;gap:9px;margin-top:22px;padding:13px;
        border-radius:14px;background:#f1f5ed;color:#65746b;font-size:10px;line-height:1.55
      }
      .recoveryNotice svg,.securityNote svg{flex:0 0 auto;color:#678a4b}
      .buttonLoader{
        width:16px;height:16px;border:2px solid rgba(255,255,255,.35);
        border-top-color:#fff;border-radius:50%;animation:spin .75s linear infinite
      }
      @keyframes spin{to{transform:rotate(360deg)}}
      @media(max-width:600px){
        .recoveryPage{padding:18px 12px}
        .recoveryCard{padding:25px 20px;border-radius:22px}
        .backLink{margin-bottom:28px}
      }
    `}</style>
  );
}
