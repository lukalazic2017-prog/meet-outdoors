import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

const CATEGORY_OPTIONS = [
  { value: "outdoor", label: "Outdoor" },
  { value: "chill", label: "Chill" },
  { value: "night", label: "Night out" },
  { value: "sport", label: "Sport" },
  { value: "trip", label: "Mini trip" },
  { value: "activity", label: "Activity" },
];

const VIBE_OPTIONS = [
  { value: "chill", label: "Chill" },
  { value: "social", label: "Social" },
  { value: "active", label: "Active" },
  { value: "party", label: "Party" },
  { value: "adventurous", label: "Adventurous" },
];

const DIFFICULTY_OPTIONS = [
  { value: "easy", label: "Easy" },
  { value: "moderate", label: "Moderate" },
  { value: "hard", label: "Hard" },
];

function toLocalDatetimeValue(date) {
  const d = new Date(date);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function formatLocalPreview(value) {
  if (!value) return "Not set";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Invalid";
  return d.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getCategoryEmoji(category) {
  switch (category) {
    case "outdoor":
      return "🌿";
    case "chill":
      return "☕";
    case "night":
      return "🌙";
    case "sport":
      return "🏀";
    case "trip":
      return "🚗";
    case "activity":
      return "⚡";
    default:
      return "🔥";
  }
}

function getVibeEmoji(vibe) {
  switch (vibe) {
    case "chill":
      return "🫶";
    case "social":
      return "👋";
    case "active":
      return "💪";
    case "party":
      return "🎉";
    case "adventurous":
      return "🏕️";
    default:
      return "✨";
  }
}

function getDifficultyColor(diff) {
  if (diff === "easy") return "rgba(167,243,208,0.95)";
  if (diff === "moderate") return "rgba(103,232,249,0.95)";
  return "rgba(96,165,250,0.95)";
}

export default function CreateGoingNow() {
  const navigate = useNavigate();

  const nowPlus30 = useMemo(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 30);
    return toLocalDatetimeValue(d);
  }, []);

  const nowPlus150 = useMemo(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 150);
    return toLocalDatetimeValue(d);
  }, []);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [locationText, setLocationText] = useState("");
  const [startsAt, setStartsAt] = useState(nowPlus30);
  const [expiresAt, setExpiresAt] = useState(nowPlus150);
  const [spotsTotal, setSpotsTotal] = useState(6);
  const [category, setCategory] = useState("chill");
  const [vibe, setVibe] = useState("social");
  const [difficulty, setDifficulty] = useState("easy");
  const [isPublic, setIsPublic] = useState(true);

  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState("");
  const [mediaType, setMediaType] = useState("");
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    return () => {
      if (mediaPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(mediaPreview);
      }
    };
  }, [mediaPreview]);

  const quickFill = (mode) => {
    const start = new Date();

    if (mode === "now") start.setMinutes(start.getMinutes() + 10);
    if (mode === "1h") start.setHours(start.getHours() + 1);
    if (mode === "tonight") {
      start.setHours(20, 0, 0, 0);
      if (start.getTime() < Date.now()) start.setDate(start.getDate() + 1);
    }
    if (mode === "tomorrow") {
      start.setDate(start.getDate() + 1);
      start.setHours(18, 0, 0, 0);
    }
    if (mode === "weekend") {
      const day = start.getDay();
      const daysUntilSaturday = (6 - day + 7) % 7 || 7;
      start.setDate(start.getDate() + daysUntilSaturday);
      start.setHours(11, 0, 0, 0);
    }

    const end = new Date(start);
    end.setHours(end.getHours() + 2);

    setStartsAt(toLocalDatetimeValue(start));
    setExpiresAt(toLocalDatetimeValue(end));
  };

  const canSubmit =
    title.trim().length >= 3 &&
    locationText.trim().length >= 2 &&
    startsAt &&
    expiresAt &&
    Number(spotsTotal) > 0 &&
    !saving &&
    !uploadingMedia;

  const handleMediaChange = (file) => {
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      setErrorMsg("Please upload an image or video.");
      return;
    }

    const maxImageSize = 8 * 1024 * 1024;
    const maxVideoSize = 45 * 1024 * 1024;

    if (isImage && file.size > maxImageSize) {
      setErrorMsg("Image must be smaller than 8MB.");
      return;
    }

    if (isVideo && file.size > maxVideoSize) {
      setErrorMsg("Video must be smaller than 45MB.");
      return;
    }

    if (mediaPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(mediaPreview);
    }

    setErrorMsg("");
    setMediaFile(file);
    setMediaType(isVideo ? "video" : "image");
    setMediaPreview(URL.createObjectURL(file));
  };

  const removeMedia = () => {
    if (mediaPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(mediaPreview);
    }
    setMediaFile(null);
    setMediaPreview("");
    setMediaType("");
  };

  const onFileInputChange = (e) => {
    const file = e.target.files?.[0];
    handleMediaChange(file);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    handleMediaChange(file);
  };

  const uploadGoingNowMedia = async (file, userId) => {
    if (!file) return { publicUrl: null, mediaKind: null };

    const isVideoFile = file.type.startsWith("video/");
    const ext = file.name.split(".").pop() || (isVideoFile ? "mp4" : "jpg");
    const fileName = `${userId}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("going-now-media")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: publicData } = supabase.storage
      .from("going-now-media")
      .getPublicUrl(fileName);

    return {
      publicUrl: publicData?.publicUrl || null,
      mediaKind: isVideoFile ? "video" : "image",
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!canSubmit) return;

    const startDate = new Date(startsAt);
    const endDate = new Date(expiresAt);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      setErrorMsg("Please enter valid dates.");
      return;
    }

    if (endDate <= startDate) {
      setErrorMsg("End time must be after start time.");
      return;
    }

    try {
      setSaving(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/login");
        return;
      }

      let uploadedMediaUrl = null;
      let uploadedMediaType = null;

      if (mediaFile) {
        setUploadingMedia(true);
        const uploadResult = await uploadGoingNowMedia(mediaFile, user.id);
        uploadedMediaUrl = uploadResult.publicUrl;
        uploadedMediaType = uploadResult.mediaKind;
        setUploadingMedia(false);
      }


  const { data, error } = await supabase
  .from("going_now")
  .insert({
    user_id: user.id,
    title,
    description,
   location_text: locationText,
starts_at: startsAt,
expires_at: expiresAt,
spots_total: spotsTotal,
    difficulty,
    vibe,
    status: "active",
    is_public: isPublic,
    category,
    media_url: uploadedMediaUrl,
    media_type: uploadedMediaType,
  })
  .select("id")
  .single();

if (error) {
  console.error("create going now error:", error);
  setErrorMsg(error.message || "Could not create plan.");
  return;
}

// creator auto join
await supabase.from("going_now_participants").insert({
  going_now_id: data.id,
  user_id: user.id,
  status: "joined",
  joined_at: new Date().toISOString(),
});

      if (error) {
        console.error("create going now error:", error);
        setErrorMsg(error.message || "Could not create plan.");
        return;
      }

      navigate(`/going-now/${data.id}`);
    } catch (err) {
      console.error(err);
      setErrorMsg(err?.message || "Something went wrong while creating the plan.");
    } finally {
      setSaving(false);
      setUploadingMedia(false);
    }
  };
  

  const progressScore = [
    title.trim().length >= 3,
    locationText.trim().length >= 2,
    startsAt,
    expiresAt,
    Number(spotsTotal) > 0,
    description.trim().length >= 10,
  ].filter(Boolean).length;

  const progressPercent = Math.round((progressScore / 6) * 100);

  return (
    <PageShell>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 14,
          flexWrap: "wrap",
        }}
      >
        <button onClick={() => navigate(-1)} style={backBtn}>
          ← Back
        </button>

        <div style={topMiniPill}>⚡ Create live plan</div>
      </div>

      <div style={shellStyle}>
        <div style={headerStyle}>
          <div style={heroGlowOne} />
          <div style={heroGlowTwo} />

          <div style={{ position: "relative" }}>
            <div style={eyebrowStyle}>⚡ Going now creator</div>

            <div style={heroTitle}>Create a plan people want to join instantly</div>

            <div style={heroSubtitle}>
              Make it fast, visual and clear. Add a cover image or video, set the vibe,
              drop the location, and publish a premium-looking live plan in seconds.
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                marginTop: 18,
              }}
            >
              <HeroMiniStat label="Visibility" value={isPublic ? "Public" : "Private"} />
              <HeroMiniStat label="Spots" value={spotsTotal || 0} />
              <HeroMiniStat label="Media" value={mediaType || "None"} />
              <HeroMiniStat label="Ready" value={`${progressPercent}%`} />
            </div>
          </div>
        </div>

        <div style={{ padding: 18 }}>
          <div style={{ ...glassCard, padding: 14, marginBottom: 16 }}>
            <SectionLabel>Quick start presets</SectionLabel>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button type="button" onClick={() => quickFill("now")} style={quickBtn}>
                Start now
              </button>
              <button type="button" onClick={() => quickFill("1h")} style={quickBtn}>
                In 1 hour
              </button>
              <button type="button" onClick={() => quickFill("tonight")} style={quickBtn}>
                Tonight
              </button>
              <button type="button" onClick={() => quickFill("tomorrow")} style={quickBtn}>
                Tomorrow
              </button>
              <button type="button" onClick={() => quickFill("weekend")} style={quickBtn}>
                Weekend
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="create-going-layout">
              <div className="create-main-column">
                <div style={{ ...glassCard, padding: 16, marginBottom: 16 }}>
                  <SectionLabel>Core details</SectionLabel>

                  <div style={{ display: "grid", gap: 16 }}>
                    <Field label="Plan title">
                      <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Sunset walk, coffee run, basketball, quick hike..."
                        style={inputStyle}
                      />
                    </Field>

                    <Field label="Location">
                      <input
                        value={locationText}
                        onChange={(e) => setLocationText(e.target.value)}
                        placeholder="Belgrade Waterfront, Ada, city center, Jastrebac..."
                        style={inputStyle}
                      />
                    </Field>

                    <Field label="Description">
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Short vibe, who should join, what the plan is, what to bring..."
                        rows={6}
                        style={{ ...inputStyle, resize: "vertical", minHeight: 132 }}
                      />
                    </Field>
                  </div>
                </div>

                <div style={{ ...glassCard, padding: 16, marginBottom: 16 }}>
                  <SectionLabel>Cover media</SectionLabel>

                  <div style={{ display: "grid", gap: 14 }}>
                    <label
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragOver(true);
                      }}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={onDrop}
                      style={{
                        ...uploadZone,
                        border: isDragOver
                          ? "1px solid rgba(103,232,249,0.48)"
                          : "1px solid rgba(125,211,252,0.14)",
                        background: isDragOver
                          ? "rgba(103,232,249,0.10)"
                          : "rgba(255,255,255,0.04)",
                        boxShadow: isDragOver
                          ? "0 0 0 4px rgba(103,232,249,0.10)"
                          : "none",
                      }}
                    >
                      <input
                        type="file"
                        accept="image/*,video/*"
                        onChange={onFileInputChange}
                        style={{ display: "none" }}
                      />

                      <div style={{ fontSize: 34, marginBottom: 10 }}>
                        {mediaType === "video" ? "🎬" : mediaType === "image" ? "🖼️" : "⬆️"}
                      </div>

                      <div style={uploadTitle}>
                        {mediaFile ? "Replace your cover media" : "Upload image or video"}
                      </div>

                      <div style={uploadSub}>
                        Drag & drop here or tap to browse. Images up to 8MB, videos up to 45MB.
                      </div>
                    </label>

                    {mediaPreview ? (
                      <div style={mediaPreviewShell}>
                        <div style={mediaPreviewTop}>
                          <div style={mediaBadge}>
                            {mediaType === "video" ? "🎬 Video cover" : "🖼️ Image cover"}
                          </div>

                          <button
                            type="button"
                            onClick={removeMedia}
                            style={removeMediaBtn}
                          >
                            Remove
                          </button>
                        </div>

                        <div style={previewFrame}>
                          {mediaType === "video" ? (
                            <video
                              src={mediaPreview}
                              controls
                              muted
                              playsInline
                              style={previewMediaStyle}
                            />
                          ) : (
                            <img
                              src={mediaPreview}
                              alt="Preview"
                              style={previewMediaStyle}
                            />
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div style={{ ...glassCard, padding: 16, marginBottom: 16 }}>
                  <SectionLabel>Timing</SectionLabel>

                  <div className="create-two-col">
                    <Field label="Starts at">
                      <input
                        type="datetime-local"
                        value={startsAt}
                        onChange={(e) => setStartsAt(e.target.value)}
                        style={inputStyle}
                      />
                    </Field>

                    <Field label="Ends at">
                      <input
                        type="datetime-local"
                        value={expiresAt}
                        onChange={(e) => setExpiresAt(e.target.value)}
                        style={inputStyle}
                      />
                    </Field>
                  </div>

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
                    <SmallInfoPill icon="🕒" text={`Starts: ${formatLocalPreview(startsAt)}`} />
                    <SmallInfoPill icon="⏳" text={`Ends: ${formatLocalPreview(expiresAt)}`} />
                  </div>
                </div>

                <div className="mobile-preview-card">
                  <PreviewCard
                    title={title}
                    locationText={locationText}
                    category={category}
                    vibe={vibe}
                    difficulty={difficulty}
                    spotsTotal={spotsTotal}
                    description={description}
                    isPublic={isPublic}
                    mediaPreview={mediaPreview}
                    mediaType={mediaType}
                    startsAt={startsAt}
                    expiresAt={expiresAt}
                  />
                </div>

                <div style={{ ...glassCard, padding: 16, marginBottom: 16 }}>
                  <SectionLabel>Visibility</SectionLabel>

                  <label style={toggleRowStyle}>
                    <div>
                      <div
                        style={{
                          fontWeight: 900,
                          color: "#f2fffd",
                          marginBottom: 4,
                        }}
                      >
                        Public plan
                      </div>

                      <div
                        style={{
                          color: "rgba(235,249,255,0.68)",
                          fontSize: 13,
                          lineHeight: 1.5,
                        }}
                      >
                        Let people nearby discover and join this live plan.
                      </div>
                    </div>

                    <div
                      style={{
                        width: 58,
                        height: 32,
                        borderRadius: 999,
                        background: isPublic
                          ? "linear-gradient(135deg, #a7f3d0, #67e8f9, #60a5fa)"
                          : "rgba(255,255,255,0.14)",
                        padding: 4,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: isPublic ? "flex-end" : "flex-start",
                        transition: "0.25s ease",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isPublic}
                        onChange={(e) => setIsPublic(e.target.checked)}
                        style={{ display: "none" }}
                      />
                      <span
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          background: "#fff",
                          display: "block",
                          boxShadow: "0 8px 18px rgba(0,0,0,0.20)",
                        }}
                      />
                    </div>
                  </label>
                </div>

                {errorMsg ? <div style={errorStyle}>{errorMsg}</div> : null}

                <div style={{ ...glassCard, padding: 16 }}>
                  <SectionLabel>Publish plan</SectionLabel>

                  <div style={progressWrap}>
                    <div style={progressTop}>
                      <span style={{ fontWeight: 900, color: "#effffd" }}>
                        Completion
                      </span>
                      <span style={{ fontWeight: 900, color: "#bffdf1" }}>
                        {progressPercent}%
                      </span>
                    </div>

                    <div style={progressBarBg}>
                      <div
                        style={{
                          ...progressBarFill,
                          width: `${progressPercent}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 12,
                      flexWrap: "wrap",
                      marginTop: 14,
                    }}
                  >
                    <button
                      type="submit"
                      disabled={!canSubmit}
                      style={{
                        ...primaryBtn,
                        background: canSubmit
                          ? "linear-gradient(135deg, #a7f3d0 0%, #67e8f9 50%, #60a5fa 100%)"
                          : "rgba(255,255,255,0.10)",
                        color: canSubmit ? "#06232c" : "rgba(255,255,255,0.58)",
                        cursor: canSubmit ? "pointer" : "not-allowed",
                        boxShadow: canSubmit
                          ? "0 18px 40px rgba(103,232,249,0.20)"
                          : "none",
                      }}
                    >
                      {saving
                        ? uploadingMedia
                          ? "Uploading media..."
                          : "Posting..."
                        : "Post live plan"}
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate("/going-now")}
                      style={ghostBtn}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>

              <div className="create-side-column">
                <div className="desktop-preview-card">
                  <PreviewCard
                    title={title}
                    locationText={locationText}
                    category={category}
                    vibe={vibe}
                    difficulty={difficulty}
                    spotsTotal={spotsTotal}
                    description={description}
                    isPublic={isPublic}
                    mediaPreview={mediaPreview}
                    mediaType={mediaType}
                    startsAt={startsAt}
                    expiresAt={expiresAt}
                  />
                </div>

                <div style={{ ...glassCard, padding: 16, marginTop: 16 }}>
                  <SectionLabel>Settings</SectionLabel>

                  <div style={{ display: "grid", gap: 14 }}>
                    <Field label="Category">
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        style={inputStyle}
                      >
                        {CATEGORY_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value} style={{ color: "#000" }}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Vibe">
                      <select
                        value={vibe}
                        onChange={(e) => setVibe(e.target.value)}
                        style={inputStyle}
                      >
                        {VIBE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value} style={{ color: "#000" }}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Difficulty">
                      <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value)}
                        style={inputStyle}
                      >
                        {DIFFICULTY_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value} style={{ color: "#000" }}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Spots">
                      <input
                        type="number"
                        min="1"
                        max="99"
                        value={spotsTotal}
                        onChange={(e) => setSpotsTotal(e.target.value)}
                        style={inputStyle}
                      />
                    </Field>
                  </div>

                  <div style={sideTipsWrap}>
                    <div style={sideTipCard}>
                      <div style={sideTipTitle}>Best titles</div>
                      <div style={sideTipText}>
                        Keep it fast and specific: “Sunset coffee at Hisar” is better than
                        “Hangout”.
                      </div>
                    </div>

                    <div style={sideTipCard}>
                      <div style={sideTipTitle}>Best media</div>
                      <div style={sideTipText}>
                        A real location photo or a short vertical video will massively boost taps.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        .create-going-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.08fr) minmax(320px, 0.92fr);
          gap: 16px;
          align-items: start;
        }

        .create-main-column,
        .create-side-column {
          min-width: 0;
        }

        .create-two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .mobile-preview-card {
          display: none;
        }

        .desktop-preview-card {
          display: block;
        }

        @media (max-width: 980px) {
          .create-going-layout {
            grid-template-columns: 1fr;
          }

          .mobile-preview-card {
            display: block;
            margin-bottom: 16px;
          }

          .desktop-preview-card {
            display: none;
          }
        }

        @media (max-width: 700px) {
          .create-two-col {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </PageShell>
  );
}

