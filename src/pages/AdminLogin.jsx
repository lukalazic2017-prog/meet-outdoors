import React, { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";

function AdminLoginStyles() {
  return (
    <style>{`
      .adminLoginPage {
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 32px 20px;
        background:
          radial-gradient(circle at 15% 20%, rgba(51, 214, 159, 0.12), transparent 28%),
          radial-gradient(circle at 85% 10%, rgba(68, 128, 255, 0.1), transparent 30%),
          #07110f;
        color: #f4f8f7;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      .adminLoginCard {
        width: min(100%, 460px);
        border: 1px solid rgba(255, 255, 255, 0.09);
        border-radius: 28px;
        padding: 34px;
        background: rgba(11, 24, 21, 0.88);
        box-shadow: 0 30px 80px rgba(0, 0, 0, 0.35);
        backdrop-filter: blur(18px);
      }

      .adminLoginBrand {
        display: flex;
        align-items: center;
        gap: 14px;
        margin-bottom: 28px;
      }

      .adminLoginMark {
        width: 46px;
        height: 46px;
        display: grid;
        place-items: center;
        border-radius: 15px;
        background: linear-gradient(135deg, #22c98f, #0a8f68);
        color: #04100c;
        font-weight: 900;
        box-shadow: 0 12px 30px rgba(34, 201, 143, 0.25);
      }

      .adminLoginBrand small,
      .adminLoginIntro span {
        display: block;
        color: #69d6b2;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.15em;
        text-transform: uppercase;
      }

      .adminLoginBrand strong {
        display: block;
        margin-top: 4px;
        font-size: 17px;
      }

      .adminLoginIntro h1 {
        margin: 8px 0 10px;
        font-size: clamp(30px, 6vw, 42px);
        line-height: 1.05;
        letter-spacing: -0.04em;
      }

      .adminLoginIntro p {
        margin: 0 0 28px;
        color: #9eb0aa;
        line-height: 1.6;
        font-size: 14px;
      }

      .adminLoginForm {
        display: grid;
        gap: 16px;
      }

      .adminLoginField {
        display: grid;
        gap: 8px;
      }

      .adminLoginField span {
        color: #cad5d1;
        font-size: 13px;
        font-weight: 700;
      }

      .adminLoginField input {
        width: 100%;
        box-sizing: border-box;
        border: 1px solid rgba(255, 255, 255, 0.09);
        border-radius: 15px;
        padding: 14px 15px;
        background: rgba(255, 255, 255, 0.045);
        color: #fff;
        outline: none;
        font: inherit;
        transition: 0.2s ease;
      }

      .adminLoginField input:focus {
        border-color: rgba(71, 225, 174, 0.65);
        box-shadow: 0 0 0 4px rgba(71, 225, 174, 0.08);
      }

      .adminLoginError {
        margin: 0;
        border: 1px solid rgba(255, 93, 93, 0.22);
        border-radius: 14px;
        padding: 12px 14px;
        background: rgba(255, 74, 74, 0.08);
        color: #ffb1b1;
        font-size: 13px;
        line-height: 1.45;
      }

      .adminLoginButton {
        width: 100%;
        border: 0;
        border-radius: 15px;
        padding: 15px 18px;
        margin-top: 4px;
        background: linear-gradient(135deg, #31d59d, #149c71);
        color: #06120e;
        font: inherit;
        font-weight: 900;
        cursor: pointer;
        transition: transform 0.2s ease, opacity 0.2s ease;
      }

      .adminLoginButton:hover:not(:disabled) {
        transform: translateY(-1px);
      }

      .adminLoginButton:disabled {
        opacity: 0.62;
        cursor: wait;
      }

      .adminLoginFoot {
        margin: 22px 0 0;
        padding-top: 20px;
        border-top: 1px solid rgba(255, 255, 255, 0.07);
        color: #71847d;
        font-size: 12px;
        line-height: 1.55;
      }

      @media (max-width: 520px) {
        .adminLoginPage { padding: 18px 14px; }
        .adminLoginCard { padding: 26px 20px; border-radius: 22px; }
      }
    `}</style>
  );
}

export default function AdminLogin() {
  const navigate = useNavigate();
  const {
    user,
    profile,
    loading: authLoading,
    reloadAuth,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && user && profile?.is_admin === true) {
      navigate("/admin/explore", { replace: true });
    }
  }, [authLoading, navigate, profile?.is_admin, user]);

  if (!authLoading && user && profile?.is_admin === true) {
    return <Navigate to="/admin/explore" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      setError("Unesi admin email i lozinku.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      const { data: loginData, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

      if (loginError) throw loginError;

      const adminUser = loginData?.user;

      if (!adminUser) {
        throw new Error("Admin sesija nije kreirana.");
      }

      const { data: adminProfile, error: profileError } = await supabase
        .from("profiles")
        .select("id, is_admin, account_status")
        .eq("id", adminUser.id)
        .single();

      if (profileError) throw profileError;

      if (adminProfile?.is_admin !== true) {
        await supabase.auth.signOut();
        throw new Error("Ovaj nalog nema administratorski pristup.");
      }

      if (
        adminProfile.account_status &&
        adminProfile.account_status !== "active"
      ) {
        await supabase.auth.signOut();
        throw new Error("Administratorski nalog trenutno nije aktivan.");
      }

      await reloadAuth();
      navigate("/admin/explore", { replace: true });
    } catch (loginError) {
      console.error("Admin login error:", loginError);

      const message = String(loginError?.message || "").toLowerCase();

      if (
        message.includes("invalid login credentials") ||
        message.includes("invalid credentials")
      ) {
        setError("Pogrešan admin email ili lozinka.");
      } else {
        setError(
          loginError?.message ||
            "Admin prijava trenutno nije uspela."
        );
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <AdminLoginStyles />

      <main className="adminLoginPage">
        <section className="adminLoginCard">
          <div className="adminLoginBrand">
            <div className="adminLoginMark">M</div>
            <div>
              <small>MeetOutdoors</small>
              <strong>Control Center</strong>
            </div>
          </div>

          <div className="adminLoginIntro">
            <span>Administratorski pristup</span>
            <h1>Admin prijava</h1>
            <p>
              Prijavi se direktno administratorskim nalogom. Nije potrebno
              prethodno ulaziti preko korisničkog ili host profila.
            </p>
          </div>

          <form className="adminLoginForm" onSubmit={handleSubmit}>
            <label className="adminLoginField">
              <span>Email</span>
              <input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@..."
                disabled={busy}
              />
            </label>

            <label className="adminLoginField">
              <span>Lozinka</span>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                disabled={busy}
              />
            </label>

            {error && <p className="adminLoginError">{error}</p>}

            <button
              type="submit"
              className="adminLoginButton"
              disabled={busy}
            >
              {busy ? "Prijavljujemo..." : "Uđi u Control Center"}
            </button>
          </form>

          <p className="adminLoginFoot">
            Pristup je dozvoljen samo nalozima kojima je u MeetOutdoors bazi
            dodeljen administratorski status.
          </p>
        </section>
      </main>
    </>
  );
}
