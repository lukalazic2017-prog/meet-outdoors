// src/components/Navbar.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [avatarUrl, setAvatarUrl] = useState(null);

  const [activitiesOpen, setActivitiesOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // ----------------- LOAD USER + AVATAR + NOTIFICATIONS -----------------
  useEffect(() => {
    async function loadEverything() {
      const { data: auth } = await supabase.auth.getUser();
      const currentUser = auth?.user || null;
      setUser(currentUser);

      if (!currentUser) return;

      // avatar
      const { data: profile } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", currentUser.id)
        .single();

      if (profile?.avatar_url) {
        setAvatarUrl(profile.avatar_url + `?t=${Date.now()}`);
      }

      // notifications
      const { data: notes } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false });

      setNotifications(notes || []);
    }

    loadEverything();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      loadEverything();
    });

    return () => listener?.subscription?.unsubscribe();
  }, []);

  // ----------------- REALTIME NOTIFICATIONS -----------------
  useEffect(() => {
    async function connectRealtime() {
      const { data: auth } = await supabase.auth.getUser();
      const currentUser = auth?.user;
      if (!currentUser) return;

      const channel = supabase
        .channel(`notifications:${currentUser.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${currentUser.id}`,
          },
          (payload) => {
            setNotifications((prev) => [payload.new, ...prev]);
          }
        )
        .subscribe();

      return () => supabase.removeChannel(channel);
    }

    connectRealtime();
  }, []);

  // ----------------- RESPONSIVE -----------------
  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 768);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ----------------- HELPERS -----------------
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate("/login");
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  const linkStyle = (path) => ({
    color: isActive(path) ? "#00ffb0" : "rgba(255,255,255,0.78)",
    fontWeight: isActive(path) ? 700 : 500,
    fontSize: 16,
    textDecoration: "none",
    padding: "6px 14px",
    borderRadius: 999,
    background: isActive(path) ? "rgba(0,255,160,0.16)" : "transparent",
    boxShadow: isActive(path)
      ? "0 0 18px rgba(0,255,160,0.25)"
      : "none",
    transition: "all 0.22s ease",
  });

  const activityItems = [
    "Hiking",
    "Cycling",
    "Bicycling",
    "Paragliding",
    "Parasailing",
    "Running / Marathon",
    "Pilgrimage",
    "Horse Riding",
    "Fishing",
    "Rafting",
    "Quad Riding",
    "Skiing & Snowboarding",
    "Water Skiing",
    "Skydiving",
    "Bungee Jumping",
    "Camping",
    "Diving",
    "Snorkeling",
    "Boat Rides",
  ];

  const goToActivity = (name) => {
    setActivitiesOpen(false);
    navigate(`/tours?activity=${encodeURIComponent(name)}`);
  };

  // ----------------- RENDER -----------------
  return (
    <>
      <header
        style={{
          width: "100%",
          position: "sticky",
          top: 0,
          zIndex: 999,
          background:
            "linear-gradient(90deg, rgba(4,20,12,0.95), rgba(3,18,16,0.96))",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          boxShadow: "0 12px 30px rgba(0,0,0,0.7)",
        }}
      >
        <nav
          style={{
            maxWidth: 1300,
            margin: "0 auto",
            padding: "10px 22px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 18,
          }}
        >
          {/* BRAND */}
          <div
            onClick={() => navigate("/")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              cursor: "pointer",
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 16,
                background:
                  "radial-gradient(circle at 30% 20%, #00ffb8 0, #009a61 45%, #013222 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 18px rgba(0,255,180,0.5)",
              }}
            >
              <span style={{ fontSize: 24 }}>🏔️</span>
            </div>

            <div>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  letterSpacing: 1.1,
                  textTransform: "uppercase",
                  color: "#ffffff",
                }}
              >
                MEET
                <span
                  style={{
                    color: "#00ffb8",
                    textShadow: "0 0 10px rgba(0,255,184,0.9)",
                  }}
                >
                  OUTDOORS
                </span>
              </div>

              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)" }}>
                Explore. Connect. Adventure together.
              </div>
            </div>
          </div>

          {/* DESKTOP LINKS */}
          {!isMobile && (
            <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
              <Link to="/" style={linkStyle("/")}>Home</Link>

              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <Link to="/activities" style={linkStyle("/activities")}>
                  Activities
                </Link>
                <button
                  onClick={() => setActivitiesOpen((p) => !p)}
                  style={{
                    background: "transparent",
                    color: "white",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 16,
                  }}
                >
                  ▾
                </button>

                {activitiesOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: 38,
                      left: 0,
                      padding: 14,
                      borderRadius: 14,
                      background: "rgba(3,22,15,0.98)",
                      minWidth: 320,
                      boxShadow: "0 18px 40px rgba(0,0,0,0.8)",
                      zIndex: 1200,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        color: "rgba(255,255,255,0.55)",
                        marginBottom: 8,
                        textTransform: "uppercase",
                      }}
                    >
                      Popular activities
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2,1fr)",
                        gap: 8,
                      }}
                    >
                      {activityItems.map((item) => (
                        <button
                          key={item}
                          onClick={() => goToActivity(item)}
                          style={{
                            borderRadius: 10,
                            padding: "7px 9px",
                            background: "rgba(255,255,255,0.03)",
                            color: "white",
                            border: "none",
                            cursor: "pointer",
                            fontSize: 13,
                          }}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Link to="/create-tour" style={linkStyle("/create-tour")}>
                Create Tour
              </Link>

              <Link to="/contact" style={linkStyle("/contact")}>
                Contact
              </Link>

              <Link to="/tours" style={linkStyle("/tours")}>
                Tours
              </Link>
            </div>
          )}

          {/* RIGHT SECTION */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* NOTIFICATION BELL */}
            {user && (
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => {
                    setNotificationsOpen((p) => !p);
                    setUserMenuOpen(false);
                    setActivitiesOpen(false);
                  }}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "rgba(0,0,0,0.45)",
                    border: "1px solid rgba(255,255,255,0.28)",
                    cursor: "pointer",
                    fontSize: 18,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                  }}
                >
                  🔔

                  {notifications.length > 0 && (
                    <span
                      style={{
                        position: "absolute",
                        top: -4,
                        right: -4,
                        background: "#ff3333",
                        color: "white",
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        fontSize: 11,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 0 6px rgba(255,0,0,0.8)",
                      }}
                    >
                      {notifications.length}
                    </span>
                  )}
                </button>

                {/* NOTIF DROPDOWN */}
                {notificationsOpen && (
                  <div
                    style={{
                      position: "absolute",
                      right: 0,
                      top: 42,
                      width: 260,
                      padding: 12,
                      background: "rgba(3,22,15,0.98)",
                      borderRadius: 16,
                      maxHeight: 320,
                      overflowY: "auto",
                      boxShadow:
                        "0 16px 38px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)",
                    }}
                  >
                    <div
                      style={{
                        color: "white",
                        fontWeight: 600,
                        fontSize: 13,
                        marginBottom: 6,
                      }}
                    >
                      Notifications
                    </div>

                    {notifications.length === 0 && (
                      <div style={{ color: "white", opacity: 0.6 }}>
                        You're all caught up 🌿
                      </div>
                    )}

                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        style={{
                          background: "rgba(255,255,255,0.04)",
                          padding: 8,
                          borderRadius: 12,
                          marginBottom: 6,
                          color: "white",
                          fontSize: 13,
                        }}
                      >
                        {n.message}
                        <div
                          style={{
                            opacity: 0.6,
                            fontSize: 11,
                            marginTop: 2,
                          }}
                        >
                          {new Date(n.created_at).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* AVATAR */}
            {user && (
              <div style={{ position: "relative" }}>
                <div
                  onClick={() => {
                    setUserMenuOpen((p) => !p);
                    setNotificationsOpen(false);
                    setActivitiesOpen(false);
                  }}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    border: "2px solid #00ffb0",
                    overflow: "hidden",
                    cursor: "pointer",
                    position: "relative",
                    boxShadow: "0 0 14px rgba(0,255,160,0.55)",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      bottom: -1,
                      right: -1,
                      width: 11,
                      height: 11,
                      borderRadius: "50%",
                      background: "#00ff80",
                      border: "2px solid #04140c",
                      boxShadow: "0 0 10px #00ff80",
                    }}
                  />

                  <img
                    src={avatarUrl || "https://i.pravatar.cc/300"}
                    alt="avatar"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>

                {userMenuOpen && (
                  <div
                    style={{
                      position: "absolute",
                      right: 0,
                      top: 46,
                      width: 220,
                      borderRadius: 16,
                      padding: 10,
                      background: "rgba(3,22,15,0.98)",
                      boxShadow:
                        "0 18px 40px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.05)",
                    }}
                  >
                    <div
                      style={{
                        padding: "6px 8px 10px",
                        borderBottom: "1px solid rgba(255,255,255,0.07)",
                        marginBottom: 6,
                      }}
                    >
                      <div style={{ fontSize: 13, color: "white", fontWeight: 600 }}>
                        {user.email}
                      </div>

                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>
                        Signed in
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        navigate(`/profile/${user.id}`);
                        setUserMenuOpen(false);
                      }}
                      style={userMenuItem}
                    >
                      Profile
                    </button>

                    <button
                      onClick={() => {
                        navigate("/my-tours");
                        setUserMenuOpen(false);
                      }}
                      style={userMenuItem}
                    >
                      My tours
                    </button>

                    <button
                      onClick={() => {
                        navigate("/settings");
                        setUserMenuOpen(false);
                      }}
                      style={userMenuItem}
                    >
                      Settings
                    </button>

                    <button onClick={logout} style={userMenuDanger}>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* QUICK DESKTOP LOGOUT */}
            {user && !isMobile && (
              <button
                onClick={logout}
                style={{
                  padding: "7px 18px",
                  borderRadius: 999,
                  background:
                    "radial-gradient(circle at 0% 0%, rgba(255,255,255,0.2), rgba(0,0,0,0.7))",
                  border: "1px solid rgba(255,255,255,0.25)",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                Logout
              </button>
            )}

            {/* MOBILE MENU BUTTON */}
            {isMobile && (
              <button
                onClick={() => {
                  setMobileMenuOpen((p) => !p);
                  setNotificationsOpen(false);
                  setUserMenuOpen(false);
                  setActivitiesOpen(false);
                }}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.3)",
                  color: "white",
                  fontSize: 22,
                  cursor: "pointer",
                }}
              >
                ☰
              </button>
            )}
          </div>
        </nav>
      </header>

      {/* FULLSCREEN MOBILE MENU */}
      {isMobile && mobileMenuOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.93)",
            zIndex: 2000,
            padding: "60px 30px",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 18,
              right: 20,
              fontSize: 30,
              color: "white",
              cursor: "pointer",
            }}
            onClick={() => setMobileMenuOpen(false)}
          >
            ✕
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 26,
              marginTop: 40,
            }}
          >
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              style={mobileLink}
            >
              Home
            </Link>

            <Link
              to="/activities"
              onClick={() => setMobileMenuOpen(false)}
              style={mobileLink}
            >
              Activities
            </Link>
            
             <Link
              to="/tours"
              onClick={() => setMobileMenuOpen(false)}
              style={mobileLink}
            >
              Tours
            </Link>

            <Link
              to="/create-tour"
              onClick={() => setMobileMenuOpen(false)}
              style={mobileLink}
            >
              Create Tour
            </Link>

            <Link
              to="/contact"
              onClick={() => setMobileMenuOpen(false)}
              style={mobileLink}
            >
              Contact
            </Link>

            {user && (
              <>
                <div
                  style={{
                    marginTop: 18,
                    fontSize: 14,
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.6)",
                  }}
                >
                  Account
                </div>

                <button
                  onClick={() => {
                    navigate(`/profile/${user.id}`);
                    setMobileMenuOpen(false);
                  }}
                  style={mobileButton}
                >
                  My profile
                </button>

                <button
                  onClick={() => {
                    navigate("/my-tours");
                    setMobileMenuOpen(false);
                  }}
                  style={mobileButton}
                >
                  My tours
                </button>

                <button
                  onClick={() => {
                    navigate("/settings");
                    setMobileMenuOpen(false);
                  }}
                  style={mobileButton}
                >
                  Settings
                </button>

                <button onClick={logout} style={mobileDanger}>
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ----------------- EXTRA STYLES -----------------
const userMenuItem = {
  width: "100%",
  padding: "7px 9px",
  borderRadius: 10,
  border: "none",
  textAlign: "left",
  background: "rgba(255,255,255,0.03)",
  color: "rgba(255,255,255,0.9)",
  fontSize: 13,
  cursor: "pointer",
  marginBottom: 4,
};

const userMenuDanger = {
  ...userMenuItem,
  marginTop: 4,
  background: "rgba(255,80,80,0.12)",
  color: "#ff8080",
};

const mobileLink = {
  fontSize: 28,
  fontWeight: 700,
  color: "white",
  textDecoration: "none",
};

const mobileButton = {
  padding: "10px 14px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.25)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
  fontSize: 16,
  textAlign: "left",
  cursor: "pointer",
};

const mobileDanger = {
  ...mobileButton,
  marginTop: 8,
  borderColor: "rgba(255,100,100,0.8)",
  color: "#ff8080",
};