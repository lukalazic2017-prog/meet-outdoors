// src/pages/Register.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

const BG_IMAGE =
  "https://images.unsplash.com/photo-1480241352829-e1573ff2414e?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NTh8fG1vdW50YWlufGVufDB8fDB8fHww"; // ista priroda kao login

export default function Register() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordAgain, setPasswordAgain] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (password.length < 6) {
      setErrorMsg("Password should be at least 6 characters.");
      return;
    }
    if (password !== passwordAgain) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      setErrorMsg(error.message || "Registration failed. Please try again.");
    } else {
      setSuccessMsg("Account created! Check your inbox to confirm your email.");
      setTimeout(() => navigate("/login"), 1300);
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
        "radial-gradient(circle at top, rgba(0,0,0,0.4), rgba(0,0,0,0.92))",
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
      marginBottom: 16,
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
      maxWidth: 440,
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
  };

  const [focused, setFocused] = useState({
    fullName: false,
    email: false,
    password: false,
    passwordAgain: false,
  });

  return (
    <div style={styles.page}>
      <div style={styles.bg} />
      <div style={styles.overlay} />

      <div style={styles.container}>
        {/* LOGO / BRAND TOP */}
        <div style={styles.topBrand}>
          <div style={styles.brandIcon}>🏔️</div>
          <div>
            <div style={styles.brandTextTop}>
              MEET<span style={{ color: "#00ffba" }}>OUTDOORS</span>
            </div>
            <div style={styles.brandSubTop}>
              Create your account and join the outdoor crew.
            </div>
          </div>
        </div>

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
              <span>For people who say “yes” to mountains.</span>
            </div>
            <h1 style={styles.heroTitle}>
              Your future{" "}
              <span style={{ textDecoration: "underline", textDecorationColor: "#00ffba" }}>
                hiking buddies
              </span>{" "}
              are already here.
            </h1>
            <p style={styles.heroText}>
              Build your profile, pick your favorite activities and join trips where everyone
              actually shows up, brings snacks and knows how to enjoy the view.
            </p>
            <div style={styles.heroMetaRow}>
              <div style={styles.heroMetaPill}>🏕️ Weekend getaways</div>
              <div style={styles.heroMetaPill}>🚐 Road trips & camps</div>
              <div style={styles.heroMetaPill}>🤝 Verified hosts & ratings</div>
            </div>
          </div>

          {/* RIGHT: REGISTER CARD */}

            <form style={styles.form} onSubmit={handleRegister}>
              <div>
                <div style={styles.label}>Full name</div>
                <div style={styles.inputWrapper}>
                  <input
                    type="text"
                    required
                    style={{
                      ...styles.input,
                      ...(focused.fullName ? styles.inputFocus : {}),
                    }}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    onFocus={() => setFocused((p) => ({ ...p, fullName: true }))}
                    onBlur={() => setFocused((p) => ({ ...p, fullName: false }))}
                    placeholder="John Snowpeak"
                  />
                </div>
              </div>

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

              <div>
                <div style={styles.label}>Repeat password</div>
                <div style={styles.inputWrapper}>
                  <input
                    type="password"
                    required
                    style={{
                      ...styles.input,
                      ...(focused.passwordAgain ? styles.inputFocus : {}),
                    }}
                    value={passwordAgain}
                    onChange={(e) => setPasswordAgain(e.target.value)}
                    onFocus={() => setFocused((p) => ({ ...p, passwordAgain: true }))}
                    onBlur={() => setFocused((p) => ({ ...p, passwordAgain: false }))}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button type="submit" style={styles.button} disabled={loading}>
                {loading ? "Creating account..." : "Sign up"}
              </button>

              {errorMsg && <div style={styles.messageError}>{errorMsg}</div>}
              {successMsg && <div style={styles.messageSuccess}>{successMsg}</div>}

              <div style={styles.mutedText}>
                Already have an account?
                <Link to="/login" style={styles.linkInline}>
                  Log in
                </Link>
              </div>
            </form>

            <div style={styles.bottomHint}>
              By creating an account, you agree to join only trips you can attend and to
              respect local nature and people.
            </div>
          </div>
        </div>
      </div>
  );
}