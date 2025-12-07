import React, { useState } from "react";

export default function Contact() {
  const [userEmail, setUserEmail] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState("");

  function handleSubmit(e) {
    e.preventDefault();

    if (!userEmail.trim() || !message.trim()) {
      setSuccess("Please fill in all fields.");
      return;
    }

    setSuccess("Your message has been sent! We will get back to you. 🌿");
    setUserEmail("");
    setMessage("");
  }

  // MAIN PAGE BACKGROUND (kao Tours.jsx)
  const pageStyle = {
    background: "radial-gradient(circle at top, #052f22 0%, #010c08 60%, #000000 100%)",
    minHeight: "100vh",
    width: "100%",
    paddingBottom: "60px",
  };

  const heroStyle = {
    width: "100%",
    padding: "80px 20px 60px",
    textAlign: "center",
    color: "white",
  };

  const titleStyle = {
    fontSize: 42,
    fontWeight: 800,
    letterSpacing: "0.03em",
    marginBottom: 10,
  };

  const subtitleStyle = {
    fontSize: 16,
    opacity: 0.7,
    maxWidth: 600,
    margin: "0 auto",
  };

  const containerStyle = {
    maxWidth: 1000,
    margin: "40px auto",
    padding: "0 20px",
  };

  const cardStyle = {
    background: "rgba(0,0,0,0.45)",
    padding: 24,
    borderRadius: 20,
    border: "1px solid rgba(255,255,255,0.08)",
    backdropFilter: "blur(16px)",
    boxShadow: "0 10px 35px rgba(0,0,0,0.6)",
    color: "white",
    marginBottom: 30,
  };

  const emailBoxStyle = {
    fontSize: 22,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: "18px 0",
    borderRadius: 12,
    background: "rgba(0,255,160,0.08)",
    border: "1px solid rgba(0,255,160,0.3)",
    color: "#9fffe1",
  };

  const iconStyle = { fontSize: 28 };

  const formLabel = {
    marginBottom: 6,
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(0,0,0,0.55)",
    color: "white",
    marginBottom: 16,
    fontSize: 15,
  };

  const messageStyle = {
    ...inputStyle,
    minHeight: 120,
    resize: "vertical",
  };

  const submitBtnStyle = {
    width: "100%",
    padding: "14px 18px",
    borderRadius: 999,
    border: "none",
    background:
      "linear-gradient(135deg, #00ffb0 0%, #00cf7c 40%, #02a45d 100%)",
    color: "#02140b",
    fontSize: 16,
    fontWeight: 800,
    cursor: "pointer",
    letterSpacing: "0.05em",
    marginTop: 4,
    boxShadow: "0 12px 35px rgba(0,255,165,0.25)",
  };

  const successStyle = {
    marginTop: 12,
    textAlign: "center",
    color: "#a8ffda",
    fontSize: 14,
  };

  const mapPreview = {
    marginTop: 30,
    height: 260,
    width: "100%",
    borderRadius: 20,
    overflow: "hidden",
    background:
      "url('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=60') center/cover",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 15px 40px rgba(0,0,0,0.6)",
  };

  return (
    <div style={pageStyle}>
      {/* HERO */}
      <div style={heroStyle}>
        <h1 style={titleStyle}>Contact Us</h1>
        <p style={subtitleStyle}>
          Have questions, feedback, or partnership ideas?  
          We would love to hear from you.
        </p>
      </div>

      {/* MAIN CONTENT */}
      <div style={containerStyle}>
        
        {/* EMAIL BOX */}
        <div style={cardStyle}>
          <div style={emailBoxStyle}>
            <span style={iconStyle}>📩</span>
            <span>infomeetoutdoors@gmail.com</span>
          </div>
          <p style={{ textAlign: "center", opacity: 0.7, marginTop: 10 }}>
            Our team usually responds within 24–48 hours.
          </p>
        </div>

        {/* FORM */}
        <div style={cardStyle}>
          <h2 style={{ fontSize: 24, marginBottom: 20, fontWeight: 700 }}>
            Send us a message
          </h2>

          <form onSubmit={handleSubmit}>
            <div style={formLabel}>Your email *</div>
            <input
              type="email"
              placeholder="example@gmail.com"
              style={inputStyle}
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
            />

            <div style={formLabel}>Message *</div>
            <textarea
              placeholder="Write your message here..."
              style={messageStyle}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />

            <button type="submit" style={submitBtnStyle}>
              Send message
            </button>

            {success && <div style={successStyle}>{success}</div>}
          </form>
        </div>

        {/* MAP */}
        <div style={mapPreview} />
      </div>
    </div>
  );
}