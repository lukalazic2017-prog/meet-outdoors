// src/pages/Landing.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <>
      {/* KEYFRAMES ZA ANIMACIJE */}
      <style>
        {`
        @keyframes floatOrb {
          0% { transform: translate3d(0,0,0) scale(1); opacity: 0.45; }
          50% { transform: translate3d(14px,-18px,0) scale(1.08); opacity: 0.9; }
          100% { transform: translate3d(0,0,0) scale(1); opacity: 0.45; }
        }
        @keyframes glowPulse {
          0% { box-shadow: 0 0 20px rgba(0,255,176,0.5); }
          50% { box-shadow: 0 0 50px rgba(0,255,176,0.9); }
          100% { box-shadow: 0 0 20px rgba(0,255,176,0.5); }
        }
        @keyframes fadeUp {
          0% { opacity: 0; transform: translate3d(0,14px,0); }
          100% { opacity: 1; transform: translate3d(0,0,0); }
        }
      `}
      </style>

      <div
        style={{
          minHeight: "100vh",
          background:
            "radial-gradient(circle at top, #02140E 0%, #010308 60%, #000 100%)",
          color: "#ffffff",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        {/* ===== HERO ===== */}
        <section
          style={{
            position: "relative",
            minHeight: "92vh",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "80px 16px 60px",
          }}
        >
          {/* BACKGROUND FOTO */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "url('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "brightness(0.3) saturate(1.1)",
            }}
          />

          {/* OVERLAY GRADIENTI */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(circle at top left, rgba(0,255,160,0.22), transparent 55%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(circle at bottom, rgba(0,180,255,0.26), rgba(0,0,0,0.9))",
            }}
          />

          {/* LEBDEĆE SFERE */}
          <div
            style={{
              position: "absolute",
              width: 260,
              height: 260,
              borderRadius: "50%",
              background:
                "radial-gradient(circle at 30% 20%, rgba(0,255,200,0.9), transparent 55%)",
              top: -40,
              right: -40,
              mixBlendMode: "screen",
              opacity: 0.65,
              animation: "floatOrb 18s ease-in-out infinite",
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 220,
              height: 220,
              borderRadius: "50%",
              background:
                "radial-gradient(circle at 40% 0%, rgba(0,255,120,0.7), transparent 60%)",
              bottom: -80,
              left: -40,
              mixBlendMode: "screen",
              opacity: 0.55,
              animation: "floatOrb 20s ease-in-out infinite reverse",
            }}
          />

          {/* HERO CONTENT */}
          <div
            style={{
              position: "relative",
              zIndex: 5,
              maxWidth: 1040,
              textAlign: "center",
              animation: "fadeUp 0.7s ease-out forwards",
            }}
          >
            {/* Badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "4px 12px",
                borderRadius: 999,
                border: "1px solid rgba(0,255,160,0.7)",
                background:
                  "linear-gradient(120deg, rgba(0,0,0,0.8), rgba(0,255,160,0.16))",
                fontSize: 11,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                marginBottom: 18,
              }}
            >
              <span>NEW</span>
              <span style={{ opacity: 0.8 }}>Real people. Real adventures.</span>
            </div>

            {/* Main title */}
            <h1
              style={{
                fontSize: "clamp(42px, 6vw, 66px)",
                fontWeight: 900,
                lineHeight: 1.05,
                marginBottom: 14,
                textShadow:
                  "0 0 40px rgba(0,255,176,0.9), 0 0 80px rgba(0,255,176,0.55)",
              }}
            >
              The social app
              <span style={{ display: "block", color: "#00FFB0" }}>
                that lives outside.
              </span>
            </h1>

            <p
              style={{
                fontSize: 18,
                maxWidth: 640,
                margin: "0 auto 28px",
                color: "rgba(232,252,245,0.86)",
              }}
            >
              Meet Outdoors connects you with people who want **the same sunrises,
              the same ridges, the same rivers**. Build your crew. Host your own
              tours. Or just jump in.
            </p>

            {/* CTA buttons */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                flexWrap: "wrap",
                gap: 12,
                marginBottom: 22,
              }}
            >
              <button
                onClick={() => navigate("/tours")}
                style={ctaPrimary}
              >
                🌍 Explore live tours
              </button>

              <button
                onClick={() => navigate("/create-tour")}
                style={ctaGhost}
              >
                ➕ Host your first tour
              </button>
            </div>

            {/* Stats strip */}
            <div
              style={{
                margin: "0 auto",
                maxWidth: 640,
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(0,0,0,0.6)",
                backdropFilter: "blur(16px)",
                padding: "10px 16px",
                display: "flex",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 10,
                fontSize: 13,
              }}
            >
              <HeroStat label="Explorers waiting" value="1,284" />
              <HeroStat label="Upcoming tours" value="73" />
              <HeroStat label="Countries" value="17" />
            </div>
          </div>
        </section>

        {/* ===== FEATURE RAIL (kao Netflix) ===== */}
        <section
          style={{
            padding: "40px 0 10px",
            borderTop: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 16px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                gap: 16,
                marginBottom: 12,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 12,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "rgba(210,255,230,0.85)",
                  }}
                >
                  LIVE OUTDOOR ENERGY
                </div>
                <h2
                  style={{
                    fontSize: 24,
                    marginTop: 4,
                    marginBottom: 0,
                  }}
                >
                  Featured adventures this week
                </h2>
              </div>
              <button
                onClick={() => navigate("/tours")}
                style={{
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.35)",
                  background: "transparent",
                  color: "#fff",
                  padding: "6px 14px",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                View all tours →
              </button>
            </div>

            <div
              style={{
                display: "flex",
                overflowX: "auto",
                gap: 14,
                paddingBottom: 4,
              }}
            >
              {featuredTours.map((tour) => (
                <div
                  key={tour.id}
                  style={railCard}
                  onClick={() => navigate("/tours")}
                >
                  <div
                    style={{
                      position: "relative",
                      height: 140,
                      borderRadius: 16,
                      overflow: "hidden",
                      marginBottom: 8,
                    }}
                  >
                    <img
                      src={tour.image}
                      alt={tour.title}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        transform: "scale(1.04)",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background:
                          "linear-gradient(180deg, rgba(0,0,0,0.1), rgba(0,0,0,0.85))",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        left: 10,
                        bottom: 10,
                        fontSize: 11,
                        padding: "4px 8px",
                        borderRadius: 999,
                        background:
                          "radial-gradient(circle at top, rgba(0,255,176,0.9), rgba(1,19,12,0.8))",
                        color: "#02130c",
                        fontWeight: 700,
                      }}
                    >
                      {tour.tag}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      marginBottom: 2,
                    }}
                  >
                    {tour.title}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "rgba(255,255,255,0.7)",
                    }}
                  >
                    {tour.location}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== DUAL PANEL: HOST / JOIN ===== */}
        <section
          style={{
            padding: "60px 16px",
          }}
        >
          <div
            style={{
              maxWidth: 1180,
              margin: "0 auto",
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 1.1fr)",
              gap: 18,
            }}
          >
            {/* HOST */}
            <div style={dualCardLeft}>
              <h3 style={dualTitle}>Host experiences</h3>
              <p style={dualText}>
                Turn your local knowledge into unforgettable trips. Set the date,
                price, capacity — we help you fill every spot.
              </p>

              <ul style={dualList}>
                <li>🎒 Create cinematic tour pages in minutes</li>
                <li>💶 Bring your own pricing later with Stripe</li>
                <li>⭐ Build your guide reputation with ratings</li>
              </ul>

              <button
                style={dualBtnPrimary}
                onClick={() => navigate("/create-tour")}
              >
                Start hosting
              </button>
            </div>

            {/* JOIN */}
            <div style={dualCardRight}>
              <h3 style={dualTitle}>Join adventures</h3>
              <p style={dualText}>
                Swipe through real outdoor plans. Mountain sunrises, river
                raids, pilgrimages – all waiting for your yes.
              </p>

              <ul style={dualList}>
                <li>🌍 Filter by activity, difficulty, and vibe</li>
                <li>👥 Meet people who want the same terrain</li>
                <li>🔔 Smart reminders so you never miss a tour</li>
              </ul>

              <button
                style={dualBtnGhost}
                onClick={() => navigate("/tours")}
              >
                Browse tours
              </button>
            </div>
          </div>
        </section>

        {/* ===== QUOTE / VISION ===== */}
        <section
          style={{
            padding: "0 16px 70px",
          }}
        >
          <div
            style={{
              maxWidth: 880,
              margin: "0 auto",
              borderRadius: 26,
              padding: 26,
              border: "1px solid rgba(0,255,160,0.4)",
              background:
                "radial-gradient(circle at top, rgba(0,255,160,0.18), rgba(0,0,0,0.95))",
              boxShadow:
                "0 26px 80px rgba(0,0,0,0.9), 0 0 40px rgba(0,255,170,0.6)",
              animation: "glowPulse 4s ease-in-out infinite",
            }}
          >
            <div
              style={{
                fontSize: 13,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "rgba(220,255,240,0.9)",
                marginBottom: 10,
              }}
            >
              WHAT MEET OUTDOORS IS REALLY ABOUT
            </div>

            <p
              style={{
                fontSize: 19,
                lineHeight: 1.7,
                marginBottom: 14,
              }}
            >
              “Screens are fine. But your best memories won&apos;t be 1080p – they' ll be cold air at 1.800 meters, soaked shoes by the riverr, and the people you meet because you tapped{" "}
              <span style={{ color: "#00ffb0" }}>Join tour</span> in this application."
            </p>

            <div
              style={{
                fontSize: 14,
                color: "rgba(230,255,245,0.85)",
              }}
            >
              Meet Outdoors · for those who'd rather live their story than watch it through a screen.
            </div>
          </div>
        </section>

        {/* ===== FOOTER ===== */}
        <footer
          style={{
            padding: "26px 16px 40px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            fontSize: 13,
            color: "rgba(255,255,255,0.7)",
          }}
        >
          <div
            style={{
              maxWidth: 1180,
              margin: "0 auto",
              display: "flex",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div>© {new Date().getFullYear()} Meet Outdoors</div>
            <div style={{ opacity: 0.75 }}>
              Made for explorers · Not for couch potatoes 🥾
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

/* ===== helper komponenta za stat ===== */

function HeroStat({ label, value }) {
  return (
    <div style={{ minWidth: 110 }}>
      <div
        style={{
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: "0.16em",
          color: "rgba(210,255,230,0.8)",
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 18, fontWeight: 800 }}>{value}</div>
    </div>
  );
}

/* ===== STILOVI KOJE KORISTIMO GORE ===== */

const ctaPrimary = {
  padding: "11px 22px",
  borderRadius: 999,
  border: "none",
  background:
    "linear-gradient(135deg,#00ffb0 0%,#00e0ff 45%,#ffffff 100%)",
  color: "#02140D",
  fontSize: 16,
  fontWeight: 800,
  cursor: "pointer",
  boxShadow: "0 18px 50px rgba(0,255,188,0.65)",
};

const ctaGhost = {
  padding: "11px 20px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.5)",
  background: "rgba(0,0,0,0.45)",
  color: "#ffffff",
  fontSize: 15,
  fontWeight: 600,
  cursor: "pointer",
  backdropFilter: "blur(10px)",
};

const featuredTours = [
  {
    id: 1,
    title: "Sunrise ridge above the clouds",
    location: "Kopaonik · Serbia",
    tag: "Skiing",
    image:
      "https://images.unsplash.com/photo-1512906763596-8d55cb944055?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8a29wYW9uaWt8ZW58MHx8MHx8fDA%3D",
  },
  {
    id: 2,
    title: "Night hike & campfire stories",
    location: "Durmitor · Montenegro",
    tag: "Camping",
    image:
      "https://images.unsplash.com/photo-1568185184505-3b5418749ba7?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTV8fG5pZ2glMjBjYW1waW5nfGVufDB8fDB8fHww",
  },
  {
    id: 3,
    title: "Rafting through emerald canyon",
    location: "Tara river",
    tag: "Rafting",
    image:
      "https://images.unsplash.com/photo-1635414730014-817f1a89b01a?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8dGFyYSUyMHJpdmVyfGVufDB8fDB8fHww",
  },
  {
    id: 4,
    title: "Pilgrimage to hidden monastery",
    location: "Balkans",
    tag: "Pilgrimage",
    image:
      "https://plus.unsplash.com/premium_photo-1661963534539-4f606dbc5149?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
];

const railCard = {
  minWidth: 210,
  maxWidth: 240,
  background: "rgba(0,0,0,0.6)",
  borderRadius: 18,
  padding: 10,
  border: "1px solid rgba(255,255,255,0.06)",
  cursor: "pointer",
  flexShrink: 0,
};

const dualCardLeft = {
  borderRadius: 22,
  padding: 22,
  background:
    "radial-gradient(circle at top left, rgba(0,255,176,0.18), rgba(0,0,0,0.9))",
  border: "1px solid rgba(0,255,176,0.45)",
  boxShadow: "0 24px 70px rgba(0,0,0,0.9)",
};

const dualCardRight = {
  borderRadius: 22,
  padding: 22,
  background:
    "radial-gradient(circle at top right, rgba(0,184,255,0.2), rgba(0,0,0,0.9))",
  border: "1px solid rgba(0,184,255,0.4)",
  boxShadow: "0 24px 70px rgba(0,0,0,0.9)",
};

const dualTitle = {
  fontSize: 22,
  fontWeight: 800,
  marginBottom: 8,
};

const dualText = {
  fontSize: 14,
  color: "rgba(230,255,245,0.85)",
  marginBottom: 12,
};

const dualList = {
  listStyle: "none",
  paddingLeft: 0,
  margin: 0,
  fontSize: 13,
  color: "rgba(230,255,245,0.88)",
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const dualBtnPrimary = {
  marginTop: 14,
  padding: "9px 18px",
  borderRadius: 999,
  border: "none",
  background:
    "linear-gradient(135deg,#00ffb0,#00e0a0)",
  color: "#02130c",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
};

const dualBtnGhost = {
  marginTop: 14,
  padding: "9px 18px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.5)",
  background: "transparent",
  color: "#ffffff",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
};