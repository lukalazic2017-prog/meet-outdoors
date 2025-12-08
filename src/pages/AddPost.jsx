// src/pages/AddPost.jsx
import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function AddPost() {
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [type, setType] = useState("image");

  const [caption, setCaption] = useState("");
  const [activity, setActivity] = useState("");
  const [tourId, setTourId] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // ---- PRIVATE STYLES ----
  const pageStyle = {
    minHeight: "100vh",
    padding: "30px 20px 60px",
    background:
      "radial-gradient(circle at top, #062c22 0%, #02060b 45%, #000000 100%)",
    color: "#ffffff",
    fontFamily: "system-ui",
  };

  const containerStyle = {
    maxWidth: 850,
    margin: "0 auto",
    background: "rgba(0,0,0,0.55)",
    padding: 30,
    borderRadius: 22,
    border: "1px solid rgba(0,255,160,0.2)",
    boxShadow: "0 25px 50px rgba(0,0,0,0.7)",
  };

  const labelStyle = {
    display: "block",
    marginBottom: 6,
    marginTop: 16,
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(0,0,0,0.55)",
    color: "#fff",
    fontSize: 14,
    outline: "none",
  };

  const selectStyle = { ...inputStyle };

  const uploadBoxStyle = {
    width: "100%",
    marginTop: 10,
    padding: 20,
    borderRadius: 16,
    border: "2px dashed rgba(0,255,160,0.4)",
    background: "rgba(0,0,0,0.35)",
    textAlign: "center",
    cursor: "pointer",
  };

  const previewStyle = {
    width: "100%",
    maxHeight: 350,
    objectFit: "cover",
    borderRadius: 16,
    marginTop: 15,
    border: "1px solid rgba(0,255,160,0.25)",
  };

  const buttonStyle = {
    marginTop: 30,
    padding: "14px 20px",
    width: "100%",
    borderRadius: 16,
    border: "none",
    background:
      "linear-gradient(135deg, #00ffb0 0%, #00d1ff 45%, #ffffff 100%)",
    color: "#022015",
    fontWeight: 800,
    fontSize: 14,
    cursor: "pointer",
    boxShadow: "0 18px 40px rgba(0,255,160,0.35)",
  };

  // ------------------------------------------
  // HANDLERS
  // ------------------------------------------

  function onFileChange(e) {
    const f = e.target.files[0];
    if (!f) return;

    setFile(f);
    setType(f.type.includes("video") ? "video" : "image");
    setPreview(URL.createObjectURL(f));
  }

  async function handleSubmit() {
    try {
      setLoading(true);
      setErrorMsg("");

      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        setErrorMsg("You must be logged in to post.");
        setLoading(false);
        return;
      }

      if (!file) {
        setErrorMsg("You must upload an image or video.");
        setLoading(false);
        return;
      }

      // ---- 1) UPLOAD FILE ----
      const ext = file.name.split(".").pop();
      const fileName = `${user.id}_${Date.now()}.${ext}`;

      const { data: storageData, error: storageErr } = await supabase.storage
        .from("timeline_media")
        .upload(fileName, file);

      if (storageErr) {
        setErrorMsg("Upload failed: " + storageErr.message);
        setLoading(false);
        return;
      }

      const mediaUrl = supabase.storage
        .from("timeline_media")
        .getPublicUrl(fileName).data.publicUrl;

      // ---- 2) INSERT INTO timeline_posts ----
      const { error: insertErr } = await supabase.from("timeline_posts").insert({
        user_id: user.id,
        type,
        media_url: mediaUrl,
        thumbnail_url: type === "video" ? mediaUrl : null,
        caption,
        activity,
        tour_id: tourId || null,
        is_public: isPublic,
      });

      if (insertErr) {
        setErrorMsg("Failed to create post: " + insertErr.message);
        setLoading(false);
        return;
      }

      navigate("/timeline");

    } catch (err) {
      console.error(err);
      setErrorMsg("Unexpected error happened.");
    }

    setLoading(false);
  }

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <h2 style={{ fontSize: 26, marginBottom: 10, fontWeight: 800 }}>
          Add New Story
        </h2>
        <p style={{ color: "rgba(255,255,255,0.7)", marginBottom: 20 }}>
          Share a photo or video from your adventure.
        </p>

        {/* FILE UPLOAD */}
        <label style={labelStyle}>Upload media (photo or video)</label>
        <div style={uploadBoxStyle}>
          <input
            type="file"
            accept="image/,video/"
            onChange={onFileChange}
            style={{ display: "block", width: "100%", cursor: "pointer" }}
          />
          {preview && (
            type === "image" ? (
              <img src={preview} alt="" style={previewStyle} />
            ) : (
              <video src={preview} style={previewStyle} controls />
            )
          )}
        </div>

        {/* CAPTION */}
        <label style={labelStyle}>Caption</label>
        <input
          style={inputStyle}
          placeholder="Write something about this moment..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />

        {/* ACTIVITY */}
        <label style={labelStyle}>Activity</label>
        <input
          style={inputStyle}
          placeholder="Hiking, kayaking, biking..."
          value={activity}
          onChange={(e) => setActivity(e.target.value)}
        />

        {/* TOUR ID */}
        <label style={labelStyle}>Related Tour (optional)</label>
        <input
          style={inputStyle}
          placeholder="Tour ID..."
          value={tourId}
          onChange={(e) => setTourId(e.target.value)}
        />

        {/* VISIBILITY */}
        <label style={labelStyle}>Visibility</label>
        <select
          style={selectStyle}
          value={isPublic}
          onChange={(e) => setIsPublic(e.target.value === "true")}
        >
          <option value="true">Public</option>
          <option value="false">Private</option>
        </select>

        {/* ERRORS */}
        {errorMsg && (
          <div
            style={{
              marginTop: 16,
              padding: "10px 12px",
              borderRadius: 14,
              background: "rgba(255,60,80,0.18)",
              border: "1px solid rgba(255,90,110,0.7)",
              color: "#ffd3d8",
              fontSize: 13,
            }}
          >
            {errorMsg}
          </div>
        )}

        {/* BUTTON */}
        <button
          style={buttonStyle}
          disabled={loading}
          onClick={handleSubmit}
        >
          {loading ? "Uploading..." : "Publish Story"}
        </button>
      </div>
    </div>
  );
}