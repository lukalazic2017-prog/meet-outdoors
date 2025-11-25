import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function TourDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tour, setTour] = useState(null);

  useEffect(() => {
    const allTours = JSON.parse(localStorage.getItem("tours")) || [];
    const found = allTours.find(
      (t) => String(t.id) === String(id) || t.name === id
    );
    setTour(found);
  }, [id]);

  if (!tour) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontFamily: "Poppins, sans-serif",
          fontSize: "1.5rem",
          background: "linear-gradient(160deg, #14532d, #166534)",
        }}
      >
        Loading tour details...
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        fontFamily: "Poppins, sans-serif",
        color: "white",
        background: "linear-gradient(160deg, #0f172a, #14532d)",
      }}
    >
      {/* HERO SECTION */}
      <div
        style={{
          height: "60vh",
          backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url(${tour.image})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: "3rem", fontWeight: "700", marginBottom: "10px" }}>
          {tour.name}
        </h1>
        <p style={{ fontSize: "1.2rem", opacity: 0.9 }}>{tour.location}</p>
        <p style={{ opacity: 0.8 }}>{tour.date}</p>
      </div>

      {/* DETAILS */}
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "40px 20px",
          lineHeight: 1.6,
        }}
      >
        <h2 style={{ fontSize: "2rem", marginBottom: "20px" }}>Tour Description</h2>
        <p style={{ opacity: 0.9, fontSize: "1.1rem", marginBottom: "30px" }}>
          {tour.description || "This tour has no additional description."}
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "15px",
            marginBottom: "40px",
          }}
        >
          <div>
            <strong>📍 Location:</strong>
            <p>{tour.location}</p>
          </div>
          <div>
            <strong>📅 Date:</strong>
            <p>{tour.date}</p>
          </div>

          <div>
            <strong>🕒 Time:</strong>
            <p>
              {tour.startTime} - {tour.endTime}
            </p>
          </div>

          <div>
            <strong>💰 Price:</strong>
            <p>{tour.price} €</p>
          </div>

          <div>
            <strong>👥 Capacity:</strong>
            <p>{tour.capacity} people</p>
          </div>
        </div>

        <button
          onClick={() => navigate(-1)}
          style={{
            background: "linear-gradient(135deg, #22c55e, #15803d)",
            border: "none",
            color: "white",
            fontSize: "1rem",
            padding: "12px 25px",
            borderRadius: "10px",
            cursor: "pointer",
            transition: "transform 0.2s ease",
          }}
          onMouseOver={(e) => (e.target.style.transform = "scale(1.05)")}
          onMouseOut={(e) => (e.target.style.transform = "scale(1.0)")}
        >
          ⬅ Back to Tours
        </button>
      </div>
    </div>
  );
}