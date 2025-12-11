import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function FloatingButtons({ user }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  // Ako user nije ulogovan – ne prikazujemo ništa
  if (!user) return null;

  const baseBtn = {
    padding: "12px 20px",
    borderRadius: 14,
    border: "1px solid rgba(0,255,180,0.35)",
    background: "rgba(0,20,12,0.75)",
    backdropFilter: "blur(12px)",
    color: "#00ffb8",
    fontWeight: 700,
    fontSize: 15,
    cursor: "pointer",
    boxShadow: "0 0 16px rgba(0,255,180,0.25)",
    transition: "all .25s ease",
  };

  return (
    <>
      {/* DESKTOP BUTTONS */}
      <div
        className="floating-desktop"
        style={{
          position: "fixed",
          bottom: 28,
          right: 28,
          display: window.innerWidth > 768 ? "flex" : "none",
          flexDirection: "column",
          gap: 12,
          zIndex: 999,
        }}
      >
        <button
          style={{ ...baseBtn }}
          onClick={() => navigate("/create-tour")}
        >
          + Create Tour
        </button>

        <button
          style={{
            ...baseBtn,
            border: "1px solid rgba(150,120,255,0.4)",
            color: "#cfa3ff",
            boxShadow: "0 0 16px rgba(150,120,255,0.3)",
          }}
          onClick={() => navigate("/create-event")}
        >
          ✦ Create Event
        </button>
      </div>

      {/* MOBILE FLOATING BUTTON */}
      <div
        className="floating-mobile"
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          display: window.innerWidth <= 768 ? "flex" : "none",
          zIndex: 999,
        }}
      >
        {/* Blur background menu */}
        {open && (
          <div
            onClick={() => setOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.45)",
              backdropFilter: "blur(8px)",
              zIndex: 998,
            }}
          />
        )}

        {/* Menu bubble */}
        {open && (
          <div
            style={{
              position: "absolute",
              bottom: 70,
              right: 0,
              display: "flex",
              flexDirection: "column",
              gap: 12,
              zIndex: 999,
              animation: "popIn .3s ease",
            }}
          >
            <button
              style={{
                ...baseBtn,
                width: 160,
                textAlign: "center",
              }}
              onClick={() => {
                setOpen(false);
                navigate("/create-tour");
              }}
            >
              + Create Tour
            </button>

            <button
              style={{
                ...baseBtn,
                width: 160,
                textAlign: "center",
                border: "1px solid rgba(150,120,255,0.4)",
                color: "#cfa3ff",
                boxShadow: "0 0 16px rgba(150,120,255,0.3)",
              }}
              onClick={() => {
                setOpen(false);
                navigate("/create-event");
              }}
            >
              ✦ Create Event
            </button>
          </div>
        )}

        {/* + BUTTON */}
        <button
          onClick={() => setOpen((p) => !p)}
          style={{
            width: 62,
            height: 62,
            borderRadius: "50%",
            border: "1px solid rgba(0,255,180,0.45)",
            background:
              "radial-gradient(circle at 30% 20%, #00ffb8 0%, #007a52 60%, #00281d 100%)",
            color: "white",
            fontSize: 34,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 0 22px rgba(0,255,180,0.55)",
            zIndex: 999,
          }}
        >
          {open ? "×" : "+"}
        </button>
      </div>

      {/* KEYFRAME ANIMATION */}
      <style>{`
        @keyframes popIn {
          0% { transform: translateY(20px) scale(0.8); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
      `}</style>
    </>
  );
}