function PreviewCard({
  title,
  locationText,
  category,
  vibe,
  difficulty,
  spotsTotal,
  description,
  isPublic,
  mediaPreview,
  mediaType,
  startsAt,
  expiresAt,
}) {
  const hasMedia = Boolean(mediaPreview);

  return (
    <div
      style={{
        ...glassCard,
        padding: 16,
        position: "sticky",
        top: 18,
        overflow: "hidden",
      }}
    >
      <div style={heroGlowOne} />
      <div style={heroGlowTwo} />

      <div style={{ position: "relative" }}>
        <SectionLabel>Live preview</SectionLabel>

        <div
          style={{
            borderRadius: 26,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.08)",
            background:
              "linear-gradient(160deg, rgba(10,18,20,0.92), rgba(8,16,20,0.98))",
            boxShadow:
              "0 18px 48px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          <div
            style={{
              position: "relative",
              minHeight: 290,
              background: hasMedia
                ? "#071319"
                : "radial-gradient(circle at 78% 20%, rgba(103,232,249,0.24), transparent 20%), radial-gradient(circle at 24% 28%, rgba(167,243,208,0.18), transparent 18%), linear-gradient(to bottom, rgba(10,25,31,0.74), rgba(5,12,16,0.96))",
            }}
          >
            {hasMedia ? (
              <>
                {mediaType === "video" ? (
                  <video
                    src={mediaPreview}
                    muted
                    playsInline
                    style={{
                      width: "100%",
                      height: 290,
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                ) : (
                  <img
                    src={mediaPreview}
                    alt="Plan cover"
                    style={{
                      width: "100%",
                      height: 290,
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                )}

                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(to top, rgba(3,10,14,0.90) 8%, rgba(3,10,14,0.42) 42%, rgba(3,10,14,0.08) 100%)",
                  }}
                />
              </>
            ) : null}

            <div
              style={{
                position: hasMedia ? "absolute" : "relative",
                inset: 0,
                padding: 16,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                zIndex: 2,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "9px 13px",
                    borderRadius: 999,
                    background:
                      "linear-gradient(135deg, #a7f3d0 0%, #67e8f9 50%, #60a5fa 100%)",
                    color: "#06252e",
                    fontWeight: 950,
                    fontSize: 11,
                    letterSpacing: "0.03em",
                    boxShadow: "0 14px 34px rgba(103,232,249,0.22)",
                  }}
                >
                  🔥 Going now
                </div>

                <div style={statusPreviewPill}>Preview</div>
              </div>

              <div>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                    marginBottom: 10,
                  }}
                >
                  <span style={chipStyle}>
                    {getCategoryEmoji(category)} {category}
                  </span>
                  <span style={chipStyle}>
                    {getVibeEmoji(vibe)} {vibe}
                  </span>
                  <span style={chipStyle}>
                    🎯 {difficulty}
                  </span>
                </div>

                <div
                  style={{
                    fontSize: 30,
                    lineHeight: 0.98,
                    fontWeight: 950,
                    letterSpacing: "-0.05em",
                    color: "#fff",
                    marginBottom: 10,
                    textShadow: "0 12px 28px rgba(0,0,0,0.36)",
                  }}
                >
                  {title.trim() || "Untitled plan"}
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  <div style={metaPill}>📍 {locationText.trim() || "No location yet"}</div>
                  <div style={metaPill}>👥 {spotsTotal || 0} spots</div>
                  <div style={metaPill}>🌍 {isPublic ? "Public" : "Private"}</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ padding: 16 }}>
            <div
              style={{
                color: "rgba(238,250,245,0.86)",
                lineHeight: 1.65,
                fontWeight: 600,
                marginBottom: 14,
                fontSize: 14.5,
              }}
            >
              {(description || "No description yet. Add a short vibe and who should join.")
                .slice(0, 150)}
              {(description || "").length > 150 ? "..." : ""}
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
              <div style={smallStat}>🕒 {formatLocalPreview(startsAt)}</div>
              <div style={smallStat}>⏳ {formatLocalPreview(expiresAt)}</div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <div style={smallStat}>⚡ {category}</div>
              <div style={smallStat}>✨ {vibe}</div>
              <div
                style={{
                  ...smallStat,
                  color: "#06252e",
                  background: getDifficultyColor(difficulty),
                  border: "none",
                }}
              >
                🎯 {difficulty}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PageShell({ children }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        marginTop: -120,
        background:
          "radial-gradient(circle at top, rgba(103,232,249,0.16), transparent 18%), radial-gradient(circle at 82% 16%, rgba(167,243,208,0.15), transparent 18%), radial-gradient(circle at 18% 72%, rgba(96,165,250,0.12), transparent 20%), linear-gradient(180deg, #031019 0%, #081b28 40%, #0b2330 100%)",
        color: "#fff",
        padding: "16px 12px 108px",
      }}
    >
      <div style={{ maxWidth: 1160, margin: "0 auto" }}>{children}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div style={miniLabel}>{label}</div>
      {children}
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div
      style={{
        fontSize: 12,
        fontWeight: 800,
        textTransform: "uppercase",
        letterSpacing: "0.12em",
        color: "rgba(225,247,255,0.58)",
        marginBottom: 12,
      }}
    >
      {children}
    </div>
  );
}

