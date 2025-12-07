import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { Link } from "react-router-dom";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState("");

  async function handleRegister(e) {
    e.preventDefault();
    setLoading(true);
    setInfo("");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        // Po želji promeni redirect url za verifikaciju
        emailRedirectTo: window.location.origin + "/login",
      },
    });

    setLoading(false);

    if (error) {
      alert(error.message);
    } else {
      setInfo(
        "Check your email to confirm your account before logging in."
      );
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#05140d",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
      }}
    >
      <div
        style={{
          width: "90%",
          maxWidth: "400px",
          background: "rgba(0,0,0,0.6)",
          padding: "24px",
          borderRadius: "16px",
        }}
      >
        <h2 style={{ marginBottom: "16px", textAlign: "center" }}>Register</h2>

        <form onSubmit={handleRegister}>
          <label>Full name</label>
          <input
            style={inputStyle}
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />

          <label>Email</label>
          <input
            style={inputStyle}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Password</label>
          <input
            style={inputStyle}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: "12px",
              width: "100%",
              padding: "10px",
              borderRadius: "10px",
              border: "none",
              background:
                "linear-gradient(135deg, #00ff9c, #00c46a)",
              color: "#022012",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>

        {info && (
          <p
            style={{
              marginTop: "10px",
              fontSize: "14px",
              color: "#a0ffa0",
              textAlign: "center",
            }}
          >
            {info}
          </p>
        )}

        <p style={{ marginTop: "12px", textAlign: "center", fontSize: "14px" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "#00ff9c" }}>
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "10px",
  marginTop: "4px",
  marginBottom: "12px",
  borderRadius: "10px",
  border: "none",
  background: "rgba(255,255,255,0.08)",
  color: "white",
};