// src/pages/Contact.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Contact() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "40px 20px 80px",
        background:
          "radial-gradient(circle at top, #062c22 0%, #02060b 45%, #000000 100%)",
        color: "#ffffff",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        {/* HEADER */}
        <h1
          style={{
            fontSize: 38,
            fontWeight: 900,
            textAlign: "center",
            marginBottom: 12,
            textShadow: "0 0 14px rgba(0,255,180,0.35)",
          }}
        >
          Contact & Support
        </h1>

        <p
          style={{
            fontSize: 16,
            textAlign: "center",
            opacity: 0.7,
            maxWidth: 680,
            margin: "0 auto 40px",
          }}
        >
          We're here to help you with any questions, technical support,
          collaborations or adventure guidelines. Reach out anytime!
        </p>

        {/* EMAIL */}
        <div
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(0,255,160,0.25)",
            borderRadius: 18,
            padding: 24,
            marginBottom: 28,
            boxShadow: "0 14px 40px rgba(0,0,0,0.6)",
          }}
        >
          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              marginBottom: 10,
              color: "#00ffb0",
            }}
          >
            📧 Official Email
          </h2>

          <p
            style={{
              fontSize: 18,
              fontWeight: 600,
              letterSpacing: 0.5,
            }}
          >
            infomeetoutdoors@gmail.com
          </p>
        </div>

        {/* SOCIAL LINKS */}
        <div
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(0,255,160,0.25)",
            borderRadius: 18,
            padding: 24,
            marginBottom: 28,
            boxShadow: "0 14px 40px rgba(0,0,0,0.6)",
          }}
        >
          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              marginBottom: 12,
              color: "#00ffb8",
            }}
          >
            🌍 Follow us
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <a
              href="https://www.instagram.com"
              target="_blank"
              style={socialLink}
            >
              📸 Instagram
            </a>

            <a
              href="https://www.tiktok.com"
              target="_blank"
              style={socialLink}
            >
              🎵 TikTok
            </a>

            <a
              href="https://www.facebook.com"
              target="_blank"
              style={socialLink}
            >
              📘 Facebook
            </a>
          </div>
        </div>

        {/* SUPPORT TOPICS */}
        <div
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(0,255,160,0.25)",
            borderRadius: 18,
            padding: 24,
            marginBottom: 28,
            boxShadow: "0 14px 40px rgba(0,0,0,0.6)",
          }}
        >
          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              marginBottom: 12,
              color: "#00ffc8",
            }}
          >
            💬 Support Topics
          </h2>

          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: 10,
              fontSize: 15,
            }}
          >
            <li>• How to create a tour</li>
            <li>• How to join a tour</li>
            <li>• Payment and fees</li>
            <li>• Cancelation rules</li>
            <li>• Editing your profile</li>
            <li>• Uploading photos & videos</li>
          </ul>
        </div>

        {/* POLICY LINKS */}
        <div
          style={{
            background: "rgba(255,255,255,0.06)",
            borderRadius: 18,
            padding: 24,
            textAlign: "center",
            border: "1px solid rgba(255,255,255,0.15)",
          }}
        >
          <h3
            style={{
              fontSize: 18,
              marginBottom: 14,
              opacity: 0.8,
            }}
          >
            Legal & Information
          </h3>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 30,
              flexWrap: "wrap",
              fontSize: 15,
            }}
          >
            <button
              onClick={() => navigate("/privacy-policy")}
              style={policyButton}
            >
              Privacy Policy
            </button>

            <button
              onClick={() => navigate("/terms-of-service")}
              style={policyButton}
            >
              Terms of Service
            </button>
          </div>
        </div>

        {/* FOOTER */}
        <div
          style={{
            marginTop: 40,
            textAlign: "center",
            opacity: 0.5,
            fontSize: 13,
          }}
        >
          © {new Date().getFullYear()} Meet Outdoors — All rights reserved.
        </div>
      </div>
    </div>
  );
}

const socialLink = {
  fontSize: 16,
  color: "white",
  textDecoration: "none",
  padding: "10px 14px",
  borderRadius: 12,
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.15)",
  display: "inline-block",
  transition: "0.2s",
};

const policyButton = {
  color: "#00ffb0",
  textDecoration: "none",
  fontWeight: 600,
  letterSpacing: 0.5,
  fontSize: 15,
  background: "transparent",
  border: "none",
  cursor: "pointer",
};