import React from "react";
import { Link } from "react-router-dom";

const activities = [
  {
    name: "Hiking",
    image:
      "https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    desc: "Discover hidden trails and breathtaking mountain peaks.",
  },
  {
    name: "Cycling",
    image:
      "https://images.unsplash.com/photo-1631276893368-554b60393efb?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    desc: "Ride through nature and feel the wind as you explore on two wheels.",
  },
  {
    name: "Quad Riding",
    image:
      "https://images.unsplash.com/photo-1701602078164-89eaa64496db?q=80&w=668&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    desc: "Mud, speed and adventure — perfect for adrenaline lovers.",
  },
  {
    name: "Rafting",
    image:
      "https://images.unsplash.com/photo-1642933196504-62107dac9258?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    desc: "Fast water and strong teamwork — an unforgettable experience!",
  },
  {
    name: "Skiing",
    image:
      "https://images.unsplash.com/photo-1582048551464-8b1d42010271?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8c2tpaW5nfGVufDB8fDB8fHww",
    desc: "Winter magic and excitement on snowy slopes.",
  },
  {
    name: "Water Skiing",
    image:
      "https://images.unsplash.com/photo-1601912997028-1caaa82a8114?q=80&w=1171&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    desc: "Glide across the water and feel the freedom under the sun.",
  },
  {
    name: "Paragliding",
    image:
      "https://images.unsplash.com/photo-1500953925139-9d5fe7ba54f2?q=80&w=765&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    desc: "Fly and experience the world from a bird's-eye view — pure freedom!",
  },
  {
    name: "Skydiving",
    image:
      "https://images.unsplash.com/photo-1591007232007-b26dfbbc9a9a?q=80&w=818&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    desc: "Adrenaline to remember for a lifetime. Only for the brave.",
  },
  {
    name: "Bungee Jumping",
    image:
      "https://images.unsplash.com/photo-1559677624-3c956f10d431?q=80&w=1025&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    desc: "A leap of faith — free fall and pure adrenaline in one moment.",
  },
  {
    name: "Diving",
    image:
      "https://images.unsplash.com/photo-1682687982167-d7fb3ed8541d?q=80&w=1171&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    desc: "Dive into the silent world below and discover underwater magic.",
  },
  {
    name: "Camping",
    image:
      "https://images.unsplash.com/photo-1602391833977-358a52198938?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    desc: "Campfire, forest smell and stars above — nature at its finest.",
  },
  {
    name: "Pilgrimage",
    image:
      "https://plus.unsplash.com/premium_photo-1661860546062-1e02de457d74?q=80&w=688&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    desc: "A spiritual journey through nature and silence that brings peace.",
  },
];

function Activities() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #0f172a, #14532d, #16a34a)",
        color: "white",
        padding: "80px 20px",
        textAlign: "center",
        fontFamily: "Poppins, sans-serif",
      }}
    >
      <h1
        style={{
          fontSize: "3rem",
          fontWeight: "bold",
          marginBottom: "15px",
          textShadow: "0 6px 25px rgba(0,0,0,0.6)",
        }}
      >
        🌍 Outdoor Activities
      </h1>

      <p
        style={{
          fontSize: "1.2rem",
          opacity: 0.9,
          marginBottom: "50px",
          maxWidth: "700px",
          margin: "0 auto 50px auto",
        }}
      >
        Choose your adventure and discover a world full of excitement, nature and freedom.  
        From mountains to the ocean — it's all in your hands.
      </p>

      {/* GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "35px",
          maxWidth: "1300px",
          margin: "0 auto",
        }}
      >
        {activities.map((a, index) => (
          <div
            key={index}
            style={{
              position: "relative",
              borderRadius: "22px",
              overflow: "hidden",
              background: "rgba(255,255,255,0.05)",
              backdropFilter: "blur(12px)",
              boxShadow: "0 10px 40px rgba(0,0,0,0.45)",
              transform: "translateY(0px)",
              transition: "all 0.35s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-12px)";
              e.currentTarget.style.boxShadow =
                "0 18px 55px rgba(0,0,0,0.65)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0px)";
              e.currentTarget.style.boxShadow =
                "0 10px 40px rgba(0,0,0,0.45)";
            }}
          >
            <div style={{ position: "relative" }}>
              <img
                src={a.image}
                alt={a.name}
                style={{
                  width: "100%",
                  height: "260px",
                  objectFit: "cover",
                  filter: "brightness(88%)",
                  transition: "0.5s ease",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(180deg, rgba(0,0,0,0) 10%, rgba(0,0,0,0.75) 100%)",
                }}
              />
            </div>

            <div style={{ padding: "22px", textAlign: "left" }}>
              <h2
                style={{
                  fontSize: "1.8rem",
                  fontWeight: "700",
                  marginBottom: "12px",
                  textShadow: "0 3px 10px rgba(0,0,0,0.7)",
                }}
              >
                {a.name}
              </h2>

              <p
                style={{
                  fontSize: "1.05rem",
                  opacity: 0.92,
                  lineHeight: "1.45",
                  marginBottom: "18px",
                }}
              >
                {a.desc}
              </p>

              <Link to={`/tours?activity=${encodeURIComponent(a.name)}`}>
                <button
                  style={{
                    background:
                      "linear-gradient(90deg, #4ade80, #22c55e, #16a34a)",
                    color: "#06290f",
                    fontWeight: "600",
                    padding: "12px 26px",
                    borderRadius: "12px",
                    border: "none",
                    cursor: "pointer",
                    transition: "0.3s ease",
                    boxShadow: "0 5px 15px rgba(0,0,0,0.35)",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = "translateY(-3px)";
                    e.target.style.boxShadow =
                      "0 7px 18px rgba(0,0,0,0.45)";
                    e.target.style.background =
                      "linear-gradient(90deg, #22c55e, #4ade80)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = "translateY(0px)";
                    e.target.style.boxShadow =
                      "0 5px 15px rgba(0,0,0,0.35)";
                    e.target.style.background =
                      "linear-gradient(90deg, #4ade80, #22c55e, #16a34a)";
                  }}
                >
                  View tours
                </button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Activities;