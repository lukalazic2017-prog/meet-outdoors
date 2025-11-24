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

  // promena vrednosti
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  // upload slike sa računara
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

  // slanje forme
  const handleSubmit = (e) => {
    e.preventDefault();
    const stored = JSON.parse(localStorage.getItem("tours")) || [];
    const updated = [...stored, form];
    localStorage.setItem("tours", JSON.stringify(updated));

    // popup animacija
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
      {/* SVETLOSNI EFEKAT */}
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
          ➕ Kreiraj novu turu
        </h1>

        {/* NAZIV */}
        <label>Naziv ture</label>
        <input
          type="text"
          name="name"
          placeholder="Unesi naziv ture..."
          required
          value={form.name}
          onChange={handleChange}
          style={inputStyle}
        />

        {/* LOKACIJA */}
        <label>Lokacija</label>
        <input
          type="text"
          name="location"
          placeholder="Unesi lokaciju..."
          required
          value={form.location}
          onChange={handleChange}
          style={inputStyle}
        />

        {/* AKTIVNOST */}
        <label>Aktivnost</label>
        <select
          name="activity"
          required
          value={form.activity}
          onChange={handleChange}
          style={inputStyle}
        >
          <option value="">Izaberi aktivnost</option>
          <option value="Planinarenje">Planinarenje</option>
          <option value="Rafting">Rafting</option>
          <option value="Vožnja kvadom">Vožnja kvadom</option>
          <option value="Skijanje">Skijanje</option>
          <option value="Ronjenje">Ronjenje</option>
          <option value="Zip line">Zip line</option>
          <option value="Padobranstvo">Padobranstvo</option>
          <option value="Paraglajding">Paraglajding</option>
          <option value="Kampovanje">Kampovanje</option>
          <option value="Jahanje">Jahanje</option>
        </select>

        {/* DATUM I VREME */}
        <div style={{ display: "flex", gap: "10px" }}>
          <div style={{ flex: 1 }}>
            <label>Datum</label>
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
            <label>Početak</label>
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
            <label>Kraj</label>
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

        {/* CENA I KAPACITET */}
        <div style={{ display: "flex", gap: "10px" }}>
          <div style={{ flex: 1 }}>
            <label>Cena (€)</label>
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
            <label>Kapacitet</label>
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

        {/* OPIS */}
        <label>Opis</label>
        <textarea
          name="description"
          placeholder="Unesi opis ture..."
          value={form.description}
          onChange={handleChange}
          style={{ ...inputStyle, height: "100px", resize: "none" }}
        />

        {/* SLIKA URL */}
        <label>Slika (URL link)</label>
        <input
          type="url"
          name="image"
          placeholder="Nalepi link slike..."
          value={form.image}
          onChange={(e) => {
            handleChange(e);
            setImagePreview(e.target.value);
          }}
          style={inputStyle}
        />

        {/* UPLOAD */}
        <label>ili učitaj sa računara</label>
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

        {/* SUBMIT */}
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
          ✅ Sačuvaj turu
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
          ✅ Tura uspešno dodata!
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