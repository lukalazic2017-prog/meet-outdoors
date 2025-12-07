import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
    } else {
      navigate("/my-profile");
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
        <h2 style={{ marginBottom: "16px", textAlign: "center" }}>Login</h2>

        <form onSubmit={handleLogin}>
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
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p style={{ marginTop: "12px", textAlign: "center", fontSize: "14px" }}>
          Don't have an account?{" "}
          <Link to="/register" style={{ color: "#00ff9c" }}>
            Register
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