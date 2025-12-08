// src/pages/PrivacyPolicy.jsx
import React from "react";

export default function PrivacyPolicy() {
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
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <h1
          style={{
            fontSize: 38,
            fontWeight: 900,
            textAlign: "center",
            marginBottom: 16,
            textShadow: "0 0 14px rgba(0,255,180,0.35)",
          }}
        >
          Privacy Policy
        </h1>

        <p
          style={{
            textAlign: "center",
            opacity: 0.75,
            fontSize: 16,
            maxWidth: 720,
            margin: "0 auto 40px",
          }}
        >
          This Privacy Policy explains how we collect, use and protect your
          data while using the Meet Outdoors platform.
        </p>

        <div
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(0,255,160,0.25)",
            padding: 24,
            borderRadius: 18,
            marginBottom: 26,
            boxShadow: "0 14px 40px rgba(0,0,0,0.6)",
            fontSize: 15,
            lineHeight: 1.6,
          }}
        >
          <h2 style={{ color: "#00ffb0", marginBottom: 10 }}>
            1. Information We Collect
          </h2>
          <p>
            We collect basic account information such as your email, profile
            details, posts, and activities you engage with on the platform.
            Additional information may be collected for improving platform
            features and ensuring user safety.
          </p>
        </div>

        <div
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(0,255,160,0.25)",
            padding: 24,
            borderRadius: 18,
            marginBottom: 26,
            boxShadow: "0 14px 40px rgba(0,0,0,0.6)",
            fontSize: 15,
            lineHeight: 1.6,
          }}
        >
          <h2 style={{ color: "#00ffc8", marginBottom: 10 }}>
            2. How Your Data Is Used
          </h2>
          <p>
            We use your information to create a personalized adventure
            experience, connect users with similar interests, and provide safe
            interactions across tours, chat and the platform.
          </p>
        </div>

        <div
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(0,255,160,0.25)",
            padding: 24,
            borderRadius: 18,
            marginBottom: 26,
            boxShadow: "0 14px 40px rgba(0,0,0,0.6)",
            fontSize: 15,
            lineHeight: 1.6,
          }}
        >
          <h2 style={{ color: "#00ffd0", marginBottom: 10 }}>
            3. Data Protection
          </h2>
          <p>
            We take strong measures to protect your information. All sensitive
            data is stored using secure technologies and is never sold or shared
            with third parties without permission.
          </p>
        </div>

        <div
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(0,255,160,0.25)",
            padding: 24,
            borderRadius: 18,
            marginBottom: 26,
            boxShadow: "0 14px 40px rgba(0,0,0,0.6)",
            fontSize: 15,
            lineHeight: 1.6,
          }}
        >
          <h2 style={{ color: "#00ffe0", marginBottom: 10 }}>4. Your Rights</h2>
          <p>
            You may request data deletion, export of your information, or
            correction of incorrect details at any time through your Meet
            Outdoors profile settings.
          </p>
        </div>

        <div
          style={{
            textAlign: "center",
            marginTop: 40,
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