// src/pages/Login.jsx
import React, { useMemo, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

const BG_IMAGE =
  "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=1600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fHRyZWV8ZW58MHx8MHx8fDA%3D";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [remember, setRemember] = useState(false);

  const [focused, setFocused] = useState({
    email: false,
    password: false,
  });

  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 900 : false
  );

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message || "Login failed. Please try again.");
    } else {
      setSuccessMsg("Welcome back! Redirecting...");
      setTimeout(() => navigate("/"), 900);
    }

    setLoading(false);
  };

  const styles = useMemo(
    () => ({
      page: {
        minHeight: "100vh",
        width: "100%",
        margin: 0,
        padding: 0,
        fontFamily:
          "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        position: "relative",
        color: "#f8fffb",
        overflow: "hidden",
        background: "#020806",
      },

      bg: {
        position: "fixed",
        inset: 0,
        backgroundImage: `url(${BG_IMAGE})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        filter: isMobile ? "blur(4px)" : "blur(6px)",
        transform: "scale(1.06)",
        zIndex: -3,
      },

      overlay: {
        position: "fixed",
        inset: 0,
        background:
          "radial-gradient(circle at 20% 0%, rgba(0,255,186,0.12), transparent 30%)," +
          "radial-gradient(circle at 100% 0%, rgba(0,180,255,0.12), transparent 28%)," +
          "linear-gradient(180deg, rgba(0,0,0,0.28), rgba(0,0,0,0.76) 52%, rgba(0,0,0,0.94))",
        zIndex: -2,
      },

      gridPattern: {
        position: "fixed",
        inset: 0,
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
        maskImage: "linear-gradient(180deg, rgba(0,0,0,0.45), transparent 75%)",
        zIndex: -1,
        pointerEvents: "none",
      },

      container: {
        maxWidth: 1220,
        margin: "0 auto",
        padding: isMobile ? "18px 14px 28px" : "30px 20px 34px",
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        boxSizing: "border-box",
      },

      topBar: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        marginBottom: isMobile ? 18 : 28,
        flexWrap: "wrap",
      },

      topBrand: {
        display: "flex",
        alignItems: "center",
        gap: 12,
      },

      brandIcon: {
        width: isMobile ? 42 : 46,
        height: isMobile ? 42 : 46,
        borderRadius: 16,
        background:
          "radial-gradient(circle at 30% 20%, #00ffba 0, #00c988 42%, #01402d 72%, #011811 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow:
          "0 0 22px rgba(0,255,186,0.35), 0 16px 30px rgba(0,0,0,0.35)",
        fontSize: isMobile ? 22 : 24,
      },

      brandTextTop: {
        fontSize: isMobile ? 16 : 18,
        fontWeight: 900,
        letterSpacing: 1.4,
        textTransform: "uppercase",
        lineHeight: 1,
      },

      brandSubTop: {
        marginTop: 5,
        fontSize: 11,
        color: "rgba(235,255,245,0.75)",
        letterSpacing: "0.08em",
      },

      topAction: {
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        borderRadius: 999,
        background: "rgba(0,0,0,0.42)",
        border: "1px solid rgba(255,255,255,0.12)",
        backdropFilter: "blur(14px)",
        fontSize: 12,
        color: "rgba(230,255,242,0.86)",
      },

      contentRow: {
        display: "grid",
        gridTemplateColumns: isMobile
          ? "minmax(0,1fr)"
          : "minmax(0, 1.22fr) minmax(390px, 0.88fr)",
        gap: isMobile ? 16 : 34,
        alignItems: "center",
        flex: 1,
      },

      leftHero: {
        paddingRight: isMobile ? 0 : 10,
        order: isMobile ? 2 : 1,
      },

      pill: {
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        fontSize: 11,
        fontWeight: 800,
        padding: "7px 12px",
        borderRadius: 999,
        background: "rgba(0,0,0,0.42)",
        border: "1px solid rgba(0,255,186,0.28)",
        marginBottom: 14,
        backdropFilter: "blur(14px)",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "rgba(230,255,244,0.92)",
      },

      pillDot: {
        width: 7,
        height: 7,
        borderRadius: "50%",
        background: "#00ffba",
        boxShadow: "0 0 10px rgba(0,255,186,0.9)",
      },

      heroTitle: {
        fontSize: isMobile ? 34 : 56,
        lineHeight: isMobile ? 1.02 : 0.98,
        fontWeight: 1000,
        margin: "0 0 14px",
        background: "linear-gradient(120deg, #f4fff9, #b5ffe8, #00ffb8)",
        WebkitBackgroundClip: "text",
        color: "transparent",
        textShadow: "0 10px 30px rgba(0,0,0,0.45)",
        letterSpacing: "-0.05em",
        maxWidth: 700,
      },

      heroText: {
        fontSize: isMobile ? 14 : 16,
        maxWidth: 560,
        color: "rgba(232,255,246,0.84)",
        lineHeight: 1.8,
        marginBottom: 18,
      },

      heroMetaRow: {
        display: "flex",
        gap: 12,
        flexWrap: "wrap",
        marginTop: 6,
        fontSize: 12,
        color: "rgba(220,245,235,0.9)",
      },

      heroMetaPill: {
        padding: "8px 12px",
        borderRadius: 999,
        background: "rgba(0,0,0,0.40)",
        border: "1px solid rgba(255,255,255,0.10)",
        backdropFilter: "blur(14px)",
        boxShadow: "0 14px 26px rgba(0,0,0,0.20)",
      },

      featureGrid: {
        marginTop: 22,
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0,1fr))",
        gap: 12,
        maxWidth: 700,
      },

      featureCard: {
        padding: "14px 14px",
        borderRadius: 20,
        background:
          "linear-gradient(145deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03))",
        border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(18px)",
        boxShadow: "0 20px 34px rgba(0,0,0,0.18)",
      },

      featureNumber: {
        fontSize: 22,
        fontWeight: 1000,
        color: "#ffffff",
        lineHeight: 1,
      },

      featureLabel: {
        marginTop: 7,
        fontSize: 12,
        color: "rgba(232,255,246,0.72)",
        lineHeight: 1.45,
      },

      rightWrap: {
        order: isMobile ? 1 : 2,
      },

      card: {
        background:
          "linear-gradient(145deg, rgba(3,22,15,0.86), rgba(1,10,7,0.96))",
        borderRadius: isMobile ? 24 : 28,
        padding: isMobile ? 18 : 24,
        boxShadow:
          "0 24px 70px rgba(0,0,0,0.65), 0 0 0 1px rgba(0,255,186,0.10)",
        backdropFilter: "blur(18px)",
        border: "1px solid rgba(0,255,186,0.20)",
        maxWidth: isMobile ? "100%" : 430,
        marginLeft: "auto",
        overflow: "hidden",
        position: "relative",
      },

      cardGlow: {
        position: "absolute",
        top: -90,
        right: -90,
        width: 220,
        height: 220,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(0,255,186,0.10), transparent 70%)",
        pointerEvents: "none",
      },

      cardHeader: {
        position: "relative",
        zIndex: 1,
        marginBottom: 18,
        textAlign: "center",
      },

      cardTitle: {
        fontSize: isMobile ? 24 : 26,
        fontWeight: 900,
        marginBottom: 6,
        letterSpacing: "-0.03em",
      },

      cardSubtitle: {
        fontSize: 13,
        color: "rgba(219,245,236,0.78)",
        lineHeight: 1.6,
      },

      dividerWrapper: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        marginTop: 14,
        marginBottom: 4,
      },

      dividerLine: {
        width: 34,
        height: 2,
        borderRadius: 999,
        background: "linear-gradient(90deg, transparent, #00ffba, transparent)",
        opacity: 0.75,
      },

      form: {
        position: "relative",
        zIndex: 1,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        marginTop: 12,
      },

      inputBlock: {
        display: "flex",
        flexDirection: "column",
        gap: 6,
      },

      label: {
        fontSize: 12,
        fontWeight: 700,
        color: "rgba(230,250,242,0.92)",
        letterSpacing: "0.02em",
      },

      inputWrapper: {
        position: "relative",
      },

      inputIcon: {
        position: "absolute",
        left: 12,
        top: "50%",
        transform: "translateY(-50%)",
        fontSize: 14,
        opacity: 0.75,
        pointerEvents: "none",
      },

      input: {
        width: "100%",
        padding: "14px 14px 14px 42px",
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(0,0,0,0.46)",
        color: "white",
        fontSize: 14,
        fontWeight: 600,
        outline: "none",
        boxSizing: "border-box",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02)",
      },

      inputFocus: {
        borderColor: "rgba(0,255,186,0.65)",
        boxShadow:
          "0 0 0 1px rgba(0,255,186,0.35), 0 0 24px rgba(0,255,186,0.12)",
      },

      helperRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 2,
        marginBottom: 4,
        fontSize: 11,
        color: "rgba(220,240,232,0.76)",
        gap: 12,
        flexWrap: "wrap",
      },

      checkboxRow: {
        display: "flex",
        alignItems: "center",
        gap: 8,
      },

      checkbox: {
        width: 15,
        height: 15,
        accentColor: "#00ffba",
        cursor: "pointer",
      },

      forgotLink: {
        color: "#9cfde1",
        cursor: "pointer",
        textDecoration: "none",
        fontWeight: 700,
        background: "none",
        border: "none",
        padding: 0,
      },

      button: {
        marginTop: 10,
        width: "100%",
        padding: isMobile ? "14px 16px" : "13px 16px",
        borderRadius: 999,
        border: "none",
        cursor: "pointer",
        fontSize: 15,
        fontWeight: 900,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        background: "linear-gradient(135deg, #00ffba, #4bffd5, #00c28a)",
        color: "#022116",
        boxShadow:
          "0 0 20px rgba(0,255,186,0.35), 0 16px 32px rgba(0,0,0,0.45)",
        transform: loading ? "scale(0.99)" : "scale(1)",
        opacity: loading ? 0.85 : 1,
        transition: "0.2s ease",
      },

      mutedText: {
        marginTop: 14,
        fontSize: 12,
        textAlign: "center",
        color: "rgba(220,240,232,0.8)",
      },

      linkInline: {
        color: "#9cfde1",
        textDecoration: "none",
        fontWeight: 700,
        marginLeft: 4,
      },

      messageError: {
        marginTop: 8,
        fontSize: 12,
        borderRadius: 12,
        padding: "10px 12px",
        background: "rgba(255,80,80,0.08)",
        border: "1px solid rgba(255,120,120,0.35)",
        color: "#ffd0d0",
        lineHeight: 1.5,
      },

      messageSuccess: {
        marginTop: 8,
        fontSize: 12,
        borderRadius: 12,
        padding: "10px 12px",
        background: "rgba(0,255,186,0.08)",
        border: "1px solid rgba(0,255,186,0.35)",
        color: "#d8fff2",
        lineHeight: 1.5,
      },

      bottomHint: {
        marginTop: 18,
        fontSize: 11,
        color: "rgba(210,230,223,0.75)",
        textAlign: "center",
        lineHeight: 1.6,
      },
    }),
    [isMobile, loading]
  );

  return (
    <div style={styles.page}>
      <div style={styles.bg} />
      <div style={styles.overlay} />
      <div style={styles.gridPattern} />

      <div style={styles.container}>
        <div style={styles.topBar}>
          <div style={styles.topBrand}>
            
            <div>
              
              
            </div>
          </div>

          <div style={styles.topAction}>🌍 Europe & beyond</div>
        </div>

        <div style={styles.contentRow}>
          <div style={styles.leftHero}>
            <div style={styles.pill}>
              <span style={styles.pillDot} />
              <span>Real people · real mountains · real stories</span>
            </div>

            <h1 style={styles.heroTitle}>
              Sign in and turn “maybe one day” into a date on your calendar.
            </h1>

            <p style={styles.heroText}>
              MeetOutdoors connects you with hikers, runners, cyclists, skiers,
              climbers and weekend adventurers. Your next favorite story
              probably starts with this login.
            </p>

            <div style={styles.heroMetaRow}>
              <div style={styles.heroMetaPill}>✅ Small, curated groups</div>
              <div style={styles.heroMetaPill}>🌍 Europe & beyond</div>
              <div style={styles.heroMetaPill}>⭐ Hosts rated by community</div>
            </div>

            <div style={styles.featureGrid}>
              <div style={styles.featureCard}>
                <div style={styles.featureNumber}>24/7</div>
                <div style={styles.featureLabel}>
                  Access your saved tours, chats and event invitations anytime.
                </div>
              </div>

              <div style={styles.featureCard}>
                <div style={styles.featureNumber}>Live</div>
                <div style={styles.featureLabel}>
                  Jump back into real outdoor experiences without losing momentum.
                </div>
              </div>

              <div style={styles.featureCard}>
                <div style={styles.featureNumber}>Safe</div>
                <div style={styles.featureLabel}>
                  Verified creators, strong community trust and cleaner profiles.
                </div>
              </div>
            </div>
          </div>

          <div style={styles.rightWrap}>
            <div style={styles.card}>
              <div style={styles.cardGlow} />

              <div style={styles.cardHeader}>
                <div style={styles.cardTitle}>Welcome back</div>
                <div style={styles.cardSubtitle}>
                  Log in to continue your outdoor journey.
                </div>

                
              </div>

              <form style={styles.form} onSubmit={handleLogin}>
                <div style={styles.inputBlock}>
                  <div style={styles.label}>Email</div>
                  <div style={styles.inputWrapper}>
                    <span style={styles.inputIcon}>✉️</span>
                    <input
                      type="email"
                      required
                      style={{
                        ...styles.input,
                        ...(focused.email ? styles.inputFocus : {}),
                      }}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocused((p) => ({ ...p, email: true }))}
                      onBlur={() => setFocused((p) => ({ ...p, email: false }))}
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div style={styles.inputBlock}>
                  <div style={styles.label}>Password</div>
                  <div style={styles.inputWrapper}>
                    <span style={styles.inputIcon}>🔒</span>
                    <input
                      type="password"
                      required
                      style={{
                        ...styles.input,
                        ...(focused.password ? styles.inputFocus : {}),
                      }}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() =>
                        setFocused((p) => ({ ...p, password: true }))
                      }
                      onBlur={() =>
                        setFocused((p) => ({ ...p, password: false }))
                      }
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div style={styles.helperRow}>
                  <div style={styles.checkboxRow}>
                    <input
                      type="checkbox"
                      style={styles.checkbox}
                      id="remember"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                    />
                    <label htmlFor="remember">Remember me</label>
                  </div>

                  <button
                    type="button"
                    style={styles.forgotLink}
                    onClick={() => alert("Password reset coming soon.")}
                  >
                    Forgot password?
                  </button>
                </div>

                <button type="submit" style={styles.button} disabled={loading}>
                  {loading ? "Signing in..." : "Log in"}
                </button>

                {errorMsg && <div style={styles.messageError}>{errorMsg}</div>}
                {successMsg && (
                  <div style={styles.messageSuccess}>{successMsg}</div>
                )}

                <div style={styles.mutedText}>
                  Don't have an account?
                  <Link to="/register" style={styles.linkInline}>
                    Create one
                  </Link>
                </div>
              </form>

              <div style={styles.bottomHint}>
                By logging in, you agree to our trail etiquette, safety rules
                and terms of service.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}