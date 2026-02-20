// src/components/Navbar.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
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
      boxShadow: "0 10px 26px rgba(0,255,195,0.22), 0 0 16px rgba(0,255,195,0.38)",
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
    window.innerWidth < 900 || /iPhone|iPad|iPod/i.test(navigator.userAgent)
  );

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [activitiesOpen, setActivitiesOpen] = useState(false);
  const [toursMenuOpen, setToursMenuOpen] = useState(false);
  const [eventsMenuOpen, setEventsMenuOpen] = useState(false);

  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  /* ================= 🔍 SEARCH (IZBOR 2: full_name + home_base) ================= */
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

  const isActive = (path) => location.pathname === path;

  const linkStyle = (path) => ({
    color: isActive(path) ? "#00ffb0" : "rgba(255,255,255,0.78)",
    fontWeight: isActive(path) ? 800 : 600,
    fontSize: 15,
    textDecoration: "none",
    padding: "8px 14px",
    borderRadius: 999,
    background: isActive(path) ? "rgba(0,255,160,0.14)" : "transparent",
    boxShadow: isActive(path) ? "0 0 18px rgba(0,255,160,0.18)" : "none",
    transition: "all 0.18s ease",
    whiteSpace: "nowrap",
  });

  const neonRing = {
    boxShadow:
      "0 0 0 1px rgba(0,255,184,0.16), 0 18px 45px rgba(0,0,0,0.9), 0 0 40px rgba(0,255,184,0.12)",
  };

  const bestDisplayName = (p) => (p?.full_name || "Explorer").trim();

  const goToActivity = (name) => {
    setActivitiesOpen(false);
    setToursMenuOpen(false);
    setEventsMenuOpen(false);
    setMobileMenuOpen(false);
    navigate(`/tours?activity=${encodeURIComponent(name)}`);
  };

  const closeAllMenus = () => {
    setSearchOpen(false);
    setNotificationsOpen(false);
    setUserMenuOpen(false);
    setActivitiesOpen(false);
    setToursMenuOpen(false);
    setEventsMenuOpen(false);
  };

  /* ================= AUTH + AVATAR + NOTIFICATIONS ================= */
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

      // avatar
      const { data: profile } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", currentUser.id)
        .single();

      if (!mounted) return;

      if (profile?.avatar_url) {
        setAvatarUrl(profile.avatar_url + `?t=${Date.now()}`);
      } else {
        setAvatarUrl(null);
      }

      // notifications
      const { data: notes } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false });

      const safeNotes = notes || [];
      setNotifications(safeNotes);
      setUnreadCount(safeNotes.filter((n) => !n.read).length);
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

  /* ================= REALTIME NOTIFICATIONS ================= */
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
            if (!payload.new.read) setUnreadCount((prev) => prev + 1);
          }
        )
        .subscribe();

      cleanup = () => supabase.removeChannel(channel);
    }

    connectRealtime();

    return () => cleanup?.();
  }, []);

  /* ================= RESPONSIVE ================= */
  useEffect(() => {
    const onResize = () => {
      setIsMobile(
        window.innerWidth < 900 || /iPhone|iPad|iPod/i.test(navigator.userAgent)
      );
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  /* ================= LOGOUT ================= */
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setNotifications([]);
    setUnreadCount(0);
    closeAllMenus();
    setMobileMenuOpen(false);
    navigate("/login");
  };

  /* ================= NOTIFICATIONS HELPERS ================= */
  const markAllAsRead = async () => {
    if (!user || unreadCount === 0) return;

    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const clearNotifications = async () => {
    if (!user || notifications.length === 0) return;
    await supabase.from("notifications").delete().eq("user_id", user.id);
    setNotifications([]);
    setUnreadCount(0);
  };

  /* ================= FRIENDS SET (badge) ================= */
  const buildFriendsSet = async () => {
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
  };

  /* ================= SEARCH EFFECT (IZBOR 2) ================= */
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

      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, home_base")
        .or(`full_name.ilike.%${q}%,home_base.ilike.%${q}%`)
        .limit(10);

      // (ostavljam log za debug, ako ti smeta obrisi)
      // console.log("SEARCH DATA:", data);
      // console.log("SEARCH ERROR:", error);

      const rows = data || [];
      setSearchResults(rows);
      setSearchCursor(rows.length ? 0 : -1);
      setSearchLoading(false);
    }, 300);

    return () => clearTimeout(t);
  }, [searchQuery, searchOpen]);

  /* ================= SEARCH OPEN/CLOSE ================= */
  useEffect(() => {
    if (searchOpen) {
      setNotificationsOpen(false);
      setUserMenuOpen(false);
      setActivitiesOpen(false);
      setToursMenuOpen(false);
      setEventsMenuOpen(false);

      buildFriendsSet();
      setTimeout(() => searchInputRef.current?.focus?.(), 60);
    } else {
      setSearchQuery("");
      setSearchResults([]);
      setSearchCursor(-1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchOpen]);

  /* ================= OUTSIDE CLICK CLOSE (SVE) ================= */
  useEffect(() => {
    const onDown = (e) => {
      const t = e.target;

      if (mobileMenuOpen) return; // mobile overlay ima svoj close

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
  }, [mobileMenuOpen]);

  /* ================= SEARCH KEYBOARD ================= */
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

  /* ================= STYLES ================= */
  const iconBtn = {
    width: 40,
    height: 40,
    borderRadius: 14,
    background:
      "linear-gradient(135deg, rgba(0,255,184,0.16), rgba(88,170,255,0.10))",
    border: "1px solid rgba(0,255,184,0.22)",
    cursor: "pointer",
    fontSize: 18,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    boxShadow: "0 0 18px rgba(0,255,184,0.14), 0 10px 28px rgba(0,0,0,0.75)",
    transition: "transform .14s ease, filter .14s ease",
    WebkitTapHighlightColor: "transparent",
  };

  const dropdownBase = {
    position: "absolute",
    top: 46,
    borderRadius: 18,
    padding: 12,
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
    padding: "10px 10px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.10)",
    textAlign: "left",
    background: "rgba(255,255,255,0.03)",
    color: "rgba(255,255,255,0.92)",
    fontSize: 13,
    cursor: "pointer",
    marginBottom: 8,
  };

  const userMenuDanger = {
    ...userMenuItem,
    background: "rgba(255,80,80,0.12)",
    borderColor: "rgba(255,120,120,0.22)",
    color: "#ff9a9a",
    marginBottom: 0,
  };

  const mobileLink = {
    fontSize: 18,
    fontWeight: 850,
    color: "white",
    textDecoration: "none",
    padding: "14px 14px",
    borderRadius: 16,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
  };

  const mobileButton = {
    padding: "14px 14px",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "white",
    fontSize: 16,
    textAlign: "left",
    cursor: "pointer",
  };

  const mobileDanger = {
    ...mobileButton,
    borderColor: "rgba(255,100,100,0.35)",
    background: "rgba(255,80,80,0.12)",
    color: "#ff9a9a",
  };

  return (
    <>
      <header
        style={{
          width: "100%",
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 999,
          background:
            "linear-gradient(90deg, rgba(4,20,12,0.95), rgba(3,18,16,0.96))",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          boxShadow: "0 12px 30px rgba(0,0,0,0.7)",
        }}
      >
        {/* ambient glow */}
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
            maxWidth: 1400,
            margin: "0 auto",
            padding: "10px 18px",
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 14,
            position: "relative",
            zIndex: 5,
          }}
        >
          {/* BRAND */}
          <div
            onClick={() => {
              closeAllMenus();
              setMobileMenuOpen(false);
              navigate("/");
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              cursor: "pointer",
              minWidth: 0,
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
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: 24 }}>🏔️</span>
            </div>

            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 900,
                  letterSpacing: 1.1,
                  textTransform: "uppercase",
                  color: "#ffffff",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                MEET{" "}
                <span
                  style={{
                    color: "#00ffb8",
                    textShadow: "0 0 10px rgba(0,255,184,0.9)",
                  }}
                >
                  OUTDOORS
                </span>
              </div>
              {!isMobile && (
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)" }}>
                  Explore. Connect. Adventure together.
                </div>
              )}
            </div>
          </div>

          {/* DESKTOP LINKS */}
          {!isMobile && (
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <Link to="/" style={linkStyle("/")}>
                Home
              </Link>

              {/* ACTIVITIES */}
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
                      top: 44,
                      left: 0,
                      minWidth: 340,
                      borderRadius: 18,
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
                            padding: "8px 10px",
                            background:
                              "linear-gradient(120deg, rgba(0,0,0,0.6), rgba(0,60,40,0.9))",
                            color: "white",
                            border: "1px solid rgba(0,255,176,0.22)",
                            cursor: "pointer",
                            fontSize: 13,
                            textAlign: "left",
                          }}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* TOURS */}
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
                      top: 44,
                      left: 0,
                      padding: 12,
                      borderRadius: 18,
                      background:
                        "radial-gradient(circle at top, rgba(1,25,18,0.98), rgba(0,10,8,0.98))",
                      boxShadow:
                        "0 18px 45px rgba(0,0,0,0.9), 0 0 0 1px rgba(0,255,176,0.2)",
                      minWidth: 240,
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
                        padding: "9px 12px",
                        border: "1px solid rgba(0,255,176,0.16)",
                        background:
                          "linear-gradient(120deg, rgba(0,0,0,0.7), rgba(0,50,40,0.9))",
                        color: "rgba(235,255,248,0.96)",
                        fontSize: 13,
                        cursor: "pointer",
                        marginBottom: 8,
                        textAlign: "left",
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
                        padding: "10px 12px",
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
                      }}
                    >
                      ❤️ Saved tours
                    </div>
                  </div>
                )}
              </div>

              {/* EVENTS */}
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
                      top: 44,
                      left: 0,
                      padding: 12,
                      borderRadius: 18,
                      background:
                        "radial-gradient(circle at top, rgba(12,22,40,0.98), rgba(2,6,15,0.98))",
                      boxShadow:
                        "0 18px 45px rgba(0,0,0,0.9), 0 0 0 1px rgba(88,170,255,0.2)",
                      minWidth: 240,
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
                        padding: "9px 12px",
                        border: "1px solid rgba(120,180,255,0.25)",
                        background:
                          "linear-gradient(120deg, rgba(0,0,0,0.7), rgba(5,25,55,0.9))",
                        color: "rgba(235,245,255,0.96)",
                        fontSize: 13,
                        cursor: "pointer",
                        marginBottom: 8,
                        textAlign: "left",
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
                        padding: "10px 12px",
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
          )}

          {/* RIGHT SECTION */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            {/* SEARCH (lupa pored zvonca) */}
            <div ref={searchWrapRef} style={{ position: "relative" }}>
              <button
                onClick={() => {
                  setSearchOpen((p) => !p);
                }}
                title="Search profiles"
                style={iconBtn}
                onMouseDown={(e) => e.preventDefault()}
              >
                🔎
              </button>

              {searchOpen && (
                <div
                  style={{
                    ...dropdownBase,
                    right: 0,
                    width: 280,
                    maxWidth: "92vw",
                  }}
                >
                  {/* header */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 10,
                      gap: 10,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 14,
                          background:
                            "linear-gradient(135deg, rgba(0,255,184,0.22), rgba(88,170,255,0.16))",
                          border: "1px solid rgba(255,255,255,0.10)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 0 18px rgba(0,255,184,0.12)",
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
                          Profile search
                        </div>
                        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.92)" }}>
                          Search by name or home base
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

                  {/* input */}
                  <div style={{ position: "relative" }}>
                    <input
                      ref={searchInputRef}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={onSearchKeyDown}
                      placeholder="Type name / home base…"
                      style={{
                        width: "100%",
                        padding: "12px 14px 12px 42px",
                        borderRadius: 999,
                        border: "1px solid rgba(0,255,184,0.26)",
                        background:
                          "linear-gradient(180deg, rgba(0,0,0,0.55), rgba(0,0,0,0.35))",
                        color: "white",
                        outline: "none",
                        boxShadow: "0 0 0 1px rgba(0,255,184,0.08), 0 14px 34px rgba(0,0,0,0.6)",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        left: 14,
                        top: "50%",
                        transform: "translateY(-50%)",
                        opacity: 0.75,
                        fontSize: 16,
                      }}
                    >
                      🔎
                    </div>
                  </div>

                  {/* results */}
                  <div style={{ marginTop: 12, maxHeight: 360, overflowY: "auto" }}>
                    {searchLoading && (
                      <div style={{ padding: 10, color: "rgba(255,255,255,0.75)" }}>
                        Searching…
                      </div>
                    )}

                    {!searchLoading && searchQuery.trim().length > 0 && searchResults.length === 0 && (
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
                              boxShadow:
                                idx === searchCursor
                                  ? "0 16px 42px rgba(0,0,0,0.65), 0 0 22px rgba(0,255,184,0.12)"
                                  : "none",
                              marginBottom: 8,
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                width: 44,
                                height: 44,
                                borderRadius: 18,
                                padding: 2,
                                background:
                                  "conic-gradient(from 210deg, rgba(0,255,184,0.95), rgba(88,170,255,0.85), rgba(124,77,255,0.85), rgba(0,255,184,0.95))",
                                boxShadow:
                                  "0 0 18px rgba(0,255,184,0.18), 0 10px 24px rgba(0,0,0,0.6)",
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
                                      letterSpacing: 0.2,
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
                                    {meta}
                                  </div>
                                </div>
                                {isMutualFriend && <FriendBadge />}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  <div
                    style={{
                      marginTop: 10,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: 11,
                      color: "rgba(255,255,255,0.62)",
                      paddingTop: 10,
                      borderTop: "1px solid rgba(255,255,255,0.07)",
                    }}
                  >
                    <span>↑ ↓ to navigate • Enter to open</span>
                    <span style={{ color: "rgba(0,255,184,0.9)" }}>Search ON</span>
                  </div>
                </div>
              )}
            </div>

            {/* NOTIFICATION BELL */}
            {user && (
              <div ref={notificationsWrapRef} style={{ position: "relative" }}>
                <button
                  onClick={() => {
                    const newState = !notificationsOpen;
                    setNotificationsOpen(newState);
                    setUserMenuOpen(false);
                    setSearchOpen(false);
                    setActivitiesOpen(false);
                    setToursMenuOpen(false);
                    setEventsMenuOpen(false);
                    if (newState) markAllAsRead();
                  }}
                  style={{
                    ...iconBtn,
                    width: 40,
                    height: 40,
                    borderRadius: 14,
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
                        boxShadow: "0 0 10px rgba(255,0,0,0.65)",
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
                      width: 320,
                      maxWidth: "92vw",
                      padding: 12,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        color: "white",
                        marginBottom: 10,
                      }}
                    >
                      <div style={{ fontWeight: 900, fontSize: 13, letterSpacing: 0.2 }}>
                        Notifications
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

                    {notifications.length === 0 && (
                      <div style={{ color: "rgba(255,255,255,0.72)", padding: 8 }}>
                        You're all caught up 🌿
                      </div>
                    )}

                    <div style={{ maxHeight: 360, overflowY: "auto" }}>
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          style={{
                            background: "rgba(255,255,255,0.04)",
                            padding: 10,
                            borderRadius: 14,
                            marginBottom: 8,
                            color: "white",
                            fontSize: 13,
                            border: "1px solid rgba(255,255,255,0.06)",
                          }}
                        >
                          <div style={{ fontWeight: 750 }}>{n.message}</div>
                          <div style={{ opacity: 0.65, fontSize: 11, marginTop: 6 }}>
                            {new Date(n.created_at).toLocaleString()}
                            {n.read && (
                              <span style={{ opacity: 0.6 }}> — read</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* AVATAR */}
            {user && (
              <div ref={userWrapRef} style={{ position: "relative" }}>
                <div
                  onClick={() => {
                    setUserMenuOpen((p) => !p);
                    setNotificationsOpen(false);
                    setSearchOpen(false);
                    setActivitiesOpen(false);
                    setToursMenuOpen(false);
                    setEventsMenuOpen(false);
                  }}
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 999,
                    border: "2px solid rgba(0,255,176,0.9)",
                    overflow: "hidden",
                    cursor: "pointer",
                    position: "relative",
                    boxShadow: "0 0 14px rgba(0,255,160,0.45)",
                    flexShrink: 0,
                  }}
                  title="Account"
                >
                  {/* online dot */}
                  <span
                    style={{
                      position: "absolute",
                      bottom: -1,
                      right: -1,
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      background: "#00ff80",
                      border: "2px solid #04140c",
                      boxShadow: "0 0 10px rgba(0,255,128,0.9)",
                      zIndex: 2,
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
                      ...dropdownBase,
                      right: 0,
                      width: 240,
                      maxWidth: "92vw",
                      padding: 12,
                    }}
                  >
                    <div
                      style={{
                        padding: "6px 8px 12px",
                        borderBottom: "1px solid rgba(255,255,255,0.07)",
                        marginBottom: 10,
                      }}
                    >
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", fontWeight: 800 }}>
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
                        navigate(`/edit-profile`);
                        setUserMenuOpen(false);
                      }}
                      style={userMenuItem}
                    >
                      Edit profile
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

            {/* DESKTOP LOGOUT BUTTON */}
            {user && !isMobile && (
              <button
                onClick={logout}
                style={{
                  padding: "10px 16px",
                  borderRadius: 999,
                  background:
                    "radial-gradient(circle at 0% 0%, rgba(255,255,255,0.2), rgba(0,0,0,0.7))",
                  border: "1px solid rgba(255,255,255,0.18)",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: 900,
                  fontSize: 13,
                  boxShadow: "0 10px 26px rgba(0,0,0,0.55)",
                  whiteSpace: "nowrap",
                }}
              >
                Logout
              </button>
            )}

            {/* MOBILE MENU BUTTON (iOS safe) */}
            {isMobile && (
              <button
                onClick={() => {
                  const next = !mobileMenuOpen;
                  setMobileMenuOpen(next);
                  closeAllMenus();
                }}
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 14,
                  background: "rgba(255,255,255,0.10)",
                  border: "1px solid rgba(255,255,255,0.22)",
                  color: "white",
                  fontSize: 22,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  WebkitTapHighlightColor: "transparent",
                  zIndex: 9999,
                }}
                aria-label="Menu"
              >
                ☰
              </button>
            )}
          </div>
        </nav>
      </header>

      {/* spacer */}
      <div style={{ height: 74 }} />

      {/* MOBILE MENU OVERLAY (BRUTAL, iOS+Android) */}
      {isMobile && mobileMenuOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 5000,
            background: "rgba(0,0,0,0.92)",
            backdropFilter: "blur(18px)",
            padding: "18px 16px",
            paddingTop: "calc(18px + env(safe-area-inset-top))",
            paddingBottom: "calc(18px + env(safe-area-inset-bottom))",
          }}
        >
          {/* top bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              marginBottom: 14,
            }}
          >
            <div style={{ color: "white", fontWeight: 950, letterSpacing: 0.6 }}>
              MENU
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              style={{
                width: 44,
                height: 44,
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.16)",
                background: "rgba(255,255,255,0.06)",
                color: "white",
                fontSize: 20,
                cursor: "pointer",
                WebkitTapHighlightColor: "transparent",
              }}
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>

          {/* quick actions row */}
          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setSearchOpen(true);
                setTimeout(() => searchInputRef.current?.focus?.(), 80);
              }}
              style={{
                ...iconBtn,
                flex: 1,
                height: 46,
                borderRadius: 16,
              }}
            >
              🔎 Search
            </button>

            {user && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setNotificationsOpen(true);
                  markAllAsRead();
                }}
                style={{
                  ...iconBtn,
                  flex: 1,
                  height: 46,
                  borderRadius: 16,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.14)",
                }}
              >
                🔔 Alerts {unreadCount > 0 ? (`${unreadCount}`) : ""}
              </button>
            )}
          </div>

          {/* menu content */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              overflowY: "auto",
              maxHeight: "calc(100vh - 120px)",
              paddingBottom: 10,
            }}
          >
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              style={mobileLink}
            >
              🏠 Home
            </Link>

            <Link
              to="/timeline"
              onClick={() => setMobileMenuOpen(false)}
              style={mobileLink}
            >
              🧵 Timeline
            </Link>

            <Link
              to="/activities"
              onClick={() => setMobileMenuOpen(false)}
              style={mobileLink}
            >
              🧩 Activities
            </Link>

            {/* Tours block */}
            <div
              style={{
                padding: 14,
                borderRadius: 18,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.10)",
              }}
            >
              <div style={{ color: "white", fontWeight: 950, marginBottom: 10 }}>
                🧭 Tours
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate("/tours");
                  }}
                  style={mobileButton}
                >
                  All tours
                </button>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate("/create-tour");
                  }}
                  style={{
                    ...mobileButton,
                    background: "linear-gradient(120deg, #00ffb8, #35ffc9, #00c28a)",
                    color: "#012216",
                    fontWeight: 950,
                    border: "none",
                  }}
                >
                  + Create tour
                </button>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate("/saved-tours");
                  }}
                  style={mobileButton}
                >
                  ❤️ Saved tours
                </button>
              </div>
            </div>

            {/* Events block */}
            <div
              style={{
                padding: 14,
                borderRadius: 18,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.10)",
              }}
            >
              <div style={{ color: "white", fontWeight: 950, marginBottom: 10 }}>
                🎟️ Events
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate("/events");
                  }}
                  style={mobileButton}
                >
                  All events
                </button>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate("/create-event");
                  }}
                  style={{
                    ...mobileButton,
                    background: "linear-gradient(120deg, #5bb3ff, #9ad0ff, #4f8cff)",
                    color: "#021326",
                    fontWeight: 950,
                    border: "none",
                  }}
                >
                  + Create event
                </button>
              </div>
            </div>

            {/* quick activities chips */}
            <div
              style={{
                padding: 14,
                borderRadius: 18,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.10)",
              }}
            >
              <div style={{ color: "white", fontWeight: 950, marginBottom: 10 }}>
                ⚡ Quick activities
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: 10,
                }}
              >
                {activityItems.slice(0, 8).map((a) => (
                  <button
                    key={a}
                    onClick={() => goToActivity(a)}
                    style={{
                      padding: "12px 12px",
                      borderRadius: 999,
                      border: "1px solid rgba(0,255,176,0.18)",
                      background: "rgba(0,0,0,0.35)",
                      color: "white",
                      cursor: "pointer",
                      fontWeight: 800,
                    }}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            {/* account */}
            {user && (
              <div
                style={{
                  padding: 14,
                  borderRadius: 18,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.10)",
                }}
              >
                <div style={{ color: "white", fontWeight: 950, marginBottom: 10 }}>
                  👤 Account
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate(`/profile/${user.id}`);
                    }}
                    style={mobileButton}
                  >
                    My profile
                  </button>

                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate("/edit-profile");
                    }}
                    style={mobileButton}
                  >
                    Edit profile
                  </button>

                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate("/settings");
                    }}
                    style={mobileButton}
                  >
                    Settings
                  </button>

                  <button
                    onClick={logout}
                    style={mobileDanger}
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}