function HeroMiniStat({ label, value }) {
  return (
    <div
      style={{
        borderRadius: 18,
        padding: "12px 14px",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(125,211,252,0.12)",
        minWidth: 104,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: "0.10em",
          color: "rgba(225,247,255,0.56)",
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 22,
          lineHeight: 1,
          fontWeight: 950,
          letterSpacing: "-0.04em",
          color: "#f2fffd",
          textTransform: "capitalize",
        }}
      >
        {String(value)}
      </div>
    </div>
  );
}

function SmallInfoPill({ icon, text }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        borderRadius: 999,
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(125,211,252,0.12)",
        color: "#ecfaf6",
        fontWeight: 800,
        fontSize: 13,
      }}
    >
      <span>{icon}</span>
      <span>{text}</span>
    </div>
  );
}

const glassPanel = {
  borderRadius: 30,
  overflow: "hidden",
  border: "1px solid rgba(255,255,255,0.10)",
  background:
    "linear-gradient(160deg, rgba(10,18,20,0.92), rgba(8,16,20,0.98))",
  boxShadow:
    "0 26px 90px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.06)",
};

const glassCard = {
  borderRadius: 24,
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.045))",
  border: "1px solid rgba(157,229,219,0.14)",
  boxShadow:
    "0 20px 55px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.08)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
};

