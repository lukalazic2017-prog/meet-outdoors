// src/pages/Login.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

const BG_IMAGE =
  "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fHRyZWV8ZW58MHx8MHx8fDA%3D"; // planina / priroda

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

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

  const styles = {
    page: {
      minHeight: "100vh",
      width: "100%",
      margin: 0,
      padding: 0,
      fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      position: "relative",
      color: "#f8fffb",
      overflow: "hidden",
    },
    bg: {
      position: "fixed",
      inset: 0,
      backgroundImage: `url(${BG_IMAGE})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      filter: "blur(6px)",
      transform: "scale(1.04)",
      zIndex: -2,
    },
    overlay: {
      position: "fixed",
      inset: 0,
      background:
        "radial-gradient(circle at top, rgba(0,0,0,0.35), rgba(0,0,0,0.9))",
      zIndex: -1,
    },
    container: {
      maxWidth: 1120,
      margin: "0 auto",
      padding: "32px 20px 40px",
      display: "flex",
      flexDirection: "column",
      minHeight: "100vh",
    },
    topBrand: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      marginBottom: 36,
    },
    brandIcon: {
      width: 36,
      height: 36,
      borderRadius: 14,
      background:
        "radial-gradient(circle at 30% 20%, #00ffba 0, #009a61 45%, #012c1f 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 0 18px rgba(0,255,186,0.6)",
      fontSize: 22,
    },
    brandTextTop: {
      fontSize: 18,
      fontWeight: 800,
      letterSpacing: 1.2,
      textTransform: "uppercase",
    },
    brandSubTop: {
      fontSize: 11,
      color: "rgba(235,255,245,0.75)",
    },
    contentRow: {
      display: "grid",
      gridTemplateColumns: "minmax(0, 1.25fr) minmax(0, 1fr)",
      gap: 32,
      alignItems: "center",
    },
    leftHero: {
      paddingRight: 10,
    },
    pill: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      fontSize: 12,
      padding: "6px 12px",
      borderRadius: 999,
      background: "rgba(0,0,0,0.55)",
      border: "1px solid rgba(0,255,186,0.35)",
      marginBottom: 14,
    },
    pillDot: {
      width: 7,
      height: 7,
      borderRadius: "50%",
      background: "#00ffba",
      boxShadow: "0 0 10px rgba(0,255,186,0.9)",
    },
    heroTitle: {
      fontSize: 40,
      lineHeight: 1.1,
      fontWeight: 800,
      marginBottom: 10,
      background: "linear-gradient(120deg, #eafff7, #8dffe0, #00ffb8)",
      WebkitBackgroundClip: "text",
      color: "transparent",
      textShadow: "0 10px 30px rgba(0,0,0,0.8)",
    },
    heroText: {
      fontSize: 15,
      maxWidth: 480,
      color: "rgba(232,255,246,0.84)",
      lineHeight: 1.7,
      marginBottom: 18,
    },
    heroMetaRow: {
      display: "flex",
      gap: 16,
      flexWrap: "wrap",
      marginTop: 8,
      fontSize: 12,
      color: "rgba(220,245,235,0.9)",
    },
    heroMetaPill: {
      padding: "6px 10px",
      borderRadius: 999,
      background: "rgba(0,0,0,0.55)",
      border: "1px solid rgba(255,255,255,0.12)",
    },

    card: {
      background:
        "linear-gradient(145deg, rgba(3,22,15,0.92), rgba(1,10,7,0.98))",
      borderRadius: 22,
      padding: 24,
      boxShadow:
        "0 24px 60px rgba(0,0,0,0.9), 0 0 0 1px rgba(0,255,186,0.12)",
      backdropFilter: "blur(16px)",
      border: "1px solid rgba(0,255,186,0.3)",
      maxWidth: 420,
      marginLeft: "auto",
    },
    cardHeader: {
      marginBottom: 18,
      textAlign: "center",
    },
    cardTitle: {
      fontSize: 22,
      fontWeight: 800,
      marginBottom: 6,
    },
    cardSubtitle: {
      fontSize: 13,
      color: "rgba(219,245,236,0.78)",
    },
    dividerWrapper: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      marginTop: 14,
      marginBottom: 6,
    },
    dividerLine: {
      width: 26,
      height: 2,
      borderRadius: 999,
      background: "linear-gradient(90deg, transparent, #00ffba, transparent)",
      opacity: 0.65,
    },
    form: {
      display: "flex",
      flexDirection: "column",
      gap: 12,
      marginTop: 12,
    },
    label: {
      fontSize: 12,
      fontWeight: 500,
      marginBottom: 4,
      color: "rgba(230,250,242,0.9)",
    },
    inputWrapper: {
      position: "relative",
    },
    input: {
      width: "100%",
      padding: "11px 12px 11px 12px",
      borderRadius: 14,
      border: "1px solid rgba(255,255,255,0.15)",
      background: "rgba(0,0,0,0.55)",
      color: "white",
      fontSize: 14,
      outline: "none",
    },
    inputFocus: {
      borderColor: "#00ffba",
      boxShadow: "0 0 0 1px rgba(0,255,186,0.5)",
    },
    helperRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 4,
      marginBottom: 6,
      fontSize: 11,
      color: "rgba(220,240,232,0.76)",
    },
    checkboxRow: {
      display: "flex",
      alignItems: "center",
      gap: 6,
    },
    checkbox: {
      width: 14,
      height: 14,
      borderRadius: 4,
      border: "1px solid rgba(255,255,255,0.7)",
      background: "transparent",
      cursor: "pointer",
    },
    forgotLink: {
      color: "#9cfde1",
      cursor: "pointer",
      textDecoration: "none",
    },
    button: {
      marginTop: 10,
      width: "100%",
      padding: "11px 16px",
      borderRadius: 999,
      border: "none",
      cursor: "pointer",
      fontSize: 15,
      fontWeight: 700,
      background:
        "linear-gradient(135deg, #00ffba, #4bffd5, #00c28a)",
      color: "#022116",
      boxShadow:
        "0 0 20px rgba(0,255,186,0.85), 0 16px 32px rgba(0,0,0,0.95)",
      transform: loading ? "scale(0.99)" : "scale(1)",
      opacity: loading ? 0.85 : 1,
      transition: "0.2s ease",
    },
    mutedText: {
      marginTop: 12,
      fontSize: 12,
      textAlign: "center",
      color: "rgba(220,240,232,0.8)",
    },
    linkInline: {
      color: "#9cfde1",
      textDecoration: "none",
      fontWeight: 600,
      marginLeft: 4,
    },
    messageError: {
      marginTop: 8,
      fontSize: 12,
      borderRadius: 10,
      padding: "8px 10px",
      background: "rgba(255,80,80,0.08)",
      border: "1px solid rgba(255,120,120,0.6)",
      color: "#ffd0d0",
    },
    messageSuccess: {
      marginTop: 8,
      fontSize: 12,
      borderRadius: 10,
      padding: "8px 10px",
      background: "rgba(0,255,186,0.08)",
      border: "1px solid rgba(0,255,186,0.6)",
      color: "#d8fff2",
    },
    bottomHint: {
      marginTop: 26,
      fontSize: 11,
      color: "rgba(210,230,223,0.75)",
      textAlign: "center",
    },

    // responsive
    "@media (maxWidth: 900px)": {}, // just placeholder for explanation
  };

  const [focused, setFocused] = useState({
    email: false,
    password: false,
  });

  return (
    <div style={styles.page}>
      <div style={styles.bg} />
      <div style={styles.overlay} />

      <div style={styles.container}>
        {/* LOGO / BRAND TOP */}
        
        <div
          style={{
            ...styles.contentRow,
            gridTemplateColumns:
              window.innerWidth < 900 ? "minmax(0,1fr)" : styles.contentRow.gridTemplateColumns,
          }}
        >
          {/* LEFT: TEXT */}
          <div style={styles.leftHero}>
            <div style={styles.pill}>
              <span style={styles.pillDot} />
              <span>Real people · Real mountains · Real stories</span>
            </div>
            <h1 style={styles.heroTitle}>
              Sign in and turn{" "}
              <span style={{ textDecoration: "underline", textDecorationColor: "#00ffba" }}>
                “maybe one day”
              </span>{" "}
              into a date on your calendar.
            </h1>
            <p style={styles.heroText}>
              MeetOutdoors connects you with hikers, runners, cyclists, skiers, climbers and
              weekend adventurers. Your next favorite story probably starts with this login.
            </p>
            <div style={styles.heroMetaRow}>
              <div style={styles.heroMetaPill}>✅ Small, curated groups</div>
              <div style={styles.heroMetaPill}>🌍 Europe & beyond</div>
              <div style={styles.heroMetaPill}>⭐ Hosts rated by the community</div>
            </div>
          </div>

          {/* RIGHT: LOGIN CARD */}
</div>

            <form style={styles.form} onSubmit={handleLogin}>
              <div>
                <div style={styles.label}>Email</div>
                <div style={styles.inputWrapper}>
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

              <div>
                <div style={styles.label}>Password</div>
                <div style={styles.inputWrapper}>
                  <input
                    type="password"
                    required
                    style={{
                      ...styles.input,
                      ...(focused.password ? styles.inputFocus : {}),
                    }}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocused((p) => ({ ...p, password: true }))}
                    onBlur={() => setFocused((p) => ({ ...p, password: false }))}
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
                  />
                  <label htmlFor="remember">Remember me</label>
                </div>
                <button
                  type="button"
                  style={{ ...styles.forgotLink, background: "none", border: "none" }}
                  onClick={() => alert("Password reset coming soon.")}
                >
                  Forgot password?
                </button>
              </div>

              <button type="submit" style={styles.button} disabled={loading}>
                {loading ? "Signing in..." : "Log in"}
              </button>

              {errorMsg && <div style={styles.messageError}>{errorMsg}</div>}
              {successMsg && <div style={styles.messageSuccess}>{successMsg}</div>}

              <div style={styles.mutedText}>
                Don't have an account?
                <Link to="/register" style={styles.linkInline}>
                  Create one
                </Link>
              </div>
            </form>

            <div style={styles.bottomHint}>
              By logging in, you agree to our trail etiquette, safety rules and terms of service.
            </div>
          </div>
    </div>
  );
}