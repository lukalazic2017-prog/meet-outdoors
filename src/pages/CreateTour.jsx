import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CreateTour() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    id: Date.now().toString(),
    name: "",
    location: "",
    activity: "",
    date: "",
    startTime: "",
    endTime: "",
    price: "",
    capacity: "",
    description: "",
    image: "",
    signedUp: false,
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  // handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  // upload image from device
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm({ ...form, image: reader.result });
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // submit
  const handleSubmit = (e) => {
    e.preventDefault();
    const stored = JSON.parse(localStorage.getItem("tours")) || [];
    const updated = [...stored, form];
    localStorage.setItem("tours", JSON.stringify(updated));

    // popup animation
    setShowPopup(true);
    setTimeout(() => {
      setShowPopup(false);
      navigate("/tours");
    }, 2000);
  };

  const previewSrc = imagePreview || form.image;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(145deg, #0f172a, #14532d, #166534)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "40px 20px",
        fontFamily: "Poppins, sans-serif",
        color: "white",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* LIGHT EFFECTS */}
      <div
        style={{
          position: "absolute",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background: "radial-gradient(circle, #22c55e33 0%, transparent 70%)",
          top: "-100px",
          left: "-100px",
          filter: "blur(90px)",
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: "radial-gradient(circle, #16a34a33 0%, transparent 70%)",
          bottom: "-100px",
          right: "-100px",
          filter: "blur(80px)",
          zIndex: 0,
        }}
      />

      <form
        onSubmit={handleSubmit}
        style={{
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: "25px",
          padding: "40px",
          width: "100%",
          maxWidth: "720px",
          boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
          backdropFilter: "blur(12px)",
          position: "relative",
          zIndex: 2,
          animation: "fadeIn 0.7s ease",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            marginBottom: "35px",
            fontSize: "2.2rem",
            fontWeight: "700",
            letterSpacing: "1px",
            background: "linear-gradient(90deg, #4ade80, #22c55e, #16a34a)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          ➕ Create a New Tour
        </h1>

        {/* NAME */}
        <label>Tour Name</label>
        <input
          type="text"
          name="name"
          placeholder="Enter tour name..."
          required
          value={form.name}
          onChange={handleChange}
          style={inputStyle}
        />

        {/* LOCATION */}
        <label>Location</label>
        <input
          type="text"
          name="location"
          placeholder="Enter location..."
          required
          value={form.location}
          onChange={handleChange}
          style={inputStyle}
        />

        {/* ACTIVITY */}
        <label>Activity</label>
        <select
          name="activity"
          required
          value={form.activity}
          onChange={handleChange}
          style={inputStyle}
        >
          <option value="">Select activity</option>
          <option value="Hiking">Hiking</option>
          <option value="Rafting">Rafting</option>
          <option value="Quad Ride">Quad Ride</option>
          <option value="Skiing">Skiing</option>
          <option value="Diving">Diving</option>
          <option value="Zip Line">Zip Line</option>
          <option value="Skydiving">Skydiving</option>
          <option value="Paragliding">Paragliding</option>
          <option value="Camping">Camping</option>
          <option value="Horse Riding">Horse Riding</option>
        </select>

        {/* DATE & TIME */}
        <div style={{ display: "flex", gap: "10px" }}>
          <div style={{ flex: 1 }}>
            <label>Date</label>
            <input
              type="date"
              name="date"
              required
              value={form.date}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label>Start Time</label>
            <input
              type="time"
              name="startTime"
              required
              value={form.startTime}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label>End Time</label>
            <input
              type="time"
              name="endTime"
              required
              value={form.endTime}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>
        </div>

        {/* PRICE & CAPACITY */}
        <div style={{ display: "flex", gap: "10px" }}>
          <div style={{ flex: 1 }}>
            <label>Price (€)</label>
            <input
              type="number"
              name="price"
              required
              value={form.price}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label>Capacity</label>
            <input
              type="number"
              name="capacity"
              required
              value={form.capacity}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>
        </div>

        {/* DESCRIPTION */}
        <label>Description</label>
        <textarea
          name="description"
          placeholder="Enter tour description..."
          value={form.description}
          onChange={handleChange}
          style={{ ...inputStyle, height: "100px", resize: "none" }}
        />

        {/* IMAGE URL */}
        <label>Image (URL)</label>
        <input
          type="url"
          name="image"
          placeholder="Paste image link..."
          value={form.image}
          onChange={(e) => {
            handleChange(e);
            setImagePreview(e.target.value);
          }}
          style={inputStyle}
        />

        {/* UPLOAD */}
        <label>or upload from your device</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{
            display: "block",
            marginBottom: "20px",
            color: "white",
            fontSize: "0.9rem",
          }}
        />

        {/* PREVIEW */}
        {previewSrc && (
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <img
              src={previewSrc}
              alt="Preview"
              style={{
                maxWidth: "100%",
                borderRadius: "15px",
                boxShadow: "0 10px 25px rgba(0,0,0,0.4)",
              }}
            />
          </div>
        )}

        {/* BUTTON */}
        <button
          type="submit"
          style={{
            width: "100%",
            background: "linear-gradient(135deg, #22c55e, #16a34a)",
            border: "none",
            color: "white",
            fontWeight: "bold",
            fontSize: "1.1rem",
            padding: "15px",
            borderRadius: "12px",
            cursor: "pointer",
            boxShadow: "0 8px 25px rgba(0,0,0,0.4)",
            transition: "transform 0.2s ease, background 0.3s ease",
          }}
          onMouseEnter={(e) =>
            (e.target.style.background =
              "linear-gradient(135deg, #4ade80, #16a34a)")
          }
          onMouseLeave={(e) =>
            (e.target.style.background =
              "linear-gradient(135deg, #22c55e, #15803d)")
          }
        >
          ✅ Save Tour
        </button>
      </form>

      {/* POPUP */}
      {showPopup && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background:
              "linear-gradient(135deg, rgba(34,197,94,0.9), rgba(16,185,129,0.9))",
            color: "white",
            padding: "25px 40px",
            borderRadius: "20px",
            fontSize: "1.3rem",
            fontWeight: "bold",
            boxShadow: "0 15px 40px rgba(0,0,0,0.5)",
            backdropFilter: "blur(10px)",
            zIndex: 100,
            animation: "fadeInOut 2s ease",
          }}
        >
          ✅ Tour successfully added!
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "12px 15px",
  borderRadius: "10px",
  border: "none",
  outline: "none",
  fontSize: "1rem",
  marginBottom: "18px",
};