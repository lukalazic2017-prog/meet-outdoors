import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

const COLORS = {
  bg: "rgba(6, 17, 13, 0.72)",
  bgSolid: "rgba(6, 17, 13, 0.96)",
  bgSoft: "rgba(8, 22, 17, 0.86)",
  line: "rgba(55, 242, 195, 0.16)",
  lineStrong: "rgba(55, 242, 195, 0.28)",
  lineBlue: "rgba(46, 230, 255, 0.22)",
  text: "#f4fff9",
  textSoft: "rgba(231, 255, 247, 0.78)",
  textDim: "rgba(211, 241, 231, 0.58)",
  mint: "#37f2c3",
  mintBlue: "#2ee6ff",
  mintSoft: "#8fffe0",
  danger: "#ff8c8c",
};

const FALLBACK_AVATAR = "https://i.pravatar.cc/160?img=12";
const HEADER_DESKTOP = 84;
const HEADER_MOBILE = 96;

function useIsMobile(breakpoint = 960) {
  const getValue = useCallback(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth <= breakpoint;
  }, [breakpoint]);

  const [isMobile, setIsMobile] = useState(getValue);

  useEffect(() => {
    const onResize = () => setIsMobile(getValue());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [getValue]);

  return isMobile;
}

function BrandMark({ mobile = false }) {
  return (
    <div
      style={{
        width: mobile ? 38 : 50,
        height: mobile ? 38 : 50,
        borderRadius: mobile ? 16 : 18,
        background:
          "radial-gradient(circle at 28% 20%, rgba(255,255,255,0.95), rgba(143,255,224,0.95) 18%, rgba(55,242,195,1) 42%, rgba(46,230,255,0.92) 72%, rgba(4,27,23,1) 100%)",
        display: "grid",
        placeItems: "center",
        boxShadow:
          "0 0 0 1px rgba(255,255,255,0.12), 0 0 28px rgba(55,242,195,0.26), 0 18px 44px rgba(0,0,0,0.34)",
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: mobile ? 19 : 24, filter: "drop-shadow(0 8px 12px rgba(0,0,0,0.26))" }}>🏔️</span>
    </div>
  );
}

