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
const HEADER_MOBILE = 118;

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
        width: mobile ? 40 : 46,
        height: mobile ? 40 : 46,
        borderRadius: mobile ? 14 : 16,
        background:
          "radial-gradient(circle at 28% 24%, rgba(143,255,224,1), rgba(55,242,195,1) 34%, rgba(46,230,255,1) 68%, rgba(7,34,28,1) 100%)",
        display: "grid",
        placeItems: "center",
        boxShadow:
          "0 0 0 1px rgba(255,255,255,0.10), 0 0 22px rgba(55,242,195,0.24), 0 16px 34px rgba(0,0,0,0.30)",
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: mobile ? 20 : 22 }}>🏔️</span>
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
        boxShadow: "0 0 12px rgba(55,242,195,0.8)",
        flexShrink: 0,
      }}
    />
  );
}

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

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

  const [headerOffset, setHeaderOffset] = useState(isMobile ? HEADER_MOBILE : HEADER_DESKTOP);

  const navItems = useMemo(
    () => [
      { key: "home", label: "Home", path: "/" },
      { key: "going-now", label: "Going Now", path: "/going-now", live: true },
      { key: "tours", label: "Tours", path: "/tours" },
      { key: "events", label: "Events", path: "/events" },
      { key: "timeline", label: "Timeline", path: "/timeline" },
    ],
    []
  );

  const quickMenuItems = useMemo(
    () => [
      { label: "Create live plan", action: () => navigate(user ? "/create-going-now" : "/login") },
      { label: "Create tour", action: () => navigate(user ? "/create-tour" : "/login") },
      { label: "Create event", action: () => navigate(user ? "/create-event" : "/login") },
      { label: "Saved tours", action: () => navigate(user ? "/saved-tours" : "/login") },
      { label: "Profile", action: () => navigate(user ? `/profile/${user.id}` : "/login") },
      { label: "Settings", action: () => navigate(user ? "/settings" : "/login") },
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
      const next = Math.ceil(headerRef.current.getBoundingClientRect().height) + (isMobile ? 8 : 4);
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
      if (!searchRef.current?.contains(target)) setSearchOpen(false);
      if (!notifRef.current?.contains(target)) setNotificationsOpen(false);
      if (!menuRef.current?.contains(target)) setMenuOpen(false);
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
    background: scrolled
      ? COLORS.bgSolid
      : isMobile
      ? "rgba(6, 17, 13, 0.38)"
      : "linear-gradient(180deg, rgba(6, 17, 13, 0.56), rgba(6, 17, 13, 0.34))",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
    borderBottom: scrolled
      ? `1px solid ${COLORS.lineStrong}`
      : "1px solid rgba(255,255,255,0.05)",
    boxShadow: scrolled
      ? "0 18px 40px rgba(0,0,0,0.32), 0 0 0 1px rgba(55,242,195,0.04)"
      : "none",
    transition:
      "background 180ms ease, border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease",
  };

  const shellStyle = {
    maxWidth: 1380,
    margin: "0 auto",
    padding: isMobile ? "10px 14px 10px" : "14px 22px 14px",
    display: "grid",
    gap: isMobile ? 8 : 0,
  };

  const topRowStyle = {
    minHeight: isMobile ? 52 : 54,
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
    letterSpacing: isMobile ? "0.08em" : "0.12em",
    textTransform: "uppercase",
    fontSize: isMobile ? 15 : 18,
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
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: COLORS.textDim,
    marginTop: 4,
    fontWeight: 800,
  };

  const desktopNavWrap = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "6px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.03)",
    border: `1px solid ${COLORS.line}`,
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
  };

  const desktopNavItem = (active, live = false) => ({
    height: 44,
    padding: live ? "0 16px" : "0 14px",
    borderRadius: 999,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    textDecoration: "none",
    color: active ? "#052018" : COLORS.text,
    background: active
      ? `linear-gradient(135deg, ${COLORS.mint} 0%, ${COLORS.mintBlue} 100%)`
      : live
      ? "linear-gradient(135deg, rgba(55,242,195,0.12), rgba(46,230,255,0.10))"
      : "transparent",
    border: active
      ? "1px solid rgba(255,255,255,0.08)"
      : live
      ? `1px solid ${COLORS.lineStrong}`
      : "1px solid transparent",
    boxShadow: active ? "0 12px 28px rgba(55,242,195,0.24)" : "none",
    fontWeight: active ? 950 : 820,
    fontSize: 14,
    whiteSpace: "nowrap",
    transition: "all 160ms ease",
  });

  const topIconButton = (active = false, special = false) => ({
    width: isMobile ? 40 : 44,
    height: isMobile ? 40 : 44,
    borderRadius: 14,
    border: active
      ? `1px solid ${COLORS.lineStrong}`
      : special
      ? `1px solid ${COLORS.lineBlue}`
      : "1px solid rgba(255,255,255,0.10)",
    background: active
      ? "linear-gradient(135deg, rgba(55,242,195,0.16), rgba(46,230,255,0.12))"
      : special
      ? "linear-gradient(135deg, rgba(46,230,255,0.14), rgba(55,242,195,0.10))"
      : "rgba(255,255,255,0.04)",
    color: COLORS.text,
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
    boxShadow: active
      ? "0 0 18px rgba(55,242,195,0.14), 0 10px 24px rgba(0,0,0,0.22)"
      : "0 10px 24px rgba(0,0,0,0.18)",
    position: "relative",
    transition: "all 160ms ease",
    WebkitTapHighlightColor: "transparent",
  });

  const createButtonStyle = {
    height: 46,
    padding: "0 16px",
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
    boxShadow: "0 14px 30px rgba(55,242,195,0.22)",
    whiteSpace: "nowrap",
  };

  const panelBase = {
    position: "absolute",
    top: isMobile ? 48 : 54,
    right: 0,
    borderRadius: 24,
    padding: 14,
    background:
      "radial-gradient(circle at top left, rgba(55,242,195,0.12), transparent 30%), radial-gradient(circle at top right, rgba(46,230,255,0.10), transparent 34%), linear-gradient(180deg, rgba(8,22,17,0.98), rgba(6,14,12,0.98))",
    border: `1px solid ${COLORS.lineStrong}`,
    boxShadow: "0 28px 64px rgba(0,0,0,0.46), 0 0 0 1px rgba(55,242,195,0.05)",
    backdropFilter: "blur(22px)",
    WebkitBackdropFilter: "blur(22px)",
    zIndex: 1600,
  };

  const mobileTabsWrap = {
    display: "flex",
    gap: 10,
    overflowX: "auto",
    paddingBottom: 2,
    scrollbarWidth: "none",
    WebkitOverflowScrolling: "touch",
  };

  const mobileTab = (active, live = false) => ({
    height: 40,
    padding: live ? "0 14px" : "0 13px",
    borderRadius: 999,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    textDecoration: "none",
    color: active ? "#052018" : COLORS.text,
    background: active
      ? `linear-gradient(135deg, ${COLORS.mint} 0%, ${COLORS.mintBlue} 100%)`
      : live
      ? "linear-gradient(135deg, rgba(55,242,195,0.12), rgba(46,230,255,0.10))"
      : "rgba(255,255,255,0.04)",
    border: active
      ? "1px solid rgba(255,255,255,0.08)"
      : live
      ? `1px solid ${COLORS.lineStrong}`
      : `1px solid ${COLORS.line}`,
    boxShadow: active ? "0 12px 26px rgba(55,242,195,0.22)" : "none",
    fontWeight: active ? 950 : 820,
    fontSize: 13,
    whiteSpace: "nowrap",
    flex: "0 0 auto",
  });

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
              <BrandMark mobile={isMobile} />

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
                    <Link key={item.key} to={item.path} style={desktopNavItem(active, item.live)}>
                      {item.live ? <LiveDot /> : null}
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            ) : null}

            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              {!isMobile ? (
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

                  {searchOpen ? (
                    <div style={{ ...panelBase, width: 420, maxWidth: "92vw" }}>
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
              ) : null}

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
                          background: "linear-gradient(135deg, #ff5574, #ff8c8c)",
                          color: "white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 10,
                          fontWeight: 900,
                          boxShadow: "0 0 14px rgba(255,90,110,0.46)",
                        }}
                      >
                        {unreadCount}
                      </span>
                    ) : null}
                  </button>

                  {notificationsOpen ? (
                    <div style={{ ...panelBase, width: isMobile ? "min(96vw, 420px)" : 370 }}>
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
                  onClick={() => navigate(user ? "/create-going-now" : "/login")}
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
                <button
                  type="button"
                  style={
                    user && !isMobile
                      ? {
                          height: 46,
                          padding: "0 12px 0 8px",
                          borderRadius: 999,
                          border: menuOpen ? `1px solid ${COLORS.lineStrong}` : "1px solid rgba(255,255,255,0.12)",
                          background: menuOpen
                            ? "linear-gradient(135deg, rgba(55,242,195,0.14), rgba(46,230,255,0.10))"
                            : "rgba(255,255,255,0.04)",
                          color: COLORS.text,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 10,
                          cursor: "pointer",
                          boxShadow: menuOpen
                            ? "0 0 18px rgba(55,242,195,0.14), 0 10px 24px rgba(0,0,0,0.22)"
                            : "0 10px 24px rgba(0,0,0,0.18)",
                        }
                      : topIconButton(menuOpen)
                  }
                  onClick={() => {
                    setMenuOpen((p) => !p);
                    setSearchOpen(false);
                    setNotificationsOpen(false);
                  }}
                  title={user ? "Account" : "Menu"}
                >
                  {user ? (
                    isMobile ? (
                      <img
                        src={avatarUrl || FALLBACK_AVATAR}
                        alt="avatar"
                        style={{ width: "100%", height: "100%", borderRadius: 14, objectFit: "cover" }}
                      />
                    ) : (
                      <>
                        <img
                          src={avatarUrl || FALLBACK_AVATAR}
                          alt="avatar"
                          style={{ width: 30, height: 30, borderRadius: 999, objectFit: "cover", border: "1px solid rgba(255,255,255,0.12)" }}
                        />
                        <span
                          style={{
                            maxWidth: 160,
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
                      </>
                    )
                  ) : (
                    isMobile ? "☰" : "☰"
                  )}
                </button>

                {menuOpen ? (
                  <div
                    style={{
                      ...panelBase,
                      width: isMobile ? "min(96vw, 360px)" : 290,
                      right: 0,
                      left: isMobile ? "auto" : undefined,
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
              {navItems.map((item) => {
                const active = isActive(item.path);
                return (
                  <Link key={item.key} to={item.path} style={mobileTab(active, item.live)}>
                    {item.live ? <LiveDot /> : null}
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ) : null}
        </div>
      </header>

      <div style={{ height: headerOffset }} />

      {isMobile && searchOpen ? (
        <div
          ref={searchRef}
          style={{
            position: "fixed",
            top: headerOffset - 6,
            left: 10,
            right: 10,
            zIndex: 1600,
            ...panelBase,
            width: "auto",
          }}
        >
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
    </>
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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div>
          <div
            style={{
              color: COLORS.textDim,
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.16em",
              fontWeight: 900,
            }}
          >
            Search
          </div>
          <div style={{ color: COLORS.text, fontWeight: 900, fontSize: 16, marginTop: 4 }}>
            Profiles and home base
          </div>
        </div>

        <button
          type="button"
          onClick={close}
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.05)",
            color: COLORS.text,
            cursor: "pointer",
          }}
        >
          ✕
        </button>
      </div>

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
            padding: "14px 16px 14px 46px",
            border: `1px solid ${COLORS.lineStrong}`,
            background: "rgba(255,255,255,0.04)",
            color: COLORS.text,
            outline: "none",
            fontSize: 14,
            fontWeight: 700,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 16,
            top: "50%",
            transform: "translateY(-50%)",
            color: COLORS.textSoft,
          }}
        >
          🔎
        </div>
      </div>

      <div style={{ marginTop: 12, maxHeight: 360, overflowY: "auto" }}>
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
                    borderRadius: 18,
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
                  <img
                    src={p.avatar_url || FALLBACK_AVATAR}
                    alt="avatar"
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 18,
                      objectFit: "cover",
                      border: `1px solid ${COLORS.line}`,
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 900, fontSize: 14, color: COLORS.text }}>{name}</div>
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
                        padding: "5px 9px",
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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div>
          <div
            style={{
              color: COLORS.textDim,
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.16em",
              fontWeight: 900,
            }}
          >
            Notifications
          </div>
          <div style={{ color: COLORS.text, fontWeight: 900, fontSize: 16, marginTop: 4 }}>
            Alerts and activity
          </div>
        </div>

        {notifications.length ? (
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
        ) : null}
      </div>

      {notifications.length === 0 ? (
        <EmptyInfo title="All clear" text="You're caught up for now." />
      ) : (
        <div style={{ maxHeight: 360, overflowY: "auto" }}>
          {notifications.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => openNotification(n)}
              style={{
                width: "100%",
                textAlign: "left",
                padding: 12,
                borderRadius: 18,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.04)",
                color: COLORS.text,
                cursor: n.link ? "pointer" : "default",
                marginBottom: 10,
              }}
            >
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 14,
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
                  <div style={{ fontWeight: 900, fontSize: 13 }}>{n.title || "Notification"}</div>
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
          gap: 12,
          paddingBottom: 12,
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          marginBottom: 12,
        }}
      >
        <img
          src={avatarUrl || FALLBACK_AVATAR}
          alt="avatar"
          style={{
            width: 50,
            height: 50,
            borderRadius: 18,
            objectFit: "cover",
            border: `1px solid ${COLORS.lineStrong}`,
            boxShadow: "0 0 18px rgba(55,242,195,0.12)",
          }}
        />

        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontWeight: 950, color: COLORS.text, fontSize: 15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {user ? bestDisplayName : "Guest explorer"}
          </div>
          <div style={{ fontSize: 12, color: COLORS.textSoft, marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {email}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gap: 8 }}>
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
              padding: isMobile ? "12px 13px" : "11px 13px",
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.04)",
              color: COLORS.text,
              cursor: "pointer",
              fontWeight: 800,
              fontSize: 13,
            }}
          >
            {item.label}
          </button>
        ))}

        {user ? (
          <button
            type="button"
            onClick={logout}
            style={{
              width: "100%",
              textAlign: "left",
              padding: isMobile ? "12px 13px" : "11px 13px",
              borderRadius: 16,
              border: "1px solid rgba(255,140,140,0.18)",
              background: "rgba(255,140,140,0.08)",
              color: COLORS.danger,
              cursor: "pointer",
              fontWeight: 900,
              fontSize: 13,
              marginTop: 4,
            }}
          >
            Logout
          </button>
        ) : (
          <div style={{ display: "grid", gap: 8, marginTop: 4 }}>
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
      <div style={{ color: COLORS.text, fontWeight: 900, fontSize: 14 }}>{title}</div>
      <div style={{ color: COLORS.textSoft, fontSize: 12, lineHeight: 1.55, marginTop: 6 }}>{text}</div>
    </div>
  );
}