const shellStyle = glassPanel;

const headerStyle = {
  position: "relative",
  padding: "24px 18px 18px",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  overflow: "hidden",
};

const heroGlowOne = {
  position: "absolute",
  top: -90,
  right: -80,
  width: 220,
  height: 220,
  borderRadius: "50%",
  background: "radial-gradient(circle, rgba(103,232,249,0.18), transparent 68%)",
  pointerEvents: "none",
};

const heroGlowTwo = {
  position: "absolute",
  bottom: -90,
  left: -80,
  width: 220,
  height: 220,
  borderRadius: "50%",
  background: "radial-gradient(circle, rgba(167,243,208,0.14), transparent 68%)",
  pointerEvents: "none",
};

const eyebrowStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 12px",
  borderRadius: 999,
  background:
    "linear-gradient(135deg, rgba(167,243,208,0.18), rgba(103,232,249,0.18))",
  border: "1px solid rgba(103,232,249,0.14)",
  color: "#dffeff",
  fontWeight: 900,
  fontSize: 11,
  marginBottom: 12,
  letterSpacing: "0.03em",
};

const heroTitle = {
  fontSize: "clamp(34px, 6vw, 58px)",
  lineHeight: 0.94,
  fontWeight: 950,
  letterSpacing: "-0.05em",
  marginBottom: 12,
};

