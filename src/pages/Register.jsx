import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useLanguage } from "../i18n/LanguageContext";

export default function Register() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");
  const [fullName, setFullName] = useState("");

  const navigate = useNavigate();

  async function handleRegister(e) {
    e.preventDefault();
    setLoading(true);

    if (password !== repeat) {
      setError("Lozinke se ne poklapaju.");
      setLoading(false);
      return;
    }

    // 1️⃣ REGISTER USER IN SUPABASE AUTH
    const { data: regData, error: regError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: "http://localhost:3000/login",
      },
    });

    if (regError) {
      alert("Greška pri registraciji: " + regError.message);
      setLoading(false);
      return;
    }

    const userId = regData.user.id;

    // 2️⃣ INSERT INTO PROFILES
    await supabase.from("profiles").insert({
      user_id: userId,
      full_name: fullName,
      avatar_url: null,
      age: null,
      bio: "",
      is_premium: false,

      // Default trial columns — filled in step 3
      trial_start: null,
      trial_end: null,
      trial_expired: false,
    });

    // 3️⃣ TRIAL SISTEM – Aktivacija 7 dana
    const now = new Date();
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 7);

    await supabase.from("profiles").update({
      trial_start: now.toISOString(),
      trial_end: trialEnd.toISOString(),
    }).eq("user_id", userId);

    // 4️⃣ GOTOVO
    alert("Uspešna registracija! Proveri email i aktiviraj nalog.");
    setLoading(false);
    navigate("/login");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at top, #064e3b 0, #020617 55%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        paddingTop: "80px",
        paddingBottom: "40px",
      }}
    >
      <div
        style={{
          width: "95%",
          maxWidth: "420px",
          background: "rgba(15,23,42,0.9)",
          borderRadius: "18px",
          border: "1px solid rgba(148,163,184,0.3)",
          padding: "26px 22px 28px",
          color: "#e5e7eb",
          boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
        }}
      >
        <h1
          style={{
            fontSize: "26px",
            fontWeight: 700,
            textAlign: "center",
            marginBottom: "4px",
          }}
        >
          {t("auth_register_title")}
        </h1>

        <p
          style={{
            fontSize: "13px",
            textAlign: "center",
            opacity: 0.8,
            marginBottom: "18px",
          }}
        >
          Registruj nalog i potvrdi mejl da bi koristio MeetOutdoors.
        </p>

        <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          
          {/* FULL NAME */}
          <label style={{ fontSize: "13px" }}>
            Ime i prezime
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={{
                marginTop: "4px",
                width: "100%",
                padding: "9px 10px",
                borderRadius: "10px",
                border: "1px solid rgba(148,163,184,0.6)",
                backgroundColor: "rgba(15,23,42,0.8)",
                color: "#e5e7eb",
                fontSize: "14px",
              }}
              required
            />
          </label>

          <label style={{ fontSize: "13px" }}>
            {t("auth_email")}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                marginTop: "4px",
                width: "100%",
                padding: "9px 10px",
                borderRadius: "10px",
                border: "1px solid rgba(148,163,184,0.6)",
                backgroundColor: "rgba(15,23,42,0.8)",
                color: "#e5e7eb",
                fontSize: "14px",
              }}
            />
          </label>

          <label style={{ fontSize: "13px" }}>
            {t("auth_password")}
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                marginTop: "4px",
                width: "100%",
                padding: "9px 10px",
                borderRadius: "10px",
                border: "1px solid rgba(148,163,184,0.6)",
                backgroundColor: "rgba(15,23,42,0.8)",
                color: "#e5e7eb",
                fontSize: "14px",
              }}
            />
          </label>

          <label style={{ fontSize: "13px" }}>
            {t("auth_repeat_password")}
            <input
              type="password"
              value={repeat}
              onChange={(e) => setRepeat(e.target.value)}
              style={{
                marginTop: "4px",
                width: "100%",
                padding: "9px 10px",
                borderRadius: "10px",
                border: "1px solid rgba(148,163,184,0.6)",
                backgroundColor: "rgba(15,23,42,0.8)",
                color: "#e5e7eb",
                fontSize: "14px",
              }}
            />
          </label>

          {error && (
            <div style={{ marginTop: "6px", fontSize: "13px", color: "#f97373" }}>
              {error}
            </div>
          )}

          {info && (
            <div style={{ marginTop: "6px", fontSize: "13px", color: "#4ade80" }}>
              {info}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: "10px",
              width: "100%",
              padding: "10px 12px",
              borderRadius: "999px",
              border: "none",
              background: "linear-gradient(135deg, #22c55e, #4ade80)",
              color: "#022c22",
              fontWeight: 700,
              fontSize: "15px",
              cursor: "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Sačekaj..." : t("auth_register_btn")}
          </button>
        </form>

        <div
          style={{
            marginTop: "14px",
            fontSize: "13px",
            textAlign: "center",
          }}
        >
          {t("auth_yes_account")}{" "}
          <Link to="/login" style={{ color: "#4ade80" }}>
            {t("auth_login_btn")}
          </Link>
        </div>
      </div>
    </div>
  );
}