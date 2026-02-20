// src/pages/EditTour.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";

import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

/* Fix Leaflet default icons (isti fazon kao u CreateTour) */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

/* Marker koji zna početnu poziciju */
function EditLocationMarker({ latitude, longitude, onSelect }) {
  const [position, setPosition] = useState(
    latitude && longitude ? { lat: latitude, lng: longitude } : null
  );

  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  useEffect(() => {
    if (latitude && longitude) {
      setPosition({ lat: latitude, lng: longitude });
    }
  }, [latitude, longitude]);

  return position ? <Marker position={position} /> : null;
}

export default function EditTour() {
  const { id } = useParams();
  

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

  // --- STATE ---
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [tour, setTour] = useState(null);

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

  // ------------ LOAD TOUR DATA ------------
  useEffect(() => {
    async function loadTour() {
      setLoading(true);
      setErrorMsg("");

      const { data, error } = await supabase
        .from("tours")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error(error);
        setErrorMsg("Could not load tour. Please try again.");
        setLoading(false);
        return;
      }

      setTour(data);

      // popuni state
      setTitle(data.title || "");
      setActivity(data.activity || "");
      setCountry(data.country || "");
      setLocationName(data.location_name || "");
      setDescription(data.description || "");
      setDateStart(data.date_start || "");
      setDateEnd(data.date_end || "");
      setPrice(data.price ?? "");
      setMaxPeople(data.max_people ?? "");
      setIsLegalEntity(!!data.is_legal_entity);
      setLatitude(data.latitude || null);
      setLongitude(data.longitude || null);
      setCoverPreview(data.cover_url || null);
      setGalleryPreviews(Array.isArray(data.image_urls) ? data.image_urls : []);

      setLoading(false);
    }

    loadTour();
  }, [id]);

  // ------------ FILE HANDLERS ------------
  function handleCoverChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  function handleGalleryChange(e) {
    const files = Array.from(e.target.files || []);
    const maxSix = files.slice(0, 6);
    setGalleryFiles(maxSix);
    setGalleryPreviews(maxSix.map((f) => URL.createObjectURL(f)));
  }

  function handleGalleryDrop(e) {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files || []);
    const maxSix = files.slice(0, 6);
    setGalleryFiles(maxSix);
    setGalleryPreviews(maxSix.map((f) => URL.createObjectURL(f)));
  }

  function preventDefault(e) {
    e.preventDefault();
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
    return null;
  }

  // ------------ SUBMIT (UPDATE) ------------
  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const validationError = validate();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    setSaving(true);

    try {
      // 1) COVER IMAGE – ako je izabran novi fajl, upload; inače ostaje stari
      let coverUrl = tour?.cover_url || null;
      if (coverFile) {
        const ext = coverFile.name.split(".").pop();
        const fileName = `cover-${id}-${Date.now()}.${ext}`;

        const { data: coverData, error: coverError } = await supabase.storage
          .from("tour-images")
          .upload(fileName, coverFile, {
            upsert: false,
          });

        if (coverError) throw coverError;

        const { data: publicUrlData } = supabase.storage
          .from("tour-images")
          .getPublicUrl(coverData.path);

        coverUrl = publicUrlData.publicUrl;
      }

      // 2) GALLERY IMAGES – ako ima novih fajlova, uploadujemo i ZAMENIMO stari niz
      let galleryUrls =
        Array.isArray(tour?.image_urls) && !galleryFiles.length
          ? tour.image_urls
          : [];

      if (galleryFiles.length > 0) {
        const tempUrls = [];
        for (const file of galleryFiles) {
          const ext = file.name.split(".").pop();
          const fileName = `gallery-${id}-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}.${ext}`;

          const { data: gData, error: gError } = await supabase.storage
            .from("tour-images")
            .upload(fileName, file);

          if (gError) throw gError;

          const { data: publicUrlData } = supabase.storage
            .from("tour-images")
            .getPublicUrl(gData.path);

          tempUrls.push(publicUrlData.publicUrl);
        }

        galleryUrls = tempUrls;
      }

      // 3) UPDATE u bazi
      const { error: updateError } = await supabase
  .from("tours")
  .update({
    title: title || null,
    activity: activity || null,
    country: country || null,
    location_name: locationName || null,
    description: description || null,
    date_start: dateStart || null,
    date_end: dateEnd || null,
    price: price ? Number(price) : null,
    max_people: maxPeople ? Number(maxPeople) : null,
    is_legal_entity: isLegalEntity,
    latitude: latitude ?? null,
    longitude: longitude ?? null,
    cover_url: coverUrl || null,
    image_urls: galleryUrls || [],
  })
  .eq("id", id);

      if (updateError) throw updateError;

      setSuccessMsg("Tour updated successfully! 🌿");
      // Ako hoćeš automatski nazad na detalje:
      // navigate(/tours/${id});
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Error updating tour. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // ------------ STYLES (isti kao CreateTour) ------------
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

  const isSmallScreen =
    typeof window !== "undefined" && window.innerWidth < 800;
  const responsiveLayoutStyle = isSmallScreen
    ? { ...layoutStyle, gridTemplateColumns: "1fr" }
    : layoutStyle;

  // ------------ RENDER ------------
  if (loading && !tour) {
    return (
      <div style={pageWrapperStyle}>
        <div style={containerStyle}>
          <p>Loading tour...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={pageWrapperStyle}>
      <div style={containerStyle}>
        {/* HEADER */}
        <div style={headerStyle}>
          <div style={badgeStyle}>✏️ Edit tour</div>
          <h1 style={titleStyle}>Update your outdoor experience.</h1>
          <p style={subtitleStyle}>
            Change dates, description, images or location – keep your tour
            fresh and clear for everyone who joins.
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

            {/* IMAGES */}
            <div style={{ marginBottom: 18 }}>
              <div style={sectionTitleStyle}>Images</div>

              {/* COVER IMAGE */}
              <div style={{ marginBottom: 14 }}>
                <div style={labelStyle}>Cover image (1)</div>

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
                    📷 Click to upload new cover (optional)
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.7 }}>
                    If you don&apos;t upload anything, current cover will stay.
                  </div>

                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleCoverChange}
                  />
                </label>

                {coverPreview && (
                  <div
                    style={{
                      marginTop: 10,
                      borderRadius: 14,
                      overflow: "hidden",
                      border: "1px solid rgba(255,255,255,0.22)",
                    }}
                  >
                    <img
                      src={coverPreview}
                      alt="Cover preview"
                      style={{ width: "100%", height: 160, objectFit: "cover" }}
                    />
                  </div>
                )}
              </div>

              {/* GALLERY */}
              <div>
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
                    🖼️ Click or drag &amp; drop (optional)
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.7 }}>
                    If you don&apos;t upload anything, current gallery will stay.
                    If you upload new images, gallery will be replaced.
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
                  <div
                    style={{
                      marginTop: 10,
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill,minmax(80px,1fr))",
                      gap: 8,
                    }}
                  >
                    {galleryPreviews.map((src, i) => (
                      <div
                        key={i}
                        style={{
                          borderRadius: 10,
                          overflow: "hidden",
                          border: "1px solid rgba(255,255,255,0.18)",
                        }}
                      >
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
                )}
              </div>
            </div>

            {/* ERRORS & SUCCESS */}
            {errorMsg && <div style={errorStyle}>{errorMsg}</div>}
            {successMsg && <div style={successStyle}>{successMsg}</div>}

            {/* SUBMIT */}
            <button type="submit" disabled={saving} style={submitBtnStyle}>
              {saving ? "Saving changes..." : "Save changes"}
            </button>
          </form>

          {/* RIGHT SIDE — MAP + PREVIEW */}
          <div style={cardStyle}>
            <div style={{ marginBottom: 16 }}>
              <div style={sectionTitleStyle}>Map location</div>
              <p style={hintTextStyle}>
                Click on the map to adjust the exact meeting point or trail
                start.
              </p>
            </div>

            {/* MAP HERE */}
            <div style={mapContainerOuterStyle}>
              <MapContainer
                center={
                  latitude && longitude ? [latitude, longitude] : [44.0, 21.0]
                }
                zoom={latitude && longitude ? 9 : 7}
                scrollWheelZoom={true}
                style={{ width: "100%", height: 220 }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap contributors"
                />

                <EditLocationMarker
                  latitude={latitude}
                  longitude={longitude}
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

                {latitude && longitude && (
                  <div style={miniPillStyle}>
                    📌 {latitude.toFixed(4)}, {longitude.toFixed(4)}
                  </div>
                )}
              </div>

              <div style={{ marginTop: 14, fontSize: 11, opacity: 0.7 }}>
                Tip: keep details up to date so people know exactly what to
                expect.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}