const heroSubtitle = {
  color: "rgba(235,249,255,0.74)",
  fontWeight: 600,
  lineHeight: 1.65,
  maxWidth: 800,
  fontSize: 15.5,
};

const inputStyle = {
  width: "100%",
  borderRadius: 18,
  border: "1px solid rgba(125,211,252,0.14)",
  background: "rgba(255,255,255,0.06)",
  color: "#fff",
  padding: "14px 14px",
  outline: "none",
  fontSize: 15,
  boxSizing: "border-box",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
};

const quickBtn = {
  border: "1px solid rgba(125,211,252,0.14)",
  background: "rgba(255,255,255,0.06)",
  color: "#effffd",
  borderRadius: 999,
  padding: "10px 14px",
  cursor: "pointer",
  fontWeight: 850,
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
};

const chipStyle = {
  display: "inline-flex",
  alignItems: "center",
  padding: "7px 10px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#ecfaf6",
  fontSize: 12,
  fontWeight: 800,
  textTransform: "capitalize",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
};

const metaPill = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 11px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#ffffff",
  fontWeight: 800,
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
};

const smallStat = {
  display: "inline-flex",
  alignItems: "center",
  padding: "8px 11px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(125,211,252,0.12)",
  color: "#eafbf5",
  fontWeight: 800,
};

