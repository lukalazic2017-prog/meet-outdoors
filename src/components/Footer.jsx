// src/components/Footer.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";

const COLORS = {
  bgTop: "#07140f",
  bgBottom: "#040b08",
  mint: "#37f2c3",
  mintBlue: "#2ee6ff",
  mintSoft: "#8fffe0",
  text: "#f4fff9",
  textSoft: "rgba(228,255,247,0.78)",
  textDim: "rgba(205,236,225,0.60)",
  line: "rgba(111,255,218,0.14)",
  lineStrong: "rgba(111,255,218,0.24)",
};

function FooterLink({ to, children }) {
  return (
    <Link
      to={to}
      style={{
        color: COLORS.textSoft,
        textDecoration: "none",
        fontSize: 14,
        fontWeight: 700,
        lineHeight: 1.6,
        transition: "all 0.18s ease",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = COLORS.text;
        e.currentTarget.style.transform = "translateX(4px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = COLORS.textSoft;
        e.currentTarget.style.transform = "translateX(0px)";
      }}
    >
      <span style={{ color: COLORS.mint }}>•</span>
      <span>{children}</span>
    </Link>
  );
}

function FooterSection({ title, children }) {
  return (
    <div style={{ minWidth: 160 }}>
      <div
        style={{
          fontSize: 12,
          fontWeight: 900,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: COLORS.mintSoft,
          marginBottom: 14,
        }}
      >
        {title}
      </div>
      <div style={{ display: "grid", gap: 10 }}>{children}</div>
    </div>
  );
}

