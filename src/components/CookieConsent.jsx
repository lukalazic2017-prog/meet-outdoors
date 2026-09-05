import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const STORAGE_KEY = "meetoutdoors_cookie_consent";
const CONSENT_VERSION = "1.0";

const DEFAULT_PREFERENCES = {
  necessary: true,
  analytics: false,
  marketing: false,
};

function readStoredConsent() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);

    if (!parsed || parsed.version !== CONSENT_VERSION) {
      return null;
    }

    return {
      version: CONSENT_VERSION,
      updatedAt: parsed.updatedAt || null,
      preferences: {
        ...DEFAULT_PREFERENCES,
        ...(parsed.preferences || {}),
        necessary: true,
      },
    };
  } catch {
    return null;
  }
}

function saveConsent(preferences) {
  const payload = {
    version: CONSENT_VERSION,
    updatedAt: new Date().toISOString(),
    preferences: {
      ...DEFAULT_PREFERENCES,
      ...preferences,
      necessary: true,
    },
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));

  window.dispatchEvent(
    new CustomEvent("meetoutdoors:cookie-consent", {
      detail: payload,
    })
  );

  return payload;
}

export function getCookieConsent() {
  if (typeof window === "undefined") return null;
  return readStoredConsent();
}

export function hasAnalyticsConsent() {
  return Boolean(getCookieConsent()?.preferences?.analytics);
}

export function hasMarketingConsent() {
  return Boolean(getCookieConsent()?.preferences?.marketing);
}

export function openCookieSettings() {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent("meetoutdoors:open-cookie-settings")
  );
}

function Toggle({ checked, disabled, onChange, label }) {
  return (
    <button
      type="button"
      className={`cookieToggle ${checked ? "active" : ""}`}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
    >
      <span />
    </button>
  );
}

