import { useState } from "react";
import {supabase} from "../supabaseClient";

export default function UpdatePassword() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleUpdate(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setMessage("❌ " + error.message);
      setLoading(false);
      return;
    }

    setMessage("✅ Lozinka je uspešno promenjena! Možete se prijaviti.");
    setLoading(false);
  }

  return (
    <div
      style={{
        minHeight: "90vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #0c241a, #0d3b2e)",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          padding: "35px",
          borderRadius: "20px",
          background: "rgba(255, 255, 255, 0.08)",
          backdropFilter: "blur(14px)",
          boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
          color: "white",
          textAlign: "center",
        }}
      >
        <h2 style={{ marginBottom: "25px", fontSize: "28px", fontWeight: "600" }}>
          🔒 Nova lozinka
        </h2>

        {message && (
          <div
            style={{
              background: "rgba(0,0,0,0.4)",
              padding: "12px",
              borderRadius: "10px",
              marginBottom: "20px",
              fontSize: "15px",
            }}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleUpdate}>
          <input
            type="password"
            placeholder="Unesite novu lozinku"
            value={password}
            required
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%",
              padding: "14px",
              marginBottom: "15px",
              borderRadius: "10px",
              border: "1px solid #ffffff33",
              background: "rgba(255,255,255,0.15)",
              color: "white",
              fontSize: "15px",
            }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "10px",
              border: "none",
              background: "#18a558",
              color: "white",
              fontSize: "16px",
              cursor: "pointer",
              fontWeight: "600",
              transition: "0.3s",
            }}
          >
            {loading ? "Učitavanje..." : "Sačuvaj novu lozinku"}
          </button>
        </form>
      </div>
    </div>
  );
}