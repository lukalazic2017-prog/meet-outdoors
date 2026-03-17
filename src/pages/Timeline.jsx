// src/pages/Timeline.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function Timeline() {
  const navigate = useNavigate();
  const location = useLocation();

  const [posts, setPosts] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [user, setUser] = useState(null);

  const [search, setSearch] = useState("");
  const [activityFilter, setActivityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [feedTab, setFeedTab] = useState("all");
  const [selectedPost, setSelectedPost] = useState(null);

  const [likedMap, setLikedMap] = useState({});
  const [repostedMap, setRepostedMap] = useState({});
  const [busyMap, setBusyMap] = useState({});
  const [expandedCaptions, setExpandedCaptions] = useState({});

  const [showComments, setShowComments] = useState(false);
  const [commentsPost, setCommentsPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(false);

  const [showLikes, setShowLikes] = useState(false);
  const [likesPost, setLikesPost] = useState(null);
  const [likesUsers, setLikesUsers] = useState([]);
  const [likesLoading, setLikesLoading] = useState(false);

  const [circlePeople, setCirclePeople] = useState([]);
  const [circleLoading, setCircleLoading] = useState(false);

  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 720 : false
  );

  const commentInputRef = useRef(null);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 720);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user || null);
    });
  }, []);

  useEffect(() => {
    async function loadTimeline() {
      setLoading(true);
      setErrorMsg("");

      const { data: postsData, error: postsErr } = await supabase
        .from("timeline_posts")
        .select("*")
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(100);

      if (postsErr) {
        console.error("Timeline load error:", postsErr);
        setErrorMsg("Could not load timeline. Please try again.");
        setLoading(false);
        return;
      }

      const safePosts = postsData || [];
      const userIds = [...new Set(safePosts.map((p) => p.user_id).filter(Boolean))];

      let profilesMap = {};
      if (userIds.length > 0) {
        const { data: profilesData, error: profilesErr } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url, is_verified, is_verified_creator, creator_status")
          .in("id", userIds);

        if (!profilesErr && profilesData) {
          profilesData.forEach((p) => {
            profilesMap[p.id] = p;
          });
        }
      }

      setProfiles(profilesMap);
      setPosts(safePosts);
      setLoading(false);
    }

    loadTimeline();
  }, []);

  useEffect(() => {
    async function loadMyInteractions() {
      if (!user?.id) {
        setLikedMap({});
        setRepostedMap({});
        return;
      }

      const ids = posts.map((p) => p.id).filter(Boolean);
      if (ids.length === 0) return;

      const { data: myLikes, error: likeErr } = await supabase
        .from("timeline_post_likes")
        .select("post_id")
        .eq("user_id", user.id)
        .in("post_id", ids);

      if (likeErr) console.log("MY LIKES ERR", likeErr);

      const lm = {};
      (myLikes || []).forEach((r) => {
        lm[r.post_id] = true;
      });
      setLikedMap(lm);

      const { data: myReposts, error: repErr } = await supabase
        .from("timeline_post_reposts")
        .select("post_id")
        .eq("user_id", user.id)
        .in("post_id", ids);

      if (repErr) console.log("MY REPOSTS ERR", repErr);

      const rm = {};
      (myReposts || []).forEach((r) => {
        rm[r.post_id] = true;
      });
      setRepostedMap(rm);
    }

    loadMyInteractions();
  }, [user?.id, posts]);

  useEffect(() => {
    async function loadCirclePeople() {
      if (!user?.id) {
        setCirclePeople([]);
        return;
      }

      setCircleLoading(true);

      try {
        const { data: iFollow, error: fErr } = await supabase
          .from("profile_follows")
          .select("following_id")
          .eq("follower_id", user.id)
          .limit(24);

        if (fErr) throw fErr;

        const followingIds = (iFollow || [])
          .map((r) => r.following_id)
          .filter(Boolean);

        let mutualIds = [];
        if (followingIds.length > 0) {
          const { data: theyFollowMe } = await supabase
            .from("profile_follows")
            .select("follower_id")
            .eq("following_id", user.id)
            .in("follower_id", followingIds)
            .limit(24);

          mutualIds = (theyFollowMe || [])
            .map((r) => r.follower_id)
            .filter(Boolean);
        }

        const merged = [...new Set([...mutualIds, ...followingIds])].slice(0, 18);

        if (merged.length === 0) {
          setCirclePeople([]);
          setCircleLoading(false);
          return;
        }

        const { data: circleProfiles, error: cErr } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", merged);

        if (cErr) throw cErr;

        const ordered = merged
          .map((id) => (circleProfiles || []).find((p) => p.id === id))
          .filter(Boolean)
          .map((p) => ({
            ...p,
            isFriend: mutualIds.includes(p.id),
          }));

        setCirclePeople(ordered);

        setProfiles((prev) => {
          const next = { ...prev };
          ordered.forEach((p) => {
            next[p.id] = p;
          });
          return next;
        });
      } catch (e) {
        console.log("CIRCLE PEOPLE ERR", e);
        setCirclePeople([]);
      } finally {
        setCircleLoading(false);
      }
    }

    loadCirclePeople();
  }, [user?.id]);

  useEffect(() => {
    const qp = new URLSearchParams(location.search);
    const postId = qp.get("post");
    if (!postId || posts.length === 0) return;

    const el = document.getElementById(`timeline-post-${postId}`);
    if (el) {
      setTimeout(() => {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
    }
  }, [location.search, posts]);

  const activities = useMemo(() => {
    const s = new Set();
    posts.forEach((p) => p.activity && s.add(p.activity));
    return [...s];
  }, [posts]);

  const stats = useMemo(() => {
    const total = posts.length;
    const videos = posts.filter((p) => p.type === "video").length;
    const photos = posts.filter((p) => p.type === "image").length;
    const uniqueActivities = activities.length;
    return { total, videos, photos, uniqueActivities };
  }, [posts, activities]);

  function resolvePostKind(post) {
    if (post.post_kind) return post.post_kind;
    if (post.tour_id) return "tour_share";
    if (post.event_id) return "event_share";
    return "adventure_post";
  }

  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      const postKind = resolvePostKind(p);

      if (feedTab !== "all") {
        if (feedTab === "adventures" && postKind !== "adventure_post") return false;
        if (feedTab === "buddy" && postKind !== "buddy_post") return false;
        if (feedTab === "tours" && postKind !== "tour_share") return false;
        if (feedTab === "events" && postKind !== "event_share") return false;
      }

      if (activityFilter !== "all" && p.activity !== activityFilter) return false;
      if (typeFilter !== "all" && p.type !== typeFilter) return false;

      const author = profiles[p.user_id]?.full_name || "";
      const text = `
        ${p.caption || ""}
        ${p.activity || ""}
        ${author}
        ${p.title || ""}
        ${p.tour_title || ""}
        ${p.event_title || ""}
        ${p.buddy_location || ""}
        ${p.event_location || ""}
        ${p.tour_location || ""}
      `.toLowerCase();

      if (search.trim() && !text.includes(search.toLowerCase())) return false;
      return true;
    });
  }, [posts, activityFilter, typeFilter, search, profiles, feedTab]);

  function formatDate(v) {
    if (!v) return "";
    try {
      return new Date(v).toLocaleString();
    } catch {
      return "";
    }
  }

  function formatRelativeTime(v) {
    if (!v) return "";
    const d = new Date(v);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);

    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
    return d.toLocaleDateString();
  }

  function initials(name) {
    const safe = (name || "").trim();
    if (!safe) return "👤";
    const parts = safe.split(" ").filter(Boolean);
    const a = parts[0]?.[0]?.toUpperCase() || "";
    const b = parts[1]?.[0]?.toUpperCase() || "";
    return (a + b) || "👤";
  }

  function setBusy(key, val) {
    setBusyMap((prev) => ({ ...prev, [key]: val }));
  }

  function toggleExpanded(postId) {
    setExpandedCaptions((prev) => ({ ...prev, [postId]: !prev[postId] }));
  }

  function isVerifiedProfile(profile) {
    return (
      profile?.is_verified === true ||
      profile?.is_verified_creator === true ||
      profile?.creator_status === "approved"
    );
  }

  async function sendNotificationSafe({
    targetUserId,
    type,
    title,
    body,
    link,
  }) {
    if (!targetUserId) return;
    if (!user?.id) return;
    if (targetUserId === user.id) return;

    try {
      await supabase.from("notifications").insert({
        user_id: targetUserId,
        type,
        title,
        body,
        link,
        read: false,
        is_read: false,
      });
    } catch (e) {
      console.log("NOTIFICATION INSERT ERR", e);
    }
  }

  async function ensureProfiles(ids = []) {
    const missing = ids.filter((id) => id && !profiles[id]);
    if (missing.length === 0) return;

    const { data: profs, error } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, is_verified, is_verified_creator, creator_status")
      .in("id", missing);

    if (!error && profs) {
      setProfiles((prev) => {
        const next = { ...prev };
        profs.forEach((p) => {
          next[p.id] = p;
        });
        return next;
      });
    }
  }

  async function deletePost(postId) {
    if (!window.confirm("Delete this story permanently?")) return;

    const { error } = await supabase
      .from("timeline_posts")
      .delete()
      .eq("id", postId);

    if (error) {
      console.error(error);
      alert("Could not delete story.");
      return;
    }

    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }

  async function toggleLike(post) {
    if (!user) return navigate("/login");

    const key = `like-${post.id}`;
    if (busyMap[key]) return;

    setBusy(key, true);
    const isLiked = !!likedMap[post.id];

    try {
      if (isLiked) {
        const { error } = await supabase
          .from("timeline_post_likes")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", user.id);

        if (error) throw error;

        setLikedMap((prev) => {
          const copy = { ...prev };
          delete copy[post.id];
          return copy;
        });

        setPosts((prev) =>
          prev.map((p) =>
            p.id === post.id
              ? { ...p, likes_count: Math.max(0, (p.likes_count || 0) - 1) }
              : p
          )
        );
      } else {
        const { error } = await supabase
          .from("timeline_post_likes")
          .insert({ post_id: post.id, user_id: user.id });

        if (error) throw error;

        setLikedMap((prev) => ({ ...prev, [post.id]: true }));
        setPosts((prev) =>
          prev.map((p) =>
            p.id === post.id
              ? { ...p, likes_count: (p.likes_count || 0) + 1 }
              : p
          )
        );

        await sendNotificationSafe({
          targetUserId: post.user_id,
          type: "timeline_like",
          title: "Someone liked your story",
          body: `${profiles[user.id]?.full_name || "Someone"} liked your timeline post.`,
          link: `/timeline?post=${post.id}`,
        });
      }
    } catch (e) {
      console.error("LIKE ERR", e);
      alert("Could not update like.");
    } finally {
      setBusy(key, false);
    }
  }

  async function openLikes(post) {
    setLikesPost(post);
    setShowLikes(true);
    setLikesUsers([]);
    setLikesLoading(true);

    try {
      const { data: rows, error } = await supabase
        .from("timeline_post_likes")
        .select("user_id, created_at")
        .eq("post_id", post.id)
        .order("created_at", { ascending: false })
        .limit(120);

      if (error) throw error;

      const ids = [...new Set((rows || []).map((r) => r.user_id).filter(Boolean))];
      await ensureProfiles(ids);

      const merged = (rows || []).map((row) => ({
        ...row,
        profile: profiles[row.user_id],
      }));

      setLikesUsers(merged);
    } catch (e) {
      console.error("LIKES LOAD ERR", e);
      setLikesUsers([]);
      alert("Could not load likes.");
    } finally {
      setLikesLoading(false);
    }
  }

  async function openComments(post) {
    setCommentsPost(post);
    setShowComments(true);
    setCommentText("");
    setComments([]);
    setCommentsLoading(true);

    try {
      const { data: rows, error } = await supabase
        .from("timeline_post_comments")
        .select("id, post_id, user_id, content, created_at")
        .eq("post_id", post.id)
        .order("created_at", { ascending: true })
        .limit(120);

      if (error) throw error;

      const commenterIds = [
        ...new Set((rows || []).map((r) => r.user_id).filter(Boolean)),
      ];
      await ensureProfiles(commenterIds);

      setComments(rows || []);

      setTimeout(() => {
        commentInputRef.current?.focus?.();
      }, 150);
    } catch (e) {
      console.error("COMMENTS LOAD ERR", e);
      alert("Could not load comments.");
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  }

  async function addComment() {
    if (!user) return navigate("/login");
    if (!commentsPost) return;

    const text = (commentText || "").trim();
    if (!text) return;

    const key = `comment-${commentsPost.id}`;
    if (busyMap[key]) return;
    setBusy(key, true);

    try {
      const { data: inserted, error } = await supabase
        .from("timeline_post_comments")
        .insert({
          post_id: commentsPost.id,
          user_id: user.id,
          content: text,
        })
        .select("id, post_id, user_id, content, created_at")
        .single();

      if (error) throw error;

      setComments((prev) => [...prev, inserted]);
      setCommentText("");

      setPosts((prev) =>
        prev.map((p) =>
          p.id === commentsPost.id
            ? { ...p, comments_count: (p.comments_count || 0) + 1 }
            : p
        )
      );

      await sendNotificationSafe({
        targetUserId: commentsPost.user_id,
        type: "timeline_comment",
        title: "New comment on your story",
        body: `${profiles[user.id]?.full_name || "Someone"} commented on your timeline post.`,
        link: `/timeline?post=${commentsPost.id}`,
      });
    } catch (e) {
      console.error("ADD COMMENT ERR", e);
      alert("Could not add comment.");
    } finally {
      setBusy(key, false);
    }
  }

  async function repost(post) {
    if (!user) return navigate("/login");

    const key = `repost-${post.id}`;
    if (busyMap[key]) return;

    setBusy(key, true);
    const already = !!repostedMap[post.id];

    try {
      if (already) {
        const { error } = await supabase
          .from("timeline_post_reposts")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", user.id);

        if (error) throw error;

        setRepostedMap((prev) => {
          const c = { ...prev };
          delete c[post.id];
          return c;
        });

        setPosts((prev) =>
          prev.map((p) =>
            p.id === post.id
              ? { ...p, reposts_count: Math.max(0, (p.reposts_count || 0) - 1) }
              : p
          )
        );
      } else {
        const { error } = await supabase
          .from("timeline_post_reposts")
          .insert({ post_id: post.id, user_id: user.id });

        if (error) throw error;

        setRepostedMap((prev) => ({ ...prev, [post.id]: true }));
        setPosts((prev) =>
          prev.map((p) =>
            p.id === post.id
              ? { ...p, reposts_count: (p.reposts_count || 0) + 1 }
              : p
          )
        );
      }
    } catch (e) {
      console.error("REPOST ERR", e);
      alert("Could not update repost.");
    } finally {
      setBusy(key, false);
    }
  }

  async function sharePost(post) {
    const key = `share-${post.id}`;
    if (busyMap[key]) return;
    setBusy(key, true);

    try {
      const shareUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/timeline?post=${post.id}`
          : "";

      let shared = false;

      if (navigator.share) {
        try {
          await navigator.share({
            title: "MeetOutdoors Story",
            text: post.caption || "Outdoor story",
            url: shareUrl,
          });
          shared = true;
        } catch {}
      }

      if (!shared && shareUrl) {
        try {
          await navigator.clipboard.writeText(shareUrl);
          alert("Link copied ✅");
        } catch {
          alert("Could not copy link.");
        }
      }

      try {
        await supabase.from("timeline_post_shares").insert({
          post_id: post.id,
          user_id: user?.id || null,
          url: shareUrl || null,
        });
      } catch {}

      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id
            ? { ...p, shares_count: (p.shares_count || 0) + 1 }
            : p
        )
      );
    } finally {
      setBusy(key, false);
    }
  }

  async function deleteComment(comment) {
    if (!user) return;
    if (comment.user_id !== user.id) return;

    if (!window.confirm("Delete this comment?")) return;

    try {
      const { error } = await supabase
        .from("timeline_post_comments")
        .delete()
        .eq("id", comment.id);

      if (error) throw error;

      setComments((prev) => prev.filter((c) => c.id !== comment.id));

      setPosts((prev) =>
        prev.map((p) =>
          p.id === comment.post_id
            ? { ...p, comments_count: Math.max(0, (p.comments_count || 0) - 1) }
            : p
        )
      );
    } catch (e) {
      console.error("DELETE COMMENT ERR", e);
      alert("Could not delete comment.");
    }
  }

  function openProfile(id) {
    navigate(`/profile/${id}`);
  }

  const pageStyle = {
    minHeight: "100vh",
    padding: isMobile ? "16px 12px 120px" : "28px 18px 40px",
    marginTop: -112,
    background:
      "radial-gradient(circle at top, #081b16 0%, #03100c 30%, #010409 65%, #000000 100%)",
    color: "#ffffff",
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    boxSizing: "border-box",
    position: "relative",
    overflowX: "hidden",
  };

  const bgGlow = {
    position: "absolute",
    top: -120,
    left: "50%",
    transform: "translateX(-50%)",
    width: isMobile ? 420 : 760,
    height: isMobile ? 420 : 760,
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(0,255,190,0.10), rgba(124,77,255,0.05), transparent 70%)",
    filter: "blur(40px)",
    pointerEvents: "none",
  };

  const containerStyle = {
    maxWidth: 1120,
    margin: "0 auto",
    position: "relative",
    zIndex: 2,
  };

  const heroStyle = {
    position: "relative",
    overflow: "hidden",
    borderRadius: isMobile ? 28 : 34,
    padding: isMobile ? "18px 14px 14px" : "26px 24px 22px",
    background:
      "linear-gradient(145deg, rgba(7,22,17,0.94), rgba(3,10,8,0.98))",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow:
      "0 24px 70px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.03)",
    marginBottom: 18,
  };

  const heroGlow1 = {
    position: "absolute",
    top: -90,
    right: -60,
    width: 240,
    height: 240,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(0,255,190,0.16), transparent 68%)",
    filter: "blur(26px)",
    pointerEvents: "none",
  };

  const heroGlow2 = {
    position: "absolute",
    bottom: -110,
    left: -70,
    width: 220,
    height: 220,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(124,77,255,0.16), transparent 70%)",
    filter: "blur(30px)",
    pointerEvents: "none",
  };

  const badgeStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 14px",
    borderRadius: 999,
    border: "1px solid rgba(0,255,190,0.26)",
    background: "rgba(0,255,190,0.08)",
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: "#c9fff1",
    boxShadow: "0 0 24px rgba(0,255,190,0.10)",
    position: "relative",
    zIndex: 2,
  };

  const heroTopStyle = {
    position: "relative",
    zIndex: 2,
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "1.25fr 0.85fr",
    gap: 16,
    alignItems: "start",
  };

  const titleStyle = {
    margin: "14px 0 8px",
    fontSize: isMobile ? 30 : 48,
    lineHeight: isMobile ? 1.02 : 0.95,
    fontWeight: 1000,
    letterSpacing: "-0.05em",
    color: "#f4fff9",
    textShadow: "0 8px 24px rgba(0,255,190,0.10)",
  };

  const subtitleStyle = {
    fontSize: isMobile ? 14 : 15,
    lineHeight: 1.7,
    color: "rgba(234,255,245,0.74)",
    maxWidth: 660,
  };

  const statGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0,1fr))",
    gap: 10,
  };

  const statCardStyle = {
    borderRadius: 18,
    padding: "14px 14px",
    background:
      "linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
  };

  const statValueStyle = {
    fontSize: 24,
    fontWeight: 1000,
    color: "#ffffff",
    lineHeight: 1,
  };

  const statLabelStyle = {
    marginTop: 6,
    fontSize: 11,
    letterSpacing: "0.10em",
    textTransform: "uppercase",
    color: "rgba(234,255,245,0.62)",
    fontWeight: 800,
  };

  const addPostButtonStyle = {
    marginTop: 12,
    width: "100%",
    minHeight: 48,
    padding: "12px 16px",
    borderRadius: 999,
    border: "none",
    background: "linear-gradient(135deg, #00ffbe, #52d6ff, #7c4dff)",
    color: "#042217",
    fontWeight: 1000,
    fontSize: 13,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    cursor: "pointer",
    boxShadow: "0 14px 34px rgba(0,255,190,0.20)",
  };

  const tabsRowStyle = {
    marginTop: 16,
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    position: "relative",
    zIndex: 2,
  };

  const tabBtnStyle = (active) => ({
    minHeight: 40,
    padding: "0 14px",
    borderRadius: 999,
    border: active
      ? "1px solid rgba(0,255,190,0.26)"
      : "1px solid rgba(255,255,255,0.10)",
    background: active
      ? "linear-gradient(135deg, rgba(0,255,190,0.18), rgba(124,77,255,0.14))"
      : "rgba(255,255,255,0.04)",
    color: "#fff",
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: "0.04em",
    cursor: "pointer",
  });

  const circleWrapStyle = {
    marginTop: 16,
    position: "relative",
    zIndex: 2,
  };

  const circleHeaderStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 10,
  };

  const circleTitleStyle = {
    fontSize: 12,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: "rgba(234,255,245,0.82)",
    fontWeight: 900,
  };

  const circleHintStyle = {
    fontSize: 11,
    color: "rgba(234,255,245,0.56)",
    fontWeight: 700,
  };

  const circleRowStyle = {
    display: "flex",
    gap: 12,
    overflowX: "auto",
    paddingBottom: 4,
    paddingTop: 2,
    WebkitOverflowScrolling: "touch",
    scrollbarWidth: "none",
    msOverflowStyle: "none",
  };

  const circleItemStyle = {
    flex: "0 0 auto",
    width: 74,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    cursor: "pointer",
  };

  const circleAvatarRingStyle = (isFriend) => ({
    width: 66,
    height: 66,
    borderRadius: "50%",
    padding: 2,
    background: isFriend
      ? "conic-gradient(from 180deg, #00ffbe, #52d6ff, #7c4dff, #00ffbe)"
      : "linear-gradient(135deg, rgba(255,255,255,0.22), rgba(255,255,255,0.08))",
    boxShadow: isFriend
      ? "0 0 20px rgba(0,255,190,0.20)"
      : "0 10px 24px rgba(0,0,0,0.22)",
  });

  const circleAvatarInnerStyle = {
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    background: "#06140f",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    border: "1px solid rgba(0,0,0,0.35)",
  };

  const controlsWrapStyle = {
    marginTop: 16,
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    alignItems: "center",
  };

  const searchInputStyle = {
    flex: "1 1 260px",
    minHeight: 48,
    padding: "0 16px",
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.10)",
    background:
      "linear-gradient(145deg, rgba(7,22,17,0.96), rgba(3,11,8,0.96))",
    color: "#ffffff",
    fontSize: 14,
    outline: "none",
    boxShadow: "0 12px 26px rgba(0,0,0,0.24)",
  };

  const selectStyle = {
    flex: isMobile ? "1 1 160px" : "0 0 180px",
    minHeight: 48,
    padding: "0 14px",
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.10)",
    background:
      "linear-gradient(145deg, rgba(7,22,17,0.96), rgba(3,11,8,0.96))",
    color: "#ffffff",
    fontSize: 13,
    outline: "none",
    boxShadow: "0 12px 26px rgba(0,0,0,0.24)",
  };

  const gridStyle = {
    marginTop: 18,
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 18,
  };

  const cardStyle = {
    position: "relative",
    overflow: "hidden",
    borderRadius: 28,
    background:
      "linear-gradient(145deg, rgba(8,26,21,0.98), rgba(2,9,7,0.98))",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 28px 80px rgba(0,0,0,0.55)",
  };

  const cardInnerStyle = {
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "300px 1fr",
    gap: 0,
  };

  const mediaWrapStyle = {
    position: "relative",
    minHeight: isMobile ? 260 : 100,
    cursor: "pointer",
    background: "#030a08",
  };

  const mediaStyle = {
    width: "100%",
    height: "100%",
    minHeight: isMobile ? 260 : 100,
    maxHeight: isMobile ? 420 : 420,
    objectFit: "cover",
    display: "block",
  };

  const mediaOverlayStyle = {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(to top, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.18) 45%, rgba(0,0,0,0.05) 100%)",
    pointerEvents: "none",
  };

  const mediaNoiseStyle = {
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(circle at 20% 20%, rgba(0,255,190,0.16), transparent 30%), radial-gradient(circle at 85% 10%, rgba(124,77,255,0.18), transparent 32%)",
    mixBlendMode: "screen",
    pointerEvents: "none",
  };

  const mediaTopBadgesStyle = {
    position: "absolute",
    top: 14,
    left: 14,
    right: 14,
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "flex-start",
    flexWrap: "wrap",
  };

  const mediaBottomStyle = {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 14,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 10,
    flexWrap: "wrap",
  };

  const badgePillStyle = {
    padding: "7px 12px",
    borderRadius: 999,
    background: "rgba(0,255,190,0.14)",
    border: "1px solid rgba(0,255,190,0.34)",
    color: "#ccfff3",
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    backdropFilter: "blur(12px)",
  };

  const glassPillStyle = {
    padding: "7px 12px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.14)",
    color: "#f5fff9",
    fontSize: 11,
    fontWeight: 800,
    backdropFilter: "blur(12px)",
  };

  const playOverlayStyle = {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: isMobile ? 44 : 50,
    color: "#ffffff",
    textShadow: "0 10px 30px rgba(0,0,0,0.55)",
    pointerEvents: "none",
  };

  const rightStyle = {
    display: "flex",
    flexDirection: "column",
    padding: isMobile ? 14 : 18,
    minWidth: 0,
  };

  const userRowStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  };

  const userLeftStyle = {
    display: "flex",
    alignItems: "center",
    gap: 12,
    minWidth: 0,
    flex: 1,
  };

  const avatarStyle = {
    width: 44,
    height: 44,
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid rgba(0,255,190,0.70)",
    boxShadow: "0 0 16px rgba(0,255,190,0.18)",
    flexShrink: 0,
  };

  const avatarFallbackStyle = {
    width: 44,
    height: 44,
    borderRadius: "50%",
    border: "2px solid rgba(0,255,190,0.40)",
    background:
      "linear-gradient(135deg, rgba(0,255,190,0.20), rgba(124,77,255,0.18))",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 1000,
    color: "#ffffff",
    flexShrink: 0,
  };

  const nameStyle = {
    fontSize: 15,
    fontWeight: 1000,
    color: "#ffffff",
    lineHeight: 1.1,
    cursor: "pointer",
  };

  const timeStyle = {
    marginTop: 4,
    fontSize: 12,
    color: "rgba(234,255,245,0.60)",
    fontWeight: 700,
  };

  const verifyBadgeStyle = {
    marginLeft: 6,
    fontSize: 11,
    padding: "2px 7px",
    borderRadius: 999,
    background: "rgba(0,255,190,0.12)",
    border: "1px solid rgba(0,255,190,0.20)",
    color: "#cbfff2",
    fontWeight: 900,
    verticalAlign: "middle",
  };

  const actionMiniBtnStyle = {
    minHeight: 38,
    padding: "0 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.04)",
    color: "#ffffff",
    fontSize: 12,
    fontWeight: 800,
    cursor: "pointer",
  };

  const captionStyle = {
    marginTop: 14,
    fontSize: 15,
    lineHeight: 1.7,
    color: "rgba(245,255,249,0.94)",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  };

  const metaRowStyle = {
    marginTop: 14,
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
  };

  const activityTagStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    borderRadius: 999,
    background: "rgba(0,255,190,0.08)",
    border: "1px solid rgba(0,255,190,0.18)",
    color: "#dffff5",
    fontSize: 11,
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  };

  const chipStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "rgba(234,255,245,0.80)",
    fontSize: 12,
    fontWeight: 800,
  };

  const dividerStyle = {
    marginTop: 16,
    marginBottom: 16,
    height: 1,
    background:
      "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)",
  };

  const statsRowStyle = {
    display: "flex",
    gap: 14,
    alignItems: "center",
    flexWrap: "wrap",
    fontSize: 13,
    color: "rgba(234,255,245,0.78)",
    fontWeight: 800,
  };

  const statClickableStyle = {
    cursor: "pointer",
    userSelect: "none",
  };

  const actionRowStyle = {
    marginTop: 14,
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    alignItems: "center",
    justifyContent: "space-between",
  };

  const actionLeftStyle = {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    alignItems: "center",
  };

  const actionBtnStyle = (active, tone = "default") => {
    let bg = "rgba(255,255,255,0.05)";
    let border = "1px solid rgba(255,255,255,0.10)";
    let color = "#ffffff";

    if (tone === "danger") {
      bg = "rgba(255,70,70,0.14)";
      border = "1px solid rgba(255,100,100,0.22)";
      color = "#ffd5d5";
    }

    if (active) {
      bg =
        tone === "like"
          ? "rgba(255,60,110,0.16)"
          : tone === "repost"
          ? "rgba(0,209,255,0.16)"
          : tone === "join"
          ? "rgba(0,255,190,0.16)"
          : "rgba(0,255,190,0.12)";
      border =
        tone === "like"
          ? "1px solid rgba(255,90,130,0.28)"
          : tone === "repost"
          ? "1px solid rgba(0,209,255,0.26)"
          : "1px solid rgba(0,255,190,0.26)";
      color = "#ffffff";
    }

    return {
      minHeight: 42,
      padding: "0 14px",
      borderRadius: 999,
      border,
      background: bg,
      color,
      fontSize: 12,
      fontWeight: 900,
      letterSpacing: "0.04em",
      cursor: "pointer",
      whiteSpace: "nowrap",
      boxShadow: active ? "0 12px 26px rgba(0,0,0,0.20)" : "none",
    };
  };

  const primaryGhostBtnStyle = {
    minHeight: 42,
    padding: "0 14px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.10)",
    background:
      "linear-gradient(135deg, rgba(0,255,190,0.14), rgba(124,77,255,0.14))",
    color: "#f5fff9",
    fontWeight: 900,
    fontSize: 12,
    letterSpacing: "0.04em",
    cursor: "pointer",
    whiteSpace: "nowrap",
  };

  const strongActionBtnStyle = {
    minHeight: 44,
    padding: "0 16px",
    borderRadius: 999,
    border: "none",
    background: "linear-gradient(135deg, #00ffbe, #52d6ff, #7c4dff)",
    color: "#042217",
    fontWeight: 1000,
    fontSize: 12,
    letterSpacing: "0.06em",
    cursor: "pointer",
    whiteSpace: "nowrap",
    boxShadow: "0 12px 24px rgba(0,255,190,0.16)",
  };

  const specialCardStyle = {
    marginTop: 14,
    borderRadius: 20,
    padding: "14px",
    background:
      "linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
    border: "1px solid rgba(255,255,255,0.08)",
  };

  const specialTitleStyle = {
    fontSize: 17,
    fontWeight: 1000,
    letterSpacing: "-0.02em",
    color: "#fff",
    marginBottom: 8,
  };

  const specialMetaGridStyle = {
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
    gap: 8,
    marginTop: 10,
  };

  const specialMetaItemStyle = {
    borderRadius: 14,
    padding: "10px 12px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.06)",
    fontSize: 13,
    color: "rgba(245,255,249,0.90)",
    fontWeight: 700,
  };

  const errorStyle = {
    marginTop: 16,
    padding: "12px 14px",
    borderRadius: 16,
    background: "rgba(255,60,80,0.18)",
    border: "1px solid rgba(255,90,110,0.30)",
    color: "#ffd3d8",
    fontSize: 13,
    fontWeight: 800,
  };

  const emptyStyle = {
    marginTop: 20,
    padding: "40px 18px",
    borderRadius: 28,
    textAlign: "center",
    color: "rgba(255,255,255,0.66)",
    fontSize: 14,
    background:
      "linear-gradient(145deg, rgba(8,26,21,0.96), rgba(2,9,7,0.96))",
    border: "1px solid rgba(255,255,255,0.06)",
    boxShadow: "0 24px 60px rgba(0,0,0,0.42)",
  };

  const loadingStyle = {
    minHeight: "60vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#ffffff",
    fontSize: 16,
    fontWeight: 800,
  };

  const overlayStyle = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.82)",
    backdropFilter: "blur(10px)",
    display: "flex",
    alignItems: isMobile ? "flex-end" : "center",
    justifyContent: "center",
    zIndex: 5000,
    padding: isMobile ? 0 : 18,
  };

  const modalStyle = {
    width: isMobile ? "100%" : "min(920px, 100%)",
    maxHeight: isMobile ? "88vh" : "90vh",
    borderTopLeftRadius: isMobile ? 26 : 28,
    borderTopRightRadius: isMobile ? 26 : 28,
    borderBottomLeftRadius: isMobile ? 0 : 28,
    borderBottomRightRadius: isMobile ? 0 : 28,
    overflow: "hidden",
    background:
      "linear-gradient(180deg, rgba(7,18,14,0.995), rgba(2,8,6,0.995))",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "0 30px 80px rgba(0,0,0,0.55)",
    display: "flex",
    flexDirection: "column",
  };

  const modalHeadStyle = {
    padding: "14px 14px 10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  };

  const modalTitleStyle = {
    fontSize: 17,
    fontWeight: 1000,
    color: "#ffffff",
    letterSpacing: "-0.02em",
  };

  const closeBtnStyle = {
    minHeight: 40,
    padding: "0 14px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    fontWeight: 800,
    fontSize: 12,
    cursor: "pointer",
  };

  const modalBodyStyle = {
    padding: "14px",
    overflowY: "auto",
  };

  const likesRowStyle = {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 12px",
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    marginBottom: 10,
    cursor: "pointer",
  };

  const likeAvatarStyle = {
    width: 42,
    height: 42,
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid rgba(0,255,190,0.55)",
    flexShrink: 0,
  };

  const commentItemStyle = {
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 18,
    padding: 12,
    marginBottom: 10,
  };

  const commentInputWrapStyle = {
    marginTop: 12,
    display: "flex",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
  };

  const commentInputStyle = {
    flex: "1 1 240px",
    minHeight: 48,
    padding: "0 14px",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.10)",
    background:
      "linear-gradient(145deg, rgba(7,22,17,0.96), rgba(3,11,8,0.96))",
    color: "#ffffff",
    fontSize: 14,
    outline: "none",
  };

  const sendBtnStyle = {
    minHeight: 48,
    padding: "0 16px",
    borderRadius: 16,
    border: "none",
    background: "linear-gradient(135deg, #00ffbe, #52d6ff, #7c4dff)",
    color: "#042217",
    fontWeight: 1000,
    fontSize: 12,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    cursor: "pointer",
  };

  function renderPostBody(post) {
    const kind = resolvePostKind(post);
    const caption = post.caption || "";
    const shouldTrim = caption.length > (isMobile ? 150 : 220);
    const expanded = !!expandedCaptions[post.id];
    const shownCaption =
      shouldTrim && !expanded
        ? `${caption.slice(0, isMobile ? 150 : 220)}...`
        : caption;

    if (kind === "buddy_post") {
      return (
        <>
          <div style={specialCardStyle}>
            <div style={{ ...specialTitleStyle, color: "#dffef3" }}>
              🤝 Looking for an adventure buddy
            </div>

            {caption ? (
              <div style={captionStyle}>
                {shownCaption}
                {shouldTrim && (
                  <span
                    onClick={() => toggleExpanded(post.id)}
                    style={{
                      marginLeft: 8,
                      color: "#9effea",
                      fontWeight: 900,
                      cursor: "pointer",
                    }}
                  >
                    {expanded ? "show less" : "see more"}
                  </span>
                )}
              </div>
            ) : null}

            <div style={specialMetaGridStyle}>
              <div style={specialMetaItemStyle}>
                📍 {post.buddy_location || post.location_name || "Location not set"}
              </div>
              <div style={specialMetaItemStyle}>
                🗓 {post.buddy_date ? formatDate(post.buddy_date) : "Flexible date"}
              </div>
              <div style={specialMetaItemStyle}>
                ⛰ {post.activity || "Adventure"}
              </div>
              <div style={specialMetaItemStyle}>
                🎯 {post.buddy_level || "Any level"}
              </div>
              <div style={specialMetaItemStyle}>
                👥 {post.buddy_slots || 1} spot{Number(post.buddy_slots || 1) > 1 ? "s" : ""}
              </div>
              <div style={specialMetaItemStyle}>
                💬 Open to chat
              </div>
            </div>
          </div>

          <div style={metaRowStyle}>
            <div style={activityTagStyle}>buddy post</div>
            <div style={chipStyle}>Adventure partner</div>
          </div>
        </>
      );
    }

    if (kind === "tour_share") {
      return (
        <>
          <div style={specialCardStyle}>
            <div style={{ ...specialTitleStyle, color: "#ffffff" }}>
              🧭 {post.tour_title || post.title || "New tour available"}
            </div>

            {caption ? (
              <div style={captionStyle}>
                {shownCaption}
                {shouldTrim && (
                  <span
                    onClick={() => toggleExpanded(post.id)}
                    style={{
                      marginLeft: 8,
                      color: "#9effea",
                      fontWeight: 900,
                      cursor: "pointer",
                    }}
                  >
                    {expanded ? "show less" : "see more"}
                  </span>
                )}
              </div>
            ) : null}

            <div style={specialMetaGridStyle}>
              <div style={specialMetaItemStyle}>
                📍 {post.tour_location || post.location_name || "Location not set"}
              </div>
              <div style={specialMetaItemStyle}>
                🗓 {post.tour_date_start ? formatDate(post.tour_date_start) : "Date coming soon"}
              </div>
              <div style={specialMetaItemStyle}>
                💶 {post.tour_price ? `${post.tour_price} €` : "Price on details"}
              </div>
              <div style={specialMetaItemStyle}>
                ⛰ {post.activity || "Tour"}
              </div>
            </div>
          </div>

          <div style={metaRowStyle}>
            <div style={activityTagStyle}>tour share</div>
            <div style={chipStyle}>Creator post</div>
          </div>
        </>
      );
    }

    if (kind === "event_share") {
      return (
        <>
          <div style={specialCardStyle}>
            <div style={{ ...specialTitleStyle, color: "#ffffff" }}>
              🎉 {post.event_title || post.title || "New event available"}
            </div>

            {caption ? (
              <div style={captionStyle}>
                {shownCaption}
                {shouldTrim && (
                  <span
                    onClick={() => toggleExpanded(post.id)}
                    style={{
                      marginLeft: 8,
                      color: "#9effea",
                      fontWeight: 900,
                      cursor: "pointer",
                    }}
                  >
                    {expanded ? "show less" : "see more"}
                  </span>
                )}
              </div>
            ) : null}

            <div style={specialMetaGridStyle}>
              <div style={specialMetaItemStyle}>
                📍 {post.event_location || post.location_name || "Location not set"}
              </div>
              <div style={specialMetaItemStyle}>
                🗓 {post.event_date ? formatDate(post.event_date) : "Date coming soon"}
              </div>
              <div style={specialMetaItemStyle}>
                ⛰ {post.activity || "Event"}
              </div>
              <div style={specialMetaItemStyle}>
                ⚡ Community event
              </div>
            </div>
          </div>

          <div style={metaRowStyle}>
            <div style={activityTagStyle}>event share</div>
            <div style={chipStyle}>Community event</div>
          </div>
        </>
      );
    }

    return (
      <>
        {!!caption && (
          <div style={captionStyle}>
            {shownCaption}
            {shouldTrim && (
              <span
                onClick={() => toggleExpanded(post.id)}
                style={{
                  marginLeft: 8,
                  color: "#9effea",
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                {expanded ? "show less" : "see more"}
              </span>
            )}
          </div>
        )}

        <div style={metaRowStyle}>
          {post.activity && (
            <div style={activityTagStyle}>⛰ {post.activity}</div>
          )}
          <div style={chipStyle}>adventure post</div>
          <div style={chipStyle}>Post #{String(post.id).slice(0, 6)}</div>
        </div>
      </>
    );
  }

  function renderActionRight(post) {
    const kind = resolvePostKind(post);

    if (kind === "buddy_post") {
      return (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            style={strongActionBtnStyle}
            onClick={() => openComments(post)}
          >
            Join adventure
          </button>
          <button
            type="button"
            style={primaryGhostBtnStyle}
            onClick={() => openProfile(post.user_id)}
          >
            View profile →
          </button>
        </div>
      );
    }

    if (kind === "tour_share") {
      return (
        <button
          type="button"
          style={strongActionBtnStyle}
          onClick={() => {
            if (post.tour_id) navigate(`/tour/${post.tour_id}`);
            else if (post.activity) navigate(`/tours?activity=${encodeURIComponent(post.activity)}`);
            else navigate("/tours");
          }}
        >
          View tour →
        </button>
      );
    }

    if (kind === "event_share") {
      return (
        <button
          type="button"
          style={strongActionBtnStyle}
          onClick={() => {
            if (post.event_id) navigate(`/event/${post.event_id}`);
            else navigate("/events");
          }}
        >
          View event →
        </button>
      );
    }

    return (
      <button
        type="button"
        style={primaryGhostBtnStyle}
        onClick={() => {
          if (post.activity) {
            navigate(`/tours?activity=${encodeURIComponent(post.activity)}`);
          } else if (post.tour_id) {
            navigate("/tours?from=timeline");
          } else {
            navigate("/tours");
          }
        }}
      >
        Open related tours →
      </button>
    );
  }

  if (loading) {
    return (
      <div style={pageStyle}>
        <div style={bgGlow} />
        <div style={containerStyle}>
          <div style={loadingStyle}>Loading timeline...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={bgGlow} />

      <div style={containerStyle}>
        <div style={heroStyle}>
          <div style={heroGlow1} />
          <div style={heroGlow2} />

          <div style={badgeStyle}>⚡ Timeline · live outdoor stories</div>

          <div style={heroTopStyle}>
            <div>
              <h1 style={titleStyle}>See what the outdoors feels like.</h1>
              <div style={subtitleStyle}>
                Real moments from real explorers. Adventure posts, buddy requests,
                shared tours and fresh community events — all in one premium feed.
              </div>
            </div>

            <div>
              <div style={statGridStyle}>
                <div style={statCardStyle}>
                  <div style={statValueStyle}>{stats.total}</div>
                  <div style={statLabelStyle}>Total posts</div>
                </div>

                <div style={statCardStyle}>
                  <div style={statValueStyle}>{stats.uniqueActivities}</div>
                  <div style={statLabelStyle}>Activities</div>
                </div>

                <div style={statCardStyle}>
                  <div style={statValueStyle}>{stats.photos}</div>
                  <div style={statLabelStyle}>Photos</div>
                </div>

                <div style={statCardStyle}>
                  <div style={statValueStyle}>{stats.videos}</div>
                  <div style={statLabelStyle}>Videos</div>
                </div>
              </div>

              <button
                type="button"
                style={addPostButtonStyle}
                onClick={() => navigate("/add-post")}
              >
                + Add new story
              </button>
            </div>
          </div>

          <div style={tabsRowStyle}>
            <button style={tabBtnStyle(feedTab === "all")} onClick={() => setFeedTab("all")}>
              All
            </button>
            <button style={tabBtnStyle(feedTab === "adventures")} onClick={() => setFeedTab("adventures")}>
              Adventures
            </button>
            <button style={tabBtnStyle(feedTab === "buddy")} onClick={() => setFeedTab("buddy")}>
              Buddy
            </button>
            <button style={tabBtnStyle(feedTab === "tours")} onClick={() => setFeedTab("tours")}>
              Tours
            </button>
            <button style={tabBtnStyle(feedTab === "events")} onClick={() => setFeedTab("events")}>
              Events
            </button>
          </div>

          <div style={circleWrapStyle}>
            <div style={circleHeaderStyle}>
              <div style={circleTitleStyle}>Your people</div>
              <div style={circleHintStyle}>
                Friends and people you follow
              </div>
            </div>

            <div style={circleRowStyle}>
              {circleLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} style={circleItemStyle}>
                    <div style={circleAvatarRingStyle(false)}>
                      <div style={circleAvatarInnerStyle} />
                    </div>
                    <div
                      style={{
                        width: 58,
                        height: 10,
                        borderRadius: 999,
                        background: "rgba(255,255,255,0.08)",
                      }}
                    />
                  </div>
                ))
              ) : circlePeople.length === 0 ? (
                <div
                  style={{
                    color: "rgba(234,255,245,0.62)",
                    fontSize: 13,
                    padding: "10px 2px",
                  }}
                >
                  Follow people and build your outdoor circle.
                </div>
              ) : (
                circlePeople.map((p) => (
                  <div
                    key={p.id}
                    style={circleItemStyle}
                    onClick={() => navigate(`/profile/${p.id}`)}
                  >
                    <div style={circleAvatarRingStyle(!!p.isFriend)}>
                      <div style={circleAvatarInnerStyle}>
                        {p.avatar_url ? (
                          <img
                            src={p.avatar_url}
                            alt={p.full_name || "Explorer"}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              fontWeight: 1000,
                              color: "#ffffff",
                              fontSize: 14,
                            }}
                          >
                            {initials(p.full_name)}
                          </div>
                        )}
                      </div>
                    </div>

                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        color: "#eafff5",
                        textAlign: "center",
                        lineHeight: 1.2,
                        maxWidth: 70,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {p.full_name || "Explorer"}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div style={controlsWrapStyle}>
            <input
              style={searchInputStyle}
              placeholder="Search posts, people or activities..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              style={selectStyle}
              value={activityFilter}
              onChange={(e) => setActivityFilter(e.target.value)}
            >
              <option value="all">All activities</option>
              {activities.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>

            <select
              style={{ ...selectStyle, flex: isMobile ? "1 1 160px" : "0 0 150px" }}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All media</option>
              <option value="image">Photos</option>
              <option value="video">Videos</option>
            </select>
          </div>
        </div>

        {errorMsg && <div style={errorStyle}>{errorMsg}</div>}

        {filteredPosts.length === 0 && !errorMsg && (
          <div style={emptyStyle}>
            No posts found yet. Be the first to share an adventure.
          </div>
        )}

        <div style={gridStyle}>
          {filteredPosts.map((post) => {
            const profile = profiles[post.user_id] || {};
            const avatar = profile.avatar_url || "";
            const name = profile.full_name || "Outdoor explorer";

            const isVideo = post.type === "video";
            const likes = post.likes_count || 0;
            const commentsCount = post.comments_count || 0;
            const shares = post.shares_count || 0;
            const reposts = post.reposts_count || 0;

            const iLiked = !!likedMap[post.id];
            const iReposted = !!repostedMap[post.id];
            const postKind = resolvePostKind(post);

            return (
              <div
                key={post.id}
                id={`timeline-post-${post.id}`}
                style={{
                  ...cardStyle,
                  boxShadow:
                    location.search.includes(`post=${post.id}`)
                      ? "0 0 0 1px rgba(0,255,190,0.24), 0 28px 80px rgba(0,0,0,0.55), 0 0 38px rgba(0,255,190,0.14)"
                      : cardStyle.boxShadow,
                }}
              >
                <div style={cardInnerStyle}>
                  <div
                    style={mediaWrapStyle}
                    onClick={() => setSelectedPost(post)}
                  >
                    {isVideo ? (
                      <>
                        <img
                          src={post.thumbnail_url || post.media_url}
                          alt={post.caption || "Video"}
                          style={mediaStyle}
                        />
                        <div style={playOverlayStyle}>▶</div>
                      </>
                    ) : (
                      <img
                        src={post.media_url}
                        alt={post.caption || "Image"}
                        style={mediaStyle}
                      />
                    )}

                    <div style={mediaOverlayStyle} />
                    <div style={mediaNoiseStyle} />

                    <div style={mediaTopBadgesStyle}>
                      <div style={badgePillStyle}>
                        {postKind === "buddy_post"
                          ? "buddy post"
                          : postKind === "tour_share"
                          ? "tour share"
                          : postKind === "event_share"
                          ? "event share"
                          : `#${post.activity || "story"}`}
                      </div>

                      <div style={glassPillStyle}>
                        {isVideo ? "🎬 Video" : "📸 Photo"}
                      </div>
                    </div>

                    <div style={mediaBottomStyle}>
                      <div style={glassPillStyle}>
                        {formatRelativeTime(post.created_at)}
                      </div>
                    </div>
                  </div>

                  <div style={rightStyle}>
                    <div style={userRowStyle}>
                      <div style={userLeftStyle}>
                        {avatar ? (
                          <img
                            src={avatar}
                            alt={name}
                            style={avatarStyle}
                            onClick={() => openProfile(post.user_id)}
                          />
                        ) : (
                          <div
                            style={avatarFallbackStyle}
                            onClick={() => openProfile(post.user_id)}
                          >
                            {initials(name)}
                          </div>
                        )}

                        <div style={{ minWidth: 0 }}>
                          <div
                            style={nameStyle}
                            onClick={() => openProfile(post.user_id)}
                          >
                            {name}
                            {isVerifiedProfile(profile) && (
                              <span style={verifyBadgeStyle}>verified</span>
                            )}
                          </div>
                          <div style={timeStyle}>
                            {formatDate(post.created_at)}
                          </div>
                        </div>
                      </div>

                      {user?.id === post.user_id && (
                        <button
                          style={actionMiniBtnStyle}
                          onClick={() => deletePost(post.id)}
                        >
                          Delete
                        </button>
                      )}
                    </div>

                    {renderPostBody(post)}

                    <div style={dividerStyle} />

                    <div style={statsRowStyle}>
                      <div
                        style={statClickableStyle}
                        onClick={() => openLikes(post)}
                      >
                        ❤️ {likes} {likes === 1 ? "like" : "likes"}
                      </div>

                      <div
                        style={statClickableStyle}
                        onClick={() => openComments(post)}
                      >
                        💬 {commentsCount}{" "}
                        {commentsCount === 1 ? "comment" : "comments"}
                      </div>

                      <div>🔁 {reposts} reposts</div>
                      <div>📤 {shares} shares</div>
                    </div>

                    <div style={actionRowStyle}>
                      <div style={actionLeftStyle}>
                        <button
                          type="button"
                          style={actionBtnStyle(iLiked, "like")}
                          onClick={() => toggleLike(post)}
                          disabled={busyMap[`like-${post.id}`]}
                        >
                          {iLiked ? "❤️ Liked" : "🤍 Like"}
                        </button>

                        <button
                          type="button"
                          style={actionBtnStyle(false)}
                          onClick={() => openComments(post)}
                        >
                          💬 Comment
                        </button>

                        <button
                          type="button"
                          style={actionBtnStyle(iReposted, "repost")}
                          onClick={() => repost(post)}
                          disabled={busyMap[`repost-${post.id}`]}
                        >
                          {iReposted ? "🔁 Reposted" : "🔁 Repost"}
                        </button>

                        <button
                          type="button"
                          style={actionBtnStyle(false)}
                          onClick={() => sharePost(post)}
                          disabled={busyMap[`share-${post.id}`]}
                        >
                          📤 Share
                        </button>
                      </div>

                      {renderActionRight(post)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedPost && (
        <div style={overlayStyle} onClick={() => setSelectedPost(null)}>
          <div
            style={{
              ...modalStyle,
              width: isMobile ? "100%" : "min(1100px, 100%)",
              maxHeight: isMobile ? "92vh" : "94vh",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={modalHeadStyle}>
              <div style={modalTitleStyle}>Story preview</div>
              <button style={closeBtnStyle} onClick={() => setSelectedPost(null)}>
                Close
              </button>
            </div>

            <div style={{ ...modalBodyStyle, padding: 0 }}>
              {selectedPost.type === "video" ? (
                <video
                  src={selectedPost.media_url}
                  style={{
                    width: "100%",
                    maxHeight: isMobile ? "72vh" : "82vh",
                    objectFit: "contain",
                    background: "#000",
                    display: "block",
                  }}
                  controls
                  autoPlay
                />
              ) : (
                <img
                  src={selectedPost.media_url}
                  alt={selectedPost.caption || "Media"}
                  style={{
                    width: "100%",
                    maxHeight: isMobile ? "72vh" : "82vh",
                    objectFit: "contain",
                    background: "#000",
                    display: "block",
                  }}
                />
              )}

              {selectedPost.caption && (
                <div
                  style={{
                    padding: "14px",
                    fontSize: 14,
                    color: "rgba(245,255,249,0.92)",
                    lineHeight: 1.7,
                  }}
                >
                  {selectedPost.caption}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showLikes && likesPost && (
        <div
          style={overlayStyle}
          onClick={() => {
            setShowLikes(false);
            setLikesPost(null);
            setLikesUsers([]);
          }}
        >
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeadStyle}>
              <div style={modalTitleStyle}>
                Likes · Post {String(likesPost.id).slice(0, 6)}
              </div>
              <button
                style={closeBtnStyle}
                onClick={() => {
                  setShowLikes(false);
                  setLikesPost(null);
                  setLikesUsers([]);
                }}
              >
                Close
              </button>
            </div>

            <div style={modalBodyStyle}>
              {likesLoading ? (
                <div style={{ color: "rgba(255,255,255,0.72)", fontSize: 13 }}>
                  Loading likes...
                </div>
              ) : likesUsers.length === 0 ? (
                <div style={{ color: "rgba(255,255,255,0.72)", fontSize: 13 }}>
                  No likes yet.
                </div>
              ) : (
                likesUsers.map((row, idx) => {
                  const p = profiles[row.user_id] || row.profile || {};
                  const fullName = p.full_name || "Explorer";

                  return (
                    <div
                      key={`${row.user_id}-${idx}`}
                      style={likesRowStyle}
                      onClick={() => openProfile(row.user_id)}
                    >
                      {p.avatar_url ? (
                        <img
                          src={p.avatar_url}
                          alt={fullName}
                          style={likeAvatarStyle}
                        />
                      ) : (
                        <div style={avatarFallbackStyle}>{initials(fullName)}</div>
                      )}

                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 900,
                            color: "#ffffff",
                          }}
                        >
                          {fullName}
                        </div>
                        <div
                          style={{
                            marginTop: 3,
                            fontSize: 12,
                            color: "rgba(234,255,245,0.66)",
                          }}
                        >
                          Liked this story · {formatRelativeTime(row.created_at)}
                        </div>
                      </div>

                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 800,
                          color: "rgba(234,255,245,0.70)",
                        }}
                      >
                        Open →
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {showComments && commentsPost && (
        <div
          style={overlayStyle}
          onClick={() => {
            setShowComments(false);
            setCommentsPost(null);
            setComments([]);
            setCommentText("");
          }}
        >
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeadStyle}>
              <div style={modalTitleStyle}>
                Comments · Post {String(commentsPost.id).slice(0, 6)}
              </div>

              <button
                style={closeBtnStyle}
                onClick={() => {
                  setShowComments(false);
                  setCommentsPost(null);
                  setComments([]);
                  setCommentText("");
                }}
              >
                Close
              </button>
            </div>

            <div style={modalBodyStyle}>
              {commentsLoading ? (
                <div style={{ color: "rgba(255,255,255,0.72)", fontSize: 13 }}>
                  Loading comments...
                </div>
              ) : comments.length === 0 ? (
                <div style={{ color: "rgba(255,255,255,0.72)", fontSize: 13 }}>
                  No comments yet. Be the first.
                </div>
              ) : (
                comments.map((c) => {
                  const p = profiles[c.user_id] || {};
                  const nm = p.full_name || "Explorer";

                  return (
                    <div key={c.id} style={commentItemStyle}>
                      {p.avatar_url ? (
                        <img
                          src={p.avatar_url}
                          alt={nm}
                          style={likeAvatarStyle}
                          onClick={() => openProfile(c.user_id)}
                        />
                      ) : (
                        <div
                          style={avatarFallbackStyle}
                          onClick={() => openProfile(c.user_id)}
                        >
                          {initials(nm)}
                        </div>
                      )}

                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            gap: 10,
                            flexWrap: "wrap",
                          }}
                        >
                          <div
                            style={{
                              fontSize: 14,
                              fontWeight: 1000,
                              color: "#ffffff",
                              cursor: "pointer",
                            }}
                            onClick={() => openProfile(c.user_id)}
                          >
                            {nm}
                          </div>

                          <div
                            style={{
                              fontSize: 12,
                              color: "rgba(234,255,245,0.58)",
                              fontWeight: 700,
                            }}
                          >
                            {formatDate(c.created_at)}
                          </div>
                        </div>

                        <div
                          style={{
                            marginTop: 6,
                            fontSize: 14,
                            lineHeight: 1.65,
                            color: "rgba(245,255,249,0.92)",
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                          }}
                        >
                          {c.content}
                        </div>

                        {user?.id === c.user_id && (
                          <button
                            onClick={() => deleteComment(c)}
                            style={{
                              ...actionBtnStyle(false, "danger"),
                              marginTop: 8,
                              minHeight: 34,
                              padding: "0 12px",
                            }}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}

              <div style={commentInputWrapStyle}>
                <input
                  ref={commentInputRef}
                  style={commentInputStyle}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={user ? "Write a comment..." : "Login to comment..."}
                  disabled={!user}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addComment();
                  }}
                />

                <button
                  type="button"
                  style={{
                    ...sendBtnStyle,
                    opacity:
                      !user || busyMap[`comment-${commentsPost.id}`] ? 0.6 : 1,
                    cursor:
                      !user || busyMap[`comment-${commentsPost.id}`]
                        ? "default"
                        : "pointer",
                  }}
                  onClick={addComment}
                  disabled={!user || busyMap[`comment-${commentsPost.id}`]}
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}