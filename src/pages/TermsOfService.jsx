// src/pages/TermsOfService.jsx
import React from "react";

export default function TermsOfService() {
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
          Terms of Service
        </h1>

        <p
          style={{
            textAlign: "center",
            opacity: 0.7,
            fontSize: 16,
            maxWidth: 700,
            margin: "0 auto 40px",
          }}
        >
          These Terms of Service (“Terms”) govern your access to and use of the
          Meet Outdoors platform. By using our services, you agree to follow
          these Terms.
        </p>

        {/* SECTION BOX */}
        <Section
          title="1. Platform Role"
          text={`Meet Outdoors is a technology platform that enables users to publish, discover and book outdoor activities. We do not own, operate or manage activities listed on the platform. Each activity is provided by an independent host who is solely responsible for the service.`}
        />

        <Section
          title="2. User Responsibilities"
          list={[
            "Provide accurate and up-to-date information when creating an account.",
            "Use the platform in a lawful and respectful manner.",
            "Respect other users, local communities and the environment.",
            "Carefully review activity details and assess risks before booking.",
          ]}
        />

        <Section
          title="3. Host Responsibilities"
          list={[
            "Comply with all applicable laws, permits, licenses and insurance requirements.",
            "Provide accurate descriptions of activities and all related costs.",
            "Ensure participant safety to the best of their ability and act professionally at all times.",
          ]}
        />

        <Section
          title="4. Payments and Cancellations"
          text={`Payment terms, fees and cancellation policies (when active) will be clearly displayed during booking. By confirming a booking, you agree to the price, fees and rules shown for the activity.`}
        />

        <Section
          title="5. Liability Disclaimer"
          text={`Meet Outdoors is not liable for any damages, injuries or losses resulting from your use of the platform or participation in any activity. Outdoor activities involve inherent risks, and you participate voluntarily and at your own responsibility.`}
        />

        <Section
          title="6. Account Suspension"
          text={`We may suspend or terminate your account if you violate these Terms, engage in fraudulent or unsafe behavior, or harm other users or the platform."`}
        />

        <Section
          title="7. Changes to These Terms"
          text={`Meet Outdoors may update these Terms at any time. When changes occur, we will update the effective date. Continued use of the platform means you accept the updated Terms."`}
        />

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

/* REUSABLE SECTION COMPONENT */
function Section({ title, text, list }) {
  return (
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
      <h2
        style={{
          color: "#00ffb0",
          marginBottom: 10,
          fontSize: 20,
          fontWeight: 700,
        }}
      >
        {title}
      </h2>

      {text && <p style={{ opacity: 0.9 }}>{text}</p>}

      {list && (
        <ul style={{ paddingLeft: 20, opacity: 0.9 }}>
          {list.map((item, i) => (
            <li key={i} style={{ marginBottom: 6 }}>
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}