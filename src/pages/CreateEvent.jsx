// src/pages/CreateEvent.jsx
import React, { useState, useEffect } from "react";
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

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 860 : false
  );

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUser(user);

        const { data: profileData, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (!error) setProfile(profileData);
      }
    };

    loadUser();
  }, []);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 860);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isVerifiedCreator =
    profile?.is_verified === true ||
    profile?.is_verified_creator === true ||
    profile?.creator_status === "approved";

  const isSchoolOrInstructor =
    profile?.account_type === "school" || profile?.account_type === "instructor";

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

    isTraining: false,
    trainingType: "",
    skillLevel: "all_levels",
    equipmentIncluded: false,
    certificateIncluded: false,
    trainingLanguage: "",
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
    "Ski School Event",
    "Paragliding School Event",
    "Diving School Event",
    "Climbing School Event",
    "Survival Training Event",
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

  const trainingTypesList = [
    { value: "ski_training", label: "Ski Training" },
    { value: "paragliding_training", label: "Paragliding Training" },
    { value: "diving_training", label: "Diving Training" },
    { value: "climbing_training", label: "Climbing Training" },
    { value: "survival_training", label: "Survival Training" },
    { value: "kayak_training", label: "Kayak Training" },
    { value: "horse_riding_training", label: "Horse Riding Training" },
    { value: "cycling_training", label: "Cycling Training" },
    { value: "hiking_training", label: "Hiking Training" },
    { value: "camping_training", label: "Camping Training" },
    { value: "other", label: "Other Training" },
  ];

  const skillLevelsList = [
    { value: "beginner", label: "Beginner" },
    { value: "intermediate", label: "Intermediate" },
    { value: "advanced", label: "Advanced" },
    { value: "all_levels", label: "All Levels" },
  ];

  const handleChange = (field) => (e) => {
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCategoryClick = (cat) => {
    setForm((prev) => ({ ...prev, category: cat }));
  };

  const handleLocationChange = ({ latitude, longitude }) => {
    setForm((prev) => ({ ...prev, latitude, longitude }));
  };

  const buildDateTime = (date, time) => {
    if (!date) return null;
    const safeTime = time || "00:00";
    const d = new Date(`${date}T${safeTime}:00`);
    return isNaN(d.getTime()) ? null : d.toISOString();
  };

  const validate = () => {
    if (!form.title.trim()) return "Title is required.";
    if (!form.category) return "Category is required.";
    if (!form.startDate) return "Start date is required.";
    if (!form.country) return "Country is required.";
    if (!user) return "You must be logged in.";
    if (!isVerifiedCreator)
      return "You must be a verified creator to publish events.";

    if (form.isTraining) {
      if (!form.trainingType) return "Training type is required.";
      if (!form.skillLevel) return "Skill level is required.";
    }

    return "";
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileUploading(true);
    setErrorMsg("");

    const fileName = `event_${Date.now()}_${file.name}`;

    const { error } = await supabase.storage
      .from("event-covers")
      .upload(fileName, file);

    if (error) {
      setErrorMsg("Image upload failed.");
      setFileUploading(false);
      return;
    }

    const { data } = supabase.storage
      .from("event-covers")
      .getPublicUrl(fileName);

    setForm((prev) => ({ ...prev, coverUrl: data.publicUrl }));
    setFileUploading(false);
  };

  const handleSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const validationError = validate();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    setSaving(true);

    const payload = {
      title: form.title.trim(),
      subtitle: form.subtitle || null,
      category: form.category,
      description: form.description || null,
      start_time: buildDateTime(form.startDate, form.startTime),
      end_time: buildDateTime(form.endDate, form.endTime),
      location_name: form.locationName || null,
      city: form.city || null,
      country: form.country,
      latitude: form.latitude,
      longitude: form.longitude,
      is_free: form.isFree,
      price_from: form.isFree ? 0 : Number(form.priceFrom) || null,
      organizer_name:
        form.organizerName || profile?.school_name || profile?.full_name || null,
      website_url: form.websiteUrl || profile?.website_url || null,
      cover_url: form.coverUrl || null,
      creator_id: user.id,

      is_training: form.isTraining,
      training_type: form.isTraining ? form.trainingType : null,
      instructor_id:
        form.isTraining && profile?.account_type === "instructor" ? user.id : null,
      school_profile_id:
        form.isTraining &&
        (profile?.account_type === "school" ||
          profile?.account_type === "instructor")
          ? user.id
          : null,
      skill_level: form.isTraining ? form.skillLevel : null,
      equipment_included: form.isTraining ? form.equipmentIncluded : false,
      certificate_included: form.isTraining ? form.certificateIncluded : false,
      training_language: form.isTraining ? form.trainingLanguage || null : null,
    };

    const { data, error } = await supabase
      .from("events")
      .insert([payload])
      .select()
      .single();

    if (error) {
      setErrorMsg(error.message);
    } else {
      setSuccessMsg(
        form.isTraining
          ? "Training event created successfully."
          : "Event created successfully."
      );
      navigate(`/event/${data.id}`);
    }

    setSaving(false);
  };

  const defaultCover =
    "https://images.pexels.com/photos/3324422/pexels-photo-3324422.jpeg";
  const cover = form.coverUrl || defaultCover;
  const pricePreview = form.isFree
    ? "Free event"
    : form.priceFrom
    ? `From ${form.priceFrom} €`
    : "Price on request";

  const fakeStatus = form.isTraining ? "Training" : "Draft";
  

  const styles = {
    page: {
      minHeight: "100vh",
      padding: isMobile ? "98px 0 36px" : "118px 0 48px",
      background:
        "radial-gradient(1000px 420px at 8% -5%, rgba(0,255,184,0.16), transparent 60%)," +
        "radial-gradient(900px 400px at 100% 10%, rgba(0,170,255,0.12), transparent 58%)," +
        "radial-gradient(850px 340px at 50% 100%, rgba(124,77,255,0.10), transparent 55%)," +
        "linear-gradient(180deg, #041512 0%, #02070b 42%, #000000 100%)",
      display: "flex",
      justifyContent: "center",
      fontFamily:
        "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      color: "#f6fbf8",
      overflowX: "hidden",
      boxSizing: "border-box",
    },

    container: {
      width: "100%",
      maxWidth: 1280,
      padding: isMobile ? "0 12px" : "0 16px",
      boxSizing: "border-box",
    },

    hero: {
      position: "relative",
      minHeight: isMobile ? 320 : 280,
      borderRadius: isMobile ? 28 : 32,
      overflow: "hidden",
      marginBottom: 18,
      boxShadow: "0 30px 90px rgba(0,0,0,0.55)",
      border: "1px solid rgba(255,255,255,0.08)",
      background:
        "radial-gradient(650px 250px at 10% 0%, rgba(0,255,184,0.14), transparent 60%)," +
        "radial-gradient(650px 280px at 90% 0%, rgba(0,170,255,0.10), transparent 60%)," +
        "linear-gradient(180deg, rgba(8,22,18,0.98), rgba(3,10,8,1))",
    },

    heroOverlay: {
      position: "absolute",
      inset: 0,
      background:
        "linear-gradient(180deg, rgba(0,0,0,0.18), rgba(0,0,0,0.68) 72%, rgba(0,0,0,0.84))",
    },

    heroGlow: {
      position: "absolute",
      inset: 0,
      background:
        "radial-gradient(700px 240px at 8% 0%, rgba(0,255,184,0.12), transparent 48%)," +
        "radial-gradient(460px 220px at 92% 8%, rgba(124,77,255,0.10), transparent 50%)",
      pointerEvents: "none",
    },

    heroInner: {
      position: "relative",
      zIndex: 2,
      padding: isMobile ? "18px 16px 20px" : "24px 26px 24px",
    },

    heroTop: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: isMobile ? "flex-start" : "center",
      gap: 10,
      flexWrap: "wrap",
    },

    badge: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "7px 12px",
      borderRadius: 999,
      border: "1px solid rgba(255,255,255,0.14)",
      background: "rgba(255,255,255,0.08)",
      backdropFilter: "blur(14px)",
      fontSize: 11,
      letterSpacing: "0.14em",
      textTransform: "uppercase",
      color: "rgba(214,244,227,0.94)",
      fontWeight: 900,
      boxShadow: "0 10px 24px rgba(0,0,0,0.20)",
    },

    heroTitle: {
      fontSize: isMobile ? 34 : 52,
      lineHeight: isMobile ? 1 : 0.96,
      fontWeight: 1000,
      letterSpacing: "-0.05em",
      color: "#f9fffb",
      margin: isMobile ? "22px 0 8px" : "28px 0 8px",
      maxWidth: 780,
      textShadow: "0 14px 34px rgba(0,0,0,0.45)",
    },

    heroSubtitle: {
      fontSize: isMobile ? 13 : 15,
      lineHeight: 1.65,
      maxWidth: 760,
      color: "rgba(225,240,232,0.82)",
    },

    heroStats: {
      marginTop: 16,
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))",
      gap: 10,
    },

    heroStat: {
      padding: isMobile ? "12px 12px" : "14px 14px",
      borderRadius: 18,
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(255,255,255,0.08)",
      backdropFilter: "blur(16px)",
      boxShadow: "0 14px 34px rgba(0,0,0,0.18)",
    },

    mainGrid: {
      display: "grid",
      gridTemplateColumns: isMobile
        ? "1fr"
        : "minmax(0, 1.55fr) minmax(380px, 0.95fr)",
      gap: 18,
      alignItems: "start",
    },

    card: {
      borderRadius: isMobile ? 22 : 24,
      padding: isMobile ? 14 : 18,
      background:
        "linear-gradient(145deg, rgba(8,18,16,0.72), rgba(3,10,8,0.68))",
      border: "1px solid rgba(255,255,255,0.08)",
      boxShadow: "0 22px 60px rgba(0,0,0,0.55)",
      backdropFilter: "blur(18px)",
      fontSize: 13,
      overflow: "hidden",
    },

    rightStack: {
      display: "flex",
      flexDirection: "column",
      gap: 18,
      position: "static",
    },

    sectionTitleRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      gap: 8,
      marginBottom: 12,
      flexWrap: "wrap",
    },

    sectionTitle: {
      fontSize: 12,
      fontWeight: 900,
      marginBottom: 0,
      textTransform: "uppercase",
      letterSpacing: "0.12em",
      color: "rgba(210,255,230,0.88)",
    },

    sectionHint: {
      fontSize: 11,
      color: "rgba(220,240,230,0.66)",
      lineHeight: 1.45,
    },

    block: {
      marginBottom: 18,
      paddingBottom: 18,
      borderBottom: "1px solid rgba(255,255,255,0.06)",
    },

    fieldGrid2: {
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "minmax(0,1fr) minmax(0,1fr)",
      gap: 10,
      marginBottom: 10,
    },

    fieldGrid3: {
      display: "grid",
      gridTemplateColumns: isMobile
        ? "1fr"
        : "minmax(0,1.2fr) minmax(0,1fr) minmax(0,1fr)",
      gap: 10,
      marginBottom: 10,
    },

    field: {
      display: "flex",
      flexDirection: "column",
      gap: 6,
      marginBottom: 10,
    },

    labelRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 8,
      flexWrap: "wrap",
      fontSize: 12,
    },

    label: {
      fontWeight: 700,
      color: "rgba(235,250,242,0.96)",
    },

    labelHint: {
      fontSize: 11,
      color: "rgba(200,220,210,0.74)",
    },

    input: {
      borderRadius: 14,
      border: "1px solid rgba(255,255,255,0.12)",
      padding: isMobile ? "12px 12px" : "11px 12px",
      background: "rgba(0,0,0,0.42)",
      color: "#f6fbf8",
      fontSize: 14,
      fontWeight: 600,
      outline: "none",
      boxSizing: "border-box",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
    },

    textarea: {
      borderRadius: 16,
      border: "1px solid rgba(255,255,255,0.12)",
      padding: "12px 12px",
      background: "rgba(0,0,0,0.42)",
      color: "#f6fbf8",
      fontSize: 14,
      minHeight: isMobile ? 120 : 100,
      resize: "vertical",
      outline: "none",
      lineHeight: 1.6,
      boxSizing: "border-box",
    },

    select: {
      borderRadius: 14,
      border: "1px solid rgba(255,255,255,0.12)",
      padding: isMobile ? "12px 12px" : "11px 12px",
      background: "rgba(0,0,0,0.42)",
      color: "#f6fbf8",
      fontSize: 14,
      fontWeight: 600,
      outline: "none",
    },

    categoryGrid: {
      display: "grid",
      gridTemplateColumns: isMobile
        ? "1fr 1fr"
        : "repeat(auto-fit, minmax(140px,1fr))",
      gap: 8,
      marginTop: 4,
      marginBottom: 8,
    },

    categoryButton: (active) => ({
      borderRadius: 16,
      padding: isMobile ? "12px 10px" : "10px 10px",
      border: active
        ? "1px solid rgba(0,255,184,0.70)"
        : "1px solid rgba(255,255,255,0.10)",
      background: active
        ? "linear-gradient(135deg, rgba(0,255,184,0.18), rgba(0,130,92,0.32))"
        : "rgba(255,255,255,0.05)",
      color: active ? "#eafff8" : "rgba(225,240,235,0.92)",
      cursor: "pointer",
      fontSize: 12,
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      gap: 4,
      transition: "all 0.18s ease",
      boxShadow: active ? "0 14px 36px rgba(0,255,184,0.10)" : "none",
      textAlign: "left",
    }),

    categoryLabel: {
      fontWeight: 800,
      fontSize: 12,
      lineHeight: 1.25,
    },

    categorySub: {
      fontSize: 11,
      opacity: 0.72,
      lineHeight: 1.35,
    },

    toggleRow: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      marginTop: 4,
      fontSize: 13,
      padding: "12px 12px",
      borderRadius: 16,
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(255,255,255,0.08)",
    },

    uploader: {
      marginTop: 8,
      marginBottom: 12,
      padding: "14px 14px",
      borderRadius: 18,
      border: "1px dashed rgba(255,255,255,0.18)",
      background:
        "radial-gradient(circle at top left, rgba(0,255,184,0.10), rgba(0,0,0,0.28))",
    },

    errorBox: {
      marginTop: 10,
      marginBottom: 4,
      borderRadius: 14,
      padding: "11px 12px",
      background: "rgba(255,60,60,0.10)",
      border: "1px solid rgba(255,100,100,0.44)",
      color: "#ffb8b8",
      fontSize: 12,
      lineHeight: 1.5,
    },

    successBox: {
      marginTop: 10,
      marginBottom: 4,
      borderRadius: 14,
      padding: "11px 12px",
      background: "rgba(0,255,160,0.08)",
      border: "1px solid rgba(0,255,160,0.38)",
      color: "#d0ffe8",
      fontSize: 12,
      lineHeight: 1.5,
    },

    submitRow: {
      marginTop: 16,
      display: "flex",
      justifyContent: isMobile ? "stretch" : "flex-end",
      position: "relative",
      zIndex: 1,
    },

    submitButton: {
      width: isMobile ? "100%" : "auto",
      padding: isMobile ? "15px 20px" : "12px 24px",
      borderRadius: 999,
      border: "none",
      cursor: "pointer",
      fontWeight: 900,
      fontSize: 13,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      background: "linear-gradient(125deg, #00ffb8, #00c287, #00905c)",
      color: "#022015",
      boxShadow: "0 0 24px rgba(0,255,184,0.28)",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      opacity: saving || !isVerifiedCreator ? 0.7 : 1,
    },

    previewTitle: {
      fontSize: 12,
      fontWeight: 900,
      marginBottom: 12,
      textTransform: "uppercase",
      letterSpacing: "0.12em",
      color: "rgba(210,255,230,0.88)",
    },

    previewCard: {
      borderRadius: 24,
      overflow: "hidden",
      border: "1px solid rgba(255,255,255,0.08)",
      background:
        "linear-gradient(135deg, rgba(4,18,13,0.98), rgba(6,24,17,0.98))",
      marginBottom: 14,
      boxShadow: "0 24px 60px rgba(0,0,0,0.40)",
    },

    previewImgWrapper: {
      height: isMobile ? 220 : 240,
      position: "relative",
      overflow: "hidden",
    },

    previewImg: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      transform: "scale(1.03)",
      filter: "saturate(1.08) contrast(1.03)",
    },

    previewOverlay: {
      position: "absolute",
      inset: 0,
      background:
        "linear-gradient(to top, rgba(0,0,0,0.92), rgba(0,0,0,0.18))",
    },

    previewTitleBox: {
      position: "absolute",
      left: 14,
      bottom: 12,
      right: 14,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-end",
      gap: 10,
    },

    previewStatus: {
      fontSize: 11,
      borderRadius: 999,
      padding: "5px 10px",
      background: "rgba(0,255,184,0.16)",
      border: "1px solid rgba(0,255,184,0.52)",
      color: "#e2fff7",
      textTransform: "uppercase",
      letterSpacing: "0.10em",
      fontWeight: 900,
      backdropFilter: "blur(10px)",
    },

    previewPrice: {
      marginTop: 8,
      fontSize: 13,
      fontWeight: 900,
      color: "#e6fff5",
      textAlign: "right",
      textShadow: "0 8px 24px rgba(0,0,0,0.55)",
    },

    previewBody: {
      padding: 14,
      fontSize: 12,
      color: "rgba(230,244,238,0.9)",
      lineHeight: 1.55,
    },

    previewLine: { marginBottom: 6 },

    statMiniGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 10,
      marginTop: 12,
      marginBottom: 14,
    },

    statMini: {
      padding: "12px 12px",
      borderRadius: 18,
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(255,255,255,0.08)",
      boxShadow: "0 14px 34px rgba(0,0,0,0.18)",
    },

    mapBox: {
      borderRadius: 20,
      overflow: "hidden",
      border: "1px solid rgba(255,255,255,0.08)",
      marginTop: 10,
      boxShadow: "0 22px 60px rgba(0,0,0,0.34)",
    },

    mapContainer: {
      height: isMobile ? 300 : 320,
      width: "100%",
    },
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.hero}>
          <div style={styles.heroOverlay} />
          <div style={styles.heroGlow} />
          <div style={styles.heroInner}>
            <div style={styles.heroTop}>
              <div style={styles.badge}>
                {form.isTraining
                  ? "🎓 Create · Training Event"
                  : "⚡ Create · Event"}
              </div>
              <div style={styles.badge}>
                {isVerifiedCreator
                  ? "✅ Verified creator"
                  : "🔒 Verification required"}
              </div>
            </div>

            <h1 style={styles.heroTitle}>
              {form.isTraining
                ? "Create a training event people instantly trust."
                : "Host an outdoor event that feels premium instantly."}
            </h1>

            <p style={styles.heroSubtitle}>
              Add the vibe, location, timing, pricing and visuals in one place.
              {form.isTraining
                ? " Perfect for schools, instructors and structured outdoor learning."
                : " This screen is built to feel polished on desktop and even stronger on mobile."}
            </p>

            <div style={styles.heroStats}>
              <div style={styles.heroStat}>
                <div style={{ fontSize: 22, fontWeight: 1000 }}>
                  {form.category || "Type"}
                </div>
                <div style={{ fontSize: 12, opacity: 0.72, marginTop: 4 }}>
                  event category
                </div>
              </div>
              <div style={styles.heroStat}>
                <div style={{ fontSize: 22, fontWeight: 1000 }}>
                  {form.isFree ? "Free" : pricePreview}
                </div>
                <div style={{ fontSize: 12, opacity: 0.72, marginTop: 4 }}>
                  pricing mode
                </div>
              </div>
              <div style={styles.heroStat}>
                <div style={{ fontSize: 22, fontWeight: 1000 }}>
                  {form.country || "Country"}
                </div>
                <div style={{ fontSize: 12, opacity: 0.72, marginTop: 4 }}>
                  location target
                </div>
              </div>
              <div style={styles.heroStat}>
                <div style={{ fontSize: 22, fontWeight: 1000 }}>
                  {form.isTraining ? "PRO" : "LIVE"}
                </div>
                <div style={{ fontSize: 12, opacity: 0.72, marginTop: 4 }}>
                  {form.isTraining ? "training mode" : "preview updates"}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.mainGrid}>
          <form style={styles.card} onSubmit={handleSubmit}>
            <div style={styles.block}>
              <div style={styles.sectionTitleRow}>
                <div style={styles.sectionTitle}>Basic information</div>
                <div style={styles.sectionHint}>
                  Give the event a clear identity and strong first impression.
                </div>
              </div>

              <div style={styles.field}>
                <div style={styles.labelRow}>
                  <span style={styles.label}>Event title *</span>
                  <span style={styles.labelHint}>
                    e.g. Balkan Outdoor Meetup 2025
                  </span>
                </div>
                <input
                  type="text"
                  style={styles.input}
                  value={form.title}
                  onChange={handleChange("title")}
                  placeholder="Name your event"
                />
              </div>

              <div style={styles.field}>
                <div style={styles.labelRow}>
                  <span style={styles.label}>Subtitle</span>
                  <span style={styles.labelHint}>
                    One strong sentence that sets the vibe.
                  </span>
                </div>
                <input
                  type="text"
                  style={styles.input}
                  value={form.subtitle}
                  onChange={handleChange("subtitle")}
                  placeholder="Optional tagline for your event"
                />
              </div>

              <div style={styles.field}>
                <div style={styles.labelRow}>
                  <span style={styles.label}>Category *</span>
                  <span style={styles.labelHint}>
                    Choose the main type people will instantly recognize.
                  </span>
                </div>

                <div style={styles.categoryGrid}>
                  {categoryOptions.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      style={styles.categoryButton(form.category === cat)}
                      onClick={() => handleCategoryClick(cat)}
                    >
                      <span style={styles.categoryLabel}>{cat}</span>
                      <span style={styles.categorySub}>
                        {form.category === cat ? "Selected" : "Tap to choose"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div style={styles.field}>
                <div style={styles.labelRow}>
                  <span style={styles.label}>Description</span>
                  <span style={styles.labelHint}>
                    Tell people what they can expect.
                  </span>
                </div>
                <textarea
                  style={styles.textarea}
                  value={form.description}
                  onChange={handleChange("description")}
                  placeholder={
                    form.isTraining
                      ? "Describe structure, safety, skill level, instructor guidance, equipment and what people will learn."
                      : "Share the flow of the day, audience, energy, highlights, logistics and what makes this event worth joining."
                  }
                />
              </div>
            </div>

            <div style={styles.block}>
              <div style={styles.sectionTitleRow}>
                <div style={styles.sectionTitle}>Event mode</div>
                <div style={styles.sectionHint}>
                  Turn this on for schools, academies and instructor-led sessions.
                </div>
              </div>

              <div style={styles.toggleRow}>
                <input
                  type="checkbox"
                  id="isTraining"
                  checked={form.isTraining}
                  onChange={handleChange("isTraining")}
                />
                <label htmlFor="isTraining">
                  This is a <strong>training / school event</strong>
                  {isSchoolOrInstructor ? " (recommended for your profile)" : ""}
                </label>
              </div>
            </div>

            {form.isTraining && (
              <div style={styles.block}>
                <div style={styles.sectionTitleRow}>
                  <div style={styles.sectionTitle}>Training details</div>
                  <div style={styles.sectionHint}>
                    Add structured learning info people look for instantly.
                  </div>
                </div>

                <div style={styles.fieldGrid2}>
                  <div style={styles.field}>
                    <div style={styles.labelRow}>
                      <span style={styles.label}>Training type *</span>
                    </div>
                    <select
                      style={styles.select}
                      value={form.trainingType}
                      onChange={handleChange("trainingType")}
                    >
                      <option value="">Select training type</option>
                      {trainingTypesList.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={styles.field}>
                    <div style={styles.labelRow}>
                      <span style={styles.label}>Skill level *</span>
                    </div>
                    <select
                      style={styles.select}
                      value={form.skillLevel}
                      onChange={handleChange("skillLevel")}
                    >
                      {skillLevelsList.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={styles.fieldGrid2}>
                  <div style={styles.field}>
                    <div style={styles.labelRow}>
                      <span style={styles.label}>Training language</span>
                    </div>
                    <input
                      type="text"
                      style={styles.input}
                      value={form.trainingLanguage}
                      onChange={handleChange("trainingLanguage")}
                      placeholder="English / Serbian / German"
                    />
                  </div>

                  <div style={styles.field}>
                    <div style={styles.labelRow}>
                      <span style={styles.label}>Organizer profile type</span>
                    </div>
                    <input
                      type="text"
                      style={styles.input}
                      value={profile?.account_type || "creator"}
                      disabled
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gap: 10 }}>
                  <div style={styles.toggleRow}>
                    <input
                      type="checkbox"
                      id="equipmentIncluded"
                      checked={form.equipmentIncluded}
                      onChange={handleChange("equipmentIncluded")}
                    />
                    <label htmlFor="equipmentIncluded">
                      Equipment included
                    </label>
                  </div>

                  <div style={styles.toggleRow}>
                    <input
                      type="checkbox"
                      id="certificateIncluded"
                      checked={form.certificateIncluded}
                      onChange={handleChange("certificateIncluded")}
                    />
                    <label htmlFor="certificateIncluded">
                      Certificate included
                    </label>
                  </div>
                </div>
              </div>
            )}

            <div style={styles.block}>
              <div style={styles.sectionTitleRow}>
                <div style={styles.sectionTitle}>Date & time</div>
                <div style={styles.sectionHint}>
                  Set the rhythm of the event precisely.
                </div>
              </div>

              <div style={styles.fieldGrid2}>
                <div style={styles.field}>
                  <div style={styles.labelRow}>
                    <span style={styles.label}>Start date *</span>
                  </div>
                  <input
                    type="date"
                    style={styles.input}
                    value={form.startDate}
                    onChange={handleChange("startDate")}
                  />
                </div>

                <div style={styles.field}>
                  <div style={styles.labelRow}>
                    <span style={styles.label}>Start time</span>
                  </div>
                  <input
                    type="time"
                    style={styles.input}
                    value={form.startTime}
                    onChange={handleChange("startTime")}
                  />
                </div>
              </div>

              <div style={styles.fieldGrid2}>
                <div style={styles.field}>
                  <div style={styles.labelRow}>
                    <span style={styles.label}>End date</span>
                  </div>
                  <input
                    type="date"
                    style={styles.input}
                    value={form.endDate}
                    onChange={handleChange("endDate")}
                  />
                </div>

                <div style={styles.field}>
                  <div style={styles.labelRow}>
                    <span style={styles.label}>End time</span>
                  </div>
                  <input
                    type="time"
                    style={styles.input}
                    value={form.endTime}
                    onChange={handleChange("endTime")}
                  />
                </div>
              </div>
            </div>

            <div style={styles.block}>
              <div style={styles.sectionTitleRow}>
                <div style={styles.sectionTitle}>Location</div>
                <div style={styles.sectionHint}>
                  Exact place, city, country and pin on map.
                </div>
              </div>

              <div style={styles.field}>
                <div style={styles.labelRow}>
                  <span style={styles.label}>Location name</span>
                  <span style={styles.labelHint}>
                    e.g. Kopaonik, Lake Ohrid, Durmitor Basecamp
                  </span>
                </div>
                <input
                  type="text"
                  style={styles.input}
                  value={form.locationName}
                  onChange={handleChange("locationName")}
                  placeholder="Trailhead, camp, venue or exact place"
                />
              </div>

              <div style={styles.fieldGrid3}>
                <div style={styles.field}>
                  <div style={styles.labelRow}>
                    <span style={styles.label}>City</span>
                  </div>
                  <input
                    type="text"
                    style={styles.input}
                    value={form.city}
                    onChange={handleChange("city")}
                    placeholder="City or region"
                  />
                </div>

                <div style={styles.field}>
                  <div style={styles.labelRow}>
                    <span style={styles.label}>Country *</span>
                  </div>
                  <select
                    style={styles.select}
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

                <div style={styles.field}>
                  <div style={styles.labelRow}>
                    <span style={styles.label}>Coordinates</span>
                    <span style={styles.labelHint}>Tap map below</span>
                  </div>
                  <div
                    style={{
                      ...styles.input,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {form.latitude.toFixed(4)}, {form.longitude.toFixed(4)}
                  </div>
                </div>
              </div>
            </div>

            <div style={styles.block}>
              <div style={styles.sectionTitleRow}>
                <div style={styles.sectionTitle}>Pricing</div>
                <div style={styles.sectionHint}>
                  Make it free or set a visible starting price.
                </div>
              </div>

              <div style={styles.toggleRow}>
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
                <div style={{ ...styles.field, marginTop: 10 }}>
                  <div style={styles.labelRow}>
                    <span style={styles.label}>Price from</span>
                    <span style={styles.labelHint}>
                      Minimum ticket or participation fee
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    style={styles.input}
                    value={form.priceFrom}
                    onChange={handleChange("priceFrom")}
                    placeholder="e.g. 20 (EUR)"
                  />
                </div>
              )}
            </div>

            <div style={styles.block}>
              <div style={styles.sectionTitleRow}>
                <div style={styles.sectionTitle}>Organizer</div>
                <div style={styles.sectionHint}>
                  Add trust with your name and event site.
                </div>
              </div>

              <div style={styles.fieldGrid2}>
                <div style={styles.field}>
                  <div style={styles.labelRow}>
                    <span style={styles.label}>Organizer name</span>
                  </div>
                  <input
                    type="text"
                    style={styles.input}
                    value={form.organizerName}
                    onChange={handleChange("organizerName")}
                    placeholder="Your name or organization"
                  />
                </div>

                <div style={styles.field}>
                  <div style={styles.labelRow}>
                    <span style={styles.label}>Event website</span>
                  </div>
                  <input
                    type="url"
                    style={styles.input}
                    value={form.websiteUrl}
                    onChange={handleChange("websiteUrl")}
                    placeholder="Optional external link"
                  />
                </div>
              </div>
            </div>

            <div style={styles.block}>
              <div style={styles.sectionTitleRow}>
                <div style={styles.sectionTitle}>Visuals</div>
                <div style={styles.sectionHint}>
                  Paste a cover URL or upload an image directly.
                </div>
              </div>

              <div style={styles.field}>
                <div style={styles.labelRow}>
                  <span style={styles.label}>Cover image URL</span>
                  <span style={styles.labelHint}>
                    Direct image link for the event hero
                  </span>
                </div>
                <input
                  type="url"
                  style={styles.input}
                  value={form.coverUrl}
                  onChange={handleChange("coverUrl")}
                  placeholder="https://…"
                />
              </div>

              <div style={styles.uploader}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ color: "white", width: "100%" }}
                />
                {fileUploading && (
                  <div style={{ fontSize: 12, marginTop: 8, color: "#8affc1" }}>
                    Uploading image…
                  </div>
                )}
              </div>
            </div>

            {errorMsg && <div style={styles.errorBox}>{errorMsg}</div>}
            {successMsg && <div style={styles.successBox}>{successMsg}</div>}

            <div style={styles.submitRow}>
              <button
                type="submit"
                style={styles.submitButton}
                disabled={saving || !isVerifiedCreator}
              >
                {saving
                  ? "Saving…"
                  : form.isTraining
                  ? "Save training event"
                  : "Save event"}
                {!saving && <span>➜</span>}
              </button>
            </div>
          </form>

          <div style={styles.rightStack}>
            <div style={styles.card}>
              <div style={styles.previewTitle}>Live preview</div>

              <div style={styles.previewCard}>
                <div style={styles.previewImgWrapper}>
                  <img src={cover} alt="preview" style={styles.previewImg} />
                  <div style={styles.previewOverlay} />

                  <div style={styles.previewTitleBox}>
                    <div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "rgba(255,255,255,0.86)",
                          marginBottom: 4,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          fontWeight: 900,
                        }}
                      >
                        {form.isTraining
                          ? "Training event"
                          : form.category || "Event category"}
                      </div>

                      <div
                        style={{
                          fontSize: isMobile ? 18 : 22,
                          fontWeight: 1000,
                          lineHeight: 1.05,
                          color: "#f7fff9",
                          letterSpacing: "-0.03em",
                          maxWidth: 260,
                        }}
                      >
                        {form.title || "Your event title will appear here"}
                      </div>

                      {form.subtitle && (
                        <div
                          style={{
                            fontSize: 12,
                            color: "rgba(230,245,240,0.80)",
                            marginTop: 4,
                            lineHeight: 1.45,
                            maxWidth: 260,
                          }}
                        >
                          {form.subtitle}
                        </div>
                      )}
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div style={styles.previewStatus}>{fakeStatus}</div>
                      <div style={styles.previewPrice}>{pricePreview}</div>
                    </div>
                  </div>
                </div>

                <div style={styles.previewBody}>
                  <div style={styles.previewLine}>
                    📅 {form.startDate ? form.startDate : "Pick a start date"}{" "}
                    {form.startTime && `· ${form.startTime}`}
                  </div>
                  <div style={styles.previewLine}>
                    📍{" "}
                    {form.locationName ||
                      form.city ||
                      form.country ||
                      "Location will be shown here"}
                  </div>
                  <div style={styles.previewLine}>
                    🌍 {form.country || "Choose a country"}
                  </div>
                  {form.isTraining && (
                    <>
                      <div style={styles.previewLine}>
                        🎯{" "}
                        {skillLevelsList.find((s) => s.value === form.skillLevel)
                          ?.label || "All Levels"}
                      </div>
                      {form.trainingLanguage && (
                        <div style={styles.previewLine}>
                          🗣 {form.trainingLanguage}
                        </div>
                      )}
                      {form.equipmentIncluded && (
                        <div style={styles.previewLine}>🧰 Equipment included</div>
                      )}
                      {form.certificateIncluded && (
                        <div style={styles.previewLine}>📜 Certificate included</div>
                      )}
                    </>
                  )}
                  {form.description && (
                    <div
                      style={{
                        marginTop: 8,
                        fontSize: 11,
                        opacity: 0.82,
                      }}
                    >
                      {form.description.slice(0, 150)}
                      {form.description.length > 150 ? "…" : ""}
                    </div>
                  )}
                </div>
              </div>

              <div style={styles.statMiniGrid}>
                <div style={styles.statMini}>
                  <div style={{ fontSize: 11, opacity: 0.66 }}>Price</div>
                  <div style={{ fontSize: 15, fontWeight: 900, marginTop: 4 }}>
                    {pricePreview}
                  </div>
                </div>
                <div style={styles.statMini}>
                  <div style={{ fontSize: 11, opacity: 0.66 }}>Status</div>
                  <div style={{ fontSize: 15, fontWeight: 900, marginTop: 4 }}>
                    {fakeStatus}
                  </div>
                </div>
              </div>
            </div>

            <div style={styles.card}>
              <div style={styles.previewTitle}>Location map</div>
              <div style={styles.sectionHint}>
                Tap on the map to move the marker and set the exact event position.
              </div>

              <div style={styles.mapBox}>
                <MapContainer
                  center={[form.latitude, form.longitude]}
                  zoom={7}
                  scrollWheelZoom={true}
                  style={styles.mapContainer}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <LocationPicker
                    lat={form.latitude}
                    lng={form.longitude}
                    onChange={handleLocationChange}
                  />
                </MapContainer>
              </div>

              <div style={{ ...styles.statMiniGrid, marginBottom: 0 }}>
                <div style={styles.statMini}>
                  <div style={{ fontSize: 11, opacity: 0.66 }}>Latitude</div>
                  <div style={{ fontSize: 14, fontWeight: 900, marginTop: 4 }}>
                    {form.latitude.toFixed(4)}
                  </div>
                </div>
                <div style={styles.statMini}>
                  <div style={{ fontSize: 11, opacity: 0.66 }}>Longitude</div>
                  <div style={{ fontSize: 14, fontWeight: 900, marginTop: 4 }}>
                    {form.longitude.toFixed(4)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {!isVerifiedCreator && (
          <div
            style={{
              marginTop: 16,
              borderRadius: 18,
              padding: "14px 16px",
              background: "rgba(255,60,60,0.10)",
              border: "1px solid rgba(255,100,100,0.30)",
              color: "#ffd0d0",
              fontSize: 13,
              lineHeight: 1.55,
            }}
          >
            You must be a verified creator to publish events.
          </div>
        )}
      </div>
    </div>
  );
}