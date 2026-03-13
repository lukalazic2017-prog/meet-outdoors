// src/pages/Register.jsx
import React, { useMemo, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

const BG_IMAGE =
  "https://images.unsplash.com/photo-1480241352829-e1573ff2414e?w=1600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NTh8fG1vdW50YWlufGVufDB8fDB8fHww";

export default function Register() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordAgain, setPasswordAgain] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [focused, setFocused] = useState({
    fullName: false,
    email: false,
    password: false,
    passwordAgain: false,
  });

  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 900 : false
  );

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

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

    const { error } = await supabase.auth.signUp({
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

  const passwordStrength = useMemo(() => {
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;

    if (score <= 1) return { label: "Weak", width: "28%" };
    if (score <= 3) return { label: "Good", width: "68%" };
    return { label: "Strong", width: "100%" };
  }, [password]);

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
        backgroundImage:  `url(${BG_IMAGE})`,
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
          "radial-gradient(circle at 15% 0%, rgba(0,255,186,0.12), transparent 28%)," +
          "radial-gradient(circle at 100% 0%, rgba(0,180,255,0.12), transparent 24%)," +
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
          : "minmax(0, 1.22fr) minmax(410px, 0.88fr)",
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
        maxWidth: 720,
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
        maxWidth: isMobile ? "100%" : 450,
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

      passwordBarWrap: {
        marginTop: 4,
      },

      passwordBar: {
        width: "100%",
        height: 8,
        borderRadius: 999,
        background: "rgba(255,255,255,0.08)",
        overflow: "hidden",
      },

      passwordBarFill: {
        height: "100%",
        borderRadius: 999,
        width: passwordStrength.width,
        background:
          passwordStrength.label === "Weak"
            ? "linear-gradient(90deg, #ff6b6b, #ff8b8b)"
            : passwordStrength.label === "Good"
            ? "linear-gradient(90deg, #ffd166, #ffe08a)"
            : "linear-gradient(90deg, #00ffba, #4bffd5)",
        transition: "all 0.25s ease",
      },

      passwordMeta: {
        marginTop: 6,
        display: "flex",
        justifyContent: "space-between",
        gap: 10,
        fontSize: 11,
        color: "rgba(220,240,232,0.76)",
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
    [isMobile, loading, passwordStrength]
  );

  return (
    <div style={styles.page}>
      <div style={styles.bg} />
      <div style={styles.overlay} />
      <div style={styles.gridPattern} />

      <div style={styles.container}>
        <div style={styles.topBar}>
          <div style={styles.topBrand}>
            <div style={styles.brandIcon}>🏔️</div>
            <div>
              <div style={styles.brandTextTop}>MeetOutdoors</div>
              <div style={styles.brandSubTop}>CREATE • CONNECT • EXPLORE</div>
            </div>
          </div>

          <div style={styles.topAction}>✨ Start your adventure</div>
        </div>

        <div style={styles.contentRow}>
          <div style={styles.leftHero}>
            <div style={styles.pill}>
              <span style={styles.pillDot} />
              <span>For people who say yes to mountains.</span>
            </div>

            <h1 style={styles.heroTitle}>
              Your future hiking buddies are already here.
            </h1>

            <p style={styles.heroText}>
              Build your profile, pick your favorite activities and join trips
              where people actually show up, bring good energy and know how to
              enjoy the view.
            </p>

            <div style={styles.heroMetaRow}>
              <div style={styles.heroMetaPill}>🏕️ Weekend getaways</div>
              <div style={styles.heroMetaPill}>🚐 Road trips & camps</div>
              <div style={styles.heroMetaPill}>🤝 Verified hosts & ratings</div>
            </div>

            <div style={styles.featureGrid}>
              <div style={styles.featureCard}>
                <div style={styles.featureNumber}>Fast</div>
                <div style={styles.featureLabel}>
                  Create your account in under a minute and start exploring.
                </div>
              </div>

              <div style={styles.featureCard}>
                <div style={styles.featureNumber}>Real</div>
                <div style={styles.featureLabel}>
                  Meet real outdoor people, not random empty profiles.
                </div>
              </div>

              <div style={styles.featureCard}>
                <div style={styles.featureNumber}>Wild</div>
                <div style={styles.featureLabel}>
                  Mountains, lakes, trails and community in one place.
                </div>
              </div>
            </div>
          </div>

          <div style={styles.rightWrap}>
            <div style={styles.card}>
              <div style={styles.cardGlow} />

              <div style={styles.cardHeader}>
                <div style={styles.cardTitle}>Create account</div>
                <div style={styles.cardSubtitle}>
                  Join MeetOutdoors and start building your next outdoor story.
                </div>

                <div style={styles.dividerWrapper}>
                  <div style={styles.dividerLine} />
                  <div style={styles.dividerLine} />
                  <div style={styles.dividerLine} />
                </div>
              </div>

              <form style={styles.form} onSubmit={handleRegister}>
                <div style={styles.inputBlock}>
                  <div style={styles.label}>Full name</div>
                  <div style={styles.inputWrapper}>
                    <span style={styles.inputIcon}>👤</span>
                    <input
                      type="text"
                      required
                      style={{
                        ...styles.input,
                        ...(focused.fullName ? styles.inputFocus : {}),
                      }}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      onFocus={() =>
                        setFocused((p) => ({ ...p, fullName: true }))
                      }
                      onBlur={() =>
                        setFocused((p) => ({ ...p, fullName: false }))
                      }
                      placeholder="John Snowpeak"
                    />
                  </div>
                </div>

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

                  <div style={styles.passwordBarWrap}>
                    <div style={styles.passwordBar}>
                      <div style={styles.passwordBarFill} />
                    </div>
                    <div style={styles.passwordMeta}>
                      <span>Password strength</span>
                      <span>{password ? passwordStrength.label : "—"}</span>
                    </div>
                  </div>
                </div>

                <div style={styles.inputBlock}>
                  <div style={styles.label}>Repeat password</div>
                  <div style={styles.inputWrapper}>
                    <span style={styles.inputIcon}>✅</span>
                    <input
                      type="password"
                      required
                      style={{
                        ...styles.input,
                        ...(focused.passwordAgain ? styles.inputFocus : {}),
                      }}
                      value={passwordAgain}
                      onChange={(e) => setPasswordAgain(e.target.value)}
                      onFocus={() =>
                        setFocused((p) => ({ ...p, passwordAgain: true }))
                      }
                      onBlur={() =>
                        setFocused((p) => ({ ...p, passwordAgain: false }))
                      }
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <button type="submit" style={styles.button} disabled={loading}>
                  {loading ? "Creating account..." : "Sign up"}
                </button>

                {errorMsg && <div style={styles.messageError}>{errorMsg}</div>}
                {successMsg && (
                  <div style={styles.messageSuccess}>{successMsg}</div>
                )}

                <div style={styles.mutedText}>
                  Already have an account?
                  <Link to="/login" style={styles.linkInline}>
                    Log in
                  </Link>
                </div>
              </form>

              <div style={styles.bottomHint}>
                By creating an account, you agree to join only trips you can
                attend and to respect local nature and people.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}