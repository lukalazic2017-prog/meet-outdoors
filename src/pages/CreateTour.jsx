// src/pages/CreateTour.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function LocationMarker({ onSelect, selectedPosition }) {
  const [position, setPosition] = useState(selectedPosition || null);

  useEffect(() => {
    if (selectedPosition) setPosition(selectedPosition);
  }, [selectedPosition]);

  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  return position ? <Marker position={position} /> : null;
}

export default function CreateTour() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [activity, setActivity] = useState("");
  const [country, setCountry] = useState("");
  const [locationName, setLocationName] = useState("");
  const [description, setDescription] = useState("");

  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [price, setPrice] = useState("");
  const [maxPeople, setMaxPeople] = useState("");
  const [applicationDeadline, setApplicationDeadline] = useState("");
  const [isLegalEntity, setIsLegalEntity] = useState(false);

  const [isTraining, setIsTraining] = useState(false);
  const [trainingType, setTrainingType] = useState("");
  const [skillLevel, setSkillLevel] = useState("all_levels");
  const [durationLabel, setDurationLabel] = useState("");
  const [equipmentIncluded, setEquipmentIncluded] = useState(false);
  const [certificateIncluded, setCertificateIncluded] = useState(false);
  const [trainingSpotsLeft, setTrainingSpotsLeft] = useState("");
  const [trainingLanguage, setTrainingLanguage] = useState("");

  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [galleryPreviews, setGalleryPreviews] = useState([]);

  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);

  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 860 : false
  );

  const isVerifiedCreator =
    profile?.is_verified === true ||
    profile?.is_verified_creator === true ||
    profile?.creator_status === "approved";

  const isSchoolOrInstructor =
    profile?.account_type === "school" || profile?.account_type === "instructor";

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 860);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    async function loadUserAndProfile() {
      const { data } = await supabase.auth.getUser();
      const authUser = data.user || null;
      setUser(authUser);

      if (!authUser) return;

      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (error) {
        console.log("PROFILE LOAD ERROR:", error);
        return;
      }

      setProfile(profileData);
    }

    loadUserAndProfile();
  }, []);

  useEffect(() => {
    return () => {
      if (coverPreview) {
        try {
          URL.revokeObjectURL(coverPreview);
        } catch {}
      }

      if (videoPreview) {
        try {
          URL.revokeObjectURL(videoPreview);
        } catch {}
      }

      galleryPreviews.forEach((p) => {
        try {
          URL.revokeObjectURL(p);
        } catch {}
      });
    };
  }, [coverPreview, videoPreview, galleryPreviews]);

  const activitiesList = [
    "Hiking",
    "Cycling",
    "Bicycling",
    "Running / Marathon",
    "Paragliding",
    "Parasailing",
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
    "Ski School",
    "Paragliding School",
    "Diving School",
    "Climbing School",
    "Survival School",
    "Kayak School",
    "Horse Riding School",
    "Cycling School",
    "Hiking School",
    "Camping School",
    "Other",
  ];

  const countriesList = [
    "Albania",
    "Austria",
    "Bosnia and Herzegovina",
    "Bulgaria",
    "Croatia",
    "Czech Republic",
    "France",
    "Germany",
    "Greece",
    "Hungary",
    "Italy",
    "Montenegro",
    "North Macedonia",
    "Romania",
    "Serbia",
    "Slovakia",
    "Slovenia",
    "Spain",
    "Switzerland",
    "Turkey",
    "United Kingdom",
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

  function handleCoverChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (coverPreview) URL.revokeObjectURL(coverPreview);

    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  function handleGalleryChange(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const combined = [...galleryFiles, ...files].slice(0, 6);

    galleryPreviews.forEach((p) => {
      try {
        URL.revokeObjectURL(p);
      } catch {}
    });

    setGalleryFiles(combined);
    setGalleryPreviews(combined.map((f) => URL.createObjectURL(f)));
  }

  function handleGalleryDrop(e) {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files || []);
    if (!files.length) return;

    const combined = [...galleryFiles, ...files].slice(0, 6);

    galleryPreviews.forEach((p) => {
      try {
        URL.revokeObjectURL(p);
      } catch {}
    });

    setGalleryFiles(combined);
    setGalleryPreviews(combined.map((f) => URL.createObjectURL(f)));
  }

  function preventDefault(e) {
    e.preventDefault();
  }

  function handleVideoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (videoPreview) URL.revokeObjectURL(videoPreview);

    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  }

  function removeCover() {
    if (coverPreview) {
      try {
        URL.revokeObjectURL(coverPreview);
      } catch {}
    }
    setCoverFile(null);
    setCoverPreview(null);
  }

  function removeGalleryImage(index) {
    const removedPreview = galleryPreviews[index];
    if (removedPreview) {
      try {
        URL.revokeObjectURL(removedPreview);
      } catch {}
    }

    const newFiles = galleryFiles.filter((_, i) => i !== index);
    const newPreviews = galleryPreviews.filter((_, i) => i !== index);

    setGalleryFiles(newFiles);
    setGalleryPreviews(newPreviews);
  }

  function clearGallery() {
    galleryPreviews.forEach((p) => {
      try {
        URL.revokeObjectURL(p);
      } catch {}
    });
    setGalleryFiles([]);
    setGalleryPreviews([]);
  }

  function removeVideo() {
    if (videoPreview) {
      try {
        URL.revokeObjectURL(videoPreview);
      } catch {}
    }
    setVideoFile(null);
    setVideoPreview(null);
  }

  function validate() {
    if (!title.trim()) return "Tour title is required.";
    if (!activity.trim()) return "Please select an activity.";
    if (!country.trim()) return "Please select a country.";
    if (!locationName.trim()) return "Location name is required.";
    if (!dateStart) return "Start date is required.";
    if (!dateEnd) return "End date is required.";
    if (!price || Number(price) <= 0) return "Price must be greater than 0.";
    if (!maxPeople || Number(maxPeople) <= 0)
      return "Max people must be greater than 0.";
    if (!description.trim()) return "Description is required.";
    if (latitude === null || longitude === null)
      return "Please pick a location on the map.";
    if (!coverFile) return "Cover image is required.";
    if (!applicationDeadline) return "Application deadline is required.";

    if (isTraining) {
      if (!trainingType) return "Please select a training type.";
      if (!skillLevel) return "Please select a skill level.";
      if (trainingSpotsLeft !== "" && Number(trainingSpotsLeft) < 0) {
        return "Training spots left cannot be negative.";
      }
    }

    return null;
  }

  async function handleSubmit(e) {
    if (e?.preventDefault) e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const validationError = validate();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    if (!user) {
      setErrorMsg("You must be logged in to create a tour.");
      return;
    }

    setLoading(true);

    try {
      let coverUrl = null;
      if (coverFile) {
        const ext = coverFile.name.split(".").pop();
        const fileName = `cover-${Date.now()}.${ext}`;
        const { data: coverData, error: coverError } = await supabase.storage
          .from("tour-images")
          .upload(fileName, coverFile);

        if (coverError) throw coverError;

        const { data: publicUrlData } = supabase.storage
          .from("tour-images")
          .getPublicUrl(coverData.path);

        coverUrl = publicUrlData.publicUrl;
      }

      const galleryUrls = [];
      for (const file of galleryFiles) {
        const ext = file.name.split(".").pop();
        const fileName = `gallery-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}.${ext}`;

        const { data: gData, error: gError } = await supabase.storage
          .from("tour-images")
          .upload(fileName, file);

        if (gError) throw gError;

        const { data: publicUrlData } = supabase.storage
          .from("tour-images")
          .getPublicUrl(gData.path);

        galleryUrls.push(publicUrlData.publicUrl);
      }

      let videoUrl = null;
      if (videoFile) {
        const ext = videoFile.name.split(".").pop();
        const fileName = `video-${Date.now()}.${ext}`;
        const { data: vData, error: vError } = await supabase.storage
          .from("tour-videos")
          .upload(fileName, videoFile);

        if (vError) throw vError;

        const { data: publicVideoUrlData } = supabase.storage
          .from("tour-videos")
          .getPublicUrl(vData.path);

        videoUrl = publicVideoUrlData.publicUrl;
      }

      const deadlineISO = applicationDeadline
        ? new Date(applicationDeadline).toISOString()
        : null;

      const startISO = dateStart ? new Date(dateStart).toISOString() : null;
      const endISO = dateEnd ? new Date(dateEnd).toISOString() : null;

      const insertPayload = {
        title,
        activity,
        country,
        location_name: locationName,
        description,
        date_start: startISO,
        date_end: endISO,
        price: Number(price),
        max_people: Number(maxPeople),
        is_legal_entity: isLegalEntity,
        latitude,
        longitude,
        cover_url: coverUrl,
        image_urls: galleryUrls,
        video_url: videoUrl,
        application_deadline: deadlineISO,
        status: "ACTIVE",
        user_id: user.id,
        creator_id: user.id,

        is_training: isTraining,
        training_type: isTraining ? trainingType : null,
        instructor_id:
          isTraining && profile?.account_type === "instructor" ? user.id : null,
        school_profile_id:
          isTraining &&
          (profile?.account_type === "school" ||
            profile?.account_type === "instructor")
            ? user.id
            : null,
        skill_level: isTraining ? skillLevel : null,
        duration_label: isTraining ? durationLabel || null : null,
        equipment_included: isTraining ? equipmentIncluded : false,
        certificate_included: isTraining ? certificateIncluded : false,
        training_spots_left:
          isTraining && trainingSpotsLeft !== ""
            ? Number(trainingSpotsLeft)
            : null,
        training_language: isTraining ? trainingLanguage || null : null,
      };

      const { error: insertError } = await supabase
        .from("tours")
        .insert([insertPayload]);

      if (insertError) {
        if (insertError.code === "42501") {
          setErrorMsg(
            "⛔ You must be a verified creator to publish tours. Apply for verification."
          );
          setLoading(false);
          return;
        }

        setErrorMsg(insertError.message);
        setLoading(false);
        return;
      }

      setSuccessMsg(
        isTraining
          ? "Training tour created successfully! 🎓"
          : "Tour created successfully! 🌿"
      );

      setTimeout(() => navigate("/my-tours"), 1200);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Error creating tour. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const selectedPosition =
    latitude !== null && longitude !== null ? [latitude, longitude] : null;

  const showVerifiedBanner =
    !!errorMsg &&
    (errorMsg.includes("verified creator") || errorMsg.startsWith("⛔"));

  const NAVBAR_OFFSET = isMobile ? 84 : 112;

  const pageWrapperStyle = {
    minHeight: "100vh",
    padding: isMobile
      ? `${NAVBAR_OFFSET + 16}px 0 42px`
      : `${NAVBAR_OFFSET + 18}px 0 56px`,
      marginTop: -120,
    background:
      "radial-gradient(1000px 420px at 8% -6%, rgba(0,255,170,0.18), transparent 60%)," +
      "radial-gradient(920px 400px at 100% 8%, rgba(0,185,255,0.14), transparent 60%)," +
      "radial-gradient(900px 360px at 50% 100%, rgba(124,77,255,0.10), transparent 58%)," +
      "linear-gradient(180deg, #071e16 0%, #030b08 48%, #010404 100%)",
    color: "#ffffff",
    boxSizing: "border-box",
    overflowX: "hidden",
    fontFamily:
      "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  };

  const containerStyle = {
    maxWidth: "1280px",
    margin: "0 auto",
    padding: isMobile ? "0 12px" : "0 16px",
    boxSizing: "border-box",
  };

  const heroStyle = {
    position: "relative",
    minHeight: isMobile ? 330 : 260,
    borderRadius: isMobile ? 28 : 30,
    overflow: "hidden",
    marginBottom: 18,
    boxShadow: "0 30px 100px rgba(0,0,0,0.62)",
    border: "1px solid rgba(255,255,255,0.08)",
    background:
      "radial-gradient(700px 260px at 12% 0%, rgba(0,255,170,0.18), transparent 60%)," +
      "radial-gradient(700px 300px at 88% 0%, rgba(0,185,255,0.12), transparent 60%)," +
      "linear-gradient(180deg, rgba(8,30,22,0.96), rgba(2,10,7,0.98))",
  };

  const heroOverlayStyle = {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(180deg, rgba(0,0,0,0.18), rgba(0,0,0,0.72) 72%, rgba(0,0,0,0.88))",
  };

  const heroGlowStyle = {
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(700px 260px at 12% 0%, rgba(0,255,170,0.16), transparent 50%)," +
      "radial-gradient(520px 220px at 90% 10%, rgba(124,77,255,0.14), transparent 55%)",
    pointerEvents: "none",
  };

  const heroInnerStyle = {
    position: "relative",
    zIndex: 2,
    padding: isMobile ? "18px 16px 20px" : "22px 24px 24px",
  };

  const heroTopRowStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: isMobile ? "flex-start" : "center",
    gap: 10,
    flexWrap: "wrap",
  };

  const heroBadgeStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "7px 12px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.08)",
    backdropFilter: "blur(14px)",
    color: "rgba(220,255,240,0.92)",
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    boxShadow: "0 10px 24px rgba(0,0,0,0.20)",
  };

  const heroTitleStyle = {
    margin: isMobile ? "24px 0 8px" : "28px 0 8px",
    fontSize: isMobile ? 34 : 52,
    lineHeight: isMobile ? 1 : 0.95,
    fontWeight: 1000,
    letterSpacing: "-0.05em",
    maxWidth: "820px",
    textShadow: "0 14px 34px rgba(0,0,0,0.52)",
  };

  const heroSubtitleStyle = {
    fontSize: isMobile ? 13 : 15,
    lineHeight: 1.65,
    maxWidth: "760px",
    color: "rgba(230,255,242,0.78)",
  };

  const heroStatsStyle = {
    marginTop: 16,
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))",
    gap: 10,
  };

  const heroStatStyle = {
    padding: isMobile ? "12px 12px" : "14px 14px",
    borderRadius: 18,
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.10)",
    backdropFilter: "blur(16px)",
    boxShadow: "0 14px 34px rgba(0,0,0,0.22)",
  };

  const layoutStyle = {
    marginTop: 12,
    display: "grid",
    gridTemplateColumns: isMobile
      ? "1fr"
      : "minmax(0, 1.7fr) minmax(360px, 0.95fr)",
    gap: 20,
    alignItems: "start",
  };

  const cardStyle = {
    background:
      "linear-gradient(145deg, rgba(8,18,14,0.72), rgba(4,10,8,0.68))",
    borderRadius: isMobile ? 22 : 24,
    padding: isMobile ? 14 : 18,
    boxShadow: "0 22px 70px rgba(0,0,0,0.60)",
    border: "1px solid rgba(255,255,255,0.08)",
    backdropFilter: "blur(18px)",
    overflow: "hidden",
  };

  const rightStackStyle = {
    display: "flex",
    flexDirection: "column",
    gap: 18,
    position: "static",
  };

  const sectionTitleStyle = {
    fontSize: 12,
    fontWeight: 900,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    color: "rgba(210,255,230,0.88)",
  };

  const sectionBlockStyle = {
    marginBottom: 18,
    paddingBottom: 18,
    borderBottom: "1px solid rgba(255,255,255,0.07)",
  };

  const labelStyle = {
    fontSize: 12,
    marginBottom: 6,
    color: "rgba(255,255,255,0.86)",
    fontWeight: 700,
  };

  const inputBaseStyle = {
    width: "100%",
    padding: isMobile ? "12px 12px" : "11px 12px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.42)",
    color: "#ffffff",
    fontSize: 14,
    fontWeight: 600,
    outline: "none",
    boxSizing: "border-box",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
  };

  const textareaStyle = {
    ...inputBaseStyle,
    minHeight: isMobile ? 120 : 110,
    resize: "vertical",
    lineHeight: 1.55,
  };

  const selectStyle = {
    ...inputBaseStyle,
    appearance: "none",
    WebkitAppearance: "none",
    MozAppearance: "none",
    backgroundImage:
      "linear-gradient(45deg, transparent 50%, #00ffb0 60%), linear-gradient(135deg, #00ffb0 40%, transparent 50%)",
    backgroundPosition: "calc(100% - 18px) 17px, calc(100% - 10px) 17px",
    backgroundSize: "8px 8px, 8px 8px",
    backgroundRepeat: "no-repeat",
  };

  const hintTextStyle = {
    fontSize: 11,
    color: "rgba(255,255,255,0.58)",
    marginTop: 5,
    lineHeight: 1.5,
  };

  const row2Style = {
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
    gap: 10,
  };

  const uploadBoxStyle = {
    borderRadius: 18,
    border: "1px dashed rgba(255,255,255,0.22)",
    padding: isMobile ? 14 : 16,
    cursor: "pointer",
    display: "block",
    background:
      "radial-gradient(circle at top left, rgba(0,255,160,0.16), rgba(0,0,0,0.88))",
    boxShadow: "0 14px 40px rgba(0,0,0,0.30)",
  };

  const previewFrameStyle = {
    borderRadius: 16,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.16)",
    boxShadow: "0 18px 40px rgba(0,0,0,0.40)",
    background: "rgba(0,0,0,0.35)",
  };

  const removeBtnStyle = {
    padding: "8px 11px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(0,0,0,0.50)",
    color: "rgba(255,255,255,0.92)",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  };

  const removeXStyle = {
    position: "absolute",
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.20)",
    background: "rgba(0,0,0,0.62)",
    color: "white",
    cursor: "pointer",
    display: "grid",
    placeItems: "center",
    fontSize: 14,
    lineHeight: 1,
    zIndex: 2,
  };

  const errorStyle = {
    marginTop: 12,
    fontSize: 13,
    padding: "12px 13px",
    borderRadius: 14,
    background: "rgba(255,60,80,0.14)",
    border: "1px solid rgba(255,90,110,0.52)",
    color: "#ffd8de",
    lineHeight: 1.5,
  };

  const successStyle = {
    marginTop: 12,
    fontSize: 13,
    padding: "12px 13px",
    borderRadius: 14,
    background: "rgba(0,255,150,0.10)",
    border: "1px solid rgba(0,255,150,0.40)",
    color: "#c9ffe8",
    lineHeight: 1.5,
  };

  const submitBtnStyle = {
    marginTop: 14,
    width: "100%",
    padding: isMobile ? "15px 14px" : "13px 14px",
    borderRadius: 999,
    border: "none",
    background:
      "linear-gradient(135deg, #00ffb0 0%, #00cf7c 42%, #02a45d 100%)",
    color: "#02140b",
    fontSize: 15,
    fontWeight: 900,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    cursor: "pointer",
    boxShadow: "0 16px 40px rgba(0,255,165,0.28)",
  };

  const miniPillStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    fontSize: 12,
    padding: "7px 10px",
    borderRadius: 999,
    background: "rgba(0,0,0,0.42)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "rgba(240,255,246,0.90)",
    fontWeight: 700,
    flexWrap: "wrap",
  };

  const applyInlineLinkStyle = {
    textDecoration: "underline",
    cursor: "pointer",
    fontWeight: 800,
    color: "#fff",
  };

  const mapContainerOuterStyle = {
    marginTop: 4,
    borderRadius: 18,
    overflow: "hidden",
    border: "1px solid rgba(0,255,160,0.22)",
    boxShadow: "0 16px 40px rgba(0,0,0,0.55)",
  };

  const statCardSmallStyle = {
    padding: "12px 12px",
    borderRadius: 18,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 16px 36px rgba(0,0,0,0.24)",
  };

  return (
    <div style={pageWrapperStyle}>
      <div style={containerStyle}>
        <div style={heroStyle}>
          <div style={heroOverlayStyle} />
          <div style={heroGlowStyle} />
          <div style={heroInnerStyle}>
            <div style={heroTopRowStyle}>
              <div style={heroBadgeStyle}>🗺️ Create a new tour</div>
              <div style={heroBadgeStyle}>
                {isVerifiedCreator
                  ? "✅ Verified creator"
                  : "🔒 Verification required"}
              </div>
            </div>

            <h1 style={heroTitleStyle}>
              {isTraining
                ? "Create a training people instantly trust."
                : "Create a tour that people instantly want to join."}
            </h1>

            <p style={heroSubtitleStyle}>
              Add a powerful title, clean visuals, precise map point, honest
              details and a polished preview.
              {isTraining
                ? " Perfect for schools, instructors and certified outdoor experiences."
                : " This page is built to feel like a real app, especially on mobile."}
            </p>

            <div style={heroStatsStyle}>
              <div style={heroStatStyle}>
                <div style={{ fontSize: 22, fontWeight: 1000 }}>1</div>
                <div style={{ fontSize: 12, opacity: 0.72, marginTop: 4 }}>
                  Cover image required
                </div>
              </div>
              <div style={heroStatStyle}>
                <div style={{ fontSize: 22, fontWeight: 1000 }}>6</div>
                <div style={{ fontSize: 12, opacity: 0.72, marginTop: 4 }}>
                  Gallery photos max
                </div>
              </div>
              <div style={heroStatStyle}>
                <div style={{ fontSize: 22, fontWeight: 1000 }}>1</div>
                <div style={{ fontSize: 12, opacity: 0.72, marginTop: 4 }}>
                  Exact map point
                </div>
              </div>
              <div style={heroStatStyle}>
                <div style={{ fontSize: 22, fontWeight: 1000 }}>
                  {isTraining ? "PRO" : "LIVE"}
                </div>
                <div style={{ fontSize: 12, opacity: 0.72, marginTop: 4 }}>
                  {isTraining
                    ? "Training mode enabled"
                    : "Preview updates instantly"}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={layoutStyle}>
          <form style={cardStyle} onSubmit={handleSubmit}>
            <div style={sectionBlockStyle}>
              <div style={sectionTitleStyle}>Basic information</div>

              <div style={{ marginBottom: 12 }}>
                <div style={labelStyle}>Tour title *</div>
                <input
                  style={inputBaseStyle}
                  placeholder={
                    isTraining
                      ? "Example: Beginner Paragliding School Weekend"
                      : "Example: Sunrise hike to Vlasina Lake"
                  }
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div style={row2Style}>
                <div>
                  <div style={labelStyle}>Activity *</div>
                  <select
                    style={selectStyle}
                    value={activity}
                    onChange={(e) => setActivity(e.target.value)}
                  >
                    <option value="">Select activity</option>
                    {activitiesList.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div style={labelStyle}>Country *</div>
                  <select
                    style={selectStyle}
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  >
                    <option value="">Select country</option>
                    {countriesList.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <div style={labelStyle}>Location name *</div>
                <input
                  style={inputBaseStyle}
                  placeholder="Example: Vlasina Lake, South Serbia"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                />
                <div style={hintTextStyle}>
                  This is what people will notice first on cards and tour
                  details.
                </div>
              </div>
            </div>

            <div style={sectionBlockStyle}>
              <div style={sectionTitleStyle}>Tour mode</div>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  fontSize: 13,
                  cursor: "pointer",
                  padding: "12px 12px",
                  borderRadius: 16,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  marginBottom: 10,
                }}
              >
                <input
                  type="checkbox"
                  checked={isTraining}
                  onChange={(e) => setIsTraining(e.target.checked)}
                  style={{ width: 16, height: 16 }}
                />
                <span>
                  This is a training / school experience
                  {isSchoolOrInstructor
                    ? " (recommended for your profile type)"
                    : ""}
                </span>
              </label>

              <div style={hintTextStyle}>
                Turn this on for ski schools, paragliding lessons, diving
                training, climbing instruction, survival camps and similar
                experiences.
              </div>
            </div>

            {isTraining && (
              <div style={sectionBlockStyle}>
                <div style={sectionTitleStyle}>Training details</div>

                <div style={{ ...row2Style, marginBottom: 12 }}>
                  <div>
                    <div style={labelStyle}>Training type *</div>
                    <select
                      style={selectStyle}
                      value={trainingType}
                      onChange={(e) => setTrainingType(e.target.value)}
                    >
                      <option value="">Select training type</option>
                      {trainingTypesList.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div style={labelStyle}>Skill level *</div>
                    <select
                      style={selectStyle}
                      value={skillLevel}
                      onChange={(e) => setSkillLevel(e.target.value)}
                    >
                      {skillLevelsList.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ ...row2Style, marginBottom: 12 }}>
                  <div>
                    <div style={labelStyle}>Duration label</div>
                    <input
                      style={inputBaseStyle}
                      placeholder="Example: 2-day training / 4h lesson"
                      value={durationLabel}
                      onChange={(e) => setDurationLabel(e.target.value)}
                    />
                  </div>

                  <div>
                    <div style={labelStyle}>Training language</div>
                    <input
                      style={inputBaseStyle}
                      placeholder="Example: English / Serbian / German"
                      value={trainingLanguage}
                      onChange={(e) => setTrainingLanguage(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ ...row2Style, marginBottom: 12 }}>
                  <div>
                    <div style={labelStyle}>Training spots left</div>
                    <input
                      style={inputBaseStyle}
                      type="number"
                      min="0"
                      placeholder="Example: 6"
                      value={trainingSpotsLeft}
                      onChange={(e) => setTrainingSpotsLeft(e.target.value)}
                    />
                  </div>

                  <div>
                    <div style={labelStyle}>Organizer profile type</div>
                    <input
                      style={inputBaseStyle}
                      value={
                        profile?.account_type ? profile.account_type : "creator"
                      }
                      disabled
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gap: 10 }}>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      fontSize: 13,
                      cursor: "pointer",
                      padding: "12px 12px",
                      borderRadius: 16,
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={equipmentIncluded}
                      onChange={(e) => setEquipmentIncluded(e.target.checked)}
                      style={{ width: 16, height: 16 }}
                    />
                    <span>Equipment included</span>
                  </label>

                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      fontSize: 13,
                      cursor: "pointer",
                      padding: "12px 12px",
                      borderRadius: 16,
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={certificateIncluded}
                      onChange={(e) => setCertificateIncluded(e.target.checked)}
                      style={{ width: 16, height: 16 }}
                    />
                    <span>Certificate included</span>
                  </label>
                </div>
              </div>
            )}

            <div style={sectionBlockStyle}>
              <div style={sectionTitleStyle}>Schedule & pricing</div>

              <div style={{ ...row2Style, marginBottom: 12 }}>
                <div>
                  <div style={labelStyle}>Start date *</div>
                  <input
                    style={inputBaseStyle}
                    type="date"
                    value={dateStart}
                    onChange={(e) => setDateStart(e.target.value)}
                  />
                </div>

                <div>
                  <div style={labelStyle}>End date *</div>
                  <input
                    style={inputBaseStyle}
                    type="date"
                    value={dateEnd}
                    onChange={(e) => setDateEnd(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ ...row2Style, marginBottom: 12 }}>
                <div>
                  <div style={labelStyle}>Price (€) *</div>
                  <input
                    style={inputBaseStyle}
                    type="number"
                    min="0"
                    placeholder="Example: 120"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>

                <div>
                  <div style={labelStyle}>Max people *</div>
                  <input
                    style={inputBaseStyle}
                    type="number"
                    min="1"
                    placeholder="Example: 8"
                    value={maxPeople}
                    onChange={(e) => setMaxPeople(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <div style={labelStyle}>Applications open until *</div>
                <input
                  style={inputBaseStyle}
                  type="datetime-local"
                  value={applicationDeadline}
                  onChange={(e) => setApplicationDeadline(e.target.value)}
                />
                <div style={hintTextStyle}>
                  After this deadline, users can no longer apply and the tour
                  will disappear from public lists.
                </div>
              </div>
            </div>

            <div style={sectionBlockStyle}>
              <div style={sectionTitleStyle}>Description</div>
              <textarea
                style={textareaStyle}
                placeholder={
                  isTraining
                    ? "Describe lesson structure, safety, equipment, instructor, who it is for, what people will learn and what makes this training special..."
                    : "Describe route, difficulty, equipment, atmosphere, food, transport, weather and what makes this tour special..."
                }
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div style={sectionBlockStyle}>
              <div style={sectionTitleStyle}>Organizer type</div>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  fontSize: 13,
                  cursor: "pointer",
                  padding: "12px 12px",
                  borderRadius: 16,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <input
                  type="checkbox"
                  checked={isLegalEntity}
                  onChange={(e) => setIsLegalEntity(e.target.checked)}
                  style={{ width: 16, height: 16 }}
                />
                <span>This tour is created by a legal entity (company)</span>
              </label>
            </div>

            <div style={sectionBlockStyle}>
              <div style={sectionTitleStyle}>Images & video</div>

              <div style={{ marginBottom: 16 }}>
                <div style={labelStyle}>Cover image (1) *</div>
                <label style={uploadBoxStyle}>
                  <div style={{ fontWeight: 800, marginBottom: 4 }}>
                    📷 Upload cover image
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.72 }}>
                    JPG / PNG • this is the main wow visual
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleCoverChange}
                  />
                </label>

                {coverPreview && (
                  <div style={{ marginTop: 10 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        marginBottom: 8,
                      }}
                    >
                      <button
                        type="button"
                        style={removeBtnStyle}
                        onClick={removeCover}
                      >
                        🗑 Remove cover
                      </button>
                    </div>

                    <div style={previewFrameStyle}>
                      <img
                        src={coverPreview}
                        alt="Cover preview"
                        style={{
                          width: "100%",
                          height: isMobile ? 180 : 220,
                          objectFit: "cover",
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={labelStyle}>Gallery images (max 6)</div>

                <label
                  style={uploadBoxStyle}
                  onDrop={handleGalleryDrop}
                  onDragOver={preventDefault}
                  onDragEnter={preventDefault}
                  onDragLeave={preventDefault}
                >
                  <div style={{ fontWeight: 800, marginBottom: 4 }}>
                    🖼️ Add gallery photos
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.72 }}>
                    Click or drag & drop. Best for atmosphere, trail, people and
                    scenery.
                  </div>

                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    style={{ display: "none" }}
                    onChange={handleGalleryChange}
                  />
                </label>

                {galleryPreviews.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 8,
                        gap: 10,
                        flexWrap: "wrap",
                      }}
                    >
                      <div style={{ fontSize: 11, opacity: 0.75 }}>
                        Selected: {galleryPreviews.length}/6
                      </div>
                      <button
                        type="button"
                        style={removeBtnStyle}
                        onClick={clearGallery}
                      >
                        🧹 Clear gallery
                      </button>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fill,minmax(84px,1fr))",
                        gap: 8,
                      }}
                    >
                      {galleryPreviews.map((src, i) => (
                        <div
                          key={i}
                          style={{
                            position: "relative",
                            borderRadius: 12,
                            overflow: "hidden",
                            border: "1px solid rgba(255,255,255,0.16)",
                            boxShadow: "0 10px 24px rgba(0,0,0,0.28)",
                          }}
                        >
                          <button
                            type="button"
                            style={removeXStyle}
                            onClick={() => removeGalleryImage(i)}
                            title="Remove this image"
                          >
                            ✕
                          </button>

                          <img
                            src={src}
                            alt="gallery"
                            style={{
                              width: "100%",
                              height: 78,
                              objectFit: "cover",
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <div style={labelStyle}>Promo video (optional)</div>
                <label style={uploadBoxStyle}>
                  <div style={{ fontWeight: 800, marginBottom: 4 }}>
                    🎬 Upload promo video
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.72 }}>
                    MP4 / WebM • a short teaser makes the tour feel premium
                  </div>

                  <input
                    type="file"
                    accept="video/*"
                    style={{ display: "none" }}
                    onChange={handleVideoChange}
                  />
                </label>

                {videoPreview && (
                  <div style={{ marginTop: 10 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        marginBottom: 8,
                      }}
                    >
                      <button
                        type="button"
                        style={removeBtnStyle}
                        onClick={removeVideo}
                      >
                        🗑 Remove video
                      </button>
                    </div>

                    <div style={previewFrameStyle}>
                      <video
                        src={videoPreview}
                        controls
                        style={{
                          width: "100%",
                          height: isMobile ? 210 : 240,
                          objectFit: "cover",
                          backgroundColor: "black",
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {errorMsg && (
              <div style={errorStyle}>
                {showVerifiedBanner ? (
                  <>
                    ⛔ You must be a verified creator to publish tours.{" "}
                    <span
                      onClick={() => navigate("/apply-creator")}
                      style={applyInlineLinkStyle}
                    >
                      Apply for verification
                    </span>
                  </>
                ) : (
                  errorMsg
                )}
              </div>
            )}

            {successMsg && <div style={successStyle}>{successMsg}</div>}

            {!isVerifiedCreator ? (
              <div style={{ marginTop: 14 }}>
                <button
                  type="button"
                  disabled
                  style={{
                    ...submitBtnStyle,
                    background: "linear-gradient(135deg, #555, #333)",
                    cursor: "not-allowed",
                    boxShadow: "none",
                    color: "#ececec",
                  }}
                >
                  🔒 Verification required
                </button>

                <div
                  style={{
                    marginTop: 10,
                    fontSize: 13,
                    padding: "12px",
                    borderRadius: 14,
                    background: "rgba(255,60,80,0.12)",
                    border: "1px solid rgba(255,90,110,0.42)",
                    color: "#ffd3d8",
                    textAlign: "center",
                    lineHeight: 1.5,
                  }}
                >
                  ⛔ You must be a verified creator to publish tours.{" "}
                  <span
                    onClick={() => navigate("/apply-creator")}
                    style={{
                      textDecoration: "underline",
                      cursor: "pointer",
                      fontWeight: 800,
                    }}
                  >
                    Apply for verification
                  </span>
                </div>
              </div>
            ) : (
              <button type="submit" disabled={loading} style={submitBtnStyle}>
                {loading
                  ? "Creating..."
                  : isTraining
                  ? "Create Training"
                  : "Create Tour"}
              </button>
            )}
          </form>

          <div style={rightStackStyle}>
            <div style={cardStyle}>
              <div style={sectionTitleStyle}>Map location</div>
              <p style={{ ...hintTextStyle, marginTop: -2, marginBottom: 12 }}>
                Tap the map to pin the exact tour point.
              </p>

              <div style={mapContainerOuterStyle}>
                <MapContainer
                  center={selectedPosition || [44.0, 21.0]}
                  zoom={selectedPosition ? 11 : 7}
                  scrollWheelZoom={true}
                  style={{ width: "100%", height: isMobile ? 260 : 300 }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="&copy; OpenStreetMap contributors"
                  />
                  <LocationMarker
                    selectedPosition={
                      selectedPosition
                        ? { lat: selectedPosition[0], lng: selectedPosition[1] }
                        : null
                    }
                    onSelect={(lat, lng) => {
                      setLatitude(lat);
                      setLongitude(lng);
                    }}
                  />
                </MapContainer>
              </div>

              <div
                style={{
                  marginTop: 12,
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}
              >
                <div style={statCardSmallStyle}>
                  <div style={{ fontSize: 11, opacity: 0.68 }}>Latitude</div>
                  <div style={{ fontSize: 14, fontWeight: 900, marginTop: 4 }}>
                    {latitude !== null ? latitude.toFixed(4) : "—"}
                  </div>
                </div>

                <div style={statCardSmallStyle}>
                  <div style={{ fontSize: 11, opacity: 0.68 }}>Longitude</div>
                  <div style={{ fontSize: 14, fontWeight: 900, marginTop: 4 }}>
                    {longitude !== null ? longitude.toFixed(4) : "—"}
                  </div>
                </div>
              </div>
            </div>

            <div style={cardStyle}>
              <div style={sectionTitleStyle}>Live preview</div>

              <div
                style={{
                  position: "relative",
                  borderRadius: 20,
                  overflow: "hidden",
                  minHeight: 260,
                  border: "1px solid rgba(255,255,255,0.10)",
                  boxShadow: "0 20px 46px rgba(0,0,0,0.42)",
                  background: "rgba(0,0,0,0.32)",
                }}
              >
                {coverPreview ? (
                  <img
                    src={coverPreview}
                    alt="preview"
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "radial-gradient(500px 220px at 18% 10%, rgba(0,255,170,0.16), transparent 60%)," +
                        "radial-gradient(420px 200px at 88% 0%, rgba(0,185,255,0.14), transparent 58%)," +
                        "linear-gradient(180deg, rgba(6,18,14,1), rgba(2,8,6,1))",
                    }}
                  />
                )}

                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(180deg, rgba(0,0,0,0.10), rgba(0,0,0,0.72) 62%, rgba(0,0,0,0.90))",
                  }}
                />

                <div
                  style={{
                    position: "absolute",
                    top: 12,
                    left: 12,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "7px 11px",
                    borderRadius: 999,
                    background: "rgba(0,0,0,0.42)",
                    border: "1px solid rgba(255,255,255,0.14)",
                    backdropFilter: "blur(14px)",
                    fontSize: 11,
                    fontWeight: 900,
                    letterSpacing: "0.10em",
                    textTransform: "uppercase",
                  }}
                >
                  {isTraining ? "🎓 Training" : "🧭"} {activity || "Activity"}
                </div>

                <div
                  style={{
                    position: "absolute",
                    left: 14,
                    right: 14,
                    bottom: 14,
                  }}
                >
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 1000,
                      lineHeight: 1.03,
                      letterSpacing: "-0.03em",
                    }}
                  >
                    {title || "Your tour title will appear here"}
                  </div>

                  <div
                    style={{
                      marginTop: 8,
                      fontSize: 13,
                      lineHeight: 1.5,
                      color: "rgba(240,255,246,0.80)",
                    }}
                  >
                    {locationName
                      ? `📍 ${locationName}${country ? `, ${country}` : ""}`
                      : "📍 Add location name and country"}
                  </div>

                  <div
                    style={{
                      marginTop: 10,
                      display: "flex",
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={miniPillStyle}>
                      👥 {maxPeople ? `${maxPeople} people` : "No group size"}
                    </div>
                    <div style={miniPillStyle}>
                      💶 {price ? `${price} €` : "No price"}
                    </div>
                    <div style={miniPillStyle}>
                      🗓 {dateStart || "Start"} {dateEnd ? `→ ${dateEnd}` : ""}
                    </div>
                    {isTraining && (
                      <div style={miniPillStyle}>
                        🎯{" "}
                        {skillLevelsList.find((s) => s.value === skillLevel)
                          ?.label || "All Levels"}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 14 }}>
                <div style={sectionTitleStyle}>Quick summary</div>

                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  <div style={miniPillStyle}>🏷️ {title || "Tour title"}</div>
                  <div style={miniPillStyle}>
                    {isTraining ? "🎓" : "🧭"} {activity || "No activity"}
                  </div>
                  <div style={miniPillStyle}>
                    📍{" "}
                    {locationName
                      ? `${locationName}${country ? ", " + country : ""}`
                      : "No location name"}
                  </div>
                  <div style={miniPillStyle}>
                    👥 {maxPeople ? `${maxPeople} people` : "No group size"}
                  </div>
                  <div style={miniPillStyle}>
                    💶 {price ? `${price} €` : "No price set"}
                  </div>
                  {isTraining && (
                    <>
                      <div style={miniPillStyle}>
                        🎯{" "}
                        {skillLevelsList.find((s) => s.value === skillLevel)
                          ?.label || "All Levels"}
                      </div>
                      {durationLabel && (
                        <div style={miniPillStyle}>⏱ {durationLabel}</div>
                      )}
                      {trainingLanguage && (
                        <div style={miniPillStyle}>🗣 {trainingLanguage}</div>
                      )}
                      {trainingSpotsLeft !== "" && (
                        <div style={miniPillStyle}>
                          🎟 {trainingSpotsLeft} spots left
                        </div>
                      )}
                      {equipmentIncluded && (
                        <div style={miniPillStyle}>🧰 Equipment included</div>
                      )}
                      {certificateIncluded && (
                        <div style={miniPillStyle}>📜 Certificate included</div>
                      )}
                    </>
                  )}
                  {applicationDeadline && (
                    <div style={miniPillStyle}>⏳ Until {applicationDeadline}</div>
                  )}
                  {latitude !== null && longitude !== null && (
                    <div style={miniPillStyle}>
                      📌 {latitude.toFixed(4)}, {longitude.toFixed(4)}
                    </div>
                  )}
                </div>

                <div
                  style={{
                    marginTop: 14,
                    fontSize: 11,
                    opacity: 0.72,
                    lineHeight: 1.5,
                  }}
                >
                  Tip: the best {isTraining ? "trainings" : "tours"} feel clear,
                  safe, visual and easy to trust at first glance.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}