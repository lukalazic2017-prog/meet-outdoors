// src/components/Navbar.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

const FriendBadge = () => (
  <span
    style={{
      fontSize: 10,
      padding: "5px 10px",
      borderRadius: 999,
      background:
        "linear-gradient(135deg, rgba(0,255,195,0.95), rgba(0,180,255,0.95))",
      color: "#02130d",
      fontWeight: 950,
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      boxShadow:
        "0 10px 26px rgba(0,255,195,0.22), 0 0 16px rgba(0,255,195,0.38)",
      border: "1px solid rgba(255,255,255,0.16)",
      whiteSpace: "nowrap",
      flexShrink: 0,
    }}
  >
    🤝 Friend
  </span>
);

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);

  const [isMobile, setIsMobile] = useState(
    window.innerWidth < 900 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  );

  const [activitiesOpen, setActivitiesOpen] = useState(false);
  const [toursMenuOpen, setToursMenuOpen] = useState(false);
  const [eventsMenuOpen, setEventsMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [createMenuOpen, setCreateMenuOpen] = useState(false);

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchCursor, setSearchCursor] = useState(-1);
  const [friendsSet, setFriendsSet] = useState(new Set());

  const searchWrapRef = useRef(null);
  const searchInputRef = useRef(null);
  const notificationsWrapRef = useRef(null);
  const userWrapRef = useRef(null);
  const activitiesWrapRef = useRef(null);
  const toursWrapRef = useRef(null);
  const eventsWrapRef = useRef(null);

  const activityItems = useMemo(
    () => [
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
    ],
    []
  );

  const notificationIcon = (type) => {
    if (type === "creator_approved") return "✅";
    if (type === "creator_rejected") return "❌";
    if (type === "tour_joined") return "🎉";
    if (type === "new_message") return "💬";
    if (type === "new_follower") return "👤";
    if (type === "new_rating") return "⭐";
    return "🔔";
  };

  const bestDisplayName = (p) => (p?.full_name || "Explorer").trim();

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const isMobileBottomActive = (key) => {
    if (key === "home") return location.pathname === "/";
    if (key === "tours")
      return location.pathname.startsWith("/tours") || location.pathname.startsWith("/tour/");
    if (key === "activities") return location.pathname.startsWith("/activities");
    if (key === "create")
      return (
        location.pathname.startsWith("/create-tour") ||
        location.pathname.startsWith("/create-event")
      );
    if (key === "events")
      return location.pathname.startsWith("/events") || location.pathname.startsWith("/event/");
    if (key === "timeline") return location.pathname.startsWith("/timeline");
    if (key === "profile")
      return (
        location.pathname.startsWith("/profile") ||
        location.pathname.startsWith("/edit-profile") ||
        location.pathname.startsWith("/settings")
      );
    return false;
  };

  const linkStyle = (path) => ({
    color: isActive(path) ? "#ffffff" : "rgba(255,255,255,0.78)",
    fontWeight: isActive(path) ? 850 : 700,
    fontSize: 14,
    textDecoration: "none",
    padding: "11px 14px",
    borderRadius: 999,
    background: isActive(path)
      ? "linear-gradient(135deg, rgba(0,255,176,0.18), rgba(64,170,255,0.14))"
      : "rgba(255,255,255,0.02)",
    border: isActive(path)
      ? "1px solid rgba(0,255,176,0.20)"
      : "1px solid transparent",
    boxShadow: isActive(path)
      ? "0 0 18px rgba(0,255,160,0.12)"
      : "none",
    transition: "all 0.18s ease",
    whiteSpace: "nowrap",
  });

  const neonRing = {
    boxShadow:
      "0 0 0 1px rgba(0,255,184,0.16), 0 18px 45px rgba(0,0,0,0.9), 0 0 40px rgba(0,255,184,0.10)",
  };

  const goToActivity = (name) => {
    setActivitiesOpen(false);
    setToursMenuOpen(false);
    setEventsMenuOpen(false);
    setCreateMenuOpen(false);
    navigate(`/tours?activity=${encodeURIComponent(name)}`);
  };

  const closeAllMenus = () => {
    setSearchOpen(false);
    setNotificationsOpen(false);
    setUserMenuOpen(false);
    setActivitiesOpen(false);
    setToursMenuOpen(false);
    setEventsMenuOpen(false);
    setCreateMenuOpen(false);
  };

  useEffect(() => {
    let mounted = true;

    async function loadEverything() {
      const { data: auth } = await supabase.auth.getUser();
      const currentUser = auth?.user || null;

      if (!mounted) return;
      setUser(currentUser);

      if (!currentUser) {
        setAvatarUrl(null);
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", currentUser.id)
        .single();

      if (!mounted) return;

      if (profile?.avatar_url) {
        setAvatarUrl(`${profile.avatar_url}?t=${Date.now()}`);
      } else {
        setAvatarUrl(null);
      }

      const { data: notes } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false });

      if (!mounted) return;

      const safeNotes = notes || [];
      setNotifications(safeNotes);
      setUnreadCount(safeNotes.filter((n) => !(n.read || n.is_read)).length);
    }

    loadEverything();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      loadEverything();
    });

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    let cleanup = null;

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

    connectRealtime();

    return () => cleanup?.();
  }, []);

  useEffect(() => {
    const onResize = () => {
      setIsMobile(
        window.innerWidth < 900 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      );
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setNotifications([]);
    setUnreadCount(0);
    closeAllMenus();
    navigate("/login");
  };

  const markAllAsRead = async () => {
    if (!user || unreadCount === 0) return;

    await supabase
      .from("notifications")
      .update({ read: true, is_read: true })
      .eq("user_id", user.id)
      .or("read.eq.false,is_read.eq.false");

    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read: true, is_read: true }))
    );
    setUnreadCount(0);
  };

  const clearNotifications = async () => {
    if (!user || notifications.length === 0) return;
    await supabase.from("notifications").delete().eq("user_id", user.id);
    setNotifications([]);
    setUnreadCount(0);
  };

  const openNotification = async (n) => {
    try {
      if (!(n.read || n.is_read)) {
        await supabase
          .from("notifications")
          .update({ read: true, is_read: true })
          .eq("id", n.id);

        setNotifications((prev) =>
          prev.map((x) =>
            x.id === n.id ? { ...x, read: true, is_read: true } : x
          )
        );

        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      setNotificationsOpen(false);

      if (n.link) {
        navigate(n.link);
      }
    } catch (err) {
      console.log("notification click error:", err);
    }
  };

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

    const followingIds = (iFollow || [])
      .map((r) => r.following_id)
      .filter(Boolean);

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

    setFriendsSet(
      new Set((theyFollowMe || []).map((r) => r.follower_id).filter(Boolean))
    );
  }, [user]);

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
        .limit(10);

      const rows = data || [];
      setSearchResults(rows);
      setSearchCursor(rows.length ? 0 : -1);
      setSearchLoading(false);
    }, 260);

    return () => clearTimeout(t);
  }, [searchQuery, searchOpen]);

  useEffect(() => {
    if (searchOpen) {
      setNotificationsOpen(false);
      setUserMenuOpen(false);
      setActivitiesOpen(false);
      setToursMenuOpen(false);
      setEventsMenuOpen(false);
      setCreateMenuOpen(false);
    }
  }, [searchOpen]);

  useEffect(() => {
    if (searchOpen) {
      buildFriendsSet();
      setTimeout(() => searchInputRef.current?.focus?.(), 60);
    } else {
      setSearchQuery("");
      setSearchResults([]);
      setSearchCursor(-1);
    }
  }, [searchOpen, buildFriendsSet]);

  useEffect(() => {
    const onDown = (e) => {
      const t = e.target;

      const inSearch = searchWrapRef.current?.contains(t);
      const inNotes = notificationsWrapRef.current?.contains(t);
      const inUser = userWrapRef.current?.contains(t);
      const inAct = activitiesWrapRef.current?.contains(t);
      const inTours = toursWrapRef.current?.contains(t);
      const inEvents = eventsWrapRef.current?.contains(t);

      if (!inSearch) setSearchOpen(false);
      if (!inNotes) setNotificationsOpen(false);
      if (!inUser) setUserMenuOpen(false);
      if (!inAct) setActivitiesOpen(false);
      if (!inTours) setToursMenuOpen(false);
      if (!inEvents) setEventsMenuOpen(false);
    };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);

    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, []);

  const onSearchKeyDown = (e) => {
    if (!searchOpen) return;

    if (e.key === "Escape") {
      e.preventDefault();
      setSearchOpen(false);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSearchCursor((c) => Math.min((searchResults?.length || 0) - 1, c + 1));
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSearchCursor((c) => Math.max(0, c - 1));
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      const idx = searchCursor >= 0 ? searchCursor : 0;
      const first = searchResults?.[idx] || searchResults?.[0];
      if (first?.id) {
        setSearchOpen(false);
        navigate(`/profile/${first.id}`);
      }
    }
  };

  const iconBtn = {
    width: 44,
    height: 44,
    borderRadius: 16,
    background:
      "linear-gradient(135deg, rgba(0,255,184,0.14), rgba(88,170,255,0.10))",
    border: "1px solid rgba(255,255,255,0.12)",
    cursor: "pointer",
    fontSize: 18,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    boxShadow:
      "0 0 18px rgba(0,255,184,0.12), 0 10px 28px rgba(0,0,0,0.75)",
    transition: "transform .14s ease, filter .14s ease",
    WebkitTapHighlightColor: "transparent",
    position: "relative",
  };

  const dropdownBase = {
    position: "absolute",
    top: 52,
    borderRadius: 22,
    padding: 14,
    background:
      "radial-gradient(120% 120% at 10% 0%, rgba(0,255,184,0.14), transparent 45%)," +
      "radial-gradient(120% 120% at 90% 0%, rgba(88,170,255,0.12), transparent 48%)," +
      "linear-gradient(180deg, rgba(6,30,22,0.98), rgba(2,10,8,0.98))",
    border: "1px solid rgba(255,255,255,0.10)",
    backdropFilter: "blur(20px)",
    zIndex: 3000,
    overflow: "hidden",
    ...neonRing,
  };

  const userMenuItem = {
    width: "100%",
    padding: "11px 12px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.10)",
    textAlign: "left",
    background: "rgba(255,255,255,0.03)",
    color: "rgba(255,255,255,0.94)",
    fontSize: 13,
    cursor: "pointer",
    marginBottom: 8,
    fontWeight: 700,
  };

  const userMenuDanger = {
    ...userMenuItem,
    background: "rgba(255,80,80,0.12)",
    borderColor: "rgba(255,120,120,0.22)",
    color: "#ff9a9a",
    marginBottom: 0,
  };

  const authBtn = {
    padding: "10px 16px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.05)",
    color: "white",
    fontWeight: 800,
    fontSize: 13,
    cursor: "pointer",
    boxShadow: "0 10px 26px rgba(0,0,0,0.55)",
    whiteSpace: "nowrap",
  };


  const mobileTopIcon = (active = false) => ({
    width: 40,
    height: 40,
    borderRadius: 14,
    border: active
      ? "1px solid rgba(0,255,184,0.28)"
      : "1px solid rgba(255,255,255,0.10)",
    background: active
      ? "linear-gradient(135deg, rgba(0,255,184,0.16), rgba(88,170,255,0.12))"
      : "rgba(255,255,255,0.05)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: active
      ? "0 0 18px rgba(0,255,184,0.16)"
      : "0 10px 24px rgba(0,0,0,0.28)",
    position: "relative",
  });

  const bottomTab = (active) => ({
    minWidth: 0,
    height: 58,
    border: "none",
    background: active
      ? "linear-gradient(180deg, rgba(0,255,184,0.14), rgba(255,255,255,0.02))"
      : "transparent",
    color: active ? "#ffffff" : "rgba(255,255,255,0.72)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    cursor: "pointer",
    position: "relative",
    borderRadius: 18,
    WebkitTapHighlightColor: "transparent",
    boxShadow: active ? "0 0 20px rgba(0,255,184,0.10)" : "none",
    padding: 0,
  });

  return (
    <>
      <header
        style={{
          width: "100%",
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 999,
          background: isMobile
            ? "rgba(3,14,10,0.78)"
            : "linear-gradient(90deg, rgba(4,20,12,0.95), rgba(3,18,16,0.96))",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          boxShadow: isMobile
            ? "0 10px 30px rgba(0,0,0,0.28)"
            : "0 12px 30px rgba(0,0,0,0.7)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
              "radial-gradient(700px 80px at 20% 0%, rgba(0,255,184,0.16), transparent 70%)," +
              "radial-gradient(600px 90px at 78% 0%, rgba(88,170,255,0.12), transparent 70%)",
            opacity: 0.95,
          }}
        />

        <nav
          style={{
            width: "100%",
            maxWidth: 1440,
            margin: "0 auto",
            padding: isMobile ? "10px 14px 12px" : "10px 18px",
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 14,
            position: "relative",
            zIndex: 5,
          }}
        >
          <div
            onClick={() => {
              closeAllMenus();
              navigate("/");
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              cursor: "pointer",
              minWidth: 0,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: isMobile ? 40 : 46,
                height: isMobile ? 40 : 46,
                borderRadius: isMobile ? 14 : 16,
                background:
                  "radial-gradient(circle at 30% 20%, #00ffb8 0, #009a61 45%, #013222 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow:
                  "0 0 18px rgba(0,255,180,0.50), 0 14px 28px rgba(0,0,0,0.24)",
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: isMobile ? 21 : 24 }}>🏔️</span>
            </div>

            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: isMobile ? 16 : 20,
                  fontWeight: 1000,
                  letterSpacing: isMobile ? "0.08em" : "0.12em",
                  textTransform: "uppercase",
                  color: "#ffffff",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  lineHeight: 1,
                }}
              >
                MEET{" "}
                <span
                  style={{
                    color: "#00ffb8",
                    textShadow: "0 0 14px rgba(0,255,184,0.65)",
                  }}
                >
                  OUTDOORS
                </span>
              </div>

              {!isMobile && (
                <div
                  style={{
                    fontSize: 11,
                    color: "rgba(255,255,255,0.60)",
                    marginTop: 4,
                    letterSpacing: "0.06em",
                  }}
                >
                  EXPLORE • CONNECT • ADVENTURE
                </div>
              )}
            </div>
          </div>

          {!isMobile && (
            <div
              ref={searchWrapRef}
              style={{
                position: "relative",
                flex: 1,
                maxWidth: 520,
                margin: "0 10px",
              }}
            >
              <div
                onClick={() => {
                  setSearchOpen(true);
                  setNotificationsOpen(false);
                  setUserMenuOpen(false);
                  setActivitiesOpen(false);
                  setToursMenuOpen(false);
                  setEventsMenuOpen(false);
                  setCreateMenuOpen(false);
                }}
                style={{
                  height: 50,
                  borderRadius: 999,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "0 16px",
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))",
                  border: "1px solid rgba(255,255,255,0.10)",
                  boxShadow:
                    "0 14px 34px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.04)",
                  backdropFilter: "blur(18px)",
                  cursor: "text",
                }}
              >
                <span style={{ fontSize: 16, opacity: 0.82 }}>🔎</span>
                <span
                  style={{
                    fontSize: 14,
                    color: "rgba(255,255,255,0.66)",
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  Search tours, events, people...
                </span>
              </div>

              {searchOpen && (
                <div
                  style={{
                    ...dropdownBase,
                    top: 58,
                    left: 0,
                    right: 0,
                    width: "100%",
                    maxWidth: "100%",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 12,
                      gap: 10,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 14,
                          background:
                            "linear-gradient(135deg, rgba(0,255,184,0.22), rgba(88,170,255,0.16))",
                          border: "1px solid rgba(255,255,255,0.10)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        🧭
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: 12,
                            opacity: 0.75,
                            color: "rgba(255,255,255,0.82)",
                            letterSpacing: "0.16em",
                            textTransform: "uppercase",
                          }}
                        >
                          Search
                        </div>
                        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.92)" }}>
                          Profiles, names, home base
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setSearchOpen(false)}
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 12,
                        border: "1px solid rgba(255,255,255,0.14)",
                        background: "rgba(0,0,0,0.35)",
                        color: "rgba(255,255,255,0.9)",
                        cursor: "pointer",
                        fontSize: 16,
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
                      placeholder="Type name / home base..."
                      style={{
                        width: "100%",
                        padding: "13px 14px 13px 44px",
                        borderRadius: 999,
                        border: "1px solid rgba(0,255,184,0.26)",
                        background:
                          "linear-gradient(180deg, rgba(0,0,0,0.55), rgba(0,0,0,0.35))",
                        color: "white",
                        outline: "none",
                        boxShadow:
                          "0 0 0 1px rgba(0,255,184,0.08), 0 14px 34px rgba(0,0,0,0.6)",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        left: 15,
                        top: "50%",
                        transform: "translateY(-50%)",
                        opacity: 0.75,
                        fontSize: 16,
                      }}
                    >
                      🔎
                    </div>
                  </div>

                  <div style={{ marginTop: 12, maxHeight: 360, overflowY: "auto" }}>
                    {searchLoading && (
                      <div style={{ padding: 10, color: "rgba(255,255,255,0.75)" }}>
                        Searching...
                      </div>
                    )}

                    {!searchLoading &&
                      searchQuery.trim().length > 0 &&
                      searchResults.length === 0 && (
                        <div style={{ padding: 10, color: "rgba(255,255,255,0.6)" }}>
                          No profiles found.
                        </div>
                      )}

                    {!searchLoading &&
                      searchResults.map((p, idx) => {
                        const name = bestDisplayName(p);
                        const meta = p.home_base ? p.home_base : "";
                        const isMutualFriend = friendsSet?.has?.(p.id);

                        return (
                          <div
                            key={p.id}
                            onMouseEnter={() => setSearchCursor(idx)}
                            onClick={() => {
                              setSearchOpen(false);
                              navigate(`/profile/${p.id}`);
                            }}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                              padding: 10,
                              borderRadius: 16,
                              cursor: "pointer",
                              background:
                                idx === searchCursor
                                  ? "linear-gradient(135deg, rgba(0,255,184,0.18), rgba(88,170,255,0.12))"
                                  : "rgba(255,255,255,0.04)",
                              border:
                                idx === searchCursor
                                  ? "1px solid rgba(0,255,184,0.22)"
                                  : "1px solid rgba(255,255,255,0.06)",
                              marginBottom: 8,
                            }}
                          >
                            <div
                              style={{
                                width: 46,
                                height: 46,
                                borderRadius: 18,
                                padding: 2,
                                background:
                                  "conic-gradient(from 210deg, rgba(0,255,184,0.95), rgba(88,170,255,0.85), rgba(124,77,255,0.85), rgba(0,255,184,0.95))",
                                flexShrink: 0,
                              }}
                            >
                              <img
                                src={p.avatar_url || "https://i.pravatar.cc/80"}
                                alt=""
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  borderRadius: 16,
                                  objectFit: "cover",
                                  border: "1px solid rgba(0,0,0,0.55)",
                                }}
                              />
                            </div>

                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  gap: 10,
                                }}
                              >
                                <div style={{ minWidth: 0 }}>
                                  <div
                                    style={{
                                      color: "white",
                                      fontWeight: 900,
                                      whiteSpace: "nowrap",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                    }}
                                  >
                                    {name}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: 12,
                                      opacity: 0.75,
                                      whiteSpace: "nowrap",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                    }}
                                  >
                                    {meta || "Explorer"}
                                  </div>
                                </div>
                                {isMutualFriend && <FriendBadge />}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 10, flexShrink: 0 }}>
            {isMobile ? (
              <>
                <div ref={searchWrapRef} style={{ position: "relative" }}>
                  <button
                    onClick={() => setSearchOpen((p) => !p)}
                    title="Search"
                    style={mobileTopIcon(searchOpen)}
                  >
                    🔎
                  </button>

                  {searchOpen && (
                    <div
                      style={{
                        ...dropdownBase,
                        position: "fixed",
                        top: 72,
                        left: 10,
                        right: 10,
                        width: "auto",
                        maxWidth: "none",
                        padding: 14,
                        zIndex: 4000,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: 12,
                          gap: 10,
                        }}
                      >
                        <div style={{ fontWeight: 900, fontSize: 15, color: "#fff" }}>
                          Search
                        </div>
                        <button
                          onClick={() => setSearchOpen(false)}
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 12,
                            border: "1px solid rgba(255,255,255,0.14)",
                            background: "rgba(0,0,0,0.35)",
                            color: "rgba(255,255,255,0.9)",
                            cursor: "pointer",
                            fontSize: 16,
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
                          placeholder="Search people..."
                          style={{
                            width: "100%",
                            padding: "13px 14px 13px 44px",
                            borderRadius: 999,
                            border: "1px solid rgba(0,255,184,0.26)",
                            background:
                              "linear-gradient(180deg, rgba(0,0,0,0.55), rgba(0,0,0,0.35))",
                            color: "white",
                            outline: "none",
                            boxShadow:
                              "0 0 0 1px rgba(0,255,184,0.08), 0 14px 34px rgba(0,0,0,0.6)",
                          }}
                        />
                        <div
                          style={{
                            position: "absolute",
                            left: 15,
                            top: "50%",
                            transform: "translateY(-50%)",
                            opacity: 0.75,
                            fontSize: 16,
                          }}
                        >
                          🔎
                        </div>
                      </div>

                      <div style={{ marginTop: 12, maxHeight: 320, overflowY: "auto" }}>
                        {searchLoading && (
                          <div style={{ padding: 10, color: "rgba(255,255,255,0.75)" }}>
                            Searching...
                          </div>
                        )}

                        {!searchLoading &&
                          searchQuery.trim().length > 0 &&
                          searchResults.length === 0 && (
                            <div style={{ padding: 10, color: "rgba(255,255,255,0.6)" }}>
                              No profiles found.
                            </div>
                          )}

                        {!searchLoading &&
                          searchResults.map((p, idx) => {
                            const name = bestDisplayName(p);
                            const meta = p.home_base ? p.home_base : "";
                            const isMutualFriend = friendsSet?.has?.(p.id);

                            return (
                              <div
                                key={p.id}
                                onMouseEnter={() => setSearchCursor(idx)}
                                onTouchStart={() => setSearchCursor(idx)}
                                onClick={() => {
                                  setSearchOpen(false);
                                  navigate(`/profile/${p.id}`);
                                }}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 12,
                                  padding: 10,
                                  borderRadius: 16,
                                  cursor: "pointer",
                                  background:
                                    idx === searchCursor
                                      ? "linear-gradient(135deg, rgba(0,255,184,0.18), rgba(88,170,255,0.12))"
                                      : "rgba(255,255,255,0.04)",
                                  border:
                                    idx === searchCursor
                                      ? "1px solid rgba(0,255,184,0.22)"
                                      : "1px solid rgba(255,255,255,0.06)",
                                  marginBottom: 8,
                                }}
                              >
                                <div
                                  style={{
                                    width: 46,
                                    height: 46,
                                    borderRadius: 18,
                                    padding: 2,
                                    background:
                                      "conic-gradient(from 210deg, rgba(0,255,184,0.95), rgba(88,170,255,0.85), rgba(124,77,255,0.85), rgba(0,255,184,0.95))",
                                    flexShrink: 0,
                                  }}
                                >
                                  <img
                                    src={p.avatar_url || "https://i.pravatar.cc/80"}
                                    alt=""
                                    style={{
                                      width: "100%",
                                      height: "100%",
                                      borderRadius: 16,
                                      objectFit: "cover",
                                      border: "1px solid rgba(0,0,0,0.55)",
                                    }}
                                  />
                                </div>

                                <div style={{ minWidth: 0, flex: 1 }}>
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "space-between",
                                      gap: 10,
                                    }}
                                  >
                                    <div style={{ minWidth: 0 }}>
                                      <div
                                        style={{
                                          color: "white",
                                          fontWeight: 900,
                                          whiteSpace: "nowrap",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                        }}
                                      >
                                        {name}
                                      </div>
                                      <div
                                        style={{
                                          fontSize: 12,
                                          opacity: 0.75,
                                          whiteSpace: "nowrap",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                        }}
                                      >
                                        {meta || "Explorer"}
                                      </div>
                                    </div>
                                    {isMutualFriend && <FriendBadge />}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>

                {user && (
                  <div ref={notificationsWrapRef} style={{ position: "relative" }}>
                    <button
                      onClick={() => {
                        const newState = !notificationsOpen;
                        setNotificationsOpen(newState);
                        setUserMenuOpen(false);
                        setSearchOpen(false);
                        if (newState) markAllAsRead();
                      }}
                      style={mobileTopIcon(notificationsOpen)}
                      title="Notifications"
                    >
                      🔔
                      {unreadCount > 0 && (
                        <span
                          style={{
                            position: "absolute",
                            top: -4,
                            right: -3,
                            background: "linear-gradient(135deg, #ff3b5f, #ff6b6b)",
                            color: "white",
                            minWidth: 18,
                            height: 18,
                            padding: "0 5px",
                            borderRadius: "50%",
                            fontSize: 10,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 900,
                            boxShadow: "0 0 12px rgba(255,0,80,0.65)",
                          }}
                        >
                          {unreadCount}
                        </span>
                      )}
                    </button>

                    {notificationsOpen && (
                      <div
                        style={{
                          ...dropdownBase,
                          position: "fixed",
                          top: 72,
                          left: 10,
                          right: 10,
                          width: "auto",
                          maxWidth: "none",
                          padding: 14,
                          zIndex: 4000,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            color: "white",
                            marginBottom: 12,
                            gap: 10,
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 900, fontSize: 15 }}>
                              Notifications
                            </div>
                            <div
                              style={{
                                fontSize: 11,
                                color: "rgba(255,255,255,0.6)",
                                marginTop: 2,
                              }}
                            >
                              Alerts, approvals, messages
                            </div>
                          </div>

                          {notifications.length > 0 && (
                            <button
                              onClick={clearNotifications}
                              style={{
                                background: "transparent",
                                border: "none",
                                fontSize: 12,
                                color: "#ff9a9a",
                                cursor: "pointer",
                                fontWeight: 800,
                              }}
                            >
                              Clear all
                            </button>
                          )}
                        </div>

                        {notifications.length === 0 ? (
                          <div
                            style={{
                              padding: "18px 14px",
                              borderRadius: 16,
                              background: "rgba(255,255,255,0.03)",
                              border: "1px solid rgba(255,255,255,0.06)",
                              color: "rgba(255,255,255,0.68)",
                              fontSize: 13,
                              textAlign: "center",
                            }}
                          >
                            You're all caught up 🌿
                          </div>
                        ) : (
                          <div style={{ maxHeight: 360, overflowY: "auto" }}>
                            {notifications.map((n) => (
                              <div
                                key={n.id}
                                onClick={() => openNotification(n)}
                                style={{
                                  background:
                                    "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.03))",
                                  padding: "12px 12px",
                                  borderRadius: 16,
                                  marginBottom: 10,
                                  color: "white",
                                  fontSize: 13,
                                  border: "1px solid rgba(255,255,255,0.07)",
                                  cursor: n.link ? "pointer" : "default",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: 10,
                                  }}
                                >
                                  <div
                                    style={{
                                      width: 34,
                                      height: 34,
                                      minWidth: 34,
                                      borderRadius: 12,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      background: "rgba(0,255,170,0.10)",
                                      border: "1px solid rgba(0,255,170,0.18)",
                                      fontSize: 16,
                                    }}
                                  >
                                    {notificationIcon(n.type)}
                                  </div>

                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div
                                      style={{
                                        fontWeight: 800,
                                        fontSize: 13,
                                        lineHeight: 1.3,
                                        marginBottom: 4,
                                        color: "white",
                                      }}
                                    >
                                      {n.title || "Notification"}
                                    </div>

                                    <div
                                      style={{
                                        opacity: 0.82,
                                        fontSize: 12,
                                        lineHeight: 1.45,
                                        color: "rgba(255,255,255,0.82)",
                                        wordBreak: "break-word",
                                      }}
                                    >
                                      {n.body || n.message || "No details available."}
                                    </div>

                                    <div
                                      style={{
                                        opacity: 0.55,
                                        fontSize: 11,
                                        marginTop: 8,
                                      }}
                                    >
                                      {new Date(n.created_at).toLocaleString()}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div ref={userWrapRef} style={{ position: "relative" }}>
                  <button
                    onClick={() => {
                      setUserMenuOpen((p) => !p);
                      setNotificationsOpen(false);
                      setSearchOpen(false);
                    }}
                    style={mobileTopIcon(userMenuOpen)}
                    title="Menu"
                  >
                    ☰
                  </button>

                  {userMenuOpen && (
                    <div
                      style={{
                        ...dropdownBase,
                        position: "fixed",
                        top: 72,
                        right: 10,
                        left: 10,
                        width: "auto",
                        maxWidth: "none",
                        padding: 12,
                        zIndex: 4000,
                      }}
                    >
                      {user ? (
                        <>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                              padding: "6px 8px 12px",
                              borderBottom: "1px solid rgba(255,255,255,0.07)",
                              marginBottom: 10,
                            }}
                          >
                            <div
                              style={{
                                width: 44,
                                height: 44,
                                borderRadius: 999,
                                overflow: "hidden",
                                border: "2px solid rgba(0,255,176,0.9)",
                                boxShadow: "0 0 14px rgba(0,255,160,0.30)",
                                flexShrink: 0,
                              }}
                            >
                              <img
                                src={avatarUrl || "https://i.pravatar.cc/300"}
                                alt="avatar"
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              />
                            </div>

                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div
                                style={{
                                  fontSize: 12,
                                  color: "rgba(255,255,255,0.84)",
                                  fontWeight: 800,
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {user.email}
                              </div>
                              <div
                                style={{
                                  fontSize: 11,
                                  color: "rgba(255,255,255,0.55)",
                                  marginTop: 2,
                                }}
                              >
                                Signed in
                              </div>
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
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              navigate("/login");
                              setUserMenuOpen(false);
                            }}
                            style={userMenuItem}
                          >
                            Login
                          </button>

                          <button
                            onClick={() => {
                              navigate("/register");
                              setUserMenuOpen(false);
                            }}
                            style={{
                              ...userMenuItem,
                              background: "linear-gradient(120deg, #00ffb8, #35ffc9, #00c28a)",
                              color: "#012216",
                              border: "none",
                              fontWeight: 900,
                              marginBottom: 0,
                            }}
                          >
                            Join now
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <Link to="/" style={linkStyle("/")}>
                    Home
                  </Link>

                  <div
                    ref={activitiesWrapRef}
                    style={{ position: "relative", display: "flex", alignItems: "center", gap: 4 }}
                    onMouseEnter={() => {
                      setActivitiesOpen(true);
                      setToursMenuOpen(false);
                      setEventsMenuOpen(false);
                    }}
                    onMouseLeave={() => setActivitiesOpen(false)}
                  >
                    <Link to="/activities" style={linkStyle("/activities")}>
                      Activities
                    </Link>
                    <button
                      onClick={() => {
                        setActivitiesOpen((p) => !p);
                        setToursMenuOpen(false);
                        setEventsMenuOpen(false);
                        setSearchOpen(false);
                        setNotificationsOpen(false);
                        setUserMenuOpen(false);
                        setCreateMenuOpen(false);
                      }}
                      style={{
                        background: "transparent",
                        color: "white",
                        border: "none",
                        cursor: "pointer",
                        fontSize: 16,
                        padding: 0,
                      }}
                    >
                      ▾
                    </button>

                    {activitiesOpen && (
                      <div
                        style={{
                          position: "absolute",
                          top: 48,
                          left: 0,
                          minWidth: 360,
                          borderRadius: 20,
                          padding: 14,
                          background:
                            "radial-gradient(circle at top, rgba(4,40,24,0.98), rgba(2,16,10,0.98))",
                          boxShadow:
                            "0 18px 40px rgba(0,0,0,0.8), 0 0 0 1px rgba(0,255,176,0.15)",
                          zIndex: 1200,
                          backdropFilter: "blur(18px)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 12,
                            color: "rgba(255,255,255,0.6)",
                            marginBottom: 10,
                            textTransform: "uppercase",
                            letterSpacing: "0.12em",
                          }}
                        >
                          Popular activities
                        </div>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(2, 1fr)",
                            gap: 8,
                          }}
                        >
                          {activityItems.map((item) => (
                            <button
                              key={item}
                              onClick={() => goToActivity(item)}
                              style={{
                                borderRadius: 999,
                                padding: "9px 10px",
                                background:
                                  "linear-gradient(120deg, rgba(0,0,0,0.6), rgba(0,60,40,0.9))",
                                color: "white",
                                border: "1px solid rgba(0,255,176,0.22)",
                                cursor: "pointer",
                                fontSize: 13,
                                textAlign: "left",
                                fontWeight: 700,
                              }}
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div
                    ref={toursWrapRef}
                    style={{ position: "relative", display: "flex", alignItems: "center", gap: 4 }}
                    onMouseEnter={() => {
                      setToursMenuOpen(true);
                      setActivitiesOpen(false);
                      setEventsMenuOpen(false);
                    }}
                    onMouseLeave={() => setToursMenuOpen(false)}
                  >
                    <Link to="/tours" style={linkStyle("/tours")}>
                      Tours
                    </Link>
                    <button
                      onClick={() => {
                        setToursMenuOpen((p) => !p);
                        setActivitiesOpen(false);
                        setEventsMenuOpen(false);
                        setSearchOpen(false);
                        setNotificationsOpen(false);
                        setUserMenuOpen(false);
                        setCreateMenuOpen(false);
                      }}
                      style={{
                        background: "transparent",
                        color: "white",
                        border: "none",
                        cursor: "pointer",
                        fontSize: 16,
                        padding: 0,
                      }}
                    >
                      ▾
                    </button>

                    {toursMenuOpen && (
                      <div
                        style={{
                          position: "absolute",
                          top: 48,
                          left: 0,
                          padding: 12,
                          borderRadius: 20,
                          background:
                            "radial-gradient(circle at top, rgba(1,25,18,0.98), rgba(0,10,8,0.98))",
                          boxShadow:
                            "0 18px 45px rgba(0,0,0,0.9), 0 0 0 1px rgba(0,255,176,0.2)",
                          minWidth: 250,
                          zIndex: 1200,
                          backdropFilter: "blur(20px)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 11,
                            color: "rgba(255,255,255,0.6)",
                            textTransform: "uppercase",
                            letterSpacing: "0.16em",
                            marginBottom: 8,
                          }}
                        >
                          Tours
                        </div>

                        <button
                          onClick={() => {
                            navigate("/tours");
                            setToursMenuOpen(false);
                          }}
                          style={{
                            width: "100%",
                            borderRadius: 999,
                            padding: "10px 12px",
                            border: "1px solid rgba(0,255,176,0.16)",
                            background:
                              "linear-gradient(120deg, rgba(0,0,0,0.7), rgba(0,50,40,0.9))",
                            color: "rgba(235,255,248,0.96)",
                            fontSize: 13,
                            cursor: "pointer",
                            marginBottom: 8,
                            textAlign: "left",
                            fontWeight: 700,
                          }}
                        >
                          All tours
                        </button>

                        <button
                          onClick={() => {
                            navigate("/create-tour");
                            setToursMenuOpen(false);
                          }}
                          style={{
                            width: "100%",
                            borderRadius: 999,
                            padding: "11px 12px",
                            border: "none",
                            background:
                              "linear-gradient(120deg, #00ffb8, #35ffc9, #00c28a)",
                            color: "#012216",
                            fontSize: 13,
                            fontWeight: 900,
                            cursor: "pointer",
                            boxShadow:
                              "0 0 18px rgba(0,255,176,0.55), 0 12px 26px rgba(0,0,0,0.9)",
                            textAlign: "center",
                            marginBottom: 10,
                          }}
                        >
                          + Create tour
                        </button>

                        <div
                          onClick={() => {
                            navigate("/saved-tours");
                            setToursMenuOpen(false);
                          }}
                          style={{
                            padding: "10px 12px",
                            cursor: "pointer",
                            color: "#a2ffd4",
                            fontSize: 14,
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            borderRadius: 14,
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.06)",
                            fontWeight: 700,
                          }}
                        >
                          ❤️ Saved tours
                        </div>
                      </div>
                    )}
                  </div>

                  <div
                    ref={eventsWrapRef}
                    style={{ position: "relative", display: "flex", alignItems: "center", gap: 4 }}
                    onMouseEnter={() => {
                      setEventsMenuOpen(true);
                      setToursMenuOpen(false);
                      setActivitiesOpen(false);
                    }}
                    onMouseLeave={() => setEventsMenuOpen(false)}
                  >
                    <Link to="/events" style={linkStyle("/events")}>
                      Events
                    </Link>
                    <button
                      onClick={() => {
                        setEventsMenuOpen((p) => !p);
                        setToursMenuOpen(false);
                        setActivitiesOpen(false);
                        setSearchOpen(false);
                        setNotificationsOpen(false);
                        setUserMenuOpen(false);
                        setCreateMenuOpen(false);
                      }}
                      style={{
                        background: "transparent",
                        color: "white",
                        border: "none",
                        cursor: "pointer",
                        fontSize: 16,
                        padding: 0,
                      }}
                    >
                      ▾
                    </button>

                    {eventsMenuOpen && (
                      <div
                        style={{
                          position: "absolute",
                          top: 48,
                          left: 0,
                          padding: 12,
                          borderRadius: 20,
                          background:
                            "radial-gradient(circle at top, rgba(12,22,40,0.98), rgba(2,6,15,0.98))",
                          boxShadow:
                            "0 18px 45px rgba(0,0,0,0.9), 0 0 0 1px rgba(88,170,255,0.2)",
                          minWidth: 250,
                          zIndex: 1200,
                          backdropFilter: "blur(20px)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 11,
                            color: "rgba(255,255,255,0.6)",
                            textTransform: "uppercase",
                            letterSpacing: "0.16em",
                            marginBottom: 8,
                          }}
                        >
                          Events
                        </div>

                        <button
                          onClick={() => {
                            navigate("/events");
                            setEventsMenuOpen(false);
                          }}
                          style={{
                            width: "100%",
                            borderRadius: 999,
                            padding: "10px 12px",
                            border: "1px solid rgba(120,180,255,0.25)",
                            background:
                              "linear-gradient(120deg, rgba(0,0,0,0.7), rgba(5,25,55,0.9))",
                            color: "rgba(235,245,255,0.96)",
                            fontSize: 13,
                            cursor: "pointer",
                            marginBottom: 8,
                            textAlign: "left",
                            fontWeight: 700,
                          }}
                        >
                          All events
                        </button>

                        <button
                          onClick={() => {
                            navigate("/create-event");
                            setEventsMenuOpen(false);
                          }}
                          style={{
                            width: "100%",
                            borderRadius: 999,
                            padding: "11px 12px",
                            border: "none",
                            background:
                              "linear-gradient(120deg, #5bb3ff, #9ad0ff, #4f8cff)",
                            color: "#021326",
                            fontSize: 13,
                            fontWeight: 900,
                            cursor: "pointer",
                            boxShadow:
                              "0 0 18px rgba(120,190,255,0.55), 0 12px 26px rgba(0,0,0,0.9)",
                            textAlign: "center",
                          }}
                        >
                          + Create event
                        </button>
                      </div>
                    )}
                  </div>

                  <Link to="/timeline" style={linkStyle("/timeline")}>
                    Timeline
                  </Link>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {user && (
                    <div ref={notificationsWrapRef} style={{ position: "relative" }}>
                      <button
                        onClick={() => {
                          const newState = !notificationsOpen;
                          setNotificationsOpen(newState);
                          setUserMenuOpen(false);
                          setSearchOpen(false);
                          if (newState) markAllAsRead();
                        }}
                        style={{
                          ...iconBtn,
                          background: "rgba(0,0,0,0.35)",
                          border: "1px solid rgba(255,255,255,0.16)",
                        }}
                        title="Notifications"
                      >
                        🔔
                        {unreadCount > 0 && (
                          <span
                            style={{
                              position: "absolute",
                              top: -5,
                              right: -4,
                              background: "linear-gradient(135deg, #ff3b5f, #ff6b6b)",
                              color: "white",
                              minWidth: 19,
                              height: 19,
                              padding: "0 5px",
                              borderRadius: "50%",
                              fontSize: 11,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              boxShadow: "0 0 12px rgba(255,0,80,0.65)",
                              fontWeight: 900,
                            }}
                          >
                            {unreadCount}
                          </span>
                        )}
                      </button>

                      {notificationsOpen && (
                        <div
                          style={{
                            ...dropdownBase,
                            right: 0,
                            width: 360,
                            maxWidth: "92vw",
                            padding: 14,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              color: "white",
                              marginBottom: 12,
                              gap: 10,
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 900, fontSize: 15 }}>
                                Notifications
                              </div>
                              <div
                                style={{
                                  fontSize: 11,
                                  color: "rgba(255,255,255,0.6)",
                                  marginTop: 2,
                                }}
                              >
                                Updates from your profile, tours and creator actions
                              </div>
                            </div>

                            {notifications.length > 0 && (
                              <button
                                onClick={clearNotifications}
                                style={{
                                  background: "transparent",
                                  border: "none",
                                  fontSize: 12,
                                  color: "#ff9a9a",
                                  cursor: "pointer",
                                  fontWeight: 800,
                                }}
                              >
                                Clear all
                              </button>
                            )}
                          </div>

                          {notifications.length === 0 ? (
                            <div
                              style={{
                                padding: "18px 14px",
                                borderRadius: 16,
                                background: "rgba(255,255,255,0.03)",
                                border: "1px solid rgba(255,255,255,0.06)",
                                color: "rgba(255,255,255,0.68)",
                                fontSize: 13,
                                textAlign: "center",
                              }}
                            >
                              You're all caught up 🌿
                            </div>
                          ) : (
                            <div style={{ maxHeight: 380, overflowY: "auto" }}>
                              {notifications.map((n) => (
                                <div
                                  key={n.id}
                                  onClick={() => openNotification(n)}
                                  style={{
                                    background:
                                      "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.03))",
                                    padding: "12px 12px",
                                    borderRadius: 16,
                                    marginBottom: 10,
                                    color: "white",
                                    fontSize: 13,
                                    border: "1px solid rgba(255,255,255,0.07)",
                                    cursor: n.link ? "pointer" : "default",
                                    boxShadow: "0 8px 24px rgba(0,0,0,0.22)",
                                  }}
                                >
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "flex-start",
                                      gap: 10,
                                    }}
                                  >
                                    <div
                                      style={{
                                        width: 34,
                                        height: 34,
                                        minWidth: 34,
                                        borderRadius: 12,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        background: "rgba(0,255,170,0.10)",
                                        border: "1px solid rgba(0,255,170,0.18)",
                                        fontSize: 16,
                                      }}
                                    >
                                      {notificationIcon(n.type)}
                                    </div>

                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div
                                        style={{
                                          fontWeight: 800,
                                          fontSize: 13,
                                          lineHeight: 1.3,
                                          marginBottom: 4,
                                          color: "white",
                                        }}
                                      >
                                        {n.title || "Notification"}
                                      </div>

                                      <div
                                        style={{
                                          opacity: 0.82,
                                          fontSize: 12,
                                          lineHeight: 1.45,
                                          color: "rgba(255,255,255,0.82)",
                                          wordBreak: "break-word",
                                        }}
                                      >
                                        {n.body || n.message || "No details available."}
                                      </div>

                                      <div
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "space-between",
                                          gap: 10,
                                          marginTop: 8,
                                          flexWrap: "wrap",
                                        }}
                                      >
                                        <div
                                          style={{
                                            opacity: 0.55,
                                            fontSize: 11,
                                          }}
                                        >
                                          {new Date(n.created_at).toLocaleString()}
                                        </div>

                                        {(n.read || n.is_read) && (
                                          <div
                                            style={{
                                              fontSize: 10,
                                              fontWeight: 700,
                                              padding: "4px 8px",
                                              borderRadius: 999,
                                              background: "rgba(255,255,255,0.06)",
                                              border: "1px solid rgba(255,255,255,0.10)",
                                              color: "rgba(255,255,255,0.72)",
                                              letterSpacing: "0.04em",
                                              textTransform: "uppercase",
                                            }}
                                          >
                                            Read
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div ref={userWrapRef} style={{ position: "relative" }}>
                    <button
                      onClick={() => {
                        setUserMenuOpen((p) => !p);
                        setNotificationsOpen(false);
                        setSearchOpen(false);
                      }}
                      style={iconBtn}
                      title="Menu"
                    >
                      ☰
                    </button>

                    {userMenuOpen && (
                      <div
                        style={{
                          ...dropdownBase,
                          right: 0,
                          width: 260,
                          maxWidth: "92vw",
                          padding: 12,
                        }}
                      >
                        {user ? (
                          <>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                padding: "6px 8px 12px",
                                borderBottom: "1px solid rgba(255,255,255,0.07)",
                                marginBottom: 10,
                              }}
                            >
                              <div
                                style={{
                                  width: 44,
                                  height: 44,
                                  borderRadius: 999,
                                  overflow: "hidden",
                                  border: "2px solid rgba(0,255,176,0.9)",
                                  boxShadow: "0 0 14px rgba(0,255,160,0.30)",
                                  flexShrink: 0,
                                }}
                              >
                                <img
                                  src={avatarUrl || "https://i.pravatar.cc/300"}
                                  alt="avatar"
                                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                              </div>

                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div
                                  style={{
                                    fontSize: 12,
                                    color: "rgba(255,255,255,0.84)",
                                    fontWeight: 800,
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                >
                                  {user.email}
                                </div>
                                <div
                                  style={{
                                    fontSize: 11,
                                    color: "rgba(255,255,255,0.55)",
                                    marginTop: 2,
                                  }}
                                >
                                  Signed in
                                </div>
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
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                navigate("/login");
                                setUserMenuOpen(false);
                              }}
                              style={userMenuItem}
                            >
                              Login
                            </button>

                            <button
                              onClick={() => {
                                navigate("/register");
                                setUserMenuOpen(false);
                              }}
                              style={{
                                ...userMenuItem,
                                background: "linear-gradient(120deg, #00ffb8, #35ffc9, #00c28a)",
                                color: "#012216",
                                border: "none",
                                fontWeight: 900,
                                marginBottom: 0,
                              }}
                            >
                              Join now
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </nav>
      </header>

      <div style={{ height: isMobile ? 72 : 78 }} />

      {isMobile && (
        <>
          <div
            style={{
              position: "fixed",
              left: 10,
              right: 10,
              bottom: "calc(10px + env(safe-area-inset-bottom))",
              zIndex: 3500,
              borderRadius: 28,
              padding: "10px 8px 8px",
              background:
                "linear-gradient(180deg, rgba(4,18,14,0.94), rgba(2,10,8,0.98))",
              border: "1px solid rgba(255,255,255,0.09)",
              backdropFilter: "blur(22px)",
              boxShadow:
                "0 24px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(0,255,184,0.05)",
              overflow: "visible",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 28,
                pointerEvents: "none",
                background:
                  "radial-gradient(240px 60px at 18% 0%, rgba(0,255,184,0.10), transparent 60%)," +
                  "radial-gradient(240px 60px at 82% 0%, rgba(88,170,255,0.08), transparent 60%)",
              }}
            />

            {createMenuOpen && (
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  bottom: 82,
                  transform: "translateX(-50%)",
                  display: "grid",
                  gap: 10,
                  zIndex: 3,
                  width: 180,
                }}
              >
                <button
                  onClick={() => {
                    setCreateMenuOpen(false);
                    user ? navigate("/create-event") : navigate("/login");
                  }}
                  style={{
                    height: 48,
                    borderRadius: 18,
                    border: "1px solid rgba(120,190,255,0.22)",
                    background:
                      "linear-gradient(135deg, rgba(91,179,255,0.92), rgba(79,140,255,0.92))",
                    color: "#041423",
                    fontWeight: 1000,
                    fontSize: 13,
                    boxShadow: "0 14px 34px rgba(0,0,0,0.30)",
                    cursor: "pointer",
                  }}
                >
                  🎟️ Create event
                </button>

                <button
                  onClick={() => {
                    setCreateMenuOpen(false);
                    user ? navigate("/create-tour") : navigate("/login");
                  }}
                  style={{
                    height: 48,
                    borderRadius: 18,
                    border: "1px solid rgba(0,255,184,0.22)",
                    background:
                      "linear-gradient(135deg, rgba(0,255,184,0.92), rgba(53,255,201,0.92))",
                    color: "#032116",
                    fontWeight: 1000,
                    fontSize: 13,
                    boxShadow: "0 14px 34px rgba(0,0,0,0.30)",
                    cursor: "pointer",
                  }}
                >
                  🧭 Create tour
                </button>
              </div>
            )}

            <div
              style={{
                position: "relative",
                display: "grid",
                gridTemplateColumns: "1fr 1fr auto 1fr 1fr 1fr",
                alignItems: "end",
                gap: 4,
              }}
            >
              <button
                onClick={() => {
                  setCreateMenuOpen(false);
                  navigate("/events");
                }}
                style={bottomTab(isMobileBottomActive("events"))}
              >
                <span style={{ fontSize: 19 }}>🎟️</span>
                <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.04em" }}>
                  EVENTS
                </span>
              </button>

              <button
                onClick={() => {
                  setCreateMenuOpen(false);
                  navigate("/tours");
                }}
                style={bottomTab(isMobileBottomActive("tours"))}
              >
                <span style={{ fontSize: 19 }}>🧭</span>
                <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.04em" }}>
                  TOURS
                </span>
              </button>

              <button
                onClick={() => setCreateMenuOpen((p) => !p)}
                style={{
                  width: 65,
                  height: 72,
                  marginBottom: 10,
                  borderRadius: 24,
                  border: "1px solid rgba(0,255,184,0.26)",
                  background:
                    "linear-gradient(135deg, rgba(0,255,184,0.24), rgba(88,170,255,0.18))",
                  boxShadow:
                    "0 18px 40px rgba(0,0,0,0.42), 0 0 26px rgba(0,255,184,0.18)",
                  color: "#fff",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 2,
                  cursor: "pointer",
                  transform: createMenuOpen ? "translateY(-4px) scale(1.03)" : "translateY(-8px)",
                  transition: "all .18s ease",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 6,
                    borderRadius: 20,
                    background:
                      "radial-gradient(circle at 30% 20%, rgba(0,255,184,0.16), transparent 60%)",
                    pointerEvents: "none",
                  }}
                />
                <span
                  style={{
                    fontSize: 28,
                    lineHeight: 1,
                    transform: createMenuOpen ? "rotate(45deg)" : "rotate(0deg)",
                    transition: "transform .18s ease",
                  }}
                >
                  ＋
                </span>
                <span style={{ fontSize: 10, fontWeight: 1000, letterSpacing: "0.06em" }}>
                  CREATE
                </span>
              </button>

              <button
                onClick={() => {
                  setCreateMenuOpen(false);
                  navigate("/activities");
                }}
                style={bottomTab(isMobileBottomActive("activities"))}
              >
                <span style={{ fontSize: 19 }}>⛰️</span>
                <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: "0.04em" }}>
                  ACTIVITIES
                </span>
              </button>

              <button
                onClick={() => {
                  setCreateMenuOpen(false);
                  navigate("/timeline");
                }}
                style={bottomTab(isMobileBottomActive("timeline"))}
              >
                <span style={{ fontSize: 19 }}>🕒</span>
                <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: "0.04em" }}>
                  TIMELINE
                </span>
              </button>

              <button
                onClick={() => {
                  setCreateMenuOpen(false);
                  user ? navigate(`/profile/${user.id}`) : navigate("/login");
                }}
                style={bottomTab(isMobileBottomActive("profile"))}
              >
                <span style={{ fontSize: 19 }}>👤</span>
                <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: "0.04em" }}>
                  PROFILE
                </span>
              </button>
            </div>
          </div>

          <div style={{ height: 104 }} />
        </>
      )}
    </>
  );
}
