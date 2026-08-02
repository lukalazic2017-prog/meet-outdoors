import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

function Icon({
  name,
  size = 20,
  strokeWidth = 2,
  fill = "none",
  className = "",
}) {
  const icons = {
    arrowRight: (
      <>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </>
    ),

    arrowLeft: (
      <>
        <path d="M19 12H5" />
        <path d="m11 18-6-6 6-6" />
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

    compass: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" />
      </>
    ),

    shield: (
      <>
        <path d="M12 3 5 6v5c0 4.6 2.9 8.4 7 10 4.1-1.6 7-5.4 7-10V6l-7-3Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),

    users: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20v-2a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v2" />
        <path d="M16 4.5a3 3 0 0 1 0 6" />
        <path d="M17 13a5 5 0 0 1 4 5v2" />
      </>
    ),

    sparkles: (
      <>
        <path d="m12 3 1.1 3.4L16.5 8l-3.4 1.6L12 13l-1.1-3.4L7.5 8l3.4-1.6L12 3Z" />
        <path d="m19 14 .7 2.1L22 17l-2.3.9L19 20l-.7-2.1L16 17l2.3-.9L19 14Z" />
      </>
    ),

    alert: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5" />
        <path d="M12 16h.01" />
      </>
    ),

    check: <path d="m5 12 4 4L19 6" />,
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {icons[name]}
    </svg>
  );
}

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function translateAuthError(message) {
    if (!message) {
      return "Došlo je do greške prilikom prijavljivanja.";
    }

    const normalizedMessage = message.toLowerCase();

    if (normalizedMessage.includes("invalid login credentials")) {
      return "Email adresa ili lozinka nisu ispravni.";
    }

    if (normalizedMessage.includes("email not confirmed")) {
      return "Potvrdi svoju email adresu pre prijavljivanja.";
    }

    if (normalizedMessage.includes("too many requests")) {
      return "Previše pokušaja prijavljivanja. Pokušaj ponovo malo kasnije.";
    }

    if (normalizedMessage.includes("network")) {
      return "Nije moguće povezivanje sa serverom. Proveri internet vezu.";
    }

    return message;
  }

  async function handleLogin(event) {
    event.preventDefault();

    if (!email.trim() || !password) {
      setError("Unesi email adresu i lozinku.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (loginError) {
        throw loginError;
      }

      const userId = data.user?.id;

      if (!userId) {
        throw new Error("Korisnički nalog nije pronađen.");
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, username")
        .eq("id", userId)
        .single();

      if (profileError) {
        throw profileError;
      }

      if (!profile) {
        throw new Error("Profil korisnika nije pronađen.");
      }

      if (!profile.username) {
        navigate("/profile");
        return;
      }

      if (profile.role === "host") {
        navigate(`/h/${profile.username}`);
      } else {
        navigate(`/u/${profile.username}`);
      }
    } catch (err) {
      setError(translateAuthError(err.message));
    } finally {
      setLoading(false);
    }
  }

  function handleEmailChange(event) {
    setEmail(event.target.value);

    if (error) {
      setError("");
    }
  }

  function handlePasswordChange(event) {
    setPassword(event.target.value);

    if (error) {
      setError("");
    }
  }

  return (
    <>
      <LoginStyles />

      <main className="loginPage">
        <section className="loginVisual">
          <div className="loginVisualBackground" />
          <div className="loginVisualOverlay" />

        

          <div className="visualContent">
            <span className="visualKicker">
              <span />
              Dobrodošao nazad
            </span>

            <h1>
              Avantura se nastavlja tamo gde si stao.
            </h1>

            <p>
              Prijavi se, pronađi sledeći događaj ili nastavi da razvijaš
              svoju outdoor zajednicu.
            </p>

            <div className="visualBenefits">
              <article>
                <span>
                  <Icon name="sparkles" size={17} />
                </span>

                <div>
                  <strong>Personalizovane avanture</strong>
                  <small>
                    Događaji i iskustva prilagođeni tvojim interesovanjima.
                  </small>
                </div>
              </article>

              <article>
                <span>
                  <Icon name="users" size={17} />
                </span>

                <div>
                  <strong>Zajednica pravih ljudi</strong>
                  <small>
                    Upoznaj avanturiste i domaćine koji dele tvoju energiju.
                  </small>
                </div>
              </article>

              <article>
                <span>
                  <Icon name="shield" size={17} />
                </span>

                <div>
                  <strong>Sigurno i jednostavno</strong>
                  <small>
                    Svi događaji, rezervacije i profili na jednom mestu.
                  </small>
                </div>
              </article>
            </div>
          </div>

          <div className="visualFooter">
            <span>Prave avanture.</span>
            <span>Pravi ljudi.</span>
          </div>
        </section>

        <section className="loginFormSection">
          <div className="loginFormContainer">
            <Link to="/" className="backLink">
              <Icon name="arrowLeft" size={17} />
              Nazad na početnu
            </Link>

            <div className="formHeader">
              <span className="formKicker">Prijava</span>

              <h2>Dobrodošao nazad.</h2>

              <p>
                Unesi podatke svog MeetOutdoors naloga i nastavi svoju
                avanturu.
              </p>
            </div>

            <form className="loginForm" onSubmit={handleLogin}>
              <label className="inputGroup">
                <span>Email adresa</span>

                <div className="inputWrapper">
                  <Icon name="mail" size={19} />

                  <input
                    required
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    placeholder="ime@email.com"
                    autoComplete="email"
                    disabled={loading}
                  />
                </div>
              </label>

              <label className="inputGroup">
                <span>Lozinka</span>

                <div className="inputWrapper">
                  <Icon name="lock" size={19} />

                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={handlePasswordChange}
                    placeholder="Unesi svoju lozinku"
                    autoComplete="current-password"
                    disabled={loading}
                  />

                  <button
                    type="button"
                    className="passwordToggle"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={
                      showPassword
                        ? "Sakrij lozinku"
                        : "Prikaži lozinku"
                    }
                    disabled={loading}
                  >
                    <Icon
                      name={showPassword ? "eyeOff" : "eye"}
                      size={18}
                    />
                  </button>
                </div>
              </label>

              <div className="loginOptions">
                <label className="rememberOption">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) =>
                      setRememberMe(event.target.checked)
                    }
                  />

                  <span className="customCheckbox">
                    {rememberMe && <Icon name="check" size={13} />}
                  </span>

                  Zapamti me
                </label>

                <Link to="/forgot-password" className="forgotLink">
                  Zaboravljena lozinka?
                </Link>
              </div>

              {error && (
                <div className="loginError" role="alert">
                  <span>
                    <Icon name="alert" size={18} />
                  </span>

                  <p>{error}</p>
                </div>
              )}

              <button
                className="loginButton"
                disabled={loading}
                type="submit"
              >
                {loading ? (
                  <>
                    <span className="buttonLoader" />
                    Prijavljivanje...
                  </>
                ) : (
                  <>
                    Prijavi se
                    <Icon name="arrowRight" size={19} />
                  </>
                )}
              </button>
            </form>

            <div className="divider">
              <span />
              <p>Nemaš nalog?</p>
              <span />
            </div>

            <Link to="/signup" className="signupButton">
              Kreiraj novi nalog
              <Icon name="arrowRight" size={18} />
            </Link>

            <div className="accountTypes">
              <article>
                <span>
                  <Icon name="users" size={18} />
                </span>

                <div>
                  <strong>Korisnik</strong>
                  <small>Pronađi i rezerviši avanture.</small>
                </div>
              </article>

              <article>
                <span>
                  <Icon name="sparkles" size={18} />
                </span>

                <div>
                  <strong>Domaćin</strong>
                  <small>Kreiraj događaje i iskustva.</small>
                </div>
              </article>
            </div>

            <p className="securityNotice">
              <Icon name="shield" size={15} />
              Tvoji podaci su zaštićeni i nikada ih ne delimo bez tvoje
              dozvole.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}