function LiveDot() {
  return (
    <span
      style={{
        width: 8,
        height: 8,
        borderRadius: 999,
        background: COLORS.mint,
        boxShadow: "0 0 0 5px rgba(55,242,195,0.10), 0 0 16px rgba(55,242,195,0.86)",
        flexShrink: 0,
      }}
    />
  );
}

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile(1180);

  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(FALLBACK_AVATAR);

  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchCursor, setSearchCursor] = useState(-1);
  const [friendsSet, setFriendsSet] = useState(new Set());

  const searchRef = useRef(null);
  const notifRef = useRef(null);
  const menuRef = useRef(null);
  const searchInputRef = useRef(null);
  const headerRef = useRef(null);
  const mobilePanelRef = useRef(null);

  const [headerOffset, setHeaderOffset] = useState(isMobile ? HEADER_MOBILE : HEADER_DESKTOP);

  const navItems = useMemo(
    () => [
      { key: "home", label: "Home", path: "/", icon: "⌂" },
      { key: "going-now", label: "Going Now", path: "/going-now", live: true, icon: "ϟ" },
      { key: "tours", label: "Tours", path: "/tours", icon: "♜" },
      { key: "events", label: "Events", path: "/events", icon: "▣" },
      { key: "timeline", label: "Timeline", path: "/timeline", icon: "⌁" },
      { key: "vote", label: "Glasaj za grad", path: "/vote-city", special: true, icon: "🏆" },
    ],
    []
  );

  const quickMenuItems = useMemo(
    () => [
      { label: "Create live plan", action: () => navigate(user ? "/going-now/create" : "/login"), icon: "⚡", sub: "Start something now" },
      { label: "Create tour", action: () => navigate(user ? "/create-tour" : "/login"), icon: "🥾", sub: "Build an adventure" },
      { label: "Create event", action: () => navigate(user ? "/create-event" : "/login"), icon: "🎟️", sub: "Organize a bigger moment" },
      { label: "Saved tours", action: () => navigate(user ? "/saved-tours" : "/login"), icon: "🔖", sub: "Your saved adventures" },
      { label: "Profile", action: () => navigate(user ? `/profile/${user.id}` : "/login"), icon: "👤", sub: "View your profile" },
      { label: "Settings", action: () => navigate(user ? "/settings" : "/login"), icon: "⚙️", sub: "Account preferences" },
    ],
    [navigate, user]
  );

  const bestDisplayName = useMemo(() => {
    const fullName = profile?.full_name?.trim?.() || "";
    if (fullName) return fullName;
    return user?.email?.split("@")[0] || "Explorer";
  }, [profile, user]);

  const isActive = useCallback(
    (path) => {
      if (path === "/") return location.pathname === "/";
      return location.pathname.startsWith(path);
    },
    [location.pathname]
  );

  useEffect(() => {
    const updateHeaderOffset = () => {
      if (!headerRef.current) {
        setHeaderOffset(isMobile ? HEADER_MOBILE : HEADER_DESKTOP);
        return;
      }
      const next = Math.ceil(headerRef.current.getBoundingClientRect().height) + (isMobile ? 4 : 2);
      setHeaderOffset(next);
    };

    updateHeaderOffset();
    window.addEventListener("resize", updateHeaderOffset);
    return () => window.removeEventListener("resize", updateHeaderOffset);
  }, [isMobile, scrolled, menuOpen, notificationsOpen, searchOpen, user]);

  const closePanels = useCallback(() => {
    setMenuOpen(false);
    setNotificationsOpen(false);
    setSearchOpen(false);
  }, []);

  const loadNavbarData = useCallback(async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    setUser(authUser || null);

    if (!authUser) {
      setProfile(null);
      setAvatarUrl(FALLBACK_AVATAR);
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const [{ data: profileData }, { data: notes }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", authUser.id).single(),
      supabase
        .from("notifications")
        .select("*")
        .eq("user_id", authUser.id)
        .order("created_at", { ascending: false })
        .limit(30),
    ]);

    setProfile(profileData || null);
    setAvatarUrl(profileData?.avatar_url || FALLBACK_AVATAR);

    const safeNotes = notes || [];
    setNotifications(safeNotes);
    setUnreadCount(safeNotes.filter((n) => !(n.read || n.is_read)).length);
  }, []);

  const buildFriendsSet = useCallback(async () => {
    if (!user) {
      setFriendsSet(new Set());
      return;
    }

    const { data: iFollow } = await supabase
      .from("profile_follows")
      .select("following_id")
      .eq("follower_id", user.id)
      .limit(500);

    const followingIds = (iFollow || []).map((r) => r.following_id).filter(Boolean);

    if (!followingIds.length) {
      setFriendsSet(new Set());
      return;
    }

    const { data: theyFollowMe } = await supabase
      .from("profile_follows")
      .select("follower_id")
      .eq("following_id", user.id)
      .in("follower_id", followingIds)
      .limit(500);

    setFriendsSet(new Set((theyFollowMe || []).map((r) => r.follower_id).filter(Boolean)));
  }, [user]);

  useEffect(() => {
    loadNavbarData();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      loadNavbarData();
    });

    return () => listener?.subscription?.unsubscribe?.();
  }, [loadNavbarData]);

  useEffect(() => {
    let cleanup = null;

    async function subscribeRealtime() {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) return;

      const channel = supabase
        .channel(`navbar-notifications-${authUser.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${authUser.id}`,
          },
          (payload) => {
            setNotifications((prev) => [payload.new, ...prev]);
            if (!(payload.new.read || payload.new.is_read)) {
              setUnreadCount((prev) => prev + 1);
            }
          }
        )
        .subscribe();

      cleanup = () => {
        supabase.removeChannel(channel);
      };
    }

    subscribeRealtime();
    return () => cleanup?.();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 14);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onDown = (e) => {
      const target = e.target;
      const insideMobilePanel = mobilePanelRef.current?.contains(target);

      if (!insideMobilePanel && !searchRef.current?.contains(target)) setSearchOpen(false);
      if (!insideMobilePanel && !notifRef.current?.contains(target)) setNotificationsOpen(false);
      if (!insideMobilePanel && !menuRef.current?.contains(target)) setMenuOpen(false);
    };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, []);

  useEffect(() => {
    if (!searchOpen) {
      setSearchQuery("");
      setSearchResults([]);
      setSearchCursor(-1);
      return;
    }

    buildFriendsSet();
    const t = setTimeout(() => searchInputRef.current?.focus?.(), 40);
    return () => clearTimeout(t);
  }, [searchOpen, buildFriendsSet]);

  useEffect(() => {
    if (!searchOpen) return;

    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchCursor(-1);
      return;
    }

    const q = searchQuery.trim();
    const t = setTimeout(async () => {
      setSearchLoading(true);
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, home_base")
        .or(`full_name.ilike.%${q}%,home_base.ilike.%${q}%`)
        .limit(12);

      const rows = data || [];
      setSearchResults(rows);
      setSearchCursor(rows.length ? 0 : -1);
      setSearchLoading(false);
    }, 220);

    return () => clearTimeout(t);
  }, [searchOpen, searchQuery]);

  const onSearchKeyDown = (e) => {
    if (e.key === "Escape") {
      setSearchOpen(false);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSearchCursor((c) => Math.min(searchResults.length - 1, c + 1));
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSearchCursor((c) => Math.max(0, c - 1));
    }

    if (e.key === "Enter") {
      e.preventDefault();
      const idx = searchCursor >= 0 ? searchCursor : 0;
      const row = searchResults[idx];
      if (row?.id) {
        setSearchOpen(false);
        navigate(`/profile/${row.id}`);
      }
    }
  };

  const markAllAsRead = async () => {
    if (!user || unreadCount === 0) return;

    await supabase
      .from("notifications")
      .update({ read: true, is_read: true })
      .eq("user_id", user.id)
      .or("read.eq.false,is_read.eq.false");

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true, is_read: true })));
    setUnreadCount(0);
  };

  const clearNotifications = async () => {
    if (!user || notifications.length === 0) return;
    await supabase.from("notifications").delete().eq("user_id", user.id);
    setNotifications([]);
    setUnreadCount(0);
  };

  const openNotification = async (n) => {
    if (!(n.read || n.is_read)) {
      await supabase.from("notifications").update({ read: true, is_read: true }).eq("id", n.id);
      setNotifications((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, read: true, is_read: true } : x))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    setNotificationsOpen(false);
    if (n.link) navigate(n.link);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setAvatarUrl(FALLBACK_AVATAR);
    closePanels();
    navigate("/login");
  };

  const notificationIcon = (type) => {
    if (type === "creator_approved") return "✅";
    if (type === "creator_rejected") return "❌";
    if (type === "tour_joined") return "🎉";
    if (type === "new_message") return "💬";
    if (type === "new_follower") return "👤";
    if (type === "new_rating") return "⭐";
    return "🔔";
  };

  const topHeaderStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1400,
    borderRadius: 0,
    background: scrolled
      ? COLORS.bgSolid
      : isMobile
      ? "linear-gradient(180deg, rgba(6,17,13,0.54), rgba(6,17,13,0.38))"
      : "linear-gradient(180deg, rgba(6,17,13,0.68), rgba(6,17,13,0.42))",
    backdropFilter: "blur(22px) saturate(1.18)",
    WebkitBackdropFilter: "blur(22px) saturate(1.18)",
    border: scrolled
      ? `1px solid ${COLORS.lineStrong}`
      : "1px solid rgba(143,255,224,0.14)",
    boxShadow: scrolled
      ? "0 22px 60px rgba(0,0,0,0.38), 0 0 0 1px rgba(55,242,195,0.04), inset 0 1px 0 rgba(255,255,255,0.055)"
      : "0 18px 46px rgba(0,0,0,0.20), inset 0 1px 0 rgba(255,255,255,0.04)",
    transition:
      "background 180ms ease, border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease",
  };

  const shellStyle = {
    maxWidth: 1460,
    margin: "0 auto",
    padding: isMobile ? "8px 10px 8px" : "12px 18px 12px",
    display: "grid",
    gap: isMobile ? 7 : 0,
  };

  const topRowStyle = {
    minHeight: isMobile ? 48 : 58,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  };

  const brandWrapStyle = {
    display: "flex",
    alignItems: "center",
    gap: isMobile ? 10 : 12,
    cursor: "pointer",
    minWidth: 0,
    flexShrink: 0,
  };

  const brandTitleStyle = {
    fontWeight: 1000,
    letterSpacing: isMobile ? "0.035em" : "0.09em",
    textTransform: "uppercase",
    fontSize: isMobile ? 15 : 20,
    lineHeight: 1,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    color: COLORS.text,
  };

  const brandAccentStyle = {
    background: `linear-gradient(135deg, ${COLORS.mint} 0%, ${COLORS.mintBlue} 100%)`,
    WebkitBackgroundClip: "text",
    color: "transparent",
    textShadow: "0 0 16px rgba(55,242,195,0.16)",
  };

  const brandSubStyle = {
    fontSize: 10,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: COLORS.textDim,
    marginTop: 5,
    fontWeight: 850,
  };

  const desktopNavWrap = {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "6px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.035)",
    border: `1px solid ${COLORS.line}`,
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.045)",
    minWidth: 0,
  };

  const desktopNavItem = (active, live = false, special = false) => ({
    height: special ? 44 : 42,
    padding: special ? "0 16px" : live ? "0 14px" : "0 13px",
    borderRadius: 999,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    textDecoration: "none",
    color: active ? "#052018" : COLORS.text,
    background: active
      ? `linear-gradient(135deg, ${COLORS.mint} 0%, ${COLORS.mintBlue} 100%)`
      : special
      ? "linear-gradient(135deg, rgba(55,242,195,0.16), rgba(46,230,255,0.12))"
      : live
      ? "linear-gradient(135deg, rgba(55,242,195,0.10), rgba(46,230,255,0.08))"
      : "transparent",
    border: special
      ? `1px solid ${COLORS.lineStrong}`
      : active
      ? "1px solid rgba(255,255,255,0.10)"
      : "1px solid transparent",
    boxShadow: special
      ? "0 0 24px rgba(55,242,195,0.16)"
      : active
      ? "0 12px 28px rgba(55,242,195,0.22)"
      : "none",
    fontWeight: special ? 950 : active ? 950 : 820,
    fontSize: special ? 13 : 13,
    whiteSpace: "nowrap",
    transition: "all 160ms ease",
  });

  const navIconStyle = {
    opacity: 0.88,
    fontSize: 15,
    lineHeight: 1,
  };

  const topIconButton = (active = false, special = false) => ({
    width: isMobile ? 38 : 46,
    height: isMobile ? 38 : 46,
    borderRadius: isMobile ? 14 : 17,
    border: active
      ? `1px solid ${COLORS.lineStrong}`
      : special
      ? `1px solid ${COLORS.lineBlue}`
      : "1px solid rgba(255,255,255,0.10)",
    background: active
      ? "linear-gradient(135deg, rgba(55,242,195,0.16), rgba(46,230,255,0.12))"
      : special
      ? "linear-gradient(135deg, rgba(46,230,255,0.12), rgba(55,242,195,0.08))"
      : "rgba(255,255,255,0.045)",
    color: COLORS.text,
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
    boxShadow: active
      ? "0 0 18px rgba(55,242,195,0.16), 0 12px 28px rgba(0,0,0,0.24)"
      : "0 12px 28px rgba(0,0,0,0.18)",
    position: "relative",
    transition: "all 160ms ease",
    WebkitTapHighlightColor: "transparent",
    flexShrink: 0,
    fontSize: 18,
  });

  const createButtonStyle = {
    height: 46,
    padding: "0 18px",
    borderRadius: 999,
    border: "none",
    background: `linear-gradient(135deg, ${COLORS.mint} 0%, ${COLORS.mintBlue} 100%)`,
    color: "#052018",
    fontWeight: 950,
    fontSize: 14,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    cursor: "pointer",
    boxShadow: "0 16px 34px rgba(55,242,195,0.24)",
    whiteSpace: "nowrap",
    flexShrink: 0,
  };

  const panelBase = {
    position: "absolute",
    top: isMobile ? 52 : 58,
    right: 0,
    borderRadius: 26,
    padding: 14,
    background:
      "radial-gradient(circle at top left, rgba(55,242,195,0.13), transparent 32%), radial-gradient(circle at top right, rgba(46,230,255,0.12), transparent 36%), linear-gradient(180deg, rgba(8,22,17,0.985), rgba(5,13,10,0.985))",
    border: `1px solid ${COLORS.lineStrong}`,
    boxShadow: "0 30px 76px rgba(0,0,0,0.54), 0 0 0 1px rgba(55,242,195,0.05), inset 0 1px 0 rgba(255,255,255,0.05)",
    backdropFilter: "blur(24px) saturate(1.15)",
    WebkitBackdropFilter: "blur(24px) saturate(1.15)",
    zIndex: 1600,
    maxWidth: "calc(100vw - 24px)",
  };

  const mobileTabsWrap = {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 7,
    overflow: "hidden",
    padding: "2px 1px 3px",
  };

  const mobileTab = (active, live = false, special = false) => ({
    height: 38,
    minWidth: 0,
    padding: "0 6px",
    borderRadius: 999,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    textDecoration: "none",
    color: active ? "#052018" : COLORS.text,
    background: active
      ? `linear-gradient(135deg, ${COLORS.mint} 0%, ${COLORS.mintBlue} 100%)`
      : special
      ? "linear-gradient(135deg, rgba(55,242,195,0.16), rgba(46,230,255,0.12))"
      : live
      ? "linear-gradient(135deg, rgba(55,242,195,0.10), rgba(46,230,255,0.08))"
      : "rgba(255,255,255,0.04)",
    border: active
      ? "1px solid rgba(255,255,255,0.08)"
      : special || live
      ? `1px solid ${COLORS.lineStrong}`
      : `1px solid ${COLORS.line}`,
    boxShadow: active ? "0 12px 26px rgba(55,242,195,0.22)" : "none",
    fontWeight: active ? 950 : 820,
    fontSize: 12,
    whiteSpace: "nowrap",
    overflow: "hidden",
  });

  const avatarButtonStyle =
    user && !isMobile
      ? {
          height: 48,
          padding: "0 12px 0 7px",
          borderRadius: 999,
          border: menuOpen ? `1px solid ${COLORS.lineStrong}` : "1px solid rgba(255,255,255,0.12)",
          background: menuOpen
            ? "linear-gradient(135deg, rgba(55,242,195,0.14), rgba(46,230,255,0.10))"
            : "rgba(255,255,255,0.045)",
          color: COLORS.text,
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          cursor: "pointer",
          boxShadow: menuOpen
            ? "0 0 18px rgba(55,242,195,0.14), 0 10px 24px rgba(0,0,0,0.22)"
            : "0 12px 28px rgba(0,0,0,0.18)",
          flexShrink: 0,
        }
      : topIconButton(menuOpen);

  return (
    <>
      <header ref={headerRef} style={topHeaderStyle}>
        <div style={shellStyle}>
          <div style={topRowStyle}>
            <div
              style={brandWrapStyle}
              onClick={() => {
                closePanels();
                navigate("/");
              }}
            >
              {!isMobile ? <BrandMark mobile={isMobile} /> : null}

              {isMobile ? (
                <>
                  <button
                    type="button"
                    style={topIconButton(menuOpen)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen((p) => !p);
                      setSearchOpen(false);
                      setNotificationsOpen(false);
                    }}
                    title="Menu"
                  >
                    ☰
                  </button>
                  <BrandMark mobile />
                </>
              ) : null}

              <div style={{ minWidth: 0 }}>
                <div style={brandTitleStyle}>
                  MEET<span style={brandAccentStyle}>OUTDOORS</span>
                </div>
                {!isMobile ? <div style={brandSubStyle}>Explore • connect • adventure</div> : null}
              </div>
            </div>

            {!isMobile ? (
              <div style={desktopNavWrap}>
                {navItems.map((item) => {
                  const active = isActive(item.path);
                  return (
                    <Link key={item.key} to={item.path} style={desktopNavItem(active, item.live, item.special)}>
                      <span style={navIconStyle}>{item.icon}</span>
                      {item.live && !item.special ? <LiveDot /> : null}
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            ) : null}

            <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 7 : 9, flexShrink: 0 }}>
              <div ref={searchRef} style={{ position: "relative" }}>
                <button
                  type="button"
                  style={topIconButton(searchOpen, true)}
                  onClick={() => {
                    setSearchOpen((p) => !p);
                    setNotificationsOpen(false);
                    setMenuOpen(false);
                  }}
                  title="Search"
                >
                  🔎
                </button>

                {searchOpen && !isMobile ? (
                  <div style={{ ...panelBase, width: 430 }}>
                    <SearchPanel
                      searchInputRef={searchInputRef}
                      searchQuery={searchQuery}
                      setSearchQuery={setSearchQuery}
                      searchLoading={searchLoading}
                      searchResults={searchResults}
                      searchCursor={searchCursor}
                      setSearchCursor={setSearchCursor}
                      onSearchKeyDown={onSearchKeyDown}
                      navigate={navigate}
                      close={() => setSearchOpen(false)}
                      friendsSet={friendsSet}
                    />
                  </div>
                ) : null}
              </div>

              {user ? (
                <div ref={notifRef} style={{ position: "relative" }}>
                  <button
                    type="button"
                    style={topIconButton(notificationsOpen)}
                    onClick={() => {
                      const next = !notificationsOpen;
                      setNotificationsOpen(next);
                      setSearchOpen(false);
                      setMenuOpen(false);
                      if (next) markAllAsRead();
                    }}
                    title="Notifications"
                  >
                    🔔
                    {unreadCount > 0 ? (
                      <span
                        style={{
                          position: "absolute",
                          top: -5,
                          right: -4,
                          minWidth: 18,
                          height: 18,
                          padding: "0 5px",
                          borderRadius: 999,
                          background: "linear-gradient(135deg, #37f2c3, #2ee6ff)",
                          color: "#052018",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 10,
                          fontWeight: 950,
                          boxShadow: "0 0 16px rgba(55,242,195,0.48)",
                        }}
                      >
                        {unreadCount}
                      </span>
                    ) : null}
                  </button>

                  {notificationsOpen && !isMobile ? (
                    <div style={{ ...panelBase, width: 390 }}>
                      <NotificationsPanel
                        notifications={notifications}
                        clearNotifications={clearNotifications}
                        openNotification={openNotification}
                        notificationIcon={notificationIcon}
                      />
                    </div>
                  ) : null}
                </div>
              ) : null}

              {!isMobile ? (
                <button
                  type="button"
                  style={createButtonStyle}
                  onClick={() => navigate(user ? "/going-now/create" : "/login")}
                >
                  <span>＋</span>
                  <span>Create</span>
                </button>
              ) : null}

              {!user && !isMobile ? (
                <>
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    style={{
                      height: 44,
                      padding: "0 16px",
                      borderRadius: 999,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(255,255,255,0.04)",
                      color: COLORS.text,
                      fontWeight: 900,
                      fontSize: 14,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Log in
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate("/register")}
                    style={{
                      height: 44,
                      padding: "0 16px",
                      borderRadius: 999,
                      border: "none",
                      background: `linear-gradient(135deg, ${COLORS.mint} 0%, ${COLORS.mintBlue} 100%)`,
                      color: "#052018",
                      fontWeight: 950,
                      fontSize: 14,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      boxShadow: "0 14px 30px rgba(55,242,195,0.18)",
                    }}
                  >
                    Sign up
                  </button>
                </>
              ) : null}

              {(user || isMobile) ? (
                <div ref={menuRef} style={{ position: "relative" }}>
                  {!isMobile ? (
                    <button
                      type="button"
                      style={avatarButtonStyle}
                      onClick={() => {
                        setMenuOpen((p) => !p);
                        setSearchOpen(false);
                        setNotificationsOpen(false);
                      }}
                      title={user ? "Account" : "Menu"}
                    >
                      <AvatarImage avatarUrl={avatarUrl} size={34} online />
                      <span
                        style={{
                          maxWidth: 150,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          fontWeight: 900,
                          fontSize: 13,
                          color: COLORS.text,
                        }}
                      >
                        {bestDisplayName}
                      </span>
                      <span style={{ opacity: 0.72, fontSize: 12 }}>▾</span>
                    </button>
                  ) : user ? (
                    <button
                      type="button"
                      style={{
                        ...topIconButton(menuOpen),
                        padding: 0,
                        overflow: "visible",
                        background: menuOpen
                          ? "linear-gradient(135deg, rgba(55,242,195,0.14), rgba(46,230,255,0.10))"
                          : "rgba(255,255,255,0.045)",
                      }}
                      onClick={() => {
                        setMenuOpen((p) => !p);
                        setSearchOpen(false);
                        setNotificationsOpen(false);
                      }}
                      title="Account"
                    >
                      <AvatarImage avatarUrl={avatarUrl} size={38} online />
                    </button>
                  ) : null}

                  {menuOpen && !isMobile ? (
                    <div
                      style={{
                        ...panelBase,
                        width: 380,
                        right: 0,
                      }}
                    >
                      <MenuPanel
                        user={user}
                        avatarUrl={avatarUrl}
                        bestDisplayName={bestDisplayName}
                        email={user?.email || "Guest"}
                        quickMenuItems={quickMenuItems}
                        logout={logout}
                        navigate={navigate}
                        close={() => setMenuOpen(false)}
                        isMobile={isMobile}
                      />
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          {isMobile ? (
            <div style={mobileTabsWrap}>
              {navItems
                .filter((item) => ["home", "going-now", "tours", "vote"].includes(item.key))
                .map((item) => {
                  const active = isActive(item.path);
                  const shortLabel =
                    item.key === "going-now"
                      ? "Going"
                      : item.key === "vote"
                      ? "Glasaj"
                      : item.label;

                  return (
                    <Link key={item.key} to={item.path} style={mobileTab(active, item.live, item.special)}>
                      <span style={{ fontSize: 14 }}>{item.icon}</span>
                      {item.live && !item.special ? <LiveDot /> : null}
                      <span>{shortLabel}</span>
                    </Link>
                  );
                })}
            </div>
          ) : null}
        </div>
      </header>

      <div style={{ height: headerOffset }} />

      {isMobile && (searchOpen || notificationsOpen || menuOpen) ? (
        <div
          ref={mobilePanelRef}
          style={{
            position: "fixed",
            top: Math.max(8, headerOffset + 6),
            left: 10,
            right: 10,
            zIndex: 1600,
            ...panelBase,
            width: "auto",
            maxHeight: `calc(100vh - ${Math.max(8, headerOffset + 24)}px)`,
            overflowY: "auto",
          }}
        >
          {searchOpen ? (
            <SearchPanel
              searchInputRef={searchInputRef}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              searchLoading={searchLoading}
              searchResults={searchResults}
              searchCursor={searchCursor}
              setSearchCursor={setSearchCursor}
              onSearchKeyDown={onSearchKeyDown}
              navigate={navigate}
              close={() => setSearchOpen(false)}
              friendsSet={friendsSet}
            />
          ) : null}

          {notificationsOpen ? (
            <NotificationsPanel
              notifications={notifications}
              clearNotifications={clearNotifications}
              openNotification={openNotification}
              notificationIcon={notificationIcon}
            />
          ) : null}

          {menuOpen ? (
            <MenuPanel
              user={user}
              avatarUrl={avatarUrl}
              bestDisplayName={bestDisplayName}
              email={user?.email || "Guest"}
              quickMenuItems={quickMenuItems}
              logout={logout}
              navigate={navigate}
              close={() => setMenuOpen(false)}
              isMobile={isMobile}
            />
          ) : null}
        </div>
      ) : null}
    </>
  );
}

function AvatarImage({ avatarUrl, size = 38, online = false }) {
  return (
    <span
      style={{
        position: "relative",
        width: size,
        height: size,
        borderRadius: 999,
        display: "inline-flex",
        flexShrink: 0,
        padding: 2,
        background: "linear-gradient(135deg, rgba(55,242,195,0.95), rgba(46,230,255,0.65), rgba(255,255,255,0.18))",
        boxShadow: "0 0 0 1px rgba(255,255,255,0.10), 0 0 22px rgba(55,242,195,0.18)",
      }}
    >
      <img
        src={avatarUrl || FALLBACK_AVATAR}
        alt="avatar"
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 999,
          objectFit: "cover",
          display: "block",
          background: "rgba(255,255,255,0.06)",
        }}
      />
      {online ? (
        <span
          style={{
            position: "absolute",
            right: 0,
            bottom: 0,
            width: Math.max(10, Math.round(size * 0.26)),
            height: Math.max(10, Math.round(size * 0.26)),
            borderRadius: 999,
            background: COLORS.mint,
            border: "2px solid rgba(5,13,10,0.98)",
            boxShadow: "0 0 12px rgba(55,242,195,0.78)",
          }}
        />
      ) : null}
    </span>
  );
}

function SearchPanel({
  searchInputRef,
  searchQuery,
  setSearchQuery,
  searchLoading,
  searchResults,
  searchCursor,
  setSearchCursor,
  onSearchKeyDown,
  navigate,
  close,
  friendsSet,
}) {
  return (
    <div>
      <PanelHeader eyebrow="Search" title="Find explorers" close={close} />

      <div style={{ position: "relative" }}>
        <input
          ref={searchInputRef}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={onSearchKeyDown}
          placeholder="Search by name or home base..."
          style={{
            width: "100%",
            boxSizing: "border-box",
            borderRadius: 999,
            padding: "15px 16px 15px 48px",
            border: `1px solid ${COLORS.lineStrong}`,
            background: "rgba(255,255,255,0.045)",
            color: COLORS.text,
            outline: "none",
            fontSize: 14,
            fontWeight: 750,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 17,
            top: "50%",
            transform: "translateY(-50%)",
            color: COLORS.textSoft,
          }}
        >
          🔎
        </div>
      </div>

      <div style={{ marginTop: 13, maxHeight: 370, overflowY: "auto", paddingRight: 2 }}>
        {searchLoading ? <EmptyInfo title="Searching..." text="Looking for explorers." /> : null}

        {!searchLoading && searchQuery.trim().length > 0 && searchResults.length === 0 ? (
          <EmptyInfo title="No profiles found" text="Try another name or home base." />
        ) : null}

        {!searchLoading
          ? searchResults.map((p, idx) => {
              const name = p.full_name || "Explorer";
              const meta = p.home_base || "Explorer";
              const isFriend = friendsSet?.has?.(p.id);

              return (
                <button
                  key={p.id}
                  type="button"
                  onMouseEnter={() => setSearchCursor(idx)}
                  onClick={() => {
                    close();
                    navigate(`/profile/${p.id}`);
                  }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    textAlign: "left",
                    padding: 10,
                    borderRadius: 20,
                    border:
                      idx === searchCursor
                        ? `1px solid ${COLORS.lineStrong}`
                        : "1px solid rgba(255,255,255,0.08)",
                    background:
                      idx === searchCursor
                        ? "linear-gradient(135deg, rgba(55,242,195,0.14), rgba(46,230,255,0.10))"
                        : "rgba(255,255,255,0.04)",
                    color: COLORS.text,
                    cursor: "pointer",
                    marginBottom: 8,
                  }}
                >
                  <AvatarImage avatarUrl={p.avatar_url || FALLBACK_AVATAR} size={48} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 950, fontSize: 14, color: COLORS.text }}>{name}</div>
                    <div
                      style={{
                        color: COLORS.textSoft,
                        fontSize: 12,
                        marginTop: 4,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {meta}
                    </div>
                  </div>
                  {isFriend ? (
                    <span
                      style={{
                        padding: "6px 10px",
                        borderRadius: 999,
                        background: `linear-gradient(135deg, ${COLORS.mint} 0%, ${COLORS.mintBlue} 100%)`,
                        color: "#052018",
                        fontWeight: 950,
                        fontSize: 10,
                        whiteSpace: "nowrap",
                      }}
                    >
                      Friend
                    </span>
                  ) : null}
                </button>
              );
            })
          : null}
      </div>
    </div>
  );
}

function NotificationsPanel({ notifications, clearNotifications, openNotification, notificationIcon }) {
  return (
    <div>
      <PanelHeader
        eyebrow="Notifications"
        title="Alerts and activity"
        right={
          notifications.length ? (
            <button
              type="button"
              onClick={clearNotifications}
              style={{
                border: "none",
                background: "transparent",
                color: COLORS.danger,
                cursor: "pointer",
                fontWeight: 900,
                fontSize: 12,
              }}
            >
              Clear all
            </button>
          ) : null
        }
      />

      {notifications.length === 0 ? (
        <EmptyInfo title="All clear" text="You're caught up for now." />
      ) : (
        <div style={{ maxHeight: 380, overflowY: "auto", paddingRight: 2 }}>
          {notifications.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => openNotification(n)}
              style={{
                width: "100%",
                textAlign: "left",
                padding: 12,
                borderRadius: 20,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.045)",
                color: COLORS.text,
                cursor: n.link ? "pointer" : "default",
                marginBottom: 10,
              }}
            >
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 15,
                    display: "grid",
                    placeItems: "center",
                    background: "rgba(55,242,195,0.10)",
                    border: `1px solid ${COLORS.line}`,
                    flexShrink: 0,
                  }}
                >
                  {notificationIcon(n.type)}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 950, fontSize: 13 }}>{n.title || "Notification"}</div>
                  <div style={{ fontSize: 12, lineHeight: 1.5, color: COLORS.textSoft, marginTop: 5 }}>
                    {n.body || n.message || "No details available."}
                  </div>
                  <div style={{ fontSize: 11, color: COLORS.textDim, marginTop: 8 }}>
                    {new Date(n.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MenuPanel({ user, avatarUrl, bestDisplayName, email, quickMenuItems, logout, navigate, close, isMobile }) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 13,
          paddingBottom: 14,
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          marginBottom: 13,
        }}
      >
        <AvatarImage avatarUrl={avatarUrl || FALLBACK_AVATAR} size={58} online={Boolean(user)} />

        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontWeight: 950, color: COLORS.text, fontSize: 16, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {user ? bestDisplayName : "Guest explorer"}
          </div>
          <div style={{ fontSize: 12, color: COLORS.mintSoft, marginTop: 3, fontWeight: 850 }}>
            {user ? "Explorer" : "Not logged in"}
          </div>
          <div style={{ fontSize: 12, color: COLORS.textSoft, marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {email}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: 9,
        }}
      >
        {quickMenuItems.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => {
              close();
              item.action();
            }}
            style={{
              width: "100%",
              textAlign: "left",
              padding: "12px 13px",
              borderRadius: 18,
              border: "1px solid rgba(255,255,255,0.08)",
              background: item.label === "Create live plan"
                ? "linear-gradient(135deg, rgba(55,242,195,0.15), rgba(46,230,255,0.10))"
                : "rgba(255,255,255,0.045)",
              color: COLORS.text,
              cursor: "pointer",
              fontWeight: 850,
              fontSize: 13,
              display: "grid",
              gridTemplateColumns: "34px 1fr auto",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span
              style={{
                width: 34,
                height: 34,
                borderRadius: 13,
                display: "grid",
                placeItems: "center",
                background: "rgba(255,255,255,0.06)",
                border: `1px solid ${COLORS.line}`,
              }}
            >
              {item.icon}
            </span>
            <span style={{ minWidth: 0 }}>
              <span style={{ display: "block", fontWeight: 950 }}>{item.label}</span>
              <span style={{ display: "block", color: COLORS.textDim, fontSize: 11, marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {item.sub}
              </span>
            </span>
            <span style={{ color: COLORS.textDim }}>›</span>
          </button>
        ))}
      </div>

      {user ? (
        <button
          type="button"
          onClick={logout}
          style={{
            width: "100%",
            textAlign: "left",
            padding: "13px 14px",
            borderRadius: 18,
            border: "1px solid rgba(255,140,140,0.22)",
            background: "linear-gradient(135deg, rgba(255,140,140,0.10), rgba(255,90,110,0.05))",
            color: COLORS.danger,
            cursor: "pointer",
            fontWeight: 950,
            fontSize: 13,
            marginTop: 10,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span>↪</span>
          <span>Logout</span>
        </button>
      ) : (
        <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
          <button
            type="button"
            onClick={() => {
              close();
              navigate("/login");
            }}
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.04)",
              color: COLORS.text,
              cursor: "pointer",
              fontWeight: 900,
            }}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => {
              close();
              navigate("/register");
            }}
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 16,
              border: "none",
              background: `linear-gradient(135deg, ${COLORS.mint} 0%, ${COLORS.mintBlue} 100%)`,
              color: "#052018",
              cursor: "pointer",
              fontWeight: 950,
            }}
          >
            Join now
          </button>
        </div>
      )}
    </div>
  );
}

function PanelHeader({ eyebrow, title, close, right }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 12,
        marginBottom: 13,
      }}
    >
      <div>
        <div
          style={{
            color: COLORS.textDim,
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.16em",
            fontWeight: 950,
          }}
        >
          {eyebrow}
        </div>
        <div style={{ color: COLORS.text, fontWeight: 950, fontSize: 17, marginTop: 4 }}>
          {title}
        </div>
      </div>

      {right || (close ? (
        <button
          type="button"
          onClick={close}
          style={{
            width: 36,
            height: 36,
            borderRadius: 13,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.05)",
            color: COLORS.text,
            cursor: "pointer",
          }}
        >
          ✕
        </button>
      ) : null)}
    </div>
  );
}

function EmptyInfo({ title, text }) {
  return (
    <div
      style={{
        padding: "16px 14px",
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.04)",
      }}
    >
      <div style={{ color: COLORS.text, fontWeight: 950, fontSize: 14 }}>{title}</div>
      <div style={{ color: COLORS.textSoft, fontSize: 12, lineHeight: 1.55, marginTop: 6 }}>{text}</div>
    </div>
  );
}