export default function Footer({ user, avatarUrl, unreadCount, logout }) {
  const navigate = useNavigate();

  return (
    <footer
      style={{
        position: "relative",
        overflow: "hidden",
        marginTop: 0,
        padding: "0 16px 24px",
        background: `
          radial-gradient(circle at 14% 0%, rgba(55,242,195,0.12), transparent 28%),
          radial-gradient(circle at 84% 0%, rgba(46,230,255,0.10), transparent 28%),
          linear-gradient(180deg, ${COLORS.bgTop} 0%, ${COLORS.bgBottom} 100%)
        `,
        borderTop: `1px solid ${COLORS.lineStrong}`,
        color: COLORS.text,
        fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.02), transparent 18%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: -80,
          left: -50,
          width: 240,
          height: 240,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(55,242,195,0.12), transparent 68%)",
          filter: "blur(26px)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          right: -70,
          bottom: -90,
          width: 280,
          height: 280,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(46,230,255,0.10), transparent 68%)",
          filter: "blur(32px)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          maxWidth: 1260,
          margin: "0 auto",
          position: "relative",
          zIndex: 2,
          paddingTop: 34,
        }}
      >
        <div
          style={{
            borderRadius: 30,
            padding: "26px 20px",
            background:
              "linear-gradient(145deg, rgba(8,24,18,0.78), rgba(7,17,13,0.94))",
            border: `1px solid ${COLORS.lineStrong}`,
            boxShadow:
              "0 24px 64px rgba(0,0,0,0.28), 0 0 0 1px rgba(55,242,195,0.05), inset 0 1px 0 rgba(255,255,255,0.03)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.2fr) repeat(3, minmax(140px, 0.65fr))",
              gap: 24,
              alignItems: "start",
            }}
            className="footer-grid-main"
          >
            <div style={{ minWidth: 0 }}>
              <div
                onClick={() => navigate("/")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 12,
                  cursor: "pointer",
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 18,
                    background:
                      "radial-gradient(circle at 30% 20%, #37f2c3 0, #2ee6ff 42%, #08382d 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow:
                      "0 0 22px rgba(55,242,195,0.38), 0 16px 28px rgba(0,0,0,0.22)",
                    flexShrink: 0,
                  }}
                >
                  <span style={{ fontSize: 28 }}>🏔️</span>
                </div>

                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 1000,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      lineHeight: 1,
                      whiteSpace: "nowrap",
                    }}
                  >
                    <span style={{ color: COLORS.text }}>Meet</span>
                    <span
                      style={{
                        background:
                          "linear-gradient(135deg, #37f2c3 0%, #2ee6ff 100%)",
                        WebkitBackgroundClip: "text",
                        color: "transparent",
                        textShadow: "0 0 22px rgba(55,242,195,0.20)",
                      }}
                    >
                      Outdoors
                    </span>
                  </div>
                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 11,
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      color: COLORS.textDim,
                      fontWeight: 800,
                    }}
                  >
                    Explore • Connect • Adventure
                  </div>
                </div>
              </div>

              <p
                style={{
                  margin: 0,
                  maxWidth: 520,
                  color: COLORS.textSoft,
                  lineHeight: 1.78,
                  fontSize: 15,
                  fontWeight: 600,
                }}
              >
                MeetOutdoors is for people who would rather chase real moments than
                keep scrolling. Find tours, events and spontaneous plans with people
                who actually want to get outside.
              </p>

              <div
                style={{
                  marginTop: 18,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 10,
                }}
              >
                {[
                  "🌿 Outdoor-first",
                  "⚡ Going Now",
                  "👥 Real community",
                  "🧭 Explore nearby",
                ].map((chip) => (
                  <span
                    key={chip}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "9px 12px",
                      borderRadius: 999,
                      background: "rgba(255,255,255,0.04)",
                      border: `1px solid ${COLORS.line}`,
                      color: COLORS.text,
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>

            <FooterSection title="Explore">
              <FooterLink to="/going-now">Going Now</FooterLink>
              <FooterLink to="/tours">Explore tours</FooterLink>
              <FooterLink to="/events">Events</FooterLink>
              <FooterLink to="/timeline">Timeline</FooterLink>
            </FooterSection>

            <FooterSection title="Create">
              <FooterLink to="/create-going-now">Create live plan</FooterLink>
              <FooterLink to="/create-tour">Create tour</FooterLink>
              <FooterLink to="/create-event">Create event</FooterLink>
              <FooterLink to="/profile">Your profile</FooterLink>
            </FooterSection>

            <FooterSection title="Support">
              <FooterLink to="/contact">Contact</FooterLink>
              <FooterLink to="/privacy-policy">Privacy policy</FooterLink>
              <FooterLink to="/terms-of-service">Terms of service</FooterLink>
              {!user ? <FooterLink to="/register">Join MeetOutdoors</FooterLink> : null}
            </FooterSection>
          </div>

          {user ? (
            <div
              style={{
                marginTop: 24,
                paddingTop: 22,
                borderTop: `1px solid ${COLORS.line}`,
              }}
            >
              <div
                style={{
                  borderRadius: 24,
                  padding: "16px 16px",
                  background:
                    "linear-gradient(145deg, rgba(8,24,18,0.72), rgba(7,17,13,0.92))",
                  border: `1px solid ${COLORS.lineStrong}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 14,
                  flexWrap: "wrap",
                }}
                className="footer-user-bar"
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    minWidth: 0,
                    flex: 1,
                  }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: "50%",
                      overflow: "hidden",
                      border: `2px solid ${COLORS.mint}`,
                      boxShadow: "0 0 18px rgba(55,242,195,0.34)",
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src={avatarUrl || "https://i.pravatar.cc/300"}
                      alt="avatar"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 900,
                        color: COLORS.text,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      You’re signed in
                    </div>
                    <div
                      style={{
                        marginTop: 5,
                        fontSize: 13,
                        color: COLORS.textSoft,
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 10,
                      }}
                    >
                      <span>🔔 {unreadCount || 0} unread notifications</span>
                      <span>🌿 Ready for your next plan</span>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => navigate(`/profile/${user.id}`)}
                    style={{
                      border: `1px solid ${COLORS.lineStrong}`,
                      background: "rgba(255,255,255,0.05)",
                      color: COLORS.text,
                      padding: "12px 16px",
                      borderRadius: 999,
                      fontWeight: 900,
                      cursor: "pointer",
                    }}
                  >
                    Open profile
                  </button>

                  <button
                    type="button"
                    onClick={logout}
                    style={{
                      border: "1px solid rgba(255,110,110,0.28)",
                      background: "rgba(255,70,70,0.10)",
                      color: "#ffb0b0",
                      padding: "12px 16px",
                      borderRadius: 999,
                      fontWeight: 900,
                      cursor: "pointer",
                    }}
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div
          style={{
            marginTop: 18,
            borderRadius: 24,
            padding: "18px 18px",
            background:
              "linear-gradient(135deg, rgba(55,242,195,0.10), rgba(46,230,255,0.08))",
            border: `1px solid ${COLORS.lineStrong}`,
            boxShadow:
              "0 18px 44px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.04)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: COLORS.text,
              lineHeight: 1.7,
              maxWidth: 920,
              margin: "0 auto",
            }}
          >
            🚧 <strong>MeetOutdoors is currently in Beta.</strong> Explore every
            feature freely, test the experience, and send feedback whenever you spot
            something that could be even better.
          </div>
        </div>

        <div
          style={{
            marginTop: 18,
            padding: "14px 2px 0",
            borderTop: `1px solid ${COLORS.line}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
            color: COLORS.textDim,
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          <span>© {new Date().getFullYear()} MeetOutdoors. All rights reserved.</span>
          <span style={{ color: COLORS.textSoft }}>
            Made for explorers. Not for endless scrolling.
          </span>
        </div>
      </div>

      <style>{`
        @media (max-width: 980px) {
          .footer-grid-main {
            grid-template-columns: 1fr 1fr !important;
          }
        }

        @media (max-width: 700px) {
          .footer-grid-main {
            grid-template-columns: 1fr !important;
          }

          .footer-user-bar {
            align-items: flex-start !important;
          }
        }
      `}</style>
    </footer>
  );
}
