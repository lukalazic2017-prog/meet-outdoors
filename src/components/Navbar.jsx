import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useLanguage } from "../i18n/LanguageContext";
import { useTrial } from "../i18n/TrialContext";


export default function Navbar() {
  const { language, setLanguage, t } = useLanguage();
  const [user, setUser] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
const { isPremium, trialExpired, daysLeft } = useTrial();
const [isOpen, setIsOpen] = useState(false);


  const location = useLocation();
  const navigate = useNavigate();

  // Učitaj session + profil
  useEffect(() => {
    let ignore = false;

    async function loadSession() {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) {
        if (!ignore) {
          setUser(null);
          setAvatarUrl(null);
        }
        return;
      }

      const currentUser = data.session.user;
      if (!ignore) setUser(currentUser);

      // Učitavanje profila (avatar)
      const { data: profile } = await supabase
        .from("profiles")
        .select("avatar_url, full_name")
        .eq("user_id", currentUser.id)
        .single();

      if (!ignore && profile) {
        setAvatarUrl(profile.avatar_url || null);
      }
    }

    loadSession();

    // Realtime promene login/logout
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setUser(null);
        setAvatarUrl(null);
        return;
      }
      setUser(session.user);
      // ponovo učitaj avatar
      supabase
        .from("profiles")
        .select("avatar_url, full_name")
        .eq("user_id", session.user.id)
        .single()
        .then(({ data }) => {
          if (data) setAvatarUrl(data.avatar_url || null);
        });
    });

    return () => {
      ignore = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    setAvatarUrl(null);
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
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          color: "#fff",
        }}
      >
        {/* LEVA STRANA – LOGO */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            cursor: "pointer",
          }}
          onClick={() => navigate("/")}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "999px",
              background:
                "radial-gradient(circle at 30% 30%, #4ade80, #16a34a)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "700",
              fontSize: "18px",
              boxShadow: "0 0 16px rgba(34,197,94,0.6)",
            }}
          >
            M
          </div>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
            <span style={{ fontWeight: "700", letterSpacing: "0.06em" }}>
              MEETOUTDOORS
            </span>
            <span style={{ fontSize: "11px", opacity: 0.7 }}>
              connect • explore • enjoy
            </span>
          </div>
        </div>

        {/* DESNA STRANA – DESKTOP */}
        <div
          className="navbar-right"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          {/* Linkovi – Desktop */}
          <div
            className="navbar-links"
            style={{
              display: "none",
              alignItems: "center",
              gap: "14px",
            }}
          >
            <Link style={isActive("/")} to="/">
              {t("nav_home")}
            </Link>
            <Link style={isActive("/activities")} to="/activities">
              {t("nav_activities")}
            </Link>
            <Link style={isActive("/tours")} to="/tours">
              {t("nav_tours")}
            </Link>
            {user && <Link to="/create-tour">Create Tour</Link>}
            <Link style={isActive("/contact")} to="/contact">
              {t("nav_contact")}
            </Link>
          </div>

          {/* JEZICI */}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={{
              background: "transparent",
              color: "#27c200ff",
              borderRadius: "999px",
              border: "1px solid rgba(255,255,255,0.45)",
              padding: "4px 10px",
              fontSize: "12px",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="en">🇺🇸 EN</option>
            <option value="de">🇩🇪 DE</option>
            <option value="sr">🇷🇸 SR</option>
          </select>

          {/* USER DEO */}
          {user ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <Link
                to="/my-profile"
                style={{
                  fontSize: "14px",
                  opacity: 0.9,
                  textDecoration: "none",
                  color: "#fff",
                }}
              >
                {t("nav_my_profile")}
              </Link>

              {/* PROFILNA + ZELENA TAČKA */}
              <div
                style={{
                  position: "relative",
                  width: 38,
                  height: 38,
                  borderRadius: "999px",
                  overflow: "hidden",
                  border: "2px solid #4ade80",
                  cursor: "pointer",
                }}
                onClick={() => navigate("/my-profile")}
              >
                <img
                  src={
                    avatarUrl ||
                    `https://ui-avatars.com/api/?name=${user.email}&background=047857&color=fff&size=128`
                  }
                  alt="avatar"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />

                <span
                  style={{
                    position: "absolute",
                    right: -1,
                    bottom: -1,
                    width: 11,
                    height: 11,
                    borderRadius: "999px",
                    backgroundColor: "#22c55e",
                    border: "2px solid #022c22",
                  }}
                />
              </div>

              <button
                onClick={handleLogout}
                style={{
                  borderRadius: "999px",
                  border: "1px solid rgba(248,250,252,0.4)",
                  background: "transparent",
                  color: "#e5e7eb",
                  fontSize: "12px",
                  padding: "6px 14px",
                  cursor: "pointer",
                }}
              >
                {t("nav_logout")}
              </button>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <Link
                to="/login"
                style={{
                  fontSize: "14px",
                  textDecoration: "none",
                  color: "#e5e7eb",
                }}
              >
                {t("nav_login")}
              </Link>
              <Link
                to="/register"
                style={{
                  fontSize: "14px",
                  textDecoration: "none",
                  background:
                    "linear-gradient(135deg, #22c55e, #4ade80)",
                  padding: "7px 16px",
                  borderRadius: "999px",
                  color: "#022c22",
                  fontWeight: 600,
                }}
              >
                {t("nav_register")}
              </Link>
              {!isPremium && !trialExpired && (
  <span style={{ color: "yellow", marginLeft: "10px" }}>
    ⭐ Trial: {daysLeft} dana preostalo
  </span>
)}

{trialExpired && (
  <span style={{ color: "red", marginLeft: "10px" }}>
    ⛔ Trial istekao
  </span>
)}
            </div>
          )}

          {/* MOBILE MENI DUGME */}
          <button
  className="menu-btn"
  onClick={() => setIsOpen(!isOpen)}
>
  ☰
</button>
          
        </div>
      </div>

     {/* MOBILE DROPDOWN */}
{isOpen && (
  <div
    style={{
      position: "absolute",
      top: "70px",
      right: "10px",
      width: "220px",
      background: "rgba(3, 57, 0, 0.95)",
      borderRadius: "14px",
      padding: "15px",
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      backdropFilter: "blur(12px)",
      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.6)",
      zIndex: 9999,
      animation: "fadeIn 0.2s ease-in-out"
    }}
  >
    <Link
      to="/"
      style={{
        color: "white",
        background: "rgba(255, 255, 255, 0.08)",
        padding: "12px",
        borderRadius: "10px",
        textAlign: "center",
        textDecoration: "none",
        fontSize: "16px"
      }}
    >
      Home
    </Link>

    <Link
      to="/activities"
      style={{
        color: "white",
        background: "rgba(255, 255, 255, 0.08)",
        padding: "12px",
        borderRadius: "10px",
        textAlign: "center",
        textDecoration: "none",
        fontSize: "16px"
      }}
    >
      Activities
    </Link>

    <Link
      to="/contact"
      style={{
        color: "white",
        background: "rgba(255, 255, 255, 0.08)",
        padding: "12px",
        borderRadius: "10px",
        textAlign: "center",
        textDecoration: "none",
        fontSize: "16px"
      }}
    >
      Contact
    </Link>

    <Link
      to="/tours"
      style={{
        color: "white",
        background: "rgba(255, 255, 255, 0.08)",
        padding: "12px",
        borderRadius: "10px",
        textAlign: "center",
        textDecoration: "none",
        fontSize: "16px"
      }}
    >
      Tours
    </Link>

    {/* SAMO AKO JE ULOGOVAN */}
    {user && (
      <Link
        to="/create-tour"
        style={{
          color: "white",
          background: "rgba(76, 175, 80, 0.8)",
          padding: "12px",
          borderRadius: "10px",
          textAlign: "center",
          textDecoration: "none",
          fontSize: "16px"
        }}
      >
        Create Tour
      </Link>
    )}

    {user && (
      <Link
        to="/my-profile"
        style={{
          color: "white",
          background: "rgba(255, 255, 255, 0.08)",
          padding: "12px",
          borderRadius: "10px",
          textAlign: "center",
          textDecoration: "none",
          fontSize: "16px"
        }}
      >
        My Profile
      </Link>
    )}
</div>
)}

  </nav>
)}