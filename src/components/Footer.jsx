// src/components/Footer.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function Footer({ user, avatarUrl, unreadCount, logout }) {
  return (
    <footer
      style={{
        marginTop: 0,
        padding: "40px 20px 24px",
        background:
          "radial-gradient(circle at top, rgba(0,40,24,0.95), rgba(0,0,0,1))",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        color: "rgba(235,255,245,0.9)",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* MAIN FOOTER CONTENT */}
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          gap: 32,
        }}
      >
        {/* Left block */}
        <div style={{ maxWidth: 340 }}>
          <div
            style={{
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            Meet
            <span style={{ color: "#00ffb0" }}>Outdoors</span>
          </div>
          <div
            style={{
              fontSize: 13,
              color: "rgba(240,255,245,0.8)",
              lineHeight: 1.6,
            }}
          >
            A platform for people who prefer cold air at 1,800m, wet
            shoes by the river and real conversations around a campfire
            over endless scrolling at home.
          </div>
        </div>

        {/* Community */}
        <div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              marginBottom: 10,
              color: "#00ffb0",
            }}
          >
            Community
          </div>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, fontSize: 13 }}>
            <li style={{ marginBottom: 6 }}>
              <Link
                to="/activities"
                style={{ color: "inherit", textDecoration: "none" }}
              >
                Activities
              </Link>
            </li>
            <li style={{ marginBottom: 6 }}>
              <Link
                to="/tours"
                style={{ color: "inherit", textDecoration: "none" }}
              >
                Explore Tours
              </Link>
            </li>
            <li style={{ marginBottom: 6 }}>
              <Link
                to="/create-tour"
                style={{ color: "inherit", textDecoration: "none" }}
              >
                Become a Host
              </Link>
            </li>
            <li style={{ marginBottom: 6 }}>
              <Link
                to="/profiles"
                style={{ color: "inherit", textDecoration: "none" }}
              >
                User Profiles
              </Link>
            </li>
            <li style={{ marginBottom: 6 }}>
              <Link
                to="/safety-tips"
                style={{ color: "inherit", textDecoration: "none" }}
              >
                Safety Tips
              </Link>
            </li>
            <li>
              <Link
                to="/host-guidelines"
                style={{ color: "inherit", textDecoration: "none" }}
              >
                Host Guidelines
              </Link>
            </li>
          </ul>
        </div>

        {/* Company */}
        <div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              marginBottom: 10,
              color: "#00ffb0",
            }}
          >
            Company
          </div>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, fontSize: 13 }}>
            <li style={{ marginBottom: 6 }}>
              <Link
                to="/contact"
                style={{ color: "inherit", textDecoration: "none" }}
              >
                Contact
              </Link>
            </li>
            <li style={{ marginBottom: 6 }}>
              <Link
                to="/about"
                style={{ color: "inherit", textDecoration: "none" }}
              >
                About Us
              </Link>
            </li>
            <li style={{ marginBottom: 6 }}>
              <Link
                to="/privacy-policy"
                style={{ color: "inherit", textDecoration: "none" }}
              >
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link
                to="/terms-of-service"
                style={{ color: "inherit", textDecoration: "none" }}
              >
                Terms of Service
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* USER BAR SECTION */}
      {user && (
        <div
          style={{
            marginTop: 40,
            marginBottom: 30,
            width: "100%",
            padding: "20px 0",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 30,
              padding: "10px 25px",
              borderRadius: 20,
              background:
                "linear-gradient(180deg, rgba(0,30,18,0.4), rgba(0,0,0,0.5))",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 0 18px rgba(0,255,160,0.08)",
            }}
          >
            {/* 🔔 Notifications */}
            <div
              style={{
                position: "relative",
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.18)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontSize: 22,
                color: "white",
              }}
            >
              🔔

              {unreadCount > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: -3,
                    right: -3,
                    background: "#ff3030",
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    color: "white",
                    boxShadow: "0 0 6px red",
                  }}
                >
                  {unreadCount}
                </div>
              )}
            </div>

            {/* 🧍 AVATAR */}
            <div
              style={{
                width: 58,
                height: 58,
                borderRadius: "50%",
                border: "2px solid #00ffb0",
                overflow: "hidden",
                boxShadow: "0 0 14px rgba(0,255,160,0.45)",
                cursor: "pointer",
              }}
            >
              <img
                src={avatarUrl || "https://i.pravatar.cc/300"}
                alt="avatar"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </div>

            {/* 🔴 LOGOUT */}
            <button
              onClick={logout}
              style={{
                padding: "10px 20px",
                borderRadius: 14,
                border: "1px solid rgba(255,60,60,0.5)",
                background: "rgba(255,40,40,0.15)",
                color: "#ff7070",
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
                boxShadow: "0 0 14px rgba(255,80,80,0.35)",
              }}
            >
              Logout
            </button>
          </div>
        </div>
      )}

      {/* bottom line */}
      <div
        style={{
          maxWidth: 1100,
          margin: "24px auto 0",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          paddingTop: 10,
          fontSize: 12,
          color: "rgba(210,230,220,0.75)",
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <span>
          © {new Date().getFullYear()} MeetOutdoors. All rights reserved.
        </span>
        <span style={{ opacity: 0.85 }}>
          Made for explorers. Not for endless scrolling.
        </span>
      </div>
    </footer>
  );
}