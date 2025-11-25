import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (loginError) {
      setError("Incorrect email or password.");
      return;
    }

    navigate("/");
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
          Login
        </h1>

        <p
          style={{
            fontSize: "13px",
            textAlign: "center",
            opacity: 0.8,
            marginBottom: "18px",
          }}
        >
          Welcome back! Sign in to continue.
        </p>

        <form
          onSubmit={handleLogin}
          style={{ display: "flex", flexDirection: "column", gap: "12px" }}
        >
          {/* EMAIL */}
          <label style={{ fontSize: "13px" }}>
            Email
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

          {/* PASSWORD */}
          <label style={{ fontSize: "13px" }}>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

          {/* ERROR */}
          {error && (
            <div
              style={{
                fontSize: "13px",
                marginTop: "4px",
                color: "#f87171",
              }}
            >
              {error}
            </div>
          )}

          {/* LOGIN BUTTON */}
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
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        {/* RESET PASSWORD */}
        <div
          style={{
            marginTop: "12px",
            fontSize: "13px",
            textAlign: "center",
          }}
        >
          <Link to="/reset-password" style={{ color: "#4ade80" }}>
            Forgot your password?
          </Link>
        </div>

        {/* REGISTER LINK */}
        <div
          style={{
            marginTop: "14px",
            fontSize: "13px",
            textAlign: "center",
          }}
        >
          Don’t have an account?{" "}
          <Link to="/register" style={{ color: "#4ade80" }}>
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}