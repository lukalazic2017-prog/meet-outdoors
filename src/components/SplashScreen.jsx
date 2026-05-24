import React from "react";

export default function SplashScreen() {
  return (
    <main className="mo-splash" aria-label="MeetOutdoors loading screen">
      <div className="mo-splash__aurora mo-splash__aurora--one" />
      <div className="mo-splash__aurora mo-splash__aurora--two" />
      <div className="mo-splash__noise" />
      <div className="mo-splash__grid" />

      <section className="mo-splash__card">
        <div className="mo-splash__orb">
          <svg
            className="mo-splash__mark"
            viewBox="0 0 240 240"
            role="img"
            aria-label="MeetOutdoors mountain logo"
          >
            <defs>
              <linearGradient id="moMint" x1="34" y1="188" x2="202" y2="46">
                <stop offset="0%" stopColor="#16F5A2" />
                <stop offset="48%" stopColor="#7DFFD1" />
                <stop offset="100%" stopColor="#E9FFF6" />
              </linearGradient>

              <linearGradient id="moIce" x1="70" y1="70" x2="170" y2="190">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="#B9FFE4" />
              </linearGradient>

              <filter id="moGlow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feColorMatrix
                  in="blur"
                  type="matrix"
                  values="0 0 0 0 0.1  0 0 0 0 1  0 0 0 0 0.65  0 0 0 .9 0"
                />
                <feMerge>
                  <feMergeNode />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <circle
              cx="120"
              cy="120"
              r="93"
              fill="rgba(255,255,255,.025)"
              stroke="rgba(125,255,209,.22)"
              strokeWidth="1.4"
            />

            <path
              className="mo-splash__mark-line"
              d="M38 172 L84 114 L109 143 L143 72 L202 172"
              fill="none"
              stroke="url(#moMint)"
              strokeWidth="14"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#moGlow)"
            />

            <path
              className="mo-splash__mark-line mo-splash__mark-line--delay"
              d="M84 114 L106 172 M143 72 L121 172 M143 72 L169 172"
              fill="none"
              stroke="url(#moIce)"
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity=".96"
            />

            <path
              d="M60 172 H181"
              fill="none"
              stroke="rgba(255,255,255,.78)"
              strokeWidth="5"
              strokeLinecap="round"
              opacity=".34"
            />
          </svg>
        </div>

        <div className="mo-splash__brand-wrap">
          <h1 className="mo-splash__brand">
            MEET<span>OUTDOORS</span>
          </h1>
          <div className="mo-splash__shine" />
        </div>

        <p className="mo-splash__tagline">
          DON&apos;T EXPLORE ALONE
        </p>

        <div className="mo-splash__meta">
          <span>LIVE OUTDOOR EXPERIENCES</span>
          <span>•</span>
          <span>COMMUNITY</span>
          <span>•</span>
          <span>BOOKINGS</span>
        </div>

        <div className="mo-splash__loader" aria-hidden="true">
          <div className="mo-splash__loader-fill" />
        </div>
      </section>

      <style>{`
        .mo-splash {
          min-height: 100vh;
          width: 100%;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          background:
            radial-gradient(circle at 50% 18%, rgba(42,255,174,.18), transparent 26%),
            radial-gradient(circle at 50% 82%, rgba(0,140,88,.18), transparent 34%),
            linear-gradient(180deg, #030807 0%, #020403 48%, #000201 100%);
          color: #fff;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          isolation: isolate;
        }

        .mo-splash__aurora {
          position: absolute;
          width: 420px;
          height: 420px;
          border-radius: 999px;
          filter: blur(60px);
          opacity: .48;
          pointer-events: none;
          animation: moAurora 5.5s ease-in-out infinite alternate;
        }

        .mo-splash__aurora--one {
          top: -130px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(35, 255, 166, .32);
        }

        .mo-splash__aurora--two {
          bottom: -190px;
          right: -120px;
          background: rgba(65, 190, 255, .18);
          animation-delay: .8s;
        }

        .mo-splash__noise {
          position: absolute;
          inset: 0;
          opacity: .13;
          background-image:
            radial-gradient(rgba(255,255,255,.16) .65px, transparent .65px);
          background-size: 4px 4px;
          mix-blend-mode: overlay;
          pointer-events: none;
          z-index: 1;
        }

        .mo-splash__grid {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px);
          background-size: 44px 44px;
          mask-image: radial-gradient(circle at center, black 0%, transparent 68%);
          opacity: .35;
          transform: perspective(700px) rotateX(62deg) translateY(180px);
          transform-origin: center bottom;
          z-index: 1;
        }

        .mo-splash__card {
          position: relative;
          z-index: 2;
          width: min(88vw, 430px);
          min-height: 640px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 46px 26px 38px;
          animation: moEnter 900ms cubic-bezier(.17,.84,.32,1) both;
        }

        .mo-splash__orb {
          position: relative;
          width: 188px;
          height: 188px;
          display: grid;
          place-items: center;
          margin-bottom: 26px;
          border-radius: 999px;
          background:
            radial-gradient(circle at 50% 38%, rgba(255,255,255,.08), transparent 38%),
            linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.025));
          box-shadow:
            0 0 0 1px rgba(125,255,209,.18),
            0 28px 90px rgba(0,0,0,.72),
            0 0 72px rgba(44,255,171,.18);
        }

        .mo-splash__orb::before {
          content: "";
          position: absolute;
          inset: -12px;
          border-radius: inherit;
          border: 1px solid rgba(125,255,209,.18);
          border-top-color: rgba(125,255,209,.82);
          animation: moSpin 2.2s linear infinite;
          filter: drop-shadow(0 0 18px rgba(88,255,189,.55));
        }

        .mo-splash__orb::after {
          content: "";
          position: absolute;
          inset: 20px;
          border-radius: inherit;
          background: radial-gradient(circle, rgba(39,255,166,.14), transparent 65%);
          animation: moPulse 1.7s ease-in-out infinite;
        }

        .mo-splash__mark {
          width: 150px;
          height: 150px;
          position: relative;
          z-index: 2;
          overflow: visible;
        }

        .mo-splash__mark-line {
          stroke-dasharray: 330;
          stroke-dashoffset: 330;
          animation: moDraw 1.25s ease forwards .18s;
        }

        .mo-splash__mark-line--delay {
          stroke-dasharray: 260;
          stroke-dashoffset: 260;
          animation-delay: .38s;
        }

        .mo-splash__brand-wrap {
          position: relative;
          overflow: hidden;
          padding: 2px 4px;
        }

        .mo-splash__brand {
          margin: 0;
          font-size: clamp(32px, 8.5vw, 43px);
          line-height: .94;
          font-weight: 950;
          letter-spacing: .16em;
          text-indent: .16em;
          color: rgba(255,255,255,.95);
          text-shadow: 0 18px 70px rgba(0,0,0,.7);
          animation: moTextUp 720ms cubic-bezier(.17,.84,.32,1) both .5s;
        }

        .mo-splash__brand span {
          color: #65ffc1;
          text-shadow: 0 0 32px rgba(101,255,193,.34);
        }

        .mo-splash__shine {
          position: absolute;
          top: -20%;
          bottom: -20%;
          width: 58px;
          left: -80px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.45), transparent);
          transform: skewX(-18deg);
          animation: moShine 1.55s ease .92s both;
        }

        .mo-splash__tagline {
          margin: 19px 0 0;
          font-size: 13px;
          font-weight: 900;
          letter-spacing: .42em;
          color: rgba(255,255,255,.78);
          text-indent: .42em;
          animation: moTextUp 720ms cubic-bezier(.17,.84,.32,1) both .68s;
        }

        .mo-splash__meta {
          margin-top: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          flex-wrap: wrap;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: .18em;
          color: rgba(177,255,223,.48);
          animation: moTextUp 720ms cubic-bezier(.17,.84,.32,1) both .78s;
        }

        .mo-splash__loader {
          position: absolute;
          left: 50%;
          bottom: 64px;
          transform: translateX(-50%);
          width: min(260px, 68vw);
          height: 5px;
          border-radius: 999px;
          overflow: hidden;
          background: rgba(255,255,255,.11);
          box-shadow: inset 0 0 0 1px rgba(255,255,255,.05);
        }

        .mo-splash__loader-fill {
          height: 100%;
          width: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #17f5a1, #9dffd8, #17f5a1);
          transform-origin: left center;
          transform: scaleX(0);
          animation: moLoad 2.05s cubic-bezier(.17,.84,.32,1) forwards;
          box-shadow: 0 0 28px rgba(74,255,184,.82);
        }

        @keyframes moEnter {
          from {
            opacity: 0;
            transform: translateY(26px) scale(.965);
            filter: blur(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }

        @keyframes moTextUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes moDraw {
          to {
            stroke-dashoffset: 0;
          }
        }

        @keyframes moLoad {
          0% {
            transform: scaleX(0);
          }
          78% {
            transform: scaleX(.86);
          }
          100% {
            transform: scaleX(1);
          }
        }

        @keyframes moSpin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes moPulse {
          0%, 100% {
            opacity: .55;
            transform: scale(.92);
          }
          50% {
            opacity: 1;
            transform: scale(1.08);
          }
        }

        @keyframes moShine {
          from {
            left: -90px;
            opacity: 0;
          }
          22% {
            opacity: .9;
          }
          to {
            left: calc(100% + 90px);
            opacity: 0;
          }
        }

        @keyframes moAurora {
          from {
            transform: translate3d(-50%, 0, 0) scale(1);
          }
          to {
            transform: translate3d(-48%, 18px, 0) scale(1.08);
          }
        }

        @media (max-width: 380px) {
          .mo-splash__card {
            min-height: 590px;
          }

          .mo-splash__orb {
            width: 164px;
            height: 164px;
          }

          .mo-splash__mark {
            width: 132px;
            height: 132px;
          }

          .mo-splash__tagline {
            font-size: 11px;
            letter-spacing: .34em;
            text-indent: .34em;
          }

          .mo-splash__meta {
            display: none;
          }
        }
      `}</style>
    </main>
  );
}
