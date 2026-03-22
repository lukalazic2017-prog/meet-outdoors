
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";

const FALLBACK_IMAGE =
  "https://images.pexels.com/photos/1761279/pexels-photo-1761279.jpeg";

const CATEGORY_OPTIONS = [
  "outdoor",
  "chill",
  "night",
  "sport",
  "trip",
  "activity",
];
const VIBE_OPTIONS = ["chill", "social", "active", "party", "adventurous"];
const DIFFICULTY_OPTIONS = ["easy", "moderate", "hard"];
const STATUS_OPTIONS = ["active", "full", "ended", "cancelled"];
const MEDIA_BUCKET = "going-now-media";

function toLocalInputValue(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function formatDateTime(value) {
  if (!value) return "Not set";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Not set";
  return d.toLocaleString([], {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getCategoryEmoji(category) {
  switch ((category || "").toLowerCase()) {
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
  switch ((vibe || "").toLowerCase()) {
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

function getDifficultyEmoji(difficulty) {
  switch ((difficulty || "").toLowerCase()) {
    case "easy":
      return "🟢";
    case "moderate":
      return "🟠";
    case "hard":
      return "🔴";
    default:
      return "🧭";
  }
}

function isValidDateRange(startsAt, expiresAt) {
  if (!startsAt || !expiresAt) return true;
  const start = new Date(startsAt).getTime();
  const end = new Date(expiresAt).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return true;
  return end > start;
}

function parseMaybeNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const normalized = String(value).replace(",", ".").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function getResolvedLocationText(meetingPoint, city, country, fallbackText = "") {
  const parts = [meetingPoint, city, country]
    .map((item) => (item || "").trim())
    .filter(Boolean);
  return parts.length ? parts.join(", ") : (fallbackText || "").trim();
}

function inferLocationParts(locationText = "") {
  const parts = String(locationText)
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length >= 3) {
    return {
      meetingPoint: parts[0],
      city: parts[1],
      country: parts.slice(2).join(", "),
    };
  }

  if (parts.length === 2) {
    return {
      meetingPoint: "",
      city: parts[0],
      country: parts[1],
    };
  }

  return {
    meetingPoint: "",
    city: parts[0] || "",
    country: "",
  };
}

function statusTone(status) {
  switch ((status || "").toLowerCase()) {
    case "active":
      return {
        bg: "rgba(52,211,153,0.16)",
        border: "rgba(52,211,153,0.28)",
        color: "#b7ffe3",
      };
    case "full":
      return {
        bg: "rgba(255,190,90,0.14)",
        border: "rgba(255,190,90,0.26)",
        color: "#ffe4b5",
      };
    case "ended":
      return {
        bg: "rgba(148,163,184,0.16)",
        border: "rgba(148,163,184,0.26)",
        color: "#e2e8f0",
      };
    case "cancelled":
      return {
        bg: "rgba(255,120,120,0.14)",
        border: "rgba(255,120,120,0.26)",
        color: "#ffd6d6",
      };
    default:
      return {
        bg: "rgba(255,255,255,0.08)",
        border: "rgba(255,255,255,0.14)",
        color: "#f8fffd",
      };
  }
}

async function geocodeLocation(query) {
  const trimmed = String(query || "").trim();
  if (!trimmed) return null;

  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(
    trimmed
  )}`;

  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("Geocoding failed");

  const data = await res.json();
  const first = data?.[0];
  if (!first) return null;

  return {
    latitude: parseMaybeNumber(first.lat),
    longitude: parseMaybeNumber(first.lon),
    label: first.display_name || trimmed,
  };
}

async function uploadMediaFile(file, userId) {
  if (!file) return null;

  const ext = file.name?.split(".").pop() || "bin";
  const safeExt = ext.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  const path = `${userId}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${safeExt}`;

  const { error: uploadError } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  return data?.publicUrl || null;
}

function Section({ title, subtitle, children, action }) {
  return (
    <section style={styles.section}>
      <div style={styles.sectionHead}>
        <div>
          <div style={styles.sectionTitle}>{title}</div>
          {subtitle ? <div style={styles.sectionSubtitle}>{subtitle}</div> : null}
        </div>
        {action ? <div>{action}</div> : null}
      </div>
      {children}
    </section>
  );
}

function OptionRail({ options, value, onChange, renderLabel }) {
  return (
    <div style={styles.rail}>
      {options.map((option) => {
        const active = option === value;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            style={styles.railBtn(active)}
          >
            {renderLabel(option)}
          </button>
        );
      })}
    </div>
  );
}

export default function EditGoingNow() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [detectingCoords, setDetectingCoords] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [userId, setUserId] = useState("");
  const [participantsCount, setParticipantsCount] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showAdvancedCoords, setShowAdvancedCoords] = useState(false);
  const [showExtra, setShowExtra] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [meetingPoint, setMeetingPoint] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [locationText, setLocationText] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  

  const [category, setCategory] = useState("chill");
  const [vibe, setVibe] = useState("social");
  const [difficulty, setDifficulty] = useState("easy");
  const [spotsTotal, setSpotsTotal] = useState(6);
  const [startsAt, setStartsAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [status, setStatus] = useState("active");

  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState("image");
  const [mediaFile, setMediaFile] = useState(null);
  const [replaceHero, setReplaceHero] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadPage() {
      setLoading(true);
      setErrorMsg("");
      setSuccessMsg("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) return;

      if (!user) {
        navigate("/login");
        return;
      }

      setUserId(user.id);

      const { data, error } = await supabase
        .from("going_now")
        .select("*")
        .eq("id", id)
        .single();

      if (!mounted) return;

      if (error) {
        setErrorMsg(error.message || "Could not load live plan.");
        setLoading(false);
        return;
      }

      if (!data) {
        setErrorMsg("Live plan not found.");
        setLoading(false);
        return;
      }

      if (data.user_id !== user.id) {
        setErrorMsg("You can only edit your own live plan.");
        setLoading(false);
        return;
      }

      const inferred = inferLocationParts(data.location_text || "");

      setTitle(data.title || "");
      setDescription(data.description || "");
      setMeetingPoint(inferred.meetingPoint);
      setCity(inferred.city);
      setCountry(inferred.country);
      setLocationText(data.location_text || "");
      setLatitude(data.latitude ?? "");
      setLongitude(data.longitude ?? "");
      setResolvedLocation(data.location_text || "");
      setCategory(data.category || "chill");
      setVibe(data.vibe || "social");
      setDifficulty(data.difficulty || "easy");
      setSpotsTotal(data.spots_total || 6);
      setStartsAt(toLocalInputValue(data.starts_at));
      setExpiresAt(toLocalInputValue(data.expires_at));
      setStatus(data.status || "active");
      setMediaUrl(data.media_url || "");
      setMediaType(data.media_type || "image");
      setMediaFile(null);
      setReplaceHero(false);
      setHasUnsavedChanges(false);

      const { count } = await supabase
        .from("going_now_participants")
        .select("*", { count: "exact", head: true })
        .eq("going_now_id", id)
        .eq("status", "joined");

      setParticipantsCount(count || 0);
      setLoading(false);
    }

    loadPage();
    return () => {
      mounted = false;
    };
  }, [id, navigate]);

  useEffect(() => {
    setLocationText(getResolvedLocationText(meetingPoint, city, country));
  }, [meetingPoint, city, country]);

  useEffect(() => {
    if (!loading) setHasUnsavedChanges(true);
  }, [
    title,
    description,
    meetingPoint,
    city,
    country,
    latitude,
    longitude,
    category,
    vibe,
    difficulty,
    spotsTotal,
    startsAt,
    expiresAt,
    status,
    mediaUrl,
    mediaType,
    replaceHero,
    mediaFile,
    loading,
  ]);

  const titleCount = useMemo(() => title.trim().length, [title]);
  const descCount = useMemo(() => description.trim().length, [description]);
  const validDateRange = useMemo(
    () => isValidDateRange(startsAt, expiresAt),
    [startsAt, expiresAt]
  );
  const spotsNumber = useMemo(() => {
    const parsed = Number(spotsTotal);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [spotsTotal]);
  const resolvedText = useMemo(
    () => getResolvedLocationText(meetingPoint, city, country, locationText),
    [meetingPoint, city, country, locationText]
  );
  const latNum = useMemo(() => parseMaybeNumber(latitude), [latitude]);
  const lngNum = useMemo(() => parseMaybeNumber(longitude), [longitude]);
  const hasCoords = latNum !== null && lngNum !== null;
  const canSave = useMemo(() => {
    return (
      !!title.trim() &&
      !!resolvedText.trim() &&
      validDateRange &&
      !saving &&
      !uploadingMedia &&
      spotsNumber >= Math.max(1, participantsCount)
    );
  }, [
    title,
    resolvedText,
    validDateRange,
    saving,
    uploadingMedia,
    spotsNumber,
    participantsCount,
  ]);

  const heroSrc = useMemo(() => {
    if (mediaFile) return URL.createObjectURL(mediaFile);
    return mediaUrl || FALLBACK_IMAGE;
  }, [mediaFile, mediaUrl]);

  useEffect(() => {
    return () => {
      if (mediaFile && heroSrc?.startsWith("blob:")) URL.revokeObjectURL(heroSrc);
    };
  }, [mediaFile, heroSrc]);

  const statusColors = statusTone(status);
  const mapEmbedUrl = hasCoords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${lngNum - 0.015}%2C${latNum - 0.015}%2C${lngNum + 0.015}%2C${latNum + 0.015}&layer=mapnik&marker=${latNum}%2C${lngNum}`
    : null;
  const directionsUrl = hasCoords
    ? `https://www.google.com/maps?q=${latNum},${lngNum}`
    : resolvedText
    ? `https://www.google.com/maps/search/${encodeURIComponent(resolvedText)}`
    : null;

  const applyStatus = async (nextStatus) => {
    try {
      setSaving(true);
      setErrorMsg("");
      setSuccessMsg("");

      const { error } = await supabase
        .from("going_now")
        .update({ status: nextStatus })
        .eq("id", id)
        .eq("user_id", userId);

      if (error) {
        setErrorMsg(error.message || "Could not update status.");
        return;
      }

      setStatus(nextStatus);
      setSuccessMsg(`Status updated to ${nextStatus}.`);
      setHasUnsavedChanges(false);
    } catch (err) {
      setErrorMsg(err?.message || "Could not update status.");
    } finally {
      setSaving(false);
    }
  };

  const handleDetectCoordinates = async () => {
    if (!resolvedText.trim()) {
      setErrorMsg("Add meeting point, city, or country first.");
      return;
    }

    try {
      setDetectingCoords(true);
      setErrorMsg("");
      setSuccessMsg("");

      const result = await geocodeLocation(resolvedText);
      if (!result) {
        setErrorMsg("Could not detect coordinates for that location.");
        return;
      }

      setLatitude(String(result.latitude ?? ""));
      setLongitude(String(result.longitude ?? ""));
      setResolvedLocation(result.label || resolvedText);
      setSuccessMsg("Coordinates detected successfully.");
    } catch (err) {
      setErrorMsg("Could not detect coordinates.");
    } finally {
      setDetectingCoords(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      setErrorMsg("Title is required.");
      return;
    }
    if (!resolvedText.trim()) {
      setErrorMsg("Location is required.");
      return;
    }
    if (!validDateRange) {
      setErrorMsg("End time must be later than start time.");
      return;
    }
    if (spotsNumber < Math.max(1, participantsCount)) {
      setErrorMsg(`You already have ${participantsCount} joined participants.`);
      return;
    }

    try {
      setSaving(true);
      setUploadingMedia(false);
      setErrorMsg("");
      setSuccessMsg("");

      let finalMediaUrl = mediaUrl.trim() || null;
      let finalMediaType = mediaType || null;

      if (mediaFile && replaceHero) {
        setUploadingMedia(true);
        finalMediaUrl = await uploadMediaFile(mediaFile, userId);
        finalMediaType = mediaFile.type.startsWith("video/") ? "video" : "image";
      }

      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        location_text: resolvedText.trim() || null,
        category: category || null,
        vibe: vibe || null,
        difficulty: difficulty || null,
        spots_total: spotsNumber ? Number(spotsNumber) : null,
        starts_at: startsAt ? new Date(startsAt).toISOString() : null,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        status: status || "active",
        latitude: latNum,
        longitude: lngNum,
        media_url: finalMediaUrl,
        media_type: finalMediaType,
      };

      const { error } = await supabase
        .from("going_now")
        .update(payload)
        .eq("id", id)
        .eq("user_id", userId);

      if (error) {
        setErrorMsg(error.message || "Could not save changes.");
        return;
      }

      setSuccessMsg("Changes saved.");
      setHasUnsavedChanges(false);
      navigate(`/going-now/${id}`);
    } catch (err) {
      setErrorMsg(err?.message || "Could not save changes.");
    } finally {
      setSaving(false);
      setUploadingMedia(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm("Are you sure you want to delete this live plan?");
    if (!confirmed) return;

    try {
      setDeleting(true);
      setErrorMsg("");
      setSuccessMsg("");

      const { error } = await supabase
        .from("going_now")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      if (error) {
        setErrorMsg(error.message || "Could not delete live plan.");
        return;
      }

      navigate("/going-now");
    } catch (err) {
      setErrorMsg(err?.message || "Could not delete live plan.");
    } finally {
      setDeleting(false);
    }
  };

  const handleDuplicate = async () => {
    try {
      setDuplicating(true);
      setErrorMsg("");
      setSuccessMsg("");

      const duplicatePayload = {
        user_id: userId,
        title: `${title.trim() || "Live plan"} copy`,
        description: description.trim() || null,
        location_text: resolvedText.trim() || null,
        category: category || null,
        vibe: vibe || null,
        difficulty: difficulty || null,
        spots_total: spotsNumber ? Number(spotsNumber) : null,
        starts_at: startsAt ? new Date(startsAt).toISOString() : null,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        status: "active",
        latitude: latNum,
        longitude: lngNum,
        media_url: mediaUrl.trim() || null,
        media_type: mediaType || null,
      };

      const { data, error } = await supabase
        .from("going_now")
        .insert(duplicatePayload)
        .select("id")
        .single();

      if (error) {
        setErrorMsg(error.message || "Could not duplicate live plan.");
        return;
      }

      navigate(`/going-now/${data.id}/edit`);
    } catch (err) {
      setErrorMsg(err?.message || "Could not duplicate live plan.");
    } finally {
      setDuplicating(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.loadingCard}>Loading editor...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.bgGlow1} />
      <div style={styles.bgGlow2} />

      {showPreviewModal ? (
        <div style={styles.overlay} onClick={() => setShowPreviewModal(false)}>
          <div style={styles.sheet} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setShowPreviewModal(false)}
              style={styles.closeBtn}
            >
              ×
            </button>
            <div style={styles.modalTitle}>Live preview</div>
            <div style={styles.previewCardBig}>
              <div style={styles.previewTop}>
                <span style={styles.previewBadge}>⚡ Going now</span>
                <span style={styles.previewStatus}>{status}</span>
              </div>
              <div style={styles.previewTitle}>{title.trim() || "Your live plan title"}</div>
              <div style={styles.previewMeta}>📍 {resolvedText || "Add a location"}</div>
              <div style={styles.previewMeta}>👥 {spotsNumber || "—"} spots • {participantsCount} joined</div>
              <div style={styles.previewMeta}>🕒 {formatDateTime(startsAt)}</div>
              <div style={styles.previewMeta}>{hasCoords ? "🗺️ Map ready" : "🗺️ Add coordinates"}</div>
              <div style={styles.previewTagsWrap}>
                <span style={styles.previewTag}>{getCategoryEmoji(category)} {category}</span>
                <span style={styles.previewTag}>{getVibeEmoji(vibe)} {vibe}</span>
                <span style={styles.previewTag}>{getDifficultyEmoji(difficulty)} {difficulty}</span>
              </div>
              <div style={styles.previewDesc}>
                {description.trim() || "Your description preview will appear here."}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div style={styles.container}>
        <div style={styles.topBar}>
          <button type="button" onClick={() => navigate(-1)} style={styles.topBtn}>
            ← Back
          </button>

          <div style={styles.topActions}>
            <button
              type="button"
              onClick={() => navigate(`/going-now/${id}`)}
              style={styles.ghostBtn}
            >
              View
            </button>
            <button
              type="button"
              onClick={handleDuplicate}
              disabled={duplicating}
              style={styles.ghostBtn}
            >
              {duplicating ? "Duplicating..." : "Duplicate"}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              style={styles.deleteBtn}
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>

        <div style={styles.hero}>
          <div style={styles.heroMediaWrap}>
            {mediaType === "video" ? (
              <video src={heroSrc} style={styles.heroMedia} muted playsInline autoPlay loop />
            ) : (
              <img src={heroSrc} alt="Edit going now" style={styles.heroMedia} />
            )}
            <div style={styles.heroOverlay} />

            <div style={styles.heroTopRow}>
              <div style={styles.heroBadge}>✏️ Edit live plan</div>
              <div
                style={{
                  ...styles.statusPill,
                  background: statusColors.bg,
                  border: `1px solid ${statusColors.border}`,
                  color: statusColors.color,
                }}
              >
                {status}
              </div>
            </div>

            <div style={styles.heroBottom}>
              <div style={styles.heroChips}>
                <span style={styles.heroChip}>{getCategoryEmoji(category)} {category}</span>
                <span style={styles.heroChip}>{getVibeEmoji(vibe)} {vibe}</span>
                <span style={styles.heroChip}>{getDifficultyEmoji(difficulty)} {difficulty}</span>
                {hasUnsavedChanges ? <span style={styles.heroChip}>● Unsaved</span> : null}
              </div>

              <h1 style={styles.heroTitle}>{title.trim() || "Your live plan title"}</h1>
              <div style={styles.heroSubtitle}>
                {resolvedText || "Add a location"} • {spotsNumber ? `${spotsNumber} spots` : "Flexible spots"} • {formatDateTime(startsAt)}
              </div>
            </div>
          </div>

          <div style={styles.previewMini}>
            <div>
              <div style={styles.previewMiniLabel}>Preview</div>
              <div style={styles.previewMiniTitle}>{title.trim() || "Your live plan title"}</div>
              <div style={styles.previewMiniText}>{resolvedText || "Add a location"} • {status}</div>
            </div>
            <button
              type="button"
              onClick={() => setShowPreviewModal(true)}
              style={styles.previewBtn}
            >
              Open preview
            </button>
          </div>

          <form onSubmit={handleSave} style={styles.form}>
            <Section title="Quick essentials" subtitle="The first things people notice.">
              <div style={styles.stack}>
                <div style={styles.field}>
                  <label style={styles.label}>Title</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="What are you doing right now?"
                    style={styles.input}
                    maxLength={90}
                  />
                  <div style={styles.helperRow}>
                    <span style={styles.helper}>Make it short, clear, and catchy.</span>
                    <span style={styles.counter}>{titleCount}/90</span>
                  </div>
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the vibe, plan, or meetup details..."
                    rows={6}
                    style={styles.textarea}
                    maxLength={500}
                  />
                  <div style={styles.helperRow}>
                    <span style={styles.helper}>Tell people why they should join.</span>
                    <span style={styles.counter}>{descCount}/500</span>
                  </div>
                </div>
              </div>
            </Section>

            <Section
              title="Location"
              subtitle="Make the meeting point clear and map-ready."
              action={
                <button
                  type="button"
                  onClick={handleDetectCoordinates}
                  disabled={detectingCoords}
                  style={styles.secondaryBtn}
                >
                  {detectingCoords ? "Detecting..." : "Detect coordinates"}
                </button>
              }
            >
              <div style={styles.stack}>
                <div style={styles.field}>
                  <label style={styles.label}>Meeting point</label>
                  <input
                    value={meetingPoint}
                    onChange={(e) => setMeetingPoint(e.target.value)}
                    placeholder="Park, café, gym, trail entrance..."
                    style={styles.input}
                  />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>City</label>
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Niš"
                    style={styles.input}
                  />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Country</label>
                  <input
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="Serbia"
                    style={styles.input}
                  />
                </div>

                <div style={styles.resolvedCard}>
                  <div style={styles.resolvedTitle}>Resolved location</div>
                  <div style={styles.resolvedText}>{resolvedText || "Add meeting point, city, or country."}</div>
                  {directionsUrl ? (
                    <a href={directionsUrl} target="_blank" rel="noreferrer" style={styles.inlineLinkBtn}>
                      Open in Maps
                    </a>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => setShowAdvancedCoords((v) => !v)}
                  style={styles.secondaryBtn}
                >
                  {showAdvancedCoords ? "Hide advanced coordinates" : "Advanced coordinates"}
                </button>

                {showAdvancedCoords ? (
                  <div style={styles.stack}>
                    <div style={styles.field}>
                      <label style={styles.label}>Latitude</label>
                      <input
                        value={latitude}
                        onChange={(e) => setLatitude(e.target.value)}
                        placeholder="43.3209"
                        style={styles.input}
                      />
                    </div>
                    <div style={styles.field}>
                      <label style={styles.label}>Longitude</label>
                      <input
                        value={longitude}
                        onChange={(e) => setLongitude(e.target.value)}
                        placeholder="21.8958"
                        style={styles.input}
                      />
                    </div>
                  </div>
                ) : null}

                {hasCoords ? (
                  <div style={styles.mapCard}>
                    <iframe title="Map preview" src={mapEmbedUrl} style={styles.mapFrame} />
                    <div style={styles.coordsBar}>
                      <span>📍 Coordinates detected</span>
                      <strong>{latNum}, {lngNum}</strong>
                    </div>
                  </div>
                ) : (
                  <div style={styles.hintBox}>
                    Add coordinates manually or use Detect coordinates for live map + weather on details.
                  </div>
                )}
              </div>
            </Section>

            <Section title="Activity & vibe" subtitle="Fast mobile-first selection.">
              <div style={styles.stack}>
                <div style={styles.group}>
                  <div style={styles.smallLabel}>Category</div>
                  <OptionRail
                    options={CATEGORY_OPTIONS}
                    value={category}
                    onChange={setCategory}
                    renderLabel={(option) => `${getCategoryEmoji(option)} ${option}`}
                  />
                </div>

                <div style={styles.group}>
                  <div style={styles.smallLabel}>Vibe</div>
                  <OptionRail
                    options={VIBE_OPTIONS}
                    value={vibe}
                    onChange={setVibe}
                    renderLabel={(option) => `${getVibeEmoji(option)} ${option}`}
                  />
                </div>

                <div style={styles.group}>
                  <div style={styles.smallLabel}>Difficulty</div>
                  <OptionRail
                    options={DIFFICULTY_OPTIONS}
                    value={difficulty}
                    onChange={setDifficulty}
                    renderLabel={(option) => `${getDifficultyEmoji(option)} ${option}`}
                  />
                </div>
              </div>
            </Section>

            <Section title="Timing & status" subtitle="Keep it clear and realistic.">
              <div style={styles.stack}>
                <div style={styles.field}>
                  <label style={styles.label}>Starts at</label>
                  <input
                    type="datetime-local"
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    style={styles.input}
                  />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Ends at</label>
                  <input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    style={styles.input}
                  />
                </div>

                {!validDateRange ? (
                  <div style={styles.warnBox}>End time must be later than start time.</div>
                ) : null}

                <div style={styles.group}>
                  <div style={styles.smallLabel}>Status</div>
                  <OptionRail
                    options={STATUS_OPTIONS}
                    value={status}
                    onChange={setStatus}
                    renderLabel={(option) => option}
                  />
                </div>

                <div style={styles.quickActions}>
                  <button type="button" onClick={() => applyStatus("ended")} style={styles.secondaryBtn}>
                    End now
                  </button>
                  <button type="button" onClick={() => applyStatus("cancelled")} style={styles.secondaryBtn}>
                    Cancel now
                  </button>
                  <button type="button" onClick={() => applyStatus("active")} style={styles.secondaryBtn}>
                    Reopen
                  </button>
                </div>
              </div>
            </Section>

            <Section title="Media" subtitle="Replace the hero without clutter.">
              <div style={styles.stack}>
                <div style={styles.field}>
                  <label style={styles.label}>Media URL</label>
                  <input
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    placeholder="Paste image or video URL"
                    style={styles.input}
                  />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Media type</label>
                  <select value={mediaType} onChange={(e) => setMediaType(e.target.value)} style={styles.select}>
                    <option value="image">image</option>
                    <option value="video">video</option>
                  </select>
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Upload new media</label>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setMediaFile(file);
                      if (file) {
                        setReplaceHero(true);
                        setMediaType(file.type.startsWith("video/") ? "video" : "image");
                      }
                    }}
                    style={styles.fileInput}
                  />
                </div>

                <label style={styles.checkboxWrap}>
                  <input
                    type="checkbox"
                    checked={replaceHero}
                    onChange={(e) => setReplaceHero(e.target.checked)}
                  />
                  <span>Use uploaded file as new hero media on save</span>
                </label>
              </div>
            </Section>

            <Section title="Capacity & extra" subtitle="Keep it practical.">
              <div style={styles.stack}>
                <div style={styles.field}>
                  <label style={styles.label}>Total spots</label>
                  <input
                    type="number"
                    min={Math.max(1, participantsCount)}
                    value={spotsTotal}
                    onChange={(e) => setSpotsTotal(e.target.value)}
                    placeholder="Spots total"
                    style={styles.input}
                  />
                  {participantsCount > 0 ? (
                    <div style={styles.helper}>
                      Joined participants: {participantsCount}. Minimum spots must stay at least {participantsCount}.
                    </div>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => setShowExtra((v) => !v)}
                  style={styles.secondaryBtn}
                >
                  {showExtra ? "Hide quick tips" : "Show quick tips"}
                </button>

                {showExtra ? (
                  <div style={styles.tipsList}>
                    <div style={styles.tipItem}>🔥 Use a title people instantly understand</div>
                    <div style={styles.tipItem}>📍 Keep a real meeting point + detected coordinates</div>
                    <div style={styles.tipItem}>🗺️ Details page shows map + weather when coords exist</div>
                    <div style={styles.tipItem}>👥 Never drop spots below joined participants</div>
                    <div style={styles.tipItem}>🎬 Replace hero media to refresh the whole plan vibe</div>
                  </div>
                ) : null}
              </div>
            </Section>

            {(errorMsg || successMsg) ? (
              <div style={styles.messages}>
                {errorMsg ? <div style={styles.errorBox}>{errorMsg}</div> : null}
                {successMsg ? <div style={styles.successBox}>{successMsg}</div> : null}
              </div>
            ) : null}

            <div style={{ height: 90 }} />
          </form>
        </div>
      </div>

      <div style={styles.mobileBar}>
        <button
          type="button"
          onClick={() => navigate(`/going-now/${id}`)}
          style={styles.mobileGhost}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => setShowPreviewModal(true)}
          style={styles.mobileGhost}
        >
          Preview
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          style={styles.mobilePrimary(canSave)}
        >
          {saving ? "Saving..." : uploadingMedia ? "Uploading..." : "Save"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    position: "relative",
    overflow: "hidden",
    background:
      "radial-gradient(circle at top left, rgba(18,54,45,0.95), rgba(5,10,13,1) 34%), linear-gradient(180deg, #071015 0%, #08161c 100%)",
    padding: "12px 12px 110px",
  },
  bgGlow1: {
    position: "fixed",
    top: -120,
    left: -80,
    width: 320,
    height: 320,
    borderRadius: "50%",
    background: "rgba(52,211,153,0.10)",
    filter: "blur(80px)",
    pointerEvents: "none",
  },
  bgGlow2: {
    position: "fixed",
    bottom: -120,
    right: -80,
    width: 360,
    height: 360,
    borderRadius: "50%",
    background: "rgba(96,165,250,0.10)",
    filter: "blur(90px)",
    pointerEvents: "none",
  },
  container: {
    maxWidth: 820,
    margin: "0 auto",
    position: "relative",
    zIndex: 2,
  },
  loadingCard: {
    borderRadius: 26,
    padding: 24,
    color: "#fff",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
    backdropFilter: "blur(16px)",
  },
  topBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  topActions: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  topBtn: {
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "#f5fffd",
    borderRadius: 14,
    padding: "10px 14px",
    fontWeight: 800,
    cursor: "pointer",
  },
  ghostBtn: {
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.05)",
    color: "#f5fffd",
    borderRadius: 14,
    padding: "10px 14px",
    fontWeight: 800,
    cursor: "pointer",
  },
  deleteBtn: {
    border: "1px solid rgba(255,120,120,0.18)",
    background: "rgba(255,120,120,0.08)",
    color: "#ffe3e3",
    borderRadius: 14,
    padding: "10px 14px",
    fontWeight: 800,
    cursor: "pointer",
  },
  hero: {
    borderRadius: 30,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.04)",
    boxShadow: "0 30px 80px rgba(0,0,0,0.25)",
    backdropFilter: "blur(16px)",
  },
  heroMediaWrap: {
    position: "relative",
    minHeight: 360,
  },
  heroMedia: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    filter: "saturate(1.08) contrast(1.05) brightness(0.55)",
  },
  heroOverlay: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(to top, rgba(4,10,14,0.98) 10%, rgba(4,10,14,0.72) 40%, rgba(4,10,14,0.20) 100%)",
  },
  heroTopRow: {
    position: "absolute",
    top: 14,
    left: 14,
    right: 14,
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
  },
  heroBottom: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
  },
  heroBadge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "10px 14px",
    borderRadius: 999,
    fontWeight: 900,
    fontSize: 13,
    background:
      "linear-gradient(135deg, rgba(167,243,208,0.95), rgba(103,232,249,0.95), rgba(96,165,250,0.95))",
    color: "#05232b",
  },
  statusPill: {
    display: "inline-flex",
    alignItems: "center",
    padding: "10px 14px",
    borderRadius: 999,
    fontWeight: 900,
    fontSize: 13,
    textTransform: "capitalize",
  },
  heroChips: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  heroChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "8px 12px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.09)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "#f3fffc",
    fontWeight: 800,
    fontSize: 13,
    backdropFilter: "blur(10px)",
  },
  heroTitle: {
    color: "#fff",
    fontSize: "clamp(32px, 7vw, 54px)",
    lineHeight: 0.95,
    letterSpacing: "-0.05em",
    fontWeight: 950,
    margin: "0 0 10px",
    textShadow: "0 12px 32px rgba(0,0,0,0.35)",
  },
  heroSubtitle: {
    color: "rgba(234,250,245,0.88)",
    fontSize: 15,
    fontWeight: 600,
    lineHeight: 1.6,
    maxWidth: 760,
  },
  previewMini: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderTop: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    flexWrap: "wrap",
  },
  previewMiniLabel: {
    color: "rgba(227,247,242,0.72)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontSize: 11,
    fontWeight: 900,
  },
  previewMiniTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: 900,
    marginTop: 4,
  },
  previewMiniText: {
    color: "rgba(234,250,245,0.82)",
    fontSize: 14,
    marginTop: 4,
    fontWeight: 700,
  },
  previewBtn: {
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 16,
    padding: "12px 16px",
    fontWeight: 900,
    fontSize: 14,
    cursor: "pointer",
    color: "#effffb",
    background: "rgba(255,255,255,0.06)",
  },
  form: {
    padding: 14,
    display: "grid",
    gap: 14,
  },
  section: {
    borderRadius: 24,
    padding: 16,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    backdropFilter: "blur(16px)",
  },
  sectionHead: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 14,
  },
  sectionTitle: {
    color: "#f5fffd",
    fontWeight: 900,
    fontSize: 18,
  },
  sectionSubtitle: {
    color: "rgba(227,247,242,0.62)",
    fontSize: 13,
    fontWeight: 600,
    marginTop: 4,
    lineHeight: 1.5,
  },
  stack: {
    display: "grid",
    gap: 12,
  },
  field: {
    display: "grid",
    gap: 8,
  },
  label: {
    color: "rgba(227,247,242,0.72)",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontWeight: 900,
  },
  smallLabel: {
    color: "rgba(227,247,242,0.72)",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontWeight: 900,
    marginBottom: 8,
  },
  input: {
    width: "100%",
    borderRadius: 18,
    padding: "14px 15px",
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.06)",
    color: "#f4fffb",
    outline: "none",
    fontSize: 15,
    fontWeight: 600,
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    borderRadius: 18,
    padding: "14px 15px",
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.06)",
    color: "#f4fffb",
    outline: "none",
    fontSize: 15,
    fontWeight: 600,
    boxSizing: "border-box",
    resize: "vertical",
    minHeight: 140,
    lineHeight: 1.6,
  },
  select: {
    width: "100%",
    borderRadius: 18,
    padding: "14px 15px",
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.06)",
    color: "#f4fffb",
    outline: "none",
    fontSize: 15,
    fontWeight: 600,
    boxSizing: "border-box",
    appearance: "none",
  },
  fileInput: {
    width: "100%",
    borderRadius: 18,
    padding: "11px 14px",
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.06)",
    color: "#f4fffb",
    outline: "none",
    fontSize: 15,
    fontWeight: 600,
    boxSizing: "border-box",
  },
  helperRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
  },
  helper: {
    color: "rgba(227,247,242,0.52)",
    fontSize: 12,
    fontWeight: 600,
  },
  counter: {
    color: "rgba(227,247,242,0.60)",
    fontSize: 12,
    fontWeight: 800,
  },
  rail: {
    display: "flex",
    gap: 10,
    overflowX: "auto",
    paddingBottom: 4,
    scrollSnapType: "x mandatory",
  },
  railBtn: (active) => ({
    flex: "0 0 auto",
    scrollSnapAlign: "start",
    border: active ? "1px solid rgba(103,232,249,0.30)" : "1px solid rgba(255,255,255,0.10)",
    background: active
      ? "linear-gradient(135deg, rgba(167,243,208,0.18), rgba(103,232,249,0.16), rgba(96,165,250,0.14))"
      : "rgba(255,255,255,0.05)",
    color: "#f5fffd",
    borderRadius: 999,
    padding: "12px 14px",
    fontWeight: 800,
    fontSize: 13,
    cursor: "pointer",
    whiteSpace: "nowrap",
  }),
  group: {
    display: "grid",
    gap: 8,
  },
  resolvedCard: {
    padding: 14,
    borderRadius: 18,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    display: "grid",
    gap: 10,
  },
  resolvedTitle: {
    color: "rgba(227,247,242,0.72)",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontWeight: 900,
  },
  resolvedText: {
    color: "#effffb",
    fontSize: 15,
    fontWeight: 700,
    lineHeight: 1.6,
  },
  secondaryBtn: {
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 18,
    padding: "14px 16px",
    fontWeight: 900,
    fontSize: 15,
    cursor: "pointer",
    color: "#effffb",
    background: "rgba(255,255,255,0.06)",
  },
  inlineLinkBtn: {
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 18,
    padding: "12px 14px",
    fontWeight: 900,
    fontSize: 14,
    color: "#effffb",
    background: "rgba(255,255,255,0.06)",
  },
  mapCard: {
    overflow: "hidden",
    borderRadius: 22,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
  },
  mapFrame: {
    width: "100%",
    height: 280,
    border: "none",
    display: "block",
  },
  coordsBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    padding: 12,
    color: "#effffb",
    fontSize: 13,
    fontWeight: 800,
    flexWrap: "wrap",
  },
  hintBox: {
    padding: "12px 14px",
    borderRadius: 16,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#effffb",
    fontWeight: 700,
    fontSize: 14,
    lineHeight: 1.6,
  },
  warnBox: {
    padding: "12px 14px",
    borderRadius: 16,
    background: "rgba(255,190,90,0.10)",
    border: "1px solid rgba(255,190,90,0.18)",
    color: "#ffe7b5",
    fontWeight: 700,
    fontSize: 14,
  },
  quickActions: {
    display: "grid",
    gap: 10,
    gridTemplateColumns: "1fr 1fr 1fr",
  },
  checkboxWrap: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    color: "#effffb",
    fontWeight: 700,
  },
  messages: {
    display: "grid",
    gap: 10,
  },
  errorBox: {
    padding: "12px 14px",
    borderRadius: 16,
    background: "rgba(255,90,90,0.10)",
    border: "1px solid rgba(255,90,90,0.18)",
    color: "#ffd7d7",
    fontWeight: 700,
    fontSize: 14,
  },
  successBox: {
    padding: "12px 14px",
    borderRadius: 16,
    background: "rgba(52,211,153,0.12)",
    border: "1px solid rgba(52,211,153,0.20)",
    color: "#c8ffeb",
    fontWeight: 700,
    fontSize: 14,
  },
  tipsList: {
    display: "grid",
    gap: 10,
  },
  tipItem: {
    borderRadius: 16,
    padding: "12px 14px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#effffb",
    fontWeight: 700,
    lineHeight: 1.5,
  },
  mobileBar: {
    position: "fixed",
    left: 12,
    right: 12,
    bottom: 12,
    display: "grid",
    gridTemplateColumns: "0.9fr 0.9fr 1.2fr",
    gap: 10,
    padding: 10,
    borderRadius: 22,
    background: "rgba(7,14,13,0.88)",
    border: "1px solid rgba(255,255,255,0.08)",
    backdropFilter: "blur(18px)",
    zIndex: 50,
    boxShadow: "0 18px 40px rgba(0,0,0,0.34)",
  },
  mobileGhost: {
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    padding: "15px 14px",
    borderRadius: 16,
    fontWeight: 900,
    cursor: "pointer",
  },
  mobilePrimary: (enabled) => ({
    border: "none",
    background: enabled
      ? "linear-gradient(135deg, #22d39a 0%, #31c3ff 100%)"
      : "linear-gradient(135deg, rgba(34,211,154,0.45), rgba(49,195,255,0.45))",
    color: "#06110e",
    padding: "15px 16px",
    borderRadius: 16,
    fontWeight: 950,
    cursor: enabled ? "pointer" : "not-allowed",
    textAlign: "center",
    opacity: enabled ? 1 : 0.75,
  }),
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.76)",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    zIndex: 100,
    padding: 0,
  },
  sheet: {
    width: "100%",
    maxWidth: 720,
    background: "#081513",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    border: "1px solid rgba(255,255,255,0.08)",
    padding: 18,
    maxHeight: "88vh",
    overflowY: "auto",
    position: "relative",
  },
  closeBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: "50%",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    fontSize: 24,
    cursor: "pointer",
  },
  modalTitle: {
    color: "#fff",
    fontWeight: 950,
    fontSize: 20,
    marginBottom: 14,
  },
  previewCardBig: {
    borderRadius: 22,
    padding: 16,
    background:
      "linear-gradient(135deg, rgba(167,243,208,0.08), rgba(103,232,249,0.08), rgba(96,165,250,0.08))",
    border: "1px solid rgba(255,255,255,0.09)",
    display: "grid",
    gap: 12,
  },
  previewTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
  },
  previewBadge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "8px 12px",
    borderRadius: 999,
    fontWeight: 900,
    fontSize: 12,
    background:
      "linear-gradient(135deg, rgba(167,243,208,1), rgba(103,232,249,1), rgba(96,165,250,1))",
    color: "#05232b",
  },
  previewStatus: {
    display: "inline-flex",
    alignItems: "center",
    padding: "8px 12px",
    borderRadius: 999,
    fontWeight: 800,
    fontSize: 12,
    color: "#effffb",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.10)",
    textTransform: "capitalize",
  },
  previewTitle: {
    color: "#f4fffb",
    fontWeight: 950,
    fontSize: 24,
    lineHeight: 1.05,
    letterSpacing: "-0.03em",
  },
  previewMeta: {
    color: "rgba(234,250,245,0.82)",
    fontSize: 14,
    fontWeight: 700,
  },
  previewTagsWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },
  previewTag: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "8px 10px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.10)",
    color: "#f4fffb",
    fontSize: 12,
    fontWeight: 800,
  },
  previewDesc: {
    color: "rgba(240,251,248,0.82)",
    fontSize: 14,
    lineHeight: 1.7,
  },
}