const miniLabel = {
  fontSize: 12,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.10em",
  color: "rgba(225,247,255,0.58)",
  marginBottom: 8,
};

const primaryBtn = {
  border: "none",
  borderRadius: 18,
  padding: "15px 22px",
  fontWeight: 950,
  fontSize: 15,
  width: "100%",
  maxWidth: 280,
};

const ghostBtn = {
  border: "1px solid rgba(125,211,252,0.14)",
  borderRadius: 18,
  padding: "15px 22px",
  background: "rgba(255,255,255,0.06)",
  color: "#effffd",
  fontWeight: 900,
  fontSize: 15,
  cursor: "pointer",
};

const backBtn = {
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.05)",
  color: "#fff",
  borderRadius: 999,
  padding: "11px 15px",
  cursor: "pointer",
  fontWeight: 900,
  backdropFilter: "blur(10px)",
  boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
};

const topMiniPill = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 14px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.12)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  fontWeight: 850,
  color: "#effffd",
};

const errorStyle = {
  marginBottom: 16,
  color: "#ffb4b4",
  background: "rgba(255,80,80,0.08)",
  border: "1px solid rgba(255,80,80,0.22)",
  padding: 12,
  borderRadius: 14,
  fontWeight: 700,
};

const toggleRowStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  padding: "14px 16px",
  borderRadius: 18,
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(125,211,252,0.12)",
  cursor: "pointer",
};

