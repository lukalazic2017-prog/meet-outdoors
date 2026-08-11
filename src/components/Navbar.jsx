import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";

function Icon({ name, size = 20, strokeWidth = 2 }) {
  const icons = {
    mountain: (
      <>
        <path d="m3 19 7-12 4 7 3-5 4 10" />
        <path d="m8.2 10.1 1.8 1.4 1.7-1.2" />
      </>
    ),
    menu: (
      <>
        <path d="M5 8h14" />
        <path d="M5 16h14" />
      </>
    ),
    close: (
      <>
        <path d="M6 6l12 12" />
        <path d="M18 6 6 18" />
      </>
    ),
    arrow: (
      <>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </>
    ),
    compass: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" />
      </>
    ),
    mapPin: (
      <>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </>
    ),
    package: (
      <>
        <path d="m12 3 8 4-8 4-8-4 8-4Z" />
        <path d="M4 7v10l8 4 8-4V7" />
        <path d="M12 11v10" />
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
    bell: (
      <>
        <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
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
    plus: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),
    logout: (
      <>
        <path d="M10 5H5v14h5" />
        <path d="M14 8l4 4-4 4" />
        <path d="M18 12H9" />
      </>
    ),
    login: (
      <>
        <path d="M14 5h5v14h-5" />
        <path d="m10 8-4 4 4 4" />
        <path d="M6 12h9" />
      </>
    ),
    sparkle: (
      <>
        <path d="m12 3 1.1 3.3L16 8l-2.9 1.7L12 13l-1.1-3.3L8 8l2.9-1.7L12 3Z" />
        <path d="m18 14 .7 2.3L21 17l-2.3.7L18 20l-.7-2.3L15 17l2.3-.7L18 14Z" />
      </>
    ),
    chevron: <path d="m9 18 6-6-6-6" />,
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

  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 18);
    }

    onScroll();
    window.addEventListener("scroll", onScroll);

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("user_id", profile.id)
        .or("is_read.eq.false,is_read.is.null");

      if (!active) return;

      if (error) {
        console.error(
          "Greška pri učitavanju broja obaveštenja:",
          error
        );
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
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) => {
          if (payload.new?.is_read === true) return;

          setUnreadCount((value) => value + 1);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) => {
          const wasUnread =
            payload.old?.is_read !== true;
          const isUnread =
            payload.new?.is_read !== true;

          if (wasUnread && !isUnread) {
            setUnreadCount((value) =>
              Math.max(0, value - 1)
            );
          }

          if (!wasUnread && isUnread) {
            setUnreadCount((value) => value + 1);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${profile.id}`,
        },
        () => {
          loadUnreadCount();
        }
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

  function isActive(path) {
    if (path === "/") {
      return location.pathname === "/";
    }

    return location.pathname.startsWith(path);
  }

  const mainLinks = [
    {
      to: "/",
      label: "Istraži",
      icon: "compass",
      index: "01",
    },
    {
      to: "/explore",
      label: "Mapa",
      icon: "mapPin",
      index: "02",
    },
    {
      to: "/events",
      label: "Događaji",
      icon: "calendar",
      index: "03",
    },
    {
      to: "/packages",
      label: "Paketi",
      icon: "package",
      index: "04",
    },
    {
      to: "/hosts",
      label: "Domaćini",
      icon: "users",
      index: "05",
    },
  ];

  return (
    <>
      <NavbarStyles />

      <header
        className={`brutalNav ${
          scrolled ? "scrolled" : ""
        } ${open ? "menuOpen" : ""}`}
      >
        <Link to="/" className="brutalNavLogo">
          <span className="brutalNavLogoMark">
            <Icon name="mountain" size={27} strokeWidth={2.2} />
          </span>

          <span className="brutalNavLogoCopy">
            <strong>MeetOutdoors</strong>
            <small>Idi dalje od običnog.</small>
          </span>
        </Link>

        <nav className="brutalNavDesktop">
          {mainLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={
                isActive(link.to) ? "active" : ""
              }
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="brutalNavRight">
          {!loading && profile && (
            <Link
              to="/notifications"
              className={`brutalNavBell ${
                unreadCount > 0 ? "hasUnread" : ""
              }`}
              aria-label={
                unreadCount > 0
                  ? `Imaš ${unreadCount} nepročitanih obaveštenja`
                  : "Obaveštenja"
              }
            >
              <Icon name="bell" size={20} strokeWidth={2.15} />

              {unreadCount > 0 && (
                <span className="brutalNavBellBadge">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>
          )}

          {!loading && profile && (
            <Link
              to={profileUrl}
              className="brutalNavProfile"
              aria-label="Otvori profil"
            >
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={
                    profile.full_name ||
                    profile.username ||
                    "Profil"
                  }
                />
              ) : (
                <span>{initials}</span>
              )}
            </Link>
          )}

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="brutalMenuButton"
            aria-label={open ? "Zatvori meni" : "Otvori meni"}
            aria-expanded={open}
          >
            <span className="brutalMenuButtonGlow" />

            <span className="brutalMenuButtonIcon">
              <Icon
                name={open ? "close" : "menu"}
                size={23}
                strokeWidth={2.2}
              />
            </span>

            <span className="brutalMenuButtonLabel">
              {open ? "Zatvori" : "Meni"}
            </span>
          </button>
        </div>
      </header>

      <div
        className={`brutalDrawer ${open ? "open" : ""}`}
        aria-hidden={!open}
      >
        <div className="brutalDrawerBackground" />
        <div className="brutalDrawerNoise" />
        <div className="brutalDrawerGradient" />

        <div className="brutalDrawerOrb orbOne" />
        <div className="brutalDrawerOrb orbTwo" />

        <div className="brutalDrawerInner">
          <section className="brutalDrawerIntro">
            <span className="brutalDrawerKicker">
              <Icon name="sparkle" size={15} />
              Navigacija
            </span>

            <h2>
              Izaberi
              <br />
              sledeći potez.
            </h2>

            <p>
              Događaji, domaćini i outdoor iskustva — sve što ti
              treba da pronađeš ili kreiraš sledeću avanturu.
            </p>

            {!loading && profile && (
              <Link
                to={profileUrl}
                className="brutalDrawerUser"
              >
                <div className="brutalDrawerAvatar">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={
                        profile.full_name ||
                        profile.username ||
                        "Profil"
                      }
                    />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>

                <div>
                  <small>Prijavljen kao</small>
                  <strong>
                    {profile.full_name || profile.username}
                  </strong>
                  <span>@{profile.username}</span>
                </div>

                <Icon name="arrow" size={18} />
              </Link>
            )}
          </section>

          <section className="brutalDrawerNavigation">
            <div className="brutalDrawerMainLinks">
              {mainLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={
                    isActive(link.to) ? "active" : ""
                  }
                >
                  <span className="brutalDrawerLinkIndex">
                    {link.index}
                  </span>

                  <span className="brutalDrawerLinkIcon">
                    <Icon name={link.icon} size={21} />
                  </span>

                  <strong>{link.label}</strong>

                  <span className="brutalDrawerLinkArrow">
                    <Icon name="arrow" size={21} />
                  </span>
                </Link>
              ))}
            </div>

            <div className="brutalDrawerAccount">
              {!loading && !profile && (
                <>
                  <span className="brutalDrawerAccountLabel">
                    Tvoj nalog
                  </span>

                  <div className="brutalDrawerAuthGrid">
                    <Link
                      to="/login"
                      className="brutalDrawerSecondary"
                    >
                      <Icon name="login" size={17} />
                      Prijavi se
                    </Link>

                    <Link
                      to="/signup"
                      className="brutalDrawerPrimary"
                    >
                      Kreiraj nalog
                      <Icon name="arrow" size={17} />
                    </Link>
                  </div>
                </>
              )}

              {!loading && profile && (
                <>
                  <div className="brutalDrawerAccountTop">
                    <span className="brutalDrawerAccountLabel">
                      Brze prečice
                    </span>

                    <Link
                      to="/notifications"
                      className={`drawerNotificationPill ${
                        unreadCount > 0 ? "hasUnread" : ""
                      }`}
                    >
                      <Icon name="bell" size={15} />
                      {unreadCount > 0
                        ? `${unreadCount} novih`
                        : "Nema novih"}
                    </Link>
                  </div>

                  <div className="brutalDrawerShortcutGrid">
                    <Link to={profileUrl}>
                      <Icon name="user" size={17} />
                      Moj profil
                    </Link>

                    <Link to="/edit-profile">
                      <Icon name="edit" size={17} />
                      Uredi profil
                    </Link>

                    <Link to="/my-events">
                      <Icon name="calendar" size={17} />
                      Moji događaji
                    </Link>

                    <Link
                      to="/notifications"
                      className={
                        unreadCount > 0
                          ? "shortcutUnread"
                          : ""
                      }
                    >
                      <span className="shortcutIconWrap">
                        <Icon name="bell" size={17} />
                        {unreadCount > 0 && (
                          <span className="shortcutDot" />
                        )}
                      </span>
                      Obaveštenja
                      {unreadCount > 0 && (
                        <strong className="shortcutCount">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </strong>
                      )}
                    </Link>
                  </div>

                  {profile.role === "host" && (
                    <div className="brutalDrawerHostPanel">
                      <div className="hostPanelCopy">
                        <span>Host režim</span>
                        <strong>
                          Kreiraj iskustva koja ljudi pamte.
                        </strong>
                        <small>
                          Objavi novi događaj ili napravi paket direktno iz menija.
                        </small>
                      </div>

                      <div className="brutalDrawerHostActions">
                        <Link to="/dashboard">
                          <Icon
                            name="dashboard"
                            size={17}
                          />
                          Host studio
                          <Icon
                            name="chevron"
                            size={15}
                          />
                        </Link>

                        <Link
                          to="/create-event"
                          className="hostActionPrimary"
                        >
                          <Icon name="calendar" size={17} />
                          Kreiraj događaj
                          <Icon
                            name="plus"
                            size={15}
                          />
                        </Link>

                        <Link
                          to="/create-package"
                          className="hostActionPrimary"
                        >
                          <Icon name="package" size={17} />
                          Kreiraj paket
                          <Icon
                            name="plus"
                            size={15}
                          />
                        </Link>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="brutalDrawerLogout"
                  >
                    <Icon name="logout" size={17} />
                    Odjavi se
                  </button>
                </>
              )}
            </div>
          </section>
        </div>

        <footer className="brutalDrawerFooter">
          <span>MeetOutdoors</span>
          <span>Avantura počinje pre prve staze.</span>
        </footer>
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

      .brutalNav,
      .brutalDrawer {
        font-family:
          Inter,
          ui-sans-serif,
          system-ui,
          -apple-system,
          BlinkMacSystemFont,
          "Segoe UI",
          sans-serif;
      }

      .brutalNav a,
      .brutalDrawer a {
        color: inherit;
        text-decoration: none;
      }

      .brutalNav button,
      .brutalDrawer button {
        font: inherit;
      }

      .brutalNav {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 3000;
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        align-items: center;
        gap: 18px;
        height: 106px;
        padding: 24px 30px;
        pointer-events: none;
        transition:
          top 0.25s ease,
          left 0.25s ease,
          right 0.25s ease,
          height 0.25s ease,
          padding 0.25s ease,
          border-radius 0.25s ease,
          background 0.25s ease,
          box-shadow 0.25s ease,
          backdrop-filter 0.25s ease;
      }

      .brutalNav.scrolled,
      .brutalNav.menuOpen {
        top: 12px;
        left: 12px;
        right: 12px;
        height: 72px;
        padding: 9px 10px 9px 14px;
        border: 1px solid rgba(255, 255, 255, 0.14);
        border-radius: 24px;
        background:
          linear-gradient(
            120deg,
            rgba(6, 17, 11, 0.88),
            rgba(9, 29, 17, 0.74)
          );
        box-shadow:
          0 20px 70px rgba(0, 0, 0, 0.34),
          inset 0 1px 0 rgba(255, 255, 255, 0.07);
        backdrop-filter: blur(28px) saturate(145%);
      }

      .brutalNavLogo,
      .brutalNavDesktop,
      .brutalNavRight {
        pointer-events: auto;
      }

      .brutalNavLogo {
        display: inline-flex;
        align-items: center;
        justify-self: start;
        gap: 11px;
        color: white !important;
      }

      .brutalNavLogoMark {
        display: grid;
        place-items: center;
        width: 48px;
        height: 48px;
        border: 1px solid rgba(255, 255, 255, 0.16);
        border-radius: 16px;
        background:
          linear-gradient(
            145deg,
            rgba(255, 255, 255, 0.12),
            rgba(255, 255, 255, 0.04)
          );
        color: #baff9e;
        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, 0.12),
          0 13px 30px rgba(0, 0, 0, 0.22);
        backdrop-filter: blur(18px);
      }

      .brutalNavLogoCopy strong,
      .brutalNavLogoCopy small {
        display: block;
      }

      .brutalNavLogoCopy strong {
        font-size: 14px;
        font-weight: 950;
        letter-spacing: -0.035em;
        text-transform: uppercase;
        text-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
      }

      .brutalNavLogoCopy small {
        margin-top: 3px;
        color: rgba(255, 255, 255, 0.52);
        font-size: 7px;
        font-weight: 800;
        letter-spacing: 0.09em;
        text-transform: uppercase;
      }

      .brutalNavDesktop {
        display: flex;
        align-items: center;
        justify-self: center;
        gap: 4px;
        padding: 5px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 999px;
        background: rgba(4, 12, 8, 0.26);
        backdrop-filter: blur(18px);
      }

      .brutalNavDesktop a {
        position: relative;
        padding: 10px 15px;
        border-radius: 999px;
        color: rgba(255, 255, 255, 0.68);
        font-size: 9px;
        font-weight: 850;
        transition:
          color 0.2s ease,
          background 0.2s ease,
          transform 0.2s ease;
      }

      .brutalNavDesktop a:hover,
      .brutalNavDesktop a.active {
        background: rgba(255, 255, 255, 0.1);
        color: white;
        transform: translateY(-1px);
      }

      .brutalNavDesktop a.active::after {
        position: absolute;
        right: 12px;
        bottom: 5px;
        left: 12px;
        height: 2px;
        border-radius: 999px;
        background: #baff9e;
        content: "";
        box-shadow: 0 0 14px rgba(186, 255, 158, 0.7);
      }

      .brutalNavRight {
        display: flex;
        align-items: center;
        justify-self: end;
        gap: 8px;
      }

      .brutalNavBell {
        position: relative;
        display: grid;
        place-items: center;
        width: 45px;
        height: 45px;
        border: 1px solid rgba(255, 255, 255, 0.16);
        border-radius: 15px;
        background:
          linear-gradient(
            145deg,
            rgba(255, 255, 255, 0.11),
            rgba(255, 255, 255, 0.045)
          );
        color: rgba(255, 255, 255, 0.8) !important;
        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, 0.08),
          0 12px 30px rgba(0, 0, 0, 0.2);
        backdrop-filter: blur(18px);
        transition:
          transform 0.18s ease,
          background 0.18s ease,
          color 0.18s ease;
      }

      .brutalNavBell:hover {
        transform: translateY(-2px);
        color: white !important;
        background: rgba(255, 255, 255, 0.14);
      }

      .brutalNavBell.hasUnread {
        border-color: rgba(186, 255, 158, 0.36);
        background:
          linear-gradient(
            145deg,
            rgba(186, 255, 158, 0.18),
            rgba(255, 255, 255, 0.06)
          );
        color: #d8ffc8 !important;
        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, 0.1),
          0 0 0 1px rgba(186, 255, 158, 0.07),
          0 16px 34px rgba(0, 0, 0, 0.24);
      }

      .brutalNavBell.hasUnread::before {
        position: absolute;
        inset: -5px;
        border: 1px solid rgba(186, 255, 158, 0.16);
        border-radius: 19px;
        content: "";
        animation: notificationPulse 2s ease-in-out infinite;
      }

      .brutalNavBellBadge {
        position: absolute;
        top: -7px;
        right: -7px;
        display: grid;
        place-items: center;
        min-width: 22px;
        height: 22px;
        padding: 0 6px;
        border: 2px solid #07120c;
        border-radius: 999px;
        background: #baff9e;
        color: #0c2416;
        font-size: 8px;
        font-weight: 950;
        box-shadow: 0 8px 18px rgba(0, 0, 0, 0.28);
      }

      @keyframes notificationPulse {
        0%,
        100% {
          opacity: 0.35;
          transform: scale(0.98);
        }

        50% {
          opacity: 1;
          transform: scale(1.06);
        }
      }

      .brutalNavProfile {
        display: grid;
        place-items: center;
        width: 45px;
        height: 45px;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.16);
        border-radius: 15px;
        background: rgba(255, 255, 255, 0.09);
        color: #0c2517;
        box-shadow: 0 12px 30px rgba(0, 0, 0, 0.22);
        transition:
          transform 0.18s ease,
          border-color 0.18s ease;
      }

      .brutalNavProfile:hover {
        transform: translateY(-2px);
        border-color: rgba(186, 255, 158, 0.38);
      }

      .brutalNavProfile img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .brutalNavProfile span {
        display: grid;
        place-items: center;
        width: 100%;
        height: 100%;
        background: #baff9e;
        font-size: 10px;
        font-weight: 950;
      }

      .brutalMenuButton {
        position: relative;
        display: inline-grid;
        grid-template-columns: auto auto;
        align-items: center;
        gap: 9px;
        min-width: 108px;
        height: 48px;
        padding: 0 16px 0 12px;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.18);
        border-radius: 16px;
        background:
          linear-gradient(
            145deg,
            rgba(255, 255, 255, 0.14),
            rgba(255, 255, 255, 0.05)
          );
        color: white;
        cursor: pointer;
        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, 0.11),
          0 14px 35px rgba(0, 0, 0, 0.22);
        backdrop-filter: blur(18px);
        transition:
          transform 0.2s ease,
          background 0.2s ease;
      }

      .brutalMenuButton:hover {
        transform: translateY(-2px);
        background:
          linear-gradient(
            145deg,
            rgba(186, 255, 158, 0.18),
            rgba(255, 255, 255, 0.07)
          );
      }

      .brutalMenuButtonGlow {
        position: absolute;
        top: -40px;
        left: -30px;
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background: rgba(186, 255, 158, 0.2);
        filter: blur(22px);
      }

      .brutalMenuButtonIcon {
        position: relative;
        z-index: 1;
        display: grid;
        place-items: center;
        width: 28px;
        height: 28px;
      }

      .brutalMenuButtonLabel {
        position: relative;
        z-index: 1;
        font-size: 9px;
        font-weight: 900;
        letter-spacing: 0.07em;
        text-transform: uppercase;
      }

      .brutalDrawer {
        position: fixed;
        inset: 0;
        z-index: 2500;
        overflow: auto;
        background: #06100b;
        color: white;
        opacity: 0;
        pointer-events: none;
        transform: translateY(-12px);
        transition:
          opacity 0.32s ease,
          transform 0.32s ease;
      }

      .brutalDrawer.open {
        opacity: 1;
        pointer-events: auto;
        transform: translateY(0);
      }

      .brutalDrawerBackground,
      .brutalDrawerGradient,
      .brutalDrawerNoise {
        position: fixed;
        inset: 0;
      }

      .brutalDrawerBackground {
        background-image:
          url("https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2200&q=92");
        background-position: center;
        background-size: cover;
        transform: scale(1.04);
      }

      .brutalDrawerGradient {
        background:
          linear-gradient(
            90deg,
            rgba(5, 15, 9, 0.98) 0%,
            rgba(5, 15, 9, 0.9) 42%,
            rgba(5, 15, 9, 0.56) 100%
          ),
          linear-gradient(
            180deg,
            rgba(5, 15, 9, 0.14),
            rgba(5, 15, 9, 0.98)
          );
      }

      .brutalDrawerNoise {
        opacity: 0.08;
        background-image:
          url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.45'/%3E%3C/svg%3E");
      }

      .brutalDrawerOrb {
        position: fixed;
        border-radius: 50%;
        pointer-events: none;
        filter: blur(80px);
      }

      .brutalDrawerOrb.orbOne {
        top: 10%;
        right: 8%;
        width: 260px;
        height: 260px;
        background: rgba(137, 255, 114, 0.11);
      }

      .brutalDrawerOrb.orbTwo {
        bottom: -80px;
        left: 26%;
        width: 330px;
        height: 330px;
        background: rgba(103, 184, 255, 0.08);
      }

      .brutalDrawerInner {
        position: relative;
        z-index: 2;
        display: grid;
        grid-template-columns:
          minmax(300px, 0.9fr)
          minmax(450px, 1.1fr);
        gap: 80px;
        min-height: 100svh;
        padding: 150px 5vw 90px;
      }

      .brutalDrawerIntro {
        align-self: start;
      }

      .brutalDrawerKicker {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: #baff9e;
        font-size: 9px;
        font-weight: 950;
        letter-spacing: 0.14em;
        text-transform: uppercase;
      }

      .brutalDrawerIntro h2 {
        margin: 24px 0 0;
        font-size: clamp(62px, 8vw, 122px);
        line-height: 0.82;
        letter-spacing: -0.08em;
      }

      .brutalDrawerIntro > p {
        max-width: 520px;
        margin: 28px 0 0;
        color: rgba(255, 255, 255, 0.52);
        font-size: 13px;
        line-height: 1.75;
      }

      .brutalDrawerUser {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        align-items: center;
        gap: 13px;
        max-width: 430px;
        margin-top: 36px;
        padding: 13px;
        border: 1px solid rgba(255, 255, 255, 0.13);
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.07);
        backdrop-filter: blur(20px);
        transition:
          background 0.2s ease,
          transform 0.2s ease;
      }

      .brutalDrawerUser:hover {
        transform: translateY(-2px);
        background: rgba(255, 255, 255, 0.11);
      }

      .brutalDrawerAvatar {
        display: grid;
        place-items: center;
        width: 51px;
        height: 51px;
        overflow: hidden;
        border-radius: 15px;
        background: #baff9e;
        color: #0d2617;
        font-size: 11px;
        font-weight: 950;
      }

      .brutalDrawerAvatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .brutalDrawerUser small,
      .brutalDrawerUser strong,
      .brutalDrawerUser span {
        display: block;
      }

      .brutalDrawerUser small {
        color: rgba(255, 255, 255, 0.43);
        font-size: 7px;
        text-transform: uppercase;
      }

      .brutalDrawerUser strong {
        margin-top: 4px;
        font-size: 11px;
      }

      .brutalDrawerUser span {
        margin-top: 2px;
        color: rgba(255, 255, 255, 0.48);
        font-size: 8px;
      }

      .brutalDrawerNavigation {
        display: grid;
        align-content: start;
        gap: 28px;
      }

      .brutalDrawerMainLinks {
        display: grid;
      }

      .brutalDrawerMainLinks > a {
        display: grid;
        grid-template-columns: 34px 44px minmax(0, 1fr) auto;
        align-items: center;
        gap: 12px;
        min-height: 94px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.12);
        color: rgba(255, 255, 255, 0.82);
        transition:
          color 0.2s ease,
          padding-left 0.2s ease,
          background 0.2s ease;
      }

      .brutalDrawerMainLinks > a:first-child {
        border-top: 1px solid rgba(255, 255, 255, 0.12);
      }

      .brutalDrawerMainLinks > a:hover,
      .brutalDrawerMainLinks > a.active {
        padding-left: 12px;
        background:
          linear-gradient(
            90deg,
            rgba(186, 255, 158, 0.08),
            transparent
          );
        color: white;
      }

      .brutalDrawerLinkIndex {
        color: rgba(255, 255, 255, 0.32);
        font-size: 8px;
        font-weight: 900;
      }

      .brutalDrawerLinkIcon {
        display: grid;
        place-items: center;
        width: 40px;
        height: 40px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 13px;
        background: rgba(255, 255, 255, 0.06);
        color: #baff9e;
      }

      .brutalDrawerMainLinks strong {
        font-size: clamp(34px, 4vw, 58px);
        line-height: 1;
        letter-spacing: -0.055em;
      }

      .brutalDrawerLinkArrow {
        color: rgba(255, 255, 255, 0.4);
        transition: transform 0.2s ease;
      }

      .brutalDrawerMainLinks > a:hover
        .brutalDrawerLinkArrow {
        transform: translateX(6px);
      }

      .brutalDrawerAccount {
        display: grid;
        gap: 13px;
        padding: 18px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 22px;
        background:
          linear-gradient(
            145deg,
            rgba(2, 8, 4, 0.54),
            rgba(15, 40, 23, 0.3)
          );
        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, 0.04),
          0 22px 55px rgba(0, 0, 0, 0.16);
        backdrop-filter: blur(20px);
      }

      .brutalDrawerAccountTop {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .brutalDrawerAccountLabel {
        color: rgba(255, 255, 255, 0.42);
        font-size: 8px;
        font-weight: 900;
        letter-spacing: 0.11em;
        text-transform: uppercase;
      }

      .drawerNotificationPill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-height: 30px;
        padding: 0 9px;
        border: 1px solid rgba(255, 255, 255, 0.11);
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.06);
        color: rgba(255, 255, 255, 0.58) !important;
        font-size: 7px;
        font-weight: 900;
      }

      .drawerNotificationPill.hasUnread {
        border-color: rgba(186, 255, 158, 0.3);
        background: rgba(186, 255, 158, 0.1);
        color: #d9ffcb !important;
      }

      .brutalDrawerAuthGrid,
      .brutalDrawerShortcutGrid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 9px;
      }

      .brutalDrawerSecondary,
      .brutalDrawerPrimary,
      .brutalDrawerShortcutGrid a,
      .brutalDrawerHostActions a,
      .brutalDrawerLogout {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-height: 48px;
        padding: 0 14px;
        border-radius: 14px;
        font-size: 9px;
        font-weight: 850;
      }

      .brutalDrawerSecondary,
      .brutalDrawerShortcutGrid a {
        position: relative;
        border: 1px solid rgba(255, 255, 255, 0.12);
        background: rgba(255, 255, 255, 0.06);
        color: white;
        transition:
          transform 0.18s ease,
          background 0.18s ease,
          border-color 0.18s ease;
      }

      .brutalDrawerShortcutGrid a:hover {
        transform: translateY(-2px);
        border-color: rgba(186, 255, 158, 0.2);
        background: rgba(255, 255, 255, 0.09);
      }

      .brutalDrawerShortcutGrid a.shortcutUnread {
        border-color: rgba(186, 255, 158, 0.25);
        background:
          linear-gradient(
            145deg,
            rgba(186, 255, 158, 0.12),
            rgba(255, 255, 255, 0.05)
          );
      }

      .shortcutIconWrap {
        position: relative;
        display: inline-grid;
        place-items: center;
      }

      .shortcutDot {
        position: absolute;
        top: -4px;
        right: -5px;
        width: 7px;
        height: 7px;
        border: 1px solid #07120c;
        border-radius: 50%;
        background: #baff9e;
      }

      .shortcutCount {
        margin-left: auto;
        display: inline-grid;
        place-items: center;
        min-width: 24px;
        height: 24px;
        padding: 0 6px;
        border-radius: 999px;
        background: #baff9e;
        color: #0b2516;
        font-size: 8px;
        font-weight: 950;
      }

      .brutalDrawerPrimary {
        justify-content: space-between;
        background: #baff9e;
        color: #0b2415 !important;
      }

      .brutalDrawerHostPanel {
        display: grid;
        gap: 15px;
        padding: 16px;
        border: 1px solid rgba(186, 255, 158, 0.2);
        border-radius: 19px;
        background:
          radial-gradient(
            circle at 100% 0%,
            rgba(186, 255, 158, 0.13),
            transparent 36%
          ),
          linear-gradient(
            145deg,
            rgba(186, 255, 158, 0.12),
            rgba(8, 25, 13, 0.28)
          );
        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, 0.05),
          0 18px 42px rgba(0, 0, 0, 0.15);
      }

      .hostPanelCopy span,
      .hostPanelCopy strong,
      .hostPanelCopy small {
        display: block;
      }

      .hostPanelCopy span {
        color: #baff9e;
        font-size: 8px;
        font-weight: 900;
        text-transform: uppercase;
      }

      .hostPanelCopy strong {
        margin-top: 5px;
        font-size: 13px;
        line-height: 1.35;
      }

      .hostPanelCopy small {
        margin-top: 6px;
        max-width: 440px;
        color: rgba(255, 255, 255, 0.45);
        font-size: 8px;
        line-height: 1.55;
      }

      .brutalDrawerHostActions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }

      .brutalDrawerHostActions a {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        border: 1px solid rgba(255, 255, 255, 0.12);
        background: rgba(3, 10, 5, 0.25);
        color: white;
        transition:
          transform 0.18s ease,
          border-color 0.18s ease,
          background 0.18s ease;
      }

      .brutalDrawerHostActions a:first-child {
        grid-column: 1 / -1;
      }

      .brutalDrawerHostActions a:hover {
        transform: translateY(-2px);
        border-color: rgba(186, 255, 158, 0.24);
        background: rgba(255, 255, 255, 0.08);
      }

      .brutalDrawerHostActions a.hostActionPrimary {
        border-color: rgba(186, 255, 158, 0.26);
        background: rgba(186, 255, 158, 0.1);
        color: #e7ffdd;
      }

      .brutalDrawerLogout {
        width: 100%;
        border: 1px solid rgba(255, 104, 104, 0.21);
        background: rgba(255, 71, 71, 0.09);
        color: #ffc6c6;
        cursor: pointer;
        transition:
          transform 0.18s ease,
          background 0.18s ease;
      }

      .brutalDrawerLogout:hover {
        transform: translateY(-1px);
        background: rgba(255, 71, 71, 0.14);
      }

      .brutalDrawerFooter {
        position: relative;
        z-index: 2;
        display: flex;
        justify-content: space-between;
        gap: 20px;
        padding: 0 5vw 28px;
        color: rgba(255, 255, 255, 0.34);
        font-size: 8px;
        font-weight: 800;
        letter-spacing: 0.09em;
        text-transform: uppercase;
      }

      @media (max-width: 1100px) {
        .brutalNavDesktop {
          gap: 1px;
        }

        .brutalNavDesktop a {
          padding-inline: 12px;
        }
      }

      @media (max-width: 980px) {
        .brutalNav {
          grid-template-columns: 1fr auto;
        }

        .brutalNavDesktop {
          display: none;
        }

        .brutalDrawerInner {
          grid-template-columns: 1fr;
          gap: 48px;
          padding-top: 138px;
        }

        .brutalDrawerIntro h2 {
          font-size: clamp(64px, 12vw, 100px);
        }
      }

      @media (max-width: 640px) {
        .brutalNav {
          height: 92px;
          padding: 20px 18px;
        }

        .brutalNav.scrolled,
        .brutalNav.menuOpen {
          top: 8px;
          left: 8px;
          right: 8px;
          height: 66px;
          padding: 8px 8px 8px 11px;
          border-radius: 20px;
        }

        .brutalNavLogoMark {
          width: 43px;
          height: 43px;
          border-radius: 14px;
        }

        .brutalNavLogoCopy small {
          display: none;
        }

        .brutalNavLogoCopy strong {
          font-size: 12px;
        }

        .brutalMenuButton {
          min-width: 48px;
          width: 48px;
          padding: 0;
          grid-template-columns: 1fr;
          border-radius: 15px;
        }

        .brutalMenuButtonLabel {
          display: none;
        }

        .brutalNavBell,
        .brutalNavProfile {
          width: 43px;
          height: 43px;
          border-radius: 14px;
        }

        .brutalNavBellBadge {
          top: -6px;
          right: -6px;
          min-width: 20px;
          height: 20px;
          font-size: 7px;
        }

        .brutalDrawerInner {
          padding: 118px 18px 70px;
        }

        .brutalDrawerIntro h2 {
          font-size: clamp(56px, 16vw, 82px);
        }

        .brutalDrawerMainLinks > a {
          grid-template-columns: 25px 38px minmax(0, 1fr) auto;
          min-height: 78px;
        }

        .brutalDrawerLinkIcon {
          width: 35px;
          height: 35px;
        }

        .brutalDrawerMainLinks strong {
          font-size: clamp(32px, 10vw, 46px);
        }

        .brutalDrawerAuthGrid,
        .brutalDrawerShortcutGrid,
        .brutalDrawerHostActions {
          grid-template-columns: 1fr;
        }

        .brutalDrawerHostActions a:first-child {
          grid-column: auto;
        }

        .brutalDrawerFooter {
          flex-direction: column;
          padding: 0 18px 22px;
        }
      }

      @media (max-width: 440px) {
        .brutalNav {
          padding-inline: 12px;
        }

        .brutalNavLogo {
          gap: 8px;
        }

        .brutalNavLogoMark {
          width: 40px;
          height: 40px;
        }

        .brutalNavLogoCopy strong {
          font-size: 10px;
        }

        .brutalNavRight {
          gap: 6px;
        }

        .brutalNavBell,
        .brutalNavProfile,
        .brutalMenuButton {
          width: 40px;
          height: 40px;
        }

        .brutalDrawerAccountTop {
          align-items: flex-start;
          flex-direction: column;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        *,
        *::before,
        *::after {
          animation: none !important;
          scroll-behavior: auto !important;
          transition: none !important;
        }
      }
    `}</style>
  );
}