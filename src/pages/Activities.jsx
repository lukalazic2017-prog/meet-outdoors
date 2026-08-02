import React from "react";

const activities = [
  "🥾 Hiking",
  "🏕️ Camping",
  "🚣 Rafting",
  "🚴 Cycling",
  "🏃 Running",
  "🏀 Basketball",
  "🎾 Tennis",
  "🎣 Fishing",
  "🏍️ Quad",
  "🪂 Paragliding",
  "⛷️ Skiing",
  "🚤 Boat Rides",
];

export default function Activities() {
  return (
    <main style={styles.page}>
      <div style={styles.hero}>
        <p style={styles.kicker}>MeetOutdoors</p>

        <h1 style={styles.title}>
          Explore Outdoor Activities
        </h1>

        <p style={styles.subtitle}>
          Discover adventures, sports and outdoor experiences.
        </p>
      </div>

      <div style={styles.grid}>
        {activities.map((activity) => (
          <div key={activity} style={styles.card}>
            {activity}
          </div>
        ))}
      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top left, rgba(95,255,210,.18), transparent 32%), #06120f",
    padding: "40px 20px",
    color: "white",
  },

  hero: {
    maxWidth: 1100,
    margin: "0 auto 40px",
  },

  kicker: {
    color: "#72ffd8",
    fontWeight: 900,
    letterSpacing: ".14em",
    textTransform: "uppercase",
    fontSize: 12,
  },

  title: {
    fontSize: "clamp(40px, 8vw, 80px)",
    margin: "10px 0",
  },

  subtitle: {
    color: "rgba(255,255,255,.7)",
    fontSize: 18,
  },

  grid: {
    maxWidth: 1100,
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
    gap: 18,
  },

  card: {
    padding: "28px",
    borderRadius: 24,
    background: "rgba(255,255,255,.08)",
    border: "1px solid rgba(255,255,255,.12)",
    fontSize: 20,
    fontWeight: 800,
    textAlign: "center",
    transition: "0.2s",
  },
};