const statusPreviewPill = {
  display: "inline-flex",
  alignItems: "center",
  padding: "8px 12px",
  borderRadius: 999,
  background:
    "linear-gradient(135deg, rgba(167,243,208,0.94), rgba(103,232,249,0.94), rgba(96,165,250,0.94))",
  border: "1px solid rgba(103,232,249,0.16)",
  color: "#06252e",
  fontWeight: 900,
  fontSize: 11,
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
};

const uploadZone = {
  borderRadius: 22,
  minHeight: 180,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  textAlign: "center",
  padding: 22,
  cursor: "pointer",
  transition: "0.2s ease",
};

const uploadTitle = {
  fontSize: 19,
  fontWeight: 950,
  color: "#f4ffff",
  marginBottom: 6,
  letterSpacing: "-0.03em",
};

const uploadSub = {
  color: "rgba(235,249,255,0.66)",
  lineHeight: 1.6,
  maxWidth: 420,
  fontWeight: 600,
  fontSize: 14,
};

const mediaPreviewShell = {
  borderRadius: 22,
  border: "1px solid rgba(125,211,252,0.14)",
  background: "rgba(255,255,255,0.04)",
  padding: 12,
};

const mediaPreviewTop = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  marginBottom: 12,
  flexWrap: "wrap",
};

