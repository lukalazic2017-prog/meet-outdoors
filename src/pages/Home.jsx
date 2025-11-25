import React from "react";
import { Link } from "react-router-dom";

function Home() {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundImage:
          "url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        overflow: "hidden",
      }}
    >
      {/* Dark overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.8) 100%)",
          zIndex: 0,
        }}
      />

      {/* Main content */}
      <div
        style={{
          zIndex: 2,
          maxWidth: "800px",
          padding: "40px 20px",
          animation: "fadeIn 1.5s ease-in-out",
        }}
      >
        <h1
          style={{
            fontSize: "3.5rem",
            fontWeight: "800",
            color: "#ffffff",
            textShadow: "0 4px 25px rgba(0,0,0,0.6)",
            letterSpacing: "1px",
            marginBottom: "20px",
          }}
        >
          🌄 Welcome to{" "}
          <span
            style={{
              background:
                "linear-gradient(90deg, #4ade80, #22c55e, #86efac)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Meet Outdoors
          </span>
        </h1>

        <p
          style={{
            fontSize: "1.3rem",
            color: "rgba(255,255,255,0.9)",
            marginBottom: "45px",
            lineHeight: "1.8",
          }}
        >
          Adventures. Freedom. Nature.
          <br />
          Discover hiking, rafting, camping and more —
          through experiences that inspire.
        </p>

        {/* Buttons */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "25px",
            flexWrap: "wrap",
          }}
        >
          <Link to="/activities">
            <button
              style={{
                padding: "14px 32px",
                borderRadius: "50px",
                background: "rgba(255,255,255,0.15)",
                border: "1.5px solid rgba(255,255,255,0.4)",
                color: "#fff",
                fontSize: "1.05rem",
                fontWeight: "600",
                letterSpacing: "0.5px",
                backdropFilter: "blur(10px)",
                boxShadow: "0 8px 25px rgba(0,0,0,0.3)",
                transition: "all 0.35s ease",
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "rgba(74,222,128,0.4)";
                e.target.style.transform = "scale(1.08)";
                e.target.style.boxShadow = "0 0 25px #4ade80";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "rgba(255,255,255,0.15)";
                e.target.style.transform = "scale(1)";
                e.target.style.boxShadow = "0 8px 25px rgba(0,0,0,0.3)";
              }}
            >
              🌿 View Activities
            </button>
          </Link>

          <Link to="/tours">
            <button
              style={{
                padding: "14px 32px",
                borderRadius: "50px",
                background: "linear-gradient(90deg, #22c55e, #4ade80)",
                color: "#0b2816",
                fontSize: "1.05rem",
                fontWeight: "700",
                letterSpacing: "0.5px",
                boxShadow: "0 8px 25px rgba(0,0,0,0.3)",
                transition: "all 0.35s ease",
              }}
              onMouseEnter={(e) => {
                e.target.style.background =
                  "linear-gradient(90deg, #4ade80, #86efac)";
                e.target.style.transform = "scale(1.08)";
                e.target.style.boxShadow = "0 0 25px #4ade80";
              }}
              onMouseLeave={(e) => {
                e.target.style.background =
                  "linear-gradient(90deg, #22c55e, #4ade80)";
                e.target.style.transform = "scale(1)";
                e.target.style.boxShadow = "0 8px 25px rgba(0,0,0,0.3)";
              }}
            >
              🏕️ Browse Tours
            </button>
          </Link>
        </div>
      </div>

      {/* Mist bottom effect */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          width: "100%",
          height: "120px",
          background:
            "linear-gradient(0deg, rgba(0,0,0,0.8), transparent)",
          zIndex: 1,
        }}
      />
    </div>
  );
}

export default Home;