function LoginStyles() {
  return (
    <style>{`
      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        background: #f4f5ef;
      }

      button,
      input {
        font: inherit;
      }

      button,
      a {
        -webkit-tap-highlight-color: transparent;
      }

      .loginPage {
        min-height: 100vh;
        display: grid;
        grid-template-columns:
          minmax(440px, 0.95fr)
          minmax(540px, 1.05fr);
        background:
          radial-gradient(
            circle at 85% 10%,
            rgba(173, 205, 138, 0.13),
            transparent 26%
          ),
          #f4f5ef;
        color: #17271f;
        font-family:
          Inter,
          ui-sans-serif,
          system-ui,
          -apple-system,
          BlinkMacSystemFont,
          "Segoe UI",
          sans-serif;
      }

      .loginPage a {
        color: inherit;
        text-decoration: none;
      }

      .loginVisual {
        position: relative;
        isolation: isolate;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        padding: 42px;
        overflow: hidden;
        color: white;
      }

      .loginVisualBackground,
      .loginVisualOverlay {
        position: absolute;
        inset: 0;
      }

      .loginVisualBackground {
        z-index: -3;
        background:
          url("https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1900&q=92")
          center / cover;
        transition: transform 8s ease;
      }

      .loginVisual:hover .loginVisualBackground {
        transform: scale(1.035);
      }

      .loginVisualOverlay {
        z-index: -2;
        background:
          linear-gradient(
            180deg,
            rgba(5, 15, 9, 0.36),
            rgba(5, 16, 10, 0.69) 56%,
            rgba(4, 13, 8, 0.96)
          ),
          linear-gradient(
            90deg,
            rgba(4, 15, 8, 0.57),
            transparent 72%
          );
      }

      .loginVisual::after {
        position: absolute;
        inset: auto -150px -190px auto;
        z-index: -1;
        width: 420px;
        height: 420px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 50%;
        content: "";
        box-shadow:
          0 0 0 70px rgba(255, 255, 255, 0.025),
          0 0 0 140px rgba(255, 255, 255, 0.018);
      }

      .loginLogo {
        display: inline-flex;
        align-items: center;
        gap: 11px;
        align-self: flex-start;
        font-size: 17px;
        font-weight: 900;
        letter-spacing: -0.035em;
      }

      .loginLogo > span {
        display: grid;
        place-items: center;
        width: 44px;
        height: 44px;
        border: 1px solid rgba(255, 255, 255, 0.22);
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.1);
        color: #c9f28c;
        backdrop-filter: blur(14px);
      }

      .visualContent {
        max-width: 660px;
        margin-top: auto;
        padding: 90px 0 55px;
      }

      .visualKicker {
        display: inline-flex;
        align-items: center;
        gap: 9px;
        padding: 9px 13px;
        border: 1px solid rgba(255, 255, 255, 0.18);
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.08);
        color: rgba(255, 255, 255, 0.82);
        font-size: 11px;
        font-weight: 850;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        backdrop-filter: blur(12px);
      }

      .visualKicker > span {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #c9f28c;
        box-shadow: 0 0 0 5px rgba(201, 242, 140, 0.12);
      }

      .visualContent h1 {
        max-width: 700px;
        margin: 24px 0 0;
        font-size: clamp(54px, 5.7vw, 86px);
        line-height: 0.96;
        letter-spacing: -0.075em;
      }

      .visualContent > p {
        max-width: 570px;
        margin: 25px 0 0;
        color: rgba(255, 255, 255, 0.68);
        font-size: 16px;
        line-height: 1.75;
      }

      .visualBenefits {
        display: grid;
        gap: 13px;
        margin-top: 36px;
      }

      .visualBenefits article {
        display: flex;
        align-items: center;
        gap: 14px;
      }

      .visualBenefits article > span {
        display: grid;
        place-items: center;
        flex: 0 0 auto;
        width: 37px;
        height: 37px;
        border: 1px solid rgba(255, 255, 255, 0.16);
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.09);
        color: #c9f28c;
        backdrop-filter: blur(10px);
      }

      .visualBenefits strong,
      .visualBenefits small {
        display: block;
      }

      .visualBenefits strong {
        font-size: 13px;
      }

      .visualBenefits small {
        margin-top: 3px;
        color: rgba(255, 255, 255, 0.5);
        font-size: 11px;
      }

      .visualFooter {
        display: flex;
        justify-content: space-between;
        gap: 20px;
        padding-top: 24px;
        border-top: 1px solid rgba(255, 255, 255, 0.13);
        color: rgba(255, 255, 255, 0.43);
        font-size: 10px;
        font-weight: 850;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }

      .loginFormSection {
        display: grid;
        place-items: center;
        min-width: 0;
        padding: 60px 34px;
      }

      .loginFormContainer {
        width: min(540px, 100%);
      }

      .backLink {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        margin-bottom: 55px;
        color: #6f7d74;
        font-size: 11px;
        font-weight: 800;
        transition: 0.18s ease;
      }

      .backLink:hover {
        gap: 11px;
        color: #274331;
      }

      .formHeader {
        margin-bottom: 30px;
      }

      .formKicker {
        display: block;
        margin-bottom: 12px;
        color: #719052;
        font-size: 11px;
        font-weight: 900;
        letter-spacing: 0.13em;
        text-transform: uppercase;
      }

      .formHeader h2 {
        margin: 0;
        font-size: clamp(42px, 5vw, 61px);
        line-height: 1;
        letter-spacing: -0.065em;
      }

      .formHeader p {
        max-width: 490px;
        margin: 16px 0 0;
        color: #77837b;
        font-size: 14px;
        line-height: 1.65;
      }

      .loginForm {
        display: grid;
        gap: 18px;
      }

      .inputGroup {
        display: grid;
        gap: 8px;
      }

      .inputGroup > span {
        color: #45544b;
        font-size: 11px;
        font-weight: 850;
      }

      .inputWrapper {
        display: flex;
        align-items: center;
        gap: 12px;
        min-height: 58px;
        padding: 0 16px;
        border: 1px solid #d7ded5;
        border-radius: 17px;
        background: rgba(255, 255, 255, 0.78);
        color: #7d8981;
        box-shadow: 0 8px 24px rgba(37, 55, 44, 0.035);
        transition: 0.18s ease;
      }

      .inputWrapper:focus-within {
        border-color: #759552;
        background: white;
        box-shadow:
          0 0 0 4px rgba(117, 149, 82, 0.11),
          0 12px 30px rgba(37, 55, 44, 0.055);
      }

      .inputWrapper input {
        width: 100%;
        min-width: 0;
        min-height: 56px;
        border: 0;
        outline: 0;
        background: transparent;
        color: #17271f;
        font-size: 13px;
      }

      .inputWrapper input::placeholder {
        color: #a0aaa2;
      }

      .inputWrapper input:disabled {
        cursor: not-allowed;
      }

      .passwordToggle {
        display: grid;
        place-items: center;
        flex: 0 0 auto;
        width: 35px;
        height: 35px;
        padding: 0;
        border: 0;
        border-radius: 10px;
        background: transparent;
        color: #7b877f;
        cursor: pointer;
        transition: 0.17s ease;
      }

      .passwordToggle:hover:not(:disabled) {
        background: #edf1eb;
        color: #294333;
      }

      .passwordToggle:disabled {
        cursor: not-allowed;
      }

      .loginOptions {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 15px;
        margin-top: -2px;
      }

      .rememberOption {
        display: inline-flex;
        align-items: center;
        gap: 9px;
        color: #647168;
        cursor: pointer;
        font-size: 11px;
        font-weight: 700;
      }

      .rememberOption input {
        position: absolute;
        width: 1px;
        height: 1px;
        opacity: 0;
        pointer-events: none;
      }

      .customCheckbox {
        display: grid;
        place-items: center;
        width: 20px;
        height: 20px;
        border: 1px solid #cdd6ca;
        border-radius: 6px;
        background: white;
        color: #183a27;
      }

      .rememberOption input:checked + .customCheckbox {
        border-color: #c9f28c;
        background: #c9f28c;
      }

      .forgotLink {
        color: #3e5c46 !important;
        font-size: 11px;
        font-weight: 850;
      }

      .forgotLink:hover {
        text-decoration: underline;
      }

      .loginError {
        display: flex;
        align-items: flex-start;
        gap: 11px;
        padding: 15px;
        border: 1px solid #efc9c3;
        border-radius: 16px;
        background: #fff1ef;
        color: #963d33;
      }

      .loginError > span {
        display: grid;
        place-items: center;
        flex: 0 0 auto;
        width: 30px;
        height: 30px;
        border-radius: 10px;
        background: #f8d9d5;
      }

      .loginError p {
        margin: 5px 0 0;
        font-size: 12px;
        line-height: 1.5;
      }

      .loginButton {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 11px;
        width: 100%;
        min-height: 61px;
        margin-top: 3px;
        padding: 0 23px;
        border: 0;
        border-radius: 17px;
        background: #183a27;
        color: white;
        cursor: pointer;
        font-size: 13px;
        font-weight: 900;
        box-shadow: 0 17px 38px rgba(24, 58, 39, 0.2);
        transition: 0.2s ease;
      }

      .loginButton:hover:not(:disabled) {
        gap: 17px;
        background: #214c34;
        transform: translateY(-2px);
      }

      .loginButton:disabled {
        cursor: not-allowed;
        opacity: 0.7;
      }

      .buttonLoader {
        width: 19px;
        height: 19px;
        border: 2px solid rgba(255, 255, 255, 0.28);
        border-top-color: white;
        border-radius: 50%;
        animation: loginSpin 0.8s linear infinite;
      }

      @keyframes loginSpin {
        to {
          transform: rotate(360deg);
        }
      }

      .divider {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        align-items: center;
        gap: 12px;
        margin: 29px 0 20px;
      }

      .divider span {
        height: 1px;
        background: #dce2da;
      }

      .divider p {
        margin: 0;
        color: #8c968f;
        font-size: 10px;
        font-weight: 700;
      }

      .signupButton {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 9px;
        min-height: 56px;
        padding: 0 20px;
        border: 1px solid #ccd6c9;
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.6);
        color: #294333 !important;
        font-size: 12px;
        font-weight: 900;
        transition: 0.19s ease;
      }

      .signupButton:hover {
        gap: 14px;
        border-color: #8fa483;
        background: white;
        transform: translateY(-2px);
      }

      .accountTypes {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 11px;
        margin-top: 17px;
      }

      .accountTypes article {
        display: flex;
        align-items: center;
        gap: 11px;
        padding: 14px;
        border: 1px solid #dfe4dd;
        border-radius: 15px;
        background: rgba(255, 255, 255, 0.48);
      }

      .accountTypes article > span {
        display: grid;
        place-items: center;
        flex: 0 0 auto;
        width: 37px;
        height: 37px;
        border-radius: 11px;
        background: #e8f1dd;
        color: #57723e;
      }

      .accountTypes strong,
      .accountTypes small {
        display: block;
      }

      .accountTypes strong {
        color: #34463b;
        font-size: 11px;
      }

      .accountTypes small {
        margin-top: 3px;
        color: #879189;
        font-size: 9px;
        line-height: 1.4;
      }

      .securityNotice {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        max-width: 470px;
        margin: 25px auto 0;
        color: #8b958e;
        font-size: 9px;
        line-height: 1.5;
        text-align: center;
      }

      .securityNotice svg {
        flex: 0 0 auto;
        color: #6f8f51;
      }

      @media (max-width: 1030px) {
        .loginPage {
          grid-template-columns: 410px minmax(0, 1fr);
        }

        .loginVisual {
          padding: 32px;
        }

        .visualContent h1 {
          font-size: 60px;
        }

        .loginFormSection {
          padding-inline: 26px;
        }
      }

      @media (max-width: 820px) {
        .loginPage {
          display: block;
        }

        .loginVisual {
          min-height: 620px;
          padding: 28px;
        }

        .visualContent {
          max-width: 670px;
          padding-top: 150px;
        }

        .visualContent h1 {
          font-size: clamp(52px, 10vw, 73px);
        }

        .visualBenefits {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .visualBenefits article {
          align-items: flex-start;
        }

        .loginFormSection {
          padding: 65px 24px 90px;
        }

        .loginFormContainer {
          width: min(600px, 100%);
        }

        .backLink {
          margin-bottom: 38px;
        }
      }

      @media (max-width: 620px) {
        .loginVisual {
          min-height: 610px;
        }

        .visualContent {
          padding-bottom: 32px;
        }

        .visualContent h1 {
          font-size: 49px;
        }

        .visualContent > p {
          font-size: 14px;
        }

        .visualBenefits {
          grid-template-columns: 1fr;
        }

        .visualFooter {
          display: none;
        }

        .formHeader h2 {
          font-size: 43px;
        }
      }

      @media (max-width: 430px) {
        .loginVisual {
          min-height: 570px;
          padding: 22px;
        }

        .loginLogo {
          font-size: 15px;
        }

        .visualContent h1 {
          font-size: 42px;
        }

        .loginFormSection {
          padding: 52px 16px 75px;
        }

        .formHeader h2 {
          font-size: 38px;
        }

        .loginOptions {
          align-items: flex-start;
          flex-direction: column;
        }

        .accountTypes {
          grid-template-columns: 1fr;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        *,
        *::before,
        *::after {
          animation: none !important;
          scroll-behavior: auto !important;
          transition: none !important;
        }
      }
    `}</style>
  );
}