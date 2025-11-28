import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useTrial } from "../i18n/TrialContext";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  const { trialExpired, daysLeft } = useTrial();
  const location = useLocation();
  const navigate = useNavigate();

  // LOAD SESSION
  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return;

      setUser(data.session.user);

      const { data: profile } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("user_id", data.session.user.id)
        .single();

      if (profile) setAvatarUrl(profile.avatar_url);
    }

    load();

    const { data: sub } = supabase.auth.onAuthStateChange((_ev, session) => {
      if (!session) {
        setUser(null);
        setAvatarUrl(null);
      } else {
        setUser(session.user);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    navigate("/");
  }

  const isActive = (path) =>
    location.pathname === path
      ? { color: "#4ade80", fontWeight: 700 }
      : { color: "white" };

  return (
    <nav
      style={{
        position: "fixed",
        inset: 0,
        height: 66,
        zIndex: 50,
        backdropFilter: "blur(12px)",
        background:
          "linear-gradient(90deg, rgba(4,24,18,0.95), rgba(4,35,28,0.95))",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          height: "100%",
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          color: "white",
        }}
      >
        {/* LOGO */}
        <div
          onClick={() => navigate("/")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            cursor: "pointer",
          }}
        >
          <img
            src="/logo.svg"
            alt="logo"
            style={{
              width: 34,
              height: 34,
              filter: "drop-shadow(0 0 10px rgba(34,197,94,0.6))",
            }}
          />
          <div style={{ lineHeight: 1.2 }}>
            <span style={{ fontWeight: 700, fontSize: 16 }}>MEETOUTDOORS</span>
            <div style={{ fontSize: 11, opacity: 0.7 }}>
              connect • explore • enjoy
            </div>
          </div>
        </div>

        {/* RIGHT SECTION */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* DESKTOP LINKS */}
          <div
            style={{
              display: window.innerWidth > 768 ? "flex" : "none",
              gap: 20,
              fontSize: 15,
            }}
          >
            <Link to="/" style={{ textDecoration: "none", ...isActive("/") }}>
              Home
            </Link>

            <Link
              to="/activities"
              style={{ textDecoration: "none", ...isActive("/activities") }}
            >
              Activities
            </Link>

            <Link
              to="/tours"
              style={{ textDecoration: "none", ...isActive("/tours") }}
            >
              Tours
            </Link>

            <Link
              to="/contact"
              style={{ textDecoration: "none", ...isActive("/contact") }}
            >
              Contact
            </Link>

            {user && (
              <Link
                to="/create-tour"
                style={{
                  background: "#4ade80",
                  padding: "6px 14px",
                  borderRadius: 999,
                  color: "#022c22",
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                + Create Tour
              </Link>
            )}
          </div>

          {/* USER SECTION */}
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Link
                to="/my-profile"
                style={{ color: "white", textDecoration: "none" }}
              >
                Profile
              </Link>

              <img
                src={
                  avatarUrl ||
                  `https://ui-avatars.com/api/?name=${user.email}&background=22c55e&color=fff`
                }
                alt="pfp"
                onClick={() => navigate("/my-profile")}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2px solid #4ade80",
                  cursor: "pointer",
                }}
              />

              <button
                onClick={logout}
                style={{
                  padding: "6px 12px",
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.5)",
                  background: "transparent",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                Logout
              </button>

              {!trialExpired && (
                <span style={{ color: "yellow", fontSize: 13 }}>
                  ⭐ {daysLeft} days left
                </span>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" style={{ color: "white", textDecoration: "none" }}>
                Login
              </Link>

              <Link
                to="/register"
                style={{
                  background: "linear-gradient(135deg, #22c55e, #4ade80)",
                  padding: "7px 16px",
                  borderRadius: 999,
                  color: "#022c22",
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                Register
              </Link>
            </>
          )}

          {/* MOBILE MENU BUTTON */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            style={{
              display: window.innerWidth <= 768 ? "block" : "none",
              color: "white",
              fontSize: 26,
              background: "none",
              border: "none",
              cursor: "pointer",
              marginLeft: 6,
            }}
          >
            ☰
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      {isOpen && window.innerWidth <= 768 && (
        <div
          style={{
            position: "absolute",
            top: 66,
            right: 16,
            width: 220,
            background: "rgba(3,57,0,0.95)",
            borderRadius: 16,
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 14,
            boxShadow: "0 8px 20px rgba(0,0,0,0.6)",
          }}
        >
          <Link to="/" style={mobileItem}>Home</Link>
          <Link to="/activities" style={mobileItem}>Activities</Link>
          <Link to="/tours" style={mobileItem}>Tours</Link>
          <Link to="/contact" style={mobileItem}>Contact</Link>

          {user && <Link to="/create-tour" style={mobileCreate}>Create Tour</Link>}
          {user && <Link to="/my-profile" style={mobileItem}>Profile</Link>}
        </div>
      )}
    </nav>
  );
}

const mobileItem = {
  color: "white",
  background: "rgba(255,255,255,0.12)",
  padding: 12,
  borderRadius: 10,
  textAlign: "center",
  textDecoration: "none",
  fontSize: 16,
};

const mobileCreate = {
  color: "#022c22",
  background: "#4ade80",
  padding: 12,
  borderRadius: 10,
  textAlign: "center",
  textDecoration: "none",
  fontSize: 16,
  fontWeight: 700,
};