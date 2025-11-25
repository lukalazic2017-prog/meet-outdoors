import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  async function handleRegister(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    if (password !== repeat) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    if (!fullName.trim()) {
      setError("Please enter your full name.");
      setLoading(false);
      return;
    }

    // 1️⃣ Register user in Supabase Auth
    const { data: regData, error: regError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: "http://localhost:3000/login",
      },
    });

    if (regError) {
      setError("Registration failed: " + regError.message);
      setLoading(false);
      return;
    }

    const userId = regData.user.id;

    // 2️⃣ Insert profile row
    await supabase.from("profiles").insert({
      user_id: userId,
      full_name: fullName,
      avatar_url: null,
      age: null,
      bio: "",
      is_premium: false,
      // trial columns, will be set in step 3
      trial_start: null,
      trial_end: null,
      trial_expired: false,
    });

    // 3️⃣ Trial system – activate 7 days
    const now = new Date();
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 7);

    await supabase
      .from("profiles")
      .update({
        trial_start: now.toISOString(),
        trial_end: trialEnd.toISOString(),
      })
      .eq("user_id", userId);

    // 4️⃣ Done
    setInfo("Registration successful! Please check your email to verify your account.");
    alert("Registration successful! Check your email and activate your account.");
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
          Create an account
        </h1>

        <p
          style={{
            fontSize: "13px",
            textAlign: "center",
            opacity: 0.8,
            marginBottom: "18px",
          }}
        >
          Sign up and confirm your email to start using MeetOutdoors.
        </p>

        <form
          onSubmit={handleRegister}
          style={{ display: "flex", flexDirection: "column", gap: "10px" }}
        >
          {/* FULL NAME */}
          <label style={{ fontSize: "13px" }}>
            Full name
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

          {/* REPEAT PASSWORD */}
          <label style={{ fontSize: "13px" }}>
            Repeat password
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
              required
            />
          </label>

          {/* ERROR */}
          {error && (
            <div
              style={{
                marginTop: "6px",
                fontSize: "13px",
                color: "#f97373",
              }}
            >
              {error}
            </div>
          )}

          {/* INFO */}
          {info && (
            <div
              style={{
                marginTop: "6px",
                fontSize: "13px",
                color: "#4ade80",
              }}
            >
              {info}
            </div>
          )}

          {/* SUBMIT */}
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
            {loading ? "Please wait..." : "Sign up"}
          </button>
        </form>

        <div
          style={{
            marginTop: "14px",
            fontSize: "13px",
            textAlign: "center",
          }}
        >
          Already have an account?{" "}
          <Link to="/login" style={{ color: "#4ade80" }}>
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}