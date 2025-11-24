import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useLanguage } from "../i18n/LanguageContext";
import { useNavigate } from "react-router-dom";

export default function ResetPassword() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleReset(e) {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Unesi email.");
      return;
    }

    setLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password,`
    });

    setLoading(false);

    if (resetError) {
      setError("Ne postoji nalog sa tim emailom.");
      return;
    }

    setSent(true);
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
          background: "rgba(15,23,42,0.92)",
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
          Reset lozinke
        </h1>

        <p
          style={{
            fontSize: "13px",
            textAlign: "center",
            opacity: 0.8,
            marginBottom: "18px",
          }}
        >
          Unesi email i poslaćemo ti link za reset lozinke.
        </p>

        {sent ? (
          <div
            style={{
              textAlign: "center",
              color: "#4ade80",
              fontSize: "14px",
              fontWeight: 600,
              padding: "20px 0",
            }}
          >
            ✔ Email uspešno poslat!  
            Proveri inbox i klikni na link.
          </div>
        ) : (
          <form
            onSubmit={handleReset}
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <label style={{ fontSize: "13px" }}>
              Email adresa:
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  marginTop: "4px",
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "1px solid rgba(148,163,184,0.6)",
                  backgroundColor: "rgba(15,23,42,0.8)",
                  color: "#e5e7eb",
                  fontSize: "14px",
                }}
              />
            </label>

            {error && (
              <div
                style={{
                  fontSize: "13px",
                  color: "#f87171",
                  marginTop: "-4px",
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: "6px",
                width: "100%",
                padding: "11px 14px",
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
              {loading ? "Slanje..." : "Pošalji link"}
            </button>
          </form>
        )}

        <div
          style={{
            marginTop: "18px",
            fontSize: "13px",
            textAlign: "center",
          }}
        >
          <span
            onClick={() => navigate("/login")}
            style={{ color: "#4ade80", cursor: "pointer" }}
          >
            ↩ Nazad na prijavu
          </span>
        </div>
      </div>
    </div>
  );
}