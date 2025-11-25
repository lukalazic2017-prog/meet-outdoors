import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

function Registrations() {
  const [registrations, setRegistrations] = useState([]);

  // Load registrations from localStorage
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("registrations")) || [];
    setRegistrations(saved.reverse()); // newest first
  }, []);

  // Delete single registration
  const deleteRegistration = (index) => {
    const updated = registrations.filter((_, i) => i !== index);
    setRegistrations(updated);
    localStorage.setItem("registrations", JSON.stringify(updated));
  };

  // Delete all registrations
  const clearAll = () => {
    if (window.confirm("Are you sure you want to delete all registrations?")) {
      localStorage.removeItem("registrations");
      setRegistrations([]);
    }
  };

  return (
    <div
      style={{
        background: "linear-gradient(160deg, #14532d, #16a34a)",
        minHeight: "100vh",
        color: "white",
        fontFamily: "Poppins, sans-serif",
        paddingBottom: "40px",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", padding: "40px 20px" }}>
        <h1 style={{ fontSize: "2.2rem", fontWeight: "bold" }}>
          📋 Tour registrations
        </h1>
        <p style={{ opacity: 0.8 }}>
          Here you can see all participants and their details.
        </p>
      </div>

      {/* No registrations */}
      {registrations.length === 0 ? (
        <p style={{ textAlign: "center", opacity: 0.8 }}>
          There are no registered participants yet.
        </p>
      ) : (
        <div
          style={{
            maxWidth: "900px",
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: "15px",
          }}
        >
          {registrations.map((r, index) => (
            <div
              key={index}
              style={{
                backgroundColor: "rgba(255,255,255,0.1)",
                borderRadius: "15px",
                padding: "20px",
                boxShadow: "0 6px 15px rgba(0,0,0,0.3)",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              <h3 style={{ margin: 0, color: "#bbf7d0" }}>
                🌲 {r.tourTitle || "Unknown tour"}
              </h3>
              <p>👤 {r.name}</p>
              <p>📧 {r.email}</p>
              <p>📞 {r.phone}</p>
              <p>🕓 {r.date}</p>

              <button
                onClick={() => deleteRegistration(index)}
                style={{
                  alignSelf: "flex-end",
                  backgroundColor: "#dc2626",
                  border: "none",
                  color: "white",
                  padding: "8px 15px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                🗑 Delete
              </button>
            </div>
          ))}

          <button
            onClick={clearAll}
            style={{
              backgroundColor: "#dc2626",
              border: "none",
              color: "white",
              padding: "12px 20px",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold",
              marginTop: "20px",
            }}
          >
            🧹 Delete all registrations
          </button>
        </div>
      )}

      {/* Back */}
      <div style={{ textAlign: "center", marginTop: "40px" }}>
        <Link
          to="/"
          style={{
            backgroundColor: "#16a34a",
            color: "white",
            padding: "10px 25px",
            borderRadius: "8px",
            fontWeight: "bold",
            textDecoration: "none",
          }}
        >
          ⬅ Back to home
        </Link>
      </div>
    </div>
  );
}

export default Registrations;