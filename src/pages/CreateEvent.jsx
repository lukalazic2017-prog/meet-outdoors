// src/pages/CreateEvent.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";

function LocationPicker({ lat, lng, onChange }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      onChange({ latitude: lat, longitude: lng });
    },
  });

  return <Marker position={[lat, lng]} />;
}

export default function CreateEvent() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    category: "",
    description: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    locationName: "",
    city: "",
    country: "",
    latitude: 43.9,
    longitude: 21.0,
    isFree: true,
    priceFrom: "",
    organizerName: "",
    websiteUrl: "",
    coverUrl: "",
  });

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [fileUploading, setFileUploading] = useState(false);

  const categoryOptions = [
    "Meetup",
    "Festival",
    "Hiking Day",
    "Running Event",
    "Outdoor Conference",
    "Workshop",
    "Retreat",
    "Charity Event",
    "Climbing Event",
    "Bike Gathering",
  ];

  const countryOptions = [
    "",
    "Serbia",
    "Bosnia & Herzegovina",
    "Croatia",
    "Montenegro",
    "North Macedonia",
    "Albania",
    "Greece",
    "Bulgaria",
    "Romania",
    "Slovenia",
    "Hungary",
    "Austria",
    "Germany",
    "Switzerland",
    "Italy",
    "Spain",
    "France",
    "Portugal",
    "Turkey",
    "Georgia",
    "Cyprus",
    "USA",
    "Canada",
    "Australia",
    "Other",
  ];

  const handleChange = (field) => (e) => {
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCategoryClick = (cat) => {
    setForm((prev) => ({
      ...prev,
      category: cat,
    }));
  };

  const handleLocationChange = ({ latitude, longitude }) => {
    setForm((prev) => ({
      ...prev,
      latitude,
      longitude,
    }));
  };

  const buildDateTime = (date, time) => {
    if (!date && !time) return null;
    if (!date) return null;
    const safeTime = time || "00:00";
    const iso = `${date}T${safeTime}:00`;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  };

  const validate = () => {
    if (!form.title.trim()) return "Title is required.";
    if (!form.category.trim()) return "Please select a category.";
    if (!form.startDate) return "Start date is required.";
    if (!form.country) return "Country is required.";
    return "";
  };
  const handleImageUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  setFileUploading(true);

  const uniqueName = `event_${Date.now()}_${file.name}`;

  const { data, error } = await supabase.storage
    .from("event-covers")
    .upload(uniqueName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.log("Upload error:", error);
    setErrorMsg("Image upload failed.");
    setFileUploading(false);
    return;
  }

  // GET PUBLIC URL
  const { data: urlData } = supabase.storage
    .from("event-covers")
    .getPublicUrl(uniqueName);

  setForm((prev) => ({
    ...prev,
    coverUrl: urlData.publicUrl,
  }));

  setFileUploading(false);
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const validationError = validate();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    setSaving(true);

    const start_time = buildDateTime(form.startDate, form.startTime);
    const end_time = buildDateTime(form.endDate, form.endTime);

    const is_free = !!form.isFree;
    const price_from = is_free
      ? 0
      : form.priceFrom
      ? Number(form.priceFrom)
      : null;

    const payload = {
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || null,
      category: form.category,
      description: form.description.trim() || null,
      start_time,
      end_time,
      location_name: form.locationName.trim() || null,
      city: form.city.trim() || null,
      country: form.country || null,
      latitude: form.latitude,
      longitude: form.longitude,
      is_free,
      price_from,
      organizer_name: form.organizerName.trim() || null,
      website_url: form.websiteUrl.trim() || null,
      cover_url: form.coverUrl.trim() || null,
    };

    try {
      const { data, error } = await supabase
        .from("events")
        .insert([payload])
        .select()
        .single();

      if (error) {
        console.log("Create event error:", error);
        setErrorMsg("Could not create event. Please try again.");
      } else {
        setSuccessMsg("Event created successfully.");
        if (data?.id) {
          navigate(`/event/${data.id}`);
        } else {
          navigate("/events");
        }
      }
    } catch (err) {
      console.log("Create event exception:", err);
      setErrorMsg("Unexpected error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const pricePreview = form.isFree
    ? "Free event"
    : form.priceFrom
    ? `From ${form.priceFrom} €`
    : "Price on request";

  const defaultCover =
    "https://images.pexels.com/photos/3324422/pexels-photo-3324422.jpeg";
  const cover = form.coverUrl || defaultCover;

  const pageStyles = {
    page: {
      minHeight: "100vh",
      padding: "26px 16px 40px",
      background:
        "radial-gradient(circle at top, #010d0e 0%, #020308 45%, #000000 100%)",
      display: "flex",
      justifyContent: "center",
      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      color: "#f6fbf8",
    },
    container: {
      width: "100%",
      maxWidth: 1180,
    },
    headerRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-end",
      gap: 18,
      marginBottom: 18,
      flexWrap: "wrap",
    },
    headerLeft: {
      flex: "1 1 260px",
    },
    badge: {
      display: "inline-flex",
      alignItems: "center",
      padding: "4px 10px",
      borderRadius: 999,
      border: "1px solid rgba(0,255,184,0.6)",
      background: "rgba(0,40,25,0.9)",
      fontSize: 11,
      letterSpacing: "0.16em",
      textTransform: "uppercase",
      color: "rgba(214,244,227,0.9)",
      marginBottom: 8,
    },
    title: {
      fontSize: 30,
      fontWeight: 800,
      marginBottom: 4,
      color: "#f9fffb",
    },
    subtitle: {
      fontSize: 14,
      color: "rgba(225,240,232,0.85)",
    },
    headerRight: {
      textAlign: "right",
      fontSize: 12,
      color: "rgba(220,240,230,0.85)",
    },
    chipRow: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap",
      justifyContent: "flex-end",
      marginTop: 6,
    },
    chip: {
      padding: "4px 9px",
      borderRadius: 999,
      border: "1px solid rgba(110,186,150,0.7)",
      background: "rgba(5,23,16,0.95)",
      fontSize: 11,
    },
    mainGrid: {
      display: "grid",
      gridTemplateColumns: "minmax(0, 3fr) minmax(0, 2.3fr)",
      gap: 18,
      alignItems: "flex-start",
    },
    card: {
      borderRadius: 20,
      padding: 18,
      background:
        "radial-gradient(circle at top left, rgba(10,32,26,0.98), rgba(5,16,13,0.98))",
      border: "1px solid rgba(85,150,120,0.9)",
      boxShadow: "0 22px 60px rgba(0,0,0,0.85)",
      fontSize: 13,
    },
    sectionTitleRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      gap: 8,
      marginBottom: 10,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: 700,
    },
    sectionHint: {
      fontSize: 11,
      color: "rgba(220,240,230,0.7)",
    },
    fieldGrid2: {
      display: "grid",
      gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)",
      gap: 12,
      marginBottom: 10,
    },
    fieldGrid3: {
      display: "grid",
      gridTemplateColumns: "minmax(0,1.2fr) minmax(0,1fr) minmax(0,1fr)",
      gap: 10,
      marginBottom: 10,
    },
    field: {
      display: "flex",
      flexDirection: "column",
      gap: 4,
      marginBottom: 10,
    },
    labelRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      fontSize: 12,
    },
    label: {
      fontWeight: 500,
      color: "rgba(235,250,242,0.95)",
    },
    labelHint: {
      fontSize: 11,
      color: "rgba(200,220,210,0.8)",
    },
    input: {
      borderRadius: 999,
      border: "1px solid rgba(115,185,150,0.9)",
      padding: "8px 12px",
      background: "rgba(4,20,16,0.95)",
      color: "#f6fbf8",
      fontSize: 13,
      outline: "none",
    },
    textarea: {
      borderRadius: 14,
      border: "1px solid rgba(115,185,150,0.9)",
      padding: "10px 12px",
      background: "rgba(4,20,16,0.95)",
      color: "#f6fbf8",
      fontSize: 13,
      minHeight: 90,
      resize: "vertical",
      outline: "none",
    },
    select: {
      borderRadius: 999,
      border: "1px solid rgba(115,185,150,0.9)",
      padding: "8px 12px",
      background: "rgba(4,20,16,0.95)",
      color: "#f6fbf8",
      fontSize: 13,
      outline: "none",
    },
    categoryGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(120px,1fr))",
      gap: 8,
      marginTop: 4,
      marginBottom: 8,
    },
    categoryButton: (active) => ({
      borderRadius: 12,
      padding: "8px 10px",
      border: active
        ? "1px solid rgba(0,255,184,0.9)"
        : "1px solid rgba(125,190,160,0.6)",
      background: active
        ? "linear-gradient(135deg, rgba(0,255,184,0.22), rgba(0,160,110,0.4))"
        : "rgba(5,23,18,0.95)",
      color: active ? "#eafff8" : "rgba(225,240,235,0.9)",
      cursor: "pointer",
      fontSize: 12,
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      gap: 2,
      transition: "all 0.18s ease",
    }),
    categoryLabel: {
      fontWeight: 600,
      fontSize: 12,
    },
    categorySub: {
      fontSize: 11,
      opacity: 0.7,
    },
    toggleRow: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginTop: 4,
      fontSize: 12,
    },
    errorBox: {
      marginTop: 8,
      marginBottom: 4,
      borderRadius: 10,
      padding: "8px 10px",
      background: "rgba(255,60,60,0.08)",
      border: "1px solid rgba(255,100,100,0.8)",
      color: "#ff9a9a",
      fontSize: 12,
    },
    successBox: {
      marginTop: 8,
      marginBottom: 4,
      borderRadius: 10,
      padding: "8px 10px",
      background: "rgba(0,255,160,0.06)",
      border: "1px solid rgba(0,255,160,0.7)",
      color: "#d0ffe8",
      fontSize: 12,
    },
    submitRow: {
      marginTop: 12,
      display: "flex",
      justifyContent: "flex-end",
    },
    submitButton: {
      padding: "9px 22px",
      borderRadius: 999,
      border: "none",
      cursor: "pointer",
      fontWeight: 700,
      fontSize: 13,
      background:
        "linear-gradient(125deg, #00ffb8, #00c287, #00905c)",
      color: "#022015",
      boxShadow: "0 0 20px rgba(0,255,184,0.45)",
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
    },

    // RIGHT SIDE
    previewTitle: {
      fontSize: 13,
      fontWeight: 700,
      marginBottom: 8,
    },
    previewCard: {
      borderRadius: 18,
      overflow: "hidden",
      border: "1px solid rgba(90,150,120,0.9)",
      background:
        "linear-gradient(135deg, rgba(4,18,13,0.98), rgba(6,24,17,0.98))",
      marginBottom: 14,
    },
    previewImgWrapper: {
      height: 150,
      position: "relative",
      overflow: "hidden",
    },
    previewImg: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      transform: "scale(1.03)",
    },
    previewOverlay: {
      position: "absolute",
      inset: 0,
      background:
        "linear-gradient(to top, rgba(0,0,0,0.92), rgba(0,0,0,0.15))",
    },
    previewTitleBox: {
      position: "absolute",
      left: 14,
      bottom: 10,
      right: 14,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-end",
      gap: 8,
    },
    previewStatus: {
      fontSize: 11,
      borderRadius: 999,
      padding: "3px 8px",
      background: "rgba(0,255,184,0.16)",
      border: "1px solid rgba(0,255,184,0.7)",
      color: "#e2fff7",
      textTransform: "uppercase",
      letterSpacing: "0.08em",
    },
    previewPrice: {
      fontSize: 13,
      fontWeight: 700,
      color: "#e6fff5",
    },
    previewBody: {
      padding: 12,
      fontSize: 12,
      color: "rgba(230,244,238,0.9)",
    },
    previewLine: { marginBottom: 4 },

    mapBox: {
      borderRadius: 16,
      overflow: "hidden",
      border: "1px solid rgba(85,145,120,0.9)",
      marginTop: 8,
    },
    mapContainer: {
      height: 220,
      width: "100%",
    },
  };

  const now = new Date();
  const fakeStatus = "Draft";

  return (
    <div style={pageStyles.page}>
      <div style={pageStyles.container}>
        {/* HEADER */}
        <div style={pageStyles.headerRow}>
          <div style={pageStyles.headerLeft}>
            <div style={pageStyles.badge}>Create · Event</div>
            <h1 style={pageStyles.title}>Host an outdoor event.</h1>
            <p style={pageStyles.subtitle}>
              Design a world-class outdoor gathering in a few steps – add
              details, location and pricing, and share it with the community.
            </p>
          </div>

          <div style={pageStyles.headerRight}>
            <div>Today · {now.toLocaleDateString()}</div>
            <div style={pageStyles.chipRow}>
              <span style={pageStyles.chip}>Step 1 · Event details</span>
              <span style={pageStyles.chip}>Step 2 · Preview & publish</span>
            </div>
          </div>
        </div>

        {/* MAIN GRID */}
        <div style={pageStyles.mainGrid}>
          {/* LEFT – FORM */}
          <form style={pageStyles.card} onSubmit={handleSubmit}>
            {/* BASIC INFO */}
            <div style={pageStyles.sectionTitleRow}>
              <div style={pageStyles.sectionTitle}>Basic information</div>
              <div style={pageStyles.sectionHint}>
                Give your event a clear name and short tagline.
              </div>
            </div>

            <div style={pageStyles.field}>
              <div style={pageStyles.labelRow}>
                <span style={pageStyles.label}>Event title *</span>
                <span style={pageStyles.labelHint}>e.g. Balkan Outdoor Meetup 2025</span>
              </div>
              <input
                type="text"
                style={pageStyles.input}
                value={form.title}
                onChange={handleChange("title")}
                placeholder="Name your event"
              />
            </div>

            <div style={pageStyles.field}>
              <div style={pageStyles.labelRow}>
                <span style={pageStyles.label}>Subtitle</span>
                <span style={pageStyles.labelHint}>
                  Short line that sets the vibe.
                </span>
              </div>
              <input
                type="text"
                style={pageStyles.input}
                value={form.subtitle}
                onChange={handleChange("subtitle")}
                placeholder="Optional tagline for your event"
              />
            </div>

            <div style={pageStyles.field}>
              <div style={pageStyles.labelRow}>
                <span style={pageStyles.label}>Category *</span>
                <span style={pageStyles.labelHint}>
                  Choose one that best describes your event.
                </span>
              </div>

              <div style={pageStyles.categoryGrid}>
                {categoryOptions.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    style={pageStyles.categoryButton(form.category === cat)}
                    onClick={() => handleCategoryClick(cat)}
                  >
                    <span style={pageStyles.categoryLabel}>{cat}</span>
                    <span style={pageStyles.categorySub}>
                      {form.category === cat
                        ? "Selected"
                        : "Click to set as main type"}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div style={pageStyles.field}>
              <div style={pageStyles.labelRow}>
                <span style={pageStyles.label}>Description</span>
                <span style={pageStyles.labelHint}>
                  What will happen at this event?
                </span>
              </div>
              <textarea
                style={pageStyles.textarea}
                value={form.description}
                onChange={handleChange("description")}
                placeholder="Share the flow of the day, who it's for, and what to expect."
              />
            </div>

            {/* TIME */}
            <div style={pageStyles.sectionTitleRow}>
              <div style={pageStyles.sectionTitle}>Date & time</div>
              <div style={pageStyles.sectionHint}>
                Set when your event starts and ends.
              </div>
            </div>

            <div style={pageStyles.fieldGrid2}>
              <div style={pageStyles.field}>
                <div style={pageStyles.labelRow}>
                  <span style={pageStyles.label}>Start date *</span>
                </div>
                <input
                  type="date"
                  style={pageStyles.input}
                  value={form.startDate}
                  onChange={handleChange("startDate")}
                />
              </div>

              <div style={pageStyles.field}>
                <div style={pageStyles.labelRow}>
                  <span style={pageStyles.label}>Start time</span>
                </div>
                <input
                  type="time"
                  style={pageStyles.input}
                  value={form.startTime}
                  onChange={handleChange("startTime")}
                />
              </div>
            </div>

            <div style={pageStyles.fieldGrid2}>
              <div style={pageStyles.field}>
                <div style={pageStyles.labelRow}>
                  <span style={pageStyles.label}>End date</span>
                </div>
                <input
                  type="date"
                  style={pageStyles.input}
                  value={form.endDate}
                  onChange={handleChange("endDate")}
                />
              </div>

              <div style={pageStyles.field}>
                <div style={pageStyles.labelRow}>
                  <span style={pageStyles.label}>End time</span>
                </div>
                <input
                  type="time"
                  style={pageStyles.input}
                  value={form.endTime}
                  onChange={handleChange("endTime")}
                />
              </div>
            </div>

            {/* LOCATION */}
            <div style={pageStyles.sectionTitleRow}>
              <div style={pageStyles.sectionTitle}>Location</div>
              <div style={pageStyles.sectionHint}>
                You can add an exact spot, city and country.
              </div>
            </div>

            <div style={pageStyles.field}>
              <div style={pageStyles.labelRow}>
                <span style={pageStyles.label}>Location name</span>
                <span style={pageStyles.labelHint}>
                  e.g. Kopaonik, Lake Ohrid, Durmitor Basecamp
                </span>
              </div>
              <input
                type="text"
                style={pageStyles.input}
                value={form.locationName}
                onChange={handleChange("locationName")}
                placeholder="Trailhead, hut, camp or venue name"
              />
            </div>

            <div style={pageStyles.fieldGrid3}>
              <div style={pageStyles.field}>
                <div style={pageStyles.labelRow}>
                  <span style={pageStyles.label}>City</span>
                </div>
                <input
                  type="text"
                  style={pageStyles.input}
                  value={form.city}
                  onChange={handleChange("city")}
                  placeholder="City or region"
                />
              </div>

              <div style={pageStyles.field}>
                <div style={pageStyles.labelRow}>
                  <span style={pageStyles.label}>Country *</span>
                </div>
                <select
                  style={pageStyles.select}
                  value={form.country}
                  onChange={handleChange("country")}
                >
                  {countryOptions.map((c) => (
                    <option key={c} value={c}>
                      {c || "Select country"}
                    </option>
                  ))}
                </select>
              </div>

              <div style={pageStyles.field}>
                <div style={pageStyles.labelRow}>
                  <span style={pageStyles.label}>Coordinates</span>
                  <span style={pageStyles.labelHint}>
                    Click on the map to set
                  </span>
                </div>
                <div
                  style={{
                    borderRadius: 999,
                    border: "1px solid rgba(115,185,150,0.9)",
                    padding: "7px 11px",
                    background: "rgba(4,20,16,0.95)",
                    fontSize: 12,
                  }}
                >
                  {form.latitude.toFixed(4)}, {form.longitude.toFixed(4)}
                </div>
              </div>
            </div>

            {/* PRICING */}
            <div style={pageStyles.sectionTitleRow}>
              <div style={pageStyles.sectionTitle}>Pricing</div>
              <div style={pageStyles.sectionHint}>
                Decide if this event is free or paid.
              </div>
            </div>

            <div style={pageStyles.toggleRow}>
              <input
                type="checkbox"
                id="isFree"
                checked={form.isFree}
                onChange={handleChange("isFree")}
              />
              <label htmlFor="isFree">
                This is a <strong>free event</strong>
              </label>
            </div>

            {!form.isFree && (
              <div style={{ ...pageStyles.field, marginTop: 8 }}>
                <div style={pageStyles.labelRow}>
                  <span style={pageStyles.label}>Price from</span>
                  <span style={pageStyles.labelHint}>
                    Minimum ticket or participation fee.
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  style={pageStyles.input}
                  value={form.priceFrom}
                  onChange={handleChange("priceFrom")}
                  placeholder="e.g. 20 (EUR)"
                />
              </div>
            )}

            {/* ORGANIZER */}
            <div style={pageStyles.sectionTitleRow}>
              <div style={pageStyles.sectionTitle}>Organizer</div>
              <div style={pageStyles.sectionHint}>
                Let people know who is behind this event.
              </div>
            </div>

            <div style={pageStyles.fieldGrid2}>
              <div style={pageStyles.field}>
                <div style={pageStyles.labelRow}>
                  <span style={pageStyles.label}>Organizer name</span>
                </div>
                <input
                  type="text"
                  style={pageStyles.input}
                  value={form.organizerName}
                  onChange={handleChange("organizerName")}
                  placeholder="Your name or organization"
                />
              </div>

              <div style={pageStyles.field}>
                <div style={pageStyles.labelRow}>
                  <span style={pageStyles.label}>Event website</span>
                </div>
                <input
                  type="url"
                  style={pageStyles.input}
                  value={form.websiteUrl}
                  onChange={handleChange("websiteUrl")}
                  placeholder="Optional external link"
                />
              </div>
            </div>

            {/* COVER URL */}
            <div style={pageStyles.field}>
              <div style={pageStyles.labelRow}>
                <span style={pageStyles.label}>Cover image URL</span>
                <span style={pageStyles.labelHint}>
                  Paste a direct image link (we'll use it as a hero image).
                </span>
              </div>
              <input
                type="url"
                style={pageStyles.input}
                value={form.coverUrl}
                onChange={handleChange("coverUrl")}
                placeholder="https://…"
              />
            </div>
            <div style={{ marginTop: 8, marginBottom: 12 }}>
  <input
    type="file"
    accept="image/*"
    onChange={handleImageUpload}
    style={{ color: "white" }}
  />
  {fileUploading && (
    <div style={{ fontSize: 12, marginTop: 4, color: "#8affc1" }}>
      Uploading image…
    </div>
  )}
</div>

            {errorMsg && <div style={pageStyles.errorBox}>{errorMsg}</div>}
            {successMsg && <div style={pageStyles.successBox}>{successMsg}</div>}

            <div style={pageStyles.submitRow}>
              <button
                type="submit"
                style={pageStyles.submitButton}
                disabled={saving}
              >
                {saving ? "Saving…" : "Save event"}
                {!saving && <span>➜</span>}
              </button>
            </div>
          </form>

          {/* RIGHT – LIVE PREVIEW + MAP */}
          <div style={pageStyles.card}>
            <div style={pageStyles.previewTitle}>Live preview</div>

            <div style={pageStyles.previewCard}>
              <div style={pageStyles.previewImgWrapper}>
                <img
                  src={cover}
                  alt="preview"
                  style={pageStyles.previewImg}
                />
                <div style={pageStyles.previewOverlay} />
                <div style={pageStyles.previewTitleBox}>
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "rgba(255,255,255,0.85)",
                        marginBottom: 3,
                      }}
                    >
                      {form.category || "Event category"}
                    </div>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: "#f7fff9",
                      }}
                    >
                      {form.title || "Your event title will appear here"}
                    </div>
                    {form.subtitle && (
                      <div
                        style={{
                          fontSize: 12,
                          color: "rgba(230,245,240,0.8)",
                          marginTop: 2,
                        }}
                      >
                        {form.subtitle}
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={pageStyles.previewStatus}>{fakeStatus}</div>
                    <div style={pageStyles.previewPrice}>{pricePreview}</div>
                  </div>
                </div>
              </div>

              <div style={pageStyles.previewBody}>
                <div style={pageStyles.previewLine}>
                  📅{" "}
                  {form.startDate
                    ? form.startDate
                    : "Pick a start date"}{" "}
                  {form.startTime && `· ${form.startTime}`}
                </div>
                <div style={pageStyles.previewLine}>
                  📍{" "}
                  {form.locationName ||
                    form.city ||
                    form.country ||
                    "Location will be shown here"}
                </div>
                {form.description && (
                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 11,
                      opacity: 0.8,
                    }}
                  >
                    {form.description.slice(0, 140)}
                    {form.description.length > 140 ? "…" : ""}
                  </div>
                )}
              </div>
            </div>

            <div style={pageStyles.previewTitle}>Location map</div>
            <div style={pageStyles.sectionHint}>
              Click on the map to update the marker position.
            </div>

            <div style={pageStyles.mapBox}>
              <MapContainer
                center={[form.latitude, form.longitude]}
                zoom={7}
                scrollWheelZoom={true}
                style={pageStyles.mapContainer}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <LocationPicker
                  lat={form.latitude}
                  lng={form.longitude}
                  onChange={handleLocationChange}
                />
              </MapContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}