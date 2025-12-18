// src/pages/CreateTour.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

/* Leaflet imports */
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

/* Fix default marker icons */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

/* Component for selecting location */
function LocationMarker({ onSelect }) {
  const [position, setPosition] = useState(null);

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

  // --- BASIC INFO ---
  const [title, setTitle] = useState("");
  const [activity, setActivity] = useState("");
  const [country, setCountry] = useState("");
  const [locationName, setLocationName] = useState("");
  const [description, setDescription] = useState("");

  // --- DATE / PRICE ---
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [price, setPrice] = useState("");
  const [maxPeople, setMaxPeople] = useState("");

  // --- APPLICATION DEADLINE ---
  const [applicationDeadline, setApplicationDeadline] = useState("");

  // --- LEGAL ENTITY ---
  const [isLegalEntity, setIsLegalEntity] = useState(false);

  // --- MAP LOCATION ---
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  // --- FILES ---
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [galleryPreviews, setGalleryPreviews] = useState([]);

  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);

  // --- STATE ---
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // ------------ LOAD AUTH USER ------------
  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      setUser(data.user || null);
      if (!data.user) {
        // po želji redirect na login
        // navigate("/login");
      }
    }
    loadUser();
  }, []);

  // ------------ ACTIVITIES & COUNTRIES ------------
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

  // ------------ FILE HANDLERS ------------
  function handleCoverChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // cleanup old preview
    if (coverPreview) URL.revokeObjectURL(coverPreview);

    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  function handleGalleryChange(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // DODATO: kombinuj postojeće + nove (da možeš dodavati u više puta)
    const combined = [...galleryFiles, ...files].slice(0, 6);

    // cleanup prethodnih preview-a
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

    // DODATO: kombinuj postojeće + nove (drag & drop)
    const combined = [...galleryFiles, ...files].slice(0, 6);

    // cleanup prethodnih preview-a
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

    // cleanup old preview
    if (videoPreview) URL.revokeObjectURL(videoPreview);

    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  }

  // ------------ DODATO: BRISANJE SLIKA/VIDEA (NE MENJA OSTALE FUNKCIJE) ------------
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

  // ------------ VALIDATION ------------
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
    if (!latitude || !longitude) return "Please pick a location on the map.";
    if (!coverFile) return "Cover image is required.";
    if (!applicationDeadline) return "Application deadline is required.";

    return null;
  }

  // ------------ SUBMIT ------------
  async function handleSubmit(e) {
    e.preventDefault();
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
      // 1) Upload cover image
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

      // 2) Upload gallery images
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

      // 3) Upload video (optional)
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

      // 4) Application deadline as ISO
      const deadlineISO = applicationDeadline
        ? new Date(applicationDeadline).toISOString()
        : null;

      // 5) Insert into DB
      const { error: insertError } = await supabase.from("tours").insert([
        {
          title,
          activity,
          country,
          location_name: locationName,
          description,
          date_start: dateStart,
          date_end: dateEnd,
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
        },
      ]);

      if (insertError) throw insertError;

      setSuccessMsg("Tour created successfully! 🌿");
      setTimeout(() => navigate("/my-tours"), 1200);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Error creating tour. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ------------ STYLES ------------
  const pageWrapperStyle = {
    minHeight: "100vh",
    padding: "30px 16px 60px",
    background:
      "radial-gradient(circle at top, #062a1d 0%, #030b08 55%, #020605 100%)",
    color: "#ffffff",
    boxSizing: "border-box",
  };

  const containerStyle = {
    maxWidth: "1100px",
    margin: "0 auto",
    boxSizing: "border-box",
  };

  const headerStyle = { marginBottom: 18 };

  const badgeStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "4px 10px",
    borderRadius: "999px",
    border: "1px solid rgba(0,255,160,0.4)",
    background: "rgba(0,0,0,0.25)",
    fontSize: 11,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "rgba(200,255,220,0.85)",
  };

  const titleStyle = {
    fontSize: 32,
    fontWeight: 800,
    margin: "10px 0 6px",
  };

  const subtitleStyle = {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    maxWidth: 520,
  };

  const layoutStyle = {
    marginTop: 24,
    display: "grid",
    gridTemplateColumns: "minmax(0, 2.1fr) minmax(0, 1.3fr)",
    gap: 20,
  };

  const cardStyle = {
    background: "rgba(0,0,0,0.45)",
    borderRadius: 18,
    padding: 18,
    boxShadow: "0 22px 60px rgba(0,0,0,0.7)",
    border: "1px solid rgba(255,255,255,0.06)",
    backdropFilter: "blur(16px)",
  };

  const labelStyle = {
    fontSize: 13,
    marginBottom: 4,
    color: "rgba(255,255,255,0.85)",
  };

  const inputBaseStyle = {
    width: "100%",
    padding: "9px 11px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.55)",
    color: "#ffffff",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  };

  const textareaStyle = {
    ...inputBaseStyle,
    minHeight: 90,
    resize: "vertical",
  };

  const selectStyle = {
    ...inputBaseStyle,
    appearance: "none",
    WebkitAppearance: "none",
    MozAppearance: "none",
    backgroundImage:
      "linear-gradient(45deg, transparent 50%, #00ffb0 60%), linear-gradient(135deg, #00ffb0 40%, transparent 50%)",
    backgroundPosition: "calc(100% - 18px) 14px, calc(100% - 10px) 14px",
    backgroundSize: "8px 8px, 8px 8px",
    backgroundRepeat: "no-repeat",
  };

  const hintTextStyle = {
    fontSize: 11,
    color: "rgba(255,255,255,0.55)",
    marginTop: 4,
  };

  const sectionTitleStyle = {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: "0.07em",
    color: "rgba(210,255,230,0.85)",
  };

  const mapContainerOuterStyle = {
    marginTop: 12,
    borderRadius: 16,
    overflow: "hidden",
    border: "1px solid rgba(0,255,160,0.22)",
    boxShadow: "0 16px 40px rgba(0,0,0,0.85)",
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

  const submitBtnStyle = {
    marginTop: 14,
    width: "100%",
    padding: "11px 14px",
    borderRadius: 999,
    border: "none",
    background:
      "linear-gradient(135deg, #00ffb0 0%, #00cf7c 40%, #02a45d 100%)",
    color: "#02140b",
    fontSize: 15,
    fontWeight: 800,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    cursor: "pointer",
    boxShadow: "0 14px 40px rgba(0,255,165,0.35)",
  };

  const miniPillStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: 11,
    padding: "4px 9px",
    borderRadius: 999,
    background: "rgba(0,0,0,0.5)",
    border: "1px solid rgba(255,255,255,0.16)",
  };

  // DODATO: mini dugme stil (ne dira ostatak UI-a)
  const removeBtnStyle = {
    padding: "7px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(0,0,0,0.55)",
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
    cursor: "pointer",
  };

  const removeXStyle = {
    position: "absolute",
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.22)",
    background: "rgba(0,0,0,0.6)",
    color: "white",
    cursor: "pointer",
    display: "grid",
    placeItems: "center",
    fontSize: 14,
    lineHeight: 1,
  };

  const isSmallScreen =
    typeof window !== "undefined" && window.innerWidth < 800;
  const responsiveLayoutStyle = isSmallScreen
    ? { ...layoutStyle, gridTemplateColumns: "1fr" }
    : layoutStyle;

  // --------------------------------------------------------
  // ------------------------- UI ---------------------------
  // --------------------------------------------------------
  return (
    <div style={pageWrapperStyle}>
      <div style={containerStyle}>
        {/* HEADER */}
        <div style={headerStyle}>
          <div style={badgeStyle}>🗺️ Create a new tour</div>
          <h1 style={titleStyle}>Share your next outdoor experience.</h1>
          <p style={subtitleStyle}>
            Describe your tour, upload photos and a video, choose the exact
            location on the map, and let people join your adventure.
          </p>
        </div>

        {/* LAYOUT */}
        <div style={responsiveLayoutStyle}>
          {/* LEFT FORM */}
          <form style={cardStyle} onSubmit={handleSubmit}>
            {/* BASIC INFO */}
            <div style={{ marginBottom: 18 }}>
              <div style={sectionTitleStyle}>Basic information</div>

              <div style={{ marginBottom: 10 }}>
                <div style={labelStyle}>Tour title *</div>
                <input
                  style={inputBaseStyle}
                  placeholder="Example: Sunrise hike to Vlasina Lake"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.4fr 1.4fr",
                  gap: 10,
                }}
              >
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

              <div style={{ marginTop: 10 }}>
                <div style={labelStyle}>Location name *</div>
                <input
                  style={inputBaseStyle}
                  placeholder="Example: Vlasina Lake, South Serbia"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                />
                <div style={hintTextStyle}>
                  People will see this name on the tour card.
                </div>
              </div>
            </div>

            {/* DATE & PRICE */}
            <div style={{ marginBottom: 18 }}>
              <div style={sectionTitleStyle}>Schedule & pricing</div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                  marginBottom: 10,
                }}
              >
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

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                  marginBottom: 10,
                }}
              >
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
                  After this date, people will no longer be able to apply. The
                  tour will automatically disappear from public lists.
                </div>
              </div>
            </div>

            {/* DESCRIPTION */}
            <div style={{ marginBottom: 18 }}>
              <div style={sectionTitleStyle}>Description</div>
              <textarea
                style={textareaStyle}
                placeholder="Describe your tour in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* LEGAL ENTITY */}
            <div style={{ marginBottom: 18 }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 13,
                  cursor: "pointer",
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

            {/* IMAGES & VIDEO */}
            <div style={{ marginBottom: 18 }}>
              <div style={sectionTitleStyle}>Images & video</div>

              {/* COVER IMAGE */}
              <div style={{ marginBottom: 14 }}>
                <div style={labelStyle}>Cover image (1) *</div>

                <label
                  style={{
                    borderRadius: 14,
                    border: "1px dashed rgba(255,255,255,0.25)",
                    padding: 14,
                    cursor: "pointer",
                    display: "block",
                    background:
                      "radial-gradient(circle at top left, rgba(0,255,160,0.2), rgba(0,0,0,0.9))",
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 3 }}>
                    📷 Click to upload
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.7 }}>
                    JPG / PNG • max 5 MB
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
                        🗑️ Remove cover
                      </button>
                    </div>

                    <div
                      style={{
                        borderRadius: 14,
                        overflow: "hidden",
                        border: "1px solid rgba(255,255,255,0.22)",
                      }}
                    >
                      <img
                        src={coverPreview}
                        alt="Cover preview"
                        style={{
                          width: "100%",
                          height: 160,
                          objectFit: "cover",
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* GALLERY */}
              <div style={{ marginBottom: 14 }}>
                <div style={labelStyle}>Gallery images (max 6)</div>

                <label
                  style={{
                    borderRadius: 14,
                    border: "1px dashed rgba(255,255,255,0.25)",
                    padding: 14,
                    cursor: "pointer",
                    display: "block",
                    background:
                      "radial-gradient(circle at top left, rgba(0,255,160,0.2), rgba(0,0,0,0.9))",
                  }}
                  onDrop={handleGalleryDrop}
                  onDragOver={preventDefault}
                  onDragEnter={preventDefault}
                  onDragLeave={preventDefault}
                >
                  <div style={{ fontWeight: 600, marginBottom: 3 }}>
                    🖼️ Click or drag & drop
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.7 }}>
                    Add up to 6 photos
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
                          "repeat(auto-fill,minmax(80px,1fr))",
                        gap: 8,
                      }}
                    >
                      {galleryPreviews.map((src, i) => (
                        <div
                          key={i}
                          style={{
                            position: "relative",
                            borderRadius: 10,
                            overflow: "hidden",
                            border: "1px solid rgba(255,255,255,0.18)",
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
                              height: 70,
                              objectFit: "cover",
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* VIDEO */}
              <div>
                <div style={labelStyle}>Promo video (optional)</div>
                <label
                  style={{
                    borderRadius: 14,
                    border: "1px dashed rgba(255,255,255,0.25)",
                    padding: 14,
                    cursor: "pointer",
                    display: "block",
                    background:
                      "radial-gradient(circle at top right, rgba(0,255,160,0.18), rgba(0,0,0,0.9))",
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 3 }}>
                    🎬 Click to upload video
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.7 }}>
                    MP4 / WebM • max 50 MB (recommended short teaser)
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
                        🗑️ Remove video
                      </button>
                    </div>

                    <div
                      style={{
                        borderRadius: 14,
                        overflow: "hidden",
                        border: "1px solid rgba(255,255,255,0.22)",
                      }}
                    >
                      <video
                        src={videoPreview}
                        controls
                        style={{
                          width: "100%",
                          height: 200,
                          objectFit: "cover",
                          backgroundColor: "black",
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ERRORS & SUCCESS */}
            {errorMsg && <div style={errorStyle}>{errorMsg}</div>}
            {successMsg && <div style={successStyle}>{successMsg}</div>}

            {/* SUBMIT */}
            <button type="submit" disabled={loading} style={submitBtnStyle}>
              {loading ? "Creating..." : "Create Tour"}
            </button>
          </form>

          {/* RIGHT SIDE — MAP + PREVIEW */}
          <div style={cardStyle}>
            <div style={{ marginBottom: 16 }}>
              <div style={sectionTitleStyle}>Map location</div>
              <p style={hintTextStyle}>Click on the map to place a marker.</p>
            </div>

            {/* MAP */}
            <div style={mapContainerOuterStyle}>
              <MapContainer
                center={[44.0, 21.0]} // Serbia center
                zoom={7}
                scrollWheelZoom={true}
                style={{ width: "100%", height: 220 }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap contributors"
                />

                <LocationMarker
                  onSelect={(lat, lng) => {
                    setLatitude(lat);
                    setLongitude(lng);
                  }}
                />
              </MapContainer>
            </div>

            {/* SUMMARY */}
            <div style={{ marginTop: 18 }}>
              <div style={sectionTitleStyle}>Quick summary</div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={miniPillStyle}>🏷️ {title || "Tour title"}</div>
                <div style={miniPillStyle}>🧭 {activity || "No activity"}</div>
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

                {applicationDeadline && (
                  <div style={miniPillStyle}>
                    ⏳ Applications until: {applicationDeadline}
                  </div>
                )}

                {latitude && longitude && (
                  <div style={miniPillStyle}>
                    📌 {latitude.toFixed(4)}, {longitude.toFixed(4)}
                  </div>
                )}
              </div>

              <div style={{ marginTop: 14, fontSize: 11, opacity: 0.7 }}>
                Tip: write honestly about difficulty, gear, and weather.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}