export default function CookieConsent() {
  const initialConsent = useMemo(
    () => (typeof window !== "undefined" ? readStoredConsent() : null),
    []
  );

  const [visible, setVisible] = useState(!initialConsent);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [preferences, setPreferences] = useState(
    initialConsent?.preferences || DEFAULT_PREFERENCES
  );

  useEffect(() => {
    function handleOpenSettings() {
      const stored = readStoredConsent();

      setPreferences(
        stored?.preferences || {
          ...DEFAULT_PREFERENCES,
        }
      );

      setVisible(true);
      setSettingsOpen(true);
    }

    window.addEventListener(
      "meetoutdoors:open-cookie-settings",
      handleOpenSettings
    );

    return () => {
      window.removeEventListener(
        "meetoutdoors:open-cookie-settings",
        handleOpenSettings
      );
    };
  }, []);

  function acceptAll() {
    saveConsent({
      necessary: true,
      analytics: true,
      marketing: true,
    });

    setVisible(false);
    setSettingsOpen(false);
  }

  function rejectOptional() {
    saveConsent({
      necessary: true,
      analytics: false,
      marketing: false,
    });

    setVisible(false);
    setSettingsOpen(false);
  }

  function savePreferences() {
    saveConsent(preferences);
    setVisible(false);
    setSettingsOpen(false);
  }

  if (!visible) return null;

  return (
    <>
      <CookieConsentStyles />

      <div
        className="cookieBackdrop"
        aria-hidden={settingsOpen ? "false" : "true"}
      />

      <section
        className={`cookiePanel ${settingsOpen ? "settingsMode" : ""}`}
        aria-label="Podešavanja kolačića"
      >
        {!settingsOpen ? (
          <>
            <div className="cookieHeader">
              <span className="cookieIcon">🍪</span>

              <div>
                <span className="cookieKicker">Privatnost</span>
                <h2>Tvoj izbor. Tvoja privatnost.</h2>
              </div>
            </div>

            <p className="cookieIntro">
              MeetOutdoors koristi neophodne tehnologije za prijavu,
              bezbednost i rad platforme. Analitičke i marketinške tehnologije
              koristimo samo ako ih ti dozvoliš.
            </p>

            <p className="cookieLegalText">
              Više informacija možeš pronaći u našoj{" "}
              <Link to="/cookies">Cookie Policy</Link> i{" "}
              <Link to="/privacy">Privacy Policy</Link>.
            </p>

            <div className="cookieActions">
              <button
                type="button"
                className="cookiePrimary"
                onClick={acceptAll}
              >
                Prihvati sve
              </button>

              <button
                type="button"
                className="cookieSecondary"
                onClick={rejectOptional}
              >
                Odbij neobavezne
              </button>

              <button
                type="button"
                className="cookieTextButton"
                onClick={() => setSettingsOpen(true)}
              >
                Podesi izbor
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="cookieHeader settingsHeader">
              <div>
                <span className="cookieKicker">Cookie podešavanja</span>
                <h2>Izaberi šta dozvoljavaš.</h2>
              </div>
            </div>

            <p className="cookieIntro">
              Neophodne tehnologije su uvek aktivne jer bez njih ključne
              funkcije platforme ne mogu pravilno da rade.
            </p>

            <div className="cookieCategories">
              <article>
                <div className="cookieCategoryMain">
                  <div>
                    <strong>Neophodni</strong>
                    <span>Uvek aktivni</span>
                  </div>

                  <Toggle
                    checked
                    disabled
                    label="Neophodni kolačići"
                  />
                </div>

                <p>
                  Autentifikacija, bezbednost, čuvanje tvoje cookie odluke i
                  osnovno funkcionisanje MeetOutdoors-a.
                </p>
              </article>

              <article>
                <div className="cookieCategoryMain">
                  <div>
                    <strong>Analitika</strong>
                    <span>Opciono</span>
                  </div>

                  <Toggle
                    checked={preferences.analytics}
                    onChange={(value) =>
                      setPreferences((current) => ({
                        ...current,
                        analytics: value,
                      }))
                    }
                    label="Analitički kolačići"
                  />
                </div>

                <p>
                  Pomažu nam da razumemo kako se platforma koristi i koje
                  delove treba unaprediti.
                </p>
              </article>

              <article>
                <div className="cookieCategoryMain">
                  <div>
                    <strong>Marketing</strong>
                    <span>Opciono</span>
                  </div>

                  <Toggle
                    checked={preferences.marketing}
                    onChange={(value) =>
                      setPreferences((current) => ({
                        ...current,
                        marketing: value,
                      }))
                    }
                    label="Marketinški kolačići"
                  />
                </div>

                <p>
                  Koriste se za merenje kampanja i personalizaciju oglasa ako
                  jednog dana uključimo takve servise.
                </p>
              </article>
            </div>

            <div className="cookieActions settingsActions">
              <button
                type="button"
                className="cookiePrimary"
                onClick={savePreferences}
              >
                Sačuvaj izbor
              </button>

              <button
                type="button"
                className="cookieSecondary"
                onClick={rejectOptional}
              >
                Odbij neobavezne
              </button>

              <button
                type="button"
                className="cookieTextButton"
                onClick={acceptAll}
              >
                Prihvati sve
              </button>
            </div>

            <p className="cookieSettingsFooter">
              Izbor možeš promeniti u bilo kom trenutku preko „Cookie
              podešavanja“ linka na platformi.
            </p>
          </>
        )}
      </section>
    </>
  );
}

