// src/pages/EditProfile.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function EditProfile() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  // TEXT POLJA
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [homeBase, setHomeBase] = useState("");
  const [favoriteActivity, setFavoriteActivity] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");

  // SLIKE
  const [avatarFile, setAvatarFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);

  // STATE
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // LAZY XP / LEVEL (za preview – ne menjamo u bazi)
  const [xp] = useState(120);
  const [level] = useState(1);
  const maxXp = 200;

  // -------- LOAD USER + PROFILE --------
  useEffect(() => {
    async function load() {
      setLoading(true);
      setErrorMsg("");

      const {
        data: { user },
        error: authErr,
      } = await supabase.auth.getUser();
      // ===== AUTO CREATE PROFILE IF MISSING =====
let { data: existing } = await supabase
  .from("profiles")
  .select("*")
  .eq("id", user.id)
  .maybeSingle();

if (!existing) {
  const { error: insertErr } = await supabase
    .from("profiles")
    .insert({
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

      if (authErr || !user) {
        setLoading(false);
        navigate("/login");
        return;
      }

      setUser(user);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error(error);
        setErrorMsg("Could not load profile. Please try again.");
        setLoading(false);
        return;
      }

      setProfile(data);

      setFullName(data.full_name || "");
      setBio(data.bio || "");
      setHomeBase(data.home_base || "");
      setFavoriteActivity(data.favorite_activity || "");
      setInstagramUrl(data.instagram_url || "");
      setTiktokUrl(data.tiktok_url || "");
      setYoutubeUrl(data.youtube_url || "");
      setAvatarPreview(data.avatar_url || null);
      setCoverPreview(data.cover_url || null);

      setLoading(false);
    }

    load();
  }, [navigate]);

  // -------- FILE HANDLERS --------
  function onAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  function onCoverChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  // -------- VALIDATION --------
  function validate() {
    if (!fullName.trim()) return "Display name is required.";
    if (fullName.trim().length < 2)
      return "Display name is too short.";
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
      let avatarUrl = avatarPreview || profile?.avatar_url || null;
      let coverUrl = coverPreview || profile?.cover_url || null;

      // AVATAR UPLOAD
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

      // COVER UPLOAD
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

      // UPDATE PROFILE
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

      setSuccessMsg("Profile updated successfully 🌿");
      // ako hoćeš odmah nazad na profil:
      // setTimeout(() => navigate(/profile/${user.id}), 1200);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Error updating profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // -------- STILOVI --------
  const pageStyle = {
    minHeight: "100vh",
    padding: "28px 16px 60px",
    background:
      "radial-gradient(circle at top, #062a1d 0%, #020a08 50%, #010304 100%)",
    color: "#ffffff",
    boxSizing: "border-box",
  };

  const containerStyle = {
    maxWidth: 1100,
    margin: "0 auto",
  };

  const headerStyle = {
    marginBottom: 20,
  };

  const badgeStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "4px 11px",
    borderRadius: 999,
    border: "1px solid rgba(0,255,160,0.6)",
    background:
      "linear-gradient(120deg, rgba(0,0,0,0.85), rgba(0,255,160,0.12))",
    fontSize: 11,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "rgba(210,255,230,0.9)",
  };

  const titleStyle = {
    fontSize: 30,
    fontWeight: 800,
    margin: "10px 0 4px",
  };

  const subtitleStyle = {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    maxWidth: 520,
  };

  const layoutStyle = {
    marginTop: 22,
    display: "grid",
    gridTemplateColumns: "minmax(0, 2.1fr) minmax(0, 1.4fr)",
    gap: 20,
  };

  const cardStyle = {
    background: "rgba(0,0,0,0.55)",
    borderRadius: 18,
    padding: 18,
    border: "1px solid rgba(255,255,255,0.06)",
    boxShadow: "0 22px 60px rgba(0,0,0,0.85)",
    backdropFilter: "blur(16px)",
  };

  const labelStyle = {
    fontSize: 13,
    marginBottom: 4,
    color: "rgba(255,255,255,0.9)",
  };

  const inputBase = {
    width: "100%",
    padding: "9px 11px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(0,0,0,0.55)",
    color: "#ffffff",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  };

  const textareaStyle = {
    ...inputBase,
    minHeight: 90,
    resize: "vertical",
  };

  const hintStyle = {
    fontSize: 11,
    color: "rgba(255,255,255,0.55)",
    marginTop: 4,
  };

  const sectionTitle = {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: "0.07em",
    color: "rgba(210,255,230,0.9)",
  };

  const errorStyle = {
    marginTop: 10,
    fontSize: 13,
    padding: "8px 10px",
    borderRadius: 10,
    background: "rgba(255,60,80,0.16)",
    border: "1px solid rgba(255,90,110,0.7)",
    color: "#ffd3d8",
  };

  const successStyle = {
    marginTop: 10,
    fontSize: 13,
    padding: "8px 10px",
    borderRadius: 10,
    background: "rgba(0,255,150,0.1)",
    border: "1px solid rgba(0,255,150,0.6)",
    color: "#c9ffe8",
  };

  const submitBtn = {
    marginTop: 16,
    width: "100%",
    padding: "11px 14px",
    borderRadius: 999,
    border: "none",
    background:
      "linear-gradient(135deg, #00ffb0 0%, #00cf7c 40%, #02a45d 100%)",
    color: "#02140b",
    fontSize: 15,
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    cursor: "pointer",
    boxShadow: "0 14px 40px rgba(0,255,165,0.45)",
  };

  const miniPill = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: 11,
    padding: "4px 9px",
    borderRadius: 999,
    background: "rgba(0,0,0,0.5)",
    border: "1px solid rgba(255,255,255,0.16)",
  };

  const isSmall =
    typeof window !== "undefined" && window.innerWidth < 800;
  const layoutResponsive = isSmall
    ? { ...layoutStyle, gridTemplateColumns: "1fr" }
    : layoutStyle;

  if (loading) {
    return (
      <div style={pageStyle}>
        <div style={containerStyle}>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        {/* HEADER */}
        <div style={headerStyle}>
          <div style={badgeStyle}>
            ✏️ Edit profile · Level {level} Explorer
          </div>
          <h1 style={titleStyle}>Tune your outdoor identity.</h1>
          <p style={subtitleStyle}>
            Update your avatar, cover, description and social links so
            people instantly feel who you are on the trail.
          </p>
        </div>

        {/* LAYOUT */}
        <div style={layoutResponsive}>
          {/* LEFT: FORM */}
          <form style={cardStyle} onSubmit={handleSubmit}>
            {/* BASIC INFO */}
            <div style={{ marginBottom: 18 }}>
              <div style={sectionTitle}>Basic info</div>

              <div style={{ marginBottom: 10 }}>
                <div style={labelStyle}>Display name *</div>
                <input
                  style={inputBase}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Example: Luka"
                />
              </div>

              <div style={{ marginBottom: 10 }}>
                <div style={labelStyle}>Short bio</div>
                <textarea
                  style={textareaStyle}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell people who you are in the outdoors..."
                />
                <div style={hintStyle}>
                  {bio.length}/500 characters · keep it friendly and
                  inspiring.
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}
              >
                <div>
                  <div style={labelStyle}>Home base</div>
                  <input
                    style={inputBase}
                    value={homeBase}
                    onChange={(e) => setHomeBase(e.target.value)}
                    placeholder="Example: Prokuplje, Serbia"
                  />
                </div>
                <div>
                  <div style={labelStyle}>Favorite activity</div>
                  <input
                    style={inputBase}
                    value={favoriteActivity}
                    onChange={(e) => setFavoriteActivity(e.target.value)}
                    placeholder="Example: Hiking & rafting"
                  />
                </div>
              </div>
            </div>

            {/* SOCIAL LINKS */}
            <div style={{ marginBottom: 18 }}>
              <div style={sectionTitle}>Social links</div>

              <div style={{ marginBottom: 8 }}>
                <div style={labelStyle}>Instagram</div>
                <input
                  style={inputBase}
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  placeholder="https://instagram.com/..."
                />
              </div>

              <div style={{ marginBottom: 8 }}>
                <div style={labelStyle}>TikTok</div>
                <input
                  style={inputBase}
                  value={tiktokUrl}
                  onChange={(e) => setTiktokUrl(e.target.value)}
                  placeholder="https://www.tiktok.com/@..."
                />
              </div>

              <div>
                <div style={labelStyle}>YouTube</div>
                <input
                  style={inputBase}
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://youtube.com/@..."
                />
              </div>
            </div>

            {/* AVATAR & COVER */}
            <div style={{ marginBottom: 18 }}>
              <div style={sectionTitle}>Avatar & cover</div>

              {/* AVATAR */}
              <div style={{ marginBottom: 14 }}>
                <div style={labelStyle}>Avatar</div>
                <label
                  style={{
                    borderRadius: 14,
                    border: "1px dashed rgba(255,255,255,0.28)",
                    padding: 12,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    background:
                      "radial-gradient(circle at top left, rgba(0,255,160,0.2), rgba(0,0,0,0.9))",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 2 }}>
                      📷 Upload new avatar
                    </div>
                    <div style={hintStyle}>
                      Square image works best. If you skip this, your
                      current avatar stays.
                    </div>
                  </div>

                  {avatarPreview && (
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: "50%",
                        overflow: "hidden",
                        border:
                          "2px solid rgba(0,255,160,0.85)",
                        boxShadow:
                          "0 0 14px rgba(0,255,160,0.65)",
                      }}
                    >
                      <img
                        src={avatarPreview}
                        alt="avatar preview"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </div>
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={onAvatarChange}
                  />
                </label>
              </div>

              {/* COVER */}
              <div>
                <div style={labelStyle}>Cover image</div>
                <label
                  style={{
                    borderRadius: 14,
                    border: "1px dashed rgba(255,255,255,0.28)",
                    padding: 12,
                    cursor: "pointer",
                    display: "block",
                    background:
                      "radial-gradient(circle at top left, rgba(0,180,255,0.25), rgba(0,0,0,0.9))",
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 2 }}>
                    🌄 Upload new cover
                  </div>
                  <div style={hintStyle}>
                    Wide landscape works best. If you skip this, current
                    cover stays.
                  </div>

                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={onCoverChange}
                  />
                </label>

                {coverPreview && (
                  <div
                    style={{
                      marginTop: 10,
                      borderRadius: 14,
                      overflow: "hidden",
                      border:
                        "1px solid rgba(255,255,255,0.18)",
                    }}
                  >
                    <img
                      src={coverPreview}
                      alt="cover preview"
                      style={{
                        width: "100%",
                        height: 130,
                        objectFit: "cover",
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* ERRORS / SUCCESS */}
            {errorMsg && <div style={errorStyle}>{errorMsg}</div>}
            {successMsg && <div style={successStyle}>{successMsg}</div>}

            {/* SUBMIT */}
            <button type="submit" disabled={saving} style={submitBtn}>
              {saving ? "Saving..." : "Save changes"}
            </button>
          </form>

          {/* RIGHT: LIVE PREVIEW */}
          <div style={cardStyle}>
            <div style={sectionTitle}>Live preview</div>

            {/* COVER PREVIEW */}
            <div
              style={{
                borderRadius: 18,
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.12)",
                marginBottom: 14,
                position: "relative",
                height: 160,
                background:
                  "linear-gradient(135deg,#052612,#02130b)",
              }}
            >
              {coverPreview && (
                <img
                  src={coverPreview}
                  alt="cover"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    filter: "saturate(1.1)",
                  }}
                />
              )}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(180deg, rgba(0,0,0,0.1), rgba(0,0,0,0.9))",
                }}
              />

              {/* AVATAR FLOAT */}
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  bottom: -40,
                  transform: "translateX(-50%)",
                }}
              >
                <div
                  style={{
                    width: 84,
                    height: 84,
                    borderRadius: "50%",
                    overflow: "hidden",
                    border:
                      "3px solid rgba(0,255,200,0.9)",
                    boxShadow:
                      "0 0 25px rgba(0,255,170,0.8)",
                  }}
                >
                  <img
                    src={
                      avatarPreview ||
                      "https://i.pravatar.cc/300"
                    }
                    alt="avatar"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* TEXT ZONA */}
            <div style={{ paddingTop: 42 }}>
              <div
                style={{
                  textAlign: "center",
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    marginBottom: 4,
                  }}
                >
                  {fullName || "Your name"}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "rgba(255,255,255,0.7)",
                    minHeight: 18,
                  }}
                >
                  {bio || "No bio yet – say something awesome."}
                </div>
              </div>

              {/* XP / LEVEL */}
              <div style={{ marginBottom: 14 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 11,
                    marginBottom: 4,
                    color: "rgba(255,255,255,0.7)",
                  }}
                >
                  <span>Adventure level</span>
                  <span>
                    Level {level} · {xp} / {maxXp} XP
                  </span>
                </div>
                <div
                  style={{
                    width: "100%",
                    height: 8,
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.08)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${Math.min(
                        (xp / maxXp) * 100,
                        100
                      )}%`,
                      height: "100%",
                      background:
                        "linear-gradient(90deg,#00ffb0,#00e0ff)",
                      boxShadow:
                        "0 0 16px rgba(0,255,180,0.8)",
                    }}
                  />
                </div>
              </div>

              {/* MINI INFO */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <div style={miniPill}>
                  🏠 {homeBase || "No home base set"}
                </div>
                <div style={miniPill}>
                  🧭{" "}
                  {favoriteActivity || "No favorite activity yet"}
                </div>
              </div>

              {/* SOCIAL ICONS */}
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  marginTop: 6,
                  flexWrap: "wrap",
                }}
              >
                {instagramUrl && (
                  <div style={miniPill}>📸 Instagram linked</div>
                )}
                {tiktokUrl && (
                  <div style={miniPill}>🎵 TikTok linked</div>
                )}
                {youtubeUrl && (
                  <div style={miniPill}>▶ YouTube linked</div>
                )}
                {!instagramUrl && !tiktokUrl && !youtubeUrl && (
                  <div style={hintStyle}>
                    Add at least one social link so people can
                    connect with you after the tour.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}