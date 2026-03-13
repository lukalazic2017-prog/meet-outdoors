// src/pages/EditProfile.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function EditProfile() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  // TEXT
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [homeBase, setHomeBase] = useState("");
  const [favoriteActivity, setFavoriteActivity] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");

  // FILES
  const [avatarFile, setAvatarFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);

  // STATE
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 860 : false
  );

  // PREVIEW XP / LEVEL
  const [xp] = useState(120);
  const [level] = useState(1);
  const maxXp = 200;

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 860);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // -------- LOAD USER + PROFILE --------
  useEffect(() => {
    async function load() {
      setLoading(true);
      setErrorMsg("");

      const {
        data: { user },
        error: authErr,
      } = await supabase.auth.getUser();

      if (authErr || !user) {
        setLoading(false);
        navigate("/login");
        return;
      }

      setUser(user);

      let { data: existing } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (!existing) {
        const { error: insertErr } = await supabase.from("profiles").insert({
          id: user.id,
          full_name: user.email || "",
          bio: "",
          avatar_url: "",
          cover_url: "",
          home_base: "",
          favorite_activity: "",
          instagram_url: "",
          tiktok_url: "",
          youtube_url: "",
        });

        if (insertErr) console.error("Auto-profile error:", insertErr);

        existing = {
          id: user.id,
          full_name: user.email || "",
          bio: "",
          avatar_url: "",
          cover_url: "",
          home_base: "",
          favorite_activity: "",
          instagram_url: "",
          tiktok_url: "",
          youtube_url: "",
        };
      }

      setProfile(existing);
      setFullName(existing.full_name || "");
      setBio(existing.bio || "");
      setHomeBase(existing.home_base || "");
      setFavoriteActivity(existing.favorite_activity || "");
      setInstagramUrl(existing.instagram_url || "");
      setTiktokUrl(existing.tiktok_url || "");
      setYoutubeUrl(existing.youtube_url || "");
      setAvatarPreview(existing.avatar_url || null);
      setCoverPreview(existing.cover_url || null);

      setLoading(false);
    }

    load();
  }, [navigate]);

  // cleanup blob URLs
  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith("blob:")) URL.revokeObjectURL(avatarPreview);
      if (coverPreview?.startsWith("blob:")) URL.revokeObjectURL(coverPreview);
    };
  }, [avatarPreview, coverPreview]);

  // -------- FILE HANDLERS --------
  function onAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (avatarPreview?.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(avatarPreview);
      } catch {}
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  function onCoverChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (coverPreview?.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(coverPreview);
      } catch {}
    }

    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  function removeAvatar() {
    if (avatarPreview?.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(avatarPreview);
      } catch {}
    }
    setAvatarFile(null);
    setAvatarPreview(profile?.avatar_url || null);
  }

  function removeCover() {
    if (coverPreview?.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(coverPreview);
      } catch {}
    }
    setCoverFile(null);
    setCoverPreview(profile?.cover_url || null);
  }

  // -------- VALIDATION --------
  function validate() {
    if (!fullName.trim()) return "Display name is required.";
    if (fullName.trim().length < 2) return "Display name is too short.";
    if (bio.length > 500) return "Bio must be under 500 characters.";
    return null;
  }

  // -------- SUBMIT / SAVE --------
  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const validation = validate();
    if (validation) {
      setErrorMsg(validation);
      return;
    }

    if (!user) return;

    setSaving(true);

    try {
      let avatarUrl = profile?.avatar_url || null;
      let coverUrl = profile?.cover_url || null;

      if (avatarFile) {
        const ext = avatarFile.name.split(".").pop();
        const fileName = `avatar-${user.id}-${Date.now()}.${ext}`;
        const { data: aData, error: aErr } = await supabase.storage
          .from("avatars")
          .upload(fileName, avatarFile);

        if (aErr) throw aErr;

        const { data: pub } = supabase.storage
          .from("avatars")
          .getPublicUrl(aData.path);

        avatarUrl = pub.publicUrl;
      }

      if (coverFile) {
        const ext = coverFile.name.split(".").pop();
        const fileName = `cover-${user.id}-${Date.now()}.${ext}`;
        const { data: cData, error: cErr } = await supabase.storage
          .from("covers")
          .upload(fileName, coverFile);

        if (cErr) throw cErr;

        const { data: pub } = supabase.storage
          .from("covers")
          .getPublicUrl(cData.path);

        coverUrl = pub.publicUrl;
      }

      const { error: updErr } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          bio: bio.trim(),
          home_base: homeBase.trim(),
          favorite_activity: favoriteActivity.trim(),
          instagram_url: instagramUrl.trim(),
          tiktok_url: tiktokUrl.trim(),
          youtube_url: youtubeUrl.trim(),
          avatar_url: avatarUrl,
          cover_url: coverUrl,
        })
        .eq("id", user.id);

      if (updErr) throw updErr;

      setProfile((prev) => ({
        ...prev,
        full_name: fullName.trim(),
        bio: bio.trim(),
        home_base: homeBase.trim(),
        favorite_activity: favoriteActivity.trim(),
        instagram_url: instagramUrl.trim(),
        tiktok_url: tiktokUrl.trim(),
        youtube_url: youtubeUrl.trim(),
        avatar_url: avatarUrl,
        cover_url: coverUrl,
      }));

      setAvatarFile(null);
      setCoverFile(null);
      setAvatarPreview(avatarUrl);
      setCoverPreview(coverUrl);
      setSuccessMsg("Profile updated successfully 🌿");
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Error updating profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const progress = Math.min((xp / maxXp) * 100, 100);

  const styles = useMemo(
    () => ({
      page: {
        minHeight: "100vh",
        padding: isMobile ? "0 0 34px" : "18px 16px 40px",
        background:
          "radial-gradient(900px 420px at 10% 0%, rgba(0,255,190,0.16), transparent 58%)," +
          "radial-gradient(900px 420px at 90% 0%, rgba(0,170,255,0.14), transparent 58%)," +
          "linear-gradient(180deg, #051812 0%, #020907 48%, #010304 100%)",
        color: "#fff",
        boxSizing: "border-box",
        fontFamily:
          "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      },

      shell: {
        maxWidth: 1220,
        margin: "0 auto",
      },

      hero: {
        position: "relative",
        overflow: "hidden",
        borderRadius: isMobile ? "0 0 30px 30px" : 30,
        border: isMobile ? "none" : "1px solid rgba(255,255,255,0.08)",
        background:
          "radial-gradient(120% 120% at 0% 0%, rgba(0,255,180,0.18), transparent 40%)," +
          "radial-gradient(120% 120% at 100% 0%, rgba(0,140,255,0.16), transparent 40%)," +
          "linear-gradient(180deg, rgba(7,22,18,0.98), rgba(2,10,8,0.98))",
        boxShadow: isMobile
          ? "0 22px 45px rgba(0,0,0,0.40)"
          : "0 28px 80px rgba(0,0,0,0.70), 0 0 0 1px rgba(0,255,190,0.06)",
        padding: isMobile ? "18px 14px 18px" : "22px 22px 20px",
        marginBottom: isMobile ? 14 : 18,
      },

      backRow: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        flexWrap: "wrap",
        marginBottom: 14,
      },

      backBtn: {
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "9px 14px",
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.05)",
        color: "#effff8",
        fontSize: 12,
        fontWeight: 800,
        cursor: "pointer",
        backdropFilter: "blur(12px)",
      },

      heroGrid: {
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1.2fr 0.8fr",
        gap: isMobile ? 16 : 18,
        alignItems: "center",
      },

      heroLeft: {
        minWidth: 0,
      },

      badge: {
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 11px",
        borderRadius: 999,
        border: "1px solid rgba(0,255,160,0.30)",
        background: "rgba(0,255,160,0.08)",
        fontSize: 11,
        fontWeight: 900,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "rgba(210,255,230,0.92)",
      },

      title: {
        fontSize: isMobile ? 30 : 38,
        fontWeight: 1000,
        lineHeight: 1.04,
        letterSpacing: "-0.04em",
        margin: "12px 0 8px",
        color: "#f6fffb",
      },

      subtitle: {
        fontSize: isMobile ? 13 : 14,
        color: "rgba(235,255,245,0.74)",
        lineHeight: 1.7,
        maxWidth: 620,
      },

      heroPills: {
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        marginTop: 14,
      },

      heroPill: {
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        borderRadius: 999,
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.09)",
        color: "rgba(235,255,245,0.86)",
        fontSize: 12,
        fontWeight: 800,
      },

      heroPreview: {
        position: "relative",
        minHeight: isMobile ? 210 : 260,
        borderRadius: 24,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.10)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
        background:
          "linear-gradient(180deg, rgba(6,22,16,0.96), rgba(0,0,0,0.88))",
      },

      heroCover: {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        filter: "saturate(1.08) brightness(0.82)",
      },

      heroOverlay: {
        position: "absolute",
        inset: 0,
        background:
          "radial-gradient(500px 220px at 15% 15%, rgba(0,255,190,0.18), transparent 55%)," +
          "linear-gradient(180deg, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.88) 85%)",
      },

      previewContent: {
        position: "absolute",
        left: 16,
        right: 16,
        bottom: 14,
      },

      previewAvatarWrap: {
        width: isMobile ? 82 : 92,
        height: isMobile ? 82 : 92,
        borderRadius: "50%",
        padding: 3,
        marginBottom: 10,
        background:
          "linear-gradient(135deg, #00ffb0 0%, #00d9ff 55%, #7c4dff 100%)",
        boxShadow: "0 0 26px rgba(0,255,190,0.32)",
      },

      previewAvatar: {
        width: "100%",
        height: "100%",
        borderRadius: "50%",
        objectFit: "cover",
        border: "3px solid rgba(0,0,0,0.72)",
        background: "#02100b",
      },

      previewName: {
        fontSize: isMobile ? 22 : 24,
        fontWeight: 1000,
        color: "#fff",
        lineHeight: 1.05,
      },

      previewBio: {
        marginTop: 6,
        fontSize: 12.5,
        lineHeight: 1.6,
        color: "rgba(240,255,247,0.82)",
        maxWidth: 420,
      },

      progressWrap: {
        marginTop: 14,
        padding: "12px 12px 10px",
        borderRadius: 18,
        background: "rgba(0,0,0,0.35)",
        border: "1px solid rgba(255,255,255,0.10)",
        backdropFilter: "blur(12px)",
      },

      progressTop: {
        display: "flex",
        justifyContent: "space-between",
        gap: 10,
        fontSize: 11,
        color: "rgba(240,255,247,0.75)",
        marginBottom: 7,
        fontWeight: 800,
      },

      progressBar: {
        width: "100%",
        height: 10,
        borderRadius: 999,
        background: "rgba(255,255,255,0.08)",
        overflow: "hidden",
      },

      progressFill: {
        width: `${progress}%`,
        height: "100%",
        borderRadius: 999,
        background: "linear-gradient(90deg, #00ffb0, #00d9ff)",
        boxShadow: "0 0 18px rgba(0,255,190,0.55)",
      },

      layout: {
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1.35fr) minmax(0, 0.9fr)",
        gap: 18,
      },

      card: {
        background:
          "linear-gradient(180deg, rgba(4,14,12,0.92), rgba(2,8,7,0.96))",
        borderRadius: isMobile ? 22 : 26,
        padding: isMobile ? 14 : 18,
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow:
          "0 24px 70px rgba(0,0,0,0.62), inset 0 1px 0 rgba(255,255,255,0.03)",
        backdropFilter: "blur(16px)",
        overflow: "hidden",
      },

      section: {
        marginBottom: 18,
      },

      sectionTitle: {
        fontSize: 12,
        fontWeight: 1000,
        marginBottom: 12,
        textTransform: "uppercase",
        letterSpacing: "0.14em",
        color: "rgba(210,255,230,0.88)",
      },

      fieldGrid2: {
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
        gap: 10,
      },

      label: {
        fontSize: 12,
        marginBottom: 5,
        color: "rgba(255,255,255,0.88)",
        fontWeight: 800,
      },

      input: {
        width: "100%",
        padding: "12px 13px",
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.05)",
        color: "#ffffff",
        fontSize: 14,
        outline: "none",
        boxSizing: "border-box",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
      },

      textarea: {
        width: "100%",
        minHeight: 110,
        padding: "12px 13px",
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.05)",
        color: "#ffffff",
        fontSize: 14,
        outline: "none",
        boxSizing: "border-box",
        resize: "vertical",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
      },

      hint: {
        fontSize: 11,
        color: "rgba(255,255,255,0.52)",
        marginTop: 5,
        lineHeight: 1.45,
      },

      uploadCard: {
        borderRadius: 18,
        border: "1px dashed rgba(255,255,255,0.20)",
        padding: 14,
        background:
          "radial-gradient(circle at top left, rgba(0,255,160,0.14), rgba(0,0,0,0.78))",
      },

      uploadHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 12,
        flexWrap: "wrap",
      },

      uploadTitle: {
        fontSize: 14,
        fontWeight: 900,
        color: "#f5fffa",
      },

      uploadActions: {
        display: "flex",
        gap: 8,
        flexWrap: "wrap",
      },

      ghostBtn: {
        padding: "8px 12px",
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.16)",
        background: "rgba(255,255,255,0.06)",
        color: "#fff",
        fontSize: 12,
        fontWeight: 800,
        cursor: "pointer",
      },

      uploadPreviewCover: {
        width: "100%",
        height: isMobile ? 130 : 150,
        objectFit: "cover",
        borderRadius: 14,
        marginTop: 12,
        border: "1px solid rgba(255,255,255,0.12)",
      },

      uploadPreviewAvatarWrap: {
        width: 72,
        height: 72,
        borderRadius: "50%",
        overflow: "hidden",
        border: "2px solid rgba(0,255,160,0.82)",
        boxShadow: "0 0 16px rgba(0,255,160,0.32)",
        flexShrink: 0,
      },

      uploadPreviewAvatar: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
      },

      msgError: {
        marginTop: 10,
        fontSize: 13,
        padding: "10px 12px",
        borderRadius: 14,
        background: "rgba(255,60,80,0.14)",
        border: "1px solid rgba(255,90,110,0.55)",
        color: "#ffd3d8",
      },

      msgSuccess: {
        marginTop: 10,
        fontSize: 13,
        padding: "10px 12px",
        borderRadius: 14,
        background: "rgba(0,255,150,0.10)",
        border: "1px solid rgba(0,255,150,0.50)",
        color: "#c9ffe8",
      },

      submitBtn: {
        marginTop: 16,
        width: "100%",
        padding: "14px 16px",
        borderRadius: 999,
        border: "none",
        background:
          "linear-gradient(135deg, #00ffb0 0%, #00cf7c 42%, #02a45d 100%)",
        color: "#02140b",
        fontSize: 15,
        fontWeight: 1000,
        letterSpacing: "0.10em",
        textTransform: "uppercase",
        cursor: "pointer",
        boxShadow: "0 16px 45px rgba(0,255,165,0.34)",
      },

      sideSticky: {
        position: isMobile ? "relative" : "sticky",
        top: 18,
      },

      sidePreviewCard: {
        borderRadius: 24,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.08)",
        background:
          "linear-gradient(180deg, rgba(5,18,14,0.96), rgba(1,8,6,0.96))",
        boxShadow: "0 24px 70px rgba(0,0,0,0.62)",
        marginBottom: 14,
      },

      sideTopCover: {
        position: "relative",
        height: isMobile ? 170 : 190,
        overflow: "hidden",
      },

      sideCoverImg: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        filter: "saturate(1.08) brightness(0.86)",
      },

      sideCoverOverlay: {
        position: "absolute",
        inset: 0,
        background:
          "linear-gradient(180deg, rgba(0,0,0,0.10), rgba(0,0,0,0.92))",
      },

      sideAvatarWrap: {
        position: "absolute",
        left: "50%",
        bottom: -42,
        transform: "translateX(-50%)",
        width: 88,
        height: 88,
        borderRadius: "50%",
        padding: 3,
        background:
          "linear-gradient(135deg, #00ffb0 0%, #00d9ff 55%, #7c4dff 100%)",
        boxShadow: "0 0 24px rgba(0,255,190,0.30)",
      },

      sideAvatar: {
        width: "100%",
        height: "100%",
        borderRadius: "50%",
        objectFit: "cover",
        border: "3px solid rgba(0,0,0,0.76)",
      },

      sideBody: {
        padding: "54px 16px 16px",
        textAlign: "center",
      },

      sideName: {
        fontSize: 22,
        fontWeight: 1000,
        lineHeight: 1.06,
      },

      sideBio: {
        marginTop: 8,
        fontSize: 13,
        lineHeight: 1.65,
        color: "rgba(240,255,247,0.76)",
      },

      sideMiniGrid: {
        marginTop: 14,
        display: "grid",
        gap: 10,
      },

      miniBox: {
        padding: "12px 12px",
        borderRadius: 16,
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.08)",
      },

      miniLabel: {
        fontSize: 11,
        color: "rgba(240,255,247,0.56)",
        textTransform: "uppercase",
        letterSpacing: "0.10em",
        fontWeight: 900,
        marginBottom: 4,
      },

      miniValue: {
        fontSize: 13,
        color: "#fff",
        fontWeight: 800,
        wordBreak: "break-word",
      },

      socialRow: {
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        marginTop: 14,
        justifyContent: "center",
      },

      socialPill: {
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        padding: "7px 10px",
        borderRadius: 999,
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.10)",
        fontSize: 12,
        fontWeight: 800,
      },
    }),
    [isMobile, progress]
  );

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.shell}>
          <div style={{ ...styles.card, textAlign: "center", padding: 28 }}>
            Loading profile...
          </div>
        </div>
      </div>
    );
  }

  const safeAvatar =
    avatarPreview || "https://i.pravatar.cc/300?img=12";
  const safeCover = coverPreview || "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&auto=format&fit=crop&q=60";
  const safeBio =
    bio || "No bio yet — say something awesome about your outdoor side.";
  const hasAnySocial = instagramUrl || tiktokUrl || youtubeUrl;

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <div style={styles.hero}>
          <div style={styles.backRow}>
            <button style={styles.backBtn} onClick={() => navigate(-1)}>
              ← Back
            </button>
          </div>

          <div style={styles.heroGrid}>
            <div style={styles.heroLeft}>
              <div style={styles.badge}>✏️ Edit profile · Level {level}</div>
              <h1 style={styles.title}>Tune your outdoor identity.</h1>
              <p style={styles.subtitle}>
                Sredi profil da izgleda premium, moćno i ozbiljno — ime, bio,
                cover, avatar i društvene mreže da odmah ostaviš utisak.
              </p>

              <div style={styles.heroPills}>
                <span style={styles.heroPill}>🧬 Level {level}</span>
                <span style={styles.heroPill}>⚡ {xp} XP</span>
                <span style={styles.heroPill}>🌿 Explorer mode</span>
              </div>
            </div>

            <div style={styles.heroPreview}>
              <img src={safeCover} alt="cover" style={styles.heroCover} />
              <div style={styles.heroOverlay} />

              <div style={styles.previewContent}>
                <div style={styles.previewAvatarWrap}>
                  <img src={safeAvatar} alt="avatar" style={styles.previewAvatar} />
                </div>

                <div style={styles.previewName}>{fullName || "Your name"}</div>
                <div style={styles.previewBio}>{safeBio}</div>

                <div style={styles.progressWrap}>
                  <div style={styles.progressTop}>
                    <span>Adventure level</span>
                    <span>
                      {xp} / {maxXp} XP
                    </span>
                  </div>
                  <div style={styles.progressBar}>
                    <div style={styles.progressFill} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.layout}>
          <form style={styles.card} onSubmit={handleSubmit}>
            <div style={styles.section}>
              <div style={styles.sectionTitle}>Basic info</div>

              <div style={{ marginBottom: 10 }}>
                <div style={styles.label}>Display name *</div>
                <input
                  style={styles.input}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Example: Luka"
                />
              </div>

              <div style={{ marginBottom: 10 }}>
                <div style={styles.label}>Short bio</div>
                <textarea
                  style={styles.textarea}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell people who you are in the outdoors..."
                />
                <div style={styles.hint}>
                  {bio.length}/500 characters · neka bude kratko, jako i lično.
                </div>
              </div>

              <div style={styles.fieldGrid2}>
                <div>
                  <div style={styles.label}>Home base</div>
                  <input
                    style={styles.input}
                    value={homeBase}
                    onChange={(e) => setHomeBase(e.target.value)}
                    placeholder="Example: Prokuplje, Serbia"
                  />
                </div>

                <div>
                  <div style={styles.label}>Favorite activity</div>
                  <input
                    style={styles.input}
                    value={favoriteActivity}
                    onChange={(e) => setFavoriteActivity(e.target.value)}
                    placeholder="Example: Hiking & rafting"
                  />
                </div>
              </div>
            </div>

            <div style={styles.section}>
              <div style={styles.sectionTitle}>Social links</div>

              <div style={{ marginBottom: 10 }}>
                <div style={styles.label}>Instagram</div>
                <input
                  style={styles.input}
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  placeholder="https://instagram.com/..."
                />
              </div>

              <div style={{ marginBottom: 10 }}>
                <div style={styles.label}>TikTok</div>
                <input
                  style={styles.input}
                  value={tiktokUrl}
                  onChange={(e) => setTiktokUrl(e.target.value)}
                  placeholder="https://www.tiktok.com/@..."
                />
              </div>

              <div>
                <div style={styles.label}>YouTube</div>
                <input
                  style={styles.input}
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://youtube.com/@..."
                />
              </div>
            </div>

            <div style={styles.section}>
              <div style={styles.sectionTitle}>Avatar</div>

              <div style={styles.uploadCard}>
                <div style={styles.uploadHeader}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={styles.uploadPreviewAvatarWrap}>
                      <img
                        src={safeAvatar}
                        alt="avatar preview"
                        style={styles.uploadPreviewAvatar}
                      />
                    </div>

                    <div>
                      <div style={styles.uploadTitle}>Upload new avatar</div>
                      <div style={styles.hint}>
                        Square image works best. Tvoj avatar mora brutalno da izgleda.
                      </div>
                    </div>
                  </div>

                  <div style={styles.uploadActions}>
                    <label style={styles.ghostBtn}>
                      Choose file
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={onAvatarChange}
                      />
                    </label>

                    <button
                      type="button"
                      style={styles.ghostBtn}
                      onClick={removeAvatar}
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div style={styles.section}>
              <div style={styles.sectionTitle}>Cover image</div>

              <div style={styles.uploadCard}>
                <div style={styles.uploadHeader}>
                  <div>
                    <div style={styles.uploadTitle}>Upload new cover</div>
                    <div style={styles.hint}>
                      Wide landscape works best. Cover daje prvi utisak.
                    </div>
                  </div>

                  <div style={styles.uploadActions}>
                    <label style={styles.ghostBtn}>
                      Choose file
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={onCoverChange}
                      />
                    </label>

                    <button
                      type="button"
                      style={styles.ghostBtn}
                      onClick={removeCover}
                    >
                      Reset
                    </button>
                  </div>
                </div>

                <img
                  src={safeCover}
                  alt="cover preview"
                  style={styles.uploadPreviewCover}
                />
              </div>
            </div>

            {errorMsg && <div style={styles.msgError}>{errorMsg}</div>}
            {successMsg && <div style={styles.msgSuccess}>{successMsg}</div>}

            <button type="submit" disabled={saving} style={styles.submitBtn}>
              {saving ? "Saving..." : "Save changes"}
            </button>
          </form>

          <div style={styles.sideSticky}>
            <div style={styles.sidePreviewCard}>
              <div style={styles.sideTopCover}>
                <img src={safeCover} alt="cover" style={styles.sideCoverImg} />
                <div style={styles.sideCoverOverlay} />

                <div style={styles.sideAvatarWrap}>
                  <img src={safeAvatar} alt="avatar" style={styles.sideAvatar} />
                </div>
              </div>

              <div style={styles.sideBody}>
                <div style={styles.sideName}>{fullName || "Your name"}</div>
                <div style={styles.sideBio}>{safeBio}</div>

                <div style={styles.sideMiniGrid}>
                  <div style={styles.miniBox}>
                    <div style={styles.miniLabel}>Home base</div>
                    <div style={styles.miniValue}>
                      {homeBase || "No home base set"}
                    </div>
                  </div>

                  <div style={styles.miniBox}>
                    <div style={styles.miniLabel}>Favorite activity</div>
                    <div style={styles.miniValue}>
                      {favoriteActivity || "No favorite activity yet"}
                    </div>
                  </div>

                  <div style={styles.miniBox}>
                    <div style={styles.miniLabel}>Level progress</div>
                    <div style={styles.miniValue}>
                      Level {level} · {xp}/{maxXp} XP
                    </div>
                  </div>
                </div>

                <div style={styles.socialRow}>
                  {instagramUrl && <div style={styles.socialPill}>📸 Instagram linked</div>}
                  {tiktokUrl && <div style={styles.socialPill}>🎵 TikTok linked</div>}
                  {youtubeUrl && <div style={styles.socialPill}>▶ YouTube linked</div>}
                  {!hasAnySocial && (
                    <div style={styles.socialPill}>🌐 Add socials for stronger profile</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}