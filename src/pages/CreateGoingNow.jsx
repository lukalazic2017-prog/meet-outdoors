import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

const CATEGORY_OPTIONS = [
  { value: "hiking", label: "Hiking", icon: "🥾" },
  { value: "walk", label: "Walk", icon: "🚶" },
  { value: "coffee", label: "Coffee", icon: "☕" },
  { value: "workout", label: "Workout", icon: "🏋️" },
  { value: "cycling", label: "Cycling", icon: "🚴" },
  { value: "basketball", label: "Basketball", icon: "🏀" },
  { value: "run", label: "Run", icon: "🏃" },
  { value: "roadtrip", label: "Road trip", icon: "🚗" },
  { value: "chill", label: "Chill outdoors", icon: "🌿" },
];

const VIBE_OPTIONS = [
  { value: "social", label: "Social", icon: "👋" },
  { value: "chill", label: "Chill", icon: "🫶" },
  { value: "active", label: "Active", icon: "💪" },
  { value: "party", label: "Party", icon: "🎉" },
  { value: "adventurous", label: "Adventurous", icon: "🏕️" },
  { value: "focused", label: "Focused", icon: "🎯" },
];

const DIFFICULTY_OPTIONS = [
  { value: "easy", label: "Easy", icon: "🟢" },
  { value: "moderate", label: "Moderate", icon: "🟠" },
  { value: "hard", label: "Hard", icon: "🔴" },
];

const VISIBILITY_OPTIONS = [
  { value: "public", label: "Public" },
  { value: "friends", label: "Friends" },
  { value: "private", label: "Private" },
];

const DURATION_OPTIONS = [
  "30 min",
  "1 hour",
  "2 hours",
  "3 hours",
  "Half day",
  "Flexible",
];

const FALLBACK_PREVIEW =
  "https://images.pexels.com/photos/1761279/pexels-photo-1761279.jpeg";

function SectionCard({ title, subtitle, action, children }) {
  return (
    <section style={styles.sectionCard}>
      <div style={styles.sectionHeader}>
        <div>
          <h3 style={styles.sectionTitle}>{title}</h3>
          {subtitle ? <p style={styles.sectionSubtitle}>{subtitle}</p> : null}
        </div>
        {action ? <div>{action}</div> : null}
      </div>
      {children}
    </section>
  );
}

function PillChip({ active, label, icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...styles.pillChip,
        ...(active ? styles.pillChipActive : null),
      }}
    >
      {icon ? <span style={styles.pillChipIcon}>{icon}</span> : null}
      <span>{label}</span>
    </button>
  );
}

