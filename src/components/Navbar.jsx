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
    let ignore = false;

    async function load() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return;

      if (!ignore) setUser(data.session.user);

      const { data: profile } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("user_id", data.session.user.id)
        .single();

      if (!ignore && profile) {
        setAvatarUrl(profile.avatar_url);
      }
    }

    load();

    const { data: sub } = supabase.auth.onAuthStateChange((_ev, session) => {
      if (!session) {
        setUser(null);
        setAvatarUrl(null);
        return;
      }

      setUser(session.user);

      supabase
        .from("profiles")
        .select("avatar_url")
        .eq("user_id", session.user.id)
        .single()
        .then(({ data }) => {
          if (data) setAvatarUrl(data.avatar_url);
        });
    });

    return () => {
      ignore = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
    navigate("/");
  }

  const isActive = (path) =>
    location.pathname === path ? { color: "#4ade80" } : {};

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
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
              filter: "drop-shadow(0 0 10px rgba(34,197,94,0.8))",
            }}
          />
          <div style={{ lineHeight: 1.2 }}>
            <span style={{ fontWeight: 700, fontSize: 16 }}>MEETOUTDOORS</span>
            <div style={{ fontSize: 11, opacity: 0.7 }}>
              connect • explore • enjoy
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* HIDDEN ON MOBILE */}
          <div style={{ display: "none", gap: 14 }}>
            <Link to="/" style={isActive("/")}>Home</Link>
            <Link to="/activities" style={isActive("/activities")}>Activities</Link>
            <Link to="/tours" style={isActive("/tours")}>Tours</Link>
            {user && <Link to="/create-tour">Create Tour</Link>}
            <Link to="/contact" style={isActive("/contact")}>Contact</Link>
          </div>

          {/* USER */}
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Link
                to="/my-profile"
                style={{ color: "white", opacity: 0.9, textDecoration: "none" }}
              >
                My Profile
              </Link>

              <div
                onClick={() => navigate("/my-profile")}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 999,
                  overflow: "hidden",
                  border: "2px solid #4ade80",
                  cursor: "pointer",
                  position: "relative",
                }}
              >
                <img
                  src={
                    avatarUrl ||
                    `https://ui-avatars.com/api/?name=${user.email}&background=047857&color=fff&size=128`
                  }
                  alt="pfp"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />

                <span
                  style={{
                    position: "absolute",
                    bottom: -1,
                    right: -1,
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    background: "#22c55e",
                    border: "2px solid #022c22",
                  }}
                />
              </div>

              <button
                onClick={logout}
                style={{
                  padding: "6px 14px",
                  fontSize: 12,
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.4)",
                  background: "transparent",
                  color: "#e5e7eb",
                  cursor: "pointer",
                }}
              >
                Logout
              </button>

              {!trialExpired && (
                <span style={{ color: "yellow" }}>⭐ {daysLeft} days left</span>
              )}
              {trialExpired && (
                <span style={{ color: "red" }}>⛔ Trial expired</span>
              )}
            </div>
          ) : (
            <>
              <Link
                to="/login"
                style={{ color: "white", textDecoration: "none" }}
              >
                Login
              </Link>

              <Link
                to="/register"
                style={{
                  background: "linear-gradient(135deg, #22c55e, #4ade80)",
                  padding: "7px 16px",
                  borderRadius: 999,
                  color: "#022c22",
                  fontWeight: 600,
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
              color: "white",
              fontSize: 22,
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            ☰
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: 70,
            right: 10,
            width: 220,
            background: "rgba(3,57,0,0.95)",
            borderRadius: 14,
            padding: 15,
            display: "flex",
            flexDirection: "column",
            gap: 12,
            boxShadow: "0 4px 20px rgba(0,0,0,0.6)",
            zIndex: 9999,
          }}
        >
          <Link to="/" style={mobileItem}>Home</Link>
          <Link to="/activities" style={mobileItem}>Activities</Link>
          <Link to="/tours" style={mobileItem}>Tours</Link>
          <Link to="/contact" style={mobileItem}>Contact</Link>
          {user && <Link to="/create-tour" style={mobileCreate}>Create Tour</Link>}
          {user && <Link to="/my-profile" style={mobileItem}>My Profile</Link>}
        </div>
      )}
    </nav>
  );
}

const mobileItem = {
  color: "white",
  background: "rgba(255,255,255,0.08)",
  padding: 12,
  borderRadius: 10,
  textAlign: "center",
  textDecoration: "none",
  fontSize: 16,
};

const mobileCreate = {
  color: "white",
  background: "rgba(76,175,80,0.8)",
  padding: 12,
  borderRadius: 10,
  textAlign: "center",
  textDecoration: "none",
  fontSize: 16,
};