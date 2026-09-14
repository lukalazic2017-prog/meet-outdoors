import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";

function Icon({ name, size = 20, strokeWidth = 2 }) {
  const icons = {
    menu: (
      <>
        <path d="M4 8h16" />
        <path d="M4 16h16" />
      </>
    ),
    close: (
      <>
        <path d="M6 6l12 12" />
        <path d="M18 6 6 18" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),
    compass: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" />
      </>
    ),
    sparkle: (
      <>
        <path d="m12 3 1.1 3.3L16 8l-2.9 1.7L12 13l-1.1-3.3L8 8l2.9-1.7L12 3Z" />
        <path d="m18 14 .7 2.3L21 17l-2.3.7L18 20l-.7-2.3L15 17l2.3-.7L18 14Z" />
      </>
    ),
    map: (
      <>
        <path d="m9 18-6 3V6l6-3 6 3 6-3v15l-6 3-6-3Z" />
        <path d="M9 3v15M15 6v15" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </>
    ),
    users: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20v-2a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v2" />
        <path d="M16 4.5a3 3 0 0 1 0 6M17 13a5 5 0 0 1 4 5v2" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    edit: (
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
      </>
    ),
    dashboard: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="2" />
        <rect x="14" y="3" width="7" height="7" rx="2" />
        <rect x="3" y="14" width="7" height="7" rx="2" />
        <rect x="14" y="14" width="7" height="7" rx="2" />
      </>
    ),
    logout: (
      <>
        <path d="M10 5H5v14h5" />
        <path d="M14 8l4 4-4 4" />
        <path d="M18 12H9" />
      </>
    ),
    arrow: (
      <>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {icons[name]}
    </svg>
  );
}

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, loading, logout } = useAuth();

  const hideNavbar =
    location.pathname === "/login" ||
    location.pathname === "/signup";

  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!profile?.id) {
      setUnreadCount(0);
      return;
    }

    let active = true;

    async function loadUnreadCount() {
      const { count, error } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", profile.id)
        .or("is_read.eq.false,is_read.is.null");

      if (!active) return;
      if (error) {
        console.error("Greška pri učitavanju obaveštenja:", error);
        return;
      }

      setUnreadCount(count || 0);
    }

    loadUnreadCount();

    const channel = supabase
      .channel(`navbar-notifications-${profile.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${profile.id}`,
        },
        loadUnreadCount
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  async function handleLogout() {
    await logout();
    setOpen(false);
    navigate("/");
  }

  const profileUrl =
    profile?.role === "host"
      ? `/h/${profile.username}`
      : `/u/${profile?.username}`;

  const initials = useMemo(() => {
    const value =
      profile?.full_name ||
      profile?.username ||
      "MeetOutdoors";

    return value
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }, [profile?.full_name, profile?.username]);

  const links = [
    { to: "/", label: "Istraži", icon: "compass" },
    { to: "/agent", label: "Agent", icon: "sparkle" },
    { to: "/explore", label: "Mapa", icon: "map" },
    { to: "/events", label: "Avanture", icon: "calendar" },
    { to: "/hosts", label: "Domaćini", icon: "users" },
  ];

  function isActive(path) {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  }

  if (hideNavbar) return null;

  return (
    <>
      <NavbarStyles />

      <header className="moNav">
        <button
          type="button"
          className="moMobileMenu"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? "Zatvori meni" : "Otvori meni"}
          aria-expanded={open}
        >
          <Icon name={open ? "close" : "menu"} size={23} strokeWidth={2} />
        </button>

        <Link to="/" className="moBrand" aria-label="MeetOutdoors početna">
          MeetOutdoors
        </Link>

        <nav className="moDesktopLinks" aria-label="Glavna navigacija">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={isActive(link.to) ? "active" : ""}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="moActions">
          {!loading && profile && (
            <Link
              to="/notifications"
              className="moBell"
              aria-label="Obaveštenja"
            >
              <Icon name="bell" size={20} strokeWidth={2} />
              {unreadCount > 0 && (
                <span>{unreadCount > 99 ? "99+" : unreadCount}</span>
              )}
            </Link>
          )}

          {!loading && profile && (
            <Link to={profileUrl} className="moAvatar" aria-label="Moj profil">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name || profile.username || "Profil"}
                />
              ) : (
                <span>{initials}</span>
              )}
            </Link>
          )}

          {!loading && !profile && (
            <Link to="/login" className="moLogin">
              Prijavi se
            </Link>
          )}
        </div>
      </header>

      <div className={`moMenu ${open ? "open" : ""}`} aria-hidden={!open}>
        <div className="moMenuPanel">
          <nav className="moMenuLinks" aria-label="Mobilna navigacija">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={isActive(link.to) ? "active" : ""}
              >
                <span className="moMenuIcon">
                  <Icon name={link.icon} size={20} />
                </span>
                <strong>{link.label}</strong>
                <Icon name="arrow" size={18} strokeWidth={1.7} />
              </Link>
            ))}
          </nav>

          {!loading && profile && (
            <div className="moAccount">
              <div className="moAccountIdentity">
                <Link to={profileUrl} className="moAccountAvatar">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name || profile.username || "Profil"}
                    />
                  ) : (
                    <span>{initials}</span>
                  )}
                </Link>

                <div>
                  <strong>{profile.full_name || profile.username}</strong>
                  <small>@{profile.username}</small>
                </div>
              </div>

              <div className="moAccountLinks">
                <Link to={profileUrl}>
                  <Icon name="user" size={17} />
                  Moj profil
                </Link>

                <Link to="/edit-profile">
                  <Icon name="edit" size={17} />
                  Uredi profil
                </Link>

                {profile.role === "host" && (
                  <Link to="/dashboard">
                    <Icon name="dashboard" size={17} />
                    Host studio
                  </Link>
                )}

                <button type="button" onClick={handleLogout}>
                  <Icon name="logout" size={17} />
                  Odjavi se
                </button>
              </div>
            </div>
          )}

          {!loading && !profile && (
            <div className="moGuestActions">
              <Link to="/login">Prijavi se</Link>
              <Link to="/signup" className="primary">
                Kreiraj nalog
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function NavbarStyles() {
  return (
    <style>{`
      * {
        box-sizing: border-box;
      }

      .moNav,
      .moMenu {
        font-family:
          Inter,
          ui-sans-serif,
          system-ui,
          -apple-system,
          BlinkMacSystemFont,
          "Segoe UI",
          sans-serif;
      }

      .moNav a,
      .moMenu a {
        color: inherit;
        text-decoration: none;
      }

      .moNav {
        position: fixed;
        top: 12px;
        left: 18px;
        right: 18px;
        z-index: 5000;
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        min-height: 62px;
        padding: 0 10px 0 16px;
        border: 1px solid rgba(255,255,255,.10);
        border-radius: 18px;
        background: rgba(7,18,12,.92);
        box-shadow: 0 12px 34px rgba(0,0,0,.22);
        backdrop-filter: blur(18px) saturate(125%);
        -webkit-backdrop-filter: blur(18px) saturate(125%);
      }

      .moBrand {
        justify-self: start;
        color: white !important;
        font-size: 17px;
        font-weight: 830;
        letter-spacing: -.055em;
        line-height: 1;
      }

      .moDesktopLinks {
        justify-self: center;
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .moDesktopLinks a {
        position: relative;
        padding: 10px 12px;
        border-radius: 999px;
        color: rgba(255,255,255,.62);
        font-size: 12px;
        font-weight: 720;
        transition: .18s ease;
      }

      .moDesktopLinks a:hover {
        color: white;
        background: rgba(255,255,255,.06);
      }

      .moDesktopLinks a.active {
        color: white;
        background: rgba(255,255,255,.08);
      }

      .moActions {
        justify-self: end;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .moBell,
      .moAvatar {
        position: relative;
        display: grid;
        place-items: center;
        width: 40px;
        height: 40px;
        border: 1px solid rgba(255,255,255,.10);
        border-radius: 12px;
        background: rgba(255,255,255,.055);
        color: rgba(255,255,255,.82) !important;
      }

      .moBell > span {
        position: absolute;
        top: -5px;
        right: -5px;
        display: grid;
        place-items: center;
        min-width: 19px;
        height: 19px;
        padding: 0 5px;
        border: 2px solid #07120c;
        border-radius: 999px;
        background: #baff9e;
        color: #102117;
        font-size: 7px;
        font-weight: 900;
      }

      .moAvatar {
        overflow: hidden;
      }

      .moAvatar img,
      .moAccountAvatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .moAvatar > span,
      .moAccountAvatar > span {
        display: grid;
        place-items: center;
        width: 100%;
        height: 100%;
        background: #baff9e;
        color: #102117;
        font-size: 10px;
        font-weight: 900;
      }

      .moLogin {
        padding: 10px 14px;
        border-radius: 999px;
        background: white;
        color: #0a1710 !important;
        font-size: 11px;
        font-weight: 800;
      }

      .moMobileMenu {
        display: none;
      }

      .moMenu {
        position: fixed;
        inset: 0;
        z-index: 4900;
        padding-top: 0;
        background: rgba(4,11,7,.72);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        opacity: 0;
        pointer-events: none;
        transition: opacity .22s ease;
      }

      .moMenu.open {
        opacity: 1;
        pointer-events: auto;
      }

      .moMenuPanel {
        position: absolute;
        top: calc(58px + env(safe-area-inset-top, 0px));
        left: 0;
        right: 0;
        bottom: 0;
        overflow-y: auto;
        padding: 28px 18px calc(28px + env(safe-area-inset-bottom,0px));
        background:
          linear-gradient(180deg, #07120c 0%, #09150e 100%);
        transform: translateY(-8px);
        transition: transform .22s ease;
      }

      .moMenu.open .moMenuPanel {
        transform: translateY(0);
      }

      .moMenuLinks {
        max-width: 520px;
        margin: 0 auto;
      }

      .moMenuLinks a {
        display: grid;
        grid-template-columns: 34px minmax(0,1fr) auto;
        align-items: center;
        gap: 12px;
        min-height: 62px;
        border-bottom: 1px solid rgba(255,255,255,.08);
        color: rgba(255,255,255,.76);
      }

      .moMenuLinks a:first-child {
        border-top: 1px solid rgba(255,255,255,.08);
      }

      .moMenuLinks a.active {
        color: white;
      }

      .moMenuLinks a.active .moMenuIcon {
        color: #baff9e;
      }

      .moMenuLinks strong {
        font-size: 23px;
        font-weight: 760;
        letter-spacing: -.045em;
      }

      .moMenuIcon {
        display: grid;
        place-items: center;
        color: rgba(255,255,255,.48);
      }

      .moAccount {
        max-width: 520px;
        margin: 26px auto 0;
        padding-top: 18px;
        border-top: 1px solid rgba(255,255,255,.08);
      }

      .moAccountIdentity {
        display: grid;
        grid-template-columns: 46px minmax(0,1fr);
        align-items: center;
        gap: 12px;
      }

      .moAccountAvatar {
        display: grid;
        place-items: center;
        width: 46px;
        height: 46px;
        overflow: hidden;
        border-radius: 50%;
        background: rgba(255,255,255,.06);
      }

      .moAccountIdentity strong,
      .moAccountIdentity small {
        display: block;
      }

      .moAccountIdentity strong {
        color: white;
        font-size: 13px;
      }

      .moAccountIdentity small {
        margin-top: 3px;
        color: rgba(255,255,255,.42);
        font-size: 9px;
      }

      .moAccountLinks {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        margin-top: 16px;
      }

      .moAccountLinks a,
      .moAccountLinks button {
        display: flex;
        align-items: center;
        gap: 8px;
        min-height: 44px;
        padding: 0 12px;
        border: 1px solid rgba(255,255,255,.09);
        border-radius: 12px;
        background: rgba(255,255,255,.035);
        color: white;
        font: inherit;
        font-size: 9px;
        font-weight: 760;
      }

      .moAccountLinks button {
        cursor: pointer;
        color: rgba(255,255,255,.62);
      }

      .moGuestActions {
        max-width: 520px;
        margin: 26px auto 0;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }

      .moGuestActions a {
        display: grid;
        place-items: center;
        min-height: 46px;
        border: 1px solid rgba(255,255,255,.10);
        border-radius: 12px;
        color: white;
        font-size: 10px;
        font-weight: 800;
      }

      .moGuestActions a.primary {
        border-color: #baff9e;
        background: #baff9e;
        color: #102117;
      }

      @media (max-width: 980px) {
        .moDesktopLinks {
          display: none;
        }

        .moMobileMenu {
          display: grid;
          place-items: center;
          width: 38px;
          height: 38px;
          padding: 0;
          border: 0;
          background: transparent;
          color: white;
          cursor: pointer;
        }

        .moNav {
          top: 0;
          left: 0;
          right: 0;
          width: 100%;
          min-height: calc(58px + env(safe-area-inset-top,0px));
          padding:
            env(safe-area-inset-top,0px)
            12px
            0;
          grid-template-columns: 1fr auto 1fr;
          border: 0;
          border-bottom: 1px solid rgba(255,255,255,.08);
          border-radius: 0;
          background:
            linear-gradient(
              180deg,
              rgba(5,17,10,.99),
              rgba(7,20,12,.985)
            );
          box-shadow: 0 8px 24px rgba(0,0,0,.18);
        }

        .moMobileMenu {
          grid-column: 1;
          grid-row: 1;
          justify-self: start;
        }

        .moBrand {
          grid-column: 2;
          grid-row: 1;
          justify-self: center;
          font-size: 16.5px;
          font-weight: 790;
          letter-spacing: -.05em;
        }

        .moActions {
          grid-column: 3;
          grid-row: 1;
          justify-self: end;
          gap: 5px;
        }

        .moBell,
        .moAvatar {
          width: 34px;
          height: 34px;
          border: 0;
          border-radius: 50%;
          background: transparent;
        }

        .moAvatar {
          border: 1px solid rgba(255,255,255,.12);
        }

        .moLogin {
          padding: 8px 11px;
          font-size: 9px;
        }
      }

      @media (max-width: 390px) {
        .moNav {
          padding-left: 10px;
          padding-right: 10px;
        }

        .moBrand {
          font-size: 15.5px;
        }

        .moBell,
        .moAvatar {
          width: 32px;
          height: 32px;
        }

        .moActions {
          gap: 3px;
        }

        .moMenuPanel {
          padding-left: 15px;
          padding-right: 15px;
        }

        .moMenuLinks strong {
          font-size: 21px;
        }
      }

      /* PREMIUM VISUAL PASS — styling only, no behavior changes */
      .moNav {
        border-color: rgba(255,255,255,.08);
        background: linear-gradient(180deg, rgba(8,21,13,.94), rgba(6,17,11,.92));
        box-shadow: 0 18px 50px rgba(0,0,0,.22), inset 0 1px 0 rgba(255,255,255,.045);
        backdrop-filter: blur(24px) saturate(135%);
        -webkit-backdrop-filter: blur(24px) saturate(135%);
      }
      .moBrand { font-size:18px; font-weight:850; letter-spacing:-.06em; text-shadow:0 8px 26px rgba(0,0,0,.28); }
      .moDesktopLinks { gap:2px; padding:3px; border:1px solid rgba(255,255,255,.055); border-radius:999px; background:rgba(255,255,255,.028); }
      .moDesktopLinks a { padding:9px 13px; color:rgba(255,255,255,.58); font-weight:740; letter-spacing:-.015em; }
      .moDesktopLinks a:hover { color:rgba(255,255,255,.95); background:rgba(255,255,255,.055); }
      .moDesktopLinks a.active { color:#f5fff1; background:linear-gradient(180deg, rgba(186,255,158,.10), rgba(186,255,158,.055)); box-shadow:inset 0 0 0 1px rgba(186,255,158,.08),0 8px 22px rgba(0,0,0,.10); }
      .moBell,.moAvatar { border-color:rgba(255,255,255,.095); background:linear-gradient(180deg, rgba(255,255,255,.07), rgba(255,255,255,.035)); box-shadow:inset 0 1px 0 rgba(255,255,255,.045),0 8px 22px rgba(0,0,0,.13); transition:transform .18s ease,border-color .18s ease,background .18s ease; }
      .moBell:hover,.moAvatar:hover { transform:translateY(-1px); border-color:rgba(186,255,158,.20); background:linear-gradient(180deg, rgba(255,255,255,.09), rgba(255,255,255,.045)); }
      .moAvatar { border-radius:13px; }
      .moBell > span { background:#c8ffb1; color:#102117; box-shadow:0 6px 18px rgba(0,0,0,.24); }
      .moLogin { padding:10px 15px; background:linear-gradient(180deg,#fff,#eef5eb); box-shadow:0 8px 20px rgba(0,0,0,.12), inset 0 1px 0 rgba(255,255,255,.8); transition:transform .18s ease,box-shadow .18s ease; }
      .moLogin:hover { transform:translateY(-1px); box-shadow:0 12px 26px rgba(0,0,0,.16), inset 0 1px 0 rgba(255,255,255,.9); }
      .moMenu { background:rgba(2,8,5,.62); backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px); }
      .moMenuPanel { background:radial-gradient(circle at 50% -10%, rgba(186,255,158,.055), transparent 34%), linear-gradient(180deg,#07130c 0%,#08150e 52%,#06100a 100%); box-shadow:inset 0 1px 0 rgba(255,255,255,.035); }
      .moMenuLinks a { min-height:66px; border-bottom-color:rgba(255,255,255,.072); color:rgba(255,255,255,.70); transition:color .18s ease,padding-left .18s ease,background .18s ease; }
      .moMenuLinks a:first-child { border-top-color:rgba(255,255,255,.072); }
      .moMenuLinks a:hover,.moMenuLinks a.active { color:#fff; padding-left:6px; background:linear-gradient(90deg, rgba(186,255,158,.055), transparent 60%); }
      .moMenuLinks a.active .moMenuIcon { color:#c8ffb1; }
      .moMenuLinks strong { font-weight:790; letter-spacing:-.05em; }
      .moMenuIcon { color:rgba(255,255,255,.40); }
      .moAccount { border-top-color:rgba(255,255,255,.072); }
      .moAccountAvatar { border:1px solid rgba(255,255,255,.10); box-shadow:0 8px 22px rgba(0,0,0,.16); }
      .moAccountIdentity strong { font-weight:790; letter-spacing:-.02em; }
      .moAccountIdentity small { color:rgba(255,255,255,.38); }
      .moAccountLinks a,.moAccountLinks button { border-color:rgba(255,255,255,.075); background:linear-gradient(180deg, rgba(255,255,255,.045), rgba(255,255,255,.025)); transition:transform .18s ease,border-color .18s ease,background .18s ease; }
      .moAccountLinks a:hover,.moAccountLinks button:hover { transform:translateY(-1px); border-color:rgba(186,255,158,.14); background:linear-gradient(180deg, rgba(255,255,255,.065), rgba(255,255,255,.032)); }
      .moGuestActions a { border-color:rgba(255,255,255,.09); background:rgba(255,255,255,.028); }
      .moGuestActions a.primary { border-color:#c8ffb1; background:linear-gradient(180deg,#d7ffc6,#c2f9aa); box-shadow:0 10px 24px rgba(114,180,92,.14); }
      @media (max-width:980px) {
        .moNav { background:radial-gradient(circle at 50% -60%, rgba(186,255,158,.085), transparent 54%), linear-gradient(180deg, rgba(6,18,11,.995), rgba(6,17,10,.985)); border-bottom-color:rgba(255,255,255,.075); box-shadow:0 10px 30px rgba(0,0,0,.20), inset 0 -1px 0 rgba(255,255,255,.015); }
        .moBrand { font-size:17px; font-weight:820; letter-spacing:-.055em; }
        .moMobileMenu { color:rgba(255,255,255,.90); transition:opacity .18s ease,transform .18s ease; }
        .moMobileMenu:hover { opacity:.78; transform:scale(.98); }
        .moBell,.moAvatar { background:transparent; box-shadow:none; }
        .moBell { color:rgba(255,255,255,.78)!important; }
        .moAvatar { border-color:rgba(255,255,255,.14); box-shadow:0 4px 14px rgba(0,0,0,.16); }
        .moMenuPanel { padding-top:24px; }
        .moMenuLinks { padding:0 2px; }
        .moMenuLinks a { min-height:64px; }
        .moMenuLinks strong { font-size:22px; }
      }


      /* =========================================================
         ULTRA PREMIUM VISUAL LAYER — STYLE ONLY
         No routes, auth, notification logic, labels or behavior changed.
         ========================================================= */

      :root {
        --mo-ink: #f7fbf8;
        --mo-muted: rgba(247,251,248,.58);
        --mo-line: rgba(255,255,255,.075);
        --mo-line-strong: rgba(255,255,255,.12);
        --mo-green: #c9ffb1;
        --mo-green-soft: rgba(201,255,177,.10);
        --mo-panel: rgba(7,18,12,.92);
        --mo-shadow: 0 22px 70px rgba(0,0,0,.28);
      }

      .moNav {
        isolation: isolate;
        overflow: hidden;
        border-color: var(--mo-line);
        background:
          radial-gradient(
            140% 160% at 50% -85%,
            rgba(201,255,177,.075) 0%,
            rgba(201,255,177,.022) 34%,
            transparent 62%
          ),
          linear-gradient(
            180deg,
            rgba(8,21,13,.965) 0%,
            rgba(5,15,9,.95) 100%
          );
        box-shadow:
          0 26px 70px rgba(0,0,0,.24),
          0 8px 24px rgba(0,0,0,.14),
          inset 0 1px 0 rgba(255,255,255,.045),
          inset 0 -1px 0 rgba(255,255,255,.018);
        backdrop-filter: blur(30px) saturate(142%);
        -webkit-backdrop-filter: blur(30px) saturate(142%);
      }

      .moNav::before {
        content: "";
        position: absolute;
        inset: 0;
        z-index: -2;
        pointer-events: none;
        background:
          linear-gradient(
            110deg,
            transparent 0%,
            rgba(255,255,255,.024) 35%,
            transparent 58%
          );
        opacity: .9;
      }

      .moNav::after {
        content: "";
        position: absolute;
        left: 14%;
        right: 14%;
        top: 0;
        height: 1px;
        z-index: -1;
        pointer-events: none;
        background:
          linear-gradient(
            90deg,
            transparent,
            rgba(255,255,255,.16),
            transparent
          );
        opacity: .5;
      }

      .moBrand {
        position: relative;
        color: #fbfefb !important;
        font-size: 18.5px;
        font-weight: 860;
        letter-spacing: -.065em;
        text-rendering: geometricPrecision;
        text-shadow:
          0 1px 0 rgba(255,255,255,.03),
          0 10px 30px rgba(0,0,0,.32);
        transition:
          opacity .18s ease,
          transform .18s ease;
      }

      .moBrand:hover {
        opacity: .92;
        transform: translateY(-.5px);
      }

      .moDesktopLinks {
        position: relative;
        gap: 2px;
        padding: 4px;
        border-color: rgba(255,255,255,.06);
        background:
          linear-gradient(
            180deg,
            rgba(255,255,255,.035),
            rgba(255,255,255,.018)
          );
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,.025),
          0 10px 28px rgba(0,0,0,.08);
      }

      .moDesktopLinks a {
        min-width: max-content;
        padding: 9px 14px;
        border: 1px solid transparent;
        color: rgba(255,255,255,.55);
        font-size: 11.5px;
        font-weight: 740;
        letter-spacing: -.015em;
        transition:
          color .18s ease,
          background .18s ease,
          border-color .18s ease,
          transform .18s ease,
          box-shadow .18s ease;
      }

      .moDesktopLinks a:hover {
        color: rgba(255,255,255,.94);
        border-color: rgba(255,255,255,.04);
        background:
          linear-gradient(
            180deg,
            rgba(255,255,255,.06),
            rgba(255,255,255,.025)
          );
        transform: translateY(-1px);
      }

      .moDesktopLinks a.active {
        color: #fbfff9;
        border-color: rgba(201,255,177,.11);
        background:
          linear-gradient(
            180deg,
            rgba(201,255,177,.105),
            rgba(201,255,177,.045)
          );
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,.045),
          0 8px 20px rgba(0,0,0,.10);
      }

      .moActions {
        gap: 7px;
      }

      .moBell,
      .moAvatar {
        border-color: rgba(255,255,255,.085);
        background:
          linear-gradient(
            180deg,
            rgba(255,255,255,.068),
            rgba(255,255,255,.028)
          );
        box-shadow:
          0 10px 28px rgba(0,0,0,.14),
          inset 0 1px 0 rgba(255,255,255,.035);
        transition:
          transform .18s ease,
          border-color .18s ease,
          background .18s ease,
          box-shadow .18s ease,
          color .18s ease;
      }

      .moBell:hover,
      .moAvatar:hover {
        transform: translateY(-1px);
        border-color: rgba(201,255,177,.18);
        background:
          linear-gradient(
            180deg,
            rgba(255,255,255,.09),
            rgba(255,255,255,.038)
          );
        box-shadow:
          0 14px 32px rgba(0,0,0,.18),
          inset 0 1px 0 rgba(255,255,255,.045);
      }

      .moBell {
        color: rgba(255,255,255,.76) !important;
      }

      .moBell:hover {
        color: #fff !important;
      }

      .moAvatar {
        border-radius: 14px;
        overflow: hidden;
      }

      .moAvatar::after,
      .moAccountAvatar::after {
        content: "";
        position: absolute;
        inset: 0;
        pointer-events: none;
        border-radius: inherit;
        box-shadow: inset 0 0 0 1px rgba(255,255,255,.04);
      }

      .moBell > span {
        top: -4px;
        right: -4px;
        min-width: 18px;
        height: 18px;
        padding: 0 4px;
        border-width: 2px;
        background:
          linear-gradient(180deg, #dcffcd, #bff8a6);
        color: #112015;
        font-size: 6.8px;
        font-weight: 950;
        box-shadow:
          0 7px 18px rgba(0,0,0,.24),
          inset 0 1px 0 rgba(255,255,255,.6);
      }

      .moLogin {
        position: relative;
        overflow: hidden;
        padding: 10px 16px;
        border: 1px solid rgba(255,255,255,.38);
        background:
          linear-gradient(180deg, #ffffff 0%, #eef5ec 100%);
        color: #0b1710 !important;
        box-shadow:
          0 12px 30px rgba(0,0,0,.16),
          inset 0 1px 0 rgba(255,255,255,.9);
      }

      .moLogin::after {
        content: "";
        position: absolute;
        inset: 0;
        background:
          linear-gradient(
            120deg,
            transparent 12%,
            rgba(255,255,255,.52) 34%,
            transparent 54%
          );
        transform: translateX(-120%);
        transition: transform .55s ease;
      }

      .moLogin:hover::after {
        transform: translateX(120%);
      }

      .moMenu {
        background: rgba(2,7,4,.54);
        backdrop-filter: blur(20px) saturate(120%);
        -webkit-backdrop-filter: blur(20px) saturate(120%);
      }

      .moMenuPanel {
        overflow-x: hidden;
        background:
          radial-gradient(
            100% 72% at 50% -8%,
            rgba(201,255,177,.07) 0%,
            rgba(201,255,177,.022) 35%,
            transparent 66%
          ),
          radial-gradient(
            70% 45% at 100% 12%,
            rgba(255,255,255,.025),
            transparent 70%
          ),
          linear-gradient(
            180deg,
            #07120c 0%,
            #08150e 54%,
            #061009 100%
          );
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,.035),
          0 -12px 40px rgba(0,0,0,.14);
      }

      .moMenuPanel::before {
        content: "";
        position: fixed;
        left: 0;
        right: 0;
        top: calc(58px + env(safe-area-inset-top, 0px));
        height: 1px;
        pointer-events: none;
        background:
          linear-gradient(
            90deg,
            transparent,
            rgba(255,255,255,.11),
            transparent
          );
      }

      .moMenuLinks {
        position: relative;
      }

      .moMenuLinks a {
        position: relative;
        min-height: 68px;
        padding-left: 2px;
        border-bottom-color: rgba(255,255,255,.065);
        color: rgba(255,255,255,.70);
        transition:
          color .2s ease,
          padding-left .2s ease,
          background .2s ease,
          border-color .2s ease;
      }

      .moMenuLinks a:first-child {
        border-top-color: rgba(255,255,255,.065);
      }

      .moMenuLinks a::before {
        content: "";
        position: absolute;
        left: -18px;
        top: 14px;
        bottom: 14px;
        width: 2px;
        border-radius: 99px;
        background:
          linear-gradient(180deg, #ddffd0, #aee993);
        opacity: 0;
        transform: scaleY(.45);
        transition:
          opacity .2s ease,
          transform .2s ease;
      }

      .moMenuLinks a:hover,
      .moMenuLinks a.active {
        color: #fff;
        padding-left: 8px;
        border-bottom-color: rgba(255,255,255,.085);
        background:
          linear-gradient(
            90deg,
            rgba(201,255,177,.055) 0%,
            rgba(201,255,177,.018) 36%,
            transparent 76%
          );
      }

      .moMenuLinks a:hover::before,
      .moMenuLinks a.active::before {
        opacity: 1;
        transform: scaleY(1);
      }

      .moMenuLinks a.active .moMenuIcon,
      .moMenuLinks a:hover .moMenuIcon {
        color: #d4ffc1;
      }

      .moMenuLinks strong {
        font-size: 24px;
        font-weight: 805;
        letter-spacing: -.055em;
        line-height: 1;
        text-shadow: 0 8px 24px rgba(0,0,0,.18);
      }

      .moMenuLinks > a > svg:last-child {
        color: rgba(255,255,255,.28);
        transition:
          color .2s ease,
          transform .2s ease;
      }

      .moMenuLinks a:hover > svg:last-child,
      .moMenuLinks a.active > svg:last-child {
        color: rgba(255,255,255,.70);
        transform: translateX(2px);
      }

      .moMenuIcon {
        color: rgba(255,255,255,.38);
        transition: color .2s ease;
      }

      .moAccount {
        margin-top: 30px;
        padding-top: 20px;
        border-top-color: rgba(255,255,255,.065);
      }

      .moAccountIdentity {
        gap: 13px;
      }

      .moAccountAvatar {
        position: relative;
        width: 48px;
        height: 48px;
        border: 1px solid rgba(255,255,255,.10);
        box-shadow:
          0 12px 26px rgba(0,0,0,.20),
          inset 0 1px 0 rgba(255,255,255,.04);
      }

      .moAccountIdentity strong {
        color: rgba(255,255,255,.96);
        font-size: 13.5px;
        font-weight: 810;
        letter-spacing: -.025em;
      }

      .moAccountIdentity small {
        margin-top: 4px;
        color: rgba(255,255,255,.34);
        font-size: 8.8px;
      }

      .moAccountLinks {
        gap: 9px;
        margin-top: 18px;
      }

      .moAccountLinks a,
      .moAccountLinks button {
        min-height: 46px;
        border-color: rgba(255,255,255,.072);
        background:
          linear-gradient(
            180deg,
            rgba(255,255,255,.046),
            rgba(255,255,255,.021)
          );
        color: rgba(255,255,255,.82);
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,.025);
      }

      .moAccountLinks a:hover,
      .moAccountLinks button:hover {
        transform: translateY(-1px);
        border-color: rgba(201,255,177,.14);
        color: #fff;
        background:
          linear-gradient(
            180deg,
            rgba(201,255,177,.058),
            rgba(255,255,255,.028)
          );
        box-shadow:
          0 10px 24px rgba(0,0,0,.10),
          inset 0 1px 0 rgba(255,255,255,.032);
      }

      .moGuestActions {
        gap: 9px;
      }

      .moGuestActions a {
        min-height: 48px;
        border-color: rgba(255,255,255,.08);
        background:
          linear-gradient(
            180deg,
            rgba(255,255,255,.042),
            rgba(255,255,255,.02)
          );
      }

      .moGuestActions a.primary {
        border-color: rgba(201,255,177,.65);
        background:
          linear-gradient(
            180deg,
            #dcffcd 0%,
            #bef5a6 100%
          );
        color: #0f1d13;
        box-shadow:
          0 14px 30px rgba(118,184,96,.16),
          inset 0 1px 0 rgba(255,255,255,.54);
      }

      @media (max-width: 980px) {
        .moNav {
          min-height: calc(60px + env(safe-area-inset-top,0px));
          background:
            radial-gradient(
              100% 160% at 50% -105%,
              rgba(201,255,177,.10),
              rgba(201,255,177,.02) 42%,
              transparent 68%
            ),
            linear-gradient(
              180deg,
              rgba(5,16,10,.997) 0%,
              rgba(6,18,11,.99) 100%
            );
          border-bottom-color: rgba(255,255,255,.072);
          box-shadow:
            0 12px 34px rgba(0,0,0,.22),
            inset 0 1px 0 rgba(255,255,255,.025);
        }

        .moNav::after {
          left: 26%;
          right: 26%;
          opacity: .32;
        }

        .moBrand {
          font-size: 17.6px;
          font-weight: 830;
          letter-spacing: -.06em;
          text-shadow:
            0 1px 0 rgba(255,255,255,.02),
            0 8px 24px rgba(0,0,0,.28);
        }

        .moMobileMenu {
          width: 40px;
          height: 40px;
          color: rgba(255,255,255,.90);
          border-radius: 50%;
          transition:
            color .18s ease,
            background .18s ease,
            transform .18s ease;
        }

        .moMobileMenu:hover {
          opacity: 1;
          color: #fff;
          background: rgba(255,255,255,.045);
          transform: scale(.98);
        }

        .moActions {
          gap: 4px;
        }

        .moBell,
        .moAvatar {
          width: 34px;
          height: 34px;
          background: transparent;
          box-shadow: none;
        }

        .moBell {
          color: rgba(255,255,255,.74) !important;
        }

        .moBell:hover {
          transform: none;
          background: rgba(255,255,255,.04);
        }

        .moAvatar {
          border-color: rgba(255,255,255,.13);
          box-shadow:
            0 6px 16px rgba(0,0,0,.18),
            inset 0 0 0 1px rgba(255,255,255,.025);
        }

        .moAvatar:hover {
          transform: none;
        }

        .moMenuPanel {
          top: calc(60px + env(safe-area-inset-top, 0px));
          padding-top: 28px;
        }

        .moMenuPanel::before {
          top: calc(60px + env(safe-area-inset-top, 0px));
        }

        .moMenuLinks {
          padding: 0 3px;
        }

        .moMenuLinks a {
          min-height: 66px;
        }

        .moMenuLinks strong {
          font-size: 22.5px;
          letter-spacing: -.052em;
        }

        .moAccount {
          margin-top: 28px;
        }
      }

      @media (max-width: 390px) {
        .moBrand {
          font-size: 16.4px;
        }

        .moMenuLinks strong {
          font-size: 21.5px;
        }

        .moAccountLinks {
          gap: 7px;
        }
      }

    `}</style>
  );
}