function Modal({ open, title, children, onClose }) {
  if (!open) return null;

  return (
    <div style={styles.modalBackdrop} onClick={onClose}>
      <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHead}>
          <div style={styles.modalTitle}>{title}</div>
          <button type="button" onClick={onClose} style={styles.modalClose}>
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function parseNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const normalized = String(value).replace(",", ".").trim();
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

function isoOrNow(value) {
  if (!value) return new Date().toISOString();
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return new Date().toISOString();
  return d.toISOString();
}

function isoOrNull(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function formatDateTimePreview(value) {
  if (!value) return "Starts now";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Starts now";
  return d.toLocaleString([], {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function detectMediaTypeFromUrl(url) {
  if (!url) return "image";
  const clean = url.toLowerCase();
  if (
    clean.includes(".mp4") ||
    clean.includes(".webm") ||
    clean.includes(".mov") ||
    clean.includes("video")
  ) {
    return "video";
  }
  return "image";
}

async function geocodeLocation(query) {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      trimmed
    )}&count=1&language=en&format=json`
  );

  if (!res.ok) {
    throw new Error("Could not resolve coordinates.");
  }

  const data = await res.json();
  const first = data?.results?.[0];

  if (!first) return null;

  const cityBits = [first.name, first.admin1, first.country].filter(Boolean);

  return {
    latitude: first.latitude,
    longitude: first.longitude,
    label: cityBits.join(", "),
  };
}

export default function CreateGoingNow() {
  const navigate = useNavigate();
  const mediaInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [meetingPoint, setMeetingPoint] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [locationText, setLocationText] = useState("");
  const [category, setCategory] = useState("chill");
  const [vibe, setVibe] = useState("social");
  const [difficulty, setDifficulty] = useState("easy");
  const [visibility, setVisibility] = useState("public");
  const [durationText, setDurationText] = useState("Flexible");
  const [spotsTotal, setSpotsTotal] = useState(6);
  const [startsAt, setStartsAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [whatToBring, setWhatToBring] = useState("");
  const [whoCanJoin, setWhoCanJoin] = useState(
    "Anyone respectful and ready to join."
  );
  const [contactNote, setContactNote] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState("image");
  const [selectedFile, setSelectedFile] = useState(null);
  const [localPreview, setLocalPreview] = useState("");

  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [resolvedLocation, setResolvedLocation] = useState("");
  const [resolvingCoords, setResolvingCoords] = useState(false);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [lastCreatedId, setLastCreatedId] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [extrasOpen, setExtrasOpen] = useState(false);

  useEffect(() => {
    return () => {
      if (localPreview) {
        URL.revokeObjectURL(localPreview);
      }
    };
  }, [localPreview]);

  const composedLocation = useMemo(() => {
    const parts = [meetingPoint, city, country]
      .map((x) => x.trim())
      .filter(Boolean);
    return parts.join(", ") || locationText.trim();
  }, [meetingPoint, city, country, locationText]);

  const previewLocation =
    resolvedLocation || composedLocation || "Location will appear here";
  const previewMedia = localPreview || mediaUrl.trim() || FALLBACK_PREVIEW;
  const previewMediaType = selectedFile
    ? selectedFile.type.startsWith("video/")
      ? "video"
      : "image"
    : mediaUrl.trim()
    ? detectMediaTypeFromUrl(mediaUrl.trim())
    : mediaType;

  const previewDescription = useMemo(() => {
    const blocks = [];
    if (description.trim()) blocks.push(description.trim());
    if (whatToBring.trim()) blocks.push(`What to bring: ${whatToBring.trim()}`);
    if (whoCanJoin.trim()) blocks.push(`Who can join: ${whoCanJoin.trim()}`);
    if (contactNote.trim()) blocks.push(`Contact note: ${contactNote.trim()}`);
    return blocks.join("\n\n");
  }, [description, whatToBring, whoCanJoin, contactNote]);

  const titleCount = title.trim().length;
  const descCount = description.trim().length;
  const canPublish = !!title.trim() && !saving;
  const latValue = parseNumber(latitude);
  const lngValue = parseNumber(longitude);
  const hasCoords = latValue !== null && lngValue !== null;
  const googleMapsUrl = hasCoords
    ? `https://www.google.com/maps?q=${latValue},${lngValue}`
    : previewLocation && previewLocation !== "Location will appear here"
    ? `https://www.google.com/maps/search/${encodeURIComponent(previewLocation)}`
    : null;
  const unsavedHint =
    title || description || meetingPoint || city || country || locationText || mediaUrl;

  const resolveCoordinates = async () => {
    const query = composedLocation;

    if (!query.trim()) {
      setErrorMsg("Enter meeting point, city, or country first.");
      return null;
    }

    try {
      setResolvingCoords(true);
      setErrorMsg("");
      setSuccessMsg("");

      const found = await geocodeLocation(query);

      if (!found) {
        setResolvedLocation("");
        setLatitude("");
        setLongitude("");
        setErrorMsg("Could not detect exact coordinates for that location.");
        return null;
      }

      setLatitude(String(found.latitude));
      setLongitude(String(found.longitude));
      setResolvedLocation(found.label || query);
      setSuccessMsg("Coordinates detected automatically.");
      return found;
    } catch (err) {
      console.error(err);
      setErrorMsg(err?.message || "Could not detect coordinates.");
      return null;
    } finally {
      setResolvingCoords(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    setSuccessMsg("");

    if (localPreview) URL.revokeObjectURL(localPreview);

    if (!file) {
      setLocalPreview("");
      return;
    }

    const url = URL.createObjectURL(file);
    setLocalPreview(url);
    setMediaType(file.type.startsWith("video/") ? "video" : "image");
  };

  const uploadSelectedMedia = async (userId) => {
    if (!selectedFile) {
      return {
        uploadedUrl: mediaUrl.trim() || null,
        uploadedType: mediaUrl.trim()
          ? detectMediaTypeFromUrl(mediaUrl.trim())
          : null,
      };
    }

    const ext = selectedFile.name.split(".").pop() || "file";
    const fileName = `${userId}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${ext}`;

    const { error } = await supabase.storage
      .from("going-now-media")
      .upload(fileName, selectedFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      throw new Error(
        "Media upload failed. Create a storage bucket named going-now-media or use Media URL."
      );
    }

    const { data } = supabase.storage.from("going-now-media").getPublicUrl(fileName);

    return {
      uploadedUrl: data?.publicUrl || null,
      uploadedType: selectedFile.type.startsWith("video/") ? "video" : "image",
    };
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      setErrorMsg("Title is required.");
      return;
    }

    try {
      setSaving(true);
      setErrorMsg("");
      setSuccessMsg("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/login");
        return;
      }

      let finalLat = parseNumber(latitude);
      let finalLng = parseNumber(longitude);
      let finalResolved = resolvedLocation;

      if (finalLat === null || finalLng === null) {
        const found = await resolveCoordinates();
        if (found) {
          finalLat = parseNumber(found.latitude);
          finalLng = parseNumber(found.longitude);
          finalResolved = found.label || composedLocation;
        }
      }

      const { uploadedUrl, uploadedType } = await uploadSelectedMedia(user.id);

      const payload = {
        user_id: user.id,
        title: title.trim(),
        description: previewDescription || null,
        location_text: (finalResolved || composedLocation || locationText).trim() || null,
        category: category || null,
        vibe: vibe || null,
        difficulty: difficulty || null,
        spots_total: spotsTotal ? Number(spotsTotal) : null,
        starts_at: isoOrNow(startsAt),
        expires_at: isoOrNull(expiresAt),
        status: "active",
        latitude: finalLat,
        longitude: finalLng,
        media_url: uploadedUrl,
        media_type: uploadedType,
      };

      const { data, error } = await supabase
        .from("going_now")
        .insert(payload)
        .select("id")
        .single();

      if (error) {
        console.error("create error:", error);
        setErrorMsg(error.message || "Could not create live plan.");
        return;
      }

      const newId = data.id;
      setLastCreatedId(newId);

      const { error: joinError } = await supabase
        .from("going_now_participants")
        .upsert(
          {
            going_now_id: newId,
            user_id: user.id,
            status: "joined",
          },
          {
            onConflict: "going_now_id,user_id",
          }
        );

      if (joinError) {
        console.error("creator auto join error:", joinError);
      }

      navigate(`/going-now/${newId}`);
    } catch (err) {
      console.error(err);
      setErrorMsg(err?.message || "Could not create live plan.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLastCreated = async () => {
    if (!lastCreatedId) {
      setErrorMsg("No created plan to delete yet.");
      return;
    }

    try {
      setDeleting(true);
      setErrorMsg("");
      setSuccessMsg("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/login");
        return;
      }

      const { error } = await supabase
        .from("going_now")
        .delete()
        .eq("id", lastCreatedId)
        .eq("user_id", user.id);

      if (error) {
        console.error("delete error:", error);
        setErrorMsg(error.message || "Could not delete plan.");
        return;
      }

      setLastCreatedId("");
      setSuccessMsg("Last created plan deleted.");
    } catch (err) {
      console.error(err);
      setErrorMsg(err?.message || "Could not delete plan.");
    } finally {
      setDeleting(false);
    }
  };

  const renderPreviewCard = (compact = false) => (
    <div style={{ ...styles.previewCard, ...(compact ? styles.previewCardCompact : null) }}>
      <div style={styles.previewMediaWrap}>
        {previewMediaType === "video" ? (
          <video src={previewMedia} muted playsInline style={styles.previewMedia} />
        ) : (
          <img src={previewMedia} alt="Preview" style={styles.previewMedia} />
        )}
        <div style={styles.previewBadge}>{category}</div>
      </div>

      <div style={styles.previewContent}>
        <h3 style={styles.previewTitle}>{title.trim() || "Your live plan title"}</h3>
        <div style={styles.previewMeta}>📍 {previewLocation}</div>
        <div style={styles.previewMeta}>🕒 {formatDateTimePreview(startsAt)}</div>
        <div style={styles.previewMeta}>👥 {spotsTotal || 0} spots</div>
        <div style={styles.previewMeta}>
          ⚡ {vibe} • {difficulty} • {visibility}
        </div>
        <div style={styles.previewMeta}>⏱️ {durationText}</div>
        <div style={styles.previewDesc}>
          {previewDescription ||
            "Your description, what to bring, and who can join will appear here."}
        </div>
        <div style={styles.coordsBox}>
          {hasCoords
            ? `Coordinates ready: ${latitude}, ${longitude}`
            : "Coordinates will be detected automatically on publish."}
        </div>
      </div>
    </div>
  );

  return (
    <div style={styles.page}>
      <Modal open={previewOpen} title="Live preview" onClose={() => setPreviewOpen(false)}>
        {renderPreviewCard()}
      </Modal>

      <div style={styles.container}>
        <section style={styles.hero}>
          <div style={styles.heroTopLine}>
            <div style={styles.heroBadge}>GOING NOW</div>
            <button type="button" style={styles.previewTriggerBtn} onClick={() => setPreviewOpen(true)}>
              Preview
            </button>
          </div>
          <h1 style={styles.heroTitle}>Create a live plan people want to join</h1>
          <p style={styles.heroText}>
            Faster on mobile, cleaner to scan, and ready for map + weather from the
            moment you publish.
          </p>
        </section>

        <div style={styles.mobileQuickPreview}>{renderPreviewCard(true)}</div>

        <form onSubmit={handleCreate} style={styles.formCol}>
          <SectionCard
            title="Quick essentials"
            subtitle="Title first, then activity. Make it instantly clear."
            action={
              <div style={styles.unsavedPill}>{unsavedHint ? "Unsaved changes" : "Ready"}</div>
            }
          >
            <div style={styles.fieldBlock}>
              <label style={styles.label}>Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Sunset walk to the fortress"
                style={styles.input}
                maxLength={90}
              />
              <div style={styles.metaRow}>
                <span style={styles.helperText}>Short, specific, and easy to understand.</span>
                <span style={styles.counterText}>{titleCount}/90</span>
              </div>
            </div>

            <div style={styles.fieldBlock}>
              <label style={styles.label}>Choose activity</label>
              <div style={styles.swipeRail}>
                {CATEGORY_OPTIONS.map((option) => (
                  <PillChip
                    key={option.value}
                    active={category === option.value}
                    label={option.label}
                    icon={option.icon}
                    onClick={() => setCategory(option.value)}
                  />
                ))}
              </div>
            </div>

            <div style={styles.fieldBlock}>
              <label style={styles.label}>Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell people what is happening, what kind of mood it is, and why they should join."
                rows={5}
                style={styles.textarea}
                maxLength={500}
              />
              <div style={styles.metaRow}>
                <span style={styles.helperText}>Sell the vibe in 2–4 sentences.</span>
                <span style={styles.counterText}>{descCount}/500</span>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Location"
            subtitle="Best on mobile: one clear meeting point, then city and country."
            action={
              <button
                type="button"
                onClick={resolveCoordinates}
                disabled={resolvingCoords}
                style={styles.secondaryBtn}
              >
                {resolvingCoords ? "Detecting..." : "Detect coordinates"}
              </button>
            }
          >
            <div style={styles.stackMobile}>
              <div style={styles.fieldBlock}>
                <label style={styles.label}>Meeting point</label>
                <input
                  value={meetingPoint}
                  onChange={(e) => setMeetingPoint(e.target.value)}
                  placeholder="Niš Fortress main gate"
                  style={styles.input}
                />
              </div>

              <div style={styles.grid2Responsive}>
                <div style={styles.fieldBlock}>
                  <label style={styles.label}>City</label>
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Niš"
                    style={styles.input}
                  />
                </div>

                <div style={styles.fieldBlock}>
                  <label style={styles.label}>Country</label>
                  <input
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="Serbia"
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.fieldBlock}>
                <label style={styles.label}>Or simple location text</label>
                <input
                  value={locationText}
                  onChange={(e) => setLocationText(e.target.value)}
                  placeholder="Niš, Serbia"
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.resolvedCard}>
              <div style={styles.resolvedTitle}>Resolved location</div>
              <div style={styles.resolvedValue}>
                {resolvedLocation || composedLocation || "Resolved location will appear here"}
              </div>
              <div style={styles.coordsMiniRow}>
                <div style={styles.coordsMiniBox}>{latitude || "Lat"}</div>
                <div style={styles.coordsMiniBox}>{longitude || "Lng"}</div>
              </div>
            </div>

            {googleMapsUrl ? (
              <div style={styles.mapActionRow}>
                <a href={googleMapsUrl} target="_blank" rel="noreferrer" style={styles.mapLinkBtn}>
                  Open in Maps
                </a>
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => setAdvancedOpen((v) => !v)}
              style={styles.inlineToggleBtn}
            >
              {advancedOpen ? "Hide advanced coordinates" : "Show advanced coordinates"}
            </button>

            {advancedOpen ? (
              <div style={styles.grid2Responsive}>
                <div style={styles.fieldBlock}>
                  <label style={styles.label}>Latitude</label>
                  <input
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder="43.3209"
                    style={styles.input}
                  />
                </div>

                <div style={styles.fieldBlock}>
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
          </SectionCard>

          <SectionCard
            title="Time & vibe"
            subtitle="Simple first. Everything important in one place."
          >
            <div style={styles.grid2Responsive}>
              <div style={styles.fieldBlock}>
                <label style={styles.label}>Starts at</label>
                <input
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={styles.fieldBlock}>
                <label style={styles.label}>Ends at</label>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.fieldBlock}>
              <label style={styles.label}>Vibe</label>
              <div style={styles.swipeRail}>
                {VIBE_OPTIONS.map((option) => (
                  <PillChip
                    key={option.value}
                    active={vibe === option.value}
                    label={option.label}
                    icon={option.icon}
                    onClick={() => setVibe(option.value)}
                  />
                ))}
              </div>
            </div>

            <div style={styles.fieldBlock}>
              <label style={styles.label}>Difficulty</label>
              <div style={styles.segmentedWrap}>
                {DIFFICULTY_OPTIONS.map((option) => (
                  <PillChip
                    key={option.value}
                    active={difficulty === option.value}
                    label={option.label}
                    icon={option.icon}
                    onClick={() => setDifficulty(option.value)}
                  />
                ))}
              </div>
            </div>

            <div style={styles.fieldBlock}>
              <label style={styles.label}>Visibility</label>
              <div style={styles.segmentedWrap}>
                {VISIBILITY_OPTIONS.map((option) => (
                  <PillChip
                    key={option.value}
                    active={visibility === option.value}
                    label={option.label}
                    onClick={() => setVisibility(option.value)}
                  />
                ))}
              </div>
            </div>

            <div style={styles.grid2Responsive}>
              <div style={styles.fieldBlock}>
                <label style={styles.label}>Duration</label>
                <select
                  value={durationText}
                  onChange={(e) => setDurationText(e.target.value)}
                  style={styles.select}
                >
                  {DURATION_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.fieldBlock}>
                <label style={styles.label}>Spots total</label>
                <input
                  type="number"
                  value={spotsTotal}
                  onChange={(e) => setSpotsTotal(e.target.value)}
                  placeholder="6"
                  min="1"
                  style={styles.input}
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Media"
            subtitle="Photo or video first. Make the plan feel alive before people even open it."
          >
            <div style={styles.mediaUploadCard}>
              <div style={styles.mediaButtonsRow}>
                <button
                  type="button"
                  onClick={() => mediaInputRef.current?.click()}
                  style={styles.secondaryBtn}
                >
                  Upload from device
                </button>
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  style={styles.ghostBtnSmall}
                >
                  Open camera
                </button>
              </div>

              <input
                ref={mediaInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                style={styles.hiddenInput}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*,video/*"
                capture="environment"
                onChange={handleFileChange}
                style={styles.hiddenInput}
              />

              <div style={styles.fieldBlock}>
                <label style={styles.label}>Or media URL</label>
                <input
                  value={mediaUrl}
                  onChange={(e) => {
                    setMediaUrl(e.target.value);
                    if (!selectedFile) setMediaType(detectMediaTypeFromUrl(e.target.value));
                  }}
                  placeholder="https://..."
                  style={styles.input}
                />
              </div>

              <p style={styles.helperText}>
                Uses Supabase storage bucket: <strong>going-now-media</strong>.
              </p>
            </div>
          </SectionCard>

          <SectionCard
            title="Extra details"
            subtitle="Useful, but they do not need to take over the whole screen."
            action={
              <button type="button" onClick={() => setExtrasOpen((v) => !v)} style={styles.inlineToggleBtn}>
                {extrasOpen ? "Collapse" : "Expand"}
              </button>
            }
          >
            {extrasOpen ? (
              <div style={styles.stackMobile}>
                <div style={styles.fieldBlock}>
                  <label style={styles.label}>What to bring</label>
                  <textarea
                    value={whatToBring}
                    onChange={(e) => setWhatToBring(e.target.value)}
                    placeholder="Water, light jacket, good mood..."
                    rows={3}
                    style={styles.textarea}
                  />
                </div>

                <div style={styles.fieldBlock}>
                  <label style={styles.label}>Who can join</label>
                  <textarea
                    value={whoCanJoin}
                    onChange={(e) => setWhoCanJoin(e.target.value)}
                    placeholder="Anyone respectful and ready to join."
                    rows={3}
                    style={styles.textarea}
                  />
                </div>

                <div style={styles.fieldBlock}>
                  <label style={styles.label}>Contact note</label>
                  <textarea
                    value={contactNote}
                    onChange={(e) => setContactNote(e.target.value)}
                    placeholder="Use chat if you arrive late."
                    rows={3}
                    style={styles.textarea}
                  />
                </div>
              </div>
            ) : (
              <div style={styles.compactInfoBox}>
                Add what to bring, who can join, and a short contact note only when needed.
              </div>
            )}
          </SectionCard>

          <div style={styles.safetyBox}>
            <strong>Safety tip:</strong> Meet in public places, add a clear meeting point,
            and keep updates in live chat so people can find you easily.
          </div>

          {errorMsg ? <div style={styles.errorBox}>{errorMsg}</div> : null}
          {successMsg ? <div style={styles.successBox}>{successMsg}</div> : null}

          <div style={styles.utilityRow}>
            <button
              type="button"
              onClick={handleDeleteLastCreated}
              disabled={deleting || !lastCreatedId}
              style={styles.deleteBtn}
            >
              {deleting ? "Deleting..." : "Delete last created"}
            </button>
            {lastCreatedId ? <div style={styles.lastIdBox}>Last created id: {lastCreatedId}</div> : null}
          </div>
        </form>
      </div>

      <div style={styles.mobileActionBar}>
        <button type="button" onClick={() => navigate(-1)} style={styles.mobileGhostBtn}>
          Cancel
        </button>
        <button type="button" onClick={() => setPreviewOpen(true)} style={styles.mobileGhostBtn}>
          Preview
        </button>
        <button
          type="button"
          disabled={!canPublish}
          onClick={handleCreate}
          style={{ ...styles.mobilePrimaryBtn, opacity: canPublish ? 1 : 0.7 }}
        >
          {saving ? "Creating..." : "Publish"}
        </button>
      </div>

      <style>{`
        input::placeholder, textarea::placeholder {
          color: rgba(230, 241, 238, 0.42);
        }

        @media (max-width: 1080px) {
          .desktop-preview-hide {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top left, rgba(24,174,132,0.18), transparent 24%), radial-gradient(circle at top right, rgba(42,124,255,0.16), transparent 22%), linear-gradient(180deg, #07110f 0%, #081513 22%, #091a17 100%)",
    color: "#fff",
    padding: "14px 0 120px",
  },
  container: {
    width: "min(920px, calc(100% - 16px))",
    margin: "0 auto",
  },
  hero: {
    padding: "22px 18px",
    borderRadius: 26,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "linear-gradient(135deg, rgba(34,211,154,0.14), rgba(49,195,255,0.08))",
    boxShadow: "0 20px 60px rgba(0,0,0,0.24)",
    marginBottom: 16,
  },
  heroTopLine: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
  },
  heroBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.1)",
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: "0.08em",
  },
  previewTriggerBtn: {
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    padding: "10px 14px",
    borderRadius: 14,
    cursor: "pointer",
    fontWeight: 800,
  },
  heroTitle: {
    margin: "14px 0 10px",
    fontSize: "clamp(30px, 8vw, 52px)",
    lineHeight: 1.02,
    fontWeight: 950,
    letterSpacing: "-0.03em",
    maxWidth: 760,
  },
  heroText: {
    margin: 0,
    color: "rgba(232,244,239,0.88)",
    maxWidth: 760,
    lineHeight: 1.7,
    fontSize: 15,
  },
  mobileQuickPreview: {
    marginBottom: 16,
  },
  formCol: {
    minWidth: 0,
    display: "grid",
    gap: 16,
  },
  sectionCard: {
    padding: 18,
    borderRadius: 24,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.05)",
    boxShadow: "0 18px 50px rgba(0,0,0,0.22)",
  },
  sectionHeader: {
    marginBottom: 14,
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  sectionTitle: {
    margin: 0,
    fontSize: 21,
    fontWeight: 950,
    letterSpacing: "-0.02em",
  },
  sectionSubtitle: {
    margin: "6px 0 0",
    color: "rgba(219,235,229,0.78)",
    lineHeight: 1.55,
    fontSize: 14,
    maxWidth: 560,
  },
  unsavedPill: {
    padding: "8px 12px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.08)",
    fontSize: 12,
    fontWeight: 900,
    color: "#dff8ef",
  },
  fieldBlock: {
    display: "grid",
    gap: 8,
  },
  stackMobile: {
    display: "grid",
    gap: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: 900,
    color: "#dff8ef",
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "15px 16px",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    outline: "none",
    fontSize: 15,
  },
  textarea: {
    width: "100%",
    boxSizing: "border-box",
    padding: "15px 16px",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    outline: "none",
    fontSize: 15,
    resize: "vertical",
    minHeight: 120,
  },
  select: {
    width: "100%",
    boxSizing: "border-box",
    padding: "15px 16px",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(12,22,20,0.95)",
    color: "#fff",
    outline: "none",
    fontSize: 15,
  },
  helperText: {
    margin: 0,
    color: "rgba(219,235,229,0.72)",
    fontSize: 13,
    lineHeight: 1.5,
  },
  metaRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  counterText: {
    fontSize: 12,
    fontWeight: 800,
    color: "rgba(219,235,229,0.68)",
  },
  swipeRail: {
    display: "flex",
    gap: 10,
    overflowX: "auto",
    paddingBottom: 4,
    scrollSnapType: "x mandatory",
    scrollbarWidth: "none",
  },
  pillChip: {
    padding: "12px 14px",
    borderRadius: 18,
    minHeight: 48,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.04)",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 800,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    whiteSpace: "nowrap",
    scrollSnapAlign: "start",
    flexShrink: 0,
  },
  pillChipActive: {
    background: "linear-gradient(135deg, rgba(34,211,154,0.2), rgba(49,195,255,0.18))",
    border: "1px solid rgba(115,255,211,0.28)",
    boxShadow: "0 14px 30px rgba(27,193,150,0.16)",
  },
  pillChipIcon: {
    fontSize: 16,
  },
  segmentedWrap: {
    display: "flex",
    gap: 10,
    overflowX: "auto",
    paddingBottom: 4,
    scrollbarWidth: "none",
  },
  grid2Responsive: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 14,
  },
  resolvedCard: {
    marginTop: 14,
    padding: 14,
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
  },
  resolvedTitle: {
    fontSize: 12,
    fontWeight: 900,
    color: "rgba(219,235,229,0.72)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  resolvedValue: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: 800,
    color: "#effffb",
    lineHeight: 1.5,
  },
  coordsMiniRow: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 10,
    marginTop: 12,
  },
  coordsMiniBox: {
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.07)",
    background: "rgba(255,255,255,0.04)",
    color: "#aef5d6",
    fontWeight: 800,
    fontSize: 13,
  },
  mapActionRow: {
    marginTop: 12,
  },
  mapLinkBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    textDecoration: "none",
    color: "#06110e",
    background: "linear-gradient(135deg, #22d39a 0%, #31c3ff 100%)",
    padding: "12px 16px",
    borderRadius: 14,
    fontWeight: 900,
  },
  inlineToggleBtn: {
    marginTop: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
    color: "#fff",
    padding: "11px 14px",
    borderRadius: 14,
    cursor: "pointer",
    fontWeight: 800,
  },
  mediaUploadCard: {
    display: "grid",
    gap: 14,
  },
  mediaButtonsRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  hiddenInput: {
    display: "none",
  },
  compactInfoBox: {
    padding: "14px 16px",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    color: "rgba(229,241,236,0.9)",
    lineHeight: 1.6,
  },
  safetyBox: {
    padding: "16px 18px",
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    color: "rgba(229,241,236,0.92)",
    lineHeight: 1.6,
  },
  errorBox: {
    padding: "14px 16px",
    borderRadius: 16,
    border: "1px solid rgba(255,94,94,0.24)",
    background: "rgba(255,94,94,0.12)",
    color: "#ffb7b7",
    fontWeight: 700,
  },
  successBox: {
    padding: "14px 16px",
    borderRadius: 16,
    border: "1px solid rgba(34,211,154,0.22)",
    background: "rgba(34,211,154,0.12)",
    color: "#a4ffd8",
    fontWeight: 800,
  },
  utilityRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
  },
  primaryBtn: {
    border: "none",
    background: "linear-gradient(135deg, #22d39a 0%, #31c3ff 100%)",
    color: "#06110e",
    padding: "15px 20px",
    borderRadius: 18,
    cursor: "pointer",
    fontWeight: 950,
    fontSize: 15,
    boxShadow: "0 18px 40px rgba(27, 193, 150, 0.25)",
  },
  secondaryBtn: {
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    padding: "12px 14px",
    borderRadius: 14,
    cursor: "pointer",
    fontWeight: 800,
  },
  ghostBtnSmall: {
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
    color: "#fff",
    padding: "12px 14px",
    borderRadius: 14,
    cursor: "pointer",
    fontWeight: 800,
  },
  deleteBtn: {
    border: "1px solid rgba(255,94,94,0.22)",
    background: "rgba(255,94,94,0.12)",
    color: "#ffb7b7",
    padding: "12px 14px",
    borderRadius: 14,
    cursor: "pointer",
    fontWeight: 800,
  },
  lastIdBox: {
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    color: "#eaf7f2",
    fontWeight: 700,
    maxWidth: "100%",
    wordBreak: "break-word",
  },
  previewCard: {
    borderRadius: 26,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.05)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.24)",
  },
  previewCardCompact: {
    borderRadius: 22,
  },
  previewMediaWrap: {
    position: "relative",
    height: 230,
    background: "#000",
  },
  previewMedia: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  previewBadge: {
    position: "absolute",
    top: 14,
    left: 14,
    padding: "8px 12px",
    borderRadius: 999,
    background: "rgba(0,0,0,0.45)",
    border: "1px solid rgba(255,255,255,0.12)",
    fontWeight: 900,
    textTransform: "uppercase",
    fontSize: 12,
  },
  previewContent: {
    padding: 18,
  },
  previewTitle: {
    margin: 0,
    fontSize: 24,
    fontWeight: 950,
    lineHeight: 1.05,
  },
  previewMeta: {
    marginTop: 10,
    color: "rgba(224,239,233,0.88)",
    fontWeight: 700,
    lineHeight: 1.5,
  },
  previewDesc: {
    marginTop: 14,
    color: "rgba(238,245,242,0.94)",
    whiteSpace: "pre-wrap",
    lineHeight: 1.65,
    fontSize: 14,
  },
  coordsBox: {
    marginTop: 14,
    padding: "12px 14px",
    borderRadius: 16,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.07)",
    fontSize: 13,
    fontWeight: 800,
    color: "#aef5d6",
  },
  mobileActionBar: {
    position: "fixed",
    left: 10,
    right: 10,
    bottom: 10,
    display: "grid",
    gridTemplateColumns: "0.85fr 0.85fr 1.3fr",
    gap: 8,
    padding: 10,
    borderRadius: 22,
    background: "rgba(7,14,13,0.9)",
    border: "1px solid rgba(255,255,255,0.08)",
    backdropFilter: "blur(18px)",
    boxShadow: "0 18px 40px rgba(0,0,0,0.34)",
    zIndex: 50,
  },
  mobileGhostBtn: {
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    padding: "14px 12px",
    borderRadius: 16,
    fontWeight: 900,
    cursor: "pointer",
  },
  mobilePrimaryBtn: {
    border: "none",
    background: "linear-gradient(135deg, #22d39a 0%, #31c3ff 100%)",
    color: "#06110e",
    padding: "14px 12px",
    borderRadius: 16,
    fontWeight: 950,
    cursor: "pointer",
  },
  modalBackdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.76)",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    padding: 10,
    zIndex: 200,
  },
  modalCard: {
    width: "min(760px, 100%)",
    maxHeight: "92vh",
    overflowY: "auto",
    borderRadius: 24,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "#0b1715",
    boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
  },
  modalHead: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: 16,
    position: "sticky",
    top: 0,
    background: "rgba(11,23,21,0.94)",
    backdropFilter: "blur(14px)",
    zIndex: 2,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 950,
  },
  modalClose: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    cursor: "pointer",
    fontSize: 24,
    lineHeight: 1,
  },
};