function CookieConsentStyles() {
  return (
    <style>{`
      .cookieBackdrop{
        position:fixed;
        inset:0;
        z-index:9997;
        background:rgba(8,18,12,.18);
        backdrop-filter:blur(2px);
        pointer-events:none;
      }

      .cookiePanel{
        position:fixed;
        left:24px;
        right:24px;
        bottom:24px;
        z-index:9998;
        width:min(760px,calc(100vw - 48px));
        margin:0 auto;
        padding:24px;
        border:1px solid rgba(37,63,46,.12);
        border-radius:24px;
        background:rgba(255,255,255,.97);
        color:#17271f;
        box-shadow:0 28px 80px rgba(18,45,29,.18);
        font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
        backdrop-filter:blur(18px);
      }

      .cookiePanel a{
        color:#355e3f;
        font-weight:850;
        text-decoration:underline;
        text-underline-offset:2px;
      }

      .cookieHeader{
        display:flex;
        align-items:center;
        gap:14px;
      }

      .cookieIcon{
        display:grid;
        place-items:center;
        width:46px;
        height:46px;
        flex:0 0 auto;
        border-radius:14px;
        background:#eff4e9;
        font-size:22px;
      }

      .cookieKicker{
        display:block;
        margin-bottom:5px;
        color:#729553;
        font-size:9px;
        font-weight:950;
        letter-spacing:.13em;
        text-transform:uppercase;
      }

      .cookieHeader h2{
        margin:0;
        font-size:24px;
        line-height:1.05;
        letter-spacing:-.045em;
      }

      .cookieIntro{
        margin:16px 0 0;
        color:#69776e;
        font-size:12px;
        line-height:1.65;
      }

      .cookieLegalText{
        margin:10px 0 0;
        color:#879189;
        font-size:10px;
        line-height:1.55;
      }

      .cookieActions{
        display:grid;
        grid-template-columns:1.1fr 1.1fr .8fr;
        gap:9px;
        margin-top:20px;
      }

      .cookieActions button{
        min-height:48px;
        padding:0 16px;
        border-radius:14px;
        cursor:pointer;
        font-size:10px;
        font-weight:900;
        transition:.18s ease;
      }

      .cookiePrimary{
        border:1px solid #193b27;
        background:#193b27;
        color:white;
      }

      .cookiePrimary:hover{
        background:#214d34;
        transform:translateY(-1px);
      }

      .cookieSecondary{
        border:1px solid #ccd7cb;
        background:white;
        color:#30483a;
      }

      .cookieSecondary:hover{
        border-color:#9aab98;
        background:#f8faf6;
      }

      .cookieTextButton{
        border:0;
        background:transparent;
        color:#557060;
      }

      .cookieTextButton:hover{
        background:#f2f5ef;
      }

      .settingsMode{
        width:min(720px,calc(100vw - 48px));
        max-height:min(82vh,760px);
        overflow:auto;
      }

      .settingsHeader{
        align-items:flex-start;
      }

      .cookieCategories{
        display:grid;
        gap:10px;
        margin-top:20px;
      }

      .cookieCategories article{
        padding:15px;
        border:1px solid #dce3da;
        border-radius:16px;
        background:#fafbf8;
      }

      .cookieCategoryMain{
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:18px;
      }

      .cookieCategoryMain strong{
        display:block;
        color:#263a2e;
        font-size:12px;
      }

      .cookieCategoryMain span{
        display:block;
        margin-top:3px;
        color:#8a958e;
        font-size:9px;
        font-weight:750;
      }

      .cookieCategories article>p{
        margin:9px 0 0;
        max-width:590px;
        color:#77847b;
        font-size:10px;
        line-height:1.55;
      }

      .cookieToggle{
        position:relative;
        width:44px;
        height:25px;
        flex:0 0 auto;
        padding:0;
        border:0;
        border-radius:999px;
        background:#ccd4cb;
        cursor:pointer;
        transition:.18s ease;
      }

      .cookieToggle>span{
        position:absolute;
        top:3px;
        left:3px;
        width:19px;
        height:19px;
        border-radius:50%;
        background:white;
        box-shadow:0 2px 8px rgba(0,0,0,.12);
        transition:.18s ease;
      }

      .cookieToggle.active{
        background:#6f9350;
      }

      .cookieToggle.active>span{
        transform:translateX(19px);
      }

      .cookieToggle:disabled{
        cursor:not-allowed;
        opacity:.75;
      }

      .cookieSettingsFooter{
        margin:13px 0 0;
        color:#909990;
        font-size:9px;
        text-align:center;
      }

      @media(max-width:650px){
        .cookiePanel{
          left:10px;
          right:10px;
          bottom:10px;
          width:calc(100vw - 20px);
          padding:19px;
          border-radius:20px;
        }

        .cookieActions{
          grid-template-columns:1fr;
        }

        .cookieActions button{
          min-height:46px;
        }

        .cookieHeader h2{
          font-size:21px;
        }

        .settingsMode{
          width:calc(100vw - 20px);
          max-height:88vh;
        }
      }

      @media(prefers-reduced-motion:reduce){
        .cookiePanel *,
        .cookiePanel *::before,
        .cookiePanel *::after{
          transition:none!important;
        }
      }
    `}</style>
  );
}
