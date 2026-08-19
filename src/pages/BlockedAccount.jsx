import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Icon({ name, size = 20, strokeWidth = 2 }) {
  const icons = {
    shield: (
      <>
        <path d="M12 3 5 6v5c0 4.6 2.9 8.4 7 10 4.1-1.6 7-5.4 7-10V6l-7-3Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    alert: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5M12 16h.01" />
      </>
    ),
    logout: (
      <>
        <path d="M10 17l5-5-5-5" />
        <path d="M15 12H3" />
        <path d="M21 19V5a2 2 0 0 0-2-2h-6" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
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

function formatDate(value) {
  if (!value) return "";

  return new Intl.DateTimeFormat("sr-Latn-RS", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function BlockedAccount() {
  const {
    profile,
    loading,
    accountStatus,
    isBanned,
    isSuspended,
    logout,
  } = useAuth();

  if (loading) {
    return (
      <>
        <BlockedAccountStyles />

        <main className="blockedAccountPage">
          <div className="blockedAccountLoading">
            <span />
            <strong>Proveravamo status naloga...</strong>
          </div>
        </main>
      </>
    );
  }

  if (
    !profile ||
    (!isBanned && !isSuspended)
  ) {
    return <Navigate to="/" replace />;
  }

  const title = isBanned
    ? "Nalog je blokiran"
    : "Nalog je privremeno suspendovan";

  const description = isBanned
    ? "Pristup MeetOutdoors aplikaciji je onemogućen za ovaj nalog."
    : "Pristup MeetOutdoors aplikaciji je privremeno ograničen.";

  return (
    <>
      <BlockedAccountStyles />

      <main className="blockedAccountPage">
        <section className="blockedAccountCard">
          <div
            className={`blockedAccountIcon ${
              isBanned ? "danger" : "warning"
            }`}
          >
            <Icon
              name={isBanned ? "alert" : "shield"}
              size={34}
            />
          </div>

          <span className="blockedAccountEyebrow">
            MEETOUTDOORS ACCOUNT STATUS
          </span>

          <h1>{title}</h1>

          <p className="blockedAccountDescription">
            {description}
          </p>

          <div className="blockedAccountStatus">
            <article>
              <span>Status</span>

              <strong>
                {accountStatus === "banned"
                  ? "Banovan"
                  : "Suspendovan"}
              </strong>
            </article>

            {profile.ban_reason && (
              <article>
                <span>Razlog</span>

                <strong>
                  {profile.ban_reason}
                </strong>
              </article>
            )}

            {isSuspended &&
              profile.suspended_until && (
                <article>
                  <span>
                    Suspenzija traje do
                  </span>

                  <strong>
                    <Icon
                      name="clock"
                      size={15}
                    />

                    {formatDate(
                      profile.suspended_until
                    )}
                  </strong>
                </article>
              )}
          </div>

          <div className="blockedAccountNotice">
            <Icon
              name="shield"
              size={18}
            />

            <div>
              <strong>
                Potrebna ti je pomoć?
              </strong>

              <p>
                Ako smatraš da je nalog blokiran
                greškom, kontaktiraj MeetOutdoors
                podršku.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="blockedAccountLogout"
            onClick={logout}
          >
            <Icon
              name="logout"
              size={17}
            />

            Odjavi se
          </button>
        </section>
      </main>
    </>
  );
}

function BlockedAccountStyles() {
  return (
    <style>{`
      * {
        box-sizing: border-box;
      }

      html,
      body,
      #root {
        min-height: 100%;
      }

      body {
        margin: 0;
        background: #07110b;
      }

      button {
        font: inherit;
      }

      .blockedAccountPage {
        display: grid;
        place-items: center;
        min-height: 100vh;
        padding: 110px 20px 40px;
        background:
          radial-gradient(
            circle at 10% 0%,
            rgba(186, 255, 158, 0.09),
            transparent 26%
          ),
          radial-gradient(
            circle at 90% 18%,
            rgba(255, 140, 128, 0.07),
            transparent 24%
          ),
          linear-gradient(
            180deg,
            #07110b,
            #08150e
          );
        color: white;
        font-family:
          Inter,
          ui-sans-serif,
          system-ui,
          -apple-system,
          BlinkMacSystemFont,
          "Segoe UI",
          sans-serif;
      }

      .blockedAccountCard {
        width: min(560px, 100%);
        padding: 38px;
        border: 1px solid rgba(255,255,255,.09);
        border-radius: 30px;
        background:
          linear-gradient(
            145deg,
            rgba(11, 29, 18, 0.98),
            rgba(7, 18, 11, 0.98)
          );
        box-shadow:
          0 36px 100px rgba(0,0,0,.38),
          inset 0 1px 0 rgba(255,255,255,.04);
      }

      .blockedAccountIcon {
        display: grid;
        place-items: center;
        width: 74px;
        height: 74px;
        border-radius: 22px;
      }

      .blockedAccountIcon.danger {
        border: 1px solid rgba(255,140,128,.18);
        background: rgba(255,140,128,.08);
        color: #ff9f95;
      }

      .blockedAccountIcon.warning {
        border: 1px solid rgba(255,211,116,.18);
        background: rgba(255,211,116,.08);
        color: #ffd374;
      }

      .blockedAccountEyebrow {
        display: block;
        margin-top: 24px;
        color: #baff9e;
        font-size: 8px;
        font-weight: 900;
        letter-spacing: .13em;
      }

      .blockedAccountCard h1 {
        margin: 10px 0 0;
        font-size: clamp(
          34px,
          6vw,
          52px
        );
        line-height: 1;
        letter-spacing: -.06em;
      }

      .blockedAccountDescription {
        margin: 14px 0 0;
        color: rgba(255,255,255,.48);
        font-size: 11px;
        line-height: 1.7;
      }

      .blockedAccountStatus {
        display: grid;
        gap: 8px;
        margin-top: 26px;
      }

      .blockedAccountStatus article {
        display: grid;
        gap: 5px;
        padding: 14px;
        border: 1px solid rgba(255,255,255,.07);
        border-radius: 15px;
        background: rgba(255,255,255,.035);
      }

      .blockedAccountStatus span {
        color: rgba(255,255,255,.35);
        font-size: 7px;
        font-weight: 850;
        text-transform: uppercase;
        letter-spacing: .06em;
      }

      .blockedAccountStatus strong {
        display: flex;
        align-items: center;
        gap: 7px;
        color: white;
        font-size: 10px;
        line-height: 1.5;
      }

      .blockedAccountNotice {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        margin-top: 20px;
        padding: 14px;
        border: 1px solid rgba(186,255,158,.11);
        border-radius: 15px;
        background: rgba(186,255,158,.045);
        color: #baff9e;
      }

      .blockedAccountNotice strong {
        display: block;
        color: white;
        font-size: 9px;
      }

      .blockedAccountNotice p {
        margin: 4px 0 0;
        color: rgba(255,255,255,.39);
        font-size: 8px;
        line-height: 1.55;
      }

      .blockedAccountLogout {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        width: 100%;
        min-height: 48px;
        margin-top: 22px;
        border: 1px solid rgba(255,255,255,.11);
        border-radius: 14px;
        background: rgba(255,255,255,.055);
        color: white;
        cursor: pointer;
        font-size: 9px;
        font-weight: 900;
        transition: .18s ease;
      }

      .blockedAccountLogout:hover {
        border-color: rgba(186,255,158,.2);
        background: rgba(255,255,255,.085);
        transform: translateY(-1px);
      }

      .blockedAccountLoading {
        display: grid;
        place-items: center;
        gap: 12px;
        color: rgba(255,255,255,.7);
      }

      .blockedAccountLoading > span {
        width: 42px;
        height: 42px;
        border: 3px solid rgba(255,255,255,.1);
        border-top-color: #baff9e;
        border-radius: 50%;
        animation: blockedSpin .8s linear infinite;
      }

      .blockedAccountLoading strong {
        font-size: 9px;
      }

      @keyframes blockedSpin {
        to {
          transform: rotate(360deg);
        }
      }

      @media(max-width: 600px) {
        .blockedAccountPage {
          padding: 90px 12px 24px;
        }

        .blockedAccountCard {
          padding: 26px 20px;
          border-radius: 24px;
        }
      }

      @media(prefers-reduced-motion: reduce) {
        *,
        *::before,
        *::after {
          animation: none !important;
          transition: none !important;
        }
      }
    `}</style>
  );
}