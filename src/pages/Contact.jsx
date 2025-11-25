import React from "react";
import { FaEnvelope, FaPhoneAlt, FaMapMarkerAlt, FaPaperPlane } from "react-icons/fa";

function Contact() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #0f172a, #14532d, #16a34a)",
        color: "white",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "60px 20px",
        fontFamily: "Poppins, sans-serif",
      }}
    >
      <div
        style={{
          background: "rgba(255, 255, 255, 0.08)",
          padding: "50px 40px",
          borderRadius: "20px",
          boxShadow: "0 10px 35px rgba(0,0,0,0.4)",
          maxWidth: "600px",
          width: "100%",
          backdropFilter: "blur(10px)",
        }}
      >
        <FaPaperPlane
          style={{
            fontSize: "3rem",
            color: "#4ade80",
            marginBottom: "15px",
          }}
        />

        <h1
          style={{
            fontSize: "2.8rem",
            fontWeight: "bold",
            marginBottom: "20px",
          }}
        >
          Contact Us
        </h1>

        <p
          style={{
            fontSize: "1.1rem",
            opacity: 0.9,
            marginBottom: "40px",
          }}
        >
          Have an idea, a question, or want to plan an adventure together?  
          Send us a message — we always reply!
        </p>

        <div style={{ textAlign: "left" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "15px",
              marginBottom: "20px",
            }}
          >
            <FaEnvelope style={{ fontSize: "1.5rem", color: "#22c55e" }} />
            <p style={{ fontSize: "1.1rem" }}>info@meetoutdoors.com</p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "15px",
              marginBottom: "20px",
            }}
          >
            <FaPhoneAlt style={{ fontSize: "1.5rem", color: "#22c55e" }} />
            <p style={{ fontSize: "1.1rem" }}>+381 62 775 005</p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "15px",
              marginBottom: "20px",
            }}
          >
            <FaMapMarkerAlt style={{ fontSize: "1.5rem", color: "#22c55e" }} />
            <p style={{ fontSize: "1.1rem" }}>Prokuplje, Serbia</p>
          </div>
        </div>

        <div style={{ marginTop: "40px" }}>
          <a
            href="mailto:info@meetoutdoors.com"
            style={{
              textDecoration: "none",
            }}
          >
            <button
              style={{
                background: "linear-gradient(90deg, #22c55e, #4ade80, #16a34a)",
                color: "#06290f",
                fontWeight: "bold",
                border: "none",
                borderRadius: "10px",
                padding: "12px 30px",
                fontSize: "1.1rem",
                cursor: "pointer",
                transition: "0.3s ease",
                boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
              }}
              onMouseEnter={(e) => (e.target.style.background = "#4ade80")}
              onMouseLeave={(e) =>
                (e.target.style.background =
                  "linear-gradient(90deg, #22c55e, #4ade80, #16a34a)")
              }
            >
              Send Message ✉️
            </button>
          </a>
        </div>
      </div>
    </div>
  );
}

export default Contact;