const mediaBadge = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 12px",
  borderRadius: 999,
  background:
    "linear-gradient(135deg, rgba(167,243,208,0.18), rgba(103,232,249,0.18))",
  border: "1px solid rgba(103,232,249,0.14)",
  color: "#dffeff",
  fontWeight: 900,
  fontSize: 12,
};

const removeMediaBtn = {
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.06)",
  color: "#fff",
  borderRadius: 999,
  padding: "9px 12px",
  cursor: "pointer",
  fontWeight: 900,
};

const previewFrame = {
  borderRadius: 18,
  overflow: "hidden",
  background: "#07131a",
  border: "1px solid rgba(255,255,255,0.08)",
};

const previewMediaStyle = {
  width: "100%",
  maxHeight: 360,
  objectFit: "cover",
  display: "block",
};

const progressWrap = {
  borderRadius: 18,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(125,211,252,0.12)",
  padding: 14,
};

const progressTop = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 10,
};

const progressBarBg = {
  width: "100%",
  height: 10,
  borderRadius: 999,
  background: "rgba(255,255,255,0.08)",
  overflow: "hidden",
};

const progressBarFill = {
  height: "100%",
  borderRadius: 999,
  background: "linear-gradient(135deg, #a7f3d0 0%, #67e8f9 50%, #60a5fa 100%)",
  transition: "width 0.25s ease",
};

const sideTipsWrap = {
  display: "grid",
  gap: 12,
  marginTop: 16,
};

const sideTipCard = {
  borderRadius: 18,
  padding: 14,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(125,211,252,0.10)",
};

const sideTipTitle = {
  fontWeight: 900,
  color: "#f2fffd",
  marginBottom: 6,
};

const sideTipText = {
  color: "rgba(235,249,255,0.68)",
  lineHeight: 1.55,
  fontWeight: 600,
  fontSize: 13.5,
};